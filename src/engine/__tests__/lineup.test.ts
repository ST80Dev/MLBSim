import { describe, it, expect } from 'vitest';
import { autoLineup, validateFieldSet, FIELD_SLOTS } from '../lineup';
import type { Batter, BatterRatings, Position } from '../types';

function bat(id: string, r: Partial<BatterRatings>): Batter {
  const ratings: BatterRatings = {
    contact: 50, power: 50, eye: 50, speed: 50, fielding: 50, arm: 50, ...r,
  };
  return {
    id, name: id, bats: 'R', position: 'DH', ratings,
    stats: { pa: 0, h: 0, double: 0, triple: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0 },
    age: 27, potential: 50, salary: 1, retired: false,
  };
}

describe('autoLineup', () => {
  // Nove profili con una dote dominante ciascuno.
  const players: Batter[] = [
    bat('slug1', { power: 80, contact: 55 }),
    bat('slug2', { power: 72, contact: 50 }),
    bat('slug3', { power: 68, contact: 48 }),
    bat('onbase', { eye: 80, speed: 75 }),
    bat('table', { contact: 78, eye: 70 }),
    bat('allround', { contact: 74, power: 66, eye: 62 }),
    bat('filler1', { contact: 45, power: 40, eye: 42 }),
    bat('filler2', { contact: 40, power: 38, eye: 40 }),
    bat('filler3', { contact: 38, power: 36, eye: 38 }),
  ];

  it('mette in cima un profilo da OBP/velocita e in quarta un potente', () => {
    const order = autoLineup(players);
    expect(order[0].id).toBe('onbase'); // leadoff = occhio+gambe
    expect(order[3].ratings.power).toBeGreaterThanOrEqual(68); // cleanup = potenza
  });

  it('non muta l input e preserva l insieme dei giocatori', () => {
    const copy = [...players];
    const order = autoLineup(players);
    expect(players).toEqual(copy); // input intatto
    expect(order).toHaveLength(9);
    expect(new Set(order.map((b) => b.id))).toEqual(new Set(players.map((b) => b.id)));
  });

  it('e deterministico', () => {
    expect(autoLineup(players).map((b) => b.id)).toEqual(autoLineup(players).map((b) => b.id));
  });

  it('con pochi battitori ripiega sull overall decrescente', () => {
    const few = [bat('a', { contact: 40 }), bat('b', { contact: 80 })];
    const order = autoLineup(few);
    expect(order.map((b) => b.id)).toEqual(['b', 'a']);
  });
});

describe('validateFieldSet', () => {
  it('accetta una permutazione esatta delle 9 caselle', () => {
    const res = validateFieldSet([...FIELD_SLOTS]);
    expect(res.ok).toBe(true);
    expect(res.missing).toEqual([]);
    expect(res.duplicates).toEqual([]);
  });

  it('segnala buco e doppione', () => {
    // due CF, manca RF
    const positions: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'CF', 'DH'];
    const res = validateFieldSet(positions);
    expect(res.ok).toBe(false);
    expect(res.missing).toContain('RF');
    expect(res.duplicates).toContain('CF');
  });

  it('rifiuta un numero di posizioni diverso da 9', () => {
    expect(validateFieldSet(['C', '1B']).ok).toBe(false);
  });
});
