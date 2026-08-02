import type { Batter, Pitcher, Team } from '../../engine/types';
import { FRANCHISES } from '../franchises';
import { importHistoricalTeam, importHistoricalPool } from './import';
import { SEASON_1997 } from './season1997';
import { SEASON_1998 } from './season1998';
import { SEASON_1999, type HistTeam, type HistBatLine, type HistPitLine } from './season1999';
import { SEASON_2000 } from './season2000';
import { SEASON_2001 } from './season2001';
import { SEASON_2002 } from './season2002';
import { SEASON_2003 } from './season2003';
import { SEASON_2004 } from './season2004';
import { SEASON_2005 } from './season2005';
import { SEASON_2006 } from './season2006';
import { SEASON_2007 } from './season2007';
import { SEASON_2008 } from './season2008';
import { SEASON_2009 } from './season2009';
import { SEASON_2010 } from './season2010';
import { FREE_AGENT_BATTERS_1997, FREE_AGENT_PITCHERS_1997 } from './freeAgents1997';
import { FREE_AGENT_BATTERS_1998, FREE_AGENT_PITCHERS_1998 } from './freeAgents1998';
import { FREE_AGENT_BATTERS_1999, FREE_AGENT_PITCHERS_1999 } from './freeAgents1999';
import { FREE_AGENT_BATTERS_2000, FREE_AGENT_PITCHERS_2000 } from './freeAgents2000';
import { FREE_AGENT_BATTERS_2001, FREE_AGENT_PITCHERS_2001 } from './freeAgents2001';
import { FREE_AGENT_BATTERS_2002, FREE_AGENT_PITCHERS_2002 } from './freeAgents2002';
import { FREE_AGENT_BATTERS_2003, FREE_AGENT_PITCHERS_2003 } from './freeAgents2003';
import { FREE_AGENT_BATTERS_2004, FREE_AGENT_PITCHERS_2004 } from './freeAgents2004';
import { FREE_AGENT_BATTERS_2005, FREE_AGENT_PITCHERS_2005 } from './freeAgents2005';
import { FREE_AGENT_BATTERS_2006, FREE_AGENT_PITCHERS_2006 } from './freeAgents2006';
import { FREE_AGENT_BATTERS_2007, FREE_AGENT_PITCHERS_2007 } from './freeAgents2007';
import { FREE_AGENT_BATTERS_2008, FREE_AGENT_PITCHERS_2008 } from './freeAgents2008';
import { FREE_AGENT_BATTERS_2009, FREE_AGENT_PITCHERS_2009 } from './freeAgents2009';
import { FREE_AGENT_BATTERS_2010, FREE_AGENT_PITCHERS_2010 } from './freeAgents2010';

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
  2001: SEASON_2001,
  2002: SEASON_2002,
  2003: SEASON_2003,
  2004: SEASON_2004,
  2005: SEASON_2005,
  2006: SEASON_2006,
  2007: SEASON_2007,
  2008: SEASON_2008,
  2009: SEASON_2009,
  2010: SEASON_2010,
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

/** Pool FREE AGENT storico per annata (battitori/lanciatori reali fuori dalle 30
 *  rose): i "fuori rosa" che alimentano il mercato dell'off-season. Vuoto per gli
 *  anni senza dataset FA. Seed deterministico per annata (solo potenziale). */
const HISTORICAL_FREE_AGENTS: Record<
  number,
  { bat: HistBatLine[]; pit: HistPitLine[] }
> = {
  1997: { bat: FREE_AGENT_BATTERS_1997, pit: FREE_AGENT_PITCHERS_1997 },
  1998: { bat: FREE_AGENT_BATTERS_1998, pit: FREE_AGENT_PITCHERS_1998 },
  1999: { bat: FREE_AGENT_BATTERS_1999, pit: FREE_AGENT_PITCHERS_1999 },
  2000: { bat: FREE_AGENT_BATTERS_2000, pit: FREE_AGENT_PITCHERS_2000 },
  2001: { bat: FREE_AGENT_BATTERS_2001, pit: FREE_AGENT_PITCHERS_2001 },
  2002: { bat: FREE_AGENT_BATTERS_2002, pit: FREE_AGENT_PITCHERS_2002 },
  2003: { bat: FREE_AGENT_BATTERS_2003, pit: FREE_AGENT_PITCHERS_2003 },
  2004: { bat: FREE_AGENT_BATTERS_2004, pit: FREE_AGENT_PITCHERS_2004 },
  2005: { bat: FREE_AGENT_BATTERS_2005, pit: FREE_AGENT_PITCHERS_2005 },
  2006: { bat: FREE_AGENT_BATTERS_2006, pit: FREE_AGENT_PITCHERS_2006 },
  2007: { bat: FREE_AGENT_BATTERS_2007, pit: FREE_AGENT_PITCHERS_2007 },
  2008: { bat: FREE_AGENT_BATTERS_2008, pit: FREE_AGENT_PITCHERS_2008 },
  2009: { bat: FREE_AGENT_BATTERS_2009, pit: FREE_AGENT_PITCHERS_2009 },
  2010: { bat: FREE_AGENT_BATTERS_2010, pit: FREE_AGENT_PITCHERS_2010 },
};

/**
 * Costruisce il pool free agent storico (istanziato come `Batter[]`/`Pitcher[]`)
 * dell'annata: i giocatori reali fuori dalle 30 rose attive. Alimenta il mercato
 * dell'off-season (`startOffseason(..., pool)`), così i fuori rosa restano
 * disponibili invece di sparire. Vuoto per gli anni senza dataset.
 */
export function buildHistoricalFreeAgents(
  year = DEFAULT_HISTORICAL_YEAR,
): { batters: Batter[]; pitchers: Pitcher[] } {
  const fa = HISTORICAL_FREE_AGENTS[year];
  if (!fa) return { batters: [], pitchers: [] };
  return importHistoricalPool(fa.bat, fa.pit, year * 7919);
}
