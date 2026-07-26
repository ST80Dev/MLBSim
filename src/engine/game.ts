import type { Batter, Team, RawEvent, Pitcher } from './types';
import type { Rng } from './rng';
import { makeRng, clamp } from './rng';
import { resolveAtBat } from './atbat';
import { TUNING } from './constants';
import {
  BattingLine,
  PitchingLine,
  newBattingLine,
  newPitchingLine,
} from './boxscore';

export type Half = 'top' | 'bottom';

/** Un corridore in base, col lanciatore responsabile (per gli ER). */
interface Runner {
  batter: Batter;
  pitcherId: string;
}

/**
 * Categoria "narrabile" di una giocata: la UI la usa per il banner di cronaca
 * (fasi + intensita' crescente + colori a tema). NON influenza la simulazione:
 * e' solo metadato descrittivo dell'esito gia' calcolato.
 */
export type PlayKind =
  | 'single'
  | 'double'
  | 'triple'
  | 'homerun'
  | 'walk'
  | 'hbp'
  | 'ibb'
  | 'strikeout'
  | 'inplayout'
  | 'gidp'
  | 'sacfly'
  | 'sacbunt'
  | 'bunthit'
  | 'buntout'
  | 'steal'
  | 'caughtstealing'
  | 'wildpitch'
  | 'passedball'
  | 'balk'
  | 'sub'
  | 'other';

/** Evento di play-by-play. */
export interface PlayEvent {
  inning: number;
  half: Half;
  text: string;
  away: number; // punteggio away dopo l'azione
  home: number; // punteggio home dopo l'azione
  runsScored: number;
  /** Categoria dell'esito (per il banner di cronaca). */
  kind: PlayKind;
  /** Nome breve del protagonista dell'azione (battitore o corridore). */
  batter?: string;
}

export interface TeamGameStats {
  runs: number;
  hits: number;
  errors: number;
  lineByInning: number[];
  batting: BattingLine[];
  pitching: PitchingLine[];
}

export interface GameResult {
  away: Team;
  home: Team;
  awayStats: TeamGameStats;
  homeStats: TeamGameStats;
  play: PlayEvent[];
  innings: number;
  final: { away: number; home: number };
  winner: 'away' | 'home';
}

interface SideState {
  team: Team;
  battingIndex: number;
  battingLines: Map<string, BattingLine>;
  battingOrder: string[];
  pitchers: Pitcher[];
  pitcherIdx: number;
  pitchersUsed: Pitcher[];
  pitchingLines: Map<string, PitchingLine>;
  battersFacedByCurrent: number;
  runs: number;
  hits: number;
  lineByInning: number[];
}

function makeSide(team: Team): SideState {
  const battingLines = new Map<string, BattingLine>();
  const battingOrder: string[] = [];
  for (const b of team.lineup) {
    battingLines.set(b.id, newBattingLine(b));
    battingOrder.push(b.id);
  }
  const starter = team.rotation[0];
  const pitchers = [starter, ...team.bullpen];
  const pitchingLines = new Map<string, PitchingLine>();
  pitchingLines.set(starter.id, newPitchingLine(starter));
  return {
    team,
    battingIndex: 0,
    battingLines,
    battingOrder,
    pitchers,
    pitcherIdx: 0,
    pitchersUsed: [starter],
    pitchingLines,
    battersFacedByCurrent: 0,
    runs: 0,
    hits: 0,
    lineByInning: [],
  };
}

const currentPitcher = (s: SideState): Pitcher => s.pitchers[s.pitcherIdx];

// ---------------------------------------------------------------------------
// Motore "live": macchina a stati che avanza UN'azione alla volta.
// simulateGame ne e' un caso particolare (CPU su entrambe le squadre), cosi'
// il quick-sim e la partita interattiva condividono lo stesso codice.
// ---------------------------------------------------------------------------

/** Tattica offensiva scelta per il turno corrente. */
export type OffenseTactic = 'swing' | 'bunt';

export interface LiveGame {
  away: Team;
  home: Team;
  awaySide: SideState;
  homeSide: SideState;
  inning: number;
  half: Half;
  outs: number;
  bases: (Runner | null)[]; // 1B, 2B, 3B
  rng: Rng;
  play: PlayEvent[];
  status: 'live' | 'final';
  finalInning: number;
  winner?: 'away' | 'home';
  /** Squadra gestita dall'umano (solo suggerimento per la UI). */
  controlled: 'away' | 'home';
  /** Difesa avanzata "interni dentro" per il turno corrente (tattica difensiva). */
  infieldIn: boolean;
  /**
   * Abilita i micro-eventi pre-lancio (lancio pazzo / palla passata / balk) nei
   * turni interattivi. Il quick-sim non li usa comunque; questo flag serve a
   * spegnerli in misurazioni controllate (test). Default true.
   */
  microEvents: boolean;
  maxInnings: number;
  // Tracciamento decisioni W/L/SV.
  leader: 'away' | 'home' | null;
  pendingWpSide: 'away' | 'home' | null;
  pendingWpId: string | null;
  pendingLpId: string | null;
}

const MAX_INNINGS = 30; // salvagente

/** Crea una nuova partita interattiva, deterministica dal seed. */
export function createLiveGame(
  away: Team,
  home: Team,
  seed: number,
  controlled: 'away' | 'home' = 'home',
): LiveGame {
  const live: LiveGame = {
    away,
    home,
    awaySide: makeSide(away),
    homeSide: makeSide(home),
    inning: 1,
    half: 'top',
    outs: 0,
    bases: [null, null, null],
    rng: makeRng(seed),
    play: [],
    status: 'live',
    finalInning: 1,
    controlled,
    infieldIn: false,
    microEvents: true,
    maxInnings: MAX_INNINGS,
    leader: null,
    pendingWpSide: null,
    pendingWpId: null,
    pendingLpId: null,
  };
  ensureInningSlot(live.awaySide, live.inning);
  return live;
}

