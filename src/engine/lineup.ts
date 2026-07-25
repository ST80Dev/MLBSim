import type { Batter, Position } from './types';
import { batterOverall } from './ratings';

// Costruzione dell'ordine di battuta e validazione dello schieramento.
//
// Puro e testabile: nessuna dipendenza dalla UI, niente RNG (deterministico a
// parita' di input). L'editor (Fase 2) usa `autoLineup` come default e come
// pulsante "Auto"; `validateFieldSet` fa da guardia sul vincolo duro difensivo.

/** Le 9 caselle che un lineup valido deve coprire ESATTAMENTE una volta. */
export const FIELD_SLOTS: readonly Position[] = [
  'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH',
];

/**
 * Ordina i battitori in un ordine di battuta plausibile per l'epoca "alta
 * offesa" (anni '90/2000), non un ottimo assoluto:
 *   1 leadoff  -> occhio (OBP) + velocita'
 *   2          -> table-setter: contatto + occhio
 *   3          -> il miglior bastone completo
 *   4 cleanup  -> potenza pura
 *   5          -> protezione: potenza secondaria
 *   6..9       -> per overall decrescente
 * Con meno di 5 battitori ripiega sul semplice overall (robustezza).
 * NON muta l'input: ritorna un nuovo array.
 */
export function autoLineup(batters: Batter[]): Batter[] {
  const pool = [...batters];
  if (pool.length < 5) {
    return pool.sort((a, b) => batterOverall(b.ratings) - batterOverall(a.ratings));
  }

  const take = (score: (b: Batter) => number): Batter => {
    let best = 0;
    for (let i = 1; i < pool.length; i++) {
      if (score(pool[i]) > score(pool[best])) best = i;
    }
    return pool.splice(best, 1)[0];
  };
  const r = (b: Batter) => b.ratings;

  const order: Batter[] = [];
  order[0] = take((b) => r(b).eye * 1.0 + r(b).speed * 0.6); // leadoff
  order[3] = take((b) => r(b).power * 1.0 + r(b).contact * 0.2); // cleanup
  order[2] = take((b) => r(b).contact * 0.7 + r(b).power * 0.6 + r(b).eye * 0.3); // n.3
  order[1] = take((b) => r(b).contact * 0.7 + r(b).eye * 0.7); // n.2
  order[4] = take((b) => r(b).power * 0.9 + r(b).contact * 0.3); // n.5

  pool.sort((a, b) => batterOverall(b.ratings) - batterOverall(a.ratings));
  let slot = 5;
  for (const b of pool) order[slot++] = b;
  return order;
}

export interface FieldSetCheck {
  ok: boolean;
  /** Caselle scoperte. */
  missing: Position[];
  /** Caselle occupate da piu' di un giocatore. */
  duplicates: Position[];
}

/**
 * Verifica il vincolo DURO dell'editor: le 9 posizioni schierate devono essere
 * una permutazione esatta di `FIELD_SLOTS` (niente buchi, niente doppioni sul
 * diamante). L'ordine di battuta e la scelta di CHI copre una casella (con
 * eventuale malus fuori-ruolo) sono liberi: qui si controlla solo la copertura.
 */
export function validateFieldSet(positions: Position[]): FieldSetCheck {
  const counts = new Map<Position, number>();
  for (const p of positions) counts.set(p, (counts.get(p) ?? 0) + 1);
  const missing = FIELD_SLOTS.filter((s) => (counts.get(s) ?? 0) === 0);
  const duplicates = FIELD_SLOTS.filter((s) => (counts.get(s) ?? 0) > 1);
  return {
    ok: positions.length === 9 && missing.length === 0 && duplicates.length === 0,
    missing,
    duplicates,
  };
}
