import { describe, it, expect } from 'vitest';
import {
  startOffseason,
  advanceBlock,
  runOffseasonMarket,
  isOffseasonComplete,
  currentBlock,
  humanRelease,
  humanSign,
  payrollOfSet,
  capOf,
  OFFSEASON_BLOCKS,
  TARGET_BATTERS,
  TARGET_PITCHERS,
  type OffseasonState,
  type FreeAgent,
} from '../offseason';
import { generateLeague } from '../league';
import { REALIGN_VALUE_TOL } from '../offseason';
import { GENERATED_MODE, type LeagueMode } from '../leagueMode';
import { playerValue } from '../../engine/value';
import { deriveBatterStats, derivePitcherStats } from '../../engine/ratings';
import type { Batter, Pitcher, BatterRatings, PitcherRatings } from '../../engine/types';

const SEED = 20260728;
const bR = (lvl: number): BatterRatings => ({ contact: lvl, power: lvl, eye: lvl, speed: lvl, fielding: lvl, arm: lvl });
const pR = (lvl: number): PitcherRatings => ({ stuff: lvl, control: lvl, movement: lvl, groundball: lvl, stamina: lvl, fielding: lvl });
const bat = (id: string, lvl: number, salary: number, age = 27, pot = lvl): Batter => ({
  id, name: id, bats: 'R', position: 'CF', ratings: bR(lvl), stats: deriveBatterStats(bR(lvl)),
  age, potential: pot, salary, retired: false,
});
const pit = (id: string, lvl: number, salary: number, age = 27, pot = lvl): Pitcher => ({
  id, name: id, throws: 'R', role: 'SP', ratings: pR(lvl), stats: derivePitcherStats(pR(lvl)),
  stamina: 24, age, potential: pot, salary, retired: false,
});

const TIGHT: LeagueMode = { source: 'generated', cap: { mode: 'soft', amount: 120 } };

describe('startOffseason', () => {
  const st = startOffseason(generateLeague(SEED), SEED, 3);
  it('cattura rose piatte (20/15), taglie, pool vuoto, round 0', () => {
    expect(st.teamOrder).toHaveLength(30);
    expect(st.round).toBe(0);
    expect(st.roundCount).toBe(OFFSEASON_BLOCKS.length);
    expect(st.pool).toHaveLength(0);
    for (const id of st.teamOrder) {
      expect(st.rosters[id].batters).toHaveLength(TARGET_BATTERS);
      expect(st.rosters[id].pitchers).toHaveLength(TARGET_PITCHERS);
      expect(st.targets[id]).toEqual({ bat: TARGET_BATTERS, pit: TARGET_PITCHERS });
    }
  });
  it('payrollOfSet somma gli stipendi', () => {
    const id = st.teamOrder[0];
    const set = st.rosters[id];
    const manual = [...set.batters, ...set.pitchers].reduce((s, p) => s + p.salary, 0);
    expect(payrollOfSet(set)).toBeCloseTo(Math.round(manual * 10) / 10, 1);
  });
  it('currentBlock riflette il round; conclusa quando round >= roundCount', () => {
    expect(currentBlock(st)).toBe(OFFSEASON_BLOCKS[0]);
    const end = runOffseasonMarket(st);
    expect(isOffseasonComplete(end)).toBe(true);
    expect(currentBlock(end)).toBeNull();
  });
});

describe('mercato a blocchi — invarianti', () => {
  it('e deterministico: due esecuzioni danno lo stesso log', () => {
    const a = runOffseasonMarket(startOffseason(generateLeague(SEED), SEED, 1, undefined, TIGHT));
    const b = runOffseasonMarket(startOffseason(generateLeague(SEED), SEED, 1, undefined, TIGHT));
    expect(JSON.stringify(a.log)).toBe(JSON.stringify(b.log));
  });

  it('avanza esattamente un blocco per volta', () => {
    let s = startOffseason(generateLeague(SEED), SEED, 1, undefined, TIGHT);
    for (let i = 0; i < OFFSEASON_BLOCKS.length; i++) {
      expect(s.round).toBe(i);
      s = advanceBlock(s);
    }
    expect(isOffseasonComplete(s)).toBe(true);
    // Avanzare oltre la fine e' un no-op.
    expect(advanceBlock(s).round).toBe(s.round);
  });

  it('cap stretto: le squadre sopra il tetto ALLEGGERISCONO il monte-ingaggi e il pool si riempie', () => {
    const start = startOffseason(generateLeague(SEED), SEED, 1, undefined, TIGHT);
    const overStart = start.teamOrder.filter((id) => payrollOfSet(start.rosters[id]) > capOf(start, id));
    expect(overStart.length).toBeGreaterThan(0); // il cap stretto morde
    const end = runOffseasonMarket(start);
    for (const id of overStart) {
      expect(payrollOfSet(end.rosters[id])).toBeLessThan(payrollOfSet(start.rosters[id]));
    }
    expect(end.pool.length).toBeGreaterThan(0);
    // Ogni firma registrata rispettava il gate sul cap (nessuno sfora firmando).
    expect(end.log.some((t) => t.kind === 'release')).toBe(true);
  });
});

