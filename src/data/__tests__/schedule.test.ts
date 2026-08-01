import { describe, it, expect } from 'vitest';
import { generateSchedule, REGULAR_GAMES } from '../schedule';
import { buildHistoricalLeague } from '../historical/league';
import { withRotationStarter, rotationPhase } from '../generator';
import { teamById } from '../league';

const league = buildHistoricalLeague(2000);
const myId = league[0].id;
const sched = generateSchedule(12345, myId, league);

/** Raggruppa la regular season in "run" di gare consecutive contro lo stesso avversario. */
function runs(games: typeof sched.regular) {
  const out: Array<{ opp: string | null; home: boolean; len: number; startIdx: number }> = [];
  let start = 0;
  for (let i = 1; i <= games.length; i++) {
    if (i === games.length || games[i].opponentId !== games[start].opponentId) {
      out.push({ opp: games[start].opponentId, home: games[start].home, len: i - start, startIdx: start });
      start = i;
    }
  }
  return out;
}

describe('Calendario a serie', () => {
  it('162 gare, giorni consecutivi 1..162', () => {
    expect(sched.regular.length).toBe(REGULAR_GAMES);
    sched.regular.forEach((g, i) => {
      expect(g.day).toBe(i + 1);
      expect(g.phase).toBe('regular');
      expect(g.opponentId).toBeTruthy();
    });
  });

  it('gioca a SERIE: prevalenza di 3 gare consecutive, sede unica per serie', () => {
    const rs = runs(sched.regular);
    // Sede costante dentro ogni serie (una serie è tutta in casa o tutta fuori).
    for (const r of rs) {
      const slice = sched.regular.slice(r.startIdx, r.startIdx + r.len);
      expect(slice.every((g) => g.home === r.home)).toBe(true);
    }
    // Esistono davvero le serie (non gare sparse): tante run da 2+.
    const multi = rs.filter((r) => r.len >= 2).length;
    expect(multi).toBeGreaterThan(30);
    // La lunghezza più comune è 3.
    const hist: Record<number, number> = {};
    for (const r of rs) hist[r.len] = (hist[r.len] ?? 0) + 1;
    const modal = Object.entries(hist).sort((a, b) => b[1] - a[1])[0][0];
    expect(modal).toBe('3');
  });

  it('più gare coi rivali di division che con l’interlega', () => {
    const me = teamById(league, myId)!;
    const count = (pred: (oppId: string) => boolean) =>
      sched.regular.filter((g) => g.opponentId && pred(g.opponentId)).length;
    const sameDiv = count((id) => {
      const t = teamById(league, id);
      return !!t && t.league === me.league && t.division === me.division;
    });
    const interleague = count((id) => teamById(league, id)?.league !== me.league);
    expect(sameDiv).toBeGreaterThan(interleague);
  });

  it('nella serie l’avversario RUOTA i partenti (3 partenti diversi)', () => {
    const rs = runs(sched.regular).filter((r) => r.len >= 3);
    expect(rs.length).toBeGreaterThan(0);
    const r = rs[0];
    const opp = teamById(league, r.opp!)!;
    const phase = rotationPhase(opp);
    // Il partente (rotation[0] dopo la rotazione) nelle 3 gare consecutive.
    const starters = new Set<string>();
    for (let k = 0; k < r.len; k++) {
      const day = r.startIdx + k; // season.day 0-based
      starters.add(withRotationStarter(opp, day + phase).rotation[0].id);
    }
    expect(starters.size).toBe(r.len); // tutti diversi
  });

  it('deterministico: stesso seed → stesso calendario', () => {
    const a = generateSchedule(999, myId, league);
    const b = generateSchedule(999, myId, league);
    expect(a.regular.map((g) => `${g.opponentId}:${g.home}`)).toEqual(
      b.regular.map((g) => `${g.opponentId}:${g.home}`),
    );
  });
});
