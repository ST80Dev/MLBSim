import { describe, it, expect } from 'vitest';
import { evaluateTrade, SLOT_PREMIUM_MAX } from '../trades';
import type { TradeContext } from '../trades';
import { GENERATED_MODE, effectiveCap } from '../leagueMode';
import { deriveBatterStats, salaryFor } from '../../engine/ratings';
import { playerValue } from '../../engine/value';
import type { Batter, BatterRatings, Team } from '../../engine/types';

// ---------------------------------------------------------------------------
// Fixture minimali: battitori "flat" (tutte le doti = lvl) e squadre-guscio con
// una rosa di riempimento a livello dato. Basta per il decisore (usa solo
// playerValue + conteggio teste + salari + tetto effettivo).
// ---------------------------------------------------------------------------

const ratings = (lvl: number): BatterRatings => ({
  contact: lvl, power: lvl, eye: lvl, speed: lvl, fielding: lvl, arm: lvl,
});

let uid = 0;
const bat = (lvl: number, age = 27, pot = lvl, salary = salaryFor(lvl, age)): Batter => ({
  id: `b${uid++}`, name: 'T P', bats: 'R', position: 'CF', ratings: ratings(lvl),
  stats: deriveBatterStats(ratings(lvl)), age, potential: pot, salary, retired: false,
});

/** Squadra-guscio: `n` giocatori di riempimento a livello `fillLvl`, id univoco. */
function team(id: string, opts: { fillLvl?: number; heads?: number } = {}): Team {
  const fillLvl = opts.fillLvl ?? 70;
  const heads = opts.heads ?? 35;
  const roster = Array.from({ length: heads }, () => bat(fillLvl));
  return {
    id, name: id, abbrev: id.toUpperCase().slice(0, 3),
    primaryColor: '#000', secondaryColor: '#fff', ballpark: 'Park',
    league: 'AL', division: 'E', usesDH: true,
    lineup: roster.slice(0, 9),
    bench: roster.slice(9, 14),
    rotation: [], bullpen: [],
    reserveBatters: roster.slice(14),
    reservePitchers: [],
  };
}

const ctx = (humanTeam: Team, aiTeam: Team): TradeContext => ({
  humanTeam, aiTeam, mode: GENERATED_MODE, seed: 1234, year: 2000,
});

describe('evaluateTrade — validita di base', () => {
  it('rifiuta una proposta vuota da un lato (non e uno scambio)', () => {
    const h = team('hum');
    const a = team('cpu');
    const ev = evaluateTrade({ fromHuman: [bat(70)], fromAI: [] }, ctx(h, a));
    expect(ev.accepted).toBe(false);
    expect(ev.verdict).toBe('empty');
  });

  it('e puro/deterministico: stesso input, stesso output', () => {
    const h = team('hum');
    const a = team('cpu');
    const p = { fromHuman: [bat(72)], fromAI: [bat(72)] };
    const e1 = evaluateTrade(p, ctx(h, a));
    const e2 = evaluateTrade(p, ctx(h, a));
    expect(e1).toEqual(e2);
  });
});

describe('evaluateTrade — equita 1-per-1', () => {
  it('accetta uno scambio 1-per-1 di pari valore', () => {
    const h = team('hum');
    const a = team('cpu');
    const give = bat(74, 27);
    const get = bat(74, 27, 74, give.salary); // stesso valore
    const ev = evaluateTrade({ fromHuman: [give], fromAI: [get] }, ctx(h, a));
    expect(ev.premium).toBe(0); // 1-per-1: nessuno slot liberato
    expect(ev.accepted).toBe(true);
    expect(ev.verdict).toBe('accepted');
  });

  it('rifiuta un 1-per-1 fortemente squilibrato a sfavore della CPU', () => {
    const h = team('hum');
    const a = team('cpu');
    // L'umano cede uno scarso e pretende una stella.
    const ev = evaluateTrade({ fromHuman: [bat(58, 30)], fromAI: [bat(88, 27)] }, ctx(h, a));
    expect(ev.premium).toBe(0);
    expect(ev.rawDelta).toBeLessThan(-FAIRNESS_NEG());
    expect(ev.accepted).toBe(false);
    expect(ev.verdict).toBe('unfair');
  });
});

// Piccolo helper: la soglia oltre cui e' "unfair" (per leggibilita' del test).
function FAIRNESS_NEG() {
  return 2;
}