const offense = (l: LiveGame): SideState =>
  l.half === 'top' ? l.awaySide : l.homeSide;
const defense = (l: LiveGame): SideState =>
  l.half === 'top' ? l.homeSide : l.awaySide;

function ensureInningSlot(s: SideState, inning: number): void {
  while (s.lineByInning.length < inning) s.lineByInning.push(0);
}

function makeScoreRunner(
  l: LiveGame,
  off: SideState,
  def: SideState,
): (r: Runner | null) => void {
  return (r) => {
    if (!r) return;
    off.runs += 1;
    off.lineByInning[l.inning - 1] += 1;
    const rl = off.battingLines.get(r.batter.id);
    if (rl) rl.r += 1;
    const pl = def.pitchingLines.get(r.pitcherId);
    if (pl) {
      pl.r += 1;
      pl.er += 1; // nessun errore in Fase 0/1 -> tutte earned
    }
  };
}

function pushPlay(
  l: LiveGame,
  text: string,
  runsScored: number,
  kind: PlayKind = 'other',
  batter?: string,
): void {
  const off = offense(l);
  const def = defense(l);
  l.play.push({
    inning: l.inning,
    half: l.half,
    text,
    away: l.half === 'top' ? off.runs : def.runs,
    home: l.half === 'top' ? def.runs : off.runs,
    runsScored,
    kind,
    batter,
  });
}

/** Cambio automatico del lanciatore per affaticamento (CPU / quick-sim). */
function autoManagePitcher(l: LiveGame, s: SideState): void {
  const p = currentPitcher(s);
  const threshold = p.stamina + (p.role === 'SP' ? 4 : 2);
  if (s.battersFacedByCurrent >= threshold && s.pitcherIdx < s.pitchers.length - 1) {
    s.pitcherIdx += 1;
    enterPitcher(l, s);
  }
}

/** Registra l'ingresso del lanciatore corrente (linea + vantaggio d'ingresso). */
function enterPitcher(l: LiveGame, s: SideState): void {
  const next = currentPitcher(s);
  if (!s.pitchingLines.has(next.id)) {
    s.pitchingLines.set(next.id, newPitchingLine(next));
    s.pitchersUsed.push(next);
  }
  s.battersFacedByCurrent = 0;
  const opp = s === l.awaySide ? l.homeSide : l.awaySide;
  s.pitchingLines.get(next.id)!.enteredDiff = s.runs - opp.runs;
}

/** Turno di battuta normale (swing). Consuma l'RNG come la Fase 0. */
function swingAtBat(l: LiveGame): void {
  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const batter = off.team.lineup[off.battingIndex];
  off.battingIndex = (off.battingIndex + 1) % off.team.lineup.length;

  def.battersFacedByCurrent += 1;
  const pLine = def.pitchingLines.get(pitcher.id)!;
  pLine.bf += 1;
  const bLine = off.battingLines.get(batter.id)!;

  const { event } = resolveAtBat(batter, pitcher, def.battersFacedByCurrent, l.rng);

  const runsBefore = off.runs;
  const res = applyEvent(
    event,
    batter,
    pitcher.id,
    l.bases,
    l.outs,
    l.rng,
    makeScoreRunner(l, off, def),
    bLine,
    pLine,
    l.infieldIn,
  );
  l.outs += res.outsAdded;
  if (res.hit) off.hits += 1;
  const runsScored = off.runs - runsBefore;

  pushPlay(l, describe(event, batter, runsScored), runsScored, classifyEvent(event, res), shortName(batter.name));
  afterPlay(l, runsScored);
}

