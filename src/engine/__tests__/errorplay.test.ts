import { describe, it, expect } from 'vitest';
import type { Batter, BatterRatings } from '../types';
import type { Rng } from '../rng';
import type { Runner } from '../game';
import { resolveInPlayOut } from '../game';
import { newBattingLine } from '../boxscore';
import type { PitchingLine } from '../boxscore';

const R: BatterRatings = { contact: 70, power: 70, eye: 70, speed: 70, fielding: 70, arm: 70 };
const bat = (id: string): Batter => ({
  id, name: id, bats: 'R', position: 'CF', ratings: R,
  stats: { pa: 0, h: 0, double: 0, triple: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0 },
  age: 27, potential: 70, salary: 1, retired: false,
});
const runner = (id: string): Runner => ({ batter: bat(id), pitcherId: 'p' });
const pLine = (): PitchingLine => ({
  id: 'p', name: 'P', outs: 0, bf: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, hr: 0, dec: null, enteredDiff: 0,
});

/** Rng che restituisce booleani prefissati da `chance` (ignora p); il resto neutro. */
function seqRng(chances: boolean[]): Rng {
  let i = 0;
  return {
    next: () => 0.5,
    int: (min) => min,
    chance: () => chances[i++] ?? false,
    gauss: (mean) => mean,
    pick: (arr) => arr[0],
  };
}

// Sequenza chance() nel percorso rimbalzo→errore: [ground?, error?, extra?].
const GROUND_ERR = (extra: boolean) => seqRng([true, true, extra]);

describe('dinamica dell errore su palla in gioco', () => {
  it('errore semplice (bobble): battitore in 1ª, corridori +1, il 3ª segna', () => {
    const bases = [runner('R1'), null, runner('R3')]; // 1ª e 3ª occupate
    const scored: string[] = [];
    const res = resolveInPlayOut(
      runner('B'), bases, 0, GROUND_ERR(false),
      (r) => { if (r) scored.push(r.batter.id); },
      newBattingLine(bat('B')), pLine(), false, false, false, { infield: 0, outfield: 0 },
    );
    expect(res.error).toBe(true);
    expect(res.errorExtra).toBe(false);
    expect(bases[0]?.batter.id).toBe('B'); // battitore in prima
    expect(bases[1]?.batter.id).toBe('R1'); // 1ª → 2ª
    expect(bases[2]).toBeNull(); // 3ª ha segnato, nessuno la occupa
    expect(scored).toEqual(['R3']);
  });

  it('errore extra (lancio sbagliato): battitore in 2ª, corridori +2, 1ª→3ª', () => {
    const bases = [runner('R1'), null, runner('R3')];
    const scored: string[] = [];
    const res = resolveInPlayOut(
      runner('B'), bases, 0, GROUND_ERR(true),
      (r) => { if (r) scored.push(r.batter.id); },
      newBattingLine(bat('B')), pLine(), false, false, false, { infield: 0, outfield: 0 },
    );
    expect(res.error).toBe(true);
    expect(res.errorExtra).toBe(true);
    expect(bases[0]).toBeNull();
    expect(bases[1]?.batter.id).toBe('B'); // battitore fino in seconda
    expect(bases[2]?.batter.id).toBe('R1'); // 1ª → 3ª (avanza di 2)
    expect(scored).toEqual(['R3']); // il 3ª segna
  });

  it('il punto su errore è UNEARNED (reachedViaError sul corridore che segna)', () => {
    const bases = [null, null, runner('R3')];
    const scoredRunners: Runner[] = [];
    resolveInPlayOut(
      runner('B'), bases, 0, GROUND_ERR(false),
      (r) => { if (r) scoredRunners.push(r); },
      newBattingLine(bat('B')), pLine(), false, false, false, { infield: 0, outfield: 0 },
    );
    expect(scoredRunners[0]?.reachedViaError).toBe(true); // il 3ª segna per l'errore → unearned
    expect(bases[0]?.reachedViaError).toBe(true); // e anche il battitore è reached-on-error
  });

  it('senza defSig non tira mai l errore (test invariati)', () => {
    const bases = [runner('R1'), null, null];
    const res = resolveInPlayOut(
      runner('B'), bases, 0, seqRng([true]), // ground, ma niente ramo errore
      () => {},
      newBattingLine(bat('B')), pLine(), false, false, false, undefined,
    );
    expect(res.error).toBeFalsy();
  });
});
