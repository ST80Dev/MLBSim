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

/**
 * Rampa CONVESSA in cima alla scala: 0 (nessun effetto) fino a `knee`, poi sale
 * linearmente a 1 a rating 100. E' la leva "coda-gemma": moltiplicata per un
 * guadagno, fa esprimere alle SOLE gemme (rating >= knee) numeri da stagione
 * memorabile (HR/K/BA estremi) SENZA toccare la fascia media — cosi' la mediana
 * e gli aggregati di lega (dote 70 = no-op) restano invariati. Vedi
 * docs/engine-calibration.md § Coda-gemma.
 */
export function topEdge(rating: number, knee: number): number {
  return rating <= knee ? 0 : (rating - knee) / (RATING_MAX - knee);
}

// Coda-gemma (calibrazione "Fedele"): sopra la soglia i tool di VALORE rendono
// di piu', cosi' power 100 -> ~60 HR e contact 100 -> pochissimi K (l'archetipo
// slap-hitter, Ichiro/Gwynn, diventa esprimibile). Solo la coda si stira: knee
// alte -> la fascia comune e la mediana non si muovono. Tarabili qui.
const HR_TOP_KNEE = 88;
const HR_TOP_GAIN = 0.3; // +30% HR a power 100
const K_TOP_KNEE = 90;
const K_TOP_GAIN = 0.34; // -34% K a contact 100 (bat-control estremo)
const SINGLE_TOP_KNEE = 90;
const SINGLE_TOP_GAIN = 0.16; // +16% singoli a contact 100: lo slap-hitter da .345

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

  const so = round(
    abBase * LEAGUE.so * ratingMult(r.contact, 0.88) * ratingMult(r.eye, 0.97) *
      (1 - K_TOP_GAIN * topEdge(r.contact, K_TOP_KNEE)),
  );
  const hr = round(
    abBase * LEAGUE.hr * ratingMult(r.power, 1.42) *
      (1 + HR_TOP_GAIN * topEdge(r.power, HR_TOP_KNEE)),
  );
  const triple = round(abBase * LEAGUE.triple * ratingMult(r.speed, 1.82) * ratingMult(r.power, 0.9));
  const double = round(abBase * LEAGUE.double * ratingMult(r.power, 1.2) * ratingMult(r.contact, 1.05));
  let single = round(
    abBase * LEAGUE.single * ratingMult(r.contact, 1.1) *
      (1 + SINGLE_TOP_GAIN * topEdge(r.contact, SINGLE_TOP_KNEE)),
  );
  let h = single + double + triple + hr;
  if (h > ab) {
    single = Math.max(0, single - (h - ab));
    h = single + double + triple + hr;
  }

  // Soft-cap realistico sulla media: oltre ~.330 i rendimenti sono decrescenti
  // (battere .400 e' rarissimo). Non tocca i contatti-puri sotto soglia; comprime
  // i fenomeni multi-tool. Vale ovunque (sim, backstory, base della proiezione),
  // cosi' la varianza d'annata puo' sfondare .400 solo di rado, non a comando.
  const BA_CAP = 0.345;
  const BA_SLOPE = 0.45;
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

/**
 * Compressione MORBIDA del lato SOTTO-media delle doti di lancio, prima di
 * derivare i peripherals. `ratingMult` è convessa e SENZA pavimento: un
 * lanciatore scarso (doti ~50-55) accumulava valide/BB/HR fuori scala e
 * pochissimi K, e nel motore (odds-ratio) esplodeva a ERA 10-18 — irreale (un
 * replacement-level MLB sta a ~6-7). Qui il DEFICIT sotto la media conta pieno
 * per i primi `PIT_LOW_KNEE` punti, poi solo per `PIT_LOW_SLOPE`: i #4/#5
 * restano "brutti ma vivi" senza toccare né la media di lega (dote 70 = no-op)
 * né gli assi (sopra la media = intatti). Speculare al soft-cap sulla BA.
 */
