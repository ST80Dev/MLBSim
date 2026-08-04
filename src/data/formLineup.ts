import type { Batter, BatterRatings, Team } from '../engine/types';
import { autoLineupBy } from '../engine/lineup';
import { ratingsFromBatterStats, type BatterImportInput } from '../engine/statsToRatings';
import type { SeasonBat } from './season';

// ---------------------------------------------------------------------------
// Lineup "con forma": l'ordine di battuta che RESPIRA con la stagione in corso.
//
// `autoLineup` ordina sui RATING (la verità del giocatore). Qui i rating usati
// per il PUNTEGGIO vengono mischiati col RENDIMENTO in-season, a peso piccolo e
// crescente col campione: un giocatore in forma sale di un posto, uno in crisi
// scende — senza stravolgere l'ordine (il talento resta dominante). Vive in
// `data/` (non in `engine/`) perché dipende da `SeasonBat` accumulata dalla
// stagione; riusa la logica di ordinamento via `autoLineupBy`.
//
// COME nasce la "forma-rating": si RI-INVERTE il tabellino in-season con la
// stessa `ratingsFromBatterStats` dell'import storico → un rating implicito dal
// rendimento reale. Ha già la regressione per campione (prior 90): pochi AB →
// implicito vicino a 70 → il blend quasi non muove. Sopra, il peso è comunque
// gated a 0 sotto RAMP_START partite e sale al tetto verso RAMP_FULL.
// ---------------------------------------------------------------------------

/** Sotto queste partite la forma NON conta (campione troppo piccolo). */
const RAMP_START = 30;
/** A queste partite la forma pesa al massimo (`MAX_WEIGHT`). */
const RAMP_FULL = 60;
/** Peso massimo della forma nel punteggio del lineup (1/10, come da design). */
const MAX_WEIGHT = 0.1;

/** Peso della forma per un giocatore con `g` partite: 0 sotto RAMP_START, sale
 *  linearmente a MAX_WEIGHT verso RAMP_FULL. */
function formWeight(g: number): number {
  if (g < RAMP_START) return 0;
  return MAX_WEIGHT * Math.min(1, (g - RAMP_START) / (RAMP_FULL - RAMP_START));
}

/** `SeasonBat` accumulata → `BatterImportInput` per l'inversione (pa≈ab+bb, hbp non
 *  tracciato in-season → 0). */
function seasonLineToInput(sb: SeasonBat, position: Batter['position']): BatterImportInput {
  return {
    pa: sb.ab + sb.bb,
    h: sb.h,
    double: sb.double,
    triple: sb.triple,
    hr: sb.hr,
    bb: sb.bb,
    so: sb.so,
    hbp: 0,
    sb: sb.sb,
    cs: sb.cs,
    position,
  };
}

/**
 * Rating da usare NEL PUNTEGGIO del lineup: base (dote reale) mischiata al
 * rendimento in-season, al peso di `formWeight`. Solo contatto/potenza/occhio
 * respirano (le doti che il tabellino misura); velocità/difesa/braccio restano
 * la dote pura. Ritorna i rating base tal quali quando il peso è 0 (nessun dato o
 * campione sotto soglia): comportamento identico ad `autoLineup`. Valori anche
 * frazionari: servono solo a ORDINARE, non vengono mai salvati sul giocatore.
 */
function blendedRatings(b: Batter, seasonBat: Record<string, SeasonBat>): BatterRatings {
  const sb = seasonBat[b.id];
  const w = sb ? formWeight(sb.g) : 0;
  if (w <= 0) return b.ratings;
  const implied = ratingsFromBatterStats(seasonLineToInput(sb, b.position));
  const mix = (base: number, form: number) => base * (1 - w) + form * w;
  return {
    ...b.ratings,
    contact: mix(b.ratings.contact, implied.contact),
    power: mix(b.ratings.power, implied.power),
    eye: mix(b.ratings.eye, implied.eye),
  };
}

/** Ordine di battuta con la forma in-season pesata (vedi `blendedRatings`). */
export function formLineup(batters: Batter[], seasonBat: Record<string, SeasonBat>): Batter[] {
  return autoLineupBy(batters, (b) => blendedRatings(b, seasonBat));
}

/** Copia della squadra col lineup ri-ordinato "con forma". NON muta l'input; le
 *  doti dei giocatori restano intatte (il blend vale solo per l'ordinamento). */
export function withFormLineup(team: Team, seasonBat: Record<string, SeasonBat>): Team {
  return { ...team, lineup: formLineup(team.lineup, seasonBat) };
}
