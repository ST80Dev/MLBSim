import type { Batter, Team, RawEvent, Pitcher } from './types';
import type { Rng } from './rng';
import { makeRng, clamp } from './rng';
import { resolveAtBat, platoonAdvantage } from './atbat';
import { TUNING } from './constants';
import { RATING_AVG, pitcherOverall, batterOverall } from './ratings';
import { fieldingAtPosition, realignDefense, canOccupy, type DefMove } from './positions';
import { teamSynthesis, groupDefenseSynthesis, INFIELD_POS, OUTFIELD_POS } from './teamRatings';
import {
  BattingLine,
  PitchingLine,
  newBattingLine,
  newPitchingLine,
} from './boxscore';

export type Half = 'top' | 'bottom';

/** Un corridore in base, col lanciatore responsabile (per gli ER). */
export interface Runner {
  batter: Batter;
  pitcherId: string;
  /** Raggiunta la base per un errore difensivo: se segna, il punto è unearned. */
  reachedViaError?: boolean;
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
  | 'buntfc'
  | 'steal'
  | 'caughtstealing'
  | 'wildpitch'
  | 'passedball'
  | 'balk'
  | 'error'
  | 'sub'
  | 'other';

/** Tipo di battuta su un out in gioco (fonte di verità per cronaca + codice). */
export type BallType = 'ground' | 'fly' | 'popup';

/** Dettaglio dell'out su palla in gioco, così la UI racconta il VERO (non
 *  un'ipotesi): tipo di battuta, se i corridori sono avanzati, se è una scelta
 *  difensiva. Il motore decide; cronaca e codice segnapunti lo leggono. */
export interface OutInfo {
  ball: BallType;
  /** Almeno un corridore è avanzato/segnato sull'out. */
  advanced: boolean;
  /** Scelta difensiva: out su un corridore, battitore salvo in prima. */
  fc?: boolean;
}

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
  /** Solo per gli out su palla in gioco: dettaglio di campo (vedi OutInfo). */
  outInfo?: OutInfo;
  /** Base di destinazione (2 = seconda, 3 = terza) per rubata / eliminato in rubata. */
  base?: number;
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
  /** Errori difensivi commessi da questa squadra quando era in difesa (box: E). */
  errors: number;
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
    errors: 0,
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
export type OffenseTactic = 'swing' | 'bunt' | 'squeeze' | 'flyball';

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
   * Out "cancellati" da errori difensivi in questo mezzo-inning: un errore che
   * evita un out lo incrementa. Serve al conteggio delle corse *unearned* (le
   * corse che segnano quando l'inning, senza l'errore, sarebbe già finito).
   * Azzerato a ogni cambio di mezzo-inning.
   */
  errorOutsThisInning: number;
  /** Difesa "interni a doppio gioco" per il turno corrente (mutuam. escl. con infieldIn). */
  dpDepth: boolean;
  /** Difesa anti-extrabase ("difendi le righe") per il turno corrente. */
  noDoubles: boolean;
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
    errorOutsThisInning: 0,
    infieldIn: false,
    dpDepth: false,
    noDoubles: false,
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

/**
 * Difesa dietro il lanciatore, in sigma per `combineRates`: sintesi difensiva dei
 * 9 schierati (`teamSynthesis().def`, pesata per ruolo, DH escluso) rispetto alla
 * media di lega. >0 = reparto sopra la media (piu' out su palla in gioco). E' la
 * STESSA difesa mostrata nella UI (Roster), cosi' migliorare i difensori si vede
 * davvero sull'ERA. Nessun RNG: sposta solo le soglie. Vedi `TUNING.defense`.
 */
function fieldingSigma(def: SideState): number {
  const entries = def.team.lineup.map((b) => ({ b, pos: b.position }));
  return (teamSynthesis(entries).def - TUNING.defense.neutral) / 10;
}

/**
 * Sigma difensiva del reparto INTERNI (rimbalzi: doppi giochi + errori da terra)
 * rispetto alla media di lega. >0 = interni sopra la media.
 */
function infieldSigma(def: SideState): number {
  const entries = def.team.lineup.map((b) => ({ b, pos: b.position }));
  return (groupDefenseSynthesis(entries, INFIELD_POS) - TUNING.dpRange.neutral) / 10;
}

/**
 * Sigma difensiva del reparto ESTERNI (palle in aria: soppressione extrabase +
 * errori in aria) rispetto alla media di lega. >0 = esterni sopra la media.
 */
function outfieldSigma(def: SideState): number {
  const entries = def.team.lineup.map((b) => ({ b, pos: b.position }));
  return (groupDefenseSynthesis(entries, OUTFIELD_POS) - TUNING.extraBaseDefense.neutral) / 10;
}

/** Fascio difensivo passato al resolver degli out (errori + conversione DP). */
interface DefSig {
  infield: number;
  outfield: number;
}

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
      // Corsa *earned* salvo che: (a) il corridore ha raggiunto la base per un
      // errore, oppure (b) l'inning, senza gli out cancellati da errori, sarebbe
      // già finito (le corse dopo il "terzo out mancato" sono unearned).
      // Approssimazione da simulatore dell'omonima regola ufficiale MLB.
      const earned = !r.reachedViaError && l.outs + l.errorOutsThisInning < 3;
      if (earned) pl.er += 1;
    }
  };
}

function pushPlay(
  l: LiveGame,
  text: string,
  runsScored: number,
  kind: PlayKind = 'other',
  batter?: string,
  outInfo?: OutInfo,
  base?: number,
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
    outInfo,
    base,
  });
}

/** Costruisce l'OutInfo per la UI dall'esito grezzo (solo per gli out in gioco). */
function outInfoFrom(res: EventResult): OutInfo | undefined {
  if (res.hit || res.error || !res.ball) return undefined; // hit/errore non sono out
  return {
    ball: res.ball,
    advanced: !!res.advanced,
    fc: res.detail === 'fc' ? true : undefined,
  };
}

/**
 * Sceglie il rilievo da inserire in base alla SITUAZIONE di partita: ritorna
 * l'indice in `s.pitchers`, o null se non ci sono rilievi disponibili. Uso
 * coerente col ruolo (niente più closer bruciato al 6°):
 *  - situazione da SALVEZZA (dall'8°, vantaggio 1-3 di chi difende): il CLOSER;
 *  - inning presto (≤6): rilievo LUNGO (massima resistenza), copre più strada;
 *  - altrimenti: miglior rilievo corto disponibile (overall).
 * Il closer resta l'ULTIMA risorsa fuori dalle situazioni da salvezza.
 */
