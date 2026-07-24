import type { Batter, Pitcher } from './types';
import {
  deriveBatterStats,
  derivePitcherStats,
  deriveStamina,
  batterOverall,
  pitcherOverall,
  salaryFromOverall,
  clampRating,
} from './ratings';
import type { Rng } from './rng';

/**
 * Variazione stagionale di una singola dote.
 *  - < 27 anni: cresce verso il potenziale (piu' in fretta da giovanissimi)
 *  - 27-30: stabile
 *  - > 30: cala; le doti FISICHE calano piu' in fretta delle TECNICHE
 */
function seasonDelta(
  age: number,
  overallGap: number,
  physical: boolean,
  rng: Rng,
): number {
  if (age < 27) {
    const rate = age < 23 ? 0.4 : 0.22;
    return Math.max(0, overallGap * rate) + rng.gauss(0, 0.8);
  }
  if (age <= 30) return rng.gauss(0, 0.8);
  const factor = physical ? 0.75 : 0.35;
  return -((age - 30) * factor) + rng.gauss(0, 0.8);
}

/** Fa avanzare un battitore di una stagione (muta le doti, ri-deriva le stat). */
export function advanceSeasonBatter(b: Batter, rng: Rng): Batter {
  const gap = b.potential - batterOverall(b.ratings);
  const d = (physical: boolean) => seasonDelta(b.age + 1, gap, physical, rng);
  b.ratings = {
    contact: clampRating(b.ratings.contact + d(false)),
    power: clampRating(b.ratings.power + d(true)),
    eye: clampRating(b.ratings.eye + d(false)),
    speed: clampRating(b.ratings.speed + d(true)),
    fielding: clampRating(b.ratings.fielding + d(false)),
    arm: clampRating(b.ratings.arm + d(true)),
  };
  b.age += 1;
  b.stats = deriveBatterStats(b.ratings);
  const ovr = batterOverall(b.ratings);
  b.salary = salaryFromOverall(ovr);
  if (b.age >= 40 || (b.age >= 34 && ovr < 34)) b.retired = true;
  return b;
}

/** Fa avanzare un lanciatore di una stagione. */
export function advanceSeasonPitcher(p: Pitcher, rng: Rng): Pitcher {
  const gap = p.potential - pitcherOverall(p.ratings);
  const d = (physical: boolean) => seasonDelta(p.age + 1, gap, physical, rng);
  p.ratings = {
    stuff: clampRating(p.ratings.stuff + d(true)),
    control: clampRating(p.ratings.control + d(false)),
    movement: clampRating(p.ratings.movement + d(false)),
    groundball: clampRating(p.ratings.groundball + d(false)),
    stamina: clampRating(p.ratings.stamina + d(true)),
    fielding: clampRating(p.ratings.fielding + d(false)),
  };
  p.age += 1;
  p.stats = derivePitcherStats(p.ratings);
  p.stamina = deriveStamina(p.ratings.stamina, p.role);
  const ovr = pitcherOverall(p.ratings);
  p.salary = salaryFromOverall(ovr);
  if (p.age >= 42 || (p.age >= 35 && ovr < 34)) p.retired = true;
  return p;
}
