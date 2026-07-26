import type { Batter, BatterRatings, Pitcher, Position } from './types';
import { clampRating, pitcherOverall, RATING_AVG } from './ratings';
import { fieldingAtPosition } from './positions';

// Sintesi di squadra: valori a colpo d'occhio che dicono se una mossa (cambio di
// battitore, spostamento difensivo) migliora o peggiora la squadra. Puri e
// testabili. Riguardano SOLO i giocatori di movimento coinvolti nel momento (i 9
// del lineup / dello schieramento); il lanciatore e' un discorso a parte.
//
//  - ATTACCO: media delle doti offensive dei 9 titolari (contatto/potenza/occhio/
//    velocita'; NON la difesa).
//  - DIFESA: media del fielding EFFETTIVO alla posizione (cala fuori ruolo) +
//    braccio, PESATA per la domanda difensiva del ruolo (uno SS conta piu' di un
//    1B). Il DH non difende: peso 0.
//  - GENERALE: combinazione dei due (giocatori di movimento).

const OFF_W = { contact: 0.34, power: 0.3, eye: 0.26, speed: 0.1 };

/** Sintesi offensiva di un battitore (40-100), difesa esclusa. */
export function offenseRating(r: BatterRatings): number {
  return clampRating(
    OFF_W.contact * r.contact + OFF_W.power * r.power + OFF_W.eye * r.eye + OFF_W.speed * r.speed,
  );
}

/** Domanda difensiva del ruolo = peso nella sintesi di difesa (DH = 0). */
const DEF_WEIGHT: Record<Position, number> = {
  SS: 9, CF: 8, C: 8, '2B': 6, '3B': 5, RF: 3, LF: 2, '1B': 1, DH: 0, P: 0,
};

/** Difesa di un singolo alla sua casella: fielding (effettivo) + braccio. */
function defenseAt(b: Batter, pos: Position): number {
  return clampRating(0.75 * fieldingAtPosition(b, pos) + 0.25 * b.ratings.arm);
}

export interface TeamSynth {
  /** Attacco: media offensiva dei titolari (40-100). */
  off: number;
  /** Difesa: fielding+braccio pesati per ruolo (40-100). */
  def: number;
  /** Generale dei giocatori di movimento (40-100). */
  ovr: number;
}

/**
 * Sintesi dei 9 titolari nello schieramento dato (id battitore + casella).
 * Robusto: ignora le voci senza battitore. Se non c'e' nessuno, ritorna la media.
 */
export function teamSynthesis(entries: Array<{ b: Batter; pos: Position }>): TeamSynth {
  const players = entries.filter((e) => e.b);
  if (players.length === 0) return { off: RATING_AVG, def: RATING_AVG, ovr: RATING_AVG };

  const off = players.reduce((s, e) => s + offenseRating(e.b.ratings), 0) / players.length;

  let defNum = 0;
  let defDen = 0;
  for (const { b, pos } of players) {
    const w = DEF_WEIGHT[pos] ?? 0;
    defNum += w * defenseAt(b, pos);
    defDen += w;
  }
  const def = defDen ? defNum / defDen : RATING_AVG;

  return {
    off: clampRating(off),
    def: clampRating(def),
    ovr: clampRating(0.58 * off + 0.42 * def),
  };
}

/**
 * Sintesi dello STAFF lanciatori (40-100), NON del match: qualita' complessiva di
 * rotazione + bullpen, pesata sugli inning attesi (i partenti pesano di piu').
 * Robusta agli array vuoti.
 */
export function staffSynthesis(rotation: Pitcher[], bullpen: Pitcher[]): number {
  const avg = (ps: Pitcher[]) =>
    ps.length ? ps.reduce((s, p) => s + pitcherOverall(p.ratings), 0) / ps.length : 0;
  const r = avg(rotation);
  const b = avg(bullpen);
  if (!rotation.length && !bullpen.length) return RATING_AVG;
  if (!rotation.length) return clampRating(b);
  if (!bullpen.length) return clampRating(r);
  return clampRating(0.65 * r + 0.35 * b); // ~ quota di inning rotazione vs bullpen
}