function pickReliever(l: LiveGame, s: SideState): number | null {
  const rest: Array<{ p: Pitcher; i: number }> = [];
  for (let i = s.pitcherIdx + 1; i < s.pitchers.length; i++) rest.push({ p: s.pitchers[i], i });
  if (rest.length === 0) return null;

  const oppRuns = (s === l.awaySide ? l.homeSide : l.awaySide).runs;
  const lead = s.runs - oppRuns; // >0 = la squadra in difesa è avanti
  const closers = rest.filter((r) => r.p.role === 'CL');
  const others = rest.filter((r) => r.p.role !== 'CL');
  const saveSituation = l.inning >= 8 && lead >= 1 && lead <= 3;

  if (saveSituation && closers.length) return closers[0].i; // il closer chiude
  if (others.length === 0) return closers[0].i; // solo il closer rimasto

  const best = (key: (p: Pitcher) => number): number =>
    others.reduce((a, b) => (key(b.p) > key(a.p) ? b : a)).i;
  if (l.inning <= 6) return best((p) => p.stamina); // rilievo lungo, presto
  return best((p) => pitcherOverall(p.ratings)); // miglior corto, dopo
}

/**
 * "Hook" sul PARTENTE (oltre l'affaticamento): va tolto se sta andando male —
 *  (a) EMORRAGIA PRECOCE: sotto di molti punti PRIMA del 5° (limita i danni), o
 *  (b) BOMBARDATO: ha subìto troppi punti, a QUALSIASI inning (un manager non
 *      lascia in campo chi prende una valanga anche se non è ancora affaticato).
 * Vale solo per gli SP (un rilievo esce comunque all'affaticamento). Entra un
 * rilievo lungo (`pickReliever`). Vedi `TUNING.earlyHook`.
 */
function starterKnockedOut(l: LiveGame, s: SideState): boolean {
  const p = currentPitcher(s);
  if (p.role !== 'SP') return false;
  const H = TUNING.earlyHook;
  // (a) Emorragia precoce: sotto di deficit+ punti prima del 5°.
  const oppRuns = (s === l.awaySide ? l.homeSide : l.awaySide).runs;
  if (l.inning < H.beforeInning && oppRuns - s.runs >= H.deficit) return true;
  // (b) Bombardato: troppi punti subiti dal partente, a qualsiasi inning.
  const line = s.pitchingLines.get(p.id);
  if (line && line.r >= H.shelledRuns) return true;
  return false;
}

/**
 * Cambio automatico del lanciatore (CPU / quick-sim): entra un rilievo se il
 * lanciatore corrente è affaticato (superata la soglia di battitori) OPPURE se un
 * partente va tolto perché sta andando male (`starterKnockedOut`). Il rilievo è
 * scelto da `pickReliever` (portato in pedana come nel cambio manuale).
 */
function autoManagePitcher(l: LiveGame, s: SideState): void {
  const p = currentPitcher(s);
  const threshold = p.stamina + (p.role === 'SP' ? 4 : 2);
  const fatigued = s.battersFacedByCurrent >= threshold;
  if (!fatigued && !starterKnockedOut(l, s)) return;
  const j = pickReliever(l, s);
  if (j == null) return;
  const [pk] = s.pitchers.splice(j, 1);
  s.pitchers.splice(s.pitcherIdx + 1, 0, pk); // porta il rilievo scelto in pedana
  s.pitcherIdx += 1;
  enterPitcher(l, s);
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

  const defSig: DefSig = { infield: infieldSigma(def), outfield: outfieldSigma(def) };

  const { event: rawEvent } = resolveAtBat(
    batter,
    pitcher,
    def.battersFacedByCurrent,
    l.rng,
    fieldingSigma(def),
    defSig.outfield,
  );

  // Difesa anti-extrabase ("difendi le righe"): parte dei doppi/tripli diventa
  // un singolo. Solo turni interattivi (flag di default false): quando spenta
  // non consuma RNG, quindi il quick-sim e la Fase 0 restano invariati.
  let event = rawEvent;
  if (
    l.noDoubles &&
    (event === '2B' || event === '3B') &&
    l.rng.chance(TUNING.noDoubles.downgrade)
  ) {
    event = '1B';
  }

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
    l.dpDepth,
    false, // seekFly
    defSig,
  );
  l.outs += res.outsAdded;
  if (res.hit) off.hits += 1;
  if (res.error) {
    def.errors += 1; // errore addebitato alla squadra in difesa (box: E)
    l.errorOutsThisInning += 1; // out "mancato": serve al conteggio unearned
  }
  const runsScored = off.runs - runsBefore;

  pushPlay(
    l,
    describe(event, batter, runsScored, res),
    runsScored,
    classifyEvent(event, res),
    shortName(batter.name),
    outInfoFrom(res),
  );
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
    text = `${name} bunt, eliminato il corridore di testa (salvo in prima)`;
    kind = 'buntfc'; // scelta difensiva: battitore SALVO, out sul corridore
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
  const spd = (batter.ratings.speed - RATING_AVG) / 10;
  const pf = (pitcher.ratings.fielding - RATING_AVG) / 10;
  const T = TUNING.bunt;
  const hit = clamp(T.hitBase + spd * T.hitPerSpeed - pf * T.hitPerField, T.hitMin, T.hitMax);
  const fail = clamp(T.failBase + pf * T.failPerField, T.failMin, T.failMax);
  const pop = T.popBase;
  const sac = Math.max(0, 1 - hit - fail - pop);
  return { hit, fail, pop, sac };
}

/** Condizione per lo squeeze: corridore in terza e meno di 2 out. */
export function canSqueeze(l: LiveGame): boolean {
  return l.status === 'live' && !!l.bases[2] && l.outs < 2;
}

/**
 * Squeeze (bunt suicida): il corridore in terza PARTE col lancio. Riusa la
 * ripartizione d'esito del bunt di sacrificio, ma reinterpretata sul corridore
 * lanciato verso casa:
 *  - bunt VALIDO  -> battitore salvo in prima, il corridore SEGNA, gli altri +1;
 *  - SACRIFICIO   -> battitore eliminato, il corridore SEGNA, gli altri +1;
 *  - FALLITO      -> il corridore lanciato e' eliminato a casa, battitore salvo
 *                    in prima (scelta difensiva), gli altri avanzano di una;
 *  - POP          -> disastro: pop preso al volo e corridore doppiato sulla terza
 *                    (doppio gioco), nessun punto.
 * Alto rischio/rendimento, distinto dal sac bunt: qui il punto e' l'obiettivo,
 * ma un bunt sbagliato brucia il corridore in terza.
 */
