import { describe, it, expect } from 'vitest';
import {
  teamPayroll,
  capReport,
  capZone,
  outerWall,
  GENERATED_MODE,
  HISTORICAL_MODE,
  type LeagueMode,
} from '../leagueMode';
import { importHistoricalTeam } from '../historical/import';
import { SEASON_1999 } from '../historical/season1999';

describe('leagueMode / salary cap', () => {
  const bos = importHistoricalTeam(SEASON_1999[1]).team;

  it('teamPayroll somma gli stipendi ed e\' positivo', () => {
    const payroll = teamPayroll(bos);
    expect(payroll).toBeGreaterThan(0);
    // Coincide con la somma diretta di TUTTI i giocatori (attivi + profondità).
    const manual = [
      ...bos.lineup,
      ...bos.bench,
      ...bos.rotation,
      ...bos.bullpen,
      ...bos.reserveBatters,
      ...bos.reservePitchers,
    ].reduce((s, p) => s + p.salary, 0);
    expect(payroll).toBeCloseTo(Math.round(manual * 10) / 10, 1);
  });

  it('cap RIGIDO: rosa oltre il tetto NON e\' consentita', () => {
    const payroll = teamPayroll(bos);
    const tight: LeagueMode = { source: 'generated', cap: { mode: 'hard', amount: payroll - 10 } };
    const rep = capReport(bos, tight);
    expect(rep.over).toBeCloseTo(10, 1);
    expect(rep.allowed).toBe(false);
  });

  it('cap MORBIDO: la stessa rosa sfora ma e\' consentita (import storico)', () => {
    const payroll = teamPayroll(bos);
    const soft: LeagueMode = { source: 'historical', cap: { mode: 'soft', amount: payroll - 10 } };
    const rep = capReport(bos, soft);
    expect(rep.over).toBeCloseTo(10, 1);
    expect(rep.allowed).toBe(true);
  });

  it('cap OFF: nessuno sforamento, sempre consentito', () => {
    const off: LeagueMode = { source: 'historical', cap: { mode: 'off', amount: 1 } };
    const rep = capReport(bos, off);
    expect(rep.over).toBe(0);
    expect(rep.allowed).toBe(true);
  });

  it('le costanti riflettono la decisione di design (cap a due confini)', () => {
    // Modello rivisto: la lega generata ha un cap BASE soft (norma) + muro
    // esterno, non piu' un cap rigido unico. Vedi docs/franchise.md § Salary cap.
    expect(GENERATED_MODE.cap.mode).toBe('soft');
    expect(HISTORICAL_MODE.cap.mode).toBe('soft');
  });

  it('capZone: under / tax / over rispetto al muro esterno', () => {
    const base = GENERATED_MODE.cap.amount;
    const wall = outerWall(base);
    expect(capZone(base - 1, GENERATED_MODE)).toBe('under');
    expect(capZone(base + 1, GENERATED_MODE)).toBe('tax');
    expect(capZone(wall + 1, GENERATED_MODE)).toBe('over');
    // Cap off: sempre under.
    const off: LeagueMode = { source: 'historical', cap: { mode: 'off', amount: 1 } };
    expect(capZone(9999, off)).toBe('under');
  });
});
