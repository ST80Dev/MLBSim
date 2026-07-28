import { describe, it, expect } from 'vitest';
import {
  createLiveGame,
  playOffense,
  cpuOffenseTurn,
  quickSim,
  situation,
  toGameResult,
  resolveInPlayOut,
  buntOutcomeProbs,
  type LiveGame,
  type Runner,
} from '../game';
import { newBattingLine, newPitchingLine } from '../boxscore';
import { generateMatchup } from '../../data/generator';
import { makeRng, type Rng } from '../rng';

/** Rng finto: `next()` fisso, `chance()` fisso; il resto neutro. */
function fixedRng(next: number, chance = false): Rng {
  return {
    next: () => next,
    int: (min: number) => min,
    chance: () => chance,
    gauss: (mean: number) => mean,
    pick: <T>(arr: readonly T[]) => arr[0],
  };
}

/** Rng con `chance()` copionato e `next()` fisso. */
function scriptedRng(chances: boolean[], next = 0): Rng {
  let i = 0;
  return {
    next: () => next,
    int: (min: number) => min,
    chance: () => chances[i++] ?? false,
    gauss: (mean: number) => mean,
    pick: <T>(arr: readonly T[]) => arr[0],
  };
}

/** Partita con la squadra away (CPU, in cima all'inning) alla battuta. */
function cpuBattingGame(seed: number): LiveGame {
  const { away, home } = generateMatchup(seed);
  const live = createLiveGame(away, home, seed, 'home'); // umano = home → CPU (away) batte
  live.microEvents = false; // niente micro-eventi pre-lancio a disturbare l'RNG
  return live;
}

// --------------------------------------------------------------------------
describe('Squeeze — il corridore in terza parte al lancio', () => {
  function setup(seed: number) {
    const live = cpuBattingGame(seed);
    const sit = situation(live);
    const probs = buntOutcomeProbs(sit.batter, sit.pitcher);
    // Corridore reale in terza (id noto per verificare il punto).
    const runner: Runner = { batter: live.away.lineup[8], pitcherId: 'p' };
    live.bases[2] = runner;
    return { live, probs, runnerId: runner.batter.id };
  }

  it('bunt valido: il corridore segna e il battitore è salvo in prima', () => {
    const { live } = setup(11);
    live.rng = fixedRng(0); // roll < hit → bunt valido
    const before = situation(live).awayScore;
    playOffense(live, 'squeeze');
    const s = situation(live);
    expect(s.awayScore).toBe(before + 1); // il punto è segnato
    expect(live.bases[2]).toBeNull(); // la terza si è svuotata
    expect(live.bases[0]).not.toBeNull(); // battitore in prima
    expect(toGameResult(live).play.at(-1)?.kind).toBe('bunthit');
  });

  it('sacrificio riuscito: il corridore segna, il battitore è eliminato', () => {
    const { live } = setup(12);
    live.rng = fixedRng(0.9999); // roll nel bucket "sac"
    const before = situation(live).awayScore;
    playOffense(live, 'squeeze');
    const s = situation(live);
    expect(s.awayScore).toBe(before + 1);
    expect(s.outs).toBe(1);
    expect(live.bases[0]).toBeNull(); // battitore out, non in prima
    expect(toGameResult(live).play.at(-1)?.kind).toBe('sacbunt');
  });

  it('squeeze fallito: il corridore è eliminato a casa, niente punto', () => {
    const { live, probs } = setup(13);
    const roll = probs.hit + probs.fail / 2; // bucket "fail"
    live.rng = fixedRng(roll);
    const before = situation(live).awayScore;
    playOffense(live, 'squeeze');
    const s = situation(live);
    expect(s.awayScore).toBe(before); // nessun punto
    expect(s.outs).toBe(1);
    expect(live.bases[2]).toBeNull(); // corridore bruciato
    expect(live.bases[0]).not.toBeNull(); // battitore salvo in prima (FC)
    expect(toGameResult(live).play.at(-1)?.kind).toBe('buntout');
  });

  it('pop disastroso: doppio gioco al piatto, niente punto', () => {
    const { live, probs } = setup(14);
    const roll = probs.hit + probs.fail + probs.pop / 2; // bucket "pop"
    live.rng = fixedRng(roll);
    const before = situation(live).awayScore;
    playOffense(live, 'squeeze');
    const s = situation(live);
    expect(s.awayScore).toBe(before);
    expect(s.outs).toBe(2); // battitore + corridore doppiato
    expect(live.bases[2]).toBeNull();
    expect(toGameResult(live).play.at(-1)?.kind).toBe('gidp');
  });
});

