import type { Batter, Pitcher, Team } from '../engine/types';
import { playerValue } from '../engine/value';
import { effectiveCap, GENERATED_MODE, type LeagueMode } from './leagueMode';

// ---------------------------------------------------------------------------
// OFF-SEASON A BLOCCHI — mercato dei free agent (Fase 5A, step 3).
//
// Decisione di design (vedi docs/franchise.md § Mercato a blocchi): rilasci e
// firme NON sono due passi chiusi ("scarica tutti, poi firma tutti"). L'off-season
// e' una sequenza di BLOCCHI-DATA in cui, in OGNI blocco, accadono ENTRAMBE le
// cose — sia lato AI sia lato utente — e il POOL resta osservabile fra un blocco e
// l'altro. Cosi' si puo' vedere chi e' disponibile PRIMA di rilasciare apposta un
// giocatore per far spazio, e viceversa, in piu' momenti.
//
// Puro e deterministico: le AI non usano RNG (scelte per `playerValue`, spareggio
// per id). L'utente agisce con le STESSE primitive (`humanRelease`/`humanSign`).
// Opera su ROSTER PIATTI (battitori/lanciatori); la ricomposizione di
// lineup/rotazione (finalize/reslot) e l'aggancio ad aging/draft sono il mattone
// successivo di 5A.
// ---------------------------------------------------------------------------

/** Taglie rosa a regime (vedi generator): 9+5+6 battitori, 5+6+4 lanciatori. */
export const TARGET_BATTERS = 20;
export const TARGET_PITCHERS = 15;

/**
 * I blocchi-data dell'off-season (finestre che simulano il susseguirsi di
 * novembre→febbraio). Ognuno e' un "round" in cui AI e utente possono rilasciare
 * e firmare. `roundCount = OFFSEASON_BLOCKS.length`.
 */
export const OFFSEASON_BLOCKS = [
  'Inizio novembre — decisioni sui roster',
  'Metà novembre — svincoli',
  'Dicembre — apertura del mercato',
  'Inverno — trattative',
  'Gennaio — riempimento rose',
  'Febbraio — ritocchi finali',
] as const;

export type FreeAgent = Batter | Pitcher;
const isPitcher = (p: FreeAgent): p is Pitcher => 'role' in p;

export type TxnKind = 'release' | 'sign';

/** Una mossa registrata (per il riepilogo e la UI di Fase 5B). */
export interface Txn {
  round: number;
  teamId: string;
  kind: TxnKind;
  playerId: string;
  playerName: string;
  kindOfPlayer: 'bat' | 'pit';
  salary: number;
  byHuman: boolean;
}

/** Rosa PIATTA di una squadra durante l'off-season (pre-ricomposizione). */
export interface RosterSet {
  batters: Batter[];
  pitchers: Pitcher[];
}

export interface OffseasonState {
  year: number;
  seed: number;
  mode: LeagueMode;
  /** Blocco corrente (0-based). Off-season conclusa quando `round >= roundCount`. */
  round: number;
  roundCount: number;
  /** Squadra gestita dall'utente: le AI la SALTANO (agisci tu con le primitive). */
  managedId?: string;
  /** Ordine deterministico di elaborazione delle AI. */
  teamOrder: string[];
  rosters: Record<string, RosterSet>;
  /** Taglie bersaglio per-squadra (catturate all'avvio). */
  targets: Record<string, { bat: number; pit: number }>;
  pool: FreeAgent[];
  log: Txn[];
}

const round1 = (x: number): number => Math.round(x * 10) / 10;

/** Monte-ingaggi (milioni) di una rosa piatta. */
export function payrollOfSet(set: RosterSet): number {
  const total = [...set.batters, ...set.pitchers].reduce((s, p) => s + p.salary, 0);
  return round1(total);
}

/** Tetto effettivo (milioni) della squadra per l'anno dell'off-season. */
export function capOf(state: OffseasonState, teamId: string): number {
  return effectiveCap(state.mode, state.seed, teamId, state.year);
}

const flatten = (t: Team): RosterSet => ({
  batters: [...t.lineup, ...t.bench, ...t.reserveBatters],
  pitchers: [...t.rotation, ...t.bullpen, ...t.reservePitchers],
});

