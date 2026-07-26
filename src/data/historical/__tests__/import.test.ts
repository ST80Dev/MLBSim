import { describe, it, expect } from 'vitest';
import { importHistoricalTeam } from '../import';
import { SEASON_1999 } from '../season1999';
import { simulateGame } from '../../../engine/game';

describe('importHistoricalTeam (stagione 1999)', () => {
  const cle = importHistoricalTeam(SEASON_1999[0]);
  const bos = importHistoricalTeam(SEASON_1999[1]);

  it('costruisce squadre valide per il motore', () => {
    expect(cle.team.abbrev).toBe('CLE');
    expect(cle.team.lineup).toHaveLength(9);
    expect(cle.team.rotation.length).toBeGreaterThanOrEqual(1);
    expect(cle.team.bullpen.length).toBeGreaterThanOrEqual(1);
    // Ogni battitore ha stats ri-derivate coerenti (AB > 0).
    for (const b of cle.team.lineup) {
      expect(b.stats.pa).toBeGreaterThan(0);
      expect(b.stats.h).toBeGreaterThan(0);
    }
  });

  it('assegna rating coerenti con le fasce reali', () => {
    const byName = (t: typeof cle) =>
      new Map([...t.team.lineup].map((b) => [b.name, b]));
    const cb = byName(cle);
    const bb = byName(bos);

    // Manny Ramirez: potenza da campione.
    expect(cb.get('Manny Ramirez')!.ratings.power).toBeGreaterThanOrEqual(70);
    // Omar Vizquel: contatto/velocita' alti, potenza scarsa.
    expect(cb.get('Omar Vizquel')!.ratings.power).toBeLessThanOrEqual(35);
    expect(cb.get('Omar Vizquel')!.ratings.speed).toBeGreaterThanOrEqual(65);
    // Darren Lewis: potenza da fondo scala.
    expect(bb.get('Darren Lewis')!.ratings.power).toBeLessThanOrEqual(30);

    // Pedro Martinez: dominio da asso, controllo alto.
    const pedro = bos.team.rotation.find((p) => p.name === 'Pedro Martinez')!;
    expect(pedro.ratings.stuff).toBeGreaterThanOrEqual(72);
    expect(pedro.ratings.control).toBeGreaterThanOrEqual(65);
  });

  it('le squadre importate si simulano in modo deterministico', () => {
    const a = simulateGame(cle.team, bos.team, 42);
    const b = simulateGame(cle.team, bos.team, 42);
    expect(a.final).toEqual(b.final);
    expect(a.winner === 'away' || a.winner === 'home').toBe(true);
  });
});
