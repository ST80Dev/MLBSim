import { describe, it, expect } from 'vitest';
import type { Batter, Position, Team } from '../types';
import {
  ratingsAtPosition,
  fieldingAtPosition,
  canPlay,
  SECONDARY_OPTIONS,
  activePos,
  computeSwap,
  applyAlignment,
} from '../positions';
import { generateMatchup } from '../../data/generator';

function fakeBatter(
  position: Batter['position'],
  secondary?: Batter['position'],
  id = 'x',
): Batter {
  return {
    id,
    name: `Player ${id}`,
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

const FIELD_POSITIONS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

/** Team fittizio: un battitore per ogni ruolo di campo + DH. */
function fakeTeam(lineup: Batter[]): Team {
  return {
    id: 'T',
    name: 'Test',
    abbrev: 'TST',
    primaryColor: '#000',
    secondaryColor: '#fff',
    ballpark: 'Test Park',
    league: 'AL',
    division: 'E',
    lineup,
    bench: [],
    rotation: [],
    bullpen: [],
    usesDH: true,
    reserveBatters: [],
    reservePitchers: [],
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

  it('scambio valido: i due giocatori si scambiano il ruolo', () => {
    // SS (2ª: 2B)  e  2B (2ª: SS)  -> scambio lecito e reversibile.
    const ss = fakeBatter('SS', '2B', 'ss');
    const sb = fakeBatter('2B', 'SS', 'sb');
    const team = fakeTeam([
      fakeBatter('C', undefined, 'c'),
      fakeBatter('1B', undefined, '1b'),
      sb,
      fakeBatter('3B', undefined, '3b'),
      ss,
      fakeBatter('LF', undefined, 'lf'),
      fakeBatter('CF', undefined, 'cf'),
      fakeBatter('RF', undefined, 'rf'),
      fakeBatter('DH', undefined, 'dh'),
    ]);
    const next = computeSwap(team, {}, 'ss', '2B');
    expect(next).not.toBeNull();
    expect(activePos(ss, next!)).toBe('2B');
    expect(activePos(sb, next!)).toBe('SS');

    // Il campo resta una permutazione valida: un giocatore per ruolo, nessun buco.
    const aligned = applyAlignment(team, next!);
    for (const pos of FIELD_POSITIONS) {
      const here = aligned.lineup.filter((p) => p.position === pos);
      expect(here.length).toBe(1);
    }
  });

  it('scambio non valido se il compagno non puo coprire il ruolo lasciato', () => {
    // SS vuole andare in 2B, ma il 2B ha come 2ª il 3B (non puo' fare SS).
    const ss = fakeBatter('SS', '2B', 'ss');
    const sb = fakeBatter('2B', '3B', 'sb');
    const team = fakeTeam([
      fakeBatter('C', undefined, 'c'),
      fakeBatter('1B', undefined, '1b'),
      sb,
      fakeBatter('3B', undefined, '3b'),
      ss,
      fakeBatter('LF', undefined, 'lf'),
      fakeBatter('CF', undefined, 'cf'),
      fakeBatter('RF', undefined, 'rf'),
      fakeBatter('DH', undefined, 'dh'),
    ]);
    expect(computeSwap(team, {}, 'ss', '2B')).toBeNull();
  });

  it('il DH puo scendere in campo scambiando col titolare (chiunque puo fare DH)', () => {
    const dh = fakeBatter('DH', '1B', 'dh');
    const fb = fakeBatter('1B', undefined, '1b');
    const team = fakeTeam([
      fakeBatter('C', undefined, 'c'),
      fb,
      fakeBatter('2B', undefined, '2b'),
      fakeBatter('3B', undefined, '3b'),
      fakeBatter('SS', undefined, 'ss'),
      fakeBatter('LF', undefined, 'lf'),
      fakeBatter('CF', undefined, 'cf'),
      fakeBatter('RF', undefined, 'rf'),
      dh,
    ]);
    const next = computeSwap(team, {}, 'dh', '1B');
    expect(next).not.toBeNull();
    expect(activePos(dh, next!)).toBe('1B');
    expect(activePos(fb, next!)).toBe('DH');
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
