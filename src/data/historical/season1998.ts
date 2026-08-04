import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 1998 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 1998
//
// Pipeline: le stat reali sono la FONTE; l'importatore (`import.ts`) le inverte
// in rating 20-100 (`engine/statsToRatings`) e da lì ri-deriva/ri-simula. Nessun
// logo/foto (marchi protetti): solo dati statistici fattuali. La rosa è una
// APPROSSIMAZIONE (titolari per PA, ruoli da Appearances): prova di pipeline
// end-to-end, non il roster-move esatto giorno per giorno.
//
// DEDUP: ogni giocatore reale compare UNA volta sola, con le stat di TUTTA la
// stagione, sulla squadra dove ha giocato di più. `id` è il playerID Lahman:
// identità stabile (niente doppioni in classifica, gestibile negli anni). I
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents1998.ts`).
// ---------------------------------------------------------------------------

export interface HistBatLine {
  /** playerID Lahman: identità reale stabile (namespaced dall'importatore). */
  id?: string;
  name: string;
  pos: Position;
  bats: Hand;
  age: number;
  pa: number;
  h: number;
  double: number;
  triple: number;
  hr: number;
  bb: number;
  so: number;
  hbp: number;
  sb: number;
  cs: number;
  /** Seconda posizione difensiva REALE (Appearances: 2ª casella più giocata tra
   *  quelle ammesse dall'archetipo, ≥ soglia partite). Abilita lo schieramento
   *  fuori-ruolo (canOccupy) per gestione/ottimizzazione lineup. Assente = mono-ruolo. */
  sec?: Position;
  /** Difesa/Braccio REALI (40-100 pre-stretch) da Fielding.csv, normalizzati per
   *  ruolo. Assenti = campione difensivo insufficiente → l'importatore usa
   *  l'archetipo di ruolo. `arm` c'è solo dove misurabile (ricevitori: CS%;
   *  esterni: assist); interni/1B usano l'archetipo. */
  fld?: number;
  arm?: number;
  /** Esordiente MLB (nessun track record prima di quest'anno): gate rookie → più
   *  regressione nel rating (un mezzo anno "caldo" non diventa un OVR da stella). */
  rk?: boolean;
}

export interface HistPitLine {
  /** playerID Lahman: identità reale stabile (namespaced dall'importatore). */
  id?: string;
  name: string;
  role: PitcherRole;
  throws: ThrowHand;
  age: number;
  /** Apparizioni totali (Resistenza dei rilievi: BF/apparizione). Opzionale per le
   *  fixture a mano; i dataset generati la includono sempre. */
  g?: number;
  gs: number;
  outs: number; // IP*3 (es. 213.1 IP = 640 out)
  h: number;
  hr: number;
  bb: number;
  so: number;
  hbp: number;
  er: number;
  w: number;
  l: number;
  sv: number;
  /** Difesa REALE del lanciatore (40-100) da Fielding.csv (POS=P): range factor +
   *  errori sul monte. Assente = pochi inning → l'importatore usa l'archetipo (70). */
  fld?: number;
  /** Esordiente MLB (nessun track record prima di quest'anno): gate rookie. */
  rk?: boolean;
}

export interface HistTeam {
  franchiseId: string;
  season: number;
  /** 9 titolari nell'ordine di battuta (uno per casella difensiva + DH). */
  batters: HistBatLine[];
  /** Panchina (sostituti, platoon). Opzionale: assente = nessuna panca. */
  bench?: HistBatLine[];
  /** Profondità oltre i 25 attivi (gestione/scambi). Opzionale. */
  reserveBatters?: HistBatLine[];
  /** Staff attivo: rotazione (role SP) + bullpen (role RP/CL). */
  pitchers: HistPitLine[];
  /** Lanciatori di profondità oltre lo staff attivo. Opzionale. */
  reservePitchers?: HistPitLine[];
}

export const SEASON_1998: HistTeam[] = [
  // BAL (BAL 1998)
  {
    franchiseId: 'BAL',
    season: 1998,
    batters: [
      { id: 'webstle01', name: 'Lenny Webster', pos: 'C', bats: 'R', age: 33, pa: 328, h: 81, double: 14, triple: 0, hr: 9, bb: 21, so: 42, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 70, arm: 59 },
      { id: 'palmera01', name: 'Rafael Palmeiro', pos: '1B', bats: 'L', age: 33, pa: 709, h: 174, double: 33, triple: 2, hr: 41, bb: 78, so: 98, hbp: 6, sb: 9, cs: 4, sec: 'LF', fld: 75 },
      { id: 'alomaro01', name: 'Roberto Alomar', pos: '2B', bats: 'S', age: 30, pa: 657, h: 176, double: 36, triple: 2, hr: 17, bb: 63, so: 66, hbp: 2, sb: 16, cs: 5, sec: 'SS', fld: 76 },
      { id: 'ripkeca01', name: 'Cal Ripken', pos: '3B', bats: 'R', age: 37, pa: 659, h: 162, double: 29, triple: 1, hr: 17, bb: 53, so: 70, hbp: 4, sb: 0, cs: 1, sec: 'SS', fld: 63 },
      { id: 'bordimi01', name: 'Mike Bordick', pos: 'SS', bats: 'R', age: 32, pa: 533, h: 118, double: 23, triple: 1, hr: 9, bb: 38, so: 62, hbp: 6, sb: 4, cs: 5, sec: '2B', fld: 84 },
      { id: 'surhobj01', name: 'B. J. Surhoff', pos: 'LF', bats: 'L', age: 33, pa: 634, h: 161, double: 33, triple: 3, hr: 21, bb: 50, so: 76, hbp: 3, sb: 5, cs: 4, sec: '1B', fld: 65, arm: 73 },
      { id: 'anderbr01', name: 'Brady Anderson', pos: 'CF', bats: 'L', age: 34, pa: 574, h: 129, double: 30, triple: 4, hr: 21, bb: 71, so: 83, hbp: 16, sb: 18, cs: 8, sec: 'LF', fld: 58, arm: 56 },
      { id: 'daviser01', name: 'Eric Davis', pos: 'RF', bats: 'R', age: 36, pa: 508, h: 141, double: 28, triple: 1, hr: 27, bb: 49, so: 115, hbp: 5, sb: 12, cs: 6, sec: 'CF', fld: 66, arm: 68 },
      { id: 'cartejo01', name: 'Joe Carter', pos: 'DH', bats: 'R', age: 38, pa: 418, h: 95, double: 21, triple: 2, hr: 16, bb: 25, so: 64, hbp: 3, sb: 4, cs: 2, sec: 'LF', fld: 66, arm: 71 },
    ],
    bench: [
      { id: 'baineha01', name: 'Harold Baines', pos: 'DH', bats: 'L', age: 39, pa: 328, h: 88, double: 16, triple: 0, hr: 10, bb: 36, so: 39, hbp: 1, sb: 0, cs: 0, sec: 'RF' },
      { id: 'hoilech01', name: 'Chris Hoiles', pos: 'C', bats: 'R', age: 33, pa: 318, h: 69, double: 11, triple: 0, hr: 14, bb: 39, so: 60, hbp: 6, sb: 0, cs: 1, sec: '1B', fld: 78, arm: 57 },
      { id: 'hammoje01', name: 'Jeffrey Hammonds', pos: 'CF', bats: 'R', age: 27, pa: 306, h: 71, double: 14, triple: 2, hr: 10, bb: 30, so: 54, hbp: 3, sb: 8, cs: 2, sec: 'RF', fld: 64, arm: 72 },
      { id: 'beckeri01', name: 'Rich Becker', pos: 'RF', bats: 'L', age: 26, pa: 260, h: 55, double: 10, triple: 2, hr: 5, bb: 35, so: 66, hbp: 1, sb: 7, cs: 2, sec: 'CF', fld: 71, arm: 75 },
      { id: 'rebouje01', name: 'Jeff Reboulet', pos: '2B', bats: 'R', age: 34, pa: 155, h: 31, double: 6, triple: 0, hr: 1, bb: 16, so: 28, hbp: 1, sb: 1, cs: 1, sec: 'SS', fld: 50 },
    ],
    reserveBatters: [
      { id: 'moutoly01', name: 'Lyle Mouton', pos: 'RF', bats: 'R', age: 29, pa: 43, h: 11, double: 2, triple: 0, hr: 1, bb: 3, so: 10, hbp: 0, sb: 1, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'ericksc01', name: 'Scott Erickson', role: 'SP', throws: 'R', age: 30, g: 36, gs: 36, outs: 754, h: 277, hr: 22, bb: 71, so: 164, hbp: 11, er: 115, w: 16, l: 13, sv: 0, fld: 82 },
      { id: 'mussimi01', name: 'Mike Mussina', role: 'SP', throws: 'R', age: 29, g: 29, gs: 29, outs: 619, h: 191, hr: 23, bb: 47, so: 181, hbp: 3, er: 82, w: 13, l: 10, sv: 0, fld: 78 },
      { id: 'ponsosi01', name: 'Sidney Ponson', role: 'SP', throws: 'R', age: 21, g: 31, gs: 20, outs: 405, h: 157, hr: 19, bb: 42, so: 85, hbp: 3, er: 79, w: 8, l: 9, sv: 1, fld: 63, rk: true },
      { id: 'drabedo01', name: 'Doug Drabek', role: 'SP', throws: 'R', age: 35, g: 23, gs: 21, outs: 326, h: 126, hr: 18, bb: 37, so: 62, hbp: 4, er: 75, w: 6, l: 11, sv: 0 },
      { id: 'smithpe02', name: 'Pete Smith', role: 'SP', throws: 'R', age: 32, g: 37, gs: 12, outs: 265, h: 97, hr: 12, bb: 37, so: 59, hbp: 2, er: 51, w: 5, l: 5, sv: 0 },
      { id: 'benitar01', name: 'Armando Benitez', role: 'CL', throws: 'R', age: 25, g: 71, gs: 0, outs: 205, h: 47, hr: 9, bb: 39, so: 93, hbp: 3, er: 25, w: 5, l: 6, sv: 22 },
      { id: 'millsal01', name: 'Alan Mills', role: 'RP', throws: 'R', age: 31, g: 72, gs: 0, outs: 231, h: 59, hr: 9, bb: 52, so: 59, hbp: 1, er: 34, w: 3, l: 4, sv: 2 },
      { id: 'rhodear01', name: 'Arthur Rhodes', role: 'RP', throws: 'L', age: 28, g: 45, gs: 0, outs: 231, h: 65, hr: 8, bb: 29, so: 85, hbp: 2, er: 29, w: 4, l: 4, sv: 4 },
      { id: 'oroscje01', name: 'Jesse Orosco', role: 'RP', throws: 'L', age: 41, g: 69, gs: 0, outs: 170, h: 42, hr: 6, bb: 30, so: 52, hbp: 1, er: 19, w: 4, l: 1, sv: 7 },
      { id: 'charlno01', name: 'Norm Charlton', role: 'RP', throws: 'L', age: 35, g: 49, gs: 0, outs: 144, h: 54, hr: 5, bb: 31, so: 43, hbp: 2, er: 31, w: 2, l: 1, sv: 1 },
      { id: 'rodrine01', name: 'Nerio Rodriguez', role: 'RP', throws: 'R', age: 27, g: 13, gs: 4, outs: 82, h: 33, hr: 2, bb: 15, so: 13, hbp: 1, er: 22, w: 2, l: 3, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'johnsdo04', name: 'Doug Johns', role: 'SP', throws: 'L', age: 30, g: 31, gs: 10, outs: 260, h: 106, hr: 10, bb: 34, so: 36, hbp: 4, er: 49, w: 3, l: 3, sv: 1 },
      { id: 'keyji01', name: 'Jimmy Key', role: 'SP', throws: 'L', age: 37, g: 25, gs: 11, outs: 238, h: 77, hr: 8, bb: 27, so: 52, hbp: 2, er: 34, w: 6, l: 3, sv: 0 },
      { id: 'kamiesc01', name: 'Scott Kamieniecki', role: 'SP', throws: 'R', age: 34, g: 12, gs: 11, outs: 164, h: 63, hr: 7, bb: 24, so: 32, hbp: 2, er: 33, w: 2, l: 6, sv: 0 },
      { id: 'mathete01', name: 'Terry Mathews', role: 'RP', throws: 'R', age: 33, g: 17, gs: 0, outs: 61, h: 22, hr: 3, bb: 10, so: 13, hbp: 0, er: 11, w: 0, l: 1, sv: 0 },
      { id: 'coppiro01', name: 'Rocky Coppinger', role: 'RP', throws: 'R', age: 24, g: 6, gs: 1, outs: 47, h: 16, hr: 3, bb: 8, so: 14, hbp: 0, er: 9, w: 0, l: 0, sv: 0 },
    ],
  },
  // BOS (BOS 1998)
  {
    franchiseId: 'BOS',
    season: 1998,
    batters: [
      { id: 'hattesc01', name: 'Scott Hatteberg', pos: 'C', bats: 'L', age: 28, pa: 410, h: 99, double: 23, triple: 1, hr: 11, bb: 43, so: 64, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 65, arm: 70 },
      { id: 'vaughmo01', name: 'Mo Vaughn', pos: '1B', bats: 'L', age: 30, pa: 681, h: 194, double: 29, triple: 1, hr: 39, bb: 76, so: 150, hbp: 10, sb: 1, cs: 1, sec: '3B', fld: 66 },
      { id: 'benjami01', name: 'Mike Benjamin', pos: '2B', bats: 'R', age: 32, pa: 385, h: 92, double: 23, triple: 1, hr: 4, bb: 16, so: 75, hbp: 6, sb: 4, cs: 2, sec: 'SS', fld: 76 },
      { id: 'valenjo02', name: 'John Valentin', pos: '3B', bats: 'R', age: 31, pa: 681, h: 163, double: 44, triple: 3, hr: 20, bb: 71, so: 76, hbp: 8, sb: 6, cs: 6, sec: 'SS', fld: 79 },
      { id: 'garcino01', name: 'Nomar Garciaparra', pos: 'SS', bats: 'R', age: 24, pa: 652, h: 190, double: 37, triple: 9, hr: 31, bb: 32, so: 71, hbp: 7, sb: 16, cs: 7, sec: '2B', fld: 64 },
      { id: 'oleartr01', name: 'Troy O\'Leary', pos: 'LF', bats: 'L', age: 28, pa: 657, h: 169, double: 36, triple: 7, hr: 21, bb: 42, so: 99, hbp: 4, sb: 2, cs: 3, sec: 'RF', fld: 77, arm: 68 },
      { id: 'lewisda01', name: 'Darren Lewis', pos: 'CF', bats: 'R', age: 30, pa: 670, h: 152, double: 23, triple: 3, hr: 7, bb: 70, so: 93, hbp: 7, sb: 33, cs: 13, sec: 'RF', fld: 78, arm: 64 },
      { id: 'braggda01', name: 'Darren Bragg', pos: 'RF', bats: 'L', age: 28, pa: 465, h: 108, double: 28, triple: 2, hr: 8, bb: 48, so: 87, hbp: 4, sb: 7, cs: 5, sec: 'CF', fld: 72, arm: 66 },
      { id: 'varitja01', name: 'Jason Varitek', pos: 'DH', bats: 'S', age: 26, pa: 247, h: 57, double: 13, triple: 0, hr: 7, bb: 17, so: 45, hbp: 2, sb: 2, cs: 2, sec: 'C', fld: 54, arm: 65, rk: true },
    ],
    bench: [
      { id: 'buforda01', name: 'Damon Buford', pos: 'CF', bats: 'R', age: 28, pa: 241, h: 55, double: 12, triple: 2, hr: 7, bb: 20, so: 47, hbp: 1, sb: 8, cs: 5, sec: 'RF', fld: 76, arm: 72 },
      { id: 'jeffere01', name: 'Reggie Jefferson', pos: 'DH', bats: 'S', age: 29, pa: 219, h: 65, double: 15, triple: 1, hr: 7, bb: 14, so: 41, hbp: 2, sb: 0, cs: 0, sec: '1B' },
      { id: 'cummimi01', name: 'Midre Cummings', pos: 'DH', bats: 'L', age: 26, pa: 140, h: 33, double: 8, triple: 2, hr: 3, bb: 13, so: 21, hbp: 1, sb: 2, cs: 2, sec: 'RF' },
      { id: 'sadledo01', name: 'Donnie Sadler', pos: '2B', bats: 'R', age: 23, pa: 139, h: 28, double: 4, triple: 4, hr: 3, bb: 6, so: 28, hbp: 3, sb: 4, cs: 0, sec: 'SS', fld: 55, rk: true },
      { id: 'merlolo01', name: 'Lou Merloni', pos: '2B', bats: 'R', age: 27, pa: 106, h: 27, double: 6, triple: 0, hr: 1, bb: 7, so: 20, hbp: 2, sb: 1, cs: 0, sec: 'SS', fld: 62, rk: true },
    ],
    reserveBatters: [
      { id: 'lemkema01', name: 'Mark Lemke', pos: '2B', bats: 'S', age: 32, pa: 100, h: 21, double: 4, triple: 0, hr: 1, bb: 8, so: 12, hbp: 0, sb: 1, cs: 0, sec: '3B', fld: 49 },
      { id: 'mitchke02', name: 'Keith Mitchell', pos: 'DH', bats: 'R', age: 28, pa: 40, h: 9, double: 2, triple: 0, hr: 0, bb: 6, so: 5, hbp: 0, sb: 1, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'martipe02', name: 'Pedro Martinez', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 701, h: 180, hr: 22, bb: 68, so: 267, hbp: 8, er: 70, w: 19, l: 7, sv: 0, fld: 52 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 31, g: 36, gs: 33, outs: 648, h: 213, hr: 30, bb: 85, so: 149, hbp: 15, er: 108, w: 17, l: 8, sv: 0, fld: 64 },
      { id: 'saberbr01', name: 'Bret Saberhagen', role: 'SP', throws: 'R', age: 34, g: 31, gs: 31, outs: 525, h: 181, hr: 23, bb: 32, so: 99, hbp: 7, er: 81, w: 15, l: 8, sv: 0, fld: 68 },
      { id: 'averyst01', name: 'Steve Avery', role: 'SP', throws: 'L', age: 28, g: 34, gs: 23, outs: 371, h: 138, hr: 14, bb: 58, so: 63, hbp: 4, er: 72, w: 10, l: 7, sv: 0 },
      { id: 'lowede01', name: 'Derek Lowe', role: 'SP', throws: 'R', age: 25, g: 63, gs: 10, outs: 369, h: 127, hr: 9, bb: 42, so: 81, hbp: 5, er: 63, w: 3, l: 9, sv: 4 },
      { id: 'gordoto01', name: 'Tom Gordon', role: 'CL', throws: 'R', age: 30, g: 73, gs: 0, outs: 238, h: 65, hr: 5, bb: 30, so: 65, hbp: 1, er: 32, w: 7, l: 4, sv: 46 },
      { id: 'wasdijo01', name: 'John Wasdin', role: 'RP', throws: 'R', age: 25, g: 47, gs: 8, outs: 288, h: 104, hr: 15, bb: 30, so: 61, hbp: 2, er: 55, w: 6, l: 4, sv: 0 },
      { id: 'corsiji01', name: 'Jim Corsi', role: 'RP', throws: 'R', age: 36, g: 59, gs: 0, outs: 198, h: 60, hr: 4, bb: 24, so: 45, hbp: 2, er: 22, w: 3, l: 2, sv: 0 },
      { id: 'reyesca01', name: 'Carlos Reyes', role: 'RP', throws: 'R', age: 29, g: 46, gs: 0, outs: 198, h: 67, hr: 8, bb: 22, so: 40, hbp: 2, er: 32, w: 3, l: 3, sv: 1 },
      { id: 'garceri01', name: 'Rich Garces', role: 'RP', throws: 'R', age: 27, g: 30, gs: 0, outs: 138, h: 38, hr: 6, bb: 28, so: 39, hbp: 2, er: 19, w: 1, l: 1, sv: 1 },
      { id: 'eckerde01', name: 'Dennis Eckersley', role: 'RP', throws: 'R', age: 43, g: 50, gs: 0, outs: 119, h: 43, hr: 6, bb: 7, so: 30, hbp: 2, er: 19, w: 4, l: 1, sv: 1 },
    ],
    reservePitchers: [
      { id: 'rosebr01', name: 'Brian Rose', role: 'RP', throws: 'R', age: 22, g: 8, gs: 8, outs: 113, h: 44, hr: 8, bb: 14, so: 19, hbp: 2, er: 30, w: 1, l: 4, sv: 0, rk: true },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 27, g: 29, gs: 0, outs: 78, h: 24, hr: 3, bb: 14, so: 18, hbp: 1, er: 9, w: 1, l: 1, sv: 1, rk: true },
      { id: 'choji01', name: 'Jin Ho Cho', role: 'RP', throws: 'R', age: 22, g: 4, gs: 4, outs: 56, h: 28, hr: 4, bb: 3, so: 15, hbp: 1, er: 17, w: 0, l: 3, sv: 0, rk: true },
      { id: 'barklbr01', name: 'Brian Barkley', role: 'RP', throws: 'L', age: 22, g: 6, gs: 0, outs: 33, h: 16, hr: 2, bb: 9, so: 2, hbp: 1, er: 12, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // NYY (NYA 1998)
  {
    franchiseId: 'NYY',
    season: 1998,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 27, pa: 409, h: 93, double: 23, triple: 0, hr: 15, bb: 49, so: 84, hbp: 1, sb: 0, cs: 2, sec: '1B', fld: 73, arm: 79 },
      { id: 'martiti02', name: 'Tino Martinez', pos: '1B', bats: 'L', age: 30, pa: 608, h: 153, double: 30, triple: 1, hr: 31, bb: 63, so: 76, hbp: 4, sb: 2, cs: 1, sec: '3B', fld: 69 },
      { id: 'knoblch01', name: 'Chuck Knoblauch', pos: '2B', bats: 'R', age: 29, pa: 706, h: 172, double: 27, triple: 8, hr: 14, bb: 82, so: 75, hbp: 18, sb: 44, cs: 12, sec: 'SS', fld: 65 },
      { id: 'brosisc01', name: 'Scott Brosius', pos: '3B', bats: 'R', age: 31, pa: 603, h: 144, double: 30, triple: 0, hr: 18, bb: 51, so: 104, hbp: 8, sb: 10, cs: 6, sec: '1B', fld: 74 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 24, pa: 694, h: 192, double: 27, triple: 7, hr: 14, bb: 60, so: 116, hbp: 7, sb: 25, cs: 8, sec: '2B', fld: 64 },
      { id: 'curtich01', name: 'Chad Curtis', pos: 'LF', bats: 'R', age: 29, pa: 545, h: 118, double: 24, triple: 1, hr: 13, bb: 68, so: 80, hbp: 6, sb: 19, cs: 7, sec: 'CF', fld: 90, arm: 68 },
      { id: 'willibe02', name: 'Bernie Williams', pos: 'CF', bats: 'S', age: 29, pa: 578, h: 164, double: 30, triple: 6, hr: 24, bb: 73, so: 77, hbp: 1, sb: 15, cs: 8, sec: 'LF', fld: 69, arm: 62 },
      { id: 'oneilpa01', name: 'Paul O\'Neill', pos: 'RF', bats: 'L', age: 35, pa: 672, h: 186, double: 41, triple: 1, hr: 23, bb: 72, so: 97, hbp: 2, sb: 11, cs: 3, sec: 'LF', fld: 71, arm: 72 },
      { id: 'raineti01', name: 'Tim Raines', pos: 'DH', bats: 'S', age: 38, pa: 382, h: 96, double: 17, triple: 1, hr: 6, bb: 53, so: 46, hbp: 2, sb: 9, cs: 4, sec: 'LF' },
    ],
    bench: [
      { id: 'strawda01', name: 'Darryl Strawberry', pos: 'DH', bats: 'L', age: 36, pa: 345, h: 72, double: 12, triple: 2, hr: 21, bb: 45, so: 89, hbp: 3, sb: 8, cs: 7, sec: 'RF' },
      { id: 'girarjo01', name: 'Joe Girardi', pos: 'C', bats: 'R', age: 33, pa: 279, h: 70, double: 13, triple: 2, hr: 2, bb: 16, so: 35, hbp: 2, sb: 3, cs: 3, sec: '1B', fld: 75, arm: 63 },
      { id: 'sojolu01', name: 'Luis Sojo', pos: 'SS', bats: 'R', age: 33, pa: 153, h: 36, double: 4, triple: 1, hr: 1, bb: 7, so: 11, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 74 },
      { id: 'davisch01', name: 'Chili Davis', pos: 'DH', bats: 'S', age: 38, pa: 118, h: 29, double: 5, triple: 0, hr: 5, bb: 17, so: 19, hbp: 0, sb: 1, cs: 1, sec: 'RF' },
      { id: 'ledeeri01', name: 'Ricky Ledee', pos: 'LF', bats: 'L', age: 24, pa: 87, h: 19, double: 5, triple: 2, hr: 1, bb: 7, so: 29, hbp: 0, sb: 3, cs: 1, sec: 'RF', fld: 75, arm: 92, rk: true },
    ],
    reserveBatters: [
      { id: 'bushho01', name: 'Homer Bush', pos: '2B', bats: 'R', age: 25, pa: 78, h: 27, double: 3, triple: 0, hr: 1, bb: 5, so: 17, hbp: 0, sb: 5, cs: 3, sec: 'SS', rk: true },
      { id: 'spencsh01', name: 'Shane Spencer', pos: 'RF', bats: 'R', age: 26, pa: 73, h: 25, double: 6, triple: 0, hr: 10, bb: 5, so: 12, hbp: 0, sb: 0, cs: 1, sec: 'LF', fld: 62, arm: 69, rk: true },
      { id: 'sveumda01', name: 'Dale Sveum', pos: '1B', bats: 'S', age: 34, pa: 64, h: 14, double: 3, triple: 0, hr: 2, bb: 5, so: 15, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 26, g: 33, gs: 32, outs: 649, h: 225, hr: 16, bb: 76, so: 153, hbp: 4, er: 91, w: 16, l: 11, sv: 0, fld: 74 },
      { id: 'wellsda01', name: 'David Wells', role: 'SP', throws: 'L', age: 35, g: 30, gs: 30, outs: 643, h: 208, hr: 27, bb: 36, so: 148, hbp: 3, er: 92, w: 18, l: 4, sv: 0, fld: 61 },
      { id: 'coneda01', name: 'David Cone', role: 'SP', throws: 'R', age: 35, g: 31, gs: 31, outs: 623, h: 176, hr: 19, bb: 73, so: 219, hbp: 11, er: 75, w: 20, l: 7, sv: 0, fld: 67 },
      { id: 'irabuhi01', name: 'Hideki Irabu', role: 'SP', throws: 'R', age: 29, g: 29, gs: 28, outs: 519, h: 159, hr: 30, bb: 73, so: 134, hbp: 8, er: 87, w: 13, l: 9, sv: 0, fld: 57 },
      { id: 'hernaor01', name: 'Orlando Hernandez', role: 'SP', throws: 'R', age: 32, g: 21, gs: 21, outs: 423, h: 113, hr: 11, bb: 52, so: 131, hbp: 6, er: 49, w: 12, l: 4, sv: 0, fld: 77, rk: true },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 28, g: 54, gs: 0, outs: 184, h: 49, hr: 3, bb: 18, so: 52, hbp: 1, er: 13, w: 3, l: 0, sv: 36 },
      { id: 'stantmi02', name: 'Mike Stanton', role: 'RP', throws: 'L', age: 31, g: 67, gs: 0, outs: 237, h: 69, hr: 10, bb: 30, so: 71, hbp: 3, er: 37, w: 4, l: 1, sv: 6 },
      { id: 'holmeda01', name: 'Darren Holmes', role: 'RP', throws: 'R', age: 32, g: 34, gs: 0, outs: 154, h: 56, hr: 5, bb: 17, so: 37, hbp: 1, er: 24, w: 0, l: 3, sv: 2 },
      { id: 'buddimi01', name: 'Mike Buddie', role: 'RP', throws: 'R', age: 27, g: 24, gs: 2, outs: 125, h: 46, hr: 5, bb: 13, so: 20, hbp: 3, er: 26, w: 4, l: 1, sv: 0, rk: true },
      { id: 'nelsoje01', name: 'Jeff Nelson', role: 'RP', throws: 'R', age: 31, g: 45, gs: 0, outs: 121, h: 39, hr: 3, bb: 22, so: 44, hbp: 4, er: 17, w: 5, l: 3, sv: 3 },
      { id: 'lloydgr01', name: 'Graeme Lloyd', role: 'RP', throws: 'L', age: 31, g: 50, gs: 0, outs: 113, h: 32, hr: 3, bb: 10, so: 18, hbp: 1, er: 11, w: 3, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'mendora01', name: 'Ramiro Mendoza', role: 'SP', throws: 'R', age: 26, g: 41, gs: 14, outs: 391, h: 142, hr: 11, bb: 28, so: 66, hbp: 7, er: 55, w: 10, l: 2, sv: 1 },
      { id: 'bradlry01', name: 'Ryan Bradley', role: 'RP', throws: 'R', age: 22, g: 5, gs: 1, outs: 38, h: 12, hr: 2, bb: 9, so: 13, hbp: 1, er: 8, w: 2, l: 1, sv: 0, rk: true },
    ],
  },
  // TBR (TBA 1998)
  {
    franchiseId: 'TBR',
    season: 1998,
    batters: [
      { id: 'flahejo01', name: 'John Flaherty', pos: 'C', bats: 'R', age: 30, pa: 334, h: 76, double: 14, triple: 0, hr: 6, bb: 21, so: 45, hbp: 1, sb: 2, cs: 4, sec: '1B', fld: 74, arm: 76 },
      { id: 'mcgrifr01', name: 'Fred McGriff', pos: '1B', bats: 'L', age: 34, pa: 649, h: 161, double: 31, triple: 0, hr: 21, bb: 73, so: 115, hbp: 3, sb: 6, cs: 1, fld: 69 },
      { id: 'cairomi01', name: 'Miguel Cairo', pos: '2B', bats: 'R', age: 24, pa: 558, h: 137, double: 26, triple: 5, hr: 5, bb: 25, so: 46, hbp: 7, sb: 18, cs: 8, sec: 'SS', fld: 78, rk: true },
      { id: 'boggswa01', name: 'Wade Boggs', pos: '3B', bats: 'L', age: 40, pa: 483, h: 124, double: 25, triple: 3, hr: 5, bb: 51, so: 46, hbp: 0, sb: 2, cs: 2, sec: '1B', fld: 70 },
      { id: 'stockke01', name: 'Kevin Stocker', pos: 'SS', bats: 'S', age: 28, pa: 381, h: 81, double: 14, triple: 4, hr: 4, bb: 32, so: 72, hbp: 5, sb: 6, cs: 4, sec: '2B', fld: 84 },
      { id: 'kellymi02', name: 'Mike Kelly', pos: 'LF', bats: 'R', age: 28, pa: 303, h: 70, double: 15, triple: 2, hr: 10, bb: 23, so: 74, hbp: 0, sb: 13, cs: 5, sec: 'RF', fld: 72, arm: 66 },
      { id: 'mccraqu01', name: 'Quinton McCracken', pos: 'CF', bats: 'S', age: 27, pa: 675, h: 176, double: 32, triple: 6, hr: 7, bb: 52, so: 110, hbp: 3, sb: 28, cs: 13, sec: 'LF', fld: 70, arm: 84 },
      { id: 'martida01', name: 'Dave Martinez', pos: 'RF', bats: 'L', age: 33, pa: 347, h: 86, double: 11, triple: 3, hr: 6, bb: 35, so: 45, hbp: 2, sb: 8, cs: 5, sec: 'CF', fld: 76, arm: 82 },
      { id: 'sorrepa01', name: 'Paul Sorrento', pos: 'DH', bats: 'L', age: 32, pa: 495, h: 110, double: 24, triple: 0, hr: 22, bb: 52, so: 118, hbp: 4, sb: 1, cs: 2, sec: '1B' },
    ],
    bench: [
      { id: 'smithbo06', name: 'Bob Smith', pos: '3B', bats: 'R', age: 24, pa: 416, h: 102, double: 15, triple: 3, hr: 11, bb: 34, so: 110, hbp: 6, sb: 5, cs: 3, sec: '1B', fld: 80, rk: true },
      { id: 'winnra01', name: 'Randy Winn', pos: 'CF', bats: 'S', age: 24, pa: 379, h: 94, double: 9, triple: 9, hr: 1, bb: 29, so: 69, hbp: 1, sb: 26, cs: 12, sec: 'LF', fld: 65, arm: 75, rk: true },
      { id: 'ledesaa01', name: 'Aaron Ledesma', pos: 'SS', bats: 'R', age: 27, pa: 315, h: 96, double: 16, triple: 3, hr: 1, bb: 14, so: 47, hbp: 1, sb: 8, cs: 6, sec: '2B', fld: 96 },
      { id: 'difelmi01', name: 'Mike Difelice', pos: 'C', bats: 'R', age: 29, pa: 269, h: 57, double: 11, triple: 2, hr: 3, bb: 16, so: 56, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 64, arm: 79 },
      { id: 'butleri01', name: 'Rich Butler', pos: 'LF', bats: 'L', age: 25, pa: 237, h: 49, double: 4, triple: 3, hr: 7, bb: 16, so: 37, hbp: 2, sb: 4, cs: 3, sec: 'RF', fld: 79, arm: 71, rk: true },
    ],
    reserveBatters: [
      { id: 'trammbu01', name: 'Bubba Trammell', pos: 'LF', bats: 'R', age: 26, pa: 216, h: 53, double: 15, triple: 1, hr: 10, bb: 18, so: 48, hbp: 0, sb: 1, cs: 2, sec: 'RF', fld: 60, arm: 76 },
    ],
    pitchers: [
      { id: 'arrojro01', name: 'Rolando Arrojo', role: 'SP', throws: 'R', age: 32, g: 32, gs: 32, outs: 606, h: 195, hr: 21, bb: 65, so: 152, hbp: 19, er: 80, w: 14, l: 12, sv: 0, fld: 79, rk: true },
      { id: 'saundto01', name: 'Tony Saunders', role: 'SP', throws: 'L', age: 24, g: 31, gs: 31, outs: 577, h: 187, hr: 17, bb: 112, so: 174, hbp: 6, er: 92, w: 6, l: 15, sv: 0, fld: 64 },
      { id: 'santaju01', name: 'Julio Santana', role: 'SP', throws: 'R', age: 25, g: 35, gs: 19, outs: 437, h: 162, hr: 19, bb: 62, so: 68, hbp: 5, er: 81, w: 5, l: 6, sv: 0, fld: 52 },
      { id: 'alvarwi01', name: 'Wilson Alvarez', role: 'SP', throws: 'L', age: 28, g: 25, gs: 25, outs: 428, h: 131, hr: 15, bb: 65, so: 116, hbp: 5, er: 66, w: 6, l: 14, sv: 0, fld: 55 },
      { id: 'sprinde01', name: 'Dennis Springer', role: 'SP', throws: 'R', age: 33, g: 29, gs: 17, outs: 347, h: 121, hr: 22, bb: 53, so: 50, hbp: 9, er: 70, w: 3, l: 11, sv: 0 },
      { id: 'hernaro01', name: 'Roberto Hernandez', role: 'CL', throws: 'R', age: 33, g: 67, gs: 0, outs: 214, h: 57, hr: 5, bb: 37, so: 65, hbp: 3, er: 25, w: 2, l: 6, sv: 26 },
      { id: 'yanes01', name: 'Esteban Yan', role: 'RP', throws: 'R', age: 23, g: 64, gs: 0, outs: 266, h: 84, hr: 12, bb: 41, so: 72, hbp: 6, er: 45, w: 5, l: 4, sv: 1, rk: true },
      { id: 'mecirji01', name: 'Jim Mecir', role: 'RP', throws: 'R', age: 28, g: 68, gs: 0, outs: 252, h: 73, hr: 8, bb: 33, so: 73, hbp: 3, er: 35, w: 7, l: 2, sv: 0 },
      { id: 'lopezal02', name: 'Albie Lopez', role: 'RP', throws: 'R', age: 26, g: 54, gs: 0, outs: 239, h: 84, hr: 10, bb: 33, so: 60, hbp: 3, er: 39, w: 7, l: 4, sv: 1 },
      { id: 'whiteri01', name: 'Rick White', role: 'RP', throws: 'R', age: 29, g: 38, gs: 3, outs: 206, h: 66, hr: 8, bb: 23, so: 39, hbp: 2, er: 29, w: 2, l: 6, sv: 0 },
      { id: 'aldresc01', name: 'Scott Aldred', role: 'RP', throws: 'L', age: 30, g: 48, gs: 0, outs: 94, h: 37, hr: 5, bb: 12, so: 18, hbp: 1, er: 21, w: 0, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'rekarbr01', name: 'Bryan Rekar', role: 'SP', throws: 'R', age: 26, g: 16, gs: 15, outs: 260, h: 98, hr: 16, bb: 25, so: 49, hbp: 3, er: 53, w: 2, l: 8, sv: 0 },
      { id: 'johnsja02', name: 'Jason Johnson', role: 'SP', throws: 'R', age: 24, g: 13, gs: 13, outs: 180, h: 76, hr: 10, bb: 26, so: 36, hbp: 3, er: 38, w: 2, l: 5, sv: 0, rk: true },
      { id: 'carlsda01', name: 'Dan Carlson', role: 'RP', throws: 'R', age: 28, g: 10, gs: 0, outs: 53, h: 25, hr: 4, bb: 8, so: 15, hbp: 2, er: 14, w: 0, l: 0, sv: 0, rk: true },
      { id: 'gorecri01', name: 'Rick Gorecki', role: 'RP', throws: 'R', age: 24, g: 3, gs: 3, outs: 50, h: 16, hr: 2, bb: 11, so: 9, hbp: 0, er: 12, w: 1, l: 2, sv: 0, rk: true },
      { id: 'tatisra01', name: 'Ramon Tatis', role: 'RP', throws: 'L', age: 25, g: 22, gs: 0, outs: 35, h: 20, hr: 3, bb: 11, so: 8, hbp: 1, er: 12, w: 0, l: 0, sv: 0 },
    ],
  },
  // TOR (TOR 1998)
  {
    franchiseId: 'TOR',
    season: 1998,
    batters: [
      { id: 'fletcda01', name: 'Darrin Fletcher', pos: 'C', bats: 'L', age: 31, pa: 446, h: 114, double: 24, triple: 1, hr: 13, bb: 25, so: 42, hbp: 6, sb: 0, cs: 0, sec: '1B', fld: 75, arm: 60 },
      { id: 'delgaca01', name: 'Carlos Delgado', pos: '1B', bats: 'L', age: 26, pa: 620, h: 149, double: 41, triple: 2, hr: 34, bb: 69, so: 141, hbp: 10, sb: 2, cs: 1, sec: 'LF', fld: 66 },
      { id: 'fernato01', name: 'Tony Fernandez', pos: '2B', bats: 'S', age: 36, pa: 551, h: 152, double: 33, triple: 2, hr: 11, bb: 39, so: 55, hbp: 8, sb: 11, cs: 8, sec: 'SS', fld: 56 },
      { id: 'spraged02', name: 'Ed Sprague', pos: '3B', bats: 'R', age: 30, pa: 510, h: 106, double: 26, triple: 2, hr: 19, bb: 37, so: 95, hbp: 10, sb: 0, cs: 1, sec: '1B', fld: 54 },
      { id: 'gonzaal01', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 25, pa: 618, h: 134, double: 29, triple: 2, hr: 14, bb: 36, so: 123, hbp: 6, sb: 20, cs: 7, sec: '2B', fld: 67 },
      { id: 'stewash01', name: 'Shannon Stewart', pos: 'LF', bats: 'R', age: 24, pa: 605, h: 145, double: 31, triple: 6, hr: 10, bb: 65, so: 77, hbp: 14, sb: 47, cs: 16, sec: 'CF', fld: 85, arm: 61 },
      { id: 'cruzjo02', name: 'Jose Cruz', pos: 'CF', bats: 'S', age: 24, pa: 413, h: 90, double: 16, triple: 2, hr: 17, bb: 49, so: 103, hbp: 0, sb: 9, cs: 3, sec: 'LF', fld: 71, arm: 71 },
      { id: 'greensh01', name: 'Shawn Green', pos: 'RF', bats: 'L', age: 25, pa: 689, h: 176, double: 35, triple: 5, hr: 29, bb: 51, so: 139, hbp: 5, sb: 27, cs: 9, sec: 'LF', fld: 71, arm: 76 },
      { id: 'cansejo01', name: 'Jose Canseco', pos: 'DH', bats: 'R', age: 33, pa: 658, h: 140, double: 28, triple: 0, hr: 42, bb: 72, so: 160, hbp: 6, sb: 21, cs: 11, sec: 'RF' },
    ],
    bench: [
      { id: 'stanlmi02', name: 'Mike Stanley', pos: 'DH', bats: 'R', age: 35, pa: 593, h: 134, double: 28, triple: 0, hr: 28, bb: 81, so: 114, hbp: 7, sb: 2, cs: 1, sec: 'C' },
      { id: 'grebecr01', name: 'Craig Grebeck', pos: '2B', bats: 'R', age: 33, pa: 344, h: 76, double: 17, triple: 1, hr: 2, bb: 30, so: 39, hbp: 3, sb: 1, cs: 2, sec: 'SS', fld: 66 },
      { id: 'crespfe01', name: 'Felipe Crespo', pos: 'RF', bats: 'S', age: 25, pa: 153, h: 33, double: 7, triple: 1, hr: 1, bb: 16, so: 27, hbp: 2, sb: 3, cs: 2, sec: 'LF', fld: 74, arm: 61, rk: true },
      { id: 'brownke04', name: 'Kevin Brown', pos: 'C', bats: 'R', age: 25, pa: 128, h: 29, double: 7, triple: 1, hr: 3, bb: 9, so: 30, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 66, rk: true },
      { id: 'dalesma01', name: 'Mark Dalesandro', pos: 'C', bats: 'R', age: 30, pa: 69, h: 20, double: 5, triple: 0, hr: 2, bb: 1, so: 6, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    reserveBatters: [
      { id: 'samueju01', name: 'Juan Samuel', pos: 'DH', bats: 'R', age: 37, pa: 59, h: 13, double: 2, triple: 1, hr: 2, bb: 6, so: 16, hbp: 1, sb: 6, cs: 3, sec: '1B' },
    ],
    pitchers: [
      { id: 'clemero02', name: 'Roger Clemens', role: 'SP', throws: 'R', age: 35, g: 33, gs: 33, outs: 704, h: 179, hr: 11, bb: 80, so: 262, hbp: 8, er: 67, w: 20, l: 6, sv: 0, fld: 62 },
      { id: 'guzmaju01', name: 'Juan Guzman', role: 'SP', throws: 'R', age: 31, g: 33, gs: 33, outs: 633, h: 189, hr: 27, bb: 93, so: 176, hbp: 8, er: 98, w: 10, l: 16, sv: 0, fld: 56 },
      { id: 'williwo02', name: 'Woody Williams', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 629, h: 204, hr: 34, bb: 77, so: 144, hbp: 3, er: 103, w: 10, l: 9, sv: 0, fld: 57 },
      { id: 'hentgpa01', name: 'Pat Hentgen', role: 'SP', throws: 'R', age: 29, g: 29, gs: 29, outs: 533, h: 191, hr: 23, bb: 62, so: 109, hbp: 5, er: 86, w: 12, l: 11, sv: 0, fld: 69 },
      { id: 'carpech01', name: 'Chris Carpenter', role: 'SP', throws: 'R', age: 23, g: 33, gs: 24, outs: 525, h: 186, hr: 17, bb: 64, so: 129, hbp: 5, er: 86, w: 12, l: 7, sv: 0, fld: 68 },
      { id: 'myersra01', name: 'Randy Myers', role: 'CL', throws: 'L', age: 35, g: 62, gs: 0, outs: 170, h: 55, hr: 5, bb: 25, so: 52, hbp: 1, er: 23, w: 4, l: 7, sv: 28 },
      { id: 'quantpa01', name: 'Paul Quantrill', role: 'RP', throws: 'R', age: 29, g: 82, gs: 0, outs: 240, h: 92, hr: 7, bb: 22, so: 54, hbp: 2, er: 27, w: 3, l: 4, sv: 7 },
      { id: 'rislebi01', name: 'Bill Risley', role: 'RP', throws: 'R', age: 31, g: 44, gs: 0, outs: 164, h: 50, hr: 8, bb: 34, so: 41, hbp: 3, er: 32, w: 3, l: 4, sv: 0 },
      { id: 'stiebda01', name: 'Dave Stieb', role: 'RP', throws: 'R', age: 40, g: 19, gs: 3, outs: 151, h: 58, hr: 6, bb: 17, so: 27, hbp: 5, er: 27, w: 1, l: 2, sv: 2 },
      { id: 'plesada01', name: 'Dan Plesac', role: 'RP', throws: 'L', age: 36, g: 78, gs: 0, outs: 150, h: 43, hr: 5, bb: 17, so: 56, hbp: 0, er: 21, w: 4, l: 3, sv: 4 },
      { id: 'hansoer01', name: 'Erik Hanson', role: 'RP', throws: 'R', age: 33, g: 11, gs: 8, outs: 147, h: 66, hr: 8, bb: 27, so: 34, hbp: 1, er: 34, w: 0, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'escobke01', name: 'Kelvim Escobar', role: 'SP', throws: 'R', age: 22, g: 22, gs: 10, outs: 239, h: 71, hr: 4, bb: 38, so: 76, hbp: 0, er: 31, w: 7, l: 3, sv: 0, rk: true },
      { id: 'persoro01', name: 'Robert Person', role: 'RP', throws: 'R', age: 28, g: 27, gs: 0, outs: 115, h: 41, hr: 7, bb: 19, so: 32, hbp: 2, er: 26, w: 3, l: 1, sv: 6 },
      { id: 'almanca01', name: 'Carlos Almanzar', role: 'RP', throws: 'R', age: 24, g: 25, gs: 0, outs: 86, h: 33, hr: 4, bb: 8, so: 21, hbp: 1, er: 17, w: 2, l: 2, sv: 0, rk: true },
      { id: 'sinclst01', name: 'Steve Sinclair', role: 'RP', throws: 'L', age: 26, g: 24, gs: 0, outs: 45, h: 13, hr: 0, bb: 5, so: 8, hbp: 0, er: 6, w: 0, l: 2, sv: 0, rk: true },
      { id: 'hallaro01', name: 'Roy Halladay', role: 'RP', throws: 'R', age: 21, g: 2, gs: 2, outs: 42, h: 9, hr: 2, bb: 2, so: 13, hbp: 0, er: 3, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // CWS (CHA 1998)
  {
    franchiseId: 'CWS',
    season: 1998,
    batters: [
      { id: 'kreutch01', name: 'Chad Kreuter', pos: 'C', bats: 'S', age: 33, pa: 294, h: 62, double: 10, triple: 1, hr: 4, bb: 32, so: 57, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 64, arm: 70 },
      { id: 'cordewi01', name: 'Wil Cordero', pos: '1B', bats: 'R', age: 26, pa: 371, h: 95, double: 18, triple: 2, hr: 11, bb: 20, so: 69, hbp: 3, sb: 1, cs: 1, sec: 'LF', fld: 76 },
      { id: 'durhara01', name: 'Ray Durham', pos: '2B', bats: 'S', age: 26, pa: 723, h: 178, double: 33, triple: 7, hr: 15, bb: 68, so: 103, hbp: 7, sb: 35, cs: 11, sec: 'SS', fld: 66 },
      { id: 'venturo01', name: 'Robin Ventura', pos: '3B', bats: 'L', age: 30, pa: 674, h: 157, double: 31, triple: 3, hr: 23, bb: 82, so: 98, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 81 },
      { id: 'carusmi01', name: 'Mike Caruso', pos: 'SS', bats: 'L', age: 21, pa: 555, h: 160, double: 17, triple: 6, hr: 5, bb: 14, so: 38, hbp: 7, sb: 22, cs: 6, sec: '2B', fld: 70, rk: true },
      { id: 'belleal01', name: 'Albert Belle', pos: 'LF', bats: 'R', age: 31, pa: 706, h: 189, double: 45, triple: 2, hr: 43, bb: 75, so: 92, hbp: 4, sb: 6, cs: 3, sec: 'RF', fld: 77, arm: 71 },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 25, pa: 443, h: 88, double: 17, triple: 4, hr: 10, bb: 44, so: 102, hbp: 6, sb: 25, cs: 8, sec: 'RF', fld: 88, arm: 67 },
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 24, pa: 578, h: 153, double: 27, triple: 2, hr: 15, bb: 27, so: 54, hbp: 8, sb: 9, cs: 8, sec: 'CF', fld: 83, arm: 71, rk: true },
      { id: 'thomafr04', name: 'Frank Thomas', pos: 'DH', bats: 'R', age: 30, pa: 712, h: 177, double: 35, triple: 1, hr: 34, bb: 115, so: 85, hbp: 5, sb: 4, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'nortogr01', name: 'Greg Norton', pos: '1B', bats: 'S', age: 25, pa: 330, h: 71, double: 17, triple: 3, hr: 9, bb: 26, so: 77, hbp: 2, sb: 3, cs: 3, sec: '3B', fld: 61, rk: true },
      { id: 'abbotje01', name: 'Jeff Abbott', pos: 'CF', bats: 'R', age: 25, pa: 260, h: 68, double: 13, triple: 1, hr: 12, bb: 8, so: 29, hbp: 0, sb: 3, cs: 3, sec: 'RF', fld: 55, arm: 54, rk: true },
      { id: 'obriech01', name: 'Charlie O\'Brien', pos: 'C', bats: 'R', age: 38, pa: 193, h: 40, double: 10, triple: 0, hr: 4, bb: 13, so: 33, hbp: 6, sb: 0, cs: 1, fld: 74, arm: 70 },
      { id: 'snopech01', name: 'Chris Snopek', pos: 'SS', bats: 'R', age: 27, pa: 155, h: 31, double: 5, triple: 0, hr: 2, bb: 11, so: 26, hbp: 1, sb: 2, cs: 1, sec: '3B', fld: 85 },
      { id: 'macharo01', name: 'Robert Machado', pos: 'C', bats: 'R', age: 25, pa: 121, h: 24, double: 6, triple: 1, hr: 3, bb: 7, so: 23, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 62, arm: 71, rk: true },
    ],
    reserveBatters: [
      { id: 'sierrru01', name: 'Ruben Sierra', pos: 'RF', bats: 'S', age: 32, pa: 77, h: 17, double: 3, triple: 1, hr: 2, bb: 6, so: 13, hbp: 0, sb: 1, cs: 0, sec: 'LF' },
      { id: 'wilsocr02', name: 'Craig Wilson', pos: 'SS', bats: 'R', age: 27, pa: 53, h: 22, double: 5, triple: 0, hr: 3, bb: 3, so: 6, hbp: 0, sb: 1, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'sirotmi01', name: 'Mike Sirotka', role: 'SP', throws: 'L', age: 27, g: 33, gs: 33, outs: 635, h: 254, hr: 29, bb: 48, so: 129, hbp: 2, er: 115, w: 14, l: 15, sv: 0, fld: 71 },
      { id: 'navarja01', name: 'Jaime Navarro', role: 'SP', throws: 'R', age: 31, g: 37, gs: 27, outs: 518, h: 219, hr: 24, bb: 68, so: 99, hbp: 6, er: 112, w: 8, l: 16, sv: 1, fld: 64 },
      { id: 'baldwja01', name: 'James Baldwin', role: 'SP', throws: 'R', age: 26, g: 37, gs: 24, outs: 477, h: 170, hr: 18, bb: 62, so: 113, hbp: 7, er: 92, w: 13, l: 6, sv: 0, fld: 52 },
      { id: 'bereja01', name: 'Jason Bere', role: 'SP', throws: 'R', age: 27, g: 27, gs: 22, outs: 382, h: 133, hr: 17, bb: 80, so: 88, hbp: 4, er: 81, w: 6, l: 9, sv: 0 },
      { id: 'parquji01', name: 'Jim Parque', role: 'SP', throws: 'L', age: 23, g: 21, gs: 21, outs: 339, h: 135, hr: 14, bb: 49, so: 77, hbp: 6, er: 64, w: 7, l: 5, sv: 0, rk: true },
      { id: 'simasbi01', name: 'Bill Simas', role: 'CL', throws: 'R', age: 26, g: 60, gs: 0, outs: 212, h: 60, hr: 10, bb: 28, so: 56, hbp: 2, er: 29, w: 4, l: 3, sv: 18 },
      { id: 'castica02', name: 'Carlos Castillo', role: 'RP', throws: 'R', age: 23, g: 54, gs: 2, outs: 301, h: 95, hr: 16, bb: 39, so: 63, hbp: 4, er: 54, w: 6, l: 4, sv: 0 },
      { id: 'foulkke01', name: 'Keith Foulke', role: 'RP', throws: 'R', age: 25, g: 54, gs: 0, outs: 196, h: 60, hr: 10, bb: 19, so: 51, hbp: 4, er: 35, w: 3, l: 2, sv: 1 },
      { id: 'karchma01', name: 'Matt Karchner', role: 'RP', throws: 'R', age: 31, g: 61, gs: 0, outs: 194, h: 63, hr: 8, bb: 35, so: 47, hbp: 4, er: 33, w: 5, l: 5, sv: 11 },
      { id: 'howrybo01', name: 'Bob Howry', role: 'RP', throws: 'R', age: 24, g: 44, gs: 0, outs: 163, h: 37, hr: 7, bb: 19, so: 51, hbp: 2, er: 19, w: 0, l: 3, sv: 9, rk: true },
      { id: 'fordhto01', name: 'Tom Fordham', role: 'RP', throws: 'L', age: 24, g: 29, gs: 5, outs: 144, h: 51, hr: 7, bb: 40, so: 24, hbp: 1, er: 36, w: 1, l: 2, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'eyresc01', name: 'Scott Eyre', role: 'SP', throws: 'L', age: 26, g: 33, gs: 17, outs: 321, h: 114, hr: 23, bb: 62, so: 71, hbp: 2, er: 63, w: 3, l: 8, sv: 0 },
      { id: 'snydejo02', name: 'John Snyder', role: 'SP', throws: 'R', age: 23, g: 15, gs: 14, outs: 259, h: 96, hr: 14, bb: 23, so: 52, hbp: 2, er: 46, w: 7, l: 2, sv: 0, rk: true },
      { id: 'abbotji01', name: 'Jim Abbott', role: 'RP', throws: 'L', age: 30, g: 5, gs: 5, outs: 95, h: 36, hr: 4, bb: 15, so: 13, hbp: 1, er: 21, w: 5, l: 0, sv: 0 },
      { id: 'bradfch01', name: 'Chad Bradford', role: 'RP', throws: 'R', age: 23, g: 29, gs: 0, outs: 92, h: 27, hr: 0, bb: 7, so: 11, hbp: 0, er: 11, w: 2, l: 1, sv: 1, rk: true },
      { id: 'castito02', name: 'Tony Castillo', role: 'RP', throws: 'L', age: 35, g: 25, gs: 0, outs: 81, h: 34, hr: 4, bb: 10, so: 18, hbp: 1, er: 17, w: 1, l: 2, sv: 0 },
    ],
  },
  // CLE (CLE 1998)
  {
    franchiseId: 'CLE',
    season: 1998,
    batters: [
      { id: 'alomasa02', name: 'Sandy Alomar', pos: 'C', bats: 'R', age: 32, pa: 438, h: 111, double: 28, triple: 1, hr: 11, bb: 18, so: 44, hbp: 3, sb: 0, cs: 2, sec: '1B', fld: 75, arm: 67 },
      { id: 'thomeji01', name: 'Jim Thome', pos: '1B', bats: 'L', age: 27, pa: 537, h: 127, double: 28, triple: 2, hr: 32, bb: 97, so: 131, hbp: 4, sb: 1, cs: 1, sec: '3B', fld: 70 },
      { id: 'bellda01', name: 'David Bell', pos: '2B', bats: 'R', age: 25, pa: 464, h: 110, double: 27, triple: 2, hr: 8, bb: 28, so: 68, hbp: 2, sb: 1, cs: 3, sec: '3B', fld: 83 },
      { id: 'frymatr01', name: 'Travis Fryman', pos: '3B', bats: 'R', age: 29, pa: 608, h: 154, double: 29, triple: 2, hr: 24, bb: 45, so: 114, hbp: 4, sb: 10, cs: 5, sec: 'SS', fld: 60 },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 31, pa: 660, h: 166, double: 29, triple: 5, hr: 4, bb: 60, so: 59, hbp: 3, sb: 39, cs: 12, sec: '2B', fld: 83 },
      { id: 'gilesbr02', name: 'Brian Giles', pos: 'LF', bats: 'L', age: 27, pa: 430, h: 97, double: 19, triple: 1, hr: 16, bb: 67, so: 62, hbp: 2, sb: 11, cs: 4, sec: 'RF', fld: 85, arm: 71 },
      { id: 'loftoke01', name: 'Kenny Lofton', pos: 'CF', bats: 'L', age: 31, pa: 698, h: 184, double: 30, triple: 6, hr: 11, bb: 79, so: 86, hbp: 2, sb: 51, cs: 15, sec: 'LF', fld: 63, arm: 86 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'RF', bats: 'R', age: 26, pa: 663, h: 175, double: 39, triple: 2, hr: 37, bb: 79, so: 117, hbp: 6, sb: 5, cs: 3, sec: 'LF', fld: 66, arm: 69 },
      { id: 'justida01', name: 'David Justice', pos: 'DH', bats: 'L', age: 32, pa: 625, h: 161, double: 37, triple: 2, hr: 26, bb: 80, so: 92, hbp: 0, sb: 7, cs: 4, sec: 'RF' },
    ],
    bench: [
      { id: 'whitema01', name: 'Mark Whiten', pos: 'LF', bats: 'S', age: 31, pa: 259, h: 61, double: 12, triple: 0, hr: 7, bb: 32, so: 59, hbp: 2, sb: 5, cs: 2, sec: 'RF', fld: 84, arm: 83 },
      { id: 'dunstsh01', name: 'Shawon Dunston', pos: '2B', bats: 'R', age: 35, pa: 221, h: 57, double: 11, triple: 2, hr: 6, bb: 5, so: 30, hbp: 2, sb: 11, cs: 3, sec: 'SS', fld: 65 },
      { id: 'sexsori01', name: 'Richie Sexson', pos: '1B', bats: 'R', age: 23, pa: 183, h: 54, double: 13, triple: 1, hr: 11, bb: 6, so: 42, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 70, rk: true },
      { id: 'bordepa01', name: 'Pat Borders', pos: 'C', bats: 'R', age: 35, pa: 175, h: 43, double: 6, triple: 0, hr: 2, bb: 9, so: 35, hbp: 2, sb: 0, cs: 2, fld: 58, arm: 65 },
      { id: 'bransje01', name: 'Jeff Branson', pos: '2B', bats: 'L', age: 31, pa: 105, h: 21, double: 4, triple: 1, hr: 2, bb: 7, so: 21, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'wilsoen01', name: 'Enrique Wilson', pos: '2B', bats: 'S', age: 24, pa: 97, h: 29, double: 5, triple: 0, hr: 2, bb: 4, so: 8, hbp: 1, sb: 2, cs: 4, sec: 'SS', fld: 84, rk: true },
      { id: 'mantoje01', name: 'Jeff Manto', pos: '1B', bats: 'R', age: 33, pa: 73, h: 15, double: 4, triple: 0, hr: 3, bb: 6, so: 19, hbp: 1, sb: 1, cs: 1, sec: '3B' },
      { id: 'diazei01', name: 'Einar Diaz', pos: 'C', bats: 'R', age: 25, pa: 56, h: 11, double: 2, triple: 0, hr: 2, bb: 3, so: 3, hbp: 2, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'nagych01', name: 'Charles Nagy', role: 'SP', throws: 'R', age: 31, g: 33, gs: 33, outs: 631, h: 241, hr: 29, bb: 67, so: 135, hbp: 7, er: 109, w: 15, l: 10, sv: 0, fld: 84 },
      { id: 'colonba01', name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 25, g: 31, gs: 31, outs: 612, h: 209, hr: 17, bb: 82, so: 153, hbp: 4, er: 93, w: 14, l: 9, sv: 0, fld: 75 },
      { id: 'burbada01', name: 'Dave Burba', role: 'SP', throws: 'R', age: 31, g: 32, gs: 31, outs: 611, h: 202, hr: 27, bb: 81, so: 145, hbp: 7, er: 95, w: 15, l: 10, sv: 0, fld: 69 },
      { id: 'wrighja02', name: 'Jaret Wright', role: 'SP', throws: 'R', age: 22, g: 32, gs: 32, outs: 578, h: 201, hr: 22, bb: 85, so: 140, hbp: 11, er: 101, w: 12, l: 10, sv: 0, fld: 73 },
      { id: 'goodedw01', name: 'Dwight Gooden', role: 'SP', throws: 'R', age: 33, g: 23, gs: 23, outs: 402, h: 135, hr: 14, bb: 58, so: 85, hbp: 8, er: 64, w: 8, l: 6, sv: 0, fld: 69 },
      { id: 'jacksmi02', name: 'Michael Jackson', role: 'CL', throws: 'R', age: 33, g: 69, gs: 0, outs: 192, h: 46, hr: 4, bb: 18, so: 57, hbp: 4, er: 17, w: 1, l: 1, sv: 40 },
      { id: 'mesajo01', name: 'Jose Mesa', role: 'RP', throws: 'R', age: 32, g: 76, gs: 0, outs: 254, h: 89, hr: 8, bb: 35, so: 69, hbp: 4, er: 36, w: 8, l: 7, sv: 1 },
      { id: 'plunker01', name: 'Eric Plunk', role: 'RP', throws: 'R', age: 34, g: 63, gs: 0, outs: 218, h: 71, hr: 10, bb: 34, so: 76, hbp: 3, er: 34, w: 4, l: 3, sv: 1 },
      { id: 'ogeach01', name: 'Chad Ogea', role: 'RP', throws: 'R', age: 27, g: 19, gs: 9, outs: 207, h: 75, hr: 9, bb: 24, so: 45, hbp: 4, er: 40, w: 5, l: 4, sv: 0 },
      { id: 'shueypa01', name: 'Paul Shuey', role: 'RP', throws: 'R', age: 27, g: 43, gs: 0, outs: 153, h: 47, hr: 6, bb: 26, so: 52, hbp: 2, er: 22, w: 5, l: 4, sv: 2 },
      { id: 'assenpa01', name: 'Paul Assenmacher', role: 'RP', throws: 'L', age: 37, g: 69, gs: 0, outs: 141, h: 50, hr: 4, bb: 17, so: 48, hbp: 2, er: 17, w: 2, l: 5, sv: 3 },
    ],
    reservePitchers: [
      { id: 'mormaal01', name: 'Alvin Morman', role: 'RP', throws: 'L', age: 29, g: 40, gs: 0, outs: 87, h: 31, hr: 5, bb: 16, so: 22, hbp: 0, er: 17, w: 0, l: 2, sv: 0 },
      { id: 'villoro01', name: 'Ron Villone', role: 'RP', throws: 'L', age: 28, g: 25, gs: 0, outs: 81, h: 28, hr: 3, bb: 20, so: 20, hbp: 2, er: 13, w: 0, l: 0, sv: 0 },
      { id: 'karsast01', name: 'Steve Karsay', role: 'RP', throws: 'R', age: 26, g: 11, gs: 1, outs: 73, h: 30, hr: 3, bb: 8, so: 16, hbp: 2, er: 15, w: 0, l: 2, sv: 0 },
      { id: 'martito02', name: 'Tom Martin', role: 'RP', throws: 'L', age: 28, g: 14, gs: 0, outs: 44, h: 22, hr: 1, bb: 9, so: 11, hbp: 0, er: 10, w: 1, l: 1, sv: 0 },
    ],
  },
  // DET (DET 1998)
  {
    franchiseId: 'DET',
    season: 1998,
    batters: [
      { id: 'bakopa01', name: 'Paul Bako', pos: 'C', bats: 'L', age: 26, pa: 333, h: 83, double: 12, triple: 1, hr: 3, bb: 23, so: 82, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 67, arm: 72, rk: true },
      { id: 'clarkto02', name: 'Tony Clark', pos: '1B', bats: 'S', age: 26, pa: 673, h: 167, double: 32, triple: 1, hr: 34, bb: 72, so: 142, hbp: 3, sb: 2, cs: 3, sec: '3B', fld: 69 },
      { id: 'easleda01', name: 'Damion Easley', pos: '2B', bats: 'R', age: 28, pa: 651, h: 155, double: 37, triple: 2, hr: 25, bb: 52, so: 111, hbp: 16, sb: 20, cs: 8, sec: '3B', fld: 91 },
      { id: 'randajo01', name: 'Joe Randa', pos: '3B', bats: 'R', age: 28, pa: 514, h: 127, double: 25, triple: 4, hr: 8, bb: 41, so: 68, hbp: 6, sb: 8, cs: 5, sec: '2B', fld: 76 },
      { id: 'cruzde01', name: 'Deivi Cruz', pos: 'SS', bats: 'R', age: 25, pa: 477, h: 114, double: 24, triple: 2, hr: 4, bb: 14, so: 55, hbp: 2, sb: 3, cs: 5, sec: '2B', fld: 84 },
      { id: 'gonzalu01', name: 'Luis Gonzalez', pos: 'LF', bats: 'L', age: 30, pa: 620, h: 144, double: 33, triple: 4, hr: 18, bb: 63, so: 62, hbp: 6, sb: 11, cs: 7, sec: 'RF', fld: 67, arm: 69 },
      { id: 'huntebr02', name: 'Brian Hunter', pos: 'CF', bats: 'R', age: 27, pa: 636, h: 154, double: 28, triple: 4, hr: 4, bb: 42, so: 100, hbp: 2, sb: 50, cs: 13, sec: 'LF', fld: 89, arm: 74 },
      { id: 'higgibo02', name: 'Bobby Higginson', pos: 'RF', bats: 'L', age: 27, pa: 685, h: 178, double: 37, triple: 4, hr: 28, bb: 71, so: 97, hbp: 4, sb: 7, cs: 5, sec: 'LF', fld: 71, arm: 84 },
      { id: 'olivejo01', name: 'Joe Oliver', pos: 'DH', bats: 'R', age: 32, pa: 263, h: 57, double: 10, triple: 0, hr: 8, bb: 18, so: 44, hbp: 2, sb: 1, cs: 1, sec: 'C', fld: 67, arm: 69 },
    ],
    bench: [
      { id: 'catalfr01', name: 'Frank Catalanotto', pos: '2B', bats: 'L', age: 24, pa: 234, h: 60, double: 13, triple: 2, hr: 6, bb: 13, so: 40, hbp: 4, sb: 3, cs: 2, sec: 'SS', rk: true },
      { id: 'alvarga01', name: 'Gabe Alvarez', pos: '3B', bats: 'R', age: 24, pa: 221, h: 46, double: 11, triple: 0, hr: 5, bb: 18, so: 65, hbp: 2, sb: 1, cs: 3, sec: '1B', fld: 54, rk: true },
      { id: 'berroge01', name: 'Geronimo Berroa', pos: 'DH', bats: 'R', age: 33, pa: 217, h: 52, double: 9, triple: 1, hr: 8, bb: 23, so: 41, hbp: 2, sb: 1, cs: 1, sec: 'RF' },
      { id: 'encarju01', name: 'Juan Encarnacion', pos: 'RF', bats: 'R', age: 22, pa: 175, h: 51, double: 8, triple: 4, hr: 7, bb: 8, so: 34, hbp: 2, sb: 8, cs: 4, sec: 'CF', fld: 53, arm: 79, rk: true },
      { id: 'barteki01', name: 'Kimera Bartee', pos: 'CF', bats: 'S', age: 25, pa: 105, h: 21, double: 4, triple: 1, hr: 2, bb: 7, so: 34, hbp: 0, sb: 10, cs: 5, sec: 'LF', fld: 74, arm: 92 },
    ],
    reserveBatters: [
      { id: 'ripkebi01', name: 'Billy Ripken', pos: 'SS', bats: 'R', age: 33, pa: 81, h: 20, double: 3, triple: 0, hr: 1, bb: 4, so: 11, hbp: 0, sb: 1, cs: 1, sec: '2B', fld: 53 },
      { id: 'tombean01', name: 'Andy Tomberlin', pos: 'DH', bats: 'L', age: 31, pa: 75, h: 16, double: 2, triple: 0, hr: 2, bb: 5, so: 26, hbp: 2, sb: 1, cs: 0, sec: 'RF' },
      { id: 'siddajo01', name: 'Joe Siddall', pos: 'C', bats: 'L', age: 30, pa: 74, h: 12, double: 3, triple: 0, hr: 1, bb: 6, so: 23, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 86, rk: true },
      { id: 'beamotr01', name: 'Trey Beamon', pos: 'DH', bats: 'L', age: 24, pa: 48, h: 11, double: 3, triple: 0, hr: 0, bb: 3, so: 11, hbp: 0, sb: 1, cs: 1, sec: 'LF', rk: true },
      { id: 'casanra01', name: 'Raul Casanova', pos: 'C', bats: 'S', age: 25, pa: 48, h: 10, double: 1, triple: 0, hr: 1, bb: 4, so: 8, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'thompju02', name: 'Justin Thompson', role: 'SP', throws: 'L', age: 25, g: 34, gs: 34, outs: 666, h: 216, hr: 21, bb: 77, so: 153, hbp: 2, er: 93, w: 11, l: 15, sv: 0, fld: 70 },
      { id: 'moehlbr01', name: 'Brian Moehler', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 664, h: 226, hr: 29, bb: 63, so: 119, hbp: 3, er: 100, w: 14, l: 13, sv: 0, fld: 72 },
      { id: 'floribr01', name: 'Bryce Florie', role: 'SP', throws: 'R', age: 28, g: 42, gs: 16, outs: 399, h: 136, hr: 13, bb: 65, so: 99, hbp: 5, er: 69, w: 8, l: 9, sv: 0 },
      { id: 'greisse01', name: 'Seth Greisinger', role: 'SP', throws: 'R', age: 22, g: 21, gs: 21, outs: 390, h: 142, hr: 17, bb: 48, so: 66, hbp: 4, er: 74, w: 6, l: 9, sv: 0, rk: true },
      { id: 'castifr01', name: 'Frank Castillo', role: 'SP', throws: 'R', age: 29, g: 27, gs: 19, outs: 348, h: 145, hr: 17, bb: 42, so: 84, hbp: 5, er: 78, w: 3, l: 9, sv: 1 },
      { id: 'jonesto02', name: 'Todd Jones', role: 'CL', throws: 'R', age: 30, g: 65, gs: 0, outs: 190, h: 58, hr: 5, bb: 35, so: 58, hbp: 2, er: 30, w: 1, l: 4, sv: 28 },
      { id: 'worreti01', name: 'Tim Worrell', role: 'RP', throws: 'R', age: 30, g: 43, gs: 9, outs: 309, h: 103, hr: 13, bb: 35, so: 80, hbp: 4, er: 54, w: 2, l: 7, sv: 0 },
      { id: 'bochtdo01', name: 'Doug Bochtler', role: 'RP', throws: 'R', age: 27, g: 51, gs: 0, outs: 202, h: 65, hr: 11, bb: 47, so: 52, hbp: 2, er: 40, w: 0, l: 2, sv: 0 },
      { id: 'brocado01', name: 'Doug Brocail', role: 'RP', throws: 'R', age: 31, g: 60, gs: 0, outs: 188, h: 52, hr: 5, bb: 22, so: 48, hbp: 2, er: 21, w: 5, l: 2, sv: 0 },
      { id: 'sageraj01', name: 'A. J. Sager', role: 'RP', throws: 'R', age: 33, g: 31, gs: 3, outs: 178, h: 72, hr: 7, bb: 21, so: 33, hbp: 1, er: 37, w: 4, l: 2, sv: 2 },
      { id: 'runyase01', name: 'Sean Runyan', role: 'RP', throws: 'L', age: 24, g: 88, gs: 0, outs: 151, h: 47, hr: 7, bb: 28, so: 39, hbp: 2, er: 20, w: 1, l: 4, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'powelbr01', name: 'Brian Powell', role: 'SP', throws: 'R', age: 24, g: 18, gs: 16, outs: 251, h: 101, hr: 17, bb: 36, so: 46, hbp: 2, er: 59, w: 3, l: 8, sv: 0, rk: true },
      { id: 'crowde01', name: 'Dean Crow', role: 'RP', throws: 'R', age: 25, g: 32, gs: 0, outs: 137, h: 55, hr: 6, bb: 16, so: 18, hbp: 2, er: 20, w: 2, l: 2, sv: 0, rk: true },
      { id: 'anderma01', name: 'Matt Anderson', role: 'RP', throws: 'R', age: 21, g: 42, gs: 0, outs: 132, h: 38, hr: 3, bb: 31, so: 44, hbp: 2, er: 16, w: 5, l: 1, sv: 0, rk: true },
      { id: 'keaglgr01', name: 'Greg Keagle', role: 'RP', throws: 'R', age: 27, g: 9, gs: 7, outs: 116, h: 46, hr: 6, bb: 21, so: 27, hbp: 4, er: 27, w: 0, l: 5, sv: 0 },
      { id: 'duranro01', name: 'Roberto Duran', role: 'RP', throws: 'L', age: 25, g: 18, gs: 0, outs: 46, h: 9, hr: 0, bb: 18, so: 13, hbp: 3, er: 11, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // KCR (KCA 1998)
  {
    franchiseId: 'KCR',
    season: 1998,
    batters: [
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: 'C', bats: 'R', age: 24, pa: 311, h: 72, double: 15, triple: 0, hr: 8, bb: 23, so: 38, hbp: 4, sb: 2, cs: 3, sec: '1B', fld: 63, arm: 67 },
      { id: 'kingje01', name: 'Jeff King', pos: '1B', bats: 'R', age: 33, pa: 540, h: 121, double: 22, triple: 1, hr: 24, bb: 56, so: 76, hbp: 2, sb: 12, cs: 3, sec: '3B', fld: 76 },
      { id: 'offerjo01', name: 'Jose Offerman', pos: '2B', bats: 'S', age: 29, pa: 709, h: 190, double: 31, triple: 11, hr: 6, bb: 81, so: 98, hbp: 3, sb: 34, cs: 13, sec: 'SS', fld: 67 },
      { id: 'palmede01', name: 'Dean Palmer', pos: '3B', bats: 'R', age: 29, pa: 639, h: 156, double: 29, triple: 2, hr: 32, bb: 49, so: 139, hbp: 5, sb: 5, cs: 2, sec: '1B', fld: 40 },
      { id: 'haltesh01', name: 'Shane Halter', pos: 'SS', bats: 'R', age: 28, pa: 226, h: 48, double: 11, triple: 0, hr: 2, bb: 13, so: 40, hbp: 2, sb: 3, cs: 5, sec: '2B', fld: 82 },
      { id: 'coninje01', name: 'Jeff Conine', pos: 'LF', bats: 'R', age: 32, pa: 343, h: 79, double: 18, triple: 1, hr: 11, bb: 33, so: 66, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 71, arm: 67 },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'CF', bats: 'L', age: 24, pa: 710, h: 177, double: 26, triple: 10, hr: 14, bb: 55, so: 86, hbp: 4, sb: 26, cs: 12, sec: 'RF', fld: 72, arm: 70 },
      { id: 'dyeje01', name: 'Jermaine Dye', pos: 'RF', bats: 'R', age: 24, pa: 230, h: 52, double: 9, triple: 0, hr: 6, bb: 11, so: 45, hbp: 1, sb: 2, cs: 2, sec: 'LF', fld: 95, arm: 70 },
      { id: 'morriha02', name: 'Hal Morris', pos: 'DH', bats: 'L', age: 33, pa: 516, h: 141, double: 28, triple: 2, hr: 4, bb: 35, so: 57, hbp: 3, sb: 3, cs: 1, sec: '1B', fld: 73 },
    ],
    bench: [
      { id: 'suttola01', name: 'Larry Sutton', pos: 'RF', bats: 'L', age: 28, pa: 351, h: 78, double: 13, triple: 2, hr: 6, bb: 28, so: 47, hbp: 3, sb: 3, cs: 3, sec: 'LF', fld: 71, arm: 66, rk: true },
      { id: 'pendlte01', name: 'Terry Pendleton', pos: 'DH', bats: 'S', age: 37, pa: 254, h: 58, double: 12, triple: 0, hr: 3, bb: 17, so: 45, hbp: 0, sb: 1, cs: 1, sec: '3B' },
      { id: 'fasansa01', name: 'Sal Fasano', pos: 'C', bats: 'R', age: 26, pa: 247, h: 48, double: 9, triple: 0, hr: 8, bb: 12, so: 55, hbp: 13, sb: 1, cs: 0, sec: '1B', fld: 79, arm: 84 },
      { id: 'macksh01', name: 'Shane Mack', pos: 'LF', bats: 'R', age: 34, pa: 231, h: 60, double: 14, triple: 1, hr: 6, bb: 15, so: 37, hbp: 6, sb: 7, cs: 2, sec: 'CF', fld: 65, arm: 62 },
      { id: 'lopezme01', name: 'Mendy Lopez', pos: 'SS', bats: 'R', age: 24, pa: 225, h: 50, double: 10, triple: 2, hr: 1, bb: 12, so: 40, hbp: 1, sb: 5, cs: 2, sec: '2B', fld: 83, rk: true },
    ],
    reserveBatters: [
      { id: 'riverlu01', name: 'Luis Rivera', pos: 'SS', bats: 'R', age: 34, pa: 98, h: 22, double: 4, triple: 1, hr: 0, bb: 7, so: 19, hbp: 0, sb: 1, cs: 1, sec: '2B', fld: 90 },
      { id: 'martife01', name: 'Felix Martinez', pos: 'SS', bats: 'S', age: 24, pa: 95, h: 12, double: 1, triple: 1, hr: 0, bb: 7, so: 21, hbp: 1, sb: 2, cs: 1, sec: '2B', fld: 73, rk: true },
      { id: 'giambje01', name: 'Jeremy Giambi', pos: 'LF', bats: 'L', age: 23, pa: 70, h: 13, double: 4, triple: 0, hr: 2, bb: 11, so: 9, hbp: 0, sb: 0, cs: 1, sec: 'RF', rk: true },
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 21, pa: 63, h: 16, double: 5, triple: 3, hr: 0, bb: 3, so: 12, hbp: 1, sb: 3, cs: 0, sec: 'LF', rk: true },
      { id: 'younger02', name: 'Ernie Young', pos: 'RF', bats: 'R', age: 28, pa: 56, h: 11, double: 2, triple: 0, hr: 2, bb: 5, so: 13, hbp: 1, sb: 1, cs: 1, sec: 'CF', fld: 100, arm: 88 },
    ],
    pitchers: [
      { id: 'belchti01', name: 'Tim Belcher', role: 'SP', throws: 'R', age: 36, g: 34, gs: 34, outs: 702, h: 253, hr: 34, bb: 73, so: 124, hbp: 6, er: 115, w: 14, l: 14, sv: 0, fld: 61 },
      { id: 'rapppa01', name: 'Pat Rapp', role: 'SP', throws: 'R', age: 30, g: 32, gs: 32, outs: 565, h: 210, hr: 22, bb: 104, so: 125, hbp: 8, er: 108, w: 12, l: 13, sv: 0, fld: 75 },
      { id: 'rosadjo01', name: 'Jose Rosado', role: 'SP', throws: 'L', age: 23, g: 38, gs: 25, outs: 524, h: 178, hr: 23, bb: 58, so: 123, hbp: 5, er: 88, w: 8, l: 11, sv: 1, fld: 69 },
      { id: 'ruschgl01', name: 'Glendon Rusch', role: 'SP', throws: 'L', age: 23, g: 29, gs: 24, outs: 464, h: 190, hr: 24, bb: 49, so: 99, hbp: 5, er: 98, w: 6, l: 15, sv: 1, fld: 70 },
      { id: 'pichahi01', name: 'Hipolito Pichardo', role: 'SP', throws: 'R', age: 28, g: 27, gs: 18, outs: 337, h: 124, hr: 12, bb: 45, so: 62, hbp: 4, er: 62, w: 7, l: 8, sv: 1 },
      { id: 'montgje01', name: 'Jeff Montgomery', role: 'CL', throws: 'R', age: 36, g: 56, gs: 0, outs: 168, h: 56, hr: 9, bb: 20, so: 50, hbp: 1, er: 28, w: 2, l: 5, sv: 36 },
      { id: 'servisc01', name: 'Scott Service', role: 'RP', throws: 'R', age: 31, g: 73, gs: 0, outs: 248, h: 76, hr: 8, bb: 32, so: 90, hbp: 8, er: 36, w: 6, l: 4, sv: 4 },
      { id: 'pittsji01', name: 'Jim Pittsley', role: 'RP', throws: 'R', age: 24, g: 39, gs: 2, outs: 205, h: 83, hr: 11, bb: 36, so: 39, hbp: 3, er: 47, w: 1, l: 1, sv: 0 },
      { id: 'whisema01', name: 'Matt Whisenant', role: 'RP', throws: 'L', age: 27, g: 70, gs: 0, outs: 182, h: 59, hr: 2, bb: 36, so: 47, hbp: 4, er: 32, w: 2, l: 1, sv: 2, rk: true },
      { id: 'bonesri01', name: 'Ricky Bones', role: 'RP', throws: 'R', age: 29, g: 32, gs: 0, outs: 160, h: 59, hr: 7, bb: 21, so: 26, hbp: 3, er: 30, w: 2, l: 2, sv: 1 },
      { id: 'barbebr02', name: 'Brian Barber', role: 'RP', throws: 'R', age: 25, g: 8, gs: 8, outs: 126, h: 45, hr: 5, bb: 14, so: 23, hbp: 1, er: 29, w: 2, l: 4, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'haneych01', name: 'Chris Haney', role: 'SP', throws: 'L', age: 29, g: 38, gs: 12, outs: 307, h: 127, hr: 16, bb: 31, so: 56, hbp: 4, er: 69, w: 6, l: 6, sv: 0 },
      { id: 'bevilbr01', name: 'Brian Bevil', role: 'RP', throws: 'R', age: 26, g: 39, gs: 0, outs: 120, h: 45, hr: 4, bb: 22, so: 43, hbp: 3, er: 29, w: 3, l: 1, sv: 0, rk: true },
      { id: 'walkeja01', name: 'Jamie Walker', role: 'RP', throws: 'L', age: 26, g: 6, gs: 2, outs: 52, h: 24, hr: 4, bb: 6, so: 12, hbp: 2, er: 14, w: 0, l: 1, sv: 0, rk: true },
      { id: 'appieke01', name: 'Kevin Appier', role: 'RP', throws: 'R', age: 30, g: 3, gs: 3, outs: 45, h: 16, hr: 2, bb: 5, so: 14, hbp: 0, er: 7, w: 1, l: 2, sv: 0 },
    ],
  },
  // MIN (MIN 1998)
  {
    franchiseId: 'MIN',
    season: 1998,
    batters: [
      { id: 'steinte01', name: 'Terry Steinbach', pos: 'C', bats: 'R', age: 36, pa: 465, h: 106, double: 24, triple: 1, hr: 16, bb: 37, so: 94, hbp: 3, sb: 2, cs: 1, sec: '1B', fld: 74, arm: 73 },
      { id: 'ortizda01', name: 'David Ortiz', pos: '1B', bats: 'L', age: 22, pa: 326, h: 79, double: 20, triple: 0, hr: 9, bb: 37, so: 77, hbp: 5, sb: 1, cs: 0, sec: '3B', fld: 67, rk: true },
      { id: 'walketo04', name: 'Todd Walker', pos: '2B', bats: 'L', age: 25, pa: 581, h: 159, double: 38, triple: 3, hr: 11, bb: 45, so: 72, hbp: 2, sb: 20, cs: 6, sec: '3B', fld: 55 },
      { id: 'coomero01', name: 'Ron Coomer', pos: '3B', bats: 'R', age: 31, pa: 555, h: 151, double: 25, triple: 1, hr: 15, bb: 21, so: 78, hbp: 0, sb: 3, cs: 2, sec: '1B', fld: 64 },
      { id: 'mearepa01', name: 'Pat Meares', pos: 'SS', bats: 'R', age: 29, pa: 581, h: 143, double: 27, triple: 4, hr: 10, bb: 22, so: 93, hbp: 11, sb: 8, cs: 5, sec: '2B', fld: 74 },
      { id: 'cordoma01', name: 'Marty Cordova', pos: 'LF', bats: 'R', age: 28, pa: 499, h: 117, double: 24, triple: 3, hr: 13, bb: 44, so: 99, hbp: 5, sb: 5, cs: 5, sec: 'CF', fld: 88, arm: 65 },
      { id: 'nixonot01', name: 'Otis Nixon', pos: 'CF', bats: 'S', age: 39, pa: 500, h: 125, double: 10, triple: 4, hr: 1, bb: 49, so: 58, hbp: 1, sb: 42, cs: 9, sec: 'LF', fld: 81, arm: 64 },
      { id: 'lawtoma02', name: 'Matt Lawton', pos: 'RF', bats: 'L', age: 26, pa: 662, h: 149, double: 34, triple: 5, hr: 19, bb: 86, so: 75, hbp: 14, sb: 13, cs: 7, sec: 'CF', fld: 98, arm: 73 },
      { id: 'molitpa01', name: 'Paul Molitor', pos: 'DH', bats: 'R', age: 41, pa: 559, h: 152, double: 30, triple: 5, hr: 6, bb: 44, so: 53, hbp: 1, sb: 10, cs: 3, sec: '3B' },
    ],
    bench: [
      { id: 'gatesbr01', name: 'Brent Gates', pos: '3B', bats: 'S', age: 28, pa: 377, h: 83, double: 17, triple: 0, hr: 4, bb: 33, so: 46, hbp: 2, sb: 2, cs: 2, sec: '2B', fld: 64 },
      { id: 'ochoaal01', name: 'Alex Ochoa', pos: 'RF', bats: 'R', age: 26, pa: 260, h: 63, double: 14, triple: 2, hr: 3, bb: 13, so: 32, hbp: 1, sb: 5, cs: 3, sec: 'LF', fld: 63, arm: 87 },
      { id: 'merceor01', name: 'Orlando Merced', pos: '1B', bats: 'S', age: 31, pa: 247, h: 61, double: 13, triple: 1, hr: 6, bb: 24, so: 35, hbp: 1, sb: 3, cs: 3, sec: '3B', fld: 57 },
      { id: 'hockide01', name: 'Denny Hocking', pos: '2B', bats: 'S', age: 28, pa: 219, h: 45, double: 8, triple: 2, hr: 2, bb: 15, so: 42, hbp: 0, sb: 2, cs: 3, sec: 'SS', fld: 87 },
      { id: 'valenja01', name: 'Javier Valentin', pos: 'C', bats: 'S', age: 22, pa: 177, h: 32, double: 7, triple: 1, hr: 3, bb: 11, so: 31, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 59, arm: 59, rk: true },
    ],
    reserveBatters: [
      { id: 'lathach01', name: 'Chris Latham', pos: 'CF', bats: 'S', age: 25, pa: 108, h: 16, double: 1, triple: 0, hr: 1, bb: 11, so: 36, hbp: 0, sb: 4, cs: 2, sec: 'LF', fld: 68, arm: 63, rk: true },
      { id: 'shavejo01', name: 'Jon Shave', pos: '3B', bats: 'R', age: 30, pa: 43, h: 10, double: 3, triple: 0, hr: 1, bb: 3, so: 10, hbp: 0, sb: 1, cs: 2, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'radkebr01', name: 'Brad Radke', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 641, h: 228, hr: 26, bb: 45, so: 150, hbp: 6, er: 101, w: 12, l: 14, sv: 0, fld: 73 },
      { id: 'hawkila01', name: 'LaTroy Hawkins', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 571, h: 231, hr: 30, bb: 67, so: 106, hbp: 5, er: 114, w: 7, l: 14, sv: 0, fld: 78 },
      { id: 'miltoer01', name: 'Eric Milton', role: 'SP', throws: 'L', age: 22, g: 32, gs: 32, outs: 517, h: 195, hr: 25, bb: 70, so: 107, hbp: 2, er: 108, w: 8, l: 14, sv: 0, fld: 67, rk: true },
      { id: 'tewksbo01', name: 'Bob Tewksbury', role: 'SP', throws: 'R', age: 37, g: 26, gs: 25, outs: 445, h: 172, hr: 15, bb: 25, so: 73, hbp: 3, er: 74, w: 7, l: 13, sv: 0, fld: 81 },
      { id: 'morgami01', name: 'Mike Morgan', role: 'SP', throws: 'R', age: 38, g: 23, gs: 22, outs: 362, h: 134, hr: 16, bb: 39, so: 69, hbp: 6, er: 61, w: 4, l: 3, sv: 0 },
      { id: 'aguilri01', name: 'Rick Aguilera', role: 'CL', throws: 'R', age: 36, g: 68, gs: 0, outs: 223, h: 75, hr: 10, bb: 18, so: 61, hbp: 2, er: 36, w: 4, l: 9, sv: 38 },
      { id: 'trombmi01', name: 'Mike Trombley', role: 'RP', throws: 'R', age: 31, g: 77, gs: 1, outs: 290, h: 90, hr: 12, bb: 39, so: 88, hbp: 4, er: 41, w: 6, l: 5, sv: 1 },
      { id: 'swindgr01', name: 'Greg Swindell', role: 'RP', throws: 'L', age: 33, g: 81, gs: 0, outs: 271, h: 91, hr: 13, bb: 27, so: 62, hbp: 2, er: 40, w: 5, l: 6, sv: 2 },
      { id: 'serafda01', name: 'Dan Serafini', role: 'RP', throws: 'L', age: 24, g: 28, gs: 9, outs: 225, h: 93, hr: 9, bb: 30, so: 45, hbp: 1, er: 50, w: 7, l: 4, sv: 0, rk: true },
      { id: 'guarded01', name: 'Eddie Guardado', role: 'RP', throws: 'L', age: 27, g: 79, gs: 0, outs: 197, h: 64, hr: 10, bb: 28, so: 62, hbp: 1, er: 33, w: 3, l: 1, sv: 0 },
      { id: 'carrahe01', name: 'Hector Carrasco', role: 'RP', throws: 'R', age: 28, g: 63, gs: 0, outs: 185, h: 65, hr: 5, bb: 32, so: 52, hbp: 3, er: 30, w: 4, l: 2, sv: 1 },
    ],
    reservePitchers: [
      { id: 'rodrifr02', name: 'Frankie Rodriguez', role: 'SP', throws: 'R', age: 25, g: 20, gs: 11, outs: 210, h: 81, hr: 7, bb: 30, so: 44, hbp: 2, er: 43, w: 4, l: 6, sv: 0 },
      { id: 'baptitr01', name: 'Travis Baptist', role: 'RP', throws: 'L', age: 26, g: 13, gs: 0, outs: 81, h: 34, hr: 5, bb: 11, so: 11, hbp: 0, er: 17, w: 0, l: 1, sv: 0, rk: true },
      { id: 'ritchto01', name: 'Todd Ritchie', role: 'RP', throws: 'R', age: 26, g: 15, gs: 0, outs: 72, h: 29, hr: 3, bb: 9, so: 17, hbp: 0, er: 13, w: 0, l: 0, sv: 0 },
      { id: 'naultda01', name: 'Dan Naulty', role: 'RP', throws: 'R', age: 28, g: 19, gs: 0, outs: 71, h: 23, hr: 4, bb: 11, so: 19, hbp: 0, er: 13, w: 0, l: 2, sv: 0 },
      { id: 'milletr01', name: 'Travis Miller', role: 'RP', throws: 'L', age: 25, g: 14, gs: 0, outs: 70, h: 29, hr: 3, bb: 10, so: 16, hbp: 0, er: 16, w: 0, l: 2, sv: 0 },
    ],
  },
  // HOU (HOU 1998)
  {
    franchiseId: 'HOU',
    season: 1998,
    batters: [
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 29, pa: 472, h: 108, double: 16, triple: 2, hr: 5, bb: 46, so: 69, hbp: 3, sb: 10, cs: 5, sec: '1B', fld: 76, arm: 74 },
      { id: 'bagweje01', name: 'Jeff Bagwell', pos: '1B', bats: 'R', age: 30, pa: 661, h: 159, double: 36, triple: 1, hr: 35, bb: 114, so: 100, hbp: 10, sb: 22, cs: 8, sec: '3B', fld: 79 },
      { id: 'biggicr01', name: 'Craig Biggio', pos: '2B', bats: 'R', age: 32, pa: 738, h: 198, double: 42, triple: 4, hr: 20, bb: 73, so: 104, hbp: 27, sb: 45, cs: 9, sec: 'SS', fld: 70 },
      { id: 'spierbi01', name: 'Bill Spiers', pos: '3B', bats: 'L', age: 32, pa: 437, h: 107, double: 28, triple: 4, hr: 5, bb: 53, so: 59, hbp: 4, sb: 12, cs: 3, sec: 'SS', fld: 75 },
      { id: 'gutieri01', name: 'Ricky Gutierrez', pos: 'SS', bats: 'R', age: 28, pa: 561, h: 131, double: 23, triple: 4, hr: 3, bb: 49, so: 85, hbp: 6, sb: 12, cs: 6, sec: '3B', fld: 78 },
      { id: 'aloumo01', name: 'Moises Alou', pos: 'LF', bats: 'R', age: 31, pa: 679, h: 177, double: 33, triple: 5, hr: 32, bb: 77, so: 90, hbp: 4, sb: 11, cs: 4, sec: 'RF', fld: 54, arm: 71 },
      { id: 'evereca01', name: 'Carl Everett', pos: 'CF', bats: 'S', age: 27, pa: 519, h: 128, double: 31, triple: 4, hr: 14, bb: 41, so: 106, hbp: 5, sb: 15, cs: 10, sec: 'RF', fld: 75, arm: 79 },
      { id: 'bellde01', name: 'Derek Bell', pos: 'RF', bats: 'R', age: 29, pa: 695, h: 185, double: 40, triple: 3, hr: 20, bb: 49, so: 124, hbp: 8, sb: 18, cs: 5, sec: 'CF', fld: 61, arm: 65 },
      { id: 'berryse01', name: 'Sean Berry', pos: 'DH', bats: 'R', age: 32, pa: 342, h: 88, double: 22, triple: 1, hr: 11, bb: 26, so: 49, hbp: 6, sb: 4, cs: 3, sec: '3B', fld: 78 },
    ],
    bench: [
      { id: 'hidalri01', name: 'Richard Hidalgo', pos: 'CF', bats: 'R', age: 23, pa: 234, h: 64, double: 15, triple: 0, hr: 7, bb: 17, so: 41, hbp: 2, sb: 3, cs: 3, sec: 'RF', fld: 63, arm: 67, rk: true },
      { id: 'eusebto01', name: 'Tony Eusebio', pos: 'C', bats: 'R', age: 31, pa: 203, h: 47, double: 5, triple: 1, hr: 1, bb: 19, so: 29, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 71, arm: 75 },
      { id: 'bogarti01', name: 'Tim Bogar', pos: 'SS', bats: 'R', age: 31, pa: 169, h: 31, double: 6, triple: 2, hr: 2, bb: 12, so: 31, hbp: 2, sb: 2, cs: 1, sec: '3B', fld: 81 },
      { id: 'clarkda05', name: 'Dave Clark', pos: 'RF', bats: 'L', age: 35, pa: 146, h: 32, double: 7, triple: 0, hr: 3, bb: 16, so: 36, hbp: 1, sb: 1, cs: 1, sec: 'LF' },
      { id: 'philljr01', name: 'J. R. Phillips', pos: '1B', bats: 'L', age: 28, pa: 65, h: 10, double: 1, triple: 0, hr: 3, bb: 6, so: 25, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'howelja02', name: 'Jack Howell', pos: '1B', bats: 'L', age: 36, pa: 42, h: 10, double: 2, triple: 0, hr: 3, bb: 3, so: 9, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'limajo01', name: 'Jose Lima', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 700, h: 232, hr: 33, bb: 37, so: 172, hbp: 9, er: 105, w: 16, l: 8, sv: 0, fld: 74 },
      { id: 'reynosh01', name: 'Shane Reynolds', role: 'SP', throws: 'R', age: 30, g: 35, gs: 35, outs: 700, h: 249, hr: 24, bb: 54, so: 205, hbp: 4, er: 98, w: 19, l: 8, sv: 0, fld: 80 },
      { id: 'hamptmi01', name: 'Mike Hampton', role: 'SP', throws: 'L', age: 25, g: 32, gs: 32, outs: 635, h: 223, hr: 17, bb: 77, so: 137, hbp: 4, er: 85, w: 11, l: 7, sv: 0, fld: 79 },
      { id: 'bergmse01', name: 'Sean Bergman', role: 'SP', throws: 'R', age: 28, g: 31, gs: 27, outs: 516, h: 188, hr: 20, bb: 48, so: 109, hbp: 5, er: 82, w: 12, l: 9, sv: 0, fld: 66 },
      { id: 'schoupe01', name: 'Pete Schourek', role: 'SP', throws: 'L', age: 29, g: 25, gs: 23, outs: 372, h: 126, hr: 19, bb: 51, so: 93, hbp: 5, er: 67, w: 8, l: 9, sv: 0 },
      { id: 'wagnebi02', name: 'Billy Wagner', role: 'CL', throws: 'L', age: 26, g: 58, gs: 0, outs: 180, h: 43, hr: 6, bb: 27, so: 93, hbp: 1, er: 18, w: 4, l: 3, sv: 30 },
      { id: 'henrydo01', name: 'Doug Henry', role: 'RP', throws: 'R', age: 34, g: 59, gs: 0, outs: 213, h: 62, hr: 7, bb: 36, so: 59, hbp: 0, er: 29, w: 8, l: 2, sv: 2 },
      { id: 'nitkocj01', name: 'C. J. Nitkowski', role: 'RP', throws: 'L', age: 25, g: 43, gs: 0, outs: 179, h: 53, hr: 5, bb: 27, so: 43, hbp: 6, er: 29, w: 3, l: 3, sv: 3 },
      { id: 'elartsc01', name: 'Scott Elarton', role: 'RP', throws: 'R', age: 22, g: 28, gs: 2, outs: 171, h: 40, hr: 5, bb: 20, so: 56, hbp: 1, er: 21, w: 2, l: 1, sv: 2, rk: true },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 25, g: 37, gs: 1, outs: 160, h: 59, hr: 4, bb: 20, so: 29, hbp: 1, er: 21, w: 2, l: 0, sv: 1, rk: true },
      { id: 'magnami01', name: 'Mike Magnante', role: 'RP', throws: 'L', age: 33, g: 48, gs: 0, outs: 155, h: 54, hr: 3, bb: 22, so: 42, hbp: 3, er: 25, w: 4, l: 7, sv: 2 },
    ],
    reservePitchers: [
      { id: 'halamjo01', name: 'John Halama', role: 'RP', throws: 'L', age: 26, g: 6, gs: 6, outs: 97, h: 37, hr: 0, bb: 13, so: 21, hbp: 2, er: 21, w: 1, l: 1, sv: 0, rk: true },
      { id: 'scanlbo01', name: 'Bob Scanlan', role: 'RP', throws: 'R', age: 31, g: 27, gs: 0, outs: 79, h: 26, hr: 4, bb: 13, so: 8, hbp: 1, er: 11, w: 0, l: 1, sv: 0 },
    ],
  },
  // LAA (ANA 1998)
  {
    franchiseId: 'LAA',
    season: 1998,
    batters: [
      { id: 'walbema01', name: 'Matt Walbeck', pos: 'C', bats: 'S', age: 28, pa: 380, h: 88, double: 14, triple: 1, hr: 6, bb: 28, so: 63, hbp: 1, sb: 3, cs: 2, sec: '1B', fld: 70, arm: 67 },
      { id: 'erstada01', name: 'Darin Erstad', pos: '1B', bats: 'L', age: 24, pa: 590, h: 158, double: 35, triple: 3, hr: 17, bb: 46, so: 79, hbp: 5, sb: 20, cs: 7, sec: 'LF', fld: 73 },
      { id: 'velarra01', name: 'Randy Velarde', pos: '2B', bats: 'R', age: 35, pa: 224, h: 52, double: 12, triple: 1, hr: 5, bb: 30, so: 43, hbp: 1, sb: 5, cs: 2, sec: '3B', fld: 58 },
      { id: 'hollida01', name: 'Dave Hollins', pos: '3B', bats: 'S', age: 32, pa: 418, h: 96, double: 18, triple: 1, hr: 11, bb: 45, so: 76, hbp: 7, sb: 9, cs: 4, sec: '1B', fld: 59 },
      { id: 'disarga01', name: 'Gary Disarcina', pos: 'SS', bats: 'R', age: 30, pa: 595, h: 149, double: 34, triple: 3, hr: 4, bb: 20, so: 42, hbp: 6, sb: 8, cs: 6, sec: '2B', fld: 71 },
      { id: 'palmeor01', name: 'Orlando Palmeiro', pos: 'LF', bats: 'L', age: 29, pa: 192, h: 47, double: 6, triple: 2, hr: 0, bb: 20, so: 13, hbp: 1, sb: 4, cs: 3, sec: 'CF', fld: 91, arm: 54 },
      { id: 'edmonji01', name: 'Jim Edmonds', pos: 'CF', bats: 'L', age: 28, pa: 659, h: 178, double: 38, triple: 1, hr: 28, bb: 62, so: 110, hbp: 3, sb: 6, cs: 5, sec: 'LF', fld: 80, arm: 71 },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'RF', bats: 'L', age: 26, pa: 658, h: 184, double: 38, triple: 5, hr: 12, bb: 29, so: 77, hbp: 1, sb: 9, cs: 4, sec: 'LF', fld: 75, arm: 71 },
      { id: 'salmoti01', name: 'Tim Salmon', pos: 'DH', bats: 'R', age: 29, pa: 566, h: 139, double: 25, triple: 1, hr: 26, bb: 83, so: 106, hbp: 4, sb: 3, cs: 4, sec: 'RF' },
    ],
    bench: [
      { id: 'fieldce01', name: 'Cecil Fielder', pos: '1B', bats: 'R', age: 34, pa: 476, h: 101, double: 16, triple: 0, hr: 19, bb: 56, so: 104, hbp: 5, sb: 0, cs: 0, fld: 67 },
      { id: 'nevinph01', name: 'Phil Nevin', pos: 'C', bats: 'R', age: 27, pa: 261, h: 56, double: 11, triple: 1, hr: 9, bb: 19, so: 67, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 55, arm: 65 },
      { id: 'baughju01', name: 'Justin Baughman', pos: '2B', bats: 'R', age: 23, pa: 211, h: 50, double: 9, triple: 1, hr: 1, bb: 6, so: 36, hbp: 1, sb: 10, cs: 4, sec: 'SS', fld: 65, rk: true },
      { id: 'martino01', name: 'Norberto Martin', pos: '2B', bats: 'R', age: 31, pa: 206, h: 52, double: 5, triple: 0, hr: 1, bb: 6, so: 28, hbp: 0, sb: 4, cs: 2, sec: 'SS', fld: 77 },
      { id: 'glaustr01', name: 'Troy Glaus', pos: '3B', bats: 'R', age: 21, pa: 182, h: 36, double: 9, triple: 0, hr: 1, bb: 15, so: 51, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 61, rk: true },
    ],
    reserveBatters: [
      { id: 'shiplcr01', name: 'Craig Shipley', pos: '3B', bats: 'R', age: 35, pa: 162, h: 40, double: 8, triple: 1, hr: 3, bb: 6, so: 22, hbp: 3, sb: 2, cs: 3, sec: 'SS', fld: 45 },
      { id: 'mashoda01', name: 'Damon Mashore', pos: 'RF', bats: 'R', age: 28, pa: 111, h: 23, double: 4, triple: 0, hr: 1, bb: 14, so: 25, hbp: 2, sb: 2, cs: 1, sec: 'CF', fld: 73, arm: 61 },
      { id: 'pritcch01', name: 'Chris Pritchett', pos: '1B', bats: 'L', age: 28, pa: 84, h: 23, double: 2, triple: 1, hr: 2, bb: 4, so: 16, hbp: 0, sb: 2, cs: 0, sec: '3B', fld: 82, rk: true },
      { id: 'greento02', name: 'Todd Greene', pos: 'LF', bats: 'R', age: 27, pa: 73, h: 18, double: 3, triple: 0, hr: 3, bb: 3, so: 16, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
      { id: 'bolicfr01', name: 'Frank Bolick', pos: 'DH', bats: 'S', age: 32, pa: 56, h: 7, double: 2, triple: 0, hr: 1, bb: 11, so: 8, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'finlech01', name: 'Chuck Finley', role: 'SP', throws: 'L', age: 35, g: 34, gs: 34, outs: 670, h: 214, hr: 23, bb: 100, so: 211, hbp: 7, er: 94, w: 11, l: 9, sv: 0, fld: 62 },
      { id: 'olivaom01', name: 'Omar Olivares', role: 'SP', throws: 'R', age: 30, g: 37, gs: 26, outs: 549, h: 191, hr: 19, bb: 87, so: 107, hbp: 9, er: 91, w: 9, l: 9, sv: 0, fld: 84 },
      { id: 'sparkst01', name: 'Steve Sparks', role: 'SP', throws: 'R', age: 32, g: 22, gs: 20, outs: 386, h: 132, hr: 16, bb: 61, so: 78, hbp: 5, er: 67, w: 9, l: 4, sv: 0 },
      { id: 'dicksja01', name: 'Jason Dickson', role: 'SP', throws: 'R', age: 25, g: 27, gs: 18, outs: 366, h: 146, hr: 18, bb: 38, so: 66, hbp: 5, er: 70, w: 10, l: 10, sv: 0 },
      { id: 'hillke01', name: 'Ken Hill', role: 'SP', throws: 'R', age: 32, g: 19, gs: 19, outs: 309, h: 114, hr: 8, bb: 48, so: 62, hbp: 2, er: 52, w: 9, l: 6, sv: 0 },
      { id: 'percitr01', name: 'Troy Percival', role: 'CL', throws: 'R', age: 28, g: 67, gs: 0, outs: 200, h: 45, hr: 6, bb: 33, so: 90, hbp: 3, er: 25, w: 2, l: 7, sv: 42 },
      { id: 'hasegsh01', name: 'Shigetoshi Hasegawa', role: 'RP', throws: 'R', age: 29, g: 61, gs: 0, outs: 292, h: 90, hr: 13, bb: 34, so: 70, hbp: 2, er: 37, w: 8, l: 3, sv: 5 },
      { id: 'delucri01', name: 'Rich DeLucia', role: 'RP', throws: 'R', age: 33, g: 61, gs: 0, outs: 215, h: 59, hr: 9, bb: 44, so: 71, hbp: 3, er: 35, w: 2, l: 6, sv: 3 },
      { id: 'harripe01', name: 'Pep Harris', role: 'RP', throws: 'R', age: 25, g: 49, gs: 0, outs: 180, h: 56, hr: 6, bb: 25, so: 37, hbp: 1, er: 26, w: 3, l: 1, sv: 0 },
      { id: 'cadargr01', name: 'Greg Cadaret', role: 'RP', throws: 'L', age: 36, g: 50, gs: 0, outs: 134, h: 47, hr: 6, bb: 19, so: 41, hbp: 4, er: 20, w: 1, l: 2, sv: 1 },
      { id: 'holtzmi01', name: 'Mike Holtz', role: 'RP', throws: 'L', age: 25, g: 53, gs: 0, outs: 91, h: 33, hr: 2, bb: 15, so: 31, hbp: 2, er: 14, w: 2, l: 2, sv: 1 },
    ],
    reservePitchers: [
      { id: 'watsoal01', name: 'Allen Watson', role: 'SP', throws: 'L', age: 27, g: 28, gs: 14, outs: 277, h: 111, hr: 15, bb: 35, so: 67, hbp: 3, er: 55, w: 6, l: 7, sv: 0 },
      { id: 'mcdowja01', name: 'Jack McDowell', role: 'SP', throws: 'R', age: 32, g: 14, gs: 14, outs: 228, h: 90, hr: 10, bb: 24, so: 54, hbp: 1, er: 43, w: 5, l: 3, sv: 0 },
      { id: 'washbja01', name: 'Jarrod Washburn', role: 'SP', throws: 'L', age: 23, g: 15, gs: 11, outs: 222, h: 70, hr: 11, bb: 27, so: 48, hbp: 3, er: 38, w: 6, l: 3, sv: 0, rk: true },
      { id: 'jamesmi01', name: 'Mike James', role: 'RP', throws: 'R', age: 30, g: 11, gs: 0, outs: 42, h: 12, hr: 1, bb: 6, so: 11, hbp: 1, er: 5, w: 0, l: 0, sv: 0 },
    ],
  },
  // OAK (OAK 1998)
  {
    franchiseId: 'OAK',
    season: 1998,
    batters: [
      { id: 'hinchaj01', name: 'A. J. Hinch', pos: 'C', bats: 'R', age: 24, pa: 391, h: 78, double: 10, triple: 0, hr: 9, bb: 30, so: 89, hbp: 4, sb: 3, cs: 0, sec: '1B', fld: 68, arm: 72, rk: true },
      { id: 'giambja01', name: 'Jason Giambi', pos: '1B', bats: 'L', age: 27, pa: 657, h: 168, double: 36, triple: 1, hr: 25, bb: 71, so: 102, hbp: 6, sb: 1, cs: 2, sec: 'LF', fld: 60 },
      { id: 'spiezsc01', name: 'Scott Spiezio', pos: '2B', bats: 'S', age: 25, pa: 461, h: 104, double: 20, triple: 2, hr: 10, bb: 40, so: 57, hbp: 1, sb: 4, cs: 3, sec: 'SS', fld: 66 },
      { id: 'blowemi01', name: 'Mike Blowers', pos: '3B', bats: 'R', age: 33, pa: 455, h: 101, double: 22, triple: 2, hr: 11, bb: 43, so: 108, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 55 },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: 'SS', bats: 'R', age: 24, pa: 407, h: 84, double: 19, triple: 2, hr: 11, bb: 25, so: 86, hbp: 8, sb: 5, cs: 5, sec: '2B', fld: 75, rk: true },
      { id: 'henderi01', name: 'Rickey Henderson', pos: 'LF', bats: 'R', age: 39, pa: 670, h: 128, double: 17, triple: 1, hr: 12, bb: 124, so: 111, hbp: 7, sb: 60, cs: 13, sec: 'CF', fld: 89, arm: 59 },
      { id: 'chrisry01', name: 'Ryan Christenson', pos: 'CF', bats: 'R', age: 24, pa: 421, h: 95, double: 22, triple: 2, hr: 5, bb: 36, so: 106, hbp: 1, sb: 5, cs: 6, sec: 'LF', fld: 84, arm: 71, rk: true },
      { id: 'grievbe01', name: 'Ben Grieve', pos: 'RF', bats: 'L', age: 22, pa: 678, h: 169, double: 41, triple: 2, hr: 18, bb: 85, so: 126, hbp: 9, sb: 2, cs: 2, sec: 'LF', fld: 65, arm: 64, rk: true },
      { id: 'stairma01', name: 'Matt Stairs', pos: 'DH', bats: 'L', age: 30, pa: 593, h: 153, double: 31, triple: 1, hr: 31, bb: 64, so: 91, hbp: 5, sb: 7, cs: 3, sec: 'RF' },
    ],
    bench: [
      { id: 'roberbi01', name: 'Bip Roberts', pos: '2B', bats: 'S', age: 34, pa: 333, h: 86, double: 16, triple: 1, hr: 2, bb: 25, so: 41, hbp: 3, sb: 14, cs: 4, sec: '3B', fld: 53 },
      { id: 'macfami01', name: 'Mike Macfarlane', pos: 'C', bats: 'R', age: 34, pa: 238, h: 53, double: 12, triple: 1, hr: 8, bb: 16, so: 36, hbp: 4, sb: 1, cs: 1, fld: 69, arm: 68 },
      { id: 'bournra01', name: 'Rafael Bournigal', pos: '2B', bats: 'R', age: 32, pa: 229, h: 51, double: 10, triple: 0, hr: 1, bb: 12, so: 14, hbp: 2, sb: 4, cs: 1, sec: 'SS', fld: 69 },
      { id: 'abbotku01', name: 'Kurt Abbott', pos: 'SS', bats: 'R', age: 29, pa: 212, h: 52, double: 13, triple: 2, hr: 5, bb: 12, so: 55, hbp: 2, sb: 2, cs: 1, sec: '2B', fld: 48 },
      { id: 'mcdonja02', name: 'Jason McDonald', pos: 'CF', bats: 'S', age: 26, pa: 212, h: 46, double: 9, triple: 1, hr: 2, bb: 27, so: 35, hbp: 2, sb: 10, cs: 5, sec: 'LF', fld: 68, arm: 91 },
    ],
    reserveBatters: [
      { id: 'mitchke01', name: 'Kevin Mitchell', pos: 'DH', bats: 'R', age: 36, pa: 136, h: 29, double: 7, triple: 1, hr: 4, bb: 14, so: 22, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
      { id: 'magadda01', name: 'Dave Magadan', pos: '3B', bats: 'L', age: 35, pa: 123, h: 31, double: 5, triple: 0, hr: 1, bb: 17, so: 14, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 81 },
      { id: 'voigtja01', name: 'Jack Voigt', pos: '1B', bats: 'R', age: 32, pa: 79, h: 14, double: 4, triple: 1, hr: 3, bb: 7, so: 17, hbp: 0, sb: 2, cs: 1, sec: 'LF' },
      { id: 'chaveer01', name: 'Eric Chavez', pos: '3B', bats: 'L', age: 20, pa: 48, h: 14, double: 4, triple: 1, hr: 0, bb: 3, so: 5, hbp: 0, sb: 1, cs: 1, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'rogerke01', name: 'Kenny Rogers', role: 'SP', throws: 'L', age: 33, g: 34, gs: 34, outs: 716, h: 224, hr: 21, bb: 80, so: 129, hbp: 8, er: 103, w: 16, l: 8, sv: 0, fld: 93 },
      { id: 'candito01', name: 'Tom Candiotti', role: 'SP', throws: 'R', age: 41, g: 33, gs: 33, outs: 603, h: 216, hr: 30, bb: 62, so: 109, hbp: 10, er: 101, w: 11, l: 16, sv: 0, fld: 81 },
      { id: 'hayneji01', name: 'Jimmy Haynes', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 583, h: 226, hr: 24, bb: 95, so: 141, hbp: 5, er: 114, w: 11, l: 9, sv: 0, fld: 63 },
      { id: 'oquismi01', name: 'Mike Oquist', role: 'SP', throws: 'R', age: 30, g: 31, gs: 29, outs: 525, h: 202, hr: 26, bb: 61, so: 114, hbp: 6, er: 114, w: 7, l: 11, sv: 0, fld: 62 },
      { id: 'steinbl01', name: 'Blake Stein', role: 'SP', throws: 'R', age: 24, g: 24, gs: 20, outs: 352, h: 117, hr: 22, bb: 71, so: 89, hbp: 5, er: 83, w: 5, l: 9, sv: 0, rk: true },
      { id: 'taylobi04', name: 'Billy Taylor', role: 'CL', throws: 'R', age: 36, g: 70, gs: 0, outs: 219, h: 68, hr: 5, bb: 28, so: 63, hbp: 4, er: 30, w: 4, l: 9, sv: 33 },
      { id: 'mathetj01', name: 'T. J. Mathews', role: 'RP', throws: 'R', age: 28, g: 66, gs: 0, outs: 218, h: 69, hr: 7, bb: 29, so: 62, hbp: 3, er: 31, w: 7, l: 4, sv: 1 },
      { id: 'smallaa01', name: 'Aaron Small', role: 'RP', throws: 'R', age: 26, g: 47, gs: 0, outs: 203, h: 80, hr: 6, bb: 27, so: 37, hbp: 3, er: 39, w: 4, l: 2, sv: 0 },
      { id: 'mohlemi01', name: 'Mike Mohler', role: 'RP', throws: 'L', age: 29, g: 57, gs: 0, outs: 183, h: 68, hr: 6, bb: 30, so: 42, hbp: 4, er: 33, w: 3, l: 3, sv: 0 },
      { id: 'fettemi01', name: 'Mike Fetters', role: 'RP', throws: 'R', age: 33, g: 60, gs: 0, outs: 176, h: 59, hr: 4, bb: 26, so: 48, hbp: 1, er: 25, w: 2, l: 8, sv: 5 },
      { id: 'groombu01', name: 'Buddy Groom', role: 'RP', throws: 'L', age: 32, g: 75, gs: 0, outs: 172, h: 63, hr: 6, bb: 21, so: 38, hbp: 1, er: 28, w: 3, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'heredgi01', name: 'Gil Heredia', role: 'RP', throws: 'R', age: 32, g: 8, gs: 6, outs: 128, h: 45, hr: 5, bb: 5, so: 26, hbp: 2, er: 18, w: 3, l: 3, sv: 0 },
      { id: 'witasja01', name: 'Jay Witasick', role: 'RP', throws: 'R', age: 25, g: 7, gs: 3, outs: 81, h: 35, hr: 9, bb: 15, so: 27, hbp: 0, er: 19, w: 1, l: 3, sv: 0, rk: true },
      { id: 'telghda01', name: 'Dave Telgheder', role: 'RP', throws: 'R', age: 31, g: 8, gs: 2, outs: 60, h: 23, hr: 3, bb: 6, so: 9, hbp: 1, er: 11, w: 0, l: 1, sv: 0 },
      { id: 'doughji01', name: 'Jim Dougherty', role: 'RP', throws: 'R', age: 30, g: 9, gs: 0, outs: 36, h: 16, hr: 2, bb: 8, so: 4, hbp: 1, er: 11, w: 0, l: 2, sv: 0 },
    ],
  },
  // SEA (SEA 1998)
  {
    franchiseId: 'SEA',
    season: 1998,
    batters: [
      { id: 'wilsoda01', name: 'Dan Wilson', pos: 'C', bats: 'R', age: 29, pa: 368, h: 88, double: 18, triple: 1, hr: 10, bb: 24, so: 53, hbp: 4, sb: 3, cs: 1, sec: '1B', fld: 76, arm: 65 },
      { id: 'seguida01', name: 'David Segui', pos: '1B', bats: 'S', age: 31, pa: 580, h: 156, double: 32, triple: 2, hr: 20, bb: 57, so: 76, hbp: 0, sb: 3, cs: 1, sec: 'LF', fld: 84 },
      { id: 'corajo01', name: 'Joey Cora', pos: '2B', bats: 'S', age: 33, pa: 695, h: 175, double: 35, triple: 6, hr: 8, bb: 63, so: 54, hbp: 6, sb: 11, cs: 6, sec: 'SS', fld: 40 },
      { id: 'davisru01', name: 'Russ Davis', pos: '3B', bats: 'R', age: 28, pa: 550, h: 131, double: 31, triple: 1, hr: 21, bb: 35, so: 130, hbp: 3, sb: 5, cs: 3, sec: '1B', fld: 53 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: 'SS', bats: 'R', age: 22, pa: 748, h: 215, double: 43, triple: 4, hr: 37, bb: 49, so: 119, hbp: 8, sb: 38, cs: 10, sec: '2B', fld: 71 },
      { id: 'hillgl01', name: 'Glenallen Hill', pos: 'LF', bats: 'R', age: 33, pa: 422, h: 112, double: 26, triple: 2, hr: 17, bb: 26, so: 84, hbp: 4, sb: 4, cs: 2, sec: 'RF', fld: 69, arm: 68 },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'CF', bats: 'L', age: 28, pa: 720, h: 184, double: 33, triple: 3, hr: 56, bb: 78, so: 121, hbp: 8, sb: 18, cs: 4, sec: 'LF', fld: 83, arm: 72 },
      { id: 'buhneja01', name: 'Jay Buhner', pos: 'RF', bats: 'R', age: 33, pa: 286, h: 59, double: 9, triple: 1, hr: 17, bb: 44, so: 72, hbp: 2, sb: 0, cs: 0, sec: 'CF', fld: 69, arm: 72 },
      { id: 'martied01', name: 'Edgar Martinez', pos: 'DH', bats: 'R', age: 35, pa: 672, h: 177, double: 44, triple: 1, hr: 28, bb: 114, so: 91, hbp: 7, sb: 2, cs: 2, sec: '3B' },
    ],
    bench: [
      { id: 'duceyro01', name: 'Rob Ducey', pos: 'RF', bats: 'L', age: 33, pa: 250, h: 57, double: 20, triple: 2, hr: 6, bb: 19, so: 58, hbp: 6, sb: 4, cs: 4, sec: 'LF', fld: 72, arm: 70 },
      { id: 'monahsh01', name: 'Shane Monahan', pos: 'LF', bats: 'L', age: 23, pa: 223, h: 51, double: 8, triple: 1, hr: 4, bb: 8, so: 53, hbp: 0, sb: 1, cs: 2, sec: 'RF', fld: 79, arm: 66, rk: true },
      { id: 'marzajo01', name: 'John Marzano', pos: 'C', bats: 'R', age: 35, pa: 153, h: 34, double: 7, triple: 1, hr: 3, bb: 10, so: 23, hbp: 6, sb: 0, cs: 0, fld: 72, arm: 66 },
      { id: 'amarari01', name: 'Rich Amaral', pos: 'LF', bats: 'R', age: 36, pa: 149, h: 37, double: 5, triple: 0, hr: 1, bb: 13, so: 24, hbp: 2, sb: 10, cs: 3, sec: 'CF', fld: 77, arm: 70 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: '1B', bats: 'L', age: 26, pa: 103, h: 23, double: 6, triple: 1, hr: 2, bb: 4, so: 22, hbp: 0, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    reserveBatters: [
      { id: 'rossyri01', name: 'Rico Rossy', pos: '3B', bats: 'R', age: 34, pa: 89, h: 16, double: 6, triple: 0, hr: 1, bb: 6, so: 13, hbp: 0, sb: 0, cs: 0, sec: 'SS', fld: 83 },
      { id: 'radmary01', name: 'Ryan Radmanovich', pos: 'RF', bats: 'L', age: 26, pa: 75, h: 15, double: 4, triple: 0, hr: 2, bb: 4, so: 25, hbp: 0, sb: 1, cs: 1, sec: 'LF', fld: 65, arm: 80, rk: true },
      { id: 'wilkiri01', name: 'Rick Wilkins', pos: 'C', bats: 'L', age: 31, pa: 63, h: 12, double: 2, triple: 0, hr: 2, bb: 7, so: 17, hbp: 0, sb: 0, cs: 0, sec: '1B' },
      { id: 'gipsoch01', name: 'Charles Gipson', pos: 'LF', bats: 'R', age: 25, pa: 57, h: 12, double: 1, triple: 0, hr: 0, bb: 5, so: 9, hbp: 1, sb: 2, cs: 1, sec: 'RF', rk: true },
      { id: 'husonje01', name: 'Jeff Huson', pos: '2B', bats: 'L', age: 33, pa: 54, h: 10, double: 1, triple: 0, hr: 0, bb: 3, so: 6, hbp: 0, sb: 1, cs: 0, sec: 'SS' },
    ],
    pitchers: [
      { id: 'johnsra05', name: 'Randy Johnson', role: 'SP', throws: 'L', age: 34, g: 34, gs: 34, outs: 733, h: 193, hr: 24, bb: 89, so: 335, hbp: 13, er: 81, w: 19, l: 11, sv: 0, fld: 53 },
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 35, g: 34, gs: 34, outs: 703, h: 235, hr: 25, bb: 48, so: 146, hbp: 9, er: 95, w: 15, l: 9, sv: 0, fld: 71 },
      { id: 'fasseje01', name: 'Jeff Fassero', role: 'SP', throws: 'L', age: 35, g: 32, gs: 32, outs: 674, h: 220, hr: 26, bb: 69, so: 185, hbp: 6, er: 94, w: 13, l: 12, sv: 0, fld: 67 },
      { id: 'cloudke01', name: 'Ken Cloude', role: 'SP', throws: 'R', age: 23, g: 30, gs: 30, outs: 466, h: 178, hr: 29, bb: 81, so: 120, hbp: 4, er: 108, w: 8, l: 10, sv: 0, fld: 62 },
      { id: 'swiftbi02', name: 'Bill Swift', role: 'SP', throws: 'R', age: 36, g: 29, gs: 26, outs: 434, h: 184, hr: 21, bb: 52, so: 73, hbp: 8, er: 95, w: 11, l: 9, sv: 0, fld: 82 },
      { id: 'timlimi01', name: 'Mike Timlin', role: 'CL', throws: 'R', age: 32, g: 70, gs: 0, outs: 238, h: 76, hr: 6, bb: 19, so: 58, hbp: 2, er: 28, w: 3, l: 3, sv: 19 },
      { id: 'spoljpa01', name: 'Paul Spoljaric', role: 'RP', throws: 'L', age: 27, g: 53, gs: 6, outs: 250, h: 81, hr: 11, bb: 51, so: 89, hbp: 2, er: 50, w: 4, l: 6, sv: 0 },
      { id: 'ayalabo01', name: 'Bobby Ayala', role: 'RP', throws: 'R', age: 28, g: 62, gs: 0, outs: 226, h: 88, hr: 10, bb: 30, so: 72, hbp: 2, er: 50, w: 1, l: 10, sv: 8 },
      { id: 'slocuhe01', name: 'Heathcliff Slocumb', role: 'RP', throws: 'R', age: 32, g: 57, gs: 0, outs: 203, h: 70, hr: 5, bb: 44, so: 57, hbp: 2, er: 36, w: 2, l: 5, sv: 3 },
      { id: 'wellsbo01', name: 'Bob Wells', role: 'RP', throws: 'R', age: 31, g: 30, gs: 0, outs: 155, h: 58, hr: 10, bb: 16, so: 34, hbp: 2, er: 32, w: 2, l: 2, sv: 0 },
      { id: 'suzukma01', name: 'Mac Suzuki', role: 'RP', throws: 'R', age: 23, g: 6, gs: 5, outs: 79, h: 34, hr: 3, bb: 15, so: 19, hbp: 0, er: 22, w: 1, l: 2, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'abbotpa01', name: 'Paul Abbott', role: 'RP', throws: 'R', age: 30, g: 4, gs: 4, outs: 74, h: 24, hr: 2, bb: 10, so: 22, hbp: 0, er: 11, w: 3, l: 1, sv: 0 },
      { id: 'mccargr01', name: 'Greg McCarthy', role: 'RP', throws: 'L', age: 29, g: 29, gs: 0, outs: 70, h: 19, hr: 4, bb: 15, so: 26, hbp: 3, er: 13, w: 1, l: 2, sv: 0, rk: true },
      { id: 'fossato01', name: 'Tony Fossas', role: 'RP', throws: 'L', age: 40, g: 41, gs: 0, outs: 68, h: 28, hr: 3, bb: 13, so: 21, hbp: 0, er: 11, w: 1, l: 3, sv: 0 },
      { id: 'paniajo01', name: 'Jose Paniagua', role: 'RP', throws: 'R', age: 24, g: 18, gs: 0, outs: 66, h: 20, hr: 3, bb: 9, so: 11, hbp: 3, er: 10, w: 2, l: 0, sv: 1 },
      { id: 'lirafe01', name: 'Felipe Lira', role: 'RP', throws: 'R', age: 26, g: 7, gs: 0, outs: 47, h: 19, hr: 3, bb: 7, so: 11, hbp: 1, er: 10, w: 1, l: 0, sv: 0 },
    ],
  },
  // TEX (TEX 1998)
  {
    franchiseId: 'TEX',
    season: 1998,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 26, pa: 617, h: 181, double: 38, triple: 4, hr: 20, bb: 34, so: 80, hbp: 5, sb: 7, cs: 1, sec: '1B', fld: 73, arm: 95 },
      { id: 'clarkwi02', name: 'Will Clark', pos: '1B', bats: 'L', age: 34, pa: 636, h: 170, double: 39, triple: 1, hr: 20, bb: 72, so: 92, hbp: 4, sb: 1, cs: 0, fld: 61 },
      { id: 'mclemma01', name: 'Mark McLemore', pos: '2B', bats: 'S', age: 33, pa: 567, h: 123, double: 19, triple: 2, hr: 4, bb: 79, so: 67, hbp: 2, sb: 14, cs: 6, sec: 'SS', fld: 68 },
      { id: 'tatisfe01', name: 'Fernando Tatis', pos: '3B', bats: 'R', age: 23, pa: 579, h: 145, double: 31, triple: 3, hr: 13, bb: 35, so: 118, hbp: 5, sb: 12, cs: 4, sec: '1B', fld: 78 },
      { id: 'elsteke01', name: 'Kevin Elster', pos: 'SS', bats: 'R', age: 33, pa: 336, h: 69, double: 13, triple: 2, hr: 11, bb: 34, so: 72, hbp: 2, sb: 1, cs: 2, sec: '2B', fld: 67 },
      { id: 'greerru01', name: 'Rusty Greer', pos: 'LF', bats: 'L', age: 29, pa: 691, h: 189, double: 37, triple: 5, hr: 20, bb: 79, so: 92, hbp: 4, sb: 6, cs: 4, sec: 'RF', fld: 77, arm: 63 },
      { id: 'goodwto01', name: 'Tom Goodwin', pos: 'CF', bats: 'L', age: 29, pa: 608, h: 148, double: 17, triple: 4, hr: 2, bb: 57, so: 87, hbp: 2, sb: 46, cs: 19, sec: 'LF', fld: 90, arm: 64 },
      { id: 'gonzaju03', name: 'Juan Gonzalez', pos: 'RF', bats: 'R', age: 28, pa: 669, h: 190, double: 41, triple: 2, hr: 47, bb: 44, so: 120, hbp: 5, sb: 1, cs: 1, sec: 'LF', fld: 65, arm: 70 },
      { id: 'stevele01', name: 'Lee Stevens', pos: 'DH', bats: 'L', age: 30, pa: 376, h: 97, double: 18, triple: 3, hr: 19, bb: 26, so: 83, hbp: 1, sb: 0, cs: 2, sec: '1B' },
    ],
    bench: [
      { id: 'alicelu01', name: 'Luis Alicea', pos: '2B', bats: 'S', age: 32, pa: 308, h: 68, double: 14, triple: 3, hr: 4, bb: 40, so: 44, hbp: 5, sb: 9, cs: 4, sec: '3B', fld: 70 },
      { id: 'kellyro01', name: 'Roberto Kelly', pos: 'CF', bats: 'R', age: 33, pa: 270, h: 78, double: 12, triple: 2, hr: 11, bb: 13, so: 45, hbp: 3, sb: 4, cs: 2, sec: 'LF', fld: 81, arm: 76 },
      { id: 'simmsmi01', name: 'Mike Simms', pos: 'RF', bats: 'R', age: 31, pa: 215, h: 52, double: 11, triple: 0, hr: 13, bb: 21, so: 47, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 62, arm: 61 },
      { id: 'cedendo01', name: 'Domingo Cedeno', pos: 'SS', bats: 'S', age: 29, pa: 153, h: 39, double: 7, triple: 2, hr: 2, bb: 10, so: 30, hbp: 1, sb: 2, cs: 1, sec: '2B', fld: 53 },
      { id: 'haselbi01', name: 'Bill Haselman', pos: 'C', bats: 'R', age: 32, pa: 110, h: 28, double: 6, triple: 0, hr: 4, bb: 6, so: 20, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 80, arm: 54 },
    ],
    pitchers: [
      { id: 'helliri01', name: 'Rick Helling', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 649, h: 198, hr: 28, bb: 87, so: 165, hbp: 3, er: 106, w: 20, l: 7, sv: 0, fld: 54 },
      { id: 'seleaa01', name: 'Aaron Sele', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 638, h: 239, hr: 19, bb: 88, so: 162, hbp: 14, er: 111, w: 19, l: 11, sv: 0, fld: 65 },
      { id: 'burkejo03', name: 'John Burkett', role: 'SP', throws: 'R', age: 33, g: 32, gs: 32, outs: 585, h: 232, hr: 19, bb: 42, so: 137, hbp: 6, er: 110, w: 9, l: 13, sv: 0, fld: 63 },
      { id: 'oliveda02', name: 'Darren Oliver', role: 'SP', throws: 'L', age: 27, g: 29, gs: 29, outs: 481, h: 191, hr: 21, bb: 68, so: 90, hbp: 10, er: 91, w: 10, l: 11, sv: 0, fld: 70 },
      { id: 'wittbo01', name: 'Bobby Witt', role: 'SP', throws: 'R', age: 34, g: 31, gs: 18, outs: 350, h: 145, hr: 19, bb: 50, so: 71, hbp: 1, er: 74, w: 7, l: 9, sv: 0 },
      { id: 'wettejo01', name: 'John Wetteland', role: 'CL', throws: 'R', age: 31, g: 63, gs: 0, outs: 186, h: 46, hr: 6, bb: 17, so: 67, hbp: 0, er: 15, w: 3, l: 1, sv: 42 },
      { id: 'crabtti01', name: 'Tim Crabtree', role: 'RP', throws: 'R', age: 28, g: 64, gs: 0, outs: 256, h: 92, hr: 6, bb: 33, so: 60, hbp: 3, er: 38, w: 6, l: 1, sv: 0 },
      { id: 'gundeer01', name: 'Eric Gunderson', role: 'RP', throws: 'L', age: 32, g: 68, gs: 1, outs: 203, h: 81, hr: 12, bb: 21, so: 42, hbp: 2, er: 37, w: 0, l: 3, sv: 0 },
      { id: 'patteda04', name: 'Danny Patterson', role: 'RP', throws: 'R', age: 27, g: 56, gs: 0, outs: 182, h: 63, hr: 7, bb: 19, so: 45, hbp: 1, er: 26, w: 2, l: 5, sv: 2 },
      { id: 'hernaxa01', name: 'Xavier Hernandez', role: 'RP', throws: 'R', age: 32, g: 46, gs: 0, outs: 174, h: 50, hr: 7, bb: 26, so: 45, hbp: 1, er: 26, w: 6, l: 6, sv: 1 },
      { id: 'levinal01', name: 'Al Levine', role: 'RP', throws: 'R', age: 30, g: 30, gs: 0, outs: 174, h: 68, hr: 6, bb: 20, so: 26, hbp: 1, er: 32, w: 0, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'bailesc01', name: 'Scott Bailes', role: 'RP', throws: 'L', age: 36, g: 46, gs: 0, outs: 121, h: 55, hr: 5, bb: 13, so: 30, hbp: 0, er: 25, w: 1, l: 0, sv: 0 },
      { id: 'pavliro01', name: 'Roger Pavlik', role: 'RP', throws: 'R', age: 30, g: 5, gs: 0, outs: 42, h: 15, hr: 2, bb: 6, so: 9, hbp: 0, er: 7, w: 1, l: 1, sv: 1 },
    ],
  },
  // ATL (ATL 1998)
  {
    franchiseId: 'ATL',
    season: 1998,
    batters: [
      { id: 'lopezja01', name: 'Javy Lopez', pos: 'C', bats: 'R', age: 27, pa: 534, h: 140, double: 24, triple: 1, hr: 30, bb: 35, so: 88, hbp: 5, sb: 3, cs: 3, sec: '1B', fld: 73, arm: 72 },
      { id: 'galaran01', name: 'Andres Galarraga', pos: '1B', bats: 'R', age: 37, pa: 648, h: 176, double: 30, triple: 2, hr: 42, bb: 55, so: 143, hbp: 20, sb: 11, cs: 7, fld: 64 },
      { id: 'lockhke01', name: 'Keith Lockhart', pos: '2B', bats: 'L', age: 33, pa: 401, h: 96, double: 21, triple: 2, hr: 9, bb: 29, so: 37, hbp: 1, sb: 3, cs: 2, sec: '3B', fld: 65 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: '3B', bats: 'S', age: 26, pa: 707, h: 187, double: 34, triple: 4, hr: 29, bb: 89, so: 92, hbp: 1, sb: 17, cs: 5, sec: 'SS', fld: 68 },
      { id: 'weisswa01', name: 'Walt Weiss', pos: 'SS', bats: 'S', age: 34, pa: 424, h: 97, double: 18, triple: 3, hr: 2, bb: 58, so: 52, hbp: 3, sb: 6, cs: 1, fld: 56 },
      { id: 'kleskry01', name: 'Ryan Klesko', pos: 'LF', bats: 'L', age: 27, pa: 490, h: 117, double: 24, triple: 3, hr: 21, bb: 52, so: 92, hbp: 3, sb: 5, cs: 3, sec: '1B', fld: 53, arm: 75 },
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'CF', bats: 'R', age: 21, pa: 631, h: 146, double: 30, triple: 6, hr: 29, bb: 51, so: 135, hbp: 4, sb: 27, cs: 7, sec: 'RF', fld: 87, arm: 86 },
      { id: 'tuckemi01', name: 'Michael Tucker', pos: 'RF', bats: 'L', age: 27, pa: 469, h: 109, double: 24, triple: 4, hr: 13, bb: 44, so: 103, hbp: 5, sb: 9, cs: 4, sec: 'LF', fld: 65, arm: 64 },
      { id: 'perezed02', name: 'Eddie Perez', pos: 'DH', bats: 'R', age: 30, pa: 167, h: 42, double: 9, triple: 0, hr: 5, bb: 11, so: 27, hbp: 2, sb: 0, cs: 1, sec: 'C', fld: 78, arm: 66 },
    ],
    bench: [
      { id: 'graffto01', name: 'Tony Graffanino', pos: '2B', bats: 'R', age: 26, pa: 317, h: 63, double: 13, triple: 1, hr: 7, bb: 28, so: 68, hbp: 2, sb: 3, cs: 4, sec: 'SS', fld: 73 },
      { id: 'guilloz01', name: 'Ozzie Guillen', pos: 'SS', bats: 'L', age: 34, pa: 313, h: 74, double: 14, triple: 3, hr: 2, bb: 16, so: 19, hbp: 0, sb: 2, cs: 3, fld: 57 },
      { id: 'willige02', name: 'Gerald Williams', pos: 'RF', bats: 'R', age: 31, pa: 289, h: 73, double: 17, triple: 2, hr: 7, bb: 13, so: 45, hbp: 3, sb: 11, cs: 5, sec: 'LF', fld: 77, arm: 59 },
      { id: 'bautida01', name: 'Danny Bautista', pos: 'LF', bats: 'R', age: 26, pa: 156, h: 35, double: 8, triple: 1, hr: 3, bb: 8, so: 26, hbp: 1, sb: 2, cs: 0, sec: 'RF', fld: 41, arm: 54 },
      { id: 'pridecu01', name: 'Curtis Pride', pos: 'RF', bats: 'L', age: 29, pa: 121, h: 27, double: 5, triple: 2, hr: 3, bb: 12, so: 28, hbp: 1, sb: 4, cs: 2, sec: 'LF', fld: 93, arm: 50 },
    ],
    pitchers: [
      { id: 'maddugr01', name: 'Greg Maddux', role: 'SP', throws: 'R', age: 32, g: 34, gs: 34, outs: 753, h: 211, hr: 12, bb: 35, so: 195, hbp: 6, er: 64, w: 18, l: 9, sv: 0, fld: 92 },
      { id: 'glavito02', name: 'Tom Glavine', role: 'SP', throws: 'L', age: 32, g: 33, gs: 33, outs: 688, h: 200, hr: 15, bb: 76, so: 156, hbp: 2, er: 69, w: 20, l: 6, sv: 0, fld: 80 },
      { id: 'neaglde01', name: 'Denny Neagle', role: 'SP', throws: 'L', age: 29, g: 32, gs: 31, outs: 631, h: 197, hr: 22, bb: 53, so: 159, hbp: 5, er: 79, w: 16, l: 11, sv: 0, fld: 60 },
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 23, g: 31, gs: 29, outs: 523, h: 176, hr: 15, bb: 58, so: 159, hbp: 4, er: 78, w: 17, l: 8, sv: 0, fld: 61 },
      { id: 'smoltjo01', name: 'John Smoltz', role: 'SP', throws: 'R', age: 31, g: 26, gs: 26, outs: 503, h: 146, hr: 12, bb: 42, so: 170, hbp: 2, er: 55, w: 17, l: 3, sv: 0, fld: 71 },
      { id: 'ligteke01', name: 'Kerry Ligtenberg', role: 'CL', throws: 'R', age: 27, g: 75, gs: 0, outs: 219, h: 52, hr: 8, bb: 23, so: 81, hbp: 0, er: 22, w: 3, l: 2, sv: 30, rk: true },
      { id: 'martide01', name: 'Dennis Martinez', role: 'RP', throws: 'R', age: 44, g: 53, gs: 5, outs: 273, h: 106, hr: 10, bb: 28, so: 49, hbp: 5, er: 50, w: 4, l: 6, sv: 2 },
      { id: 'cathemi01', name: 'Mike Cather', role: 'RP', throws: 'R', age: 27, g: 36, gs: 0, outs: 124, h: 34, hr: 5, bb: 16, so: 33, hbp: 2, er: 16, w: 2, l: 2, sv: 0, rk: true },
      { id: 'rockejo01', name: 'John Rocker', role: 'RP', throws: 'L', age: 23, g: 47, gs: 0, outs: 114, h: 22, hr: 4, bb: 22, so: 42, hbp: 3, er: 9, w: 1, l: 3, sv: 2, rk: true },
      { id: 'seaneru01', name: 'Rudy Seanez', role: 'RP', throws: 'R', age: 29, g: 34, gs: 0, outs: 108, h: 25, hr: 2, bb: 16, so: 50, hbp: 1, er: 11, w: 4, l: 1, sv: 2 },
      { id: 'chenbr01', name: 'Bruce Chen', role: 'RP', throws: 'L', age: 21, g: 4, gs: 4, outs: 61, h: 23, hr: 3, bb: 9, so: 17, hbp: 1, er: 9, w: 2, l: 0, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'wohlema01', name: 'Mark Wohlers', role: 'RP', throws: 'R', age: 28, g: 27, gs: 0, outs: 61, h: 21, hr: 2, bb: 17, so: 31, hbp: 0, er: 13, w: 0, l: 1, sv: 8 },
      { id: 'perezod01', name: 'Odalis Perez', role: 'RP', throws: 'L', age: 20, g: 10, gs: 0, outs: 32, h: 10, hr: 1, bb: 4, so: 5, hbp: 0, er: 5, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // MIA (FLO 1998)
  {
    franchiseId: 'MIA',
    season: 1998,
    batters: [
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 27, pa: 338, h: 64, double: 14, triple: 2, hr: 5, bb: 38, so: 47, hbp: 2, sb: 4, cs: 1, sec: '1B', fld: 63, arm: 71 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 22, pa: 513, h: 107, double: 29, triple: 1, hr: 16, bb: 49, so: 126, hbp: 9, sb: 5, cs: 2, sec: '3B', fld: 80, rk: true },
      { id: 'counscr01', name: 'Craig Counsell', pos: '2B', bats: 'L', age: 27, pa: 399, h: 89, double: 19, triple: 5, hr: 4, bb: 48, so: 44, hbp: 5, sb: 3, cs: 1, sec: 'SS', fld: 89 },
      { id: 'zeileto01', name: 'Todd Zeile', pos: '3B', bats: 'R', age: 32, pa: 653, h: 152, double: 26, triple: 1, hr: 23, bb: 75, so: 97, hbp: 4, sb: 5, cs: 4, sec: '1B', fld: 59 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 21, pa: 580, h: 147, double: 18, triple: 2, hr: 4, bb: 43, so: 84, hbp: 4, sb: 33, cs: 16, sec: '2B', fld: 68 },
      { id: 'floydcl01', name: 'Cliff Floyd', pos: 'LF', bats: 'L', age: 25, pa: 641, h: 157, double: 43, triple: 4, hr: 21, bb: 56, so: 116, hbp: 5, sb: 25, cs: 12, sec: '1B', fld: 63, arm: 70 },
      { id: 'dunwoto01', name: 'Todd Dunwoody', pos: 'CF', bats: 'L', age: 23, pa: 462, h: 109, double: 26, triple: 8, hr: 6, bb: 24, so: 117, hbp: 4, sb: 6, cs: 1, sec: 'LF', fld: 88, arm: 77, rk: true },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: 'RF', bats: 'L', age: 22, pa: 623, h: 158, double: 24, triple: 7, hr: 10, bb: 35, so: 62, hbp: 1, sb: 11, cs: 5, sec: 'CF', fld: 92, arm: 91, rk: true },
      { id: 'jacksry01', name: 'Ryan Jackson', pos: 'DH', bats: 'L', age: 26, pa: 284, h: 65, double: 15, triple: 1, hr: 5, bb: 20, so: 73, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 51, rk: true },
    ],
    bench: [
      { id: 'bergda01', name: 'Dave Berg', pos: '2B', bats: 'R', age: 27, pa: 215, h: 57, double: 11, triple: 0, hr: 2, bb: 26, so: 46, hbp: 0, sb: 3, cs: 0, sec: '3B', fld: 88, rk: true },
      { id: 'cangejo01', name: 'John Cangelosi', pos: 'CF', bats: 'S', age: 35, pa: 208, h: 44, double: 8, triple: 1, hr: 1, bb: 26, so: 27, hbp: 2, sb: 5, cs: 3, sec: 'LF', fld: 55, arm: 63 },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 22, pa: 177, h: 36, double: 4, triple: 1, hr: 1, bb: 18, so: 34, hbp: 0, sb: 8, cs: 3, sec: 'SS', fld: 83 },
      { id: 'redmomi01', name: 'Mike Redmond', pos: 'C', bats: 'R', age: 27, pa: 129, h: 39, double: 9, triple: 0, hr: 2, bb: 5, so: 16, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 82, rk: true },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 21, pa: 98, h: 13, double: 2, triple: 0, hr: 3, bb: 9, so: 30, hbp: 1, sb: 0, cs: 0, sec: '2B', fld: 51, rk: true },
    ],
    reserveBatters: [
      { id: 'wehnejo01', name: 'John Wehner', pos: 'LF', bats: 'R', age: 31, pa: 96, h: 22, double: 4, triple: 0, hr: 0, bb: 6, so: 13, hbp: 0, sb: 1, cs: 1, sec: 'RF' },
      { id: 'wilsopr01', name: 'Preston Wilson', pos: 'CF', bats: 'R', age: 23, pa: 60, h: 8, double: 2, triple: 0, hr: 1, bb: 6, so: 21, hbp: 1, sb: 1, cs: 1, sec: 'LF', rk: true },
      { id: 'knorrra01', name: 'Randy Knorr', pos: 'C', bats: 'R', age: 29, pa: 51, h: 10, double: 3, triple: 1, hr: 2, bb: 2, so: 10, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 23, g: 33, gs: 33, outs: 703, h: 254, hr: 32, bb: 103, so: 167, hbp: 6, er: 116, w: 10, l: 12, sv: 0, fld: 74 },
      { id: 'meadobr01', name: 'Brian Meadows', role: 'SP', throws: 'R', age: 22, g: 31, gs: 31, outs: 523, h: 222, hr: 20, bb: 46, so: 88, hbp: 3, er: 101, w: 11, l: 13, sv: 0, fld: 74, rk: true },
      { id: 'sanchje01', name: 'Jesus Sanchez', role: 'SP', throws: 'L', age: 23, g: 35, gs: 29, outs: 519, h: 178, hr: 18, bb: 91, so: 137, hbp: 4, er: 86, w: 7, l: 9, sv: 0, fld: 73, rk: true },
      { id: 'ojalaki01', name: 'Kirt Ojala', role: 'SP', throws: 'L', age: 29, g: 41, gs: 13, outs: 375, h: 127, hr: 14, bb: 61, so: 76, hbp: 3, er: 57, w: 2, l: 7, sv: 0, rk: true },
      { id: 'larkian01', name: 'Andy Larkin', role: 'SP', throws: 'R', age: 24, g: 17, gs: 14, outs: 224, h: 100, hr: 12, bb: 55, so: 43, hbp: 4, er: 79, w: 3, l: 8, sv: 0, rk: true },
      { id: 'mantema01', name: 'Matt Mantei', role: 'CL', throws: 'R', age: 24, g: 42, gs: 0, outs: 164, h: 37, hr: 1, bb: 27, so: 63, hbp: 6, er: 20, w: 3, l: 4, sv: 9, rk: true },
      { id: 'edmonbr01', name: 'Brian Edmondson', role: 'RP', throws: 'R', age: 25, g: 53, gs: 0, outs: 228, h: 76, hr: 10, bb: 37, so: 40, hbp: 3, er: 33, w: 4, l: 4, sv: 0, rk: true },
      { id: 'darenvi01', name: 'Vic Darensbourg', role: 'RP', throws: 'L', age: 27, g: 59, gs: 0, outs: 213, h: 52, hr: 5, bb: 30, so: 74, hbp: 0, er: 29, w: 0, l: 7, sv: 1, rk: true },
      { id: 'alfonan01', name: 'Antonio Alfonseca', role: 'RP', throws: 'R', age: 26, g: 58, gs: 0, outs: 212, h: 79, hr: 10, bb: 32, so: 47, hbp: 3, er: 33, w: 4, l: 6, sv: 8, rk: true },
      { id: 'powelja04', name: 'Jay Powell', role: 'RP', throws: 'R', age: 26, g: 62, gs: 0, outs: 211, h: 62, hr: 5, bb: 33, so: 59, hbp: 3, er: 27, w: 7, l: 7, sv: 7 },
      { id: 'heredfe01', name: 'Felix Heredia', role: 'RP', throws: 'L', age: 23, g: 71, gs: 2, outs: 176, h: 57, hr: 3, bb: 35, so: 54, hbp: 3, er: 31, w: 3, l: 3, sv: 2 },
    ],
    reservePitchers: [
      { id: 'medinra01', name: 'Rafael Medina', role: 'SP', throws: 'R', age: 23, g: 12, gs: 12, outs: 202, h: 76, hr: 8, bb: 52, so: 49, hbp: 3, er: 45, w: 2, l: 6, sv: 0, rk: true },
      { id: 'dempsry01', name: 'Ryan Dempster', role: 'SP', throws: 'R', age: 21, g: 14, gs: 11, outs: 164, h: 72, hr: 6, bb: 38, so: 35, hbp: 9, er: 43, w: 1, l: 5, sv: 0, rk: true },
      { id: 'staniro01', name: 'Rob Stanifer', role: 'RP', throws: 'R', age: 26, g: 38, gs: 0, outs: 144, h: 52, hr: 7, bb: 20, so: 30, hbp: 1, er: 28, w: 2, l: 4, sv: 1, rk: true },
      { id: 'fontejo01', name: 'Joe Fontenot', role: 'RP', throws: 'R', age: 21, g: 8, gs: 8, outs: 128, h: 56, hr: 5, bb: 20, so: 24, hbp: 5, er: 30, w: 0, l: 7, sv: 0, rk: true },
      { id: 'palldo01', name: 'Donn Pall', role: 'RP', throws: 'R', age: 36, g: 23, gs: 0, outs: 100, h: 40, hr: 5, bb: 9, so: 24, hbp: 1, er: 19, w: 0, l: 1, sv: 0 },
    ],
  },
  // NYM (NYN 1998)
  {
    franchiseId: 'NYM',
    season: 1998,
    batters: [
      { id: 'piazzmi01', name: 'Mike Piazza', pos: 'C', bats: 'R', age: 29, pa: 626, h: 189, double: 32, triple: 1, hr: 35, bb: 65, so: 81, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 74, arm: 63 },
      { id: 'olerujo01', name: 'John Olerud', pos: '1B', bats: 'L', age: 29, pa: 665, h: 180, double: 36, triple: 3, hr: 23, bb: 93, so: 70, hbp: 9, sb: 1, cs: 1, sec: '3B', fld: 76 },
      { id: 'baergca01', name: 'Carlos Baerga', pos: '2B', bats: 'S', age: 29, pa: 551, h: 138, double: 27, triple: 1, hr: 9, bb: 23, so: 52, hbp: 6, sb: 1, cs: 3, sec: '3B', fld: 72 },
      { id: 'alfoned01', name: 'Edgardo Alfonzo', pos: '3B', bats: 'R', age: 24, pa: 630, h: 160, double: 28, triple: 2, hr: 14, bb: 62, so: 72, hbp: 3, sb: 9, cs: 4, sec: '2B', fld: 74 },
      { id: 'ordonre01', name: 'Rey Ordonez', pos: 'SS', bats: 'R', age: 27, pa: 548, h: 121, double: 15, triple: 3, hr: 1, bb: 24, so: 57, hbp: 1, sb: 6, cs: 6, sec: '2B', fld: 72 },
      { id: 'gilkebe01', name: 'Bernard Gilkey', pos: 'LF', bats: 'R', age: 31, pa: 419, h: 93, double: 20, triple: 1, hr: 11, bb: 46, so: 79, hbp: 4, sb: 8, cs: 5, sec: 'RF', fld: 71, arm: 84 },
      { id: 'mcraebr01', name: 'Brian McRae', pos: 'CF', bats: 'S', age: 30, pa: 645, h: 145, double: 33, triple: 6, hr: 17, bb: 73, so: 86, hbp: 6, sb: 22, cs: 10, sec: 'LF', fld: 53, arm: 68 },
      { id: 'huskebu01', name: 'Butch Huskey', pos: 'RF', bats: 'R', age: 26, pa: 402, h: 100, double: 18, triple: 1, hr: 15, bb: 23, so: 67, hbp: 1, sb: 6, cs: 5, sec: '1B', fld: 63, arm: 76 },
      { id: 'harrile01', name: 'Lenny Harris', pos: 'DH', bats: 'L', age: 33, pa: 317, h: 77, double: 15, triple: 1, hr: 5, bb: 19, so: 23, hbp: 2, sb: 7, cs: 5, sec: '3B', fld: 68, arm: 75 },
    ],
    bench: [
      { id: 'lopezlu02', name: 'Luis Lopez', pos: '2B', bats: 'S', age: 27, pa: 295, h: 67, double: 14, triple: 2, hr: 2, bb: 19, so: 62, hbp: 4, sb: 2, cs: 3, sec: 'SS', fld: 71 },
      { id: 'phillto02', name: 'Tony Phillips', pos: 'LF', bats: 'S', age: 39, pa: 289, h: 63, double: 15, triple: 1, hr: 4, bb: 47, so: 52, hbp: 2, sb: 4, cs: 3, sec: 'RF', fld: 63, arm: 62 },
      { id: 'francma01', name: 'Matt Franco', pos: '3B', bats: 'L', age: 28, pa: 187, h: 45, double: 6, triple: 1, hr: 3, bb: 19, so: 25, hbp: 1, sb: 0, cs: 1, sec: '1B' },
      { id: 'hundlto01', name: 'Todd Hundley', pos: 'LF', bats: 'S', age: 29, pa: 142, h: 29, double: 6, triple: 0, hr: 8, bb: 20, so: 37, hbp: 1, sb: 1, cs: 1, sec: 'RF', fld: 51, arm: 73 },
      { id: 'castial01', name: 'Alberto Castillo', pos: 'C', bats: 'R', age: 28, pa: 99, h: 17, double: 3, triple: 0, hr: 1, bb: 10, so: 19, hbp: 1, sb: 0, cs: 2, sec: '1B', fld: 74, arm: 95, rk: true },
    ],
    reserveBatters: [
      { id: 'spehrti01', name: 'Tim Spehr', pos: 'C', bats: 'R', age: 31, pa: 96, h: 13, double: 3, triple: 0, hr: 2, bb: 11, so: 23, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 82, arm: 73 },
      { id: 'prattto02', name: 'Todd Pratt', pos: 'C', bats: 'R', age: 31, pa: 71, h: 18, double: 6, triple: 0, hr: 2, bb: 5, so: 19, hbp: 1, sb: 0, cs: 0, sec: '1B' },
      { id: 'tatumji01', name: 'Jim Tatum', pos: '1B', bats: 'R', age: 30, pa: 57, h: 9, double: 1, triple: 2, hr: 2, bb: 3, so: 19, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'reedri01', name: 'Rick Reed', role: 'SP', throws: 'R', age: 33, g: 31, gs: 31, outs: 637, h: 202, hr: 26, bb: 30, so: 139, hbp: 6, er: 77, w: 16, l: 11, sv: 0, fld: 76 },
      { id: 'jonesbo03', name: 'Bobby Jones', role: 'SP', throws: 'R', age: 28, g: 30, gs: 30, outs: 586, h: 192, hr: 24, bb: 55, so: 119, hbp: 5, er: 86, w: 9, l: 9, sv: 0, fld: 76 },
      { id: 'leiteal01', name: 'Al Leiter', role: 'SP', throws: 'L', age: 32, g: 28, gs: 28, outs: 579, h: 149, hr: 11, bb: 88, so: 169, hbp: 12, er: 64, w: 17, l: 6, sv: 0, fld: 60 },
      { id: 'yoshima01', name: 'Masato Yoshii', role: 'SP', throws: 'R', age: 33, g: 29, gs: 29, outs: 515, h: 166, hr: 22, bb: 53, so: 117, hbp: 6, er: 75, w: 6, l: 8, sv: 0, fld: 66, rk: true },
      { id: 'nomohi01', name: 'Hideo Nomo', role: 'SP', throws: 'R', age: 29, g: 29, gs: 28, outs: 472, h: 137, hr: 18, bb: 79, so: 172, hbp: 5, er: 77, w: 6, l: 12, sv: 0, fld: 66 },
      { id: 'francjo01', name: 'John Franco', role: 'CL', throws: 'L', age: 37, g: 61, gs: 0, outs: 194, h: 63, hr: 4, bb: 27, so: 60, hbp: 3, er: 22, w: 0, l: 8, sv: 38 },
      { id: 'wendetu01', name: 'Turk Wendell', role: 'RP', throws: 'R', age: 31, g: 66, gs: 0, outs: 230, h: 61, hr: 5, bb: 40, so: 61, hbp: 2, er: 28, w: 5, l: 1, sv: 4 },
      { id: 'cookde01', name: 'Dennis Cook', role: 'RP', throws: 'L', age: 35, g: 73, gs: 0, outs: 204, h: 61, hr: 4, bb: 29, so: 72, hbp: 3, er: 24, w: 8, l: 4, sv: 1 },
      { id: 'mcmicgr01', name: 'Greg McMichael', role: 'RP', throws: 'R', age: 31, g: 64, gs: 0, outs: 204, h: 74, hr: 7, bb: 29, so: 63, hbp: 3, er: 28, w: 5, l: 4, sv: 2 },
      { id: 'rojasme01', name: 'Mel Rojas', role: 'RP', throws: 'R', age: 31, g: 50, gs: 0, outs: 174, h: 60, hr: 9, bb: 27, so: 58, hbp: 4, er: 34, w: 5, l: 2, sv: 2 },
      { id: 'tamje01', name: 'Jeff Tam', role: 'RP', throws: 'R', age: 27, g: 15, gs: 0, outs: 43, h: 13, hr: 2, bb: 4, so: 8, hbp: 2, er: 10, w: 1, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'reynoar02', name: 'Armando Reynoso', role: 'SP', throws: 'R', age: 32, g: 11, gs: 11, outs: 205, h: 71, hr: 7, bb: 25, so: 37, hbp: 4, er: 33, w: 7, l: 3, sv: 0 },
    ],
  },
  // PHI (PHI 1998)
  {
    franchiseId: 'PHI',
    season: 1998,
    batters: [
      { id: 'liebemi01', name: 'Mike Lieberthal', pos: 'C', bats: 'R', age: 26, pa: 342, h: 78, double: 16, triple: 2, hr: 11, bb: 23, so: 48, hbp: 5, sb: 2, cs: 2, sec: '1B', fld: 70, arm: 74 },
      { id: 'brognri01', name: 'Rico Brogna', pos: '1B', bats: 'L', age: 28, pa: 624, h: 149, double: 37, triple: 2, hr: 21, bb: 45, so: 126, hbp: 0, sb: 9, cs: 5, sec: '3B', fld: 85 },
      { id: 'lewisma01', name: 'Mark Lewis', pos: '2B', bats: 'R', age: 28, pa: 580, h: 135, double: 23, triple: 4, hr: 11, bb: 44, so: 106, hbp: 4, sb: 4, cs: 3, sec: 'SS', fld: 76 },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 23, pa: 711, h: 173, double: 42, triple: 4, hr: 28, bb: 88, so: 144, hbp: 12, sb: 15, cs: 7, sec: '1B', fld: 83 },
      { id: 'relafde01', name: 'Desi Relaford', pos: 'SS', bats: 'S', age: 24, pa: 546, h: 118, double: 24, triple: 4, hr: 5, bb: 35, so: 87, hbp: 3, sb: 10, cs: 5, sec: '2B', fld: 59, rk: true },
      { id: 'jeffegr01', name: 'Gregg Jefferies', pos: 'LF', bats: 'S', age: 30, pa: 592, h: 156, double: 27, triple: 3, hr: 10, bb: 41, so: 31, hbp: 1, sb: 14, cs: 5, sec: '1B', fld: 61, arm: 68 },
      { id: 'glanvdo01', name: 'Doug Glanville', pos: 'CF', bats: 'R', age: 27, pa: 735, h: 193, double: 29, triple: 7, hr: 7, bb: 39, so: 82, hbp: 4, sb: 24, cs: 9, sec: 'LF', fld: 68, arm: 76 },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 24, pa: 589, h: 150, double: 29, triple: 6, hr: 15, bb: 79, so: 133, hbp: 1, sb: 19, cs: 9, sec: 'LF', fld: 65, arm: 84 },
      { id: 'jordake01', name: 'Kevin Jordan', pos: 'DH', bats: 'R', age: 28, pa: 261, h: 68, double: 13, triple: 0, hr: 4, bb: 7, so: 33, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 80 },
    ],
    bench: [
      { id: 'sefcike01', name: 'Kevin Sefcik', pos: 'LF', bats: 'R', age: 27, pa: 205, h: 52, double: 7, triple: 2, hr: 3, bb: 19, so: 26, hbp: 5, sb: 3, cs: 2, sec: 'RF', fld: 85, arm: 60 },
      { id: 'estalbo02', name: 'Bobby Estalella', pos: 'C', bats: 'R', age: 23, pa: 182, h: 34, double: 6, triple: 1, hr: 10, bb: 15, so: 48, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 51, rk: true },
      { id: 'ariasal01', name: 'Alex Arias', pos: 'SS', bats: 'R', age: 30, pa: 149, h: 37, double: 6, triple: 0, hr: 1, bb: 13, so: 17, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 61 },
      { id: 'parenma01', name: 'Mark Parent', pos: 'C', bats: 'R', age: 36, pa: 126, h: 23, double: 4, triple: 0, hr: 2, bb: 8, so: 34, hbp: 0, sb: 0, cs: 1, fld: 61, arm: 70 },
      { id: 'amaroru02', name: 'Ruben Amaro', pos: 'LF', bats: 'S', age: 33, pa: 117, h: 24, double: 5, triple: 0, hr: 1, bb: 9, so: 15, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 60, arm: 94 },
    ],
    reserveBatters: [
      { id: 'mageewe01', name: 'Wendell Magee', pos: 'LF', bats: 'R', age: 25, pa: 82, h: 18, double: 4, triple: 0, hr: 1, bb: 6, so: 13, hbp: 0, sb: 0, cs: 1, sec: 'CF', fld: 50, arm: 66 },
      { id: 'zuberjo01', name: 'Jon Zuber', pos: 'LF', bats: 'L', age: 28, pa: 52, h: 11, double: 3, triple: 1, hr: 1, bb: 5, so: 8, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'anderma02', name: 'Marlon Anderson', pos: '2B', bats: 'L', age: 24, pa: 45, h: 14, double: 3, triple: 0, hr: 1, bb: 1, so: 6, hbp: 0, sb: 2, cs: 0, sec: 'SS', rk: true },
      { id: 'hudlere01', name: 'Rex Hudler', pos: 'RF', bats: 'R', age: 37, pa: 45, h: 10, double: 2, triple: 0, hr: 2, bb: 2, so: 9, hbp: 0, sb: 1, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'schilcu01', name: 'Curt Schilling', role: 'SP', throws: 'R', age: 31, g: 35, gs: 35, outs: 806, h: 230, hr: 24, bb: 63, so: 310, hbp: 6, er: 95, w: 15, l: 14, sv: 0, fld: 68 },
      { id: 'portuma01', name: 'Mark Portugal', role: 'SP', throws: 'R', age: 35, g: 26, gs: 26, outs: 499, h: 181, hr: 24, bb: 36, so: 100, hbp: 3, er: 80, w: 10, l: 5, sv: 0, fld: 73 },
      { id: 'greenty01', name: 'Tyler Green', role: 'SP', throws: 'R', age: 28, g: 27, gs: 27, outs: 478, h: 143, hr: 21, bb: 87, so: 114, hbp: 7, er: 88, w: 6, l: 12, sv: 0, fld: 59 },
      { id: 'loeweca01', name: 'Carlton Loewer', role: 'SP', throws: 'R', age: 24, g: 21, gs: 21, outs: 368, h: 154, hr: 18, bb: 39, so: 58, hbp: 3, er: 83, w: 7, l: 8, sv: 0, rk: true },
      { id: 'beechma01', name: 'Matt Beech', role: 'SP', throws: 'L', age: 26, g: 21, gs: 21, outs: 351, h: 128, hr: 20, bb: 56, so: 109, hbp: 4, er: 69, w: 3, l: 9, sv: 0 },
      { id: 'leitema01', name: 'Mark Leiter', role: 'CL', throws: 'R', age: 35, g: 69, gs: 0, outs: 266, h: 88, hr: 11, bb: 35, so: 74, hbp: 6, er: 46, w: 7, l: 5, sv: 23 },
      { id: 'gomeswa01', name: 'Wayne Gomes', role: 'RP', throws: 'R', age: 25, g: 71, gs: 0, outs: 280, h: 94, hr: 9, bb: 39, so: 77, hbp: 3, er: 46, w: 9, l: 6, sv: 1, rk: true },
      { id: 'spradje01', name: 'Jerry Spradlin', role: 'RP', throws: 'R', age: 31, g: 69, gs: 0, outs: 245, h: 70, hr: 9, bb: 22, so: 70, hbp: 2, er: 35, w: 4, l: 4, sv: 1 },
      { id: 'byrdpa01', name: 'Paul Byrd', role: 'RP', throws: 'R', age: 27, g: 9, gs: 8, outs: 171, h: 47, hr: 6, bb: 22, so: 37, hbp: 1, er: 23, w: 5, l: 2, sv: 0 },
      { id: 'perezyo01', name: 'Yorkis Perez', role: 'RP', throws: 'L', age: 30, g: 57, gs: 0, outs: 156, h: 45, hr: 3, bb: 26, so: 42, hbp: 0, er: 25, w: 0, l: 2, sv: 0 },
      { id: 'bottari01', name: 'Ricky Bottalico', role: 'RP', throws: 'R', age: 28, g: 39, gs: 0, outs: 130, h: 46, hr: 5, bb: 24, so: 44, hbp: 1, er: 24, w: 1, l: 5, sv: 6 },
    ],
    reservePitchers: [
      { id: 'gracemi02', name: 'Mike Grace', role: 'SP', throws: 'R', age: 28, g: 21, gs: 15, outs: 271, h: 107, hr: 10, bb: 28, so: 53, hbp: 6, er: 50, w: 4, l: 7, sv: 0 },
      { id: 'winstda01', name: 'Darrin Winston', role: 'RP', throws: 'L', age: 31, g: 27, gs: 0, outs: 75, h: 28, hr: 8, bb: 6, so: 13, hbp: 3, er: 17, w: 2, l: 2, sv: 1, rk: true },
      { id: 'stephga01', name: 'Garrett Stephenson', role: 'RP', throws: 'R', age: 26, g: 6, gs: 6, outs: 69, h: 27, hr: 3, bb: 12, so: 19, hbp: 1, er: 14, w: 0, l: 2, sv: 0 },
      { id: 'ryanke01', name: 'Ken Ryan', role: 'RP', throws: 'R', age: 29, g: 17, gs: 1, outs: 68, h: 23, hr: 2, bb: 15, so: 16, hbp: 1, er: 12, w: 0, l: 0, sv: 0 },
      { id: 'welchmi03', name: 'Mike Welch', role: 'RP', throws: 'R', age: 25, g: 10, gs: 2, outs: 62, h: 26, hr: 7, bb: 7, so: 15, hbp: 2, er: 19, w: 0, l: 2, sv: 0, rk: true },
    ],
  },
  // WSH (MON 1998)
  {
    franchiseId: 'WSH',
    season: 1998,
    batters: [
      { id: 'widgech01', name: 'Chris Widger', pos: 'C', bats: 'R', age: 27, pa: 448, h: 96, double: 21, triple: 2, hr: 13, bb: 30, so: 86, hbp: 1, sb: 5, cs: 1, sec: '1B', fld: 61, arm: 75 },
      { id: 'fullmbr01', name: 'Brad Fullmer', pos: '1B', bats: 'L', age: 23, pa: 547, h: 139, double: 43, triple: 2, hr: 14, bb: 38, so: 71, hbp: 3, sb: 6, cs: 6, sec: '3B', fld: 61, rk: true },
      { id: 'guerrwi01', name: 'Wilton Guerrero', pos: '2B', bats: 'S', age: 23, pa: 426, h: 115, double: 13, triple: 9, hr: 3, bb: 12, so: 62, hbp: 1, sb: 8, cs: 3, sec: 'SS', fld: 55 },
      { id: 'andresh01', name: 'Shane Andrews', pos: '3B', bats: 'R', age: 26, pa: 559, h: 116, double: 28, triple: 1, hr: 26, bb: 54, so: 143, hbp: 1, sb: 2, cs: 5, sec: '1B', fld: 88 },
      { id: 'grudzma01', name: 'Mark Grudzielanek', pos: 'SS', bats: 'R', age: 28, pa: 641, h: 166, double: 33, triple: 2, hr: 7, bb: 24, so: 73, hbp: 10, sb: 22, cs: 6, sec: '3B', fld: 66 },
      { id: 'santafp01', name: 'F. P. Santangelo', pos: 'LF', bats: 'S', age: 30, pa: 462, h: 89, double: 19, triple: 3, hr: 5, bb: 48, so: 72, hbp: 22, sb: 7, cs: 4, sec: 'CF', fld: 86, arm: 73 },
      { id: 'whitero02', name: 'Rondell White', pos: 'CF', bats: 'R', age: 26, pa: 397, h: 104, double: 20, triple: 3, hr: 16, bb: 24, so: 63, hbp: 6, sb: 13, cs: 6, sec: 'LF', fld: 90, arm: 73 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'RF', bats: 'R', age: 23, pa: 677, h: 198, double: 38, triple: 6, hr: 34, bb: 40, so: 90, hbp: 9, sb: 10, cs: 9, sec: 'LF', fld: 63, arm: 67 },
      { id: 'mayde01', name: 'Derrick May', pos: 'DH', bats: 'L', age: 29, pa: 192, h: 42, double: 7, triple: 1, hr: 4, bb: 13, so: 25, hbp: 0, sb: 2, cs: 1, sec: 'LF', fld: 61, arm: 75 },
    ],
    bench: [
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 23, pa: 285, h: 72, double: 15, triple: 5, hr: 3, bb: 18, so: 28, hbp: 0, sb: 6, cs: 3, sec: '2B', fld: 58, rk: true },
      { id: 'joneste02', name: 'Terry Jones', pos: 'CF', bats: 'S', age: 27, pa: 248, h: 46, double: 7, triple: 2, hr: 1, bb: 21, so: 46, hbp: 0, sb: 16, cs: 4, sec: 'LF', fld: 92, arm: 72, rk: true },
      { id: 'vidrojo01', name: 'Jose Vidro', pos: '2B', bats: 'S', age: 23, pa: 245, h: 49, double: 13, triple: 0, hr: 1, bb: 23, so: 31, hbp: 4, sb: 2, cs: 1, sec: '3B', fld: 52 },
      { id: 'mcguiry01', name: 'Ryan McGuire', pos: '1B', bats: 'L', age: 26, pa: 244, h: 45, double: 12, triple: 1, hr: 2, bb: 28, so: 48, hbp: 0, sb: 0, cs: 2, sec: 'LF', fld: 61 },
      { id: 'perezro01', name: 'Robert Perez', pos: 'LF', bats: 'R', age: 29, pa: 145, h: 34, double: 4, triple: 0, hr: 3, bb: 3, so: 24, hbp: 1, sb: 1, cs: 0, sec: 'RF', fld: 41, arm: 88 },
    ],
    reserveBatters: [
      { id: 'henlebo01', name: 'Bob Henley', pos: 'C', bats: 'R', age: 25, pa: 132, h: 35, double: 8, triple: 1, hr: 3, bb: 11, so: 26, hbp: 3, sb: 3, cs: 0, sec: '1B', fld: 73, arm: 71, rk: true },
      { id: 'mordemi01', name: 'Mike Mordecai', pos: 'SS', bats: 'R', age: 30, pa: 130, h: 24, double: 4, triple: 2, hr: 2, bb: 9, so: 22, hbp: 0, sb: 1, cs: 0, sec: '2B' },
      { id: 'livinsc01', name: 'Scott Livingstone', pos: '3B', bats: 'L', age: 32, pa: 118, h: 25, double: 5, triple: 0, hr: 0, bb: 5, so: 15, hbp: 0, sb: 1, cs: 1, sec: '1B' },
      { id: 'stovada01', name: 'DaRond Stovall', pos: 'LF', bats: 'S', age: 25, pa: 84, h: 16, double: 2, triple: 1, hr: 2, bb: 6, so: 29, hbp: 0, sb: 1, cs: 0, sec: 'CF', fld: 58, arm: 79, rk: true },
      { id: 'hubbami01', name: 'Mike Hubbard', pos: 'C', bats: 'R', age: 27, pa: 56, h: 9, double: 0, triple: 0, hr: 1, bb: 1, so: 18, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'perezca01', name: 'Carlos Perez', role: 'SP', throws: 'L', age: 27, g: 34, gs: 34, outs: 723, h: 243, hr: 22, bb: 61, so: 129, hbp: 4, er: 99, w: 11, l: 14, sv: 0, fld: 76 },
      { id: 'hermadu01', name: 'Dustin Hermanson', role: 'SP', throws: 'R', age: 25, g: 32, gs: 30, outs: 561, h: 161, hr: 20, bb: 63, so: 155, hbp: 2, er: 70, w: 14, l: 11, sv: 0, fld: 70 },
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 21, g: 33, gs: 32, outs: 517, h: 196, hr: 31, bb: 68, so: 139, hbp: 11, er: 116, w: 5, l: 15, sv: 0, fld: 74, rk: true },
      { id: 'batismi01', name: 'Miguel Batista', role: 'SP', throws: 'R', age: 27, g: 56, gs: 13, outs: 405, h: 139, hr: 12, bb: 69, so: 93, hbp: 6, er: 62, w: 3, l: 5, sv: 0, fld: 74, rk: true },
      { id: 'pavanca01', name: 'Carl Pavano', role: 'SP', throws: 'R', age: 22, g: 24, gs: 23, outs: 404, h: 130, hr: 18, bb: 43, so: 83, hbp: 8, er: 63, w: 6, l: 9, sv: 0, fld: 68, rk: true },
      { id: 'urbinug01', name: 'Ugueth Urbina', role: 'CL', throws: 'R', age: 24, g: 64, gs: 0, outs: 208, h: 47, hr: 6, bb: 30, so: 83, hbp: 0, er: 19, w: 6, l: 3, sv: 34 },
      { id: 'bennesh01', name: 'Shayne Bennett', role: 'RP', throws: 'R', age: 26, g: 62, gs: 0, outs: 275, h: 96, hr: 8, bb: 44, so: 56, hbp: 5, er: 53, w: 5, l: 5, sv: 1, rk: true },
      { id: 'telfoan01', name: 'Anthony Telford', role: 'RP', throws: 'R', age: 32, g: 77, gs: 0, outs: 273, h: 83, hr: 10, bb: 35, so: 61, hbp: 4, er: 37, w: 3, l: 6, sv: 1 },
      { id: 'klinest02', name: 'Steve Kline', role: 'RP', throws: 'L', age: 25, g: 78, gs: 0, outs: 215, h: 72, hr: 7, bb: 37, so: 66, hbp: 3, er: 30, w: 3, l: 6, sv: 1 },
      { id: 'maddumi01', name: 'Mike Maddux', role: 'RP', throws: 'R', age: 36, g: 51, gs: 0, outs: 167, h: 55, hr: 5, bb: 18, so: 30, hbp: 2, er: 26, w: 3, l: 4, sv: 1 },
      { id: 'valdema01', name: 'Marc Valdes', role: 'RP', throws: 'R', age: 26, g: 20, gs: 4, outs: 109, h: 39, hr: 3, bb: 18, so: 22, hbp: 2, er: 20, w: 1, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'thurmmi01', name: 'Mike Thurman', role: 'SP', throws: 'R', age: 24, g: 14, gs: 13, outs: 201, h: 59, hr: 8, bb: 26, so: 34, hbp: 3, er: 36, w: 4, l: 5, sv: 0, rk: true },
      { id: 'mooretr01', name: 'Trey Moore', role: 'SP', throws: 'L', age: 25, g: 13, gs: 11, outs: 183, h: 78, hr: 5, bb: 17, so: 35, hbp: 1, er: 34, w: 2, l: 5, sv: 0, rk: true },
      { id: 'deharri01', name: 'Rick DeHart', role: 'RP', throws: 'L', age: 28, g: 26, gs: 0, outs: 84, h: 33, hr: 5, bb: 13, so: 20, hbp: 0, er: 16, w: 0, l: 0, sv: 1, rk: true },
      { id: 'powelje01', name: 'Jeremy Powell', role: 'RP', throws: 'R', age: 22, g: 7, gs: 6, outs: 75, h: 27, hr: 5, bb: 11, so: 14, hbp: 4, er: 22, w: 1, l: 5, sv: 0, rk: true },
      { id: 'boskish01', name: 'Shawn Boskie', role: 'RP', throws: 'R', age: 31, g: 5, gs: 5, outs: 53, h: 26, hr: 4, bb: 7, so: 13, hbp: 1, er: 14, w: 1, l: 3, sv: 0 },
    ],
  },
  // CHC (CHN 1998)
  {
    franchiseId: 'CHC',
    season: 1998,
    batters: [
      { id: 'servasc01', name: 'Scott Servais', pos: 'C', bats: 'R', age: 31, pa: 360, h: 79, double: 16, triple: 0, hr: 7, bb: 23, so: 50, hbp: 6, sb: 0, cs: 1, sec: '1B', fld: 77, arm: 65 },
      { id: 'gracema01', name: 'Mark Grace', pos: '1B', bats: 'L', age: 34, pa: 698, h: 189, double: 38, triple: 3, hr: 15, bb: 90, so: 52, hbp: 2, sb: 3, cs: 6, fld: 75 },
      { id: 'moranmi01', name: 'Mickey Morandini', pos: '2B', bats: 'L', age: 32, pa: 669, h: 168, double: 28, triple: 4, hr: 5, bb: 67, so: 90, hbp: 9, sb: 17, cs: 6, sec: 'SS', fld: 65 },
      { id: 'hernajo01', name: 'Jose Hernandez', pos: '3B', bats: 'R', age: 28, pa: 533, h: 125, double: 22, triple: 7, hr: 21, bb: 39, so: 136, hbp: 1, sb: 5, cs: 6, sec: 'SS', fld: 76 },
      { id: 'blausje01', name: 'Jeff Blauser', pos: 'SS', bats: 'R', age: 32, pa: 435, h: 95, double: 17, triple: 3, hr: 9, bb: 55, so: 81, hbp: 11, sb: 3, cs: 1, sec: '2B', fld: 47 },
      { id: 'rodrihe02', name: 'Henry Rodriguez', pos: 'LF', bats: 'L', age: 30, pa: 473, h: 107, double: 25, triple: 2, hr: 28, bb: 44, so: 124, hbp: 1, sb: 2, cs: 2, sec: '1B', fld: 86, arm: 71 },
      { id: 'johnsla03', name: 'Lance Johnson', pos: 'CF', bats: 'L', age: 34, pa: 332, h: 93, double: 11, triple: 6, hr: 3, bb: 25, so: 21, hbp: 0, sb: 15, cs: 7, sec: 'LF', fld: 53, arm: 71 },
      { id: 'sosasa01', name: 'Sammy Sosa', pos: 'RF', bats: 'R', age: 29, pa: 722, h: 185, double: 25, triple: 2, hr: 55, bb: 60, so: 175, hbp: 2, sb: 20, cs: 10, sec: 'CF', fld: 71, arm: 75 },
      { id: 'alexama02', name: 'Manny Alexander', pos: 'DH', bats: 'R', age: 27, pa: 289, h: 62, double: 11, triple: 2, hr: 4, bb: 18, so: 65, hbp: 2, sb: 8, cs: 2, sec: '3B', fld: 42 },
    ],
    bench: [
      { id: 'orieke01', name: 'Kevin Orie', pos: '3B', bats: 'R', age: 25, pa: 425, h: 91, double: 23, triple: 3, hr: 8, bb: 35, so: 59, hbp: 7, sb: 2, cs: 1, sec: '1B', fld: 83 },
      { id: 'brownbr01', name: 'Brant Brown', pos: 'CF', bats: 'L', age: 27, pa: 380, h: 98, double: 17, triple: 6, hr: 14, bb: 27, so: 90, hbp: 3, sb: 5, cs: 5, sec: 'LF', fld: 51, arm: 57 },
      { id: 'houstty01', name: 'Tyler Houston', pos: 'C', bats: 'L', age: 27, pa: 270, h: 67, double: 10, triple: 1, hr: 7, bb: 13, so: 50, hbp: 0, sb: 2, cs: 2, sec: '1B', fld: 75, arm: 60 },
      { id: 'mieskma01', name: 'Matt Mieske', pos: 'LF', bats: 'R', age: 30, pa: 111, h: 27, double: 6, triple: 1, hr: 2, bb: 8, so: 20, hbp: 0, sb: 0, cs: 0, sec: 'RF', fld: 54, arm: 64 },
      { id: 'martisa01', name: 'Sandy Martinez', pos: 'C', bats: 'L', age: 27, pa: 102, h: 22, double: 7, triple: 1, hr: 1, bb: 10, so: 22, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 69, arm: 61 },
    ],
    pitchers: [
      { id: 'tapanke01', name: 'Kevin Tapani', role: 'SP', throws: 'R', age: 34, g: 35, gs: 34, outs: 657, h: 236, hr: 29, bb: 65, so: 140, hbp: 5, er: 112, w: 19, l: 9, sv: 0, fld: 71 },
      { id: 'clarkma01', name: 'Mark Clark', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 641, h: 229, hr: 23, bb: 53, so: 148, hbp: 4, er: 102, w: 9, l: 14, sv: 0, fld: 67 },
      { id: 'trachst01', name: 'Steve Trachsel', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 624, h: 211, hr: 30, bb: 77, so: 152, hbp: 7, er: 98, w: 15, l: 8, sv: 0, fld: 80 },
      { id: 'woodke02', name: 'Kerry Wood', role: 'SP', throws: 'R', age: 21, g: 26, gs: 26, outs: 500, h: 117, hr: 14, bb: 85, so: 233, hbp: 11, er: 63, w: 13, l: 6, sv: 0, fld: 55, rk: true },
      { id: 'gonzaje01', name: 'Geremi Gonzalez', role: 'SP', throws: 'R', age: 23, g: 20, gs: 20, outs: 330, h: 113, hr: 13, bb: 47, so: 72, hbp: 2, er: 60, w: 7, l: 7, sv: 0 },
      { id: 'beckro01', name: 'Rod Beck', role: 'CL', throws: 'R', age: 29, g: 81, gs: 0, outs: 241, h: 83, hr: 10, bb: 16, so: 74, hbp: 2, er: 29, w: 3, l: 4, sv: 51 },
      { id: 'mulhote01', name: 'Terry Mulholland', role: 'RP', throws: 'L', age: 35, g: 70, gs: 6, outs: 336, h: 110, hr: 11, bb: 32, so: 61, hbp: 5, er: 47, w: 6, l: 5, sv: 3 },
      { id: 'adamste01', name: 'Terry Adams', role: 'RP', throws: 'R', age: 25, g: 63, gs: 0, outs: 218, h: 75, hr: 5, bb: 39, so: 66, hbp: 1, er: 33, w: 7, l: 7, sv: 1 },
      { id: 'wengedo01', name: 'Don Wengert', role: 'RP', throws: 'R', age: 28, g: 31, gs: 6, outs: 190, h: 80, hr: 10, bb: 23, so: 36, hbp: 3, er: 40, w: 1, l: 5, sv: 1 },
      { id: 'piscima01', name: 'Marc Pisciotta', role: 'RP', throws: 'R', age: 27, g: 43, gs: 0, outs: 132, h: 41, hr: 3, bb: 31, so: 32, hbp: 2, er: 19, w: 1, l: 2, sv: 0, rk: true },
      { id: 'steveda01', name: 'Dave Stevens', role: 'RP', throws: 'R', age: 28, g: 31, gs: 0, outs: 114, h: 45, hr: 7, bb: 20, so: 28, hbp: 1, er: 24, w: 1, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'pattebo01', name: 'Bob Patterson', role: 'RP', throws: 'L', age: 39, g: 33, gs: 0, outs: 61, h: 26, hr: 3, bb: 8, so: 23, hbp: 0, er: 12, w: 1, l: 1, sv: 1 },
      { id: 'myersro01', name: 'Rodney Myers', role: 'RP', throws: 'R', age: 29, g: 12, gs: 0, outs: 54, h: 21, hr: 2, bb: 9, so: 14, hbp: 1, er: 12, w: 0, l: 0, sv: 0 },
      { id: 'vanrybe01', name: 'Ben VanRyn', role: 'RP', throws: 'L', age: 26, g: 25, gs: 0, outs: 44, h: 18, hr: 0, bb: 12, so: 10, hbp: 2, er: 10, w: 0, l: 2, sv: 0, rk: true },
    ],
  },
  // CIN (CIN 1998)
  {
    franchiseId: 'CIN',
    season: 1998,
    batters: [
      { id: 'taubeed01', name: 'Ed Taubensee', pos: 'C', bats: 'L', age: 29, pa: 491, h: 121, double: 28, triple: 0, hr: 13, bb: 46, so: 97, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 69, arm: 58 },
      { id: 'caseyse01', name: 'Sean Casey', pos: '1B', bats: 'L', age: 23, pa: 351, h: 81, double: 21, triple: 1, hr: 7, bb: 43, so: 45, hbp: 4, sb: 1, cs: 1, sec: '3B', fld: 62, rk: true },
      { id: 'boonebr01', name: 'Bret Boone', pos: '2B', bats: 'R', age: 29, pa: 648, h: 145, double: 34, triple: 1, hr: 18, bb: 49, so: 113, hbp: 4, sb: 6, cs: 4, sec: 'SS', fld: 74 },
      { id: 'greenwi01', name: 'Willie Greene', pos: '3B', bats: 'L', age: 26, pa: 470, h: 102, double: 17, triple: 2, hr: 19, bb: 65, so: 94, hbp: 2, sb: 5, cs: 2, sec: 'SS', fld: 66 },
      { id: 'larkiba01', name: 'Barry Larkin', pos: 'SS', bats: 'R', age: 34, pa: 626, h: 163, double: 34, triple: 8, hr: 19, bb: 87, so: 63, hbp: 4, sb: 29, cs: 5, fld: 60 },
      { id: 'youngdm01', name: 'Dmitri Young', pos: 'LF', bats: 'S', age: 24, pa: 590, h: 156, double: 40, triple: 2, hr: 12, bb: 51, so: 95, hbp: 3, sb: 4, cs: 5, sec: '1B', fld: 51, arm: 62 },
      { id: 'sandere02', name: 'Reggie Sanders', pos: 'CF', bats: 'R', age: 30, pa: 545, h: 125, double: 22, triple: 5, hr: 19, bb: 57, so: 139, hbp: 6, sb: 22, cs: 10, sec: 'RF', fld: 57, arm: 62 },
      { id: 'nunnajo01', name: 'Jon Nunnally', pos: 'RF', bats: 'L', age: 26, pa: 213, h: 45, double: 9, triple: 2, hr: 9, bb: 30, so: 43, hbp: 1, sb: 4, cs: 3, sec: 'CF', fld: 82, arm: 78 },
      { id: 'nieveme01', name: 'Melvin Nieves', pos: 'DH', bats: 'S', age: 26, pa: 147, h: 31, double: 6, triple: 1, hr: 6, bb: 17, so: 51, hbp: 1, sb: 0, cs: 1, sec: 'RF', fld: 63, arm: 66 },
    ],
    bench: [
      { id: 'stynech01', name: 'Chris Stynes', pos: 'LF', bats: 'R', age: 25, pa: 388, h: 99, double: 11, triple: 1, hr: 7, bb: 28, so: 32, hbp: 5, sb: 17, cs: 2, sec: 'RF', fld: 80, arm: 70 },
      { id: 'booneaa01', name: 'Aaron Boone', pos: '3B', bats: 'R', age: 25, pa: 206, h: 51, double: 12, triple: 2, hr: 2, bb: 14, so: 34, hbp: 4, sb: 6, cs: 1, sec: '1B', fld: 77, rk: true },
      { id: 'perezed01', name: 'Eduardo Perez', pos: '1B', bats: 'R', age: 28, pa: 198, h: 43, double: 7, triple: 0, hr: 7, bb: 19, so: 45, hbp: 2, sb: 2, cs: 1, sec: '3B', fld: 81 },
      { id: 'watkipa01', name: 'Pat Watkins', pos: 'CF', bats: 'R', age: 25, pa: 162, h: 38, double: 8, triple: 1, hr: 2, bb: 7, so: 26, hbp: 1, sb: 1, cs: 3, sec: 'RF', fld: 61, arm: 60, rk: true },
      { id: 'fordybr01', name: 'Brook Fordyce', pos: 'C', bats: 'R', age: 28, pa: 158, h: 35, double: 9, triple: 0, hr: 3, bb: 12, so: 26, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 67, arm: 74, rk: true },
    ],
    reserveBatters: [
      { id: 'reesepo01', name: 'Pokey Reese', pos: '3B', bats: 'R', age: 25, pa: 151, h: 31, double: 4, triple: 1, hr: 1, bb: 12, so: 28, hbp: 1, sb: 7, cs: 2, sec: 'SS', fld: 83 },
      { id: 'frankmi02', name: 'Mike Frank', pos: 'CF', bats: 'L', age: 24, pa: 98, h: 20, double: 6, triple: 0, hr: 0, bb: 7, so: 12, hbp: 0, sb: 0, cs: 0, sec: 'LF', fld: 84, arm: 65, rk: true },
      { id: 'petagro01', name: 'Roberto Petagine', pos: '1B', bats: 'L', age: 27, pa: 79, h: 15, double: 2, triple: 1, hr: 3, bb: 13, so: 15, hbp: 1, sb: 1, cs: 0, sec: '3B' },
      { id: 'jacksda04', name: 'Damian Jackson', pos: 'SS', bats: 'R', age: 24, pa: 45, h: 10, double: 4, triple: 0, hr: 0, bb: 5, so: 6, hbp: 0, sb: 2, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'tomkobr01', name: 'Brett Tomko', role: 'SP', throws: 'R', age: 25, g: 34, gs: 34, outs: 632, h: 192, hr: 22, bb: 68, so: 161, hbp: 7, er: 97, w: 13, l: 12, sv: 0, fld: 69 },
      { id: 'harnipe01', name: 'Pete Harnisch', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 627, h: 186, hr: 26, bb: 68, so: 143, hbp: 6, er: 84, w: 14, l: 7, sv: 0, fld: 70 },
      { id: 'remlimi01', name: 'Mike Remlinger', role: 'SP', throws: 'L', age: 32, g: 35, gs: 28, outs: 493, h: 155, hr: 21, bb: 87, so: 161, hbp: 7, er: 86, w: 8, l: 15, sv: 0, fld: 58 },
      { id: 'parrist01', name: 'Steve Parris', role: 'SP', throws: 'R', age: 30, g: 18, gs: 16, outs: 297, h: 92, hr: 9, bb: 32, so: 78, hbp: 4, er: 44, w: 6, l: 5, sv: 0 },
      { id: 'winchsc01', name: 'Scott Winchester', role: 'SP', throws: 'R', age: 25, g: 16, gs: 16, outs: 237, h: 101, hr: 12, bb: 27, so: 40, hbp: 4, er: 51, w: 3, l: 6, sv: 0, rk: true },
      { id: 'shawje01', name: 'Jeff Shaw', role: 'CL', throws: 'R', age: 31, g: 73, gs: 0, outs: 255, h: 75, hr: 7, bb: 17, so: 60, hbp: 1, er: 22, w: 3, l: 8, sv: 48 },
      { id: 'weathda01', name: 'David Weathers', role: 'RP', throws: 'R', age: 28, g: 44, gs: 9, outs: 330, h: 132, hr: 7, bb: 45, so: 85, hbp: 4, er: 65, w: 6, l: 5, sv: 0 },
      { id: 'sullisc01', name: 'Scott Sullivan', role: 'RP', throws: 'R', age: 27, g: 67, gs: 0, outs: 306, h: 94, hr: 13, bb: 35, so: 92, hbp: 9, er: 51, w: 5, l: 5, sv: 1 },
      { id: 'whitega01', name: 'Gabe White', role: 'RP', throws: 'L', age: 26, g: 69, gs: 3, outs: 296, h: 88, hr: 16, bb: 25, so: 78, hbp: 1, er: 45, w: 5, l: 5, sv: 9 },
      { id: 'graveda01', name: 'Danny Graves', role: 'RP', throws: 'R', age: 24, g: 62, gs: 0, outs: 244, h: 81, hr: 6, bb: 32, so: 42, hbp: 1, er: 33, w: 2, l: 1, sv: 8 },
      { id: 'hudekjo01', name: 'John Hudek', role: 'RP', throws: 'R', age: 31, g: 58, gs: 0, outs: 192, h: 52, hr: 9, bb: 46, so: 64, hbp: 4, er: 27, w: 5, l: 6, sv: 0 },
    ],
    reservePitchers: [
      { id: 'reyesde01', name: 'Dennys Reyes', role: 'SP', throws: 'L', age: 21, g: 19, gs: 10, outs: 202, h: 66, hr: 4, bb: 41, so: 70, hbp: 1, er: 33, w: 3, l: 5, sv: 0, rk: true },
      { id: 'belinst01', name: 'Stan Belinda', role: 'RP', throws: 'R', age: 31, g: 40, gs: 0, outs: 184, h: 49, hr: 7, bb: 25, so: 61, hbp: 4, er: 25, w: 4, l: 8, sv: 1 },
      { id: 'krivdri01', name: 'Rick Krivda', role: 'RP', throws: 'L', age: 28, g: 27, gs: 2, outs: 154, h: 67, hr: 9, bb: 29, so: 32, hbp: 2, er: 38, w: 2, l: 2, sv: 0 },
      { id: 'klingsc01', name: 'Scott Klingenbeck', role: 'RP', throws: 'R', age: 27, g: 4, gs: 4, outs: 68, h: 28, hr: 5, bb: 7, so: 12, hbp: 1, er: 16, w: 1, l: 3, sv: 0 },
      { id: 'huttoma01', name: 'Mark Hutton', role: 'RP', throws: 'R', age: 28, g: 10, gs: 2, outs: 51, h: 22, hr: 3, bb: 11, so: 11, hbp: 1, er: 11, w: 0, l: 1, sv: 0 },
    ],
  },
  // MIL (MIL 1998)
  {
    franchiseId: 'MIL',
    season: 1998,
    batters: [
      { id: 'mathemi01', name: 'Mike Matheny', pos: 'C', bats: 'R', age: 27, pa: 341, h: 74, double: 14, triple: 1, hr: 6, bb: 13, so: 67, hbp: 6, sb: 1, cs: 1, sec: '1B', fld: 69, arm: 60 },
      { id: 'loretma01', name: 'Mark Loretta', pos: '1B', bats: 'R', age: 26, pa: 491, h: 131, double: 23, triple: 2, hr: 5, bb: 44, so: 52, hbp: 5, sb: 7, cs: 5, sec: '3B', fld: 64 },
      { id: 'vinafe01', name: 'Fernando Vina', pos: '2B', bats: 'L', age: 29, pa: 722, h: 193, double: 33, triple: 7, hr: 7, bb: 47, so: 45, hbp: 21, sb: 20, cs: 14, sec: 'SS', fld: 97 },
      { id: 'cirilje01', name: 'Jeff Cirillo', pos: '3B', bats: 'R', age: 28, pa: 694, h: 189, double: 40, triple: 2, hr: 13, bb: 71, so: 82, hbp: 8, sb: 7, cs: 5, sec: '2B', fld: 93 },
      { id: 'valenjo03', name: 'Jose Valentin', pos: 'SS', bats: 'S', age: 28, pa: 497, h: 105, double: 23, triple: 1, hr: 16, bb: 52, so: 105, hbp: 2, sb: 13, cs: 6, sec: '2B', fld: 68 },
      { id: 'jenkige01', name: 'Geoff Jenkins', pos: 'LF', bats: 'L', age: 23, pa: 285, h: 60, double: 12, triple: 1, hr: 9, bb: 20, so: 61, hbp: 2, sb: 1, cs: 3, sec: 'RF', fld: 61, arm: 75, rk: true },
      { id: 'grissma02', name: 'Marquis Grissom', pos: 'CF', bats: 'R', age: 31, pa: 572, h: 146, double: 26, triple: 4, hr: 12, bb: 31, so: 75, hbp: 3, sb: 17, cs: 9, sec: 'RF', fld: 71, arm: 69 },
      { id: 'burnije01', name: 'Jeromy Burnitz', pos: 'RF', bats: 'L', age: 29, pa: 691, h: 162, double: 34, triple: 4, hr: 35, bb: 78, so: 148, hbp: 5, sb: 13, cs: 8, sec: 'CF', fld: 63, arm: 68 },
      { id: 'jahajo01', name: 'John Jaha', pos: 'DH', bats: 'R', age: 32, pa: 273, h: 56, double: 9, triple: 1, hr: 11, bb: 42, so: 59, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 61 },
    ],
    bench: [
      { id: 'nilssda01', name: 'Dave Nilsson', pos: '1B', bats: 'L', age: 28, pa: 347, h: 87, double: 17, triple: 1, hr: 11, bb: 35, so: 48, hbp: 1, sb: 1, cs: 2, sec: 'LF', fld: 56 },
      { id: 'hughebo01', name: 'Bobby Hughes', pos: 'C', bats: 'R', age: 27, pa: 237, h: 50, double: 7, triple: 2, hr: 9, bb: 16, so: 54, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 72, arm: 57, rk: true },
      { id: 'jacksda03', name: 'Darrin Jackson', pos: 'LF', bats: 'R', age: 34, pa: 214, h: 50, double: 11, triple: 1, hr: 4, bb: 8, so: 34, hbp: 1, sb: 2, cs: 1, sec: 'CF', fld: 77, arm: 68 },
      { id: 'newfima01', name: 'Marc Newfield', pos: 'LF', bats: 'R', age: 25, pa: 209, h: 46, double: 9, triple: 0, hr: 3, bb: 17, so: 32, hbp: 2, sb: 0, cs: 1, sec: 'RF', fld: 61, arm: 71 },
      { id: 'hamelbo01', name: 'Bob Hamelin', pos: '1B', bats: 'L', age: 30, pa: 167, h: 36, double: 7, triple: 0, hr: 7, bb: 21, so: 32, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 51 },
    ],
    reserveBatters: [
      { id: 'levisje01', name: 'Jesse Levis', pos: 'C', bats: 'L', age: 30, pa: 48, h: 11, double: 1, triple: 0, hr: 0, bb: 6, so: 4, hbp: 1, sb: 0, cs: 0, sec: '1B' },
      { id: 'owenser01', name: 'Eric Owens', pos: 'LF', bats: 'R', age: 27, pa: 43, h: 8, double: 1, triple: 0, hr: 0, bb: 3, so: 7, hbp: 0, sb: 2, cs: 1, sec: 'CF' },
    ],
    pitchers: [
      { id: 'karlsc01', name: 'Scott Karl', role: 'SP', throws: 'L', age: 26, g: 33, gs: 33, outs: 577, h: 215, hr: 23, bb: 67, so: 110, hbp: 5, er: 97, w: 10, l: 11, sv: 0, fld: 81 },
      { id: 'judenje01', name: 'Jeff Juden', role: 'SP', throws: 'R', age: 27, g: 32, gs: 30, outs: 535, h: 178, hr: 26, bb: 83, so: 150, hbp: 12, er: 103, w: 8, l: 14, sv: 0, fld: 59 },
      { id: 'woodast01', name: 'Steve Woodard', role: 'SP', throws: 'R', age: 23, g: 34, gs: 26, outs: 497, h: 171, hr: 19, bb: 32, so: 136, hbp: 9, er: 79, w: 10, l: 12, sv: 0, fld: 61, rk: true },
      { id: 'woodabr01', name: 'Brad Woodall', role: 'SP', throws: 'L', age: 29, g: 31, gs: 20, outs: 414, h: 147, hr: 25, bb: 46, so: 87, hbp: 6, er: 77, w: 7, l: 9, sv: 0, fld: 71, rk: true },
      { id: 'eldreca01', name: 'Cal Eldred', role: 'SP', throws: 'R', age: 30, g: 23, gs: 23, outs: 399, h: 148, hr: 17, bb: 61, so: 84, hbp: 5, er: 73, w: 4, l: 8, sv: 0 },
      { id: 'wickmbo01', name: 'Bob Wickman', role: 'CL', throws: 'R', age: 29, g: 72, gs: 0, outs: 247, h: 80, hr: 6, bb: 38, so: 69, hbp: 4, er: 32, w: 6, l: 9, sv: 25 },
      { id: 'jonesdo01', name: 'Doug Jones', role: 'RP', throws: 'R', age: 41, g: 69, gs: 0, outs: 256, h: 91, hr: 12, bb: 16, so: 80, hbp: 4, er: 36, w: 4, l: 6, sv: 13 },
      { id: 'patribr01', name: 'Bronswell Patrick', role: 'RP', throws: 'R', age: 27, g: 32, gs: 3, outs: 236, h: 83, hr: 9, bb: 29, so: 49, hbp: 0, er: 41, w: 4, l: 1, sv: 0, rk: true },
      { id: 'foxch02', name: 'Chad Fox', role: 'RP', throws: 'R', age: 27, g: 49, gs: 0, outs: 171, h: 54, hr: 5, bb: 23, so: 62, hbp: 1, er: 24, w: 1, l: 4, sv: 0, rk: true },
      { id: 'reyesal01', name: 'Alberto Reyes', role: 'RP', throws: 'R', age: 28, g: 50, gs: 0, outs: 171, h: 57, hr: 9, bb: 27, so: 56, hbp: 3, er: 28, w: 5, l: 1, sv: 0 },
      { id: 'wagnepa01', name: 'Paul Wagner', role: 'RP', throws: 'R', age: 30, g: 13, gs: 9, outs: 167, h: 65, hr: 9, bb: 31, so: 42, hbp: 1, er: 39, w: 1, l: 5, sv: 0 },
    ],
    reservePitchers: [
      { id: 'pulsibi01', name: 'Bill Pulsipher', role: 'SP', throws: 'L', age: 24, g: 26, gs: 11, outs: 217, h: 86, hr: 8, bb: 31, so: 51, hbp: 1, er: 41, w: 3, l: 4, sv: 0 },
      { id: 'myersmi01', name: 'Mike Myers', role: 'RP', throws: 'L', age: 29, g: 70, gs: 0, outs: 150, h: 48, hr: 7, bb: 23, so: 44, hbp: 4, er: 23, w: 2, l: 2, sv: 1 },
      { id: 'roquera01', name: 'Rafael Roque', role: 'RP', throws: 'L', age: 26, g: 9, gs: 9, outs: 144, h: 42, hr: 9, bb: 24, so: 34, hbp: 1, er: 26, w: 4, l: 2, sv: 0, rk: true },
      { id: 'mercejo02', name: 'Jose Mercedes', role: 'RP', throws: 'R', age: 27, g: 7, gs: 5, outs: 96, h: 34, hr: 5, bb: 11, so: 16, hbp: 1, er: 18, w: 2, l: 2, sv: 0 },
      { id: 'delosva01', name: 'Valerio De Los Santos', role: 'RP', throws: 'L', age: 25, g: 13, gs: 0, outs: 65, h: 11, hr: 4, bb: 2, so: 18, hbp: 0, er: 7, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // PIT (PIT 1998)
  {
    franchiseId: 'PIT',
    season: 1998,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 24, pa: 627, h: 168, double: 36, triple: 4, hr: 10, bb: 51, so: 52, hbp: 30, sb: 21, cs: 5, sec: '1B', fld: 73, arm: 65 },
      { id: 'youngke01', name: 'Kevin Young', pos: '1B', bats: 'R', age: 29, pa: 656, h: 165, double: 37, triple: 3, hr: 29, bb: 40, so: 137, hbp: 9, sb: 16, cs: 6, sec: '3B', fld: 65 },
      { id: 'womacto01', name: 'Tony Womack', pos: '2B', bats: 'L', age: 28, pa: 704, h: 184, double: 27, triple: 8, hr: 4, bb: 41, so: 100, hbp: 1, sb: 59, cs: 8, sec: 'SS', fld: 76 },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 20, pa: 275, h: 59, double: 9, triple: 1, hr: 6, bb: 18, so: 72, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 46, rk: true },
      { id: 'collilo01', name: 'Lou Collier', pos: 'SS', bats: 'R', age: 24, pa: 379, h: 80, double: 12, triple: 6, hr: 2, bb: 30, so: 72, hbp: 6, sb: 2, cs: 2, sec: '2B', fld: 66, rk: true },
      { id: 'martial03', name: 'Al Martin', pos: 'LF', bats: 'L', age: 30, pa: 479, h: 116, double: 21, triple: 3, hr: 12, bb: 37, so: 86, hbp: 4, sb: 22, cs: 5, sec: 'CF', fld: 69, arm: 68 },
      { id: 'allenje01', name: 'Jermaine Allensworth', pos: 'CF', bats: 'R', age: 26, pa: 409, h: 94, double: 18, triple: 3, hr: 4, bb: 34, so: 76, hbp: 9, sb: 15, cs: 7, sec: 'RF', fld: 61, arm: 64 },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'RF', bats: 'R', age: 22, pa: 605, h: 153, double: 32, triple: 3, hr: 15, bb: 20, so: 100, hbp: 7, sb: 2, cs: 4, sec: 'LF', fld: 65, arm: 82 },
      { id: 'wardtu01', name: 'Turner Ward', pos: 'DH', bats: 'S', age: 33, pa: 324, h: 79, double: 16, triple: 3, hr: 10, bb: 29, so: 39, hbp: 4, sb: 6, cs: 3, sec: 'RF', fld: 72, arm: 80 },
    ],
    bench: [
      { id: 'polcoke01', name: 'Kevin Polcovich', pos: 'SS', bats: 'R', age: 28, pa: 238, h: 48, double: 13, triple: 0, hr: 1, bb: 16, so: 35, hbp: 6, sb: 3, cs: 2, sec: '2B', fld: 62 },
      { id: 'strando01', name: 'Doug Strange', pos: '3B', bats: 'S', age: 34, pa: 201, h: 40, double: 8, triple: 1, hr: 4, bb: 15, so: 39, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 56 },
      { id: 'martima02', name: 'Manny Martinez', pos: 'CF', bats: 'R', age: 27, pa: 196, h: 45, double: 11, triple: 3, hr: 5, bb: 9, so: 45, hbp: 2, sb: 1, cs: 3, sec: 'LF', fld: 52, arm: 54, rk: true },
      { id: 'garcifr01', name: 'Freddy Garcia', pos: '3B', bats: 'R', age: 25, pa: 193, h: 42, double: 10, triple: 1, hr: 10, bb: 17, so: 49, hbp: 2, sb: 0, cs: 2, sec: '1B', fld: 83, rk: true },
      { id: 'brownad01', name: 'Adrian Brown', pos: 'CF', bats: 'S', age: 24, pa: 165, h: 37, double: 5, triple: 1, hr: 0, bb: 11, so: 18, hbp: 2, sb: 6, cs: 2, sec: 'LF', fld: 65, arm: 75 },
    ],
    reserveBatters: [
      { id: 'smithma03', name: 'Mark Smith', pos: 'LF', bats: 'R', age: 28, pa: 144, h: 31, double: 7, triple: 0, hr: 4, bb: 13, so: 26, hbp: 2, sb: 4, cs: 1, sec: 'RF', fld: 74, arm: 54 },
      { id: 'osikke01', name: 'Keith Osik', pos: 'C', bats: 'R', age: 29, pa: 116, h: 25, double: 7, triple: 0, hr: 0, bb: 11, so: 18, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 69, arm: 75 },
      { id: 'nunezab01', name: 'Abraham Nunez', pos: 'SS', bats: 'S', age: 22, pa: 67, h: 11, double: 2, triple: 1, hr: 1, bb: 10, so: 14, hbp: 0, sb: 3, cs: 1, sec: '2B', fld: 74, rk: true },
      { id: 'brownem01', name: 'Emil Brown', pos: 'LF', bats: 'R', age: 23, pa: 41, h: 8, double: 1, triple: 0, hr: 0, bb: 3, so: 11, hbp: 2, sb: 1, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'cordofr01', name: 'Francisco Cordova', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 661, h: 209, hr: 21, bb: 64, so: 159, hbp: 6, er: 85, w: 13, l: 14, sv: 0, fld: 69 },
      { id: 'schmija01', name: 'Jason Schmidt', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 643, h: 224, hr: 22, bb: 80, so: 156, hbp: 6, er: 104, w: 11, l: 14, sv: 0, fld: 53 },
      { id: 'liebejo01', name: 'Jon Lieber', role: 'SP', throws: 'R', age: 28, g: 29, gs: 28, outs: 513, h: 181, hr: 22, bb: 41, so: 137, hbp: 2, er: 80, w: 8, l: 14, sv: 1, fld: 68 },
      { id: 'loaizes01', name: 'Esteban Loaiza', role: 'SP', throws: 'R', age: 26, g: 35, gs: 28, outs: 513, h: 195, hr: 23, bb: 51, so: 107, hbp: 7, er: 90, w: 9, l: 11, sv: 0, fld: 81 },
      { id: 'peterch01', name: 'Chris Peters', role: 'SP', throws: 'L', age: 26, g: 39, gs: 21, outs: 444, h: 144, hr: 15, bb: 58, so: 93, hbp: 4, er: 62, w: 8, l: 10, sv: 1, fld: 51 },
      { id: 'loiseri01', name: 'Rich Loiselle', role: 'CL', throws: 'R', age: 26, g: 54, gs: 0, outs: 165, h: 59, hr: 4, bb: 28, so: 49, hbp: 1, er: 21, w: 2, l: 7, sv: 19 },
      { id: 'desseel01', name: 'Elmer Dessens', role: 'RP', throws: 'R', age: 27, g: 43, gs: 5, outs: 224, h: 92, hr: 9, bb: 23, so: 43, hbp: 1, er: 48, w: 2, l: 6, sv: 0, rk: true },
      { id: 'rincori01', name: 'Ricardo Rincon', role: 'RP', throws: 'L', age: 28, g: 60, gs: 0, outs: 195, h: 52, hr: 6, bb: 28, so: 69, hbp: 1, er: 22, w: 0, l: 2, sv: 14 },
      { id: 'chrisja01', name: 'Jason Christiansen', role: 'RP', throws: 'L', age: 28, g: 60, gs: 0, outs: 194, h: 57, hr: 3, bb: 27, so: 66, hbp: 1, er: 22, w: 3, l: 3, sv: 6 },
      { id: 'willimi03', name: 'Mike Williams', role: 'RP', throws: 'R', age: 29, g: 37, gs: 1, outs: 153, h: 47, hr: 4, bb: 18, so: 41, hbp: 1, er: 21, w: 4, l: 2, sv: 0 },
      { id: 'tabakje01', name: 'Jeff Tabaka', role: 'RP', throws: 'L', age: 34, g: 37, gs: 0, outs: 152, h: 39, hr: 7, bb: 23, so: 39, hbp: 6, er: 19, w: 2, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'silvajo01', name: 'Jose Silva', role: 'SP', throws: 'R', age: 24, g: 18, gs: 18, outs: 301, h: 110, hr: 8, bb: 32, so: 66, hbp: 1, er: 52, w: 6, l: 7, sv: 0, rk: true },
      { id: 'vanpoto01', name: 'Todd Van Poppel', role: 'SP', throws: 'R', age: 26, g: 22, gs: 11, outs: 199, h: 81, hr: 11, bb: 31, so: 39, hbp: 1, er: 52, w: 2, l: 4, sv: 0 },
      { id: 'martija02', name: 'Javier Martinez', role: 'RP', throws: 'R', age: 21, g: 37, gs: 0, outs: 123, h: 39, hr: 5, bb: 34, so: 42, hbp: 4, er: 22, w: 0, l: 1, sv: 0, rk: true },
      { id: 'lawrese01', name: 'Sean Lawrence', role: 'RP', throws: 'L', age: 27, g: 7, gs: 3, outs: 59, h: 25, hr: 4, bb: 10, so: 12, hbp: 0, er: 16, w: 2, l: 1, sv: 0, rk: true },
      { id: 'mccurje01', name: 'Jeff McCurry', role: 'RP', throws: 'R', age: 28, g: 16, gs: 0, outs: 58, h: 23, hr: 4, bb: 10, so: 10, hbp: 0, er: 13, w: 1, l: 3, sv: 0 },
    ],
  },
  // STL (SLN 1998)
  {
    franchiseId: 'STL',
    season: 1998,
    batters: [
      { id: 'marreel01', name: 'Eli Marrero', pos: 'C', bats: 'R', age: 24, pa: 284, h: 62, double: 17, triple: 1, hr: 5, bb: 26, so: 46, hbp: 0, sb: 8, cs: 2, sec: '1B', fld: 77, arm: 76, rk: true },
      { id: 'mcgwima01', name: 'Mark McGwire', pos: '1B', bats: 'R', age: 34, pa: 681, h: 154, double: 24, triple: 0, hr: 66, bb: 140, so: 156, hbp: 8, sb: 2, cs: 0, sec: '3B', fld: 67 },
      { id: 'deshide01', name: 'Delino DeShields', pos: '2B', bats: 'L', age: 29, pa: 484, h: 119, double: 18, triple: 9, hr: 7, bb: 47, so: 65, hbp: 1, sb: 34, cs: 10, sec: 'SS', fld: 80 },
      { id: 'gaettga01', name: 'Gary Gaetti', pos: '3B', bats: 'R', age: 39, pa: 492, h: 119, double: 28, triple: 1, hr: 18, bb: 37, so: 72, hbp: 8, sb: 3, cs: 2, sec: '1B', fld: 77 },
      { id: 'claytro01', name: 'Royce Clayton', pos: 'SS', bats: 'R', age: 28, pa: 608, h: 144, double: 32, triple: 3, hr: 9, bb: 44, so: 94, hbp: 3, sb: 28, cs: 12, sec: '2B', fld: 77 },
      { id: 'gantro01', name: 'Ron Gant', pos: 'LF', bats: 'R', age: 33, pa: 438, h: 91, double: 16, triple: 2, hr: 21, bb: 51, so: 104, hbp: 2, sb: 10, cs: 2, sec: 'CF', fld: 61, arm: 64 },
      { id: 'lankfra01', name: 'Ray Lankford', pos: 'CF', bats: 'L', age: 31, pa: 626, h: 153, double: 38, triple: 3, hr: 30, bb: 91, so: 144, hbp: 2, sb: 27, cs: 8, sec: 'LF', fld: 71, arm: 67 },
      { id: 'jordabr01', name: 'Brian Jordan', pos: 'RF', bats: 'R', age: 31, pa: 617, h: 172, double: 33, triple: 5, hr: 21, bb: 38, so: 73, hbp: 10, sb: 19, cs: 5, sec: 'CF', fld: 72, arm: 74 },
      { id: 'mcgeewi01', name: 'Willie McGee', pos: 'DH', bats: 'S', age: 39, pa: 286, h: 75, double: 13, triple: 2, hr: 3, bb: 16, so: 51, hbp: 0, sb: 7, cs: 2, sec: 'RF', fld: 63, arm: 80 },
    ],
    bench: [
      { id: 'mabryjo01', name: 'John Mabry', pos: 'LF', bats: 'L', age: 27, pa: 413, h: 101, double: 21, triple: 0, hr: 8, bb: 31, so: 71, hbp: 2, sb: 0, cs: 2, sec: '1B', fld: 75, arm: 88 },
      { id: 'lampkto01', name: 'Tom Lampkin', pos: 'C', bats: 'L', age: 34, pa: 248, h: 51, double: 10, triple: 1, hr: 6, bb: 25, so: 30, hbp: 6, sb: 2, cs: 2, fld: 67, arm: 68 },
      { id: 'pagnoto01', name: 'Tom Pagnozzi', pos: 'C', bats: 'R', age: 35, pa: 178, h: 39, double: 9, triple: 0, hr: 3, bb: 11, so: 34, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 69, arm: 66 },
      { id: 'kellypa03', name: 'Pat Kelly', pos: '2B', bats: 'R', age: 30, pa: 170, h: 34, double: 6, triple: 0, hr: 3, bb: 14, so: 48, hbp: 2, sb: 7, cs: 1, sec: '3B', fld: 78 },
      { id: 'ordazlu01', name: 'Luis Ordaz', pos: 'SS', bats: 'R', age: 22, pa: 169, h: 32, double: 5, triple: 0, hr: 0, bb: 12, so: 18, hbp: 0, sb: 4, cs: 0, sec: '2B', fld: 78, rk: true },
    ],
    reserveBatters: [
      { id: 'huntebr01', name: 'Brian Hunter', pos: 'LF', bats: 'R', age: 30, pa: 123, h: 25, double: 8, triple: 1, hr: 4, bb: 8, so: 23, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 81, arm: 79 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: 'SS', bats: 'R', age: 22, pa: 122, h: 29, double: 3, triple: 2, hr: 1, bb: 5, so: 9, hbp: 1, sb: 2, cs: 0, sec: '2B', fld: 90, rk: true },
      { id: 'howarda02', name: 'David Howard', pos: '2B', bats: 'S', age: 31, pa: 117, h: 24, double: 3, triple: 1, hr: 1, bb: 9, so: 20, hbp: 1, sb: 1, cs: 1, sec: 'SS' },
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'LF', bats: 'L', age: 22, pa: 41, h: 15, double: 3, triple: 1, hr: 5, bb: 4, so: 10, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'stottto01', name: 'Todd Stottlemyre', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 665, h: 204, hr: 24, bb: 83, so: 201, hbp: 7, er: 94, w: 14, l: 13, sv: 0, fld: 72 },
      { id: 'merckke01', name: 'Kent Mercker', role: 'SP', throws: 'L', age: 30, g: 30, gs: 29, outs: 485, h: 184, hr: 15, bb: 62, so: 77, hbp: 3, er: 88, w: 11, l: 11, sv: 0, fld: 64 },
      { id: 'botteke01', name: 'Kent Bottenfield', role: 'SP', throws: 'R', age: 29, g: 44, gs: 17, outs: 401, h: 129, hr: 14, bb: 55, so: 101, hbp: 4, er: 61, w: 4, l: 6, sv: 4, fld: 76 },
      { id: 'morrima01', name: 'Matt Morris', role: 'SP', throws: 'R', age: 23, g: 17, gs: 17, outs: 341, h: 105, hr: 7, bb: 39, so: 78, hbp: 3, er: 37, w: 7, l: 5, sv: 0 },
      { id: 'petkoma01', name: 'Mark Petkovsek', role: 'SP', throws: 'R', age: 32, g: 48, gs: 10, outs: 317, h: 125, hr: 12, bb: 37, so: 56, hbp: 7, er: 56, w: 7, l: 4, sv: 0 },
      { id: 'aceveju01', name: 'Juan Acevedo', role: 'CL', throws: 'R', age: 28, g: 50, gs: 9, outs: 295, h: 87, hr: 8, bb: 32, so: 57, hbp: 5, er: 30, w: 8, l: 3, sv: 15 },
      { id: 'frascjo01', name: 'John Frascatore', role: 'RP', throws: 'R', age: 28, g: 69, gs: 0, outs: 287, h: 93, hr: 9, bb: 37, so: 56, hbp: 4, er: 38, w: 3, l: 4, sv: 0 },
      { id: 'crousri01', name: 'Rich Croushore', role: 'RP', throws: 'R', age: 27, g: 41, gs: 0, outs: 163, h: 44, hr: 6, bb: 29, so: 47, hbp: 4, er: 30, w: 0, l: 3, sv: 8, rk: true },
      { id: 'kingcu01', name: 'Curtis King', role: 'RP', throws: 'R', age: 27, g: 36, gs: 0, outs: 153, h: 54, hr: 4, bb: 19, so: 26, hbp: 3, er: 18, w: 2, l: 0, sv: 2, rk: true },
      { id: 'brantje01', name: 'Jeff Brantley', role: 'RP', throws: 'R', age: 34, g: 48, gs: 0, outs: 152, h: 39, hr: 10, bb: 20, so: 51, hbp: 1, er: 21, w: 0, l: 5, sv: 14 },
      { id: 'paintla01', name: 'Lance Painter', role: 'RP', throws: 'L', age: 30, g: 65, gs: 0, outs: 142, h: 44, hr: 6, bb: 26, so: 39, hbp: 3, er: 24, w: 4, l: 0, sv: 1 },
    ],
    reservePitchers: [
      { id: 'osbordo01', name: 'Donovan Osborne', role: 'SP', throws: 'L', age: 29, g: 14, gs: 14, outs: 251, h: 84, hr: 10, bb: 23, so: 57, hbp: 1, er: 38, w: 5, l: 4, sv: 0 },
      { id: 'aybarma01', name: 'Manny Aybar', role: 'SP', throws: 'R', age: 26, g: 20, gs: 14, outs: 244, h: 87, hr: 7, bb: 40, so: 55, hbp: 3, er: 49, w: 6, l: 6, sv: 0 },
      { id: 'busbymi01', name: 'Mike Busby', role: 'RP', throws: 'R', age: 25, g: 26, gs: 2, outs: 138, h: 50, hr: 4, bb: 15, so: 30, hbp: 4, er: 27, w: 5, l: 2, sv: 0, rk: true },
      { id: 'politcl01', name: 'Cliff Politte', role: 'RP', throws: 'R', age: 24, g: 8, gs: 8, outs: 111, h: 45, hr: 6, bb: 18, so: 22, hbp: 1, er: 26, w: 2, l: 3, sv: 0, rk: true },
      { id: 'jimenjo01', name: 'Jose Jimenez', role: 'RP', throws: 'R', age: 24, g: 4, gs: 3, outs: 64, h: 22, hr: 0, bb: 8, so: 12, hbp: 0, er: 7, w: 3, l: 0, sv: 0, rk: true },
    ],
  },
  // ARI (ARI 1998)
  {
    franchiseId: 'ARI',
    season: 1998,
    batters: [
      { id: 'stinnke01', name: 'Kelly Stinnett', pos: 'C', bats: 'R', age: 28, pa: 318, h: 70, double: 15, triple: 1, hr: 10, bb: 34, so: 75, hbp: 6, sb: 0, cs: 1, sec: '1B', fld: 71, arm: 76 },
      { id: 'leetr01', name: 'Travis Lee', pos: '1B', bats: 'L', age: 23, pa: 630, h: 151, double: 20, triple: 2, hr: 22, bb: 67, so: 123, hbp: 0, sb: 8, cs: 1, sec: '3B', fld: 75, rk: true },
      { id: 'foxan01', name: 'Andy Fox', pos: '2B', bats: 'L', age: 27, pa: 564, h: 133, double: 20, triple: 5, hr: 8, bb: 46, so: 95, hbp: 16, sb: 16, cs: 7, sec: '3B', fld: 56 },
      { id: 'willima04', name: 'Matt Williams', pos: '3B', bats: 'R', age: 32, pa: 557, h: 138, double: 26, triple: 2, hr: 24, bb: 39, so: 100, hbp: 4, sb: 7, cs: 2, sec: 'SS', fld: 90 },
      { id: 'bellja01', name: 'Jay Bell', pos: 'SS', bats: 'R', age: 32, pa: 645, h: 147, double: 29, triple: 4, hr: 19, bb: 73, so: 117, hbp: 6, sb: 6, cs: 5, sec: '2B', fld: 69 },
      { id: 'delluda01', name: 'David Dellucci', pos: 'LF', bats: 'L', age: 24, pa: 453, h: 107, double: 19, triple: 11, hr: 5, bb: 34, so: 103, hbp: 4, sb: 3, cs: 5, sec: 'RF', fld: 83, arm: 61, rk: true },
      { id: 'whitede03', name: 'Devon White', pos: 'CF', bats: 'S', age: 35, pa: 627, h: 152, double: 32, triple: 2, hr: 19, bb: 46, so: 108, hbp: 10, sb: 23, cs: 8, sec: 'RF', fld: 80, arm: 59 },
      { id: 'garcika01', name: 'Karim Garcia', pos: 'RF', bats: 'L', age: 22, pa: 354, h: 71, double: 9, triple: 7, hr: 9, bb: 20, so: 81, hbp: 0, sb: 5, cs: 4, sec: 'LF', fld: 75, arm: 70, rk: true },
      { id: 'bredebr01', name: 'Brent Brede', pos: 'DH', bats: 'L', age: 26, pa: 238, h: 52, double: 10, triple: 2, hr: 2, bb: 24, so: 43, hbp: 2, sb: 3, cs: 1, sec: 'RF', fld: 57, arm: 64 },
    ],
    bench: [
      { id: 'batisto01', name: 'Tony Batista', pos: '2B', bats: 'R', age: 24, pa: 318, h: 76, double: 15, triple: 1, hr: 13, bb: 20, so: 52, hbp: 3, sb: 3, cs: 2, sec: 'SS', fld: 78 },
      { id: 'benitya01', name: 'Yamil Benitez', pos: 'LF', bats: 'R', age: 25, pa: 225, h: 47, double: 7, triple: 1, hr: 9, bb: 13, so: 49, hbp: 3, sb: 2, cs: 2, sec: 'RF', fld: 85, arm: 75 },
      { id: 'fabrejo01', name: 'Jorge Fabregas', pos: 'C', bats: 'L', age: 28, pa: 201, h: 45, double: 5, triple: 0, hr: 3, bb: 11, so: 26, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 87 },
      { id: 'milleda02', name: 'Damian Miller', pos: 'C', bats: 'R', age: 28, pa: 183, h: 48, double: 12, triple: 2, hr: 3, bb: 10, so: 41, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 64, arm: 72, rk: true },
      { id: 'stankan01', name: 'Andy Stankiewicz', pos: '2B', bats: 'R', age: 33, pa: 155, h: 31, double: 7, triple: 0, hr: 0, bb: 7, so: 30, hbp: 2, sb: 1, cs: 0, sec: 'SS', fld: 67 },
    ],
    reserveBatters: [
      { id: 'klassda01', name: 'Danny Klassen', pos: '2B', bats: 'R', age: 22, pa: 118, h: 21, double: 2, triple: 1, hr: 3, bb: 9, so: 33, hbp: 1, sb: 1, cs: 1, sec: 'SS', fld: 67, rk: true },
    ],
    pitchers: [
      { id: 'benesan01', name: 'Andy Benes', role: 'SP', throws: 'R', age: 30, g: 34, gs: 34, outs: 694, h: 214, hr: 22, bb: 77, so: 182, hbp: 6, er: 96, w: 14, l: 13, sv: 0, fld: 73 },
      { id: 'anderbr02', name: 'Brian Anderson', role: 'SP', throws: 'L', age: 26, g: 32, gs: 32, outs: 624, h: 222, hr: 37, bb: 29, so: 94, hbp: 3, er: 101, w: 12, l: 13, sv: 0, fld: 80 },
      { id: 'blairwi01', name: 'Willie Blair', role: 'SP', throws: 'R', age: 32, g: 34, gs: 25, outs: 526, h: 187, hr: 26, bb: 56, so: 96, hbp: 5, er: 92, w: 5, l: 16, sv: 0, fld: 79 },
      { id: 'daalom01', name: 'Omar Daal', role: 'SP', throws: 'L', age: 26, g: 33, gs: 23, outs: 488, h: 155, hr: 14, bb: 53, so: 130, hbp: 3, er: 66, w: 8, l: 12, sv: 0, fld: 76 },
      { id: 'telemam01', name: 'Amaury Telemaco', role: 'SP', throws: 'R', age: 24, g: 41, gs: 18, outs: 446, h: 155, hr: 20, bb: 45, so: 85, hbp: 4, er: 73, w: 7, l: 10, sv: 0, fld: 71 },
      { id: 'olsongr01', name: 'Gregg Olson', role: 'CL', throws: 'R', age: 31, g: 64, gs: 0, outs: 206, h: 62, hr: 5, bb: 30, so: 49, hbp: 1, er: 29, w: 3, l: 4, sv: 30 },
      { id: 'sodowcl01', name: 'Clint Sodowsky', role: 'RP', throws: 'R', age: 25, g: 45, gs: 6, outs: 233, h: 84, hr: 7, bb: 44, so: 50, hbp: 6, er: 47, w: 3, l: 6, sv: 0 },
      { id: 'bankswi01', name: 'Willie Banks', role: 'RP', throws: 'R', age: 29, g: 42, gs: 0, outs: 174, h: 52, hr: 5, bb: 36, so: 40, hbp: 2, er: 29, w: 2, l: 3, sv: 1 },
      { id: 'embreal01', name: 'Alan Embree', role: 'RP', throws: 'L', age: 28, g: 55, gs: 0, outs: 161, h: 52, hr: 6, bb: 25, so: 48, hbp: 1, er: 24, w: 4, l: 2, sv: 1 },
      { id: 'sprinru01', name: 'Russ Springer', role: 'RP', throws: 'R', age: 29, g: 48, gs: 0, outs: 158, h: 52, hr: 5, bb: 27, so: 60, hbp: 2, er: 25, w: 5, l: 4, sv: 0 },
      { id: 'rodrife01', name: 'Felix Rodriguez', role: 'RP', throws: 'R', age: 25, g: 43, gs: 0, outs: 132, h: 44, hr: 4, bb: 28, so: 34, hbp: 3, er: 26, w: 0, l: 2, sv: 5 },
    ],
    reservePitchers: [
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 23, g: 17, gs: 14, outs: 236, h: 93, hr: 11, bb: 24, so: 48, hbp: 2, er: 50, w: 1, l: 7, sv: 0 },
      { id: 'chouibo01', name: 'Bobby Chouinard', role: 'RP', throws: 'R', age: 26, g: 27, gs: 2, outs: 124, h: 46, hr: 5, bb: 14, so: 25, hbp: 1, er: 21, w: 0, l: 2, sv: 0 },
      { id: 'wolcobo01', name: 'Bob Wolcott', role: 'RP', throws: 'R', age: 24, g: 6, gs: 6, outs: 99, h: 38, hr: 6, bb: 11, so: 18, hbp: 1, er: 22, w: 1, l: 3, sv: 0 },
      { id: 'adamsjo02', name: 'Joel Adamson', role: 'RP', throws: 'L', age: 26, g: 5, gs: 5, outs: 69, h: 26, hr: 4, bb: 8, so: 17, hbp: 2, er: 14, w: 0, l: 3, sv: 0 },
      { id: 'browsc01', name: 'Scott Brow', role: 'RP', throws: 'R', age: 29, g: 17, gs: 0, outs: 64, h: 23, hr: 2, bb: 14, so: 13, hbp: 0, er: 15, w: 1, l: 0, sv: 0 },
    ],
  },
  // COL (COL 1998)
  {
    franchiseId: 'COL',
    season: 1998,
    batters: [
      { id: 'manwaki01', name: 'Kirt Manwaring', pos: 'C', bats: 'R', age: 32, pa: 335, h: 70, double: 10, triple: 3, hr: 2, bb: 32, so: 57, hbp: 3, sb: 1, cs: 4, sec: '1B', fld: 68, arm: 70 },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 24, pa: 595, h: 166, double: 34, triple: 1, hr: 25, bb: 52, so: 55, hbp: 5, sb: 3, cs: 3, sec: 'LF', fld: 87, rk: true },
      { id: 'lansimi01', name: 'Mike Lansing', pos: '2B', bats: 'R', age: 30, pa: 638, h: 162, double: 41, triple: 2, hr: 14, bb: 41, so: 88, hbp: 6, sb: 12, cs: 4, sec: '3B', fld: 90 },
      { id: 'castivi02', name: 'Vinny Castilla', pos: '3B', bats: 'R', age: 30, pa: 697, h: 201, double: 29, triple: 3, hr: 44, bb: 41, so: 97, hbp: 7, sb: 4, cs: 6, sec: 'SS', fld: 77 },
      { id: 'perezne01', name: 'Neifi Perez', pos: 'SS', bats: 'S', age: 25, pa: 712, h: 179, double: 26, triple: 12, hr: 9, bb: 39, so: 75, hbp: 1, sb: 6, cs: 6, sec: '2B', fld: 87 },
      { id: 'bicheda01', name: 'Dante Bichette', pos: 'LF', bats: 'R', age: 34, pa: 695, h: 210, double: 43, triple: 2, hr: 26, bb: 33, so: 90, hbp: 3, sb: 15, cs: 6, sec: 'RF', fld: 71, arm: 76 },
      { id: 'burksel01', name: 'Ellis Burks', pos: 'CF', bats: 'R', age: 33, pa: 582, h: 154, double: 29, triple: 5, hr: 29, bb: 57, so: 103, hbp: 5, sb: 14, cs: 6, sec: 'LF', fld: 53, arm: 66 },
      { id: 'walkela01', name: 'Larry Walker', pos: 'RF', bats: 'L', age: 31, pa: 524, h: 161, double: 41, triple: 3, hr: 30, bb: 60, so: 69, hbp: 8, sb: 21, cs: 5, sec: '1B', fld: 72, arm: 70 },
      { id: 'colbrgr01', name: 'Greg Colbrunn', pos: 'DH', bats: 'R', age: 28, pa: 180, h: 49, double: 10, triple: 1, hr: 4, bb: 8, so: 30, hbp: 3, sb: 2, cs: 2, sec: '1B', fld: 77 },
    ],
    bench: [
      { id: 'reedje02', name: 'Jeff Reed', pos: 'C', bats: 'L', age: 35, pa: 303, h: 76, double: 15, triple: 1, hr: 11, bb: 36, so: 55, hbp: 1, sb: 1, cs: 1, fld: 72, arm: 72 },
      { id: 'goodwcu01', name: 'Curtis Goodwin', pos: 'CF', bats: 'L', age: 25, pa: 186, h: 40, double: 7, triple: 0, hr: 1, bb: 16, so: 37, hbp: 0, sb: 11, cs: 5, sec: 'LF', fld: 79, arm: 60 },
      { id: 'vandejo02', name: 'John Vander Wal', pos: 'RF', bats: 'L', age: 32, pa: 152, h: 32, double: 9, triple: 1, hr: 4, bb: 19, so: 38, hbp: 0, sb: 1, cs: 1, sec: 'LF' },
      { id: 'batesja01', name: 'Jason Bates', pos: '2B', bats: 'S', age: 27, pa: 82, h: 15, double: 4, triple: 0, hr: 1, bb: 9, so: 17, hbp: 1, sb: 0, cs: 0, sec: 'SS' },
      { id: 'barryje01', name: 'Jeff Barry', pos: 'CF', bats: 'S', age: 28, pa: 37, h: 6, double: 1, triple: 0, hr: 0, bb: 2, so: 11, hbp: 0, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'kileda01', name: 'Darryl Kile', role: 'SP', throws: 'R', age: 29, g: 36, gs: 35, outs: 691, h: 236, hr: 23, bb: 95, so: 184, hbp: 9, er: 108, w: 13, l: 17, sv: 0, fld: 73 },
      { id: 'astacpe01', name: 'Pedro Astacio', role: 'SP', throws: 'R', age: 29, g: 35, gs: 34, outs: 628, h: 233, hr: 32, bb: 71, so: 168, hbp: 14, er: 122, w: 13, l: 14, sv: 0, fld: 80 },
      { id: 'wrighja01', name: 'Jamey Wright', role: 'SP', throws: 'R', age: 23, g: 34, gs: 34, outs: 619, h: 243, hr: 24, bb: 94, so: 85, hbp: 12, er: 131, w: 9, l: 14, sv: 0, fld: 78 },
      { id: 'thomsjo01', name: 'John Thomson', role: 'SP', throws: 'R', age: 24, g: 26, gs: 26, outs: 483, h: 178, hr: 18, bb: 49, so: 104, hbp: 3, er: 84, w: 8, l: 11, sv: 0, fld: 71 },
      { id: 'jonesbo04', name: 'Bobby Jones', role: 'SP', throws: 'L', age: 26, g: 35, gs: 20, outs: 424, h: 157, hr: 12, bb: 67, so: 102, hbp: 5, er: 85, w: 7, l: 8, sv: 0, fld: 62, rk: true },
      { id: 'dipotje01', name: 'Jerry Dipoto', role: 'CL', throws: 'R', age: 30, g: 68, gs: 0, outs: 214, h: 69, hr: 6, bb: 26, so: 49, hbp: 3, er: 31, w: 3, l: 4, sv: 19 },
      { id: 'veresda01', name: 'Dave Veres', role: 'RP', throws: 'R', age: 31, g: 63, gs: 0, outs: 229, h: 72, hr: 7, bb: 29, so: 68, hbp: 3, er: 27, w: 3, l: 1, sv: 8 },
      { id: 'leskacu01', name: 'Curt Leskanic', role: 'RP', throws: 'R', age: 30, g: 66, gs: 0, outs: 227, h: 77, hr: 10, bb: 37, so: 63, hbp: 1, er: 43, w: 6, l: 4, sv: 2 },
      { id: 'dejeami01', name: 'Mike DeJean', role: 'RP', throws: 'R', age: 27, g: 59, gs: 1, outs: 223, h: 79, hr: 4, bb: 25, so: 32, hbp: 2, er: 28, w: 3, l: 1, sv: 2 },
      { id: 'mcelrch01', name: 'Chuck McElroy', role: 'RP', throws: 'L', age: 30, g: 78, gs: 0, outs: 205, h: 67, hr: 4, bb: 24, so: 60, hbp: 1, er: 26, w: 6, l: 4, sv: 2 },
      { id: 'munozmi01', name: 'Mike Munoz', role: 'RP', throws: 'L', age: 32, g: 40, gs: 0, outs: 124, h: 52, hr: 3, bb: 15, so: 28, hbp: 1, er: 26, w: 2, l: 2, sv: 3 },
    ],
    reservePitchers: [
      { id: 'thompma01', name: 'Mark Thompson', role: 'RP', throws: 'R', age: 27, g: 6, gs: 6, outs: 70, h: 32, hr: 6, bb: 12, so: 14, hbp: 3, er: 18, w: 1, l: 2, sv: 0 },
      { id: 'brownma04', name: 'Mark Brownson', role: 'RP', throws: 'R', age: 23, g: 2, gs: 2, outs: 40, h: 16, hr: 2, bb: 2, so: 8, hbp: 1, er: 7, w: 1, l: 0, sv: 0, rk: true },
      { id: 'wainhda01', name: 'Dave Wainhouse', role: 'RP', throws: 'R', age: 30, g: 10, gs: 0, outs: 33, h: 14, hr: 1, bb: 6, so: 7, hbp: 1, er: 8, w: 1, l: 0, sv: 0 },
      { id: 'saipemi01', name: 'Mike Saipe', role: 'RP', throws: 'R', age: 24, g: 2, gs: 2, outs: 30, h: 22, hr: 5, bb: 0, so: 2, hbp: 2, er: 12, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // LAD (LAN 1998)
  {
    franchiseId: 'LAD',
    season: 1998,
    batters: [
      { id: 'johnsch04', name: 'Charles Johnson', pos: 'C', bats: 'R', age: 26, pa: 506, h: 103, double: 21, triple: 1, hr: 19, bb: 51, so: 121, hbp: 2, sb: 0, cs: 2, sec: '1B', fld: 74, arm: 79 },
      { id: 'karroer01', name: 'Eric Karros', pos: '1B', bats: 'R', age: 30, pa: 564, h: 141, double: 22, triple: 1, hr: 25, bb: 47, so: 95, hbp: 2, sb: 9, cs: 3, sec: '3B', fld: 73 },
      { id: 'younger01', name: 'Eric Young', pos: '2B', bats: 'R', age: 31, pa: 513, h: 130, double: 23, triple: 3, hr: 7, bb: 46, so: 33, hbp: 8, sb: 38, cs: 12, sec: 'SS', fld: 68 },
      { id: 'bonilbo01', name: 'Bobby Bonilla', pos: '3B', bats: 'S', age: 35, pa: 380, h: 92, double: 17, triple: 2, hr: 12, bb: 42, so: 55, hbp: 2, sb: 2, cs: 3, sec: '1B', fld: 53 },
      { id: 'vizcajo01', name: 'Jose Vizcaino', pos: 'SS', bats: 'S', age: 30, pa: 267, h: 65, double: 8, triple: 2, hr: 2, bb: 18, so: 36, hbp: 1, sb: 5, cs: 3, sec: '2B', fld: 63 },
      { id: 'lukema01', name: 'Matt Luke', pos: 'LF', bats: 'L', age: 27, pa: 259, h: 56, double: 12, triple: 1, hr: 12, bb: 17, so: 60, hbp: 1, sb: 2, cs: 1, sec: '1B', fld: 77, arm: 83, rk: true },
      { id: 'mondera01', name: 'Raul Mondesi', pos: 'CF', bats: 'R', age: 27, pa: 617, h: 169, double: 32, triple: 5, hr: 28, bb: 34, so: 107, hbp: 4, sb: 20, cs: 11, sec: 'RF', fld: 47, arm: 65 },
      { id: 'sheffga01', name: 'Gary Sheffield', pos: 'RF', bats: 'R', age: 29, pa: 549, h: 123, double: 25, triple: 1, hr: 24, bb: 105, so: 57, hbp: 10, sb: 16, cs: 7, sec: 'LF', fld: 63, arm: 71 },
      { id: 'konerpa01', name: 'Paul Konerko', pos: 'DH', bats: 'R', age: 22, pa: 239, h: 47, double: 4, triple: 0, hr: 7, bb: 16, so: 40, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 80, rk: true },
    ],
    bench: [
      { id: 'cedenro01', name: 'Roger Cedeno', pos: 'LF', bats: 'S', age: 23, pa: 271, h: 60, double: 12, triple: 1, hr: 3, bb: 28, so: 55, hbp: 1, sb: 8, cs: 2, sec: 'CF', fld: 57, arm: 71 },
      { id: 'castrju01', name: 'Juan Castro', pos: 'SS', bats: 'R', age: 26, pa: 246, h: 41, double: 7, triple: 1, hr: 1, bb: 16, so: 42, hbp: 0, sb: 0, cs: 0, sec: '2B', fld: 62 },
      { id: 'hubbatr01', name: 'Trent Hubbard', pos: 'CF', bats: 'R', age: 34, pa: 235, h: 60, double: 10, triple: 1, hr: 6, bb: 19, so: 48, hbp: 3, sb: 9, cs: 4, sec: 'LF', fld: 56, arm: 68 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 19, pa: 214, h: 42, double: 9, triple: 0, hr: 7, bb: 14, so: 37, hbp: 3, sb: 3, cs: 1, sec: '1B', fld: 74, rk: true },
      { id: 'eisenji01', name: 'Jim Eisenreich', pos: 'LF', bats: 'L', age: 39, pa: 208, h: 51, double: 9, triple: 1, hr: 1, bb: 17, so: 25, hbp: 0, sb: 4, cs: 0, sec: 'RF', fld: 70, arm: 65 },
    ],
    reserveBatters: [
      { id: 'hollato01', name: 'Todd Hollandsworth', pos: 'LF', bats: 'L', age: 25, pa: 187, h: 46, double: 9, triple: 2, hr: 3, bb: 11, so: 37, hbp: 1, sb: 5, cs: 3, sec: 'CF', fld: 69, arm: 59 },
      { id: 'princto01', name: 'Tom Prince', pos: 'C', bats: 'R', age: 33, pa: 92, h: 17, double: 5, triple: 0, hr: 1, bb: 6, so: 19, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 81, arm: 89 },
      { id: 'howarth01', name: 'Thomas Howard', pos: 'CF', bats: 'S', age: 33, pa: 79, h: 18, double: 4, triple: 1, hr: 1, bb: 5, so: 13, hbp: 1, sb: 1, cs: 1, sec: 'LF', fld: 67, arm: 87 },
    ],
    pitchers: [
      { id: 'parkch01', name: 'Chan Ho Park', role: 'SP', throws: 'R', age: 25, g: 34, gs: 34, outs: 662, h: 189, hr: 20, bb: 97, so: 199, hbp: 10, er: 89, w: 15, l: 9, sv: 0, fld: 69 },
      { id: 'mlickda01', name: 'Dave Mlicki', role: 'SP', throws: 'R', age: 30, g: 30, gs: 30, outs: 544, h: 186, hr: 21, bb: 66, so: 133, hbp: 7, er: 85, w: 8, l: 7, sv: 0, fld: 76 },
      { id: 'dreifda01', name: 'Darren Dreifort', role: 'SP', throws: 'R', age: 26, g: 32, gs: 26, outs: 540, h: 164, hr: 11, bb: 66, so: 171, hbp: 8, er: 77, w: 8, l: 12, sv: 0, fld: 86 },
      { id: 'valdeis01', name: 'Ismael Valdez', role: 'SP', throws: 'R', age: 24, g: 27, gs: 27, outs: 522, h: 168, hr: 16, bb: 54, so: 128, hbp: 2, er: 67, w: 11, l: 10, sv: 0, fld: 71 },
      { id: 'bohanbr01', name: 'Brian Bohanon', role: 'SP', throws: 'L', age: 29, g: 39, gs: 18, outs: 455, h: 130, hr: 14, bb: 58, so: 108, hbp: 10, er: 52, w: 7, l: 11, sv: 0, fld: 85 },
      { id: 'radinsc01', name: 'Scott Radinsky', role: 'CL', throws: 'L', age: 30, g: 62, gs: 0, outs: 185, h: 61, hr: 4, bb: 21, so: 47, hbp: 2, er: 19, w: 6, l: 6, sv: 13 },
      { id: 'osunaan01', name: 'Antonio Osuna', role: 'RP', throws: 'R', age: 25, g: 54, gs: 0, outs: 194, h: 51, hr: 7, bb: 27, so: 72, hbp: 2, er: 20, w: 7, l: 1, sv: 6 },
      { id: 'bruskji01', name: 'Jim Bruske', role: 'RP', throws: 'R', age: 33, g: 42, gs: 1, outs: 180, h: 62, hr: 5, bb: 27, so: 41, hbp: 3, er: 24, w: 4, l: 0, sv: 1 },
      { id: 'guthrma01', name: 'Mark Guthrie', role: 'RP', throws: 'L', age: 32, g: 53, gs: 0, outs: 162, h: 55, hr: 5, bb: 23, so: 40, hbp: 1, er: 24, w: 2, l: 1, sv: 0 },
      { id: 'clontbr01', name: 'Brad Clontz', role: 'RP', throws: 'R', age: 27, g: 20, gs: 0, outs: 71, h: 23, hr: 3, bb: 10, so: 17, hbp: 1, er: 13, w: 2, l: 0, sv: 0 },
      { id: 'lankffr01', name: 'Frank Lankford', role: 'RP', throws: 'R', age: 27, g: 12, gs: 0, outs: 59, h: 23, hr: 2, bb: 7, so: 7, hbp: 2, er: 13, w: 0, l: 2, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'martira02', name: 'Ramon Martinez', role: 'SP', throws: 'R', age: 30, g: 15, gs: 15, outs: 305, h: 83, hr: 8, bb: 45, so: 85, hbp: 4, er: 35, w: 7, l: 3, sv: 0 },
      { id: 'malonse01', name: 'Sean Maloney', role: 'RP', throws: 'R', age: 27, g: 11, gs: 0, outs: 38, h: 13, hr: 2, bb: 5, so: 10, hbp: 2, er: 7, w: 0, l: 1, sv: 0, rk: true },
      { id: 'hallda01', name: 'Darren Hall', role: 'RP', throws: 'R', age: 33, g: 11, gs: 0, outs: 34, h: 14, hr: 1, bb: 6, so: 9, hbp: 0, er: 6, w: 0, l: 3, sv: 0 },
      { id: 'juddmi01', name: 'Mike Judd', role: 'RP', throws: 'R', age: 23, g: 7, gs: 0, outs: 34, h: 19, hr: 4, bb: 8, so: 15, hbp: 1, er: 17, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // SDP (SDN 1998)
  {
    franchiseId: 'SDP',
    season: 1998,
    batters: [
      { id: 'hernaca01', name: 'Carlos Hernandez', pos: 'C', bats: 'R', age: 31, pa: 417, h: 106, double: 16, triple: 1, hr: 9, bb: 15, so: 59, hbp: 7, sb: 2, cs: 3, sec: '1B', fld: 68, arm: 66 },
      { id: 'joynewa01', name: 'Wally Joyner', pos: '1B', bats: 'L', age: 36, pa: 494, h: 132, double: 29, triple: 1, hr: 11, bb: 53, so: 50, hbp: 2, sb: 2, cs: 3, fld: 71 },
      { id: 'verasqu01', name: 'Quilvio Veras', pos: '2B', bats: 'S', age: 27, pa: 612, h: 137, double: 23, triple: 2, hr: 5, bb: 80, so: 80, hbp: 6, sb: 26, cs: 11, sec: 'SS', fld: 84 },
      { id: 'caminke01', name: 'Ken Caminiti', pos: '3B', bats: 'S', age: 35, pa: 535, h: 126, double: 28, triple: 0, hr: 28, bb: 71, so: 104, hbp: 3, sb: 8, cs: 2, fld: 56 },
      { id: 'gomezch02', name: 'Chris Gomez', pos: 'SS', bats: 'R', age: 27, pa: 515, h: 118, double: 25, triple: 2, hr: 4, bb: 50, so: 91, hbp: 5, sb: 3, cs: 4, sec: '2B', fld: 67 },
      { id: 'vaughgr01', name: 'Greg Vaughn', pos: 'LF', bats: 'R', age: 32, pa: 661, h: 146, double: 24, triple: 3, hr: 44, bb: 83, so: 137, hbp: 5, sb: 11, cs: 4, sec: 'RF', fld: 69, arm: 62 },
      { id: 'finlest01', name: 'Steve Finley', pos: 'CF', bats: 'L', age: 33, pa: 674, h: 161, double: 37, triple: 6, hr: 22, bb: 47, so: 98, hbp: 3, sb: 15, cs: 4, sec: 'RF', fld: 64, arm: 74 },
      { id: 'gwynnto01', name: 'Tony Gwynn', pos: 'RF', bats: 'L', age: 38, pa: 505, h: 159, double: 35, triple: 1, hr: 13, bb: 35, so: 19, hbp: 2, sb: 7, cs: 3, sec: 'CF', fld: 49, arm: 64 },
      { id: 'leyriji01', name: 'Jim Leyritz', pos: 'DH', bats: 'R', age: 34, pa: 328, h: 75, double: 12, triple: 0, hr: 10, bb: 41, so: 66, hbp: 7, sb: 1, cs: 0, sec: 'C' },
    ],
    bench: [
      { id: 'sweenma01', name: 'Mark Sweeney', pos: 'RF', bats: 'L', age: 28, pa: 222, h: 48, double: 8, triple: 2, hr: 2, bb: 27, so: 36, hbp: 1, sb: 2, cs: 2, sec: '1B', fld: 66, arm: 50 },
      { id: 'sheetan01', name: 'Andy Sheets', pos: 'SS', bats: 'R', age: 26, pa: 219, h: 46, double: 6, triple: 2, hr: 6, bb: 19, so: 66, hbp: 1, sb: 6, cs: 1, sec: '3B', fld: 70 },
      { id: 'riverru01', name: 'Ruben Rivera', pos: 'RF', bats: 'R', age: 24, pa: 204, h: 38, double: 8, triple: 2, hr: 5, bb: 27, so: 54, hbp: 2, sb: 7, cs: 2, sec: 'LF', fld: 64, arm: 66, rk: true },
      { id: 'myersgr01', name: 'Greg Myers', pos: 'C', bats: 'L', age: 32, pa: 189, h: 45, double: 11, triple: 1, hr: 4, bb: 15, so: 32, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 70, arm: 73 },
      { id: 'giovaed01', name: 'Ed Giovanola', pos: '3B', bats: 'L', age: 29, pa: 166, h: 32, double: 3, triple: 2, hr: 1, bb: 21, so: 22, hbp: 0, sb: 1, cs: 2, sec: '2B', fld: 92, rk: true },
    ],
    reserveBatters: [
      { id: 'cianfar01', name: 'Archi Cianfrocco', pos: '1B', bats: 'R', age: 31, pa: 80, h: 16, double: 4, triple: 0, hr: 1, bb: 6, so: 24, hbp: 1, sb: 2, cs: 0, sec: '3B' },
      { id: 'moutoja01', name: 'James Mouton', pos: 'LF', bats: 'R', age: 29, pa: 71, h: 14, double: 3, triple: 0, hr: 1, bb: 7, so: 11, hbp: 0, sb: 4, cs: 2, sec: 'RF', fld: 67, arm: 69 },
      { id: 'ariasge01', name: 'George Arias', pos: '3B', bats: 'R', age: 26, pa: 41, h: 9, double: 1, triple: 0, hr: 1, bb: 2, so: 9, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'brownke01', name: 'Kevin Brown', role: 'SP', throws: 'R', age: 33, g: 36, gs: 35, outs: 771, h: 223, hr: 9, bb: 54, so: 231, hbp: 13, er: 68, w: 18, l: 7, sv: 0, fld: 81 },
      { id: 'ashbyan01', name: 'Andy Ashby', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 680, h: 226, hr: 22, bb: 56, so: 152, hbp: 6, er: 90, w: 17, l: 9, sv: 0, fld: 73 },
      { id: 'hamiljo02', name: 'Joey Hamilton', role: 'SP', throws: 'R', age: 27, g: 34, gs: 34, outs: 652, h: 222, hr: 19, bb: 95, so: 154, hbp: 10, er: 104, w: 13, l: 13, sv: 0, fld: 68 },
      { id: 'hitchst01', name: 'Sterling Hitchcock', role: 'SP', throws: 'L', age: 27, g: 39, gs: 27, outs: 529, h: 180, hr: 27, bb: 54, so: 134, hbp: 7, er: 87, w: 9, l: 7, sv: 1, fld: 63 },
      { id: 'langsma01', name: 'Mark Langston', role: 'SP', throws: 'L', age: 37, g: 22, gs: 16, outs: 244, h: 101, hr: 12, bb: 41, so: 56, hbp: 1, er: 52, w: 4, l: 6, sv: 0 },
      { id: 'hoffmtr01', name: 'Trevor Hoffman', role: 'CL', throws: 'R', age: 30, g: 66, gs: 0, outs: 219, h: 44, hr: 5, bb: 22, so: 90, hbp: 1, er: 16, w: 4, l: 2, sv: 53 },
      { id: 'boehrbr01', name: 'Brian Boehringer', role: 'RP', throws: 'R', age: 29, g: 56, gs: 1, outs: 229, h: 73, hr: 9, bb: 46, so: 72, hbp: 3, er: 35, w: 5, l: 2, sv: 0 },
      { id: 'micelda01', name: 'Dan Miceli', role: 'RP', throws: 'R', age: 27, g: 67, gs: 0, outs: 218, h: 67, hr: 9, bb: 30, so: 65, hbp: 1, er: 34, w: 10, l: 5, sv: 2 },
      { id: 'walldo01', name: 'Donne Wall', role: 'RP', throws: 'R', age: 30, g: 46, gs: 1, outs: 211, h: 65, hr: 8, bb: 25, so: 48, hbp: 2, er: 29, w: 5, l: 4, sv: 1 },
      { id: 'sandesc02', name: 'Scott Sanders', role: 'RP', throws: 'R', age: 29, g: 26, gs: 2, outs: 121, h: 46, hr: 7, bb: 16, so: 38, hbp: 1, er: 26, w: 3, l: 3, sv: 0 },
      { id: 'spencst02', name: 'Stan Spencer', role: 'RP', throws: 'R', age: 28, g: 6, gs: 5, outs: 92, h: 29, hr: 5, bb: 4, so: 31, hbp: 1, er: 16, w: 1, l: 0, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'ramirro01', name: 'Roberto Ramirez', role: 'RP', throws: 'L', age: 26, g: 21, gs: 0, outs: 44, h: 12, hr: 4, bb: 12, so: 17, hbp: 0, er: 10, w: 1, l: 0, sv: 0, rk: true },
      { id: 'clemema01', name: 'Matt Clement', role: 'RP', throws: 'R', age: 23, g: 4, gs: 2, outs: 41, h: 15, hr: 0, bb: 7, so: 13, hbp: 0, er: 7, w: 2, l: 0, sv: 0, rk: true },
    ],
  },
  // SFG (SFN 1998)
  {
    franchiseId: 'SFG',
    season: 1998,
    batters: [
      { id: 'johnsbr01', name: 'Brian Johnson', pos: 'C', bats: 'R', age: 30, pa: 346, h: 78, double: 11, triple: 2, hr: 13, bb: 22, so: 57, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 73, arm: 71 },
      { id: 'snowjt01', name: 'J. T. Snow', pos: '1B', bats: 'L', age: 30, pa: 500, h: 113, double: 26, triple: 1, hr: 17, bb: 62, so: 87, hbp: 1, sb: 2, cs: 3, sec: '3B', fld: 80 },
      { id: 'kentje01', name: 'Jeff Kent', pos: '2B', bats: 'R', age: 30, pa: 594, h: 147, double: 36, triple: 2, hr: 27, bb: 45, so: 112, hbp: 9, sb: 9, cs: 4, sec: '3B', fld: 76 },
      { id: 'muellbi02', name: 'Bill Mueller', pos: '3B', bats: 'S', age: 27, pa: 622, h: 159, double: 31, triple: 1, hr: 9, bb: 74, so: 86, hbp: 2, sb: 4, cs: 3, sec: '2B', fld: 79 },
      { id: 'aurilri01', name: 'Rich Aurilia', pos: 'SS', bats: 'R', age: 26, pa: 453, h: 108, double: 24, triple: 2, hr: 9, bb: 31, so: 63, hbp: 2, sb: 4, cs: 3, sec: '2B', fld: 72 },
      { id: 'bondsba01', name: 'Barry Bonds', pos: 'LF', bats: 'L', age: 33, pa: 697, h: 163, double: 35, triple: 6, hr: 39, bb: 140, so: 88, hbp: 7, sb: 33, cs: 10, sec: 'CF', fld: 73, arm: 57 },
      { id: 'hamilda02', name: 'Darryl Hamilton', pos: 'CF', bats: 'L', age: 33, pa: 661, h: 168, double: 28, triple: 3, hr: 6, bb: 75, so: 72, hbp: 2, sb: 15, cs: 9, sec: 'RF', fld: 61, arm: 63 },
      { id: 'javiest01', name: 'Stan Javier', pos: 'RF', bats: 'S', age: 34, pa: 490, h: 121, double: 17, triple: 4, hr: 5, bb: 58, so: 67, hbp: 3, sb: 22, cs: 4, sec: 'CF', fld: 69, arm: 50 },
      { id: 'hayesch01', name: 'Charlie Hayes', pos: 'DH', bats: 'R', age: 33, pa: 366, h: 89, double: 12, triple: 0, hr: 10, bb: 33, so: 60, hbp: 0, sb: 3, cs: 1, sec: '3B', fld: 63 },
    ],
    bench: [
      { id: 'sanchre01', name: 'Rey Sanchez', pos: 'SS', bats: 'R', age: 30, pa: 339, h: 85, double: 15, triple: 1, hr: 2, bb: 17, so: 45, hbp: 3, sb: 2, cs: 2, sec: '2B', fld: 86 },
      { id: 'benarma01', name: 'Marvin Benard', pos: 'RF', bats: 'L', age: 27, pa: 327, h: 82, double: 16, triple: 1, hr: 3, bb: 34, so: 47, hbp: 3, sb: 12, cs: 5, sec: 'CF', fld: 59, arm: 55 },
      { id: 'maynebr01', name: 'Brent Mayne', pos: 'C', bats: 'L', age: 30, pa: 317, h: 78, double: 15, triple: 0, hr: 4, bb: 31, so: 45, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 71, arm: 58 },
      { id: 'jonesch05', name: 'Chris Jones', pos: 'RF', bats: 'R', age: 32, pa: 134, h: 26, double: 5, triple: 0, hr: 4, bb: 11, so: 36, hbp: 1, sb: 3, cs: 1, sec: 'LF', fld: 51, arm: 62 },
      { id: 'diazal01', name: 'Alex Diaz', pos: 'CF', bats: 'S', age: 29, pa: 62, h: 11, double: 2, triple: 0, hr: 1, bb: 2, so: 11, hbp: 1, sb: 1, cs: 1, sec: 'RF' },
    ],
    pitchers: [
      { id: 'gardnma01', name: 'Mark Gardner', role: 'SP', throws: 'R', age: 36, g: 33, gs: 33, outs: 636, h: 211, hr: 30, bb: 65, so: 155, hbp: 5, er: 101, w: 13, l: 6, sv: 0, fld: 75 },
      { id: 'hershor01', name: 'Orel Hershiser', role: 'SP', throws: 'R', age: 39, g: 34, gs: 34, outs: 606, h: 208, hr: 23, bb: 76, so: 121, hbp: 12, er: 99, w: 11, l: 10, sv: 0, fld: 82 },
      { id: 'rueteki01', name: 'Kirk Rueter', role: 'SP', throws: 'L', age: 27, g: 33, gs: 33, outs: 563, h: 194, hr: 23, bb: 54, so: 105, hbp: 5, er: 84, w: 16, l: 9, sv: 0, fld: 79 },
      { id: 'estessh01', name: 'Shawn Estes', role: 'SP', throws: 'L', age: 25, g: 25, gs: 25, outs: 448, h: 139, hr: 11, bb: 80, so: 138, hbp: 5, er: 70, w: 7, l: 12, sv: 0, fld: 71 },
      { id: 'darwida01', name: 'Danny Darwin', role: 'SP', throws: 'R', age: 42, g: 33, gs: 25, outs: 446, h: 172, hr: 22, bb: 43, so: 86, hbp: 4, er: 81, w: 8, l: 10, sv: 0, fld: 72 },
      { id: 'nenro01', name: 'Robb Nen', role: 'CL', throws: 'R', age: 28, g: 78, gs: 0, outs: 266, h: 66, hr: 5, bb: 30, so: 100, hbp: 1, er: 22, w: 7, l: 7, sv: 40 },
      { id: 'johnsjo07', name: 'John Johnstone', role: 'RP', throws: 'R', age: 29, g: 70, gs: 0, outs: 264, h: 73, hr: 9, bb: 39, so: 80, hbp: 3, er: 31, w: 6, l: 5, sv: 0 },
      { id: 'tavarju01', name: 'Julian Tavarez', role: 'RP', throws: 'R', age: 25, g: 60, gs: 0, outs: 256, h: 97, hr: 6, bb: 33, so: 47, hbp: 6, er: 39, w: 5, l: 3, sv: 1 },
      { id: 'reedst01', name: 'Steve Reed', role: 'RP', throws: 'R', age: 33, g: 70, gs: 0, outs: 241, h: 59, hr: 10, bb: 28, so: 64, hbp: 6, er: 31, w: 4, l: 3, sv: 1 },
      { id: 'rodriri02', name: 'Rich Rodriguez', role: 'RP', throws: 'L', age: 35, g: 68, gs: 0, outs: 197, h: 68, hr: 7, bb: 20, so: 39, hbp: 0, er: 26, w: 4, l: 0, sv: 2 },
      { id: 'pooleji02', name: 'Jim Poole', role: 'RP', throws: 'L', age: 32, g: 38, gs: 0, outs: 118, h: 47, hr: 5, bb: 16, so: 24, hbp: 2, er: 23, w: 1, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'ortizru01', name: 'Russ Ortiz', role: 'SP', throws: 'R', age: 24, g: 22, gs: 13, outs: 265, h: 90, hr: 11, bb: 46, so: 75, hbp: 4, er: 49, w: 4, l: 4, sv: 0, rk: true },
      { id: 'brockch01', name: 'Chris Brock', role: 'RP', throws: 'R', age: 28, g: 13, gs: 0, outs: 83, h: 30, hr: 2, bb: 11, so: 16, hbp: 0, er: 14, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
];
