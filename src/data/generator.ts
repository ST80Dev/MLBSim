import type {
  Batter,
  BatterRatings,
  Pitcher,
  PitcherRatings,
  Position,
  Team,
  Hand,
  ThrowHand,
  PitcherRole,
} from '../engine/types';
import {
  deriveBatterStats,
  derivePitcherStats,
  deriveStamina,
  batterOverall,
  pitcherOverall,
  salaryFromOverall,
  clampRating,
  projectPotential,
} from '../engine/ratings';
import type { Rng } from '../engine/rng';
import { makeRng } from '../engine/rng';
import { SECONDARY_OPTIONS } from '../engine/positions';
import { NAME_ORIGINS } from './names';
import { FRANCHISES, Franchise } from './franchises';

// Quota di giocatori (non tutti!) con una seconda posizione difensiva.
const SECONDARY_CHANCE = 0.35;

const LINEUP_POSITIONS: Position[] = [
  'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH',
];
const BENCH_POSITIONS: Position[] = ['C', 'SS', 'CF', '1B', '3B'];
// Profondita' (depth) oltre i 25 attivi: riserve per gestione/scambi. Coprono
// posizioni varie cosi' che ci sia sempre un sostituto plausibile da promuovere.
const DEPTH_BATTER_POSITIONS: Position[] = ['C', 'SS', '2B', '3B', 'CF', '1B'];

// Modellazione per ruolo: i difensori centrali difendono meglio, gli angoli
// picchiano di piu', ecc. (bonus applicati alle doti in generazione).
const POS_SHAPE: Record<string, { field: number; power: number; speed: number; arm: number }> = {
  C: { field: 8, power: 2, speed: -8, arm: 8 },
  SS: { field: 9, power: -4, speed: 5, arm: 6 },
  '2B': { field: 6, power: -3, speed: 5, arm: 2 },
  CF: { field: 8, power: -2, speed: 8, arm: 4 },
  '3B': { field: 4, power: 6, speed: -2, arm: 5 },
  RF: { field: 2, power: 6, speed: 1, arm: 7 },
  LF: { field: 1, power: 6, speed: 1, arm: 1 },
  '1B': { field: -6, power: 8, speed: -7, arm: -3 },
  DH: { field: -12, power: 9, speed: -6, arm: -8 },
};

/**
 * Fabbrica di nomi per una rosa: pesca un'origine (peso ~ demografia MLB), poi
 * nome e cognome coerenti. NON impone l'unicita' assoluta: i doppioni di cognome
 * (e, rarissimi, i veri omonimi) possono capitare in modo casuale — come nella
 * realta', piu' facilmente coi cognomi comuni nord-americani e latini. Evita
 * solo l'eccesso (i "3 Ortiz nello stesso lineup").
 */
export interface GeneratedName {
  full: string;
  first: string;
  last: string;
}

export interface NameFactory {
  next(): GeneratedName;
}

const NAME_TOTAL_WEIGHT = NAME_ORIGINS.reduce((s, o) => s + o.weight, 0);

export function makeNameFactory(rng: Rng): NameFactory {
  const usedFull = new Set<string>();
  const lastCount = new Map<string, number>();

  const pickOrigin = () => {
    let r = rng.next() * NAME_TOTAL_WEIGHT;
    for (const o of NAME_ORIGINS) {
      r -= o.weight;
      if (r < 0) return o;
    }
    return NAME_ORIGINS[NAME_ORIGINS.length - 1];
  };

  return {
    next(): GeneratedName {
      let fallback: GeneratedName = { full: '', first: '', last: '' };
      for (let attempt = 0; attempt < 10; attempt++) {
        const o = pickOrigin();
        const first = rng.pick(o.first);
        const last = rng.pick(o.last);
        const full = `${first} ${last}`;
        fallback = { full, first, last };
        const seen = lastCount.get(last) ?? 0;
        // Probabilita' di RIFIUTARE la pesca: cresce col numero di doppioni, cosi'
        // un secondo cognome uguale capita ogni tanto, un terzo e' raro, un
        // quarto quasi impossibile; i veri omonimi (nome+cognome) rarissimi.
        let reject = 0;
        if (usedFull.has(full)) reject = 0.97;
        else if (seen >= 3) reject = 0.98;
        else if (seen === 2) reject = 0.9;
        else if (seen === 1) reject = 0.6;
        if (reject > 0 && rng.next() < reject) continue;
        usedFull.add(full);
        lastCount.set(last, seen + 1);
        return { full, first, last };
      }
      return fallback;
    },
  };
}

function batHand(rng: Rng): Hand {
  const r = rng.next();
  return r < 0.6 ? 'R' : r < 0.9 ? 'L' : 'S';
}
function throwHand(rng: Rng): ThrowHand {
  return rng.next() < 0.7 ? 'R' : 'L';
}

function makeBatterRatings(rng: Rng, position: Position): BatterRatings {
  const talent = rng.gauss(0, 6);
  const shape = POS_SHAPE[position] ?? { field: 0, power: 0, speed: 0, arm: 0 };
  const draw = (sd: number, bonus = 0) => clampRating(50 + talent + bonus + rng.gauss(0, sd));
  return {
    contact: draw(8),
    power: draw(9, shape.power),
    eye: draw(8),
    speed: draw(10, shape.speed),
    fielding: draw(9, shape.field),
    arm: draw(9, shape.arm),
  };
}

