import { describe, it, expect } from 'vitest';
import { generateLeague, byDivision, teamById, type LeagueId } from '../league';
import { createSeason, winPct, type SeasonState, type WLRecord } from '../season';
import { createLiveGame, quickSim, toGameResult } from '../../engine/game';
import {
  seedPlayoffs,
  recordManagedGame,
  simRestOfPlayoffs,
  nextManagedGame,
  managedQualified,
  winsNeeded,
  hostsHigh,
  type PlayoffState,
} from '../playoff';

const BASE = 4242;

/** Stagione sintetica: record STRETTAMENTE decrescenti per indice (nessun pari),
 *  così seeding e campioni division sono deterministici e verificabili. */
function syntheticSeason(seed = 1) {
  const teams = generateLeague(seed);
  const records: Record<string, WLRecord> = {};
  teams.forEach((t, i) => (records[t.id] = { w: 100 - i, l: 62 + i })); // somma 162
  const season: SeasonState = { ...createSeason(1), records };
  return { teams, season, records };
}

describe('playoff — soglie e casa', () => {
  it('winsNeeded', () => {
    expect(winsNeeded(3)).toBe(2);
    expect(winsNeeded(5)).toBe(3);
    expect(winsNeeded(7)).toBe(4);
  });
  it('hostsHigh: bo3 tutte in casa, bo5 2-2-1, bo7 2-3-2', () => {
    expect([0, 1, 2].map((g) => hostsHigh(3, g))).toEqual([true, true, true]);
    expect([0, 1, 2, 3, 4].map((g) => hostsHigh(5, g))).toEqual([true, true, false, false, true]);
    expect([0, 1, 2, 3, 4, 5, 6].map((g) => hostsHigh(7, g))).toEqual([
      true, true, false, false, false, true, true,
    ]);
  });
});

describe('playoff — seeding', () => {
  const { teams, season } = syntheticSeason();
  const ps = seedPlayoffs(season, teams, BASE, '');

  for (const L of ['AL', 'NL'] as LeagueId[]) {
    it(`${L}: 6 teste distinte, tutte della lega`, () => {
      const s = ps.seeds[L];
      expect(s.length).toBe(6);
      expect(new Set(s).size).toBe(6);
      for (const id of s) expect(teamById(teams, id)!.league).toBe(L);
    });

    it(`${L}: seed 1-3 sono i 3 campioni division`, () => {
      const expected = new Set(
        byDivision(teams)
          .filter((g) => g.league === L)
          .map((g) => [...g.teams].sort((a, b) => season.records[b.id].w - season.records[a.id].w)[0].id),
      );
      expect(new Set(ps.seeds[L].slice(0, 3))).toEqual(expected);
    });

    it(`${L}: ordinamento per record dentro campioni e wild card`, () => {
      const pct = (id: string) => winPct(season.records[id]);
      const s = ps.seeds[L];
      expect(pct(s[0])).toBeGreaterThanOrEqual(pct(s[1]));
      expect(pct(s[1])).toBeGreaterThanOrEqual(pct(s[2]));
      expect(pct(s[3])).toBeGreaterThanOrEqual(pct(s[4]));
      expect(pct(s[4])).toBeGreaterThanOrEqual(pct(s[5]));
    });
  }
});

describe('playoff — autosim completo (gestita non qualificata)', () => {
  const { teams, season } = syntheticSeason();
  const ps = seedPlayoffs(season, teams, BASE, ''); // nessuna gestita → tutto simulato

  it('incorona esattamente un campione, tutte le serie decise', () => {
    expect(ps.championId).toBeDefined();
    expect(teamById(teams, ps.championId!)).toBeDefined();
    for (const s of Object.values(ps.series)) {
      expect(s.winnerId).toBeDefined();
      // vincitore ha esattamente le vittorie necessarie, gare entro il best-of.
      const need = winsNeeded(s.bestOf);
      expect(Math.max(s.highWins, s.lowWins)).toBe(need);
      expect(s.games.length).toBeGreaterThanOrEqual(need);
      expect(s.games.length).toBeLessThanOrEqual(s.bestOf);
    }
  });

  it('il campione è una delle due finaliste WS', () => {
    const ws = ps.series['WS'];
    expect([ws.highId, ws.lowId]).toContain(ps.championId);
  });

  it('deterministico: stesso seed → stesso esito', () => {
    const b = seedPlayoffs(season, teams, BASE, '');
    expect(JSON.stringify(b)).toBe(JSON.stringify(ps));
  });
});

/** Gioca davvero (motore) una gara della serie della gestita. */
function playManagedGame(ps: PlayoffState, teams: Team[]): GameResult {
  const ng = nextManagedGame(ps)!;
  const me = teamById(teams, ps.managedId)!;
  const opp = teamById(teams, ng.opponentId)!;
  const home = ng.home ? me : opp;
  const away = ng.home ? opp : me;
  const g = createLiveGame(away, home, (BASE ^ (ng.gameNo + 1) ^ ps.managedGames) >>> 0);
  quickSim(g);
  return toGameResult(g);
}
type Team = ReturnType<typeof generateLeague>[number];
type GameResult = ReturnType<typeof toGameResult>;

describe('playoff — flusso della squadra gestita', () => {
  const { teams, season } = syntheticSeason();
  const managed = seedPlayoffs(season, teams, BASE, '').seeds.AL[0]; // testa 1 AL (bye)
  let ps = seedPlayoffs(season, teams, BASE, managed);

  it('la testa 1 è qualificata e parte dalla Division Series (bye al WC)', () => {
    expect(managedQualified(ps)).toBe(true);
    const ng = nextManagedGame(ps);
    expect(ng).not.toBeNull();
    expect(ng!.round).toBe('DS');
    expect(ng!.gameNo).toBe(0);
  });

  it('giocando le proprie gare la postseason avanza fino a un campione', () => {
    let guard = 0;
    while (nextManagedGame(ps) && guard++ < 80) {
      const result = playManagedGame(ps, teams);
      ps = recordManagedGame(ps, result, teams, BASE);
    }
    // O la gestita ha vinto tutto, o è stata eliminata: in ogni caso, simulando
    // il resto si arriva sempre a un unico campione.
    if (!ps.championId) ps = simRestOfPlayoffs(ps, teams, BASE);
    expect(ps.championId).toBeDefined();
    // Stat di playoff accumulate nel bucket separato (non nella stagione).
    expect(Object.keys(ps.bat).length).toBeGreaterThan(0);
    expect(Object.keys(ps.pit).length).toBeGreaterThan(0);
    expect(ps.managedGames).toBeGreaterThan(0);
    // Rotazione playoff: registrate le partenze della gestita.
    expect(Object.keys(ps.rotation.lastStart).length).toBeGreaterThan(0);
  });
});
