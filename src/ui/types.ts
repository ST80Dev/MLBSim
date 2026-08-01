import type { Team } from '../engine/types';
import type { LeagueSource } from '../data/leagueMode';
import type { WLRecord } from '../data/season';

// Tipi UI condivisi tra App e i moduli estratti (game/pagine). Tenuti a parte per
// evitare import circolari (i moduli non devono importare da App.tsx).

/** Lato di una gara: ospite o casa. */
export type Side = 'away' | 'home';

/** Metadati di un salvataggio per l'hub di caricamento (letti dal payload). */
export interface SavedGame {
  slot: string;
  updatedAt: string;
  source: LeagueSource;
  seed?: number;
  managedTeamId?: string;
  team?: Team;
  year: number;
  day: number;
  record: WLRecord;
}
