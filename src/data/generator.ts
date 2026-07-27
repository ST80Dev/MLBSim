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
import { makeRng, clamp } from '../engine/rng';
import { SECONDARY_OPTIONS, canOccupy, ratingsAtPosition } from '../engine/positions';
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

// Pavimenti realistici. ROT_FLOOR: un partente titolare, anche il #5 di una
// squadra scarsa, e' sotto media ma di livello MLB (mai un braccio da Tripla-A
// in rotazione). STAR_FLOOR: ogni squadra ha almeno una stella.
const ROT_FLOOR = 52;
const STAR_FLOOR = 80;
// Un titolare di movimento, anche il peggiore di una squadra scarsa, e' un
// regolare di livello MLB: pavimento simmetrico a quello della rotazione (via i
// giocatori sotto-replacement dal lineup di partenza). Tiene anche l'equilibrio
// offesa/lancio dell'epoca (i due pavimenti si compensano).
const LINEUP_FLOOR = 55;

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
type Dote6 = 'contact' | 'power' | 'eye' | 'speed' | 'fielding' | 'arm';
interface Archetype {
  /** Tilt della MEDIA (dà la forma; ~somma zero sulla popolazione). */
  tilt: Partial<Record<Dote6, number>>;
  /** Peso del BONUS di specializzazione (gemma + stella) su ciascuna dote: ~1 nelle
   *  CORE, basso nelle OFF-TYPE. Default 0.6 se non specificato. */
  w: Partial<Record<Dote6, number>>;
}

// Archetipi: un elite è uno SPECIALISTA, non un maxato-ovunque. Il bonus di
// specializzazione (gemma/stella) fluisce nelle doti CORE (peso ~1) ed è smorzato
// sulle OFF-TYPE (peso basso) — così un masher fa 100 di potenza ma resta lento
// (niente 50/50, niente 15 tripli), e un bat-first NON difende anche 100. Il vero
// 96 OVR è il "battitore completo" (contatto+potenza+occhio elite, ma lento e
// difesa media), raro. I tilt danno la forma (media, ~somma zero); il LIVELLO
// viene dal talento base uniforme.
const BATTER_ARCHETYPES: Array<{ upto: number; a: Archetype }> = [
  // slugger d'angolo: potenza pura, lento
  { upto: 0.14, a: { tilt: { power: 16, contact: -8, eye: 2, speed: -16 }, w: { power: 1, contact: 0.55, eye: 0.6, speed: 0.08, fielding: 0.15, arm: 0.3 } } },
  // pura potenza / three-true-outcomes: tanti HR e BB, media bassa
  { upto: 0.22, a: { tilt: { power: 18, eye: 8, contact: -18, speed: -14 }, w: { power: 1, eye: 0.8, contact: 0.2, speed: 0.05, fielding: 0.15, arm: 0.25 } } },
  // contatto / slap hitter: media alta, poca potenza
  { upto: 0.38, a: { tilt: { contact: 16, power: -16, eye: 2, speed: 4 }, w: { contact: 1, power: 0.15, eye: 0.6, speed: 0.5, fielding: 0.4, arm: 0.35 } } },
  // occhio / OBP
  { upto: 0.48, a: { tilt: { eye: 18, power: -4, contact: -4 }, w: { eye: 1, contact: 0.5, power: 0.5, speed: 0.3, fielding: 0.35, arm: 0.35 } } },
  // velocista / leadoff: tante rubate e tripli, pochissima potenza
  { upto: 0.62, a: { tilt: { speed: 20, power: -20, contact: 4, eye: 2 }, w: { speed: 1, power: 0.05, contact: 0.5, eye: 0.5, fielding: 0.6, arm: 0.4 } } },
  // battitore completo (RARO): il vero 96 OVR — elite col bastone, lento, difesa media
  { upto: 0.67, a: { tilt: { power: 8, contact: 6, eye: 6, speed: -14 }, w: { contact: 1, power: 1, eye: 1, speed: 0.15, fielding: 0.25, arm: 0.3 } } },
  // guanto-first: difesa/braccio elite, bastone modesto
  { upto: 0.80, a: { tilt: { fielding: 14, arm: 10, speed: 6, contact: -6, power: -10 }, w: { fielding: 1, arm: 0.9, speed: 0.7, contact: 0.35, power: 0.2, eye: 0.4 } } },
  // equilibrato: nessun tilt, specializzazione moderata su tutto
  { upto: 1.01, a: { tilt: {}, w: { contact: 0.7, power: 0.65, eye: 0.65, speed: 0.5, fielding: 0.5, arm: 0.5 } } },
];
function batterArchetype(rng: Rng): Archetype {
  const r = rng.next();
  for (const { upto, a } of BATTER_ARCHETYPES) if (r < upto) return a;
  return BATTER_ARCHETYPES[BATTER_ARCHETYPES.length - 1].a;
}

