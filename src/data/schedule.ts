import type { Team } from '../engine/types';
import { makeRng } from '../engine/rng';
import { divisionRivals } from './league';

// Calendario stagionale della squadra gestita: 10 date di prestagione + 162
// giornate di regular season + le date (potenziali) di playoff. E' uno
// SCAFFOLD deterministico dal seed: la distribuzione degli avversari e'
// plausibile (piu' partite contro i rivali di division, poi resto lega, un po'
// di interlega) ma NON ancora fedele ai conteggi esatti delle regole ufficiali.
// La regular season e' organizzata a SERIE come nella realta': 2-4 gare
// CONSECUTIVE (~3) contro lo stesso avversario, stessa sede per l'intera serie;
// nella serie l'avversario ruota i partenti (giorni consecutivi -> il partente
// AI cambia, vedi `withRotationStarter`/`rotationPhase`). Puro: nessuna
// dipendenza da UI o rete.

export type SchedulePhase = 'preseason' | 'regular' | 'playoff';

export interface ScheduleGame {
  /** Id stabile della partita nel calendario (es. "reg-57"). */
  id: string;
  phase: SchedulePhase;
  /** Giornata 1-based dentro la sua fase. */
  day: number;
  /** Avversario; `null` per uno slot ancora da determinare (playoff). */
  opponentId: string | null;
  /** La squadra gestita gioca in casa. */
  home: boolean;
  /** Etichetta del turno di playoff, se applicabile. */
  round?: string;
}

export interface Schedule {
  teamId: string;
  preseason: ScheduleGame[];
  regular: ScheduleGame[];
  playoff: ScheduleGame[];
}

export const PRESEASON_GAMES = 10;
export const REGULAR_GAMES = 162;

/**
 * Trade deadline (indice 1-based della gara di regular season): dopo, le rose sono
 * congelate agli scambi fino all'off-season. ~2/3 di stagione, come la deadline
 * reale di fine luglio. In stagione si fanno SOLO scambi (nessuna firma dal pool
 * FA, che e' evento di off-season). Vedi docs/franchise.md § Cadenza del mercato.
 */
export const TRADE_DEADLINE_GAME = 103;

/** Turni di playoff come slot potenziali (best-of), avversario da determinare. */
const PLAYOFF_ROUNDS: Array<{ round: string; games: number }> = [
  { round: 'Wild Card', games: 3 },
  { round: 'Division Series', games: 5 },
  { round: 'Championship Series', games: 7 },
  { round: 'World Series', games: 7 },
];

/** Hash FNV-1a di una stringa: mescola l'id squadra nel seed in modo stabile. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Costruisce la lista (di 162) degli id avversario della regular season, pesata
 * verso i rivali di division. La somma delle quote e' esattamente 162.
 */
function regularOpponentPool(managedId: string, teams: Team[]): string[] {
  const me = teams.find((t) => t.id === managedId);
  if (!me) return [];
  const rivals = divisionRivals(teams, managedId)
    .filter((t) => t.id !== managedId)
    .map((t) => t.id);
  const sameLeague = teams
    .filter((t) => t.league === me.league && t.division !== me.division)
    .map((t) => t.id);
  const interleague = teams.filter((t) => t.league !== me.league).map((t) => t.id);

  const pool: string[] = [];
  const push = (ids: string[], times: number) => {
    for (const id of ids) for (let k = 0; k < times; k++) pool.push(id);
  };
  push(rivals, 19); //  4 x 19 = 76
  push(sameLeague, 6); // 10 x  6 = 60
  push(interleague.slice(0, 13), 2); // 13 x  2 = 26  -> totale 162

  // Rete di sicurezza se la lega non avesse le dimensioni attese: pad/trim a 162.
  const all = teams.filter((t) => t.id !== managedId).map((t) => t.id);
  let i = 0;
  while (pool.length < REGULAR_GAMES && all.length) pool.push(all[i++ % all.length]);
  return pool.slice(0, REGULAR_GAMES);
}

/** Mischia in loco con Fisher-Yates usando l'RNG dato (deterministico). */
function shuffle<T>(arr: T[], rng: ReturnType<typeof makeRng>): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Spezza `count` gare contro lo stesso avversario in SERIE consecutive di 2-4
 * gare (prevalenza 3), come la MLB reale. Non lascia mai una serie da 1 (se non
 * quando `count` stesso è 1). La somma delle lunghezze è esattamente `count`.
 */
