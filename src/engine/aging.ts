import type { Batter, Pitcher } from './types';
import {
  deriveBatterStats,
  derivePitcherStats,
  deriveStamina,
  batterOverall,
  pitcherOverall,
  salaryFor,
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

type DevKind = 'breakout' | 'bust' | 'collapse' | 'none';

/**
 * Coda rara di sviluppo, a livello di STAGIONE (non di singola dote): fa
 * DIVERGERE la carriera dalla media e dalla realta' storica, cosi' non sai in
 * anticipo chi sara' campione.
 *  - giovani (< 28): ~6% BREAKOUT (salto inatteso), ~7% BUST/stallo (il
 *    prospetto che non sboccia) -> il talento *tende* a emergere, ma non e' certo.
 *  - veterani (>= 31): ~8% CROLLO extra (infortunio/caduta improvvisa).
 * Ritorna lo `shift` UNIFORME applicato a tutte le doti dell'anno (0 = anno
 * ordinario, governato solo dalla curva d'eta') e il `kind` dell'evento, che
 * serve anche a muovere il TETTO (vedi `driftPotential`). L'ordine di consumo
 * RNG (un `next()`, poi un `gauss` solo nel ramo dell'evento) e' invariato
 * rispetto alla versione precedente.
 */
function developmentTail(age: number, rng: Rng): { shift: number; kind: DevKind } {
  const roll = rng.next();
  if (age < 28) {
    if (roll < 0.06) return { shift: rng.gauss(5, 1.5), kind: 'breakout' };
    if (roll < 0.13) return { shift: -rng.gauss(4, 1.5), kind: 'bust' };
  } else if (age >= 31) {
    if (roll < 0.08) return { shift: -rng.gauss(5, 2), kind: 'collapse' };
  }
  return { shift: 0, kind: 'none' };
}

/**
 * POTENZIALE DINAMICO: il tetto di crescita non e' piu' un verdetto scolpito
 * alla nascita, ma galleggia di anno in anno, cosi' il futuro resta aperto (non
 * lo si "legge" in anticipo dalla rosa). NON consuma RNG: il drift e' una
 * funzione DETERMINISTICA della coda gia' estratta + segnale di rendimento, per
 * non disturbare la calibrazione ne' lo stream degli avanzamenti.
 *  - **Breakout** -> il soffitto si alza (talento emerso oltre le attese).
 *  - **Bust / crollo** -> il soffitto sfuma (il prospetto che non sboccia).
 *  - **`perf`** (opzionale, default 0 = neutro): segnale di rendimento/utilizzo
 *    stagionale per l'aggancio futuro alle statistiche reali. `perf > 0` (sopra
 *    la media / molto impiegato) alza il tetto; `perf < 0` (sotto le attese o
 *    "non usato") lo abbassa verso l'overall — la meccanica "use it or lose it".
 *  - **Veterani (>= 31)**: erosione lenta verso l'overall, senza promesse
 *    stantie (niente tetti alti fantasma su chi ha gia' virato in discesa).
 * Vincolo: il tetto non scende MAI sotto l'overall corrente (un soffitto gia'
 * superato non ha senso) e resta nella scala 40-100.
 */
function driftPotential(
  potential: number,
  newOvr: number,
  age: number,
  tail: { shift: number; kind: DevKind },
  perf: number,
): number {
  let pot = potential;
  if (tail.kind !== 'none') pot += Math.round(tail.shift * 0.5); // breakout su, bust/crollo giu'
  pot += Math.round(Math.max(-2, Math.min(2, perf)) * 1.5); // rendimento/utilizzo (0 = neutro)
  if (age >= 31) {
    // Erosione veterani: il tetto converge verso l'overall (niente soffitti alti
    // fantasma su chi ha gia' virato in discesa), almeno un punto l'anno.
    pot = Math.max(newOvr, pot - Math.max(1, Math.round((pot - newOvr) * 0.34)));
  }
  return clampRating(Math.max(newOvr, pot));
}

/**
 * Fa avanzare un battitore di una stagione (muta le doti, ri-deriva le stat, fa
 * galleggiare il tetto). `perf` (default 0 = neutro) e' il segnale di
 * rendimento/utilizzo simmetrico tra squadra umana (box score reali) e CPU
 * (stagione proiettata), da alimentare quando esistera' l'offseason.
 */
export function advanceSeasonBatter(b: Batter, rng: Rng, perf = 0): Batter {
  const gap = b.potential - batterOverall(b.ratings);
  const tail = developmentTail(b.age + 1, rng);
  const d = (physical: boolean) => seasonDelta(b.age + 1, gap, physical, rng) + tail.shift;
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
  b.potential = driftPotential(b.potential, ovr, b.age, tail, perf);
  b.salary = salaryFor(ovr, b.age);
  if (b.age >= 40 || (b.age >= 34 && ovr < 34)) b.retired = true;
  return b;
}

/** Fa avanzare un lanciatore di una stagione (vedi `advanceSeasonBatter`). */
export function advanceSeasonPitcher(p: Pitcher, rng: Rng, perf = 0): Pitcher {
  const gap = p.potential - pitcherOverall(p.ratings);
  const tail = developmentTail(p.age + 1, rng);
  const d = (physical: boolean) => seasonDelta(p.age + 1, gap, physical, rng) + tail.shift;
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
  p.potential = driftPotential(p.potential, ovr, p.age, tail, perf);
  p.salary = salaryFor(ovr, p.age);
  if (p.age >= 42 || (p.age >= 35 && ovr < 34)) p.retired = true;
  return p;
}
