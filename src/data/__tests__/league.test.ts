import { describe, it, expect } from 'vitest';
import { generateLeague, byDivision, divisionRivals } from '../league';
import { generateSchedule, PRESEASON_GAMES, REGULAR_GAMES } from '../schedule';

describe('generateLeague', () => {
  it('genera 30 squadre in 6 division da 5', () => {
    const teams = generateLeague(2024);
    expect(teams).toHaveLength(30);
    const groups = byDivision(teams);
    expect(groups).toHaveLength(6);
    for (const g of groups) expect(g.teams).toHaveLength(5);
  });

  it('e deterministico dal seed', () => {
    const a = generateLeague(7).map((t) => t.lineup.map((b) => b.id).join(','));
    const b = generateLeague(7).map((t) => t.lineup.map((b) => b.id).join(','));
    expect(a).toEqual(b);
    expect(generateLeague(8)[0].lineup[0].id).toBe(generateLeague(8)[0].lineup[0].id);
  });

  it('divisionRivals restituisce le 5 della stessa division', () => {
    const teams = generateLeague(1);
    const rivals = divisionRivals(teams, teams[0].id);
    expect(rivals).toHaveLength(5);
    expect(rivals.every((t) => t.league === teams[0].league && t.division === teams[0].division)).toBe(
      true,
    );
  });
});

describe('generateSchedule', () => {
  const teams = generateLeague(2024);
  const me = teams[0].id;

  it('produce 10 prestagione + 162 regular + slot playoff', () => {
    const s = generateSchedule(2024, me, teams);
    expect(s.preseason).toHaveLength(PRESEASON_GAMES);
    expect(s.regular).toHaveLength(REGULAR_GAMES);
    expect(s.playoff.length).toBeGreaterThan(0);
  });

  it('non mette mai la squadra gestita come avversaria di se stessa', () => {
    const s = generateSchedule(2024, me, teams);
    for (const g of [...s.preseason, ...s.regular]) expect(g.opponentId).not.toBe(me);
  });

  it('gioca piu partite contro i rivali di division che contro una singola altra', () => {
    const s = generateSchedule(2024, me, teams);
    const rivalIds = new Set(divisionRivals(teams, me).filter((t) => t.id !== me).map((t) => t.id));
    const counts = new Map<string, number>();
    for (const g of s.regular) {
      if (g.opponentId) counts.set(g.opponentId, (counts.get(g.opponentId) ?? 0) + 1);
    }
    const rivalGames = [...counts].filter(([id]) => rivalIds.has(id)).reduce((a, [, n]) => a + n, 0);
    // I 4 rivali dovrebbero pesare parecchio (76 su 162 nello scaffold).
    expect(rivalGames).toBeGreaterThan(60);
  });

  it('e deterministico dal seed e dalla squadra', () => {
    const a = generateSchedule(2024, me, teams).regular.map((g) => `${g.opponentId}${g.home}`);
    const b = generateSchedule(2024, me, teams).regular.map((g) => `${g.opponentId}${g.home}`);
    expect(a).toEqual(b);
  });
});
