import type { Team } from '../engine/types';
import type { GameResult } from '../engine/game';
import { createLiveGame, quickSim, toGameResult } from '../engine/game';
import { withRotationStarter } from './generator';
import { byDivision, type LeagueId } from './league';
import {
  accumulateInto,
  emptyBat,
  emptyPit,
  recordOf,
  winPct,
  type SeasonBat,
  type SeasonPit,
  type WLRecord,
  type SeasonState,
} from './season';
import {
  createRotation,
  recordStart,
  type RotationSize,
  type RotationState,
} from './rotation';

// POSTSEASON giocabile (Fase 4). Formato moderno a 12 squadre (6 teste per lega):
// 3 campioni division + 3 wild card. Wild Card bo3 (teste 1-2 in bye) -> Division
// Series bo5 -> Championship bo7 -> World Series bo7.
//
// L'utente gioca partita-per-partita SOLO le serie della propria squadra; tutte
// le altre serie sono QUICK-SIMULATE (come il resto della lega in regular season,
// vedi `data/season.ts`). Puro e testabile: nessuna dipendenza da UI o rete; usa
// il motore (`quickSim`) e la stessa rotazione partenti della stagione.

export type Round = 'WC' | 'DS' | 'LCS' | 'WS';

/** Da dove arriva un partecipante a una serie: una testa di serie o la vincente
 *  di un'altra serie. */
export type Feeder = { seed: number; league: LeagueId } | { winnerOf: string };

/** Una gara giocata (o simulata) dentro una serie. */
export interface PlayoffGame {
  gameNo: number; // 0-based dentro la serie
  homeId: string;
  awayId: string;
  winnerId: string;
  homeScore: number;
  awayScore: number;
}

/** Una serie al meglio di N. `highId` è la testa di serie più alta (ospita per
 *  primo, secondo il pattern di `hostsHigh`). Partecipanti risolti dai `feeder`. */
export interface Series {
  id: string;
  round: Round;
  league?: LeagueId; // assente per la World Series (interlega)
  bestOf: number;
  aFrom: Feeder;
  bFrom: Feeder;
  highId?: string;
  lowId?: string;
  highWins: number;
  lowWins: number;
  games: PlayoffGame[];
  winnerId?: string;
}

export interface PlayoffState {
  year: number;
  /** seeds[lega][0] = testa di serie 1 … [5] = testa 6. */
  seeds: Record<LeagueId, string[]>;
  /** Record finali di regular season (per fattore campo/ tiebreak interlega). */
  records: Record<string, WLRecord>;
  series: Record<string, Series>;
  managedId: string;
  /** Rotazione della squadra gestita nei playoff (fresca all'avvio). */
  rotation: RotationState;
  /** Numero di gare di playoff GIOCATE dalla gestita (indice riposo rotazione). */
  managedGames: number;
  /** Stat reali di playoff della squadra gestita (bucket separato). */
  bat: Record<string, SeasonBat>;
  pit: Record<string, SeasonPit>;
  championId?: string;
}

const LEAGUES: LeagueId[] = ['AL', 'NL'];

/** Ordine fisso di risoluzione/creazione delle serie. */
function seriesOrder(): string[] {
  const out: string[] = [];
  for (const L of LEAGUES) out.push(`${L}-WC-A`, `${L}-WC-B`);
  for (const L of LEAGUES) out.push(`${L}-DS-1`, `${L}-DS-2`);
  for (const L of LEAGUES) out.push(`${L}-LCS`);
  out.push('WS');
  return out;
}

/** Vittorie necessarie per chiudere una serie al meglio di `bestOf`. */
export function winsNeeded(bestOf: number): number {
  return Math.ceil(bestOf / 2);
}

/** Pattern di casa per la testa di serie alta: bo3 tutte in casa, bo5 2-2-1,
 *  bo7 2-3-2. `true` = ospita la testa alta in quella gara. */
const HOST: Record<number, boolean[]> = {
  3: [true, true, true],
  5: [true, true, false, false, true],
  7: [true, true, false, false, false, true, true],
};
export function hostsHigh(bestOf: number, gameNo: number): boolean {
  return HOST[bestOf][gameNo] ?? true;
}

/** Hash FNV-1a per seed di gara deterministici. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Seed deterministico di una gara: base ⊕ hash(anno|serie|gara). */
function gameSeed(base: number, year: number, seriesId: string, gameNo: number): number {
  return (base ^ hashStr(`${year}|${seriesId}|${gameNo}`)) >>> 0;
}

/** Comparatore per record (winPct desc, vittorie desc, hash id asc — tiebreak
 *  deterministico: non tracciamo scontri diretti). */
