import { describe, it, expect } from 'vitest';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../projection';
import { generateLeague } from '../league';

const teams = generateLeague(2024);
const batter = teams[0].lineup[3]; // un titolare qualsiasi
const pitcher = teams[0].rotation[0]; // uno starter

describe('projectBatterSeason', () => {
  it('e deterministica a parita di seed/anno', () => {
    const a = projectBatterSeason(batter, 'starter', { seed: 7, year: 1, day: 80 });
    const b = projectBatterSeason(batter, 'starter', { seed: 7, year: 1, day: 80 });
    expect(a).toEqual(b);
  });

  it('a fine stagione riallinea esattamente al target annata (idempotente oltre total)', () => {
    const full = projectBatterSeason(batter, 'starter', { seed: 7, year: 1, day: SEASON_GAMES });
    const over = projectBatterSeason(batter, 'starter', { seed: 7, year: 1, day: SEASON_GAMES + 40 });
    expect(over).toEqual(full);
    // il target ha numeri sensati per un titolare
    expect(full.ab).toBeGreaterThan(400);
    expect(full.h).toBeLessThanOrEqual(full.ab);
  });

  it('i conteggi cumulati sono monotoni non decrescenti lungo la stagione', () => {
    let prev = projectBatterSeason(batter, 'starter', { seed: 3, year: 1, day: 0 });
    for (let d = 5; d <= SEASON_GAMES; d += 7) {
      const cur = projectBatterSeason(batter, 'starter', { seed: 3, year: 1, day: d });
      expect(cur.hr).toBeGreaterThanOrEqual(prev.hr);
      expect(cur.h).toBeGreaterThanOrEqual(prev.h);
      expect(cur.ab).toBeGreaterThanOrEqual(prev.ab);
      expect(cur.bb).toBeGreaterThanOrEqual(prev.bb);
      expect(cur.h).toBeLessThanOrEqual(cur.ab);
      prev = cur;
    }
  });

  it('mostra varianza stagione su stagione (anni diversi -> target diversi)', () => {
    const years = [1, 2, 3, 4, 5].map(
      (y) => projectBatterSeason(batter, 'starter', { seed: 7, year: y, day: SEASON_GAMES }).hr,
    );
    const spread = Math.max(...years) - Math.min(...years);
    expect(spread).toBeGreaterThan(0); // gli HR annata oscillano col profilo
  });

  it('giorno 0 = linea vuota', () => {
    const z = projectBatterSeason(batter, 'starter', { seed: 7, year: 1, day: 0 });
    expect(z.ab).toBe(0);
    expect(z.hr).toBe(0);
  });
});

describe('projectPitcherSeason', () => {
  it('riallinea al target a fine stagione e resta coerente (h>=hr, sv<=svo)', () => {
    const full = projectPitcherSeason(pitcher, { seed: 9, year: 1, day: SEASON_GAMES });
    const over = projectPitcherSeason(pitcher, { seed: 9, year: 1, day: SEASON_GAMES + 10 });
    expect(over).toEqual(full);
    expect(full.h).toBeGreaterThanOrEqual(full.hr);
    expect(full.sv).toBeLessThanOrEqual(full.svo);
    expect(full.outs).toBeGreaterThan(0);
  });

  it('i conteggi cumulati sono monotoni non decrescenti', () => {
    let prev = projectPitcherSeason(pitcher, { seed: 4, year: 1, day: 0 });
    for (let d = 5; d <= SEASON_GAMES; d += 9) {
      const cur = projectPitcherSeason(pitcher, { seed: 4, year: 1, day: d });
      expect(cur.outs).toBeGreaterThanOrEqual(prev.outs);
      expect(cur.so).toBeGreaterThanOrEqual(prev.so);
      expect(cur.er).toBeGreaterThanOrEqual(prev.er);
      expect(cur.h).toBeGreaterThanOrEqual(cur.hr);
      prev = cur;
    }
  });

  it('ERA (risultato) varia anno su anno indipendentemente dai rating', () => {
    const eras = [1, 2, 3, 4, 5].map((y) => {
      const s = projectPitcherSeason(pitcher, { seed: 9, year: y, day: SEASON_GAMES });
      return s.outs ? (s.er / (s.outs / 3)) * 9 : 0;
    });
    expect(Math.max(...eras) - Math.min(...eras)).toBeGreaterThan(0.2);
  });
});

// I legami tra le stat sono ALGEBRICI, non casuali: il modello alloca il budget
// PA/BF in esiti mutuamente esclusivi, quindi le identita' valgono per costruzione
// su TUTTE le annate proiettate (non solo in media).
describe('identita statistiche (nessun legame violato)', () => {
  const league = generateLeague(2024);
  it('battuta: H<=AB, H+SO<=AB (out in gioco>=0), H>=extrabase, AB>0', () => {
    for (const t of league) {
      const groups = [
        [t.lineup, 'starter'] as const,
        [t.bench, 'bench'] as const,
        [t.reserveBatters, 'reserve'] as const,
      ];
      for (const [list, tier] of groups)
        for (const b of list)
          for (const year of [1, 3, 7]) {
            const s = projectBatterSeason(b, tier, { seed: 2024, year, day: SEASON_GAMES });
            expect(s.h).toBeLessThanOrEqual(s.ab);
            expect(s.h + s.so).toBeLessThanOrEqual(s.ab); // gli out in gioco non sono negativi
            expect(s.h).toBeGreaterThanOrEqual(s.hr + s.double + s.triple); // singoli >= 0
            expect(s.hr).toBeGreaterThanOrEqual(0);
          }
    }
  });

  it('lancio: SO<=Outs, H>=HR, Outs>0', () => {
    for (const t of league)
      for (const p of [...t.rotation, ...t.bullpen])
        for (const year of [1, 3, 7]) {
          const s = projectPitcherSeason(p, { seed: 2024, year, day: SEASON_GAMES });
          expect(s.so).toBeLessThanOrEqual(s.outs); // non si strike-outa piu' degli out
          expect(s.h).toBeGreaterThanOrEqual(s.hr);
          expect(s.outs).toBeGreaterThan(0);
          expect(s.sv).toBeLessThanOrEqual(s.svo);
        }
  });

  it("a PA fissa, piu' media con meno HR implica piu' hit (legame inevitabile)", () => {
    // Stesso giocatore, stessa fascia: confronto due annate e verifico che quando
    // la media sale e gli HR calano, le hit NON possono diminuire.
    const b = league[0].lineup[2];
    const lines = [1, 2, 3, 4, 5, 6, 7, 8].map((y) => {
      const s = projectBatterSeason(b, 'starter', { seed: 2024, year: y, day: SEASON_GAMES });
      return { ba: s.h / s.ab, hr: s.hr, h: s.h, ab: s.ab };
    });
    for (const a of lines)
      for (const c of lines) {
        // a parita' ragionevole di AB (impiego simile), media piu' alta => piu' hit
        if (Math.abs(a.ab - c.ab) <= 3 && a.ba > c.ba) expect(a.h).toBeGreaterThanOrEqual(c.h);
      }
  });
});
