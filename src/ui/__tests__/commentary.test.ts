import { describe, it, expect } from 'vitest';
import type { PlayEvent, PlayKind } from '../../engine/game';
import { buildCommentary, logLine, subtypeOf } from '../commentary';

const CTX = {
  offense: { abbrev: 'OFF', name: 'Offense', color: '#111' },
  defense: { abbrev: 'DEF', name: 'Defense', color: '#222' },
};

function ev(kind: PlayKind, i: number, runs = 0): PlayEvent {
  return {
    inning: (i % 9) + 1,
    half: i % 2 ? 'top' : 'bottom',
    text: `grezzo ${kind} ${i}`,
    away: 0,
    home: 0,
    runsScored: runs,
    kind,
    batter: `Bat${i}`,
  };
}

// Pesi target = frequenze reali MLB approssimate (vedi commentary.ts).
const TARGET: Record<string, Record<string, number>> = {
  inplayout: { groundout: 47, flyout: 33, popout: 12, lineout: 8 },
  single: { grounder: 46, liner: 34, blooper: 13, infield: 7 },
  double: { gap: 42, line: 26, wall: 18, corner: 14 },
  strikeout: { swinging: 72, looking: 28 },
};

describe('cronaca — varieta’ deterministica e pesata sulle frequenze MLB', () => {
  it('e’ deterministica (stesso evento -> stesso testo)', () => {
    for (const kind of ['single', 'double', 'strikeout', 'inplayout'] as PlayKind[]) {
      const a = ev(kind, 7);
      const b = ev(kind, 7);
      expect(logLine(a)).toBe(logLine(b));
      expect(buildCommentary(a, CTX).phases).toEqual(buildCommentary(b, CTX).phases);
    }
  });

  it('nessun placeholder {b} resta nel testo finale', () => {
    for (let i = 0; i < 300; i++) {
      for (const kind of ['single', 'double', 'triple', 'homerun', 'strikeout', 'inplayout'] as PlayKind[]) {
        expect(logLine(ev(kind, i))).not.toContain('{b}');
        for (const p of buildCommentary(ev(kind, i), CTX).phases) expect(p.text).not.toContain('{b}');
      }
    }
  });

  it('almeno 4-5 modi diversi per singolo / doppio / strikeout / eliminazione', () => {
    const distinct = (kind: PlayKind) => {
      const s = new Set<string>();
      for (let i = 0; i < 800; i++) s.add(logLine(ev(kind, i)));
      return s.size;
    };
    expect(distinct('single')).toBeGreaterThanOrEqual(5);
    expect(distinct('double')).toBeGreaterThanOrEqual(5);
    expect(distinct('strikeout')).toBeGreaterThanOrEqual(4);
    expect(distinct('inplayout')).toBeGreaterThanOrEqual(5);
  });

  it('la distribuzione dei sottotipi converge ai pesi MLB', () => {
    const N = 60000;
    for (const kind of Object.keys(TARGET) as PlayKind[]) {
      const counts: Record<string, number> = {};
      for (let i = 0; i < N; i++) {
        const st = subtypeOf(ev(kind, i))!;
        counts[st] = (counts[st] ?? 0) + 1;
      }
      const emp = Object.fromEntries(
        Object.entries(counts).map(([k, v]) => [k, (v / N) * 100]),
      );
      // eslint-disable-next-line no-console
      console.log(
        `${kind}: ` +
          Object.keys(TARGET[kind])
            .map((st) => `${st} ${emp[st]?.toFixed(1)}% (target ${TARGET[kind][st]}%)`)
            .join(', '),
      );
      for (const st of Object.keys(TARGET[kind])) {
        expect(Math.abs((emp[st] ?? 0) - TARGET[kind][st])).toBeLessThan(4);
      }
    }
  });

  it('un out con punto (dalla terza) e’ sempre un groundout coerente', () => {
    for (let i = 0; i < 50; i++) {
      expect(subtypeOf(ev('inplayout', i, 1))).toBe('groundout');
      expect(logLine(ev('inplayout', i, 1))).toContain('punto');
    }
  });
});
