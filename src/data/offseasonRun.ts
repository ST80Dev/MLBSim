import type { Batter, Pitcher, Team } from '../engine/types';
import { advanceSeasonBatter, advanceSeasonPitcher } from '../engine/aging';
import { makeRng } from '../engine/rng';
import { runInverseDraft, DEFAULT_DRAFT_ROUNDS } from './draft';
import {
  startOffseason, runOffseasonMarket, finalizeOffseason,
  type FreeAgent, type Txn,
} from './offseason';
import { GENERATED_MODE, type LeagueMode } from './leagueMode';
import type { WLRecord } from './season';

// ---------------------------------------------------------------------------
// runOffseason (Fase 5A, step 6) — l'ORCHESTRATORE del rollover di franchigia.
//
// Cuce la sequenza dell'off-season (docs/franchise.md § Riconciliazione):
//   1. Aging + ri-derivo stipendi (i payroll si spostano).
//   2. Ritiri → i ritirati LASCIANO la lega (buchi + monte liberato).
//   3. Draft inverso → prospetti giovani nella DEPTH (la peggiore sceglie prima).
//   4. Mercato FA a blocchi (rilasci/firme intrecciati AI + riallineamento AI↔AI).
//   5. Finalize → ricomposizione lineup/rotazione + taglia a 20/15 ("decidi gli X").
//
// Puro e deterministico (aging seedato da (seed, anno); mercato/draft senza RNG).
// La META' "stagione→scorsa→carriera" del rollover resta di Fase 4; qui vive la
// meta' FRANCHIGIA. Il segnale d'impiego `perf` (default 0 = neutro) e' la cucitura
// verso l'aging use-it-or-lose-it quando la Fase 4 lo fornira'.
// ---------------------------------------------------------------------------

export interface OffseasonOptions {
  /** Squadra gestita: le AI la saltano nel mercato (l'utente agisce con le primitive). */
  managedId?: string;
  /** Politica di cap (default lega generata; storico → cap off). */
  mode?: LeagueMode;
  /** Free agent gia' nel pool all'apertura (import storico: fuori-rosa reali). */
  initialPool?: FreeAgent[];
  /** Giri di draft (default DEFAULT_DRAFT_ROUNDS). */
  draftRounds?: number;
  /**
   * Segnale d'impiego per l'aging use-it-or-lose-it (Fase 4). `perf(id) > 0` alza
   * il tetto del giovane molto impiegato, `< 0` lo abbassa. Default: 0 (neutro).
   */
  perf?: (playerId: string) => number;
}

export interface OffseasonSummary {
  /** Le 30 squadre ricomposte e giocabili per la stagione successiva. */
  teams: Team[];
  /** Giocatori ritirati quest'off-season (usciti dalla lega). */
  retired: Array<Batter | Pitcher>;
  /** Pick del draft (round, squadra, prospetto). */
  draftPicks: Array<{ round: number; teamId: string; playerId: string }>;
  /** Log del mercato (rilasci/firme/trade), per il riepilogo/UI. */
  log: Txn[];
  year: number;
}

/** Fa avanzare di una stagione i giocatori di una squadra e rimuove i ritirati.
 *  NON muta l'input (clona i giocatori prima dell'aging). */
function ageAndRetire(
  team: Team,
  rng: Parameters<typeof advanceSeasonBatter>[1],
  perf: (id: string) => number,
): { team: Team; retired: Array<Batter | Pitcher> } {
  const retired: Array<Batter | Pitcher> = [];
  const ageBats = (arr: Batter[]): Batter[] =>
    arr
      .map((b) => advanceSeasonBatter({ ...b }, rng, perf(b.id)))
      .filter((b) => (b.retired ? (retired.push(b), false) : true));
  const agePits = (arr: Pitcher[]): Pitcher[] =>
    arr
      .map((p) => advanceSeasonPitcher({ ...p }, rng, perf(p.id)))
      .filter((p) => (p.retired ? (retired.push(p), false) : true));
  // Ordine FISSO di consumo RNG (determinismo).
  const next: Team = {
    ...team,
    lineup: ageBats(team.lineup),
    bench: ageBats(team.bench),
    reserveBatters: ageBats(team.reserveBatters),
    rotation: agePits(team.rotation),
    bullpen: agePits(team.bullpen),
    reservePitchers: agePits(team.reservePitchers),
  };
  return { team: next, retired };
}

/**
 * Esegue l'off-season completo su tutta la lega e ritorna le squadre pronte per
 * la stagione successiva + il riepilogo (ritiri, draft, mercato).
 *
 * @param teams     lega corrente (non mutata)
 * @param seed      seed della lega (per cap ε e generazione classe draft)
 * @param year      anno che si sta CHIUDENDO (il nuovo anno e' year+1)
 * @param standings record W-L per l'ordine inverso del draft (0-0 se assente)
 */
export function runOffseason(
  teams: Team[],
  seed: number,
  year: number,
  standings: Record<string, WLRecord>,
  opts: OffseasonOptions = {},
): OffseasonSummary {
  const mode = opts.mode ?? GENERATED_MODE;
  const perf = opts.perf ?? (() => 0);
  const rounds = opts.draftRounds ?? DEFAULT_DRAFT_ROUNDS;
  const nextYear = year + 1;

  // 1-2) Aging + ritiri (seed deterministico per anno).
  const ageRng = makeRng((seed ^ Math.imul(nextYear, 0x9e3779b1)) >>> 0);
  const retired: Array<Batter | Pitcher> = [];
  const aged = teams.map((t) => {
    const r = ageAndRetire(t, ageRng, perf);
    retired.push(...r.retired);
    return r.team;
  });

  // 3) Draft inverso → prospetti nella depth (seed variato per anno).
  const { teams: drafted, picks } = runInverseDraft(
    aged, standings, (seed ^ Math.imul(nextYear, 0x85ebca6b)) >>> 0, rounds,
  );

  // 4) Mercato FA a blocchi (rilasci/firme intrecciati + riallineamento AI↔AI).
  const market = runOffseasonMarket(
    startOffseason(drafted, seed, nextYear, opts.managedId, mode, opts.initialPool ?? []),
  );

  // 5) Finalize → ricomposizione + taglia a 20/15.
  const finalTeams = finalizeOffseason(market, drafted);

  return { teams: finalTeams, retired, draftPicks: picks, log: market.log, year: nextYear };
}