/** Bunt di sacrificio. Attiva Difesa del lanciatore e Velocita' del battitore. */
function buntAtBat(l: LiveGame): void {
  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const batter = off.team.lineup[off.battingIndex];
  off.battingIndex = (off.battingIndex + 1) % off.team.lineup.length;

  def.battersFacedByCurrent += 1;
  const pLine = def.pitchingLines.get(pitcher.id)!;
  pLine.bf += 1;
  const bLine = off.battingLines.get(batter.id)!;
  const scoreRunner = makeScoreRunner(l, off, def);

  const probs = buntOutcomeProbs(batter, pitcher);
  const roll = l.rng.next();
  const runsBefore = off.runs;
  const name = shortName(batter.name);
  let text: string;

  const bases = l.bases;
  const leadIdx = bases[2] ? 2 : bases[1] ? 1 : bases[0] ? 0 : -1;
  let kind: PlayKind;

  if (roll < probs.hit) {
    // Bunt valido: il battitore arriva in prima, i corridori avanzano di una.
    bLine.ab += 1;
    bLine.h += 1;
    pLine.h += 1;
    off.hits += 1;
    let rbi = 0;
    if (bases[2]) {
      scoreRunner(bases[2]);
      bases[2] = null;
      rbi += 1;
    }
    if (bases[1]) {
      bases[2] = bases[1];
      bases[1] = null;
    }
    if (bases[0]) {
      bases[1] = bases[0];
      bases[0] = null;
    }
    bases[0] = { batter, pitcherId: pitcher.id };
    bLine.rbi += rbi;
    text = `${name} bunt valido`;
    kind = 'bunthit';
  } else if (leadIdx >= 0 && roll < probs.hit + probs.fail) {
    // Sacrificio fallito: il corridore di testa viene eliminato, il battitore
    // arriva salvo in prima, gli altri corridori avanzano di una base.
    bLine.ab += 1;
    pLine.outs += 1;
    bases[leadIdx] = null;
    for (let i = leadIdx - 1; i >= 0; i--) {
      if (bases[i]) {
        bases[i + 1] = bases[i];
        bases[i] = null;
      }
    }
    bases[0] = { batter, pitcherId: pitcher.id };
    l.outs += 1;
    text = `${name} bunt, eliminato il corridore di testa`;
    kind = 'buntout';
  } else if (roll < probs.hit + probs.fail + probs.pop) {
    // Pop-out sul bunt: battitore eliminato, corridori fermi.
    bLine.ab += 1;
    pLine.outs += 1;
    l.outs += 1;
    text = `${name} bunt sbagliato, eliminato`;
    kind = 'buntout';
  } else {
    // Sacrificio riuscito: battitore eliminato, corridori +1 base. Nessun AB
    // se c'era davvero un corridore da far avanzare (altrimenti e' un out come
    // gli altri e va addebitato).
    pLine.outs += 1;
    if (leadIdx < 0) bLine.ab += 1;
    let rbi = 0;
    if (bases[2]) {
      scoreRunner(bases[2]);
      bases[2] = null;
      rbi += 1;
    }
    if (bases[1]) {
      bases[2] = bases[1];
      bases[1] = null;
    }
    if (bases[0]) {
      bases[1] = bases[0];
      bases[0] = null;
    }
    bLine.rbi += rbi;
    l.outs += 1;
    text =
      rbi > 0
        ? `${name} sacrificio, il corridore segna`
        : `${name} sacrificio riuscito`;
    kind = 'sacbunt';
  }

  const runsScored = off.runs - runsBefore;
  const rr = runsScored > 0 ? ` (${runsScored} ${runsScored === 1 ? 'punto' : 'punti'})` : '';
  pushPlay(l, text + rr, runsScored, kind, name);
  afterPlay(l, runsScored);
}

/**
 * Probabilita' d'esito di un bunt di sacrificio.
 * hit + fail + pop + sac = 1. Battitore veloce -> piu' bunt validi;
 * lanciatore con buona Difesa -> piu' sacrifici falliti, meno bunt validi.
 */
export function buntOutcomeProbs(
  batter: Batter,
  pitcher: Pitcher,
): { hit: number; fail: number; pop: number; sac: number } {
  const spd = (batter.ratings.speed - 50) / 10;
  const pf = (pitcher.ratings.fielding - 50) / 10;
  const T = TUNING.bunt;
  const hit = clamp(T.hitBase + spd * T.hitPerSpeed - pf * T.hitPerField, T.hitMin, T.hitMax);
  const fail = clamp(T.failBase + pf * T.failPerField, T.failMin, T.failMax);
  const pop = T.popBase;
  const sac = Math.max(0, 1 - hit - fail - pop);
  return { hit, fail, pop, sac };
}

/** Basi (1 o 2) da cui un corridore puo' tentare la rubata in questa situazione. */
export function stealableBases(l: LiveGame): number[] {
  if (l.status !== 'live') return [];
  const out: number[] = [];
  if (l.bases[0] && !l.bases[1]) out.push(1);
  if (l.bases[1] && !l.bases[2]) out.push(2);
  return out;
}

/**
 * Probabilita' di riuscita di una rubata.
 * Velocita' corridore vs Braccio ricevitore + capacita' del lanciatore di
 * tenere i corridori (Difesa). fromBase 2 = rubare la terza (piu' difficile).
 */
export function stealSuccessProb(
  runner: Batter,
  catcher: Batter | undefined,
  pitcher: Pitcher,
  fromBase: 1 | 2,
): number {
  const T = TUNING.steal;
  const spd = (runner.ratings.speed - 50) / 10;
  const arm = ((catcher ? catcher.ratings.arm : 50) - 50) / 10;
  const hold = (pitcher.ratings.fielding - 50) / 10;
  let p =
    T.base +
    spd * T.perSpeed -
    arm * T.perArm -
    hold * T.perHold -
    (fromBase === 2 ? T.stealThirdPenalty : 0);
  return clamp(p, T.min, T.max);
}

/** Tenta una rubata dal base indicato (1 = ruba la 2a, 2 = ruba la 3a). */
export function attemptSteal(l: LiveGame, fromBase: 1 | 2): boolean {
  if (l.status !== 'live') return false;
  const idx = fromBase - 1;
  const toIdx = idx + 1;
  const runner = l.bases[idx];
  if (!runner || l.bases[toIdx]) return false;

  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const catcher = def.team.lineup.find((b) => b.position === 'C');
  const p = stealSuccessProb(runner.batter, catcher, pitcher, fromBase);
  const bLine = off.battingLines.get(runner.batter.id)!;
  const name = shortName(runner.batter.name);
  const baseName = toIdx === 1 ? 'seconda' : 'terza';

  if (l.rng.chance(p)) {
    l.bases[toIdx] = runner;
    l.bases[idx] = null;
    bLine.sb += 1;
    pushPlay(l, `${name} ruba la ${baseName} base`, 0, 'steal', name);
  } else {
    l.bases[idx] = null;
    bLine.cs += 1;
    l.outs += 1;
    const pLine = def.pitchingLines.get(pitcher.id);
    if (pLine) pLine.outs += 1;
    pushPlay(l, `${name} eliminato in rubata`, 0, 'caughtstealing', name);
  }
  afterPlay(l, 0);
  return true;
}

