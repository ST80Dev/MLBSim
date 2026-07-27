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
  salaryFor,
  clampRating,
  projectPotential,
  RATING_AVG,
} from '../engine/ratings';
import type { Rng } from '../engine/rng';
import { makeRng } from '../engine/rng';
import { SECONDARY_OPTIONS } from '../engine/positions';
import { autoLineup } from '../engine/lineup';
import { NAME_ORIGINS } from './names';
import { FRANCHISES, Franchise } from './franchises';

// Quasi tutti i giocatori hanno una seconda posizione difensiva (adiacente e
// coerente, vedi SECONDARY_OPTIONS): serve a garantire un backup plausibile per
// ogni ruolo anche quando i ruoli PRIMARI della rosa sono sbilanciati (evita le
// rose con 3 SS e 1 solo LF senza copertura). La difesa fuori ruolo e' comunque
// penalizzata (fielding effettivo, vedi engine/positions.ts).
const SECONDARY_CHANCE = 0.95;

const LINEUP_POSITIONS: Position[] = [
  'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH',
];
// Panchina e profondita' distribuite per NON accumulare troppi doppioni sugli
// stessi ruoli (backup C sempre presente, poi utility interni ed esterni sparsi):
// insieme alle seconde posizioni garantiscono copertura equilibrata di ogni casella.
const BENCH_POSITIONS: Position[] = ['C', 'CF', 'SS', '3B', 'RF'];
// Profondita' (depth) oltre i 25 attivi: riserve per gestione/scambi.
const DEPTH_BATTER_POSITIONS: Position[] = ['C', '1B', '2B', 'LF', '3B', 'CF'];

// Gradiente per i 5 slot di rotazione: bias di talento (a MEDIA ~0 → non sposta
// la calibrazione di lega) + fascia d'eta'. Gli assi (SP1/2) sono forti e maturi,
// il #3 medio, il #4/#5 piu' deboli e piu' GIOVANI (back-end da sviluppare).
const SP_SLOTS: Array<{ bias: number; age: [number, number] }> = [
  { bias: 5, age: [25, 36] }, // #1 asso
  { bias: 3, age: [25, 36] }, // #2
  { bias: 1, age: [23, 35] }, // #3 medio
  { bias: -3, age: [22, 30] }, // #4 sotto media
  { bias: -6, age: [21, 27] }, // #5 giovane back-end
];
// Riserve SP (depth): back-end/prospetti giovani, piu' deboli dei titolari.
const DEPTH_SP: { bias: number; age: [number, number] } = { bias: -5, age: [21, 27] };

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

// Archetipi offensivi: molti giocatori sono SPECIALISTI con tradeoff marcati
// (non versioni scalate dello stesso profilo). Danno varieta' realistica tra
// compagni "a prescindere dall'overall": un velocista scarso di media puo' avere
// tante rubate/tripli e pochi HR; un'occhio-lungo tanti BB con poca potenza; uno
// slugger 40 HR ma media bassa. I tilt spostano la MEDIA delle doti quasi a somma
// zero sulla popolazione (non gonfiano gli aggregati di lega, solo la forma).
function batterArchetype(rng: Rng): { contact: number; power: number; eye: number; speed: number } {
  const t = { contact: 0, power: 0, eye: 0, speed: 0 };
  const a = rng.next();
  if (a < 0.16) { t.power += 13; t.contact -= 12; t.eye -= 3; } // slugger da bombe
  else if (a < 0.32) { t.contact += 15; t.power -= 16; t.eye += 2; } // contact / slap hitter (pochi HR)
  else if (a < 0.45) { t.eye += 18; t.power -= 6; t.contact -= 4; } // occhio / OBP
  else if (a < 0.6) { t.speed += 18; t.power -= 17; t.contact += 4; } // velocista (spesso pochissimi HR)
  else if (a < 0.7) { t.power += 10; t.contact += 7; t.eye += 5; } // stella completa (raro)
  // resto (~30%): profilo equilibrato, nessun tilt.
  return t;
}

function makeBatterRatings(rng: Rng, position: Position, teamTalent = 0): BatterRatings {
  // Talento CONDIVISO: la spina dorsale del giocatore, l'unica componente che
  // SOPRAVVIVE alla media dell'overall (il rumore per-dote si annulla). Si compone
  // di due parti: `teamTalent` (offset della SQUADRA: rende alcune rose davvero
  // piu' forti di altre, cosi' le stagioni non finiscono tutte sul .500) + una
  // parte INDIVIDUALE. Coda rara di GEMME (~4%): campioni che sfondano verso le 5
  // stelle e, con l'archetipo, dominano una categoria. Entrambe centrate su 0:
  // gli aggregati di lega (epoca "alta offesa") non si spostano, cambia solo la
  // DISPERSIONE (fra squadre e fra compagni).
  const gem = rng.next() < 0.04 ? Math.abs(rng.gauss(0, 1)) * 9 + 6 : 0;
  const talent = teamTalent + rng.gauss(0, 7) + gem;
  const shape = POS_SHAPE[position] ?? { field: 0, power: 0, speed: 0, arm: 0 };
  const t = batterArchetype(rng);
  const draw = (sd: number, bonus = 0) => clampRating(RATING_AVG + talent + bonus + rng.gauss(0, sd));
  return {
    contact: draw(6.5, t.contact),
    power: draw(7.5, shape.power + t.power),
    eye: draw(6.5, t.eye),
    speed: draw(8.5, shape.speed + t.speed),
    fielding: draw(9, shape.field),
    arm: draw(9, shape.arm),
  };
}

