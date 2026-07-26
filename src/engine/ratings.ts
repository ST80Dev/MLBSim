import type {
  BatterRatings,
  BatterStats,
  PitcherRatings,
  PitcherStats,
  PitcherRole,
} from './types';
import { LEAGUE } from './constants';
import { clamp } from './rng';
import type { Rng } from './rng';

export const RATING_MIN = 20;
export const RATING_MAX = 80;
export const RATING_AVG = 50;

export const clampRating = (x: number): number =>
  clamp(Math.round(x), RATING_MIN, RATING_MAX);

/**
 * Moltiplicatore da caratteristica: 1.0 a rating 50, e cambia di `perSigma`
 * ogni 10 punti (una deviazione standard). Sempre positivo.
 */
export function ratingMult(rating: number, perSigma: number): number {
  return Math.pow(perSigma, (rating - RATING_AVG) / 10);
}

const round = Math.round;

/**
 * Deriva le statistiche di conteggio di un battitore dalle sue caratteristiche.
 * A tutte le doti = 50 si ottengono le medie di lega (BA ~.256, OBP ~.325).
 */
export function deriveBatterStats(r: BatterRatings, pa = 650): BatterStats {
  const so = round(pa * LEAGUE.so * ratingMult(r.contact, 0.88) * ratingMult(r.eye, 0.97));
  const bb = round(pa * LEAGUE.bb * ratingMult(r.eye, 1.32));
  const hbp = round(pa * LEAGUE.hbp);
  const hr = round(pa * LEAGUE.hr * ratingMult(r.power, 1.34));
  const triple = round(pa * LEAGUE.triple * ratingMult(r.speed, 1.6) * ratingMult(r.power, 0.9));
  const double = round(pa * LEAGUE.double * ratingMult(r.power, 1.2) * ratingMult(r.contact, 1.05));
  let single = round(pa * LEAGUE.single * ratingMult(r.contact, 1.1));

  const ab = Math.max(1, pa - bb - hbp);
  let h = single + double + triple + hr;
  if (h > ab) {
    single = Math.max(0, single - (h - ab));
    h = single + double + triple + hr;
  }

  // Soft-cap realistico sulla media: oltre ~.330 i rendimenti sono decrescenti
  // (battere .400 e' rarissimo). Non tocca i contatti-puri sotto soglia; comprime
  // i fenomeni multi-tool. Vale ovunque (sim, backstory, base della proiezione),
  // cosi' la varianza d'annata puo' sfondare .400 solo di rado, non a comando.
  const BA_CAP = 0.33;
  const BA_SLOPE = 0.33;
  if (h / ab > BA_CAP) {
    const targetH = round((BA_CAP + (h / ab - BA_CAP) * BA_SLOPE) * ab);
    single = Math.max(0, single - (h - targetH));
    h = single + double + triple + hr;
  }

  // I velocisti veri rubano molto (40-55), non un tetto piatto a 30.
  const sb = Math.max(0, round(((r.speed - 48) / 32) * 50));
  const cs = round(sb * 0.28);

  return { pa, h, double, triple, hr, bb, so, hbp, sb, cs };
}

/** Deriva le statistiche concesse da un lanciatore dalle sue caratteristiche. */
export function derivePitcherStats(r: PitcherRatings, bf = 1000): PitcherStats {
  const so = round(bf * LEAGUE.so * ratingMult(r.stuff, 1.21));
  const bb = round(bf * LEAGUE.bb * ratingMult(r.control, 0.78));
  const hbp = round(bf * LEAGUE.hbp);
  const hr = round(bf * LEAGUE.hr * ratingMult(r.groundball, 0.72));
  const nonHrHitRate =
    (LEAGUE.single + LEAGUE.double + LEAGUE.triple) * ratingMult(r.movement, 0.9);
  const h = round(bf * nonHrHitRate) + hr;
  return { bf, h, hr, bb, so, hbp };
}

/** Converte la Resistenza (rating) nel numero di battitori affrontabili. */
export function deriveStamina(rating: number, role: PitcherRole): number {
  if (role === 'SP') return clamp(round(24 + ((rating - 50) / 10) * 3), 18, 33);
  if (role === 'CL') return clamp(round(5 + ((rating - 50) / 10) * 0.8), 3, 7);
  return clamp(round(7 + ((rating - 50) / 10) * 1.2), 4, 12);
}

/** Overall 20-80 di un battitore (media pesata delle doti). */
export function batterOverall(r: BatterRatings): number {
  return clampRating(
    0.3 * r.contact +
      0.26 * r.power +
      0.22 * r.eye +
      0.1 * r.speed +
      0.08 * r.fielding +
      0.04 * r.arm,
  );
}

/** Overall 20-80 di un lanciatore (Resistenza esclusa; Difesa peso minimo). */
export function pitcherOverall(r: PitcherRatings): number {
  return clampRating(
    0.3 * r.stuff +
      0.28 * r.control +
      0.27 * r.movement +
      0.1 * r.groundball +
      0.05 * r.fielding,
  );
}

/**
 * Stima un potenziale (tetto 20-80) da abilita' attuale ed eta': headroom
 * casuale sopra l'overall, piu' ampio da giovani, quasi nullo dopo il picco.
 * E' una STIMA incerta, NON un dato certo: cosi' un giovane forte *tende* a
 * crescere ma non e' garantito. Non guarda mai l'esito reale futuro (import
 * storico): il futuro dal seed non replica la realta'. Solo headroom positivo;
 * il declino lo gestisce la curva d'eta' (`aging.ts`).
 */
export function projectPotential(rng: Rng, overall: number, age: number): number {
  const boost = age < 24 ? rng.gauss(8, 4) : age < 28 ? rng.gauss(3, 3) : rng.gauss(0, 2);
  return clampRating(overall + Math.max(0, boost));
}

/** Stipendio annuale (milioni) da un overall 20-80. */
export function salaryFromOverall(ovr: number): number {
  const s = 0.7 * Math.pow(1.13, ovr - 40);
  return Math.round(clamp(s, 0.5, 45) * 10) / 10;
}