/**
 * Apre l'off-season: cattura le rose piatte e le taglie, pool vuoto, round 0.
 * (Aging/ritiri/draft sono la fase una-tantum a monte: si applicano alle rose
 * PRIMA di chiamare qui — aggancio del mattone successivo. `mode` default lega
 * generata: nell'import storico il cap e' `off` → nessun rilascio forzato.)
 */
export function startOffseason(
  teams: Team[],
  seed: number,
  year: number,
  managedId?: string,
  mode: LeagueMode = GENERATED_MODE,
): OffseasonState {
  const rosters: Record<string, RosterSet> = {};
  const targets: Record<string, { bat: number; pit: number }> = {};
  for (const t of teams) {
    rosters[t.id] = flatten(t);
    targets[t.id] = { bat: TARGET_BATTERS, pit: TARGET_PITCHERS };
  }
  return {
    year, seed, mode,
    round: 0,
    roundCount: OFFSEASON_BLOCKS.length,
    managedId,
    teamOrder: teams.map((t) => t.id),
    rosters,
    targets,
    pool: [],
    log: [],
  };
}

export function isOffseasonComplete(state: OffseasonState): boolean {
  return state.round >= state.roundCount;
}

/** Etichetta-data del blocco corrente (o `null` se conclusa). */
export function currentBlock(state: OffseasonState): string | null {
  return isOffseasonComplete(state) ? null : OFFSEASON_BLOCKS[state.round];
}

// --- Primitive pure (usate identiche da AI e utente) -----------------------

const cloneSet = (s: RosterSet): RosterSet => ({ batters: [...s.batters], pitchers: [...s.pitchers] });

/** Il giocatore di valore piu' BASSO di una rosa (candidato allo scarico). */
function worstReleasable(set: RosterSet): FreeAgent | null {
  const all: FreeAgent[] = [...set.batters, ...set.pitchers];
  if (!all.length) return null;
  return all.reduce((w, p) =>
    playerValue(p) < playerValue(w) || (playerValue(p) === playerValue(w) && p.id < w.id) ? p : w,
  );
}

/**
 * Miglior free agent del TIPO richiesto che sta sotto il tetto (payroll+salary ≤
 * cap). `need`: quali tipi servono. Ritorna `null` se nulla e' affrontabile.
 */
function bestAffordable(
  pool: FreeAgent[],
  payroll: number,
  cap: number,
  need: { bat: boolean; pit: boolean },
): FreeAgent | null {
  let best: FreeAgent | null = null;
  for (const p of pool) {
    const wantType = isPitcher(p) ? need.pit : need.bat;
    if (!wantType) continue;
    if (payroll + p.salary > cap + 1e-9) continue;
    if (
      !best ||
      playerValue(p) > playerValue(best) ||
      (playerValue(p) === playerValue(best) && p.id < best.id)
    ) {
      best = p;
    }
  }
  return best;
}

function removeFromSet(set: RosterSet, p: FreeAgent): RosterSet {
  const next = cloneSet(set);
  if (isPitcher(p)) next.pitchers = next.pitchers.filter((x) => x.id !== p.id);
  else next.batters = next.batters.filter((x) => x.id !== p.id);
  return next;
}

function addToSet(set: RosterSet, p: FreeAgent): RosterSet {
  const next = cloneSet(set);
  if (isPitcher(p)) next.pitchers = [...next.pitchers, p];
  else next.batters = [...next.batters, p];
  return next;
}

function withTxn(state: OffseasonState, t: Txn): OffseasonState {
  return { ...state, log: [...state.log, t] };
}

/** Sposta un giocatore da una squadra al pool (rilascio). Nessun gate: si puo'
 *  sempre rilasciare. Ritorna un nuovo stato. */
function release(state: OffseasonState, teamId: string, p: FreeAgent, byHuman: boolean): OffseasonState {
  const rosters = { ...state.rosters, [teamId]: removeFromSet(state.rosters[teamId], p) };
  const pool = [...state.pool, p];
  const t: Txn = {
    round: state.round, teamId, kind: 'release', playerId: p.id, playerName: p.name,
    kindOfPlayer: isPitcher(p) ? 'pit' : 'bat', salary: p.salary, byHuman,
  };
  return withTxn({ ...state, rosters, pool }, t);
}

