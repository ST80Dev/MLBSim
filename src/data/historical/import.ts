import type { Batter, Pitcher, Team } from '../../engine/types';
import {
  ratingsFromBatterStats,
  ratingsFromPitcherStats,
} from '../../engine/statsToRatings';
import {
  deriveBatterStats,
  derivePitcherStats,
  deriveStamina,
  batterOverall,
  pitcherOverall,
  salaryFor,
  projectPotential,
} from '../../engine/ratings';
import { splitName } from '../../engine/names';
import { autoLineup } from '../../engine/lineup';
import { makeRng, type Rng } from '../../engine/rng';
import { FRANCHISES } from '../franchises';
import type { HistBatLine, HistPitLine, HistTeam } from './season1999';

/** Seed deterministico da una stringa (per rendere l'import riproducibile). */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Importatore di una rosa storica.
//
// Pipeline (rispetta "caratteristiche = fonte di verita'"): tabellino reale
//   -> INVERSIONE (statsToRatings) -> rating 20-80
//   -> ri-derivazione (deriveBatterStats/derivePitcherStats) -> stats del motore.
// Le stats del giocatore importato NON sono le reali: sono quelle RI-DERIVATE
// dai rating stimati, cosi' la simulazione gira davvero dai rating (e possiamo
// verificare che "tutto torni" confrontando col reale). Le linee reali restano
// a parte, per il confronto.
// ---------------------------------------------------------------------------

/** Battitore per PA: BF stimato = out + hit + BB + HBP (denominatore dei rate). */
function pitcherBf(l: HistPitLine): number {
  return l.outs + l.h + l.bb + l.hbp;
}

function batterFrom(l: HistBatLine, id: string, rng: Rng): Batter {
  const ratings = ratingsFromBatterStats({
    pa: l.pa,
    h: l.h,
    double: l.double,
    triple: l.triple,
    hr: l.hr,
    bb: l.bb,
    so: l.so,
    hbp: l.hbp,
    sb: l.sb,
    cs: l.cs,
    position: l.pos,
  });
  const stats = deriveBatterStats(ratings, l.pa);
  const ovr = batterOverall(ratings);
  const nm = splitName(l.name);
  return {
    id,
    name: l.name,
    firstName: nm.first,
    lastName: nm.last,
    bats: l.bats,
    position: l.pos,
    ratings,
    stats,
    age: l.age,
    // Potenziale = STIMA incerta eta'-scalata (headroom di crescita), NON il
    // picco reale futuro: dallo snapshot il futuro non e' un replay noto.
    potential: projectPotential(rng, ovr, l.age),
    salary: salaryFor(ovr, l.age),
    retired: false,
  };
}

function pitcherFrom(l: HistPitLine, id: string, rng: Rng): Pitcher {
  const bf = pitcherBf(l);
  const ratings = ratingsFromPitcherStats({
    bf,
    h: l.h,
    hr: l.hr,
    bb: l.bb,
    so: l.so,
    hbp: l.hbp,
    role: l.role,
    gs: l.gs,
  });
  const stats = derivePitcherStats(ratings, bf);
  const ovr = pitcherOverall(ratings);
  const nm = splitName(l.name);
  return {
    id,
    name: l.name,
    firstName: nm.first,
    lastName: nm.last,
    throws: l.throws,
    role: l.role,
    ratings,
    stats,
    stamina: deriveStamina(ratings.stamina, l.role),
    age: l.age,
    potential: projectPotential(rng, ovr, l.age),
    salary: salaryFor(ovr, l.age),
    retired: false,
  };
}

export interface ImportedTeam {
  team: Team;
  /** Linee reali storiche, per il confronto (indicizzate per id giocatore). */
  realBat: Map<string, HistBatLine>;
  realPit: Map<string, HistPitLine>;
}

/**
 * Costruisce una squadra pronta al motore da una rosa storica. Il `seed`
 * (default deterministico da franchigia+annata) pilota SOLO la stima del
 * potenziale: stesso import -> stessi potenziali (riproducibile), ma variato
 * per giocatore. Non tocca i rating (che vengono dal tabellino reale).
 */
export function importHistoricalTeam(h: HistTeam, seed?: number): ImportedTeam {
  const f = FRANCHISES.find((x) => x.id === h.franchiseId);
  if (!f) throw new Error(`Franchigia sconosciuta: ${h.franchiseId}`);

  const rng = makeRng(seed ?? hashSeed(`${h.franchiseId}-${h.season}`));
  const realBat = new Map<string, HistBatLine>();
  const realPit = new Map<string, HistPitLine>();

  // Id STABILE per persona: dal playerID Lahma (`hist-<id>`) così lo stesso
  // giocatore reale mantiene lo stesso id tra rosa, pool e annate. Le fixture a
  // mano (senza `id`) ricadono sullo schema per-squadra-indice.
  const mkBatters = (lines: HistBatLine[] | undefined, tag: string): Batter[] =>
    (lines ?? []).map((l, i) => {
      const id = l.id ? `hist-${l.id}` : `${f.abbrev}${h.season}-${tag}${i}`;
      realBat.set(id, l);
      return batterFrom(l, id, rng);
    });
  const mkPitchers = (lines: HistPitLine[], tag: string): Pitcher[] =>
    lines.map((l, i) => {
      const id = l.id ? `hist-${l.id}` : `${f.abbrev}${h.season}-${tag}${i}`;
      realPit.set(id, l);
      return pitcherFrom(l, id, rng);
    });

  // Il dataset elenca i titolari per casella difensiva; `autoLineup` li dispone
  // in un ordine di battuta plausibile (posizioni invariate).
  const lineup = autoLineup(mkBatters(h.batters, 'B'));
  const bench = mkBatters(h.bench, 'BN');
  const reserveBatters = mkBatters(h.reserveBatters, 'BR');

  // Lo staff attivo si divide per ruolo: SP -> rotazione, RP/CL -> bullpen. I
  // lanciatori di profondità restano fuori dai 25 attivi (role preservato).
  const rotation = mkPitchers(h.pitchers.filter((p) => p.role === 'SP'), 'SP');
  const bullpen = mkPitchers(h.pitchers.filter((p) => p.role !== 'SP'), 'RP');
  const reservePitchers = mkPitchers(h.reservePitchers ?? [], 'PR');

  const team: Team = {
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

  return { team, realBat, realPit };
}
