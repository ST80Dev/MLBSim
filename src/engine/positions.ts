import type { Batter, BatterRatings, Position, Team } from './types';
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
 * Nel ruolo naturale (o al DH, che non difende) ritorna le doti invariate.
 */
export function ratingsAtPosition(b: Batter, pos: Position): BatterRatings {
  if (pos === b.position || pos === 'DH') return b.ratings;
  return { ...b.ratings, fielding: fieldingAtPosition(b, pos) };
}

// ---------------------------------------------------------------------------
// Schieramento difensivo (alignment): quale ruolo occupa ciascun battitore.
// Rappresentato come mappa id -> posizione attiva, solo per chi NON e' nel ruolo
// naturale. Le operazioni mantengono un permutazione valida dei ruoli di campo.
// ---------------------------------------------------------------------------

export type Alignment = Record<string, Position>;

/** Posizione attualmente occupata dal battitore (naturale se non spostato). */
export function activePos(b: Batter, al: Alignment): Position {
  return al[b.id] ?? b.position;
}

/** Un giocatore puo' occupare un ruolo se e' il naturale, la sua seconda
 *  posizione, o il DH (che non richiede difesa: chiunque puo' farlo). */
export function canOccupy(b: Batter, pos: Position): boolean {
  return pos === 'DH' || b.position === pos || b.secondaryPosition === pos;
}

/**
 * Applica lo schieramento alla rosa: il lineup adotta le posizioni attive e la
 * difesa si rivaluta di conseguenza (fielding). Cosi' i consumatori che leggono
 * `batter.position` (box score, Diamond, motore) restano coerenti col cambio.
 */
export function applyAlignment(team: Team, al: Alignment): Team {
  const lineup = team.lineup.map((b) => {
    const pos = activePos(b, al);
    if (pos === b.position) return b;
    return { ...b, position: pos, ratings: ratingsAtPosition(b, pos) };
  });
  return { ...team, lineup };
}

/**
 * Prova a spostare `playerId` in `targetPos` scambiandolo con chi lo occupa.
 * Ritorna il nuovo schieramento, o `null` se lo scambio non e' lecito (il
 * compagno non puo' coprire il ruolo lasciato libero). Mantiene lo schieramento
 * una permutazione valida: niente buchi, niente doppioni sul diamante.
 */
export function computeSwap(
  team: Team,
  al: Alignment,
  playerId: string,
  targetPos: Position,
): Alignment | null {
  const a = team.lineup.find((p) => p.id === playerId);
  if (!a) return null;
  const aPos = activePos(a, al);
  if (aPos === targetPos) return al;
  if (!canOccupy(a, targetPos)) return null;
  const b = team.lineup.find((p) => activePos(p, al) === targetPos);
  if (b && !canOccupy(b, aPos)) return null;
  const next: Alignment = { ...al };
  const setP = (pl: Batter, pos: Position) => {
    if (pos === pl.position) delete next[pl.id];
    else next[pl.id] = pos;
  };
  setP(a, targetPos);
  if (b) setP(b, aPos);
  return next;
}
