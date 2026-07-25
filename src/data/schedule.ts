import type { Team } from '../engine/types';
import { makeRng } from '../engine/rng';
import { divisionRivals } from './league';

// Calendario stagionale della squadra gestita: 10 date di prestagione + 162
// giornate di regular season + le date (potenziali) di playoff. E' uno
// SCAFFOLD deterministico dal seed: la distribuzione degli avversari e'
// plausibile (piu' partite contro i rivali di division, poi resto lega, un po'
// di interlega) ma NON ancora fedele alle regole ufficiali MLB. La generazione
// col calendario reale (conteggi esatti per division/interlega) arrivera' con
// il motore di stagione. Puro: nessuna dipendenza da UI o rete.

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
 * Genera il calendario della squadra gestita, deterministico dal seed della
 * lega e dall'id squadra. Alterna (in modo pseudo-casuale ma stabile) casa e
 * trasferta.
 */
export function generateSchedule(seed: number, managedId: string, teams: Team[]): Schedule {
  const rng = makeRng((seed ^ hashStr(managedId)) >>> 0);

  const regularOpps = shuffle(regularOpponentPool(managedId, teams), rng);
  const regular: ScheduleGame[] = regularOpps.map((opponentId, i) => ({
    id: `reg-${i + 1}`,
    phase: 'regular',
    day: i + 1,
    opponentId,
    home: rng.int(0, 1) === 0,
  }));

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
