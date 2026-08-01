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
  substituteFielder,
  pinchRun,
} from '../game';
import type { LiveGame } from '../game';
import { estimatedPitches } from '../boxscore';
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

  it('rubata della 3ª: la giocata riporta base=3 e il testo dice "terza"', () => {
    // Su molti semi, ogni tentativo dalla 2ª (fromBase=2) deve etichettare la
    // TERZA base, mai la seconda (bug: "eliminato in 2B" rubando la 3ª).
    for (let s = 0; s < 40; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 3 + 1);
      putRunner(live, 1, 6); // corridore in 2ª
      attemptSteal(live, 2); // ruba la 3ª
      const p = live.play.at(-1)!;
      expect(p.base).toBe(3);
      expect(p.text).toContain('terza');
      expect(p.text).not.toContain('seconda');
    }
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
    'inplayout', 'gidp', 'sacfly', 'sacbunt', 'bunthit', 'buntout', 'buntfc', 'steal',
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

  it('con corridore in prima, quando scatta lo fa avanzare in seconda (no out, no punto)', () => {
    let fired = 0;
    for (let s = 0; s < 400; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 13 + 5);
      putRunner(live, 0, 8); // corridore in prima: avanza sempre in seconda
      const runsBefore = offenseSide(live).runs;
      const fireResult = prePitchEvent(live);
      if (fireResult) {
        fired += 1;
        const ev = live.play[live.play.length - 1];
        expect(PP_KINDS.has(ev.kind)).toBe(true);
        expect(live.outs).toBe(0);
        expect(offenseSide(live).runs).toBe(runsBefore); // niente punto dalla prima
        expect(situation(live).bases[0]).toBe(false);
        expect(situation(live).bases[1]).toBe(true);
      }
    }
    // Non-così-raro: su 400 turni con corridori deve capitare piu' volte.
    expect(fired).toBeGreaterThan(5);
  });

  it('non perde ne sovrappone corridori (2a+3a): il 3a a casa non e sempre facile', () => {
    let fired = 0;
    let thirdScored = 0;
    // Evento raro (micro-evento + 3a che segna con 2a+3a occupate): serve un
    // campione ampio perche' il conteggio sia stabilmente sopra soglia.
    for (let s = 0; s < 1500; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 17 + 3);
      putRunner(live, 1, 7); // seconda
      putRunner(live, 2, 8); // terza
      const before = live.bases.filter(Boolean).length; // 2
      const runsBefore = offenseSide(live).runs;
      const ok = prePitchEvent(live);
      if (!ok) {
        // Se non e' successo nulla di visibile, le basi restano intatte.
        expect(live.bases.filter(Boolean).length).toBe(before);
        continue;
      }
      fired += 1;
      const runs = offenseSide(live).runs - runsBefore;
      const after = live.bases.filter(Boolean).length;
      // Conservazione: corridori rimasti + segnati = corridori iniziali.
      // (Il bug da evitare: 3a tiene ma 2a gli sale sopra e lo cancella.)
      expect(after + runs).toBe(before);
      expect(live.outs).toBe(0);
      if (runs > 0) thirdScored += 1;
    }
    expect(fired).toBeGreaterThan(5);
    // Con 2a+3a occupate, l'evento e' visibile solo se il 3a segna (altrimenti
    // il 2a e' bloccato dietro di lui): tutte le occorrenze qui hanno il 3a a casa.
    expect(thirdScored).toBe(fired);
  });

  it('il quick-sim non produce mai micro-eventi (Fase 0 invariata)', () => {
    for (let s = 0; s < 20; s++) {
      const { away, home } = generateMatchup(s);
      const res = simulateGame(away, home, s * 97 + 11);
      for (const ev of res.play) expect(PP_KINDS.has(ev.kind)).toBe(false);
    }
  });

  it('gioco interattivo con micro-eventi ON: stato sempre valido, niente corridori duplicati', () => {
    for (let s = 0; s < 40; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 29 + 7);
      let guard = 0;
      while (live.status !== 'final' && guard < 3000) {
        playOffense(live, 'swing');
        guard += 1;
        expect(live.outs).toBeGreaterThanOrEqual(0);
        expect(live.outs).toBeLessThanOrEqual(3);
        expect(live.bases.length).toBe(3);
        // Nessun corridore su due basi contemporaneamente (bug di sovrapposizione).
        const ids = live.bases.filter(Boolean).map((r) => (r as { batter: Batter }).batter.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
      expect(live.status).toBe('final');
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
  it('disponibile con un corridore lanciabile (1ª→2ª o 2ª→3ª), <2 out', () => {
    const { away, home } = generateMatchup(4);
    const live = createLiveGame(away, home, 4);
    expect(canHitAndRun(live)).toBe(false); // niente corridori
    expect(hitAndRun(live)).toBe(false);
    // Corridore in 1ª, 2ª libera → sì.
    putRunner(live, 0, 8);
    expect(canHitAndRun(live)).toBe(true);
    // 1ª + 2ª, 3ª libera → sì (si lancia il corridore dalla 2ª verso la 3ª).
    putRunner(live, 1, 7);
    expect(canHitAndRun(live)).toBe(true);
    // 1ª + 2ª + 3ª (nessuna base davanti libera) → no.
    putRunner(live, 2, 6);
    expect(canHitAndRun(live)).toBe(false);
  });

  it('solo corridore in 2ª (3ª libera): disponibile; 2 out: no', () => {
    const { away, home } = generateMatchup(9);
    const live = createLiveGame(away, home, 9);
    putRunner(live, 1, 8); // corridore in 2ª, 3ª libera
    expect(canHitAndRun(live)).toBe(true);
    live.outs = 2;
    expect(canHitAndRun(live)).toBe(false);
  });

  it('con corridore in 2ª resta coerente su molti semi', () => {
    for (let s = 0; s < 80; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 5 + 1);
      putRunner(live, 1, 8); // corridore in 2ª
      const ok = hitAndRun(live);
      expect(ok).toBe(true);
      expect(live.outs).toBeGreaterThanOrEqual(0);
      expect(live.outs).toBeLessThanOrEqual(3);
      expect(live.bases.length).toBe(3);
    }
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

describe('stima lanci (affaticamento)', () => {
  it('cresce con battitori affrontati, BB e SO (formula di Tango)', () => {
    const base = estimatedPitches({ bf: 20, so: 5, bb: 2 });
    expect(base).toBe(Math.round(3.3 * 20 + 1.5 * 5 + 2.2 * 2)); // 82
    // Più battitori affrontati ⇒ più lanci; più BB/SO ⇒ più lanci.
    expect(estimatedPitches({ bf: 30, so: 5, bb: 2 })).toBeGreaterThan(base);
    expect(estimatedPitches({ bf: 20, so: 12, bb: 6 })).toBeGreaterThan(base);
    expect(estimatedPitches({ bf: 0, so: 0, bb: 0 })).toBe(0);
  });

  it('coerente con la linea reale di una partita simulata', () => {
    const { away, home } = generateMatchup(11);
    const g = simulateGame(away, home, 123);
    for (const st of [g.awayStats, g.homeStats]) {
      for (const p of st.pitching) {
        // Un lanciatore che ha affrontato battitori ha una stima > 0.
        if (p.bf > 0) expect(estimatedPitches(p)).toBeGreaterThan(0);
      }
    }
  });
});

describe('logica di campo sugli out (avanzamenti reali oltre il motore lineare)', () => {
  it('ogni out in gioco porta un outInfo col tipo di battuta', () => {
    let inplay = 0;
    let advanced = 0;
    let fc = 0;
    for (let s = 0; s < 120; s++) {
      const { away, home } = generateMatchup(s);
      const g = simulateGame(away, home, s * 17 + 5);
      for (const p of g.play) {
        if (p.kind !== 'inplayout') continue;
        inplay += 1;
        expect(p.outInfo, JSON.stringify(p)).toBeTruthy();
        expect(['ground', 'fly', 'popup']).toContain(p.outInfo!.ball);
        if (p.outInfo!.advanced) advanced += 1;
        if (p.outInfo!.fc) fc += 1;
      }
    }
    expect(inplay).toBeGreaterThan(0);
    // Su un campione così ampio devono comparire sia avanzamenti sia scelte
    // difensive (comportamenti nuovi del motore).
    expect(advanced).toBeGreaterThan(0);
    expect(fc).toBeGreaterThan(0);
  });

  it('sostituzione difensiva: un panchinaro entra al posto di un titolare', () => {
    const { away, home } = generateMatchup(3);
    const live = createLiveGame(away, home, 3);
    const def = defenseSide(live);
    const out = def.team.lineup[4];
    const inc = def.team.bench[0];
    const benchBefore = def.team.bench.length;
    expect(substituteFielder(live, def, out.id, inc.id)).toBe(true);
    expect(def.team.lineup[4].id).toBe(inc.id);
    expect(inc.position).toBe(out.position); // eredita il ruolo
    expect(def.team.bench.length).toBe(benchBefore - 1);
    expect(live.play[live.play.length - 1].kind).toBe('sub');
  });

  it('pinch-runner: un panchinaro rileva il corridore in base', () => {
    const { away, home } = generateMatchup(4);
    const live = createLiveGame(away, home, 4);
    const off = offenseSide(live);
    putRunner(live, 0, 6); // corridore in 1ª (lineup[6])
    const outId = live.bases[0]!.batter.id;
    const inc = off.team.bench[0];
    expect(pinchRun(live, off, 0, inc.id)).toBe(true);
    expect(live.bases[0]!.batter.id).toBe(inc.id);
    expect(live.bases[0]!.batter.id).not.toBe(outId);
    expect(off.team.bench.find((b) => b.id === inc.id)).toBeUndefined();
  });

  it('scelta difensiva: con corridore in 2ª (1ª e 3ª libere) a volte il battitore resta salvo in prima', () => {
    let batterSafe = 0;
    for (let s = 0; s < 400; s++) {
      const { away, home } = generateMatchup(s);
      const live = createLiveGame(away, home, s * 7 + 2);
      live.microEvents = false;
      live.outs = 0;
      live.bases = [null, null, null];
      putRunner(live, 1, 8); // solo la 2ª occupata
      const before = offenseSide(live).team.lineup[offenseSide(live).battingIndex];
      playOffense(live, 'swing');
      // FC: il battitore è finito in prima pur non essendo una valida/BB.
      const last = live.play[live.play.length - 1];
      if (last?.outInfo?.fc && live.bases[0]?.batter.id === before.id) batterSafe += 1;
    }
    expect(batterSafe).toBeGreaterThan(0);
  });
});