/** Sposta un free agent dal pool a una squadra (firma). Gate: deve rientrare nel
 *  tetto effettivo. Ritorna lo stato invariato se non rientra o non e' nel pool. */
function sign(state: OffseasonState, teamId: string, p: FreeAgent, byHuman: boolean): OffseasonState {
  if (!state.pool.some((x) => x.id === p.id)) return state;
  const payroll = payrollOfSet(state.rosters[teamId]);
  if (payroll + p.salary > capOf(state, teamId) + 1e-9) return state;
  const rosters = { ...state.rosters, [teamId]: addToSet(state.rosters[teamId], p) };
  const pool = state.pool.filter((x) => x.id !== p.id);
  const t: Txn = {
    round: state.round, teamId, kind: 'sign', playerId: p.id, playerName: p.name,
    kindOfPlayer: isPitcher(p) ? 'pit' : 'bat', salary: p.salary, byHuman,
  };
  return withTxn({ ...state, rosters, pool }, t);
}

// --- Azioni dell'utente (stesse primitive, sulla squadra gestita) ----------

/** Rilascio deciso dall'utente sulla propria franchigia. */
export function humanRelease(state: OffseasonState, playerId: string): OffseasonState {
  const teamId = state.managedId;
  if (!teamId) return state;
  const set = state.rosters[teamId];
  const p = [...set.batters, ...set.pitchers].find((x) => x.id === playerId);
  return p ? release(state, teamId, p, true) : state;
}

/** Firma decisa dall'utente dal pool (gate sul cap come le AI). */
export function humanSign(state: OffseasonState, playerId: string): OffseasonState {
  const teamId = state.managedId;
  if (!teamId) return state;
  const p = state.pool.find((x) => x.id === playerId);
  return p ? sign(state, teamId, p, true) : state;
}

// --- Automa AI: UNA mossa limitata per squadra, per blocco ------------------

/**
 * Elabora una singola AI per il blocco corrente (al piu' UNA mossa, cosi' il
 * mercato si schiarisce gradualmente):
 *   1) se sopra il proprio tetto → rilascia il giocatore di valore piu' basso;
 *   2) altrimenti, se sotto taglia e c'e' spazio-cap → firma il miglior FA del
 *      tipo mancante che rientra nel tetto;
 *   3) altrimenti nessuna mossa.
 */
function stepAiTeam(state: OffseasonState, teamId: string): OffseasonState {
  const set = state.rosters[teamId];
  const payroll = payrollOfSet(set);
  const cap = capOf(state, teamId);

  // 1) Pressione da cap: scarica il peggiore.
  if (payroll > cap + 1e-9) {
    const worst = worstReleasable(set);
    if (worst) return release(state, teamId, worst, false);
  }

  // 2) Riempimento per bisogno (tipo sotto taglia), il migliore affrontabile.
  const need = {
    bat: set.batters.length < state.targets[teamId].bat,
    pit: set.pitchers.length < state.targets[teamId].pit,
  };
  if (need.bat || need.pit) {
    const pick = bestAffordable(state.pool, payroll, cap, need);
    if (pick) return sign(state, teamId, pick, false);
  }

  return state;
}

/**
 * Avanza l'off-season di UN blocco: elabora tutte le AI (salta la gestita), poi
 * incrementa `round`. Le mosse dell'utente NON avvengono qui: le fai tu con
 * `humanRelease`/`humanSign` osservando il pool, prima o dopo l'avanzamento del
 * blocco. Puro: ritorna un nuovo stato.
 */
export function advanceBlock(state: OffseasonState): OffseasonState {
  if (isOffseasonComplete(state)) return state;
  let s = state;
  for (const id of state.teamOrder) {
    if (id === state.managedId) continue;
    s = stepAiTeam(s, id);
  }
  return { ...s, round: s.round + 1 };
}

/** Esegue automaticamente tutti i blocchi rimanenti (comodo per test/quick-sim). */
export function runOffseasonMarket(state: OffseasonState): OffseasonState {
  let s = state;
  while (!isOffseasonComplete(s)) s = advanceBlock(s);
  return s;
}