function cmpRecord(records: Record<string, WLRecord>) {
  return (a: string, b: string): number => {
    const ra = records[a] ?? { w: 0, l: 0 };
    const rb = records[b] ?? { w: 0, l: 0 };
    return winPct(rb) - winPct(ra) || rb.w - ra.w || hashStr(a) - hashStr(b);
  };
}

/** Numero di testa di serie (1-6) di una squadra nella sua lega, o Infinity. */
function seedNum(ps: PlayoffState, teamId: string): number {
  for (const L of LEAGUES) {
    const i = ps.seeds[L].indexOf(teamId);
    if (i >= 0) return i + 1;
  }
  return Infinity;
}
function seedLeague(ps: PlayoffState, teamId: string): LeagueId | null {
  for (const L of LEAGUES) if (ps.seeds[L].includes(teamId)) return L;
  return null;
}

/** Ordina due partecipanti in [alta, bassa]: stessa lega → testa di serie più
 *  alta; interlega (WS) → miglior record di regular season. */
function orderHighLow(ps: PlayoffState, a: string, b: string): [string, string] {
  const la = seedLeague(ps, a);
  const lb = seedLeague(ps, b);
  if (la && lb && la === lb) return seedNum(ps, a) <= seedNum(ps, b) ? [a, b] : [b, a];
  return cmpRecord(ps.records)(a, b) <= 0 ? [a, b] : [b, a];
}

/** Risolve un feeder in un id squadra, se disponibile. */
function resolveFeeder(ps: PlayoffState, f: Feeder): string | undefined {
  if ('seed' in f) return ps.seeds[f.league][f.seed - 1];
  return ps.series[f.winnerOf]?.winnerId;
}

/** Converte un GameResult in una PlayoffGame + vincitore. */
function toPlayoffGame(result: GameResult, gameNo: number): PlayoffGame {
  const homeId = result.home.id;
  const awayId = result.away.id;
  return {
    gameNo,
    homeId,
    awayId,
    winnerId: result.winner === 'home' ? homeId : awayId,
    homeScore: result.final.home,
    awayScore: result.final.away,
  };
}

/** Aggiorna i conteggi vittorie e imposta il vincitore se la serie è decisa. */
function tallyGame(s: Series, g: PlayoffGame): void {
  s.games.push(g);
  if (g.winnerId === s.highId) s.highWins += 1;
  else s.lowWins += 1;
  const need = winsNeeded(s.bestOf);
  if (s.highWins >= need) s.winnerId = s.highId;
  else if (s.lowWins >= need) s.winnerId = s.lowId;
}

/**
 * Quick-sima le gare RESTANTI di una serie (da `games.length` in poi) finché una
 * squadra raggiunge la soglia. Alterna la casa per `hostsHigh` e ruota i partenti
 * col numero di gara (come la CPU in regular season). Muta la serie in loco.
 */
function quickSimSeries(s: Series, teamById: Map<string, Team>, base: number, year: number): void {
  const high = teamById.get(s.highId!)!;
  const low = teamById.get(s.lowId!)!;
  const need = winsNeeded(s.bestOf);
  while (s.highWins < need && s.lowWins < need) {
    const gameNo = s.games.length;
    const highHome = hostsHigh(s.bestOf, gameNo);
    const home = highHome ? high : low;
    const away = highHome ? low : high;
    const g = createLiveGame(
      withRotationStarter(away, gameNo),
      withRotationStarter(home, gameNo),
      gameSeed(base, year, s.id, gameNo),
    );
    quickSim(g);
    tallyGame(s, toPlayoffGame(toGameResult(g), gameNo));
  }
}

/**
 * Risolve i feeder delle serie pronte (imposta high/low ordinate) e quick-sima
 * quelle giocabili. Di default LASCIA le serie che coinvolgono la gestita (le
 * gioca l'utente); con `includeManaged` sima anche quelle (modalità spettatore).
 * Itera fino al punto fisso, poi eventualmente incorona il campione.
 */
function resolveAndAutosim(
  ps: PlayoffState,
  teamById: Map<string, Team>,
  base: number,
  includeManaged: boolean,
): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of seriesOrder()) {
      const s = ps.series[id];
      if (!s || s.winnerId) continue;
      if (!s.highId || !s.lowId) {
        const a = resolveFeeder(ps, s.aFrom);
        const b = resolveFeeder(ps, s.bFrom);
        if (a && b) {
          [s.highId, s.lowId] = orderHighLow(ps, a, b);
          changed = true;
        }
      }
      if (s.highId && s.lowId && !s.winnerId) {
        const involvesManaged = s.highId === ps.managedId || s.lowId === ps.managedId;
        if (!involvesManaged || includeManaged) {
          quickSimSeries(s, teamById, base, ps.year);
          changed = true;
        }
      }
    }
  }
  const ws = ps.series['WS'];
  if (ws?.winnerId) ps.championId = ws.winnerId;
}

