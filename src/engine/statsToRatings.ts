import type {
  BatterRatings,
  BatterStats,
  PitcherRatings,
  PitcherStats,
  PitcherRole,
  Position,
} from './types';
import { LEAGUE } from './constants';
import { clampRating, RATING_AVG, AB_SCALE } from './ratings';

// ---------------------------------------------------------------------------
// Inversione statistiche -> caratteristiche.
//
// E' l'inverso (approssimato) di `deriveBatterStats`/`derivePitcherStats`: dato
// un tabellino REALE (media, HR, K, BB...), stima le doti 20-80 che, riderivate,
// riproducono quel rendimento. Serve a IMPORTARE una stagione storica: le stat
// storiche sono la fonte, i rating l'output, cosi' il giocatore entra nel motore
// come qualunque altro e puo' essere ri-simulato ("caratteristiche = fonte di
// verita'" vale una volta importato).
//
// Nota di modello: la derivazione forward mappa OGNI dote su UNA leva (zero
// ridondanza), ma nella realta' due leve legate alla stessa dote (es. HR e 2B
// per la Potenza) non implicano lo stesso rating. Dove una dote governa piu' di
// una stat, qui si fa una MEDIA PESATA delle stime, quindi il round-trip e'
// fedele ma non bit-esatto (residui piccoli, misurati nei test). Difesa e Braccio
// non sono nel tabellino offensivo: si assegnano dall'archetipo di ruolo.
// ---------------------------------------------------------------------------

/**
 * Inverte `ratingMult(rating, perSigma) = perSigma^((rating-RATING_AVG)/10)`:
 *   rating = RATING_AVG + 10 * ln(mult) / ln(perSigma)
 * `mult` e' il rapporto fra rate osservato e rate di lega. Robusta a input
 * degeneri (rate 0 o perSigma 1 -> ritorna la media).
 */
export function ratingFromMult(mult: number, perSigma: number): number {
  if (!(mult > 0) || perSigma <= 0 || perSigma === 1) return RATING_AVG;
  return RATING_AVG + (10 * Math.log(mult)) / Math.log(perSigma);
}

// Regressione verso la media di lega in base al CAMPIONE. Un rate osservato,
// espresso come `mult` (rapporto vs lega, 1 = media), viene avvicinato a 1 con
// peso w = n/(n+prior): campioni piccoli (rilievi da pochi BF, panchinari da
// poche PA) tornano verso la media, stagioni piene restano quasi intatte. Serve
// a evitare che rate estremi su MICRO-campioni (un rilievo da 12 inning) diventino
// rating da fuoriclasse — mentre gli elite a stagione piena non ne risentono.
// Prior PIÙ BASSO (era 250): la regressione stringeva troppo verso la media, così
// le STELLE a stagione piena uscivano schiacciate (una lega di soli ~72). Con 90 i
// campioni ampi restano quasi intatti (l'asso spicca) mentre i micro-campioni sono
// ancora ricondotti (niente rilievo-fluke da fuoriclasse). Solo import storico.
export const REGRESS_PRIOR_BAT = 90; // "PA di prior" per i battitori
export const REGRESS_PRIOR_PIT = 90; // "BF di prior" per i lanciatori

// DIPS: il lanciatore controlla in PARTE i hit su palla in gioco (BABIP) — il
// resto è difesa dei compagni, park, fortuna. Il rating `movement` (dai hit
// non-HR) va quindi compresso verso la lega di questa quota di controllo reale,
// PRIMA della regressione per campione: così un asso in una squadra-colabrodo non
// è penalizzato (K/BB/HR restano la sua verità) né un contact-pitcher in gran
// difesa è gonfiato. A 0.5 ("metà delle valide le controlla il lanciatore", via di
// mezzo sabermetrica) la SOPPRESSIONE-VALIDE elite conta di più: è la parte "nuova"
// della WHIP che il FIP non vede (i walk sono già pieni nel control). È un RATE →
// premia i control/contact artist di OGNI ruolo, reliever e short-start compresi,
// non solo i mangia-inning. Epoca-safe: alza la varianza (code più larghe) ma nel
// Log5 gli estremi si cancellano — misurato R/G ~invariato. Vedi docs § WHIP/DIPS.
export const DIPS_HIT_CONTROL = 0.5;

export function regressMult(mult: number, n: number, prior: number): number {
  const w = n / (n + prior);
  return 1 + (mult - 1) * w;
}

/** Difesa/Braccio non deducibili dal tabellino: default per archetipo di ruolo. */
const POS_DEFENSE: Record<string, { field: number; arm: number }> = {
  C: { field: 8, arm: 10 },
  SS: { field: 10, arm: 7 },
  '2B': { field: 7, arm: 3 },
  CF: { field: 9, arm: 5 },
  '3B': { field: 5, arm: 7 },
  RF: { field: 3, arm: 8 },
  LF: { field: 2, arm: 2 },
  '1B': { field: -5, arm: -3 },
  DH: { field: -12, arm: -8 },
  P: { field: 0, arm: 0 },
};