/** Base intenzionale: il battitore va in prima senza rischi (avanzamento forzato). */
export function intentionalWalk(l: LiveGame): void {
  if (l.status !== 'live') return;
  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const batter = off.team.lineup[off.battingIndex];
  off.battingIndex = (off.battingIndex + 1) % off.team.lineup.length;

  def.battersFacedByCurrent += 1;
  const pLine = def.pitchingLines.get(pitcher.id)!;
  pLine.bf += 1;
  const bLine = off.battingLines.get(batter.id)!;

  const runsBefore = off.runs;
  applyEvent(
    'BB',
    batter,
    pitcher.id,
    l.bases,
    l.outs,
    l.rng,
    makeScoreRunner(l, off, def),
    bLine,
    pLine,
  );
  const runsScored = off.runs - runsBefore;
  const rr = runsScored > 0 ? ` (${runsScored} ${runsScored === 1 ? 'punto' : 'punti'})` : '';
  pushPlay(l, `${shortName(batter.name)} — base intenzionale${rr}`, runsScored, 'ibb', shortName(batter.name));
  afterPlay(l, runsScored);
}

/** Condizione per l'hit-and-run: corridore in prima, seconda libera, <2 out. */
export function canHitAndRun(l: LiveGame): boolean {
  return l.status === 'live' && !!l.bases[0] && !l.bases[1] && l.outs < 2;
}

/**
 * Hit-and-run: il corridore in prima parte col lancio e il battitore protegge
 * (bias al contatto). Su groundout evita il doppio gioco e avanza; su singolo
 * vola in terza; su strikeout rischia l'eliminazione in rubata (doppio gioco).
 */
export function hitAndRun(l: LiveGame): boolean {
  if (!canHitAndRun(l)) return false;
  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const batter = off.team.lineup[off.battingIndex];
  off.battingIndex = (off.battingIndex + 1) % off.team.lineup.length;

  def.battersFacedByCurrent += 1;
  const pLine = def.pitchingLines.get(pitcher.id)!;
  pLine.bf += 1;
  const bLine = off.battingLines.get(batter.id)!;
  const scoreRunner = makeScoreRunner(l, off, def);
  const runner1 = l.bases[0]!; // il corridore che parte
  const catcher = def.team.lineup.find((b) => b.position === 'C');
  const name = shortName(batter.name);
  const runsBefore = off.runs;
  const bases = l.bases;

  const { event } = resolveAtBat(batter, pitcher, def.battersFacedByCurrent, l.rng);
  let ev = event;
  // Il battitore protegge: parte degli strikeout diventa palla in gioco.
  if (ev === 'SO') {
    const H = TUNING.hitAndRun;
    const contact = (batter.ratings.contact - 50) / 10;
    const save = clamp(
      H.contactSaveBase + contact * H.contactSavePerContact,
      H.contactSaveMin,
      H.contactSaveMax,
    );
    if (l.rng.chance(save)) ev = 'IPO';
  }

  let text: string;
  let kind: PlayKind;
  if (ev === 'SO') {
    bLine.ab += 1;
    bLine.so += 1;
    pLine.so += 1;
    pLine.outs += 1;
    l.outs += 1;
    const sp = stealSuccessProb(runner1.batter, catcher, pitcher, 1);
    if (l.rng.chance(sp)) {
      bases[1] = runner1;
      bases[0] = null;
      const rl = off.battingLines.get(runner1.batter.id);
      if (rl) rl.sb += 1;
      text = `${name} strikeout, ma il corridore ruba la seconda`;
      kind = 'strikeout';
    } else {
      bases[0] = null;
      l.outs += 1;
      pLine.outs += 1;
      const rl = off.battingLines.get(runner1.batter.id);
      if (rl) rl.cs += 1;
      text = `${name} strikeout e corridore eliminato: doppio gioco`;
      kind = 'gidp';
    }
  } else if (ev === 'IPO') {
    // Groundout col corridore in movimento: niente doppio gioco, avanzamento.
    bLine.ab += 1;
    pLine.outs += 1;
    l.outs += 1;
    if (bases[2]) {
      scoreRunner(bases[2]);
      bases[2] = null;
      bLine.rbi += 1;
    }
    if (!bases[2] && l.rng.chance(TUNING.hitAndRun.firstToThird)) bases[2] = runner1;
    else bases[1] = runner1;
    bases[0] = null;
    text = `${name} eliminato, il corridore avanza in movimento`;
    kind = 'inplayout';
  } else if (ev === '1B') {
    // Singolo con corridore lanciato: dalla prima vola in terza.
    bLine.ab += 1;
    bLine.h += 1;
    pLine.h += 1;
    off.hits += 1;
    if (bases[2]) {
      scoreRunner(bases[2]);
      bases[2] = null;
      bLine.rbi += 1;
    }
    bases[2] = runner1;
    bases[0] = { batter, pitcherId: pitcher.id };
    text = `${name} singolo, il corridore vola in terza`;
    kind = 'single';
  } else {
    // BB/HBP/HR/2B/3B: corsa sulle basi normale.
    const res = applyEvent(ev, batter, pitcher.id, l.bases, l.outs, l.rng, scoreRunner, bLine, pLine);
    l.outs += res.outsAdded;
    if (res.hit) off.hits += 1;
    text = describe(ev, batter, off.runs - runsBefore);
    kind = classifyEvent(ev, res);
  }

  const runsScored = off.runs - runsBefore;
  const rr = runsScored > 0 ? ` (${runsScored} ${runsScored === 1 ? 'punto' : 'punti'})` : '';
  pushPlay(l, text + rr, runsScored, kind, name);
  afterPlay(l, runsScored);
  return true;
}

