import { describe, it, expect } from 'vitest';
import { createLiveGame, autoManageDefense, type LiveGame } from '../game';
import { buildHistoricalLeague } from '../../data/historical/league';
import { generateMatchup } from '../../data/generator';
import type { Team } from '../types';

const histTeam = (abbrevs: string[]): Team => {
  const league = buildHistoricalLeague(2000);
  return league.find((t) => abbrevs.includes(t.abbrev))!;
};

/** Il lanciatore in pedana per la squadra di casa (difesa nel top). */
const homePitcher = (l: LiveGame) => l.homeSide.pitchers[l.homeSide.pitcherIdx];

/** Forza il partente di casa oltre la soglia di affaticamento. */
function gasHomeStarter(l: LiveGame): void {
  l.homeSide.battersFacedByCurrent = homePitcher(l).stamina + 10;
}

// --------------------------------------------------------------------------
describe('Ordine del bullpen', () => {
  it('storico: rilievi lunghi prima, closer per ULTIMO', () => {
    for (const abbr of [['LAA', 'ANA'], ['SEA'], ['NYY'], ['ATL']]) {
      const t = histTeam(abbr);
      const roles = t.bullpen.map((p) => p.role);
      const firstCloser = roles.indexOf('CL');
      // Nessun non-closer DOPO il primo closer: i CL stanno in fondo.
      if (firstCloser >= 0) {
        expect(roles.slice(firstCloser).every((r) => r === 'CL')).toBe(true);
      }
      // I non-closer sono ordinati per resistenza decrescente (rilievo lungo prima).
      const rp = t.bullpen.filter((p) => p.role !== 'CL');
      for (let i = 1; i < rp.length; i++) {
        expect(rp[i - 1].stamina).toBeGreaterThanOrEqual(rp[i].stamina);
      }
    }
  });

  it('generato: closer per ultimo', () => {
    for (let s = 0; s < 10; s++) {
      const { away } = generateMatchup(s);
      const roles = away.bullpen.map((p) => p.role);
      const firstCloser = roles.indexOf('CL');
      if (firstCloser >= 0) {
        expect(roles.slice(firstCloser).every((r) => r === 'CL')).toBe(true);
      }
    }
  });
});

// --------------------------------------------------------------------------
describe('Auto-manager: uso dei rilievi coerente con la situazione', () => {
  it('inning presto in svantaggio: entra un rilievo LUNGO, non il closer', () => {
    const l = createLiveGame(histTeam(['SEA']), histTeam(['LAA', 'ANA']), 1);
    l.inning = 3; // presto
    l.half = 'top'; // casa in difesa
    l.homeSide.runs = 0;
    l.awaySide.runs = 8; // goleada subita: NON è situazione da salvezza
    const relievers = l.homeSide.pitchers.slice(1);
    const maxSta = Math.max(...relievers.filter((p) => p.role !== 'CL').map((p) => p.stamina));
    gasHomeStarter(l);
    autoManageDefense(l);
    const now = homePitcher(l);
    expect(now.role).not.toBe('CL'); // niente closer al 3°
    expect(now.stamina).toBe(maxSta); // il rilievo più resistente (lungo)
  });

  it('9° inning con vantaggio risicato: entra il CLOSER', () => {
    const l = createLiveGame(histTeam(['SEA']), histTeam(['LAA', 'ANA']), 2);
    l.inning = 9;
    l.half = 'top';
    l.homeSide.runs = 5;
    l.awaySide.runs = 3; // vantaggio di 2: situazione da salvezza
    gasHomeStarter(l);
    autoManageDefense(l);
    expect(homePitcher(l).role).toBe('CL');
  });

  it('9° inning in goleada: NON spreca il closer', () => {
    const l = createLiveGame(histTeam(['SEA']), histTeam(['LAA', 'ANA']), 3);
    l.inning = 9;
    l.half = 'top';
    l.homeSide.runs = 12;
    l.awaySide.runs = 2; // +10: non è una salvezza
    gasHomeStarter(l);
    autoManageDefense(l);
    expect(homePitcher(l).role).not.toBe('CL');
  });
});

// --------------------------------------------------------------------------
describe('Hook precoce: partente in emorragia prima del 5°', () => {
  it('sotto di 4 al 3° (partente NON affaticato): entra un rilievo lungo', () => {
    const l = createLiveGame(histTeam(['SEA']), histTeam(['LAA', 'ANA']), 5);
    l.inning = 3;
    l.half = 'top'; // casa in difesa
    l.homeSide.runs = 1;
    l.awaySide.runs = 5; // sotto di 4
    l.homeSide.battersFacedByCurrent = 4; // NON affaticato
    const startWasSP = homePitcher(l).role === 'SP';
    const maxSta = Math.max(
      ...l.homeSide.pitchers.slice(1).filter((p) => p.role !== 'CL').map((p) => p.stamina),
    );
    autoManageDefense(l);
    const now = homePitcher(l);
    expect(startWasSP).toBe(true);
    expect(now.role).not.toBe('SP'); // il partente è stato tolto
    expect(now.role).not.toBe('CL'); // non il closer
    expect(now.stamina).toBe(maxSta); // il rilievo più lungo (massima resistenza)
  });

  it('sotto di solo 3: il partente resta (soglia = 4)', () => {
    const l = createLiveGame(histTeam(['SEA']), histTeam(['LAA', 'ANA']), 6);
    l.inning = 3;
    l.half = 'top';
    l.homeSide.runs = 1;
    l.awaySide.runs = 4; // sotto di 3: sotto soglia
    l.homeSide.battersFacedByCurrent = 4;
    autoManageDefense(l);
    expect(homePitcher(l).role).toBe('SP'); // resta il partente
  });

  it('sotto di 5 ma già al 5°: l’hook precoce non scatta (solo prima del 5°)', () => {
    const l = createLiveGame(histTeam(['SEA']), histTeam(['LAA', 'ANA']), 7);
    l.inning = 5;
    l.half = 'top';
    l.homeSide.runs = 1;
    l.awaySide.runs = 6; // sotto di 5, ma inning 5
    l.homeSide.battersFacedByCurrent = 4; // e non affaticato
    autoManageDefense(l);
    expect(homePitcher(l).role).toBe('SP'); // niente hook: resta
  });
});
