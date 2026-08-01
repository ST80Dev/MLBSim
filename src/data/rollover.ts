import type { Team } from '../engine/types';
import { createSeason, type SeasonState } from './season';
import { runOffseason, type OffseasonSummary, type OffseasonOptions } from './offseasonRun';

// ---------------------------------------------------------------------------
// ROLLOVER DI STAGIONE (Fase 5A, step 6) — la cerniera stagione → anno successivo.
//
// A postseason conclusa la lega ha uno STATO CHE DIVERGE DAL SEED (aging + scambi
// umani): non e' piu' ri-derivabile. Il rollover prende la lega dell'anno appena
// concluso + i suoi record e produce (a) la lega dell'anno SUCCESSIVO — invecchiata,
// ridistribuita da draft inverso e mercato — e (b) una stagione FRESCA (anno+1).
//
// Puro e deterministico: e' la meta "franchigia" di `runOffseason` piu' il reset di
// stagione. Vedi docs/franchise.md § Evoluzione pluriennale (rollover di stagione).
// ---------------------------------------------------------------------------

export interface RolloverInput {
  /** Lega dell'anno appena concluso (le 30 rose, gia' eventualmente diverse dal seed). */
  teams: Team[];
  /** Stato di stagione concluso (da' l'anno e i record W-L per l'ordine di draft). */
  season: SeasonState;
  /** Seed della lega (rende l'off-season deterministica). */
  seed: number;
  /** Opzioni off-season (squadra gestita, politica di cap, perf per l'aging). */
  options?: OffseasonOptions;
}

export interface RolloverResult {
  /** Le 30 squadre dell'anno successivo, schierabili. */
  teams: Team[];
  /** Stagione nuova di zecca (anno+1, record/statistiche azzerati). */
  season: SeasonState;
  /** Riepilogo dell'off-season (ritiri, draft, movimenti di mercato). */
  summary: OffseasonSummary;
}

/**
 * Esegue il rollover: off-season completa sulla lega conclusa, poi apre la stagione
 * successiva. `season.records` guida l'ordine di draft (peggiori prima). L'anno
 * nuovo e' `season.year + 1`.
 */
export function rolloverSeason(input: RolloverInput): RolloverResult {
  const { teams, season, seed, options } = input;
  const summary = runOffseason(teams, seed, season.year, season.records, options);
  return {
    teams: summary.teams,
    season: createSeason(season.year + 1),
    summary,
  };
}
