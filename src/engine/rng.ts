// Generatore di numeri casuali deterministico e seedabile (mulberry32).
// Deterministico = stesso seed -> stessa partita: fondamentale per i test,
// per il replay e per la riproducibilita' delle simulazioni.

export interface Rng {
  /** Prossimo float in [0, 1). */
  next(): number;
  /** Intero in [min, max] inclusi. */
  int(min: number, max: number): number;
  /** true con probabilita' p. */
  chance(p: number): boolean;
  /** Estrazione gaussiana (Box-Muller) con media e deviazione date. */
  gauss(mean: number, sd: number): number;
  /** Elemento casuale di un array. */
  pick<T>(arr: readonly T[]): T;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (p) => next() < p,
    gauss: (mean, sd) => {
      // Box-Muller; evita log(0).
      let u = 0;
      let v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      return mean + z * sd;
    },
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

export const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));
