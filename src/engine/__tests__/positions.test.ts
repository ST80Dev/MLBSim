import { describe, it, expect } from 'vitest';
import type { Batter } from '../types';
import { ratingsAtPosition, fieldingAtPosition, canPlay, SECONDARY_OPTIONS } from '../positions';
import { generateMatchup } from '../../data/generator';

function fakeBatter(position: Batter['position'], secondary?: Batter['position']): Batter {
  return {
    id: 'x',
    name: 'Test Player',
    bats: 'R',
    position,
    ...(secondary ? { secondaryPosition: secondary } : {}),
    ratings: { contact: 50, power: 50, eye: 50, speed: 50, fielding: 60, arm: 50 },
    stats: { pa: 0, h: 0, double: 0, triple: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0 },
    age: 27,
    potential: 60,
    salary: 5,
    retired: false,
  };
}

describe('seconda posizione', () => {
  it('nel ruolo naturale le doti non cambiano', () => {
    const b = fakeBatter('SS', '2B');
    expect(ratingsAtPosition(b, 'SS')).toBe(b.ratings);
    expect(fieldingAtPosition(b, 'SS')).toBe(60);
  });

  it('cambia SOLO il fielding fuori dal ruolo naturale', () => {
    const b = fakeBatter('SS', '2B');
    const r = ratingsAtPosition(b, '2B');
    expect(r.contact).toBe(b.ratings.contact);
    expect(r.power).toBe(b.ratings.power);
    expect(r.arm).toBe(b.ratings.arm);
    expect(r.fielding).not.toBe(b.ratings.fielding);
  });

  it('verso un ruolo piu facile la difesa puo salire; verso uno piu duro scende', () => {
    const b = fakeBatter('SS'); // ruolo difficile
    // SS -> 1B (piu' facile): domanda molto minore, supera la penalita' -> sale.
    expect(fieldingAtPosition(b, '1B')).toBeGreaterThan(b.ratings.fielding);
    const c = fakeBatter('1B'); // ruolo facile
    // 1B -> SS (piu' duro): crolla.
    expect(fieldingAtPosition(c, 'SS')).toBeLessThan(c.ratings.fielding);
  });

  it('canPlay ammette solo principale e secondaria', () => {
    const b = fakeBatter('LF', 'CF');
    expect(canPlay(b, 'LF')).toBe(true);
    expect(canPlay(b, 'CF')).toBe(true);
    expect(canPlay(b, 'SS')).toBe(false);
  });

  it('le seconde posizioni generate sono sempre fra quelle ammesse', () => {
    for (let s = 0; s < 20; s++) {
      const { away, home } = generateMatchup(s);
      for (const t of [away, home]) {
        for (const b of [...t.lineup, ...t.bench]) {
          if (!b.secondaryPosition) continue;
          expect(SECONDARY_OPTIONS[b.position]).toContain(b.secondaryPosition);
          expect(b.secondaryPosition).not.toBe(b.position);
        }
      }
    }
  });

  it('solo una parte dei giocatori ha una seconda posizione', () => {
    let total = 0;
    let withSecondary = 0;
    for (let s = 0; s < 20; s++) {
      const { away, home } = generateMatchup(s);
      for (const t of [away, home]) {
        for (const b of [...t.lineup, ...t.bench]) {
          total += 1;
          if (b.secondaryPosition) withSecondary += 1;
        }
      }
    }
    // Non tutti, ma nemmeno nessuno.
    expect(withSecondary).toBeGreaterThan(0);
    expect(withSecondary).toBeLessThan(total);
  });
});
