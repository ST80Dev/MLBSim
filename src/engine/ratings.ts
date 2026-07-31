import type {
  BatterRatings,
  BatterStats,
  PitcherRatings,
  PitcherStats,
  PitcherRole,
  Position,
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
// Coda-gemma HR rafforzata: coi rating INDIVIDUALI ora FEDELI (niente stretch che
// portava la potenza a 100), una gemma sta a power ~95-96, non 100. Il boost-coda
// deve quindi partire un filo prima (knee 85) e più forte, così i fenomeni sfondano
// i 50+ HR (epoca "gemme 55-60") DALLA loro potenza reale, non da un tool gonfiato.
const HR_TOP_KNEE = 88;
const HR_TOP_GAIN = 0.3; // +50% HR alla vetta della potenza
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

// ---------------------------------------------------------------------------
// OVR battitore = VALORE PRODOTTO, non media di doti. Tre componenti, ancorate
// alla mediana (dote 70 + posizione media → ~70, così la coda si stira senza
// gonfiare la lega):
//   1. OFFESA — wOBA-like (linear weights) dalle stat DERIVATE: premia ciò che i
//      tool PRODUCONO, così uno slap-speed (Ichiro) e uno slugger (Bonds) salgono
//      ognuno per la sua via, senza penalizzare i tool "deboli" dell'archetipo.
//   2. VELOCITÀ — credito baserunning oltre le SB già dentro la wOBA.
//   3. DIFESA — fielding+braccio PESATI per la DOMANDA del ruolo (SS/C/CF ≫
//      1B/LF/DH), COERENTE col modello difensivo del motore (teamRatings
//      DEF_WEIGHT): un guanto d'oro da SS vale, uno da 1ª quasi no.
// Rendimenti decrescenti in cima (OVR_KNEE) così i fenomeni si distinguono senza
// saturare. Vedi docs/players-and-ratings.md § OVR-produzione.
// ---------------------------------------------------------------------------
const WOBA_W = { bb: 0.69, hbp: 0.72, single: 0.89, double: 1.27, triple: 1.62, hr: 2.1, sb: 0.2, cs: -0.4 };
function wobaOf(r: BatterRatings): number {
  const s = deriveBatterStats(r, 650);
  const single = s.h - s.double - s.triple - s.hr;
  return (
    WOBA_W.bb * s.bb + WOBA_W.hbp * s.hbp + WOBA_W.single * single + WOBA_W.double * s.double +
    WOBA_W.triple * s.triple + WOBA_W.hr * s.hr + WOBA_W.sb * s.sb + WOBA_W.cs * s.cs
  ) / s.pa;
}
const AVG_BAT: BatterRatings = { contact: 70, power: 70, eye: 70, speed: 70, fielding: 70, arm: 70 };
const LG_WOBA = wobaOf(AVG_BAT);

// Domanda difensiva per ruolo (0..1): normalizzazione di teamRatings.DEF_WEIGHT
// (SS 9 … 1B 1, DH 0). TENERE ALLINEATA a quella tabella. Posizione ignota = media.
const POS_DEF_DEMAND: Partial<Record<Position, number>> = {
  SS: 1, CF: 0.89, C: 0.89, '2B': 0.67, '3B': 0.56, RF: 0.33, LF: 0.22, '1B': 0.11, DH: 0,
};
const DEFAULT_DEMAND = 0.45;

const OVR_OFF_SLOPE = 118; // wOBA → punti-OVR
const OVR_SPD_CREDIT = 0.2; // per punto di Velocità sopra la media
const OVR_DEF_CREDIT = 0.34; // per punto di difesa, a domanda piena (SS)
const OVR_KNEE = 88; // sopra: forti rendimenti decrescenti (×0.3): solo i veri
const OVR_KNEE_SLOPE = 0.3; // fenomeni sfondano i 90, i mid-star restano sotto

// Credito SPECIALISTA (solo OVR/valutazione — l'overall NON entra nel motore di
// gioco: alza salary/valore/draft, non il punteggio simulato → EPOCA INTATTA).
// Un fenomeno di puro CONTATTO e/o VELOCITÀ (Ichiro, Gwynn, Raines, Lofton) vale
// in realtà più di quanto la sola wOBA sappia esprimere: il soft-cap BA (.345)
// nasconde le medie da record e le corse in base sono impatto sottopesato. È un
// termine coda-only (topEdge, knee 90 post-stretch ≈ battute-titolo / 30+ rubate):
// scatta SOLO per le doti-vetta, quindi la fascia media e gli aggregati non si
// muovono. Sommato PRIMA della soglia OVR_KNEE, così anche lo slap-hitter estremo
// resta appena sotto i veri multi-tool (Bonds). Vedi docs/players-and-ratings § OVR.
const SPEC_CONTACT_KNEE = 90;
const SPEC_CONTACT_GAIN = 5; // +5 OVR a contact 100 (media da record, .350+)
const SPEC_SPEED_KNEE = 90;
const SPEC_SPEED_GAIN = 3; // +3 OVR a speed 100 (baserunning elite)

/**
 * Overall 40-100 di un battitore = valore prodotto (offesa wOBA + baserunning +
 * difesa pesata per ruolo, + credito specialista per le doti-vetta di contatto/
 * velocità). `position` abilita il peso difensivo corretto (SS/C contano più di
 * 1B/DH); se assente usa una domanda media. Vedi il blocco sopra.
 */
export function batterOverall(r: BatterRatings, position?: Position): number {
  const demand = position != null ? POS_DEF_DEMAND[position] ?? DEFAULT_DEMAND : DEFAULT_DEMAND;
  const defRating = 0.75 * r.fielding + 0.25 * r.arm;
  const specialist =
    SPEC_CONTACT_GAIN * topEdge(r.contact, SPEC_CONTACT_KNEE) +
    SPEC_SPEED_GAIN * topEdge(r.speed, SPEC_SPEED_KNEE);
  let raw =
    RATING_AVG +
    OVR_OFF_SLOPE * (wobaOf(r) - LG_WOBA) +
    OVR_SPD_CREDIT * (r.speed - RATING_AVG) +
    OVR_DEF_CREDIT * demand * (defRating - RATING_AVG) +
    specialist;
  if (raw > OVR_KNEE) raw = OVR_KNEE + (raw - OVR_KNEE) * OVR_KNEE_SLOPE;
  return clampRating(raw);
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
