import type { Batter, Pitcher, Team } from '../engine/types';
import type { SeasonState, SeasonBat, SeasonPit } from '../data/season';
import { emptyBat, emptyPit } from '../data/season';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import type { StatsMode } from './statlines';

// ---------------------------------------------------------------------------
// Contesto statistico del boxscore di partita. Fornisce, per ogni giocatore, la
// riga di stagione da mostrare nelle modalità non-"Partita":
//   - 'season'  → stagione IN CORSO, cumulata fino a questo momento.
//                 Squadra gestita: valori REALI accumulati (season.bat/pit).
//                 Avversario: proiezione dalle doti al giorno corrente.
//   - 'last'    → stagione PRECEDENTE (proiezione dell'annata year-1, piena),
//                 la stessa "backstory" mostrata nel popup giocatore.
// Stessa semantica del modale giocatore (App.tsx): la riga "Stagione" è reale,
// la "Precedente" è la stima dai rating finché non esiste uno storico reale.
// ---------------------------------------------------------------------------

export interface GameStatCtx {
  batLine: (mode: StatsMode, b: Batter) => SeasonBat | undefined;
  pitLine: (mode: StatsMode, p: Pitcher) => SeasonPit | undefined;
}

export function makeGameStatCtx(
  team: Team,
  season: SeasonState,
  seed: number,
  managed: boolean,
): GameStatCtx {
  const tierOf = new Map<string, BatTier>();
  team.lineup.forEach((b) => tierOf.set(b.id, 'starter'));
  team.bench.forEach((b) => tierOf.set(b.id, 'bench'));
  team.reserveBatters.forEach((b) => tierOf.set(b.id, 'reserve'));

  const curBat = (b: Batter): SeasonBat =>
    managed
      ? season.bat[b.id] ?? emptyBat()
      : projectBatterSeason(b, tierOf.get(b.id) ?? 'bench', {
          seed,
          year: season.year,
          day: season.day,
        });
  const prevBat = (b: Batter): SeasonBat =>
    projectBatterSeason(b, tierOf.get(b.id) ?? 'bench', {
      seed,
      year: season.year - 1,
      day: SEASON_GAMES,
    });
  const curPit = (p: Pitcher): SeasonPit =>
    managed
      ? season.pit[p.id] ?? emptyPit()
      : projectPitcherSeason(p, { seed, year: season.year, day: season.day });
  const prevPit = (p: Pitcher): SeasonPit =>
    projectPitcherSeason(p, { seed, year: season.year - 1, day: SEASON_GAMES });

  return {
    batLine: (mode, b) => (mode === 'season' ? curBat(b) : mode === 'last' ? prevBat(b) : undefined),
    pitLine: (mode, p) => (mode === 'season' ? curPit(p) : mode === 'last' ? prevPit(p) : undefined),
  };
}