function squeezeAtBat(l: LiveGame): void {
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
  const bases = l.bases;
  let text: string;
  let kind: PlayKind;

  const advanceTrailers = () => {
    // 2ª -> 3ª, 1ª -> 2ª (la terza e' gia' stata liberata dal corridore lanciato).
    if (bases[1]) {
      bases[2] = bases[1];
      bases[1] = null;
    }
    if (bases[0]) {
      bases[1] = bases[0];
      bases[0] = null;
    }
  };

  if (roll < probs.hit) {
    // Bunt valido: il corridore segna, il battitore e' salvo in prima.
    bLine.ab += 1;
    bLine.h += 1;
    pLine.h += 1;
    off.hits += 1;
    scoreRunner(bases[2]);
    bases[2] = null;
    bLine.rbi += 1;
    advanceTrailers();
    bases[0] = { batter, pitcherId: pitcher.id };
    text = `${name} squeeze! bunt valido, il corridore segna`;
    kind = 'bunthit';
  } else if (roll < probs.hit + probs.fail) {
    // Squeeze fallito: il corridore lanciato e' eliminato a casa, battitore salvo
    // in prima su scelta difensiva; i corridori dietro avanzano di una base.
    bLine.ab += 1;
    pLine.outs += 1;
    bases[2] = null; // eliminato a casa, niente punto
    l.outs += 1;
    advanceTrailers();
    bases[0] = { batter, pitcherId: pitcher.id };
    text = `${name} squeeze sbagliato, il corridore eliminato a casa (battitore salvo in prima)`;
    kind = 'buntfc'; // scelta difensiva: battitore SALVO, out sul corridore a casa
  } else if (roll < probs.hit + probs.fail + probs.pop) {
    // Pop sul bunt: preso al volo, il corridore in terza e' doppiato -> DP.
    bLine.ab += 1;
    pLine.outs += 2;
    bases[2] = null;
    l.outs += 2;
    text = `${name} squeeze disastroso: pop e corridore doppiato in terza`;
    kind = 'gidp';
  } else {
    // Sacrificio riuscito: il corridore segna, il battitore e' eliminato in prima.
    pLine.outs += 1;
    scoreRunner(bases[2]);
    bases[2] = null;
    bLine.rbi += 1;
    advanceTrailers();
    l.outs += 1;
    text = `${name} squeeze riuscito, il corridore segna`;
    kind = 'sacbunt';
  }

  const runsScored = off.runs - runsBefore;
  const rr = runsScored > 0 ? ` (${runsScored} ${runsScored === 1 ? 'punto' : 'punti'})` : '';
  pushPlay(l, text + rr, runsScored, kind, name);
  afterPlay(l, runsScored);
}

/** Condizione per la "cerca fly ball": corridore in terza e meno di 2 out. */
export function canFlyBall(l: LiveGame): boolean {
  return l.status === 'live' && !!l.bases[2] && l.outs < 2;
}

/**
 * Cerca fly ball: col corridore in terza (<2 out) il battitore ELEVA per la
 * volata di sacrificio. Il turno si risolve normalmente (puo' ancora fare valida,
 * BB o strikeout), ma parte del contatto "buono" viene sacrificato per l'aria
 * (un doppio/singolo diventa un out in volata) e ogni out in gioco e' spinto in
 * aria con conversione SF alta -> il punto dalla terza arriva molto piu' spesso,
 * a costo di meno valide. One-shot interattiva: consuma l'RNG solo qui.
 */
