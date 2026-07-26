import { describe, it, expect } from 'vitest';
import { makeRng } from '../rng';
import { advanceSeasonBatter, advanceSeasonPitcher } from '../aging';
import { projectPotential, batterOverall, deriveBatterStats, derivePitcherStats } from '../ratings';
import type { Batter, Pitcher, BatterRatings, PitcherRatings } from '../types';

const AVG: BatterRatings = { contact: 50, power: 50, eye: 50, speed: 50, fielding: 50, arm: 50 };
const PAVG: PitcherRatings = { stuff: 50, control: 50, movement: 50, groundball: 50, stamina: 50, fielding: 50 };

const mkBat = (age: number, pot: number): Batter => ({
  id: 'x', name: 'T P', bats: 'R', position: 'CF', ratings: { ...AVG },
  stats: deriveBatterStats(AVG), age, potential: pot, salary: 1, retired: false,
});
const mkPit = (age: number, pot: number): Pitcher => ({
  id: 'p', name: 'T P', throws: 'R', role: 'SP', ratings: { ...PAVG },
  stats: derivePitcherStats(PAVG), stamina: 24, age, potential: pot, salary: 1, retired: false,
});

describe('projectPotential', () => {
  it('fornisce headroom (>= overall) e mai sopra il tetto 80', () => {
    const rng = makeRng(4);
    for (let i = 0; i < 200; i++) {
      const p = projectPotential(rng, 55, 22);
      expect(p).toBeGreaterThanOrEqual(55);
      expect(p).toBeLessThanOrEqual(80);
    }
  });
  it('il giovane ha molto piu headroom del veterano', () => {
    const rng = makeRng(7);
    let young = 0, old = 0;
    const N = 3000;
    for (let i = 0; i < N; i++) {
      young += projectPotential(rng, 50, 21) - 50;
      old += projectPotential(rng, 50, 33) - 50;
    }
    expect(young / N).toBeGreaterThan(old / N + 3);
  });
});

describe('code di sviluppo (bust / breakout)', () => {
  it('carriere con stesso start DIVERGONO: il futuro non e un replay', () => {
    const finals: number[] = [];
    for (let s = 0; s < 400; s++) {
      const rng = makeRng(1000 + s);
      const b = mkBat(21, 78);
      for (let y = 0; y < 5; y++) advanceSeasonBatter(b, rng);
      finals.push(batterOverall(b.ratings));
    }
    const mean = finals.reduce((a, c) => a + c, 0) / finals.length;
    const sd = Math.sqrt(finals.reduce((a, c) => a + (c - mean) ** 2, 0) / finals.length);
    const min = Math.min(...finals);
    const max = Math.max(...finals);
    // Spread reale fra individui identici alla partenza.
    expect(sd).toBeGreaterThan(1.5);
    expect(max - min).toBeGreaterThan(8);
    // Esistono i "bust": qualcuno NON raggiunge il potenziale alto (78).
    expect(min).toBeLessThan(72);
  });

  it('il trend medio resta corretto: il giovane di talento cresce comunque', () => {
    const rng = makeRng(3);
    const b = mkBat(21, 78);
    const start = batterOverall(b.ratings);
    for (let y = 0; y < 4; y++) advanceSeasonBatter(b, rng);
    expect(batterOverall(b.ratings)).toBeGreaterThan(start);
  });

  it('vale anche per i lanciatori (divergenza non nulla)', () => {
    const outs = new Set<number>();
    for (let s = 0; s < 60; s++) {
      const rng = makeRng(500 + s);
      const p = mkPit(22, 74);
      for (let y = 0; y < 5; y++) advanceSeasonPitcher(p, rng);
      outs.add(Math.round(p.ratings.stuff));
    }
    expect(outs.size).toBeGreaterThan(3);
  });
});
