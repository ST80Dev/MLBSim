import type { Team } from '../../engine/types';
import { FRANCHISES } from '../franchises';
import { importHistoricalTeam } from './import';
import { SEASON_1997 } from './season1997';
import { SEASON_1998 } from './season1998';
import { SEASON_1999, type HistTeam } from './season1999';
import { SEASON_2000 } from './season2000';

// ---------------------------------------------------------------------------
// Lega STORICA: le 30 rose reali di un'annata importate come squadre del motore,
// nell'ordine fisso di `FRANCHISES` (come `generateLeague`). Drop-in per la UI:
// calendario, classifiche e leaderboard leggono un `Team[]` identico a quello
// generato. A differenza della lega generata NON dipende da un seed (è uno
// snapshot fisso); il seed dell'importatore pilota solo la stima del potenziale.
// ---------------------------------------------------------------------------

/** Annate storiche disponibili (dataset generati dalla pipeline Lahman). */
export const HISTORICAL_SEASONS: Record<number, HistTeam[]> = {
  1997: SEASON_1997,
  1998: SEASON_1998,
  1999: SEASON_1999,
  2000: SEASON_2000,
};

/** Anni giocabili in ordine crescente (per la scelta a inizio partita). Nota:
 *  il 1997 è a 28 squadre (Arizona e Tampa Bay non esistevano ancora). */
export const HISTORICAL_YEARS: number[] = Object.keys(HISTORICAL_SEASONS)
  .map(Number)
  .sort((a, b) => a - b);

/** Anno di default della modalità storica (annata "vetrina" ad alta offesa). */
export const DEFAULT_HISTORICAL_YEAR = 1999;

/**
 * Costruisce la lega (30 squadre) da un'annata storica. Le squadre escono
 * nell'ordine di `FRANCHISES` così le division restano bilanciate 5×6. Se il
 * dataset non copre una franchigia (non dovrebbe accadere) la salta.
 */
export function buildHistoricalLeague(year = DEFAULT_HISTORICAL_YEAR): Team[] {
  const dataset = HISTORICAL_SEASONS[year] ?? SEASON_1999;
  const byFranchise = new Map(dataset.map((h) => [h.franchiseId, h]));
  const teams: Team[] = [];
  for (const f of FRANCHISES) {
    const h = byFranchise.get(f.id);
    if (h) teams.push(importHistoricalTeam(h).team);
  }
  return teams;
}
