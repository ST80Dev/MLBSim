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

describe('potenziale dinamico (tetto che galleggia)', () => {
  it('il tetto non scende MAI sotto l’overall corrente', () => {
    for (let s = 0; s < 200; s++) {
      const rng = makeRng(2000 + s);
      const b = mkBat(20, 78);
      for (let y = 0; y < 8; y++) {
        advanceSeasonBatter(b, rng, rng.gauss(0, 1));
        expect(b.potential).toBeGreaterThanOrEqual(batterOverall(b.ratings));
      }
    }
  });

  it('il rendimento (perf) muove il tetto: sopra la media lo alza, sotto lo abbassa', () => {
    const up = mkBat(27, 70);
    const flat = mkBat(27, 70);
    const down = mkBat(27, 70);
    for (let y = 0; y < 2; y++) {
      // Stesso RNG per tutti e tre: la differenza sul tetto viene SOLO da perf
      // (il drift del potenziale non consuma RNG).
      advanceSeasonBatter(up, makeRng(80 + y), 2);
      advanceSeasonBatter(flat, makeRng(80 + y), 0);
      advanceSeasonBatter(down, makeRng(80 + y), -2);
    }
    expect(up.potential).toBeGreaterThan(flat.potential);
    expect(flat.potential).toBeGreaterThan(down.potential);
  });

  it('un breakout può ALZARE il tetto oltre quello di partenza', () => {
    let raised = 0;
    for (let s = 0; s < 400; s++) {
      const rng = makeRng(6000 + s);
      const b = mkBat(21, 72);
      for (let y = 0; y < 5; y++) advanceSeasonBatter(b, rng);
      if (b.potential > 72) raised += 1;
    }
    expect(raised).toBeGreaterThan(0);
  });

  it('il tetto del veterano si erode verso l’overall (niente promesse stantie)', () => {
    const b = mkBat(33, 90); // scenario artificioso: tetto 90 stantio su overall 50
    let prev = b.potential;
    for (let y = 0; y < 5; y++) {
      advanceSeasonBatter(b, makeRng(300 + y), 0);
      expect(b.potential).toBeLessThanOrEqual(prev); // non risale mai
      prev = b.potential;
    }
    expect(b.potential).toBeLessThan(70); // molto più vicino all’overall che al 90
  });
});

// Un battitore "al picco": doti 72, potenziale = overall (gap ~0), così la sola
// leva e' la curva d'eta' (isola picco/declino dalla crescita verso il tetto).
const PEAK: BatterRatings = { contact: 72, power: 72, eye: 72, speed: 72, fielding: 72, arm: 72 };
const mkPeak = (age: number): Batter => ({
  id: 'x', name: 'T P', bats: 'R', position: 'CF', ratings: { ...PEAK },
  stats: deriveBatterStats(PEAK), age, potential: 72, salary: 1, retired: false,
});

describe('curva d’eta DILATATA + tarda fioritura (30+)', () => {
  const meanOvrAt = (targetAge: number): number => {
    let sum = 0;
    const N = 250;
    for (let s = 0; s < N; s++) {
      const rng = makeRng(30000 + s);
      const b = mkPeak(27);
      while (b.age < targetAge && !b.retired) advanceSeasonBatter(b, rng);
      sum += batterOverall(b.ratings, b.position);
    }
    return sum / N;
  };

  it('plateau esteso: a 31 anni l’OVR e ancora ~picco (declino non ancora iniziato)', () => {
    const m28 = meanOvrAt(28);
    const m31 = meanOvrAt(31);
    const m34 = meanOvrAt(34);
    expect(Math.abs(m31 - m28)).toBeLessThan(2); // 28~31: plateau, non ancora in discesa
    expect(m31).toBeGreaterThan(m34 + 2); // il declino DAI 32 e reale (ma morbido)
    expect(m34).toBeGreaterThan(64); // ...e dilatato: a 34 si e ceduto poco (era ~-8)
  });

  it('tarda fioritura: qualche 30+ GUADAGNA overall in una stagione (bump reale)', () => {
    let bumps = 0;
    for (let s = 0; s < 800; s++) {
      const rng = makeRng(20000 + s);
      const b = mkPeak(33); // avanza a 34: eta' da declino, ma il bump e' possibile
      const before = batterOverall(b.ratings, b.position);
      advanceSeasonBatter(b, rng);
      if (batterOverall(b.ratings, b.position) > before + 1) bumps += 1;
    }
    expect(bumps).toBeGreaterThan(0); // esistono le stagioni in salita oltre i 30
  });

  it('i veterani sono piu VOLATILI del picco (maglie di variabilita piu larghe)', () => {
    const sdDeltaAt = (age: number): number => {
      const ds: number[] = [];
      for (let s = 0; s < 500; s++) {
        const rng = makeRng(50000 + s + age * 1000);
        const b = mkPeak(age);
        const before = batterOverall(b.ratings, b.position);
        advanceSeasonBatter(b, rng);
        ds.push(batterOverall(b.ratings, b.position) - before);
      }
      const m = ds.reduce((a, c) => a + c, 0) / ds.length;
      return Math.sqrt(ds.reduce((a, c) => a + (c - m) ** 2, 0) / ds.length);
    };
    // La dispersione dell'annata cresce con l'eta': un 36enne oscilla molto piu'
    // di un 28enne al picco (dado piu' largo coi veterani).
    expect(sdDeltaAt(36)).toBeGreaterThan(sdDeltaAt(28) + 0.5);
  });

  it('un lanciatore 30+ puo avere un guizzo tardivo (stagione in salita)', () => {
    let bumps = 0;
    for (let s = 0; s < 800; s++) {
      const rng = makeRng(70000 + s);
      const p = mkPit(33, 62);
      p.ratings = { stuff: 62, control: 62, movement: 62, groundball: 62, stamina: 62, fielding: 62 };
      p.stats = derivePitcherStats(p.ratings);
      const before = p.ratings.stuff + p.ratings.control + p.ratings.movement;
      advanceSeasonPitcher(p, rng);
      if (p.ratings.stuff + p.ratings.control + p.ratings.movement > before + 2) bumps += 1;
    }
    expect(bumps).toBeGreaterThan(0);
  });
});
