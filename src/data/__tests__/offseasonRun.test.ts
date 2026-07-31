import { describe, it, expect } from 'vitest';
import { runOffseason } from '../offseasonRun';
import { assembleTeam } from '../generator';
import { generateLeague } from '../league';
import { validateFieldSet } from '../../engine/lineup';
import { createLiveGame, quickSim, toGameResult } from '../../engine/game';
import type { Team, Batter, Pitcher } from '../../engine/types';
import type { WLRecord } from '../season';

const SEED = 20260728;
const standingsFor = (teams: Team[]): Record<string, WLRecord> => {
  const s: Record<string, WLRecord> = {};
  teams.forEach((t, i) => (s[t.id] = { w: 100 - i, l: 62 + i }));
  return s;
};
const flat = (t: Team) => ({
  batters: [...t.lineup, ...t.bench, ...t.reserveBatters],
  pitchers: [...t.rotation, ...t.bullpen, ...t.reservePitchers],
});
const sizesOk = (t: Team) =>
  t.lineup.length + t.bench.length + t.reserveBatters.length === 20 &&
  t.rotation.length + t.bullpen.length + t.reservePitchers.length === 15;

describe('assembleTeam (reslot)', () => {
  const base = generateLeague(SEED)[0];

  it('ricompone una Team valida e a taglia (20/15) da un set piatto', () => {
    const { batters, pitchers } = flat(base);
    const t = assembleTeam(base, batters, pitchers);
    expect(validateFieldSet(t.lineup.map((b) => b.position)).ok).toBe(true);
    expect(sizesOk(t)).toBe(true);
    expect(t.bullpen.filter((p) => p.role === 'CL')).toHaveLength(1); // un closer
    expect(t.id).toBe(base.id); // identita' preservata
  });

  it('backfilla a replacement-level quando il set e sotto taglia', () => {
    const { batters, pitchers } = flat(base);
    // Togli 4 battitori e 3 lanciatori: il finalize deve reintegrare a 20/15.
    const t = assembleTeam(base, batters.slice(0, batters.length - 4), pitchers.slice(0, pitchers.length - 3));
    expect(sizesOk(t)).toBe(true);
    expect(validateFieldSet(t.lineup.map((b) => b.position)).ok).toBe(true);
    // I rimpiazzi hanno id dedicato.
    const all = [...t.reserveBatters, ...t.reservePitchers];
    expect(all.some((p) => p.id.includes('-repl-'))).toBe(true);
  });

  it('scarta l’eccedenza (mai sopra taglia) e preserva l’identita', () => {
    const { batters, pitchers } = flat(base);
    const dupB: Batter[] = [...batters, ...batters.map((b) => ({ ...b, id: b.id + '-x' }))]; // 40 bat
    const dupP: Pitcher[] = [...pitchers, ...pitchers.map((p) => ({ ...p, id: p.id + '-x' }))]; // 30 pit
    const t = assembleTeam(base, dupB, dupP);
    expect(sizesOk(t)).toBe(true);
  });
});

describe('runOffseason', () => {
  const league = generateLeague(SEED);
  const standings = standingsFor(league);

  it('ritorna 30 squadre valide, a taglia e GIOCABILI', () => {
    const res = runOffseason(league, SEED, 1, standings);
    expect(res.teams).toHaveLength(30);
    expect(res.year).toBe(2);
    for (const t of res.teams) {
      expect(validateFieldSet(t.lineup.map((b) => b.position)).ok).toBe(true);
      expect(sizesOk(t)).toBe(true);
    }
    // Nessun crash in simulazione.
    const g = createLiveGame(res.teams[0], res.teams[1], 42);
    quickSim(g);
    expect(() => toGameResult(g)).not.toThrow();
  });

  it('fa AVANZARE l’eta dei sopravvissuti di 1 e produce ritiri + pick', () => {
    const ageById = new Map<string, number>();
    league.forEach((t) => [...flat(t).batters, ...flat(t).pitchers].forEach((p) => ageById.set(p.id, p.age)));
    const res = runOffseason(league, SEED, 1, standings);
    let checked = 0;
    for (const t of res.teams) {
      for (const p of [...flat(t).batters, ...flat(t).pitchers]) {
        const before = ageById.get(p.id);
        if (before !== undefined) {
          expect(p.age).toBe(before + 1); // sopravvissuto: +1 anno
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100); // molti sopravvissuti verificati
    expect(res.retired.length).toBeGreaterThan(0);
    expect(res.draftPicks.length).toBe(30 * 3); // 30 squadre × 3 giri
  });

  it('e deterministico e NON muta la lega in ingresso', () => {
    const snapshot = JSON.stringify(league);
    const a = runOffseason(league, SEED, 1, standings);
    const b = runOffseason(league, SEED, 1, standings);
    expect(JSON.stringify(a.teams)).toBe(JSON.stringify(b.teams));
    expect(JSON.stringify(a.retired)).toBe(JSON.stringify(b.retired));
    expect(JSON.stringify(league)).toBe(snapshot); // input intatto
  });

  it('regge piu anni di fila mantenendo rose valide', () => {
    let teams = league;
    for (let y = 1; y <= 4; y++) {
      const res = runOffseason(teams, SEED, y, standingsFor(teams));
      teams = res.teams;
      for (const t of teams) {
        expect(validateFieldSet(t.lineup.map((b) => b.position)).ok).toBe(true);
        expect(sizesOk(t)).toBe(true);
      }
    }
  });
});