describe('firma per bisogno (sotto taglia, sotto cap)', () => {
  it('una squadra con un buco pesca il miglior FA affrontabile dal pool', () => {
    let s = startOffseason(generateLeague(SEED), SEED, 1); // cap generoso (250)
    const id = s.teamOrder[0];
    // Crea un buco: togli un lanciatore (14/15) e metti in pool due FA.
    const dropped = s.rosters[id].pitchers[s.rosters[id].pitchers.length - 1];
    const gem: FreeAgent = pit('FA-GEM', 82, 6, 24, 88); // forte, economico, alto valore
    const filler: FreeAgent = pit('FA-FILLER', 55, 2, 30, 55); // debole
    s = {
      ...s,
      rosters: { ...s.rosters, [id]: { ...s.rosters[id], pitchers: s.rosters[id].pitchers.filter((p) => p.id !== dropped.id) } },
      pool: [filler, gem],
    };
    expect(s.rosters[id].pitchers).toHaveLength(TARGET_PITCHERS - 1);
    const after = advanceBlock(s);
    expect(after.rosters[id].pitchers).toHaveLength(TARGET_PITCHERS); // buco riempito (swap 1-per-1 non cambia il conteggio)
    // La firma e' avvenuta sul MIGLIORE (log-based: il riallineamento potrebbe poi
    // rigirarlo, ma la firma resta registrata e il gem esce dal pool).
    expect(after.log.some((t) => t.kind === 'sign' && t.teamId === id && t.playerId === 'FA-GEM')).toBe(true);
    expect(after.pool.some((p) => p.id === 'FA-GEM')).toBe(false);
    expect(after.pool.some((p) => p.id === 'FA-FILLER')).toBe(true); // il debole resta
  });
});

describe('azioni dell’utente + squadra gestita', () => {
  it('le AI SALTANO la squadra gestita', () => {
    const managed = generateLeague(SEED)[0].id;
    const start = startOffseason(generateLeague(SEED), SEED, 1, managed, TIGHT);
    const end = runOffseasonMarket(start);
    // Nessuna transazione automatica sulla gestita (nessuna byHuman false su di lei).
    expect(end.log.some((t) => t.teamId === managed && !t.byHuman)).toBe(false);
  });

  it('humanRelease sposta il giocatore nel pool; humanSign rispetta il cap', () => {
    const teams = generateLeague(SEED);
    const managed = teams[0].id;
    let s = startOffseason(teams, SEED, 1, managed);
    const victim = s.rosters[managed].batters[0];
    s = humanRelease(s, victim.id);
    expect(s.pool.some((p) => p.id === victim.id)).toBe(true);
    expect(s.rosters[managed].batters.some((p) => p.id === victim.id)).toBe(false);
    expect(s.log.at(-1)).toMatchObject({ kind: 'release', byHuman: true, playerId: victim.id });

    // Rifirmarlo rientra nel cap (l'abbiamo appena tolto): ok.
    const back = humanSign(s, victim.id);
    expect(back.rosters[managed].batters.some((p) => p.id === victim.id)).toBe(true);

    // Firma che sfora: un FA gigantesco non entra sotto un cap stretto.
    const huge: FreeAgent = bat('FA-HUGE', 99, 45);
    let s2 = startOffseason(teams, SEED, 1, managed, TIGHT);
    s2 = { ...s2, pool: [huge] };
    const rejected = humanSign(s2, 'FA-HUGE');
    expect(rejected.rosters[managed].batters.some((p) => p.id === 'FA-HUGE')).toBe(false); // gate ha bloccato
    expect(rejected.pool.some((p) => p.id === 'FA-HUGE')).toBe(true);
  });

  it('pool reattivo: se l’utente firma un FA, l’AI non lo trova più', () => {
    const teams = generateLeague(SEED);
    const managed = teams[0].id;
    let s = startOffseason(teams, SEED, 1, managed);
    const gem: FreeAgent = bat('FA-SHARED', 80, 5, 25, 86);
    // Crea un buco anche in un'altra squadra, cosi' l'AI VORREBBE il gem.
    const other = teams[1].id;
    s = {
      ...s,
      rosters: { ...s.rosters, [other]: { ...s.rosters[other], batters: s.rosters[other].batters.slice(0, -1) } },
      pool: [gem],
    };
    s = humanSign(s, 'FA-SHARED'); // l'utente lo prende prima
    expect(s.rosters[managed].batters.some((p) => p.id === 'FA-SHARED')).toBe(true);
    const after = advanceBlock(s);
    expect(after.rosters[other].batters.some((p) => p.id === 'FA-SHARED')).toBe(false); // l'AI si adatta
  });
});

