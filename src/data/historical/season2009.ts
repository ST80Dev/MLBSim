import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 2009 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 2009
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
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents2009.ts`).
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

export const SEASON_2009: HistTeam[] = [
  // BAL (BAL 2009)
  {
    franchiseId: 'BAL',
    season: 2009,
    batters: [
      { id: 'wietema01', name: 'Matt Wieters', pos: 'C', bats: 'S', age: 23, pa: 385, h: 102, double: 15, triple: 1, hr: 9, bb: 28, so: 86, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 65, rk: true },
      { id: 'huffau01', name: 'Aubrey Huff', pos: '1B', bats: 'L', age: 32, pa: 597, h: 145, double: 35, triple: 2, hr: 20, bb: 49, so: 85, hbp: 4, sb: 1, cs: 3, sec: '3B', fld: 71 },
      { id: 'roberbr01', name: 'Brian Roberts', pos: '2B', bats: 'S', age: 31, pa: 717, h: 181, double: 52, triple: 4, hr: 13, bb: 80, so: 108, hbp: 2, sb: 37, cs: 8, sec: 'SS', fld: 60 },
      { id: 'morame01', name: 'Melvin Mora', pos: '3B', bats: 'R', age: 37, pa: 496, h: 121, double: 22, triple: 1, hr: 13, bb: 35, so: 63, hbp: 8, sb: 4, cs: 4, sec: 'SS', fld: 96 },
      { id: 'izturce01', name: 'Cesar Izturis', pos: 'SS', bats: 'S', age: 29, pa: 412, h: 99, double: 13, triple: 3, hr: 1, bb: 22, so: 31, hbp: 4, sb: 14, cs: 4, sec: '3B', fld: 86 },
      { id: 'reimono01', name: 'Nolan Reimold', pos: 'LF', bats: 'R', age: 25, pa: 411, h: 100, double: 18, triple: 2, hr: 15, bb: 47, so: 77, hbp: 3, sb: 8, cs: 2, sec: 'RF', fld: 69, arm: 77, rk: true },
      { id: 'jonesad01', name: 'Adam Jones', pos: 'CF', bats: 'R', age: 23, pa: 519, h: 130, double: 21, triple: 5, hr: 15, bb: 31, so: 101, hbp: 7, sb: 10, cs: 4, sec: 'LF', fld: 94, arm: 79 },
      { id: 'markani01', name: 'Nick Markakis', pos: 'RF', bats: 'L', age: 25, pa: 711, h: 188, double: 46, triple: 2, hr: 20, bb: 72, so: 106, hbp: 3, sb: 9, cs: 4, sec: 'LF', fld: 65, arm: 74 },
      { id: 'scottlu01', name: 'Luke Scott', pos: 'DH', bats: 'L', age: 31, pa: 506, h: 115, double: 28, triple: 2, hr: 23, bb: 54, so: 103, hbp: 3, sb: 1, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'wiggity01', name: 'Ty Wigginton', pos: '1B', bats: 'R', age: 31, pa: 436, h: 111, double: 21, triple: 0, hr: 16, bb: 27, so: 66, hbp: 5, sb: 2, cs: 3, sec: '3B', fld: 69 },
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 38, pa: 296, h: 64, double: 16, triple: 0, hr: 7, bb: 35, so: 44, hbp: 2, sb: 1, cs: 1, fld: 70, arm: 62 },
      { id: 'piefe01', name: 'Felix Pie', pos: 'LF', bats: 'L', age: 24, pa: 281, h: 64, double: 10, triple: 3, hr: 7, bb: 23, so: 63, hbp: 1, sb: 4, cs: 2, sec: 'CF', fld: 100, arm: 75 },
      { id: 'andinro01', name: 'Robert Andino', pos: 'SS', bats: 'R', age: 25, pa: 215, h: 44, double: 7, triple: 0, hr: 3, bb: 14, so: 51, hbp: 0, sb: 2, cs: 2, sec: '2B', fld: 72 },
      { id: 'moellch01', name: 'Chad Moeller', pos: 'C', bats: 'R', age: 34, pa: 100, h: 21, double: 7, triple: 1, hr: 2, bb: 6, so: 18, hbp: 2, sb: 0, cs: 0, fld: 71, arm: 49 },
    ],
    reserveBatters: [
      { id: 'aubremi01', name: 'Michael Aubrey', pos: '1B', bats: 'L', age: 27, pa: 95, h: 24, double: 5, triple: 0, hr: 4, bb: 6, so: 10, hbp: 0, sb: 0, cs: 0, sec: '3B', fld: 84, rk: true },
      { id: 'montalu01', name: 'Luis Montanez', pos: 'LF', bats: 'R', age: 27, pa: 91, h: 20, double: 5, triple: 0, hr: 2, bb: 4, so: 16, hbp: 1, sb: 0, cs: 1, sec: 'RF', fld: 76, arm: 55, rk: true },
      { id: 'fioreje01', name: 'Jeff Fiorentino', pos: 'CF', bats: 'L', age: 26, pa: 75, h: 19, double: 1, triple: 0, hr: 0, bb: 8, so: 16, hbp: 0, sb: 2, cs: 0, sec: 'LF', fld: 59, arm: 89, rk: true },
    ],
    pitchers: [
      { id: 'guthrje01', name: 'Jeremy Guthrie', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 600, h: 210, hr: 31, bb: 61, so: 123, hbp: 8, er: 99, w: 10, l: 17, sv: 0, fld: 69 },
      { id: 'bergebr02', name: 'Brad Bergesen', role: 'SP', throws: 'R', age: 23, g: 19, gs: 19, outs: 370, h: 126, hr: 11, bb: 32, so: 65, hbp: 5, er: 47, w: 7, l: 5, sv: 0, rk: true },
      { id: 'berkeja01', name: 'Jason Berken', role: 'SP', throws: 'R', age: 25, g: 24, gs: 24, outs: 359, h: 164, hr: 19, bb: 44, so: 66, hbp: 6, er: 87, w: 6, l: 12, sv: 0, rk: true },
      { id: 'hendrma01', name: 'Mark Hendrickson', role: 'SP', throws: 'L', age: 35, g: 53, gs: 11, outs: 315, h: 117, hr: 14, bb: 33, so: 65, hbp: 3, er: 57, w: 6, l: 5, sv: 1 },
      { id: 'hernada01', name: 'David Hernandez', role: 'SP', throws: 'R', age: 24, g: 20, gs: 19, outs: 304, h: 118, hr: 27, bb: 46, so: 68, hbp: 1, er: 61, w: 4, l: 10, sv: 0, rk: true },
      { id: 'sherrge01', name: 'George Sherrill', role: 'CL', throws: 'L', age: 32, g: 72, gs: 0, outs: 207, h: 53, hr: 5, bb: 29, so: 67, hbp: 2, er: 20, w: 1, l: 1, sv: 21 },
      { id: 'bassbr01', name: 'Brian Bass', role: 'RP', throws: 'R', age: 27, g: 48, gs: 0, outs: 259, h: 104, hr: 12, bb: 39, so: 51, hbp: 5, er: 48, w: 5, l: 3, sv: 0 },
      { id: 'baezda01', name: 'Danys Baez', role: 'RP', throws: 'R', age: 31, g: 59, gs: 0, outs: 215, h: 60, hr: 8, bb: 25, so: 39, hbp: 6, er: 35, w: 4, l: 6, sv: 0 },
      { id: 'johnsji04', name: 'Jim Johnson', role: 'RP', throws: 'R', age: 26, g: 64, gs: 0, outs: 210, h: 67, hr: 5, bb: 26, so: 46, hbp: 3, er: 27, w: 4, l: 6, sv: 10 },
      { id: 'alberma01', name: 'Matt Albers', role: 'RP', throws: 'R', age: 26, g: 56, gs: 0, outs: 201, h: 76, hr: 6, bb: 34, so: 45, hbp: 3, er: 39, w: 3, l: 6, sv: 0 },
      { id: 'eatonad01', name: 'Adam Eaton', role: 'RP', throws: 'R', age: 31, g: 12, gs: 8, outs: 147, h: 63, hr: 9, bb: 23, so: 30, hbp: 2, er: 37, w: 3, l: 5, sv: 0 },
    ],
    reservePitchers: [
      { id: 'ueharko01', name: 'Koji Uehara', role: 'SP', throws: 'R', age: 34, g: 12, gs: 12, outs: 200, h: 71, hr: 7, bb: 12, so: 48, hbp: 0, er: 30, w: 2, l: 4, sv: 0, rk: true },
      { id: 'tillmch01', name: 'Chris Tillman', role: 'SP', throws: 'R', age: 21, g: 12, gs: 12, outs: 195, h: 77, hr: 15, bb: 24, so: 39, hbp: 2, er: 39, w: 2, l: 5, sv: 0, rk: true },
      { id: 'hillri01', name: 'Rich Hill', role: 'SP', throws: 'L', age: 29, g: 14, gs: 13, outs: 173, h: 61, hr: 8, bb: 33, so: 53, hbp: 3, er: 38, w: 3, l: 3, sv: 0 },
      { id: 'matusbr01', name: 'Brian Matusz', role: 'RP', throws: 'L', age: 22, g: 8, gs: 8, outs: 134, h: 52, hr: 6, bb: 14, so: 38, hbp: 0, er: 23, w: 5, l: 2, sv: 0, rk: true },
      { id: 'raych01', name: 'Chris Ray', role: 'RP', throws: 'R', age: 27, g: 46, gs: 0, outs: 130, h: 59, hr: 8, bb: 23, so: 42, hbp: 1, er: 33, w: 0, l: 4, sv: 0 },
    ],
  },
  // BOS (BOS 2009)
  {
    franchiseId: 'BOS',
    season: 2009,
    batters: [
      { id: 'varitja01', name: 'Jason Varitek', pos: 'C', bats: 'S', age: 37, pa: 425, h: 81, double: 20, triple: 0, hr: 13, bb: 52, so: 98, hbp: 4, sb: 0, cs: 1, fld: 78, arm: 55 },
      { id: 'youklke01', name: 'Kevin Youkilis', pos: '1B', bats: 'R', age: 30, pa: 588, h: 152, double: 37, triple: 2, hr: 25, bb: 70, so: 113, hbp: 14, sb: 5, cs: 3, sec: '3B', fld: 79 },
      { id: 'pedrodu01', name: 'Dustin Pedroia', pos: '2B', bats: 'R', age: 25, pa: 714, h: 196, double: 50, triple: 1, hr: 15, bb: 63, so: 48, hbp: 6, sb: 18, cs: 5, sec: 'SS', fld: 55 },
      { id: 'lowelmi01', name: 'Mike Lowell', pos: '3B', bats: 'R', age: 35, pa: 484, h: 129, double: 28, triple: 1, hr: 17, bb: 36, so: 60, hbp: 3, sb: 2, cs: 1, fld: 69 },
      { id: 'greenni01', name: 'Nick Green', pos: 'SS', bats: 'R', age: 30, pa: 309, h: 65, double: 18, triple: 0, hr: 6, bb: 20, so: 69, hbp: 8, sb: 1, cs: 4, sec: '2B', fld: 60 },
      { id: 'bayja01', name: 'Jason Bay', pos: 'LF', bats: 'R', age: 30, pa: 638, h: 147, double: 30, triple: 3, hr: 32, bb: 83, so: 149, hbp: 7, sb: 10, cs: 2, sec: 'CF', fld: 81, arm: 82 },
      { id: 'ellsbja01', name: 'Jacoby Ellsbury', pos: 'CF', bats: 'L', age: 25, pa: 691, h: 185, double: 27, triple: 9, hr: 9, bb: 48, so: 80, hbp: 7, sb: 64, cs: 12, sec: 'LF', fld: 69, arm: 63 },
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'RF', bats: 'L', age: 33, pa: 539, h: 124, double: 29, triple: 4, hr: 21, bb: 84, so: 103, hbp: 3, sb: 3, cs: 4, sec: 'CF', fld: 70, arm: 63 },
      { id: 'ortizda01', name: 'David Ortiz', pos: 'DH', bats: 'L', age: 33, pa: 627, h: 140, double: 39, triple: 1, hr: 29, bb: 84, so: 116, hbp: 4, sb: 1, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'baldero01', name: 'Rocco Baldelli', pos: 'RF', bats: 'R', age: 27, pa: 164, h: 37, double: 6, triple: 1, hr: 7, bb: 11, so: 39, hbp: 3, sb: 1, cs: 0, sec: 'CF', fld: 64, arm: 77 },
      { id: 'kottage01', name: 'George Kottaras', pos: 'C', bats: 'L', age: 26, pa: 107, h: 22, double: 11, triple: 0, hr: 1, bb: 11, so: 26, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 58, arm: 58, rk: true },
      { id: 'baileje01', name: 'Jeff Bailey', pos: '1B', bats: 'R', age: 30, pa: 91, h: 18, double: 3, triple: 2, hr: 3, bb: 11, so: 22, hbp: 3, sb: 0, cs: 0, sec: '3B', fld: 58, rk: true },
      { id: 'lowrije01', name: 'Jed Lowrie', pos: 'SS', bats: 'S', age: 25, pa: 76, h: 15, double: 5, triple: 1, hr: 1, bb: 8, so: 18, hbp: 0, sb: 0, cs: 0, sec: '3B', fld: 68 },
      { id: 'reddijo01', name: 'Josh Reddick', pos: 'LF', bats: 'L', age: 22, pa: 62, h: 10, double: 4, triple: 0, hr: 2, bb: 2, so: 17, hbp: 1, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'beckejo02', name: 'Josh Beckett', role: 'SP', throws: 'R', age: 29, g: 32, gs: 32, outs: 637, h: 202, hr: 23, bb: 49, so: 203, hbp: 8, er: 90, w: 17, l: 6, sv: 0, fld: 57 },
      { id: 'lestejo01', name: 'Jon Lester', role: 'SP', throws: 'L', age: 25, g: 32, gs: 32, outs: 610, h: 188, hr: 18, bb: 65, so: 189, hbp: 6, er: 76, w: 15, l: 8, sv: 0, fld: 64 },
      { id: 'pennybr01', name: 'Brad Penny', role: 'SP', throws: 'R', age: 31, g: 30, gs: 30, outs: 520, h: 187, hr: 19, bb: 58, so: 106, hbp: 5, er: 91, w: 11, l: 9, sv: 0, fld: 67 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 42, g: 21, gs: 21, outs: 389, h: 129, hr: 15, bb: 47, so: 80, hbp: 9, er: 66, w: 11, l: 5, sv: 0 },
      { id: 'masteju01', name: 'Justin Masterson', role: 'SP', throws: 'R', age: 24, g: 42, gs: 16, outs: 388, h: 121, hr: 13, bb: 60, so: 115, hbp: 9, er: 60, w: 4, l: 10, sv: 0 },
      { id: 'papeljo01', name: 'Jonathan Papelbon', role: 'CL', throws: 'R', age: 28, g: 66, gs: 0, outs: 204, h: 54, hr: 5, bb: 18, so: 82, hbp: 3, er: 16, w: 1, l: 1, sv: 38 },
      { id: 'ramirra02', name: 'Ramon Ramirez', role: 'RP', throws: 'R', age: 27, g: 70, gs: 0, outs: 209, h: 61, hr: 5, bb: 31, so: 59, hbp: 2, er: 24, w: 7, l: 4, sv: 0 },
      { id: 'okajihi01', name: 'Hideki Okajima', role: 'RP', throws: 'L', age: 33, g: 68, gs: 0, outs: 183, h: 52, hr: 7, bb: 21, so: 57, hbp: 1, er: 20, w: 6, l: 0, sv: 0 },
      { id: 'delcama01', name: 'Manny Delcarmen', role: 'RP', throws: 'R', age: 27, g: 64, gs: 0, outs: 179, h: 57, hr: 5, bb: 30, so: 54, hbp: 3, er: 26, w: 5, l: 2, sv: 0 },
      { id: 'saitota01', name: 'Takashi Saito', role: 'RP', throws: 'R', age: 39, g: 56, gs: 0, outs: 167, h: 47, hr: 4, bb: 21, so: 63, hbp: 4, er: 14, w: 3, l: 3, sv: 2 },
      { id: 'bardda01', name: 'Daniel Bard', role: 'RP', throws: 'R', age: 24, g: 49, gs: 0, outs: 148, h: 41, hr: 5, bb: 22, so: 63, hbp: 3, er: 20, w: 2, l: 2, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'buchhcl01', name: 'Clay Buchholz', role: 'SP', throws: 'R', age: 24, g: 16, gs: 16, outs: 276, h: 94, hr: 12, bb: 40, so: 74, hbp: 2, er: 49, w: 7, l: 4, sv: 0 },
      { id: 'smoltjo01', name: 'John Smoltz', role: 'SP', throws: 'R', age: 42, g: 15, gs: 15, outs: 234, h: 87, hr: 9, bb: 19, so: 80, hbp: 2, er: 41, w: 3, l: 8, sv: 0 },
      { id: 'matsuda01', name: 'Daisuke Matsuzaka', role: 'SP', throws: 'R', age: 28, g: 12, gs: 12, outs: 178, h: 62, hr: 7, bb: 32, so: 60, hbp: 3, er: 29, w: 4, l: 6, sv: 0 },
      { id: 'byrdpa01', name: 'Paul Byrd', role: 'RP', throws: 'R', age: 38, g: 7, gs: 6, outs: 102, h: 43, hr: 6, bb: 7, so: 16, hbp: 1, er: 19, w: 1, l: 3, sv: 0 },
      { id: 'tazawju01', name: 'Junichi Tazawa', role: 'RP', throws: 'R', age: 23, g: 6, gs: 4, outs: 76, h: 43, hr: 4, bb: 9, so: 13, hbp: 3, er: 21, w: 2, l: 3, sv: 0, rk: true },
    ],
  },
  // NYY (NYA 2009)
  {
    franchiseId: 'NYY',
    season: 2009,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 38, pa: 438, h: 112, double: 27, triple: 1, hr: 18, bb: 51, so: 91, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 66, arm: 69 },
      { id: 'teixema01', name: 'Mark Teixeira', pos: '1B', bats: 'S', age: 29, pa: 707, h: 181, double: 42, triple: 2, hr: 37, bb: 89, so: 111, hbp: 10, sb: 2, cs: 0, sec: '3B', fld: 61 },
      { id: 'canoro01', name: 'Robinson Cano', pos: '2B', bats: 'L', age: 26, pa: 674, h: 192, double: 43, triple: 3, hr: 21, bb: 31, so: 69, hbp: 5, sb: 4, cs: 6, sec: 'SS', fld: 63 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: '3B', bats: 'R', age: 33, pa: 535, h: 133, double: 23, triple: 0, hr: 33, bb: 71, so: 99, hbp: 11, sb: 16, cs: 2, sec: 'SS', fld: 65 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 35, pa: 716, h: 205, double: 29, triple: 2, hr: 15, bb: 64, so: 92, hbp: 8, sb: 22, cs: 6, fld: 60 },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'LF', bats: 'L', age: 35, pa: 626, h: 159, double: 32, triple: 4, hr: 20, bb: 68, so: 90, hbp: 2, sb: 20, cs: 3, sec: 'CF', fld: 60, arm: 68 },
      { id: 'cabreme01', name: 'Melky Cabrera', pos: 'CF', bats: 'S', age: 24, pa: 540, h: 130, double: 23, triple: 2, hr: 11, bb: 40, so: 62, hbp: 4, sb: 10, cs: 3, sec: 'LF', fld: 57, arm: 62 },
      { id: 'swishni01', name: 'Nick Swisher', pos: 'RF', bats: 'S', age: 28, pa: 607, h: 121, double: 30, triple: 1, hr: 26, bb: 92, so: 129, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 68, arm: 57 },
      { id: 'matsuhi01', name: 'Hideki Matsui', pos: 'DH', bats: 'L', age: 35, pa: 526, h: 129, double: 22, triple: 1, hr: 23, bb: 60, so: 69, hbp: 4, sb: 1, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'gardnbr01', name: 'Brett Gardner', pos: 'CF', bats: 'L', age: 25, pa: 284, h: 65, double: 7, triple: 6, hr: 2, bb: 24, so: 45, hbp: 3, sb: 26, cs: 4, sec: 'LF', fld: 75, arm: 68 },
      { id: 'molinjo01', name: 'Jose Molina', pos: 'C', bats: 'R', age: 34, pa: 155, h: 31, double: 7, triple: 0, hr: 1, bb: 9, so: 28, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 73, arm: 69 },
      { id: 'penara02', name: 'Ramiro Pena', pos: 'SS', bats: 'S', age: 23, pa: 121, h: 33, double: 6, triple: 1, hr: 1, bb: 5, so: 20, hbp: 0, sb: 4, cs: 1, sec: '3B', fld: 48, rk: true },
      { id: 'cervefr01', name: 'Francisco Cervelli', pos: 'C', bats: 'R', age: 23, pa: 101, h: 27, double: 4, triple: 0, hr: 1, bb: 2, so: 13, hbp: 0, sb: 0, cs: 3, sec: '1B', fld: 78, arm: 83, rk: true },
      { id: 'ransoco01', name: 'Cody Ransom', pos: '3B', bats: 'R', age: 33, pa: 86, h: 17, double: 7, triple: 1, hr: 2, bb: 9, so: 23, hbp: 1, sb: 1, cs: 0, sec: 'SS', fld: 44 },
    ],
    pitchers: [
      { id: 'sabatcc01', name: 'CC Sabathia', role: 'SP', throws: 'L', age: 28, g: 34, gs: 34, outs: 690, h: 205, hr: 18, bb: 57, so: 209, hbp: 8, er: 80, w: 19, l: 8, sv: 0, fld: 65 },
      { id: 'burneaj01', name: 'A. J. Burnett', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 621, h: 193, hr: 23, bb: 90, so: 208, hbp: 10, er: 93, w: 13, l: 9, sv: 0, fld: 55 },
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 37, g: 32, gs: 32, outs: 584, h: 206, hr: 18, bb: 65, so: 145, hbp: 4, er: 92, w: 14, l: 8, sv: 0, fld: 64 },
      { id: 'chambjo03', name: 'Joba Chamberlain', role: 'SP', throws: 'R', age: 23, g: 32, gs: 31, outs: 472, h: 160, hr: 17, bb: 72, so: 155, hbp: 10, er: 72, w: 9, l: 6, sv: 0, fld: 77 },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 39, g: 66, gs: 0, outs: 199, h: 48, hr: 5, bb: 10, so: 72, hbp: 2, er: 14, w: 3, l: 3, sv: 44 },
      { id: 'hugheph01', name: 'Phil Hughes', role: 'RP', throws: 'R', age: 23, g: 51, gs: 7, outs: 258, h: 74, hr: 8, bb: 30, so: 82, hbp: 4, er: 36, w: 8, l: 3, sv: 3 },
      { id: 'aceveal01', name: 'Alfredo Aceves', role: 'RP', throws: 'R', age: 26, g: 43, gs: 1, outs: 252, h: 69, hr: 10, bb: 18, so: 64, hbp: 4, er: 31, w: 10, l: 1, sv: 1, rk: true },
      { id: 'cokeph01', name: 'Phil Coke', role: 'RP', throws: 'L', age: 26, g: 72, gs: 0, outs: 180, h: 43, hr: 9, bb: 19, so: 51, hbp: 1, er: 27, w: 4, l: 3, sv: 2, rk: true },
      { id: 'mitrese01', name: 'Sergio Mitre', role: 'RP', throws: 'R', age: 28, g: 12, gs: 9, outs: 155, h: 68, hr: 7, bb: 14, so: 30, hbp: 3, er: 33, w: 3, l: 3, sv: 0 },
      { id: 'verasjo01', name: 'Jose Veras', role: 'RP', throws: 'R', age: 28, g: 47, gs: 0, outs: 151, h: 43, hr: 7, bb: 27, so: 46, hbp: 4, er: 26, w: 4, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'roberda08', name: 'David Robertson', role: 'RP', throws: 'R', age: 24, g: 45, gs: 0, outs: 131, h: 38, hr: 4, bb: 22, so: 59, hbp: 1, er: 19, w: 2, l: 1, sv: 1, rk: true },
      { id: 'wangch01', name: 'Chien-Ming Wang', role: 'RP', throws: 'R', age: 29, g: 12, gs: 9, outs: 126, h: 53, hr: 3, bb: 17, so: 27, hbp: 2, er: 28, w: 1, l: 6, sv: 0 },
      { id: 'brunebr01', name: 'Brian Bruney', role: 'RP', throws: 'R', age: 27, g: 44, gs: 0, outs: 117, h: 32, hr: 5, bb: 23, so: 36, hbp: 1, er: 15, w: 5, l: 0, sv: 0 },
      { id: 'albaljo01', name: 'Jonathan Albaladejo', role: 'RP', throws: 'R', age: 26, g: 32, gs: 0, outs: 103, h: 39, hr: 5, bb: 15, so: 25, hbp: 2, er: 18, w: 5, l: 1, sv: 0, rk: true },
      { id: 'ramired01', name: 'Edwar Ramirez', role: 'RP', throws: 'R', age: 28, g: 20, gs: 0, outs: 66, h: 23, hr: 5, bb: 14, so: 27, hbp: 1, er: 13, w: 0, l: 0, sv: 0 },
    ],
  },
  // TBR (TBA 2009)
  {
    franchiseId: 'TBR',
    season: 2009,
    batters: [
      { id: 'navardi01', name: 'Dioner Navarro', pos: 'C', bats: 'S', age: 25, pa: 410, h: 92, double: 19, triple: 0, hr: 7, bb: 24, so: 50, hbp: 3, sb: 3, cs: 2, sec: '1B', fld: 71, arm: 67 },
      { id: 'penaca01', name: 'Carlos Pena', pos: '1B', bats: 'L', age: 31, pa: 570, h: 113, double: 25, triple: 2, hr: 36, bb: 90, so: 155, hbp: 10, sb: 2, cs: 2, sec: '3B', fld: 62 },
      { id: 'zobribe01', name: 'Ben Zobrist', pos: '2B', bats: 'S', age: 28, pa: 599, h: 143, double: 27, triple: 6, hr: 27, bb: 83, so: 103, hbp: 3, sb: 15, cs: 5, sec: 'SS', fld: 62 },
      { id: 'longoev01', name: 'Evan Longoria', pos: '3B', bats: 'R', age: 23, pa: 671, h: 163, double: 43, triple: 1, hr: 34, bb: 68, so: 147, hbp: 8, sb: 9, cs: 0, sec: '1B', fld: 87 },
      { id: 'bartlja01', name: 'Jason Bartlett', pos: 'SS', bats: 'R', age: 29, pa: 567, h: 152, double: 27, triple: 6, hr: 9, bb: 45, so: 83, hbp: 7, sb: 27, cs: 6, sec: '2B', fld: 54 },
      { id: 'crawfca02', name: 'Carl Crawford', pos: 'LF', bats: 'L', age: 27, pa: 672, h: 183, double: 27, triple: 10, hr: 13, bb: 46, so: 99, hbp: 6, sb: 52, cs: 13, sec: 'CF', fld: 78, arm: 66 },
      { id: 'uptonbj01', name: 'B. J. Upton', pos: 'CF', bats: 'R', age: 24, pa: 626, h: 141, double: 33, triple: 3, hr: 13, bb: 73, so: 148, hbp: 3, sb: 40, cs: 14, sec: 'LF', fld: 78, arm: 68 },
      { id: 'grossga01', name: 'Gabe Gross', pos: 'RF', bats: 'L', age: 29, pa: 326, h: 65, double: 15, triple: 2, hr: 8, bb: 41, so: 72, hbp: 1, sb: 5, cs: 2, sec: 'LF', fld: 72, arm: 75 },
      { id: 'burrepa01', name: 'Pat Burrell', pos: 'DH', bats: 'R', age: 32, pa: 476, h: 95, double: 20, triple: 1, hr: 20, bb: 70, so: 108, hbp: 2, sb: 1, cs: 0, sec: 'LF' },
    ],
    bench: [
      { id: 'aybarwi01', name: 'Willy Aybar', pos: '1B', bats: 'S', age: 26, pa: 336, h: 75, double: 14, triple: 1, hr: 11, bb: 32, so: 48, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 76 },
      { id: 'iwamuak01', name: 'Akinori Iwamura', pos: '2B', bats: 'L', age: 30, pa: 260, h: 65, double: 12, triple: 3, hr: 2, bb: 25, so: 48, hbp: 1, sb: 5, cs: 2, sec: '3B', fld: 53 },
      { id: 'kaplega01', name: 'Gabe Kapler', pos: 'RF', bats: 'R', age: 33, pa: 238, h: 56, double: 16, triple: 1, hr: 8, bb: 22, so: 39, hbp: 0, sb: 4, cs: 2, sec: 'CF', fld: 82, arm: 74 },
      { id: 'hernami01', name: 'Michel Hernandez', pos: 'C', bats: 'R', age: 30, pa: 107, h: 24, double: 3, triple: 1, hr: 1, bb: 6, so: 13, hbp: 0, sb: 2, cs: 1, sec: '1B', fld: 72, arm: 69, rk: true },
      { id: 'brignre01', name: 'Reid Brignac', pos: 'SS', bats: 'S', age: 23, pa: 93, h: 23, double: 7, triple: 2, hr: 1, bb: 3, so: 22, hbp: 0, sb: 2, cs: 2, sec: '2B', fld: 52, rk: true },
    ],
    pitchers: [
      { id: 'shielja02', name: 'James Shields', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 659, h: 229, hr: 28, bb: 47, so: 172, hbp: 6, er: 97, w: 11, l: 12, sv: 0, fld: 70 },
      { id: 'garzama01', name: 'Matt Garza', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 609, h: 185, hr: 23, bb: 74, so: 170, hbp: 9, er: 87, w: 8, l: 12, sv: 0, fld: 56 },
      { id: 'niemaje01', name: 'Jeff Niemann', role: 'SP', throws: 'R', age: 26, g: 31, gs: 30, outs: 542, h: 185, hr: 18, bb: 61, so: 126, hbp: 9, er: 80, w: 13, l: 6, sv: 0, fld: 62, rk: true },
      { id: 'kazmisc01', name: 'Scott Kazmir', role: 'SP', throws: 'L', age: 25, g: 26, gs: 26, outs: 442, h: 139, hr: 18, bb: 64, so: 145, hbp: 5, er: 69, w: 10, l: 9, sv: 0, fld: 62 },
      { id: 'priceda01', name: 'David Price', role: 'SP', throws: 'L', age: 23, g: 23, gs: 23, outs: 385, h: 117, hr: 17, bb: 53, so: 103, hbp: 4, er: 61, w: 10, l: 7, sv: 0, rk: true },
      { id: 'howeljp01', name: 'J. P. Howell', role: 'CL', throws: 'L', age: 26, g: 69, gs: 0, outs: 200, h: 51, hr: 6, bb: 30, so: 72, hbp: 3, er: 23, w: 7, l: 5, sv: 17 },
      { id: 'cormila01', name: 'Lance Cormier', role: 'RP', throws: 'R', age: 28, g: 53, gs: 0, outs: 232, h: 78, hr: 7, bb: 29, so: 40, hbp: 1, er: 33, w: 3, l: 3, sv: 2 },
      { id: 'balfogr01', name: 'Grant Balfour', role: 'RP', throws: 'R', age: 31, g: 73, gs: 0, outs: 202, h: 53, hr: 5, bb: 34, so: 81, hbp: 1, er: 30, w: 5, l: 4, sv: 4 },
      { id: 'wheelda01', name: 'Dan Wheeler', role: 'RP', throws: 'R', age: 31, g: 69, gs: 0, outs: 173, h: 42, hr: 9, bb: 14, so: 47, hbp: 0, er: 22, w: 4, l: 5, sv: 2 },
      { id: 'nelsojo01', name: 'Joe Nelson', role: 'RP', throws: 'R', age: 34, g: 42, gs: 0, outs: 121, h: 33, hr: 6, bb: 23, so: 41, hbp: 1, er: 14, w: 3, l: 0, sv: 3 },
      { id: 'choatra01', name: 'Randy Choate', role: 'RP', throws: 'L', age: 33, g: 61, gs: 0, outs: 109, h: 29, hr: 4, bb: 11, so: 28, hbp: 0, er: 14, w: 1, l: 0, sv: 5 },
    ],
    reservePitchers: [
      { id: 'sonnaan01', name: 'Andy Sonnanstine', role: 'SP', throws: 'R', age: 26, g: 22, gs: 18, outs: 299, h: 124, hr: 15, bb: 26, so: 67, hbp: 3, er: 64, w: 6, l: 9, sv: 0 },
      { id: 'daviswa01', name: 'Wade Davis', role: 'RP', throws: 'R', age: 23, g: 6, gs: 6, outs: 109, h: 33, hr: 2, bb: 13, so: 36, hbp: 0, er: 15, w: 2, l: 2, sv: 0, rk: true },
      { id: 'shousbr01', name: 'Brian Shouse', role: 'RP', throws: 'L', age: 40, g: 45, gs: 0, outs: 84, h: 29, hr: 3, bb: 8, so: 18, hbp: 1, er: 11, w: 1, l: 1, sv: 0 },
      { id: 'thayeda01', name: 'Dale Thayer', role: 'RP', throws: 'R', age: 28, g: 11, gs: 0, outs: 41, h: 18, hr: 3, bb: 1, so: 8, hbp: 0, er: 7, w: 0, l: 0, sv: 1, rk: true },
      { id: 'percitr01', name: 'Troy Percival', role: 'RP', throws: 'R', age: 39, g: 14, gs: 0, outs: 34, h: 10, hr: 2, bb: 6, so: 10, hbp: 0, er: 6, w: 0, l: 1, sv: 6 },
    ],
  },
  // TOR (TOR 2009)
  {
    franchiseId: 'TOR',
    season: 2009,
    batters: [
      { id: 'barajro01', name: 'Rod Barajas', pos: 'C', bats: 'R', age: 33, pa: 460, h: 99, double: 22, triple: 0, hr: 17, bb: 23, so: 75, hbp: 4, sb: 1, cs: 0, sec: '1B', fld: 70, arm: 74 },
      { id: 'overbly01', name: 'Lyle Overbay', pos: '1B', bats: 'L', age: 32, pa: 500, h: 113, double: 31, triple: 1, hr: 14, bb: 65, so: 92, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 84 },
      { id: 'hillaa01', name: 'Aaron Hill', pos: '2B', bats: 'R', age: 27, pa: 734, h: 193, double: 41, triple: 0, hr: 29, bb: 44, so: 101, hbp: 5, sb: 7, cs: 3, sec: 'SS', fld: 87 },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 34, pa: 535, h: 135, double: 34, triple: 2, hr: 11, bb: 47, so: 69, hbp: 8, sb: 5, cs: 3, fld: 74 },
      { id: 'scutama01', name: 'Marco Scutaro', pos: 'SS', bats: 'R', age: 33, pa: 680, h: 160, double: 31, triple: 1, hr: 11, bb: 79, so: 75, hbp: 5, sb: 11, cs: 4, sec: '2B', fld: 74 },
      { id: 'snidetr01', name: 'Travis Snider', pos: 'LF', bats: 'L', age: 21, pa: 276, h: 61, double: 15, triple: 1, hr: 9, bb: 27, so: 78, hbp: 3, sb: 1, cs: 1, sec: 'RF', fld: 59, arm: 67, rk: true },
      { id: 'wellsve01', name: 'Vernon Wells', pos: 'CF', bats: 'R', age: 30, pa: 684, h: 168, double: 36, triple: 3, hr: 19, bb: 47, so: 83, hbp: 2, sb: 13, cs: 4, sec: 'RF', fld: 65, arm: 67 },
      { id: 'riosal01', name: 'Alex Rios', pos: 'RF', bats: 'R', age: 28, pa: 633, h: 158, double: 37, triple: 5, hr: 17, bb: 40, so: 103, hbp: 4, sb: 24, cs: 6, sec: 'CF', fld: 76, arm: 60 },
      { id: 'lindad01', name: 'Adam Lind', pos: 'DH', bats: 'L', age: 25, pa: 654, h: 174, double: 41, triple: 2, hr: 29, bb: 49, so: 113, hbp: 4, sb: 2, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'bautijo02', name: 'Jose Bautista', pos: 'LF', bats: 'R', age: 28, pa: 404, h: 83, double: 16, triple: 2, hr: 13, bb: 48, so: 81, hbp: 3, sb: 3, cs: 1, sec: 'RF', fld: 70, arm: 94 },
      { id: 'encared01', name: 'Edwin Encarnacion', pos: '3B', bats: 'R', age: 26, pa: 338, h: 74, double: 14, triple: 1, hr: 13, bb: 34, so: 61, hbp: 6, sb: 2, cs: 0, sec: '1B', fld: 61 },
      { id: 'millake01', name: 'Kevin Millar', pos: '1B', bats: 'R', age: 37, pa: 283, h: 58, double: 13, triple: 0, hr: 8, bb: 33, so: 46, hbp: 2, sb: 0, cs: 0, sec: 'LF', fld: 63 },
      { id: 'chavera01', name: 'Raul Chavez', pos: 'C', bats: 'R', age: 36, pa: 168, h: 41, double: 7, triple: 0, hr: 2, bb: 6, so: 22, hbp: 0, sb: 1, cs: 1, fld: 67, arm: 78 },
      { id: 'mcdonjo03', name: 'John McDonald', pos: 'SS', bats: 'R', age: 34, pa: 156, h: 35, double: 7, triple: 0, hr: 2, bb: 4, so: 19, hbp: 2, sb: 2, cs: 1, sec: '2B', fld: 87 },
    ],
    reserveBatters: [
      { id: 'ruizra01', name: 'Randy Ruiz', pos: 'DH', bats: 'R', age: 31, pa: 130, h: 35, double: 6, triple: 0, hr: 8, bb: 10, so: 36, hbp: 3, sb: 1, cs: 1, sec: '1B', rk: true },
      { id: 'inglejo01', name: 'Joe Inglett', pos: 'LF', bats: 'L', age: 31, pa: 99, h: 26, double: 4, triple: 2, hr: 1, bb: 7, so: 14, hbp: 1, sb: 3, cs: 1, sec: 'RF', fld: 48, arm: 79 },
    ],
    pitchers: [
      { id: 'hallaro01', name: 'Roy Halladay', role: 'SP', throws: 'R', age: 32, g: 32, gs: 32, outs: 717, h: 229, hr: 19, bb: 38, so: 196, hbp: 7, er: 78, w: 17, l: 10, sv: 0, fld: 76 },
      { id: 'romerri01', name: 'Ricky Romero', role: 'SP', throws: 'L', age: 24, g: 29, gs: 29, outs: 534, h: 192, hr: 18, bb: 79, so: 141, hbp: 10, er: 85, w: 13, l: 9, sv: 0, fld: 76, rk: true },
      { id: 'tallebr01', name: 'Brian Tallet', role: 'SP', throws: 'L', age: 31, g: 37, gs: 25, outs: 482, h: 163, hr: 17, bb: 71, so: 126, hbp: 6, er: 85, w: 7, l: 9, sv: 0, fld: 58 },
      { id: 'richmsc01', name: 'Scott Richmond', role: 'SP', throws: 'R', age: 29, g: 27, gs: 24, outs: 416, h: 150, hr: 25, bb: 54, so: 116, hbp: 1, er: 83, w: 8, l: 11, sv: 0, fld: 79, rk: true },
      { id: 'cecilbr01', name: 'Brett Cecil', role: 'SP', throws: 'L', age: 22, g: 18, gs: 17, outs: 280, h: 116, hr: 17, bb: 38, so: 69, hbp: 5, er: 55, w: 7, l: 4, sv: 0, rk: true },
      { id: 'frasoja01', name: 'Jason Frasor', role: 'CL', throws: 'R', age: 31, g: 61, gs: 0, outs: 173, h: 42, hr: 4, bb: 23, so: 53, hbp: 2, er: 21, w: 7, l: 3, sv: 11 },
      { id: 'campsh01', name: 'Shawn Camp', role: 'RP', throws: 'R', age: 33, g: 59, gs: 0, outs: 239, h: 79, hr: 7, bb: 28, so: 59, hbp: 4, er: 35, w: 2, l: 6, sv: 1 },
      { id: 'leagubr01', name: 'Brandon League', role: 'RP', throws: 'R', age: 26, g: 67, gs: 0, outs: 224, h: 71, hr: 7, bb: 24, so: 69, hbp: 7, er: 34, w: 3, l: 6, sv: 0 },
      { id: 'carlsje01', name: 'Jesse Carlson', role: 'RP', throws: 'L', age: 28, g: 73, gs: 0, outs: 203, h: 61, hr: 7, bb: 23, so: 56, hbp: 3, er: 29, w: 1, l: 6, sv: 0 },
      { id: 'purceda01', name: 'David Purcey', role: 'RP', throws: 'L', age: 27, g: 9, gs: 9, outs: 144, h: 53, hr: 6, bb: 27, so: 42, hbp: 2, er: 32, w: 1, l: 3, sv: 0 },
      { id: 'downssc01', name: 'Scott Downs', role: 'RP', throws: 'L', age: 33, g: 48, gs: 0, outs: 140, h: 41, hr: 3, bb: 16, so: 42, hbp: 2, er: 13, w: 1, l: 3, sv: 9 },
    ],
    reservePitchers: [
      { id: 'rzepcma01', name: 'Marc Rzepczynski', role: 'SP', throws: 'L', age: 23, g: 11, gs: 11, outs: 184, h: 51, hr: 7, bb: 30, so: 60, hbp: 1, er: 25, w: 2, l: 4, sv: 0, rk: true },
      { id: 'janssca01', name: 'Casey Janssen', role: 'RP', throws: 'R', age: 27, g: 21, gs: 5, outs: 120, h: 53, hr: 4, bb: 14, so: 24, hbp: 2, er: 21, w: 2, l: 4, sv: 1 },
      { id: 'roenijo01', name: 'Josh Roenicke', role: 'RP', throws: 'R', age: 26, g: 24, gs: 0, outs: 93, h: 33, hr: 2, bb: 16, so: 34, hbp: 2, er: 18, w: 0, l: 0, sv: 0, rk: true },
      { id: 'accarje01', name: 'Jeremy Accardo', role: 'RP', throws: 'R', age: 27, g: 26, gs: 0, outs: 74, h: 23, hr: 2, bb: 13, so: 19, hbp: 2, er: 9, w: 0, l: 0, sv: 1 },
      { id: 'rayro01', name: 'Robert Ray', role: 'RP', throws: 'R', age: 25, g: 4, gs: 4, outs: 73, h: 23, hr: 4, bb: 6, so: 13, hbp: 2, er: 12, w: 1, l: 2, sv: 0, rk: true },
    ],
  },
  // CWS (CHA 2009)
  {
    franchiseId: 'CWS',
    season: 2009,
    batters: [
      { id: 'pierzaj01', name: 'A. J. Pierzynski', pos: 'C', bats: 'L', age: 32, pa: 535, h: 144, double: 25, triple: 1, hr: 13, bb: 22, so: 60, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 72, arm: 64 },
      { id: 'konerpa01', name: 'Paul Konerko', pos: '1B', bats: 'R', age: 33, pa: 621, h: 142, double: 29, triple: 1, hr: 28, bb: 67, so: 93, hbp: 8, sb: 1, cs: 0, sec: '3B', fld: 72 },
      { id: 'getzch01', name: 'Chris Getz', pos: '2B', bats: 'L', age: 25, pa: 415, h: 98, double: 18, triple: 4, hr: 2, bb: 30, so: 54, hbp: 6, sb: 25, cs: 3, sec: 'SS', fld: 75, rk: true },
      { id: 'beckhgo01', name: 'Gordon Beckham', pos: '3B', bats: 'R', age: 22, pa: 430, h: 102, double: 28, triple: 1, hr: 14, bb: 41, so: 65, hbp: 6, sb: 7, cs: 4, sec: '1B', fld: 80, rk: true },
      { id: 'ramiral03', name: 'Alexei Ramirez', pos: 'SS', bats: 'R', age: 27, pa: 606, h: 156, double: 18, triple: 1, hr: 19, bb: 39, so: 68, hbp: 2, sb: 15, cs: 7, sec: '2B', fld: 69 },
      { id: 'quentca01', name: 'Carlos Quentin', pos: 'LF', bats: 'R', age: 26, pa: 399, h: 88, double: 17, triple: 0, hr: 22, bb: 37, so: 57, hbp: 15, sb: 4, cs: 1, sec: 'RF', fld: 67, arm: 73 },
      { id: 'anderbr03', name: 'Brian Anderson', pos: 'CF', bats: 'R', age: 27, pa: 231, h: 49, double: 11, triple: 0, hr: 6, bb: 19, so: 54, hbp: 2, sb: 4, cs: 4, sec: 'LF', fld: 48, arm: 70 },
      { id: 'dyeje01', name: 'Jermaine Dye', pos: 'RF', bats: 'R', age: 35, pa: 574, h: 137, double: 28, triple: 1, hr: 28, bb: 52, so: 103, hbp: 5, sb: 1, cs: 2, sec: 'LF', fld: 64, arm: 71 },
      { id: 'podsesc01', name: 'Scott Podsednik', pos: 'DH', bats: 'L', age: 33, pa: 587, h: 155, double: 26, triple: 6, hr: 6, bb: 40, so: 78, hbp: 4, sb: 31, cs: 13, sec: 'LF', fld: 79, arm: 69 },
    ],
    bench: [
      { id: 'thomeji01', name: 'Jim Thome', pos: 'DH', bats: 'L', age: 38, pa: 434, h: 91, double: 17, triple: 0, hr: 25, bb: 69, so: 114, hbp: 2, sb: 0, cs: 0, sec: '1B' },
      { id: 'nixja01', name: 'Jayson Nix', pos: '2B', bats: 'R', age: 26, pa: 290, h: 54, double: 11, triple: 0, hr: 10, bb: 28, so: 66, hbp: 4, sb: 9, cs: 2, sec: 'SS', fld: 65, rk: true },
      { id: 'fieldjo02', name: 'Josh Fields', pos: '3B', bats: 'R', age: 26, pa: 268, h: 54, double: 7, triple: 1, hr: 9, bb: 24, so: 80, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 73 },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: '1B', bats: 'L', age: 33, pa: 206, h: 51, double: 11, triple: 1, hr: 3, bb: 15, so: 21, hbp: 0, sb: 2, cs: 2, sec: '3B', fld: 81 },
      { id: 'wisede01', name: 'Dewayne Wise', pos: 'CF', bats: 'L', age: 31, pa: 153, h: 33, double: 7, triple: 3, hr: 4, bb: 5, so: 30, hbp: 3, sb: 6, cs: 3, sec: 'LF', fld: 65, arm: 95 },
    ],
    reserveBatters: [
      { id: 'lillibr01', name: 'Brent Lillibridge', pos: '2B', bats: 'R', age: 25, pa: 112, h: 17, double: 4, triple: 0, hr: 0, bb: 11, so: 27, hbp: 1, sb: 5, cs: 2, sec: 'SS', fld: 56, rk: true },
      { id: 'betemwi01', name: 'Wilson Betemit', pos: '1B', bats: 'S', age: 27, pa: 50, h: 11, double: 3, triple: 0, hr: 2, bb: 4, so: 14, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'buehrma01', name: 'Mark Buehrle', role: 'SP', throws: 'L', age: 30, g: 33, gs: 33, outs: 640, h: 224, hr: 24, bb: 47, so: 118, hbp: 5, er: 89, w: 13, l: 10, sv: 0, fld: 83 },
      { id: 'danksjo01', name: 'John Danks', role: 'SP', throws: 'L', age: 24, g: 32, gs: 32, outs: 601, h: 190, hr: 25, bb: 68, so: 155, hbp: 5, er: 85, w: 13, l: 11, sv: 0, fld: 72 },
      { id: 'floydga01', name: 'Gavin Floyd', role: 'SP', throws: 'R', age: 26, g: 30, gs: 30, outs: 579, h: 180, hr: 25, bb: 60, so: 149, hbp: 5, er: 86, w: 11, l: 11, sv: 0, fld: 67 },
      { id: 'richacl01', name: 'Clayton Richard', role: 'SP', throws: 'L', age: 25, g: 38, gs: 26, outs: 459, h: 161, hr: 17, bb: 66, so: 110, hbp: 2, er: 80, w: 9, l: 5, sv: 0, fld: 75, rk: true },
      { id: 'contrjo01', name: 'Jose Contreras', role: 'SP', throws: 'R', age: 37, g: 28, gs: 23, outs: 395, h: 146, hr: 13, bb: 47, so: 91, hbp: 6, er: 73, w: 6, l: 13, sv: 0 },
      { id: 'jenksbo01', name: 'Bobby Jenks', role: 'CL', throws: 'R', age: 28, g: 52, gs: 0, outs: 160, h: 48, hr: 6, bb: 15, so: 44, hbp: 1, er: 19, w: 3, l: 4, sv: 29 },
      { id: 'carradj01', name: 'D. J. Carrasco', role: 'RP', throws: 'R', age: 32, g: 49, gs: 1, outs: 280, h: 97, hr: 5, bb: 30, so: 65, hbp: 4, er: 40, w: 5, l: 1, sv: 0 },
      { id: 'thornma01', name: 'Matt Thornton', role: 'RP', throws: 'L', age: 32, g: 70, gs: 0, outs: 217, h: 58, hr: 5, bb: 22, so: 83, hbp: 2, er: 24, w: 6, l: 3, sv: 4 },
      { id: 'penato03', name: 'Tony Pena', role: 'RP', throws: 'R', age: 27, g: 72, gs: 0, outs: 210, h: 76, hr: 6, bb: 20, so: 54, hbp: 3, er: 31, w: 6, l: 5, sv: 2 },
      { id: 'doteloc01', name: 'Octavio Dotel', role: 'RP', throws: 'R', age: 35, g: 62, gs: 0, outs: 187, h: 53, hr: 9, bb: 32, so: 81, hbp: 3, er: 25, w: 3, l: 3, sv: 0 },
      { id: 'garcifr02', name: 'Freddy Garcia', role: 'RP', throws: 'R', age: 32, g: 9, gs: 9, outs: 168, h: 56, hr: 6, bb: 14, so: 39, hbp: 1, er: 28, w: 3, l: 4, sv: 0 },
    ],
    reservePitchers: [
      { id: 'colonba01', name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 36, g: 12, gs: 12, outs: 187, h: 72, hr: 11, bb: 19, so: 41, hbp: 3, er: 32, w: 3, l: 6, sv: 0 },
      { id: 'linebsc01', name: 'Scott Linebrink', role: 'RP', throws: 'R', age: 32, g: 57, gs: 0, outs: 168, h: 64, hr: 10, bb: 20, so: 53, hbp: 2, er: 28, w: 3, l: 7, sv: 2 },
      { id: 'broadla01', name: 'Lance Broadway', role: 'RP', throws: 'R', age: 25, g: 16, gs: 0, outs: 92, h: 38, hr: 2, bb: 14, so: 19, hbp: 0, er: 20, w: 0, l: 1, sv: 0, rk: true },
      { id: 'torreca01', name: 'Carlos Torres', role: 'RP', throws: 'R', age: 26, g: 8, gs: 5, outs: 85, h: 30, hr: 5, bb: 17, so: 22, hbp: 2, er: 19, w: 1, l: 2, sv: 0, rk: true },
      { id: 'hudsoda01', name: 'Daniel Hudson', role: 'RP', throws: 'R', age: 22, g: 6, gs: 2, outs: 56, h: 16, hr: 3, bb: 9, so: 14, hbp: 1, er: 7, w: 1, l: 1, sv: 0, rk: true },
    ],
  },
  // CLE (CLE 2009)
  {
    franchiseId: 'CLE',
    season: 2009,
    batters: [
      { id: 'martivi01', name: 'Victor Martinez', pos: 'C', bats: 'S', age: 30, pa: 672, h: 176, double: 36, triple: 1, hr: 20, bb: 69, so: 75, hbp: 4, sb: 1, cs: 0, sec: '1B', fld: 71, arm: 55 },
      { id: 'garkory01', name: 'Ryan Garko', pos: '1B', bats: 'R', age: 28, pa: 400, h: 97, double: 15, triple: 1, hr: 12, bb: 29, so: 58, hbp: 12, sb: 0, cs: 0, sec: '3B', fld: 72 },
      { id: 'valbulu01', name: 'Luis Valbuena', pos: '2B', bats: 'L', age: 23, pa: 398, h: 92, double: 26, triple: 3, hr: 9, bb: 26, so: 83, hbp: 1, sb: 2, cs: 3, sec: 'SS', fld: 92, rk: true },
      { id: 'peraljh01', name: 'Jhonny Peralta', pos: '3B', bats: 'R', age: 27, pa: 645, h: 154, double: 36, triple: 2, hr: 16, bb: 51, so: 132, hbp: 4, sb: 2, cs: 2, sec: 'SS', fld: 81 },
      { id: 'cabreas01', name: 'Asdrubal Cabrera', pos: 'SS', bats: 'S', age: 23, pa: 581, h: 149, double: 37, triple: 3, hr: 7, bb: 51, so: 95, hbp: 3, sb: 12, cs: 4, sec: '2B', fld: 75 },
      { id: 'francbe01', name: 'Ben Francisco', pos: 'LF', bats: 'R', age: 27, pa: 459, h: 107, double: 30, triple: 1, hr: 15, bb: 37, so: 83, hbp: 7, sb: 9, cs: 5, sec: 'RF', fld: 82, arm: 73 },
      { id: 'sizemgr01', name: 'Grady Sizemore', pos: 'CF', bats: 'L', age: 26, pa: 503, h: 112, double: 23, triple: 4, hr: 19, bb: 64, so: 93, hbp: 7, sb: 20, cs: 6, sec: 'LF', fld: 90, arm: 58 },
      { id: 'choosh01', name: 'Shin-Soo Choo', pos: 'RF', bats: 'L', age: 26, pa: 685, h: 177, double: 41, triple: 6, hr: 21, bb: 79, so: 149, hbp: 15, sb: 17, cs: 3, sec: 'LF', fld: 78, arm: 73 },
      { id: 'derosma01', name: 'Mark DeRosa', pos: 'DH', bats: 'R', age: 34, pa: 576, h: 136, double: 26, triple: 2, hr: 20, bb: 56, so: 110, hbp: 8, sb: 4, cs: 1, sec: '3B', fld: 67 },
    ],
    bench: [
      { id: 'hafnetr01', name: 'Travis Hafner', pos: 'DH', bats: 'L', age: 32, pa: 383, h: 84, double: 17, triple: 0, hr: 14, bb: 47, so: 72, hbp: 4, sb: 1, cs: 1, sec: '1B' },
      { id: 'carroja01', name: 'Jamey Carroll', pos: '2B', bats: 'R', age: 35, pa: 358, h: 84, double: 11, triple: 3, hr: 2, bb: 34, so: 59, hbp: 5, sb: 5, cs: 2, sec: '3B', fld: 54 },
      { id: 'shoppke01', name: 'Kelly Shoppach', pos: 'C', bats: 'R', age: 29, pa: 327, h: 67, double: 18, triple: 0, hr: 14, bb: 30, so: 103, hbp: 13, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 64 },
      { id: 'crowetr01', name: 'Trevor Crowe', pos: 'LF', bats: 'S', age: 25, pa: 202, h: 43, double: 9, triple: 3, hr: 1, bb: 11, so: 39, hbp: 1, sb: 6, cs: 0, sec: 'CF', fld: 79, arm: 75, rk: true },
      { id: 'laporma01', name: 'Matt LaPorta', pos: 'LF', bats: 'R', age: 24, pa: 198, h: 46, double: 13, triple: 0, hr: 7, bb: 12, so: 37, hbp: 3, sb: 2, cs: 0, sec: 'RF', fld: 68, arm: 75, rk: true },
    ],
    reserveBatters: [
      { id: 'martean01', name: 'Andy Marte', pos: '1B', bats: 'R', age: 25, pa: 175, h: 36, double: 7, triple: 1, hr: 4, bb: 11, so: 32, hbp: 1, sb: 0, cs: 1, sec: '3B', fld: 56 },
      { id: 'gimench01', name: 'Chris Gimenez', pos: '1B', bats: 'R', age: 26, pa: 130, h: 16, double: 2, triple: 0, hr: 3, bb: 17, so: 36, hbp: 0, sb: 1, cs: 1, sec: 'LF', rk: true },
      { id: 'brantmi02', name: 'Michael Brantley', pos: 'CF', bats: 'L', age: 22, pa: 121, h: 35, double: 4, triple: 0, hr: 0, bb: 8, so: 19, hbp: 0, sb: 4, cs: 4, sec: 'LF', fld: 54, arm: 55, rk: true },
      { id: 'delluda01', name: 'David Dellucci', pos: 'DH', bats: 'L', age: 35, pa: 74, h: 15, double: 4, triple: 0, hr: 2, bb: 5, so: 16, hbp: 2, sb: 1, cs: 0, sec: 'LF' },
      { id: 'marsolo01', name: 'Lou Marson', pos: 'C', bats: 'R', age: 23, pa: 72, h: 16, double: 7, triple: 0, hr: 1, bb: 10, so: 22, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 87, rk: true },
    ],
    pitchers: [
      { id: 'leecl02', name: 'Cliff Lee', role: 'SP', throws: 'L', age: 30, g: 34, gs: 34, outs: 695, h: 240, hr: 17, bb: 44, so: 178, hbp: 6, er: 83, w: 14, l: 13, sv: 0, fld: 68 },
      { id: 'pavanca01', name: 'Carl Pavano', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 598, h: 234, hr: 26, bb: 41, so: 139, hbp: 8, er: 114, w: 14, l: 12, sv: 0, fld: 70 },
      { id: 'huffda01', name: 'David Huff', role: 'SP', throws: 'L', age: 24, g: 23, gs: 23, outs: 385, h: 159, hr: 16, bb: 41, so: 65, hbp: 1, er: 80, w: 11, l: 8, sv: 0, rk: true },
      { id: 'carmofa01', name: 'Roberto Hernandez', role: 'SP', throws: 'R', age: 28, g: 24, gs: 24, outs: 376, h: 142, hr: 12, bb: 64, so: 77, hbp: 8, er: 76, w: 5, l: 12, sv: 0 },
      { id: 'sowerje01', name: 'Jeremy Sowers', role: 'SP', throws: 'L', age: 26, g: 23, gs: 22, outs: 370, h: 139, hr: 14, bb: 46, so: 55, hbp: 3, er: 75, w: 6, l: 11, sv: 0 },
      { id: 'woodke02', name: 'Kerry Wood', role: 'CL', throws: 'R', age: 32, g: 58, gs: 0, outs: 165, h: 47, hr: 5, bb: 23, so: 67, hbp: 4, er: 24, w: 3, l: 3, sv: 20 },
      { id: 'ohkato01', name: 'Tomo Ohka', role: 'RP', throws: 'R', age: 33, g: 18, gs: 6, outs: 213, h: 78, hr: 17, bb: 21, so: 30, hbp: 3, er: 46, w: 1, l: 5, sv: 0 },
      { id: 'lewisje01', name: 'Jensen Lewis', role: 'RP', throws: 'R', age: 25, g: 47, gs: 0, outs: 199, h: 64, hr: 10, bb: 28, so: 59, hbp: 3, er: 30, w: 2, l: 4, sv: 1 },
      { id: 'perezch01', name: 'Chris Perez', role: 'RP', throws: 'R', age: 23, g: 61, gs: 0, outs: 171, h: 43, hr: 8, bb: 28, so: 64, hbp: 4, er: 25, w: 1, l: 2, sv: 2, rk: true },
      { id: 'betanra01', name: 'Rafael Betancourt', role: 'RP', throws: 'R', age: 34, g: 61, gs: 0, outs: 168, h: 47, hr: 5, bb: 17, so: 56, hbp: 0, er: 20, w: 4, l: 3, sv: 2 },
      { id: 'perezra01', name: 'Rafael Perez', role: 'RP', throws: 'L', age: 27, g: 54, gs: 0, outs: 144, h: 56, hr: 5, bb: 20, so: 49, hbp: 1, er: 28, w: 4, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'laffeaa01', name: 'Aaron Laffey', role: 'SP', throws: 'L', age: 24, g: 25, gs: 19, outs: 365, h: 139, hr: 10, bb: 50, so: 59, hbp: 6, er: 60, w: 7, l: 9, sv: 1 },
      { id: 'sippto01', name: 'Tony Sipp', role: 'RP', throws: 'L', age: 25, g: 46, gs: 0, outs: 120, h: 27, hr: 5, bb: 25, so: 48, hbp: 0, er: 13, w: 2, l: 0, sv: 0, rk: true },
      { id: 'reyesan01', name: 'Anthony Reyes', role: 'RP', throws: 'R', age: 27, g: 8, gs: 8, outs: 115, h: 40, hr: 5, bb: 18, so: 24, hbp: 2, er: 23, w: 1, l: 1, sv: 0 },
      { id: 'hergema01', name: 'Matt Herges', role: 'RP', throws: 'R', age: 39, g: 30, gs: 0, outs: 104, h: 35, hr: 3, bb: 10, so: 24, hbp: 1, er: 15, w: 3, l: 1, sv: 0 },
      { id: 'smithjo05', name: 'Joe Smith', role: 'RP', throws: 'R', age: 25, g: 37, gs: 0, outs: 102, h: 29, hr: 3, bb: 15, so: 29, hbp: 2, er: 13, w: 0, l: 0, sv: 0 },
    ],
  },
  // DET (DET 2009)
  {
    franchiseId: 'DET',
    season: 2009,
    batters: [
      { id: 'lairdge01', name: 'Gerald Laird', pos: 'C', bats: 'R', age: 29, pa: 477, h: 101, double: 24, triple: 2, hr: 6, bb: 35, so: 78, hbp: 8, sb: 5, cs: 2, sec: '1B', fld: 72, arm: 82 },
      { id: 'cabremi01', name: 'Miguel Cabrera', pos: '1B', bats: 'R', age: 26, pa: 685, h: 191, double: 35, triple: 1, hr: 35, bb: 66, so: 117, hbp: 4, sb: 4, cs: 1, sec: '3B', fld: 73 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: '2B', bats: 'R', age: 33, pa: 675, h: 186, double: 34, triple: 4, hr: 9, bb: 37, so: 44, hbp: 9, sb: 7, cs: 2, sec: '3B', fld: 86 },
      { id: 'ingebr01', name: 'Brandon Inge', pos: '3B', bats: 'R', age: 32, pa: 637, h: 125, double: 20, triple: 3, hr: 23, bb: 57, so: 164, hbp: 15, sb: 4, cs: 4, sec: '1B', fld: 78 },
      { id: 'everead01', name: 'Adam Everett', pos: 'SS', bats: 'R', age: 32, pa: 390, h: 80, double: 20, triple: 1, hr: 3, bb: 24, so: 56, hbp: 3, sb: 4, cs: 2, sec: '2B', fld: 65 },
      { id: 'raburry01', name: 'Ryan Raburn', pos: 'LF', bats: 'R', age: 28, pa: 291, h: 73, double: 13, triple: 2, hr: 12, bb: 24, so: 64, hbp: 1, sb: 5, cs: 3, sec: 'RF', fld: 77, arm: 95 },
      { id: 'grandcu01', name: 'Curtis Granderson', pos: 'CF', bats: 'L', age: 28, pa: 710, h: 169, double: 28, triple: 13, hr: 27, bb: 72, so: 137, hbp: 3, sb: 19, cs: 5, sec: 'LF', fld: 73, arm: 63 },
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 35, pa: 518, h: 150, double: 28, triple: 1, hr: 14, bb: 50, so: 63, hbp: 1, sb: 2, cs: 2, sec: 'CF', fld: 56, arm: 70 },
      { id: 'guillca01', name: 'Carlos Guillen', pos: 'DH', bats: 'S', age: 33, pa: 322, h: 76, double: 15, triple: 3, hr: 9, bb: 37, so: 49, hbp: 2, sb: 4, cs: 3, sec: '3B', fld: 70, arm: 55 },
    ],
    bench: [
      { id: 'thomacl02', name: 'Clete Thomas', pos: 'RF', bats: 'L', age: 25, pa: 310, h: 68, double: 15, triple: 3, hr: 6, bb: 33, so: 73, hbp: 1, sb: 3, cs: 0, sec: 'LF', fld: 80, arm: 70 },
      { id: 'anderjo03', name: 'Josh Anderson', pos: 'LF', bats: 'L', age: 26, pa: 298, h: 73, double: 9, triple: 3, hr: 2, bb: 14, so: 48, hbp: 2, sb: 23, cs: 4, sec: 'CF', fld: 77, arm: 75 },
      { id: 'santira01', name: 'Ramon Santiago', pos: 'SS', bats: 'S', age: 29, pa: 296, h: 69, double: 8, triple: 3, hr: 7, bb: 22, so: 50, hbp: 6, sb: 2, cs: 1, sec: '2B', fld: 67 },
      { id: 'thamema01', name: 'Marcus Thames', pos: 'DH', bats: 'R', age: 32, pa: 294, h: 65, double: 11, triple: 0, hr: 17, bb: 24, so: 76, hbp: 1, sb: 0, cs: 2, sec: 'LF' },
      { id: 'larisje01', name: 'Jeff Larish', pos: 'DH', bats: 'L', age: 26, pa: 90, h: 19, double: 4, triple: 1, hr: 3, bb: 11, so: 26, hbp: 0, sb: 1, cs: 1, sec: '1B', rk: true },
    ],
    reserveBatters: [
      { id: 'avilaal01', name: 'Alex Avila', pos: 'C', bats: 'L', age: 22, pa: 72, h: 17, double: 4, triple: 0, hr: 5, bb: 10, so: 18, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 61, arm: 67, rk: true },
      { id: 'kellydo01', name: 'Don Kelly', pos: 'LF', bats: 'L', age: 29, pa: 62, h: 13, double: 3, triple: 1, hr: 0, bb: 4, so: 9, hbp: 1, sb: 1, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'verlaju01', name: 'Justin Verlander', role: 'SP', throws: 'R', age: 26, g: 35, gs: 35, outs: 720, h: 217, hr: 21, bb: 76, so: 233, hbp: 12, er: 102, w: 19, l: 9, sv: 0, fld: 62 },
      { id: 'jacksed01', name: 'Edwin Jackson', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 642, h: 211, hr: 26, bb: 80, so: 146, hbp: 4, er: 96, w: 13, l: 9, sv: 0, fld: 55 },
      { id: 'porceri01', name: 'Rick Porcello', role: 'SP', throws: 'R', age: 20, g: 31, gs: 31, outs: 512, h: 176, hr: 23, bb: 52, so: 89, hbp: 3, er: 75, w: 14, l: 9, sv: 0, fld: 74, rk: true },
      { id: 'galarar01', name: 'Armando Galarraga', role: 'SP', throws: 'R', age: 27, g: 29, gs: 25, outs: 431, h: 147, hr: 24, bb: 62, so: 102, hbp: 6, er: 79, w: 6, l: 10, sv: 0, fld: 57 },
      { id: 'rodnefe01', name: 'Fernando Rodney', role: 'CL', throws: 'R', age: 32, g: 73, gs: 0, outs: 227, h: 68, hr: 7, bb: 43, so: 70, hbp: 3, er: 38, w: 2, l: 5, sv: 37 },
      { id: 'minerza01', name: 'Zach Miner', role: 'RP', throws: 'R', age: 27, g: 51, gs: 5, outs: 277, h: 99, hr: 9, bb: 41, so: 57, hbp: 3, er: 43, w: 7, l: 5, sv: 1 },
      { id: 'lyonbr01', name: 'Brandon Lyon', role: 'RP', throws: 'R', age: 29, g: 65, gs: 0, outs: 236, h: 69, hr: 7, bb: 25, so: 53, hbp: 1, er: 28, w: 6, l: 5, sv: 3 },
      { id: 'perryry01', name: 'Ryan Perry', role: 'RP', throws: 'R', age: 22, g: 53, gs: 0, outs: 185, h: 56, hr: 7, bb: 38, so: 60, hbp: 1, er: 26, w: 0, l: 1, sv: 0, rk: true },
      { id: 'roberna01', name: 'Nate Robertson', role: 'RP', throws: 'L', age: 31, g: 28, gs: 6, outs: 149, h: 63, hr: 7, bb: 21, so: 34, hbp: 1, er: 33, w: 2, l: 3, sv: 0 },
      { id: 'seaybo01', name: 'Bobby Seay', role: 'RP', throws: 'L', age: 31, g: 67, gs: 0, outs: 146, h: 47, hr: 3, bb: 18, so: 42, hbp: 2, er: 22, w: 6, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'bonined01', name: 'Eddie Bonine', role: 'RP', throws: 'R', age: 28, g: 10, gs: 4, outs: 103, h: 42, hr: 6, bb: 10, so: 16, hbp: 2, er: 18, w: 1, l: 1, sv: 0, rk: true },
      { id: 'willido03', name: 'Dontrelle Willis', role: 'RP', throws: 'L', age: 27, g: 7, gs: 7, outs: 101, h: 38, hr: 5, bb: 24, so: 23, hbp: 2, er: 25, w: 1, l: 4, sv: 0 },
      { id: 'nifu01', name: 'Fu-Te Ni', role: 'RP', throws: 'L', age: 26, g: 36, gs: 0, outs: 93, h: 20, hr: 3, bb: 11, so: 21, hbp: 1, er: 9, w: 0, l: 0, sv: 0, rk: true },
      { id: 'zumayjo01', name: 'Joel Zumaya', role: 'RP', throws: 'R', age: 24, g: 29, gs: 0, outs: 93, h: 31, hr: 4, bb: 23, so: 29, hbp: 1, er: 15, w: 3, l: 3, sv: 1 },
      { id: 'figaral01', name: 'Alfredo Figaro', role: 'RP', throws: 'R', age: 24, g: 5, gs: 3, outs: 51, h: 23, hr: 3, bb: 10, so: 16, hbp: 1, er: 12, w: 2, l: 2, sv: 0, rk: true },
    ],
  },
  // KCR (KCA 2009)
  {
    franchiseId: 'KCR',
    season: 2009,
    batters: [
      { id: 'olivomi01', name: 'Miguel Olivo', pos: 'C', bats: 'R', age: 30, pa: 416, h: 98, double: 19, triple: 3, hr: 19, bb: 15, so: 118, hbp: 4, sb: 6, cs: 1, sec: '1B', fld: 64, arm: 69 },
      { id: 'butlebi03', name: 'Billy Butler', pos: '1B', bats: 'R', age: 23, pa: 672, h: 179, double: 44, triple: 1, hr: 19, bb: 54, so: 96, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 67 },
      { id: 'callaal01', name: 'Alberto Callaspo', pos: '2B', bats: 'S', age: 26, pa: 634, h: 171, double: 37, triple: 8, hr: 8, bb: 51, so: 49, hbp: 1, sb: 3, cs: 2, sec: '3B', fld: 49 },
      { id: 'teahema01', name: 'Mark Teahen', pos: '3B', bats: 'L', age: 27, pa: 571, h: 140, double: 31, triple: 3, hr: 12, bb: 41, so: 121, hbp: 4, sb: 7, cs: 2, sec: '1B', fld: 62 },
      { id: 'betanyu01', name: 'Yuniesky Betancourt', pos: 'SS', bats: 'R', age: 27, pa: 508, h: 126, double: 26, triple: 4, hr: 6, bb: 17, so: 41, hbp: 1, sb: 3, cs: 3, sec: '2B', fld: 66 },
      { id: 'dejesda01', name: 'David DeJesus', pos: 'LF', bats: 'L', age: 29, pa: 627, h: 159, double: 27, triple: 8, hr: 12, bb: 52, so: 82, hbp: 10, sb: 7, cs: 8, sec: 'CF', fld: 82, arm: 79 },
      { id: 'maiermi01', name: 'Mitch Maier', pos: 'CF', bats: 'L', age: 27, pa: 397, h: 86, double: 13, triple: 3, hr: 3, bb: 38, so: 76, hbp: 5, sb: 8, cs: 3, sec: 'RF', fld: 79, arm: 88, rk: true },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'RF', bats: 'R', age: 33, pa: 312, h: 75, double: 15, triple: 0, hr: 10, bb: 17, so: 52, hbp: 7, sb: 1, cs: 0, sec: 'LF', fld: 48, arm: 70 },
      { id: 'jacobmi02', name: 'Mike Jacobs', pos: 'DH', bats: 'L', age: 28, pa: 478, h: 105, double: 21, triple: 1, hr: 22, bb: 37, so: 120, hbp: 2, sb: 0, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'bloomwi01', name: 'Willie Bloomquist', pos: 'RF', bats: 'R', age: 31, pa: 468, h: 115, double: 9, triple: 6, hr: 3, bb: 33, so: 74, hbp: 1, sb: 26, cs: 7, sec: 'CF', fld: 74, arm: 65 },
      { id: 'crispco01', name: 'Coco Crisp', pos: 'CF', bats: 'S', age: 29, pa: 215, h: 49, double: 9, triple: 3, hr: 3, bb: 22, so: 28, hbp: 1, sb: 11, cs: 3, sec: 'LF', fld: 63, arm: 55 },
      { id: 'buckjo01', name: 'John Buck', pos: 'C', bats: 'R', age: 28, pa: 202, h: 42, double: 11, triple: 2, hr: 7, bb: 17, so: 49, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 61, arm: 58 },
      { id: 'gordoal01', name: 'Alex Gordon', pos: '3B', bats: 'L', age: 25, pa: 189, h: 41, double: 10, triple: 0, hr: 5, bb: 19, so: 41, hbp: 3, sb: 4, cs: 1, sec: '1B', fld: 61 },
      { id: 'penabr01', name: 'Brayan Pena', pos: 'C', bats: 'S', age: 27, pa: 183, h: 45, double: 10, triple: 0, hr: 6, bb: 11, so: 18, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 75 },
    ],
    reserveBatters: [
      { id: 'avilemi01', name: 'Mike Aviles', pos: 'SS', bats: 'R', age: 28, pa: 127, h: 34, double: 6, triple: 1, hr: 2, bb: 5, so: 20, hbp: 0, sb: 2, cs: 1, sec: '2B', fld: 83 },
      { id: 'freelry01', name: 'Ryan Freel', pos: 'RF', bats: 'R', age: 33, pa: 101, h: 22, double: 4, triple: 0, hr: 0, bb: 8, so: 17, hbp: 1, sb: 3, cs: 2, sec: 'CF', fld: 51, arm: 68 },
      { id: 'hernalu01', name: 'Luis Hernandez', pos: 'SS', bats: 'S', age: 25, pa: 81, h: 17, double: 1, triple: 0, hr: 0, bb: 4, so: 14, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 83 },
      { id: 'penato02', name: 'Tony Pena', pos: 'SS', bats: 'R', age: 28, pa: 53, h: 10, double: 2, triple: 0, hr: 0, bb: 1, so: 10, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 47 },
    ],
    pitchers: [
      { id: 'greinza01', name: 'Zack Greinke', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 688, h: 205, hr: 16, bb: 56, so: 221, hbp: 4, er: 69, w: 16, l: 8, sv: 0, fld: 74 },
      { id: 'bannibr01', name: 'Brian Bannister', role: 'SP', throws: 'R', age: 28, g: 26, gs: 26, outs: 462, h: 165, hr: 18, bb: 48, so: 92, hbp: 5, er: 85, w: 7, l: 12, sv: 0, fld: 79 },
      { id: 'hochelu01', name: 'Luke Hochevar', role: 'SP', throws: 'R', age: 25, g: 25, gs: 25, outs: 429, h: 164, hr: 19, bb: 48, so: 96, hbp: 8, er: 97, w: 7, l: 13, sv: 0, fld: 77 },
      { id: 'mechegi01', name: 'Gil Meche', role: 'SP', throws: 'R', age: 30, g: 23, gs: 23, outs: 387, h: 138, hr: 15, bb: 50, so: 106, hbp: 2, er: 65, w: 6, l: 10, sv: 0 },
      { id: 'davieky01', name: 'Kyle Davies', role: 'SP', throws: 'R', age: 25, g: 22, gs: 22, outs: 369, h: 129, hr: 16, bb: 60, so: 84, hbp: 4, er: 69, w: 8, l: 9, sv: 0 },
      { id: 'soriajo01', name: 'Joakim Soria', role: 'CL', throws: 'R', age: 25, g: 47, gs: 0, outs: 159, h: 39, hr: 4, bb: 16, so: 62, hbp: 3, er: 12, w: 3, l: 2, sv: 30 },
      { id: 'wrighja01', name: 'Jamey Wright', role: 'RP', throws: 'R', age: 34, g: 65, gs: 0, outs: 237, h: 78, hr: 7, bb: 40, so: 55, hbp: 7, er: 39, w: 3, l: 5, sv: 0 },
      { id: 'tejedro01', name: 'Rob Tejeda', role: 'RP', throws: 'R', age: 27, g: 35, gs: 6, outs: 221, h: 52, hr: 7, bb: 46, so: 74, hbp: 3, er: 35, w: 4, l: 2, sv: 0 },
      { id: 'chenbr01', name: 'Bruce Chen', role: 'RP', throws: 'L', age: 32, g: 17, gs: 9, outs: 187, h: 74, hr: 12, bb: 26, so: 45, hbp: 4, er: 40, w: 1, l: 6, sv: 0 },
      { id: 'ponsosi01', name: 'Sidney Ponson', role: 'RP', throws: 'R', age: 32, g: 14, gs: 9, outs: 176, h: 77, hr: 7, bb: 23, so: 29, hbp: 3, er: 40, w: 1, l: 7, sv: 0 },
      { id: 'colonro01', name: 'Roman Colon', role: 'RP', throws: 'R', age: 29, g: 43, gs: 0, outs: 151, h: 50, hr: 7, bb: 22, so: 29, hbp: 2, er: 27, w: 2, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'cruzju02', name: 'Juan Cruz', role: 'RP', throws: 'R', age: 30, g: 46, gs: 0, outs: 151, h: 41, hr: 6, bb: 30, so: 56, hbp: 2, er: 24, w: 3, l: 4, sv: 2 },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 38, g: 57, gs: 0, outs: 151, h: 55, hr: 7, bb: 24, so: 42, hbp: 2, er: 21, w: 2, l: 1, sv: 0 },
      { id: 'farnsky01', name: 'Kyle Farnsworth', role: 'RP', throws: 'R', age: 33, g: 41, gs: 0, outs: 112, h: 42, hr: 6, bb: 14, so: 38, hbp: 1, er: 19, w: 1, l: 5, sv: 0 },
      { id: 'balejo01', name: 'John Bale', role: 'RP', throws: 'L', age: 35, g: 43, gs: 0, outs: 85, h: 34, hr: 2, bb: 14, so: 24, hbp: 1, er: 16, w: 0, l: 1, sv: 1 },
      { id: 'ramirho01', name: 'Horacio Ramirez', role: 'RP', throws: 'L', age: 29, g: 19, gs: 1, outs: 68, h: 29, hr: 2, bb: 9, so: 10, hbp: 1, er: 15, w: 0, l: 2, sv: 0 },
    ],
  },
  // MIN (MIN 2009)
  {
    franchiseId: 'MIN',
    season: 2009,
    batters: [
      { id: 'mauerjo01', name: 'Joe Mauer', pos: 'C', bats: 'L', age: 26, pa: 606, h: 178, double: 31, triple: 2, hr: 19, bb: 77, so: 58, hbp: 2, sb: 4, cs: 1, sec: '1B', fld: 71, arm: 67 },
      { id: 'morneju01', name: 'Justin Morneau', pos: '1B', bats: 'L', age: 28, pa: 590, h: 145, double: 33, triple: 2, hr: 26, bb: 66, so: 79, hbp: 3, sb: 0, cs: 0, sec: '3B', fld: 78 },
      { id: 'puntoni01', name: 'Nick Punto', pos: '2B', bats: 'S', age: 31, pa: 440, h: 91, double: 17, triple: 3, hr: 1, bb: 51, so: 70, hbp: 1, sb: 16, cs: 5, sec: '3B', fld: 72 },
      { id: 'credejo01', name: 'Joe Crede', pos: '3B', bats: 'R', age: 31, pa: 367, h: 77, double: 16, triple: 1, hr: 15, bb: 28, so: 51, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 87 },
      { id: 'harribr01', name: 'Brendan Harris', pos: 'SS', bats: 'R', age: 28, pa: 453, h: 109, double: 25, triple: 2, hr: 7, bb: 32, so: 82, hbp: 3, sb: 1, cs: 1, sec: '2B', fld: 65 },
      { id: 'youngde03', name: 'Delmon Young', pos: 'LF', bats: 'R', age: 23, pa: 416, h: 112, double: 19, triple: 2, hr: 9, bb: 17, so: 80, hbp: 4, sb: 6, cs: 4, sec: 'RF', fld: 64, arm: 67 },
      { id: 'gomezca01', name: 'Carlos Gomez', pos: 'CF', bats: 'R', age: 23, pa: 349, h: 79, double: 14, triple: 4, hr: 4, bb: 18, so: 76, hbp: 4, sb: 17, cs: 7, sec: 'LF', fld: 100, arm: 64 },
      { id: 'cuddymi01', name: 'Michael Cuddyer', pos: 'RF', bats: 'R', age: 30, pa: 650, h: 158, double: 32, triple: 7, hr: 24, bb: 57, so: 112, hbp: 7, sb: 7, cs: 1, sec: '1B', fld: 64, arm: 64 },
      { id: 'kubelja01', name: 'Jason Kubel', pos: 'DH', bats: 'L', age: 27, pa: 578, h: 148, double: 32, triple: 3, hr: 24, bb: 54, so: 103, hbp: 2, sb: 1, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'spande01', name: 'Denard Span', pos: 'CF', bats: 'L', age: 25, pa: 676, h: 176, double: 19, triple: 10, hr: 9, bb: 74, so: 92, hbp: 9, sb: 25, cs: 10, sec: 'RF', fld: 65, arm: 67 },
      { id: 'casilal01', name: 'Alexi Casilla', pos: '2B', bats: 'S', age: 24, pa: 256, h: 55, double: 8, triple: 1, hr: 2, bb: 19, so: 31, hbp: 2, sb: 8, cs: 1, sec: 'SS', fld: 69 },
      { id: 'tolbema01', name: 'Matt Tolbert', pos: '2B', bats: 'S', age: 27, pa: 231, h: 50, double: 8, triple: 2, hr: 1, bb: 19, so: 37, hbp: 0, sb: 8, cs: 2, sec: '3B', fld: 100, rk: true },
      { id: 'buschbr01', name: 'Brian Buscher', pos: '3B', bats: 'L', age: 28, pa: 164, h: 37, double: 4, triple: 0, hr: 2, bb: 18, so: 31, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 61 },
      { id: 'redmomi01', name: 'Mike Redmond', pos: 'C', bats: 'R', age: 38, pa: 147, h: 36, double: 6, triple: 0, hr: 0, bb: 9, so: 15, hbp: 2, sb: 0, cs: 0, fld: 77, arm: 54 },
    ],
    reserveBatters: [
      { id: 'moraljo02', name: 'Jose Morales', pos: 'C', bats: 'S', age: 26, pa: 134, h: 38, double: 6, triple: 0, hr: 0, bb: 14, so: 22, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 46, arm: 71, rk: true },
    ],
    pitchers: [
      { id: 'blackni01', name: 'Nick Blackburn', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 617, h: 240, hr: 25, bb: 41, so: 100, hbp: 5, er: 93, w: 11, l: 11, sv: 0, fld: 80 },
      { id: 'bakersc02', name: 'Scott Baker', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 600, h: 193, hr: 25, bb: 47, so: 159, hbp: 4, er: 90, w: 15, l: 9, sv: 0, fld: 64 },
      { id: 'liriafr01', name: 'Francisco Liriano', role: 'SP', throws: 'L', age: 25, g: 29, gs: 24, outs: 410, h: 145, hr: 19, bb: 64, so: 123, hbp: 5, er: 81, w: 5, l: 13, sv: 0, fld: 62 },
      { id: 'perkigl01', name: 'Glen Perkins', role: 'SP', throws: 'L', age: 26, g: 18, gs: 17, outs: 289, h: 117, hr: 14, bb: 25, so: 47, hbp: 2, er: 54, w: 6, l: 7, sv: 0 },
      { id: 'sloweke01', name: 'Kevin Slowey', role: 'SP', throws: 'R', age: 25, g: 16, gs: 16, outs: 272, h: 106, hr: 15, bb: 15, so: 74, hbp: 3, er: 46, w: 10, l: 3, sv: 0 },
      { id: 'nathajo01', name: 'Joe Nathan', role: 'CL', throws: 'R', age: 34, g: 70, gs: 0, outs: 206, h: 44, hr: 6, bb: 20, so: 82, hbp: 2, er: 14, w: 2, l: 2, sv: 47 },
      { id: 'duensbr01', name: 'Brian Duensing', role: 'RP', throws: 'L', age: 26, g: 24, gs: 9, outs: 252, h: 84, hr: 7, bb: 31, so: 53, hbp: 3, er: 34, w: 5, l: 2, sv: 0, rk: true },
      { id: 'guerrma02', name: 'Matt Guerrier', role: 'RP', throws: 'R', age: 30, g: 79, gs: 0, outs: 229, h: 64, hr: 10, bb: 22, so: 51, hbp: 3, er: 26, w: 5, l: 1, sv: 1 },
      { id: 'dickera01', name: 'R. A. Dickey', role: 'RP', throws: 'R', age: 34, g: 35, gs: 1, outs: 193, h: 73, hr: 8, bb: 30, so: 38, hbp: 2, er: 36, w: 1, l: 1, sv: 0 },
      { id: 'mijarjo01', name: 'Jose Mijares', role: 'RP', throws: 'L', age: 24, g: 71, gs: 0, outs: 185, h: 48, hr: 6, bb: 21, so: 54, hbp: 2, er: 15, w: 2, l: 2, sv: 0, rk: true },
      { id: 'keppebo01', name: 'Bobby Keppel', role: 'RP', throws: 'R', age: 27, g: 37, gs: 0, outs: 162, h: 63, hr: 4, bb: 21, so: 31, hbp: 5, er: 30, w: 1, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'swarzan01', name: 'Anthony Swarzak', role: 'SP', throws: 'R', age: 23, g: 12, gs: 12, outs: 177, h: 76, hr: 12, bb: 20, so: 34, hbp: 2, er: 41, w: 3, l: 7, sv: 0, rk: true },
      { id: 'crainje01', name: 'Jesse Crain', role: 'RP', throws: 'R', age: 27, g: 56, gs: 0, outs: 155, h: 51, hr: 4, bb: 24, so: 42, hbp: 3, er: 25, w: 7, l: 4, sv: 0 },
      { id: 'ayalalu01', name: 'Luis Ayala', role: 'RP', throws: 'R', age: 31, g: 38, gs: 0, outs: 120, h: 48, hr: 5, bb: 13, so: 28, hbp: 3, er: 24, w: 1, l: 5, sv: 0 },
      { id: 'manshje01', name: 'Jeff Manship', role: 'RP', throws: 'R', age: 24, g: 11, gs: 5, outs: 95, h: 39, hr: 4, bb: 15, so: 21, hbp: 1, er: 20, w: 1, l: 1, sv: 0, rk: true },
      { id: 'hennse01', name: 'Sean Henn', role: 'RP', throws: 'L', age: 28, g: 20, gs: 0, outs: 43, h: 16, hr: 2, bb: 12, so: 13, hbp: 1, er: 12, w: 0, l: 3, sv: 0 },
    ],
  },
  // HOU (HOU 2009)
  {
    franchiseId: 'HOU',
    season: 2009,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 37, pa: 448, h: 112, double: 23, triple: 2, hr: 9, bb: 18, so: 83, hbp: 2, sb: 4, cs: 2, fld: 69, arm: 75 },
      { id: 'berkmla01', name: 'Lance Berkman', pos: '1B', bats: 'S', age: 33, pa: 562, h: 134, double: 32, triple: 2, hr: 25, bb: 89, so: 97, hbp: 4, sb: 10, cs: 4, sec: 'LF', fld: 82 },
      { id: 'matsuka01', name: 'Kazuo Matsui', pos: '2B', bats: 'S', age: 33, pa: 533, h: 128, double: 25, triple: 3, hr: 8, bb: 39, so: 79, hbp: 2, sb: 24, cs: 4, sec: 'SS', fld: 92 },
      { id: 'blumge01', name: 'Geoff Blum', pos: '3B', bats: 'S', age: 36, pa: 427, h: 94, double: 16, triple: 1, hr: 11, bb: 31, so: 62, hbp: 5, sb: 0, cs: 1, sec: '2B', fld: 60 },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: 'SS', bats: 'R', age: 35, pa: 673, h: 190, double: 40, triple: 2, hr: 15, bb: 25, so: 59, hbp: 9, sb: 5, cs: 4, fld: 73 },
      { id: 'leeca01', name: 'Carlos Lee', pos: 'LF', bats: 'R', age: 33, pa: 662, h: 184, double: 37, triple: 1, hr: 30, bb: 45, so: 57, hbp: 3, sb: 6, cs: 3, sec: 'RF', fld: 57, arm: 71 },
      { id: 'bournmi01', name: 'Michael Bourn', pos: 'CF', bats: 'L', age: 26, pa: 678, h: 163, double: 22, triple: 10, hr: 4, bb: 59, so: 141, hbp: 2, sb: 60, cs: 12, sec: 'LF', fld: 71, arm: 77 },
      { id: 'pencehu01', name: 'Hunter Pence', pos: 'RF', bats: 'R', age: 26, pa: 647, h: 168, double: 31, triple: 6, hr: 25, bb: 49, so: 117, hbp: 2, sb: 13, cs: 10, sec: 'CF', fld: 73, arm: 80 },
      { id: 'keppije01', name: 'Jeff Keppinger', pos: 'DH', bats: 'R', age: 29, pa: 344, h: 83, double: 15, triple: 2, hr: 5, bb: 25, so: 24, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 73 },
    ],
    bench: [
      { id: 'quinthu01', name: 'Humberto Quintero', pos: 'C', bats: 'R', age: 29, pa: 168, h: 36, double: 7, triple: 1, hr: 3, bb: 6, so: 37, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 63, arm: 86 },
      { id: 'michaja01', name: 'Jason Michaels', pos: 'LF', bats: 'R', age: 33, pa: 152, h: 32, double: 8, triple: 1, hr: 4, bb: 13, so: 32, hbp: 1, sb: 1, cs: 1, sec: 'CF', fld: 78, arm: 55 },
      { id: 'erstada01', name: 'Darin Erstad', pos: 'LF', bats: 'L', age: 35, pa: 150, h: 34, double: 7, triple: 1, hr: 2, bb: 10, so: 28, hbp: 0, sb: 1, cs: 1, sec: '1B' },
      { id: 'maysoed01', name: 'Edwin Maysonet', pos: '2B', bats: 'R', age: 27, pa: 79, h: 20, double: 2, triple: 0, hr: 1, bb: 5, so: 19, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
      { id: 'towlejr01', name: 'J. R. Towles', pos: 'C', bats: 'R', age: 25, pa: 53, h: 8, double: 2, triple: 0, hr: 1, bb: 4, so: 13, hbp: 2, sb: 0, cs: 0, sec: '1B' },
    ],
    reserveBatters: [
      { id: 'katama01', name: 'Matt Kata', pos: '2B', bats: 'S', age: 31, pa: 52, h: 10, double: 2, triple: 0, hr: 0, bb: 1, so: 8, hbp: 1, sb: 1, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'rodriwa01', name: 'Wandy Rodriguez', role: 'SP', throws: 'L', age: 30, g: 33, gs: 33, outs: 617, h: 195, hr: 21, bb: 64, so: 190, hbp: 6, er: 77, w: 14, l: 12, sv: 0, fld: 68 },
      { id: 'oswalro01', name: 'Roy Oswalt', role: 'SP', throws: 'R', age: 31, g: 30, gs: 30, outs: 544, h: 181, hr: 18, bb: 43, so: 139, hbp: 8, er: 76, w: 8, l: 6, sv: 0, fld: 79 },
      { id: 'moehlbr01', name: 'Brian Moehler', role: 'SP', throws: 'R', age: 37, g: 29, gs: 29, outs: 464, h: 184, hr: 21, bb: 46, so: 90, hbp: 4, er: 88, w: 8, l: 12, sv: 0, fld: 76 },
      { id: 'hamptmi01', name: 'Mike Hampton', role: 'SP', throws: 'L', age: 36, g: 21, gs: 21, outs: 336, h: 126, hr: 14, bb: 45, so: 68, hbp: 2, er: 65, w: 7, l: 10, sv: 0 },
      { id: 'paulife01', name: 'Felipe Paulino', role: 'SP', throws: 'R', age: 25, g: 23, gs: 17, outs: 293, h: 126, hr: 20, bb: 37, so: 91, hbp: 4, er: 69, w: 3, l: 11, sv: 0, rk: true },
      { id: 'valvejo01', name: 'Jose Valverde', role: 'CL', throws: 'R', age: 31, g: 52, gs: 0, outs: 162, h: 42, hr: 6, bb: 20, so: 60, hbp: 2, er: 17, w: 4, l: 2, sv: 25 },
      { id: 'fulchje01', name: 'Jeff Fulchino', role: 'RP', throws: 'R', age: 29, g: 61, gs: 0, outs: 246, h: 74, hr: 7, bb: 28, so: 69, hbp: 3, er: 35, w: 6, l: 4, sv: 0, rk: true },
      { id: 'hawkila01', name: 'LaTroy Hawkins', role: 'RP', throws: 'R', age: 36, g: 65, gs: 0, outs: 190, h: 58, hr: 6, bb: 19, so: 45, hbp: 1, er: 21, w: 1, l: 4, sv: 11 },
      { id: 'byrdati01', name: 'Tim Byrdak', role: 'RP', throws: 'L', age: 35, g: 76, gs: 0, outs: 184, h: 44, hr: 9, bb: 34, so: 56, hbp: 2, er: 23, w: 1, l: 2, sv: 0 },
      { id: 'sampsch01', name: 'Chris Sampson', role: 'RP', throws: 'R', age: 31, g: 49, gs: 0, outs: 166, h: 63, hr: 5, bb: 15, so: 30, hbp: 1, er: 29, w: 4, l: 2, sv: 3 },
      { id: 'ariasal02', name: 'Alberto Arias', role: 'RP', throws: 'R', age: 25, g: 42, gs: 0, outs: 137, h: 49, hr: 1, bb: 20, so: 35, hbp: 5, er: 18, w: 2, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'ortizru01', name: 'Russ Ortiz', role: 'SP', throws: 'R', age: 35, g: 23, gs: 13, outs: 257, h: 96, hr: 8, bb: 46, so: 62, hbp: 5, er: 53, w: 3, l: 6, sv: 0 },
      { id: 'norribu01', name: 'Bud Norris', role: 'SP', throws: 'R', age: 24, g: 11, gs: 10, outs: 167, h: 59, hr: 9, bb: 25, so: 54, hbp: 3, er: 28, w: 6, l: 3, sv: 0, rk: true },
      { id: 'wrighwe01', name: 'Wesley Wright', role: 'RP', throws: 'L', age: 24, g: 49, gs: 0, outs: 134, h: 46, hr: 8, bb: 27, so: 48, hbp: 1, er: 27, w: 3, l: 4, sv: 0 },
      { id: 'bazaryo01', name: 'Yorman Bazardo', role: 'RP', throws: 'R', age: 24, g: 10, gs: 6, outs: 96, h: 37, hr: 2, bb: 21, so: 18, hbp: 2, er: 27, w: 1, l: 3, sv: 0, rk: true },
      { id: 'gervasa01', name: 'Sammy Gervacio', role: 'RP', throws: 'R', age: 24, g: 29, gs: 0, outs: 63, h: 16, hr: 1, bb: 8, so: 25, hbp: 1, er: 5, w: 1, l: 1, sv: 0, rk: true },
    ],
  },
  // LAA (LAA 2009)
  {
    franchiseId: 'LAA',
    season: 2009,
    batters: [
      { id: 'napolmi01', name: 'Mike Napoli', pos: 'C', bats: 'R', age: 27, pa: 432, h: 100, double: 19, triple: 1, hr: 23, bb: 46, so: 105, hbp: 7, sb: 6, cs: 3, sec: '1B', fld: 66, arm: 63 },
      { id: 'moralke01', name: 'Kendrys Morales', pos: '1B', bats: 'S', age: 26, pa: 622, h: 170, double: 42, triple: 2, hr: 33, bb: 45, so: 113, hbp: 3, sb: 3, cs: 7, sec: '3B', fld: 68 },
      { id: 'izturma01', name: 'Maicer Izturis', pos: '2B', bats: 'S', age: 28, pa: 437, h: 113, double: 21, triple: 3, hr: 7, bb: 36, so: 41, hbp: 3, sb: 13, cs: 4, sec: '3B', fld: 68 },
      { id: 'figgich01', name: 'Chone Figgins', pos: '3B', bats: 'S', age: 31, pa: 729, h: 185, double: 28, triple: 6, hr: 4, bb: 93, so: 114, hbp: 2, sb: 46, cs: 17, sec: '2B', fld: 85 },
      { id: 'aybarer01', name: 'Erick Aybar', pos: 'SS', bats: 'S', age: 25, pa: 556, h: 150, double: 23, triple: 8, hr: 5, bb: 27, so: 60, hbp: 6, sb: 13, cs: 6, sec: '2B', fld: 81 },
      { id: 'riverju01', name: 'Juan Rivera', pos: 'LF', bats: 'R', age: 30, pa: 572, h: 146, double: 24, triple: 1, hr: 25, bb: 35, so: 59, hbp: 1, sb: 0, cs: 1, sec: 'RF', fld: 72, arm: 79 },
      { id: 'hunteto01', name: 'Torii Hunter', pos: 'CF', bats: 'R', age: 33, pa: 506, h: 132, double: 29, triple: 1, hr: 20, bb: 42, so: 89, hbp: 4, sb: 16, cs: 5, sec: 'LF', fld: 86, arm: 60 },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 35, pa: 667, h: 168, double: 34, triple: 4, hr: 17, bb: 84, so: 110, hbp: 1, sb: 26, cs: 9, sec: 'LF', fld: 68, arm: 73 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'DH', bats: 'R', age: 34, pa: 407, h: 113, double: 20, triple: 1, hr: 17, bb: 30, so: 51, hbp: 4, sb: 2, cs: 2, sec: 'RF' },
    ],
    bench: [
      { id: 'kendrho01', name: 'Howie Kendrick', pos: '2B', bats: 'R', age: 25, pa: 400, h: 113, double: 24, triple: 3, hr: 7, bb: 16, so: 69, hbp: 4, sb: 11, cs: 4, sec: 'SS', fld: 71 },
      { id: 'matthga02', name: 'Gary Matthews', pos: 'CF', bats: 'S', age: 34, pa: 360, h: 79, double: 17, triple: 2, hr: 6, bb: 37, so: 71, hbp: 2, sb: 6, cs: 2, sec: 'RF', fld: 58, arm: 62 },
      { id: 'mathije01', name: 'Jeff Mathis', pos: 'C', bats: 'R', age: 26, pa: 272, h: 48, double: 8, triple: 0, hr: 6, bb: 23, so: 73, hbp: 3, sb: 2, cs: 2, sec: '1B', fld: 65, arm: 67 },
      { id: 'quinlro01', name: 'Robb Quinlan', pos: '1B', bats: 'R', age: 32, pa: 120, h: 28, double: 3, triple: 1, hr: 1, bb: 7, so: 23, hbp: 1, sb: 2, cs: 1, sec: '3B' },
      { id: 'willire03', name: 'Reggie Willits', pos: 'LF', bats: 'S', age: 28, pa: 92, h: 19, double: 3, triple: 0, hr: 0, bb: 11, so: 16, hbp: 0, sb: 4, cs: 1, sec: 'RF', fld: 62, arm: 55 },
    ],
    reserveBatters: [
      { id: 'woodbr01', name: 'Brandon Wood', pos: '3B', bats: 'R', age: 24, pa: 46, h: 8, double: 1, triple: 0, hr: 1, bb: 2, so: 15, hbp: 0, sb: 1, cs: 0, sec: 'SS' },
    ],
    pitchers: [
      { id: 'weaveje02', name: 'Jered Weaver', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 633, h: 203, hr: 25, bb: 64, so: 172, hbp: 5, er: 92, w: 16, l: 8, sv: 0, fld: 63 },
      { id: 'saundjo01', name: 'Joe Saunders', role: 'SP', throws: 'L', age: 28, g: 31, gs: 31, outs: 558, h: 198, hr: 25, bb: 59, so: 103, hbp: 6, er: 87, w: 16, l: 7, sv: 0, fld: 68 },
      { id: 'lackejo01', name: 'John Lackey', role: 'SP', throws: 'R', age: 30, g: 27, gs: 27, outs: 529, h: 176, hr: 20, bb: 45, so: 140, hbp: 10, er: 72, w: 11, l: 8, sv: 0, fld: 72 },
      { id: 'santaer01', name: 'Ervin Santana', role: 'SP', throws: 'R', age: 26, g: 24, gs: 23, outs: 419, h: 151, hr: 21, bb: 42, so: 126, hbp: 8, er: 72, w: 8, l: 8, sv: 0, fld: 56 },
      { id: 'palmema01', name: 'Matt Palmer', role: 'SP', throws: 'R', age: 30, g: 40, gs: 13, outs: 364, h: 107, hr: 12, bb: 58, so: 65, hbp: 5, er: 56, w: 11, l: 2, sv: 0, rk: true },
      { id: 'fuentbr01', name: 'Brian Fuentes', role: 'CL', throws: 'L', age: 33, g: 65, gs: 0, outs: 165, h: 49, hr: 5, bb: 23, so: 58, hbp: 4, er: 21, w: 1, l: 5, sv: 48 },
      { id: 'oliveda02', name: 'Darren Oliver', role: 'RP', throws: 'L', age: 38, g: 63, gs: 1, outs: 219, h: 64, hr: 5, bb: 21, so: 58, hbp: 4, er: 24, w: 5, l: 1, sv: 0 },
      { id: 'bulgeja01', name: 'Jason Bulger', role: 'RP', throws: 'R', age: 30, g: 64, gs: 0, outs: 197, h: 48, hr: 7, bb: 31, so: 69, hbp: 2, er: 29, w: 6, l: 1, sv: 1, rk: true },
      { id: 'louxsh01', name: 'Shane Loux', role: 'RP', throws: 'R', age: 29, g: 18, gs: 6, outs: 175, h: 82, hr: 4, bb: 18, so: 19, hbp: 5, er: 36, w: 2, l: 3, sv: 0 },
      { id: 'jepseke01', name: 'Kevin Jepsen', role: 'RP', throws: 'R', age: 24, g: 54, gs: 0, outs: 164, h: 62, hr: 2, bb: 20, so: 48, hbp: 0, er: 30, w: 6, l: 4, sv: 1, rk: true },
      { id: 'arredjo01', name: 'Jose Arredondo', role: 'RP', throws: 'R', age: 25, g: 43, gs: 0, outs: 135, h: 42, hr: 4, bb: 21, so: 46, hbp: 0, er: 21, w: 2, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'osullse01', name: 'Sean O\'Sullivan', role: 'SP', throws: 'R', age: 21, g: 12, gs: 10, outs: 155, h: 60, hr: 12, bb: 16, so: 29, hbp: 1, er: 34, w: 4, l: 2, sv: 0, rk: true },
      { id: 'speieju01', name: 'Justin Speier', role: 'RP', throws: 'R', age: 35, g: 41, gs: 0, outs: 120, h: 41, hr: 8, bb: 15, so: 37, hbp: 4, er: 22, w: 4, l: 2, sv: 0 },
      { id: 'rodrira01', name: 'Rafael Rodriguez', role: 'RP', throws: 'R', age: 24, g: 18, gs: 0, outs: 92, h: 47, hr: 4, bb: 9, so: 10, hbp: 1, er: 19, w: 0, l: 1, sv: 0, rk: true },
      { id: 'belltr01', name: 'Trevor Bell', role: 'RP', throws: 'R', age: 22, g: 8, gs: 4, outs: 61, h: 40, hr: 3, bb: 11, so: 14, hbp: 0, er: 22, w: 1, l: 2, sv: 0, rk: true },
      { id: 'thompri03', name: 'Rich Thompson', role: 'RP', throws: 'R', age: 24, g: 13, gs: 0, outs: 58, h: 27, hr: 6, bb: 8, so: 20, hbp: 1, er: 14, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // OAK (OAK 2009)
  {
    franchiseId: 'OAK',
    season: 2009,
    batters: [
      { id: 'suzukku01', name: 'Kurt Suzuki', pos: 'C', bats: 'R', age: 25, pa: 614, h: 154, double: 33, triple: 1, hr: 12, bb: 37, so: 67, hbp: 9, sb: 5, cs: 2, sec: '1B', fld: 76, arm: 66 },
      { id: 'giambja01', name: 'Jason Giambi', pos: '1B', bats: 'L', age: 38, pa: 359, h: 66, double: 13, triple: 0, hr: 17, bb: 52, so: 76, hbp: 10, sb: 1, cs: 0, sec: 'LF', fld: 57 },
      { id: 'ellisma01', name: 'Mark Ellis', pos: '2B', bats: 'R', age: 32, pa: 410, h: 94, double: 20, triple: 1, hr: 10, bb: 31, so: 55, hbp: 4, sb: 10, cs: 2, sec: 'SS', fld: 70 },
      { id: 'kennead01', name: 'Adam Kennedy', pos: '3B', bats: 'L', age: 33, pa: 586, h: 149, double: 27, triple: 3, hr: 8, bb: 42, so: 79, hbp: 4, sb: 17, cs: 5, sec: '2B', fld: 68 },
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 34, pa: 708, h: 185, double: 35, triple: 2, hr: 8, bb: 44, so: 69, hbp: 1, sb: 16, cs: 5, sec: '2B', fld: 69 },
      { id: 'hollima01', name: 'Matt Holliday', pos: 'LF', bats: 'R', age: 29, pa: 670, h: 187, double: 41, triple: 3, hr: 27, bb: 72, so: 108, hbp: 9, sb: 18, cs: 5, sec: 'RF', fld: 63, arm: 67 },
      { id: 'davisra01', name: 'Rajai Davis', pos: 'CF', bats: 'R', age: 28, pa: 432, h: 113, double: 22, triple: 5, hr: 4, bb: 27, so: 70, hbp: 6, sb: 45, cs: 12, sec: 'LF', fld: 74, arm: 79 },
      { id: 'sweenry01', name: 'Ryan Sweeney', pos: 'RF', bats: 'L', age: 24, pa: 534, h: 139, double: 28, triple: 3, hr: 6, bb: 42, so: 72, hbp: 3, sb: 8, cs: 4, sec: 'CF', fld: 96, arm: 76 },
      { id: 'custja01', name: 'Jack Cust', pos: 'DH', bats: 'L', age: 30, pa: 612, h: 120, double: 18, triple: 0, hr: 29, bb: 105, so: 192, hbp: 2, sb: 2, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'hairssc01', name: 'Scott Hairston', pos: 'LF', bats: 'R', age: 29, pa: 464, h: 109, double: 26, triple: 3, hr: 18, bb: 30, so: 91, hbp: 3, sb: 8, cs: 2, sec: 'CF', fld: 79, arm: 63 },
      { id: 'crosbbo01', name: 'Bobby Crosby', pos: '1B', bats: 'R', age: 29, pa: 272, h: 57, double: 14, triple: 1, hr: 5, bb: 21, so: 44, hbp: 1, sb: 3, cs: 1, sec: '3B', fld: 69 },
      { id: 'pennicl01', name: 'Cliff Pennington', pos: 'SS', bats: 'S', age: 25, pa: 229, h: 55, double: 11, triple: 2, hr: 3, bb: 21, so: 43, hbp: 2, sb: 7, cs: 4, sec: '2B', fld: 75, rk: true },
      { id: 'bartoda02', name: 'Daric Barton', pos: '1B', bats: 'L', age: 23, pa: 192, h: 40, double: 9, triple: 1, hr: 3, bb: 25, so: 32, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 70 },
      { id: 'garcino01', name: 'Nomar Garciaparra', pos: 'DH', bats: 'R', age: 35, pa: 169, h: 43, double: 7, triple: 0, hr: 4, bb: 11, so: 19, hbp: 0, sb: 1, cs: 0, sec: '1B' },
    ],
    reserveBatters: [
      { id: 'powella01', name: 'Landon Powell', pos: 'C', bats: 'S', age: 27, pa: 155, h: 32, double: 7, triple: 0, hr: 7, bb: 14, so: 36, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 89, rk: true },
      { id: 'bucktr01', name: 'Travis Buck', pos: 'RF', bats: 'L', age: 25, pa: 115, h: 25, double: 6, triple: 1, hr: 3, bb: 10, so: 23, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 79, arm: 53 },
      { id: 'patteer01', name: 'Eric Patterson', pos: 'LF', bats: 'L', age: 26, pa: 110, h: 23, double: 4, triple: 1, hr: 1, bb: 13, so: 26, hbp: 0, sb: 7, cs: 1, sec: 'RF', fld: 64, arm: 66 },
      { id: 'everito01', name: 'Tommy Everidge', pos: '1B', bats: 'R', age: 26, pa: 97, h: 19, double: 6, triple: 0, hr: 2, bb: 8, so: 17, hbp: 2, sb: 0, cs: 0, sec: '3B', fld: 67, rk: true },
      { id: 'cunniaa01', name: 'Aaron Cunningham', pos: 'RF', bats: 'R', age: 23, pa: 57, h: 11, double: 3, triple: 0, hr: 1, bb: 3, so: 16, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 40, arm: 53, rk: true },
    ],
    pitchers: [
      { id: 'cahiltr01', name: 'Trevor Cahill', role: 'SP', throws: 'R', age: 21, g: 32, gs: 32, outs: 536, h: 185, hr: 27, bb: 72, so: 90, hbp: 4, er: 92, w: 10, l: 13, sv: 0, fld: 73, rk: true },
      { id: 'anderbr04', name: 'Brett Anderson', role: 'SP', throws: 'L', age: 21, g: 30, gs: 30, outs: 526, h: 180, hr: 20, bb: 45, so: 150, hbp: 3, er: 79, w: 11, l: 11, sv: 0, fld: 70, rk: true },
      { id: 'bradeda01', name: 'Dallas Braden', role: 'SP', throws: 'L', age: 25, g: 22, gs: 22, outs: 410, h: 146, hr: 11, bb: 44, so: 82, hbp: 3, er: 64, w: 8, l: 9, sv: 0, fld: 60 },
      { id: 'gonzagi01', name: 'Gio Gonzalez', role: 'SP', throws: 'L', age: 23, g: 20, gs: 17, outs: 296, h: 109, hr: 16, bb: 59, so: 107, hbp: 2, er: 67, w: 6, l: 7, sv: 0, rk: true },
      { id: 'mazzavi01', name: 'Vin Mazzaro', role: 'SP', throws: 'R', age: 22, g: 17, gs: 17, outs: 274, h: 120, hr: 12, bb: 39, so: 59, hbp: 4, er: 54, w: 4, l: 9, sv: 0, rk: true },
      { id: 'bailean01', name: 'Andrew Bailey', role: 'CL', throws: 'R', age: 25, g: 68, gs: 0, outs: 250, h: 49, hr: 5, bb: 24, so: 91, hbp: 0, er: 17, w: 6, l: 3, sv: 26, rk: true },
      { id: 'wuertmi01', name: 'Michael Wuertz', role: 'RP', throws: 'R', age: 30, g: 74, gs: 0, outs: 236, h: 58, hr: 6, bb: 27, so: 84, hbp: 0, er: 25, w: 6, l: 1, sv: 4 },
      { id: 'zieglbr01', name: 'Brad Ziegler', role: 'RP', throws: 'R', age: 29, g: 69, gs: 0, outs: 220, h: 75, hr: 2, bb: 28, so: 49, hbp: 1, er: 20, w: 2, l: 4, sv: 7 },
      { id: 'breslcr01', name: 'Craig Breslow', role: 'RP', throws: 'L', age: 28, g: 77, gs: 0, outs: 209, h: 49, hr: 6, bb: 29, so: 56, hbp: 2, er: 23, w: 8, l: 7, sv: 0 },
      { id: 'gonzaed01', name: 'Edgar Gonzalez', role: 'RP', throws: 'R', age: 26, g: 26, gs: 6, outs: 196, h: 76, hr: 8, bb: 26, so: 41, hbp: 5, er: 41, w: 0, l: 4, sv: 0 },
      { id: 'tomkobr01', name: 'Brett Tomko', role: 'RP', throws: 'R', age: 36, g: 21, gs: 6, outs: 172, h: 57, hr: 9, bb: 15, so: 37, hbp: 1, er: 31, w: 5, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'outmajo01', name: 'Josh Outman', role: 'SP', throws: 'L', age: 24, g: 14, gs: 12, outs: 202, h: 59, hr: 8, bb: 24, so: 51, hbp: 1, er: 27, w: 4, l: 1, sv: 0, rk: true },
      { id: 'sprinru01', name: 'Russ Springer', role: 'RP', throws: 'R', age: 40, g: 74, gs: 0, outs: 171, h: 57, hr: 7, bb: 19, so: 58, hbp: 1, er: 21, w: 1, l: 4, sv: 1 },
      { id: 'garcija01', name: 'Santiago Casilla', role: 'RP', throws: 'R', age: 28, g: 46, gs: 0, outs: 145, h: 58, hr: 6, bb: 23, so: 41, hbp: 3, er: 28, w: 1, l: 2, sv: 0 },
      { id: 'evelada01', name: 'Dana Eveland', role: 'RP', throws: 'L', age: 25, g: 13, gs: 9, outs: 132, h: 57, hr: 3, bb: 24, so: 31, hbp: 2, er: 28, w: 2, l: 4, sv: 0 },
      { id: 'mortecl01', name: 'Clayton Mortensen', role: 'RP', throws: 'R', age: 24, g: 7, gs: 6, outs: 92, h: 42, hr: 6, bb: 13, so: 13, hbp: 3, er: 26, w: 2, l: 4, sv: 0, rk: true },
    ],
  },
  // SEA (SEA 2009)
  {
    franchiseId: 'SEA',
    season: 2009,
    batters: [
      { id: 'johnsro07', name: 'Rob Johnson', pos: 'C', bats: 'R', age: 26, pa: 290, h: 54, double: 18, triple: 2, hr: 2, bb: 24, so: 59, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 66, arm: 71, rk: true },
      { id: 'branyru01', name: 'Russell Branyan', pos: '1B', bats: 'L', age: 33, pa: 505, h: 106, double: 21, triple: 1, hr: 32, bb: 60, so: 151, hbp: 7, sb: 2, cs: 0, sec: '3B', fld: 64 },
      { id: 'lopezjo01', name: 'Jose Lopez', pos: '2B', bats: 'R', age: 25, pa: 653, h: 170, double: 38, triple: 1, hr: 20, bb: 24, so: 68, hbp: 4, sb: 4, cs: 3, sec: 'SS', fld: 44 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 30, pa: 477, h: 118, double: 26, triple: 1, hr: 14, bb: 28, so: 73, hbp: 4, sb: 10, cs: 2, sec: '1B', fld: 86 },
      { id: 'cedenro02', name: 'Ronny Cedeno', pos: 'SS', bats: 'R', age: 26, pa: 376, h: 77, double: 11, triple: 2, hr: 9, bb: 21, so: 75, hbp: 2, sb: 6, cs: 2, sec: '2B', fld: 73 },
      { id: 'balenwl01', name: 'Wladimir Balentien', pos: 'LF', bats: 'R', age: 24, pa: 295, h: 60, double: 16, triple: 1, hr: 8, bb: 24, so: 77, hbp: 0, sb: 1, cs: 1, sec: 'RF', fld: 77, arm: 77 },
      { id: 'gutiefr01', name: 'Franklin Gutierrez', pos: 'CF', bats: 'R', age: 26, pa: 629, h: 154, double: 28, triple: 2, hr: 17, bb: 44, so: 126, hbp: 5, sb: 15, cs: 5, sec: 'RF', fld: 84, arm: 67 },
      { id: 'suzukic01', name: 'Ichiro Suzuki', pos: 'RF', bats: 'L', age: 35, pa: 678, h: 213, double: 25, triple: 5, hr: 8, bb: 39, so: 67, hbp: 4, sb: 32, cs: 7, sec: 'CF', fld: 76, arm: 62 },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'DH', bats: 'L', age: 39, pa: 454, h: 93, double: 20, triple: 0, hr: 18, bb: 62, so: 75, hbp: 1, sb: 1, cs: 0, sec: 'RF' },
    ],
    bench: [
      { id: 'hannaja01', name: 'Jack Hannahan', pos: '3B', bats: 'L', age: 29, pa: 301, h: 58, double: 16, triple: 1, hr: 5, bb: 32, so: 75, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 91 },
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: 'DH', bats: 'R', age: 35, pa: 266, h: 68, double: 15, triple: 0, hr: 7, bb: 16, so: 26, hbp: 4, sb: 0, cs: 0, sec: '1B' },
      { id: 'johjike01', name: 'Kenji Johjima', pos: 'C', bats: 'R', age: 33, pa: 258, h: 60, double: 12, triple: 0, hr: 7, bb: 11, so: 23, hbp: 5, sb: 1, cs: 1, sec: '1B', fld: 74, arm: 93 },
      { id: 'wilsojo03', name: 'Josh Wilson', pos: 'SS', bats: 'R', age: 28, pa: 211, h: 43, double: 11, triple: 1, hr: 2, bb: 12, so: 42, hbp: 4, sb: 2, cs: 2, sec: '2B', fld: 53 },
      { id: 'chaveen01', name: 'Endy Chavez', pos: 'LF', bats: 'L', age: 31, pa: 182, h: 44, double: 5, triple: 1, hr: 1, bb: 12, so: 18, hbp: 0, sb: 6, cs: 1, sec: 'CF', fld: 83, arm: 67 },
    ],
    reserveBatters: [
      { id: 'saundmi01', name: 'Michael Saunders', pos: 'LF', bats: 'L', age: 22, pa: 129, h: 27, double: 1, triple: 3, hr: 0, bb: 6, so: 40, hbp: 0, sb: 4, cs: 1, sec: 'RF', fld: 85, arm: 55, rk: true },
      { id: 'langery01', name: 'Ryan Langerhans', pos: 'LF', bats: 'L', age: 29, pa: 122, h: 21, double: 5, triple: 1, hr: 3, bb: 17, so: 31, hbp: 1, sb: 1, cs: 1, sec: 'CF', fld: 94, arm: 63 },
      { id: 'woodwch01', name: 'Chris Woodward', pos: '3B', bats: 'R', age: 33, pa: 90, h: 17, double: 2, triple: 0, hr: 0, bb: 7, so: 18, hbp: 1, sb: 1, cs: 0, sec: 'SS' },
      { id: 'carpmi01', name: 'Mike Carp', pos: '1B', bats: 'L', age: 23, pa: 65, h: 17, double: 3, triple: 1, hr: 1, bb: 8, so: 10, hbp: 2, sb: 0, cs: 0, sec: '3B', rk: true },
      { id: 'burkeja02', name: 'Jamie Burke', pos: 'C', bats: 'R', age: 37, pa: 56, h: 11, double: 2, triple: 0, hr: 1, bb: 3, so: 10, hbp: 1, sb: 0, cs: 0 },
    ],
    pitchers: [
      { id: 'hernafe02', name: 'Felix Hernandez', role: 'SP', throws: 'R', age: 23, g: 34, gs: 34, outs: 716, h: 214, hr: 18, bb: 76, so: 207, hbp: 8, er: 77, w: 19, l: 5, sv: 0, fld: 78 },
      { id: 'washbja01', name: 'Jarrod Washburn', role: 'SP', throws: 'L', age: 34, g: 28, gs: 28, outs: 528, h: 171, hr: 22, bb: 52, so: 98, hbp: 6, er: 79, w: 9, l: 9, sv: 0, fld: 62 },
      { id: 'rowlary01', name: 'Ryan Rowland-Smith', role: 'SP', throws: 'L', age: 26, g: 15, gs: 15, outs: 289, h: 88, hr: 10, bb: 32, so: 59, hbp: 3, er: 38, w: 5, l: 4, sv: 0 },
      { id: 'vargaja01', name: 'Jason Vargas', role: 'SP', throws: 'L', age: 26, g: 23, gs: 14, outs: 275, h: 100, hr: 17, bb: 24, so: 53, hbp: 3, er: 52, w: 3, l: 6, sv: 0 },
      { id: 'bedarer01', name: 'Erik Bedard', role: 'SP', throws: 'L', age: 30, g: 15, gs: 15, outs: 249, h: 67, hr: 9, bb: 33, so: 89, hbp: 4, er: 29, w: 5, l: 3, sv: 0 },
      { id: 'aardsda01', name: 'David Aardsma', role: 'CL', throws: 'R', age: 27, g: 73, gs: 0, outs: 214, h: 56, hr: 5, bb: 37, so: 73, hbp: 2, er: 28, w: 3, l: 6, sv: 38 },
      { id: 'jakubch01', name: 'Chris Jakubauskas', role: 'RP', throws: 'R', age: 30, g: 35, gs: 8, outs: 279, h: 91, hr: 15, bb: 27, so: 47, hbp: 2, er: 55, w: 6, l: 7, sv: 0, rk: true },
      { id: 'lowema01', name: 'Mark Lowe', role: 'RP', throws: 'R', age: 26, g: 75, gs: 0, outs: 240, h: 77, hr: 7, bb: 33, so: 66, hbp: 2, er: 34, w: 2, l: 7, sv: 3 },
      { id: 'batismi01', name: 'Miguel Batista', role: 'RP', throws: 'R', age: 38, g: 56, gs: 0, outs: 214, h: 79, hr: 9, bb: 40, so: 48, hbp: 3, er: 39, w: 7, l: 4, sv: 1 },
      { id: 'whitese02', name: 'Sean White', role: 'RP', throws: 'R', age: 28, g: 52, gs: 0, outs: 193, h: 51, hr: 3, bb: 22, so: 27, hbp: 4, er: 23, w: 3, l: 2, sv: 1, rk: true },
      { id: 'kellesh01', name: 'Shawn Kelley', role: 'RP', throws: 'R', age: 25, g: 41, gs: 0, outs: 138, h: 45, hr: 9, bb: 9, so: 41, hbp: 3, er: 23, w: 5, l: 4, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'olsonga01', name: 'Garrett Olson', role: 'SP', throws: 'L', age: 25, g: 31, gs: 11, outs: 241, h: 88, hr: 14, bb: 36, so: 48, hbp: 4, er: 53, w: 3, l: 5, sv: 0 },
      { id: 'morrobr01', name: 'Brandon Morrow', role: 'SP', throws: 'R', age: 24, g: 26, gs: 10, outs: 209, h: 60, hr: 9, bb: 45, so: 72, hbp: 0, er: 32, w: 2, l: 4, sv: 6 },
      { id: 'frenclu01', name: 'Luke French', role: 'SP', throws: 'L', age: 23, g: 15, gs: 12, outs: 202, h: 87, hr: 11, bb: 28, so: 42, hbp: 2, er: 39, w: 4, l: 5, sv: 0, rk: true },
      { id: 'fistedo01', name: 'Doug Fister', role: 'SP', throws: 'R', age: 25, g: 11, gs: 10, outs: 183, h: 63, hr: 11, bb: 15, so: 36, hbp: 2, er: 28, w: 3, l: 4, sv: 0, rk: true },
      { id: 'silvaca01', name: 'Carlos Silva', role: 'RP', throws: 'R', age: 30, g: 8, gs: 6, outs: 91, h: 42, hr: 4, bb: 7, so: 14, hbp: 1, er: 21, w: 1, l: 3, sv: 0 },
    ],
  },
  // TEX (TEX 2009)
  {
    franchiseId: 'TEX',
    season: 2009,
    batters: [
      { id: 'saltaja01', name: 'Jarrod Saltalamacchia', pos: 'C', bats: 'S', age: 24, pa: 310, h: 69, double: 14, triple: 0, hr: 8, bb: 27, so: 93, hbp: 1, sb: 0, cs: 2, sec: '1B', fld: 69, arm: 65 },
      { id: 'blaloha01', name: 'Hank Blalock', pos: '1B', bats: 'L', age: 28, pa: 495, h: 116, double: 25, triple: 4, hr: 24, bb: 30, so: 96, hbp: 3, sb: 3, cs: 0, sec: '3B', fld: 54 },
      { id: 'kinslia01', name: 'Ian Kinsler', pos: '2B', bats: 'R', age: 27, pa: 640, h: 155, double: 35, triple: 4, hr: 26, bb: 58, so: 79, hbp: 7, sb: 29, cs: 4, sec: 'SS', fld: 76 },
      { id: 'youngmi02', name: 'Michael Young', pos: '3B', bats: 'R', age: 32, pa: 593, h: 166, double: 33, triple: 2, hr: 15, bb: 45, so: 91, hbp: 2, sb: 9, cs: 2, sec: 'SS', fld: 54 },
      { id: 'andruel01', name: 'Elvis Andrus', pos: 'SS', bats: 'R', age: 20, pa: 541, h: 128, double: 17, triple: 8, hr: 6, bb: 40, so: 77, hbp: 6, sb: 33, cs: 6, sec: '2B', fld: 81, rk: true },
      { id: 'murphda07', name: 'David Murphy', pos: 'LF', bats: 'L', age: 27, pa: 493, h: 121, double: 28, triple: 2, hr: 16, bb: 43, so: 94, hbp: 1, sb: 8, cs: 3, sec: 'RF', fld: 73, arm: 72 },
      { id: 'byrdma01', name: 'Marlon Byrd', pos: 'CF', bats: 'R', age: 31, pa: 599, h: 157, double: 38, triple: 4, hr: 17, bb: 41, so: 95, hbp: 10, sb: 8, cs: 4, sec: 'LF', fld: 64, arm: 68 },
      { id: 'cruzne02', name: 'Nelson Cruz', pos: 'RF', bats: 'R', age: 28, pa: 515, h: 122, double: 23, triple: 2, hr: 29, bb: 49, so: 119, hbp: 2, sb: 16, cs: 4, sec: 'LF', fld: 93, arm: 77 },
      { id: 'davisch02', name: 'Chris Davis', pos: 'DH', bats: 'L', age: 23, pa: 419, h: 99, double: 20, triple: 2, hr: 21, bb: 25, so: 139, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 68 },
    ],
    bench: [
      { id: 'hamiljo03', name: 'Josh Hamilton', pos: 'CF', bats: 'L', age: 28, pa: 365, h: 95, double: 19, triple: 2, hr: 15, bb: 30, so: 71, hbp: 3, sb: 6, cs: 2, sec: 'RF', fld: 69, arm: 70 },
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'DH', bats: 'R', age: 32, pa: 331, h: 58, double: 15, triple: 1, hr: 13, bb: 40, so: 79, hbp: 2, sb: 3, cs: 1, sec: 'RF' },
      { id: 'teagata01', name: 'Taylor Teagarden', pos: 'C', bats: 'R', age: 25, pa: 218, h: 46, double: 14, triple: 0, hr: 9, bb: 15, so: 76, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 62, arm: 78, rk: true },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 42, pa: 195, h: 43, double: 7, triple: 1, hr: 1, bb: 15, so: 21, hbp: 0, sb: 4, cs: 2, sec: '3B', fld: 95 },
      { id: 'borboju01', name: 'Julio Borbon', pos: 'DH', bats: 'L', age: 23, pa: 179, h: 49, double: 4, triple: 0, hr: 4, bb: 15, so: 28, hbp: 1, sb: 19, cs: 4, sec: 'LF', rk: true },
    ],
    reserveBatters: [
      { id: 'germaes01', name: 'Esteban German', pos: '3B', bats: 'R', age: 31, pa: 50, h: 12, double: 3, triple: 1, hr: 0, bb: 4, so: 8, hbp: 0, sb: 1, cs: 1, sec: '2B' },
    ],
    pitchers: [
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 34, g: 31, gs: 31, outs: 596, h: 217, hr: 23, bb: 66, so: 130, hbp: 9, er: 93, w: 13, l: 10, sv: 0, fld: 71 },
      { id: 'feldmsc01', name: 'Scott Feldman', role: 'SP', throws: 'R', age: 26, g: 34, gs: 31, outs: 569, h: 184, hr: 21, bb: 69, so: 103, hbp: 10, er: 94, w: 17, l: 8, sv: 0, fld: 73 },
      { id: 'padilvi01', name: 'Vicente Padilla', role: 'SP', throws: 'R', age: 31, g: 26, gs: 25, outs: 442, h: 158, hr: 19, bb: 55, so: 99, hbp: 10, er: 77, w: 12, l: 6, sv: 0, fld: 67 },
      { id: 'hollade01', name: 'Derek Holland', role: 'SP', throws: 'L', age: 22, g: 33, gs: 21, outs: 415, h: 160, hr: 26, bb: 47, so: 107, hbp: 4, er: 94, w: 8, l: 13, sv: 0, fld: 53, rk: true },
      { id: 'hunteto02', name: 'Tommy Hunter', role: 'SP', throws: 'R', age: 22, g: 19, gs: 19, outs: 336, h: 119, hr: 14, bb: 32, so: 65, hbp: 2, er: 59, w: 9, l: 6, sv: 0, rk: true },
      { id: 'francfr01', name: 'Frank Francisco', role: 'CL', throws: 'R', age: 29, g: 51, gs: 0, outs: 148, h: 39, hr: 5, bb: 19, so: 56, hbp: 1, er: 20, w: 2, l: 3, sv: 25 },
      { id: 'wilsocj01', name: 'C. J. Wilson', role: 'RP', throws: 'L', age: 28, g: 74, gs: 0, outs: 221, h: 66, hr: 6, bb: 35, so: 76, hbp: 5, er: 29, w: 5, l: 6, sv: 14 },
      { id: 'jennija01', name: 'Jason Jennings', role: 'RP', throws: 'R', age: 30, g: 44, gs: 0, outs: 183, h: 70, hr: 10, bb: 28, so: 41, hbp: 2, er: 37, w: 2, l: 4, sv: 1 },
      { id: 'odayda01', name: 'Darren O\'Day', role: 'RP', throws: 'R', age: 26, g: 68, gs: 0, outs: 176, h: 48, hr: 3, bb: 18, so: 49, hbp: 5, er: 17, w: 2, l: 1, sv: 2, rk: true },
      { id: 'grillja01', name: 'Jason Grilli', role: 'RP', throws: 'R', age: 32, g: 52, gs: 0, outs: 137, h: 47, hr: 3, bb: 24, so: 45, hbp: 2, er: 22, w: 2, l: 3, sv: 1 },
      { id: 'mathido01', name: 'Doug Mathis', role: 'RP', throws: 'R', age: 26, g: 24, gs: 2, outs: 128, h: 44, hr: 4, bb: 13, so: 22, hbp: 1, er: 18, w: 0, l: 1, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'mccarbr01', name: 'Brandon McCarthy', role: 'SP', throws: 'R', age: 25, g: 17, gs: 17, outs: 292, h: 97, hr: 12, bb: 38, so: 60, hbp: 3, er: 50, w: 7, l: 4, sv: 0 },
      { id: 'nippedu01', name: 'Dustin Nippert', role: 'SP', throws: 'R', age: 28, g: 20, gs: 10, outs: 209, h: 72, hr: 8, bb: 30, so: 52, hbp: 2, er: 37, w: 5, l: 3, sv: 0 },
      { id: 'harrima01', name: 'Matt Harrison', role: 'SP', throws: 'L', age: 23, g: 11, gs: 11, outs: 190, h: 79, hr: 9, bb: 23, so: 33, hbp: 2, er: 41, w: 4, l: 5, sv: 0 },
      { id: 'guarded01', name: 'Eddie Guardado', role: 'RP', throws: 'L', age: 38, g: 48, gs: 0, outs: 115, h: 38, hr: 6, bb: 14, so: 22, hbp: 1, er: 20, w: 1, l: 2, sv: 0 },
      { id: 'felizne01', name: 'Neftali Feliz', role: 'RP', throws: 'R', age: 21, g: 20, gs: 0, outs: 93, h: 13, hr: 2, bb: 8, so: 39, hbp: 3, er: 6, w: 1, l: 0, sv: 2, rk: true },
    ],
  },
  // ATL (ATL 2009)
  {
    franchiseId: 'ATL',
    season: 2009,
    batters: [
      { id: 'mccanbr01', name: 'Brian McCann', pos: 'C', bats: 'L', age: 25, pa: 551, h: 140, double: 37, triple: 1, hr: 21, bb: 49, so: 74, hbp: 5, sb: 4, cs: 1, sec: '1B', fld: 67, arm: 65 },
      { id: 'kotchca01', name: 'Casey Kotchman', pos: '1B', bats: 'L', age: 26, pa: 431, h: 106, double: 24, triple: 1, hr: 9, bb: 35, so: 36, hbp: 5, sb: 1, cs: 1, sec: '3B', fld: 84 },
      { id: 'pradoma01', name: 'Martin Prado', pos: '2B', bats: 'R', age: 25, pa: 503, h: 140, double: 37, triple: 2, hr: 9, bb: 37, so: 58, hbp: 2, sb: 2, cs: 3, sec: '3B', fld: 71 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: '3B', bats: 'S', age: 37, pa: 596, h: 152, double: 27, triple: 2, hr: 22, bb: 97, so: 80, hbp: 1, sb: 4, cs: 1, sec: 'SS', fld: 54 },
      { id: 'escobyu01', name: 'Yunel Escobar', pos: 'SS', bats: 'R', age: 26, pa: 604, h: 158, double: 27, triple: 2, hr: 12, bb: 57, so: 64, hbp: 8, sb: 4, cs: 5, sec: '3B', fld: 73 },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'LF', bats: 'L', age: 37, pa: 534, h: 140, double: 27, triple: 1, hr: 14, bb: 27, so: 70, hbp: 1, sb: 3, cs: 1, sec: 'CF', fld: 58, arm: 64 },
      { id: 'mclouna01', name: 'Nate McLouth', pos: 'CF', bats: 'L', age: 27, pa: 591, h: 135, double: 33, triple: 3, hr: 21, bb: 63, so: 94, hbp: 10, sb: 21, cs: 4, sec: 'RF', fld: 74, arm: 76 },
      { id: 'francje02', name: 'Jeff Francoeur', pos: 'RF', bats: 'R', age: 25, pa: 632, h: 158, double: 33, triple: 3, hr: 14, bb: 31, so: 102, hbp: 7, sb: 4, cs: 3, sec: 'LF', fld: 71, arm: 72 },
      { id: 'diazma02', name: 'Matt Diaz', pos: 'DH', bats: 'R', age: 31, pa: 425, h: 117, double: 17, triple: 3, hr: 12, bb: 28, so: 87, hbp: 10, sb: 11, cs: 4, sec: 'LF', fld: 52, arm: 58 },
    ],
    bench: [
      { id: 'johnske05', name: 'Kelly Johnson', pos: '2B', bats: 'L', age: 27, pa: 346, h: 80, double: 20, triple: 4, hr: 8, bb: 34, so: 61, hbp: 2, sb: 6, cs: 3, sec: 'SS', fld: 67 },
      { id: 'infanom01', name: 'Omar Infante', pos: '2B', bats: 'R', age: 27, pa: 229, h: 61, double: 12, triple: 1, hr: 2, bb: 16, so: 29, hbp: 1, sb: 1, cs: 0, sec: 'SS', fld: 61 },
      { id: 'schafjo02', name: 'Jordan Schafer', pos: 'CF', bats: 'L', age: 22, pa: 195, h: 34, double: 8, triple: 0, hr: 2, bb: 27, so: 63, hbp: 0, sb: 2, cs: 1, sec: 'LF', fld: 82, arm: 79, rk: true },
      { id: 'rossda01', name: 'David Ross', pos: 'C', bats: 'R', age: 32, pa: 151, h: 30, double: 7, triple: 0, hr: 6, bb: 20, so: 37, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 87 },
      { id: 'nortogr01', name: 'Greg Norton', pos: '1B', bats: 'S', age: 36, pa: 97, h: 18, double: 4, triple: 0, hr: 2, bb: 16, so: 20, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'hernadi01', name: 'Diory Hernandez', pos: 'SS', bats: 'R', age: 25, pa: 93, h: 12, double: 3, triple: 0, hr: 1, bb: 6, so: 22, hbp: 0, sb: 0, cs: 1, sec: '2B', fld: 75, rk: true },
      { id: 'conrabr01', name: 'Brooks Conrad', pos: '2B', bats: 'S', age: 29, pa: 58, h: 11, double: 1, triple: 2, hr: 2, bb: 2, so: 16, hbp: 1, sb: 0, cs: 0, sec: 'SS', rk: true },
      { id: 'blancgr01', name: 'Gregor Blanco', pos: 'CF', bats: 'L', age: 25, pa: 48, h: 10, double: 1, triple: 0, hr: 0, bb: 6, so: 9, hbp: 0, sb: 1, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 32, g: 32, gs: 32, outs: 658, h: 193, hr: 23, bb: 50, so: 219, hbp: 5, er: 85, w: 15, l: 10, sv: 0, fld: 72 },
      { id: 'jurrjja01', name: 'Jair Jurrjens', role: 'SP', throws: 'R', age: 23, g: 34, gs: 34, outs: 645, h: 193, hr: 14, bb: 76, so: 151, hbp: 4, er: 72, w: 14, l: 10, sv: 0, fld: 73 },
      { id: 'lowede01', name: 'Derek Lowe', role: 'SP', throws: 'R', age: 36, g: 34, gs: 34, outs: 584, h: 215, hr: 16, bb: 57, so: 130, hbp: 3, er: 91, w: 15, l: 10, sv: 0, fld: 74 },
      { id: 'kawakke01', name: 'Kenshin Kawakami', role: 'SP', throws: 'R', age: 34, g: 32, gs: 25, outs: 469, h: 153, hr: 15, bb: 57, so: 105, hbp: 6, er: 67, w: 7, l: 12, sv: 1, fld: 84, rk: true },
      { id: 'hansoto01', name: 'Tommy Hanson', role: 'SP', throws: 'R', age: 22, g: 21, gs: 21, outs: 383, h: 105, hr: 10, bb: 46, so: 116, hbp: 5, er: 41, w: 11, l: 4, sv: 0, rk: true },
      { id: 'soriara01', name: 'Rafael Soriano', role: 'CL', throws: 'R', age: 29, g: 77, gs: 0, outs: 227, h: 51, hr: 7, bb: 27, so: 95, hbp: 2, er: 25, w: 1, l: 6, sv: 27 },
      { id: 'gonzami02', name: 'Mike Gonzalez', role: 'RP', throws: 'L', age: 31, g: 80, gs: 0, outs: 223, h: 57, hr: 8, bb: 33, so: 90, hbp: 6, er: 23, w: 5, l: 4, sv: 10 },
      { id: 'moylape01', name: 'Peter Moylan', role: 'RP', throws: 'R', age: 30, g: 87, gs: 0, outs: 219, h: 63, hr: 2, bb: 32, so: 59, hbp: 3, er: 21, w: 6, l: 2, sv: 0 },
      { id: 'medlekr01', name: 'Kris Medlen', role: 'RP', throws: 'R', age: 23, g: 37, gs: 4, outs: 203, h: 65, hr: 5, bb: 30, so: 72, hbp: 2, er: 32, w: 3, l: 5, sv: 0, rk: true },
      { id: 'oflaher01', name: 'Eric O\'Flaherty', role: 'RP', throws: 'L', age: 24, g: 78, gs: 0, outs: 169, h: 55, hr: 3, bb: 19, so: 38, hbp: 6, er: 26, w: 2, l: 1, sv: 0 },
      { id: 'benneje01', name: 'Jeff Bennett', role: 'RP', throws: 'R', age: 29, g: 44, gs: 0, outs: 140, h: 56, hr: 4, bb: 28, so: 34, hbp: 4, er: 24, w: 2, l: 4, sv: 0 },
    ],
    reservePitchers: [
      { id: 'hudsoti01', name: 'Tim Hudson', role: 'RP', throws: 'R', age: 33, g: 7, gs: 7, outs: 127, h: 43, hr: 3, bb: 12, so: 27, hbp: 1, er: 16, w: 2, l: 1, sv: 0 },
      { id: 'acostma01', name: 'Manny Acosta', role: 'RP', throws: 'R', age: 28, g: 36, gs: 0, outs: 112, h: 39, hr: 5, bb: 20, so: 29, hbp: 1, er: 17, w: 1, l: 1, sv: 0 },
      { id: 'reyesjo03', name: 'Jo-Jo Reyes', role: 'RP', throws: 'L', age: 24, g: 6, gs: 5, outs: 81, h: 30, hr: 4, bb: 13, so: 18, hbp: 1, er: 18, w: 0, l: 2, sv: 0 },
      { id: 'carlybu01', name: 'Buddy Carlyle', role: 'RP', throws: 'R', age: 31, g: 16, gs: 0, outs: 64, h: 27, hr: 4, bb: 10, so: 19, hbp: 0, er: 15, w: 0, l: 1, sv: 0 },
      { id: 'loganbo02', name: 'Boone Logan', role: 'RP', throws: 'L', age: 24, g: 20, gs: 0, outs: 52, h: 22, hr: 2, bb: 7, so: 14, hbp: 0, er: 11, w: 1, l: 1, sv: 0 },
    ],
  },
  // MIA (FLO 2009)
  {
    franchiseId: 'MIA',
    season: 2009,
    batters: [
      { id: 'bakerjo01', name: 'John Baker', pos: 'C', bats: 'L', age: 28, pa: 423, h: 103, double: 25, triple: 0, hr: 9, bb: 45, so: 89, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 61 },
      { id: 'cantujo01', name: 'Jorge Cantu', pos: '1B', bats: 'R', age: 27, pa: 643, h: 166, double: 41, triple: 0, hr: 20, bb: 44, so: 92, hbp: 8, sb: 4, cs: 1, sec: '3B', fld: 58 },
      { id: 'ugglada01', name: 'Dan Uggla', pos: '2B', bats: 'R', age: 29, pa: 668, h: 142, double: 34, triple: 1, hr: 32, bb: 84, so: 161, hbp: 8, sb: 3, cs: 2, sec: 'SS', fld: 50 },
      { id: 'bonifem01', name: 'Emilio Bonifacio', pos: '3B', bats: 'S', age: 24, pa: 509, h: 115, double: 12, triple: 7, hr: 1, bb: 35, so: 100, hbp: 2, sb: 20, cs: 10, sec: '2B', fld: 60 },
      { id: 'ramirha01', name: 'Hanley Ramirez', pos: 'SS', bats: 'R', age: 25, pa: 652, h: 186, double: 39, triple: 3, hr: 27, bb: 67, so: 103, hbp: 8, sb: 33, cs: 10, sec: '2B', fld: 64 },
      { id: 'coghlch01', name: 'Chris Coghlan', pos: 'LF', bats: 'L', age: 24, pa: 565, h: 162, double: 31, triple: 6, hr: 9, bb: 53, so: 77, hbp: 4, sb: 8, cs: 5, sec: 'RF', fld: 60, arm: 62, rk: true },
      { id: 'rossco01', name: 'Cody Ross', pos: 'CF', bats: 'R', age: 28, pa: 604, h: 150, double: 38, triple: 3, hr: 26, bb: 38, so: 127, hbp: 9, sb: 6, cs: 2, sec: 'RF', fld: 61, arm: 67 },
      { id: 'hermije01', name: 'Jeremy Hermida', pos: 'RF', bats: 'L', age: 25, pa: 491, h: 113, double: 19, triple: 2, hr: 15, bb: 50, so: 109, hbp: 5, sb: 5, cs: 2, sec: 'LF', fld: 65, arm: 60 },
      { id: 'helmswe01', name: 'Wes Helms', pos: 'DH', bats: 'R', age: 33, pa: 234, h: 55, double: 11, triple: 0, hr: 4, bb: 14, so: 53, hbp: 3, sb: 0, cs: 0, sec: '3B', fld: 63 },
    ],
    bench: [
      { id: 'pauliro01', name: 'Ronny Paulino', pos: 'C', bats: 'R', age: 28, pa: 266, h: 63, double: 11, triple: 1, hr: 7, bb: 22, so: 46, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 75, arm: 71 },
      { id: 'gloadro01', name: 'Ross Gload', pos: '1B', bats: 'L', age: 33, pa: 259, h: 64, double: 12, triple: 1, hr: 4, bb: 17, so: 27, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 71 },
      { id: 'maybica01', name: 'Cameron Maybin', pos: 'CF', bats: 'R', age: 22, pa: 199, h: 47, double: 12, triple: 2, hr: 4, bb: 17, so: 52, hbp: 1, sb: 4, cs: 2, sec: 'LF', fld: 76, arm: 61, rk: true },
      { id: 'carrobr01', name: 'Brett Carroll', pos: 'RF', bats: 'R', age: 26, pa: 158, h: 31, double: 7, triple: 2, hr: 3, bb: 11, so: 35, hbp: 3, sb: 0, cs: 0, sec: 'LF', fld: 94, arm: 86, rk: true },
      { id: 'amezaal01', name: 'Alfredo Amezaga', pos: 'CF', bats: 'S', age: 31, pa: 75, h: 17, double: 3, triple: 1, hr: 0, bb: 5, so: 11, hbp: 1, sb: 2, cs: 1, sec: 'LF' },
    ],
    pitchers: [
      { id: 'johnsjo09', name: 'Josh Johnson', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 627, h: 192, hr: 14, bb: 60, so: 187, hbp: 5, er: 78, w: 15, l: 5, sv: 0, fld: 82 },
      { id: 'nolasri01', name: 'Ricky Nolasco', role: 'SP', throws: 'R', age: 26, g: 31, gs: 31, outs: 555, h: 182, hr: 24, bb: 42, so: 181, hbp: 4, er: 92, w: 13, l: 9, sv: 0, fld: 70 },
      { id: 'volstch01', name: 'Chris Volstad', role: 'SP', throws: 'R', age: 22, g: 29, gs: 29, outs: 477, h: 163, hr: 23, bb: 62, so: 105, hbp: 5, er: 82, w: 9, l: 13, sv: 0, fld: 79 },
      { id: 'westse01', name: 'Sean West', role: 'SP', throws: 'L', age: 23, g: 20, gs: 20, outs: 310, h: 115, hr: 11, bb: 44, so: 70, hbp: 3, er: 55, w: 8, l: 6, sv: 0, rk: true },
      { id: 'sanchan01', name: 'Anibal Sanchez', role: 'SP', throws: 'R', age: 25, g: 16, gs: 16, outs: 258, h: 87, hr: 10, bb: 45, so: 70, hbp: 4, er: 41, w: 4, l: 8, sv: 0 },
      { id: 'nunezle01', name: 'Juan Carlos Oviedo', role: 'CL', throws: 'R', age: 27, g: 75, gs: 0, outs: 206, h: 62, hr: 10, bb: 24, so: 53, hbp: 4, er: 29, w: 4, l: 6, sv: 26 },
      { id: 'badenbu01', name: 'Burke Badenhop', role: 'RP', throws: 'R', age: 26, g: 35, gs: 2, outs: 216, h: 73, hr: 7, bb: 26, so: 55, hbp: 2, er: 35, w: 7, l: 4, sv: 0, rk: true },
      { id: 'pintore01', name: 'Renyel Pinto', role: 'RP', throws: 'L', age: 26, g: 73, gs: 0, outs: 184, h: 52, hr: 6, bb: 41, so: 58, hbp: 3, er: 26, w: 4, l: 1, sv: 0 },
      { id: 'calerki01', name: 'Kiko Calero', role: 'RP', throws: 'R', age: 34, g: 67, gs: 0, outs: 180, h: 41, hr: 2, bb: 30, so: 64, hbp: 1, er: 18, w: 2, l: 2, sv: 0 },
      { id: 'meyerda02', name: 'Dan Meyer', role: 'RP', throws: 'L', age: 27, g: 71, gs: 0, outs: 175, h: 52, hr: 8, bb: 23, so: 50, hbp: 1, er: 28, w: 3, l: 2, sv: 2, rk: true },
      { id: 'sanchbr01', name: 'Brian Sanches', role: 'RP', throws: 'R', age: 30, g: 47, gs: 0, outs: 169, h: 52, hr: 7, bb: 27, so: 49, hbp: 6, er: 20, w: 4, l: 2, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'millean01', name: 'Andrew Miller', role: 'SP', throws: 'L', age: 24, g: 20, gs: 14, outs: 240, h: 87, hr: 7, bb: 43, so: 63, hbp: 3, er: 47, w: 3, l: 5, sv: 0 },
      { id: 'vanderi01', name: 'Rick van den Hurk', role: 'SP', throws: 'R', age: 24, g: 11, gs: 11, outs: 176, h: 60, hr: 10, bb: 26, so: 53, hbp: 4, er: 33, w: 3, l: 2, sv: 0 },
      { id: 'lindsma01', name: 'Matt Lindstrom', role: 'RP', throws: 'R', age: 29, g: 54, gs: 0, outs: 142, h: 52, hr: 3, bb: 22, so: 40, hbp: 2, er: 24, w: 2, l: 1, sv: 15 },
      { id: 'marticr01', name: 'Cristhian Martinez', role: 'RP', throws: 'R', age: 27, g: 15, gs: 0, outs: 79, h: 27, hr: 2, bb: 8, so: 18, hbp: 0, er: 15, w: 1, l: 1, sv: 0, rk: true },
      { id: 'donnebr01', name: 'Brendan Donnelly', role: 'RP', throws: 'R', age: 37, g: 30, gs: 0, outs: 76, h: 24, hr: 1, bb: 10, so: 21, hbp: 1, er: 9, w: 3, l: 0, sv: 2 },
    ],
  },
  // NYM (NYN 2009)
  {
    franchiseId: 'NYM',
    season: 2009,
    batters: [
      { id: 'santoom01', name: 'Omir Santos', pos: 'C', bats: 'R', age: 28, pa: 306, h: 72, double: 14, triple: 1, hr: 7, bb: 15, so: 44, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 71, rk: true },
      { id: 'murphda08', name: 'Daniel Murphy', pos: '1B', bats: 'L', age: 24, pa: 556, h: 137, double: 37, triple: 5, hr: 11, bb: 42, so: 74, hbp: 1, sb: 3, cs: 3, sec: 'LF', fld: 68 },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 33, pa: 580, h: 142, double: 13, triple: 3, hr: 2, bb: 68, so: 55, hbp: 1, sb: 21, cs: 5, sec: 'SS', fld: 65 },
      { id: 'wrighda03', name: 'David Wright', pos: '3B', bats: 'R', age: 26, pa: 618, h: 163, double: 37, triple: 2, hr: 19, bb: 77, so: 118, hbp: 4, sb: 22, cs: 6, sec: '1B', fld: 63 },
      { id: 'coraal01', name: 'Alex Cora', pos: 'SS', bats: 'L', age: 33, pa: 308, h: 69, double: 12, triple: 2, hr: 1, bb: 23, so: 27, hbp: 7, sb: 5, cs: 2, sec: '2B', fld: 81 },
      { id: 'reedje03', name: 'Jeremy Reed', pos: 'LF', bats: 'L', age: 28, pa: 177, h: 41, double: 8, triple: 1, hr: 1, bb: 12, so: 28, hbp: 1, sb: 1, cs: 2, sec: 'CF', fld: 90, arm: 64 },
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 32, pa: 357, h: 91, double: 20, triple: 2, hr: 13, bb: 45, so: 49, hbp: 1, sb: 12, cs: 1, sec: 'LF', fld: 80, arm: 67 },
      { id: 'churcry01', name: 'Ryan Church', pos: 'RF', bats: 'L', age: 30, pa: 399, h: 98, double: 25, triple: 0, hr: 8, bb: 35, so: 73, hbp: 4, sb: 4, cs: 2, sec: 'LF', fld: 72, arm: 70 },
      { id: 'sheffga01', name: 'Gary Sheffield', pos: 'DH', bats: 'R', age: 40, pa: 312, h: 68, double: 11, triple: 1, hr: 12, bb: 40, so: 47, hbp: 3, sb: 6, cs: 2, sec: 'RF', fld: 60, arm: 73 },
    ],
    bench: [
      { id: 'tatisfe01', name: 'Fernando Tatis', pos: '1B', bats: 'R', age: 34, pa: 379, h: 98, double: 21, triple: 3, hr: 10, bb: 27, so: 61, hbp: 7, sb: 4, cs: 1, sec: '3B', fld: 82 },
      { id: 'paganan01', name: 'Angel Pagan', pos: 'CF', bats: 'S', age: 27, pa: 376, h: 101, double: 23, triple: 9, hr: 6, bb: 27, so: 59, hbp: 0, sb: 14, cs: 6, sec: 'LF', fld: 63, arm: 74 },
      { id: 'schnebr01', name: 'Brian Schneider', pos: 'C', bats: 'L', age: 32, pa: 194, h: 40, double: 8, triple: 0, hr: 4, bb: 21, so: 24, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 75 },
      { id: 'castrra01', name: 'Ramon Castro', pos: 'C', bats: 'R', age: 33, pa: 171, h: 37, double: 8, triple: 0, hr: 8, bb: 15, so: 39, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 70, arm: 76 },
      { id: 'reyesjo01', name: 'Jose Reyes', pos: 'SS', bats: 'S', age: 26, pa: 166, h: 43, double: 8, triple: 3, hr: 3, bb: 16, so: 18, hbp: 0, sb: 13, cs: 3, sec: '2B', fld: 58 },
    ],
    reserveBatters: [
      { id: 'sullico01', name: 'Cory Sullivan', pos: 'LF', bats: 'L', age: 29, pa: 157, h: 36, double: 3, triple: 4, hr: 2, bb: 15, so: 24, hbp: 1, sb: 6, cs: 1, sec: 'CF', fld: 79, arm: 79 },
      { id: 'delgaca01', name: 'Carlos Delgado', pos: '1B', bats: 'L', age: 37, pa: 112, h: 26, double: 6, triple: 0, hr: 5, bb: 11, so: 21, hbp: 2, sb: 0, cs: 0, sec: 'LF', fld: 53 },
      { id: 'martife02', name: 'Fernando Martinez', pos: 'LF', bats: 'L', age: 20, pa: 100, h: 16, double: 6, triple: 0, hr: 1, bb: 5, so: 14, hbp: 3, sb: 2, cs: 0, sec: 'RF', fld: 79, arm: 67, rk: true },
      { id: 'valdewi01', name: 'Wilson Valdez', pos: 'SS', bats: 'R', age: 31, pa: 95, h: 21, double: 3, triple: 2, hr: 0, bb: 7, so: 11, hbp: 1, sb: 0, cs: 1, sec: '2B', fld: 83 },
      { id: 'evansni01', name: 'Nick Evans', pos: 'LF', bats: 'R', age: 23, pa: 69, h: 16, double: 5, triple: 0, hr: 1, bb: 4, so: 17, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'pelfrmi01', name: 'Mike Pelfrey', role: 'SP', throws: 'R', age: 25, g: 31, gs: 31, outs: 553, h: 206, hr: 15, bb: 66, so: 106, hbp: 10, er: 94, w: 10, l: 12, sv: 0, fld: 72 },
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 34, g: 31, gs: 31, outs: 551, h: 232, hr: 23, bb: 60, so: 86, hbp: 2, er: 112, w: 9, l: 12, sv: 0, fld: 85 },
      { id: 'santajo01', name: 'Johan Santana', role: 'SP', throws: 'L', age: 30, g: 25, gs: 25, outs: 500, h: 151, hr: 20, bb: 45, so: 154, hbp: 3, er: 55, w: 13, l: 9, sv: 0, fld: 69 },
      { id: 'redditi01', name: 'Tim Redding', role: 'SP', throws: 'R', age: 31, g: 30, gs: 17, outs: 360, h: 124, hr: 17, bb: 47, so: 76, hbp: 4, er: 65, w: 3, l: 6, sv: 0 },
      { id: 'mainejo01', name: 'John Maine', role: 'SP', throws: 'R', age: 28, g: 15, gs: 15, outs: 244, h: 70, hr: 9, bb: 37, so: 67, hbp: 3, er: 38, w: 7, l: 6, sv: 0 },
      { id: 'rodrifr03', name: 'Francisco Rodriguez', role: 'CL', throws: 'R', age: 27, g: 70, gs: 0, outs: 204, h: 52, hr: 5, bb: 36, so: 77, hbp: 1, er: 23, w: 3, l: 6, sv: 35 },
      { id: 'parnebo01', name: 'Bobby Parnell', role: 'RP', throws: 'R', age: 24, g: 68, gs: 8, outs: 265, h: 100, hr: 8, bb: 46, so: 74, hbp: 4, er: 52, w: 4, l: 8, sv: 1, rk: true },
      { id: 'stokebr01', name: 'Brian Stokes', role: 'RP', throws: 'R', age: 29, g: 69, gs: 0, outs: 211, h: 78, hr: 8, bb: 32, so: 46, hbp: 2, er: 35, w: 2, l: 4, sv: 0 },
      { id: 'greense01', name: 'Sean Green', role: 'RP', throws: 'R', age: 30, g: 79, gs: 0, outs: 209, h: 69, hr: 4, bb: 34, so: 54, hbp: 7, er: 35, w: 1, l: 4, sv: 1 },
      { id: 'mischpa01', name: 'Pat Misch', role: 'RP', throws: 'L', age: 27, g: 26, gs: 7, outs: 187, h: 68, hr: 10, bb: 20, so: 32, hbp: 3, er: 34, w: 3, l: 4, sv: 0 },
      { id: 'felicpe01', name: 'Pedro Feliciano', role: 'RP', throws: 'L', age: 32, g: 88, gs: 0, outs: 178, h: 51, hr: 6, bb: 22, so: 55, hbp: 2, er: 21, w: 6, l: 4, sv: 0 },
    ],
    reservePitchers: [
      { id: 'figuene01', name: 'Nelson Figueroa', role: 'SP', throws: 'R', age: 35, g: 16, gs: 10, outs: 211, h: 78, hr: 7, bb: 29, so: 58, hbp: 7, er: 33, w: 3, l: 8, sv: 0 },
      { id: 'perezol01', name: 'Oliver Perez', role: 'SP', throws: 'L', age: 27, g: 14, gs: 14, outs: 198, h: 65, hr: 10, bb: 44, so: 68, hbp: 4, er: 38, w: 3, l: 4, sv: 0 },
      { id: 'nievefe01', name: 'Fernando Nieve', role: 'RP', throws: 'R', age: 26, g: 8, gs: 7, outs: 110, h: 39, hr: 4, bb: 17, so: 26, hbp: 1, er: 15, w: 3, l: 3, sv: 0 },
      { id: 'desseel01', name: 'Elmer Dessens', role: 'RP', throws: 'R', age: 38, g: 28, gs: 0, outs: 98, h: 30, hr: 5, bb: 11, so: 15, hbp: 1, er: 18, w: 0, l: 0, sv: 0 },
      { id: 'putzjj01', name: 'J. J. Putz', role: 'RP', throws: 'R', age: 32, g: 29, gs: 0, outs: 88, h: 27, hr: 2, bb: 16, so: 31, hbp: 1, er: 13, w: 1, l: 4, sv: 2 },
    ],
  },
  // PHI (PHI 2009)
  {
    franchiseId: 'PHI',
    season: 2009,
    batters: [
      { id: 'ruizca01', name: 'Carlos Ruiz', pos: 'C', bats: 'R', age: 30, pa: 379, h: 79, double: 22, triple: 1, hr: 7, bb: 44, so: 40, hbp: 4, sb: 3, cs: 2, sec: '1B', fld: 77, arm: 68 },
      { id: 'howarry01', name: 'Ryan Howard', pos: '1B', bats: 'L', age: 29, pa: 703, h: 163, double: 32, triple: 3, hr: 47, bb: 84, so: 195, hbp: 5, sb: 5, cs: 1, sec: '3B', fld: 63 },
      { id: 'utleych01', name: 'Chase Utley', pos: '2B', bats: 'L', age: 30, pa: 687, h: 170, double: 36, triple: 4, hr: 30, bb: 74, so: 105, hbp: 25, sb: 18, cs: 1, sec: 'SS', fld: 77 },
      { id: 'felizpe01', name: 'Pedro Feliz', pos: '3B', bats: 'R', age: 34, pa: 625, h: 150, double: 29, triple: 2, hr: 15, bb: 37, so: 70, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 83 },
      { id: 'rolliji01', name: 'Jimmy Rollins', pos: 'SS', bats: 'S', age: 30, pa: 725, h: 177, double: 42, triple: 9, hr: 20, bb: 51, so: 70, hbp: 4, sb: 39, cs: 6, sec: '2B', fld: 62 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: 'LF', bats: 'L', age: 37, pa: 565, h: 143, double: 33, triple: 3, hr: 25, bb: 53, so: 102, hbp: 3, sb: 2, cs: 1, sec: 'RF', fld: 63, arm: 74 },
      { id: 'victosh01', name: 'Shane Victorino', pos: 'CF', bats: 'R', age: 28, pa: 694, h: 181, double: 36, triple: 10, hr: 13, bb: 55, so: 75, hbp: 8, sb: 33, cs: 9, sec: 'RF', fld: 63, arm: 71 },
      { id: 'werthja01', name: 'Jayson Werth', pos: 'RF', bats: 'R', age: 30, pa: 676, h: 156, double: 25, triple: 2, hr: 34, bb: 88, so: 160, hbp: 7, sb: 22, cs: 2, sec: 'LF', fld: 80, arm: 71 },
      { id: 'costech01', name: 'Chris Coste', pos: 'DH', bats: 'R', age: 36, pa: 230, h: 51, double: 12, triple: 0, hr: 5, bb: 16, so: 46, hbp: 4, sb: 0, cs: 0, sec: 'C', fld: 75, arm: 60 },
    ],
    bench: [
      { id: 'dobbsgr01', name: 'Greg Dobbs', pos: '3B', bats: 'L', age: 30, pa: 169, h: 42, double: 8, triple: 1, hr: 5, bb: 11, so: 29, hbp: 1, sb: 2, cs: 0, sec: '1B' },
      { id: 'bakopa01', name: 'Paul Bako', pos: 'C', bats: 'L', age: 37, pa: 130, h: 25, double: 4, triple: 1, hr: 2, bb: 13, so: 34, hbp: 1, sb: 0, cs: 1, fld: 51, arm: 72 },
      { id: 'stairma01', name: 'Matt Stairs', pos: 'RF', bats: 'L', age: 41, pa: 129, h: 27, double: 5, triple: 0, hr: 5, bb: 16, so: 28, hbp: 2, sb: 0, cs: 0, sec: '1B' },
      { id: 'brunter01', name: 'Eric Bruntlett', pos: '2B', bats: 'R', age: 31, pa: 118, h: 21, double: 5, triple: 0, hr: 0, bb: 9, so: 21, hbp: 2, sb: 4, cs: 1, sec: 'SS' },
      { id: 'maybejo02', name: 'John Mayberry', pos: 'LF', bats: 'R', age: 25, pa: 60, h: 12, double: 3, triple: 0, hr: 4, bb: 2, so: 23, hbp: 1, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    reserveBatters: [
      { id: 'cairomi01', name: 'Miguel Cairo', pos: '2B', bats: 'R', age: 35, pa: 47, h: 11, double: 2, triple: 1, hr: 0, bb: 3, so: 6, hbp: 1, sb: 1, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'blantjo01', name: 'Joe Blanton', role: 'SP', throws: 'R', age: 28, g: 31, gs: 31, outs: 586, h: 203, hr: 24, bb: 56, so: 137, hbp: 6, er: 92, w: 12, l: 8, sv: 0, fld: 72 },
      { id: 'hamelco01', name: 'Cole Hamels', role: 'SP', throws: 'L', age: 25, g: 32, gs: 32, outs: 581, h: 190, hr: 25, bb: 45, so: 175, hbp: 3, er: 82, w: 10, l: 11, sv: 0, fld: 71 },
      { id: 'happja01', name: 'J. A. Happ', role: 'SP', throws: 'L', age: 26, g: 35, gs: 23, outs: 498, h: 149, hr: 20, bb: 58, so: 121, hbp: 5, er: 56, w: 12, l: 4, sv: 0, fld: 68, rk: true },
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 46, g: 30, gs: 25, outs: 486, h: 173, hr: 23, bb: 48, so: 99, hbp: 9, er: 81, w: 12, l: 10, sv: 0, fld: 66 },
      { id: 'myersbr01', name: 'Brett Myers', role: 'SP', throws: 'R', age: 28, g: 18, gs: 10, outs: 212, h: 73, hr: 13, bb: 24, so: 60, hbp: 3, er: 36, w: 4, l: 3, sv: 0 },
      { id: 'lidgebr01', name: 'Brad Lidge', role: 'CL', throws: 'R', age: 32, g: 67, gs: 0, outs: 176, h: 61, hr: 8, bb: 33, so: 75, hbp: 3, er: 32, w: 0, l: 8, sv: 31 },
      { id: 'parkch01', name: 'Chan Ho Park', role: 'RP', throws: 'R', age: 36, g: 45, gs: 7, outs: 250, h: 85, hr: 8, bb: 32, so: 72, hbp: 4, er: 38, w: 3, l: 3, sv: 0 },
      { id: 'madsory01', name: 'Ryan Madson', role: 'RP', throws: 'R', age: 28, g: 79, gs: 0, outs: 232, h: 73, hr: 6, bb: 23, so: 70, hbp: 2, er: 27, w: 5, l: 5, sv: 10 },
      { id: 'durbich01', name: 'Chad Durbin', role: 'RP', throws: 'R', age: 31, g: 59, gs: 0, outs: 209, h: 64, hr: 8, bb: 36, so: 53, hbp: 5, er: 31, w: 2, l: 2, sv: 2 },
      { id: 'martipe02', name: 'Pedro Martinez', role: 'RP', throws: 'R', age: 37, g: 9, gs: 9, outs: 134, h: 49, hr: 7, bb: 13, so: 36, hbp: 3, er: 22, w: 5, l: 1, sv: 0 },
      { id: 'condrcl01', name: 'Clay Condrey', role: 'RP', throws: 'R', age: 33, g: 45, gs: 0, outs: 126, h: 44, hr: 4, bb: 12, so: 22, hbp: 2, er: 15, w: 6, l: 2, sv: 1 },
    ],
    reservePitchers: [
      { id: 'walkety01', name: 'Tyler Walker', role: 'RP', throws: 'R', age: 33, g: 32, gs: 0, outs: 106, h: 31, hr: 4, bb: 11, so: 29, hbp: 2, er: 14, w: 2, l: 1, sv: 0 },
      { id: 'eyresc01', name: 'Scott Eyre', role: 'RP', throws: 'L', age: 37, g: 42, gs: 0, outs: 90, h: 26, hr: 2, bb: 15, so: 26, hbp: 1, er: 9, w: 2, l: 1, sv: 0 },
      { id: 'lopezro01', name: 'Rodrigo Lopez', role: 'RP', throws: 'R', age: 33, g: 7, gs: 5, outs: 90, h: 39, hr: 4, bb: 10, so: 19, hbp: 0, er: 18, w: 3, l: 1, sv: 0 },
      { id: 'taschja01', name: 'Jack Taschner', role: 'RP', throws: 'L', age: 31, g: 24, gs: 0, outs: 88, h: 36, hr: 3, bb: 18, so: 25, hbp: 1, er: 17, w: 1, l: 1, sv: 0 },
      { id: 'kendrky01', name: 'Kyle Kendrick', role: 'RP', throws: 'R', age: 24, g: 9, gs: 2, outs: 79, h: 30, hr: 3, bb: 8, so: 11, hbp: 2, er: 14, w: 3, l: 1, sv: 0 },
    ],
  },
  // WSH (WAS 2009)
  {
    franchiseId: 'WSH',
    season: 2009,
    batters: [
      { id: 'bardjo01', name: 'Josh Bard', pos: 'C', bats: 'S', age: 31, pa: 301, h: 64, double: 17, triple: 0, hr: 4, bb: 27, so: 45, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 69, arm: 68 },
      { id: 'dunnad01', name: 'Adam Dunn', pos: '1B', bats: 'L', age: 29, pa: 668, h: 139, double: 27, triple: 0, hr: 40, bb: 118, so: 174, hbp: 5, sb: 2, cs: 1, sec: 'LF', fld: 57 },
      { id: 'hernaan01', name: 'Anderson Hernandez', pos: '2B', bats: 'S', age: 26, pa: 404, h: 96, double: 15, triple: 3, hr: 3, bb: 34, so: 60, hbp: 0, sb: 6, cs: 4, sec: 'SS', fld: 88 },
      { id: 'zimmery01', name: 'Ryan Zimmerman', pos: '3B', bats: 'R', age: 24, pa: 693, h: 176, double: 37, triple: 3, hr: 28, bb: 63, so: 116, hbp: 3, sb: 2, cs: 1, sec: '1B', fld: 87 },
      { id: 'guzmacr01', name: 'Cristian Guzman', pos: 'SS', bats: 'S', age: 31, pa: 555, h: 158, double: 27, triple: 7, hr: 7, bb: 20, so: 65, hbp: 3, sb: 5, cs: 5, sec: '2B', fld: 72 },
      { id: 'willijo03', name: 'Josh Willingham', pos: 'LF', bats: 'R', age: 30, pa: 502, h: 111, double: 27, triple: 2, hr: 21, bb: 59, so: 102, hbp: 14, sb: 4, cs: 2, sec: 'RF', fld: 69, arm: 60 },
      { id: 'harriwi01', name: 'Willie Harris', pos: 'CF', bats: 'L', age: 31, pa: 393, h: 82, double: 17, triple: 6, hr: 8, bb: 51, so: 63, hbp: 6, sb: 12, cs: 5, sec: 'LF', fld: 68, arm: 59 },
      { id: 'dukesel01', name: 'Elijah Dukes', pos: 'RF', bats: 'R', age: 25, pa: 416, h: 88, double: 19, triple: 4, hr: 12, bb: 53, so: 83, hbp: 4, sb: 7, cs: 8, sec: 'CF', fld: 76, arm: 86 },
      { id: 'gonzaal03', name: 'Alberto Gonzalez', pos: 'DH', bats: 'R', age: 26, pa: 316, h: 76, double: 17, triple: 2, hr: 1, bb: 16, so: 29, hbp: 3, sb: 1, cs: 2, sec: '3B', fld: 87, rk: true },
    ],
    bench: [
      { id: 'johnsni01', name: 'Nick Johnson', pos: '1B', bats: 'L', age: 30, pa: 574, h: 127, double: 25, triple: 2, hr: 10, bb: 103, so: 86, hbp: 13, sb: 2, cs: 3, sec: '3B', fld: 68 },
      { id: 'belliro01', name: 'Ronnie Belliard', pos: '2B', bats: 'R', age: 34, pa: 287, h: 74, double: 17, triple: 1, hr: 9, bb: 23, so: 49, hbp: 1, sb: 2, cs: 1, sec: '3B', fld: 71 },
      { id: 'nievewi01', name: 'Wil Nieves', pos: 'C', bats: 'R', age: 31, pa: 249, h: 57, double: 8, triple: 0, hr: 1, bb: 16, so: 42, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 65, arm: 68 },
      { id: 'kearnau01', name: 'Austin Kearns', pos: 'RF', bats: 'R', age: 29, pa: 211, h: 41, double: 8, triple: 1, hr: 4, bb: 25, so: 40, hbp: 4, sb: 1, cs: 1, sec: 'CF', fld: 74, arm: 83 },
      { id: 'floreje02', name: 'Jesus Flores', pos: 'C', bats: 'R', age: 24, pa: 106, h: 26, double: 5, triple: 1, hr: 3, bb: 7, so: 26, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 69, arm: 82 },
    ],
    reserveBatters: [
      { id: 'maxweju01', name: 'Justin Maxwell', pos: 'CF', bats: 'R', age: 25, pa: 102, h: 22, double: 4, triple: 1, hr: 4, bb: 11, so: 32, hbp: 1, sb: 6, cs: 1, sec: 'LF', fld: 75, arm: 67, rk: true },
      { id: 'desmoia01', name: 'Ian Desmond', pos: 'SS', bats: 'R', age: 23, pa: 89, h: 23, double: 7, triple: 2, hr: 4, bb: 5, so: 14, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 90, rk: true },
      { id: 'orrpe01', name: 'Pete Orr', pos: '2B', bats: 'L', age: 30, pa: 81, h: 19, double: 2, triple: 1, hr: 1, bb: 3, so: 16, hbp: 0, sb: 2, cs: 1, sec: '3B' },
      { id: 'morsemi01', name: 'Mike Morse', pos: '1B', bats: 'R', age: 27, pa: 55, h: 14, double: 3, triple: 0, hr: 2, bb: 3, so: 16, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'lannajo01', name: 'John Lannan', role: 'SP', throws: 'L', age: 24, g: 33, gs: 33, outs: 619, h: 204, hr: 23, bb: 74, so: 103, hbp: 7, er: 89, w: 9, l: 13, sv: 0, fld: 71 },
      { id: 'stammcr01', name: 'Craig Stammen', role: 'SP', throws: 'R', age: 25, g: 19, gs: 19, outs: 317, h: 112, hr: 14, bb: 24, so: 48, hbp: 3, er: 60, w: 4, l: 7, sv: 0, rk: true },
      { id: 'mockga01', name: 'Garrett Mock', role: 'SP', throws: 'R', age: 26, g: 28, gs: 15, outs: 274, h: 108, hr: 9, bb: 46, so: 80, hbp: 1, er: 54, w: 3, l: 10, sv: 0, rk: true },
      { id: 'zimmejo02', name: 'Jordan Zimmermann', role: 'SP', throws: 'R', age: 23, g: 16, gs: 16, outs: 274, h: 95, hr: 10, bb: 29, so: 92, hbp: 4, er: 47, w: 3, l: 5, sv: 0, rk: true },
      { id: 'martish01', name: 'Shairon Martis', role: 'SP', throws: 'R', age: 22, g: 15, gs: 15, outs: 257, h: 82, hr: 12, bb: 41, so: 43, hbp: 3, er: 51, w: 5, l: 3, sv: 0, rk: true },
      { id: 'macdomi01', name: 'Mike MacDougal', role: 'CL', throws: 'R', age: 32, g: 57, gs: 0, outs: 163, h: 53, hr: 3, bb: 38, so: 37, hbp: 3, er: 26, w: 1, l: 1, sv: 20 },
      { id: 'hanrajo01', name: 'Joel Hanrahan', role: 'RP', throws: 'R', age: 27, g: 67, gs: 0, outs: 192, h: 68, hr: 6, bb: 36, so: 71, hbp: 2, er: 33, w: 1, l: 4, sv: 5 },
      { id: 'clippty01', name: 'Tyler Clippard', role: 'RP', throws: 'R', age: 24, g: 41, gs: 0, outs: 181, h: 41, hr: 9, bb: 32, so: 60, hbp: 1, er: 21, w: 4, l: 2, sv: 0, rk: true },
      { id: 'beimejo01', name: 'Joe Beimel', role: 'RP', throws: 'L', age: 32, g: 71, gs: 0, outs: 166, h: 56, hr: 3, bb: 20, so: 35, hbp: 2, er: 19, w: 1, l: 6, sv: 1 },
      { id: 'cabreda01', name: 'Daniel Cabrera', role: 'RP', throws: 'R', age: 28, g: 15, gs: 9, outs: 153, h: 59, hr: 6, bb: 31, so: 32, hbp: 5, er: 33, w: 0, l: 6, sv: 0 },
      { id: 'villoro01', name: 'Ron Villone', role: 'RP', throws: 'L', age: 39, g: 63, gs: 0, outs: 146, h: 49, hr: 5, bb: 31, so: 38, hbp: 2, er: 24, w: 5, l: 6, sv: 1 },
    ],
    reservePitchers: [
      { id: 'martijd01', name: 'J. D. Martin', role: 'SP', throws: 'R', age: 26, g: 15, gs: 15, outs: 231, h: 85, hr: 14, bb: 24, so: 37, hbp: 6, er: 38, w: 5, l: 4, sv: 0, rk: true },
      { id: 'detwiro01', name: 'Ross Detwiler', role: 'SP', throws: 'L', age: 23, g: 15, gs: 14, outs: 227, h: 87, hr: 3, bb: 33, so: 43, hbp: 2, er: 42, w: 1, l: 6, sv: 0, rk: true },
      { id: 'olsensc01', name: 'Scott Olsen', role: 'SP', throws: 'L', age: 25, g: 11, gs: 11, outs: 188, h: 74, hr: 10, bb: 25, so: 41, hbp: 1, er: 36, w: 2, l: 4, sv: 0 },
      { id: 'bergmja01', name: 'Jason Bergmann', role: 'RP', throws: 'R', age: 27, g: 56, gs: 0, outs: 144, h: 51, hr: 8, bb: 20, so: 37, hbp: 1, er: 27, w: 2, l: 4, sv: 0 },
      { id: 'riversa01', name: 'Saul Rivera', role: 'RP', throws: 'R', age: 31, g: 30, gs: 0, outs: 115, h: 43, hr: 3, bb: 16, so: 27, hbp: 2, er: 20, w: 1, l: 3, sv: 0 },
    ],
  },
  // CHC (CHN 2009)
  {
    franchiseId: 'CHC',
    season: 2009,
    batters: [
      { id: 'sotoge01', name: 'Geovany Soto', pos: 'C', bats: 'R', age: 26, pa: 389, h: 86, double: 22, triple: 1, hr: 14, bb: 46, so: 81, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 69 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 33, pa: 615, h: 163, double: 37, triple: 2, hr: 26, bb: 70, so: 107, hbp: 3, sb: 4, cs: 1, sec: '3B', fld: 72 },
      { id: 'fontemi01', name: 'Mike Fontenot', pos: '2B', bats: 'L', age: 29, pa: 419, h: 96, double: 25, triple: 2, hr: 10, bb: 39, so: 79, hbp: 2, sb: 4, cs: 1, sec: '3B', fld: 56 },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 31, pa: 342, h: 91, double: 20, triple: 1, hr: 15, bb: 33, so: 46, hbp: 6, sb: 1, cs: 1, sec: '1B', fld: 59 },
      { id: 'theriry01', name: 'Ryan Theriot', pos: 'SS', bats: 'R', age: 29, pa: 677, h: 173, double: 22, triple: 4, hr: 4, bb: 60, so: 76, hbp: 4, sb: 23, cs: 10, sec: '2B', fld: 67 },
      { id: 'soriaal01', name: 'Alfonso Soriano', pos: 'LF', bats: 'R', age: 33, pa: 522, h: 126, double: 28, triple: 1, hr: 25, bb: 39, so: 113, hbp: 3, sb: 14, cs: 3, sec: 'CF', fld: 53, arm: 71 },
      { id: 'fukudko01', name: 'Kosuke Fukudome', pos: 'CF', bats: 'L', age: 32, pa: 603, h: 130, double: 33, triple: 4, hr: 11, bb: 89, so: 110, hbp: 2, sb: 8, cs: 8, sec: 'RF', fld: 64, arm: 66 },
      { id: 'bradlmi01', name: 'Milton Bradley', pos: 'RF', bats: 'S', age: 31, pa: 473, h: 112, double: 22, triple: 1, hr: 16, bb: 69, so: 97, hbp: 10, sb: 4, cs: 3, sec: 'CF', fld: 65, arm: 65 },
      { id: 'hoffpmi01', name: 'Micah Hoffpauir', pos: 'DH', bats: 'L', age: 29, pa: 257, h: 60, double: 14, triple: 1, hr: 9, bb: 20, so: 51, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 64, rk: true },
    ],
    bench: [
      { id: 'hillko01', name: 'Koyie Hill', pos: 'C', bats: 'S', age: 30, pa: 284, h: 56, double: 12, triple: 2, hr: 2, bb: 25, so: 78, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 75, arm: 80 },
      { id: 'bakerje03', name: 'Jeff Baker', pos: '2B', bats: 'R', age: 28, pa: 248, h: 61, double: 14, triple: 2, hr: 6, bb: 19, so: 58, hbp: 2, sb: 2, cs: 0, sec: '3B', fld: 91 },
      { id: 'foxja02', name: 'Jake Fox', pos: '3B', bats: 'R', age: 26, pa: 241, h: 56, double: 12, triple: 0, hr: 11, bb: 14, so: 47, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 46, rk: true },
      { id: 'johnsre02', name: 'Reed Johnson', pos: 'CF', bats: 'R', age: 32, pa: 186, h: 45, double: 10, triple: 1, hr: 3, bb: 11, so: 31, hbp: 6, sb: 2, cs: 2, sec: 'LF', fld: 48, arm: 77 },
      { id: 'milesaa01', name: 'Aaron Miles', pos: '2B', bats: 'S', age: 32, pa: 170, h: 43, double: 6, triple: 1, hr: 1, bb: 9, so: 17, hbp: 0, sb: 2, cs: 1, sec: 'SS', fld: 75 },
    ],
    reserveBatters: [
      { id: 'blancan01', name: 'Andres Blanco', pos: '2B', bats: 'S', age: 25, pa: 138, h: 31, double: 8, triple: 0, hr: 1, bb: 8, so: 14, hbp: 1, sb: 0, cs: 2, sec: 'SS', fld: 82 },
      { id: 'scalebo01', name: 'Bobby Scales', pos: 'LF', bats: 'S', age: 31, pa: 138, h: 30, double: 8, triple: 2, hr: 3, bb: 11, so: 32, hbp: 2, sb: 0, cs: 0, sec: 'RF', rk: true },
      { id: 'fuldsa01', name: 'Sam Fuld', pos: 'LF', bats: 'L', age: 27, pa: 115, h: 28, double: 6, triple: 1, hr: 1, bb: 18, so: 11, hbp: 1, sb: 2, cs: 1, sec: 'CF', fld: 80, arm: 65, rk: true },
    ],
    pitchers: [
      { id: 'dempsry01', name: 'Ryan Dempster', role: 'SP', throws: 'R', age: 32, g: 31, gs: 31, outs: 600, h: 186, hr: 19, bb: 70, so: 176, hbp: 6, er: 77, w: 11, l: 9, sv: 0, fld: 80 },
      { id: 'lillyte01', name: 'Ted Lilly', role: 'SP', throws: 'L', age: 33, g: 27, gs: 27, outs: 531, h: 152, hr: 24, bb: 44, so: 150, hbp: 3, er: 69, w: 12, l: 9, sv: 0, fld: 50 },
      { id: 'zambrca01', name: 'Carlos Zambrano', role: 'SP', throws: 'R', age: 28, g: 28, gs: 28, outs: 508, h: 155, hr: 14, bb: 74, so: 139, hbp: 8, er: 73, w: 9, l: 7, sv: 0, fld: 79 },
      { id: 'wellsra01', name: 'Randy Wells', role: 'SP', throws: 'R', age: 26, g: 27, gs: 27, outs: 496, h: 162, hr: 14, bb: 47, so: 103, hbp: 6, er: 55, w: 12, l: 10, sv: 0, fld: 73, rk: true },
      { id: 'harderi01', name: 'Rich Harden', role: 'SP', throws: 'R', age: 27, g: 26, gs: 26, outs: 423, h: 112, hr: 18, bb: 65, so: 176, hbp: 5, er: 52, w: 9, l: 9, sv: 0, fld: 54 },
      { id: 'greggke01', name: 'Kevin Gregg', role: 'CL', throws: 'R', age: 31, g: 72, gs: 0, outs: 206, h: 56, hr: 8, bb: 33, so: 67, hbp: 4, er: 31, w: 5, l: 6, sv: 23 },
      { id: 'marshse01', name: 'Sean Marshall', role: 'RP', throws: 'L', age: 26, g: 55, gs: 9, outs: 256, h: 88, hr: 11, bb: 31, so: 68, hbp: 2, er: 39, w: 3, l: 7, sv: 0 },
      { id: 'marmoca01', name: 'Carlos Marmol', role: 'RP', throws: 'R', age: 26, g: 79, gs: 0, outs: 222, h: 42, hr: 5, bb: 53, so: 102, hbp: 9, er: 25, w: 2, l: 4, sv: 15 },
      { id: 'heilmaa01', name: 'Aaron Heilman', role: 'RP', throws: 'R', age: 30, g: 70, gs: 0, outs: 217, h: 67, hr: 9, bb: 34, so: 66, hbp: 4, er: 34, w: 4, l: 4, sv: 1 },
      { id: 'guzmaan01', name: 'Angel Guzman', role: 'RP', throws: 'R', age: 27, g: 55, gs: 0, outs: 183, h: 45, hr: 7, bb: 22, so: 48, hbp: 2, er: 22, w: 3, l: 3, sv: 1 },
      { id: 'gorzeto01', name: 'Tom Gorzelanny', role: 'RP', throws: 'L', age: 26, g: 22, gs: 7, outs: 141, h: 48, hr: 6, bb: 21, so: 33, hbp: 1, er: 27, w: 7, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'samarje01', name: 'Jeff Samardzija', role: 'RP', throws: 'R', age: 24, g: 20, gs: 2, outs: 104, h: 42, hr: 5, bb: 17, so: 25, hbp: 1, er: 23, w: 1, l: 3, sv: 0, rk: true },
      { id: 'pattoda01', name: 'David Patton', role: 'RP', throws: 'R', age: 25, g: 20, gs: 0, outs: 83, h: 31, hr: 4, bb: 19, so: 23, hbp: 0, er: 21, w: 3, l: 1, sv: 0, rk: true },
      { id: 'carides01', name: 'Esmailin Caridad', role: 'RP', throws: 'R', age: 25, g: 14, gs: 0, outs: 58, h: 15, hr: 0, bb: 3, so: 17, hbp: 3, er: 3, w: 1, l: 0, sv: 0, rk: true },
      { id: 'ascanjo01', name: 'Jose Ascanio', role: 'RP', throws: 'R', age: 24, g: 16, gs: 0, outs: 54, h: 22, hr: 2, bb: 9, so: 18, hbp: 2, er: 10, w: 0, l: 2, sv: 0, rk: true },
      { id: 'steveje01', name: 'Jeff Stevens', role: 'RP', throws: 'R', age: 25, g: 11, gs: 0, outs: 38, h: 14, hr: 2, bb: 8, so: 9, hbp: 1, er: 10, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // CIN (CIN 2009)
  {
    franchiseId: 'CIN',
    season: 2009,
    batters: [
      { id: 'hernara02', name: 'Ramon Hernandez', pos: 'C', bats: 'R', age: 33, pa: 331, h: 76, double: 14, triple: 1, hr: 7, bb: 27, so: 39, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 79, arm: 76 },
      { id: 'vottojo01', name: 'Joey Votto', pos: '1B', bats: 'L', age: 25, pa: 544, h: 149, double: 35, triple: 2, hr: 24, bb: 62, so: 101, hbp: 3, sb: 5, cs: 2, sec: '3B', fld: 72 },
      { id: 'phillbr01', name: 'Brandon Phillips', pos: '2B', bats: 'R', age: 28, pa: 644, h: 161, double: 27, triple: 6, hr: 22, bb: 41, so: 87, hbp: 7, sb: 26, cs: 9, sec: 'SS', fld: 70 },
      { id: 'hairsje02', name: 'Jerry Hairston', pos: '3B', bats: 'R', age: 33, pa: 433, h: 102, double: 24, triple: 1, hr: 9, bb: 32, so: 54, hbp: 6, sb: 12, cs: 4, sec: '2B', fld: 57 },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 32, pa: 429, h: 96, double: 23, triple: 0, hr: 10, bb: 21, so: 67, hbp: 5, sb: 1, cs: 1, sec: '2B', fld: 61 },
      { id: 'nixla01', name: 'Laynce Nix', pos: 'LF', bats: 'L', age: 28, pa: 337, h: 72, double: 25, triple: 1, hr: 14, bb: 22, so: 81, hbp: 2, sb: 0, cs: 1, sec: 'CF', fld: 67, arm: 62 },
      { id: 'taverwi01', name: 'Willy Taveras', pos: 'CF', bats: 'R', age: 27, pa: 437, h: 102, double: 12, triple: 2, hr: 1, bb: 23, so: 61, hbp: 4, sb: 38, cs: 6, sec: 'LF', fld: 82, arm: 77 },
      { id: 'bruceja01', name: 'Jay Bruce', pos: 'RF', bats: 'L', age: 22, pa: 387, h: 83, double: 15, triple: 1, hr: 20, bb: 34, so: 83, hbp: 3, sb: 3, cs: 4, sec: 'CF', fld: 81, arm: 84 },
      { id: 'gomesjo01', name: 'Jonny Gomes', pos: 'DH', bats: 'R', age: 28, pa: 314, h: 68, double: 15, triple: 1, hr: 17, bb: 27, so: 88, hbp: 7, sb: 7, cs: 2, sec: 'RF', fld: 65, arm: 77 },
    ],
    bench: [
      { id: 'dickech01', name: 'Chris Dickerson', pos: 'LF', bats: 'L', age: 27, pa: 299, h: 71, double: 15, triple: 3, hr: 5, bb: 40, so: 70, hbp: 2, sb: 11, cs: 4, sec: 'CF', fld: 81, arm: 76, rk: true },
      { id: 'hanigry01', name: 'Ryan Hanigan', pos: 'C', bats: 'R', age: 28, pa: 293, h: 67, double: 6, triple: 1, hr: 4, bb: 36, so: 30, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 83, rk: true },
      { id: 'janispa01', name: 'Paul Janish', pos: 'SS', bats: 'R', age: 26, pa: 292, h: 53, double: 19, triple: 0, hr: 1, bb: 25, so: 43, hbp: 5, sb: 2, cs: 0, sec: '2B', fld: 90, rk: true },
      { id: 'rosalad01', name: 'Adam Rosales', pos: '3B', bats: 'R', age: 26, pa: 266, h: 49, double: 10, triple: 1, hr: 4, bb: 25, so: 45, hbp: 5, sb: 2, cs: 2, sec: '1B', fld: 64, rk: true },
      { id: 'stubbdr01', name: 'Drew Stubbs', pos: 'CF', bats: 'R', age: 24, pa: 196, h: 48, double: 5, triple: 1, hr: 8, bb: 15, so: 49, hbp: 0, sb: 10, cs: 4, sec: 'LF', fld: 85, arm: 84, rk: true },
    ],
    reserveBatters: [
      { id: 'mcdonda02', name: 'Darnell McDonald', pos: 'LF', bats: 'R', age: 30, pa: 111, h: 27, double: 6, triple: 1, hr: 2, bb: 5, so: 31, hbp: 1, sb: 1, cs: 0, sec: 'RF', fld: 79, arm: 76, rk: true },
      { id: 'milleco01', name: 'Corky Miller', pos: 'C', bats: 'R', age: 33, pa: 111, h: 16, double: 3, triple: 0, hr: 1, bb: 11, so: 23, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 75, arm: 65 },
      { id: 'tatumcr01', name: 'Craig Tatum', pos: 'C', bats: 'R', age: 26, pa: 77, h: 11, double: 1, triple: 0, hr: 1, bb: 7, so: 10, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 77, rk: true },
      { id: 'suttodr01', name: 'Drew Sutton', pos: '2B', bats: 'S', age: 26, pa: 76, h: 14, double: 4, triple: 1, hr: 1, bb: 7, so: 20, hbp: 1, sb: 0, cs: 2, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'arroybr01', name: 'Bronson Arroyo', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 661, h: 223, hr: 30, bb: 67, so: 147, hbp: 9, er: 101, w: 15, l: 13, sv: 0, fld: 77 },
      { id: 'cuetojo01', name: 'Johnny Cueto', role: 'SP', throws: 'R', age: 23, g: 30, gs: 30, outs: 514, h: 172, hr: 26, bb: 63, so: 141, hbp: 14, er: 87, w: 11, l: 11, sv: 0, fld: 55 },
      { id: 'haranaa01', name: 'Aaron Harang', role: 'SP', throws: 'R', age: 31, g: 26, gs: 26, outs: 487, h: 179, hr: 26, bb: 43, so: 144, hbp: 4, er: 79, w: 6, l: 14, sv: 0, fld: 54 },
      { id: 'owingmi01', name: 'Micah Owings', role: 'SP', throws: 'R', age: 26, g: 26, gs: 19, outs: 359, h: 124, hr: 17, bb: 55, so: 82, hbp: 9, er: 72, w: 7, l: 12, sv: 1 },
      { id: 'baileho02', name: 'Homer Bailey', role: 'SP', throws: 'R', age: 23, g: 20, gs: 20, outs: 340, h: 122, hr: 13, bb: 53, so: 78, hbp: 3, er: 64, w: 8, l: 5, sv: 0 },
      { id: 'cordefr01', name: 'Francisco Cordero', role: 'CL', throws: 'R', age: 34, g: 68, gs: 0, outs: 200, h: 57, hr: 4, bb: 30, so: 68, hbp: 1, er: 20, w: 2, l: 6, sv: 39 },
      { id: 'masseni01', name: 'Nick Masset', role: 'RP', throws: 'R', age: 27, g: 74, gs: 0, outs: 228, h: 65, hr: 6, bb: 27, so: 58, hbp: 1, er: 26, w: 5, l: 1, sv: 0 },
      { id: 'wellski01', name: 'Kip Wells', role: 'RP', throws: 'R', age: 32, g: 33, gs: 7, outs: 218, h: 68, hr: 7, bb: 40, so: 48, hbp: 4, er: 44, w: 2, l: 5, sv: 2 },
      { id: 'weathda01', name: 'David Weathers', role: 'RP', throws: 'R', age: 39, g: 68, gs: 0, outs: 186, h: 57, hr: 7, bb: 26, so: 38, hbp: 3, er: 25, w: 4, l: 6, sv: 1 },
      { id: 'herreda01', name: 'Danny Herrera', role: 'RP', throws: 'L', age: 24, g: 70, gs: 0, outs: 185, h: 64, hr: 5, bb: 24, so: 45, hbp: 3, er: 23, w: 4, l: 4, sv: 0, rk: true },
      { id: 'burtoja01', name: 'Jared Burton', role: 'RP', throws: 'R', age: 28, g: 53, gs: 0, outs: 178, h: 57, hr: 5, bb: 25, so: 51, hbp: 3, er: 25, w: 1, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'lehrju01', name: 'Justin Lehr', role: 'SP', throws: 'R', age: 31, g: 11, gs: 11, outs: 196, h: 72, hr: 14, bb: 28, so: 33, hbp: 3, er: 39, w: 5, l: 3, sv: 0 },
      { id: 'rhodear01', name: 'Arthur Rhodes', role: 'RP', throws: 'L', age: 39, g: 66, gs: 0, outs: 160, h: 38, hr: 2, bb: 21, so: 51, hbp: 1, er: 14, w: 1, l: 1, sv: 0 },
      { id: 'fisheca01', name: 'Carlos Fisher', role: 'RP', throws: 'R', age: 26, g: 39, gs: 0, outs: 157, h: 50, hr: 4, bb: 31, so: 48, hbp: 1, er: 26, w: 1, l: 1, sv: 0, rk: true },
      { id: 'volqued01', name: 'Edinson Volquez', role: 'RP', throws: 'R', age: 25, g: 9, gs: 9, outs: 149, h: 41, hr: 4, bb: 26, so: 50, hbp: 4, er: 20, w: 4, l: 2, sv: 0 },
      { id: 'malonma02', name: 'Matt Maloney', role: 'RP', throws: 'L', age: 25, g: 7, gs: 7, outs: 122, h: 43, hr: 9, bb: 8, so: 28, hbp: 3, er: 22, w: 2, l: 4, sv: 0, rk: true },
    ],
  },
  // MIL (MIL 2009)
  {
    franchiseId: 'MIL',
    season: 2009,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 35, pa: 526, h: 112, double: 22, triple: 2, hr: 2, bb: 43, so: 49, hbp: 14, sb: 6, cs: 3, fld: 72, arm: 61 },
      { id: 'fieldpr01', name: 'Prince Fielder', pos: '1B', bats: 'L', age: 25, pa: 719, h: 174, double: 34, triple: 3, hr: 44, bb: 100, so: 137, hbp: 11, sb: 2, cs: 3, sec: '3B', fld: 62 },
      { id: 'counscr01', name: 'Craig Counsell', pos: '2B', bats: 'L', age: 38, pa: 459, h: 103, double: 21, triple: 6, hr: 3, bb: 51, so: 58, hbp: 6, sb: 4, cs: 3, sec: 'SS', fld: 87 },
      { id: 'mcgehca01', name: 'Casey McGehee', pos: '3B', bats: 'R', age: 26, pa: 394, h: 105, double: 20, triple: 1, hr: 15, bb: 33, so: 69, hbp: 1, sb: 0, cs: 2, sec: '2B', fld: 54, rk: true },
      { id: 'hardyjj01', name: 'J. J. Hardy', pos: 'SS', bats: 'R', age: 26, pa: 465, h: 109, double: 20, triple: 2, hr: 15, bb: 39, so: 74, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 72 },
      { id: 'braunry02', name: 'Ryan Braun', pos: 'LF', bats: 'R', age: 25, pa: 708, h: 198, double: 40, triple: 7, hr: 37, bb: 51, so: 132, hbp: 10, sb: 18, cs: 6, sec: 'RF', fld: 72, arm: 69 },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 36, pa: 628, h: 135, double: 32, triple: 3, hr: 25, bb: 71, so: 161, hbp: 6, sb: 13, cs: 4, sec: 'RF', fld: 83, arm: 63 },
      { id: 'hartco01', name: 'Corey Hart', pos: 'RF', bats: 'R', age: 27, pa: 472, h: 115, double: 28, triple: 4, hr: 14, bb: 31, so: 85, hbp: 6, sb: 15, cs: 6, sec: 'CF', fld: 56, arm: 60 },
      { id: 'gamelma01', name: 'Mat Gamel', pos: 'DH', bats: 'L', age: 23, pa: 148, h: 31, double: 7, triple: 1, hr: 5, bb: 18, so: 54, hbp: 1, sb: 1, cs: 0, sec: '3B', fld: 57, rk: true },
    ],
    bench: [
      { id: 'hallbi03', name: 'Bill Hall', pos: '3B', bats: 'R', age: 29, pa: 365, h: 73, double: 20, triple: 1, hr: 10, bb: 29, so: 108, hbp: 1, sb: 3, cs: 3, sec: 'SS', fld: 96 },
      { id: 'gerutjo01', name: 'Jody Gerut', pos: 'CF', bats: 'L', age: 31, pa: 298, h: 71, double: 13, triple: 1, hr: 10, bb: 21, so: 43, hbp: 1, sb: 6, cs: 3, sec: 'RF', fld: 62, arm: 70 },
      { id: 'catalfr01', name: 'Frank Catalanotto', pos: 'RF', bats: 'L', age: 35, pa: 162, h: 39, double: 10, triple: 2, hr: 2, bb: 13, so: 19, hbp: 3, sb: 1, cs: 0, sec: 'LF', fld: 75, arm: 70 },
      { id: 'weeksri01', name: 'Rickie Weeks', pos: '2B', bats: 'R', age: 26, pa: 162, h: 34, double: 6, triple: 2, hr: 5, bb: 19, so: 36, hbp: 4, sb: 5, cs: 1, sec: 'SS', fld: 56 },
      { id: 'escobal02', name: 'Alcides Escobar', pos: 'SS', bats: 'R', age: 22, pa: 134, h: 39, double: 3, triple: 1, hr: 1, bb: 4, so: 18, hbp: 2, sb: 4, cs: 2, sec: '2B', fld: 72, rk: true },
    ],
    reserveBatters: [
      { id: 'rivermi02', name: 'Mike Rivera', pos: 'C', bats: 'R', age: 32, pa: 132, h: 29, double: 7, triple: 0, hr: 2, bb: 14, so: 29, hbp: 2, sb: 2, cs: 0, sec: '1B', fld: 75, arm: 63 },
      { id: 'bourgja01', name: 'Jason Bourgeois', pos: 'RF', bats: 'R', age: 27, pa: 40, h: 7, double: 1, triple: 0, hr: 1, bb: 3, so: 7, hbp: 0, sb: 3, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'loopebr01', name: 'Braden Looper', role: 'SP', throws: 'R', age: 34, g: 34, gs: 34, outs: 584, h: 221, hr: 32, bb: 57, so: 103, hbp: 7, er: 106, w: 14, l: 7, sv: 0, fld: 77 },
      { id: 'gallayo01', name: 'Yovani Gallardo', role: 'SP', throws: 'R', age: 23, g: 30, gs: 30, outs: 557, h: 155, hr: 20, bb: 87, so: 196, hbp: 4, er: 74, w: 13, l: 12, sv: 0, fld: 66 },
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 34, g: 30, gs: 30, outs: 485, h: 199, hr: 24, bb: 67, so: 84, hbp: 8, er: 93, w: 7, l: 12, sv: 0, fld: 72 },
      { id: 'parrama01', name: 'Manny Parra', role: 'SP', throws: 'L', age: 26, g: 27, gs: 27, outs: 420, h: 171, hr: 17, bb: 73, so: 124, hbp: 2, er: 87, w: 11, l: 11, sv: 0, fld: 43 },
      { id: 'bushda01', name: 'Dave Bush', role: 'SP', throws: 'R', age: 29, g: 22, gs: 21, outs: 343, h: 124, hr: 19, bb: 33, so: 82, hbp: 10, er: 69, w: 5, l: 9, sv: 0 },
      { id: 'hoffmtr01', name: 'Trevor Hoffman', role: 'CL', throws: 'R', age: 41, g: 55, gs: 0, outs: 162, h: 39, hr: 4, bb: 13, so: 48, hbp: 1, er: 15, w: 3, l: 2, sv: 37 },
      { id: 'villaca01', name: 'Carlos Villanueva', role: 'RP', throws: 'R', age: 25, g: 64, gs: 6, outs: 288, h: 99, hr: 14, bb: 34, so: 84, hbp: 2, er: 50, w: 4, l: 10, sv: 3 },
      { id: 'coffeto01', name: 'Todd Coffey', role: 'RP', throws: 'R', age: 28, g: 78, gs: 0, outs: 251, h: 82, hr: 10, bb: 22, so: 61, hbp: 4, er: 32, w: 4, l: 4, sv: 2 },
      { id: 'mccluse01', name: 'Seth McClung', role: 'RP', throws: 'R', age: 28, g: 41, gs: 2, outs: 186, h: 59, hr: 8, bb: 36, so: 47, hbp: 3, er: 31, w: 3, l: 3, sv: 0 },
      { id: 'burnsmi01', name: 'Mike Burns', role: 'RP', throws: 'R', age: 30, g: 15, gs: 8, outs: 155, h: 60, hr: 10, bb: 17, so: 39, hbp: 1, er: 33, w: 3, l: 5, sv: 0 },
      { id: 'difelma01', name: 'Mark DiFelice', role: 'RP', throws: 'R', age: 32, g: 59, gs: 0, outs: 155, h: 49, hr: 7, bb: 14, so: 50, hbp: 1, er: 20, w: 4, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'narvech01', name: 'Chris Narveson', role: 'RP', throws: 'L', age: 27, g: 21, gs: 4, outs: 141, h: 45, hr: 7, bb: 16, so: 46, hbp: 2, er: 20, w: 2, l: 0, sv: 0, rk: true },
      { id: 'smithch07', name: 'Chris Smith', role: 'RP', throws: 'R', age: 28, g: 35, gs: 0, outs: 138, h: 42, hr: 12, bb: 19, so: 35, hbp: 2, er: 25, w: 0, l: 0, sv: 0, rk: true },
      { id: 'stettmi01', name: 'Mitch Stetter', role: 'RP', throws: 'L', age: 28, g: 71, gs: 0, outs: 135, h: 33, hr: 4, bb: 29, so: 47, hbp: 6, er: 18, w: 4, l: 1, sv: 1, rk: true },
      { id: 'vargacl01', name: 'Claudio Vargas', role: 'RP', throws: 'R', age: 31, g: 36, gs: 0, outs: 124, h: 34, hr: 5, bb: 14, so: 28, hbp: 1, er: 16, w: 1, l: 0, sv: 0 },
      { id: 'juliojo01', name: 'Jorge Julio', role: 'RP', throws: 'R', age: 30, g: 15, gs: 0, outs: 52, h: 18, hr: 2, bb: 12, so: 17, hbp: 2, er: 11, w: 1, l: 1, sv: 0 },
    ],
  },
  // PIT (PIT 2009)
  {
    franchiseId: 'PIT',
    season: 2009,
    batters: [
      { id: 'doumiry01', name: 'Ryan Doumit', pos: 'C', bats: 'S', age: 28, pa: 304, h: 79, double: 19, triple: 0, hr: 10, bb: 18, so: 45, hbp: 3, sb: 2, cs: 1, sec: '1B', fld: 69, arm: 72 },
      { id: 'larocad01', name: 'Adam LaRoche', pos: '1B', bats: 'L', age: 29, pa: 629, h: 153, double: 38, triple: 2, hr: 25, bb: 65, so: 139, hbp: 1, sb: 2, cs: 2, sec: '3B', fld: 80 },
      { id: 'sanchfr01', name: 'Freddy Sanchez', pos: '2B', bats: 'R', age: 31, pa: 489, h: 131, double: 27, triple: 2, hr: 7, bb: 21, so: 63, hbp: 3, sb: 2, cs: 1, sec: '3B', fld: 75 },
      { id: 'larocan01', name: 'Andy LaRoche', pos: '3B', bats: 'R', age: 25, pa: 590, h: 123, double: 25, triple: 4, hr: 12, bb: 54, so: 86, hbp: 7, sb: 4, cs: 1, sec: '1B', fld: 92 },
      { id: 'wilsoja02', name: 'Jack Wilson', pos: 'SS', bats: 'R', age: 31, pa: 402, h: 99, double: 22, triple: 1, hr: 5, bb: 21, so: 41, hbp: 3, sb: 3, cs: 2, sec: '2B', fld: 77 },
      { id: 'morgany01', name: 'Nyjer Morgan', pos: 'LF', bats: 'L', age: 28, pa: 533, h: 144, double: 19, triple: 6, hr: 3, bb: 38, so: 79, hbp: 9, sb: 39, cs: 17, sec: 'CF', fld: 92, arm: 85 },
      { id: 'mccutan01', name: 'Andrew McCutchen', pos: 'CF', bats: 'R', age: 22, pa: 493, h: 124, double: 26, triple: 9, hr: 12, bb: 54, so: 83, hbp: 2, sb: 22, cs: 5, sec: 'LF', fld: 71, arm: 83, rk: true },
      { id: 'mossbr01', name: 'Brandon Moss', pos: 'RF', bats: 'L', age: 25, pa: 424, h: 92, double: 21, triple: 4, hr: 9, bb: 34, so: 92, hbp: 3, sb: 1, cs: 4, sec: 'LF', fld: 85, arm: 78 },
      { id: 'hinsker01', name: 'Eric Hinske', pos: 'DH', bats: 'L', age: 31, pa: 224, h: 46, double: 11, triple: 1, hr: 9, bb: 26, so: 49, hbp: 3, sb: 3, cs: 1, sec: '3B', fld: 81, arm: 80 },
    ],
    bench: [
      { id: 'youngde04', name: 'Delwyn Young', pos: '2B', bats: 'S', age: 27, pa: 388, h: 93, double: 17, triple: 2, hr: 7, bb: 31, so: 90, hbp: 2, sb: 2, cs: 0, sec: 'SS', fld: 63 },
      { id: 'jonesga02', name: 'Garrett Jones', pos: 'RF', bats: 'L', age: 28, pa: 358, h: 90, double: 20, triple: 1, hr: 20, bb: 39, so: 77, hbp: 1, sb: 10, cs: 2, sec: '1B', fld: 69, arm: 73, rk: true },
      { id: 'millela02', name: 'Lastings Milledge', pos: 'LF', bats: 'R', age: 24, pa: 265, h: 65, double: 11, triple: 1, hr: 6, bb: 16, so: 46, hbp: 6, sb: 9, cs: 4, sec: 'CF', fld: 76, arm: 80 },
      { id: 'vazqura01', name: 'Ramon Vazquez', pos: 'SS', bats: 'L', age: 32, pa: 239, h: 52, double: 10, triple: 1, hr: 3, bb: 27, so: 47, hbp: 1, sb: 1, cs: 0, sec: '3B', fld: 73 },
      { id: 'jaramja01', name: 'Jason Jaramillo', pos: 'C', bats: 'S', age: 26, pa: 224, h: 52, double: 14, triple: 0, hr: 3, bb: 17, so: 33, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 67, arm: 69, rk: true },
    ],
    reserveBatters: [
      { id: 'pearcst01', name: 'Steve Pearce', pos: '1B', bats: 'R', age: 26, pa: 186, h: 38, double: 12, triple: 1, hr: 4, bb: 17, so: 40, hbp: 1, sb: 2, cs: 0, sec: '3B', fld: 75 },
      { id: 'diazro01', name: 'Robinzon Diaz', pos: 'C', bats: 'R', age: 25, pa: 138, h: 36, double: 7, triple: 0, hr: 1, bb: 3, so: 10, hbp: 3, sb: 1, cs: 1, sec: '1B', fld: 55, arm: 66, rk: true },
      { id: 'monrocr01', name: 'Craig Monroe', pos: 'RF', bats: 'R', age: 32, pa: 87, h: 17, double: 4, triple: 0, hr: 3, bb: 7, so: 22, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
      { id: 'cruzlu01', name: 'Luis Cruz', pos: 'SS', bats: 'R', age: 25, pa: 78, h: 15, double: 2, triple: 0, hr: 0, bb: 5, so: 5, hbp: 1, sb: 0, cs: 0, sec: '2B', fld: 100, rk: true },
      { id: 'bixlebr01', name: 'Brian Bixler', pos: 'SS', bats: 'R', age: 26, pa: 46, h: 8, double: 2, triple: 0, hr: 0, bb: 2, so: 18, hbp: 1, sb: 1, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'dukeza01', name: 'Zach Duke', role: 'SP', throws: 'L', age: 26, g: 32, gs: 32, outs: 639, h: 245, hr: 23, bb: 49, so: 99, hbp: 5, er: 103, w: 11, l: 16, sv: 0, fld: 79 },
      { id: 'maholpa01', name: 'Paul Maholm', role: 'SP', throws: 'L', age: 27, g: 31, gs: 31, outs: 584, h: 213, hr: 18, bb: 60, so: 124, hbp: 7, er: 93, w: 8, l: 9, sv: 0, fld: 80 },
      { id: 'ohlenro01', name: 'Ross Ohlendorf', role: 'SP', throws: 'R', age: 26, g: 29, gs: 29, outs: 530, h: 175, hr: 25, bb: 58, so: 113, hbp: 6, er: 84, w: 11, l: 10, sv: 0, fld: 79 },
      { id: 'snellia01', name: 'Ian Snell', role: 'SP', throws: 'R', age: 27, g: 27, gs: 27, outs: 435, h: 157, hr: 15, bb: 74, so: 106, hbp: 3, er: 77, w: 7, l: 10, sv: 0, fld: 80 },
      { id: 'karstje01', name: 'Jeff Karstens', role: 'SP', throws: 'R', age: 26, g: 39, gs: 13, outs: 324, h: 119, hr: 13, bb: 42, so: 51, hbp: 1, er: 63, w: 4, l: 6, sv: 0 },
      { id: 'cappsma01', name: 'Matt Capps', role: 'CL', throws: 'R', age: 25, g: 57, gs: 0, outs: 163, h: 64, hr: 8, bb: 13, so: 47, hbp: 3, er: 27, w: 4, l: 8, sv: 27 },
      { id: 'grabojo02', name: 'John Grabow', role: 'RP', throws: 'L', age: 30, g: 75, gs: 0, outs: 217, h: 63, hr: 7, bb: 37, so: 59, hbp: 2, er: 27, w: 3, l: 0, sv: 0 },
      { id: 'chaveje01', name: 'Jesse Chavez', role: 'RP', throws: 'R', age: 25, g: 73, gs: 0, outs: 202, h: 71, hr: 11, bb: 24, so: 49, hbp: 1, er: 32, w: 1, l: 4, sv: 0, rk: true },
      { id: 'burnese01', name: 'Sean Burnett', role: 'RP', throws: 'L', age: 26, g: 71, gs: 0, outs: 173, h: 43, hr: 6, bb: 29, so: 41, hbp: 3, er: 23, w: 2, l: 3, sv: 1 },
      { id: 'meekev01', name: 'Evan Meek', role: 'RP', throws: 'R', age: 26, g: 41, gs: 0, outs: 141, h: 34, hr: 3, bb: 31, so: 39, hbp: 1, er: 20, w: 1, l: 1, sv: 0, rk: true },
      { id: 'vasquvi01', name: 'Virgil Vasquez', role: 'RP', throws: 'R', age: 27, g: 14, gs: 7, outs: 134, h: 59, hr: 7, bb: 17, so: 28, hbp: 3, er: 30, w: 2, l: 5, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'mortoch02', name: 'Charlie Morton', role: 'SP', throws: 'R', age: 25, g: 18, gs: 18, outs: 291, h: 102, hr: 9, bb: 44, so: 62, hbp: 4, er: 54, w: 5, l: 9, sv: 0 },
      { id: 'hartke01', name: 'Kevin Hart', role: 'SP', throws: 'R', age: 26, g: 18, gs: 14, outs: 243, h: 98, hr: 10, bb: 45, so: 56, hbp: 5, er: 49, w: 4, l: 9, sv: 0, rk: true },
      { id: 'jacksst01', name: 'Steven Jackson', role: 'RP', throws: 'R', age: 27, g: 40, gs: 0, outs: 129, h: 38, hr: 2, bb: 22, so: 21, hbp: 0, er: 15, w: 2, l: 3, sv: 0, rk: true },
      { id: 'mccutda01', name: 'Daniel McCutchen', role: 'RP', throws: 'R', age: 26, g: 6, gs: 6, outs: 109, h: 38, hr: 6, bb: 11, so: 19, hbp: 1, er: 17, w: 1, l: 2, sv: 0, rk: true },
      { id: 'vealdo01', name: 'Donnie Veal', role: 'RP', throws: 'L', age: 24, g: 19, gs: 0, outs: 49, h: 18, hr: 2, bb: 20, so: 16, hbp: 2, er: 13, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // STL (SLN 2009)
  {
    franchiseId: 'STL',
    season: 2009,
    batters: [
      { id: 'molinya01', name: 'Yadier Molina', pos: 'C', bats: 'R', age: 26, pa: 544, h: 143, double: 22, triple: 1, hr: 7, bb: 45, so: 40, hbp: 4, sb: 5, cs: 3, sec: '1B', fld: 75, arm: 81 },
      { id: 'pujolal01', name: 'Albert Pujols', pos: '1B', bats: 'R', age: 29, pa: 700, h: 193, double: 45, triple: 1, hr: 43, bb: 112, so: 62, hbp: 8, sb: 11, cs: 4, sec: 'LF', fld: 87 },
      { id: 'schumsk01', name: 'Skip Schumaker', pos: '2B', bats: 'L', age: 29, pa: 586, h: 162, double: 30, triple: 3, hr: 6, bb: 48, so: 65, hbp: 1, sb: 4, cs: 2, sec: 'SS', fld: 70 },
      { id: 'thursjo01', name: 'Joe Thurston', pos: '3B', bats: 'L', age: 29, pa: 307, h: 59, double: 17, triple: 4, hr: 1, bb: 32, so: 56, hbp: 4, sb: 4, cs: 2, sec: '2B', fld: 78, rk: true },
      { id: 'ryanbr01', name: 'Brendan Ryan', pos: 'SS', bats: 'R', age: 27, pa: 429, h: 109, double: 19, triple: 5, hr: 3, bb: 27, so: 56, hbp: 5, sb: 14, cs: 6, sec: '2B', fld: 100 },
      { id: 'duncach01', name: 'Chris Duncan', pos: 'LF', bats: 'L', age: 28, pa: 304, h: 63, double: 13, triple: 1, hr: 8, bb: 40, so: 70, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 45, arm: 69 },
      { id: 'rasmuco01', name: 'Colby Rasmus', pos: 'CF', bats: 'L', age: 22, pa: 520, h: 119, double: 22, triple: 2, hr: 16, bb: 36, so: 95, hbp: 3, sb: 3, cs: 1, sec: 'LF', fld: 56, arm: 63, rk: true },
      { id: 'ludwiry01', name: 'Ryan Ludwick', pos: 'RF', bats: 'R', age: 30, pa: 539, h: 133, double: 27, triple: 2, hr: 26, bb: 46, so: 115, hbp: 7, sb: 4, cs: 3, sec: 'LF', fld: 62, arm: 72 },
      { id: 'lugoju01', name: 'Julio Lugo', pos: 'DH', bats: 'R', age: 33, pa: 293, h: 68, double: 14, triple: 2, hr: 3, bb: 28, so: 44, hbp: 2, sb: 12, cs: 2, sec: '3B', fld: 54 },
    ],
    bench: [
      { id: 'ankieri01', name: 'Rick Ankiel', pos: 'CF', bats: 'L', age: 29, pa: 404, h: 91, double: 20, triple: 2, hr: 16, bb: 30, so: 93, hbp: 3, sb: 3, cs: 2, sec: 'RF', fld: 51, arm: 72 },
      { id: 'greenkh01', name: 'Khalil Greene', pos: 'SS', bats: 'R', age: 29, pa: 193, h: 39, double: 9, triple: 1, hr: 6, bb: 11, so: 40, hbp: 2, sb: 2, cs: 0, sec: '3B', fld: 68 },
      { id: 'greenty02', name: 'Tyler Greene', pos: 'SS', bats: 'R', age: 25, pa: 116, h: 24, double: 5, triple: 0, hr: 2, bb: 4, so: 32, hbp: 3, sb: 3, cs: 0, sec: '3B', fld: 72, rk: true },
      { id: 'bardebr01', name: 'Brian Barden', pos: '3B', bats: 'R', age: 28, pa: 114, h: 23, double: 3, triple: 0, hr: 3, bb: 6, so: 22, hbp: 2, sb: 0, cs: 0, sec: 'SS', fld: 59, rk: true },
      { id: 'larueja01', name: 'Jason LaRue', pos: 'C', bats: 'R', age: 35, pa: 112, h: 21, double: 4, triple: 0, hr: 2, bb: 7, so: 21, hbp: 3, sb: 0, cs: 0, fld: 74, arm: 74 },
    ],
    reserveBatters: [
      { id: 'stavini01', name: 'Nick Stavinoha', pos: 'LF', bats: 'R', age: 27, pa: 91, h: 19, double: 5, triple: 0, hr: 1, bb: 2, so: 15, hbp: 0, sb: 1, cs: 0, sec: 'RF', fld: 44, arm: 55, rk: true },
    ],
    pitchers: [
      { id: 'wainwad01', name: 'Adam Wainwright', role: 'SP', throws: 'R', age: 27, g: 34, gs: 34, outs: 699, h: 219, hr: 17, bb: 67, so: 189, hbp: 5, er: 76, w: 19, l: 8, sv: 0, fld: 82 },
      { id: 'pineijo01', name: 'Joel Pineiro', role: 'SP', throws: 'R', age: 30, g: 32, gs: 32, outs: 642, h: 226, hr: 18, bb: 36, so: 108, hbp: 6, er: 94, w: 15, l: 12, sv: 0, fld: 86 },
      { id: 'carpech01', name: 'Chris Carpenter', role: 'SP', throws: 'R', age: 34, g: 28, gs: 28, outs: 578, h: 159, hr: 7, bb: 38, so: 140, hbp: 7, er: 48, w: 17, l: 4, sv: 0, fld: 77 },
      { id: 'welleto01', name: 'Todd Wellemeyer', role: 'SP', throws: 'R', age: 30, g: 28, gs: 21, outs: 367, h: 142, hr: 18, bb: 52, so: 88, hbp: 4, er: 68, w: 7, l: 10, sv: 0 },
      { id: 'lohseky01', name: 'Kyle Lohse', role: 'SP', throws: 'R', age: 30, g: 23, gs: 22, outs: 353, h: 126, hr: 13, bb: 33, so: 74, hbp: 3, er: 57, w: 6, l: 10, sv: 0 },
      { id: 'frankry01', name: 'Ryan Franklin', role: 'CL', throws: 'R', age: 36, g: 62, gs: 0, outs: 183, h: 55, hr: 5, bb: 20, so: 40, hbp: 2, er: 18, w: 4, l: 3, sv: 38 },
      { id: 'thompbr01', name: 'Brad Thompson', role: 'RP', throws: 'R', age: 27, g: 32, gs: 8, outs: 240, h: 88, hr: 9, bb: 23, so: 35, hbp: 6, er: 43, w: 2, l: 6, sv: 0 },
      { id: 'mccleky01', name: 'Kyle McClellan', role: 'RP', throws: 'R', age: 25, g: 66, gs: 0, outs: 200, h: 61, hr: 5, bb: 29, so: 51, hbp: 3, er: 27, w: 4, l: 4, sv: 3 },
      { id: 'boggsmi01', name: 'Mitchell Boggs', role: 'RP', throws: 'R', age: 25, g: 16, gs: 9, outs: 174, h: 71, hr: 5, bb: 34, so: 39, hbp: 4, er: 33, w: 2, l: 3, sv: 0, rk: true },
      { id: 'motteja01', name: 'Jason Motte', role: 'RP', throws: 'R', age: 27, g: 69, gs: 0, outs: 170, h: 54, hr: 9, bb: 23, so: 58, hbp: 2, er: 28, w: 4, l: 4, sv: 0, rk: true },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 36, g: 70, gs: 0, outs: 131, h: 34, hr: 4, bb: 15, so: 42, hbp: 3, er: 15, w: 4, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'reyesde01', name: 'Dennys Reyes', role: 'RP', throws: 'L', age: 32, g: 75, gs: 0, outs: 123, h: 37, hr: 3, bb: 19, so: 33, hbp: 3, er: 14, w: 0, l: 2, sv: 1 },
      { id: 'hawksbl01', name: 'Blake Hawksworth', role: 'RP', throws: 'R', age: 26, g: 30, gs: 0, outs: 120, h: 29, hr: 2, bb: 15, so: 20, hbp: 1, er: 9, w: 4, l: 0, sv: 0, rk: true },
      { id: 'waltepj01', name: 'P. J. Walters', role: 'RP', throws: 'R', age: 24, g: 8, gs: 1, outs: 48, h: 21, hr: 6, bb: 9, so: 14, hbp: 0, er: 17, w: 0, l: 0, sv: 0, rk: true },
      { id: 'kinnejo01', name: 'Josh Kinney', role: 'RP', throws: 'R', age: 30, g: 17, gs: 0, outs: 46, h: 21, hr: 2, bb: 10, so: 11, hbp: 2, er: 12, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // ARI (ARI 2009)
  {
    franchiseId: 'ARI',
    season: 2009,
    batters: [
      { id: 'montemi01', name: 'Miguel Montero', pos: 'C', bats: 'L', age: 25, pa: 470, h: 118, double: 29, triple: 0, hr: 15, bb: 39, so: 83, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 69, arm: 66 },
      { id: 'tracych01', name: 'Chad Tracy', pos: '1B', bats: 'L', age: 29, pa: 288, h: 66, double: 16, triple: 0, hr: 8, bb: 23, so: 43, hbp: 1, sb: 1, cs: 0, sec: '3B', fld: 73 },
      { id: 'lopezfe01', name: 'Felipe Lopez', pos: '2B', bats: 'S', age: 29, pa: 680, h: 177, double: 35, triple: 3, hr: 9, bb: 63, so: 103, hbp: 3, sb: 10, cs: 8, sec: 'SS', fld: 62 },
      { id: 'reynoma01', name: 'Mark Reynolds', pos: '3B', bats: 'R', age: 25, pa: 662, h: 148, double: 30, triple: 2, hr: 37, bb: 72, so: 220, hbp: 5, sb: 17, cs: 6, sec: '1B', fld: 70 },
      { id: 'drewst01', name: 'Stephen Drew', pos: 'SS', bats: 'L', age: 26, pa: 595, h: 144, double: 32, triple: 10, hr: 14, bb: 46, so: 92, hbp: 1, sb: 5, cs: 1, sec: '2B', fld: 67 },
      { id: 'parrage01', name: 'Gerardo Parra', pos: 'LF', bats: 'L', age: 22, pa: 491, h: 132, double: 21, triple: 8, hr: 5, bb: 25, so: 89, hbp: 1, sb: 5, cs: 7, sec: 'CF', fld: 71, arm: 74, rk: true },
      { id: 'youngch04', name: 'Chris Young', pos: 'CF', bats: 'R', age: 25, pa: 501, h: 102, double: 28, triple: 4, hr: 17, bb: 49, so: 124, hbp: 3, sb: 13, cs: 4, sec: 'LF', fld: 70, arm: 63 },
      { id: 'uptonju01', name: 'Justin Upton', pos: 'RF', bats: 'R', age: 21, pa: 588, h: 146, double: 29, triple: 8, hr: 24, bb: 61, so: 148, hbp: 3, sb: 14, cs: 5, sec: 'LF', fld: 70, arm: 61 },
      { id: 'byrneer01', name: 'Eric Byrnes', pos: 'DH', bats: 'R', age: 33, pa: 258, h: 57, double: 13, triple: 2, hr: 8, bb: 17, so: 35, hbp: 3, sb: 11, cs: 3, sec: 'LF', fld: 75, arm: 70 },
    ],
    bench: [
      { id: 'roberry01', name: 'Ryan Roberts', pos: '2B', bats: 'R', age: 28, pa: 351, h: 84, double: 17, triple: 2, hr: 7, bb: 40, so: 57, hbp: 3, sb: 7, cs: 3, sec: '3B', fld: 66, rk: true },
      { id: 'ojedaau01', name: 'Augie Ojeda', pos: '2B', bats: 'S', age: 34, pa: 309, h: 65, double: 14, triple: 3, hr: 1, bb: 31, so: 28, hbp: 7, sb: 2, cs: 1, sec: 'SS', fld: 82 },
      { id: 'snydech02', name: 'Chris Snyder', pos: 'C', bats: 'R', age: 28, pa: 202, h: 38, double: 10, triple: 0, hr: 7, bb: 28, so: 46, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 65 },
      { id: 'romeral01', name: 'Alex Romero', pos: 'LF', bats: 'L', age: 25, pa: 157, h: 35, double: 7, triple: 2, hr: 1, bb: 8, so: 23, hbp: 1, sb: 3, cs: 0, sec: 'RF', fld: 71, arm: 72 },
      { id: 'whitejo03', name: 'Josh Whitesell', pos: '1B', bats: 'L', age: 27, pa: 133, h: 21, double: 7, triple: 0, hr: 2, bb: 24, so: 29, hbp: 2, sb: 0, cs: 0, sec: '3B', fld: 64, rk: true },
    ],
    reserveBatters: [
      { id: 'allenbr01', name: 'Brandon Allen', pos: '1B', bats: 'L', age: 23, pa: 116, h: 21, double: 7, triple: 0, hr: 4, bb: 12, so: 40, hbp: 0, sb: 0, cs: 0, sec: '3B', fld: 57, rk: true },
      { id: 'jacksco01', name: 'Conor Jackson', pos: 'LF', bats: 'R', age: 27, pa: 110, h: 27, double: 6, triple: 1, hr: 2, bb: 11, so: 12, hbp: 1, sb: 2, cs: 0, sec: '1B', fld: 57, arm: 55 },
      { id: 'clarkto02', name: 'Tony Clark', pos: '1B', bats: 'S', age: 37, pa: 78, h: 15, double: 2, triple: 0, hr: 3, bb: 11, so: 22, hbp: 0, sb: 0, cs: 0 },
      { id: 'oeltjtr01', name: 'Trent Oeltjen', pos: 'LF', bats: 'L', age: 26, pa: 73, h: 17, double: 4, triple: 1, hr: 3, bb: 1, so: 13, hbp: 0, sb: 3, cs: 1, sec: 'RF', fld: 77, arm: 88, rk: true },
      { id: 'ryalru01', name: 'Rusty Ryal', pos: '2B', bats: 'R', age: 26, pa: 68, h: 16, double: 6, triple: 2, hr: 3, bb: 6, so: 21, hbp: 2, sb: 0, cs: 0, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'harenda01', name: 'Dan Haren', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 688, h: 201, hr: 24, bb: 42, so: 213, hbp: 5, er: 80, w: 14, l: 10, sv: 0, fld: 73 },
      { id: 'garlajo01', name: 'Jon Garland', role: 'SP', throws: 'R', age: 29, g: 33, gs: 33, outs: 612, h: 229, hr: 22, bb: 60, so: 101, hbp: 6, er: 98, w: 11, l: 13, sv: 0, fld: 82 },
      { id: 'davisdo02', name: 'Doug Davis', role: 'SP', throws: 'L', age: 33, g: 34, gs: 34, outs: 610, h: 211, hr: 23, bb: 98, so: 149, hbp: 5, er: 94, w: 9, l: 14, sv: 0, fld: 54 },
      { id: 'scherma01', name: 'Max Scherzer', role: 'SP', throws: 'R', age: 24, g: 30, gs: 30, outs: 511, h: 163, hr: 19, bb: 63, so: 179, hbp: 11, er: 75, w: 9, l: 11, sv: 0, fld: 71 },
      { id: 'petityu01', name: 'Yusmeiro Petit', role: 'SP', throws: 'R', age: 24, g: 23, gs: 17, outs: 269, h: 96, hr: 20, bb: 31, so: 73, hbp: 0, er: 54, w: 3, l: 10, sv: 0 },
      { id: 'quallch01', name: 'Chad Qualls', role: 'CL', throws: 'R', age: 30, g: 51, gs: 0, outs: 156, h: 49, hr: 4, bb: 11, so: 48, hbp: 2, er: 18, w: 2, l: 2, sv: 24 },
      { id: 'gutieju01', name: 'J. C. Gutierrez', role: 'RP', throws: 'R', age: 25, g: 65, gs: 0, outs: 213, h: 68, hr: 3, bb: 29, so: 65, hbp: 3, er: 33, w: 4, l: 3, sv: 9, rk: true },
      { id: 'rauchjo01', name: 'Jon Rauch', role: 'RP', throws: 'R', age: 30, g: 75, gs: 0, outs: 210, h: 69, hr: 8, bb: 20, so: 57, hbp: 1, er: 30, w: 7, l: 3, sv: 2 },
      { id: 'boyerbl01', name: 'Blaine Boyer', role: 'RP', throws: 'R', age: 27, g: 48, gs: 0, outs: 164, h: 57, hr: 4, bb: 20, so: 39, hbp: 3, er: 30, w: 0, l: 2, sv: 0 },
      { id: 'vasques01', name: 'Esmerling Vasquez', role: 'RP', throws: 'R', age: 25, g: 53, gs: 0, outs: 159, h: 52, hr: 4, bb: 29, so: 45, hbp: 3, er: 26, w: 3, l: 3, sv: 0, rk: true },
      { id: 'zavadcl01', name: 'Clay Zavada', role: 'RP', throws: 'L', age: 25, g: 49, gs: 0, outs: 153, h: 45, hr: 5, bb: 24, so: 52, hbp: 3, er: 19, w: 3, l: 3, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'bucknbi02', name: 'Billy Buckner', role: 'SP', throws: 'R', age: 25, g: 16, gs: 13, outs: 232, h: 93, hr: 12, bb: 29, so: 61, hbp: 3, er: 52, w: 4, l: 6, sv: 0, rk: true },
      { id: 'rosalle01', name: 'Leo Rosales', role: 'RP', throws: 'R', age: 28, g: 33, gs: 0, outs: 136, h: 41, hr: 4, bb: 15, so: 29, hbp: 0, er: 22, w: 2, l: 1, sv: 0, rk: true },
      { id: 'mulveke01', name: 'Kevin Mulvey', role: 'RP', throws: 'R', age: 24, g: 8, gs: 4, outs: 73, h: 29, hr: 5, bb: 12, so: 18, hbp: 2, er: 22, w: 0, l: 3, sv: 0, rk: true },
      { id: 'schoesc01', name: 'Scott Schoeneweis', role: 'RP', throws: 'L', age: 35, g: 45, gs: 0, outs: 72, h: 27, hr: 4, bb: 12, so: 16, hbp: 2, er: 14, w: 1, l: 2, sv: 0 },
      { id: 'schleda01', name: 'Daniel Schlereth', role: 'RP', throws: 'L', age: 23, g: 21, gs: 0, outs: 55, h: 15, hr: 1, bb: 15, so: 22, hbp: 1, er: 12, w: 1, l: 4, sv: 0, rk: true },
    ],
  },
  // COL (COL 2009)
  {
    franchiseId: 'COL',
    season: 2009,
    batters: [
      { id: 'iannech01', name: 'Chris Iannetta', pos: 'C', bats: 'R', age: 26, pa: 350, h: 70, double: 16, triple: 2, hr: 15, bb: 45, so: 78, hbp: 11, sb: 0, cs: 1, sec: '1B', fld: 73, arm: 67 },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 35, pa: 645, h: 167, double: 36, triple: 2, hr: 15, bb: 98, so: 76, hbp: 2, sb: 0, cs: 1, sec: 'LF', fld: 76 },
      { id: 'barmecl01', name: 'Clint Barmes', pos: '2B', bats: 'R', age: 30, pa: 604, h: 144, double: 34, triple: 5, hr: 20, bb: 29, so: 116, hbp: 8, sb: 14, cs: 9, sec: 'SS', fld: 79 },
      { id: 'stewaia01', name: 'Ian Stewart', pos: '3B', bats: 'L', age: 24, pa: 491, h: 101, double: 22, triple: 3, hr: 22, bb: 53, so: 143, hbp: 7, sb: 5, cs: 3, sec: '2B', fld: 60 },
      { id: 'tulowtr01', name: 'Troy Tulowitzki', pos: 'SS', bats: 'R', age: 24, pa: 628, h: 158, double: 29, triple: 7, hr: 25, bb: 65, so: 107, hbp: 4, sb: 13, cs: 9, sec: '2B', fld: 77 },
      { id: 'smithse01', name: 'Seth Smith', pos: 'LF', bats: 'L', age: 26, pa: 387, h: 97, double: 20, triple: 4, hr: 14, bb: 46, so: 68, hbp: 2, sb: 4, cs: 1, sec: 'RF', fld: 70, arm: 70 },
      { id: 'fowlede01', name: 'Dexter Fowler', pos: 'CF', bats: 'S', age: 23, pa: 518, h: 114, double: 28, triple: 10, hr: 4, bb: 65, so: 115, hbp: 2, sb: 26, cs: 10, sec: 'LF', fld: 55, arm: 68, rk: true },
      { id: 'hawpebr01', name: 'Brad Hawpe', pos: 'RF', bats: 'L', age: 30, pa: 588, h: 143, double: 35, triple: 3, hr: 25, bb: 79, so: 141, hbp: 4, sb: 1, cs: 3, sec: 'LF', fld: 49, arm: 62 },
      { id: 'atkinga01', name: 'Garrett Atkins', pos: 'DH', bats: 'R', age: 29, pa: 399, h: 96, double: 17, triple: 1, hr: 12, bb: 34, so: 58, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 75 },
    ],
    bench: [
      { id: 'spilbry01', name: 'Ryan Spilborghs', pos: 'LF', bats: 'R', age: 29, pa: 393, h: 93, double: 22, triple: 3, hr: 9, bb: 40, so: 71, hbp: 2, sb: 9, cs: 5, sec: 'CF', fld: 63, arm: 77 },
      { id: 'gonzaca01', name: 'Carlos Gonzalez', pos: 'LF', bats: 'L', age: 23, pa: 317, h: 77, double: 17, triple: 5, hr: 9, bb: 22, so: 74, hbp: 2, sb: 11, cs: 3, sec: 'CF', fld: 76, arm: 77 },
      { id: 'torreyo01', name: 'Yorvit Torrealba', pos: 'C', bats: 'R', age: 30, pa: 242, h: 58, double: 13, triple: 1, hr: 4, bb: 17, so: 41, hbp: 3, sb: 1, cs: 2, sec: '1B', fld: 78, arm: 56 },
      { id: 'quintom01', name: 'Omar Quintanilla', pos: '2B', bats: 'L', age: 27, pa: 69, h: 13, double: 4, triple: 0, hr: 0, bb: 5, so: 17, hbp: 0, sb: 0, cs: 0, sec: 'SS' },
      { id: 'younger03', name: 'Eric Young', pos: '2B', bats: 'S', age: 24, pa: 61, h: 14, double: 1, triple: 0, hr: 1, bb: 4, so: 12, hbp: 0, sb: 4, cs: 4, sec: 'SS', rk: true },
    ],
    reserveBatters: [
      { id: 'murtoma01', name: 'Matt Murton', pos: 'LF', bats: 'R', age: 27, pa: 56, h: 13, double: 3, triple: 0, hr: 1, bb: 4, so: 10, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
      { id: 'phillpa01', name: 'Paul Phillips', pos: 'C', bats: 'R', age: 32, pa: 54, h: 13, double: 2, triple: 0, hr: 1, bb: 7, so: 4, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'jimenub01', name: 'Ubaldo Jimenez', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 654, h: 186, hr: 13, bb: 94, so: 190, hbp: 11, er: 88, w: 15, l: 12, sv: 0, fld: 85 },
      { id: 'marquja01', name: 'Jason Marquis', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 648, h: 217, hr: 18, bb: 83, so: 116, hbp: 7, er: 102, w: 15, l: 13, sv: 0, fld: 81 },
      { id: 'delarjo01', name: 'Jorge De La Rosa', role: 'SP', throws: 'L', age: 28, g: 33, gs: 32, outs: 555, h: 180, hr: 20, bb: 82, so: 177, hbp: 9, er: 96, w: 16, l: 9, sv: 0, fld: 63 },
      { id: 'hammeja01', name: 'Jason Hammel', role: 'SP', throws: 'R', age: 26, g: 34, gs: 30, outs: 530, h: 198, hr: 19, bb: 53, so: 125, hbp: 7, er: 89, w: 10, l: 8, sv: 0, fld: 71 },
      { id: 'cookaa01', name: 'Aaron Cook', role: 'SP', throws: 'R', age: 30, g: 27, gs: 27, outs: 474, h: 176, hr: 15, bb: 42, so: 73, hbp: 3, er: 72, w: 11, l: 6, sv: 0, fld: 91 },
      { id: 'streehu01', name: 'Huston Street', role: 'CL', throws: 'R', age: 25, g: 64, gs: 0, outs: 185, h: 45, hr: 6, bb: 17, so: 66, hbp: 0, er: 22, w: 4, l: 1, sv: 35 },
      { id: 'daleyma01', name: 'Matt Daley', role: 'RP', throws: 'R', age: 27, g: 57, gs: 0, outs: 153, h: 43, hr: 6, bb: 18, so: 55, hbp: 2, er: 24, w: 1, l: 1, sv: 0, rk: true },
      { id: 'foggjo01', name: 'Josh Fogg', role: 'RP', throws: 'R', age: 32, g: 24, gs: 1, outs: 137, h: 45, hr: 7, bb: 16, so: 24, hbp: 3, er: 26, w: 0, l: 2, sv: 0 },
      { id: 'moralfr01', name: 'Franklin Morales', role: 'RP', throws: 'L', age: 23, g: 40, gs: 2, outs: 120, h: 39, hr: 3, bb: 22, so: 32, hbp: 1, er: 21, w: 3, l: 2, sv: 7 },
      { id: 'rincoju01', name: 'Juan Rincon', role: 'RP', throws: 'R', age: 30, g: 33, gs: 0, outs: 110, h: 37, hr: 5, bb: 20, so: 30, hbp: 2, er: 24, w: 4, l: 2, sv: 0 },
      { id: 'corpama01', name: 'Manny Corpas', role: 'RP', throws: 'R', age: 26, g: 35, gs: 0, outs: 101, h: 39, hr: 3, bb: 9, so: 24, hbp: 1, er: 17, w: 1, l: 3, sv: 1 },
    ],
    reservePitchers: [
      { id: 'belisma01', name: 'Matt Belisle', role: 'RP', throws: 'R', age: 29, g: 24, gs: 0, outs: 93, h: 37, hr: 5, bb: 6, so: 20, hbp: 1, er: 19, w: 3, l: 1, sv: 0 },
      { id: 'embreal01', name: 'Alan Embree', role: 'RP', throws: 'L', age: 39, g: 36, gs: 0, outs: 74, h: 26, hr: 3, bb: 11, so: 19, hbp: 1, er: 14, w: 2, l: 2, sv: 0 },
      { id: 'peraljo01', name: 'Joel Peralta', role: 'RP', throws: 'R', age: 33, g: 27, gs: 0, outs: 74, h: 28, hr: 5, bb: 8, so: 20, hbp: 1, er: 15, w: 0, l: 3, sv: 0 },
      { id: 'ruschgl01', name: 'Glendon Rusch', role: 'RP', throws: 'L', age: 34, g: 11, gs: 0, outs: 56, h: 27, hr: 3, bb: 5, so: 14, hbp: 0, er: 13, w: 2, l: 0, sv: 0 },
      { id: 'florera01', name: 'Randy Flores', role: 'RP', throws: 'L', age: 33, g: 27, gs: 0, outs: 36, h: 14, hr: 1, bb: 5, so: 9, hbp: 0, er: 6, w: 0, l: 1, sv: 0 },
    ],
  },
  // LAD (LAN 2009)
  {
    franchiseId: 'LAD',
    season: 2009,
    batters: [
      { id: 'martiru01', name: 'Russell Martin', pos: 'C', bats: 'R', age: 26, pa: 588, h: 135, double: 22, triple: 0, hr: 11, bb: 72, so: 79, hbp: 8, sb: 14, cs: 6, sec: '1B', fld: 75, arm: 71 },
      { id: 'loneyja01', name: 'James Loney', pos: '1B', bats: 'L', age: 25, pa: 651, h: 169, double: 29, triple: 4, hr: 14, bb: 59, so: 76, hbp: 1, sb: 6, cs: 3, sec: '3B', fld: 68 },
      { id: 'hudsoor01', name: 'Orlando Hudson', pos: '2B', bats: 'S', age: 31, pa: 631, h: 161, double: 35, triple: 6, hr: 10, bb: 62, so: 94, hbp: 3, sb: 8, cs: 1, sec: 'SS', fld: 69 },
      { id: 'blakeca01', name: 'Casey Blake', pos: '3B', bats: 'R', age: 35, pa: 565, h: 137, double: 29, triple: 4, hr: 18, bb: 54, so: 113, hbp: 8, sb: 3, cs: 3, sec: '1B', fld: 84 },
      { id: 'furcara01', name: 'Rafael Furcal', pos: 'SS', bats: 'S', age: 31, pa: 680, h: 170, double: 30, triple: 5, hr: 10, bb: 63, so: 83, hbp: 1, sb: 17, cs: 7, sec: '2B', fld: 64 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'LF', bats: 'R', age: 37, pa: 431, h: 111, double: 24, triple: 1, hr: 21, bb: 62, so: 79, hbp: 7, sb: 1, cs: 0, sec: 'RF', fld: 51, arm: 64 },
      { id: 'kempma01', name: 'Matt Kemp', pos: 'CF', bats: 'R', age: 24, pa: 667, h: 182, double: 30, triple: 7, hr: 23, bb: 49, so: 145, hbp: 2, sb: 33, cs: 9, sec: 'RF', fld: 69, arm: 81 },
      { id: 'ethiean01', name: 'Andre Ethier', pos: 'RF', bats: 'L', age: 27, pa: 685, h: 170, double: 43, triple: 4, hr: 27, bb: 69, so: 108, hbp: 9, sb: 5, cs: 4, sec: 'LF', fld: 59, arm: 63 },
      { id: 'loretma01', name: 'Mark Loretta', pos: 'DH', bats: 'R', age: 37, pa: 204, h: 48, double: 9, triple: 0, hr: 1, bb: 19, so: 19, hbp: 1, sb: 0, cs: 1, sec: '3B' },
    ],
    bench: [
      { id: 'pierrju01', name: 'Juan Pierre', pos: 'LF', bats: 'L', age: 31, pa: 425, h: 115, double: 14, triple: 5, hr: 0, bb: 24, so: 25, hbp: 5, sb: 35, cs: 11, sec: 'CF', fld: 67, arm: 58 },
      { id: 'castrju01', name: 'Juan Castro', pos: 'SS', bats: 'R', age: 37, pa: 121, h: 25, double: 4, triple: 0, hr: 1, bb: 7, so: 22, hbp: 0, sb: 0, cs: 0, sec: '3B', fld: 40 },
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 40, pa: 107, h: 23, double: 4, triple: 0, hr: 1, bb: 9, so: 19, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 75, arm: 71 },
      { id: 'dewitbl01', name: 'Blake DeWitt', pos: '3B', bats: 'L', age: 23, pa: 53, h: 12, double: 2, triple: 0, hr: 1, bb: 5, so: 8, hbp: 0, sb: 0, cs: 0, sec: '2B' },
      { id: 'hoffmja01', name: 'Jamie Hoffmann', pos: 'RF', bats: 'R', age: 24, pa: 24, h: 4, double: 2, triple: 0, hr: 1, bb: 0, so: 5, hbp: 0, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'wolfra02', name: 'Randy Wolf', role: 'SP', throws: 'L', age: 32, g: 34, gs: 34, outs: 643, h: 189, hr: 23, bb: 65, so: 165, hbp: 9, er: 86, w: 11, l: 7, sv: 0, fld: 72 },
      { id: 'billich01', name: 'Chad Billingsley', role: 'SP', throws: 'R', age: 24, g: 33, gs: 32, outs: 589, h: 177, hr: 16, bb: 83, so: 186, hbp: 7, er: 79, w: 12, l: 11, sv: 0, fld: 63 },
      { id: 'kershcl01', name: 'Clayton Kershaw', role: 'SP', throws: 'L', age: 21, g: 31, gs: 30, outs: 513, h: 132, hr: 10, bb: 87, so: 174, hbp: 1, er: 60, w: 8, l: 8, sv: 0, fld: 68 },
      { id: 'kurodhi01', name: 'Hiroki Kuroda', role: 'SP', throws: 'R', age: 34, g: 21, gs: 20, outs: 352, h: 112, hr: 10, bb: 25, so: 79, hbp: 3, er: 48, w: 8, l: 7, sv: 0 },
      { id: 'stulter01', name: 'Eric Stults', role: 'SP', throws: 'L', age: 29, g: 10, gs: 10, outs: 150, h: 53, hr: 5, bb: 23, so: 36, hbp: 3, er: 26, w: 4, l: 3, sv: 0 },
      { id: 'broxtjo01', name: 'Jonathan Broxton', role: 'CL', throws: 'R', age: 25, g: 73, gs: 0, outs: 228, h: 51, hr: 4, bb: 27, so: 102, hbp: 2, er: 23, w: 7, l: 2, sv: 36 },
      { id: 'troncra01', name: 'Ramon Troncoso', role: 'RP', throws: 'R', age: 26, g: 73, gs: 0, outs: 248, h: 83, hr: 3, bb: 32, so: 62, hbp: 4, er: 28, w: 5, l: 4, sv: 6, rk: true },
      { id: 'weaveje01', name: 'Jeff Weaver', role: 'RP', throws: 'R', age: 32, g: 28, gs: 7, outs: 237, h: 93, hr: 9, bb: 28, so: 56, hbp: 5, er: 41, w: 6, l: 4, sv: 0 },
      { id: 'belisro01', name: 'Ronald Belisario', role: 'RP', throws: 'R', age: 26, g: 69, gs: 0, outs: 212, h: 52, hr: 4, bb: 29, so: 64, hbp: 6, er: 16, w: 4, l: 3, sv: 0, rk: true },
      { id: 'motagu01', name: 'Guillermo Mota', role: 'RP', throws: 'R', age: 35, g: 61, gs: 0, outs: 196, h: 57, hr: 7, bb: 25, so: 46, hbp: 3, er: 29, w: 3, l: 4, sv: 0 },
      { id: 'mcdonja03', name: 'James McDonald', role: 'RP', throws: 'R', age: 24, g: 45, gs: 4, outs: 189, h: 60, hr: 6, bb: 33, so: 52, hbp: 5, er: 27, w: 5, l: 5, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'kuoho01', name: 'Hung-Chih Kuo', role: 'RP', throws: 'L', age: 27, g: 35, gs: 0, outs: 90, h: 24, hr: 2, bb: 10, so: 34, hbp: 1, er: 10, w: 2, l: 0, sv: 0 },
      { id: 'wadeco01', name: 'Cory Wade', role: 'RP', throws: 'R', age: 26, g: 27, gs: 0, outs: 83, h: 24, hr: 3, bb: 8, so: 20, hbp: 1, er: 11, w: 2, l: 3, sv: 0 },
      { id: 'miltoer01', name: 'Eric Milton', role: 'RP', throws: 'L', age: 33, g: 5, gs: 5, outs: 71, h: 30, hr: 2, bb: 6, so: 18, hbp: 1, er: 11, w: 2, l: 1, sv: 0 },
      { id: 'leachbr01', name: 'Brent Leach', role: 'RP', throws: 'L', age: 26, g: 38, gs: 0, outs: 61, h: 16, hr: 3, bb: 12, so: 19, hbp: 1, er: 13, w: 2, l: 0, sv: 0, rk: true },
      { id: 'elbersc01', name: 'Scott Elbert', role: 'RP', throws: 'L', age: 23, g: 19, gs: 0, outs: 59, h: 20, hr: 4, bb: 8, so: 21, hbp: 1, er: 13, w: 2, l: 0, sv: 0, rk: true },
    ],
  },
  // SDP (SDN 2009)
  {
    franchiseId: 'SDP',
    season: 2009,
    batters: [
      { id: 'hundlni01', name: 'Nick Hundley', pos: 'C', bats: 'R', age: 25, pa: 289, h: 62, double: 13, triple: 2, hr: 8, bb: 24, so: 74, hbp: 2, sb: 3, cs: 1, sec: '1B', fld: 65, arm: 61 },
      { id: 'gonzaad01', name: 'Adrian Gonzalez', pos: '1B', bats: 'L', age: 27, pa: 681, h: 161, double: 31, triple: 2, hr: 36, bb: 93, so: 123, hbp: 5, sb: 0, cs: 0, sec: '3B', fld: 81 },
      { id: 'eckstda01', name: 'David Eckstein', pos: '2B', bats: 'R', age: 34, pa: 568, h: 135, double: 28, triple: 1, hr: 3, bb: 39, so: 43, hbp: 11, sb: 4, cs: 1, sec: 'SS', fld: 64 },
      { id: 'kouzmke01', name: 'Kevin Kouzmanoff', pos: '3B', bats: 'R', age: 27, pa: 573, h: 138, double: 30, triple: 2, hr: 19, bb: 25, so: 110, hbp: 12, sb: 1, cs: 0, sec: '1B', fld: 64 },
      { id: 'cabreev01', name: 'Everth Cabrera', pos: 'SS', bats: 'S', age: 22, pa: 438, h: 96, double: 18, triple: 8, hr: 2, bb: 46, so: 88, hbp: 5, sb: 25, cs: 8, sec: '2B', fld: 65, rk: true },
      { id: 'headlch01', name: 'Chase Headley', pos: 'LF', bats: 'S', age: 25, pa: 612, h: 144, double: 31, triple: 2, hr: 13, bb: 59, so: 144, hbp: 6, sb: 9, cs: 2, sec: 'RF', fld: 68, arm: 67 },
      { id: 'gwynnto02', name: 'Tony Gwynn', pos: 'CF', bats: 'L', age: 26, pa: 451, h: 104, double: 11, triple: 6, hr: 2, bb: 47, so: 66, hbp: 2, sb: 13, cs: 7, sec: 'RF', fld: 80, arm: 70 },
      { id: 'venabwi01', name: 'Will Venable', pos: 'RF', bats: 'L', age: 26, pa: 324, h: 75, double: 13, triple: 3, hr: 11, bb: 27, so: 82, hbp: 3, sb: 5, cs: 1, sec: 'CF', fld: 77, arm: 64, rk: true },
      { id: 'blankky01', name: 'Kyle Blanks', pos: 'DH', bats: 'R', age: 22, pa: 172, h: 37, double: 9, triple: 0, hr: 10, bb: 18, so: 55, hbp: 6, sb: 1, cs: 1, sec: 'RF', fld: 61, arm: 61, rk: true },
    ],
    bench: [
      { id: 'gilesbr02', name: 'Brian Giles', pos: 'RF', bats: 'L', age: 38, pa: 253, h: 58, double: 13, triple: 1, hr: 4, bb: 31, so: 25, hbp: 1, sb: 1, cs: 1, sec: 'LF', fld: 75, arm: 81 },
      { id: 'rodrilu01', name: 'Luis Rodriguez', pos: 'SS', bats: 'S', age: 29, pa: 251, h: 50, double: 8, triple: 1, hr: 1, bb: 27, so: 20, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 64 },
      { id: 'blanche01', name: 'Henry Blanco', pos: 'C', bats: 'R', age: 37, pa: 232, h: 51, double: 10, triple: 0, hr: 6, bb: 21, so: 47, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 78, arm: 80 },
      { id: 'gonzaed02', name: 'Edgar Gonzalez', pos: '2B', bats: 'R', age: 31, pa: 169, h: 39, double: 8, triple: 1, hr: 4, bb: 12, so: 36, hbp: 2, sb: 1, cs: 2, sec: 'SS' },
      { id: 'salazos01', name: 'Oscar Salazar', pos: 'LF', bats: 'R', age: 31, pa: 154, h: 41, double: 7, triple: 1, hr: 6, bb: 16, so: 20, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    reserveBatters: [
      { id: 'alfonel01', name: 'Eliezer Alfonzo', pos: 'C', bats: 'R', age: 30, pa: 117, h: 21, double: 3, triple: 0, hr: 2, bb: 3, so: 35, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 69, arm: 78 },
      { id: 'maciadr01', name: 'Drew Macias', pos: 'LF', bats: 'L', age: 26, pa: 90, h: 15, double: 5, triple: 0, hr: 2, bb: 12, so: 16, hbp: 1, sb: 0, cs: 1, sec: 'RF', fld: 42, arm: 55, rk: true },
      { id: 'burkech01', name: 'Chris Burke', pos: 'SS', bats: 'R', age: 29, pa: 89, h: 16, double: 4, triple: 0, hr: 1, bb: 9, so: 14, hbp: 1, sb: 3, cs: 1, sec: '2B', fld: 43 },
    ],
    pitchers: [
      { id: 'correke01', name: 'Kevin Correia', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 594, h: 202, hr: 19, bb: 69, so: 135, hbp: 5, er: 94, w: 12, l: 11, sv: 0, fld: 76 },
      { id: 'gaudich01', name: 'Chad Gaudin', role: 'SP', throws: 'R', age: 26, g: 31, gs: 25, outs: 442, h: 150, hr: 15, bb: 69, so: 129, hbp: 7, er: 75, w: 6, l: 10, sv: 0, fld: 76 },
      { id: 'geerjo01', name: 'Josh Geer', role: 'SP', throws: 'R', age: 26, g: 19, gs: 17, outs: 308, h: 115, hr: 24, bb: 25, so: 55, hbp: 3, er: 62, w: 1, l: 7, sv: 0, rk: true },
      { id: 'peavyja01', name: 'Jake Peavy', role: 'SP', throws: 'R', age: 28, g: 16, gs: 16, outs: 305, h: 81, hr: 8, bb: 33, so: 104, hbp: 2, er: 34, w: 9, l: 6, sv: 0 },
      { id: 'youngch03', name: 'Chris Young', role: 'SP', throws: 'R', age: 30, g: 14, gs: 14, outs: 228, h: 64, hr: 9, bb: 37, so: 65, hbp: 2, er: 37, w: 4, l: 6, sv: 0 },
      { id: 'bellhe01', name: 'Heath Bell', role: 'CL', throws: 'R', age: 31, g: 68, gs: 0, outs: 209, h: 54, hr: 3, bb: 24, so: 73, hbp: 1, er: 22, w: 6, l: 4, sv: 42 },
      { id: 'mujiced01', name: 'Edward Mujica', role: 'RP', throws: 'R', age: 25, g: 67, gs: 4, outs: 281, h: 103, hr: 14, bb: 20, so: 72, hbp: 0, er: 48, w: 3, l: 5, sv: 2 },
      { id: 'gregelu01', name: 'Luke Gregerson', role: 'RP', throws: 'R', age: 25, g: 72, gs: 0, outs: 225, h: 62, hr: 3, bb: 31, so: 93, hbp: 3, er: 27, w: 2, l: 4, sv: 1, rk: true },
      { id: 'meredcl01', name: 'Cla Meredith', role: 'RP', throws: 'R', age: 26, g: 64, gs: 0, outs: 196, h: 75, hr: 5, bb: 22, so: 43, hbp: 3, er: 29, w: 4, l: 2, sv: 0 },
      { id: 'perdolu01', name: 'Luis Perdomo', role: 'RP', throws: 'R', age: 25, g: 35, gs: 0, outs: 180, h: 57, hr: 11, bb: 34, so: 55, hbp: 0, er: 32, w: 1, l: 0, sv: 0, rk: true },
      { id: 'leblawa01', name: 'Wade LeBlanc', role: 'RP', throws: 'L', age: 24, g: 9, gs: 9, outs: 139, h: 40, hr: 8, bb: 21, so: 29, hbp: 3, er: 23, w: 3, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'staufti01', name: 'Tim Stauffer', role: 'SP', throws: 'R', age: 27, g: 14, gs: 14, outs: 219, h: 73, hr: 9, bb: 34, so: 53, hbp: 5, er: 33, w: 4, l: 7, sv: 0 },
      { id: 'latosma01', name: 'Mat Latos', role: 'SP', throws: 'R', age: 21, g: 10, gs: 10, outs: 152, h: 43, hr: 7, bb: 23, so: 39, hbp: 0, er: 26, w: 4, l: 5, sv: 0, rk: true },
      { id: 'burkegr01', name: 'Greg Burke', role: 'RP', throws: 'R', age: 26, g: 48, gs: 0, outs: 137, h: 48, hr: 4, bb: 23, so: 33, hbp: 1, er: 21, w: 3, l: 3, sv: 0, rk: true },
      { id: 'thatcjo01', name: 'Joe Thatcher', role: 'RP', throws: 'L', age: 27, g: 52, gs: 0, outs: 135, h: 43, hr: 3, bb: 18, so: 45, hbp: 3, er: 19, w: 1, l: 0, sv: 0, rk: true },
      { id: 'adamsmi03', name: 'Mike Adams', role: 'RP', throws: 'R', age: 30, g: 37, gs: 0, outs: 111, h: 20, hr: 2, bb: 9, so: 41, hbp: 0, er: 6, w: 0, l: 0, sv: 0 },
    ],
  },
  // SFG (SFN 2009)
  {
    franchiseId: 'SFG',
    season: 2009,
    batters: [
      { id: 'molinbe01', name: 'Bengie Molina', pos: 'C', bats: 'R', age: 34, pa: 520, h: 135, double: 26, triple: 1, hr: 18, bb: 15, so: 54, hbp: 6, sb: 0, cs: 0, fld: 75, arm: 64 },
      { id: 'ishiktr01', name: 'Travis Ishikawa', pos: '1B', bats: 'L', age: 25, pa: 363, h: 86, double: 12, triple: 2, hr: 9, bb: 30, so: 90, hbp: 3, sb: 2, cs: 2, sec: '3B', fld: 71, rk: true },
      { id: 'burriem01', name: 'Emmanuel Burriss', pos: '2B', bats: 'S', age: 24, pa: 220, h: 51, double: 5, triple: 0, hr: 0, bb: 16, so: 27, hbp: 3, sb: 11, cs: 4, sec: 'SS', fld: 49 },
      { id: 'sandopa01', name: 'Pablo Sandoval', pos: '3B', bats: 'S', age: 22, pa: 633, h: 191, double: 44, triple: 5, hr: 23, bb: 47, so: 79, hbp: 4, sb: 4, cs: 4, sec: '1B', fld: 56 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 32, pa: 510, h: 126, double: 21, triple: 1, hr: 8, bb: 38, so: 66, hbp: 1, sb: 7, cs: 2, sec: '2B', fld: 55 },
      { id: 'lewisfr02', name: 'Fred Lewis', pos: 'LF', bats: 'L', age: 28, pa: 336, h: 81, double: 18, triple: 5, hr: 5, bb: 35, so: 80, hbp: 3, sb: 11, cs: 4, sec: 'RF', fld: 65, arm: 67 },
      { id: 'rowanaa01', name: 'Aaron Rowand', pos: 'CF', bats: 'R', age: 31, pa: 546, h: 135, double: 32, triple: 1, hr: 15, bb: 35, so: 115, hbp: 14, sb: 3, cs: 2, sec: 'LF', fld: 63, arm: 67 },
      { id: 'winnra01', name: 'Randy Winn', pos: 'RF', bats: 'S', age: 35, pa: 597, h: 153, double: 34, triple: 3, hr: 6, bb: 48, so: 85, hbp: 2, sb: 18, cs: 2, sec: 'CF', fld: 77, arm: 63 },
      { id: 'aurilri01', name: 'Rich Aurilia', pos: 'DH', bats: 'R', age: 37, pa: 133, h: 32, double: 5, triple: 0, hr: 3, bb: 9, so: 19, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 84 },
    ],
    bench: [
      { id: 'uribeju01', name: 'Juan Uribe', pos: '3B', bats: 'R', age: 30, pa: 432, h: 105, double: 24, triple: 3, hr: 14, bb: 26, so: 82, hbp: 2, sb: 2, cs: 3, sec: 'SS', fld: 73 },
      { id: 'schiena01', name: 'Nate Schierholtz', pos: 'RF', bats: 'L', age: 25, pa: 308, h: 79, double: 20, triple: 3, hr: 4, bb: 14, so: 54, hbp: 3, sb: 3, cs: 2, sec: 'LF', fld: 73, arm: 92 },
      { id: 'velezeu01', name: 'Eugenio Velez', pos: 'LF', bats: 'S', age: 27, pa: 307, h: 76, double: 14, triple: 6, hr: 3, bb: 16, so: 50, hbp: 2, sb: 14, cs: 5, sec: 'CF', fld: 48, arm: 68 },
      { id: 'torrean02', name: 'Andres Torres', pos: 'CF', bats: 'S', age: 31, pa: 170, h: 41, double: 6, triple: 8, hr: 6, bb: 16, so: 45, hbp: 1, sb: 6, cs: 1, sec: 'LF', fld: 69, arm: 70 },
      { id: 'whiteel03', name: 'Eli Whiteside', pos: 'C', bats: 'R', age: 29, pa: 134, h: 29, double: 6, triple: 1, hr: 2, bb: 4, so: 30, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 57, arm: 79, rk: true },
    ],
    reserveBatters: [
      { id: 'bowkejo01', name: 'John Bowker', pos: 'LF', bats: 'L', age: 25, pa: 73, h: 16, double: 3, triple: 1, hr: 2, bb: 4, so: 16, hbp: 1, sb: 0, cs: 0, sec: '1B' },
      { id: 'downsma01', name: 'Matt Downs', pos: '2B', bats: 'R', age: 25, pa: 60, h: 9, double: 2, triple: 0, hr: 1, bb: 6, so: 13, hbp: 0, sb: 1, cs: 0, sec: 'SS', fld: 69, rk: true },
      { id: 'frandke01', name: 'Kevin Frandsen', pos: '2B', bats: 'R', age: 27, pa: 54, h: 11, double: 2, triple: 0, hr: 1, bb: 4, so: 4, hbp: 1, sb: 0, cs: 0, sec: 'SS' },
    ],
    pitchers: [
      { id: 'linceti01', name: 'Tim Lincecum', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 676, h: 172, hr: 11, bb: 76, so: 254, hbp: 6, er: 66, w: 15, l: 7, sv: 0, fld: 67 },
      { id: 'cainma01', name: 'Matt Cain', role: 'SP', throws: 'R', age: 24, g: 33, gs: 33, outs: 653, h: 188, hr: 20, bb: 80, so: 174, hbp: 5, er: 78, w: 14, l: 8, sv: 0, fld: 72 },
      { id: 'zitoba01', name: 'Barry Zito', role: 'SP', throws: 'L', age: 31, g: 33, gs: 33, outs: 576, h: 182, hr: 20, bb: 88, so: 139, hbp: 6, er: 94, w: 10, l: 13, sv: 0, fld: 63 },
      { id: 'sanchjo01', name: 'Jonathan Sanchez', role: 'SP', throws: 'L', age: 26, g: 32, gs: 29, outs: 490, h: 145, hr: 17, bb: 83, so: 171, hbp: 7, er: 83, w: 8, l: 12, sv: 0, fld: 61 },
      { id: 'johnsra05', name: 'Randy Johnson', role: 'SP', throws: 'L', age: 45, g: 22, gs: 17, outs: 288, h: 97, hr: 15, bb: 26, so: 92, hbp: 3, er: 46, w: 8, l: 6, sv: 0 },
      { id: 'wilsobr01', name: 'Brian Wilson', role: 'CL', throws: 'R', age: 27, g: 68, gs: 0, outs: 217, h: 62, hr: 5, bb: 28, so: 78, hbp: 2, er: 26, w: 5, l: 6, sv: 38 },
      { id: 'meddebr01', name: 'Brandon Medders', role: 'RP', throws: 'R', age: 29, g: 61, gs: 0, outs: 206, h: 63, hr: 8, bb: 33, so: 53, hbp: 3, er: 26, w: 5, l: 1, sv: 1 },
      { id: 'howrybo01', name: 'Bob Howry', role: 'RP', throws: 'R', age: 35, g: 63, gs: 0, outs: 191, h: 61, hr: 7, bb: 17, so: 49, hbp: 2, er: 28, w: 2, l: 6, sv: 0 },
      { id: 'affelje01', name: 'Jeremy Affeldt', role: 'RP', throws: 'L', age: 30, g: 74, gs: 0, outs: 187, h: 50, hr: 5, bb: 27, so: 56, hbp: 3, er: 18, w: 2, l: 2, sv: 0 },
      { id: 'milleju01', name: 'Justin Miller', role: 'RP', throws: 'R', age: 31, g: 44, gs: 0, outs: 170, h: 50, hr: 6, bb: 25, so: 46, hbp: 2, er: 22, w: 3, l: 3, sv: 0 },
      { id: 'valdeme01', name: 'Merkin Valdez', role: 'RP', throws: 'R', age: 27, g: 48, gs: 0, outs: 148, h: 55, hr: 5, bb: 27, so: 39, hbp: 1, er: 27, w: 2, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'romose01', name: 'Sergio Romo', role: 'RP', throws: 'R', age: 26, g: 45, gs: 0, outs: 102, h: 25, hr: 2, bb: 10, so: 39, hbp: 2, er: 13, w: 5, l: 2, sv: 2, rk: true },
      { id: 'martijo07', name: 'Joe Martinez', role: 'RP', throws: 'R', age: 26, g: 9, gs: 5, outs: 90, h: 46, hr: 4, bb: 12, so: 19, hbp: 1, er: 25, w: 3, l: 2, sv: 0, rk: true },
      { id: 'sadowry01', name: 'Ryan Sadowski', role: 'RP', throws: 'R', age: 26, g: 6, gs: 6, outs: 85, h: 28, hr: 2, bb: 17, so: 17, hbp: 1, er: 14, w: 2, l: 4, sv: 0, rk: true },
      { id: 'joaquwa01', name: 'Waldis Joaquin', role: 'RP', throws: 'R', age: 22, g: 10, gs: 0, outs: 32, h: 10, hr: 1, bb: 7, so: 12, hbp: 2, er: 5, w: 0, l: 0, sv: 0, rk: true },
      { id: 'bumgama01', name: 'Madison Bumgarner', role: 'RP', throws: 'L', age: 19, g: 4, gs: 1, outs: 30, h: 8, hr: 2, bb: 3, so: 10, hbp: 0, er: 2, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
];