/** Battitori in panchina disponibili (per il pinch-hit). */
export function benchFor(l: LiveGame): Batter[] {
  return offense(l).team.bench;
}

/**
 * Pinch-hit: sostituisce il battitore corrente con un giocatore di panchina.
 * Non consuma il turno: dopo, il pinch-hitter batte normalmente.
 */
export function pinchHit(l: LiveGame, benchId: string): boolean {
  if (l.status !== 'live') return false;
  const off = offense(l);
  const idx = off.battingIndex;
  const current = off.team.lineup[idx];
  const bi = off.team.bench.findIndex((b) => b.id === benchId);
  if (bi < 0) return false;
  const sub = off.team.bench[bi];
  sub.position = current.position; // eredita il ruolo difensivo dello slot
  off.team.lineup[idx] = sub;
  off.team.bench.splice(bi, 1);
  if (!off.battingLines.has(sub.id)) {
    off.battingLines.set(sub.id, newBattingLine(sub));
    off.battingOrder.push(sub.id);
  }
  pushPlay(l, `${shortName(sub.name)} entra come pinch-hitter per ${shortName(current.name)}`, 0, 'sub', shortName(sub.name));
  return true;
}

/** Attiva/disattiva la difesa avanzata "interni dentro" per il turno. */
export function setInfieldIn(l: LiveGame, on: boolean): void {
  if (l.status === 'live') l.infieldIn = on;
}

/** Rilievi disponibili (non ancora usati) per una squadra in difesa. */
export function availableRelievers(s: SideState): Pitcher[] {
  return s.pitchers.slice(s.pitcherIdx + 1);
}

/** Cambio lanciatore manuale: porta in pedana un rilievo scelto. */
export function changePitcher(l: LiveGame, s: SideState, pitcherId: string): boolean {
  if (l.status !== 'live') return false;
  const j = s.pitchers.findIndex((p, i) => i > s.pitcherIdx && p.id === pitcherId);
  if (j < 0) return false;
  const [p] = s.pitchers.splice(j, 1);
  s.pitchers.splice(s.pitcherIdx + 1, 0, p);
  s.pitcherIdx += 1;
  enterPitcher(l, s);
  return true;
}

/**
 * Micro-evento pre-lancio coi corridori in base (SOLO turni interattivi): puo'
 * scattare un lancio pazzo, una palla passata o un balk. NON consuma il turno:
 * il battitore resta al piatto. Ritorna true solo se qualche corridore ha
 * davvero avanzato (altrimenti il lancio "scappa" ma non cambia nulla).
 *
 * Avanzamento (senza sovrapposizioni: si processa dal corridore di testa):
 *  - **Balk**: avanzamento forzato d'ufficio di una base (regola), il corridore
 *    in terza segna sempre.
 *  - **Lancio pazzo / palla passata**: i corridori indietro avanzano facilmente
 *    di una base *se la base davanti si libera*, ma il corridore in **terza va a
 *    casa solo con una certa probabilita'** (guidata dalla sua Velocita'): e'
 *    l'avanzamento piu' rischioso. Se il corridore in terza tiene, quelli dietro
 *    restano bloccati (niente sovrapposizioni, nessun corridore perso).
 *
 * Non e' mai chiamato dal quick-sim/`autoStep`, quindi l'ordine dell'RNG del
 * turno automatico (Fase 0, calibrazione) resta invariato.
 */
export function prePitchEvent(l: LiveGame): boolean {
  if (l.status !== 'live' || !l.microEvents) return false;
  if (!l.bases.some(Boolean)) return false; // niente corridori: nessun effetto

  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const catcher = def.team.lineup.find((b) => b.position === 'C');
  const T = TUNING.wildPitch;
  const ctrl = (pitcher.ratings.control - 50) / 10;
  const catchField = ((catcher ? catcher.ratings.fielding : 50) - 50) / 10;
  const pWp = clamp(T.wpBase - ctrl * T.wpPerControl, T.wpMin, T.wpMax);
  const pPb = clamp(T.pbBase - catchField * T.pbPerCatch, T.pbMin, T.pbMax);

  const roll = l.rng.next();
  let kind: PlayKind | null = null;
  if (roll < pWp) kind = 'wildpitch';
  else if (roll < pWp + pPb) kind = 'passedball';
  else if (roll < pWp + pPb + T.balk) kind = 'balk';
  if (!kind) return false;

  const scoreRunner = makeScoreRunner(l, off, def);
  const runsBefore = off.runs;
  const bases = l.bases;
  let moved = false;

  // Corridore in terza: verso casa e' l'avanzamento piu' difficile. Il balk lo
  // manda a segno d'ufficio; sul lancio pazzo/palla passata dipende dalla
  // Velocita' del corridore (probabilita' contenuta).
  if (bases[2]) {
    const spd = (bases[2].batter.ratings.speed - 50) / 10;
    const pHome = clamp(T.homeBase + spd * T.homePerSpeed, T.homeMin, T.homeMax);
    if (kind === 'balk' || l.rng.chance(pHome)) {
      scoreRunner(bases[2]);
      bases[2] = null;
      moved = true;
    }
  }
  // I corridori dietro avanzano di una base solo se quella davanti e' libera
  // (niente sovrapposizioni ne' corridori sovrascritti).
  if (bases[1] && !bases[2]) {
    bases[2] = bases[1];
    bases[1] = null;
    moved = true;
  }
  if (bases[0] && !bases[1]) {
    bases[1] = bases[0];
    bases[0] = null;
    moved = true;
  }
  // Il lancio e' scappato ma nessuno ha potuto avanzare: nessun evento, il
  // turno prosegue normalmente col lancio successivo.
  if (!moved) return false;

  const runsScored = off.runs - runsBefore;

  const who =
    kind === 'passedball'
      ? catcher
        ? shortName(catcher.name)
        : def.team.abbrev
      : shortName(pitcher.name);
  const label =
    kind === 'wildpitch' ? 'lancio pazzo' : kind === 'passedball' ? 'palla passata' : 'balk';
  const rr = runsScored > 0 ? ` (${runsScored} ${runsScored === 1 ? 'punto' : 'punti'})` : '';
  pushPlay(l, `${who}: ${label}, i corridori avanzano${rr}`, runsScored, kind, who);
  afterPlay(l, runsScored);
  return true;
}

