import type { Batter, Pitcher, Team } from '../engine/types';
import type { SeasonState, SeasonBat, SeasonPit } from '../data/season';
import { emptyBat, emptyPit } from '../data/season';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import type { StatsMode } from './statlines';

// ---------------------------------------------------------------------------
// Contesto statistico del boxscore di partita. Fornisce, per ogni giocatore, la
// riga di stagione da mostrare nelle modalità non-"Partita":
//   - 'season'  → stagione IN CORSO, cumulata fino a questo momento. Valori REALI
//                 accumulati (season.bat/pit) per TUTTE le squadre: le gare di lega
//                 sono simulate e accumulate come le nostre. (Proiettare l'avversario
//                 a mezza stagione dava rate impossibili — vedi leaderboard.)
//   - 'last'    → stagione PRECEDENTE (proiezione dell'annata year-1, piena),
//                 la stessa "backstory" mostrata nel popup giocatore.
// ---------------------------------------------------------------------------

export interface GameStatCtx {
  batLine: (mode: StatsMode, b: Batter) => SeasonBat | undefined;
  pitLine: (mode: StatsMode, p: Pitcher) => SeasonPit | undefined;
}

export function makeGameStatCtx(team: Team, season: SeasonState, seed: number): GameStatCtx {
  const tierOf = new Map<string, BatTier>();
  team.lineup.forEach((b) => tierOf.set(b.id, 'starter'));
  team.bench.forEach((b) => tierOf.set(b.id, 'bench'));
  team.reserveBatters.forEach((b) => tierOf.set(b.id, 'reserve'));

  // Stagione IN CORSO: valori REALI accumulati per TUTTI (gestita E avversario) —
  // le gare di lega sono simulate e accumulate come le nostre. NIENTE proiezione:
  // proiettare a mezza stagione dava rate impossibili (WHIP 5.57, K/9 27, ERA 27).
  // Chi non ha ancora giocato → riga vuota (.000 / —). Come la leaderboard.
  const curBat = (b: Batter): SeasonBat => season.bat[b.id] ?? emptyBat();
  const prevBat = (b: Batter): SeasonBat =>
    projectBatterSeason(b, tierOf.get(b.id) ?? 'bench', {
      seed,
      year: season.year - 1,
      day: SEASON_GAMES,
    });
  const curPit = (p: Pitcher): SeasonPit => season.pit[p.id] ?? emptyPit();
  const prevPit = (p: Pitcher): SeasonPit =>
    projectPitcherSeason(p, { seed, year: season.year - 1, day: SEASON_GAMES });

  return {
    batLine: (mode, b) => (mode === 'season' ? curBat(b) : mode === 'last' ? prevBat(b) : undefined),
    pitLine: (mode, p) => (mode === 'season' ? curPit(p) : mode === 'last' ? prevPit(p) : undefined),
  };
}
