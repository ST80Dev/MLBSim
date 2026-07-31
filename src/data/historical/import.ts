import type { Batter, Pitcher, PitcherRatings, Team } from '../../engine/types';
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
  clampRating,
  RATING_AVG,
} from '../../engine/ratings';
import { splitName } from '../../engine/names';
import { autoLineup } from '../../engine/lineup';
import { makeRng, clamp, type Rng } from '../../engine/rng';
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
  const ratings = spreadBatter(ratingsFromBatterStats({
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
    fld: l.fld,
    arm: l.arm,
  }), l.rk);
  const stats = deriveBatterStats(ratings, l.pa);
  const ovr = batterOverall(ratings, l.pos);
  const nm = splitName(l.name);
  return {
    id,
    name: l.name,
    firstName: nm.first,
    lastName: nm.last,
    bats: l.bats,
    position: l.pos,
    // Seconda posizione difensiva REALE (dalle Appearances): abilita lo
    // schieramento fuori-ruolo per gestione/ottimizzazione lineup (come il seed).
    ...(l.sec ? { secondaryPosition: l.sec } : {}),
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

// ---------------------------------------------------------------------------
// Boost "affidabilità/vittoria" (SCELTA DI PRODOTTO, solo import storico).
// Oltre ai peripherals, un partente con TANTI inning ed ERA bassa sale un po',
// anche se i K non lo giustificano: gli assi-workhorse (Lima 21-10, Colon 18-5)
// spiccano sopra i comprimari. Usa CONSAPEVOLMENTE l'ERA — che per design è un
// "risultato di contesto" (difesa/park/fortuna) — come compromesso accettato.
// Non tocca i rilievi (pochi inning → workload ~0) né la lega generata (che non
// passa da qui). Tarabile con LG_ERA_BASE / BOOST_MAX_PIT.
// ---------------------------------------------------------------------------
const LG_ERA_BASE = 4.6; // baseline ERA dell'epoca "alta offesa" (~1999)
const BOOST_MAX_PIT = 8; // punti-rating massimi del boost
const PREVENT_SLOPE = 9; // punti-rating per 1.0 di ERA sotto/sopra l'epoca (contesto squadra)

// ---------------------------------------------------------------------------
// ESTENSIONE (stretch) delle code, solo import storico. Le rose reali hanno
// talento aggregato simile → forza-squadra schiacciata (~72). Qui allunghiamo la
// distribuzione dei rating attorno alla media di lega (70): i forti salgono, i
// deboli scendono → più varianza tra le squadre (spread ~4 → ~8). EPOCA-SAFE:
// stiro sia battitori sia lanciatori, e nel sim (Log5) gli estremi si cancellano
// in aggregato — misurato: R/G resta ~5.5, non gonfia. La Resistenza NON si stira
// (è durabilità/ruolo, non qualità). Vedi docs/players-and-ratings § stretch storico.
// ---------------------------------------------------------------------------
const HIST_SPREAD = 1.25;
// Lo stretch riespande il talento compresso, MA con rendimenti decrescenti vicino
// alle sponde: senza taper un profilo già spigoloso (slugger paziente e strikeout-
// prone, es. Glaus C44/P92/O94) veniva spinto fino a 40/100/100 — una caricatura.
// Oltre ±SPREAD_KNEE di deviazione stirata il guadagno cala (×SPREAD_TAPER): la
// fascia comune (dove sta la massa dei tool) è stirata pieno → varianza-squadra
// intatta; solo i tool estremi non saturano più. Vedi docs § stretch storico.
const SPREAD_KNEE = 22;
const SPREAD_TAPER = 0.4;
const spread = (v: number): number => {
  let d = (v - RATING_AVG) * HIST_SPREAD;
  const a = Math.abs(d);
  if (a > SPREAD_KNEE) d = Math.sign(d) * (SPREAD_KNEE + (a - SPREAD_KNEE) * SPREAD_TAPER);
  return clampRating(RATING_AVG + d);
};
// GATE ROOKIE (present-only, niente preveggenza): un esordiente senza track record
// MLB NON riceve lo stretch. Lo stretch riespande il TALENTO PROVATO (compresso dalla
// regressione); un rookie ha una sola annata incerta a definirlo, spesso un mezzo
// anno "caldo" di contatto/velocità che, stirato, saturava i tool e faceva scattare
// il credito specialista → OVR da stella (Singleton/Taveras a 90). Senza stretch i
// tool restano sotto la soglia specialista e il rookie resta "buono ma incerto". La
// sua eventuale ascesa la gestiscono potenziale + aging + sim (NON il futuro reale).
// Costo accettato: abbassa anche i rookie-stella veri — a pari annata sono
// indistinguibili dai fluke senza guardare avanti. NON tocca i giocatori con track record.
const noStretch = (v: number): number => clampRating(v);
function spreadBatter(r: Batter['ratings'], rookie?: boolean): Batter['ratings'] {
  const s = rookie ? noStretch : spread;
  return {
    contact: s(r.contact), power: s(r.power), eye: s(r.eye), speed: s(r.speed),
    // Difesa/Braccio NON si stirano mai: la difesa è REALE (da Fielding.csv,
    // normalizzata per ruolo) e ha già la sua varianza — il ×1.4 la gonfierebbe.
    fielding: r.fielding, arm: r.arm,
  };
}
function spreadPitcher(r: PitcherRatings): PitcherRatings {
  return {
    ...r,
    stuff: spread(r.stuff), control: spread(r.control), movement: spread(r.movement),
    groundball: spread(r.groundball),
    // Difesa NON stirata: è reale (Fielding.csv) o archetipo neutro (70) — il ×1.4
    // la gonfierebbe, come per i battitori.
    fielding: r.fielding,
  };
}

/** Bonus (punti overall) da carico-da-horse × qualità DE-CONTESTUALIZZATA.
 *  Usa il FIP (13·HR + 3·(BB+HBP) − 2·K, peripherals) invece dell'ERA: un
 *  workhorse con ottimi K/BB/HR prende il boost anche dietro una difesa scarsa
 *  (l'ERA reale la assorbe la forza-squadra ibrida, non il rating individuale).
 *
 *  "Horse" = il MASSIMO tra due vie, così l'archetipo è premiato comunque:
 *   - VOLUME: inning totali di stagione (il mangia-inning, Colon/Lima a 240 IP);
 *   - PROFONDITÀ per partenza (BF/GS, la stessa base della Resistenza): un asso
 *     che va in fondo (Halladay, 7+ IP/start, 70 CG in carriera) resta un horse
 *     anche in una stagione ACCORCIATA DA INFORTUNIO (poche partenze, non uscite
 *     brevi). Prima il bonus usava solo il volume totale → puniva le partite
 *     SALTATE, non la durata reale. Il max non toglie mai credito a nessuno. */
function pitcherQualityBonus(l: HistPitLine): number {
  const ip = l.outs / 3;
  if (ip <= 0) return 0;
  const fip = (13 * l.hr + 3 * (l.bb + l.hbp) - 2 * l.so) / ip + 3.2;
  const volume = clamp((ip - 100) / 140, 0, 1); // 0 a 100 IP → 1 a 240 IP
  const bf = pitcherBf(l);
  const depth = l.gs > 0 ? clamp((bf / l.gs - 24) / 9, 0, 1) : 0; // 24→33 BF/start
  const horse = Math.max(volume, depth);
  const fipEdge = clamp((LG_ERA_BASE - fip) / LG_ERA_BASE, -0.4, 0.5);
  const factor = clamp(0.4 + fipEdge, 0, 1);
  return BOOST_MAX_PIT * horse * factor;
}

/** Applica il bonus alle doti che pesano nell'overall (stuff/control/movement
 *  pieno, groundball a metà): il partente diventa coerentemente più efficace. */
function boostPitcher(r: PitcherRatings, bonus: number): PitcherRatings {
  if (bonus <= 0) return r;
  return {
    ...r,
    stuff: clampRating(r.stuff + bonus),
    control: clampRating(r.control + bonus),
    movement: clampRating(r.movement + bonus),
    groundball: clampRating(r.groundball + bonus * 0.5),
  };
}

function pitcherFrom(l: HistPitLine, id: string, rng: Rng): Pitcher {
  const bf = pitcherBf(l);
  const raw = ratingsFromPitcherStats({
    bf,
    h: l.h,
    hr: l.hr,
    bb: l.bb,
    so: l.so,
    hbp: l.hbp,
    role: l.role,
    gs: l.gs,
    g: l.g,
    fld: l.fld,
  });
  // NB: nessun gate-rookie sui lanciatori — non gonfiano da esordienti (il bonus-
  // workload richiede inning, la regressione per campione già doma i micro-campioni)
  // e lo skip-stretch li affosserebbe (un Felix/CC dominante a poche partenze).
  const ratings = spreadPitcher(boostPitcher(raw, pitcherQualityBonus(l)));
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

  // Contesto REALE: prevenzione-punti del team dall'ERA vera (difesa + park + staff,
  // cioè l'edge dei team run-prevention che i peripherals dei singoli non colgono).
  // Alimenta la forza-squadra IBRIDA senza toccare i rating individuali.
  const allPit = [...h.pitchers, ...(h.reservePitchers ?? [])];
  const teamOuts = allPit.reduce((a, p) => a + p.outs, 0);
  const teamER = allPit.reduce((a, p) => a + p.er, 0);
  const teamERA = teamOuts > 0 ? (teamER * 27) / teamOuts : LG_ERA_BASE;
  const prevent = clampRating(70 + (LG_ERA_BASE - teamERA) * PREVENT_SLOPE);

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
    context: { prevent },
  };

  return { team, realBat, realPit };
}

/**
 * Istanzia il POOL FREE AGENT storico: i giocatori reali con minutaggio ma fuori
 * dalle 30 rose attive (dedup: un giocatore = una squadra primaria), convertiti in
 * `Batter[]`/`Pitcher[]` con la STESSA inversione delle rose (stat reali → rating →
 * ri-derivazione + difesa reale + boost/spread). Alimentano il mercato dell'off-
 * season (`startOffseason`): finalmente i "fuori rosa" non spariscono. `id` = `hist-
 * <playerID>` (identità stabile, come nelle rose). Il `seed` pilota solo il
 * potenziale (deterministico per annata). */
export function importHistoricalPool(
  batLines: HistBatLine[],
  pitLines: HistPitLine[],
  seed: number,
): { batters: Batter[]; pitchers: Pitcher[] } {
  const rng = makeRng(seed);
  const batters = batLines.map((l, i) =>
    batterFrom(l, l.id ? `hist-${l.id}` : `fa-b${i}`, rng),
  );
  const pitchers = pitLines.map((l, i) =>
    pitcherFrom(l, l.id ? `hist-${l.id}` : `fa-p${i}`, rng),
  );
  return { batters, pitchers };
}
