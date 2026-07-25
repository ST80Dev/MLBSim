import { describe, it, expect } from 'vitest';
import {
  createSeason,
  advanceWithResult,
  recordOf,
  winPct,
  sortByRecord,
} from '../season';
import { generateLeague } from '../league';
import { createLiveGame, quickSim, toGameResult } from '../../engine/game';

const teams = generateLeague(2024);
const home = teams[0];
const away = teams[1];

function playOne() {
  const g = createLiveGame(away, home, 777);
  quickSim(g);
  return toGameResult(g);
}

describe('advanceWithResult', () => {
  it('registra i record delle due squadre e fa avanzare il giorno', () => {
    const s0 = createSeason();
    const res = playOne();
    const s1 = advanceWithResult(s0, res, home.id, teams, 2024);
    expect(s1.day).toBe(1);
    const rh = recordOf(s1, home.id);
    const ra = recordOf(s1, away.id);
    expect(rh.w + rh.l).toBe(1);
    expect(ra.w + ra.l).toBe(1);
    // esattamente una delle due ha vinto
    expect(rh.w + ra.w).toBe(1);
  });

  it('accumula le statistiche reali della squadra gestita', () => {
    const res = playOne();
    const s1 = advanceWithResult(createSeason(), res, home.id, teams, 2024);
    const managed = res.home.id === home.id ? res.homeStats : res.awayStats;
    const firstBatter = managed.batting[0];
    const acc = s1.bat[firstBatter.id];
    expect(acc).toBeDefined();
    expect(acc.g).toBe(1);
    expect(acc.ab).toBe(firstBatter.ab);
    expect(acc.h).toBe(firstBatter.h);
    // starter accreditato di una apertura
    const starter = managed.pitching[0];
    expect(s1.pit[starter.id].gs).toBe(1);
    expect(s1.pit[starter.id].outs).toBe(starter.outs);
  });

  it('quick-simula il resto della lega: tutte le squadre giocano', () => {
    const s1 = advanceWithResult(createSeason(), playOne(), home.id, teams, 2024);
    const played = teams.filter((t) => {
      const r = recordOf(s1, t.id);
      return r.w + r.l > 0;
    });
    expect(played.length).toBe(teams.length); // tutte e 30
  });

  it('non muta lo stato in ingresso', () => {
    const s0 = createSeason();
    const snap = JSON.stringify(s0);
    advanceWithResult(s0, playOne(), home.id, teams, 2024);
    expect(JSON.stringify(s0)).toBe(snap);
  });

  it('accumula su piu giornate', () => {
    let s = createSeason();
    s = advanceWithResult(s, playOne(), home.id, teams, 2024);
    s = advanceWithResult(s, playOne(), home.id, teams, 2024);
    expect(s.day).toBe(2);
    const managed = playOne();
    const b0 = (managed.home.id === home.id ? managed.homeStats : managed.awayStats).batting[0].id;
    expect(s.bat[b0].g).toBe(2);
  });
});

describe('classifica', () => {
  it('winPct e ordinamento', () => {
    const s = advanceWithResult(createSeason(), playOne(), home.id, teams, 2024);
    const ordered = sortByRecord(s, teams);
    for (let i = 1; i < ordered.length; i++) {
      expect(winPct(recordOf(s, ordered[i - 1].id))).toBeGreaterThanOrEqual(
        winPct(recordOf(s, ordered[i].id)),
      );
    }
  });
});