function flyBallAtBat(l: LiveGame): void {
  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const batter = off.team.lineup[off.battingIndex];
  off.battingIndex = (off.battingIndex + 1) % off.team.lineup.length;

  def.battersFacedByCurrent += 1;
  const pLine = def.pitchingLines.get(pitcher.id)!;
  pLine.bf += 1;
  const bLine = off.battingLines.get(batter.id)!;

  const { event } = resolveAtBat(
    batter,
    pitcher,
    def.battersFacedByCurrent,
    l.rng,
    fieldingSigma(def),
  );

  // Sell-out per l'elevazione: parte del contatto valido diventa un out in aria
  // (ma il corridore in terza segna). Strikeout e basi restano invariati.
  const F = TUNING.flyBall;
  let ev = event;
  if ((ev === '2B' || ev === '3B') && l.rng.chance(F.extraBaseToFly)) ev = 'IPO';
  else if (ev === '1B' && l.rng.chance(F.singleToFly)) ev = 'IPO';

  const runsBefore = off.runs;
  const res = applyEvent(
    ev,
    batter,
    pitcher.id,
    l.bases,
    l.outs,
    l.rng,
    makeScoreRunner(l, off, def),
    bLine,
    pLine,
    false, // infieldIn
    false, // dpDepth
    true, // seekFly
  );
  l.outs += res.outsAdded;
  if (res.hit) off.hits += 1;
  const runsScored = off.runs - runsBefore;

  pushPlay(
    l,
    describe(ev, batter, runsScored, res),
    runsScored,
    classifyEvent(ev, res),
    shortName(batter.name),
    outInfoFrom(res),
  );
  afterPlay(l, runsScored);
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
  const spd = (runner.ratings.speed - RATING_AVG) / 10;
  const arm = ((catcher ? catcher.ratings.arm : RATING_AVG) - RATING_AVG) / 10;
  const hold = (pitcher.ratings.fielding - RATING_AVG) / 10;
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

  const toBase = toIdx + 1; // 2 = seconda, 3 = terza
  if (l.rng.chance(p)) {
    l.bases[toIdx] = runner;
    l.bases[idx] = null;
    bLine.sb += 1;
    pushPlay(l, `${name} ruba la ${baseName} base`, 0, 'steal', name, undefined, toBase);
  } else {
    l.bases[idx] = null;
    bLine.cs += 1;
    l.outs += 1;
    const pLine = def.pitchingLines.get(pitcher.id);
    if (pLine) pLine.outs += 1;
    pushPlay(l, `${name} eliminato in rubata della ${baseName}`, 0, 'caughtstealing', name, undefined, toBase);
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

/**
 * Condizione per l'hit-and-run: <2 out e c'è un corridore "lanciabile", cioè in
 * 1ª con la 2ª libera OPPURE in 2ª con la 3ª libera (non si manda un corridore su
 * una base occupata). Disponibile quasi sempre che ci sia un corridore da spedire.
 */
export function canHitAndRun(l: LiveGame): boolean {
  if (l.status !== 'live' || l.outs >= 2) return false;
  return (!!l.bases[0] && !l.bases[1]) || (!!l.bases[1] && !l.bases[2]);
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
  const catcher = def.team.lineup.find((b) => b.position === 'C');
  const name = shortName(batter.name);
  const runsBefore = off.runs;
  const bases = l.bases;
  const H = TUNING.hitAndRun;

  // Corridore "lanciato": il più avanzato con la base davanti libera (2ª→3ª ha la
  // priorità: più valore ma più rischio). `canHitAndRun` garantisce che esista.
  const sentIdx = bases[1] && !bases[2] ? 1 : 0;
  const sent = bases[sentIdx]!;
  const toIdx = sentIdx + 1;
  const toBase = toIdx + 1; // 2 = seconda, 3 = terza
  const toName = toIdx === 1 ? 'seconda' : 'terza';
  const sentLine = off.battingLines.get(sent.batter.id);

  const { event } = resolveAtBat(
    batter,
    pitcher,
    def.battersFacedByCurrent,
    l.rng,
    fieldingSigma(def),
  );
  let ev = event;
  // Il battitore protegge: parte degli strikeout diventa palla in gioco.
  if (ev === 'SO') {
    const contact = (batter.ratings.contact - RATING_AVG) / 10;
    const save = clamp(
      H.contactSaveBase + contact * H.contactSavePerContact,
      H.contactSaveMin,
      H.contactSaveMax,
    );
    if (l.rng.chance(save)) ev = 'IPO';
  }

  let text: string;
  let kind: PlayKind;
  let outInfo: OutInfo | undefined;
  let base: number | undefined;

  if (ev === 'SO') {
    // Strikeout: il corridore lanciato tenta comunque la rubata (rischio furto, più
    // alto verso la 3ª). Riuscita = furto; fallita = doppio gioco strike/tiro.
    bLine.ab += 1;
    bLine.so += 1;
    pLine.so += 1;
    pLine.outs += 1;
    l.outs += 1;
    base = toBase;
    const sp = stealSuccessProb(sent.batter, catcher, pitcher, toIdx as 1 | 2);
    if (l.rng.chance(sp)) {
      bases[toIdx] = sent;
      bases[sentIdx] = null;
      if (sentLine) sentLine.sb += 1;
      // Doppio furto: il corridore che segue sale nella base liberata.
      if (sentIdx === 1 && bases[0]) {
        const trail = bases[0];
        bases[1] = trail;
        bases[0] = null;
        const tl = off.battingLines.get(trail.batter.id);
        if (tl) tl.sb += 1;
      }
      text = `${name} strikeout, ma il corridore ruba la ${toName}`;
      kind = 'strikeout';
    } else {
      bases[sentIdx] = null;
      l.outs += 1;
      pLine.outs += 1;
      if (sentLine) sentLine.cs += 1;
      text = `${name} strikeout e corridore eliminato in ${toName}: doppio gioco`;
      kind = 'caughtstealing';
    }
  } else if (ev === 'IPO') {
    // Rimbalzo col corridore in movimento. RISCHIO: la difesa può prenderlo alla
    // base d'arrivo (più probabile dalla 2ª verso la 3ª); altrimenti avanza (no DP).
    bLine.ab += 1;
    l.outs += 1;
    pLine.outs += 1;
    const caught = l.rng.chance(
      sentIdx === 1 ? H.caughtAdvancingFrom2nd : H.caughtAdvancingFrom1st,
    );
    if (caught) {
      // Scelta difensiva sul corridore lanciato: OUT alla base d'arrivo, battitore
      // SALVO in prima; il corridore che segue (se c'è) sale in seconda.
      bases[sentIdx] = null;
      if (sentIdx === 1 && bases[0]) {
        bases[1] = bases[0];
        bases[0] = null;
      }
      bases[0] = { batter, pitcherId: pitcher.id };
      text = `${name} salvo in prima, ma il corridore è eliminato in ${toName}`;
      kind = 'inplayout';
      outInfo = { ball: 'ground', advanced: false, fc: true };
    } else {
      // Battitore eliminato in prima, il corridore avanza (niente doppio gioco).
      if (sentIdx === 1) {
        bases[1] = null;
        bases[2] = sent; // dalla 2ª alla 3ª
        if (bases[0]) {
          bases[1] = bases[0];
          bases[0] = null;
        }
      } else {
        // Corridore in 3ª (caso 1ª+3ª) segna; il lanciato dalla 1ª va in 2ª o 3ª.
        if (bases[2]) {
          scoreRunner(bases[2]);
          bases[2] = null;
          bLine.rbi += 1;
        }
        bases[0] = null;
        if (l.rng.chance(H.firstToThird)) bases[2] = sent;
        else bases[1] = sent;
      }
      text = `${name} eliminato, il corridore avanza in ${toName}`;
      kind = 'inplayout';
      outInfo = { ball: 'ground', advanced: true };
    }
  } else if (ev === '1B') {
    // Singolo col corridore lanciato: dalla 2ª SEGNA, dalla 1ª vola in 3ª.
    bLine.ab += 1;
    bLine.h += 1;
    pLine.h += 1;
    off.hits += 1;
    let rbi = 0;
    if (sentIdx === 1) {
      scoreRunner(sent); // il corridore dalla 2ª segna (lanciato col lancio)
      rbi += 1;
      bases[1] = null;
      if (bases[0]) {
        bases[2] = bases[0]; // il corridore che segue dalla 1ª vola in 3ª
        bases[0] = null;
      }
    } else {
      if (bases[2]) {
        scoreRunner(bases[2]);
        bases[2] = null;
        rbi += 1;
      }
      bases[2] = sent; // dalla 1ª vola in 3ª
      bases[0] = null;
    }
    bases[0] = { batter, pitcherId: pitcher.id };
    bLine.rbi += rbi;
    text =
      sentIdx === 1
        ? `${name} singolo, il corridore segna dalla seconda`
        : `${name} singolo, il corridore vola in terza`;
    kind = 'single';
  } else {
    // BB/HBP/HR/2B/3B: corsa sulle basi normale.
    const res = applyEvent(ev, batter, pitcher.id, l.bases, l.outs, l.rng, scoreRunner, bLine, pLine);
    l.outs += res.outsAdded;
    if (res.hit) off.hits += 1;
    text = describe(ev, batter, off.runs - runsBefore, res);
    kind = classifyEvent(ev, res);
    outInfo = outInfoFrom(res);
  }

  const runsScored = off.runs - runsBefore;
  const rr = runsScored > 0 ? ` (${runsScored} ${runsScored === 1 ? 'punto' : 'punti'})` : '';
  pushPlay(l, text + rr, runsScored, kind, name, outInfo, base);
  afterPlay(l, runsScored);
  return true;
}

/** Battitori in panchina disponibili (per il pinch-hit). */
export function benchFor(l: LiveGame): Batter[] {
  return offense(l).team.bench;
}

/** Cronaca del riassetto difensivo dopo una sostituzione (se qualcuno si è
 *  spostato). Elenca solo gli spostamenti reali; il subentrante è già annunciato
 *  dal suo evento di ingresso. */
function pushRealign(l: LiveGame, moves: DefMove[]): void {
  const shifts = moves.filter((m) => m.to !== m.from);
  if (shifts.length === 0) return;
  const list = shifts.map((m) => `${shortName(m.b.name)} → ${m.to}`).join(', ');
  pushPlay(l, `Riassetto difensivo: ${list}`, 0, 'sub', shortName(shifts[0].b.name));
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
  // Set difensivo VALIDO pre-sostituzione (le stesse caselle da coprire dopo).
  const slots = off.team.lineup.map((b) => b.position);
  off.team.lineup[idx] = sub; // il subentrante conserva il PROPRIO ruolo naturale
  off.team.bench.splice(bi, 1);
  if (!off.battingLines.has(sub.id)) {
    off.battingLines.set(sub.id, newBattingLine(sub));
    off.battingOrder.push(sub.id);
  }
  pushPlay(l, `${shortName(sub.name)} entra come pinch-hitter per ${shortName(current.name)}`, 0, 'sub', shortName(sub.name));
  // Riallinea la difesa: il subentrante va al suo ruolo, gli altri si spostano
  // per coprire (niente casella ereditata a caso).
  pushRealign(l, realignDefense(off.team.lineup, slots));
  return true;
}

/**
 * Sostituzione difensiva: un giocatore di panchina entra al posto di un titolare
 * (in difesa), ereditandone slot in battuta e ruolo. Disponibile in qualsiasi
 * momento (anche fuori dal proprio turno d'attacco). `s` è di norma la squadra
 * in difesa, ma la funzione lavora su qualunque SideState della partita.
 */
export function substituteFielder(
  l: LiveGame,
  s: SideState,
  outId: string,
  inId: string,
  realign = true,
): boolean {
  if (l.status !== 'live') return false;
  const idx = s.team.lineup.findIndex((b) => b.id === outId);
  const bi = s.team.bench.findIndex((b) => b.id === inId);
  if (idx < 0 || bi < 0) return false;
  const outP = s.team.lineup[idx];
  const sub = s.team.bench[bi];
  const slots = s.team.lineup.map((b) => b.position); // set difensivo pre-sostituzione
  s.team.lineup[idx] = sub; // conserva il ruolo naturale del subentrante
  s.team.bench.splice(bi, 1);
  if (!s.battingLines.has(sub.id)) {
    s.battingLines.set(sub.id, newBattingLine(sub));
    s.battingOrder.push(sub.id);
  }
  // `realign` (default): riordina la difesa perché ognuno copra un ruolo che sa
  // giocare (per il pulsante rapido e la CPU). Il pannello Gestione difesa lo
  // disattiva: lì l'utente piazza il subentrante in una casella PRECISA (dropla)
  // e sistema il resto a mano, senza che il riallineamento gli sposti i giocatori.
  if (!realign) {
    sub.position = outP.position; // eredita la casella su cui è stato lasciato
    pushPlay(l, `${shortName(sub.name)} entra in difesa (${sub.position}) per ${shortName(outP.name)}`, 0, 'sub', shortName(sub.name));
    return true;
  }
  // Riallinea PRIMA di annunciare: così il ruolo mostrato è quello reale.
  const moves = realignDefense(s.team.lineup, slots);
  pushPlay(
    l,
    `${shortName(sub.name)} entra in difesa (${sub.position}) per ${shortName(outP.name)}`,
    0,
    'sub',
    shortName(sub.name),
  );
  pushRealign(l, moves.filter((m) => m.b.id !== sub.id));
  return true;
}

/**
 * Scambio di ruolo fra DUE giocatori GIÀ in campo (rotazione difensiva, es. dopo
 * un pinch-run): si scambiano la casella difensiva, mantenendo l'ordine di
 * battuta. Lecito solo se ciascuno può coprire la casella dell'altro
 * (`canOccupy`: naturale, secondaria o DH). Muta `lineup[].position`. Non consuma
 * il turno. Usato dal pannello Gestione difesa (drag&drop). Ritorna false se lo
 * scambio non è valido.
 */
export function swapDefensivePositions(l: LiveGame, s: SideState, idA: string, idB: string): boolean {
  if (l.status !== 'live' || idA === idB) return false;
  const a = s.team.lineup.find((b) => b.id === idA);
  const b = s.team.lineup.find((x) => x.id === idB);
  if (!a || !b) return false;
  const posA = a.position;
  const posB = b.position;
  if (!canOccupy(a, posB) || !canOccupy(b, posA)) return false;
  a.position = posB;
  b.position = posA;
  pushPlay(
    l,
    `Scambio difensivo: ${shortName(a.name)} → ${posB}, ${shortName(b.name)} → ${posA}`,
    0,
    'sub',
    shortName(a.name),
  );
  return true;
}

/**
 * Pinch-runner: un giocatore di panchina rileva un corridore già in base
 * (`base`: 0=1ª, 1=2ª, 2=3ª), ereditandone slot in battuta e ruolo. `s` è la
 * squadra in attacco (proprietaria dei corridori).
 */
export function pinchRun(l: LiveGame, s: SideState, base: number, inId: string): boolean {
  if (l.status !== 'live') return false;
  const runner = l.bases[base];
  if (!runner) return false;
  const outP = runner.batter;
  const bi = s.team.bench.findIndex((b) => b.id === inId);
  if (bi < 0) return false;
  const sub = s.team.bench[bi];
  const idx = s.team.lineup.findIndex((b) => b.id === outP.id);
  let moves: DefMove[] = [];
  if (idx >= 0) {
    const slots = s.team.lineup.map((b) => b.position); // set difensivo pre-sostituzione
    s.team.lineup[idx] = sub; // conserva il ruolo naturale del subentrante
    moves = realignDefense(s.team.lineup, slots);
  }
  s.team.bench.splice(bi, 1);
  if (!s.battingLines.has(sub.id)) {
    s.battingLines.set(sub.id, newBattingLine(sub));
    s.battingOrder.push(sub.id);
  }
  l.bases[base] = { batter: sub, pitcherId: runner.pitcherId };
  pushPlay(
    l,
    `${shortName(sub.name)} entra come pinch-runner per ${shortName(outP.name)}`,
    0,
    'sub',
    shortName(sub.name),
  );
  pushRealign(l, moves);
  return true;
}

/**
 * Riallinea automaticamente la difesa al ruolo migliore (pulsante "Riallinea auto"
 * del pannello Gestione difesa): ognuno alla casella che copre meglio, col minimo
 * di spostamenti. Ritorna true se qualcosa si è mosso.
 */
export function autoRealignDefense(l: LiveGame, s: SideState): boolean {
  if (l.status !== 'live') return false;
  const slots = s.team.lineup.map((b) => b.position);
  const moves = realignDefense(s.team.lineup, slots);
  if (moves.length) pushRealign(l, moves);
  return moves.length > 0;
}

/** Attiva/disattiva la difesa avanzata "interni dentro" per il turno. */
export function setInfieldIn(l: LiveGame, on: boolean): void {
  if (l.status !== 'live') return;
  l.infieldIn = on;
  if (on) l.dpDepth = false; // interni dentro e a DP si escludono
}

/** Attiva/disattiva la difesa "interni a doppio gioco" per il turno. */
export function setDpDepth(l: LiveGame, on: boolean): void {
  if (l.status !== 'live') return;
  l.dpDepth = on;
  if (on) l.infieldIn = false; // interni a DP e dentro si escludono
}

/** Attiva/disattiva la difesa anti-extrabase ("difendi le righe") per il turno. */
export function setNoDoubles(l: LiveGame, on: boolean): void {
  if (l.status === 'live') l.noDoubles = on;
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
  const ctrl = (pitcher.ratings.control - RATING_AVG) / 10;
  const catchField = ((catcher ? catcher.ratings.fielding : RATING_AVG) - RATING_AVG) / 10;
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
    const spd = (bases[2].batter.ratings.speed - RATING_AVG) / 10;
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
  else if (tactic === 'squeeze') squeezeAtBat(l);
  else if (tactic === 'flyball') flyBallAtBat(l);
  else swingAtBat(l);
}

/**
 * Turno d'attacco della CPU nel gioco INTERATTIVO (quando l'umano difende). A
 * differenza del quick-sim (`autoStep`, swing puro), qui la CPU puo' fare
 * small-ball: rubata / bunt di sacrificio / hit-and-run, con probabilita' guidate
 * dalle doti e dal contesto. Consuma l'RNG SOLO in questo ramo interattivo: il
 * quick-sim e la Fase 0 non lo chiamano mai e restano invariati.
 */
export function cpuOffenseTurn(l: LiveGame): void {
  if (l.status !== 'live') return;
  if (prePitchEvent(l)) return; // micro-eventi pre-lancio come in playOffense
  cpuMaybePinchRun(l); // rimpiazza un corridore lento (non consuma il turno)
  cpuMaybePinchHit(l); // rimpiazza un battitore debole (poi il PH batte)
  if (cpuTryTactic(l)) return; // ha eseguito una tattica (rubata/bunt/h&r)
  swingAtBat(l);
}

/**
 * Pinch-hit della CPU: tardo-gara e gara in bilico, sostituisce un titolare debole
 * col miglior battitore di panchina (incluso il vantaggio di platoon contro la mano
 * del lanciatore), se il guadagno è netto. Non consuma il turno: poi il PH batte.
 */
function cpuMaybePinchHit(l: LiveGame): boolean {
  const B = TUNING.cpuBench;
  if (l.inning < B.phMinInning) return false;
  const off = offense(l);
  if (off.team.bench.length === 0) return false;
  const cur = off.team.lineup[off.battingIndex];
  if (batterOverall(cur.ratings) >= B.phMaxStarterOvr) return false; // titolare valido: resta
  if (Math.abs(off.runs - defense(l).runs) > B.phMaxDeficit) return false; // solo gara in bilico
  const risp = !!l.bases[1] || !!l.bases[2];
  if (!risp && l.inning < B.phLateInning) return false; // serve RISP o gara molto avanti
  const pitcher = currentPitcher(defense(l));
  const score = (b: Batter) =>
    batterOverall(b.ratings) + (platoonAdvantage(b, pitcher) ? B.phPlatoonBonus : 0);
  const best = off.team.bench.reduce((a, b) => (score(b) > score(a) ? b : a));
  if (score(best) - score(cur) < B.phMinGain) return false;
  return pinchHit(l, best.id);
}

/**
 * Pinch-runner della CPU: tardo-gara e gara tirata, rimpiazza un corridore LENTO in
 * base col velocista di panchina, se il guadagno di velocità è netto. Non consuma
 * il turno. Parte dal corridore di testa (più avanti = più prezioso).
 */
function cpuMaybePinchRun(l: LiveGame): boolean {
  const B = TUNING.cpuBench;
  if (l.inning < B.prMinInning) return false;
  const off = offense(l);
  if (off.team.bench.length === 0) return false;
  if (Math.abs(off.runs - defense(l).runs) > B.prMaxDeficit) return false;
  const fast = off.team.bench.reduce((a, b) => (b.ratings.speed > a.ratings.speed ? b : a));
  for (let base = 2; base >= 0; base--) {
    const r = l.bases[base];
    if (!r) continue;
    if (r.batter.ratings.speed >= B.prMaxRunnerSpeed) continue; // già veloce
    if (fast.ratings.speed - r.batter.ratings.speed >= B.prMinSpeedGain) {
      return pinchRun(l, off, base, fast.id);
    }
  }
  return false;
}

/**
 * Sostituzione difensiva della CPU: tardo-gara proteggendo un vantaggio risicato,
 * toglie un titolare con difesa scarsa alla sua casella per un panchinaro nettamente
 * migliore col guanto (accetta il downgrade in battuta pur di blindare la difesa).
 */
function cpuMaybeDefensiveSub(l: LiveGame): boolean {
  const B = TUNING.cpuBench;
  if (l.inning < B.defSubMinInning) return false;
  const def = defense(l);
  const lead = def.runs - offense(l).runs;
  if (lead < 1 || lead > B.defSubLeadMax) return false; // solo un vantaggio piccolo
  if (def.team.bench.length === 0) return false;
  let best: { outId: string; inId: string; gain: number } | null = null;
  for (const starter of def.team.lineup) {
    if (starter.position === 'P' || starter.position === 'DH') continue;
    const curField = fieldingAtPosition(starter, starter.position);
    if (curField >= B.defSubMaxStarterField) continue; // difesa già buona: resta
    for (const sub of def.team.bench) {
      const gain = fieldingAtPosition(sub, starter.position) - curField;
      if (gain >= B.defSubMinGain && (!best || gain > best.gain)) {
        best = { outId: starter.id, inId: sub.id, gain };
      }
    }
  }
  return best ? substituteFielder(l, def, best.outId, best.inId) : false;
}

/** Bunt di sacrificio sensato per la CPU: nessun out, corridore in 1ª o 2ª. */
function canSacBunt(l: LiveGame): boolean {
  return l.outs === 0 && (!!l.bases[0] || !!l.bases[1]);
}

/**
 * Decisione small-ball della CPU. Ritorna true se ha eseguito una tattica (il
 * turno e' consumato), false se conviene battere normale. Ordine: rubata ->
 * bunt -> hit-and-run. Le soglie stanno in `TUNING.cpuTactics`.
 */
function cpuTryTactic(l: LiveGame): boolean {
  const T = TUNING.cpuTactics;
  const off = offense(l);
  const def = defense(l);
  const pitcher = currentPitcher(def);
  const catcher = def.team.lineup.find((b) => b.position === 'C');
  const batter = off.team.lineup[off.battingIndex];
  const diff = off.runs - def.runs; // dal punto di vista dell'attacco
  const late = l.inning >= 7;
  const close = Math.abs(diff) <= 2;

  // 1) Rubata: corridori che possono partire (1ª->2ª, 2ª->3ª), corridore veloce
  //    con buone chance. Piu' probabile a fine gara equilibrata; rara in blowout.
  for (const fromBase of stealableBases(l)) {
    const runner = l.bases[fromBase - 1]!.batter;
    if (runner.ratings.speed < T.stealMinSpeed) continue;
    const prob = stealSuccessProb(runner, catcher, pitcher, fromBase as 1 | 2);
    if (prob < T.stealMinProb) continue;
    let go = T.stealBase + ((runner.ratings.speed - RATING_AVG) / 10) * T.stealPerSpeed;
    if (late && close) go += T.stealLateBonus;
    if (diff > 3 || diff < -4) go *= 0.3; // partita spaccata: pochi rischi
    if (l.rng.chance(clamp(go, 0, T.stealMax))) {
      return attemptSteal(l, fromBase as 1 | 2);
    }
  }

  // 2) Cerca fly ball: corridore in terza, <2 out, gara in bilico. Gli slugger
  //    tentano il colpo (swing), i battitori normali cercano il fly di servizio.
  if (l.bases[2] && l.outs < 2 && close && batter.ratings.power < T.flySkipPower) {
    if (l.rng.chance(T.flyProb)) {
      flyBallAtBat(l);
      return true;
    }
  }

  // 3) Bunt di sacrificio: 0 out, corridore in 1ª/2ª, battitore debole, gara in
  //    bilico (muovere il corridore vale il costo dell'out).
  if (canSacBunt(l) && close) {
    const hitter = (batter.ratings.power + batter.ratings.contact) / 2;
    if (hitter <= T.buntMaxHitter && l.rng.chance(T.buntProb)) {
      buntAtBat(l);
      return true;
    }
  }

  // 4) Hit-and-run: corridore in 1ª, 2ª libera, <2 out, battitore con buon
  //    contatto (protegge il corridore lanciato).
  if (canHitAndRun(l) && batter.ratings.contact >= T.hnrMinContact) {
    if (l.rng.chance(T.hnrProb)) return hitAndRun(l);
  }

  return false;
}

/** Un passo automatico: la CPU gestisce il lanciatore e batte in swing. */
export function autoStep(l: LiveGame): void {
  if (l.status === 'final') return;
  autoManagePitcher(l, defense(l));
  swingAtBat(l);
}

/**
 * Gestione automatica della difesa CPU (avversaria): cambio lanciatore per
 * affaticamento/partente KO e, tardo-gara proteggendo un vantaggio, sostituzioni
 * difensive dalla panchina. Solo gioco interattivo (mai nel quick-sim).
 */
export function autoManageDefense(l: LiveGame): void {
  if (l.status !== 'live') return;
  autoManagePitcher(l, defense(l));
  cpuMaybeDefensiveSub(l);
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
    l.errorOutsThisInning = 0;
    l.bases = [null, null, null];
    l.infieldIn = false;
    l.dpDepth = false;
    l.noDoubles = false;
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
    l.errorOutsThisInning = 0;
    l.bases = [null, null, null];
    l.infieldIn = false;
    l.dpDepth = false;
    l.noDoubles = false;
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
  /** Velocità (VEL) dei corridori in base, allineata a `baseRunners`: la UI la
   *  mostra come card-dote accanto al nome per riconoscere il tipo di corridore. */
  baseRunnerSpeeds: [number | null, number | null, number | null];
  offenseSide: 'away' | 'home';
  battingTeam: Team;
  fieldingTeam: Team;
  batter: Batter;
  pitcher: Pitcher;
  controlledBatting: boolean;
  stealFrom: number[];
  canBunt: boolean;
  canHitAndRun: boolean;
  canSqueeze: boolean;
  canFlyBall: boolean;
  bench: Batter[];
  infieldIn: boolean;
  dpDepth: boolean;
  noDoubles: boolean;
  /** Corridore in prima e <2 out: ha senso schierare gli interni a doppio gioco. */
  canDpDepth: boolean;
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
    baseRunnerSpeeds: [
      l.bases[0]?.batter.ratings.speed ?? null,
      l.bases[1]?.batter.ratings.speed ?? null,
      l.bases[2]?.batter.ratings.speed ?? null,
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
    canSqueeze: canSqueeze(l),
    canFlyBall: canFlyBall(l),
    bench: off.team.bench,
    infieldIn: l.infieldIn,
    dpDepth: l.dpDepth,
    noDoubles: l.noDoubles,
    canDpDepth: !!l.bases[0] && l.outs < 2,
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
type OutDetail = 'gidp' | 'sacfly' | 'infieldhit' | 'dphole' | 'fc';

interface EventResult {
  outsAdded: number;
  hit: boolean;
  detail?: OutDetail;
  /** Tipo di battuta e avanzamenti (per gli out su palla in gioco). */
  ball?: BallType;
  advanced?: boolean;
  /** L'out è saltato per un errore difensivo (reached-on-error). */
  error?: boolean;
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
      if (res.error) return 'error';
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
  dpDepth = false,
  seekFly = false,
  defSig?: DefSig,
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
    case 'IPO':
      return resolveInPlayOut(runner, bases, outsBefore, rng, scoreRunner, bLine, pLine, infieldIn, dpDepth, seekFly, defSig);
  }
}

/**
 * Out su palla in gioco: decide tipo di battuta (rimbalzo / volata / presa) e i
 * relativi effetti REALI sui corridori, oltre il semplice "battitore eliminato".
 * Copre: doppio gioco, scelta difensiva (out sul corridore, battitore salvo),
 * out produttivo (avanzamento 1ª→2ª / 2ª→3ª sui rimbalzi), volata di sacrificio
 * e groundout RBI dalla 3ª, tag-up 2ª→3ª sulle volate profonde. Le probabilità
 * stanno in TUNING.outField e sono tarate sui test di realismo.
 */
export function resolveInPlayOut(
  runner: Runner,
  bases: (Runner | null)[],
  outsBefore: number,
  rng: Rng,
  scoreRunner: (r: Runner | null) => void,
  bLine: BattingLine,
  pLine: PitchingLine,
  infieldIn: boolean,
  dpDepth = false,
  seekFly = false,
  defSig?: DefSig,
): EventResult {
  bLine.ab += 1;
  const canAct = outsBefore < 2; // avanzamenti/DP/SF solo con meno di 2 out
  const O = TUNING.outField;

  // Cerca fly ball (tattica offensiva, corridore in terza): il battitore ELEVA.
  // La palla va quasi sempre in aria; una volata profonda porta a casa il
  // corridore (conversione SF alta). One-shot interattiva: il quick-sim non passa
  // mai seekFly, quindi Fase 0 e sim di lega restano invariate.
  if (seekFly) {
    pLine.outs += 1;
    const F = TUNING.flyBall;
    if (!rng.chance(F.flyShare)) {
      // Elevazione mancata: presa comoda d'interno, i corridori restano fermi.
      return { outsAdded: 1, hit: false, ball: 'popup', advanced: false };
    }
    let advanced = false;
    let detail: OutDetail | undefined;
    if (bases[2] && canAct && rng.chance(F.sacflyConv)) {
      scoreRunner(bases[2]);
      bases[2] = null;
      bLine.rbi += 1;
      advanced = true;
      detail = 'sacfly';
    }
    if (bases[1] && !bases[2] && canAct && rng.chance(O.tagUpSecondToThirdOnFly)) {
      bases[2] = bases[1];
      bases[1] = null;
      advanced = true;
    }
    return { outsAdded: 1, hit: false, ball: 'fly', advanced, detail };
  }

  // Interni dentro (corridore in terza, <2 out): più buchi ma taglia il punto.
  if (infieldIn && bases[2] && canAct) {
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
      return { outsAdded: 0, hit: true, detail: 'infieldhit', ball: 'ground', advanced: true };
    }
    // Rimbalzo tirato dentro: battitore eliminato, corridore tenuto in terza.
    pLine.outs += 1;
    return { outsAdded: 1, hit: false, ball: 'ground', advanced: false };
  }

  // Tipo di battuta: rimbalzo, oppure palla in aria (presa comoda o volata).
  const ground = rng.chance(O.groundShare);
  const ball: BallType = ground ? 'ground' : rng.chance(O.popupShareOfAir) ? 'popup' : 'fly';

  // ERRORE difensivo: il fielder coinvolto (interni sul rimbalzo, esterni in aria)
  // può sbagliare la giocata. Guidato dal fielding del reparto (difesa scarsa =
  // più errori). Consuma RNG solo quando `defSig` è fornito (dal turno swing, cioè
  // dal quick-sim e dal gioco normale): i test che chiamano `resolveInPlayOut`
  // senza `defSig` non lo tirano, restando invariati. Il battitore raggiunge la
  // prima, i corridori avanzano di una, l'eventuale punto è unearned.
  if (defSig) {
    const E = TUNING.errors;
    const sig = ball === 'ground' ? defSig.infield : defSig.outfield;
    const pErr = clamp(E.base - sig * E.perSigma, E.min, E.max);
    if (rng.chance(pErr)) {
      if (bases[2]) {
        // Il punto segnato SULL'errore è unearned: lo marchiamo come tale.
        scoreRunner({ ...bases[2], reachedViaError: true });
        bases[2] = null;
      }
      if (bases[1]) {
        bases[2] = bases[1];
        bases[1] = null;
      }
      if (bases[0]) {
        bases[1] = bases[0];
        bases[0] = null;
      }
      bases[0] = { ...runner, reachedViaError: true };
      return { outsAdded: 0, hit: false, error: true, ball, advanced: true };
    }
  }

  if (ball === 'ground') {
    // Interni a doppio gioco (flag interattivo): col corridore in 1ª (<2 out) la
    // difesa e' schierata per il DP -> piu' conversione, ma qualche rimbalzo passa
    // nei buchi per un singolo. Il flag e' false di default: quando spento il
    // ramo NON consuma RNG, quindi il quick-sim e la Fase 0 restano invariati.
    if (dpDepth && bases[0] && canAct && rng.chance(TUNING.dpDepth.hitThrough)) {
      bLine.h += 1;
      pLine.h += 1;
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
      bases[0] = runner;
      bLine.rbi += rbi;
      return { outsAdded: 0, hit: true, detail: 'dphole', ball: 'ground', advanced: true };
    }
    // Doppio gioco: corridore in 1ª, <2 out. Prob. boostata se interni a DP
    // (tattica) e modulata dal RANGE degli interni schierati (layer per-fielder:
    // interni migliori convertono più DP, peggiori meno; neutro = no-op).
    let gidp = dpDepth ? TUNING.gidpProb + TUNING.dpDepth.gidpBonus : TUNING.gidpProb;
    if (defSig) {
      const R = TUNING.dpRange;
      gidp += clamp(defSig.infield * R.perSigma, -R.maxBonus, R.maxBonus);
    }
    if (bases[0] && canAct && rng.chance(gidp)) {
      bases[0] = null;
      pLine.outs += 2;
      return { outsAdded: 2, hit: false, detail: 'gidp', ball: 'ground', advanced: false };
    }
    pLine.outs += 1;
    // Scelta difensiva: corridore in 2ª, 1ª e 3ª libere → eliminato verso la 3ª,
    // battitore salvo in prima.
    if (bases[1] && !bases[0] && !bases[2] && canAct && rng.chance(O.fielderChoiceLeadRunner)) {
      bases[1] = null;
      bases[0] = runner;
      return { outsAdded: 1, hit: false, detail: 'fc', ball: 'ground', advanced: false };
    }
    // Battitore eliminato in prima: avanzamenti dei corridori (solo <2 out — col
    // 3° out l'azione si chiude e nulla conta). Distinguiamo i corridori FORZATI
    // dal battitore-corridore (avanzano SEMPRE se la base davanti è libera) da
    // quelli non forzati (out "produttivo", solo con una certa probabilità).
    let advanced = false;
    if (canAct) {
      const on1 = !!bases[0];
      const on2 = !!bases[1];
      const on3 = !!bases[2];
      const forced2 = on2 && on1; // la 2ª è forzata se la 1ª è occupata
      const forced3 = on3 && on1 && on2; // la 3ª è forzata a basi piene
      // 3ª base: segna se forzata (basi piene) o su contatto/concessione (~prob).
      if (bases[2] && (forced3 || rng.chance(TUNING.runnerScoresFromThirdOnOut))) {
        scoreRunner(bases[2]);
        bases[2] = null;
        bLine.rbi += 1;
        advanced = true;
      }
      // 2ª → 3ª: se la 3ª è libera, forzata (deterministica) o produttiva (~prob).
      if (bases[1] && !bases[2] && (forced2 || rng.chance(O.productiveAdvanceOnGrounder))) {
        bases[2] = bases[1];
        bases[1] = null;
        advanced = true;
      }
      // 1ª → 2ª: il corridore in 1ª è SEMPRE forzato dal battitore eliminato in
      // prima; avanza se la 2ª è libera (prima restava fermo ~2 volte su 3: bug).
      if (bases[0] && !bases[1]) {
        bases[1] = bases[0];
        bases[0] = null;
        advanced = true;
      }
    }
    return { outsAdded: 1, hit: false, ball: 'ground', advanced };
  }

  // Palla in aria.
  pLine.outs += 1;
  if (ball === 'popup') {
    // Presa comoda d'interno: i corridori restano fermi.
    return { outsAdded: 1, hit: false, ball: 'popup', advanced: false };
  }
  // Volata profonda: possibili punto dalla 3ª (SF) e tag-up dalla 2ª.
  let advanced = false;
  let detail: OutDetail | undefined;
  if (bases[2] && canAct && rng.chance(TUNING.runnerScoresFromThirdOnOut)) {
    scoreRunner(bases[2]);
    bases[2] = null;
    bLine.rbi += 1;
    advanced = true;
    detail = 'sacfly';
  }
  if (bases[1] && !bases[2] && canAct && rng.chance(O.tagUpSecondToThirdOnFly)) {
    bases[2] = bases[1];
    bases[1] = null;
    advanced = true;
  }
  return { outsAdded: 1, hit: false, ball: 'fly', advanced, detail };
}

function describe(event: RawEvent, batter: Batter, runs: number, res?: EventResult): string {
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
    case 'IPO': {
      if (res?.error) return `${name} raggiunge la prima su errore${rr}`;
      if (res?.detail === 'gidp') return `${name} in doppio gioco`;
      if (res?.detail === 'infieldhit' || res?.detail === 'dphole')
        return `${name} singolo che passa gli interni${rr}`;
      if (res?.detail === 'fc') return `${name} in prima su scelta difensiva, corridore eliminato`;
      if (res?.detail === 'sacfly') return `${name} volata di sacrificio${rr}`;
      if (runs > 0) return `${name} eliminato, il corridore segna${rr}`;
      if (res?.advanced) return `${name} eliminato, i corridori avanzano`;
      return `${name} eliminato in gioco`;
    }
  }
}

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/);
  // Cognome in MAIUSCOLO (riconoscibilità a colpo d'occhio nella cronaca).
  if (parts.length === 1) return full.toUpperCase();
  return `${parts[0][0]}. ${parts.slice(1).join(' ').toUpperCase()}`;
}

function buildTeamStats(side: SideState): TeamGameStats {
  // Copie: `GameResult` è uno SNAPSHOT immutabile, non una finestra sullo stato
  // vivo. Le BattingLine/PitchingLine sono mutate in place dal motore a ogni
  // turno; senza copiarle, un risultato "congelato" dalla UI (es. lo scoreboard
  // ritardato al verdetto della cronaca) verrebbe comunque mutato PRIMA del
  // reveal. Gli oggetti riga sono piatti (solo primitivi): copia shallow basta.
  return {
    runs: side.runs,
    hits: side.hits,
    errors: side.errors,
    lineByInning: side.lineByInning.slice(),
    batting: side.battingOrder.map((id) => ({ ...side.battingLines.get(id)! })),
    pitching: side.pitchersUsed.map((p) => ({ ...side.pitchingLines.get(p.id)! })),
  };
}

export type { SideState };
