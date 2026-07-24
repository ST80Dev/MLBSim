import { describe, it, expect } from 'vitest';
import { teamStrength } from '../strength';
import { RATING_MIN, RATING_MAX } from '../ratings';
import { generateMatchup } from '../../data/generator';

describe('forza squadra', () => {
  it('produce quattro voci sulla scala 20-80', () => {
    const { away } = generateMatchup(11);
    const s = teamStrength(away);
    for (const v of [s.total, s.attack, s.defense, s.pitching]) {
      expect(v).toBeGreaterThanOrEqual(RATING_MIN);
      expect(v).toBeLessThanOrEqual(RATING_MAX);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('e deterministica per uno stesso seed', () => {
    const a = teamStrength(generateMatchup(7).home);
    const b = teamStrength(generateMatchup(7).home);
    expect(a).toEqual(b);
  });

  it('distingue squadre di forza diversa', () => {
    // Su molti seed la forza totale deve variare (non e' una costante).
    const totals = new Set<number>();
    for (let s = 0; s < 40; s++) {
      const { away, home } = generateMatchup(s);
      totals.add(teamStrength(away).total);
      totals.add(teamStrength(home).total);
    }
    expect(totals.size).toBeGreaterThan(3);
  });
});

describe('diversita dei nomi', () => {
  it('niente cognomi troppo ripetuti in una stessa rosa', () => {
    for (let s = 0; s < 20; s++) {
      const { away, home } = generateMatchup(s);
      for (const t of [away, home]) {
        const all = [...t.lineup, ...t.bench, ...t.rotation, ...t.bullpen];
        const counts = new Map<string, number>();
        for (const p of all) {
          const last = p.name.slice(p.name.indexOf(' ') + 1);
          counts.set(last, (counts.get(last) ?? 0) + 1);
        }
        // Con i pool ampliati e il dedup, nessun cognome deve comparire 3+ volte.
        const max = Math.max(...counts.values());
        expect(max).toBeLessThan(3);
      }
    }
  });
});
