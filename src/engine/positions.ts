import type { Batter, BatterRatings, Position } from './types';
import { clampRating } from './ratings';

// Seconda posizione difensiva: struttura leggera e NON dinamica.
//
// - Ogni ruolo ha un insieme fisso di seconde posizioni PLAUSIBILI (niente
//   "ovunque"): un interbase puo' fare la seconda base, non l'esterno centro.
// - Se un giocatore viene schierato nella sua seconda posizione, cambia SOLO la
//   DIFESA (fielding): e' una skill legata al ruolo. Le altre doti (contatto,
//   potenza, occhio, velocita', braccio) sono del giocatore e restano.
// - La variazione dipende dalla "domanda difensiva" del ruolo: spostarsi verso
//   un ruolo piu' facile puo' anche far salire il fielding; verso uno piu'
//   difficile lo fa scendere. In piu' c'e' una penalita' di adattamento fissa
//   per il fatto di giocare fuori dal ruolo naturale ("variata, non per forza
//   in calo", ma di norma non e' un guadagno netto).

/** Seconde posizioni ammesse per ruolo principale. */
export const SECONDARY_OPTIONS: Partial<Record<Position, Position[]>> = {
  C: ['1B'],
  '1B': ['3B', 'LF'],
  '2B': ['SS', '3B'],
  SS: ['2B', '3B'],
  '3B': ['1B', '2B', 'SS'],
  LF: ['RF', 'CF', '1B'],
  CF: ['LF', 'RF'],
  RF: ['LF', 'CF', '1B'],
  DH: ['1B', 'LF'],
};

/** Domanda difensiva del ruolo (alto = piu' difficile). */
const POS_FIELD_DEMAND: Record<Position, number> = {
  SS: 9,
  CF: 8,
  C: 8,
  '2B': 6,
  '3B': 5,
  RF: 3,
  LF: 2,
  '1B': 1,
  DH: 0,
  P: 0,
};

/** Penalita' fissa per giocare fuori dal ruolo naturale (punti di fielding). */
const ADAPT_PENALTY = 4;

/** Vero se `pos` e' un ruolo lecito per il giocatore (principale o secondario). */
export function canPlay(b: Batter, pos: Position): boolean {
  return pos === b.position || b.secondaryPosition === pos;
}

/** Fielding effettivo del battitore se schierato in `pos`. */
export function fieldingAtPosition(b: Batter, pos: Position): number {
  if (pos === b.position) return b.ratings.fielding;
  const demandDelta = (POS_FIELD_DEMAND[b.position] ?? 0) - (POS_FIELD_DEMAND[pos] ?? 0);
  return clampRating(b.ratings.fielding + demandDelta - ADAPT_PENALTY);
}

/**
 * Doti del battitore come se giocasse in `pos`: cambia solo il fielding.
 * Nel ruolo naturale ritorna le doti invariate (stesso riferimento).
 */
export function ratingsAtPosition(b: Batter, pos: Position): BatterRatings {
  if (pos === b.position) return b.ratings;
  return { ...b.ratings, fielding: fieldingAtPosition(b, pos) };
}
