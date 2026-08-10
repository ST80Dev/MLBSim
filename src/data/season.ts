import type { Team } from '../engine/types';
import type { GameResult, TeamGameStats } from '../engine/game';
import { createLiveGame, quickSim, toGameResult } from '../engine/game';
import { makeRng } from '../engine/rng';
import { synthesizeStolenBases } from '../engine/leagueSteals';
import { rosterBatters } from '../engine/arrangement';
import { withRotationStarter } from './generator';
import { withFormLineup } from './formLineup';
import type { RotationState, PitcherUsage } from './rotation';
import { createRotation, recordUsage, migrateRotation } from './rotation';

// Stato di STAGIONE: il cuore del principio "gli anni gestiti dall'utente hanno
// statistiche REALI, non derivate dai rating". Qui vivono:
//  - il giorno corrente (a che punto e' la regular season),
//  - i record W-L di TUTTE le squadre (le altre partite del giorno sono
//    quick-simulate cosi' la classifica e' reale),
//  - le statistiche accumulate dei giocatori della squadra gestita, sommate dai
//    box score delle partite realmente giocate.
// I valori derivati dai rating restano solo come backstory (anni non gestiti);
// appena giochi, la "Stagione" si popola da qui.
//
// Puro e testabile: nessuna dipendenza da UI o rete. Usa il motore (quickSim)
// per le partite CPU-vs-CPU del resto della lega.

export interface SeasonBat {
  g: number;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  double: number;
  triple: number;
  hr: number;
  sb: number;
  cs: number;
}

export interface SeasonPit {
  g: number;
  gs: number;
  outs: number;
  bf: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  w: number;
  l: number;
  sv: number;
  svo: number;
}

export interface WLRecord {
  w: number;
  l: number;
}

/** Esito registrato di una gara giocata dall'utente (per il calendario). */
export interface DayResult {
  day: number;
  opponentId: string;
  home: boolean;
  us: number;
  them: number;
}

export interface SeasonState {
  year: number;
  /** Indice 0-based della PROSSIMA gara di regular season da giocare. */
  day: number;
  records: Record<string, WLRecord>;
  bat: Record<string, SeasonBat>;
  pit: Record<string, SeasonPit>;
  /** Esiti delle gare dell'utente, per giorno. */
  results: Record<number, DayResult>;
  /** Rotazione della squadra gestita: uomini nel ciclo (4/5) + riposi. */
  rotation: RotationState;
}

export function createSeason(year = 1): SeasonState {
  return { year, day: 0, records: {}, bat: {}, pit: {}, results: {}, rotation: createRotation() };
}

/**
 * Normalizza una stagione caricata da un save: garantisce lo stato `rotation`
 * (i save precedenti alla feature riposo non ce l'hanno). Ritorna `createSeason`
 * se assente.
 */
export function ensureSeason(s?: SeasonState): SeasonState {
  if (!s) return createSeason();
  // Migra la rotazione al modello `lastUsed` (ricalcolo del riposo alla query): i
  // save nel vecchio schema `availableFrom` — che bloccava il riposo "cotto" con la
  // regola d'epoca — vengono convertiti, così un cambio di regola (es. +4 → +3) vale
  // anche su una stagione GIÀ IN CORSO. Idempotente.
  return { ...s, rotation: migrateRotation(s.rotation) };
}

export const emptyBat = (): SeasonBat => ({
  g: 0, ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0, double: 0, triple: 0, hr: 0, sb: 0, cs: 0,
});
export const emptyPit = (): SeasonPit => ({
  g: 0, gs: 0, outs: 0, bf: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, hr: 0, w: 0, l: 0, sv: 0, svo: 0,
});

function bumpRecord(records: Record<string, WLRecord>, winnerId: string, loserId: string): void {
  (records[winnerId] ??= { w: 0, l: 0 }).w += 1;
  (records[loserId] ??= { w: 0, l: 0 }).l += 1;
}

/**
 * Accumula il tabellino di UNA squadra in due mappe id→linea (battitori/lanciatori).
 * Riusabile: la stagione regolare passa `season.bat`/`season.pit`, i playoff un
 * bucket separato. Non muta le linee del box score, solo le mappe accumulatrici.
 */