/** Esegue una tattica offensiva scelta (per la squadra in attacco). */
export function playOffense(l: LiveGame, tactic: OffenseTactic): void {
  if (l.status !== 'live') return;
  // Prima del lancio, coi corridori in base, puo' scattare un micro-evento
  // (lancio pazzo/palla passata/balk): se scatta, il turno non e' consumato.
  if (prePitchEvent(l)) return;
  if (tactic === 'bunt') buntAtBat(l);
  else swingAtBat(l);
}

/** Un passo automatico: la CPU gestisce il lanciatore e batte in swing. */
export function autoStep(l: LiveGame): void {
  if (l.status === 'final') return;
  autoManagePitcher(l, defense(l));
  swingAtBat(l);
}

/** Gestione automatica del solo lanciatore in difesa (CPU avversaria). */
export function autoManageDefense(l: LiveGame): void {
  if (l.status === 'live') autoManagePitcher(l, defense(l));
}

/** Fa girare la partita fino alla fine con la CPU (quick-sim). */
export function quickSim(l: LiveGame): void {
  let guard = 0;
  while (l.status !== 'final' && guard < 100000) {
    autoStep(l);
    guard += 1;
  }
}

// --- Transizioni di stato dopo ogni azione ---------------------------------

function afterPlay(l: LiveGame, _runsScored: number): void {
  updateDecisions(l);
  const off = offense(l);
  const def = defense(l);

  // Walk-off: in fondo dal 9° in poi, appena la casa passa in vantaggio.
  if (l.half === 'bottom' && l.inning >= 9 && off.runs > def.runs) {
    finalize(l);
    return;
  }
  if (l.outs >= 3) endHalf(l);
}

function endHalf(l: LiveGame): void {
  if (l.half === 'top') {
    // La casa non batte in fondo se e' gia' in vantaggio dal 9° in poi.
    if (l.inning >= 9 && l.homeSide.runs > l.awaySide.runs) {
      finalize(l);
      return;
    }
    l.half = 'bottom';
    l.outs = 0;
    l.bases = [null, null, null];
    l.infieldIn = false;
    ensureInningSlot(l.homeSide, l.inning);
  } else {
    if (l.inning >= 9 && l.awaySide.runs !== l.homeSide.runs) {
      finalize(l);
      return;
    }
    l.inning += 1;
    if (l.inning > l.maxInnings) {
      finalize(l);
      return;
    }
    l.half = 'top';
    l.outs = 0;
    l.bases = [null, null, null];
    l.infieldIn = false;
    ensureInningSlot(l.awaySide, l.inning);
  }
}

function finalize(l: LiveGame): void {
  l.status = 'final';
  l.finalInning = Math.min(l.inning, l.maxInnings);
  l.winner = l.homeSide.runs > l.awaySide.runs ? 'home' : 'away';
  computeDecisions(l);
}

/** Aggiorna il "pitcher of record" ad ogni cambio di vantaggio. */
function updateDecisions(l: LiveGame): void {
  const a = l.awaySide.runs;
  const h = l.homeSide.runs;
  const newLeader: 'away' | 'home' | null = a > h ? 'away' : h > a ? 'home' : null;
  if (newLeader && newLeader !== l.leader) {
    const winSide = newLeader === 'away' ? l.awaySide : l.homeSide;
    const loseSide = newLeader === 'away' ? l.homeSide : l.awaySide;
    l.pendingWpSide = newLeader;
    l.pendingWpId = currentPitcher(winSide).id;
    l.pendingLpId = currentPitcher(loseSide).id;
  }
  l.leader = newLeader;
}

/** Assegna W/L/SV a fine partita (con regola dei 5 inning del partente). */
function computeDecisions(l: LiveGame): void {
  if (!l.winner || !l.pendingWpSide || !l.pendingWpId || !l.pendingLpId) return;
  const winSide = l.winner === 'away' ? l.awaySide : l.homeSide;
  const loseSide = l.winner === 'away' ? l.homeSide : l.awaySide;

  let wpId = l.pendingWpId;
  const starter = winSide.pitchersUsed[0];
  if (wpId === starter.id) {
    const sLine = winSide.pitchingLines.get(starter.id)!;
    if (sLine.outs < 15) {
      // Il partente non ha completato 5 inning: la W va al rilievo piu' efficace.
      const relievers = winSide.pitchersUsed.slice(1);
      if (relievers.length > 0) {
        const best = relievers
          .map((p) => winSide.pitchingLines.get(p.id)!)
          .sort((x, y) => y.outs - x.outs || x.er - y.er)[0];
        wpId = best.id;
      }
    }
  }

  const wLine = winSide.pitchingLines.get(wpId);
  if (wLine) wLine.dec = 'W';
  const lLine = loseSide.pitchingLines.get(l.pendingLpId);
  if (lLine) lLine.dec = 'L';

  // Save: il finisher della vincente, diverso dal vincitore, entrato con
  // vantaggio contenuto (1-3 punti).
  const finisher = currentPitcher(winSide);
  if (finisher.id !== wpId) {
    const fLine = winSide.pitchingLines.get(finisher.id)!;
    if (fLine.enteredDiff >= 1 && fLine.enteredDiff <= 3) fLine.dec = 'SV';
  }
}