/** Costruisce lo scheletro delle serie (feeder non ancora risolti). */
function buildBracket(): Record<string, Series> {
  const s: Record<string, Series> = {};
  const mk = (
    id: string,
    round: Round,
    bestOf: number,
    aFrom: Feeder,
    bFrom: Feeder,
    league?: LeagueId,
  ): void => {
    s[id] = { id, round, league, bestOf, aFrom, bFrom, highWins: 0, lowWins: 0, games: [] };
  };
  for (const L of LEAGUES) {
    // Wild Card: 3 vs 6, 4 vs 5 (teste 1-2 in bye).
    mk(`${L}-WC-A`, 'WC', 3, { seed: 3, league: L }, { seed: 6, league: L }, L);
    mk(`${L}-WC-B`, 'WC', 3, { seed: 4, league: L }, { seed: 5, league: L }, L);
    // Division Series: 1 vs vincente(4/5), 2 vs vincente(3/6).
    mk(`${L}-DS-1`, 'DS', 5, { seed: 1, league: L }, { winnerOf: `${L}-WC-B` }, L);
    mk(`${L}-DS-2`, 'DS', 5, { seed: 2, league: L }, { winnerOf: `${L}-WC-A` }, L);
    // League Championship: le due vincenti DS.
    mk(`${L}-LCS`, 'LCS', 7, { winnerOf: `${L}-DS-1` }, { winnerOf: `${L}-DS-2` }, L);
  }
  // World Series: campione AL vs campione NL.
  mk('WS', 'WS', 7, { winnerOf: 'AL-LCS' }, { winnerOf: 'NL-LCS' });
  return s;
}

/** Le 6 teste di serie di una lega: 3 campioni division (per record) + 3 wild card. */
function seedLeagueTeams(teams: Team[], records: Record<string, WLRecord>, L: LeagueId): string[] {
  const cmp = cmpRecord(records);
  const divWinners = byDivision(teams)
    .filter((g) => g.league === L)
    .map((g) => [...g.teams].map((t) => t.id).sort(cmp)[0])
    .filter(Boolean)
    .sort(cmp); // seed 1-3 = campioni division per record
  const winners = new Set(divWinners);
  const wildCards = teams
    .filter((t) => t.league === L && !winners.has(t.id))
    .map((t) => t.id)
    .sort(cmp)
    .slice(0, 3); // seed 4-6 = migliori non-campioni
  return [...divWinners, ...wildCards];
}

/**
 * Costruisce la postseason dai record finali e quick-sima subito le serie non
 * della gestita già pronte (così il bracket è "vivo" tranne le gare dell'utente).
 */
export function seedPlayoffs(
  season: SeasonState,
  teams: Team[],
  base: number,
  managedId: string,
): PlayoffState {
  const records: Record<string, WLRecord> = {};
  for (const t of teams) records[t.id] = recordOf(season, t.id);

  const ps: PlayoffState = {
    year: season.year,
    seeds: { AL: seedLeagueTeams(teams, records, 'AL'), NL: seedLeagueTeams(teams, records, 'NL') },
    records,
    series: buildBracket(),
    managedId,
    rotation: createRotation((season.rotation?.size ?? 5) as RotationSize),
    managedGames: 0,
    bat: {},
    pit: {},
  };
  const teamById = new Map(teams.map((t) => [t.id, t]));
  resolveAndAutosim(ps, teamById, base, false);
  return ps;
}

/** true se la squadra gestita è tra le qualificate (una testa di serie). */
export function managedQualified(ps: PlayoffState): boolean {
  return seedLeague(ps, ps.managedId) !== null;
}

/** La serie ATTIVA della gestita: coinvolge la gestita, ha entrambi i
 *  partecipanti risolti e non è ancora decisa. Al più una alla volta. */
export function managedSeries(ps: PlayoffState): Series | null {
  for (const id of seriesOrder()) {
    const s = ps.series[id];
    if (s && !s.winnerId && s.highId && s.lowId && (s.highId === ps.managedId || s.lowId === ps.managedId)) {
      return s;
    }
  }
  return null;
}

export interface NextGame {
  seriesId: string;
  round: Round;
  gameNo: number; // 0-based nella serie
  opponentId: string;
  home: boolean; // la gestita gioca in casa
}

