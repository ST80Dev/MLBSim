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
  realignDefense,
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

  it('realign: nessuno spostamento se il subentrante copre già il ruolo lasciato', () => {
    // Il 1B esce, entra un 1B naturale: nessun altro deve muoversi.
    const lineup = FIELD_POSITIONS.concat('DH').map((p, i) => fakeBatter(p as Position, undefined, `p${i}`));
    const slots = lineup.map((b) => b.position);
    lineup[1] = fakeBatter('1B', undefined, 'sub'); // rimpiazza il 1B con un 1B
    const moves = realignDefense(lineup, slots);
    expect(moves.length).toBe(0);
    expect(lineup[1].position).toBe('1B');
  });

  it('realign: il subentrante va al SUO ruolo e i compagni si spostano per coprire', () => {
    // Parte tutta naturale; l'RF esce, entra un esterno naturale LF (2ª: RF).
    // L'RF resta scoperto: uno dei due LF-capaci lo copre, l'altro fa LF.
    const lineup = FIELD_POSITIONS.concat('DH').map((p, i) => fakeBatter(p as Position, undefined, `p${i}`));
    const slots = lineup.map((b) => b.position);
    const sub = fakeBatter('LF', 'RF', 'sub'); // esterno che sa fare anche RF
    lineup[7] = sub; // rimpiazza l'RF (indice 7)
    const moves = realignDefense(lineup, slots);

    // Schieramento ancora valido: ogni casella di campo coperta una volta.
    for (const pos of FIELD_POSITIONS) {
      expect(lineup.filter((b) => b.position === pos).length).toBe(1);
    }
    // Il subentrante gioca un ruolo che PUÒ coprire (LF o RF), non è rimasto a caso.
    expect(canPlay(sub, sub.position)).toBe(true);
    // I due esterni LF-capaci coprono insieme {LF, RF}.
    const lfCapable = lineup.filter((b) => b.id === 'sub' || b.id === 'p5'); // p5 = LF originale
    expect(new Set(lfCapable.map((b) => b.position))).toEqual(new Set(['LF', 'RF']));
    // Almeno uno spostamento è avvenuto (l'RF originale non esiste più).
    expect(moves.length).toBeGreaterThan(0);
  });

  it('realign: non lascia mai un giocatore fuori ruolo se una copertura valida esiste', () => {
    // SS esce, entra un 2B (2ª: SS). Il subentrante può fare SS; verifichiamo che
    // tutti restino in un ruolo coprbile e lo schieramento sia valido.
    const lineup = FIELD_POSITIONS.concat('DH').map((p, i) => fakeBatter(p as Position, undefined, `p${i}`));
    // Diamo al 2B originale la 2ª SS così la copertura incrociata è possibile.
    lineup[2] = fakeBatter('2B', 'SS', 'p2');
    const slots = lineup.map((b) => b.position);
    lineup[4] = fakeBatter('2B', 'SS', 'sub'); // rimpiazza l'SS con un 2B/SS
    realignDefense(lineup, slots);
    for (const pos of FIELD_POSITIONS) {
      expect(lineup.filter((b) => b.position === pos).length).toBe(1);
    }
    for (const b of lineup) {
      if (b.position === 'DH') continue;
      expect(canPlay(b, b.position), `${b.id} @ ${b.position}`).toBe(true);
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
