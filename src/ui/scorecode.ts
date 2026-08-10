// Codifica "da segnapunti" (scorekeeping) di una giocata, per la cronaca.
// Trasforma UN PlayEvent (esito gia' calcolato dal motore) nel codice sintetico
// del taccuino — "6-4-3" (doppio gioco SS→2B→1B), "F7" (eliminato al volo LF),
// "K"/"ꓘ" (strikeout), "CS 2-6" (eliminato in rubata), ecc.
//
// NB: e' puramente PRESENTAZIONE, come `commentary.ts`. Il motore NON simula
// dove va la palla ne' quale difensore la gioca (la difesa non e' ancora
// simulata: vedi docs/ui.md). Percio' i ruoli coinvolti sono SINTETIZZATI in
// modo PLAUSIBILE e DETERMINISTICO (hash dell'evento) da tipo di out + dettaglio:
// non consuma RNG e non tocca la simulazione, cosi' lo stesso turno mostra
// sempre lo stesso codice. E' una notazione descrittiva, non un dato del motore.

import type { PlayEvent } from '../engine/game';
import { inPlayOutShape } from './commentary';

/** Nome italiano del ruolo per numero di segnapunti (1..9). */
const POS_NAME: Record<number, string> = {
  1: 'lanciatore',
  2: 'ricevitore',
  3: 'prima base',
  4: 'seconda base',
  5: 'terza base',
  6: 'interbase',
  7: 'esterno sinistro',
  8: 'esterno centro',
  9: 'esterno destro',
};

export interface ScoreCode {
  /** Codice sintetico del taccuino (es. "6-4-3", "F7", "K"). */
  code: string;
  /** Spiegazione in italiano (tooltip). */
  title: string;
}

