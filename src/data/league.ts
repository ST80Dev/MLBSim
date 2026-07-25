import type { Team } from '../engine/types';
import { makeRng } from '../engine/rng';
import { FRANCHISES } from './franchises';
import { generateTeamFromFranchise } from './generator';

// La lega: le 30 franchigie reali con rosa procedurale, generate da un seed
// unico e deterministico. E' la base condivisa di calendario, classifiche e
// leaderboard: tutte leggono QUESTA stessa lega, cosi' i numeri sono coerenti
// tra le pagine. Puro: nessuna dipendenza da UI o rete.

export type LeagueId = 'AL' | 'NL';
export type DivisionId = 'E' | 'C' | 'W';

/** Etichette leggibili (italiano) per lega e division. */
export const LEAGUE_LABEL: Record<LeagueId, string> = {
  AL: 'American League',
  NL: 'National League',
};
export const DIVISION_LABEL: Record<DivisionId, string> = {
  E: 'East',
  C: 'Central',
  W: 'West',
};

/**
 * Genera l'intera lega (30 squadre) dal seed, nell'ordine fisso di `FRANCHISES`.
 * Ogni rosa consuma l'RNG in sequenza: a parita' di seed la lega e' identica.
 */
export function generateLeague(seed: number): Team[] {
  const rng = makeRng(seed);
  return FRANCHISES.map((f) => generateTeamFromFranchise(rng, f));
}

export interface DivisionGroup {
  league: LeagueId;
  division: DivisionId;
  teams: Team[];
}

/** Ordine canonico delle 6 division (AL E/C/W, poi NL E/C/W). */
const DIVISION_ORDER: Array<{ league: LeagueId; division: DivisionId }> = [
  { league: 'AL', division: 'E' },
  { league: 'AL', division: 'C' },
  { league: 'AL', division: 'W' },
  { league: 'NL', division: 'E' },
  { league: 'NL', division: 'C' },
  { league: 'NL', division: 'W' },
];

/** Raggruppa le squadre nelle 6 division, nell'ordine canonico. */
export function byDivision(teams: Team[]): DivisionGroup[] {
  return DIVISION_ORDER.map(({ league, division }) => ({
    league,
    division,
    teams: teams.filter((t) => t.league === league && t.division === division),
  }));
}

/** Squadre della stessa division di `teamId` (incluso se stesso). */
export function divisionRivals(teams: Team[], teamId: string): Team[] {
  const me = teams.find((t) => t.id === teamId);
  if (!me) return [];
  return teams.filter((t) => t.league === me.league && t.division === me.division);
}

/** Cerca una squadra per id. */
export function teamById(teams: Team[], id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}
