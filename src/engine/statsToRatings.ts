import type {
  BatterRatings,
  BatterStats,
  PitcherRatings,
  PitcherStats,
  PitcherRole,
  Position,
} from './types';
import { LEAGUE } from './constants';
import { clampRating, RATING_AVG } from './ratings';

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
 * Inverte `ratingMult(rating, perSigma) = perSigma^((rating-50)/10)`:
 *   rating = 50 + 10 * ln(mult) / ln(perSigma)
 * `mult` e' il rapporto fra rate osservato e rate di lega. Robusta a input
 * degeneri (rate 0 o perSigma 1 -> ritorna la media).
 */
export function ratingFromMult(mult: number, perSigma: number): number {
  if (!(mult > 0) || perSigma <= 0 || perSigma === 1) return RATING_AVG;
  return RATING_AVG + (10 * Math.log(mult)) / Math.log(perSigma);
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
  const single = Math.max(0, s.h - s.double - s.triple - s.hr);

  const eye = ratingFromMult(s.bb / pa / LEAGUE.bb, 1.24);

  const powerHr = ratingFromMult(s.hr / pa / LEAGUE.hr, 1.34);
  const powerDbl = ratingFromMult(s.double / pa / LEAGUE.double, 1.11);
  const power = 0.8 * powerHr + 0.2 * powerDbl;

  const contactSingle = ratingFromMult(single / pa / LEAGUE.single, 1.1);
  // SO forward: pa*so*mult(contact,0.88)*mult(eye,0.97). Isola la parte contact.
  const eyeSoMult = Math.pow(0.97, (eye - RATING_AVG) / 10);
  const contactSo = ratingFromMult(s.so / pa / LEAGUE.so / eyeSoMult, 0.88);
  const contact = 0.5 * contactSingle + 0.5 * contactSo;

  // Velocita: SB e' la leva diretta (invertendo la formula lineare di sb);
  // i tripli confermano (data la Potenza gia' stimata).
  const speedSb = 45 + (s.sb / 30) * 35;
  const powerTriMult = Math.pow(0.9, (power - RATING_AVG) / 10);
  const speedTri = ratingFromMult(s.triple / pa / LEAGUE.triple / powerTriMult, 1.6);
  const speed = 0.6 * speedSb + 0.4 * speedTri;

  const def = POS_DEFENSE[s.position ?? 'LF'] ?? { field: 0, arm: 0 };

  return {
    contact: clampRating(contact),
    power: clampRating(power),
    eye: clampRating(eye),
    speed: clampRating(speed),
    fielding: clampRating(RATING_AVG + def.field),
    arm: clampRating(RATING_AVG + def.arm),
  };
}

export interface PitcherImportInput extends PitcherStats {
  role?: PitcherRole;
  /** Partite iniziate: stima la Resistenza (battitori affrontati per start). */
  gs?: number;
}

/**
 * Stima le doti di un lanciatore dal suo tabellino concesso reale.
 * - Dominio    <- K concessi
 * - Controllo  <- BB concessi (meno BB = piu' controllo)
 * - Palla-terra<- HR concessi (meno HR = piu' groundball)
 * - Movimento  <- hit non-HR concesse
 * - Resistenza <- battitori per partenza (SP) / default per ruolo (RP/CL)
 * - Difesa     <- 50 (non deducibile dal tabellino concesso)
 */
export function ratingsFromPitcherStats(s: PitcherImportInput): PitcherRatings {
  const bf = Math.max(1, s.bf);
  const role: PitcherRole = s.role ?? 'SP';

  const stuff = ratingFromMult(s.so / bf / LEAGUE.so, 1.21);
  const control = ratingFromMult(s.bb / bf / LEAGUE.bb, 0.78);
  const groundball = ratingFromMult(s.hr / bf / LEAGUE.hr, 0.72);

  const nonHrHits = Math.max(0, s.h - s.hr);
  const leagueNonHr = LEAGUE.single + LEAGUE.double + LEAGUE.triple;
  const movement = ratingFromMult(nonHrHits / bf / leagueNonHr, 0.9);

  // Resistenza: inverte deriveStamina per gli SP (24 + sigma*3 battitori/start).
  let stamina: number;
  if (role === 'SP' && s.gs && s.gs > 0) {
    const bfPerStart = bf / s.gs;
    stamina = RATING_AVG + ((bfPerStart - 24) / 3) * 10;
  } else {
    stamina = role === 'CL' ? 42 : role === 'RP' ? 45 : 60;
  }

  return {
    stuff: clampRating(stuff),
    control: clampRating(control),
    movement: clampRating(movement),
    groundball: clampRating(groundball),
    stamina: clampRating(stamina),
    fielding: RATING_AVG,
  };
}
