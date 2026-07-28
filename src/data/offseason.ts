import type { Batter, Pitcher, Team } from '../engine/types';
import { playerValue, overallOf } from '../engine/value';
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

export type TxnKind = 'release' | 'sign' | 'trade';

/** Una mossa registrata (per il riepilogo e la UI di Fase 5B). Per `kind==='trade'`
 *  `playerId`/`salary` sono il giocatore RICEVUTO e `sentId`/`withTeamId` il resto. */
export interface Txn {
  round: number;
  teamId: string;
  kind: TxnKind;
  playerId: string;
  playerName: string;
  kindOfPlayer: 'bat' | 'pit';
  salary: number;
  byHuman: boolean;
  /** Solo trade: contproparte e giocatore ceduto. */
  withTeamId?: string;
  sentId?: string;
  sentName?: string;
}

/** Scarto di valore massimo tollerato in uno scambio di riallineamento AI↔AI. */
export const REALIGN_VALUE_TOL = 3;
/** Un pari-ruolo entro questo scarto di overall rende un giocatore un "doppione"
 *  (cedibile senza perdere copertura in quello slot). Stretto apposta: solo veri
 *  doppioni, non "ho un pari-ruolo un po' peggiore". */
const REDUNDANCY_SLACK = 3;
/** Un giocatore in arrivo colma un bisogno solo se MIGLIORA la copertura dello
 *  slot di almeno questo margine (non basta un +1): tiene gli scambi rari e
 *  significativi ("un po' di varieta'", non churn continuo). */
const NEED_MARGIN = 5;

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
function worstOfKind(players: FreeAgent[]): FreeAgent | null {
  if (!players.length) return null;
  return players.reduce((w, p) =>
    playerValue(p) < playerValue(w) || (playerValue(p) === playerValue(w) && p.id < w.id) ? p : w,
  );
}

function stepAiTeam(state: OffseasonState, teamId: string): OffseasonState {
  const set = state.rosters[teamId];
  const payroll = payrollOfSet(set);
  const cap = capOf(state, teamId);
  const tgt = state.targets[teamId];

  // 1) Pressione da CAP: scarica il peggiore in assoluto.
  if (payroll > cap + 1e-9) {
    const worst = worstReleasable(set);
    if (worst) return release(state, teamId, worst, false);
  }

  // 2) Sopra TAGLIA su un tipo: scarica il peggiore di quel tipo (la depth in
  //    eccesso — es. i prospetti dal draft — defluisce nel pool).
  if (set.batters.length > tgt.bat) {
    const w = worstOfKind(set.batters);
    if (w) return release(state, teamId, w, false);
  }
  if (set.pitchers.length > tgt.pit) {
    const w = worstOfKind(set.pitchers);
    if (w) return release(state, teamId, w, false);
  }

  // 3) Riempimento per bisogno (tipo sotto taglia), il migliore affrontabile.
  const need = { bat: set.batters.length < tgt.bat, pit: set.pitchers.length < tgt.pit };
  if (need.bat || need.pit) {
    const pick = bestAffordable(state.pool, payroll, cap, need);
    if (pick) return sign(state, teamId, pick, false);
  }

  return state;
}

// --- Riallineamento AI↔AI: scambi 1-per-1, stesso valore, fit migliore ------
//
// Guardrail (docs/franchise.md § Trade AI↔AI): 1-per-1 stesso tipo, |Δvalore| ≤
// REALIGN_VALUE_TOL, cap-legale per entrambe, guidato dal BISOGNO posizionale (una
// cede un doppione e riceve un upgrade dove e' scoperta, l'altra simmetrica). Al
// piu' una trade per squadra per blocco, deterministico (nessun RNG).

const slotOf = (p: FreeAgent): string => (isPitcher(p) ? p.role : (p as Batter).position);

function bestOverallAtSlot(players: FreeAgent[], slot: string, exceptId?: string): number {
  let best = -Infinity;
  for (const q of players) {
    if (slotOf(q) === slot && q.id !== exceptId) best = Math.max(best, overallOf(q));
  }
  return best;
}

/** `p` e' un doppione in `arr` (esiste un pari-slot quasi equivalente): cedibile. */
const spareable = (arr: FreeAgent[], p: FreeAgent): boolean =>
  bestOverallAtSlot(arr, slotOf(p), p.id) >= overallOf(p) - REDUNDANCY_SLACK;

