import { describe, it, expect } from 'vitest';
import type { PlayEvent, PlayKind, BallType } from '../../engine/game';
import { buildCommentary, logLine, subtypeOf } from '../commentary';

const CTX = {
  offense: { abbrev: 'OFF', name: 'Offense', color: '#111' },
  defense: { abbrev: 'DEF', name: 'Defense', color: '#222' },
};

function ev(kind: PlayKind, i: number, extra: Partial<PlayEvent> = {}): PlayEvent {
  return {
    inning: (i % 9) + 1,
    half: i % 2 ? 'top' : 'bottom',
    text: `grezzo ${kind} ${i}`,
    away: 0,
    home: 0,
    runsScored: 0,
    kind,
    batter: `Bat${i}`,
    ...extra,
  };
}
const out = (i: number, ball: BallType, extra: Partial<PlayEvent['outInfo']> = {}): PlayEvent =>
  ev('inplayout', i, { outInfo: { ball, advanced: false, ...extra } });

// Pesi target = frequenze reali MLB approssimate per gli esiti SENZA verita' dal
// motore (valide/strikeout). Gli OUT no: la loro forma e' verita' del motore.
const TARGET: Record<string, Record<string, number>> = {
  single: { grounder: 46, liner: 34, blooper: 13, infield: 7 },
  double: { gap: 42, line: 26, wall: 18, corner: 14 },
  strikeout: { swinging: 72, looking: 28 },
};

describe('cronaca — varieta’ deterministica e pesata sulle frequenze MLB', () => {
  it('e’ deterministica (stesso evento -> stesso testo)', () => {
    for (const kind of ['single', 'double', 'strikeout'] as PlayKind[]) {
      expect(logLine(ev(kind, 7))).toBe(logLine(ev(kind, 7)));
      expect(buildCommentary(ev(kind, 7), CTX).phases).toEqual(buildCommentary(ev(kind, 7), CTX).phases);
    }
    expect(logLine(out(7, 'fly'))).toBe(logLine(out(7, 'fly')));
  });

  it('nessun placeholder {b} resta nel testo finale', () => {
    for (let i = 0; i < 300; i++) {
      for (const kind of ['single', 'double', 'triple', 'homerun', 'strikeout'] as PlayKind[]) {
        expect(logLine(ev(kind, i))).not.toContain('{b}');
        for (const p of buildCommentary(ev(kind, i), CTX).phases) expect(p.text).not.toContain('{b}');
      }
      for (const ball of ['ground', 'fly', 'popup'] as BallType[]) {
        expect(logLine(out(i, ball))).not.toContain('{b}');
        for (const p of buildCommentary(out(i, ball), CTX).phases) expect(p.text).not.toContain('{b}');
      }
    }
  });

  it('almeno 4-5 modi diversi per singolo / doppio / strikeout / eliminazione', () => {
    const distinctHit = (kind: PlayKind) => {
      const s = new Set<string>();
      for (let i = 0; i < 800; i++) s.add(logLine(ev(kind, i)));
      return s.size;
    };
    expect(distinctHit('single')).toBeGreaterThanOrEqual(5);
    expect(distinctHit('double')).toBeGreaterThanOrEqual(5);
    expect(distinctHit('strikeout')).toBeGreaterThanOrEqual(4);
    // Eliminazione: varieta' sulle 3 forme reali (rimbalzo/volata/presa) x frasi.
    const outs = new Set<string>();
    for (let i = 0; i < 800; i++)
      for (const ball of ['ground', 'fly', 'popup'] as BallType[]) outs.add(logLine(out(i, ball)));
    expect(outs.size).toBeGreaterThanOrEqual(5);
  });

  it('la distribuzione dei sottotipi (valide/K) converge ai pesi MLB', () => {
    const N = 60000;
    for (const kind of Object.keys(TARGET) as PlayKind[]) {
      const counts: Record<string, number> = {};
      for (let i = 0; i < N; i++) {
        const st = subtypeOf(ev(kind, i))!;
        counts[st] = (counts[st] ?? 0) + 1;
      }
      const emp = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, (v / N) * 100]));
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

  it('gli OUT seguono la VERITA’ del motore (outInfo), non un peso inventato', () => {
    // ground/fly/popup -> forma corrispondente nel testo; coerente col motore.
    expect(subtypeOf(out(1, 'ground'))).toBe('ground');
    expect(subtypeOf(out(1, 'fly'))).toBe('fly');
    expect(subtypeOf(out(1, 'popup'))).toBe('air');
    expect(subtypeOf(out(1, 'ground', { fc: true }))).toBe('fc');
    // Il popup non e' mai raccontato come volata profonda in esterno, e viceversa.
    for (let i = 0; i < 100; i++) {
      expect(logLine(out(i, 'popup')).toLowerCase()).toMatch(/pop|campanile|interno/);
      expect(logLine(out(i, 'fly')).toLowerCase()).toMatch(/volata|esterno|elevata|flyout/);
    }
    // Scelta difensiva.
    expect(logLine(out(1, 'ground', { fc: true }))).toContain('scelta difensiva');
    // Out con punto: la resa include l'avanzamento/punto.
    expect(logLine(out(1, 'fly', { advanced: true, ball: 'fly' }))).toContain('avanzano');
  });
});