export function accumulateInto(
  bat: Record<string, SeasonBat>,
  pit: Record<string, SeasonPit>,
  stats: TeamGameStats,
): void {
  stats.batting.forEach((bl) => {
    const a = (bat[bl.id] ??= emptyBat());
    a.g += 1;
    a.ab += bl.ab;
    a.r += bl.r;
    a.h += bl.h;
    a.rbi += bl.rbi;
    a.bb += bl.bb;
    a.so += bl.so;
    a.double += bl.double;
    a.triple += bl.triple;
    a.hr += bl.hr;
    a.sb += bl.sb;
    a.cs += bl.cs;
  });
  stats.pitching.forEach((pl, i) => {
    const a = (pit[pl.id] ??= emptyPit());
    a.g += 1;
    if (i === 0) a.gs += 1; // il primo lanciatore usato e' lo starter
    a.outs += pl.outs;
    a.bf += pl.bf;
    a.h += pl.h;
    a.r += pl.r;
    a.er += pl.er;
    a.bb += pl.bb;
    a.so += pl.so;
    a.hr += pl.hr;
    if (pl.dec === 'W') a.w += 1;
    else if (pl.dec === 'L') a.l += 1;
    else if (pl.dec === 'SV') {
      a.sv += 1;
      a.svo += 1; // i save mancati (blown) non sono ancora tracciati
    }
  });
}

/** Accumula il tabellino della squadra gestita nelle statistiche di stagione. */
function accumulate(season: SeasonState, stats: TeamGameStats): void {
  accumulateInto(season.bat, season.pit, stats);
}

/** Coppie casuali (deterministiche) tra le squadre non impegnate nella gara utente. */
function otherPairings(teams: Team[], busy: Set<string>, seed: number, day: number): [Team, Team][] {
  const pool = teams.filter((t) => !busy.has(t.id));
  const rng = makeRng((seed ^ Math.imul(day + 1, 2654435761)) >>> 0);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const pairs: [Team, Team][] = [];
  for (let i = 0; i + 1 < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]);
  return pairs;
}

/**
 * Registra la gara giocata dall'utente e fa avanzare la stagione di un giorno:
 * aggiorna i record delle due squadre, accumula i giocatori gestiti, quick-simula
 * le altre partite del giorno (record di lega reale) e incrementa `day`.
 * Puro: ritorna un NUOVO stato, non muta l'input.
 */
