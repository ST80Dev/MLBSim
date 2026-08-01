import { describe, it, expect } from 'vitest';
import { createLiveGame, cpuOffenseTurn, autoManageDefense, type LiveGame } from '../game';
import { generateMatchup } from '../../data/generator';
import type { Batter, BatterRatings } from '../types';

const setR = (b: Batter, vals: Partial<BatterRatings>) => Object.assign(b.ratings, vals);

/** Prepara una gara con la CPU (away) alla battuta in tardo-gara e in bilico. */
function lateCloseCpuBatting(seed: number): LiveGame {
  const { away, home } = generateMatchup(seed);
  const live = createLiveGame(away, home, seed, 'home'); // umano = home → CPU (away) batte
  live.microEvents = false;
  live.inning = 8;
  live.awaySide.runs = 3;
  live.homeSide.runs = 3;
  return live;
}

describe('AI panchina della CPU', () => {
  it('pinch-hit: tardo-gara in bilico, titolare debole → entra il miglior panchinaro', () => {
    const live = lateCloseCpuBatting(1);
    live.bases[1] = { batter: live.away.lineup[5], pitcherId: 'p' }; // corridore in posizione punto
    const cur = live.awaySide.team.lineup[live.awaySide.battingIndex];
    const curId = cur.id;
    setR(cur, { contact: 40, power: 40, eye: 40, speed: 40 }); // titolare debole
    setR(live.awaySide.team.bench[0], { contact: 88, power: 85, eye: 82, speed: 60 }); // panchinaro forte

    cpuOffenseTurn(live);

    const sub = live.play.find((p) => p.kind === 'sub' && p.text.includes('pinch-hitter'));
    expect(sub).toBeTruthy(); // un pinch-hitter è entrato per il titolare debole
    expect(live.awaySide.team.lineup.some((b) => b.id === curId)).toBe(false); // il debole è uscito
  });

  it('pinch-hit: NON scatta presto (inning 3)', () => {
    const live = lateCloseCpuBatting(2);
    live.inning = 3;
    live.bases[1] = { batter: live.away.lineup[5], pitcherId: 'p' };
    setR(live.awaySide.team.lineup[live.awaySide.battingIndex], { contact: 40, power: 40, eye: 40, speed: 40 });
    setR(live.awaySide.team.bench[0], { contact: 88, power: 85, eye: 82, speed: 60 });

    cpuOffenseTurn(live);
    expect(live.play.some((p) => p.kind === 'sub')).toBe(false);
  });

  it('pinch-hit: NON scatta per un titolare valido (OVR alto)', () => {
    const live = lateCloseCpuBatting(4);
    live.bases[1] = { batter: live.away.lineup[5], pitcherId: 'p' };
    setR(live.awaySide.team.lineup[live.awaySide.battingIndex], { contact: 85, power: 85, eye: 82, speed: 70 });
    setR(live.awaySide.team.bench[0], { contact: 88, power: 85, eye: 82, speed: 60 });

    cpuOffenseTurn(live);
    expect(live.play.some((p) => p.kind === 'sub' && p.text.includes('pinch-hitter'))).toBe(false);
  });

  it('sostituzione difensiva: tardo-gara con vantaggio piccolo → entra un guanto migliore', () => {
    const { away, home } = generateMatchup(3);
    const live = createLiveGame(away, home, 3);
    live.microEvents = false;
    live.inning = 8;
    live.half = 'top'; // difesa = home (CPU)
    live.homeSide.runs = 4;
    live.awaySide.runs = 2; // vantaggio di 2
    const starter = live.homeSide.team.lineup.find((b) => b.position !== 'P' && b.position !== 'DH')!;
    setR(starter, { fielding: 40 }); // difesa scarsa alla casella
    setR(live.homeSide.team.bench[0], { fielding: 92 }); // guanto d'oro in panchina

    autoManageDefense(live);
    expect(live.play.some((p) => p.kind === 'sub' && p.text.includes('in difesa'))).toBe(true);
  });

  it('sostituzione difensiva: NON scatta in goleada (vantaggio ampio)', () => {
    const { away, home } = generateMatchup(5);
    const live = createLiveGame(away, home, 5);
    live.microEvents = false;
    live.inning = 8;
    live.half = 'top';
    live.homeSide.runs = 12;
    live.awaySide.runs = 2; // +10: non è protezione di un vantaggio risicato
    const starter = live.homeSide.team.lineup.find((b) => b.position !== 'P' && b.position !== 'DH')!;
    setR(starter, { fielding: 40 });
    setR(live.homeSide.team.bench[0], { fielding: 92 });

    autoManageDefense(live);
    expect(live.play.some((p) => p.kind === 'sub')).toBe(false);
  });
});
