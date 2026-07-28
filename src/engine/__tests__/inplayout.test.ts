import { describe, it, expect } from 'vitest';
import { resolveInPlayOut, type Runner } from '../game';
import { newBattingLine, newPitchingLine } from '../boxscore';
import type { Rng } from '../rng';
import { generateMatchup } from '../../data/generator';

// Regressione: con corridori in 1ª e 3ª, un rimbalzo che elimina il battitore in
// prima deve far avanzare il corridore FORZATO dalla 1ª in 2ª (prima restava fermo
// ~2 volte su 3, gated dietro la probabilità di "out produttivo").

/** RNG finto: `chance()` restituisce valori copionati in ordine; il resto è neutro. */
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

const { away, home } = generateMatchup(1);
const b1 = away.lineup[0];
const b3 = away.lineup[1];
const batter = away.lineup[2];
const mkRunner = (b: typeof b1): Runner => ({ batter: b, pitcherId: home.rotation[0].id });

function run(
  bases: (Runner | null)[],
  outsBefore: number,
  chances: boolean[],
): { res: ReturnType<typeof resolveInPlayOut>; runs: number } {
  let runs = 0;
  const res = resolveInPlayOut(
    mkRunner(batter),
    bases,
    outsBefore,
    scriptedRng(chances),
    () => {
      runs += 1;
    },
    newBattingLine(batter),
    newPitchingLine(home.rotation[0]),
    false,
  );
  return { res, runs };
}

describe('resolveInPlayOut — avanzamenti forzati su rimbalzo', () => {
  it('1ª e 3ª: out in prima → il corridore da 1ª avanza SEMPRE in 2ª', () => {
    // chance: [ground=true, gidp=false, 3ª-segna=false]
    const bases: (Runner | null)[] = [mkRunner(b1), null, mkRunner(b3)];
    const { res } = run(bases, 0, [true, false, false]);
    expect(res.ball).toBe('ground');
    expect(res.outsAdded).toBe(1);
    expect(bases[0]).toBeNull(); // la 1ª si è svuotata
    expect(bases[1]?.batter.id).toBe(b1.id); // il corridore è avanzato in 2ª
    expect(bases[2]?.batter.id).toBe(b3.id); // la 3ª è rimasta ferma (non ha segnato)
    expect(res.advanced).toBe(true);
  });

  it('solo 1ª: out in prima → avanza in 2ª (forzato)', () => {
    const bases: (Runner | null)[] = [mkRunner(b1), null, null];
    run(bases, 0, [true, false]); // ground, no gidp
    expect(bases[0]).toBeNull();
    expect(bases[1]?.batter.id).toBe(b1.id);
  });

  it('basi piene: out in prima → punto forzato dalla 3ª e catena di avanzamenti', () => {
    const bases: (Runner | null)[] = [mkRunner(b1), mkRunner(batter), mkRunner(b3)];
    // ground, no gidp; la 3ª è forzata (basi piene) → segna senza bisogno di rng.
    const { runs } = run(bases, 0, [true, false]);
    expect(runs).toBe(1); // il corridore in 3ª segna d'ufficio
    expect(bases[2]).not.toBeNull(); // rimpiazzata dalla 2ª forzata
    expect(bases[1]).not.toBeNull(); // rimpiazzata dalla 1ª forzata
    expect(bases[0]).toBeNull(); // la 1ª si è svuotata
  });

  it('con 2 out non ci sono avanzamenti (l’azione si chiude)', () => {
    const bases: (Runner | null)[] = [mkRunner(b1), null, mkRunner(b3)];
    run(bases, 2, [true, false]);
    expect(bases[0]?.batter.id).toBe(b1.id); // resta in 1ª
    expect(bases[1]).toBeNull();
    expect(bases[2]?.batter.id).toBe(b3.id);
  });
});
