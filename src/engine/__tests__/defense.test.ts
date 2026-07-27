import { describe, it, expect } from 'vitest';
import { batterRates, pitcherRates, combineRates } from '../probabilities';
import { simulateGame } from '../game';
import { generateMatchup } from '../../data/generator';
import type { Team } from '../types';

// Difesa dietro il lanciatore (scollegatore ERA↔talento, Fase 4): la qualita' del
// reparto difensivo sposta la BABIP (hit su palla in gioco <-> out), MAI i "three
// true outcomes" (HR/BB/HBP/SO). Neutrale alla media di lega. Vedi TUNING.defense.

describe('difesa dietro il lanciatore — combineRates', () => {
  const { away, home } = generateMatchup(1);
  const b = batterRates(away.lineup[0].stats);
  const p = pitcherRates(home.rotation[0].stats);
  const base = { platoonAdvantage: false, platoonDisadvantage: false, fatigue: 1 };
  const neutral = combineRates(b, p, { ...base });
  const good = combineRates(b, p, { ...base, fieldingSigma: 1.5 }); // difesa sopra media
  const bad = combineRates(b, p, { ...base, fieldingSigma: -1.5 }); // difesa scarsa

  it('difesa assente === fieldingSigma 0 (no-op)', () => {
    const zero = combineRates(b, p, { ...base, fieldingSigma: 0 });
    for (const k of ['bb', 'hbp', 'so', 'hr', 'triple', 'double', 'single', 'outInPlay'] as const) {
      expect(zero[k]).toBeCloseTo(neutral[k], 12);
    }
  });

  it('buona difesa: meno hit su palla in gioco, piu’ out su palla in gioco', () => {
    expect(good.single).toBeLessThan(neutral.single);
    expect(good.double).toBeLessThan(neutral.double);
    expect(good.triple).toBeLessThan(neutral.triple);
    expect(good.outInPlay).toBeGreaterThan(neutral.outInPlay);
  });

  it('difesa scarsa: piu’ hit su palla in gioco, meno out', () => {
    expect(bad.single).toBeGreaterThan(neutral.single);
    expect(bad.outInPlay).toBeLessThan(neutral.outInPlay);
  });

  it('NON tocca i three true outcomes (HR/BB/HBP/SO) ne’ il totale', () => {
    for (const k of ['hr', 'bb', 'hbp', 'so'] as const) {
      expect(good[k]).toBeCloseTo(neutral[k], 12);
      expect(bad[k]).toBeCloseTo(neutral[k], 12);
    }
    const sum = (c: typeof neutral) =>
      c.bb + c.hbp + c.so + c.hr + c.triple + c.double + c.single + c.outInPlay;
    expect(sum(good)).toBeCloseTo(1, 6);
    expect(sum(bad)).toBeCloseTo(1, 6);
  });
});

/** Clona una squadra imponendo un livello di fielding/braccio a tutti i titolari
 *  (l’offesa e i lanciatori restano identici). */
function withFielding(team: Team, level: number): Team {
  return {
    ...team,
    lineup: team.lineup.map((b) => ({
      ...b,
      ratings: { ...b.ratings, fielding: level, arm: level },
    })),
  };
}

describe('difesa dietro il lanciatore — partita', () => {
  it('a parita’ di lanciatori/offesa, una gran difesa concede meno hit di una scarsa', () => {
    // Stessa away (attacco), stessa home (lanciatori): cambia SOLO la difesa dietro
    // ai lanciatori di casa. Stesso seed -> stesso ordine RNG: la differenza nelle
    // hit degli avversari (= concesse dai lanciatori di casa) e’ l’effetto difesa.
    let goodHits = 0;
    let badHits = 0;
    for (let s = 0; s < 40; s++) {
      const { away, home } = generateMatchup(s);
      const gGood = simulateGame(away, withFielding(home, 95), s * 31 + 5);
      const gBad = simulateGame(away, withFielding(home, 48), s * 31 + 5);
      goodHits += gGood.awayStats.hits; // hit concesse dalla difesa di casa
      badHits += gBad.awayStats.hits;
    }
    // Aggregato robusto: la difesa forte concede nettamente meno hit.
    expect(goodHits).toBeLessThan(badHits);
    expect(badHits - goodHits).toBeGreaterThan(40); // margine ampio su 40 gare
  });
});