export interface BatterImportInput extends BatterStats {
  position?: Position;
  /** Difesa/Braccio REALI (40-100 pre-stretch) da Fielding.csv, se disponibili.
   *  Presenti → usati al posto dell'archetipo di ruolo (import storico). `arm`
   *  può mancare anche con `fld` presente (interni/1B: nessun dato di braccio). */
  fld?: number;
  arm?: number;
}

/**
 * Stima le doti di un battitore dal suo tabellino stagionale reale.
 * - Occhio  <- BB (unica leva dei base ball)
 * - Potenza <- media pesata di HR (leva forte) e 2B (leva gap)
 * - Contatto<- media di singoli (SLG-media) e strikeout (dato l'Occhio)
 * - Velocita<- media di SB (leva diretta) e tripli (data la Potenza)
 * - Difesa/Braccio <- archetipo di ruolo (non nel tabellino offensivo)
 */
export function ratingsFromBatterStats(s: BatterImportInput): BatterRatings {
  const pa = Math.max(1, s.pa);

  // Occhio dai BB (per PA). Gli esiti da AB (SO, battute valide) vanno divisi per
  // la base-AB, coerente con la forward (deriveBatterStats scala sugli AB): base =
  // ab·AB_SCALE, con ab = pa − BB − HBP osservati.
  // Regressione per campione (PA): normalizza i rate su micro-campioni.
  const reg = (mult: number): number => regressMult(mult, pa, REGRESS_PRIOR_BAT);

  const eye = ratingFromMult(reg(s.bb / pa / LEAGUE.bb), 1.24);
  const ab = Math.max(1, pa - s.bb - (s.hbp ?? 0));
  const abBase = ab * AB_SCALE;

  const powerHr = ratingFromMult(reg(s.hr / abBase / LEAGUE.hr), 1.34);
  const powerDbl = ratingFromMult(reg(s.double / abBase / LEAGUE.double), 1.11);
  const power = 0.8 * powerHr + 0.2 * powerDbl;

  // Contatto ANCORATO alla MEDIA (BA): è ciò che il contatto deve predire. Prima si
  // pesava 50/50 con contactSo (dai K), che ESPLODE sul basso strikeout — un .271 a
  // 9% di K leggeva contact 100 come un .347, perché il contactSo (119) trascinava la
  // media. Ora la BA è l'ancora; il basso/alto K RIFINISCE (±), ma è LIMITATO e non
  // domina: un contact-maker senza media resta un contact-maker senza media.
  const LG_BA =
    (LEAGUE.single + LEAGUE.double + LEAGUE.triple + LEAGUE.hr) / (1 - LEAGUE.bb - LEAGUE.hbp);
  const contactBa = ratingFromMult(reg(s.h / ab / LG_BA), 1.12);
  // Parte-K isolata dalla forward (SO = abBase·so·mult(contact,0.88)·mult(eye,0.97)).
  const eyeSoMult = Math.pow(0.97, (eye - RATING_AVG) / 10);
  const contactSo = ratingFromMult(reg(s.so / abBase / LEAGUE.so / eyeSoMult), 0.88);
  // Rifinitura-K asimmetrica: il basso K aggiunge poco (+), l'alto K toglie di più
  // (−) — un forte strikeout-prone (Glaus) ha meno contatto reale, e non deve alzare
  // il pavimento (che gonfiava l'offesa di lega). Non ribalta mai l'ancora-BA.
  const kAdj = Math.max(-32, Math.min(10, contactSo - RATING_AVG)) * 0.6;
  // Correzione ROUND-TRIP: l'inversione BA→rating (perSigma 1.12) sovra-legge rispetto
  // alla forward deriveBatterStats (singoli perSigma 1.1 + contributo XBH sulla BA), così
  // il round-trip gonfiava l'aggregato di lega (.286 vs il reale ~.275 degli starter) e
  // con esso l'R/G storico. Il ritocco riporta l'aggregato al BA reale — è FEDELTÀ, non
  // soppressione: contact scende quel tanto che serve perché deriveBatterStats(contact)
  // riproduca la BA d'ingresso. Proporzionale alla distanza da 70 (l'errore è lì).
  const RT = 0.78;
  const contact = RATING_AVG + (contactBa + kAdj - RATING_AVG) * RT;

  // Velocita: SB e' la leva diretta (invertendo la formula lineare di sb);
  // i tripli confermano (data la Potenza gia' stimata).
  const speedSb = (RATING_AVG - 5) + (s.sb / 30) * 35;
  const powerTriMult = Math.pow(0.9, (power - RATING_AVG) / 10);
  const speedTri = ratingFromMult(reg(s.triple / abBase / LEAGUE.triple / powerTriMult), 1.6);
  const speed = 0.6 * speedSb + 0.4 * speedTri;

  // Difesa: se il tabellino porta i valori REALI (da Fielding.csv) usali; altrimenti
  // ricadi sull'archetipo di ruolo. Il Braccio reale può mancare pur avendo la Difesa
  // (interni/1B: nessun segnale di braccio affidabile in Lahman) → archetipo per esso.
  const def = POS_DEFENSE[s.position ?? 'LF'] ?? { field: 0, arm: 0 };
  const fielding = s.fld != null ? s.fld : RATING_AVG + def.field;
  const arm = s.arm != null ? s.arm : RATING_AVG + def.arm;

  return {
    contact: clampRating(contact),
    power: clampRating(power),
    eye: clampRating(eye),
    speed: clampRating(speed),
    fielding: clampRating(fielding),
    arm: clampRating(arm),
  };
}

