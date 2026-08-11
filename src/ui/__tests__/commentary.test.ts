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

  // --- Fase di SVILUPPO (preliminare) condivisa per traiettoria ---------------
  // Il verdetto e' l'ULTIMA fase; la preliminare e' la penultima (indice 1 nelle
  // sequenze a 3 fasi). Non deve tradire l'esito, e la stessa preliminare deve
  // poter precedere esiti diversi.
  const dev = (e: PlayEvent): string | null => {
    const ph = buildCommentary(e, CTX).phases;
    return ph.length >= 3 ? ph[ph.length - 2].text : null;
  };
  const devSet = (make: (i: number) => PlayEvent): Set<string> => {
    const s = new Set<string>();
    for (let i = 0; i < 1500; i++) {
      const d = dev(make(i));
      if (d) s.add(d);
    }
    return s;
  };
  const shareSome = (a: Set<string>, b: Set<string>): boolean => {
    for (const x of a) if (b.has(x)) return true;
    return false;
  };

  it('la preliminare NON nomina l’esito (niente spoiler prima del verdetto)', () => {
    const forbidden: Record<string, RegExp> = {
      single: /singolo/i,
      double: /doppio/i,
      triple: /triplo/i,
      homerun: /fuoricampo|bomba|no-doubter/i,
      strikeout: /strike|eliminat|a vuoto/i,
    };
    for (let i = 0; i < 800; i++) {
      for (const kind of Object.keys(forbidden) as PlayKind[]) {
        const d = dev(ev(kind, i));
        expect(d).not.toBeNull();
        expect(d!).not.toMatch(forbidden[kind]);
      }
      // Anche gli OUT: la presa/il rimbalzo non e' anticipato dalla preliminare.
      for (const ball of ['ground', 'fly', 'popup'] as BallType[]) {
        expect(dev(out(i, ball))!).not.toMatch(/eliminat|out |presa|catturat/i);
      }
    }
  });

  it('la stessa preliminare precede esiti DIVERSI (traiettorie condivise)', () => {
    const singleDev = devSet((i) => ev('single', i));
    const doubleDev = devSet((i) => ev('double', i));
    const hrDev = devSet((i) => ev('homerun', i));
    const groundOutDev = devSet((i) => out(i, 'ground'));
    const flyOutDev = devSet((i) => out(i, 'fly'));
    // Rullata: singolo e out a terra (e doppio d'angolo) condividono la stessa apertura.
    expect(shareSome(singleDev, groundOutDev)).toBe(true);
    expect(shareSome(singleDev, doubleDev)).toBe(true);
    // Volata: fuoricampo "di un soffio" e volata catturata iniziano uguali.
    expect(shareSome(hrDev, flyOutDev)).toBe(true);
    // Bordata piena: doppio (sul muro) e fuoricampo condividono la preliminare.
    expect(shareSome(hrDev, doubleDev)).toBe(true);
    // Strikeout e base ball nascono dallo stesso "duello sul piatto".
    const kDev = devSet((i) => ev('strikeout', i));
    const bbDev = devSet((i) => ev('walk', i));
    expect(shareSome(kDev, bbDev)).toBe(true);
  });

  it('la preliminare "conto + lancio" resta coerente con l’esito', () => {
    // Quando la preliminare mostra un conto ball-strike, dev'essere PLAUSIBILE:
    // uno strikeout ha già 2 strike (X-2 o "pieno"=3-2), una base ball 3 ball.
    for (let i = 0; i < 3000; i++) {
      const kd = dev(ev('strikeout', i))!;
      const km = kd.match(/(\d)-(\d)/);
      if (km) expect(km[2]).toBe('2'); // 2 strike già nel conto
      const wd = dev(ev('walk', i))!;
      const wm = wd.match(/(\d)-(\d)/);
      if (wm) expect(wm[1]).toBe('3'); // 3 ball già nel conto
    }
  });

  it('la preliminare ha molta varieta’ per lo stesso esito (>= 5 aperture)', () => {
    for (const kind of ['single', 'double', 'homerun', 'strikeout'] as PlayKind[]) {
      expect(devSet((i) => ev(kind, i)).size).toBeGreaterThanOrEqual(5);
    }
  });

  it('l’apertura è varia e mescola battitore + commento sulla situazione', () => {
    const opener = (e: PlayEvent): string => buildCommentary(e, CTX).phases[0].text;
    const openSet = (make: (i: number) => PlayEvent): Set<string> => {
      const s = new Set<string>();
      for (let i = 0; i < 1500; i++) s.add(opener(make(i)));
      return s;
    };
    const sSingle = openSet((i) => ev('single', i));
    const sK = openSet((i) => ev('strikeout', i));
    // Tante aperture diverse e alcune condivise tra esiti diversi (scorrelate).
    expect(sSingle.size).toBeGreaterThanOrEqual(8);
    expect(shareSome(sSingle, sK)).toBe(true);
    // Compare almeno un commento sulla situazione del match, non solo "al piatto".
    const situational = /partita|inning|finale|equilibrio|match|atto|momento|scambi|tempo|svolgimento/i;
    expect([...sSingle].some((t) => situational.test(t))).toBe(true);
  });

  it('la situazione è coerente col punteggio (niente "equilibrio" su un blowout)', () => {
    const CLOSE = /equilibr|punto a punto|parità|incollatura|tutto da scrivere|primi scambi|nessuno avanti/i;
    const BLOW = /domina|difficolt|dilaga|margine|controllo|distanze|vittoria larga|scossa/i;
    const opener = (e: PlayEvent): string => buildCommentary(e, CTX).phases[0].text;
    const blow = new Set<string>();
    for (let i = 0; i < 1500; i++) {
      const o = opener(ev('single', i, { away: 8, home: 2 })); // margine 6, blowout
      blow.add(o);
      expect(o).not.toMatch(CLOSE); // mai "equilibrio/punto a punto" su 2-8
    }
    // Almeno un'apertura "da blowout" deve comparire (la situazione reagisce al punteggio).
    expect([...blow].some((t) => BLOW.test(t))).toBe(true);
    // In parità, invece, le frasi d'equilibrio possono comparire.
    const tie = new Set<string>();
    for (let i = 0; i < 1500; i++) tie.add(opener(ev('single', i, { away: 3, home: 3 })));
    expect([...tie].some((t) => CLOSE.test(t))).toBe(true);
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
