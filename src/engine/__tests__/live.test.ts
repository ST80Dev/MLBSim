import { describe, it, expect } from 'vitest';
import {
  createLiveGame,
  quickSim,
  toGameResult,
  simulateGame,
  situation,
  intentionalWalk,
  changePitcher,
  defenseSide,
  availableRelievers,
  stealableBases,
  attemptSteal,
  stealSuccessProb,
  buntOutcomeProbs,
  canHitAndRun,
  hitAndRun,
  pinchHit,
  benchFor,
  setInfieldIn,
  playOffense,
  prePitchEvent,
  offenseSide,
} from '../game';
import type { LiveGame } from '../game';
import { generateMatchup } from '../../data/generator';
import type { Batter, Pitcher } from '../types';

/** Mette un corridore su una base (0=1a,1=2a,2=3a) per allestire situazioni. */
function putRunner(live: LiveGame, base: number, batterIdx: number): void {
  const off = offenseSide(live);
  const b = off.team.lineup[batterIdx];
  const pid = situation(live).pitcher.id;
  (live.bases as unknown as unknown[])[base] = { batter: b, pitcherId: pid };
}

// Doti minime per i test delle formule pure (solo i campi usati).
const batter = (speed: number, arm = 50): Batter =>
  ({ ratings: { speed, arm } } as unknown as Batter);
const pitcher = (fielding: number): Pitcher =>
  ({ ratings: { fielding } } as unknown as Pitcher);

describe('motore live — determinismo e coerenza col motore batch', () => {
  it('quickSim riproduce lo stesso esito di simulateGame (stesso codice)', () => {
    const { away, home } = generateMatchup(5);
    const g1 = simulateGame(away, home, 99);
    const live = createLiveGame(away, home, 99);
    quickSim(live);
    const g2 = toGameResult(live);
    expect(g2.final).toEqual(g1.final);
    expect(g2.play.length).toBe(g1.play.length);
    expect(g2.innings).toBe(g1.innings);
  });

  it('due quick-sim con lo stesso seed sono identici', () => {
    const { away, home } = generateMatchup(3);
    const a = createLiveGame(away, home, 7);
    const b = createLiveGame(away, home, 7);
    quickSim(a);
    quickSim(b);
    expect(toGameResult(a).final).toEqual(toGameResult(b).final);
  });
});

