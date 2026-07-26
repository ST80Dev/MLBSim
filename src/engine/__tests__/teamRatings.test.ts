import { describe, it, expect } from 'vitest';
import { offenseRating, teamSynthesis, staffSynthesis } from '../teamRatings';
import type { Batter, BatterRatings, Pitcher, PitcherRatings, Position } from '../types';

const PR = (o: Partial<PitcherRatings> = {}): PitcherRatings => ({
  stuff: 50, control: 50, movement: 50, groundball: 50, stamina: 50, fielding: 50, ...o,
});
const P = (id: string, o: Partial<PitcherRatings> = {}): Pitcher => ({
  id, name: id, throws: 'R', role: 'SP', ratings: PR(o), stats: {} as any,
  stamina: 24, age: 27, potential: 55, salary: 1, retired: false,
});

const R = (o: Partial<BatterRatings> = {}): BatterRatings => ({
  contact: 50, power: 50, eye: 50, speed: 50, fielding: 50, arm: 50, ...o,
});
const B = (id: string, position: Position, r: Partial<BatterRatings> = {}): Batter => ({
  id, name: id, bats: 'R', position, ratings: R(r), stats: {} as any,
  age: 27, potential: 55, salary: 1, retired: false,
});

const FIELD: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const lineup = (r: Partial<BatterRatings> = {}) =>
  FIELD.map((pos, i) => ({ b: B(`p${i}`, pos, r), pos }));

describe('teamRatings', () => {
  it('tutto a 50 -> sintesi ~50', () => {
    const s = teamSynthesis(lineup());
    expect(s.off).toBe(50);
    expect(s.def).toBe(50);
    expect(s.ovr).toBe(50);
  });

  it('attacco sale con contatto/potenza, non con la difesa', () => {
    const hi = teamSynthesis(lineup({ contact: 70, power: 70 }));
    const glove = teamSynthesis(lineup({ fielding: 80, arm: 80 }));
    expect(hi.off).toBeGreaterThan(60);
    expect(glove.off).toBe(50); // la difesa non muove l'attacco
    expect(glove.def).toBeGreaterThan(60);
  });

  it('la difesa pesa piu' + 'su SS/CF/C che su 1B/LF', () => {
    // Un ottimo guantone allo SS conta piu' che allo stesso al 1B.
    const base = lineup();
    const atSS = base.map((e) => (e.pos === 'SS' ? { b: B('g', 'SS', { fielding: 80, arm: 80 }), pos: 'SS' as Position } : e));
    const at1B = base.map((e) => (e.pos === '1B' ? { b: B('g', '1B', { fielding: 80, arm: 80 }), pos: '1B' as Position } : e));
    expect(teamSynthesis(atSS).def).toBeGreaterThan(teamSynthesis(at1B).def);
  });

  it('un guanto fuori ruolo abbassa la difesa (fielding effettivo)', () => {
    // Stesso giocatore: SS naturale vs SS schierato in un ruolo non suo.
    const ss = B('x', 'SS', { fielding: 70, arm: 60 });
    const natural = offenseRating(ss.ratings); // solo per usare l'import
    expect(natural).toBeGreaterThan(0);
    const inRole = teamSynthesis([{ b: ss, pos: 'SS' }]).def;
    const outRole = teamSynthesis([{ b: ss, pos: 'CF' }]).def; // fuori ruolo -> malus
    expect(outRole).toBeLessThan(inRole);
  });

  it('staff: la rotazione pesa piu del bullpen; tutto a 50 -> 50', () => {
    expect(staffSynthesis([P('a')], [P('b')])).toBe(50);
    const strongRot = staffSynthesis([P('a', { stuff: 75, control: 72, movement: 74 })], [P('b')]);
    const strongPen = staffSynthesis([P('a')], [P('b', { stuff: 75, control: 72, movement: 74 })]);
    expect(strongRot).toBeGreaterThan(strongPen); // stesso talento, pesa di piu' in rotazione
  });
});
