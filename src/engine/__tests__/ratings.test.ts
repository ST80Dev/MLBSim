import { describe, it, expect } from 'vitest';
import {
  deriveBatterStats,
  derivePitcherStats,
  ratingMult,
  batterOverall,
} from '../ratings';
import { advanceSeasonBatter } from '../aging';
import { makeRng } from '../rng';
import type { Batter, BatterRatings } from '../types';

// Scala 40-100: la MEDIA di lega e' 70 (RATING_AVG). Un giocatore tutto-medio.
const AVG: BatterRatings = {
  contact: 70,
  power: 70,
  eye: 70,
  speed: 70,
  fielding: 70,
  arm: 70,
};

describe('derivazione dalle caratteristiche', () => {
  it('il moltiplicatore a rating medio (70) vale 1', () => {
    expect(ratingMult(70, 1.2)).toBeCloseTo(1, 9);
  });

  it('un battitore tutto-medio rende circa la media di lega', () => {
    const s = deriveBatterStats(AVG);
    const ab = s.pa - s.bb - s.hbp;
    const ba = s.h / ab;
    expect(ba).toBeGreaterThan(0.24);
    expect(ba).toBeLessThan(0.275);
  });

  it('piu potenza produce piu fuoricampo', () => {
    const low = deriveBatterStats({ ...AVG, power: 50 });
    const high = deriveBatterStats({ ...AVG, power: 90 });
    expect(high.hr).toBeGreaterThan(low.hr);
  });

  it('piu dominio produce piu strikeout', () => {
    const low = derivePitcherStats({
      stuff: 50, control: 70, movement: 70, groundball: 70, stamina: 70, fielding: 70,
    });
    const high = derivePitcherStats({
      stuff: 90, control: 70, movement: 70, groundball: 70, stamina: 70, fielding: 70,
    });
    expect(high.so).toBeGreaterThan(low.so);
  });

  it('piu controllo produce meno basi ball', () => {
    const low = derivePitcherStats({
      stuff: 70, control: 50, movement: 70, groundball: 70, stamina: 70, fielding: 70,
    });
    const high = derivePitcherStats({
      stuff: 70, control: 90, movement: 70, groundball: 70, stamina: 70, fielding: 70,
    });
    expect(high.bb).toBeLessThan(low.bb);
  });
});

describe('cime di eccellenza (stile anni 90/00)', () => {
  it('un contact hitter da manuale batte oltre .320', () => {
    const s = deriveBatterStats({ ...AVG, contact: 100, eye: 85 });
    const ba = s.h / (s.pa - s.bb - s.hbp);
    expect(ba).toBeGreaterThan(0.32);
  });

  it('uno slugger da manuale sfonda i 42 fuoricampo', () => {
    const s = deriveBatterStats({ ...AVG, power: 100, contact: 80 });
    expect(s.hr).toBeGreaterThanOrEqual(42);
  });

  it('il battitore medio resta sui numeri di lega', () => {
    const s = deriveBatterStats(AVG);
    const ba = s.h / (s.pa - s.bb - s.hbp);
    expect(ba).toBeGreaterThan(0.24);
    expect(ba).toBeLessThan(0.27);
    expect(s.hr).toBeLessThan(24);
  });

  it('un asso strike-outa a raffica', () => {
    const ace = derivePitcherStats({
      stuff: 100, control: 98, movement: 96, groundball: 94, stamina: 80, fielding: 75,
    });
    // K rate ben oltre la media di lega (0.18).
    expect(ace.so / ace.bf).toBeGreaterThan(0.28);
  });
});

describe('evoluzione eta/potenziale', () => {
  it('un giovane con alto potenziale migliora nel tempo', () => {
    const rng = makeRng(3);
    const young = mkBatter(21, AVG, 98);
    const start = batterOverall(young.ratings);
    for (let i = 0; i < 3; i++) advanceSeasonBatter(young, rng);
    expect(batterOverall(young.ratings)).toBeGreaterThan(start);
  });

  it('un veterano oltre il picco declina', () => {
    const rng = makeRng(9);
    const vet = mkBatter(
      35,
      { contact: 90, power: 90, eye: 90, speed: 90, fielding: 90, arm: 90 },
      98,
    );
    const start = batterOverall(vet.ratings);
    for (let i = 0; i < 3; i++) advanceSeasonBatter(vet, rng);
    expect(batterOverall(vet.ratings)).toBeLessThan(start);
  });
});

function mkBatter(age: number, ratings: BatterRatings, potential: number): Batter {
  return {
    id: 'x',
    name: 'Test Player',
    bats: 'R',
    position: 'CF',
    ratings: { ...ratings },
    stats: deriveBatterStats(ratings),
    age,
    potential,
    salary: 1,
    retired: false,
  };
}