function splitIntoSeries(count: number, rng: ReturnType<typeof makeRng>): number[] {
  const lens: number[] = [];
  const CHOICES = [3, 3, 3, 2, 4]; // prevalenza 3, qualche 2 e 4
  let rem = count;
  while (rem > 4) {
    let len = CHOICES[rng.int(0, CHOICES.length - 1)];
    if (rem - len === 1) len = 2; // evita di lasciare una serie da 1 gara
    lens.push(len);
    rem -= len;
  }
  if (rem > 0) lens.push(rem); // ultima serie: 1-4 (di norma 2-4)
  return lens;
}

interface Series {
  opp: string;
  len: number;
  home: boolean;
}

/**
 * Dal pool pesato di 162 avversari costruisce le SERIE della stagione: raggruppa
 * le gare di ciascun avversario in serie consecutive (2-4, ~3), assegnando a
 * ognuna una sede unica (casa/trasferta alternata per bilanciare), poi mescola
 * l'ordine delle serie evitando due serie di fila contro lo stesso avversario.
 */
function buildSeries(managedId: string, teams: Team[], rng: ReturnType<typeof makeRng>): Series[] {
  const counts = new Map<string, number>();
  for (const id of regularOpponentPool(managedId, teams)) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const series: Series[] = [];
  for (const [opp, count] of counts) {
    const startHome = rng.int(0, 1) === 0;
    splitIntoSeries(count, rng).forEach((len, i) => {
      series.push({ opp, len, home: startHome !== (i % 2 === 1) }); // sede alternata per serie
    });
  }

  shuffle(series, rng);
  // De-cluster: nessuna coppia di serie consecutive contro lo stesso avversario.
  for (let i = 1; i < series.length; i++) {
    if (series[i].opp !== series[i - 1].opp) continue;
    for (let j = i + 1; j < series.length; j++) {
      if (series[j].opp !== series[i - 1].opp) {
        [series[i], series[j]] = [series[j], series[i]];
        break;
      }
    }
  }
  return series;
}

/**
 * Genera il calendario della squadra gestita, deterministico dal seed della
 * lega e dall'id squadra. Alterna (in modo pseudo-casuale ma stabile) casa e
 * trasferta.
 */
export function generateSchedule(seed: number, managedId: string, teams: Team[]): Schedule {
  const rng = makeRng((seed ^ hashStr(managedId)) >>> 0);

  // Regular season a SERIE: 2-4 gare consecutive (~3) contro lo stesso avversario,
  // stessa sede per l'intera serie. Nella serie l'avversario ruota i partenti
  // (giorni consecutivi -> `withRotationStarter` avanza), come nella realtà.
  const regular: ScheduleGame[] = [];
  let dayNo = 0;
  for (const s of buildSeries(managedId, teams, rng)) {
    for (let g = 0; g < s.len; g++) {
      dayNo += 1;
      regular.push({ id: `reg-${dayNo}`, phase: 'regular', day: dayNo, opponentId: s.opp, home: s.home });
    }
  }

  // Prestagione: 10 avversari sparsi (mix), casa/trasferta pseudo-casuale.
  const others = teams.filter((t) => t.id !== managedId).map((t) => t.id);
  const preOpps = shuffle([...others], rng).slice(0, PRESEASON_GAMES);
  const preseason: ScheduleGame[] = preOpps.map((opponentId, i) => ({
    id: `pre-${i + 1}`,
    phase: 'preseason',
    day: i + 1,
    opponentId,
    home: rng.int(0, 1) === 0,
  }));

  // Playoff: slot potenziali per turno, avversario da determinare.
  const playoff: ScheduleGame[] = [];
  let d = 1;
  for (const { round, games } of PLAYOFF_ROUNDS) {
    for (let g = 1; g <= games; g++) {
      playoff.push({
        id: `po-${round.replace(/\s+/g, '').toLowerCase()}-${g}`,
        phase: 'playoff',
        day: d++,
        opponentId: null,
        home: g <= 2 || g === 5 || g === 7, // schema tipico casa/trasferta
        round,
      });
    }
  }

  return { teamId: managedId, preseason, regular, playoff };
}