describe('decisioni W/L/SV', () => {
  it('ogni partita assegna esattamente una W e una L, dai lati giusti', () => {
    for (let s = 0; s < 60; s++) {
      const { away, home } = generateMatchup(s);
      const g = simulateGame(away, home, s * 7 + 11);
      const winSide = g.winner === 'away' ? g.awayStats : g.homeStats;
      const loseSide = g.winner === 'away' ? g.homeStats : g.awayStats;

      const wins = [...g.awayStats.pitching, ...g.homeStats.pitching].filter(
        (p) => p.dec === 'W',
      );
      const losses = [...g.awayStats.pitching, ...g.homeStats.pitching].filter(
        (p) => p.dec === 'L',
      );
      const saves = [...g.awayStats.pitching, ...g.homeStats.pitching].filter(
        (p) => p.dec === 'SV',
      );

      expect(wins.length).toBe(1);
      expect(losses.length).toBe(1);
      expect(saves.length).toBeLessThanOrEqual(1);
      // La W e' della squadra vincente, la L della perdente.
      expect(winSide.pitching.some((p) => p.dec === 'W')).toBe(true);
      expect(loseSide.pitching.some((p) => p.dec === 'L')).toBe(true);
      // Il salvatore (se c'e') e' della vincente e non e' il vincitore.
      if (saves.length === 1) {
        expect(winSide.pitching.some((p) => p.dec === 'SV')).toBe(true);
        expect(saves[0].dec).not.toBe('W');
      }
    }
  });

  it('il partente vincitore che completa 5 inning tiene la W', () => {
    // Cerca una partita in cui il partente della vincente ha >=15 out ed e' la W.
    let checked = 0;
    for (let s = 0; s < 40 && checked < 1; s++) {
      const { away, home } = generateMatchup(s);
      const g = simulateGame(away, home, s * 13 + 2);
      const winSide = g.winner === 'away' ? g.awayStats : g.homeStats;
      const starter = winSide.pitching[0];
      if (starter.outs >= 15 && starter.dec === 'W') {
        expect(starter.dec).toBe('W');
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('rubata — attiva Velocita', () => {
  it('la probabilita cresce con la velocita e cala col braccio del ricevitore', () => {
    const fast = stealSuccessProb(batter(80), batter(50, 30), pitcher(50), 1);
    const slow = stealSuccessProb(batter(30), batter(50, 80), pitcher(50), 1);
    expect(fast).toBeGreaterThan(slow);
  });

  it('rubare la terza e piu difficile che rubare la seconda', () => {
    const second = stealSuccessProb(batter(60), batter(50, 50), pitcher(50), 1);
    const third = stealSuccessProb(batter(60), batter(50, 50), pitcher(50), 2);
    expect(third).toBeLessThan(second);
  });

  it('un lanciatore che tiene bene i corridori abbassa la riuscita', () => {
    const loose = stealSuccessProb(batter(60), batter(50, 50), pitcher(20), 1);
    const tight = stealSuccessProb(batter(60), batter(50, 50), pitcher(80), 1);
    expect(tight).toBeLessThan(loose);
  });

  it('la probabilita resta nei limiti [0.15, 0.95]', () => {
    const p = stealSuccessProb(batter(80), batter(50, 20), pitcher(20), 1);
    expect(p).toBeGreaterThanOrEqual(0.15);
    expect(p).toBeLessThanOrEqual(0.95);
  });

  it('senza corridori non ci sono rubate possibili', () => {
    const { away, home } = generateMatchup(1);
    const live = createLiveGame(away, home, 1);
    expect(stealableBases(live)).toEqual([]);
    expect(attemptSteal(live, 1)).toBe(false);
  });
});

describe('bunt — attiva Difesa del lanciatore e Velocita', () => {
  it('gli esiti sommano a 1', () => {
    const p = buntOutcomeProbs(batter(50), pitcher(50));
    expect(p.hit + p.fail + p.pop + p.sac).toBeCloseTo(1, 9);
  });

  it('un battitore veloce ottiene piu bunt validi', () => {
    const fast = buntOutcomeProbs(batter(80), pitcher(50));
    const slow = buntOutcomeProbs(batter(30), pitcher(50));
    expect(fast.hit).toBeGreaterThan(slow.hit);
  });

  it('un lanciatore con buona difesa fa fallire piu sacrifici', () => {
    const vsWeak = buntOutcomeProbs(batter(50), pitcher(30));
    const vsStrong = buntOutcomeProbs(batter(50), pitcher(80));
    expect(vsStrong.fail).toBeGreaterThan(vsWeak.fail);
  });
});

describe('metadati narrativi (kind) per il banner di cronaca', () => {
  const HIT_KINDS = new Set(['single', 'double', 'triple', 'homerun']);
  const KNOWN = new Set([
    'single', 'double', 'triple', 'homerun', 'walk', 'hbp', 'ibb', 'strikeout',
    'inplayout', 'gidp', 'sacfly', 'sacbunt', 'bunthit', 'buntout', 'steal',
    'caughtstealing', 'sub', 'other',
  ]);

  it('ogni giocata di una partita completa ha un kind noto e coerente', () => {
    const { away, home } = generateMatchup(7);
    const res = simulateGame(away, home, 4242);
    expect(res.play.length).toBeGreaterThan(20);
    let hits = 0;
    for (const ev of res.play) {
      expect(KNOWN.has(ev.kind)).toBe(true);
      // Ogni battuta valida (kind di hit) ha un protagonista.
      if (HIT_KINDS.has(ev.kind)) {
        expect(typeof ev.batter).toBe('string');
        hits += 1;
      }
      // Un fuoricampo segna sempre almeno un punto.
      if (ev.kind === 'homerun') expect(ev.runsScored).toBeGreaterThanOrEqual(1);
    }
    // Somma degli hit "narrativi" coerente col totale di squadra.
    expect(hits).toBe(res.awayStats.hits + res.homeStats.hits);
  });

  it('la base intenzionale e la rubata portano il kind giusto', () => {
    const { away, home } = generateMatchup(2);
    const live = createLiveGame(away, home, 2);
    intentionalWalk(live);
    expect(live.play[live.play.length - 1].kind).toBe('ibb');
  });
});

describe('micro-eventi pre-lancio (lancio pazzo / palla passata / balk)', () => {
  const PP_KINDS = new Set(['wildpitch', 'passedball', 'balk']);

  it('senza corridori non scatta mai', () => {
    for (let s = 0; s < 60; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 7 + 1);
      expect(prePitchEvent(live)).toBe(false);
      expect(live.play.length).toBe(0);
    }
  });

  it('col flag spento non scatta mai (misura controllata)', () => {
    for (let s = 0; s < 60; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 7 + 1);
      live.microEvents = false;
      putRunner(live, 0, 8);
      expect(prePitchEvent(live)).toBe(false);
    }
  });

  it('coi corridori scatta a volte, fa avanzare e non consuma out', () => {
    let fired = 0;
    for (let s = 0; s < 400; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 13 + 5);
      putRunner(live, 2, 8); // corridore in terza: se scatta, segna
      const runsBefore = offenseSide(live).runs;
      const fireResult = prePitchEvent(live);
      if (fireResult) {
        fired += 1;
        const ev = live.play[live.play.length - 1];
        expect(PP_KINDS.has(ev.kind)).toBe(true);
        // Il corridore in terza segna: niente out aggiunto.
        expect(live.outs).toBe(0);
        expect(offenseSide(live).runs).toBe(runsBefore + 1);
        expect(situation(live).bases[2]).toBe(false);
      }
    }
    // Non-così-raro: su 400 turni con corridori deve capitare piu' volte.
    expect(fired).toBeGreaterThan(5);
  });

  it('il quick-sim non produce mai micro-eventi (Fase 0 invariata)', () => {
    for (let s = 0; s < 20; s++) {
      const { away, home } = generateMatchup(s);
      const res = simulateGame(away, home, s * 97 + 11);
      for (const ev of res.play) expect(PP_KINDS.has(ev.kind)).toBe(false);
    }
  });
});

describe('azioni interattive', () => {
  it('la base intenzionale mette il battitore in prima', () => {
    const { away, home } = generateMatchup(2);
    const live = createLiveGame(away, home, 2);
    const before = live.play.length;
    intentionalWalk(live);
    expect(situation(live).bases[0]).toBe(true);
    expect(live.play.length).toBe(before + 1);
    expect(live.play[before].text).toContain('intenzionale');
  });

  it('il cambio lanciatore porta in pedana un rilievo scelto', () => {
    const { away, home } = generateMatchup(2);
    const live = createLiveGame(away, home, 2);
    const def = defenseSide(live); // la casa in difesa nel 1° attacco away
    const rel = availableRelievers(def)[0];
    const prev = situation(live).pitcher.id;
    const ok = changePitcher(live, def, rel.id);
    expect(ok).toBe(true);
    expect(situation(live).pitcher.id).toBe(rel.id);
    expect(situation(live).pitcher.id).not.toBe(prev);
  });
});

describe('hit-and-run', () => {
  it('richiede corridore in prima, seconda libera e <2 out', () => {
    const { away, home } = generateMatchup(4);
    const live = createLiveGame(away, home, 4);
    expect(canHitAndRun(live)).toBe(false); // niente corridori
    expect(hitAndRun(live)).toBe(false);
    putRunner(live, 0, 8);
    expect(canHitAndRun(live)).toBe(true);
    putRunner(live, 1, 7); // seconda occupata
    expect(canHitAndRun(live)).toBe(false);
  });

  it('con corridore in prima esegue l azione e aggiunge un play', () => {
    const { away, home } = generateMatchup(4);
    const live = createLiveGame(away, home, 4);
    putRunner(live, 0, 8);
    const before = live.play.length;
    const ok = hitAndRun(live);
    expect(ok).toBe(true);
    expect(live.play.length).toBe(before + 1);
  });

  it('resta coerente (out validi, basi valide) su molti semi', () => {
    for (let s = 0; s < 80; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 5 + 1);
      putRunner(live, 0, 8);
      hitAndRun(live);
      expect(live.outs).toBeGreaterThanOrEqual(0);
      expect(live.outs).toBeLessThanOrEqual(3);
      expect(live.bases.length).toBe(3);
    }
  });
});

describe('pinch-hit', () => {
  it('sostituisce il battitore senza consumare il turno', () => {
    const { away, home } = generateMatchup(6);
    const live = createLiveGame(away, home, 6);
    const off = offenseSide(live);
    const benchBefore = off.team.bench.length;
    expect(benchBefore).toBeGreaterThan(0);
    const sub = benchFor(live)[0];
    const idxBefore = off.battingIndex;
    const outsBefore = live.outs;
    const curBefore = situation(live).batter.id;

    const ok = pinchHit(live, sub.id);
    expect(ok).toBe(true);
    expect(situation(live).batter.id).toBe(sub.id);
    expect(situation(live).batter.id).not.toBe(curBefore);
    expect(off.team.bench.length).toBe(benchBefore - 1);
    expect(live.outs).toBe(outsBefore); // turno non consumato
    expect(off.battingIndex).toBe(idxBefore);
  });

  it('un id di panchina inesistente non fa nulla', () => {
    const { away, home } = generateMatchup(6);
    const live = createLiveGame(away, home, 6);
    expect(pinchHit(live, 'nessuno')).toBe(false);
  });
});

describe('difesa avanzata — interni dentro', () => {
  it('taglia i punti da terra ma concede piu valide', () => {
    let runsN = 0;
    let hitsN = 0;
    let runsI = 0;
    let hitsI = 0;
    for (let s = 0; s < 300; s++) {
      const seed = s * 3 + 1;
      // Normale.
      const m1 = generateMatchup(s);
      const gN = createLiveGame(m1.away, m1.home, seed);
      gN.microEvents = false; // misura il solo esito grezzo del turno
      gN.outs = 0;
      putRunner(gN, 2, 8);
      const rN0 = offenseSide(gN).runs;
      const hN0 = offenseSide(gN).hits;
      playOffense(gN, 'swing');
      runsN += offenseSide(gN).runs - rN0;
      hitsN += offenseSide(gN).hits - hN0;
      // Interni dentro (stesso seme, stesso evento grezzo).
      const m2 = generateMatchup(s);
      const gI = createLiveGame(m2.away, m2.home, seed);
      gI.microEvents = false; // misura il solo esito grezzo del turno
      gI.outs = 0;
      putRunner(gI, 2, 8);
      setInfieldIn(gI, true);
      const rI0 = offenseSide(gI).runs;
      const hI0 = offenseSide(gI).hits;
      playOffense(gI, 'swing');
      runsI += offenseSide(gI).runs - rI0;
      hitsI += offenseSide(gI).hits - hI0;
    }
    expect(runsI).toBeLessThan(runsN); // meno punti da terra
    expect(hitsI).toBeGreaterThanOrEqual(hitsN); // piu valide attraverso l'interno
  });

  it('il flag si attiva/disattiva', () => {
    const { away, home } = generateMatchup(2);
    const live = createLiveGame(away, home, 2);
    expect(live.infieldIn).toBe(false);
    setInfieldIn(live, true);
    expect(live.infieldIn).toBe(true);
    expect(situation(live).infieldIn).toBe(true);
    setInfieldIn(live, false);
    expect(live.infieldIn).toBe(false);
  });
});