/** La prossima gara che l'utente deve giocare, o null (bye/eliminata/finito). */
export function nextManagedGame(ps: PlayoffState): NextGame | null {
  const s = managedSeries(ps);
  if (!s) return null;
  const managedHigh = s.highId === ps.managedId;
  const opponentId = managedHigh ? s.lowId! : s.highId!;
  const gameNo = s.games.length;
  const highHome = hostsHigh(s.bestOf, gameNo);
  const home = managedHigh ? highHome : !highHome;
  return { seriesId: s.id, round: s.round, gameNo, opponentId, home };
}

/**
 * Registra una gara di playoff GIOCATA dall'utente e fa avanzare il bracket:
 * accumula le stat della gestita (bucket separato), aggiorna la serie, registra
 * il partente per la rotazione playoff, poi risolve/quick-sima il resto pronto.
 * Puro: ritorna un NUOVO stato.
 */
export function recordManagedGame(
  ps: PlayoffState,
  result: GameResult,
  teams: Team[],
  base: number,
  starterId?: string,
): PlayoffState {
  const next = clone(ps);
  const s = managedSeries(next);
  if (!s) return next; // niente serie attiva: no-op difensivo

  const gameNo = s.games.length;
  tallyGame(s, toPlayoffGame(result, gameNo));

  // Stat reali di playoff di ENTRAMBE le squadre della mia gara (bucket separato).
  accumulateInto(next.bat, next.pit, result.homeStats);
  accumulateInto(next.bat, next.pit, result.awayStats);

  // Rotazione playoff: registra la partenza del partente scelto/della gestita.
  const managedHome = result.home.id === next.managedId;
  const myPitching = (managedHome ? result.homeStats : result.awayStats).pitching;
  const sp = starterId ?? myPitching[0]?.id;
  if (sp) next.rotation = recordStart(next.rotation, sp, next.managedGames);
  next.managedGames += 1;

  const teamById = new Map(teams.map((t) => [t.id, t]));
  resolveAndAutosim(next, teamById, base, false);
  return next;
}

/** Quick-sima TUTTO il resto della postseason (spettatore) fino al campione. */
export function simRestOfPlayoffs(ps: PlayoffState, teams: Team[], base: number): PlayoffState {
  const next = clone(ps);
  const teamById = new Map(teams.map((t) => [t.id, t]));
  resolveAndAutosim(next, teamById, base, true);
  return next;
}

/** true se la postseason è conclusa (campione deciso). */
export function playoffOver(ps: PlayoffState): boolean {
  return !!ps.championId;
}

/** true se la gestita è stata eliminata (qualificata ma fuori, senza titolo). */
export function managedEliminated(ps: PlayoffState): boolean {
  if (!managedQualified(ps)) return false;
  if (ps.championId === ps.managedId) return false;
  return !managedSeries(ps) && managedGamesLeft(ps) === false;
}

/** Esiste ancora una serie futura che POTREBBE coinvolgere la gestita? */
function managedGamesLeft(ps: PlayoffState): boolean {
  // Se una serie non decisa ha la gestita già dentro, o un feeder che può ancora
  // portarla dentro (una serie che sta giocando/giocherà con lei), non è finita.
  return seriesOrder().some((id) => {
    const s = ps.series[id];
    if (!s || s.winnerId) return false;
    return s.highId === ps.managedId || s.lowId === ps.managedId;
  });
}

/** Le serie raggruppate per turno (per la UI del bracket). */
export function seriesByRound(ps: PlayoffState): Record<Round, Series[]> {
  const out: Record<Round, Series[]> = { WC: [], DS: [], LCS: [], WS: [] };
  for (const id of seriesOrder()) {
    const s = ps.series[id];
    if (s) out[s.round].push(s);
  }
  return out;
}

/** Clona profondamente (quanto serve) uno stato di playoff. */
function clone(ps: PlayoffState): PlayoffState {
  return {
    ...ps,
    seeds: { AL: [...ps.seeds.AL], NL: [...ps.seeds.NL] },
    records: { ...ps.records },
    series: Object.fromEntries(
      Object.entries(ps.series).map(([k, s]) => [k, { ...s, games: [...s.games] }]),
    ),
    rotation: { ...ps.rotation, lastStart: { ...ps.rotation.lastStart } },
    bat: cloneStats(ps.bat, emptyBat),
    pit: cloneStats(ps.pit, emptyPit),
  };
}
function cloneStats<T>(m: Record<string, T>, _mk: () => T): Record<string, T> {
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ...v }]));
}
