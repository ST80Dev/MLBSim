import type { Batter, Team, RawEvent, Pitcher } from './types';
import type { Rng } from './rng';
import { makeRng } from './rng';
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

/** Evento di play-by-play. */
export interface PlayEvent {
  inning: number;
  half: Half;
  text: string;
  away: number; // punteggio away dopo l'azione
  home: number; // punteggio home dopo l'azione
  runsScored: number;
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

/** Cambia lanciatore se il corrente ha superato la stamina e c'e' rimpiazzo. */
function maybeChangePitcher(s: SideState): void {
  const p = currentPitcher(s);
  const threshold = p.stamina + (p.role === 'SP' ? 4 : 2);
  if (
    s.battersFacedByCurrent >= threshold &&
    s.pitcherIdx < s.pitchers.length - 1
  ) {
    s.pitcherIdx += 1;
    const next = currentPitcher(s);
    if (!s.pitchingLines.has(next.id)) {
      s.pitchingLines.set(next.id, newPitchingLine(next));
      s.pitchersUsed.push(next);
    }
    s.battersFacedByCurrent = 0;
  }
}

/** Gioca una partita completa in modo deterministico dal seed. */
export function simulateGame(away: Team, home: Team, seed: number): GameResult {
  const rng = makeRng(seed);
  const awaySide = makeSide(away);
  const homeSide = makeSide(home);
  const play: PlayEvent[] = [];

  let inning = 1;
  const MAX_INNINGS = 30; // salvagente

  while (inning <= MAX_INNINGS) {
    playHalf(awaySide, homeSide, inning, 'top', rng, play, false);
    // La casa non batte in fondo al 9°+ se e' gia' in vantaggio.
    if (inning >= 9 && homeSide.runs > awaySide.runs) break;

    playHalf(homeSide, awaySide, inning, 'bottom', rng, play, inning >= 9);
    if (inning >= 9 && awaySide.runs !== homeSide.runs) break;
    inning += 1;
  }

  const awayStats = buildTeamStats(awaySide);
  const homeStats = buildTeamStats(homeSide);
  return {
    away,
    home,
    awayStats,
    homeStats,
    play,
    innings: Math.min(inning, MAX_INNINGS),
    final: { away: awaySide.runs, home: homeSide.runs },
    winner: homeSide.runs > awaySide.runs ? 'home' : 'away',
  };
}

function playHalf(
  offense: SideState,
  defense: SideState,
  inning: number,
  half: Half,
  rng: Rng,
  play: PlayEvent[],
  walkoff: boolean,
): void {
  while (offense.lineByInning.length < inning) offense.lineByInning.push(0);

  let outs = 0;
  const bases: (Runner | null)[] = [null, null, null]; // 1B, 2B, 3B

  const scoreRunner = (r: Runner | null): void => {
    if (!r) return;
    offense.runs += 1;
    offense.lineByInning[inning - 1] += 1;
    const rl = offense.battingLines.get(r.batter.id);
    if (rl) rl.r += 1;
    const pl = defense.pitchingLines.get(r.pitcherId);
    if (pl) {
      pl.r += 1;
      pl.er += 1; // nessun errore in Fase 0 -> tutte earned
    }
  };

  while (outs < 3) {
    maybeChangePitcher(defense);
    const pitcher = currentPitcher(defense);
    const batter = offense.team.lineup[offense.battingIndex];
    offense.battingIndex =
      (offense.battingIndex + 1) % offense.team.lineup.length;

    defense.battersFacedByCurrent += 1;
    const pLine = defense.pitchingLines.get(pitcher.id)!;
    pLine.bf += 1;
    const bLine = offense.battingLines.get(batter.id)!;

    const { event } = resolveAtBat(
      batter,
      pitcher,
      defense.battersFacedByCurrent,
      rng,
    );

    const runsBefore = offense.runs;
    const res = applyEvent(
      event,
      batter,
      pitcher.id,
      bases,
      outs,
      rng,
      scoreRunner,
      bLine,
      pLine,
    );
    outs += res.outsAdded;
    if (res.hit) offense.hits += 1;
    const runsScored = offense.runs - runsBefore;

    play.push({
      inning,
      half,
      text: describe(event, batter, runsScored),
      away: half === 'top' ? offense.runs : defense.runs,
      home: half === 'top' ? defense.runs : offense.runs,
      runsScored,
    });

    if (walkoff && offense.runs > defense.runs) return;
  }
}

interface EventResult {
  outsAdded: number;
  hit: boolean;
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
      // Doppio gioco: corridore in 1B, meno di 2 out.
      if (bases[0] && outsBefore < 2 && rng.chance(TUNING.gidpProb)) {
        bases[0] = null;
        pLine.outs += 2;
        return { outsAdded: 2, hit: false };
      }
      pLine.outs += 1;
      // Volata di sacrificio / groundout RBI dalla terza.
      if (bases[2] && outsBefore < 2 && rng.chance(TUNING.runnerScoresFromThirdOnOut)) {
        scoreRunner(bases[2]);
        bases[2] = null;
        bLine.rbi += 1;
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
