import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 2003 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 2003
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
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents2003.ts`).
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

export const SEASON_2003: HistTeam[] = [
  // BAL (BAL 2003)
  {
    franchiseId: 'BAL',
    season: 2003,
    batters: [
      { id: 'fordybr01', name: 'Brook Fordyce', pos: 'C', bats: 'R', age: 33, pa: 376, h: 88, double: 15, triple: 1, hr: 5, bb: 21, so: 49, hbp: 3, sb: 2, cs: 2, sec: '1B', fld: 73, arm: 63 },
      { id: 'coninje01', name: 'Jeff Conine', pos: '1B', bats: 'R', age: 37, pa: 646, h: 165, double: 34, triple: 3, hr: 19, bb: 49, so: 77, hbp: 4, sb: 8, cs: 1, sec: 'LF', fld: 71 },
      { id: 'roberbr01', name: 'Brian Roberts', pos: '2B', bats: 'S', age: 25, pa: 512, h: 120, double: 22, triple: 4, hr: 5, bb: 44, so: 61, hbp: 1, sb: 24, cs: 6, sec: 'SS', fld: 72 },
      { id: 'batisto01', name: 'Tony Batista', pos: '3B', bats: 'R', age: 29, pa: 670, h: 148, double: 27, triple: 2, hr: 28, bb: 36, so: 106, hbp: 7, sb: 5, cs: 3, sec: 'SS', fld: 65 },
      { id: 'cruzde01', name: 'Deivi Cruz', pos: 'SS', bats: 'R', age: 30, pa: 572, h: 139, double: 27, triple: 2, hr: 11, bb: 18, so: 54, hbp: 3, sb: 2, cs: 2, sec: '2B', fld: 71 },
      { id: 'bigbila01', name: 'Larry Bigbie', pos: 'LF', bats: 'L', age: 25, pa: 319, h: 82, double: 14, triple: 1, hr: 8, bb: 29, so: 66, hbp: 0, sb: 7, cs: 1, sec: 'RF', fld: 78, arm: 70 },
      { id: 'matoslu01', name: 'Luis Matos', pos: 'CF', bats: 'R', age: 24, pa: 486, h: 127, double: 23, triple: 3, hr: 13, bb: 29, so: 93, hbp: 7, sb: 16, cs: 6, sec: 'RF', fld: 78, arm: 68 },
      { id: 'gibboja01', name: 'Jay Gibbons', pos: 'RF', bats: 'L', age: 26, pa: 682, h: 165, double: 37, triple: 2, hr: 28, bb: 51, so: 89, hbp: 3, sb: 0, cs: 2, sec: '1B', fld: 68, arm: 68 },
      { id: 'surhobj01', name: 'B. J. Surhoff', pos: 'DH', bats: 'L', age: 38, pa: 354, h: 92, double: 21, triple: 0, hr: 5, bb: 29, so: 29, hbp: 1, sb: 3, cs: 3, sec: 'LF' },
    ],
    bench: [
      { id: 'morame01', name: 'Melvin Mora', pos: 'LF', bats: 'R', age: 31, pa: 413, h: 94, double: 19, triple: 1, hr: 12, bb: 44, so: 71, hbp: 12, sb: 8, cs: 4, sec: 'CF', fld: 81, arm: 83 },
      { id: 'hairsje02', name: 'Jerry Hairston', pos: '2B', bats: 'R', age: 27, pa: 259, h: 59, double: 12, triple: 2, hr: 3, bb: 20, so: 29, hbp: 5, sb: 13, cs: 4, sec: 'SS', fld: 71 },
      { id: 'seguida01', name: 'David Segui', pos: 'DH', bats: 'S', age: 36, pa: 252, h: 60, double: 11, triple: 1, hr: 6, bb: 29, so: 47, hbp: 1, sb: 1, cs: 0, sec: '1B' },
      { id: 'gilge01', name: 'Geronimo Gil', pos: 'C', bats: 'R', age: 27, pa: 186, h: 41, double: 6, triple: 0, hr: 4, bb: 10, so: 35, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 62 },
      { id: 'custja01', name: 'Jack Cust', pos: 'DH', bats: 'L', age: 24, pa: 84, h: 16, double: 5, triple: 0, hr: 3, bb: 11, so: 28, hbp: 1, sb: 0, cs: 0, sec: 'LF', rk: true },
    ],
    reserveBatters: [
      { id: 'morbajo01', name: 'Jose Morban', pos: 'SS', bats: 'S', age: 23, pa: 77, h: 10, double: 0, triple: 0, hr: 2, bb: 3, so: 21, hbp: 1, sb: 8, cs: 0, sec: '2B', rk: true },
      { id: 'leonjo01', name: 'Jose Leon', pos: '3B', bats: 'R', age: 26, pa: 59, h: 13, double: 1, triple: 0, hr: 1, bb: 2, so: 15, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'macharo01', name: 'Robert Machado', pos: 'C', bats: 'R', age: 30, pa: 55, h: 13, double: 3, triple: 0, hr: 1, bb: 4, so: 10, hbp: 0, sb: 0, cs: 0, sec: '1B' },
      { id: 'mendeca01', name: 'Carlos Mendez', pos: '1B', bats: 'R', age: 29, pa: 46, h: 10, double: 2, triple: 0, hr: 0, bb: 0, so: 12, hbp: 0, sb: 0, cs: 0, sec: '3B', rk: true },
      { id: 'raineti02', name: 'Tim Raines', pos: 'CF', bats: 'R', age: 23, pa: 46, h: 6, double: 1, triple: 1, hr: 0, bb: 3, so: 12, hbp: 1, sb: 1, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'ponsosi01', name: 'Sidney Ponson', role: 'SP', throws: 'R', age: 26, g: 31, gs: 31, outs: 648, h: 214, hr: 23, bb: 65, so: 136, hbp: 5, er: 95, w: 17, l: 12, sv: 0, fld: 74 },
      { id: 'johnsja02', name: 'Jason Johnson', role: 'SP', throws: 'R', age: 29, g: 32, gs: 32, outs: 569, h: 211, hr: 25, bb: 75, so: 124, hbp: 10, er: 91, w: 10, l: 10, sv: 0, fld: 64 },
      { id: 'hentgpa01', name: 'Pat Hentgen', role: 'SP', throws: 'R', age: 34, g: 28, gs: 22, outs: 482, h: 153, hr: 26, bb: 58, so: 97, hbp: 4, er: 76, w: 7, l: 8, sv: 1, fld: 66 },
      { id: 'helliri01', name: 'Rick Helling', role: 'SP', throws: 'R', age: 32, g: 35, gs: 24, outs: 465, h: 169, hr: 29, bb: 44, so: 104, hbp: 8, er: 86, w: 8, l: 8, sv: 0, fld: 55 },
      { id: 'lopezro01', name: 'Rodrigo Lopez', role: 'SP', throws: 'R', age: 27, g: 26, gs: 26, outs: 441, h: 167, hr: 22, bb: 47, so: 107, hbp: 7, er: 81, w: 7, l: 10, sv: 0, fld: 63 },
      { id: 'juliojo01', name: 'Jorge Julio', role: 'CL', throws: 'R', age: 24, g: 64, gs: 0, outs: 185, h: 58, hr: 8, bb: 31, so: 53, hbp: 2, er: 24, w: 0, l: 7, sv: 36 },
      { id: 'bauerri01', name: 'Rick Bauer', role: 'RP', throws: 'R', age: 26, g: 35, gs: 0, outs: 184, h: 60, hr: 7, bb: 24, so: 37, hbp: 3, er: 29, w: 0, l: 0, sv: 0 },
      { id: 'ligteke01', name: 'Kerry Ligtenberg', role: 'RP', throws: 'R', age: 32, g: 68, gs: 0, outs: 178, h: 53, hr: 7, bb: 22, so: 48, hbp: 1, er: 21, w: 4, l: 2, sv: 1 },
      { id: 'ryanbj01', name: 'B. J. Ryan', role: 'RP', throws: 'L', age: 27, g: 76, gs: 0, outs: 151, h: 43, hr: 4, bb: 28, so: 55, hbp: 3, er: 22, w: 4, l: 1, sv: 0 },
      { id: 'drisktr01', name: 'Travis Driskill', role: 'RP', throws: 'R', age: 31, g: 20, gs: 0, outs: 144, h: 57, hr: 8, bb: 14, so: 30, hbp: 2, er: 28, w: 3, l: 5, sv: 1 },
      { id: 'groombu01', name: 'Buddy Groom', role: 'RP', throws: 'L', age: 37, g: 60, gs: 0, outs: 136, h: 49, hr: 5, bb: 11, so: 38, hbp: 2, er: 20, w: 1, l: 3, sv: 1 },
    ],
    reservePitchers: [
      { id: 'daalom01', name: 'Omar Daal', role: 'SP', throws: 'L', age: 31, g: 19, gs: 17, outs: 281, h: 112, hr: 13, bb: 32, so: 60, hbp: 2, er: 55, w: 4, l: 11, sv: 0 },
      { id: 'duboser01', name: 'Eric DuBose', role: 'SP', throws: 'L', age: 27, g: 17, gs: 10, outs: 221, h: 61, hr: 6, bb: 24, so: 44, hbp: 5, er: 31, w: 3, l: 6, sv: 0, rk: true },
      { id: 'roberwi01', name: 'Willis Roberts', role: 'RP', throws: 'R', age: 28, g: 26, gs: 0, outs: 118, h: 42, hr: 5, bb: 17, so: 27, hbp: 4, er: 20, w: 3, l: 1, sv: 0 },
      { id: 'carrahe01', name: 'Hector Carrasco', role: 'RP', throws: 'R', age: 33, g: 40, gs: 0, outs: 115, h: 41, hr: 5, bb: 19, so: 31, hbp: 1, er: 21, w: 2, l: 6, sv: 1 },
      { id: 'parrijo01', name: 'John Parrish', role: 'RP', throws: 'L', age: 25, g: 14, gs: 0, outs: 71, h: 18, hr: 3, bb: 10, so: 16, hbp: 1, er: 7, w: 0, l: 1, sv: 0 },
    ],
  },
  // BOS (BOS 2003)
  {
    franchiseId: 'BOS',
    season: 2003,
    batters: [
      { id: 'varitja01', name: 'Jason Varitek', pos: 'C', bats: 'S', age: 31, pa: 521, h: 124, double: 29, triple: 1, hr: 19, bb: 48, so: 101, hbp: 7, sb: 3, cs: 2, sec: '1B', fld: 71, arm: 68 },
      { id: 'millake01', name: 'Kevin Millar', pos: '1B', bats: 'R', age: 31, pa: 618, h: 160, double: 39, triple: 1, hr: 24, bb: 56, so: 101, hbp: 6, sb: 2, cs: 2, sec: 'LF', fld: 79 },
      { id: 'walketo04', name: 'Todd Walker', pos: '2B', bats: 'L', age: 30, pa: 647, h: 170, double: 39, triple: 3, hr: 13, bb: 49, so: 67, hbp: 2, sb: 3, cs: 3, sec: '3B', fld: 62 },
      { id: 'muellbi02', name: 'Bill Mueller', pos: '3B', bats: 'S', age: 32, pa: 600, h: 158, double: 38, triple: 5, hr: 16, bb: 66, so: 69, hbp: 5, sb: 1, cs: 3, sec: '2B', fld: 64 },
      { id: 'garcino01', name: 'Nomar Garciaparra', pos: 'SS', bats: 'R', age: 29, pa: 719, h: 200, double: 45, triple: 10, hr: 27, bb: 41, so: 63, hbp: 9, sb: 13, cs: 4, sec: '2B', fld: 68 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'LF', bats: 'R', age: 31, pa: 679, h: 188, double: 37, triple: 1, hr: 40, bb: 95, so: 110, hbp: 9, sb: 2, cs: 1, sec: 'RF', fld: 65, arm: 76 },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'CF', bats: 'L', age: 29, pa: 690, h: 168, double: 33, triple: 7, hr: 12, bb: 65, so: 71, hbp: 4, sb: 29, cs: 7, sec: 'LF', fld: 73, arm: 69 },
      { id: 'nixontr01', name: 'Trot Nixon', pos: 'RF', bats: 'L', age: 29, pa: 513, h: 125, double: 26, triple: 4, hr: 24, bb: 61, so: 94, hbp: 4, sb: 4, cs: 2, sec: 'CF', fld: 65, arm: 64 },
      { id: 'ortizda01', name: 'David Ortiz', pos: 'DH', bats: 'L', age: 27, pa: 509, h: 124, double: 36, triple: 2, hr: 27, bb: 54, so: 89, hbp: 2, sb: 1, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'kaplega01', name: 'Gabe Kapler', pos: 'RF', bats: 'R', age: 27, pa: 247, h: 61, double: 12, triple: 1, hr: 4, bb: 20, so: 37, hbp: 1, sb: 8, cs: 2, sec: 'CF', fld: 56, arm: 81 },
      { id: 'mirabdo01', name: 'Doug Mirabelli', pos: 'C', bats: 'R', age: 32, pa: 176, h: 38, double: 10, triple: 0, hr: 7, bb: 15, so: 37, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 57, arm: 64 },
      { id: 'jacksda04', name: 'Damian Jackson', pos: '2B', bats: 'R', age: 29, pa: 172, h: 39, double: 9, triple: 1, hr: 1, bb: 12, so: 31, hbp: 1, sb: 10, cs: 4, sec: 'SS', fld: 48 },
      { id: 'giambje01', name: 'Jeremy Giambi', pos: 'DH', bats: 'L', age: 28, pa: 156, h: 31, double: 7, triple: 0, hr: 6, bb: 27, so: 36, hbp: 2, sb: 0, cs: 0, sec: 'RF' },
      { id: 'mccarda01', name: 'Dave McCarty', pos: 'LF', bats: 'R', age: 33, pa: 57, h: 13, double: 3, triple: 0, hr: 1, bb: 5, so: 13, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'lowede01', name: 'Derek Lowe', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 610, h: 201, hr: 15, bb: 63, so: 123, hbp: 11, er: 86, w: 17, l: 7, sv: 0, fld: 86 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 36, g: 35, gs: 33, outs: 607, h: 182, hr: 21, bb: 72, so: 172, hbp: 13, er: 84, w: 11, l: 7, sv: 1, fld: 68 },
      { id: 'martipe02', name: 'Pedro Martinez', role: 'SP', throws: 'R', age: 31, g: 29, gs: 29, outs: 560, h: 143, hr: 9, bb: 43, so: 221, hbp: 11, er: 47, w: 14, l: 4, sv: 0, fld: 71 },
      { id: 'burkejo03', name: 'John Burkett', role: 'SP', throws: 'R', age: 38, g: 32, gs: 30, outs: 545, h: 196, hr: 21, bb: 51, so: 124, hbp: 8, er: 92, w: 12, l: 9, sv: 0, fld: 64 },
      { id: 'kimby01', name: 'Byung-Hyun Kim', role: 'SP', throws: 'R', age: 24, g: 56, gs: 12, outs: 367, h: 97, hr: 11, bb: 38, so: 118, hbp: 11, er: 40, w: 9, l: 10, sv: 16 },
      { id: 'lyonbr01', name: 'Brandon Lyon', role: 'CL', throws: 'R', age: 23, g: 49, gs: 0, outs: 177, h: 72, hr: 9, bb: 18, so: 40, hbp: 2, er: 33, w: 4, l: 6, sv: 9 },
      { id: 'timlimi01', name: 'Mike Timlin', role: 'RP', throws: 'R', age: 37, g: 72, gs: 0, outs: 251, h: 74, hr: 11, bb: 12, so: 55, hbp: 4, er: 32, w: 6, l: 4, sv: 2 },
      { id: 'mendora01', name: 'Ramiro Mendoza', role: 'RP', throws: 'R', age: 31, g: 37, gs: 5, outs: 200, h: 87, hr: 8, bb: 17, so: 45, hbp: 3, er: 39, w: 3, l: 5, sv: 0 },
      { id: 'embreal01', name: 'Alan Embree', role: 'RP', throws: 'L', age: 33, g: 65, gs: 0, outs: 165, h: 49, hr: 7, bb: 17, so: 57, hbp: 1, er: 24, w: 4, l: 1, sv: 1 },
      { id: 'chenbr01', name: 'Bruce Chen', role: 'RP', throws: 'L', age: 26, g: 16, gs: 2, outs: 73, h: 26, hr: 5, bb: 11, so: 23, hbp: 1, er: 14, w: 0, l: 1, sv: 0 },
      { id: 'shielja01', name: 'Jason Shiell', role: 'RP', throws: 'R', age: 26, g: 17, gs: 0, outs: 70, h: 26, hr: 4, bb: 18, so: 22, hbp: 2, er: 14, w: 2, l: 0, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'fossuca01', name: 'Casey Fossum', role: 'SP', throws: 'L', age: 25, g: 19, gs: 14, outs: 237, h: 83, hr: 9, bb: 29, so: 67, hbp: 4, er: 40, w: 6, l: 5, sv: 1 },
      { id: 'woodast01', name: 'Steve Woodard', role: 'RP', throws: 'R', age: 28, g: 7, gs: 0, outs: 53, h: 23, hr: 3, bb: 5, so: 11, hbp: 1, er: 11, w: 1, l: 0, sv: 0 },
      { id: 'arroybr01', name: 'Bronson Arroyo', role: 'RP', throws: 'R', age: 26, g: 6, gs: 0, outs: 52, h: 15, hr: 1, bb: 6, so: 10, hbp: 1, er: 7, w: 0, l: 0, sv: 1 },
      { id: 'persoro01', name: 'Robert Person', role: 'RP', throws: 'R', age: 33, g: 7, gs: 0, outs: 35, h: 11, hr: 2, bb: 6, so: 10, hbp: 1, er: 7, w: 0, l: 0, sv: 1 },
      { id: 'rupery01', name: 'Ryan Rupe', role: 'RP', throws: 'R', age: 28, g: 4, gs: 1, outs: 30, h: 10, hr: 2, bb: 3, so: 8, hbp: 1, er: 7, w: 1, l: 1, sv: 0 },
    ],
  },
  // NYY (NYA 2003)
  {
    franchiseId: 'NYY',
    season: 2003,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 32, pa: 588, h: 136, double: 30, triple: 1, hr: 25, bb: 84, so: 125, hbp: 7, sb: 2, cs: 3, sec: '1B', fld: 69, arm: 68 },
      { id: 'giambja01', name: 'Jason Giambi', pos: '1B', bats: 'L', age: 32, pa: 690, h: 156, double: 32, triple: 1, hr: 41, bb: 123, so: 122, hbp: 18, sb: 2, cs: 1, sec: 'LF', fld: 58 },
      { id: 'soriaal01', name: 'Alfonso Soriano', pos: '2B', bats: 'R', age: 27, pa: 734, h: 199, double: 42, triple: 4, hr: 36, bb: 32, so: 142, hbp: 11, sb: 39, cs: 11, sec: 'SS', fld: 63 },
      { id: 'venturo01', name: 'Robin Ventura', pos: '3B', bats: 'L', age: 35, pa: 453, h: 93, double: 16, triple: 0, hr: 17, bb: 66, so: 84, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 66 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 29, pa: 542, h: 150, double: 23, triple: 2, hr: 13, bb: 48, so: 85, hbp: 9, sb: 18, cs: 3, sec: '2B', fld: 53 },
      { id: 'matsuhi01', name: 'Hideki Matsui', pos: 'LF', bats: 'L', age: 29, pa: 695, h: 179, double: 42, triple: 1, hr: 16, bb: 63, so: 86, hbp: 3, sb: 2, cs: 2, sec: 'CF', fld: 72, arm: 74, rk: true },
      { id: 'willibe02', name: 'Bernie Williams', pos: 'CF', bats: 'S', age: 34, pa: 521, h: 134, double: 24, triple: 1, hr: 16, bb: 66, so: 64, hbp: 3, sb: 6, cs: 2, fld: 73, arm: 64 },
      { id: 'mondera01', name: 'Raul Mondesi', pos: 'RF', bats: 'R', age: 32, pa: 586, h: 133, double: 30, triple: 3, hr: 24, bb: 57, so: 99, hbp: 4, sb: 20, cs: 9, sec: 'CF', fld: 68, arm: 69 },
      { id: 'johnsni01', name: 'Nick Johnson', pos: 'DH', bats: 'L', age: 24, pa: 406, h: 88, double: 17, triple: 0, hr: 14, bb: 58, so: 71, hbp: 10, sb: 3, cs: 2, sec: '1B', fld: 66 },
    ],
    bench: [
      { id: 'zeileto01', name: 'Todd Zeile', pos: '3B', bats: 'R', age: 37, pa: 341, h: 76, double: 12, triple: 1, hr: 10, bb: 37, so: 55, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 70 },
      { id: 'sierrru01', name: 'Ruben Sierra', pos: 'DH', bats: 'S', age: 37, pa: 336, h: 85, double: 18, triple: 1, hr: 11, bb: 24, so: 48, hbp: 0, sb: 2, cs: 0, sec: 'RF' },
      { id: 'garcika01', name: 'Karim Garcia', pos: 'RF', bats: 'L', age: 27, pa: 262, h: 68, double: 8, triple: 0, hr: 15, bb: 12, so: 52, hbp: 1, sb: 0, cs: 3, sec: 'LF', fld: 67, arm: 77 },
      { id: 'riverju01', name: 'Juan Rivera', pos: 'LF', bats: 'R', age: 24, pa: 185, h: 45, double: 13, triple: 0, hr: 6, bb: 10, so: 25, hbp: 0, sb: 0, cs: 0, sec: 'RF', fld: 69, arm: 70, rk: true },
      { id: 'wilsoen01', name: 'Enrique Wilson', pos: 'SS', bats: 'S', age: 29, pa: 147, h: 29, double: 6, triple: 1, hr: 2, bb: 7, so: 20, hbp: 1, sb: 2, cs: 2, sec: '3B', fld: 60 },
    ],
    reserveBatters: [
      { id: 'flahejo01', name: 'John Flaherty', pos: 'C', bats: 'R', age: 35, pa: 116, h: 28, double: 8, triple: 0, hr: 2, bb: 5, so: 18, hbp: 1, sb: 0, cs: 0, fld: 76, arm: 72 },
      { id: 'almoner01', name: 'Erick Almonte', pos: 'SS', bats: 'R', age: 25, pa: 111, h: 26, double: 6, triple: 0, hr: 1, bb: 8, so: 24, hbp: 1, sb: 2, cs: 0, sec: '2B', fld: 53, rk: true },
      { id: 'trammbu01', name: 'Bubba Trammell', pos: 'DH', bats: 'R', age: 31, pa: 61, h: 13, double: 2, triple: 0, hr: 2, bb: 6, so: 9, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'mussimi01', name: 'Mike Mussina', role: 'SP', throws: 'R', age: 34, g: 31, gs: 31, outs: 644, h: 195, hr: 22, bb: 42, so: 190, hbp: 4, er: 84, w: 17, l: 8, sv: 0, fld: 76 },
      { id: 'wellsda01', name: 'David Wells', role: 'SP', throws: 'L', age: 40, g: 31, gs: 30, outs: 639, h: 233, hr: 23, bb: 32, so: 117, hbp: 7, er: 95, w: 15, l: 7, sv: 0, fld: 71 },
      { id: 'clemero02', name: 'Roger Clemens', role: 'SP', throws: 'R', age: 40, g: 33, gs: 33, outs: 635, h: 198, hr: 22, bb: 64, so: 201, hbp: 6, er: 92, w: 17, l: 9, sv: 0, fld: 69 },
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 31, g: 33, gs: 33, outs: 625, h: 227, hr: 17, bb: 48, so: 171, hbp: 3, er: 89, w: 21, l: 8, sv: 0, fld: 61 },
      { id: 'weaveje01', name: 'Jeff Weaver', role: 'SP', throws: 'R', age: 26, g: 32, gs: 24, outs: 478, h: 189, hr: 15, bb: 46, so: 105, hbp: 10, er: 87, w: 7, l: 9, sv: 0, fld: 66 },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 33, g: 64, gs: 0, outs: 212, h: 58, hr: 4, bb: 12, so: 66, hbp: 3, er: 16, w: 5, l: 2, sv: 40 },
      { id: 'hitchst01', name: 'Sterling Hitchcock', role: 'RP', throws: 'L', age: 32, g: 35, gs: 7, outs: 263, h: 99, hr: 12, bb: 30, so: 64, hbp: 2, er: 48, w: 6, l: 4, sv: 0 },
      { id: 'contrjo01', name: 'Jose Contreras', role: 'RP', throws: 'R', age: 31, g: 18, gs: 9, outs: 213, h: 52, hr: 4, bb: 30, so: 72, hbp: 5, er: 26, w: 7, l: 2, sv: 0, rk: true },
      { id: 'hammoch01', name: 'Chris Hammond', role: 'RP', throws: 'L', age: 37, g: 62, gs: 0, outs: 189, h: 56, hr: 3, bb: 18, so: 49, hbp: 1, er: 14, w: 3, l: 2, sv: 1 },
      { id: 'osunaan01', name: 'Antonio Osuna', role: 'RP', throws: 'R', age: 30, g: 48, gs: 0, outs: 152, h: 55, hr: 2, bb: 21, so: 49, hbp: 3, er: 23, w: 2, l: 5, sv: 0 },
      { id: 'aceveju01', name: 'Juan Acevedo', role: 'RP', throws: 'R', age: 33, g: 39, gs: 0, outs: 115, h: 45, hr: 4, bb: 17, so: 27, hbp: 2, er: 20, w: 1, l: 5, sv: 6 },
    ],
    reservePitchers: [
      { id: 'anderja01', name: 'Jason Anderson', role: 'RP', throws: 'R', age: 24, g: 28, gs: 0, outs: 94, h: 33, hr: 5, bb: 19, so: 16, hbp: 3, er: 17, w: 1, l: 0, sv: 0, rk: true },
      { id: 'reyesal01', name: 'Alberto Reyes', role: 'RP', throws: 'R', age: 33, g: 13, gs: 0, outs: 51, h: 13, hr: 1, bb: 8, so: 14, hbp: 1, er: 6, w: 0, l: 0, sv: 0 },
      { id: 'depaujo01', name: 'Jorge De Paula', role: 'RP', throws: 'R', age: 24, g: 4, gs: 1, outs: 34, h: 3, hr: 1, bb: 1, so: 7, hbp: 1, er: 1, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // TBR (TBA 2003)
  {
    franchiseId: 'TBR',
    season: 2003,
    batters: [
      { id: 'hallto02', name: 'Toby Hall', pos: 'C', bats: 'R', age: 27, pa: 498, h: 120, double: 26, triple: 0, hr: 11, bb: 22, so: 39, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 69, arm: 82 },
      { id: 'leetr01', name: 'Travis Lee', pos: '1B', bats: 'L', age: 28, pa: 613, h: 146, double: 33, triple: 3, hr: 17, bb: 62, so: 102, hbp: 1, sb: 5, cs: 3, sec: 'LF', fld: 76 },
      { id: 'anderma02', name: 'Marlon Anderson', pos: '2B', bats: 'L', age: 29, pa: 535, h: 131, double: 27, triple: 4, hr: 7, bb: 38, so: 63, hbp: 3, sb: 12, cs: 3, sec: 'SS', fld: 60 },
      { id: 'rollsda01', name: 'Damian Rolls', pos: '3B', bats: 'R', age: 25, pa: 404, h: 98, double: 20, triple: 1, hr: 6, bb: 18, so: 81, hbp: 6, sb: 12, cs: 6, sec: '2B', fld: 82 },
      { id: 'lugoju01', name: 'Julio Lugo', pos: 'SS', bats: 'R', age: 27, pa: 556, h: 133, double: 18, triple: 3, hr: 13, bb: 44, so: 106, hbp: 4, sb: 12, cs: 5, sec: '2B', fld: 74 },
      { id: 'crawfca02', name: 'Carl Crawford', pos: 'LF', bats: 'L', age: 21, pa: 661, h: 173, double: 20, triple: 10, hr: 5, bb: 25, so: 101, hbp: 2, sb: 48, cs: 10, sec: 'CF', fld: 87, arm: 71 },
      { id: 'baldero01', name: 'Rocco Baldelli', pos: 'CF', bats: 'R', age: 21, pa: 684, h: 184, double: 32, triple: 8, hr: 11, bb: 30, so: 128, hbp: 8, sb: 27, cs: 10, sec: 'LF', fld: 81, arm: 77, rk: true },
      { id: 'huffau01', name: 'Aubrey Huff', pos: 'RF', bats: 'L', age: 26, pa: 706, h: 195, double: 43, triple: 2, hr: 31, bb: 51, so: 84, hbp: 5, sb: 3, cs: 3, sec: '1B', fld: 66, arm: 68 },
      { id: 'martial03', name: 'Al Martin', pos: 'DH', bats: 'L', age: 35, pa: 258, h: 58, double: 12, triple: 2, hr: 4, bb: 21, so: 50, hbp: 2, sb: 4, cs: 2, sec: 'LF' },
    ],
    bench: [
      { id: 'grievbe01', name: 'Ben Grieve', pos: 'DH', bats: 'L', age: 27, pa: 205, h: 43, double: 10, triple: 0, hr: 5, bb: 28, so: 45, hbp: 4, sb: 2, cs: 0, sec: 'RF' },
      { id: 'sandbja01', name: 'Jared Sandberg', pos: '3B', bats: 'R', age: 25, pa: 156, h: 31, double: 9, triple: 1, hr: 6, bb: 15, so: 53, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 71 },
      { id: 'perezan01', name: 'Antonio Perez', pos: '2B', bats: 'R', age: 23, pa: 147, h: 31, double: 6, triple: 1, hr: 2, bb: 18, so: 34, hbp: 1, sb: 4, cs: 1, sec: 'SS', fld: 48, rk: true },
      { id: 'valenja01', name: 'Javier Valentin', pos: 'C', bats: 'S', age: 27, pa: 142, h: 31, double: 7, triple: 1, hr: 3, bb: 5, so: 30, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 78, arm: 70 },
      { id: 'ordonre01', name: 'Rey Ordonez', pos: 'SS', bats: 'R', age: 32, pa: 124, h: 30, double: 7, triple: 1, hr: 1, bb: 6, so: 11, hbp: 1, sb: 0, cs: 1, sec: '2B', fld: 81 },
    ],
    reserveBatters: [
      { id: 'easleda01', name: 'Damion Easley', pos: '3B', bats: 'R', age: 33, pa: 110, h: 22, double: 4, triple: 1, hr: 2, bb: 7, so: 15, hbp: 2, sb: 1, cs: 1, sec: '2B', fld: 53 },
      { id: 'tynerja01', name: 'Jason Tyner', pos: 'RF', bats: 'L', age: 26, pa: 102, h: 24, double: 3, triple: 1, hr: 0, bb: 6, so: 11, hbp: 0, sb: 5, cs: 1, sec: 'LF', fld: 68, arm: 66 },
      { id: 'shumpte01', name: 'Terry Shumpert', pos: 'DH', bats: 'R', age: 36, pa: 99, h: 21, double: 5, triple: 1, hr: 2, bb: 8, so: 16, hbp: 2, sb: 2, cs: 0, sec: '3B' },
      { id: 'laforpe01', name: 'Pete LaForest', pos: 'DH', bats: 'L', age: 25, pa: 51, h: 8, double: 2, triple: 0, hr: 0, bb: 1, so: 14, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'trubych01', name: 'Chris Truby', pos: '3B', bats: 'R', age: 29, pa: 49, h: 10, double: 2, triple: 0, hr: 1, bb: 2, so: 12, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'zambrvi01', name: 'Victor Zambrano', role: 'SP', throws: 'R', age: 27, g: 34, gs: 28, outs: 565, h: 172, hr: 22, bb: 105, so: 133, hbp: 16, er: 94, w: 12, l: 10, sv: 0, fld: 61 },
      { id: 'gonzaje01', name: 'Geremi Gonzalez', role: 'SP', throws: 'R', age: 28, g: 25, gs: 25, outs: 469, h: 131, hr: 18, bb: 69, so: 97, hbp: 12, er: 68, w: 6, l: 11, sv: 0, fld: 66 },
      { id: 'kennejo04', name: 'Joe Kennedy', role: 'SP', throws: 'L', age: 24, g: 32, gs: 22, outs: 401, h: 157, hr: 18, bb: 43, so: 80, hbp: 10, er: 80, w: 3, l: 12, sv: 1, fld: 76 },
      { id: 'sosajo02', name: 'Jorge Sosa', role: 'SP', throws: 'R', age: 25, g: 29, gs: 19, outs: 386, h: 130, hr: 16, bb: 64, so: 69, hbp: 4, er: 71, w: 5, l: 12, sv: 0 },
      { id: 'bellro01', name: 'Rob Bell', role: 'SP', throws: 'R', age: 26, g: 19, gs: 18, outs: 303, h: 110, hr: 17, bb: 39, so: 57, hbp: 4, er: 66, w: 5, l: 4, sv: 0 },
      { id: 'cartela02', name: 'Lance Carter', role: 'CL', throws: 'R', age: 28, g: 62, gs: 0, outs: 237, h: 71, hr: 11, bb: 19, so: 48, hbp: 3, er: 34, w: 7, l: 5, sv: 26, rk: true },
      { id: 'harpetr01', name: 'Travis Harper', role: 'RP', throws: 'R', age: 27, g: 61, gs: 0, outs: 279, h: 94, hr: 12, bb: 30, so: 62, hbp: 7, er: 45, w: 4, l: 8, sv: 1 },
      { id: 'colomje01', name: 'Jesus Colome', role: 'RP', throws: 'R', age: 25, g: 54, gs: 0, outs: 222, h: 73, hr: 10, bb: 47, so: 62, hbp: 3, er: 42, w: 3, l: 7, sv: 2 },
      { id: 'levinal01', name: 'Al Levine', role: 'RP', throws: 'R', age: 35, g: 54, gs: 0, outs: 213, h: 67, hr: 8, bb: 31, so: 36, hbp: 3, er: 25, w: 3, l: 6, sv: 1 },
      { id: 'backebr01', name: 'Brandon Backe', role: 'RP', throws: 'R', age: 25, g: 28, gs: 0, outs: 134, h: 41, hr: 7, bb: 25, so: 33, hbp: 3, er: 28, w: 1, l: 1, sv: 0, rk: true },
      { id: 'parrist01', name: 'Steve Parris', role: 'RP', throws: 'R', age: 35, g: 10, gs: 7, outs: 131, h: 56, hr: 9, bb: 17, so: 21, hbp: 1, er: 27, w: 0, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'brazede01', name: 'Dewon Brazelton', role: 'SP', throws: 'R', age: 23, g: 10, gs: 10, outs: 145, h: 55, hr: 9, bb: 23, so: 23, hbp: 4, er: 36, w: 1, l: 6, sv: 0, rk: true },
      { id: 'bierbni01', name: 'Nick Bierbrodt', role: 'RP', throws: 'L', age: 25, g: 18, gs: 5, outs: 130, h: 61, hr: 9, bb: 25, so: 34, hbp: 4, er: 39, w: 0, l: 2, sv: 0 },
      { id: 'gaudich01', name: 'Chad Gaudin', role: 'RP', throws: 'R', age: 20, g: 15, gs: 3, outs: 120, h: 37, hr: 4, bb: 16, so: 23, hbp: 1, er: 16, w: 2, l: 0, sv: 0, rk: true },
      { id: 'reyesca01', name: 'Carlos Reyes', role: 'RP', throws: 'R', age: 34, g: 10, gs: 3, outs: 119, h: 40, hr: 10, bb: 5, so: 13, hbp: 2, er: 23, w: 0, l: 3, sv: 0 },
      { id: 'mccluse01', name: 'Seth McClung', role: 'RP', throws: 'R', age: 22, g: 12, gs: 5, outs: 116, h: 33, hr: 6, bb: 25, so: 25, hbp: 3, er: 23, w: 4, l: 1, sv: 0, rk: true },
    ],
  },
  // TOR (TOR 2003)
  {
    franchiseId: 'TOR',
    season: 2003,
    batters: [
      { id: 'myersgr01', name: 'Greg Myers', pos: 'C', bats: 'L', age: 37, pa: 369, h: 91, double: 16, triple: 0, hr: 15, bb: 42, so: 64, hbp: 0, sb: 0, cs: 2, fld: 68, arm: 61 },
      { id: 'delgaca01', name: 'Carlos Delgado', pos: '1B', bats: 'L', age: 31, pa: 705, h: 165, double: 37, triple: 1, hr: 40, bb: 111, so: 138, hbp: 17, sb: 1, cs: 0, sec: 'LF', fld: 72 },
      { id: 'hudsoor01', name: 'Orlando Hudson', pos: '2B', bats: 'S', age: 25, pa: 521, h: 128, double: 22, triple: 7, hr: 9, bb: 37, so: 83, hbp: 5, sb: 4, cs: 4, sec: 'SS', fld: 86 },
      { id: 'hinsker01', name: 'Eric Hinske', pos: '3B', bats: 'L', age: 25, pa: 514, h: 116, double: 38, triple: 2, hr: 15, bb: 60, so: 106, hbp: 1, sb: 11, cs: 1, sec: '1B', fld: 60 },
      { id: 'woodwch01', name: 'Chris Woodward', pos: 'SS', bats: 'R', age: 27, pa: 386, h: 92, double: 19, triple: 3, hr: 10, bb: 27, so: 75, hbp: 3, sb: 2, cs: 1, sec: '2B', fld: 74 },
      { id: 'stewash01', name: 'Shannon Stewart', pos: 'LF', bats: 'R', age: 29, pa: 644, h: 178, double: 41, triple: 4, hr: 12, bb: 51, so: 64, hbp: 8, sb: 11, cs: 5, sec: 'CF', fld: 79, arm: 68 },
      { id: 'wellsve01', name: 'Vernon Wells', pos: 'CF', bats: 'R', age: 24, pa: 735, h: 206, double: 45, triple: 5, hr: 30, bb: 38, so: 87, hbp: 6, sb: 7, cs: 2, sec: 'RF', fld: 68, arm: 63 },
      { id: 'johnsre02', name: 'Reed Johnson', pos: 'RF', bats: 'R', age: 26, pa: 457, h: 121, double: 21, triple: 2, hr: 10, bb: 20, so: 67, hbp: 20, sb: 5, cs: 3, sec: 'LF', fld: 58, arm: 69, rk: true },
      { id: 'catalfr01', name: 'Frank Catalanotto', pos: 'DH', bats: 'L', age: 29, pa: 535, h: 144, double: 34, triple: 7, hr: 11, bb: 40, so: 60, hbp: 9, sb: 8, cs: 4, sec: 'LF', fld: 64, arm: 66 },
    ],
    bench: [
      { id: 'phelpjo01', name: 'Josh Phelps', pos: 'DH', bats: 'R', age: 25, pa: 453, h: 112, double: 22, triple: 1, hr: 21, bb: 37, so: 120, hbp: 13, sb: 1, cs: 1, sec: '1B' },
      { id: 'bordimi01', name: 'Mike Bordick', pos: 'SS', bats: 'R', age: 37, pa: 379, h: 87, double: 18, triple: 2, hr: 6, bb: 32, so: 58, hbp: 3, sb: 5, cs: 2, sec: '2B', fld: 78 },
      { id: 'wilsoto02', name: 'Tom Wilson', pos: 'C', bats: 'R', age: 32, pa: 287, h: 65, double: 15, triple: 0, hr: 6, bb: 27, so: 78, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 66, arm: 61 },
      { id: 'bergda01', name: 'Dave Berg', pos: '2B', bats: 'R', age: 32, pa: 174, h: 41, double: 9, triple: 1, hr: 3, bb: 11, so: 28, hbp: 1, sb: 0, cs: 1, sec: 'SS', fld: 62 },
      { id: 'cashke01', name: 'Kevin Cash', pos: 'C', bats: 'R', age: 25, pa: 117, h: 15, double: 3, triple: 0, hr: 1, bb: 4, so: 23, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 75, arm: 70, rk: true },
    ],
    reserveBatters: [
      { id: 'clarkho02', name: 'Howie Clark', pos: '3B', bats: 'L', age: 29, pa: 77, h: 24, double: 4, triple: 1, hr: 0, bb: 3, so: 7, hbp: 2, sb: 0, cs: 1, sec: '1B', rk: true },
      { id: 'werthja01', name: 'Jayson Werth', pos: 'RF', bats: 'R', age: 24, pa: 51, h: 11, double: 3, triple: 0, hr: 1, bb: 4, so: 17, hbp: 0, sb: 1, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'hallaro01', name: 'Roy Halladay', role: 'SP', throws: 'R', age: 26, g: 36, gs: 36, outs: 798, h: 248, hr: 19, bb: 47, so: 199, hbp: 8, er: 92, w: 22, l: 7, sv: 0, fld: 80 },
      { id: 'lidleco01', name: 'Cory Lidle', role: 'SP', throws: 'R', age: 31, g: 31, gs: 31, outs: 578, h: 206, hr: 22, bb: 52, so: 116, hbp: 6, er: 105, w: 12, l: 15, sv: 0, fld: 77 },
      { id: 'escobke01', name: 'Kelvim Escobar', role: 'SP', throws: 'R', age: 27, g: 41, gs: 26, outs: 541, h: 179, hr: 16, bb: 83, so: 170, hbp: 9, er: 84, w: 13, l: 9, sv: 4, fld: 67 },
      { id: 'hendrma01', name: 'Mark Hendrickson', role: 'SP', throws: 'L', age: 29, g: 30, gs: 30, outs: 475, h: 197, hr: 22, bb: 42, so: 79, hbp: 1, er: 91, w: 9, l: 9, sv: 0, fld: 67, rk: true },
      { id: 'davisdo02', name: 'Doug Davis', role: 'SP', throws: 'L', age: 27, g: 21, gs: 20, outs: 328, h: 125, hr: 13, bb: 46, so: 62, hbp: 2, er: 53, w: 7, l: 8, sv: 0 },
      { id: 'lopezaq01', name: 'Aquilino Lopez', role: 'CL', throws: 'R', age: 28, g: 72, gs: 0, outs: 221, h: 58, hr: 5, bb: 34, so: 64, hbp: 5, er: 28, w: 1, l: 3, sv: 14, rk: true },
      { id: 'sturtta01', name: 'Tanyon Sturtze', role: 'RP', throws: 'R', age: 32, g: 40, gs: 8, outs: 268, h: 107, hr: 13, bb: 39, so: 55, hbp: 5, er: 53, w: 7, l: 6, sv: 0 },
      { id: 'towerjo01', name: 'Josh Towers', role: 'RP', throws: 'R', age: 26, g: 14, gs: 8, outs: 193, h: 73, hr: 14, bb: 8, so: 34, hbp: 3, er: 35, w: 8, l: 1, sv: 1 },
      { id: 'walkepe01', name: 'Pete Walker', role: 'RP', throws: 'R', age: 34, g: 23, gs: 7, outs: 166, h: 59, hr: 9, bb: 22, so: 31, hbp: 1, er: 28, w: 2, l: 2, sv: 0 },
      { id: 'kershja01', name: 'Jason Kershner', role: 'RP', throws: 'L', age: 26, g: 40, gs: 0, outs: 162, h: 43, hr: 5, bb: 18, so: 33, hbp: 3, er: 21, w: 3, l: 3, sv: 0, rk: true },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 30, g: 79, gs: 0, outs: 158, h: 46, hr: 7, bb: 28, so: 44, hbp: 5, er: 27, w: 2, l: 2, sv: 3 },
    ],
    reservePitchers: [
      { id: 'politcl01', name: 'Cliff Politte', role: 'RP', throws: 'R', age: 29, g: 54, gs: 0, outs: 148, h: 46, hr: 7, bb: 18, so: 45, hbp: 1, er: 25, w: 1, l: 5, sv: 12 },
      { id: 'tamje01', name: 'Jeff Tam', role: 'RP', throws: 'R', age: 32, g: 44, gs: 0, outs: 134, h: 57, hr: 4, bb: 21, so: 24, hbp: 2, er: 25, w: 0, l: 4, sv: 1 },
      { id: 'reichda01', name: 'Dan Reichert', role: 'RP', throws: 'R', age: 26, g: 15, gs: 0, outs: 49, h: 22, hr: 2, bb: 8, so: 11, hbp: 1, er: 11, w: 0, l: 0, sv: 0 },
      { id: 'thurmco01', name: 'Corey Thurman', role: 'RP', throws: 'R', age: 24, g: 6, gs: 3, outs: 46, h: 17, hr: 3, bb: 10, so: 13, hbp: 0, er: 9, w: 1, l: 1, sv: 0 },
      { id: 'creekdo01', name: 'Doug Creek', role: 'RP', throws: 'L', age: 34, g: 21, gs: 0, outs: 41, h: 14, hr: 2, bb: 10, so: 14, hbp: 2, er: 8, w: 0, l: 0, sv: 0 },
    ],
  },
  // CWS (CHA 2003)
  {
    franchiseId: 'CWS',
    season: 2003,
    batters: [
      { id: 'olivomi01', name: 'Miguel Olivo', pos: 'C', bats: 'R', age: 24, pa: 346, h: 75, double: 19, triple: 1, hr: 6, bb: 20, so: 80, hbp: 4, sb: 6, cs: 4, sec: '1B', fld: 67, arm: 75, rk: true },
      { id: 'konerpa01', name: 'Paul Konerko', pos: '1B', bats: 'R', age: 27, pa: 495, h: 120, double: 22, triple: 0, hr: 20, bb: 40, so: 56, hbp: 6, sb: 0, cs: 0, sec: '3B', fld: 78 },
      { id: 'milesaa01', name: 'Aaron Miles', pos: '2B', bats: 'S', age: 26, pa: 12, h: 4, double: 3, triple: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
      { id: 'credejo01', name: 'Joe Crede', pos: '3B', bats: 'R', age: 25, pa: 580, h: 143, double: 30, triple: 2, hr: 21, bb: 30, so: 83, hbp: 5, sb: 1, cs: 2, sec: '1B', fld: 67 },
      { id: 'valenjo03', name: 'Jose Valentin', pos: 'SS', bats: 'S', age: 33, pa: 569, h: 123, double: 27, triple: 3, hr: 28, bb: 52, so: 114, hbp: 3, sb: 7, cs: 4, sec: '3B', fld: 73 },
      { id: 'leeca01', name: 'Carlos Lee', pos: 'LF', bats: 'R', age: 27, pa: 671, h: 170, double: 34, triple: 2, hr: 30, bb: 53, so: 90, hbp: 4, sb: 13, cs: 5, sec: 'RF', fld: 72, arm: 68 },
      { id: 'rowanaa01', name: 'Aaron Rowand', pos: 'CF', bats: 'R', age: 25, pa: 170, h: 42, double: 8, triple: 1, hr: 5, bb: 8, so: 26, hbp: 3, sb: 1, cs: 0, sec: 'LF', fld: 72, arm: 83 },
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 29, pa: 674, h: 191, double: 46, triple: 2, hr: 33, bb: 58, so: 75, hbp: 7, sb: 11, cs: 5, sec: 'CF', fld: 74, arm: 67 },
      { id: 'thomafr04', name: 'Frank Thomas', pos: 'DH', bats: 'R', age: 35, pa: 662, h: 143, double: 33, triple: 0, hr: 37, bb: 97, so: 117, hbp: 10, sb: 1, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'graffto01', name: 'Tony Graffanino', pos: 'SS', bats: 'R', age: 31, pa: 281, h: 66, double: 14, triple: 3, hr: 6, bb: 24, so: 40, hbp: 3, sb: 6, cs: 1, sec: '2B', fld: 73 },
      { id: 'daubabr01', name: 'Brian Daubach', pos: '1B', bats: 'L', age: 31, pa: 219, h: 48, double: 11, triple: 1, hr: 8, bb: 26, so: 53, hbp: 2, sb: 1, cs: 0, sec: 'LF', fld: 74 },
      { id: 'alomasa02', name: 'Sandy Alomar', pos: 'C', bats: 'R', age: 37, pa: 204, h: 52, double: 10, triple: 0, hr: 5, bb: 6, so: 19, hbp: 1, sb: 0, cs: 0, fld: 75, arm: 64 },
      { id: 'harriwi01', name: 'Willie Harris', pos: 'CF', bats: 'L', age: 25, pa: 150, h: 29, double: 3, triple: 1, hr: 1, bb: 9, so: 24, hbp: 0, sb: 9, cs: 1, sec: 'LF', fld: 76, arm: 79 },
      { id: 'riosar01', name: 'Armando Rios', pos: 'CF', bats: 'L', age: 31, pa: 112, h: 25, double: 5, triple: 0, hr: 2, bb: 8, so: 19, hbp: 0, sb: 0, cs: 1, sec: 'RF', fld: 63, arm: 68 },
    ],
    reserveBatters: [
      { id: 'borchjo01', name: 'Joe Borchard', pos: 'CF', bats: 'S', age: 24, pa: 57, h: 10, double: 1, triple: 0, hr: 2, bb: 4, so: 19, hbp: 0, sb: 0, cs: 1, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'colonba01', name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 30, g: 34, gs: 34, outs: 726, h: 225, hr: 26, bb: 73, so: 173, hbp: 4, er: 96, w: 15, l: 13, sv: 0, fld: 58 },
      { id: 'buehrma01', name: 'Mark Buehrle', role: 'SP', throws: 'L', age: 24, g: 35, gs: 35, outs: 691, h: 238, hr: 24, bb: 60, so: 127, hbp: 5, er: 99, w: 14, l: 14, sv: 0, fld: 76 },
      { id: 'loaizes01', name: 'Esteban Loaiza', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 679, h: 225, hr: 21, bb: 53, so: 168, hbp: 9, er: 96, w: 21, l: 9, sv: 0, fld: 71 },
      { id: 'garlajo01', name: 'Jon Garland', role: 'SP', throws: 'R', age: 23, g: 32, gs: 32, outs: 575, h: 187, hr: 26, bb: 78, so: 107, hbp: 6, er: 94, w: 12, l: 13, sv: 0, fld: 77 },
      { id: 'wrighda02', name: 'Dan Wright', role: 'SP', throws: 'R', age: 25, g: 20, gs: 15, outs: 259, h: 92, hr: 15, bb: 39, so: 55, hbp: 3, er: 55, w: 1, l: 7, sv: 1 },
      { id: 'gordoto01', name: 'Tom Gordon', role: 'CL', throws: 'R', age: 35, g: 66, gs: 0, outs: 222, h: 60, hr: 5, bb: 29, so: 91, hbp: 3, er: 27, w: 7, l: 6, sv: 12 },
      { id: 'marteda01', name: 'Damaso Marte', role: 'RP', throws: 'L', age: 28, g: 71, gs: 0, outs: 239, h: 54, hr: 5, bb: 30, so: 89, hbp: 4, er: 20, w: 4, l: 2, sv: 11 },
      { id: 'whiteri01', name: 'Rick White', role: 'RP', throws: 'R', age: 34, g: 49, gs: 0, outs: 201, h: 72, hr: 9, bb: 21, so: 51, hbp: 3, er: 38, w: 1, l: 2, sv: 1 },
      { id: 'glovega01', name: 'Gary Glover', role: 'RP', throws: 'R', age: 26, g: 42, gs: 0, outs: 188, h: 69, hr: 9, bb: 23, so: 36, hbp: 3, er: 36, w: 2, l: 0, sv: 0 },
      { id: 'kochbi01', name: 'Billy Koch', role: 'RP', throws: 'R', age: 28, g: 55, gs: 0, outs: 159, h: 52, hr: 7, bb: 28, so: 49, hbp: 2, er: 27, w: 5, l: 5, sv: 11 },
      { id: 'wunscke01', name: 'Kelly Wunsch', role: 'RP', throws: 'L', age: 30, g: 43, gs: 0, outs: 108, h: 23, hr: 2, bb: 22, so: 29, hbp: 7, er: 14, w: 0, l: 0, sv: 0 },
    ],
    reservePitchers: [
      { id: 'stewajo02', name: 'Josh Stewart', role: 'RP', throws: 'L', age: 24, g: 5, gs: 5, outs: 77, h: 28, hr: 4, bb: 16, so: 13, hbp: 0, er: 17, w: 1, l: 2, sv: 0, rk: true },
      { id: 'sandeda01', name: 'David Sanders', role: 'RP', throws: 'L', age: 23, g: 20, gs: 0, outs: 66, h: 25, hr: 5, bb: 11, so: 14, hbp: 1, er: 15, w: 0, l: 0, sv: 0, rk: true },
      { id: 'porzimi01', name: 'Mike Porzio', role: 'RP', throws: 'L', age: 30, g: 3, gs: 3, outs: 42, h: 15, hr: 3, bb: 5, so: 10, hbp: 1, er: 8, w: 1, l: 1, sv: 0 },
      { id: 'cottsne01', name: 'Neal Cotts', role: 'RP', throws: 'L', age: 23, g: 4, gs: 4, outs: 40, h: 15, hr: 1, bb: 17, so: 10, hbp: 0, er: 12, w: 1, l: 1, sv: 0, rk: true },
    ],
  },
  // CLE (CLE 2003)
  {
    franchiseId: 'CLE',
    season: 2003,
    batters: [
      { id: 'bardjo01', name: 'Josh Bard', pos: 'C', bats: 'S', age: 25, pa: 329, h: 73, double: 14, triple: 1, hr: 8, bb: 21, so: 52, hbp: 0, sb: 0, cs: 2, sec: '1B', fld: 71, arm: 75, rk: true },
      { id: 'brousbe01', name: 'Ben Broussard', pos: '1B', bats: 'L', age: 26, pa: 429, h: 96, double: 20, triple: 3, hr: 16, bb: 31, so: 77, hbp: 5, sb: 4, cs: 2, sec: 'LF', fld: 67, rk: true },
      { id: 'phillbr01', name: 'Brandon Phillips', pos: '2B', bats: 'R', age: 22, pa: 393, h: 78, double: 19, triple: 2, hr: 6, bb: 15, so: 76, hbp: 3, sb: 4, cs: 5, sec: 'SS', fld: 77, rk: true },
      { id: 'blakeca01', name: 'Casey Blake', pos: '3B', bats: 'R', age: 29, pa: 621, h: 142, double: 34, triple: 0, hr: 17, bb: 39, so: 113, hbp: 10, sb: 8, cs: 9, sec: '1B', fld: 74, rk: true },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 36, pa: 285, h: 65, double: 13, triple: 2, hr: 4, bb: 26, so: 26, hbp: 2, sb: 7, cs: 4, fld: 87 },
      { id: 'spencsh01', name: 'Shane Spencer', pos: 'LF', bats: 'R', age: 31, pa: 448, h: 99, double: 20, triple: 1, hr: 11, bb: 42, so: 89, hbp: 4, sb: 2, cs: 1, sec: 'RF', fld: 72, arm: 66 },
      { id: 'bradlmi01', name: 'Milton Bradley', pos: 'CF', bats: 'S', age: 25, pa: 451, h: 112, double: 30, triple: 3, hr: 9, bb: 54, so: 77, hbp: 3, sb: 14, cs: 6, sec: 'LF', fld: 74, arm: 72 },
      { id: 'gerutjo01', name: 'Jody Gerut', pos: 'RF', bats: 'L', age: 25, pa: 525, h: 134, double: 33, triple: 2, hr: 22, bb: 35, so: 70, hbp: 7, sb: 4, cs: 5, sec: 'LF', fld: 74, arm: 73, rk: true },
      { id: 'crispco01', name: 'Coco Crisp', pos: 'DH', bats: 'S', age: 23, pa: 447, h: 109, double: 17, triple: 6, hr: 3, bb: 25, so: 52, hbp: 0, sb: 15, cs: 8, sec: 'LF', fld: 69, arm: 70 },
    ],
    bench: [
      { id: 'lawtoma02', name: 'Matt Lawton', pos: 'LF', bats: 'L', age: 31, pa: 429, h: 93, double: 19, triple: 1, hr: 13, bb: 51, so: 43, hbp: 7, sb: 11, cs: 5, sec: 'RF', fld: 69, arm: 68 },
      { id: 'hafnetr01', name: 'Travis Hafner', pos: 'DH', bats: 'L', age: 26, pa: 324, h: 73, double: 19, triple: 3, hr: 13, bb: 24, so: 80, hbp: 9, sb: 2, cs: 1, sec: '1B', rk: true },
      { id: 'peraljh01', name: 'Jhonny Peralta', pos: 'SS', bats: 'R', age: 21, pa: 270, h: 55, double: 10, triple: 1, hr: 4, bb: 20, so: 65, hbp: 4, sb: 1, cs: 3, sec: '2B', fld: 74, rk: true },
      { id: 'mcdonjo03', name: 'John McDonald', pos: '2B', bats: 'R', age: 28, pa: 233, h: 49, double: 9, triple: 2, hr: 1, bb: 10, so: 36, hbp: 3, sb: 3, cs: 2, sec: 'SS', fld: 65 },
      { id: 'burksel01', name: 'Ellis Burks', pos: 'DH', bats: 'R', age: 38, pa: 228, h: 58, double: 12, triple: 0, hr: 11, bb: 23, so: 43, hbp: 3, sb: 1, cs: 1, sec: 'RF' },
    ],
    reserveBatters: [
      { id: 'lakerti01', name: 'Tim Laker', pos: 'C', bats: 'R', age: 33, pa: 176, h: 38, double: 10, triple: 0, hr: 3, bb: 10, so: 38, hbp: 0, sb: 2, cs: 2, sec: '1B', fld: 64, arm: 72 },
      { id: 'ludwiry01', name: 'Ryan Ludwick', pos: 'RF', bats: 'R', age: 24, pa: 175, h: 39, double: 9, triple: 1, hr: 6, bb: 12, so: 48, hbp: 0, sb: 2, cs: 0, sec: 'CF', fld: 78, arm: 67, rk: true },
      { id: 'martivi01', name: 'Victor Martinez', pos: 'C', bats: 'S', age: 24, pa: 174, h: 46, double: 4, triple: 0, hr: 1, bb: 13, so: 20, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 72, arm: 71, rk: true },
      { id: 'escobal01', name: 'Alex Escobar', pos: 'RF', bats: 'R', age: 24, pa: 108, h: 26, double: 2, triple: 0, hr: 5, bb: 7, so: 34, hbp: 1, sb: 1, cs: 0, sec: 'LF', fld: 78, arm: 79, rk: true },
      { id: 'santoan01', name: 'Angel Santos', pos: '2B', bats: 'S', age: 23, pa: 80, h: 16, double: 3, triple: 1, hr: 3, bb: 3, so: 19, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 69, rk: true },
    ],
    pitchers: [
      { id: 'anderbr02', name: 'Brian Anderson', role: 'SP', throws: 'L', age: 31, g: 32, gs: 31, outs: 593, h: 216, hr: 29, bb: 42, so: 91, hbp: 3, er: 93, w: 14, l: 11, sv: 0, fld: 73 },
      { id: 'sabatcc01', name: 'CC Sabathia', role: 'SP', throws: 'L', age: 22, g: 30, gs: 30, outs: 593, h: 184, hr: 18, bb: 77, so: 147, hbp: 4, er: 87, w: 13, l: 9, sv: 0, fld: 60 },
      { id: 'davisja02', name: 'Jason Davis', role: 'SP', throws: 'R', age: 23, g: 27, gs: 27, outs: 496, h: 171, hr: 24, bb: 47, so: 87, hbp: 8, er: 83, w: 8, l: 11, sv: 0, fld: 66, rk: true },
      { id: 'westbja01', name: 'Jake Westbrook', role: 'SP', throws: 'R', age: 25, g: 34, gs: 22, outs: 399, h: 147, hr: 11, bb: 52, so: 64, hbp: 10, er: 70, w: 7, l: 10, sv: 0 },
      { id: 'trabebi01', name: 'Billy Traber', role: 'SP', throws: 'L', age: 23, g: 33, gs: 18, outs: 335, h: 132, hr: 15, bb: 40, so: 88, hbp: 5, er: 65, w: 6, l: 9, sv: 0, rk: true },
      { id: 'baezda01', name: 'Danys Baez', role: 'CL', throws: 'R', age: 25, g: 73, gs: 0, outs: 227, h: 66, hr: 7, bb: 30, so: 61, hbp: 4, er: 33, w: 2, l: 9, sv: 25 },
      { id: 'mulhote01', name: 'Terry Mulholland', role: 'RP', throws: 'L', age: 40, g: 45, gs: 3, outs: 297, h: 120, hr: 18, bb: 32, so: 47, hbp: 6, er: 56, w: 3, l: 4, sv: 0 },
      { id: 'riskeda01', name: 'David Riske', role: 'RP', throws: 'R', age: 26, g: 68, gs: 0, outs: 224, h: 55, hr: 9, bb: 29, so: 81, hbp: 4, er: 24, w: 2, l: 2, sv: 8 },
      { id: 'boydja02', name: 'Jason Boyd', role: 'RP', throws: 'R', age: 30, g: 44, gs: 0, outs: 157, h: 43, hr: 6, bb: 26, so: 31, hbp: 2, er: 30, w: 3, l: 1, sv: 0 },
      { id: 'leecl02', name: 'Cliff Lee', role: 'RP', throws: 'L', age: 24, g: 9, gs: 9, outs: 157, h: 40, hr: 6, bb: 22, so: 42, hbp: 2, er: 20, w: 3, l: 3, sv: 0, rk: true },
      { id: 'stanfja01', name: 'Jason Stanford', role: 'RP', throws: 'L', age: 26, g: 13, gs: 8, outs: 150, h: 48, hr: 5, bb: 16, so: 30, hbp: 1, er: 20, w: 1, l: 3, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'rodriri03', name: 'Ricardo Rodriguez', role: 'SP', throws: 'R', age: 25, g: 15, gs: 15, outs: 245, h: 86, hr: 14, bb: 30, so: 42, hbp: 6, er: 51, w: 3, l: 9, sv: 0, rk: true },
      { id: 'cressja01', name: 'Jack Cressend', role: 'RP', throws: 'R', age: 28, g: 33, gs: 0, outs: 129, h: 41, hr: 3, bb: 13, so: 28, hbp: 1, er: 17, w: 2, l: 1, sv: 0 },
      { id: 'betanra01', name: 'Rafael Betancourt', role: 'RP', throws: 'R', age: 28, g: 33, gs: 0, outs: 114, h: 27, hr: 5, bb: 13, so: 36, hbp: 1, er: 9, w: 2, l: 2, sv: 1, rk: true },
      { id: 'santijo03', name: 'Jose Santiago', role: 'RP', throws: 'R', age: 28, g: 25, gs: 0, outs: 95, h: 38, hr: 3, bb: 11, so: 17, hbp: 1, er: 17, w: 1, l: 3, sv: 0 },
      { id: 'tallebr01', name: 'Brian Tallet', role: 'RP', throws: 'L', age: 25, g: 5, gs: 3, outs: 57, h: 21, hr: 1, bb: 8, so: 9, hbp: 1, er: 8, w: 0, l: 2, sv: 0, rk: true },
    ],
  },
  // DET (DET 2003)
  {
    franchiseId: 'DET',
    season: 2003,
    batters: [
      { id: 'ingebr01', name: 'Brandon Inge', pos: 'C', bats: 'R', age: 26, pa: 366, h: 67, double: 16, triple: 3, hr: 7, bb: 24, so: 88, hbp: 4, sb: 3, cs: 4, sec: '1B', fld: 74, arm: 75 },
      { id: 'penaca01', name: 'Carlos Pena', pos: '1B', bats: 'L', age: 25, pa: 516, h: 112, double: 21, triple: 6, hr: 20, bb: 52, so: 125, hbp: 5, sb: 3, cs: 4, sec: '3B', fld: 70 },
      { id: 'morriwa02', name: 'Warren Morris', pos: '2B', bats: 'L', age: 29, pa: 377, h: 91, double: 14, triple: 2, hr: 6, bb: 22, so: 41, hbp: 2, sb: 4, cs: 3, sec: 'SS', fld: 83 },
      { id: 'haltesh01', name: 'Shane Halter', pos: '3B', bats: 'R', age: 33, pa: 393, h: 84, double: 14, triple: 4, hr: 10, bb: 30, so: 78, hbp: 2, sb: 1, cs: 3, sec: 'SS', fld: 89 },
      { id: 'santira01', name: 'Ramon Santiago', pos: 'SS', bats: 'S', age: 23, pa: 507, h: 102, double: 16, triple: 3, hr: 4, bb: 31, so: 74, hbp: 12, sb: 12, cs: 6, sec: '2B', fld: 79 },
      { id: 'monrocr01', name: 'Craig Monroe', pos: 'LF', bats: 'R', age: 26, pa: 458, h: 100, double: 18, triple: 1, hr: 23, bb: 27, so: 91, hbp: 2, sb: 4, cs: 3, sec: 'RF', fld: 74, arm: 73, rk: true },
      { id: 'sanchal03', name: 'Alex Sanchez', pos: 'CF', bats: 'L', age: 26, pa: 599, h: 158, double: 20, triple: 9, hr: 1, bb: 31, so: 78, hbp: 3, sb: 52, cs: 22, sec: 'LF', fld: 79, arm: 65 },
      { id: 'higgibo02', name: 'Bobby Higginson', pos: 'RF', bats: 'L', age: 32, pa: 538, h: 121, double: 19, triple: 4, hr: 13, bb: 56, so: 62, hbp: 4, sb: 11, cs: 8, sec: 'LF', fld: 74, arm: 65 },
      { id: 'youngdm01', name: 'Dmitri Young', pos: 'DH', bats: 'S', age: 29, pa: 635, h: 169, double: 34, triple: 5, hr: 27, bb: 51, so: 118, hbp: 9, sb: 4, cs: 2, sec: 'LF' },
    ],
    bench: [
      { id: 'munsoer01', name: 'Eric Munson', pos: '3B', bats: 'L', age: 25, pa: 357, h: 72, double: 8, triple: 0, hr: 17, bb: 34, so: 63, hbp: 1, sb: 3, cs: 0, sec: '1B', fld: 60 },
      { id: 'wittke01', name: 'Kevin Witt', pos: 'DH', bats: 'L', age: 27, pa: 289, h: 70, double: 9, triple: 0, hr: 10, bb: 15, so: 68, hbp: 1, sb: 1, cs: 1, sec: '1B', rk: true },
      { id: 'infanom01', name: 'Omar Infante', pos: 'SS', bats: 'R', age: 21, pa: 244, h: 54, double: 7, triple: 1, hr: 1, bb: 17, so: 36, hbp: 0, sb: 5, cs: 3, sec: '2B', fld: 91, rk: true },
      { id: 'torrean02', name: 'Andres Torres', pos: 'CF', bats: 'S', age: 25, pa: 185, h: 36, double: 4, triple: 3, hr: 1, bb: 11, so: 36, hbp: 1, sb: 5, cs: 5, sec: 'RF', fld: 70, arm: 78, rk: true },
      { id: 'walbema01', name: 'Matt Walbeck', pos: 'C', bats: 'S', age: 33, pa: 144, h: 27, double: 4, triple: 1, hr: 1, bb: 4, so: 25, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 61, arm: 65 },
    ],
    reserveBatters: [
      { id: 'kingsge01', name: 'Gene Kingsale', pos: 'CF', bats: 'S', age: 26, pa: 140, h: 31, double: 4, triple: 1, hr: 1, bb: 11, so: 22, hbp: 1, sb: 4, cs: 2, sec: 'RF', fld: 63, arm: 59 },
      { id: 'petribe01', name: 'Ben Petrick', pos: 'LF', bats: 'R', age: 26, pa: 131, h: 26, double: 6, triple: 1, hr: 5, bb: 11, so: 33, hbp: 1, sb: 0, cs: 1, sec: 'CF', fld: 78, arm: 80 },
      { id: 'palmede01', name: 'Dean Palmer', pos: 'DH', bats: 'R', age: 34, pa: 98, h: 15, double: 3, triple: 0, hr: 2, bb: 10, so: 26, hbp: 2, sb: 1, cs: 0, sec: '3B' },
      { id: 'hinchaj01', name: 'A. J. Hinch', pos: 'C', bats: 'R', age: 29, pa: 82, h: 16, double: 3, triple: 1, hr: 3, bb: 5, so: 15, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 64, arm: 54 },
      { id: 'klassda01', name: 'Danny Klassen', pos: '3B', bats: 'R', age: 27, pa: 78, h: 18, double: 3, triple: 1, hr: 1, bb: 4, so: 26, hbp: 0, sb: 0, cs: 1, sec: '2B' },
    ],
    pitchers: [
      { id: 'cornena01', name: 'Nate Cornejo', role: 'SP', throws: 'R', age: 23, g: 32, gs: 32, outs: 584, h: 237, hr: 20, bb: 63, so: 54, hbp: 4, er: 104, w: 6, l: 17, sv: 0, fld: 76 },
      { id: 'marotmi01', name: 'Mike Maroth', role: 'SP', throws: 'L', age: 25, g: 33, gs: 33, outs: 580, h: 225, hr: 27, bb: 52, so: 88, hbp: 7, er: 116, w: 9, l: 21, sv: 0, fld: 77 },
      { id: 'bondeje01', name: 'Jeremy Bonderman', role: 'SP', throws: 'R', age: 20, g: 33, gs: 28, outs: 486, h: 193, hr: 23, bb: 58, so: 108, hbp: 4, er: 100, w: 6, l: 19, sv: 0, fld: 76, rk: true },
      { id: 'bernead01', name: 'Adam Bernero', role: 'SP', throws: 'R', age: 26, g: 49, gs: 17, outs: 400, h: 146, hr: 20, bb: 49, so: 83, hbp: 8, er: 88, w: 1, l: 14, sv: 0, fld: 74 },
      { id: 'roneyma01', name: 'Matt Roney', role: 'SP', throws: 'R', age: 23, g: 45, gs: 11, outs: 302, h: 102, hr: 17, bb: 48, so: 47, hbp: 4, er: 61, w: 1, l: 9, sv: 0, rk: true },
      { id: 'germafr01', name: 'Franklyn German', role: 'CL', throws: 'R', age: 23, g: 45, gs: 0, outs: 134, h: 46, hr: 5, bb: 43, so: 42, hbp: 2, er: 28, w: 2, l: 4, sv: 5, rk: true },
      { id: 'sparkst01', name: 'Steve Sparks', role: 'RP', throws: 'R', age: 37, g: 51, gs: 0, outs: 321, h: 120, hr: 12, bb: 35, so: 54, hbp: 4, er: 57, w: 0, l: 6, sv: 2 },
      { id: 'ledezwi01', name: 'Wil Ledezma', role: 'RP', throws: 'L', age: 22, g: 34, gs: 8, outs: 252, h: 99, hr: 12, bb: 35, so: 49, hbp: 3, er: 54, w: 3, l: 7, sv: 0, rk: true },
      { id: 'spurlch01', name: 'Chris Spurling', role: 'RP', throws: 'R', age: 26, g: 66, gs: 0, outs: 231, h: 78, hr: 9, bb: 22, so: 38, hbp: 3, er: 40, w: 1, l: 3, sv: 3, rk: true },
      { id: 'walkeja01', name: 'Jamie Walker', role: 'RP', throws: 'L', age: 31, g: 78, gs: 0, outs: 195, h: 58, hr: 11, bb: 16, so: 50, hbp: 3, er: 25, w: 4, l: 3, sv: 3 },
      { id: 'roberna01', name: 'Nate Robertson', role: 'RP', throws: 'L', age: 25, g: 8, gs: 8, outs: 134, h: 57, hr: 7, bb: 22, so: 31, hbp: 1, er: 30, w: 1, l: 2, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'knottga01', name: 'Gary Knotts', role: 'SP', throws: 'R', age: 26, g: 20, gs: 18, outs: 286, h: 105, hr: 15, bb: 48, so: 56, hbp: 4, er: 62, w: 3, l: 8, sv: 0, rk: true },
      { id: 'mearsch01', name: 'Chris Mears', role: 'RP', throws: 'R', age: 25, g: 29, gs: 3, outs: 124, h: 50, hr: 5, bb: 11, so: 21, hbp: 3, er: 25, w: 1, l: 3, sv: 5, rk: true },
      { id: 'louxsh01', name: 'Shane Loux', role: 'RP', throws: 'R', age: 23, g: 11, gs: 4, outs: 91, h: 38, hr: 5, bb: 11, so: 10, hbp: 4, er: 26, w: 1, l: 1, sv: 0, rk: true },
      { id: 'rodnefe01', name: 'Fernando Rodney', role: 'RP', throws: 'R', age: 26, g: 27, gs: 0, outs: 89, h: 36, hr: 2, bb: 17, so: 28, hbp: 1, er: 20, w: 1, l: 3, sv: 3, rk: true },
      { id: 'anderma01', name: 'Matt Anderson', role: 'RP', throws: 'R', age: 26, g: 23, gs: 0, outs: 70, h: 26, hr: 3, bb: 9, so: 17, hbp: 1, er: 15, w: 0, l: 1, sv: 3 },
    ],
  },
  // KCR (KCA 2003)
  {
    franchiseId: 'KCR',
    season: 2003,
    batters: [
      { id: 'maynebr01', name: 'Brent Mayne', pos: 'C', bats: 'L', age: 35, pa: 414, h: 92, double: 14, triple: 1, hr: 5, bb: 34, so: 58, hbp: 2, sb: 2, cs: 3, fld: 73, arm: 71 },
      { id: 'harveke01', name: 'Ken Harvey', pos: '1B', bats: 'R', age: 25, pa: 524, h: 129, double: 30, triple: 0, hr: 13, bb: 29, so: 95, hbp: 5, sb: 2, cs: 3, sec: '3B', fld: 73, rk: true },
      { id: 'relafde01', name: 'Desi Relaford', pos: '2B', bats: 'S', age: 29, pa: 557, h: 131, double: 27, triple: 4, hr: 9, bb: 43, so: 76, hbp: 7, sb: 19, cs: 5, sec: 'SS', fld: 72 },
      { id: 'randajo01', name: 'Joe Randa', pos: '3B', bats: 'R', age: 33, pa: 566, h: 142, double: 32, triple: 2, hr: 13, bb: 41, so: 64, hbp: 7, sb: 2, cs: 1, sec: '2B', fld: 75 },
      { id: 'berroan01', name: 'Angel Berroa', pos: 'SS', bats: 'R', age: 25, pa: 635, h: 161, double: 30, triple: 7, hr: 15, bb: 31, so: 99, hbp: 17, sb: 21, cs: 4, sec: '2B', fld: 75 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: 'LF', bats: 'L', age: 31, pa: 671, h: 178, double: 36, triple: 6, hr: 23, bb: 51, so: 88, hbp: 3, sb: 7, cs: 4, sec: 'RF', fld: 73, arm: 72 },
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 26, pa: 602, h: 156, double: 25, triple: 9, hr: 25, bb: 63, so: 97, hbp: 3, sb: 34, cs: 4, sec: 'LF', fld: 80, arm: 75 },
      { id: 'guielaa01', name: 'Aaron Guiel', pos: 'RF', bats: 'L', age: 30, pa: 401, h: 94, double: 27, triple: 0, hr: 12, bb: 27, so: 72, hbp: 11, sb: 3, cs: 6, sec: 'LF', fld: 78, arm: 77 },
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: 'DH', bats: 'R', age: 29, pa: 463, h: 124, double: 24, triple: 1, hr: 19, bb: 56, so: 48, hbp: 3, sb: 6, cs: 3, sec: '1B' },
    ],
    bench: [
      { id: 'tuckemi01', name: 'Michael Tucker', pos: 'RF', bats: 'L', age: 32, pa: 438, h: 98, double: 20, triple: 5, hr: 11, bb: 42, so: 87, hbp: 2, sb: 13, cs: 8, sec: 'LF', fld: 72, arm: 73 },
      { id: 'febleca01', name: 'Carlos Febles', pos: '2B', bats: 'R', age: 27, pa: 219, h: 47, double: 7, triple: 1, hr: 2, bb: 18, so: 34, hbp: 4, sb: 7, cs: 2, sec: 'SS', fld: 63 },
      { id: 'difelmi01', name: 'Mike Difelice', pos: 'C', bats: 'R', age: 34, pa: 205, h: 44, double: 13, triple: 1, hr: 3, bb: 12, so: 38, hbp: 3, sb: 1, cs: 0, fld: 74, arm: 70 },
      { id: 'brownde02', name: 'Dee Brown', pos: 'LF', bats: 'L', age: 25, pa: 143, h: 31, double: 7, triple: 0, hr: 2, bb: 8, so: 35, hbp: 1, sb: 1, cs: 1, sec: 'RF', fld: 87, arm: 74 },
      { id: 'lopezme01', name: 'Mendy Lopez', pos: '1B', bats: 'R', age: 29, pa: 100, h: 25, double: 5, triple: 1, hr: 3, bb: 5, so: 30, hbp: 0, sb: 2, cs: 0, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'matosju01', name: 'Julius Matos', pos: '3B', bats: 'R', age: 28, pa: 59, h: 14, double: 1, triple: 0, hr: 1, bb: 2, so: 10, hbp: 0, sb: 1, cs: 0, sec: '2B' },
    ],
    pitchers: [
      { id: 'mayda02', name: 'Darrell May', role: 'SP', throws: 'L', age: 31, g: 35, gs: 32, outs: 630, h: 203, hr: 34, bb: 60, so: 123, hbp: 2, er: 97, w: 10, l: 8, sv: 0, fld: 60 },
      { id: 'affelje01', name: 'Jeremy Affeldt', role: 'SP', throws: 'L', age: 24, g: 36, gs: 18, outs: 378, h: 127, hr: 12, bb: 44, so: 99, hbp: 5, er: 57, w: 7, l: 6, sv: 4 },
      { id: 'georgch02', name: 'Chris George', role: 'SP', throws: 'L', age: 23, g: 18, gs: 18, outs: 281, h: 120, hr: 20, bb: 39, so: 41, hbp: 3, er: 70, w: 9, l: 6, sv: 0 },
      { id: 'hernaru03', name: 'Runelvys Hernandez', role: 'SP', throws: 'R', age: 25, g: 16, gs: 16, outs: 275, h: 91, hr: 9, bb: 34, so: 51, hbp: 4, er: 46, w: 7, l: 5, sv: 0 },
      { id: 'snydeky01', name: 'Kyle Snyder', role: 'SP', throws: 'R', age: 25, g: 15, gs: 15, outs: 256, h: 94, hr: 11, bb: 21, so: 39, hbp: 2, er: 49, w: 1, l: 6, sv: 0, rk: true },
      { id: 'macdomi01', name: 'Mike MacDougal', role: 'CL', throws: 'R', age: 26, g: 68, gs: 0, outs: 192, h: 63, hr: 4, bb: 33, so: 57, hbp: 7, er: 30, w: 3, l: 5, sv: 27, rk: true },
      { id: 'carradj01', name: 'D. J. Carrasco', role: 'RP', throws: 'R', age: 26, g: 50, gs: 2, outs: 241, h: 82, hr: 8, bb: 40, so: 57, hbp: 7, er: 43, w: 6, l: 5, sv: 2, rk: true },
      { id: 'grimsja01', name: 'Jason Grimsley', role: 'RP', throws: 'R', age: 35, g: 76, gs: 0, outs: 225, h: 81, hr: 6, bb: 37, so: 61, hbp: 3, er: 38, w: 2, l: 6, sv: 0 },
      { id: 'wilsokr01', name: 'Kris Wilson', role: 'RP', throws: 'R', age: 26, g: 29, gs: 4, outs: 218, h: 92, hr: 16, bb: 18, so: 42, hbp: 6, er: 45, w: 6, l: 3, sv: 0 },
      { id: 'gobblji01', name: 'Jimmy Gobble', role: 'RP', throws: 'L', age: 21, g: 9, gs: 9, outs: 158, h: 56, hr: 8, bb: 15, so: 31, hbp: 4, er: 27, w: 4, l: 5, sv: 0, rk: true },
      { id: 'asencmi01', name: 'Miguel Asencio', role: 'RP', throws: 'R', age: 22, g: 8, gs: 8, outs: 145, h: 53, hr: 6, bb: 23, so: 24, hbp: 2, er: 28, w: 2, l: 1, sv: 0 },
    ],
    reservePitchers: [
      { id: 'limajo01', name: 'Jose Lima', role: 'SP', throws: 'R', age: 30, g: 14, gs: 14, outs: 220, h: 85, hr: 11, bb: 22, so: 34, hbp: 4, er: 48, w: 8, l: 3, sv: 0 },
      { id: 'abbotpa01', name: 'Paul Abbott', role: 'RP', throws: 'R', age: 35, g: 10, gs: 8, outs: 143, h: 48, hr: 7, bb: 27, so: 34, hbp: 2, er: 30, w: 1, l: 2, sv: 0 },
      { id: 'lowese01', name: 'Sean Lowe', role: 'RP', throws: 'R', age: 32, g: 28, gs: 0, outs: 134, h: 53, hr: 6, bb: 19, so: 31, hbp: 3, er: 27, w: 1, l: 1, sv: 0 },
      { id: 'voylebr01', name: 'Brad Voyles', role: 'RP', throws: 'R', age: 26, g: 11, gs: 3, outs: 94, h: 42, hr: 6, bb: 20, so: 26, hbp: 2, er: 24, w: 0, l: 2, sv: 0, rk: true },
      { id: 'wrighja01', name: 'Jamey Wright', role: 'RP', throws: 'R', age: 28, g: 4, gs: 4, outs: 76, h: 24, hr: 3, bb: 13, so: 15, hbp: 2, er: 13, w: 1, l: 2, sv: 0 },
    ],
  },
  // MIN (MIN 2003)
  {
    franchiseId: 'MIN',
    season: 2003,
    batters: [
      { id: 'pierzaj01', name: 'A. J. Pierzynski', pos: 'C', bats: 'L', age: 26, pa: 533, h: 150, double: 36, triple: 4, hr: 9, bb: 21, so: 62, hbp: 13, sb: 2, cs: 3, sec: '1B', fld: 74, arm: 70 },
      { id: 'mientdo01', name: 'Doug Mientkiewicz', pos: '1B', bats: 'L', age: 29, pa: 574, h: 141, double: 35, triple: 1, hr: 11, bb: 73, so: 66, hbp: 6, sb: 3, cs: 2, sec: '3B', fld: 69 },
      { id: 'rivaslu01', name: 'Luis Rivas', pos: '2B', bats: 'R', age: 23, pa: 521, h: 123, double: 21, triple: 7, hr: 7, bb: 30, so: 72, hbp: 5, sb: 18, cs: 7, sec: 'SS', fld: 55 },
      { id: 'koskico01', name: 'Corey Koskie', pos: '3B', bats: 'L', age: 30, pa: 562, h: 133, double: 32, triple: 2, hr: 16, bb: 71, so: 115, hbp: 8, sb: 13, cs: 7, sec: '1B', fld: 68 },
      { id: 'guzmacr01', name: 'Cristian Guzman', pos: 'SS', bats: 'S', age: 25, pa: 585, h: 149, double: 22, triple: 11, hr: 6, bb: 24, so: 77, hbp: 4, sb: 17, cs: 10, sec: '2B', fld: 61 },
      { id: 'jonesja04', name: 'Jacque Jones', pos: 'LF', bats: 'L', age: 28, pa: 548, h: 152, double: 32, triple: 1, hr: 19, bb: 28, so: 107, hbp: 3, sb: 10, cs: 4, sec: 'CF', fld: 76, arm: 60 },
      { id: 'hunteto01', name: 'Torii Hunter', pos: 'CF', bats: 'R', age: 27, pa: 642, h: 156, double: 34, triple: 4, hr: 28, bb: 43, so: 117, hbp: 6, sb: 13, cs: 7, sec: 'LF', fld: 79, arm: 66 },
      { id: 'kieltbo01', name: 'Bobby Kielty', pos: 'RF', bats: 'S', age: 26, pa: 509, h: 110, double: 25, triple: 2, hr: 14, bb: 71, so: 94, hbp: 7, sb: 8, cs: 2, sec: 'CF', fld: 63, arm: 65 },
      { id: 'mohrdu01', name: 'Dustan Mohr', pos: 'DH', bats: 'R', age: 27, pa: 387, h: 90, double: 22, triple: 1, hr: 10, bb: 31, so: 96, hbp: 1, sb: 5, cs: 2, sec: 'RF', fld: 80, arm: 62 },
    ],
    bench: [
      { id: 'lecroma01', name: 'Matt LeCroy', pos: 'DH', bats: 'R', age: 27, pa: 374, h: 98, double: 20, triple: 0, hr: 16, bb: 24, so: 79, hbp: 3, sb: 0, cs: 2, sec: 'C' },
      { id: 'hockide01', name: 'Denny Hocking', pos: '2B', bats: 'S', age: 33, pa: 209, h: 46, double: 10, triple: 1, hr: 2, bb: 16, so: 35, hbp: 1, sb: 1, cs: 1, sec: 'SS', fld: 65 },
      { id: 'gomezch02', name: 'Chris Gomez', pos: '2B', bats: 'R', age: 32, pa: 185, h: 45, double: 11, triple: 1, hr: 3, bb: 8, so: 19, hbp: 2, sb: 1, cs: 1, sec: 'SS', fld: 69 },
      { id: 'morneju01', name: 'Justin Morneau', pos: 'DH', bats: 'L', age: 22, pa: 115, h: 24, double: 4, triple: 0, hr: 4, bb: 9, so: 30, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
      { id: 'cuddymi01', name: 'Michael Cuddyer', pos: 'RF', bats: 'R', age: 24, pa: 114, h: 26, double: 4, triple: 2, hr: 4, bb: 10, so: 23, hbp: 0, sb: 2, cs: 1, sec: '1B', fld: 59, arm: 70 },
    ],
    reserveBatters: [
      { id: 'fordle01', name: 'Lew Ford', pos: 'CF', bats: 'R', age: 26, pa: 83, h: 24, double: 7, triple: 1, hr: 3, bb: 8, so: 9, hbp: 1, sb: 2, cs: 0, sec: 'LF', fld: 52, arm: 71, rk: true },
      { id: 'searsto01', name: 'Todd Sears', pos: '1B', bats: 'R', age: 27, pa: 82, h: 19, double: 4, triple: 0, hr: 2, bb: 6, so: 17, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
      { id: 'ryanmi03', name: 'Mike Ryan', pos: 'RF', bats: 'L', age: 25, pa: 68, h: 22, double: 6, triple: 0, hr: 5, bb: 5, so: 12, hbp: 0, sb: 2, cs: 1, sec: 'LF', rk: true },
      { id: 'restomi01', name: 'Michael Restovich', pos: 'RF', bats: 'R', age: 24, pa: 64, h: 15, double: 3, triple: 2, hr: 1, bb: 9, so: 13, hbp: 1, sb: 1, cs: 0, sec: 'LF', rk: true },
      { id: 'princto01', name: 'Tom Prince', pos: 'C', bats: 'R', age: 38, pa: 57, h: 11, double: 2, triple: 0, hr: 2, bb: 5, so: 9, hbp: 2, sb: 1, cs: 1, fld: 64, arm: 81 },
    ],
    pitchers: [
      { id: 'radkebr01', name: 'Brad Radke', role: 'SP', throws: 'R', age: 30, g: 33, gs: 33, outs: 637, h: 235, hr: 28, bb: 29, so: 121, hbp: 8, er: 105, w: 14, l: 10, sv: 0, fld: 75 },
      { id: 'lohseky01', name: 'Kyle Lohse', role: 'SP', throws: 'R', age: 24, g: 33, gs: 33, outs: 603, h: 206, hr: 29, bb: 57, so: 132, hbp: 8, er: 101, w: 14, l: 11, sv: 0, fld: 69 },
      { id: 'rogerke01', name: 'Kenny Rogers', role: 'SP', throws: 'L', age: 38, g: 33, gs: 31, outs: 585, h: 218, hr: 22, bb: 59, so: 110, hbp: 9, er: 97, w: 13, l: 8, sv: 0, fld: 80 },
      { id: 'santajo01', name: 'Johan Santana', role: 'SP', throws: 'L', age: 24, g: 45, gs: 18, outs: 475, h: 127, hr: 15, bb: 54, so: 172, hbp: 3, er: 55, w: 12, l: 3, sv: 0, fld: 50 },
      { id: 'reedri01', name: 'Rick Reed', role: 'SP', throws: 'R', age: 38, g: 27, gs: 21, outs: 405, h: 149, hr: 22, bb: 24, so: 84, hbp: 5, er: 67, w: 6, l: 12, sv: 0, fld: 60 },
      { id: 'guarded01', name: 'Eddie Guardado', role: 'CL', throws: 'L', age: 32, g: 66, gs: 0, outs: 196, h: 49, hr: 7, bb: 16, so: 63, hbp: 0, er: 22, w: 3, l: 5, sv: 41 },
      { id: 'rincoju01', name: 'Juan Rincon', role: 'RP', throws: 'R', age: 24, g: 58, gs: 0, outs: 257, h: 83, hr: 7, bb: 36, so: 61, hbp: 3, er: 39, w: 5, l: 6, sv: 0, rk: true },
      { id: 'hawkila01', name: 'LaTroy Hawkins', role: 'RP', throws: 'R', age: 30, g: 74, gs: 0, outs: 232, h: 67, hr: 4, bb: 20, so: 67, hbp: 1, er: 21, w: 9, l: 3, sv: 2 },
      { id: 'romerjc01', name: 'J. C. Romero', role: 'RP', throws: 'L', age: 27, g: 73, gs: 0, outs: 189, h: 63, hr: 6, bb: 36, so: 55, hbp: 4, er: 29, w: 2, l: 0, sv: 0 },
      { id: 'fioreto01', name: 'Tony Fiore', role: 'RP', throws: 'R', age: 31, g: 21, gs: 0, outs: 108, h: 31, hr: 4, bb: 19, so: 23, hbp: 2, er: 17, w: 1, l: 1, sv: 0 },
      { id: 'balfogr01', name: 'Grant Balfour', role: 'RP', throws: 'R', age: 25, g: 17, gs: 1, outs: 78, h: 23, hr: 4, bb: 14, so: 29, hbp: 0, er: 13, w: 1, l: 0, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'maysjo01', name: 'Joe Mays', role: 'SP', throws: 'R', age: 27, g: 31, gs: 21, outs: 390, h: 149, hr: 19, bb: 38, so: 57, hbp: 3, er: 77, w: 8, l: 8, sv: 0 },
      { id: 'miltoer01', name: 'Eric Milton', role: 'RP', throws: 'L', age: 27, g: 3, gs: 3, outs: 51, h: 16, hr: 2, bb: 3, so: 11, hbp: 0, er: 8, w: 1, l: 0, sv: 0 },
      { id: 'pulidca01', name: 'Carlos Pulido', role: 'RP', throws: 'L', age: 31, g: 7, gs: 1, outs: 47, h: 15, hr: 0, bb: 3, so: 6, hbp: 0, er: 7, w: 0, l: 1, sv: 0 },
      { id: 'baldwja01', name: 'James Baldwin', role: 'RP', throws: 'R', age: 31, g: 10, gs: 0, outs: 45, h: 18, hr: 3, bb: 5, so: 9, hbp: 1, er: 9, w: 0, l: 1, sv: 1 },
      { id: 'nakammi01', name: 'Micheal Nakamura', role: 'RP', throws: 'R', age: 26, g: 12, gs: 0, outs: 38, h: 20, hr: 4, bb: 2, so: 14, hbp: 1, er: 11, w: 0, l: 0, sv: 1, rk: true },
    ],
  },
  // HOU (HOU 2003)
  {
    franchiseId: 'HOU',
    season: 2003,
    batters: [
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 34, pa: 509, h: 109, double: 17, triple: 3, hr: 5, bb: 42, so: 69, hbp: 4, sb: 4, cs: 3, fld: 77, arm: 74 },
      { id: 'bagweje01', name: 'Jeff Bagwell', pos: '1B', bats: 'R', age: 35, pa: 702, h: 168, double: 32, triple: 2, hr: 36, bb: 95, so: 126, hbp: 7, sb: 10, cs: 4, fld: 73 },
      { id: 'kentje01', name: 'Jeff Kent', pos: '2B', bats: 'R', age: 35, pa: 552, h: 152, double: 37, triple: 2, hr: 24, bb: 42, so: 82, hbp: 5, sb: 5, cs: 2, sec: '3B', fld: 72 },
      { id: 'blumge01', name: 'Geoff Blum', pos: '3B', bats: 'S', age: 30, pa: 449, h: 107, double: 20, triple: 1, hr: 10, bb: 33, so: 64, hbp: 3, sb: 2, cs: 1, sec: 'SS', fld: 66 },
      { id: 'everead01', name: 'Adam Everett', pos: 'SS', bats: 'R', age: 26, pa: 436, h: 95, double: 17, triple: 3, hr: 7, bb: 31, so: 68, hbp: 8, sb: 9, cs: 1, sec: '2B', fld: 78, rk: true },
      { id: 'berkmla01', name: 'Lance Berkman', pos: 'LF', bats: 'S', age: 27, pa: 658, h: 162, double: 37, triple: 4, hr: 31, bb: 102, so: 111, hbp: 8, sb: 6, cs: 4, sec: 'CF', fld: 64, arm: 70 },
      { id: 'biggicr01', name: 'Craig Biggio', pos: 'CF', bats: 'R', age: 37, pa: 717, h: 166, double: 41, triple: 3, hr: 16, bb: 58, so: 115, hbp: 25, sb: 11, cs: 3, sec: 'LF', fld: 66, arm: 71 },
      { id: 'hidalri01', name: 'Richard Hidalgo', pos: 'RF', bats: 'R', age: 28, pa: 585, h: 145, double: 35, triple: 4, hr: 24, bb: 57, so: 107, hbp: 9, sb: 8, cs: 5, sec: 'CF', fld: 74, arm: 86 },
      { id: 'ensbemo01', name: 'Morgan Ensberg', pos: 'DH', bats: 'R', age: 27, pa: 441, h: 108, double: 16, triple: 2, hr: 22, bb: 49, so: 62, hbp: 6, sb: 7, cs: 2, sec: '3B', fld: 75 },
    ],
    bench: [
      { id: 'merceor01', name: 'Orlando Merced', pos: 'RF', bats: 'S', age: 36, pa: 230, h: 54, double: 14, triple: 2, hr: 4, bb: 18, so: 38, hbp: 1, sb: 4, cs: 1, sec: '1B', fld: 68, arm: 90 },
      { id: 'vizcajo01', name: 'Jose Vizcaino', pos: 'SS', bats: 'S', age: 35, pa: 203, h: 53, double: 8, triple: 2, hr: 2, bb: 10, so: 21, hbp: 1, sb: 1, cs: 2, sec: '2B', fld: 64 },
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 32, pa: 189, h: 40, double: 8, triple: 0, hr: 4, bb: 16, so: 26, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 63, arm: 72 },
      { id: 'huntebr02', name: 'Brian Hunter', pos: 'RF', bats: 'R', age: 32, pa: 108, h: 25, double: 7, triple: 1, hr: 1, bb: 8, so: 19, hbp: 1, sb: 3, cs: 0, sec: 'CF', fld: 51, arm: 67 },
      { id: 'brunter01', name: 'Eric Bruntlett', pos: 'SS', bats: 'R', age: 25, pa: 56, h: 14, double: 3, triple: 0, hr: 1, bb: 0, so: 10, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'millewa04', name: 'Wade Miller', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 562, h: 169, hr: 19, bb: 74, so: 163, hbp: 8, er: 78, w: 14, l: 13, sv: 0, fld: 69 },
      { id: 'redditi01', name: 'Tim Redding', role: 'SP', throws: 'R', age: 25, g: 33, gs: 32, outs: 528, h: 180, hr: 19, bb: 69, so: 126, hbp: 6, er: 81, w: 10, l: 14, sv: 0, fld: 70 },
      { id: 'roberje02', name: 'Jeriome Robertson', role: 'SP', throws: 'L', age: 26, g: 32, gs: 31, outs: 482, h: 181, hr: 25, bb: 65, so: 99, hbp: 6, er: 92, w: 15, l: 9, sv: 0, fld: 77, rk: true },
      { id: 'oswalro01', name: 'Roy Oswalt', role: 'SP', throws: 'R', age: 25, g: 21, gs: 21, outs: 382, h: 116, hr: 12, bb: 30, so: 114, hbp: 4, er: 42, w: 10, l: 5, sv: 0 },
      { id: 'villoro01', name: 'Ron Villone', role: 'SP', throws: 'L', age: 33, g: 19, gs: 19, outs: 320, h: 100, hr: 14, bb: 45, so: 84, hbp: 5, er: 58, w: 6, l: 6, sv: 0 },
      { id: 'wagnebi02', name: 'Billy Wagner', role: 'CL', throws: 'L', age: 31, g: 78, gs: 0, outs: 258, h: 54, hr: 8, bb: 24, so: 103, hbp: 3, er: 20, w: 1, l: 4, sv: 44 },
      { id: 'doteloc01', name: 'Octavio Dotel', role: 'RP', throws: 'R', age: 29, g: 76, gs: 0, outs: 261, h: 55, hr: 7, bb: 30, so: 104, hbp: 3, er: 22, w: 6, l: 4, sv: 4 },
      { id: 'lidgebr01', name: 'Brad Lidge', role: 'RP', throws: 'R', age: 26, g: 78, gs: 0, outs: 255, h: 62, hr: 6, bb: 44, so: 96, hbp: 6, er: 35, w: 6, l: 3, sv: 1, rk: true },
      { id: 'stoneri01', name: 'Ricky Stone', role: 'RP', throws: 'R', age: 28, g: 65, gs: 0, outs: 249, h: 78, hr: 10, bb: 33, so: 54, hbp: 4, er: 33, w: 6, l: 4, sv: 1 },
      { id: 'micelda01', name: 'Dan Miceli', role: 'RP', throws: 'R', age: 32, g: 57, gs: 0, outs: 211, h: 63, hr: 12, bb: 25, so: 59, hbp: 2, er: 29, w: 2, l: 4, sv: 1 },
      { id: 'munrope01', name: 'Peter Munro', role: 'RP', throws: 'R', age: 28, g: 40, gs: 2, outs: 162, h: 63, hr: 5, bb: 21, so: 30, hbp: 4, er: 26, w: 3, l: 4, sv: 0 },
    ],
    reservePitchers: [
      { id: 'saarlki01', name: 'Kirk Saarloos', role: 'RP', throws: 'R', age: 24, g: 36, gs: 4, outs: 148, h: 56, hr: 6, bb: 16, so: 37, hbp: 3, er: 30, w: 2, l: 1, sv: 0 },
      { id: 'fernaja01', name: 'Jared Fernandez', role: 'RP', throws: 'R', age: 31, g: 12, gs: 6, outs: 115, h: 39, hr: 3, bb: 14, so: 22, hbp: 2, er: 17, w: 3, l: 3, sv: 0 },
      { id: 'gallomi01', name: 'Mike Gallo', role: 'RP', throws: 'L', age: 26, g: 32, gs: 0, outs: 90, h: 28, hr: 3, bb: 10, so: 16, hbp: 1, er: 10, w: 1, l: 0, sv: 0, rk: true },
      { id: 'puffebr01', name: 'Brandon Puffer', role: 'RP', throws: 'R', age: 27, g: 13, gs: 0, outs: 63, h: 23, hr: 1, bb: 14, so: 14, hbp: 1, er: 11, w: 0, l: 0, sv: 0 },
      { id: 'blandna01', name: 'Nate Bland', role: 'RP', throws: 'L', age: 28, g: 22, gs: 0, outs: 61, h: 22, hr: 3, bb: 12, so: 18, hbp: 2, er: 13, w: 1, l: 2, sv: 0, rk: true },
    ],
  },
  // LAA (ANA 2003)
  {
    franchiseId: 'LAA',
    season: 2003,
    batters: [
      { id: 'molinbe01', name: 'Bengie Molina', pos: 'C', bats: 'R', age: 28, pa: 430, h: 107, double: 20, triple: 0, hr: 10, bb: 14, so: 36, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 74, arm: 82 },
      { id: 'spiezsc01', name: 'Scott Spiezio', pos: '1B', bats: 'S', age: 30, pa: 581, h: 140, double: 35, triple: 5, hr: 15, bb: 52, so: 63, hbp: 5, sb: 6, cs: 4, sec: '3B', fld: 70 },
      { id: 'kennead01', name: 'Adam Kennedy', pos: '2B', bats: 'L', age: 27, pa: 510, h: 130, double: 23, triple: 3, hr: 10, bb: 33, so: 75, hbp: 9, sb: 19, cs: 7, sec: 'SS', fld: 70 },
      { id: 'glaustr01', name: 'Troy Glaus', pos: '3B', bats: 'R', age: 26, pa: 367, h: 78, double: 16, triple: 1, hr: 17, bb: 49, so: 77, hbp: 2, sb: 6, cs: 2, sec: 'SS', fld: 57 },
      { id: 'eckstda01', name: 'David Eckstein', pos: 'SS', bats: 'R', age: 28, pa: 517, h: 123, double: 19, triple: 2, hr: 4, bb: 34, so: 40, hbp: 17, sb: 17, cs: 6, sec: '2B', fld: 71 },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'LF', bats: 'L', age: 31, pa: 673, h: 196, double: 49, triple: 3, hr: 29, bb: 30, so: 84, hbp: 0, sb: 7, cs: 4, sec: 'CF', fld: 85, arm: 77 },
      { id: 'erstada01', name: 'Darin Erstad', pos: 'CF', bats: 'L', age: 29, pa: 284, h: 70, double: 11, triple: 1, hr: 4, bb: 17, so: 36, hbp: 3, sb: 10, cs: 2, sec: 'LF', fld: 84, arm: 65 },
      { id: 'davanje02', name: 'Jeff DaVanon', pos: 'RF', bats: 'S', age: 29, pa: 382, h: 89, double: 16, triple: 1, hr: 13, bb: 41, so: 63, hbp: 1, sb: 16, cs: 5, sec: 'CF', fld: 84, arm: 63 },
      { id: 'salmoti01', name: 'Tim Salmon', pos: 'DH', bats: 'R', age: 34, pa: 621, h: 142, double: 35, triple: 3, hr: 20, bb: 81, so: 105, hbp: 9, sb: 5, cs: 2, sec: 'RF', fld: 62, arm: 69 },
    ],
    bench: [
      { id: 'wootesh01', name: 'Shawn Wooten', pos: '1B', bats: 'R', age: 30, pa: 300, h: 73, double: 10, triple: 0, hr: 8, bb: 19, so: 49, hbp: 2, sb: 1, cs: 3, sec: '3B', fld: 70 },
      { id: 'figgich01', name: 'Chone Figgins', pos: 'CF', bats: 'S', age: 25, pa: 270, h: 70, double: 9, triple: 4, hr: 0, bb: 19, so: 40, hbp: 0, sb: 14, cs: 7, sec: 'LF', fld: 77, arm: 64, rk: true },
      { id: 'owenser01', name: 'Eric Owens', pos: 'CF', bats: 'R', age: 32, pa: 257, h: 63, double: 8, triple: 1, hr: 2, bb: 15, so: 25, hbp: 0, sb: 12, cs: 6, sec: 'LF', fld: 67, arm: 68 },
      { id: 'fullmbr01', name: 'Brad Fullmer', pos: 'DH', bats: 'L', age: 28, pa: 235, h: 61, double: 13, triple: 2, hr: 9, bb: 19, so: 28, hbp: 4, sb: 4, cs: 2, sec: '1B' },
      { id: 'gilbe01', name: 'Benji Gil', pos: '2B', bats: 'R', age: 30, pa: 135, h: 31, double: 6, triple: 1, hr: 2, bb: 5, so: 31, hbp: 0, sb: 3, cs: 1, sec: 'SS', fld: 69 },
    ],
    reserveBatters: [
      { id: 'molinjo01', name: 'Jose Molina', pos: 'C', bats: 'R', age: 28, pa: 123, h: 24, double: 5, triple: 0, hr: 0, bb: 3, so: 25, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 72, arm: 68 },
      { id: 'amezaal01', name: 'Alfredo Amezaga', pos: 'SS', bats: 'S', age: 25, pa: 120, h: 25, double: 4, triple: 2, hr: 2, bb: 8, so: 22, hbp: 1, sb: 2, cs: 2, sec: '3B', fld: 68, rk: true },
      { id: 'quinlro01', name: 'Robb Quinlan', pos: '1B', bats: 'R', age: 26, pa: 101, h: 27, double: 4, triple: 2, hr: 0, bb: 6, so: 16, hbp: 0, sb: 1, cs: 2, sec: '3B', fld: 64, rk: true },
      { id: 'riggsad01', name: 'Adam Riggs', pos: '1B', bats: 'R', age: 30, pa: 72, h: 15, double: 4, triple: 1, hr: 3, bb: 8, so: 10, hbp: 0, sb: 3, cs: 1, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'washbja01', name: 'Jarrod Washburn', role: 'SP', throws: 'L', age: 28, g: 32, gs: 32, outs: 622, h: 200, hr: 28, bb: 57, so: 129, hbp: 8, er: 90, w: 10, l: 15, sv: 0, fld: 60 },
      { id: 'lackejo01', name: 'John Lackey', role: 'SP', throws: 'R', age: 24, g: 33, gs: 33, outs: 612, h: 221, hr: 28, bb: 65, so: 146, hbp: 9, er: 100, w: 10, l: 16, sv: 0, fld: 65 },
      { id: 'ortizra01', name: 'Ramon Ortiz', role: 'SP', throws: 'R', age: 30, g: 32, gs: 32, outs: 540, h: 193, hr: 30, bb: 63, so: 117, hbp: 9, er: 94, w: 16, l: 13, sv: 0, fld: 62 },
      { id: 'shielsc01', name: 'Scot Shields', role: 'SP', throws: 'R', age: 27, g: 44, gs: 13, outs: 445, h: 130, hr: 12, bb: 44, so: 108, hbp: 5, er: 44, w: 5, l: 6, sv: 1, fld: 82 },
      { id: 'seleaa01', name: 'Aaron Sele', role: 'SP', throws: 'R', age: 33, g: 25, gs: 25, outs: 365, h: 140, hr: 16, bb: 45, so: 61, hbp: 8, er: 69, w: 7, l: 11, sv: 0 },
      { id: 'percitr01', name: 'Troy Percival', role: 'CL', throws: 'R', age: 33, g: 52, gs: 0, outs: 148, h: 34, hr: 5, bb: 22, so: 55, hbp: 2, er: 15, w: 0, l: 5, sv: 33 },
      { id: 'rodrifr03', name: 'Francisco Rodriguez', role: 'RP', throws: 'R', age: 21, g: 59, gs: 0, outs: 258, h: 50, hr: 11, bb: 35, so: 99, hbp: 3, er: 28, w: 8, l: 3, sv: 2, rk: true },
      { id: 'weberbe01', name: 'Ben Weber', role: 'RP', throws: 'R', age: 33, g: 62, gs: 0, outs: 241, h: 79, hr: 6, bb: 24, so: 46, hbp: 2, er: 25, w: 5, l: 1, sv: 0 },
      { id: 'donnebr01', name: 'Brendan Donnelly', role: 'RP', throws: 'R', age: 31, g: 63, gs: 0, outs: 222, h: 53, hr: 2, bb: 25, so: 80, hbp: 4, er: 15, w: 2, l: 2, sv: 3, rk: true },
      { id: 'schoesc01', name: 'Scott Schoeneweis', role: 'RP', throws: 'L', age: 29, g: 59, gs: 0, outs: 194, h: 65, hr: 6, bb: 23, so: 40, hbp: 4, er: 33, w: 3, l: 2, sv: 0 },
      { id: 'callami01', name: 'Mickey Callaway', role: 'RP', throws: 'R', age: 28, g: 23, gs: 7, outs: 182, h: 78, hr: 8, bb: 24, so: 42, hbp: 3, er: 42, w: 1, l: 7, sv: 0 },
    ],
    reservePitchers: [
      { id: 'appieke01', name: 'Kevin Appier', role: 'SP', throws: 'R', age: 35, g: 23, gs: 23, outs: 335, h: 115, hr: 16, bb: 40, so: 75, hbp: 7, er: 56, w: 8, l: 9, sv: 0 },
      { id: 'jonesgr01', name: 'Greg Jones', role: 'RP', throws: 'R', age: 26, g: 18, gs: 0, outs: 83, h: 29, hr: 3, bb: 14, so: 28, hbp: 2, er: 15, w: 0, l: 0, sv: 0, rk: true },
      { id: 'greggke01', name: 'Kevin Gregg', role: 'RP', throws: 'R', age: 25, g: 5, gs: 3, outs: 74, h: 18, hr: 3, bb: 8, so: 14, hbp: 1, er: 9, w: 2, l: 0, sv: 0, rk: true },
      { id: 'turnbde01', name: 'Derrick Turnbow', role: 'RP', throws: 'R', age: 25, g: 11, gs: 0, outs: 46, h: 7, hr: 0, bb: 3, so: 15, hbp: 0, er: 1, w: 2, l: 0, sv: 0, rk: true },
      { id: 'bootcch01', name: 'Chris Bootcheck', role: 'RP', throws: 'R', age: 24, g: 4, gs: 1, outs: 31, h: 16, hr: 5, bb: 6, so: 7, hbp: 0, er: 11, w: 0, l: 1, sv: 0, rk: true },
    ],
  },
  // OAK (OAK 2003)
  {
    franchiseId: 'OAK',
    season: 2003,
    batters: [
      { id: 'hernara02', name: 'Ramon Hernandez', pos: 'C', bats: 'R', age: 27, pa: 536, h: 124, double: 24, triple: 1, hr: 16, bb: 39, so: 77, hbp: 9, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 72 },
      { id: 'hattesc01', name: 'Scott Hatteberg', pos: '1B', bats: 'L', age: 33, pa: 622, h: 142, double: 31, triple: 1, hr: 13, bb: 69, so: 56, hbp: 8, sb: 0, cs: 1, sec: '3B', fld: 69 },
      { id: 'ellisma01', name: 'Mark Ellis', pos: '2B', bats: 'R', age: 26, pa: 622, h: 139, double: 29, triple: 5, hr: 9, bb: 54, so: 91, hbp: 7, sb: 6, cs: 2, sec: 'SS', fld: 76 },
      { id: 'chaveer01', name: 'Eric Chavez', pos: '3B', bats: 'L', age: 25, pa: 654, h: 165, double: 37, triple: 4, hr: 32, bb: 60, so: 102, hbp: 2, sb: 8, cs: 3, sec: '1B', fld: 83 },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: 'SS', bats: 'R', age: 29, pa: 703, h: 184, double: 36, triple: 0, hr: 30, bb: 46, so: 75, hbp: 9, sb: 9, cs: 1, sec: '2B', fld: 72 },
      { id: 'longte01', name: 'Terrence Long', pos: 'LF', bats: 'L', age: 27, pa: 522, h: 121, double: 25, triple: 3, hr: 13, bb: 36, so: 73, hbp: 2, sb: 4, cs: 3, sec: 'CF', fld: 68, arm: 61 },
      { id: 'singlch01', name: 'Chris Singleton', pos: 'CF', bats: 'L', age: 30, pa: 341, h: 81, double: 21, triple: 3, hr: 4, bb: 19, so: 54, hbp: 2, sb: 10, cs: 3, sec: 'LF', fld: 57, arm: 61 },
      { id: 'dyeje01', name: 'Jermaine Dye', pos: 'RF', bats: 'R', age: 29, pa: 253, h: 53, double: 10, triple: 0, hr: 9, bb: 23, so: 45, hbp: 4, sb: 2, cs: 0, sec: 'LF', fld: 66, arm: 62 },
      { id: 'durazer01', name: 'Erubiel Durazo', pos: 'DH', bats: 'L', age: 29, pa: 645, h: 139, double: 29, triple: 1, hr: 26, bb: 102, so: 116, hbp: 3, sb: 1, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'byrneer01', name: 'Eric Byrnes', pos: 'CF', bats: 'R', age: 27, pa: 460, h: 108, double: 25, triple: 9, hr: 13, bb: 39, so: 71, hbp: 4, sb: 10, cs: 2, sec: 'LF', fld: 59, arm: 68 },
      { id: 'mcmilbi01', name: 'Billy McMillon', pos: 'LF', bats: 'L', age: 31, pa: 175, h: 40, double: 11, triple: 0, hr: 5, bb: 18, so: 37, hbp: 2, sb: 0, cs: 0, sec: 'RF', fld: 68, arm: 56 },
      { id: 'piattad01', name: 'Adam Piatt', pos: 'LF', bats: 'R', age: 27, pa: 143, h: 29, double: 10, triple: 0, hr: 5, bb: 11, so: 39, hbp: 1, sb: 1, cs: 1, sec: 'RF', fld: 58, arm: 69 },
      { id: 'menecfr01', name: 'Frank Menechino', pos: '2B', bats: 'R', age: 32, pa: 109, h: 19, double: 3, triple: 0, hr: 2, bb: 16, so: 19, hbp: 3, sb: 0, cs: 0, sec: '3B' },
      { id: 'melhuad01', name: 'Adam Melhuse', pos: 'C', bats: 'S', age: 31, pa: 86, h: 21, double: 6, triple: 0, hr: 4, bb: 8, so: 19, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 73, arm: 68, rk: true },
    ],
    reserveBatters: [
      { id: 'gantro01', name: 'Ron Gant', pos: 'LF', bats: 'R', age: 38, pa: 44, h: 10, double: 2, triple: 0, hr: 2, bb: 4, so: 9, hbp: 0, sb: 1, cs: 1, sec: 'CF' },
    ],
    pitchers: [
      { id: 'hudsoti01', name: 'Tim Hudson', role: 'SP', throws: 'R', age: 27, g: 34, gs: 34, outs: 720, h: 211, hr: 17, bb: 62, so: 160, hbp: 9, er: 76, w: 16, l: 7, sv: 0, fld: 83 },
      { id: 'zitoba01', name: 'Barry Zito', role: 'SP', throws: 'L', age: 25, g: 35, gs: 35, outs: 695, h: 187, hr: 21, bb: 85, so: 170, hbp: 8, er: 81, w: 14, l: 12, sv: 0, fld: 68 },
      { id: 'muldema01', name: 'Mark Mulder', role: 'SP', throws: 'L', age: 25, g: 26, gs: 26, outs: 560, h: 173, hr: 16, bb: 44, so: 133, hbp: 5, er: 69, w: 15, l: 9, sv: 0, fld: 77 },
      { id: 'lillyte01', name: 'Ted Lilly', role: 'SP', throws: 'L', age: 27, g: 32, gs: 31, outs: 535, h: 172, hr: 26, bb: 60, so: 148, hbp: 7, er: 86, w: 12, l: 10, sv: 0, fld: 63 },
      { id: 'halamjo01', name: 'John Halama', role: 'SP', throws: 'L', age: 31, g: 35, gs: 13, outs: 326, h: 120, hr: 15, bb: 34, so: 58, hbp: 2, er: 49, w: 3, l: 5, sv: 0 },
      { id: 'foulkke01', name: 'Keith Foulke', role: 'CL', throws: 'R', age: 30, g: 72, gs: 0, outs: 260, h: 62, hr: 8, bb: 19, so: 79, hbp: 6, er: 23, w: 9, l: 1, sv: 43 },
      { id: 'bradfch01', name: 'Chad Bradford', role: 'RP', throws: 'R', age: 28, g: 72, gs: 0, outs: 231, h: 72, hr: 6, bb: 23, so: 62, hbp: 6, er: 26, w: 7, l: 4, sv: 2 },
      { id: 'rincori01', name: 'Ricardo Rincon', role: 'RP', throws: 'L', age: 33, g: 64, gs: 0, outs: 166, h: 47, hr: 4, bb: 24, so: 46, hbp: 2, er: 22, w: 8, l: 4, sv: 0 },
      { id: 'neumi01', name: 'Michael Neu', role: 'RP', throws: 'R', age: 25, g: 32, gs: 0, outs: 126, h: 43, hr: 2, bb: 26, so: 20, hbp: 2, er: 17, w: 0, l: 0, sv: 1, rk: true },
      { id: 'mecirji01', name: 'Jim Mecir', role: 'RP', throws: 'R', age: 33, g: 41, gs: 0, outs: 111, h: 38, hr: 3, bb: 16, so: 29, hbp: 1, er: 19, w: 2, l: 3, sv: 1 },
      { id: 'harvich01', name: 'Chad Harville', role: 'RP', throws: 'R', age: 26, g: 21, gs: 0, outs: 65, h: 25, hr: 3, bb: 16, so: 18, hbp: 1, er: 14, w: 1, l: 0, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'harderi01', name: 'Rich Harden', role: 'SP', throws: 'R', age: 21, g: 15, gs: 13, outs: 224, h: 72, hr: 5, bb: 40, so: 67, hbp: 1, er: 37, w: 5, l: 4, sv: 0, rk: true },
      { id: 'duchsju01', name: 'Justin Duchscherer', role: 'RP', throws: 'R', age: 25, g: 4, gs: 3, outs: 49, h: 18, hr: 2, bb: 3, so: 14, hbp: 2, er: 9, w: 1, l: 1, sv: 0, rk: true },
      { id: 'fikacje01', name: 'Jeremy Fikac', role: 'RP', throws: 'R', age: 28, g: 14, gs: 0, outs: 48, h: 16, hr: 3, bb: 8, so: 14, hbp: 1, er: 9, w: 0, l: 1, sv: 0 },
      { id: 'woodmi01', name: 'Mike Wood', role: 'RP', throws: 'R', age: 23, g: 7, gs: 1, outs: 41, h: 24, hr: 1, bb: 7, so: 15, hbp: 2, er: 16, w: 2, l: 1, sv: 0, rk: true },
    ],
  },
  // SEA (SEA 2003)
  {
    franchiseId: 'SEA',
    season: 2003,
    batters: [
      { id: 'wilsoda01', name: 'Dan Wilson', pos: 'C', bats: 'R', age: 34, pa: 337, h: 82, double: 15, triple: 1, hr: 5, bb: 15, so: 59, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 76, arm: 70 },
      { id: 'olerujo01', name: 'John Olerud', pos: '1B', bats: 'L', age: 34, pa: 634, h: 152, double: 35, triple: 0, hr: 15, bb: 88, so: 65, hbp: 5, sb: 0, cs: 1, fld: 81 },
      { id: 'boonebr01', name: 'Bret Boone', pos: '2B', bats: 'R', age: 34, pa: 705, h: 185, double: 36, triple: 4, hr: 32, bb: 59, so: 117, hbp: 7, sb: 13, cs: 4, fld: 65 },
      { id: 'cirilje01', name: 'Jeff Cirillo', pos: '3B', bats: 'R', age: 33, pa: 293, h: 65, double: 11, triple: 0, hr: 4, bb: 20, so: 34, hbp: 4, sb: 4, cs: 1, sec: '2B', fld: 62 },
      { id: 'guillca01', name: 'Carlos Guillen', pos: 'SS', bats: 'S', age: 27, pa: 451, h: 106, double: 19, triple: 4, hr: 7, bb: 46, so: 71, hbp: 1, sb: 4, cs: 4, sec: '3B', fld: 62 },
      { id: 'winnra01', name: 'Randy Winn', pos: 'LF', bats: 'S', age: 29, pa: 660, h: 175, double: 37, triple: 6, hr: 12, bb: 47, so: 108, hbp: 7, sb: 23, cs: 7, sec: 'CF', fld: 82, arm: 60 },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 30, pa: 612, h: 132, double: 29, triple: 5, hr: 21, bb: 71, so: 150, hbp: 6, sb: 24, cs: 7, sec: 'RF', fld: 89, arm: 63 },
      { id: 'suzukic01', name: 'Ichiro Suzuki', pos: 'RF', bats: 'L', age: 29, pa: 725, h: 215, double: 29, triple: 8, hr: 10, bb: 45, so: 64, hbp: 6, sb: 37, cs: 11, sec: 'LF', fld: 77, arm: 72 },
      { id: 'martied01', name: 'Edgar Martinez', pos: 'DH', bats: 'R', age: 40, pa: 603, h: 144, double: 30, triple: 0, hr: 24, bb: 95, so: 97, hbp: 8, sb: 1, cs: 1, sec: '3B' },
    ],
    bench: [
      { id: 'sanchre01', name: 'Rey Sanchez', pos: 'SS', bats: 'R', age: 35, pa: 369, h: 92, double: 10, triple: 3, hr: 0, bb: 15, so: 34, hbp: 2, sb: 3, cs: 1, sec: '2B', fld: 71 },
      { id: 'mclemma01', name: 'Mark McLemore', pos: 'SS', bats: 'S', age: 38, pa: 352, h: 77, double: 14, triple: 3, hr: 4, bb: 46, so: 63, hbp: 1, sb: 13, cs: 6, sec: '2B', fld: 65 },
      { id: 'davisbe01', name: 'Ben Davis', pos: 'C', bats: 'S', age: 26, pa: 269, h: 58, double: 14, triple: 0, hr: 6, bb: 23, so: 60, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 66, arm: 74 },
      { id: 'bloomwi01', name: 'Willie Bloomquist', pos: '3B', bats: 'R', age: 25, pa: 220, h: 53, double: 9, triple: 2, hr: 1, bb: 20, so: 36, hbp: 1, sb: 5, cs: 1, sec: 'SS', fld: 58, rk: true },
      { id: 'mabryjo01', name: 'John Mabry', pos: 'RF', bats: 'L', age: 32, pa: 122, h: 26, double: 6, triple: 0, hr: 4, bb: 11, so: 23, hbp: 2, sb: 0, cs: 0, sec: '1B' },
    ],
    reserveBatters: [
      { id: 'colbrgr01', name: 'Greg Colbrunn', pos: '1B', bats: 'R', age: 33, pa: 62, h: 18, double: 4, triple: 1, hr: 3, bb: 4, so: 9, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 40, g: 33, gs: 33, outs: 645, h: 196, hr: 23, bb: 57, so: 133, hbp: 9, er: 80, w: 21, l: 7, sv: 0, fld: 75 },
      { id: 'frankry01', name: 'Ryan Franklin', role: 'SP', throws: 'R', age: 30, g: 32, gs: 32, outs: 636, h: 202, hr: 32, bb: 56, so: 109, hbp: 9, er: 87, w: 11, l: 13, sv: 0, fld: 65 },
      { id: 'pineijo01', name: 'Joel Pineiro', role: 'SP', throws: 'R', age: 24, g: 32, gs: 32, outs: 635, h: 194, hr: 21, bb: 69, so: 151, hbp: 7, er: 82, w: 16, l: 11, sv: 0, fld: 72 },
      { id: 'garcifr02', name: 'Freddy Garcia', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 604, h: 197, hr: 27, bb: 65, so: 152, hbp: 8, er: 95, w: 12, l: 14, sv: 0, fld: 72 },
      { id: 'mechegi01', name: 'Gil Meche', role: 'SP', throws: 'R', age: 24, g: 32, gs: 32, outs: 559, h: 187, hr: 30, bb: 63, so: 130, hbp: 3, er: 95, w: 15, l: 13, sv: 0, fld: 69 },
      { id: 'hasegsh01', name: 'Shigetoshi Hasegawa', role: 'CL', throws: 'R', age: 34, g: 63, gs: 0, outs: 219, h: 61, hr: 5, bb: 23, so: 37, hbp: 1, er: 19, w: 2, l: 4, sv: 16 },
      { id: 'mateoju01', name: 'Julio Mateo', role: 'RP', throws: 'R', age: 25, g: 50, gs: 0, outs: 257, h: 69, hr: 13, bb: 18, so: 68, hbp: 5, er: 31, w: 4, l: 0, sv: 1, rk: true },
      { id: 'nelsoje01', name: 'Jeff Nelson', role: 'RP', throws: 'R', age: 36, g: 70, gs: 0, outs: 166, h: 44, hr: 4, bb: 29, so: 70, hbp: 4, er: 22, w: 4, l: 2, sv: 8 },
      { id: 'rhodear01', name: 'Arthur Rhodes', role: 'RP', throws: 'L', age: 33, g: 67, gs: 0, outs: 162, h: 46, hr: 4, bb: 14, so: 61, hbp: 1, er: 19, w: 3, l: 3, sv: 3 },
      { id: 'soriara01', name: 'Rafael Soriano', role: 'RP', throws: 'R', age: 23, g: 40, gs: 0, outs: 159, h: 36, hr: 4, bb: 14, so: 54, hbp: 2, er: 15, w: 3, l: 0, sv: 1, rk: true },
      { id: 'sasakka01', name: 'Kazuhiro Sasaki', role: 'RP', throws: 'R', age: 35, g: 35, gs: 0, outs: 100, h: 28, hr: 3, bb: 12, so: 36, hbp: 1, er: 13, w: 1, l: 2, sv: 10 },
    ],
    reservePitchers: [
      { id: 'carragi01', name: 'Giovanni Carrara', role: 'RP', throws: 'R', age: 35, g: 23, gs: 0, outs: 87, h: 33, hr: 5, bb: 12, so: 20, hbp: 2, er: 15, w: 2, l: 0, sv: 0 },
      { id: 'tayloaa01', name: 'Aaron Taylor', role: 'RP', throws: 'R', age: 25, g: 10, gs: 0, outs: 38, h: 18, hr: 1, bb: 5, so: 10, hbp: 1, er: 12, w: 0, l: 0, sv: 0, rk: true },
    ],
  },
  // TEX (TEX 2003)
  {
    franchiseId: 'TEX',
    season: 2003,
    batters: [
      { id: 'diazei01', name: 'Einar Diaz', pos: 'C', bats: 'R', age: 30, pa: 361, h: 82, double: 18, triple: 1, hr: 3, bb: 12, so: 31, hbp: 9, sb: 2, cs: 1, sec: '1B', fld: 71, arm: 72 },
      { id: 'teixema01', name: 'Mark Teixeira', pos: '1B', bats: 'S', age: 23, pa: 589, h: 137, double: 29, triple: 5, hr: 26, bb: 44, so: 120, hbp: 14, sb: 1, cs: 2, sec: '3B', fld: 74, rk: true },
      { id: 'youngmi02', name: 'Michael Young', pos: '2B', bats: 'R', age: 26, pa: 713, h: 187, double: 31, triple: 9, hr: 13, bb: 40, so: 116, hbp: 1, sb: 10, cs: 4, sec: 'SS', fld: 72 },
      { id: 'blaloha01', name: 'Hank Blalock', pos: '3B', bats: 'L', age: 22, pa: 615, h: 161, double: 32, triple: 3, hr: 26, bb: 48, so: 106, hbp: 1, sb: 2, cs: 3, sec: '1B', fld: 70 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: 'SS', bats: 'R', age: 27, pa: 715, h: 185, double: 29, triple: 4, hr: 51, bb: 84, so: 124, hbp: 13, sb: 14, cs: 3, sec: '2B', fld: 75 },
      { id: 'menchke01', name: 'Kevin Mench', pos: 'LF', bats: 'R', age: 25, pa: 139, h: 35, double: 9, triple: 0, hr: 4, bb: 10, so: 24, hbp: 3, sb: 1, cs: 1, sec: 'RF', fld: 66, arm: 63 },
      { id: 'evereca01', name: 'Carl Everett', pos: 'CF', bats: 'S', age: 32, pa: 602, h: 148, double: 27, triple: 3, hr: 25, bb: 49, so: 99, hbp: 14, sb: 7, cs: 4, sec: 'RF', fld: 65, arm: 73 },
      { id: 'gonzaju03', name: 'Juan Gonzalez', pos: 'RF', bats: 'R', age: 33, pa: 346, h: 96, double: 20, triple: 1, hr: 19, bb: 18, so: 66, hbp: 3, sb: 1, cs: 0, sec: 'LF', fld: 72, arm: 90 },
      { id: 'palmera01', name: 'Rafael Palmeiro', pos: 'DH', bats: 'L', age: 38, pa: 654, h: 147, double: 27, triple: 1, hr: 40, bb: 92, so: 83, hbp: 6, sb: 2, cs: 0, sec: '1B' },
    ],
    bench: [
      { id: 'glanvdo01', name: 'Doug Glanville', pos: 'CF', bats: 'R', age: 32, pa: 258, h: 62, double: 8, triple: 1, hr: 4, bb: 10, so: 32, hbp: 1, sb: 8, cs: 1, sec: 'LF', fld: 74, arm: 66 },
      { id: 'greento02', name: 'Todd Greene', pos: 'C', bats: 'R', age: 32, pa: 210, h: 48, double: 10, triple: 1, hr: 11, bb: 3, so: 45, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 63, arm: 73 },
      { id: 'nixla01', name: 'Laynce Nix', pos: 'RF', bats: 'L', age: 22, pa: 195, h: 47, double: 10, triple: 0, hr: 8, bb: 9, so: 53, hbp: 0, sb: 3, cs: 0, sec: 'CF', fld: 85, arm: 62, rk: true },
      { id: 'chrisry01', name: 'Ryan Christenson', pos: 'CF', bats: 'R', age: 29, pa: 186, h: 28, double: 8, triple: 0, hr: 2, bb: 15, so: 43, hbp: 2, sb: 2, cs: 2, sec: 'LF', fld: 79, arm: 59 },
      { id: 'sadledo01', name: 'Donnie Sadler', pos: '3B', bats: 'R', age: 28, pa: 150, h: 24, double: 4, triple: 1, hr: 1, bb: 12, so: 30, hbp: 2, sb: 5, cs: 3, sec: '2B', fld: 69 },
    ],
    reserveBatters: [
      { id: 'jonesja05', name: 'Jason Jones', pos: 'LF', bats: 'S', age: 26, pa: 121, h: 23, double: 6, triple: 0, hr: 3, bb: 10, so: 21, hbp: 3, sb: 0, cs: 1, sec: 'RF', fld: 72, arm: 88, rk: true },
      { id: 'nivarra01', name: 'Ramon Nivar', pos: 'CF', bats: 'R', age: 23, pa: 97, h: 19, double: 1, triple: 2, hr: 0, bb: 4, so: 10, hbp: 1, sb: 4, cs: 2, sec: 'LF', fld: 73, arm: 83, rk: true },
      { id: 'thamema01', name: 'Marcus Thames', pos: 'RF', bats: 'R', age: 26, pa: 84, h: 15, double: 2, triple: 0, hr: 2, bb: 7, so: 19, hbp: 2, sb: 0, cs: 1, sec: 'LF', fld: 67, arm: 67, rk: true },
      { id: 'clarkje02', name: 'Jermaine Clark', pos: 'LF', bats: 'L', age: 26, pa: 57, h: 8, double: 2, triple: 0, hr: 0, bb: 6, so: 5, hbp: 0, sb: 2, cs: 2, sec: 'RF', rk: true },
      { id: 'lairdge01', name: 'Gerald Laird', pos: 'C', bats: 'R', age: 23, pa: 50, h: 12, double: 2, triple: 1, hr: 1, bb: 5, so: 11, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'thomsjo01', name: 'John Thomson', role: 'SP', throws: 'R', age: 29, g: 35, gs: 35, outs: 651, h: 233, hr: 30, bb: 51, so: 135, hbp: 4, er: 114, w: 13, l: 14, sv: 0, fld: 75 },
      { id: 'lewisco01', name: 'Colby Lewis', role: 'SP', throws: 'R', age: 23, g: 26, gs: 26, outs: 381, h: 161, hr: 22, bb: 74, so: 90, hbp: 5, er: 100, w: 10, l: 9, sv: 0, rk: true },
      { id: 'dickera01', name: 'R. A. Dickey', role: 'SP', throws: 'R', age: 28, g: 38, gs: 13, outs: 350, h: 135, hr: 16, bb: 39, so: 92, hbp: 5, er: 67, w: 9, l: 8, sv: 1, rk: true },
      { id: 'valdeis01', name: 'Ismael Valdez', role: 'SP', throws: 'R', age: 29, g: 22, gs: 22, outs: 345, h: 134, hr: 19, bb: 31, so: 59, hbp: 5, er: 66, w: 8, l: 8, sv: 0 },
      { id: 'benoijo01', name: 'Joaquin Benoit', role: 'SP', throws: 'R', age: 25, g: 25, gs: 17, outs: 315, h: 101, hr: 18, bb: 57, so: 80, hbp: 4, er: 62, w: 8, l: 5, sv: 0 },
      { id: 'urbinug01', name: 'Ugueth Urbina', role: 'CL', throws: 'R', age: 29, g: 72, gs: 0, outs: 231, h: 58, hr: 9, bb: 29, so: 86, hbp: 0, er: 26, w: 3, l: 4, sv: 32 },
      { id: 'cordefr01', name: 'Francisco Cordero', role: 'RP', throws: 'R', age: 28, g: 73, gs: 0, outs: 248, h: 69, hr: 4, bb: 35, so: 87, hbp: 2, er: 25, w: 5, l: 8, sv: 15 },
      { id: 'fultzaa01', name: 'Aaron Fultz', role: 'RP', throws: 'L', age: 29, g: 64, gs: 0, outs: 202, h: 74, hr: 8, bb: 27, so: 55, hbp: 2, er: 37, w: 1, l: 3, sv: 0 },
      { id: 'shousbr01', name: 'Brian Shouse', role: 'RP', throws: 'L', age: 34, g: 62, gs: 0, outs: 183, h: 61, hr: 3, bb: 17, so: 40, hbp: 5, er: 23, w: 0, l: 1, sv: 1, rk: true },
      { id: 'powelja04', name: 'Jay Powell', role: 'RP', throws: 'R', age: 31, g: 51, gs: 0, outs: 176, h: 70, hr: 7, bb: 32, so: 43, hbp: 2, er: 38, w: 3, l: 0, sv: 0 },
      { id: 'ramirer01', name: 'Erasmo Ramirez', role: 'RP', throws: 'L', age: 27, g: 34, gs: 0, outs: 147, h: 46, hr: 4, bb: 9, so: 28, hbp: 4, er: 21, w: 3, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'mouncto01', name: 'Tony Mounce', role: 'SP', throws: 'L', age: 28, g: 11, gs: 11, outs: 152, h: 65, hr: 9, bb: 25, so: 30, hbp: 5, er: 40, w: 1, l: 5, sv: 0, rk: true },
      { id: 'garciro01', name: 'Rosman Garcia', role: 'RP', throws: 'R', age: 24, g: 46, gs: 0, outs: 139, h: 63, hr: 4, bb: 23, so: 25, hbp: 2, er: 31, w: 1, l: 2, sv: 0, rk: true },
      { id: 'dresery01', name: 'Ryan Drese', role: 'RP', throws: 'R', age: 27, g: 11, gs: 8, outs: 138, h: 60, hr: 6, bb: 22, so: 32, hbp: 3, er: 34, w: 2, l: 4, sv: 0 },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 32, g: 35, gs: 0, outs: 136, h: 33, hr: 6, bb: 22, so: 40, hbp: 0, er: 20, w: 3, l: 3, sv: 0 },
      { id: 'parkch01', name: 'Chan Ho Park', role: 'RP', throws: 'R', age: 30, g: 7, gs: 7, outs: 89, h: 32, hr: 4, bb: 18, so: 28, hbp: 4, er: 19, w: 1, l: 3, sv: 0 },
    ],
  },
  // ATL (ATL 2003)
  {
    franchiseId: 'ATL',
    season: 2003,
    batters: [
      { id: 'lopezja01', name: 'Javy Lopez', pos: 'C', bats: 'R', age: 32, pa: 495, h: 132, double: 24, triple: 2, hr: 30, bb: 32, so: 86, hbp: 7, sb: 0, cs: 1, sec: '1B', fld: 73, arm: 70 },
      { id: 'fickro01', name: 'Robert Fick', pos: '1B', bats: 'L', age: 29, pa: 460, h: 111, double: 26, triple: 1, hr: 13, bb: 39, so: 58, hbp: 4, sb: 0, cs: 1, sec: '3B', fld: 60 },
      { id: 'gilesma01', name: 'Marcus Giles', pos: '2B', bats: 'R', age: 25, pa: 635, h: 163, double: 42, triple: 2, hr: 21, bb: 61, so: 86, hbp: 9, sb: 11, cs: 5, sec: 'SS', fld: 79 },
      { id: 'castivi02', name: 'Vinny Castilla', pos: '3B', bats: 'R', age: 35, pa: 578, h: 140, double: 27, triple: 2, hr: 19, bb: 26, so: 84, hbp: 4, sb: 2, cs: 2, sec: 'SS', fld: 74 },
      { id: 'furcara01', name: 'Rafael Furcal', pos: 'SS', bats: 'S', age: 25, pa: 734, h: 190, double: 35, triple: 9, hr: 12, bb: 54, so: 95, hbp: 3, sb: 28, cs: 8, sec: '2B', fld: 73 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: 'LF', bats: 'S', age: 31, pa: 656, h: 174, double: 33, triple: 2, hr: 28, bb: 98, so: 84, hbp: 1, sb: 5, cs: 3, sec: 'RF', fld: 52, arm: 70 },
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'CF', bats: 'R', age: 26, pa: 659, h: 157, double: 29, triple: 1, hr: 35, bb: 63, so: 130, hbp: 6, sb: 6, cs: 3, sec: 'RF', fld: 74, arm: 70 },
      { id: 'sheffga01', name: 'Gary Sheffield', pos: 'RF', bats: 'R', age: 34, pa: 678, h: 184, double: 34, triple: 1, hr: 36, bb: 88, so: 60, hbp: 9, sb: 16, cs: 4, sec: 'LF', fld: 68, arm: 67 },
      { id: 'derosma01', name: 'Mark DeRosa', pos: 'DH', bats: 'R', age: 28, pa: 288, h: 73, double: 13, triple: 1, hr: 6, bb: 16, so: 41, hbp: 5, sb: 2, cs: 1, sec: '3B', fld: 71 },
    ],
    bench: [
      { id: 'francju01', name: 'Julio Franco', pos: '1B', bats: 'R', age: 44, pa: 223, h: 57, double: 10, triple: 1, hr: 4, bb: 24, so: 43, hbp: 0, sb: 1, cs: 1, fld: 76 },
      { id: 'braggda01', name: 'Darren Bragg', pos: 'RF', bats: 'L', age: 33, pa: 181, h: 41, double: 9, triple: 1, hr: 1, bb: 15, so: 40, hbp: 2, sb: 3, cs: 1, sec: 'CF', fld: 64, arm: 63 },
      { id: 'blanche01', name: 'Henry Blanco', pos: 'C', bats: 'R', age: 31, pa: 166, h: 30, double: 7, triple: 1, hr: 3, bb: 13, so: 29, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 77, arm: 66 },
      { id: 'francma01', name: 'Matt Franco', pos: '1B', bats: 'L', age: 33, pa: 148, h: 37, double: 7, triple: 1, hr: 3, bb: 14, so: 23, hbp: 0, sb: 0, cs: 0, sec: '3B' },
      { id: 'estrajo01', name: 'Johnny Estrada', pos: 'C', bats: 'S', age: 27, pa: 39, h: 9, double: 1, triple: 0, hr: 1, bb: 2, so: 4, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'maddugr01', name: 'Greg Maddux', role: 'SP', throws: 'R', age: 37, g: 36, gs: 36, outs: 655, h: 219, hr: 20, bb: 37, so: 133, hbp: 7, er: 82, w: 16, l: 11, sv: 0, fld: 85 },
      { id: 'ortizru01', name: 'Russ Ortiz', role: 'SP', throws: 'R', age: 29, g: 34, gs: 34, outs: 637, h: 182, hr: 16, bb: 97, so: 147, hbp: 3, er: 86, w: 21, l: 7, sv: 0, fld: 69 },
      { id: 'hamptmi01', name: 'Mike Hampton', role: 'SP', throws: 'L', age: 30, g: 31, gs: 31, outs: 570, h: 202, hr: 20, bb: 81, so: 97, hbp: 4, er: 98, w: 14, l: 8, sv: 0, fld: 89 },
      { id: 'ramirho01', name: 'Horacio Ramirez', role: 'SP', throws: 'L', age: 23, g: 29, gs: 29, outs: 547, h: 181, hr: 21, bb: 72, so: 100, hbp: 6, er: 81, w: 12, l: 4, sv: 0, fld: 70, rk: true },
      { id: 'reynosh01', name: 'Shane Reynolds', role: 'SP', throws: 'R', age: 35, g: 30, gs: 29, outs: 502, h: 192, hr: 22, bb: 54, so: 97, hbp: 6, er: 96, w: 11, l: 9, sv: 0, fld: 68 },
      { id: 'smoltjo01', name: 'John Smoltz', role: 'CL', throws: 'R', age: 36, g: 62, gs: 0, outs: 193, h: 48, hr: 3, bb: 12, so: 68, hbp: 0, er: 16, w: 0, l: 2, sv: 45 },
      { id: 'hodgetr01', name: 'Trey Hodges', role: 'RP', throws: 'R', age: 25, g: 52, gs: 1, outs: 197, h: 71, hr: 11, bb: 29, so: 63, hbp: 3, er: 35, w: 3, l: 3, sv: 0, rk: true },
      { id: 'hernaro01', name: 'Roberto Hernandez', role: 'RP', throws: 'R', age: 38, g: 66, gs: 0, outs: 180, h: 66, hr: 9, bb: 32, so: 46, hbp: 3, er: 30, w: 5, l: 3, sv: 0 },
      { id: 'kingra01', name: 'Ray King', role: 'RP', throws: 'L', age: 29, g: 80, gs: 0, outs: 177, h: 50, hr: 4, bb: 25, so: 45, hbp: 2, er: 22, w: 3, l: 4, sv: 0 },
      { id: 'bongju01', name: 'Jung Bong', role: 'RP', throws: 'L', age: 22, g: 44, gs: 0, outs: 171, h: 57, hr: 7, bb: 30, so: 46, hbp: 2, er: 33, w: 6, l: 2, sv: 1, rk: true },
      { id: 'gryboke01', name: 'Kevin Gryboski', role: 'RP', throws: 'R', age: 29, g: 64, gs: 0, outs: 133, h: 43, hr: 4, bb: 26, so: 30, hbp: 3, er: 18, w: 6, l: 4, sv: 0 },
    ],
    reservePitchers: [
      { id: 'holmeda01', name: 'Darren Holmes', role: 'RP', throws: 'R', age: 37, g: 48, gs: 0, outs: 126, h: 41, hr: 4, bb: 11, so: 43, hbp: 1, er: 15, w: 1, l: 2, sv: 0 },
      { id: 'marquja01', name: 'Jason Marquis', role: 'RP', throws: 'R', age: 24, g: 21, gs: 2, outs: 122, h: 42, hr: 5, bb: 18, so: 28, hbp: 1, er: 22, w: 0, l: 0, sv: 1 },
      { id: 'cunnawi01', name: 'Will Cunnane', role: 'RP', throws: 'R', age: 29, g: 20, gs: 0, outs: 60, h: 18, hr: 2, bb: 7, so: 17, hbp: 0, er: 9, w: 2, l: 2, sv: 3 },
    ],
  },
  // MIA (FLO 2003)
  {
    franchiseId: 'MIA',
    season: 2003,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 31, pa: 578, h: 159, double: 37, triple: 3, hr: 21, bb: 45, so: 92, hbp: 5, sb: 9, cs: 5, sec: '1B', fld: 70, arm: 73 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 27, pa: 643, h: 149, double: 33, triple: 4, hr: 27, bb: 83, so: 139, hbp: 8, sb: 17, cs: 7, sec: '3B', fld: 72 },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 27, pa: 676, h: 182, double: 19, triple: 6, hr: 4, bb: 62, so: 72, hbp: 2, sb: 33, cs: 18, sec: 'SS', fld: 70 },
      { id: 'lowelmi01', name: 'Mike Lowell', pos: '3B', bats: 'R', age: 29, pa: 557, h: 137, double: 32, triple: 0, hr: 25, bb: 52, so: 76, hbp: 4, sb: 3, cs: 2, sec: '1B', fld: 71 },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 26, pa: 582, h: 132, double: 33, triple: 5, hr: 15, bb: 34, so: 107, hbp: 13, sb: 2, cs: 4, sec: '2B', fld: 72 },
      { id: 'hollato01', name: 'Todd Hollandsworth', pos: 'LF', bats: 'L', age: 30, pa: 254, h: 64, double: 19, triple: 2, hr: 6, bb: 21, so: 53, hbp: 0, sb: 4, cs: 3, sec: 'CF', fld: 72, arm: 75 },
      { id: 'pierrju01', name: 'Juan Pierre', pos: 'CF', bats: 'L', age: 25, pa: 746, h: 205, double: 27, triple: 7, hr: 1, bb: 48, so: 42, hbp: 8, sb: 59, cs: 18, sec: 'LF', fld: 71, arm: 66 },
      { id: 'encarju01', name: 'Juan Encarnacion', pos: 'RF', bats: 'R', age: 27, pa: 653, h: 159, double: 31, triple: 6, hr: 21, bb: 40, so: 100, hbp: 5, sb: 19, cs: 8, sec: 'CF', fld: 77, arm: 67 },
      { id: 'banksbr01', name: 'Brian Banks', pos: 'DH', bats: 'S', age: 32, pa: 180, h: 37, double: 6, triple: 2, hr: 4, bb: 23, so: 38, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 60, arm: 65 },
    ],
    bench: [
      { id: 'cabremi01', name: 'Miguel Cabrera', pos: 'LF', bats: 'R', age: 20, pa: 346, h: 84, double: 21, triple: 3, hr: 12, bb: 25, so: 84, hbp: 2, sb: 0, cs: 2, sec: 'RF', fld: 66, arm: 76, rk: true },
      { id: 'redmomi01', name: 'Mike Redmond', pos: 'C', bats: 'R', age: 32, pa: 141, h: 35, double: 7, triple: 0, hr: 1, bb: 9, so: 16, hbp: 4, sb: 0, cs: 0, sec: '1B', fld: 78, arm: 57 },
      { id: 'foxan01', name: 'Andy Fox', pos: '2B', bats: 'L', age: 32, pa: 120, h: 24, double: 4, triple: 1, hr: 1, bb: 11, so: 24, hbp: 3, sb: 5, cs: 2, sec: 'SS' },
      { id: 'mordemi01', name: 'Mike Mordecai', pos: 'SS', bats: 'R', age: 35, pa: 101, h: 22, double: 5, triple: 0, hr: 1, bb: 7, so: 18, hbp: 1, sb: 2, cs: 1, sec: '3B' },
      { id: 'castrra01', name: 'Ramon Castro', pos: 'C', bats: 'R', age: 27, pa: 57, h: 13, double: 2, triple: 0, hr: 4, bb: 6, so: 11, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'pavanca01', name: 'Carl Pavano', role: 'SP', throws: 'R', age: 27, g: 33, gs: 32, outs: 603, h: 216, hr: 22, bb: 54, so: 131, hbp: 9, er: 101, w: 12, l: 13, sv: 0, fld: 72 },
      { id: 'pennybr01', name: 'Brad Penny', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 589, h: 197, hr: 21, bb: 60, so: 139, hbp: 3, er: 90, w: 14, l: 10, sv: 0, fld: 66 },
      { id: 'redmama01', name: 'Mark Redman', role: 'SP', throws: 'L', age: 29, g: 29, gs: 29, outs: 572, h: 183, hr: 15, bb: 56, so: 128, hbp: 5, er: 81, w: 14, l: 9, sv: 0, fld: 65 },
      { id: 'willido03', name: 'Dontrelle Willis', role: 'SP', throws: 'L', age: 21, g: 27, gs: 27, outs: 482, h: 148, hr: 13, bb: 58, so: 142, hbp: 3, er: 59, w: 14, l: 6, sv: 0, fld: 54, rk: true },
      { id: 'beckejo02', name: 'Josh Beckett', role: 'SP', throws: 'R', age: 23, g: 24, gs: 23, outs: 426, h: 128, hr: 12, bb: 57, so: 152, hbp: 2, er: 53, w: 9, l: 8, sv: 0, fld: 67 },
      { id: 'loopebr01', name: 'Braden Looper', role: 'CL', throws: 'R', age: 28, g: 74, gs: 0, outs: 242, h: 77, hr: 6, bb: 29, so: 56, hbp: 1, er: 32, w: 6, l: 4, sv: 28 },
      { id: 'tejermi01', name: 'Michael Tejera', role: 'RP', throws: 'L', age: 26, g: 50, gs: 6, outs: 243, h: 82, hr: 8, bb: 35, so: 56, hbp: 2, er: 41, w: 3, l: 4, sv: 2 },
      { id: 'phelpto01', name: 'Tommy Phelps', role: 'RP', throws: 'L', age: 29, g: 27, gs: 7, outs: 189, h: 70, hr: 3, bb: 23, so: 43, hbp: 2, er: 28, w: 3, l: 2, sv: 0, rk: true },
      { id: 'almanar01', name: 'Armando Almanza', role: 'RP', throws: 'L', age: 30, g: 51, gs: 0, outs: 151, h: 52, hr: 10, bb: 27, so: 56, hbp: 1, er: 31, w: 4, l: 5, sv: 0 },
      { id: 'foxch02', name: 'Chad Fox', role: 'RP', throws: 'R', age: 32, g: 38, gs: 0, outs: 130, h: 34, hr: 3, bb: 30, so: 48, hbp: 2, er: 14, w: 3, l: 3, sv: 3 },
      { id: 'spoonti01', name: 'Tim Spooneybarger', role: 'RP', throws: 'R', age: 23, g: 33, gs: 0, outs: 126, h: 28, hr: 2, bb: 15, so: 29, hbp: 1, er: 15, w: 1, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'bumpna01', name: 'Nate Bump', role: 'RP', throws: 'R', age: 26, g: 32, gs: 0, outs: 109, h: 34, hr: 3, bb: 20, so: 17, hbp: 7, er: 19, w: 4, l: 0, sv: 0, rk: true },
      { id: 'levraal01', name: 'Allen Levrault', role: 'RP', throws: 'R', age: 25, g: 19, gs: 0, outs: 84, h: 35, hr: 5, bb: 14, so: 19, hbp: 1, er: 17, w: 1, l: 0, sv: 0 },
      { id: 'burneaj01', name: 'A. J. Burnett', role: 'RP', throws: 'R', age: 26, g: 4, gs: 4, outs: 69, h: 19, hr: 2, bb: 12, so: 23, hbp: 1, er: 10, w: 0, l: 2, sv: 0 },
      { id: 'nealbl01', name: 'Blaine Neal', role: 'RP', throws: 'R', age: 25, g: 18, gs: 0, outs: 63, h: 32, hr: 1, bb: 10, so: 17, hbp: 1, er: 14, w: 0, l: 0, sv: 0, rk: true },
      { id: 'olsenke01', name: 'Kevin Olsen', role: 'RP', throws: 'R', age: 26, g: 7, gs: 0, outs: 36, h: 17, hr: 1, bb: 6, so: 11, hbp: 0, er: 9, w: 0, l: 0, sv: 0 },
    ],
  },
  // NYM (NYN 2003)
  {
    franchiseId: 'NYM',
    season: 2003,
    batters: [
      { id: 'wilsova01', name: 'Vance Wilson', pos: 'C', bats: 'R', age: 30, pa: 292, h: 66, double: 10, triple: 1, hr: 8, bb: 13, so: 56, hbp: 7, sb: 1, cs: 2, sec: '1B', fld: 71, arm: 82 },
      { id: 'phillja04', name: 'Jason Phillips', pos: '1B', bats: 'R', age: 26, pa: 453, h: 120, double: 24, triple: 0, hr: 11, bb: 38, so: 49, hbp: 10, sb: 0, cs: 1, sec: '3B', fld: 65, rk: true },
      { id: 'alomaro01', name: 'Roberto Alomar', pos: '2B', bats: 'S', age: 35, pa: 598, h: 143, double: 26, triple: 4, hr: 9, bb: 59, so: 74, hbp: 2, sb: 15, cs: 3, fld: 66 },
      { id: 'wiggity01', name: 'Ty Wigginton', pos: '3B', bats: 'R', age: 25, pa: 633, h: 149, double: 36, triple: 5, hr: 13, bb: 45, so: 121, hbp: 9, sb: 12, cs: 2, sec: '1B', fld: 72, rk: true },
      { id: 'reyesjo01', name: 'Jose Reyes', pos: 'SS', bats: 'S', age: 20, pa: 292, h: 84, double: 12, triple: 4, hr: 5, bb: 13, so: 36, hbp: 0, sb: 13, cs: 3, sec: '2B', fld: 77, rk: true },
      { id: 'floydcl01', name: 'Cliff Floyd', pos: 'LF', bats: 'L', age: 30, pa: 425, h: 108, double: 28, triple: 1, hr: 19, bb: 50, so: 70, hbp: 5, sb: 8, cs: 2, sec: '1B', fld: 68, arm: 78 },
      { id: 'duncaje01', name: 'Jeff Duncan', pos: 'CF', bats: 'L', age: 24, pa: 166, h: 27, double: 0, triple: 2, hr: 1, bb: 17, so: 41, hbp: 2, sb: 4, cs: 2, sec: 'LF', fld: 89, arm: 59, rk: true },
      { id: 'cedenro01', name: 'Roger Cedeno', pos: 'RF', bats: 'S', age: 28, pa: 527, h: 130, double: 20, triple: 4, hr: 7, bb: 38, so: 84, hbp: 1, sb: 24, cs: 8, sec: 'CF', fld: 75, arm: 67 },
      { id: 'bellja01', name: 'Jay Bell', pos: 'DH', bats: 'R', age: 37, pa: 142, h: 25, double: 4, triple: 0, hr: 2, bb: 19, so: 29, hbp: 2, sb: 0, cs: 0, sec: '3B' },
    ],
    bench: [
      { id: 'burnije01', name: 'Jeromy Burnitz', pos: 'LF', bats: 'L', age: 34, pa: 505, h: 105, double: 20, triple: 1, hr: 26, bb: 47, so: 117, hbp: 6, sb: 5, cs: 5, sec: 'RF', fld: 65, arm: 65 },
      { id: 'perezti01', name: 'Timo Perez', pos: 'LF', bats: 'L', age: 28, pa: 382, h: 97, double: 20, triple: 2, hr: 5, bb: 18, so: 30, hbp: 2, sb: 6, cs: 6, sec: 'CF', fld: 77, arm: 72 },
      { id: 'mcewijo01', name: 'Joe McEwing', pos: '2B', bats: 'R', age: 30, pa: 313, h: 67, double: 12, triple: 1, hr: 3, bb: 20, so: 61, hbp: 5, sb: 5, cs: 2, sec: 'SS', fld: 75 },
      { id: 'clarkto02', name: 'Tony Clark', pos: '1B', bats: 'S', age: 31, pa: 280, h: 60, double: 13, triple: 1, hr: 10, bb: 25, so: 64, hbp: 1, sb: 0, cs: 0, sec: '3B', fld: 62 },
      { id: 'piazzmi01', name: 'Mike Piazza', pos: 'C', bats: 'R', age: 34, pa: 273, h: 68, double: 13, triple: 0, hr: 15, bb: 32, so: 41, hbp: 1, sb: 0, cs: 1, fld: 69, arm: 68 },
    ],
    reserveBatters: [
      { id: 'gonzara01', name: 'Raul Gonzalez', pos: 'LF', bats: 'R', age: 29, pa: 246, h: 52, double: 11, triple: 2, hr: 3, bb: 24, so: 38, hbp: 1, sb: 4, cs: 1, sec: 'RF', fld: 87, arm: 72, rk: true },
      { id: 'shinjts01', name: 'Tsuyoshi Shinjo', pos: 'CF', bats: 'R', age: 31, pa: 124, h: 27, double: 5, triple: 1, hr: 2, bb: 7, so: 15, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 82, arm: 90 },
      { id: 'vaughmo01', name: 'Mo Vaughn', pos: '1B', bats: 'L', age: 35, pa: 96, h: 20, double: 3, triple: 0, hr: 4, bb: 11, so: 24, hbp: 2, sb: 0, cs: 0, fld: 50 },
      { id: 'scutama01', name: 'Marco Scutaro', pos: '2B', bats: 'R', age: 27, pa: 91, h: 17, double: 3, triple: 1, hr: 2, bb: 10, so: 17, hbp: 1, sb: 2, cs: 1, sec: 'SS', fld: 66, rk: true },
      { id: 'velanjo01', name: 'Jorge Velandia', pos: 'SS', bats: 'R', age: 28, pa: 72, h: 10, double: 3, triple: 1, hr: 0, bb: 10, so: 15, hbp: 0, sb: 0, cs: 0, sec: '2B', fld: 86 },
    ],
    pitchers: [
      { id: 'trachst01', name: 'Steve Trachsel', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 614, h: 202, hr: 25, bb: 68, so: 124, hbp: 2, er: 85, w: 16, l: 10, sv: 0, fld: 73 },
      { id: 'seoja01', name: 'Jae Weong Seo', role: 'SP', throws: 'R', age: 26, g: 32, gs: 31, outs: 565, h: 193, hr: 18, bb: 46, so: 110, hbp: 6, er: 80, w: 9, l: 12, sv: 0, fld: 76, rk: true },
      { id: 'glavito02', name: 'Tom Glavine', role: 'SP', throws: 'L', age: 37, g: 32, gs: 32, outs: 550, h: 191, hr: 20, bb: 69, so: 94, hbp: 4, er: 78, w: 9, l: 14, sv: 0, fld: 77 },
      { id: 'leiteal01', name: 'Al Leiter', role: 'SP', throws: 'L', age: 37, g: 30, gs: 30, outs: 542, h: 179, hr: 18, bb: 76, so: 148, hbp: 8, er: 76, w: 15, l: 9, sv: 0, fld: 69 },
      { id: 'heilmaa01', name: 'Aaron Heilman', role: 'SP', throws: 'R', age: 24, g: 14, gs: 13, outs: 196, h: 79, hr: 13, bb: 41, so: 51, hbp: 3, er: 49, w: 2, l: 7, sv: 0, rk: true },
      { id: 'benitar01', name: 'Armando Benitez', role: 'CL', throws: 'R', age: 30, g: 69, gs: 0, outs: 219, h: 57, hr: 8, bb: 37, so: 83, hbp: 1, er: 24, w: 4, l: 4, sv: 21 },
      { id: 'weathda01', name: 'David Weathers', role: 'RP', throws: 'R', age: 33, g: 77, gs: 0, outs: 263, h: 82, hr: 6, bb: 40, so: 73, hbp: 5, er: 29, w: 1, l: 6, sv: 7 },
      { id: 'wheelda01', name: 'Dan Wheeler', role: 'RP', throws: 'R', age: 25, g: 35, gs: 0, outs: 153, h: 52, hr: 6, bb: 16, so: 34, hbp: 1, er: 24, w: 1, l: 3, sv: 2 },
      { id: 'felicpe01', name: 'Pedro Feliciano', role: 'RP', throws: 'L', age: 26, g: 23, gs: 0, outs: 145, h: 53, hr: 5, bb: 20, so: 42, hbp: 3, er: 20, w: 0, l: 0, sv: 0, rk: true },
      { id: 'lloydgr01', name: 'Graeme Lloyd', role: 'RP', throws: 'L', age: 36, g: 52, gs: 0, outs: 143, h: 62, hr: 4, bb: 15, so: 29, hbp: 2, er: 28, w: 1, l: 4, sv: 0 },
      { id: 'stantmi02', name: 'Mike Stanton', role: 'RP', throws: 'L', age: 36, g: 50, gs: 0, outs: 136, h: 41, hr: 4, bb: 17, so: 32, hbp: 1, er: 17, w: 2, l: 7, sv: 5 },
    ],
    reservePitchers: [
      { id: 'griffje01', name: 'Jeremy Griffiths', role: 'RP', throws: 'R', age: 25, g: 9, gs: 6, outs: 123, h: 57, hr: 5, bb: 19, so: 25, hbp: 2, er: 32, w: 1, l: 4, sv: 0, rk: true },
      { id: 'astacpe01', name: 'Pedro Astacio', role: 'RP', throws: 'R', age: 34, g: 7, gs: 7, outs: 110, h: 42, hr: 7, bb: 14, so: 30, hbp: 3, er: 23, w: 3, l: 2, sv: 0 },
      { id: 'francjo01', name: 'John Franco', role: 'RP', throws: 'L', age: 42, g: 38, gs: 0, outs: 103, h: 35, hr: 5, bb: 13, so: 22, hbp: 1, er: 12, w: 0, l: 3, sv: 2 },
      { id: 'cerdaja01', name: 'Jaime Cerda', role: 'RP', throws: 'L', age: 24, g: 27, gs: 0, outs: 97, h: 31, hr: 3, bb: 19, so: 22, hbp: 0, er: 17, w: 1, l: 1, sv: 0, rk: true },
      { id: 'stricsc01', name: 'Scott Strickland', role: 'RP', throws: 'R', age: 27, g: 19, gs: 0, outs: 60, h: 17, hr: 2, bb: 10, so: 19, hbp: 1, er: 7, w: 0, l: 2, sv: 0 },
    ],
  },
  // PHI (PHI 2003)
  {
    franchiseId: 'PHI',
    season: 2003,
    batters: [
      { id: 'liebemi01', name: 'Mike Lieberthal', pos: 'C', bats: 'R', age: 31, pa: 561, h: 150, double: 30, triple: 1, hr: 14, bb: 39, so: 61, hbp: 13, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 60 },
      { id: 'thomeji01', name: 'Jim Thome', pos: '1B', bats: 'L', age: 32, pa: 698, h: 160, double: 27, triple: 2, hr: 52, bb: 121, so: 178, hbp: 5, sb: 0, cs: 2, sec: '3B', fld: 70 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: '2B', bats: 'R', age: 27, pa: 554, h: 146, double: 29, triple: 3, hr: 10, bb: 32, so: 38, hbp: 7, sb: 10, cs: 2, sec: '3B', fld: 79 },
      { id: 'bellda01', name: 'David Bell', pos: '3B', bats: 'R', age: 30, pa: 348, h: 72, double: 16, triple: 0, hr: 8, bb: 32, so: 42, hbp: 4, sb: 0, cs: 1, sec: '2B', fld: 77 },
      { id: 'rolliji01', name: 'Jimmy Rollins', pos: 'SS', bats: 'S', age: 24, pa: 689, h: 162, double: 36, triple: 8, hr: 10, bb: 52, so: 107, hbp: 2, sb: 28, cs: 11, sec: '2B', fld: 70 },
      { id: 'burrepa01', name: 'Pat Burrell', pos: 'LF', bats: 'R', age: 26, pa: 599, h: 126, double: 32, triple: 3, hr: 26, bb: 73, so: 142, hbp: 4, sb: 1, cs: 0, sec: '1B', fld: 63, arm: 67 },
      { id: 'byrdma01', name: 'Marlon Byrd', pos: 'CF', bats: 'R', age: 25, pa: 553, h: 149, double: 28, triple: 4, hr: 7, bb: 43, so: 95, hbp: 7, sb: 11, cs: 2, sec: 'LF', fld: 67, arm: 67, rk: true },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 29, pa: 695, h: 174, double: 42, triple: 3, hr: 22, bb: 107, so: 125, hbp: 2, sb: 27, cs: 11, sec: 'CF', fld: 67, arm: 65 },
      { id: 'ledeeri01', name: 'Ricky Ledee', pos: 'DH', bats: 'L', age: 29, pa: 291, h: 60, double: 16, triple: 2, hr: 10, bb: 35, so: 60, hbp: 1, sb: 1, cs: 1, sec: 'LF', fld: 58, arm: 77 },
    ],
    bench: [
      { id: 'perezto03', name: 'Tomas Perez', pos: '3B', bats: 'S', age: 29, pa: 327, h: 78, double: 18, triple: 1, hr: 6, bb: 24, so: 54, hbp: 1, sb: 0, cs: 1, sec: '2B', fld: 74 },
      { id: 'prattto02', name: 'Todd Pratt', pos: 'C', bats: 'R', age: 36, pa: 156, h: 33, double: 10, triple: 0, hr: 4, bb: 24, so: 38, hbp: 5, sb: 1, cs: 0, sec: '1B', fld: 66, arm: 57 },
      { id: 'utleych01', name: 'Chase Utley', pos: '2B', bats: 'L', age: 24, pa: 152, h: 32, double: 10, triple: 1, hr: 2, bb: 11, so: 22, hbp: 6, sb: 2, cs: 0, sec: 'SS', fld: 73, rk: true },
      { id: 'michaja01', name: 'Jason Michaels', pos: 'LF', bats: 'R', age: 27, pa: 125, h: 33, double: 11, triple: 1, hr: 4, bb: 14, so: 27, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 68, arm: 89, rk: true },
      { id: 'houstty01', name: 'Tyler Houston', pos: '3B', bats: 'L', age: 32, pa: 103, h: 27, double: 5, triple: 0, hr: 3, bb: 6, so: 20, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 68 },
    ],
    reserveBatters: [
      { id: 'puntoni01', name: 'Nick Punto', pos: '2B', bats: 'S', age: 25, pa: 99, h: 20, double: 2, triple: 0, hr: 1, bb: 7, so: 23, hbp: 0, sb: 2, cs: 1, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 28, g: 35, gs: 35, outs: 666, h: 205, hr: 20, bb: 68, so: 173, hbp: 5, er: 93, w: 14, l: 12, sv: 0, fld: 64 },
      { id: 'padilvi01', name: 'Vicente Padilla', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 626, h: 199, hr: 19, bb: 59, so: 133, hbp: 15, er: 81, w: 14, l: 12, sv: 0, fld: 70 },
      { id: 'wolfra02', name: 'Randy Wolf', role: 'SP', throws: 'L', age: 26, g: 33, gs: 33, outs: 600, h: 175, hr: 24, bb: 70, so: 176, hbp: 7, er: 85, w: 16, l: 10, sv: 0, fld: 67 },
      { id: 'myersbr01', name: 'Brett Myers', role: 'SP', throws: 'R', age: 22, g: 32, gs: 32, outs: 579, h: 203, hr: 22, bb: 76, so: 133, hbp: 10, er: 94, w: 14, l: 9, sv: 0, fld: 70 },
      { id: 'duckwbr01', name: 'Brandon Duckworth', role: 'SP', throws: 'R', age: 27, g: 24, gs: 18, outs: 279, h: 97, hr: 13, bb: 42, so: 82, hbp: 7, er: 53, w: 4, l: 7, sv: 0 },
      { id: 'mesajo01', name: 'Jose Mesa', role: 'CL', throws: 'R', age: 37, g: 61, gs: 0, outs: 174, h: 63, hr: 5, bb: 29, so: 50, hbp: 2, er: 30, w: 5, l: 7, sv: 24 },
      { id: 'silvaca01', name: 'Carlos Silva', role: 'RP', throws: 'R', age: 24, g: 62, gs: 1, outs: 262, h: 93, hr: 6, bb: 32, so: 47, hbp: 7, er: 39, w: 3, l: 1, sv: 1 },
      { id: 'cormirh01', name: 'Rheal Cormier', role: 'RP', throws: 'L', age: 36, g: 65, gs: 0, outs: 254, h: 62, hr: 5, bb: 29, so: 63, hbp: 3, er: 27, w: 8, l: 0, sv: 1 },
      { id: 'adamste01', name: 'Terry Adams', role: 'RP', throws: 'R', age: 30, g: 66, gs: 0, outs: 204, h: 67, hr: 3, bb: 25, so: 51, hbp: 2, er: 29, w: 1, l: 4, sv: 0 },
      { id: 'wendetu01', name: 'Turk Wendell', role: 'RP', throws: 'R', age: 36, g: 56, gs: 0, outs: 192, h: 55, hr: 7, bb: 29, so: 34, hbp: 5, er: 26, w: 3, l: 3, sv: 1 },
      { id: 'telemam01', name: 'Amaury Telemaco', role: 'RP', throws: 'R', age: 29, g: 8, gs: 8, outs: 136, h: 43, hr: 6, bb: 13, so: 29, hbp: 6, er: 23, w: 1, l: 4, sv: 0 },
    ],
    reservePitchers: [
      { id: 'plesada01', name: 'Dan Plesac', role: 'RP', throws: 'L', age: 41, g: 58, gs: 0, outs: 100, h: 27, hr: 4, bb: 14, so: 40, hbp: 1, er: 12, w: 2, l: 1, sv: 2 },
      { id: 'mercahe01', name: 'Hector Mercado', role: 'RP', throws: 'L', age: 29, g: 13, gs: 0, outs: 56, h: 18, hr: 3, bb: 12, so: 19, hbp: 1, er: 10, w: 0, l: 0, sv: 1 },
    ],
  },
  // WSH (MON 2003)
  {
    franchiseId: 'WSH',
    season: 2003,
    batters: [
      { id: 'schnebr01', name: 'Brian Schneider', pos: 'C', bats: 'L', age: 26, pa: 377, h: 82, double: 27, triple: 2, hr: 9, bb: 36, so: 71, hbp: 1, sb: 0, cs: 2, sec: '1B', fld: 76, arm: 90 },
      { id: 'cordewi01', name: 'Wil Cordero', pos: '1B', bats: 'R', age: 31, pa: 492, h: 118, double: 25, triple: 0, hr: 15, bb: 47, so: 87, hbp: 5, sb: 2, cs: 1, sec: 'LF', fld: 70 },
      { id: 'vidrojo01', name: 'Jose Vidro', pos: '2B', bats: 'S', age: 28, pa: 592, h: 163, double: 37, triple: 1, hr: 16, bb: 58, so: 55, hbp: 6, sb: 3, cs: 1, sec: '3B', fld: 63 },
      { id: 'carroja01', name: 'Jamey Carroll', pos: '3B', bats: 'R', age: 29, pa: 260, h: 61, double: 11, triple: 2, hr: 1, bb: 18, so: 39, hbp: 2, sb: 5, cs: 2, sec: 'SS', fld: 87, rk: true },
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 28, pa: 691, h: 177, double: 46, triple: 2, hr: 14, bb: 51, so: 61, hbp: 2, sb: 24, cs: 5, sec: '2B', fld: 73 },
      { id: 'wilkebr01', name: 'Brad Wilkerson', pos: 'LF', bats: 'L', age: 26, pa: 602, h: 134, double: 31, triple: 6, hr: 19, bb: 85, so: 158, hbp: 4, sb: 11, cs: 9, sec: 'CF', fld: 74, arm: 76 },
      { id: 'chaveen01', name: 'Endy Chavez', pos: 'CF', bats: 'L', age: 25, pa: 526, h: 123, double: 25, triple: 7, hr: 5, bb: 29, so: 59, hbp: 0, sb: 16, cs: 9, sec: 'LF', fld: 69, arm: 74 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'RF', bats: 'R', age: 28, pa: 467, h: 132, double: 24, triple: 2, hr: 25, bb: 56, so: 52, hbp: 5, sb: 19, cs: 10, sec: 'LF', fld: 68, arm: 75 },
      { id: 'maciajo01', name: 'Jose Macias', pos: 'DH', bats: 'S', age: 31, pa: 288, h: 66, double: 15, triple: 2, hr: 5, bb: 14, so: 41, hbp: 2, sb: 7, cs: 4, sec: '3B', fld: 71, arm: 77 },
    ],
    bench: [
      { id: 'calloro01', name: 'Ron Calloway', pos: 'LF', bats: 'L', age: 26, pa: 369, h: 81, double: 17, triple: 1, hr: 9, bb: 20, so: 80, hbp: 2, sb: 9, cs: 2, sec: 'RF', fld: 72, arm: 67, rk: true },
      { id: 'barremi01', name: 'Michael Barrett', pos: 'C', bats: 'R', age: 26, pa: 252, h: 54, double: 12, triple: 1, hr: 7, bb: 20, so: 35, hbp: 1, sb: 2, cs: 1, sec: '1B', fld: 70, arm: 77 },
      { id: 'tatisfe01', name: 'Fernando Tatis', pos: '3B', bats: 'R', age: 28, pa: 196, h: 38, double: 8, triple: 0, hr: 5, bb: 17, so: 42, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 71 },
      { id: 'mateohe01', name: 'Henry Mateo', pos: '2B', bats: 'S', age: 26, pa: 169, h: 36, double: 3, triple: 1, hr: 0, bb: 11, so: 38, hbp: 3, sb: 11, cs: 1, sec: 'SS', fld: 72, rk: true },
      { id: 'guzmaed01', name: 'Edwards Guzman', pos: '3B', bats: 'L', age: 26, pa: 155, h: 35, double: 6, triple: 0, hr: 2, bb: 5, so: 18, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 55 },
    ],
    reserveBatters: [
      { id: 'liefeje01', name: 'Jeff Liefer', pos: '1B', bats: 'L', age: 28, pa: 120, h: 24, double: 5, triple: 0, hr: 5, bb: 8, so: 34, hbp: 0, sb: 0, cs: 0, sec: 'LF', fld: 51 },
      { id: 'vitiejo01', name: 'Joe Vitiello', pos: 'LF', bats: 'R', age: 33, pa: 86, h: 26, double: 6, triple: 0, hr: 3, bb: 7, so: 14, hbp: 2, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 28, g: 33, gs: 33, outs: 700, h: 236, hr: 24, bb: 67, so: 157, hbp: 7, er: 99, w: 15, l: 10, sv: 0, fld: 79 },
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 26, g: 34, gs: 34, outs: 692, h: 211, hr: 27, bb: 52, so: 213, hbp: 4, er: 88, w: 13, l: 12, sv: 0, fld: 69 },
      { id: 'ohkato01', name: 'Tomo Ohka', role: 'SP', throws: 'R', age: 27, g: 34, gs: 34, outs: 597, h: 225, hr: 23, bb: 47, so: 122, hbp: 8, er: 88, w: 10, l: 12, sv: 0, fld: 70 },
      { id: 'dayza01', name: 'Zach Day', role: 'SP', throws: 'R', age: 25, g: 23, gs: 23, outs: 394, h: 128, hr: 9, bb: 59, so: 66, hbp: 9, er: 60, w: 9, l: 8, sv: 0, rk: true },
      { id: 'vargacl01', name: 'Claudio Vargas', role: 'SP', throws: 'R', age: 25, g: 23, gs: 20, outs: 342, h: 111, hr: 16, bb: 41, so: 62, hbp: 7, er: 55, w: 6, l: 8, sv: 0, rk: true },
      { id: 'biddlro01', name: 'Rocky Biddle', role: 'CL', throws: 'R', age: 27, g: 73, gs: 0, outs: 215, h: 72, hr: 10, bb: 36, so: 55, hbp: 5, er: 38, w: 5, l: 8, sv: 34 },
      { id: 'tucketj01', name: 'T. J. Tucker', role: 'RP', throws: 'R', age: 24, g: 45, gs: 7, outs: 240, h: 89, hr: 7, bb: 26, so: 49, hbp: 3, er: 40, w: 2, l: 3, sv: 0 },
      { id: 'ayalalu01', name: 'Luis Ayala', role: 'RP', throws: 'R', age: 25, g: 65, gs: 0, outs: 213, h: 65, hr: 8, bb: 13, so: 46, hbp: 5, er: 23, w: 10, l: 3, sv: 5, rk: true },
      { id: 'eischjo01', name: 'Joey Eischen', role: 'RP', throws: 'L', age: 33, g: 70, gs: 0, outs: 159, h: 52, hr: 5, bb: 17, so: 44, hbp: 3, er: 16, w: 2, l: 2, sv: 1 },
      { id: 'stewasc01', name: 'Scott Stewart', role: 'RP', throws: 'L', age: 27, g: 51, gs: 0, outs: 129, h: 44, hr: 4, bb: 14, so: 39, hbp: 1, er: 18, w: 3, l: 1, sv: 0 },
      { id: 'smithda06', name: 'Dan Smith', role: 'RP', throws: 'R', age: 27, g: 32, gs: 0, outs: 113, h: 37, hr: 9, bb: 18, so: 33, hbp: 2, er: 19, w: 2, l: 2, sv: 0 },
    ],
    reservePitchers: [
      { id: 'almonhe01', name: 'Hector Almonte', role: 'RP', throws: 'R', age: 27, g: 35, gs: 0, outs: 110, h: 43, hr: 5, bb: 24, so: 32, hbp: 2, er: 29, w: 1, l: 2, sv: 0, rk: true },
      { id: 'armasto02', name: 'Tony Armas', role: 'RP', throws: 'R', age: 25, g: 5, gs: 5, outs: 93, h: 26, hr: 3, bb: 13, so: 24, hbp: 1, er: 13, w: 2, l: 1, sv: 0 },
      { id: 'manonju01', name: 'Julio Manon', role: 'RP', throws: 'R', age: 30, g: 23, gs: 0, outs: 85, h: 26, hr: 3, bb: 17, so: 15, hbp: 1, er: 13, w: 1, l: 2, sv: 1, rk: true },
      { id: 'knotter01', name: 'Eric Knott', role: 'RP', throws: 'L', age: 28, g: 13, gs: 1, outs: 58, h: 24, hr: 2, bb: 5, so: 17, hbp: 1, er: 10, w: 1, l: 2, sv: 0, rk: true },
      { id: 'kimsu01', name: 'Sun-Woo Kim', role: 'RP', throws: 'R', age: 25, g: 4, gs: 3, outs: 42, h: 21, hr: 3, bb: 7, so: 9, hbp: 2, er: 11, w: 0, l: 1, sv: 0 },
    ],
  },
  // CHC (CHN 2003)
  {
    franchiseId: 'CHC',
    season: 2003,
    batters: [
      { id: 'milleda02', name: 'Damian Miller', pos: 'C', bats: 'R', age: 33, pa: 400, h: 86, double: 21, triple: 1, hr: 11, bb: 40, so: 92, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 73, arm: 78 },
      { id: 'karroer01', name: 'Eric Karros', pos: '1B', bats: 'R', age: 35, pa: 365, h: 90, double: 16, triple: 1, hr: 10, bb: 27, so: 52, hbp: 2, sb: 2, cs: 1, fld: 66 },
      { id: 'grudzma01', name: 'Mark Grudzielanek', pos: '2B', bats: 'R', age: 33, pa: 531, h: 143, double: 29, triple: 1, hr: 6, bb: 26, so: 73, hbp: 8, sb: 5, cs: 2, sec: 'SS', fld: 72 },
      { id: 'bellhma01', name: 'Mark Bellhorn', pos: '3B', bats: 'S', age: 28, pa: 307, h: 60, double: 12, triple: 2, hr: 9, bb: 46, so: 83, hbp: 3, sb: 4, cs: 4, sec: '2B', fld: 61 },
      { id: 'gonzaal01', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 30, pa: 601, h: 129, double: 31, triple: 2, hr: 19, bb: 46, so: 130, hbp: 5, sb: 6, cs: 4, sec: '2B', fld: 72 },
      { id: 'aloumo01', name: 'Moises Alou', pos: 'LF', bats: 'R', age: 36, pa: 638, h: 163, double: 33, triple: 1, hr: 22, bb: 61, so: 68, hbp: 4, sb: 5, cs: 1, sec: 'RF', fld: 55, arm: 62 },
      { id: 'patteco01', name: 'Corey Patterson', pos: 'CF', bats: 'L', age: 23, pa: 347, h: 89, double: 16, triple: 4, hr: 10, bb: 13, so: 78, hbp: 3, sb: 13, cs: 3, sec: 'LF', fld: 54, arm: 67 },
      { id: 'sosasa01', name: 'Sammy Sosa', pos: 'RF', bats: 'R', age: 34, pa: 589, h: 145, double: 21, triple: 1, hr: 44, bb: 79, so: 134, hbp: 4, sb: 1, cs: 1, sec: 'CF', fld: 55, arm: 61 },
      { id: 'martira03', name: 'Ramon Martinez', pos: 'DH', bats: 'R', age: 30, pa: 333, h: 80, double: 16, triple: 2, hr: 4, bb: 25, so: 46, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 52 },
    ],
    bench: [
      { id: 'choihe01', name: 'Hee-Seop Choi', pos: '1B', bats: 'L', age: 24, pa: 245, h: 43, double: 15, triple: 0, hr: 8, bb: 36, so: 70, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 70, rk: true },
      { id: 'bakopa01', name: 'Paul Bako', pos: 'C', bats: 'L', age: 31, pa: 213, h: 44, double: 11, triple: 2, hr: 2, bb: 20, so: 43, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 68, arm: 72 },
      { id: 'oleartr01', name: 'Troy O\'Leary', pos: 'LF', bats: 'L', age: 33, pa: 194, h: 43, double: 8, triple: 1, hr: 4, bb: 17, so: 32, hbp: 2, sb: 1, cs: 1, sec: 'RF', fld: 65, arm: 74 },
      { id: 'goodwto01', name: 'Tom Goodwin', pos: 'CF', bats: 'L', age: 34, pa: 184, h: 45, double: 7, triple: 1, hr: 1, bb: 13, so: 32, hbp: 0, sb: 17, cs: 4, sec: 'LF', fld: 57, arm: 59 },
      { id: 'harrile01', name: 'Lenny Harris', pos: '3B', bats: 'L', age: 38, pa: 163, h: 36, double: 5, triple: 1, hr: 1, bb: 13, so: 16, hbp: 1, sb: 2, cs: 1, sec: '2B', fld: 56 },
    ],
    pitchers: [
      { id: 'zambrca01', name: 'Carlos Zambrano', role: 'SP', throws: 'R', age: 22, g: 32, gs: 32, outs: 642, h: 187, hr: 12, bb: 102, so: 170, hbp: 10, er: 79, w: 13, l: 11, sv: 0, fld: 80 },
      { id: 'priorma01', name: 'Mark Prior', role: 'SP', throws: 'R', age: 22, g: 30, gs: 30, outs: 634, h: 181, hr: 18, bb: 55, so: 249, hbp: 10, er: 62, w: 18, l: 6, sv: 0, fld: 53 },
      { id: 'woodke02', name: 'Kerry Wood', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 633, h: 157, hr: 22, bb: 100, so: 247, hbp: 18, er: 79, w: 14, l: 11, sv: 0, fld: 68 },
      { id: 'clemema01', name: 'Matt Clement', role: 'SP', throws: 'R', age: 28, g: 32, gs: 32, outs: 605, h: 170, hr: 20, bb: 83, so: 182, hbp: 12, er: 91, w: 14, l: 12, sv: 0, fld: 69 },
      { id: 'estessh01', name: 'Shawn Estes', role: 'SP', throws: 'L', age: 30, g: 29, gs: 28, outs: 457, h: 172, hr: 16, bb: 81, so: 105, hbp: 4, er: 90, w: 8, l: 11, sv: 0, fld: 75 },
      { id: 'borowjo01', name: 'Joe Borowski', role: 'CL', throws: 'R', age: 32, g: 68, gs: 0, outs: 205, h: 56, hr: 6, bb: 20, so: 66, hbp: 1, er: 21, w: 2, l: 2, sv: 33 },
      { id: 'farnsky01', name: 'Kyle Farnsworth', role: 'RP', throws: 'R', age: 27, g: 77, gs: 0, outs: 229, h: 61, hr: 8, bb: 34, so: 87, hbp: 1, er: 34, w: 3, l: 2, sv: 0 },
      { id: 'remlimi01', name: 'Mike Remlinger', role: 'RP', throws: 'L', age: 37, g: 73, gs: 0, outs: 207, h: 55, hr: 8, bb: 33, so: 81, hbp: 2, er: 23, w: 6, l: 5, sv: 0 },
      { id: 'alfonan01', name: 'Antonio Alfonseca', role: 'RP', throws: 'R', age: 31, g: 60, gs: 0, outs: 199, h: 72, hr: 6, bb: 28, so: 52, hbp: 3, er: 35, w: 3, l: 1, sv: 0 },
      { id: 'cruzju02', name: 'Juan Cruz', role: 'RP', throws: 'R', age: 24, g: 25, gs: 6, outs: 183, h: 60, hr: 7, bb: 32, so: 58, hbp: 6, er: 33, w: 2, l: 7, sv: 0 },
      { id: 'guthrma01', name: 'Mark Guthrie', role: 'RP', throws: 'L', age: 37, g: 65, gs: 0, outs: 128, h: 38, hr: 5, bb: 20, so: 34, hbp: 2, er: 15, w: 2, l: 3, sv: 0 },
    ],
    reservePitchers: [
      { id: 'veresda01', name: 'Dave Veres', role: 'RP', throws: 'R', age: 36, g: 31, gs: 0, outs: 98, h: 30, hr: 5, bb: 12, so: 27, hbp: 1, er: 14, w: 2, l: 1, sv: 1 },
      { id: 'welleto01', name: 'Todd Wellemeyer', role: 'RP', throws: 'R', age: 24, g: 15, gs: 0, outs: 83, h: 25, hr: 5, bb: 19, so: 30, hbp: 0, er: 20, w: 1, l: 1, sv: 1, rk: true },
    ],
  },
  // CIN (CIN 2003)
  {
    franchiseId: 'CIN',
    season: 2003,
    batters: [
      { id: 'larueja01', name: 'Jason LaRue', pos: 'C', bats: 'R', age: 29, pa: 437, h: 91, double: 22, triple: 1, hr: 15, bb: 31, so: 117, hbp: 17, sb: 2, cs: 3, sec: '1B', fld: 67, arm: 67 },
      { id: 'caseyse01', name: 'Sean Casey', pos: '1B', bats: 'L', age: 28, pa: 629, h: 163, double: 27, triple: 2, hr: 12, bb: 52, so: 61, hbp: 5, sb: 3, cs: 1, sec: '3B', fld: 68 },
      { id: 'jimenda01', name: 'D\'Angelo Jimenez', pos: '2B', bats: 'S', age: 25, pa: 639, h: 150, double: 24, triple: 7, hr: 10, bb: 67, so: 95, hbp: 2, sb: 9, cs: 6, sec: 'SS', fld: 69 },
      { id: 'booneaa01', name: 'Aaron Boone', pos: '3B', bats: 'R', age: 30, pa: 654, h: 153, double: 34, triple: 3, hr: 24, bb: 49, so: 105, hbp: 9, sb: 24, cs: 5, sec: 'SS', fld: 76 },
      { id: 'larkiba01', name: 'Barry Larkin', pos: 'SS', bats: 'R', age: 39, pa: 265, h: 62, double: 17, triple: 1, hr: 3, bb: 23, so: 29, hbp: 1, sb: 4, cs: 1, fld: 67 },
      { id: 'dunnad01', name: 'Adam Dunn', pos: 'LF', bats: 'L', age: 23, pa: 469, h: 89, double: 17, triple: 1, hr: 23, bb: 79, so: 122, hbp: 8, sb: 10, cs: 4, sec: '1B', fld: 70, arm: 67 },
      { id: 'taylore01', name: 'Reggie Taylor', pos: 'CF', bats: 'L', age: 26, pa: 194, h: 42, double: 7, triple: 2, hr: 5, bb: 10, so: 58, hbp: 1, sb: 7, cs: 3, sec: 'LF', fld: 73, arm: 69 },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'RF', bats: 'R', age: 27, pa: 534, h: 142, double: 24, triple: 1, hr: 26, bb: 25, so: 94, hbp: 12, sb: 3, cs: 5, sec: 'LF', fld: 64, arm: 72 },
      { id: 'branyru01', name: 'Russell Branyan', pos: 'DH', bats: 'L', age: 27, pa: 205, h: 40, double: 9, triple: 0, hr: 11, bb: 25, so: 71, hbp: 1, sb: 1, cs: 1, sec: 'LF', fld: 96 },
    ],
    bench: [
      { id: 'castrju01', name: 'Juan Castro', pos: '2B', bats: 'R', age: 31, pa: 348, h: 78, double: 14, triple: 1, hr: 8, bb: 19, so: 61, hbp: 0, sb: 1, cs: 2, sec: 'SS', fld: 78 },
      { id: 'kearnau01', name: 'Austin Kearns', pos: 'RF', bats: 'R', age: 23, pa: 338, h: 83, double: 15, triple: 1, hr: 13, bb: 41, so: 66, hbp: 5, sb: 5, cs: 2, sec: 'CF', fld: 87, arm: 70 },
      { id: 'olmedra01', name: 'Ray Olmedo', pos: 'SS', bats: 'S', age: 22, pa: 250, h: 55, double: 6, triple: 1, hr: 0, bb: 13, so: 46, hbp: 0, sb: 1, cs: 1, sec: '2B', fld: 56, rk: true },
      { id: 'lopezfe01', name: 'Felipe Lopez', pos: 'SS', bats: 'S', age: 23, pa: 229, h: 46, double: 9, triple: 2, hr: 4, bb: 22, so: 61, hbp: 1, sb: 6, cs: 4, sec: '3B', fld: 57 },
      { id: 'mateoru01', name: 'Ruben Mateo', pos: 'RF', bats: 'R', age: 25, pa: 224, h: 50, double: 10, triple: 0, hr: 3, bb: 13, so: 50, hbp: 4, sb: 0, cs: 0, sec: 'CF', fld: 73, arm: 66 },
    ],
    reserveBatters: [
      { id: 'stinnke01', name: 'Kelly Stinnett', pos: 'C', bats: 'R', age: 33, pa: 207, h: 44, double: 12, triple: 0, hr: 5, bb: 18, so: 53, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 72, arm: 71 },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'CF', bats: 'L', age: 33, pa: 201, h: 45, double: 10, triple: 1, hr: 10, bb: 25, so: 38, hbp: 4, sb: 1, cs: 1, sec: 'LF', fld: 65, arm: 74 },
      { id: 'penawi01', name: 'Wily Mo Pena', pos: 'CF', bats: 'R', age: 21, pa: 181, h: 36, double: 6, triple: 1, hr: 5, bb: 11, so: 57, hbp: 3, sb: 3, cs: 2, sec: 'RF', fld: 60, arm: 64, rk: true },
      { id: 'freelry01', name: 'Ryan Freel', pos: 'CF', bats: 'R', age: 27, pa: 153, h: 39, double: 6, triple: 1, hr: 4, bb: 9, so: 14, hbp: 4, sb: 9, cs: 4, sec: 'LF', fld: 78, arm: 77, rk: true },
      { id: 'larsobr01', name: 'Brandon Larson', pos: '3B', bats: 'R', age: 27, pa: 104, h: 13, double: 2, triple: 0, hr: 2, bb: 12, so: 28, hbp: 0, sb: 2, cs: 1, sec: '1B', fld: 82, rk: true },
    ],
    pitchers: [
      { id: 'graveda01', name: 'Danny Graves', role: 'SP', throws: 'R', age: 29, g: 30, gs: 26, outs: 507, h: 195, hr: 24, bb: 42, so: 75, hbp: 7, er: 89, w: 4, l: 15, sv: 2, fld: 81 },
      { id: 'wilsopa02', name: 'Paul Wilson', role: 'SP', throws: 'R', age: 30, g: 28, gs: 28, outs: 500, h: 187, hr: 24, bb: 54, so: 99, hbp: 10, er: 87, w: 8, l: 10, sv: 0, fld: 65 },
      { id: 'dempsry01', name: 'Ryan Dempster', role: 'SP', throws: 'R', age: 26, g: 22, gs: 20, outs: 347, h: 131, hr: 15, bb: 62, so: 89, hbp: 5, er: 75, w: 3, l: 7, sv: 0 },
      { id: 'hayneji01', name: 'Jimmy Haynes', role: 'SP', throws: 'R', age: 30, g: 18, gs: 18, outs: 283, h: 112, hr: 12, bb: 48, so: 60, hbp: 2, er: 55, w: 2, l: 12, sv: 0 },
      { id: 'haranaa01', name: 'Aaron Harang', role: 'SP', throws: 'R', age: 25, g: 16, gs: 15, outs: 229, h: 82, hr: 9, bb: 29, so: 49, hbp: 2, er: 43, w: 5, l: 6, sv: 0 },
      { id: 'willisc01', name: 'Scott Williamson', role: 'CL', throws: 'R', age: 27, g: 66, gs: 0, outs: 188, h: 49, hr: 6, bb: 34, so: 75, hbp: 2, er: 26, w: 5, l: 4, sv: 21 },
      { id: 'riedljo01', name: 'John Riedling', role: 'RP', throws: 'R', age: 27, g: 55, gs: 8, outs: 303, h: 100, hr: 6, bb: 49, so: 66, hbp: 4, er: 48, w: 2, l: 3, sv: 1 },
      { id: 'heredfe01', name: 'Felix Heredia', role: 'RP', throws: 'L', age: 28, g: 69, gs: 0, outs: 261, h: 78, hr: 10, bb: 35, so: 48, hbp: 3, er: 30, w: 5, l: 3, sv: 1 },
      { id: 'reitsch01', name: 'Chris Reitsma', role: 'RP', throws: 'R', age: 25, g: 57, gs: 3, outs: 252, h: 90, hr: 12, bb: 23, so: 49, hbp: 2, er: 39, w: 9, l: 5, sv: 12 },
      { id: 'sullisc01', name: 'Scott Sullivan', role: 'RP', throws: 'R', age: 32, g: 65, gs: 0, outs: 192, h: 59, hr: 8, bb: 27, so: 56, hbp: 5, er: 31, w: 6, l: 0, sv: 0 },
      { id: 'reithbr01', name: 'Brian Reith', role: 'RP', throws: 'R', age: 25, g: 42, gs: 1, outs: 184, h: 65, hr: 10, bb: 34, so: 38, hbp: 1, er: 32, w: 2, l: 3, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'merckke01', name: 'Kent Mercker', role: 'RP', throws: 'L', age: 35, g: 67, gs: 0, outs: 166, h: 52, hr: 9, bb: 30, so: 46, hbp: 1, er: 20, w: 0, l: 2, sv: 1 },
      { id: 'vanpoto01', name: 'Todd Van Poppel', role: 'RP', throws: 'R', age: 31, g: 16, gs: 5, outs: 145, h: 49, hr: 8, bb: 18, so: 47, hbp: 1, er: 26, w: 3, l: 1, sv: 0 },
      { id: 'whitega01', name: 'Gabe White', role: 'RP', throws: 'L', age: 31, g: 46, gs: 0, outs: 140, h: 44, hr: 7, bb: 10, so: 32, hbp: 2, er: 21, w: 5, l: 1, sv: 0 },
      { id: 'balejo01', name: 'John Bale', role: 'RP', throws: 'L', age: 29, g: 10, gs: 9, outs: 139, h: 47, hr: 6, bb: 15, so: 37, hbp: 2, er: 22, w: 1, l: 2, sv: 0, rk: true },
      { id: 'anderji02', name: 'Jimmy Anderson', role: 'RP', throws: 'L', age: 27, g: 8, gs: 7, outs: 116, h: 50, hr: 5, bb: 17, so: 15, hbp: 1, er: 27, w: 1, l: 5, sv: 0 },
    ],
  },
  // MIL (MIL 2003)
  {
    franchiseId: 'MIL',
    season: 2003,
    batters: [
      { id: 'perezed02', name: 'Eddie Perez', pos: 'C', bats: 'R', age: 35, pa: 375, h: 92, double: 19, triple: 1, hr: 9, bb: 17, so: 52, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 68, arm: 65 },
      { id: 'sexsori01', name: 'Richie Sexson', pos: '1B', bats: 'R', age: 28, pa: 718, h: 170, double: 32, triple: 2, hr: 41, bb: 86, so: 157, hbp: 9, sb: 1, cs: 2, sec: 'LF', fld: 75 },
      { id: 'younger01', name: 'Eric Young', pos: '2B', bats: 'R', age: 36, pa: 541, h: 128, double: 26, triple: 2, hr: 9, bb: 46, so: 40, hbp: 6, sb: 28, cs: 11, fld: 64 },
      { id: 'helmswe01', name: 'Wes Helms', pos: '3B', bats: 'R', age: 27, pa: 536, h: 121, double: 24, triple: 1, hr: 21, bb: 40, so: 131, hbp: 9, sb: 1, cs: 1, sec: '1B', fld: 64 },
      { id: 'claytro01', name: 'Royce Clayton', pos: 'SS', bats: 'R', age: 33, pa: 543, h: 117, double: 18, triple: 2, hr: 11, bb: 42, so: 91, hbp: 3, sb: 7, cs: 3, sec: '2B', fld: 67 },
      { id: 'jenkige01', name: 'Geoff Jenkins', pos: 'LF', bats: 'L', age: 28, pa: 554, h: 137, double: 30, triple: 2, hr: 26, bb: 53, so: 125, hbp: 8, sb: 1, cs: 1, sec: 'RF', fld: 71, arm: 76 },
      { id: 'podsesc01', name: 'Scott Podsednik', pos: 'CF', bats: 'L', age: 27, pa: 628, h: 173, double: 28, triple: 8, hr: 9, bb: 57, so: 93, hbp: 4, sb: 42, cs: 10, sec: 'RF', fld: 72, arm: 66, rk: true },
      { id: 'vandejo02', name: 'John Vander Wal', pos: 'RF', bats: 'L', age: 37, pa: 374, h: 85, double: 24, triple: 2, hr: 12, bb: 44, so: 96, hbp: 1, sb: 2, cs: 2, sec: 'LF', fld: 75, arm: 67 },
      { id: 'ginteke01', name: 'Keith Ginter', pos: 'DH', bats: 'R', age: 27, pa: 415, h: 90, double: 18, triple: 2, hr: 13, bb: 42, so: 84, hbp: 15, sb: 1, cs: 1, sec: '3B', fld: 67, rk: true },
    ],
    bench: [
      { id: 'clarkbr02', name: 'Brady Clark', pos: 'RF', bats: 'R', age: 30, pa: 354, h: 82, double: 19, triple: 1, hr: 6, bb: 25, so: 40, hbp: 8, sb: 11, cs: 3, sec: 'LF', fld: 76, arm: 70 },
      { id: 'osikke01', name: 'Keith Osik', pos: 'C', bats: 'R', age: 34, pa: 275, h: 55, double: 11, triple: 0, hr: 3, bb: 27, so: 48, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 68, arm: 71 },
      { id: 'hallbi03', name: 'Bill Hall', pos: '2B', bats: 'R', age: 23, pa: 155, h: 36, double: 8, triple: 2, hr: 5, bb: 8, so: 31, hbp: 1, sb: 1, cs: 2, sec: 'SS', fld: 77, rk: true },
      { id: 'cruzen01', name: 'Enrique Cruz', pos: 'SS', bats: 'R', age: 21, pa: 76, h: 6, double: 1, triple: 0, hr: 0, bb: 4, so: 30, hbp: 1, sb: 0, cs: 0, sec: '2B', rk: true },
      { id: 'smithma03', name: 'Mark Smith', pos: 'LF', bats: 'R', age: 33, pa: 69, h: 15, double: 4, triple: 0, hr: 2, bb: 6, so: 12, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
    ],
    reserveBatters: [
      { id: 'contija01', name: 'Jason Conti', pos: 'RF', bats: 'L', age: 28, pa: 52, h: 12, double: 3, triple: 0, hr: 1, bb: 3, so: 13, hbp: 0, sb: 1, cs: 1, sec: 'CF' },
    ],
    pitchers: [
      { id: 'sheetbe01', name: 'Ben Sheets', role: 'SP', throws: 'R', age: 24, g: 34, gs: 34, outs: 662, h: 232, hr: 26, bb: 55, so: 157, hbp: 7, er: 105, w: 11, l: 13, sv: 0, fld: 68 },
      { id: 'frankwa01', name: 'Wayne Franklin', role: 'SP', throws: 'L', age: 29, g: 36, gs: 34, outs: 584, h: 197, hr: 34, bb: 98, so: 118, hbp: 9, er: 115, w: 10, l: 13, sv: 0, fld: 69 },
      { id: 'kinnema01', name: 'Matt Kinney', role: 'SP', throws: 'R', age: 26, g: 33, gs: 31, outs: 572, h: 204, hr: 29, bb: 82, so: 147, hbp: 5, er: 107, w: 10, l: 13, sv: 0, fld: 69 },
      { id: 'ruschgl01', name: 'Glendon Rusch', role: 'SP', throws: 'L', age: 28, g: 32, gs: 19, outs: 370, h: 157, hr: 15, bb: 44, so: 95, hbp: 4, er: 76, w: 1, l: 12, sv: 1 },
      { id: 'obermwe01', name: 'Wes Obermueller', role: 'SP', throws: 'R', age: 26, g: 12, gs: 11, outs: 197, h: 83, hr: 11, bb: 24, so: 34, hbp: 6, er: 40, w: 2, l: 5, sv: 0, rk: true },
      { id: 'kolbda01', name: 'Danny Kolb', role: 'CL', throws: 'R', age: 28, g: 37, gs: 0, outs: 124, h: 34, hr: 2, bb: 22, so: 34, hbp: 1, er: 13, w: 1, l: 2, sv: 21 },
      { id: 'dejeami01', name: 'Mike DeJean', role: 'RP', throws: 'R', age: 32, g: 76, gs: 0, outs: 248, h: 81, hr: 10, bb: 41, so: 71, hbp: 3, er: 36, w: 5, l: 8, sv: 19 },
      { id: 'estrele01', name: 'Leo Estrella', role: 'RP', throws: 'R', age: 28, g: 58, gs: 0, outs: 198, h: 75, hr: 10, bb: 21, so: 25, hbp: 3, er: 32, w: 7, l: 3, sv: 3, rk: true },
      { id: 'vizcalu01', name: 'Luis Vizcaino', role: 'RP', throws: 'R', age: 28, g: 75, gs: 0, outs: 186, h: 57, hr: 11, bb: 25, so: 62, hbp: 2, er: 34, w: 4, l: 3, sv: 0 },
      { id: 'kiescbr01', name: 'Brooks Kieschnick', role: 'RP', throws: 'R', age: 31, g: 42, gs: 0, outs: 159, h: 66, hr: 5, bb: 13, so: 39, hbp: 6, er: 31, w: 1, l: 1, sv: 0, rk: true },
      { id: 'leskacu01', name: 'Curt Leskanic', role: 'RP', throws: 'R', age: 35, g: 53, gs: 0, outs: 158, h: 41, hr: 4, bb: 27, so: 49, hbp: 1, er: 15, w: 5, l: 0, sv: 2 },
    ],
    reservePitchers: [
      { id: 'delosva01', name: 'Valerio De Los Santos', role: 'RP', throws: 'L', age: 30, g: 51, gs: 0, outs: 156, h: 43, hr: 6, bb: 25, so: 38, hbp: 4, er: 23, w: 4, l: 3, sv: 1 },
      { id: 'fordma01', name: 'Matt Ford', role: 'RP', throws: 'L', age: 22, g: 25, gs: 4, outs: 131, h: 46, hr: 5, bb: 21, so: 26, hbp: 1, er: 21, w: 0, l: 3, sv: 0, rk: true },
      { id: 'burbada01', name: 'Dave Burba', role: 'RP', throws: 'R', age: 36, g: 17, gs: 2, outs: 130, h: 47, hr: 5, bb: 17, so: 31, hbp: 2, er: 24, w: 1, l: 1, sv: 0 },
      { id: 'queveru01', name: 'Ruben Quevedo', role: 'RP', throws: 'R', age: 24, g: 9, gs: 8, outs: 128, h: 50, hr: 10, bb: 22, so: 29, hbp: 1, er: 29, w: 1, l: 4, sv: 0 },
      { id: 'ritchto01', name: 'Todd Ritchie', role: 'RP', throws: 'R', age: 31, g: 5, gs: 5, outs: 85, h: 35, hr: 4, bb: 10, so: 17, hbp: 2, er: 17, w: 1, l: 2, sv: 0 },
    ],
  },
  // PIT (PIT 2003)
  {
    franchiseId: 'PIT',
    season: 2003,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 29, pa: 665, h: 179, double: 27, triple: 3, hr: 6, bb: 50, so: 39, hbp: 19, sb: 11, cs: 9, sec: '1B', fld: 69, arm: 67 },
      { id: 'simonra01', name: 'Randall Simon', pos: '1B', bats: 'L', age: 28, pa: 431, h: 118, double: 17, triple: 1, hr: 15, bb: 15, so: 33, hbp: 3, sb: 0, cs: 1, sec: '3B', fld: 75 },
      { id: 'nunezab01', name: 'Abraham Nunez', pos: '2B', bats: 'S', age: 27, pa: 351, h: 77, double: 11, triple: 5, hr: 3, bb: 29, so: 54, hbp: 3, sb: 7, cs: 3, sec: 'SS', fld: 78 },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 25, pa: 670, h: 162, double: 33, triple: 1, hr: 27, bb: 39, so: 103, hbp: 10, sb: 3, cs: 2, sec: '1B', fld: 68 },
      { id: 'wilsoja02', name: 'Jack Wilson', pos: 'SS', bats: 'R', age: 25, pa: 615, h: 140, double: 22, triple: 3, hr: 7, bb: 35, so: 79, hbp: 4, sb: 5, cs: 4, sec: '2B', fld: 75 },
      { id: 'gilesbr02', name: 'Brian Giles', pos: 'LF', bats: 'L', age: 32, pa: 609, h: 147, double: 34, triple: 6, hr: 28, bb: 108, so: 63, hbp: 7, sb: 9, cs: 4, sec: 'CF', fld: 76, arm: 66 },
      { id: 'loftoke01', name: 'Kenny Lofton', pos: 'CF', bats: 'L', age: 36, pa: 610, h: 151, double: 30, triple: 8, hr: 12, bb: 55, so: 62, hbp: 3, sb: 28, cs: 10, fld: 69, arm: 71 },
      { id: 'sandere02', name: 'Reggie Sanders', pos: 'RF', bats: 'R', age: 35, pa: 498, h: 120, double: 24, triple: 4, hr: 27, bb: 40, so: 111, hbp: 7, sb: 15, cs: 6, sec: 'LF', fld: 69, arm: 68 },
      { id: 'wilsocr03', name: 'Craig Wilson', pos: 'DH', bats: 'R', age: 26, pa: 358, h: 83, double: 14, triple: 3, hr: 17, bb: 31, so: 94, hbp: 15, sb: 3, cs: 2, sec: 'RF', fld: 83, arm: 73 },
    ],
    bench: [
      { id: 'stairma01', name: 'Matt Stairs', pos: 'RF', bats: 'L', age: 35, pa: 357, h: 82, double: 19, triple: 1, hr: 18, bb: 44, so: 62, hbp: 6, sb: 1, cs: 1, sec: 'LF', fld: 60, arm: 74 },
      { id: 'rebouje01', name: 'Jeff Reboulet', pos: '2B', bats: 'R', age: 39, pa: 299, h: 63, double: 12, triple: 2, hr: 3, bb: 30, so: 51, hbp: 3, sb: 1, cs: 1, sec: 'SS', fld: 83 },
      { id: 'redmati01', name: 'Tike Redman', pos: 'CF', bats: 'L', age: 26, pa: 248, h: 73, double: 15, triple: 5, hr: 3, bb: 13, so: 22, hbp: 2, sb: 7, cs: 4, sec: 'RF', fld: 69, arm: 63 },
      { id: 'mackoro01', name: 'Rob Mackowiak', pos: '3B', bats: 'L', age: 27, pa: 193, h: 44, double: 8, triple: 2, hr: 6, bb: 16, so: 51, hbp: 3, sb: 5, cs: 1, sec: '2B' },
      { id: 'reesepo01', name: 'Pokey Reese', pos: '2B', bats: 'R', age: 30, pa: 120, h: 26, double: 5, triple: 0, hr: 1, bb: 10, so: 23, hbp: 1, sb: 5, cs: 0, sec: 'SS', fld: 88 },
    ],
    reserveBatters: [
      { id: 'bayja01', name: 'Jason Bay', pos: 'LF', bats: 'R', age: 24, pa: 107, h: 25, double: 7, triple: 1, hr: 4, bb: 19, so: 29, hbp: 1, sb: 3, cs: 1, sec: 'RF', fld: 68, arm: 64, rk: true },
      { id: 'riverca01', name: 'Carlos Rivera', pos: '1B', bats: 'L', age: 25, pa: 107, h: 21, double: 5, triple: 0, hr: 3, bb: 8, so: 28, hbp: 1, sb: 0, cs: 0, sec: '3B', fld: 62, rk: true },
      { id: 'youngke01', name: 'Kevin Young', pos: '1B', bats: 'R', age: 34, pa: 96, h: 20, double: 5, triple: 0, hr: 3, bb: 9, so: 21, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 77 },
      { id: 'hyzduad01', name: 'Adam Hyzdu', pos: 'CF', bats: 'R', age: 31, pa: 75, h: 14, double: 3, triple: 0, hr: 3, bb: 9, so: 19, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 69, arm: 71 },
    ],
    pitchers: [
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 28, g: 32, gs: 31, outs: 612, h: 216, hr: 26, bb: 59, so: 108, hbp: 8, er: 103, w: 13, l: 11, sv: 0, fld: 75 },
      { id: 'wellski01', name: 'Kip Wells', role: 'SP', throws: 'R', age: 26, g: 31, gs: 31, outs: 592, h: 182, hr: 22, bb: 74, so: 140, hbp: 8, er: 77, w: 10, l: 9, sv: 0, fld: 64 },
      { id: 'damicje01', name: 'Jeff D\'Amico', role: 'SP', throws: 'R', age: 27, g: 29, gs: 29, outs: 526, h: 199, hr: 25, bb: 44, so: 109, hbp: 6, er: 96, w: 9, l: 16, sv: 0, fld: 61 },
      { id: 'foggjo01', name: 'Josh Fogg', role: 'SP', throws: 'R', age: 26, g: 26, gs: 26, outs: 426, h: 157, hr: 21, bb: 45, so: 79, hbp: 8, er: 76, w: 10, l: 9, sv: 0, fld: 71 },
      { id: 'torresa01', name: 'Salomon Torres', role: 'SP', throws: 'R', age: 31, g: 41, gs: 16, outs: 363, h: 126, hr: 17, bb: 43, so: 79, hbp: 8, er: 60, w: 7, l: 5, sv: 2 },
      { id: 'willimi03', name: 'Mike Williams', role: 'CL', throws: 'R', age: 34, g: 68, gs: 0, outs: 189, h: 64, hr: 6, bb: 35, so: 46, hbp: 2, er: 34, w: 1, l: 7, sv: 28 },
      { id: 'tavarju01', name: 'Julian Tavarez', role: 'RP', throws: 'R', age: 30, g: 64, gs: 0, outs: 251, h: 84, hr: 4, bb: 32, so: 39, hbp: 6, er: 40, w: 3, l: 3, sv: 11 },
      { id: 'meadobr01', name: 'Brian Meadows', role: 'RP', throws: 'R', age: 27, g: 34, gs: 7, outs: 229, h: 89, hr: 9, bb: 14, so: 37, hbp: 1, er: 40, w: 2, l: 1, sv: 1 },
      { id: 'beimejo01', name: 'Joe Beimel', role: 'RP', throws: 'L', age: 26, g: 69, gs: 0, outs: 187, h: 69, hr: 7, bb: 32, so: 39, hbp: 3, er: 35, w: 1, l: 3, sv: 0 },
      { id: 'boehrbr01', name: 'Brian Boehringer', role: 'RP', throws: 'R', age: 34, g: 62, gs: 0, outs: 187, h: 60, hr: 8, bb: 29, so: 51, hbp: 3, er: 31, w: 5, l: 4, sv: 0 },
      { id: 'sauersc01', name: 'Scott Sauerbeck', role: 'RP', throws: 'L', age: 31, g: 79, gs: 0, outs: 170, h: 49, hr: 5, bb: 37, so: 60, hbp: 3, er: 26, w: 3, l: 5, sv: 0 },
    ],
    reservePitchers: [
      { id: 'bensokr01', name: 'Kris Benson', role: 'SP', throws: 'R', age: 28, g: 18, gs: 18, outs: 315, h: 125, hr: 14, bb: 38, so: 66, hbp: 2, er: 56, w: 5, l: 9, sv: 0 },
      { id: 'lincomi01', name: 'Mike Lincoln', role: 'RP', throws: 'R', age: 28, g: 36, gs: 0, outs: 109, h: 38, hr: 4, bb: 13, so: 26, hbp: 1, er: 15, w: 3, l: 4, sv: 5 },
      { id: 'figuene01', name: 'Nelson Figueroa', role: 'RP', throws: 'R', age: 29, g: 12, gs: 3, outs: 106, h: 33, hr: 6, bb: 13, so: 21, hbp: 2, er: 16, w: 2, l: 1, sv: 0 },
      { id: 'coreyma02', name: 'Mark Corey', role: 'RP', throws: 'R', age: 28, g: 22, gs: 0, outs: 91, h: 32, hr: 5, bb: 14, so: 26, hbp: 2, er: 20, w: 1, l: 2, sv: 0, rk: true },
      { id: 'mahompa01', name: 'Pat Mahomes', role: 'RP', throws: 'R', age: 32, g: 9, gs: 1, outs: 67, h: 22, hr: 3, bb: 11, so: 13, hbp: 0, er: 12, w: 0, l: 1, sv: 0 },
    ],
  },
  // STL (SLN 2003)
  {
    franchiseId: 'STL',
    season: 2003,
    batters: [
      { id: 'mathemi01', name: 'Mike Matheny', pos: 'C', bats: 'R', age: 32, pa: 498, h: 107, double: 17, triple: 2, hr: 7, bb: 42, so: 79, hbp: 3, sb: 1, cs: 2, sec: '1B', fld: 77, arm: 68 },
      { id: 'martiti02', name: 'Tino Martinez', pos: '1B', bats: 'L', age: 35, pa: 547, h: 131, double: 24, triple: 2, hr: 19, bb: 51, so: 71, hbp: 5, sb: 2, cs: 1, fld: 76 },
      { id: 'hartbo01', name: 'Bo Hart', pos: '2B', bats: 'R', age: 26, pa: 321, h: 82, double: 13, triple: 5, hr: 4, bb: 12, so: 64, hbp: 6, sb: 3, cs: 1, sec: 'SS', fld: 77, rk: true },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 28, pa: 657, h: 157, double: 41, triple: 3, hr: 28, bb: 77, so: 107, hbp: 11, sb: 12, cs: 4, sec: '1B', fld: 72 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 26, pa: 663, h: 184, double: 41, triple: 2, hr: 13, bb: 59, so: 62, hbp: 2, sb: 29, cs: 7, sec: '2B', fld: 63 },
      { id: 'pujolal01', name: 'Albert Pujols', pos: 'LF', bats: 'R', age: 23, pa: 685, h: 201, double: 47, triple: 2, hr: 39, bb: 76, so: 72, hbp: 10, sb: 3, cs: 2, sec: '1B', fld: 71, arm: 71 },
      { id: 'edmonji01', name: 'Jim Edmonds', pos: 'CF', bats: 'L', age: 33, pa: 531, h: 129, double: 31, triple: 2, hr: 32, bb: 79, so: 124, hbp: 5, sb: 3, cs: 3, sec: 'LF', fld: 80, arm: 79 },
      { id: 'perezed01', name: 'Eduardo Perez', pos: 'RF', bats: 'R', age: 33, pa: 289, h: 66, double: 16, triple: 0, hr: 13, bb: 29, so: 55, hbp: 4, sb: 4, cs: 1, sec: '1B', fld: 74, arm: 62 },
      { id: 'palmeor01', name: 'Orlando Palmeiro', pos: 'DH', bats: 'L', age: 34, pa: 364, h: 88, double: 14, triple: 1, hr: 2, bb: 34, so: 30, hbp: 2, sb: 5, cs: 4, sec: 'LF', fld: 83, arm: 73 },
    ],
    bench: [
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'RF', bats: 'L', age: 27, pa: 328, h: 79, double: 13, triple: 2, hr: 15, bb: 38, so: 58, hbp: 4, sb: 5, cs: 2, sec: 'CF', fld: 82, arm: 77 },
      { id: 'cairomi01', name: 'Miguel Cairo', pos: '2B', bats: 'R', age: 29, pa: 290, h: 65, double: 14, triple: 2, hr: 4, bb: 16, so: 37, hbp: 5, sb: 3, cs: 1, sec: '3B', fld: 60 },
      { id: 'vinafe01', name: 'Fernando Vina', pos: '2B', bats: 'L', age: 34, pa: 285, h: 70, double: 13, triple: 3, hr: 2, bb: 15, so: 17, hbp: 9, sb: 6, cs: 4, sec: 'SS', fld: 70 },
      { id: 'robinke02', name: 'Kerry Robinson', pos: 'RF', bats: 'L', age: 29, pa: 221, h: 53, double: 7, triple: 3, hr: 1, bb: 10, so: 28, hbp: 1, sb: 8, cs: 2, sec: 'LF', fld: 76, arm: 59 },
      { id: 'delgawi01', name: 'Wilson Delgado', pos: '3B', bats: 'S', age: 30, pa: 140, h: 28, double: 4, triple: 0, hr: 1, bb: 10, so: 22, hbp: 1, sb: 0, cs: 0, sec: 'SS' },
    ],
    reserveBatters: [
      { id: 'marreel01', name: 'Eli Marrero', pos: 'RF', bats: 'R', age: 29, pa: 116, h: 26, double: 5, triple: 1, hr: 4, bb: 9, so: 19, hbp: 0, sb: 3, cs: 1, sec: 'LF', fld: 80, arm: 67 },
      { id: 'widgech01', name: 'Chris Widger', pos: 'C', bats: 'R', age: 32, pa: 112, h: 26, double: 9, triple: 0, hr: 0, bb: 5, so: 19, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 73, arm: 73 },
      { id: 'tagucso01', name: 'So Taguchi', pos: 'CF', bats: 'R', age: 33, pa: 59, h: 15, double: 2, triple: 1, hr: 2, bb: 4, so: 10, hbp: 0, sb: 1, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'williwo02', name: 'Woody Williams', role: 'SP', throws: 'R', age: 36, g: 34, gs: 33, outs: 662, h: 215, hr: 24, bb: 55, so: 156, hbp: 10, er: 90, w: 18, l: 9, sv: 0, fld: 74 },
      { id: 'tomkobr01', name: 'Brett Tomko', role: 'SP', throws: 'R', age: 30, g: 33, gs: 32, outs: 608, h: 240, hr: 35, bb: 60, so: 121, hbp: 4, er: 114, w: 13, l: 9, sv: 0, fld: 77 },
      { id: 'stephga01', name: 'Garrett Stephenson', role: 'SP', throws: 'R', age: 31, g: 32, gs: 27, outs: 523, h: 168, hr: 28, bb: 65, so: 96, hbp: 14, er: 90, w: 7, l: 13, sv: 0, fld: 68 },
      { id: 'morrima01', name: 'Matt Morris', role: 'SP', throws: 'R', age: 28, g: 27, gs: 27, outs: 517, h: 166, hr: 15, bb: 44, so: 130, hbp: 5, er: 66, w: 11, l: 8, sv: 0, fld: 71 },
      { id: 'simonja01', name: 'Jason Simontacchi', role: 'SP', throws: 'R', age: 29, g: 46, gs: 16, outs: 379, h: 141, hr: 19, bb: 45, so: 71, hbp: 5, er: 70, w: 9, l: 5, sv: 1 },
      { id: 'isrinja01', name: 'Jason Isringhausen', role: 'CL', throws: 'R', age: 30, g: 40, gs: 0, outs: 126, h: 31, hr: 1, bb: 15, so: 44, hbp: 0, er: 12, w: 0, l: 1, sv: 22 },
      { id: 'fasseje01', name: 'Jeff Fassero', role: 'RP', throws: 'L', age: 40, g: 62, gs: 6, outs: 233, h: 90, hr: 13, bb: 32, so: 63, hbp: 2, er: 46, w: 1, l: 7, sv: 3 },
      { id: 'eldreca01', name: 'Cal Eldred', role: 'RP', throws: 'R', age: 35, g: 62, gs: 0, outs: 202, h: 63, hr: 9, bb: 31, so: 66, hbp: 5, er: 30, w: 7, l: 4, sv: 8 },
      { id: 'yanes01', name: 'Esteban Yan', role: 'RP', throws: 'R', age: 28, g: 54, gs: 0, outs: 200, h: 78, hr: 11, bb: 24, so: 57, hbp: 5, er: 40, w: 2, l: 1, sv: 1 },
      { id: 'klinest02', name: 'Steve Kline', role: 'RP', throws: 'L', age: 30, g: 78, gs: 0, outs: 191, h: 56, hr: 4, bb: 27, so: 39, hbp: 3, er: 24, w: 5, l: 5, sv: 3 },
      { id: 'calerki01', name: 'Kiko Calero', role: 'RP', throws: 'R', age: 28, g: 26, gs: 1, outs: 115, h: 29, hr: 5, bb: 20, so: 51, hbp: 1, er: 12, w: 1, l: 1, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'harenda01', name: 'Dan Haren', role: 'SP', throws: 'R', age: 22, g: 14, gs: 14, outs: 218, h: 84, hr: 9, bb: 22, so: 43, hbp: 5, er: 41, w: 3, l: 7, sv: 0, rk: true },
      { id: 'crudami01', name: 'Mike Crudale', role: 'RP', throws: 'R', age: 26, g: 22, gs: 0, outs: 62, h: 16, hr: 1, bb: 11, so: 17, hbp: 1, er: 5, w: 0, l: 1, sv: 0 },
      { id: 'paintla01', name: 'Lance Painter', role: 'RP', throws: 'L', age: 35, g: 22, gs: 0, outs: 54, h: 18, hr: 3, bb: 8, so: 11, hbp: 0, er: 11, w: 0, l: 1, sv: 0 },
      { id: 'sprinru01', name: 'Russ Springer', role: 'RP', throws: 'R', age: 34, g: 17, gs: 0, outs: 52, h: 19, hr: 7, bb: 6, so: 11, hbp: 1, er: 16, w: 1, l: 1, sv: 0 },
    ],
  },
  // ARI (ARI 2003)
  {
    franchiseId: 'ARI',
    season: 2003,
    batters: [
      { id: 'moellch01', name: 'Chad Moeller', pos: 'C', bats: 'R', age: 28, pa: 269, h: 64, double: 18, triple: 1, hr: 6, bb: 26, so: 57, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 70, arm: 66 },
      { id: 'hillesh02', name: 'Shea Hillenbrand', pos: '1B', bats: 'R', age: 27, pa: 554, h: 146, double: 33, triple: 2, hr: 17, bb: 21, so: 73, hbp: 8, sb: 2, cs: 1, sec: '3B', fld: 67 },
      { id: 'spiveju01', name: 'Junior Spivey', pos: '2B', bats: 'R', age: 28, pa: 408, h: 99, double: 21, triple: 3, hr: 12, bb: 38, so: 81, hbp: 8, sb: 6, cs: 3, sec: 'SS', fld: 67 },
      { id: 'counscr01', name: 'Craig Counsell', pos: '3B', bats: 'L', age: 32, pa: 351, h: 80, double: 11, triple: 2, hr: 2, bb: 38, so: 38, hbp: 1, sb: 7, cs: 4, sec: '2B', fld: 78 },
      { id: 'cintral01', name: 'Alex Cintron', pos: 'SS', bats: 'S', age: 24, pa: 487, h: 136, double: 27, triple: 6, hr: 12, bb: 33, so: 37, hbp: 2, sb: 2, cs: 3, sec: '2B', fld: 66, rk: true },
      { id: 'gonzalu01', name: 'Luis Gonzalez', pos: 'LF', bats: 'L', age: 35, pa: 679, h: 173, double: 36, triple: 4, hr: 32, bb: 97, so: 73, hbp: 6, sb: 6, cs: 2, fld: 63, arm: 69 },
      { id: 'finlest01', name: 'Steve Finley', pos: 'CF', bats: 'L', age: 38, pa: 582, h: 147, double: 25, triple: 7, hr: 22, bb: 59, so: 84, hbp: 4, sb: 15, cs: 7, sec: 'RF', fld: 58, arm: 72 },
      { id: 'bautida01', name: 'Danny Bautista', pos: 'RF', bats: 'R', age: 31, pa: 314, h: 83, double: 14, triple: 3, hr: 6, bb: 21, so: 46, hbp: 3, sb: 4, cs: 2, sec: 'LF', fld: 54, arm: 61 },
      { id: 'delluda01', name: 'David Dellucci', pos: 'DH', bats: 'L', age: 29, pa: 248, h: 52, double: 11, triple: 2, hr: 5, bb: 24, so: 55, hbp: 3, sb: 7, cs: 1, sec: 'RF', fld: 67, arm: 65 },
    ],
    bench: [
      { id: 'womacto01', name: 'Tony Womack', pos: 'SS', bats: 'L', age: 33, pa: 364, h: 86, double: 13, triple: 3, hr: 2, bb: 18, so: 44, hbp: 3, sb: 16, cs: 6, sec: '2B', fld: 58 },
      { id: 'katama01', name: 'Matt Kata', pos: '2B', bats: 'S', age: 25, pa: 322, h: 74, double: 16, triple: 5, hr: 7, bb: 25, so: 53, hbp: 1, sb: 3, cs: 2, sec: '3B', fld: 74, rk: true },
      { id: 'overbly01', name: 'Lyle Overbay', pos: '1B', bats: 'L', age: 26, pa: 293, h: 69, double: 20, triple: 0, hr: 4, bb: 34, so: 69, hbp: 2, sb: 1, cs: 0, sec: '3B', fld: 81, rk: true },
      { id: 'barajro01', name: 'Rod Barajas', pos: 'C', bats: 'R', age: 27, pa: 239, h: 48, double: 14, triple: 0, hr: 4, bb: 13, so: 42, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 78 },
      { id: 'baergca01', name: 'Carlos Baerga', pos: '1B', bats: 'S', age: 34, pa: 231, h: 68, double: 13, triple: 0, hr: 3, bb: 15, so: 21, hbp: 2, sb: 3, cs: 1, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'mccraqu01', name: 'Quinton McCracken', pos: 'RF', bats: 'S', age: 32, pa: 226, h: 54, double: 10, triple: 4, hr: 1, bb: 17, so: 37, hbp: 1, sb: 4, cs: 2, sec: 'CF', fld: 52, arm: 63 },
      { id: 'hammoro01', name: 'Robby Hammock', pos: 'C', bats: 'R', age: 26, pa: 216, h: 55, double: 10, triple: 2, hr: 8, bb: 17, so: 44, hbp: 2, sb: 3, cs: 2, sec: '1B', fld: 66, arm: 68, rk: true },
      { id: 'willima04', name: 'Matt Williams', pos: '3B', bats: 'R', age: 37, pa: 156, h: 37, double: 8, triple: 0, hr: 6, bb: 13, so: 26, hbp: 1, sb: 1, cs: 0, sec: 'SS', fld: 67 },
      { id: 'gracema01', name: 'Mark Grace', pos: '1B', bats: 'L', age: 39, pa: 155, h: 34, double: 8, triple: 0, hr: 3, bb: 19, so: 13, hbp: 1, sb: 0, cs: 0, fld: 69 },
    ],
    pitchers: [
      { id: 'batismi01', name: 'Miguel Batista', role: 'SP', throws: 'R', age: 32, g: 36, gs: 29, outs: 580, h: 187, hr: 14, bb: 68, so: 132, hbp: 8, er: 81, w: 10, l: 9, sv: 0, fld: 70 },
      { id: 'webbbr01', name: 'Brandon Webb', role: 'SP', throws: 'R', age: 24, g: 29, gs: 28, outs: 542, h: 140, hr: 12, bb: 68, so: 172, hbp: 13, er: 57, w: 10, l: 9, sv: 0, fld: 75, rk: true },
      { id: 'desseel01', name: 'Elmer Dessens', role: 'SP', throws: 'R', age: 32, g: 34, gs: 30, outs: 527, h: 200, hr: 24, bb: 54, so: 108, hbp: 4, er: 86, w: 8, l: 8, sv: 0, fld: 67 },
      { id: 'schilcu01', name: 'Curt Schilling', role: 'SP', throws: 'R', age: 36, g: 24, gs: 24, outs: 504, h: 146, hr: 19, bb: 27, so: 199, hbp: 2, er: 58, w: 8, l: 9, sv: 0, fld: 55 },
      { id: 'johnsra05', name: 'Randy Johnson', role: 'SP', throws: 'L', age: 39, g: 18, gs: 18, outs: 342, h: 103, hr: 13, bb: 32, so: 153, hbp: 7, er: 39, w: 6, l: 8, sv: 0 },
      { id: 'mantema01', name: 'Matt Mantei', role: 'CL', throws: 'R', age: 29, g: 50, gs: 0, outs: 165, h: 41, hr: 6, bb: 19, so: 63, hbp: 2, er: 18, w: 5, l: 4, sv: 29 },
      { id: 'villaos01', name: 'Oscar Villarreal', role: 'RP', throws: 'R', age: 21, g: 86, gs: 1, outs: 294, h: 80, hr: 6, bb: 46, so: 80, hbp: 3, er: 28, w: 10, l: 7, sv: 0, rk: true },
      { id: 'randost01', name: 'Steve Randolph', role: 'RP', throws: 'L', age: 29, g: 50, gs: 0, outs: 180, h: 50, hr: 7, bb: 43, so: 50, hbp: 2, er: 27, w: 8, l: 1, sv: 0, rk: true },
      { id: 'pattejo02', name: 'John Patterson', role: 'RP', throws: 'R', age: 25, g: 16, gs: 8, outs: 165, h: 59, hr: 9, bb: 26, so: 48, hbp: 2, er: 33, w: 1, l: 4, sv: 1, rk: true },
      { id: 'valvejo01', name: 'Jose Valverde', role: 'RP', throws: 'R', age: 25, g: 54, gs: 0, outs: 151, h: 24, hr: 4, bb: 26, so: 71, hbp: 2, er: 12, w: 2, l: 1, sv: 10, rk: true },
      { id: 'oropeed01', name: 'Eddie Oropesa', role: 'RP', throws: 'L', age: 31, g: 47, gs: 0, outs: 116, h: 42, hr: 4, bb: 26, so: 34, hbp: 2, er: 29, w: 3, l: 3, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'goodan01', name: 'Andrew Good', role: 'SP', throws: 'R', age: 23, g: 16, gs: 10, outs: 199, h: 74, hr: 15, bb: 16, so: 42, hbp: 3, er: 39, w: 4, l: 2, sv: 0, rk: true },
      { id: 'koplomi01', name: 'Mike Koplove', role: 'RP', throws: 'R', age: 26, g: 31, gs: 0, outs: 113, h: 30, hr: 2, bb: 13, so: 29, hbp: 3, er: 12, w: 3, l: 0, sv: 0 },
      { id: 'myersmi01', name: 'Mike Myers', role: 'RP', throws: 'L', age: 34, g: 64, gs: 0, outs: 109, h: 37, hr: 3, bb: 20, so: 27, hbp: 5, er: 20, w: 0, l: 1, sv: 0 },
      { id: 'servisc01', name: 'Scott Service', role: 'RP', throws: 'R', age: 36, g: 33, gs: 0, outs: 103, h: 38, hr: 4, bb: 8, so: 35, hbp: 0, er: 18, w: 0, l: 2, sv: 1 },
      { id: 'capuach01', name: 'Chris Capuano', role: 'RP', throws: 'L', age: 24, g: 9, gs: 5, outs: 99, h: 27, hr: 3, bb: 11, so: 23, hbp: 6, er: 17, w: 2, l: 4, sv: 0, rk: true },
    ],
  },
  // COL (COL 2003)
  {
    franchiseId: 'COL',
    season: 2003,
    batters: [
      { id: 'johnsch04', name: 'Charles Johnson', pos: 'C', bats: 'R', age: 31, pa: 414, h: 84, double: 23, triple: 0, hr: 16, bb: 44, so: 91, hbp: 1, sb: 1, cs: 2, sec: '1B', fld: 72, arm: 80 },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 29, pa: 703, h: 202, double: 47, triple: 4, hr: 35, bb: 107, so: 85, hbp: 4, sb: 3, cs: 3, sec: 'LF', fld: 83 },
      { id: 'belliro01', name: 'Ronnie Belliard', pos: '2B', bats: 'R', age: 28, pa: 505, h: 116, double: 29, triple: 2, hr: 8, bb: 43, so: 73, hbp: 3, sb: 6, cs: 3, sec: '3B', fld: 72 },
      { id: 'hernajo01', name: 'Jose Hernandez', pos: '3B', bats: 'R', age: 33, pa: 571, h: 130, double: 21, triple: 2, hr: 18, bb: 46, so: 180, hbp: 2, sb: 3, cs: 3, sec: 'SS', fld: 82 },
      { id: 'uribeju01', name: 'Juan Uribe', pos: 'SS', bats: 'R', age: 24, pa: 343, h: 80, double: 16, triple: 5, hr: 7, bb: 17, so: 64, hbp: 3, sb: 6, cs: 1, sec: '2B', fld: 95 },
      { id: 'paytoja01', name: 'Jay Payton', pos: 'LF', bats: 'R', age: 30, pa: 658, h: 179, double: 30, triple: 6, hr: 25, bb: 41, so: 77, hbp: 7, sb: 7, cs: 5, sec: 'CF', fld: 75, arm: 65 },
      { id: 'wilsopr01', name: 'Preston Wilson', pos: 'CF', bats: 'R', age: 28, pa: 661, h: 159, double: 37, triple: 2, hr: 32, bb: 57, so: 145, hbp: 7, sb: 18, cs: 9, sec: 'LF', fld: 63, arm: 70 },
      { id: 'walkela01', name: 'Larry Walker', pos: 'RF', bats: 'L', age: 36, pa: 564, h: 147, double: 32, triple: 5, hr: 23, bb: 84, so: 85, hbp: 10, sb: 8, cs: 4, sec: '1B', fld: 65, arm: 70 },
      { id: 'sweenma01', name: 'Mark Sweeney', pos: 'DH', bats: 'L', age: 33, pa: 106, h: 23, double: 7, triple: 0, hr: 2, bb: 9, so: 27, hbp: 0, sb: 0, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'stynech01', name: 'Chris Stynes', pos: '3B', bats: 'R', age: 30, pa: 502, h: 114, double: 28, triple: 3, hr: 11, bb: 44, so: 73, hbp: 5, sb: 3, cs: 2, sec: '2B', fld: 79 },
      { id: 'nortogr01', name: 'Greg Norton', pos: '3B', bats: 'S', age: 30, pa: 197, h: 44, double: 12, triple: 1, hr: 7, bb: 18, so: 50, hbp: 0, sb: 2, cs: 1, sec: '1B', fld: 69 },
      { id: 'estalbo02', name: 'Bobby Estalella', pos: 'C', bats: 'R', age: 28, pa: 165, h: 28, double: 8, triple: 0, hr: 8, bb: 18, so: 50, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 67, arm: 72 },
      { id: 'reyesre01', name: 'Rene Reyes', pos: 'RF', bats: 'S', age: 25, pa: 123, h: 30, double: 7, triple: 1, hr: 2, bb: 5, so: 19, hbp: 0, sb: 2, cs: 1, sec: 'LF', fld: 66, arm: 79, rk: true },
      { id: 'butlebr02', name: 'Brent Butler', pos: '2B', bats: 'R', age: 25, pa: 99, h: 22, double: 4, triple: 1, hr: 2, bb: 4, so: 11, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 67 },
    ],
    reserveBatters: [
      { id: 'atkinga01', name: 'Garrett Atkins', pos: '3B', bats: 'R', age: 23, pa: 73, h: 11, double: 2, triple: 0, hr: 0, bb: 3, so: 14, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 48, rk: true },
      { id: 'vaughgr01', name: 'Greg Vaughn', pos: 'LF', bats: 'R', age: 37, pa: 46, h: 8, double: 2, triple: 0, hr: 2, bb: 6, so: 12, hbp: 0, sb: 1, cs: 0 },
      { id: 'ozunapa01', name: 'Pablo Ozuna', pos: '2B', bats: 'R', age: 28, pa: 45, h: 10, double: 1, triple: 1, hr: 0, bb: 2, so: 5, hbp: 2, sb: 2, cs: 0, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'jennija01', name: 'Jason Jennings', role: 'SP', throws: 'R', age: 24, g: 32, gs: 32, outs: 544, h: 209, hr: 22, bb: 82, so: 123, hbp: 6, er: 99, w: 12, l: 13, sv: 0, fld: 68 },
      { id: 'oliveda02', name: 'Darren Oliver', role: 'SP', throws: 'L', age: 32, g: 33, gs: 32, outs: 541, h: 204, hr: 22, bb: 66, so: 94, hbp: 9, er: 102, w: 13, l: 11, sv: 0, fld: 71 },
      { id: 'chacosh01', name: 'Shawn Chacon', role: 'SP', throws: 'R', age: 25, g: 23, gs: 23, outs: 411, h: 128, hr: 19, bb: 63, so: 91, hbp: 10, er: 75, w: 11, l: 8, sv: 0, fld: 74 },
      { id: 'cookaa01', name: 'Aaron Cook', role: 'SP', throws: 'R', age: 24, g: 43, gs: 16, outs: 372, h: 158, hr: 9, bb: 56, so: 44, hbp: 8, er: 80, w: 4, l: 6, sv: 0, rk: true },
      { id: 'starkde01', name: 'Denny Stark', role: 'SP', throws: 'R', age: 28, g: 17, gs: 13, outs: 236, h: 85, hr: 15, bb: 37, so: 37, hbp: 3, er: 45, w: 3, l: 3, sv: 0 },
      { id: 'jimenjo01', name: 'Jose Jimenez', role: 'CL', throws: 'R', age: 29, g: 63, gs: 7, outs: 305, h: 129, hr: 9, bb: 29, so: 55, hbp: 5, er: 54, w: 2, l: 10, sv: 20 },
      { id: 'fuentbr01', name: 'Brian Fuentes', role: 'RP', throws: 'L', age: 27, g: 75, gs: 0, outs: 226, h: 64, hr: 8, bb: 35, so: 85, hbp: 7, er: 26, w: 3, l: 3, sv: 4, rk: true },
      { id: 'speieju01', name: 'Justin Speier', role: 'RP', throws: 'R', age: 29, g: 72, gs: 0, outs: 220, h: 70, hr: 11, bb: 23, so: 63, hbp: 6, er: 35, w: 3, l: 1, sv: 9 },
      { id: 'jonesto02', name: 'Todd Jones', role: 'RP', throws: 'R', age: 35, g: 59, gs: 1, outs: 206, h: 87, hr: 10, bb: 29, so: 61, hbp: 1, er: 45, w: 3, l: 5, sv: 0 },
      { id: 'reedst01', name: 'Steve Reed', role: 'RP', throws: 'R', age: 38, g: 67, gs: 0, outs: 190, h: 58, hr: 6, bb: 22, so: 45, hbp: 7, er: 21, w: 5, l: 3, sv: 0 },
      { id: 'lopezja02', name: 'Javier Lopez', role: 'RP', throws: 'L', age: 25, g: 75, gs: 0, outs: 175, h: 58, hr: 5, bb: 12, so: 40, hbp: 4, er: 24, w: 4, l: 1, sv: 1, rk: true },
    ],
    reservePitchers: [
      { id: 'cruzne01', name: 'Nelson Cruz', role: 'RP', throws: 'R', age: 30, g: 20, gs: 7, outs: 161, h: 60, hr: 11, bb: 15, so: 42, hbp: 4, er: 33, w: 3, l: 5, sv: 0 },
      { id: 'elartsc01', name: 'Scott Elarton', role: 'SP', throws: 'R', age: 27, g: 11, gs: 10, outs: 155, h: 67, hr: 13, bb: 22, so: 27, hbp: 3, er: 39, w: 4, l: 4, sv: 0 },
      { id: 'tsaoch01', name: 'Chin-hui Tsao', role: 'RP', throws: 'R', age: 22, g: 9, gs: 8, outs: 130, h: 48, hr: 11, bb: 20, so: 29, hbp: 4, er: 29, w: 3, l: 3, sv: 0, rk: true },
      { id: 'neaglde01', name: 'Denny Neagle', role: 'RP', throws: 'L', age: 34, g: 7, gs: 7, outs: 106, h: 41, hr: 7, bb: 13, so: 26, hbp: 2, er: 23, w: 2, l: 4, sv: 0 },
      { id: 'vanceco01', name: 'Cory Vance', role: 'RP', throws: 'L', age: 24, g: 9, gs: 3, outs: 82, h: 30, hr: 7, bb: 11, so: 11, hbp: 1, er: 17, w: 1, l: 3, sv: 0, rk: true },
    ],
  },
  // LAD (LAN 2003)
  {
    franchiseId: 'LAD',
    season: 2003,
    batters: [
      { id: 'loducpa01', name: 'Paul Lo Duca', pos: 'C', bats: 'R', age: 31, pa: 630, h: 161, double: 35, triple: 1, hr: 11, bb: 41, so: 44, hbp: 10, sb: 1, cs: 2, sec: '1B', fld: 69, arm: 79 },
      { id: 'mcgrifr01', name: 'Fred McGriff', pos: '1B', bats: 'L', age: 39, pa: 329, h: 79, double: 14, triple: 1, hr: 15, bb: 34, so: 60, hbp: 2, sb: 0, cs: 1, fld: 63 },
      { id: 'coraal01', name: 'Alex Cora', pos: '2B', bats: 'L', age: 27, pa: 514, h: 119, double: 24, triple: 4, hr: 5, bb: 26, so: 62, hbp: 10, sb: 5, cs: 2, sec: 'SS', fld: 77 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 24, pa: 608, h: 140, double: 28, triple: 3, hr: 21, bb: 36, so: 98, hbp: 5, sb: 6, cs: 3, sec: '1B', fld: 73 },
      { id: 'izturce01', name: 'Cesar Izturis', pos: 'SS', bats: 'S', age: 23, pa: 593, h: 137, double: 24, triple: 5, hr: 1, bb: 22, so: 63, hbp: 0, sb: 11, cs: 6, sec: '2B', fld: 70 },
      { id: 'jordabr01', name: 'Brian Jordan', pos: 'LF', bats: 'R', age: 36, pa: 253, h: 67, double: 12, triple: 1, hr: 8, bb: 18, so: 37, hbp: 3, sb: 1, cs: 1, sec: 'RF', fld: 64, arm: 63 },
      { id: 'roberda07', name: 'Dave Roberts', pos: 'CF', bats: 'L', age: 31, pa: 440, h: 102, double: 9, triple: 6, hr: 2, bb: 43, so: 42, hbp: 3, sb: 40, cs: 12, sec: 'LF', fld: 58, arm: 67 },
      { id: 'greensh01', name: 'Shawn Green', pos: 'RF', bats: 'L', age: 30, pa: 691, h: 172, double: 40, triple: 2, hr: 32, bb: 77, so: 111, hbp: 6, sb: 9, cs: 3, sec: 'LF', fld: 59, arm: 68 },
      { id: 'kinkami01', name: 'Mike Kinkade', pos: 'DH', bats: 'R', age: 30, pa: 191, h: 41, double: 8, triple: 0, hr: 5, bb: 13, so: 36, hbp: 14, sb: 2, cs: 2, sec: 'LF', fld: 41, arm: 56 },
    ],
    bench: [
      { id: 'cabrejo02', name: 'Jolbert Cabrera', pos: '2B', bats: 'R', age: 30, pa: 380, h: 91, double: 27, triple: 2, hr: 4, bb: 19, so: 60, hbp: 9, sb: 7, cs: 4, sec: '3B', fld: 72 },
      { id: 'rossda01', name: 'David Ross', pos: 'C', bats: 'R', age: 26, pa: 140, h: 31, double: 7, triple: 0, hr: 10, bb: 13, so: 42, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 75, rk: true },
      { id: 'coomero01', name: 'Ron Coomer', pos: '1B', bats: 'R', age: 36, pa: 137, h: 32, double: 6, triple: 0, hr: 3, bb: 9, so: 21, hbp: 1, sb: 0, cs: 0, sec: '3B' },
      { id: 'wardda01', name: 'Daryle Ward', pos: '1B', bats: 'L', age: 28, pa: 114, h: 27, double: 6, triple: 0, hr: 2, bb: 7, so: 20, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
      { id: 'henderi01', name: 'Rickey Henderson', pos: 'LF', bats: 'R', age: 44, pa: 84, h: 15, double: 2, triple: 0, hr: 2, bb: 14, so: 16, hbp: 1, sb: 4, cs: 1, sec: 'CF', fld: 46, arm: 70 },
    ],
    reserveBatters: [
      { id: 'hundlto01', name: 'Todd Hundley', pos: 'C', bats: 'S', age: 34, pa: 41, h: 7, double: 1, triple: 0, hr: 2, bb: 5, so: 12, hbp: 0, sb: 0, cs: 0 },
      { id: 'ruanwi01', name: 'Wilkin Ruan', pos: 'CF', bats: 'R', age: 24, pa: 41, h: 9, double: 2, triple: 1, hr: 0, bb: 0, so: 7, hbp: 0, sb: 1, cs: 0, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'nomohi01', name: 'Hideo Nomo', role: 'SP', throws: 'R', age: 34, g: 33, gs: 33, outs: 655, h: 180, hr: 25, bb: 99, so: 190, hbp: 2, er: 82, w: 16, l: 13, sv: 0, fld: 70 },
      { id: 'brownke01', name: 'Kevin Brown', role: 'SP', throws: 'R', age: 38, g: 32, gs: 32, outs: 633, h: 186, hr: 14, bb: 60, so: 184, hbp: 6, er: 64, w: 14, l: 9, sv: 0, fld: 77 },
      { id: 'perezod01', name: 'Odalis Perez', role: 'SP', throws: 'L', age: 25, g: 30, gs: 30, outs: 556, h: 181, hr: 23, bb: 44, so: 139, hbp: 3, er: 83, w: 12, l: 12, sv: 0, fld: 77 },
      { id: 'ishiika01', name: 'Kazuhisa Ishii', role: 'SP', throws: 'L', age: 29, g: 27, gs: 27, outs: 441, h: 130, hr: 17, bb: 101, so: 139, hbp: 5, er: 66, w: 9, l: 7, sv: 0, fld: 64 },
      { id: 'alvarwi01', name: 'Wilson Alvarez', role: 'SP', throws: 'L', age: 33, g: 21, gs: 12, outs: 285, h: 84, hr: 9, bb: 30, so: 75, hbp: 5, er: 34, w: 6, l: 2, sv: 1 },
      { id: 'gagneer01', name: 'Eric Gagne', role: 'CL', throws: 'R', age: 27, g: 77, gs: 0, outs: 247, h: 50, hr: 6, bb: 19, so: 106, hbp: 4, er: 21, w: 2, l: 3, sv: 55 },
      { id: 'motagu01', name: 'Guillermo Mota', role: 'RP', throws: 'R', age: 29, g: 76, gs: 0, outs: 315, h: 79, hr: 8, bb: 32, so: 90, hbp: 2, er: 32, w: 6, l: 3, sv: 1 },
      { id: 'quantpa01', name: 'Paul Quantrill', role: 'RP', throws: 'R', age: 34, g: 89, gs: 0, outs: 232, h: 68, hr: 2, bb: 17, so: 47, hbp: 3, er: 19, w: 2, l: 5, sv: 1 },
      { id: 'shueypa01', name: 'Paul Shuey', role: 'RP', throws: 'R', age: 32, g: 62, gs: 0, outs: 207, h: 54, hr: 4, bb: 32, so: 65, hbp: 3, er: 23, w: 6, l: 4, sv: 0 },
      { id: 'martito02', name: 'Tom Martin', role: 'RP', throws: 'L', age: 33, g: 80, gs: 0, outs: 153, h: 40, hr: 6, bb: 24, so: 48, hbp: 2, er: 24, w: 1, l: 2, sv: 0 },
      { id: 'jacksed01', name: 'Edwin Jackson', role: 'RP', throws: 'R', age: 19, g: 4, gs: 3, outs: 66, h: 17, hr: 2, bb: 11, so: 19, hbp: 1, er: 6, w: 2, l: 1, sv: 0, rk: true },
    ],
    reservePitchers: [
      { id: 'ashbyan01', name: 'Andy Ashby', role: 'SP', throws: 'R', age: 35, g: 21, gs: 12, outs: 219, h: 80, hr: 8, bb: 23, so: 43, hbp: 3, er: 36, w: 3, l: 10, sv: 0 },
      { id: 'dreifda01', name: 'Darren Dreifort', role: 'SP', throws: 'R', age: 31, g: 10, gs: 10, outs: 181, h: 57, hr: 6, bb: 26, so: 63, hbp: 1, er: 29, w: 4, l: 4, sv: 0 },
      { id: 'colyest01', name: 'Steve Colyer', role: 'RP', throws: 'L', age: 24, g: 13, gs: 0, outs: 59, h: 22, hr: 0, bb: 9, so: 16, hbp: 0, er: 6, w: 0, l: 0, sv: 0, rk: true },
      { id: 'kidama01', name: 'Masao Kida', role: 'RP', throws: 'R', age: 34, g: 3, gs: 2, outs: 36, h: 15, hr: 0, bb: 3, so: 8, hbp: 0, er: 4, w: 0, l: 1, sv: 0 },
      { id: 'brohatr01', name: 'Troy Brohawn', role: 'RP', throws: 'L', age: 30, g: 12, gs: 0, outs: 35, h: 11, hr: 2, bb: 4, so: 9, hbp: 1, er: 6, w: 2, l: 0, sv: 0 },
    ],
  },
  // SDP (SDN 2003)
  {
    franchiseId: 'SDP',
    season: 2003,
    batters: [
      { id: 'bennega01', name: 'Gary Bennett', pos: 'C', bats: 'R', age: 31, pa: 338, h: 76, double: 13, triple: 1, hr: 3, bb: 22, so: 49, hbp: 4, sb: 2, cs: 1, sec: '1B', fld: 73, arm: 61 },
      { id: 'kleskry01', name: 'Ryan Klesko', pos: '1B', bats: 'L', age: 32, pa: 474, h: 111, double: 24, triple: 1, hr: 22, bb: 62, so: 73, hbp: 3, sb: 6, cs: 3, sec: 'LF', fld: 76 },
      { id: 'loretma01', name: 'Mark Loretta', pos: '2B', bats: 'R', age: 31, pa: 653, h: 180, double: 29, triple: 3, hr: 11, bb: 54, so: 66, hbp: 6, sb: 4, cs: 3, sec: 'SS', fld: 71 },
      { id: 'burrose01', name: 'Sean Burroughs', pos: '3B', bats: 'L', age: 22, pa: 578, h: 148, double: 25, triple: 5, hr: 6, bb: 42, so: 77, hbp: 9, sb: 7, cs: 2, sec: '2B', fld: 71 },
      { id: 'vazqura01', name: 'Ramon Vazquez', pos: 'SS', bats: 'L', age: 26, pa: 484, h: 113, double: 18, triple: 4, hr: 3, bb: 49, so: 84, hbp: 2, sb: 9, cs: 3, sec: '2B', fld: 60 },
      { id: 'whitero02', name: 'Rondell White', pos: 'LF', bats: 'R', age: 31, pa: 534, h: 134, double: 24, triple: 2, hr: 20, bb: 31, so: 84, hbp: 10, sb: 1, cs: 3, sec: 'CF', fld: 71, arm: 68 },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: 'CF', bats: 'L', age: 27, pa: 541, h: 135, double: 27, triple: 4, hr: 10, bb: 54, so: 77, hbp: 2, sb: 8, cs: 5, sec: 'RF', fld: 77, arm: 80 },
      { id: 'nadyxa01', name: 'Xavier Nady', pos: 'RF', bats: 'R', age: 24, pa: 404, h: 99, double: 17, triple: 1, hr: 9, bb: 24, so: 74, hbp: 6, sb: 6, cs: 2, sec: 'LF', fld: 61, arm: 80, rk: true },
      { id: 'matthga02', name: 'Gary Matthews', pos: 'DH', bats: 'S', age: 28, pa: 513, h: 115, double: 29, triple: 3, hr: 8, bb: 50, so: 96, hbp: 2, sb: 14, cs: 7, sec: 'RF', fld: 65, arm: 66 },
    ],
    bench: [
      { id: 'nevinph01', name: 'Phil Nevin', pos: '1B', bats: 'R', age: 32, pa: 248, h: 64, double: 10, triple: 0, hr: 11, bb: 23, so: 50, hbp: 1, sb: 2, cs: 0, sec: '3B', fld: 75 },
      { id: 'buchabr01', name: 'Brian Buchanan', pos: 'RF', bats: 'R', age: 29, pa: 228, h: 54, double: 10, triple: 1, hr: 9, bb: 20, so: 54, hbp: 3, sb: 4, cs: 2, sec: '1B', fld: 78, arm: 74 },
      { id: 'merlolo01', name: 'Lou Merloni', pos: '3B', bats: 'R', age: 32, pa: 213, h: 48, double: 10, triple: 2, hr: 2, bb: 21, so: 38, hbp: 3, sb: 2, cs: 2, sec: '2B', fld: 75 },
      { id: 'ojedami01', name: 'Miguel Ojeda', pos: 'C', bats: 'R', age: 28, pa: 163, h: 33, double: 6, triple: 0, hr: 4, bb: 18, so: 26, hbp: 3, sb: 1, cs: 1, sec: '1B', fld: 61, arm: 61, rk: true },
      { id: 'hanseda01', name: 'Dave Hansen', pos: '1B', bats: 'L', age: 34, pa: 159, h: 35, double: 6, triple: 1, hr: 2, bb: 22, so: 26, hbp: 1, sb: 1, cs: 0, sec: '3B' },
    ],
    reserveBatters: [
      { id: 'lockhke01', name: 'Keith Lockhart', pos: '2B', bats: 'L', age: 38, pa: 111, h: 22, double: 4, triple: 1, hr: 2, bb: 10, so: 17, hbp: 1, sb: 0, cs: 1, sec: '3B' },
      { id: 'mendedo01', name: 'Donaldo Mendez', pos: 'SS', bats: 'R', age: 25, pa: 94, h: 17, double: 5, triple: 0, hr: 2, bb: 6, so: 31, hbp: 2, sb: 1, cs: 0, sec: '2B', fld: 52, rk: true },
      { id: 'victosh01', name: 'Shane Victorino', pos: 'CF', bats: 'R', age: 22, pa: 83, h: 11, double: 2, triple: 0, hr: 0, bb: 7, so: 17, hbp: 1, sb: 7, cs: 2, sec: 'LF', fld: 63, arm: 86, rk: true },
      { id: 'gonzawi01', name: 'Wiki Gonzalez', pos: 'C', bats: 'R', age: 29, pa: 73, h: 14, double: 3, triple: 0, hr: 1, bb: 7, so: 11, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 63 },
      { id: 'greenkh01', name: 'Khalil Greene', pos: 'SS', bats: 'R', age: 23, pa: 70, h: 14, double: 4, triple: 1, hr: 2, bb: 4, so: 19, hbp: 1, sb: 0, cs: 1, sec: '2B', fld: 69, rk: true },
    ],
    pitchers: [
      { id: 'lawrebr02', name: 'Brian Lawrence', role: 'SP', throws: 'R', age: 27, g: 33, gs: 33, outs: 632, h: 212, hr: 22, bb: 55, so: 131, hbp: 11, er: 91, w: 10, l: 15, sv: 0, fld: 77 },
      { id: 'peavyja01', name: 'Jake Peavy', role: 'SP', throws: 'R', age: 22, g: 32, gs: 32, outs: 584, h: 181, hr: 30, bb: 77, so: 161, hbp: 6, er: 91, w: 12, l: 11, sv: 0, fld: 67 },
      { id: 'eatonad01', name: 'Adam Eaton', role: 'SP', throws: 'R', age: 25, g: 31, gs: 31, outs: 549, h: 171, hr: 23, bb: 70, so: 149, hbp: 7, er: 86, w: 9, l: 12, sv: 0, fld: 74 },
      { id: 'perezol01', name: 'Oliver Perez', role: 'SP', throws: 'L', age: 21, g: 24, gs: 24, outs: 380, h: 122, hr: 21, bb: 75, so: 141, hbp: 5, er: 69, w: 4, l: 10, sv: 0 },
      { id: 'jarvike01', name: 'Kevin Jarvis', role: 'SP', throws: 'R', age: 33, g: 16, gs: 16, outs: 276, h: 106, hr: 16, bb: 29, so: 58, hbp: 2, er: 56, w: 4, l: 8, sv: 0 },
      { id: 'beckro01', name: 'Rod Beck', role: 'CL', throws: 'R', age: 34, g: 36, gs: 0, outs: 106, h: 28, hr: 5, bb: 11, so: 29, hbp: 1, er: 10, w: 3, l: 2, sv: 20 },
      { id: 'linebsc01', name: 'Scott Linebrink', role: 'RP', throws: 'R', age: 26, g: 52, gs: 6, outs: 277, h: 94, hr: 8, bb: 38, so: 71, hbp: 6, er: 39, w: 3, l: 2, sv: 0, rk: true },
      { id: 'hergema01', name: 'Matt Herges', role: 'RP', throws: 'R', age: 33, g: 67, gs: 0, outs: 237, h: 75, hr: 6, bb: 30, so: 62, hbp: 3, er: 27, w: 3, l: 2, sv: 3 },
      { id: 'hackmlu01', name: 'Luther Hackman', role: 'RP', throws: 'R', age: 28, g: 65, gs: 0, outs: 230, h: 79, hr: 8, bb: 36, so: 47, hbp: 6, er: 40, w: 2, l: 2, sv: 0 },
      { id: 'matthmi01', name: 'Mike Matthews', role: 'RP', throws: 'L', age: 29, g: 77, gs: 0, outs: 194, h: 62, hr: 6, bb: 31, so: 47, hbp: 3, er: 29, w: 6, l: 4, sv: 0 },
      { id: 'wrighja02', name: 'Jaret Wright', role: 'RP', throws: 'R', age: 27, g: 50, gs: 0, outs: 169, h: 79, hr: 8, bb: 35, so: 44, hbp: 3, er: 51, w: 2, l: 5, sv: 2 },
    ],
    reservePitchers: [
      { id: 'roajo01', name: 'Joe Roa', role: 'RP', throws: 'R', age: 31, g: 28, gs: 4, outs: 154, h: 65, hr: 9, bb: 10, so: 33, hbp: 1, er: 30, w: 1, l: 3, sv: 0 },
      { id: 'witasja01', name: 'Jay Witasick', role: 'RP', throws: 'R', age: 30, g: 46, gs: 0, outs: 137, h: 42, hr: 4, bb: 20, so: 45, hbp: 2, er: 18, w: 3, l: 7, sv: 2 },
      { id: 'villabr01', name: 'Brandon Villafuerte', role: 'RP', throws: 'R', age: 27, g: 31, gs: 0, outs: 122, h: 40, hr: 6, bb: 23, so: 34, hbp: 3, er: 16, w: 0, l: 2, sv: 2, rk: true },
      { id: 'bynummi01', name: 'Mike Bynum', role: 'RP', throws: 'L', age: 25, g: 13, gs: 5, outs: 108, h: 43, hr: 10, bb: 16, so: 30, hbp: 2, er: 30, w: 1, l: 4, sv: 0, rk: true },
      { id: 'howarbe01', name: 'Ben Howard', role: 'RP', throws: 'R', age: 24, g: 6, gs: 6, outs: 104, h: 31, hr: 10, bb: 19, so: 24, hbp: 0, er: 17, w: 1, l: 3, sv: 0, rk: true },
    ],
  },
  // SFG (SFN 2003)
  {
    franchiseId: 'SFG',
    season: 2003,
    batters: [
      { id: 'santibe01', name: 'Benito Santiago', pos: 'C', bats: 'R', age: 38, pa: 434, h: 111, double: 21, triple: 3, hr: 11, bb: 25, so: 66, hbp: 2, sb: 2, cs: 2, sec: '1B', fld: 70, arm: 60 },
      { id: 'snowjt01', name: 'J. T. Snow', pos: '1B', bats: 'L', age: 35, pa: 396, h: 86, double: 19, triple: 2, hr: 7, bb: 53, so: 67, hbp: 7, sb: 0, cs: 1, fld: 77 },
      { id: 'durhara01', name: 'Ray Durham', pos: '2B', bats: 'S', age: 31, pa: 469, h: 115, double: 27, triple: 5, hr: 10, bb: 49, so: 74, hbp: 4, sb: 13, cs: 6, sec: 'SS', fld: 75 },
      { id: 'alfoned01', name: 'Edgardo Alfonzo', pos: '3B', bats: 'R', age: 29, pa: 586, h: 140, double: 26, triple: 1, hr: 15, bb: 60, so: 51, hbp: 5, sb: 6, cs: 1, sec: '2B', fld: 64 },
      { id: 'aurilri01', name: 'Rich Aurilia', pos: 'SS', bats: 'R', age: 31, pa: 545, h: 140, double: 29, triple: 2, hr: 16, bb: 36, so: 79, hbp: 2, sb: 1, cs: 2, sec: '2B', fld: 64 },
      { id: 'bondsba01', name: 'Barry Bonds', pos: 'LF', bats: 'L', age: 38, pa: 550, h: 133, double: 25, triple: 1, hr: 47, bb: 158, so: 56, hbp: 9, sb: 8, cs: 1, sec: 'CF', fld: 73, arm: 65 },
      { id: 'grissma02', name: 'Marquis Grissom', pos: 'CF', bats: 'R', age: 36, pa: 618, h: 165, double: 32, triple: 4, hr: 23, bb: 24, so: 99, hbp: 2, sb: 10, cs: 3, sec: 'LF', fld: 66, arm: 63 },
      { id: 'cruzjo02', name: 'Jose Cruz', pos: 'RF', bats: 'S', age: 29, pa: 650, h: 142, double: 30, triple: 3, hr: 23, bb: 81, so: 128, hbp: 0, sb: 11, cs: 6, sec: 'CF', fld: 80, arm: 79 },
      { id: 'galaran01', name: 'Andres Galarraga', pos: 'DH', bats: 'R', age: 42, pa: 293, h: 74, double: 14, triple: 0, hr: 10, bb: 22, so: 68, hbp: 5, sb: 1, cs: 2, sec: '1B', fld: 66 },
    ],
    bench: [
      { id: 'perezne01', name: 'Neifi Perez', pos: '2B', bats: 'S', age: 30, pa: 353, h: 84, double: 15, triple: 4, hr: 2, bb: 13, so: 30, hbp: 0, sb: 4, cs: 4, sec: 'SS', fld: 83 },
      { id: 'felizpe01', name: 'Pedro Feliz', pos: '3B', bats: 'R', age: 28, pa: 249, h: 57, double: 8, triple: 2, hr: 11, bb: 10, so: 51, hbp: 1, sb: 2, cs: 1, sec: '1B', fld: 86 },
      { id: 'torreyo01', name: 'Yorvit Torrealba', pos: 'C', bats: 'R', age: 24, pa: 221, h: 53, double: 11, triple: 2, hr: 4, bb: 16, so: 36, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 79, arm: 84 },
      { id: 'hammoje01', name: 'Jeffrey Hammonds', pos: 'LF', bats: 'R', age: 32, pa: 149, h: 33, double: 9, triple: 1, hr: 3, bb: 15, so: 27, hbp: 1, sb: 1, cs: 1, sec: 'RF', fld: 75, arm: 62 },
      { id: 'benarma01', name: 'Marvin Benard', pos: 'LF', bats: 'L', age: 32, pa: 77, h: 18, double: 4, triple: 1, hr: 1, bb: 5, so: 12, hbp: 1, sb: 2, cs: 1, sec: 'CF' },
    ],
    reserveBatters: [
      { id: 'riverru01', name: 'Ruben Rivera', pos: 'CF', bats: 'R', age: 29, pa: 55, h: 11, double: 2, triple: 0, hr: 2, bb: 5, so: 14, hbp: 1, sb: 1, cs: 0, sec: 'RF' },
    ],
    pitchers: [
      { id: 'schmija01', name: 'Jason Schmidt', role: 'SP', throws: 'R', age: 30, g: 29, gs: 29, outs: 623, h: 157, hr: 15, bb: 61, so: 204, hbp: 5, er: 65, w: 17, l: 5, sv: 0, fld: 61 },
      { id: 'mossda01', name: 'Damian Moss', role: 'SP', throws: 'L', age: 26, g: 31, gs: 29, outs: 497, h: 166, hr: 23, bb: 92, so: 93, hbp: 9, er: 84, w: 10, l: 12, sv: 0, fld: 69 },
      { id: 'rueteki01', name: 'Kirk Rueter', role: 'SP', throws: 'L', age: 32, g: 27, gs: 27, outs: 441, h: 163, hr: 16, bb: 45, so: 51, hbp: 1, er: 67, w: 10, l: 5, sv: 0, fld: 83 },
      { id: 'willije02', name: 'Jerome Williams', role: 'SP', throws: 'R', age: 21, g: 21, gs: 21, outs: 393, h: 116, hr: 10, bb: 49, so: 88, hbp: 7, er: 48, w: 7, l: 5, sv: 0, rk: true },
      { id: 'foppeje01', name: 'Jesse Foppert', role: 'SP', throws: 'R', age: 22, g: 23, gs: 21, outs: 333, h: 103, hr: 16, bb: 69, so: 101, hbp: 3, er: 62, w: 8, l: 9, sv: 0, rk: true },
      { id: 'worreti01', name: 'Tim Worrell', role: 'CL', throws: 'R', age: 35, g: 76, gs: 0, outs: 235, h: 69, hr: 4, bb: 31, so: 63, hbp: 1, er: 24, w: 4, l: 4, sv: 38 },
      { id: 'broweji01', name: 'Jim Brower', role: 'RP', throws: 'R', age: 30, g: 51, gs: 5, outs: 300, h: 91, hr: 9, bb: 40, so: 67, hbp: 3, er: 45, w: 8, l: 5, sv: 2 },
      { id: 'nathajo01', name: 'Joe Nathan', role: 'RP', throws: 'R', age: 28, g: 78, gs: 0, outs: 237, h: 50, hr: 7, bb: 32, so: 82, hbp: 3, er: 25, w: 12, l: 4, sv: 0 },
      { id: 'hermadu01', name: 'Dustin Hermanson', role: 'RP', throws: 'R', age: 30, g: 32, gs: 6, outs: 206, h: 73, hr: 10, bb: 24, so: 41, hbp: 3, er: 35, w: 3, l: 3, sv: 1 },
      { id: 'rodrife01', name: 'Felix Rodriguez', role: 'RP', throws: 'R', age: 30, g: 68, gs: 0, outs: 183, h: 53, hr: 5, bb: 27, so: 55, hbp: 3, er: 23, w: 8, l: 2, sv: 2 },
      { id: 'eyresc01', name: 'Scott Eyre', role: 'RP', throws: 'L', age: 31, g: 74, gs: 0, outs: 171, h: 60, hr: 4, bb: 27, so: 40, hbp: 1, er: 24, w: 2, l: 1, sv: 1 },
    ],
    reservePitchers: [
      { id: 'ainswku01', name: 'Kurt Ainsworth', role: 'SP', throws: 'R', age: 24, g: 14, gs: 11, outs: 205, h: 70, hr: 7, bb: 28, so: 50, hbp: 2, er: 29, w: 5, l: 5, sv: 0, rk: true },
      { id: 'zerbech01', name: 'Chad Zerbe', role: 'RP', throws: 'L', age: 31, g: 33, gs: 1, outs: 149, h: 55, hr: 3, bb: 16, so: 21, hbp: 2, er: 22, w: 1, l: 1, sv: 0 },
      { id: 'correke01', name: 'Kevin Correia', role: 'RP', throws: 'R', age: 22, g: 10, gs: 7, outs: 118, h: 41, hr: 6, bb: 18, so: 28, hbp: 4, er: 16, w: 3, l: 1, sv: 0, rk: true },
      { id: 'chrisja01', name: 'Jason Christiansen', role: 'RP', throws: 'L', age: 33, g: 40, gs: 0, outs: 78, h: 24, hr: 3, bb: 11, so: 21, hbp: 1, er: 14, w: 0, l: 0, sv: 0 },
      { id: 'jensery01', name: 'Ryan Jensen', role: 'RP', throws: 'R', age: 27, g: 6, gs: 2, outs: 40, h: 16, hr: 2, bb: 6, so: 8, hbp: 1, er: 8, w: 0, l: 0, sv: 0 },
    ],
  },
];
