import { describe, it, expect } from 'vitest';
import { playerValue, overallOf, upsideWeight, SALARY_WEIGHT } from '../value';
import { deriveBatterStats, derivePitcherStats, salaryFor } from '../ratings';
import type { Batter, Pitcher, BatterRatings, PitcherRatings } from '../types';

// Ratings a un livello dato: tutte le doti = `lvl` (l'overall coincide con `lvl`,
// essendo una media pesata che somma a 1). Cosi' i test controllano l'overall.
const batRatings = (lvl: number): BatterRatings => ({
  contact: lvl, power: lvl, eye: lvl, speed: lvl, fielding: lvl, arm: lvl,
});
const pitRatings = (lvl: number): PitcherRatings => ({
  stuff: lvl, control: lvl, movement: lvl, groundball: lvl, stamina: lvl, fielding: lvl,
});

const mkBat = (lvl: number, age: number, pot = lvl, salary = salaryFor(lvl, age)): Batter => ({
  id: 'b', name: 'T P', bats: 'R', position: 'CF', ratings: batRatings(lvl),
  stats: deriveBatterStats(batRatings(lvl)), age, potential: pot, salary, retired: false,
});
const mkPit = (lvl: number, age: number, pot = lvl, salary = salaryFor(lvl, age)): Pitcher => ({
  id: 'p', name: 'T P', throws: 'R', role: 'SP', ratings: pitRatings(lvl),
  stats: derivePitcherStats(pitRatings(lvl)), stamina: 24, age, potential: pot, salary, retired: false,
});

describe('overallOf', () => {
  it('usa la formula giusta per battitore e lanciatore (doti costanti = overall)', () => {
    expect(overallOf(mkBat(64, 27))).toBe(64);
    expect(overallOf(mkPit(58, 27))).toBe(58);
  });
});

describe('upsideWeight', () => {
  it('e limitata a [0,1] e non crescente con l’eta', () => {
    for (let a = 18; a <= 40; a++) {
      const w = upsideWeight(a);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
    expect(upsideWeight(21)).toBe(1);
    expect(upsideWeight(30)).toBe(0);
    expect(upsideWeight(26)).toBeGreaterThan(upsideWeight(28)); // decresce in mezzo
  });
});

describe('playerValue', () => {
  it('e puro/deterministico: stesso input, stesso output', () => {
    const b = mkBat(70, 27);
    expect(playerValue(b)).toBe(playerValue(mkBat(70, 27)));
  });

  it('la forza attuale domina: una stella vale piu di uno scarso a parita d’eta', () => {
    expect(playerValue(mkBat(85, 27))).toBeGreaterThan(playerValue(mkBat(55, 27)));
  });

  it('l’upside conta: a pari overall, chi ha headroom vale di piu (da giovane)', () => {
    const talent = mkBat(70, 23, 82); // potenziale 82
    const flat = mkBat(70, 23, 70); // nessun headroom
    expect(playerValue(talent)).toBeGreaterThan(playerValue(flat));
  });

  it('l’upside e neutralizzato dall’eta: a 30+ il headroom non aggiunge valore', () => {
    const oldTalent = mkBat(70, 31, 82);
    const oldFlat = mkBat(70, 31, 70);
    expect(playerValue(oldTalent)).toBeCloseTo(playerValue(oldFlat), 5);
  });

  it('lo stipendio e un freno: a pari talento/eta, il piu caro vale meno', () => {
    const cheap = mkBat(75, 27, 75, 5);
    const pricey = mkBat(75, 27, 75, 30);
    expect(playerValue(cheap)).toBeGreaterThan(playerValue(pricey));
    // Lo swing e' esattamente SALARY_WEIGHT × Δsalary.
    expect(playerValue(cheap) - playerValue(pricey)).toBeCloseTo(SALARY_WEIGHT * 25, 5);
  });

  it('a pari overall/potenziale, il giovane (piu economico) batte il maturo', () => {
    // salary derivato: il 24enne paga lo sconto gioventu', il 28enne prezzo pieno.
    const young = mkBat(72, 24, 72);
    const mature = mkBat(72, 28, 72);
    expect(young.salary).toBeLessThan(mature.salary);
    expect(playerValue(young)).toBeGreaterThan(playerValue(mature));
  });

  it('vale identico per battitori e lanciatori a parita di overall/eta/pot/salary', () => {
    const b = mkBat(68, 26, 78, 12);
    const p = mkPit(68, 26, 78, 12);
    expect(playerValue(p)).toBe(playerValue(b));
  });

  it('ordinando dal valore piu basso: il maturo-caro senza upside esce prima del giovane-affare', () => {
    const bargain = mkBat(74, 23, 86); // giovane forte, contratto scontato, headroom
    const deadweight = mkBat(66, 31, 66); // maturo, prezzo pieno, nessuna prospettiva
    const sorted = [bargain, deadweight].sort((x, y) => playerValue(x) - playerValue(y));
    expect(sorted[0]).toBe(deadweight); // il primo a essere scaricato
  });
});
