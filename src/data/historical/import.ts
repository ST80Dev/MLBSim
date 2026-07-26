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
  salaryFromOverall,
} from '../../engine/ratings';
import { splitName } from '../../engine/names';
import { FRANCHISES } from '../franchises';
import type { HistBatLine, HistPitLine, HistTeam } from './season1999';

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

function batterFrom(l: HistBatLine, id: string): Batter {
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
    potential: ovr, // stagione reale importata: attuale, non prospetto
    salary: salaryFromOverall(ovr),
    retired: false,
  };
}

function pitcherFrom(l: HistPitLine, id: string): Pitcher {
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
    potential: ovr,
    salary: salaryFromOverall(ovr),
    retired: false,
  };
}

export interface ImportedTeam {
  team: Team;
  /** Linee reali storiche, per il confronto (indicizzate per id giocatore). */
  realBat: Map<string, HistBatLine>;
  realPit: Map<string, HistPitLine>;
}

/** Costruisce una squadra pronta al motore da una rosa storica. */
export function importHistoricalTeam(h: HistTeam): ImportedTeam {
  const f = FRANCHISES.find((x) => x.id === h.franchiseId);
  if (!f) throw new Error(`Franchigia sconosciuta: ${h.franchiseId}`);

  const realBat = new Map<string, HistBatLine>();
  const realPit = new Map<string, HistPitLine>();

  const lineup: Batter[] = h.batters.map((l, i) => {
    const id = `${f.abbrev}${h.season}-B${i}`;
    realBat.set(id, l);
    return batterFrom(l, id);
  });

  const starters = h.pitchers.filter((p) => p.role === 'SP');
  const relievers = h.pitchers.filter((p) => p.role !== 'SP');

  const rotation: Pitcher[] = starters.map((l, i) => {
    const id = `${f.abbrev}${h.season}-SP${i}`;
    realPit.set(id, l);
    return pitcherFrom(l, id);
  });
  const bullpen: Pitcher[] = relievers.map((l, i) => {
    const id = `${f.abbrev}${h.season}-RP${i}`;
    realPit.set(id, l);
    return pitcherFrom(l, id);
  });

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
    bench: [],
    rotation,
    bullpen,
    usesDH: true,
    reserveBatters: [],
    reservePitchers: [],
  };

  return { team, realBat, realPit };
}
