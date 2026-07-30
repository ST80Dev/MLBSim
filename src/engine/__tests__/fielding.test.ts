import { describe, it, expect } from 'vitest';
import { batterRates, pitcherRates, combineRates } from '../probabilities';
import { resolveInPlayOut, simulateGame, type Runner } from '../game';
import { newBattingLine, newPitchingLine } from '../boxscore';
import { generateMatchup } from '../../data/generator';
import { makeRng, type Rng } from '../rng';
import type { Team } from '../types';

/** Rng con `chance()` copionato; `next()` neutro. */
function scriptedRng(chances: boolean[]): Rng {
  let i = 0;
  return {
    next: () => 0,
    int: (min: number) => min,
    chance: () => chances[i++] ?? false,
    gauss: (mean: number) => mean,
    pick: <T>(arr: readonly T[]) => arr[0],
  };
}

/** Impone fielding/braccio uniformi a tutti i titolari (offesa/lanciatori intatti). */
function withFielding(team: Team, level: number): Team {
  return {
    ...team,
    lineup: team.lineup.map((b) => ({ ...b, ratings: { ...b.ratings, fielding: level, arm: level } })),
  };
}

// --------------------------------------------------------------------------
describe('Esterni: soppressione extrabase in combineRates', () => {
  const { away, home } = generateMatchup(1);
  const b = batterRates(away.lineup[0].stats);
  const p = pitcherRates(home.rotation[0].stats);
  const base = { platoonAdvantage: false, platoonDisadvantage: false, fatigue: 1 };
  const neutral = combineRates(b, p, { ...base });
  const goodOF = combineRates(b, p, { ...base, outfieldSigma: 1.5 });
  const badOF = combineRates(b, p, { ...base, outfieldSigma: -1.5 });

  it('esterni forti: meno doppi/tripli, più out (i singoli non li tocca)', () => {
    expect(goodOF.double).toBeLessThan(neutral.double);
    expect(goodOF.triple).toBeLessThan(neutral.triple);
    expect(goodOF.outInPlay).toBeGreaterThan(neutral.outInPlay);
    // Il layer esterni tocca SOLO gli extrabase: il singolo resta invariato.
    expect(goodOF.single).toBeCloseTo(neutral.single, 12);
  });

  it('esterni scarsi: più doppi/tripli, meno out', () => {
    expect(badOF.double).toBeGreaterThan(neutral.double);
    expect(badOF.outInPlay).toBeLessThan(neutral.outInPlay);
  });

  it('outfieldSigma 0 è un NO-OP (calibrazione media invariata)', () => {
    const zero = combineRates(b, p, { ...base, outfieldSigma: 0 });
    for (const k of ['double', 'triple', 'single', 'outInPlay'] as const) {
      expect(zero[k]).toBeCloseTo(neutral[k], 12);
    }
  });

  it('non tocca i three true outcomes né il totale', () => {
    for (const k of ['hr', 'bb', 'hbp', 'so'] as const) {
      expect(goodOF[k]).toBeCloseTo(neutral[k], 12);
    }
    const sum = (c: typeof neutral) =>
      c.bb + c.hbp + c.so + c.hr + c.triple + c.double + c.single + c.outInPlay;
    expect(sum(goodOF)).toBeCloseTo(1, 6);
    expect(sum(badOF)).toBeCloseTo(1, 6);
  });
});

// --------------------------------------------------------------------------
describe('Errori difensivi (resolveInPlayOut)', () => {
  const { away, home } = generateMatchup(3);
  const b = away.lineup[3];
  const p = home.rotation[0];
  const mkRunner = (): Runner => ({ batter: away.lineup[0], pitcherId: p.id });

  it('senza defSig NON tira l’errore (test legacy invariati)', () => {
    // [ground=true, poi gidp=true] — nessun roll errore in mezzo.
    const bases: (Runner | null)[] = [mkRunner(), null, null];
    const res = resolveInPlayOut(
      { batter: b, pitcherId: p.id },
      bases,
      0,
      scriptedRng([true, true]),
      () => {},
      newBattingLine(b),
      newPitchingLine(p),
      false,
    );
    expect(res.error).toBeFalsy();
    expect(res.detail).toBe('gidp');
  });

  it('scriptato: con defSig un rimbalzo diventa reached-on-error', () => {
    // [ground=true, error=true]
    const bases: (Runner | null)[] = [null, null, { batter: away.lineup[7], pitcherId: p.id }];
    let scored = 0;
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
      false,
      { infield: 0, outfield: 0 },
    );
    expect(res.error).toBe(true);
    expect(res.outsAdded).toBe(0); // nessun out: l’errore ha salvato il battitore
    expect(bases[0]?.reachedViaError).toBe(true); // battitore in prima, marchiato
    expect(scored).toBe(1); // il corridore dalla terza è segnato (unearned)
  });

  it('statistico: interni scarsi commettono più errori dei forti', () => {
    function errorRate(sig: number) {
      const rng = makeRng(555);
      let err = 0;
      const N = 5000;
      for (let i = 0; i < N; i++) {
        const bases: (Runner | null)[] = [mkRunner(), null, null];
        const res = resolveInPlayOut(
          { batter: b, pitcherId: p.id },
          bases,
          0,
          rng,
          () => {},
          newBattingLine(b),
          newPitchingLine(p),
          false,
          false,
          false,
          { infield: sig, outfield: sig },
        );
        if (res.error) err++;
      }
      return err;
    }
    expect(errorRate(-1.5)).toBeGreaterThan(errorRate(1.5) * 1.5);
  });
});

// --------------------------------------------------------------------------
describe('Difesa per-fielder end-to-end (simulateGame)', () => {
  it('una difesa scarsa commette più errori e concede più doppi', () => {
    let goodE = 0;
    let badE = 0;
    let good2 = 0;
    let bad2 = 0;
    for (let s = 0; s < 50; s++) {
      const { away, home } = generateMatchup(s);
      const gGood = simulateGame(away, withFielding(home, 92), s * 17 + 1);
      const gBad = simulateGame(away, withFielding(home, 52), s * 17 + 1);
      goodE += gGood.homeStats.errors;
      badE += gBad.homeStats.errors;
      for (const l of gGood.awayStats.batting) good2 += l.double;
      for (const l of gBad.awayStats.batting) bad2 += l.double;
    }
    expect(badE).toBeGreaterThan(goodE); // difesa scarsa: più errori
    expect(bad2).toBeGreaterThan(good2); // e più doppi concessi
  });

  it('nascono corse unearned (ER < R su molte partite)', () => {
    let R = 0;
    let ER = 0;
    let errors = 0;
    for (let s = 0; s < 120; s++) {
      const { away, home } = generateMatchup(s);
      const g = simulateGame(away, home, s * 29 + 7);
      for (const st of [g.awayStats, g.homeStats]) {
        errors += st.errors;
        for (const p of st.pitching) {
          R += p.r;
          ER += p.er;
        }
      }
    }
    expect(errors).toBeGreaterThan(0); // gli errori accadono
    expect(ER).toBeLessThan(R); // alcune corse sono unearned
    expect(ER).toBeGreaterThan(R * 0.85); // ma la maggioranza resta earned
  });
});