function makeBatterRatings(rng: Rng, position: Position, teamTalent = 0, specBonus = 0): BatterRatings {
  // Due componenti separate:
  //  - `base` = LIVELLO uniforme (talento di squadra + rumore individuale): sposta
  //    tutte le doti insieme, dà la varietà d'overall.
  //  - `spec` = bonus di SPECIALIZZAZIONE (coda-gemma ~4% + bias-stella): fluisce
  //    nelle doti CORE dell'archetipo (peso ~1) e resta smorzato sulle OFF-TYPE
  //    (peso basso). È la chiave: un elite diventa uno SPECIALISTA, non un maxato
  //    ovunque. Entrambe centrate su 0 sulla popolazione → aggregati di lega fermi.
  const gem = rng.next() < 0.04 ? Math.abs(rng.gauss(0, 1)) * 9 + 6 : 0;
  const spec = gem + specBonus;
  const base = teamTalent + rng.gauss(0, 7);
  const shape = POS_SHAPE[position] ?? { field: 0, power: 0, speed: 0, arm: 0 };
  const a = batterArchetype(rng);
  const draw = (dote: Dote6, sd: number, shapeBonus = 0) =>
    clampRating(
      RATING_AVG + base + shapeBonus + (a.tilt[dote] ?? 0) + spec * (a.w[dote] ?? 0.6) + rng.gauss(0, sd),
    );
  return {
    contact: draw('contact', 6.5),
    power: draw('power', 7.5, shape.power),
    eye: draw('eye', 6.5),
    speed: draw('speed', 8.5, shape.speed),
    fielding: draw('fielding', 9, shape.field),
    arm: draw('arm', 9, shape.arm),
  };
}

// Tilt per-dote dell'archetipo di rilievo (bullpen): sposta le caratteristiche
// che DEFINISCONO il tipo (long reliever = resistenza alta, closer = dominio) —
// coerenza di ruolo, non doti a caso. A somma ~0 sulla popolazione (non gonfia
// gli aggregati). `stamina` agisce sulla base-resistenza del ruolo.
type PitchTilt = Partial<Pick<PitcherRatings, 'stuff' | 'control' | 'movement' | 'groundball' | 'stamina'>>;

