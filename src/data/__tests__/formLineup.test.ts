import { describe, it, expect } from 'vitest';
import { generateMatchup } from '../generator';
import { autoLineup } from '../../engine/lineup';
import { formLineup, withFormLineup } from '../formLineup';
import { emptyBat, type SeasonBat } from '../season';

// Linea in-season sintetica scalata su `g` partite (~4 AB/partita).
function line(g: number, over: Partial<SeasonBat>): SeasonBat {
  return { ...emptyBat(), g, ab: g * 4, ...over };
}

describe('formLineup', () => {
  const { away } = generateMatchup(2024);
  const batters = away.lineup;

  it('senza dati (o sotto 30 partite) è identico ad autoLineup (no-op)', () => {
    expect(formLineup(batters, {}).map((b) => b.id)).toEqual(autoLineup(batters).map((b) => b.id));
    // 25 partite < soglia 30 → ancora no-op anche con numeri estremi.
    const early: Record<string, SeasonBat> = {};
    for (const b of batters) early[b.id] = line(25, { h: 60, hr: 20, bb: 30 });
    expect(formLineup(batters, early).map((b) => b.id)).toEqual(autoLineup(batters).map((b) => b.id));
  });

  it('con campione pieno la forma sposta l’ordine (crisi scende, exploit sale)', () => {
    const base = autoLineup(batters);
    const cleanup = base[3]; // il n.4 per rating (potenza)
    const seventh = base[6]; // un fondo-ordine per rating
    const stats: Record<string, SeasonBat> = {};
    for (const b of batters) stats[b.id] = line(120, { h: 120, double: 24, hr: 12, bb: 45 }); // media di squadra
    // Il cleanup crolla (60 partite piene, .130 senza potenza) → deve scendere.
    stats[cleanup.id] = line(120, { h: 62, double: 5, hr: 1, bb: 15 });
    // Il n.7 esplode (elite in ogni voce) → deve salire.
    stats[seventh.id] = line(120, { h: 165, double: 35, hr: 34, bb: 80 });
    const posOf = (arr: typeof base, id: string) => arr.findIndex((b) => b.id === id);
    const formed = formLineup(batters, stats);
    expect(posOf(formed, cleanup.id)).toBeGreaterThan(posOf(base, cleanup.id)); // sceso
    expect(posOf(formed, seventh.id)).toBeLessThan(posOf(base, seventh.id)); // salito
  });

  it('withFormLineup non muta la squadra né le doti originali', () => {
    const stats: Record<string, SeasonBat> = {};
    for (const b of batters) stats[b.id] = line(120, { h: 165, hr: 34, bb: 80 });
    const snapshotIds = away.lineup.map((b) => b.id);
    const snapshotContact = away.lineup.map((b) => b.ratings.contact);
    const out = withFormLineup(away, stats);
    expect(out).not.toBe(away);
    expect(away.lineup.map((b) => b.id)).toEqual(snapshotIds); // input intatto
    expect(away.lineup.map((b) => b.ratings.contact)).toEqual(snapshotContact); // doti intatte
    expect(out.lineup).toHaveLength(away.lineup.length);
  });
});