describe('evaluateTrade — premio di consolidamento (2-per-1)', () => {
  it('un contender a rosa piena ACCETTA di ricevere la stella cedendo due mediocri', () => {
    // CPU forte e piena → premio-slot alto: paga per liberare uno slot.
    const h = team('hum', { fillLvl: 76, heads: 35 });
    const a = team('cpu', { fillLvl: 76, heads: 35 });
    const star = bat(90, 27); //          l'umano cede la stella
    const midA = bat(64, 28);
    const midB = bat(64, 28); //          la CPU cede due mediocri
    const ev = evaluateTrade({ fromHuman: [star], fromAI: [midA, midB] }, ctx(h, a));
    // Grezzo a sfavore della CPU (due mediocri sommano piu' della stella)...
    expect(ev.rawDelta).toBeLessThan(0);
    // ...ma il premio di consolidamento (uno slot liberato) ribalta la decisione.
    expect(ev.premium).toBeGreaterThan(0);
    expect(ev.accepted).toBe(true);
  });

  it('lo stesso contender pieno RIFIUTA di cedere la stella per due mediocri (frammenta)', () => {
    const h = team('hum', { fillLvl: 76, heads: 35 });
    const a = team('cpu', { fillLvl: 76, heads: 35 });
    const star = bat(90, 27); //          la CPU cede la stella
    const midA = bat(64, 28);
    const midB = bat(64, 28); //          l'umano cede due mediocri
    const ev = evaluateTrade({ fromHuman: [midA, midB], fromAI: [star] }, ctx(h, a));
    // Grezzo a FAVORE della CPU (riceve piu' somma)...
    expect(ev.rawDelta).toBeGreaterThan(0);
    // ...ma frammentare occupa uno slot: sconto negativo → rifiuta.
    expect(ev.premium).toBeLessThan(0);
    expect(ev.accepted).toBe(false);
    expect(ev.verdict).toBe('unfair');
  });

  it('un ricostruttore (rosa magra e debole) decide sul valore GREZZO: cede la stella per due pezzi', () => {
    const h = team('hum', { fillLvl: 70, heads: 35 });
    const a = team('cpu', { fillLvl: 62, heads: 26 }); // magra e debole → premio ~0
    const star = bat(90, 27);
    const midA = bat(66, 24);
    const midB = bat(66, 24);
    const ev = evaluateTrade({ fromHuman: [midA, midB], fromAI: [star] }, ctx(h, a));
    expect(Math.abs(ev.premium)).toBeLessThan(1); // nessun premio degno di nota
    expect(ev.rawDelta).toBeGreaterThan(0);
    expect(ev.accepted).toBe(true); // prende volentieri i due corpi
  });
});

describe('evaluateTrade — vincolo di cap', () => {
  it('la CPU rifiuta se lo scambio la porterebbe a sforare il proprio tetto', () => {
    // CPU gia' vicina al tetto: riceve un contratto molto piu' caro di quello ceduto.
    const a = team('cpu', { fillLvl: 70, heads: 35 });
    const cap = effectiveCap(GENERATED_MODE, 1234, a.id, 2000);
    // Porta la CPU vicino al tetto rendendo la rosa "cara" e proponendo un upgrade caro.
    const h = team('hum');
    const cheap = bat(70, 24, 70, 1); //  la CPU cede un contratto economico
    const pricey = bat(72, 29, 72, 60); // e riceve un contratto enorme
    // Forza payroll CPU appena sotto il tetto.
    const filler = a.reserveBatters;
    // Alza gli stipendi finche' il payroll e' ~cap − 5.
    let payroll = a.lineup.concat(a.bench, filler).reduce((s, p) => s + p.salary, 0);
    let i = 0;
    while (payroll < cap - 5 && i < filler.length) { filler[i].salary += 5; payroll += 5; i++; }
    // Sostituisci un giocatore CPU con `cheap` così è cedibile nello scambio.
    a.reserveBatters[a.reserveBatters.length - 1] = cheap;
    const ev = evaluateTrade({ fromHuman: [pricey], fromAI: [cheap] }, ctx(h, a));
    expect(ev.aiCapOk).toBe(false);
    expect(ev.accepted).toBe(false);
    expect(ev.verdict).toBe('aiCap');
  });
});

describe('evaluateTrade — coerenza del premio', () => {
  it('il premio-slot resta entro il massimo dichiarato', () => {
    const h = team('hum', { fillLvl: 80, heads: 40 });
    const a = team('cpu', { fillLvl: 80, heads: 40 });
    const ev = evaluateTrade({ fromHuman: [bat(90)], fromAI: [bat(60), bat(60)] }, ctx(h, a));
    expect(ev.premium).toBeLessThanOrEqual(SLOT_PREMIUM_MAX * 1.3 + 1e-6);
  });

  it('rawDelta e coerente con playerValue', () => {
    const h = team('hum');
    const a = team('cpu');
    const give = bat(80, 26);
    const get = bat(70, 30);
    const ev = evaluateTrade({ fromHuman: [give], fromAI: [get] }, ctx(h, a));
    const expected = Math.round((playerValue(give) - playerValue(get)) * 10) / 10;
    expect(ev.rawDelta).toBeCloseTo(expected, 5);
  });
});