/** Hash deterministico piccolo dell'evento (FNV-1a), stabile tra i render. */
function hashEvent(ev: PlayEvent): number {
  const s = `${ev.inning}|${ev.half}|${ev.kind}|${ev.batter ?? ''}|${ev.text}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Sotto-seme indipendente dallo stesso hash (per scelte multiple non correlate). */
function mix(seed: number, salt: number): number {
  return (Math.imul(seed ^ salt, 2654435761) >>> 0);
}

/** Scelta deterministica pesata da un seme. */
function wpick<T>(seed: number, opts: Array<[T, number]>): T {
  const total = opts.reduce((s, [, w]) => s + w, 0);
  let r = (seed % 100000) / 100000 * total;
  for (const [v, w] of opts) {
    if (r < w) return v;
    r -= w;
  }
  return opts[opts.length - 1][0];
}

/** Da una sequenza di ruoli al codice + spiegazione (assist → putout).
 *  Un solo ruolo = presa/eliminazione NON assistita ("3U"), `parts` vuoto. */
function seq(nums: number[]): { code: string; parts: string } {
  if (nums.length === 1) {
    const n = nums[0];
    return { code: `${n}U`, parts: `${POS_NAME[n]} (${n}), non assistito` };
  }
  return {
    code: nums.join('-'),
    parts: nums.map((n) => `${POS_NAME[n]} (${n})`).join(' → '),
  };
}

// Rimbalzi eliminati IN PRIMA (tutte le sequenze finiscono al 3 = prima base):
// coerenti col verdetto "out in prima" della telecronaca per `shape === 'ground'`.
const GROUND_TO_FIRST: Array<[number[], number]> = [
  [[6, 3], 26],
  [[4, 3], 24],
  [[5, 3], 20],
  [[1, 3], 12],
  [[3], 18], // 3U: prima base non assistito
];
// Prese comode ("presa comoda", shape === 'air'): pop d'interno (ruoli ≤6) o
// volata di routine d'esterno (≥7). Nessun rimbalzo: e' sempre una PRESA al volo.
const AIR_CATCH: Array<[number, number]> = [
  [6, 16],
  [4, 14],
  [5, 12],
  [3, 12],
  [2, 10],
  [8, 12],
  [7, 10],
  [9, 6],
];
const DOUBLE_PLAYS: Array<[number[], number]> = [
  [[6, 4, 3], 40],
  [[4, 6, 3], 28],
  [[5, 4, 3], 18],
  [[1, 6, 3], 8],
  [[3, 6, 3], 6],
];
// Eliminato in rubata: la giocata dipende dalla base rubata (tiro a 2ª vs a 3ª).
const CAUGHT_STEALING_2B: Array<[number[], number]> = [
  [[2, 4], 52], // ricevitore → 2B
  [[2, 6], 48], // ricevitore → SS
];
const CAUGHT_STEALING_3B: Array<[number[], number]> = [
  [[2, 5], 100], // ricevitore → 3B
];
const BUNT_OUTS: Array<[number[], number]> = [
  [[1, 3], 38],
  [[5, 3], 30],
  [[2, 3], 16],
  [[3], 16],
];
const OUTFIELD: Array<[number, number]> = [
  [7, 34],
  [8, 40],
  [9, 26],
];
// Errore difensivo: fielder che sbaglia (prevalentemente interni, come nella realtà).
const ERROR_FIELDERS: Array<[number, number]> = [
  [6, 26], // SS
  [5, 22], // 3B
  [4, 16], // 2B
  [3, 10], // 1B
  [7, 8], // LF
  [8, 8], // CF
  [9, 8], // RF
  [2, 2], // C
];
// Scelta difensiva: corridore dalla 2ª eliminato in 3ª (tiro alla terza = 5).
const FIELDER_CHOICE: Array<[number[], number]> = [
  [[6, 5], 34], // SS → 3B
  [[4, 5], 20], // 2B → 3B
  [[1, 5], 14], // P → 3B
  [[5], 18], // 3B non assistito
  [[3, 5], 14], // 1B → 3B
];

/**
 * Codice segnapunti di un evento, o `null` se non pertinente (cambi, note).
 * Deterministico per-evento.
 */
export function scoreCode(ev: PlayEvent): ScoreCode | null {
  const h = hashEvent(ev);

  switch (ev.kind) {
    case 'strikeout': {
      const looking = (h & 1) === 0;
      return {
        code: looking ? 'ꓘ' : 'K',
        title: looking ? 'strikeout guardando (terzo strike non giocato)' : 'strikeout in castigo',
      };
    }
    case 'homerun':
      return { code: 'HR', title: 'fuoricampo' };
    case 'triple':
      return { code: '3B', title: 'triplo' };
    case 'double':
      return { code: '2B', title: 'doppio' };
    case 'single':
      return { code: '1B', title: 'singolo' };
    case 'bunthit':
      return { code: '1Bᵇ', title: 'singolo su smorzata (bunt)' };
    case 'walk':
      return { code: 'BB', title: 'base su ball' };
    case 'ibb':
      return { code: 'IBB', title: 'base intenzionale' };
    case 'hbp':
      return { code: 'HBP', title: 'battitore colpito dal lancio' };
    case 'steal':
      return { code: 'SB', title: ev.base === 3 ? 'rubata della terza' : 'rubata della seconda' };
    case 'wildpitch':
      return { code: 'WP', title: 'lancio pazzo' };
    case 'passedball':
      return { code: 'PB', title: 'palla passata' };
    case 'balk':
      return { code: 'BK', title: 'balk' };
    case 'sacfly': {
      const of = wpick(mix(h, 1), OUTFIELD);
      return { code: `SF${of}`, title: `volata di sacrificio: presa dall'${POS_NAME[of]} (${of})` };
    }
    case 'sacbunt': {
      const s = seq(wpick(mix(h, 2), BUNT_OUTS));
      return { code: `SH ${s.code}`, title: `bunt di sacrificio: ${s.parts}` };
    }
    case 'gidp': {
      const s = seq(wpick(mix(h, 3), DOUBLE_PLAYS));
      return { code: `${s.code} DP`, title: `doppio gioco: ${s.parts}` };
    }
    case 'caughtstealing': {
      const table = ev.base === 3 ? CAUGHT_STEALING_3B : CAUGHT_STEALING_2B;
      const baseName = ev.base === 3 ? 'terza' : 'seconda';
      const s = seq(wpick(mix(h, 4), table));
      return { code: `CS ${s.code}`, title: `eliminato in rubata della ${baseName}: ${s.parts}` };
    }
    case 'buntout': {
      const s = seq(wpick(mix(h, 5), BUNT_OUTS));
      return { code: s.code, title: `eliminato su smorzata: ${s.parts}` };
    }
    case 'buntfc':
      return {
        code: 'FCᵇ',
        title: 'bunt, scelta difensiva: corridore di testa eliminato, battitore salvo in prima',
      };
    case 'inplayout': {
      // Scelta difensiva: out sul corridore (in 3ª), battitore salvo in prima.
      if (ev.outInfo?.fc) {
        const s = seq(wpick(mix(h, 11), FIELDER_CHOICE));
        return { code: `FC ${s.code}`, title: `scelta difensiva, corridore eliminato in terza: ${s.parts}` };
      }
      // La categoria (rimbalzo / volata / presa) viene dalla STESSA fonte della
      // telecronaca (motore → ev.outInfo), così codice e banner non si
      // contraddicono mai, nemmeno con gli avanzamenti reali dei corridori.
      const shape = inPlayOutShape(ev);
      if (shape === 'ground') {
        const s = seq(wpick(mix(h, 7), GROUND_TO_FIRST));
        return { code: s.code, title: `eliminato di rimbalzo, out in prima: ${s.parts}` };
      }
      if (shape === 'fly') {
        const of = wpick(mix(h, 8), OUTFIELD);
        return { code: `F${of}`, title: `eliminato al volo: ${POS_NAME[of]} (${of})` };
      }
      // 'air' = "presa comoda": pop d'interno o volata di routine d'esterno.
      const p = wpick(mix(h, 9), AIR_CATCH);
      const pop = p <= 6;
      return {
        code: `${pop ? 'P' : 'F'}${p}`,
        title: `${pop ? 'eliminato su cielo (pop-up)' : 'eliminato al volo'}: ${POS_NAME[p]} (${p})`,
      };
    }
    case 'error': {
      // Difensore COERENTE col tipo di battuta (verità del motore, `ev.outInfo`):
      // rimbalzo → interni, volata → esterni, pop → interni/ricevitore. Così il
      // badge non attribuisce un rimbalzo a un esterno.
      const ball = ev.outInfo?.ball;
      const extra = !!ev.outInfo?.errorExtra;
      const table: Array<[number, number]> =
        ball === 'fly'
          ? [[8, 40], [7, 30], [9, 30]]
          : ball === 'popup'
            ? [[3, 26], [5, 24], [4, 22], [6, 18], [2, 10]]
            : ball === 'ground'
              ? [[6, 30], [5, 24], [4, 22], [3, 12], [1, 12]]
              : ERROR_FIELDERS; // fallback: eventi vecchi senza forma
      const pos = wpick(mix(h, 12), table);
      const how = extra
        ? ball === 'fly'
          ? 'volata lasciata cadere'
          : 'errore di lancio'
        : ball === 'fly' || ball === 'popup'
          ? 'presa sbagliata'
          : 'rimbalzo sbagliato';
      return { code: `E${pos}`, title: `errore in difesa (${how}): ${POS_NAME[pos]} (${pos})` };
    }
    case 'sub':
    case 'other':
      return null;
  }
}
