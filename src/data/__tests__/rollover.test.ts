import { describe, it, expect } from 'vitest';
import { generateLeague } from '../league';
import { assembleTeam } from '../generator';
import { ageAndRetire, finalizeOffseason } from '../offseasonRun';
import { rolloverSeason } from '../rollover';
import { startOffseason } from '../offseason';
import { createSeason } from '../season';
import { teamPayroll, outerWall, GENERATED_MODE } from '../leagueMode';
import { makeRng } from '../../engine/rng';
import type { Team } from '../../engine/types';

const LINEUP_SLOTS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

/** Invarianti di una squadra schierabile. */
function expectPlayable(t: Team) {
  expect(t.lineup).toHaveLength(9);
  // Le 9 caselle del lineup sono tutte coperte, senza doppioni.
  expect(new Set(t.lineup.map((b) => b.position))).toEqual(new Set(LINEUP_SLOTS));
  expect(t.rotation).toHaveLength(5);
  expect(t.bullpen.length).toBeGreaterThanOrEqual(1);
  // Un closer designato in bullpen.
  expect(t.bullpen.some((p) => p.role === 'CL')).toBe(true);
  // Taglia minima: 20 battitori e 15 lanciatori (completata coi replacement).
  const nBat = t.lineup.length + t.bench.length + t.reserveBatters.length;
  const nPit = t.rotation.length + t.bullpen.length + t.reservePitchers.length;
  expect(nBat).toBeGreaterThanOrEqual(20);
  expect(nPit).toBeGreaterThanOrEqual(15);
}

describe('assembleTeam (reslot)', () => {
  it('ricompone una squadra schierabile dalle liste piatte', () => {
    const [base] = generateLeague(11);
    const flatBat = [...base.lineup, ...base.bench, ...base.reserveBatters];
    const flatPit = [...base.rotation, ...base.bullpen, ...base.reservePitchers];
    const t = assembleTeam(base, flatBat, flatPit, makeRng(1));
    expectPlayable(t);
    expect(t.id).toBe(base.id);
  });

  it('completa a taglia coi replacement quando la rosa e corta', () => {
    const [base] = generateLeague(12);
    const t = assembleTeam(base, base.lineup.slice(0, 6), base.rotation.slice(0, 2), makeRng(2));
    expectPlayable(t); // riempita fino a 20/15
  });

  it('e puro: non muta le liste in ingresso', () => {
    const [base] = generateLeague(13);
    const flatBat = [...base.lineup];
    const snapshot = flatBat.map((b) => b.position);
    assembleTeam(base, flatBat, [...base.rotation], makeRng(3));
    expect(flatBat.map((b) => b.position)).toEqual(snapshot);
  });

  it('e deterministico: stesso seme → stessa rosa', () => {
    const [base] = generateLeague(14);
    const bat = [...base.lineup, ...base.bench];
    const pit = [...base.rotation, ...base.bullpen];
    const a = assembleTeam(base, bat, pit, makeRng(7));
    const b = assembleTeam(base, bat, pit, makeRng(7));
    expect(a.lineup.map((x) => x.id)).toEqual(b.lineup.map((x) => x.id));
    expect(a.rotation.map((x) => x.id)).toEqual(b.rotation.map((x) => x.id));
  });
});

describe('ageAndRetire', () => {
  it('invecchia tutti di un anno e non muta la lega in ingresso', () => {
    const league = generateLeague(21);
    const before = league[0].lineup[0].age;
    const beforeId = league[0].lineup[0].id;
    const { teams } = ageAndRetire(league, 21, 1);
    // Input invariato.
    expect(league[0].lineup[0].age).toBe(before);
    // Chi sopravvive e' invecchiato di 1 (se ancora primo in lista).
    const survivor = teams[0].lineup.find((b) => b.id === beforeId);
    if (survivor) expect(survivor.age).toBe(before + 1);
  });

  it('rimuove i ritirati dalle rose e li raccoglie', () => {
    const league = generateLeague(22);
    const { teams, retired } = ageAndRetire(league, 22, 1);
    const stillRostered = new Set(
      teams.flatMap((t) => [
        ...t.lineup, ...t.bench, ...t.reserveBatters,
        ...t.rotation, ...t.bullpen, ...t.reservePitchers,
      ].map((p) => p.id)),
    );
    for (const r of retired) expect(stillRostered.has(r.id)).toBe(false);
  });
});

describe('finalizeOffseason', () => {
  it('ricompone tutte le squadre schierabili dalle rose piatte', () => {
    const league = generateLeague(31);
    const state = startOffseason(league, 31, 1, undefined, GENERATED_MODE);
    const finals = finalizeOffseason(state, league, 31);
    expect(finals).toHaveLength(league.length);
    for (const t of finals) expectPlayable(t);
  });
});

describe('runOffseason / rolloverSeason', () => {
  it('produce una lega dell anno successivo tutta schierabile', () => {
    const league = generateLeague(41);
    const season = createSeason(1);
    const { teams, season: next, summary } = rolloverSeason({ teams: league, season, seed: 41 });
    expect(teams).toHaveLength(league.length);
    for (const t of teams) expectPlayable(t);
    expect(next.year).toBe(2);
    expect(summary.year).toBe(1);
  });

  it('e deterministico: stesso input → stessa lega', () => {
    const league = generateLeague(42);
    const season = createSeason(1);
    const a = rolloverSeason({ teams: league, season, seed: 42 });
    const b = rolloverSeason({ teams: league, season, seed: 42 });
    expect(a.teams.map((t) => t.lineup.map((x) => x.id))).toEqual(
      b.teams.map((t) => t.lineup.map((x) => x.id)),
    );
  });

  it('resta valida e giocabile per molti anni; le eta si stabilizzano ~MLB', () => {
    let teams = generateLeague(43);
    let season = createSeason(1);
    for (let y = 0; y < 12; y++) {
      const r = rolloverSeason({ teams, season, seed: 43 });
      teams = r.teams;
      season = r.season;
      for (const t of teams) expectPlayable(t);
    }
    // Eta media di lega plausibile (nessuna deriva verso 20 o 40).
    const ages = teams.flatMap((t) => [...t.lineup, ...t.rotation].map((p) => p.age));
    const avg = ages.reduce((s, a) => s + a, 0) / ages.length;
    expect(avg).toBeGreaterThan(24);
    expect(avg).toBeLessThan(33);
  });

  it('riconcilia verso il basso: nessuna squadra sfonda il MURO esterno, nemmeno negli anni', () => {
    // Il muro (base × 1.25) è il confine RIGIDO a regime. Alcune corazzate PARTONO
    // sopra; dopo il rollover devono rientrarci (attrito: cedono i cari espendibili).
    // La banda tra tetto effettivo e muro (fascia tassa) resta tollerata: è il
    // modello a due confini, non un tetto unico.
    const wall = outerWall();
    let teams = generateLeague(44);
    let season = createSeason(1);
    const someStartOverWall = teams.some((t) => teamPayroll(t) > wall);
    expect(someStartOverWall).toBe(true); // il caso interessante esiste
    for (let y = 0; y < 5; y++) {
      const r = rolloverSeason({ teams, season, seed: 44 });
      teams = r.teams;
      season = r.season;
      // Dopo ogni rollover, nessuna squadra oltre il muro rigido (con un filo di
      // margine per gli arrotondamenti degli stipendi/replacement).
      for (const t of teams) expect(teamPayroll(t)).toBeLessThanOrEqual(wall + 1);
    }
  });
});
