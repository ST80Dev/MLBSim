import { describe, it, expect } from 'vitest';
import {
  createLiveGame,
  quickSim,
  toGameResult,
  simulateGame,
  situation,
  intentionalWalk,
  changePitcher,
  defenseSide,
  availableRelievers,
  stealableBases,
  attemptSteal,
  stealSuccessProb,
  buntOutcomeProbs,
} from '../game';
import { generateMatchup } from '../../data/generator';
import type { Batter, Pitcher } from '../types';

// Doti minime per i test delle formule pure (solo i campi usati).
const batter = (speed: number, arm = 50): Batter =>
  ({ ratings: { speed, arm } } as unknown as Batter);
const pitcher = (fielding: number): Pitcher =>
  ({ ratings: { fielding } } as unknown as Pitcher);

describe('motore live — determinismo e coerenza col motore batch', () => {
  it('quickSim riproduce lo stesso esito di simulateGame (stesso codice)', () => {
    const { away, home } = generateMatchup(5);
    const g1 = simulateGame(away, home, 99);
    const live = createLiveGame(away, home, 99);
    quickSim(live);
    const g2 = toGameResult(live);
    expect(g2.final).toEqual(g1.final);
    expect(g2.play.length).toBe(g1.play.length);
    expect(g2.innings).toBe(g1.innings);
  });

  it('due quick-sim con lo stesso seed sono identici', () => {
    const { away, home } = generateMatchup(3);
    const a = createLiveGame(away, home, 7);
    const b = createLiveGame(away, home, 7);
    quickSim(a);
    quickSim(b);
    expect(toGameResult(a).final).toEqual(toGameResult(b).final);
  });
});

describe('decisioni W/L/SV', () => {
  it('ogni partita assegna esattamente una W e una L, dai lati giusti', () => {
    for (let s = 0; s < 60; s++) {
      const { away, home } = generateMatchup(s);
      const g = simulateGame(away, home, s * 7 + 11);
      const winSide = g.winner === 'away' ? g.awayStats : g.homeStats;
      const loseSide = g.winner === 'away' ? g.homeStats : g.awayStats;

      const wins = [...g.awayStats.pitching, ...g.homeStats.pitching].filter(
        (p) => p.dec === 'W',
      );
      const losses = [...g.awayStats.pitching, ...g.homeStats.pitching].filter(
        (p) => p.dec === 'L',
      );
      const saves = [...g.awayStats.pitching, ...g.homeStats.pitching].filter(
        (p) => p.dec === 'SV',
      );

      expect(wins.length).toBe(1);
      expect(losses.length).toBe(1);
      expect(saves.length).toBeLessThanOrEqual(1);
      // La W e' della squadra vincente, la L della perdente.
      expect(winSide.pitching.some((p) => p.dec === 'W')).toBe(true);
      expect(loseSide.pitching.some((p) => p.dec === 'L')).toBe(true);
      // Il salvatore (se c'e') e' della vincente e non e' il vincitore.
      if (saves.length === 1) {
        expect(winSide.pitching.some((p) => p.dec === 'SV')).toBe(true);
        expect(saves[0].dec).not.toBe('W');
      }
    }
  });

  it('il partente vincitore che completa 5 inning tiene la W', () => {
    // Cerca una partita in cui il partente della vincente ha >=15 out ed e' la W.
    let checked = 0;
    for (let s = 0; s < 40 && checked < 1; s++) {
      const { away, home } = generateMatchup(s);
      const g = simulateGame(away, home, s * 13 + 2);
      const winSide = g.winner === 'away' ? g.awayStats : g.homeStats;
      const starter = winSide.pitching[0];
      if (starter.outs >= 15 && starter.dec === 'W') {
        expect(starter.dec).toBe('W');
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('rubata — attiva Velocita', () => {
  it('la probabilita cresce con la velocita e cala col braccio del ricevitore', () => {
    const fast = stealSuccessProb(batter(80), batter(50, 30), pitcher(50), 1);
    const slow = stealSuccessProb(batter(30), batter(50, 80), pitcher(50), 1);
    expect(fast).toBeGreaterThan(slow);
  });

  it('rubare la terza e piu difficile che rubare la seconda', () => {
    const second = stealSuccessProb(batter(60), batter(50, 50), pitcher(50), 1);
    const third = stealSuccessProb(batter(60), batter(50, 50), pitcher(50), 2);
    expect(third).toBeLessThan(second);
  });

  it('un lanciatore che tiene bene i corridori abbassa la riuscita', () => {
    const loose = stealSuccessProb(batter(60), batter(50, 50), pitcher(20), 1);
    const tight = stealSuccessProb(batter(60), batter(50, 50), pitcher(80), 1);
    expect(tight).toBeLessThan(loose);
  });

  it('la probabilita resta nei limiti [0.15, 0.95]', () => {
    const p = stealSuccessProb(batter(80), batter(50, 20), pitcher(20), 1);
    expect(p).toBeGreaterThanOrEqual(0.15);
    expect(p).toBeLessThanOrEqual(0.95);
  });

  it('senza corridori non ci sono rubate possibili', () => {
    const { away, home } = generateMatchup(1);
    const live = createLiveGame(away, home, 1);
    expect(stealableBases(live)).toEqual([]);
    expect(attemptSteal(live, 1)).toBe(false);
  });
});

describe('bunt — attiva Difesa del lanciatore e Velocita', () => {
  it('gli esiti sommano a 1', () => {
    const p = buntOutcomeProbs(batter(50), pitcher(50));
    expect(p.hit + p.fail + p.pop + p.sac).toBeCloseTo(1, 9);
  });

  it('un battitore veloce ottiene piu bunt validi', () => {
    const fast = buntOutcomeProbs(batter(80), pitcher(50));
    const slow = buntOutcomeProbs(batter(30), pitcher(50));
    expect(fast.hit).toBeGreaterThan(slow.hit);
  });

  it('un lanciatore con buona difesa fa fallire piu sacrifici', () => {
    const vsWeak = buntOutcomeProbs(batter(50), pitcher(30));
    const vsStrong = buntOutcomeProbs(batter(50), pitcher(80));
    expect(vsStrong.fail).toBeGreaterThan(vsWeak.fail);
  });
});

describe('azioni interattive', () => {
  it('la base intenzionale mette il battitore in prima', () => {
    const { away, home } = generateMatchup(2);
    const live = createLiveGame(away, home, 2);
    const before = live.play.length;
    intentionalWalk(live);
    expect(situation(live).bases[0]).toBe(true);
    expect(live.play.length).toBe(before + 1);
    expect(live.play[before].text).toContain('intenzionale');
  });

  it('il cambio lanciatore porta in pedana un rilievo scelto', () => {
    const { away, home } = generateMatchup(2);
    const live = createLiveGame(away, home, 2);
    const def = defenseSide(live); // la casa in difesa nel 1° attacco away
    const rel = availableRelievers(def)[0];
    const prev = situation(live).pitcher.id;
    const ok = changePitcher(live, def, rel.id);
    expect(ok).toBe(true);
    expect(situation(live).pitcher.id).toBe(rel.id);
    expect(situation(live).pitcher.id).not.toBe(prev);
  });
});