/** `p` migliora la copertura di `arr` nel suo slot di almeno NEED_MARGIN. */
const fillsNeed = (arr: FreeAgent[], p: FreeAgent): boolean =>
  overallOf(p) >= bestOverallAtSlot(arr, slotOf(p)) + NEED_MARGIN;

/** Primo scambio 1-per-1 valido di un dato tipo fra due squadre (o null). */
function findSwap(
  state: OffseasonState,
  idA: string,
  idB: string,
  kind: 'bat' | 'pit',
): { a: FreeAgent; b: FreeAgent } | null {
  const setA = state.rosters[idA];
  const setB = state.rosters[idB];
  const arrA: FreeAgent[] = kind === 'bat' ? setA.batters : setA.pitchers;
  const arrB: FreeAgent[] = kind === 'bat' ? setB.batters : setB.pitchers;
  const payA = payrollOfSet(setA);
  const payB = payrollOfSet(setB);
  const capA = capOf(state, idA);
  const capB = capOf(state, idB);
  for (const a of arrA) {
    for (const b of arrB) {
      if (Math.abs(playerValue(a) - playerValue(b)) > REALIGN_VALUE_TOL) continue;
      // A cede un doppione (a) e riceve un upgrade (b); B simmetrico.
      if (!(fillsNeed(arrA, b) && spareable(arrA, a))) continue;
      if (!(fillsNeed(arrB, a) && spareable(arrB, b))) continue;
      // Cap-legale per entrambe DOPO lo scambio.
      if (payA - a.salary + b.salary > capA + 1e-9) continue;
      if (payB - b.salary + a.salary > capB + 1e-9) continue;
      return { a, b };
    }
  }
  return null;
}

function applySwap(
  state: OffseasonState,
  idA: string,
  idB: string,
  a: FreeAgent,
  b: FreeAgent,
): OffseasonState {
  const rosters = { ...state.rosters };
  rosters[idA] = addToSet(removeFromSet(rosters[idA], a), b);
  rosters[idB] = addToSet(removeFromSet(rosters[idB], b), a);
  const rec = (teamId: string, withTeamId: string, got: FreeAgent, sent: FreeAgent): Txn => ({
    round: state.round, teamId, kind: 'trade',
    playerId: got.id, playerName: got.name, kindOfPlayer: isPitcher(got) ? 'pit' : 'bat',
    salary: got.salary, byHuman: false, withTeamId, sentId: sent.id, sentName: sent.name,
  });
  return {
    ...state,
    rosters,
    log: [...state.log, rec(idA, idB, b, a), rec(idB, idA, a, b)],
  };
}

/** Un giro di riallineamento: al piu' una trade AI↔AI per squadra (salta la
 *  gestita). Scansione a coppie in ordine fisso → deterministico. */
function realignPass(state: OffseasonState): OffseasonState {
  let s = state;
  const acted = new Set<string>();
  const order = s.teamOrder;
  for (let i = 0; i < order.length; i++) {
    for (let j = i + 1; j < order.length; j++) {
      const A = order[i];
      const B = order[j];
      if (A === s.managedId || B === s.managedId) continue;
      if (acted.has(A) || acted.has(B)) continue;
      const swap = findSwap(s, A, B, 'bat') ?? findSwap(s, A, B, 'pit');
      if (swap) {
        s = applySwap(s, A, B, swap.a, swap.b);
        acted.add(A);
        acted.add(B);
      }
    }
  }
  return s;
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
  // Mercato FA: una mossa limitata per AI.
  for (const id of state.teamOrder) {
    if (id === state.managedId) continue;
    s = stepAiTeam(s, id);
  }
  // In PARALLELO nello stesso blocco: riallineamento AI↔AI (varieta' delle rose).
  s = realignPass(s);
  return { ...s, round: s.round + 1 };
}

/** Esegue automaticamente tutti i blocchi rimanenti (comodo per test/quick-sim). */
export function runOffseasonMarket(state: OffseasonState): OffseasonState {
  let s = state;
  while (!isOffseasonComplete(s)) s = advanceBlock(s);
  return s;
}
