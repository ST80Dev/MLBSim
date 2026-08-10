import { describe, it, expect } from 'vitest';
import type { Batter, BatterRatings } from '../types';
import type { TeamGameStats } from '../game';
import { newBattingLine } from '../boxscore';
import { makeRng } from '../rng';
import { RATING_AVG } from '../ratings';
import { synthesizeStolenBases } from '../leagueSteals';

const ratings = (speed: number): BatterRatings => ({
  contact: 70, power: 70, eye: 70, speed, fielding: 70, arm: 70,
});

const batter = (id: string, speed: number): Batter => ({
  id, name: id, bats: 'R', position: 'CF', ratings: ratings(speed),
  stats: { pa: 0, h: 0, double: 0, triple: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0 },
  age: 27, potential: 70, salary: 1, retired: false,
});

/** Box score di UNA squadra con una riga per giocatore: singoli+BB = occasioni. */
function statsFor(rows: { id: string; singles: number; bb: number }[]): TeamGameStats {
  const batting = rows.map((r) => {
    const bl = newBattingLine(batter(r.id, 70));
    bl.h = r.singles; // singoli (nessun 2B/3B/HR): tutte volte in 1ª
    bl.bb = r.bb;
    bl.ab = r.singles;
    return bl;
  });
  return { runs: 0, hits: 0, errors: 0, lineByInning: [], batting, pitching: [] };
}

describe('rubate sintetizzate (sim di lega)', () => {
  it('è deterministica: stesso seed → stesso esito', () => {
    const roster = [batter('fast', 96), batter('avg', 70)];
    const run = () => {
      const s = statsFor([{ id: 'fast', singles: 3, bb: 1 }, { id: 'avg', singles: 3, bb: 1 }]);
      synthesizeStolenBases(roster, s, makeRng(12345));
      return s.batting.map((b) => [b.id, b.sb, b.cs]);
    };
    expect(run()).toEqual(run());
  });

  it('i giocatori lenti (Velocità ≤ media) non rubano mai', () => {
    const roster = [batter('slow', RATING_AVG), batter('veryslow', RATING_AVG - 15)];
    let sb = 0, cs = 0;
    // Tante partite con molte occasioni: deve restare 0.
    for (let g = 0; g < 500; g++) {
      const s = statsFor([{ id: 'slow', singles: 4, bb: 2 }, { id: 'veryslow', singles: 4, bb: 2 }]);
      synthesizeStolenBases(roster, s, makeRng(g * 7 + 1));
      sb += s.batting.reduce((a, b) => a + b.sb, 0);
      cs += s.batting.reduce((a, b) => a + b.cs, 0);
    }
    expect(sb).toBe(0);
    expect(cs).toBe(0);
  });

  it('i velocisti accumulano SB su 162 gare, con buona percentuale', () => {
    const roster = [batter('burner', 98)];
    let sb = 0, cs = 0;
    for (let g = 0; g < 162; g++) {
      const s = statsFor([{ id: 'burner', singles: 1, bb: 1 }]); // ~2 volte in 1ª/gara
      synthesizeStolenBases(roster, s, makeRng(g * 31 + 5));
      sb += s.batting[0].sb;
      cs += s.batting[0].cs;
    }
    expect(sb).toBeGreaterThan(20); // un vero base-stealer ruba parecchio
    expect(sb).toBeLessThan(75); // ma non oltre l'epoca '90/2000
    expect(sb / (sb + cs)).toBeGreaterThan(0.7); // percentuale di riuscita alta
  });

  it('muta SOLO sb/cs, lascia intatte le altre voci', () => {
    const roster = [batter('fast', 95)];
    const s = statsFor([{ id: 'fast', singles: 5, bb: 2 }]);
    const before = { ...s.batting[0] };
    synthesizeStolenBases(roster, s, makeRng(99));
    const after = s.batting[0];
    expect(after.h).toBe(before.h);
    expect(after.bb).toBe(before.bb);
    expect(after.ab).toBe(before.ab);
    expect(after.hr).toBe(before.hr);
  });

  it('ignora i giocatori senza voce in rosa (id sconosciuto)', () => {
    const s = statsFor([{ id: 'ghost', singles: 5, bb: 2 }]);
    expect(() => synthesizeStolenBases([], s, makeRng(1))).not.toThrow();
    expect(s.batting[0].sb).toBe(0);
    expect(s.batting[0].cs).toBe(0);
  });
});