/** Snapshot leggibile della situazione, per la UI. */
export interface LiveSituation {
  status: 'live' | 'final';
  inning: number;
  half: Half;
  outs: number;
  awayScore: number;
  homeScore: number;
  bases: [boolean, boolean, boolean];
  /** Nomi dei corridori in base (1B, 2B, 3B) o null se libera. Serve alla UI
   *  per mostrare l'etichetta col nome accanto al marker della base. */
  baseRunners: [string | null, string | null, string | null];
  offenseSide: 'away' | 'home';
  battingTeam: Team;
  fieldingTeam: Team;
  batter: Batter;
  pitcher: Pitcher;
  controlledBatting: boolean;
  stealFrom: number[];
  canBunt: boolean;
  canHitAndRun: boolean;
  bench: Batter[];
  infieldIn: boolean;
  relievers: Pitcher[];
  winner?: 'away' | 'home';
}

export function situation(l: LiveGame): LiveSituation {
  const off = offense(l);
  const def = defense(l);
  return {
    status: l.status,
    inning: l.inning,
    half: l.half,
    outs: l.outs,
    awayScore: l.awaySide.runs,
    homeScore: l.homeSide.runs,
    bases: [!!l.bases[0], !!l.bases[1], !!l.bases[2]],
    baseRunners: [
      l.bases[0]?.batter.name ?? null,
      l.bases[1]?.batter.name ?? null,
      l.bases[2]?.batter.name ?? null,
    ],
    offenseSide: l.half === 'top' ? 'away' : 'home',
    battingTeam: off.team,
    fieldingTeam: def.team,
    batter: off.team.lineup[off.battingIndex],
    pitcher: currentPitcher(def),
    controlledBatting: (l.half === 'top' ? 'away' : 'home') === l.controlled,
    stealFrom: stealableBases(l),
    canBunt: l.outs < 2,
    canHitAndRun: canHitAndRun(l),
    bench: off.team.bench,
    infieldIn: l.infieldIn,
    relievers: availableRelievers(def),
    winner: l.winner,
  };
}

/** La squadra in difesa (utile alla UI per i cambi lanciatore). */
export const defenseSide = (l: LiveGame): SideState => defense(l);
export const offenseSide = (l: LiveGame): SideState => offense(l);

/** Costruisce il GameResult dallo stato corrente (per il tabellino). */
export function toGameResult(l: LiveGame): GameResult {
  return {
    away: l.away,
    home: l.home,
    awayStats: buildTeamStats(l.awaySide),
    homeStats: buildTeamStats(l.homeSide),
    play: l.play,
    innings: l.finalInning,
    final: { away: l.awaySide.runs, home: l.homeSide.runs },
    winner: l.winner ?? (l.homeSide.runs > l.awaySide.runs ? 'home' : 'away'),
  };
}

/** Gioca una partita completa in modo deterministico dal seed (CPU vs CPU). */
export function simulateGame(away: Team, home: Team, seed: number): GameResult {
  const live = createLiveGame(away, home, seed);
  quickSim(live);
  return toGameResult(live);
}

// ---------------------------------------------------------------------------
// Applicazione di un esito grezzo allo stato (basi/eliminati) — invariato.
// ---------------------------------------------------------------------------

/** Dettaglio dell'esito in gioco (per la classificazione narrativa). */
type OutDetail = 'gidp' | 'sacfly' | 'infieldhit';

interface EventResult {
  outsAdded: number;
  hit: boolean;
  detail?: OutDetail;
}

/**
 * Traduce l'esito grezzo + il dettaglio dell'azione in una categoria narrabile
 * per il banner di cronaca. Puro, non tocca lo stato.
 */
function classifyEvent(event: RawEvent, res: EventResult): PlayKind {
  switch (event) {
    case 'SO':
      return 'strikeout';
    case 'BB':
      return 'walk';
    case 'HBP':
      return 'hbp';
    case 'HR':
      return 'homerun';
    case '3B':
      return 'triple';
    case '2B':
      return 'double';
    case '1B':
      return 'single';
    case 'IPO':
      if (res.hit) return 'single'; // singolo che passa gli interni
      if (res.detail === 'gidp') return 'gidp';
      if (res.detail === 'sacfly') return 'sacfly';
      return 'inplayout';
  }
}