function makePitcherRatings(rng: Rng, role: PitcherRole): PitcherRatings {
  const talent = rng.gauss(0, 6);
  const draw = (sd: number, bonus = 0) => clampRating(50 + talent + bonus + rng.gauss(0, sd));
  const staminaBase = role === 'SP' ? 52 : role === 'CL' ? 30 : 38;
  return {
    stuff: draw(8, role === 'SP' ? 0 : 4),
    control: draw(8),
    movement: draw(8),
    groundball: draw(9),
    stamina: clampRating(staminaBase + rng.gauss(0, 7)),
    fielding: draw(9),
  };
}

function pickSecondary(rng: Rng, primary: Position): Position | undefined {
  const opts = SECONDARY_OPTIONS[primary];
  if (!opts || opts.length === 0) return undefined;
  // Estraggo sempre (per non spostare lo stream RNG in modo condizionale),
  // poi tengo la seconda posizione solo entro la quota voluta.
  const choice = rng.pick(opts);
  return rng.next() < SECONDARY_CHANCE ? choice : undefined;
}

function makeBatter(rng: Rng, names: NameFactory, id: string, position: Position): Batter {
  const ratings = makeBatterRatings(rng, position);
  const stats = deriveBatterStats(ratings);
  const age = rng.int(21, 37);
  const ovr = batterOverall(ratings);
  const secondaryPosition = pickSecondary(rng, position);
  const nm = names.next();
  return {
    id,
    name: nm.full,
    firstName: nm.first,
    lastName: nm.last,
    bats: batHand(rng),
    position,
    ...(secondaryPosition ? { secondaryPosition } : {}),
    ratings,
    stats,
    age,
    potential: projectPotential(rng, ovr, age),
    salary: salaryFromOverall(ovr),
    retired: false,
  };
}

function makePitcher(rng: Rng, names: NameFactory, id: string, role: PitcherRole): Pitcher {
  const ratings = makePitcherRatings(rng, role);
  const stats = derivePitcherStats(ratings);
  const age = rng.int(21, 37);
  const ovr = pitcherOverall(ratings);
  const nm = names.next();
  return {
    id,
    name: nm.full,
    firstName: nm.first,
    lastName: nm.last,
    throws: throwHand(rng),
    role,
    ratings,
    stats,
    stamina: deriveStamina(ratings.stamina, role),
    age,
    potential: projectPotential(rng, ovr, age),
    salary: salaryFromOverall(ovr),
    retired: false,
  };
}

export function generateTeamFromFranchise(rng: Rng, f: Franchise): Team {
  // Una fabbrica di nomi per squadra: nomi unici, cognomi vari.
  const names = makeNameFactory(rng);
  const lineup = LINEUP_POSITIONS.map((pos, i) =>
    makeBatter(rng, names, `${f.abbrev}-B${i}`, pos),
  );
  // Ordine di battuta semplice: i migliori bastoni piu' in alto.
  // (L'ottimizzazione realistica del lineup arrivera' in Fase 2.)
  lineup.sort((a, b) => batterOverall(b.ratings) - batterOverall(a.ratings));

  const bench = BENCH_POSITIONS.map((pos, i) =>
    makeBatter(rng, names, `${f.abbrev}-BN${i}`, pos),
  );
  const rotation = Array.from({ length: 5 }, (_, i) =>
    makePitcher(rng, names, `${f.abbrev}-SP${i}`, 'SP'),
  );
  const bullpen: Pitcher[] = [
    ...Array.from({ length: 5 }, (_, i) => makePitcher(rng, names, `${f.abbrev}-RP${i}`, 'RP')),
    makePitcher(rng, names, `${f.abbrev}-CL`, 'CL'),
  ];

  // Profondita': ~6 battitori + 4 lanciatori (2 SP + 2 RP) di riserva.
  const reserveBatters = DEPTH_BATTER_POSITIONS.map((pos, i) =>
    makeBatter(rng, names, `${f.abbrev}-DB${i}`, pos),
  );
  const reservePitchers: Pitcher[] = [
    ...Array.from({ length: 2 }, (_, i) => makePitcher(rng, names, `${f.abbrev}-DSP${i}`, 'SP')),
    ...Array.from({ length: 2 }, (_, i) => makePitcher(rng, names, `${f.abbrev}-DRP${i}`, 'RP')),
  ];

  return {
    id: f.id,
    name: f.name,
    abbrev: f.abbrev,
    primaryColor: f.primaryColor,
    secondaryColor: f.secondaryColor,
    ballpark: f.ballpark,
    league: f.league,
    division: f.division,
    lineup,
    bench,
    rotation,
    bullpen,
    usesDH: true,
    reserveBatters,
    reservePitchers,
  };
}

/** Genera due franchigie reali distinte con rosa procedurale, dal seed. */
export function generateMatchup(seed: number): { away: Team; home: Team } {
  const rng = makeRng(seed);
  const ai = rng.int(0, FRANCHISES.length - 1);
  let bi = rng.int(0, FRANCHISES.length - 1);
  while (bi === ai) bi = rng.int(0, FRANCHISES.length - 1);
  return {
    away: generateTeamFromFranchise(rng, FRANCHISES[ai]),
    home: generateTeamFromFranchise(rng, FRANCHISES[bi]),
  };
}