// --------------------------------------------------------------------------
describe('Interni a doppio gioco — più DP, ma qualche buco', () => {
  const { away, home } = generateMatchup(21);
  const b = away.lineup[3];
  const p = home.rotation[0];
  const mkRunner = (): Runner => ({ batter: away.lineup[0], pitcherId: p.id });

  /** Conta gli esiti su N rimbalzi (ground forzato) con/ senza interni a DP. */
  function tally(dpDepth: boolean) {
    const rng = makeRng(999);
    let gidp = 0;
    let dphole = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const bases: (Runner | null)[] = [mkRunner(), null, null];
      // Rng reale: contiamo solo gli esiti da rimbalzo (gidp / dphole).
      const res = resolveInPlayOut(
        { batter: b, pitcherId: p.id },
        bases,
        0,
        rng,
        () => {},
        newBattingLine(b),
        newPitchingLine(p),
        false,
        dpDepth,
      );
      if (res.detail === 'gidp') gidp++;
      if (res.detail === 'dphole') dphole++;
    }
    return { gidp, dphole };
  }

  it('scriptato: rimbalzo con interni a DP → il buco produce un singolo', () => {
    const bases: (Runner | null)[] = [{ batter: away.lineup[0], pitcherId: p.id }, null, null];
    // [ground=true, hitThrough=true]
    const res = resolveInPlayOut(
      { batter: b, pitcherId: p.id },
      bases,
      0,
      scriptedRng([true, true]),
      () => {},
      newBattingLine(b),
      newPitchingLine(p),
      false,
      true,
    );
    expect(res.hit).toBe(true);
    expect(res.detail).toBe('dphole');
    expect(bases[0]?.batter.id).toBe(b.id); // battitore in prima
  });

  it('scriptato: rimbalzo con interni a DP → doppio gioco quando il buco manca', () => {
    const bases: (Runner | null)[] = [{ batter: away.lineup[0], pitcherId: p.id }, null, null];
    // [ground=true, hitThrough=false, gidp=true]
    const res = resolveInPlayOut(
      { batter: b, pitcherId: p.id },
      bases,
      0,
      scriptedRng([true, false, true]),
      () => {},
      newBattingLine(b),
      newPitchingLine(p),
      false,
      true,
    );
    expect(res.outsAdded).toBe(2);
    expect(res.detail).toBe('gidp');
  });

  it('statistico: gli interni a DP alzano la conversione del doppio gioco', () => {
    const off = tally(false);
    const on = tally(true);
    expect(on.gidp).toBeGreaterThan(off.gidp); // più doppi giochi
    expect(on.dphole).toBeGreaterThan(0); // e compaiono i buchi
    expect(off.dphole).toBe(0); // che a difesa normale non esistono
  });
});

// --------------------------------------------------------------------------
describe('Difendi le righe — meno extrabase, più singoli', () => {
  function count(noDoubles: boolean) {
    let xb = 0;
    let singles = 0;
    for (let s = 1; s <= 25; s++) {
      const { away, home } = generateMatchup(s * 7);
      const live = createLiveGame(away, home, s * 7);
      live.microEvents = false;
      let guard = 0;
      while (live.status !== 'final' && guard < 3000) {
        if (noDoubles) live.noDoubles = true; // ri-attiva ogni turno (si resetta a fine mezzo-inning)
        playOffense(live, 'swing');
        guard++;
      }
      for (const pl of toGameResult(live).play) {
        if (pl.kind === 'double' || pl.kind === 'triple') xb++;
        if (pl.kind === 'single') singles++;
      }
    }
    return { xb, singles };
  }

  it('declassa una quota di doppi/tripli a singolo', () => {
    const off = count(false);
    const on = count(true);
    expect(on.xb).toBeLessThan(off.xb); // meno extrabase concessi
    expect(on.singles).toBeGreaterThan(off.singles); // compensati da singoli
  });
});