function applyEvent(
  event: RawEvent,
  batter: Batter,
  pitcherId: string,
  bases: (Runner | null)[],
  outsBefore: number,
  rng: Rng,
  scoreRunner: (r: Runner | null) => void,
  bLine: BattingLine,
  pLine: PitchingLine,
  infieldIn = false,
): EventResult {
  const runner: Runner = { batter, pitcherId };

  switch (event) {
    case 'SO': {
      bLine.ab += 1;
      bLine.so += 1;
      pLine.so += 1;
      pLine.outs += 1;
      return { outsAdded: 1, hit: false };
    }
    case 'BB':
    case 'HBP': {
      if (event === 'BB') {
        bLine.bb += 1;
        pLine.bb += 1;
      }
      // Avanzamento forzato; se le basi sono piene, il corridore in 3B segna.
      if (bases[0] && bases[1] && bases[2]) {
        scoreRunner(bases[2]);
        bLine.rbi += 1;
      }
      if (bases[0] && bases[1]) bases[2] = bases[1];
      if (bases[0]) bases[1] = bases[0];
      bases[0] = runner;
      return { outsAdded: 0, hit: false };
    }
    case 'HR': {
      bLine.ab += 1;
      bLine.h += 1;
      bLine.hr += 1;
      pLine.h += 1;
      pLine.hr += 1;
      let rbi = 1;
      for (let i = 0; i < 3; i++) {
        if (bases[i]) {
          scoreRunner(bases[i]);
          bases[i] = null;
          rbi += 1;
        }
      }
      scoreRunner(runner);
      bLine.rbi += rbi;
      return { outsAdded: 0, hit: true };
    }
    case '3B': {
      bLine.ab += 1;
      bLine.h += 1;
      bLine.triple += 1;
      pLine.h += 1;
      let rbi = 0;
      for (let i = 0; i < 3; i++) {
        if (bases[i]) {
          scoreRunner(bases[i]);
          bases[i] = null;
          rbi += 1;
        }
      }
      bases[2] = runner;
      bLine.rbi += rbi;
      return { outsAdded: 0, hit: true };
    }
    case '2B': {
      bLine.ab += 1;
      bLine.h += 1;
      bLine.double += 1;
      pLine.h += 1;
      let rbi = 0;
      if (bases[2]) {
        scoreRunner(bases[2]);
        bases[2] = null;
        rbi += 1;
      }
      if (bases[1]) {
        scoreRunner(bases[1]);
        bases[1] = null;
        rbi += 1;
      }
      if (bases[0]) {
        bases[2] = bases[0];
        bases[0] = null;
      }
      bases[1] = runner;
      bLine.rbi += rbi;
      return { outsAdded: 0, hit: true };
    }
    case '1B': {
      bLine.ab += 1;
      bLine.h += 1;
      pLine.h += 1;
      let rbi = 0;
      // Corridore in terza: segna sempre.
      if (bases[2]) {
        scoreRunner(bases[2]);
        bases[2] = null;
        rbi += 1;
      }
      // Corridore in seconda: segna spesso, altrimenti avanza in terza.
      if (bases[1]) {
        if (rng.chance(TUNING.runnerScoresFromSecondOnSingle)) {
          scoreRunner(bases[1]);
          rbi += 1;
        } else {
          bases[2] = bases[1];
        }
        bases[1] = null;
      }
      // Corridore in prima: a volte in terza (se libera), di solito in seconda.
      if (bases[0]) {
        if (!bases[2] && rng.chance(TUNING.firstToThirdOnSingle)) bases[2] = bases[0];
        else bases[1] = bases[0];
        bases[0] = null;
      }
      bases[0] = runner;
      bLine.rbi += rbi;
      return { outsAdded: 0, hit: true };
    }
    case 'IPO': {
      bLine.ab += 1;
      // Interni dentro (corridore in terza, <2 out): piu' buchi ma taglia il punto.
      if (infieldIn && bases[2] && outsBefore < 2) {
        if (rng.chance(TUNING.infieldIn.hitThrough)) {
          // Il rimbalzo passa per un singolo: il punto dalla terza segna.
          bLine.h += 1;
          pLine.h += 1;
          scoreRunner(bases[2]);
          bLine.rbi += 1;
          bases[2] = null;
          if (bases[1]) {
            bases[2] = bases[1];
            bases[1] = null;
          }
          if (bases[0]) {
            bases[1] = bases[0];
            bases[0] = null;
          }
          bases[0] = runner;
          return { outsAdded: 0, hit: true, detail: 'infieldhit' };
        }
        // Rimbalzo all'interno tirato dentro: battitore eliminato, corridore
        // tenuto in terza, nessun punto.
        pLine.outs += 1;
        return { outsAdded: 1, hit: false };
      }
      // Doppio gioco: corridore in 1B, meno di 2 out.
      if (bases[0] && outsBefore < 2 && rng.chance(TUNING.gidpProb)) {
        bases[0] = null;
        pLine.outs += 2;
        return { outsAdded: 2, hit: false, detail: 'gidp' };
      }
      pLine.outs += 1;
      // Volata di sacrificio / groundout RBI dalla terza.
      if (bases[2] && outsBefore < 2 && rng.chance(TUNING.runnerScoresFromThirdOnOut)) {
        scoreRunner(bases[2]);
        bases[2] = null;
        bLine.rbi += 1;
        return { outsAdded: 1, hit: false, detail: 'sacfly' };
      }
      return { outsAdded: 1, hit: false };
    }
  }
}

function describe(event: RawEvent, batter: Batter, runs: number): string {
  const name = shortName(batter.name);
  const rr = runs > 0 ? ` (${runs} ${runs === 1 ? 'punto' : 'punti'})` : '';
  switch (event) {
    case 'SO':
      return `${name} elimina al piatto (strikeout)`;
    case 'BB':
      return `${name} guadagna un base ball${rr}`;
    case 'HBP':
      return `${name} colpito dal lancio${rr}`;
    case 'HR':
      return `${name} FUORICAMPO!${rr}`;
    case '3B':
      return `${name} triplo${rr}`;
    case '2B':
      return `${name} doppio${rr}`;
    case '1B':
      return `${name} singolo${rr}`;
    case 'IPO':
      return runs > 0
        ? `${name} eliminato, il corridore segna${rr}`
        : `${name} eliminato in gioco`;
  }
}

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return full;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function buildTeamStats(side: SideState): TeamGameStats {
  return {
    runs: side.runs,
    hits: side.hits,
    errors: 0,
    lineByInning: side.lineByInning.slice(),
    batting: side.battingOrder.map((id) => side.battingLines.get(id)!),
    pitching: side.pitchersUsed.map((p) => side.pitchingLines.get(p.id)!),
  };
}

export type { SideState };
