import type { Batter, Pitcher } from './types';
import { batterOverall, pitcherOverall } from './ratings';

// ---------------------------------------------------------------------------
// VALORE GIOCATORE — l'atomo del layer franchigia (Fase 5A).
//
// Puro: nessuna dipendenza da UI/rete/RNG, non muta il giocatore. E' la base
// comune a SCAMBI (equita' di una proposta) e CAP (chi scaricare per rientrare).
// Vedi docs/franchise.md § playerValue.
// ---------------------------------------------------------------------------

/** Overall 40-100 del giocatore, qualunque sia il ruolo. */
export function overallOf(p: Batter | Pitcher): number {
  return 'role' in p ? pitcherOverall(p.ratings) : batterOverall(p.ratings, p.position);
}

/**
 * Peso dell'upside (headroom `potential − overall`) in funzione dell'eta': quanto
 * "vale oggi" la prospettiva. Alto da giovani (tanti anni di controllo a buon
 * mercato + alta probabilita' di sbocciare), ~0 dal picco in poi.
 *   1.0 a ≤22  →  0 a ≥30 (lineare in mezzo).
 */
export function upsideWeight(age: number): number {
  if (age <= 22) return 1;
  if (age >= 30) return 0;
  return (30 - age) / 8;
}

/**
 * Quanti "punti overall" pesa 1M di stipendio come freno. Secondario apposta: a
 * pari talento un contratto economico vale di piu', ma l'overall resta il segnale
 * dominante (max ~9 pt di swing sull'intera scala stipendi 0.5..45M).
 */
export const SALARY_WEIGHT = 0.2;

/**
 * VALORE GIOCATORE in punti overall-equivalenti (docs/franchise.md § playerValue):
 *
 *   valore = overall                                     // forza attuale (dominante)
 *          + upsideWeight(eta') × max(0, potential−overall)  // prospettiva per eta'
 *          − SALARY_WEIGHT × salary                      // freno stipendio (tiebreak)
 *
 * Una stella batte uno scarso (overall domina); a pari overall un giovane con
 * headroom o un contratto economico vale di piu'; un veterano maturo e caro scende.
 * Ordinando dal valore piu' BASSO si scaricano prima i maturi cari senza
 * prospettiva, mai i giovani-affare.
 */
export function playerValue(p: Batter | Pitcher): number {
  const ovr = overallOf(p);
  const upside = Math.max(0, p.potential - ovr) * upsideWeight(p.age);
  const value = ovr + upside - SALARY_WEIGHT * p.salary;
  return Math.round(value * 10) / 10;
}