// --------------------------------------------------------------------------
describe('Cerca fly ball — volata di sacrificio dalla terza', () => {
  const { away, home } = generateMatchup(41);
  const b = away.lineup[4];
  const p = home.rotation[0];

  it('scriptato: volata profonda → il corridore in terza segna (SF)', () => {
    const bases: (Runner | null)[] = [null, null, { batter: away.lineup[7], pitcherId: p.id }];
    let scored = 0;
    // [flyShare=true (elevata), sacflyConv=true (segna)]
    const res = resolveInPlayOut(
      { batter: b, pitcherId: p.id },
      bases,
      0,
      scriptedRng([true, true]),
      () => {
        scored++;
      },
      newBattingLine(b),
      newPitchingLine(p),
      false,
      false,
      true, // seekFly
    );
    expect(res.detail).toBe('sacfly');
    expect(res.outsAdded).toBe(1);
    expect(scored).toBe(1);
    expect(bases[2]).toBeNull(); // la terza si è svuotata (punto)
  });

  it('scriptato: elevazione mancata → pop, il corridore resta fermo', () => {
    const runner3: Runner = { batter: away.lineup[7], pitcherId: p.id };
    const bases: (Runner | null)[] = [null, null, runner3];
    let scored = 0;
    // [flyShare=false → pop]
    const res = resolveInPlayOut(
      { batter: b, pitcherId: p.id },
      bases,
      0,
      scriptedRng([false]),
      () => {
        scored++;
      },
      newBattingLine(b),
      newPitchingLine(p),
      false,
      false,
      true,
    );
    expect(res.ball).toBe('popup');
    expect(scored).toBe(0);
    expect(bases[2]).toBe(runner3); // il corridore tiene la terza
  });

  it('statistico: cercare il fly porta a casa il corridore in 3ª molto più spesso', () => {
    function scoreRate(seekFly: boolean) {
      const rng = makeRng(7777);
      let scored = 0;
      const N = 4000;
      for (let i = 0; i < N; i++) {
        const bases: (Runner | null)[] = [null, null, { batter: away.lineup[7], pitcherId: p.id }];
        let s = 0;
        resolveInPlayOut(
          { batter: b, pitcherId: p.id },
          bases,
          0,
          rng,
          () => {
            s++;
          },
          newBattingLine(b),
          newPitchingLine(p),
          false,
          false,
          seekFly,
        );
        scored += s;
      }
      return scored / N;
    }
    const normal = scoreRate(false);
    const fly = scoreRate(true);
    expect(fly).toBeGreaterThan(normal + 0.2); // netto salto nella conversione del punto
  });

  it('integrazione: playOffense("flyball") consuma una battuta e resta coerente', () => {
    const live = cpuBattingGame(43);
    live.microEvents = false;
    live.bases[2] = { batter: live.away.lineup[6], pitcherId: 'p' };
    const before = situation(live);
    const nPlays = toGameResult(live).play.length;
    playOffense(live, 'flyball');
    const after = situation(live);
    expect(toGameResult(live).play.length).toBe(nPlays + 1); // un'azione prodotta
    expect(after.batter.id).not.toBe(before.batter.id); // la battuta è stata consumata
  });
});

// --------------------------------------------------------------------------
describe('AI tattica della CPU (small-ball)', () => {
  it('un corridore veloce in prima ruba quando le chance sono buone', () => {
    const live = cpuBattingGame(31);
    live.rng = fixedRng(0, true); // ogni chance() = true → tattica eseguita
    const fast = live.away.lineup[0];
    fast.ratings.speed = 92; // ben sopra la soglia
    live.bases[0] = { batter: fast, pitcherId: 'p' };
    cpuOffenseTurn(live);
    expect(live.bases[1]?.batter.id).toBe(fast.id); // rubata riuscita: ora in seconda
    expect(live.bases[0]).toBeNull();
    expect(toGameResult(live).play.at(-1)?.kind).toBe('steal');
  });

  it('un corridore lento NON scatena la rubata (sotto la soglia VEL)', () => {
    const live = cpuBattingGame(32);
    live.rng = fixedRng(0, true);
    const slow = live.away.lineup[0];
    slow.ratings.speed = 45; // sotto stealMinSpeed
    slow.ratings.power = 80;
    slow.ratings.contact = 80; // non "debole" → niente bunt
    live.bases[0] = { batter: slow, pitcherId: 'p' };
    cpuOffenseTurn(live);
    // Nessuna rubata: il corridore resta in prima (ha battuto in swing/h&r/altro).
    expect(toGameResult(live).play.at(-1)?.kind).not.toBe('steal');
  });

  it('CALIBRAZIONE: il quick-sim non usa mai tattiche (nessuna rubata/bunt)', () => {
    const forbidden = new Set(['steal', 'caughtstealing', 'sacbunt', 'bunthit', 'buntout', 'ibb']);
    for (let s = 1; s <= 20; s++) {
      const { away, home } = generateMatchup(s * 3 + 1);
      const live = createLiveGame(away, home, s * 3 + 1);
      quickSim(live);
      for (const pl of toGameResult(live).play) {
        expect(forbidden.has(pl.kind)).toBe(false);
      }
    }
  });

  it('CALIBRAZIONE: il quick-sim resta deterministico bit-per-bit', () => {
    const run = () => {
      const { away, home } = generateMatchup(4242);
      const live = createLiveGame(away, home, 4242);
      quickSim(live);
      const r = toGameResult(live);
      return `${r.awayStats.runs}-${r.homeStats.runs}:${r.play.length}`;
    };
    expect(run()).toBe(run());
  });
});