export function advanceWithResult(
  season: SeasonState,
  result: GameResult,
  managedId: string,
  teams: Team[],
  seed: number,
): SeasonState {
  const next: SeasonState = {
    ...season,
    records: { ...season.records },
    bat: { ...season.bat },
    pit: { ...season.pit },
    results: { ...season.results },
  };

  const winnerId = result.winner === 'home' ? result.home.id : result.away.id;
  const loserId = result.winner === 'home' ? result.away.id : result.home.id;
  bumpRecord(next.records, winnerId, loserId);

  // ENTRAMBE le squadre della MIA partita accumulano statistiche REALI: se un
  // avversario mi fa 3 HR o il suo lanciatore mi batte, quei numeri finiscono
  // davvero nel suo score di stagione. La leaderboard li integra SOPRA la
  // proiezione (reale per le gare contro di me, proiettata per le altre). E' la
  // stessa architettura che serviranno le trade.
  accumulate(next, result.homeStats);
  accumulate(next, result.awayStats);

  const managedHome = result.home.id === managedId;
  const oppId = managedHome ? result.away.id : result.home.id;
  next.results[season.day] = {
    day: season.day,
    opponentId: oppId,
    home: managedHome,
    us: managedHome ? result.final.home : result.final.away,
    them: managedHome ? result.final.away : result.final.home,
  };

  // Registra l'USO di TUTTI i lanciatori della squadra gestita per far scattare
  // il riposo di ognuno (il partente riposa di piu', il rilievo secondo il carico
  // di out). Il 1° lanciatore usato e' il partente. Robusto ai vecchi save.
  const myPitching = (managedHome ? result.homeStats : result.awayStats).pitching;
  const rot0 = season.rotation ?? createRotation();
  const usage: PitcherUsage[] = myPitching.map((pl, i) => ({
    id: pl.id,
    outs: pl.outs,
    started: i === 0,
  }));
  next.rotation = usage.length ? recordUsage(rot0, usage, season.day) : rot0;

  // Resto della lega: quick-sim per una classifica reale. Ora si ACCUMULANO anche
  // i box score di queste partite (già calcolati da toGameResult, prima scartati):
  // così OGNI squadra ha stat in-season reali → leaderboard reale e, soprattutto,
  // il lineup CPU "con forma" (`withFormLineup`) ha un campione vero su cui pesare
  // il rendimento. Il lineup si ri-ordina PRIMA della simulazione, sui rating +
  // forma accumulata FINORA (`season.bat`, snapshot pre-giornata).
  const busy = new Set([result.home.id, result.away.id]);
  for (const [a, b] of otherPairings(teams, busy, seed, season.day)) {
    // Lineup con forma (CPU) poi rotazione del partente col giorno (senza, ogni
    // squadra lancerebbe l'asso ogni partita). I due wrap sono indipendenti.
    const aS = withRotationStarter(withFormLineup(a, season.bat), season.day);
    const bS = withRotationStarter(withFormLineup(b, season.bat), season.day);
    const gseed = (seed ^ Math.imul(season.day + 1, a.id.length + 7)) >>> 0;
    const g = createLiveGame(aS, bS, gseed);
    quickSim(g);
    const r = toGameResult(g);
    // Rubate SINTETIZZATE su RNG DEDICATO: il quick-sim non modella i furti (per
    // non alterare la calibrazione), quindi le aggiungiamo qui sopra il box score
    // senza toccare lo stream della simulazione. Così ogni squadra CPU accumula
    // SB/CS reali guidate dalla Velocità (leaderboard rubate sensata).
    const stealRng = makeRng((gseed ^ 0x51ea15) >>> 0);
    synthesizeStolenBases(rosterBatters(aS), r.awayStats, stealRng);
    synthesizeStolenBases(rosterBatters(bS), r.homeStats, stealRng);
    const wId = r.winner === 'home' ? b.id : a.id;
    const lId = r.winner === 'home' ? a.id : b.id;
    bumpRecord(next.records, wId, lId);
    accumulate(next, r.homeStats);
    accumulate(next, r.awayStats);
  }

  next.day = season.day + 1;
  return next;
}

/** Somma due linee di battuta (reale + proiezione di riempimento). */
export function addBat(a: SeasonBat, b: SeasonBat): SeasonBat {
  return {
    g: a.g + b.g, ab: a.ab + b.ab, r: a.r + b.r, h: a.h + b.h, rbi: a.rbi + b.rbi,
    bb: a.bb + b.bb, so: a.so + b.so, double: a.double + b.double, triple: a.triple + b.triple,
    hr: a.hr + b.hr, sb: a.sb + b.sb, cs: a.cs + b.cs,
  };
}

/** Somma due linee di lancio (reale + proiezione di riempimento). */
export function addPit(a: SeasonPit, b: SeasonPit): SeasonPit {
  return {
    g: a.g + b.g, gs: a.gs + b.gs, outs: a.outs + b.outs, bf: a.bf + b.bf, h: a.h + b.h,
    r: a.r + b.r, er: a.er + b.er, bb: a.bb + b.bb, so: a.so + b.so, hr: a.hr + b.hr,
    w: a.w + b.w, l: a.l + b.l, sv: a.sv + b.sv, svo: a.svo + b.svo,
  };
}

/** Record di una squadra (0-0 se non ha ancora giocato). */
export function recordOf(season: SeasonState, teamId: string): WLRecord {
  return season.records[teamId] ?? { w: 0, l: 0 };
}

/** Percentuale vittorie (0 se nessuna gara). */
export function winPct(r: WLRecord): number {
  const g = r.w + r.l;
  return g ? r.w / g : 0;
}

/** Games behind rispetto al capofila (record migliore) del gruppo. */
export function gamesBehind(leader: WLRecord, r: WLRecord): number {
  return (leader.w - r.w + (r.l - leader.l)) / 2;
}

/** Ordina un gruppo di squadre per record (PCT decrescente, poi vittorie). */
export function sortByRecord(season: SeasonState, teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    const ra = recordOf(season, a.id);
    const rb = recordOf(season, b.id);
    return winPct(rb) - winPct(ra) || rb.w - ra.w;
  });
}