type PSkill = 'stuff' | 'control' | 'movement' | 'groundball';
interface PitchArchetype {
  tilt: Partial<Record<PSkill, number>>;
  w: Partial<Record<PSkill, number>>;
}
// Archetipi lanciatore: come i battitori, un lanciatore è uno SPECIALISTA, non un
// 70/75-ovunque. Il bonus di specializzazione fluisce nel mestiere CORE (peso ~1)
// ed è smorzato sulle doti opposte (peso basso): il power-pitcher fa tanti K ma
// controlla peggio; il finesse pochi BB e poche valide ma pochi K; il selvaggio ha
// stoffa elite e concede tante BB. La RESISTENZA è a parte (indipendente, sotto).
const PITCHER_ARCHETYPES: Array<{ upto: number; a: PitchArchetype }> = [
  // power / strikeout: tanti K, controllo così così
  { upto: 0.22, a: { tilt: { stuff: 14, control: -10, movement: 2 }, w: { stuff: 1, control: 0.3, movement: 0.6, groundball: 0.5 } } },
  // controllo / finesse (pitch to contact): pochi BB e poche valide, meno K
  { upto: 0.42, a: { tilt: { control: 14, movement: 8, stuff: -14 }, w: { control: 1, movement: 0.85, stuff: 0.2, groundball: 0.6 } } },
  // sinkerballer / palla a terra: pochi HR, controllo discreto, stoffa media
  { upto: 0.58, a: { tilt: { groundball: 16, control: 4, stuff: -6 }, w: { groundball: 1, control: 0.6, stuff: 0.4, movement: 0.5 } } },
  // flamethrower selvaggio: stoffa elite ma tante BB (il "forte ma concede BB")
  { upto: 0.68, a: { tilt: { stuff: 16, control: -16, movement: -2 }, w: { stuff: 1, control: 0.12, movement: 0.5, groundball: 0.45 } } },
  // ace completo (RARO): stoffa+controllo+movimento alti insieme
  { upto: 0.74, a: { tilt: { stuff: 6, control: 6, movement: 6 }, w: { stuff: 1, control: 1, movement: 1, groundball: 0.5 } } },
  // equilibrato
  { upto: 1.01, a: { tilt: {}, w: { stuff: 0.6, control: 0.6, movement: 0.6, groundball: 0.5 } } },
];
function pitcherArchetype(rng: Rng): PitchArchetype {
  const r = rng.next();
  for (const { upto, a } of PITCHER_ARCHETYPES) if (r < upto) return a;
  return PITCHER_ARCHETYPES[PITCHER_ARCHETYPES.length - 1].a;
}

function makePitcherRatings(
  rng: Rng,
  teamTalent = 0,
  specBonus = 0,
  tilt: PitchTilt = {},
): PitcherRatings {
  // base = livello uniforme; spec = specializzazione (gemma + stella) pesata per
  // dote dall'archetipo (`tilt` strutturale del ruolo — es. closer power — si somma).
  const gem = rng.next() < 0.04 ? Math.abs(rng.gauss(0, 1)) * 9 + 6 : 0;
  const spec = gem + specBonus;
  // Centro leggermente sotto la media: in partita si affrontano soprattutto i
  // MIGLIORI bracci (i 5 partenti selezionati), quindi un livello base un filo più
  // basso mantiene l'epoca "alta offesa" senza rendere i partenti dominanti.
  const base = teamTalent + rng.gauss(0, 7.5) - 1.5;
  const a = pitcherArchetype(rng);
  const skill = (dote: PSkill, sd: number, extra = 0) =>
    clampRating(
      RATING_AVG + base + extra + (a.tilt[dote] ?? 0) + (tilt[dote] ?? 0) + spec * (a.w[dote] ?? 0.6) + rng.gauss(0, sd),
    );
  return {
    stuff: skill('stuff', 8),
    control: skill('control', 8),
    movement: skill('movement', 8),
    groundball: skill('groundball', 9),
    // RESISTENZA come RATING intrinseco, INDIPENDENTE da bravura E ruolo: centrata
    // sulla media con varianza AMPIA (sd 14) → si va dai bracci da 1 ripresa
    // (~45) ai cavalli da 220 inning (~95). Il RUOLO (SP/RP) e la soglia effettiva
    // di battitori vengono assegnati DOPO, dallo slot (allocazione + deriveStamina),
    // così i migliori bracci CON resistenza fanno i partenti — non i reliever forti.
    stamina: clampRating(RATING_AVG + (tilt.stamina ?? 0) + rng.gauss(0, 14)),
    // Difesa del lanciatore: un lanciatore NON difende come un interno di ruolo.
    // Centro ben SOTTO la media (~57) con coda a destra: i più sono difensori
    // modesti, qualcuno (tipo Maddux) è ottimo. Pesa 0.05 nell'overall.
    fielding: clampRating(RATING_AVG - 13 + rng.gauss(0, 9)),
  };
}

