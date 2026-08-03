import type {
  Batter, Pitcher, Team, Position, PitcherRole, BatterRatings, PitcherRatings, Hand, ThrowHand,
} from '../engine/types';
import {
  clampRating, projectPotential, salaryFor, deriveBatterStats, derivePitcherStats,
  deriveStamina, batterOverall, pitcherOverall,
} from '../engine/ratings';
import { makeNameFactory } from './generator';
import { playerValue } from '../engine/value';
import { winPct, type WLRecord } from './season';
import { makeRng, type Rng } from '../engine/rng';
import type { DebutName } from './historical/debutants';

// ---------------------------------------------------------------------------
// DRAFT INVERSO (Fase 5A, step 4) — semplificato.
//
// Principio (docs/franchise.md § Draft): importi il passato, SIMULI il futuro. I
// prospetti entrano GIOVANI e GREZZI, con un POTENZIALE stimato ampio (headroom da
// giovani) ma NON certo: chi sboccia lo decide l'aging (breakout/bust). Ordine
// INVERSO alla classifica (la peggiore sceglie per prima → prospetti migliori ai
// deboli): e' l'"handicap" strutturale del riequilibrio. I prospetti entrano nella
// DEPTH (reserveBatters/reservePitchers), non nei 25 attivi: la taglia si
// riconcilia al finalize (niente overfill).
//
// Puro e deterministico: la classe si genera dal seed, l'assegnazione e' un
// best-player-available (per playerValue) a ordine di classifica inversa.
// ---------------------------------------------------------------------------

/** Quanti giri di draft (ogni squadra prende 1 prospetto per giro). */
export const DEFAULT_DRAFT_ROUNDS = 3;

const DRAFT_POSITIONS: Position[] = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
const DRAFT_AGE_MIN = 18;
const DRAFT_AGE_MAX = 22;

const hand = (rng: Rng): Hand => (rng.next() < 0.28 ? 'L' : 'R');
const throwHand = (rng: Rng): ThrowHand => (rng.next() < 0.25 ? 'L' : 'R');

/** Nome di un prospetto: fittizio (solo `full/first/last`) o reale (con mano nota,
 *  dal pool storico dei debuttanti). La mano reale, se presente, sostituisce l'RNG. */
interface ProspectName {
  full: string;
  first: string;
  last: string;
  bats?: Hand;
  throws?: ThrowHand;
}

/** Sei doti attorno a un livello grezzo (prospetto: abilita' attuale bassa). */
function batRatingsAround(rng: Rng, level: number): BatterRatings {
  const d = () => clampRating(rng.gauss(level, 4));
  return { contact: d(), power: d(), eye: d(), speed: d(), fielding: d(), arm: d() };
}
function pitRatingsAround(rng: Rng, level: number): PitcherRatings {
  const d = () => clampRating(rng.gauss(level, 4));
  return { stuff: d(), control: d(), movement: d(), groundball: d(), stamina: d(), fielding: d() };
}

function makeProspectBatter(rng: Rng, name: ProspectName, id: string): Batter {
  // Livello grezzo: dal sotto-replacement al prospetto solido. L'upside vero sta
  // nel POTENZIALE (giovane → headroom ampio), non nell'abilita' odierna.
  const level = Math.min(66, Math.max(40, rng.gauss(50, 7)));
  const ratings = batRatingsAround(rng, level);
  const position = rng.pick(DRAFT_POSITIONS);
  const age = rng.int(DRAFT_AGE_MIN, DRAFT_AGE_MAX);
  const ovr = batterOverall(ratings, position);
  return {
    id, name: name.full, firstName: name.first, lastName: name.last,
    bats: name.bats ?? hand(rng), position, ratings, stats: deriveBatterStats(ratings),
    age, potential: projectPotential(rng, ovr, age), salary: salaryFor(ovr, age), retired: false,
  };
}

function makeProspectPitcher(rng: Rng, name: ProspectName, id: string): Pitcher {
  const level = Math.min(66, Math.max(40, rng.gauss(50, 7)));
  const ratings = pitRatingsAround(rng, level);
  const role: PitcherRole = rng.next() < 0.7 ? 'SP' : 'RP';
  const age = rng.int(DRAFT_AGE_MIN, DRAFT_AGE_MAX);
  const ovr = pitcherOverall(ratings);
  return {
    id, name: name.full, firstName: name.first, lastName: name.last,
    throws: name.throws ?? throwHand(rng), role, ratings, stats: derivePitcherStats(ratings),
    stamina: deriveStamina(ratings.stamina, role),
    age, potential: projectPotential(rng, ovr, age), salary: salaryFor(ovr, age), retired: false,
  };
}

