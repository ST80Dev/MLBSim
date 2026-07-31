import { describe, it, expect } from 'vitest';
import { rolloverSeason } from '../rollover';
import { generateLeague } from '../league';
import { validateFieldSet } from '../../engine/lineup';
import type { Team } from '../../engine/types';
import type { WLRecord } from '../season';

const SEED = 20260728;
const standingsFor = (teams: Team[]): Record<string, WLRecord> => {
  const s: Record<string, WLRecord> = {};
  teams.forEach((t, i) => (s[t.id] = { w: 100 - i, l: 62 + i }));
  return s;
};

describe('rolloverSeason', () => {
  const teams = generateLeague(SEED);
  const standings = standingsFor(teams);

  it('produce la lega del nuovo anno + una SeasonState azzerata (year+1)', () => {
    const r = rolloverSeason({ teams, seed: SEED, source: 'generated', year: 3, standings });
    expect(r.teams).toHaveLength(30);
    expect(r.season.year).toBe(4);
    expect(r.season.day).toBe(0);
    expect(Object.keys(r.season.records)).toHaveLength(0);
    expect(r.summary.year).toBe(4);
    // Rose valide e giocabili.
    for (const t of r.teams) {
      expect(validateFieldSet(t.lineup.map((b) => b.position)).ok).toBe(true);
    }
  });

  it('è deterministico e non muta l’input', () => {
    const snap = JSON.stringify(teams);
    const a = rolloverSeason({ teams, seed: SEED, source: 'generated', year: 1, standings });
    const b = rolloverSeason({ teams, seed: SEED, source: 'generated', year: 1, standings });
    expect(JSON.stringify(a.teams)).toBe(JSON.stringify(b.teams));
    expect(JSON.stringify(teams)).toBe(snap);
  });

  it('concatenabile per più stagioni (l’output alimenta il rollover successivo)', () => {
    let cur = teams;
    let year = 1;
    for (let i = 0; i < 3; i++) {
      const r = rolloverSeason({ teams: cur, seed: SEED, source: 'generated', year, standings: standingsFor(cur) });
      cur = r.teams;
      year = r.season.year;
    }
    expect(year).toBe(4);
    expect(cur).toHaveLength(30);
    for (const t of cur) expect(validateFieldSet(t.lineup.map((b) => b.position)).ok).toBe(true);
  });
});