/** Assegna il ruolo effettivo e ricalcola la soglia battitori dal RATING di
 *  Resistenza per quel ruolo (stessa logica di `asRole` in arrangement.ts, ma per
 *  la generazione). */
function setPitcherRole(p: Pitcher, role: PitcherRole): Pitcher {
  return { ...p, role, stamina: deriveStamina(p.ratings.stamina, role) };
}

// Un braccio è SWINGMAN (doppio ruolo SP/RP) quando ha resistenza da PARTENZA e
// insieme qualità/predisposizione da rilievo: può fare entrambi. Sotto la soglia di
// resistenza è solo rilievo; il cavallo puro o l'asso restano SP. Serve al giocatore
// per sapere chi può spostare tra rotazione e bullpen.
export function swingCapable(r: PitcherRatings): boolean {
  return r.stamina >= 60 && r.stamina <= 82 && pitcherOverall(r) >= 52;
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

// Età di un giocatore generato quando NON c'è una finestra d'età di slot (usata
// per battitori e rilievi; i partenti hanno finestre per-slot da SP_SLOTS). NON
// uniforme (il vecchio rng.int(21,37) dava media 29 piatta, tanti 37enni quanti
// 27enni): la realtà MLB è una campana asimmetrica col picco a metà 20 e coda a
// destra. Split-normal centrata a 27 (σ sinistra 3.0, destra 5.5) clampata a
// [20,40]: media ~28 (un filo sotto la MLB reale, "al ribasso"), moda 26, estremi
// 20-21 e 38-40 possibili ma rari (~1-2%).
function makeAge(rng: Rng): number {
  const z = rng.gauss(0, 1);
  const spread = z >= 0 ? 5.5 : 3.0;
  return Math.round(clamp(27 + z * spread, 20, 40));
}

function makeBatter(
  rng: Rng,
  names: NameFactory,
  id: string,
  position: Position,
  teamTalent = 0,
  talentBias = 0,
  ageSkew = 0,
): Batter {
  // Il DH non e' un ruolo difensivo, e' uno slot di battuta: spesso lo occupa la
  // riserva di un altro ruolo che oggi riposa il guanto. Quindi gli diamo una
  // VERA posizione difensiva naturale (secondaria) e ne deriviamo doti e difesa,
  // invece del vuoto difensivo fisso.
  const isDH = position === 'DH';
  const ratingsPos = isDH ? rng.pick(DH_HOME_POSITIONS) : position;
  // Il bias-stella entra come bonus di SPECIALIZZAZIONE (pesato per dote nell'
  // archetipo), non come lift uniforme: una stella è elite nel SUO mestiere.
  const ratings = makeBatterRatings(rng, ratingsPos, teamTalent, talentBias);
  const stats = deriveBatterStats(ratings);
  // Distribuzione età realistica (makeAge) + profilo età della franchigia (ageSkew).
  const age = Math.round(clamp(makeAge(rng) + ageSkew, 20, 40));
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
  ageRange?: [number, number],
  ageSkew = 0,
  tilt: PitchTilt = {},
): Pitcher {
  // Il bias-stella (asso) entra come bonus di SPECIALIZZAZIONE, pesato per dote.
  const ratings = makePitcherRatings(rng, teamTalent, talentBias, tilt);
  const stats = derivePitcherStats(ratings);
  // Finestra d'età di slot presente (partenti SP_SLOTS/depth) → uniforme nella
  // finestra voluta; altrimenti (rilievi) → distribuzione realistica makeAge.
  // In più il profilo età della franchigia (ageSkew).
  const age = ageRange
    ? clamp(rng.int(ageRange[0], ageRange[1]) + ageSkew, 21, 41)
    : Math.round(clamp(makeAge(rng) + ageSkew, 20, 40));
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

// Allocazione per merito nei livelli di rosa. I bias di SP_SLOTS/teamTalent
// riducono ma NON eliminano il caso in cui la coda-gemma (~4% in make*Ratings)
// fa nascere una stella tra panca/riserve mentre un titolare debole parte
// (il "Cody Mitchell 5★ tra i Disponibili"). Qui, DOPO la generazione,
// garantiamo che i migliori siano attivi: si ordina dentro OGNI gruppo omogeneo
// (stessa posizione per i battitori, stesso ruolo per i lanciatori) e si assegna
// dal tier più alto al più basso. Popolazione invariata (stessi ruoli/posizioni,
// stesso teamTalent) → aggregati di lega invariati: cambia solo QUALE slot occupa
// ciascuno.
type BatterTier = 'lineup' | 'bench' | 'reserve';
const BATTER_TIER_RANK: Record<BatterTier, number> = { lineup: 0, bench: 1, reserve: 2 };
const BATTER_SLOTS: Array<{ tier: BatterTier; pos: Position }> = [
  ...LINEUP_POSITIONS.map((pos) => ({ tier: 'lineup' as BatterTier, pos })),
  ...BENCH_POSITIONS.map((pos) => ({ tier: 'bench' as BatterTier, pos })),
  ...DEPTH_BATTER_POSITIONS.map((pos) => ({ tier: 'reserve' as BatterTier, pos })),
];

// Assegna i 9 titolari alle 9 posizioni del lineup massimizzando l'overall
// valutato ALLA posizione (`ratingsAtPosition`: giocare fuori ruolo naturale
// penalizza il fielding). Un titolare può scivolare sulla 2ª posizione se il
// totale sale, e il DH tende al miglior bat-first (al DH non si usa il guanto).
// Solo permutazione dei 9 già scelti (parte da tutti-al-naturale, valida, e
// migliora con swap 2-opt che rispettano `canOccupy`): non tocca panca né
// copertura. Chi si sposta porta la posizione naturale come secondaria.
function alignLineupDefense(players: Batter[]): Batter[] {
  const slots = players.map((b) => b.position);
  const n = players.length;
  const ovrAt = (i: number, j: number): number =>
    canOccupy(players[i], slots[j]) ? batterOverall(ratingsAtPosition(players[i], slots[j])) : -1e9;
  const assign = players.map((_, i) => i); // assign[j] = indice giocatore nello slot j
  let improved = true;
  while (improved) {
    improved = false;
    for (let a = 0; a < n && !improved; a++) {
      for (let b = a + 1; b < n; b++) {
        const before = ovrAt(assign[a], a) + ovrAt(assign[b], b);
        const after = ovrAt(assign[b], a) + ovrAt(assign[a], b);
        if (after > before + 1e-9) {
          [assign[a], assign[b]] = [assign[b], assign[a]];
          improved = true;
          break;
        }
      }
    }
  }
  return assign.map((pi, j) => {
    const b = players[pi];
    const pos = slots[j];
    if (pos === b.position) return b;
    return { ...b, position: pos, secondaryPosition: b.position, ratings: ratingsAtPosition(b, pos) };
  });
}

/** Alza uniformemente le doti (preserva l'archetipo) finche' l'overall raggiunge
 *  `floor`; ri-deriva stat e stipendio. No-op se gia' sopra. Muta in place. */
function floorBatter(b: Batter, floor: number): void {
  const cur = batterOverall(b.ratings);
  if (cur >= floor) return;
  const d = floor - cur;
  b.ratings = {
    contact: clampRating(b.ratings.contact + d),
    power: clampRating(b.ratings.power + d),
    eye: clampRating(b.ratings.eye + d),
    speed: clampRating(b.ratings.speed + d),
    fielding: clampRating(b.ratings.fielding + d),
    arm: clampRating(b.ratings.arm + d),
  };
  b.stats = deriveBatterStats(b.ratings);
  const ovr = batterOverall(b.ratings);
  b.salary = salaryFor(ovr, b.age);
  b.potential = Math.max(b.potential, ovr);
}
function floorPitcher(p: Pitcher, floor: number): void {
  const cur = pitcherOverall(p.ratings);
  if (cur >= floor) return;
  const d = floor - cur;
  p.ratings = {
    stuff: clampRating(p.ratings.stuff + d),
    control: clampRating(p.ratings.control + d),
    movement: clampRating(p.ratings.movement + d),
    groundball: clampRating(p.ratings.groundball + d),
    stamina: clampRating(p.ratings.stamina + d),
    fielding: clampRating(p.ratings.fielding + d),
  };
  p.stats = derivePitcherStats(p.ratings);
  p.stamina = deriveStamina(p.ratings.stamina, p.role);
  const ovr = pitcherOverall(p.ratings);
  p.salary = salaryFor(ovr, p.age);
  p.potential = Math.max(p.potential, ovr);
}

export function generateTeamFromFranchise(rng: Rng, f: Franchise): Team {
  // Una fabbrica di nomi per squadra: nomi unici, cognomi vari.
  const names = makeNameFactory(rng);
  // TALENTO di squadra MORBIDO (qualita' della PROFONDITA'): sposta lievemente
  // tutta la rosa. La differenza forte fra squadre viene dal NUMERO di stelle e
  // dalla profondita', non da uno shift uniforme. Centrato su 0: media di lega resta.
  const teamTalent = clamp(rng.gauss(0, 2.5), -6, 6);
  // PROFILO D'ETA' della franchigia (win-now vecchia vs rebuild giovane): sposta il
  // PAYROLL via youthFactor SENZA toccare la forza → squadre cheap-good ed
  // expensive-mediocre. Attenuato (σ2.0, ±4) perché si somma alla distribuzione
  // età già realistica di makeAge: con il ±6 originale (tarato sull'uniforme) le
  // medie-squadra diventavano assurde (22→36); così restano ~25-31 come in MLB.
  const ageSkew = clamp(Math.round(rng.gauss(0, 2.0)), -4, 4);
  // STELLE GARANTITE: ogni squadra, anche la peggiore, ha 1-3 franchise player (mai
  // una rosa tutta <80). Le migliori ne hanno di piu' (teamTalent alza la 3a). ~1/3
  // dei team con 2+ stelle ne spende una sull'asso (bonus ridotto, asso ~85).
  const starCount = 1 + (rng.next() < 0.55 ? 1 : 0) + (rng.next() < 0.28 + teamTalent * 0.03 ? 1 : 0);
  const aceStar = starCount >= 2 && rng.next() < 0.32;
  const starBats = starCount - (aceStar ? 1 : 0);
  const starBias = () => clamp(rng.gauss(19, 3), 14, 26);
  const starIdx = new Set<number>();
  while (starIdx.size < starBats) starIdx.add(rng.int(0, LINEUP_POSITIONS.length - 1));
  // Le posizioni (di lineup) che ospitano una stella garantita.
  const starPositions = new Set<Position>();
  for (const i of starIdx) starPositions.add(LINEUP_POSITIONS[i]);

  // --- Battitori: genera per posizione (best-starts: il MIGLIORE di ogni posizione
  // parte, la gemma non finisce sepolta), con la stella garantita assegnata al
  // titolare della sua posizione. Poi allineamento difensivo (2ª posizione, DH al
  // miglior bat) e ordine di battuta realistico (autoLineup). ageSkew su tutti. ---
  const slotsByPos = new Map<Position, BatterTier[]>();
  for (const s of BATTER_SLOTS) {
    const arr = slotsByPos.get(s.pos) ?? [];
    arr.push(s.tier);
    slotsByPos.set(s.pos, arr);
  }
  const lineupRaw: Batter[] = [];
  const bench: Batter[] = [];
  const reserveBatters: Batter[] = [];
  const batterBucket: Record<BatterTier, Batter[]> = { lineup: lineupRaw, bench, reserve: reserveBatters };
  for (const [pos, tiers] of slotsByPos) {
    let starLeft = starPositions.has(pos) ? 1 : 0;
    const cands = tiers.map((_, k) => {
      const bias = starLeft > 0 ? ((starLeft = 0), starBias()) : 0;
      return makeBatter(rng, names, `${f.abbrev}-${pos}-${k}`, pos, teamTalent, bias, ageSkew);
    });
    cands.sort((a, b) => batterOverall(b.ratings) - batterOverall(a.ratings));
    const order = [...tiers].sort((x, y) => BATTER_TIER_RANK[x] - BATTER_TIER_RANK[y]);
    order.forEach((tier, i) => batterBucket[tier].push(cands[i]));
  }
  const lineup = autoLineup(alignLineupDefense(lineupRaw));

  // --- Lanciatori: un solo POOL di bracci (resistenza = rating intrinseco ampio).
  // I migliori CON resistenza fanno i PARTENTI (ruolo/endurance dallo slot), così
  // non nascono reliever più forti dei titolari e la rotazione ha varianza vera di
  // resistenza (cavalli e partenti corti). Chi ha stoffa ma non regge → bullpen.
  // L'eventuale asso-stella entra nel pool col bonus di specializzazione. ---
  const arms = Array.from({ length: 15 }, (_, i) =>
    makePitcher(
      rng,
      names,
      `${f.abbrev}-P${i}`,
      'SP',
      teamTalent,
      aceStar && i === 0 ? starBias() * 0.65 : 0,
      undefined,
      ageSkew,
    ),
  );
  // Attitudine a PARTIRE = qualità + RESISTENZA con peso alto (chi non regge non
  // parte; i bracci top-stoffa ma corti finiscono in bullpen, dove esplodono).
  const startScore = (p: Pitcher) => pitcherOverall(p.ratings) + 0.9 * (p.ratings.stamina - RATING_AVG);
  const byStart = [...arms].sort((a, b) => startScore(b) - startScore(a));
  const rotation = byStart
    .slice(0, 5)
    .map((p) => setPitcherRole(p, 'SP'))
    .sort((a, b) => pitcherOverall(b.ratings) - pitcherOverall(a.ratings)); // n.1 = asso
  const rest = byStart.slice(5);
  // Closer: il miglior braccio rimasto orientato al DOMINIO (esplode in 1 ripresa).
  const closerScore = (p: Pitcher) => pitcherOverall(p.ratings) + 0.4 * (p.ratings.stuff - RATING_AVG);
  const restByCloser = [...rest].sort((a, b) => closerScore(b) - closerScore(a));
  const closer = setPitcherRole(restByCloser[0], 'CL');
  const bullpen: Pitcher[] = [...restByCloser.slice(1, 6).map((p) => setPitcherRole(p, 'RP')), closer];
  const reservePitchers: Pitcher[] = restByCloser.slice(6).map((p) => setPitcherRole(p, 'RP'));

  // Pavimenti realistici: nessun partente titolare sotto ROT_FLOOR (via i bracci
  // da Tripla-A), e almeno una stella 80+ in lineup (rete di sicurezza se le
  // stelle iniettate sono uscite sfortunate sotto soglia).
  for (const p of rotation) floorPitcher(p, ROT_FLOOR);
  for (const b of lineup) floorBatter(b, LINEUP_FLOOR);
  if (!lineup.some((b) => batterOverall(b.ratings) >= STAR_FLOOR)) {
    const best = lineup.reduce((a, b) =>
      batterOverall(b.ratings) >= batterOverall(a.ratings) ? b : a,
    );
    floorBatter(best, STAR_FLOOR);
  }

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

/**
 * Ruota la rotazione perché il PARTENTE del giorno vari lungo la stagione.
 * `makeSide` (engine) fa sempre partire `rotation[0]`: con la rotazione ordinata
 * (n.1 = asso), senza ruotare OGNI squadra lancerebbe l'asso in OGNI partita
 * (ambiente-punti falsato). Con lo slot `n % len` in testa, in stagione i 5
 * partenti girano equamente. Ritorna una COPIA (shallow): non muta l'originale.
 */
export function withRotationStarter(team: Team, n: number): Team {
  const len = team.rotation.length;
  if (len <= 1) return team;
  const k = ((n % len) + len) % len;
  if (k === 0) return team;
  return { ...team, rotation: [...team.rotation.slice(k), ...team.rotation.slice(0, k)] };
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