export interface PitcherImportInput extends PitcherStats {
  role?: PitcherRole;
  /** Partite iniziate: stima la Resistenza (battitori affrontati per start). */
  gs?: number;
  /** Apparizioni totali: stima la Resistenza dei RILIEVI (battitori per apparizione). */
  g?: number;
  /** Difesa REALE del lanciatore (40-100) da Fielding.csv, se disponibile. */
  fld?: number;
}

/**
 * Stima le doti di un lanciatore dal suo tabellino concesso reale.
 * - Dominio    <- K concessi
 * - Controllo  <- BB concessi (meno BB = piu' controllo)
 * - Palla-terra<- HR concessi (meno HR = piu' groundball)
 * - Movimento  <- hit non-HR concesse
 * - Resistenza <- battitori per partenza (SP) / default per ruolo (RP/CL)
 * - Difesa     <- media di lega (non deducibile dal tabellino concesso)
 */
export function ratingsFromPitcherStats(s: PitcherImportInput): PitcherRatings {
  const bf = Math.max(1, s.bf);
  const role: PitcherRole = s.role ?? 'SP';

  // Regressione per campione (BF): un rilievo da pochi battitori affrontati non
  // diventa un fuoriclasse per un rate estremo su micro-campione.
  const reg = (mult: number): number => regressMult(mult, bf, REGRESS_PRIOR_PIT);

  const stuff = ratingFromMult(reg(s.so / bf / LEAGUE.so), 1.21);
  const control = ratingFromMult(reg(s.bb / bf / LEAGUE.bb), 0.78);
  const groundball = ratingFromMult(reg(s.hr / bf / LEAGUE.hr), 0.72);

  const nonHrHits = Math.max(0, s.h - s.hr);
  const leagueNonHr = LEAGUE.single + LEAGUE.double + LEAGUE.triple;
  // DIPS: comprime lo scarto dei hit-in-gioco verso la lega (contesto ≠ talento),
  // poi la normale regressione per campione.
  const movMultRaw = nonHrHits / bf / leagueNonHr;
  const movMultDips = 1 + (movMultRaw - 1) * DIPS_HIT_CONTROL;
  const movement = ratingFromMult(reg(movMultDips), 0.9);

  // Resistenza: INVERTE deriveStamina dai battitori affrontati per uscita — così è
  // REALE, non un archetipo piatto per ruolo (i rilievi erano tutti 65). SP: BF per
  // partenza (24 = ~6 inning a rating 70). RP/CL: BF per APPARIZIONE (un LOOGY da un
  // out ha poca Resistenza, un long-man molta). Le costanti 3/1.2/0.8 combaciano con
  // deriveStamina (round-trip fedele).
  // REGRESSIONE PER CAMPIONE: chi ha POCHE partenze/apparizioni ha un rapporto sballato
  // (magari usato pochissimo quell'anno) → si regredisce verso il CENTRO di ruolo
  // (neutro), così un micro-campione non produce una Resistenza estrema. Campione pieno
  // → valore reale quasi intatto. Fallback al centro se mancano i conteggi.
  const staminaCenter =
    role === 'CL' ? RATING_AVG - 8 : role === 'RP' ? RATING_AVG - 5 : RATING_AVG;
  let staminaRaw = staminaCenter;
  let staminaW = 0;
  if (role === 'SP' && s.gs && s.gs > 0) {
    staminaRaw = RATING_AVG + ((bf / s.gs - 24) / 3) * 10;
    staminaW = s.gs / (s.gs + 10); // ~10 partenze di prior
  } else if ((role === 'RP' || role === 'CL') && s.g && s.g > 0) {
    const bfPerApp = bf / s.g;
    staminaRaw = role === 'CL'
      ? RATING_AVG + ((bfPerApp - 5) / 0.8) * 10
      : RATING_AVG + ((bfPerApp - 7) / 1.2) * 10;
    staminaW = s.g / (s.g + 22); // ~22 apparizioni di prior
  }
  const stamina = staminaCenter + staminaW * (staminaRaw - staminaCenter);

  return {
    stuff: clampRating(stuff),
    control: clampRating(control),
    movement: clampRating(movement),
    groundball: clampRating(groundball),
    stamina: clampRating(stamina),
    // Difesa: reale (da Fielding.csv POS=P) se disponibile, altrimenti archetipo lega.
    fielding: s.fld != null ? clampRating(s.fld) : RATING_AVG,
  };
}
