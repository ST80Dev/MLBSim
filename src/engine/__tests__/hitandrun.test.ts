import { describe, it, expect } from 'vitest';
import { generateMatchup } from '../../data/generator';
import { createLiveGame, hitAndRun, offenseSide, situation } from '../game';
import type { LiveGame } from '../game';

function putRunnerFirst(live: LiveGame): void {
  const off = offenseSide(live);
  const b = off.team.lineup[3];
  const pid = situation(live).pitcher.id;
  (live.bases as unknown as unknown[])[0] = { batter: b, pitcherId: pid };
}

/** Distribuzione degli esiti dell'hit-and-run su N prove (corridore in 1ª, 0 out). */
function measure(N: number): { singleRate: number; hitRate: number; outAdvanceRate: number } {
  let single = 0, hit = 0, outAdvance = 0, counted = 0;
  for (let s = 0; s < N; s++) {
    const { away, home } = generateMatchup(s);
    const live = createLiveGame(away, home, s * 13 + 1);
    putRunnerFirst(live);
    hitAndRun(live);
    const ev = live.play[live.play.length - 1];
    if (!ev) continue;
    counted++;
    if (ev.kind === 'single') single++;
    if (['single', 'double', 'triple', 'homerun'].includes(ev.kind)) hit++;
    if (ev.kind === 'inplayout' && !/salvo in prima/.test(ev.text)) outAdvance++;
  }
  return { singleRate: single / counted, hitRate: hit / counted, outAdvanceRate: outAdvance / counted };
}

describe('hit-and-run: il "buco aperto" produce valide', () => {
  it('il singolo è un esito frequente, non raro (~25%), non più solo out+avanzamento', () => {
    const { singleRate, hitRate, outAdvanceRate } = measure(4000);
    // Prima del "buco aperto" il singolo era ~13% e l'out+avanzamento ~52%.
    // Ora il buco (guidato dal contatto) alza le valide e abbassa gli out.
    expect(singleRate).toBeGreaterThan(0.19); // ben sopra il vecchio ~13%
    expect(singleRate).toBeLessThan(0.34); // ma non domina (resta una tattica rischiosa)
    expect(hitRate).toBeGreaterThan(0.26); // valide totali sensibilmente su
    expect(outAdvanceRate).toBeLessThan(0.48); // l'out+avanzamento non è più la (quasi) totalità
  });
});
