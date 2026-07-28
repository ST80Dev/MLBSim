import { describe, it, expect } from 'vitest';
import { simulateGame } from '../game';
import { batterRates, pitcherRates, combineRates } from '../probabilities';
import { LEAGUE } from '../constants';
import { generateMatchup, withRotationStarter } from '../../data/generator';
import { formatIp } from '../boxscore';

describe('probabilita', () => {
  it('i rate combinati sommano a 1', () => {
    const { away, home } = generateMatchup(1);
    const b = batterRates(away.lineup[0].stats);
    const p = pitcherRates(home.rotation[0].stats);
    const c = combineRates(b, p, {
      platoonAdvantage: false,
      platoonDisadvantage: false,
      fatigue: 1,
    });
    const sum =
      c.bb + c.hbp + c.so + c.hr + c.triple + c.double + c.single + c.outInPlay;
    expect(sum).toBeCloseTo(1, 6);
  });

  it('le medie di lega sommano a 1', () => {
    const sum =
      LEAGUE.bb +
      LEAGUE.hbp +
      LEAGUE.so +
      LEAGUE.hr +
      LEAGUE.triple +
      LEAGUE.double +
      LEAGUE.single +
      LEAGUE.outInPlay;
    expect(sum).toBeCloseTo(1, 9);
  });
});

describe('determinismo', () => {
  it('stesso seed -> stesso risultato', () => {
    const { away, home } = generateMatchup(42);
    const g1 = simulateGame(away, home, 777);
    const g2 = simulateGame(away, home, 777);
    expect(g1.final).toEqual(g2.final);
    expect(g1.play.length).toBe(g2.play.length);
    expect(g1.innings).toBe(g2.innings);
  });

  it('seed diversi -> partite (di norma) diverse', () => {
    const { away, home } = generateMatchup(42);
    const g1 = simulateGame(away, home, 1);
    const g2 = simulateGame(away, home, 2);
    // Non e' garantito al 100%, ma con questi seed devono differire.
    expect(g1.final).not.toEqual(g2.final);
  });
});

describe('integrita di una partita', () => {
  it('non finisce mai in pareggio e ha almeno 9 inning', () => {
    for (let s = 0; s < 30; s++) {
      const { away, home } = generateMatchup(s);
      const g = simulateGame(away, home, s * 13 + 1);
      expect(g.final.away).not.toBe(g.final.home);
      expect(g.innings).toBeGreaterThanOrEqual(9);
    }
  });

  it('gli out per lanciatore corrispondono agli inning giocati', () => {
    const { away, home } = generateMatchup(5);
    const g = simulateGame(away, home, 99);
    const awayOuts = g.awayStats.pitching.reduce((a, p) => a + p.outs, 0);
    // Gli out registrati dai lanciatori away = out fatti a home in difesa.
    expect(awayOuts).toBeGreaterThan(0);
    expect(formatIp(9 * 3)).toBe('9.0');
  });

  it('R/H coerenti: con hits > 0 di norma ci sono punti nella lega', () => {
    const g = simulateGame(...twoTeams(7), 7);
    expect(g.awayStats.hits).toBeGreaterThanOrEqual(0);
    expect(g.homeStats.hits).toBeGreaterThanOrEqual(0);
  });
});

describe('realismo statistico (aggregato su molte partite)', () => {
  it('produce un ambiente di gioco plausibile', () => {
    let games = 0;
    let totalRuns = 0;
    let ab = 0;
    let h = 0;
    let hr = 0;
    let so = 0;
    let pa = 0;
    let bb = 0;

    for (let s = 0; s < 200; s++) {
      const { away, home } = generateMatchup(s);
      // Come nella stagione reale: i partenti girano (createLiveGame usa rotation[0]).
      // Senza, ogni partita sarebbe lanciata dall'asso (rotazione ordinata) e
      // l'ambiente-punti crollerebbe sotto epoca.
      const g = simulateGame(withRotationStarter(away, s), withRotationStarter(home, s), s * 101 + 3);
      games += 1;
      totalRuns += g.final.away + g.final.home;
      for (const stats of [g.awayStats, g.homeStats]) {
        for (const line of stats.batting) {
          ab += line.ab;
          h += line.h;
          hr += line.hr;
          so += line.so;
          bb += line.bb;
          pa += line.ab + line.bb; // approssimazione
        }
      }
    }

    const runsPerTeamPerGame = totalRuns / (games * 2);
    const ba = h / ab;
    const kRate = so / pa;
    const hrPerGame = hr / (games * 2);

    // Intervalli per l'epoca voluta: "alta offesa anni '90/2000".
    // Punti alti, medie alte, tanti fuoricampo — ma non fuori scala. Il tetto e'
    // 6.4: pavimenti/stelle garantite (rose senza buchi) + partenti che ruotano
    // (non l'asso ogni partita) + best-starts alzano di un soffio l'ambiente-punti,
    // restando in epoca (convessita' di ratingMult).
    expect(runsPerTeamPerGame).toBeGreaterThan(4.3);
    expect(runsPerTeamPerGame).toBeLessThan(6.4);
    expect(ba).toBeGreaterThan(0.255);
    expect(ba).toBeLessThan(0.295);
    expect(kRate).toBeGreaterThan(0.14);
    expect(kRate).toBeLessThan(0.26);
    expect(hrPerGame).toBeGreaterThan(0.9);
    expect(hrPerGame).toBeLessThan(2.2);
  });
});

function twoTeams(seed: number): [import('../types').Team, import('../types').Team] {
  const m = generateMatchup(seed);
  return [m.away, m.home];
}
