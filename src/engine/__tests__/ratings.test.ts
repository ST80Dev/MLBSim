import { describe, it, expect } from 'vitest';
import {
  deriveBatterStats,
  derivePitcherStats,
  pitchEff,
  ratingMult,
  batterOverall,
  salaryFromOverall,
  salaryFor,
  youthFactor,
  RATING_AVG,
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

  it('il pavimento sulla coda bassa non tocca media e assi (neutro sopra 64)', () => {
    expect(pitchEff(64)).toBe(64);
    expect(pitchEff(RATING_AVG)).toBe(RATING_AVG);
    expect(pitchEff(85)).toBe(85);
    expect(pitchEff(100)).toBe(100);
  });

  it('il pavimento risolleva il sotto-media senza azzerare le differenze', () => {
    // un braccio scarso conta come qualcosa in (rating, 64): brutto ma non irreale
    expect(pitchEff(50)).toBeGreaterThan(50);
    expect(pitchEff(50)).toBeLessThan(64);
    // resta monotona: dote peggiore -> efficace peggiore o uguale (mai migliore)
    expect(pitchEff(45)).toBeLessThan(pitchEff(58));
    expect(pitchEff(58)).toBeLessThan(64);
  });

  it('un lanciatore scarso concede molto MENO che con la mappa esponenziale nuda', () => {
    const weak = { stuff: 50, control: 50, movement: 50, groundball: 50, stamina: 50, fielding: 50 };
    const floored = derivePitcherStats(weak);
    // esito "nudo" senza pavimento: le stesse formule sui rating grezzi.
    const bf = 1000;
    const nakedBb = Math.round(bf * 0.085 * ratingMult(50, 0.78));
    const nakedH =
      Math.round(bf * (0.153 + 0.045 + 0.0032) * ratingMult(50, 0.9)) +
      Math.round(bf * 0.026 * ratingMult(50, 0.72));
    expect(floored.bb).toBeLessThan(nakedBb);
    expect(floored.h).toBeLessThan(nakedH);
  });
});

describe('cime di eccellenza (stile anni 90/00)', () => {
  it('un contact hitter da manuale batte ~.315 con OBP elite', () => {
    // Con gli hit derivati dagli AB (non dalle PA), la MEDIA è guidata dal
    // contatto (~.315), mentre l'occhio alza l'OBP coi walk (non gonfia più la
    // media): eccellenza = media alta + OBP elite, non entrambe massime insieme.
    const s = deriveBatterStats({ ...AVG, contact: 100, eye: 85 });
    const ba = s.h / (s.pa - s.bb - s.hbp);
    const obp = (s.h + s.bb + s.hbp) / s.pa;
    expect(ba).toBeGreaterThan(0.31);
    expect(obp).toBeGreaterThan(0.39);
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

describe('coda-gemma + OVR = valore prodotto (difesa per ruolo)', () => {
  // Il TETTO delle gemme si stira (power 100 -> ~60 HR, contact 100 -> pochi K,
  // media da .345) SENZA muovere la fascia media (il "battitore medio" sopra
  // resta sui numeri di lega: invariante di calibrazione).
  it('lo slugger-gemma (power 100) sfonda i 55 fuoricampo', () => {
    const s = deriveBatterStats({ ...AVG, power: 100, contact: 80 }, 660);
    expect(s.hr).toBeGreaterThanOrEqual(55);
  });

  it("il bat-control estremo (contact 100) fa pochissimi K e batte ~.340", () => {
    const s = deriveBatterStats({ ...AVG, contact: 100, power: 55, eye: 55 }, 700);
    const ba = s.h / (s.pa - s.bb - s.hbp);
    expect(s.so / s.pa).toBeLessThan(0.12); // slap-hitter alla Ichiro
    expect(ba).toBeGreaterThan(0.32);
  });

  // OVR = valore PRODOTTO: il mono-dominante (power+eye 100) sfonda i 90 perché la
  // sua wOBA è elite, e batte un "bilanciato" con media dei tool pari o superiore.
  it('il mono-dominante (power+eye 100) supera 90 e batte il bilanciato', () => {
    const gem = batterOverall({ contact: 56, power: 100, eye: 100, speed: 83, fielding: 70, arm: 75 });
    const balanced = batterOverall({ contact: 84, power: 84, eye: 84, speed: 84, fielding: 84, arm: 84 });
    expect(gem).toBeGreaterThanOrEqual(90);
    expect(gem).toBeGreaterThan(balanced);
  });

  it('la mediana resta ferma (tutto-medio = 70)', () => {
    expect(batterOverall(AVG)).toBe(70);
  });

  // Lo specialista contact+speed (Ichiro) NON è un "giocatore medio": la sua
  // produzione (media alta + basi rubate) lo valorizza, senza penalizzarlo per
  // la poca potenza. Era il buco della vecchia media-pesata.
  it('lo specialista contact+speed è ben sopra la media', () => {
    const ichiroLike = batterOverall({ contact: 100, power: 53, eye: 47, speed: 100, fielding: 73, arm: 78 }, 'RF');
    expect(ichiroLike).toBeGreaterThan(80);
  });

  // Difesa COERENTE col motore: lo stesso guanto vale di più dove la domanda
  // difensiva è alta (SS) che in un angolo (1B) o al DH (che non difende).
  it('la difesa conta per RUOLO: stesso guanto, SS > 1B > DH', () => {
    const glove = { contact: 72, power: 72, eye: 72, speed: 72, fielding: 92, arm: 90 };
    const ss = batterOverall(glove, 'SS');
    const first = batterOverall(glove, '1B');
    const dh = batterOverall(glove, 'DH');
    expect(ss).toBeGreaterThan(first);
    expect(first).toBeGreaterThan(dh);
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

describe('stipendio: curva base + sconto gioventu (youthFactor)', () => {
  it('la curva base cresce con l\'overall, con pavimento 0.5 e tetto 55', () => {
    expect(salaryFromOverall(40)).toBe(0.5); // pavimento (minimo di lega)
    expect(salaryFromOverall(100)).toBeGreaterThan(35); // stella molto pagata
    expect(salaryFromOverall(100)).toBeLessThanOrEqual(55); // ma sotto il tetto
    expect(salaryFromOverall(85)).toBeGreaterThan(salaryFromOverall(70));
    expect(salaryFromOverall(70)).toBeGreaterThan(salaryFromOverall(60));
  });

  it('youthFactor: ~0.4 a 21, 1.0 dai 27 in su, monotono in mezzo', () => {
    expect(youthFactor(21)).toBeCloseTo(0.4, 5);
    expect(youthFactor(27)).toBe(1);
    expect(youthFactor(35)).toBe(1);
    expect(youthFactor(24)).toBeGreaterThan(youthFactor(22));
    expect(youthFactor(24)).toBeLessThan(youthFactor(26));
  });

  it('a parita\' di overall il giovane costa MENO del maturo', () => {
    const ovr = 88;
    expect(salaryFor(ovr, 22)).toBeLessThan(salaryFor(ovr, 30));
    // Il fenomeno 22enne e' un affare rispetto al pari-overall maturo.
    expect(salaryFor(ovr, 22)).toBeCloseTo(salaryFromOverall(ovr) * youthFactor(22), 1);
  });

  it('mai sotto il minimo di lega (0.5)', () => {
    expect(salaryFor(45, 21)).toBeGreaterThanOrEqual(0.5);
    expect(salaryFor(RATING_AVG, 21)).toBeGreaterThanOrEqual(0.5);
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
