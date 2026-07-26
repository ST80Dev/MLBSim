import { describe, it, expect } from 'vitest';
import {
  ratingFromMult,
  ratingsFromBatterStats,
  ratingsFromPitcherStats,
} from '../statsToRatings';
import { ratingMult, deriveBatterStats, derivePitcherStats } from '../ratings';
import type { BatterRatings, PitcherRatings } from '../types';

describe('ratingFromMult', () => {
  it('inverte ratingMult', () => {
    for (const rating of [50, 65, 70, 82, 98]) {
      for (const perSigma of [0.72, 0.88, 1.1, 1.34]) {
        const back = ratingFromMult(ratingMult(rating, perSigma), perSigma);
        expect(back).toBeCloseTo(rating, 4);
      }
    }
  });

  it('e\' robusto agli input degeneri', () => {
    expect(ratingFromMult(0, 1.2)).toBe(70); // rate nullo -> media di lega
    expect(ratingFromMult(1.5, 1)).toBe(70); // perSigma neutro -> media di lega
  });
});

describe('ratingsFromBatterStats', () => {
  it('ricava ~70 dalle statistiche del giocatore medio (round-trip)', () => {
    const stats = deriveBatterStats(
      { contact: 70, power: 70, eye: 70, speed: 70, fielding: 70, arm: 70 },
      650,
    );
    const r = ratingsFromBatterStats({ ...stats, position: 'LF' });
    for (const dote of ['contact', 'power', 'eye', 'speed'] as const) {
      expect(r[dote]).toBeGreaterThanOrEqual(66);
      expect(r[dote]).toBeLessThanOrEqual(74);
    }
  });

  it('recupera un profilo forte partendo dalle sue statistiche derivate', () => {
    const strong: BatterRatings = { contact: 82, power: 90, eye: 88, speed: 75, fielding: 70, arm: 70 };
    const stats = deriveBatterStats(strong, 650);
    const back = ratingsFromBatterStats({ ...stats, position: 'RF' });
    // La Potenza (leva HR, dominante) e l'Occhio (leva BB, pulita) tornano vicini.
    expect(back.power).toBeGreaterThan(82);
    expect(back.eye).toBeGreaterThan(82);
    // Il contatto resta sopra la media.
    expect(back.contact).toBeGreaterThan(72);
  });

  it('ordina le fasce: campione > medio > scarso', () => {
    const champ = ratingsFromBatterStats({ pa: 650, h: 200, double: 40, triple: 3, hr: 40, bb: 90, so: 90, hbp: 6, sb: 10, cs: 3, position: 'RF' });
    const avg = ratingsFromBatterStats({ pa: 650, h: 160, double: 28, triple: 3, hr: 18, bb: 50, so: 110, hbp: 4, sb: 8, cs: 3, position: 'LF' });
    const weak = ratingsFromBatterStats({ pa: 500, h: 105, double: 15, triple: 1, hr: 4, bb: 30, so: 90, hbp: 2, sb: 3, cs: 2, position: 'SS' });
    expect(champ.power).toBeGreaterThan(avg.power);
    expect(avg.power).toBeGreaterThan(weak.power);
    expect(champ.eye).toBeGreaterThan(weak.eye);
  });
});

describe('ratingsFromPitcherStats', () => {
  it('ricava ~70 dalle statistiche del lanciatore medio (round-trip)', () => {
    const stats = derivePitcherStats(
      { stuff: 70, control: 70, movement: 70, groundball: 70, stamina: 70, fielding: 70 },
      1000,
    );
    const r = ratingsFromPitcherStats({ ...stats, role: 'SP', gs: 34 });
    for (const dote of ['stuff', 'control', 'movement', 'groundball'] as const) {
      expect(r[dote]).toBeGreaterThanOrEqual(66);
      expect(r[dote]).toBeLessThanOrEqual(74);
    }
  });

  it('un asso ha Dominio alto e pochi BB concessi -> Controllo alto', () => {
    const strong: PitcherRatings = { stuff: 92, control: 88, movement: 80, groundball: 82, stamina: 82, fielding: 70 };
    const stats = derivePitcherStats(strong, 1000);
    const back = ratingsFromPitcherStats({ ...stats, role: 'SP', gs: 33 });
    expect(back.stuff).toBeGreaterThan(84);
    expect(back.control).toBeGreaterThan(80);
    expect(back.groundball).toBeGreaterThan(75);
  });
});
