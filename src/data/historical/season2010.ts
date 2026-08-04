import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 2010 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 2010
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
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents2010.ts`).
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

export const SEASON_2010: HistTeam[] = [
  // BAL (BAL 2010)
  {
    franchiseId: 'BAL',
    season: 2010,
    batters: [
      { id: 'wietema01', name: 'Matt Wieters', pos: 'C', bats: 'S', age: 24, pa: 502, h: 118, double: 21, triple: 1, hr: 11, bb: 43, so: 100, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 77, arm: 73 },
      { id: 'wiggity01', name: 'Ty Wigginton', pos: '1B', bats: 'R', age: 32, pa: 649, h: 153, double: 29, triple: 1, hr: 22, bb: 46, so: 106, hbp: 7, sb: 1, cs: 3, sec: '3B', fld: 68 },
      { id: 'lugoju01', name: 'Julio Lugo', pos: '2B', bats: 'R', age: 34, pa: 264, h: 62, double: 8, triple: 3, hr: 1, bb: 21, so: 46, hbp: 2, sb: 7, cs: 4, sec: 'SS', fld: 83 },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: '3B', bats: 'R', age: 36, pa: 681, h: 183, double: 35, triple: 1, hr: 14, bb: 26, so: 62, hbp: 10, sb: 4, cs: 2, sec: 'SS', fld: 85 },
      { id: 'izturce01', name: 'Cesar Izturis', pos: 'SS', bats: 'S', age: 30, pa: 513, h: 115, double: 14, triple: 3, hr: 1, bb: 25, so: 48, hbp: 5, sb: 15, cs: 5, sec: '3B', fld: 69 },
      { id: 'piefe01', name: 'Felix Pie', pos: 'LF', bats: 'L', age: 25, pa: 308, h: 76, double: 13, triple: 4, hr: 7, bb: 18, so: 59, hbp: 1, sb: 4, cs: 2, sec: 'CF', fld: 88, arm: 85 },
      { id: 'jonesad01', name: 'Adam Jones', pos: 'CF', bats: 'R', age: 24, pa: 621, h: 161, double: 25, triple: 5, hr: 19, bb: 30, so: 118, hbp: 11, sb: 9, cs: 6, sec: 'LF', fld: 85, arm: 77 },
      { id: 'markani01', name: 'Nick Markakis', pos: 'RF', bats: 'L', age: 26, pa: 709, h: 187, double: 46, triple: 2, hr: 15, bb: 72, so: 98, hbp: 2, sb: 7, cs: 3, sec: 'LF', fld: 75, arm: 65 },
      { id: 'scottlu01', name: 'Luke Scott', pos: 'DH', bats: 'L', age: 32, pa: 517, h: 123, double: 28, triple: 1, hr: 26, bb: 57, so: 101, hbp: 3, sb: 1, cs: 0, sec: 'LF' },
    ],
    bench: [
      { id: 'patteco01', name: 'Corey Patterson', pos: 'LF', bats: 'L', age: 30, pa: 340, h: 76, double: 15, triple: 1, hr: 8, bb: 18, so: 71, hbp: 1, sb: 19, cs: 5, sec: 'CF', fld: 78, arm: 72 },
      { id: 'roberbr01', name: 'Brian Roberts', pos: '2B', bats: 'S', age: 32, pa: 261, h: 65, double: 18, triple: 1, hr: 5, bb: 28, so: 40, hbp: 1, sb: 12, cs: 3, sec: 'SS', fld: 52 },
      { id: 'belljo01', name: 'Josh Bell', pos: '3B', bats: 'S', age: 23, pa: 161, h: 34, double: 5, triple: 0, hr: 3, bb: 2, so: 53, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 72, rk: true },
      { id: 'atkinga01', name: 'Garrett Atkins', pos: '1B', bats: 'R', age: 30, pa: 152, h: 34, double: 6, triple: 0, hr: 3, bb: 13, so: 24, hbp: 1, sb: 0, cs: 0, sec: '3B', fld: 68 },
      { id: 'reimono01', name: 'Nolan Reimold', pos: 'LF', bats: 'R', age: 26, pa: 131, h: 29, double: 5, triple: 0, hr: 4, bb: 14, so: 25, hbp: 1, sb: 2, cs: 0, sec: 'RF', fld: 75, arm: 68 },
    ],
    reserveBatters: [
      { id: 'tatumcr01', name: 'Craig Tatum', pos: 'C', bats: 'R', age: 27, pa: 126, h: 28, double: 3, triple: 0, hr: 0, bb: 12, so: 20, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 70, arm: 52, rk: true },
      { id: 'mooresc02', name: 'Scott Moore', pos: '2B', bats: 'L', age: 26, pa: 96, h: 18, double: 2, triple: 0, hr: 3, bb: 8, so: 19, hbp: 0, sb: 3, cs: 0, sec: '3B', fld: 62, rk: true },
      { id: 'andinro01', name: 'Robert Andino', pos: '2B', bats: 'R', age: 26, pa: 66, h: 15, double: 3, triple: 0, hr: 1, bb: 4, so: 15, hbp: 0, sb: 1, cs: 1, sec: 'SS' },
      { id: 'montalu01', name: 'Luis Montanez', pos: 'LF', bats: 'R', age: 28, pa: 58, h: 11, double: 2, triple: 0, hr: 1, bb: 2, so: 10, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
      { id: 'hugherh01', name: 'Rhyne Hughes', pos: '1B', bats: 'L', age: 26, pa: 51, h: 10, double: 2, triple: 0, hr: 0, bb: 4, so: 19, hbp: 0, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'guthrje01', name: 'Jeremy Guthrie', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 628, h: 203, hr: 28, bb: 55, so: 118, hbp: 12, er: 96, w: 11, l: 14, sv: 0, fld: 70 },
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 35, g: 31, gs: 31, outs: 572, h: 216, hr: 27, bb: 65, so: 130, hbp: 8, er: 98, w: 4, l: 16, sv: 0, fld: 69 },
      { id: 'matusbr01', name: 'Brian Matusz', role: 'SP', throws: 'L', age: 23, g: 32, gs: 32, outs: 527, h: 177, hr: 20, bb: 62, so: 143, hbp: 6, er: 85, w: 10, l: 12, sv: 0, fld: 66, rk: true },
      { id: 'bergebr02', name: 'Brad Bergesen', role: 'SP', throws: 'R', age: 24, g: 30, gs: 28, outs: 510, h: 189, hr: 23, bb: 49, so: 85, hbp: 7, er: 85, w: 8, l: 12, sv: 0, fld: 74 },
      { id: 'arrieja01', name: 'Jake Arrieta', role: 'SP', throws: 'R', age: 24, g: 18, gs: 18, outs: 301, h: 106, hr: 9, bb: 48, so: 52, hbp: 4, er: 52, w: 6, l: 6, sv: 0, fld: 55, rk: true },
      { id: 'simonal01', name: 'Alfredo Simon', role: 'CL', throws: 'R', age: 29, g: 49, gs: 0, outs: 148, h: 55, hr: 13, bb: 20, so: 36, hbp: 2, er: 30, w: 4, l: 2, sv: 17, fld: 67, rk: true },
      { id: 'hernada01', name: 'David Hernandez', role: 'RP', throws: 'R', age: 25, g: 41, gs: 8, outs: 238, h: 80, hr: 14, bb: 39, so: 62, hbp: 2, er: 42, w: 8, l: 8, sv: 2, fld: 66 },
      { id: 'alberma01', name: 'Matt Albers', role: 'RP', throws: 'R', age: 27, g: 62, gs: 0, outs: 227, h: 79, hr: 5, bb: 36, so: 49, hbp: 2, er: 39, w: 5, l: 3, sv: 0, fld: 69 },
      { id: 'hendrma01', name: 'Mark Hendrickson', role: 'RP', throws: 'L', age: 36, g: 52, gs: 1, outs: 226, h: 90, hr: 10, bb: 23, so: 50, hbp: 2, er: 42, w: 1, l: 6, sv: 0, fld: 65 },
      { id: 'berkeja01', name: 'Jason Berken', role: 'RP', throws: 'R', age: 26, g: 41, gs: 0, outs: 187, h: 72, hr: 7, bb: 20, so: 37, hbp: 2, er: 33, w: 3, l: 3, sv: 0, fld: 57 },
      { id: 'ueharko01', name: 'Koji Uehara', role: 'RP', throws: 'R', age: 35, g: 43, gs: 0, outs: 132, h: 40, hr: 5, bb: 6, so: 42, hbp: 0, er: 16, w: 1, l: 2, sv: 13, fld: 71 },
    ],
    reservePitchers: [
      { id: 'tillmch01', name: 'Chris Tillman', role: 'SP', throws: 'R', age: 22, g: 11, gs: 11, outs: 161, h: 56, hr: 10, bb: 26, so: 31, hbp: 1, er: 34, w: 2, l: 5, sv: 0, fld: 65 },
      { id: 'ohmanwi01', name: 'Will Ohman', role: 'RP', throws: 'L', age: 32, g: 68, gs: 0, outs: 126, h: 40, hr: 5, bb: 22, so: 40, hbp: 1, er: 17, w: 0, l: 2, sv: 0, fld: 70 },
      { id: 'johnsji04', name: 'Jim Johnson', role: 'RP', throws: 'R', age: 27, g: 26, gs: 0, outs: 79, h: 27, hr: 2, bb: 8, so: 19, hbp: 1, er: 10, w: 1, l: 1, sv: 1, fld: 91 },
      { id: 'gonzami02', name: 'Mike Gonzalez', role: 'RP', throws: 'L', age: 32, g: 29, gs: 0, outs: 74, h: 19, hr: 2, bb: 12, so: 31, hbp: 1, er: 9, w: 1, l: 3, sv: 1, fld: 79 },
      { id: 'vanderi01', name: 'Rick van den Hurk', role: 'RP', throws: 'R', age: 25, g: 9, gs: 1, outs: 53, h: 17, hr: 3, bb: 7, so: 16, hbp: 2, er: 9, w: 0, l: 1, sv: 0, fld: 69 },
    ],
  },
  // BOS (BOS 2010)
  {
    franchiseId: 'BOS',
    season: 2010,
    batters: [
      { id: 'martivi01', name: 'Victor Martinez', pos: 'C', bats: 'S', age: 31, pa: 538, h: 145, double: 30, triple: 1, hr: 18, bb: 49, so: 56, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 73, arm: 65 },
      { id: 'youklke01', name: 'Kevin Youkilis', pos: '1B', bats: 'R', age: 31, pa: 435, h: 112, double: 27, triple: 3, hr: 20, bb: 55, so: 78, hbp: 10, sb: 4, cs: 2, sec: '3B', fld: 78 },
      { id: 'pedrodu01', name: 'Dustin Pedroia', pos: '2B', bats: 'R', age: 26, pa: 351, h: 92, double: 24, triple: 1, hr: 9, bb: 34, so: 28, hbp: 3, sb: 10, cs: 2, sec: 'SS', fld: 70 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 31, pa: 641, h: 175, double: 42, triple: 1, hr: 23, bb: 38, so: 89, hbp: 6, sb: 7, cs: 2, sec: '1B', fld: 82 },
      { id: 'scutama01', name: 'Marco Scutaro', pos: 'SS', bats: 'R', age: 34, pa: 695, h: 169, double: 36, triple: 1, hr: 11, bb: 68, so: 74, hbp: 4, sb: 9, cs: 4, sec: '2B', fld: 49 },
      { id: 'hallbi03', name: 'Bill Hall', pos: 'LF', bats: 'R', age: 30, pa: 382, h: 79, double: 18, triple: 1, hr: 14, bb: 32, so: 111, hbp: 1, sb: 6, cs: 2, sec: 'CF', fld: 73, arm: 71 },
      { id: 'mcdonda02', name: 'Darnell McDonald', pos: 'CF', bats: 'R', age: 31, pa: 363, h: 87, double: 18, triple: 3, hr: 9, bb: 28, so: 88, hbp: 2, sb: 8, cs: 1, sec: 'RF', fld: 58, arm: 82 },
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'RF', bats: 'L', age: 34, pa: 546, h: 124, double: 27, triple: 3, hr: 23, bb: 73, so: 106, hbp: 4, sb: 3, cs: 3, sec: 'CF', fld: 66, arm: 56 },
      { id: 'ortizda01', name: 'David Ortiz', pos: 'DH', bats: 'L', age: 34, pa: 606, h: 134, double: 35, triple: 1, hr: 30, bb: 79, so: 132, hbp: 3, sb: 0, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'lowelmi01', name: 'Mike Lowell', pos: '1B', bats: 'R', age: 36, pa: 244, h: 60, double: 14, triple: 0, hr: 7, bb: 19, so: 32, hbp: 1, sb: 1, cs: 0, sec: '3B', fld: 70 },
      { id: 'hermije01', name: 'Jeremy Hermida', pos: 'LF', bats: 'L', age: 26, pa: 239, h: 52, double: 9, triple: 1, hr: 6, bb: 22, so: 54, hbp: 2, sb: 2, cs: 1, sec: 'RF', fld: 70, arm: 73 },
      { id: 'lowrije01', name: 'Jed Lowrie', pos: '2B', bats: 'S', age: 26, pa: 197, h: 44, double: 13, triple: 1, hr: 6, bb: 23, so: 34, hbp: 1, sb: 1, cs: 1, sec: 'SS', fld: 78 },
      { id: 'navada01', name: 'Daniel Nava', pos: 'LF', bats: 'S', age: 27, pa: 188, h: 39, double: 14, triple: 1, hr: 1, bb: 19, so: 46, hbp: 8, sb: 1, cs: 1, sec: 'RF', fld: 60, arm: 68, rk: true },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 37, pa: 180, h: 40, double: 10, triple: 1, hr: 7, bb: 19, so: 46, hbp: 2, sb: 2, cs: 1, sec: 'RF', fld: 68, arm: 74 },
    ],
    reserveBatters: [
      { id: 'kalisry01', name: 'Ryan Kalish', pos: 'CF', bats: 'L', age: 22, pa: 179, h: 41, double: 11, triple: 1, hr: 4, bb: 12, so: 38, hbp: 1, sb: 10, cs: 1, sec: 'LF', fld: 60, arm: 73, rk: true },
      { id: 'cashke01', name: 'Kevin Cash', pos: 'C', bats: 'R', age: 32, pa: 129, h: 22, double: 4, triple: 0, hr: 2, bb: 11, so: 31, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 60, arm: 59 },
      { id: 'varitja01', name: 'Jason Varitek', pos: 'C', bats: 'S', age: 38, pa: 123, h: 23, double: 6, triple: 0, hr: 4, bb: 14, so: 29, hbp: 1, sb: 0, cs: 0, fld: 80, arm: 64 },
      { id: 'ellsbja01', name: 'Jacoby Ellsbury', pos: 'CF', bats: 'L', age: 26, pa: 83, h: 21, double: 3, triple: 1, hr: 1, bb: 6, so: 9, hbp: 1, sb: 8, cs: 1, sec: 'LF', fld: 78, arm: 57 },
      { id: 'reddijo01', name: 'Josh Reddick', pos: 'RF', bats: 'L', age: 23, pa: 63, h: 11, double: 3, triple: 1, hr: 1, bb: 1, so: 16, hbp: 0, sb: 1, cs: 0, sec: 'LF', fld: 85, arm: 69, rk: true },
    ],
    pitchers: [
      { id: 'lackejo01', name: 'John Lackey', role: 'SP', throws: 'R', age: 31, g: 33, gs: 33, outs: 645, h: 228, hr: 21, bb: 66, so: 165, hbp: 10, er: 100, w: 14, l: 11, sv: 0, fld: 69 },
      { id: 'lestejo01', name: 'Jon Lester', role: 'SP', throws: 'L', age: 26, g: 32, gs: 32, outs: 624, h: 180, hr: 16, bb: 74, so: 214, hbp: 8, er: 76, w: 19, l: 9, sv: 0, fld: 68 },
      { id: 'buchhcl01', name: 'Clay Buchholz', role: 'SP', throws: 'R', age: 25, g: 28, gs: 28, outs: 521, h: 152, hr: 14, bb: 68, so: 124, hbp: 5, er: 60, w: 17, l: 7, sv: 0, fld: 80 },
      { id: 'matsuda01', name: 'Daisuke Matsuzaka', role: 'SP', throws: 'R', age: 29, g: 25, gs: 25, outs: 461, h: 142, hr: 14, bb: 76, so: 134, hbp: 7, er: 75, w: 9, l: 6, sv: 0, fld: 56 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 43, g: 32, gs: 19, outs: 420, h: 144, hr: 17, bb: 43, so: 83, hbp: 8, er: 75, w: 4, l: 10, sv: 0, fld: 64 },
      { id: 'papeljo01', name: 'Jonathan Papelbon', role: 'CL', throws: 'R', age: 29, g: 65, gs: 0, outs: 201, h: 57, hr: 6, bb: 24, so: 77, hbp: 2, er: 22, w: 5, l: 7, sv: 37, fld: 70 },
      { id: 'bardda01', name: 'Daniel Bard', role: 'RP', throws: 'R', age: 25, g: 73, gs: 0, outs: 224, h: 49, hr: 6, bb: 30, so: 80, hbp: 3, er: 20, w: 1, l: 2, sv: 3, fld: 62, rk: true },
      { id: 'ramirra02', name: 'Ramon Ramirez', role: 'RP', throws: 'R', age: 28, g: 69, gs: 0, outs: 208, h: 54, hr: 6, bb: 28, so: 50, hbp: 1, er: 22, w: 1, l: 3, sv: 3, fld: 80 },
      { id: 'atchisc01', name: 'Scott Atchison', role: 'RP', throws: 'R', age: 34, g: 43, gs: 1, outs: 180, h: 58, hr: 9, bb: 19, so: 41, hbp: 1, er: 30, w: 2, l: 3, sv: 0, fld: 80 },
      { id: 'delcama01', name: 'Manny Delcarmen', role: 'RP', throws: 'R', age: 28, g: 57, gs: 0, outs: 157, h: 47, hr: 6, bb: 29, so: 41, hbp: 2, er: 26, w: 3, l: 4, sv: 0, fld: 91 },
      { id: 'okajihi01', name: 'Hideki Okajima', role: 'RP', throws: 'L', age: 34, g: 56, gs: 0, outs: 138, h: 51, hr: 6, bb: 19, so: 40, hbp: 1, er: 20, w: 4, l: 4, sv: 0, fld: 77 },
    ],
    reservePitchers: [
      { id: 'beckejo02', name: 'Josh Beckett', role: 'SP', throws: 'R', age: 30, g: 21, gs: 21, outs: 383, h: 140, hr: 17, bb: 38, so: 125, hbp: 6, er: 69, w: 6, l: 6, sv: 0, fld: 70 },
      { id: 'doubrfe01', name: 'Felix Doubront', role: 'RP', throws: 'L', age: 22, g: 12, gs: 3, outs: 75, h: 27, hr: 3, bb: 10, so: 23, hbp: 1, er: 12, w: 2, l: 2, sv: 2, fld: 65, rk: true },
      { id: 'bowdemi01', name: 'Michael Bowden', role: 'RP', throws: 'R', age: 23, g: 14, gs: 0, outs: 46, h: 20, hr: 2, bb: 5, so: 12, hbp: 0, er: 11, w: 0, l: 1, sv: 0, fld: 53, rk: true },
      { id: 'schoesc01', name: 'Scott Schoeneweis', role: 'RP', throws: 'L', age: 36, g: 15, gs: 0, outs: 41, h: 17, hr: 3, bb: 8, so: 10, hbp: 1, er: 10, w: 1, l: 0, sv: 0, fld: 62 },
      { id: 'richadu02', name: 'Dustin Richardson', role: 'RP', throws: 'L', age: 26, g: 26, gs: 0, outs: 39, h: 15, hr: 2, bb: 13, so: 11, hbp: 1, er: 5, w: 0, l: 0, sv: 0, fld: 66, rk: true },
    ],
  },
  // NYY (NYA 2010)
  {
    franchiseId: 'NYY',
    season: 2010,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 39, pa: 451, h: 102, double: 25, triple: 1, hr: 19, bb: 55, so: 100, hbp: 5, sb: 2, cs: 1, sec: '1B', fld: 60, arm: 59 },
      { id: 'teixema01', name: 'Mark Teixeira', pos: '1B', bats: 'S', age: 30, pa: 712, h: 167, double: 40, triple: 1, hr: 35, bb: 90, so: 116, hbp: 12, sb: 1, cs: 1, sec: '3B', fld: 71 },
      { id: 'canoro01', name: 'Robinson Cano', pos: '2B', bats: 'L', age: 27, pa: 696, h: 200, double: 43, triple: 3, hr: 26, bb: 44, so: 72, hbp: 6, sb: 4, cs: 4, sec: 'SS', fld: 81 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: '3B', bats: 'R', age: 34, pa: 595, h: 143, double: 27, triple: 1, hr: 32, bb: 69, so: 104, hbp: 7, sb: 10, cs: 3, sec: 'SS', fld: 71 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 36, pa: 739, h: 195, double: 29, triple: 2, hr: 13, bb: 66, so: 100, hbp: 8, sb: 21, cs: 5, fld: 57 },
      { id: 'gardnbr01', name: 'Brett Gardner', pos: 'LF', bats: 'L', age: 26, pa: 569, h: 132, double: 18, triple: 8, hr: 5, bb: 70, so: 97, hbp: 5, sb: 49, cs: 9, sec: 'CF', fld: 82, arm: 77 },
      { id: 'grandcu01', name: 'Curtis Granderson', pos: 'CF', bats: 'L', age: 29, pa: 528, h: 118, double: 18, triple: 7, hr: 22, bb: 54, so: 108, hbp: 2, sb: 13, cs: 3, sec: 'LF', fld: 73, arm: 67 },
      { id: 'swishni01', name: 'Nick Swisher', pos: 'RF', bats: 'S', age: 29, pa: 635, h: 145, double: 33, triple: 2, hr: 29, bb: 77, so: 138, hbp: 5, sb: 1, cs: 2, sec: '1B', fld: 76, arm: 73 },
      { id: 'thamema01', name: 'Marcus Thames', pos: 'DH', bats: 'R', age: 33, pa: 237, h: 56, double: 8, triple: 0, hr: 13, bb: 20, so: 61, hbp: 2, sb: 0, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'cervefr01', name: 'Francisco Cervelli', pos: 'C', bats: 'R', age: 24, pa: 317, h: 74, double: 11, triple: 2, hr: 1, bb: 28, so: 41, hbp: 5, sb: 1, cs: 2, sec: '1B', fld: 65, arm: 58, rk: true },
      { id: 'penara02', name: 'Ramiro Pena', pos: '3B', bats: 'S', age: 24, pa: 167, h: 38, double: 3, triple: 1, hr: 0, bb: 6, so: 27, hbp: 1, sb: 7, cs: 1, sec: 'SS', fld: 84, rk: true },
      { id: 'johnsni01', name: 'Nick Johnson', pos: 'DH', bats: 'L', age: 31, pa: 98, h: 20, double: 4, triple: 0, hr: 2, bb: 19, so: 16, hbp: 2, sb: 0, cs: 1, sec: '1B' },
      { id: 'miranju01', name: 'Juan Miranda', pos: 'DH', bats: 'L', age: 27, pa: 71, h: 15, double: 2, triple: 1, hr: 3, bb: 7, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'curtico01', name: 'Colin Curtis', pos: 'RF', bats: 'L', age: 25, pa: 64, h: 11, double: 3, triple: 0, hr: 1, bb: 4, so: 15, hbp: 1, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    reserveBatters: [
      { id: 'russoke01', name: 'Kevin Russo', pos: '3B', bats: 'R', age: 25, pa: 54, h: 9, double: 2, triple: 0, hr: 0, bb: 3, so: 9, hbp: 1, sb: 1, cs: 0, sec: '1B', rk: true },
      { id: 'nunezed02', name: 'Eduardo Nunez', pos: '3B', bats: 'R', age: 23, pa: 53, h: 14, double: 1, triple: 0, hr: 1, bb: 3, so: 2, hbp: 0, sb: 5, cs: 0, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'sabatcc01', name: 'CC Sabathia', role: 'SP', throws: 'L', age: 29, g: 34, gs: 34, outs: 713, h: 209, hr: 19, bb: 70, so: 207, hbp: 8, er: 84, w: 21, l: 7, sv: 0, fld: 63 },
      { id: 'burneaj01', name: 'A. J. Burnett', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 560, h: 193, hr: 23, bb: 82, so: 169, hbp: 14, er: 98, w: 10, l: 15, sv: 0, fld: 53 },
      { id: 'hugheph01', name: 'Phil Hughes', role: 'SP', throws: 'R', age: 24, g: 31, gs: 29, outs: 529, h: 159, hr: 23, bb: 59, so: 156, hbp: 3, er: 79, w: 18, l: 8, sv: 0, fld: 61 },
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 33, g: 31, gs: 26, outs: 472, h: 152, hr: 24, bb: 50, so: 152, hbp: 5, er: 77, w: 10, l: 10, sv: 0, fld: 80 },
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 38, g: 21, gs: 21, outs: 387, h: 128, hr: 13, bb: 43, so: 98, hbp: 3, er: 55, w: 11, l: 3, sv: 0, fld: 81 },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 40, g: 61, gs: 0, outs: 180, h: 40, hr: 4, bb: 10, so: 56, hbp: 3, er: 12, w: 3, l: 3, sv: 33, fld: 62 },
      { id: 'chambjo03', name: 'Joba Chamberlain', role: 'RP', throws: 'R', age: 24, g: 73, gs: 0, outs: 215, h: 70, hr: 7, bb: 28, so: 68, hbp: 3, er: 33, w: 3, l: 4, sv: 3, fld: 71 },
      { id: 'gaudich01', name: 'Chad Gaudin', role: 'RP', throws: 'R', age: 27, g: 42, gs: 0, outs: 196, h: 69, hr: 10, bb: 29, so: 58, hbp: 5, er: 36, w: 1, l: 4, sv: 0, fld: 72 },
      { id: 'moseldu01', name: 'Dustin Moseley', role: 'RP', throws: 'R', age: 28, g: 16, gs: 9, outs: 196, h: 72, hr: 12, bb: 25, so: 35, hbp: 2, er: 37, w: 4, l: 4, sv: 0, fld: 66 },
      { id: 'parkch01', name: 'Chan Ho Park', role: 'RP', throws: 'R', age: 37, g: 53, gs: 0, outs: 191, h: 64, hr: 7, bb: 22, so: 53, hbp: 3, er: 30, w: 4, l: 3, sv: 0, fld: 60 },
      { id: 'roberda08', name: 'David Robertson', role: 'RP', throws: 'R', age: 25, g: 64, gs: 0, outs: 184, h: 57, hr: 5, bb: 33, so: 77, hbp: 2, er: 26, w: 4, l: 5, sv: 1, fld: 65 },
    ],
    reservePitchers: [
      { id: 'mitrese01', name: 'Sergio Mitre', role: 'RP', throws: 'R', age: 29, g: 27, gs: 3, outs: 162, h: 52, hr: 8, bb: 14, so: 29, hbp: 2, er: 27, w: 0, l: 3, sv: 1, fld: 63 },
      { id: 'woodke02', name: 'Kerry Wood', role: 'RP', throws: 'R', age: 33, g: 47, gs: 0, outs: 138, h: 38, hr: 4, bb: 24, so: 53, hbp: 3, er: 18, w: 3, l: 4, sv: 8, fld: 70 },
      { id: 'novaiv01', name: 'Ivan Nova', role: 'RP', throws: 'R', age: 23, g: 10, gs: 7, outs: 126, h: 44, hr: 4, bb: 17, so: 26, hbp: 1, er: 21, w: 1, l: 2, sv: 0, fld: 57, rk: true },
      { id: 'loganbo02', name: 'Boone Logan', role: 'RP', throws: 'L', age: 25, g: 51, gs: 0, outs: 120, h: 40, hr: 4, bb: 18, so: 35, hbp: 1, er: 17, w: 2, l: 0, sv: 0, fld: 73 },
      { id: 'marteda01', name: 'Damaso Marte', role: 'RP', throws: 'L', age: 35, g: 30, gs: 0, outs: 53, h: 13, hr: 2, bb: 9, so: 16, hbp: 1, er: 10, w: 0, l: 0, sv: 0, fld: 63 },
    ],
  },
  // TBR (TBA 2010)
  {
    franchiseId: 'TBR',
    season: 2010,
    batters: [
      { id: 'jasojo01', name: 'John Jaso', pos: 'C', bats: 'L', age: 26, pa: 404, h: 89, double: 18, triple: 3, hr: 5, bb: 59, so: 39, hbp: 2, sb: 4, cs: 0, sec: '1B', fld: 67, arm: 66, rk: true },
      { id: 'penaca01', name: 'Carlos Pena', pos: '1B', bats: 'L', age: 32, pa: 582, h: 103, double: 21, triple: 1, hr: 32, bb: 88, so: 161, hbp: 8, sb: 4, cs: 2, sec: '3B', fld: 69 },
      { id: 'rodrise01', name: 'Sean Rodriguez', pos: '2B', bats: 'R', age: 25, pa: 378, h: 83, double: 18, triple: 2, hr: 9, bb: 23, so: 99, hbp: 7, sb: 12, cs: 3, sec: 'SS', fld: 69 },
      { id: 'longoev01', name: 'Evan Longoria', pos: '3B', bats: 'R', age: 24, pa: 661, h: 165, double: 44, triple: 3, hr: 27, bb: 70, so: 133, hbp: 6, sb: 12, cs: 3, sec: '1B', fld: 82 },
      { id: 'bartlja01', name: 'Jason Bartlett', pos: 'SS', bats: 'R', age: 30, pa: 532, h: 133, double: 27, triple: 4, hr: 7, bb: 44, so: 82, hbp: 6, sb: 19, cs: 6, sec: '2B', fld: 51 },
      { id: 'crawfca02', name: 'Carl Crawford', pos: 'LF', bats: 'L', age: 28, pa: 657, h: 181, double: 27, triple: 11, hr: 16, bb: 47, so: 99, hbp: 5, sb: 50, cs: 12, sec: 'CF', fld: 82, arm: 68 },
      { id: 'uptonbj01', name: 'B. J. Upton', pos: 'CF', bats: 'R', age: 25, pa: 610, h: 130, double: 36, triple: 4, hr: 14, bb: 68, so: 152, hbp: 2, sb: 42, cs: 12, sec: 'LF', fld: 77, arm: 62 },
      { id: 'zobribe01', name: 'Ben Zobrist', pos: 'RF', bats: 'S', age: 29, pa: 655, h: 142, double: 29, triple: 4, hr: 19, bb: 93, so: 109, hbp: 3, sb: 21, cs: 4, sec: 'CF', fld: 82, arm: 69 },
      { id: 'brignre01', name: 'Reid Brignac', pos: 'DH', bats: 'S', age: 24, pa: 326, h: 78, double: 15, triple: 2, hr: 7, bb: 19, so: 77, hbp: 2, sb: 4, cs: 4, sec: '1B', fld: 62, rk: true },
    ],
    bench: [
      { id: 'aybarwi01', name: 'Willy Aybar', pos: 'DH', bats: 'S', age: 27, pa: 309, h: 66, double: 13, triple: 0, hr: 8, bb: 30, so: 53, hbp: 3, sb: 1, cs: 0, sec: '3B' },
      { id: 'joycema01', name: 'Matt Joyce', pos: 'RF', bats: 'L', age: 25, pa: 261, h: 53, double: 15, triple: 3, hr: 11, bb: 36, so: 56, hbp: 2, sb: 2, cs: 2, sec: 'LF', fld: 74, arm: 72 },
      { id: 'shoppke01', name: 'Kelly Shoppach', pos: 'C', bats: 'R', age: 30, pa: 187, h: 35, double: 9, triple: 0, hr: 7, bb: 19, so: 63, hbp: 8, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 61 },
      { id: 'navardi01', name: 'Dioner Navarro', pos: 'C', bats: 'S', age: 26, pa: 142, h: 30, double: 6, triple: 0, hr: 2, bb: 9, so: 17, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 73, arm: 80 },
      { id: 'johnsda06', name: 'Dan Johnson', pos: 'DH', bats: 'L', age: 30, pa: 140, h: 22, double: 3, triple: 0, hr: 7, bb: 24, so: 27, hbp: 1, sb: 1, cs: 0, sec: '1B' },
    ],
    reserveBatters: [
      { id: 'kaplega01', name: 'Gabe Kapler', pos: 'RF', bats: 'R', age: 34, pa: 140, h: 30, double: 7, triple: 0, hr: 4, bb: 13, so: 23, hbp: 1, sb: 2, cs: 1, sec: 'CF', fld: 57, arm: 61 },
      { id: 'blaloha01', name: 'Hank Blalock', pos: 'DH', bats: 'L', age: 29, pa: 69, h: 16, double: 3, triple: 0, hr: 3, bb: 4, so: 14, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'priceda01', name: 'David Price', role: 'SP', throws: 'L', age: 24, g: 32, gs: 31, outs: 626, h: 174, hr: 18, bb: 80, so: 180, hbp: 6, er: 73, w: 19, l: 6, sv: 0, fld: 66 },
      { id: 'garzama01', name: 'Matt Garza', role: 'SP', throws: 'R', age: 26, g: 33, gs: 32, outs: 614, h: 187, hr: 26, bb: 69, so: 162, hbp: 8, er: 88, w: 15, l: 10, sv: 1, fld: 57 },
      { id: 'shielja02', name: 'James Shields', role: 'SP', throws: 'R', age: 28, g: 34, gs: 33, outs: 610, h: 234, hr: 30, bb: 49, so: 174, hbp: 5, er: 105, w: 13, l: 15, sv: 0, fld: 62 },
      { id: 'niemaje01', name: 'Jeff Niemann', role: 'SP', throws: 'R', age: 27, g: 30, gs: 29, outs: 523, h: 166, hr: 21, bb: 59, so: 126, hbp: 8, er: 81, w: 12, l: 8, sv: 0, fld: 59 },
      { id: 'daviswa01', name: 'Wade Davis', role: 'SP', throws: 'R', age: 24, g: 29, gs: 29, outs: 504, h: 164, hr: 22, bb: 62, so: 120, hbp: 4, er: 75, w: 12, l: 10, sv: 0, fld: 72, rk: true },
      { id: 'soriara01', name: 'Rafael Soriano', role: 'CL', throws: 'R', age: 30, g: 64, gs: 0, outs: 187, h: 38, hr: 4, bb: 18, so: 67, hbp: 1, er: 15, w: 3, l: 2, sv: 45, fld: 71 },
      { id: 'sonnaan01', name: 'Andy Sonnanstine', role: 'RP', throws: 'R', age: 27, g: 41, gs: 4, outs: 243, h: 91, hr: 12, bb: 24, so: 50, hbp: 4, er: 46, w: 3, l: 1, sv: 1, fld: 86 },
      { id: 'cormila01', name: 'Lance Cormier', role: 'RP', throws: 'R', age: 29, g: 60, gs: 0, outs: 186, h: 67, hr: 6, bb: 29, so: 32, hbp: 0, er: 26, w: 4, l: 3, sv: 0, fld: 68 },
      { id: 'benoijo01', name: 'Joaquin Benoit', role: 'RP', throws: 'R', age: 32, g: 63, gs: 0, outs: 181, h: 33, hr: 6, bb: 17, so: 68, hbp: 0, er: 13, w: 1, l: 2, sv: 1, fld: 74 },
      { id: 'balfogr01', name: 'Grant Balfour', role: 'RP', throws: 'R', age: 32, g: 57, gs: 0, outs: 166, h: 42, hr: 4, bb: 21, so: 59, hbp: 1, er: 19, w: 2, l: 1, sv: 0, fld: 69 },
      { id: 'wheelda01', name: 'Dan Wheeler', role: 'RP', throws: 'R', age: 32, g: 64, gs: 0, outs: 145, h: 36, hr: 8, bb: 13, so: 43, hbp: 0, er: 18, w: 2, l: 4, sv: 3, fld: 62 },
    ],
    reservePitchers: [
      { id: 'choatra01', name: 'Randy Choate', role: 'RP', throws: 'L', age: 34, g: 85, gs: 0, outs: 134, h: 40, hr: 4, bb: 16, so: 39, hbp: 2, er: 20, w: 4, l: 3, sv: 0, fld: 83 },
      { id: 'hellije01', name: 'Jeremy Hellickson', role: 'RP', throws: 'R', age: 23, g: 10, gs: 4, outs: 109, h: 32, hr: 5, bb: 8, so: 33, hbp: 2, er: 14, w: 4, l: 0, sv: 0, fld: 76, rk: true },
      { id: 'ekstrmi01', name: 'Mike Ekstrom', role: 'RP', throws: 'R', age: 26, g: 15, gs: 0, outs: 49, h: 15, hr: 1, bb: 8, so: 12, hbp: 1, er: 9, w: 0, l: 1, sv: 0, fld: 60, rk: true },
    ],
  },
  // TOR (TOR 2010)
  {
    franchiseId: 'TOR',
    season: 2010,
    batters: [
      { id: 'buckjo01', name: 'John Buck', pos: 'C', bats: 'R', age: 29, pa: 437, h: 107, double: 25, triple: 2, hr: 17, bb: 23, so: 110, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 74, arm: 70 },
      { id: 'overbly01', name: 'Lyle Overbay', pos: '1B', bats: 'L', age: 33, pa: 607, h: 134, double: 37, triple: 2, hr: 19, bb: 74, so: 123, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 74 },
      { id: 'hillaa01', name: 'Aaron Hill', pos: '2B', bats: 'R', age: 28, pa: 580, h: 130, double: 26, triple: 0, hr: 26, bb: 38, so: 81, hbp: 6, sb: 4, cs: 2, sec: 'SS', fld: 66 },
      { id: 'encared01', name: 'Edwin Encarnacion', pos: '3B', bats: 'R', age: 27, pa: 367, h: 78, double: 15, triple: 1, hr: 18, bb: 35, so: 65, hbp: 4, sb: 1, cs: 0, sec: '1B', fld: 70 },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 33, pa: 640, h: 146, double: 39, triple: 2, hr: 20, bb: 31, so: 112, hbp: 7, sb: 2, cs: 2, sec: '2B', fld: 74 },
      { id: 'lewisfr02', name: 'Fred Lewis', pos: 'LF', bats: 'L', age: 29, pa: 480, h: 113, double: 29, triple: 6, hr: 7, bb: 43, so: 110, hbp: 7, sb: 16, cs: 6, sec: 'RF', fld: 64, arm: 59 },
      { id: 'wellsve01', name: 'Vernon Wells', pos: 'CF', bats: 'R', age: 31, pa: 646, h: 161, double: 39, triple: 3, hr: 24, bb: 47, so: 80, hbp: 2, sb: 10, cs: 4, sec: 'RF', fld: 72, arm: 65 },
      { id: 'bautijo02', name: 'Jose Bautista', pos: 'RF', bats: 'R', age: 29, pa: 683, h: 144, double: 31, triple: 3, hr: 42, bb: 94, so: 127, hbp: 8, sb: 7, cs: 1, sec: 'CF', fld: 55, arm: 80 },
      { id: 'lindad01', name: 'Adam Lind', pos: 'DH', bats: 'L', age: 26, pa: 613, h: 150, double: 36, triple: 2, hr: 26, bb: 43, so: 125, hbp: 4, sb: 1, cs: 0, sec: 'LF' },
    ],
    bench: [
      { id: 'snidetr01', name: 'Travis Snider', pos: 'LF', bats: 'L', age: 22, pa: 319, h: 73, double: 19, triple: 0, hr: 12, bb: 25, so: 84, hbp: 1, sb: 4, cs: 2, sec: 'RF', fld: 63, arm: 66 },
      { id: 'molinjo01', name: 'Jose Molina', pos: 'C', bats: 'R', age: 35, pa: 183, h: 38, double: 6, triple: 0, hr: 4, bb: 11, so: 34, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 85 },
      { id: 'mcdonjo03', name: 'John McDonald', pos: '2B', bats: 'R', age: 35, pa: 163, h: 37, double: 8, triple: 1, hr: 4, bb: 5, so: 22, hbp: 1, sb: 1, cs: 1, sec: 'SS', fld: 79 },
      { id: 'wisede01', name: 'Dewayne Wise', pos: 'CF', bats: 'L', age: 32, pa: 118, h: 26, double: 4, triple: 2, hr: 3, bb: 4, so: 25, hbp: 2, sb: 4, cs: 1, sec: 'RF', fld: 68, arm: 84 },
      { id: 'mccoymi01', name: 'Mike McCoy', pos: '2B', bats: 'R', age: 29, pa: 90, h: 15, double: 4, triple: 0, hr: 0, bb: 8, so: 20, hbp: 0, sb: 6, cs: 1, sec: 'SS', rk: true },
    ],
    reserveBatters: [
      { id: 'ruizra01', name: 'Randy Ruiz', pos: 'DH', bats: 'R', age: 32, pa: 40, h: 10, double: 2, triple: 0, hr: 2, bb: 2, so: 11, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'romerri01', name: 'Ricky Romero', role: 'SP', throws: 'L', age: 25, g: 32, gs: 32, outs: 630, h: 198, hr: 17, bb: 84, so: 168, hbp: 9, er: 90, w: 14, l: 9, sv: 0, fld: 79 },
      { id: 'marcush01', name: 'Shaun Marcum', role: 'SP', throws: 'R', age: 28, g: 31, gs: 31, outs: 586, h: 177, hr: 25, bb: 47, so: 163, hbp: 7, er: 78, w: 13, l: 8, sv: 0, fld: 77 },
      { id: 'cecilbr01', name: 'Brett Cecil', role: 'SP', throws: 'L', age: 23, g: 28, gs: 28, outs: 518, h: 181, hr: 21, bb: 57, so: 117, hbp: 3, er: 85, w: 15, l: 7, sv: 0, fld: 62 },
      { id: 'morrobr01', name: 'Brandon Morrow', role: 'SP', throws: 'R', age: 25, g: 26, gs: 26, outs: 439, h: 132, hr: 14, bb: 73, so: 167, hbp: 6, er: 71, w: 10, l: 7, sv: 0, fld: 60 },
      { id: 'rzepcma01', name: 'Marc Rzepczynski', role: 'SP', throws: 'L', age: 24, g: 14, gs: 12, outs: 191, h: 66, hr: 8, bb: 31, so: 61, hbp: 4, er: 32, w: 4, l: 4, sv: 0, fld: 70 },
      { id: 'greggke01', name: 'Kevin Gregg', role: 'CL', throws: 'R', age: 32, g: 63, gs: 0, outs: 177, h: 51, hr: 6, bb: 29, so: 58, hbp: 2, er: 26, w: 2, l: 6, sv: 37, fld: 83 },
      { id: 'tallebr01', name: 'Brian Tallet', role: 'RP', throws: 'L', age: 32, g: 34, gs: 5, outs: 232, h: 83, hr: 13, bb: 36, so: 58, hbp: 3, er: 48, w: 2, l: 6, sv: 0, fld: 71 },
      { id: 'campsh01', name: 'Shawn Camp', role: 'RP', throws: 'R', age: 34, g: 70, gs: 0, outs: 217, h: 69, hr: 7, bb: 21, so: 49, hbp: 4, er: 26, w: 4, l: 3, sv: 2, fld: 78 },
      { id: 'janssca01', name: 'Casey Janssen', role: 'RP', throws: 'R', age: 28, g: 56, gs: 0, outs: 206, h: 79, hr: 8, bb: 21, so: 55, hbp: 4, er: 32, w: 5, l: 2, sv: 0, fld: 79 },
      { id: 'frasoja01', name: 'Jason Frasor', role: 'RP', throws: 'R', age: 32, g: 69, gs: 0, outs: 191, h: 56, hr: 4, bb: 27, so: 65, hbp: 3, er: 24, w: 3, l: 4, sv: 4, fld: 67 },
      { id: 'downssc01', name: 'Scott Downs', role: 'RP', throws: 'L', age: 34, g: 67, gs: 0, outs: 184, h: 49, hr: 3, bb: 16, so: 49, hbp: 3, er: 17, w: 5, l: 5, sv: 0, fld: 69 },
    ],
    reservePitchers: [
      { id: 'evelada01', name: 'Dana Eveland', role: 'SP', throws: 'L', age: 26, g: 12, gs: 10, outs: 163, h: 70, hr: 4, bb: 30, so: 31, hbp: 3, er: 37, w: 3, l: 5, sv: 0, fld: 61 },
      { id: 'litscje01', name: 'Jesse Litsch', role: 'RP', throws: 'R', age: 25, g: 9, gs: 9, outs: 140, h: 52, hr: 7, bb: 12, so: 23, hbp: 2, er: 25, w: 1, l: 5, sv: 0, fld: 87 },
      { id: 'purceda01', name: 'David Purcey', role: 'RP', throws: 'L', age: 28, g: 33, gs: 0, outs: 102, h: 31, hr: 4, bb: 16, so: 28, hbp: 1, er: 18, w: 1, l: 1, sv: 1, fld: 65 },
      { id: 'millsbr02', name: 'Brad Mills', role: 'RP', throws: 'L', age: 25, g: 7, gs: 3, outs: 67, h: 23, hr: 4, bb: 13, so: 19, hbp: 1, er: 17, w: 1, l: 0, sv: 0, fld: 75, rk: true },
      { id: 'hillsh01', name: 'Shawn Hill', role: 'RP', throws: 'R', age: 29, g: 4, gs: 4, outs: 62, h: 25, hr: 1, bb: 5, so: 13, hbp: 1, er: 10, w: 1, l: 2, sv: 0, fld: 61 },
    ],
  },
  // CWS (CHA 2010)
  {
    franchiseId: 'CWS',
    season: 2010,
    batters: [
      { id: 'pierzaj01', name: 'A. J. Pierzynski', pos: 'C', bats: 'L', age: 33, pa: 503, h: 134, double: 26, triple: 0, hr: 11, bb: 18, so: 47, hbp: 4, sb: 2, cs: 2, sec: '1B', fld: 77, arm: 69 },
      { id: 'konerpa01', name: 'Paul Konerko', pos: '1B', bats: 'R', age: 34, pa: 631, h: 159, double: 29, triple: 1, hr: 34, bb: 69, so: 102, hbp: 7, sb: 1, cs: 1, sec: '3B', fld: 70 },
      { id: 'beckhgo01', name: 'Gordon Beckham', pos: '2B', bats: 'R', age: 23, pa: 498, h: 114, double: 28, triple: 2, hr: 12, bb: 41, so: 86, hbp: 7, sb: 6, cs: 6, sec: '3B', fld: 77 },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: '3B', bats: 'S', age: 43, pa: 391, h: 92, double: 12, triple: 2, hr: 2, bb: 32, so: 46, hbp: 1, sb: 10, cs: 5, sec: 'SS', fld: 63 },
      { id: 'ramiral03', name: 'Alexei Ramirez', pos: 'SS', bats: 'R', age: 28, pa: 626, h: 162, double: 24, triple: 2, hr: 18, bb: 34, so: 76, hbp: 2, sb: 14, cs: 7, sec: '2B', fld: 86 },
      { id: 'pierrju01', name: 'Juan Pierre', pos: 'LF', bats: 'L', age: 32, pa: 734, h: 186, double: 20, triple: 6, hr: 1, bb: 45, so: 46, hbp: 17, sb: 65, cs: 19, sec: 'CF', fld: 78, arm: 63 },
      { id: 'riosal01', name: 'Alex Rios', pos: 'CF', bats: 'R', age: 29, pa: 617, h: 155, double: 32, triple: 3, hr: 18, bb: 38, so: 98, hbp: 6, sb: 30, cs: 10, sec: 'RF', fld: 79, arm: 67 },
      { id: 'quentca01', name: 'Carlos Quentin', pos: 'RF', bats: 'R', age: 27, pa: 527, h: 113, double: 23, triple: 1, hr: 28, bb: 50, so: 77, hbp: 20, sb: 3, cs: 2, sec: 'LF', fld: 51, arm: 64 },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: 'DH', bats: 'L', age: 34, pa: 359, h: 84, double: 18, triple: 2, hr: 7, bb: 29, so: 36, hbp: 0, sb: 2, cs: 3, sec: 'RF' },
    ],
    bench: [
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'RF', bats: 'R', age: 33, pa: 328, h: 60, double: 14, triple: 1, hr: 16, bb: 44, so: 76, hbp: 2, sb: 6, cs: 2, sec: 'CF', fld: 67, arm: 81 },
      { id: 'teahema01', name: 'Mark Teahen', pos: '3B', bats: 'L', age: 28, pa: 262, h: 63, double: 14, triple: 1, hr: 5, bb: 20, so: 58, hbp: 2, sb: 3, cs: 2, sec: '1B', fld: 63 },
      { id: 'castrra01', name: 'Ramon Castro', pos: 'C', bats: 'R', age: 34, pa: 128, h: 29, double: 4, triple: 0, hr: 7, bb: 10, so: 28, hbp: 0, sb: 0, cs: 0, fld: 76, arm: 71 },
      { id: 'vicieda01', name: 'Dayan Viciedo', pos: '3B', bats: 'R', age: 21, pa: 106, h: 32, double: 7, triple: 0, hr: 5, bb: 2, so: 25, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 43, rk: true },
      { id: 'lillibr01', name: 'Brent Lillibridge', pos: '2B', bats: 'R', age: 26, pa: 101, h: 18, double: 4, triple: 1, hr: 1, bb: 7, so: 30, hbp: 0, sb: 5, cs: 2, sec: 'SS', fld: 56 },
    ],
    reserveBatters: [
      { id: 'morelbr01', name: 'Brent Morel', pos: '3B', bats: 'R', age: 23, pa: 70, h: 15, double: 3, triple: 0, hr: 3, bb: 4, so: 17, hbp: 0, sb: 2, cs: 0, sec: '1B', fld: 53, rk: true },
    ],
    pitchers: [
      { id: 'danksjo01', name: 'John Danks', role: 'SP', throws: 'L', age: 25, g: 32, gs: 32, outs: 639, h: 192, hr: 21, bb: 71, so: 162, hbp: 4, er: 86, w: 15, l: 11, sv: 0, fld: 73 },
      { id: 'buehrma01', name: 'Mark Buehrle', role: 'SP', throws: 'L', age: 31, g: 33, gs: 33, outs: 631, h: 237, hr: 21, bb: 48, so: 108, hbp: 3, er: 96, w: 13, l: 13, sv: 0, fld: 80 },
      { id: 'floydga01', name: 'Gavin Floyd', role: 'SP', throws: 'R', age: 27, g: 31, gs: 31, outs: 562, h: 189, hr: 19, bb: 60, so: 152, hbp: 5, er: 85, w: 10, l: 13, sv: 0, fld: 66 },
      { id: 'garcifr02', name: 'Freddy Garcia', role: 'SP', throws: 'R', age: 33, g: 28, gs: 28, outs: 471, h: 168, hr: 21, bb: 44, so: 94, hbp: 3, er: 81, w: 12, l: 6, sv: 0, fld: 68 },
      { id: 'peavyja01', name: 'Jake Peavy', role: 'SP', throws: 'R', age: 29, g: 17, gs: 17, outs: 321, h: 93, hr: 11, bb: 36, so: 103, hbp: 3, er: 46, w: 7, l: 6, sv: 0, fld: 74 },
      { id: 'jenksbo01', name: 'Bobby Jenks', role: 'CL', throws: 'R', age: 29, g: 55, gs: 0, outs: 158, h: 52, hr: 5, bb: 17, so: 52, hbp: 1, er: 23, w: 1, l: 3, sv: 27, fld: 68 },
      { id: 'penato03', name: 'Tony Pena', role: 'RP', throws: 'R', age: 28, g: 52, gs: 3, outs: 302, h: 112, hr: 10, bb: 38, so: 65, hbp: 2, er: 53, w: 5, l: 3, sv: 0, fld: 82 },
      { id: 'thornma01', name: 'Matt Thornton', role: 'RP', throws: 'L', age: 33, g: 61, gs: 0, outs: 182, h: 44, hr: 4, bb: 18, so: 76, hbp: 2, er: 18, w: 5, l: 4, sv: 8, fld: 68 },
      { id: 'linebsc01', name: 'Scott Linebrink', role: 'RP', throws: 'R', age: 33, g: 52, gs: 0, outs: 172, h: 61, hr: 10, bb: 18, so: 52, hbp: 3, er: 27, w: 3, l: 2, sv: 0, fld: 73 },
      { id: 'putzjj01', name: 'J. J. Putz', role: 'RP', throws: 'R', age: 33, g: 60, gs: 0, outs: 162, h: 43, hr: 3, bb: 21, so: 55, hbp: 1, er: 20, w: 7, l: 5, sv: 3, fld: 62 },
      { id: 'santose01', name: 'Sergio Santos', role: 'RP', throws: 'R', age: 26, g: 56, gs: 0, outs: 155, h: 53, hr: 2, bb: 26, so: 56, hbp: 3, er: 17, w: 2, l: 2, sv: 1, fld: 72, rk: true },
    ],
    reservePitchers: [
      { id: 'willira01', name: 'Randy Williams', role: 'RP', throws: 'L', age: 34, g: 27, gs: 0, outs: 75, h: 33, hr: 2, bb: 21, so: 26, hbp: 4, er: 15, w: 0, l: 1, sv: 0, fld: 61, rk: true },
      { id: 'harrelu01', name: 'Lucas Harrell', role: 'RP', throws: 'R', age: 25, g: 8, gs: 3, outs: 72, h: 34, hr: 2, bb: 17, so: 15, hbp: 0, er: 13, w: 1, l: 0, sv: 0, fld: 71, rk: true },
      { id: 'salech01', name: 'Chris Sale', role: 'RP', throws: 'L', age: 21, g: 21, gs: 0, outs: 70, h: 15, hr: 2, bb: 10, so: 32, hbp: 0, er: 5, w: 2, l: 1, sv: 4, fld: 84, rk: true },
      { id: 'torreca01', name: 'Carlos Torres', role: 'RP', throws: 'R', age: 27, g: 5, gs: 1, outs: 41, h: 19, hr: 2, bb: 9, so: 12, hbp: 1, er: 12, w: 0, l: 1, sv: 0, fld: 70, rk: true },
      { id: 'threeer01', name: 'Erick Threets', role: 'RP', throws: 'L', age: 28, g: 11, gs: 0, outs: 37, h: 9, hr: 0, bb: 4, so: 6, hbp: 1, er: 1, w: 0, l: 0, sv: 0, fld: 62, rk: true },
    ],
  },
  // CLE (CLE 2010)
  {
    franchiseId: 'CLE',
    season: 2010,
    batters: [
      { id: 'marsolo01', name: 'Lou Marson', pos: 'C', bats: 'R', age: 24, pa: 294, h: 53, double: 17, triple: 0, hr: 3, bb: 28, so: 60, hbp: 3, sb: 7, cs: 1, sec: '1B', fld: 70, arm: 79, rk: true },
      { id: 'laporma01', name: 'Matt LaPorta', pos: '1B', bats: 'R', age: 25, pa: 425, h: 87, double: 18, triple: 1, hr: 13, bb: 41, so: 81, hbp: 2, sb: 1, cs: 0, sec: 'LF', fld: 74 },
      { id: 'valbulu01', name: 'Luis Valbuena', pos: '2B', bats: 'L', age: 24, pa: 310, h: 62, double: 16, triple: 1, hr: 5, bb: 24, so: 63, hbp: 2, sb: 1, cs: 2, sec: 'SS', fld: 98 },
      { id: 'peraljh01', name: 'Jhonny Peralta', pos: '3B', bats: 'R', age: 28, pa: 615, h: 141, double: 33, triple: 2, hr: 15, bb: 50, so: 114, hbp: 2, sb: 1, cs: 1, sec: 'SS', fld: 90 },
      { id: 'cabreas01', name: 'Asdrubal Cabrera', pos: 'SS', bats: 'S', age: 24, pa: 425, h: 108, double: 23, triple: 2, hr: 4, bb: 31, so: 65, hbp: 3, sb: 8, cs: 4, sec: '2B', fld: 77 },
      { id: 'kearnau01', name: 'Austin Kearns', pos: 'LF', bats: 'R', age: 30, pa: 461, h: 97, double: 18, triple: 1, hr: 9, bb: 51, so: 109, hbp: 10, sb: 3, cs: 1, sec: 'RF', fld: 78, arm: 61 },
      { id: 'crowetr01', name: 'Trevor Crowe', pos: 'CF', bats: 'S', age: 26, pa: 479, h: 109, double: 23, triple: 4, hr: 2, bb: 28, so: 77, hbp: 3, sb: 19, cs: 5, sec: 'LF', fld: 69, arm: 77 },
      { id: 'choosh01', name: 'Shin-Soo Choo', pos: 'RF', bats: 'L', age: 27, pa: 646, h: 166, double: 35, triple: 4, hr: 21, bb: 79, so: 129, hbp: 13, sb: 20, cs: 5, sec: 'LF', fld: 67, arm: 78 },
      { id: 'hafnetr01', name: 'Travis Hafner', pos: 'DH', bats: 'L', age: 33, pa: 462, h: 107, double: 26, triple: 0, hr: 15, bb: 51, so: 91, hbp: 9, sb: 1, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'nixja01', name: 'Jayson Nix', pos: '3B', bats: 'R', age: 27, pa: 363, h: 72, double: 14, triple: 0, hr: 14, bb: 26, so: 85, hbp: 6, sb: 5, cs: 2, sec: '2B', fld: 59 },
      { id: 'brantmi02', name: 'Michael Brantley', pos: 'CF', bats: 'L', age: 23, pa: 325, h: 77, double: 9, triple: 2, hr: 2, bb: 22, so: 41, hbp: 0, sb: 10, cs: 4, sec: 'LF', fld: 59, arm: 57, rk: true },
      { id: 'donalja01', name: 'Jason Donald', pos: 'SS', bats: 'R', age: 25, pa: 325, h: 75, double: 19, triple: 3, hr: 4, bb: 22, so: 70, hbp: 3, sb: 5, cs: 1, sec: '2B', fld: 72, rk: true },
      { id: 'duncash01', name: 'Shelley Duncan', pos: 'LF', bats: 'R', age: 30, pa: 259, h: 52, double: 10, triple: 0, hr: 10, bb: 25, so: 75, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 77, arm: 95 },
      { id: 'santaca01', name: 'Carlos Santana', pos: 'C', bats: 'S', age: 24, pa: 192, h: 39, double: 13, triple: 0, hr: 6, bb: 37, so: 29, hbp: 1, sb: 3, cs: 0, sec: '1B', fld: 62, arm: 77, rk: true },
    ],
    reserveBatters: [
      { id: 'martean01', name: 'Andy Marte', pos: '3B', bats: 'R', age: 26, pa: 188, h: 39, double: 7, triple: 1, hr: 5, bb: 15, so: 35, hbp: 0, sb: 0, cs: 2, sec: '1B', fld: 64 },
      { id: 'sizemgr01', name: 'Grady Sizemore', pos: 'CF', bats: 'L', age: 27, pa: 140, h: 30, double: 6, triple: 1, hr: 4, bb: 16, so: 27, hbp: 2, sb: 5, cs: 2, sec: 'LF', fld: 50, arm: 57 },
      { id: 'grudzma01', name: 'Mark Grudzielanek', pos: '2B', bats: 'R', age: 40, pa: 119, h: 31, double: 4, triple: 0, hr: 0, bb: 7, so: 12, hbp: 1, sb: 1, cs: 0, sec: 'SS', fld: 95 },
      { id: 'hernaan01', name: 'Anderson Hernandez', pos: 'SS', bats: 'S', age: 27, pa: 119, h: 27, double: 5, triple: 1, hr: 1, bb: 10, so: 18, hbp: 0, sb: 2, cs: 1, sec: '2B', fld: 99 },
      { id: 'brownjo05', name: 'Jordan Brown', pos: '1B', bats: 'L', age: 26, pa: 92, h: 20, double: 7, triple: 0, hr: 0, bb: 4, so: 10, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'carmofa01', name: 'Roberto Hernandez', role: 'SP', throws: 'R', age: 29, g: 33, gs: 33, outs: 631, h: 210, hr: 18, bb: 86, so: 119, hbp: 11, er: 104, w: 13, l: 14, sv: 0, fld: 86 },
      { id: 'westbja01', name: 'Jake Westbrook', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 608, h: 203, hr: 21, bb: 67, so: 127, hbp: 8, er: 94, w: 10, l: 11, sv: 0, fld: 89 },
      { id: 'masteju01', name: 'Justin Masterson', role: 'SP', throws: 'R', age: 25, g: 34, gs: 29, outs: 540, h: 187, hr: 16, bb: 78, so: 149, hbp: 12, er: 91, w: 6, l: 13, sv: 0, fld: 85 },
      { id: 'talbomi01', name: 'Mitch Talbot', role: 'SP', throws: 'R', age: 26, g: 28, gs: 28, outs: 478, h: 170, hr: 14, bb: 71, so: 87, hbp: 8, er: 80, w: 10, l: 13, sv: 0, fld: 70, rk: true },
      { id: 'huffda01', name: 'David Huff', role: 'SP', throws: 'L', age: 25, g: 15, gs: 15, outs: 239, h: 102, hr: 12, bb: 30, so: 39, hbp: 2, er: 53, w: 2, l: 11, sv: 0, fld: 65 },
      { id: 'perezch01', name: 'Chris Perez', role: 'CL', throws: 'R', age: 24, g: 63, gs: 0, outs: 189, h: 42, hr: 6, bb: 29, so: 65, hbp: 5, er: 19, w: 2, l: 2, sv: 23, fld: 64 },
      { id: 'sippto01', name: 'Tony Sipp', role: 'RP', throws: 'L', age: 26, g: 70, gs: 0, outs: 189, h: 47, hr: 11, bb: 39, so: 72, hbp: 1, er: 27, w: 2, l: 2, sv: 1, fld: 65, rk: true },
      { id: 'perezra01', name: 'Rafael Perez', role: 'RP', throws: 'L', age: 28, g: 70, gs: 0, outs: 183, h: 71, hr: 5, bb: 25, so: 44, hbp: 1, er: 30, w: 6, l: 1, sv: 0, fld: 80 },
      { id: 'laffeaa01', name: 'Aaron Laffey', role: 'RP', throws: 'L', age: 25, g: 29, gs: 5, outs: 167, h: 63, hr: 3, bb: 25, so: 27, hbp: 2, er: 28, w: 2, l: 3, sv: 0, fld: 83 },
      { id: 'ambrihe01', name: 'Hector Ambriz', role: 'RP', throws: 'R', age: 26, g: 34, gs: 0, outs: 145, h: 68, hr: 10, bb: 17, so: 37, hbp: 1, er: 30, w: 0, l: 2, sv: 0, fld: 83, rk: true },
      { id: 'carraca01', name: 'Carlos Carrasco', role: 'RP', throws: 'R', age: 23, g: 7, gs: 7, outs: 134, h: 53, hr: 7, bb: 15, so: 32, hbp: 1, er: 24, w: 2, l: 2, sv: 0, fld: 82, rk: true },
    ],
    reservePitchers: [
      { id: 'tomlijo01', name: 'Josh Tomlin', role: 'SP', throws: 'R', age: 25, g: 12, gs: 12, outs: 219, h: 72, hr: 10, bb: 19, so: 43, hbp: 3, er: 37, w: 6, l: 4, sv: 0, fld: 70, rk: true },
      { id: 'gomezje01', name: 'Jeanmar Gomez', role: 'SP', throws: 'R', age: 22, g: 11, gs: 11, outs: 173, h: 73, hr: 7, bb: 22, so: 34, hbp: 2, er: 30, w: 4, l: 5, sv: 0, fld: 70, rk: true },
      { id: 'herrmfr01', name: 'Frank Herrmann', role: 'RP', throws: 'R', age: 26, g: 40, gs: 0, outs: 134, h: 48, hr: 6, bb: 9, so: 24, hbp: 2, er: 20, w: 0, l: 1, sv: 1, fld: 83, rk: true },
      { id: 'smithjo05', name: 'Joe Smith', role: 'RP', throws: 'R', age: 26, g: 53, gs: 0, outs: 120, h: 32, hr: 4, bb: 21, so: 33, hbp: 1, er: 16, w: 2, l: 2, sv: 0, fld: 58 },
      { id: 'lewisje01', name: 'Jensen Lewis', role: 'RP', throws: 'R', age: 26, g: 37, gs: 0, outs: 109, h: 32, hr: 4, bb: 16, so: 30, hbp: 1, er: 15, w: 4, l: 2, sv: 0, fld: 72 },
    ],
  },
  // DET (DET 2010)
  {
    franchiseId: 'DET',
    season: 2010,
    batters: [
      { id: 'avilaal01', name: 'Alex Avila', pos: 'C', bats: 'L', age: 23, pa: 333, h: 68, double: 13, triple: 0, hr: 9, bb: 37, so: 73, hbp: 2, sb: 2, cs: 2, sec: '1B', fld: 70, arm: 74, rk: true },
      { id: 'cabremi01', name: 'Miguel Cabrera', pos: '1B', bats: 'R', age: 27, pa: 648, h: 181, double: 39, triple: 1, hr: 35, bb: 74, so: 101, hbp: 4, sb: 4, cs: 2, sec: '3B', fld: 64 },
      { id: 'guillca01', name: 'Carlos Guillen', pos: '2B', bats: 'S', age: 34, pa: 275, h: 65, double: 14, triple: 2, hr: 7, bb: 28, so: 42, hbp: 1, sb: 2, cs: 2, sec: 'SS', fld: 81 },
      { id: 'ingebr01', name: 'Brandon Inge', pos: '3B', bats: 'R', age: 33, pa: 580, h: 120, double: 22, triple: 4, hr: 18, bb: 53, so: 142, hbp: 10, sb: 3, cs: 4, sec: '1B', fld: 84 },
      { id: 'santira01', name: 'Ramon Santiago', pos: 'SS', bats: 'S', age: 30, pa: 367, h: 85, double: 9, triple: 2, hr: 5, bb: 29, so: 59, hbp: 7, sb: 2, cs: 2, sec: '2B', fld: 87 },
      { id: 'raburry01', name: 'Ryan Raburn', pos: 'LF', bats: 'R', age: 29, pa: 410, h: 103, double: 22, triple: 2, hr: 17, bb: 30, so: 91, hbp: 6, sb: 4, cs: 3, sec: 'RF', fld: 71, arm: 70 },
      { id: 'jacksau01', name: 'Austin Jackson', pos: 'CF', bats: 'R', age: 23, pa: 675, h: 181, double: 34, triple: 10, hr: 4, bb: 47, so: 170, hbp: 4, sb: 27, cs: 6, sec: 'LF', fld: 77, arm: 72, rk: true },
      { id: 'boescbr01', name: 'Brennan Boesch', pos: 'RF', bats: 'L', age: 25, pa: 512, h: 119, double: 26, triple: 3, hr: 14, bb: 40, so: 99, hbp: 5, sb: 7, cs: 1, sec: 'LF', fld: 63, arm: 74, rk: true },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'DH', bats: 'L', age: 36, pa: 613, h: 151, double: 34, triple: 4, hr: 15, bb: 68, so: 90, hbp: 2, sb: 14, cs: 2, sec: 'LF' },
    ],
    bench: [
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 36, pa: 365, h: 101, double: 17, triple: 1, hr: 10, bb: 36, so: 42, hbp: 0, sb: 1, cs: 1, sec: 'CF', fld: 68, arm: 78 },
      { id: 'lairdge01', name: 'Gerald Laird', pos: 'C', bats: 'R', age: 30, pa: 299, h: 60, double: 14, triple: 1, hr: 4, bb: 21, so: 50, hbp: 5, sb: 3, cs: 1, sec: '1B', fld: 69, arm: 76 },
      { id: 'kellydo01', name: 'Don Kelly', pos: 'LF', bats: 'L', age: 30, pa: 251, h: 58, double: 5, triple: 1, hr: 8, bb: 9, so: 42, hbp: 2, sb: 3, cs: 0, sec: '1B', fld: 90, arm: 81, rk: true },
      { id: 'rhymewi01', name: 'Will Rhymes', pos: '2B', bats: 'L', age: 27, pa: 213, h: 58, double: 12, triple: 3, hr: 1, bb: 14, so: 16, hbp: 0, sb: 0, cs: 3, sec: 'SS', fld: 84, rk: true },
      { id: 'sizemsc01', name: 'Scott Sizemore', pos: '2B', bats: 'R', age: 25, pa: 163, h: 32, double: 7, triple: 0, hr: 3, bb: 15, so: 40, hbp: 0, sb: 0, cs: 0, sec: 'SS', fld: 42, rk: true },
    ],
    reserveBatters: [
      { id: 'worthda01', name: 'Danny Worth', pos: 'SS', bats: 'R', age: 24, pa: 115, h: 27, double: 5, triple: 0, hr: 2, bb: 6, so: 13, hbp: 0, sb: 1, cs: 2, sec: '2B', fld: 73, rk: true },
      { id: 'wellsca01', name: 'Casper Wells', pos: 'RF', bats: 'R', age: 25, pa: 99, h: 30, double: 6, triple: 1, hr: 4, bb: 6, so: 19, hbp: 0, sb: 0, cs: 1, sec: 'LF', fld: 54, arm: 93, rk: true },
      { id: 'everead01', name: 'Adam Everett', pos: 'SS', bats: 'R', age: 33, pa: 89, h: 18, double: 5, triple: 0, hr: 1, bb: 5, so: 14, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 91 },
    ],
    pitchers: [
      { id: 'verlaju01', name: 'Justin Verlander', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 673, h: 197, hr: 16, bb: 70, so: 223, hbp: 7, er: 89, w: 18, l: 9, sv: 0, fld: 74 },
      { id: 'scherma01', name: 'Max Scherzer', role: 'SP', throws: 'R', age: 25, g: 31, gs: 31, outs: 587, h: 178, hr: 21, bb: 70, so: 190, hbp: 9, er: 79, w: 12, l: 11, sv: 0, fld: 60 },
      { id: 'bondeje01', name: 'Jeremy Bonderman', role: 'SP', throws: 'R', age: 27, g: 30, gs: 29, outs: 513, h: 187, hr: 26, bb: 65, so: 109, hbp: 10, er: 103, w: 8, l: 10, sv: 0, fld: 54 },
      { id: 'porceri01', name: 'Rick Porcello', role: 'SP', throws: 'R', age: 21, g: 27, gs: 27, outs: 488, h: 181, hr: 20, bb: 43, so: 85, hbp: 5, er: 82, w: 10, l: 12, sv: 0, fld: 63 },
      { id: 'galarar01', name: 'Armando Galarraga', role: 'SP', throws: 'R', age: 28, g: 25, gs: 24, outs: 433, h: 142, hr: 22, bb: 55, so: 85, hbp: 5, er: 75, w: 4, l: 9, sv: 0, fld: 50 },
      { id: 'valvejo01', name: 'Jose Valverde', role: 'CL', throws: 'R', age: 32, g: 60, gs: 0, outs: 189, h: 45, hr: 6, bb: 28, so: 66, hbp: 3, er: 20, w: 2, l: 4, sv: 26, fld: 81 },
      { id: 'thomabr01', name: 'Brad Thomas', role: 'RP', throws: 'L', age: 32, g: 49, gs: 2, outs: 208, h: 77, hr: 4, bb: 29, so: 30, hbp: 4, er: 30, w: 6, l: 2, sv: 0, fld: 85, rk: true },
      { id: 'bonined01', name: 'Eddie Bonine', role: 'RP', throws: 'R', age: 29, g: 47, gs: 1, outs: 204, h: 84, hr: 9, bb: 22, so: 28, hbp: 3, er: 35, w: 4, l: 1, sv: 0, fld: 56 },
      { id: 'cokeph01', name: 'Phil Coke', role: 'RP', throws: 'L', age: 27, g: 74, gs: 1, outs: 194, h: 61, hr: 5, bb: 25, so: 56, hbp: 3, er: 29, w: 7, l: 5, sv: 2, fld: 56 },
      { id: 'perryry01', name: 'Ryan Perry', role: 'RP', throws: 'R', age: 23, g: 60, gs: 0, outs: 188, h: 55, hr: 6, bb: 29, so: 50, hbp: 3, er: 25, w: 3, l: 5, sv: 2, fld: 64 },
      { id: 'zumayjo01', name: 'Joel Zumaya', role: 'RP', throws: 'R', age: 25, g: 31, gs: 0, outs: 115, h: 33, hr: 3, bb: 18, so: 33, hbp: 0, er: 13, w: 2, l: 1, sv: 1, fld: 79 },
    ],
    reservePitchers: [
      { id: 'willido03', name: 'Dontrelle Willis', role: 'SP', throws: 'L', age: 28, g: 15, gs: 13, outs: 197, h: 70, hr: 7, bb: 59, so: 44, hbp: 4, er: 46, w: 2, l: 3, sv: 0, fld: 61 },
      { id: 'weinhro01', name: 'Robbie Weinhardt', role: 'RP', throws: 'R', age: 24, g: 28, gs: 0, outs: 88, h: 40, hr: 2, bb: 8, so: 21, hbp: 3, er: 20, w: 2, l: 2, sv: 0, fld: 88, rk: true },
      { id: 'gonzaen01', name: 'Enrique Gonzalez', role: 'RP', throws: 'R', age: 27, g: 18, gs: 0, outs: 78, h: 22, hr: 4, bb: 17, so: 12, hbp: 0, er: 12, w: 0, l: 1, sv: 0, fld: 83 },
      { id: 'nifu01', name: 'Fu-Te Ni', role: 'RP', throws: 'L', age: 27, g: 22, gs: 0, outs: 69, h: 24, hr: 2, bb: 15, so: 21, hbp: 2, er: 13, w: 0, l: 1, sv: 0, fld: 70, rk: true },
      { id: 'olivean01', name: 'Andy Oliver', role: 'RP', throws: 'L', age: 22, g: 5, gs: 5, outs: 66, h: 26, hr: 3, bb: 13, so: 18, hbp: 2, er: 18, w: 0, l: 4, sv: 0, fld: 64, rk: true },
    ],
  },
  // KCR (KCA 2010)
  {
    franchiseId: 'KCR',
    season: 2010,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 36, pa: 490, h: 107, double: 19, triple: 1, hr: 1, bb: 40, so: 47, hbp: 10, sb: 9, cs: 4, fld: 64, arm: 71 },
      { id: 'butlebi03', name: 'Billy Butler', pos: '1B', bats: 'R', age: 24, pa: 678, h: 186, double: 46, triple: 0, hr: 17, bb: 63, so: 87, hbp: 3, sb: 0, cs: 0, sec: '3B', fld: 76 },
      { id: 'avilemi01', name: 'Mike Aviles', pos: '2B', bats: 'R', age: 29, pa: 448, h: 125, double: 18, triple: 3, hr: 8, bb: 19, so: 56, hbp: 1, sb: 11, cs: 4, sec: 'SS', fld: 78 },
      { id: 'callaal01', name: 'Alberto Callaspo', pos: '3B', bats: 'S', age: 27, pa: 601, h: 156, double: 31, triple: 5, hr: 9, bb: 39, so: 44, hbp: 1, sb: 4, cs: 2, sec: '2B', fld: 74 },
      { id: 'betanyu01', name: 'Yuniesky Betancourt', pos: 'SS', bats: 'R', age: 28, pa: 588, h: 143, double: 28, triple: 4, hr: 12, bb: 22, so: 56, hbp: 1, sb: 3, cs: 3, sec: '2B', fld: 75 },
      { id: 'podsesc01', name: 'Scott Podsednik', pos: 'LF', bats: 'L', age: 34, pa: 595, h: 160, double: 19, triple: 6, hr: 6, bb: 41, so: 81, hbp: 1, sb: 34, cs: 14, sec: 'CF', fld: 78, arm: 57 },
      { id: 'blancgr01', name: 'Gregor Blanco', pos: 'CF', bats: 'L', age: 26, pa: 269, h: 61, double: 8, triple: 3, hr: 1, bb: 32, so: 51, hbp: 1, sb: 9, cs: 3, sec: 'LF', fld: 62, arm: 72 },
      { id: 'dejesda01', name: 'David DeJesus', pos: 'RF', bats: 'L', age: 30, pa: 394, h: 106, double: 20, triple: 4, hr: 7, bb: 33, so: 50, hbp: 4, sb: 4, cs: 5, sec: 'CF', fld: 80, arm: 68 },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'DH', bats: 'R', age: 34, pa: 576, h: 135, double: 24, triple: 1, hr: 18, bb: 31, so: 105, hbp: 13, sb: 1, cs: 0, sec: 'RF' },
    ],
    bench: [
      { id: 'maiermi01', name: 'Mitch Maier', pos: 'CF', bats: 'L', age: 28, pa: 421, h: 95, double: 15, triple: 5, hr: 4, bb: 41, so: 73, hbp: 2, sb: 5, cs: 2, sec: 'RF', fld: 65, arm: 66 },
      { id: 'betemwi01', name: 'Wilson Betemit', pos: '3B', bats: 'S', age: 28, pa: 315, h: 80, double: 21, triple: 0, hr: 11, bb: 31, so: 77, hbp: 1, sb: 0, cs: 0, sec: 'SS', fld: 50 },
      { id: 'gordoal01', name: 'Alex Gordon', pos: 'LF', bats: 'L', age: 26, pa: 281, h: 56, double: 12, triple: 0, hr: 8, bb: 33, so: 61, hbp: 3, sb: 3, cs: 3, sec: '1B', fld: 85, arm: 65 },
      { id: 'getzch01', name: 'Chris Getz', pos: '2B', bats: 'L', age: 26, pa: 248, h: 56, double: 10, triple: 1, hr: 1, bb: 18, so: 30, hbp: 3, sb: 15, cs: 2, sec: 'SS', fld: 68 },
      { id: 'kaaihki01', name: 'Kila Ka\'aihue', pos: '1B', bats: 'L', age: 26, pa: 206, h: 39, double: 6, triple: 1, hr: 8, bb: 24, so: 38, hbp: 0, sb: 0, cs: 1, sec: '3B', fld: 68, rk: true },
    ],
    reserveBatters: [
      { id: 'bloomwi01', name: 'Willie Bloomquist', pos: 'RF', bats: 'R', age: 32, pa: 199, h: 49, double: 6, triple: 2, hr: 2, bb: 12, so: 30, hbp: 0, sb: 10, cs: 3, sec: 'CF', fld: 74, arm: 76 },
      { id: 'penabr01', name: 'Brayan Pena', pos: 'C', bats: 'S', age: 28, pa: 174, h: 41, double: 10, triple: 0, hr: 3, bb: 12, so: 23, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 72, arm: 72 },
      { id: 'dysonja01', name: 'Jarrod Dyson', pos: 'CF', bats: 'L', age: 25, pa: 65, h: 12, double: 4, triple: 2, hr: 1, bb: 6, so: 16, hbp: 0, sb: 9, cs: 1, sec: 'LF', rk: true },
      { id: 'milleja04', name: 'Jai Miller', pos: 'RF', bats: 'R', age: 25, pa: 60, h: 13, double: 3, triple: 0, hr: 1, bb: 4, so: 23, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 70, arm: 54, rk: true },
      { id: 'fieldjo02', name: 'Josh Fields', pos: '3B', bats: 'R', age: 27, pa: 50, h: 11, double: 1, triple: 0, hr: 2, bb: 4, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'greinza01', name: 'Zack Greinke', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 660, h: 211, hr: 16, bb: 55, so: 204, hbp: 6, er: 83, w: 10, l: 14, sv: 0, fld: 76 },
      { id: 'davieky01', name: 'Kyle Davies', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 551, h: 199, hr: 21, bb: 84, so: 126, hbp: 3, er: 106, w: 8, l: 12, sv: 0, fld: 70 },
      { id: 'chenbr01', name: 'Bruce Chen', role: 'SP', throws: 'L', age: 33, g: 33, gs: 23, outs: 421, h: 141, hr: 19, bb: 56, so: 97, hbp: 4, er: 70, w: 12, l: 7, sv: 1, fld: 72 },
      { id: 'bannibr01', name: 'Brian Bannister', role: 'SP', throws: 'R', age: 29, g: 24, gs: 23, outs: 383, h: 151, hr: 19, bb: 46, so: 81, hbp: 4, er: 82, w: 7, l: 12, sv: 0, fld: 66 },
      { id: 'hochelu01', name: 'Luke Hochevar', role: 'SP', throws: 'R', age: 26, g: 18, gs: 17, outs: 309, h: 114, hr: 12, bb: 35, so: 72, hbp: 5, er: 64, w: 6, l: 6, sv: 0, fld: 79 },
      { id: 'soriajo01', name: 'Joakim Soria', role: 'CL', throws: 'R', age: 26, g: 66, gs: 0, outs: 197, h: 51, hr: 5, bb: 18, so: 74, hbp: 3, er: 14, w: 1, l: 2, sv: 43, fld: 65 },
      { id: 'farnsky01', name: 'Kyle Farnsworth', role: 'RP', throws: 'R', age: 34, g: 60, gs: 0, outs: 194, h: 61, hr: 6, bb: 20, so: 62, hbp: 3, er: 27, w: 3, l: 2, sv: 0, fld: 76 },
      { id: 'mechegi01', name: 'Gil Meche', role: 'RP', throws: 'R', age: 31, g: 20, gs: 9, outs: 185, h: 67, hr: 8, bb: 30, so: 49, hbp: 1, er: 35, w: 0, l: 5, sv: 0, fld: 71 },
      { id: 'texeika01', name: 'Kanekoa Texeira', role: 'RP', throws: 'R', age: 24, g: 43, gs: 0, outs: 184, h: 73, hr: 3, bb: 25, so: 33, hbp: 3, er: 33, w: 1, l: 1, sv: 0, fld: 71, rk: true },
      { id: 'tejedro01', name: 'Rob Tejeda', role: 'RP', throws: 'R', age: 28, g: 54, gs: 0, outs: 183, h: 45, hr: 4, bb: 33, so: 63, hbp: 1, er: 25, w: 3, l: 5, sv: 0, fld: 73 },
      { id: 'hughedu01', name: 'Dusty Hughes', role: 'RP', throws: 'L', age: 28, g: 57, gs: 0, outs: 169, h: 58, hr: 4, bb: 25, so: 38, hbp: 5, er: 25, w: 1, l: 3, sv: 0, fld: 71, rk: true },
    ],
    reservePitchers: [
      { id: 'osullse01', name: 'Sean O\'Sullivan', role: 'SP', throws: 'R', age: 22, g: 19, gs: 14, outs: 251, h: 92, hr: 16, bb: 29, so: 44, hbp: 1, er: 52, w: 4, l: 6, sv: 0, fld: 79 },
      { id: 'woodbl01', name: 'Blake Wood', role: 'RP', throws: 'R', age: 24, g: 51, gs: 0, outs: 149, h: 54, hr: 6, bb: 22, so: 31, hbp: 1, er: 28, w: 1, l: 3, sv: 0, fld: 55, rk: true },
      { id: 'bullibr01', name: 'Bryan Bullington', role: 'RP', throws: 'R', age: 29, g: 13, gs: 5, outs: 128, h: 50, hr: 6, bb: 18, so: 30, hbp: 4, er: 27, w: 1, l: 4, sv: 0, fld: 65, rk: true },
      { id: 'martevi01', name: 'Victor Marte', role: 'RP', throws: 'R', age: 29, g: 22, gs: 0, outs: 83, h: 36, hr: 7, bb: 18, so: 18, hbp: 2, er: 29, w: 3, l: 0, sv: 0, fld: 72, rk: true },
      { id: 'lerewan01', name: 'Anthony Lerew', role: 'RP', throws: 'R', age: 27, g: 6, gs: 6, outs: 79, h: 33, hr: 9, bb: 11, so: 17, hbp: 2, er: 22, w: 1, l: 4, sv: 0, fld: 72, rk: true },
    ],
  },
  // MIN (MIN 2010)
  {
    franchiseId: 'MIN',
    season: 2010,
    batters: [
      { id: 'mauerjo01', name: 'Joe Mauer', pos: 'C', bats: 'L', age: 27, pa: 584, h: 172, double: 36, triple: 1, hr: 15, bb: 70, so: 54, hbp: 2, sb: 2, cs: 2, sec: '1B', fld: 76, arm: 69 },
      { id: 'cuddymi01', name: 'Michael Cuddyer', pos: '1B', bats: 'R', age: 31, pa: 675, h: 165, double: 36, triple: 6, hr: 20, bb: 57, so: 104, hbp: 5, sb: 7, cs: 2, sec: '3B', fld: 65 },
      { id: 'hudsoor01', name: 'Orlando Hudson', pos: '2B', bats: 'S', age: 32, pa: 559, h: 138, double: 28, triple: 5, hr: 7, bb: 52, so: 86, hbp: 4, sb: 8, cs: 2, sec: 'SS', fld: 86 },
      { id: 'valenda01', name: 'Danny Valencia', pos: '3B', bats: 'R', age: 25, pa: 322, h: 93, double: 18, triple: 1, hr: 7, bb: 20, so: 46, hbp: 0, sb: 2, cs: 0, sec: '1B', fld: 81, rk: true },
      { id: 'hardyjj01', name: 'J. J. Hardy', pos: 'SS', bats: 'R', age: 27, pa: 375, h: 87, double: 17, triple: 2, hr: 9, bb: 31, so: 60, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 77 },
      { id: 'youngde03', name: 'Delmon Young', pos: 'LF', bats: 'R', age: 24, pa: 613, h: 168, double: 37, triple: 2, hr: 18, bb: 27, so: 99, hbp: 6, sb: 6, cs: 5, sec: 'RF', fld: 62, arm: 76 },
      { id: 'spande01', name: 'Denard Span', pos: 'CF', bats: 'L', age: 26, pa: 705, h: 175, double: 22, triple: 10, hr: 6, bb: 67, so: 84, hbp: 7, sb: 26, cs: 7, sec: 'RF', fld: 78, arm: 65 },
      { id: 'kubelja01', name: 'Jason Kubel', pos: 'RF', bats: 'L', age: 28, pa: 582, h: 140, double: 27, triple: 3, hr: 24, bb: 56, so: 111, hbp: 3, sb: 0, cs: 1, sec: 'LF', fld: 60, arm: 73 },
      { id: 'morneju01', name: 'Justin Morneau', pos: 'DH', bats: 'L', age: 29, pa: 348, h: 91, double: 22, triple: 1, hr: 16, bb: 44, so: 53, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 82 },
    ],
    bench: [
      { id: 'thomeji01', name: 'Jim Thome', pos: 'DH', bats: 'L', age: 39, pa: 340, h: 73, double: 14, triple: 1, hr: 21, bb: 56, so: 87, hbp: 1, sb: 0, cs: 0, sec: '1B' },
      { id: 'puntoni01', name: 'Nick Punto', pos: '3B', bats: 'S', age: 32, pa: 288, h: 60, double: 11, triple: 1, hr: 1, bb: 32, so: 47, hbp: 1, sb: 9, cs: 2, sec: 'SS', fld: 100 },
      { id: 'casilal01', name: 'Alexi Casilla', pos: 'SS', bats: 'S', age: 25, pa: 170, h: 38, double: 6, triple: 2, hr: 1, bb: 13, so: 20, hbp: 1, sb: 5, cs: 1, sec: '2B', fld: 77 },
      { id: 'buterdr01', name: 'Drew Butera', pos: 'C', bats: 'R', age: 26, pa: 155, h: 28, double: 6, triple: 1, hr: 2, bb: 4, so: 25, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 60, arm: 84, rk: true },
      { id: 'repkoja01', name: 'Jason Repko', pos: 'RF', bats: 'R', age: 29, pa: 146, h: 28, double: 6, triple: 0, hr: 3, bb: 13, so: 39, hbp: 5, sb: 4, cs: 2, sec: 'CF', fld: 100, arm: 89 },
    ],
    reserveBatters: [
      { id: 'harribr01', name: 'Brendan Harris', pos: '3B', bats: 'R', age: 29, pa: 120, h: 26, double: 6, triple: 0, hr: 2, bb: 8, so: 22, hbp: 1, sb: 0, cs: 0, sec: 'SS', fld: 75 },
      { id: 'tolbema01', name: 'Matt Tolbert', pos: '2B', bats: 'S', age: 28, pa: 100, h: 21, double: 4, triple: 2, hr: 1, bb: 9, so: 17, hbp: 0, sb: 2, cs: 1, sec: '3B' },
      { id: 'moraljo02', name: 'Jose Morales', pos: 'C', bats: 'S', age: 27, pa: 44, h: 10, double: 2, triple: 0, hr: 0, bb: 5, so: 9, hbp: 0, sb: 0, cs: 0, sec: '1B' },
      { id: 'plouftr01', name: 'Trevor Plouffe', pos: 'DH', bats: 'R', age: 24, pa: 44, h: 6, double: 1, triple: 0, hr: 2, bb: 0, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'pavanca01', name: 'Carl Pavano', role: 'SP', throws: 'R', age: 34, g: 32, gs: 32, outs: 663, h: 236, hr: 26, bb: 39, so: 131, hbp: 7, er: 104, w: 17, l: 11, sv: 0, fld: 75 },
      { id: 'liriafr01', name: 'Francisco Liriano', role: 'SP', throws: 'L', age: 26, g: 31, gs: 31, outs: 575, h: 187, hr: 15, bb: 68, so: 186, hbp: 9, er: 89, w: 14, l: 10, sv: 0, fld: 63 },
      { id: 'bakersc02', name: 'Scott Baker', role: 'SP', throws: 'R', age: 28, g: 29, gs: 29, outs: 511, h: 177, hr: 23, bb: 43, so: 146, hbp: 5, er: 83, w: 12, l: 9, sv: 0, fld: 66 },
      { id: 'blackni01', name: 'Nick Blackburn', role: 'SP', throws: 'R', age: 28, g: 28, gs: 26, outs: 483, h: 193, hr: 22, bb: 36, so: 74, hbp: 4, er: 84, w: 10, l: 12, sv: 0, fld: 74 },
      { id: 'sloweke01', name: 'Kevin Slowey', role: 'SP', throws: 'R', age: 26, g: 30, gs: 28, outs: 467, h: 174, hr: 22, bb: 27, so: 119, hbp: 5, er: 77, w: 13, l: 6, sv: 0, fld: 60 },
      { id: 'rauchjo01', name: 'Jon Rauch', role: 'CL', throws: 'R', age: 31, g: 59, gs: 0, outs: 173, h: 59, hr: 5, bb: 16, so: 45, hbp: 1, er: 22, w: 3, l: 1, sv: 21, fld: 83 },
      { id: 'guerrma02', name: 'Matt Guerrier', role: 'RP', throws: 'R', age: 31, g: 74, gs: 0, outs: 213, h: 59, hr: 8, bb: 22, so: 44, hbp: 3, er: 25, w: 5, l: 7, sv: 1, fld: 67 },
      { id: 'crainje01', name: 'Jesse Crain', role: 'RP', throws: 'R', age: 28, g: 71, gs: 0, outs: 204, h: 56, hr: 5, bb: 28, so: 57, hbp: 2, er: 26, w: 1, l: 1, sv: 1, fld: 80 },
      { id: 'burneal01', name: 'Alex Burnett', role: 'RP', throws: 'R', age: 22, g: 41, gs: 0, outs: 143, h: 52, hr: 6, bb: 23, so: 37, hbp: 2, er: 28, w: 2, l: 2, sv: 0, fld: 69, rk: true },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 39, g: 41, gs: 0, outs: 102, h: 34, hr: 5, bb: 12, so: 25, hbp: 1, er: 13, w: 1, l: 1, sv: 0, fld: 85 },
      { id: 'mijarjo01', name: 'Jose Mijares', role: 'RP', throws: 'L', age: 25, g: 47, gs: 0, outs: 98, h: 30, hr: 4, bb: 11, so: 29, hbp: 1, er: 10, w: 1, l: 1, sv: 0, fld: 75 },
    ],
    reservePitchers: [
      { id: 'duensbr01', name: 'Brian Duensing', role: 'SP', throws: 'L', age: 27, g: 53, gs: 13, outs: 392, h: 123, hr: 11, bb: 38, so: 78, hbp: 3, er: 42, w: 10, l: 3, sv: 0, fld: 64 },
      { id: 'manshje01', name: 'Jeff Manship', role: 'RP', throws: 'R', age: 25, g: 13, gs: 1, outs: 87, h: 34, hr: 3, bb: 9, so: 20, hbp: 0, er: 17, w: 2, l: 1, sv: 0, fld: 70, rk: true },
      { id: 'perkigl01', name: 'Glen Perkins', role: 'RP', throws: 'L', age: 27, g: 13, gs: 1, outs: 65, h: 28, hr: 3, bb: 6, so: 11, hbp: 1, er: 13, w: 1, l: 1, sv: 0, fld: 66 },
    ],
  },
  // HOU (HOU 2010)
  {
    franchiseId: 'HOU',
    season: 2010,
    batters: [
      { id: 'quinthu01', name: 'Humberto Quintero', pos: 'C', bats: 'R', age: 30, pa: 276, h: 61, double: 11, triple: 0, hr: 5, bb: 9, so: 60, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 77 },
      { id: 'berkmla01', name: 'Lance Berkman', pos: '1B', bats: 'S', age: 34, pa: 481, h: 108, double: 26, triple: 1, hr: 18, bb: 78, so: 83, hbp: 1, sb: 6, cs: 3, sec: 'LF', fld: 83 },
      { id: 'keppije01', name: 'Jeff Keppinger', pos: '2B', bats: 'R', age: 30, pa: 575, h: 142, double: 30, triple: 2, hr: 7, bb: 47, so: 39, hbp: 2, sb: 3, cs: 2, sec: 'SS', fld: 70 },
      { id: 'felizpe01', name: 'Pedro Feliz', pos: '3B', bats: 'R', age: 35, pa: 429, h: 97, double: 16, triple: 2, hr: 8, bb: 20, so: 45, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 68 },
      { id: 'manzeto01', name: 'Tommy Manzella', pos: 'SS', bats: 'R', age: 27, pa: 282, h: 58, double: 7, triple: 0, hr: 1, bb: 13, so: 73, hbp: 3, sb: 0, cs: 1, sec: '2B', fld: 69, rk: true },
      { id: 'leeca01', name: 'Carlos Lee', pos: 'LF', bats: 'R', age: 34, pa: 649, h: 164, double: 32, triple: 1, hr: 26, bb: 40, so: 57, hbp: 3, sb: 4, cs: 3, sec: '1B', fld: 51, arm: 68 },
      { id: 'bournmi01', name: 'Michael Bourn', pos: 'CF', bats: 'L', age: 27, pa: 605, h: 144, double: 23, triple: 8, hr: 3, bb: 56, so: 118, hbp: 2, sb: 52, cs: 11, sec: 'LF', fld: 80, arm: 72 },
      { id: 'pencehu01', name: 'Hunter Pence', pos: 'RF', bats: 'R', age: 27, pa: 658, h: 170, double: 29, triple: 4, hr: 25, bb: 47, so: 111, hbp: 1, sb: 16, cs: 10, sec: 'CF', fld: 78, arm: 68 },
      { id: 'michaja01', name: 'Jason Michaels', pos: 'DH', bats: 'R', age: 34, pa: 203, h: 44, double: 13, triple: 1, hr: 7, bb: 16, so: 38, hbp: 3, sb: 1, cs: 1, sec: 'LF', fld: 63, arm: 63 },
    ],
    bench: [
      { id: 'johnsch05', name: 'Chris Johnson', pos: '3B', bats: 'R', age: 25, pa: 362, h: 102, double: 21, triple: 2, hr: 11, bb: 15, so: 91, hbp: 2, sb: 3, cs: 0, sec: '1B', fld: 44, rk: true },
      { id: 'sanchan02', name: 'Angel Sanchez', pos: 'SS', bats: 'R', age: 26, pa: 272, h: 70, double: 9, triple: 4, hr: 0, bb: 11, so: 45, hbp: 2, sb: 0, cs: 1, sec: '2B', fld: 55, rk: true },
      { id: 'blumge01', name: 'Geoff Blum', pos: 'SS', bats: 'S', age: 37, pa: 218, h: 50, double: 8, triple: 1, hr: 5, bb: 15, so: 32, hbp: 2, sb: 0, cs: 0, sec: '3B' },
      { id: 'castrja01', name: 'Jason Castro', pos: 'C', bats: 'L', age: 23, pa: 217, h: 40, double: 8, triple: 1, hr: 2, bb: 22, so: 41, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 65, arm: 78, rk: true },
      { id: 'wallabr01', name: 'Brett Wallace', pos: '1B', bats: 'L', age: 23, pa: 159, h: 32, double: 6, triple: 1, hr: 2, bb: 8, so: 50, hbp: 7, sb: 0, cs: 0, sec: '3B', fld: 71, rk: true },
    ],
    reserveBatters: [
      { id: 'bourgja01', name: 'Jason Bourgeois', pos: 'LF', bats: 'R', age: 28, pa: 136, h: 27, double: 4, triple: 1, hr: 1, bb: 12, so: 17, hbp: 0, sb: 12, cs: 3, sec: 'CF', fld: 95, arm: 57, rk: true },
      { id: 'matsuka01', name: 'Kazuo Matsui', pos: '2B', bats: 'S', age: 34, pa: 78, h: 17, double: 3, triple: 0, hr: 1, bb: 5, so: 11, hbp: 0, sb: 3, cs: 1, sec: 'SS', fld: 92 },
      { id: 'sullico01', name: 'Cory Sullivan', pos: 'LF', bats: 'L', age: 30, pa: 71, h: 14, double: 1, triple: 2, hr: 1, bb: 7, so: 13, hbp: 0, sb: 2, cs: 0, sec: 'CF' },
      { id: 'towlejr01', name: 'J. R. Towles', pos: 'C', bats: 'R', age: 26, pa: 51, h: 8, double: 2, triple: 0, hr: 1, bb: 3, so: 13, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'myersbr01', name: 'Brett Myers', role: 'SP', throws: 'R', age: 29, g: 33, gs: 33, outs: 671, h: 216, hr: 28, bb: 68, so: 177, hbp: 5, er: 89, w: 14, l: 8, sv: 0, fld: 79 },
      { id: 'oswalro01', name: 'Roy Oswalt', role: 'SP', throws: 'R', age: 32, g: 33, gs: 32, outs: 635, h: 180, hr: 20, bb: 51, so: 175, hbp: 7, er: 76, w: 13, l: 13, sv: 0, fld: 72 },
      { id: 'rodriwa01', name: 'Wandy Rodriguez', role: 'SP', throws: 'L', age: 31, g: 32, gs: 32, outs: 585, h: 185, hr: 18, bb: 65, so: 182, hbp: 7, er: 74, w: 11, l: 12, sv: 0, fld: 73 },
      { id: 'norribu01', name: 'Bud Norris', role: 'SP', throws: 'R', age: 25, g: 27, gs: 27, outs: 461, h: 153, hr: 19, bb: 75, so: 156, hbp: 6, er: 83, w: 9, l: 10, sv: 0, fld: 70 },
      { id: 'figuene01', name: 'Nelson Figueroa', role: 'SP', throws: 'R', age: 36, g: 31, gs: 11, outs: 279, h: 89, hr: 10, bb: 34, so: 72, hbp: 5, er: 37, w: 7, l: 4, sv: 1, fld: 70 },
      { id: 'lindsma01', name: 'Matt Lindstrom', role: 'CL', throws: 'R', age: 30, g: 58, gs: 0, outs: 160, h: 63, hr: 4, bb: 23, so: 43, hbp: 1, er: 27, w: 2, l: 5, sv: 23, fld: 69 },
      { id: 'lyonbr01', name: 'Brandon Lyon', role: 'RP', throws: 'R', age: 30, g: 79, gs: 0, outs: 234, h: 68, hr: 5, bb: 29, so: 56, hbp: 2, er: 28, w: 6, l: 6, sv: 20, fld: 65 },
      { id: 'lopezwi01', name: 'Wilton Lopez', role: 'RP', throws: 'R', age: 26, g: 68, gs: 0, outs: 201, h: 70, hr: 5, bb: 8, so: 45, hbp: 1, er: 27, w: 5, l: 2, sv: 1, fld: 58, rk: true },
      { id: 'moehlbr01', name: 'Brian Moehler', role: 'RP', throws: 'R', age: 38, g: 20, gs: 8, outs: 170, h: 68, hr: 7, bb: 20, so: 32, hbp: 1, er: 33, w: 1, l: 4, sv: 0, fld: 58 },
      { id: 'fulchje01', name: 'Jeff Fulchino', role: 'RP', throws: 'R', age: 30, g: 50, gs: 0, outs: 142, h: 49, hr: 6, bb: 20, so: 45, hbp: 2, er: 25, w: 2, l: 1, sv: 0, fld: 58 },
      { id: 'byrdati01', name: 'Tim Byrdak', role: 'RP', throws: 'L', age: 36, g: 64, gs: 0, outs: 116, h: 33, hr: 6, bb: 22, so: 34, hbp: 1, er: 15, w: 2, l: 2, sv: 0, fld: 81 },
    ],
    reservePitchers: [
      { id: 'paulife01', name: 'Felipe Paulino', role: 'SP', throws: 'R', age: 26, g: 19, gs: 14, outs: 275, h: 103, hr: 10, bb: 41, so: 84, hbp: 3, er: 56, w: 1, l: 9, sv: 0, fld: 78 },
      { id: 'happja01', name: 'J. A. Happ', role: 'SP', throws: 'L', age: 27, g: 16, gs: 16, outs: 262, h: 77, hr: 9, bb: 38, so: 67, hbp: 2, er: 31, w: 6, l: 4, sv: 0, fld: 72 },
      { id: 'chacigu01', name: 'Gustavo Chacin', role: 'RP', throws: 'L', age: 29, g: 44, gs: 0, outs: 115, h: 51, hr: 3, bb: 20, so: 31, hbp: 0, er: 20, w: 2, l: 2, sv: 1, fld: 76 },
      { id: 'wrighwe01', name: 'Wesley Wright', role: 'RP', throws: 'L', age: 25, g: 14, gs: 4, outs: 99, h: 35, hr: 6, bb: 17, so: 32, hbp: 2, er: 20, w: 1, l: 2, sv: 0, fld: 77 },
      { id: 'sampsch01', name: 'Chris Sampson', role: 'RP', throws: 'R', age: 32, g: 35, gs: 0, outs: 91, h: 38, hr: 3, bb: 9, so: 17, hbp: 1, er: 18, w: 1, l: 0, sv: 0, fld: 60 },
    ],
  },
  // LAA (LAA 2010)
  {
    franchiseId: 'LAA',
    season: 2010,
    batters: [
      { id: 'mathije01', name: 'Jeff Mathis', pos: 'C', bats: 'R', age: 27, pa: 218, h: 39, double: 6, triple: 0, hr: 4, bb: 13, so: 59, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 60, arm: 64 },
      { id: 'napolmi01', name: 'Mike Napoli', pos: '1B', bats: 'R', age: 28, pa: 510, h: 114, double: 24, triple: 1, hr: 26, bb: 46, so: 131, hbp: 10, sb: 5, cs: 3, sec: '3B', fld: 63 },
      { id: 'kendrho01', name: 'Howie Kendrick', pos: '2B', bats: 'R', age: 26, pa: 658, h: 176, double: 40, triple: 4, hr: 11, bb: 29, so: 101, hbp: 6, sb: 16, cs: 5, sec: 'SS', fld: 59 },
      { id: 'woodbr01', name: 'Brandon Wood', pos: '3B', bats: 'R', age: 25, pa: 243, h: 36, double: 3, triple: 0, hr: 5, bb: 7, so: 73, hbp: 2, sb: 2, cs: 0, sec: 'SS', fld: 64 },
      { id: 'aybarer01', name: 'Erick Aybar', pos: 'SS', bats: 'S', age: 26, pa: 589, h: 148, double: 21, triple: 6, hr: 5, bb: 32, so: 72, hbp: 7, sb: 18, cs: 7, sec: '2B', fld: 58 },
      { id: 'riverju01', name: 'Juan Rivera', pos: 'LF', bats: 'R', age: 31, pa: 455, h: 111, double: 20, triple: 0, hr: 17, bb: 31, so: 52, hbp: 3, sb: 1, cs: 1, sec: 'RF', fld: 80, arm: 76 },
      { id: 'hunteto01', name: 'Torii Hunter', pos: 'CF', bats: 'R', age: 34, pa: 646, h: 164, double: 36, triple: 1, hr: 24, bb: 59, so: 111, hbp: 6, sb: 15, cs: 9, sec: 'RF', fld: 74, arm: 64 },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 36, pa: 667, h: 157, double: 37, triple: 2, hr: 18, bb: 87, so: 121, hbp: 1, sb: 26, cs: 9, sec: 'LF', fld: 60, arm: 67 },
      { id: 'matsuhi01', name: 'Hideki Matsui', pos: 'DH', bats: 'L', age: 36, pa: 554, h: 133, double: 23, triple: 1, hr: 23, bb: 66, so: 88, hbp: 3, sb: 0, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'izturma01', name: 'Maicer Izturis', pos: '3B', bats: 'S', age: 29, pa: 238, h: 58, double: 12, triple: 1, hr: 3, bb: 20, so: 24, hbp: 2, sb: 7, cs: 3, sec: '2B', fld: 74 },
      { id: 'moralke01', name: 'Kendrys Morales', pos: '1B', bats: 'S', age: 27, pa: 211, h: 57, double: 11, triple: 0, hr: 11, bb: 14, so: 36, hbp: 2, sb: 1, cs: 2, sec: '3B', fld: 65 },
      { id: 'bourjpe01', name: 'Peter Bourjos', pos: 'CF', bats: 'R', age: 23, pa: 193, h: 37, double: 6, triple: 4, hr: 6, bb: 6, so: 40, hbp: 2, sb: 10, cs: 3, sec: 'LF', fld: 97, arm: 95, rk: true },
      { id: 'willire03', name: 'Reggie Willits', pos: 'LF', bats: 'S', age: 29, pa: 182, h: 37, double: 6, triple: 0, hr: 0, bb: 18, so: 29, hbp: 1, sb: 4, cs: 3, sec: 'CF', fld: 88, arm: 82 },
      { id: 'frandke01', name: 'Kevin Frandsen', pos: '3B', bats: 'R', age: 28, pa: 173, h: 37, double: 10, triple: 0, hr: 0, bb: 9, so: 10, hbp: 1, sb: 2, cs: 0, sec: '2B', fld: 71 },
    ],
    reserveBatters: [
      { id: 'wilsobo02', name: 'Bobby Wilson', pos: 'C', bats: 'R', age: 27, pa: 106, h: 22, double: 6, triple: 0, hr: 4, bb: 8, so: 23, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 67, rk: true },
      { id: 'ryanmi03', name: 'Mike Ryan', pos: 'LF', bats: 'L', age: 32, pa: 41, h: 8, double: 4, triple: 0, hr: 0, bb: 1, so: 5, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'weaveje02', name: 'Jered Weaver', role: 'SP', throws: 'R', age: 27, g: 34, gs: 34, outs: 673, h: 194, hr: 24, bb: 60, so: 207, hbp: 2, er: 84, w: 13, l: 12, sv: 0, fld: 63 },
      { id: 'santaer01', name: 'Ervin Santana', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 668, h: 225, hr: 29, bb: 69, so: 178, hbp: 12, er: 102, w: 17, l: 10, sv: 0, fld: 66 },
      { id: 'saundjo01', name: 'Joe Saunders', role: 'SP', throws: 'L', age: 29, g: 33, gs: 33, outs: 610, h: 224, hr: 27, bb: 65, so: 113, hbp: 6, er: 99, w: 9, l: 17, sv: 0, fld: 82 },
      { id: 'pineijo01', name: 'Joel Pineiro', role: 'SP', throws: 'R', age: 31, g: 23, gs: 23, outs: 457, h: 159, hr: 13, bb: 28, so: 83, hbp: 3, er: 66, w: 10, l: 7, sv: 0, fld: 79 },
      { id: 'kazmisc01', name: 'Scott Kazmir', role: 'SP', throws: 'L', age: 26, g: 28, gs: 28, outs: 450, h: 154, hr: 22, bb: 73, so: 117, hbp: 9, er: 89, w: 9, l: 15, sv: 0, fld: 71 },
      { id: 'fuentbr01', name: 'Brian Fuentes', role: 'CL', throws: 'L', age: 34, g: 48, gs: 0, outs: 144, h: 36, hr: 4, bb: 19, so: 46, hbp: 2, er: 16, w: 4, l: 1, sv: 24, fld: 82 },
      { id: 'rodnefe01', name: 'Fernando Rodney', role: 'RP', throws: 'R', age: 33, g: 72, gs: 0, outs: 204, h: 67, hr: 5, bb: 38, so: 57, hbp: 4, er: 33, w: 4, l: 3, sv: 14, fld: 62 },
      { id: 'belltr01', name: 'Trevor Bell', role: 'RP', throws: 'R', age: 23, g: 25, gs: 7, outs: 183, h: 82, hr: 3, bb: 22, so: 43, hbp: 1, er: 37, w: 2, l: 5, sv: 0, fld: 62, rk: true },
      { id: 'jepseke01', name: 'Kevin Jepsen', role: 'RP', throws: 'R', age: 25, g: 68, gs: 0, outs: 177, h: 59, hr: 2, bb: 26, so: 57, hbp: 1, er: 28, w: 2, l: 4, sv: 0, fld: 65 },
      { id: 'rodrifr04', name: 'Francisco Rodriguez', role: 'RP', throws: 'R', age: 27, g: 43, gs: 0, outs: 142, h: 46, hr: 5, bb: 26, so: 36, hbp: 1, er: 23, w: 1, l: 3, sv: 0, fld: 60, rk: true },
      { id: 'shielsc01', name: 'Scot Shields', role: 'RP', throws: 'R', age: 34, g: 43, gs: 1, outs: 138, h: 44, hr: 5, bb: 32, so: 41, hbp: 2, er: 25, w: 0, l: 3, sv: 0, fld: 80 },
    ],
    reservePitchers: [
      { id: 'palmema01', name: 'Matt Palmer', role: 'RP', throws: 'R', age: 31, g: 14, gs: 1, outs: 101, h: 34, hr: 3, bb: 18, so: 19, hbp: 1, er: 17, w: 1, l: 2, sv: 0, fld: 52 },
      { id: 'bulgeja01', name: 'Jason Bulger', role: 'RP', throws: 'R', age: 31, g: 25, gs: 0, outs: 72, h: 22, hr: 3, bb: 13, so: 27, hbp: 1, er: 12, w: 0, l: 0, sv: 0, fld: 73 },
      { id: 'kohnmi01', name: 'Michael Kohn', role: 'RP', throws: 'R', age: 24, g: 24, gs: 0, outs: 64, h: 17, hr: 0, bb: 16, so: 20, hbp: 0, er: 5, w: 2, l: 0, sv: 1, fld: 69, rk: true },
      { id: 'cassebo01', name: 'Bobby Cassevah', role: 'RP', throws: 'R', age: 24, g: 16, gs: 0, outs: 60, h: 23, hr: 0, bb: 8, so: 8, hbp: 1, er: 7, w: 1, l: 2, sv: 0, fld: 57, rk: true },
      { id: 'thompri03', name: 'Rich Thompson', role: 'RP', throws: 'R', age: 25, g: 13, gs: 0, outs: 59, h: 17, hr: 3, bb: 5, so: 16, hbp: 0, er: 6, w: 2, l: 0, sv: 0, fld: 78, rk: true },
    ],
  },
  // OAK (OAK 2010)
  {
    franchiseId: 'OAK',
    season: 2010,
    batters: [
      { id: 'suzukku01', name: 'Kurt Suzuki', pos: 'C', bats: 'R', age: 26, pa: 544, h: 129, double: 24, triple: 1, hr: 12, bb: 31, so: 53, hbp: 10, sb: 4, cs: 2, sec: '1B', fld: 69, arm: 65 },
      { id: 'bartoda02', name: 'Daric Barton', pos: '1B', bats: 'L', age: 24, pa: 686, h: 149, double: 32, triple: 5, hr: 10, bb: 103, so: 105, hbp: 4, sb: 5, cs: 3, sec: '3B', fld: 62 },
      { id: 'ellisma01', name: 'Mark Ellis', pos: '2B', bats: 'R', age: 33, pa: 492, h: 120, double: 24, triple: 1, hr: 8, bb: 38, so: 60, hbp: 6, sb: 10, cs: 5, sec: 'SS', fld: 80 },
      { id: 'kouzmke01', name: 'Kevin Kouzmanoff', pos: '3B', bats: 'R', age: 28, pa: 586, h: 138, double: 31, triple: 1, hr: 18, bb: 24, so: 105, hbp: 9, sb: 1, cs: 0, sec: '1B', fld: 79 },
      { id: 'pennicl01', name: 'Cliff Pennington', pos: 'SS', bats: 'S', age: 26, pa: 576, h: 130, double: 26, triple: 8, hr: 7, bb: 50, so: 100, hbp: 3, sb: 26, cs: 7, sec: '2B', fld: 85 },
      { id: 'patteer01', name: 'Eric Patterson', pos: 'LF', bats: 'L', age: 27, pa: 204, h: 41, double: 8, triple: 4, hr: 4, bb: 18, so: 57, hbp: 1, sb: 11, cs: 1, sec: 'CF', fld: 76, arm: 79 },
      { id: 'davisra01', name: 'Rajai Davis', pos: 'CF', bats: 'R', age: 29, pa: 561, h: 149, double: 29, triple: 5, hr: 5, bb: 29, so: 84, hbp: 5, sb: 53, cs: 13, sec: 'LF', fld: 57, arm: 66 },
      { id: 'sweenry01', name: 'Ryan Sweeney', pos: 'RF', bats: 'L', age: 25, pa: 331, h: 88, double: 19, triple: 2, hr: 3, bb: 25, so: 43, hbp: 1, sb: 3, cs: 2, sec: 'CF', fld: 73, arm: 67 },
      { id: 'custja01', name: 'Jack Cust', pos: 'DH', bats: 'L', age: 31, pa: 425, h: 88, double: 15, triple: 0, hr: 17, bb: 69, so: 130, hbp: 3, sb: 2, cs: 1, sec: 'LF' },
    ],
    bench: [
      { id: 'crispco01', name: 'Coco Crisp', pos: 'CF', bats: 'S', age: 30, pa: 328, h: 77, double: 14, triple: 4, hr: 7, bb: 33, so: 45, hbp: 1, sb: 26, cs: 4, sec: 'LF', fld: 73, arm: 64 },
      { id: 'rosalad01', name: 'Adam Rosales', pos: '2B', bats: 'R', age: 27, pa: 279, h: 62, double: 9, triple: 2, hr: 6, bb: 22, so: 58, hbp: 3, sb: 2, cs: 2, sec: '3B', fld: 68 },
      { id: 'grossga01', name: 'Gabe Gross', pos: 'RF', bats: 'L', age: 30, pa: 243, h: 50, double: 11, triple: 1, hr: 4, bb: 25, so: 49, hbp: 0, sb: 4, cs: 2, sec: 'LF', fld: 65, arm: 77 },
      { id: 'foxja02', name: 'Jake Fox', pos: 'DH', bats: 'R', age: 27, pa: 211, h: 46, double: 10, triple: 1, hr: 8, bb: 10, so: 46, hbp: 4, sb: 0, cs: 0, sec: 'LF' },
      { id: 'powella01', name: 'Landon Powell', pos: 'C', bats: 'S', age: 28, pa: 129, h: 25, double: 5, triple: 0, hr: 4, bb: 14, so: 29, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 66, arm: 76 },
    ],
    reserveBatters: [
      { id: 'chaveer01', name: 'Eric Chavez', pos: 'DH', bats: 'L', age: 32, pa: 123, h: 25, double: 8, triple: 0, hr: 1, bb: 7, so: 29, hbp: 0, sb: 0, cs: 0, sec: '3B' },
      { id: 'carsoma01', name: 'Matt Carson', pos: 'RF', bats: 'R', age: 28, pa: 83, h: 15, double: 2, triple: 0, hr: 4, bb: 2, so: 24, hbp: 0, sb: 3, cs: 0, sec: 'LF', fld: 79, arm: 76, rk: true },
      { id: 'cartech02', name: 'Chris Carter', pos: 'LF', bats: 'R', age: 23, pa: 78, h: 13, double: 1, triple: 0, hr: 3, bb: 7, so: 21, hbp: 0, sb: 1, cs: 0, sec: 'RF', fld: 40, arm: 57, rk: true },
      { id: 'larisje01', name: 'Jeff Larish', pos: '1B', bats: 'L', age: 27, pa: 75, h: 14, double: 3, triple: 0, hr: 2, bb: 8, so: 23, hbp: 0, sb: 1, cs: 1, sec: '3B' },
      { id: 'tollest01', name: 'Steven Tolleson', pos: 'SS', bats: 'R', age: 26, pa: 53, h: 14, double: 3, triple: 0, hr: 1, bb: 4, so: 9, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'gonzagi01', name: 'Gio Gonzalez', role: 'SP', throws: 'L', age: 24, g: 33, gs: 33, outs: 602, h: 181, hr: 19, bb: 97, so: 180, hbp: 4, er: 87, w: 15, l: 9, sv: 0, fld: 72 },
      { id: 'cahiltr01', name: 'Trevor Cahill', role: 'SP', throws: 'R', age: 22, g: 30, gs: 30, outs: 590, h: 168, hr: 22, bb: 67, so: 108, hbp: 5, er: 76, w: 18, l: 8, sv: 0, fld: 90 },
      { id: 'bradeda01', name: 'Dallas Braden', role: 'SP', throws: 'L', age: 26, g: 30, gs: 30, outs: 578, h: 185, hr: 16, bb: 49, so: 111, hbp: 4, er: 77, w: 11, l: 14, sv: 0, fld: 76 },
      { id: 'mazzavi01', name: 'Vin Mazzaro', role: 'SP', throws: 'R', age: 23, g: 24, gs: 18, outs: 367, h: 135, hr: 18, bb: 50, so: 77, hbp: 4, er: 61, w: 6, l: 8, sv: 0, fld: 59 },
      { id: 'sheetbe01', name: 'Ben Sheets', role: 'SP', throws: 'R', age: 31, g: 20, gs: 20, outs: 358, h: 120, hr: 16, bb: 38, so: 90, hbp: 0, er: 54, w: 4, l: 9, sv: 0, fld: 67 },
      { id: 'bailean01', name: 'Andrew Bailey', role: 'CL', throws: 'R', age: 26, g: 47, gs: 0, outs: 147, h: 32, hr: 3, bb: 14, so: 49, hbp: 0, er: 9, w: 1, l: 3, sv: 25, fld: 59 },
      { id: 'breslcr01', name: 'Craig Breslow', role: 'RP', throws: 'L', age: 29, g: 75, gs: 0, outs: 224, h: 52, hr: 8, bb: 30, so: 66, hbp: 1, er: 25, w: 4, l: 4, sv: 5, fld: 71 },
      { id: 'zieglbr01', name: 'Brad Ziegler', role: 'RP', throws: 'R', age: 30, g: 64, gs: 0, outs: 182, h: 58, hr: 3, bb: 25, so: 41, hbp: 2, er: 19, w: 3, l: 7, sv: 0, fld: 73 },
      { id: 'blevije01', name: 'Jerry Blevins', role: 'RP', throws: 'L', age: 26, g: 63, gs: 0, outs: 146, h: 51, hr: 6, bb: 17, so: 48, hbp: 1, er: 21, w: 2, l: 1, sv: 1, fld: 70 },
      { id: 'wuertmi01', name: 'Michael Wuertz', role: 'RP', throws: 'R', age: 31, g: 48, gs: 0, outs: 119, h: 33, hr: 4, bb: 17, so: 46, hbp: 0, er: 16, w: 2, l: 3, sv: 6, fld: 59 },
      { id: 'rossty01', name: 'Tyson Ross', role: 'RP', throws: 'R', age: 23, g: 26, gs: 2, outs: 118, h: 39, hr: 4, bb: 20, so: 32, hbp: 0, er: 24, w: 1, l: 4, sv: 1, fld: 57, rk: true },
    ],
    reservePitchers: [
      { id: 'anderbr04', name: 'Brett Anderson', role: 'SP', throws: 'L', age: 22, g: 19, gs: 19, outs: 337, h: 113, hr: 9, bb: 25, so: 85, hbp: 4, er: 43, w: 7, l: 6, sv: 0, fld: 77 },
      { id: 'duchsju01', name: 'Justin Duchscherer', role: 'RP', throws: 'R', age: 32, g: 5, gs: 5, outs: 84, h: 24, hr: 3, bb: 9, so: 19, hbp: 1, er: 9, w: 2, l: 1, sv: 0, fld: 63 },
      { id: 'rodrihe03', name: 'Henry Rodriguez', role: 'RP', throws: 'R', age: 23, g: 29, gs: 0, outs: 83, h: 25, hr: 2, bb: 13, so: 32, hbp: 2, er: 13, w: 1, l: 0, sv: 0, fld: 65, rk: true },
      { id: 'bonsebo01', name: 'Boof Bonser', role: 'RP', throws: 'R', age: 28, g: 15, gs: 0, outs: 75, h: 31, hr: 3, bb: 8, so: 20, hbp: 0, er: 17, w: 1, l: 0, sv: 0, fld: 63 },
      { id: 'cramebo01', name: 'Bobby Cramer', role: 'RP', throws: 'L', age: 30, g: 4, gs: 4, outs: 71, h: 20, hr: 5, bb: 6, so: 13, hbp: 0, er: 8, w: 2, l: 1, sv: 0, fld: 62, rk: true },
    ],
  },
  // SEA (SEA 2010)
  {
    franchiseId: 'SEA',
    season: 2010,
    batters: [
      { id: 'mooread01', name: 'Adam Moore', pos: 'C', bats: 'R', age: 26, pa: 218, h: 40, double: 6, triple: 0, hr: 4, bb: 7, so: 63, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 61, arm: 62, rk: true },
      { id: 'kotchca01', name: 'Casey Kotchman', pos: '1B', bats: 'L', age: 27, pa: 457, h: 101, double: 22, triple: 1, hr: 9, bb: 36, so: 48, hbp: 4, sb: 1, cs: 0, sec: '3B', fld: 79 },
      { id: 'figgich01', name: 'Chone Figgins', pos: '2B', bats: 'S', age: 32, pa: 702, h: 165, double: 24, triple: 4, hr: 2, bb: 84, so: 112, hbp: 2, sb: 42, cs: 16, sec: '3B', fld: 52 },
      { id: 'lopezjo01', name: 'Jose Lopez', pos: '3B', bats: 'R', age: 26, pa: 622, h: 153, double: 34, triple: 0, hr: 16, bb: 23, so: 65, hbp: 4, sb: 3, cs: 2, sec: '2B', fld: 92 },
      { id: 'wilsojo03', name: 'Josh Wilson', pos: 'SS', bats: 'R', age: 29, pa: 388, h: 81, double: 16, triple: 2, hr: 3, bb: 16, so: 76, hbp: 11, sb: 4, cs: 1, sec: '2B', fld: 71 },
      { id: 'saundmi01', name: 'Michael Saunders', pos: 'LF', bats: 'L', age: 23, pa: 327, h: 63, double: 9, triple: 3, hr: 8, bb: 31, so: 88, hbp: 0, sb: 7, cs: 3, sec: 'CF', fld: 85, arm: 79, rk: true },
      { id: 'gutiefr01', name: 'Franklin Gutierrez', pos: 'CF', bats: 'R', age: 27, pa: 629, h: 147, double: 26, triple: 2, hr: 14, bb: 47, so: 130, hbp: 3, sb: 20, cs: 4, sec: 'RF', fld: 91, arm: 61 },
      { id: 'suzukic01', name: 'Ichiro Suzuki', pos: 'RF', bats: 'L', age: 36, pa: 732, h: 222, double: 29, triple: 4, hr: 8, bb: 43, so: 79, hbp: 4, sb: 38, cs: 8, sec: 'CF', fld: 80, arm: 65 },
      { id: 'branyru01', name: 'Russell Branyan', pos: 'DH', bats: 'L', age: 34, pa: 428, h: 90, double: 19, triple: 0, hr: 26, bb: 48, so: 128, hbp: 5, sb: 1, cs: 0, sec: '3B' },
    ],
    bench: [
      { id: 'bradlmi01', name: 'Milton Bradley', pos: 'LF', bats: 'S', age: 32, pa: 278, h: 59, double: 11, triple: 1, hr: 9, bb: 36, so: 64, hbp: 5, sb: 4, cs: 2, sec: 'CF', fld: 86, arm: 76 },
      { id: 'wilsoja02', name: 'Jack Wilson', pos: 'SS', bats: 'R', age: 32, pa: 211, h: 50, double: 12, triple: 1, hr: 1, bb: 9, so: 27, hbp: 2, sb: 1, cs: 1, sec: '2B', fld: 83 },
      { id: 'johnsro07', name: 'Rob Johnson', pos: 'C', bats: 'R', age: 27, pa: 209, h: 36, double: 11, triple: 1, hr: 2, bb: 21, so: 45, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 56, arm: 77 },
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: 'DH', bats: 'R', age: 36, pa: 168, h: 41, double: 8, triple: 0, hr: 6, bb: 12, so: 19, hbp: 2, sb: 1, cs: 0, sec: '1B' },
      { id: 'tuiasma01', name: 'Matt Tuiasosopo', pos: 'LF', bats: 'R', age: 24, pa: 138, h: 22, double: 5, triple: 0, hr: 4, bb: 9, so: 47, hbp: 1, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    reserveBatters: [
      { id: 'langery01', name: 'Ryan Langerhans', pos: 'LF', bats: 'L', age: 30, pa: 132, h: 23, double: 4, triple: 1, hr: 3, bb: 21, so: 41, hbp: 1, sb: 2, cs: 1, sec: 'CF', fld: 88, arm: 95 },
      { id: 'bardjo01', name: 'Josh Bard', pos: 'C', bats: 'S', age: 32, pa: 126, h: 25, double: 7, triple: 0, hr: 2, bb: 10, so: 22, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 75 },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'DH', bats: 'L', age: 40, pa: 108, h: 20, double: 4, triple: 0, hr: 3, bb: 14, so: 18, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
      { id: 'alfonel01', name: 'Eliezer Alfonzo', pos: 'C', bats: 'R', age: 31, pa: 41, h: 8, double: 1, triple: 0, hr: 1, bb: 1, so: 11, hbp: 0, sb: 0, cs: 0, sec: '1B' },
      { id: 'carpmi01', name: 'Mike Carp', pos: '1B', bats: 'L', age: 24, pa: 41, h: 9, double: 2, triple: 0, hr: 0, bb: 5, so: 7, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'hernafe02', name: 'Felix Hernandez', role: 'SP', throws: 'R', age: 24, g: 34, gs: 34, outs: 749, h: 203, hr: 17, bb: 74, so: 224, hbp: 8, er: 68, w: 13, l: 12, sv: 0, fld: 73 },
      { id: 'vargaja01', name: 'Jason Vargas', role: 'SP', throws: 'L', age: 27, g: 31, gs: 31, outs: 578, h: 190, hr: 22, bb: 53, so: 115, hbp: 2, er: 86, w: 9, l: 12, sv: 0, fld: 64 },
      { id: 'fistedo01', name: 'Doug Fister', role: 'SP', throws: 'R', age: 26, g: 28, gs: 28, outs: 513, h: 185, hr: 16, bb: 34, so: 95, hbp: 6, er: 78, w: 6, l: 14, sv: 0, fld: 74 },
      { id: 'rowlary01', name: 'Ryan Rowland-Smith', role: 'SP', throws: 'L', age: 27, g: 27, gs: 20, outs: 328, h: 128, hr: 19, bb: 42, so: 59, hbp: 6, er: 67, w: 1, l: 10, sv: 0, fld: 84 },
      { id: 'pauleda01', name: 'David Pauley', role: 'SP', throws: 'R', age: 27, g: 19, gs: 15, outs: 272, h: 92, hr: 13, bb: 30, so: 52, hbp: 4, er: 44, w: 4, l: 9, sv: 0, fld: 77, rk: true },
      { id: 'aardsda01', name: 'David Aardsma', role: 'CL', throws: 'R', age: 28, g: 53, gs: 0, outs: 149, h: 35, hr: 4, bb: 26, so: 51, hbp: 2, er: 18, w: 0, l: 6, sv: 31, fld: 69 },
      { id: 'leagubr01', name: 'Brandon League', role: 'RP', throws: 'R', age: 27, g: 70, gs: 0, outs: 237, h: 69, hr: 7, bb: 26, so: 64, hbp: 4, er: 32, w: 9, l: 7, sv: 6, fld: 64 },
      { id: 'wrighja01', name: 'Jamey Wright', role: 'RP', throws: 'R', age: 35, g: 46, gs: 0, outs: 175, h: 55, hr: 4, bb: 27, so: 36, hbp: 4, er: 28, w: 1, l: 3, sv: 0, fld: 85 },
      { id: 'snellia01', name: 'Ian Snell', role: 'RP', throws: 'R', age: 28, g: 12, gs: 8, outs: 139, h: 54, hr: 6, bb: 27, so: 31, hbp: 1, er: 28, w: 0, l: 5, sv: 0, fld: 63 },
      { id: 'olsonga01', name: 'Garrett Olson', role: 'RP', throws: 'L', age: 26, g: 35, gs: 0, outs: 113, h: 41, hr: 7, bb: 16, so: 25, hbp: 1, er: 23, w: 0, l: 3, sv: 1, fld: 68 },
      { id: 'sweenbr01', name: 'Brian Sweeney', role: 'RP', throws: 'R', age: 36, g: 24, gs: 0, outs: 111, h: 33, hr: 5, bb: 6, so: 14, hbp: 0, er: 13, w: 1, l: 2, sv: 0, fld: 82 },
    ],
    reservePitchers: [
      { id: 'frenclu01', name: 'Luke French', role: 'SP', throws: 'L', age: 24, g: 16, gs: 13, outs: 263, h: 94, hr: 13, bb: 31, so: 42, hbp: 3, er: 47, w: 5, l: 7, sv: 0, fld: 66 },
      { id: 'whitese02', name: 'Sean White', role: 'RP', throws: 'R', age: 29, g: 38, gs: 0, outs: 103, h: 37, hr: 3, bb: 12, so: 16, hbp: 1, er: 16, w: 0, l: 1, sv: 0, fld: 73 },
      { id: 'kellesh01', name: 'Shawn Kelley', role: 'RP', throws: 'R', age: 26, g: 22, gs: 0, outs: 75, h: 26, hr: 5, bb: 8, so: 25, hbp: 1, er: 12, w: 3, l: 1, sv: 0, fld: 71, rk: true },
      { id: 'seddoch01', name: 'Chris Seddon', role: 'RP', throws: 'L', age: 26, g: 14, gs: 0, outs: 67, h: 21, hr: 4, bb: 10, so: 16, hbp: 0, er: 14, w: 1, l: 0, sv: 0, fld: 64, rk: true },
      { id: 'colomje01', name: 'Jesus Colome', role: 'RP', throws: 'R', age: 32, g: 12, gs: 0, outs: 51, h: 18, hr: 1, bb: 9, so: 14, hbp: 1, er: 10, w: 0, l: 1, sv: 0, fld: 74 },
    ],
  },
  // TEX (TEX 2010)
  {
    franchiseId: 'TEX',
    season: 2010,
    batters: [
      { id: 'treanma01', name: 'Matt Treanor', pos: 'C', bats: 'R', age: 34, pa: 272, h: 50, double: 6, triple: 1, hr: 4, bb: 22, so: 48, hbp: 5, sb: 1, cs: 2, fld: 76, arm: 70 },
      { id: 'smoakju01', name: 'Justin Smoak', pos: '1B', bats: 'S', age: 23, pa: 397, h: 76, double: 14, triple: 0, hr: 13, bb: 46, so: 91, hbp: 0, sb: 1, cs: 0, sec: '3B', fld: 65, rk: true },
      { id: 'kinslia01', name: 'Ian Kinsler', pos: '2B', bats: 'R', age: 28, pa: 460, h: 112, double: 23, triple: 2, hr: 15, bb: 47, so: 56, hbp: 6, sb: 19, cs: 4, sec: 'SS', fld: 65 },
      { id: 'youngmi02', name: 'Michael Young', pos: '3B', bats: 'R', age: 33, pa: 718, h: 193, double: 38, triple: 3, hr: 21, bb: 53, so: 112, hbp: 1, sb: 7, cs: 2, sec: 'SS', fld: 63 },
      { id: 'andruel01', name: 'Elvis Andrus', pos: 'SS', bats: 'R', age: 21, pa: 674, h: 157, double: 17, triple: 5, hr: 3, bb: 59, so: 96, hbp: 6, sb: 35, cs: 12, sec: '2B', fld: 74 },
      { id: 'hamiljo03', name: 'Josh Hamilton', pos: 'LF', bats: 'L', age: 29, pa: 571, h: 168, double: 35, triple: 3, hr: 27, bb: 44, so: 103, hbp: 4, sb: 9, cs: 2, sec: 'CF', fld: 81, arm: 75 },
      { id: 'borboju01', name: 'Julio Borbon', pos: 'CF', bats: 'L', age: 24, pa: 468, h: 122, double: 11, triple: 3, hr: 5, bb: 23, so: 62, hbp: 2, sb: 22, cs: 8, sec: 'LF', fld: 78, arm: 61 },
      { id: 'cruzne02', name: 'Nelson Cruz', pos: 'RF', bats: 'R', age: 29, pa: 445, h: 117, double: 26, triple: 2, hr: 25, bb: 41, so: 90, hbp: 1, sb: 17, cs: 4, sec: 'LF', fld: 89, arm: 61 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'DH', bats: 'R', age: 35, pa: 643, h: 178, double: 28, triple: 2, hr: 28, bb: 37, so: 71, hbp: 8, sb: 4, cs: 4, sec: 'RF' },
    ],
    bench: [
      { id: 'murphda07', name: 'David Murphy', pos: 'LF', bats: 'L', age: 28, pa: 467, h: 117, double: 25, triple: 2, hr: 14, bb: 43, so: 81, hbp: 0, sb: 11, cs: 3, sec: 'RF', fld: 74, arm: 76 },
      { id: 'blancan01', name: 'Andres Blanco', pos: '2B', bats: 'S', age: 26, pa: 185, h: 45, double: 10, triple: 1, hr: 0, bb: 11, so: 22, hbp: 2, sb: 0, cs: 2, sec: 'SS', fld: 53 },
      { id: 'morelmi01', name: 'Mitch Moreland', pos: '1B', bats: 'L', age: 24, pa: 173, h: 37, double: 4, triple: 0, hr: 9, bb: 25, so: 36, hbp: 1, sb: 3, cs: 1, sec: '3B', fld: 59, rk: true },
      { id: 'davisch02', name: 'Chris Davis', pos: '1B', bats: 'L', age: 24, pa: 136, h: 29, double: 7, triple: 0, hr: 5, bb: 10, so: 44, hbp: 0, sb: 1, cs: 0, sec: '3B', fld: 69 },
      { id: 'ariasjo01', name: 'Joaquin Arias', pos: '2B', bats: 'R', age: 25, pa: 134, h: 33, double: 6, triple: 1, hr: 0, bb: 5, so: 22, hbp: 0, sb: 2, cs: 0, sec: 'SS', fld: 64 },
    ],
    reserveBatters: [
      { id: 'ramirma03', name: 'Max Ramirez', pos: 'C', bats: 'R', age: 25, pa: 85, h: 15, double: 3, triple: 0, hr: 2, bb: 12, so: 22, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 62, arm: 61, rk: true },
      { id: 'teagata01', name: 'Taylor Teagarden', pos: 'C', bats: 'R', age: 26, pa: 85, h: 15, double: 4, triple: 0, hr: 3, bb: 7, so: 31, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 59, arm: 60 },
    ],
    pitchers: [
      { id: 'leecl02', name: 'Cliff Lee', role: 'SP', throws: 'L', age: 31, g: 28, gs: 28, outs: 637, h: 201, hr: 15, bb: 27, so: 170, hbp: 3, er: 71, w: 12, l: 9, sv: 0, fld: 50 },
      { id: 'wilsocj01', name: 'C. J. Wilson', role: 'SP', throws: 'L', age: 29, g: 33, gs: 33, outs: 612, h: 166, hr: 11, bb: 93, so: 180, hbp: 11, er: 76, w: 15, l: 8, sv: 0, fld: 64 },
      { id: 'lewisco01', name: 'Colby Lewis', role: 'SP', throws: 'R', age: 30, g: 32, gs: 32, outs: 603, h: 174, hr: 21, bb: 65, so: 196, hbp: 6, er: 83, w: 12, l: 13, sv: 0, fld: 47 },
      { id: 'feldmsc01', name: 'Scott Feldman', role: 'SP', throws: 'R', age: 27, g: 29, gs: 22, outs: 424, h: 162, hr: 17, bb: 49, so: 80, hbp: 7, er: 79, w: 7, l: 11, sv: 0, fld: 86 },
      { id: 'hunteto02', name: 'Tommy Hunter', role: 'SP', throws: 'R', age: 23, g: 23, gs: 22, outs: 384, h: 128, hr: 19, bb: 34, so: 70, hbp: 3, er: 58, w: 13, l: 4, sv: 0, fld: 66 },
      { id: 'felizne01', name: 'Neftali Feliz', role: 'CL', throws: 'R', age: 22, g: 70, gs: 0, outs: 208, h: 40, hr: 5, bb: 18, so: 76, hbp: 5, er: 19, w: 4, l: 3, sv: 40, fld: 68, rk: true },
      { id: 'harrima01', name: 'Matt Harrison', role: 'RP', throws: 'L', age: 24, g: 37, gs: 6, outs: 235, h: 87, hr: 10, bb: 34, so: 43, hbp: 2, er: 45, w: 3, l: 2, sv: 2, fld: 62 },
      { id: 'odayda01', name: 'Darren O\'Day', role: 'RP', throws: 'R', age: 27, g: 72, gs: 0, outs: 186, h: 45, hr: 4, bb: 15, so: 48, hbp: 5, er: 15, w: 6, l: 2, sv: 0, fld: 69 },
      { id: 'oliveda02', name: 'Darren Oliver', role: 'RP', throws: 'L', age: 39, g: 64, gs: 0, outs: 185, h: 53, hr: 4, bb: 16, so: 57, hbp: 3, er: 18, w: 1, l: 2, sv: 1, fld: 59 },
      { id: 'nippedu01', name: 'Dustin Nippert', role: 'RP', throws: 'R', age: 29, g: 38, gs: 2, outs: 170, h: 62, hr: 7, bb: 30, so: 46, hbp: 4, er: 29, w: 4, l: 5, sv: 0, fld: 69 },
      { id: 'raych01', name: 'Chris Ray', role: 'RP', throws: 'R', age: 28, g: 63, gs: 0, outs: 167, h: 56, hr: 6, bb: 25, so: 36, hbp: 0, er: 29, w: 5, l: 0, sv: 2, fld: 68 },
    ],
    reservePitchers: [
      { id: 'harderi01', name: 'Rich Harden', role: 'SP', throws: 'R', age: 28, g: 20, gs: 18, outs: 276, h: 85, hr: 15, bb: 53, so: 104, hbp: 6, er: 46, w: 5, l: 5, sv: 0, fld: 84 },
      { id: 'hollade01', name: 'Derek Holland', role: 'SP', throws: 'L', age: 23, g: 14, gs: 10, outs: 172, h: 61, hr: 9, bb: 21, so: 48, hbp: 3, er: 34, w: 3, l: 4, sv: 0, fld: 78 },
      { id: 'francfr01', name: 'Frank Francisco', role: 'RP', throws: 'R', age: 30, g: 56, gs: 0, outs: 158, h: 46, hr: 6, bb: 18, so: 63, hbp: 1, er: 22, w: 6, l: 4, sv: 2, fld: 72 },
      { id: 'ogandal01', name: 'Alexi Ogando', role: 'RP', throws: 'R', age: 26, g: 44, gs: 0, outs: 125, h: 31, hr: 2, bb: 16, so: 39, hbp: 1, er: 6, w: 4, l: 1, sv: 0, fld: 80, rk: true },
      { id: 'mathido01', name: 'Doug Mathis', role: 'RP', throws: 'R', age: 27, g: 13, gs: 0, outs: 67, h: 28, hr: 4, bb: 9, so: 12, hbp: 1, er: 12, w: 1, l: 1, sv: 0, fld: 66 },
    ],
  },
  // ATL (ATL 2010)
  {
    franchiseId: 'ATL',
    season: 2010,
    batters: [
      { id: 'mccanbr01', name: 'Brian McCann', pos: 'C', bats: 'L', age: 26, pa: 566, h: 137, double: 31, triple: 1, hr: 21, bb: 63, so: 88, hbp: 7, sb: 5, cs: 1, sec: '1B', fld: 68, arm: 72 },
      { id: 'glaustr01', name: 'Troy Glaus', pos: '1B', bats: 'R', age: 33, pa: 483, h: 102, double: 20, triple: 0, hr: 17, bb: 63, so: 94, hbp: 3, sb: 0, cs: 0, sec: '3B', fld: 55 },
      { id: 'pradoma01', name: 'Martin Prado', pos: '2B', bats: 'R', age: 26, pa: 651, h: 183, double: 43, triple: 3, hr: 14, bb: 43, so: 82, hbp: 3, sb: 4, cs: 3, sec: '3B', fld: 76 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: '3B', bats: 'S', age: 38, pa: 381, h: 89, double: 18, triple: 1, hr: 12, bb: 63, so: 50, hbp: 0, sb: 4, cs: 0, sec: 'SS', fld: 70 },
      { id: 'escobyu01', name: 'Yunel Escobar', pos: 'SS', bats: 'R', age: 27, pa: 567, h: 137, double: 22, triple: 1, hr: 8, bb: 55, so: 58, hbp: 6, sb: 5, cs: 3, sec: '3B', fld: 84 },
      { id: 'cabreme01', name: 'Melky Cabrera', pos: 'LF', bats: 'S', age: 25, pa: 509, h: 120, double: 25, triple: 2, hr: 8, bb: 40, so: 61, hbp: 2, sb: 8, cs: 1, sec: 'CF', fld: 65, arm: 72 },
      { id: 'mclouna01', name: 'Nate McLouth', pos: 'CF', bats: 'L', age: 28, pa: 288, h: 59, double: 14, triple: 1, hr: 9, bb: 32, so: 49, hbp: 5, sb: 9, cs: 2, sec: 'RF', fld: 51, arm: 61 },
      { id: 'heywaja01', name: 'Jason Heyward', pos: 'RF', bats: 'L', age: 20, pa: 623, h: 144, double: 29, triple: 5, hr: 18, bb: 91, so: 128, hbp: 10, sb: 11, cs: 6, sec: 'LF', fld: 54, arm: 63, rk: true },
      { id: 'hinsker01', name: 'Eric Hinske', pos: 'DH', bats: 'L', age: 32, pa: 320, h: 70, double: 19, triple: 1, hr: 12, bb: 35, so: 73, hbp: 4, sb: 2, cs: 1, sec: '3B', fld: 58, arm: 57 },
    ],
    bench: [
      { id: 'infanom01', name: 'Omar Infante', pos: '2B', bats: 'R', age: 28, pa: 506, h: 146, double: 19, triple: 3, hr: 7, bb: 32, so: 62, hbp: 1, sb: 5, cs: 4, sec: 'SS', fld: 71 },
      { id: 'diazma02', name: 'Matt Diaz', pos: 'LF', bats: 'R', age: 32, pa: 244, h: 61, double: 13, triple: 2, hr: 7, bb: 16, so: 49, hbp: 6, sb: 5, cs: 2, sec: 'RF', fld: 65, arm: 61 },
      { id: 'ankieri01', name: 'Rick Ankiel', pos: 'CF', bats: 'L', age: 30, pa: 240, h: 52, double: 12, triple: 1, hr: 8, bb: 21, so: 62, hbp: 2, sb: 2, cs: 1, sec: 'RF', fld: 57, arm: 77 },
      { id: 'conrabr01', name: 'Brooks Conrad', pos: '3B', bats: 'S', age: 30, pa: 177, h: 38, double: 10, triple: 2, hr: 7, bb: 14, so: 46, hbp: 1, sb: 4, cs: 1, sec: '2B', fld: 65, rk: true },
      { id: 'rossda01', name: 'David Ross', pos: 'C', bats: 'R', age: 33, pa: 145, h: 33, double: 10, triple: 1, hr: 4, bb: 21, so: 32, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 70, arm: 73 },
    ],
    pitchers: [
      { id: 'hudsoti01', name: 'Tim Hudson', role: 'SP', throws: 'R', age: 34, g: 34, gs: 34, outs: 686, h: 197, hr: 20, bb: 72, so: 140, hbp: 7, er: 75, w: 17, l: 9, sv: 0, fld: 91 },
      { id: 'hansoto01', name: 'Tommy Hanson', role: 'SP', throws: 'R', age: 23, g: 34, gs: 34, outs: 608, h: 178, hr: 15, bb: 61, so: 177, hbp: 12, er: 72, w: 10, l: 11, sv: 0, fld: 69 },
      { id: 'lowede01', name: 'Derek Lowe', role: 'SP', throws: 'R', age: 37, g: 33, gs: 33, outs: 581, h: 208, hr: 16, bb: 58, so: 127, hbp: 3, er: 88, w: 16, l: 12, sv: 0, fld: 79 },
      { id: 'jurrjja01', name: 'Jair Jurrjens', role: 'SP', throws: 'R', age: 24, g: 20, gs: 20, outs: 349, h: 113, hr: 10, bb: 42, so: 86, hbp: 2, er: 47, w: 7, l: 6, sv: 0, fld: 73 },
      { id: 'medlekr01', name: 'Kris Medlen', role: 'SP', throws: 'R', age: 24, g: 31, gs: 14, outs: 323, h: 105, hr: 11, bb: 28, so: 91, hbp: 3, er: 45, w: 6, l: 2, sv: 0, fld: 84 },
      { id: 'wagnebi02', name: 'Billy Wagner', role: 'CL', throws: 'L', age: 38, g: 71, gs: 0, outs: 208, h: 39, hr: 5, bb: 22, so: 100, hbp: 3, er: 12, w: 7, l: 2, sv: 37, fld: 79 },
      { id: 'ventejo01', name: 'Jonny Venters', role: 'RP', throws: 'L', age: 25, g: 79, gs: 0, outs: 249, h: 61, hr: 1, bb: 39, so: 93, hbp: 8, er: 18, w: 4, l: 4, sv: 1, fld: 68, rk: true },
      { id: 'moylape01', name: 'Peter Moylan', role: 'RP', throws: 'R', age: 31, g: 85, gs: 0, outs: 191, h: 55, hr: 3, bb: 34, so: 53, hbp: 2, er: 21, w: 6, l: 2, sv: 1, fld: 59 },
      { id: 'chaveje01', name: 'Jesse Chavez', role: 'RP', throws: 'R', age: 26, g: 51, gs: 0, outs: 188, h: 68, hr: 11, bb: 23, so: 46, hbp: 1, er: 36, w: 5, l: 5, sv: 0, fld: 67 },
      { id: 'saitota01', name: 'Takashi Saito', role: 'RP', throws: 'R', age: 40, g: 56, gs: 0, outs: 162, h: 43, hr: 4, bb: 19, so: 60, hbp: 2, er: 15, w: 2, l: 3, sv: 1, fld: 80 },
      { id: 'oflaher01', name: 'Eric O\'Flaherty', role: 'RP', throws: 'L', age: 25, g: 56, gs: 0, outs: 132, h: 40, hr: 2, bb: 16, so: 33, hbp: 3, er: 15, w: 3, l: 2, sv: 0, fld: 77 },
    ],
    reservePitchers: [
      { id: 'kawakke01', name: 'Kenshin Kawakami', role: 'SP', throws: 'R', age: 35, g: 18, gs: 16, outs: 262, h: 93, hr: 9, bb: 32, so: 60, hbp: 2, er: 44, w: 1, l: 10, sv: 0, fld: 85 },
      { id: 'minormi01', name: 'Mike Minor', role: 'RP', throws: 'L', age: 22, g: 9, gs: 8, outs: 122, h: 53, hr: 6, bb: 11, so: 43, hbp: 1, er: 27, w: 3, l: 2, sv: 0, fld: 70, rk: true },
      { id: 'marticr01', name: 'Cristhian Martinez', role: 'RP', throws: 'R', age: 28, g: 18, gs: 0, outs: 78, h: 27, hr: 3, bb: 7, so: 20, hbp: 0, er: 14, w: 0, l: 0, sv: 0, fld: 70, rk: true },
      { id: 'kimbrcr01', name: 'Craig Kimbrel', role: 'RP', throws: 'R', age: 22, g: 21, gs: 0, outs: 62, h: 9, hr: 0, bb: 16, so: 40, hbp: 0, er: 1, w: 4, l: 0, sv: 1, fld: 72, rk: true },
      { id: 'dunnmi01', name: 'Mike Dunn', role: 'RP', throws: 'L', age: 25, g: 25, gs: 0, outs: 57, h: 15, hr: 1, bb: 18, so: 26, hbp: 0, er: 5, w: 2, l: 0, sv: 0, fld: 92, rk: true },
    ],
  },
  // MIA (FLO 2010)
  {
    franchiseId: 'MIA',
    season: 2010,
    batters: [
      { id: 'pauliro01', name: 'Ronny Paulino', pos: 'C', bats: 'R', age: 29, pa: 344, h: 81, double: 16, triple: 0, hr: 6, bb: 28, so: 55, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 68, arm: 73 },
      { id: 'sanchga01', name: 'Gaby Sanchez', pos: '1B', bats: 'R', age: 26, pa: 643, h: 156, double: 37, triple: 3, hr: 20, bb: 57, so: 101, hbp: 5, sb: 5, cs: 0, sec: '3B', fld: 57, rk: true },
      { id: 'ugglada01', name: 'Dan Uggla', pos: '2B', bats: 'R', age: 30, pa: 674, h: 156, double: 31, triple: 1, hr: 33, bb: 84, so: 156, hbp: 5, sb: 4, cs: 2, sec: 'SS', fld: 62 },
      { id: 'cantujo01', name: 'Jorge Cantu', pos: '3B', bats: 'R', age: 28, pa: 515, h: 128, double: 31, triple: 0, hr: 14, bb: 32, so: 82, hbp: 6, sb: 2, cs: 1, sec: '1B', fld: 52 },
      { id: 'ramirha01', name: 'Hanley Ramirez', pos: 'SS', bats: 'R', age: 26, pa: 619, h: 170, double: 32, triple: 2, hr: 23, bb: 65, so: 97, hbp: 8, sb: 30, cs: 9, sec: '2B', fld: 58 },
      { id: 'coghlch01', name: 'Chris Coghlan', pos: 'LF', bats: 'L', age: 25, pa: 400, h: 105, double: 21, triple: 4, hr: 6, bb: 35, so: 70, hbp: 3, sb: 8, cs: 3, sec: 'RF', fld: 72, arm: 76 },
      { id: 'rossco01', name: 'Cody Ross', pos: 'CF', bats: 'R', age: 29, pa: 569, h: 141, double: 31, triple: 3, hr: 19, bb: 35, so: 120, hbp: 7, sb: 7, cs: 2, sec: 'RF', fld: 56, arm: 71 },
      { id: 'stantmi03', name: 'Giancarlo Stanton', pos: 'RF', bats: 'R', age: 20, pa: 396, h: 93, double: 21, triple: 1, hr: 22, bb: 34, so: 123, hbp: 2, sb: 5, cs: 2, sec: 'LF', fld: 83, arm: 79, rk: true },
      { id: 'peterbr01', name: 'Bryan Petersen', pos: 'DH', bats: 'L', age: 24, pa: 25, h: 2, double: 0, triple: 0, hr: 0, bb: 1, so: 6, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    bench: [
      { id: 'maybica01', name: 'Cameron Maybin', pos: 'CF', bats: 'R', age: 23, pa: 322, h: 71, double: 11, triple: 3, hr: 7, bb: 25, so: 89, hbp: 4, sb: 8, cs: 3, sec: 'LF', fld: 88, arm: 71 },
      { id: 'helmswe01', name: 'Wes Helms', pos: '3B', bats: 'R', age: 34, pa: 287, h: 62, double: 12, triple: 2, hr: 4, bb: 22, so: 72, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 67 },
      { id: 'morrilo01', name: 'Logan Morrison', pos: 'LF', bats: 'L', age: 22, pa: 287, h: 69, double: 20, triple: 7, hr: 2, bb: 41, so: 51, hbp: 2, sb: 0, cs: 1, sec: 'RF', fld: 68, arm: 72, rk: true },
      { id: 'bonifem01', name: 'Emilio Bonifacio', pos: 'CF', bats: 'S', age: 25, pa: 201, h: 46, double: 5, triple: 3, hr: 0, bb: 15, so: 40, hbp: 0, sb: 9, cs: 2, sec: 'LF', fld: 59, arm: 86 },
      { id: 'tracych01', name: 'Chad Tracy', pos: '3B', bats: 'L', age: 30, pa: 160, h: 36, double: 8, triple: 0, hr: 3, bb: 12, so: 28, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 73 },
    ],
    reserveBatters: [
      { id: 'davisbr03', name: 'Brad Davis', pos: 'C', bats: 'R', age: 27, pa: 123, h: 23, double: 7, triple: 1, hr: 3, bb: 9, so: 37, hbp: 1, sb: 2, cs: 0, sec: '1B', fld: 66, arm: 70, rk: true },
      { id: 'carrobr01', name: 'Brett Carroll', pos: 'RF', bats: 'R', age: 27, pa: 90, h: 17, double: 4, triple: 1, hr: 2, bb: 6, so: 24, hbp: 4, sb: 1, cs: 0, sec: 'LF', fld: 47, arm: 77 },
      { id: 'bakerjo01', name: 'John Baker', pos: 'C', bats: 'L', age: 29, pa: 88, h: 20, double: 5, triple: 0, hr: 2, bb: 9, so: 18, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 65 },
      { id: 'hayesbr01', name: 'Brett Hayes', pos: 'C', bats: 'R', age: 26, pa: 83, h: 16, double: 6, triple: 1, hr: 2, bb: 5, so: 26, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 78, arm: 74, rk: true },
      { id: 'martios01', name: 'Osvaldo Martinez', pos: 'SS', bats: 'R', age: 22, pa: 48, h: 14, double: 4, triple: 1, hr: 0, bb: 4, so: 6, hbp: 0, sb: 1, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'sanchan01', name: 'Anibal Sanchez', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 585, h: 190, hr: 14, bb: 78, so: 158, hbp: 7, er: 80, w: 13, l: 12, sv: 0, fld: 66 },
      { id: 'johnsjo09', name: 'Josh Johnson', role: 'SP', throws: 'R', age: 26, g: 28, gs: 28, outs: 551, h: 159, hr: 10, bb: 49, so: 175, hbp: 5, er: 56, w: 11, l: 6, sv: 0, fld: 68 },
      { id: 'volstch01', name: 'Chris Volstad', role: 'SP', throws: 'R', age: 23, g: 30, gs: 30, outs: 525, h: 184, hr: 21, bb: 63, so: 108, hbp: 7, er: 90, w: 12, l: 9, sv: 0, fld: 72 },
      { id: 'nolasri01', name: 'Ricky Nolasco', role: 'SP', throws: 'R', age: 27, g: 26, gs: 26, outs: 473, h: 162, hr: 22, bb: 35, so: 153, hbp: 2, er: 80, w: 14, l: 9, sv: 0, fld: 62 },
      { id: 'roberna01', name: 'Nate Robertson', role: 'SP', throws: 'L', age: 32, g: 21, gs: 18, outs: 304, h: 119, hr: 12, bb: 43, so: 64, hbp: 4, er: 67, w: 6, l: 8, sv: 0, fld: 51 },
      { id: 'nunezle01', name: 'Juan Carlos Oviedo', role: 'CL', throws: 'R', age: 28, g: 68, gs: 0, outs: 195, h: 59, hr: 7, bb: 22, so: 61, hbp: 2, er: 26, w: 4, l: 3, sv: 30, fld: 78 },
      { id: 'henslcl01', name: 'Clay Hensley', role: 'RP', throws: 'R', age: 30, g: 68, gs: 0, outs: 225, h: 55, hr: 3, bb: 31, so: 72, hbp: 4, er: 22, w: 3, l: 4, sv: 7, fld: 74 },
      { id: 'badenbu01', name: 'Burke Badenhop', role: 'RP', throws: 'R', age: 27, g: 53, gs: 0, outs: 203, h: 65, hr: 5, bb: 22, so: 49, hbp: 2, er: 31, w: 2, l: 5, sv: 1, fld: 84 },
      { id: 'sanchbr01', name: 'Brian Sanches', role: 'RP', throws: 'R', age: 31, g: 61, gs: 0, outs: 191, h: 48, hr: 6, bb: 27, so: 53, hbp: 3, er: 17, w: 2, l: 2, sv: 0, fld: 69 },
      { id: 'verasjo01', name: 'Jose Veras', role: 'RP', throws: 'R', age: 29, g: 48, gs: 0, outs: 144, h: 36, hr: 6, bb: 27, so: 47, hbp: 3, er: 22, w: 3, l: 3, sv: 0, fld: 75 },
      { id: 'sosajo02', name: 'Jorge Sosa', role: 'RP', throws: 'R', age: 32, g: 22, gs: 2, outs: 110, h: 41, hr: 5, bb: 18, so: 21, hbp: 0, er: 22, w: 2, l: 3, sv: 0, fld: 88 },
    ],
    reservePitchers: [
      { id: 'sanabal01', name: 'Alex Sanabia', role: 'SP', throws: 'R', age: 21, g: 15, gs: 12, outs: 217, h: 74, hr: 6, bb: 16, so: 47, hbp: 3, er: 30, w: 5, l: 3, sv: 0, fld: 81, rk: true },
      { id: 'millean01', name: 'Andrew Miller', role: 'RP', throws: 'L', age: 25, g: 9, gs: 7, outs: 98, h: 44, hr: 4, bb: 22, so: 29, hbp: 1, er: 25, w: 1, l: 5, sv: 0, fld: 64 },
      { id: 'woodti01', name: 'Tim Wood', role: 'RP', throws: 'R', age: 27, g: 26, gs: 0, outs: 83, h: 32, hr: 2, bb: 14, so: 14, hbp: 0, er: 14, w: 0, l: 1, sv: 1, fld: 75, rk: true },
      { id: 'mendead01', name: 'Adalberto Mendez', role: 'RP', throws: 'R', age: 28, g: 5, gs: 5, outs: 74, h: 28, hr: 7, bb: 12, so: 11, hbp: 2, er: 14, w: 1, l: 3, sv: 0, fld: 66, rk: true },
      { id: 'lerouch01', name: 'Chris Leroux', role: 'RP', throws: 'R', age: 26, g: 23, gs: 0, outs: 68, h: 29, hr: 1, bb: 14, so: 19, hbp: 0, er: 18, w: 0, l: 1, sv: 0, fld: 69, rk: true },
    ],
  },
  // NYM (NYN 2010)
  {
    franchiseId: 'NYM',
    season: 2010,
    batters: [
      { id: 'barajro01', name: 'Rod Barajas', pos: 'C', bats: 'R', age: 34, pa: 339, h: 74, double: 15, triple: 0, hr: 15, bb: 14, so: 55, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 59 },
      { id: 'davisik02', name: 'Ike Davis', pos: '1B', bats: 'L', age: 23, pa: 601, h: 138, double: 33, triple: 1, hr: 19, bb: 72, so: 138, hbp: 1, sb: 3, cs: 2, sec: '3B', fld: 73, rk: true },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 34, pa: 299, h: 67, double: 5, triple: 2, hr: 1, bb: 38, so: 28, hbp: 0, sb: 10, cs: 3, fld: 68 },
      { id: 'wrighda03', name: 'David Wright', pos: '3B', bats: 'R', age: 27, pa: 670, h: 171, double: 38, triple: 3, hr: 24, bb: 76, so: 148, hbp: 3, sb: 21, cs: 9, sec: '1B', fld: 82 },
      { id: 'reyesjo01', name: 'Jose Reyes', pos: 'SS', bats: 'S', age: 27, pa: 603, h: 158, double: 29, triple: 11, hr: 11, bb: 40, so: 64, hbp: 1, sb: 35, cs: 10, sec: '2B', fld: 63 },
      { id: 'bayja01', name: 'Jason Bay', pos: 'LF', bats: 'R', age: 31, pa: 401, h: 92, double: 19, triple: 4, hr: 15, bb: 51, so: 93, hbp: 5, sb: 8, cs: 1, sec: 'CF', fld: 59, arm: 72 },
      { id: 'paganan01', name: 'Angel Pagan', pos: 'CF', bats: 'S', age: 28, pa: 633, h: 170, double: 33, triple: 10, hr: 10, bb: 44, so: 97, hbp: 1, sb: 33, cs: 9, sec: 'LF', fld: 74, arm: 74 },
      { id: 'francje02', name: 'Jeff Francoeur', pos: 'RF', bats: 'R', age: 26, pa: 503, h: 120, double: 22, triple: 2, hr: 12, bb: 26, so: 79, hbp: 7, sb: 5, cs: 3, sec: 'LF', fld: 70, arm: 76 },
      { id: 'cartech01', name: 'Chris Carter', pos: 'DH', bats: 'L', age: 27, pa: 180, h: 43, double: 8, triple: 0, hr: 4, bb: 12, so: 20, hbp: 1, sb: 1, cs: 2, sec: 'LF', fld: 58, arm: 57, rk: true },
    ],
    bench: [
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 33, pa: 255, h: 63, double: 14, triple: 2, hr: 8, bb: 32, so: 35, hbp: 1, sb: 7, cs: 1, sec: 'LF', fld: 78, arm: 74 },
      { id: 'tejadru01', name: 'Ruben Tejada', pos: '2B', bats: 'R', age: 20, pa: 255, h: 46, double: 12, triple: 0, hr: 1, bb: 22, so: 38, hbp: 8, sb: 2, cs: 2, sec: 'SS', fld: 64, rk: true },
      { id: 'tholejo01', name: 'Josh Thole', pos: 'C', bats: 'L', age: 23, pa: 227, h: 57, double: 7, triple: 1, hr: 3, bb: 23, so: 24, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 68, arm: 85, rk: true },
      { id: 'coraal01', name: 'Alex Cora', pos: '2B', bats: 'L', age: 34, pa: 194, h: 41, double: 7, triple: 2, hr: 0, bb: 14, so: 16, hbp: 4, sb: 4, cs: 1, sec: 'SS', fld: 59 },
      { id: 'blanche01', name: 'Henry Blanco', pos: 'C', bats: 'R', age: 38, pa: 144, h: 30, double: 6, triple: 0, hr: 3, bb: 13, so: 28, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 90 },
    ],
    reserveBatters: [
      { id: 'felicje01', name: 'Jesus Feliciano', pos: 'RF', bats: 'L', age: 31, pa: 119, h: 25, double: 4, triple: 1, hr: 0, bb: 6, so: 12, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 79, arm: 64, rk: true },
      { id: 'dudalu01', name: 'Lucas Duda', pos: 'LF', bats: 'L', age: 24, pa: 92, h: 17, double: 6, triple: 0, hr: 4, bb: 6, so: 22, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 59, arm: 67, rk: true },
      { id: 'tatisfe01', name: 'Fernando Tatis', pos: '1B', bats: 'R', age: 35, pa: 72, h: 17, double: 4, triple: 1, hr: 2, bb: 5, so: 13, hbp: 1, sb: 1, cs: 0, sec: '3B' },
      { id: 'hessmmi01', name: 'Mike Hessman', pos: '3B', bats: 'R', age: 32, pa: 65, h: 8, double: 2, triple: 1, hr: 2, bb: 7, so: 22, hbp: 2, sb: 0, cs: 0, sec: '1B' },
      { id: 'matthga02', name: 'Gary Matthews', pos: 'CF', bats: 'S', age: 35, pa: 65, h: 14, double: 3, triple: 0, hr: 1, bb: 7, so: 15, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'pelfrmi01', name: 'Mike Pelfrey', role: 'SP', throws: 'R', age: 26, g: 34, gs: 33, outs: 612, h: 218, hr: 14, bb: 68, so: 113, hbp: 8, er: 92, w: 15, l: 9, sv: 1, fld: 75 },
      { id: 'santajo01', name: 'Johan Santana', role: 'SP', throws: 'L', age: 31, g: 29, gs: 29, outs: 597, h: 180, hr: 19, bb: 55, so: 159, hbp: 3, er: 65, w: 11, l: 9, sv: 0, fld: 64 },
      { id: 'dickera01', name: 'R. A. Dickey', role: 'SP', throws: 'R', age: 35, g: 27, gs: 26, outs: 523, h: 170, hr: 15, bb: 52, so: 100, hbp: 5, er: 65, w: 11, l: 9, sv: 0, fld: 96 },
      { id: 'niesejo01', name: 'Jonathon Niese', role: 'SP', throws: 'L', age: 23, g: 30, gs: 30, outs: 521, h: 192, hr: 19, bb: 63, so: 145, hbp: 8, er: 82, w: 9, l: 10, sv: 0, fld: 71, rk: true },
      { id: 'takahhi01', name: 'Hisanori Takahashi', role: 'SP', throws: 'L', age: 35, g: 53, gs: 12, outs: 366, h: 116, hr: 13, bb: 43, so: 114, hbp: 0, er: 49, w: 10, l: 6, sv: 8, fld: 66, rk: true },
      { id: 'rodrifr03', name: 'Francisco Rodriguez', role: 'CL', throws: 'R', age: 28, g: 53, gs: 0, outs: 172, h: 44, hr: 4, bb: 26, so: 63, hbp: 1, er: 17, w: 4, l: 2, sv: 25, fld: 66 },
      { id: 'felicpe01', name: 'Pedro Feliciano', role: 'RP', throws: 'L', age: 33, g: 92, gs: 0, outs: 188, h: 64, hr: 4, bb: 27, so: 61, hbp: 4, er: 24, w: 3, l: 6, sv: 0, fld: 47 },
      { id: 'valdera02', name: 'Raul Valdes', role: 'RP', throws: 'L', age: 32, g: 38, gs: 1, outs: 176, h: 59, hr: 7, bb: 27, so: 56, hbp: 4, er: 32, w: 3, l: 3, sv: 1, fld: 59, rk: true },
      { id: 'desseel01', name: 'Elmer Dessens', role: 'RP', throws: 'R', age: 39, g: 53, gs: 0, outs: 141, h: 41, hr: 5, bb: 16, so: 17, hbp: 3, er: 16, w: 4, l: 2, sv: 0, fld: 56 },
      { id: 'perezol01', name: 'Oliver Perez', role: 'RP', throws: 'L', age: 28, g: 17, gs: 7, outs: 139, h: 50, hr: 8, bb: 37, so: 44, hbp: 3, er: 32, w: 0, l: 5, sv: 0, fld: 60 },
      { id: 'nievefe01', name: 'Fernando Nieve', role: 'RP', throws: 'R', age: 27, g: 40, gs: 1, outs: 126, h: 40, hr: 8, bb: 21, so: 34, hbp: 2, er: 23, w: 2, l: 4, sv: 0, fld: 75 },
    ],
    reservePitchers: [
      { id: 'acostma01', name: 'Manny Acosta', role: 'RP', throws: 'R', age: 29, g: 41, gs: 0, outs: 119, h: 35, hr: 4, bb: 18, so: 34, hbp: 1, er: 15, w: 3, l: 2, sv: 1, fld: 76 },
      { id: 'mainejo01', name: 'John Maine', role: 'RP', throws: 'R', age: 29, g: 9, gs: 9, outs: 119, h: 40, hr: 6, bb: 22, so: 35, hbp: 2, er: 23, w: 1, l: 3, sv: 0, fld: 64 },
      { id: 'mejiaje01', name: 'Jenrry Mejia', role: 'RP', throws: 'R', age: 20, g: 33, gs: 3, outs: 117, h: 46, hr: 3, bb: 20, so: 22, hbp: 3, er: 20, w: 0, l: 4, sv: 0, fld: 76, rk: true },
      { id: 'mischpa01', name: 'Pat Misch', role: 'RP', throws: 'L', age: 28, g: 12, gs: 6, outs: 113, h: 41, hr: 5, bb: 9, so: 19, hbp: 1, er: 18, w: 0, l: 4, sv: 0, fld: 77 },
      { id: 'parnebo01', name: 'Bobby Parnell', role: 'RP', throws: 'R', age: 25, g: 41, gs: 0, outs: 105, h: 38, hr: 2, bb: 14, so: 29, hbp: 1, er: 16, w: 0, l: 1, sv: 0, fld: 61 },
    ],
  },
  // PHI (PHI 2010)
  {
    franchiseId: 'PHI',
    season: 2010,
    batters: [
      { id: 'ruizca01', name: 'Carlos Ruiz', pos: 'C', bats: 'R', age: 31, pa: 433, h: 102, double: 27, triple: 1, hr: 8, bb: 54, so: 50, hbp: 5, sb: 1, cs: 2, sec: '1B', fld: 74, arm: 71 },
      { id: 'howarry01', name: 'Ryan Howard', pos: '1B', bats: 'L', age: 30, pa: 620, h: 149, double: 26, triple: 4, hr: 36, bb: 64, so: 163, hbp: 6, sb: 3, cs: 1, sec: '3B', fld: 52 },
      { id: 'utleych01', name: 'Chase Utley', pos: '2B', bats: 'L', age: 31, pa: 511, h: 120, double: 22, triple: 3, hr: 20, bb: 61, so: 73, hbp: 18, sb: 14, cs: 1, sec: 'SS', fld: 80 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: '3B', bats: 'R', age: 34, pa: 602, h: 163, double: 28, triple: 3, hr: 7, bb: 32, so: 44, hbp: 7, sb: 6, cs: 1, sec: '2B', fld: 90 },
      { id: 'rolliji01', name: 'Jimmy Rollins', pos: 'SS', bats: 'S', age: 31, pa: 394, h: 90, double: 21, triple: 3, hr: 9, bb: 32, so: 35, hbp: 1, sb: 19, cs: 3, sec: '2B', fld: 61 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: 'LF', bats: 'L', age: 38, pa: 636, h: 156, double: 37, triple: 4, hr: 24, bb: 65, so: 114, hbp: 2, sb: 4, cs: 2, sec: 'RF', fld: 55, arm: 63 },
      { id: 'victosh01', name: 'Shane Victorino', pos: 'CF', bats: 'R', age: 29, pa: 648, h: 161, double: 30, triple: 10, hr: 14, bb: 53, so: 73, hbp: 7, sb: 31, cs: 7, sec: 'RF', fld: 76, arm: 76 },
      { id: 'werthja01', name: 'Jayson Werth', pos: 'RF', bats: 'R', age: 31, pa: 652, h: 157, double: 35, triple: 2, hr: 30, bb: 83, so: 150, hbp: 7, sb: 17, cs: 3, sec: 'LF', fld: 67, arm: 67 },
      { id: 'francbe01', name: 'Ben Francisco', pos: 'DH', bats: 'R', age: 28, pa: 197, h: 46, double: 13, triple: 0, hr: 6, bb: 16, so: 35, hbp: 3, sb: 5, cs: 2, sec: 'LF', fld: 74, arm: 79 },
    ],
    bench: [
      { id: 'valdewi01', name: 'Wilson Valdez', pos: 'SS', bats: 'R', age: 32, pa: 363, h: 86, double: 15, triple: 4, hr: 3, bb: 22, so: 42, hbp: 2, sb: 6, cs: 1, sec: '2B', fld: 80 },
      { id: 'dobbsgr01', name: 'Greg Dobbs', pos: '3B', bats: 'L', age: 31, pa: 176, h: 38, double: 7, triple: 0, hr: 5, bb: 11, so: 34, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 44 },
      { id: 'schnebr01', name: 'Brian Schneider', pos: 'C', bats: 'L', age: 33, pa: 147, h: 30, double: 5, triple: 0, hr: 3, bb: 16, so: 21, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 75, arm: 64 },
      { id: 'castrju01', name: 'Juan Castro', pos: 'SS', bats: 'R', age: 38, pa: 140, h: 28, double: 5, triple: 0, hr: 1, bb: 8, so: 25, hbp: 0, sb: 0, cs: 1, sec: '3B', fld: 60 },
      { id: 'gloadro01', name: 'Ross Gload', pos: '1B', bats: 'L', age: 34, pa: 138, h: 34, double: 6, triple: 1, hr: 3, bb: 10, so: 15, hbp: 1, sb: 1, cs: 0, sec: 'LF' },
    ],
    reserveBatters: [
      { id: 'browndo01', name: 'Domonic Brown', pos: 'RF', bats: 'L', age: 22, pa: 70, h: 13, double: 3, triple: 0, hr: 2, bb: 5, so: 24, hbp: 0, sb: 2, cs: 1, sec: 'LF', rk: true },
      { id: 'ransoco01', name: 'Cody Ransom', pos: '3B', bats: 'R', age: 34, pa: 46, h: 9, double: 3, triple: 0, hr: 1, bb: 4, so: 12, hbp: 0, sb: 1, cs: 0, sec: 'SS' },
      { id: 'sardida01', name: 'Dane Sardinha', pos: 'C', bats: 'R', age: 31, pa: 40, h: 6, double: 1, triple: 0, hr: 2, bb: 1, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'hallaro01', name: 'Roy Halladay', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 752, h: 233, hr: 23, bb: 34, so: 215, hbp: 7, er: 72, w: 21, l: 10, sv: 0, fld: 77 },
      { id: 'hamelco01', name: 'Cole Hamels', role: 'SP', throws: 'L', age: 26, g: 33, gs: 33, outs: 626, h: 195, hr: 26, bb: 54, so: 196, hbp: 6, er: 80, w: 12, l: 11, sv: 0, fld: 68 },
      { id: 'kendrky01', name: 'Kyle Kendrick', role: 'SP', throws: 'R', age: 25, g: 33, gs: 31, outs: 542, h: 200, hr: 24, bb: 53, so: 83, hbp: 6, er: 95, w: 11, l: 10, sv: 0, fld: 74 },
      { id: 'blantjo01', name: 'Joe Blanton', role: 'SP', throws: 'R', age: 29, g: 29, gs: 28, outs: 527, h: 194, hr: 26, bb: 50, so: 133, hbp: 5, er: 89, w: 9, l: 6, sv: 0, fld: 66 },
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 47, g: 19, gs: 19, outs: 335, h: 109, hr: 17, bb: 26, so: 63, hbp: 6, er: 55, w: 9, l: 9, sv: 0, fld: 60 },
      { id: 'lidgebr01', name: 'Brad Lidge', role: 'CL', throws: 'R', age: 33, g: 50, gs: 0, outs: 137, h: 39, hr: 5, bb: 23, so: 50, hbp: 2, er: 21, w: 1, l: 1, sv: 27, fld: 76 },
      { id: 'durbich01', name: 'Chad Durbin', role: 'RP', throws: 'R', age: 32, g: 64, gs: 0, outs: 206, h: 60, hr: 7, bb: 33, so: 59, hbp: 5, er: 29, w: 4, l: 1, sv: 0, fld: 67 },
      { id: 'contrjo01', name: 'Jose Contreras', role: 'RP', throws: 'R', age: 38, g: 67, gs: 0, outs: 170, h: 57, hr: 5, bb: 19, so: 45, hbp: 3, er: 27, w: 6, l: 4, sv: 4, fld: 73 },
      { id: 'madsory01', name: 'Ryan Madson', role: 'RP', throws: 'R', age: 29, g: 55, gs: 0, outs: 159, h: 46, hr: 4, bb: 14, so: 54, hbp: 2, er: 17, w: 6, l: 2, sv: 5, fld: 65 },
      { id: 'herndda01', name: 'David Herndon', role: 'RP', throws: 'R', age: 24, g: 47, gs: 0, outs: 157, h: 67, hr: 2, bb: 17, so: 29, hbp: 2, er: 25, w: 1, l: 3, sv: 0, fld: 78, rk: true },
      { id: 'baezda01', name: 'Danys Baez', role: 'RP', throws: 'R', age: 32, g: 51, gs: 0, outs: 143, h: 50, hr: 6, bb: 20, so: 29, hbp: 3, er: 27, w: 3, l: 4, sv: 0, fld: 74 },
    ],
    reservePitchers: [
      { id: 'romerjc01', name: 'J. C. Romero', role: 'RP', throws: 'L', age: 34, g: 60, gs: 0, outs: 110, h: 29, hr: 3, bb: 28, so: 30, hbp: 4, er: 14, w: 1, l: 0, sv: 3, fld: 68 },
      { id: 'bastaan01', name: 'Antonio Bastardo', role: 'RP', throws: 'L', age: 24, g: 25, gs: 0, outs: 56, h: 20, hr: 2, bb: 8, so: 21, hbp: 2, er: 11, w: 2, l: 0, sv: 0, fld: 78, rk: true },
      { id: 'worleva01', name: 'Vance Worley', role: 'RP', throws: 'R', age: 22, g: 5, gs: 2, outs: 39, h: 8, hr: 1, bb: 4, so: 12, hbp: 0, er: 2, w: 1, l: 1, sv: 0, fld: 49, rk: true },
    ],
  },
  // WSH (WAS 2010)
  {
    franchiseId: 'WSH',
    season: 2010,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 38, pa: 421, h: 104, double: 20, triple: 2, hr: 6, bb: 17, so: 73, hbp: 1, sb: 3, cs: 2, fld: 77, arm: 76 },
      { id: 'dunnad01', name: 'Adam Dunn', pos: '1B', bats: 'L', age: 30, pa: 648, h: 140, double: 31, triple: 1, hr: 38, bb: 96, so: 184, hbp: 7, sb: 0, cs: 1, sec: 'LF', fld: 64 },
      { id: 'guzmacr01', name: 'Cristian Guzman', pos: '2B', bats: 'S', age: 32, pa: 396, h: 106, double: 16, triple: 4, hr: 4, bb: 16, so: 54, hbp: 3, sb: 4, cs: 3, sec: 'SS', fld: 78 },
      { id: 'zimmery01', name: 'Ryan Zimmerman', pos: '3B', bats: 'R', age: 25, pa: 603, h: 158, double: 32, triple: 1, hr: 26, bb: 63, so: 99, hbp: 3, sb: 3, cs: 1, sec: '1B', fld: 67 },
      { id: 'desmoia01', name: 'Ian Desmond', pos: 'SS', bats: 'R', age: 24, pa: 574, h: 142, double: 29, triple: 5, hr: 11, bb: 28, so: 107, hbp: 5, sb: 16, cs: 5, sec: '2B', fld: 66, rk: true },
      { id: 'willijo03', name: 'Josh Willingham', pos: 'LF', bats: 'R', age: 31, pa: 450, h: 99, double: 22, triple: 2, hr: 18, bb: 60, so: 89, hbp: 11, sb: 6, cs: 1, sec: 'RF', fld: 65, arm: 73 },
      { id: 'morgany01', name: 'Nyjer Morgan', pos: 'CF', bats: 'L', age: 29, pa: 577, h: 140, double: 18, triple: 7, hr: 1, bb: 41, so: 86, hbp: 10, sb: 38, cs: 17, sec: 'LF', fld: 74, arm: 61 },
      { id: 'bernaro01', name: 'Roger Bernadina', pos: 'RF', bats: 'L', age: 26, pa: 461, h: 101, double: 18, triple: 3, hr: 10, bb: 36, so: 94, hbp: 4, sb: 17, cs: 3, sec: 'LF', fld: 63, arm: 73, rk: true },
      { id: 'morsemi01', name: 'Mike Morse', pos: 'DH', bats: 'R', age: 28, pa: 293, h: 76, double: 13, triple: 2, hr: 15, bb: 21, so: 67, hbp: 4, sb: 0, cs: 1, sec: 'RF', fld: 80, arm: 63 },
    ],
    bench: [
      { id: 'kennead01', name: 'Adam Kennedy', pos: '2B', bats: 'L', age: 34, pa: 389, h: 94, double: 18, triple: 1, hr: 5, bb: 32, so: 50, hbp: 3, sb: 13, cs: 3, sec: '3B', fld: 74 },
      { id: 'harriwi01', name: 'Willie Harris', pos: 'LF', bats: 'L', age: 32, pa: 262, h: 48, double: 9, triple: 3, hr: 7, bb: 35, so: 49, hbp: 4, sb: 7, cs: 2, sec: 'CF', fld: 72, arm: 57 },
      { id: 'gonzaal03', name: 'Alberto Gonzalez', pos: '2B', bats: 'R', age: 27, pa: 198, h: 47, double: 9, triple: 1, hr: 0, bb: 8, so: 23, hbp: 1, sb: 0, cs: 0, sec: 'SS' },
      { id: 'nievewi01', name: 'Wil Nieves', pos: 'C', bats: 'R', age: 32, pa: 172, h: 37, double: 6, triple: 0, hr: 2, bb: 10, so: 29, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 67 },
      { id: 'maxweju01', name: 'Justin Maxwell', pos: 'RF', bats: 'R', age: 26, pa: 131, h: 20, double: 6, triple: 0, hr: 4, bb: 22, so: 42, hbp: 0, sb: 6, cs: 1, sec: 'CF', fld: 91, arm: 87, rk: true },
    ],
    reserveBatters: [
      { id: 'espinda01', name: 'Danny Espinosa', pos: '2B', bats: 'S', age: 23, pa: 112, h: 22, double: 4, triple: 1, hr: 6, bb: 9, so: 30, hbp: 0, sb: 0, cs: 2, sec: 'SS', fld: 100, rk: true },
      { id: 'ramoswi01', name: 'Wilson Ramos', pos: 'C', bats: 'R', age: 22, pa: 82, h: 22, double: 7, triple: 0, hr: 1, bb: 2, so: 12, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 78, arm: 54, rk: true },
    ],
    pitchers: [
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 35, g: 33, gs: 33, outs: 635, h: 234, hr: 19, bb: 64, so: 107, hbp: 3, er: 105, w: 10, l: 12, sv: 0, fld: 76 },
      { id: 'lannajo01', name: 'John Lannan', role: 'SP', throws: 'L', age: 25, g: 25, gs: 25, outs: 430, h: 161, hr: 16, bb: 51, so: 73, hbp: 4, er: 69, w: 8, l: 8, sv: 0, fld: 85 },
      { id: 'stammcr01', name: 'Craig Stammen', role: 'SP', throws: 'R', age: 26, g: 35, gs: 19, outs: 384, h: 148, hr: 15, bb: 37, so: 77, hbp: 2, er: 74, w: 4, l: 4, sv: 0, fld: 68 },
      { id: 'atilalu01', name: 'Luis Atilano', role: 'SP', throws: 'R', age: 25, g: 16, gs: 16, outs: 257, h: 96, hr: 11, bb: 32, so: 40, hbp: 2, er: 49, w: 6, l: 7, sv: 0, fld: 63, rk: true },
      { id: 'olsensc01', name: 'Scott Olsen', role: 'SP', throws: 'L', age: 26, g: 17, gs: 15, outs: 243, h: 91, hr: 12, bb: 29, so: 51, hbp: 1, er: 47, w: 4, l: 8, sv: 0, fld: 65 },
      { id: 'cappsma01', name: 'Matt Capps', role: 'CL', throws: 'R', age: 26, g: 74, gs: 0, outs: 219, h: 78, hr: 8, bb: 17, so: 58, hbp: 1, er: 28, w: 5, l: 3, sv: 42, fld: 69 },
      { id: 'clippty01', name: 'Tyler Clippard', role: 'RP', throws: 'R', age: 25, g: 78, gs: 0, outs: 273, h: 66, hr: 10, bb: 44, so: 108, hbp: 2, er: 30, w: 11, l: 8, sv: 1, fld: 62 },
      { id: 'batismi01', name: 'Miguel Batista', role: 'RP', throws: 'R', age: 39, g: 58, gs: 1, outs: 248, h: 79, hr: 9, bb: 43, so: 53, hbp: 4, er: 38, w: 1, l: 2, sv: 2, fld: 76 },
      { id: 'burnese01', name: 'Sean Burnett', role: 'RP', throws: 'L', age: 27, g: 73, gs: 0, outs: 189, h: 49, hr: 5, bb: 26, so: 54, hbp: 2, er: 20, w: 1, l: 7, sv: 3, fld: 61 },
      { id: 'storedr01', name: 'Drew Storen', role: 'RP', throws: 'R', age: 22, g: 54, gs: 0, outs: 166, h: 48, hr: 3, bb: 22, so: 52, hbp: 3, er: 22, w: 4, l: 4, sv: 5, fld: 66, rk: true },
      { id: 'peraljo01', name: 'Joel Peralta', role: 'RP', throws: 'R', age: 34, g: 39, gs: 0, outs: 147, h: 37, hr: 7, bb: 12, so: 42, hbp: 2, er: 19, w: 1, l: 0, sv: 0, fld: 56 },
    ],
    reservePitchers: [
      { id: 'strasst01', name: 'Stephen Strasburg', role: 'SP', throws: 'R', age: 21, g: 12, gs: 12, outs: 204, h: 56, hr: 5, bb: 17, so: 92, hbp: 0, er: 22, w: 5, l: 3, sv: 0, fld: 82, rk: true },
      { id: 'marquja01', name: 'Jason Marquis', role: 'SP', throws: 'R', age: 31, g: 13, gs: 13, outs: 176, h: 68, hr: 6, bb: 24, so: 34, hbp: 3, er: 33, w: 2, l: 9, sv: 0, fld: 58 },
      { id: 'martijd01', name: 'J. D. Martin', role: 'RP', throws: 'R', age: 27, g: 9, gs: 9, outs: 144, h: 54, hr: 9, bb: 13, so: 27, hbp: 2, er: 23, w: 1, l: 5, sv: 0, fld: 54 },
      { id: 'slatedo01', name: 'Doug Slaten', role: 'RP', throws: 'L', age: 30, g: 49, gs: 0, outs: 122, h: 37, hr: 3, bb: 18, so: 33, hbp: 4, er: 17, w: 4, l: 1, sv: 0, fld: 71 },
      { id: 'walkety01', name: 'Tyler Walker', role: 'RP', throws: 'R', age: 34, g: 24, gs: 0, outs: 106, h: 33, hr: 5, bb: 10, so: 30, hbp: 1, er: 14, w: 1, l: 0, sv: 0, fld: 72 },
    ],
  },
  // CHC (CHN 2010)
  {
    franchiseId: 'CHC',
    season: 2010,
    batters: [
      { id: 'sotoge01', name: 'Geovany Soto', pos: 'C', bats: 'R', age: 27, pa: 387, h: 86, double: 20, triple: 1, hr: 15, bb: 54, so: 81, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 77, arm: 65 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 34, pa: 626, h: 153, double: 36, triple: 1, hr: 24, bb: 73, so: 122, hbp: 2, sb: 2, cs: 2, fld: 79 },
      { id: 'theriry01', name: 'Ryan Theriot', pos: '2B', bats: 'R', age: 30, pa: 640, h: 162, double: 17, triple: 3, hr: 3, bb: 48, so: 76, hbp: 4, sb: 20, cs: 10, sec: 'SS', fld: 59 },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 32, pa: 507, h: 123, double: 24, triple: 1, hr: 23, bb: 41, so: 80, hbp: 6, sb: 1, cs: 1, sec: '1B', fld: 54 },
      { id: 'castrst01', name: 'Starlin Castro', pos: 'SS', bats: 'R', age: 20, pa: 506, h: 139, double: 31, triple: 5, hr: 3, bb: 29, so: 71, hbp: 6, sb: 10, cs: 8, sec: '2B', fld: 62, rk: true },
      { id: 'soriaal01', name: 'Alfonso Soriano', pos: 'LF', bats: 'R', age: 34, pa: 548, h: 127, double: 34, triple: 2, hr: 24, bb: 44, so: 122, hbp: 3, sb: 9, cs: 2, sec: 'CF', fld: 55, arm: 68 },
      { id: 'byrdma01', name: 'Marlon Byrd', pos: 'CF', bats: 'R', age: 32, pa: 630, h: 167, double: 41, triple: 2, hr: 15, bb: 36, so: 98, hbp: 14, sb: 7, cs: 2, sec: 'LF', fld: 77, arm: 67 },
      { id: 'fukudko01', name: 'Kosuke Fukudome', pos: 'RF', bats: 'L', age: 33, pa: 429, h: 93, double: 22, triple: 3, hr: 10, bb: 64, so: 74, hbp: 1, sb: 6, cs: 7, sec: 'CF', fld: 75, arm: 65 },
      { id: 'nadyxa01', name: 'Xavier Nady', pos: 'DH', bats: 'R', age: 31, pa: 347, h: 87, double: 17, triple: 0, hr: 9, bb: 19, so: 75, hbp: 7, sb: 0, cs: 0, sec: 'RF', fld: 80 },
    ],
    bench: [
      { id: 'colvity01', name: 'Tyler Colvin', pos: 'RF', bats: 'L', age: 24, pa: 394, h: 90, double: 17, triple: 5, hr: 19, bb: 30, so: 100, hbp: 3, sb: 6, cs: 1, sec: 'LF', fld: 62, arm: 65, rk: true },
      { id: 'fontemi01', name: 'Mike Fontenot', pos: '2B', bats: 'L', age: 30, pa: 261, h: 62, double: 14, triple: 2, hr: 4, bb: 20, so: 47, hbp: 2, sb: 2, cs: 2, sec: '3B', fld: 58 },
      { id: 'hillko01', name: 'Koyie Hill', pos: 'C', bats: 'S', age: 31, pa: 231, h: 47, double: 12, triple: 1, hr: 1, bb: 16, so: 63, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 70, arm: 61 },
      { id: 'bakerje03', name: 'Jeff Baker', pos: '3B', bats: 'R', age: 29, pa: 224, h: 56, double: 14, triple: 2, hr: 5, bb: 16, so: 51, hbp: 1, sb: 1, cs: 0, sec: '2B', fld: 69 },
      { id: 'barneda01', name: 'Darwin Barney', pos: 'SS', bats: 'R', age: 24, pa: 85, h: 19, double: 4, triple: 0, hr: 0, bb: 6, so: 12, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
    ],
    reserveBatters: [
      { id: 'hoffpmi01', name: 'Micah Hoffpauir', pos: '1B', bats: 'L', age: 30, pa: 57, h: 12, double: 3, triple: 0, hr: 2, bb: 5, so: 12, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
    ],
    pitchers: [
      { id: 'dempsry01', name: 'Ryan Dempster', role: 'SP', throws: 'R', age: 33, g: 34, gs: 34, outs: 646, h: 201, hr: 23, bb: 80, so: 200, hbp: 8, er: 88, w: 15, l: 12, sv: 0, fld: 75 },
      { id: 'wellsra01', name: 'Randy Wells', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 583, h: 205, hr: 18, bb: 61, so: 137, hbp: 6, er: 83, w: 8, l: 14, sv: 0, fld: 70 },
      { id: 'lillyte01', name: 'Ted Lilly', role: 'SP', throws: 'L', age: 34, g: 30, gs: 30, outs: 581, h: 167, hr: 29, bb: 45, so: 167, hbp: 4, er: 76, w: 10, l: 12, sv: 0, fld: 63 },
      { id: 'gorzeto01', name: 'Tom Gorzelanny', role: 'SP', throws: 'L', age: 27, g: 29, gs: 23, outs: 409, h: 138, hr: 14, bb: 69, so: 115, hbp: 2, er: 72, w: 7, l: 9, sv: 1, fld: 64 },
      { id: 'zambrca01', name: 'Carlos Zambrano', role: 'SP', throws: 'R', age: 29, g: 36, gs: 20, outs: 389, h: 120, hr: 8, bb: 62, so: 113, hbp: 6, er: 53, w: 11, l: 6, sv: 0, fld: 73 },
      { id: 'marmoca01', name: 'Carlos Marmol', role: 'CL', throws: 'R', age: 27, g: 77, gs: 0, outs: 233, h: 40, hr: 3, bb: 54, so: 117, hbp: 9, er: 24, w: 2, l: 3, sv: 38, fld: 83 },
      { id: 'marshse01', name: 'Sean Marshall', role: 'RP', throws: 'L', age: 27, g: 80, gs: 0, outs: 224, h: 65, hr: 6, bb: 25, so: 73, hbp: 2, er: 28, w: 7, l: 5, sv: 1, fld: 78 },
      { id: 'colemca01', name: 'Casey Coleman', role: 'RP', throws: 'R', age: 22, g: 12, gs: 8, outs: 171, h: 56, hr: 3, bb: 25, so: 27, hbp: 2, er: 26, w: 4, l: 2, sv: 0, fld: 76, rk: true },
      { id: 'cashnan01', name: 'Andrew Cashner', role: 'RP', throws: 'R', age: 23, g: 53, gs: 0, outs: 163, h: 55, hr: 8, bb: 30, so: 50, hbp: 4, er: 29, w: 2, l: 6, sv: 0, fld: 74, rk: true },
      { id: 'russeja02', name: 'James Russell', role: 'RP', throws: 'L', age: 24, g: 57, gs: 0, outs: 147, h: 55, hr: 11, bb: 11, so: 42, hbp: 4, er: 27, w: 1, l: 1, sv: 0, fld: 69, rk: true },
      { id: 'bergju01', name: 'Justin Berg', role: 'RP', throws: 'R', age: 26, g: 41, gs: 0, outs: 120, h: 44, hr: 3, bb: 18, so: 16, hbp: 3, er: 20, w: 0, l: 1, sv: 0, fld: 71, rk: true },
    ],
    reservePitchers: [
      { id: 'silvaca01', name: 'Carlos Silva', role: 'SP', throws: 'R', age: 31, g: 21, gs: 21, outs: 339, h: 130, hr: 12, bb: 25, so: 65, hbp: 6, er: 65, w: 10, l: 6, sv: 0, fld: 55 },
      { id: 'howrybo01', name: 'Bob Howry', role: 'RP', throws: 'R', age: 36, g: 38, gs: 0, outs: 105, h: 41, hr: 6, bb: 12, so: 24, hbp: 1, er: 22, w: 1, l: 3, sv: 0, fld: 48 },
      { id: 'diamoth01', name: 'Thomas Diamond', role: 'RP', throws: 'R', age: 27, g: 16, gs: 3, outs: 87, h: 33, hr: 5, bb: 18, so: 36, hbp: 2, er: 22, w: 1, l: 3, sv: 0, fld: 67, rk: true },
      { id: 'grabojo02', name: 'John Grabow', role: 'RP', throws: 'L', age: 31, g: 28, gs: 0, outs: 77, h: 27, hr: 3, bb: 15, so: 22, hbp: 1, er: 13, w: 1, l: 3, sv: 0, fld: 72 },
      { id: 'mateoma01', name: 'Marcos Mateo', role: 'RP', throws: 'R', age: 26, g: 21, gs: 0, outs: 65, h: 20, hr: 6, bb: 9, so: 26, hbp: 1, er: 14, w: 0, l: 1, sv: 0, fld: 77, rk: true },
    ],
  },
  // CIN (CIN 2010)
  {
    franchiseId: 'CIN',
    season: 2010,
    batters: [
      { id: 'hernara02', name: 'Ramon Hernandez', pos: 'C', bats: 'R', age: 34, pa: 352, h: 86, double: 16, triple: 1, hr: 7, bb: 29, so: 44, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 76 },
      { id: 'vottojo01', name: 'Joey Votto', pos: '1B', bats: 'L', age: 26, pa: 648, h: 177, double: 39, triple: 2, hr: 33, bb: 84, so: 123, hbp: 6, sb: 11, cs: 4, sec: '3B', fld: 84 },
      { id: 'phillbr01', name: 'Brandon Phillips', pos: '2B', bats: 'R', age: 29, pa: 687, h: 171, double: 32, triple: 6, hr: 20, bb: 46, so: 85, hbp: 7, sb: 21, cs: 11, sec: 'SS', fld: 74 },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 35, pa: 537, h: 136, double: 35, triple: 2, hr: 16, bb: 49, so: 75, hbp: 8, sb: 3, cs: 2, fld: 87 },
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 35, pa: 537, h: 136, double: 29, triple: 1, hr: 5, bb: 30, so: 53, hbp: 1, sb: 11, cs: 4, sec: '2B', fld: 60 },
      { id: 'gomesjo01', name: 'Jonny Gomes', pos: 'LF', bats: 'R', age: 29, pa: 571, h: 133, double: 25, triple: 2, hr: 23, bb: 42, so: 133, hbp: 12, sb: 7, cs: 3, sec: 'RF', fld: 61, arm: 69 },
      { id: 'stubbdr01', name: 'Drew Stubbs', pos: 'CF', bats: 'R', age: 25, pa: 583, h: 133, double: 18, triple: 5, hr: 22, bb: 53, so: 164, hbp: 4, sb: 30, cs: 7, sec: 'LF', fld: 80, arm: 69 },
      { id: 'bruceja01', name: 'Jay Bruce', pos: 'RF', bats: 'L', age: 23, pa: 573, h: 134, double: 23, triple: 4, hr: 27, bb: 55, so: 130, hbp: 2, sb: 5, cs: 5, sec: 'CF', fld: 95, arm: 67 },
      { id: 'cairomi01', name: 'Miguel Cairo', pos: 'DH', bats: 'R', age: 36, pa: 226, h: 56, double: 12, triple: 1, hr: 3, bb: 15, so: 29, hbp: 4, sb: 4, cs: 0, sec: '3B', fld: 41 },
    ],
    bench: [
      { id: 'hanigry01', name: 'Ryan Hanigan', pos: 'C', bats: 'R', age: 29, pa: 243, h: 58, double: 8, triple: 0, hr: 4, bb: 31, so: 23, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 73, arm: 74 },
      { id: 'janispa01', name: 'Paul Janish', pos: 'SS', bats: 'R', age: 27, pa: 228, h: 47, double: 12, triple: 0, hr: 3, bb: 21, so: 32, hbp: 3, sb: 1, cs: 2, sec: '3B', fld: 76 },
      { id: 'heisech01', name: 'Chris Heisey', pos: 'LF', bats: 'R', age: 25, pa: 226, h: 51, double: 10, triple: 1, hr: 8, bb: 16, so: 57, hbp: 6, sb: 1, cs: 2, sec: 'RF', fld: 79, arm: 66, rk: true },
      { id: 'nixla01', name: 'Laynce Nix', pos: 'LF', bats: 'L', age: 29, pa: 182, h: 43, double: 13, triple: 1, hr: 6, bb: 13, so: 42, hbp: 1, sb: 0, cs: 1, sec: 'CF', fld: 71, arm: 77 },
      { id: 'milleco01', name: 'Corky Miller', pos: 'C', bats: 'R', age: 34, pa: 79, h: 14, double: 3, triple: 0, hr: 1, bb: 5, so: 16, hbp: 1, sb: 0, cs: 0, fld: 84, arm: 70 },
    ],
    reserveBatters: [
      { id: 'francju02', name: 'Juan Francisco', pos: '3B', bats: 'L', age: 23, pa: 59, h: 16, double: 3, triple: 0, hr: 1, bb: 5, so: 19, hbp: 1, sb: 0, cs: 1, sec: '1B', rk: true },
      { id: 'valaich01', name: 'Chris Valaika', pos: '2B', bats: 'R', age: 24, pa: 40, h: 10, double: 1, triple: 0, hr: 1, bb: 1, so: 9, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'arroybr01', name: 'Bronson Arroyo', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 647, h: 198, hr: 29, bb: 61, so: 128, hbp: 7, er: 94, w: 17, l: 10, sv: 0, fld: 79 },
      { id: 'cuetojo01', name: 'Johnny Cueto', role: 'SP', throws: 'R', age: 24, g: 31, gs: 31, outs: 557, h: 181, hr: 23, bb: 61, so: 142, hbp: 12, er: 83, w: 12, l: 7, sv: 0, fld: 73 },
      { id: 'leakemi01', name: 'Mike Leake', role: 'SP', throws: 'R', age: 22, g: 24, gs: 22, outs: 415, h: 158, hr: 19, bb: 49, so: 91, hbp: 3, er: 65, w: 8, l: 4, sv: 0, fld: 83, rk: true },
      { id: 'haranaa01', name: 'Aaron Harang', role: 'SP', throws: 'R', age: 32, g: 22, gs: 20, outs: 335, h: 135, hr: 18, bb: 34, so: 93, hbp: 3, er: 61, w: 6, l: 7, sv: 0, fld: 62 },
      { id: 'baileho02', name: 'Homer Bailey', role: 'SP', throws: 'R', age: 24, g: 19, gs: 19, outs: 327, h: 112, hr: 12, bb: 44, so: 89, hbp: 3, er: 56, w: 4, l: 3, sv: 0, fld: 73 },
      { id: 'cordefr01', name: 'Francisco Cordero', role: 'CL', throws: 'R', age: 35, g: 75, gs: 0, outs: 218, h: 66, hr: 4, bb: 36, so: 65, hbp: 2, er: 26, w: 6, l: 5, sv: 40, fld: 54 },
      { id: 'masseni01', name: 'Nick Masset', role: 'RP', throws: 'R', age: 28, g: 82, gs: 0, outs: 230, h: 65, hr: 7, bb: 30, so: 76, hbp: 1, er: 27, w: 4, l: 4, sv: 2, fld: 78 },
      { id: 'ondrulo01', name: 'Logan Ondrusek', role: 'RP', throws: 'R', age: 25, g: 60, gs: 0, outs: 176, h: 49, hr: 7, bb: 20, so: 39, hbp: 0, er: 24, w: 5, l: 0, sv: 0, fld: 68, rk: true },
      { id: 'rhodear01', name: 'Arthur Rhodes', role: 'RP', throws: 'L', age: 40, g: 69, gs: 0, outs: 165, h: 38, hr: 3, bb: 20, so: 51, hbp: 1, er: 14, w: 4, l: 4, sv: 0, fld: 76 },
      { id: 'lecursa01', name: 'Sam LeCure', role: 'RP', throws: 'R', age: 26, g: 15, gs: 6, outs: 144, h: 50, hr: 6, bb: 25, so: 37, hbp: 5, er: 24, w: 2, l: 5, sv: 0, fld: 49, rk: true },
      { id: 'smithjo06', name: 'Jordan Smith', role: 'RP', throws: 'R', age: 24, g: 37, gs: 0, outs: 126, h: 45, hr: 7, bb: 11, so: 26, hbp: 2, er: 18, w: 3, l: 2, sv: 1, fld: 70, rk: true },
    ],
    reservePitchers: [
      { id: 'woodtr01', name: 'Travis Wood', role: 'SP', throws: 'L', age: 23, g: 17, gs: 17, outs: 308, h: 85, hr: 9, bb: 26, so: 86, hbp: 4, er: 40, w: 5, l: 4, sv: 0, fld: 55, rk: true },
      { id: 'volqued01', name: 'Edinson Volquez', role: 'SP', throws: 'R', age: 26, g: 12, gs: 12, outs: 188, h: 54, hr: 6, bb: 35, so: 66, hbp: 4, er: 27, w: 4, l: 3, sv: 0, fld: 54 },
      { id: 'owingmi01', name: 'Micah Owings', role: 'RP', throws: 'R', age: 27, g: 22, gs: 0, outs: 100, h: 33, hr: 4, bb: 19, so: 25, hbp: 3, er: 21, w: 3, l: 2, sv: 0, fld: 62 },
      { id: 'braybi01', name: 'Bill Bray', role: 'RP', throws: 'L', age: 27, g: 35, gs: 0, outs: 85, h: 23, hr: 3, bb: 11, so: 30, hbp: 0, er: 11, w: 0, l: 2, sv: 0, fld: 92 },
      { id: 'herreda01', name: 'Danny Herrera', role: 'RP', throws: 'L', age: 25, g: 36, gs: 0, outs: 69, h: 27, hr: 2, bb: 8, so: 16, hbp: 1, er: 9, w: 1, l: 3, sv: 0, fld: 78 },
    ],
  },
  // MIL (MIL 2010)
  {
    franchiseId: 'MIL',
    season: 2010,
    batters: [
      { id: 'lucrojo01', name: 'Jonathan Lucroy', pos: 'C', bats: 'R', age: 24, pa: 297, h: 70, double: 9, triple: 0, hr: 4, bb: 18, so: 44, hbp: 1, sb: 4, cs: 2, sec: '1B', fld: 76, arm: 74, rk: true },
      { id: 'fieldpr01', name: 'Prince Fielder', pos: '1B', bats: 'L', age: 26, pa: 714, h: 162, double: 29, triple: 1, hr: 37, bb: 108, so: 138, hbp: 16, sb: 2, cs: 1, sec: '3B', fld: 69 },
      { id: 'weeksri01', name: 'Rickie Weeks', pos: '2B', bats: 'R', age: 27, pa: 754, h: 172, double: 31, triple: 6, hr: 29, bb: 76, so: 179, hbp: 23, sb: 13, cs: 5, sec: 'SS', fld: 64 },
      { id: 'mcgehca01', name: 'Casey McGehee', pos: '3B', bats: 'R', age: 27, pa: 670, h: 176, double: 37, triple: 1, hr: 24, bb: 52, so: 106, hbp: 2, sb: 1, cs: 2, sec: '2B', fld: 65 },
      { id: 'escobal02', name: 'Alcides Escobar', pos: 'SS', bats: 'R', age: 23, pa: 552, h: 125, double: 14, triple: 9, hr: 4, bb: 33, so: 71, hbp: 4, sb: 11, cs: 5, sec: '2B', fld: 60 },
      { id: 'braunry02', name: 'Ryan Braun', pos: 'LF', bats: 'R', age: 26, pa: 684, h: 189, double: 42, triple: 4, hr: 29, bb: 54, so: 114, hbp: 8, sb: 16, cs: 4, sec: 'RF', fld: 70, arm: 66 },
      { id: 'gomezca01', name: 'Carlos Gomez', pos: 'CF', bats: 'R', age: 24, pa: 318, h: 71, double: 12, triple: 4, hr: 4, bb: 17, so: 70, hbp: 4, sb: 16, cs: 5, sec: 'LF', fld: 48, arm: 64 },
      { id: 'hartco01', name: 'Corey Hart', pos: 'RF', bats: 'R', age: 28, pa: 614, h: 153, double: 35, triple: 4, hr: 24, bb: 44, so: 127, hbp: 6, sb: 12, cs: 7, sec: 'CF', fld: 72, arm: 67 },
      { id: 'edmonji01', name: 'Jim Edmonds', pos: 'DH', bats: 'L', age: 40, pa: 272, h: 63, double: 20, triple: 0, hr: 12, bb: 28, so: 59, hbp: 1, sb: 2, cs: 0, sec: 'LF', fld: 91, arm: 84 },
    ],
    bench: [
      { id: 'kottage01', name: 'George Kottaras', pos: 'C', bats: 'L', age: 27, pa: 250, h: 45, double: 15, triple: 1, hr: 7, bb: 31, so: 47, hbp: 0, sb: 2, cs: 0, sec: '1B', fld: 69, arm: 59, rk: true },
      { id: 'counscr01', name: 'Craig Counsell', pos: 'SS', bats: 'L', age: 39, pa: 230, h: 53, double: 10, triple: 2, hr: 2, bb: 23, so: 29, hbp: 2, sb: 1, cs: 1, sec: '2B', fld: 57 },
      { id: 'inglejo01', name: 'Joe Inglett', pos: 'RF', bats: 'L', age: 32, pa: 160, h: 39, double: 7, triple: 4, hr: 1, bb: 13, so: 28, hbp: 2, sb: 3, cs: 1, sec: 'LF', fld: 59, arm: 83 },
      { id: 'cainlo01', name: 'Lorenzo Cain', pos: 'CF', bats: 'R', age: 24, pa: 158, h: 45, double: 11, triple: 1, hr: 1, bb: 9, so: 28, hbp: 1, sb: 7, cs: 1, sec: 'LF', fld: 79, arm: 77, rk: true },
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 39, pa: 117, h: 26, double: 6, triple: 0, hr: 3, bb: 13, so: 16, hbp: 2, sb: 0, cs: 0, fld: 77, arm: 67 },
    ],
    reserveBatters: [
      { id: 'dickech01', name: 'Chris Dickerson', pos: 'CF', bats: 'L', age: 28, pa: 106, h: 24, double: 4, triple: 1, hr: 1, bb: 12, so: 27, hbp: 0, sb: 4, cs: 1, sec: 'LF', fld: 63, arm: 57 },
      { id: 'gerutjo01', name: 'Jody Gerut', pos: 'CF', bats: 'L', age: 32, pa: 74, h: 17, double: 3, triple: 0, hr: 2, bb: 5, so: 12, hbp: 0, sb: 1, cs: 1, sec: 'RF' },
    ],
    pitchers: [
      { id: 'wolfra02', name: 'Randy Wolf', role: 'SP', throws: 'L', age: 33, g: 34, gs: 34, outs: 647, h: 207, hr: 27, bb: 78, so: 158, hbp: 9, er: 95, w: 13, l: 12, sv: 0, fld: 82 },
      { id: 'gallayo01', name: 'Yovani Gallardo', role: 'SP', throws: 'R', age: 24, g: 31, gs: 31, outs: 555, h: 167, hr: 16, bb: 82, so: 201, hbp: 4, er: 77, w: 14, l: 7, sv: 0, fld: 72 },
      { id: 'bushda01', name: 'Dave Bush', role: 'SP', throws: 'R', age: 30, g: 32, gs: 31, outs: 523, h: 192, hr: 28, bb: 60, so: 114, hbp: 10, er: 96, w: 8, l: 13, sv: 0, fld: 58 },
      { id: 'narvech01', name: 'Chris Narveson', role: 'SP', throws: 'L', age: 28, g: 37, gs: 28, outs: 503, h: 171, hr: 22, bb: 59, so: 142, hbp: 5, er: 90, w: 12, l: 9, sv: 0, fld: 68 },
      { id: 'parrama01', name: 'Manny Parra', role: 'SP', throws: 'L', age: 27, g: 42, gs: 16, outs: 366, h: 140, hr: 16, bb: 62, so: 114, hbp: 2, er: 72, w: 3, l: 10, sv: 0, fld: 58 },
      { id: 'axforjo01', name: 'John Axford', role: 'CL', throws: 'R', age: 27, g: 50, gs: 0, outs: 174, h: 41, hr: 1, bb: 28, so: 75, hbp: 1, er: 16, w: 8, l: 2, sv: 24, fld: 65, rk: true },
      { id: 'capuach01', name: 'Chris Capuano', role: 'RP', throws: 'L', age: 31, g: 24, gs: 9, outs: 198, h: 65, hr: 9, bb: 21, so: 54, hbp: 1, er: 29, w: 4, l: 4, sv: 0, fld: 67 },
      { id: 'coffeto01', name: 'Todd Coffey', role: 'RP', throws: 'R', age: 29, g: 69, gs: 0, outs: 187, h: 63, hr: 7, bb: 20, so: 53, hbp: 3, er: 28, w: 2, l: 4, sv: 0, fld: 61 },
      { id: 'loeka01', name: 'Kameron Loe', role: 'RP', throws: 'R', age: 28, g: 53, gs: 0, outs: 175, h: 56, hr: 6, bb: 15, so: 44, hbp: 2, er: 18, w: 3, l: 5, sv: 0, fld: 88 },
      { id: 'villaca01', name: 'Carlos Villanueva', role: 'RP', throws: 'R', age: 26, g: 50, gs: 0, outs: 158, h: 53, hr: 7, bb: 19, so: 53, hbp: 2, er: 28, w: 2, l: 0, sv: 1, fld: 72 },
      { id: 'hoffmtr01', name: 'Trevor Hoffman', role: 'RP', throws: 'R', age: 42, g: 50, gs: 0, outs: 142, h: 43, hr: 6, bb: 16, so: 39, hbp: 0, er: 23, w: 2, l: 7, sv: 10, fld: 85 },
    ],
    reservePitchers: [
      { id: 'davisdo02', name: 'Doug Davis', role: 'RP', throws: 'L', age: 34, g: 8, gs: 8, outs: 115, h: 46, hr: 5, bb: 21, so: 32, hbp: 1, er: 22, w: 1, l: 4, sv: 0, fld: 73 },
      { id: 'braddza01', name: 'Zach Braddock', role: 'RP', throws: 'L', age: 22, g: 46, gs: 0, outs: 101, h: 29, hr: 1, bb: 19, so: 41, hbp: 2, er: 11, w: 1, l: 2, sv: 0, fld: 88, rk: true },
      { id: 'riskeda01', name: 'David Riske', role: 'RP', throws: 'R', age: 33, g: 23, gs: 0, outs: 70, h: 26, hr: 2, bb: 10, so: 15, hbp: 1, er: 14, w: 0, l: 0, sv: 0, fld: 61 },
      { id: 'mcclemi01', name: 'Mike McClendon', role: 'RP', throws: 'R', age: 25, g: 17, gs: 0, outs: 63, h: 15, hr: 2, bb: 7, so: 21, hbp: 0, er: 7, w: 2, l: 0, sv: 0, fld: 62, rk: true },
      { id: 'vargacl01', name: 'Claudio Vargas', role: 'RP', throws: 'R', age: 32, g: 17, gs: 0, outs: 59, h: 21, hr: 2, bb: 9, so: 17, hbp: 1, er: 10, w: 1, l: 0, sv: 0, fld: 69 },
    ],
  },
  // PIT (PIT 2010)
  {
    franchiseId: 'PIT',
    season: 2010,
    batters: [
      { id: 'doumiry01', name: 'Ryan Doumit', pos: 'C', bats: 'S', age: 29, pa: 456, h: 109, double: 25, triple: 1, hr: 14, bb: 35, so: 77, hbp: 6, sb: 2, cs: 0, sec: '1B', fld: 63, arm: 56 },
      { id: 'jonesga02', name: 'Garrett Jones', pos: '1B', bats: 'L', age: 29, pa: 654, h: 152, double: 35, triple: 1, hr: 26, bb: 58, so: 127, hbp: 1, sb: 10, cs: 3, sec: 'LF', fld: 74 },
      { id: 'walkene01', name: 'Neil Walker', pos: '2B', bats: 'S', age: 24, pa: 469, h: 124, double: 28, triple: 3, hr: 11, bb: 35, so: 85, hbp: 3, sb: 3, cs: 3, sec: '3B', fld: 63, rk: true },
      { id: 'alvarpe01', name: 'Pedro Alvarez', pos: '3B', bats: 'L', age: 23, pa: 386, h: 89, double: 21, triple: 1, hr: 16, bb: 37, so: 119, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 80, rk: true },
      { id: 'cedenro02', name: 'Ronny Cedeno', pos: 'SS', bats: 'R', age: 27, pa: 502, h: 113, double: 23, triple: 3, hr: 9, bb: 25, so: 104, hbp: 3, sb: 10, cs: 3, sec: '2B', fld: 69 },
      { id: 'tabatjo01', name: 'Jose Tabata', pos: 'LF', bats: 'R', age: 21, pa: 441, h: 121, double: 21, triple: 4, hr: 4, bb: 28, so: 57, hbp: 2, sb: 19, cs: 7, sec: 'CF', fld: 83, arm: 69, rk: true },
      { id: 'mccutan01', name: 'Andrew McCutchen', pos: 'CF', bats: 'R', age: 23, pa: 653, h: 163, double: 35, triple: 7, hr: 16, bb: 71, so: 96, hbp: 4, sb: 32, cs: 9, sec: 'LF', fld: 72, arm: 70 },
      { id: 'millela02', name: 'Lastings Milledge', pos: 'RF', bats: 'R', age: 25, pa: 412, h: 103, double: 19, triple: 2, hr: 6, bb: 26, so: 66, hbp: 5, sb: 9, cs: 5, sec: 'LF', fld: 76, arm: 71 },
      { id: 'larocan01', name: 'Andy LaRoche', pos: 'DH', bats: 'R', age: 26, pa: 271, h: 56, double: 11, triple: 1, hr: 5, bb: 22, so: 40, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 86 },
    ],
    bench: [
      { id: 'churcry01', name: 'Ryan Church', pos: 'RF', bats: 'L', age: 31, pa: 238, h: 53, double: 15, triple: 1, hr: 4, bb: 19, so: 50, hbp: 2, sb: 2, cs: 1, sec: 'LF', fld: 88, arm: 82 },
      { id: 'iwamuak01', name: 'Akinori Iwamura', pos: '2B', bats: 'L', age: 31, pa: 229, h: 49, double: 10, triple: 2, hr: 2, bb: 25, so: 41, hbp: 1, sb: 4, cs: 1, sec: '3B', fld: 59 },
      { id: 'youngde04', name: 'Delwyn Young', pos: 'RF', bats: 'S', age: 28, pa: 207, h: 48, double: 10, triple: 1, hr: 5, bb: 15, so: 50, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 52, arm: 82 },
      { id: 'crosbbo01', name: 'Bobby Crosby', pos: 'SS', bats: 'R', age: 30, pa: 189, h: 38, double: 10, triple: 1, hr: 2, bb: 16, so: 33, hbp: 1, sb: 1, cs: 2, sec: '3B', fld: 69 },
      { id: 'clemeje01', name: 'Jeff Clement', pos: '1B', bats: 'L', age: 26, pa: 153, h: 30, double: 4, triple: 0, hr: 6, bb: 7, so: 39, hbp: 2, sb: 0, cs: 0, sec: '3B', fld: 64 },
    ],
    reserveBatters: [
      { id: 'jaramja01', name: 'Jason Jaramillo', pos: 'C', bats: 'S', age: 27, pa: 97, h: 19, double: 4, triple: 0, hr: 1, bb: 8, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 77 },
    ],
    pitchers: [
      { id: 'maholpa01', name: 'Paul Maholm', role: 'SP', throws: 'L', age: 28, g: 32, gs: 32, outs: 556, h: 218, hr: 15, bb: 61, so: 112, hbp: 8, er: 97, w: 9, l: 15, sv: 0, fld: 76 },
      { id: 'dukeza01', name: 'Zach Duke', role: 'SP', throws: 'L', age: 27, g: 29, gs: 29, outs: 477, h: 201, hr: 21, bb: 45, so: 89, hbp: 4, er: 90, w: 8, l: 15, sv: 0, fld: 77 },
      { id: 'karstje01', name: 'Jeff Karstens', role: 'SP', throws: 'R', age: 27, g: 26, gs: 19, outs: 368, h: 139, hr: 18, bb: 35, so: 66, hbp: 1, er: 68, w: 3, l: 10, sv: 0, fld: 81 },
      { id: 'ohlenro01', name: 'Ross Ohlendorf', role: 'SP', throws: 'R', age: 27, g: 21, gs: 21, outs: 325, h: 108, hr: 14, bb: 40, so: 74, hbp: 5, er: 51, w: 1, l: 11, sv: 0, fld: 53 },
      { id: 'mortoch02', name: 'Charlie Morton', role: 'SP', throws: 'R', age: 26, g: 17, gs: 17, outs: 239, h: 100, hr: 11, bb: 32, so: 56, hbp: 5, er: 57, w: 2, l: 12, sv: 0, fld: 60 },
      { id: 'doteloc01', name: 'Octavio Dotel', role: 'CL', throws: 'R', age: 36, g: 68, gs: 0, outs: 192, h: 53, hr: 9, bb: 33, so: 78, hbp: 2, er: 27, w: 3, l: 4, sv: 22, fld: 85 },
      { id: 'meekev01', name: 'Evan Meek', role: 'RP', throws: 'R', age: 27, g: 70, gs: 0, outs: 240, h: 54, hr: 5, bb: 37, so: 68, hbp: 3, er: 23, w: 5, l: 4, sv: 4, fld: 78 },
      { id: 'carradj01', name: 'D. J. Carrasco', role: 'RP', throws: 'R', age: 33, g: 63, gs: 0, outs: 235, h: 75, hr: 5, bb: 29, so: 59, hbp: 4, er: 32, w: 3, l: 2, sv: 0, fld: 67 },
      { id: 'hanrajo01', name: 'Joel Hanrahan', role: 'RP', throws: 'R', age: 28, g: 72, gs: 0, outs: 209, h: 63, hr: 5, bb: 30, so: 86, hbp: 3, er: 30, w: 4, l: 1, sv: 6, fld: 75 },
      { id: 'mccutda01', name: 'Daniel McCutchen', role: 'RP', throws: 'R', age: 27, g: 28, gs: 9, outs: 203, h: 81, hr: 13, bb: 26, so: 38, hbp: 2, er: 43, w: 2, l: 5, sv: 0, fld: 68, rk: true },
      { id: 'gallase01', name: 'Sean Gallagher', role: 'RP', throws: 'R', age: 24, g: 46, gs: 0, outs: 173, h: 64, hr: 6, bb: 37, so: 46, hbp: 3, er: 36, w: 2, l: 1, sv: 0, fld: 69 },
    ],
    reservePitchers: [
      { id: 'burrebr01', name: 'Brian Burres', role: 'SP', throws: 'L', age: 29, g: 20, gs: 13, outs: 238, h: 92, hr: 9, bb: 33, so: 42, hbp: 5, er: 49, w: 4, l: 5, sv: 0, fld: 65 },
      { id: 'mcdonja03', name: 'James McDonald', role: 'SP', throws: 'R', age: 25, g: 15, gs: 12, outs: 215, h: 68, hr: 5, bb: 32, so: 64, hbp: 2, er: 31, w: 4, l: 6, sv: 0, fld: 77 },
      { id: 'lopezja02', name: 'Javier Lopez', role: 'RP', throws: 'L', age: 32, g: 77, gs: 0, outs: 173, h: 53, hr: 3, bb: 23, so: 35, hbp: 3, er: 18, w: 4, l: 2, sv: 0, fld: 56 },
      { id: 'lincobr01', name: 'Brad Lincoln', role: 'RP', throws: 'R', age: 25, g: 11, gs: 9, outs: 158, h: 66, hr: 9, bb: 15, so: 25, hbp: 5, er: 39, w: 1, l: 4, sv: 0, fld: 62, rk: true },
      { id: 'donnebr01', name: 'Brendan Donnelly', role: 'RP', throws: 'R', age: 38, g: 38, gs: 0, outs: 92, h: 28, hr: 4, bb: 21, so: 27, hbp: 1, er: 16, w: 3, l: 1, sv: 0, fld: 64 },
    ],
  },
  // STL (SLN 2010)
  {
    franchiseId: 'STL',
    season: 2010,
    batters: [
      { id: 'molinya01', name: 'Yadier Molina', pos: 'C', bats: 'R', age: 27, pa: 521, h: 130, double: 20, triple: 0, hr: 6, bb: 43, so: 43, hbp: 6, sb: 7, cs: 3, sec: '1B', fld: 73, arm: 89 },
      { id: 'pujolal01', name: 'Albert Pujols', pos: '1B', bats: 'R', age: 30, pa: 700, h: 187, double: 42, triple: 1, hr: 43, bb: 109, so: 69, hbp: 6, sb: 14, cs: 4, sec: 'LF', fld: 92 },
      { id: 'schumsk01', name: 'Skip Schumaker', pos: '2B', bats: 'L', age: 30, pa: 529, h: 136, double: 23, triple: 2, hr: 5, bb: 44, so: 62, hbp: 2, sb: 4, cs: 2, sec: 'SS', fld: 73 },
      { id: 'lopezfe01', name: 'Felipe Lopez', pos: '3B', bats: 'S', age: 30, pa: 441, h: 107, double: 22, triple: 2, hr: 7, bb: 43, so: 72, hbp: 1, sb: 6, cs: 4, sec: 'SS', fld: 59 },
      { id: 'ryanbr01', name: 'Brendan Ryan', pos: 'SS', bats: 'R', age: 28, pa: 486, h: 109, double: 20, triple: 4, hr: 2, bb: 31, so: 62, hbp: 4, sb: 13, cs: 5, sec: '2B', fld: 91 },
      { id: 'hollima01', name: 'Matt Holliday', pos: 'LF', bats: 'R', age: 30, pa: 675, h: 185, double: 42, triple: 2, hr: 27, bb: 72, so: 99, hbp: 9, sb: 14, cs: 5, sec: 'RF', fld: 65, arm: 69 },
      { id: 'rasmuco01', name: 'Colby Rasmus', pos: 'CF', bats: 'L', age: 23, pa: 534, h: 126, double: 26, triple: 3, hr: 20, bb: 53, so: 128, hbp: 2, sb: 8, cs: 5, sec: 'LF', fld: 47, arm: 59 },
      { id: 'ludwiry01', name: 'Ryan Ludwick', pos: 'RF', bats: 'R', age: 31, pa: 551, h: 130, double: 26, triple: 2, hr: 22, bb: 47, so: 119, hbp: 8, sb: 2, cs: 3, sec: 'LF', fld: 77, arm: 62 },
      { id: 'winnra01', name: 'Randy Winn', pos: 'DH', bats: 'S', age: 36, pa: 233, h: 56, double: 12, triple: 2, hr: 2, bb: 20, so: 35, hbp: 0, sb: 7, cs: 1, sec: 'RF', fld: 68, arm: 60 },
    ],
    bench: [
      { id: 'jayjo02', name: 'Jon Jay', pos: 'RF', bats: 'L', age: 25, pa: 323, h: 86, double: 19, triple: 2, hr: 4, bb: 24, so: 50, hbp: 3, sb: 2, cs: 4, sec: 'CF', fld: 74, arm: 72, rk: true },
      { id: 'freesda01', name: 'David Freese', pos: '3B', bats: 'R', age: 27, pa: 270, h: 72, double: 12, triple: 1, hr: 4, bb: 21, so: 59, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 82, rk: true },
      { id: 'milesaa01', name: 'Aaron Miles', pos: '2B', bats: 'S', age: 33, pa: 151, h: 37, double: 6, triple: 1, hr: 1, bb: 7, so: 15, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 76 },
      { id: 'stavini01', name: 'Nick Stavinoha', pos: 'RF', bats: 'R', age: 28, pa: 126, h: 29, double: 5, triple: 0, hr: 2, bb: 4, so: 25, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
      { id: 'craigal01', name: 'Allen Craig', pos: 'RF', bats: 'R', age: 25, pa: 124, h: 28, double: 7, triple: 0, hr: 4, bb: 9, so: 26, hbp: 0, sb: 0, cs: 1, sec: 'LF', fld: 60, arm: 65, rk: true },
    ],
    reserveBatters: [
      { id: 'greenty02', name: 'Tyler Greene', pos: 'SS', bats: 'R', age: 26, pa: 122, h: 24, double: 4, triple: 1, hr: 2, bb: 10, so: 28, hbp: 4, sb: 2, cs: 0, sec: '2B', fld: 61, rk: true },
      { id: 'mathejo02', name: 'Joe Mather', pos: 'CF', bats: 'R', age: 27, pa: 64, h: 13, double: 4, triple: 0, hr: 2, bb: 3, so: 12, hbp: 0, sb: 1, cs: 1, sec: 'LF' },
      { id: 'larueja01', name: 'Jason LaRue', pos: 'C', bats: 'R', age: 36, pa: 63, h: 12, double: 2, triple: 0, hr: 1, bb: 4, so: 9, hbp: 2, sb: 0, cs: 0, fld: 69, arm: 90 },
      { id: 'pagnoma01', name: 'Matt Pagnozzi', pos: 'C', bats: 'R', age: 27, pa: 44, h: 13, double: 2, triple: 0, hr: 1, bb: 2, so: 7, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'carpech01', name: 'Chris Carpenter', role: 'SP', throws: 'R', age: 35, g: 35, gs: 35, outs: 705, h: 209, hr: 17, bb: 58, so: 180, hbp: 11, er: 76, w: 16, l: 9, sv: 0, fld: 85 },
      { id: 'wainwad01', name: 'Adam Wainwright', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 691, h: 195, hr: 16, bb: 59, so: 203, hbp: 4, er: 65, w: 20, l: 11, sv: 0, fld: 81 },
      { id: 'garcija02', name: 'Jaime Garcia', role: 'SP', throws: 'L', age: 23, g: 28, gs: 28, outs: 490, h: 151, hr: 10, bb: 65, so: 130, hbp: 3, er: 51, w: 13, l: 8, sv: 0, fld: 70, rk: true },
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 35, g: 30, gs: 15, outs: 304, h: 125, hr: 15, bb: 41, so: 51, hbp: 4, er: 58, w: 3, l: 8, sv: 0, fld: 69 },
      { id: 'lohseky01', name: 'Kyle Lohse', role: 'SP', throws: 'R', age: 31, g: 18, gs: 18, outs: 276, h: 116, hr: 11, bb: 31, so: 60, hbp: 2, er: 56, w: 4, l: 8, sv: 0, fld: 73 },
      { id: 'frankry01', name: 'Ryan Franklin', role: 'CL', throws: 'R', age: 37, g: 59, gs: 0, outs: 195, h: 57, hr: 6, bb: 17, so: 42, hbp: 3, er: 21, w: 6, l: 2, sv: 27, fld: 60 },
      { id: 'hawksbl01', name: 'Blake Hawksworth', role: 'RP', throws: 'R', age: 27, g: 45, gs: 8, outs: 271, h: 105, hr: 13, bb: 36, so: 59, hbp: 2, er: 44, w: 4, l: 8, sv: 0, fld: 74, rk: true },
      { id: 'mccleky01', name: 'Kyle McClellan', role: 'RP', throws: 'R', age: 26, g: 68, gs: 0, outs: 226, h: 61, hr: 7, bb: 27, so: 57, hbp: 3, er: 24, w: 1, l: 4, sv: 2, fld: 84 },
      { id: 'boggsmi01', name: 'Mitchell Boggs', role: 'RP', throws: 'R', age: 26, g: 61, gs: 0, outs: 202, h: 66, hr: 5, bb: 31, so: 47, hbp: 4, er: 30, w: 2, l: 3, sv: 0, fld: 81 },
      { id: 'pennybr01', name: 'Brad Penny', role: 'RP', throws: 'R', age: 32, g: 9, gs: 9, outs: 167, h: 61, hr: 6, bb: 15, so: 34, hbp: 2, er: 28, w: 3, l: 4, sv: 0, fld: 59 },
      { id: 'motteja01', name: 'Jason Motte', role: 'RP', throws: 'R', age: 28, g: 56, gs: 0, outs: 157, h: 44, hr: 6, bb: 19, so: 52, hbp: 1, er: 18, w: 4, l: 2, sv: 2, fld: 60 },
    ],
    reservePitchers: [
      { id: 'reyesde01', name: 'Dennys Reyes', role: 'RP', throws: 'L', age: 33, g: 59, gs: 0, outs: 114, h: 34, hr: 2, bb: 19, so: 29, hbp: 2, er: 14, w: 3, l: 1, sv: 1, fld: 73 },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 37, g: 57, gs: 0, outs: 108, h: 29, hr: 3, bb: 14, so: 31, hbp: 2, er: 14, w: 0, l: 1, sv: 0, fld: 67 },
      { id: 'salasfe01', name: 'Fernando Salas', role: 'RP', throws: 'R', age: 25, g: 27, gs: 0, outs: 92, h: 28, hr: 4, bb: 15, so: 29, hbp: 0, er: 12, w: 0, l: 0, sv: 0, fld: 60, rk: true },
      { id: 'waltepj01', name: 'P. J. Walters', role: 'RP', throws: 'R', age: 25, g: 7, gs: 3, outs: 90, h: 33, hr: 6, bb: 11, so: 22, hbp: 0, er: 22, w: 2, l: 0, sv: 0, fld: 75, rk: true },
      { id: 'ottavad01', name: 'Adam Ottavino', role: 'RP', throws: 'R', age: 24, g: 5, gs: 3, outs: 67, h: 37, hr: 5, bb: 9, so: 12, hbp: 0, er: 21, w: 0, l: 2, sv: 0, fld: 87, rk: true },
    ],
  },
  // ARI (ARI 2010)
  {
    franchiseId: 'ARI',
    season: 2010,
    batters: [
      { id: 'snydech02', name: 'Chris Snyder', pos: 'C', bats: 'R', age: 29, pa: 376, h: 67, double: 12, triple: 0, hr: 14, bb: 54, so: 93, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 66 },
      { id: 'larocad01', name: 'Adam LaRoche', pos: '1B', bats: 'L', age: 30, pa: 615, h: 148, double: 37, triple: 2, hr: 25, bb: 57, so: 155, hbp: 2, sb: 1, cs: 1, sec: '3B', fld: 76 },
      { id: 'johnske05', name: 'Kelly Johnson', pos: '2B', bats: 'L', age: 28, pa: 671, h: 160, double: 38, triple: 5, hr: 21, bb: 71, so: 134, hbp: 3, sb: 13, cs: 6, sec: 'SS', fld: 70 },
      { id: 'reynoma01', name: 'Mark Reynolds', pos: '3B', bats: 'R', age: 26, pa: 596, h: 116, double: 22, triple: 2, hr: 34, bb: 74, so: 205, hbp: 6, sb: 13, cs: 5, sec: '1B', fld: 72 },
      { id: 'drewst01', name: 'Stephen Drew', pos: 'SS', bats: 'L', age: 27, pa: 633, h: 156, double: 34, triple: 12, hr: 15, bb: 55, so: 102, hbp: 2, sb: 7, cs: 3, sec: '2B', fld: 69 },
      { id: 'parrage01', name: 'Gerardo Parra', pos: 'LF', bats: 'L', age: 23, pa: 393, h: 100, double: 18, triple: 6, hr: 3, bb: 22, so: 74, hbp: 1, sb: 2, cs: 3, sec: 'CF', fld: 85, arm: 79 },
      { id: 'youngch04', name: 'Chris Young', pos: 'CF', bats: 'R', age: 26, pa: 664, h: 142, double: 35, triple: 3, hr: 24, bb: 72, so: 156, hbp: 3, sb: 22, cs: 6, sec: 'LF', fld: 79, arm: 73 },
      { id: 'uptonju01', name: 'Justin Upton', pos: 'RF', bats: 'R', age: 22, pa: 571, h: 140, double: 28, triple: 5, hr: 20, bb: 61, so: 147, hbp: 3, sb: 16, cs: 7, sec: 'LF', fld: 72, arm: 56 },
      { id: 'montemi01', name: 'Miguel Montero', pos: 'DH', bats: 'L', age: 26, pa: 331, h: 83, double: 21, triple: 1, hr: 10, bb: 28, so: 65, hbp: 2, sb: 0, cs: 1, sec: 'C', fld: 71, arm: 73 },
    ],
    bench: [
      { id: 'jacksco01', name: 'Conor Jackson', pos: 'LF', bats: 'R', age: 28, pa: 241, h: 53, double: 12, triple: 1, hr: 3, bb: 27, so: 27, hbp: 2, sb: 6, cs: 1, sec: '1B', fld: 74, arm: 71 },
      { id: 'ryalru01', name: 'Rusty Ryal', pos: 'LF', bats: 'R', age: 27, pa: 222, h: 54, double: 9, triple: 2, hr: 4, bb: 10, so: 67, hbp: 6, sb: 0, cs: 2, sec: '1B', fld: 68, arm: 78, rk: true },
      { id: 'abreuto01', name: 'Tony Abreu', pos: '3B', bats: 'S', age: 25, pa: 201, h: 45, double: 11, triple: 1, hr: 1, bb: 6, so: 47, hbp: 0, sb: 2, cs: 2, sec: '2B' },
      { id: 'gilleco01', name: 'Cole Gillespie', pos: 'LF', bats: 'R', age: 26, pa: 113, h: 24, double: 8, triple: 0, hr: 2, bb: 7, so: 29, hbp: 1, sb: 1, cs: 1, sec: 'RF', fld: 64, arm: 65, rk: true },
      { id: 'hestejo01', name: 'John Hester', pos: 'C', bats: 'R', age: 26, pa: 106, h: 21, double: 7, triple: 0, hr: 2, bb: 10, so: 31, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 65, arm: 57, rk: true },
    ],
    reserveBatters: [
      { id: 'ojedaau01', name: 'Augie Ojeda', pos: '2B', bats: 'S', age: 35, pa: 92, h: 18, double: 4, triple: 1, hr: 0, bb: 9, so: 8, hbp: 2, sb: 0, cs: 0, sec: 'SS' },
      { id: 'roberry01', name: 'Ryan Roberts', pos: 'LF', bats: 'R', age: 29, pa: 71, h: 16, double: 4, triple: 0, hr: 2, bb: 7, so: 13, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
      { id: 'allenbr01', name: 'Brandon Allen', pos: 'LF', bats: 'L', age: 24, pa: 56, h: 11, double: 3, triple: 0, hr: 2, bb: 8, so: 20, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'harenda01', name: 'Dan Haren', role: 'SP', throws: 'R', age: 29, g: 35, gs: 35, outs: 705, h: 231, hr: 29, bb: 49, so: 227, hbp: 5, er: 95, w: 12, l: 12, sv: 0, fld: 65 },
      { id: 'jacksed01', name: 'Edwin Jackson', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 628, h: 211, hr: 24, bb: 77, so: 166, hbp: 5, er: 98, w: 10, l: 12, sv: 0, fld: 56 },
      { id: 'lopezro01', name: 'Rodrigo Lopez', role: 'SP', throws: 'R', age: 34, g: 33, gs: 33, outs: 600, h: 230, hr: 35, bb: 57, so: 116, hbp: 3, er: 112, w: 7, l: 16, sv: 0, fld: 62 },
      { id: 'kenneia01', name: 'Ian Kennedy', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 582, h: 166, hr: 26, bb: 74, so: 164, hbp: 10, er: 87, w: 9, l: 10, sv: 0, fld: 71 },
      { id: 'enrigba01', name: 'Barry Enright', role: 'SP', throws: 'R', age: 24, g: 17, gs: 17, outs: 297, h: 97, hr: 20, bb: 29, so: 49, hbp: 1, er: 43, w: 6, l: 7, sv: 0, fld: 71, rk: true },
      { id: 'gutieju01', name: 'J. C. Gutierrez', role: 'CL', throws: 'R', age: 26, g: 58, gs: 0, outs: 170, h: 55, hr: 8, bb: 24, so: 50, hbp: 3, er: 29, w: 0, l: 6, sv: 15, fld: 71 },
      { id: 'heilmaa01', name: 'Aaron Heilman', role: 'RP', throws: 'R', age: 31, g: 70, gs: 0, outs: 216, h: 70, hr: 9, bb: 31, so: 61, hbp: 4, er: 36, w: 5, l: 8, sv: 6, fld: 64 },
      { id: 'quallch01', name: 'Chad Qualls', role: 'RP', throws: 'R', age: 31, g: 70, gs: 0, outs: 177, h: 75, hr: 6, bb: 17, so: 55, hbp: 2, er: 37, w: 3, l: 4, sv: 12, fld: 61 },
      { id: 'boyerbl01', name: 'Blaine Boyer', role: 'RP', throws: 'R', age: 28, g: 54, gs: 0, outs: 171, h: 59, hr: 3, bb: 25, so: 35, hbp: 2, er: 29, w: 3, l: 2, sv: 0, fld: 68 },
      { id: 'vasques01', name: 'Esmerling Vasquez', role: 'RP', throws: 'R', age: 26, g: 57, gs: 0, outs: 161, h: 49, hr: 5, bb: 35, so: 52, hbp: 5, er: 29, w: 1, l: 6, sv: 0, fld: 69 },
      { id: 'demelsa01', name: 'Sam Demel', role: 'RP', throws: 'R', age: 24, g: 37, gs: 0, outs: 111, h: 42, hr: 5, bb: 12, so: 33, hbp: 1, er: 22, w: 2, l: 1, sv: 2, fld: 65, rk: true },
    ],
    reservePitchers: [
      { id: 'hudsoda01', name: 'Daniel Hudson', role: 'SP', throws: 'R', age: 23, g: 14, gs: 14, outs: 286, h: 69, hr: 9, bb: 29, so: 82, hbp: 4, er: 27, w: 8, l: 2, sv: 0, fld: 65, rk: true },
      { id: 'norbejo01', name: 'Jordan Norberto', role: 'RP', throws: 'L', age: 23, g: 33, gs: 0, outs: 60, h: 16, hr: 3, bb: 22, so: 15, hbp: 0, er: 13, w: 0, l: 2, sv: 0, fld: 65, rk: true },
      { id: 'rosaca01', name: 'Carlos Rosa', role: 'RP', throws: 'R', age: 25, g: 22, gs: 0, outs: 60, h: 20, hr: 1, bb: 10, so: 9, hbp: 0, er: 9, w: 0, l: 2, sv: 0, fld: 77, rk: true },
      { id: 'valdece01', name: 'Cesar Valdez', role: 'RP', throws: 'R', age: 25, g: 9, gs: 2, outs: 60, h: 29, hr: 2, bb: 10, so: 13, hbp: 1, er: 17, w: 1, l: 2, sv: 0, fld: 76, rk: true },
      { id: 'rosalle01', name: 'Leo Rosales', role: 'RP', throws: 'R', age: 29, g: 16, gs: 0, outs: 49, h: 20, hr: 2, bb: 7, so: 13, hbp: 0, er: 11, w: 2, l: 0, sv: 0, fld: 84 },
    ],
  },
  // COL (COL 2010)
  {
    franchiseId: 'COL',
    season: 2010,
    batters: [
      { id: 'olivomi01', name: 'Miguel Olivo', pos: 'C', bats: 'R', age: 31, pa: 427, h: 104, double: 18, triple: 5, hr: 18, bb: 22, so: 120, hbp: 3, sb: 7, cs: 3, sec: '1B', fld: 64, arm: 83 },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 36, pa: 473, h: 114, double: 22, triple: 1, hr: 9, bb: 68, so: 72, hbp: 2, sb: 0, cs: 0, sec: 'LF', fld: 70 },
      { id: 'barmecl01', name: 'Clint Barmes', pos: '2B', bats: 'R', age: 31, pa: 432, h: 97, double: 22, triple: 2, hr: 12, bb: 27, so: 75, hbp: 5, sb: 7, cs: 4, sec: 'SS', fld: 83 },
      { id: 'stewaia01', name: 'Ian Stewart', pos: '3B', bats: 'L', age: 25, pa: 441, h: 95, double: 17, triple: 2, hr: 19, bb: 47, so: 118, hbp: 5, sb: 5, cs: 3, sec: '2B', fld: 75 },
      { id: 'tulowtr01', name: 'Troy Tulowitzki', pos: 'SS', bats: 'R', age: 25, pa: 529, h: 140, double: 28, triple: 5, hr: 25, bb: 53, so: 83, hbp: 4, sb: 12, cs: 6, sec: '2B', fld: 96 },
      { id: 'smithse01', name: 'Seth Smith', pos: 'LF', bats: 'L', age: 27, pa: 398, h: 93, double: 20, triple: 4, hr: 16, bb: 40, so: 68, hbp: 2, sb: 3, cs: 1, sec: 'RF', fld: 68, arm: 68 },
      { id: 'fowlede01', name: 'Dexter Fowler', pos: 'CF', bats: 'S', age: 24, pa: 505, h: 113, double: 23, triple: 12, hr: 5, bb: 60, so: 108, hbp: 2, sb: 18, cs: 9, sec: 'LF', fld: 62, arm: 62 },
      { id: 'hawpebr01', name: 'Brad Hawpe', pos: 'RF', bats: 'L', age: 31, pa: 346, h: 80, double: 21, triple: 2, hr: 12, bb: 45, so: 84, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 54, arm: 58 },
      { id: 'iannech01', name: 'Chris Iannetta', pos: 'DH', bats: 'R', age: 27, pa: 223, h: 42, double: 9, triple: 1, hr: 10, bb: 29, so: 48, hbp: 6, sb: 0, cs: 0, sec: 'C', fld: 60, arm: 65 },
    ],
    bench: [
      { id: 'gonzaca01', name: 'Carlos Gonzalez', pos: 'LF', bats: 'L', age: 24, pa: 636, h: 183, double: 34, triple: 9, hr: 29, bb: 42, so: 139, hbp: 3, sb: 25, cs: 7, sec: 'CF', fld: 73, arm: 70 },
      { id: 'spilbry01', name: 'Ryan Spilborghs', pos: 'RF', bats: 'R', age: 30, pa: 388, h: 92, double: 21, triple: 2, hr: 9, bb: 39, so: 78, hbp: 3, sb: 6, cs: 5, sec: 'LF', fld: 42, arm: 60 },
      { id: 'morame01', name: 'Melvin Mora', pos: '3B', bats: 'R', age: 38, pa: 354, h: 88, double: 14, triple: 2, hr: 8, bb: 27, so: 47, hbp: 6, sb: 2, cs: 2, sec: 'SS', fld: 59 },
      { id: 'herrejo03', name: 'Jonathan Herrera', pos: '2B', bats: 'S', age: 25, pa: 257, h: 62, double: 6, triple: 2, hr: 1, bb: 24, so: 36, hbp: 0, sb: 2, cs: 2, sec: '3B', fld: 78, rk: true },
      { id: 'giambja01', name: 'Jason Giambi', pos: '1B', bats: 'L', age: 39, pa: 222, h: 41, double: 8, triple: 0, hr: 9, bb: 34, so: 47, hbp: 6, sb: 1, cs: 0, sec: 'LF', fld: 40 },
    ],
    reserveBatters: [
      { id: 'younger03', name: 'Eric Young', pos: '2B', bats: 'S', age: 25, pa: 189, h: 42, double: 5, triple: 1, hr: 1, bb: 16, so: 33, hbp: 0, sb: 16, cs: 7, sec: 'SS', fld: 61, rk: true },
    ],
    pitchers: [
      { id: 'jimenub01', name: 'Ubaldo Jimenez', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 665, h: 174, hr: 11, bb: 92, so: 203, hbp: 10, er: 79, w: 19, l: 8, sv: 0, fld: 66 },
      { id: 'hammeja01', name: 'Jason Hammel', role: 'SP', throws: 'R', age: 27, g: 30, gs: 30, outs: 533, h: 201, hr: 18, bb: 48, so: 135, hbp: 7, er: 91, w: 10, l: 9, sv: 0, fld: 71 },
      { id: 'chacijh01', name: 'Jhoulys Chacin', role: 'SP', throws: 'R', age: 22, g: 28, gs: 21, outs: 412, h: 112, hr: 10, bb: 65, so: 139, hbp: 9, er: 51, w: 9, l: 11, sv: 0, fld: 64, rk: true },
      { id: 'cookaa01', name: 'Aaron Cook', role: 'SP', throws: 'R', age: 31, g: 23, gs: 23, outs: 383, h: 148, hr: 12, bb: 43, so: 63, hbp: 3, er: 65, w: 6, l: 8, sv: 0, fld: 79 },
      { id: 'delarjo01', name: 'Jorge De La Rosa', role: 'SP', throws: 'L', age: 29, g: 20, gs: 20, outs: 365, h: 109, hr: 14, bb: 55, so: 119, hbp: 6, er: 59, w: 8, l: 7, sv: 0, fld: 67 },
      { id: 'streehu01', name: 'Huston Street', role: 'CL', throws: 'R', age: 26, g: 44, gs: 0, outs: 142, h: 37, hr: 5, bb: 12, so: 49, hbp: 1, er: 18, w: 4, l: 4, sv: 20, fld: 55 },
      { id: 'belisma01', name: 'Matt Belisle', role: 'RP', throws: 'R', age: 30, g: 76, gs: 0, outs: 276, h: 90, hr: 9, bb: 16, so: 81, hbp: 2, er: 37, w: 7, l: 5, sv: 1, fld: 50 },
      { id: 'rogeres01', name: 'Esmil Rogers', role: 'RP', throws: 'R', age: 24, g: 28, gs: 8, outs: 216, h: 93, hr: 5, bb: 26, so: 66, hbp: 5, er: 49, w: 2, l: 3, sv: 0, fld: 74, rk: true },
      { id: 'betanra01', name: 'Rafael Betancourt', role: 'RP', throws: 'R', age: 35, g: 72, gs: 0, outs: 187, h: 52, hr: 7, bb: 15, so: 74, hbp: 0, er: 24, w: 5, l: 1, sv: 1, fld: 71 },
      { id: 'corpama01', name: 'Manny Corpas', role: 'RP', throws: 'R', age: 27, g: 56, gs: 0, outs: 187, h: 70, hr: 6, bb: 19, so: 44, hbp: 2, er: 33, w: 3, l: 5, sv: 10, fld: 74 },
      { id: 'beimejo01', name: 'Joe Beimel', role: 'RP', throws: 'L', age: 33, g: 71, gs: 0, outs: 135, h: 46, hr: 4, bb: 16, so: 25, hbp: 1, er: 16, w: 1, l: 2, sv: 0, fld: 70 },
    ],
    reservePitchers: [
      { id: 'francje01', name: 'Jeff Francis', role: 'SP', throws: 'L', age: 29, g: 20, gs: 19, outs: 313, h: 118, hr: 12, bb: 27, so: 67, hbp: 2, er: 58, w: 4, l: 6, sv: 0, fld: 73 },
      { id: 'smithgr02', name: 'Greg Smith', role: 'RP', throws: 'L', age: 26, g: 8, gs: 8, outs: 117, h: 43, hr: 6, bb: 22, so: 28, hbp: 1, er: 23, w: 1, l: 2, sv: 0, fld: 67 },
      { id: 'florera01', name: 'Randy Flores', role: 'RP', throws: 'L', age: 34, g: 58, gs: 0, outs: 93, h: 34, hr: 5, bb: 15, so: 22, hbp: 1, er: 13, w: 2, l: 0, sv: 0, fld: 60 },
      { id: 'moralfr01', name: 'Franklin Morales', role: 'RP', throws: 'L', age: 24, g: 35, gs: 0, outs: 86, h: 29, hr: 4, bb: 21, so: 27, hbp: 2, er: 18, w: 0, l: 4, sv: 3, fld: 76 },
      { id: 'daleyma01', name: 'Matt Daley', role: 'RP', throws: 'R', age: 28, g: 28, gs: 0, outs: 70, h: 24, hr: 3, bb: 10, so: 24, hbp: 2, er: 12, w: 0, l: 1, sv: 0, fld: 71 },
    ],
  },
  // LAD (LAN 2010)
  {
    franchiseId: 'LAD',
    season: 2010,
    batters: [
      { id: 'martiru01', name: 'Russell Martin', pos: 'C', bats: 'R', age: 27, pa: 387, h: 85, double: 13, triple: 0, hr: 5, bb: 48, so: 55, hbp: 5, sb: 8, cs: 3, sec: '1B', fld: 66, arm: 80 },
      { id: 'loneyja01', name: 'James Loney', pos: '1B', bats: 'L', age: 26, pa: 648, h: 161, double: 35, triple: 3, hr: 11, bb: 57, so: 84, hbp: 2, sb: 8, cs: 4, sec: '3B', fld: 68 },
      { id: 'dewitbl01', name: 'Blake DeWitt', pos: '2B', bats: 'L', age: 24, pa: 496, h: 114, double: 22, triple: 4, hr: 7, bb: 47, so: 84, hbp: 4, sb: 3, cs: 1, sec: '3B', fld: 68 },
      { id: 'blakeca01', name: 'Casey Blake', pos: '3B', bats: 'R', age: 36, pa: 571, h: 132, double: 28, triple: 3, hr: 18, bb: 53, so: 127, hbp: 8, sb: 1, cs: 3, sec: '1B', fld: 69 },
      { id: 'furcara01', name: 'Rafael Furcal', pos: 'SS', bats: 'S', age: 32, pa: 428, h: 111, double: 21, triple: 5, hr: 7, bb: 40, so: 57, hbp: 1, sb: 15, cs: 4, sec: '2B', fld: 68 },
      { id: 'johnsre02', name: 'Reed Johnson', pos: 'LF', bats: 'R', age: 33, pa: 215, h: 53, double: 11, triple: 2, hr: 3, bb: 9, so: 42, hbp: 6, sb: 2, cs: 2, sec: 'RF', fld: 77, arm: 57 },
      { id: 'kempma01', name: 'Matt Kemp', pos: 'CF', bats: 'R', age: 25, pa: 668, h: 165, double: 27, triple: 6, hr: 26, bb: 52, so: 157, hbp: 3, sb: 27, cs: 12, sec: 'RF', fld: 54, arm: 62 },
      { id: 'ethiean01', name: 'Andre Ethier', pos: 'RF', bats: 'L', age: 28, pa: 585, h: 147, double: 35, triple: 2, hr: 24, bb: 60, so: 98, hbp: 6, sb: 4, cs: 2, sec: 'LF', fld: 60, arm: 65 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'DH', bats: 'R', age: 38, pa: 320, h: 81, double: 17, triple: 1, hr: 13, bb: 47, so: 61, hbp: 6, sb: 1, cs: 1, sec: 'LF', fld: 55, arm: 68 },
    ],
    bench: [
      { id: 'carroja01', name: 'Jamey Carroll', pos: 'SS', bats: 'R', age: 36, pa: 414, h: 101, double: 14, triple: 2, hr: 1, bb: 45, so: 67, hbp: 4, sb: 9, cs: 3, sec: '2B', fld: 70 },
      { id: 'belliro01', name: 'Ronnie Belliard', pos: '2B', bats: 'R', age: 35, pa: 185, h: 42, double: 10, triple: 1, hr: 5, bb: 17, so: 35, hbp: 1, sb: 2, cs: 1, sec: '3B' },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'LF', bats: 'L', age: 38, pa: 163, h: 39, double: 8, triple: 0, hr: 4, bb: 7, so: 25, hbp: 0, sb: 1, cs: 0, sec: 'CF', fld: 45, arm: 75 },
      { id: 'paulxa01', name: 'Xavier Paul', pos: 'LF', bats: 'L', age: 25, pa: 133, h: 28, double: 8, triple: 1, hr: 1, bb: 9, so: 25, hbp: 0, sb: 3, cs: 2, sec: 'RF', fld: 55, arm: 80, rk: true },
      { id: 'ellisaj01', name: 'A. J. Ellis', pos: 'C', bats: 'R', age: 29, pa: 128, h: 29, double: 5, triple: 0, hr: 0, bb: 13, so: 18, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 70, rk: true },
    ],
    reserveBatters: [
      { id: 'gibboja01', name: 'Jay Gibbons', pos: 'LF', bats: 'L', age: 33, pa: 80, h: 21, double: 2, triple: 0, hr: 5, bb: 4, so: 14, hbp: 0, sb: 0, cs: 1, sec: 'RF' },
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 41, pa: 71, h: 15, double: 2, triple: 0, hr: 1, bb: 6, so: 13, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 79, arm: 46 },
      { id: 'mitchru01', name: 'Russ Mitchell', pos: '3B', bats: 'R', age: 25, pa: 43, h: 6, double: 0, triple: 0, hr: 2, bb: 0, so: 8, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'kershcl01', name: 'Clayton Kershaw', role: 'SP', throws: 'L', age: 22, g: 32, gs: 32, outs: 613, h: 158, hr: 12, bb: 91, so: 211, hbp: 5, er: 68, w: 13, l: 10, sv: 0, fld: 68 },
      { id: 'kurodhi01', name: 'Hiroki Kuroda', role: 'SP', throws: 'R', age: 35, g: 31, gs: 31, outs: 589, h: 183, hr: 16, bb: 46, so: 149, hbp: 5, er: 77, w: 11, l: 13, sv: 0, fld: 63 },
      { id: 'billich01', name: 'Chad Billingsley', role: 'SP', throws: 'R', age: 25, g: 31, gs: 31, outs: 575, h: 174, hr: 12, bb: 75, so: 175, hbp: 8, er: 77, w: 12, l: 11, sv: 0, fld: 67 },
      { id: 'elyjo01', name: 'John Ely', role: 'SP', throws: 'R', age: 24, g: 18, gs: 18, outs: 300, h: 105, hr: 12, bb: 40, so: 76, hbp: 2, er: 61, w: 4, l: 10, sv: 0, fld: 73, rk: true },
      { id: 'padilvi01', name: 'Vicente Padilla', role: 'SP', throws: 'R', age: 32, g: 16, gs: 16, outs: 285, h: 88, hr: 12, bb: 29, so: 69, hbp: 6, er: 44, w: 6, l: 5, sv: 0, fld: 70 },
      { id: 'broxtjo01', name: 'Jonathan Broxton', role: 'CL', throws: 'R', age: 26, g: 64, gs: 0, outs: 187, h: 54, hr: 4, bb: 27, so: 86, hbp: 2, er: 25, w: 5, l: 6, sv: 22, fld: 68 },
      { id: 'kuoho01', name: 'Hung-Chih Kuo', role: 'RP', throws: 'L', age: 28, g: 56, gs: 0, outs: 180, h: 34, hr: 2, bb: 18, so: 69, hbp: 2, er: 11, w: 3, l: 2, sv: 12, fld: 70 },
      { id: 'belisro01', name: 'Ronald Belisario', role: 'RP', throws: 'R', age: 27, g: 59, gs: 0, outs: 166, h: 47, hr: 5, bb: 21, so: 44, hbp: 4, er: 23, w: 3, l: 1, sv: 2, fld: 71 },
      { id: 'troncra01', name: 'Ramon Troncoso', role: 'RP', throws: 'R', age: 27, g: 52, gs: 0, outs: 162, h: 54, hr: 4, bb: 20, so: 37, hbp: 3, er: 22, w: 2, l: 3, sv: 0, fld: 59 },
      { id: 'weaveje01', name: 'Jeff Weaver', role: 'RP', throws: 'R', age: 33, g: 43, gs: 0, outs: 133, h: 48, hr: 4, bb: 19, so: 31, hbp: 2, er: 23, w: 5, l: 1, sv: 0, fld: 83 },
      { id: 'sherrge01', name: 'George Sherrill', role: 'RP', throws: 'L', age: 33, g: 65, gs: 0, outs: 109, h: 39, hr: 3, bb: 20, so: 34, hbp: 1, er: 18, w: 2, l: 2, sv: 0, fld: 61 },
    ],
    reservePitchers: [
      { id: 'monasca01', name: 'Carlos Monasterios', role: 'SP', throws: 'R', age: 24, g: 32, gs: 13, outs: 265, h: 99, hr: 15, bb: 29, so: 52, hbp: 8, er: 43, w: 3, l: 5, sv: 0, fld: 60, rk: true },
      { id: 'haegech01', name: 'Charlie Haeger', role: 'RP', throws: 'R', age: 26, g: 9, gs: 6, outs: 90, h: 34, hr: 5, bb: 23, so: 29, hbp: 2, er: 25, w: 0, l: 4, sv: 0, fld: 50 },
      { id: 'ortizra01', name: 'Ramon Ortiz', role: 'RP', throws: 'R', age: 37, g: 16, gs: 2, outs: 90, h: 33, hr: 5, bb: 16, so: 21, hbp: 0, er: 21, w: 1, l: 2, sv: 0, fld: 72 },
      { id: 'janseke01', name: 'Kenley Jansen', role: 'RP', throws: 'R', age: 22, g: 25, gs: 0, outs: 81, h: 12, hr: 0, bb: 15, so: 41, hbp: 1, er: 2, w: 1, l: 0, sv: 4, fld: 75, rk: true },
      { id: 'milleju01', name: 'Justin Miller', role: 'RP', throws: 'R', age: 32, g: 19, gs: 0, outs: 73, h: 21, hr: 3, bb: 10, so: 21, hbp: 1, er: 10, w: 0, l: 0, sv: 0, fld: 74 },
    ],
  },
  // SDP (SDN 2010)
  {
    franchiseId: 'SDP',
    season: 2010,
    batters: [
      { id: 'torreyo01', name: 'Yorvit Torrealba', pos: 'C', bats: 'R', age: 31, pa: 363, h: 88, double: 16, triple: 0, hr: 6, bb: 30, so: 65, hbp: 3, sb: 5, cs: 4, sec: '1B', fld: 71, arm: 78 },
      { id: 'gonzaad01', name: 'Adrian Gonzalez', pos: '1B', bats: 'L', age: 28, pa: 692, h: 168, double: 31, triple: 1, hr: 35, bb: 99, so: 117, hbp: 4, sb: 0, cs: 0, sec: '3B', fld: 78 },
      { id: 'eckstda01', name: 'David Eckstein', pos: '2B', bats: 'R', age: 35, pa: 492, h: 116, double: 24, triple: 1, hr: 1, bb: 31, so: 38, hbp: 9, sb: 5, cs: 1, sec: 'SS', fld: 64 },
      { id: 'headlch01', name: 'Chase Headley', pos: '3B', bats: 'S', age: 26, pa: 674, h: 160, double: 31, triple: 3, hr: 12, bb: 60, so: 147, hbp: 4, sb: 14, cs: 4, sec: '1B', fld: 66 },
      { id: 'hairsje02', name: 'Jerry Hairston', pos: 'SS', bats: 'R', age: 34, pa: 476, h: 109, double: 19, triple: 2, hr: 10, bb: 33, so: 56, hbp: 6, sb: 10, cs: 5, sec: '2B', fld: 75 },
      { id: 'hairssc01', name: 'Scott Hairston', pos: 'LF', bats: 'R', age: 30, pa: 336, h: 72, double: 15, triple: 1, hr: 12, bb: 25, so: 67, hbp: 4, sb: 6, cs: 1, sec: 'CF', fld: 67, arm: 66 },
      { id: 'gwynnto02', name: 'Tony Gwynn', pos: 'CF', bats: 'L', age: 27, pa: 339, h: 68, double: 9, triple: 4, hr: 2, bb: 38, so: 49, hbp: 1, sb: 13, cs: 5, sec: 'RF', fld: 58, arm: 72 },
      { id: 'venabwi01', name: 'Will Venable', pos: 'RF', bats: 'L', age: 27, pa: 445, h: 99, double: 14, triple: 6, hr: 14, bb: 42, so: 123, hbp: 4, sb: 21, cs: 5, sec: 'CF', fld: 79, arm: 57 },
      { id: 'salazos01', name: 'Oscar Salazar', pos: 'DH', bats: 'R', age: 32, pa: 148, h: 35, double: 5, triple: 1, hr: 4, bb: 15, so: 21, hbp: 0, sb: 1, cs: 1, sec: 'LF', fld: 44, arm: 57 },
    ],
    bench: [
      { id: 'denorch01', name: 'Chris Denorfia', pos: 'CF', bats: 'R', age: 29, pa: 317, h: 77, double: 15, triple: 2, hr: 9, bb: 27, so: 52, hbp: 2, sb: 8, cs: 4, sec: 'LF', fld: 61, arm: 82 },
      { id: 'hundlni01', name: 'Nick Hundley', pos: 'C', bats: 'R', age: 26, pa: 307, h: 67, double: 16, triple: 2, hr: 8, bb: 25, so: 72, hbp: 1, sb: 2, cs: 3, sec: '1B', fld: 69, arm: 72 },
      { id: 'cabreev01', name: 'Everth Cabrera', pos: 'SS', bats: 'S', age: 23, pa: 241, h: 49, double: 8, triple: 4, hr: 1, bb: 22, so: 51, hbp: 2, sb: 12, cs: 5, sec: '2B', fld: 55 },
      { id: 'cunniaa01', name: 'Aaron Cunningham', pos: 'LF', bats: 'R', age: 24, pa: 147, h: 34, double: 11, triple: 1, hr: 1, bb: 8, so: 32, hbp: 3, sb: 1, cs: 2, sec: 'RF', fld: 69, arm: 57 },
      { id: 'blankky01', name: 'Kyle Blanks', pos: 'LF', bats: 'R', age: 23, pa: 120, h: 21, double: 6, triple: 1, hr: 5, bb: 14, so: 42, hbp: 4, sb: 1, cs: 0, sec: 'RF', fld: 65, arm: 82 },
    ],
    reserveBatters: [
      { id: 'stairma01', name: 'Matt Stairs', pos: 'LF', bats: 'L', age: 42, pa: 111, h: 22, double: 4, triple: 0, hr: 5, bb: 14, so: 28, hbp: 1, sb: 1, cs: 0, sec: 'RF' },
      { id: 'duranlu01', name: 'Luis Durango', pos: 'CF', bats: 'S', age: 24, pa: 53, h: 14, double: 0, triple: 0, hr: 0, bb: 5, so: 7, hbp: 0, sb: 5, cs: 1, sec: 'LF', rk: true },
      { id: 'zawadla01', name: 'Lance Zawadzki', pos: '2B', bats: 'S', age: 25, pa: 42, h: 7, double: 2, triple: 0, hr: 0, bb: 5, so: 7, hbp: 0, sb: 1, cs: 0, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'richacl01', name: 'Clayton Richard', role: 'SP', throws: 'L', age: 26, g: 33, gs: 33, outs: 605, h: 206, hr: 18, bb: 81, so: 150, hbp: 4, er: 91, w: 14, l: 9, sv: 0, fld: 66 },
      { id: 'garlajo01', name: 'Jon Garland', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 600, h: 199, hr: 21, bb: 72, so: 117, hbp: 6, er: 85, w: 14, l: 12, sv: 0, fld: 86 },
      { id: 'latosma01', name: 'Mat Latos', role: 'SP', throws: 'R', age: 22, g: 31, gs: 31, outs: 554, h: 150, hr: 17, bb: 55, so: 180, hbp: 2, er: 65, w: 14, l: 10, sv: 0, fld: 65 },
      { id: 'leblawa01', name: 'Wade LeBlanc', role: 'SP', throws: 'L', age: 25, g: 26, gs: 25, outs: 438, h: 151, hr: 24, bb: 55, so: 107, hbp: 4, er: 70, w: 8, l: 12, sv: 0, fld: 77 },
      { id: 'correke01', name: 'Kevin Correia', role: 'SP', throws: 'R', age: 29, g: 28, gs: 26, outs: 435, h: 154, hr: 17, bb: 57, so: 109, hbp: 4, er: 79, w: 10, l: 10, sv: 0, fld: 66 },
      { id: 'bellhe01', name: 'Heath Bell', role: 'CL', throws: 'R', age: 32, g: 67, gs: 0, outs: 210, h: 56, hr: 2, bb: 26, so: 80, hbp: 1, er: 19, w: 6, l: 1, sv: 47, fld: 64 },
      { id: 'staufti01', name: 'Tim Stauffer', role: 'RP', throws: 'R', age: 28, g: 32, gs: 7, outs: 248, h: 68, hr: 5, bb: 28, so: 58, hbp: 3, er: 22, w: 6, l: 5, sv: 0, fld: 70 },
      { id: 'gregelu01', name: 'Luke Gregerson', role: 'RP', throws: 'R', age: 26, g: 80, gs: 0, outs: 235, h: 52, hr: 6, bb: 23, so: 88, hbp: 2, er: 27, w: 4, l: 7, sv: 2, fld: 71 },
      { id: 'mujiced01', name: 'Edward Mujica', role: 'RP', throws: 'R', age: 26, g: 59, gs: 0, outs: 209, h: 65, hr: 11, bb: 10, so: 60, hbp: 0, er: 30, w: 2, l: 1, sv: 0, fld: 64 },
      { id: 'adamsmi03', name: 'Mike Adams', role: 'RP', throws: 'R', age: 31, g: 70, gs: 0, outs: 200, h: 45, hr: 3, bb: 21, so: 77, hbp: 0, er: 13, w: 4, l: 1, sv: 0, fld: 71 },
      { id: 'webbry01', name: 'Ryan Webb', role: 'RP', throws: 'R', age: 24, g: 54, gs: 0, outs: 177, h: 63, hr: 2, bb: 20, so: 44, hbp: 1, er: 20, w: 3, l: 1, sv: 0, fld: 76, rk: true },
    ],
    reservePitchers: [
      { id: 'thatcjo01', name: 'Joe Thatcher', role: 'RP', throws: 'L', age: 28, g: 65, gs: 0, outs: 105, h: 27, hr: 2, bb: 10, so: 38, hbp: 2, er: 10, w: 1, l: 0, sv: 0, fld: 80 },
      { id: 'frierer01', name: 'Ernesto Frieri', role: 'RP', throws: 'R', age: 24, g: 33, gs: 0, outs: 95, h: 17, hr: 2, bb: 17, so: 41, hbp: 0, er: 6, w: 1, l: 1, sv: 0, fld: 60, rk: true },
      { id: 'youngch03', name: 'Chris Young', role: 'RP', throws: 'R', age: 31, g: 4, gs: 4, outs: 60, h: 15, hr: 2, bb: 10, so: 14, hbp: 0, er: 8, w: 2, l: 0, sv: 0, fld: 71 },
      { id: 'luebkco01', name: 'Cory Luebke', role: 'RP', throws: 'L', age: 25, g: 4, gs: 3, outs: 53, h: 17, hr: 3, bb: 6, so: 18, hbp: 1, er: 8, w: 1, l: 1, sv: 0, fld: 59, rk: true },
      { id: 'russead01', name: 'Adam Russell', role: 'RP', throws: 'R', age: 27, g: 12, gs: 0, outs: 47, h: 15, hr: 0, bb: 7, so: 16, hbp: 0, er: 7, w: 0, l: 0, sv: 0, fld: 79, rk: true },
    ],
  },
  // SFG (SFN 2010)
  {
    franchiseId: 'SFG',
    season: 2010,
    batters: [
      { id: 'poseybu01', name: 'Buster Posey', pos: 'C', bats: 'R', age: 23, pa: 443, h: 122, double: 22, triple: 2, hr: 18, bb: 29, so: 56, hbp: 4, sb: 0, cs: 2, sec: '1B', fld: 75, arm: 79, rk: true },
      { id: 'huffau01', name: 'Aubrey Huff', pos: '1B', bats: 'L', age: 33, pa: 668, h: 162, double: 37, triple: 3, hr: 24, bb: 70, so: 93, hbp: 7, sb: 4, cs: 2, sec: '3B', fld: 70 },
      { id: 'sanchfr01', name: 'Freddy Sanchez', pos: '2B', bats: 'R', age: 32, pa: 479, h: 127, double: 24, triple: 2, hr: 7, bb: 26, so: 66, hbp: 3, sb: 3, cs: 1, sec: '3B', fld: 56 },
      { id: 'sandopa01', name: 'Pablo Sandoval', pos: '3B', bats: 'S', age: 23, pa: 616, h: 166, double: 38, triple: 4, hr: 17, bb: 47, so: 80, hbp: 2, sb: 4, cs: 3, sec: '1B', fld: 65 },
      { id: 'uribeju01', name: 'Juan Uribe', pos: 'SS', bats: 'R', age: 31, pa: 575, h: 136, double: 29, triple: 3, hr: 22, bb: 40, so: 99, hbp: 3, sb: 2, cs: 2, sec: '2B', fld: 54 },
      { id: 'burrepa01', name: 'Pat Burrell', pos: 'LF', bats: 'R', age: 33, pa: 437, h: 90, double: 19, triple: 1, hr: 18, bb: 58, so: 104, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 63, arm: 70 },
      { id: 'rowanaa01', name: 'Aaron Rowand', pos: 'CF', bats: 'R', age: 32, pa: 357, h: 82, double: 17, triple: 1, hr: 10, bb: 20, so: 77, hbp: 8, sb: 3, cs: 2, sec: 'LF', fld: 75, arm: 70 },
      { id: 'schiena01', name: 'Nate Schierholtz', pos: 'RF', bats: 'L', age: 26, pa: 252, h: 59, double: 15, triple: 2, hr: 3, bb: 16, so: 41, hbp: 2, sb: 3, cs: 3, sec: 'LF', fld: 71, arm: 81 },
      { id: 'molinbe01', name: 'Bengie Molina', pos: 'DH', bats: 'R', age: 35, pa: 416, h: 101, double: 17, triple: 1, hr: 10, bb: 17, so: 40, hbp: 5, sb: 0, cs: 0, sec: 'C', fld: 73, arm: 66 },
    ],
    bench: [
      { id: 'torrean02', name: 'Andres Torres', pos: 'CF', bats: 'S', age: 32, pa: 570, h: 136, double: 39, triple: 11, hr: 17, bb: 56, so: 132, hbp: 2, sb: 25, cs: 6, sec: 'LF', fld: 75, arm: 71 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 33, pa: 267, h: 64, double: 10, triple: 1, hr: 3, bb: 20, so: 37, hbp: 0, sb: 3, cs: 1, sec: '2B', fld: 51 },
      { id: 'ishiktr01', name: 'Travis Ishikawa', pos: '1B', bats: 'L', age: 26, pa: 173, h: 41, double: 8, triple: 1, hr: 4, bb: 14, so: 37, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 79 },
      { id: 'bowkejo01', name: 'John Bowker', pos: 'RF', bats: 'L', age: 26, pa: 167, h: 35, double: 7, triple: 1, hr: 5, bb: 12, so: 35, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 67, arm: 62 },
      { id: 'whiteel03', name: 'Eli Whiteside', pos: 'C', bats: 'R', age: 30, pa: 140, h: 30, double: 6, triple: 1, hr: 3, bb: 7, so: 34, hbp: 3, sb: 1, cs: 1, sec: '1B', fld: 73, arm: 72 },
    ],
    reserveBatters: [
      { id: 'downsma01', name: 'Matt Downs', pos: '2B', bats: 'R', age: 26, pa: 109, h: 20, double: 6, triple: 0, hr: 1, bb: 10, so: 21, hbp: 1, sb: 0, cs: 0, sec: 'SS', fld: 40, rk: true },
      { id: 'derosma01', name: 'Mark DeRosa', pos: 'LF', bats: 'R', age: 35, pa: 104, h: 23, double: 4, triple: 0, hr: 4, bb: 10, so: 20, hbp: 1, sb: 1, cs: 1, sec: 'RF', fld: 65, arm: 57 },
      { id: 'velezeu01', name: 'Eugenio Velez', pos: 'LF', bats: 'S', age: 28, pa: 66, h: 15, double: 3, triple: 1, hr: 1, bb: 4, so: 11, hbp: 0, sb: 2, cs: 1, sec: 'CF' },
    ],
    pitchers: [
      { id: 'cainma01', name: 'Matt Cain', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 670, h: 185, hr: 21, bb: 70, so: 175, hbp: 4, er: 77, w: 13, l: 11, sv: 0, fld: 62 },
      { id: 'linceti01', name: 'Tim Lincecum', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 637, h: 182, hr: 14, bb: 74, so: 244, hbp: 5, er: 71, w: 16, l: 10, sv: 0, fld: 56 },
      { id: 'zitoba01', name: 'Barry Zito', role: 'SP', throws: 'L', age: 32, g: 34, gs: 33, outs: 598, h: 186, hr: 20, bb: 88, so: 149, hbp: 7, er: 94, w: 9, l: 14, sv: 0, fld: 62 },
      { id: 'sanchjo01', name: 'Jonathan Sanchez', role: 'SP', throws: 'L', age: 27, g: 34, gs: 33, outs: 580, h: 152, hr: 21, bb: 96, so: 201, hbp: 8, er: 79, w: 13, l: 9, sv: 0, fld: 62 },
      { id: 'bumgama01', name: 'Madison Bumgarner', role: 'SP', throws: 'L', age: 20, g: 18, gs: 18, outs: 333, h: 118, hr: 12, bb: 27, so: 88, hbp: 5, er: 36, w: 7, l: 6, sv: 0, fld: 80, rk: true },
      { id: 'wilsobr01', name: 'Brian Wilson', role: 'CL', throws: 'R', age: 28, g: 70, gs: 0, outs: 224, h: 63, hr: 4, bb: 27, so: 88, hbp: 1, er: 21, w: 3, l: 3, sv: 48, fld: 78 },
      { id: 'romose01', name: 'Sergio Romo', role: 'RP', throws: 'R', age: 27, g: 68, gs: 0, outs: 186, h: 46, hr: 5, bb: 15, so: 70, hbp: 4, er: 18, w: 5, l: 3, sv: 0, fld: 70 },
      { id: 'garcija01', name: 'Santiago Casilla', role: 'RP', throws: 'R', age: 29, g: 52, gs: 0, outs: 166, h: 51, hr: 4, bb: 25, so: 47, hbp: 4, er: 20, w: 7, l: 2, sv: 2, fld: 73 },
      { id: 'motagu01', name: 'Guillermo Mota', role: 'RP', throws: 'R', age: 36, g: 56, gs: 0, outs: 162, h: 47, hr: 5, bb: 22, so: 37, hbp: 2, er: 24, w: 1, l: 3, sv: 1, fld: 77 },
      { id: 'affelje01', name: 'Jeremy Affeldt', role: 'RP', throws: 'L', age: 31, g: 53, gs: 0, outs: 150, h: 49, hr: 4, bb: 24, so: 48, hbp: 3, er: 18, w: 4, l: 3, sv: 4, fld: 62 },
      { id: 'bautide01', name: 'Denny Bautista', role: 'RP', throws: 'R', age: 29, g: 31, gs: 0, outs: 101, h: 29, hr: 4, bb: 24, so: 36, hbp: 2, er: 16, w: 2, l: 0, sv: 0, fld: 65 },
    ],
    reservePitchers: [
      { id: 'welleto01', name: 'Todd Wellemeyer', role: 'SP', throws: 'R', age: 31, g: 13, gs: 11, outs: 176, h: 65, hr: 10, bb: 27, so: 40, hbp: 2, er: 34, w: 3, l: 5, sv: 0, fld: 77 },
      { id: 'runzlda01', name: 'Dan Runzler', role: 'RP', throws: 'L', age: 25, g: 41, gs: 0, outs: 98, h: 28, hr: 1, bb: 20, so: 38, hbp: 1, er: 10, w: 3, l: 0, sv: 0, fld: 65, rk: true },
      { id: 'martijo07', name: 'Joe Martinez', role: 'RP', throws: 'R', age: 27, g: 9, gs: 1, outs: 59, h: 28, hr: 2, bb: 8, so: 11, hbp: 1, er: 13, w: 0, l: 1, sv: 0, fld: 59, rk: true },
      { id: 'meddebr01', name: 'Brandon Medders', role: 'RP', throws: 'R', age: 30, g: 14, gs: 0, outs: 45, h: 18, hr: 2, bb: 8, so: 12, hbp: 1, er: 8, w: 0, l: 0, sv: 0, fld: 74 },
    ],
  },
];