function makePitcherRatings(rng: Rng, role: PitcherRole, teamTalent = 0): PitcherRatings {
  // Stessa filosofia dei battitori: offset di SQUADRA + parte individuale + coda
  // rara di gemme (~4%), tutto centrato su 0 per non spostare l'epoca.
  const gem = rng.next() < 0.04 ? Math.abs(rng.gauss(0, 1)) * 9 + 6 : 0;
  const talent = teamTalent + rng.gauss(0, 7.5) + gem;
  const draw = (sd: number, bonus = 0) => clampRating(RATING_AVG + talent + bonus + rng.gauss(0, sd));
  const staminaBase = role === 'SP' ? RATING_AVG + 2 : role === 'CL' ? RATING_AVG - 20 : RATING_AVG - 12;
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

// Posizioni difensive "di casa" plausibili per chi occupa lo slot DH: quasi
// sempre un bat-first d'angolo (1B/angoli esterni/3B) o un ricevitore a riposo.
const DH_HOME_POSITIONS: Position[] = ['1B', '1B', '1B', 'LF', 'LF', 'RF', '3B', '3B', 'C'];

function makeBatter(rng: Rng, names: NameFactory, id: string, position: Position, teamTalent = 0): Batter {
  // Il DH non e' un ruolo difensivo, e' uno slot di battuta: spesso lo occupa la
  // riserva di un altro ruolo che oggi riposa il guanto. Quindi gli diamo una
  // VERA posizione difensiva naturale (secondaria) e ne deriviamo doti e difesa,
  // invece del vuoto difensivo fisso.
  const isDH = position === 'DH';
  const ratingsPos = isDH ? rng.pick(DH_HOME_POSITIONS) : position;
  const ratings = makeBatterRatings(rng, ratingsPos, teamTalent);
  const stats = deriveBatterStats(ratings);
  const age = rng.int(21, 37);
  const ovr = batterOverall(ratings);
  const secondaryPosition = isDH ? ratingsPos : pickSecondary(rng, position);
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
    salary: salaryFor(ovr, age),
    retired: false,
  };
}

function makePitcher(
  rng: Rng,
  names: NameFactory,
  id: string,
  role: PitcherRole,
  teamTalent = 0,
  talentBias = 0,
  ageRange: [number, number] = [21, 37],
): Pitcher {
  const ratings = makePitcherRatings(rng, role, teamTalent + talentBias);
  const stats = derivePitcherStats(ratings);
  const age = rng.int(ageRange[0], ageRange[1]);
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
    salary: salaryFor(ovr, age),
    retired: false,
  };
}

export function generateTeamFromFranchise(rng: Rng, f: Franchise): Team {
  // Una fabbrica di nomi per squadra: nomi unici, cognomi vari.
  const names = makeNameFactory(rng);
  // Offset di talento della SQUADRA: sposta TUTTI i suoi giocatori su/giu' insieme,
  // cosi' alcune rose sono davvero da contender e altre da cantina (le stagioni
  // non finiscono tutte sul filo del .500). Centrato su 0 (la media di lega resta),
  // sigma CONTENUTA e clamp: niente cantine/corazzate irreali (payroll fuori scala).
  const teamTalent = Math.max(-8, Math.min(8, rng.gauss(0, 3.8)));
  // Ordine di battuta REALISTICO (basi standard) guidato dai rating via
  // `autoLineup`: leadoff OBP+velocita', cleanup potenza, ecc. Vale per OGNI
  // squadra — la mia (via defaultArrangement, che legge l'ordine di team.lineup)
  // e le 29 CPU — così nessuno batte lo slugger in prima come faceva il vecchio
  // ordinamento per solo overall.
  const lineup = autoLineup(
    LINEUP_POSITIONS.map((pos, i) => makeBatter(rng, names, `${f.abbrev}-B${i}`, pos, teamTalent)),
  );

  const bench = BENCH_POSITIONS.map((pos, i) =>
    makeBatter(rng, names, `${f.abbrev}-BN${i}`, pos, teamTalent),
  );
  // GRADIENTE ROTAZIONE (realismo MLB): 1-2 partenti forti, un #3 medio, #4/#5
  // piu' deboli e piu' GIOVANI (back-end da far crescere / soggetti a rotazione
  // con le riserve). Bias a media ~0 sui 5 slot: non sposta la calibrazione di
  // lega, cambia solo la DISTRIBUZIONE dentro la rotazione (niente "5 assi").
  const rotation = SP_SLOTS.map((s, i) =>
    makePitcher(rng, names, `${f.abbrev}-SP${i}`, 'SP', teamTalent, s.bias, s.age),
  );
  const bullpen: Pitcher[] = [
    ...Array.from({ length: 5 }, (_, i) => makePitcher(rng, names, `${f.abbrev}-RP${i}`, 'RP', teamTalent)),
    makePitcher(rng, names, `${f.abbrev}-CL`, 'CL', teamTalent),
  ];

  // Profondita': ~6 battitori + 4 lanciatori (2 SP + 2 RP) di riserva.
  const reserveBatters = DEPTH_BATTER_POSITIONS.map((pos, i) =>
    makeBatter(rng, names, `${f.abbrev}-DB${i}`, pos, teamTalent),
  );
  const reservePitchers: Pitcher[] = [
    ...Array.from({ length: 2 }, (_, i) =>
      makePitcher(rng, names, `${f.abbrev}-DSP${i}`, 'SP', teamTalent, DEPTH_SP.bias, DEPTH_SP.age),
    ),
    ...Array.from({ length: 2 }, (_, i) => makePitcher(rng, names, `${f.abbrev}-DRP${i}`, 'RP', teamTalent)),
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
