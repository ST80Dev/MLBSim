import type { Batter, Pitcher, PaRates, RawEvent } from './types';
import { batterRates, pitcherRates, combineRates } from './probabilities';
import type { Rng } from './rng';
import { clamp } from './rng';
import { TUNING } from './constants';

/** Determina il fattore di affaticamento dato quanti battitori ha gia' affrontato. */
export function fatigueFactor(pitcher: Pitcher, battersFaced: number): number {
  const over = battersFaced - pitcher.stamina;
  if (over <= 0) return 1;
  return 1 + over * TUNING.fatiguePerBatter;
}

/** true se il battitore ha vantaggio di platoon contro questo lanciatore. */
export function platoonAdvantage(batter: Batter, pitcher: Pitcher): boolean {
  if (batter.bats === 'S') return true; // lo switch hitter sceglie il lato
  return batter.bats !== pitcher.throws;
}

/**
 * Risolve un turno di battuta in un esito grezzo, usando i rate combinati.
 * Non tocca lo stato di gioco: il game loop applica basi/eliminati.
 */
export function resolveAtBat(
  batter: Batter,
  pitcher: Pitcher,
  battersFaced: number,
  rng: Rng,
): { event: RawEvent; rates: PaRates } {
  const adv = platoonAdvantage(batter, pitcher);
  const rates = combineRates(batterRates(batter.stats), pitcherRates(pitcher.stats), {
    platoonAdvantage: adv,
    platoonDisadvantage: batter.bats !== 'S' && !adv,
    fatigue: clamp(fatigueFactor(pitcher, battersFaced), 1, 2.2),
  });

  const roll = rng.next();
  let acc = 0;
  const order: [number, RawEvent][] = [
    [rates.so, 'SO'],
    [rates.bb, 'BB'],
    [rates.hbp, 'HBP'],
    [rates.hr, 'HR'],
    [rates.triple, '3B'],
    [rates.double, '2B'],
    [rates.single, '1B'],
  ];
  for (const [p, ev] of order) {
    acc += p;
    if (roll < acc) return { event: ev, rates };
  }
  return { event: 'IPO', rates };
}