/** Copia mescolata (Fisher-Yates) del pool nomi, con RNG DEDICATO (seed diverso):
 *  i nomi variano tra leghe senza toccare lo stream che genera doti/ruoli/età →
 *  a parità di seed i rating dei prospetti restano identici, cambia solo l'etichetta. */
function shuffledNames(list: DebutName[], seed: number): DebutName[] {
  const r = makeRng((seed ^ 0x9e3779b1) >>> 0);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = r.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface DraftClass {
  batters: Batter[];
  pitchers: Pitcher[];
}

/**
 * Genera una classe di draft di `size` prospetti (~60% battitori), giovani e
 * grezzi. Deterministica dal seed. La classe *contiene* il talento; quale prospetto
 * lo realizzera' lo decide l'aging (nessun draft "col senno di poi").
 *
 * `realNames` (modalità STORICA): pool di NOMI reali dei debuttanti dell'annata
 * d'ingresso (docs/franchise.md § Draft in modalità STORICA). Se presente, i
 * prospetti prendono nome+mano reali (rating comunque CIECHI: nessuna preveggenza);
 * esaurito il pool si ricade sui nomi fittizi. Assente → tutto fittizio (lega generata).
 */
export function generateDraftClass(seed: number, size: number, realNames?: DebutName[]): DraftClass {
  const rng = makeRng((seed ^ 0x5f356495) >>> 0);
  const fictional = makeNameFactory(rng);
  const pool = realNames && realNames.length ? shuffledNames(realNames, seed) : null;
  let pi = 0;
  const nextName = (): ProspectName => {
    if (pool && pi < pool.length) {
      const d = pool[pi++];
      return { full: `${d.first} ${d.last}`, first: d.first, last: d.last, bats: d.bats, throws: d.throws };
    }
    return fictional.next();
  };
  const batters: Batter[] = [];
  const pitchers: Pitcher[] = [];
  for (let i = 0; i < size; i++) {
    const nm = nextName();
    if (rng.next() < 0.6) batters.push(makeProspectBatter(rng, nm, `DR${seed % 100000}-B${i}`));
    else pitchers.push(makeProspectPitcher(rng, nm, `DR${seed % 100000}-P${i}`));
  }
  return { batters, pitchers };
}

/** Ordine di scelta: classifica INVERSA (peggior record prima), spareggio per id. */
export function inverseDraftOrder(teams: Team[], standings: Record<string, WLRecord>): Team[] {
  const rec = (id: string): WLRecord => standings[id] ?? { w: 0, l: 0 };
  return [...teams].sort((a, b) => {
    const pa = winPct(rec(a.id));
    const pb = winPct(rec(b.id));
    return pa - pb || a.id.localeCompare(b.id);
  });
}

function cloneTeamDepth(t: Team): Team {
  return { ...t, reserveBatters: [...t.reserveBatters], reservePitchers: [...t.reservePitchers] };
}

/**
 * Draft inverso: `rounds` giri, ogni squadra prende (nell'ordine inverso) il
 * miglior prospetto disponibile per `playerValue` — best-player-available. I
 * prospetti entrano nella DEPTH della squadra. Ritorna NUOVE squadre (non muta
 * l'input). `standings`: mappa teamId → record (0-0 se assente).
 */
export function runInverseDraft(
  teams: Team[],
  standings: Record<string, WLRecord>,
  seed: number,
  rounds: number = DEFAULT_DRAFT_ROUNDS,
  realNames?: DebutName[],
): { teams: Team[]; picks: Array<{ round: number; teamId: string; playerId: string }> } {
  const order = inverseDraftOrder(teams, standings);
  const cls = generateDraftClass(seed, teams.length * rounds + teams.length, realNames); // margine
  const available: Array<Batter | Pitcher> = [...cls.batters, ...cls.pitchers].sort(
    (a, b) => playerValue(b) - playerValue(a) || a.id.localeCompare(b.id),
  );
  const byId = new Map(order.map((t) => [t.id, cloneTeamDepth(t)] as const));
  const picks: Array<{ round: number; teamId: string; playerId: string }> = [];

  for (let r = 0; r < rounds; r++) {
    for (const t of order) {
      const pick = available.shift();
      if (!pick) break;
      const team = byId.get(t.id)!;
      if ('role' in pick) team.reservePitchers.push(pick);
      else team.reserveBatters.push(pick);
      picks.push({ round: r, teamId: t.id, playerId: pick.id });
    }
  }

  // Mantiene l'ordine originale delle squadre in output.
  return { teams: teams.map((t) => byId.get(t.id)!), picks };
}
