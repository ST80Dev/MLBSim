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

// Scala delle doti 40-100: ogni giocatore MLB e' un atleta d'elite, quindi il
// PAVIMENTO e' 40 (non 20) e le "gemme" arrivano a 100. La MEDIA di lega resta
// il centro della calibrazione (a doti tutte = media si ottengono le medie di
// lega). L'ampiezza (60 punti) e' invariata rispetto alla vecchia 20-80: tutti
// gli ancoraggi del motore sono espressi RELATIVAMENTE a queste costanti, cosi'
// spostare la scala non cambia l'output simulato (stat, ERA, stipendi).
export const RATING_MIN = 40;
export const RATING_MAX = 100;
export const RATING_AVG = 70;

export const clampRating = (x: number): number =>
  clamp(Math.round(x), RATING_MIN, RATING_MAX);

/**
 * Moltiplicatore da caratteristica: 1.0 a rating medio (RATING_AVG), e cambia
 * di `perSigma` ogni 10 punti (una deviazione standard). Sempre positivo.
 */
export function ratingMult(rating: number, perSigma: number): number {
  return Math.pow(perSigma, (rating - RATING_AVG) / 10);
}

const round = Math.round;

// Fattore che riporta la base-AB alla base-PA per il giocatore MEDIO: con
// occhio 70, ab = pa·(1 − bb − hbp), quindi ab·AB_SCALE = pa. Mantiene la media
// di lega invariata quando gli esiti da AB si scalano sugli AB invece che sulle PA.
export const AB_SCALE = 1 / (1 - LEAGUE.bb - LEAGUE.hbp);

/**
 * Deriva le statistiche di conteggio di un battitore dalle sue caratteristiche.
 * A tutte le doti = RATING_AVG si ottengono le medie di lega (BA ~.256, OBP ~.325).
 */
export function deriveBatterStats(r: BatterRatings, pa = 650): BatterStats {
  // BB e HBP consumano una PA che NON e' un AB. Gli esiti da AB (SO e battute
  // valide) vanno quindi scalati sugli AB, non sulle PA: chi cammina di piu' ha
  // MENO AB e quindi meno hit — cosi' non si possono avere BB alte E hit alte
  // insieme (il controsenso "in base al 49% delle PA"). `AB_SCALE` riporta il
  // giocatore MEDIO (occhio 70) esattamente a `pa` esiti da AB → media di lega
  // NEUTRA; deviano solo i pazienti/impazienti, che e' l'effetto voluto.
  const bb = round(pa * LEAGUE.bb * ratingMult(r.eye, 1.32));
  const hbp = round(pa * LEAGUE.hbp);
  const ab = Math.max(1, pa - bb - hbp);
  const abBase = ab * AB_SCALE;

  const so = round(abBase * LEAGUE.so * ratingMult(r.contact, 0.88) * ratingMult(r.eye, 0.97));
  const hr = round(abBase * LEAGUE.hr * ratingMult(r.power, 1.42));
  const triple = round(abBase * LEAGUE.triple * ratingMult(r.speed, 1.82) * ratingMult(r.power, 0.9));
  const double = round(abBase * LEAGUE.double * ratingMult(r.power, 1.2) * ratingMult(r.contact, 1.05));
  let single = round(abBase * LEAGUE.single * ratingMult(r.contact, 1.1));
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

  // I velocisti veri rubano molto (40-55), non un tetto piatto a 30. La soglia e'
  // 2 punti sotto la media (span 32 = differenza fino alla vetta della scala).
  const sb = Math.max(0, round(((r.speed - (RATING_AVG - 2)) / 32) * 50));
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
  if (role === 'SP') return clamp(round(24 + ((rating - RATING_AVG) / 10) * 3), 18, 33);
  if (role === 'CL') return clamp(round(5 + ((rating - RATING_AVG) / 10) * 0.8), 3, 7);
  return clamp(round(7 + ((rating - RATING_AVG) / 10) * 1.2), 4, 12);
}

/** Overall 40-100 di un battitore (media pesata delle doti). */
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

/** Overall 40-100 di un lanciatore (Resistenza esclusa; Difesa peso minimo). */
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
 * Stima un potenziale (tetto 40-100) da abilita' attuale ed eta': headroom
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

/**
 * Curva BASE dello stipendio annuale (milioni) dall'overall 40-100.
 *
 * CALIBRAZIONE (vedi docs/franchise.md § Salary cap): l'ESPONENTE e' piu' dolce
 * della prima versione (1.085 invece di 1.13), cosi' lo spread del monte-ingaggi
 * fra squadre passa da ~10x a ~4-5x e il payroll MEDIO cade sotto il cap base
 * (prima era ~2x il cap: il tetto non vincolava nulla). Coefficiente e tetto
 * (0.5..45) tengono la scala "MLB": media di lega ~4M, stelle fino a 45M. La
 * forma resta esponenziale (le stelle costano molto piu' della media). Non
 * toccare senza rimisurare col probe.
 */
export function salaryFromOverall(ovr: number): number {
  // Riferimento "replacement level" = 10 punti sotto la media di lega.
  const s = 1.75 * Math.pow(1.085, ovr - (RATING_AVG - 10));
  return Math.round(clamp(s, 0.5, 45) * 10) / 10;
}

/**
 * Sconto gioventu' (modello "B-lite", vedi docs/franchise.md § Stipendi): un
 * moltiplicatore funzione della SOLA eta', stateless — nessun contratto/arbitrato.
 * Sale da ~0.4 a 21 anni a 1.0 a ~27 (poi 1.0). Rende il neo-draftato un asset a
 * buon mercato che si apprezza mentre matura.
 */
export function youthFactor(age: number): number {
  if (age >= 27) return 1;
  if (age <= 21) return 0.4;
  return 0.4 + ((age - 21) / 6) * 0.6;
}

/**
 * Stipendio EFFETTIVO (milioni) = curva base × sconto gioventu'. E' la funzione
 * usata ovunque (generatore, import storico, aging). Pavimento a 0.5 (minimo di
 * lega): lo sconto non scende mai sotto il minimo.
 */
export function salaryFor(overall: number, age: number): number {
  const s = salaryFromOverall(overall) * youthFactor(age);
  return Math.round(Math.max(0.5, s) * 10) / 10;
}
