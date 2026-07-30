import { describe, it, expect } from 'vitest';
import {
  generateDraftClass,
  inverseDraftOrder,
  runInverseDraft,
  DEFAULT_DRAFT_ROUNDS,
} from '../draft';
import { generateLeague } from '../league';
import { playerValue } from '../../engine/value';
import { batterOverall, pitcherOverall } from '../../engine/ratings';
import type { WLRecord } from '../season';

const SEED = 20260728;

describe('generateDraftClass', () => {
  it('e deterministica dal seed', () => {
    expect(JSON.stringify(generateDraftClass(SEED, 40))).toBe(JSON.stringify(generateDraftClass(SEED, 40)));
    expect(JSON.stringify(generateDraftClass(SEED + 1, 40))).not.toBe(JSON.stringify(generateDraftClass(SEED, 40)));
  });

  it('i prospetti sono GIOVANI (18-22) e con headroom (potential ≥ overall)', () => {
    const c = generateDraftClass(SEED, 80);
    for (const b of c.batters) {
      expect(b.age).toBeGreaterThanOrEqual(18);
      expect(b.age).toBeLessThanOrEqual(22);
      expect(b.potential).toBeGreaterThanOrEqual(batterOverall(b.ratings, b.position));
    }
    for (const p of c.pitchers) {
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(p.age).toBeLessThanOrEqual(22);
      expect(p.potential).toBeGreaterThanOrEqual(pitcherOverall(p.ratings));
    }
    // Mix di entrambi i tipi (nessuna classe monotipo).
    expect(c.batters.length).toBeGreaterThan(0);
    expect(c.pitchers.length).toBeGreaterThan(0);
  });
});

describe('inverseDraftOrder', () => {
  it('mette la squadra col record PEGGIORE per prima', () => {
    const teams = generateLeague(SEED);
    const standings: Record<string, WLRecord> = {};
    // Assegna record decrescenti: teams[0] il migliore, l'ultimo il peggiore.
    teams.forEach((t, i) => (standings[t.id] = { w: 100 - i, l: 62 + i }));
    const order = inverseDraftOrder(teams, standings);
    expect(order[0].id).toBe(teams[teams.length - 1].id); // il peggiore sceglie 1°
    expect(order[order.length - 1].id).toBe(teams[0].id); // il migliore per ultimo
  });

  it('senza record (0-0) l’ordine e stabile per id', () => {
    const teams = generateLeague(SEED);
    const order = inverseDraftOrder(teams, {});
    const ids = teams.map((t) => t.id).sort((a, b) => a.localeCompare(b));
    expect(order.map((t) => t.id)).toEqual(ids);
  });
});

describe('runInverseDraft', () => {
  const teams = generateLeague(SEED);
  const standings: Record<string, WLRecord> = {};
  teams.forEach((t, i) => (standings[t.id] = { w: 100 - i, l: 62 + i }));
  const worst = teams[teams.length - 1].id;

  it('la squadra peggiore prende il MIGLIOR prospetto disponibile (BPA)', () => {
    const rounds = DEFAULT_DRAFT_ROUNDS;
    const cls = generateDraftClass(SEED, teams.length * rounds + teams.length);
    const bestId = [...cls.batters, ...cls.pitchers]
      .sort((a, b) => playerValue(b) - playerValue(a) || a.id.localeCompare(b.id))[0].id;
    const { picks } = runInverseDraft(teams, standings, SEED, rounds);
    expect(picks[0]).toMatchObject({ round: 0, teamId: worst, playerId: bestId });
  });

  it('ogni squadra prende `rounds` prospetti, TUTTI nella depth (attivi intatti)', () => {
    const rounds = 2;
    const { teams: after, picks } = runInverseDraft(teams, standings, SEED, rounds);
    expect(picks).toHaveLength(teams.length * rounds);
    for (let i = 0; i < teams.length; i++) {
      const before = teams[i];
      const now = after[i];
      // Attivi invariati.
      expect(now.lineup).toBe(before.lineup);
      expect(now.rotation).toBe(before.rotation);
      expect(now.bullpen).toBe(before.bullpen);
      expect(now.bench).toBe(before.bench);
      // Depth cresciuta di esattamente `rounds` (bat + pit combinati).
      const addedBat = now.reserveBatters.length - before.reserveBatters.length;
      const addedPit = now.reservePitchers.length - before.reservePitchers.length;
      expect(addedBat + addedPit).toBe(rounds);
    }
  });

  it('e deterministico e non muta l’input', () => {
    const snapshot = JSON.stringify(teams);
    const a = runInverseDraft(teams, standings, SEED, 2);
    const b = runInverseDraft(teams, standings, SEED, 2);
    expect(JSON.stringify(a.picks)).toBe(JSON.stringify(b.picks));
    expect(JSON.stringify(teams)).toBe(snapshot); // input non mutato
  });
});
