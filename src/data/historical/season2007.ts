import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 2007 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 2007
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
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents2007.ts`).
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

export const SEASON_2007: HistTeam[] = [
  // BAL (BAL 2007)
  {
    franchiseId: 'BAL',
    season: 2007,
    batters: [
      { id: 'hernara02', name: 'Ramon Hernandez', pos: 'C', bats: 'R', age: 31, pa: 409, h: 99, double: 20, triple: 1, hr: 13, bb: 32, so: 56, hbp: 6, sb: 1, cs: 1, sec: '1B', fld: 67, arm: 67 },
      { id: 'millake01', name: 'Kevin Millar', pos: '1B', bats: 'R', age: 35, pa: 562, h: 126, double: 28, triple: 1, hr: 16, bb: 70, so: 88, hbp: 10, sb: 1, cs: 1, sec: 'LF', fld: 78 },
      { id: 'roberbr01', name: 'Brian Roberts', pos: '2B', bats: 'S', age: 29, pa: 716, h: 184, double: 42, triple: 5, hr: 13, bb: 79, so: 91, hbp: 1, sb: 44, cs: 8, sec: 'SS', fld: 76 },
      { id: 'morame01', name: 'Melvin Mora', pos: '3B', bats: 'R', age: 35, pa: 527, h: 129, double: 21, triple: 1, hr: 15, bb: 43, so: 81, hbp: 7, sb: 8, cs: 2, sec: 'SS', fld: 79 },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: 'SS', bats: 'R', age: 33, pa: 568, h: 161, double: 27, triple: 1, hr: 19, bb: 38, so: 60, hbp: 8, sb: 3, cs: 1, sec: '2B', fld: 64 },
      { id: 'paytoja01', name: 'Jay Payton', pos: 'LF', bats: 'R', age: 34, pa: 470, h: 120, double: 22, triple: 3, hr: 9, bb: 21, so: 43, hbp: 3, sb: 5, cs: 2, sec: 'CF', fld: 79, arm: 62 },
      { id: 'patteco01', name: 'Corey Patterson', pos: 'CF', bats: 'L', age: 27, pa: 503, h: 122, double: 22, triple: 3, hr: 12, bb: 22, so: 84, hbp: 4, sb: 36, cs: 8, sec: 'LF', fld: 63, arm: 72 },
      { id: 'markani01', name: 'Nick Markakis', pos: 'RF', bats: 'L', age: 23, pa: 710, h: 190, double: 40, triple: 3, hr: 22, bb: 59, so: 106, hbp: 5, sb: 13, cs: 4, sec: 'LF', fld: 68, arm: 76 },
      { id: 'huffau01', name: 'Aubrey Huff', pos: 'DH', bats: 'L', age: 30, pa: 603, h: 148, double: 31, triple: 4, hr: 19, bb: 51, so: 83, hbp: 4, sb: 2, cs: 2, sec: '3B' },
    ],
    bench: [
      { id: 'gibboja01', name: 'Jay Gibbons', pos: 'LF', bats: 'L', age: 30, pa: 290, h: 69, double: 16, triple: 0, hr: 9, bb: 19, so: 42, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 65, arm: 62 },
      { id: 'gomezch02', name: 'Chris Gomez', pos: '1B', bats: 'R', age: 36, pa: 240, h: 67, double: 12, triple: 1, hr: 2, bb: 14, so: 22, hbp: 1, sb: 1, cs: 2, sec: '3B', fld: 78 },
      { id: 'bakopa01', name: 'Paul Bako', pos: 'C', bats: 'L', age: 35, pa: 174, h: 33, double: 3, triple: 1, hr: 1, bb: 14, so: 49, hbp: 1, sb: 0, cs: 1, fld: 58, arm: 65 },
      { id: 'redmati01', name: 'Tike Redman', pos: 'CF', bats: 'L', age: 30, pa: 139, h: 38, double: 7, triple: 2, hr: 1, bb: 6, so: 15, hbp: 0, sb: 5, cs: 1, sec: 'RF', fld: 79, arm: 63 },
      { id: 'bynumfr01', name: 'Freddie Bynum', pos: 'LF', bats: 'L', age: 27, pa: 101, h: 25, double: 6, triple: 3, hr: 2, bb: 4, so: 30, hbp: 1, sb: 7, cs: 2, sec: 'RF', fld: 86, arm: 90 },
    ],
    reserveBatters: [
      { id: 'hernalu01', name: 'Luis Hernandez', pos: 'SS', bats: 'S', age: 23, pa: 71, h: 20, double: 2, triple: 0, hr: 1, bb: 1, so: 10, hbp: 0, sb: 2, cs: 2, sec: '2B', fld: 97, rk: true },
      { id: 'faheybr01', name: 'Brandon Fahey', pos: 'SS', bats: 'L', age: 26, pa: 56, h: 11, double: 1, triple: 1, hr: 0, bb: 4, so: 9, hbp: 0, sb: 1, cs: 1, sec: '2B' },
      { id: 'mooresc02', name: 'Scott Moore', pos: '3B', bats: 'L', age: 23, pa: 55, h: 12, double: 2, triple: 0, hr: 2, bb: 2, so: 16, hbp: 0, sb: 0, cs: 1, sec: '1B', rk: true },
      { id: 'housejr01', name: 'J. R. House', pos: 'C', bats: 'R', age: 27, pa: 41, h: 7, double: 2, triple: 0, hr: 3, bb: 1, so: 11, hbp: 2, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'cabreda01', name: 'Daniel Cabrera', role: 'SP', throws: 'R', age: 26, g: 34, gs: 34, outs: 613, h: 196, hr: 21, bb: 119, so: 186, hbp: 13, er: 118, w: 9, l: 18, sv: 0, fld: 53 },
      { id: 'bedarer01', name: 'Erik Bedard', role: 'SP', throws: 'L', age: 28, g: 28, gs: 28, outs: 546, h: 156, hr: 16, bb: 60, so: 184, hbp: 5, er: 68, w: 13, l: 5, sv: 0, fld: 63 },
      { id: 'guthrje01', name: 'Jeremy Guthrie', role: 'SP', throws: 'R', age: 28, g: 32, gs: 26, outs: 526, h: 167, hr: 23, bb: 52, so: 121, hbp: 5, er: 76, w: 7, l: 5, sv: 0, fld: 74, rk: true },
      { id: 'trachst01', name: 'Steve Trachsel', role: 'SP', throws: 'R', age: 36, g: 29, gs: 29, outs: 474, h: 176, hr: 21, bb: 75, so: 66, hbp: 3, er: 86, w: 7, l: 11, sv: 0, fld: 93 },
      { id: 'burrebr01', name: 'Brian Burres', role: 'SP', throws: 'L', age: 26, g: 37, gs: 17, outs: 363, h: 139, hr: 14, bb: 64, so: 97, hbp: 5, er: 79, w: 6, l: 8, sv: 0, fld: 65, rk: true },
      { id: 'raych01', name: 'Chris Ray', role: 'CL', throws: 'R', age: 25, g: 43, gs: 0, outs: 128, h: 33, hr: 6, bb: 18, so: 40, hbp: 1, er: 17, w: 5, l: 6, sv: 16, fld: 68 },
      { id: 'bradfch01', name: 'Chad Bradford', role: 'RP', throws: 'R', age: 32, g: 78, gs: 0, outs: 194, h: 74, hr: 1, bb: 15, so: 37, hbp: 4, er: 24, w: 4, l: 7, sv: 2, fld: 82 },
      { id: 'walkeja01', name: 'Jamie Walker', role: 'RP', throws: 'L', age: 35, g: 81, gs: 0, outs: 184, h: 59, hr: 7, bb: 15, so: 43, hbp: 1, er: 22, w: 3, l: 2, sv: 7, fld: 78 },
      { id: 'bellro01', name: 'Rob Bell', role: 'RP', throws: 'R', age: 30, g: 30, gs: 0, outs: 159, h: 74, hr: 8, bb: 24, so: 28, hbp: 1, er: 36, w: 4, l: 3, sv: 0, fld: 55 },
      { id: 'parrijo01', name: 'John Parrish', role: 'RP', throws: 'L', age: 29, g: 53, gs: 0, outs: 156, h: 62, hr: 2, bb: 38, so: 44, hbp: 2, er: 31, w: 2, l: 2, sv: 0, fld: 74 },
      { id: 'baezda01', name: 'Danys Baez', role: 'RP', throws: 'R', age: 29, g: 53, gs: 0, outs: 151, h: 51, hr: 6, bb: 23, so: 33, hbp: 6, er: 29, w: 0, l: 6, sv: 3, fld: 74 },
    ],
    reservePitchers: [
      { id: 'birkiku01', name: 'Kurt Birkins', role: 'RP', throws: 'L', age: 26, g: 19, gs: 2, outs: 103, h: 45, hr: 4, bb: 16, so: 31, hbp: 3, er: 28, w: 1, l: 2, sv: 0, fld: 68, rk: true },
      { id: 'olsonga01', name: 'Garrett Olson', role: 'RP', throws: 'L', age: 23, g: 7, gs: 7, outs: 97, h: 42, hr: 4, bb: 28, so: 28, hbp: 2, er: 28, w: 1, l: 3, sv: 0, fld: 68, rk: true },
      { id: 'leicejo01', name: 'Jon Leicester', role: 'RP', throws: 'R', age: 28, g: 10, gs: 5, outs: 96, h: 36, hr: 3, bb: 14, so: 17, hbp: 3, er: 27, w: 2, l: 3, sv: 0, fld: 63 },
      { id: 'cherrro01', name: 'Rocky Cherry', role: 'RP', throws: 'R', age: 27, g: 22, gs: 0, outs: 94, h: 30, hr: 4, bb: 19, so: 23, hbp: 3, er: 19, w: 1, l: 1, sv: 0, fld: 71, rk: true },
      { id: 'loewead01', name: 'Adam Loewen', role: 'RP', throws: 'L', age: 23, g: 6, gs: 6, outs: 91, h: 30, hr: 2, bb: 20, so: 26, hbp: 2, er: 17, w: 2, l: 0, sv: 0, fld: 81 },
    ],
  },
  // BOS (BOS 2007)
  {
    franchiseId: 'BOS',
    season: 2007,
    batters: [
      { id: 'varitja01', name: 'Jason Varitek', pos: 'C', bats: 'S', age: 35, pa: 518, h: 113, double: 20, triple: 2, hr: 17, bb: 65, so: 116, hbp: 5, sb: 1, cs: 2, fld: 76, arm: 69 },
      { id: 'youklke01', name: 'Kevin Youkilis', pos: '1B', bats: 'R', age: 28, pa: 625, h: 149, double: 37, triple: 2, hr: 14, bb: 80, so: 108, hbp: 12, sb: 4, cs: 2, sec: '3B', fld: 82 },
      { id: 'pedrodu01', name: 'Dustin Pedroia', pos: '2B', bats: 'R', age: 23, pa: 581, h: 159, double: 37, triple: 1, hr: 8, bb: 46, so: 42, hbp: 7, sb: 6, cs: 1, sec: 'SS', fld: 72, rk: true },
      { id: 'lowelmi01', name: 'Mike Lowell', pos: '3B', bats: 'R', age: 33, pa: 653, h: 176, double: 42, triple: 2, hr: 19, bb: 52, so: 68, hbp: 3, sb: 3, cs: 2, sec: '1B', fld: 65 },
      { id: 'lugoju01', name: 'Julio Lugo', pos: 'SS', bats: 'R', age: 31, pa: 630, h: 147, double: 33, triple: 3, hr: 10, bb: 50, so: 83, hbp: 2, sb: 33, cs: 8, sec: '2B', fld: 59 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'LF', bats: 'R', age: 35, pa: 569, h: 144, double: 30, triple: 1, hr: 29, bb: 81, so: 98, hbp: 5, sb: 0, cs: 0, sec: 'RF', fld: 56, arm: 74 },
      { id: 'crispco01', name: 'Coco Crisp', pos: 'CF', bats: 'S', age: 27, pa: 591, h: 145, double: 30, triple: 5, hr: 9, bb: 45, so: 83, hbp: 1, sb: 25, cs: 6, sec: 'LF', fld: 87, arm: 68 },
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'RF', bats: 'L', age: 31, pa: 552, h: 128, double: 30, triple: 4, hr: 15, bb: 82, so: 98, hbp: 3, sb: 3, cs: 2, sec: 'CF', fld: 55, arm: 62 },
      { id: 'ortizda01', name: 'David Ortiz', pos: 'DH', bats: 'L', age: 31, pa: 667, h: 171, double: 41, triple: 1, hr: 42, bb: 110, so: 109, hbp: 3, sb: 2, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'penawi01', name: 'Wily Mo Pena', pos: 'LF', bats: 'R', age: 25, pa: 317, h: 78, double: 14, triple: 1, hr: 13, bb: 21, so: 97, hbp: 5, sb: 1, cs: 1, sec: 'RF', fld: 58, arm: 66 },
      { id: 'coraal01', name: 'Alex Cora', pos: '2B', bats: 'L', age: 31, pa: 232, h: 50, double: 8, triple: 4, hr: 2, bb: 11, so: 24, hbp: 7, sb: 3, cs: 1, sec: 'SS', fld: 74 },
      { id: 'hinsker01', name: 'Eric Hinske', pos: '1B', bats: 'L', age: 29, pa: 218, h: 47, double: 12, triple: 2, hr: 7, bb: 24, so: 53, hbp: 2, sb: 3, cs: 1, sec: '3B', fld: 71 },
      { id: 'ellsbja01', name: 'Jacoby Ellsbury', pos: 'LF', bats: 'L', age: 23, pa: 127, h: 41, double: 7, triple: 1, hr: 3, bb: 8, so: 15, hbp: 1, sb: 9, cs: 0, sec: 'CF', fld: 93, arm: 54, rk: true },
      { id: 'mirabdo01', name: 'Doug Mirabelli', pos: 'C', bats: 'R', age: 36, pa: 127, h: 23, double: 4, triple: 0, hr: 4, bb: 10, so: 39, hbp: 2, sb: 0, cs: 0, fld: 61, arm: 67 },
    ],
    reserveBatters: [
      { id: 'kieltbo01', name: 'Bobby Kielty', pos: 'RF', bats: 'S', age: 30, pa: 101, h: 23, double: 5, triple: 0, hr: 2, bb: 9, so: 18, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 69, arm: 78 },
    ],
    pitchers: [
      { id: 'matsuda01', name: 'Daisuke Matsuzaka', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 614, h: 191, hr: 25, bb: 80, so: 201, hbp: 13, er: 100, w: 15, l: 12, sv: 0, fld: 69, rk: true },
      { id: 'beckejo02', name: 'Josh Beckett', role: 'SP', throws: 'R', age: 27, g: 30, gs: 30, outs: 602, h: 183, hr: 23, bb: 54, so: 176, hbp: 7, er: 85, w: 20, l: 7, sv: 0, fld: 62 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 40, g: 31, gs: 31, outs: 567, h: 186, hr: 25, bb: 64, so: 117, hbp: 8, er: 97, w: 17, l: 12, sv: 0, fld: 73 },
      { id: 'schilcu01', name: 'Curt Schilling', role: 'SP', throws: 'R', age: 40, g: 24, gs: 24, outs: 453, h: 166, hr: 21, bb: 23, so: 119, hbp: 2, er: 68, w: 9, l: 8, sv: 0, fld: 65 },
      { id: 'tavarju01', name: 'Julian Tavarez', role: 'SP', throws: 'R', age: 34, g: 34, gs: 23, outs: 404, h: 149, hr: 14, bb: 52, so: 79, hbp: 8, er: 71, w: 7, l: 11, sv: 0, fld: 63 },
      { id: 'papeljo01', name: 'Jonathan Papelbon', role: 'CL', throws: 'R', age: 26, g: 59, gs: 0, outs: 175, h: 34, hr: 4, bb: 15, so: 73, hbp: 3, er: 10, w: 1, l: 3, sv: 37, fld: 70 },
      { id: 'okajihi01', name: 'Hideki Okajima', role: 'RP', throws: 'L', age: 31, g: 66, gs: 0, outs: 207, h: 50, hr: 6, bb: 17, so: 63, hbp: 1, er: 17, w: 3, l: 2, sv: 5, fld: 77, rk: true },
      { id: 'timlimi01', name: 'Mike Timlin', role: 'RP', throws: 'R', age: 41, g: 50, gs: 0, outs: 166, h: 54, hr: 5, bb: 13, so: 30, hbp: 2, er: 21, w: 2, l: 1, sv: 1, fld: 71 },
      { id: 'snydeky01', name: 'Kyle Snyder', role: 'RP', throws: 'R', age: 29, g: 46, gs: 0, outs: 163, h: 60, hr: 8, bb: 24, so: 42, hbp: 4, er: 30, w: 2, l: 3, sv: 0, fld: 56 },
      { id: 'delcama01', name: 'Manny Delcarmen', role: 'RP', throws: 'R', age: 25, g: 44, gs: 0, outs: 132, h: 38, hr: 3, bb: 15, so: 37, hbp: 2, er: 16, w: 0, l: 0, sv: 1, fld: 91 },
      { id: 'lopezja02', name: 'Javier Lopez', role: 'RP', throws: 'L', age: 29, g: 61, gs: 0, outs: 122, h: 37, hr: 2, bb: 20, so: 26, hbp: 4, er: 17, w: 2, l: 1, sv: 0, fld: 56 },
    ],
    reservePitchers: [
      { id: 'gabbaka01', name: 'Kason Gabbard', role: 'SP', throws: 'L', age: 25, g: 15, gs: 15, outs: 244, h: 69, hr: 7, bb: 42, so: 53, hbp: 6, er: 40, w: 6, l: 1, sv: 0, fld: 72, rk: true },
      { id: 'lestejo01', name: 'Jon Lester', role: 'SP', throws: 'L', age: 23, g: 12, gs: 11, outs: 189, h: 64, hr: 8, bb: 31, so: 47, hbp: 2, er: 32, w: 4, l: 0, sv: 0, fld: 75 },
      { id: 'buchhcl01', name: 'Clay Buchholz', role: 'RP', throws: 'R', age: 22, g: 4, gs: 3, outs: 68, h: 14, hr: 0, bb: 10, so: 22, hbp: 1, er: 4, w: 3, l: 1, sv: 0, fld: 88, rk: true },
      { id: 'donnebr01', name: 'Brendan Donnelly', role: 'RP', throws: 'R', age: 35, g: 27, gs: 0, outs: 62, h: 19, hr: 2, bb: 7, so: 17, hbp: 2, er: 8, w: 2, l: 1, sv: 0, fld: 64 },
    ],
  },
  // NYY (NYA 2007)
  {
    franchiseId: 'NYY',
    season: 2007,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 36, pa: 589, h: 155, double: 35, triple: 1, hr: 22, bb: 72, so: 101, hbp: 7, sb: 2, cs: 0, sec: '1B', fld: 69, arm: 68 },
      { id: 'phillan01', name: 'Andy Phillips', pos: '1B', bats: 'R', age: 30, pa: 207, h: 50, double: 8, triple: 2, hr: 4, bb: 12, so: 35, hbp: 1, sb: 1, cs: 2, sec: '3B', fld: 75 },
      { id: 'canoro01', name: 'Robinson Cano', pos: '2B', bats: 'L', age: 24, pa: 669, h: 197, double: 45, triple: 5, hr: 19, bb: 32, so: 81, hbp: 6, sb: 4, cs: 4, sec: 'SS', fld: 83 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: '3B', bats: 'R', age: 31, pa: 708, h: 182, double: 29, triple: 1, hr: 47, bb: 94, so: 131, hbp: 16, sb: 21, cs: 4, sec: 'SS', fld: 63 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 33, pa: 714, h: 206, double: 36, triple: 4, hr: 14, bb: 63, so: 103, hbp: 13, sb: 21, cs: 6, sec: '2B', fld: 58 },
      { id: 'matsuhi01', name: 'Hideki Matsui', pos: 'LF', bats: 'L', age: 33, pa: 633, h: 161, double: 31, triple: 3, hr: 24, bb: 71, so: 72, hbp: 3, sb: 3, cs: 2, sec: 'CF', fld: 66, arm: 70 },
      { id: 'cabreme01', name: 'Melky Cabrera', pos: 'CF', bats: 'S', age: 22, pa: 612, h: 149, double: 26, triple: 6, hr: 8, bb: 51, so: 68, hbp: 4, sb: 13, cs: 5, sec: 'LF', fld: 77, arm: 84 },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 33, pa: 699, h: 168, double: 40, triple: 3, hr: 17, bb: 103, so: 126, hbp: 4, sb: 28, cs: 8, sec: 'CF', fld: 72, arm: 66 },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'DH', bats: 'L', age: 33, pa: 605, h: 152, double: 29, triple: 3, hr: 15, bb: 61, so: 75, hbp: 3, sb: 23, cs: 5, sec: 'LF', fld: 71, arm: 65 },
    ],
    bench: [
      { id: 'giambja01', name: 'Jason Giambi', pos: 'DH', bats: 'L', age: 36, pa: 303, h: 60, double: 10, triple: 0, hr: 17, bb: 52, so: 60, hbp: 9, sb: 1, cs: 0, sec: '1B' },
      { id: 'cairomi01', name: 'Miguel Cairo', pos: '1B', bats: 'R', age: 33, pa: 193, h: 43, double: 9, triple: 2, hr: 0, bb: 10, so: 22, hbp: 2, sb: 9, cs: 1, sec: '3B', fld: 52 },
      { id: 'mientdo01', name: 'Doug Mientkiewicz', pos: '1B', bats: 'L', age: 33, pa: 192, h: 46, double: 12, triple: 0, hr: 4, bb: 18, so: 25, hbp: 3, sb: 1, cs: 0, sec: '3B', fld: 64 },
      { id: 'duncash01', name: 'Shelley Duncan', pos: 'DH', bats: 'R', age: 27, pa: 83, h: 19, double: 1, triple: 0, hr: 7, bb: 8, so: 20, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'nievewi01', name: 'Wil Nieves', pos: 'C', bats: 'R', age: 29, pa: 66, h: 9, double: 4, triple: 0, hr: 0, bb: 2, so: 9, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 67, rk: true },
    ],
    pitchers: [
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 35, g: 36, gs: 34, outs: 646, h: 232, hr: 20, bb: 65, so: 160, hbp: 2, er: 93, w: 15, l: 9, sv: 0, fld: 71 },
      { id: 'wangch01', name: 'Chien-Ming Wang', role: 'SP', throws: 'R', age: 27, g: 30, gs: 30, outs: 598, h: 204, hr: 10, bb: 54, so: 89, hbp: 6, er: 82, w: 19, l: 7, sv: 0, fld: 78 },
      { id: 'mussimi01', name: 'Mike Mussina', role: 'SP', throws: 'R', age: 38, g: 28, gs: 27, outs: 456, h: 173, hr: 17, bb: 34, so: 116, hbp: 4, er: 77, w: 11, l: 10, sv: 0, fld: 79 },
      { id: 'clemero02', name: 'Roger Clemens', role: 'SP', throws: 'R', age: 44, g: 18, gs: 17, outs: 297, h: 88, hr: 7, bb: 30, so: 83, hbp: 4, er: 34, w: 6, l: 6, sv: 0, fld: 72 },
      { id: 'hugheph01', name: 'Phil Hughes', role: 'SP', throws: 'R', age: 21, g: 13, gs: 13, outs: 218, h: 64, hr: 8, bb: 29, so: 58, hbp: 2, er: 36, w: 5, l: 3, sv: 0, fld: 75, rk: true },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 37, g: 67, gs: 0, outs: 214, h: 62, hr: 3, bb: 13, so: 68, hbp: 5, er: 19, w: 3, l: 4, sv: 30, fld: 62 },
      { id: 'proctsc01', name: 'Scott Proctor', role: 'RP', throws: 'R', age: 30, g: 83, gs: 0, outs: 259, h: 80, hr: 12, bb: 37, so: 71, hbp: 4, er: 37, w: 5, l: 5, sv: 0, fld: 76 },
      { id: 'vizcalu01', name: 'Luis Vizcaino', role: 'RP', throws: 'R', age: 32, g: 77, gs: 0, outs: 226, h: 67, hr: 8, bb: 39, so: 67, hbp: 3, er: 34, w: 8, l: 2, sv: 0, fld: 54 },
      { id: 'farnsky01', name: 'Kyle Farnsworth', role: 'RP', throws: 'R', age: 31, g: 64, gs: 0, outs: 180, h: 56, hr: 8, bb: 26, so: 61, hbp: 2, er: 29, w: 2, l: 1, sv: 0, fld: 76 },
      { id: 'myersmi01', name: 'Mike Myers', role: 'RP', throws: 'L', age: 38, g: 72, gs: 0, outs: 163, h: 56, hr: 6, bb: 22, so: 31, hbp: 4, er: 26, w: 4, l: 0, sv: 0, fld: 63 },
      { id: 'brunebr01', name: 'Brian Bruney', role: 'RP', throws: 'R', age: 25, g: 58, gs: 0, outs: 150, h: 45, hr: 5, bb: 37, so: 46, hbp: 3, er: 25, w: 3, l: 2, sv: 0, fld: 71 },
    ],
    reservePitchers: [
      { id: 'igawake01', name: 'Kei Igawa', role: 'SP', throws: 'L', age: 27, g: 14, gs: 12, outs: 203, h: 76, hr: 15, bb: 37, so: 53, hbp: 4, er: 47, w: 2, l: 3, sv: 0, fld: 74, rk: true },
      { id: 'villoro01', name: 'Ron Villone', role: 'RP', throws: 'L', age: 37, g: 37, gs: 0, outs: 127, h: 37, hr: 4, bb: 22, so: 34, hbp: 3, er: 21, w: 0, l: 0, sv: 0, fld: 79 },
      { id: 'hennse01', name: 'Sean Henn', role: 'RP', throws: 'L', age: 26, g: 29, gs: 1, outs: 110, h: 45, hr: 7, bb: 27, so: 26, hbp: 3, er: 29, w: 2, l: 2, sv: 0, fld: 76, rk: true },
      { id: 'desalma01', name: 'Matt DeSalvo', role: 'RP', throws: 'R', age: 26, g: 7, gs: 6, outs: 83, h: 34, hr: 2, bb: 18, so: 10, hbp: 3, er: 19, w: 1, l: 3, sv: 0, fld: 79, rk: true },
      { id: 'clippty01', name: 'Tyler Clippard', role: 'RP', throws: 'R', age: 22, g: 6, gs: 6, outs: 81, h: 29, hr: 6, bb: 17, so: 18, hbp: 0, er: 19, w: 3, l: 1, sv: 0, fld: 62, rk: true },
    ],
  },
  // TBR (TBA 2007)
  {
    franchiseId: 'TBR',
    season: 2007,
    batters: [
      { id: 'navardi01', name: 'Dioner Navarro', pos: 'C', bats: 'S', age: 23, pa: 434, h: 92, double: 17, triple: 1, hr: 9, bb: 37, so: 67, hbp: 1, sb: 3, cs: 1, sec: '1B', fld: 67, arm: 73 },
      { id: 'penaca01', name: 'Carlos Pena', pos: '1B', bats: 'L', age: 29, pa: 612, h: 137, double: 28, triple: 1, hr: 44, bb: 97, so: 150, hbp: 9, sb: 1, cs: 0, sec: '3B', fld: 86 },
      { id: 'velanjo01', name: 'Jorge Velandia', pos: '2B', bats: 'R', age: 32, pa: 60, h: 16, double: 4, triple: 0, hr: 2, bb: 8, so: 17, hbp: 1, sb: 0, cs: 0, sec: 'SS' },
      { id: 'wiggity01', name: 'Ty Wigginton', pos: '3B', bats: 'R', age: 29, pa: 604, h: 151, double: 32, triple: 1, hr: 25, bb: 41, so: 115, hbp: 8, sb: 3, cs: 4, sec: '2B', fld: 71 },
      { id: 'harribr01', name: 'Brendan Harris', pos: 'SS', bats: 'R', age: 26, pa: 576, h: 148, double: 35, triple: 3, hr: 12, bb: 42, so: 95, hbp: 5, sb: 4, cs: 1, sec: '2B', fld: 55, rk: true },
      { id: 'crawfca02', name: 'Carl Crawford', pos: 'LF', bats: 'L', age: 25, pa: 624, h: 180, double: 30, triple: 12, hr: 14, bb: 32, so: 95, hbp: 5, sb: 50, cs: 9, sec: 'CF', fld: 72, arm: 61 },
      { id: 'uptonbj01', name: 'B. J. Upton', pos: 'CF', bats: 'R', age: 22, pa: 548, h: 139, double: 23, triple: 1, hr: 20, bb: 60, so: 147, hbp: 4, sb: 24, cs: 8, sec: 'LF', fld: 78, arm: 93 },
      { id: 'youngde03', name: 'Delmon Young', pos: 'RF', bats: 'R', age: 21, pa: 681, h: 188, double: 39, triple: 1, hr: 13, bb: 24, so: 127, hbp: 4, sb: 10, cs: 4, sec: 'CF', fld: 70, arm: 81 },
      { id: 'iwamuak01', name: 'Akinori Iwamura', pos: 'DH', bats: 'L', age: 28, pa: 559, h: 140, double: 21, triple: 10, hr: 7, bb: 58, so: 114, hbp: 1, sb: 12, cs: 8, sec: '3B', fld: 62, rk: true },
    ],
    bench: [
      { id: 'gomesjo01', name: 'Jonny Gomes', pos: 'DH', bats: 'R', age: 26, pa: 394, h: 81, double: 18, triple: 2, hr: 18, bb: 42, so: 113, hbp: 7, sb: 7, cs: 4, sec: 'RF' },
      { id: 'wilsojo03', name: 'Josh Wilson', pos: 'SS', bats: 'R', age: 26, pa: 310, h: 67, double: 15, triple: 3, hr: 2, bb: 17, so: 58, hbp: 5, sb: 6, cs: 2, sec: '2B', fld: 47, rk: true },
      { id: 'nortogr01', name: 'Greg Norton', pos: 'DH', bats: 'S', age: 34, pa: 240, h: 55, double: 10, triple: 0, hr: 8, bb: 31, so: 52, hbp: 1, sb: 1, cs: 2, sec: '3B' },
      { id: 'dukesel01', name: 'Elijah Dukes', pos: 'CF', bats: 'R', age: 23, pa: 220, h: 35, double: 3, triple: 2, hr: 10, bb: 33, so: 44, hbp: 2, sb: 2, cs: 4, sec: 'LF', fld: 65, arm: 75, rk: true },
      { id: 'baldero01', name: 'Rocco Baldelli', pos: 'CF', bats: 'R', age: 25, pa: 150, h: 37, double: 8, triple: 1, hr: 6, bb: 7, so: 30, hbp: 3, sb: 4, cs: 1, sec: 'LF', fld: 100, arm: 95 },
    ],
    reserveBatters: [
      { id: 'pauljo01', name: 'Josh Paul', pos: 'C', bats: 'R', age: 32, pa: 115, h: 23, double: 5, triple: 0, hr: 1, bb: 8, so: 28, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 65, arm: 83 },
      { id: 'zobribe01', name: 'Ben Zobrist', pos: 'SS', bats: 'S', age: 26, pa: 105, h: 19, double: 3, triple: 1, hr: 1, bb: 4, so: 17, hbp: 0, sb: 1, cs: 1, sec: '2B', fld: 47 },
      { id: 'casanra01', name: 'Raul Casanova', pos: 'C', bats: 'S', age: 34, pa: 89, h: 20, double: 1, triple: 1, hr: 6, bb: 7, so: 17, hbp: 1, sb: 0, cs: 0, fld: 48, arm: 79 },
    ],
    pitchers: [
      { id: 'shielja02', name: 'James Shields', role: 'SP', throws: 'R', age: 25, g: 31, gs: 31, outs: 645, h: 209, hr: 28, bb: 43, so: 179, hbp: 9, er: 96, w: 12, l: 8, sv: 0, fld: 80 },
      { id: 'kazmisc01', name: 'Scott Kazmir', role: 'SP', throws: 'L', age: 23, g: 34, gs: 34, outs: 620, h: 194, hr: 18, bb: 89, so: 230, hbp: 7, er: 80, w: 13, l: 9, sv: 0, fld: 55 },
      { id: 'jacksed01', name: 'Edwin Jackson', role: 'SP', throws: 'R', age: 23, g: 32, gs: 31, outs: 483, h: 193, hr: 17, bb: 91, so: 124, hbp: 4, er: 103, w: 5, l: 15, sv: 0, fld: 62 },
      { id: 'sonnaan01', name: 'Andy Sonnanstine', role: 'SP', throws: 'R', age: 24, g: 22, gs: 22, outs: 392, h: 151, hr: 18, bb: 26, so: 97, hbp: 5, er: 85, w: 6, l: 10, sv: 0, fld: 86, rk: true },
      { id: 'hammeja01', name: 'Jason Hammel', role: 'SP', throws: 'R', age: 24, g: 24, gs: 14, outs: 255, h: 103, hr: 12, bb: 40, so: 63, hbp: 2, er: 61, w: 3, l: 5, sv: 0, fld: 66, rk: true },
      { id: 'reyesal01', name: 'Alberto Reyes', role: 'CL', throws: 'R', age: 37, g: 61, gs: 0, outs: 182, h: 46, hr: 11, bb: 21, so: 69, hbp: 3, er: 29, w: 2, l: 4, sv: 26, fld: 60 },
      { id: 'glovega01', name: 'Gary Glover', role: 'RP', throws: 'R', age: 30, g: 67, gs: 0, outs: 232, h: 87, hr: 12, bb: 26, so: 55, hbp: 1, er: 43, w: 6, l: 5, sv: 2, fld: 82 },
      { id: 'stokebr01', name: 'Brian Stokes', role: 'RP', throws: 'R', age: 27, g: 59, gs: 0, outs: 187, h: 89, hr: 10, bb: 25, so: 36, hbp: 3, er: 46, w: 2, l: 7, sv: 0, fld: 72, rk: true },
      { id: 'campsh01', name: 'Shawn Camp', role: 'RP', throws: 'R', age: 31, g: 50, gs: 0, outs: 120, h: 59, hr: 6, bb: 14, so: 32, hbp: 4, er: 28, w: 0, l: 3, sv: 0, fld: 78 },
      { id: 'salasju01', name: 'Juan Salas', role: 'RP', throws: 'R', age: 28, g: 34, gs: 0, outs: 109, h: 38, hr: 6, bb: 16, so: 26, hbp: 4, er: 16, w: 1, l: 1, sv: 0, fld: 77, rk: true },
      { id: 'dohmasc01', name: 'Scott Dohmann', role: 'RP', throws: 'R', age: 29, g: 31, gs: 0, outs: 98, h: 32, hr: 5, bb: 19, so: 27, hbp: 1, er: 18, w: 3, l: 0, sv: 0, fld: 91 },
    ],
    reservePitchers: [
      { id: 'fossuca01', name: 'Casey Fossum', role: 'SP', throws: 'L', age: 29, g: 40, gs: 10, outs: 228, h: 93, hr: 12, bb: 32, so: 56, hbp: 7, er: 53, w: 5, l: 8, sv: 0, fld: 69 },
      { id: 'seoja01', name: 'Jae Weong Seo', role: 'SP', throws: 'R', age: 30, g: 11, gs: 10, outs: 156, h: 73, hr: 10, bb: 18, so: 32, hbp: 2, er: 35, w: 3, l: 4, sv: 0, fld: 77 },
      { id: 'howeljp01', name: 'J. P. Howell', role: 'SP', throws: 'L', age: 24, g: 10, gs: 10, outs: 153, h: 64, hr: 7, bb: 22, so: 45, hbp: 4, er: 38, w: 1, l: 6, sv: 0, fld: 66 },
      { id: 'witasja01', name: 'Jay Witasick', role: 'RP', throws: 'R', age: 34, g: 36, gs: 0, outs: 94, h: 31, hr: 3, bb: 24, so: 27, hbp: 2, er: 17, w: 1, l: 0, sv: 0, fld: 63 },
      { id: 'balfogr01', name: 'Grant Balfour', role: 'RP', throws: 'R', age: 29, g: 25, gs: 0, outs: 74, h: 30, hr: 2, bb: 20, so: 30, hbp: 1, er: 21, w: 1, l: 2, sv: 0, fld: 69 },
    ],
  },
  // TOR (TOR 2007)
  {
    franchiseId: 'TOR',
    season: 2007,
    batters: [
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 36, pa: 391, h: 84, double: 21, triple: 1, hr: 11, bb: 51, so: 53, hbp: 2, sb: 0, cs: 1, fld: 73, arm: 61 },
      { id: 'overbly01', name: 'Lyle Overbay', pos: '1B', bats: 'L', age: 30, pa: 476, h: 117, double: 31, triple: 1, hr: 13, bb: 47, so: 75, hbp: 1, sb: 2, cs: 1, sec: '3B', fld: 87 },
      { id: 'hillaa01', name: 'Aaron Hill', pos: '2B', bats: 'R', age: 25, pa: 657, h: 173, double: 41, triple: 3, hr: 12, bb: 44, so: 88, hbp: 4, sb: 4, cs: 3, sec: 'SS', fld: 78 },
      { id: 'glaustr01', name: 'Troy Glaus', pos: '3B', bats: 'R', age: 30, pa: 456, h: 100, double: 20, triple: 1, hr: 24, bb: 61, so: 100, hbp: 4, sb: 1, cs: 1, sec: 'SS', fld: 67 },
      { id: 'mcdonjo03', name: 'John McDonald', pos: 'SS', bats: 'R', age: 32, pa: 353, h: 79, double: 16, triple: 3, hr: 2, bb: 15, so: 49, hbp: 2, sb: 8, cs: 2, sec: '2B', fld: 89 },
      { id: 'lindad01', name: 'Adam Lind', pos: 'LF', bats: 'L', age: 23, pa: 311, h: 73, double: 17, triple: 0, hr: 11, bb: 17, so: 64, hbp: 1, sb: 1, cs: 2, sec: 'RF', fld: 68, arm: 73, rk: true },
      { id: 'wellsve01', name: 'Vernon Wells', pos: 'CF', bats: 'R', age: 28, pa: 642, h: 157, double: 35, triple: 4, hr: 23, bb: 49, so: 86, hbp: 3, sb: 12, cs: 4, sec: 'RF', fld: 58, arm: 64 },
      { id: 'riosal01', name: 'Alex Rios', pos: 'RF', bats: 'R', age: 26, pa: 711, h: 189, double: 42, triple: 8, hr: 23, bb: 51, so: 115, hbp: 6, sb: 19, cs: 6, sec: 'CF', fld: 57, arm: 73 },
      { id: 'thomafr04', name: 'Frank Thomas', pos: 'DH', bats: 'R', age: 39, pa: 624, h: 143, double: 23, triple: 0, hr: 34, bb: 84, so: 95, hbp: 7, sb: 0, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'stairma01', name: 'Matt Stairs', pos: '1B', bats: 'L', age: 39, pa: 405, h: 97, double: 25, triple: 1, hr: 17, bb: 45, so: 72, hbp: 3, sb: 1, cs: 1, sec: 'LF', fld: 72 },
      { id: 'johnsre02', name: 'Reed Johnson', pos: 'LF', bats: 'R', age: 30, pa: 307, h: 76, double: 16, triple: 2, hr: 5, bb: 17, so: 53, hbp: 12, sb: 4, cs: 2, sec: 'RF', fld: 67, arm: 67 },
      { id: 'claytro01', name: 'Royce Clayton', pos: 'SS', bats: 'R', age: 37, pa: 216, h: 50, double: 13, triple: 1, hr: 1, bb: 14, so: 42, hbp: 1, sb: 5, cs: 2, fld: 67 },
      { id: 'phillja04', name: 'Jason Phillips', pos: 'C', bats: 'R', age: 30, pa: 158, h: 33, double: 8, triple: 0, hr: 2, bb: 9, so: 19, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 72, arm: 55 },
      { id: 'thigpcu01', name: 'Curtis Thigpen', pos: 'C', bats: 'R', age: 24, pa: 110, h: 24, double: 5, triple: 0, hr: 0, bb: 8, so: 17, hbp: 0, sb: 2, cs: 0, sec: '1B', rk: true },
    ],
    reserveBatters: [
      { id: 'adamsru01', name: 'Russ Adams', pos: '3B', bats: 'L', age: 26, pa: 69, h: 14, double: 3, triple: 0, hr: 1, bb: 6, so: 10, hbp: 0, sb: 1, cs: 0, sec: 'SS' },
      { id: 'clarkho02', name: 'Howie Clark', pos: '3B', bats: 'L', age: 33, pa: 57, h: 10, double: 2, triple: 0, hr: 0, bb: 7, so: 6, hbp: 0, sb: 1, cs: 0, sec: '1B' },
      { id: 'olmedra01', name: 'Ray Olmedo', pos: 'SS', bats: 'S', age: 26, pa: 54, h: 11, double: 3, triple: 0, hr: 0, bb: 3, so: 9, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 100 },
      { id: 'fasansa01', name: 'Sal Fasano', pos: 'C', bats: 'R', age: 35, pa: 49, h: 10, double: 2, triple: 0, hr: 2, bb: 2, so: 15, hbp: 1, sb: 0, cs: 0 },
      { id: 'lunahe01', name: 'Hector Luna', pos: '3B', bats: 'R', age: 27, pa: 46, h: 11, double: 2, triple: 0, hr: 1, bb: 3, so: 8, hbp: 0, sb: 1, cs: 0, sec: '2B' },
    ],
    pitchers: [
      { id: 'hallaro01', name: 'Roy Halladay', role: 'SP', throws: 'R', age: 30, g: 31, gs: 31, outs: 676, h: 224, hr: 17, bb: 42, so: 144, hbp: 5, er: 86, w: 16, l: 7, sv: 0, fld: 78 },
      { id: 'mcgowdu01', name: 'Dustin McGowan', role: 'SP', throws: 'R', age: 25, g: 27, gs: 27, outs: 509, h: 151, hr: 14, bb: 68, so: 138, hbp: 5, er: 83, w: 12, l: 10, sv: 0, fld: 78 },
      { id: 'burneaj01', name: 'A. J. Burnett', role: 'SP', throws: 'R', age: 30, g: 25, gs: 25, outs: 497, h: 143, hr: 18, bb: 60, so: 162, hbp: 10, er: 68, w: 10, l: 8, sv: 0, fld: 69 },
      { id: 'marcush01', name: 'Shaun Marcum', role: 'SP', throws: 'R', age: 25, g: 38, gs: 25, outs: 477, h: 152, hr: 26, bb: 55, so: 121, hbp: 6, er: 75, w: 12, l: 6, sv: 1, fld: 87 },
      { id: 'litscje01', name: 'Jesse Litsch', role: 'SP', throws: 'R', age: 22, g: 20, gs: 20, outs: 333, h: 116, hr: 14, bb: 36, so: 50, hbp: 7, er: 47, w: 7, l: 9, sv: 0, fld: 87, rk: true },
      { id: 'accarje01', name: 'Jeremy Accardo', role: 'CL', throws: 'R', age: 25, g: 64, gs: 0, outs: 202, h: 59, hr: 5, bb: 22, so: 52, hbp: 2, er: 25, w: 4, l: 4, sv: 30, fld: 68 },
      { id: 'janssca01', name: 'Casey Janssen', role: 'RP', throws: 'R', age: 25, g: 70, gs: 0, outs: 218, h: 72, hr: 6, bb: 18, so: 36, hbp: 4, er: 29, w: 2, l: 3, sv: 6, fld: 79 },
      { id: 'tallebr01', name: 'Brian Tallet', role: 'RP', throws: 'L', age: 29, g: 48, gs: 0, outs: 187, h: 50, hr: 3, bb: 31, so: 49, hbp: 5, er: 25, w: 2, l: 4, sv: 0, fld: 71 },
      { id: 'downssc01', name: 'Scott Downs', role: 'RP', throws: 'L', age: 31, g: 81, gs: 0, outs: 174, h: 51, hr: 5, bb: 22, so: 50, hbp: 2, er: 21, w: 4, l: 2, sv: 1, fld: 69 },
      { id: 'frasoja01', name: 'Jason Frasor', role: 'RP', throws: 'R', age: 29, g: 51, gs: 0, outs: 171, h: 49, hr: 5, bb: 21, so: 56, hbp: 2, er: 27, w: 1, l: 5, sv: 3, fld: 67 },
      { id: 'wolfebr01', name: 'Brian Wolfe', role: 'RP', throws: 'R', age: 26, g: 38, gs: 0, outs: 136, h: 36, hr: 5, bb: 9, so: 22, hbp: 2, er: 15, w: 3, l: 1, sv: 0, fld: 75, rk: true },
    ],
    reservePitchers: [
      { id: 'towerjo01', name: 'Josh Towers', role: 'SP', throws: 'R', age: 30, g: 25, gs: 15, outs: 321, h: 132, hr: 18, bb: 21, so: 67, hbp: 5, er: 64, w: 5, l: 10, sv: 0, fld: 64 },
      { id: 'ohkato01', name: 'Tomo Ohka', role: 'SP', throws: 'R', age: 31, g: 10, gs: 10, outs: 168, h: 63, hr: 8, bb: 20, so: 28, hbp: 1, er: 31, w: 2, l: 5, sv: 0, fld: 66 },
      { id: 'chacigu01', name: 'Gustavo Chacin', role: 'RP', throws: 'L', age: 26, g: 5, gs: 5, outs: 82, h: 28, hr: 4, bb: 10, so: 15, hbp: 2, er: 14, w: 2, l: 1, sv: 0, fld: 76 },
      { id: 'leagubr01', name: 'Brandon League', role: 'RP', throws: 'R', age: 24, g: 14, gs: 0, outs: 35, h: 15, hr: 1, bb: 5, so: 8, hbp: 1, er: 6, w: 0, l: 0, sv: 0, fld: 64 },
    ],
  },
  // CWS (CHA 2007)
  {
    franchiseId: 'CWS',
    season: 2007,
    batters: [
      { id: 'pierzaj01', name: 'A. J. Pierzynski', pos: 'C', bats: 'L', age: 30, pa: 509, h: 129, double: 23, triple: 0, hr: 15, bb: 23, so: 67, hbp: 9, sb: 1, cs: 1, sec: '1B', fld: 70, arm: 69 },
      { id: 'konerpa01', name: 'Paul Konerko', pos: '1B', bats: 'R', age: 31, pa: 636, h: 155, double: 31, triple: 0, hr: 33, bb: 72, so: 103, hbp: 5, sb: 0, cs: 0, sec: '3B', fld: 68 },
      { id: 'iguchta01', name: 'Tadahito Iguchi', pos: '2B', bats: 'R', age: 32, pa: 533, h: 128, double: 24, triple: 3, hr: 12, bb: 52, so: 93, hbp: 3, sb: 12, cs: 3, sec: 'SS', fld: 82 },
      { id: 'fieldjo02', name: 'Josh Fields', pos: '3B', bats: 'R', age: 24, pa: 418, h: 89, double: 18, triple: 1, hr: 23, bb: 37, so: 125, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 70, rk: true },
      { id: 'uribeju01', name: 'Juan Uribe', pos: 'SS', bats: 'R', age: 28, pa: 563, h: 122, double: 23, triple: 2, hr: 21, bb: 28, so: 101, hbp: 4, sb: 2, cs: 6, sec: '2B', fld: 80 },
      { id: 'mackoro01', name: 'Rob Mackowiak', pos: 'LF', bats: 'L', age: 31, pa: 329, h: 80, double: 14, triple: 2, hr: 6, bb: 28, so: 68, hbp: 5, sb: 5, cs: 2, sec: 'RF', fld: 63, arm: 75 },
      { id: 'owensje01', name: 'Jerry Owens', pos: 'CF', bats: 'L', age: 26, pa: 389, h: 96, double: 10, triple: 2, hr: 1, bb: 27, so: 63, hbp: 3, sb: 32, cs: 8, sec: 'LF', fld: 68, arm: 58, rk: true },
      { id: 'dyeje01', name: 'Jermaine Dye', pos: 'RF', bats: 'R', age: 33, pa: 561, h: 140, double: 30, triple: 1, hr: 33, bb: 47, so: 106, hbp: 5, sb: 5, cs: 2, sec: 'LF', fld: 79, arm: 73 },
      { id: 'thomeji01', name: 'Jim Thome', pos: 'DH', bats: 'L', age: 36, pa: 536, h: 119, double: 20, triple: 0, hr: 34, bb: 95, so: 132, hbp: 6, sb: 0, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'erstada01', name: 'Darin Erstad', pos: 'CF', bats: 'L', age: 33, pa: 345, h: 79, double: 16, triple: 1, hr: 3, bb: 26, so: 50, hbp: 1, sb: 6, cs: 2, sec: 'LF', fld: 64, arm: 64 },
      { id: 'podsesc01', name: 'Scott Podsednik', pos: 'LF', bats: 'L', age: 31, pa: 235, h: 55, double: 12, triple: 2, hr: 1, bb: 19, so: 36, hbp: 2, sb: 17, cs: 7, sec: 'CF', fld: 63, arm: 75 },
      { id: 'gonzaan01', name: 'Andy Gonzalez', pos: '3B', bats: 'R', age: 25, pa: 215, h: 35, double: 6, triple: 0, hr: 2, bb: 25, so: 61, hbp: 0, sb: 1, cs: 5, sec: '1B', fld: 62, rk: true },
      { id: 'richada02', name: 'Danny Richar', pos: '2B', bats: 'L', age: 24, pa: 206, h: 43, double: 9, triple: 3, hr: 6, bb: 16, so: 33, hbp: 0, sb: 1, cs: 3, sec: 'SS', fld: 59, rk: true },
      { id: 'cintral01', name: 'Alex Cintron', pos: '3B', bats: 'S', age: 28, pa: 196, h: 49, double: 8, triple: 1, hr: 3, bb: 7, so: 26, hbp: 1, sb: 3, cs: 1, sec: 'SS' },
    ],
    reserveBatters: [
      { id: 'credejo01', name: 'Joe Crede', pos: '3B', bats: 'R', age: 29, pa: 178, h: 43, double: 8, triple: 0, hr: 8, bb: 9, so: 21, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 90 },
      { id: 'terrelu01', name: 'Luis Terrero', pos: 'CF', bats: 'R', age: 27, pa: 139, h: 27, double: 3, triple: 0, hr: 4, bb: 11, so: 32, hbp: 7, sb: 3, cs: 3, sec: 'RF', fld: 60, arm: 69 },
      { id: 'hallto02', name: 'Toby Hall', pos: 'C', bats: 'R', age: 31, pa: 120, h: 29, double: 6, triple: 0, hr: 2, bb: 4, so: 10, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 57, arm: 57 },
      { id: 'ozunapa01', name: 'Pablo Ozuna', pos: '3B', bats: 'R', age: 32, pa: 85, h: 23, double: 4, triple: 1, hr: 0, bb: 3, so: 8, hbp: 1, sb: 3, cs: 2, sec: '2B' },
      { id: 'sweenry01', name: 'Ryan Sweeney', pos: 'LF', bats: 'L', age: 22, pa: 49, h: 10, double: 2, triple: 0, hr: 1, bb: 3, so: 7, hbp: 0, sb: 0, cs: 1, sec: 'CF', rk: true },
    ],
    pitchers: [
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 30, g: 32, gs: 32, outs: 650, h: 205, hr: 28, bb: 52, so: 201, hbp: 9, er: 99, w: 15, l: 8, sv: 0, fld: 67 },
      { id: 'garlajo01', name: 'Jon Garland', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 625, h: 224, hr: 22, bb: 49, so: 104, hbp: 5, er: 97, w: 10, l: 13, sv: 0, fld: 77 },
      { id: 'buehrma01', name: 'Mark Buehrle', role: 'SP', throws: 'L', age: 28, g: 30, gs: 30, outs: 603, h: 216, hr: 25, bb: 43, so: 110, hbp: 5, er: 88, w: 10, l: 9, sv: 0, fld: 77 },
      { id: 'contrjo01', name: 'Jose Contreras', role: 'SP', throws: 'R', age: 35, g: 32, gs: 30, outs: 567, h: 213, hr: 21, bb: 63, so: 128, hbp: 12, er: 104, w: 10, l: 17, sv: 0, fld: 55 },
      { id: 'danksjo01', name: 'John Danks', role: 'SP', throws: 'L', age: 22, g: 26, gs: 26, outs: 417, h: 160, hr: 28, bb: 54, so: 109, hbp: 4, er: 85, w: 6, l: 13, sv: 0, fld: 65, rk: true },
      { id: 'jenksbo01', name: 'Bobby Jenks', role: 'CL', throws: 'R', age: 26, g: 66, gs: 0, outs: 195, h: 49, hr: 3, bb: 19, so: 62, hbp: 1, er: 22, w: 3, l: 5, sv: 40, fld: 68 },
      { id: 'thornma01', name: 'Matt Thornton', role: 'RP', throws: 'L', age: 30, g: 68, gs: 0, outs: 169, h: 55, hr: 6, bb: 28, so: 55, hbp: 1, er: 28, w: 4, l: 4, sv: 2, fld: 68 },
      { id: 'loganbo02', name: 'Boone Logan', role: 'RP', throws: 'L', age: 22, g: 68, gs: 0, outs: 152, h: 58, hr: 7, bb: 24, so: 36, hbp: 2, er: 31, w: 2, l: 1, sv: 0, fld: 73, rk: true },
      { id: 'macdomi01', name: 'Mike MacDougal', role: 'RP', throws: 'R', age: 30, g: 54, gs: 0, outs: 127, h: 47, hr: 3, bb: 24, so: 42, hbp: 2, er: 24, w: 2, l: 5, sv: 0, fld: 71 },
      { id: 'masseni01', name: 'Nick Masset', role: 'RP', throws: 'R', age: 25, g: 27, gs: 1, outs: 118, h: 51, hr: 2, bb: 24, so: 21, hbp: 3, er: 30, w: 2, l: 3, sv: 0, fld: 78, rk: true },
      { id: 'bukviry01', name: 'Ryan Bukvich', role: 'RP', throws: 'R', age: 29, g: 45, gs: 0, outs: 107, h: 35, hr: 5, bb: 25, so: 19, hbp: 3, er: 21, w: 1, l: 0, sv: 0, fld: 88, rk: true },
    ],
    reservePitchers: [
      { id: 'floydga01', name: 'Gavin Floyd', role: 'SP', throws: 'R', age: 24, g: 16, gs: 10, outs: 210, h: 84, hr: 17, bb: 27, so: 46, hbp: 5, er: 47, w: 1, l: 5, sv: 0, fld: 83 },
      { id: 'aardsda01', name: 'David Aardsma', role: 'RP', throws: 'R', age: 25, g: 25, gs: 0, outs: 97, h: 33, hr: 5, bb: 18, so: 34, hbp: 1, er: 20, w: 2, l: 1, sv: 0, fld: 69 },
      { id: 'wasseeh01', name: 'Ehren Wassermann', role: 'RP', throws: 'R', age: 26, g: 33, gs: 0, outs: 69, h: 20, hr: 0, bb: 7, so: 14, hbp: 2, er: 7, w: 1, l: 1, sv: 0, fld: 80, rk: true },
      { id: 'siscoan01', name: 'Andy Sisco', role: 'RP', throws: 'L', age: 24, g: 19, gs: 0, outs: 42, h: 17, hr: 2, bb: 10, so: 14, hbp: 0, er: 10, w: 0, l: 1, sv: 0, fld: 65 },
      { id: 'dayde01', name: 'Dewon Day', role: 'RP', throws: 'R', age: 26, g: 13, gs: 0, outs: 36, h: 19, hr: 1, bb: 9, so: 7, hbp: 2, er: 15, w: 0, l: 1, sv: 0, fld: 71, rk: true },
    ],
  },
  // CLE (CLE 2007)
  {
    franchiseId: 'CLE',
    season: 2007,
    batters: [
      { id: 'martivi01', name: 'Victor Martinez', pos: 'C', bats: 'S', age: 28, pa: 645, h: 173, double: 38, triple: 0, hr: 21, bb: 65, so: 77, hbp: 7, sb: 0, cs: 0, sec: '1B', fld: 75, arm: 75 },
      { id: 'garkory01', name: 'Ryan Garko', pos: '1B', bats: 'R', age: 26, pa: 541, h: 140, double: 29, triple: 1, hr: 20, bb: 34, so: 95, hbp: 20, sb: 0, cs: 1, sec: '3B', fld: 68 },
      { id: 'barfijo02', name: 'Josh Barfield', pos: '2B', bats: 'R', age: 24, pa: 444, h: 109, double: 22, triple: 3, hr: 6, bb: 18, so: 77, hbp: 2, sb: 15, cs: 4, sec: 'SS', fld: 71 },
      { id: 'blakeca01', name: 'Casey Blake', pos: '3B', bats: 'R', age: 33, pa: 662, h: 158, double: 34, triple: 3, hr: 22, bb: 56, so: 128, hbp: 9, sb: 5, cs: 4, sec: '1B', fld: 70 },
      { id: 'peraljh01', name: 'Jhonny Peralta', pos: 'SS', bats: 'R', age: 25, pa: 647, h: 155, double: 29, triple: 2, hr: 19, bb: 61, so: 149, hbp: 3, sb: 2, cs: 3, sec: '2B', fld: 77 },
      { id: 'michaja01', name: 'Jason Michaels', pos: 'LF', bats: 'R', age: 31, pa: 295, h: 72, double: 14, triple: 1, hr: 5, bb: 24, so: 50, hbp: 2, sb: 4, cs: 3, sec: 'CF', fld: 75, arm: 70 },
      { id: 'sizemgr01', name: 'Grady Sizemore', pos: 'CF', bats: 'L', age: 24, pa: 748, h: 183, double: 41, triple: 8, hr: 25, bb: 86, so: 152, hbp: 14, sb: 28, cs: 9, sec: 'LF', fld: 70, arm: 61 },
      { id: 'gutiefr01', name: 'Franklin Gutierrez', pos: 'RF', bats: 'R', age: 24, pa: 301, h: 74, double: 14, triple: 2, hr: 10, bb: 18, so: 73, hbp: 1, sb: 6, cs: 2, sec: 'LF', fld: 72, arm: 66 },
      { id: 'hafnetr01', name: 'Travis Hafner', pos: 'DH', bats: 'L', age: 30, pa: 659, h: 155, double: 32, triple: 1, hr: 34, bb: 105, so: 124, hbp: 8, sb: 1, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'nixontr01', name: 'Trot Nixon', pos: 'RF', bats: 'L', age: 33, pa: 354, h: 79, double: 19, triple: 0, hr: 6, bb: 44, so: 51, hbp: 2, sb: 0, cs: 1, sec: 'CF', fld: 50, arm: 69 },
      { id: 'delluda01', name: 'David Dellucci', pos: 'LF', bats: 'L', age: 33, pa: 199, h: 45, double: 9, triple: 2, hr: 8, bb: 21, so: 42, hbp: 2, sb: 2, cs: 1, sec: 'RF', fld: 83, arm: 74 },
      { id: 'cabreas01', name: 'Asdrubal Cabrera', pos: '2B', bats: 'S', age: 21, pa: 186, h: 45, double: 9, triple: 2, hr: 3, bb: 17, so: 29, hbp: 2, sb: 0, cs: 0, sec: 'SS', fld: 88, rk: true },
      { id: 'shoppke01', name: 'Kelly Shoppach', pos: 'C', bats: 'R', age: 27, pa: 177, h: 40, double: 11, triple: 0, hr: 6, bb: 11, so: 60, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 79 },
      { id: 'rousemi01', name: 'Mike Rouse', pos: '2B', bats: 'L', age: 27, pa: 76, h: 10, double: 2, triple: 0, hr: 0, bb: 6, so: 18, hbp: 1, sb: 1, cs: 1, sec: '3B', rk: true },
    ],
    reserveBatters: [
      { id: 'francbe01', name: 'Ben Francisco', pos: 'LF', bats: 'R', age: 25, pa: 66, h: 17, double: 5, triple: 0, hr: 3, bb: 3, so: 19, hbp: 0, sb: 0, cs: 2, sec: 'RF', rk: true },
      { id: 'martean01', name: 'Andy Marte', pos: '3B', bats: 'R', age: 23, pa: 60, h: 11, double: 4, triple: 0, hr: 1, bb: 4, so: 12, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 67 },
    ],
    pitchers: [
      { id: 'sabatcc01', name: 'CC Sabathia', role: 'SP', throws: 'L', age: 26, g: 34, gs: 34, outs: 723, h: 232, hr: 21, bb: 48, so: 208, hbp: 8, er: 89, w: 19, l: 7, sv: 0, fld: 57 },
      { id: 'carmofa01', name: 'Roberto Hernandez', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 645, h: 205, hr: 18, bb: 65, so: 140, hbp: 12, er: 82, w: 19, l: 8, sv: 0, fld: 84 },
      { id: 'byrdpa01', name: 'Paul Byrd', role: 'SP', throws: 'R', age: 36, g: 31, gs: 31, outs: 577, h: 236, hr: 26, bb: 32, so: 91, hbp: 6, er: 97, w: 15, l: 8, sv: 0, fld: 71 },
      { id: 'westbja01', name: 'Jake Westbrook', role: 'SP', throws: 'R', age: 29, g: 25, gs: 25, outs: 456, h: 167, hr: 12, bb: 46, so: 86, hbp: 5, er: 73, w: 6, l: 9, sv: 0, fld: 91 },
      { id: 'leecl02', name: 'Cliff Lee', role: 'SP', throws: 'L', age: 28, g: 20, gs: 16, outs: 292, h: 110, hr: 15, bb: 31, so: 67, hbp: 4, er: 55, w: 5, l: 8, sv: 0, fld: 66 },
      { id: 'borowjo01', name: 'Joe Borowski', role: 'CL', throws: 'R', age: 36, g: 69, gs: 0, outs: 197, h: 69, hr: 9, bb: 22, so: 57, hbp: 2, er: 33, w: 4, l: 5, sv: 45, fld: 59 },
      { id: 'betanra01', name: 'Rafael Betancourt', role: 'RP', throws: 'R', age: 32, g: 68, gs: 0, outs: 238, h: 57, hr: 6, bb: 12, so: 74, hbp: 0, er: 20, w: 5, l: 1, sv: 3, fld: 71 },
      { id: 'perezra01', name: 'Rafael Perez', role: 'RP', throws: 'L', age: 25, g: 44, gs: 0, outs: 182, h: 42, hr: 6, bb: 17, so: 63, hbp: 0, er: 14, w: 1, l: 2, sv: 1, fld: 80, rk: true },
      { id: 'mastnto01', name: 'Tom Mastny', role: 'RP', throws: 'R', age: 26, g: 51, gs: 0, outs: 173, h: 63, hr: 6, bb: 32, so: 52, hbp: 2, er: 31, w: 7, l: 2, sv: 0, fld: 77, rk: true },
      { id: 'laffeaa01', name: 'Aaron Laffey', role: 'RP', throws: 'L', age: 22, g: 9, gs: 9, outs: 148, h: 54, hr: 2, bb: 12, so: 25, hbp: 4, er: 25, w: 4, l: 2, sv: 0, fld: 83, rk: true },
      { id: 'hernaro01', name: 'Roberto Hernandez', role: 'RP', throws: 'R', age: 42, g: 50, gs: 0, outs: 139, h: 52, hr: 4, bb: 24, so: 37, hbp: 2, er: 24, w: 3, l: 3, sv: 0, fld: 69 },
    ],
    reservePitchers: [
      { id: 'sowerje01', name: 'Jeremy Sowers', role: 'SP', throws: 'L', age: 24, g: 13, gs: 13, outs: 202, h: 78, hr: 9, bb: 19, so: 26, hbp: 3, er: 40, w: 1, l: 6, sv: 0, fld: 91 },
      { id: 'cabrefe01', name: 'Fernando Cabrera', role: 'RP', throws: 'R', age: 25, g: 33, gs: 0, outs: 131, h: 46, hr: 8, bb: 27, so: 51, hbp: 0, er: 29, w: 1, l: 2, sv: 1, fld: 79 },
      { id: 'fultzaa01', name: 'Aaron Fultz', role: 'RP', throws: 'L', age: 33, g: 49, gs: 0, outs: 111, h: 34, hr: 3, bb: 15, so: 30, hbp: 1, er: 14, w: 4, l: 3, sv: 0, fld: 54 },
      { id: 'lewisje01', name: 'Jensen Lewis', role: 'RP', throws: 'R', age: 23, g: 26, gs: 0, outs: 88, h: 26, hr: 1, bb: 10, so: 34, hbp: 1, er: 7, w: 1, l: 1, sv: 0, fld: 72, rk: true },
      { id: 'stanfja01', name: 'Jason Stanford', role: 'RP', throws: 'L', age: 30, g: 8, gs: 2, outs: 79, h: 32, hr: 1, bb: 7, so: 16, hbp: 2, er: 14, w: 1, l: 1, sv: 0, fld: 61 },
    ],
  },
  // DET (DET 2007)
  {
    franchiseId: 'DET',
    season: 2007,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 35, pa: 515, h: 142, double: 29, triple: 4, hr: 12, bb: 14, so: 88, hbp: 1, sb: 5, cs: 2, fld: 73, arm: 74 },
      { id: 'caseyse01', name: 'Sean Casey', pos: '1B', bats: 'L', age: 32, pa: 496, h: 131, double: 28, triple: 1, hr: 6, bb: 39, so: 44, hbp: 4, sb: 1, cs: 1, sec: '3B', fld: 63 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: '2B', bats: 'R', age: 31, pa: 641, h: 192, double: 32, triple: 2, hr: 8, bb: 33, so: 31, hbp: 11, sb: 5, cs: 3, sec: '3B', fld: 83 },
      { id: 'ingebr01', name: 'Brandon Inge', pos: '3B', bats: 'R', age: 30, pa: 577, h: 126, double: 26, triple: 3, hr: 18, bb: 46, so: 135, hbp: 8, sb: 8, cs: 3, sec: '1B', fld: 76 },
      { id: 'guillca01', name: 'Carlos Guillen', pos: 'SS', bats: 'S', age: 31, pa: 630, h: 172, double: 36, triple: 7, hr: 19, bb: 60, so: 90, hbp: 3, sb: 15, cs: 8, sec: '3B', fld: 59 },
      { id: 'monrocr01', name: 'Craig Monroe', pos: 'LF', bats: 'R', age: 30, pa: 427, h: 96, double: 23, triple: 1, hr: 16, bb: 27, so: 93, hbp: 2, sb: 2, cs: 3, sec: 'RF', fld: 62, arm: 71 },
      { id: 'grandcu01', name: 'Curtis Granderson', pos: 'CF', bats: 'L', age: 26, pa: 676, h: 173, double: 35, triple: 17, hr: 22, bb: 57, so: 155, hbp: 4, sb: 18, cs: 3, sec: 'LF', fld: 81, arm: 73 },
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 33, pa: 678, h: 202, double: 45, triple: 0, hr: 26, bb: 64, so: 82, hbp: 3, sb: 3, cs: 2, sec: 'CF', fld: 65, arm: 63 },
      { id: 'sheffga01', name: 'Gary Sheffield', pos: 'DH', bats: 'R', age: 38, pa: 593, h: 139, double: 21, triple: 1, hr: 26, bb: 76, so: 68, hbp: 8, sb: 18, cs: 4, sec: 'RF' },
    ],
    bench: [
      { id: 'thamema01', name: 'Marcus Thames', pos: 'LF', bats: 'R', age: 30, pa: 284, h: 64, double: 14, triple: 1, hr: 18, bb: 20, so: 71, hbp: 2, sb: 1, cs: 1, sec: 'RF', fld: 70, arm: 62 },
      { id: 'rabelmi01', name: 'Mike Rabelo', pos: 'C', bats: 'S', age: 27, pa: 185, h: 43, double: 10, triple: 2, hr: 1, bb: 6, so: 42, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 64, arm: 72, rk: true },
      { id: 'infanom01', name: 'Omar Infante', pos: '2B', bats: 'R', age: 25, pa: 178, h: 43, double: 8, triple: 2, hr: 3, bb: 9, so: 31, hbp: 1, sb: 3, cs: 1, sec: 'SS' },
      { id: 'raburry01', name: 'Ryan Raburn', pos: 'RF', bats: 'R', age: 26, pa: 148, h: 42, double: 12, triple: 2, hr: 4, bb: 8, so: 33, hbp: 0, sb: 3, cs: 0, sec: 'CF', fld: 86, arm: 66, rk: true },
      { id: 'perezti01', name: 'Timo Perez', pos: 'LF', bats: 'L', age: 32, pa: 96, h: 27, double: 6, triple: 1, hr: 1, bb: 6, so: 9, hbp: 0, sb: 1, cs: 1, sec: 'CF', fld: 65, arm: 81 },
    ],
    reserveBatters: [
      { id: 'santira01', name: 'Ramon Santiago', pos: 'SS', bats: 'S', age: 27, pa: 74, h: 17, double: 3, triple: 1, hr: 0, bb: 1, so: 11, hbp: 3, sb: 2, cs: 0, sec: '2B', fld: 69 },
      { id: 'perezne01', name: 'Neifi Perez', pos: 'SS', bats: 'S', age: 34, pa: 71, h: 16, double: 3, triple: 0, hr: 1, bb: 2, so: 6, hbp: 0, sb: 0, cs: 0, sec: '2B' },
      { id: 'hessmmi01', name: 'Mike Hessman', pos: '1B', bats: 'R', age: 29, pa: 57, h: 12, double: 0, triple: 0, hr: 4, bb: 5, so: 17, hbp: 0, sb: 0, cs: 0, sec: '3B', rk: true },
      { id: 'maybica01', name: 'Cameron Maybin', pos: 'LF', bats: 'R', age: 20, pa: 53, h: 7, double: 3, triple: 0, hr: 1, bb: 3, so: 21, hbp: 1, sb: 5, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'verlaju01', name: 'Justin Verlander', role: 'SP', throws: 'R', age: 24, g: 32, gs: 32, outs: 605, h: 189, hr: 21, bb: 66, so: 163, hbp: 14, er: 82, w: 18, l: 6, sv: 0, fld: 62 },
      { id: 'roberna01', name: 'Nate Robertson', role: 'SP', throws: 'L', age: 29, g: 30, gs: 30, outs: 533, h: 191, hr: 24, bb: 61, so: 118, hbp: 5, er: 88, w: 9, l: 13, sv: 0, fld: 67 },
      { id: 'bondeje01', name: 'Jeremy Bonderman', role: 'SP', throws: 'R', age: 24, g: 28, gs: 28, outs: 523, h: 186, hr: 19, bb: 51, so: 152, hbp: 3, er: 90, w: 11, l: 9, sv: 0, fld: 65 },
      { id: 'durbich01', name: 'Chad Durbin', role: 'SP', throws: 'R', age: 29, g: 36, gs: 19, outs: 383, h: 133, hr: 21, bb: 48, so: 66, hbp: 8, er: 66, w: 8, l: 7, sv: 1, fld: 67 },
      { id: 'marotmi01', name: 'Mike Maroth', role: 'SP', throws: 'L', age: 29, g: 27, gs: 20, outs: 349, h: 159, hr: 24, bb: 43, so: 58, hbp: 5, er: 78, w: 5, l: 7, sv: 0, fld: 75 },
      { id: 'jonesto02', name: 'Todd Jones', role: 'CL', throws: 'R', age: 39, g: 63, gs: 0, outs: 184, h: 64, hr: 3, bb: 17, so: 35, hbp: 1, er: 26, w: 1, l: 4, sv: 38, fld: 68 },
      { id: 'grillja01', name: 'Jason Grilli', role: 'RP', throws: 'R', age: 30, g: 57, gs: 0, outs: 239, h: 80, hr: 6, bb: 32, so: 53, hbp: 5, er: 40, w: 5, l: 3, sv: 0, fld: 75 },
      { id: 'ledezwi01', name: 'Wil Ledezma', role: 'RP', throws: 'L', age: 26, g: 44, gs: 1, outs: 178, h: 69, hr: 7, bb: 32, so: 44, hbp: 1, er: 35, w: 3, l: 3, sv: 0, fld: 70 },
      { id: 'minerza01', name: 'Zach Miner', role: 'RP', throws: 'R', age: 25, g: 34, gs: 1, outs: 161, h: 57, hr: 5, bb: 20, so: 34, hbp: 0, er: 24, w: 3, l: 4, sv: 0, fld: 59 },
      { id: 'rodnefe01', name: 'Fernando Rodney', role: 'RP', throws: 'R', age: 30, g: 48, gs: 0, outs: 152, h: 42, hr: 5, bb: 22, so: 50, hbp: 4, er: 21, w: 2, l: 6, sv: 1, fld: 62 },
      { id: 'seaybo01', name: 'Bobby Seay', role: 'RP', throws: 'L', age: 29, g: 58, gs: 0, outs: 139, h: 39, hr: 2, bb: 18, so: 37, hbp: 3, er: 17, w: 3, l: 0, sv: 1, fld: 53 },
    ],
    reservePitchers: [
      { id: 'millean01', name: 'Andrew Miller', role: 'SP', throws: 'L', age: 22, g: 13, gs: 13, outs: 192, h: 71, hr: 7, bb: 41, so: 54, hbp: 8, er: 40, w: 5, l: 5, sv: 0, fld: 64, rk: true },
      { id: 'rogerke01', name: 'Kenny Rogers', role: 'SP', throws: 'L', age: 42, g: 11, gs: 11, outs: 189, h: 64, hr: 7, bb: 20, so: 32, hbp: 2, er: 28, w: 3, l: 4, sv: 0, fld: 54 },
      { id: 'byrdati01', name: 'Tim Byrdak', role: 'RP', throws: 'L', age: 33, g: 39, gs: 0, outs: 135, h: 41, hr: 3, bb: 28, so: 45, hbp: 1, er: 20, w: 3, l: 0, sv: 1, fld: 81 },
      { id: 'zumayjo01', name: 'Joel Zumaya', role: 'RP', throws: 'R', age: 22, g: 28, gs: 0, outs: 101, h: 23, hr: 3, bb: 17, so: 35, hbp: 1, er: 11, w: 2, l: 3, sv: 1, fld: 79 },
      { id: 'mcbrima01', name: 'Macay McBride', role: 'RP', throws: 'L', age: 24, g: 38, gs: 0, outs: 98, h: 33, hr: 2, bb: 22, so: 31, hbp: 1, er: 16, w: 1, l: 1, sv: 0, fld: 80 },
    ],
  },
  // KCR (KCA 2007)
  {
    franchiseId: 'KCR',
    season: 2007,
    batters: [
      { id: 'buckjo01', name: 'John Buck', pos: 'C', bats: 'R', age: 26, pa: 399, h: 83, double: 19, triple: 0, hr: 14, bb: 30, so: 88, hbp: 8, sb: 0, cs: 1, sec: '1B', fld: 73, arm: 66 },
      { id: 'gloadro01', name: 'Ross Gload', pos: '1B', bats: 'L', age: 31, pa: 346, h: 94, double: 21, triple: 3, hr: 7, bb: 15, so: 38, hbp: 2, sb: 4, cs: 1, sec: 'LF', fld: 71 },
      { id: 'grudzma01', name: 'Mark Grudzielanek', pos: '2B', bats: 'R', age: 37, pa: 486, h: 136, double: 29, triple: 3, hr: 6, bb: 23, so: 61, hbp: 5, sb: 3, cs: 2, sec: 'SS', fld: 63 },
      { id: 'gordoal01', name: 'Alex Gordon', pos: '3B', bats: 'L', age: 23, pa: 600, h: 134, double: 36, triple: 4, hr: 15, bb: 41, so: 137, hbp: 13, sb: 14, cs: 4, sec: '1B', fld: 72, rk: true },
      { id: 'penato02', name: 'Tony Pena', pos: 'SS', bats: 'R', age: 26, pa: 536, h: 135, double: 25, triple: 7, hr: 3, bb: 11, so: 80, hbp: 4, sb: 5, cs: 6, sec: '2B', fld: 71, rk: true },
      { id: 'brownem01', name: 'Emil Brown', pos: 'LF', bats: 'R', age: 32, pa: 397, h: 98, double: 20, triple: 2, hr: 9, bb: 31, so: 68, hbp: 3, sb: 8, cs: 2, sec: 'RF', fld: 77, arm: 81 },
      { id: 'dejesda01', name: 'David DeJesus', pos: 'CF', bats: 'L', age: 27, pa: 703, h: 169, double: 36, triple: 9, hr: 9, bb: 60, so: 87, hbp: 19, sb: 9, cs: 4, sec: 'LF', fld: 71, arm: 63 },
      { id: 'teahema01', name: 'Mark Teahen', pos: 'RF', bats: 'L', age: 25, pa: 608, h: 153, double: 31, triple: 8, hr: 12, bb: 54, so: 125, hbp: 3, sb: 13, cs: 3, sec: 'LF', fld: 92, arm: 87 },
      { id: 'germaes01', name: 'Esteban German', pos: 'DH', bats: 'R', age: 29, pa: 405, h: 99, double: 18, triple: 6, hr: 4, bb: 45, so: 60, hbp: 6, sb: 11, cs: 6, sec: '3B', fld: 49 },
    ],
    bench: [
      { id: 'butlebi03', name: 'Billy Butler', pos: 'DH', bats: 'R', age: 21, pa: 360, h: 96, double: 23, triple: 2, hr: 8, bb: 27, so: 55, hbp: 2, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: 'DH', bats: 'R', age: 33, pa: 289, h: 71, double: 17, triple: 0, hr: 9, bb: 21, so: 37, hbp: 4, sb: 1, cs: 0, sec: '1B' },
      { id: 'gathrjo01', name: 'Joey Gathright', pos: 'LF', bats: 'L', age: 26, pa: 261, h: 62, double: 8, triple: 1, hr: 0, bb: 21, so: 41, hbp: 3, sb: 13, cs: 6, sec: 'CF', fld: 89, arm: 67 },
      { id: 'larueja01', name: 'Jason LaRue', pos: 'C', bats: 'R', age: 33, pa: 195, h: 32, double: 9, triple: 0, hr: 6, bb: 19, so: 53, hbp: 5, sb: 1, cs: 0, sec: '1B', fld: 70, arm: 78 },
      { id: 'shealry01', name: 'Ryan Shealy', pos: '1B', bats: 'R', age: 27, pa: 189, h: 44, double: 8, triple: 0, hr: 4, bb: 14, so: 49, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 76 },
    ],
    reserveBatters: [
      { id: 'smithja05', name: 'Jason Smith', pos: 'SS', bats: 'L', age: 29, pa: 149, h: 30, double: 2, triple: 2, hr: 6, bb: 7, so: 48, hbp: 2, sb: 2, cs: 0, sec: '2B', fld: 61 },
      { id: 'costash01', name: 'Shane Costa', pos: 'LF', bats: 'L', age: 25, pa: 109, h: 26, double: 7, triple: 1, hr: 1, bb: 4, so: 16, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 95, arm: 54 },
      { id: 'sandere02', name: 'Reggie Sanders', pos: 'LF', bats: 'R', age: 39, pa: 85, h: 20, double: 5, triple: 0, hr: 3, bb: 8, so: 19, hbp: 1, sb: 2, cs: 1, sec: 'RF' },
    ],
    pitchers: [
      { id: 'mechegi01', name: 'Gil Meche', role: 'SP', throws: 'R', age: 28, g: 34, gs: 34, outs: 648, h: 213, hr: 24, bb: 77, so: 157, hbp: 5, er: 97, w: 9, l: 13, sv: 0, fld: 64 },
      { id: 'bannibr01', name: 'Brian Bannister', role: 'SP', throws: 'R', age: 26, g: 27, gs: 27, outs: 495, h: 154, hr: 15, bb: 50, so: 77, hbp: 6, er: 71, w: 12, l: 9, sv: 0, fld: 74, rk: true },
      { id: 'perezod01', name: 'Odalis Perez', role: 'SP', throws: 'L', age: 29, g: 26, gs: 26, outs: 412, h: 178, hr: 16, bb: 43, so: 77, hbp: 3, er: 88, w: 8, l: 11, sv: 0, fld: 70 },
      { id: 'delarjo01', name: 'Jorge De La Rosa', role: 'SP', throws: 'L', age: 26, g: 26, gs: 23, outs: 390, h: 150, hr: 19, bb: 67, so: 92, hbp: 3, er: 84, w: 8, l: 12, sv: 0, fld: 67 },
      { id: 'greinza01', name: 'Zack Greinke', role: 'SP', throws: 'R', age: 23, g: 52, gs: 14, outs: 366, h: 130, hr: 13, bb: 35, so: 94, hbp: 5, er: 58, w: 7, l: 7, sv: 1, fld: 83 },
      { id: 'soriajo01', name: 'Joakim Soria', role: 'CL', throws: 'R', age: 23, g: 62, gs: 0, outs: 207, h: 46, hr: 3, bb: 19, so: 75, hbp: 1, er: 19, w: 2, l: 3, sv: 17, fld: 65, rk: true },
      { id: 'peraljo01', name: 'Joel Peralta', role: 'RP', throws: 'R', age: 31, g: 62, gs: 0, outs: 263, h: 90, hr: 10, bb: 21, so: 68, hbp: 2, er: 39, w: 1, l: 3, sv: 1, fld: 56 },
      { id: 'riskeda01', name: 'David Riske', role: 'RP', throws: 'R', age: 30, g: 65, gs: 0, outs: 209, h: 60, hr: 9, bb: 25, so: 49, hbp: 2, er: 23, w: 1, l: 4, sv: 4, fld: 61 },
      { id: 'gobblji01', name: 'Jimmy Gobble', role: 'RP', throws: 'L', age: 25, g: 74, gs: 0, outs: 161, h: 59, hr: 7, bb: 22, so: 49, hbp: 1, er: 26, w: 4, l: 1, sv: 1, fld: 70 },
      { id: 'duckwbr01', name: 'Brandon Duckworth', role: 'RP', throws: 'R', age: 31, g: 26, gs: 3, outs: 140, h: 55, hr: 3, bb: 23, so: 23, hbp: 2, er: 28, w: 3, l: 5, sv: 1, fld: 78 },
      { id: 'nunezle01', name: 'Juan Carlos Oviedo', role: 'RP', throws: 'R', age: 25, g: 13, gs: 6, outs: 131, h: 47, hr: 7, bb: 11, so: 31, hbp: 1, er: 23, w: 2, l: 4, sv: 0, fld: 78 },
    ],
    reservePitchers: [
      { id: 'balejo01', name: 'John Bale', role: 'RP', throws: 'L', age: 33, g: 26, gs: 0, outs: 120, h: 45, hr: 1, bb: 17, so: 42, hbp: 1, er: 18, w: 1, l: 1, sv: 0, fld: 69 },
      { id: 'braunry01', name: 'Ryan Braun', role: 'RP', throws: 'R', age: 26, g: 26, gs: 0, outs: 118, h: 47, hr: 5, bb: 20, so: 24, hbp: 0, er: 29, w: 2, l: 0, sv: 0, fld: 80, rk: true },
      { id: 'elartsc01', name: 'Scott Elarton', role: 'RP', throws: 'R', age: 31, g: 9, gs: 9, outs: 111, h: 46, hr: 9, bb: 17, so: 19, hbp: 2, er: 28, w: 2, l: 4, sv: 0, fld: 71 },
      { id: 'bucknbi02', name: 'Billy Buckner', role: 'RP', throws: 'R', age: 23, g: 7, gs: 5, outs: 102, h: 37, hr: 5, bb: 16, so: 17, hbp: 0, er: 20, w: 1, l: 2, sv: 0, fld: 76, rk: true },
      { id: 'doteloc01', name: 'Octavio Dotel', role: 'RP', throws: 'R', age: 33, g: 33, gs: 0, outs: 92, h: 31, hr: 4, bb: 16, so: 35, hbp: 3, er: 17, w: 2, l: 1, sv: 11, fld: 85 },
    ],
  },
  // MIN (MIN 2007)
  {
    franchiseId: 'MIN',
    season: 2007,
    batters: [
      { id: 'mauerjo01', name: 'Joe Mauer', pos: 'C', bats: 'L', age: 24, pa: 471, h: 128, double: 26, triple: 3, hr: 8, bb: 58, so: 48, hbp: 2, sb: 7, cs: 1, sec: '1B', fld: 78, arm: 94 },
      { id: 'morneju01', name: 'Justin Morneau', pos: '1B', bats: 'L', age: 26, pa: 668, h: 169, double: 33, triple: 3, hr: 32, bb: 59, so: 95, hbp: 5, sb: 2, cs: 2, sec: '3B', fld: 78 },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 31, pa: 615, h: 163, double: 19, triple: 5, hr: 2, bb: 56, so: 47, hbp: 1, sb: 20, cs: 8, sec: 'SS', fld: 58 },
      { id: 'puntoni01', name: 'Nick Punto', pos: '3B', bats: 'S', age: 29, pa: 536, h: 114, double: 20, triple: 5, hr: 2, bb: 51, so: 85, hbp: 0, sb: 16, cs: 6, sec: '2B', fld: 74 },
      { id: 'bartlja01', name: 'Jason Bartlett', pos: 'SS', bats: 'R', age: 27, pa: 570, h: 140, double: 22, triple: 5, hr: 5, bb: 45, so: 73, hbp: 11, sb: 20, cs: 4, sec: '2B', fld: 72 },
      { id: 'kubelja01', name: 'Jason Kubel', pos: 'LF', bats: 'L', age: 25, pa: 466, h: 112, double: 27, triple: 1, hr: 14, bb: 37, so: 82, hbp: 1, sb: 5, cs: 0, sec: 'RF', fld: 68, arm: 61 },
      { id: 'hunteto01', name: 'Torii Hunter', pos: 'CF', bats: 'R', age: 31, pa: 650, h: 168, double: 36, triple: 1, hr: 29, bb: 44, so: 106, hbp: 6, sb: 18, cs: 8, sec: 'LF', fld: 73, arm: 63 },
      { id: 'cuddymi01', name: 'Michael Cuddyer', pos: 'RF', bats: 'R', age: 28, pa: 623, h: 152, double: 33, triple: 5, hr: 19, bb: 62, so: 116, hbp: 8, sb: 5, cs: 1, sec: '1B', fld: 65, arm: 89 },
      { id: 'tynerja01', name: 'Jason Tyner', pos: 'DH', bats: 'L', age: 30, pa: 328, h: 90, double: 12, triple: 2, hr: 1, bb: 16, so: 26, hbp: 4, sb: 7, cs: 3, sec: 'LF', fld: 85, arm: 68 },
    ],
    bench: [
      { id: 'redmomi01', name: 'Mike Redmond', pos: 'C', bats: 'R', age: 36, pa: 298, h: 85, double: 15, triple: 0, hr: 1, bb: 14, so: 25, hbp: 5, sb: 0, cs: 0, fld: 84, arm: 83 },
      { id: 'cirilje01', name: 'Jeff Cirillo', pos: '3B', bats: 'R', age: 37, pa: 218, h: 55, double: 13, triple: 1, hr: 2, bb: 18, so: 22, hbp: 1, sb: 2, cs: 1, sec: '1B', fld: 86 },
      { id: 'casilal01', name: 'Alexi Casilla', pos: '2B', bats: 'S', age: 22, pa: 204, h: 42, double: 5, triple: 1, hr: 0, bb: 10, so: 29, hbp: 0, sb: 11, cs: 1, sec: 'SS', fld: 61, rk: true },
      { id: 'rodrilu01', name: 'Luis Rodriguez', pos: '3B', bats: 'S', age: 27, pa: 173, h: 36, double: 6, triple: 1, hr: 2, bb: 14, so: 17, hbp: 1, sb: 1, cs: 0, sec: '2B', fld: 70 },
      { id: 'fordle01', name: 'Lew Ford', pos: 'LF', bats: 'R', age: 30, pa: 130, h: 28, double: 5, triple: 1, hr: 2, bb: 10, so: 21, hbp: 3, sb: 3, cs: 1, sec: 'CF', fld: 58, arm: 63 },
    ],
    reserveBatters: [
      { id: 'whitero02', name: 'Rondell White', pos: 'DH', bats: 'R', age: 35, pa: 119, h: 28, double: 6, triple: 0, hr: 3, bb: 5, so: 17, hbp: 2, sb: 0, cs: 0, sec: 'LF' },
      { id: 'buschbr01', name: 'Brian Buscher', pos: '3B', bats: 'L', age: 26, pa: 94, h: 20, double: 1, triple: 0, hr: 2, bb: 10, so: 16, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 47, rk: true },
      { id: 'jonesga02', name: 'Garrett Jones', pos: 'DH', bats: 'L', age: 26, pa: 84, h: 16, double: 2, triple: 1, hr: 2, bb: 6, so: 20, hbp: 0, sb: 1, cs: 1, sec: '1B', rk: true },
      { id: 'heintch01', name: 'Chris Heintz', pos: 'C', bats: 'R', age: 32, pa: 61, h: 14, double: 1, triple: 0, hr: 0, bb: 3, so: 12, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 54, rk: true },
    ],
    pitchers: [
      { id: 'santajo01', name: 'Johan Santana', role: 'SP', throws: 'L', age: 28, g: 33, gs: 33, outs: 657, h: 180, hr: 28, bb: 48, so: 234, hbp: 3, er: 75, w: 15, l: 13, sv: 0, fld: 72 },
      { id: 'silvaca01', name: 'Carlos Silva', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 606, h: 240, hr: 28, bb: 31, so: 83, hbp: 5, er: 102, w: 13, l: 14, sv: 0, fld: 74 },
      { id: 'bonsebo01', name: 'Boof Bonser', role: 'SP', throws: 'R', age: 25, g: 31, gs: 30, outs: 519, h: 197, hr: 29, bb: 59, so: 141, hbp: 4, er: 95, w: 8, l: 12, sv: 0, fld: 62 },
      { id: 'bakersc02', name: 'Scott Baker', role: 'SP', throws: 'R', age: 25, g: 24, gs: 23, outs: 431, h: 166, hr: 18, bb: 29, so: 101, hbp: 5, er: 75, w: 9, l: 9, sv: 0, fld: 57 },
      { id: 'ortizra01', name: 'Ramon Ortiz', role: 'SP', throws: 'R', age: 34, g: 38, gs: 10, outs: 312, h: 124, hr: 17, bb: 29, so: 54, hbp: 7, er: 62, w: 5, l: 4, sv: 0, fld: 72 },
      { id: 'nathajo01', name: 'Joe Nathan', role: 'CL', throws: 'R', age: 32, g: 68, gs: 0, outs: 215, h: 49, hr: 4, bb: 19, so: 89, hbp: 1, er: 16, w: 4, l: 2, sv: 37, fld: 68 },
      { id: 'guerrma02', name: 'Matt Guerrier', role: 'RP', throws: 'R', age: 28, g: 73, gs: 0, outs: 264, h: 79, hr: 9, bb: 23, so: 58, hbp: 3, er: 27, w: 2, l: 4, sv: 1, fld: 67 },
      { id: 'neshepa01', name: 'Pat Neshek', role: 'RP', throws: 'R', age: 26, g: 74, gs: 0, outs: 211, h: 45, hr: 8, bb: 23, so: 82, hbp: 2, er: 22, w: 7, l: 2, sv: 0, fld: 90, rk: true },
      { id: 'rincoju01', name: 'Juan Rincon', role: 'RP', throws: 'R', age: 28, g: 63, gs: 0, outs: 179, h: 63, hr: 5, bb: 25, so: 55, hbp: 3, er: 26, w: 3, l: 3, sv: 0, fld: 72 },
      { id: 'ponsosi01', name: 'Sidney Ponson', role: 'RP', throws: 'R', age: 30, g: 7, gs: 7, outs: 113, h: 52, hr: 5, bb: 16, so: 22, hbp: 2, er: 28, w: 2, l: 5, sv: 0, fld: 67 },
      { id: 'reyesde01', name: 'Dennys Reyes', role: 'RP', throws: 'L', age: 30, g: 50, gs: 0, outs: 88, h: 31, hr: 2, bb: 17, so: 27, hbp: 1, er: 10, w: 2, l: 1, sv: 0, fld: 73 },
    ],
    reservePitchers: [
      { id: 'garzama01', name: 'Matt Garza', role: 'SP', throws: 'R', age: 23, g: 16, gs: 15, outs: 249, h: 97, hr: 9, bb: 34, so: 65, hbp: 3, er: 39, w: 5, l: 7, sv: 0, fld: 76 },
      { id: 'sloweke01', name: 'Kevin Slowey', role: 'SP', throws: 'R', age: 23, g: 13, gs: 11, outs: 200, h: 82, hr: 16, bb: 11, so: 47, hbp: 0, er: 35, w: 4, l: 1, sv: 0, fld: 78, rk: true },
      { id: 'perkigl01', name: 'Glen Perkins', role: 'RP', throws: 'L', age: 24, g: 19, gs: 0, outs: 86, h: 23, hr: 2, bb: 11, so: 22, hbp: 2, er: 10, w: 0, l: 0, sv: 0, fld: 66, rk: true },
      { id: 'calica01', name: 'Carmen Cali', role: 'RP', throws: 'L', age: 28, g: 24, gs: 0, outs: 63, h: 23, hr: 3, bb: 16, so: 14, hbp: 2, er: 12, w: 0, l: 1, sv: 0, fld: 63, rk: true },
      { id: 'depauju01', name: 'Julio De Paula', role: 'RP', throws: 'R', age: 24, g: 16, gs: 0, outs: 60, h: 30, hr: 5, bb: 10, so: 8, hbp: 3, er: 19, w: 0, l: 1, sv: 0, fld: 80, rk: true },
    ],
  },
  // HOU (HOU 2007)
  {
    franchiseId: 'HOU',
    season: 2007,
    batters: [
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 38, pa: 397, h: 82, double: 15, triple: 2, hr: 2, bb: 38, so: 62, hbp: 5, sb: 4, cs: 1, fld: 79, arm: 71 },
      { id: 'berkmla01', name: 'Lance Berkman', pos: '1B', bats: 'S', age: 31, pa: 668, h: 163, double: 28, triple: 1, hr: 37, bb: 98, so: 114, hbp: 6, sb: 5, cs: 2, sec: 'LF', fld: 80 },
      { id: 'biggicr01', name: 'Craig Biggio', pos: '2B', bats: 'R', age: 41, pa: 555, h: 128, double: 31, triple: 2, hr: 15, bb: 29, so: 93, hbp: 7, sb: 5, cs: 2, fld: 52 },
      { id: 'lambmi01', name: 'Mike Lamb', pos: '3B', bats: 'L', age: 31, pa: 353, h: 91, double: 16, triple: 3, hr: 11, bb: 31, so: 49, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 61 },
      { id: 'loretma01', name: 'Mark Loretta', pos: 'SS', bats: 'R', age: 35, pa: 511, h: 131, double: 23, triple: 1, hr: 4, bb: 41, so: 43, hbp: 6, sb: 3, cs: 2, sec: '2B', fld: 67 },
      { id: 'leeca01', name: 'Carlos Lee', pos: 'LF', bats: 'R', age: 31, pa: 697, h: 185, double: 41, triple: 1, hr: 34, bb: 56, so: 68, hbp: 3, sb: 14, cs: 4, sec: 'RF', fld: 56, arm: 69 },
      { id: 'pencehu01', name: 'Hunter Pence', pos: 'CF', bats: 'R', age: 24, pa: 484, h: 147, double: 30, triple: 9, hr: 17, bb: 26, so: 95, hbp: 1, sb: 11, cs: 5, sec: 'RF', fld: 70, arm: 69, rk: true },
      { id: 'scottlu01', name: 'Luke Scott', pos: 'RF', bats: 'L', age: 29, pa: 425, h: 101, double: 29, triple: 7, hr: 17, bb: 52, so: 90, hbp: 3, sb: 3, cs: 1, sec: 'LF', fld: 76, arm: 76 },
      { id: 'burkech01', name: 'Chris Burke', pos: 'DH', bats: 'R', age: 27, pa: 363, h: 80, double: 19, triple: 2, hr: 7, bb: 25, so: 59, hbp: 9, sb: 10, cs: 3, sec: 'LF', fld: 59 },
    ],
    bench: [
      { id: 'ensbemo01', name: 'Morgan Ensberg', pos: '3B', bats: 'R', age: 31, pa: 324, h: 66, double: 13, triple: 1, hr: 15, bb: 50, so: 64, hbp: 2, sb: 1, cs: 2, sec: '1B', fld: 67 },
      { id: 'everead01', name: 'Adam Everett', pos: 'SS', bats: 'R', age: 30, pa: 236, h: 52, double: 11, triple: 2, hr: 3, bb: 13, so: 33, hbp: 2, sb: 5, cs: 2, sec: '2B', fld: 83 },
      { id: 'laneja01', name: 'Jason Lane', pos: 'CF', bats: 'R', age: 30, pa: 194, h: 36, double: 7, triple: 0, hr: 8, bb: 19, so: 37, hbp: 2, sb: 1, cs: 1, sec: 'RF', fld: 81, arm: 66 },
      { id: 'brunter01', name: 'Eric Bruntlett', pos: 'SS', bats: 'R', age: 29, pa: 165, h: 36, double: 7, triple: 0, hr: 1, bb: 18, so: 28, hbp: 1, sb: 6, cs: 2, sec: '2B', fld: 64 },
      { id: 'munsoer01', name: 'Eric Munson', pos: 'C', bats: 'L', age: 29, pa: 150, h: 29, double: 5, triple: 0, hr: 4, bb: 14, so: 21, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 57 },
    ],
    reserveBatters: [
      { id: 'palmeor01', name: 'Orlando Palmeiro', pos: 'RF', bats: 'L', age: 38, pa: 122, h: 27, double: 5, triple: 1, hr: 0, bb: 11, so: 12, hbp: 1, sb: 0, cs: 1, sec: 'LF' },
      { id: 'anderjo03', name: 'Josh Anderson', pos: 'CF', bats: 'L', age: 24, pa: 75, h: 24, double: 3, triple: 0, hr: 0, bb: 5, so: 6, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 40, arm: 54, rk: true },
      { id: 'quinthu01', name: 'Humberto Quintero', pos: 'C', bats: 'R', age: 27, pa: 57, h: 13, double: 2, triple: 0, hr: 0, bb: 2, so: 12, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 65, arm: 81 },
      { id: 'ransoco01', name: 'Cody Ransom', pos: 'SS', bats: 'R', age: 31, pa: 46, h: 8, double: 2, triple: 0, hr: 1, bb: 9, so: 9, hbp: 2, sb: 0, cs: 0, sec: '2B', rk: true },
      { id: 'towlejr01', name: 'J. R. Towles', pos: 'C', bats: 'R', age: 23, pa: 44, h: 15, double: 5, triple: 0, hr: 1, bb: 3, so: 1, hbp: 1, sb: 0, cs: 1, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'oswalro01', name: 'Roy Oswalt', role: 'SP', throws: 'R', age: 29, g: 33, gs: 32, outs: 636, h: 220, hr: 16, bb: 50, so: 160, hbp: 7, er: 74, w: 14, l: 7, sv: 0, fld: 83 },
      { id: 'williwo02', name: 'Woody Williams', role: 'SP', throws: 'R', age: 40, g: 33, gs: 31, outs: 564, h: 211, hr: 32, bb: 53, so: 104, hbp: 10, er: 100, w: 8, l: 15, sv: 0, fld: 82 },
      { id: 'rodriwa01', name: 'Wandy Rodriguez', role: 'SP', throws: 'L', age: 28, g: 31, gs: 31, outs: 548, h: 184, hr: 22, bb: 69, so: 141, hbp: 7, er: 99, w: 9, l: 13, sv: 0, fld: 72 },
      { id: 'sampsch01', name: 'Chris Sampson', role: 'SP', throws: 'R', age: 29, g: 24, gs: 19, outs: 365, h: 133, hr: 19, bb: 29, so: 52, hbp: 7, er: 58, w: 7, l: 8, sv: 0, fld: 60, rk: true },
      { id: 'alberma01', name: 'Matt Albers', role: 'SP', throws: 'R', age: 24, g: 31, gs: 18, outs: 332, h: 127, hr: 17, bb: 50, so: 72, hbp: 6, er: 72, w: 4, l: 11, sv: 0, fld: 69, rk: true },
      { id: 'lidgebr01', name: 'Brad Lidge', role: 'CL', throws: 'R', age: 30, g: 66, gs: 0, outs: 201, h: 56, hr: 8, bb: 29, so: 91, hbp: 4, er: 29, w: 5, l: 3, sv: 19, fld: 76 },
      { id: 'quallch01', name: 'Chad Qualls', role: 'RP', throws: 'R', age: 28, g: 79, gs: 0, outs: 248, h: 79, hr: 9, bb: 26, so: 67, hbp: 4, er: 31, w: 6, l: 5, sv: 5, fld: 61 },
      { id: 'wheelda01', name: 'Dan Wheeler', role: 'RP', throws: 'R', age: 29, g: 70, gs: 0, outs: 224, h: 68, hr: 9, bb: 24, so: 78, hbp: 3, er: 33, w: 1, l: 9, sv: 11, fld: 62 },
      { id: 'borkoda01', name: 'Dave Borkowski', role: 'RP', throws: 'R', age: 30, g: 64, gs: 0, outs: 215, h: 76, hr: 8, bb: 30, so: 60, hbp: 2, er: 41, w: 5, l: 3, sv: 1, fld: 82 },
      { id: 'moehlbr01', name: 'Brian Moehler', role: 'RP', throws: 'R', age: 35, g: 42, gs: 0, outs: 179, h: 72, hr: 8, bb: 17, so: 32, hbp: 1, er: 34, w: 1, l: 4, sv: 1, fld: 58 },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 34, g: 76, gs: 0, outs: 139, h: 44, hr: 6, bb: 21, so: 47, hbp: 4, er: 21, w: 0, l: 0, sv: 1, fld: 67 },
    ],
    reservePitchers: [
      { id: 'jennija01', name: 'Jason Jennings', role: 'SP', throws: 'R', age: 28, g: 19, gs: 18, outs: 297, h: 108, hr: 12, bb: 40, so: 68, hbp: 2, er: 55, w: 2, l: 9, sv: 0, fld: 54 },
      { id: 'mclemma02', name: 'Mark McLemore', role: 'RP', throws: 'L', age: 26, g: 29, gs: 0, outs: 105, h: 38, hr: 5, bb: 18, so: 35, hbp: 1, er: 15, w: 3, l: 0, sv: 0, fld: 93, rk: true },
      { id: 'whiteri01', name: 'Rick White', role: 'RP', throws: 'R', age: 38, g: 29, gs: 0, outs: 104, h: 44, hr: 4, bb: 15, so: 21, hbp: 1, er: 23, w: 1, l: 1, sv: 0, fld: 74 },
      { id: 'backebr01', name: 'Brandon Backe', role: 'RP', throws: 'R', age: 29, g: 5, gs: 5, outs: 86, h: 28, hr: 3, bb: 12, so: 15, hbp: 1, er: 13, w: 3, l: 1, sv: 0, fld: 64 },
      { id: 'gutieju01', name: 'J. C. Gutierrez', role: 'RP', throws: 'R', age: 23, g: 7, gs: 3, outs: 64, h: 25, hr: 3, bb: 6, so: 16, hbp: 0, er: 14, w: 1, l: 1, sv: 0, fld: 71, rk: true },
    ],
  },
  // LAA (LAA 2007)
  {
    franchiseId: 'LAA',
    season: 2007,
    batters: [
      { id: 'napolmi01', name: 'Mike Napoli', pos: 'C', bats: 'R', age: 25, pa: 263, h: 52, double: 11, triple: 1, hr: 11, bb: 37, so: 67, hbp: 5, sb: 3, cs: 2, sec: '1B', fld: 73, arm: 68 },
      { id: 'kotchca01', name: 'Casey Kotchman', pos: '1B', bats: 'L', age: 24, pa: 508, h: 125, double: 33, triple: 2, hr: 12, bb: 52, so: 48, hbp: 3, sb: 2, cs: 4, sec: '3B', fld: 72 },
      { id: 'kendrho01', name: 'Howie Kendrick', pos: '2B', bats: 'R', age: 23, pa: 353, h: 104, double: 25, triple: 2, hr: 5, bb: 10, so: 59, hbp: 4, sb: 6, cs: 3, sec: 'SS', fld: 65 },
      { id: 'figgich01', name: 'Chone Figgins', pos: '3B', bats: 'S', age: 29, pa: 503, h: 132, double: 20, triple: 6, hr: 5, bb: 49, so: 76, hbp: 1, sb: 40, cs: 12, sec: '2B', fld: 55 },
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 32, pa: 701, h: 183, double: 39, triple: 1, hr: 9, bb: 47, so: 62, hbp: 4, sb: 23, cs: 3, sec: '2B', fld: 73 },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'LF', bats: 'L', age: 35, pa: 450, h: 121, double: 26, triple: 1, hr: 14, bb: 26, so: 63, hbp: 0, sb: 1, cs: 0, sec: 'CF', fld: 60, arm: 78 },
      { id: 'matthga02', name: 'Gary Matthews', pos: 'CF', bats: 'S', age: 32, pa: 579, h: 143, double: 30, triple: 4, hr: 17, bb: 52, so: 94, hbp: 2, sb: 13, cs: 4, sec: 'RF', fld: 75, arm: 69 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'RF', bats: 'R', age: 32, pa: 660, h: 190, double: 39, triple: 1, hr: 30, bb: 63, so: 63, hbp: 7, sb: 8, cs: 3, sec: 'LF', fld: 60, arm: 68 },
      { id: 'willire03', name: 'Reggie Willits', pos: 'DH', bats: 'S', age: 26, pa: 518, h: 125, double: 19, triple: 1, hr: 0, bb: 71, so: 83, hbp: 3, sb: 28, cs: 9, sec: 'LF', fld: 85, arm: 70, rk: true },
    ],
    bench: [
      { id: 'izturma01', name: 'Maicer Izturis', pos: '3B', bats: 'S', age: 26, pa: 374, h: 96, double: 18, triple: 3, hr: 5, bb: 34, so: 37, hbp: 1, sb: 10, cs: 3, sec: 'SS', fld: 59 },
      { id: 'hillesh02', name: 'Shea Hillenbrand', pos: 'DH', bats: 'R', age: 31, pa: 278, h: 71, double: 11, triple: 1, hr: 8, bb: 9, so: 35, hbp: 5, sb: 1, cs: 1, sec: '3B' },
      { id: 'aybarer01', name: 'Erick Aybar', pos: '2B', bats: 'S', age: 23, pa: 211, h: 47, double: 5, triple: 1, hr: 1, bb: 9, so: 33, hbp: 2, sb: 4, cs: 4, sec: 'SS', fld: 61, rk: true },
      { id: 'molinjo01', name: 'Jose Molina', pos: 'C', bats: 'R', age: 32, pa: 202, h: 46, double: 12, triple: 0, hr: 3, bb: 7, so: 42, hbp: 1, sb: 2, cs: 0, sec: '1B', fld: 70, arm: 73 },
      { id: 'mathije01', name: 'Jeff Mathis', pos: 'C', bats: 'R', age: 24, pa: 195, h: 34, double: 11, triple: 0, hr: 4, bb: 16, so: 48, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 67, arm: 62, rk: true },
    ],
    reserveBatters: [
      { id: 'quinlro01', name: 'Robb Quinlan', pos: '1B', bats: 'R', age: 30, pa: 194, h: 50, double: 9, triple: 0, hr: 5, bb: 10, so: 26, hbp: 1, sb: 2, cs: 1, sec: '3B', fld: 72 },
      { id: 'moralke01', name: 'Kendrys Morales', pos: '1B', bats: 'S', age: 24, pa: 126, h: 31, double: 8, triple: 0, hr: 3, bb: 8, so: 19, hbp: 0, sb: 0, cs: 1, sec: '3B' },
      { id: 'haynena01', name: 'Nathan Haynes', pos: 'RF', bats: 'L', age: 27, pa: 48, h: 12, double: 0, triple: 1, hr: 0, bb: 3, so: 11, hbp: 0, sb: 1, cs: 2, sec: 'CF', rk: true },
      { id: 'riverju01', name: 'Juan Rivera', pos: 'RF', bats: 'R', age: 28, pa: 44, h: 12, double: 2, triple: 0, hr: 2, bb: 3, so: 5, hbp: 0, sb: 0, cs: 1, sec: 'LF' },
    ],
    pitchers: [
      { id: 'lackejo01', name: 'John Lackey', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 672, h: 215, hr: 16, bb: 63, so: 188, hbp: 11, er: 81, w: 19, l: 9, sv: 0, fld: 72 },
      { id: 'escobke01', name: 'Kelvim Escobar', role: 'SP', throws: 'R', age: 31, g: 30, gs: 30, outs: 587, h: 186, hr: 14, bb: 61, so: 160, hbp: 4, er: 75, w: 18, l: 7, sv: 0, fld: 63 },
      { id: 'weaveje02', name: 'Jered Weaver', role: 'SP', throws: 'R', age: 24, g: 28, gs: 28, outs: 483, h: 164, hr: 18, bb: 46, so: 126, hbp: 3, er: 63, w: 13, l: 7, sv: 0, fld: 64 },
      { id: 'santaer01', name: 'Ervin Santana', role: 'SP', throws: 'R', age: 24, g: 28, gs: 26, outs: 450, h: 160, hr: 21, bb: 56, so: 119, hbp: 8, er: 86, w: 7, l: 14, sv: 0, fld: 63 },
      { id: 'saundjo01', name: 'Joe Saunders', role: 'SP', throws: 'L', age: 26, g: 18, gs: 18, outs: 322, h: 123, hr: 11, bb: 37, so: 72, hbp: 1, er: 55, w: 8, l: 5, sv: 0, fld: 75 },
      { id: 'rodrifr03', name: 'Francisco Rodriguez', role: 'CL', throws: 'R', age: 25, g: 64, gs: 0, outs: 202, h: 49, hr: 5, bb: 31, so: 92, hbp: 1, er: 18, w: 5, l: 2, sv: 40, fld: 66 },
      { id: 'moseldu01', name: 'Dustin Moseley', role: 'RP', throws: 'R', age: 25, g: 46, gs: 8, outs: 276, h: 102, hr: 8, bb: 26, so: 48, hbp: 3, er: 48, w: 4, l: 3, sv: 0, fld: 66, rk: true },
      { id: 'bootcch01', name: 'Chris Bootcheck', role: 'RP', throws: 'R', age: 28, g: 51, gs: 0, outs: 232, h: 83, hr: 8, bb: 26, so: 53, hbp: 4, er: 43, w: 3, l: 3, sv: 0, fld: 78, rk: true },
      { id: 'shielsc01', name: 'Scot Shields', role: 'RP', throws: 'R', age: 31, g: 71, gs: 0, outs: 231, h: 62, hr: 7, bb: 29, so: 79, hbp: 3, er: 29, w: 4, l: 5, sv: 2, fld: 80 },
      { id: 'oliveda02', name: 'Darren Oliver', role: 'RP', throws: 'L', age: 36, g: 61, gs: 0, outs: 193, h: 58, hr: 8, bb: 20, so: 50, hbp: 2, er: 26, w: 3, l: 1, sv: 0, fld: 59 },
      { id: 'speieju01', name: 'Justin Speier', role: 'RP', throws: 'R', age: 33, g: 51, gs: 0, outs: 150, h: 38, hr: 6, bb: 14, so: 47, hbp: 3, er: 15, w: 2, l: 3, sv: 0, fld: 75 },
    ],
    reservePitchers: [
      { id: 'colonba01', name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 34, g: 19, gs: 18, outs: 298, h: 124, hr: 15, bb: 25, so: 73, hbp: 4, er: 59, w: 6, l: 8, sv: 0, fld: 65 },
      { id: 'carrahe01', name: 'Hector Carrasco', role: 'RP', throws: 'R', age: 37, g: 29, gs: 1, outs: 115, h: 39, hr: 5, bb: 17, so: 33, hbp: 2, er: 19, w: 2, l: 1, sv: 0, fld: 59 },
    ],
  },
  // OAK (OAK 2007)
  {
    franchiseId: 'OAK',
    season: 2007,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 33, pa: 514, h: 123, double: 20, triple: 1, hr: 2, bb: 37, so: 40, hbp: 11, sb: 6, cs: 4, sec: '1B', fld: 67, arm: 61 },
      { id: 'johnsda06', name: 'Dan Johnson', pos: '1B', bats: 'L', age: 27, pa: 495, h: 102, double: 21, triple: 1, hr: 17, bb: 66, so: 72, hbp: 2, sb: 0, cs: 0, sec: '3B', fld: 62 },
      { id: 'ellisma01', name: 'Mark Ellis', pos: '2B', bats: 'R', age: 30, pa: 642, h: 158, double: 32, triple: 3, hr: 17, bb: 48, so: 91, hbp: 9, sb: 7, cs: 3, sec: 'SS', fld: 91 },
      { id: 'chaveer01', name: 'Eric Chavez', pos: '3B', bats: 'L', age: 29, pa: 379, h: 82, double: 19, triple: 1, hr: 15, bb: 42, so: 71, hbp: 1, sb: 3, cs: 1, sec: '1B', fld: 75 },
      { id: 'scutama01', name: 'Marco Scutaro', pos: 'SS', bats: 'R', age: 31, pa: 379, h: 87, double: 16, triple: 2, hr: 6, bb: 38, so: 47, hbp: 1, sb: 3, cs: 1, sec: '2B', fld: 61 },
      { id: 'stewash01', name: 'Shannon Stewart', pos: 'LF', bats: 'R', age: 33, pa: 630, h: 166, double: 23, triple: 2, hr: 11, bb: 45, so: 64, hbp: 4, sb: 10, cs: 4, sec: 'CF', fld: 74, arm: 63 },
      { id: 'swishni01', name: 'Nick Swisher', pos: 'CF', bats: 'S', age: 26, pa: 659, h: 140, double: 32, triple: 1, hr: 27, bb: 94, so: 138, hbp: 10, sb: 2, cs: 2, sec: 'RF', fld: 66, arm: 62 },
      { id: 'bucktr01', name: 'Travis Buck', pos: 'RF', bats: 'L', age: 23, pa: 334, h: 82, double: 22, triple: 5, hr: 7, bb: 39, so: 66, hbp: 4, sb: 4, cs: 1, sec: 'LF', fld: 69, arm: 66, rk: true },
      { id: 'custja01', name: 'Jack Cust', pos: 'DH', bats: 'L', age: 28, pa: 507, h: 101, double: 18, triple: 1, hr: 26, bb: 105, so: 164, hbp: 1, sb: 0, cs: 2, sec: 'RF' },
    ],
    bench: [
      { id: 'crosbbo01', name: 'Bobby Crosby', pos: 'SS', bats: 'R', age: 27, pa: 374, h: 81, double: 16, triple: 1, hr: 8, bb: 29, so: 64, hbp: 1, sb: 8, cs: 1, sec: '2B', fld: 71 },
      { id: 'piazzmi01', name: 'Mike Piazza', pos: 'DH', bats: 'R', age: 38, pa: 329, h: 83, double: 16, triple: 1, hr: 12, bb: 23, so: 54, hbp: 1, sb: 0, cs: 0, sec: 'C' },
      { id: 'suzukku01', name: 'Kurt Suzuki', pos: 'C', bats: 'R', age: 23, pa: 248, h: 53, double: 13, triple: 0, hr: 7, bb: 24, so: 39, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 69, arm: 65, rk: true },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: 'CF', bats: 'L', age: 31, pa: 226, h: 53, double: 13, triple: 1, hr: 3, bb: 17, so: 21, hbp: 0, sb: 2, cs: 1, sec: 'RF', fld: 71, arm: 79 },
      { id: 'hannaja01', name: 'Jack Hannahan', pos: '3B', bats: 'L', age: 27, pa: 169, h: 38, double: 12, triple: 0, hr: 3, bb: 21, so: 38, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 64, rk: true },
    ],
    reserveBatters: [
      { id: 'murphdo01', name: 'Donnie Murphy', pos: 'SS', bats: 'R', age: 24, pa: 132, h: 25, double: 8, triple: 0, hr: 5, bb: 11, so: 35, hbp: 2, sb: 1, cs: 0, sec: '2B', fld: 62, rk: true },
      { id: 'davanje02', name: 'Jeff DaVanon', pos: 'CF', bats: 'S', age: 33, pa: 104, h: 23, double: 4, triple: 1, hr: 1, bb: 13, so: 20, hbp: 0, sb: 3, cs: 2, sec: 'RF', fld: 51, arm: 66 },
      { id: 'bartoda02', name: 'Daric Barton', pos: '1B', bats: 'L', age: 21, pa: 84, h: 25, double: 9, triple: 0, hr: 4, bb: 10, so: 11, hbp: 1, sb: 1, cs: 0, sec: '3B', fld: 66, rk: true },
      { id: 'walketo04', name: 'Todd Walker', pos: '1B', bats: 'L', age: 34, pa: 52, h: 13, double: 2, triple: 0, hr: 1, bb: 5, so: 4, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'blantjo01', name: 'Joe Blanton', role: 'SP', throws: 'R', age: 26, g: 34, gs: 34, outs: 690, h: 242, hr: 18, bb: 53, so: 132, hbp: 5, er: 104, w: 14, l: 10, sv: 0, fld: 72 },
      { id: 'harenda01', name: 'Dan Haren', role: 'SP', throws: 'R', age: 26, g: 34, gs: 34, outs: 668, h: 217, hr: 27, bb: 51, so: 182, hbp: 6, er: 87, w: 15, l: 9, sv: 0, fld: 61 },
      { id: 'gaudich01', name: 'Chad Gaudin', role: 'SP', throws: 'R', age: 24, g: 34, gs: 34, outs: 598, h: 201, hr: 20, bb: 105, so: 147, hbp: 7, er: 96, w: 11, l: 13, sv: 0, fld: 74 },
      { id: 'dinarle01', name: 'Lenny DiNardo', role: 'SP', throws: 'L', age: 27, g: 35, gs: 20, outs: 394, h: 143, hr: 14, bb: 51, so: 60, hbp: 3, er: 66, w: 8, l: 10, sv: 0, fld: 63 },
      { id: 'kennejo04', name: 'Joe Kennedy', role: 'SP', throws: 'L', age: 28, g: 39, gs: 16, outs: 332, h: 124, hr: 10, bb: 51, so: 62, hbp: 7, er: 59, w: 4, l: 9, sv: 0, fld: 76 },
      { id: 'embreal01', name: 'Alan Embree', role: 'CL', throws: 'L', age: 37, g: 68, gs: 0, outs: 204, h: 68, hr: 6, bb: 19, so: 56, hbp: 0, er: 32, w: 1, l: 2, sv: 17, fld: 79 },
      { id: 'garcija01', name: 'Santiago Casilla', role: 'RP', throws: 'R', age: 26, g: 46, gs: 0, outs: 152, h: 43, hr: 6, bb: 23, so: 51, hbp: 1, er: 26, w: 3, l: 1, sv: 2, fld: 73, rk: true },
      { id: 'streehu01', name: 'Huston Street', role: 'RP', throws: 'R', age: 23, g: 48, gs: 0, outs: 150, h: 38, hr: 3, bb: 12, so: 52, hbp: 1, er: 15, w: 5, l: 2, sv: 16, fld: 55 },
      { id: 'lugoru01', name: 'Ruddy Lugo', role: 'RP', throws: 'R', age: 27, g: 38, gs: 0, outs: 145, h: 47, hr: 3, bb: 30, so: 32, hbp: 3, er: 26, w: 6, l: 0, sv: 0, fld: 64 },
      { id: 'marshja01', name: 'Jay Marshall', role: 'RP', throws: 'L', age: 24, g: 51, gs: 0, outs: 126, h: 50, hr: 3, bb: 22, so: 18, hbp: 4, er: 30, w: 1, l: 2, sv: 0, fld: 77, rk: true },
      { id: 'brownan01', name: 'Andrew Brown', role: 'RP', throws: 'R', age: 26, g: 33, gs: 0, outs: 125, h: 36, hr: 1, bb: 19, so: 41, hbp: 3, er: 20, w: 3, l: 3, sv: 0, fld: 85, rk: true },
    ],
    reservePitchers: [
      { id: 'bradeda01', name: 'Dallas Braden', role: 'SP', throws: 'L', age: 23, g: 20, gs: 14, outs: 217, h: 91, hr: 9, bb: 26, so: 55, hbp: 2, er: 54, w: 1, l: 8, sv: 0, fld: 75, rk: true },
      { id: 'calerki01', name: 'Kiko Calero', role: 'RP', throws: 'R', age: 32, g: 46, gs: 0, outs: 122, h: 42, hr: 3, bb: 19, so: 41, hbp: 1, er: 21, w: 1, l: 5, sv: 1, fld: 67 },
      { id: 'lewisco01', name: 'Colby Lewis', role: 'RP', throws: 'R', age: 27, g: 26, gs: 1, outs: 113, h: 46, hr: 7, bb: 14, so: 25, hbp: 3, er: 26, w: 0, l: 2, sv: 0, fld: 54 },
      { id: 'harderi01', name: 'Rich Harden', role: 'RP', throws: 'R', age: 25, g: 7, gs: 4, outs: 77, h: 18, hr: 2, bb: 11, so: 26, hbp: 0, er: 9, w: 1, l: 2, sv: 0, fld: 84 },
      { id: 'florero01', name: 'Ron Flores', role: 'RP', throws: 'L', age: 27, g: 17, gs: 0, outs: 53, h: 17, hr: 2, bb: 9, so: 14, hbp: 0, er: 7, w: 0, l: 2, sv: 0, fld: 72, rk: true },
    ],
  },
  // SEA (SEA 2007)
  {
    franchiseId: 'SEA',
    season: 2007,
    batters: [
      { id: 'johjike01', name: 'Kenji Johjima', pos: 'C', bats: 'R', age: 31, pa: 513, h: 139, double: 27, triple: 0, hr: 15, bb: 17, so: 42, hbp: 12, sb: 1, cs: 2, sec: '1B', fld: 78, arm: 88 },
      { id: 'sexsori01', name: 'Richie Sexson', pos: '1B', bats: 'R', age: 32, pa: 491, h: 103, double: 25, triple: 0, hr: 24, bb: 53, so: 110, hbp: 4, sb: 1, cs: 0, sec: 'LF', fld: 76 },
      { id: 'lopezjo01', name: 'Jose Lopez', pos: '2B', bats: 'R', age: 23, pa: 561, h: 137, double: 22, triple: 4, hr: 10, bb: 21, so: 66, hbp: 6, sb: 4, cs: 3, sec: 'SS', fld: 81 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 28, pa: 639, h: 159, double: 39, triple: 2, hr: 24, bb: 40, so: 107, hbp: 5, sb: 11, cs: 3, sec: '1B', fld: 76 },
      { id: 'betanyu01', name: 'Yuniesky Betancourt', pos: 'SS', bats: 'R', age: 25, pa: 559, h: 153, double: 33, triple: 4, hr: 8, bb: 16, so: 50, hbp: 1, sb: 7, cs: 6, sec: '2B', fld: 75 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: 'LF', bats: 'L', age: 35, pa: 636, h: 165, double: 32, triple: 4, hr: 24, bb: 57, so: 99, hbp: 2, sb: 2, cs: 2, sec: 'RF', fld: 57, arm: 77 },
      { id: 'suzukic01', name: 'Ichiro Suzuki', pos: 'CF', bats: 'L', age: 33, pa: 736, h: 226, double: 21, triple: 8, hr: 8, bb: 48, so: 73, hbp: 4, sb: 39, cs: 6, sec: 'RF', fld: 81, arm: 68 },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'RF', bats: 'R', age: 31, pa: 658, h: 164, double: 31, triple: 2, hr: 23, bb: 39, so: 116, hbp: 19, sb: 4, cs: 1, sec: 'LF', fld: 59, arm: 71 },
      { id: 'vidrojo01', name: 'Jose Vidro', pos: 'DH', bats: 'S', age: 32, pa: 625, h: 167, double: 29, triple: 1, hr: 8, bb: 58, so: 57, hbp: 2, sb: 0, cs: 0, sec: '3B' },
    ],
    bench: [
      { id: 'brousbe01', name: 'Ben Broussard', pos: '1B', bats: 'L', age: 30, pa: 264, h: 67, double: 12, triple: 1, hr: 10, bb: 16, so: 54, hbp: 3, sb: 1, cs: 0, sec: 'LF', fld: 67 },
      { id: 'bloomwi01', name: 'Willie Bloomquist', pos: '2B', bats: 'R', age: 29, pa: 188, h: 45, double: 5, triple: 1, hr: 1, bb: 12, so: 30, hbp: 2, sb: 9, cs: 3, sec: '3B', fld: 40 },
      { id: 'burkeja02', name: 'Jamie Burke', pos: 'C', bats: 'R', age: 35, pa: 129, h: 34, double: 8, triple: 0, hr: 1, bb: 7, so: 17, hbp: 4, sb: 0, cs: 1, fld: 72, arm: 63 },
      { id: 'jonesad01', name: 'Adam Jones', pos: 'LF', bats: 'R', age: 21, pa: 71, h: 16, double: 3, triple: 1, hr: 2, bb: 3, so: 21, hbp: 1, sb: 2, cs: 1, sec: 'CF', fld: 57, arm: 82, rk: true },
      { id: 'morsemi01', name: 'Mike Morse', pos: '1B', bats: 'R', age: 25, pa: 20, h: 6, double: 1, triple: 0, hr: 0, bb: 1, so: 4, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'washbja01', name: 'Jarrod Washburn', role: 'SP', throws: 'L', age: 32, g: 32, gs: 32, outs: 581, h: 203, hr: 24, bb: 62, so: 110, hbp: 8, er: 92, w: 10, l: 15, sv: 0, fld: 66 },
      { id: 'batismi01', name: 'Miguel Batista', role: 'SP', throws: 'R', age: 36, g: 33, gs: 32, outs: 579, h: 212, hr: 18, bb: 82, so: 122, hbp: 7, er: 94, w: 16, l: 11, sv: 0, fld: 72 },
      { id: 'hernafe02', name: 'Felix Hernandez', role: 'SP', throws: 'R', age: 21, g: 30, gs: 30, outs: 571, h: 200, hr: 21, bb: 56, so: 171, hbp: 4, er: 86, w: 14, l: 7, sv: 0, fld: 71 },
      { id: 'weaveje01', name: 'Jeff Weaver', role: 'SP', throws: 'R', age: 30, g: 27, gs: 27, outs: 440, h: 180, hr: 25, bb: 36, so: 90, hbp: 9, er: 93, w: 7, l: 13, sv: 0, fld: 57 },
      { id: 'ramirho01', name: 'Horacio Ramirez', role: 'SP', throws: 'L', age: 27, g: 20, gs: 20, outs: 294, h: 127, hr: 13, bb: 40, so: 43, hbp: 3, er: 65, w: 8, l: 7, sv: 0, fld: 87 },
      { id: 'putzjj01', name: 'J. J. Putz', role: 'CL', throws: 'R', age: 30, g: 68, gs: 0, outs: 215, h: 46, hr: 5, bb: 14, so: 79, hbp: 2, er: 15, w: 6, l: 1, sv: 40, fld: 62 },
      { id: 'greense01', name: 'Sean Green', role: 'RP', throws: 'R', age: 28, g: 64, gs: 0, outs: 204, h: 76, hr: 3, bb: 33, so: 48, hbp: 3, er: 30, w: 5, l: 2, sv: 0, fld: 69, rk: true },
      { id: 'morrobr01', name: 'Brandon Morrow', role: 'RP', throws: 'R', age: 22, g: 60, gs: 0, outs: 190, h: 56, hr: 3, bb: 50, so: 66, hbp: 1, er: 29, w: 3, l: 4, sv: 0, fld: 70, rk: true },
      { id: 'oflaher01', name: 'Eric O\'Flaherty', role: 'RP', throws: 'L', age: 22, g: 56, gs: 0, outs: 157, h: 49, hr: 2, bb: 21, so: 34, hbp: 4, er: 25, w: 7, l: 1, sv: 0, fld: 77, rk: true },
      { id: 'feierry01', name: 'Ryan Feierabend', role: 'RP', throws: 'L', age: 21, g: 13, gs: 9, outs: 148, h: 69, hr: 10, bb: 23, so: 29, hbp: 3, er: 41, w: 1, l: 6, sv: 0, fld: 67, rk: true },
      { id: 'sherrge01', name: 'George Sherrill', role: 'RP', throws: 'L', age: 30, g: 73, gs: 0, outs: 137, h: 29, hr: 3, bb: 21, so: 51, hbp: 1, er: 16, w: 2, l: 0, sv: 3, fld: 61 },
    ],
    reservePitchers: [
      { id: 'baekch01', name: 'Cha-Seung Baek', role: 'SP', throws: 'R', age: 27, g: 14, gs: 12, outs: 220, h: 80, hr: 8, bb: 17, so: 50, hbp: 3, er: 40, w: 4, l: 3, sv: 0, fld: 63 },
      { id: 'rowlary01', name: 'Ryan Rowland-Smith', role: 'RP', throws: 'L', age: 24, g: 26, gs: 0, outs: 116, h: 39, hr: 4, bb: 15, so: 42, hbp: 2, er: 17, w: 1, l: 0, sv: 0, fld: 84, rk: true },
      { id: 'davisja02', name: 'Jason Davis', role: 'RP', throws: 'R', age: 27, g: 24, gs: 0, outs: 111, h: 45, hr: 3, bb: 18, so: 24, hbp: 2, er: 20, w: 2, l: 0, sv: 0, fld: 72 },
      { id: 'whitese02', name: 'Sean White', role: 'RP', throws: 'R', age: 26, g: 15, gs: 0, outs: 106, h: 35, hr: 2, bb: 20, so: 16, hbp: 8, er: 22, w: 1, l: 1, sv: 0, fld: 73, rk: true },
      { id: 'reitsch01', name: 'Chris Reitsma', role: 'RP', throws: 'R', age: 29, g: 26, gs: 0, outs: 71, h: 35, hr: 3, bb: 7, so: 12, hbp: 1, er: 18, w: 0, l: 2, sv: 0, fld: 74 },
    ],
  },
  // TEX (TEX 2007)
  {
    franchiseId: 'TEX',
    season: 2007,
    batters: [
      { id: 'lairdge01', name: 'Gerald Laird', pos: 'C', bats: 'R', age: 27, pa: 448, h: 100, double: 23, triple: 3, hr: 10, bb: 27, so: 100, hbp: 2, sb: 6, cs: 2, sec: '1B', fld: 64, arm: 82 },
      { id: 'teixema01', name: 'Mark Teixeira', pos: '1B', bats: 'S', age: 27, pa: 575, h: 147, double: 34, triple: 2, hr: 29, bb: 69, so: 105, hbp: 6, sb: 1, cs: 0, sec: '3B', fld: 73 },
      { id: 'kinslia01', name: 'Ian Kinsler', pos: '2B', bats: 'R', age: 25, pa: 566, h: 133, double: 26, triple: 2, hr: 19, bb: 57, so: 81, hbp: 7, sb: 19, cs: 3, sec: 'SS', fld: 93 },
      { id: 'vazqura01', name: 'Ramon Vazquez', pos: '3B', bats: 'L', age: 30, pa: 345, h: 68, double: 13, triple: 2, hr: 7, bb: 28, so: 72, hbp: 2, sb: 1, cs: 0, sec: 'SS', fld: 77 },
      { id: 'youngmi02', name: 'Michael Young', pos: 'SS', bats: 'R', age: 30, pa: 692, h: 202, double: 41, triple: 2, hr: 13, bb: 47, so: 97, hbp: 3, sb: 9, cs: 3, sec: '2B', fld: 74 },
      { id: 'catalfr01', name: 'Frank Catalanotto', pos: 'LF', bats: 'L', age: 33, pa: 377, h: 94, double: 23, triple: 3, hr: 8, bb: 33, so: 34, hbp: 7, sb: 1, cs: 2, sec: '1B', fld: 65, arm: 65 },
      { id: 'loftoke01', name: 'Kenny Lofton', pos: 'CF', bats: 'L', age: 40, pa: 559, h: 150, double: 21, triple: 8, hr: 5, bb: 52, so: 50, hbp: 1, sb: 28, cs: 6, sec: 'LF', fld: 59, arm: 72 },
      { id: 'cruzne02', name: 'Nelson Cruz', pos: 'RF', bats: 'R', age: 26, pa: 332, h: 71, double: 13, triple: 2, hr: 10, bb: 21, so: 84, hbp: 2, sb: 2, cs: 3, sec: 'LF', fld: 68, arm: 74 },
      { id: 'sosasa01', name: 'Sammy Sosa', pos: 'DH', bats: 'R', age: 38, pa: 454, h: 101, double: 22, triple: 1, hr: 20, bb: 36, so: 107, hbp: 3, sb: 0, cs: 0, sec: 'RF' },
    ],
    bench: [
      { id: 'byrdma01', name: 'Marlon Byrd', pos: 'CF', bats: 'R', age: 29, pa: 454, h: 116, double: 18, triple: 6, hr: 9, bb: 33, so: 89, hbp: 6, sb: 6, cs: 3, sec: 'LF', fld: 56, arm: 77 },
      { id: 'wilkebr01', name: 'Brad Wilkerson', pos: '1B', bats: 'L', age: 30, pa: 389, h: 79, double: 19, triple: 2, hr: 15, bb: 44, so: 106, hbp: 2, sb: 4, cs: 3, sec: 'LF', fld: 59 },
      { id: 'saltaja01', name: 'Jarrod Saltalamacchia', pos: 'C', bats: 'S', age: 22, pa: 329, h: 82, double: 13, triple: 1, hr: 11, bb: 19, so: 75, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 63, rk: true },
      { id: 'blaloha01', name: 'Hank Blalock', pos: '3B', bats: 'L', age: 26, pa: 232, h: 57, double: 12, triple: 1, hr: 7, bb: 19, so: 38, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 54 },
      { id: 'bottsja01', name: 'Jason Botts', pos: 'LF', bats: 'S', age: 26, pa: 190, h: 40, double: 8, triple: 1, hr: 2, bb: 20, so: 60, hbp: 2, sb: 1, cs: 0, sec: 'RF', fld: 95, arm: 66, rk: true },
    ],
    reserveBatters: [
      { id: 'hairsje02', name: 'Jerry Hairston', pos: 'CF', bats: 'R', age: 31, pa: 184, h: 35, double: 8, triple: 1, hr: 2, bb: 12, so: 25, hbp: 3, sb: 4, cs: 2, sec: 'LF', fld: 69, arm: 84 },
      { id: 'metcatr01', name: 'Travis Metcalf', pos: '3B', bats: 'R', age: 24, pa: 181, h: 41, double: 12, triple: 1, hr: 5, bb: 13, so: 41, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 67, rk: true },
      { id: 'murphda07', name: 'David Murphy', pos: 'LF', bats: 'L', age: 25, pa: 112, h: 34, double: 11, triple: 2, hr: 2, bb: 8, so: 20, hbp: 0, sb: 0, cs: 0, sec: 'CF', fld: 79, arm: 93, rk: true },
      { id: 'diazvi01', name: 'Victor Diaz', pos: 'RF', bats: 'R', age: 25, pa: 108, h: 25, double: 5, triple: 0, hr: 6, bb: 5, so: 31, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 53, arm: 56 },
      { id: 'melhuad01', name: 'Adam Melhuse', pos: 'C', bats: 'S', age: 35, pa: 103, h: 21, double: 5, triple: 0, hr: 2, bb: 7, so: 26, hbp: 1, sb: 0, cs: 0, fld: 69, arm: 65 },
    ],
    pitchers: [
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 32, g: 31, gs: 31, outs: 518, h: 202, hr: 19, bb: 57, so: 131, hbp: 6, er: 91, w: 10, l: 14, sv: 0, fld: 48 },
      { id: 'loeka01', name: 'Kameron Loe', role: 'SP', throws: 'R', age: 25, g: 28, gs: 23, outs: 408, h: 164, hr: 14, bb: 51, so: 73, hbp: 3, er: 79, w: 6, l: 11, sv: 0, fld: 79 },
      { id: 'padilvi01', name: 'Vicente Padilla', role: 'SP', throws: 'R', age: 29, g: 23, gs: 23, outs: 361, h: 136, hr: 15, bb: 50, so: 86, hbp: 9, er: 69, w: 6, l: 10, sv: 0, fld: 70 },
      { id: 'mccarbr01', name: 'Brandon McCarthy', role: 'SP', throws: 'R', age: 23, g: 23, gs: 22, outs: 305, h: 106, hr: 14, bb: 44, so: 70, hbp: 2, er: 55, w: 5, l: 10, sv: 0, fld: 79 },
      { id: 'tejedro01', name: 'Rob Tejeda', role: 'SP', throws: 'R', age: 25, g: 19, gs: 19, outs: 286, h: 106, hr: 14, bb: 56, so: 68, hbp: 6, er: 59, w: 5, l: 9, sv: 0, fld: 73 },
      { id: 'gagneer01', name: 'Eric Gagne', role: 'CL', throws: 'R', age: 31, g: 54, gs: 0, outs: 156, h: 48, hr: 3, bb: 21, so: 55, hbp: 2, er: 21, w: 4, l: 2, sv: 16, fld: 79 },
      { id: 'benoijo01', name: 'Joaquin Benoit', role: 'RP', throws: 'R', age: 29, g: 70, gs: 0, outs: 246, h: 67, hr: 6, bb: 32, so: 83, hbp: 2, er: 33, w: 7, l: 4, sv: 6, fld: 74 },
      { id: 'wrighja01', name: 'Jamey Wright', role: 'RP', throws: 'R', age: 32, g: 20, gs: 9, outs: 231, h: 80, hr: 8, bb: 35, so: 40, hbp: 5, er: 40, w: 4, l: 5, sv: 0, fld: 85 },
      { id: 'wilsocj01', name: 'C. J. Wilson', role: 'RP', throws: 'L', age: 26, g: 66, gs: 0, outs: 205, h: 57, hr: 6, bb: 30, so: 60, hbp: 6, er: 29, w: 2, l: 1, sv: 12, fld: 69 },
      { id: 'eyrewi01', name: 'Willie Eyre', role: 'RP', throws: 'R', age: 28, g: 33, gs: 2, outs: 204, h: 80, hr: 8, bb: 29, so: 37, hbp: 3, er: 39, w: 4, l: 6, sv: 1, fld: 73 },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 36, g: 58, gs: 0, outs: 201, h: 58, hr: 6, bb: 34, so: 58, hbp: 1, er: 25, w: 3, l: 0, sv: 1, fld: 85 },
    ],
    reservePitchers: [
      { id: 'francfr01', name: 'Frank Francisco', role: 'RP', throws: 'R', age: 27, g: 59, gs: 0, outs: 178, h: 58, hr: 4, bb: 37, so: 49, hbp: 2, er: 30, w: 1, l: 1, sv: 0, fld: 72 },
      { id: 'woodmi01', name: 'Mike Wood', role: 'RP', throws: 'R', age: 27, g: 21, gs: 4, outs: 152, h: 65, hr: 8, bb: 18, so: 25, hbp: 4, er: 29, w: 3, l: 2, sv: 0, fld: 63 },
      { id: 'rheinjo01', name: 'John Rheinecker', role: 'RP', throws: 'L', age: 28, g: 23, gs: 7, outs: 151, h: 67, hr: 7, bb: 21, so: 30, hbp: 2, er: 31, w: 4, l: 3, sv: 0, fld: 89 },
      { id: 'littlwe01', name: 'Wes Littleton', role: 'RP', throws: 'R', age: 24, g: 35, gs: 0, outs: 144, h: 43, hr: 5, bb: 17, so: 24, hbp: 3, er: 19, w: 3, l: 2, sv: 2, fld: 75, rk: true },
      { id: 'feldmsc01', name: 'Scott Feldman', role: 'RP', throws: 'R', age: 24, g: 29, gs: 0, outs: 117, h: 45, hr: 3, bb: 23, so: 24, hbp: 3, er: 22, w: 1, l: 2, sv: 0, fld: 63 },
    ],
  },
  // ATL (ATL 2007)
  {
    franchiseId: 'ATL',
    season: 2007,
    batters: [
      { id: 'mccanbr01', name: 'Brian McCann', pos: 'C', bats: 'L', age: 23, pa: 552, h: 146, double: 37, triple: 0, hr: 21, bb: 40, so: 69, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 70, arm: 66 },
      { id: 'thormsc01', name: 'Scott Thorman', pos: '1B', bats: 'L', age: 25, pa: 307, h: 64, double: 20, triple: 0, hr: 11, bb: 13, so: 65, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 77 },
      { id: 'johnske05', name: 'Kelly Johnson', pos: '2B', bats: 'L', age: 25, pa: 608, h: 141, double: 25, triple: 9, hr: 16, bb: 78, so: 120, hbp: 4, sb: 8, cs: 5, sec: 'SS', fld: 64 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: '3B', bats: 'S', age: 35, pa: 600, h: 168, double: 40, triple: 3, hr: 30, bb: 83, so: 80, hbp: 0, sb: 6, cs: 1, sec: 'SS', fld: 66 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 30, pa: 543, h: 150, double: 31, triple: 2, hr: 11, bb: 47, so: 75, hbp: 2, sb: 11, cs: 3, sec: '2B', fld: 62 },
      { id: 'diazma02', name: 'Matt Diaz', pos: 'LF', bats: 'R', age: 29, pa: 384, h: 118, double: 20, triple: 2, hr: 10, bb: 15, so: 61, hbp: 6, sb: 4, cs: 2, sec: 'RF', fld: 70, arm: 69 },
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'CF', bats: 'R', age: 30, pa: 659, h: 137, double: 27, triple: 1, hr: 35, bb: 72, so: 129, hbp: 11, sb: 5, cs: 2, sec: 'RF', fld: 73, arm: 60 },
      { id: 'francje02', name: 'Jeff Francoeur', pos: 'RF', bats: 'R', age: 23, pa: 696, h: 182, double: 35, triple: 2, hr: 24, bb: 34, so: 132, hbp: 7, sb: 4, cs: 4, sec: 'LF', fld: 72, arm: 84 },
      { id: 'harriwi01', name: 'Willie Harris', pos: 'DH', bats: 'L', age: 29, pa: 391, h: 89, double: 18, triple: 7, hr: 2, bb: 39, so: 72, hbp: 4, sb: 20, cs: 12, sec: 'LF', fld: 71, arm: 68 },
    ],
    bench: [
      { id: 'escobyu01', name: 'Yunel Escobar', pos: 'SS', bats: 'R', age: 24, pa: 355, h: 104, double: 25, triple: 0, hr: 5, bb: 27, so: 44, hbp: 5, sb: 5, cs: 3, sec: '3B', fld: 65, rk: true },
      { id: 'woodwch01', name: 'Chris Woodward', pos: '3B', bats: 'R', age: 31, pa: 151, h: 30, double: 6, triple: 1, hr: 2, bb: 12, so: 32, hbp: 1, sb: 1, cs: 0, sec: 'SS' },
      { id: 'orrpe01', name: 'Pete Orr', pos: '3B', bats: 'L', age: 28, pa: 69, h: 16, double: 2, triple: 1, hr: 0, bb: 2, so: 12, hbp: 0, sb: 1, cs: 1, sec: '2B' },
      { id: 'wilsocr03', name: 'Craig Wilson', pos: '1B', bats: 'R', age: 30, pa: 69, h: 15, double: 3, triple: 0, hr: 2, bb: 6, so: 22, hbp: 2, sb: 0, cs: 0, sec: 'LF', fld: 70 },
      { id: 'pradoma01', name: 'Martin Prado', pos: '2B', bats: 'R', age: 23, pa: 62, h: 16, double: 2, triple: 0, hr: 0, bb: 4, so: 7, hbp: 0, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'hudsoti01', name: 'Tim Hudson', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 673, h: 224, hr: 17, bb: 64, so: 134, hbp: 9, er: 94, w: 16, l: 10, sv: 0, fld: 90 },
      { id: 'smoltjo01', name: 'John Smoltz', role: 'SP', throws: 'R', age: 40, g: 32, gs: 32, outs: 617, h: 195, hr: 19, bb: 48, so: 185, hbp: 5, er: 74, w: 14, l: 8, sv: 0, fld: 74 },
      { id: 'jamesch03', name: 'Chuck James', role: 'SP', throws: 'L', age: 25, g: 30, gs: 30, outs: 484, h: 156, hr: 30, bb: 60, so: 119, hbp: 3, er: 73, w: 11, l: 10, sv: 0, fld: 59 },
      { id: 'davieky01', name: 'Kyle Davies', role: 'SP', throws: 'R', age: 23, g: 28, gs: 28, outs: 408, h: 160, hr: 22, bb: 70, so: 99, hbp: 5, er: 95, w: 7, l: 15, sv: 0, fld: 65 },
      { id: 'carlybu01', name: 'Buddy Carlyle', role: 'SP', throws: 'R', age: 29, g: 22, gs: 20, outs: 321, h: 117, hr: 19, bb: 32, so: 75, hbp: 2, er: 64, w: 8, l: 7, sv: 0, fld: 59 },
      { id: 'wickmbo01', name: 'Bob Wickman', role: 'CL', throws: 'R', age: 38, g: 57, gs: 0, outs: 151, h: 53, hr: 4, bb: 18, so: 38, hbp: 2, er: 18, w: 3, l: 4, sv: 20, fld: 79 },
      { id: 'moylape01', name: 'Peter Moylan', role: 'RP', throws: 'R', age: 28, g: 80, gs: 0, outs: 270, h: 69, hr: 6, bb: 31, so: 64, hbp: 6, er: 21, w: 5, l: 3, sv: 1, fld: 59, rk: true },
      { id: 'villaos01', name: 'Oscar Villarreal', role: 'RP', throws: 'R', age: 25, g: 51, gs: 0, outs: 229, h: 76, hr: 8, bb: 28, so: 52, hbp: 4, er: 34, w: 2, l: 2, sv: 1, fld: 70 },
      { id: 'soriara01', name: 'Rafael Soriano', role: 'RP', throws: 'R', age: 27, g: 71, gs: 0, outs: 216, h: 48, hr: 10, bb: 18, so: 72, hbp: 2, er: 21, w: 3, l: 3, sv: 9, fld: 71 },
      { id: 'yatesty01', name: 'Tyler Yates', role: 'RP', throws: 'R', age: 29, g: 75, gs: 0, outs: 198, h: 61, hr: 7, bb: 34, so: 66, hbp: 2, er: 35, w: 2, l: 3, sv: 2, fld: 60 },
      { id: 'cormila01', name: 'Lance Cormier', role: 'RP', throws: 'R', age: 26, g: 10, gs: 9, outs: 137, h: 54, hr: 9, bb: 23, so: 29, hbp: 1, er: 29, w: 2, l: 6, sv: 0, fld: 68 },
    ],
    reservePitchers: [
      { id: 'reyesjo03', name: 'Jo-Jo Reyes', role: 'SP', throws: 'L', age: 22, g: 11, gs: 10, outs: 152, h: 55, hr: 9, bb: 30, so: 27, hbp: 1, er: 35, w: 2, l: 2, sv: 0, fld: 61, rk: true },
      { id: 'redmama01', name: 'Mark Redman', role: 'RP', throws: 'L', age: 33, g: 11, gs: 8, outs: 124, h: 53, hr: 5, bb: 16, so: 23, hbp: 2, er: 28, w: 2, l: 4, sv: 0, fld: 68 },
      { id: 'paronch01', name: 'Chad Paronto', role: 'RP', throws: 'R', age: 31, g: 41, gs: 0, outs: 121, h: 44, hr: 2, bb: 17, so: 22, hbp: 3, er: 16, w: 3, l: 1, sv: 1, fld: 74 },
      { id: 'acostma01', name: 'Manny Acosta', role: 'RP', throws: 'R', age: 26, g: 21, gs: 0, outs: 71, h: 13, hr: 2, bb: 14, so: 22, hbp: 0, er: 6, w: 1, l: 1, sv: 0, fld: 76, rk: true },
      { id: 'gonzami02', name: 'Mike Gonzalez', role: 'RP', throws: 'L', age: 29, g: 18, gs: 0, outs: 51, h: 13, hr: 0, bb: 9, so: 18, hbp: 0, er: 4, w: 2, l: 0, sv: 2, fld: 79 },
    ],
  },
  // MIA (FLO 2007)
  {
    franchiseId: 'MIA',
    season: 2007,
    batters: [
      { id: 'olivomi01', name: 'Miguel Olivo', pos: 'C', bats: 'R', age: 28, pa: 469, h: 109, double: 21, triple: 3, hr: 16, bb: 12, so: 119, hbp: 4, sb: 4, cs: 3, sec: '1B', fld: 59, arm: 76 },
      { id: 'jacobmi02', name: 'Mike Jacobs', pos: '1B', bats: 'L', age: 26, pa: 460, h: 112, double: 29, triple: 1, hr: 19, bb: 35, so: 97, hbp: 2, sb: 2, cs: 1, sec: '3B', fld: 60 },
      { id: 'ugglada01', name: 'Dan Uggla', pos: '2B', bats: 'R', age: 27, pa: 728, h: 166, double: 41, triple: 5, hr: 30, bb: 62, so: 153, hbp: 12, sb: 4, cs: 3, sec: 'SS', fld: 66 },
      { id: 'cabremi01', name: 'Miguel Cabrera', pos: '3B', bats: 'R', age: 24, pa: 680, h: 192, double: 43, triple: 2, hr: 31, bb: 79, so: 120, hbp: 6, sb: 4, cs: 3, sec: '1B', fld: 62 },
      { id: 'ramirha01', name: 'Hanley Ramirez', pos: 'SS', bats: 'R', age: 23, pa: 706, h: 202, double: 47, triple: 8, hr: 24, bb: 54, so: 109, hbp: 6, sb: 51, cs: 14, sec: '2B', fld: 61 },
      { id: 'willijo03', name: 'Josh Willingham', pos: 'LF', bats: 'R', age: 28, pa: 604, h: 141, double: 31, triple: 3, hr: 23, bb: 62, so: 119, hbp: 15, sb: 6, cs: 1, sec: 'RF', fld: 53, arm: 73 },
      { id: 'amezaal01', name: 'Alfredo Amezaga', pos: 'CF', bats: 'S', age: 29, pa: 448, h: 104, double: 13, triple: 7, hr: 3, bb: 37, so: 53, hbp: 4, sb: 17, cs: 10, sec: 'LF', fld: 75, arm: 83 },
      { id: 'hermije01', name: 'Jeremy Hermida', pos: 'RF', bats: 'L', age: 23, pa: 484, h: 121, double: 30, triple: 1, hr: 15, bb: 47, so: 103, hbp: 5, sb: 4, cs: 3, sec: 'LF', fld: 74, arm: 71 },
      { id: 'woodja02', name: 'Jason Wood', pos: 'DH', bats: 'R', age: 37, pa: 127, h: 30, double: 7, triple: 0, hr: 3, bb: 8, so: 37, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 56, rk: true },
    ],
    bench: [
      { id: 'booneaa01', name: 'Aaron Boone', pos: '1B', bats: 'R', age: 34, pa: 228, h: 52, double: 10, triple: 0, hr: 5, bb: 17, so: 38, hbp: 7, sb: 3, cs: 1, sec: '3B', fld: 63 },
      { id: 'lindeto01', name: 'Todd Linden', pos: 'LF', bats: 'S', age: 27, pa: 204, h: 45, double: 8, triple: 1, hr: 2, bb: 18, so: 57, hbp: 2, sb: 4, cs: 0, sec: 'RF', fld: 66, arm: 70 },
      { id: 'borchjo01', name: 'Joe Borchard', pos: 'RF', bats: 'S', age: 28, pa: 202, h: 38, double: 8, triple: 0, hr: 6, bb: 21, so: 56, hbp: 2, sb: 2, cs: 1, sec: 'LF', fld: 84, arm: 62 },
      { id: 'treanma01', name: 'Matt Treanor', pos: 'C', bats: 'R', age: 31, pa: 198, h: 42, double: 7, triple: 1, hr: 3, bb: 20, so: 32, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 60 },
      { id: 'rossco01', name: 'Cody Ross', pos: 'CF', bats: 'R', age: 26, pa: 197, h: 49, double: 13, triple: 1, hr: 10, bb: 17, so: 41, hbp: 3, sb: 1, cs: 0, sec: 'RF', fld: 60, arm: 84 },
    ],
    reserveBatters: [
      { id: 'deazaal01', name: 'Alejandro De Aza', pos: 'CF', bats: 'L', age: 23, pa: 158, h: 33, double: 8, triple: 2, hr: 0, bb: 6, so: 37, hbp: 1, sb: 2, cs: 0, sec: 'LF', fld: 67, arm: 78, rk: true },
      { id: 'abercre01', name: 'Reggie Abercrombie', pos: 'CF', bats: 'R', age: 26, pa: 80, h: 15, double: 3, triple: 0, hr: 2, bb: 4, so: 22, hbp: 1, sb: 3, cs: 1, sec: 'RF', fld: 98, arm: 87 },
      { id: 'carrobr01', name: 'Brett Carroll', pos: 'CF', bats: 'R', age: 24, pa: 53, h: 9, double: 1, triple: 0, hr: 0, bb: 3, so: 15, hbp: 0, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'willido03', name: 'Dontrelle Willis', role: 'SP', throws: 'L', age: 25, g: 35, gs: 35, outs: 616, h: 229, hr: 23, bb: 79, so: 151, hbp: 14, er: 100, w: 10, l: 15, sv: 0, fld: 67 },
      { id: 'olsensc01', name: 'Scott Olsen', role: 'SP', throws: 'L', age: 23, g: 33, gs: 33, outs: 530, h: 205, hr: 28, bb: 83, so: 151, hbp: 3, er: 103, w: 10, l: 15, sv: 0, fld: 65 },
      { id: 'mitrese01', name: 'Sergio Mitre', role: 'SP', throws: 'R', age: 26, g: 27, gs: 27, outs: 447, h: 174, hr: 13, bb: 47, so: 85, hbp: 11, er: 80, w: 5, l: 8, sv: 0, fld: 89 },
      { id: 'kimby01', name: 'Byung-Hyun Kim', role: 'SP', throws: 'R', age: 28, g: 28, gs: 22, outs: 355, h: 135, hr: 17, bb: 59, so: 104, hbp: 12, er: 76, w: 10, l: 8, sv: 0, fld: 72 },
      { id: 'vanderi01', name: 'Rick van den Hurk', role: 'SP', throws: 'R', age: 22, g: 18, gs: 17, outs: 245, h: 94, hr: 15, bb: 48, so: 82, hbp: 3, er: 62, w: 4, l: 6, sv: 0, fld: 69, rk: true },
      { id: 'greggke01', name: 'Kevin Gregg', role: 'CL', throws: 'R', age: 29, g: 74, gs: 0, outs: 252, h: 76, hr: 9, bb: 33, so: 79, hbp: 4, er: 36, w: 0, l: 5, sv: 32, fld: 83 },
      { id: 'gardnle01', name: 'Lee Gardner', role: 'RP', throws: 'R', age: 32, g: 62, gs: 0, outs: 223, h: 73, hr: 3, bb: 18, so: 51, hbp: 3, er: 17, w: 3, l: 4, sv: 2, fld: 77, rk: true },
      { id: 'lindsma01', name: 'Matt Lindstrom', role: 'RP', throws: 'R', age: 27, g: 71, gs: 0, outs: 201, h: 66, hr: 2, bb: 21, so: 62, hbp: 3, er: 23, w: 3, l: 4, sv: 0, fld: 69, rk: true },
      { id: 'milleju01', name: 'Justin Miller', role: 'RP', throws: 'R', age: 29, g: 62, gs: 0, outs: 185, h: 54, hr: 6, bb: 24, so: 74, hbp: 0, er: 26, w: 5, l: 0, sv: 0, fld: 74 },
      { id: 'obermwe01', name: 'Wes Obermueller', role: 'RP', throws: 'R', age: 30, g: 18, gs: 7, outs: 177, h: 71, hr: 7, bb: 35, so: 34, hbp: 4, er: 41, w: 2, l: 3, sv: 0, fld: 69 },
      { id: 'pintore01', name: 'Renyel Pinto', role: 'RP', throws: 'L', age: 24, g: 57, gs: 0, outs: 176, h: 43, hr: 7, bb: 37, so: 59, hbp: 3, er: 23, w: 2, l: 4, sv: 1, fld: 81, rk: true },
    ],
    reservePitchers: [
      { id: 'benitar01', name: 'Armando Benitez', role: 'RP', throws: 'R', age: 34, g: 55, gs: 0, outs: 151, h: 49, hr: 8, bb: 28, so: 50, hbp: 1, er: 27, w: 2, l: 8, sv: 9, fld: 61 },
      { id: 'tanketa01', name: 'Taylor Tankersley', role: 'RP', throws: 'L', age: 24, g: 67, gs: 0, outs: 142, h: 41, hr: 4, bb: 30, so: 51, hbp: 2, er: 19, w: 6, l: 1, sv: 1, fld: 79, rk: true },
      { id: 'baronda01', name: 'Daniel Barone', role: 'RP', throws: 'R', age: 24, g: 16, gs: 6, outs: 123, h: 50, hr: 11, bb: 19, so: 18, hbp: 1, er: 26, w: 1, l: 3, sv: 0, fld: 60, rk: true },
      { id: 'sanchan01', name: 'Anibal Sanchez', role: 'RP', throws: 'R', age: 23, g: 6, gs: 6, outs: 90, h: 33, hr: 3, bb: 16, so: 20, hbp: 2, er: 13, w: 2, l: 1, sv: 0, fld: 69 },
      { id: 'owenshe01', name: 'Henry Owens', role: 'RP', throws: 'R', age: 28, g: 22, gs: 0, outs: 69, h: 19, hr: 3, bb: 11, so: 15, hbp: 0, er: 7, w: 2, l: 0, sv: 4, fld: 84, rk: true },
    ],
  },
  // NYM (NYN 2007)
  {
    franchiseId: 'NYM',
    season: 2007,
    batters: [
      { id: 'loducpa01', name: 'Paul Lo Duca', pos: 'C', bats: 'R', age: 35, pa: 488, h: 130, double: 25, triple: 1, hr: 7, bb: 25, so: 33, hbp: 5, sb: 3, cs: 0, sec: '1B', fld: 74, arm: 68 },
      { id: 'delgaca01', name: 'Carlos Delgado', pos: '1B', bats: 'L', age: 35, pa: 607, h: 141, double: 32, triple: 1, hr: 30, bb: 62, so: 118, hbp: 12, sb: 2, cs: 0, sec: 'LF', fld: 66 },
      { id: 'easleda01', name: 'Damion Easley', pos: '2B', bats: 'R', age: 37, pa: 218, h: 49, double: 8, triple: 0, hr: 9, bb: 19, so: 33, hbp: 5, sb: 1, cs: 1, sec: 'SS', fld: 77 },
      { id: 'wrighda03', name: 'David Wright', pos: '3B', bats: 'R', age: 24, pa: 711, h: 195, double: 43, triple: 2, hr: 29, bb: 84, so: 118, hbp: 6, sb: 27, cs: 6, sec: '1B', fld: 70 },
      { id: 'reyesjo01', name: 'Jose Reyes', pos: 'SS', bats: 'S', age: 24, pa: 765, h: 199, double: 33, triple: 15, hr: 14, bb: 63, so: 82, hbp: 1, sb: 73, cs: 19, sec: '2B', fld: 61 },
      { id: 'aloumo01', name: 'Moises Alou', pos: 'LF', bats: 'R', age: 40, pa: 360, h: 105, double: 20, triple: 1, hr: 16, bb: 30, so: 30, hbp: 2, sb: 3, cs: 0, sec: 'RF', fld: 55, arm: 79 },
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 30, pa: 636, h: 150, double: 35, triple: 2, hr: 33, bb: 76, so: 105, hbp: 3, sb: 20, cs: 3, sec: 'LF', fld: 75, arm: 66 },
      { id: 'greensh01', name: 'Shawn Green', pos: 'RF', bats: 'L', age: 34, pa: 490, h: 126, double: 28, triple: 2, hr: 12, bb: 39, so: 66, hbp: 6, sb: 7, cs: 2, sec: '1B', fld: 65, arm: 61 },
      { id: 'valenjo03', name: 'Jose Valentin', pos: 'DH', bats: 'S', age: 37, pa: 183, h: 40, double: 10, triple: 1, hr: 5, bb: 17, so: 30, hbp: 0, sb: 2, cs: 1, sec: '3B', fld: 74 },
    ],
    bench: [
      { id: 'gotayru01', name: 'Ruben Gotay', pos: '2B', bats: 'S', age: 24, pa: 211, h: 52, double: 11, triple: 0, hr: 4, bb: 16, so: 39, hbp: 2, sb: 2, cs: 2, sec: 'SS', fld: 50 },
      { id: 'millela02', name: 'Lastings Milledge', pos: 'RF', bats: 'R', age: 22, pa: 206, h: 48, double: 9, triple: 1, hr: 6, bb: 13, so: 43, hbp: 6, sb: 2, cs: 2, sec: 'LF', fld: 85, arm: 66 },
      { id: 'chaveen01', name: 'Endy Chavez', pos: 'LF', bats: 'L', age: 29, pa: 165, h: 43, double: 8, triple: 2, hr: 1, bb: 10, so: 18, hbp: 0, sb: 5, cs: 2, sec: 'CF', fld: 92, arm: 61 },
      { id: 'castrra01', name: 'Ramon Castro', pos: 'C', bats: 'R', age: 31, pa: 157, h: 37, double: 8, triple: 0, hr: 8, bb: 13, so: 40, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 57 },
      { id: 'gomezca01', name: 'Carlos Gomez', pos: 'LF', bats: 'R', age: 21, pa: 139, h: 29, double: 3, triple: 0, hr: 2, bb: 8, so: 27, hbp: 3, sb: 12, cs: 3, sec: 'RF', fld: 75, arm: 77, rk: true },
    ],
    reserveBatters: [
      { id: 'anderma02', name: 'Marlon Anderson', pos: 'LF', bats: 'L', age: 33, pa: 106, h: 28, double: 5, triple: 1, hr: 4, bb: 8, so: 17, hbp: 0, sb: 2, cs: 1, sec: 'RF' },
      { id: 'francju01', name: 'Julio Franco', pos: '1B', bats: 'R', age: 48, pa: 106, h: 24, double: 5, triple: 0, hr: 2, bb: 11, so: 25, hbp: 0, sb: 2, cs: 1 },
      { id: 'newhada01', name: 'David Newhan', pos: 'LF', bats: 'L', age: 33, pa: 83, h: 16, double: 2, triple: 0, hr: 2, bb: 6, so: 15, hbp: 1, sb: 2, cs: 1, sec: 'RF' },
      { id: 'difelmi01', name: 'Mike Difelice', pos: 'C', bats: 'R', age: 38, pa: 47, h: 8, double: 2, triple: 1, hr: 0, bb: 4, so: 13, hbp: 1, sb: 0, cs: 0 },
      { id: 'ledeeri01', name: 'Ricky Ledee', pos: 'LF', bats: 'L', age: 33, pa: 43, h: 9, double: 3, triple: 0, hr: 1, bb: 4, so: 9, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'glavito02', name: 'Tom Glavine', role: 'SP', throws: 'L', age: 41, g: 34, gs: 34, outs: 601, h: 215, hr: 21, bb: 63, so: 106, hbp: 5, er: 92, w: 13, l: 8, sv: 0, fld: 66 },
      { id: 'mainejo01', name: 'John Maine', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 573, h: 165, hr: 26, bb: 76, so: 171, hbp: 5, er: 84, w: 15, l: 10, sv: 0, fld: 61 },
      { id: 'perezol01', name: 'Oliver Perez', role: 'SP', throws: 'L', age: 25, g: 29, gs: 29, outs: 531, h: 163, hr: 26, bb: 88, so: 163, hbp: 8, er: 88, w: 15, l: 10, sv: 0, fld: 46 },
      { id: 'hernaor01', name: 'Orlando Hernandez', role: 'SP', throws: 'R', age: 41, g: 27, gs: 24, outs: 443, h: 124, hr: 21, bb: 58, so: 129, hbp: 8, er: 68, w: 9, l: 5, sv: 0, fld: 78 },
      { id: 'sosajo02', name: 'Jorge Sosa', role: 'SP', throws: 'R', age: 29, g: 42, gs: 14, outs: 338, h: 113, hr: 16, bb: 42, so: 69, hbp: 0, er: 54, w: 9, l: 8, sv: 0, fld: 88 },
      { id: 'wagnebi02', name: 'Billy Wagner', role: 'CL', throws: 'L', age: 35, g: 66, gs: 0, outs: 205, h: 53, hr: 6, bb: 21, so: 83, hbp: 3, er: 18, w: 2, l: 2, sv: 34, fld: 79 },
      { id: 'heilmaa01', name: 'Aaron Heilman', role: 'RP', throws: 'R', age: 28, g: 81, gs: 0, outs: 258, h: 71, hr: 6, bb: 24, so: 70, hbp: 4, er: 31, w: 7, l: 7, sv: 1, fld: 64 },
      { id: 'felicpe01', name: 'Pedro Feliciano', role: 'RP', throws: 'L', age: 30, g: 78, gs: 0, outs: 192, h: 52, hr: 3, bb: 27, so: 59, hbp: 4, er: 19, w: 2, l: 2, sv: 2, fld: 47 },
      { id: 'motagu01', name: 'Guillermo Mota', role: 'RP', throws: 'R', age: 33, g: 52, gs: 0, outs: 178, h: 60, hr: 8, bb: 22, so: 49, hbp: 1, er: 34, w: 2, l: 2, sv: 0, fld: 77 },
      { id: 'schoesc01', name: 'Scott Schoeneweis', role: 'RP', throws: 'L', age: 33, g: 70, gs: 0, outs: 177, h: 60, hr: 6, bb: 28, so: 40, hbp: 3, er: 31, w: 0, l: 2, sv: 2, fld: 62 },
      { id: 'seleaa01', name: 'Aaron Sele', role: 'RP', throws: 'R', age: 37, g: 34, gs: 0, outs: 161, h: 72, hr: 6, bb: 19, so: 30, hbp: 2, er: 32, w: 3, l: 2, sv: 0, fld: 70 },
    ],
    reservePitchers: [
      { id: 'pelfrmi01', name: 'Mike Pelfrey', role: 'SP', throws: 'R', age: 23, g: 15, gs: 13, outs: 218, h: 85, hr: 6, bb: 39, so: 45, hbp: 9, er: 45, w: 3, l: 8, sv: 0, fld: 77, rk: true },
      { id: 'smithjo05', name: 'Joe Smith', role: 'RP', throws: 'R', age: 23, g: 54, gs: 0, outs: 133, h: 48, hr: 3, bb: 21, so: 45, hbp: 7, er: 17, w: 3, l: 2, sv: 0, fld: 58, rk: true },
      { id: 'lawrebr02', name: 'Brian Lawrence', role: 'RP', throws: 'R', age: 31, g: 6, gs: 6, outs: 87, h: 38, hr: 3, bb: 11, so: 18, hbp: 2, er: 19, w: 1, l: 2, sv: 0, fld: 64 },
      { id: 'martipe02', name: 'Pedro Martinez', role: 'RP', throws: 'R', age: 35, g: 5, gs: 5, outs: 84, h: 25, hr: 3, bb: 8, so: 31, hbp: 2, er: 12, w: 3, l: 1, sv: 0, fld: 77 },
      { id: 'burgoam01', name: 'Ambiorix Burgos', role: 'RP', throws: 'R', age: 23, g: 17, gs: 0, outs: 71, h: 22, hr: 4, bb: 10, so: 21, hbp: 2, er: 11, w: 1, l: 0, sv: 0, fld: 53 },
    ],
  },
  // PHI (PHI 2007)
  {
    franchiseId: 'PHI',
    season: 2007,
    batters: [
      { id: 'ruizca01', name: 'Carlos Ruiz', pos: 'C', bats: 'R', age: 28, pa: 429, h: 97, double: 26, triple: 2, hr: 7, bb: 40, so: 48, hbp: 5, sb: 5, cs: 1, sec: '1B', fld: 77, arm: 75, rk: true },
      { id: 'howarry01', name: 'Ryan Howard', pos: '1B', bats: 'L', age: 27, pa: 648, h: 154, double: 25, triple: 1, hr: 49, bb: 100, so: 185, hbp: 6, sb: 1, cs: 0, sec: '3B', fld: 73 },
      { id: 'utleych01', name: 'Chase Utley', pos: '2B', bats: 'L', age: 28, pa: 613, h: 170, double: 41, triple: 5, hr: 25, bb: 54, so: 99, hbp: 17, sb: 11, cs: 2, sec: 'SS', fld: 77 },
      { id: 'dobbsgr01', name: 'Greg Dobbs', pos: '3B', bats: 'L', age: 28, pa: 358, h: 89, double: 20, triple: 4, hr: 9, bb: 27, so: 65, hbp: 1, sb: 3, cs: 1, sec: '1B', fld: 65 },
      { id: 'rolliji01', name: 'Jimmy Rollins', pos: 'SS', bats: 'S', age: 28, pa: 778, h: 206, double: 41, triple: 15, hr: 26, bb: 52, so: 83, hbp: 6, sb: 40, cs: 5, sec: '2B', fld: 73 },
      { id: 'burrepa01', name: 'Pat Burrell', pos: 'LF', bats: 'R', age: 30, pa: 598, h: 126, double: 25, triple: 0, hr: 30, bb: 106, so: 130, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 40, arm: 74 },
      { id: 'rowanaa01', name: 'Aaron Rowand', pos: 'CF', bats: 'R', age: 29, pa: 684, h: 179, double: 41, triple: 2, hr: 23, bb: 40, so: 119, hbp: 22, sb: 10, cs: 4, sec: 'LF', fld: 72, arm: 73 },
      { id: 'victosh01', name: 'Shane Victorino', pos: 'RF', bats: 'R', age: 26, pa: 510, h: 129, double: 22, triple: 5, hr: 10, bb: 33, so: 61, hbp: 12, sb: 25, cs: 4, sec: 'CF', fld: 80, arm: 79 },
      { id: 'helmswe01', name: 'Wes Helms', pos: 'DH', bats: 'R', age: 31, pa: 308, h: 77, double: 20, triple: 2, hr: 7, bb: 21, so: 60, hbp: 4, sb: 0, cs: 2, sec: '3B', fld: 58 },
    ],
    bench: [
      { id: 'werthja01', name: 'Jayson Werth', pos: 'RF', bats: 'R', age: 28, pa: 304, h: 71, double: 13, triple: 3, hr: 7, bb: 42, so: 77, hbp: 3, sb: 7, cs: 1, sec: 'LF', fld: 85, arm: 89 },
      { id: 'nunezab01', name: 'Abraham Nunez', pos: '3B', bats: 'S', age: 31, pa: 287, h: 60, double: 9, triple: 1, hr: 1, bb: 29, so: 45, hbp: 1, sb: 1, cs: 0, sec: 'SS', fld: 90 },
      { id: 'barajro01', name: 'Rod Barajas', pos: 'C', bats: 'R', age: 31, pa: 146, h: 33, double: 8, triple: 0, hr: 5, bb: 11, so: 22, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 81, arm: 79 },
      { id: 'costech01', name: 'Chris Coste', pos: 'C', bats: 'R', age: 34, pa: 137, h: 39, double: 6, triple: 0, hr: 5, bb: 5, so: 20, hbp: 3, sb: 0, cs: 0, fld: 76, arm: 72 },
      { id: 'bournmi01', name: 'Michael Bourn', pos: 'LF', bats: 'L', age: 24, pa: 133, h: 32, double: 3, triple: 3, hr: 1, bb: 13, so: 22, hbp: 0, sb: 18, cs: 2, sec: 'RF', fld: 79, arm: 54, rk: true },
    ],
    pitchers: [
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 44, g: 33, gs: 33, outs: 598, h: 223, hr: 30, bb: 58, so: 118, hbp: 5, er: 104, w: 14, l: 12, sv: 0, fld: 77 },
      { id: 'hamelco01', name: 'Cole Hamels', role: 'SP', throws: 'L', age: 23, g: 28, gs: 28, outs: 550, h: 161, hr: 25, bb: 50, so: 183, hbp: 3, er: 73, w: 15, l: 5, sv: 0, fld: 65 },
      { id: 'eatonad01', name: 'Adam Eaton', role: 'SP', throws: 'R', age: 29, g: 30, gs: 30, outs: 485, h: 192, hr: 28, bb: 67, so: 105, hbp: 10, er: 104, w: 10, l: 10, sv: 0, fld: 73 },
      { id: 'kendrky01', name: 'Kyle Kendrick', role: 'SP', throws: 'R', age: 22, g: 20, gs: 20, outs: 363, h: 129, hr: 16, bb: 25, so: 49, hbp: 7, er: 52, w: 10, l: 4, sv: 0, fld: 78, rk: true },
      { id: 'liebejo01', name: 'Jon Lieber', role: 'SP', throws: 'R', age: 37, g: 14, gs: 12, outs: 234, h: 91, hr: 11, bb: 16, so: 52, hbp: 3, er: 42, w: 3, l: 6, sv: 0, fld: 83 },
      { id: 'myersbr01', name: 'Brett Myers', role: 'CL', throws: 'R', age: 26, g: 51, gs: 3, outs: 206, h: 64, hr: 10, bb: 23, so: 70, hbp: 2, er: 30, w: 5, l: 7, sv: 21, fld: 87 },
      { id: 'gearyge01', name: 'Geoff Geary', role: 'RP', throws: 'R', age: 30, g: 57, gs: 0, outs: 202, h: 74, hr: 6, bb: 21, so: 43, hbp: 6, er: 28, w: 3, l: 2, sv: 0, fld: 79 },
      { id: 'romerjc01', name: 'J. C. Romero', role: 'RP', throws: 'L', age: 31, g: 74, gs: 0, outs: 169, h: 48, hr: 4, bb: 36, so: 40, hbp: 2, er: 22, w: 2, l: 2, sv: 1, fld: 68 },
      { id: 'madsory01', name: 'Ryan Madson', role: 'RP', throws: 'R', age: 26, g: 38, gs: 0, outs: 168, h: 59, hr: 7, bb: 20, so: 41, hbp: 3, er: 27, w: 2, l: 2, sv: 1, fld: 65 },
      { id: 'mesajo01', name: 'Jose Mesa', role: 'RP', throws: 'R', age: 41, g: 56, gs: 0, outs: 152, h: 52, hr: 7, bb: 25, so: 29, hbp: 3, er: 30, w: 2, l: 3, sv: 1, fld: 64 },
      { id: 'condrcl01', name: 'Clay Condrey', role: 'RP', throws: 'R', age: 31, g: 39, gs: 0, outs: 150, h: 61, hr: 4, bb: 16, so: 27, hbp: 4, er: 25, w: 5, l: 0, sv: 2, fld: 67 },
    ],
    reservePitchers: [
      { id: 'durbijd01', name: 'J. D. Durbin', role: 'SP', throws: 'R', age: 25, g: 19, gs: 10, outs: 196, h: 78, hr: 6, bb: 37, so: 40, hbp: 2, er: 44, w: 6, l: 5, sv: 1, fld: 68, rk: true },
      { id: 'garcifr02', name: 'Freddy Garcia', role: 'SP', throws: 'R', age: 30, g: 11, gs: 11, outs: 174, h: 67, hr: 9, bb: 16, so: 42, hbp: 2, er: 32, w: 1, l: 5, sv: 0, fld: 55 },
      { id: 'alfonan01', name: 'Antonio Alfonseca', role: 'RP', throws: 'R', age: 35, g: 61, gs: 0, outs: 149, h: 65, hr: 4, bb: 26, so: 24, hbp: 1, er: 30, w: 5, l: 2, sv: 8, fld: 59 },
      { id: 'gordoto01', name: 'Tom Gordon', role: 'RP', throws: 'R', age: 39, g: 44, gs: 0, outs: 120, h: 37, hr: 6, bb: 14, so: 39, hbp: 1, er: 17, w: 3, l: 2, sv: 6, fld: 60 },
      { id: 'rosarfr01', name: 'Francisco Del Rosario', role: 'RP', throws: 'R', age: 26, g: 23, gs: 0, outs: 79, h: 32, hr: 4, bb: 15, so: 25, hbp: 3, er: 17, w: 0, l: 3, sv: 1, fld: 61, rk: true },
    ],
  },
  // WSH (WAS 2007)
  {
    franchiseId: 'WSH',
    season: 2007,
    batters: [
      { id: 'schnebr01', name: 'Brian Schneider', pos: 'C', bats: 'L', age: 30, pa: 477, h: 104, double: 21, triple: 1, hr: 6, bb: 47, so: 61, hbp: 3, sb: 1, cs: 1, sec: '1B', fld: 74, arm: 75 },
      { id: 'youngdm01', name: 'Dmitri Young', pos: '1B', bats: 'S', age: 33, pa: 508, h: 138, double: 31, triple: 2, hr: 16, bb: 39, so: 85, hbp: 3, sb: 1, cs: 0, sec: 'LF', fld: 66 },
      { id: 'belliro01', name: 'Ronnie Belliard', pos: '2B', bats: 'R', age: 32, pa: 557, h: 145, double: 33, triple: 1, hr: 12, bb: 34, so: 73, hbp: 2, sb: 2, cs: 1, sec: '3B', fld: 78 },
      { id: 'zimmery01', name: 'Ryan Zimmerman', pos: '3B', bats: 'R', age: 22, pa: 722, h: 180, double: 47, triple: 4, hr: 23, bb: 62, so: 126, hbp: 3, sb: 7, cs: 4, sec: '1B', fld: 83 },
      { id: 'lopezfe01', name: 'Felipe Lopez', pos: 'SS', bats: 'S', age: 27, pa: 671, h: 156, double: 27, triple: 5, hr: 12, bb: 62, so: 113, hbp: 3, sb: 29, cs: 10, sec: '3B', fld: 59 },
      { id: 'churcry01', name: 'Ryan Church', pos: 'LF', bats: 'L', age: 28, pa: 530, h: 128, double: 40, triple: 2, hr: 17, bb: 50, so: 115, hbp: 8, sb: 5, cs: 2, sec: 'CF', fld: 94, arm: 64 },
      { id: 'loganno01', name: 'Nook Logan', pos: 'CF', bats: 'S', age: 27, pa: 350, h: 86, double: 16, triple: 4, hr: 1, bb: 20, so: 76, hbp: 0, sb: 21, cs: 5, sec: 'LF', fld: 81, arm: 61 },
      { id: 'kearnau01', name: 'Austin Kearns', pos: 'RF', bats: 'R', age: 27, pa: 674, h: 153, double: 36, triple: 1, hr: 21, bb: 75, so: 126, hbp: 12, sb: 4, cs: 3, sec: 'CF', fld: 90, arm: 70 },
      { id: 'langery01', name: 'Ryan Langerhans', pos: 'DH', bats: 'L', age: 27, pa: 244, h: 46, double: 10, triple: 2, hr: 5, bb: 30, so: 66, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 86, arm: 59 },
    ],
    bench: [
      { id: 'fickro01', name: 'Robert Fick', pos: '1B', bats: 'L', age: 33, pa: 221, h: 49, double: 7, triple: 1, hr: 2, bb: 19, so: 38, hbp: 2, sb: 0, cs: 1, sec: 'LF', fld: 61 },
      { id: 'floreje02', name: 'Jesus Flores', pos: 'C', bats: 'R', age: 22, pa: 197, h: 44, double: 9, triple: 0, hr: 4, bb: 14, so: 48, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 65, arm: 76, rk: true },
      { id: 'guzmacr01', name: 'Cristian Guzman', pos: 'SS', bats: 'S', age: 29, pa: 192, h: 49, double: 7, triple: 4, hr: 2, bb: 13, so: 25, hbp: 1, sb: 2, cs: 1, sec: '2B', fld: 56 },
      { id: 'jimenda01', name: 'D\'Angelo Jimenez', pos: 'SS', bats: 'S', age: 29, pa: 128, h: 24, double: 6, triple: 0, hr: 2, bb: 21, so: 22, hbp: 1, sb: 2, cs: 1, sec: '2B' },
      { id: 'batisto01', name: 'Tony Batista', pos: '1B', bats: 'R', age: 33, pa: 118, h: 26, double: 5, triple: 0, hr: 3, bb: 10, so: 15, hbp: 2, sb: 0, cs: 0, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'snellch02', name: 'Chris Snelling', pos: 'LF', bats: 'L', age: 25, pa: 86, h: 17, double: 3, triple: 1, hr: 2, bb: 12, so: 20, hbp: 3, sb: 1, cs: 1, sec: 'RF', fld: 69, arm: 82 },
      { id: 'castoko01', name: 'Kory Casto', pos: 'LF', bats: 'L', age: 25, pa: 57, h: 7, double: 2, triple: 0, hr: 0, bb: 2, so: 17, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'chicoma01', name: 'Matt Chico', role: 'SP', throws: 'L', age: 24, g: 31, gs: 31, outs: 501, h: 183, hr: 26, bb: 74, so: 94, hbp: 5, er: 86, w: 7, l: 9, sv: 0, fld: 62, rk: true },
      { id: 'bacsimi02', name: 'Mike Bacsik', role: 'SP', throws: 'L', age: 29, g: 29, gs: 20, outs: 354, h: 141, hr: 26, bb: 29, so: 45, hbp: 6, er: 67, w: 5, l: 8, sv: 0, fld: 91 },
      { id: 'bergmja01', name: 'Jason Bergmann', role: 'SP', throws: 'R', age: 25, g: 21, gs: 21, outs: 346, h: 107, hr: 18, bb: 43, so: 87, hbp: 5, er: 62, w: 6, l: 6, sv: 0, fld: 70 },
      { id: 'hillsh01', name: 'Shawn Hill', role: 'SP', throws: 'R', age: 26, g: 16, gs: 16, outs: 292, h: 90, hr: 8, bb: 26, so: 59, hbp: 5, er: 39, w: 4, l: 5, sv: 0, fld: 61, rk: true },
      { id: 'redditi01', name: 'Tim Redding', role: 'SP', throws: 'R', age: 29, g: 15, gs: 15, outs: 252, h: 87, hr: 11, bb: 38, so: 47, hbp: 4, er: 40, w: 3, l: 6, sv: 0, fld: 67 },
      { id: 'cordech01', name: 'Chad Cordero', role: 'CL', throws: 'R', age: 25, g: 76, gs: 0, outs: 225, h: 69, hr: 10, bb: 26, so: 67, hbp: 1, er: 26, w: 3, l: 3, sv: 37, fld: 81 },
      { id: 'riversa01', name: 'Saul Rivera', role: 'RP', throws: 'R', age: 29, g: 85, gs: 0, outs: 279, h: 88, hr: 3, bb: 44, so: 63, hbp: 3, er: 37, w: 4, l: 6, sv: 3, fld: 65 },
      { id: 'rauchjo01', name: 'Jon Rauch', role: 'RP', throws: 'R', age: 28, g: 88, gs: 0, outs: 262, h: 73, hr: 9, bb: 26, so: 74, hbp: 1, er: 33, w: 8, l: 4, sv: 4, fld: 83 },
      { id: 'colomje01', name: 'Jesus Colome', role: 'RP', throws: 'R', age: 29, g: 61, gs: 0, outs: 198, h: 66, hr: 7, bb: 27, so: 42, hbp: 1, er: 29, w: 5, l: 1, sv: 1, fld: 74 },
      { id: 'bowiemi01', name: 'Micah Bowie', role: 'RP', throws: 'L', age: 32, g: 30, gs: 8, outs: 172, h: 52, hr: 6, bb: 26, so: 41, hbp: 2, er: 26, w: 4, l: 3, sv: 0, fld: 80 },
      { id: 'schroch01', name: 'Chris Schroder', role: 'RP', throws: 'R', age: 28, g: 37, gs: 0, outs: 136, h: 35, hr: 5, bb: 17, so: 48, hbp: 4, er: 20, w: 2, l: 3, sv: 0, fld: 64, rk: true },
    ],
    reservePitchers: [
      { id: 'simonja01', name: 'Jason Simontacchi', role: 'SP', throws: 'R', age: 33, g: 13, gs: 13, outs: 212, h: 95, hr: 13, bb: 23, so: 42, hbp: 3, er: 50, w: 6, l: 7, sv: 0, fld: 57 },
      { id: 'hanrajo01', name: 'Joel Hanrahan', role: 'SP', throws: 'R', age: 25, g: 12, gs: 11, outs: 153, h: 59, hr: 9, bb: 38, so: 43, hbp: 0, er: 34, w: 5, l: 3, sv: 0, fld: 75, rk: true },
      { id: 'ayalalu01', name: 'Luis Ayala', role: 'RP', throws: 'R', age: 29, g: 44, gs: 0, outs: 127, h: 44, hr: 5, bb: 11, so: 26, hbp: 2, er: 14, w: 2, l: 2, sv: 1, fld: 78 },
      { id: 'speigle01', name: 'Levale Speigner', role: 'RP', throws: 'R', age: 26, g: 19, gs: 6, outs: 120, h: 58, hr: 4, bb: 23, so: 19, hbp: 0, er: 39, w: 2, l: 3, sv: 0, fld: 73, rk: true },
      { id: 'kingra01', name: 'Ray King', role: 'RP', throws: 'L', age: 33, g: 67, gs: 0, outs: 119, h: 42, hr: 5, bb: 19, so: 22, hbp: 2, er: 19, w: 1, l: 1, sv: 0, fld: 65 },
    ],
  },
  // CHC (CHN 2007)
  {
    franchiseId: 'CHC',
    season: 2007,
    batters: [
      { id: 'barremi01', name: 'Michael Barrett', pos: 'C', bats: 'R', age: 30, pa: 367, h: 91, double: 20, triple: 1, hr: 11, bb: 25, so: 48, hbp: 3, sb: 1, cs: 2, sec: '1B', fld: 63, arm: 62 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 31, pa: 650, h: 179, double: 42, triple: 1, hr: 27, bb: 74, so: 114, hbp: 7, sb: 10, cs: 6, sec: '3B', fld: 71 },
      { id: 'derosma01', name: 'Mark DeRosa', pos: '2B', bats: 'R', age: 32, pa: 574, h: 149, double: 32, triple: 2, hr: 12, bb: 53, so: 98, hbp: 7, sb: 2, cs: 3, sec: '3B', fld: 60 },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 29, pa: 558, h: 153, double: 34, triple: 3, hr: 29, bb: 42, so: 61, hbp: 6, sb: 1, cs: 0, sec: '1B', fld: 78 },
      { id: 'theriry01', name: 'Ryan Theriot', pos: 'SS', bats: 'R', age: 27, pa: 597, h: 146, double: 32, triple: 3, hr: 4, bb: 51, so: 53, hbp: 1, sb: 31, cs: 4, sec: '2B', fld: 60 },
      { id: 'soriaal01', name: 'Alfonso Soriano', pos: 'LF', bats: 'R', age: 31, pa: 617, h: 162, double: 39, triple: 3, hr: 35, bb: 40, so: 129, hbp: 6, sb: 26, cs: 8, sec: 'CF', fld: 73, arm: 95 },
      { id: 'jonesja04', name: 'Jacque Jones', pos: 'CF', bats: 'L', age: 32, pa: 495, h: 126, double: 28, triple: 2, hr: 14, bb: 34, so: 86, hbp: 3, sb: 8, cs: 2, sec: 'RF', fld: 62, arm: 73 },
      { id: 'floydcl01', name: 'Cliff Floyd', pos: 'RF', bats: 'L', age: 34, pa: 322, h: 76, double: 12, triple: 1, hr: 11, bb: 31, so: 49, hbp: 7, sb: 3, cs: 0, sec: 'LF', fld: 54, arm: 60 },
      { id: 'izturce01', name: 'Cesar Izturis', pos: 'DH', bats: 'S', age: 27, pa: 337, h: 80, double: 14, triple: 2, hr: 1, bb: 19, so: 24, hbp: 2, sb: 3, cs: 4, sec: '3B', fld: 59 },
    ],
    bench: [
      { id: 'murtoma01', name: 'Matt Murton', pos: 'RF', bats: 'R', age: 25, pa: 261, h: 68, double: 11, triple: 1, hr: 8, bb: 25, so: 35, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 71, arm: 70 },
      { id: 'fontemi01', name: 'Mike Fontenot', pos: '2B', bats: 'L', age: 27, pa: 260, h: 65, double: 12, triple: 4, hr: 3, bb: 23, so: 43, hbp: 0, sb: 5, cs: 4, sec: 'SS', fld: 59, rk: true },
      { id: 'piefe01', name: 'Felix Pie', pos: 'CF', bats: 'L', age: 22, pa: 194, h: 38, double: 9, triple: 3, hr: 2, bb: 14, so: 43, hbp: 0, sb: 8, cs: 1, sec: 'LF', fld: 72, arm: 60, rk: true },
      { id: 'paganan01', name: 'Angel Pagan', pos: 'CF', bats: 'S', age: 25, pa: 161, h: 38, double: 8, triple: 2, hr: 4, bb: 11, so: 29, hbp: 0, sb: 4, cs: 1, sec: 'RF', fld: 60, arm: 54 },
      { id: 'wardda01', name: 'Daryle Ward', pos: '1B', bats: 'L', age: 32, pa: 133, h: 34, double: 9, triple: 0, hr: 4, bb: 15, so: 21, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
    ],
    reserveBatters: [
      { id: 'hillko01', name: 'Koyie Hill', pos: 'C', bats: 'S', age: 28, pa: 105, h: 16, double: 4, triple: 0, hr: 2, bb: 9, so: 21, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 72 },
      { id: 'cedenro02', name: 'Ronny Cedeno', pos: 'SS', bats: 'R', age: 24, pa: 80, h: 18, double: 2, triple: 1, hr: 1, bb: 3, so: 15, hbp: 0, sb: 1, cs: 1, sec: '2B' },
      { id: 'sotoge01', name: 'Geovany Soto', pos: 'C', bats: 'R', age: 24, pa: 60, h: 19, double: 5, triple: 0, hr: 2, bb: 4, so: 13, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'blanche01', name: 'Henry Blanco', pos: 'C', bats: 'R', age: 35, pa: 58, h: 13, double: 3, triple: 0, hr: 1, bb: 3, so: 9, hbp: 0, sb: 0, cs: 0 },
    ],
    pitchers: [
      { id: 'zambrca01', name: 'Carlos Zambrano', role: 'SP', throws: 'R', age: 26, g: 34, gs: 34, outs: 649, h: 178, hr: 22, bb: 104, so: 194, hbp: 11, er: 89, w: 18, l: 13, sv: 0, fld: 76 },
      { id: 'lillyte01', name: 'Ted Lilly', role: 'SP', throws: 'L', age: 31, g: 34, gs: 34, outs: 621, h: 187, hr: 29, bb: 69, so: 169, hbp: 4, er: 93, w: 15, l: 8, sv: 0, fld: 61 },
      { id: 'hillri01', name: 'Rich Hill', role: 'SP', throws: 'L', age: 27, g: 32, gs: 32, outs: 585, h: 169, hr: 28, bb: 68, so: 181, hbp: 10, er: 89, w: 11, l: 8, sv: 0, fld: 54 },
      { id: 'marquja01', name: 'Jason Marquis', role: 'SP', throws: 'R', age: 28, g: 34, gs: 33, outs: 575, h: 198, hr: 27, bb: 73, so: 101, hbp: 12, er: 106, w: 12, l: 9, sv: 0, fld: 73 },
      { id: 'marshse01', name: 'Sean Marshall', role: 'SP', throws: 'L', age: 24, g: 21, gs: 19, outs: 310, h: 106, hr: 14, bb: 40, so: 64, hbp: 3, er: 53, w: 7, l: 8, sv: 0, fld: 78 },
      { id: 'dempsry01', name: 'Ryan Dempster', role: 'CL', throws: 'R', age: 30, g: 66, gs: 0, outs: 200, h: 61, hr: 6, bb: 31, so: 57, hbp: 2, er: 32, w: 2, l: 7, sv: 28, fld: 69 },
      { id: 'howrybo01', name: 'Bob Howry', role: 'RP', throws: 'R', age: 33, g: 78, gs: 0, outs: 244, h: 73, hr: 8, bb: 19, so: 71, hbp: 2, er: 29, w: 6, l: 7, sv: 8, fld: 48 },
      { id: 'wuertmi01', name: 'Michael Wuertz', role: 'RP', throws: 'R', age: 28, g: 73, gs: 0, outs: 217, h: 63, hr: 8, bb: 34, so: 80, hbp: 0, er: 27, w: 2, l: 3, sv: 0, fld: 59 },
      { id: 'marmoca01', name: 'Carlos Marmol', role: 'RP', throws: 'R', age: 24, g: 59, gs: 0, outs: 208, h: 48, hr: 7, bb: 40, so: 73, hbp: 4, er: 25, w: 5, l: 1, sv: 1, fld: 83 },
      { id: 'eyresc01', name: 'Scott Eyre', role: 'RP', throws: 'L', age: 35, g: 55, gs: 0, outs: 157, h: 55, hr: 5, bb: 30, so: 55, hbp: 1, er: 22, w: 2, l: 1, sv: 0, fld: 60 },
      { id: 'ohmanwi01', name: 'Will Ohman', role: 'RP', throws: 'L', age: 29, g: 56, gs: 0, outs: 109, h: 35, hr: 4, bb: 19, so: 39, hbp: 2, er: 18, w: 2, l: 4, sv: 1, fld: 70 },
    ],
    reservePitchers: [
      { id: 'guzmaan01', name: 'Angel Guzman', role: 'RP', throws: 'R', age: 25, g: 12, gs: 3, outs: 91, h: 32, hr: 3, bb: 14, so: 28, hbp: 3, er: 18, w: 0, l: 1, sv: 0, fld: 83 },
      { id: 'woodke02', name: 'Kerry Wood', role: 'RP', throws: 'R', age: 30, g: 22, gs: 0, outs: 73, h: 20, hr: 3, bb: 11, so: 24, hbp: 1, er: 10, w: 1, l: 1, sv: 0, fld: 70 },
      { id: 'cottsne01', name: 'Neal Cotts', role: 'RP', throws: 'L', age: 27, g: 16, gs: 0, outs: 50, h: 16, hr: 2, bb: 8, so: 14, hbp: 1, er: 8, w: 0, l: 1, sv: 0, fld: 78 },
      { id: 'gallase01', name: 'Sean Gallagher', role: 'RP', throws: 'R', age: 21, g: 8, gs: 0, outs: 44, h: 19, hr: 3, bb: 12, so: 5, hbp: 1, er: 14, w: 0, l: 0, sv: 1, fld: 69, rk: true },
      { id: 'millewa04', name: 'Wade Miller', role: 'RP', throws: 'R', age: 30, g: 3, gs: 3, outs: 41, h: 17, hr: 3, bb: 9, so: 10, hbp: 0, er: 10, w: 0, l: 1, sv: 0, fld: 82 },
    ],
  },
  // CIN (CIN 2007)
  {
    franchiseId: 'CIN',
    season: 2007,
    batters: [
      { id: 'rossda01', name: 'David Ross', pos: 'C', bats: 'R', age: 30, pa: 348, h: 68, double: 13, triple: 1, hr: 19, bb: 33, so: 89, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 83 },
      { id: 'hattesc01', name: 'Scott Hatteberg', pos: '1B', bats: 'L', age: 37, pa: 417, h: 105, double: 23, triple: 0, hr: 9, bb: 51, so: 35, hbp: 3, sb: 1, cs: 1, fld: 70 },
      { id: 'phillbr01', name: 'Brandon Phillips', pos: '2B', bats: 'R', age: 26, pa: 702, h: 183, double: 29, triple: 4, hr: 26, bb: 36, so: 108, hbp: 10, sb: 31, cs: 6, sec: 'SS', fld: 79 },
      { id: 'encared01', name: 'Edwin Encarnacion', pos: '3B', bats: 'R', age: 24, pa: 556, h: 139, double: 31, triple: 1, hr: 17, bb: 43, so: 93, hbp: 14, sb: 8, cs: 2, sec: '1B', fld: 62 },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 30, pa: 430, h: 104, double: 26, triple: 1, hr: 12, bb: 24, so: 72, hbp: 6, sb: 1, cs: 1, sec: '2B', fld: 61 },
      { id: 'dunnad01', name: 'Adam Dunn', pos: 'LF', bats: 'L', age: 27, pa: 632, h: 130, double: 26, triple: 1, hr: 39, bb: 103, so: 169, hbp: 6, sb: 7, cs: 1, sec: '1B', fld: 57, arm: 63 },
      { id: 'hamiljo03', name: 'Josh Hamilton', pos: 'CF', bats: 'L', age: 26, pa: 337, h: 87, double: 17, triple: 2, hr: 19, bb: 33, so: 65, hbp: 4, sb: 3, cs: 3, sec: 'RF', fld: 69, arm: 79, rk: true },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'RF', bats: 'L', age: 37, pa: 623, h: 148, double: 26, triple: 1, hr: 33, bb: 72, so: 101, hbp: 2, sb: 3, cs: 1, sec: 'CF', fld: 74, arm: 65 },
      { id: 'coninje01', name: 'Jeff Conine', pos: 'DH', bats: 'R', age: 41, pa: 292, h: 70, double: 14, triple: 2, hr: 5, bb: 25, so: 37, hbp: 1, sb: 2, cs: 0, sec: '1B', fld: 56 },
    ],
    bench: [
      { id: 'hoppeno01', name: 'Norris Hopper', pos: 'CF', bats: 'R', age: 28, pa: 335, h: 101, double: 13, triple: 2, hr: 1, bb: 22, so: 33, hbp: 1, sb: 14, cs: 7, sec: 'LF', fld: 83, arm: 74, rk: true },
      { id: 'freelry01', name: 'Ryan Freel', pos: 'CF', bats: 'R', age: 31, pa: 304, h: 70, double: 15, triple: 2, hr: 4, bb: 28, so: 50, hbp: 6, sb: 20, cs: 7, sec: 'RF', fld: 72, arm: 70 },
      { id: 'keppije01', name: 'Jeff Keppinger', pos: 'SS', bats: 'R', age: 27, pa: 276, h: 78, double: 15, triple: 2, hr: 5, bb: 24, so: 14, hbp: 3, sb: 2, cs: 1, sec: '2B', fld: 70 },
      { id: 'valenja01', name: 'Javier Valentin', pos: 'C', bats: 'S', age: 31, pa: 265, h: 66, double: 16, triple: 0, hr: 7, bb: 21, so: 31, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 58 },
      { id: 'cantujo01', name: 'Jorge Cantu', pos: '1B', bats: 'R', age: 25, pa: 133, h: 32, double: 7, triple: 0, hr: 4, bb: 7, so: 24, hbp: 1, sb: 0, cs: 0, sec: '3B', fld: 66 },
    ],
    reserveBatters: [
      { id: 'ellisja01', name: 'Jason Ellison', pos: 'RF', bats: 'R', age: 29, pa: 104, h: 23, double: 4, triple: 0, hr: 1, bb: 6, so: 18, hbp: 1, sb: 4, cs: 2, sec: 'CF', fld: 88, arm: 64 },
      { id: 'castrju01', name: 'Juan Castro', pos: '3B', bats: 'R', age: 35, pa: 98, h: 21, double: 5, triple: 1, hr: 1, bb: 4, so: 15, hbp: 0, sb: 0, cs: 0, sec: 'SS' },
      { id: 'vottojo01', name: 'Joey Votto', pos: '1B', bats: 'L', age: 23, pa: 89, h: 27, double: 7, triple: 0, hr: 4, bb: 5, so: 15, hbp: 0, sb: 1, cs: 0, sec: '3B', fld: 81, rk: true },
      { id: 'moellch01', name: 'Chad Moeller', pos: 'C', bats: 'R', age: 32, pa: 58, h: 10, double: 2, triple: 0, hr: 1, bb: 2, so: 15, hbp: 1, sb: 0, cs: 0, sec: '1B' },
      { id: 'lopezpe01', name: 'Pedro Lopez', pos: 'SS', bats: 'R', age: 23, pa: 47, h: 8, double: 2, triple: 0, hr: 0, bb: 1, so: 10, hbp: 1, sb: 0, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'haranaa01', name: 'Aaron Harang', role: 'SP', throws: 'R', age: 29, g: 34, gs: 34, outs: 695, h: 222, hr: 27, bb: 53, so: 207, hbp: 8, er: 95, w: 16, l: 6, sv: 0, fld: 64 },
      { id: 'arroybr01', name: 'Bronson Arroyo', role: 'SP', throws: 'R', age: 30, g: 34, gs: 34, outs: 632, h: 221, hr: 27, bb: 61, so: 153, hbp: 10, er: 94, w: 9, l: 15, sv: 0, fld: 69 },
      { id: 'lohseky01', name: 'Kyle Lohse', role: 'SP', throws: 'R', age: 28, g: 34, gs: 32, outs: 578, h: 214, hr: 22, bb: 57, so: 122, hbp: 11, er: 103, w: 9, l: 12, sv: 0, fld: 68 },
      { id: 'belisma01', name: 'Matt Belisle', role: 'SP', throws: 'R', age: 27, g: 30, gs: 30, outs: 533, h: 208, hr: 25, bb: 49, so: 123, hbp: 8, er: 98, w: 8, l: 9, sv: 0, fld: 70 },
      { id: 'livinbo01', name: 'Bobby Livingston', role: 'SP', throws: 'L', age: 24, g: 10, gs: 10, outs: 169, h: 77, hr: 9, bb: 11, so: 27, hbp: 2, er: 37, w: 3, l: 3, sv: 0, fld: 63, rk: true },
      { id: 'weathda01', name: 'David Weathers', role: 'CL', throws: 'R', age: 37, g: 70, gs: 0, outs: 233, h: 67, hr: 7, bb: 30, so: 51, hbp: 4, er: 31, w: 2, l: 6, sv: 33, fld: 84 },
      { id: 'santovi01', name: 'Victor Santos', role: 'RP', throws: 'R', age: 30, g: 36, gs: 3, outs: 190, h: 76, hr: 11, bb: 28, so: 45, hbp: 2, er: 39, w: 1, l: 6, sv: 0, fld: 61 },
      { id: 'stantmi02', name: 'Mike Stanton', role: 'RP', throws: 'L', age: 40, g: 69, gs: 0, outs: 173, h: 70, hr: 4, bb: 21, so: 41, hbp: 3, er: 33, w: 1, l: 3, sv: 0, fld: 60 },
      { id: 'coffeto01', name: 'Todd Coffey', role: 'RP', throws: 'R', age: 26, g: 58, gs: 0, outs: 153, h: 67, hr: 8, bb: 18, so: 40, hbp: 3, er: 27, w: 2, l: 1, sv: 0, fld: 61 },
      { id: 'baileho02', name: 'Homer Bailey', role: 'RP', throws: 'R', age: 21, g: 9, gs: 9, outs: 136, h: 43, hr: 3, bb: 28, so: 28, hbp: 3, er: 29, w: 4, l: 2, sv: 0, fld: 73, rk: true },
      { id: 'burtoja01', name: 'Jared Burton', role: 'RP', throws: 'R', age: 26, g: 47, gs: 0, outs: 129, h: 28, hr: 2, bb: 22, so: 36, hbp: 2, er: 12, w: 4, l: 2, sv: 0, fld: 70, rk: true },
    ],
    reservePitchers: [
      { id: 'saarlki01', name: 'Kirk Saarloos', role: 'RP', throws: 'R', age: 28, g: 34, gs: 3, outs: 128, h: 52, hr: 6, bb: 18, so: 20, hbp: 2, er: 25, w: 1, l: 5, sv: 0, fld: 72 },
      { id: 'coutljo01', name: 'Jon Coutlangus', role: 'RP', throws: 'L', age: 26, g: 64, gs: 0, outs: 123, h: 38, hr: 3, bb: 27, so: 38, hbp: 4, er: 20, w: 4, l: 2, sv: 0, fld: 56, rk: true },
      { id: 'goslimi01', name: 'Mike Gosling', role: 'RP', throws: 'L', age: 26, g: 23, gs: 0, outs: 99, h: 42, hr: 5, bb: 26, so: 28, hbp: 1, er: 19, w: 2, l: 0, sv: 0, fld: 62 },
      { id: 'shearto01', name: 'Tom Shearn', role: 'RP', throws: 'R', age: 29, g: 7, gs: 6, outs: 98, h: 32, hr: 8, bb: 13, so: 16, hbp: 0, er: 18, w: 3, l: 0, sv: 0, fld: 84, rk: true },
      { id: 'miltoer01', name: 'Eric Milton', role: 'RP', throws: 'L', age: 31, g: 6, gs: 6, outs: 94, h: 37, hr: 6, bb: 9, so: 19, hbp: 1, er: 20, w: 0, l: 4, sv: 0, fld: 58 },
    ],
  },
  // MIL (MIL 2007)
  {
    franchiseId: 'MIL',
    season: 2007,
    batters: [
      { id: 'estrajo01', name: 'Johnny Estrada', pos: 'C', bats: 'S', age: 31, pa: 464, h: 124, double: 27, triple: 0, hr: 10, bb: 14, so: 43, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 59 },
      { id: 'fieldpr01', name: 'Prince Fielder', pos: '1B', bats: 'L', age: 23, pa: 681, h: 164, double: 36, triple: 2, hr: 42, bb: 78, so: 126, hbp: 13, sb: 4, cs: 2, sec: '3B', fld: 68 },
      { id: 'weeksri01', name: 'Rickie Weeks', pos: '2B', bats: 'R', age: 24, pa: 506, h: 105, double: 19, triple: 5, hr: 14, bb: 61, so: 115, hbp: 17, sb: 23, cs: 3, sec: 'SS', fld: 63 },
      { id: 'braunry02', name: 'Ryan Braun', pos: '3B', bats: 'R', age: 23, pa: 492, h: 146, double: 26, triple: 6, hr: 34, bb: 29, so: 112, hbp: 7, sb: 15, cs: 5, sec: '1B', fld: 40, rk: true },
      { id: 'hardyjj01', name: 'J. J. Hardy', pos: 'SS', bats: 'R', age: 24, pa: 638, h: 157, double: 30, triple: 1, hr: 24, bb: 45, so: 76, hbp: 1, sb: 2, cs: 3, sec: '2B', fld: 58 },
      { id: 'jenkige01', name: 'Geoff Jenkins', pos: 'LF', bats: 'L', age: 32, pa: 464, h: 110, double: 25, triple: 1, hr: 18, bb: 39, so: 111, hbp: 10, sb: 2, cs: 1, sec: 'RF', fld: 77, arm: 72 },
      { id: 'hallbi03', name: 'Bill Hall', pos: 'CF', bats: 'R', age: 27, pa: 503, h: 120, double: 34, triple: 2, hr: 20, bb: 44, so: 125, hbp: 2, sb: 7, cs: 6, sec: 'LF', fld: 59, arm: 66 },
      { id: 'hartco01', name: 'Corey Hart', pos: 'RF', bats: 'R', age: 25, pa: 566, h: 147, double: 32, triple: 8, hr: 23, bb: 37, so: 106, hbp: 10, sb: 20, cs: 9, sec: 'CF', fld: 98, arm: 64 },
      { id: 'grossga01', name: 'Gabe Gross', pos: 'DH', bats: 'L', age: 27, pa: 210, h: 45, double: 12, triple: 1, hr: 7, bb: 27, so: 43, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 74, arm: 76 },
    ],
    bench: [
      { id: 'counscr01', name: 'Craig Counsell', pos: '3B', bats: 'L', age: 36, pa: 334, h: 70, double: 13, triple: 2, hr: 3, bb: 35, so: 41, hbp: 5, sb: 9, cs: 4, sec: '2B', fld: 85 },
      { id: 'menchke01', name: 'Kevin Mench', pos: 'LF', bats: 'R', age: 29, pa: 308, h: 76, double: 17, triple: 2, hr: 9, bb: 19, so: 31, hbp: 2, sb: 2, cs: 1, sec: 'RF', fld: 55, arm: 79 },
      { id: 'graffto01', name: 'Tony Graffanino', pos: '2B', bats: 'R', age: 35, pa: 260, h: 62, double: 13, triple: 1, hr: 6, bb: 23, so: 37, hbp: 3, sb: 2, cs: 2, sec: '3B', fld: 80 },
      { id: 'milleda02', name: 'Damian Miller', pos: 'C', bats: 'R', age: 37, pa: 206, h: 46, double: 12, triple: 0, hr: 4, bb: 17, so: 44, hbp: 2, sb: 0, cs: 0, fld: 80, arm: 77 },
      { id: 'gwynnto02', name: 'Tony Gwynn', pos: 'CF', bats: 'L', age: 24, pa: 135, h: 32, double: 3, triple: 2, hr: 0, bb: 10, so: 24, hbp: 0, sb: 7, cs: 1, sec: 'RF', fld: 44, arm: 65, rk: true },
    ],
    reserveBatters: [
      { id: 'dillojo02', name: 'Joe Dillon', pos: 'LF', bats: 'R', age: 31, pa: 82, h: 24, double: 7, triple: 2, hr: 0, bb: 5, so: 14, hbp: 1, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 32, g: 34, gs: 34, outs: 620, h: 236, hr: 21, bb: 71, so: 116, hbp: 10, er: 99, w: 12, l: 12, sv: 0, fld: 78 },
      { id: 'bushda01', name: 'Dave Bush', role: 'SP', throws: 'R', age: 27, g: 33, gs: 31, outs: 559, h: 204, hr: 26, bb: 41, so: 138, hbp: 14, er: 101, w: 12, l: 10, sv: 0, fld: 75 },
      { id: 'capuach01', name: 'Chris Capuano', role: 'SP', throws: 'L', age: 28, g: 29, gs: 25, outs: 450, h: 164, hr: 21, bb: 48, so: 128, hbp: 7, er: 76, w: 5, l: 12, sv: 0, fld: 79 },
      { id: 'sheetbe01', name: 'Ben Sheets', role: 'SP', throws: 'R', age: 28, g: 24, gs: 24, outs: 424, h: 139, hr: 16, bb: 29, so: 125, hbp: 2, er: 59, w: 12, l: 5, sv: 0, fld: 65 },
      { id: 'vargacl01', name: 'Claudio Vargas', role: 'SP', throws: 'R', age: 29, g: 29, gs: 23, outs: 403, h: 152, hr: 23, bb: 49, so: 103, hbp: 5, er: 76, w: 11, l: 6, sv: 1, fld: 61 },
      { id: 'cordefr01', name: 'Francisco Cordero', role: 'CL', throws: 'R', age: 32, g: 66, gs: 0, outs: 190, h: 53, hr: 5, bb: 22, so: 76, hbp: 2, er: 23, w: 0, l: 4, sv: 44, fld: 54 },
      { id: 'villaca01', name: 'Carlos Villanueva', role: 'RP', throws: 'R', age: 23, g: 59, gs: 6, outs: 343, h: 100, hr: 17, bb: 47, so: 97, hbp: 4, er: 50, w: 8, l: 5, sv: 1, fld: 72 },
      { id: 'turnbde01', name: 'Derrick Turnbow', role: 'RP', throws: 'R', age: 29, g: 77, gs: 0, outs: 204, h: 51, hr: 6, bb: 42, so: 79, hbp: 3, er: 36, w: 4, l: 5, sv: 1, fld: 62 },
      { id: 'wisema01', name: 'Matt Wise', role: 'RP', throws: 'R', age: 31, g: 56, gs: 0, outs: 161, h: 54, hr: 6, bb: 18, so: 43, hbp: 2, er: 24, w: 3, l: 2, sv: 1, fld: 69 },
      { id: 'spurlch01', name: 'Chris Spurling', role: 'RP', throws: 'R', age: 30, g: 49, gs: 0, outs: 150, h: 58, hr: 7, bb: 16, so: 24, hbp: 2, er: 25, w: 2, l: 1, sv: 0, fld: 54 },
      { id: 'shousbr01', name: 'Brian Shouse', role: 'RP', throws: 'L', age: 38, g: 73, gs: 0, outs: 143, h: 46, hr: 3, bb: 16, so: 30, hbp: 4, er: 19, w: 1, l: 1, sv: 1, fld: 61 },
    ],
    reservePitchers: [
      { id: 'gallayo01', name: 'Yovani Gallardo', role: 'SP', throws: 'R', age: 21, g: 20, gs: 17, outs: 331, h: 103, hr: 8, bb: 37, so: 101, hbp: 2, er: 45, w: 9, l: 5, sv: 0, fld: 56, rk: true },
      { id: 'parrama01', name: 'Manny Parra', role: 'RP', throws: 'L', age: 24, g: 9, gs: 2, outs: 79, h: 25, hr: 1, bb: 12, so: 26, hbp: 2, er: 11, w: 0, l: 1, sv: 0, fld: 58, rk: true },
      { id: 'aquingr01', name: 'Greg Aquino', role: 'RP', throws: 'R', age: 29, g: 15, gs: 0, outs: 42, h: 14, hr: 2, bb: 6, so: 13, hbp: 1, er: 7, w: 0, l: 1, sv: 0, fld: 74 },
      { id: 'mccluse01', name: 'Seth McClung', role: 'RP', throws: 'R', age: 26, g: 14, gs: 0, outs: 36, h: 12, hr: 2, bb: 7, so: 8, hbp: 1, er: 8, w: 0, l: 1, sv: 0, fld: 77 },
    ],
  },
  // PIT (PIT 2007)
  {
    franchiseId: 'PIT',
    season: 2007,
    batters: [
      { id: 'pauliro01', name: 'Ronny Paulino', pos: 'C', bats: 'R', age: 26, pa: 494, h: 128, double: 23, triple: 0, hr: 9, bb: 34, so: 80, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 71, arm: 71 },
      { id: 'larocad01', name: 'Adam LaRoche', pos: '1B', bats: 'L', age: 27, pa: 632, h: 154, double: 41, triple: 0, hr: 26, bb: 60, so: 132, hbp: 3, sb: 1, cs: 2, sec: '3B', fld: 69 },
      { id: 'sanchfr01', name: 'Freddy Sanchez', pos: '2B', bats: 'R', age: 29, pa: 653, h: 190, double: 45, triple: 4, hr: 9, bb: 33, so: 65, hbp: 8, sb: 1, cs: 2, sec: '3B', fld: 74 },
      { id: 'bautijo02', name: 'Jose Bautista', pos: '3B', bats: 'R', age: 26, pa: 614, h: 130, double: 33, triple: 3, hr: 17, bb: 65, so: 116, hbp: 10, sb: 5, cs: 4, sec: '1B', fld: 77 },
      { id: 'wilsoja02', name: 'Jack Wilson', pos: 'SS', bats: 'R', age: 29, pa: 535, h: 136, double: 26, triple: 2, hr: 9, bb: 33, so: 51, hbp: 5, sb: 3, cs: 4, sec: '2B', fld: 90 },
      { id: 'bayja01', name: 'Jason Bay', pos: 'LF', bats: 'R', age: 28, pa: 614, h: 142, double: 28, triple: 3, hr: 26, bb: 74, so: 137, hbp: 8, sb: 9, cs: 1, sec: 'CF', fld: 61, arm: 80 },
      { id: 'duffych01', name: 'Chris Duffy', pos: 'CF', bats: 'L', age: 27, pa: 270, h: 63, double: 11, triple: 3, hr: 2, bb: 18, so: 48, hbp: 5, sb: 15, cs: 3, sec: 'LF', fld: 81, arm: 68 },
      { id: 'nadyxa01', name: 'Xavier Nady', pos: 'RF', bats: 'R', age: 28, pa: 470, h: 119, double: 24, triple: 1, hr: 18, bb: 25, so: 91, hbp: 11, sb: 3, cs: 2, sec: '1B', fld: 64, arm: 65 },
      { id: 'doumiry01', name: 'Ryan Doumit', pos: 'DH', bats: 'S', age: 26, pa: 279, h: 63, double: 17, triple: 1, hr: 9, bb: 21, so: 59, hbp: 9, sb: 1, cs: 1, sec: 'C', fld: 61, arm: 90 },
    ],
    bench: [
      { id: 'mclouna01', name: 'Nate McLouth', pos: 'CF', bats: 'L', age: 25, pa: 382, h: 84, double: 21, triple: 3, hr: 12, bb: 32, so: 76, hbp: 9, sb: 18, cs: 1, sec: 'RF', fld: 60, arm: 61 },
      { id: 'castijo02', name: 'Jose Castillo', pos: '3B', bats: 'R', age: 26, pa: 230, h: 54, double: 12, triple: 1, hr: 4, bb: 11, so: 41, hbp: 2, sb: 1, cs: 1, sec: '2B', fld: 100 },
      { id: 'phelpjo01', name: 'Josh Phelps', pos: '1B', bats: 'R', age: 29, pa: 183, h: 47, double: 7, triple: 2, hr: 7, bb: 18, so: 44, hbp: 5, sb: 0, cs: 0, sec: '3B', fld: 60 },
      { id: 'katama01', name: 'Matt Kata', pos: '3B', bats: 'S', age: 29, pa: 167, h: 34, double: 9, triple: 1, hr: 3, bb: 6, so: 32, hbp: 2, sb: 1, cs: 0, sec: '2B' },
      { id: 'morgany01', name: 'Nyjer Morgan', pos: 'CF', bats: 'L', age: 26, pa: 118, h: 32, double: 3, triple: 4, hr: 1, bb: 9, so: 19, hbp: 1, sb: 7, cs: 3, sec: 'LF', fld: 95, arm: 76, rk: true },
    ],
    reserveBatters: [
      { id: 'pearcst01', name: 'Steve Pearce', pos: 'RF', bats: 'R', age: 24, pa: 73, h: 20, double: 5, triple: 1, hr: 0, bb: 5, so: 12, hbp: 0, sb: 2, cs: 1, sec: 'LF', fld: 75, arm: 72, rk: true },
      { id: 'eldrebr01', name: 'Brad Eldred', pos: 'RF', bats: 'R', age: 26, pa: 47, h: 8, double: 2, triple: 0, hr: 2, bb: 2, so: 17, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'snellia01', name: 'Ian Snell', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 624, h: 211, hr: 26, bb: 75, so: 179, hbp: 6, er: 95, w: 9, l: 12, sv: 0, fld: 63 },
      { id: 'gorzeto01', name: 'Tom Gorzelanny', role: 'SP', throws: 'L', age: 24, g: 32, gs: 32, outs: 605, h: 207, hr: 17, bb: 74, so: 134, hbp: 11, er: 88, w: 14, l: 10, sv: 0, fld: 67 },
      { id: 'maholpa01', name: 'Paul Maholm', role: 'SP', throws: 'L', age: 25, g: 29, gs: 29, outs: 533, h: 198, hr: 20, bb: 62, so: 109, hbp: 8, er: 93, w: 10, l: 15, sv: 0, fld: 72 },
      { id: 'dukeza01', name: 'Zach Duke', role: 'SP', throws: 'L', age: 24, g: 20, gs: 19, outs: 322, h: 143, hr: 11, bb: 31, so: 55, hbp: 3, er: 57, w: 3, l: 8, sv: 0, fld: 71 },
      { id: 'armasto02', name: 'Tony Armas', role: 'SP', throws: 'R', age: 29, g: 31, gs: 15, outs: 291, h: 107, hr: 15, bb: 41, so: 66, hbp: 8, er: 59, w: 4, l: 5, sv: 0, fld: 95 },
      { id: 'cappsma01', name: 'Matt Capps', role: 'CL', throws: 'R', age: 23, g: 76, gs: 0, outs: 237, h: 69, hr: 8, bb: 14, so: 59, hbp: 3, er: 25, w: 4, l: 7, sv: 18, fld: 69 },
      { id: 'chacosh01', name: 'Shawn Chacon', role: 'RP', throws: 'R', age: 29, g: 64, gs: 4, outs: 288, h: 97, hr: 13, bb: 49, so: 64, hbp: 8, er: 49, w: 5, l: 4, sv: 1, fld: 67 },
      { id: 'youmash01', name: 'Shane Youman', role: 'RP', throws: 'L', age: 27, g: 16, gs: 8, outs: 172, h: 61, hr: 5, bb: 24, so: 26, hbp: 3, er: 35, w: 3, l: 5, sv: 0, fld: 73, rk: true },
      { id: 'torresa01', name: 'Salomon Torres', role: 'RP', throws: 'R', age: 35, g: 56, gs: 0, outs: 158, h: 54, hr: 5, bb: 20, so: 40, hbp: 4, er: 23, w: 2, l: 4, sv: 12, fld: 72 },
      { id: 'grabojo02', name: 'John Grabow', role: 'RP', throws: 'L', age: 28, g: 63, gs: 0, outs: 155, h: 52, hr: 6, bb: 21, so: 45, hbp: 2, er: 25, w: 3, l: 2, sv: 1, fld: 72 },
      { id: 'marteda01', name: 'Damaso Marte', role: 'RP', throws: 'L', age: 32, g: 65, gs: 0, outs: 136, h: 35, hr: 3, bb: 21, so: 48, hbp: 2, er: 15, w: 2, l: 0, sv: 0, fld: 63 },
    ],
    reservePitchers: [
      { id: 'vanbejo01', name: 'John Van Benschoten', role: 'RP', throws: 'R', age: 27, g: 11, gs: 9, outs: 117, h: 55, hr: 4, bb: 29, so: 26, hbp: 5, er: 44, w: 0, l: 7, sv: 0, fld: 68, rk: true },
      { id: 'baylijo01', name: 'Jonah Bayliss', role: 'RP', throws: 'R', age: 26, g: 39, gs: 0, outs: 113, h: 46, hr: 7, bb: 20, so: 32, hbp: 2, er: 31, w: 4, l: 3, sv: 0, fld: 75, rk: true },
      { id: 'osorifr01', name: 'Franquelis Osoria', role: 'RP', throws: 'R', age: 25, g: 25, gs: 0, outs: 85, h: 34, hr: 4, bb: 9, so: 15, hbp: 3, er: 16, w: 0, l: 2, sv: 0, fld: 74, rk: true },
      { id: 'kuwatma01', name: 'Masumi Kuwata', role: 'RP', throws: 'R', age: 39, g: 19, gs: 0, outs: 63, h: 25, hr: 6, bb: 15, so: 12, hbp: 1, er: 22, w: 0, l: 1, sv: 0, fld: 80, rk: true },
      { id: 'wasdijo01', name: 'John Wasdin', role: 'RP', throws: 'R', age: 34, g: 12, gs: 0, outs: 59, h: 26, hr: 3, bb: 8, so: 12, hbp: 1, er: 12, w: 1, l: 1, sv: 0, fld: 70 },
    ],
  },
  // STL (SLN 2007)
  {
    franchiseId: 'STL',
    season: 2007,
    batters: [
      { id: 'molinya01', name: 'Yadier Molina', pos: 'C', bats: 'R', age: 24, pa: 396, h: 89, double: 18, triple: 0, hr: 6, bb: 28, so: 38, hbp: 4, sb: 1, cs: 2, sec: '1B', fld: 70, arm: 94 },
      { id: 'pujolal01', name: 'Albert Pujols', pos: '1B', bats: 'R', age: 27, pa: 679, h: 187, double: 37, triple: 1, hr: 40, bb: 98, so: 57, hbp: 6, sb: 6, cs: 4, sec: 'LF', fld: 82 },
      { id: 'milesaa01', name: 'Aaron Miles', pos: '2B', bats: 'S', age: 30, pa: 449, h: 115, double: 17, triple: 3, hr: 2, bb: 27, so: 41, hbp: 2, sb: 2, cs: 1, sec: 'SS', fld: 66 },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 32, pa: 441, h: 107, double: 29, triple: 1, hr: 12, bb: 40, so: 54, hbp: 5, sb: 5, cs: 3, sec: '1B', fld: 83 },
      { id: 'eckstda01', name: 'David Eckstein', pos: 'SS', bats: 'R', age: 32, pa: 484, h: 130, double: 19, triple: 1, hr: 3, bb: 28, so: 28, hbp: 12, sb: 8, cs: 3, sec: '2B', fld: 66 },
      { id: 'duncach01', name: 'Chris Duncan', pos: 'LF', bats: 'L', age: 26, pa: 432, h: 102, double: 19, triple: 1, hr: 24, bb: 50, so: 114, hbp: 2, sb: 1, cs: 1, sec: 'RF', fld: 64, arm: 71 },
      { id: 'edmonji01', name: 'Jim Edmonds', pos: 'CF', bats: 'L', age: 37, pa: 411, h: 91, double: 19, triple: 1, hr: 16, bb: 50, so: 89, hbp: 1, sb: 2, cs: 2, sec: 'LF', fld: 67, arm: 77 },
      { id: 'encarju01', name: 'Juan Encarnacion', pos: 'RF', bats: 'R', age: 31, pa: 307, h: 80, double: 15, triple: 2, hr: 9, bb: 18, so: 46, hbp: 2, sb: 3, cs: 2, sec: 'CF', fld: 45, arm: 63 },
      { id: 'spiezsc01', name: 'Scott Spiezio', pos: 'DH', bats: 'S', age: 34, pa: 257, h: 58, double: 13, triple: 1, hr: 7, bb: 28, so: 47, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 83 },
    ],
    bench: [
      { id: 'tagucso01', name: 'So Taguchi', pos: 'CF', bats: 'R', age: 37, pa: 340, h: 86, double: 16, triple: 1, hr: 3, bb: 24, so: 40, hbp: 4, sb: 8, cs: 3, sec: 'LF', fld: 63, arm: 66 },
      { id: 'ludwiry01', name: 'Ryan Ludwick', pos: 'LF', bats: 'R', age: 28, pa: 339, h: 80, double: 21, triple: 0, hr: 15, bb: 27, so: 73, hbp: 7, sb: 4, cs: 4, sec: 'RF', fld: 80, arm: 59 },
      { id: 'kennead01', name: 'Adam Kennedy', pos: '2B', bats: 'L', age: 31, pa: 306, h: 71, double: 13, triple: 2, hr: 2, bb: 22, so: 39, hbp: 3, sb: 9, cs: 4, sec: 'SS', fld: 80 },
      { id: 'ryanbr01', name: 'Brendan Ryan', pos: 'SS', bats: 'R', age: 25, pa: 199, h: 52, double: 9, triple: 0, hr: 4, bb: 15, so: 19, hbp: 1, sb: 7, cs: 0, sec: '3B', fld: 94, rk: true },
      { id: 'ankieri01', name: 'Rick Ankiel', pos: 'RF', bats: 'L', age: 27, pa: 190, h: 49, double: 8, triple: 1, hr: 11, bb: 13, so: 41, hbp: 0, sb: 1, cs: 0, sec: 'CF', fld: 82, arm: 74, rk: true },
    ],
    reserveBatters: [
      { id: 'schumsk01', name: 'Skip Schumaker', pos: 'RF', bats: 'L', age: 27, pa: 188, h: 54, double: 10, triple: 2, hr: 2, bb: 10, so: 20, hbp: 0, sb: 2, cs: 1, sec: 'LF', fld: 57, arm: 63, rk: true },
      { id: 'bennega01', name: 'Gary Bennett', pos: 'C', bats: 'R', age: 35, pa: 170, h: 36, double: 6, triple: 0, hr: 2, bb: 11, so: 23, hbp: 1, sb: 0, cs: 1, fld: 76, arm: 60 },
      { id: 'stinnke01', name: 'Kelly Stinnett', pos: 'C', bats: 'R', age: 37, pa: 87, h: 16, double: 3, triple: 0, hr: 2, bb: 5, so: 24, hbp: 0, sb: 0, cs: 0, fld: 63, arm: 66 },
      { id: 'wilsopr01', name: 'Preston Wilson', pos: 'RF', bats: 'R', age: 32, pa: 68, h: 16, double: 3, triple: 0, hr: 2, bb: 4, so: 16, hbp: 1, sb: 1, cs: 0, sec: 'CF' },
    ],
    pitchers: [
      { id: 'wainwad01', name: 'Adam Wainwright', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 606, h: 206, hr: 14, bb: 69, so: 149, hbp: 9, er: 82, w: 14, l: 12, sv: 0, fld: 71 },
      { id: 'loopebr01', name: 'Braden Looper', role: 'SP', throws: 'R', age: 32, g: 31, gs: 30, outs: 525, h: 183, hr: 19, bb: 51, so: 88, hbp: 5, er: 89, w: 12, l: 12, sv: 0, fld: 69 },
      { id: 'wellski01', name: 'Kip Wells', role: 'SP', throws: 'R', age: 30, g: 34, gs: 26, outs: 488, h: 185, hr: 18, bb: 80, so: 115, hbp: 10, er: 102, w: 7, l: 17, sv: 0, fld: 64 },
      { id: 'thompbr01', name: 'Brad Thompson', role: 'SP', throws: 'R', age: 25, g: 44, gs: 17, outs: 388, h: 150, hr: 19, bb: 41, so: 60, hbp: 13, er: 62, w: 8, l: 6, sv: 0, fld: 59 },
      { id: 'reyesan01', name: 'Anthony Reyes', role: 'SP', throws: 'R', age: 25, g: 22, gs: 20, outs: 322, h: 106, hr: 18, bb: 43, so: 81, hbp: 9, er: 67, w: 2, l: 14, sv: 0, fld: 86 },
      { id: 'isrinja01', name: 'Jason Isringhausen', role: 'CL', throws: 'R', age: 34, g: 63, gs: 0, outs: 196, h: 45, hr: 6, bb: 32, so: 54, hbp: 2, er: 19, w: 4, l: 0, sv: 32, fld: 71 },
      { id: 'frankry01', name: 'Ryan Franklin', role: 'RP', throws: 'R', age: 34, g: 69, gs: 0, outs: 240, h: 76, hr: 10, bb: 21, so: 40, hbp: 3, er: 34, w: 4, l: 4, sv: 1, fld: 60 },
      { id: 'sprinru01', name: 'Russ Springer', role: 'RP', throws: 'R', age: 38, g: 76, gs: 0, outs: 198, h: 45, hr: 7, bb: 19, so: 59, hbp: 3, er: 21, w: 8, l: 1, sv: 0, fld: 62 },
      { id: 'florera01', name: 'Randy Flores', role: 'RP', throws: 'L', age: 31, g: 70, gs: 0, outs: 165, h: 66, hr: 4, bb: 19, so: 50, hbp: 3, er: 28, w: 3, l: 0, sv: 1, fld: 60 },
      { id: 'jimenke01', name: 'Kelvin Jimenez', role: 'RP', throws: 'R', age: 26, g: 34, gs: 0, outs: 126, h: 56, hr: 2, bb: 17, so: 24, hbp: 4, er: 35, w: 3, l: 0, sv: 0, fld: 72, rk: true },
      { id: 'percitr01', name: 'Troy Percival', role: 'RP', throws: 'R', age: 37, g: 34, gs: 1, outs: 120, h: 25, hr: 4, bb: 11, so: 35, hbp: 1, er: 11, w: 3, l: 0, sv: 0, fld: 76 },
    ],
    reservePitchers: [
      { id: 'pineijo01', name: 'Joel Pineiro', role: 'SP', throws: 'R', age: 28, g: 42, gs: 11, outs: 293, h: 113, hr: 13, bb: 30, so: 54, hbp: 4, er: 57, w: 7, l: 5, sv: 0, fld: 68 },
      { id: 'welleto01', name: 'Todd Wellemeyer', role: 'SP', throws: 'R', age: 28, g: 32, gs: 11, outs: 238, h: 74, hr: 10, bb: 45, so: 59, hbp: 3, er: 40, w: 3, l: 3, sv: 0, fld: 77 },
      { id: 'johnsty01', name: 'Tyler Johnson', role: 'RP', throws: 'L', age: 26, g: 55, gs: 0, outs: 114, h: 31, hr: 4, bb: 19, so: 29, hbp: 3, er: 18, w: 1, l: 1, sv: 0, fld: 56, rk: true },
      { id: 'cavazan01', name: 'Andy Cavazos', role: 'RP', throws: 'R', age: 26, g: 17, gs: 0, outs: 60, h: 27, hr: 5, bb: 16, so: 15, hbp: 2, er: 23, w: 0, l: 0, sv: 0, fld: 69, rk: true },
      { id: 'falkebr01', name: 'Brian Falkenborg', role: 'RP', throws: 'R', age: 29, g: 16, gs: 0, outs: 56, h: 22, hr: 2, bb: 7, so: 16, hbp: 1, er: 10, w: 0, l: 1, sv: 0, fld: 61, rk: true },
    ],
  },
  // ARI (ARI 2007)
  {
    franchiseId: 'ARI',
    season: 2007,
    batters: [
      { id: 'snydech02', name: 'Chris Snyder', pos: 'C', bats: 'R', age: 26, pa: 380, h: 81, double: 18, triple: 0, hr: 11, bb: 40, so: 72, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 73, arm: 79 },
      { id: 'jacksco01', name: 'Conor Jackson', pos: '1B', bats: 'R', age: 25, pa: 477, h: 118, double: 26, triple: 1, hr: 14, bb: 50, so: 55, hbp: 6, sb: 1, cs: 1, sec: '3B', fld: 59 },
      { id: 'hudsoor01', name: 'Orlando Hudson', pos: '2B', bats: 'S', age: 29, pa: 601, h: 152, double: 30, triple: 8, hr: 12, bb: 60, so: 80, hbp: 2, sb: 9, cs: 3, sec: 'SS', fld: 72 },
      { id: 'reynoma01', name: 'Mark Reynolds', pos: '3B', bats: 'R', age: 23, pa: 414, h: 102, double: 20, triple: 4, hr: 17, bb: 37, so: 129, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 55, rk: true },
      { id: 'drewst01', name: 'Stephen Drew', pos: 'SS', bats: 'L', age: 24, pa: 619, h: 139, double: 29, triple: 7, hr: 12, bb: 56, so: 107, hbp: 2, sb: 8, cs: 0, sec: '2B', fld: 68 },
      { id: 'byrneer01', name: 'Eric Byrnes', pos: 'LF', bats: 'R', age: 31, pa: 698, h: 173, double: 35, triple: 6, hr: 23, bb: 50, so: 100, hbp: 9, sb: 38, cs: 5, sec: 'CF', fld: 78, arm: 76 },
      { id: 'youngch04', name: 'Chris Young', pos: 'CF', bats: 'R', age: 23, pa: 624, h: 135, double: 29, triple: 3, hr: 31, bb: 43, so: 138, hbp: 6, sb: 26, cs: 6, sec: 'LF', fld: 63, arm: 66, rk: true },
      { id: 'quentca01', name: 'Carlos Quentin', pos: 'RF', bats: 'R', age: 24, pa: 263, h: 52, double: 17, triple: 1, hr: 7, bb: 19, so: 52, hbp: 11, sb: 2, cs: 1, sec: 'LF', fld: 76, arm: 63 },
      { id: 'hairssc01', name: 'Scott Hairston', pos: 'DH', bats: 'R', age: 27, pa: 294, h: 65, double: 19, triple: 2, hr: 10, bb: 25, so: 57, hbp: 1, sb: 2, cs: 0, sec: 'LF', fld: 57, arm: 72 },
    ],
    bench: [
      { id: 'tracych01', name: 'Chad Tracy', pos: '3B', bats: 'L', age: 27, pa: 260, h: 66, double: 17, triple: 1, hr: 9, bb: 23, so: 46, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 62 },
      { id: 'clarkto02', name: 'Tony Clark', pos: '1B', bats: 'S', age: 35, pa: 245, h: 56, double: 8, triple: 1, hr: 16, bb: 22, so: 59, hbp: 1, sb: 0, cs: 0, fld: 73 },
      { id: 'montemi01', name: 'Miguel Montero', pos: 'C', bats: 'L', age: 23, pa: 244, h: 48, double: 7, triple: 0, hr: 10, bb: 20, so: 35, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 64, arm: 67, rk: true },
      { id: 'callaal01', name: 'Alberto Callaspo', pos: '3B', bats: 'S', age: 24, pa: 156, h: 31, double: 7, triple: 1, hr: 0, bb: 10, so: 15, hbp: 1, sb: 1, cs: 1, sec: '2B', rk: true },
      { id: 'uptonju01', name: 'Justin Upton', pos: 'RF', bats: 'R', age: 19, pa: 152, h: 31, double: 8, triple: 3, hr: 2, bb: 11, so: 37, hbp: 1, sb: 2, cs: 0, sec: 'LF', fld: 47, arm: 63, rk: true },
    ],
    reserveBatters: [
      { id: 'ojedaau01', name: 'Augie Ojeda', pos: '2B', bats: 'S', age: 32, pa: 132, h: 31, double: 2, triple: 2, hr: 1, bb: 15, so: 13, hbp: 0, sb: 1, cs: 0, sec: 'SS', fld: 96 },
      { id: 'salazje01', name: 'Jeff Salazar', pos: 'RF', bats: 'L', age: 26, pa: 103, h: 25, double: 6, triple: 1, hr: 1, bb: 11, so: 21, hbp: 0, sb: 2, cs: 0, sec: 'CF', fld: 89, arm: 88, rk: true },
      { id: 'hammoro01', name: 'Robby Hammock', pos: 'C', bats: 'R', age: 30, pa: 49, h: 11, double: 3, triple: 0, hr: 0, bb: 3, so: 7, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'webbbr01', name: 'Brandon Webb', role: 'SP', throws: 'R', age: 28, g: 34, gs: 34, outs: 709, h: 217, hr: 15, bb: 63, so: 187, hbp: 5, er: 82, w: 18, l: 10, sv: 0, fld: 83 },
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 613, h: 241, hr: 30, bb: 77, so: 108, hbp: 6, er: 109, w: 11, l: 11, sv: 0, fld: 82 },
      { id: 'davisdo02', name: 'Doug Davis', role: 'SP', throws: 'L', age: 31, g: 33, gs: 33, outs: 578, h: 202, hr: 21, bb: 95, so: 156, hbp: 5, er: 96, w: 13, l: 12, sv: 0, fld: 74 },
      { id: 'owingmi01', name: 'Micah Owings', role: 'SP', throws: 'R', age: 24, g: 29, gs: 27, outs: 458, h: 146, hr: 20, bb: 50, so: 106, hbp: 14, er: 73, w: 8, l: 8, sv: 0, fld: 64, rk: true },
      { id: 'gonzaed01', name: 'Edgar Gonzalez', role: 'SP', throws: 'R', age: 24, g: 32, gs: 12, outs: 306, h: 110, hr: 18, bb: 27, so: 63, hbp: 5, er: 56, w: 8, l: 4, sv: 0, fld: 60 },
      { id: 'valvejo01', name: 'Jose Valverde', role: 'CL', throws: 'R', age: 29, g: 65, gs: 0, outs: 193, h: 51, hr: 7, bb: 25, so: 79, hbp: 3, er: 25, w: 1, l: 4, sv: 47, fld: 81 },
      { id: 'penato03', name: 'Tony Pena', role: 'RP', throws: 'R', age: 25, g: 75, gs: 0, outs: 256, h: 69, hr: 10, bb: 29, so: 61, hbp: 4, er: 35, w: 5, l: 4, sv: 2, fld: 82, rk: true },
      { id: 'lyonbr01', name: 'Brandon Lyon', role: 'RP', throws: 'R', age: 27, g: 73, gs: 0, outs: 222, h: 73, hr: 5, bb: 22, so: 43, hbp: 1, er: 27, w: 6, l: 4, sv: 2, fld: 65 },
      { id: 'cruzju02', name: 'Juan Cruz', role: 'RP', throws: 'R', age: 28, g: 53, gs: 0, outs: 183, h: 49, hr: 6, bb: 31, so: 69, hbp: 6, er: 26, w: 6, l: 1, sv: 0, fld: 63 },
      { id: 'nippedu01', name: 'Dustin Nippert', role: 'RP', throws: 'R', age: 26, g: 36, gs: 0, outs: 136, h: 48, hr: 7, bb: 19, so: 37, hbp: 0, er: 31, w: 1, l: 1, sv: 0, fld: 69, rk: true },
      { id: 'slatedo01', name: 'Doug Slaten', role: 'RP', throws: 'L', age: 27, g: 61, gs: 0, outs: 109, h: 39, hr: 4, bb: 14, so: 28, hbp: 0, er: 10, w: 3, l: 2, sv: 0, fld: 71, rk: true },
    ],
    reservePitchers: [
      { id: 'petityu01', name: 'Yusmeiro Petit', role: 'SP', throws: 'R', age: 22, g: 14, gs: 10, outs: 171, h: 65, hr: 12, bb: 18, so: 39, hbp: 0, er: 35, w: 3, l: 4, sv: 0, fld: 66, rk: true },
      { id: 'johnsra05', name: 'Randy Johnson', role: 'SP', throws: 'L', age: 43, g: 10, gs: 10, outs: 170, h: 53, hr: 8, bb: 14, so: 54, hbp: 3, er: 28, w: 4, l: 3, sv: 0, fld: 63 },
      { id: 'meddebr01', name: 'Brandon Medders', role: 'RP', throws: 'R', age: 27, g: 30, gs: 0, outs: 88, h: 30, hr: 4, bb: 13, so: 22, hbp: 1, er: 12, w: 1, l: 2, sv: 0, fld: 74 },
      { id: 'pegueja01', name: 'Jailen Peguero', role: 'RP', throws: 'R', age: 26, g: 18, gs: 0, outs: 44, h: 17, hr: 2, bb: 13, so: 9, hbp: 1, er: 15, w: 1, l: 0, sv: 0, fld: 57, rk: true },
    ],
  },
  // COL (COL 2007)
  {
    franchiseId: 'COL',
    season: 2007,
    batters: [
      { id: 'torreyo01', name: 'Yorvit Torrealba', pos: 'C', bats: 'R', age: 28, pa: 443, h: 100, double: 24, triple: 2, hr: 9, bb: 30, so: 80, hbp: 6, sb: 3, cs: 2, sec: '1B', fld: 73, arm: 65 },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 33, pa: 682, h: 176, double: 43, triple: 3, hr: 17, bb: 109, so: 74, hbp: 5, sb: 2, cs: 1, sec: 'LF', fld: 76 },
      { id: 'matsuka01', name: 'Kazuo Matsui', pos: '2B', bats: 'S', age: 31, pa: 453, h: 114, double: 22, triple: 6, hr: 4, bb: 31, so: 71, hbp: 1, sb: 25, cs: 3, sec: 'SS', fld: 89 },
      { id: 'atkinga01', name: 'Garrett Atkins', pos: '3B', bats: 'R', age: 27, pa: 684, h: 186, double: 40, triple: 1, hr: 25, bb: 69, so: 87, hbp: 4, sb: 3, cs: 1, sec: '1B', fld: 59 },
      { id: 'tulowtr01', name: 'Troy Tulowitzki', pos: 'SS', bats: 'R', age: 22, pa: 682, h: 174, double: 31, triple: 5, hr: 22, bb: 58, so: 133, hbp: 9, sb: 8, cs: 5, sec: '2B', fld: 100, rk: true },
      { id: 'hollima01', name: 'Matt Holliday', pos: 'LF', bats: 'R', age: 27, pa: 713, h: 212, double: 47, triple: 6, hr: 35, bb: 57, so: 121, hbp: 12, sb: 12, cs: 4, sec: 'RF', fld: 65, arm: 67 },
      { id: 'taverwi01', name: 'Willy Taveras', pos: 'CF', bats: 'R', age: 25, pa: 408, h: 111, double: 12, triple: 3, hr: 1, bb: 21, so: 60, hbp: 7, sb: 27, cs: 8, sec: 'LF', fld: 69, arm: 77 },
      { id: 'hawpebr01', name: 'Brad Hawpe', pos: 'RF', bats: 'L', age: 28, pa: 606, h: 150, double: 32, triple: 5, hr: 26, bb: 79, so: 133, hbp: 2, sb: 2, cs: 3, sec: 'LF', fld: 54, arm: 66 },
      { id: 'spilbry01', name: 'Ryan Spilborghs', pos: 'DH', bats: 'R', age: 27, pa: 300, h: 79, double: 13, triple: 2, hr: 10, bb: 26, so: 46, hbp: 1, sb: 5, cs: 2, sec: 'RF', fld: 51, arm: 64 },
    ],
    bench: [
      { id: 'carroja01', name: 'Jamey Carroll', pos: '2B', bats: 'R', age: 33, pa: 268, h: 61, double: 10, triple: 2, hr: 2, bb: 28, so: 35, hbp: 3, sb: 5, cs: 4, sec: '3B', fld: 81 },
      { id: 'iannech01', name: 'Chris Iannetta', pos: 'C', bats: 'R', age: 24, pa: 234, h: 45, double: 8, triple: 2, hr: 4, bb: 30, so: 55, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 74, arm: 68, rk: true },
      { id: 'bakerje03', name: 'Jeff Baker', pos: '1B', bats: 'R', age: 26, pa: 159, h: 37, double: 6, triple: 3, hr: 6, bb: 12, so: 40, hbp: 2, sb: 1, cs: 0, sec: '3B', rk: true },
      { id: 'sullico01', name: 'Cory Sullivan', pos: 'CF', bats: 'L', age: 27, pa: 153, h: 38, double: 7, triple: 2, hr: 1, bb: 10, so: 31, hbp: 1, sb: 3, cs: 1, sec: 'LF', fld: 77, arm: 63 },
      { id: 'finlest01', name: 'Steve Finley', pos: 'CF', bats: 'L', age: 42, pa: 102, h: 21, double: 4, triple: 2, hr: 2, bb: 8, so: 12, hbp: 0, sb: 1, cs: 0, sec: 'RF', fld: 74, arm: 69 },
    ],
    reserveBatters: [
      { id: 'quintom01', name: 'Omar Quintanilla', pos: '2B', bats: 'L', age: 25, pa: 75, h: 15, double: 3, triple: 1, hr: 0, bb: 5, so: 13, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 79 },
      { id: 'stewaia01', name: 'Ian Stewart', pos: '3B', bats: 'L', age: 22, pa: 46, h: 9, double: 4, triple: 0, hr: 1, bb: 1, so: 17, hbp: 2, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'francje01', name: 'Jeff Francis', role: 'SP', throws: 'L', age: 26, g: 34, gs: 34, outs: 646, h: 228, hr: 24, bb: 69, so: 150, hbp: 10, er: 105, w: 17, l: 9, sv: 0, fld: 75 },
      { id: 'cookaa01', name: 'Aaron Cook', role: 'SP', throws: 'R', age: 28, g: 25, gs: 25, outs: 498, h: 183, hr: 14, bb: 42, so: 64, hbp: 6, er: 76, w: 8, l: 7, sv: 0, fld: 86 },
      { id: 'foggjo01', name: 'Josh Fogg', role: 'SP', throws: 'R', age: 30, g: 30, gs: 29, outs: 497, h: 196, hr: 24, bb: 58, so: 91, hbp: 9, er: 95, w: 10, l: 9, sv: 0, fld: 72 },
      { id: 'hirshja01', name: 'Jason Hirsh', role: 'SP', throws: 'R', age: 25, g: 19, gs: 19, outs: 337, h: 105, hr: 20, bb: 49, so: 74, hbp: 3, er: 62, w: 5, l: 7, sv: 0, fld: 63, rk: true },
      { id: 'jimenub01', name: 'Ubaldo Jimenez', role: 'SP', throws: 'R', age: 23, g: 15, gs: 15, outs: 246, h: 69, hr: 10, bb: 37, so: 66, hbp: 6, er: 39, w: 4, l: 4, sv: 0, fld: 73, rk: true },
      { id: 'fuentbr01', name: 'Brian Fuentes', role: 'CL', throws: 'L', age: 31, g: 64, gs: 0, outs: 184, h: 46, hr: 6, bb: 24, so: 63, hbp: 7, er: 21, w: 3, l: 5, sv: 20, fld: 82 },
      { id: 'buchhta01', name: 'Taylor Buchholz', role: 'RP', throws: 'R', age: 25, g: 41, gs: 8, outs: 281, h: 99, hr: 12, bb: 24, so: 63, hbp: 2, er: 52, w: 6, l: 5, sv: 0, fld: 75 },
      { id: 'corpama01', name: 'Manny Corpas', role: 'RP', throws: 'R', age: 24, g: 78, gs: 0, outs: 234, h: 67, hr: 6, bb: 20, so: 59, hbp: 3, er: 21, w: 4, l: 2, sv: 19, fld: 74, rk: true },
      { id: 'juliojo01', name: 'Jorge Julio', role: 'RP', throws: 'R', age: 28, g: 68, gs: 0, outs: 186, h: 63, hr: 10, bb: 31, so: 66, hbp: 2, er: 36, w: 0, l: 5, sv: 0, fld: 74 },
      { id: 'affelje01', name: 'Jeremy Affeldt', role: 'RP', throws: 'L', age: 28, g: 75, gs: 0, outs: 177, h: 54, hr: 5, bb: 32, so: 37, hbp: 2, er: 31, w: 4, l: 3, sv: 0, fld: 62 },
      { id: 'hawkila01', name: 'LaTroy Hawkins', role: 'RP', throws: 'R', age: 34, g: 62, gs: 0, outs: 166, h: 56, hr: 5, bb: 16, so: 29, hbp: 0, er: 23, w: 2, l: 5, sv: 0, fld: 66 },
    ],
    reservePitchers: [
      { id: 'lopezro01', name: 'Rodrigo Lopez', role: 'SP', throws: 'R', age: 31, g: 14, gs: 14, outs: 238, h: 88, hr: 12, bb: 23, so: 48, hbp: 1, er: 44, w: 5, l: 4, sv: 0, fld: 68 },
      { id: 'hergema01', name: 'Matt Herges', role: 'RP', throws: 'R', age: 37, g: 35, gs: 0, outs: 146, h: 45, hr: 4, bb: 16, so: 24, hbp: 1, er: 19, w: 5, l: 1, sv: 0, fld: 69 },
      { id: 'moralfr01', name: 'Franklin Morales', role: 'RP', throws: 'L', age: 21, g: 8, gs: 8, outs: 118, h: 34, hr: 2, bb: 14, so: 26, hbp: 2, er: 15, w: 3, l: 2, sv: 0, fld: 76, rk: true },
      { id: 'desseel01', name: 'Elmer Dessens', role: 'RP', throws: 'R', age: 36, g: 17, gs: 5, outs: 102, h: 41, hr: 4, bb: 11, so: 23, hbp: 0, er: 20, w: 2, l: 2, sv: 0, fld: 56 },
      { id: 'martito02', name: 'Tom Martin', role: 'RP', throws: 'L', age: 37, g: 26, gs: 0, outs: 77, h: 29, hr: 3, bb: 10, so: 16, hbp: 1, er: 15, w: 0, l: 0, sv: 0, fld: 73 },
    ],
  },
  // LAD (LAN 2007)
  {
    franchiseId: 'LAD',
    season: 2007,
    batters: [
      { id: 'martiru01', name: 'Russell Martin', pos: 'C', bats: 'R', age: 24, pa: 620, h: 157, double: 33, triple: 4, hr: 17, bb: 65, so: 84, hbp: 6, sb: 18, cs: 8, sec: '1B', fld: 72, arm: 77 },
      { id: 'garcino01', name: 'Nomar Garciaparra', pos: '1B', bats: 'R', age: 33, pa: 466, h: 124, double: 22, triple: 1, hr: 12, bb: 33, so: 36, hbp: 3, sb: 3, cs: 1, sec: '3B', fld: 60 },
      { id: 'kentje01', name: 'Jeff Kent', pos: '2B', bats: 'R', age: 39, pa: 562, h: 145, double: 34, triple: 2, hr: 20, bb: 61, so: 70, hbp: 7, sb: 2, cs: 3, sec: '3B', fld: 60 },
      { id: 'betemwi01', name: 'Wilson Betemit', pos: '3B', bats: 'S', age: 25, pa: 284, h: 63, double: 14, triple: 1, hr: 12, bb: 30, so: 74, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 47 },
      { id: 'furcara01', name: 'Rafael Furcal', pos: 'SS', bats: 'S', age: 29, pa: 642, h: 163, double: 26, triple: 6, hr: 9, bb: 59, so: 75, hbp: 1, sb: 31, cs: 8, sec: '2B', fld: 85 },
      { id: 'gonzalu01', name: 'Luis Gonzalez', pos: 'LF', bats: 'L', age: 39, pa: 526, h: 126, double: 31, triple: 1, hr: 15, bb: 56, so: 55, hbp: 5, sb: 3, cs: 1, fld: 60, arm: 64 },
      { id: 'pierrju01', name: 'Juan Pierre', pos: 'CF', bats: 'L', age: 29, pa: 729, h: 195, double: 26, triple: 10, hr: 1, bb: 34, so: 38, hbp: 7, sb: 60, cs: 17, sec: 'LF', fld: 58, arm: 61 },
      { id: 'ethiean01', name: 'Andre Ethier', pos: 'RF', bats: 'L', age: 25, pa: 505, h: 132, double: 29, triple: 4, hr: 13, bb: 43, so: 75, hbp: 5, sb: 2, cs: 5, sec: 'LF', fld: 70, arm: 76 },
      { id: 'saenzol01', name: 'Olmedo Saenz', pos: 'DH', bats: 'R', age: 36, pa: 132, h: 29, double: 8, triple: 0, hr: 6, bb: 12, so: 27, hbp: 3, sb: 0, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'loneyja01', name: 'James Loney', pos: '1B', bats: 'L', age: 23, pa: 375, h: 111, double: 18, triple: 6, hr: 15, bb: 28, so: 46, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 69, rk: true },
      { id: 'kempma01', name: 'Matt Kemp', pos: 'RF', bats: 'R', age: 22, pa: 311, h: 93, double: 12, triple: 4, hr: 11, bb: 16, so: 75, hbp: 0, sb: 10, cs: 4, sec: 'CF', fld: 59, arm: 63 },
      { id: 'abreuto01', name: 'Tony Abreu', pos: '3B', bats: 'S', age: 22, pa: 178, h: 45, double: 14, triple: 1, hr: 2, bb: 7, so: 21, hbp: 3, sb: 0, cs: 0, sec: '2B', fld: 88, rk: true },
      { id: 'martira03', name: 'Ramon Martinez', pos: '2B', bats: 'R', age: 34, pa: 147, h: 31, double: 4, triple: 0, hr: 1, bb: 11, so: 15, hbp: 0, sb: 0, cs: 0, sec: 'SS', fld: 40 },
      { id: 'clarkbr02', name: 'Brady Clark', pos: 'LF', bats: 'R', age: 34, pa: 123, h: 30, double: 5, triple: 1, hr: 1, bb: 11, so: 14, hbp: 3, sb: 1, cs: 2, sec: 'CF', fld: 63, arm: 54 },
    ],
    reserveBatters: [
      { id: 'larocan01', name: 'Andy LaRoche', pos: '3B', bats: 'R', age: 23, pa: 115, h: 21, double: 5, triple: 0, hr: 1, bb: 20, so: 24, hbp: 1, sb: 2, cs: 1, sec: '1B', fld: 71, rk: true },
      { id: 'liebemi01', name: 'Mike Lieberthal', pos: 'C', bats: 'R', age: 35, pa: 82, h: 19, double: 4, triple: 0, hr: 2, bb: 4, so: 8, hbp: 2, sb: 0, cs: 0, fld: 70, arm: 71 },
      { id: 'valdewi01', name: 'Wilson Valdez', pos: '2B', bats: 'R', age: 29, pa: 80, h: 16, double: 3, triple: 1, hr: 0, bb: 4, so: 13, hbp: 1, sb: 1, cs: 0, sec: 'SS' },
    ],
    pitchers: [
      { id: 'pennybr01', name: 'Brad Penny', role: 'SP', throws: 'R', age: 29, g: 33, gs: 33, outs: 624, h: 210, hr: 14, bb: 65, so: 145, hbp: 6, er: 82, w: 16, l: 4, sv: 0, fld: 70 },
      { id: 'lowede01', name: 'Derek Lowe', role: 'SP', throws: 'R', age: 34, g: 33, gs: 32, outs: 598, h: 198, hr: 18, bb: 54, so: 132, hbp: 3, er: 83, w: 12, l: 14, sv: 0, fld: 73 },
      { id: 'billich01', name: 'Chad Billingsley', role: 'SP', throws: 'R', age: 22, g: 43, gs: 20, outs: 441, h: 133, hr: 14, bb: 71, so: 125, hbp: 3, er: 55, w: 12, l: 5, sv: 0, fld: 70 },
      { id: 'tomkobr01', name: 'Brett Tomko', role: 'SP', throws: 'R', age: 34, g: 40, gs: 19, outs: 394, h: 148, hr: 18, bb: 43, so: 96, hbp: 3, er: 75, w: 4, l: 12, sv: 0, fld: 74 },
      { id: 'hendrma01', name: 'Mark Hendrickson', role: 'SP', throws: 'L', age: 33, g: 39, gs: 15, outs: 368, h: 138, hr: 14, bb: 36, so: 78, hbp: 2, er: 67, w: 4, l: 8, sv: 0, fld: 65 },
      { id: 'saitota01', name: 'Takashi Saito', role: 'CL', throws: 'R', age: 37, g: 63, gs: 0, outs: 193, h: 35, hr: 4, bb: 15, so: 81, hbp: 2, er: 12, w: 2, l: 1, sv: 39, fld: 80 },
      { id: 'broxtjo01', name: 'Jonathan Broxton', role: 'RP', throws: 'R', age: 23, g: 83, gs: 0, outs: 246, h: 67, hr: 6, bb: 30, so: 101, hbp: 1, er: 26, w: 4, l: 4, sv: 2, fld: 68 },
      { id: 'seaneru01', name: 'Rudy Seanez', role: 'RP', throws: 'R', age: 38, g: 73, gs: 0, outs: 228, h: 76, hr: 10, bb: 32, so: 78, hbp: 3, er: 33, w: 6, l: 3, sv: 1, fld: 74 },
      { id: 'beimejo01', name: 'Joe Beimel', role: 'RP', throws: 'L', age: 30, g: 83, gs: 0, outs: 202, h: 65, hr: 3, bb: 22, so: 34, hbp: 1, er: 26, w: 4, l: 2, sv: 1, fld: 70 },
      { id: 'stulter01', name: 'Eric Stults', role: 'RP', throws: 'L', age: 27, g: 12, gs: 5, outs: 116, h: 48, hr: 6, bb: 17, so: 26, hbp: 1, er: 25, w: 1, l: 4, sv: 0, fld: 84, rk: true },
      { id: 'loaizes01', name: 'Esteban Loaiza', role: 'RP', throws: 'R', age: 35, g: 7, gs: 7, outs: 112, h: 42, hr: 5, bb: 12, so: 26, hbp: 1, er: 20, w: 2, l: 4, sv: 0, fld: 65 },
    ],
    reservePitchers: [
      { id: 'wolfra02', name: 'Randy Wolf', role: 'SP', throws: 'L', age: 30, g: 18, gs: 18, outs: 308, h: 110, hr: 14, bb: 42, so: 87, hbp: 6, er: 55, w: 9, l: 6, sv: 0, fld: 69 },
      { id: 'kuoho01', name: 'Hung-Chih Kuo', role: 'RP', throws: 'L', age: 25, g: 8, gs: 6, outs: 91, h: 31, hr: 2, bb: 16, so: 33, hbp: 1, er: 19, w: 1, l: 4, sv: 0, fld: 70 },
      { id: 'houltdj01', name: 'D. J. Houlton', role: 'RP', throws: 'R', age: 27, g: 18, gs: 0, outs: 84, h: 29, hr: 5, bb: 9, so: 19, hbp: 1, er: 14, w: 0, l: 2, sv: 0, fld: 62 },
      { id: 'schmija01', name: 'Jason Schmidt', role: 'RP', throws: 'R', age: 34, g: 6, gs: 6, outs: 77, h: 26, hr: 3, bb: 12, so: 25, hbp: 1, er: 13, w: 1, l: 4, sv: 0, fld: 60 },
      { id: 'tsaoch01', name: 'Chin-hui Tsao', role: 'RP', throws: 'R', age: 26, g: 21, gs: 0, outs: 74, h: 20, hr: 3, bb: 8, so: 15, hbp: 1, er: 12, w: 0, l: 1, sv: 0, fld: 65 },
    ],
  },
  // SDP (SDN 2007)
  {
    franchiseId: 'SDP',
    season: 2007,
    batters: [
      { id: 'bardjo01', name: 'Josh Bard', pos: 'C', bats: 'S', age: 29, pa: 443, h: 115, double: 28, triple: 1, hr: 8, bb: 49, so: 60, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 78, arm: 55 },
      { id: 'gonzaad01', name: 'Adrian Gonzalez', pos: '1B', bats: 'L', age: 25, pa: 720, h: 186, double: 44, triple: 2, hr: 29, bb: 62, so: 137, hbp: 3, sb: 0, cs: 0, sec: '3B', fld: 82 },
      { id: 'gilesma01', name: 'Marcus Giles', pos: '2B', bats: 'R', age: 29, pa: 476, h: 106, double: 24, triple: 2, hr: 7, bb: 46, so: 81, hbp: 4, sb: 9, cs: 3, sec: 'SS', fld: 78 },
      { id: 'kouzmke01', name: 'Kevin Kouzmanoff', pos: '3B', bats: 'R', age: 25, pa: 534, h: 131, double: 29, triple: 2, hr: 19, bb: 33, so: 95, hbp: 9, sb: 1, cs: 0, sec: '1B', fld: 54, rk: true },
      { id: 'greenkh01', name: 'Khalil Greene', pos: 'SS', bats: 'R', age: 27, pa: 659, h: 152, double: 42, triple: 3, hr: 25, bb: 39, so: 127, hbp: 7, sb: 5, cs: 0, sec: '2B', fld: 71 },
      { id: 'sledgte01', name: 'Terrmel Sledge', pos: 'LF', bats: 'L', age: 30, pa: 233, h: 43, double: 9, triple: 0, hr: 7, bb: 27, so: 57, hbp: 2, sb: 1, cs: 2, sec: 'RF', fld: 63, arm: 66 },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 34, pa: 651, h: 145, double: 35, triple: 7, hr: 22, bb: 68, so: 155, hbp: 7, sb: 21, cs: 6, sec: 'RF', fld: 63, arm: 67 },
      { id: 'gilesbr02', name: 'Brian Giles', pos: 'RF', bats: 'L', age: 36, pa: 552, h: 128, double: 28, triple: 2, hr: 12, bb: 76, so: 54, hbp: 4, sb: 6, cs: 5, sec: 'LF', fld: 55, arm: 60 },
      { id: 'blumge01', name: 'Geoff Blum', pos: 'DH', bats: 'S', age: 34, pa: 370, h: 83, double: 20, triple: 1, hr: 5, bb: 28, so: 54, hbp: 2, sb: 1, cs: 1, sec: '3B', fld: 62 },
    ],
    bench: [
      { id: 'cruzjo02', name: 'Jose Cruz', pos: 'LF', bats: 'S', age: 33, pa: 293, h: 59, double: 14, triple: 2, hr: 7, bb: 39, so: 64, hbp: 0, sb: 4, cs: 1, sec: 'CF', fld: 84, arm: 77 },
      { id: 'bradlmi01', name: 'Milton Bradley', pos: 'LF', bats: 'S', age: 29, pa: 244, h: 61, double: 9, triple: 1, hr: 11, bb: 29, so: 39, hbp: 2, sb: 5, cs: 1, sec: 'CF', fld: 66, arm: 70 },
      { id: 'branyru01', name: 'Russell Branyan', pos: '3B', bats: 'L', age: 31, pa: 194, h: 36, double: 7, triple: 0, hr: 11, bb: 27, so: 65, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 100 },
      { id: 'bowenro01', name: 'Rob Bowen', pos: 'C', bats: 'S', age: 26, pa: 188, h: 37, double: 10, triple: 0, hr: 4, bb: 26, so: 56, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 67, arm: 59 },
      { id: 'bocachi01', name: 'Hiram Bocachica', pos: 'RF', bats: 'R', age: 31, pa: 88, h: 16, double: 3, triple: 0, hr: 2, bb: 8, so: 19, hbp: 0, sb: 3, cs: 2, sec: 'CF', fld: 71, arm: 78 },
    ],
    reserveBatters: [
      { id: 'laforpe01', name: 'Pete LaForest', pos: 'C', bats: 'L', age: 29, pa: 43, h: 9, double: 1, triple: 0, hr: 1, bb: 6, so: 13, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'mcanupa01', name: 'Paul McAnulty', pos: 'RF', bats: 'L', age: 26, pa: 43, h: 8, double: 1, triple: 0, hr: 1, bb: 4, so: 10, hbp: 0, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'peavyja01', name: 'Jake Peavy', role: 'SP', throws: 'R', age: 26, g: 34, gs: 34, outs: 670, h: 180, hr: 18, bb: 65, so: 236, hbp: 6, er: 76, w: 19, l: 6, sv: 0, fld: 76 },
      { id: 'maddugr01', name: 'Greg Maddux', role: 'SP', throws: 'R', age: 41, g: 34, gs: 34, outs: 594, h: 215, hr: 18, bb: 30, so: 110, hbp: 4, er: 92, w: 14, l: 11, sv: 0, fld: 94 },
      { id: 'youngch03', name: 'Chris Young', role: 'SP', throws: 'R', age: 28, g: 30, gs: 30, outs: 519, h: 129, hr: 17, bb: 66, so: 159, hbp: 7, er: 65, w: 9, l: 8, sv: 0, fld: 58 },
      { id: 'wellsda01', name: 'David Wells', role: 'SP', throws: 'L', age: 44, g: 29, gs: 29, outs: 472, h: 201, hr: 22, bb: 34, so: 85, hbp: 4, er: 89, w: 9, l: 9, sv: 0, fld: 65 },
      { id: 'germaju01', name: 'Justin Germano', role: 'SP', throws: 'R', age: 24, g: 26, gs: 23, outs: 400, h: 133, hr: 14, bb: 41, so: 80, hbp: 8, er: 66, w: 7, l: 10, sv: 0, fld: 80, rk: true },
      { id: 'hoffmtr01', name: 'Trevor Hoffman', role: 'CL', throws: 'R', age: 39, g: 61, gs: 0, outs: 172, h: 48, hr: 3, bb: 14, so: 47, hbp: 0, er: 17, w: 4, l: 5, sv: 42, fld: 85 },
      { id: 'bellhe01', name: 'Heath Bell', role: 'RP', throws: 'R', age: 29, g: 81, gs: 0, outs: 281, h: 75, hr: 5, bb: 28, so: 93, hbp: 2, er: 30, w: 6, l: 4, sv: 2, fld: 64 },
      { id: 'meredcl01', name: 'Cla Meredith', role: 'RP', throws: 'R', age: 24, g: 80, gs: 0, outs: 239, h: 84, hr: 6, bb: 16, so: 61, hbp: 3, er: 27, w: 5, l: 6, sv: 0, fld: 58 },
      { id: 'brocado01', name: 'Doug Brocail', role: 'RP', throws: 'R', age: 40, g: 67, gs: 0, outs: 230, h: 71, hr: 6, bb: 25, so: 47, hbp: 2, er: 32, w: 5, l: 1, sv: 0, fld: 62 },
      { id: 'linebsc01', name: 'Scott Linebrink', role: 'RP', throws: 'R', age: 30, g: 71, gs: 0, outs: 211, h: 66, hr: 10, bb: 23, so: 59, hbp: 1, er: 27, w: 5, l: 6, sv: 1, fld: 73 },
      { id: 'camerke01', name: 'Kevin Cameron', role: 'RP', throws: 'R', age: 27, g: 48, gs: 0, outs: 174, h: 55, hr: 0, bb: 36, so: 50, hbp: 0, er: 18, w: 2, l: 0, sv: 0, fld: 75, rk: true },
    ],
    reservePitchers: [
      { id: 'hampsju01', name: 'Justin Hampson', role: 'RP', throws: 'L', age: 27, g: 39, gs: 0, outs: 160, h: 51, hr: 3, bb: 16, so: 34, hbp: 3, er: 19, w: 2, l: 3, sv: 0, fld: 81, rk: true },
      { id: 'henslcl01', name: 'Clay Hensley', role: 'RP', throws: 'R', age: 27, g: 13, gs: 9, outs: 150, h: 54, hr: 4, bb: 25, so: 35, hbp: 1, er: 27, w: 2, l: 3, sv: 0, fld: 74 },
      { id: 'casseja01', name: 'Jack Cassel', role: 'RP', throws: 'R', age: 26, g: 6, gs: 4, outs: 68, h: 30, hr: 1, bb: 5, so: 11, hbp: 1, er: 10, w: 1, l: 1, sv: 0, fld: 63, rk: true },
      { id: 'thatcjo01', name: 'Joe Thatcher', role: 'RP', throws: 'L', age: 25, g: 22, gs: 0, outs: 63, h: 13, hr: 1, bb: 6, so: 16, hbp: 1, er: 3, w: 2, l: 2, sv: 0, fld: 80, rk: true },
      { id: 'ringro01', name: 'Royce Ring', role: 'RP', throws: 'L', age: 26, g: 26, gs: 0, outs: 60, h: 14, hr: 2, bb: 14, so: 19, hbp: 0, er: 6, w: 1, l: 0, sv: 0, fld: 61, rk: true },
    ],
  },
  // SFG (SFN 2007)
  {
    franchiseId: 'SFG',
    season: 2007,
    batters: [
      { id: 'molinbe01', name: 'Bengie Molina', pos: 'C', bats: 'R', age: 32, pa: 517, h: 138, double: 20, triple: 1, hr: 20, bb: 20, so: 52, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 64, arm: 74 },
      { id: 'kleskry01', name: 'Ryan Klesko', pos: '1B', bats: 'L', age: 36, pa: 411, h: 93, double: 24, triple: 2, hr: 8, bb: 51, so: 66, hbp: 1, sb: 4, cs: 2, sec: 'LF', fld: 78 },
      { id: 'durhara01', name: 'Ray Durham', pos: '2B', bats: 'S', age: 35, pa: 528, h: 120, double: 25, triple: 3, hr: 16, bb: 50, so: 66, hbp: 3, sb: 8, cs: 2, fld: 66 },
      { id: 'felizpe01', name: 'Pedro Feliz', pos: '3B', bats: 'R', age: 32, pa: 590, h: 138, double: 30, triple: 3, hr: 20, bb: 31, so: 86, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 81 },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 40, pa: 575, h: 136, double: 20, triple: 5, hr: 4, bb: 47, so: 47, hbp: 3, sb: 18, cs: 7, fld: 82 },
      { id: 'bondsba01', name: 'Barry Bonds', pos: 'LF', bats: 'L', age: 42, pa: 477, h: 95, double: 17, triple: 0, hr: 27, bb: 123, so: 52, hbp: 6, sb: 4, cs: 0, sec: 'CF', fld: 53, arm: 60 },
      { id: 'roberda07', name: 'Dave Roberts', pos: 'CF', bats: 'L', age: 35, pa: 442, h: 107, double: 16, triple: 9, hr: 3, bb: 42, so: 57, hbp: 1, sb: 32, cs: 6, sec: 'LF', fld: 70, arm: 71 },
      { id: 'winnra01', name: 'Randy Winn', pos: 'RF', bats: 'S', age: 33, pa: 653, h: 171, double: 40, triple: 3, hr: 14, bb: 46, so: 79, hbp: 7, sb: 14, cs: 6, sec: 'CF', fld: 78, arm: 64 },
      { id: 'aurilri01', name: 'Rich Aurilia', pos: 'DH', bats: 'R', age: 35, pa: 358, h: 91, double: 19, triple: 1, hr: 11, bb: 24, so: 43, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 62 },
    ],
    bench: [
      { id: 'frandke01', name: 'Kevin Frandsen', pos: '2B', bats: 'R', age: 25, pa: 296, h: 69, double: 12, triple: 1, hr: 5, bb: 19, so: 27, hbp: 7, sb: 3, cs: 3, sec: 'SS', fld: 70, rk: true },
      { id: 'davisra01', name: 'Rajai Davis', pos: 'CF', bats: 'R', age: 26, pa: 219, h: 52, double: 11, triple: 2, hr: 1, bb: 21, so: 29, hbp: 4, sb: 22, cs: 8, sec: 'LF', fld: 84, arm: 72, rk: true },
      { id: 'lewisfr02', name: 'Fred Lewis', pos: 'RF', bats: 'L', age: 26, pa: 180, h: 46, double: 6, triple: 2, hr: 3, bb: 18, so: 33, hbp: 3, sb: 5, cs: 1, sec: 'LF', fld: 85, arm: 56, rk: true },
      { id: 'ortmeda01', name: 'Daniel Ortmeier', pos: '1B', bats: 'S', age: 26, pa: 167, h: 44, double: 7, triple: 4, hr: 5, bb: 7, so: 41, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 74, rk: true },
      { id: 'sweenma01', name: 'Mark Sweeney', pos: '1B', bats: 'L', age: 37, pa: 141, h: 32, double: 8, triple: 1, hr: 3, bb: 15, so: 27, hbp: 2, sb: 1, cs: 0, sec: 'LF' },
    ],
    reserveBatters: [
      { id: 'schiena01', name: 'Nate Schierholtz', pos: 'RF', bats: 'L', age: 23, pa: 117, h: 34, double: 5, triple: 3, hr: 0, bb: 2, so: 19, hbp: 1, sb: 3, cs: 1, sec: 'LF', fld: 57, arm: 56, rk: true },
      { id: 'rodrigu01', name: 'Guillermo Rodriguez', pos: 'C', bats: 'R', age: 29, pa: 98, h: 22, double: 6, triple: 0, hr: 1, bb: 10, so: 17, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 53, arm: 73, rk: true },
      { id: 'alfonel01', name: 'Eliezer Alfonzo', pos: 'C', bats: 'R', age: 28, pa: 67, h: 16, double: 3, triple: 1, hr: 2, bb: 2, so: 18, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'cainma01', name: 'Matt Cain', role: 'SP', throws: 'R', age: 22, g: 32, gs: 32, outs: 600, h: 167, hr: 16, bb: 84, so: 171, hbp: 5, er: 84, w: 7, l: 16, sv: 0, fld: 68 },
      { id: 'morrima01', name: 'Matt Morris', role: 'SP', throws: 'R', age: 32, g: 32, gs: 32, outs: 596, h: 230, hr: 20, bb: 58, so: 111, hbp: 11, er: 108, w: 10, l: 11, sv: 0, fld: 75 },
      { id: 'zitoba01', name: 'Barry Zito', role: 'SP', throws: 'L', age: 29, g: 34, gs: 33, outs: 590, h: 179, hr: 24, bb: 83, so: 135, hbp: 8, er: 91, w: 11, l: 13, sv: 0, fld: 63 },
      { id: 'lowryno01', name: 'Noah Lowry', role: 'SP', throws: 'L', age: 26, g: 26, gs: 26, outs: 468, h: 159, hr: 16, bb: 72, so: 97, hbp: 5, er: 74, w: 14, l: 8, sv: 0, fld: 66 },
      { id: 'linceti01', name: 'Tim Lincecum', role: 'SP', throws: 'R', age: 23, g: 24, gs: 24, outs: 439, h: 122, hr: 12, bb: 65, so: 150, hbp: 2, er: 65, w: 7, l: 5, sv: 0, fld: 69, rk: true },
      { id: 'hennebr01', name: 'Brad Hennessey', role: 'CL', throws: 'R', age: 27, g: 69, gs: 0, outs: 205, h: 65, hr: 8, bb: 26, so: 34, hbp: 4, er: 30, w: 4, l: 5, sv: 19, fld: 77 },
      { id: 'correke01', name: 'Kevin Correia', role: 'RP', throws: 'R', age: 26, g: 59, gs: 8, outs: 305, h: 95, hr: 10, bb: 39, so: 80, hbp: 3, er: 40, w: 4, l: 7, sv: 0, fld: 76 },
      { id: 'messera01', name: 'Randy Messenger', role: 'RP', throws: 'R', age: 25, g: 60, gs: 0, outs: 193, h: 80, hr: 6, bb: 26, so: 41, hbp: 1, er: 34, w: 2, l: 4, sv: 1, fld: 73 },
      { id: 'chulkvi01', name: 'Vinnie Chulk', role: 'RP', throws: 'R', age: 28, g: 57, gs: 0, outs: 159, h: 52, hr: 5, bb: 17, so: 40, hbp: 2, er: 24, w: 5, l: 4, sv: 0, fld: 64 },
      { id: 'sanchjo01', name: 'Jonathan Sanchez', role: 'RP', throws: 'L', age: 24, g: 33, gs: 4, outs: 156, h: 55, hr: 6, bb: 29, so: 56, hbp: 5, er: 32, w: 1, l: 5, sv: 0, fld: 86, rk: true },
      { id: 'taschja01', name: 'Jack Taschner', role: 'RP', throws: 'L', age: 29, g: 63, gs: 0, outs: 150, h: 49, hr: 5, bb: 26, so: 47, hbp: 2, er: 30, w: 3, l: 1, sv: 0, fld: 80, rk: true },
    ],
    reservePitchers: [
      { id: 'ortizru01', name: 'Russ Ortiz', role: 'RP', throws: 'R', age: 33, g: 12, gs: 8, outs: 147, h: 60, hr: 8, bb: 25, so: 26, hbp: 3, er: 36, w: 2, l: 3, sv: 0, fld: 67 },
      { id: 'klinest02', name: 'Steve Kline', role: 'RP', throws: 'L', age: 34, g: 68, gs: 0, outs: 138, h: 53, hr: 4, bb: 21, so: 24, hbp: 1, er: 22, w: 1, l: 2, sv: 2, fld: 66 },
      { id: 'mischpa01', name: 'Pat Misch', role: 'RP', throws: 'L', age: 25, g: 18, gs: 4, outs: 121, h: 47, hr: 3, bb: 12, so: 26, hbp: 2, er: 19, w: 0, l: 4, sv: 0, fld: 77, rk: true },
      { id: 'atchisc01', name: 'Scott Atchison', role: 'RP', throws: 'R', age: 31, g: 22, gs: 0, outs: 92, h: 32, hr: 5, bb: 10, so: 26, hbp: 1, er: 15, w: 0, l: 0, sv: 0, fld: 80, rk: true },
      { id: 'wilsobr01', name: 'Brian Wilson', role: 'RP', throws: 'R', age: 25, g: 24, gs: 0, outs: 71, h: 19, hr: 1, bb: 10, so: 17, hbp: 1, er: 9, w: 1, l: 2, sv: 6, fld: 78, rk: true },
    ],
  },
];
