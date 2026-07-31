import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 2004 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 2004
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
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents2004.ts`).
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

export const SEASON_2004: HistTeam[] = [
  // BAL (BAL 2004)
  {
    franchiseId: 'BAL',
    season: 2004,
    batters: [
      { id: 'lopezja01', name: 'Javy Lopez', pos: 'C', bats: 'R', age: 33, pa: 638, h: 180, double: 33, triple: 3, hr: 32, bb: 45, so: 104, hbp: 7, sb: 0, cs: 1, sec: '1B', fld: 71, arm: 68 },
      { id: 'palmera01', name: 'Rafael Palmeiro', pos: '1B', bats: 'L', age: 39, pa: 651, h: 144, double: 27, triple: 1, hr: 31, bb: 88, so: 72, hbp: 6, sb: 2, cs: 0, sec: 'LF', fld: 69 },
      { id: 'roberbr01', name: 'Brian Roberts', pos: '2B', bats: 'S', age: 26, pa: 734, h: 174, double: 43, triple: 3, hr: 5, bb: 70, so: 92, hbp: 1, sb: 31, cs: 11, sec: 'SS', fld: 63 },
      { id: 'morame01', name: 'Melvin Mora', pos: '3B', bats: 'R', age: 32, pa: 636, h: 171, double: 35, triple: 1, hr: 24, bb: 69, so: 100, hbp: 14, sb: 11, cs: 6, sec: 'SS', fld: 72 },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: 'SS', bats: 'R', age: 30, pa: 725, h: 197, double: 39, triple: 1, hr: 32, bb: 49, so: 73, hbp: 9, sb: 7, cs: 1, sec: '2B', fld: 80 },
      { id: 'bigbila01', name: 'Larry Bigbie', pos: 'LF', bats: 'L', age: 26, pa: 531, h: 136, double: 23, triple: 1, hr: 15, bb: 45, so: 110, hbp: 1, sb: 9, cs: 3, sec: 'CF', fld: 79, arm: 63 },
      { id: 'matoslu01', name: 'Luis Matos', pos: 'CF', bats: 'R', age: 25, pa: 359, h: 85, double: 17, triple: 1, hr: 8, bb: 20, so: 63, hbp: 5, sb: 12, cs: 4, sec: 'RF', fld: 72, arm: 66 },
      { id: 'gibboja01', name: 'Jay Gibbons', pos: 'RF', bats: 'L', age: 27, pa: 380, h: 90, double: 19, triple: 1, hr: 13, bb: 29, so: 54, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 66, arm: 75 },
      { id: 'newhada01', name: 'David Newhan', pos: 'DH', bats: 'L', age: 30, pa: 412, h: 116, double: 15, triple: 7, hr: 8, bb: 27, so: 72, hbp: 4, sb: 11, cs: 1, sec: 'RF', rk: true },
    ],
    bench: [
      { id: 'surhobj01', name: 'B. J. Surhoff', pos: 'RF', bats: 'L', age: 39, pa: 378, h: 104, double: 16, triple: 1, hr: 7, bb: 31, so: 39, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 71, arm: 66 },
      { id: 'hairsje02', name: 'Jerry Hairston', pos: 'RF', bats: 'R', age: 28, pa: 334, h: 82, double: 18, triple: 2, hr: 3, bb: 28, so: 32, hbp: 7, sb: 15, cs: 7, sec: 'CF', fld: 78, arm: 70 },
      { id: 'raineti02', name: 'Tim Raines', pos: 'CF', bats: 'R', age: 24, pa: 101, h: 21, double: 5, triple: 1, hr: 0, bb: 4, so: 18, hbp: 1, sb: 5, cs: 2, sec: 'RF', fld: 74, arm: 75, rk: true },
      { id: 'lopezlu02', name: 'Luis Lopez', pos: 'SS', bats: 'S', age: 33, pa: 97, h: 17, double: 5, triple: 0, hr: 1, bb: 3, so: 19, hbp: 1, sb: 0, cs: 0, sec: '2B' },
      { id: 'macharo01', name: 'Robert Machado', pos: 'C', bats: 'R', age: 31, pa: 77, h: 15, double: 3, triple: 0, hr: 1, bb: 6, so: 16, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 70, arm: 88 },
    ],
    reserveBatters: [
      { id: 'leonjo01', name: 'Jose Leon', pos: '1B', bats: 'R', age: 27, pa: 69, h: 14, double: 2, triple: 0, hr: 1, bb: 2, so: 19, hbp: 1, sb: 0, cs: 0, sec: '3B' },
      { id: 'seguida01', name: 'David Segui', pos: 'DH', bats: 'S', age: 37, pa: 65, h: 16, double: 3, triple: 0, hr: 1, bb: 6, so: 13, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'ponsosi01', name: 'Sidney Ponson', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 647, h: 246, hr: 23, bb: 69, so: 130, hbp: 6, er: 114, w: 11, l: 15, sv: 0, fld: 74 },
      { id: 'lopezro01', name: 'Rodrigo Lopez', role: 'SP', throws: 'R', age: 28, g: 37, gs: 23, outs: 512, h: 173, hr: 22, bb: 52, so: 118, hbp: 5, er: 79, w: 14, l: 9, sv: 0, fld: 74 },
      { id: 'cabreda01', name: 'Daniel Cabrera', role: 'SP', throws: 'R', age: 23, g: 28, gs: 27, outs: 443, h: 145, hr: 14, bb: 89, so: 76, hbp: 2, er: 82, w: 12, l: 8, sv: 1, fld: 58, rk: true },
      { id: 'bedarer01', name: 'Erik Bedard', role: 'SP', throws: 'L', age: 25, g: 27, gs: 26, outs: 412, h: 149, hr: 13, bb: 71, so: 121, hbp: 7, er: 70, w: 6, l: 10, sv: 0, fld: 66, rk: true },
      { id: 'duboser01', name: 'Eric DuBose', role: 'SP', throws: 'L', age: 28, g: 14, gs: 14, outs: 224, h: 73, hr: 10, bb: 38, so: 48, hbp: 4, er: 46, w: 4, l: 6, sv: 0 },
      { id: 'juliojo01', name: 'Jorge Julio', role: 'CL', throws: 'R', age: 25, g: 65, gs: 0, outs: 207, h: 61, hr: 10, bb: 37, so: 64, hbp: 3, er: 31, w: 2, l: 5, sv: 22 },
      { id: 'ryanbj01', name: 'B. J. Ryan', role: 'RP', throws: 'L', age: 28, g: 76, gs: 0, outs: 261, h: 66, hr: 4, bb: 39, so: 111, hbp: 3, er: 27, w: 4, l: 6, sv: 3 },
      { id: 'parrijo01', name: 'John Parrish', role: 'RP', throws: 'L', age: 26, g: 56, gs: 1, outs: 234, h: 67, hr: 5, bb: 51, so: 69, hbp: 3, er: 28, w: 6, l: 3, sv: 1 },
      { id: 'grimsja01', name: 'Jason Grimsley', role: 'RP', throws: 'R', age: 36, g: 73, gs: 0, outs: 189, h: 65, hr: 4, bb: 33, so: 45, hbp: 3, er: 30, w: 5, l: 7, sv: 0 },
      { id: 'dejeami01', name: 'Mike DeJean', role: 'RP', throws: 'R', age: 33, g: 54, gs: 0, outs: 183, h: 67, hr: 6, bb: 32, so: 58, hbp: 4, er: 31, w: 0, l: 5, sv: 0 },
      { id: 'borkoda01', name: 'Dave Borkowski', role: 'RP', throws: 'R', age: 27, g: 17, gs: 8, outs: 168, h: 65, hr: 6, bb: 15, so: 45, hbp: 3, er: 32, w: 3, l: 4, sv: 0 },
    ],
    reservePitchers: [
      { id: 'rileyma01', name: 'Matt Riley', role: 'SP', throws: 'L', age: 24, g: 14, gs: 13, outs: 192, h: 59, hr: 11, bb: 43, so: 60, hbp: 1, er: 38, w: 3, l: 4, sv: 0, rk: true },
      { id: 'bauerri01', name: 'Rick Bauer', role: 'RP', throws: 'R', age: 27, g: 23, gs: 2, outs: 161, h: 50, hr: 5, bb: 21, so: 35, hbp: 3, er: 26, w: 2, l: 1, sv: 0 },
      { id: 'groombu01', name: 'Buddy Groom', role: 'RP', throws: 'L', age: 38, g: 60, gs: 0, outs: 158, h: 63, hr: 6, bb: 15, so: 37, hbp: 2, er: 26, w: 4, l: 1, sv: 0 },
      { id: 'chenbr01', name: 'Bruce Chen', role: 'RP', throws: 'L', age: 27, g: 8, gs: 7, outs: 143, h: 43, hr: 8, bb: 19, so: 36, hbp: 1, er: 21, w: 2, l: 1, sv: 0 },
      { id: 'rodried03', name: 'Eddy Rodriguez', role: 'RP', throws: 'R', age: 22, g: 29, gs: 0, outs: 130, h: 36, hr: 5, bb: 30, so: 37, hbp: 5, er: 23, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // BOS (BOS 2004)
  {
    franchiseId: 'BOS',
    season: 2004,
    batters: [
      { id: 'varitja01', name: 'Jason Varitek', pos: 'C', bats: 'S', age: 32, pa: 536, h: 132, double: 30, triple: 1, hr: 19, bb: 56, so: 116, hbp: 9, sb: 7, cs: 3, sec: '1B', fld: 76, arm: 64 },
      { id: 'millake01', name: 'Kevin Millar', pos: '1B', bats: 'R', age: 32, pa: 588, h: 149, double: 35, triple: 0, hr: 20, bb: 56, so: 95, hbp: 11, sb: 2, cs: 2, sec: 'LF', fld: 62 },
      { id: 'bellhma01', name: 'Mark Bellhorn', pos: '2B', bats: 'S', age: 29, pa: 620, h: 132, double: 32, triple: 3, hr: 17, bb: 91, so: 172, hbp: 6, sb: 7, cs: 4, sec: '3B', fld: 62 },
      { id: 'muellbi02', name: 'Bill Mueller', pos: '3B', bats: 'S', age: 33, pa: 460, h: 119, double: 29, triple: 3, hr: 12, bb: 49, so: 56, hbp: 4, sb: 1, cs: 2, sec: '2B', fld: 64 },
      { id: 'reesepo01', name: 'Pokey Reese', pos: 'SS', bats: 'R', age: 31, pa: 268, h: 56, double: 9, triple: 1, hr: 3, bb: 19, so: 57, hbp: 1, sb: 7, cs: 1, sec: '2B', fld: 79 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'LF', bats: 'R', age: 32, pa: 663, h: 180, double: 40, triple: 0, hr: 40, bb: 88, so: 111, hbp: 7, sb: 2, cs: 2, sec: 'RF', fld: 59, arm: 65 },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'CF', bats: 'L', age: 30, pa: 702, h: 181, double: 34, triple: 7, hr: 16, bb: 72, so: 72, hbp: 3, sb: 25, cs: 7, sec: 'LF', fld: 69, arm: 65 },
      { id: 'kaplega01', name: 'Gabe Kapler', pos: 'RF', bats: 'R', age: 28, pa: 310, h: 78, double: 15, triple: 2, hr: 5, bb: 18, so: 50, hbp: 1, sb: 7, cs: 4, sec: 'CF', fld: 68, arm: 71 },
      { id: 'ortizda01', name: 'David Ortiz', pos: 'DH', bats: 'L', age: 28, pa: 669, h: 172, double: 48, triple: 3, hr: 39, bb: 74, so: 125, hbp: 3, sb: 0, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'youklke01', name: 'Kevin Youkilis', pos: '3B', bats: 'R', age: 25, pa: 248, h: 54, double: 11, triple: 0, hr: 7, bb: 33, so: 45, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 71, rk: true },
      { id: 'mirabdo01', name: 'Doug Mirabelli', pos: 'C', bats: 'R', age: 33, pa: 182, h: 43, double: 12, triple: 0, hr: 8, bb: 16, so: 41, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 61, arm: 58 },
      { id: 'mccarda01', name: 'Dave McCarty', pos: '1B', bats: 'R', age: 34, pa: 168, h: 39, double: 8, triple: 1, hr: 4, bb: 13, so: 41, hbp: 2, sb: 1, cs: 0, sec: 'LF', fld: 73 },
      { id: 'nixontr01', name: 'Trot Nixon', pos: 'RF', bats: 'L', age: 30, pa: 167, h: 43, double: 9, triple: 1, hr: 8, bb: 19, so: 29, hbp: 1, sb: 1, cs: 0, sec: 'CF', fld: 63, arm: 63 },
      { id: 'daubabr01', name: 'Brian Daubach', pos: '1B', bats: 'L', age: 32, pa: 86, h: 18, double: 5, triple: 0, hr: 3, bb: 11, so: 21, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
    ],
    reserveBatters: [
      { id: 'crespce01', name: 'Cesar Crespo', pos: 'SS', bats: 'S', age: 25, pa: 79, h: 13, double: 2, triple: 1, hr: 0, bb: 1, so: 19, hbp: 0, sb: 3, cs: 1, sec: '2B' },
    ],
    pitchers: [
      { id: 'schilcu01', name: 'Curt Schilling', role: 'SP', throws: 'R', age: 37, g: 32, gs: 32, outs: 680, h: 201, hr: 24, bb: 36, so: 235, hbp: 4, er: 80, w: 21, l: 6, sv: 0, fld: 66 },
      { id: 'martipe02', name: 'Pedro Martinez', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 651, h: 184, hr: 19, bb: 57, so: 241, hbp: 15, er: 77, w: 16, l: 9, sv: 0, fld: 65 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 37, g: 32, gs: 30, outs: 565, h: 186, hr: 25, bb: 65, so: 139, hbp: 14, er: 92, w: 12, l: 10, sv: 0, fld: 67 },
      { id: 'lowede01', name: 'Derek Lowe', role: 'SP', throws: 'R', age: 31, g: 33, gs: 33, outs: 548, h: 206, hr: 15, bb: 66, so: 107, hbp: 9, er: 96, w: 14, l: 12, sv: 0, fld: 83 },
      { id: 'arroybr01', name: 'Bronson Arroyo', role: 'SP', throws: 'R', age: 27, g: 32, gs: 29, outs: 536, h: 169, hr: 16, bb: 49, so: 143, hbp: 19, er: 78, w: 10, l: 9, sv: 0, fld: 72 },
      { id: 'foulkke01', name: 'Keith Foulke', role: 'CL', throws: 'R', age: 31, g: 72, gs: 0, outs: 249, h: 61, hr: 8, bb: 16, so: 78, hbp: 6, er: 21, w: 5, l: 3, sv: 32 },
      { id: 'timlimi01', name: 'Mike Timlin', role: 'RP', throws: 'R', age: 38, g: 76, gs: 0, outs: 229, h: 73, hr: 10, bb: 14, so: 56, hbp: 4, er: 32, w: 5, l: 4, sv: 1 },
      { id: 'embreal01', name: 'Alan Embree', role: 'RP', throws: 'L', age: 34, g: 71, gs: 0, outs: 157, h: 47, hr: 6, bb: 14, so: 45, hbp: 1, er: 22, w: 2, l: 2, sv: 0 },
      { id: 'leskacu01', name: 'Curt Leskanic', role: 'RP', throws: 'R', age: 36, g: 51, gs: 0, outs: 130, h: 42, hr: 5, bb: 29, so: 41, hbp: 1, er: 20, w: 3, l: 5, sv: 4 },
      { id: 'mendora01', name: 'Ramiro Mendoza', role: 'RP', throws: 'R', age: 32, g: 27, gs: 0, outs: 92, h: 33, hr: 3, bb: 7, so: 15, hbp: 1, er: 15, w: 2, l: 1, sv: 0 },
      { id: 'willisc01', name: 'Scott Williamson', role: 'RP', throws: 'R', age: 28, g: 28, gs: 0, outs: 86, h: 18, hr: 2, bb: 15, so: 31, hbp: 1, er: 9, w: 0, l: 1, sv: 1 },
    ],
    reservePitchers: [
      { id: 'dinarle01', name: 'Lenny DiNardo', role: 'RP', throws: 'L', age: 24, g: 22, gs: 0, outs: 83, h: 34, hr: 1, bb: 12, so: 21, hbp: 2, er: 13, w: 0, l: 0, sv: 0, rk: true },
      { id: 'malasma01', name: 'Mark Malaska', role: 'RP', throws: 'L', age: 26, g: 19, gs: 0, outs: 60, h: 19, hr: 1, bb: 13, so: 15, hbp: 1, er: 9, w: 1, l: 1, sv: 0, rk: true },
      { id: 'kimby01', name: 'Byung-Hyun Kim', role: 'RP', throws: 'R', age: 25, g: 7, gs: 3, outs: 52, h: 16, hr: 2, bb: 5, so: 15, hbp: 2, er: 7, w: 2, l: 1, sv: 0 },
      { id: 'martian01', name: 'Anastacio Martinez', role: 'RP', throws: 'R', age: 25, g: 11, gs: 0, outs: 32, h: 13, hr: 2, bb: 6, so: 5, hbp: 1, er: 10, w: 2, l: 1, sv: 0, rk: true },
    ],
  },
  // NYY (NYA 2004)
  {
    franchiseId: 'NYY',
    season: 2004,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 33, pa: 547, h: 124, double: 29, triple: 0, hr: 23, bb: 85, so: 102, hbp: 8, sb: 1, cs: 3, sec: '1B', fld: 69, arm: 67 },
      { id: 'giambja01', name: 'Jason Giambi', pos: '1B', bats: 'L', age: 33, pa: 322, h: 65, double: 12, triple: 0, hr: 17, bb: 54, so: 61, hbp: 9, sb: 1, cs: 1, sec: 'LF', fld: 63 },
      { id: 'cairomi01', name: 'Miguel Cairo', pos: '2B', bats: 'R', age: 30, pa: 408, h: 99, double: 18, triple: 4, hr: 6, bb: 19, so: 49, hbp: 12, sb: 9, cs: 2, sec: '3B', fld: 70 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: '3B', bats: 'R', age: 28, pa: 698, h: 175, double: 26, triple: 3, hr: 43, bb: 82, so: 126, hbp: 11, sb: 21, cs: 4, sec: 'SS', fld: 63 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 30, pa: 721, h: 193, double: 38, triple: 2, hr: 19, bb: 54, so: 106, hbp: 14, sb: 22, cs: 5, sec: '2B', fld: 72 },
      { id: 'matsuhi01', name: 'Hideki Matsui', pos: 'LF', bats: 'L', age: 30, pa: 680, h: 174, double: 37, triple: 2, hr: 25, bb: 77, so: 95, hbp: 3, sb: 3, cs: 1, sec: 'CF', fld: 70, arm: 69 },
      { id: 'willibe02', name: 'Bernie Williams', pos: 'CF', bats: 'S', age: 35, pa: 651, h: 155, double: 29, triple: 1, hr: 20, bb: 85, so: 89, hbp: 3, sb: 4, cs: 3, fld: 65, arm: 64 },
      { id: 'sheffga01', name: 'Gary Sheffield', pos: 'RF', bats: 'R', age: 35, pa: 684, h: 177, double: 33, triple: 1, hr: 36, bb: 89, so: 71, hbp: 10, sb: 11, cs: 5, sec: 'LF', fld: 70, arm: 73 },
      { id: 'sierrru01', name: 'Ruben Sierra', pos: 'DH', bats: 'S', age: 38, pa: 338, h: 80, double: 15, triple: 1, hr: 13, bb: 25, so: 51, hbp: 0, sb: 2, cs: 0, sec: 'RF' },
    ],
    bench: [
      { id: 'loftoke01', name: 'Kenny Lofton', pos: 'CF', bats: 'L', age: 37, pa: 313, h: 78, double: 14, triple: 5, hr: 5, bb: 29, so: 29, hbp: 1, sb: 12, cs: 4, sec: 'RF', fld: 78, arm: 71 },
      { id: 'clarkto02', name: 'Tony Clark', pos: '1B', bats: 'S', age: 32, pa: 283, h: 57, double: 12, triple: 0, hr: 14, bb: 24, so: 79, hbp: 1, sb: 0, cs: 0, sec: '3B', fld: 70 },
      { id: 'wilsoen01', name: 'Enrique Wilson', pos: '2B', bats: 'S', age: 30, pa: 262, h: 51, double: 10, triple: 0, hr: 6, bb: 15, so: 24, hbp: 1, sb: 2, cs: 2, sec: 'SS', fld: 63 },
      { id: 'flahejo01', name: 'John Flaherty', pos: 'C', bats: 'R', age: 36, pa: 135, h: 32, double: 9, triple: 0, hr: 4, bb: 5, so: 23, hbp: 1, sb: 0, cs: 1, fld: 66, arm: 64 },
      { id: 'crosbbu01', name: 'Bubba Crosby', pos: 'RF', bats: 'L', age: 27, pa: 58, h: 8, double: 2, triple: 0, hr: 2, bb: 2, so: 13, hbp: 1, sb: 2, cs: 0, sec: 'LF', fld: 69, arm: 58, rk: true },
    ],
    pitchers: [
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 594, h: 192, hr: 29, bb: 54, so: 175, hbp: 7, er: 93, w: 14, l: 10, sv: 0, fld: 73 },
      { id: 'liebejo01', name: 'Jon Lieber', role: 'SP', throws: 'R', age: 34, g: 27, gs: 27, outs: 530, h: 213, hr: 20, bb: 18, so: 104, hbp: 2, er: 83, w: 14, l: 8, sv: 0, fld: 61 },
      { id: 'contrjo01', name: 'Jose Contreras', role: 'SP', throws: 'R', age: 32, g: 31, gs: 31, outs: 511, h: 159, hr: 27, bb: 83, so: 157, hbp: 9, er: 96, w: 13, l: 9, sv: 0, fld: 57 },
      { id: 'mussimi01', name: 'Mike Mussina', role: 'SP', throws: 'R', age: 35, g: 27, gs: 27, outs: 494, h: 167, hr: 20, bb: 37, so: 144, hbp: 3, er: 76, w: 12, l: 9, sv: 0, fld: 73 },
      { id: 'brownke01', name: 'Kevin Brown', role: 'SP', throws: 'R', age: 39, g: 22, gs: 22, outs: 396, h: 126, hr: 11, bb: 36, so: 102, hbp: 4, er: 49, w: 10, l: 6, sv: 0 },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 34, g: 74, gs: 0, outs: 236, h: 66, hr: 3, bb: 17, so: 68, hbp: 5, er: 17, w: 4, l: 2, sv: 53 },
      { id: 'quantpa01', name: 'Paul Quantrill', role: 'RP', throws: 'R', age: 35, g: 86, gs: 0, outs: 286, h: 110, hr: 4, bb: 22, so: 48, hbp: 4, er: 39, w: 7, l: 3, sv: 1 },
      { id: 'gordoto01', name: 'Tom Gordon', role: 'RP', throws: 'R', age: 36, g: 80, gs: 0, outs: 269, h: 61, hr: 5, bb: 28, so: 97, hbp: 2, er: 25, w: 9, l: 4, sv: 4 },
      { id: 'sturtta01', name: 'Tanyon Sturtze', role: 'RP', throws: 'R', age: 33, g: 28, gs: 3, outs: 232, h: 84, hr: 10, bb: 32, so: 49, hbp: 5, er: 46, w: 6, l: 2, sv: 1 },
      { id: 'heredfe01', name: 'Felix Heredia', role: 'RP', throws: 'L', age: 29, g: 47, gs: 0, outs: 116, h: 40, hr: 5, bb: 18, so: 23, hbp: 1, er: 18, w: 1, l: 1, sv: 0 },
      { id: 'halsebr01', name: 'Brad Halsey', role: 'RP', throws: 'L', age: 23, g: 8, gs: 7, outs: 96, h: 41, hr: 4, bb: 14, so: 25, hbp: 2, er: 23, w: 1, l: 3, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'hernaor01', name: 'Orlando Hernandez', role: 'SP', throws: 'R', age: 38, g: 15, gs: 15, outs: 254, h: 75, hr: 9, bb: 31, so: 78, hbp: 5, er: 33, w: 8, l: 2, sv: 0 },
      { id: 'prinzbr01', name: 'Bret Prinz', role: 'RP', throws: 'R', age: 27, g: 26, gs: 0, outs: 85, h: 31, hr: 5, bb: 15, so: 21, hbp: 1, er: 18, w: 1, l: 0, sv: 0 },
      { id: 'proctsc01', name: 'Scott Proctor', role: 'RP', throws: 'R', age: 27, g: 26, gs: 0, outs: 75, h: 29, hr: 5, bb: 14, so: 21, hbp: 0, er: 15, w: 2, l: 1, sv: 0, rk: true },
      { id: 'osbordo01', name: 'Donovan Osborne', role: 'RP', throws: 'L', age: 35, g: 9, gs: 2, outs: 53, h: 24, hr: 3, bb: 6, so: 11, hbp: 2, er: 14, w: 2, l: 0, sv: 0 },
    ],
  },
  // TBR (TBA 2004)
  {
    franchiseId: 'TBR',
    season: 2004,
    batters: [
      { id: 'hallto02', name: 'Toby Hall', pos: 'C', bats: 'R', age: 28, pa: 441, h: 104, double: 21, triple: 0, hr: 9, bb: 22, so: 38, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 71, arm: 73 },
      { id: 'martiti02', name: 'Tino Martinez', pos: '1B', bats: 'L', age: 36, pa: 538, h: 124, double: 22, triple: 1, hr: 20, bb: 59, so: 70, hbp: 8, sb: 2, cs: 1, fld: 64 },
      { id: 'sanchre01', name: 'Rey Sanchez', pos: '2B', bats: 'R', age: 36, pa: 307, h: 73, double: 11, triple: 2, hr: 1, bb: 13, so: 29, hbp: 2, sb: 1, cs: 1, sec: 'SS', fld: 73 },
      { id: 'huffau01', name: 'Aubrey Huff', pos: '3B', bats: 'L', age: 27, pa: 667, h: 183, double: 34, triple: 2, hr: 30, bb: 53, so: 75, hbp: 6, sb: 4, cs: 2, sec: '1B', fld: 63 },
      { id: 'lugoju01', name: 'Julio Lugo', pos: 'SS', bats: 'R', age: 28, pa: 655, h: 159, double: 32, triple: 4, hr: 11, bb: 53, so: 113, hbp: 5, sb: 18, cs: 5, sec: '2B', fld: 74 },
      { id: 'crawfca02', name: 'Carl Crawford', pos: 'LF', bats: 'L', age: 22, pa: 672, h: 181, double: 23, triple: 15, hr: 8, bb: 31, so: 91, hbp: 1, sb: 55, cs: 13, sec: 'CF', fld: 86, arm: 66 },
      { id: 'baldero01', name: 'Rocco Baldelli', pos: 'CF', bats: 'R', age: 22, pa: 565, h: 148, double: 27, triple: 5, hr: 13, bb: 28, so: 96, hbp: 7, sb: 19, cs: 6, sec: 'LF', fld: 82, arm: 77 },
      { id: 'cruzjo02', name: 'Jose Cruz', pos: 'RF', bats: 'S', age: 30, pa: 636, h: 133, double: 26, triple: 5, hr: 21, bb: 82, so: 119, hbp: 1, sb: 9, cs: 6, sec: 'CF', fld: 69, arm: 70 },
      { id: 'blumge01', name: 'Geoff Blum', pos: 'DH', bats: 'S', age: 31, pa: 369, h: 83, double: 18, triple: 1, hr: 8, bb: 24, so: 52, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 67 },
    ],
    bench: [
      { id: 'fickro01', name: 'Robert Fick', pos: 'DH', bats: 'L', age: 30, pa: 253, h: 56, double: 11, triple: 1, hr: 6, bb: 22, so: 32, hbp: 2, sb: 0, cs: 0, sec: '1B' },
      { id: 'cantujo01', name: 'Jorge Cantu', pos: '2B', bats: 'R', age: 22, pa: 185, h: 52, double: 20, triple: 1, hr: 2, bb: 9, so: 44, hbp: 2, sb: 0, cs: 0, sec: '3B', fld: 53, rk: true },
      { id: 'uptonbj01', name: 'B. J. Upton', pos: 'SS', bats: 'R', age: 19, pa: 177, h: 41, double: 8, triple: 2, hr: 4, bb: 15, so: 46, hbp: 1, sb: 4, cs: 1, sec: '3B', fld: 55, rk: true },
      { id: 'fordybr01', name: 'Brook Fordyce', pos: 'C', bats: 'R', age: 34, pa: 163, h: 37, double: 6, triple: 0, hr: 2, bb: 9, so: 25, hbp: 1, sb: 1, cs: 1, fld: 72, arm: 68 },
      { id: 'rollsda01', name: 'Damian Rolls', pos: '3B', bats: 'R', age: 26, pa: 132, h: 28, double: 6, triple: 0, hr: 1, bb: 7, so: 30, hbp: 2, sb: 3, cs: 1, sec: '2B' },
    ],
    reserveBatters: [
      { id: 'mcgrifr01', name: 'Fred McGriff', pos: 'DH', bats: 'L', age: 40, pa: 81, h: 18, double: 3, triple: 0, hr: 3, bb: 8, so: 16, hbp: 0, sb: 0, cs: 0, sec: '1B' },
      { id: 'cummimi01', name: 'Midre Cummings', pos: 'DH', bats: 'L', age: 32, pa: 61, h: 15, double: 4, triple: 0, hr: 2, bb: 5, so: 12, hbp: 2, sb: 1, cs: 0, sec: 'RF' },
      { id: 'gathrjo01', name: 'Joey Gathright', pos: 'CF', bats: 'L', age: 23, pa: 57, h: 13, double: 0, triple: 0, hr: 0, bb: 2, so: 14, hbp: 3, sb: 6, cs: 1, sec: 'LF', rk: true },
      { id: 'perezed01', name: 'Eduardo Perez', pos: '1B', bats: 'R', age: 34, pa: 42, h: 9, double: 2, triple: 0, hr: 2, bb: 4, so: 8, hbp: 1, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'hendrma01', name: 'Mark Hendrickson', role: 'SP', throws: 'L', age: 30, g: 32, gs: 30, outs: 550, h: 216, hr: 23, bb: 46, so: 88, hbp: 5, er: 100, w: 10, l: 15, sv: 0, fld: 74 },
      { id: 'zambrvi01', name: 'Victor Zambrano', role: 'SP', throws: 'R', age: 28, g: 26, gs: 25, outs: 426, h: 126, hr: 15, bb: 92, so: 111, hbp: 14, er: 71, w: 11, l: 7, sv: 0, fld: 64 },
      { id: 'bellro01', name: 'Rob Bell', role: 'SP', throws: 'R', age: 27, g: 24, gs: 19, outs: 369, h: 124, hr: 17, bb: 43, so: 60, hbp: 5, er: 68, w: 8, l: 8, sv: 0 },
      { id: 'brazede01', name: 'Dewon Brazelton', role: 'SP', throws: 'R', age: 24, g: 22, gs: 21, outs: 362, h: 124, hr: 14, bb: 54, so: 62, hbp: 10, er: 69, w: 6, l: 8, sv: 0 },
      { id: 'halamjo01', name: 'John Halama', role: 'SP', throws: 'L', age: 32, g: 34, gs: 14, outs: 356, h: 132, hr: 17, bb: 33, so: 61, hbp: 6, er: 58, w: 7, l: 6, sv: 0 },
      { id: 'baezda01', name: 'Danys Baez', role: 'CL', throws: 'R', age: 26, g: 62, gs: 0, outs: 204, h: 62, hr: 7, bb: 28, so: 55, hbp: 5, er: 30, w: 4, l: 4, sv: 30 },
      { id: 'sosajo02', name: 'Jorge Sosa', role: 'RP', throws: 'R', age: 26, g: 43, gs: 8, outs: 298, h: 101, hr: 14, bb: 51, so: 72, hbp: 2, er: 57, w: 4, l: 7, sv: 1 },
      { id: 'cartela02', name: 'Lance Carter', role: 'RP', throws: 'R', age: 29, g: 56, gs: 0, outs: 241, h: 75, hr: 12, bb: 22, so: 42, hbp: 2, er: 33, w: 3, l: 3, sv: 0 },
      { id: 'harpetr01', name: 'Travis Harper', role: 'RP', throws: 'R', age: 28, g: 52, gs: 0, outs: 236, h: 73, hr: 9, bb: 24, so: 56, hbp: 6, er: 35, w: 6, l: 2, sv: 0 },
      { id: 'gonzaje01', name: 'Geremi Gonzalez', role: 'RP', throws: 'R', age: 29, g: 11, gs: 8, outs: 151, h: 56, hr: 7, bb: 23, so: 30, hbp: 4, er: 30, w: 0, l: 5, sv: 0 },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 31, g: 60, gs: 0, outs: 147, h: 45, hr: 4, bb: 19, so: 42, hbp: 4, er: 20, w: 1, l: 1, sv: 1 },
    ],
    reservePitchers: [
      { id: 'waechdo01', name: 'Doug Waechter', role: 'SP', throws: 'R', age: 23, g: 14, gs: 14, outs: 211, h: 66, hr: 17, bb: 33, so: 42, hbp: 4, er: 42, w: 5, l: 7, sv: 0, rk: true },
      { id: 'gaudich01', name: 'Chad Gaudin', role: 'RP', throws: 'R', age: 21, g: 26, gs: 4, outs: 128, h: 54, hr: 4, bb: 17, so: 29, hbp: 3, er: 22, w: 1, l: 2, sv: 0, rk: true },
      { id: 'colomje01', name: 'Jesus Colome', role: 'RP', throws: 'R', age: 26, g: 33, gs: 0, outs: 124, h: 34, hr: 4, bb: 22, so: 35, hbp: 1, er: 19, w: 2, l: 2, sv: 3 },
      { id: 'kazmisc01', name: 'Scott Kazmir', role: 'RP', throws: 'L', age: 20, g: 8, gs: 7, outs: 100, h: 33, hr: 4, bb: 21, so: 41, hbp: 2, er: 21, w: 2, l: 3, sv: 0, rk: true },
      { id: 'seaybo01', name: 'Bobby Seay', role: 'RP', throws: 'L', age: 26, g: 21, gs: 0, outs: 68, h: 20, hr: 2, bb: 7, so: 16, hbp: 2, er: 6, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // TOR (TOR 2004)
  {
    franchiseId: 'TOR',
    season: 2004,
    batters: [
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 33, pa: 392, h: 87, double: 21, triple: 0, hr: 6, bb: 43, so: 58, hbp: 5, sb: 1, cs: 2, sec: '1B', fld: 70, arm: 68 },
      { id: 'delgaca01', name: 'Carlos Delgado', pos: '1B', bats: 'L', age: 32, pa: 551, h: 127, double: 28, triple: 1, hr: 32, bb: 79, so: 111, hbp: 13, sb: 0, cs: 0, sec: 'LF', fld: 76 },
      { id: 'hudsoor01', name: 'Orlando Hudson', pos: '2B', bats: 'S', age: 26, pa: 551, h: 133, double: 28, triple: 7, hr: 11, bb: 46, so: 94, hbp: 5, sb: 6, cs: 3, sec: 'SS', fld: 84 },
      { id: 'hinsker01', name: 'Eric Hinske', pos: '3B', bats: 'L', age: 26, pa: 634, h: 141, double: 35, triple: 3, hr: 16, bb: 63, so: 119, hbp: 3, sb: 13, cs: 5, sec: '1B', fld: 64 },
      { id: 'gomezch02', name: 'Chris Gomez', pos: 'SS', bats: 'R', age: 33, pa: 377, h: 94, double: 15, triple: 2, hr: 4, bb: 22, so: 39, hbp: 2, sb: 3, cs: 2, sec: '2B', fld: 69 },
      { id: 'johnsre02', name: 'Reed Johnson', pos: 'LF', bats: 'R', age: 27, pa: 582, h: 148, double: 26, triple: 2, hr: 11, bb: 27, so: 94, hbp: 17, sb: 6, cs: 3, sec: 'RF', fld: 77, arm: 74 },
      { id: 'wellsve01', name: 'Vernon Wells', pos: 'CF', bats: 'R', age: 25, pa: 590, h: 157, double: 36, triple: 3, hr: 24, bb: 40, so: 75, hbp: 3, sb: 7, cs: 2, sec: 'RF', fld: 74, arm: 67 },
      { id: 'riosal01', name: 'Alex Rios', pos: 'RF', bats: 'R', age: 23, pa: 460, h: 122, double: 24, triple: 7, hr: 1, bb: 31, so: 84, hbp: 2, sb: 15, cs: 3, sec: 'LF', fld: 72, arm: 76, rk: true },
      { id: 'phelpjo01', name: 'Josh Phelps', pos: 'DH', bats: 'R', age: 26, pa: 401, h: 96, double: 19, triple: 2, hr: 18, bb: 27, so: 99, hbp: 10, sb: 0, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'menecfr01', name: 'Frank Menechino', pos: '2B', bats: 'R', age: 33, pa: 311, h: 67, double: 11, triple: 3, hr: 8, bb: 40, so: 52, hbp: 5, sb: 0, cs: 1, sec: '3B', fld: 68 },
      { id: 'catalfr01', name: 'Frank Catalanotto', pos: 'LF', bats: 'L', age: 30, pa: 274, h: 73, double: 18, triple: 3, hr: 4, bb: 19, so: 32, hbp: 4, sb: 2, cs: 1, sec: '1B', fld: 67, arm: 64 },
      { id: 'woodwch01', name: 'Chris Woodward', pos: 'SS', bats: 'R', age: 28, pa: 232, h: 53, double: 12, triple: 3, hr: 4, bb: 16, so: 45, hbp: 2, sb: 1, cs: 1, sec: '2B', fld: 73 },
      { id: 'cashke01', name: 'Kevin Cash', pos: 'C', bats: 'R', age: 26, pa: 197, h: 32, double: 8, triple: 0, hr: 3, bb: 9, so: 53, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 70, arm: 80 },
      { id: 'bergda01', name: 'Dave Berg', pos: 'LF', bats: 'R', age: 33, pa: 162, h: 39, double: 6, triple: 1, hr: 3, bb: 8, so: 27, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 57, arm: 66 },
    ],
    reserveBatters: [
      { id: 'grossga01', name: 'Gabe Gross', pos: 'LF', bats: 'L', age: 24, pa: 148, h: 27, double: 4, triple: 0, hr: 3, bb: 19, so: 31, hbp: 0, sb: 2, cs: 2, sec: 'RF', fld: 83, arm: 88, rk: true },
      { id: 'clarkho02', name: 'Howie Clark', pos: '1B', bats: 'L', age: 30, pa: 133, h: 31, double: 6, triple: 0, hr: 2, bb: 10, so: 14, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
      { id: 'adamsru01', name: 'Russ Adams', pos: 'SS', bats: 'L', age: 23, pa: 78, h: 22, double: 2, triple: 1, hr: 4, bb: 5, so: 5, hbp: 1, sb: 1, cs: 0, sec: '2B', fld: 57, rk: true },
      { id: 'quirogu01', name: 'Guillermo Quiroz', pos: 'C', bats: 'R', age: 22, pa: 57, h: 11, double: 2, triple: 0, hr: 0, bb: 2, so: 8, hbp: 2, sb: 1, cs: 0, sec: '1B', rk: true },
      { id: 'pondsi01', name: 'Simon Pond', pos: 'LF', bats: 'L', age: 27, pa: 56, h: 8, double: 2, triple: 0, hr: 1, bb: 5, so: 12, hbp: 1, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'batismi01', name: 'Miguel Batista', role: 'SP', throws: 'R', age: 33, g: 38, gs: 31, outs: 596, h: 205, hr: 18, bb: 83, so: 123, hbp: 5, er: 97, w: 10, l: 13, sv: 5, fld: 76 },
      { id: 'lillyte01', name: 'Ted Lilly', role: 'SP', throws: 'L', age: 28, g: 32, gs: 32, outs: 592, h: 180, hr: 27, bb: 78, so: 165, hbp: 6, er: 91, w: 12, l: 10, sv: 0, fld: 56 },
      { id: 'hallaro01', name: 'Roy Halladay', role: 'SP', throws: 'R', age: 27, g: 21, gs: 21, outs: 399, h: 135, hr: 12, bb: 29, so: 101, hbp: 3, er: 54, w: 8, l: 8, sv: 0 },
      { id: 'towerjo01', name: 'Josh Towers', role: 'SP', throws: 'R', age: 27, g: 21, gs: 21, outs: 349, h: 145, hr: 21, bb: 23, so: 59, hbp: 8, er: 67, w: 9, l: 9, sv: 0 },
      { id: 'bushda01', name: 'Dave Bush', role: 'SP', throws: 'R', age: 24, g: 16, gs: 16, outs: 293, h: 95, hr: 11, bb: 25, so: 64, hbp: 6, er: 40, w: 5, l: 4, sv: 0, rk: true },
      { id: 'frasoja01', name: 'Jason Frasor', role: 'CL', throws: 'R', age: 26, g: 63, gs: 0, outs: 205, h: 64, hr: 4, bb: 36, so: 54, hbp: 2, er: 31, w: 4, l: 6, sv: 17, rk: true },
      { id: 'adamste01', name: 'Terry Adams', role: 'RP', throws: 'R', age: 31, g: 61, gs: 0, outs: 210, h: 78, hr: 6, bb: 28, so: 55, hbp: 2, er: 32, w: 6, l: 4, sv: 3 },
      { id: 'speieju01', name: 'Justin Speier', role: 'RP', throws: 'R', age: 30, g: 62, gs: 0, outs: 207, h: 63, hr: 9, bb: 23, so: 55, hbp: 5, er: 31, w: 3, l: 8, sv: 7 },
      { id: 'chulkvi01', name: 'Vinnie Chulk', role: 'RP', throws: 'R', age: 25, g: 47, gs: 0, outs: 168, h: 59, hr: 6, bb: 27, so: 43, hbp: 1, er: 29, w: 1, l: 3, sv: 2, rk: true },
      { id: 'ligteke01', name: 'Kerry Ligtenberg', role: 'RP', throws: 'R', age: 33, g: 57, gs: 0, outs: 165, h: 65, hr: 7, bb: 23, so: 49, hbp: 2, er: 31, w: 1, l: 6, sv: 3 },
      { id: 'douglse01', name: 'Sean Douglass', role: 'RP', throws: 'R', age: 25, g: 14, gs: 3, outs: 116, h: 40, hr: 7, bb: 27, so: 32, hbp: 2, er: 29, w: 0, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'milleju01', name: 'Justin Miller', role: 'SP', throws: 'R', age: 26, g: 19, gs: 15, outs: 245, h: 96, hr: 13, bb: 45, so: 49, hbp: 6, er: 54, w: 3, l: 4, sv: 0 },
      { id: 'hentgpa01', name: 'Pat Hentgen', role: 'SP', throws: 'R', age: 35, g: 18, gs: 16, outs: 241, h: 86, hr: 15, bb: 36, so: 44, hbp: 3, er: 50, w: 2, l: 9, sv: 0 },
      { id: 'filebo01', name: 'Bob File', role: 'RP', throws: 'R', age: 27, g: 24, gs: 0, outs: 101, h: 46, hr: 4, bb: 12, so: 15, hbp: 2, er: 20, w: 1, l: 0, sv: 0 },
      { id: 'fredeke01', name: 'Kevin Frederick', role: 'RP', throws: 'R', age: 27, g: 22, gs: 0, outs: 86, h: 32, hr: 4, bb: 17, so: 21, hbp: 1, er: 22, w: 0, l: 2, sv: 0, rk: true },
      { id: 'nakammi01', name: 'Micheal Nakamura', role: 'RP', throws: 'R', age: 27, g: 19, gs: 0, outs: 77, h: 30, hr: 7, bb: 6, so: 25, hbp: 2, er: 21, w: 0, l: 3, sv: 0, rk: true },
    ],
  },
  // CWS (CHA 2004)
  {
    franchiseId: 'CWS',
    season: 2004,
    batters: [
      { id: 'davisbe01', name: 'Ben Davis', pos: 'C', bats: 'S', age: 27, pa: 208, h: 43, double: 11, triple: 0, hr: 5, bb: 13, so: 48, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 68, arm: 69 },
      { id: 'konerpa01', name: 'Paul Konerko', pos: '1B', bats: 'R', age: 28, pa: 643, h: 154, double: 24, triple: 0, hr: 34, bb: 61, so: 89, hbp: 6, sb: 1, cs: 0, sec: '3B', fld: 72 },
      { id: 'uribeju01', name: 'Juan Uribe', pos: '2B', bats: 'R', age: 25, pa: 553, h: 135, double: 29, triple: 6, hr: 18, bb: 31, so: 99, hbp: 4, sb: 9, cs: 7, sec: 'SS', fld: 74 },
      { id: 'credejo01', name: 'Joe Crede', pos: '3B', bats: 'R', age: 26, pa: 543, h: 125, double: 27, triple: 1, hr: 20, bb: 32, so: 78, hbp: 8, sb: 1, cs: 2, sec: '1B', fld: 64 },
      { id: 'valenjo03', name: 'Jose Valentin', pos: 'SS', bats: 'S', age: 34, pa: 504, h: 103, double: 22, triple: 3, hr: 27, bb: 44, so: 118, hbp: 3, sb: 7, cs: 4, sec: '3B', fld: 78 },
      { id: 'leeca01', name: 'Carlos Lee', pos: 'LF', bats: 'R', age: 28, pa: 658, h: 174, double: 35, triple: 1, hr: 31, bb: 53, so: 87, hbp: 5, sb: 12, cs: 5, sec: 'RF', fld: 75, arm: 75 },
      { id: 'rowanaa01', name: 'Aaron Rowand', pos: 'CF', bats: 'R', age: 26, pa: 534, h: 146, double: 34, triple: 2, hr: 21, bb: 27, so: 87, hbp: 10, sb: 12, cs: 4, sec: 'LF', fld: 68, arm: 75 },
      { id: 'borchjo01', name: 'Joe Borchard', pos: 'RF', bats: 'S', age: 25, pa: 222, h: 36, double: 4, triple: 1, hr: 8, bb: 18, so: 60, hbp: 1, sb: 1, cs: 1, sec: 'CF', fld: 64, arm: 72, rk: true },
      { id: 'harriwi01', name: 'Willie Harris', pos: 'DH', bats: 'L', age: 26, pa: 471, h: 103, double: 14, triple: 2, hr: 2, bb: 45, so: 78, hbp: 1, sb: 22, cs: 6, sec: '1B', fld: 74 },
    ],
    bench: [
      { id: 'perezti01', name: 'Timo Perez', pos: 'RF', bats: 'L', age: 29, pa: 321, h: 77, double: 15, triple: 1, hr: 5, bb: 15, so: 26, hbp: 2, sb: 4, cs: 3, sec: 'CF', fld: 70, arm: 79 },
      { id: 'thomafr04', name: 'Frank Thomas', pos: 'DH', bats: 'R', age: 36, pa: 311, h: 67, double: 16, triple: 0, hr: 18, bb: 52, so: 56, hbp: 5, sb: 0, cs: 1, sec: '1B' },
      { id: 'evereca01', name: 'Carl Everett', pos: 'DH', bats: 'S', age: 33, pa: 310, h: 75, double: 15, triple: 1, hr: 11, bb: 23, so: 46, hbp: 8, sb: 3, cs: 1, sec: 'RF' },
      { id: 'gloadro01', name: 'Ross Gload', pos: '1B', bats: 'L', age: 28, pa: 260, h: 74, double: 16, triple: 0, hr: 7, bb: 20, so: 38, hbp: 2, sb: 0, cs: 3, sec: 'LF', fld: 75, rk: true },
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 30, pa: 222, h: 62, double: 14, triple: 1, hr: 10, bb: 18, so: 24, hbp: 2, sb: 2, cs: 2, sec: 'CF', fld: 79, arm: 62 },
    ],
    reserveBatters: [
      { id: 'alomasa02', name: 'Sandy Alomar', pos: 'C', bats: 'R', age: 38, pa: 164, h: 39, double: 7, triple: 0, hr: 3, bb: 7, so: 15, hbp: 1, sb: 0, cs: 0, fld: 67, arm: 77 },
      { id: 'burkeja02', name: 'Jamie Burke', pos: 'C', bats: 'R', age: 32, pa: 133, h: 40, double: 9, triple: 0, hr: 0, bb: 10, so: 12, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 70, arm: 78, rk: true },
      { id: 'valdewi01', name: 'Wilson Valdez', pos: 'SS', bats: 'R', age: 26, pa: 46, h: 10, double: 1, triple: 0, hr: 1, bb: 2, so: 5, hbp: 0, sb: 1, cs: 2, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'buehrma01', name: 'Mark Buehrle', role: 'SP', throws: 'L', age: 25, g: 35, gs: 35, outs: 736, h: 256, hr: 29, bb: 57, so: 147, hbp: 6, er: 106, w: 16, l: 10, sv: 0, fld: 76 },
      { id: 'garlajo01', name: 'Jon Garland', role: 'SP', throws: 'R', age: 24, g: 34, gs: 33, outs: 651, h: 218, hr: 32, bb: 81, so: 118, hbp: 5, er: 114, w: 12, l: 11, sv: 0, fld: 76 },
      { id: 'loaizes01', name: 'Esteban Loaiza', role: 'SP', throws: 'R', age: 32, g: 31, gs: 27, outs: 549, h: 204, hr: 24, bb: 60, so: 141, hbp: 5, er: 97, w: 10, l: 7, sv: 0, fld: 76 },
      { id: 'schoesc01', name: 'Scott Schoeneweis', role: 'SP', throws: 'L', age: 30, g: 20, gs: 19, outs: 338, h: 124, hr: 15, bb: 46, so: 75, hbp: 4, er: 66, w: 6, l: 9, sv: 0 },
      { id: 'takatsh01', name: 'Shingo Takatsu', role: 'CL', throws: 'R', age: 35, g: 59, gs: 0, outs: 187, h: 40, hr: 6, bb: 21, so: 50, hbp: 2, er: 16, w: 6, l: 4, sv: 19, rk: true },
      { id: 'marteda01', name: 'Damaso Marte', role: 'RP', throws: 'L', age: 29, g: 74, gs: 0, outs: 221, h: 53, hr: 7, bb: 32, so: 77, hbp: 3, er: 22, w: 6, l: 5, sv: 6 },
      { id: 'cottsne01', name: 'Neal Cotts', role: 'RP', throws: 'L', age: 24, g: 56, gs: 1, outs: 196, h: 61, hr: 12, bb: 35, so: 55, hbp: 3, er: 42, w: 4, l: 4, sv: 0, rk: true },
      { id: 'adkinjo01', name: 'Jon Adkins', role: 'RP', throws: 'R', age: 26, g: 50, gs: 0, outs: 186, h: 73, hr: 12, bb: 22, so: 42, hbp: 2, er: 32, w: 2, l: 3, sv: 0, rk: true },
      { id: 'politcl01', name: 'Cliff Politte', role: 'RP', throws: 'R', age: 30, g: 54, gs: 0, outs: 154, h: 51, hr: 7, bb: 21, so: 47, hbp: 2, er: 27, w: 0, l: 3, sv: 1 },
      { id: 'diazfe01', name: 'Felix Diaz', role: 'RP', throws: 'R', age: 23, g: 18, gs: 7, outs: 148, h: 62, hr: 13, bb: 16, so: 33, hbp: 3, er: 37, w: 2, l: 5, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'jacksmi02', name: 'Michael Jackson', role: 'RP', throws: 'R', age: 39, g: 45, gs: 0, outs: 140, h: 54, hr: 6, bb: 14, so: 26, hbp: 3, er: 24, w: 2, l: 0, sv: 0 },
      { id: 'grillja01', name: 'Jason Grilli', role: 'RP', throws: 'R', age: 27, g: 8, gs: 8, outs: 135, h: 52, hr: 11, bb: 20, so: 26, hbp: 3, er: 37, w: 2, l: 3, sv: 0, rk: true },
      { id: 'wrighda02', name: 'Dan Wright', role: 'RP', throws: 'R', age: 26, g: 4, gs: 4, outs: 53, h: 21, hr: 4, bb: 9, so: 12, hbp: 1, er: 13, w: 0, l: 4, sv: 0 },
      { id: 'munozar01', name: 'Arnie Munoz', role: 'RP', throws: 'L', age: 22, g: 11, gs: 1, outs: 43, h: 20, hr: 4, bb: 12, so: 11, hbp: 1, er: 16, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // CLE (CLE 2004)
  {
    franchiseId: 'CLE',
    season: 2004,
    batters: [
      { id: 'martivi01', name: 'Victor Martinez', pos: 'C', bats: 'S', age: 25, pa: 591, h: 149, double: 34, triple: 1, hr: 20, bb: 57, so: 69, hbp: 5, sb: 1, cs: 1, sec: '1B', fld: 71, arm: 66 },
      { id: 'brousbe01', name: 'Ben Broussard', pos: '1B', bats: 'L', age: 27, pa: 485, h: 112, double: 26, triple: 4, hr: 17, bb: 45, so: 92, hbp: 9, sb: 4, cs: 2, sec: 'LF', fld: 71 },
      { id: 'belliro01', name: 'Ronnie Belliard', pos: '2B', bats: 'R', age: 29, pa: 663, h: 163, double: 44, triple: 1, hr: 11, bb: 59, so: 96, hbp: 2, sb: 5, cs: 3, sec: '3B', fld: 65 },
      { id: 'blakeca01', name: 'Casey Blake', pos: '3B', bats: 'R', age: 30, pa: 668, h: 157, double: 37, triple: 2, hr: 24, bb: 58, so: 131, hbp: 10, sb: 6, cs: 9, sec: '1B', fld: 66 },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 37, pa: 651, h: 159, double: 29, triple: 4, hr: 8, bb: 58, so: 59, hbp: 2, sb: 19, cs: 7, fld: 69 },
      { id: 'lawtoma02', name: 'Matt Lawton', pos: 'LF', bats: 'L', age: 32, pa: 680, h: 156, double: 27, triple: 0, hr: 21, bb: 75, so: 76, hbp: 11, sb: 20, cs: 8, sec: 'RF', fld: 71, arm: 72 },
      { id: 'crispco01', name: 'Coco Crisp', pos: 'CF', bats: 'S', age: 24, pa: 538, h: 140, double: 23, triple: 4, hr: 11, bb: 33, so: 67, hbp: 0, sb: 19, cs: 12, sec: 'LF', fld: 64, arm: 67 },
      { id: 'gerutjo01', name: 'Jody Gerut', pos: 'RF', bats: 'L', age: 26, pa: 548, h: 128, double: 32, triple: 4, hr: 16, bb: 47, so: 64, hbp: 7, sb: 10, cs: 6, sec: 'LF', fld: 73, arm: 68 },
      { id: 'hafnetr01', name: 'Travis Hafner', pos: 'DH', bats: 'L', age: 27, pa: 573, h: 144, double: 39, triple: 4, hr: 27, bb: 60, so: 120, hbp: 17, sb: 3, cs: 2, sec: '1B' },
    ],
    bench: [
      { id: 'merlolo01', name: 'Lou Merloni', pos: '1B', bats: 'R', age: 33, pa: 214, h: 51, double: 11, triple: 1, hr: 3, bb: 19, so: 40, hbp: 3, sb: 1, cs: 2, sec: '3B', fld: 63 },
      { id: 'escobal01', name: 'Alex Escobar', pos: 'CF', bats: 'R', age: 25, pa: 179, h: 36, double: 7, triple: 1, hr: 3, bb: 20, so: 46, hbp: 1, sb: 1, cs: 1, sec: 'RF', fld: 72, arm: 88 },
      { id: 'sizemgr01', name: 'Grady Sizemore', pos: 'CF', bats: 'L', age: 21, pa: 159, h: 34, double: 6, triple: 2, hr: 4, bb: 14, so: 34, hbp: 5, sb: 2, cs: 0, sec: 'LF', fld: 75, arm: 59, rk: true },
      { id: 'lakerti01', name: 'Tim Laker', pos: 'C', bats: 'R', age: 34, pa: 128, h: 27, double: 5, triple: 0, hr: 3, bb: 7, so: 28, hbp: 1, sb: 1, cs: 1, fld: 60, arm: 65 },
      { id: 'mcdonjo03', name: 'John McDonald', pos: 'SS', bats: 'R', age: 29, pa: 100, h: 20, double: 4, triple: 1, hr: 1, bb: 4, so: 14, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 75 },
    ],
    reserveBatters: [
      { id: 'ludwiry01', name: 'Ryan Ludwick', pos: 'RF', bats: 'R', age: 25, pa: 54, h: 12, double: 3, triple: 0, hr: 2, bb: 3, so: 15, hbp: 1, sb: 1, cs: 0, sec: 'CF' },
    ],
    pitchers: [
      { id: 'westbja01', name: 'Jake Westbrook', role: 'SP', throws: 'R', age: 26, g: 33, gs: 30, outs: 647, h: 212, hr: 18, bb: 68, so: 107, hbp: 9, er: 88, w: 14, l: 9, sv: 0, fld: 84 },
      { id: 'sabatcc01', name: 'CC Sabathia', role: 'SP', throws: 'L', age: 23, g: 30, gs: 30, outs: 564, h: 178, hr: 19, bb: 70, so: 137, hbp: 5, er: 83, w: 11, l: 10, sv: 0, fld: 62 },
      { id: 'leecl02', name: 'Cliff Lee', role: 'SP', throws: 'L', age: 25, g: 33, gs: 33, outs: 537, h: 181, hr: 29, bb: 81, so: 161, hbp: 10, er: 102, w: 14, l: 8, sv: 0, fld: 59 },
      { id: 'elartsc01', name: 'Scott Elarton', role: 'SP', throws: 'R', age: 28, g: 29, gs: 29, outs: 476, h: 172, hr: 34, bb: 61, so: 94, hbp: 5, er: 103, w: 3, l: 11, sv: 0, fld: 62 },
      { id: 'davisja02', name: 'Jason Davis', role: 'SP', throws: 'R', age: 24, g: 26, gs: 19, outs: 343, h: 139, hr: 16, bb: 44, so: 69, hbp: 5, er: 67, w: 2, l: 7, sv: 0 },
      { id: 'wickmbo01', name: 'Bob Wickman', role: 'CL', throws: 'R', age: 35, g: 30, gs: 0, outs: 89, h: 34, hr: 4, bb: 10, so: 27, hbp: 2, er: 14, w: 0, l: 2, sv: 13 },
      { id: 'whiteri01', name: 'Rick White', role: 'RP', throws: 'R', age: 35, g: 59, gs: 0, outs: 235, h: 87, hr: 14, bb: 27, so: 51, hbp: 3, er: 46, w: 5, l: 5, sv: 1 },
      { id: 'riskeda01', name: 'David Riske', role: 'RP', throws: 'R', age: 27, g: 72, gs: 0, outs: 232, h: 66, hr: 11, bb: 36, so: 85, hbp: 3, er: 30, w: 7, l: 3, sv: 5 },
      { id: 'betanra01', name: 'Rafael Betancourt', role: 'RP', throws: 'R', age: 29, g: 68, gs: 0, outs: 200, h: 66, hr: 8, bb: 20, so: 74, hbp: 0, er: 26, w: 5, l: 6, sv: 4, rk: true },
      { id: 'durbich01', name: 'Chad Durbin', role: 'RP', throws: 'R', age: 26, g: 24, gs: 8, outs: 182, h: 76, hr: 12, bb: 33, so: 48, hbp: 5, er: 48, w: 6, l: 7, sv: 0 },
      { id: 'millema02', name: 'Matt Miller', role: 'RP', throws: 'R', age: 32, g: 57, gs: 0, outs: 166, h: 43, hr: 1, bb: 23, so: 55, hbp: 6, er: 19, w: 4, l: 1, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'tadanka01', name: 'Kazuhito Tadano', role: 'RP', throws: 'R', age: 24, g: 14, gs: 4, outs: 151, h: 55, hr: 6, bb: 18, so: 39, hbp: 3, er: 26, w: 1, l: 1, sv: 0, rk: true },
      { id: 'howrybo01', name: 'Bob Howry', role: 'RP', throws: 'R', age: 30, g: 37, gs: 0, outs: 128, h: 40, hr: 5, bb: 13, so: 34, hbp: 2, er: 17, w: 4, l: 2, sv: 0 },
      { id: 'jimenjo01', name: 'Jose Jimenez', role: 'RP', throws: 'R', age: 30, g: 31, gs: 0, outs: 109, h: 47, hr: 4, bb: 11, so: 19, hbp: 3, er: 24, w: 1, l: 7, sv: 8 },
      { id: 'damicje01', name: 'Jeff D\'Amico', role: 'RP', throws: 'R', age: 28, g: 7, gs: 7, outs: 92, h: 38, hr: 5, bb: 8, so: 19, hbp: 1, er: 19, w: 1, l: 2, sv: 0 },
      { id: 'stewasc01', name: 'Scott Stewart', role: 'RP', throws: 'L', age: 28, g: 34, gs: 0, outs: 78, h: 36, hr: 4, bb: 11, so: 26, hbp: 0, er: 15, w: 1, l: 2, sv: 0 },
    ],
  },
  // DET (DET 2004)
  {
    franchiseId: 'DET',
    season: 2004,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 32, pa: 575, h: 166, double: 35, triple: 2, hr: 19, bb: 45, so: 91, hbp: 4, sb: 8, cs: 5, sec: '1B', fld: 70, arm: 71 },
      { id: 'penaca01', name: 'Carlos Pena', pos: '1B', bats: 'L', age: 26, pa: 561, h: 119, double: 22, triple: 5, hr: 24, bb: 63, so: 141, hbp: 4, sb: 6, cs: 3, sec: '3B', fld: 72 },
      { id: 'infanom01', name: 'Omar Infante', pos: '2B', bats: 'R', age: 22, pa: 556, h: 130, double: 24, triple: 7, hr: 12, bb: 40, so: 105, hbp: 1, sb: 13, cs: 7, sec: 'SS', fld: 68 },
      { id: 'ingebr01', name: 'Brandon Inge', pos: '3B', bats: 'R', age: 27, pa: 458, h: 103, double: 17, triple: 6, hr: 12, bb: 31, so: 89, hbp: 5, sb: 4, cs: 4, sec: '1B', fld: 75 },
      { id: 'guillca01', name: 'Carlos Guillen', pos: 'SS', bats: 'S', age: 28, pa: 583, h: 153, double: 32, triple: 8, hr: 15, bb: 56, so: 88, hbp: 2, sb: 9, cs: 5, sec: '3B', fld: 80 },
      { id: 'whitero02', name: 'Rondell White', pos: 'LF', bats: 'R', age: 32, pa: 498, h: 123, double: 21, triple: 2, hr: 19, bb: 33, so: 77, hbp: 8, sb: 1, cs: 3, sec: 'CF', fld: 67, arm: 64 },
      { id: 'sanchal03', name: 'Alex Sanchez', pos: 'CF', bats: 'L', age: 27, pa: 352, h: 99, double: 11, triple: 4, hr: 1, bb: 13, so: 47, hbp: 1, sb: 26, cs: 13, sec: 'LF', fld: 58, arm: 65 },
      { id: 'higgibo02', name: 'Bobby Higginson', pos: 'RF', bats: 'L', age: 33, pa: 531, h: 113, double: 20, triple: 3, hr: 12, bb: 62, so: 74, hbp: 6, sb: 7, cs: 5, sec: 'LF', fld: 69, arm: 79 },
      { id: 'monrocr01', name: 'Craig Monroe', pos: 'DH', bats: 'R', age: 27, pa: 481, h: 121, double: 24, triple: 2, hr: 20, bb: 28, so: 85, hbp: 2, sb: 3, cs: 4, sec: 'LF', fld: 74, arm: 67 },
    ],
    bench: [
      { id: 'youngdm01', name: 'Dmitri Young', pos: 'DH', bats: 'S', age: 30, pa: 432, h: 110, double: 23, triple: 3, hr: 18, bb: 35, so: 80, hbp: 7, sb: 1, cs: 1, sec: 'LF' },
      { id: 'munsoer01', name: 'Eric Munson', pos: '3B', bats: 'L', age: 26, pa: 357, h: 70, double: 12, triple: 1, hr: 18, bb: 31, so: 78, hbp: 4, sb: 2, cs: 1, sec: '1B', fld: 70 },
      { id: 'thamema01', name: 'Marcus Thames', pos: 'LF', bats: 'R', age: 27, pa: 184, h: 40, double: 10, triple: 0, hr: 8, bb: 16, so: 42, hbp: 3, sb: 0, cs: 1, sec: 'RF', fld: 82, arm: 74, rk: true },
      { id: 'smithja05', name: 'Jason Smith', pos: '2B', bats: 'L', age: 26, pa: 169, h: 36, double: 6, triple: 4, hr: 5, bb: 8, so: 39, hbp: 1, sb: 2, cs: 2, sec: 'SS', fld: 80, rk: true },
      { id: 'loganno01', name: 'Nook Logan', pos: 'CF', bats: 'S', age: 24, pa: 152, h: 37, double: 5, triple: 2, hr: 0, bb: 13, so: 24, hbp: 0, sb: 8, cs: 2, sec: 'LF', fld: 83, arm: 74, rk: true },
    ],
    reserveBatters: [
      { id: 'vinafe01', name: 'Fernando Vina', pos: '2B', bats: 'L', age: 35, pa: 131, h: 30, double: 6, triple: 1, hr: 1, bb: 7, so: 9, hbp: 4, sb: 2, cs: 2, sec: 'SS', fld: 80 },
      { id: 'nortogr01', name: 'Greg Norton', pos: '3B', bats: 'S', age: 31, pa: 99, h: 20, double: 5, triple: 0, hr: 3, bb: 10, so: 23, hbp: 0, sb: 1, cs: 1, sec: '1B' },
      { id: 'sheltch01', name: 'Chris Shelton', pos: 'DH', bats: 'R', age: 24, pa: 56, h: 9, double: 1, triple: 0, hr: 1, bb: 9, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'marotmi01', name: 'Mike Maroth', role: 'SP', throws: 'L', age: 26, g: 33, gs: 33, outs: 651, h: 247, hr: 28, bb: 58, so: 103, hbp: 7, er: 115, w: 11, l: 13, sv: 0, fld: 75 },
      { id: 'johnsja02', name: 'Jason Johnson', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 590, h: 219, hr: 23, bb: 67, so: 125, hbp: 7, er: 102, w: 8, l: 15, sv: 0, fld: 59 },
      { id: 'roberna01', name: 'Nate Robertson', role: 'SP', throws: 'L', age: 26, g: 34, gs: 32, outs: 590, h: 213, hr: 30, bb: 70, so: 151, hbp: 4, er: 109, w: 12, l: 10, sv: 1, fld: 58 },
      { id: 'bondeje01', name: 'Jeremy Bonderman', role: 'SP', throws: 'R', age: 21, g: 33, gs: 32, outs: 552, h: 184, hr: 24, bb: 69, so: 149, hbp: 8, er: 103, w: 11, l: 13, sv: 0, fld: 62 },
      { id: 'knottga01', name: 'Gary Knotts', role: 'SP', throws: 'R', age: 27, g: 36, gs: 19, outs: 406, h: 143, hr: 20, bb: 61, so: 78, hbp: 4, er: 81, w: 7, l: 6, sv: 2, fld: 71 },
      { id: 'urbinug01', name: 'Ugueth Urbina', role: 'CL', throws: 'R', age: 30, g: 54, gs: 0, outs: 162, h: 40, hr: 7, bb: 26, so: 59, hbp: 1, er: 22, w: 4, l: 6, sv: 21 },
      { id: 'yanes01', name: 'Esteban Yan', role: 'RP', throws: 'R', age: 29, g: 69, gs: 0, outs: 261, h: 95, hr: 11, bb: 32, so: 68, hbp: 5, er: 44, w: 3, l: 6, sv: 7 },
      { id: 'levinal01', name: 'Al Levine', role: 'RP', throws: 'R', age: 36, g: 65, gs: 0, outs: 212, h: 76, hr: 10, bb: 28, so: 34, hbp: 2, er: 31, w: 3, l: 4, sv: 0 },
      { id: 'walkeja01', name: 'Jamie Walker', role: 'RP', throws: 'L', age: 32, g: 70, gs: 0, outs: 194, h: 64, hr: 9, bb: 14, so: 51, hbp: 2, er: 24, w: 3, l: 4, sv: 1 },
      { id: 'ledezwi01', name: 'Wil Ledezma', role: 'RP', throws: 'L', age: 23, g: 15, gs: 8, outs: 160, h: 58, hr: 5, bb: 20, so: 29, hbp: 2, er: 29, w: 4, l: 3, sv: 0 },
      { id: 'patteda04', name: 'Danny Patterson', role: 'RP', throws: 'R', age: 33, g: 37, gs: 0, outs: 125, h: 43, hr: 6, bb: 15, so: 29, hbp: 5, er: 23, w: 0, l: 4, sv: 2 },
    ],
    reservePitchers: [
      { id: 'colyest01', name: 'Steve Colyer', role: 'RP', throws: 'L', age: 25, g: 41, gs: 0, outs: 96, h: 34, hr: 6, bb: 22, so: 30, hbp: 1, er: 19, w: 1, l: 0, sv: 0, rk: true },
      { id: 'dingmcr01', name: 'Craig Dingman', role: 'RP', throws: 'R', age: 30, g: 24, gs: 0, outs: 88, h: 33, hr: 3, bb: 22, so: 16, hbp: 4, er: 22, w: 2, l: 2, sv: 0, rk: true },
      { id: 'cornena01', name: 'Nate Cornejo', role: 'RP', throws: 'R', age: 24, g: 5, gs: 5, outs: 77, h: 36, hr: 3, bb: 9, so: 8, hbp: 1, er: 17, w: 1, l: 3, sv: 0 },
      { id: 'novoaro01', name: 'Roberto Novoa', role: 'RP', throws: 'R', age: 24, g: 16, gs: 0, outs: 63, h: 25, hr: 4, bb: 6, so: 15, hbp: 2, er: 13, w: 1, l: 1, sv: 0, rk: true },
      { id: 'ennisjo01', name: 'John Ennis', role: 'RP', throws: 'R', age: 24, g: 12, gs: 0, outs: 48, h: 20, hr: 3, bb: 5, so: 12, hbp: 0, er: 14, w: 0, l: 0, sv: 1, rk: true },
    ],
  },
  // KCR (KCA 2004)
  {
    franchiseId: 'KCR',
    season: 2004,
    batters: [
      { id: 'buckjo01', name: 'John Buck', pos: 'C', bats: 'R', age: 23, pa: 258, h: 56, double: 9, triple: 0, hr: 12, bb: 15, so: 79, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 68, arm: 71, rk: true },
      { id: 'harveke01', name: 'Ken Harvey', pos: '1B', bats: 'R', age: 26, pa: 494, h: 127, double: 23, triple: 1, hr: 13, bb: 28, so: 89, hbp: 7, sb: 1, cs: 2, sec: '3B', fld: 72 },
      { id: 'graffto01', name: 'Tony Graffanino', pos: '2B', bats: 'R', age: 32, pa: 314, h: 73, double: 13, triple: 2, hr: 5, bb: 27, so: 40, hbp: 3, sb: 9, cs: 1, sec: '3B', fld: 87 },
      { id: 'randajo01', name: 'Joe Randa', pos: '3B', bats: 'R', age: 34, pa: 539, h: 138, double: 31, triple: 2, hr: 11, bb: 40, so: 68, hbp: 7, sb: 1, cs: 1, sec: '2B', fld: 77 },
      { id: 'berroan01', name: 'Angel Berroa', pos: 'SS', bats: 'R', age: 26, pa: 554, h: 137, double: 26, triple: 6, hr: 11, bb: 25, so: 87, hbp: 13, sb: 16, cs: 6, sec: '2B', fld: 72 },
      { id: 'brownde02', name: 'Dee Brown', pos: 'LF', bats: 'L', age: 26, pa: 209, h: 47, double: 8, triple: 0, hr: 4, bb: 11, so: 53, hbp: 2, sb: 2, cs: 2, sec: 'RF', fld: 68, arm: 76 },
      { id: 'dejesda01', name: 'David DeJesus', pos: 'CF', bats: 'L', age: 24, pa: 413, h: 104, double: 15, triple: 4, hr: 7, bb: 33, so: 53, hbp: 10, sb: 8, cs: 11, sec: 'LF', fld: 77, arm: 66, rk: true },
      { id: 'nunezab02', name: 'Abraham Nunez', pos: 'RF', bats: 'S', age: 27, pa: 322, h: 61, double: 10, triple: 1, hr: 6, bb: 33, so: 69, hbp: 0, sb: 1, cs: 3, sec: 'LF', fld: 81, arm: 65, rk: true },
      { id: 'stairma01', name: 'Matt Stairs', pos: 'DH', bats: 'L', age: 36, pa: 496, h: 117, double: 23, triple: 2, hr: 22, bb: 54, so: 89, hbp: 7, sb: 1, cs: 0, sec: 'RF', fld: 72, arm: 72 },
    ],
    bench: [
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: '1B', bats: 'R', age: 30, pa: 452, h: 119, double: 22, triple: 0, hr: 20, bb: 46, so: 46, hbp: 4, sb: 4, cs: 3, sec: '3B', fld: 71 },
      { id: 'relafde01', name: 'Desi Relaford', pos: '3B', bats: 'S', age: 30, pa: 430, h: 92, double: 17, triple: 2, hr: 6, bb: 33, so: 56, hbp: 6, sb: 10, cs: 4, sec: 'SS', fld: 71 },
      { id: 'santibe01', name: 'Benito Santiago', pos: 'C', bats: 'R', age: 39, pa: 189, h: 49, double: 9, triple: 1, hr: 5, bb: 11, so: 30, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 68, arm: 64 },
      { id: 'gotayru01', name: 'Ruben Gotay', pos: '2B', bats: 'S', age: 21, pa: 166, h: 41, double: 7, triple: 3, hr: 1, bb: 9, so: 36, hbp: 2, sb: 0, cs: 1, sec: 'SS', fld: 58, rk: true },
      { id: 'guielaa01', name: 'Aaron Guiel', pos: 'LF', bats: 'L', age: 31, pa: 157, h: 32, double: 9, triple: 0, hr: 5, bb: 13, so: 32, hbp: 4, sb: 1, cs: 2, sec: 'RF', fld: 78, arm: 77 },
    ],
    reserveBatters: [
      { id: 'pickeca01', name: 'Calvin Pickering', pos: 'DH', bats: 'L', age: 27, pa: 142, h: 30, double: 8, triple: 1, hr: 7, bb: 18, so: 42, hbp: 0, sb: 0, cs: 0, sec: '1B' },
      { id: 'gonzaju03', name: 'Juan Gonzalez', pos: 'RF', bats: 'R', age: 34, pa: 138, h: 37, double: 7, triple: 1, hr: 7, bb: 7, so: 25, hbp: 1, sb: 0, cs: 0, sec: 'LF', fld: 62, arm: 79 },
      { id: 'mateoru01', name: 'Ruben Mateo', pos: 'RF', bats: 'R', age: 26, pa: 137, h: 29, double: 5, triple: 1, hr: 2, bb: 8, so: 29, hbp: 2, sb: 0, cs: 0, sec: 'CF', fld: 73, arm: 87 },
      { id: 'castial01', name: 'Alberto Castillo', pos: 'C', bats: 'R', age: 34, pa: 105, h: 23, double: 6, triple: 0, hr: 1, bb: 12, so: 14, hbp: 0, sb: 0, cs: 2, fld: 75, arm: 74 },
      { id: 'stinnke01', name: 'Kelly Stinnett', pos: 'C', bats: 'R', age: 34, pa: 69, h: 15, double: 3, triple: 0, hr: 2, bb: 5, so: 17, hbp: 1, sb: 0, cs: 0, fld: 64, arm: 70 },
    ],
    pitchers: [
      { id: 'mayda02', name: 'Darrell May', role: 'SP', throws: 'L', age: 32, g: 31, gs: 31, outs: 558, h: 215, hr: 35, bb: 56, so: 119, hbp: 2, er: 104, w: 9, l: 19, sv: 0, fld: 63 },
      { id: 'anderbr02', name: 'Brian Anderson', role: 'SP', throws: 'L', age: 32, g: 35, gs: 26, outs: 498, h: 205, hr: 29, bb: 45, so: 76, hbp: 2, er: 92, w: 6, l: 12, sv: 0, fld: 66 },
      { id: 'gobblji01', name: 'Jimmy Gobble', role: 'SP', throws: 'L', age: 22, g: 25, gs: 24, outs: 444, h: 157, hr: 24, bb: 43, so: 56, hbp: 5, er: 85, w: 9, l: 8, sv: 0, fld: 56 },
      { id: 'greinza01', name: 'Zack Greinke', role: 'SP', throws: 'R', age: 20, g: 24, gs: 24, outs: 435, h: 143, hr: 26, bb: 26, so: 100, hbp: 8, er: 64, w: 8, l: 11, sv: 0, fld: 72, rk: true },
      { id: 'reyesde01', name: 'Dennys Reyes', role: 'SP', throws: 'L', age: 27, g: 40, gs: 12, outs: 324, h: 116, hr: 12, bb: 53, so: 90, hbp: 3, er: 62, w: 4, l: 8, sv: 0 },
      { id: 'affelje01', name: 'Jeremy Affeldt', role: 'CL', throws: 'L', age: 25, g: 38, gs: 8, outs: 229, h: 86, hr: 7, bb: 29, so: 58, hbp: 3, er: 39, w: 3, l: 4, sv: 13 },
      { id: 'campsh01', name: 'Shawn Camp', role: 'RP', throws: 'R', age: 28, g: 42, gs: 0, outs: 200, h: 74, hr: 10, bb: 16, so: 51, hbp: 5, er: 29, w: 2, l: 2, sv: 2, rk: true },
      { id: 'sullisc01', name: 'Scott Sullivan', role: 'RP', throws: 'R', age: 33, g: 49, gs: 0, outs: 181, h: 65, hr: 8, bb: 27, so: 52, hbp: 6, er: 32, w: 3, l: 4, sv: 0 },
      { id: 'seaneru01', name: 'Rudy Seanez', role: 'RP', throws: 'R', age: 35, g: 39, gs: 0, outs: 138, h: 40, hr: 4, bb: 22, so: 47, hbp: 0, er: 20, w: 3, l: 2, sv: 0 },
      { id: 'cerdaja01', name: 'Jaime Cerda', role: 'RP', throws: 'L', age: 25, g: 53, gs: 0, outs: 137, h: 42, hr: 2, bb: 29, so: 32, hbp: 2, er: 20, w: 1, l: 4, sv: 2 },
      { id: 'fieldna01', name: 'Nate Field', role: 'RP', throws: 'R', age: 28, g: 43, gs: 0, outs: 133, h: 40, hr: 6, bb: 21, so: 32, hbp: 2, er: 21, w: 2, l: 3, sv: 3, rk: true },
    ],
    reservePitchers: [
      { id: 'woodmi01', name: 'Mike Wood', role: 'SP', throws: 'R', age: 24, g: 17, gs: 17, outs: 300, h: 115, hr: 15, bb: 29, so: 58, hbp: 7, er: 69, w: 3, l: 8, sv: 0, rk: true },
      { id: 'georgch02', name: 'Chris George', role: 'RP', throws: 'L', age: 24, g: 10, gs: 7, outs: 127, h: 58, hr: 6, bb: 22, so: 17, hbp: 1, er: 34, w: 1, l: 2, sv: 0 },
      { id: 'carradj01', name: 'D. J. Carrasco', role: 'RP', throws: 'R', age: 27, g: 30, gs: 0, outs: 106, h: 38, hr: 4, bb: 17, so: 24, hbp: 3, er: 19, w: 2, l: 2, sv: 0 },
      { id: 'serraji01', name: 'Jimmy Serrano', role: 'RP', throws: 'R', age: 28, g: 10, gs: 5, outs: 98, h: 35, hr: 5, bb: 12, so: 25, hbp: 1, er: 17, w: 1, l: 2, sv: 0, rk: true },
      { id: 'bautide01', name: 'Denny Bautista', role: 'RP', throws: 'R', age: 23, g: 7, gs: 5, outs: 89, h: 44, hr: 3, bb: 13, so: 19, hbp: 3, er: 28, w: 0, l: 4, sv: 0, rk: true },
    ],
  },
  // MIN (MIN 2004)
  {
    franchiseId: 'MIN',
    season: 2004,
    batters: [
      { id: 'blanche01', name: 'Henry Blanco', pos: 'C', bats: 'R', age: 32, pa: 353, h: 65, double: 18, triple: 1, hr: 8, bb: 22, so: 56, hbp: 3, sb: 0, cs: 2, sec: '1B', fld: 71, arm: 84 },
      { id: 'mientdo01', name: 'Doug Mientkiewicz', pos: '1B', bats: 'L', age: 30, pa: 447, h: 102, double: 26, triple: 1, hr: 7, bb: 54, so: 51, hbp: 4, sb: 2, cs: 2, sec: '3B', fld: 70 },
      { id: 'cuddymi01', name: 'Michael Cuddyer', pos: '2B', bats: 'R', age: 25, pa: 382, h: 88, double: 19, triple: 2, hr: 12, bb: 36, so: 74, hbp: 3, sb: 5, cs: 4, sec: '3B', fld: 61 },
      { id: 'koskico01', name: 'Corey Koskie', pos: '3B', bats: 'L', age: 31, pa: 488, h: 112, double: 26, triple: 2, hr: 18, bb: 58, so: 102, hbp: 9, sb: 9, cs: 5, sec: '1B', fld: 66 },
      { id: 'guzmacr01', name: 'Cristian Guzman', pos: 'SS', bats: 'S', age: 26, pa: 624, h: 157, double: 26, triple: 8, hr: 7, bb: 28, so: 72, hbp: 3, sb: 13, cs: 8, sec: '2B', fld: 76 },
      { id: 'fordle01', name: 'Lew Ford', pos: 'LF', bats: 'R', age: 27, pa: 658, h: 172, double: 33, triple: 4, hr: 16, bb: 67, so: 75, hbp: 13, sb: 20, cs: 2, sec: 'CF', fld: 76, arm: 70, rk: true },
      { id: 'hunteto01', name: 'Torii Hunter', pos: 'CF', bats: 'R', age: 28, pa: 569, h: 138, double: 33, triple: 2, hr: 24, bb: 40, so: 100, hbp: 6, sb: 16, cs: 7, sec: 'LF', fld: 71, arm: 67 },
      { id: 'jonesja04', name: 'Jacque Jones', pos: 'RF', bats: 'L', age: 29, pa: 608, h: 156, double: 29, triple: 1, hr: 22, bb: 34, so: 118, hbp: 7, sb: 12, cs: 7, sec: 'LF', fld: 79, arm: 64 },
      { id: 'stewash01', name: 'Shannon Stewart', pos: 'DH', bats: 'R', age: 30, pa: 430, h: 116, double: 24, triple: 2, hr: 9, bb: 40, so: 43, hbp: 3, sb: 5, cs: 3, sec: 'LF', fld: 56, arm: 64 },
    ],
    bench: [
      { id: 'rivaslu01', name: 'Luis Rivas', pos: '2B', bats: 'R', age: 24, pa: 358, h: 85, double: 16, triple: 5, hr: 7, bb: 17, so: 49, hbp: 2, sb: 13, cs: 3, sec: 'SS', fld: 77 },
      { id: 'morneju01', name: 'Justin Morneau', pos: '1B', bats: 'L', age: 23, pa: 312, h: 74, double: 16, triple: 0, hr: 17, bb: 27, so: 59, hbp: 2, sb: 0, cs: 0, sec: '3B', fld: 71, rk: true },
      { id: 'lecroma01', name: 'Matt LeCroy', pos: 'DH', bats: 'R', age: 28, pa: 287, h: 73, double: 14, triple: 0, hr: 11, bb: 18, so: 61, hbp: 4, sb: 0, cs: 1, sec: 'C' },
      { id: 'offerjo01', name: 'Jose Offerman', pos: 'DH', bats: 'S', age: 35, pa: 202, h: 43, double: 12, triple: 2, hr: 2, bb: 27, so: 28, hbp: 0, sb: 3, cs: 2, sec: '1B' },
      { id: 'mauerjo01', name: 'Joe Mauer', pos: 'C', bats: 'L', age: 21, pa: 122, h: 33, double: 8, triple: 1, hr: 6, bb: 11, so: 14, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 75, arm: 76, rk: true },
    ],
    reserveBatters: [
      { id: 'puntoni01', name: 'Nick Punto', pos: '2B', bats: 'S', age: 26, pa: 103, h: 22, double: 1, triple: 0, hr: 2, bb: 10, so: 21, hbp: 0, sb: 4, cs: 0, sec: 'SS', rk: true },
      { id: 'ryanmi03', name: 'Mike Ryan', pos: 'DH', bats: 'L', age: 26, pa: 75, h: 20, double: 4, triple: 1, hr: 2, bb: 5, so: 15, hbp: 0, sb: 1, cs: 1, sec: 'LF', rk: true },
      { id: 'ojedaau01', name: 'Augie Ojeda', pos: '2B', bats: 'S', age: 29, pa: 72, h: 16, double: 1, triple: 0, hr: 1, bb: 8, so: 5, hbp: 1, sb: 1, cs: 1, sec: 'SS' },
      { id: 'kubelja01', name: 'Jason Kubel', pos: 'DH', bats: 'L', age: 22, pa: 67, h: 18, double: 2, triple: 0, hr: 2, bb: 6, so: 9, hbp: 0, sb: 1, cs: 1, sec: '1B', rk: true },
      { id: 'restomi01', name: 'Michael Restovich', pos: 'LF', bats: 'R', age: 25, pa: 51, h: 12, double: 3, triple: 1, hr: 1, bb: 6, so: 10, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'santajo01', name: 'Johan Santana', role: 'SP', throws: 'L', age: 25, g: 34, gs: 34, outs: 684, h: 163, hr: 23, bb: 62, so: 256, hbp: 7, er: 69, w: 20, l: 6, sv: 0, fld: 60 },
      { id: 'radkebr01', name: 'Brad Radke', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 659, h: 234, hr: 26, bb: 28, so: 132, hbp: 6, er: 96, w: 11, l: 8, sv: 0, fld: 68 },
      { id: 'silvaca01', name: 'Carlos Silva', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 609, h: 242, hr: 20, bb: 47, so: 85, hbp: 8, er: 94, w: 14, l: 8, sv: 0, fld: 67 },
      { id: 'lohseky01', name: 'Kyle Lohse', role: 'SP', throws: 'R', age: 25, g: 35, gs: 34, outs: 582, h: 228, hr: 29, bb: 67, so: 124, hbp: 7, er: 110, w: 9, l: 13, sv: 0, fld: 70 },
      { id: 'mulhote01', name: 'Terry Mulholland', role: 'SP', throws: 'L', age: 41, g: 39, gs: 15, outs: 370, h: 157, hr: 19, bb: 37, so: 58, hbp: 6, er: 71, w: 5, l: 9, sv: 0 },
      { id: 'nathajo01', name: 'Joe Nathan', role: 'CL', throws: 'R', age: 29, g: 73, gs: 0, outs: 217, h: 47, hr: 4, bb: 26, so: 82, hbp: 2, er: 17, w: 1, l: 2, sv: 44 },
      { id: 'rincoju01', name: 'Juan Rincon', role: 'RP', throws: 'R', age: 25, g: 77, gs: 0, outs: 246, h: 61, hr: 5, bb: 32, so: 82, hbp: 2, er: 29, w: 11, l: 6, sv: 2 },
      { id: 'romerjc01', name: 'J. C. Romero', role: 'RP', throws: 'L', age: 28, g: 74, gs: 0, outs: 223, h: 64, hr: 5, bb: 40, so: 65, hbp: 5, er: 29, w: 7, l: 4, sv: 1 },
      { id: 'roajo01', name: 'Joe Roa', role: 'RP', throws: 'R', age: 32, g: 48, gs: 0, outs: 210, h: 87, hr: 11, bb: 19, so: 47, hbp: 4, er: 38, w: 2, l: 3, sv: 0 },
      { id: 'greisse01', name: 'Seth Greisinger', role: 'RP', throws: 'R', age: 28, g: 12, gs: 9, outs: 153, h: 67, hr: 11, bb: 16, so: 33, hbp: 2, er: 35, w: 2, l: 5, sv: 0 },
      { id: 'fultzaa01', name: 'Aaron Fultz', role: 'RP', throws: 'L', age: 30, g: 55, gs: 0, outs: 150, h: 53, hr: 6, bb: 22, so: 38, hbp: 2, er: 28, w: 3, l: 3, sv: 1 },
    ],
    reservePitchers: [
      { id: 'balfogr01', name: 'Grant Balfour', role: 'RP', throws: 'R', age: 26, g: 36, gs: 0, outs: 118, h: 35, hr: 5, bb: 21, so: 43, hbp: 1, er: 19, w: 4, l: 1, sv: 0, rk: true },
      { id: 'crainje01', name: 'Jesse Crain', role: 'RP', throws: 'R', age: 22, g: 22, gs: 0, outs: 81, h: 17, hr: 2, bb: 12, so: 14, hbp: 1, er: 6, w: 3, l: 0, sv: 0, rk: true },
      { id: 'guerrma02', name: 'Matt Guerrier', role: 'RP', throws: 'R', age: 25, g: 9, gs: 2, outs: 57, h: 22, hr: 5, bb: 6, so: 11, hbp: 1, er: 12, w: 0, l: 1, sv: 0, rk: true },
      { id: 'pulidca01', name: 'Carlos Pulido', role: 'RP', throws: 'L', age: 32, g: 6, gs: 0, outs: 34, h: 15, hr: 1, bb: 3, so: 7, hbp: 1, er: 9, w: 0, l: 0, sv: 0 },
    ],
  },
  // HOU (HOU 2004)
  {
    franchiseId: 'HOU',
    season: 2004,
    batters: [
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 35, pa: 448, h: 97, double: 13, triple: 2, hr: 5, bb: 36, so: 58, hbp: 3, sb: 3, cs: 2, fld: 76, arm: 67 },
      { id: 'bagweje01', name: 'Jeff Bagwell', pos: '1B', bats: 'R', age: 36, pa: 679, h: 157, double: 29, triple: 2, hr: 31, bb: 93, so: 125, hbp: 8, sb: 8, cs: 4, fld: 61 },
      { id: 'kentje01', name: 'Jeff Kent', pos: '2B', bats: 'R', age: 36, pa: 606, h: 162, double: 37, triple: 5, hr: 27, bb: 47, so: 94, hbp: 5, sb: 6, cs: 2, sec: '3B', fld: 70 },
      { id: 'ensbemo01', name: 'Morgan Ensberg', pos: '3B', bats: 'R', age: 28, pa: 456, h: 113, double: 18, triple: 2, hr: 16, bb: 42, so: 54, hbp: 3, sb: 6, cs: 3, sec: '1B', fld: 62 },
      { id: 'everead01', name: 'Adam Everett', pos: 'SS', bats: 'R', age: 27, pa: 435, h: 101, double: 16, triple: 2, hr: 8, bb: 23, so: 61, hbp: 9, sb: 11, cs: 2, sec: '2B', fld: 70 },
      { id: 'biggicr01', name: 'Craig Biggio', pos: 'LF', bats: 'R', age: 38, pa: 700, h: 169, double: 44, triple: 1, hr: 20, bb: 47, so: 104, hbp: 19, sb: 9, cs: 3, sec: 'CF', fld: 64, arm: 64 },
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 27, pa: 708, h: 170, double: 31, triple: 9, hr: 34, bb: 86, so: 105, hbp: 5, sb: 42, cs: 4, sec: 'LF', fld: 73, arm: 74 },
      { id: 'berkmla01', name: 'Lance Berkman', pos: 'RF', bats: 'S', age: 28, pa: 687, h: 168, double: 38, triple: 4, hr: 31, bb: 119, so: 108, hbp: 9, sb: 8, cs: 5, sec: 'LF', fld: 59, arm: 71 },
      { id: 'lambmi01', name: 'Mike Lamb', pos: 'DH', bats: 'L', age: 28, pa: 312, h: 77, double: 12, triple: 2, hr: 12, bb: 29, so: 57, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 71 },
    ],
    bench: [
      { id: 'vizcajo01', name: 'Jose Vizcaino', pos: 'SS', bats: 'S', age: 36, pa: 385, h: 98, double: 18, triple: 3, hr: 4, bb: 19, so: 39, hbp: 1, sb: 1, cs: 2, sec: '2B', fld: 66 },
      { id: 'chavera01', name: 'Raul Chavez', pos: 'C', bats: 'R', age: 31, pa: 176, h: 35, double: 8, triple: 1, hr: 1, bb: 10, so: 36, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 72, arm: 71, rk: true },
      { id: 'laneja01', name: 'Jason Lane', pos: 'LF', bats: 'R', age: 27, pa: 156, h: 38, double: 10, triple: 2, hr: 6, bb: 15, so: 30, hbp: 1, sb: 1, cs: 0, sec: 'RF', fld: 68, arm: 71, rk: true },
      { id: 'palmeor01', name: 'Orlando Palmeiro', pos: 'LF', bats: 'L', age: 35, pa: 156, h: 36, double: 6, triple: 0, hr: 2, bb: 15, so: 15, hbp: 1, sb: 2, cs: 1, sec: 'RF', fld: 73, arm: 58 },
      { id: 'brunter01', name: 'Eric Bruntlett', pos: 'SS', bats: 'R', age: 26, pa: 61, h: 14, double: 2, triple: 0, hr: 3, bb: 4, so: 12, hbp: 0, sb: 2, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'oswalro01', name: 'Roy Oswalt', role: 'SP', throws: 'R', age: 26, g: 36, gs: 35, outs: 711, h: 229, hr: 20, bb: 61, so: 208, hbp: 10, er: 87, w: 20, l: 10, sv: 0, fld: 68 },
      { id: 'clemero02', name: 'Roger Clemens', role: 'SP', throws: 'R', age: 41, g: 33, gs: 33, outs: 643, h: 183, hr: 19, bb: 71, so: 209, hbp: 6, er: 82, w: 18, l: 4, sv: 0, fld: 69 },
      { id: 'redditi01', name: 'Tim Redding', role: 'SP', throws: 'R', age: 26, g: 27, gs: 17, outs: 302, h: 116, hr: 12, bb: 42, so: 66, hbp: 4, er: 54, w: 5, l: 7, sv: 0 },
      { id: 'munrope01', name: 'Peter Munro', role: 'SP', throws: 'R', age: 29, g: 21, gs: 19, outs: 299, h: 117, hr: 11, bb: 31, so: 59, hbp: 9, er: 53, w: 4, l: 7, sv: 0 },
      { id: 'millewa04', name: 'Wade Miller', role: 'SP', throws: 'R', age: 27, g: 15, gs: 15, outs: 266, h: 79, hr: 9, bb: 38, so: 76, hbp: 3, er: 36, w: 7, l: 7, sv: 0 },
      { id: 'lidgebr01', name: 'Brad Lidge', role: 'CL', throws: 'R', age: 27, g: 80, gs: 0, outs: 284, h: 60, hr: 7, bb: 36, so: 134, hbp: 6, er: 27, w: 6, l: 5, sv: 29 },
      { id: 'micelda01', name: 'Dan Miceli', role: 'RP', throws: 'R', age: 33, g: 74, gs: 0, outs: 233, h: 72, hr: 12, bb: 27, so: 76, hbp: 2, er: 31, w: 6, l: 6, sv: 2 },
      { id: 'backebr01', name: 'Brandon Backe', role: 'RP', throws: 'R', age: 26, g: 33, gs: 9, outs: 201, h: 71, hr: 10, bb: 30, so: 53, hbp: 2, er: 35, w: 5, l: 3, sv: 0 },
      { id: 'harvich01', name: 'Chad Harville', role: 'RP', throws: 'R', age: 27, g: 59, gs: 0, outs: 167, h: 57, hr: 8, bb: 30, so: 45, hbp: 2, er: 30, w: 3, l: 2, sv: 0, rk: true },
      { id: 'gallomi01', name: 'Mike Gallo', role: 'RP', throws: 'L', age: 27, g: 69, gs: 0, outs: 148, h: 54, hr: 10, bb: 19, so: 32, hbp: 5, er: 24, w: 2, l: 0, sv: 0, rk: true },
      { id: 'hernaca03', name: 'Carlos Hernandez', role: 'RP', throws: 'L', age: 24, g: 9, gs: 9, outs: 126, h: 48, hr: 8, bb: 24, so: 31, hbp: 3, er: 26, w: 1, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 32, g: 15, gs: 15, outs: 249, h: 83, hr: 7, bb: 23, so: 71, hbp: 1, er: 35, w: 6, l: 4, sv: 0 },
      { id: 'duckwbr01', name: 'Brandon Duckworth', role: 'RP', throws: 'R', age: 28, g: 19, gs: 6, outs: 118, h: 46, hr: 7, bb: 17, so: 32, hbp: 2, er: 25, w: 1, l: 2, sv: 0 },
      { id: 'quallch01', name: 'Chad Qualls', role: 'RP', throws: 'R', age: 25, g: 25, gs: 0, outs: 99, h: 34, hr: 3, bb: 8, so: 24, hbp: 4, er: 13, w: 4, l: 0, sv: 1, rk: true },
      { id: 'bulliki01', name: 'Kirk Bullinger', role: 'RP', throws: 'R', age: 34, g: 27, gs: 0, outs: 92, h: 35, hr: 5, bb: 9, so: 12, hbp: 1, er: 22, w: 1, l: 0, sv: 1, rk: true },
      { id: 'sprinru01', name: 'Russ Springer', role: 'RP', throws: 'R', age: 35, g: 16, gs: 0, outs: 41, h: 15, hr: 3, bb: 5, so: 9, hbp: 1, er: 8, w: 0, l: 1, sv: 0 },
    ],
  },
  // LAA (ANA 2004)
  {
    franchiseId: 'LAA',
    season: 2004,
    batters: [
      { id: 'molinbe01', name: 'Bengie Molina', pos: 'C', bats: 'R', age: 29, pa: 363, h: 93, double: 16, triple: 0, hr: 9, bb: 14, so: 30, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 72, arm: 66 },
      { id: 'erstada01', name: 'Darin Erstad', pos: '1B', bats: 'L', age: 30, pa: 543, h: 141, double: 24, triple: 2, hr: 7, bb: 33, so: 70, hbp: 4, sb: 17, cs: 2, sec: 'LF', fld: 63 },
      { id: 'kennead01', name: 'Adam Kennedy', pos: '2B', bats: 'L', age: 28, pa: 533, h: 133, double: 21, triple: 4, hr: 11, bb: 40, so: 86, hbp: 11, sb: 18, cs: 6, sec: 'SS', fld: 64 },
      { id: 'figgich01', name: 'Chone Figgins', pos: '3B', bats: 'S', age: 26, pa: 638, h: 170, double: 22, triple: 15, hr: 4, bb: 48, so: 94, hbp: 0, sb: 34, cs: 14, sec: '2B', fld: 59 },
      { id: 'eckstda01', name: 'David Eckstein', pos: 'SS', bats: 'R', age: 29, pa: 637, h: 153, double: 24, triple: 2, hr: 3, bb: 42, so: 49, hbp: 17, sb: 18, cs: 7, sec: '2B', fld: 61 },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'LF', bats: 'R', age: 28, pa: 620, h: 167, double: 29, triple: 3, hr: 29, bb: 34, so: 99, hbp: 15, sb: 4, cs: 4, sec: 'RF', fld: 73, arm: 73 },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'CF', bats: 'L', age: 32, pa: 475, h: 137, double: 29, triple: 2, hr: 18, bb: 25, so: 65, hbp: 0, sb: 3, cs: 2, sec: 'LF', fld: 67, arm: 68 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'RF', bats: 'R', age: 29, pa: 680, h: 200, double: 36, triple: 3, hr: 38, bb: 68, so: 73, hbp: 8, sb: 19, cs: 7, sec: 'LF', fld: 73, arm: 75 },
      { id: 'davanje02', name: 'Jeff DaVanon', pos: 'DH', bats: 'S', age: 30, pa: 337, h: 80, double: 13, triple: 3, hr: 9, bb: 42, so: 53, hbp: 0, sb: 17, cs: 4, sec: 'RF', fld: 68, arm: 66 },
    ],
    bench: [
      { id: 'glaustr01', name: 'Troy Glaus', pos: 'DH', bats: 'R', age: 27, pa: 242, h: 52, double: 10, triple: 1, hr: 13, bb: 31, so: 51, hbp: 2, sb: 3, cs: 2, sec: '3B' },
      { id: 'molinjo01', name: 'Jose Molina', pos: 'C', bats: 'R', age: 29, pa: 218, h: 49, double: 9, triple: 1, hr: 2, bb: 8, so: 50, hbp: 1, sb: 3, cs: 1, sec: '1B', fld: 73, arm: 84 },
      { id: 'salmoti01', name: 'Tim Salmon', pos: 'DH', bats: 'R', age: 35, pa: 206, h: 48, double: 11, triple: 1, hr: 6, bb: 23, so: 35, hbp: 3, sb: 1, cs: 0, sec: 'RF' },
      { id: 'quinlro01', name: 'Robb Quinlan', pos: '3B', bats: 'R', age: 27, pa: 177, h: 53, double: 12, triple: 1, hr: 4, bb: 13, so: 27, hbp: 1, sb: 3, cs: 2, sec: '1B', fld: 62, rk: true },
      { id: 'kotchca01', name: 'Casey Kotchman', pos: '1B', bats: 'L', age: 21, pa: 128, h: 26, double: 6, triple: 0, hr: 0, bb: 7, so: 11, hbp: 4, sb: 3, cs: 0, sec: '3B', fld: 46, rk: true },
    ],
    reserveBatters: [
      { id: 'haltesh01', name: 'Shane Halter', pos: '3B', bats: 'R', age: 34, pa: 121, h: 24, double: 4, triple: 1, hr: 3, bb: 9, so: 25, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 69 },
      { id: 'amezaal01', name: 'Alfredo Amezaga', pos: 'SS', bats: 'S', age: 26, pa: 105, h: 18, double: 3, triple: 1, hr: 2, bb: 5, so: 22, hbp: 2, sb: 3, cs: 2, sec: '3B', fld: 83 },
      { id: 'pauljo01', name: 'Josh Paul', pos: 'C', bats: 'R', age: 29, pa: 81, h: 17, double: 3, triple: 0, hr: 1, bb: 7, so: 17, hbp: 0, sb: 2, cs: 1, sec: '1B', fld: 68, arm: 65 },
      { id: 'mcpheda01', name: 'Dallas McPherson', pos: '3B', bats: 'L', age: 23, pa: 43, h: 9, double: 1, triple: 0, hr: 3, bb: 3, so: 17, hbp: 0, sb: 1, cs: 0, sec: '1B', rk: true },
      { id: 'pridecu01', name: 'Curtis Pride', pos: 'LF', bats: 'L', age: 35, pa: 42, h: 9, double: 3, triple: 0, hr: 1, bb: 0, so: 10, hbp: 1, sb: 1, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'colonba01', name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 625, h: 207, hr: 31, bb: 66, so: 153, hbp: 3, er: 100, w: 18, l: 12, sv: 0, fld: 66 },
      { id: 'escobke01', name: 'Kelvim Escobar', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 625, h: 197, hr: 20, bb: 82, so: 187, hbp: 8, er: 92, w: 11, l: 12, sv: 0, fld: 72 },
      { id: 'lackejo01', name: 'John Lackey', role: 'SP', throws: 'R', age: 25, g: 33, gs: 32, outs: 595, h: 214, hr: 25, bb: 61, so: 143, hbp: 9, er: 100, w: 14, l: 13, sv: 0, fld: 72 },
      { id: 'washbja01', name: 'Jarrod Washburn', role: 'SP', throws: 'L', age: 29, g: 25, gs: 25, outs: 448, h: 151, hr: 21, bb: 41, so: 90, hbp: 5, er: 72, w: 11, l: 8, sv: 0, fld: 67 },
      { id: 'seleaa01', name: 'Aaron Sele', role: 'SP', throws: 'R', age: 34, g: 28, gs: 24, outs: 396, h: 157, hr: 17, bb: 53, so: 57, hbp: 8, er: 77, w: 9, l: 4, sv: 0 },
      { id: 'percitr01', name: 'Troy Percival', role: 'CL', throws: 'R', age: 34, g: 52, gs: 0, outs: 149, h: 39, hr: 7, bb: 21, so: 44, hbp: 2, er: 16, w: 2, l: 3, sv: 33 },
      { id: 'shielsc01', name: 'Scot Shields', role: 'RP', throws: 'R', age: 28, g: 60, gs: 0, outs: 316, h: 97, hr: 7, bb: 35, so: 94, hbp: 3, er: 36, w: 8, l: 2, sv: 4 },
      { id: 'greggke01', name: 'Kevin Gregg', role: 'RP', throws: 'R', age: 26, g: 55, gs: 0, outs: 263, h: 83, hr: 7, bb: 28, so: 79, hbp: 3, er: 40, w: 5, l: 2, sv: 1, rk: true },
      { id: 'rodrifr03', name: 'Francisco Rodriguez', role: 'RP', throws: 'R', age: 22, g: 69, gs: 0, outs: 252, h: 50, hr: 6, bb: 33, so: 112, hbp: 2, er: 21, w: 4, l: 1, sv: 12 },
      { id: 'donnebr01', name: 'Brendan Donnelly', role: 'RP', throws: 'R', age: 32, g: 40, gs: 0, outs: 126, h: 32, hr: 3, bb: 15, so: 50, hbp: 2, er: 11, w: 5, l: 2, sv: 0 },
      { id: 'henslma01', name: 'Matt Hensley', role: 'RP', throws: 'R', age: 25, g: 16, gs: 0, outs: 83, h: 32, hr: 5, bb: 7, so: 30, hbp: 2, er: 15, w: 0, l: 2, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'ortizra01', name: 'Ramon Ortiz', role: 'SP', throws: 'R', age: 31, g: 34, gs: 14, outs: 384, h: 136, hr: 20, bb: 41, so: 79, hbp: 5, er: 65, w: 5, l: 7, sv: 0 },
      { id: 'weberbe01', name: 'Ben Weber', role: 'RP', throws: 'R', age: 34, g: 18, gs: 0, outs: 67, h: 30, hr: 3, bb: 10, so: 14, hbp: 0, er: 11, w: 0, l: 2, sv: 0 },
    ],
  },
  // OAK (OAK 2004)
  {
    franchiseId: 'OAK',
    season: 2004,
    batters: [
      { id: 'milleda02', name: 'Damian Miller', pos: 'C', bats: 'R', age: 34, pa: 442, h: 101, double: 24, triple: 0, hr: 10, bb: 42, so: 95, hbp: 2, sb: 0, cs: 1, fld: 73, arm: 79 },
      { id: 'hattesc01', name: 'Scott Hatteberg', pos: '1B', bats: 'L', age: 34, pa: 638, h: 151, double: 31, triple: 1, hr: 14, bb: 71, so: 52, hbp: 7, sb: 0, cs: 0, fld: 72 },
      { id: 'scutama01', name: 'Marco Scutaro', pos: '2B', bats: 'R', age: 28, pa: 477, h: 119, double: 30, triple: 1, hr: 8, bb: 21, so: 62, hbp: 1, sb: 1, cs: 0, sec: 'SS', fld: 75, rk: true },
      { id: 'chaveer01', name: 'Eric Chavez', pos: '3B', bats: 'L', age: 26, pa: 577, h: 138, double: 26, triple: 2, hr: 28, bb: 74, so: 93, hbp: 2, sb: 7, cs: 3, sec: '1B', fld: 84 },
      { id: 'crosbbo01', name: 'Bobby Crosby', pos: 'SS', bats: 'R', age: 24, pa: 623, h: 128, double: 33, triple: 1, hr: 22, bb: 58, so: 142, hbp: 10, sb: 7, cs: 3, sec: '2B', fld: 80, rk: true },
      { id: 'byrneer01', name: 'Eric Byrnes', pos: 'LF', bats: 'R', age: 28, pa: 632, h: 157, double: 38, triple: 6, hr: 19, bb: 49, so: 106, hbp: 9, sb: 16, cs: 2, sec: 'CF', fld: 71, arm: 75 },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: 'CF', bats: 'L', age: 28, pa: 673, h: 179, double: 35, triple: 4, hr: 14, bb: 60, so: 83, hbp: 2, sb: 8, cs: 5, sec: 'RF', fld: 69, arm: 74 },
      { id: 'dyeje01', name: 'Jermaine Dye', pos: 'RF', bats: 'R', age: 30, pa: 590, h: 130, double: 26, triple: 3, hr: 21, bb: 52, so: 120, hbp: 6, sb: 3, cs: 1, sec: 'LF', fld: 69, arm: 62 },
      { id: 'durazer01', name: 'Erubiel Durazo', pos: 'DH', bats: 'L', age: 30, pa: 578, h: 145, double: 31, triple: 1, hr: 22, bb: 73, so: 102, hbp: 6, sb: 2, cs: 2, sec: '1B' },
    ],
    bench: [
      { id: 'mclemma01', name: 'Mark McLemore', pos: '2B', bats: 'S', age: 39, pa: 295, h: 62, double: 13, triple: 1, hr: 3, bb: 38, so: 45, hbp: 1, sb: 4, cs: 4, sec: '3B', fld: 81 },
      { id: 'kieltbo01', name: 'Bobby Kielty', pos: 'LF', bats: 'S', age: 27, pa: 278, h: 56, double: 14, triple: 1, hr: 7, bb: 38, so: 49, hbp: 4, sb: 3, cs: 1, sec: 'RF', fld: 68, arm: 62 },
      { id: 'melhuad01', name: 'Adam Melhuse', pos: 'C', bats: 'S', age: 32, pa: 231, h: 56, double: 13, triple: 0, hr: 11, bb: 18, so: 48, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 71, arm: 71 },
      { id: 'karroer01', name: 'Eric Karros', pos: '1B', bats: 'R', age: 36, pa: 111, h: 27, double: 5, triple: 0, hr: 3, bb: 8, so: 15, hbp: 0, sb: 1, cs: 0, fld: 84 },
      { id: 'mcmilbi01', name: 'Billy McMillon', pos: 'LF', bats: 'L', age: 32, pa: 102, h: 21, double: 5, triple: 0, hr: 3, bb: 10, so: 21, hbp: 1, sb: 0, cs: 0, sec: 'RF' },
    ],
    reserveBatters: [
      { id: 'swishni01', name: 'Nick Swisher', pos: 'LF', bats: 'S', age: 23, pa: 71, h: 15, double: 4, triple: 0, hr: 2, bb: 8, so: 11, hbp: 2, sb: 0, cs: 0, sec: 'RF', rk: true },
      { id: 'germaes01', name: 'Esteban German', pos: '3B', bats: 'R', age: 26, pa: 65, h: 14, double: 1, triple: 1, hr: 0, bb: 4, so: 14, hbp: 0, sb: 0, cs: 1, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'muldema01', name: 'Mark Mulder', role: 'SP', throws: 'L', age: 26, g: 33, gs: 33, outs: 677, h: 222, hr: 23, bb: 71, so: 153, hbp: 9, er: 100, w: 17, l: 8, sv: 0, fld: 75 },
      { id: 'zitoba01', name: 'Barry Zito', role: 'SP', throws: 'L', age: 26, g: 34, gs: 34, outs: 639, h: 198, hr: 24, bb: 82, so: 158, hbp: 8, er: 92, w: 11, l: 11, sv: 0, fld: 66 },
      { id: 'redmama01', name: 'Mark Redman', role: 'SP', throws: 'L', age: 30, g: 32, gs: 32, outs: 573, h: 205, hr: 22, bb: 64, so: 122, hbp: 6, er: 93, w: 11, l: 12, sv: 0, fld: 68 },
      { id: 'harderi01', name: 'Rich Harden', role: 'SP', throws: 'R', age: 22, g: 31, gs: 31, outs: 569, h: 172, hr: 15, bb: 85, so: 166, hbp: 3, er: 85, w: 11, l: 7, sv: 0, fld: 68 },
      { id: 'hudsoti01', name: 'Tim Hudson', role: 'SP', throws: 'R', age: 28, g: 27, gs: 27, outs: 566, h: 182, hr: 11, bb: 47, so: 118, hbp: 10, er: 67, w: 12, l: 6, sv: 0, fld: 77 },
      { id: 'doteloc01', name: 'Octavio Dotel', role: 'CL', throws: 'R', age: 30, g: 77, gs: 0, outs: 256, h: 62, hr: 11, bb: 31, so: 113, hbp: 4, er: 29, w: 6, l: 6, sv: 36 },
      { id: 'duchsju01', name: 'Justin Duchscherer', role: 'RP', throws: 'R', age: 26, g: 53, gs: 0, outs: 289, h: 86, hr: 12, bb: 30, so: 62, hbp: 6, er: 35, w: 7, l: 6, sv: 0, rk: true },
      { id: 'bradfch01', name: 'Chad Bradford', role: 'RP', throws: 'R', age: 29, g: 68, gs: 0, outs: 177, h: 53, hr: 5, bb: 21, so: 41, hbp: 5, er: 24, w: 5, l: 7, sv: 1 },
      { id: 'hammoch01', name: 'Chris Hammond', role: 'RP', throws: 'L', age: 38, g: 41, gs: 0, outs: 161, h: 53, hr: 3, bb: 14, so: 38, hbp: 2, er: 14, w: 4, l: 1, sv: 1 },
      { id: 'mecirji01', name: 'Jim Mecir', role: 'RP', throws: 'R', age: 34, g: 65, gs: 0, outs: 143, h: 47, hr: 5, bb: 20, so: 41, hbp: 3, er: 22, w: 0, l: 5, sv: 2 },
      { id: 'rincori01', name: 'Ricardo Rincon', role: 'RP', throws: 'L', age: 34, g: 67, gs: 0, outs: 132, h: 41, hr: 3, bb: 21, so: 38, hbp: 2, er: 18, w: 1, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'rhodear01', name: 'Arthur Rhodes', role: 'RP', throws: 'L', age: 34, g: 37, gs: 0, outs: 116, h: 41, hr: 6, bb: 16, so: 40, hbp: 0, er: 19, w: 3, l: 3, sv: 9 },
      { id: 'lehrju01', name: 'Justin Lehr', role: 'RP', throws: 'R', age: 26, g: 27, gs: 0, outs: 98, h: 35, hr: 3, bb: 14, so: 16, hbp: 2, er: 19, w: 1, l: 1, sv: 0, rk: true },
      { id: 'saarlki01', name: 'Kirk Saarloos', role: 'RP', throws: 'R', age: 25, g: 6, gs: 5, outs: 73, h: 28, hr: 3, bb: 9, so: 16, hbp: 2, er: 14, w: 2, l: 1, sv: 0 },
    ],
  },
  // SEA (SEA 2004)
  {
    franchiseId: 'SEA',
    season: 2004,
    batters: [
      { id: 'wilsoda01', name: 'Dan Wilson', pos: 'C', bats: 'R', age: 35, pa: 359, h: 83, double: 14, triple: 1, hr: 3, bb: 21, so: 60, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 78, arm: 72 },
      { id: 'olerujo01', name: 'John Olerud', pos: '1B', bats: 'L', age: 35, pa: 500, h: 114, double: 25, triple: 0, hr: 10, bb: 65, so: 56, hbp: 6, sb: 0, cs: 0, fld: 61 },
      { id: 'boonebr01', name: 'Bret Boone', pos: '2B', bats: 'R', age: 35, pa: 658, h: 159, double: 31, triple: 2, hr: 27, bb: 58, so: 123, hbp: 5, sb: 12, cs: 4, fld: 57 },
      { id: 'spiezsc01', name: 'Scott Spiezio', pos: '3B', bats: 'S', age: 31, pa: 415, h: 91, double: 20, triple: 3, hr: 10, bb: 37, so: 51, hbp: 4, sb: 4, cs: 2, sec: '1B', fld: 77 },
      { id: 'aurilri01', name: 'Rich Aurilia', pos: 'SS', bats: 'R', age: 32, pa: 450, h: 106, double: 22, triple: 1, hr: 9, bb: 33, so: 69, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 69 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: 'LF', bats: 'L', age: 32, pa: 524, h: 143, double: 30, triple: 3, hr: 16, bb: 37, so: 69, hbp: 3, sb: 4, cs: 3, sec: 'RF', fld: 76, arm: 78 },
      { id: 'winnra01', name: 'Randy Winn', pos: 'CF', bats: 'S', age: 30, pa: 703, h: 184, double: 37, triple: 6, hr: 13, bb: 51, so: 106, hbp: 8, sb: 23, cs: 7, sec: 'LF', fld: 78, arm: 66 },
      { id: 'suzukic01', name: 'Ichiro Suzuki', pos: 'RF', bats: 'L', age: 30, pa: 762, h: 242, double: 27, triple: 7, hr: 10, bb: 49, so: 66, hbp: 5, sb: 35, cs: 11, sec: 'LF', fld: 82, arm: 72 },
      { id: 'martied01', name: 'Edgar Martinez', pos: 'DH', bats: 'R', age: 41, pa: 549, h: 129, double: 24, triple: 0, hr: 17, bb: 72, so: 98, hbp: 4, sb: 1, cs: 1, sec: '3B' },
    ],
    bench: [
      { id: 'cabrejo02', name: 'Jolbert Cabrera', pos: '3B', bats: 'R', age: 31, pa: 391, h: 96, double: 24, triple: 2, hr: 6, bb: 17, so: 67, hbp: 9, sb: 8, cs: 3, sec: '2B', fld: 84 },
      { id: 'olivomi01', name: 'Miguel Olivo', pos: 'C', bats: 'R', age: 25, pa: 329, h: 70, double: 16, triple: 3, hr: 10, bb: 19, so: 81, hbp: 3, sb: 6, cs: 5, sec: '1B', fld: 64, arm: 73 },
      { id: 'lopezjo01', name: 'Jose Lopez', pos: 'SS', bats: 'R', age: 20, pa: 218, h: 48, double: 13, triple: 0, hr: 5, bb: 8, so: 31, hbp: 1, sb: 0, cs: 1, sec: '2B', fld: 57, rk: true },
      { id: 'bloomwi01', name: 'Willie Bloomquist', pos: '3B', bats: 'R', age: 26, pa: 201, h: 47, double: 9, triple: 1, hr: 1, bb: 14, so: 42, hbp: 0, sb: 9, cs: 2, sec: 'SS', fld: 60 },
      { id: 'jacobbu02', name: 'Bucky Jacobsen', pos: '1B', bats: 'R', age: 28, pa: 176, h: 44, double: 9, triple: 0, hr: 9, bb: 14, so: 47, hbp: 1, sb: 0, cs: 0, sec: '3B', fld: 59, rk: true },
    ],
    reserveBatters: [
      { id: 'hanseda01', name: 'Dave Hansen', pos: '1B', bats: 'L', age: 35, pa: 128, h: 27, double: 4, triple: 0, hr: 2, bb: 19, so: 21, hbp: 0, sb: 0, cs: 0, sec: '3B' },
      { id: 'leoneju01', name: 'Justin Leone', pos: '3B', bats: 'R', age: 27, pa: 115, h: 22, double: 5, triple: 0, hr: 6, bb: 9, so: 32, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 61, rk: true },
      { id: 'bocachi01', name: 'Hiram Bocachica', pos: 'CF', bats: 'R', age: 28, pa: 107, h: 21, double: 5, triple: 0, hr: 3, bb: 9, so: 27, hbp: 1, sb: 4, cs: 3, sec: 'LF', fld: 67, arm: 59 },
      { id: 'bordepa01', name: 'Pat Borders', pos: 'C', bats: 'R', age: 41, pa: 99, h: 22, double: 6, triple: 0, hr: 1, bb: 1, so: 23, hbp: 1, sb: 3, cs: 1, fld: 67, arm: 79 },
      { id: 'reedje03', name: 'Jeremy Reed', pos: 'CF', bats: 'L', age: 23, pa: 66, h: 23, double: 4, triple: 0, hr: 0, bb: 7, so: 4, hbp: 1, sb: 3, cs: 1, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'garcifr02', name: 'Freddy Garcia', role: 'SP', throws: 'R', age: 27, g: 31, gs: 31, outs: 630, h: 197, hr: 26, bb: 66, so: 169, hbp: 8, er: 95, w: 13, l: 11, sv: 0, fld: 76 },
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 41, g: 34, gs: 33, outs: 606, h: 204, hr: 32, bb: 61, so: 128, hbp: 10, er: 97, w: 7, l: 13, sv: 0, fld: 71 },
      { id: 'frankry01', name: 'Ryan Franklin', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 601, h: 213, hr: 32, bb: 59, so: 103, hbp: 10, er: 98, w: 4, l: 16, sv: 0, fld: 65 },
      { id: 'pineijo01', name: 'Joel Pineiro', role: 'SP', throws: 'R', age: 25, g: 21, gs: 21, outs: 422, h: 137, hr: 17, bb: 46, so: 105, hbp: 4, er: 64, w: 6, l: 11, sv: 0, fld: 66 },
      { id: 'mechegi01', name: 'Gil Meche', role: 'SP', throws: 'R', age: 25, g: 23, gs: 23, outs: 383, h: 136, hr: 21, bb: 46, so: 96, hbp: 4, er: 69, w: 7, l: 7, sv: 0 },
      { id: 'guarded01', name: 'Eddie Guardado', role: 'CL', throws: 'L', age: 33, g: 41, gs: 0, outs: 136, h: 33, hr: 6, bb: 12, so: 44, hbp: 1, er: 14, w: 2, l: 2, sv: 18 },
      { id: 'hasegsh01', name: 'Shigetoshi Hasegawa', role: 'RP', throws: 'R', age: 35, g: 68, gs: 0, outs: 204, h: 65, hr: 5, bb: 27, so: 40, hbp: 1, er: 28, w: 4, l: 6, sv: 0 },
      { id: 'putzjj01', name: 'J. J. Putz', role: 'RP', throws: 'R', age: 27, g: 54, gs: 0, outs: 189, h: 66, hr: 10, bb: 25, so: 47, hbp: 5, er: 33, w: 0, l: 3, sv: 9, rk: true },
      { id: 'mateoju01', name: 'Julio Mateo', role: 'RP', throws: 'R', age: 26, g: 45, gs: 0, outs: 173, h: 53, hr: 10, bb: 14, so: 47, hbp: 4, er: 26, w: 1, l: 2, sv: 1 },
      { id: 'myersmi01', name: 'Mike Myers', role: 'RP', throws: 'L', age: 35, g: 75, gs: 0, outs: 128, h: 44, hr: 4, bb: 23, so: 30, hbp: 4, er: 23, w: 5, l: 1, sv: 0 },
      { id: 'nageocl01', name: 'Clint Nageotte', role: 'RP', throws: 'R', age: 23, g: 12, gs: 5, outs: 110, h: 48, hr: 3, bb: 27, so: 24, hbp: 4, er: 30, w: 1, l: 6, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'villoro01', name: 'Ron Villone', role: 'SP', throws: 'L', age: 34, g: 56, gs: 10, outs: 351, h: 105, hr: 14, bb: 58, so: 89, hbp: 9, er: 57, w: 8, l: 6, sv: 0 },
      { id: 'madribo01', name: 'Bobby Madritsch', role: 'SP', throws: 'L', age: 28, g: 15, gs: 11, outs: 264, h: 74, hr: 3, bb: 33, so: 60, hbp: 4, er: 32, w: 6, l: 3, sv: 0, rk: true },
      { id: 'thornma01', name: 'Matt Thornton', role: 'RP', throws: 'L', age: 27, g: 19, gs: 1, outs: 98, h: 30, hr: 2, bb: 25, so: 30, hbp: 0, er: 15, w: 1, l: 2, sv: 0, rk: true },
      { id: 'baekch01', name: 'Cha-Seung Baek', role: 'RP', throws: 'R', age: 24, g: 7, gs: 5, outs: 93, h: 35, hr: 5, bb: 11, so: 20, hbp: 2, er: 19, w: 2, l: 4, sv: 0, rk: true },
      { id: 'atchisc01', name: 'Scott Atchison', role: 'RP', throws: 'R', age: 28, g: 25, gs: 0, outs: 92, h: 29, hr: 4, bb: 14, so: 36, hbp: 0, er: 12, w: 2, l: 3, sv: 0, rk: true },
    ],
  },
  // TEX (TEX 2004)
  {
    franchiseId: 'TEX',
    season: 2004,
    batters: [
      { id: 'barajro01', name: 'Rod Barajas', pos: 'C', bats: 'R', age: 28, pa: 389, h: 85, double: 25, triple: 1, hr: 12, bb: 16, so: 64, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 69, arm: 73 },
      { id: 'teixema01', name: 'Mark Teixeira', pos: '1B', bats: 'S', age: 24, pa: 625, h: 150, double: 33, triple: 3, hr: 34, bb: 60, so: 121, hbp: 12, sb: 3, cs: 1, sec: '3B', fld: 71 },
      { id: 'soriaal01', name: 'Alfonso Soriano', pos: '2B', bats: 'R', age: 28, pa: 658, h: 175, double: 34, triple: 4, hr: 31, bb: 31, so: 123, hbp: 11, sb: 26, cs: 7, sec: 'SS', fld: 70 },
      { id: 'blaloha01', name: 'Hank Blalock', pos: '3B', bats: 'L', age: 23, pa: 713, h: 179, double: 38, triple: 3, hr: 32, bb: 67, so: 138, hbp: 4, sb: 2, cs: 2, sec: '1B', fld: 66 },
      { id: 'youngmi02', name: 'Michael Young', pos: 'SS', bats: 'R', age: 27, pa: 739, h: 208, double: 33, triple: 9, hr: 18, bb: 42, so: 101, hbp: 1, sb: 12, cs: 3, sec: '2B', fld: 66 },
      { id: 'delluda01', name: 'David Dellucci', pos: 'LF', bats: 'L', age: 30, pa: 387, h: 79, double: 15, triple: 2, hr: 13, bb: 43, so: 88, hbp: 5, sb: 11, cs: 3, sec: 'RF', fld: 75, arm: 58 },
      { id: 'nixla01', name: 'Laynce Nix', pos: 'CF', bats: 'L', age: 23, pa: 400, h: 93, double: 20, triple: 3, hr: 15, bb: 22, so: 112, hbp: 2, sb: 2, cs: 1, sec: 'RF', fld: 65, arm: 67 },
      { id: 'matthga02', name: 'Gary Matthews', pos: 'RF', bats: 'S', age: 29, pa: 317, h: 74, double: 18, triple: 1, hr: 7, bb: 30, so: 60, hbp: 1, sb: 7, cs: 3, sec: 'CF', fld: 85, arm: 76 },
      { id: 'menchke01', name: 'Kevin Mench', pos: 'DH', bats: 'R', age: 26, pa: 481, h: 122, double: 30, triple: 2, hr: 22, bb: 34, so: 69, hbp: 7, sb: 1, cs: 1, sec: 'LF', fld: 75, arm: 69 },
    ],
    bench: [
      { id: 'younger01', name: 'Eric Young', pos: 'LF', bats: 'R', age: 37, pa: 402, h: 95, double: 20, triple: 2, hr: 5, bb: 40, so: 30, hbp: 6, sb: 18, cs: 9, sec: 'CF', fld: 64, arm: 77 },
      { id: 'fullmbr01', name: 'Brad Fullmer', pos: 'DH', bats: 'L', age: 29, pa: 290, h: 69, double: 18, triple: 2, hr: 11, bb: 26, so: 31, hbp: 4, sb: 4, cs: 3, sec: '1B' },
      { id: 'jordabr01', name: 'Brian Jordan', pos: 'RF', bats: 'R', age: 37, pa: 233, h: 55, double: 11, triple: 1, hr: 6, bb: 17, so: 34, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 78, arm: 62 },
      { id: 'lairdge01', name: 'Gerald Laird', pos: 'C', bats: 'R', age: 24, pa: 168, h: 34, double: 6, triple: 1, hr: 1, bb: 13, so: 35, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 61, arm: 81, rk: true },
      { id: 'perryhe01', name: 'Herbert Perry', pos: 'DH', bats: 'R', age: 34, pa: 153, h: 34, double: 5, triple: 1, hr: 6, bb: 12, so: 20, hbp: 2, sb: 1, cs: 0, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'allench01', name: 'Chad Allen', pos: 'LF', bats: 'R', age: 29, pa: 63, h: 13, double: 4, triple: 1, hr: 0, bb: 2, so: 13, hbp: 1, sb: 0, cs: 1, sec: 'RF' },
      { id: 'contija01', name: 'Jason Conti', pos: 'CF', bats: 'L', age: 29, pa: 60, h: 12, double: 3, triple: 0, hr: 1, bb: 4, so: 17, hbp: 0, sb: 0, cs: 1, sec: 'RF' },
      { id: 'huckake01', name: 'Ken Huckaby', pos: 'C', bats: 'R', age: 33, pa: 55, h: 11, double: 2, triple: 0, hr: 0, bb: 3, so: 10, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 57, arm: 67 },
      { id: 'gonzaad01', name: 'Adrian Gonzalez', pos: '1B', bats: 'L', age: 22, pa: 44, h: 10, double: 3, triple: 0, hr: 1, bb: 2, so: 6, hbp: 0, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'rogerke01', name: 'Kenny Rogers', role: 'SP', throws: 'L', age: 39, g: 35, gs: 35, outs: 635, h: 244, hr: 24, bb: 64, so: 124, hbp: 10, er: 108, w: 18, l: 9, sv: 0, fld: 82 },
      { id: 'dresery01', name: 'Ryan Drese', role: 'SP', throws: 'R', age: 28, g: 34, gs: 33, outs: 623, h: 237, hr: 19, bb: 68, so: 107, hbp: 12, er: 110, w: 14, l: 10, sv: 0, fld: 72 },
      { id: 'dickera01', name: 'R. A. Dickey', role: 'SP', throws: 'R', age: 29, g: 25, gs: 15, outs: 313, h: 131, hr: 16, bb: 34, so: 69, hbp: 4, er: 63, w: 6, l: 7, sv: 1 },
      { id: 'benoijo01', name: 'Joaquin Benoit', role: 'SP', throws: 'R', age: 26, g: 28, gs: 15, outs: 309, h: 106, hr: 18, bb: 43, so: 88, hbp: 6, er: 63, w: 3, l: 5, sv: 0 },
      { id: 'parkch01', name: 'Chan Ho Park', role: 'SP', throws: 'R', age: 31, g: 16, gs: 16, outs: 287, h: 102, hr: 18, bb: 43, so: 65, hbp: 13, er: 60, w: 4, l: 7, sv: 0 },
      { id: 'cordefr01', name: 'Francisco Cordero', role: 'CL', throws: 'R', age: 29, g: 67, gs: 0, outs: 215, h: 60, hr: 2, bb: 31, so: 77, hbp: 2, er: 19, w: 3, l: 4, sv: 49 },
      { id: 'almanca01', name: 'Carlos Almanzar', role: 'RP', throws: 'R', age: 30, g: 67, gs: 0, outs: 218, h: 65, hr: 8, bb: 20, so: 44, hbp: 4, er: 30, w: 7, l: 3, sv: 0 },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 33, g: 60, gs: 0, outs: 201, h: 57, hr: 6, bb: 30, so: 56, hbp: 1, er: 23, w: 3, l: 0, sv: 0 },
      { id: 'brocado01', name: 'Doug Brocail', role: 'RP', throws: 'R', age: 37, g: 43, gs: 0, outs: 157, h: 54, hr: 2, bb: 20, so: 43, hbp: 5, er: 24, w: 4, l: 1, sv: 1 },
      { id: 'francfr01', name: 'Frank Francisco', role: 'RP', throws: 'R', age: 24, g: 45, gs: 0, outs: 154, h: 36, hr: 4, bb: 28, so: 60, hbp: 3, er: 19, w: 5, l: 1, sv: 0, rk: true },
      { id: 'shousbr01', name: 'Brian Shouse', role: 'RP', throws: 'L', age: 35, g: 53, gs: 0, outs: 133, h: 40, hr: 2, bb: 15, so: 31, hbp: 2, er: 14, w: 2, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'wasdijo01', name: 'John Wasdin', role: 'SP', throws: 'R', age: 31, g: 15, gs: 10, outs: 195, h: 87, hr: 18, bb: 24, so: 37, hbp: 3, er: 54, w: 2, l: 4, sv: 0 },
      { id: 'youngch03', name: 'Chris Young', role: 'RP', throws: 'R', age: 25, g: 7, gs: 7, outs: 109, h: 36, hr: 7, bb: 10, so: 27, hbp: 2, er: 19, w: 3, l: 2, sv: 0, rk: true },
      { id: 'ramirer01', name: 'Erasmo Ramirez', role: 'RP', throws: 'L', age: 28, g: 34, gs: 0, outs: 107, h: 34, hr: 4, bb: 7, so: 21, hbp: 3, er: 16, w: 5, l: 3, sv: 0, rk: true },
      { id: 'ericksc01', name: 'Scott Erickson', role: 'RP', throws: 'R', age: 36, g: 6, gs: 6, outs: 81, h: 36, hr: 3, bb: 15, so: 12, hbp: 1, er: 19, w: 1, l: 4, sv: 0 },
      { id: 'rodriri03', name: 'Ricardo Rodriguez', role: 'RP', throws: 'R', age: 26, g: 5, gs: 4, outs: 80, h: 28, hr: 4, bb: 10, so: 14, hbp: 1, er: 14, w: 3, l: 1, sv: 0 },
    ],
  },
  // ATL (ATL 2004)
  {
    franchiseId: 'ATL',
    season: 2004,
    batters: [
      { id: 'estrajo01', name: 'Johnny Estrada', pos: 'C', bats: 'S', age: 28, pa: 517, h: 144, double: 34, triple: 0, hr: 8, bb: 37, so: 65, hbp: 12, sb: 0, cs: 0, sec: '1B', fld: 69, arm: 61 },
      { id: 'francju01', name: 'Julio Franco', pos: '1B', bats: 'R', age: 45, pa: 361, h: 96, double: 17, triple: 3, hr: 6, bb: 37, so: 69, hbp: 1, sb: 3, cs: 2, fld: 76 },
      { id: 'gilesma01', name: 'Marcus Giles', pos: '2B', bats: 'R', age: 26, pa: 434, h: 116, double: 27, triple: 2, hr: 11, bb: 39, so: 63, hbp: 8, sb: 12, cs: 3, sec: 'SS', fld: 75 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: '3B', bats: 'S', age: 32, pa: 567, h: 134, double: 25, triple: 1, hr: 26, bb: 84, so: 84, hbp: 2, sb: 3, cs: 1, sec: 'SS', fld: 70 },
      { id: 'furcara01', name: 'Rafael Furcal', pos: 'SS', bats: 'S', age: 26, pa: 632, h: 161, double: 27, triple: 7, hr: 12, bb: 52, so: 75, hbp: 2, sb: 26, cs: 6, sec: '2B', fld: 75 },
      { id: 'thomach01', name: 'Charles Thomas', pos: 'LF', bats: 'L', age: 25, pa: 267, h: 68, double: 8, triple: 4, hr: 7, bb: 21, so: 45, hbp: 9, sb: 3, cs: 1, sec: 'RF', fld: 79, arm: 82, rk: true },
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'CF', bats: 'R', age: 27, pa: 646, h: 153, double: 32, triple: 3, hr: 32, bb: 66, so: 136, hbp: 5, sb: 6, cs: 4, sec: 'RF', fld: 74, arm: 72 },
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'RF', bats: 'L', age: 28, pa: 645, h: 156, double: 27, triple: 6, hr: 29, bb: 101, so: 114, hbp: 6, sb: 10, cs: 3, sec: 'CF', fld: 75, arm: 74 },
      { id: 'larocad01', name: 'Adam LaRoche', pos: 'DH', bats: 'L', age: 24, pa: 356, h: 90, double: 27, triple: 1, hr: 13, bb: 27, so: 78, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 76, rk: true },
    ],
    bench: [
      { id: 'derosma01', name: 'Mark DeRosa', pos: '3B', bats: 'R', age: 29, pa: 345, h: 80, double: 16, triple: 0, hr: 5, bb: 21, so: 53, hbp: 4, sb: 1, cs: 2, sec: 'SS', fld: 61 },
      { id: 'greenni01', name: 'Nick Green', pos: '2B', bats: 'R', age: 25, pa: 290, h: 72, double: 15, triple: 3, hr: 3, bb: 12, so: 63, hbp: 4, sb: 1, cs: 2, sec: 'SS', fld: 74, rk: true },
      { id: 'marreel01', name: 'Eli Marrero', pos: 'LF', bats: 'R', age: 30, pa: 280, h: 72, double: 15, triple: 1, hr: 10, bb: 23, so: 48, hbp: 1, sb: 5, cs: 1, sec: 'RF', fld: 73, arm: 79 },
      { id: 'perezed02', name: 'Eddie Perez', pos: 'C', bats: 'R', age: 36, pa: 188, h: 43, double: 10, triple: 0, hr: 4, bb: 9, so: 27, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 76 },
      { id: 'wisede01', name: 'Dewayne Wise', pos: 'LF', bats: 'L', age: 26, pa: 175, h: 36, double: 8, triple: 4, hr: 6, bb: 8, so: 27, hbp: 1, sb: 6, cs: 1, sec: 'RF', fld: 68, arm: 70 },
    ],
    reserveBatters: [
      { id: 'garcije01', name: 'Jesse Garcia', pos: 'SS', bats: 'R', age: 30, pa: 118, h: 29, double: 4, triple: 1, hr: 1, bb: 1, so: 17, hbp: 1, sb: 1, cs: 2, sec: '2B', fld: 76 },
      { id: 'hessmmi01', name: 'Mike Hessman', pos: '1B', bats: 'R', age: 26, pa: 71, h: 10, double: 3, triple: 0, hr: 3, bb: 3, so: 23, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
      { id: 'betemwi01', name: 'Wilson Betemit', pos: 'SS', bats: 'S', age: 22, pa: 52, h: 8, double: 0, triple: 0, hr: 0, bb: 4, so: 16, hbp: 0, sb: 0, cs: 1, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'ortizru01', name: 'Russ Ortiz', role: 'SP', throws: 'R', age: 30, g: 34, gs: 34, outs: 614, h: 190, hr: 20, bb: 106, so: 144, hbp: 4, er: 91, w: 15, l: 9, sv: 0, fld: 75 },
      { id: 'thomsjo01', name: 'John Thomson', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 595, h: 213, hr: 23, bb: 49, so: 128, hbp: 5, er: 94, w: 14, l: 8, sv: 0, fld: 71 },
      { id: 'wrighja02', name: 'Jaret Wright', role: 'SP', throws: 'R', age: 28, g: 32, gs: 32, outs: 559, h: 181, hr: 14, bb: 76, so: 153, hbp: 4, er: 85, w: 15, l: 8, sv: 0, fld: 71 },
      { id: 'hamptmi01', name: 'Mike Hampton', role: 'SP', throws: 'L', age: 31, g: 29, gs: 29, outs: 517, h: 191, hr: 16, bb: 71, so: 89, hbp: 2, er: 85, w: 13, l: 9, sv: 0, fld: 79 },
      { id: 'byrdpa01', name: 'Paul Byrd', role: 'SP', throws: 'R', age: 33, g: 19, gs: 19, outs: 343, h: 120, hr: 18, bb: 19, so: 74, hbp: 3, er: 50, w: 8, l: 7, sv: 0 },
      { id: 'smoltjo01', name: 'John Smoltz', role: 'CL', throws: 'R', age: 37, g: 73, gs: 0, outs: 245, h: 69, hr: 6, bb: 14, so: 89, hbp: 0, er: 22, w: 0, l: 1, sv: 44 },
      { id: 'reitsch01', name: 'Chris Reitsma', role: 'RP', throws: 'R', age: 26, g: 84, gs: 0, outs: 239, h: 87, hr: 11, bb: 21, so: 54, hbp: 2, er: 36, w: 6, l: 4, sv: 2 },
      { id: 'alfonan01', name: 'Antonio Alfonseca', role: 'RP', throws: 'R', age: 32, g: 79, gs: 0, outs: 221, h: 74, hr: 6, bb: 29, so: 50, hbp: 1, er: 31, w: 6, l: 4, sv: 0 },
      { id: 'cruzju02', name: 'Juan Cruz', role: 'RP', throws: 'R', age: 25, g: 50, gs: 0, outs: 216, h: 62, hr: 7, bb: 33, so: 67, hbp: 4, er: 30, w: 6, l: 2, sv: 0 },
      { id: 'ramirho01', name: 'Horacio Ramirez', role: 'RP', throws: 'L', age: 24, g: 10, gs: 9, outs: 181, h: 56, hr: 7, bb: 26, so: 32, hbp: 1, er: 23, w: 2, l: 4, sv: 0 },
      { id: 'gryboke01', name: 'Kevin Gryboski', role: 'RP', throws: 'R', age: 30, g: 69, gs: 0, outs: 152, h: 51, hr: 3, bb: 26, so: 29, hbp: 2, er: 18, w: 3, l: 2, sv: 2 },
    ],
    reservePitchers: [
      { id: 'smithtr01', name: 'Travis Smith', role: 'RP', throws: 'R', age: 31, g: 16, gs: 4, outs: 122, h: 49, hr: 10, bb: 13, so: 25, hbp: 1, er: 29, w: 2, l: 3, sv: 0 },
      { id: 'nitkocj01', name: 'C. J. Nitkowski', role: 'RP', throws: 'L', age: 31, g: 41, gs: 0, outs: 99, h: 40, hr: 3, bb: 19, so: 25, hbp: 4, er: 20, w: 2, l: 1, sv: 0 },
      { id: 'colonro01', name: 'Roman Colon', role: 'RP', throws: 'R', age: 24, g: 18, gs: 0, outs: 57, h: 18, hr: 0, bb: 8, so: 15, hbp: 0, er: 7, w: 2, l: 1, sv: 0, rk: true },
      { id: 'drewti01', name: 'Tim Drew', role: 'RP', throws: 'R', age: 25, g: 11, gs: 0, outs: 48, h: 20, hr: 3, bb: 7, so: 7, hbp: 1, er: 10, w: 0, l: 0, sv: 0 },
      { id: 'cunnawi01', name: 'Will Cunnane', role: 'RP', throws: 'R', age: 30, g: 9, gs: 0, outs: 37, h: 14, hr: 2, bb: 5, so: 13, hbp: 1, er: 8, w: 1, l: 1, sv: 0 },
    ],
  },
  // MIA (FLO 2004)
  {
    franchiseId: 'MIA',
    season: 2004,
    batters: [
      { id: 'redmomi01', name: 'Mike Redmond', pos: 'C', bats: 'R', age: 33, pa: 273, h: 64, double: 15, triple: 0, hr: 2, bb: 15, so: 29, hbp: 8, sb: 1, cs: 0, sec: '1B', fld: 73, arm: 63 },
      { id: 'choihe01', name: 'Hee-Seop Choi', pos: '1B', bats: 'L', age: 25, pa: 416, h: 82, double: 23, triple: 1, hr: 15, bb: 63, so: 103, hbp: 5, sb: 1, cs: 0, sec: '3B', fld: 70 },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 28, pa: 649, h: 172, double: 15, triple: 6, hr: 3, bb: 66, so: 65, hbp: 1, sb: 25, cs: 11, sec: 'SS', fld: 70 },
      { id: 'lowelmi01', name: 'Mike Lowell', pos: '3B', bats: 'R', age: 30, pa: 671, h: 170, double: 41, triple: 1, hr: 30, bb: 65, so: 84, hbp: 5, sb: 4, cs: 1, sec: '1B', fld: 72 },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 27, pa: 599, h: 133, double: 31, triple: 4, hr: 20, bb: 30, so: 119, hbp: 8, sb: 2, cs: 2, sec: '2B', fld: 69 },
      { id: 'coninje01', name: 'Jeff Conine', pos: 'LF', bats: 'R', age: 38, pa: 579, h: 146, double: 33, triple: 2, hr: 16, bb: 44, so: 72, hbp: 3, sb: 5, cs: 2, sec: '1B', fld: 79, arm: 72 },
      { id: 'pierrju01', name: 'Juan Pierre', pos: 'CF', bats: 'L', age: 26, pa: 748, h: 212, double: 24, triple: 9, hr: 2, bb: 47, so: 39, hbp: 7, sb: 53, cs: 21, sec: 'LF', fld: 64, arm: 63 },
      { id: 'cabremi01', name: 'Miguel Cabrera', pos: 'RF', bats: 'R', age: 21, pa: 685, h: 174, double: 34, triple: 2, hr: 31, bb: 63, so: 153, hbp: 5, sb: 4, cs: 2, sec: 'LF', fld: 57, arm: 73 },
      { id: 'easleda01', name: 'Damion Easley', pos: 'DH', bats: 'R', age: 34, pa: 257, h: 51, double: 15, triple: 1, hr: 7, bb: 20, so: 36, hbp: 7, sb: 2, cs: 1, sec: '3B', fld: 58 },
    ],
    bench: [
      { id: 'castrra01', name: 'Ramon Castro', pos: 'C', bats: 'R', age: 28, pa: 108, h: 18, double: 3, triple: 0, hr: 5, bb: 11, so: 26, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 74 },
      { id: 'harrile01', name: 'Lenny Harris', pos: 'LF', bats: 'L', age: 39, pa: 99, h: 21, double: 3, triple: 0, hr: 1, bb: 6, so: 10, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
      { id: 'mordemi01', name: 'Mike Mordecai', pos: '3B', bats: 'R', age: 36, pa: 90, h: 18, double: 3, triple: 0, hr: 1, bb: 7, so: 17, hbp: 0, sb: 1, cs: 1, sec: '2B' },
      { id: 'cordewi01', name: 'Wil Cordero', pos: '1B', bats: 'R', age: 32, pa: 72, h: 17, double: 4, triple: 0, hr: 2, bb: 6, so: 14, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
      { id: 'treanma01', name: 'Matt Treanor', pos: 'C', bats: 'R', age: 28, pa: 61, h: 13, double: 2, triple: 0, hr: 0, bb: 4, so: 13, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 63, rk: true },
    ],
    reserveBatters: [
      { id: 'aguilch01', name: 'Chris Aguila', pos: 'RF', bats: 'R', age: 25, pa: 48, h: 10, double: 2, triple: 1, hr: 3, bb: 2, so: 12, hbp: 0, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'pavanca01', name: 'Carl Pavano', role: 'SP', throws: 'R', age: 28, g: 31, gs: 31, outs: 667, h: 221, hr: 19, bb: 53, so: 140, hbp: 10, er: 89, w: 18, l: 8, sv: 0, fld: 71 },
      { id: 'willido03', name: 'Dontrelle Willis', role: 'SP', throws: 'L', age: 22, g: 32, gs: 32, outs: 591, h: 202, hr: 19, bb: 65, so: 153, hbp: 7, er: 83, w: 10, l: 11, sv: 0, fld: 75 },
      { id: 'beckejo02', name: 'Josh Beckett', role: 'SP', throws: 'R', age: 24, g: 26, gs: 26, outs: 470, h: 139, hr: 14, bb: 57, so: 158, hbp: 4, er: 62, w: 9, l: 9, sv: 0, fld: 60 },
      { id: 'pennybr01', name: 'Brad Penny', role: 'SP', throws: 'R', age: 26, g: 24, gs: 24, outs: 429, h: 138, hr: 14, bb: 44, so: 104, hbp: 2, er: 59, w: 9, l: 10, sv: 0, fld: 71 },
      { id: 'burneaj01', name: 'A. J. Burnett', role: 'SP', throws: 'R', age: 27, g: 20, gs: 19, outs: 360, h: 96, hr: 8, bb: 47, so: 114, hbp: 5, er: 48, w: 7, l: 6, sv: 0 },
      { id: 'benitar01', name: 'Armando Benitez', role: 'CL', throws: 'R', age: 31, g: 64, gs: 0, outs: 209, h: 42, hr: 6, bb: 26, so: 64, hbp: 0, er: 15, w: 2, l: 2, sv: 47 },
      { id: 'bumpna01', name: 'Nate Bump', role: 'RP', throws: 'R', age: 27, g: 50, gs: 2, outs: 221, h: 82, hr: 7, bb: 34, so: 42, hbp: 6, er: 40, w: 2, l: 4, sv: 1, rk: true },
      { id: 'kochbi01', name: 'Billy Koch', role: 'RP', throws: 'R', age: 29, g: 47, gs: 0, outs: 147, h: 47, hr: 7, bb: 30, so: 47, hbp: 2, er: 25, w: 2, l: 3, sv: 8 },
      { id: 'perisma01', name: 'Matt Perisho', role: 'RP', throws: 'L', age: 29, g: 66, gs: 0, outs: 141, h: 46, hr: 6, bb: 26, so: 40, hbp: 2, er: 24, w: 5, l: 3, sv: 0 },
      { id: 'howarbe01', name: 'Ben Howard', role: 'RP', throws: 'R', age: 25, g: 31, gs: 0, outs: 113, h: 37, hr: 8, bb: 21, so: 31, hbp: 1, er: 21, w: 1, l: 1, sv: 0, rk: true },
      { id: 'phelpto01', name: 'Tommy Phelps', role: 'RP', throws: 'L', age: 30, g: 19, gs: 4, outs: 102, h: 35, hr: 4, bb: 12, so: 25, hbp: 1, er: 16, w: 1, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'oliveda02', name: 'Darren Oliver', role: 'SP', throws: 'L', age: 33, g: 27, gs: 10, outs: 218, h: 83, hr: 10, bb: 24, so: 39, hbp: 3, er: 43, w: 3, l: 3, sv: 0 },
      { id: 'wayneju01', name: 'Justin Wayne', role: 'RP', throws: 'R', age: 25, g: 19, gs: 1, outs: 98, h: 35, hr: 6, bb: 19, so: 19, hbp: 2, er: 22, w: 3, l: 3, sv: 0, rk: true },
      { id: 'manzajo01', name: 'Josias Manzanillo', role: 'RP', throws: 'R', age: 36, g: 26, gs: 0, outs: 97, h: 42, hr: 9, bb: 14, so: 26, hbp: 2, er: 26, w: 3, l: 3, sv: 1 },
      { id: 'borlato02', name: 'Toby Borland', role: 'RP', throws: 'R', age: 35, g: 18, gs: 0, outs: 55, h: 16, hr: 3, bb: 12, so: 16, hbp: 1, er: 10, w: 1, l: 1, sv: 0 },
      { id: 'smallaa01', name: 'Aaron Small', role: 'RP', throws: 'R', age: 32, g: 7, gs: 0, outs: 49, h: 24, hr: 5, bb: 8, so: 8, hbp: 0, er: 15, w: 0, l: 0, sv: 0 },
    ],
  },
  // NYM (NYN 2004)
  {
    franchiseId: 'NYM',
    season: 2004,
    batters: [
      { id: 'phillja04', name: 'Jason Phillips', pos: 'C', bats: 'R', age: 27, pa: 412, h: 92, double: 20, triple: 0, hr: 8, bb: 35, so: 43, hbp: 9, sb: 0, cs: 1, sec: '1B', fld: 76, arm: 70 },
      { id: 'piazzmi01', name: 'Mike Piazza', pos: '1B', bats: 'R', age: 35, pa: 528, h: 125, double: 22, triple: 0, hr: 23, bb: 65, so: 78, hbp: 2, sb: 0, cs: 1, fld: 59 },
      { id: 'reyesjo01', name: 'Jose Reyes', pos: '2B', bats: 'S', age: 21, pa: 229, h: 61, double: 13, triple: 3, hr: 3, bb: 7, so: 30, hbp: 0, sb: 15, cs: 2, sec: 'SS', fld: 67 },
      { id: 'wiggity01', name: 'Ty Wigginton', pos: '3B', bats: 'R', age: 26, pa: 545, h: 129, double: 31, triple: 3, hr: 14, bb: 42, so: 92, hbp: 5, sb: 8, cs: 1, sec: '2B', fld: 65 },
      { id: 'matsuka01', name: 'Kazuo Matsui', pos: 'SS', bats: 'S', age: 28, pa: 509, h: 125, double: 32, triple: 2, hr: 7, bb: 40, so: 97, hbp: 2, sb: 14, cs: 3, sec: '2B', fld: 72, rk: true },
      { id: 'floydcl01', name: 'Cliff Floyd', pos: 'LF', bats: 'L', age: 31, pa: 457, h: 108, double: 28, triple: 1, hr: 19, bb: 52, so: 88, hbp: 8, sb: 9, cs: 3, sec: '1B', fld: 66, arm: 69 },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 31, pa: 562, h: 117, double: 28, triple: 3, hr: 24, bb: 62, so: 139, hbp: 6, sb: 21, cs: 6, sec: 'RF', fld: 73, arm: 68 },
      { id: 'hidalri01', name: 'Richard Hidalgo', pos: 'RF', bats: 'R', age: 29, pa: 578, h: 136, double: 31, triple: 4, hr: 25, bb: 50, so: 118, hbp: 6, sb: 6, cs: 5, sec: 'CF', fld: 68, arm: 77 },
      { id: 'spencsh01', name: 'Shane Spencer', pos: 'DH', bats: 'R', age: 32, pa: 204, h: 47, double: 9, triple: 1, hr: 5, bb: 18, so: 40, hbp: 2, sb: 2, cs: 0, sec: 'LF', fld: 83, arm: 68 },
    ],
    bench: [
      { id: 'zeileto01', name: 'Todd Zeile', pos: '1B', bats: 'R', age: 38, pa: 396, h: 84, double: 15, triple: 1, hr: 11, bb: 43, so: 73, hbp: 2, sb: 0, cs: 0, sec: '3B', fld: 80 },
      { id: 'valener01', name: 'Eric Valent', pos: 'LF', bats: 'L', age: 27, pa: 300, h: 71, double: 14, triple: 2, hr: 12, bb: 26, so: 61, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 68, arm: 64, rk: true },
      { id: 'wrighda03', name: 'David Wright', pos: '3B', bats: 'R', age: 21, pa: 283, h: 77, double: 17, triple: 1, hr: 14, bb: 14, so: 40, hbp: 3, sb: 6, cs: 0, sec: '1B', fld: 67, rk: true },
      { id: 'garcika01', name: 'Karim Garcia', pos: 'RF', bats: 'L', age: 28, pa: 275, h: 64, double: 7, triple: 1, hr: 12, bb: 13, so: 52, hbp: 0, sb: 2, cs: 1, sec: 'LF', fld: 67, arm: 58 },
      { id: 'wilsova01', name: 'Vance Wilson', pos: 'C', bats: 'R', age: 31, pa: 177, h: 41, double: 8, triple: 1, hr: 5, bb: 9, so: 30, hbp: 5, sb: 1, cs: 1, sec: '1B', fld: 69, arm: 73 },
    ],
    reserveBatters: [
      { id: 'garcida03', name: 'Daniel Garcia', pos: '2B', bats: 'R', age: 24, pa: 174, h: 32, double: 7, triple: 1, hr: 3, bb: 19, so: 33, hbp: 9, sb: 2, cs: 0, sec: 'SS', fld: 63, rk: true },
      { id: 'mcewijo01', name: 'Joe McEwing', pos: '2B', bats: 'R', age: 31, pa: 154, h: 33, double: 5, triple: 0, hr: 1, bb: 10, so: 31, hbp: 1, sb: 3, cs: 1, sec: 'SS', fld: 83 },
      { id: 'delgawi01', name: 'Wilson Delgado', pos: 'SS', bats: 'S', age: 31, pa: 147, h: 35, double: 4, triple: 1, hr: 2, bb: 13, so: 26, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 72 },
      { id: 'willige02', name: 'Gerald Williams', pos: 'LF', bats: 'R', age: 37, pa: 138, h: 27, double: 7, triple: 2, hr: 3, bb: 8, so: 25, hbp: 0, sb: 4, cs: 1, sec: 'CF', fld: 65, arm: 79 },
      { id: 'keppije01', name: 'Jeff Keppinger', pos: '2B', bats: 'R', age: 24, pa: 123, h: 33, double: 2, triple: 0, hr: 3, bb: 6, so: 7, hbp: 0, sb: 2, cs: 1, sec: 'SS', fld: 74, rk: true },
    ],
    pitchers: [
      { id: 'glavito02', name: 'Tom Glavine', role: 'SP', throws: 'L', age: 38, g: 33, gs: 33, outs: 637, h: 210, hr: 21, bb: 72, so: 105, hbp: 2, er: 87, w: 11, l: 14, sv: 0, fld: 80 },
      { id: 'trachst01', name: 'Steve Trachsel', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 608, h: 204, hr: 25, bb: 77, so: 117, hbp: 4, er: 87, w: 12, l: 13, sv: 0, fld: 77 },
      { id: 'leiteal01', name: 'Al Leiter', role: 'SP', throws: 'L', age: 38, g: 30, gs: 30, outs: 521, h: 153, hr: 16, bb: 87, so: 127, hbp: 9, er: 68, w: 10, l: 8, sv: 0, fld: 72 },
      { id: 'seoja01', name: 'Jae Weong Seo', role: 'SP', throws: 'R', age: 27, g: 24, gs: 21, outs: 353, h: 130, hr: 14, bb: 40, so: 64, hbp: 3, er: 59, w: 5, l: 10, sv: 0 },
      { id: 'gintema01', name: 'Matt Ginter', role: 'SP', throws: 'R', age: 26, g: 15, gs: 14, outs: 208, h: 80, hr: 8, bb: 21, so: 39, hbp: 5, er: 37, w: 1, l: 3, sv: 0 },
      { id: 'loopebr01', name: 'Braden Looper', role: 'CL', throws: 'R', age: 29, g: 71, gs: 0, outs: 250, h: 82, hr: 5, bb: 22, so: 58, hbp: 2, er: 28, w: 2, l: 5, sv: 29 },
      { id: 'weathda01', name: 'David Weathers', role: 'RP', throws: 'R', age: 34, g: 66, gs: 2, outs: 247, h: 82, hr: 9, bb: 37, so: 65, hbp: 5, er: 33, w: 7, l: 7, sv: 0 },
      { id: 'stantmi02', name: 'Mike Stanton', role: 'RP', throws: 'L', age: 37, g: 83, gs: 0, outs: 231, h: 69, hr: 7, bb: 32, so: 56, hbp: 2, er: 30, w: 2, l: 6, sv: 0 },
      { id: 'bottari01', name: 'Ricky Bottalico', role: 'RP', throws: 'R', age: 34, g: 60, gs: 0, outs: 208, h: 57, hr: 3, bb: 34, so: 60, hbp: 4, er: 27, w: 3, l: 2, sv: 0 },
      { id: 'wheelda01', name: 'Dan Wheeler', role: 'RP', throws: 'R', age: 26, g: 46, gs: 1, outs: 195, h: 72, hr: 9, bb: 21, so: 52, hbp: 1, er: 30, w: 3, l: 1, sv: 0 },
      { id: 'yatesty01', name: 'Tyler Yates', role: 'RP', throws: 'R', age: 26, g: 21, gs: 7, outs: 140, h: 61, hr: 6, bb: 25, so: 35, hbp: 3, er: 33, w: 2, l: 4, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'francjo01', name: 'John Franco', role: 'RP', throws: 'L', age: 43, g: 52, gs: 0, outs: 138, h: 47, hr: 6, bb: 22, so: 31, hbp: 1, er: 23, w: 2, l: 7, sv: 0 },
      { id: 'morenor01', name: 'Orber Moreno', role: 'RP', throws: 'R', age: 27, g: 33, gs: 0, outs: 104, h: 31, hr: 1, bb: 11, so: 28, hbp: 3, er: 15, w: 3, l: 1, sv: 1, rk: true },
      { id: 'heilmaa01', name: 'Aaron Heilman', role: 'RP', throws: 'R', age: 25, g: 5, gs: 5, outs: 84, h: 29, hr: 5, bb: 15, so: 21, hbp: 1, er: 18, w: 1, l: 3, sv: 0 },
      { id: 'fortuba01', name: 'Bartolome Fortunato', role: 'RP', throws: 'R', age: 29, g: 18, gs: 0, outs: 78, h: 24, hr: 3, bb: 15, so: 25, hbp: 0, er: 11, w: 1, l: 0, sv: 1, rk: true },
      { id: 'bellhe01', name: 'Heath Bell', role: 'RP', throws: 'R', age: 26, g: 17, gs: 0, outs: 73, h: 22, hr: 5, bb: 6, so: 27, hbp: 0, er: 9, w: 0, l: 2, sv: 0, rk: true },
    ],
  },
  // PHI (PHI 2004)
  {
    franchiseId: 'PHI',
    season: 2004,
    batters: [
      { id: 'liebemi01', name: 'Mike Lieberthal', pos: 'C', bats: 'R', age: 32, pa: 529, h: 137, double: 30, triple: 1, hr: 15, bb: 37, so: 63, hbp: 12, sb: 0, cs: 1, sec: '1B', fld: 73, arm: 63 },
      { id: 'thomeji01', name: 'Jim Thome', pos: '1B', bats: 'L', age: 33, pa: 618, h: 139, double: 26, triple: 2, hr: 44, bb: 105, so: 150, hbp: 3, sb: 0, cs: 2, sec: '3B', fld: 63 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: '2B', bats: 'R', age: 28, pa: 555, h: 147, double: 26, triple: 1, hr: 15, bb: 31, so: 39, hbp: 10, sb: 9, cs: 3, sec: '3B', fld: 81 },
      { id: 'bellda01', name: 'David Bell', pos: '3B', bats: 'R', age: 31, pa: 603, h: 140, double: 30, triple: 1, hr: 16, bb: 59, so: 74, hbp: 7, sb: 1, cs: 1, sec: '2B', fld: 73 },
      { id: 'rolliji01', name: 'Jimmy Rollins', pos: 'SS', bats: 'S', age: 25, pa: 725, h: 180, double: 42, triple: 10, hr: 12, bb: 57, so: 93, hbp: 2, sb: 27, cs: 11, sec: '2B', fld: 64 },
      { id: 'burrepa01', name: 'Pat Burrell', pos: 'LF', bats: 'R', age: 27, pa: 534, h: 112, double: 23, triple: 2, hr: 23, bb: 72, so: 127, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 68, arm: 74 },
      { id: 'byrdma01', name: 'Marlon Byrd', pos: 'CF', bats: 'R', age: 26, pa: 378, h: 91, double: 16, triple: 2, hr: 5, bb: 26, so: 66, hbp: 6, sb: 5, cs: 2, sec: 'LF', fld: 65, arm: 68 },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 30, pa: 713, h: 176, double: 44, triple: 2, hr: 25, bb: 119, so: 121, hbp: 4, sb: 33, cs: 8, sec: 'CF', fld: 68, arm: 73 },
      { id: 'michaja01', name: 'Jason Michaels', pos: 'DH', bats: 'R', age: 28, pa: 346, h: 85, double: 17, triple: 1, hr: 10, bb: 42, so: 78, hbp: 2, sb: 2, cs: 2, sec: 'LF', fld: 67, arm: 73 },
    ],
    bench: [
      { id: 'utleych01', name: 'Chase Utley', pos: '2B', bats: 'L', age: 25, pa: 287, h: 68, double: 13, triple: 2, hr: 11, bb: 17, so: 40, hbp: 4, sb: 4, cs: 1, sec: 'SS', fld: 68 },
      { id: 'ledeeri01', name: 'Ricky Ledee', pos: 'CF', bats: 'L', age: 30, pa: 205, h: 42, double: 10, triple: 1, hr: 8, bb: 26, so: 44, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 66, arm: 78 },
      { id: 'perezto03', name: 'Tomas Perez', pos: '3B', bats: 'S', age: 30, pa: 190, h: 42, double: 11, triple: 1, hr: 4, bb: 12, so: 36, hbp: 1, sb: 0, cs: 0, sec: '2B' },
      { id: 'glanvdo01', name: 'Doug Glanville', pos: 'CF', bats: 'R', age: 33, pa: 175, h: 39, double: 3, triple: 1, hr: 3, bb: 8, so: 21, hbp: 0, sb: 6, cs: 0, sec: 'LF', fld: 82, arm: 59 },
      { id: 'prattto02', name: 'Todd Pratt', pos: 'C', bats: 'R', age: 37, pa: 149, h: 33, double: 8, triple: 0, hr: 3, bb: 20, so: 36, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 78, arm: 56 },
    ],
    reserveBatters: [
      { id: 'wootesh01', name: 'Shawn Wooten', pos: '1B', bats: 'R', age: 31, pa: 57, h: 12, double: 2, triple: 0, hr: 1, bb: 4, so: 9, hbp: 1, sb: 0, cs: 1, sec: '3B' },
      { id: 'collilo01', name: 'Lou Collier', pos: 'LF', bats: 'R', age: 30, pa: 42, h: 9, double: 1, triple: 0, hr: 1, bb: 5, so: 10, hbp: 1, sb: 1, cs: 1, sec: 'CF' },
      { id: 'howarry01', name: 'Ryan Howard', pos: '1B', bats: 'L', age: 24, pa: 42, h: 11, double: 5, triple: 0, hr: 2, bb: 2, so: 13, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'miltoer01', name: 'Eric Milton', role: 'SP', throws: 'L', age: 28, g: 34, gs: 34, outs: 603, h: 199, hr: 39, bb: 65, so: 155, hbp: 2, er: 106, w: 14, l: 6, sv: 0, fld: 66 },
      { id: 'myersbr01', name: 'Brett Myers', role: 'SP', throws: 'R', age: 23, g: 32, gs: 31, outs: 528, h: 191, hr: 26, bb: 65, so: 119, hbp: 7, er: 98, w: 11, l: 11, sv: 0, fld: 74 },
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 29, g: 25, gs: 25, outs: 423, h: 144, hr: 13, bb: 48, so: 120, hbp: 5, er: 68, w: 9, l: 6, sv: 0, fld: 73 },
      { id: 'wolfra02', name: 'Randy Wolf', role: 'SP', throws: 'L', age: 27, g: 23, gs: 23, outs: 410, h: 130, hr: 19, bb: 44, so: 108, hbp: 5, er: 62, w: 5, l: 8, sv: 0, fld: 64 },
      { id: 'padilvi01', name: 'Vicente Padilla', role: 'SP', throws: 'R', age: 26, g: 20, gs: 20, outs: 346, h: 115, hr: 13, bb: 35, so: 78, hbp: 9, er: 51, w: 7, l: 7, sv: 0 },
      { id: 'wagnebi02', name: 'Billy Wagner', role: 'CL', throws: 'L', age: 32, g: 45, gs: 0, outs: 145, h: 30, hr: 5, bb: 10, so: 57, hbp: 2, er: 11, w: 4, l: 0, sv: 21 },
      { id: 'cormirh01', name: 'Rheal Cormier', role: 'RP', throws: 'L', age: 37, g: 84, gs: 0, outs: 243, h: 66, hr: 6, bb: 28, so: 56, hbp: 4, er: 28, w: 4, l: 5, sv: 0 },
      { id: 'worreti01', name: 'Tim Worrell', role: 'RP', throws: 'R', age: 36, g: 77, gs: 0, outs: 235, h: 72, hr: 7, bb: 25, so: 64, hbp: 1, er: 28, w: 5, l: 6, sv: 19 },
      { id: 'madsory01', name: 'Ryan Madson', role: 'RP', throws: 'R', age: 23, g: 52, gs: 1, outs: 231, h: 67, hr: 6, bb: 19, so: 54, hbp: 5, er: 20, w: 9, l: 3, sv: 1, rk: true },
      { id: 'hernaro01', name: 'Roberto Hernandez', role: 'RP', throws: 'R', age: 39, g: 63, gs: 0, outs: 170, h: 63, hr: 9, bb: 31, so: 43, hbp: 2, er: 29, w: 3, l: 5, sv: 0 },
      { id: 'telemam01', name: 'Amaury Telemaco', role: 'RP', throws: 'R', age: 30, g: 42, gs: 0, outs: 163, h: 50, hr: 10, bb: 17, so: 33, hbp: 3, er: 25, w: 0, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'abbotpa01', name: 'Paul Abbott', role: 'SP', throws: 'R', age: 36, g: 20, gs: 19, outs: 288, h: 106, hr: 20, bb: 58, so: 53, hbp: 4, er: 70, w: 3, l: 11, sv: 0 },
      { id: 'gearyge01', name: 'Geoff Geary', role: 'RP', throws: 'R', age: 27, g: 33, gs: 0, outs: 134, h: 52, hr: 7, bb: 16, so: 29, hbp: 3, er: 27, w: 1, l: 0, sv: 0, rk: true },
      { id: 'powelbr01', name: 'Brian Powell', role: 'RP', throws: 'R', age: 30, g: 17, gs: 2, outs: 118, h: 41, hr: 7, bb: 15, so: 23, hbp: 1, er: 23, w: 1, l: 2, sv: 0 },
      { id: 'floydga01', name: 'Gavin Floyd', role: 'RP', throws: 'R', age: 21, g: 6, gs: 4, outs: 85, h: 25, hr: 1, bb: 16, so: 24, hbp: 5, er: 11, w: 2, l: 0, sv: 0, rk: true },
      { id: 'ramirel01', name: 'Elizardo Ramirez', role: 'RP', throws: 'R', age: 21, g: 7, gs: 0, outs: 45, h: 17, hr: 3, bb: 5, so: 9, hbp: 1, er: 8, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // WSH (MON 2004)
  {
    franchiseId: 'WSH',
    season: 2004,
    batters: [
      { id: 'schnebr01', name: 'Brian Schneider', pos: 'C', bats: 'L', age: 27, pa: 488, h: 109, double: 26, triple: 3, hr: 12, bb: 44, so: 76, hbp: 3, sb: 0, cs: 2, sec: '1B', fld: 76, arm: 84 },
      { id: 'wilkebr01', name: 'Brad Wilkerson', pos: '1B', bats: 'L', age: 27, pa: 688, h: 150, double: 38, triple: 4, hr: 27, bb: 103, so: 165, hbp: 4, sb: 13, cs: 8, sec: 'LF', fld: 75 },
      { id: 'vidrojo01', name: 'Jose Vidro', pos: '2B', bats: 'S', age: 29, pa: 467, h: 124, double: 27, triple: 0, hr: 13, bb: 49, so: 43, hbp: 2, sb: 2, cs: 1, sec: '3B', fld: 64 },
      { id: 'batisto01', name: 'Tony Batista', pos: '3B', bats: 'R', age: 30, pa: 650, h: 145, double: 27, triple: 1, hr: 29, bb: 30, so: 89, hbp: 5, sb: 9, cs: 5, sec: 'SS', fld: 70 },
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 29, pa: 673, h: 169, double: 42, triple: 2, hr: 12, bb: 45, so: 57, hbp: 2, sb: 20, cs: 4, sec: '2B', fld: 70 },
      { id: 'sledgte01', name: 'Terrmel Sledge', pos: 'LF', bats: 'L', age: 27, pa: 446, h: 107, double: 20, triple: 6, hr: 15, bb: 40, so: 66, hbp: 1, sb: 3, cs: 3, sec: 'RF', fld: 77, arm: 69, rk: true },
      { id: 'chaveen01', name: 'Endy Chavez', pos: 'CF', bats: 'L', age: 26, pa: 547, h: 134, double: 23, triple: 6, hr: 5, bb: 30, so: 49, hbp: 1, sb: 26, cs: 8, sec: 'LF', fld: 70, arm: 74 },
      { id: 'riverju01', name: 'Juan Rivera', pos: 'RF', bats: 'R', age: 25, pa: 426, h: 116, double: 26, triple: 1, hr: 12, bb: 31, so: 49, hbp: 1, sb: 5, cs: 2, sec: 'LF', fld: 69, arm: 84 },
      { id: 'cepicma01', name: 'Matthew Cepicky', pos: 'DH', bats: 'L', age: 26, pa: 61, h: 13, double: 4, triple: 0, hr: 1, bb: 2, so: 17, hbp: 0, sb: 1, cs: 0, sec: 'LF', rk: true },
    ],
    bench: [
      { id: 'gonzaal01', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 31, pa: 304, h: 64, double: 18, triple: 1, hr: 9, bb: 21, so: 65, hbp: 2, sb: 2, cs: 2, sec: '2B', fld: 68 },
      { id: 'johnsni01', name: 'Nick Johnson', pos: '1B', bats: 'L', age: 25, pa: 295, h: 64, double: 14, triple: 0, hr: 9, bb: 42, so: 53, hbp: 5, sb: 4, cs: 2, sec: '3B', fld: 76 },
      { id: 'carroja01', name: 'Jamey Carroll', pos: '2B', bats: 'R', age: 30, pa: 256, h: 62, double: 13, triple: 2, hr: 1, bb: 26, so: 29, hbp: 2, sb: 5, cs: 1, sec: '3B', fld: 70 },
      { id: 'diazei01', name: 'Einar Diaz', pos: 'C', bats: 'R', age: 31, pa: 159, h: 34, double: 7, triple: 1, hr: 1, bb: 7, so: 12, hbp: 4, sb: 1, cs: 0, sec: '1B', fld: 68, arm: 61 },
      { id: 'izturma01', name: 'Maicer Izturis', pos: 'SS', bats: 'S', age: 23, pa: 121, h: 22, double: 5, triple: 2, hr: 1, bb: 10, so: 20, hbp: 2, sb: 4, cs: 0, sec: '2B', fld: 74, rk: true },
    ],
    reserveBatters: [
      { id: 'calloro01', name: 'Ron Calloway', pos: 'RF', bats: 'L', age: 27, pa: 91, h: 18, double: 4, triple: 0, hr: 2, bb: 5, so: 20, hbp: 0, sb: 2, cs: 0, sec: 'LF', fld: 65, arm: 58 },
      { id: 'pascuva01', name: 'Val Pascucci', pos: 'RF', bats: 'R', age: 25, pa: 74, h: 11, double: 1, triple: 0, hr: 2, bb: 10, so: 22, hbp: 1, sb: 1, cs: 0, sec: 'LF', rk: true },
      { id: 'churcry01', name: 'Ryan Church', pos: 'LF', bats: 'L', age: 25, pa: 71, h: 11, double: 1, triple: 0, hr: 1, bb: 7, so: 16, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
      { id: 'harribr01', name: 'Brendan Harris', pos: '2B', bats: 'R', age: 23, pa: 63, h: 10, double: 3, triple: 0, hr: 1, bb: 3, so: 12, hbp: 1, sb: 0, cs: 0, sec: 'SS', rk: true },
      { id: 'foxan01', name: 'Andy Fox', pos: '2B', bats: 'L', age: 33, pa: 56, h: 10, double: 1, triple: 0, hr: 0, bb: 4, so: 13, hbp: 1, sb: 2, cs: 1, sec: 'SS' },
    ],
    pitchers: [
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 29, g: 35, gs: 35, outs: 765, h: 243, hr: 27, bb: 76, so: 184, hbp: 9, er: 101, w: 11, l: 15, sv: 0, fld: 84 },
      { id: 'kimsu01', name: 'Sun-Woo Kim', role: 'SP', throws: 'R', age: 26, g: 43, gs: 17, outs: 407, h: 149, hr: 19, bb: 54, so: 83, hbp: 14, er: 72, w: 4, l: 6, sv: 0, fld: 68 },
      { id: 'vargacl01', name: 'Claudio Vargas', role: 'SP', throws: 'R', age: 26, g: 45, gs: 14, outs: 355, h: 120, hr: 23, bb: 57, so: 81, hbp: 7, er: 66, w: 5, l: 5, sv: 0 },
      { id: 'dayza01', name: 'Zach Day', role: 'SP', throws: 'R', age: 26, g: 19, gs: 19, outs: 350, h: 115, hr: 10, bb: 48, so: 59, hbp: 6, er: 52, w: 5, l: 10, sv: 0 },
      { id: 'pattejo02', name: 'John Patterson', role: 'SP', throws: 'R', age: 26, g: 19, gs: 19, outs: 295, h: 101, hr: 17, bb: 46, so: 93, hbp: 7, er: 56, w: 4, l: 7, sv: 0 },
      { id: 'cordech01', name: 'Chad Cordero', role: 'CL', throws: 'R', age: 22, g: 69, gs: 0, outs: 248, h: 66, hr: 8, bb: 42, so: 85, hbp: 1, er: 26, w: 7, l: 3, sv: 14, rk: true },
      { id: 'ayalalu01', name: 'Luis Ayala', role: 'RP', throws: 'R', age: 26, g: 81, gs: 0, outs: 271, h: 89, hr: 7, bb: 16, so: 62, hbp: 5, er: 28, w: 6, l: 12, sv: 2 },
      { id: 'biddlro01', name: 'Rocky Biddle', role: 'RP', throws: 'R', age: 28, g: 47, gs: 9, outs: 234, h: 89, hr: 14, bb: 37, so: 57, hbp: 7, er: 50, w: 4, l: 8, sv: 11 },
      { id: 'tucketj01', name: 'T. J. Tucker', role: 'RP', throws: 'R', age: 25, g: 54, gs: 1, outs: 203, h: 74, hr: 6, bb: 19, so: 42, hbp: 3, er: 31, w: 4, l: 2, sv: 0 },
      { id: 'horgajo01', name: 'Joe Horgan', role: 'RP', throws: 'L', age: 27, g: 47, gs: 0, outs: 120, h: 35, hr: 5, bb: 22, so: 30, hbp: 3, er: 14, w: 4, l: 1, sv: 2, rk: true },
      { id: 'rauchjo01', name: 'Jon Rauch', role: 'RP', throws: 'R', age: 25, g: 11, gs: 4, outs: 96, h: 30, hr: 3, bb: 12, so: 22, hbp: 1, er: 13, w: 4, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'ohkato01', name: 'Tomo Ohka', role: 'SP', throws: 'R', age: 28, g: 15, gs: 15, outs: 254, h: 96, hr: 10, bb: 20, so: 47, hbp: 3, er: 35, w: 3, l: 7, sv: 0 },
      { id: 'armasto02', name: 'Tony Armas', role: 'SP', throws: 'R', age: 26, g: 16, gs: 16, outs: 216, h: 67, hr: 12, bb: 38, so: 57, hbp: 4, er: 36, w: 2, l: 4, sv: 0 },
      { id: 'downssc01', name: 'Scott Downs', role: 'SP', throws: 'L', age: 28, g: 12, gs: 12, outs: 189, h: 79, hr: 10, bb: 24, so: 39, hbp: 3, er: 38, w: 3, l: 6, sv: 0 },
      { id: 'bentzch01', name: 'Chad Bentz', role: 'RP', throws: 'L', age: 24, g: 36, gs: 0, outs: 83, h: 23, hr: 5, bb: 23, so: 18, hbp: 2, er: 18, w: 0, l: 3, sv: 0, rk: true },
      { id: 'fikacje01', name: 'Jeremy Fikac', role: 'RP', throws: 'R', age: 29, g: 19, gs: 0, outs: 75, h: 25, hr: 5, bb: 13, so: 21, hbp: 1, er: 14, w: 1, l: 2, sv: 0 },
    ],
  },
  // CHC (CHN 2004)
  {
    franchiseId: 'CHC',
    season: 2004,
    batters: [
      { id: 'barremi01', name: 'Michael Barrett', pos: 'C', bats: 'R', age: 27, pa: 506, h: 121, double: 28, triple: 5, hr: 17, bb: 37, so: 68, hbp: 4, sb: 2, cs: 3, sec: '1B', fld: 72, arm: 66 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 28, pa: 688, h: 162, double: 36, triple: 2, hr: 32, bb: 81, so: 138, hbp: 8, sb: 17, cs: 7, sec: '3B', fld: 61 },
      { id: 'walketo04', name: 'Todd Walker', pos: '2B', bats: 'L', age: 31, pa: 424, h: 107, double: 23, triple: 3, hr: 11, bb: 36, so: 45, hbp: 2, sb: 1, cs: 2, sec: '3B', fld: 56 },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 26, pa: 606, h: 158, double: 30, triple: 1, hr: 29, bb: 42, so: 78, hbp: 6, sb: 1, cs: 2, sec: '1B', fld: 59 },
      { id: 'garcino01', name: 'Nomar Garciaparra', pos: 'SS', bats: 'R', age: 30, pa: 354, h: 99, double: 21, triple: 4, hr: 12, bb: 21, so: 30, hbp: 5, sb: 6, cs: 2, sec: '2B', fld: 59 },
      { id: 'aloumo01', name: 'Moises Alou', pos: 'LF', bats: 'R', age: 37, pa: 675, h: 172, double: 35, triple: 2, hr: 31, bb: 66, so: 77, hbp: 2, sb: 4, cs: 0, sec: 'RF', fld: 60, arm: 68 },
      { id: 'patteco01', name: 'Corey Patterson', pos: 'CF', bats: 'L', age: 24, pa: 687, h: 173, double: 33, triple: 8, hr: 23, bb: 37, so: 162, hbp: 5, sb: 30, cs: 8, sec: 'LF', fld: 61, arm: 69 },
      { id: 'sosasa01', name: 'Sammy Sosa', pos: 'RF', bats: 'R', age: 35, pa: 539, h: 126, double: 20, triple: 0, hr: 36, bb: 62, so: 129, hbp: 3, sb: 0, cs: 0, sec: 'CF', fld: 66, arm: 65 },
      { id: 'hollato01', name: 'Todd Hollandsworth', pos: 'DH', bats: 'L', age: 31, pa: 167, h: 43, double: 10, triple: 1, hr: 5, bb: 15, so: 32, hbp: 0, sb: 2, cs: 2, sec: 'LF', fld: 74, arm: 70 },
    ],
    bench: [
      { id: 'martira03', name: 'Ramon Martinez', pos: 'SS', bats: 'R', age: 31, pa: 298, h: 69, double: 15, triple: 1, hr: 3, bb: 24, so: 42, hbp: 2, sb: 1, cs: 0, sec: '2B', fld: 68 },
      { id: 'grudzma01', name: 'Mark Grudzielanek', pos: '2B', bats: 'R', age: 34, pa: 278, h: 77, double: 15, triple: 1, hr: 4, bb: 14, so: 35, hbp: 3, sb: 2, cs: 1, sec: 'SS', fld: 71 },
      { id: 'maciajo01', name: 'Jose Macias', pos: '3B', bats: 'S', age: 32, pa: 204, h: 48, double: 9, triple: 2, hr: 3, bb: 8, so: 34, hbp: 2, sb: 4, cs: 2, sec: '2B' },
      { id: 'bakopa01', name: 'Paul Bako', pos: 'C', bats: 'L', age: 32, pa: 157, h: 31, double: 8, triple: 1, hr: 1, bb: 15, so: 31, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 72, arm: 69 },
      { id: 'goodwto01', name: 'Tom Goodwin', pos: 'LF', bats: 'L', age: 35, pa: 114, h: 26, double: 6, triple: 0, hr: 0, bb: 8, so: 20, hbp: 0, sb: 9, cs: 2, sec: 'CF' },
    ],
    reserveBatters: [
      { id: 'ordonre01', name: 'Rey Ordonez', pos: 'SS', bats: 'R', age: 33, pa: 67, h: 16, double: 4, triple: 0, hr: 1, bb: 2, so: 8, hbp: 0, sb: 0, cs: 0, sec: '2B', fld: 61 },
    ],
    pitchers: [
      { id: 'maddugr01', name: 'Greg Maddux', role: 'SP', throws: 'R', age: 38, g: 33, gs: 33, outs: 638, h: 217, hr: 28, bb: 35, so: 137, hbp: 8, er: 89, w: 16, l: 11, sv: 0, fld: 87 },
      { id: 'zambrca01', name: 'Carlos Zambrano', role: 'SP', throws: 'R', age: 23, g: 31, gs: 31, outs: 629, h: 177, hr: 12, bb: 88, so: 177, hbp: 15, er: 69, w: 16, l: 8, sv: 0, fld: 72 },
      { id: 'clemema01', name: 'Matt Clement', role: 'SP', throws: 'R', age: 29, g: 30, gs: 30, outs: 543, h: 153, hr: 21, bb: 75, so: 179, hbp: 11, er: 77, w: 9, l: 13, sv: 0, fld: 68 },
      { id: 'woodke02', name: 'Kerry Wood', role: 'SP', throws: 'R', age: 27, g: 22, gs: 22, outs: 421, h: 114, hr: 16, bb: 60, so: 158, hbp: 12, er: 55, w: 8, l: 9, sv: 0, fld: 61 },
      { id: 'ruschgl01', name: 'Glendon Rusch', role: 'SP', throws: 'L', age: 29, g: 32, gs: 16, outs: 389, h: 139, hr: 12, bb: 39, so: 87, hbp: 4, er: 64, w: 6, l: 2, sv: 2 },
      { id: 'hawkila01', name: 'LaTroy Hawkins', role: 'CL', throws: 'R', age: 31, g: 77, gs: 0, outs: 246, h: 71, hr: 7, bb: 15, so: 72, hbp: 1, er: 21, w: 5, l: 4, sv: 25 },
      { id: 'farnsky01', name: 'Kyle Farnsworth', role: 'RP', throws: 'R', age: 28, g: 72, gs: 0, outs: 200, h: 62, hr: 9, bb: 33, so: 80, hbp: 1, er: 34, w: 4, l: 5, sv: 0 },
      { id: 'merckke01', name: 'Kent Mercker', role: 'RP', throws: 'L', age: 36, g: 71, gs: 0, outs: 159, h: 44, hr: 6, bb: 28, so: 47, hbp: 2, er: 16, w: 3, l: 1, sv: 0 },
      { id: 'mitrese01', name: 'Sergio Mitre', role: 'RP', throws: 'R', age: 23, g: 12, gs: 9, outs: 155, h: 72, hr: 6, bb: 20, so: 35, hbp: 4, er: 39, w: 2, l: 4, sv: 0, rk: true },
      { id: 'beltrfr01', name: 'Francis Beltran', role: 'RP', throws: 'R', age: 24, g: 45, gs: 0, outs: 148, h: 47, hr: 11, bb: 29, so: 47, hbp: 2, er: 30, w: 2, l: 2, sv: 1, rk: true },
      { id: 'leicejo01', name: 'Jon Leicester', role: 'RP', throws: 'R', age: 25, g: 32, gs: 0, outs: 125, h: 40, hr: 7, bb: 15, so: 35, hbp: 0, er: 18, w: 5, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'priorma01', name: 'Mark Prior', role: 'SP', throws: 'R', age: 23, g: 21, gs: 21, outs: 356, h: 109, hr: 12, bb: 38, so: 144, hbp: 5, er: 43, w: 6, l: 4, sv: 0 },
      { id: 'remlimi01', name: 'Mike Remlinger', role: 'RP', throws: 'L', age: 38, g: 48, gs: 0, outs: 110, h: 30, hr: 4, bb: 18, so: 40, hbp: 1, er: 13, w: 1, l: 2, sv: 2 },
      { id: 'wuertmi01', name: 'Michael Wuertz', role: 'RP', throws: 'R', age: 25, g: 31, gs: 0, outs: 87, h: 22, hr: 4, bb: 17, so: 30, hbp: 0, er: 14, w: 1, l: 0, sv: 1, rk: true },
      { id: 'welleto01', name: 'Todd Wellemeyer', role: 'RP', throws: 'R', age: 25, g: 20, gs: 0, outs: 73, h: 26, hr: 3, bb: 19, so: 29, hbp: 0, er: 17, w: 2, l: 1, sv: 0, rk: true },
      { id: 'borowjo01', name: 'Joe Borowski', role: 'RP', throws: 'R', age: 33, g: 22, gs: 0, outs: 64, h: 23, hr: 2, bb: 9, so: 23, hbp: 0, er: 10, w: 2, l: 4, sv: 9 },
    ],
  },
  // CIN (CIN 2004)
  {
    franchiseId: 'CIN',
    season: 2004,
    batters: [
      { id: 'larueja01', name: 'Jason LaRue', pos: 'C', bats: 'R', age: 30, pa: 445, h: 95, double: 23, triple: 2, hr: 15, bb: 29, so: 113, hbp: 21, sb: 1, cs: 2, sec: '1B', fld: 63, arm: 69 },
      { id: 'caseyse01', name: 'Sean Casey', pos: '1B', bats: 'L', age: 29, pa: 633, h: 174, double: 34, triple: 2, hr: 18, bb: 49, so: 47, hbp: 7, sb: 3, cs: 0, sec: '3B', fld: 67 },
      { id: 'jimenda01', name: 'D\'Angelo Jimenez', pos: '2B', bats: 'S', age: 26, pa: 652, h: 153, double: 26, triple: 5, hr: 12, bb: 75, so: 96, hbp: 2, sb: 12, cs: 7, sec: 'SS', fld: 69 },
      { id: 'freelry01', name: 'Ryan Freel', pos: '3B', bats: 'R', age: 28, pa: 592, h: 142, double: 21, triple: 7, hr: 5, bb: 62, so: 82, hbp: 13, sb: 37, cs: 11, sec: '2B', fld: 86 },
      { id: 'larkiba01', name: 'Barry Larkin', pos: 'SS', bats: 'R', age: 40, pa: 386, h: 96, double: 20, triple: 2, hr: 6, bb: 33, so: 41, hbp: 1, sb: 4, cs: 1, fld: 67 },
      { id: 'dunnad01', name: 'Adam Dunn', pos: 'LF', bats: 'L', age: 24, pa: 681, h: 140, double: 29, triple: 1, hr: 41, bb: 112, so: 188, hbp: 8, sb: 10, cs: 3, sec: '1B', fld: 62, arm: 73 },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'CF', bats: 'L', age: 34, pa: 348, h: 75, double: 18, triple: 0, hr: 19, bb: 44, so: 68, hbp: 4, sb: 1, cs: 0, fld: 67, arm: 70 },
      { id: 'kearnau01', name: 'Austin Kearns', pos: 'RF', bats: 'R', age: 24, pa: 246, h: 56, double: 10, triple: 1, hr: 9, bb: 29, so: 57, hbp: 3, sb: 3, cs: 1, sec: 'CF', fld: 67, arm: 61 },
      { id: 'cruzja01', name: 'Jacob Cruz', pos: 'DH', bats: 'L', age: 31, pa: 167, h: 34, double: 7, triple: 0, hr: 3, bb: 17, so: 41, hbp: 4, sb: 1, cs: 0, sec: 'RF', fld: 69, arm: 67 },
    ],
    bench: [
      { id: 'penawi01', name: 'Wily Mo Pena', pos: 'RF', bats: 'R', age: 22, pa: 364, h: 83, double: 10, triple: 1, hr: 22, bb: 22, so: 109, hbp: 6, sb: 5, cs: 2, sec: 'CF', fld: 83, arm: 71 },
      { id: 'castrju01', name: 'Juan Castro', pos: '3B', bats: 'R', age: 32, pa: 316, h: 73, double: 17, triple: 1, hr: 6, bb: 15, so: 52, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 70 },
      { id: 'lopezfe01', name: 'Felipe Lopez', pos: 'SS', bats: 'S', age: 24, pa: 295, h: 61, double: 15, triple: 2, hr: 6, bb: 28, so: 81, hbp: 2, sb: 4, cs: 3, sec: '3B', fld: 70 },
      { id: 'valenja01', name: 'Javier Valentin', pos: 'C', bats: 'S', age: 28, pa: 222, h: 47, double: 10, triple: 1, hr: 6, bb: 14, so: 40, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 70 },
      { id: 'larsobr01', name: 'Brandon Larson', pos: '3B', bats: 'R', age: 28, pa: 135, h: 22, double: 4, triple: 0, hr: 3, bb: 15, so: 36, hbp: 1, sb: 2, cs: 1, sec: '1B', fld: 60 },
    ],
    reserveBatters: [
      { id: 'hummeti01', name: 'Tim Hummel', pos: '3B', bats: 'R', age: 25, pa: 125, h: 24, double: 5, triple: 0, hr: 2, bb: 9, so: 17, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 77, rk: true },
      { id: 'braggda01', name: 'Darren Bragg', pos: 'CF', bats: 'L', age: 34, pa: 112, h: 23, double: 4, triple: 1, hr: 2, bb: 10, so: 26, hbp: 1, sb: 1, cs: 0, sec: 'RF', fld: 83, arm: 77 },
      { id: 'machaan01', name: 'Anderson Machado', pos: 'SS', bats: 'S', age: 23, pa: 66, h: 15, double: 5, triple: 1, hr: 0, bb: 10, so: 26, hbp: 0, sb: 3, cs: 1, sec: '2B', fld: 46, rk: true },
      { id: 'vandejo02', name: 'John Vander Wal', pos: 'RF', bats: 'L', age: 38, pa: 55, h: 12, double: 3, triple: 0, hr: 2, bb: 6, so: 15, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
      { id: 'milleco01', name: 'Corky Miller', pos: 'C', bats: 'R', age: 28, pa: 49, h: 7, double: 1, triple: 0, hr: 0, bb: 5, so: 10, hbp: 2, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'lidleco01', name: 'Cory Lidle', role: 'SP', throws: 'R', age: 32, g: 34, gs: 34, outs: 634, h: 226, hr: 26, bb: 60, so: 125, hbp: 8, er: 118, w: 12, l: 12, sv: 0, fld: 81 },
      { id: 'wilsopa02', name: 'Paul Wilson', role: 'SP', throws: 'R', age: 31, g: 29, gs: 29, outs: 551, h: 199, hr: 26, bb: 60, so: 110, hbp: 9, er: 92, w: 11, l: 6, sv: 0, fld: 68 },
      { id: 'haranaa01', name: 'Aaron Harang', role: 'SP', throws: 'R', age: 26, g: 28, gs: 28, outs: 483, h: 177, hr: 24, bb: 54, so: 118, hbp: 5, er: 88, w: 10, l: 9, sv: 0, fld: 72 },
      { id: 'acevejo01', name: 'Jose Acevedo', role: 'SP', throws: 'R', age: 26, g: 39, gs: 27, outs: 473, h: 181, hr: 30, bb: 46, so: 119, hbp: 6, er: 100, w: 5, l: 12, sv: 0, fld: 66 },
      { id: 'vanpoto01', name: 'Todd Van Poppel', role: 'SP', throws: 'R', age: 32, g: 48, gs: 11, outs: 346, h: 132, hr: 22, bb: 35, so: 83, hbp: 3, er: 76, w: 4, l: 6, sv: 0 },
      { id: 'graveda01', name: 'Danny Graves', role: 'CL', throws: 'R', age: 30, g: 68, gs: 0, outs: 205, h: 77, hr: 11, bb: 15, so: 31, hbp: 2, er: 34, w: 1, l: 6, sv: 41 },
      { id: 'jonesto02', name: 'Todd Jones', role: 'RP', throws: 'R', age: 36, g: 78, gs: 0, outs: 247, h: 91, hr: 9, bb: 33, so: 64, hbp: 4, er: 46, w: 11, l: 5, sv: 2 },
      { id: 'riedljo01', name: 'John Riedling', role: 'RP', throws: 'R', age: 28, g: 70, gs: 0, outs: 233, h: 86, hr: 8, bb: 40, so: 49, hbp: 3, er: 42, w: 5, l: 3, sv: 0 },
      { id: 'nortoph01', name: 'Phil Norton', role: 'RP', throws: 'L', age: 28, g: 69, gs: 0, outs: 197, h: 67, hr: 4, bb: 38, so: 46, hbp: 2, er: 35, w: 2, l: 5, sv: 0, rk: true },
      { id: 'whitega01', name: 'Gabe White', role: 'RP', throws: 'L', age: 32, g: 64, gs: 0, outs: 179, h: 66, hr: 11, bb: 12, so: 42, hbp: 2, er: 37, w: 1, l: 3, sv: 1 },
      { id: 'wagnery01', name: 'Ryan Wagner', role: 'RP', throws: 'R', age: 21, g: 49, gs: 0, outs: 155, h: 54, hr: 7, bb: 28, so: 43, hbp: 2, er: 24, w: 3, l: 2, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'clausbr01', name: 'Brandon Claussen', role: 'SP', throws: 'L', age: 25, g: 14, gs: 14, outs: 198, h: 81, hr: 9, bb: 34, so: 46, hbp: 2, er: 43, w: 2, l: 8, sv: 0, rk: true },
      { id: 'hancojo01', name: 'Josh Hancock', role: 'SP', throws: 'R', age: 26, g: 16, gs: 11, outs: 191, h: 72, hr: 16, bb: 27, so: 38, hbp: 1, er: 36, w: 5, l: 2, sv: 0, rk: true },
      { id: 'hudsolu01', name: 'Luke Hudson', role: 'RP', throws: 'R', age: 27, g: 9, gs: 9, outs: 145, h: 36, hr: 3, bb: 26, so: 39, hbp: 2, er: 13, w: 4, l: 2, sv: 0, rk: true },
      { id: 'matthmi01', name: 'Mike Matthews', role: 'RP', throws: 'L', age: 30, g: 35, gs: 0, outs: 90, h: 31, hr: 4, bb: 15, so: 19, hbp: 2, er: 17, w: 2, l: 1, sv: 0 },
      { id: 'valenjo04', name: 'Joe Valentine', role: 'RP', throws: 'R', age: 24, g: 24, gs: 1, outs: 88, h: 25, hr: 4, bb: 24, so: 28, hbp: 2, er: 19, w: 2, l: 3, sv: 4, rk: true },
    ],
  },
  // MIL (MIL 2004)
  {
    franchiseId: 'MIL',
    season: 2004,
    batters: [
      { id: 'moellch01', name: 'Chad Moeller', pos: 'C', bats: 'R', age: 29, pa: 349, h: 73, double: 17, triple: 1, hr: 6, bb: 26, so: 74, hbp: 3, sb: 0, cs: 2, sec: '1B', fld: 76, arm: 65 },
      { id: 'overbly01', name: 'Lyle Overbay', pos: '1B', bats: 'L', age: 27, pa: 668, h: 170, double: 51, triple: 1, hr: 14, bb: 80, so: 134, hbp: 3, sb: 2, cs: 1, sec: '3B', fld: 68 },
      { id: 'ginteke01', name: 'Keith Ginter', pos: '2B', bats: 'R', age: 28, pa: 437, h: 99, double: 21, triple: 2, hr: 17, bb: 39, so: 95, hbp: 10, sb: 5, cs: 1, sec: '3B', fld: 52 },
      { id: 'helmswe01', name: 'Wes Helms', pos: '3B', bats: 'R', age: 28, pa: 306, h: 71, double: 13, triple: 0, hr: 9, bb: 23, so: 69, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 57 },
      { id: 'counscr01', name: 'Craig Counsell', pos: 'SS', bats: 'L', age: 33, pa: 545, h: 117, double: 18, triple: 4, hr: 3, bb: 59, so: 73, hbp: 4, sb: 15, cs: 5, sec: '2B', fld: 66 },
      { id: 'jenkige01', name: 'Geoff Jenkins', pos: 'LF', bats: 'L', age: 29, pa: 681, h: 166, double: 37, triple: 5, hr: 29, bb: 55, so: 150, hbp: 11, sb: 2, cs: 1, sec: 'RF', fld: 68, arm: 72 },
      { id: 'podsesc01', name: 'Scott Podsednik', pos: 'CF', bats: 'L', age: 28, pa: 712, h: 171, double: 29, triple: 8, hr: 11, bb: 60, so: 105, hbp: 6, sb: 62, cs: 12, sec: 'RF', fld: 73, arm: 66 },
      { id: 'clarkbr02', name: 'Brady Clark', pos: 'RF', bats: 'R', age: 31, pa: 419, h: 99, double: 20, triple: 1, hr: 7, bb: 42, so: 48, hbp: 9, sb: 15, cs: 6, sec: 'LF', fld: 84, arm: 67 },
      { id: 'grievbe01', name: 'Ben Grieve', pos: 'DH', bats: 'L', age: 28, pa: 294, h: 62, double: 15, triple: 0, hr: 8, bb: 40, so: 66, hbp: 4, sb: 1, cs: 0, sec: 'RF', fld: 62, arm: 58 },
    ],
    bench: [
      { id: 'hallbi03', name: 'Bill Hall', pos: '2B', bats: 'R', age: 24, pa: 415, h: 94, double: 21, triple: 4, hr: 10, bb: 20, so: 111, hbp: 1, sb: 10, cs: 6, sec: 'SS', fld: 53 },
      { id: 'spiveju01', name: 'Junior Spivey', pos: '2B', bats: 'R', age: 29, pa: 263, h: 63, double: 14, triple: 1, hr: 7, bb: 24, so: 51, hbp: 6, sb: 4, cs: 2, sec: 'SS', fld: 64 },
      { id: 'bennega01', name: 'Gary Bennett', pos: 'C', bats: 'R', age: 32, pa: 246, h: 53, double: 12, triple: 0, hr: 2, bb: 18, so: 34, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 72, arm: 66 },
      { id: 'branyru01', name: 'Russell Branyan', pos: '3B', bats: 'L', age: 28, pa: 182, h: 36, double: 9, triple: 1, hr: 10, bb: 22, so: 65, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 83 },
      { id: 'magruch01', name: 'Chris Magruder', pos: 'RF', bats: 'S', age: 27, pa: 101, h: 22, double: 6, triple: 1, hr: 2, bb: 7, so: 20, hbp: 1, sb: 0, cs: 1, sec: 'LF', fld: 72, arm: 69 },
    ],
    reserveBatters: [
      { id: 'durritr01', name: 'Trent Durrington', pos: '3B', bats: 'R', age: 28, pa: 87, h: 18, double: 2, triple: 3, hr: 2, bb: 5, so: 20, hbp: 0, sb: 4, cs: 1, sec: '2B' },
      { id: 'krynzda01', name: 'Dave Krynzel', pos: 'RF', bats: 'L', age: 22, pa: 47, h: 9, double: 1, triple: 0, hr: 0, bb: 3, so: 15, hbp: 3, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'sheetbe01', name: 'Ben Sheets', role: 'SP', throws: 'R', age: 25, g: 34, gs: 34, outs: 711, h: 217, hr: 26, bb: 42, so: 212, hbp: 6, er: 88, w: 12, l: 14, sv: 0, fld: 65 },
      { id: 'davisdo02', name: 'Doug Davis', role: 'SP', throws: 'L', age: 28, g: 34, gs: 34, outs: 622, h: 201, hr: 18, bb: 82, so: 147, hbp: 6, er: 83, w: 12, l: 12, sv: 0, fld: 71 },
      { id: 'santovi01', name: 'Victor Santos', role: 'SP', throws: 'R', age: 27, g: 31, gs: 28, outs: 462, h: 170, hr: 19, bb: 63, so: 112, hbp: 6, er: 91, w: 11, l: 12, sv: 0, fld: 55 },
      { id: 'obermwe01', name: 'Wes Obermueller', role: 'SP', throws: 'R', age: 27, g: 25, gs: 20, outs: 354, h: 140, hr: 16, bb: 42, so: 59, hbp: 5, er: 74, w: 6, l: 8, sv: 0 },
      { id: 'capuach01', name: 'Chris Capuano', role: 'SP', throws: 'L', age: 25, g: 17, gs: 17, outs: 265, h: 88, hr: 16, bb: 36, so: 77, hbp: 7, er: 49, w: 6, l: 8, sv: 0, rk: true },
      { id: 'kolbda01', name: 'Danny Kolb', role: 'CL', throws: 'R', age: 29, g: 64, gs: 0, outs: 172, h: 48, hr: 3, bb: 21, so: 32, hbp: 2, er: 18, w: 0, l: 4, sv: 39 },
      { id: 'kinnema01', name: 'Matt Kinney', role: 'RP', throws: 'R', age: 27, g: 43, gs: 6, outs: 236, h: 94, hr: 12, bb: 34, so: 67, hbp: 3, er: 49, w: 3, l: 5, sv: 0 },
      { id: 'burbada01', name: 'Dave Burba', role: 'RP', throws: 'R', age: 37, g: 51, gs: 0, outs: 231, h: 73, hr: 8, bb: 28, so: 51, hbp: 4, er: 37, w: 4, l: 1, sv: 2 },
      { id: 'vizcalu01', name: 'Luis Vizcaino', role: 'RP', throws: 'R', age: 29, g: 73, gs: 0, outs: 216, h: 62, hr: 12, bb: 26, so: 66, hbp: 1, er: 35, w: 4, l: 4, sv: 1 },
      { id: 'benneje01', name: 'Jeff Bennett', role: 'RP', throws: 'R', age: 24, g: 60, gs: 0, outs: 214, h: 78, hr: 12, bb: 26, so: 45, hbp: 2, er: 38, w: 1, l: 5, sv: 0, rk: true },
      { id: 'adamsmi03', name: 'Mike Adams', role: 'RP', throws: 'R', age: 25, g: 46, gs: 0, outs: 159, h: 50, hr: 5, bb: 14, so: 39, hbp: 2, er: 20, w: 2, l: 3, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'wisema01', name: 'Matt Wise', role: 'RP', throws: 'R', age: 28, g: 30, gs: 3, outs: 158, h: 51, hr: 3, bb: 15, so: 30, hbp: 2, er: 26, w: 1, l: 2, sv: 0 },
      { id: 'hendrbe01', name: 'Ben Hendrickson', role: 'RP', throws: 'R', age: 23, g: 10, gs: 9, outs: 139, h: 58, hr: 6, bb: 20, so: 29, hbp: 4, er: 32, w: 1, l: 8, sv: 0, rk: true },
      { id: 'kiescbr01', name: 'Brooks Kieschnick', role: 'RP', throws: 'R', age: 32, g: 32, gs: 0, outs: 129, h: 47, hr: 5, bb: 12, so: 29, hbp: 2, er: 21, w: 1, l: 1, sv: 0 },
      { id: 'fordbe01', name: 'Ben Ford', role: 'RP', throws: 'R', age: 28, g: 19, gs: 0, outs: 72, h: 25, hr: 4, bb: 10, so: 13, hbp: 2, er: 17, w: 1, l: 1, sv: 0, rk: true },
      { id: 'delarjo01', name: 'Jorge De La Rosa', role: 'RP', throws: 'L', age: 23, g: 5, gs: 5, outs: 68, h: 29, hr: 1, bb: 14, so: 5, hbp: 1, er: 16, w: 0, l: 3, sv: 0, rk: true },
    ],
  },
  // PIT (PIT 2004)
  {
    franchiseId: 'PIT',
    season: 2004,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 30, pa: 658, h: 183, double: 30, triple: 2, hr: 4, bb: 55, so: 39, hbp: 20, sb: 11, cs: 8, sec: '1B', fld: 74, arm: 74 },
      { id: 'wardda01', name: 'Daryle Ward', pos: '1B', bats: 'L', age: 29, pa: 321, h: 73, double: 16, triple: 1, hr: 11, bb: 20, so: 49, hbp: 2, sb: 0, cs: 1, sec: 'LF', fld: 69 },
      { id: 'castijo02', name: 'Jose Castillo', pos: '2B', bats: 'R', age: 23, pa: 414, h: 98, double: 15, triple: 2, hr: 8, bb: 23, so: 92, hbp: 1, sb: 3, cs: 2, sec: 'SS', fld: 70, rk: true },
      { id: 'stynech01', name: 'Chris Stynes', pos: '3B', bats: 'R', age: 31, pa: 174, h: 38, double: 10, triple: 1, hr: 3, bb: 14, so: 25, hbp: 2, sb: 1, cs: 0, sec: '2B', fld: 75 },
      { id: 'wilsoja02', name: 'Jack Wilson', pos: 'SS', bats: 'R', age: 26, pa: 693, h: 182, double: 33, triple: 8, hr: 10, bb: 33, so: 77, hbp: 4, sb: 7, cs: 4, sec: '2B', fld: 79 },
      { id: 'bayja01', name: 'Jason Bay', pos: 'LF', bats: 'R', age: 25, pa: 472, h: 115, double: 25, triple: 4, hr: 25, bb: 47, so: 129, hbp: 9, sb: 5, cs: 6, sec: 'CF', fld: 71, arm: 64, rk: true },
      { id: 'redmati01', name: 'Tike Redman', pos: 'CF', bats: 'L', age: 27, pa: 581, h: 159, double: 23, triple: 6, hr: 8, bb: 25, so: 50, hbp: 3, sb: 18, cs: 6, sec: 'RF', fld: 69, arm: 64 },
      { id: 'wilsocr03', name: 'Craig Wilson', pos: 'RF', bats: 'R', age: 27, pa: 644, h: 147, double: 32, triple: 5, hr: 29, bb: 53, so: 168, hbp: 29, sb: 3, cs: 2, sec: '1B', fld: 64, arm: 62 },
      { id: 'simonra01', name: 'Randall Simon', pos: 'DH', bats: 'L', age: 29, pa: 214, h: 51, double: 7, triple: 0, hr: 6, bb: 11, so: 17, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 77 },
    ],
    bench: [
      { id: 'mackoro01', name: 'Rob Mackowiak', pos: 'RF', bats: 'L', age: 28, pa: 555, h: 123, double: 21, triple: 6, hr: 18, bb: 49, so: 127, hbp: 7, sb: 13, cs: 3, sec: 'CF', fld: 59, arm: 78 },
      { id: 'hillbo01', name: 'Bobby Hill', pos: '2B', bats: 'S', age: 26, pa: 267, h: 61, double: 7, triple: 2, hr: 3, bb: 21, so: 42, hbp: 10, sb: 2, cs: 3, sec: '3B', fld: 85 },
      { id: 'nunezab01', name: 'Abraham Nunez', pos: '2B', bats: 'S', age: 28, pa: 195, h: 42, double: 7, triple: 2, hr: 2, bb: 14, so: 32, hbp: 1, sb: 3, cs: 2, sec: 'SS', fld: 89 },
      { id: 'mondera01', name: 'Raul Mondesi', pos: 'LF', bats: 'R', age: 33, pa: 147, h: 33, double: 8, triple: 1, hr: 5, bb: 14, so: 25, hbp: 1, sb: 4, cs: 2, sec: 'RF', fld: 67, arm: 78 },
      { id: 'bautijo02', name: 'Jose Bautista', pos: 'RF', bats: 'R', age: 23, pa: 96, h: 18, double: 3, triple: 0, hr: 0, bb: 7, so: 40, hbp: 0, sb: 0, cs: 1, sec: 'LF', rk: true },
    ],
    reserveBatters: [
      { id: 'cotahu01', name: 'Humberto Cota', pos: 'C', bats: 'R', age: 25, pa: 70, h: 15, double: 2, triple: 1, hr: 4, bb: 3, so: 20, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'alvarto01', name: 'Tony Alvarez', pos: 'RF', bats: 'R', age: 25, pa: 45, h: 9, double: 2, triple: 0, hr: 1, bb: 4, so: 7, hbp: 1, sb: 0, cs: 0, sec: 'CF', rk: true },
      { id: 'davisjj01', name: 'J. J. Davis', pos: 'RF', bats: 'R', age: 25, pa: 40, h: 6, double: 1, triple: 0, hr: 0, bb: 3, so: 12, hbp: 0, sb: 1, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'bensokr01', name: 'Kris Benson', role: 'SP', throws: 'R', age: 29, g: 31, gs: 31, outs: 601, h: 212, hr: 19, bb: 64, so: 129, hbp: 7, er: 99, w: 12, l: 12, sv: 0, fld: 72 },
      { id: 'perezol01', name: 'Oliver Perez', role: 'SP', throws: 'L', age: 22, g: 30, gs: 30, outs: 588, h: 156, hr: 25, bb: 91, so: 222, hbp: 8, er: 78, w: 12, l: 10, sv: 0, fld: 67 },
      { id: 'foggjo01', name: 'Josh Fogg', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 535, h: 196, hr: 22, bb: 61, so: 88, hbp: 9, er: 95, w: 11, l: 10, sv: 0, fld: 78 },
      { id: 'wellski01', name: 'Kip Wells', role: 'SP', throws: 'R', age: 27, g: 24, gs: 24, outs: 415, h: 138, hr: 16, bb: 60, so: 110, hbp: 6, er: 61, w: 5, l: 7, sv: 0, fld: 63 },
      { id: 'vogelry01', name: 'Ryan Vogelsong', role: 'SP', throws: 'R', age: 26, g: 31, gs: 26, outs: 399, h: 151, hr: 20, bb: 66, so: 92, hbp: 10, er: 96, w: 6, l: 13, sv: 0 },
      { id: 'mesajo01', name: 'Jose Mesa', role: 'CL', throws: 'R', age: 38, g: 70, gs: 0, outs: 208, h: 75, hr: 6, bb: 27, so: 45, hbp: 2, er: 31, w: 5, l: 2, sv: 43 },
      { id: 'torresa01', name: 'Salomon Torres', role: 'RP', throws: 'R', age: 32, g: 84, gs: 0, outs: 276, h: 89, hr: 10, bb: 27, so: 60, hbp: 6, er: 36, w: 7, l: 7, sv: 0 },
      { id: 'meadobr01', name: 'Brian Meadows', role: 'RP', throws: 'R', age: 28, g: 68, gs: 0, outs: 234, h: 81, hr: 8, bb: 16, so: 42, hbp: 1, er: 34, w: 2, l: 4, sv: 1 },
      { id: 'grabojo02', name: 'John Grabow', role: 'RP', throws: 'L', age: 25, g: 68, gs: 0, outs: 185, h: 81, hr: 8, bb: 27, so: 67, hbp: 0, er: 35, w: 2, l: 5, sv: 1, rk: true },
      { id: 'gonzami02', name: 'Mike Gonzalez', role: 'RP', throws: 'L', age: 26, g: 47, gs: 0, outs: 130, h: 32, hr: 4, bb: 9, so: 51, hbp: 1, er: 9, w: 3, l: 1, sv: 1, rk: true },
      { id: 'willida07', name: 'David Williams', role: 'RP', throws: 'L', age: 25, g: 10, gs: 6, outs: 116, h: 31, hr: 5, bb: 15, so: 31, hbp: 3, er: 19, w: 2, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'burnese01', name: 'Sean Burnett', role: 'SP', throws: 'L', age: 21, g: 13, gs: 13, outs: 215, h: 86, hr: 9, bb: 28, so: 30, hbp: 1, er: 40, w: 5, l: 5, sv: 0, rk: true },
      { id: 'coreyma02', name: 'Mark Corey', role: 'RP', throws: 'R', age: 29, g: 31, gs: 0, outs: 107, h: 39, hr: 4, bb: 18, so: 30, hbp: 2, er: 21, w: 1, l: 2, sv: 0 },
      { id: 'vanbejo01', name: 'John Van Benschoten', role: 'RP', throws: 'R', age: 24, g: 6, gs: 5, outs: 86, h: 33, hr: 3, bb: 19, so: 18, hbp: 2, er: 22, w: 1, l: 3, sv: 0, rk: true },
      { id: 'figuene01', name: 'Nelson Figueroa', role: 'RP', throws: 'R', age: 30, g: 10, gs: 3, outs: 85, h: 29, hr: 5, bb: 11, so: 15, hbp: 1, er: 15, w: 0, l: 3, sv: 0 },
      { id: 'boehrbr01', name: 'Brian Boehringer', role: 'RP', throws: 'R', age: 35, g: 21, gs: 0, outs: 76, h: 26, hr: 3, bb: 14, so: 21, hbp: 1, er: 14, w: 1, l: 1, sv: 0 },
    ],
  },
  // STL (SLN 2004)
  {
    franchiseId: 'STL',
    season: 2004,
    batters: [
      { id: 'mathemi01', name: 'Mike Matheny', pos: 'C', bats: 'R', age: 33, pa: 419, h: 94, double: 18, triple: 1, hr: 5, bb: 30, so: 74, hbp: 2, sb: 0, cs: 2, sec: '1B', fld: 78, arm: 69 },
      { id: 'pujolal01', name: 'Albert Pujols', pos: '1B', bats: 'R', age: 24, pa: 692, h: 201, double: 50, triple: 2, hr: 43, bb: 81, so: 60, hbp: 8, sb: 5, cs: 4, sec: 'LF', fld: 86 },
      { id: 'womacto01', name: 'Tony Womack', pos: '2B', bats: 'L', age: 34, pa: 606, h: 157, double: 22, triple: 4, hr: 5, bb: 33, so: 67, hbp: 4, sb: 25, cs: 7, sec: 'SS', fld: 67 },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 29, pa: 593, h: 149, double: 35, triple: 3, hr: 30, bb: 71, so: 92, hbp: 11, sb: 7, cs: 3, sec: '1B', fld: 82 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 27, pa: 642, h: 176, double: 40, triple: 1, hr: 11, bb: 49, so: 66, hbp: 1, sb: 23, cs: 9, sec: '2B', fld: 71 },
      { id: 'lankfra01', name: 'Ray Lankford', pos: 'LF', bats: 'L', age: 37, pa: 235, h: 49, double: 12, triple: 1, hr: 6, bb: 29, so: 56, hbp: 2, sb: 2, cs: 2, sec: 'CF', fld: 62, arm: 63 },
      { id: 'edmonji01', name: 'Jim Edmonds', pos: 'CF', bats: 'L', age: 34, pa: 612, h: 149, double: 37, triple: 3, hr: 41, bb: 96, so: 148, hbp: 5, sb: 5, cs: 3, sec: 'LF', fld: 64, arm: 75 },
      { id: 'sandere02', name: 'Reggie Sanders', pos: 'RF', bats: 'R', age: 36, pa: 487, h: 118, double: 25, triple: 4, hr: 24, bb: 36, so: 112, hbp: 5, sb: 18, cs: 5, sec: 'LF', fld: 64, arm: 68 },
      { id: 'walkela01', name: 'Larry Walker', pos: 'DH', bats: 'L', age: 37, pa: 316, h: 78, double: 17, triple: 4, hr: 13, bb: 49, so: 50, hbp: 6, sb: 5, cs: 2, sec: 'RF', fld: 66, arm: 71 },
    ],
    bench: [
      { id: 'mabryjo01', name: 'John Mabry', pos: 'LF', bats: 'L', age: 33, pa: 275, h: 67, double: 12, triple: 0, hr: 12, bb: 26, so: 58, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 67, arm: 58 },
      { id: 'anderma02', name: 'Marlon Anderson', pos: '2B', bats: 'L', age: 30, pa: 271, h: 63, double: 13, triple: 1, hr: 5, bb: 18, so: 33, hbp: 2, sb: 7, cs: 1, sec: 'SS', fld: 67 },
      { id: 'cedenro01', name: 'Roger Cedeno', pos: 'RF', bats: 'S', age: 29, pa: 223, h: 54, double: 9, triple: 2, hr: 3, bb: 17, so: 38, hbp: 0, sb: 7, cs: 2, sec: 'LF', fld: 57, arm: 67 },
      { id: 'tagucso01', name: 'So Taguchi', pos: 'LF', bats: 'R', age: 34, pa: 206, h: 52, double: 10, triple: 2, hr: 4, bb: 13, so: 25, hbp: 2, sb: 5, cs: 2, sec: 'CF', fld: 70, arm: 62, rk: true },
      { id: 'lunahe01', name: 'Hector Luna', pos: 'SS', bats: 'R', age: 24, pa: 192, h: 43, double: 7, triple: 2, hr: 3, bb: 13, so: 37, hbp: 2, sb: 6, cs: 3, sec: '2B', fld: 85, rk: true },
    ],
    reserveBatters: [
      { id: 'molinya01', name: 'Yadier Molina', pos: 'C', bats: 'R', age: 21, pa: 151, h: 36, double: 6, triple: 0, hr: 2, bb: 13, so: 20, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 68, arm: 82, rk: true },
      { id: 'mckayco01', name: 'Cody McKay', pos: 'C', bats: 'L', age: 30, pa: 79, h: 17, double: 2, triple: 0, hr: 0, bb: 2, so: 14, hbp: 2, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'morrima01', name: 'Matt Morris', role: 'SP', throws: 'R', age: 29, g: 32, gs: 32, outs: 606, h: 202, hr: 28, bb: 54, so: 141, hbp: 6, er: 95, w: 15, l: 10, sv: 0, fld: 74 },
      { id: 'marquja01', name: 'Jason Marquis', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 604, h: 215, hr: 26, bb: 74, so: 134, hbp: 9, er: 91, w: 15, l: 7, sv: 0, fld: 75 },
      { id: 'williwo02', name: 'Woody Williams', role: 'SP', throws: 'R', age: 37, g: 31, gs: 31, outs: 569, h: 190, hr: 19, bb: 53, so: 134, hbp: 9, er: 83, w: 11, l: 8, sv: 0, fld: 76 },
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 29, g: 31, gs: 31, outs: 564, h: 198, hr: 24, bb: 58, so: 105, hbp: 8, er: 92, w: 16, l: 9, sv: 0, fld: 72 },
      { id: 'carpech01', name: 'Chris Carpenter', role: 'SP', throws: 'R', age: 29, g: 28, gs: 28, outs: 546, h: 173, hr: 24, bb: 41, so: 145, hbp: 8, er: 73, w: 15, l: 5, sv: 0, fld: 77 },
      { id: 'isrinja01', name: 'Jason Isringhausen', role: 'CL', throws: 'R', age: 31, g: 74, gs: 0, outs: 226, h: 55, hr: 4, bb: 25, so: 73, hbp: 1, er: 22, w: 4, l: 2, sv: 47 },
      { id: 'eldreca01', name: 'Cal Eldred', role: 'RP', throws: 'R', age: 36, g: 52, gs: 0, outs: 201, h: 67, hr: 10, bb: 22, so: 58, hbp: 2, er: 28, w: 4, l: 2, sv: 1 },
      { id: 'tavarju01', name: 'Julian Tavarez', role: 'RP', throws: 'R', age: 31, g: 77, gs: 0, outs: 193, h: 61, hr: 2, bb: 22, so: 35, hbp: 5, er: 25, w: 7, l: 4, sv: 4 },
      { id: 'kingra01', name: 'Ray King', role: 'RP', throws: 'L', age: 30, g: 86, gs: 0, outs: 186, h: 46, hr: 2, bb: 25, so: 42, hbp: 2, er: 20, w: 5, l: 2, sv: 0 },
      { id: 'klinest02', name: 'Steve Kline', role: 'RP', throws: 'L', age: 31, g: 67, gs: 0, outs: 151, h: 40, hr: 3, bb: 19, so: 30, hbp: 3, er: 15, w: 2, l: 2, sv: 3 },
      { id: 'harenda01', name: 'Dan Haren', role: 'RP', throws: 'R', age: 23, g: 14, gs: 5, outs: 138, h: 48, hr: 5, bb: 15, so: 29, hbp: 3, er: 24, w: 3, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'calerki01', name: 'Kiko Calero', role: 'RP', throws: 'R', age: 29, g: 41, gs: 0, outs: 136, h: 28, hr: 5, bb: 14, so: 50, hbp: 1, er: 13, w: 3, l: 1, sv: 2, rk: true },
      { id: 'lincomi01', name: 'Mike Lincoln', role: 'RP', throws: 'R', age: 29, g: 13, gs: 0, outs: 52, h: 15, hr: 2, bb: 6, so: 12, hbp: 0, er: 8, w: 3, l: 2, sv: 0 },
      { id: 'simonja01', name: 'Jason Simontacchi', role: 'RP', throws: 'R', age: 30, g: 13, gs: 0, outs: 46, h: 17, hr: 3, bb: 6, so: 8, hbp: 1, er: 9, w: 0, l: 0, sv: 0 },
      { id: 'florera01', name: 'Randy Flores', role: 'RP', throws: 'L', age: 28, g: 9, gs: 1, outs: 42, h: 15, hr: 1, bb: 5, so: 6, hbp: 2, er: 6, w: 1, l: 0, sv: 0, rk: true },
      { id: 'reyesal01', name: 'Alberto Reyes', role: 'RP', throws: 'R', age: 34, g: 12, gs: 2, outs: 36, h: 5, hr: 0, bb: 4, so: 9, hbp: 0, er: 2, w: 0, l: 0, sv: 0 },
    ],
  },
  // ARI (ARI 2004)
  {
    franchiseId: 'ARI',
    season: 2004,
    batters: [
      { id: 'hammoro01', name: 'Robby Hammock', pos: 'C', bats: 'R', age: 27, pa: 210, h: 50, double: 13, triple: 2, hr: 6, bb: 14, so: 41, hbp: 1, sb: 3, cs: 3, sec: '1B', fld: 70, arm: 70 },
      { id: 'hillesh02', name: 'Shea Hillenbrand', pos: '1B', bats: 'R', age: 28, pa: 604, h: 167, double: 37, triple: 3, hr: 17, bb: 24, so: 64, hbp: 10, sb: 2, cs: 0, sec: '3B', fld: 69 },
      { id: 'hairssc01', name: 'Scott Hairston', pos: '2B', bats: 'R', age: 24, pa: 364, h: 84, double: 15, triple: 6, hr: 13, bb: 21, so: 88, hbp: 1, sb: 3, cs: 3, sec: 'SS', fld: 64, rk: true },
      { id: 'tracych01', name: 'Chad Tracy', pos: '3B', bats: 'L', age: 24, pa: 532, h: 137, double: 29, triple: 3, hr: 8, bb: 45, so: 60, hbp: 0, sb: 2, cs: 3, sec: '1B', fld: 79, rk: true },
      { id: 'cintral01', name: 'Alex Cintron', pos: 'SS', bats: 'S', age: 25, pa: 613, h: 157, double: 32, triple: 7, hr: 8, bb: 34, so: 54, hbp: 2, sb: 3, cs: 3, sec: '2B', fld: 66 },
      { id: 'gonzalu01', name: 'Luis Gonzalez', pos: 'LF', bats: 'L', age: 36, pa: 451, h: 107, double: 26, triple: 4, hr: 18, bb: 66, so: 52, hbp: 2, sb: 3, cs: 2, fld: 58, arm: 62 },
      { id: 'finlest01', name: 'Steve Finley', pos: 'CF', bats: 'L', age: 39, pa: 706, h: 174, double: 29, triple: 5, hr: 32, bb: 66, so: 93, hbp: 3, sb: 13, cs: 8, sec: 'RF', fld: 65, arm: 66 },
      { id: 'bautida01', name: 'Danny Bautista', pos: 'RF', bats: 'R', age: 32, pa: 582, h: 153, double: 27, triple: 3, hr: 11, bb: 36, so: 73, hbp: 5, sb: 6, cs: 3, sec: 'LF', fld: 70, arm: 69 },
      { id: 'mccraqu01', name: 'Quinton McCracken', pos: 'DH', bats: 'S', age: 33, pa: 195, h: 47, double: 9, triple: 2, hr: 1, bb: 15, so: 29, hbp: 0, sb: 3, cs: 3, sec: 'LF', fld: 58, arm: 74 },
    ],
    bench: [
      { id: 'terrelu01', name: 'Luis Terrero', pos: 'CF', bats: 'R', age: 24, pa: 255, h: 56, double: 14, triple: 0, hr: 4, bb: 20, so: 78, hbp: 6, sb: 10, cs: 2, sec: 'LF', fld: 48, arm: 76, rk: true },
      { id: 'alomaro01', name: 'Roberto Alomar', pos: '2B', bats: 'S', age: 36, pa: 190, h: 44, double: 8, triple: 1, hr: 3, bb: 17, so: 26, hbp: 1, sb: 3, cs: 1, fld: 61 },
      { id: 'britoju01', name: 'Juan Brito', pos: 'C', bats: 'R', age: 24, pa: 184, h: 36, double: 7, triple: 0, hr: 3, bb: 9, so: 40, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 66, arm: 70, rk: true },
      { id: 'katama01', name: 'Matt Kata', pos: '2B', bats: 'S', age: 26, pa: 177, h: 40, double: 9, triple: 2, hr: 3, bb: 13, so: 29, hbp: 0, sb: 3, cs: 1, sec: '3B', fld: 76 },
      { id: 'greenan01', name: 'Andy Green', pos: '3B', bats: 'R', age: 26, pa: 119, h: 22, double: 2, triple: 1, hr: 1, bb: 5, so: 17, hbp: 1, sb: 1, cs: 1, sec: '2B', rk: true },
    ],
    reserveBatters: [
      { id: 'devordo01', name: 'Doug DeVore', pos: 'LF', bats: 'L', age: 26, pa: 114, h: 24, double: 3, triple: 2, hr: 3, bb: 7, so: 31, hbp: 0, sb: 1, cs: 1, sec: 'RF', fld: 82, arm: 76, rk: true },
      { id: 'olsonti01', name: 'Tim Olson', pos: '3B', bats: 'R', age: 25, pa: 114, h: 18, double: 7, triple: 0, hr: 2, bb: 16, so: 18, hbp: 0, sb: 1, cs: 0, sec: 'SS', rk: true },
      { id: 'snydech02', name: 'Chris Snyder', pos: 'C', bats: 'R', age: 23, pa: 110, h: 23, double: 6, triple: 0, hr: 5, bb: 13, so: 25, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 71, rk: true },
      { id: 'sexsori01', name: 'Richie Sexson', pos: '1B', bats: 'R', age: 29, pa: 104, h: 24, double: 5, triple: 0, hr: 6, bb: 13, so: 22, hbp: 1, sb: 0, cs: 0, sec: 'LF', fld: 79 },
      { id: 'baergca01', name: 'Carlos Baerga', pos: '1B', bats: 'S', age: 35, pa: 94, h: 25, double: 4, triple: 0, hr: 2, bb: 6, so: 10, hbp: 2, sb: 1, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'johnsra05', name: 'Randy Johnson', role: 'SP', throws: 'L', age: 40, g: 35, gs: 35, outs: 737, h: 191, hr: 22, bb: 50, so: 283, hbp: 11, er: 76, w: 16, l: 14, sv: 0, fld: 62 },
      { id: 'webbbr01', name: 'Brandon Webb', role: 'SP', throws: 'R', age: 25, g: 35, gs: 35, outs: 624, h: 187, hr: 16, bb: 107, so: 181, hbp: 13, er: 79, w: 7, l: 16, sv: 0, fld: 73 },
      { id: 'fossuca01', name: 'Casey Fossum', role: 'SP', throws: 'L', age: 26, g: 27, gs: 27, outs: 426, h: 166, hr: 26, bb: 60, so: 121, hbp: 9, er: 95, w: 4, l: 15, sv: 0, fld: 69 },
      { id: 'sparkst01', name: 'Steve Sparks', role: 'SP', throws: 'R', age: 38, g: 29, gs: 18, outs: 362, h: 140, hr: 16, bb: 44, so: 60, hbp: 5, er: 75, w: 3, l: 7, sv: 0 },
      { id: 'desseel01', name: 'Elmer Dessens', role: 'SP', throws: 'R', age: 33, g: 50, gs: 10, outs: 315, h: 120, hr: 14, bb: 32, so: 67, hbp: 2, er: 52, w: 2, l: 6, sv: 2 },
      { id: 'aquingr01', name: 'Greg Aquino', role: 'CL', throws: 'R', age: 26, g: 34, gs: 0, outs: 106, h: 24, hr: 4, bb: 17, so: 26, hbp: 2, er: 12, w: 0, l: 2, sv: 16, rk: true },
      { id: 'koplomi01', name: 'Mike Koplove', role: 'RP', throws: 'R', age: 27, g: 76, gs: 0, outs: 260, h: 82, hr: 6, bb: 34, so: 59, hbp: 6, er: 35, w: 4, l: 4, sv: 2 },
      { id: 'randost01', name: 'Steve Randolph', role: 'RP', throws: 'L', age: 30, g: 45, gs: 6, outs: 245, h: 73, hr: 11, bb: 71, so: 65, hbp: 2, er: 46, w: 2, l: 5, sv: 0 },
      { id: 'choatra01', name: 'Randy Choate', role: 'RP', throws: 'L', age: 28, g: 74, gs: 0, outs: 152, h: 52, hr: 1, bb: 28, so: 46, hbp: 5, er: 28, w: 2, l: 4, sv: 0 },
      { id: 'cormila01', name: 'Lance Cormier', role: 'RP', throws: 'R', age: 23, g: 17, gs: 5, outs: 136, h: 62, hr: 13, bb: 25, so: 24, hbp: 2, er: 41, w: 1, l: 4, sv: 0, rk: true },
      { id: 'goodan01', name: 'Andrew Good', role: 'RP', throws: 'R', age: 24, g: 17, gs: 2, outs: 122, h: 44, hr: 9, bb: 11, so: 26, hbp: 2, er: 24, w: 1, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'daiglca01', name: 'Casey Daigle', role: 'SP', throws: 'R', age: 23, g: 10, gs: 10, outs: 147, h: 63, hr: 9, bb: 27, so: 17, hbp: 2, er: 39, w: 2, l: 3, sv: 0, rk: true },
      { id: 'gonzaed01', name: 'Edgar Gonzalez', role: 'SP', throws: 'R', age: 21, g: 10, gs: 10, outs: 139, h: 72, hr: 14, bb: 18, so: 32, hbp: 4, er: 44, w: 0, l: 9, sv: 0, rk: true },
      { id: 'brunebr01', name: 'Brian Bruney', role: 'RP', throws: 'R', age: 22, g: 30, gs: 0, outs: 94, h: 20, hr: 2, bb: 27, so: 34, hbp: 1, er: 15, w: 3, l: 4, sv: 0, rk: true },
      { id: 'valvejo01', name: 'Jose Valverde', role: 'RP', throws: 'R', age: 26, g: 29, gs: 0, outs: 89, h: 19, hr: 5, bb: 17, so: 42, hbp: 1, er: 11, w: 1, l: 2, sv: 8 },
      { id: 'goslimi01', name: 'Mike Gosling', role: 'RP', throws: 'L', age: 23, g: 6, gs: 4, outs: 76, h: 26, hr: 5, bb: 13, so: 14, hbp: 2, er: 13, w: 1, l: 1, sv: 0, rk: true },
    ],
  },
  // COL (COL 2004)
  {
    franchiseId: 'COL',
    season: 2004,
    batters: [
      { id: 'johnsch04', name: 'Charles Johnson', pos: 'C', bats: 'R', age: 32, pa: 362, h: 71, double: 20, triple: 0, hr: 14, bb: 46, so: 83, hbp: 3, sb: 1, cs: 1, sec: '1B', fld: 67, arm: 62 },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 30, pa: 683, h: 194, double: 47, triple: 3, hr: 32, bb: 116, so: 75, hbp: 3, sb: 2, cs: 1, sec: 'LF', fld: 84 },
      { id: 'milesaa01', name: 'Aaron Miles', pos: '2B', bats: 'S', age: 27, pa: 566, h: 153, double: 17, triple: 3, hr: 6, bb: 29, so: 52, hbp: 2, sb: 12, cs: 7, sec: 'SS', fld: 78, rk: true },
      { id: 'castivi02', name: 'Vinny Castilla', pos: '3B', bats: 'R', age: 36, pa: 648, h: 159, double: 37, triple: 3, hr: 28, bb: 40, so: 102, hbp: 5, sb: 1, cs: 1, sec: 'SS', fld: 85 },
      { id: 'claytro01', name: 'Royce Clayton', pos: 'SS', bats: 'R', age: 34, pa: 652, h: 150, double: 29, triple: 3, hr: 10, bb: 50, so: 119, hbp: 4, sb: 9, cs: 4, fld: 74 },
      { id: 'hollima01', name: 'Matt Holliday', pos: 'LF', bats: 'R', age: 24, pa: 439, h: 116, double: 31, triple: 3, hr: 14, bb: 31, so: 86, hbp: 6, sb: 3, cs: 3, sec: 'RF', fld: 61, arm: 66, rk: true },
      { id: 'burnije01', name: 'Jeromy Burnitz', pos: 'CF', bats: 'L', age: 35, pa: 606, h: 141, double: 27, triple: 2, hr: 34, bb: 54, so: 131, hbp: 6, sb: 6, cs: 6, sec: 'RF', fld: 64, arm: 71 },
      { id: 'hawpebr01', name: 'Brad Hawpe', pos: 'RF', bats: 'L', age: 25, pa: 118, h: 26, double: 3, triple: 2, hr: 3, bb: 11, so: 34, hbp: 1, sb: 1, cs: 1, sec: 'LF', fld: 67, arm: 64, rk: true },
      { id: 'gonzalu02', name: 'Luis Gonzalez', pos: 'DH', bats: 'R', age: 25, pa: 351, h: 94, double: 17, triple: 2, hr: 12, bb: 15, so: 67, hbp: 4, sb: 1, cs: 5, sec: 'LF', fld: 84, rk: true },
    ],
    bench: [
      { id: 'wilsopr01', name: 'Preston Wilson', pos: 'CF', bats: 'R', age: 29, pa: 222, h: 53, double: 12, triple: 0, hr: 10, bb: 19, so: 49, hbp: 2, sb: 5, cs: 2, sec: 'LF', fld: 61, arm: 71 },
      { id: 'sweenma01', name: 'Mark Sweeney', pos: 'RF', bats: 'L', age: 34, pa: 215, h: 47, double: 13, triple: 1, hr: 7, bb: 27, so: 52, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 82, arm: 87 },
      { id: 'greento02', name: 'Todd Greene', pos: 'C', bats: 'R', age: 33, pa: 209, h: 52, double: 12, triple: 0, hr: 11, bb: 8, so: 41, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 61 },
      { id: 'pelloki01', name: 'Kit Pellow', pos: 'RF', bats: 'R', age: 30, pa: 133, h: 31, double: 6, triple: 1, hr: 2, bb: 9, so: 41, hbp: 4, sb: 1, cs: 0, sec: '1B', fld: 57, arm: 75, rk: true },
      { id: 'clossjd01', name: 'JD Closser', pos: 'C', bats: 'S', age: 24, pa: 124, h: 36, double: 6, triple: 0, hr: 1, bb: 6, so: 22, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 57, arm: 71, rk: true },
    ],
    reserveBatters: [
      { id: 'hockide01', name: 'Denny Hocking', pos: 'LF', bats: 'S', age: 34, pa: 106, h: 22, double: 4, triple: 0, hr: 1, bb: 8, so: 18, hbp: 0, sb: 0, cs: 1, sec: 'RF' },
      { id: 'freemch01', name: 'Choo Freeman', pos: 'CF', bats: 'R', age: 24, pa: 105, h: 17, double: 3, triple: 2, hr: 1, bb: 14, so: 21, hbp: 0, sb: 1, cs: 1, sec: 'LF', fld: 70, arm: 66, rk: true },
      { id: 'piedrjo01', name: 'Jorge Piedra', pos: 'CF', bats: 'L', age: 25, pa: 98, h: 27, double: 8, triple: 0, hr: 3, bb: 5, so: 19, hbp: 1, sb: 0, cs: 1, sec: 'LF', fld: 61, arm: 68, rk: true },
      { id: 'barmecl01', name: 'Clint Barmes', pos: '2B', bats: 'R', age: 25, pa: 77, h: 20, double: 3, triple: 1, hr: 2, bb: 2, so: 13, hbp: 2, sb: 0, cs: 1, sec: 'SS', rk: true },
      { id: 'reyesre01', name: 'Rene Reyes', pos: 'CF', bats: 'S', age: 26, pa: 66, h: 13, double: 3, triple: 0, hr: 1, bb: 4, so: 13, hbp: 0, sb: 1, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'estessh01', name: 'Shawn Estes', role: 'SP', throws: 'L', age: 31, g: 34, gs: 34, outs: 606, h: 226, hr: 27, bb: 106, so: 125, hbp: 8, er: 127, w: 15, l: 8, sv: 0, fld: 71 },
      { id: 'jennija01', name: 'Jason Jennings', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 603, h: 238, hr: 26, bb: 97, so: 135, hbp: 7, er: 118, w: 11, l: 12, sv: 0, fld: 73 },
      { id: 'kennejo04', name: 'Joe Kennedy', role: 'SP', throws: 'L', age: 25, g: 27, gs: 27, outs: 487, h: 173, hr: 19, bb: 59, so: 104, hbp: 10, er: 81, w: 9, l: 7, sv: 0, fld: 73 },
      { id: 'fasseje01', name: 'Jeff Fassero', role: 'SP', throws: 'L', age: 41, g: 41, gs: 12, outs: 336, h: 135, hr: 14, bb: 45, so: 69, hbp: 4, er: 69, w: 3, l: 8, sv: 0 },
      { id: 'cookaa01', name: 'Aaron Cook', role: 'SP', throws: 'R', age: 25, g: 16, gs: 16, outs: 290, h: 116, hr: 7, bb: 40, so: 36, hbp: 6, er: 53, w: 6, l: 4, sv: 0 },
      { id: 'chacosh01', name: 'Shawn Chacon', role: 'CL', throws: 'R', age: 26, g: 66, gs: 0, outs: 190, h: 68, hr: 10, bb: 39, so: 48, hbp: 5, er: 43, w: 1, l: 9, sv: 35 },
      { id: 'reedst01', name: 'Steve Reed', role: 'RP', throws: 'R', age: 39, g: 65, gs: 0, outs: 198, h: 66, hr: 7, bb: 20, so: 41, hbp: 8, er: 24, w: 3, l: 8, sv: 0 },
      { id: 'harikti01', name: 'Tim Harikkala', role: 'RP', throws: 'R', age: 32, g: 55, gs: 0, outs: 188, h: 55, hr: 10, bb: 23, so: 30, hbp: 1, er: 33, w: 6, l: 6, sv: 0, rk: true },
      { id: 'dohmasc01', name: 'Scott Dohmann', role: 'RP', throws: 'R', age: 26, g: 41, gs: 0, outs: 138, h: 41, hr: 8, bb: 19, so: 49, hbp: 0, er: 21, w: 0, l: 3, sv: 0, rk: true },
      { id: 'fuentbr01', name: 'Brian Fuentes', role: 'RP', throws: 'L', age: 28, g: 47, gs: 0, outs: 134, h: 42, hr: 5, bb: 20, so: 51, hbp: 4, er: 21, w: 2, l: 4, sv: 0 },
      { id: 'lopezja02', name: 'Javier Lopez', role: 'RP', throws: 'L', age: 26, g: 64, gs: 0, outs: 122, h: 45, hr: 2, bb: 18, so: 25, hbp: 3, er: 27, w: 1, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'wrighja01', name: 'Jamey Wright', role: 'SP', throws: 'R', age: 29, g: 14, gs: 14, outs: 236, h: 81, hr: 8, bb: 44, so: 45, hbp: 6, er: 40, w: 2, l: 3, sv: 0 },
      { id: 'simpsal01', name: 'Allan Simpson', role: 'RP', throws: 'R', age: 26, g: 32, gs: 0, outs: 117, h: 44, hr: 4, bb: 20, so: 46, hbp: 4, er: 22, w: 2, l: 1, sv: 0, rk: true },
      { id: 'francje01', name: 'Jeff Francis', role: 'RP', throws: 'L', age: 23, g: 7, gs: 7, outs: 110, h: 42, hr: 8, bb: 13, so: 32, hbp: 1, er: 21, w: 3, l: 2, sv: 0, rk: true },
      { id: 'bernead01', name: 'Adam Bernero', role: 'RP', throws: 'R', age: 27, g: 16, gs: 2, outs: 97, h: 36, hr: 5, bb: 13, so: 21, hbp: 2, er: 22, w: 1, l: 1, sv: 0 },
      { id: 'starkde01', name: 'Denny Stark', role: 'RP', throws: 'R', age: 29, g: 6, gs: 6, outs: 78, h: 39, hr: 6, bb: 16, so: 13, hbp: 1, er: 22, w: 0, l: 5, sv: 0 },
    ],
  },
  // LAD (LAN 2004)
  {
    franchiseId: 'LAD',
    season: 2004,
    batters: [
      { id: 'loducpa01', name: 'Paul Lo Duca', pos: 'C', bats: 'R', age: 32, pa: 594, h: 151, double: 31, triple: 2, hr: 10, bb: 37, so: 46, hbp: 9, sb: 2, cs: 3, sec: '1B', fld: 70, arm: 68 },
      { id: 'greensh01', name: 'Shawn Green', pos: '1B', bats: 'L', age: 31, pa: 671, h: 161, double: 35, triple: 1, hr: 27, bb: 73, so: 112, hbp: 7, sb: 6, cs: 2, sec: 'LF', fld: 65 },
      { id: 'coraal01', name: 'Alex Cora', pos: '2B', bats: 'L', age: 28, pa: 484, h: 111, double: 16, triple: 4, hr: 8, bb: 35, so: 49, hbp: 14, sb: 4, cs: 3, sec: 'SS', fld: 72 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 25, pa: 657, h: 175, double: 31, triple: 2, hr: 36, bb: 46, so: 97, hbp: 3, sb: 6, cs: 3, sec: '1B', fld: 81 },
      { id: 'izturce01', name: 'Cesar Izturis', pos: 'SS', bats: 'S', age: 24, pa: 728, h: 182, double: 31, triple: 8, hr: 3, bb: 37, so: 74, hbp: 0, sb: 19, cs: 8, sec: '2B', fld: 70 },
      { id: 'roberda07', name: 'Dave Roberts', pos: 'LF', bats: 'L', age: 32, pa: 371, h: 83, double: 10, triple: 6, hr: 3, bb: 37, so: 41, hbp: 4, sb: 36, cs: 7, sec: 'CF', fld: 73, arm: 66 },
      { id: 'bradlmi01', name: 'Milton Bradley', pos: 'CF', bats: 'S', age: 26, pa: 597, h: 144, double: 31, triple: 1, hr: 17, bb: 73, so: 112, hbp: 5, sb: 17, cs: 10, sec: 'RF', fld: 68, arm: 71 },
      { id: 'encarju01', name: 'Juan Encarnacion', pos: 'RF', bats: 'R', age: 28, pa: 532, h: 124, double: 28, triple: 3, hr: 17, bb: 35, so: 80, hbp: 5, sb: 11, cs: 6, sec: 'CF', fld: 66, arm: 65 },
      { id: 'werthja01', name: 'Jayson Werth', pos: 'DH', bats: 'R', age: 25, pa: 326, h: 75, double: 12, triple: 3, hr: 15, bb: 29, so: 89, hbp: 3, sb: 4, cs: 1, sec: 'LF', fld: 72, arm: 76, rk: true },
    ],
    bench: [
      { id: 'hernajo01', name: 'Jose Hernandez', pos: '2B', bats: 'R', age: 34, pa: 238, h: 55, double: 9, triple: 1, hr: 9, bb: 22, so: 71, hbp: 1, sb: 2, cs: 1, sec: 'SS', fld: 69 },
      { id: 'maynebr01', name: 'Brent Mayne', pos: 'C', bats: 'L', age: 36, pa: 224, h: 46, double: 7, triple: 1, hr: 2, bb: 21, so: 35, hbp: 1, sb: 1, cs: 1, fld: 70, arm: 76 },
      { id: 'graboja01', name: 'Jason Grabowski', pos: 'LF', bats: 'L', age: 28, pa: 192, h: 37, double: 7, triple: 0, hr: 7, bb: 20, so: 51, hbp: 0, sb: 0, cs: 0, sec: 'RF', fld: 61, arm: 58, rk: true },
      { id: 'rossda01', name: 'David Ross', pos: 'C', bats: 'R', age: 27, pa: 190, h: 33, double: 5, triple: 1, hr: 8, bb: 16, so: 60, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 70 },
      { id: 'venturo01', name: 'Robin Ventura', pos: '1B', bats: 'L', age: 36, pa: 175, h: 37, double: 5, triple: 0, hr: 6, bb: 24, so: 32, hbp: 0, sb: 0, cs: 0, sec: '3B', fld: 79 },
    ],
    reserveBatters: [
      { id: 'saenzol01', name: 'Olmedo Saenz', pos: '1B', bats: 'R', age: 33, pa: 128, h: 31, double: 3, triple: 0, hr: 7, bb: 11, so: 30, hbp: 3, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'weaveje01', name: 'Jeff Weaver', role: 'SP', throws: 'R', age: 27, g: 34, gs: 34, outs: 660, h: 234, hr: 19, bb: 63, so: 143, hbp: 14, er: 107, w: 13, l: 13, sv: 0, fld: 73 },
      { id: 'perezod01', name: 'Odalis Perez', role: 'SP', throws: 'L', age: 26, g: 31, gs: 31, outs: 589, h: 183, hr: 26, bb: 43, so: 136, hbp: 3, er: 78, w: 7, l: 6, sv: 0, fld: 76 },
      { id: 'ishiika01', name: 'Kazuhisa Ishii', role: 'SP', throws: 'L', age: 30, g: 31, gs: 31, outs: 516, h: 152, hr: 20, bb: 106, so: 127, hbp: 5, er: 83, w: 13, l: 8, sv: 0, fld: 65 },
      { id: 'limajo01', name: 'Jose Lima', role: 'SP', throws: 'R', age: 31, g: 36, gs: 24, outs: 511, h: 179, hr: 29, bb: 40, so: 86, hbp: 3, er: 85, w: 13, l: 5, sv: 0, fld: 76 },
      { id: 'alvarwi01', name: 'Wilson Alvarez', role: 'SP', throws: 'L', age: 34, g: 40, gs: 15, outs: 362, h: 108, hr: 11, bb: 33, so: 101, hbp: 6, er: 49, w: 7, l: 6, sv: 1 },
      { id: 'gagneer01', name: 'Eric Gagne', role: 'CL', throws: 'R', age: 28, g: 70, gs: 0, outs: 247, h: 49, hr: 4, bb: 21, so: 125, hbp: 4, er: 17, w: 7, l: 3, sv: 45 },
      { id: 'motagu01', name: 'Guillermo Mota', role: 'RP', throws: 'R', age: 30, g: 78, gs: 0, outs: 290, h: 75, hr: 7, bb: 33, so: 88, hbp: 3, er: 30, w: 9, l: 8, sv: 4 },
      { id: 'sanchdu01', name: 'Duaner Sanchez', role: 'RP', throws: 'R', age: 24, g: 67, gs: 0, outs: 240, h: 85, hr: 10, bb: 27, so: 44, hbp: 7, er: 36, w: 3, l: 1, sv: 0, rk: true },
      { id: 'carragi01', name: 'Giovanni Carrara', role: 'RP', throws: 'R', age: 36, g: 42, gs: 0, outs: 161, h: 50, hr: 5, bb: 20, so: 38, hbp: 2, er: 19, w: 5, l: 2, sv: 2 },
      { id: 'dreifda01', name: 'Darren Dreifort', role: 'RP', throws: 'R', age: 32, g: 60, gs: 0, outs: 152, h: 46, hr: 5, bb: 30, so: 61, hbp: 0, er: 24, w: 1, l: 4, sv: 1 },
      { id: 'martito02', name: 'Tom Martin', role: 'RP', throws: 'L', age: 34, g: 76, gs: 0, outs: 136, h: 44, hr: 6, bb: 21, so: 38, hbp: 3, er: 20, w: 0, l: 2, sv: 1 },
    ],
    reservePitchers: [
      { id: 'nomohi01', name: 'Hideo Nomo', role: 'SP', throws: 'R', age: 35, g: 18, gs: 18, outs: 252, h: 86, hr: 13, bb: 42, so: 71, hbp: 2, er: 47, w: 4, l: 11, sv: 0 },
      { id: 'brazoyh01', name: 'Yhency Brazoban', role: 'RP', throws: 'R', age: 24, g: 31, gs: 0, outs: 98, h: 25, hr: 2, bb: 15, so: 27, hbp: 0, er: 9, w: 6, l: 2, sv: 0, rk: true },
      { id: 'jacksed01', name: 'Edwin Jackson', role: 'RP', throws: 'R', age: 20, g: 8, gs: 5, outs: 74, h: 27, hr: 5, bb: 12, so: 19, hbp: 0, er: 16, w: 2, l: 1, sv: 0, rk: true },
      { id: 'falkebr01', name: 'Brian Falkenborg', role: 'RP', throws: 'R', age: 26, g: 6, gs: 0, outs: 43, h: 19, hr: 2, bb: 9, so: 11, hbp: 3, er: 12, w: 1, l: 0, sv: 0, rk: true },
    ],
  },
  // SDP (SDN 2004)
  {
    franchiseId: 'SDP',
    season: 2004,
    batters: [
      { id: 'hernara02', name: 'Ramon Hernandez', pos: 'C', bats: 'R', age: 28, pa: 432, h: 103, double: 21, triple: 0, hr: 16, bb: 33, so: 55, hbp: 7, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 68 },
      { id: 'nevinph01', name: 'Phil Nevin', pos: '1B', bats: 'R', age: 33, pa: 623, h: 158, double: 28, triple: 1, hr: 26, bb: 62, so: 119, hbp: 4, sb: 2, cs: 0, sec: '3B', fld: 61 },
      { id: 'loretma01', name: 'Mark Loretta', pos: '2B', bats: 'R', age: 32, pa: 707, h: 203, double: 40, triple: 3, hr: 15, bb: 59, so: 56, hbp: 7, sb: 5, cs: 3, sec: 'SS', fld: 71 },
      { id: 'burrose01', name: 'Sean Burroughs', pos: '3B', bats: 'L', age: 23, pa: 564, h: 151, double: 24, triple: 4, hr: 4, bb: 36, so: 62, hbp: 9, sb: 6, cs: 3, sec: '2B', fld: 69 },
      { id: 'greenkh01', name: 'Khalil Greene', pos: 'SS', bats: 'R', age: 24, pa: 554, h: 130, double: 31, triple: 4, hr: 15, bb: 51, so: 98, hbp: 8, sb: 4, cs: 2, sec: '2B', fld: 65, rk: true },
      { id: 'kleskry01', name: 'Ryan Klesko', pos: 'LF', bats: 'L', age: 33, pa: 480, h: 114, double: 27, triple: 1, hr: 16, bb: 68, so: 72, hbp: 2, sb: 3, cs: 3, sec: '1B', fld: 64, arm: 63 },
      { id: 'paytoja01', name: 'Jay Payton', pos: 'CF', bats: 'R', age: 31, pa: 511, h: 131, double: 21, triple: 4, hr: 15, bb: 37, so: 58, hbp: 5, sb: 4, cs: 2, sec: 'LF', fld: 82, arm: 77 },
      { id: 'gilesbr02', name: 'Brian Giles', pos: 'RF', bats: 'L', age: 33, pa: 711, h: 171, double: 36, triple: 7, hr: 26, bb: 109, so: 77, hbp: 6, sb: 9, cs: 4, sec: 'LF', fld: 69, arm: 67 },
      { id: 'longte01', name: 'Terrence Long', pos: 'DH', bats: 'L', age: 28, pa: 313, h: 76, double: 16, triple: 2, hr: 6, bb: 20, so: 46, hbp: 1, sb: 2, cs: 2, sec: 'LF', fld: 78, arm: 65 },
    ],
    bench: [
      { id: 'ojedami01', name: 'Miguel Ojeda', pos: 'C', bats: 'R', age: 29, pa: 174, h: 38, double: 4, triple: 0, hr: 7, bb: 17, so: 32, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 74, arm: 67 },
      { id: 'vazqura01', name: 'Ramon Vazquez', pos: 'SS', bats: 'L', age: 27, pa: 132, h: 30, double: 5, triple: 1, hr: 1, bb: 13, so: 23, hbp: 0, sb: 2, cs: 1, sec: '2B', fld: 58 },
      { id: 'robinke02', name: 'Kerry Robinson', pos: 'LF', bats: 'L', age: 30, pa: 101, h: 25, double: 3, triple: 1, hr: 0, bb: 5, so: 11, hbp: 1, sb: 6, cs: 2, sec: 'RF', fld: 87, arm: 69 },
      { id: 'nadyxa01', name: 'Xavier Nady', pos: 'LF', bats: 'R', age: 25, pa: 84, h: 20, double: 4, triple: 0, hr: 2, bb: 5, so: 15, hbp: 1, sb: 1, cs: 0, sec: 'RF', fld: 50, arm: 71 },
      { id: 'cirilje01', name: 'Jeff Cirillo', pos: '3B', bats: 'R', age: 34, pa: 81, h: 16, double: 3, triple: 0, hr: 1, bb: 6, so: 10, hbp: 1, sb: 1, cs: 0, sec: '1B' },
    ],
    reserveBatters: [
      { id: 'guzmafr01', name: 'Freddy Guzman', pos: 'CF', bats: 'S', age: 23, pa: 80, h: 16, double: 3, triple: 0, hr: 0, bb: 3, so: 13, hbp: 1, sb: 5, cs: 2, sec: 'LF', fld: 80, arm: 84, rk: true },
      { id: 'quinthu01', name: 'Humberto Quintero', pos: 'C', bats: 'R', age: 24, pa: 78, h: 18, double: 2, triple: 0, hr: 2, bb: 5, so: 17, hbp: 0, sb: 0, cs: 2, sec: '1B', fld: 80, arm: 55, rk: true },
      { id: 'buchabr01', name: 'Brian Buchanan', pos: 'LF', bats: 'R', age: 30, pa: 72, h: 16, double: 3, triple: 0, hr: 3, bb: 7, so: 17, hbp: 1, sb: 1, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'lawrebr02', name: 'Brian Lawrence', role: 'SP', throws: 'R', age: 28, g: 34, gs: 34, outs: 609, h: 218, hr: 24, bb: 55, so: 123, hbp: 9, er: 93, w: 15, l: 14, sv: 0, fld: 77 },
      { id: 'eatonad01', name: 'Adam Eaton', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 598, h: 197, hr: 26, bb: 62, so: 155, hbp: 9, er: 98, w: 11, l: 14, sv: 0, fld: 67 },
      { id: 'wellsda01', name: 'David Wells', role: 'SP', throws: 'L', age: 41, g: 31, gs: 31, outs: 587, h: 206, hr: 22, bb: 23, so: 102, hbp: 4, er: 83, w: 12, l: 8, sv: 0, fld: 74 },
      { id: 'valdeis01', name: 'Ismael Valdez', role: 'SP', throws: 'R', age: 30, g: 34, gs: 31, outs: 510, h: 200, hr: 31, bb: 46, so: 72, hbp: 5, er: 99, w: 14, l: 9, sv: 0, fld: 69 },
      { id: 'peavyja01', name: 'Jake Peavy', role: 'SP', throws: 'R', age: 23, g: 27, gs: 27, outs: 499, h: 148, hr: 19, bb: 59, so: 154, hbp: 8, er: 59, w: 15, l: 6, sv: 0, fld: 71 },
      { id: 'hoffmtr01', name: 'Trevor Hoffman', role: 'CL', throws: 'R', age: 36, g: 55, gs: 0, outs: 164, h: 43, hr: 4, bb: 11, so: 55, hbp: 0, er: 14, w: 3, l: 3, sv: 41 },
      { id: 'linebsc01', name: 'Scott Linebrink', role: 'RP', throws: 'R', age: 27, g: 73, gs: 0, outs: 252, h: 70, hr: 8, bb: 28, so: 71, hbp: 4, er: 26, w: 7, l: 3, sv: 0 },
      { id: 'otsukak01', name: 'Akinori Otsuka', role: 'RP', throws: 'R', age: 32, g: 73, gs: 0, outs: 232, h: 56, hr: 6, bb: 26, so: 87, hbp: 0, er: 15, w: 7, l: 2, sv: 2, rk: true },
      { id: 'witasja01', name: 'Jay Witasick', role: 'RP', throws: 'R', age: 31, g: 44, gs: 0, outs: 185, h: 56, hr: 7, bb: 27, so: 55, hbp: 2, er: 23, w: 0, l: 1, sv: 1 },
      { id: 'stoneri01', name: 'Ricky Stone', role: 'RP', throws: 'R', age: 29, g: 43, gs: 0, outs: 155, h: 58, hr: 9, bb: 19, so: 37, hbp: 4, er: 28, w: 2, l: 2, sv: 0 },
      { id: 'nealbl01', name: 'Blaine Neal', role: 'RP', throws: 'R', age: 26, g: 40, gs: 0, outs: 126, h: 51, hr: 5, bb: 13, so: 33, hbp: 2, er: 21, w: 1, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'osunaan01', name: 'Antonio Osuna', role: 'RP', throws: 'R', age: 31, g: 31, gs: 0, outs: 110, h: 35, hr: 2, bb: 13, so: 34, hbp: 1, er: 13, w: 2, l: 1, sv: 0 },
      { id: 'tankede01', name: 'Dennis Tankersley', role: 'RP', throws: 'R', age: 25, g: 9, gs: 6, outs: 105, h: 36, hr: 4, bb: 21, so: 27, hbp: 2, er: 25, w: 0, l: 5, sv: 0 },
      { id: 'beckro01', name: 'Rod Beck', role: 'RP', throws: 'R', age: 35, g: 26, gs: 0, outs: 72, h: 23, hr: 6, bb: 9, so: 19, hbp: 0, er: 12, w: 0, l: 2, sv: 0 },
      { id: 'germaju01', name: 'Justin Germano', role: 'RP', throws: 'R', age: 21, g: 7, gs: 5, outs: 64, h: 31, hr: 2, bb: 14, so: 16, hbp: 0, er: 21, w: 1, l: 2, sv: 0, rk: true },
      { id: 'hitchst01', name: 'Sterling Hitchcock', role: 'RP', throws: 'L', age: 33, g: 4, gs: 4, outs: 64, h: 23, hr: 4, bb: 8, so: 16, hbp: 0, er: 12, w: 0, l: 3, sv: 0 },
    ],
  },
  // SFG (SFN 2004)
  {
    franchiseId: 'SFG',
    season: 2004,
    batters: [
      { id: 'pierzaj01', name: 'A. J. Pierzynski', pos: 'C', bats: 'L', age: 27, pa: 510, h: 136, double: 31, triple: 3, hr: 10, bb: 20, so: 42, hbp: 14, sb: 1, cs: 1, sec: '1B', fld: 73, arm: 64 },
      { id: 'felizpe01', name: 'Pedro Feliz', pos: '1B', bats: 'R', age: 29, pa: 531, h: 135, double: 29, triple: 4, hr: 24, bb: 22, so: 92, hbp: 0, sb: 4, cs: 2, sec: '3B', fld: 70 },
      { id: 'durhara01', name: 'Ray Durham', pos: '2B', bats: 'S', age: 32, pa: 542, h: 134, double: 30, triple: 7, hr: 14, bb: 58, so: 73, hbp: 5, sb: 12, cs: 6, sec: 'SS', fld: 67 },
      { id: 'alfoned01', name: 'Edgardo Alfonzo', pos: '3B', bats: 'R', age: 30, pa: 576, h: 144, double: 26, triple: 1, hr: 12, bb: 53, so: 43, hbp: 5, sb: 3, cs: 1, sec: '2B', fld: 73 },
      { id: 'cruzde01', name: 'Deivi Cruz', pos: 'SS', bats: 'R', age: 31, pa: 431, h: 109, double: 24, triple: 2, hr: 8, bb: 14, so: 36, hbp: 2, sb: 1, cs: 2, sec: '2B', fld: 71 },
      { id: 'bondsba01', name: 'Barry Bonds', pos: 'LF', bats: 'L', age: 39, pa: 617, h: 142, double: 27, triple: 2, hr: 47, bb: 206, so: 50, hbp: 10, sb: 7, cs: 1, sec: 'CF', fld: 65, arm: 77 },
      { id: 'grissma02', name: 'Marquis Grissom', pos: 'CF', bats: 'R', age: 37, pa: 606, h: 162, double: 29, triple: 3, hr: 22, bb: 31, so: 85, hbp: 2, sb: 6, cs: 2, sec: 'LF', fld: 71, arm: 64 },
      { id: 'tuckemi01', name: 'Michael Tucker', pos: 'RF', bats: 'L', age: 33, pa: 547, h: 121, double: 23, triple: 6, hr: 14, bb: 61, so: 107, hbp: 2, sb: 10, cs: 6, sec: 'LF', fld: 75, arm: 61 },
      { id: 'mohrdu01', name: 'Dustan Mohr', pos: 'DH', bats: 'R', age: 28, pa: 324, h: 74, double: 19, triple: 1, hr: 8, bb: 35, so: 73, hbp: 4, sb: 2, cs: 2, sec: 'RF', fld: 74, arm: 73 },
    ],
    bench: [
      { id: 'perezne01', name: 'Neifi Perez', pos: 'SS', bats: 'S', age: 31, pa: 420, h: 97, double: 18, triple: 2, hr: 3, bb: 20, so: 37, hbp: 0, sb: 3, cs: 3, sec: '2B', fld: 73 },
      { id: 'snowjt01', name: 'J. T. Snow', pos: '1B', bats: 'L', age: 36, pa: 417, h: 102, double: 26, triple: 2, hr: 10, bb: 56, so: 63, hbp: 7, sb: 2, cs: 1, fld: 75 },
      { id: 'torreyo01', name: 'Yorvit Torrealba', pos: 'C', bats: 'R', age: 25, pa: 196, h: 43, double: 8, triple: 2, hr: 5, bb: 15, so: 32, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 74, arm: 69 },
      { id: 'hammoje01', name: 'Jeffrey Hammonds', pos: 'RF', bats: 'R', age: 33, pa: 113, h: 24, double: 6, triple: 0, hr: 3, bb: 13, so: 20, hbp: 1, sb: 1, cs: 0, sec: 'CF', fld: 79, arm: 82 },
      { id: 'ransoco01', name: 'Cody Ransom', pos: 'SS', bats: 'R', age: 28, pa: 78, h: 17, double: 5, triple: 0, hr: 1, bb: 6, so: 22, hbp: 1, sb: 2, cs: 2, sec: '2B', rk: true },
    ],
    reserveBatters: [
      { id: 'minorda01', name: 'Damon Minor', pos: '1B', bats: 'L', age: 30, pa: 74, h: 15, double: 2, triple: 0, hr: 2, bb: 10, so: 15, hbp: 2, sb: 0, cs: 0, sec: '3B' },
      { id: 'dallibr01', name: 'Brian Dallimore', pos: '2B', bats: 'R', age: 30, pa: 49, h: 12, double: 2, triple: 0, hr: 1, bb: 4, so: 7, hbp: 1, sb: 0, cs: 1, sec: 'SS', rk: true },
      { id: 'lindeto01', name: 'Todd Linden', pos: 'LF', bats: 'S', age: 24, pa: 40, h: 6, double: 1, triple: 0, hr: 0, bb: 3, so: 7, hbp: 1, sb: 0, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'schmija01', name: 'Jason Schmidt', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 675, h: 168, hr: 17, bb: 70, so: 242, hbp: 4, er: 74, w: 18, l: 7, sv: 0, fld: 58 },
      { id: 'tomkobr01', name: 'Brett Tomko', role: 'SP', throws: 'R', age: 31, g: 32, gs: 31, outs: 582, h: 209, hr: 25, bb: 59, so: 109, hbp: 2, er: 96, w: 11, l: 7, sv: 0, fld: 69 },
      { id: 'rueteki01', name: 'Kirk Rueter', role: 'SP', throws: 'L', age: 33, g: 33, gs: 33, outs: 571, h: 220, hr: 20, bb: 63, so: 59, hbp: 1, er: 94, w: 9, l: 12, sv: 0, fld: 87 },
      { id: 'hermadu01', name: 'Dustin Hermanson', role: 'SP', throws: 'R', age: 31, g: 47, gs: 18, outs: 393, h: 135, hr: 16, bb: 45, so: 94, hbp: 4, er: 66, w: 6, l: 9, sv: 17 },
      { id: 'willije02', name: 'Jerome Williams', role: 'SP', throws: 'R', age: 22, g: 22, gs: 22, outs: 388, h: 121, hr: 12, bb: 46, so: 84, hbp: 13, er: 56, w: 10, l: 7, sv: 0 },
      { id: 'hergema01', name: 'Matt Herges', role: 'CL', throws: 'R', age: 34, g: 70, gs: 0, outs: 196, h: 79, hr: 7, bb: 24, so: 49, hbp: 3, er: 31, w: 4, l: 5, sv: 23 },
      { id: 'broweji01', name: 'Jim Brower', role: 'RP', throws: 'R', age: 31, g: 89, gs: 0, outs: 279, h: 88, hr: 7, bb: 37, so: 63, hbp: 3, er: 38, w: 7, l: 7, sv: 1 },
      { id: 'rodrife01', name: 'Felix Rodriguez', role: 'RP', throws: 'R', age: 31, g: 76, gs: 0, outs: 197, h: 60, hr: 7, bb: 30, so: 56, hbp: 5, er: 25, w: 5, l: 8, sv: 1 },
      { id: 'walkety01', name: 'Tyler Walker', role: 'RP', throws: 'R', age: 28, g: 52, gs: 0, outs: 191, h: 69, hr: 9, bb: 24, so: 48, hbp: 1, er: 31, w: 5, l: 1, sv: 1, rk: true },
      { id: 'eyresc01', name: 'Scott Eyre', role: 'RP', throws: 'L', age: 32, g: 83, gs: 0, outs: 158, h: 49, hr: 5, bb: 25, so: 41, hbp: 0, er: 22, w: 2, l: 2, sv: 1 },
      { id: 'frankwa01', name: 'Wayne Franklin', role: 'RP', throws: 'L', age: 30, g: 43, gs: 2, outs: 152, h: 52, hr: 10, bb: 24, so: 33, hbp: 3, er: 32, w: 2, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'lowryno01', name: 'Noah Lowry', role: 'SP', throws: 'L', age: 23, g: 16, gs: 14, outs: 276, h: 88, hr: 10, bb: 28, so: 73, hbp: 1, er: 38, w: 6, l: 0, sv: 0, rk: true },
      { id: 'chrisja01', name: 'Jason Christiansen', role: 'RP', throws: 'L', age: 34, g: 60, gs: 0, outs: 108, h: 35, hr: 4, bb: 23, so: 25, hbp: 2, er: 19, w: 4, l: 3, sv: 3 },
      { id: 'hennebr01', name: 'Brad Hennessey', role: 'RP', throws: 'R', age: 24, g: 7, gs: 7, outs: 103, h: 42, hr: 2, bb: 15, so: 25, hbp: 0, er: 19, w: 2, l: 2, sv: 0, rk: true },
      { id: 'correke01', name: 'Kevin Correia', role: 'RP', throws: 'R', age: 23, g: 12, gs: 1, outs: 57, h: 23, hr: 3, bb: 10, so: 14, hbp: 2, er: 12, w: 0, l: 1, sv: 0, rk: true },
      { id: 'coopebr01', name: 'Brian Cooper', role: 'RP', throws: 'R', age: 29, g: 5, gs: 2, outs: 40, h: 16, hr: 5, bb: 5, so: 6, hbp: 1, er: 14, w: 0, l: 2, sv: 0 },
    ],
  },
];
