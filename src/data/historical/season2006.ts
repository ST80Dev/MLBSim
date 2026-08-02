import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 2006 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 2006
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
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents2006.ts`).
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

export const SEASON_2006: HistTeam[] = [
  // BAL (BAL 2006)
  {
    franchiseId: 'BAL',
    season: 2006,
    batters: [
      { id: 'hernara02', name: 'Ramon Hernandez', pos: 'C', bats: 'R', age: 30, pa: 560, h: 142, double: 29, triple: 2, hr: 21, bb: 39, so: 70, hbp: 8, sb: 1, cs: 0, sec: '1B', fld: 61, arm: 82 },
      { id: 'coninje01', name: 'Jeff Conine', pos: '1B', bats: 'R', age: 40, pa: 539, h: 135, double: 28, triple: 3, hr: 9, bb: 44, so: 71, hbp: 4, sb: 3, cs: 2, sec: 'LF', fld: 72 },
      { id: 'roberbr01', name: 'Brian Roberts', pos: '2B', bats: 'S', age: 28, pa: 629, h: 163, double: 39, triple: 4, hr: 11, bb: 60, so: 74, hbp: 1, sb: 31, cs: 9, sec: 'SS', fld: 60 },
      { id: 'morame01', name: 'Melvin Mora', pos: '3B', bats: 'R', age: 34, pa: 705, h: 179, double: 30, triple: 0, hr: 22, bb: 57, so: 106, hbp: 13, sb: 10, cs: 3, sec: 'SS', fld: 66 },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: 'SS', bats: 'R', age: 32, pa: 709, h: 207, double: 42, triple: 2, hr: 26, bb: 44, so: 79, hbp: 8, sb: 5, cs: 1, sec: '2B', fld: 73 },
      { id: 'faheybr01', name: 'Brandon Fahey', pos: 'LF', bats: 'L', age: 25, pa: 286, h: 59, double: 8, triple: 2, hr: 2, bb: 23, so: 48, hbp: 3, sb: 3, cs: 3, sec: 'RF', fld: 75, arm: 67, rk: true },
      { id: 'patteco01', name: 'Corey Patterson', pos: 'CF', bats: 'L', age: 26, pa: 498, h: 118, double: 19, triple: 4, hr: 16, bb: 24, so: 109, hbp: 3, sb: 31, cs: 7, sec: 'LF', fld: 83, arm: 71 },
      { id: 'markani01', name: 'Nick Markakis', pos: 'RF', bats: 'L', age: 22, pa: 542, h: 143, double: 25, triple: 2, hr: 16, bb: 43, so: 72, hbp: 3, sb: 2, cs: 0, sec: 'LF', fld: 85, arm: 70, rk: true },
      { id: 'millake01', name: 'Kevin Millar', pos: 'DH', bats: 'R', age: 34, pa: 503, h: 120, double: 27, triple: 0, hr: 13, bb: 55, so: 74, hbp: 11, sb: 1, cs: 1, sec: '1B', fld: 77 },
    ],
    bench: [
      { id: 'gibboja01', name: 'Jay Gibbons', pos: 'DH', bats: 'L', age: 29, pa: 378, h: 95, double: 22, triple: 1, hr: 15, bb: 27, so: 47, hbp: 1, sb: 0, cs: 0, sec: 'RF' },
      { id: 'lopezja01', name: 'Javy Lopez', pos: 'DH', bats: 'R', age: 35, pa: 364, h: 93, double: 20, triple: 1, hr: 11, bb: 20, so: 65, hbp: 4, sb: 0, cs: 0, sec: 'C' },
      { id: 'matoslu01', name: 'Luis Matos', pos: 'LF', bats: 'R', age: 27, pa: 149, h: 34, double: 8, triple: 1, hr: 2, bb: 9, so: 22, hbp: 3, sb: 6, cs: 2, sec: 'CF', fld: 77, arm: 64 },
      { id: 'newhada01', name: 'David Newhan', pos: 'CF', bats: 'L', age: 32, pa: 143, h: 32, double: 5, triple: 1, hr: 3, bb: 10, so: 24, hbp: 1, sb: 4, cs: 1, sec: 'RF', fld: 43, arm: 58 },
      { id: 'gomezch02', name: 'Chris Gomez', pos: '1B', bats: 'R', age: 35, pa: 142, h: 38, double: 6, triple: 0, hr: 1, bb: 11, so: 12, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 70 },
    ],
    reserveBatters: [
      { id: 'tatisfe01', name: 'Fernando Tatis', pos: 'DH', bats: 'R', age: 31, pa: 64, h: 14, double: 6, triple: 1, hr: 2, bb: 6, so: 17, hbp: 0, sb: 0, cs: 0, sec: '3B' },
      { id: 'fioreje01', name: 'Jeff Fiorentino', pos: 'LF', bats: 'L', age: 23, pa: 50, h: 11, double: 2, triple: 0, hr: 0, bb: 5, so: 6, hbp: 1, sb: 1, cs: 0, sec: 'CF', rk: true },
      { id: 'terrelu01', name: 'Luis Terrero', pos: 'LF', bats: 'R', age: 26, pa: 42, h: 9, double: 2, triple: 0, hr: 1, bb: 3, so: 10, hbp: 1, sb: 1, cs: 1, sec: 'CF' },
    ],
    pitchers: [
      { id: 'bedarer01', name: 'Erik Bedard', role: 'SP', throws: 'L', age: 27, g: 33, gs: 33, outs: 589, h: 195, hr: 16, bb: 75, so: 170, hbp: 6, er: 85, w: 15, l: 11, sv: 0, fld: 67 },
      { id: 'lopezro01', name: 'Rodrigo Lopez', role: 'SP', throws: 'R', age: 30, g: 36, gs: 29, outs: 567, h: 222, hr: 29, bb: 60, so: 128, hbp: 5, er: 111, w: 9, l: 18, sv: 0, fld: 65 },
      { id: 'bensokr01', name: 'Kris Benson', role: 'SP', throws: 'R', age: 31, g: 30, gs: 30, outs: 549, h: 193, hr: 27, bb: 56, so: 99, hbp: 7, er: 93, w: 11, l: 12, sv: 0, fld: 74 },
      { id: 'cabreda01', name: 'Daniel Cabrera', role: 'SP', throws: 'R', age: 25, g: 26, gs: 26, outs: 444, h: 134, hr: 12, bb: 94, so: 141, hbp: 6, er: 78, w: 9, l: 10, sv: 0, fld: 61 },
      { id: 'loewead01', name: 'Adam Loewen', role: 'SP', throws: 'L', age: 22, g: 22, gs: 19, outs: 337, h: 111, hr: 8, bb: 62, so: 98, hbp: 8, er: 67, w: 6, l: 6, sv: 0, rk: true },
      { id: 'raych01', name: 'Chris Ray', role: 'CL', throws: 'R', age: 24, g: 61, gs: 0, outs: 198, h: 47, hr: 9, bb: 27, so: 56, hbp: 1, er: 20, w: 4, l: 4, sv: 33, rk: true },
      { id: 'hawkila01', name: 'LaTroy Hawkins', role: 'RP', throws: 'R', age: 33, g: 60, gs: 0, outs: 181, h: 67, hr: 6, bb: 18, so: 39, hbp: 0, er: 27, w: 3, l: 2, sv: 0 },
      { id: 'willito02', name: 'Todd Williams', role: 'RP', throws: 'R', age: 35, g: 62, gs: 0, outs: 171, h: 67, hr: 6, bb: 20, so: 27, hbp: 3, er: 26, w: 2, l: 4, sv: 1 },
      { id: 'brittch01', name: 'Chris Britton', role: 'RP', throws: 'R', age: 23, g: 52, gs: 0, outs: 161, h: 46, hr: 4, bb: 17, so: 41, hbp: 0, er: 20, w: 0, l: 2, sv: 1, rk: true },
      { id: 'rlealse01', name: 'Sendy Rleal', role: 'RP', throws: 'R', age: 26, g: 42, gs: 0, outs: 140, h: 48, hr: 10, bb: 23, so: 19, hbp: 0, er: 23, w: 1, l: 1, sv: 0, rk: true },
      { id: 'birkiku01', name: 'Kurt Birkins', role: 'RP', throws: 'L', age: 25, g: 35, gs: 0, outs: 93, h: 25, hr: 4, bb: 16, so: 27, hbp: 3, er: 17, w: 5, l: 2, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'chenbr01', name: 'Bruce Chen', role: 'SP', throws: 'L', age: 29, g: 40, gs: 12, outs: 296, h: 117, hr: 22, bb: 35, so: 72, hbp: 3, er: 58, w: 0, l: 7, sv: 0 },
      { id: 'ortizru01', name: 'Russ Ortiz', role: 'SP', throws: 'R', age: 32, g: 26, gs: 11, outs: 189, h: 79, hr: 12, bb: 38, so: 39, hbp: 2, er: 47, w: 0, l: 8, sv: 0 },
      { id: 'halamjo01', name: 'John Halama', role: 'RP', throws: 'L', age: 34, g: 17, gs: 1, outs: 88, h: 37, hr: 4, bb: 9, so: 15, hbp: 2, er: 18, w: 3, l: 1, sv: 0 },
      { id: 'broweji01', name: 'Jim Brower', role: 'RP', throws: 'R', age: 33, g: 18, gs: 0, outs: 60, h: 28, hr: 3, bb: 12, so: 18, hbp: 2, er: 16, w: 0, l: 1, sv: 0 },
      { id: 'manonju01', name: 'Julio Manon', role: 'RP', throws: 'R', age: 33, g: 22, gs: 0, outs: 60, h: 23, hr: 5, bb: 16, so: 22, hbp: 2, er: 12, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // BOS (BOS 2006)
  {
    franchiseId: 'BOS',
    season: 2006,
    batters: [
      { id: 'varitja01', name: 'Jason Varitek', pos: 'C', bats: 'S', age: 34, pa: 416, h: 96, double: 21, triple: 1, hr: 14, bb: 47, so: 90, hbp: 3, sb: 2, cs: 1, fld: 78, arm: 64 },
      { id: 'youklke01', name: 'Kevin Youkilis', pos: '1B', bats: 'R', age: 27, pa: 680, h: 158, double: 41, triple: 2, hr: 13, bb: 92, so: 122, hbp: 10, sb: 4, cs: 2, sec: '3B', fld: 72 },
      { id: 'loretma01', name: 'Mark Loretta', pos: '2B', bats: 'R', age: 34, pa: 703, h: 184, double: 33, triple: 1, hr: 7, bb: 55, so: 57, hbp: 11, sb: 6, cs: 3, sec: 'SS', fld: 72 },
      { id: 'lowelmi01', name: 'Mike Lowell', pos: '3B', bats: 'R', age: 32, pa: 631, h: 154, double: 44, triple: 1, hr: 18, bb: 51, so: 64, hbp: 4, sb: 3, cs: 1, sec: '1B', fld: 93 },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 29, pa: 429, h: 99, double: 24, triple: 1, hr: 9, bb: 23, so: 74, hbp: 4, sb: 2, cs: 1, sec: '2B', fld: 72 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'LF', bats: 'R', age: 34, pa: 558, h: 143, double: 28, triple: 1, hr: 37, bb: 83, so: 102, hbp: 4, sb: 1, cs: 1, sec: 'RF', fld: 53, arm: 70 },
      { id: 'crispco01', name: 'Coco Crisp', pos: 'CF', bats: 'S', age: 26, pa: 452, h: 117, double: 25, triple: 2, hr: 10, bb: 31, so: 61, hbp: 0, sb: 16, cs: 5, sec: 'LF', fld: 70, arm: 65 },
      { id: 'nixontr01', name: 'Trot Nixon', pos: 'RF', bats: 'L', age: 32, pa: 453, h: 106, double: 26, triple: 1, hr: 10, bb: 55, so: 57, hbp: 5, sb: 1, cs: 1, sec: 'CF', fld: 74, arm: 70 },
      { id: 'ortizda01', name: 'David Ortiz', pos: 'DH', bats: 'L', age: 30, pa: 686, h: 168, double: 35, triple: 2, hr: 49, bb: 105, so: 121, hbp: 3, sb: 1, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'penawi01', name: 'Wily Mo Pena', pos: 'RF', bats: 'R', age: 24, pa: 304, h: 77, double: 14, triple: 1, hr: 15, bb: 19, so: 95, hbp: 3, sb: 1, cs: 1, sec: 'CF', fld: 73, arm: 74 },
      { id: 'coraal01', name: 'Alex Cora', pos: 'SS', bats: 'L', age: 30, pa: 264, h: 57, double: 7, triple: 3, hr: 3, bb: 18, so: 27, hbp: 7, sb: 5, cs: 2, sec: '2B', fld: 85 },
      { id: 'mirabdo01', name: 'Doug Mirabelli', pos: 'C', bats: 'R', age: 35, pa: 202, h: 39, double: 9, triple: 0, hr: 7, bb: 17, so: 59, hbp: 4, sb: 1, cs: 0, fld: 58, arm: 61 },
      { id: 'kaplega01', name: 'Gabe Kapler', pos: 'RF', bats: 'R', age: 30, pa: 147, h: 35, double: 8, triple: 0, hr: 2, bb: 10, so: 19, hbp: 2, sb: 2, cs: 1, sec: 'CF', fld: 82, arm: 82 },
      { id: 'pedrodu01', name: 'Dustin Pedroia', pos: '2B', bats: 'R', age: 22, pa: 98, h: 17, double: 4, triple: 0, hr: 2, bb: 7, so: 7, hbp: 1, sb: 0, cs: 1, sec: 'SS', fld: 99, rk: true },
    ],
    reserveBatters: [
      { id: 'snowjt01', name: 'J. T. Snow', pos: '1B', bats: 'L', age: 38, pa: 53, h: 13, double: 3, triple: 0, hr: 1, bb: 6, so: 8, hbp: 1, sb: 0, cs: 0 },
      { id: 'harriwi01', name: 'Willie Harris', pos: 'CF', bats: 'L', age: 28, pa: 52, h: 11, double: 1, triple: 0, hr: 0, bb: 5, so: 9, hbp: 1, sb: 3, cs: 1, sec: 'LF', fld: 76, arm: 73 },
      { id: 'mohrdu01', name: 'Dustan Mohr', pos: 'CF', bats: 'R', age: 30, pa: 43, h: 9, double: 2, triple: 0, hr: 2, bb: 4, so: 13, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'beckejo02', name: 'Josh Beckett', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 614, h: 187, hr: 28, bb: 72, so: 176, hbp: 9, er: 100, w: 16, l: 11, sv: 0, fld: 72 },
      { id: 'schilcu01', name: 'Curt Schilling', role: 'SP', throws: 'R', age: 39, g: 31, gs: 31, outs: 612, h: 219, hr: 26, bb: 32, so: 183, hbp: 4, er: 93, w: 15, l: 7, sv: 0, fld: 68 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 39, g: 23, gs: 23, outs: 420, h: 136, hr: 21, bb: 47, so: 92, hbp: 9, er: 70, w: 7, l: 11, sv: 0, fld: 71 },
      { id: 'lestejo01', name: 'Jon Lester', role: 'SP', throws: 'L', age: 22, g: 15, gs: 15, outs: 244, h: 91, hr: 7, bb: 43, so: 60, hbp: 5, er: 43, w: 7, l: 2, sv: 0, rk: true },
      { id: 'wellsda01', name: 'David Wells', role: 'SP', throws: 'L', age: 43, g: 13, gs: 13, outs: 226, h: 91, hr: 10, bb: 10, so: 42, hbp: 2, er: 37, w: 3, l: 5, sv: 0 },
      { id: 'papeljo01', name: 'Jonathan Papelbon', role: 'CL', throws: 'R', age: 25, g: 59, gs: 0, outs: 205, h: 44, hr: 4, bb: 17, so: 70, hbp: 2, er: 10, w: 4, l: 2, sv: 35, rk: true },
      { id: 'tavarju01', name: 'Julian Tavarez', role: 'RP', throws: 'R', age: 33, g: 58, gs: 6, outs: 296, h: 107, hr: 9, bb: 39, so: 63, hbp: 8, er: 44, w: 5, l: 4, sv: 1 },
      { id: 'timlimi01', name: 'Mike Timlin', role: 'RP', throws: 'R', age: 40, g: 68, gs: 0, outs: 192, h: 73, hr: 5, bb: 16, so: 40, hbp: 2, er: 26, w: 6, l: 6, sv: 9 },
      { id: 'delcama01', name: 'Manny Delcarmen', role: 'RP', throws: 'R', age: 24, g: 50, gs: 0, outs: 160, h: 66, hr: 2, bb: 19, so: 46, hbp: 2, er: 29, w: 2, l: 0, sv: 0, rk: true },
      { id: 'seaneru01', name: 'Rudy Seanez', role: 'RP', throws: 'R', age: 37, g: 49, gs: 0, outs: 159, h: 53, hr: 6, bb: 27, so: 65, hbp: 1, er: 24, w: 3, l: 3, sv: 0 },
      { id: 'foulkke01', name: 'Keith Foulke', role: 'RP', throws: 'R', age: 33, g: 44, gs: 0, outs: 149, h: 49, hr: 8, bb: 11, so: 39, hbp: 3, er: 23, w: 3, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'clemema01', name: 'Matt Clement', role: 'SP', throws: 'R', age: 31, g: 12, gs: 12, outs: 196, h: 71, hr: 8, bb: 30, so: 56, hbp: 6, er: 38, w: 5, l: 5, sv: 0 },
      { id: 'snydeky01', name: 'Kyle Snyder', role: 'SP', throws: 'R', age: 28, g: 17, gs: 11, outs: 181, h: 88, hr: 10, bb: 19, so: 50, hbp: 2, er: 44, w: 4, l: 5, sv: 0 },
      { id: 'coreybr01', name: 'Bryan Corey', role: 'RP', throws: 'R', age: 32, g: 32, gs: 0, outs: 117, h: 35, hr: 1, bb: 15, so: 28, hbp: 2, er: 16, w: 2, l: 1, sv: 0, rk: true },
      { id: 'dinarle01', name: 'Lenny DiNardo', role: 'RP', throws: 'L', age: 26, g: 13, gs: 6, outs: 117, h: 57, hr: 5, bb: 19, so: 24, hbp: 1, er: 28, w: 1, l: 2, sv: 0, rk: true },
      { id: 'hansecr01', name: 'Craig Hansen', role: 'RP', throws: 'R', age: 22, g: 38, gs: 0, outs: 114, h: 47, hr: 5, bb: 15, so: 30, hbp: 4, er: 28, w: 2, l: 2, sv: 0, rk: true },
    ],
  },
  // NYY (NYA 2006)
  {
    franchiseId: 'NYY',
    season: 2006,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 35, pa: 545, h: 126, double: 26, triple: 1, hr: 21, bb: 69, so: 95, hbp: 8, sb: 2, cs: 0, sec: '1B', fld: 64, arm: 77 },
      { id: 'phillan01', name: 'Andy Phillips', pos: '1B', bats: 'R', age: 29, pa: 263, h: 57, double: 12, triple: 3, hr: 7, bb: 14, so: 58, hbp: 0, sb: 3, cs: 2, sec: '3B', fld: 53, rk: true },
      { id: 'canoro01', name: 'Robinson Cano', pos: '2B', bats: 'L', age: 23, pa: 508, h: 156, double: 37, triple: 2, hr: 14, bb: 17, so: 58, hbp: 2, sb: 3, cs: 2, sec: 'SS', fld: 71 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: '3B', bats: 'R', age: 30, pa: 674, h: 172, double: 26, triple: 1, hr: 38, bb: 86, so: 134, hbp: 11, sb: 19, cs: 5, sec: 'SS', fld: 54 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 32, pa: 715, h: 202, double: 35, triple: 3, hr: 17, bb: 67, so: 105, hbp: 12, sb: 25, cs: 5, sec: '2B', fld: 60 },
      { id: 'cabreme01', name: 'Melky Cabrera', pos: 'LF', bats: 'S', age: 21, pa: 524, h: 129, double: 25, triple: 2, hr: 7, bb: 55, so: 59, hbp: 2, sb: 12, cs: 5, sec: 'CF', fld: 74, arm: 78, rk: true },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'CF', bats: 'L', age: 32, pa: 671, h: 179, double: 34, triple: 5, hr: 18, bb: 63, so: 76, hbp: 3, sb: 21, cs: 7, sec: 'LF', fld: 71, arm: 63 },
      { id: 'willibe02', name: 'Bernie Williams', pos: 'RF', bats: 'S', age: 37, pa: 462, h: 110, double: 23, triple: 0, hr: 12, bb: 43, so: 60, hbp: 1, sb: 1, cs: 1, sec: 'CF', fld: 68, arm: 58 },
      { id: 'giambja01', name: 'Jason Giambi', pos: 'DH', bats: 'L', age: 35, pa: 579, h: 114, double: 21, triple: 0, hr: 34, bb: 109, so: 110, hbp: 17, sb: 1, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'cairomi01', name: 'Miguel Cairo', pos: '2B', bats: 'R', age: 32, pa: 244, h: 56, double: 12, triple: 2, hr: 1, bb: 12, so: 27, hbp: 3, sb: 10, cs: 2, sec: '3B', fld: 85 },
      { id: 'matsuhi01', name: 'Hideki Matsui', pos: 'LF', bats: 'L', age: 32, pa: 201, h: 53, double: 11, triple: 1, hr: 8, bb: 22, so: 25, hbp: 1, sb: 1, cs: 0, sec: 'CF', fld: 91, arm: 64 },
      { id: 'sheffga01', name: 'Gary Sheffield', pos: 'RF', bats: 'R', age: 37, pa: 166, h: 42, double: 6, triple: 0, hr: 8, bb: 19, so: 19, hbp: 2, sb: 3, cs: 1, sec: 'LF', fld: 66, arm: 68 },
      { id: 'guielaa01', name: 'Aaron Guiel', pos: 'RF', bats: 'L', age: 33, pa: 151, h: 32, double: 6, triple: 0, hr: 6, bb: 13, so: 31, hbp: 5, sb: 2, cs: 1, sec: 'LF', fld: 82, arm: 73 },
      { id: 'greenni01', name: 'Nick Green', pos: '2B', bats: 'R', age: 27, pa: 127, h: 26, double: 5, triple: 1, hr: 2, bb: 10, so: 32, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 81 },
    ],
    reserveBatters: [
      { id: 'stinnke01', name: 'Kelly Stinnett', pos: 'C', bats: 'R', age: 36, pa: 99, h: 21, double: 3, triple: 0, hr: 3, bb: 7, so: 27, hbp: 1, sb: 0, cs: 0, fld: 70, arm: 67 },
      { id: 'crosbbu01', name: 'Bubba Crosby', pos: 'RF', bats: 'L', age: 29, pa: 96, h: 20, double: 2, triple: 1, hr: 1, bb: 4, so: 18, hbp: 1, sb: 3, cs: 1, sec: 'CF', fld: 81, arm: 63 },
      { id: 'longte01', name: 'Terrence Long', pos: 'RF', bats: 'L', age: 30, pa: 40, h: 10, double: 2, triple: 0, hr: 0, bb: 3, so: 5, hbp: 0, sb: 0, cs: 0, sec: 'CF' },
    ],
    pitchers: [
      { id: 'wangch01', name: 'Chien-Ming Wang', role: 'SP', throws: 'R', age: 26, g: 34, gs: 33, outs: 654, h: 228, hr: 13, bb: 54, so: 79, hbp: 4, er: 91, w: 19, l: 6, sv: 1, fld: 83 },
      { id: 'johnsra05', name: 'Randy Johnson', role: 'SP', throws: 'L', age: 42, g: 33, gs: 33, outs: 615, h: 188, hr: 27, bb: 51, so: 197, hbp: 10, er: 97, w: 17, l: 11, sv: 0, fld: 61 },
      { id: 'mussimi01', name: 'Mike Mussina', role: 'SP', throws: 'R', age: 37, g: 32, gs: 32, outs: 592, h: 194, hr: 23, bb: 41, so: 160, hbp: 5, er: 84, w: 15, l: 7, sv: 0, fld: 63 },
      { id: 'wrighja02', name: 'Jaret Wright', role: 'SP', throws: 'R', age: 30, g: 30, gs: 27, outs: 421, h: 154, hr: 11, bb: 59, so: 92, hbp: 7, er: 70, w: 11, l: 7, sv: 0, fld: 65 },
      { id: 'chacosh01', name: 'Shawn Chacon', role: 'SP', throws: 'R', age: 28, g: 26, gs: 20, outs: 327, h: 116, hr: 18, bb: 60, so: 64, hbp: 10, er: 64, w: 7, l: 6, sv: 0 },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 36, g: 63, gs: 0, outs: 225, h: 57, hr: 3, bb: 15, so: 64, hbp: 5, er: 14, w: 5, l: 5, sv: 34 },
      { id: 'proctsc01', name: 'Scott Proctor', role: 'RP', throws: 'R', age: 29, g: 83, gs: 0, outs: 307, h: 92, hr: 15, bb: 35, so: 86, hbp: 2, er: 46, w: 6, l: 4, sv: 1 },
      { id: 'villoro01', name: 'Ron Villone', role: 'RP', throws: 'L', age: 36, g: 70, gs: 0, outs: 241, h: 74, hr: 8, bb: 48, so: 74, hbp: 6, er: 41, w: 3, l: 3, sv: 0 },
      { id: 'farnsky01', name: 'Kyle Farnsworth', role: 'RP', throws: 'R', age: 30, g: 72, gs: 0, outs: 198, h: 57, hr: 7, bb: 28, so: 79, hbp: 2, er: 27, w: 3, l: 6, sv: 6 },
      { id: 'karstje01', name: 'Jeff Karstens', role: 'RP', throws: 'R', age: 23, g: 8, gs: 6, outs: 128, h: 40, hr: 6, bb: 11, so: 16, hbp: 1, er: 18, w: 2, l: 1, sv: 0, rk: true },
      { id: 'myersmi01', name: 'Mike Myers', role: 'RP', throws: 'L', age: 37, g: 62, gs: 0, outs: 92, h: 28, hr: 3, bb: 12, so: 21, hbp: 2, er: 12, w: 1, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'smallaa01', name: 'Aaron Small', role: 'RP', throws: 'R', age: 34, g: 11, gs: 3, outs: 83, h: 35, hr: 5, bb: 11, so: 14, hbp: 2, er: 18, w: 0, l: 3, sv: 0 },
      { id: 'brunebr01', name: 'Brian Bruney', role: 'RP', throws: 'R', age: 24, g: 19, gs: 0, outs: 62, h: 18, hr: 2, bb: 15, so: 22, hbp: 1, er: 10, w: 1, l: 1, sv: 0 },
      { id: 'smithma04', name: 'Matt Smith', role: 'RP', throws: 'L', age: 27, g: 26, gs: 0, outs: 62, h: 7, hr: 0, bb: 12, so: 21, hbp: 0, er: 2, w: 0, l: 1, sv: 0, rk: true },
      { id: 'rasneda01', name: 'Darrell Rasner', role: 'RP', throws: 'R', age: 25, g: 6, gs: 3, outs: 61, h: 17, hr: 2, bb: 5, so: 11, hbp: 2, er: 10, w: 3, l: 1, sv: 0, rk: true },
      { id: 'beamtj01', name: 'T. J. Beam', role: 'RP', throws: 'R', age: 25, g: 20, gs: 0, outs: 54, h: 26, hr: 5, bb: 6, so: 12, hbp: 2, er: 17, w: 2, l: 0, sv: 0, rk: true },
    ],
  },
  // TBR (TBA 2006)
  {
    franchiseId: 'TBR',
    season: 2006,
    batters: [
      { id: 'navardi01', name: 'Dioner Navarro', pos: 'C', bats: 'S', age: 22, pa: 302, h: 70, double: 10, triple: 0, hr: 6, bb: 31, so: 45, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 63, arm: 70 },
      { id: 'wiggity01', name: 'Ty Wigginton', pos: '1B', bats: 'R', age: 28, pa: 486, h: 119, double: 25, triple: 1, hr: 21, bb: 35, so: 90, hbp: 5, sb: 4, cs: 2, sec: '3B', fld: 83 },
      { id: 'cantujo01', name: 'Jorge Cantu', pos: '2B', bats: 'R', age: 24, pa: 448, h: 113, double: 25, triple: 1, hr: 16, bb: 20, so: 78, hbp: 4, sb: 1, cs: 0, sec: '3B', fld: 57 },
      { id: 'perezto03', name: 'Tomas Perez', pos: '3B', bats: 'S', age: 32, pa: 254, h: 52, double: 12, triple: 0, hr: 2, bb: 9, so: 45, hbp: 1, sb: 1, cs: 0, sec: '2B', fld: 76 },
      { id: 'lugoju01', name: 'Julio Lugo', pos: 'SS', bats: 'R', age: 30, pa: 486, h: 123, double: 25, triple: 3, hr: 8, bb: 41, so: 67, hbp: 4, sb: 24, cs: 8, sec: '2B', fld: 64 },
      { id: 'crawfca02', name: 'Carl Crawford', pos: 'LF', bats: 'L', age: 24, pa: 652, h: 183, double: 25, triple: 16, hr: 15, bb: 33, so: 82, hbp: 4, sb: 53, cs: 9, sec: 'CF', fld: 78, arm: 72 },
      { id: 'baldero01', name: 'Rocco Baldelli', pos: 'CF', bats: 'R', age: 24, pa: 387, h: 107, double: 22, triple: 5, hr: 14, bb: 16, so: 67, hbp: 7, sb: 11, cs: 2, sec: 'LF', fld: 76, arm: 74 },
      { id: 'hollida02', name: 'Damon Hollins', pos: 'RF', bats: 'R', age: 32, pa: 355, h: 79, double: 19, triple: 0, hr: 14, bb: 20, so: 63, hbp: 0, sb: 5, cs: 2, sec: 'CF', fld: 85, arm: 69 },
      { id: 'gomesjo01', name: 'Jonny Gomes', pos: 'DH', bats: 'R', age: 25, pa: 461, h: 93, double: 19, triple: 3, hr: 21, bb: 55, so: 121, hbp: 10, sb: 4, cs: 5, sec: 'RF' },
    ],
    bench: [
      { id: 'leetr01', name: 'Travis Lee', pos: '1B', bats: 'L', age: 31, pa: 388, h: 85, double: 15, triple: 2, hr: 11, bb: 37, so: 66, hbp: 2, sb: 5, cs: 3, sec: 'LF', fld: 75 },
      { id: 'nortogr01', name: 'Greg Norton', pos: 'DH', bats: 'S', age: 33, pa: 335, h: 84, double: 14, triple: 0, hr: 16, bb: 36, so: 69, hbp: 3, sb: 1, cs: 5, sec: '3B' },
      { id: 'hallto02', name: 'Toby Hall', pos: 'C', bats: 'R', age: 30, pa: 294, h: 74, double: 15, triple: 0, hr: 5, bb: 11, so: 24, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 72, arm: 69 },
      { id: 'branyru01', name: 'Russell Branyan', pos: 'RF', bats: 'L', age: 30, pa: 282, h: 57, double: 12, triple: 0, hr: 17, bb: 37, so: 92, hbp: 2, sb: 2, cs: 0, sec: 'LF', fld: 70, arm: 86 },
      { id: 'zobribe01', name: 'Ben Zobrist', pos: 'SS', bats: 'S', age: 25, pa: 198, h: 41, double: 6, triple: 2, hr: 2, bb: 10, so: 26, hbp: 0, sb: 2, cs: 3, sec: '2B', fld: 75, rk: true },
    ],
    reserveBatters: [
      { id: 'uptonbj01', name: 'B. J. Upton', pos: '3B', bats: 'R', age: 21, pa: 189, h: 43, double: 6, triple: 1, hr: 2, bb: 14, so: 42, hbp: 1, sb: 9, cs: 3, sec: 'SS', fld: 57 },
      { id: 'pauljo01', name: 'Josh Paul', pos: 'C', bats: 'R', age: 31, pa: 165, h: 36, double: 8, triple: 0, hr: 2, bb: 13, so: 38, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 83, arm: 63 },
      { id: 'youngde03', name: 'Delmon Young', pos: 'RF', bats: 'R', age: 20, pa: 131, h: 40, double: 9, triple: 1, hr: 3, bb: 1, so: 24, hbp: 3, sb: 2, cs: 2, sec: 'LF', fld: 61, arm: 90, rk: true },
      { id: 'wittke01', name: 'Kevin Witt', pos: 'DH', bats: 'L', age: 30, pa: 61, h: 9, double: 2, triple: 0, hr: 2, bb: 0, so: 21, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'hendrma01', name: 'Mark Hendrickson', role: 'SP', throws: 'L', age: 32, g: 31, gs: 25, outs: 494, h: 187, hr: 19, bb: 52, so: 89, hbp: 4, er: 89, w: 6, l: 15, sv: 0, fld: 59 },
      { id: 'seoja01', name: 'Jae Weong Seo', role: 'SP', throws: 'R', age: 29, g: 36, gs: 26, outs: 471, h: 187, hr: 27, bb: 53, so: 92, hbp: 3, er: 83, w: 3, l: 12, sv: 0, fld: 67 },
      { id: 'kazmisc01', name: 'Scott Kazmir', role: 'SP', throws: 'L', age: 22, g: 24, gs: 24, outs: 434, h: 130, hr: 12, bb: 63, so: 147, hbp: 5, er: 56, w: 10, l: 8, sv: 0, fld: 55 },
      { id: 'fossuca01', name: 'Casey Fossum', role: 'SP', throws: 'L', age: 28, g: 25, gs: 25, outs: 390, h: 140, hr: 19, bb: 57, so: 97, hbp: 12, er: 78, w: 6, l: 6, sv: 0 },
      { id: 'shielja02', name: 'James Shields', role: 'SP', throws: 'R', age: 24, g: 21, gs: 21, outs: 374, h: 141, hr: 18, bb: 38, so: 104, hbp: 5, er: 67, w: 6, l: 8, sv: 0, rk: true },
      { id: 'walkety01', name: 'Tyler Walker', role: 'CL', throws: 'R', age: 30, g: 26, gs: 0, outs: 76, h: 28, hr: 3, bb: 11, so: 20, hbp: 1, er: 14, w: 1, l: 4, sv: 10 },
      { id: 'lugoru01', name: 'Ruddy Lugo', role: 'RP', throws: 'R', age: 26, g: 64, gs: 0, outs: 255, h: 75, hr: 4, bb: 37, so: 48, hbp: 5, er: 36, w: 2, l: 4, sv: 0, rk: true },
      { id: 'campsh01', name: 'Shawn Camp', role: 'RP', throws: 'R', age: 30, g: 75, gs: 0, outs: 225, h: 94, hr: 9, bb: 19, so: 51, hbp: 7, er: 41, w: 7, l: 4, sv: 4 },
      { id: 'meadobr01', name: 'Brian Meadows', role: 'RP', throws: 'R', age: 30, g: 53, gs: 0, outs: 209, h: 84, hr: 11, bb: 17, so: 39, hbp: 0, er: 37, w: 3, l: 6, sv: 8 },
      { id: 'hammeja01', name: 'Jason Hammel', role: 'RP', throws: 'R', age: 23, g: 9, gs: 9, outs: 132, h: 61, hr: 7, bb: 21, so: 32, hbp: 1, er: 38, w: 0, l: 6, sv: 0, rk: true },
      { id: 'howeljp01', name: 'J. P. Howell', role: 'RP', throws: 'L', age: 23, g: 8, gs: 8, outs: 127, h: 47, hr: 5, bb: 19, so: 32, hbp: 3, er: 27, w: 1, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'mccluse01', name: 'Seth McClung', role: 'SP', throws: 'R', age: 25, g: 39, gs: 15, outs: 309, h: 114, hr: 16, bb: 65, so: 72, hbp: 5, er: 75, w: 6, l: 12, sv: 6 },
      { id: 'corcoti02', name: 'Tim Corcoran', role: 'SP', throws: 'R', age: 28, g: 21, gs: 16, outs: 271, h: 90, hr: 9, bb: 48, so: 58, hbp: 4, er: 47, w: 5, l: 9, sv: 0, rk: true },
      { id: 'waechdo01', name: 'Doug Waechter', role: 'SP', throws: 'R', age: 25, g: 11, gs: 10, outs: 159, h: 66, hr: 10, bb: 17, so: 29, hbp: 3, er: 36, w: 1, l: 4, sv: 0 },
      { id: 'harpetr01', name: 'Travis Harper', role: 'RP', throws: 'R', age: 30, g: 30, gs: 0, outs: 126, h: 54, hr: 7, bb: 14, so: 30, hbp: 2, er: 27, w: 2, l: 0, sv: 0 },
      { id: 'harvich01', name: 'Chad Harville', role: 'RP', throws: 'R', age: 29, g: 32, gs: 0, outs: 123, h: 42, hr: 6, bb: 22, so: 32, hbp: 2, er: 24, w: 0, l: 2, sv: 1 },
    ],
  },
  // TOR (TOR 2006)
  {
    franchiseId: 'TOR',
    season: 2006,
    batters: [
      { id: 'molinbe01', name: 'Bengie Molina', pos: 'C', bats: 'R', age: 31, pa: 458, h: 122, double: 19, triple: 1, hr: 17, bb: 22, so: 45, hbp: 3, sb: 1, cs: 1, sec: '1B', fld: 69, arm: 60 },
      { id: 'overbly01', name: 'Lyle Overbay', pos: '1B', bats: 'L', age: 29, pa: 640, h: 169, double: 43, triple: 1, hr: 20, bb: 67, so: 102, hbp: 2, sb: 3, cs: 2, sec: '3B', fld: 74 },
      { id: 'hillaa01', name: 'Aaron Hill', pos: '2B', bats: 'R', age: 24, pa: 606, h: 155, double: 31, triple: 3, hr: 6, bb: 45, so: 64, hbp: 9, sb: 4, cs: 2, sec: 'SS', fld: 77 },
      { id: 'glaustr01', name: 'Troy Glaus', pos: '3B', bats: 'R', age: 29, pa: 634, h: 137, double: 28, triple: 1, hr: 38, bb: 85, so: 138, hbp: 5, sb: 4, cs: 2, sec: 'SS', fld: 74 },
      { id: 'mcdonjo03', name: 'John McDonald', pos: 'SS', bats: 'R', age: 31, pa: 286, h: 61, double: 8, triple: 3, hr: 2, bb: 16, so: 39, hbp: 2, sb: 7, cs: 2, sec: '2B', fld: 69 },
      { id: 'catalfr01', name: 'Frank Catalanotto', pos: 'LF', bats: 'L', age: 32, pa: 499, h: 132, double: 34, triple: 3, hr: 7, bb: 45, so: 46, hbp: 7, sb: 1, cs: 2, sec: '1B', fld: 62, arm: 81 },
      { id: 'wellsve01', name: 'Vernon Wells', pos: 'CF', bats: 'R', age: 27, pa: 677, h: 176, double: 36, triple: 4, hr: 30, bb: 52, so: 89, hbp: 3, sb: 13, cs: 3, sec: 'RF', fld: 62, arm: 64 },
      { id: 'riosal01', name: 'Alex Rios', pos: 'RF', bats: 'R', age: 25, pa: 498, h: 130, double: 28, triple: 6, hr: 12, bb: 32, so: 92, hbp: 3, sb: 15, cs: 6, sec: 'CF', fld: 70, arm: 73 },
      { id: 'hillesh02', name: 'Shea Hillenbrand', pos: 'DH', bats: 'R', age: 30, pa: 566, h: 151, double: 30, triple: 2, hr: 18, bb: 22, so: 70, hbp: 13, sb: 2, cs: 1, sec: '3B', fld: 77 },
    ],
    bench: [
      { id: 'johnsre02', name: 'Reed Johnson', pos: 'LF', bats: 'R', age: 29, pa: 517, h: 137, double: 29, triple: 3, hr: 11, bb: 29, so: 87, hbp: 18, sb: 7, cs: 4, sec: 'RF', fld: 73, arm: 80 },
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 35, pa: 339, h: 76, double: 16, triple: 0, hr: 9, bb: 44, so: 46, hbp: 2, sb: 1, cs: 2, fld: 72, arm: 65 },
      { id: 'hinsker01', name: 'Eric Hinske', pos: 'RF', bats: 'L', age: 28, pa: 312, h: 73, double: 16, triple: 2, hr: 10, bb: 30, so: 69, hbp: 2, sb: 4, cs: 3, sec: '1B', fld: 56, arm: 77 },
      { id: 'adamsru01', name: 'Russ Adams', pos: '2B', bats: 'L', age: 25, pa: 280, h: 60, double: 14, triple: 2, hr: 4, bb: 24, so: 34, hbp: 1, sb: 4, cs: 1, sec: 'SS', fld: 54 },
      { id: 'lindad01', name: 'Adam Lind', pos: 'DH', bats: 'L', age: 22, pa: 65, h: 22, double: 8, triple: 0, hr: 2, bb: 5, so: 12, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    reserveBatters: [
      { id: 'phillja04', name: 'Jason Phillips', pos: 'C', bats: 'R', age: 29, pa: 51, h: 11, double: 3, triple: 0, hr: 1, bb: 3, so: 6, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'hallaro01', name: 'Roy Halladay', role: 'SP', throws: 'R', age: 29, g: 32, gs: 32, outs: 660, h: 204, hr: 19, bb: 36, so: 145, hbp: 6, er: 76, w: 16, l: 5, sv: 0, fld: 82 },
      { id: 'lillyte01', name: 'Ted Lilly', role: 'SP', throws: 'L', age: 30, g: 32, gs: 32, outs: 545, h: 178, hr: 28, bb: 82, so: 153, hbp: 4, er: 92, w: 15, l: 13, sv: 0, fld: 67 },
      { id: 'burneaj01', name: 'A. J. Burnett', role: 'SP', throws: 'R', age: 29, g: 21, gs: 21, outs: 407, h: 128, hr: 11, bb: 45, so: 125, hbp: 6, er: 57, w: 10, l: 8, sv: 0, fld: 65 },
      { id: 'janssca01', name: 'Casey Janssen', role: 'SP', throws: 'R', age: 24, g: 19, gs: 17, outs: 282, h: 103, hr: 12, bb: 21, so: 44, hbp: 7, er: 53, w: 6, l: 10, sv: 0, rk: true },
      { id: 'chacigu01', name: 'Gustavo Chacin', role: 'SP', throws: 'L', age: 25, g: 17, gs: 17, outs: 262, h: 92, hr: 13, bb: 33, so: 51, hbp: 5, er: 42, w: 9, l: 4, sv: 0 },
      { id: 'ryanbj01', name: 'B. J. Ryan', role: 'CL', throws: 'L', age: 30, g: 65, gs: 0, outs: 217, h: 47, hr: 3, bb: 23, so: 91, hbp: 1, er: 15, w: 2, l: 2, sv: 38 },
      { id: 'downssc01', name: 'Scott Downs', role: 'RP', throws: 'L', age: 30, g: 59, gs: 5, outs: 231, h: 76, hr: 9, bb: 29, so: 59, hbp: 3, er: 36, w: 6, l: 2, sv: 1 },
      { id: 'tallebr01', name: 'Brian Tallet', role: 'RP', throws: 'L', age: 28, g: 44, gs: 1, outs: 163, h: 46, hr: 6, bb: 31, so: 36, hbp: 3, er: 24, w: 3, l: 0, sv: 0, rk: true },
      { id: 'schoesc01', name: 'Scott Schoeneweis', role: 'RP', throws: 'L', age: 32, g: 71, gs: 0, outs: 155, h: 51, hr: 4, bb: 23, so: 32, hbp: 2, er: 26, w: 4, l: 2, sv: 4 },
      { id: 'speieju01', name: 'Justin Speier', role: 'RP', throws: 'R', age: 32, g: 58, gs: 0, outs: 154, h: 44, hr: 6, bb: 18, so: 49, hbp: 2, er: 18, w: 2, l: 0, sv: 0 },
      { id: 'frasoja01', name: 'Jason Frasor', role: 'RP', throws: 'R', age: 28, g: 51, gs: 0, outs: 150, h: 46, hr: 6, bb: 19, so: 45, hbp: 2, er: 21, w: 3, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'marcush01', name: 'Shaun Marcum', role: 'SP', throws: 'R', age: 24, g: 21, gs: 14, outs: 235, h: 86, hr: 13, bb: 38, so: 64, hbp: 4, er: 41, w: 3, l: 4, sv: 0, rk: true },
      { id: 'towerjo01', name: 'Josh Towers', role: 'SP', throws: 'R', age: 29, g: 15, gs: 12, outs: 186, h: 84, hr: 11, bb: 13, so: 35, hbp: 3, er: 38, w: 2, l: 10, sv: 0 },
      { id: 'chulkvi01', name: 'Vinnie Chulk', role: 'RP', throws: 'R', age: 27, g: 48, gs: 0, outs: 139, h: 46, hr: 6, bb: 19, so: 35, hbp: 2, er: 24, w: 1, l: 3, sv: 0 },
      { id: 'leagubr01', name: 'Brandon League', role: 'RP', throws: 'R', age: 23, g: 33, gs: 0, outs: 128, h: 37, hr: 5, bb: 13, so: 24, hbp: 3, er: 17, w: 1, l: 2, sv: 1, rk: true },
      { id: 'taubety01', name: 'Ty Taubenheim', role: 'RP', throws: 'R', age: 23, g: 12, gs: 7, outs: 105, h: 40, hr: 5, bb: 18, so: 26, hbp: 4, er: 19, w: 1, l: 5, sv: 0, rk: true },
    ],
  },
  // CWS (CHA 2006)
  {
    franchiseId: 'CWS',
    season: 2006,
    batters: [
      { id: 'pierzaj01', name: 'A. J. Pierzynski', pos: 'C', bats: 'L', age: 29, pa: 543, h: 141, double: 25, triple: 0, hr: 16, bb: 23, so: 66, hbp: 11, sb: 1, cs: 1, sec: '1B', fld: 73, arm: 63 },
      { id: 'konerpa01', name: 'Paul Konerko', pos: '1B', bats: 'R', age: 30, pa: 643, h: 167, double: 26, triple: 0, hr: 37, bb: 68, so: 105, hbp: 7, sb: 1, cs: 0, sec: '3B', fld: 66 },
      { id: 'iguchta01', name: 'Tadahito Iguchi', pos: '2B', bats: 'R', age: 31, pa: 627, h: 155, double: 25, triple: 2, hr: 17, bb: 56, so: 115, hbp: 4, sb: 13, cs: 5, sec: 'SS', fld: 65 },
      { id: 'credejo01', name: 'Joe Crede', pos: '3B', bats: 'R', age: 28, pa: 586, h: 144, double: 29, triple: 0, hr: 28, bb: 30, so: 70, hbp: 8, sb: 1, cs: 2, sec: '1B', fld: 94 },
      { id: 'uribeju01', name: 'Juan Uribe', pos: 'SS', bats: 'R', age: 27, pa: 495, h: 113, double: 26, triple: 3, hr: 19, bb: 22, so: 79, hbp: 3, sb: 3, cs: 4, sec: '2B', fld: 79 },
      { id: 'podsesc01', name: 'Scott Podsednik', pos: 'LF', bats: 'L', age: 30, pa: 592, h: 141, double: 27, triple: 4, hr: 3, bb: 51, so: 89, hbp: 3, sb: 50, cs: 19, sec: 'CF', fld: 65, arm: 64 },
      { id: 'anderbr03', name: 'Brian Anderson', pos: 'CF', bats: 'R', age: 24, pa: 405, h: 81, double: 22, triple: 1, hr: 9, bb: 28, so: 93, hbp: 5, sb: 4, cs: 7, sec: 'LF', fld: 83, arm: 64, rk: true },
      { id: 'dyeje01', name: 'Jermaine Dye', pos: 'RF', bats: 'R', age: 32, pa: 611, h: 161, double: 29, triple: 3, hr: 37, bb: 52, so: 116, hbp: 7, sb: 8, cs: 3, sec: 'LF', fld: 71, arm: 63 },
      { id: 'thomeji01', name: 'Jim Thome', pos: 'DH', bats: 'L', age: 35, pa: 610, h: 134, double: 25, triple: 0, hr: 38, bb: 107, so: 146, hbp: 5, sb: 0, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'cintral01', name: 'Alex Cintron', pos: 'SS', bats: 'S', age: 27, pa: 304, h: 79, double: 14, triple: 3, hr: 5, bb: 12, so: 31, hbp: 1, sb: 5, cs: 2, sec: '2B', fld: 57 },
      { id: 'mackoro01', name: 'Rob Mackowiak', pos: 'CF', bats: 'L', age: 30, pa: 290, h: 70, double: 12, triple: 2, hr: 6, bb: 26, so: 58, hbp: 2, sb: 5, cs: 2, sec: 'RF', fld: 55, arm: 65 },
      { id: 'ozunapa01', name: 'Pablo Ozuna', pos: 'LF', bats: 'R', age: 31, pa: 203, h: 58, double: 10, triple: 2, hr: 1, bb: 7, so: 19, hbp: 4, sb: 9, cs: 6, sec: 'RF', fld: 56, arm: 78 },
      { id: 'gloadro01', name: 'Ross Gload', pos: '1B', bats: 'L', age: 30, pa: 167, h: 48, double: 9, triple: 1, hr: 3, bb: 8, so: 20, hbp: 1, sb: 4, cs: 1, sec: 'LF', fld: 52 },
      { id: 'widgech01', name: 'Chris Widger', pos: 'C', bats: 'R', age: 35, pa: 107, h: 20, double: 4, triple: 0, hr: 2, bb: 9, so: 20, hbp: 0, sb: 0, cs: 1, fld: 56, arm: 58 },
    ],
    pitchers: [
      { id: 'garcifr02', name: 'Freddy Garcia', role: 'SP', throws: 'R', age: 29, g: 33, gs: 33, outs: 649, h: 219, hr: 28, bb: 54, so: 146, hbp: 6, er: 101, w: 17, l: 9, sv: 0, fld: 59 },
      { id: 'garlajo01', name: 'Jon Garland', role: 'SP', throws: 'R', age: 26, g: 33, gs: 32, outs: 634, h: 230, hr: 27, bb: 49, so: 113, hbp: 6, er: 101, w: 18, l: 7, sv: 0, fld: 72 },
      { id: 'buehrma01', name: 'Mark Buehrle', role: 'SP', throws: 'L', age: 27, g: 32, gs: 32, outs: 612, h: 234, hr: 29, bb: 43, so: 120, hbp: 5, er: 96, w: 12, l: 13, sv: 0, fld: 75 },
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 29, g: 33, gs: 32, outs: 608, h: 208, hr: 28, bb: 53, so: 179, hbp: 11, er: 107, w: 11, l: 12, sv: 0, fld: 71 },
      { id: 'contrjo01', name: 'Jose Contreras', role: 'SP', throws: 'R', age: 34, g: 30, gs: 30, outs: 588, h: 184, hr: 23, bb: 67, so: 144, hbp: 9, er: 92, w: 13, l: 9, sv: 0, fld: 61 },
      { id: 'jenksbo01', name: 'Bobby Jenks', role: 'CL', throws: 'R', age: 25, g: 67, gs: 0, outs: 209, h: 65, hr: 5, bb: 30, so: 83, hbp: 2, er: 29, w: 3, l: 4, sv: 41, rk: true },
      { id: 'mccarbr01', name: 'Brandon McCarthy', role: 'RP', throws: 'R', age: 22, g: 53, gs: 2, outs: 254, h: 78, hr: 17, bb: 29, so: 67, hbp: 1, er: 42, w: 4, l: 7, sv: 0 },
      { id: 'cottsne01', name: 'Neal Cotts', role: 'RP', throws: 'L', age: 26, g: 70, gs: 0, outs: 162, h: 54, hr: 8, bb: 26, so: 49, hbp: 3, er: 26, w: 1, l: 2, sv: 1 },
      { id: 'thornma01', name: 'Matt Thornton', role: 'RP', throws: 'L', age: 29, g: 63, gs: 0, outs: 162, h: 46, hr: 7, bb: 29, so: 49, hbp: 1, er: 24, w: 5, l: 3, sv: 2 },
      { id: 'riskeda01', name: 'David Riske', role: 'RP', throws: 'R', age: 29, g: 41, gs: 0, outs: 132, h: 38, hr: 7, bb: 16, so: 33, hbp: 2, er: 18, w: 1, l: 2, sv: 0 },
      { id: 'politcl01', name: 'Cliff Politte', role: 'RP', throws: 'R', age: 32, g: 30, gs: 0, outs: 90, h: 35, hr: 6, bb: 14, so: 26, hbp: 1, er: 18, w: 2, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'macdomi01', name: 'Mike MacDougal', role: 'RP', throws: 'R', age: 29, g: 29, gs: 0, outs: 87, h: 24, hr: 2, bb: 8, so: 25, hbp: 1, er: 8, w: 1, l: 1, sv: 1 },
      { id: 'haegech01', name: 'Charlie Haeger', role: 'RP', throws: 'R', age: 22, g: 7, gs: 1, outs: 55, h: 12, hr: 0, bb: 13, so: 19, hbp: 0, er: 7, w: 1, l: 1, sv: 1, rk: true },
      { id: 'loganbo02', name: 'Boone Logan', role: 'RP', throws: 'L', age: 21, g: 21, gs: 0, outs: 52, h: 21, hr: 2, bb: 15, so: 15, hbp: 3, er: 16, w: 0, l: 0, sv: 1, rk: true },
      { id: 'monteag01', name: 'Agustin Montero', role: 'RP', throws: 'R', age: 28, g: 11, gs: 0, outs: 42, h: 15, hr: 3, bb: 2, so: 7, hbp: 0, er: 8, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // CLE (CLE 2006)
  {
    franchiseId: 'CLE',
    season: 2006,
    batters: [
      { id: 'martivi01', name: 'Victor Martinez', pos: 'C', bats: 'S', age: 27, pa: 652, h: 176, double: 37, triple: 0, hr: 19, bb: 69, so: 79, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 73, arm: 60 },
      { id: 'brousbe01', name: 'Ben Broussard', pos: '1B', bats: 'L', age: 29, pa: 465, h: 117, double: 24, triple: 2, hr: 19, bb: 31, so: 97, hbp: 5, sb: 2, cs: 1, sec: 'LF', fld: 73 },
      { id: 'belliro01', name: 'Ronnie Belliard', pos: '2B', bats: 'R', age: 31, pa: 590, h: 150, double: 34, triple: 1, hr: 14, bb: 39, so: 79, hbp: 3, sb: 2, cs: 2, sec: '3B', fld: 70 },
      { id: 'booneaa01', name: 'Aaron Boone', pos: '3B', bats: 'R', age: 33, pa: 392, h: 88, double: 16, triple: 1, hr: 9, bb: 26, so: 63, hbp: 6, sb: 6, cs: 3, sec: 'SS', fld: 58 },
      { id: 'peraljh01', name: 'Jhonny Peralta', pos: 'SS', bats: 'R', age: 24, pa: 632, h: 152, double: 32, triple: 4, hr: 18, bb: 59, so: 148, hbp: 2, sb: 0, cs: 2, sec: '2B', fld: 85 },
      { id: 'michaja01', name: 'Jason Michaels', pos: 'LF', bats: 'R', age: 30, pa: 548, h: 134, double: 29, triple: 1, hr: 9, bb: 53, so: 97, hbp: 4, sb: 7, cs: 5, sec: 'CF', fld: 68, arm: 68 },
      { id: 'sizemgr01', name: 'Grady Sizemore', pos: 'CF', bats: 'L', age: 23, pa: 751, h: 191, double: 47, triple: 11, hr: 26, bb: 69, so: 149, hbp: 11, sb: 22, cs: 7, sec: 'LF', fld: 77, arm: 68 },
      { id: 'blakeca01', name: 'Casey Blake', pos: 'RF', bats: 'R', age: 32, pa: 456, h: 107, double: 23, triple: 1, hr: 19, bb: 41, so: 93, hbp: 6, sb: 4, cs: 3, sec: '1B', fld: 79, arm: 71 },
      { id: 'hafnetr01', name: 'Travis Hafner', pos: 'DH', bats: 'L', age: 29, pa: 563, h: 143, double: 36, triple: 1, hr: 36, bb: 87, so: 114, hbp: 9, sb: 0, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'hollato01', name: 'Todd Hollandsworth', pos: 'RF', bats: 'L', age: 33, pa: 236, h: 55, double: 14, triple: 1, hr: 6, bb: 14, so: 48, hbp: 0, sb: 1, cs: 3, sec: 'LF', fld: 66, arm: 81 },
      { id: 'inglejo01', name: 'Joe Inglett', pos: '2B', bats: 'L', age: 28, pa: 222, h: 57, double: 8, triple: 3, hr: 2, bb: 14, so: 39, hbp: 1, sb: 5, cs: 1, sec: 'SS', fld: 86, rk: true },
      { id: 'perezed01', name: 'Eduardo Perez', pos: 'DH', bats: 'R', age: 36, pa: 210, h: 46, double: 9, triple: 0, hr: 10, bb: 22, so: 34, hbp: 3, sb: 0, cs: 1, sec: '1B' },
      { id: 'garkory01', name: 'Ryan Garko', pos: '1B', bats: 'R', age: 25, pa: 209, h: 54, double: 12, triple: 0, hr: 7, bb: 14, so: 38, hbp: 7, sb: 0, cs: 0, sec: '3B', fld: 64, rk: true },
      { id: 'choosh01', name: 'Shin-Soo Choo', pos: 'RF', bats: 'L', age: 23, pa: 179, h: 41, double: 11, triple: 3, hr: 3, bb: 19, so: 49, hbp: 2, sb: 5, cs: 3, sec: 'LF', fld: 76, arm: 73, rk: true },
    ],
    reserveBatters: [
      { id: 'martean01', name: 'Andy Marte', pos: '3B', bats: 'R', age: 22, pa: 178, h: 34, double: 13, triple: 1, hr: 4, bb: 14, so: 37, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 88, rk: true },
      { id: 'gutiefr01', name: 'Franklin Gutierrez', pos: 'RF', bats: 'R', age: 23, pa: 141, h: 37, double: 9, triple: 0, hr: 1, bb: 4, so: 28, hbp: 0, sb: 0, cs: 0, sec: 'LF', fld: 73, arm: 61, rk: true },
      { id: 'shoppke01', name: 'Kelly Shoppach', pos: 'C', bats: 'R', age: 26, pa: 120, h: 25, double: 6, triple: 0, hr: 3, bb: 7, so: 46, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 77, rk: true },
      { id: 'vazqura01', name: 'Ramon Vazquez', pos: '3B', bats: 'L', age: 29, pa: 77, h: 15, double: 3, triple: 0, hr: 1, bb: 5, so: 16, hbp: 0, sb: 0, cs: 0, sec: 'SS' },
      { id: 'kouzmke01', name: 'Kevin Kouzmanoff', pos: 'DH', bats: 'R', age: 24, pa: 61, h: 12, double: 2, triple: 0, hr: 3, bb: 5, so: 12, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'westbja01', name: 'Jake Westbrook', role: 'SP', throws: 'R', age: 28, g: 32, gs: 32, outs: 634, h: 234, hr: 17, bb: 57, so: 115, hbp: 5, er: 99, w: 15, l: 10, sv: 0, fld: 95 },
      { id: 'leecl02', name: 'Cliff Lee', role: 'SP', throws: 'L', age: 27, g: 33, gs: 33, outs: 602, h: 214, hr: 28, bb: 62, so: 143, hbp: 6, er: 98, w: 14, l: 11, sv: 0, fld: 55 },
      { id: 'sabatcc01', name: 'CC Sabathia', role: 'SP', throws: 'L', age: 25, g: 28, gs: 28, outs: 578, h: 179, hr: 18, bb: 54, so: 160, hbp: 7, er: 77, w: 12, l: 11, sv: 0, fld: 50 },
      { id: 'byrdpa01', name: 'Paul Byrd', role: 'SP', throws: 'R', age: 35, g: 31, gs: 31, outs: 537, h: 219, hr: 24, bb: 33, so: 96, hbp: 6, er: 89, w: 10, l: 9, sv: 0, fld: 54 },
      { id: 'johnsja02', name: 'Jason Johnson', role: 'SP', throws: 'R', age: 32, g: 24, gs: 20, outs: 345, h: 146, hr: 14, bb: 33, so: 59, hbp: 4, er: 70, w: 3, l: 12, sv: 0 },
      { id: 'wickmbo01', name: 'Bob Wickman', role: 'CL', throws: 'R', age: 37, g: 57, gs: 0, outs: 162, h: 52, hr: 5, bb: 15, so: 40, hbp: 1, er: 16, w: 1, l: 6, sv: 33 },
      { id: 'carmofa01', name: 'Roberto Hernandez', role: 'RP', throws: 'R', age: 25, g: 38, gs: 7, outs: 224, h: 88, hr: 9, bb: 31, so: 58, hbp: 7, er: 45, w: 1, l: 10, sv: 0, rk: true },
      { id: 'cabrefe01', name: 'Fernando Cabrera', role: 'RP', throws: 'R', age: 24, g: 51, gs: 0, outs: 182, h: 52, hr: 9, bb: 30, so: 69, hbp: 1, er: 29, w: 3, l: 3, sv: 0, rk: true },
      { id: 'betanra01', name: 'Rafael Betancourt', role: 'RP', throws: 'R', age: 31, g: 50, gs: 0, outs: 170, h: 52, hr: 6, bb: 13, so: 55, hbp: 0, er: 22, w: 3, l: 4, sv: 3 },
      { id: 'motagu01', name: 'Guillermo Mota', role: 'RP', throws: 'R', age: 32, g: 52, gs: 0, outs: 167, h: 52, hr: 7, bb: 24, so: 48, hbp: 1, er: 26, w: 4, l: 3, sv: 0 },
      { id: 'davisja02', name: 'Jason Davis', role: 'RP', throws: 'R', age: 26, g: 39, gs: 0, outs: 166, h: 65, hr: 4, bb: 20, so: 37, hbp: 3, er: 27, w: 3, l: 2, sv: 1 },
    ],
    reservePitchers: [
      { id: 'sowerje01', name: 'Jeremy Sowers', role: 'SP', throws: 'L', age: 23, g: 14, gs: 14, outs: 265, h: 85, hr: 10, bb: 20, so: 35, hbp: 2, er: 35, w: 7, l: 4, sv: 0, rk: true },
      { id: 'sikorbr01', name: 'Brian Sikorski', role: 'RP', throws: 'R', age: 31, g: 30, gs: 0, outs: 102, h: 36, hr: 8, bb: 7, so: 38, hbp: 1, er: 19, w: 3, l: 2, sv: 0, rk: true },
      { id: 'sauersc01', name: 'Scott Sauerbeck', role: 'RP', throws: 'L', age: 34, g: 46, gs: 0, outs: 76, h: 24, hr: 3, bb: 15, so: 21, hbp: 5, er: 13, w: 0, l: 1, sv: 0 },
      { id: 'guthrje01', name: 'Jeremy Guthrie', role: 'RP', throws: 'R', age: 27, g: 9, gs: 1, outs: 58, h: 24, hr: 3, bb: 13, so: 13, hbp: 2, er: 14, w: 0, l: 0, sv: 0, rk: true },
      { id: 'mujiced01', name: 'Edward Mujica', role: 'RP', throws: 'R', age: 22, g: 10, gs: 0, outs: 55, h: 25, hr: 1, bb: 0, so: 12, hbp: 1, er: 6, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // DET (DET 2006)
  {
    franchiseId: 'DET',
    season: 2006,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 34, pa: 580, h: 163, double: 31, triple: 4, hr: 15, bb: 24, so: 92, hbp: 2, sb: 8, cs: 3, fld: 78, arm: 89 },
      { id: 'sheltch01', name: 'Chris Shelton', pos: '1B', bats: 'R', age: 26, pa: 412, h: 105, double: 18, triple: 3, hr: 16, bb: 34, so: 97, hbp: 4, sb: 1, cs: 1, sec: '3B', fld: 67 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: '2B', bats: 'R', age: 30, pa: 495, h: 140, double: 20, triple: 1, hr: 7, bb: 23, so: 27, hbp: 9, sb: 3, cs: 3, sec: '3B', fld: 80 },
      { id: 'ingebr01', name: 'Brandon Inge', pos: '3B', bats: 'R', age: 29, pa: 601, h: 140, double: 27, triple: 5, hr: 21, bb: 47, so: 121, hbp: 5, sb: 7, cs: 5, sec: '1B', fld: 98 },
      { id: 'guillca01', name: 'Carlos Guillen', pos: 'SS', bats: 'S', age: 30, pa: 622, h: 177, double: 37, triple: 6, hr: 17, bb: 61, so: 86, hbp: 4, sb: 15, cs: 7, sec: '3B', fld: 62 },
      { id: 'monrocr01', name: 'Craig Monroe', pos: 'LF', bats: 'R', age: 29, pa: 585, h: 144, double: 32, triple: 3, hr: 24, bb: 37, so: 109, hbp: 2, sb: 4, cs: 3, sec: 'RF', fld: 58, arm: 80 },
      { id: 'grandcu01', name: 'Curtis Granderson', pos: 'CF', bats: 'L', age: 25, pa: 679, h: 157, double: 30, triple: 10, hr: 21, bb: 62, so: 173, hbp: 3, sb: 7, cs: 5, sec: 'LF', fld: 76, arm: 62 },
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 32, pa: 646, h: 176, double: 31, triple: 1, hr: 22, bb: 48, so: 80, hbp: 4, sb: 1, cs: 3, sec: 'CF', fld: 52, arm: 70 },
      { id: 'thamema01', name: 'Marcus Thames', pos: 'DH', bats: 'R', age: 29, pa: 390, h: 86, double: 19, triple: 1, hr: 25, bb: 36, so: 97, hbp: 4, sb: 1, cs: 1, sec: 'LF', fld: 54, arm: 62 },
    ],
    bench: [
      { id: 'infanom01', name: 'Omar Infante', pos: '2B', bats: 'R', age: 24, pa: 245, h: 57, double: 13, triple: 3, hr: 5, bb: 13, so: 45, hbp: 2, sb: 4, cs: 1, sec: 'SS', fld: 72 },
      { id: 'youngdm01', name: 'Dmitri Young', pos: 'DH', bats: 'S', age: 32, pa: 184, h: 45, double: 8, triple: 1, hr: 7, bb: 11, so: 36, hbp: 2, sb: 0, cs: 0, sec: 'LF' },
      { id: 'wilsova01', name: 'Vance Wilson', pos: 'C', bats: 'R', age: 33, pa: 168, h: 38, double: 7, triple: 0, hr: 4, bb: 6, so: 29, hbp: 4, sb: 0, cs: 2, sec: '1B', fld: 76, arm: 68 },
      { id: 'gomezal01', name: 'Alexis Gomez', pos: 'LF', bats: 'L', age: 27, pa: 111, h: 27, double: 4, triple: 2, hr: 1, bb: 7, so: 21, hbp: 1, sb: 3, cs: 0, sec: 'RF', fld: 69, arm: 74, rk: true },
      { id: 'santira01', name: 'Ramon Santiago', pos: 'SS', bats: 'S', age: 26, pa: 86, h: 16, double: 1, triple: 1, hr: 0, bb: 2, so: 13, hbp: 3, sb: 2, cs: 0, sec: '2B' },
    ],
    reserveBatters: [
      { id: 'clevlbr01', name: 'Brent Clevlen', pos: 'CF', bats: 'R', age: 22, pa: 42, h: 11, double: 1, triple: 2, hr: 3, bb: 2, so: 15, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'bondeje01', name: 'Jeremy Bonderman', role: 'SP', throws: 'R', age: 23, g: 34, gs: 34, outs: 642, h: 213, hr: 21, bb: 67, so: 188, hbp: 5, er: 103, w: 14, l: 8, sv: 0, fld: 62 },
      { id: 'roberna01', name: 'Nate Robertson', role: 'SP', throws: 'L', age: 28, g: 32, gs: 32, outs: 626, h: 210, hr: 30, bb: 68, so: 138, hbp: 7, er: 97, w: 13, l: 13, sv: 0, fld: 59 },
      { id: 'rogerke01', name: 'Kenny Rogers', role: 'SP', throws: 'L', age: 41, g: 34, gs: 33, outs: 612, h: 206, hr: 20, bb: 59, so: 99, hbp: 9, er: 87, w: 17, l: 8, sv: 0, fld: 76 },
      { id: 'verlaju01', name: 'Justin Verlander', role: 'SP', throws: 'R', age: 23, g: 30, gs: 30, outs: 558, h: 188, hr: 21, bb: 61, so: 123, hbp: 6, er: 77, w: 17, l: 9, sv: 0, fld: 66, rk: true },
      { id: 'minerza01', name: 'Zach Miner', role: 'SP', throws: 'R', age: 24, g: 27, gs: 16, outs: 279, h: 100, hr: 11, bb: 32, so: 59, hbp: 0, er: 50, w: 7, l: 6, sv: 0, rk: true },
      { id: 'jonesto02', name: 'Todd Jones', role: 'CL', throws: 'R', age: 38, g: 62, gs: 0, outs: 192, h: 64, hr: 4, bb: 14, so: 41, hbp: 3, er: 24, w: 2, l: 6, sv: 37 },
      { id: 'zumayjo01', name: 'Joel Zumaya', role: 'RP', throws: 'R', age: 21, g: 62, gs: 0, outs: 250, h: 56, hr: 6, bb: 42, so: 97, hbp: 2, er: 18, w: 6, l: 3, sv: 1, rk: true },
      { id: 'rodnefe01', name: 'Fernando Rodney', role: 'RP', throws: 'R', age: 29, g: 63, gs: 0, outs: 215, h: 55, hr: 7, bb: 32, so: 66, hbp: 7, er: 26, w: 7, l: 4, sv: 7 },
      { id: 'grillja01', name: 'Jason Grilli', role: 'RP', throws: 'R', age: 29, g: 51, gs: 0, outs: 186, h: 62, hr: 7, bb: 25, so: 30, hbp: 4, er: 32, w: 2, l: 3, sv: 0 },
      { id: 'ledezwi01', name: 'Wil Ledezma', role: 'RP', throws: 'L', age: 25, g: 24, gs: 7, outs: 181, h: 63, hr: 7, bb: 24, so: 36, hbp: 2, er: 31, w: 3, l: 3, sv: 0 },
      { id: 'marotmi01', name: 'Mike Maroth', role: 'RP', throws: 'L', age: 28, g: 13, gs: 9, outs: 161, h: 62, hr: 8, bb: 14, so: 28, hbp: 2, er: 27, w: 5, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'walkeja01', name: 'Jamie Walker', role: 'RP', throws: 'L', age: 34, g: 56, gs: 0, outs: 144, h: 47, hr: 6, bb: 10, so: 34, hbp: 1, er: 17, w: 0, l: 1, sv: 0 },
      { id: 'colonro01', name: 'Roman Colon', role: 'RP', throws: 'R', age: 26, g: 20, gs: 1, outs: 116, h: 46, hr: 7, bb: 13, so: 26, hbp: 0, er: 22, w: 2, l: 0, sv: 1 },
      { id: 'spurlch01', name: 'Chris Spurling', role: 'RP', throws: 'R', age: 29, g: 16, gs: 0, outs: 64, h: 21, hr: 3, bb: 8, so: 8, hbp: 0, er: 10, w: 0, l: 0, sv: 0 },
      { id: 'seaybo01', name: 'Bobby Seay', role: 'RP', throws: 'L', age: 28, g: 14, gs: 0, outs: 46, h: 16, hr: 2, bb: 8, so: 12, hbp: 2, er: 10, w: 0, l: 0, sv: 0 },
      { id: 'tatajo01', name: 'Jordan Tata', role: 'RP', throws: 'R', age: 24, g: 8, gs: 0, outs: 44, h: 14, hr: 1, bb: 7, so: 6, hbp: 0, er: 10, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // KCR (KCA 2006)
  {
    franchiseId: 'KCR',
    season: 2006,
    batters: [
      { id: 'buckjo01', name: 'John Buck', pos: 'C', bats: 'R', age: 25, pa: 409, h: 91, double: 20, triple: 1, hr: 12, bb: 24, so: 91, hbp: 5, sb: 1, cs: 2, sec: '1B', fld: 72, arm: 74 },
      { id: 'mientdo01', name: 'Doug Mientkiewicz', pos: '1B', bats: 'L', age: 32, pa: 360, h: 82, double: 20, triple: 1, hr: 7, bb: 36, so: 47, hbp: 4, sb: 2, cs: 1, sec: '3B', fld: 68 },
      { id: 'grudzma01', name: 'Mark Grudzielanek', pos: '2B', bats: 'R', age: 36, pa: 586, h: 163, double: 31, triple: 4, hr: 8, bb: 28, so: 74, hbp: 4, sb: 5, cs: 4, sec: 'SS', fld: 80 },
      { id: 'teahema01', name: 'Mark Teahen', pos: '3B', bats: 'L', age: 24, pa: 439, h: 107, double: 23, triple: 6, hr: 13, bb: 38, so: 90, hbp: 2, sb: 8, cs: 1, sec: '1B', fld: 85 },
      { id: 'berroan01', name: 'Angel Berroa', pos: 'SS', bats: 'R', age: 28, pa: 503, h: 119, double: 18, triple: 3, hr: 9, bb: 15, so: 85, hbp: 7, sb: 6, cs: 3, sec: '2B', fld: 69 },
      { id: 'brownem01', name: 'Emil Brown', pos: 'LF', bats: 'R', age: 31, pa: 601, h: 152, double: 37, triple: 3, hr: 16, bb: 54, so: 100, hbp: 6, sb: 8, cs: 2, sec: 'RF', fld: 78, arm: 74 },
      { id: 'gathrjo01', name: 'Joey Gathright', pos: 'CF', bats: 'L', age: 25, pa: 445, h: 97, double: 12, triple: 4, hr: 1, bb: 36, so: 77, hbp: 7, sb: 27, cs: 9, sec: 'LF', fld: 89, arm: 68 },
      { id: 'sandere02', name: 'Reggie Sanders', pos: 'RF', bats: 'R', age: 38, pa: 358, h: 83, double: 20, triple: 2, hr: 16, bb: 28, so: 85, hbp: 2, sb: 11, cs: 5, sec: 'LF', fld: 90, arm: 69 },
      { id: 'stairma01', name: 'Matt Stairs', pos: 'DH', bats: 'L', age: 38, pa: 393, h: 89, double: 21, triple: 1, hr: 13, bb: 44, so: 74, hbp: 4, sb: 0, cs: 1, sec: 'RF' },
    ],
    bench: [
      { id: 'dejesda01', name: 'David DeJesus', pos: 'LF', bats: 'L', age: 26, pa: 552, h: 143, double: 33, triple: 6, hr: 9, bb: 44, so: 74, hbp: 11, sb: 6, cs: 5, sec: 'CF', fld: 93, arm: 79 },
      { id: 'germaes01', name: 'Esteban German', pos: '2B', bats: 'R', age: 28, pa: 331, h: 91, double: 18, triple: 5, hr: 3, bb: 39, so: 50, hbp: 6, sb: 8, cs: 3, sec: '3B', fld: 52, rk: true },
      { id: 'costash01', name: 'Shane Costa', pos: 'RF', bats: 'L', age: 24, pa: 252, h: 63, double: 17, triple: 1, hr: 4, bb: 8, so: 29, hbp: 5, sb: 2, cs: 0, sec: 'LF', fld: 75, arm: 54, rk: true },
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: 'DH', bats: 'R', age: 32, pa: 252, h: 64, double: 16, triple: 0, hr: 10, bb: 21, so: 35, hbp: 3, sb: 2, cs: 0, sec: '1B' },
      { id: 'shealry01', name: 'Ryan Shealy', pos: '1B', bats: 'R', age: 26, pa: 219, h: 58, double: 13, triple: 1, hr: 6, bb: 18, so: 52, hbp: 2, sb: 1, cs: 1, sec: '3B', fld: 65, rk: true },
    ],
    reserveBatters: [
      { id: 'bakopa01', name: 'Paul Bako', pos: 'C', bats: 'L', age: 34, pa: 167, h: 32, double: 5, triple: 0, hr: 0, bb: 14, so: 42, hbp: 0, sb: 0, cs: 0, fld: 69, arm: 72 },
      { id: 'blancan01', name: 'Andres Blanco', pos: 'SS', bats: 'S', age: 22, pa: 96, h: 21, double: 3, triple: 1, hr: 0, bb: 4, so: 11, hbp: 1, sb: 0, cs: 1, sec: '2B', fld: 79 },
      { id: 'phillpa01', name: 'Paul Phillips', pos: 'C', bats: 'R', age: 29, pa: 69, h: 18, double: 3, triple: 0, hr: 1, bb: 1, so: 7, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'keppije01', name: 'Jeff Keppinger', pos: '3B', bats: 'R', age: 26, pa: 67, h: 17, double: 2, triple: 0, hr: 2, bb: 4, so: 5, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
      { id: 'robinke02', name: 'Kerry Robinson', pos: 'CF', bats: 'L', age: 32, pa: 67, h: 17, double: 2, triple: 1, hr: 0, bb: 2, so: 6, hbp: 0, sb: 3, cs: 2, sec: 'LF' },
    ],
    pitchers: [
      { id: 'redmama01', name: 'Mark Redman', role: 'SP', throws: 'L', age: 32, g: 29, gs: 29, outs: 501, h: 196, hr: 20, bb: 60, so: 87, hbp: 6, er: 100, w: 11, l: 10, sv: 0, fld: 67 },
      { id: 'perezod01', name: 'Odalis Perez', role: 'SP', throws: 'L', age: 28, g: 32, gs: 20, outs: 379, h: 151, hr: 18, bb: 32, so: 87, hbp: 2, er: 74, w: 6, l: 8, sv: 0 },
      { id: 'elartsc01', name: 'Scott Elarton', role: 'SP', throws: 'R', age: 30, g: 20, gs: 20, outs: 344, h: 121, hr: 24, bb: 42, so: 62, hbp: 5, er: 67, w: 4, l: 9, sv: 0 },
      { id: 'hernaru03', name: 'Runelvys Hernandez', role: 'SP', throws: 'R', age: 28, g: 21, gs: 21, outs: 329, h: 135, hr: 18, bb: 49, so: 57, hbp: 6, er: 75, w: 6, l: 10, sv: 0 },
      { id: 'hudsolu01', name: 'Luke Hudson', role: 'SP', throws: 'R', age: 29, g: 26, gs: 15, outs: 306, h: 102, hr: 10, bb: 46, so: 65, hbp: 7, er: 59, w: 7, l: 6, sv: 0 },
      { id: 'burgoam01', name: 'Ambiorix Burgos', role: 'CL', throws: 'R', age: 22, g: 68, gs: 1, outs: 220, h: 79, hr: 13, bb: 37, so: 74, hbp: 6, er: 41, w: 4, l: 5, sv: 18 },
      { id: 'affelje01', name: 'Jeremy Affeldt', role: 'RP', throws: 'L', age: 27, g: 54, gs: 9, outs: 292, h: 105, hr: 11, bb: 53, so: 56, hbp: 2, er: 62, w: 8, l: 8, sv: 1 },
      { id: 'gobblji01', name: 'Jimmy Gobble', role: 'RP', throws: 'L', age: 24, g: 60, gs: 6, outs: 252, h: 94, hr: 13, bb: 31, so: 60, hbp: 1, er: 49, w: 4, l: 6, sv: 2 },
      { id: 'welleto01', name: 'Todd Wellemeyer', role: 'RP', throws: 'R', age: 27, g: 46, gs: 0, outs: 235, h: 71, hr: 8, bb: 51, so: 61, hbp: 3, er: 40, w: 1, l: 4, sv: 1 },
      { id: 'desseel01', name: 'Elmer Dessens', role: 'RP', throws: 'R', age: 35, g: 62, gs: 0, outs: 231, h: 84, hr: 8, bb: 22, so: 50, hbp: 1, er: 37, w: 5, l: 8, sv: 2 },
      { id: 'peraljo01', name: 'Joel Peralta', role: 'RP', throws: 'R', age: 30, g: 64, gs: 0, outs: 221, h: 71, hr: 11, bb: 20, so: 59, hbp: 2, er: 35, w: 1, l: 3, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'delarjo01', name: 'Jorge De La Rosa', role: 'SP', throws: 'L', age: 25, g: 28, gs: 13, outs: 237, h: 83, hr: 10, bb: 57, so: 65, hbp: 2, er: 52, w: 5, l: 6, sv: 0 },
      { id: 'woodmi01', name: 'Mike Wood', role: 'RP', throws: 'R', age: 26, g: 23, gs: 7, outs: 194, h: 80, hr: 10, bb: 25, so: 33, hbp: 5, er: 38, w: 3, l: 3, sv: 0 },
      { id: 'siscoan01', name: 'Andy Sisco', role: 'RP', throws: 'L', age: 23, g: 65, gs: 0, outs: 175, h: 62, hr: 7, bb: 38, so: 57, hbp: 1, er: 35, w: 1, l: 3, sv: 1 },
      { id: 'duckwbr01', name: 'Brandon Duckworth', role: 'RP', throws: 'R', age: 30, g: 10, gs: 8, outs: 137, h: 63, hr: 6, bb: 22, so: 27, hbp: 3, er: 36, w: 1, l: 5, sv: 0 },
      { id: 'nelsojo01', name: 'Joe Nelson', role: 'RP', throws: 'R', age: 31, g: 43, gs: 0, outs: 134, h: 37, hr: 5, bb: 24, so: 44, hbp: 2, er: 23, w: 1, l: 1, sv: 9, rk: true },
    ],
  },
  // MIN (MIN 2006)
  {
    franchiseId: 'MIN',
    season: 2006,
    batters: [
      { id: 'mauerjo01', name: 'Joe Mauer', pos: 'C', bats: 'L', age: 23, pa: 608, h: 172, double: 33, triple: 3, hr: 13, bb: 74, so: 61, hbp: 1, sb: 10, cs: 2, sec: '1B', fld: 76, arm: 78 },
      { id: 'morneju01', name: 'Justin Morneau', pos: '1B', bats: 'L', age: 25, pa: 661, h: 172, double: 34, triple: 2, hr: 32, bb: 54, so: 102, hbp: 5, sb: 2, cs: 3, sec: '3B', fld: 78 },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 30, pa: 652, h: 169, double: 18, triple: 6, hr: 3, bb: 67, so: 55, hbp: 1, sb: 21, cs: 9, sec: 'SS', fld: 64 },
      { id: 'puntoni01', name: 'Nick Punto', pos: '3B', bats: 'S', age: 28, pa: 524, h: 125, double: 20, triple: 6, hr: 3, bb: 46, so: 81, hbp: 1, sb: 17, cs: 6, sec: '2B', fld: 67 },
      { id: 'bartlja01', name: 'Jason Bartlett', pos: 'SS', bats: 'R', age: 26, pa: 372, h: 95, double: 17, triple: 2, hr: 3, bb: 25, so: 48, hbp: 9, sb: 9, cs: 3, sec: '2B', fld: 65 },
      { id: 'fordle01', name: 'Lew Ford', pos: 'LF', bats: 'R', age: 29, pa: 255, h: 59, double: 11, triple: 1, hr: 4, bb: 20, so: 37, hbp: 6, sb: 7, cs: 2, sec: 'CF', fld: 79, arm: 71 },
      { id: 'hunteto01', name: 'Torii Hunter', pos: 'CF', bats: 'R', age: 30, pa: 611, h: 152, double: 28, triple: 2, hr: 27, bb: 46, so: 105, hbp: 6, sb: 19, cs: 7, sec: 'LF', fld: 70, arm: 71 },
      { id: 'cuddymi01', name: 'Michael Cuddyer', pos: 'RF', bats: 'R', age: 27, pa: 635, h: 154, double: 38, triple: 4, hr: 21, bb: 60, so: 128, hbp: 8, sb: 6, cs: 3, sec: '1B', fld: 53, arm: 75 },
      { id: 'whitero02', name: 'Rondell White', pos: 'DH', bats: 'R', age: 34, pa: 355, h: 91, double: 18, triple: 2, hr: 10, bb: 16, so: 50, hbp: 5, sb: 1, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'castrju01', name: 'Juan Castro', pos: 'SS', bats: 'R', age: 34, pa: 264, h: 63, double: 14, triple: 2, hr: 4, bb: 10, so: 37, hbp: 0, sb: 1, cs: 1, sec: '3B', fld: 73 },
      { id: 'kubelja01', name: 'Jason Kubel', pos: 'LF', bats: 'L', age: 24, pa: 235, h: 54, double: 8, triple: 0, hr: 8, bb: 13, so: 44, hbp: 0, sb: 2, cs: 0, sec: 'RF', fld: 40, arm: 65, rk: true },
      { id: 'tynerja01', name: 'Jason Tyner', pos: 'LF', bats: 'L', age: 29, pa: 232, h: 68, double: 5, triple: 2, hr: 0, bb: 12, so: 18, hbp: 1, sb: 5, cs: 2, sec: 'CF', fld: 99, arm: 74 },
      { id: 'batisto01', name: 'Tony Batista', pos: '3B', bats: 'R', age: 32, pa: 195, h: 43, double: 10, triple: 0, hr: 7, bb: 11, so: 25, hbp: 2, sb: 2, cs: 1, sec: 'SS', fld: 59 },
      { id: 'redmomi01', name: 'Mike Redmond', pos: 'C', bats: 'R', age: 35, pa: 190, h: 55, double: 12, triple: 0, hr: 1, bb: 6, so: 18, hbp: 4, sb: 0, cs: 0, fld: 83, arm: 74 },
    ],
    reserveBatters: [
      { id: 'stewash01', name: 'Shannon Stewart', pos: 'LF', bats: 'R', age: 32, pa: 190, h: 49, double: 7, triple: 1, hr: 3, bb: 14, so: 21, hbp: 2, sb: 3, cs: 1, sec: 'CF', fld: 64, arm: 77 },
      { id: 'rodrilu01', name: 'Luis Rodriguez', pos: '3B', bats: 'S', age: 26, pa: 132, h: 29, double: 5, triple: 1, hr: 2, bb: 13, so: 15, hbp: 0, sb: 1, cs: 1, sec: '2B', fld: 85 },
      { id: 'rabejo01', name: 'Josh Rabe', pos: 'DH', bats: 'R', age: 27, pa: 51, h: 14, double: 1, triple: 0, hr: 3, bb: 2, so: 11, hbp: 0, sb: 0, cs: 1, sec: 'LF', rk: true },
      { id: 'tiffete01', name: 'Terry Tiffee', pos: '3B', bats: 'S', age: 27, pa: 49, h: 10, double: 2, triple: 0, hr: 1, bb: 3, so: 5, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'santajo01', name: 'Johan Santana', role: 'SP', throws: 'L', age: 27, g: 34, gs: 34, outs: 701, h: 181, hr: 24, bb: 48, so: 249, hbp: 4, er: 73, w: 19, l: 6, sv: 0, fld: 71 },
      { id: 'silvaca01', name: 'Carlos Silva', role: 'SP', throws: 'R', age: 27, g: 36, gs: 31, outs: 541, h: 236, hr: 31, bb: 25, so: 71, hbp: 5, er: 99, w: 11, l: 15, sv: 0, fld: 72 },
      { id: 'radkebr01', name: 'Brad Radke', role: 'SP', throws: 'R', age: 33, g: 28, gs: 28, outs: 487, h: 188, hr: 24, bb: 25, so: 94, hbp: 3, er: 75, w: 12, l: 9, sv: 0, fld: 83 },
      { id: 'lohseky01', name: 'Kyle Lohse', role: 'SP', throws: 'R', age: 27, g: 34, gs: 19, outs: 380, h: 152, hr: 16, bb: 40, so: 78, hbp: 6, er: 72, w: 5, l: 10, sv: 0 },
      { id: 'liriafr01', name: 'Francisco Liriano', role: 'SP', throws: 'L', age: 22, g: 28, gs: 16, outs: 363, h: 90, hr: 10, bb: 32, so: 146, hbp: 1, er: 34, w: 12, l: 3, sv: 1, rk: true },
      { id: 'nathajo01', name: 'Joe Nathan', role: 'CL', throws: 'R', age: 31, g: 64, gs: 0, outs: 205, h: 41, hr: 4, bb: 18, so: 90, hbp: 1, er: 15, w: 7, l: 0, sv: 36 },
      { id: 'crainje01', name: 'Jesse Crain', role: 'RP', throws: 'R', age: 24, g: 68, gs: 0, outs: 230, h: 70, hr: 6, bb: 23, so: 45, hbp: 3, er: 27, w: 4, l: 5, sv: 1 },
      { id: 'rincoju01', name: 'Juan Rincon', role: 'RP', throws: 'R', age: 27, g: 75, gs: 0, outs: 223, h: 67, hr: 2, bb: 27, so: 78, hbp: 3, er: 23, w: 3, l: 1, sv: 1 },
      { id: 'guerrma02', name: 'Matt Guerrier', role: 'RP', throws: 'R', age: 27, g: 39, gs: 1, outs: 209, h: 75, hr: 8, bb: 22, so: 40, hbp: 1, er: 27, w: 1, l: 0, sv: 1 },
      { id: 'eyrewi01', name: 'Willie Eyre', role: 'RP', throws: 'R', age: 27, g: 42, gs: 0, outs: 178, h: 75, hr: 8, bb: 22, so: 26, hbp: 6, er: 35, w: 1, l: 0, sv: 0, rk: true },
      { id: 'reyesde01', name: 'Dennys Reyes', role: 'RP', throws: 'L', age: 29, g: 66, gs: 0, outs: 152, h: 44, hr: 4, bb: 21, so: 40, hbp: 1, er: 16, w: 5, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'bonsebo01', name: 'Boof Bonser', role: 'SP', throws: 'R', age: 24, g: 18, gs: 18, outs: 301, h: 104, hr: 18, bb: 24, so: 84, hbp: 1, er: 47, w: 7, l: 6, sv: 0, rk: true },
      { id: 'bakersc02', name: 'Scott Baker', role: 'SP', throws: 'R', age: 24, g: 16, gs: 16, outs: 250, h: 105, hr: 15, bb: 18, so: 60, hbp: 2, er: 52, w: 5, l: 8, sv: 0 },
      { id: 'garzama01', name: 'Matt Garza', role: 'RP', throws: 'R', age: 22, g: 10, gs: 9, outs: 150, h: 62, hr: 6, bb: 23, so: 38, hbp: 0, er: 32, w: 3, l: 6, sv: 0, rk: true },
      { id: 'neshepa01', name: 'Pat Neshek', role: 'RP', throws: 'R', age: 25, g: 32, gs: 0, outs: 111, h: 23, hr: 6, bb: 6, so: 53, hbp: 0, er: 9, w: 4, l: 2, sv: 0, rk: true },
    ],
  },
  // HOU (HOU 2006)
  {
    franchiseId: 'HOU',
    season: 2006,
    batters: [
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 37, pa: 502, h: 106, double: 18, triple: 1, hr: 3, bb: 47, so: 64, hbp: 5, sb: 4, cs: 2, fld: 81, arm: 64 },
      { id: 'berkmla01', name: 'Lance Berkman', pos: '1B', bats: 'S', age: 30, pa: 646, h: 164, double: 34, triple: 1, hr: 37, bb: 104, so: 97, hbp: 5, sb: 4, cs: 3, sec: 'LF', fld: 75 },
      { id: 'biggicr01', name: 'Craig Biggio', pos: '2B', bats: 'R', age: 40, pa: 607, h: 142, double: 36, triple: 0, hr: 22, bb: 37, so: 84, hbp: 12, sb: 6, cs: 2, fld: 65 },
      { id: 'huffau01', name: 'Aubrey Huff', pos: '3B', bats: 'L', age: 29, pa: 517, h: 125, double: 23, triple: 2, hr: 20, bb: 45, so: 65, hbp: 5, sb: 3, cs: 2, sec: '1B', fld: 76 },
      { id: 'everead01', name: 'Adam Everett', pos: 'SS', bats: 'R', age: 29, pa: 566, h: 127, double: 26, triple: 4, hr: 8, bb: 29, so: 81, hbp: 6, sb: 14, cs: 6, sec: '2B', fld: 86 },
      { id: 'wilsopr01', name: 'Preston Wilson', pos: 'LF', bats: 'R', age: 31, pa: 537, h: 129, double: 26, triple: 2, hr: 19, bb: 35, so: 127, hbp: 5, sb: 9, cs: 3, sec: 'CF', fld: 57, arm: 61 },
      { id: 'taverwi01', name: 'Willy Taveras', pos: 'CF', bats: 'R', age: 24, pa: 587, h: 152, double: 16, triple: 4, hr: 2, bb: 29, so: 91, hbp: 9, sb: 33, cs: 9, sec: 'LF', fld: 77, arm: 74 },
      { id: 'laneja01', name: 'Jason Lane', pos: 'RF', bats: 'R', age: 29, pa: 345, h: 73, double: 16, triple: 1, hr: 15, bb: 34, so: 70, hbp: 3, sb: 2, cs: 1, sec: 'LF', fld: 70, arm: 57 },
      { id: 'munsoer01', name: 'Eric Munson', pos: 'DH', bats: 'L', age: 28, pa: 156, h: 28, double: 6, triple: 0, hr: 6, bb: 13, so: 34, hbp: 3, sb: 0, cs: 0, sec: '3B', fld: 67, arm: 75 },
    ],
    bench: [
      { id: 'ensbemo01', name: 'Morgan Ensberg', pos: '3B', bats: 'R', age: 30, pa: 495, h: 106, double: 20, triple: 2, hr: 23, bb: 79, so: 89, hbp: 4, sb: 3, cs: 5, sec: '1B', fld: 75 },
      { id: 'lambmi01', name: 'Mike Lamb', pos: '1B', bats: 'L', age: 30, pa: 421, h: 108, double: 20, triple: 4, hr: 14, bb: 33, so: 66, hbp: 0, sb: 2, cs: 3, sec: '3B', fld: 72 },
      { id: 'burkech01', name: 'Chris Burke', pos: '2B', bats: 'R', age: 26, pa: 413, h: 97, double: 22, triple: 1, hr: 8, bb: 27, so: 75, hbp: 11, sb: 11, cs: 3, sec: 'SS', fld: 62 },
      { id: 'scottlu01', name: 'Luke Scott', pos: 'LF', bats: 'L', age: 28, pa: 249, h: 66, double: 17, triple: 6, hr: 8, bb: 29, so: 47, hbp: 3, sb: 2, cs: 1, sec: 'RF', fld: 63, arm: 61, rk: true },
      { id: 'brunter01', name: 'Eric Bruntlett', pos: '2B', bats: 'R', age: 28, pa: 136, h: 31, double: 7, triple: 1, hr: 2, bb: 13, so: 24, hbp: 1, sb: 5, cs: 1, sec: 'SS' },
    ],
    reserveBatters: [
      { id: 'palmeor01', name: 'Orlando Palmeiro', pos: 'LF', bats: 'L', age: 37, pa: 128, h: 30, double: 7, triple: 1, hr: 1, bb: 8, so: 15, hbp: 2, sb: 1, cs: 1, sec: 'RF' },
    ],
    pitchers: [
      { id: 'oswalro01', name: 'Roy Oswalt', role: 'SP', throws: 'R', age: 28, g: 33, gs: 32, outs: 662, h: 219, hr: 17, bb: 43, so: 170, hbp: 7, er: 74, w: 15, l: 8, sv: 0, fld: 72 },
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 34, g: 36, gs: 35, outs: 643, h: 221, hr: 23, bb: 61, so: 182, hbp: 2, er: 86, w: 14, l: 13, sv: 0, fld: 62 },
      { id: 'rodriwa01', name: 'Wandy Rodriguez', role: 'SP', throws: 'L', age: 27, g: 30, gs: 24, outs: 407, h: 151, hr: 18, bb: 61, so: 94, hbp: 7, er: 85, w: 9, l: 10, sv: 0, fld: 63 },
      { id: 'clemero02', name: 'Roger Clemens', role: 'SP', throws: 'R', age: 43, g: 19, gs: 19, outs: 340, h: 86, hr: 7, bb: 34, so: 104, hbp: 3, er: 29, w: 7, l: 6, sv: 0 },
      { id: 'buchhta01', name: 'Taylor Buchholz', role: 'SP', throws: 'R', age: 24, g: 22, gs: 19, outs: 339, h: 107, hr: 21, bb: 34, so: 77, hbp: 3, er: 74, w: 6, l: 10, sv: 0, rk: true },
      { id: 'lidgebr01', name: 'Brad Lidge', role: 'CL', throws: 'R', age: 29, g: 78, gs: 0, outs: 225, h: 65, hr: 8, bb: 31, so: 115, hbp: 5, er: 32, w: 1, l: 5, sv: 32 },
      { id: 'quallch01', name: 'Chad Qualls', role: 'RP', throws: 'R', age: 27, g: 81, gs: 0, outs: 266, h: 78, hr: 9, bb: 27, so: 60, hbp: 7, er: 35, w: 7, l: 3, sv: 0 },
      { id: 'wheelda01', name: 'Dan Wheeler', role: 'RP', throws: 'R', age: 28, g: 75, gs: 0, outs: 214, h: 60, hr: 7, bb: 22, so: 67, hbp: 2, er: 21, w: 3, l: 5, sv: 9 },
      { id: 'borkoda01', name: 'Dave Borkowski', role: 'RP', throws: 'R', age: 29, g: 40, gs: 0, outs: 213, h: 72, hr: 8, bb: 22, so: 53, hbp: 1, er: 37, w: 3, l: 2, sv: 0 },
      { id: 'sprinru01', name: 'Russ Springer', role: 'RP', throws: 'R', age: 37, g: 72, gs: 0, outs: 179, h: 47, hr: 9, bb: 18, so: 48, hbp: 4, er: 25, w: 1, l: 1, sv: 0 },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 33, g: 70, gs: 0, outs: 152, h: 44, hr: 5, bb: 19, so: 47, hbp: 5, er: 18, w: 2, l: 3, sv: 1 },
    ],
    reservePitchers: [
      { id: 'nievefe01', name: 'Fernando Nieve', role: 'SP', throws: 'R', age: 23, g: 40, gs: 11, outs: 289, h: 87, hr: 18, bb: 41, so: 70, hbp: 2, er: 45, w: 3, l: 3, sv: 0, rk: true },
      { id: 'hirshja01', name: 'Jason Hirsh', role: 'RP', throws: 'R', age: 24, g: 9, gs: 9, outs: 134, h: 48, hr: 11, bb: 22, so: 29, hbp: 3, er: 30, w: 3, l: 4, sv: 0, rk: true },
      { id: 'backebr01', name: 'Brandon Backe', role: 'RP', throws: 'R', age: 28, g: 8, gs: 8, outs: 129, h: 44, hr: 5, bb: 19, so: 26, hbp: 2, er: 21, w: 3, l: 2, sv: 0 },
      { id: 'sampsch01', name: 'Chris Sampson', role: 'RP', throws: 'R', age: 28, g: 12, gs: 3, outs: 102, h: 25, hr: 3, bb: 5, so: 15, hbp: 1, er: 8, w: 2, l: 1, sv: 0, rk: true },
      { id: 'gallomi01', name: 'Mike Gallo', role: 'RP', throws: 'L', age: 29, g: 23, gs: 0, outs: 49, h: 22, hr: 3, bb: 8, so: 10, hbp: 2, er: 9, w: 1, l: 2, sv: 0 },
    ],
  },
  // LAA (LAA 2006)
  {
    franchiseId: 'LAA',
    season: 2006,
    batters: [
      { id: 'napolmi01', name: 'Mike Napoli', pos: 'C', bats: 'R', age: 24, pa: 325, h: 61, double: 13, triple: 0, hr: 16, bb: 51, so: 90, hbp: 5, sb: 2, cs: 3, sec: '1B', fld: 71, arm: 71, rk: true },
      { id: 'kendrho01', name: 'Howie Kendrick', pos: '1B', bats: 'R', age: 22, pa: 283, h: 76, double: 21, triple: 1, hr: 4, bb: 9, so: 44, hbp: 4, sb: 6, cs: 0, sec: '3B', fld: 78, rk: true },
      { id: 'kennead01', name: 'Adam Kennedy', pos: '2B', bats: 'L', age: 30, pa: 503, h: 127, double: 24, triple: 4, hr: 4, bb: 37, so: 74, hbp: 7, sb: 17, cs: 7, sec: 'SS', fld: 57 },
      { id: 'izturma01', name: 'Maicer Izturis', pos: '3B', bats: 'S', age: 25, pa: 399, h: 98, double: 19, triple: 4, hr: 4, bb: 36, so: 38, hbp: 3, sb: 15, cs: 6, sec: 'SS', fld: 50 },
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 31, pa: 675, h: 166, double: 40, triple: 2, hr: 9, bb: 47, so: 57, hbp: 3, sb: 24, cs: 3, sec: '2B', fld: 66 },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'LF', bats: 'L', age: 34, pa: 588, h: 156, double: 29, triple: 2, hr: 17, bb: 32, so: 90, hbp: 0, sb: 1, cs: 1, sec: 'CF', fld: 77, arm: 60 },
      { id: 'figgich01', name: 'Chone Figgins', pos: 'CF', bats: 'S', age: 28, pa: 683, h: 170, double: 23, triple: 10, hr: 8, bb: 62, so: 99, hbp: 1, sb: 52, cs: 16, sec: 'LF', fld: 68, arm: 74 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'RF', bats: 'R', age: 31, pa: 665, h: 196, double: 34, triple: 2, hr: 35, bb: 56, so: 64, hbp: 6, sb: 15, cs: 3, sec: 'LF', fld: 58, arm: 69 },
      { id: 'riverju01', name: 'Juan Rivera', pos: 'DH', bats: 'R', age: 27, pa: 494, h: 135, double: 26, triple: 1, hr: 21, bb: 33, so: 58, hbp: 4, sb: 1, cs: 6, sec: 'RF', fld: 76, arm: 85 },
    ],
    bench: [
      { id: 'molinjo01', name: 'Jose Molina', pos: 'C', bats: 'R', age: 31, pa: 245, h: 54, double: 12, triple: 0, hr: 5, bb: 11, so: 51, hbp: 2, sb: 2, cs: 0, sec: '1B', fld: 65, arm: 82 },
      { id: 'quinlro01', name: 'Robb Quinlan', pos: '1B', bats: 'R', age: 29, pa: 244, h: 70, double: 13, triple: 1, hr: 9, bb: 10, so: 33, hbp: 2, sb: 2, cs: 1, sec: '3B', fld: 65 },
      { id: 'salmoti01', name: 'Tim Salmon', pos: 'DH', bats: 'R', age: 37, pa: 244, h: 56, double: 8, triple: 2, hr: 8, bb: 26, so: 45, hbp: 3, sb: 0, cs: 2, sec: 'RF' },
      { id: 'moralke01', name: 'Kendrys Morales', pos: '1B', bats: 'S', age: 23, pa: 215, h: 46, double: 10, triple: 1, hr: 5, bb: 17, so: 28, hbp: 0, sb: 1, cs: 1, sec: '3B', fld: 71, rk: true },
      { id: 'mcpheda01', name: 'Dallas McPherson', pos: '3B', bats: 'L', age: 25, pa: 121, h: 28, double: 6, triple: 1, hr: 6, bb: 7, so: 38, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 55 },
    ],
    reserveBatters: [
      { id: 'erstada01', name: 'Darin Erstad', pos: 'CF', bats: 'L', age: 32, pa: 105, h: 26, double: 6, triple: 0, hr: 1, bb: 7, so: 17, hbp: 1, sb: 2, cs: 0, sec: 'LF', fld: 87, arm: 67 },
      { id: 'alfoned01', name: 'Edgardo Alfonzo', pos: '3B', bats: 'R', age: 32, pa: 95, h: 22, double: 4, triple: 0, hr: 1, bb: 7, so: 7, hbp: 1, sb: 0, cs: 0, sec: '2B' },
      { id: 'kotchca01', name: 'Casey Kotchman', pos: '1B', bats: 'L', age: 23, pa: 88, h: 17, double: 3, triple: 0, hr: 2, bb: 8, so: 11, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 82 },
      { id: 'murphto03', name: 'Tommy Murphy', pos: 'CF', bats: 'S', age: 26, pa: 77, h: 16, double: 4, triple: 1, hr: 1, bb: 5, so: 21, hbp: 0, sb: 4, cs: 1, sec: 'RF', fld: 96, arm: 79, rk: true },
      { id: 'mathije01', name: 'Jeff Mathis', pos: 'C', bats: 'R', age: 23, pa: 63, h: 8, double: 2, triple: 0, hr: 2, bb: 7, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'lackejo01', name: 'John Lackey', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 653, h: 210, hr: 15, bb: 71, so: 189, hbp: 10, er: 88, w: 13, l: 11, sv: 0, fld: 68 },
      { id: 'santaer01', name: 'Ervin Santana', role: 'SP', throws: 'R', age: 23, g: 33, gs: 33, outs: 612, h: 188, hr: 22, bb: 70, so: 142, hbp: 11, er: 98, w: 16, l: 8, sv: 0, fld: 56 },
      { id: 'escobke01', name: 'Kelvim Escobar', role: 'SP', throws: 'R', age: 30, g: 30, gs: 30, outs: 568, h: 182, hr: 17, bb: 57, so: 161, hbp: 5, er: 76, w: 11, l: 14, sv: 0, fld: 63 },
      { id: 'weaveje01', name: 'Jeff Weaver', role: 'SP', throws: 'R', age: 29, g: 31, gs: 31, outs: 516, h: 195, hr: 29, bb: 44, so: 119, hbp: 12, er: 96, w: 8, l: 14, sv: 0, fld: 64 },
      { id: 'weaveje02', name: 'Jered Weaver', role: 'SP', throws: 'R', age: 23, g: 19, gs: 19, outs: 369, h: 94, hr: 15, bb: 33, so: 105, hbp: 3, er: 35, w: 11, l: 2, sv: 0, rk: true },
      { id: 'rodrifr03', name: 'Francisco Rodriguez', role: 'CL', throws: 'R', age: 24, g: 69, gs: 0, outs: 219, h: 50, hr: 6, bb: 30, so: 100, hbp: 1, er: 17, w: 2, l: 3, sv: 47 },
      { id: 'carrahe01', name: 'Hector Carrasco', role: 'RP', throws: 'R', age: 36, g: 56, gs: 3, outs: 301, h: 84, hr: 9, bb: 33, so: 77, hbp: 6, er: 33, w: 7, l: 3, sv: 1 },
      { id: 'shielsc01', name: 'Scot Shields', role: 'RP', throws: 'R', age: 30, g: 74, gs: 0, outs: 263, h: 69, hr: 6, bb: 29, so: 87, hbp: 2, er: 28, w: 7, l: 7, sv: 2 },
      { id: 'greggke01', name: 'Kevin Gregg', role: 'RP', throws: 'R', age: 28, g: 32, gs: 3, outs: 235, h: 84, hr: 9, bb: 26, so: 69, hbp: 3, er: 38, w: 3, l: 4, sv: 0 },
      { id: 'donnebr01', name: 'Brendan Donnelly', role: 'RP', throws: 'R', age: 34, g: 62, gs: 0, outs: 192, h: 59, hr: 8, bb: 25, so: 57, hbp: 3, er: 27, w: 6, l: 0, sv: 0 },
      { id: 'romerjc01', name: 'J. C. Romero', role: 'RP', throws: 'L', age: 30, g: 65, gs: 0, outs: 145, h: 49, hr: 4, bb: 30, so: 38, hbp: 3, er: 27, w: 1, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'saundjo01', name: 'Joe Saunders', role: 'SP', throws: 'L', age: 25, g: 13, gs: 13, outs: 212, h: 71, hr: 7, bb: 29, so: 49, hbp: 1, er: 39, w: 7, l: 3, sv: 0, rk: true },
      { id: 'colonba01', name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 33, g: 10, gs: 10, outs: 169, h: 62, hr: 9, bb: 14, so: 41, hbp: 1, er: 28, w: 1, l: 5, sv: 0 },
      { id: 'yanes01', name: 'Esteban Yan', role: 'RP', throws: 'R', age: 31, g: 27, gs: 0, outs: 112, h: 36, hr: 5, bb: 17, so: 26, hbp: 1, er: 19, w: 1, l: 0, sv: 1 },
      { id: 'moseldu01', name: 'Dustin Moseley', role: 'RP', throws: 'R', age: 24, g: 3, gs: 2, outs: 33, h: 22, hr: 3, bb: 2, so: 3, hbp: 0, er: 11, w: 1, l: 0, sv: 0, rk: true },
      { id: 'bootcch01', name: 'Chris Bootcheck', role: 'RP', throws: 'R', age: 27, g: 7, gs: 0, outs: 31, h: 15, hr: 2, bb: 6, so: 6, hbp: 0, er: 9, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // OAK (OAK 2006)
  {
    franchiseId: 'OAK',
    season: 2006,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 32, pa: 626, h: 161, double: 25, triple: 0, hr: 1, bb: 51, so: 45, hbp: 15, sb: 10, cs: 5, sec: '1B', fld: 75, arm: 71 },
      { id: 'swishni01', name: 'Nick Swisher', pos: '1B', bats: 'S', age: 25, pa: 672, h: 141, double: 30, triple: 2, hr: 32, bb: 88, so: 147, hbp: 9, sb: 1, cs: 2, sec: 'LF', fld: 65 },
      { id: 'ellisma01', name: 'Mark Ellis', pos: '2B', bats: 'R', age: 29, pa: 500, h: 122, double: 24, triple: 3, hr: 12, bb: 42, so: 67, hbp: 6, sb: 3, cs: 1, sec: 'SS', fld: 84 },
      { id: 'chaveer01', name: 'Eric Chavez', pos: '3B', bats: 'L', age: 28, pa: 576, h: 128, double: 27, triple: 1, hr: 23, bb: 72, so: 102, hbp: 2, sb: 4, cs: 0, sec: '1B', fld: 87 },
      { id: 'scutama01', name: 'Marco Scutaro', pos: 'SS', bats: 'R', age: 30, pa: 423, h: 98, double: 23, triple: 4, hr: 7, bb: 39, so: 57, hbp: 0, sb: 4, cs: 1, sec: '2B', fld: 52 },
      { id: 'paytoja01', name: 'Jay Payton', pos: 'LF', bats: 'R', age: 33, pa: 588, h: 156, double: 27, triple: 3, hr: 14, bb: 29, so: 57, hbp: 3, sb: 5, cs: 3, sec: 'CF', fld: 79, arm: 65 },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: 'CF', bats: 'L', age: 30, pa: 558, h: 144, double: 30, triple: 2, hr: 10, bb: 41, so: 52, hbp: 2, sb: 6, cs: 4, sec: 'RF', fld: 68, arm: 69 },
      { id: 'bradlmi01', name: 'Milton Bradley', pos: 'RF', bats: 'S', age: 28, pa: 405, h: 98, double: 16, triple: 1, hr: 14, bb: 45, so: 68, hbp: 3, sb: 9, cs: 3, sec: 'CF', fld: 68, arm: 66 },
      { id: 'thomafr04', name: 'Frank Thomas', pos: 'DH', bats: 'R', age: 38, pa: 559, h: 122, double: 14, triple: 0, hr: 40, bb: 85, so: 91, hbp: 6, sb: 0, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'crosbbo01', name: 'Bobby Crosby', pos: 'SS', bats: 'R', age: 26, pa: 398, h: 87, double: 19, triple: 1, hr: 10, bb: 37, so: 74, hbp: 2, sb: 5, cs: 1, sec: '2B', fld: 70 },
      { id: 'johnsda06', name: 'Dan Johnson', pos: '1B', bats: 'L', age: 26, pa: 331, h: 72, double: 14, triple: 1, hr: 10, bb: 39, so: 43, hbp: 0, sb: 0, cs: 0, sec: '3B', fld: 82 },
      { id: 'kieltbo01', name: 'Bobby Kielty', pos: 'LF', bats: 'S', age: 29, pa: 297, h: 68, double: 17, triple: 1, hr: 7, bb: 29, so: 48, hbp: 2, sb: 2, cs: 1, sec: 'RF', fld: 74, arm: 67 },
      { id: 'melhuad01', name: 'Adam Melhuse', pos: 'C', bats: 'S', age: 34, pa: 139, h: 31, double: 8, triple: 0, hr: 4, bb: 9, so: 33, hbp: 0, sb: 0, cs: 1, fld: 70, arm: 77 },
      { id: 'perezan01', name: 'Antonio Perez', pos: '3B', bats: 'R', age: 26, pa: 109, h: 22, double: 5, triple: 1, hr: 1, bb: 9, so: 31, hbp: 1, sb: 3, cs: 1, sec: '2B', fld: 85 },
    ],
    pitchers: [
      { id: 'harenda01', name: 'Dan Haren', role: 'SP', throws: 'R', age: 25, g: 34, gs: 34, outs: 669, h: 221, hr: 29, bb: 50, so: 172, hbp: 9, er: 99, w: 14, l: 13, sv: 0, fld: 71 },
      { id: 'zitoba01', name: 'Barry Zito', role: 'SP', throws: 'L', age: 28, g: 34, gs: 34, outs: 663, h: 206, hr: 27, bb: 94, so: 162, hbp: 12, er: 98, w: 16, l: 10, sv: 0, fld: 57 },
      { id: 'blantjo01', name: 'Joe Blanton', role: 'SP', throws: 'R', age: 25, g: 32, gs: 31, outs: 583, h: 219, hr: 20, bb: 62, so: 113, hbp: 5, er: 96, w: 16, l: 12, sv: 0, fld: 54 },
      { id: 'loaizes01', name: 'Esteban Loaiza', role: 'SP', throws: 'R', age: 34, g: 26, gs: 26, outs: 464, h: 174, hr: 17, bb: 43, so: 109, hbp: 4, er: 79, w: 11, l: 9, sv: 0, fld: 59 },
      { id: 'saarlki01', name: 'Kirk Saarloos', role: 'SP', throws: 'R', age: 27, g: 35, gs: 16, outs: 364, h: 143, hr: 15, bb: 49, so: 48, hbp: 6, er: 62, w: 7, l: 7, sv: 2 },
      { id: 'streehu01', name: 'Huston Street', role: 'CL', throws: 'R', age: 22, g: 69, gs: 0, outs: 212, h: 58, hr: 3, bb: 18, so: 67, hbp: 2, er: 21, w: 4, l: 4, sv: 37 },
      { id: 'halsebr01', name: 'Brad Halsey', role: 'RP', throws: 'L', age: 25, g: 52, gs: 7, outs: 283, h: 113, hr: 12, bb: 35, so: 53, hbp: 5, er: 51, w: 5, l: 4, sv: 0 },
      { id: 'gaudich01', name: 'Chad Gaudin', role: 'RP', throws: 'R', age: 23, g: 55, gs: 0, outs: 192, h: 64, hr: 6, bb: 36, so: 38, hbp: 2, er: 30, w: 4, l: 2, sv: 2 },
      { id: 'calerki01', name: 'Kiko Calero', role: 'RP', throws: 'R', age: 31, g: 70, gs: 0, outs: 174, h: 48, hr: 5, bb: 21, so: 63, hbp: 1, er: 22, w: 3, l: 2, sv: 2 },
      { id: 'duchsju01', name: 'Justin Duchscherer', role: 'RP', throws: 'R', age: 28, g: 53, gs: 0, outs: 167, h: 48, hr: 5, bb: 12, so: 49, hbp: 2, er: 17, w: 2, l: 1, sv: 9 },
      { id: 'harderi01', name: 'Rich Harden', role: 'RP', throws: 'R', age: 24, g: 9, gs: 9, outs: 140, h: 36, hr: 4, bb: 20, so: 45, hbp: 1, er: 18, w: 4, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'kennejo04', name: 'Joe Kennedy', role: 'RP', throws: 'L', age: 27, g: 39, gs: 0, outs: 105, h: 38, hr: 3, bb: 14, so: 23, hbp: 1, er: 17, w: 4, l: 1, sv: 1 },
      { id: 'florero01', name: 'Ron Flores', role: 'RP', throws: 'L', age: 26, g: 25, gs: 0, outs: 89, h: 28, hr: 3, bb: 8, so: 20, hbp: 0, er: 10, w: 1, l: 2, sv: 1, rk: true },
      { id: 'witasja01', name: 'Jay Witasick', role: 'RP', throws: 'R', age: 33, g: 20, gs: 0, outs: 68, h: 23, hr: 2, bb: 14, so: 27, hbp: 2, er: 11, w: 1, l: 0, sv: 0 },
      { id: 'windsja01', name: 'Jason Windsor', role: 'RP', throws: 'R', age: 23, g: 4, gs: 3, outs: 41, h: 21, hr: 2, bb: 5, so: 6, hbp: 0, er: 10, w: 0, l: 1, sv: 0, rk: true },
      { id: 'keislra01', name: 'Randy Keisler', role: 'RP', throws: 'L', age: 30, g: 11, gs: 0, outs: 30, h: 12, hr: 2, bb: 4, so: 7, hbp: 0, er: 6, w: 0, l: 0, sv: 0 },
    ],
  },
  // SEA (SEA 2006)
  {
    franchiseId: 'SEA',
    season: 2006,
    batters: [
      { id: 'johjike01', name: 'Kenji Johjima', pos: 'C', bats: 'R', age: 30, pa: 542, h: 147, double: 25, triple: 1, hr: 18, bb: 20, so: 46, hbp: 13, sb: 3, cs: 1, sec: '1B', fld: 70, arm: 74, rk: true },
      { id: 'sexsori01', name: 'Richie Sexson', pos: '1B', bats: 'R', age: 31, pa: 663, h: 152, double: 38, triple: 0, hr: 37, bb: 75, so: 159, hbp: 5, sb: 1, cs: 1, sec: 'LF', fld: 82 },
      { id: 'lopezjo01', name: 'Jose Lopez', pos: '2B', bats: 'R', age: 22, pa: 655, h: 165, double: 34, triple: 6, hr: 10, bb: 25, so: 81, hbp: 9, sb: 6, cs: 3, sec: 'SS', fld: 62 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 27, pa: 681, h: 171, double: 38, triple: 2, hr: 27, bb: 46, so: 112, hbp: 7, sb: 8, cs: 3, sec: '1B', fld: 83 },
      { id: 'betanyu01', name: 'Yuniesky Betancourt', pos: 'SS', bats: 'R', age: 24, pa: 584, h: 156, double: 28, triple: 7, hr: 7, bb: 19, so: 56, hbp: 2, sb: 9, cs: 8, sec: '2B', fld: 69 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: 'LF', bats: 'L', age: 34, pa: 699, h: 180, double: 34, triple: 3, hr: 27, bb: 65, so: 107, hbp: 2, sb: 4, cs: 4, sec: 'RF', fld: 70, arm: 72 },
      { id: 'reedje03', name: 'Jeremy Reed', pos: 'CF', bats: 'L', age: 25, pa: 229, h: 51, double: 11, triple: 3, hr: 3, bb: 17, so: 30, hbp: 1, sb: 4, cs: 4, sec: 'LF', fld: 64, arm: 70 },
      { id: 'suzukic01', name: 'Ichiro Suzuki', pos: 'RF', bats: 'L', age: 32, pa: 752, h: 225, double: 21, triple: 9, hr: 11, bb: 49, so: 68, hbp: 5, sb: 40, cs: 6, sec: 'CF', fld: 82, arm: 69 },
      { id: 'evereca01', name: 'Carl Everett', pos: 'DH', bats: 'S', age: 35, pa: 343, h: 75, double: 11, triple: 1, hr: 12, bb: 26, so: 58, hbp: 4, sb: 2, cs: 3, sec: 'RF' },
    ],
    bench: [
      { id: 'bloomwi01', name: 'Willie Bloomquist', pos: 'CF', bats: 'R', age: 28, pa: 283, h: 64, double: 10, triple: 2, hr: 1, bb: 19, so: 44, hbp: 3, sb: 16, cs: 2, sec: 'LF', fld: 71, arm: 68 },
      { id: 'snellch02', name: 'Chris Snelling', pos: 'RF', bats: 'L', age: 24, pa: 119, h: 25, double: 6, triple: 1, hr: 3, bb: 14, so: 33, hbp: 3, sb: 2, cs: 2, sec: 'LF', fld: 44, arm: 64, rk: true },
      { id: 'riverre01', name: 'Rene Rivera', pos: 'C', bats: 'R', age: 22, pa: 106, h: 21, double: 5, triple: 0, hr: 2, bb: 3, so: 28, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 53, arm: 77, rk: true },
      { id: 'jonesad01', name: 'Adam Jones', pos: 'CF', bats: 'R', age: 20, pa: 76, h: 16, double: 4, triple: 0, hr: 1, bb: 2, so: 22, hbp: 0, sb: 3, cs: 1, sec: 'LF', fld: 89, arm: 95, rk: true },
      { id: 'morsemi01', name: 'Mike Morse', pos: 'RF', bats: 'R', age: 24, pa: 48, h: 13, double: 3, triple: 0, hr: 0, bb: 3, so: 9, hbp: 1, sb: 1, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 43, g: 33, gs: 33, outs: 634, h: 229, hr: 32, bb: 54, so: 111, hbp: 7, er: 103, w: 11, l: 14, sv: 0, fld: 76 },
      { id: 'hernafe02', name: 'Felix Hernandez', role: 'SP', throws: 'R', age: 20, g: 31, gs: 31, outs: 573, h: 185, hr: 21, bb: 59, so: 179, hbp: 6, er: 89, w: 12, l: 14, sv: 0, fld: 77 },
      { id: 'washbja01', name: 'Jarrod Washburn', role: 'SP', throws: 'L', age: 31, g: 31, gs: 31, outs: 561, h: 197, hr: 23, bb: 54, so: 103, hbp: 7, er: 87, w: 8, l: 14, sv: 0, fld: 69 },
      { id: 'mechegi01', name: 'Gil Meche', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 560, h: 189, hr: 25, bb: 84, so: 139, hbp: 6, er: 97, w: 11, l: 8, sv: 0, fld: 66 },
      { id: 'pineijo01', name: 'Joel Pineiro', role: 'SP', throws: 'R', age: 27, g: 40, gs: 25, outs: 497, h: 204, hr: 23, bb: 58, so: 98, hbp: 8, er: 110, w: 8, l: 13, sv: 1, fld: 77 },
      { id: 'putzjj01', name: 'J. J. Putz', role: 'CL', throws: 'R', age: 29, g: 72, gs: 0, outs: 235, h: 64, hr: 7, bb: 19, so: 80, hbp: 3, er: 25, w: 4, l: 1, sv: 36 },
      { id: 'woodsja01', name: 'Jake Woods', role: 'RP', throws: 'L', age: 24, g: 37, gs: 8, outs: 315, h: 115, hr: 14, bb: 50, so: 68, hbp: 3, er: 50, w: 7, l: 4, sv: 1, rk: true },
      { id: 'soriara01', name: 'Rafael Soriano', role: 'RP', throws: 'R', age: 26, g: 53, gs: 0, outs: 180, h: 46, hr: 5, bb: 20, so: 65, hbp: 2, er: 16, w: 1, l: 2, sv: 2 },
      { id: 'mateoju01', name: 'Julio Mateo', role: 'RP', throws: 'R', age: 28, g: 48, gs: 0, outs: 161, h: 57, hr: 8, bb: 17, so: 34, hbp: 4, er: 24, w: 9, l: 4, sv: 0 },
      { id: 'sherrge01', name: 'George Sherrill', role: 'RP', throws: 'L', age: 29, g: 72, gs: 0, outs: 120, h: 31, hr: 2, bb: 23, so: 42, hbp: 1, er: 20, w: 2, l: 4, sv: 1, rk: true },
      { id: 'guarded01', name: 'Eddie Guardado', role: 'RP', throws: 'L', age: 35, g: 43, gs: 0, outs: 111, h: 39, hr: 8, bb: 12, so: 38, hbp: 1, er: 14, w: 1, l: 3, sv: 13 },
    ],
    reservePitchers: [
      { id: 'frutoem01', name: 'Emiliano Fruto', role: 'RP', throws: 'R', age: 22, g: 23, gs: 0, outs: 108, h: 34, hr: 4, bb: 24, so: 34, hbp: 2, er: 22, w: 2, l: 2, sv: 1, rk: true },
      { id: 'baekch01', name: 'Cha-Seung Baek', role: 'RP', throws: 'R', age: 26, g: 6, gs: 6, outs: 103, h: 28, hr: 6, bb: 13, so: 22, hbp: 2, er: 15, w: 4, l: 1, sv: 0, rk: true },
      { id: 'greense01', name: 'Sean Green', role: 'RP', throws: 'R', age: 27, g: 24, gs: 0, outs: 96, h: 34, hr: 2, bb: 13, so: 15, hbp: 2, er: 16, w: 0, l: 0, sv: 0, rk: true },
      { id: 'lowema01', name: 'Mark Lowe', role: 'RP', throws: 'R', age: 23, g: 15, gs: 0, outs: 56, h: 12, hr: 1, bb: 9, so: 20, hbp: 2, er: 4, w: 1, l: 0, sv: 0, rk: true },
      { id: 'feierry01', name: 'Ryan Feierabend', role: 'RP', throws: 'L', age: 20, g: 4, gs: 2, outs: 51, h: 15, hr: 3, bb: 7, so: 11, hbp: 0, er: 7, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // TEX (TEX 2006)
  {
    franchiseId: 'TEX',
    season: 2006,
    batters: [
      { id: 'barajro01', name: 'Rod Barajas', pos: 'C', bats: 'R', age: 30, pa: 371, h: 87, double: 21, triple: 0, hr: 14, bb: 18, so: 55, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 74 },
      { id: 'teixema01', name: 'Mark Teixeira', pos: '1B', bats: 'S', age: 26, pa: 727, h: 183, double: 43, triple: 2, hr: 38, bb: 82, so: 128, hbp: 7, sb: 3, cs: 0, sec: '3B', fld: 73 },
      { id: 'kinslia01', name: 'Ian Kinsler', pos: '2B', bats: 'R', age: 24, pa: 474, h: 121, double: 27, triple: 1, hr: 14, bb: 40, so: 64, hbp: 3, sb: 11, cs: 4, sec: 'SS', fld: 82, rk: true },
      { id: 'blaloha01', name: 'Hank Blalock', pos: '3B', bats: 'L', age: 25, pa: 646, h: 156, double: 29, triple: 2, hr: 21, bb: 52, so: 112, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 64 },
      { id: 'youngmi02', name: 'Michael Young', pos: 'SS', bats: 'R', age: 29, pa: 748, h: 220, double: 45, triple: 5, hr: 19, bb: 51, so: 94, hbp: 2, sb: 7, cs: 3, sec: '2B', fld: 87 },
      { id: 'wilkebr01', name: 'Brad Wilkerson', pos: 'LF', bats: 'L', age: 29, pa: 365, h: 75, double: 20, triple: 3, hr: 12, bb: 45, so: 93, hbp: 3, sb: 4, cs: 4, sec: 'CF', fld: 69, arm: 76 },
      { id: 'matthga02', name: 'Gary Matthews', pos: 'CF', bats: 'S', age: 31, pa: 690, h: 181, double: 40, triple: 6, hr: 20, bb: 60, so: 109, hbp: 3, sb: 11, cs: 5, sec: 'RF', fld: 65, arm: 70 },
      { id: 'derosma01', name: 'Mark DeRosa', pos: 'RF', bats: 'R', age: 31, pa: 572, h: 145, double: 35, triple: 1, hr: 14, bb: 45, so: 103, hbp: 6, sb: 4, cs: 4, sec: 'LF', fld: 75, arm: 75 },
      { id: 'menchke01', name: 'Kevin Mench', pos: 'DH', bats: 'R', age: 28, pa: 482, h: 118, double: 26, triple: 2, hr: 18, bb: 33, so: 57, hbp: 4, sb: 2, cs: 1, sec: 'LF', fld: 61, arm: 64 },
    ],
    bench: [
      { id: 'nevinph01', name: 'Phil Nevin', pos: 'DH', bats: 'R', age: 35, pa: 450, h: 100, double: 16, triple: 0, hr: 19, bb: 42, so: 102, hbp: 2, sb: 1, cs: 0, sec: '3B' },
      { id: 'lairdge01', name: 'Gerald Laird', pos: 'C', bats: 'R', age: 26, pa: 260, h: 67, double: 18, triple: 1, hr: 6, bb: 13, so: 53, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 65, arm: 85 },
      { id: 'hairsje02', name: 'Jerry Hairston', pos: 'LF', bats: 'R', age: 30, pa: 192, h: 42, double: 9, triple: 1, hr: 1, bb: 14, so: 24, hbp: 4, sb: 5, cs: 3, sec: 'CF', fld: 89, arm: 95 },
      { id: 'cruzne02', name: 'Nelson Cruz', pos: 'RF', bats: 'R', age: 25, pa: 138, h: 29, double: 4, triple: 0, hr: 6, bb: 8, so: 31, hbp: 0, sb: 1, cs: 0, sec: 'LF', fld: 71, arm: 84, rk: true },
      { id: 'jimenda01', name: 'D\'Angelo Jimenez', pos: '2B', bats: 'S', age: 28, pa: 88, h: 18, double: 4, triple: 0, hr: 1, bb: 12, so: 14, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 46 },
    ],
    reserveBatters: [
      { id: 'bottsja01', name: 'Jason Botts', pos: 'DH', bats: 'S', age: 25, pa: 60, h: 12, double: 3, triple: 0, hr: 1, bb: 8, so: 20, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'brownad01', name: 'Adrian Brown', pos: 'RF', bats: 'S', age: 32, pa: 40, h: 7, double: 1, triple: 0, hr: 0, bb: 2, so: 9, hbp: 0, sb: 1, cs: 0, sec: 'CF' },
    ],
    pitchers: [
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 645, h: 221, hr: 23, bb: 58, so: 163, hbp: 5, er: 96, w: 16, l: 12, sv: 0, fld: 74 },
      { id: 'padilvi01', name: 'Vicente Padilla', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 600, h: 203, hr: 24, bb: 78, so: 149, hbp: 15, er: 101, w: 15, l: 10, sv: 0, fld: 67 },
      { id: 'koronjo01', name: 'John Koronka', role: 'SP', throws: 'L', age: 25, g: 23, gs: 23, outs: 375, h: 145, hr: 17, bb: 48, so: 62, hbp: 5, er: 81, w: 7, l: 7, sv: 0, rk: true },
      { id: 'loeka01', name: 'Kameron Loe', role: 'SP', throws: 'R', age: 24, g: 15, gs: 15, outs: 235, h: 94, hr: 8, bb: 25, so: 37, hbp: 2, er: 43, w: 3, l: 6, sv: 0 },
      { id: 'tejedro01', name: 'Rob Tejeda', role: 'SP', throws: 'R', age: 24, g: 14, gs: 14, outs: 221, h: 73, hr: 8, bb: 38, so: 50, hbp: 5, er: 33, w: 5, l: 5, sv: 0 },
      { id: 'otsukak01', name: 'Akinori Otsuka', role: 'CL', throws: 'R', age: 34, g: 63, gs: 0, outs: 179, h: 49, hr: 3, bb: 19, so: 53, hbp: 1, er: 16, w: 2, l: 4, sv: 32 },
      { id: 'benoijo01', name: 'Joaquin Benoit', role: 'RP', throws: 'R', age: 28, g: 56, gs: 0, outs: 239, h: 71, hr: 8, bb: 34, so: 78, hbp: 3, er: 41, w: 1, l: 1, sv: 0 },
      { id: 'cordefr01', name: 'Francisco Cordero', role: 'RP', throws: 'R', age: 31, g: 77, gs: 0, outs: 226, h: 67, hr: 6, bb: 33, so: 85, hbp: 3, er: 28, w: 10, l: 5, sv: 22 },
      { id: 'bauerri01', name: 'Rick Bauer', role: 'RP', throws: 'R', age: 29, g: 58, gs: 1, outs: 213, h: 73, hr: 5, bb: 26, so: 38, hbp: 4, er: 32, w: 3, l: 1, sv: 2 },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 35, g: 62, gs: 0, outs: 171, h: 57, hr: 8, bb: 26, so: 51, hbp: 0, er: 27, w: 1, l: 3, sv: 0 },
      { id: 'wilsocj01', name: 'C. J. Wilson', role: 'RP', throws: 'L', age: 25, g: 44, gs: 0, outs: 133, h: 46, hr: 6, bb: 17, so: 35, hbp: 4, er: 25, w: 2, l: 4, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'rheinjo01', name: 'John Rheinecker', role: 'SP', throws: 'L', age: 27, g: 21, gs: 13, outs: 212, h: 104, hr: 6, bb: 19, so: 28, hbp: 3, er: 46, w: 4, l: 6, sv: 0, rk: true },
      { id: 'eatonad01', name: 'Adam Eaton', role: 'SP', throws: 'R', age: 28, g: 13, gs: 13, outs: 195, h: 74, hr: 9, bb: 22, so: 50, hbp: 3, er: 35, w: 7, l: 4, sv: 0 },
      { id: 'feldmsc01', name: 'Scott Feldman', role: 'RP', throws: 'R', age: 23, g: 36, gs: 0, outs: 124, h: 42, hr: 3, bb: 10, so: 29, hbp: 3, er: 16, w: 0, l: 2, sv: 0, rk: true },
      { id: 'littlwe01', name: 'Wes Littleton', role: 'RP', throws: 'R', age: 23, g: 33, gs: 0, outs: 109, h: 23, hr: 2, bb: 13, so: 17, hbp: 2, er: 7, w: 2, l: 1, sv: 1, rk: true },
      { id: 'volqued01', name: 'Edinson Volquez', role: 'RP', throws: 'R', age: 22, g: 8, gs: 8, outs: 100, h: 53, hr: 7, bb: 18, so: 17, hbp: 2, er: 31, w: 1, l: 6, sv: 0, rk: true },
    ],
  },
  // ATL (ATL 2006)
  {
    franchiseId: 'ATL',
    season: 2006,
    batters: [
      { id: 'mccanbr01', name: 'Brian McCann', pos: 'C', bats: 'L', age: 22, pa: 492, h: 141, double: 30, triple: 0, hr: 21, bb: 42, so: 56, hbp: 3, sb: 2, cs: 1, sec: '1B', fld: 71, arm: 65 },
      { id: 'larocad01', name: 'Adam LaRoche', pos: '1B', bats: 'L', age: 26, pa: 557, h: 137, double: 36, triple: 1, hr: 27, bb: 50, so: 117, hbp: 3, sb: 0, cs: 2, sec: '3B', fld: 81 },
      { id: 'gilesma01', name: 'Marcus Giles', pos: '2B', bats: 'R', age: 28, pa: 626, h: 153, double: 36, triple: 3, hr: 12, bb: 61, so: 104, hbp: 6, sb: 14, cs: 4, sec: 'SS', fld: 67 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: '3B', bats: 'S', age: 34, pa: 477, h: 121, double: 27, triple: 2, hr: 25, bb: 69, so: 71, hbp: 1, sb: 5, cs: 1, sec: 'SS', fld: 62 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 29, pa: 673, h: 173, double: 38, triple: 2, hr: 11, bb: 56, so: 91, hbp: 3, sb: 14, cs: 6, sec: '2B', fld: 62 },
      { id: 'langery01', name: 'Ryan Langerhans', pos: 'LF', bats: 'L', age: 26, pa: 369, h: 80, double: 18, triple: 3, hr: 7, bb: 45, so: 84, hbp: 4, sb: 1, cs: 2, sec: 'RF', fld: 76, arm: 62 },
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'CF', bats: 'R', age: 29, pa: 669, h: 151, double: 28, triple: 2, hr: 43, bb: 74, so: 126, hbp: 12, sb: 5, cs: 3, sec: 'RF', fld: 74, arm: 64 },
      { id: 'francje02', name: 'Jeff Francoeur', pos: 'RF', bats: 'R', age: 22, pa: 686, h: 174, double: 29, triple: 5, hr: 30, bb: 24, so: 135, hbp: 9, sb: 2, cs: 6, sec: 'LF', fld: 61, arm: 75 },
      { id: 'betemwi01', name: 'Wilson Betemit', pos: 'DH', bats: 'S', age: 24, pa: 412, h: 101, double: 21, triple: 2, hr: 14, bb: 35, so: 97, hbp: 0, sb: 2, cs: 2, sec: '3B', fld: 53 },
    ],
    bench: [
      { id: 'diazma02', name: 'Matt Diaz', pos: 'LF', bats: 'R', age: 28, pa: 322, h: 94, double: 15, triple: 5, hr: 7, bb: 11, so: 50, hbp: 9, sb: 4, cs: 5, sec: 'RF', fld: 87, arm: 73 },
      { id: 'orrpe01', name: 'Pete Orr', pos: '2B', bats: 'L', age: 27, pa: 164, h: 42, double: 5, triple: 3, hr: 1, bb: 5, so: 27, hbp: 0, sb: 4, cs: 3, sec: '3B', fld: 83 },
      { id: 'prattto02', name: 'Todd Pratt', pos: 'C', bats: 'R', age: 39, pa: 152, h: 31, double: 5, triple: 0, hr: 4, bb: 14, so: 41, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 65, arm: 66 },
      { id: 'thormsc01', name: 'Scott Thorman', pos: 'LF', bats: 'L', age: 24, pa: 133, h: 30, double: 11, triple: 0, hr: 5, bb: 5, so: 21, hbp: 0, sb: 1, cs: 0, sec: '1B', rk: true },
      { id: 'jordabr01', name: 'Brian Jordan', pos: '1B', bats: 'R', age: 39, pa: 101, h: 22, double: 3, triple: 0, hr: 2, bb: 6, so: 19, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 58 },
    ],
    reserveBatters: [
      { id: 'pradoma01', name: 'Martin Prado', pos: '2B', bats: 'R', age: 22, pa: 49, h: 11, double: 1, triple: 1, hr: 1, bb: 5, so: 7, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
      { id: 'penato02', name: 'Tony Pena', pos: 'SS', bats: 'R', age: 25, pa: 46, h: 10, double: 2, triple: 0, hr: 1, bb: 2, so: 10, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
      { id: 'penabr01', name: 'Brayan Pena', pos: 'C', bats: 'S', age: 24, pa: 43, h: 10, double: 2, triple: 0, hr: 1, bb: 2, so: 6, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'smoltjo01', name: 'John Smoltz', role: 'SP', throws: 'R', age: 39, g: 35, gs: 35, outs: 696, h: 219, hr: 21, bb: 54, so: 200, hbp: 5, er: 85, w: 16, l: 9, sv: 0, fld: 76 },
      { id: 'hudsoti01', name: 'Tim Hudson', role: 'SP', throws: 'R', age: 30, g: 35, gs: 35, outs: 655, h: 231, hr: 22, bb: 74, so: 136, hbp: 10, er: 104, w: 13, l: 12, sv: 0, fld: 77 },
      { id: 'jamesch03', name: 'Chuck James', role: 'SP', throws: 'L', age: 24, g: 25, gs: 18, outs: 357, h: 101, hr: 19, bb: 48, so: 91, hbp: 6, er: 49, w: 11, l: 4, sv: 0, rk: true },
      { id: 'sosajo02', name: 'Jorge Sosa', role: 'SP', throws: 'R', age: 28, g: 45, gs: 13, outs: 354, h: 125, hr: 22, bb: 50, so: 81, hbp: 1, er: 58, w: 3, l: 11, sv: 4 },
      { id: 'thomsjo01', name: 'John Thomson', role: 'SP', throws: 'R', age: 32, g: 18, gs: 15, outs: 241, h: 92, hr: 8, bb: 26, so: 51, hbp: 2, er: 40, w: 2, l: 7, sv: 0 },
      { id: 'reitsch01', name: 'Chris Reitsma', role: 'CL', throws: 'R', age: 28, g: 27, gs: 0, outs: 84, h: 39, hr: 4, bb: 7, so: 18, hbp: 1, er: 18, w: 1, l: 2, sv: 8 },
      { id: 'villaos01', name: 'Oscar Villarreal', role: 'RP', throws: 'R', age: 24, g: 58, gs: 4, outs: 277, h: 93, hr: 13, bb: 28, so: 55, hbp: 5, er: 40, w: 9, l: 1, sv: 0 },
      { id: 'cormila01', name: 'Lance Cormier', role: 'RP', throws: 'R', age: 25, g: 29, gs: 9, outs: 221, h: 88, hr: 9, bb: 40, so: 48, hbp: 3, er: 44, w: 4, l: 5, sv: 0 },
      { id: 'rayke01', name: 'Ken Ray', role: 'RP', throws: 'R', age: 31, g: 69, gs: 0, outs: 203, h: 66, hr: 9, bb: 38, so: 50, hbp: 0, er: 34, w: 1, l: 1, sv: 5, rk: true },
      { id: 'mcbrima01', name: 'Macay McBride', role: 'RP', throws: 'L', age: 23, g: 71, gs: 0, outs: 170, h: 55, hr: 2, bb: 31, so: 52, hbp: 1, er: 25, w: 4, l: 1, sv: 1, rk: true },
      { id: 'paronch01', name: 'Chad Paronto', role: 'RP', throws: 'R', age: 30, g: 65, gs: 0, outs: 170, h: 53, hr: 5, bb: 19, so: 41, hbp: 3, er: 20, w: 2, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'ramirho01', name: 'Horacio Ramirez', role: 'SP', throws: 'L', age: 26, g: 14, gs: 14, outs: 229, h: 83, hr: 10, bb: 29, so: 34, hbp: 2, er: 38, w: 5, l: 5, sv: 0 },
      { id: 'davieky01', name: 'Kyle Davies', role: 'SP', throws: 'R', age: 22, g: 14, gs: 14, outs: 190, h: 83, hr: 10, bb: 35, so: 49, hbp: 2, er: 49, w: 3, l: 7, sv: 0 },
      { id: 'yatesty01', name: 'Tyler Yates', role: 'RP', throws: 'R', age: 28, g: 56, gs: 0, outs: 150, h: 46, hr: 6, bb: 29, so: 43, hbp: 1, er: 25, w: 2, l: 5, sv: 1, rk: true },
      { id: 'barryke01', name: 'Kevin Barry', role: 'RP', throws: 'R', age: 27, g: 19, gs: 1, outs: 77, h: 24, hr: 2, bb: 14, so: 19, hbp: 1, er: 16, w: 1, l: 1, sv: 0, rk: true },
      { id: 'remlimi01', name: 'Mike Remlinger', role: 'RP', throws: 'L', age: 40, g: 36, gs: 0, outs: 67, h: 26, hr: 3, bb: 10, so: 20, hbp: 1, er: 13, w: 2, l: 4, sv: 2 },
    ],
  },
  // MIA (FLO 2006)
  {
    franchiseId: 'MIA',
    season: 2006,
    batters: [
      { id: 'olivomi01', name: 'Miguel Olivo', pos: 'C', bats: 'R', age: 27, pa: 452, h: 106, double: 21, triple: 3, hr: 16, bb: 13, so: 111, hbp: 6, sb: 5, cs: 4, sec: '1B', fld: 67, arm: 78 },
      { id: 'jacobmi02', name: 'Mike Jacobs', pos: '1B', bats: 'L', age: 25, pa: 520, h: 126, double: 36, triple: 1, hr: 24, bb: 45, so: 105, hbp: 1, sb: 3, cs: 0, sec: '3B', fld: 64, rk: true },
      { id: 'ugglada01', name: 'Dan Uggla', pos: '2B', bats: 'R', age: 26, pa: 683, h: 172, double: 26, triple: 7, hr: 27, bb: 48, so: 123, hbp: 9, sb: 6, cs: 6, sec: 'SS', fld: 72, rk: true },
      { id: 'cabremi01', name: 'Miguel Cabrera', pos: '3B', bats: 'R', age: 23, pa: 676, h: 192, double: 44, triple: 2, hr: 29, bb: 75, so: 120, hbp: 7, sb: 6, cs: 3, sec: '1B', fld: 62 },
      { id: 'ramirha01', name: 'Hanley Ramirez', pos: 'SS', bats: 'R', age: 22, pa: 700, h: 185, double: 46, triple: 11, hr: 17, bb: 56, so: 129, hbp: 4, sb: 51, cs: 15, sec: '2B', fld: 69, rk: true },
      { id: 'willijo03', name: 'Josh Willingham', pos: 'LF', bats: 'R', age: 27, pa: 573, h: 138, double: 27, triple: 2, hr: 25, bb: 54, so: 110, hbp: 12, sb: 2, cs: 0, sec: 'RF', fld: 54, arm: 66, rk: true },
      { id: 'abercre01', name: 'Reggie Abercrombie', pos: 'CF', bats: 'R', age: 25, pa: 281, h: 54, double: 12, triple: 2, hr: 5, bb: 18, so: 78, hbp: 3, sb: 6, cs: 5, sec: 'RF', fld: 66, arm: 67, rk: true },
      { id: 'hermije01', name: 'Jeremy Hermida', pos: 'RF', bats: 'L', age: 22, pa: 348, h: 78, double: 19, triple: 1, hr: 7, bb: 34, so: 72, hbp: 5, sb: 5, cs: 1, sec: 'LF', fld: 59, arm: 57, rk: true },
      { id: 'borchjo01', name: 'Joe Borchard', pos: 'DH', bats: 'S', age: 27, pa: 270, h: 54, double: 7, triple: 1, hr: 10, bb: 26, so: 70, hbp: 3, sb: 0, cs: 3, sec: 'RF', fld: 78, arm: 95 },
    ],
    bench: [
      { id: 'amezaal01', name: 'Alfredo Amezaga', pos: 'CF', bats: 'S', age: 28, pa: 378, h: 84, double: 9, triple: 3, hr: 3, bb: 31, so: 49, hbp: 4, sb: 20, cs: 11, sec: 'LF', fld: 70, arm: 65 },
      { id: 'rossco01', name: 'Cody Ross', pos: 'LF', bats: 'R', age: 25, pa: 298, h: 60, double: 12, triple: 2, hr: 12, bb: 21, so: 68, hbp: 4, sb: 1, cs: 1, sec: 'RF', fld: 68, arm: 67, rk: true },
      { id: 'helmswe01', name: 'Wes Helms', pos: '1B', bats: 'R', age: 30, pa: 278, h: 75, double: 18, triple: 3, hr: 8, bb: 21, so: 52, hbp: 5, sb: 0, cs: 3, sec: '3B', fld: 73 },
      { id: 'treanma01', name: 'Matt Treanor', pos: 'C', bats: 'R', age: 30, pa: 185, h: 35, double: 7, triple: 1, hr: 1, bb: 19, so: 34, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 74, arm: 86 },
      { id: 'aguilch01', name: 'Chris Aguila', pos: 'RF', bats: 'R', age: 27, pa: 104, h: 23, double: 6, triple: 1, hr: 1, bb: 7, so: 26, hbp: 0, sb: 1, cs: 1, sec: 'LF', fld: 68, arm: 80, rk: true },
    ],
    reserveBatters: [
      { id: 'reeder01', name: 'Eric Reed', pos: 'CF', bats: 'L', age: 25, pa: 47, h: 4, double: 0, triple: 0, hr: 0, bb: 2, so: 10, hbp: 2, sb: 3, cs: 1, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'willido03', name: 'Dontrelle Willis', role: 'SP', throws: 'L', age: 24, g: 34, gs: 34, outs: 670, h: 230, hr: 18, bb: 72, so: 165, hbp: 14, er: 88, w: 12, l: 12, sv: 0, fld: 74 },
      { id: 'olsensc01', name: 'Scott Olsen', role: 'SP', throws: 'L', age: 22, g: 31, gs: 31, outs: 542, h: 161, hr: 24, bb: 76, so: 167, hbp: 6, er: 81, w: 12, l: 10, sv: 0, fld: 64, rk: true },
      { id: 'johnsjo09', name: 'Josh Johnson', role: 'SP', throws: 'R', age: 22, g: 31, gs: 24, outs: 471, h: 135, hr: 13, bb: 71, so: 132, hbp: 4, er: 54, w: 12, l: 7, sv: 0, fld: 74, rk: true },
      { id: 'nolasri01', name: 'Ricky Nolasco', role: 'SP', throws: 'R', age: 23, g: 35, gs: 22, outs: 420, h: 157, hr: 20, bb: 41, so: 99, hbp: 10, er: 75, w: 11, l: 11, sv: 0, fld: 55, rk: true },
      { id: 'moehlbr01', name: 'Brian Moehler', role: 'SP', throws: 'R', age: 34, g: 29, gs: 21, outs: 366, h: 161, hr: 16, bb: 36, so: 66, hbp: 5, er: 77, w: 7, l: 11, sv: 0 },
      { id: 'borowjo01', name: 'Joe Borowski', role: 'CL', throws: 'R', age: 35, g: 72, gs: 0, outs: 209, h: 64, hr: 9, bb: 30, so: 57, hbp: 1, er: 33, w: 3, l: 3, sv: 36 },
      { id: 'hergema01', name: 'Matt Herges', role: 'RP', throws: 'R', age: 36, g: 66, gs: 0, outs: 213, h: 94, hr: 7, bb: 27, so: 35, hbp: 3, er: 39, w: 2, l: 3, sv: 0 },
      { id: 'messera01', name: 'Randy Messenger', role: 'RP', throws: 'R', age: 24, g: 59, gs: 0, outs: 181, h: 68, hr: 8, bb: 31, so: 45, hbp: 1, er: 37, w: 2, l: 7, sv: 0, rk: true },
      { id: 'vargaja01', name: 'Jason Vargas', role: 'RP', throws: 'L', age: 23, g: 12, gs: 5, outs: 129, h: 48, hr: 6, bb: 25, so: 32, hbp: 3, er: 28, w: 1, l: 2, sv: 0 },
      { id: 'mitrese01', name: 'Sergio Mitre', role: 'RP', throws: 'R', age: 25, g: 15, gs: 7, outs: 123, h: 46, hr: 7, bb: 18, so: 29, hbp: 4, er: 27, w: 1, l: 5, sv: 0 },
      { id: 'tanketa01', name: 'Taylor Tankersley', role: 'RP', throws: 'L', age: 23, g: 49, gs: 0, outs: 123, h: 33, hr: 4, bb: 26, so: 46, hbp: 1, er: 13, w: 2, l: 1, sv: 3, rk: true },
    ],
    reservePitchers: [
      { id: 'sanchan01', name: 'Anibal Sanchez', role: 'SP', throws: 'R', age: 22, g: 18, gs: 17, outs: 343, h: 90, hr: 9, bb: 46, so: 72, hbp: 4, er: 36, w: 10, l: 3, sv: 0, rk: true },
      { id: 'kensilo01', name: 'Logan Kensing', role: 'RP', throws: 'R', age: 23, g: 37, gs: 0, outs: 113, h: 34, hr: 7, bb: 19, so: 39, hbp: 3, er: 23, w: 1, l: 3, sv: 1, rk: true },
      { id: 'pintore01', name: 'Renyel Pinto', role: 'RP', throws: 'L', age: 23, g: 27, gs: 0, outs: 89, h: 20, hr: 3, bb: 27, so: 36, hbp: 1, er: 10, w: 0, l: 0, sv: 1, rk: true },
      { id: 'petityu01', name: 'Yusmeiro Petit', role: 'RP', throws: 'R', age: 21, g: 15, gs: 1, outs: 79, h: 46, hr: 7, bb: 9, so: 20, hbp: 0, er: 28, w: 1, l: 1, sv: 0, rk: true },
      { id: 'resopch01', name: 'Chris Resop', role: 'RP', throws: 'R', age: 23, g: 22, gs: 0, outs: 64, h: 27, hr: 1, bb: 15, so: 13, hbp: 1, er: 12, w: 1, l: 2, sv: 0, rk: true },
    ],
  },
  // NYM (NYN 2006)
  {
    franchiseId: 'NYM',
    season: 2006,
    batters: [
      { id: 'loducpa01', name: 'Paul Lo Duca', pos: 'C', bats: 'R', age: 34, pa: 551, h: 152, double: 33, triple: 1, hr: 7, bb: 30, so: 38, hbp: 6, sb: 4, cs: 2, sec: '1B', fld: 66, arm: 66 },
      { id: 'delgaca01', name: 'Carlos Delgado', pos: '1B', bats: 'L', age: 34, pa: 618, h: 145, double: 34, triple: 2, hr: 36, bb: 74, so: 122, hbp: 13, sb: 0, cs: 0, sec: 'LF', fld: 64 },
      { id: 'valenjo03', name: 'Jose Valentin', pos: '2B', bats: 'S', age: 36, pa: 432, h: 91, double: 20, triple: 3, hr: 18, bb: 43, so: 85, hbp: 2, sb: 6, cs: 3, sec: 'SS', fld: 84 },
      { id: 'wrighda03', name: 'David Wright', pos: '3B', bats: 'R', age: 23, pa: 661, h: 179, double: 41, triple: 3, hr: 27, bb: 66, so: 112, hbp: 6, sb: 18, cs: 5, sec: '1B', fld: 63 },
      { id: 'reyesjo01', name: 'Jose Reyes', pos: 'SS', bats: 'S', age: 23, pa: 703, h: 188, double: 28, triple: 16, hr: 13, bb: 40, so: 79, hbp: 1, sb: 61, cs: 15, sec: '2B', fld: 49 },
      { id: 'floydcl01', name: 'Cliff Floyd', pos: 'LF', bats: 'L', age: 33, pa: 376, h: 86, double: 17, triple: 1, hr: 16, bb: 34, so: 63, hbp: 9, sb: 7, cs: 1, sec: '1B', fld: 59, arm: 65 },
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 29, pa: 617, h: 142, double: 35, triple: 3, hr: 31, bb: 78, so: 94, hbp: 4, sb: 21, cs: 4, sec: 'LF', fld: 81, arm: 79 },
      { id: 'nadyxa01', name: 'Xavier Nady', pos: 'RF', bats: 'R', age: 27, pa: 512, h: 128, double: 26, triple: 2, hr: 18, bb: 31, so: 88, hbp: 11, sb: 3, cs: 2, sec: '1B', fld: 61, arm: 70 },
      { id: 'francju01', name: 'Julio Franco', pos: 'DH', bats: 'R', age: 47, pa: 179, h: 45, double: 9, triple: 1, hr: 4, bb: 16, so: 41, hbp: 1, sb: 4, cs: 1, sec: '1B', fld: 52 },
    ],
    bench: [
      { id: 'chaveen01', name: 'Endy Chavez', pos: 'RF', bats: 'L', age: 28, pa: 390, h: 101, double: 19, triple: 5, hr: 3, bb: 23, so: 39, hbp: 0, sb: 14, cs: 4, sec: 'CF', fld: 85, arm: 80 },
      { id: 'matsuka01', name: 'Kazuo Matsui', pos: '2B', bats: 'S', age: 30, pa: 265, h: 64, double: 12, triple: 3, hr: 3, bb: 16, so: 45, hbp: 2, sb: 8, cs: 1, sec: 'SS', fld: 86 },
      { id: 'woodwch01', name: 'Chris Woodward', pos: '2B', bats: 'R', age: 30, pa: 253, h: 54, double: 12, triple: 1, hr: 3, bb: 20, so: 56, hbp: 1, sb: 1, cs: 1, sec: 'SS', fld: 69 },
      { id: 'millela02', name: 'Lastings Milledge', pos: 'LF', bats: 'R', age: 21, pa: 185, h: 40, double: 7, triple: 2, hr: 4, bb: 12, so: 39, hbp: 5, sb: 1, cs: 2, sec: 'RF', fld: 61, arm: 76, rk: true },
      { id: 'castrra01', name: 'Ramon Castro', pos: 'C', bats: 'R', age: 30, pa: 144, h: 29, double: 8, triple: 0, hr: 4, bb: 15, so: 38, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 78, arm: 75 },
    ],
    reserveBatters: [
      { id: 'tuckemi01', name: 'Michael Tucker', pos: 'LF', bats: 'L', age: 35, pa: 74, h: 15, double: 3, triple: 0, hr: 1, bb: 10, so: 13, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
      { id: 'hernaan01', name: 'Anderson Hernandez', pos: '2B', bats: 'S', age: 23, pa: 67, h: 9, double: 1, triple: 1, hr: 1, bb: 1, so: 12, hbp: 0, sb: 0, cs: 1, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'glavito02', name: 'Tom Glavine', role: 'SP', throws: 'L', age: 40, g: 32, gs: 32, outs: 594, h: 204, hr: 18, bb: 61, so: 115, hbp: 4, er: 81, w: 15, l: 7, sv: 0, fld: 81 },
      { id: 'trachst01', name: 'Steve Trachsel', role: 'SP', throws: 'R', age: 35, g: 30, gs: 30, outs: 494, h: 181, hr: 23, bb: 74, so: 87, hbp: 4, er: 86, w: 15, l: 8, sv: 0, fld: 74 },
      { id: 'hernaor01', name: 'Orlando Hernandez', role: 'SP', throws: 'R', age: 40, g: 29, gs: 29, outs: 487, h: 158, hr: 22, bb: 62, so: 147, hbp: 13, er: 83, w: 11, l: 11, sv: 0, fld: 77 },
      { id: 'martipe02', name: 'Pedro Martinez', role: 'SP', throws: 'R', age: 34, g: 23, gs: 23, outs: 398, h: 108, hr: 16, bb: 35, so: 136, hbp: 7, er: 55, w: 9, l: 8, sv: 0 },
      { id: 'mainejo01', name: 'John Maine', role: 'SP', throws: 'R', age: 25, g: 16, gs: 15, outs: 270, h: 72, hr: 15, bb: 37, so: 65, hbp: 2, er: 42, w: 6, l: 5, sv: 0, rk: true },
      { id: 'wagnebi02', name: 'Billy Wagner', role: 'CL', throws: 'L', age: 34, g: 70, gs: 0, outs: 217, h: 53, hr: 7, bb: 19, so: 92, hbp: 4, er: 17, w: 3, l: 2, sv: 40 },
      { id: 'heilmaa01', name: 'Aaron Heilman', role: 'RP', throws: 'R', age: 27, g: 74, gs: 0, outs: 261, h: 72, hr: 5, bb: 29, so: 78, hbp: 4, er: 34, w: 4, l: 5, sv: 0 },
      { id: 'oliveda02', name: 'Darren Oliver', role: 'RP', throws: 'L', age: 35, g: 45, gs: 0, outs: 243, h: 75, hr: 13, bb: 21, so: 57, hbp: 3, er: 36, w: 4, l: 1, sv: 0 },
      { id: 'bradfch01', name: 'Chad Bradford', role: 'RP', throws: 'R', age: 31, g: 70, gs: 0, outs: 186, h: 59, hr: 2, bb: 15, so: 39, hbp: 2, er: 23, w: 4, l: 2, sv: 2 },
      { id: 'felicpe01', name: 'Pedro Feliciano', role: 'RP', throws: 'L', age: 29, g: 64, gs: 0, outs: 181, h: 55, hr: 4, bb: 22, so: 53, hbp: 3, er: 16, w: 7, l: 2, sv: 0 },
      { id: 'sanchdu01', name: 'Duaner Sanchez', role: 'RP', throws: 'R', age: 26, g: 49, gs: 0, outs: 166, h: 48, hr: 5, bb: 23, so: 42, hbp: 3, er: 19, w: 5, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'soleral01', name: 'Alay Soler', role: 'RP', throws: 'R', age: 26, g: 8, gs: 8, outs: 135, h: 50, hr: 7, bb: 21, so: 23, hbp: 1, er: 30, w: 2, l: 3, sv: 0, rk: true },
      { id: 'bannibr01', name: 'Brian Bannister', role: 'RP', throws: 'R', age: 25, g: 8, gs: 6, outs: 114, h: 34, hr: 4, bb: 22, so: 19, hbp: 2, er: 18, w: 2, l: 1, sv: 0, rk: true },
      { id: 'bellhe01', name: 'Heath Bell', role: 'RP', throws: 'R', age: 28, g: 22, gs: 0, outs: 111, h: 48, hr: 5, bb: 11, so: 36, hbp: 0, er: 22, w: 0, l: 0, sv: 0 },
      { id: 'pelfrmi01', name: 'Mike Pelfrey', role: 'RP', throws: 'R', age: 22, g: 4, gs: 4, outs: 64, h: 25, hr: 1, bb: 12, so: 13, hbp: 3, er: 13, w: 2, l: 1, sv: 0, rk: true },
      { id: 'zambrvi01', name: 'Victor Zambrano', role: 'RP', throws: 'R', age: 30, g: 5, gs: 5, outs: 64, h: 21, hr: 2, bb: 12, so: 16, hbp: 2, er: 11, w: 1, l: 2, sv: 0 },
    ],
  },
  // PHI (PHI 2006)
  {
    franchiseId: 'PHI',
    season: 2006,
    batters: [
      { id: 'liebemi01', name: 'Mike Lieberthal', pos: 'C', bats: 'R', age: 34, pa: 230, h: 55, double: 13, triple: 0, hr: 7, bb: 14, so: 21, hbp: 6, sb: 0, cs: 0, fld: 69, arm: 78 },
      { id: 'howarry01', name: 'Ryan Howard', pos: '1B', bats: 'L', age: 26, pa: 704, h: 182, double: 28, triple: 2, hr: 54, bb: 97, so: 187, hbp: 7, sb: 0, cs: 0, sec: '3B', fld: 64 },
      { id: 'utleych01', name: 'Chase Utley', pos: '2B', bats: 'L', age: 27, pa: 739, h: 196, double: 41, triple: 5, hr: 32, bb: 67, so: 129, hbp: 12, sb: 16, cs: 4, sec: 'SS', fld: 73 },
      { id: 'bellda01', name: 'David Bell', pos: '3B', bats: 'R', age: 33, pa: 566, h: 134, double: 28, triple: 2, hr: 11, bb: 48, so: 67, hbp: 4, sb: 2, cs: 1, sec: '2B', fld: 70 },
      { id: 'rolliji01', name: 'Jimmy Rollins', pos: 'SS', bats: 'S', age: 27, pa: 758, h: 196, double: 43, triple: 10, hr: 19, bb: 55, so: 77, hbp: 4, sb: 37, cs: 6, sec: '2B', fld: 69 },
      { id: 'burrepa01', name: 'Pat Burrell', pos: 'LF', bats: 'R', age: 29, pa: 567, h: 125, double: 23, triple: 1, hr: 28, bb: 90, so: 134, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 65, arm: 72 },
      { id: 'rowanaa01', name: 'Aaron Rowand', pos: 'CF', bats: 'R', age: 28, pa: 445, h: 110, double: 24, triple: 3, hr: 12, bb: 21, so: 78, hbp: 15, sb: 11, cs: 4, sec: 'LF', fld: 68, arm: 71 },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 32, pa: 686, h: 163, double: 40, triple: 1, hr: 20, bb: 119, so: 130, hbp: 4, sb: 31, cs: 7, sec: 'CF', fld: 67, arm: 72 },
      { id: 'delluda01', name: 'David Dellucci', pos: 'DH', bats: 'L', age: 32, pa: 301, h: 68, double: 12, triple: 3, hr: 15, bb: 37, so: 67, hbp: 4, sb: 3, cs: 2, sec: 'LF', fld: 63, arm: 62 },
    ],
    bench: [
      { id: 'victosh01', name: 'Shane Victorino', pos: 'CF', bats: 'R', age: 25, pa: 462, h: 119, double: 18, triple: 8, hr: 7, bb: 23, so: 55, hbp: 14, sb: 4, cs: 3, sec: 'LF', fld: 74, arm: 84, rk: true },
      { id: 'nunezab01', name: 'Abraham Nunez', pos: '3B', bats: 'S', age: 30, pa: 369, h: 80, double: 11, triple: 2, hr: 3, bb: 34, so: 55, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 65 },
      { id: 'costech01', name: 'Chris Coste', pos: 'C', bats: 'R', age: 33, pa: 213, h: 65, double: 14, triple: 0, hr: 7, bb: 10, so: 31, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 61, rk: true },
      { id: 'fasansa01', name: 'Sal Fasano', pos: 'C', bats: 'R', age: 34, pa: 206, h: 43, double: 9, triple: 0, hr: 8, bb: 8, so: 57, hbp: 6, sb: 0, cs: 1, fld: 69, arm: 65 },
      { id: 'ruizca01', name: 'Carlos Ruiz', pos: 'C', bats: 'R', age: 27, pa: 78, h: 18, double: 1, triple: 1, hr: 3, bb: 5, so: 8, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 64, arm: 63, rk: true },
    ],
    reserveBatters: [
      { id: 'roberch02', name: 'Chris Roberson', pos: 'LF', bats: 'S', age: 26, pa: 43, h: 8, double: 0, triple: 1, hr: 0, bb: 0, so: 9, hbp: 1, sb: 3, cs: 0, sec: 'RF', rk: true },
      { id: 'sandoda01', name: 'Danny Sandoval', pos: '2B', bats: 'S', age: 27, pa: 43, h: 8, double: 1, triple: 0, hr: 0, bb: 4, so: 4, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'myersbr01', name: 'Brett Myers', role: 'SP', throws: 'R', age: 25, g: 31, gs: 31, outs: 594, h: 192, hr: 30, bb: 64, so: 181, hbp: 6, er: 90, w: 12, l: 7, sv: 0, fld: 73 },
      { id: 'lidleco01', name: 'Cory Lidle', role: 'SP', throws: 'R', age: 34, g: 31, gs: 30, outs: 512, h: 187, hr: 24, bb: 50, so: 119, hbp: 9, er: 91, w: 12, l: 10, sv: 0, fld: 84 },
      { id: 'liebejo01', name: 'Jon Lieber', role: 'SP', throws: 'R', age: 36, g: 27, gs: 27, outs: 504, h: 190, hr: 25, bb: 26, so: 106, hbp: 5, er: 86, w: 9, l: 11, sv: 0, fld: 68 },
      { id: 'madsory01', name: 'Ryan Madson', role: 'SP', throws: 'R', age: 25, g: 50, gs: 17, outs: 403, h: 163, hr: 19, bb: 47, so: 109, hbp: 10, er: 76, w: 11, l: 9, sv: 2, fld: 77 },
      { id: 'hamelco01', name: 'Cole Hamels', role: 'SP', throws: 'L', age: 22, g: 23, gs: 23, outs: 397, h: 117, hr: 19, bb: 48, so: 145, hbp: 3, er: 60, w: 9, l: 8, sv: 0, rk: true },
      { id: 'gordoto01', name: 'Tom Gordon', role: 'CL', throws: 'R', age: 38, g: 59, gs: 0, outs: 178, h: 48, hr: 7, bb: 21, so: 63, hbp: 1, er: 19, w: 3, l: 4, sv: 34 },
      { id: 'gearyge01', name: 'Geoff Geary', role: 'RP', throws: 'R', age: 29, g: 81, gs: 0, outs: 274, h: 99, hr: 8, bb: 25, so: 62, hbp: 5, er: 35, w: 7, l: 1, sv: 1 },
      { id: 'frankry01', name: 'Ryan Franklin', role: 'RP', throws: 'R', age: 33, g: 66, gs: 0, outs: 232, h: 88, hr: 12, bb: 27, so: 41, hbp: 3, er: 43, w: 6, l: 7, sv: 0 },
      { id: 'fultzaa01', name: 'Aaron Fultz', role: 'RP', throws: 'L', age: 32, g: 66, gs: 1, outs: 214, h: 70, hr: 7, bb: 28, so: 60, hbp: 3, er: 31, w: 3, l: 1, sv: 0 },
      { id: 'whiteri01', name: 'Rick White', role: 'RP', throws: 'R', age: 37, g: 64, gs: 0, outs: 194, h: 73, hr: 7, bb: 22, so: 37, hbp: 3, er: 33, w: 4, l: 1, sv: 1 },
      { id: 'cormirh01', name: 'Rheal Cormier', role: 'RP', throws: 'L', age: 39, g: 64, gs: 0, outs: 144, h: 49, hr: 6, bb: 16, so: 26, hbp: 3, er: 20, w: 2, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'wolfra02', name: 'Randy Wolf', role: 'SP', throws: 'L', age: 29, g: 12, gs: 12, outs: 170, h: 64, hr: 11, bb: 24, so: 43, hbp: 3, er: 31, w: 4, l: 0, sv: 0 },
      { id: 'floydga01', name: 'Gavin Floyd', role: 'SP', throws: 'R', age: 23, g: 11, gs: 11, outs: 163, h: 66, hr: 12, bb: 32, so: 36, hbp: 5, er: 45, w: 4, l: 3, sv: 0 },
      { id: 'rhodear01', name: 'Arthur Rhodes', role: 'RP', throws: 'L', age: 36, g: 55, gs: 0, outs: 137, h: 46, hr: 3, bb: 25, so: 48, hbp: 1, er: 22, w: 0, l: 5, sv: 4 },
      { id: 'mathisc01', name: 'Scott Mathieson', role: 'RP', throws: 'R', age: 22, g: 9, gs: 8, outs: 112, h: 48, hr: 8, bb: 16, so: 28, hbp: 1, er: 31, w: 1, l: 4, sv: 0, rk: true },
      { id: 'castrfa01', name: 'Fabio Castro', role: 'RP', throws: 'L', age: 21, g: 20, gs: 0, outs: 95, h: 18, hr: 1, bb: 13, so: 18, hbp: 2, er: 8, w: 0, l: 1, sv: 1, rk: true },
    ],
  },
  // WSH (WAS 2006)
  {
    franchiseId: 'WSH',
    season: 2006,
    batters: [
      { id: 'schnebr01', name: 'Brian Schneider', pos: 'C', bats: 'L', age: 29, pa: 455, h: 107, double: 19, triple: 1, hr: 8, bb: 36, so: 61, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 74, arm: 71 },
      { id: 'johnsni01', name: 'Nick Johnson', pos: '1B', bats: 'L', age: 27, pa: 628, h: 146, double: 43, triple: 1, hr: 20, bb: 102, so: 102, hbp: 13, sb: 8, cs: 5, sec: '3B', fld: 66 },
      { id: 'vidrojo01', name: 'Jose Vidro', pos: '2B', bats: 'S', age: 31, pa: 511, h: 131, double: 27, triple: 1, hr: 9, bb: 44, so: 47, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 65 },
      { id: 'zimmery01', name: 'Ryan Zimmerman', pos: '3B', bats: 'R', age: 21, pa: 682, h: 180, double: 51, triple: 3, hr: 19, bb: 59, so: 121, hbp: 2, sb: 10, cs: 8, sec: '1B', fld: 69, rk: true },
      { id: 'claytro01', name: 'Royce Clayton', pos: 'SS', bats: 'R', age: 36, pa: 502, h: 120, double: 28, triple: 2, hr: 3, bb: 33, so: 90, hbp: 3, sb: 12, cs: 4, fld: 62 },
      { id: 'soriaal01', name: 'Alfonso Soriano', pos: 'LF', bats: 'R', age: 30, pa: 728, h: 182, double: 42, triple: 2, hr: 41, bb: 52, so: 147, hbp: 9, sb: 35, cs: 10, sec: 'RF', fld: 73, arm: 87 },
      { id: 'byrdma01', name: 'Marlon Byrd', pos: 'CF', bats: 'R', age: 28, pa: 228, h: 48, double: 10, triple: 1, hr: 3, bb: 18, so: 45, hbp: 4, sb: 3, cs: 2, sec: 'LF', fld: 78, arm: 62 },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'RF', bats: 'R', age: 30, pa: 268, h: 64, double: 14, triple: 1, hr: 10, bb: 15, so: 45, hbp: 7, sb: 1, cs: 1, sec: 'LF', fld: 98, arm: 67 },
      { id: 'anderma02', name: 'Marlon Anderson', pos: 'DH', bats: 'L', age: 32, pa: 312, h: 78, double: 14, triple: 2, hr: 10, bb: 22, so: 50, hbp: 1, sb: 5, cs: 4, sec: 'LF', fld: 54 },
    ],
    bench: [
      { id: 'churcry01', name: 'Ryan Church', pos: 'CF', bats: 'L', age: 27, pa: 230, h: 55, double: 14, triple: 2, hr: 8, bb: 22, so: 57, hbp: 3, sb: 4, cs: 1, sec: 'LF', fld: 78, arm: 66 },
      { id: 'wardda01', name: 'Daryle Ward', pos: '1B', bats: 'L', age: 31, pa: 150, h: 36, double: 8, triple: 0, hr: 5, bb: 13, so: 22, hbp: 1, sb: 0, cs: 1, sec: 'LF' },
      { id: 'fickro01', name: 'Robert Fick', pos: 'C', bats: 'L', age: 32, pa: 141, h: 32, double: 4, triple: 1, hr: 2, bb: 12, so: 21, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 56, arm: 49 },
      { id: 'jacksda04', name: 'Damian Jackson', pos: 'CF', bats: 'R', age: 32, pa: 135, h: 27, double: 5, triple: 0, hr: 3, bb: 13, so: 28, hbp: 3, sb: 4, cs: 2, sec: 'LF', fld: 62, arm: 58 },
      { id: 'castrbe01', name: 'Bernie Castro', pos: '2B', bats: 'S', age: 26, pa: 120, h: 27, double: 2, triple: 2, hr: 0, bb: 10, so: 17, hbp: 0, sb: 7, cs: 2, sec: 'SS', fld: 66, rk: true },
    ],
    reserveBatters: [
      { id: 'escobal01', name: 'Alex Escobar', pos: 'CF', bats: 'R', age: 27, pa: 99, h: 26, double: 4, triple: 2, hr: 3, bb: 10, so: 20, hbp: 0, sb: 1, cs: 0, sec: 'RF', fld: 92, arm: 69 },
      { id: 'loganno01', name: 'Nook Logan', pos: 'CF', bats: 'S', age: 26, pa: 99, h: 24, double: 3, triple: 1, hr: 0, bb: 6, so: 16, hbp: 0, sb: 5, cs: 1, sec: 'LF', fld: 63, arm: 58 },
      { id: 'lecroma01', name: 'Matt LeCroy', pos: 'C', bats: 'R', age: 30, pa: 80, h: 18, double: 2, triple: 0, hr: 3, bb: 9, so: 18, hbp: 1, sb: 0, cs: 0, sec: '1B' },
      { id: 'harpebr02', name: 'Brandon Harper', pos: 'C', bats: 'R', age: 30, pa: 47, h: 12, double: 3, triple: 0, hr: 2, bb: 4, so: 4, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'harribr01', name: 'Brendan Harris', pos: '2B', bats: 'R', age: 25, pa: 47, h: 10, double: 2, triple: 0, hr: 1, bb: 3, so: 7, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 648, h: 236, hr: 26, bb: 76, so: 135, hbp: 8, er: 105, w: 13, l: 13, sv: 0, fld: 73 },
      { id: 'ortizra01', name: 'Ramon Ortiz', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 572, h: 230, hr: 33, bb: 61, so: 109, hbp: 13, er: 115, w: 11, l: 16, sv: 0, fld: 64 },
      { id: 'armasto02', name: 'Tony Armas', role: 'SP', throws: 'R', age: 28, g: 30, gs: 30, outs: 462, h: 160, hr: 21, bb: 72, so: 97, hbp: 11, er: 86, w: 9, l: 12, sv: 0, fld: 70 },
      { id: 'oconnmi01', name: 'Mike O\'Connor', role: 'SP', throws: 'L', age: 25, g: 21, gs: 20, outs: 315, h: 96, hr: 15, bb: 45, so: 59, hbp: 7, er: 56, w: 3, l: 8, sv: 0, rk: true },
      { id: 'astacpe01', name: 'Pedro Astacio', role: 'SP', throws: 'R', age: 37, g: 17, gs: 17, outs: 271, h: 105, hr: 13, bb: 30, so: 50, hbp: 1, er: 56, w: 5, l: 5, sv: 0 },
      { id: 'cordech01', name: 'Chad Cordero', role: 'CL', throws: 'R', age: 24, g: 68, gs: 0, outs: 220, h: 58, hr: 11, bb: 23, so: 67, hbp: 2, er: 22, w: 7, l: 4, sv: 29 },
      { id: 'rauchjo01', name: 'Jon Rauch', role: 'RP', throws: 'R', age: 27, g: 85, gs: 0, outs: 274, h: 78, hr: 12, bb: 35, so: 82, hbp: 2, er: 34, w: 4, l: 5, sv: 2 },
      { id: 'majewga01', name: 'Gary Majewski', role: 'RP', throws: 'R', age: 26, g: 65, gs: 0, outs: 211, h: 75, hr: 4, bb: 29, so: 43, hbp: 5, er: 31, w: 4, l: 4, sv: 0 },
      { id: 'stantmi02', name: 'Mike Stanton', role: 'RP', throws: 'L', age: 39, g: 82, gs: 0, outs: 203, h: 70, hr: 3, bb: 27, so: 48, hbp: 1, er: 30, w: 7, l: 7, sv: 8 },
      { id: 'bergmja01', name: 'Jason Bergmann', role: 'RP', throws: 'R', age: 24, g: 29, gs: 6, outs: 194, h: 76, hr: 11, bb: 29, so: 57, hbp: 6, er: 44, w: 0, l: 2, sv: 0, rk: true },
      { id: 'riversa01', name: 'Saul Rivera', role: 'RP', throws: 'R', age: 28, g: 54, gs: 0, outs: 181, h: 59, hr: 4, bb: 32, so: 41, hbp: 4, er: 23, w: 3, l: 0, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'trabebi01', name: 'Billy Traber', role: 'RP', throws: 'L', age: 26, g: 15, gs: 8, outs: 130, h: 53, hr: 5, bb: 14, so: 25, hbp: 8, er: 31, w: 4, l: 3, sv: 0 },
      { id: 'pattejo02', name: 'John Patterson', role: 'RP', throws: 'R', age: 28, g: 8, gs: 8, outs: 122, h: 36, hr: 4, bb: 13, so: 38, hbp: 2, er: 16, w: 1, l: 2, sv: 0 },
      { id: 'dayza01', name: 'Zach Day', role: 'RP', throws: 'R', age: 28, g: 8, gs: 8, outs: 120, h: 49, hr: 5, bb: 21, so: 20, hbp: 2, er: 26, w: 2, l: 5, sv: 0 },
      { id: 'hillsh01', name: 'Shawn Hill', role: 'RP', throws: 'R', age: 25, g: 6, gs: 6, outs: 110, h: 44, hr: 2, bb: 13, so: 18, hbp: 3, er: 22, w: 1, l: 3, sv: 0, rk: true },
      { id: 'wagnery01', name: 'Ryan Wagner', role: 'RP', throws: 'R', age: 23, g: 26, gs: 0, outs: 92, h: 37, hr: 3, bb: 14, so: 23, hbp: 2, er: 18, w: 3, l: 3, sv: 0 },
    ],
  },
  // CHC (CHN 2006)
  {
    franchiseId: 'CHC',
    season: 2006,
    batters: [
      { id: 'barremi01', name: 'Michael Barrett', pos: 'C', bats: 'R', age: 29, pa: 418, h: 109, double: 26, triple: 3, hr: 15, bb: 33, so: 48, hbp: 5, sb: 0, cs: 2, sec: '1B', fld: 68, arm: 61 },
      { id: 'mabryjo01', name: 'John Mabry', pos: '1B', bats: 'L', age: 35, pa: 237, h: 49, double: 10, triple: 1, hr: 7, bb: 21, so: 56, hbp: 1, sb: 0, cs: 0, sec: 'LF', fld: 78 },
      { id: 'walketo04', name: 'Todd Walker', pos: '2B', bats: 'L', age: 33, pa: 504, h: 128, double: 24, triple: 3, hr: 12, bb: 49, so: 44, hbp: 2, sb: 1, cs: 1, sec: '3B', fld: 57 },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 28, pa: 660, h: 178, double: 38, triple: 2, hr: 39, bb: 49, so: 68, hbp: 8, sb: 1, cs: 1, sec: '1B', fld: 55 },
      { id: 'cedenro02', name: 'Ronny Cedeno', pos: 'SS', bats: 'R', age: 23, pa: 572, h: 133, double: 18, triple: 6, hr: 6, bb: 18, so: 105, hbp: 4, sb: 8, cs: 7, sec: '2B', fld: 48, rk: true },
      { id: 'murtoma01', name: 'Matt Murton', pos: 'LF', bats: 'R', age: 24, pa: 508, h: 136, double: 20, triple: 4, hr: 15, bb: 46, so: 63, hbp: 4, sb: 5, cs: 2, sec: 'RF', fld: 72, arm: 63 },
      { id: 'pierrju01', name: 'Juan Pierre', pos: 'CF', bats: 'L', age: 28, pa: 750, h: 202, double: 26, triple: 13, hr: 3, bb: 38, so: 40, hbp: 8, sb: 56, cs: 20, sec: 'LF', fld: 69, arm: 65 },
      { id: 'jonesja04', name: 'Jacque Jones', pos: 'RF', bats: 'L', age: 31, pa: 577, h: 141, double: 26, triple: 2, hr: 25, bb: 41, so: 116, hbp: 6, sb: 11, cs: 3, sec: 'LF', fld: 61, arm: 62 },
      { id: 'perezne01', name: 'Neifi Perez', pos: 'DH', bats: 'S', age: 33, pa: 316, h: 77, double: 15, triple: 1, hr: 3, bb: 10, so: 26, hbp: 1, sb: 2, cs: 1, sec: '3B', fld: 74 },
    ],
    bench: [
      { id: 'blanche01', name: 'Henry Blanco', pos: 'C', bats: 'R', age: 34, pa: 261, h: 59, double: 13, triple: 1, hr: 7, bb: 15, so: 38, hbp: 1, sb: 0, cs: 1, fld: 79, arm: 82 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 30, pa: 204, h: 54, double: 13, triple: 1, hr: 11, bb: 24, so: 36, hbp: 1, sb: 5, cs: 2, sec: '3B', fld: 61 },
      { id: 'paganan01', name: 'Angel Pagan', pos: 'LF', bats: 'S', age: 24, pa: 187, h: 42, double: 6, triple: 2, hr: 5, bb: 15, so: 28, hbp: 0, sb: 4, cs: 2, sec: 'RF', fld: 79, arm: 68, rk: true },
      { id: 'theriry01', name: 'Ryan Theriot', pos: '2B', bats: 'R', age: 26, pa: 159, h: 43, double: 11, triple: 3, hr: 3, bb: 17, so: 18, hbp: 2, sb: 12, cs: 2, sec: 'SS', fld: 40, rk: true },
      { id: 'bynumfr01', name: 'Freddie Bynum', pos: '2B', bats: 'L', age: 26, pa: 148, h: 35, double: 5, triple: 5, hr: 4, bb: 9, so: 45, hbp: 1, sb: 8, cs: 4, sec: 'SS', rk: true },
    ],
    reserveBatters: [
      { id: 'womacto01', name: 'Tony Womack', pos: '2B', bats: 'L', age: 36, pa: 80, h: 20, double: 2, triple: 0, hr: 0, bb: 4, so: 9, hbp: 0, sb: 4, cs: 1, sec: 'SS', fld: 99 },
      { id: 'mooresc02', name: 'Scott Moore', pos: '1B', bats: 'L', age: 22, pa: 42, h: 10, double: 2, triple: 0, hr: 2, bb: 2, so: 10, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'zambrca01', name: 'Carlos Zambrano', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 642, h: 167, hr: 19, bb: 100, so: 204, hbp: 11, er: 78, w: 16, l: 7, sv: 0, fld: 69 },
      { id: 'maddugr01', name: 'Greg Maddux', role: 'SP', throws: 'R', age: 40, g: 34, gs: 34, outs: 630, h: 219, hr: 25, bb: 35, so: 125, hbp: 4, er: 97, w: 15, l: 14, sv: 0, fld: 93 },
      { id: 'marshse01', name: 'Sean Marshall', role: 'SP', throws: 'L', age: 23, g: 24, gs: 24, outs: 377, h: 132, hr: 20, bb: 59, so: 77, hbp: 7, er: 78, w: 6, l: 9, sv: 0, rk: true },
      { id: 'hillri01', name: 'Rich Hill', role: 'SP', throws: 'L', age: 26, g: 17, gs: 16, outs: 298, h: 84, hr: 15, bb: 43, so: 88, hbp: 2, er: 53, w: 6, l: 7, sv: 0, rk: true },
      { id: 'marmoca01', name: 'Carlos Marmol', role: 'SP', throws: 'R', age: 23, g: 19, gs: 13, outs: 231, h: 71, hr: 14, bb: 59, so: 59, hbp: 5, er: 52, w: 5, l: 7, sv: 0, rk: true },
      { id: 'dempsry01', name: 'Ryan Dempster', role: 'CL', throws: 'R', age: 29, g: 74, gs: 0, outs: 225, h: 73, hr: 4, bb: 38, so: 70, hbp: 3, er: 34, w: 1, l: 9, sv: 24 },
      { id: 'howrybo01', name: 'Bob Howry', role: 'RP', throws: 'R', age: 32, g: 84, gs: 0, outs: 230, h: 65, hr: 7, bb: 18, so: 65, hbp: 2, er: 25, w: 4, l: 5, sv: 5 },
      { id: 'novoaro01', name: 'Roberto Novoa', role: 'RP', throws: 'R', age: 26, g: 66, gs: 0, outs: 228, h: 78, hr: 13, bb: 34, so: 60, hbp: 4, er: 37, w: 2, l: 1, sv: 0 },
      { id: 'ruschgl01', name: 'Glendon Rusch', role: 'RP', throws: 'L', age: 31, g: 25, gs: 9, outs: 199, h: 83, hr: 11, bb: 27, so: 55, hbp: 1, er: 41, w: 3, l: 8, sv: 0 },
      { id: 'ohmanwi01', name: 'Will Ohman', role: 'RP', throws: 'L', age: 28, g: 78, gs: 0, outs: 196, h: 50, hr: 7, bb: 35, so: 72, hbp: 5, er: 27, w: 1, l: 1, sv: 0 },
      { id: 'eyresc01', name: 'Scott Eyre', role: 'RP', throws: 'L', age: 34, g: 74, gs: 0, outs: 184, h: 55, hr: 8, bb: 29, so: 68, hbp: 1, er: 23, w: 1, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'guzmaan01', name: 'Angel Guzman', role: 'SP', throws: 'R', age: 24, g: 15, gs: 10, outs: 168, h: 68, hr: 9, bb: 37, so: 60, hbp: 6, er: 46, w: 0, l: 6, sv: 0, rk: true },
      { id: 'aardsda01', name: 'David Aardsma', role: 'RP', throws: 'R', age: 24, g: 45, gs: 0, outs: 159, h: 44, hr: 9, bb: 29, so: 46, hbp: 2, er: 24, w: 3, l: 0, sv: 0, rk: true },
      { id: 'mateoju02', name: 'Juan Mateo', role: 'SP', throws: 'R', age: 23, g: 11, gs: 10, outs: 137, h: 51, hr: 6, bb: 23, so: 35, hbp: 3, er: 27, w: 1, l: 3, sv: 0, rk: true },
      { id: 'priorma01', name: 'Mark Prior', role: 'RP', throws: 'R', age: 25, g: 9, gs: 9, outs: 131, h: 44, hr: 8, bb: 21, so: 52, hbp: 3, er: 24, w: 1, l: 6, sv: 0 },
      { id: 'wuertmi01', name: 'Michael Wuertz', role: 'RP', throws: 'R', age: 27, g: 41, gs: 0, outs: 122, h: 33, hr: 4, bb: 19, so: 45, hbp: 0, er: 15, w: 3, l: 1, sv: 0 },
    ],
  },
  // CIN (CIN 2006)
  {
    franchiseId: 'CIN',
    season: 2006,
    batters: [
      { id: 'rossda01', name: 'David Ross', pos: 'C', bats: 'R', age: 29, pa: 296, h: 61, double: 14, triple: 1, hr: 16, bb: 30, so: 75, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 84 },
      { id: 'hattesc01', name: 'Scott Hatteberg', pos: '1B', bats: 'L', age: 36, pa: 539, h: 129, double: 25, triple: 0, hr: 11, bb: 65, so: 46, hbp: 4, sb: 1, cs: 1, fld: 71 },
      { id: 'phillbr01', name: 'Brandon Phillips', pos: '2B', bats: 'R', age: 25, pa: 587, h: 146, double: 28, triple: 1, hr: 17, bb: 35, so: 90, hbp: 6, sb: 24, cs: 3, sec: 'SS', fld: 65 },
      { id: 'aurilri01', name: 'Rich Aurilia', pos: '3B', bats: 'R', age: 34, pa: 481, h: 125, double: 24, triple: 2, hr: 18, bb: 36, so: 61, hbp: 2, sb: 2, cs: 0, sec: 'SS', fld: 61 },
      { id: 'lopezfe01', name: 'Felipe Lopez', pos: 'SS', bats: 'S', age: 26, pa: 714, h: 174, double: 32, triple: 4, hr: 16, bb: 73, so: 130, hbp: 2, sb: 31, cs: 10, sec: '3B', fld: 43 },
      { id: 'dunnad01', name: 'Adam Dunn', pos: 'LF', bats: 'L', age: 26, pa: 683, h: 136, double: 30, triple: 1, hr: 41, bb: 113, so: 187, hbp: 8, sb: 6, cs: 1, sec: '1B', fld: 58, arm: 67 },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'CF', bats: 'L', age: 36, pa: 472, h: 114, double: 22, triple: 0, hr: 28, bb: 44, so: 80, hbp: 2, sb: 0, cs: 0, fld: 62, arm: 71 },
      { id: 'kearnau01', name: 'Austin Kearns', pos: 'RF', bats: 'R', age: 26, pa: 629, h: 137, double: 33, triple: 2, hr: 24, bb: 73, so: 143, hbp: 10, sb: 6, cs: 3, sec: 'CF', fld: 87, arm: 69 },
      { id: 'valenja01', name: 'Javier Valentin', pos: 'DH', bats: 'S', age: 30, pa: 201, h: 48, double: 8, triple: 1, hr: 9, bb: 17, so: 30, hbp: 0, sb: 0, cs: 0, sec: 'C', fld: 60, arm: 83 },
    ],
    bench: [
      { id: 'freelry01', name: 'Ryan Freel', pos: 'CF', bats: 'R', age: 30, pa: 523, h: 123, double: 26, triple: 3, hr: 6, bb: 59, so: 87, hbp: 10, sb: 38, cs: 11, sec: 'RF', fld: 76, arm: 87 },
      { id: 'encared01', name: 'Edwin Encarnacion', pos: '3B', bats: 'R', age: 23, pa: 463, h: 108, double: 33, triple: 1, hr: 16, bb: 41, so: 88, hbp: 11, sb: 6, cs: 2, sec: '1B', fld: 54 },
      { id: 'larueja01', name: 'Jason LaRue', pos: 'C', bats: 'R', age: 32, pa: 230, h: 46, double: 11, triple: 0, hr: 8, bb: 22, so: 54, hbp: 9, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 76 },
      { id: 'denorch01', name: 'Chris Denorfia', pos: 'RF', bats: 'R', age: 25, pa: 120, h: 29, double: 6, triple: 0, hr: 1, bb: 12, so: 22, hbp: 1, sb: 1, cs: 1, sec: 'CF', fld: 82, arm: 74, rk: true },
      { id: 'mccraqu01', name: 'Quinton McCracken', pos: 'LF', bats: 'S', age: 35, pa: 60, h: 13, double: 2, triple: 1, hr: 0, bb: 5, so: 9, hbp: 0, sb: 1, cs: 0, sec: 'CF' },
    ],
    reserveBatters: [
      { id: 'olmedra01', name: 'Ray Olmedo', pos: '2B', bats: 'S', age: 25, pa: 48, h: 9, double: 2, triple: 0, hr: 1, bb: 4, so: 8, hbp: 0, sb: 2, cs: 0, sec: 'SS' },
      { id: 'hoppeno01', name: 'Norris Hopper', pos: 'RF', bats: 'R', age: 27, pa: 47, h: 14, double: 1, triple: 0, hr: 1, bb: 6, so: 4, hbp: 0, sb: 2, cs: 2, sec: 'LF', rk: true },
      { id: 'wisede01', name: 'Dewayne Wise', pos: 'LF', bats: 'L', age: 28, pa: 40, h: 8, double: 2, triple: 1, hr: 1, bb: 1, so: 6, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'arroybr01', name: 'Bronson Arroyo', role: 'SP', throws: 'R', age: 29, g: 35, gs: 35, outs: 722, h: 228, hr: 28, bb: 63, so: 162, hbp: 11, er: 99, w: 14, l: 11, sv: 0, fld: 84 },
      { id: 'haranaa01', name: 'Aaron Harang', role: 'SP', throws: 'R', age: 28, g: 36, gs: 35, outs: 703, h: 242, hr: 28, bb: 59, so: 199, hbp: 8, er: 102, w: 16, l: 11, sv: 0, fld: 69 },
      { id: 'miltoer01', name: 'Eric Milton', role: 'SP', throws: 'L', age: 30, g: 26, gs: 26, outs: 458, h: 169, hr: 31, bb: 44, so: 99, hbp: 4, er: 93, w: 8, l: 8, sv: 0, fld: 68 },
      { id: 'ramirel01', name: 'Elizardo Ramirez', role: 'SP', throws: 'R', age: 23, g: 21, gs: 19, outs: 312, h: 125, hr: 15, bb: 31, so: 65, hbp: 8, er: 65, w: 4, l: 9, sv: 0, rk: true },
      { id: 'clausbr01', name: 'Brandon Claussen', role: 'SP', throws: 'L', age: 27, g: 14, gs: 14, outs: 231, h: 89, hr: 12, bb: 29, so: 57, hbp: 4, er: 45, w: 3, l: 8, sv: 0 },
      { id: 'weathda01', name: 'David Weathers', role: 'CL', throws: 'R', age: 36, g: 67, gs: 0, outs: 221, h: 65, hr: 10, bb: 31, so: 53, hbp: 2, er: 31, w: 4, l: 4, sv: 12 },
      { id: 'coffeto01', name: 'Todd Coffey', role: 'RP', throws: 'R', age: 25, g: 81, gs: 0, outs: 234, h: 92, hr: 7, bb: 23, so: 51, hbp: 3, er: 33, w: 6, l: 7, sv: 8 },
      { id: 'braybi01', name: 'Bill Bray', role: 'RP', throws: 'L', age: 23, g: 48, gs: 0, outs: 152, h: 57, hr: 5, bb: 18, so: 39, hbp: 1, er: 23, w: 3, l: 2, sv: 2, rk: true },
      { id: 'belisma01', name: 'Matt Belisle', role: 'RP', throws: 'R', age: 26, g: 30, gs: 2, outs: 120, h: 46, hr: 5, bb: 15, so: 27, hbp: 3, er: 18, w: 2, l: 0, sv: 0 },
      { id: 'michach01', name: 'Chris Michalak', role: 'RP', throws: 'L', age: 35, g: 8, gs: 6, outs: 105, h: 42, hr: 6, bb: 16, so: 10, hbp: 3, er: 19, w: 2, l: 4, sv: 0 },
      { id: 'hammoch01', name: 'Chris Hammond', role: 'RP', throws: 'L', age: 40, g: 29, gs: 0, outs: 86, h: 31, hr: 4, bb: 6, so: 20, hbp: 1, er: 15, w: 1, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'willida07', name: 'David Williams', role: 'SP', throws: 'L', age: 27, g: 14, gs: 13, outs: 207, h: 80, hr: 12, bb: 26, so: 42, hbp: 5, er: 42, w: 5, l: 4, sv: 0 },
      { id: 'maysjo01', name: 'Joe Mays', role: 'SP', throws: 'R', age: 30, g: 13, gs: 10, outs: 152, h: 75, hr: 9, bb: 19, so: 22, hbp: 1, er: 40, w: 0, l: 5, sv: 0 },
      { id: 'merckke01', name: 'Kent Mercker', role: 'RP', throws: 'L', age: 38, g: 37, gs: 0, outs: 85, h: 27, hr: 4, bb: 11, so: 21, hbp: 1, er: 11, w: 1, l: 1, sv: 1 },
      { id: 'burnsmi01', name: 'Mike Burns', role: 'RP', throws: 'R', age: 27, g: 18, gs: 0, outs: 63, h: 32, hr: 3, bb: 5, so: 16, hbp: 3, er: 16, w: 0, l: 0, sv: 0, rk: true },
      { id: 'standja01', name: 'Jason Standridge', role: 'RP', throws: 'R', age: 27, g: 21, gs: 0, outs: 56, h: 21, hr: 2, bb: 11, so: 14, hbp: 1, er: 10, w: 1, l: 1, sv: 0 },
    ],
  },
  // MIL (MIL 2006)
  {
    franchiseId: 'MIL',
    season: 2006,
    batters: [
      { id: 'milleda02', name: 'Damian Miller', pos: 'C', bats: 'R', age: 36, pa: 376, h: 88, double: 25, triple: 0, hr: 7, bb: 33, so: 82, hbp: 3, sb: 0, cs: 0, fld: 78, arm: 72 },
      { id: 'fieldpr01', name: 'Prince Fielder', pos: '1B', bats: 'L', age: 22, pa: 648, h: 155, double: 35, triple: 1, hr: 28, bb: 57, so: 128, hbp: 11, sb: 7, cs: 2, sec: '3B', fld: 67, rk: true },
      { id: 'graffto01', name: 'Tony Graffanino', pos: '2B', bats: 'R', age: 34, pa: 511, h: 130, double: 27, triple: 3, hr: 7, bb: 43, so: 66, hbp: 5, sb: 7, cs: 3, sec: '3B', fld: 54 },
      { id: 'cirilje01', name: 'Jeff Cirillo', pos: '3B', bats: 'R', age: 36, pa: 290, h: 78, double: 17, triple: 0, hr: 4, bb: 24, so: 33, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 85 },
      { id: 'hallbi03', name: 'Bill Hall', pos: 'SS', bats: 'R', age: 26, pa: 608, h: 150, double: 39, triple: 5, hr: 27, bb: 52, so: 148, hbp: 1, sb: 13, cs: 8, sec: '2B', fld: 54 },
      { id: 'leeca01', name: 'Carlos Lee', pos: 'LF', bats: 'R', age: 30, pa: 695, h: 180, double: 39, triple: 1, hr: 35, bb: 58, so: 77, hbp: 3, sb: 16, cs: 3, sec: 'RF', fld: 51, arm: 65 },
      { id: 'clarkbr02', name: 'Brady Clark', pos: 'CF', bats: 'R', age: 33, pa: 482, h: 119, double: 18, triple: 1, hr: 7, bb: 41, so: 51, hbp: 13, sb: 7, cs: 7, sec: 'RF', fld: 66, arm: 62 },
      { id: 'jenkige01', name: 'Geoff Jenkins', pos: 'RF', bats: 'L', age: 31, pa: 555, h: 135, double: 31, triple: 2, hr: 20, bb: 51, so: 126, hbp: 13, sb: 2, cs: 1, sec: 'LF', fld: 61, arm: 67 },
      { id: 'weeksri01', name: 'Rickie Weeks', pos: 'DH', bats: 'R', age: 23, pa: 413, h: 94, double: 14, triple: 3, hr: 10, bb: 34, so: 94, hbp: 16, sb: 17, cs: 4, sec: '1B', fld: 59 },
    ],
    bench: [
      { id: 'koskico01', name: 'Corey Koskie', pos: '3B', bats: 'L', age: 33, pa: 289, h: 65, double: 18, triple: 0, hr: 11, bb: 30, so: 61, hbp: 4, sb: 3, cs: 1, sec: '1B', fld: 82 },
      { id: 'hartco01', name: 'Corey Hart', pos: 'RF', bats: 'R', age: 24, pa: 256, h: 64, double: 12, triple: 2, hr: 9, bb: 18, so: 56, hbp: 0, sb: 5, cs: 7, sec: 'LF', fld: 68, arm: 69, rk: true },
      { id: 'grossga01', name: 'Gabe Gross', pos: 'CF', bats: 'L', age: 26, pa: 252, h: 55, double: 13, triple: 0, hr: 7, bb: 33, so: 58, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 75, arm: 86 },
      { id: 'rivermi02', name: 'Mike Rivera', pos: 'C', bats: 'R', age: 29, pa: 158, h: 38, double: 9, triple: 0, hr: 6, bb: 10, so: 21, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 59 },
      { id: 'hardyjj01', name: 'J. J. Hardy', pos: 'SS', bats: 'R', age: 23, pa: 139, h: 30, double: 6, triple: 0, hr: 4, bb: 13, so: 18, hbp: 0, sb: 0, cs: 0, sec: '2B', fld: 93 },
    ],
    reserveBatters: [
      { id: 'moellch01', name: 'Chad Moeller', pos: 'C', bats: 'R', age: 31, pa: 104, h: 19, double: 4, triple: 0, hr: 2, bb: 6, so: 24, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 80, arm: 63 },
      { id: 'gwynnto02', name: 'Tony Gwynn', pos: 'CF', bats: 'L', age: 23, pa: 80, h: 20, double: 2, triple: 1, hr: 0, bb: 2, so: 15, hbp: 0, sb: 3, cs: 1, sec: 'LF', rk: true },
      { id: 'nixla01', name: 'Laynce Nix', pos: 'CF', bats: 'L', age: 25, pa: 70, h: 15, double: 3, triple: 1, hr: 2, bb: 3, so: 18, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 71, arm: 83 },
    ],
    pitchers: [
      { id: 'capuach01', name: 'Chris Capuano', role: 'SP', throws: 'L', age: 27, g: 34, gs: 34, outs: 664, h: 220, hr: 31, bb: 66, so: 174, hbp: 10, er: 99, w: 11, l: 12, sv: 0, fld: 71 },
      { id: 'bushda01', name: 'Dave Bush', role: 'SP', throws: 'R', age: 26, g: 34, gs: 32, outs: 630, h: 204, hr: 27, bb: 41, so: 148, hbp: 18, er: 101, w: 12, l: 11, sv: 0, fld: 75 },
      { id: 'davisdo02', name: 'Doug Davis', role: 'SP', throws: 'L', age: 30, g: 34, gs: 34, outs: 610, h: 198, hr: 20, bb: 94, so: 175, hbp: 5, er: 99, w: 11, l: 11, sv: 0, fld: 65 },
      { id: 'sheetbe01', name: 'Ben Sheets', role: 'SP', throws: 'R', age: 27, g: 17, gs: 17, outs: 318, h: 99, hr: 11, bb: 14, so: 110, hbp: 2, er: 40, w: 6, l: 7, sv: 0 },
      { id: 'ohkato01', name: 'Tomo Ohka', role: 'SP', throws: 'R', age: 30, g: 18, gs: 18, outs: 291, h: 102, hr: 12, bb: 31, so: 51, hbp: 3, er: 46, w: 4, l: 5, sv: 0 },
      { id: 'turnbde01', name: 'Derrick Turnbow', role: 'CL', throws: 'R', age: 28, g: 64, gs: 0, outs: 169, h: 52, hr: 7, bb: 33, so: 65, hbp: 3, er: 30, w: 4, l: 9, sv: 24 },
      { id: 'capeljo01', name: 'Jose Capellan', role: 'RP', throws: 'R', age: 25, g: 61, gs: 0, outs: 215, h: 68, hr: 10, bb: 30, so: 58, hbp: 3, er: 35, w: 4, l: 2, sv: 0, rk: true },
      { id: 'gonzaje01', name: 'Geremi Gonzalez', role: 'RP', throws: 'R', age: 31, g: 24, gs: 4, outs: 168, h: 71, hr: 9, bb: 21, so: 36, hbp: 2, er: 38, w: 4, l: 2, sv: 0 },
      { id: 'villaca01', name: 'Carlos Villanueva', role: 'RP', throws: 'R', age: 22, g: 10, gs: 6, outs: 161, h: 43, hr: 8, bb: 11, so: 39, hbp: 4, er: 22, w: 2, l: 2, sv: 0, rk: true },
      { id: 'kolbda01', name: 'Danny Kolb', role: 'RP', throws: 'R', age: 31, g: 53, gs: 0, outs: 145, h: 55, hr: 4, bb: 20, so: 27, hbp: 1, er: 26, w: 2, l: 2, sv: 1 },
      { id: 'wisema01', name: 'Matt Wise', role: 'RP', throws: 'R', age: 30, g: 40, gs: 0, outs: 133, h: 38, hr: 5, bb: 16, so: 34, hbp: 2, er: 19, w: 5, l: 6, sv: 0 },
    ],
    reservePitchers: [
      { id: 'jacksza01', name: 'Zach Jackson', role: 'RP', throws: 'L', age: 23, g: 8, gs: 7, outs: 115, h: 48, hr: 6, bb: 14, so: 22, hbp: 4, er: 23, w: 2, l: 2, sv: 0, rk: true },
      { id: 'shousbr01', name: 'Brian Shouse', role: 'RP', throws: 'L', age: 37, g: 65, gs: 0, outs: 115, h: 40, hr: 4, bb: 16, so: 26, hbp: 4, er: 19, w: 1, l: 3, sv: 2 },
      { id: 'helliri01', name: 'Rick Helling', role: 'RP', throws: 'R', age: 35, g: 20, gs: 2, outs: 105, h: 26, hr: 4, bb: 14, so: 31, hbp: 1, er: 13, w: 0, l: 2, sv: 0 },
      { id: 'evelada01', name: 'Dana Eveland', role: 'RP', throws: 'L', age: 22, g: 9, gs: 5, outs: 83, h: 38, hr: 3, bb: 16, so: 28, hbp: 3, er: 23, w: 0, l: 3, sv: 0, rk: true },
      { id: 'lehrju01', name: 'Justin Lehr', role: 'RP', throws: 'R', age: 28, g: 16, gs: 0, outs: 47, h: 19, hr: 2, bb: 8, so: 11, hbp: 1, er: 11, w: 2, l: 1, sv: 0 },
    ],
  },
  // PIT (PIT 2006)
  {
    franchiseId: 'PIT',
    season: 2006,
    batters: [
      { id: 'pauliro01', name: 'Ronny Paulino', pos: 'C', bats: 'R', age: 25, pa: 481, h: 137, double: 19, triple: 0, hr: 6, bb: 34, so: 78, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 76, rk: true },
      { id: 'caseyse01', name: 'Sean Casey', pos: '1B', bats: 'L', age: 31, pa: 440, h: 118, double: 24, triple: 0, hr: 9, bb: 34, so: 37, hbp: 6, sb: 1, cs: 0, sec: '3B', fld: 61 },
      { id: 'castijo02', name: 'Jose Castillo', pos: '2B', bats: 'R', age: 25, pa: 562, h: 134, double: 24, triple: 2, hr: 14, bb: 32, so: 98, hbp: 3, sb: 5, cs: 4, sec: 'SS', fld: 70 },
      { id: 'sanchfr01', name: 'Freddy Sanchez', pos: '3B', bats: 'R', age: 28, pa: 632, h: 189, double: 46, triple: 3, hr: 6, bb: 32, so: 50, hbp: 7, sb: 3, cs: 2, sec: '2B', fld: 98 },
      { id: 'wilsoja02', name: 'Jack Wilson', pos: 'SS', bats: 'R', age: 28, pa: 594, h: 150, double: 27, triple: 5, hr: 8, bb: 30, so: 60, hbp: 4, sb: 5, cs: 3, sec: '2B', fld: 86 },
      { id: 'bayja01', name: 'Jason Bay', pos: 'LF', bats: 'R', age: 27, pa: 689, h: 169, double: 35, triple: 4, hr: 34, bb: 94, so: 154, hbp: 8, sb: 14, cs: 2, sec: 'CF', fld: 74, arm: 71 },
      { id: 'duffych01', name: 'Chris Duffy', pos: 'CF', bats: 'L', age: 26, pa: 348, h: 86, double: 13, triple: 3, hr: 2, bb: 19, so: 68, hbp: 9, sb: 22, cs: 2, sec: 'LF', fld: 58, arm: 70 },
      { id: 'burnije01', name: 'Jeromy Burnitz', pos: 'RF', bats: 'L', age: 37, pa: 342, h: 78, double: 15, triple: 1, hr: 15, bb: 27, so: 65, hbp: 3, sb: 2, cs: 2, sec: 'CF', fld: 46, arm: 58 },
      { id: 'wilsocr03', name: 'Craig Wilson', pos: 'DH', bats: 'R', age: 29, pa: 395, h: 89, double: 19, triple: 2, hr: 15, bb: 33, so: 115, hbp: 12, sb: 2, cs: 0, sec: 'RF', fld: 62 },
    ],
    bench: [
      { id: 'bautijo02', name: 'Jose Bautista', pos: 'CF', bats: 'R', age: 25, pa: 469, h: 92, double: 19, triple: 3, hr: 14, bb: 45, so: 115, hbp: 14, sb: 2, cs: 4, sec: 'RF', fld: 60, arm: 82, rk: true },
      { id: 'mclouna01', name: 'Nate McLouth', pos: 'CF', bats: 'L', age: 24, pa: 297, h: 64, double: 16, triple: 2, hr: 8, bb: 16, so: 57, hbp: 7, sb: 9, cs: 1, sec: 'RF', fld: 45, arm: 62, rk: true },
      { id: 'randajo01', name: 'Joe Randa', pos: '3B', bats: 'R', age: 36, pa: 227, h: 57, double: 15, triple: 1, hr: 5, bb: 17, so: 30, hbp: 1, sb: 0, cs: 0, sec: '2B', fld: 77 },
      { id: 'doumiry01', name: 'Ryan Doumit', pos: '1B', bats: 'S', age: 25, pa: 178, h: 36, double: 9, triple: 0, hr: 5, bb: 11, so: 38, hbp: 10, sb: 1, cs: 0, sec: '3B', fld: 56 },
      { id: 'hernajo01', name: 'Jose Hernandez', pos: '1B', bats: 'R', age: 36, pa: 166, h: 38, double: 5, triple: 1, hr: 5, bb: 12, so: 40, hbp: 1, sb: 1, cs: 1, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'cotahu01', name: 'Humberto Cota', pos: 'C', bats: 'R', age: 27, pa: 110, h: 23, double: 5, triple: 0, hr: 2, bb: 6, so: 27, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 65, arm: 74 },
    ],
    pitchers: [
      { id: 'dukeza01', name: 'Zach Duke', role: 'SP', throws: 'L', age: 23, g: 34, gs: 34, outs: 646, h: 247, hr: 15, bb: 67, so: 125, hbp: 7, er: 95, w: 10, l: 15, sv: 0, fld: 86 },
      { id: 'snellia01', name: 'Ian Snell', role: 'SP', throws: 'R', age: 24, g: 32, gs: 32, outs: 558, h: 196, hr: 28, bb: 79, so: 165, hbp: 2, er: 100, w: 14, l: 11, sv: 0, fld: 71 },
      { id: 'maholpa01', name: 'Paul Maholm', role: 'SP', throws: 'L', age: 24, g: 30, gs: 30, outs: 528, h: 195, hr: 18, bb: 81, so: 118, hbp: 12, er: 87, w: 8, l: 10, sv: 0, fld: 86, rk: true },
      { id: 'santovi01', name: 'Victor Santos', role: 'SP', throws: 'R', age: 29, g: 25, gs: 19, outs: 346, h: 139, hr: 16, bb: 46, so: 81, hbp: 4, er: 67, w: 5, l: 9, sv: 0 },
      { id: 'perezol01', name: 'Oliver Perez', role: 'SP', throws: 'L', age: 24, g: 22, gs: 22, outs: 338, h: 116, hr: 20, bb: 67, so: 117, hbp: 6, er: 70, w: 3, l: 13, sv: 0 },
      { id: 'gonzami02', name: 'Mike Gonzalez', role: 'CL', throws: 'L', age: 28, g: 54, gs: 0, outs: 162, h: 41, hr: 2, bb: 29, so: 65, hbp: 2, er: 14, w: 3, l: 4, sv: 24 },
      { id: 'torresa01', name: 'Salomon Torres', role: 'RP', throws: 'R', age: 34, g: 94, gs: 0, outs: 280, h: 91, hr: 7, bb: 36, so: 67, hbp: 6, er: 32, w: 3, l: 6, sv: 12 },
      { id: 'cappsma01', name: 'Matt Capps', role: 'RP', throws: 'R', age: 22, g: 85, gs: 0, outs: 242, h: 81, hr: 12, bb: 12, so: 56, hbp: 4, er: 34, w: 9, l: 1, sv: 1, rk: true },
      { id: 'grabojo02', name: 'John Grabow', role: 'RP', throws: 'L', age: 27, g: 72, gs: 0, outs: 209, h: 69, hr: 8, bb: 31, so: 64, hbp: 2, er: 34, w: 4, l: 2, sv: 0 },
      { id: 'hernaro01', name: 'Roberto Hernandez', role: 'RP', throws: 'R', age: 41, g: 68, gs: 0, outs: 191, h: 60, hr: 6, bb: 30, so: 52, hbp: 1, er: 23, w: 0, l: 3, sv: 2 },
      { id: 'marteda01', name: 'Damaso Marte', role: 'RP', throws: 'L', age: 31, g: 75, gs: 0, outs: 175, h: 51, hr: 6, bb: 33, so: 62, hbp: 4, er: 24, w: 1, l: 7, sv: 0 },
    ],
    reservePitchers: [
      { id: 'gorzeto01', name: 'Tom Gorzelanny', role: 'SP', throws: 'L', age: 23, g: 11, gs: 11, outs: 185, h: 53, hr: 3, bb: 31, so: 39, hbp: 4, er: 29, w: 2, l: 5, sv: 0, rk: true },
      { id: 'wellski01', name: 'Kip Wells', role: 'RP', throws: 'R', age: 29, g: 9, gs: 9, outs: 133, h: 52, hr: 5, bb: 24, so: 32, hbp: 3, er: 27, w: 2, l: 5, sv: 0 },
      { id: 'vogelry01', name: 'Ryan Vogelsong', role: 'RP', throws: 'R', age: 28, g: 20, gs: 0, outs: 114, h: 42, hr: 4, bb: 18, so: 26, hbp: 4, er: 24, w: 0, l: 0, sv: 0 },
      { id: 'youmash01', name: 'Shane Youman', role: 'RP', throws: 'L', age: 26, g: 5, gs: 3, outs: 65, h: 15, hr: 1, bb: 10, so: 5, hbp: 0, er: 7, w: 0, l: 2, sv: 0, rk: true },
      { id: 'mcleama01', name: 'Marty McLeary', role: 'RP', throws: 'R', age: 31, g: 5, gs: 2, outs: 53, h: 18, hr: 2, bb: 6, so: 9, hbp: 0, er: 6, w: 2, l: 0, sv: 0, rk: true },
    ],
  },
  // STL (SLN 2006)
  {
    franchiseId: 'STL',
    season: 2006,
    batters: [
      { id: 'molinya01', name: 'Yadier Molina', pos: 'C', bats: 'R', age: 23, pa: 461, h: 97, double: 22, triple: 0, hr: 7, bb: 27, so: 39, hbp: 5, sb: 1, cs: 3, sec: '1B', fld: 74, arm: 83 },
      { id: 'pujolal01', name: 'Albert Pujols', pos: '1B', bats: 'R', age: 26, pa: 634, h: 177, double: 36, triple: 1, hr: 44, bb: 88, so: 53, hbp: 6, sb: 9, cs: 2, sec: 'LF', fld: 83 },
      { id: 'milesaa01', name: 'Aaron Miles', pos: '2B', bats: 'S', age: 29, pa: 471, h: 118, double: 17, triple: 4, hr: 3, bb: 28, so: 45, hbp: 3, sb: 5, cs: 2, sec: 'SS', fld: 81 },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 31, pa: 594, h: 150, double: 42, triple: 2, hr: 23, bb: 61, so: 75, hbp: 9, sb: 6, cs: 4, sec: '1B', fld: 84 },
      { id: 'eckstda01', name: 'David Eckstein', pos: 'SS', bats: 'R', age: 31, pa: 552, h: 143, double: 19, triple: 3, hr: 4, bb: 37, so: 39, hbp: 12, sb: 9, cs: 6, sec: '2B', fld: 86 },
      { id: 'tagucso01', name: 'So Taguchi', pos: 'LF', bats: 'R', age: 36, pa: 361, h: 90, double: 18, triple: 2, hr: 4, bb: 25, so: 49, hbp: 2, sb: 10, cs: 3, sec: 'CF', fld: 73, arm: 65 },
      { id: 'edmonji01', name: 'Jim Edmonds', pos: 'CF', bats: 'L', age: 36, pa: 408, h: 91, double: 23, triple: 1, hr: 22, bb: 61, so: 100, hbp: 2, sb: 4, cs: 2, sec: 'LF', fld: 70, arm: 68 },
      { id: 'encarju01', name: 'Juan Encarnacion', pos: 'RF', bats: 'R', age: 30, pa: 598, h: 151, double: 28, triple: 4, hr: 18, bb: 36, so: 96, hbp: 6, sb: 6, cs: 5, sec: 'CF', fld: 58, arm: 62 },
      { id: 'lunahe01', name: 'Hector Luna', pos: 'DH', bats: 'R', age: 26, pa: 379, h: 98, double: 21, triple: 3, hr: 5, bb: 26, so: 62, hbp: 3, sb: 10, cs: 4, sec: 'LF', fld: 60 },
    ],
    bench: [
      { id: 'spiezsc01', name: 'Scott Spiezio', pos: '3B', bats: 'S', age: 33, pa: 321, h: 67, double: 13, triple: 3, hr: 11, bb: 34, so: 64, hbp: 4, sb: 2, cs: 0, sec: '1B', fld: 51 },
      { id: 'duncach01', name: 'Chris Duncan', pos: 'LF', bats: 'L', age: 25, pa: 314, h: 82, double: 11, triple: 3, hr: 22, bb: 29, so: 71, hbp: 2, sb: 0, cs: 0, sec: 'RF', fld: 58, arm: 65, rk: true },
      { id: 'rodrijo03', name: 'John Rodriguez', pos: 'LF', bats: 'L', age: 28, pa: 212, h: 54, double: 10, triple: 2, hr: 3, bb: 22, so: 48, hbp: 3, sb: 1, cs: 0, sec: 'RF', fld: 70, arm: 64 },
      { id: 'bennega01', name: 'Gary Bennett', pos: 'C', bats: 'R', age: 34, pa: 170, h: 34, double: 6, triple: 0, hr: 2, bb: 14, so: 27, hbp: 1, sb: 0, cs: 0, fld: 72, arm: 53 },
      { id: 'schumsk01', name: 'Skip Schumaker', pos: 'LF', bats: 'L', age: 26, pa: 60, h: 11, double: 1, triple: 0, hr: 1, bb: 5, so: 6, hbp: 0, sb: 2, cs: 1, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'carpech01', name: 'Chris Carpenter', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 665, h: 193, hr: 21, bb: 45, so: 189, hbp: 7, er: 75, w: 15, l: 8, sv: 0, fld: 68 },
      { id: 'marquja01', name: 'Jason Marquis', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 583, h: 214, hr: 31, bb: 72, so: 104, hbp: 11, er: 110, w: 14, l: 16, sv: 0, fld: 76 },
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 570, h: 205, hr: 23, bb: 67, so: 109, hbp: 8, er: 84, w: 12, l: 7, sv: 0, fld: 70 },
      { id: 'muldema01', name: 'Mark Mulder', role: 'SP', throws: 'L', age: 28, g: 17, gs: 17, outs: 280, h: 109, hr: 13, bb: 35, so: 55, hbp: 5, er: 54, w: 6, l: 7, sv: 0 },
      { id: 'reyesan01', name: 'Anthony Reyes', role: 'SP', throws: 'R', age: 24, g: 17, gs: 17, outs: 256, h: 81, hr: 17, bb: 34, so: 74, hbp: 6, er: 47, w: 5, l: 8, sv: 0, rk: true },
      { id: 'isrinja01', name: 'Jason Isringhausen', role: 'CL', throws: 'R', age: 33, g: 59, gs: 0, outs: 175, h: 47, hr: 7, bb: 32, so: 54, hbp: 2, er: 20, w: 4, l: 8, sv: 33 },
      { id: 'hancojo01', name: 'Josh Hancock', role: 'RP', throws: 'R', age: 28, g: 62, gs: 0, outs: 231, h: 72, hr: 11, bb: 23, so: 46, hbp: 1, er: 35, w: 3, l: 3, sv: 1 },
      { id: 'wainwad01', name: 'Adam Wainwright', role: 'RP', throws: 'R', age: 24, g: 61, gs: 0, outs: 225, h: 64, hr: 7, bb: 22, so: 71, hbp: 4, er: 27, w: 2, l: 1, sv: 3, rk: true },
      { id: 'loopebr01', name: 'Braden Looper', role: 'RP', throws: 'R', age: 31, g: 69, gs: 0, outs: 220, h: 76, hr: 5, bb: 21, so: 41, hbp: 3, er: 28, w: 9, l: 3, sv: 0 },
      { id: 'thompbr01', name: 'Brad Thompson', role: 'RP', throws: 'R', age: 24, g: 43, gs: 1, outs: 170, h: 55, hr: 5, bb: 19, so: 32, hbp: 5, er: 21, w: 1, l: 2, sv: 0 },
      { id: 'florera01', name: 'Randy Flores', role: 'RP', throws: 'L', age: 30, g: 65, gs: 0, outs: 125, h: 46, hr: 5, bb: 19, so: 42, hbp: 2, er: 22, w: 1, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'ponsosi01', name: 'Sidney Ponson', role: 'SP', throws: 'R', age: 29, g: 19, gs: 16, outs: 255, h: 111, hr: 10, bb: 32, so: 46, hbp: 3, er: 57, w: 4, l: 5, sv: 0 },
      { id: 'johnsty01', name: 'Tyler Johnson', role: 'RP', throws: 'L', age: 25, g: 56, gs: 0, outs: 109, h: 33, hr: 5, bb: 24, so: 38, hbp: 4, er: 19, w: 2, l: 4, sv: 0, rk: true },
      { id: 'kinnejo01', name: 'Josh Kinney', role: 'RP', throws: 'R', age: 27, g: 21, gs: 0, outs: 75, h: 17, hr: 3, bb: 8, so: 22, hbp: 1, er: 9, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // ARI (ARI 2006)
  {
    franchiseId: 'ARI',
    season: 2006,
    batters: [
      { id: 'estrajo01', name: 'Johnny Estrada', pos: 'C', bats: 'S', age: 30, pa: 443, h: 120, double: 28, triple: 0, hr: 8, bb: 20, so: 44, hbp: 6, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 70 },
      { id: 'jacksco01', name: 'Conor Jackson', pos: '1B', bats: 'R', age: 24, pa: 556, h: 136, double: 25, triple: 1, hr: 15, bb: 55, so: 72, hbp: 9, sb: 1, cs: 0, sec: '3B', fld: 69, rk: true },
      { id: 'hudsoor01', name: 'Orlando Hudson', pos: '2B', bats: 'S', age: 28, pa: 650, h: 163, double: 34, triple: 8, hr: 14, bb: 55, so: 86, hbp: 3, sb: 9, cs: 4, sec: 'SS', fld: 84 },
      { id: 'tracych01', name: 'Chad Tracy', pos: '3B', bats: 'L', age: 26, pa: 662, h: 174, double: 40, triple: 2, hr: 22, bb: 51, so: 110, hbp: 6, sb: 4, cs: 1, sec: '1B', fld: 56 },
      { id: 'counscr01', name: 'Craig Counsell', pos: 'SS', bats: 'L', age: 35, pa: 415, h: 92, double: 17, triple: 3, hr: 4, bb: 41, so: 49, hbp: 6, sb: 15, cs: 6, sec: '2B', fld: 97 },
      { id: 'gonzalu01', name: 'Luis Gonzalez', pos: 'LF', bats: 'L', age: 38, pa: 668, h: 156, double: 45, triple: 2, hr: 19, bb: 76, so: 72, hbp: 8, sb: 2, cs: 1, fld: 62, arm: 62 },
      { id: 'byrneer01', name: 'Eric Byrnes', pos: 'CF', bats: 'R', age: 30, pa: 606, h: 144, double: 36, triple: 3, hr: 21, bb: 38, so: 93, hbp: 8, sb: 19, cs: 3, sec: 'LF', fld: 64, arm: 66 },
      { id: 'greensh01', name: 'Shawn Green', pos: 'RF', bats: 'L', age: 33, pa: 588, h: 146, double: 31, triple: 3, hr: 18, bb: 52, so: 86, hbp: 8, sb: 5, cs: 3, sec: '1B', fld: 48, arm: 56 },
      { id: 'davanje02', name: 'Jeff DaVanon', pos: 'DH', bats: 'S', age: 32, pa: 256, h: 58, double: 10, triple: 3, hr: 4, bb: 34, so: 42, hbp: 1, sb: 11, cs: 4, sec: 'RF', fld: 48, arm: 58 },
    ],
    bench: [
      { id: 'drewst01', name: 'Stephen Drew', pos: 'SS', bats: 'L', age: 23, pa: 226, h: 66, double: 13, triple: 7, hr: 5, bb: 14, so: 50, hbp: 0, sb: 2, cs: 0, sec: '2B', fld: 63, rk: true },
      { id: 'easleda01', name: 'Damion Easley', pos: 'SS', bats: 'R', age: 36, pa: 220, h: 45, double: 11, triple: 1, hr: 8, bb: 20, so: 32, hbp: 4, sb: 2, cs: 1, sec: '2B', fld: 41 },
      { id: 'snydech02', name: 'Chris Snyder', pos: 'C', bats: 'R', age: 25, pa: 213, h: 44, double: 9, triple: 0, hr: 5, bb: 23, so: 45, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 69, arm: 84 },
      { id: 'quentca01', name: 'Carlos Quentin', pos: 'RF', bats: 'R', age: 23, pa: 191, h: 42, double: 13, triple: 3, hr: 9, bb: 15, so: 34, hbp: 8, sb: 1, cs: 0, sec: 'LF', fld: 71, arm: 71, rk: true },
      { id: 'clarkto02', name: 'Tony Clark', pos: '1B', bats: 'S', age: 34, pa: 147, h: 34, double: 7, triple: 0, hr: 9, bb: 14, so: 38, hbp: 1, sb: 0, cs: 0, fld: 76 },
    ],
    reserveBatters: [
      { id: 'greenan01', name: 'Andy Green', pos: '3B', bats: 'R', age: 28, pa: 102, h: 17, double: 3, triple: 0, hr: 1, bb: 12, so: 17, hbp: 0, sb: 1, cs: 0, sec: '2B' },
      { id: 'youngch04', name: 'Chris Young', pos: 'CF', bats: 'R', age: 22, pa: 78, h: 17, double: 4, triple: 0, hr: 2, bb: 6, so: 12, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 92, arm: 71, rk: true },
      { id: 'callaal01', name: 'Alberto Callaspo', pos: 'SS', bats: 'S', age: 23, pa: 47, h: 10, double: 1, triple: 1, hr: 0, bb: 4, so: 6, hbp: 0, sb: 0, cs: 1, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'webbbr01', name: 'Brandon Webb', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 705, h: 218, hr: 17, bb: 65, so: 175, hbp: 6, er: 85, w: 16, l: 8, sv: 0, fld: 82 },
      { id: 'batismi01', name: 'Miguel Batista', role: 'SP', throws: 'R', age: 35, g: 34, gs: 33, outs: 619, h: 227, hr: 20, bb: 86, so: 116, hbp: 5, er: 105, w: 11, l: 8, sv: 0, fld: 72 },
      { id: 'vargacl01', name: 'Claudio Vargas', role: 'SP', throws: 'R', age: 28, g: 31, gs: 30, outs: 503, h: 182, hr: 29, bb: 59, so: 122, hbp: 8, er: 93, w: 12, l: 10, sv: 0, fld: 67 },
      { id: 'gonzaen01', name: 'Enrique Gonzalez', role: 'SP', throws: 'R', age: 23, g: 22, gs: 18, outs: 319, h: 114, hr: 14, bb: 34, so: 66, hbp: 4, er: 67, w: 3, l: 7, sv: 0, rk: true },
      { id: 'cruzju02', name: 'Juan Cruz', role: 'SP', throws: 'R', age: 27, g: 31, gs: 15, outs: 284, h: 83, hr: 8, bb: 48, so: 89, hbp: 10, er: 46, w: 5, l: 6, sv: 0 },
      { id: 'valvejo01', name: 'Jose Valverde', role: 'CL', throws: 'R', age: 28, g: 44, gs: 0, outs: 148, h: 46, hr: 6, bb: 20, so: 65, hbp: 2, er: 24, w: 2, l: 3, sv: 18 },
      { id: 'meddebr01', name: 'Brandon Medders', role: 'RP', throws: 'R', age: 26, g: 60, gs: 0, outs: 215, h: 72, hr: 5, bb: 28, so: 54, hbp: 2, er: 26, w: 5, l: 3, sv: 0, rk: true },
      { id: 'lyonbr01', name: 'Brandon Lyon', role: 'RP', throws: 'R', age: 26, g: 68, gs: 0, outs: 208, h: 74, hr: 8, bb: 22, so: 43, hbp: 1, er: 33, w: 2, l: 4, sv: 0 },
      { id: 'juliojo01', name: 'Jorge Julio', role: 'RP', throws: 'R', age: 27, g: 62, gs: 0, outs: 198, h: 58, hr: 11, bb: 31, so: 72, hbp: 2, er: 35, w: 2, l: 4, sv: 16 },
      { id: 'vizcalu01', name: 'Luis Vizcaino', role: 'RP', throws: 'R', age: 31, g: 70, gs: 0, outs: 196, h: 57, hr: 8, bb: 27, so: 58, hbp: 3, er: 26, w: 4, l: 6, sv: 0 },
      { id: 'aquingr01', name: 'Greg Aquino', role: 'RP', throws: 'R', age: 28, g: 42, gs: 0, outs: 145, h: 54, hr: 8, bb: 24, so: 49, hbp: 4, er: 27, w: 2, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'gonzaed01', name: 'Edgar Gonzalez', role: 'RP', throws: 'R', age: 23, g: 11, gs: 5, outs: 128, h: 49, hr: 9, bb: 11, so: 27, hbp: 3, er: 27, w: 3, l: 4, sv: 0 },
      { id: 'penato03', name: 'Tony Pena', role: 'RP', throws: 'R', age: 24, g: 25, gs: 0, outs: 92, h: 36, hr: 6, bb: 8, so: 21, hbp: 0, er: 19, w: 3, l: 4, sv: 1, rk: true },
      { id: 'grimsja01', name: 'Jason Grimsley', role: 'RP', throws: 'R', age: 38, g: 19, gs: 0, outs: 83, h: 28, hr: 4, bb: 11, so: 13, hbp: 0, er: 14, w: 1, l: 2, sv: 0 },
      { id: 'choatra01', name: 'Randy Choate', role: 'RP', throws: 'L', age: 30, g: 30, gs: 0, outs: 48, h: 18, hr: 0, bb: 7, so: 13, hbp: 2, er: 9, w: 0, l: 1, sv: 0 },
      { id: 'daiglca01', name: 'Casey Daigle', role: 'RP', throws: 'R', age: 25, g: 10, gs: 0, outs: 37, h: 15, hr: 2, bb: 6, so: 5, hbp: 0, er: 8, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // COL (COL 2006)
  {
    franchiseId: 'COL',
    season: 2006,
    batters: [
      { id: 'torreyo01', name: 'Yorvit Torrealba', pos: 'C', bats: 'R', age: 27, pa: 241, h: 53, double: 14, triple: 2, hr: 6, bb: 14, so: 49, hbp: 3, sb: 3, cs: 2, sec: '1B', fld: 66, arm: 80 },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 32, pa: 649, h: 169, double: 43, triple: 4, hr: 20, bb: 102, so: 71, hbp: 7, sb: 3, cs: 1, sec: 'LF', fld: 75 },
      { id: 'carroja01', name: 'Jamey Carroll', pos: '2B', bats: 'R', age: 32, pa: 534, h: 131, double: 21, triple: 4, hr: 3, bb: 56, so: 68, hbp: 4, sb: 9, cs: 9, sec: '3B', fld: 100 },
      { id: 'atkinga01', name: 'Garrett Atkins', pos: '3B', bats: 'R', age: 26, pa: 695, h: 192, double: 44, triple: 1, hr: 24, bb: 70, so: 80, hbp: 7, sb: 3, cs: 1, sec: '1B', fld: 59 },
      { id: 'barmecl01', name: 'Clint Barmes', pos: 'SS', bats: 'R', age: 27, pa: 535, h: 118, double: 26, triple: 3, hr: 9, bb: 22, so: 65, hbp: 9, sb: 6, cs: 5, sec: '2B', fld: 77 },
      { id: 'hollima01', name: 'Matt Holliday', pos: 'LF', bats: 'R', age: 26, pa: 667, h: 191, double: 41, triple: 6, hr: 29, bb: 47, so: 110, hbp: 12, sb: 12, cs: 5, sec: 'RF', fld: 63, arm: 69 },
      { id: 'sullico01', name: 'Cory Sullivan', pos: 'CF', bats: 'L', age: 26, pa: 443, h: 108, double: 22, triple: 8, hr: 3, bb: 31, so: 95, hbp: 2, sb: 11, cs: 5, sec: 'LF', fld: 68, arm: 67 },
      { id: 'hawpebr01', name: 'Brad Hawpe', pos: 'RF', bats: 'L', age: 27, pa: 575, h: 141, double: 28, triple: 6, hr: 20, bb: 72, so: 123, hbp: 0, sb: 5, cs: 5, sec: 'LF', fld: 72, arm: 85 },
      { id: 'spilbry01', name: 'Ryan Spilborghs', pos: 'DH', bats: 'R', age: 26, pa: 186, h: 49, double: 6, triple: 3, hr: 4, bb: 14, so: 30, hbp: 0, sb: 5, cs: 2, sec: 'RF', fld: 59, arm: 83, rk: true },
    ],
    bench: [
      { id: 'freemch01', name: 'Choo Freeman', pos: 'CF', bats: 'R', age: 26, pa: 191, h: 40, double: 6, triple: 3, hr: 2, bb: 15, so: 42, hbp: 1, sb: 4, cs: 5, sec: 'LF', fld: 80, arm: 58, rk: true },
      { id: 'gonzalu02', name: 'Luis Gonzalez', pos: '2B', bats: 'R', age: 27, pa: 158, h: 41, double: 9, triple: 0, hr: 3, bb: 6, so: 25, hbp: 2, sb: 1, cs: 1, sec: '3B', fld: 66 },
      { id: 'ardoida01', name: 'Danny Ardoin', pos: 'C', bats: 'R', age: 31, pa: 135, h: 24, double: 5, triple: 0, hr: 2, bb: 10, so: 35, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 69, arm: 66 },
      { id: 'marreel01', name: 'Eli Marrero', pos: '1B', bats: 'R', age: 32, pa: 113, h: 23, double: 5, triple: 1, hr: 5, bb: 11, so: 27, hbp: 1, sb: 3, cs: 0, sec: 'LF' },
      { id: 'clossjd01', name: 'JD Closser', pos: 'C', bats: 'S', age: 26, pa: 112, h: 22, double: 4, triple: 1, hr: 2, bb: 12, so: 21, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 72 },
    ],
    reserveBatters: [
      { id: 'smithja05', name: 'Jason Smith', pos: '2B', bats: 'L', age: 28, pa: 108, h: 24, double: 2, triple: 1, hr: 3, bb: 5, so: 27, hbp: 2, sb: 2, cs: 1, sec: 'SS' },
      { id: 'tulowtr01', name: 'Troy Tulowitzki', pos: 'SS', bats: 'R', age: 21, pa: 108, h: 23, double: 2, triple: 0, hr: 1, bb: 10, so: 25, hbp: 1, sb: 3, cs: 0, sec: '2B', fld: 86, rk: true },
      { id: 'ojedami01', name: 'Miguel Ojeda', pos: 'C', bats: 'R', age: 31, pa: 95, h: 18, double: 3, triple: 0, hr: 2, bb: 9, so: 19, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 74, arm: 59 },
      { id: 'iannech01', name: 'Chris Iannetta', pos: 'C', bats: 'R', age: 23, pa: 93, h: 20, double: 4, triple: 0, hr: 2, bb: 13, so: 17, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 74, arm: 57, rk: true },
      { id: 'salazje01', name: 'Jeff Salazar', pos: 'CF', bats: 'L', age: 25, pa: 67, h: 15, double: 4, triple: 0, hr: 1, bb: 11, so: 16, hbp: 1, sb: 2, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'cookaa01', name: 'Aaron Cook', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 638, h: 244, hr: 17, bb: 55, so: 85, hbp: 8, er: 97, w: 9, l: 15, sv: 0, fld: 91 },
      { id: 'jennija01', name: 'Jason Jennings', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 636, h: 214, hr: 19, bb: 92, so: 135, hbp: 5, er: 100, w: 9, l: 13, sv: 0, fld: 70 },
      { id: 'francje01', name: 'Jeff Francis', role: 'SP', throws: 'L', age: 25, g: 32, gs: 32, outs: 597, h: 205, hr: 22, bb: 70, so: 124, hbp: 11, er: 102, w: 13, l: 11, sv: 0, fld: 76 },
      { id: 'foggjo01', name: 'Josh Fogg', role: 'SP', throws: 'R', age: 29, g: 31, gs: 31, outs: 516, h: 202, hr: 24, bb: 59, so: 89, hbp: 6, er: 100, w: 11, l: 9, sv: 0, fld: 74 },
      { id: 'kimby01', name: 'Byung-Hyun Kim', role: 'SP', throws: 'R', age: 27, g: 27, gs: 27, outs: 465, h: 172, hr: 18, bb: 66, so: 124, hbp: 11, er: 91, w: 8, l: 12, sv: 0, fld: 66 },
      { id: 'fuentbr01', name: 'Brian Fuentes', role: 'CL', throws: 'L', age: 30, g: 66, gs: 0, outs: 196, h: 52, hr: 7, bb: 27, so: 74, hbp: 7, er: 25, w: 3, l: 4, sv: 30 },
      { id: 'mesajo01', name: 'Jose Mesa', role: 'RP', throws: 'R', age: 40, g: 79, gs: 0, outs: 217, h: 76, hr: 9, bb: 33, so: 41, hbp: 4, er: 32, w: 1, l: 5, sv: 1 },
      { id: 'ramirra02', name: 'Ramon Ramirez', role: 'RP', throws: 'R', age: 24, g: 61, gs: 0, outs: 203, h: 58, hr: 5, bb: 27, so: 61, hbp: 1, er: 26, w: 4, l: 3, sv: 0, rk: true },
      { id: 'martito02', name: 'Tom Martin', role: 'RP', throws: 'L', age: 36, g: 68, gs: 0, outs: 181, h: 64, hr: 5, bb: 25, so: 43, hbp: 4, er: 34, w: 2, l: 0, sv: 0 },
      { id: 'dohmasc01', name: 'Scott Dohmann', role: 'RP', throws: 'R', age: 28, g: 48, gs: 0, outs: 145, h: 57, hr: 9, bb: 31, so: 50, hbp: 2, er: 35, w: 2, l: 4, sv: 1 },
      { id: 'kingra01', name: 'Ray King', role: 'RP', throws: 'L', age: 32, g: 67, gs: 0, outs: 134, h: 51, hr: 5, bb: 19, so: 26, hbp: 3, er: 19, w: 1, l: 4, sv: 1 },
    ],
    reservePitchers: [
      { id: 'corpama01', name: 'Manny Corpas', role: 'RP', throws: 'R', age: 23, g: 35, gs: 0, outs: 97, h: 36, hr: 3, bb: 8, so: 27, hbp: 2, er: 13, w: 1, l: 2, sv: 0, rk: true },
      { id: 'corteda01', name: 'David Cortes', role: 'RP', throws: 'R', age: 32, g: 30, gs: 0, outs: 88, h: 32, hr: 4, bb: 6, so: 18, hbp: 1, er: 14, w: 3, l: 1, sv: 0 },
      { id: 'kimsu01', name: 'Sun-Woo Kim', role: 'RP', throws: 'R', age: 28, g: 8, gs: 1, outs: 41, h: 19, hr: 2, bb: 6, so: 10, hbp: 1, er: 10, w: 0, l: 1, sv: 0 },
      { id: 'hampsju01', name: 'Justin Hampson', role: 'RP', throws: 'L', age: 26, g: 5, gs: 1, outs: 36, h: 19, hr: 3, bb: 5, so: 9, hbp: 1, er: 10, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // LAD (LAN 2006)
  {
    franchiseId: 'LAD',
    season: 2006,
    batters: [
      { id: 'martiru01', name: 'Russell Martin', pos: 'C', bats: 'R', age: 23, pa: 468, h: 117, double: 26, triple: 4, hr: 10, bb: 45, so: 57, hbp: 4, sb: 10, cs: 5, sec: '1B', fld: 74, arm: 72, rk: true },
      { id: 'garcino01', name: 'Nomar Garciaparra', pos: '1B', bats: 'R', age: 32, pa: 523, h: 142, double: 30, triple: 2, hr: 19, bb: 38, so: 36, hbp: 7, sb: 3, cs: 0, sec: '3B', fld: 70 },
      { id: 'kentje01', name: 'Jeff Kent', pos: '2B', bats: 'R', age: 38, pa: 473, h: 119, double: 27, triple: 2, hr: 18, bb: 51, so: 68, hbp: 7, sb: 3, cs: 2, sec: '3B', fld: 81 },
      { id: 'aybarwi01', name: 'Willy Aybar', pos: '3B', bats: 'S', age: 23, pa: 278, h: 69, double: 19, triple: 0, hr: 4, bb: 32, so: 35, hbp: 4, sb: 2, cs: 2, sec: '2B', fld: 42, rk: true },
      { id: 'furcara01', name: 'Rafael Furcal', pos: 'SS', bats: 'S', age: 28, pa: 736, h: 191, double: 32, triple: 9, hr: 14, bb: 70, so: 91, hbp: 1, sb: 40, cs: 11, sec: '2B', fld: 84 },
      { id: 'ethiean01', name: 'Andre Ethier', pos: 'LF', bats: 'L', age: 24, pa: 441, h: 122, double: 20, triple: 7, hr: 11, bb: 34, so: 77, hbp: 5, sb: 5, cs: 5, sec: 'RF', fld: 55, arm: 74, rk: true },
      { id: 'loftoke01', name: 'Kenny Lofton', pos: 'CF', bats: 'L', age: 39, pa: 522, h: 145, double: 16, triple: 10, hr: 3, bb: 45, so: 46, hbp: 1, sb: 29, cs: 5, sec: 'RF', fld: 61, arm: 66 },
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'RF', bats: 'L', age: 30, pa: 594, h: 141, double: 30, triple: 5, hr: 24, bb: 95, so: 104, hbp: 5, sb: 4, cs: 3, sec: 'CF', fld: 74, arm: 60 },
      { id: 'saenzol01', name: 'Olmedo Saenz', pos: 'DH', bats: 'R', age: 35, pa: 204, h: 51, double: 13, triple: 0, hr: 10, bb: 15, so: 42, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 51 },
    ],
    bench: [
      { id: 'cruzjo02', name: 'Jose Cruz', pos: 'LF', bats: 'S', age: 32, pa: 273, h: 56, double: 14, triple: 2, hr: 8, bb: 40, so: 56, hbp: 0, sb: 3, cs: 2, sec: 'CF', fld: 81, arm: 58 },
      { id: 'izturce01', name: 'Cesar Izturis', pos: '3B', bats: 'S', age: 26, pa: 208, h: 51, double: 9, triple: 1, hr: 1, bb: 12, so: 19, hbp: 1, sb: 4, cs: 3, sec: 'SS', fld: 78 },
      { id: 'martira03', name: 'Ramon Martinez', pos: '2B', bats: 'R', age: 33, pa: 194, h: 47, double: 7, triple: 1, hr: 2, bb: 14, so: 21, hbp: 1, sb: 0, cs: 0, sec: 'SS', fld: 66 },
      { id: 'kempma01', name: 'Matt Kemp', pos: 'CF', bats: 'R', age: 21, pa: 166, h: 39, double: 7, triple: 1, hr: 7, bb: 9, so: 53, hbp: 0, sb: 6, cs: 0, sec: 'LF', fld: 40, arm: 70, rk: true },
      { id: 'repkoja01', name: 'Jason Repko', pos: 'CF', bats: 'R', age: 25, pa: 150, h: 32, double: 6, triple: 1, hr: 4, bb: 11, so: 33, hbp: 3, sb: 6, cs: 2, sec: 'RF', fld: 59, arm: 82 },
    ],
    reserveBatters: [
      { id: 'muellbi02', name: 'Bill Mueller', pos: '3B', bats: 'S', age: 35, pa: 126, h: 31, double: 7, triple: 0, hr: 3, bb: 14, so: 14, hbp: 1, sb: 0, cs: 0, sec: '2B', fld: 56 },
      { id: 'alomasa02', name: 'Sandy Alomar', pos: 'C', bats: 'R', age: 40, pa: 113, h: 28, double: 6, triple: 0, hr: 1, bb: 4, so: 11, hbp: 1, sb: 0, cs: 0, fld: 71, arm: 60 },
      { id: 'loneyja01', name: 'James Loney', pos: '1B', bats: 'L', age: 22, pa: 111, h: 29, double: 6, triple: 5, hr: 4, bb: 8, so: 10, hbp: 1, sb: 1, cs: 0, sec: '3B', fld: 71, rk: true },
      { id: 'ledeeri01', name: 'Ricky Ledee', pos: 'LF', bats: 'L', age: 32, pa: 91, h: 20, double: 5, triple: 0, hr: 2, bb: 8, so: 18, hbp: 1, sb: 1, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'lowede01', name: 'Derek Lowe', role: 'SP', throws: 'R', age: 33, g: 35, gs: 34, outs: 654, h: 224, hr: 19, bb: 58, so: 129, hbp: 6, er: 93, w: 16, l: 8, sv: 0, fld: 89 },
      { id: 'pennybr01', name: 'Brad Penny', role: 'SP', throws: 'R', age: 28, g: 34, gs: 33, outs: 567, h: 202, hr: 19, bb: 52, so: 144, hbp: 7, er: 86, w: 16, l: 9, sv: 0, fld: 64 },
      { id: 'tomkobr01', name: 'Brett Tomko', role: 'SP', throws: 'R', age: 33, g: 44, gs: 15, outs: 337, h: 120, hr: 14, bb: 33, so: 69, hbp: 2, er: 56, w: 8, l: 7, sv: 0 },
      { id: 'seleaa01', name: 'Aaron Sele', role: 'SP', throws: 'R', age: 36, g: 28, gs: 15, outs: 310, h: 122, hr: 13, bb: 33, so: 49, hbp: 3, er: 56, w: 8, l: 6, sv: 0 },
      { id: 'billich01', name: 'Chad Billingsley', role: 'SP', throws: 'R', age: 21, g: 18, gs: 16, outs: 270, h: 92, hr: 7, bb: 58, so: 59, hbp: 3, er: 38, w: 7, l: 4, sv: 0, rk: true },
      { id: 'saitota01', name: 'Takashi Saito', role: 'CL', throws: 'R', age: 36, g: 72, gs: 0, outs: 235, h: 48, hr: 3, bb: 23, so: 107, hbp: 2, er: 18, w: 6, l: 2, sv: 24, rk: true },
      { id: 'broxtjo01', name: 'Jonathan Broxton', role: 'RP', throws: 'R', age: 22, g: 68, gs: 0, outs: 229, h: 61, hr: 6, bb: 36, so: 98, hbp: 1, er: 25, w: 4, l: 1, sv: 3, rk: true },
      { id: 'beimejo01', name: 'Joe Beimel', role: 'RP', throws: 'L', age: 29, g: 62, gs: 0, outs: 210, h: 73, hr: 7, bb: 22, so: 29, hbp: 0, er: 25, w: 2, l: 1, sv: 2 },
      { id: 'baezda01', name: 'Danys Baez', role: 'RP', throws: 'R', age: 28, g: 57, gs: 0, outs: 179, h: 57, hr: 4, bb: 21, so: 41, hbp: 5, er: 25, w: 5, l: 6, sv: 9 },
      { id: 'kuoho01', name: 'Hung-Chih Kuo', role: 'RP', throws: 'L', age: 24, g: 28, gs: 5, outs: 179, h: 54, hr: 3, bb: 34, so: 73, hbp: 1, er: 29, w: 1, l: 5, sv: 0, rk: true },
      { id: 'hamulti01', name: 'Tim Hamulack', role: 'RP', throws: 'L', age: 29, g: 33, gs: 0, outs: 102, h: 38, hr: 8, bb: 21, so: 33, hbp: 2, er: 26, w: 0, l: 3, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'carragi01', name: 'Giovanni Carrara', role: 'RP', throws: 'R', age: 38, g: 25, gs: 0, outs: 83, h: 24, hr: 3, bb: 11, so: 22, hbp: 2, er: 11, w: 0, l: 1, sv: 1 },
      { id: 'osorifr01', name: 'Franquelis Osoria', role: 'RP', throws: 'R', age: 24, g: 12, gs: 0, outs: 53, h: 23, hr: 3, bb: 7, so: 12, hbp: 2, er: 12, w: 0, l: 2, sv: 0, rk: true },
      { id: 'stulter01', name: 'Eric Stults', role: 'RP', throws: 'L', age: 26, g: 6, gs: 2, outs: 53, h: 17, hr: 4, bb: 7, so: 5, hbp: 0, er: 11, w: 1, l: 0, sv: 0, rk: true },
      { id: 'cartela02', name: 'Lance Carter', role: 'RP', throws: 'R', age: 31, g: 10, gs: 0, outs: 35, h: 15, hr: 2, bb: 5, so: 6, hbp: 0, er: 7, w: 0, l: 1, sv: 0 },
    ],
  },
  // SDP (SDN 2006)
  {
    franchiseId: 'SDP',
    season: 2006,
    batters: [
      { id: 'piazzmi01', name: 'Mike Piazza', pos: 'C', bats: 'R', age: 37, pa: 439, h: 106, double: 20, triple: 0, hr: 20, bb: 41, so: 66, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 64, arm: 55 },
      { id: 'gonzaad01', name: 'Adrian Gonzalez', pos: '1B', bats: 'L', age: 24, pa: 631, h: 167, double: 37, triple: 1, hr: 24, bb: 50, so: 117, hbp: 3, sb: 0, cs: 1, sec: '3B', fld: 81 },
      { id: 'barfijo02', name: 'Josh Barfield', pos: '2B', bats: 'R', age: 23, pa: 578, h: 151, double: 32, triple: 3, hr: 13, bb: 30, so: 81, hbp: 2, sb: 21, cs: 5, sec: 'SS', fld: 67, rk: true },
      { id: 'castivi02', name: 'Vinny Castilla', pos: '3B', bats: 'R', age: 38, pa: 291, h: 66, double: 16, triple: 1, hr: 8, bb: 18, so: 47, hbp: 3, sb: 1, cs: 0, sec: 'SS', fld: 65 },
      { id: 'greenkh01', name: 'Khalil Greene', pos: 'SS', bats: 'R', age: 26, pa: 460, h: 104, double: 27, triple: 2, hr: 14, bb: 35, so: 86, hbp: 7, sb: 5, cs: 1, sec: '2B', fld: 59 },
      { id: 'roberda07', name: 'Dave Roberts', pos: 'LF', bats: 'L', age: 34, pa: 566, h: 139, double: 20, triple: 12, hr: 5, bb: 55, so: 65, hbp: 4, sb: 43, cs: 8, sec: 'CF', fld: 83, arm: 59 },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 33, pa: 634, h: 146, double: 36, triple: 6, hr: 24, bb: 66, so: 149, hbp: 7, sb: 25, cs: 7, sec: 'RF', fld: 74, arm: 67 },
      { id: 'gilesbr02', name: 'Brian Giles', pos: 'RF', bats: 'L', age: 35, pa: 717, h: 167, double: 37, triple: 4, hr: 16, bb: 109, so: 66, hbp: 4, sb: 11, cs: 4, sec: 'LF', fld: 57, arm: 66 },
      { id: 'bellhma01', name: 'Mark Bellhorn', pos: 'DH', bats: 'S', age: 31, pa: 288, h: 54, double: 14, triple: 1, hr: 7, bb: 38, so: 88, hbp: 1, sb: 2, cs: 0, sec: '3B', fld: 65 },
    ],
    bench: [
      { id: 'blumge01', name: 'Geoff Blum', pos: 'SS', bats: 'S', age: 33, pa: 299, h: 65, double: 15, triple: 1, hr: 5, bb: 20, so: 45, hbp: 1, sb: 1, cs: 2, sec: '3B', fld: 74 },
      { id: 'bardjo01', name: 'Josh Bard', pos: 'C', bats: 'S', age: 28, pa: 284, h: 77, double: 19, triple: 0, hr: 8, bb: 30, so: 39, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 62, arm: 59 },
      { id: 'younger01', name: 'Eric Young', pos: 'LF', bats: 'R', age: 39, pa: 159, h: 34, double: 8, triple: 1, hr: 2, bb: 16, so: 14, hbp: 2, sb: 7, cs: 4, sec: 'CF', fld: 62, arm: 58 },
      { id: 'johnsbe02', name: 'Ben Johnson', pos: 'LF', bats: 'R', age: 25, pa: 135, h: 28, double: 7, triple: 2, hr: 4, bb: 15, so: 36, hbp: 1, sb: 2, cs: 1, sec: 'CF', fld: 100, arm: 64, rk: true },
      { id: 'bowenro01', name: 'Rob Bowen', pos: 'C', bats: 'S', age: 25, pa: 110, h: 22, double: 5, triple: 0, hr: 3, bb: 13, so: 27, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 65, arm: 54, rk: true },
    ],
    reserveBatters: [
      { id: 'sledgte01', name: 'Terrmel Sledge', pos: 'LF', bats: 'L', age: 29, pa: 78, h: 17, double: 3, triple: 1, hr: 2, bb: 8, so: 13, hbp: 0, sb: 1, cs: 1, sec: 'RF' },
    ],
    pitchers: [
      { id: 'peavyja01', name: 'Jake Peavy', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 607, h: 180, hr: 21, bb: 59, so: 218, hbp: 7, er: 78, w: 11, l: 14, sv: 0, fld: 72 },
      { id: 'henslcl01', name: 'Clay Hensley', role: 'SP', throws: 'R', age: 26, g: 37, gs: 29, outs: 561, h: 169, hr: 13, bb: 75, so: 121, hbp: 3, er: 72, w: 11, l: 12, sv: 0, fld: 76, rk: true },
      { id: 'youngch03', name: 'Chris Young', role: 'SP', throws: 'R', age: 27, g: 31, gs: 31, outs: 538, h: 149, hr: 25, bb: 60, so: 155, hbp: 7, er: 75, w: 11, l: 5, sv: 0, fld: 60 },
      { id: 'williwo02', name: 'Woody Williams', role: 'SP', throws: 'R', age: 39, g: 25, gs: 24, outs: 436, h: 152, hr: 20, bb: 40, so: 85, hbp: 5, er: 67, w: 12, l: 5, sv: 0, fld: 70 },
      { id: 'parkch01', name: 'Chan Ho Park', role: 'SP', throws: 'R', age: 33, g: 24, gs: 21, outs: 410, h: 147, hr: 17, bb: 53, so: 94, hbp: 10, er: 77, w: 7, l: 7, sv: 0, fld: 66 },
      { id: 'hoffmtr01', name: 'Trevor Hoffman', role: 'CL', throws: 'R', age: 38, g: 65, gs: 0, outs: 189, h: 50, hr: 5, bb: 12, so: 54, hbp: 1, er: 17, w: 0, l: 2, sv: 46 },
      { id: 'linebsc01', name: 'Scott Linebrink', role: 'RP', throws: 'R', age: 29, g: 73, gs: 0, outs: 227, h: 64, hr: 7, bb: 23, so: 72, hbp: 1, er: 24, w: 7, l: 4, sv: 2 },
      { id: 'sweenbr01', name: 'Brian Sweeney', role: 'RP', throws: 'R', age: 32, g: 37, gs: 0, outs: 169, h: 55, hr: 6, bb: 15, so: 24, hbp: 1, er: 21, w: 2, l: 0, sv: 2, rk: true },
      { id: 'adkinjo01', name: 'Jon Adkins', role: 'RP', throws: 'R', age: 28, g: 55, gs: 0, outs: 163, h: 59, hr: 5, bb: 19, so: 30, hbp: 2, er: 26, w: 2, l: 1, sv: 0 },
      { id: 'embreal01', name: 'Alan Embree', role: 'RP', throws: 'L', age: 36, g: 73, gs: 0, outs: 157, h: 53, hr: 6, bb: 14, so: 45, hbp: 1, er: 28, w: 4, l: 3, sv: 0 },
      { id: 'meredcl01', name: 'Cla Meredith', role: 'RP', throws: 'R', age: 23, g: 45, gs: 0, outs: 152, h: 32, hr: 3, bb: 8, so: 35, hbp: 3, er: 10, w: 5, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'thompmi03', name: 'Mike Thompson', role: 'SP', throws: 'R', age: 25, g: 19, gs: 16, outs: 276, h: 103, hr: 13, bb: 30, so: 35, hbp: 7, er: 51, w: 4, l: 5, sv: 0, rk: true },
      { id: 'cassisc01', name: 'Scott Cassidy', role: 'RP', throws: 'R', age: 30, g: 42, gs: 0, outs: 128, h: 42, hr: 8, bb: 17, so: 47, hbp: 1, er: 16, w: 6, l: 4, sv: 0 },
      { id: 'brocado01', name: 'Doug Brocail', role: 'RP', throws: 'R', age: 39, g: 25, gs: 0, outs: 85, h: 29, hr: 1, bb: 10, so: 21, hbp: 1, er: 15, w: 2, l: 2, sv: 0 },
      { id: 'brazede01', name: 'Dewon Brazelton', role: 'RP', throws: 'R', age: 26, g: 9, gs: 2, outs: 54, h: 22, hr: 3, bb: 12, so: 10, hbp: 1, er: 15, w: 0, l: 2, sv: 0 },
    ],
  },
  // SFG (SFN 2006)
  {
    franchiseId: 'SFG',
    season: 2006,
    batters: [
      { id: 'alfonel01', name: 'Eliezer Alfonzo', pos: 'C', bats: 'R', age: 27, pa: 309, h: 76, double: 17, triple: 2, hr: 12, bb: 9, so: 74, hbp: 7, sb: 1, cs: 0, sec: '1B', fld: 76, arm: 67, rk: true },
      { id: 'sweenma01', name: 'Mark Sweeney', pos: '1B', bats: 'L', age: 36, pa: 291, h: 67, double: 15, triple: 2, hr: 7, bb: 35, so: 57, hbp: 2, sb: 2, cs: 1, sec: 'LF', fld: 83 },
      { id: 'durhara01', name: 'Ray Durham', pos: '2B', bats: 'S', age: 34, pa: 555, h: 143, double: 31, triple: 5, hr: 20, bb: 51, so: 60, hbp: 4, sb: 7, cs: 3, fld: 66 },
      { id: 'felizpe01', name: 'Pedro Feliz', pos: '3B', bats: 'R', age: 31, pa: 644, h: 151, double: 35, triple: 5, hr: 22, bb: 35, so: 109, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 76 },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 39, pa: 659, h: 165, double: 25, triple: 7, hr: 4, bb: 57, so: 56, hbp: 5, sb: 23, cs: 8, fld: 69 },
      { id: 'bondsba01', name: 'Barry Bonds', pos: 'LF', bats: 'L', age: 41, pa: 493, h: 102, double: 22, triple: 1, hr: 30, bb: 133, so: 46, hbp: 9, sb: 3, cs: 0, sec: 'CF', fld: 67, arm: 70 },
      { id: 'finlest01', name: 'Steve Finley', pos: 'CF', bats: 'L', age: 41, pa: 481, h: 106, double: 21, triple: 7, hr: 12, bb: 40, so: 62, hbp: 2, sb: 7, cs: 2, sec: 'RF', fld: 78, arm: 68 },
      { id: 'winnra01', name: 'Randy Winn', pos: 'RF', bats: 'S', age: 32, pa: 635, h: 161, double: 37, triple: 5, hr: 14, bb: 47, so: 75, hbp: 6, sb: 14, cs: 8, sec: 'CF', fld: 95, arm: 70 },
      { id: 'aloumo01', name: 'Moises Alou', pos: 'DH', bats: 'R', age: 39, pa: 378, h: 103, double: 21, triple: 2, hr: 19, bb: 36, so: 35, hbp: 1, sb: 3, cs: 1, sec: 'LF', fld: 66, arm: 57 },
    ],
    bench: [
      { id: 'niekrla01', name: 'Lance Niekro', pos: '1B', bats: 'R', age: 27, pa: 210, h: 49, double: 10, triple: 2, hr: 7, bb: 11, so: 34, hbp: 1, sb: 0, cs: 1, sec: '3B', fld: 71 },
      { id: 'mathemi01', name: 'Mike Matheny', pos: 'C', bats: 'R', age: 35, pa: 177, h: 39, double: 11, triple: 0, hr: 4, bb: 10, so: 33, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 76, arm: 72 },
      { id: 'greento02', name: 'Todd Greene', pos: 'C', bats: 'R', age: 35, pa: 170, h: 44, double: 10, triple: 1, hr: 5, bb: 10, so: 37, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 76 },
      { id: 'vizcajo01', name: 'Jose Vizcaino', pos: 'SS', bats: 'S', age: 38, pa: 161, h: 36, double: 7, triple: 1, hr: 1, bb: 13, so: 20, hbp: 0, sb: 1, cs: 1, sec: '2B' },
      { id: 'frandke01', name: 'Kevin Frandsen', pos: '2B', bats: 'R', age: 24, pa: 102, h: 20, double: 4, triple: 0, hr: 2, bb: 3, so: 14, hbp: 6, sb: 0, cs: 1, sec: 'SS', fld: 49, rk: true },
    ],
    reserveBatters: [
      { id: 'ellisja01', name: 'Jason Ellison', pos: 'LF', bats: 'R', age: 28, pa: 91, h: 21, double: 4, triple: 1, hr: 1, bb: 5, so: 11, hbp: 1, sb: 3, cs: 2, sec: 'CF', fld: 66, arm: 76 },
      { id: 'lindeto01', name: 'Todd Linden', pos: 'LF', bats: 'S', age: 26, pa: 89, h: 19, double: 4, triple: 1, hr: 2, bb: 7, so: 23, hbp: 2, sb: 1, cs: 0, sec: 'RF', fld: 77, arm: 68 },
    ],
    pitchers: [
      { id: 'schmija01', name: 'Jason Schmidt', role: 'SP', throws: 'R', age: 33, g: 32, gs: 32, outs: 640, h: 185, hr: 20, bb: 86, so: 197, hbp: 5, er: 89, w: 11, l: 9, sv: 0, fld: 64 },
      { id: 'morrima01', name: 'Matt Morris', role: 'SP', throws: 'R', age: 31, g: 33, gs: 33, outs: 623, h: 222, hr: 25, bb: 55, so: 124, hbp: 11, er: 109, w: 10, l: 15, sv: 0, fld: 75 },
      { id: 'cainma01', name: 'Matt Cain', role: 'SP', throws: 'R', age: 21, g: 32, gs: 31, outs: 572, h: 151, hr: 18, bb: 87, so: 173, hbp: 5, er: 84, w: 13, l: 12, sv: 0, fld: 62, rk: true },
      { id: 'lowryno01', name: 'Noah Lowry', role: 'SP', throws: 'L', age: 25, g: 27, gs: 27, outs: 478, h: 160, hr: 19, bb: 57, so: 110, hbp: 5, er: 76, w: 7, l: 10, sv: 0, fld: 67 },
      { id: 'wrighja01', name: 'Jamey Wright', role: 'SP', throws: 'R', age: 31, g: 34, gs: 21, outs: 468, h: 170, hr: 17, bb: 69, so: 83, hbp: 11, er: 88, w: 6, l: 10, sv: 0, fld: 77 },
      { id: 'benitar01', name: 'Armando Benitez', role: 'CL', throws: 'R', age: 33, g: 41, gs: 0, outs: 115, h: 34, hr: 6, bb: 19, so: 33, hbp: 0, er: 14, w: 4, l: 2, sv: 17 },
      { id: 'correke01', name: 'Kevin Correia', role: 'RP', throws: 'R', age: 25, g: 48, gs: 0, outs: 209, h: 66, hr: 8, bb: 27, so: 53, hbp: 4, er: 31, w: 2, l: 0, sv: 0 },
      { id: 'accarje01', name: 'Jeremy Accardo', role: 'RP', throws: 'R', age: 24, g: 65, gs: 0, outs: 207, h: 73, hr: 7, bb: 20, so: 51, hbp: 1, er: 39, w: 2, l: 4, sv: 3, rk: true },
      { id: 'klinest02', name: 'Steve Kline', role: 'RP', throws: 'L', age: 33, g: 72, gs: 0, outs: 155, h: 51, hr: 5, bb: 25, so: 33, hbp: 1, er: 21, w: 4, l: 3, sv: 1 },
      { id: 'sanchjo01', name: 'Jonathan Sanchez', role: 'RP', throws: 'L', age: 23, g: 27, gs: 4, outs: 120, h: 39, hr: 2, bb: 23, so: 33, hbp: 4, er: 22, w: 3, l: 1, sv: 0, rk: true },
      { id: 'wilsobr01', name: 'Brian Wilson', role: 'RP', throws: 'R', age: 24, g: 31, gs: 0, outs: 90, h: 32, hr: 1, bb: 21, so: 23, hbp: 1, er: 18, w: 2, l: 3, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'hennebr01', name: 'Brad Hennessey', role: 'SP', throws: 'R', age: 26, g: 34, gs: 12, outs: 298, h: 99, hr: 12, bb: 42, so: 48, hbp: 7, er: 49, w: 5, l: 6, sv: 1 },
      { id: 'muntesc01', name: 'Scott Munter', role: 'RP', throws: 'R', age: 26, g: 27, gs: 0, outs: 68, h: 29, hr: 1, bb: 13, so: 7, hbp: 1, er: 15, w: 0, l: 1, sv: 0, rk: true },
      { id: 'worreti01', name: 'Tim Worrell', role: 'RP', throws: 'R', age: 38, g: 23, gs: 0, outs: 61, h: 25, hr: 5, bb: 6, so: 16, hbp: 1, er: 12, w: 3, l: 2, sv: 6 },
      { id: 'taschja01', name: 'Jack Taschner', role: 'RP', throws: 'L', age: 28, g: 24, gs: 0, outs: 58, h: 25, hr: 2, bb: 9, so: 17, hbp: 1, er: 13, w: 0, l: 1, sv: 0, rk: true },
      { id: 'fasseje01', name: 'Jeff Fassero', role: 'RP', throws: 'L', age: 43, g: 10, gs: 1, outs: 45, h: 19, hr: 2, bb: 6, so: 10, hbp: 0, er: 9, w: 1, l: 1, sv: 0 },
    ],
  },
];
