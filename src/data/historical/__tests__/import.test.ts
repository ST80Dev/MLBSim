import { describe, it, expect } from 'vitest';
import { importHistoricalTeam } from '../import';
import { SEASON_1999 } from '../season1999';
import { SAMPLE_CLE_1999, SAMPLE_BOS_1999 } from './fixtures';
import { simulateGame } from '../../../engine/game';
import { batterOverall } from '../../../engine/ratings';
import { FRANCHISES } from '../../franchises';

// Property test dell'IMPORTATORE su fixture curate (dati noti e stabili).
describe('importHistoricalTeam (fixture CLE/BOS 1999)', () => {
  const cle = importHistoricalTeam(SAMPLE_CLE_1999);
  const bos = importHistoricalTeam(SAMPLE_BOS_1999);

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
    expect(cb.get('Manny Ramirez')!.ratings.power).toBeGreaterThanOrEqual(90);
    // Omar Vizquel: contatto/velocita' alti, potenza scarsa.
    expect(cb.get('Omar Vizquel')!.ratings.power).toBeLessThanOrEqual(55);
    expect(cb.get('Omar Vizquel')!.ratings.speed).toBeGreaterThanOrEqual(85);
    // Darren Lewis: potenza da fondo scala.
    expect(bb.get('Darren Lewis')!.ratings.power).toBeLessThanOrEqual(50);

    // Pedro Martinez: dominio da asso, controllo alto.
    const pedro = bos.team.rotation.find((p) => p.name === 'Pedro Martinez')!;
    expect(pedro.ratings.stuff).toBeGreaterThanOrEqual(92);
    expect(pedro.ratings.control).toBeGreaterThanOrEqual(85);
  });

  it('assegna un potenziale STIMATO (headroom), non appiattito sull\'attuale', () => {
    // Almeno un giovane importato deve avere potenziale > overall (crescita
    // possibile). NON e' il picco reale futuro: e' una stima eta'-scalata.
    const anyHeadroom = bos.team.lineup.some(
      (b) => b.age < 27 && b.potential > batterOverall(b.ratings),
    );
    expect(anyHeadroom).toBe(true);
    // Il potenziale non scende mai sotto l'overall attuale.
    for (const b of bos.team.lineup) {
      expect(b.potential).toBeGreaterThanOrEqual(batterOverall(b.ratings));
    }
  });

  it('l\'import e\' riproducibile (stessi potenziali a parita\' di seed)', () => {
    const a = importHistoricalTeam(SAMPLE_BOS_1999);
    const b = importHistoricalTeam(SAMPLE_BOS_1999);
    const pa = a.team.lineup.map((x) => x.potential);
    const pb = b.team.lineup.map((x) => x.potential);
    expect(pa).toEqual(pb);
    // Seed diverso -> potenziali (in genere) diversi.
    const c = importHistoricalTeam(SAMPLE_BOS_1999, 999);
    const pc = c.team.lineup.map((x) => x.potential);
    expect(pc).not.toEqual(pa);
  });

  it('le squadre importate si simulano in modo deterministico', () => {
    const a = simulateGame(cle.team, bos.team, 42);
    const b = simulateGame(cle.team, bos.team, 42);
    expect(a.final).toEqual(b.final);
    expect(a.winner === 'away' || a.winner === 'home').toBe(true);
  });

  it('importa anche panca e riserve quando presenti', () => {
    const withBench: typeof SAMPLE_CLE_1999 = {
      ...SAMPLE_CLE_1999,
      bench: [SAMPLE_CLE_1999.batters[0]],
      reservePitchers: [SAMPLE_CLE_1999.pitchers[0]],
    };
    const t = importHistoricalTeam(withBench).team;
    expect(t.bench).toHaveLength(1);
    expect(t.reservePitchers).toHaveLength(1);
    // Gli id restano unici tra i gruppi.
    const ids = [...t.lineup, ...t.bench].map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// Dataset REALE generato dalla pipeline Lahman: copertura completa della lega.
describe('SEASON_1999 (dataset Lahman, 30 squadre)', () => {
  it('copre tutte e 30 le franchigie, una per franchigia', () => {
    expect(SEASON_1999).toHaveLength(30);
    const ids = SEASON_1999.map((t) => t.franchiseId);
    expect(new Set(ids).size).toBe(30);
    for (const id of ids) {
      expect(FRANCHISES.some((f) => f.id === id)).toBe(true);
    }
  });

  it('ogni squadra costruisce un roster valido per il motore', () => {
    for (const h of SEASON_1999) {
      const { team } = importHistoricalTeam(h);
      expect(team.lineup, `${h.franchiseId} lineup`).toHaveLength(9);
      expect(team.rotation.length, `${h.franchiseId} rotation`).toBeGreaterThanOrEqual(3);
      expect(team.bullpen.length, `${h.franchiseId} bullpen`).toBeGreaterThanOrEqual(1);
      // Ogni casella difensiva del lineup è coperta una sola volta.
      const positions = team.lineup.map((b) => b.position);
      expect(new Set(positions).size, `${h.franchiseId} posizioni`).toBe(9);
    }
  });

  it('preserva le fasce reali anche nel dataset generato', () => {
    const cle = importHistoricalTeam(SEASON_1999.find((t) => t.franchiseId === 'CLE')!);
    const manny = cle.team.lineup.find((b) => b.name === 'Manny Ramirez');
    expect(manny, 'Manny presente in CLE 1999').toBeTruthy();
    expect(manny!.ratings.power).toBeGreaterThanOrEqual(88);

    const bos = importHistoricalTeam(SEASON_1999.find((t) => t.franchiseId === 'BOS')!);
    const pedro = [...bos.team.rotation, ...bos.team.bullpen].find(
      (p) => p.name === 'Pedro Martinez',
    );
    expect(pedro, 'Pedro presente in BOS 1999').toBeTruthy();
    expect(pedro!.ratings.stuff).toBeGreaterThanOrEqual(90);
  });

  it('una lega di squadre storiche si simula in modo deterministico', () => {
    const a = importHistoricalTeam(SEASON_1999[0]).team;
    const b = importHistoricalTeam(SEASON_1999[1]).team;
    expect(simulateGame(a, b, 7).final).toEqual(simulateGame(a, b, 7).final);
  });
});