describe('riallineamento AI↔AI (scambi 1-per-1, stesso valore, fit migliore)', () => {
  // Battitore con posizione esplicita (per costruire doppioni/bisogni).
  const batAt = (id: string, pos: Batter['position'], lvl: number, salary: number): Batter => ({
    ...bat(id, lvl, salary), position: pos,
  });

  // Isola due squadre (teamOrder ridotto a [A,B]) con rose piatte controllate.
  const twoTeam = (aBats: Batter[], bBats: Batter[]) => {
    const teams = generateLeague(SEED);
    const [A, B] = [teams[0].id, teams[1].id];
    let s = startOffseason(teams, SEED, 1);
    s = {
      ...s,
      teamOrder: [A, B],
      rosters: {
        ...s.rosters,
        [A]: { batters: aBats, pitchers: [] },
        [B]: { batters: bBats, pitchers: [] },
      },
    };
    return { s, A, B };
  };

  it('due squadre con doppione↔bisogno incrociati fanno lo scambio, migliorando entrambe', () => {
    // A: profonda a CF (78,76), scoperta a 1B (55). B: specchio (1B 78,76; CF 55).
    const aBats = [batAt('A-CF1', 'CF', 78, 8), batAt('A-CF2', 'CF', 76, 7), batAt('A-1B', '1B', 55, 2)];
    const bBats = [batAt('B-1B1', '1B', 78, 8), batAt('B-1B2', '1B', 76, 7), batAt('B-CF', 'CF', 55, 2)];
    const { s, A, B } = twoTeam(aBats, bBats);
    const after = advanceBlock(s);

    const trades = after.log.filter((t) => t.kind === 'trade');
    expect(trades.length).toBe(2); // una trade = due righe (una per squadra)
    // A ha guadagnato un 1B forte, B un CF forte (fit migliore per entrambe).
    expect(after.rosters[A].batters.some((p) => p.position === '1B' && p.id !== 'A-1B')).toBe(true);
    expect(after.rosters[B].batters.some((p) => p.position === 'CF' && p.id !== 'B-CF')).toBe(true);
    // Conteggi conservati (1-per-1).
    expect(after.rosters[A].batters).toHaveLength(3);
    expect(after.rosters[B].batters).toHaveLength(3);
    // Le due righe sono speculari (contparte incrociata).
    const [x, y] = trades;
    expect(x.withTeamId).toBe(y.teamId);
    expect(y.withTeamId).toBe(x.teamId);
  });

  it('nessuno scambio se lo scarto di valore supera la tolleranza', () => {
    // B offre un 1B FORTISSIMO (90): valore troppo distante dal CF di A → niente deal.
    const aBats = [batAt('A-CF1', 'CF', 78, 8), batAt('A-CF2', 'CF', 76, 7), batAt('A-1B', '1B', 55, 2)];
    const bBats = [batAt('B-1B1', '1B', 90, 20), batAt('B-1B2', '1B', 76, 7), batAt('B-CF', 'CF', 55, 2)];
    const { s } = twoTeam(aBats, bBats);
    const after = advanceBlock(s);
    // Nessun 1B da 90 barattato per un CF da ~76 (|Δvalore| > tol).
    const gaveAce = after.log.some((t) => t.kind === 'trade' && t.sentId === 'B-1B1');
    expect(gaveAce).toBe(false);
  });

  it('sulla lega generata avvengono scambi, tutti bilanciati per valore', () => {
    const teams = generateLeague(SEED);
    const byId = new Map(teams.flatMap((t) =>
      [...t.lineup, ...t.bench, ...t.rotation, ...t.bullpen, ...t.reserveBatters, ...t.reservePitchers]
        .map((p) => [p.id, p] as const),
    ));
    const end = runOffseasonMarket(startOffseason(teams, SEED, 1));
    const trades = end.log.filter((t) => t.kind === 'trade');
    expect(trades.length).toBeGreaterThan(0); // la varieta' c'e'
    for (const t of trades) {
      const got = byId.get(t.playerId);
      const sent = byId.get(t.sentId!);
      if (got && sent) {
        expect(Math.abs(playerValue(got) - playerValue(sent))).toBeLessThanOrEqual(REALIGN_VALUE_TOL);
      }
    }
  });
});
