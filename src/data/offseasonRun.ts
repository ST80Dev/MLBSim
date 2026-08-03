import type { Batter, Pitcher, Team } from '../engine/types';
import { makeRng } from '../engine/rng';
import { advanceSeasonBatter, advanceSeasonPitcher } from '../engine/aging';
import type { WLRecord } from './season';
import { runInverseDraft } from './draft';
import type { DebutName } from './historical/debutants';
import { assembleTeam } from './generator';
import { GENERATED_MODE, type LeagueMode } from './leagueMode';
import {
  startOffseason,
  runOffseasonMarket,
  type OffseasonState,
  type Txn,
} from './offseason';

// ---------------------------------------------------------------------------
// ORCHESTRATORE DELL'OFF-SEASON (Fase 5A, step 6).
//
// Cuce i mattoni 1-5 nella "meta franchigia" del rollover di stagione, nell'ordine
// bancato in docs/franchise.md § Riconciliazione del cap:
//
//   FASE UNA-TANTUM              →  MERCATO A BLOCCHI            →  FINALIZE
//   aging + ri-deriva stipendi      rilasci/firme intrecciati       ricomposizione
//   ritiri (buchi + monte)          (AI + pool reattivo) +          lineup/rotazione
//   draft inverso → depth           riallineamento AI↔AI            dai set piatti
//
// Puro e deterministico (RNG seedato da (seed, teamId, year)); `perf` di default 0
// (seam neutro di Fase 4: quando l'impiego alimentera' l'aging si passera' la linea
// reale/proiettata). Non muta la lega in ingresso (clona ogni giocatore che tocca).
// ---------------------------------------------------------------------------

type Player = Batter | Pitcher;

export interface OffseasonOptions {
  /** Squadra gestita: le AI la SALTANO nel mercato (l'utente agira' con le primitive). */
  managedId?: string;
  /** Politica di cap (default lega generata: cap soft + muro). */
  mode?: LeagueMode;
  /** Segnale rendimento/utilizzo per l'aging (default 0 = neutro, seam di Fase 4). */
  perf?: number;
  /** Modalità STORICA: nomi reali dei debuttanti dell'annata d'ingresso per il draft
   *  (rating comunque ciechi — nessuna preveggenza). Assente → nomi fittizi. */
  realDraftNames?: DebutName[];
}

export interface OffseasonSummary {
  /** Le 30 squadre dell'anno SUCCESSIVO, gia' ricomposte e schierabili. */
  teams: Team[];
  /** Chi si e' ritirato in questa off-season (gia' fuori dalle rose). */
  retired: Player[];
  /** Scelte del draft inverso (round, squadra, prospetto). */
  draftPicks: Array<{ round: number; teamId: string; playerId: string }>;
  /** Movimenti di mercato (rilasci/firme/riallineamenti). */
  log: Txn[];
  /** Anno appena concluso (quello elaborato). */
  year: number;
}

/** Deriva un RNG stabile per (seed, teamId, anno): stream d'aging per-squadra. */
function teamRng(seed: number, teamId: string, year: number) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < teamId.length; i++) {
    h ^= teamId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return makeRng((seed ^ h ^ Math.imul(year + 1, 2654435761)) >>> 0);
}

/**
 * Fa avanzare di UNA stagione tutti i giocatori di ogni squadra (aging: doti,
 * stipendi, ritiri) e RIMUOVE i ritirati dalle rose. Non muta l'input: clona ogni
 * giocatore prima di invecchiarlo. Ritorna le squadre con i buchi dei ritiri +
 * l'elenco dei ritirati.
 */
export function ageAndRetire(
  teams: Team[],
  seed: number,
  year: number,
  perf = 0,
): { teams: Team[]; retired: Player[] } {
  const retired: Player[] = [];
  const out = teams.map((t) => {
    const rng = teamRng(seed, t.id, year);
    const ageBat = (b: Batter): Batter => advanceSeasonBatter(structuredClone(b), rng, perf);
    const agePit = (p: Pitcher): Pitcher => advanceSeasonPitcher(structuredClone(p), rng, perf);
    const keepBat = (arr: Batter[]): Batter[] =>
      arr.map(ageBat).filter((b) => (b.retired ? (retired.push(b), false) : true));
    const keepPit = (arr: Pitcher[]): Pitcher[] =>
      arr.map(agePit).filter((p) => (p.retired ? (retired.push(p), false) : true));
    return {
      ...t,
      lineup: keepBat(t.lineup),
      bench: keepBat(t.bench),
      reserveBatters: keepBat(t.reserveBatters),
      rotation: keepPit(t.rotation),
      bullpen: keepPit(t.bullpen),
      reservePitchers: keepPit(t.reservePitchers),
    };
  });
  return { teams: out, retired };
}

/**
 * FINALIZE: ricompone ogni rosa piatta dell'off-season in una squadra schierabile
 * (lineup/panca/rotazione/bullpen/depth), completando a taglia coi replacement se
 * serve (via `assembleTeam`). `baseTeams` da' i metadati (ordine e identita').
 */
export function finalizeOffseason(state: OffseasonState, baseTeams: Team[], seed: number): Team[] {
  return baseTeams.map((base) => {
    const set = state.rosters[base.id] ?? { batters: [], pitchers: [] };
    return assembleTeam(base, set.batters, set.pitchers, teamRng(seed, base.id, state.year + 900));
  });
}

/**
 * Orchestratore completo: aging+ritiri → draft inverso → mercato a blocchi
 * (automatico) → finalize. Ritorna il riepilogo con la lega dell'anno successivo.
 * `standings`: record teamId → W-L della stagione conclusa (guida l'ordine di draft).
 */
export function runOffseason(
  teams: Team[],
  seed: number,
  year: number,
  standings: Record<string, WLRecord>,
  opts: OffseasonOptions = {},
): OffseasonSummary {
  const { managedId, mode = GENERATED_MODE, perf = 0, realDraftNames } = opts;

  // 1. Fase una-tantum: aging+ritiri, poi draft inverso (prospetti nella depth).
  //    In modalità storica i prospetti prendono i NOMI reali dei debuttanti
  //    dell'annata d'ingresso (rating ciechi); altrimenti nomi fittizi.
  const { teams: aged, retired } = ageAndRetire(teams, seed, year, perf);
  const drafted = runInverseDraft(aged, standings, seed, undefined, realDraftNames);

  // 2. Mercato a blocchi (rilasci/firme intrecciati + riallineamento AI↔AI), automatico.
  const opened = startOffseason(drafted.teams, seed, year, managedId, mode);
  const closed = runOffseasonMarket(opened);

  // 3. Finalize: ricomposizione delle rose piatte in squadre schierabili.
  const finalTeams = finalizeOffseason(closed, drafted.teams, seed);

  return {
    teams: finalTeams,
    retired,
    draftPicks: drafted.picks,
    log: closed.log,
    year,
  };
}