// Sotto `PIT_LOW_START` la mappa è chirurgica: NON tocca la fascia 64-70 (dove
// passa la maggior parte degli inning e la calibrazione era già giusta), così
// l'aggregato di lega (BA/R/g) resta invariato; morde solo il sotto-media, dove
// il deficit conta per `PIT_LOW_SLOPE` (il resto è "smaltito"). Basta a togliere
// gli ERA irreali (13-18) dei partenti medio-bassi e a portare la fascia comune
// dei #4/#5 (ovr 60-71) a ERA ~6-8, lasciando intatti media di lega e assi.
const PIT_LOW_START = 64;
const PIT_LOW_SLOPE = 0.5;
export function pitchEff(rating: number): number {
  if (rating >= PIT_LOW_START) return rating;
  return PIT_LOW_START - (PIT_LOW_START - rating) * PIT_LOW_SLOPE;
}

/** Deriva le statistiche concesse da un lanciatore dalle sue caratteristiche. */
export function derivePitcherStats(r: PitcherRatings, bf = 1000): PitcherStats {
  const stuff = pitchEff(r.stuff);
  const control = pitchEff(r.control);
  const movement = pitchEff(r.movement);
  const groundball = pitchEff(r.groundball);
  const so = round(bf * LEAGUE.so * ratingMult(stuff, 1.21));
  const bb = round(bf * LEAGUE.bb * ratingMult(control, 0.78));
  const hbp = round(bf * LEAGUE.hbp);
  const hr = round(bf * LEAGUE.hr * ratingMult(groundball, 0.72));
  const nonHrHitRate =
    (LEAGUE.single + LEAGUE.double + LEAGUE.triple) * ratingMult(movement, 0.9);
  const h = round(bf * nonHrHitRate) + hr;
  return { bf, h, hr, bb, so, hbp };
}

/** Converte la Resistenza (rating) nel numero di battitori affrontabili. */
export function deriveStamina(rating: number, role: PitcherRole): number {
  if (role === 'SP') return clamp(round(24 + ((rating - RATING_AVG) / 10) * 3), 18, 33);
  if (role === 'CL') return clamp(round(5 + ((rating - RATING_AVG) / 10) * 0.8), 3, 7);
  return clamp(round(7 + ((rating - RATING_AVG) / 10) * 1.2), 4, 12);
}

// Bonus-PICCO (convesso) dell'OVR battitore: premia la CONCENTRAZIONE del talento
// nei tool di valore (contact/power/eye), non la media. Un mono-dominante (Bonds:
// power+eye a 100) sfonda i 90, mentre un "bilanciato" no e la MEDIANA resta ferma
// (tool sotto la soglia = nessun bonus). Risolve "OVR = media che castra le gemme"
// e "nessun position-player sopra 90". Solo battitori: l'OVR lanciatore concentra
// gia' il valore nei 3 tool a peso alto (aggiungere un picco lo gonfierebbe).
const PEAK_KNEE = 78;
const PEAK_GAIN = 0.14;
function peakBonus(tools: number[]): number {
  let excess = 0;
  for (const t of tools) excess += Math.max(0, t - PEAK_KNEE);
  return PEAK_GAIN * excess;
}

/**
 * Overall 40-100 di un battitore. Pesi VERSO IL VALORE (power/eye guidano i run:
 * SLG+OBP) piu' un bonus-picco convesso: cosi' l'OVR riflette la DOMINANZA e non
 * la media piatta (che schiacciava le gemme mono-tool a mid-80). Vedi
 * docs/players-and-ratings.md § OVR convesso.
 */
export function batterOverall(r: BatterRatings): number {
  return clampRating(
    0.3 * r.power +
      0.26 * r.eye +
      0.22 * r.contact +
      0.09 * r.speed +
      0.09 * r.fielding +
      0.04 * r.arm +
      peakBonus([r.contact, r.power, r.eye]),
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
  // RI-FIT dopo l'OVR convesso: la curva (coeff/esponente) resta invariata —
  // l'OVR piu' alto delle gemme le rende gia' piu' care (Bonds ~10M -> ~22M:
  // arbitraggio "campione sotto-prezzo" chiuso) e il monte-ingaggi mediano cade
  // sul target di design (~77% del cap). Cambia SOLO il tetto (45 -> 55): il
  // vertice 95-100 si distribuisce invece di appiattirsi sul clamp.
  const s = 1.75 * Math.pow(1.085, ovr - (RATING_AVG - 10));
  return Math.round(clamp(s, 0.5, 55) * 10) / 10;
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
