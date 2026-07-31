import type { Team } from '../engine/types';
import { createSeason, type SeasonState, type WLRecord } from './season';
import { runOffseason, type OffseasonSummary } from './offseasonRun';
import { GENERATED_MODE, HISTORICAL_MODE, type LeagueSource } from './leagueMode';
import type { FreeAgent } from './offseason';

// ---------------------------------------------------------------------------
// ROLLOVER DI STAGIONE — la cerniera tra una stagione e la successiva.
//
// La META' FRANCHIGIA del rollover (aging + ritiri + draft + mercato FA +
// finalize) e' `runOffseason`. Qui la si avvolge in una forma pronta per il
// salvataggio/UI: prende la lega e la classifica finale dell'anno che si chiude e
// ritorna la lega dell'anno nuovo + una `SeasonState` azzerata (year+1).
//
// Nota persistenza (schema v3): appena questo gira, le rose DIVERGONO dal seed →
// vanno salvate in `GameSave.teams` (non piu' ri-derivabili da `generateLeague`).
// La META' "stagione→scorsa→carriera" (statistiche) resta di Fase 4 e si aggancia
// a parte. Puro e deterministico.
// ---------------------------------------------------------------------------

export interface RolloverInput {
  /** Lega dell'anno che si chiude (le 30 rose correnti). */
  teams: Team[];
  /** Seed della lega (cap ε + generazione classe draft). */
  seed: number;
  /** Sorgente: sceglie la politica di cap (generata → soft; storico → soft/off). */
  source: LeagueSource;
  /** Squadra gestita (le AI la saltano nel mercato). */
  managedId?: string;
  /** Anno che si CHIUDE (il nuovo anno sarà year+1). */
  year: number;
  /** Record W-L finali, per l'ordine inverso del draft. */
  standings: Record<string, WLRecord>;
  /** Free agent già disponibili (import storico: fuori-rosa reali). */
  initialPool?: FreeAgent[];
  /** Segnale d'impiego per l'aging (Fase 4). Default 0 = neutro. */
  perf?: (playerId: string) => number;
}

export interface RolloverResult {
  /** Le 30 squadre pronte per la stagione successiva (da persistere in v3). */
  teams: Team[];
  /** Stato di stagione azzerato per il nuovo anno (year+1, giorno 0, record vuoti). */
  season: SeasonState;
  /** Riepilogo off-season (ritiri, draft, mercato) per la UI. */
  summary: OffseasonSummary;
}

/**
 * Esegue il rollover: off-season completo + nuova stagione. La UI/salvataggio
 * consuma `teams` (schema v3) e `season`; `summary` alimenta il riepilogo
 * off-season. Non muta l'input.
 */
export function rolloverSeason(input: RolloverInput): RolloverResult {
  const mode = input.source === 'historical' ? HISTORICAL_MODE : GENERATED_MODE;
  const summary = runOffseason(input.teams, input.seed, input.year, input.standings, {
    managedId: input.managedId,
    mode,
    initialPool: input.initialPool,
    perf: input.perf,
  });
  return {
    teams: summary.teams,
    season: createSeason(summary.year),
    summary,
  };
}
