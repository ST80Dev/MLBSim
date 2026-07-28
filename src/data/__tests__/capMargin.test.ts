import { describe, it, expect } from 'vitest';
import {
  capOverageMargin,
  effectiveCap,
  overEffectiveCap,
  outerWall,
  EPS_MIN,
  EPS_MAX,
  CAP_OVERAGE,
  DEFAULT_CAP_AMOUNT,
  GENERATED_MODE,
  type LeagueMode,
} from '../leagueMode';
import { generateLeague } from '../league';

const SEED = 20260728;
const IDS = generateLeague(SEED).map((t) => t.id); // 30 teamId reali
const OFF: LeagueMode = { source: 'historical', cap: { mode: 'off', amount: 1 } };

describe('capOverageMargin (ε seedato)', () => {
  it('resta sempre entro [EPS_MIN, EPS_MAX] su molte squadre/anni', () => {
    for (const id of IDS) {
      for (let y = 0; y < 40; y++) {
        const eps = capOverageMargin(SEED, id, y);
        expect(eps).toBeGreaterThanOrEqual(EPS_MIN);
        expect(eps).toBeLessThanOrEqual(EPS_MAX);
      }
    }
  });

  it('EPS_MAX coincide con CAP_OVERAGE (il tetto effettivo non supera il muro)', () => {
    expect(EPS_MAX).toBe(CAP_OVERAGE);
  });

  it('e deterministico: stessi (seed, teamId, anno) → stesso ε', () => {
    expect(capOverageMargin(SEED, IDS[0], 3)).toBe(capOverageMargin(SEED, IDS[0], 3));
    expect(capOverageMargin(SEED + 1, IDS[0], 3)).not.toBe(capOverageMargin(SEED, IDS[0], 3));
  });

  it('componente TRANSITORIA: per una squadra ε varia negli anni', () => {
    const vals = new Set<number>();
    for (let y = 0; y < 12; y++) vals.add(capOverageMargin(SEED, IDS[0], y));
    expect(vals.size).toBeGreaterThan(3);
  });

  it('varia anche tra squadre nello stesso anno', () => {
    const vals = new Set(IDS.map((id) => capOverageMargin(SEED, id, 5)));
    expect(vals.size).toBeGreaterThan(5);
  });

  it('componente PERSISTENTE: la media pluriennale mantiene un divario di identita tra squadre', () => {
    // Mediando su tanti anni il rumore transitorio si annulla; resta l'accenno di
    // identita' grande/piccolo mercato (la componente persistente).
    const YEARS = 200;
    const means = IDS.map((id) => {
      let s = 0;
      for (let y = 0; y < YEARS; y++) s += capOverageMargin(SEED, id, y);
      return s / YEARS;
    });
    const spread = Math.max(...means) - Math.min(...means);
    expect(spread).toBeGreaterThan(0.02); // esiste identita' di franchigia...
    expect(spread).toBeLessThan(EPS_MAX - EPS_MIN); // ...ma piccola (colore, non destino)
  });
});

describe('effectiveCap / overEffectiveCap', () => {
  it('sta nella banda [base×(1+EPS_MIN), muro esterno] e vale base×(1+ε)', () => {
    const base = DEFAULT_CAP_AMOUNT;
    const wall = outerWall(base);
    for (const id of IDS) {
      const cap = effectiveCap(GENERATED_MODE, SEED, id, 7);
      expect(cap).toBeGreaterThanOrEqual(Math.round(base * (1 + EPS_MIN) * 10) / 10 - 0.05);
      expect(cap).toBeLessThanOrEqual(wall + 0.05);
      const eps = capOverageMargin(SEED, id, 7);
      expect(cap).toBe(Math.round(base * (1 + eps) * 10) / 10);
    }
  });

  it('cap OFF → tetto infinito, nessuno sforamento', () => {
    expect(effectiveCap(OFF, SEED, IDS[0], 1)).toBe(Infinity);
    expect(overEffectiveCap(9999, OFF, SEED, IDS[0], 1)).toBe(0);
  });

  it('overEffectiveCap: 0 sotto il tetto, positivo (= eccedenza) sopra', () => {
    const id = IDS[0];
    const cap = effectiveCap(GENERATED_MODE, SEED, id, 2);
    expect(overEffectiveCap(cap - 20, GENERATED_MODE, SEED, id, 2)).toBe(0);
    expect(overEffectiveCap(cap + 15, GENERATED_MODE, SEED, id, 2)).toBeCloseTo(15, 1);
  });
});
