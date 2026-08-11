import { describe, it, expect } from 'vitest';
import { generateMatchup, withRotationStarter, leagueRotationIndex } from '../generator';

/** Partente CPU aperto al giorno `day` con l'indice condiviso di lega. */
function leagueStarterId(team: ReturnType<typeof generateMatchup>['away'], day: number): string {
  return withRotationStarter(team, leagueRotationIndex(team, day)).rotation[0].id;
}

describe('rotazione CPU: coerente e senza doppie aperture ravvicinate', () => {
  it('in `len` giorni consecutivi ogni squadra apre con TUTTI i partenti una volta', () => {
    for (let s = 0; s < 60; s++) {
      const { away, home } = generateMatchup(s);
      for (const team of [away, home]) {
        const len = team.rotation.length;
        const starters = Array.from({ length: len }, (_, day) => leagueStarterId(team, day));
        expect(new Set(starters).size).toBe(len); // ciclo pieno, nessun doppione
      }
    }
  });

  it('nei primi 3 giorni nessun partente apre due volte (il bug segnalato)', () => {
    for (let s = 0; s < 60; s++) {
      const { away, home } = generateMatchup(s);
      for (const team of [away, home]) {
        const counts = new Map<string, number>();
        for (let day = 0; day < 3; day++) {
          const id = leagueStarterId(team, day);
          counts.set(id, (counts.get(id) ?? 0) + 1);
        }
        for (const c of counts.values()) expect(c).toBeLessThanOrEqual(1);
      }
    }
  });

  it('lo sfasamento distingue le squadre: non tutte aprono con lo stesso partente al giorno 0', () => {
    const ids = new Set<number>();
    for (let s = 0; s < 30; s++) {
      const { away } = generateMatchup(s);
      ids.add(leagueRotationIndex(away, 0) % away.rotation.length);
    }
    expect(ids.size).toBeGreaterThan(1); // fasi diverse tra squadre
  });
});
