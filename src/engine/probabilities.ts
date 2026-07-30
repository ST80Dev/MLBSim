import type { BatterStats, PaRates, PitcherStats } from './types';
import { LEAGUE, LEAGUE_HIT_SPLIT, TUNING } from './constants';
import { PA_EVENT_KEYS } from './types';
import { clamp } from './rng';

/** Ricava i rate per-PA dalle statistiche grezze di un battitore. */
export function batterRates(s: BatterStats): PaRates {
  const pa = Math.max(1, s.pa);
  const single = Math.max(0, s.h - s.double - s.triple - s.hr);
  const r: PaRates = {
    bb: s.bb / pa,
    hbp: s.hbp / pa,
    so: s.so / pa,
    hr: s.hr / pa,
    triple: s.triple / pa,
    double: s.double / pa,
    single: single / pa,
    outInPlay: 0,
  };
  return withRemainder(r);
}

/**
 * Ricava i rate per-PA dei valori CONCESSI da un lanciatore.
 * Le hit non-HR concesse vengono ripartite in 1B/2B/3B con le proporzioni
 * di lega (il modello del lanciatore non traccia i tipi di hit).
 */
export function pitcherRates(s: PitcherStats): PaRates {
  const bf = Math.max(1, s.bf);
  const nonHrHits = Math.max(0, s.h - s.hr);
  const r: PaRates = {
    bb: s.bb / bf,
    hbp: s.hbp / bf,
    so: s.so / bf,
    hr: s.hr / bf,
    triple: (nonHrHits * LEAGUE_HIT_SPLIT.triple) / LEAGUE_HIT_SPLIT.sum / bf,
    double: (nonHrHits * LEAGUE_HIT_SPLIT.double) / LEAGUE_HIT_SPLIT.sum / bf,
    single: (nonHrHits * LEAGUE_HIT_SPLIT.single) / LEAGUE_HIT_SPLIT.sum / bf,
    outInPlay: 0,
  };
  return withRemainder(r);
}

function withRemainder(r: PaRates): PaRates {
  const sum =
    r.bb + r.hbp + r.so + r.hr + r.triple + r.double + r.single;
  r.outInPlay = Math.max(0, 1 - sum);
  return r;
}

export interface MatchupContext {
  /** true se il battitore ha il vantaggio di platoon (mano opposta al lanciatore). */
  platoonAdvantage: boolean;
  /** true se il battitore e' in svantaggio di platoon (stessa mano). */
  platoonDisadvantage: boolean;
  /** Fattore di affaticamento del lanciatore (>=1 quando stanco). */
  fatigue: number;
  /**
   * Difesa dietro il lanciatore, in sigma: `(defRating - neutral) / 10`. >0 =
   * reparto sopra la media (piu' hit su palla in gioco diventano out), <0 =
   * difesa scarsa (piu' buchi). Assente/0 = neutro (nessuno spostamento). Tocca
   * solo le palle in gioco: mai HR/BB/HBP/SO. Vedi `TUNING.defense`.
   */
  fieldingSigma?: number;
  /**
   * Difesa ESTERNA in sigma: `(ofRating - neutral) / 10`. >0 = esterni con range
   * sopra la media → soppressione AGGIUNTIVA di doppi/tripli (oltre a quella
   * uniforme di `fieldingSigma`). Assente/0 = neutro. Vedi `TUNING.extraBaseDefense`.
   */
  outfieldSigma?: number;
}

/**
 * Combina i rate del battitore e del lanciatore col metodo odds-ratio (Log5):
 * per ogni esito, rate_combinato = rate_batt * rate_lanc / rate_lega.
 * Questo scala la media di lega in base a quanto entrambi deviano da essa.
 * Poi applica platoon e affaticamento e normalizza a somma 1.
 */
export function combineRates(
  batter: PaRates,
  pitcher: PaRates,
  ctx: MatchupContext,
): PaRates {
  const out = {} as PaRates;

  for (const key of PA_EVENT_KEYS) {
    const l = LEAGUE[key];
    if (l <= 0) {
      out[key] = 0;
      continue;
    }
    let v = (batter[key] * pitcher[key]) / l;

    // Affaticamento: il lanciatore stanco concede di piu' e strike-outa di meno.
    if (key === 'so') {
      v /= ctx.fatigue;
    } else if (key !== 'bb' && key !== 'hbp') {
      v *= ctx.fatigue;
    } else {
      v *= 1 + (ctx.fatigue - 1) * 0.5;
    }

    // Platoon: sposta le hit, non i BB/K.
    if (key === 'single' || key === 'double' || key === 'triple' || key === 'hr') {
      if (ctx.platoonAdvantage) v *= TUNING.platoonHitBonus;
      else if (ctx.platoonDisadvantage) v *= TUNING.platoonHitPenalty;
    }

    out[key] = Math.max(0, v);
  }

  // Normalizza: se gli esiti "positivi" superano una soglia, li comprime,
  // altrimenti il resto va negli out su palla in gioco.
  let sum =
    out.bb + out.hbp + out.so + out.hr + out.triple + out.double + out.single;
  const cap = 0.97;
  if (sum > cap) {
    const scale = cap / sum;
    for (const key of PA_EVENT_KEYS) out[key] *= scale;
    sum = cap;
  }
  out.outInPlay = clamp(1 - sum, 0.03, 1);

  // Difesa dietro il lanciatore (scollegatore ERA↔talento): sposta massa fra le
  // hit su palla in gioco (1B/2B/3B) e gli out su palla in gioco, conservando la
  // somma. HR/BB/HBP/SO restano intatti (principio DIPS). Neutro (0) = no-op.
  const d = ctx.fieldingSigma ?? 0;
  if (d !== 0) {
    const T = TUNING.defense;
    const f = clamp(1 - d * T.perSigma, T.min, T.max);
    const bipHits = out.single + out.double + out.triple;
    const delta = bipHits * (1 - f); // >0 con buona difesa: hit -> out
    out.single *= f;
    out.double *= f;
    out.triple *= f;
    out.outInPlay = clamp(out.outInPlay + delta, 0.01, 1);
  }

  // Soppressione EXTRABASE degli esterni (layer differenziale, neutro = no-op):
  // gli esterni con range tolgono doppi/tripli oltre il modello base. La massa
  // sottratta va sugli out su palla in gioco (somma conservata; TTO intatti).
  const of = ctx.outfieldSigma ?? 0;
  if (of !== 0) {
    const X = TUNING.extraBaseDefense;
    const g = clamp(1 - of * X.perSigma, X.min, X.max);
    const xbHits = out.double + out.triple;
    const delta = xbHits * (1 - g); // >0 con buoni esterni: extrabase -> out
    out.double *= g;
    out.triple *= g;
    out.outInPlay = clamp(out.outInPlay + delta, 0.01, 1);
  }
  return out;
}
