import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione 1999 (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da `scripts/build-historical.mjs` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year 1999
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
// giocatori fuori rosa confluiscono nel pool free agent (`freeAgents1999.ts`).
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

export const SEASON_1999: HistTeam[] = [
  // BAL (BAL 1999)
  {
    franchiseId: 'BAL',
    season: 1999,
    batters: [
      { id: 'johnsch04', name: 'Charles Johnson', pos: 'C', bats: 'R', age: 27, pa: 492, h: 103, double: 20, triple: 1, hr: 17, bb: 52, so: 114, hbp: 3, sb: 0, cs: 1, sec: '1B', fld: 78, arm: 75 },
      { id: 'coninje01', name: 'Jeff Conine', pos: '1B', bats: 'R', age: 33, pa: 485, h: 120, double: 29, triple: 1, hr: 13, bb: 37, so: 64, hbp: 3, sb: 1, cs: 2, sec: 'LF', fld: 67 },
      { id: 'deshide01', name: 'Delino DeShields', pos: '2B', bats: 'L', age: 30, pa: 374, h: 92, double: 14, triple: 5, hr: 6, bb: 38, so: 48, hbp: 1, sb: 19, cs: 8, sec: 'SS', fld: 69 },
      { id: 'ripkeca01', name: 'Cal Ripken', pos: '3B', bats: 'R', age: 38, pa: 354, h: 96, double: 19, triple: 0, hr: 11, bb: 23, so: 35, hbp: 3, sb: 0, cs: 1, sec: 'SS', fld: 53 },
      { id: 'bordimi01', name: 'Mike Bordick', pos: 'SS', bats: 'R', age: 33, pa: 708, h: 167, double: 34, triple: 5, hr: 12, bb: 52, so: 95, hbp: 7, sb: 10, cs: 5, sec: '2B', fld: 94 },
      { id: 'surhobj01', name: 'B. J. Surhoff', pos: 'LF', bats: 'L', age: 34, pa: 727, h: 196, double: 38, triple: 2, hr: 26, bb: 50, so: 82, hbp: 2, sb: 6, cs: 3, sec: '1B', fld: 77, arm: 84 },
      { id: 'anderbr01', name: 'Brady Anderson', pos: 'CF', bats: 'L', age: 35, pa: 692, h: 154, double: 32, triple: 5, hr: 22, bb: 92, so: 102, hbp: 21, sb: 30, cs: 8, sec: 'LF', fld: 67, arm: 60 },
      { id: 'belleal01', name: 'Albert Belle', pos: 'RF', bats: 'R', age: 32, pa: 722, h: 188, double: 42, triple: 1, hr: 40, bb: 87, so: 88, hbp: 5, sb: 11, cs: 4, sec: 'LF', fld: 56, arm: 79 },
      { id: 'baineha01', name: 'Harold Baines', pos: 'DH', bats: 'L', age: 40, pa: 486, h: 132, double: 21, triple: 1, hr: 20, bb: 52, so: 53, hbp: 0, sb: 1, cs: 1, sec: 'RF' },
    ],
    bench: [
      { id: 'clarkwi02', name: 'Will Clark', pos: '1B', bats: 'L', age: 35, pa: 294, h: 78, double: 18, triple: 0, hr: 10, bb: 35, so: 43, hbp: 2, sb: 1, cs: 1, fld: 76 },
      { id: 'hairsje02', name: 'Jerry Hairston', pos: '2B', bats: 'R', age: 23, pa: 193, h: 46, double: 12, triple: 1, hr: 4, bb: 11, so: 24, hbp: 3, sb: 9, cs: 4, sec: 'SS', fld: 89, rk: true },
      { id: 'rebouje01', name: 'Jeff Reboulet', pos: '3B', bats: 'R', age: 35, pa: 192, h: 32, double: 6, triple: 0, hr: 1, bb: 27, so: 33, hbp: 2, sb: 1, cs: 0, sec: 'SS', fld: 100 },
      { id: 'amarari01', name: 'Rich Amaral', pos: 'RF', bats: 'R', age: 37, pa: 156, h: 39, double: 7, triple: 0, hr: 0, bb: 13, so: 23, hbp: 1, sb: 10, cs: 4, sec: 'LF', fld: 94, arm: 55 },
      { id: 'minorry01', name: 'Ryan Minor', pos: '3B', bats: 'R', age: 25, pa: 133, h: 26, double: 7, triple: 0, hr: 3, bb: 7, so: 42, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 82, rk: true },
    ],
    reserveBatters: [
      { id: 'kingsge01', name: 'Gene Kingsale', pos: 'CF', bats: 'S', age: 22, pa: 95, h: 21, double: 2, triple: 0, hr: 0, bb: 5, so: 13, hbp: 2, sb: 1, cs: 3, sec: 'LF', fld: 53, arm: 65, rk: true },
      { id: 'figgami01', name: 'Mike Figga', pos: 'C', bats: 'R', age: 28, pa: 91, h: 19, double: 4, triple: 0, hr: 1, bb: 2, so: 27, hbp: 0, sb: 0, cs: 2, sec: '1B', fld: 59, arm: 63, rk: true },
      { id: 'webstle01', name: 'Lenny Webster', pos: 'C', bats: 'R', age: 34, pa: 62, h: 14, double: 2, triple: 0, hr: 1, bb: 5, so: 8, hbp: 0, sb: 0, cs: 0 },
      { id: 'mayde01', name: 'Derrick May', pos: 'DH', bats: 'L', age: 30, pa: 54, h: 12, double: 2, triple: 0, hr: 2, bb: 3, so: 7, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
      { id: 'pickeca01', name: 'Calvin Pickering', pos: '1B', bats: 'L', age: 22, pa: 51, h: 6, double: 1, triple: 0, hr: 2, bb: 10, so: 14, hbp: 0, sb: 1, cs: 0, sec: '3B', rk: true },
    ],
    pitchers: [
      { id: 'ericksc01', name: 'Scott Erickson', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 691, h: 251, hr: 24, bb: 82, so: 136, hbp: 11, er: 113, w: 15, l: 12, sv: 0, fld: 84 },
      { id: 'ponsosi01', name: 'Sidney Ponson', role: 'SP', throws: 'R', age: 22, g: 32, gs: 32, outs: 630, h: 232, hr: 33, bb: 75, so: 118, hbp: 2, er: 114, w: 12, l: 12, sv: 0, fld: 68 },
      { id: 'mussimi01', name: 'Mike Mussina', role: 'SP', throws: 'R', age: 30, g: 31, gs: 31, outs: 610, h: 198, hr: 20, bb: 48, so: 180, hbp: 2, er: 79, w: 18, l: 7, sv: 0, fld: 86 },
      { id: 'guzmaju01', name: 'Juan Guzman', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 600, h: 188, hr: 27, bb: 90, so: 158, hbp: 6, er: 90, w: 11, l: 12, sv: 0, fld: 60 },
      { id: 'johnsja02', name: 'Jason Johnson', role: 'SP', throws: 'R', age: 25, g: 22, gs: 21, outs: 346, h: 125, hr: 16, bb: 53, so: 70, hbp: 4, er: 70, w: 8, l: 7, sv: 0, fld: 62 },
      { id: 'timlimi01', name: 'Mike Timlin', role: 'CL', throws: 'R', age: 33, g: 62, gs: 0, outs: 189, h: 57, hr: 7, bb: 18, so: 47, hbp: 3, er: 23, w: 3, l: 9, sv: 27, fld: 71 },
      { id: 'johnsdo04', name: 'Doug Johns', role: 'RP', throws: 'L', age: 31, g: 32, gs: 5, outs: 260, h: 89, hr: 9, bb: 27, so: 42, hbp: 6, er: 42, w: 6, l: 4, sv: 0, fld: 69 },
      { id: 'lintodo01', name: 'Doug Linton', role: 'RP', throws: 'R', age: 34, g: 14, gs: 8, outs: 177, h: 69, hr: 14, bb: 25, so: 31, hbp: 2, er: 39, w: 1, l: 4, sv: 0, fld: 59 },
      { id: 'kamiesc01', name: 'Scott Kamieniecki', role: 'RP', throws: 'R', age: 35, g: 43, gs: 3, outs: 169, h: 57, hr: 6, bb: 25, so: 34, hbp: 3, er: 31, w: 2, l: 4, sv: 2, fld: 79 },
      { id: 'rhodear01', name: 'Arthur Rhodes', role: 'RP', throws: 'L', age: 29, g: 43, gs: 0, outs: 159, h: 46, hr: 7, bb: 32, so: 61, hbp: 1, er: 26, w: 3, l: 4, sv: 3, fld: 76 },
      { id: 'bonesri01', name: 'Ricky Bones', role: 'RP', throws: 'R', age: 30, g: 30, gs: 2, outs: 131, h: 55, hr: 6, bb: 19, so: 27, hbp: 2, er: 26, w: 0, l: 3, sv: 0, fld: 75 },
    ],
    reservePitchers: [
      { id: 'oroscje01', name: 'Jesse Orosco', role: 'RP', throws: 'L', age: 42, g: 65, gs: 0, outs: 96, h: 26, hr: 4, bb: 19, so: 32, hbp: 1, er: 14, w: 0, l: 2, sv: 1, fld: 78 },
      { id: 'fettemi01', name: 'Mike Fetters', role: 'RP', throws: 'R', age: 34, g: 27, gs: 0, outs: 93, h: 34, hr: 3, bb: 18, so: 25, hbp: 1, er: 17, w: 1, l: 0, sv: 0, fld: 87 },
      { id: 'molinga01', name: 'Gabe Molina', role: 'RP', throws: 'R', age: 24, g: 20, gs: 0, outs: 69, h: 22, hr: 4, bb: 16, so: 14, hbp: 0, er: 17, w: 1, l: 2, sv: 0, fld: 52, rk: true },
      { id: 'ryanbj01', name: 'B. J. Ryan', role: 'RP', throws: 'L', age: 23, g: 14, gs: 0, outs: 61, h: 13, hr: 0, bb: 13, so: 29, hbp: 0, er: 7, w: 1, l: 0, sv: 0, fld: 73, rk: true },
      { id: 'rileyma01', name: 'Matt Riley', role: 'RP', throws: 'L', age: 19, g: 3, gs: 3, outs: 33, h: 17, hr: 4, bb: 13, so: 6, hbp: 0, er: 9, w: 0, l: 0, sv: 0, fld: 80, rk: true },
    ],
  },
  // BOS (BOS 1999)
  {
    franchiseId: 'BOS',
    season: 1999,
    batters: [
      { id: 'varitja01', name: 'Jason Varitek', pos: 'C', bats: 'S', age: 27, pa: 544, h: 129, double: 37, triple: 2, hr: 19, bb: 44, so: 88, hbp: 3, sb: 2, cs: 3, sec: '1B', fld: 57, arm: 66 },
      { id: 'stanlmi02', name: 'Mike Stanley', pos: '1B', bats: 'R', age: 36, pa: 512, h: 117, double: 23, triple: 0, hr: 21, bb: 70, so: 100, hbp: 9, sb: 1, cs: 0, sec: '3B', fld: 62 },
      { id: 'offerjo01', name: 'Jose Offerman', pos: '2B', bats: 'S', age: 30, pa: 693, h: 179, double: 33, triple: 11, hr: 7, bb: 89, so: 86, hbp: 3, sb: 27, cs: 12, sec: 'SS', fld: 55 },
      { id: 'valenjo02', name: 'John Valentin', pos: '3B', bats: 'R', age: 32, pa: 503, h: 116, double: 31, triple: 1, hr: 14, bb: 48, so: 62, hbp: 5, sb: 2, cs: 2, sec: 'SS', fld: 74 },
      { id: 'garcino01', name: 'Nomar Garciaparra', pos: 'SS', bats: 'R', age: 25, pa: 595, h: 182, double: 38, triple: 6, hr: 28, bb: 40, so: 52, hbp: 7, sb: 14, cs: 5, sec: '2B', fld: 70 },
      { id: 'oleartr01', name: 'Troy O\'Leary', pos: 'LF', bats: 'L', age: 29, pa: 661, h: 169, double: 36, triple: 6, hr: 25, bb: 48, so: 96, hbp: 4, sb: 1, cs: 3, sec: 'RF', fld: 71, arm: 71 },
      { id: 'lewisda01', name: 'Darren Lewis', pos: 'CF', bats: 'R', age: 31, pa: 538, h: 119, double: 16, triple: 4, hr: 4, bb: 50, so: 64, hbp: 5, sb: 21, cs: 10, sec: 'RF', fld: 70, arm: 62 },
      { id: 'nixontr01', name: 'Trot Nixon', pos: 'RF', bats: 'L', age: 25, pa: 447, h: 103, double: 22, triple: 5, hr: 14, bb: 52, so: 74, hbp: 3, sb: 3, cs: 1, sec: 'LF', fld: 52, arm: 60, rk: true },
      { id: 'daubabr01', name: 'Brian Daubach', pos: 'DH', bats: 'L', age: 27, pa: 420, h: 111, double: 33, triple: 3, hr: 20, bb: 36, so: 93, hbp: 4, sb: 0, cs: 1, sec: '1B', fld: 58, rk: true },
    ],
    bench: [
      { id: 'buforda01', name: 'Damon Buford', pos: 'CF', bats: 'R', age: 29, pa: 324, h: 73, double: 16, triple: 2, hr: 8, bb: 24, so: 68, hbp: 2, sb: 10, cs: 4, sec: 'RF', fld: 70, arm: 74 },
      { id: 'jeffere01', name: 'Reggie Jefferson', pos: 'DH', bats: 'S', age: 30, pa: 225, h: 61, double: 14, triple: 1, hr: 6, bb: 16, so: 46, hbp: 2, sb: 0, cs: 0, sec: '1B' },
      { id: 'merlolo01', name: 'Lou Merloni', pos: 'SS', bats: 'R', age: 28, pa: 140, h: 33, double: 7, triple: 0, hr: 1, bb: 8, so: 19, hbp: 2, sb: 0, cs: 0, sec: '2B', fld: 73, rk: true },
      { id: 'fryeje01', name: 'Jeff Frye', pos: '2B', bats: 'R', age: 32, pa: 131, h: 35, double: 7, triple: 0, hr: 1, bb: 11, so: 12, hbp: 1, sb: 4, cs: 2, sec: '3B', fld: 49 },
      { id: 'veraswi01', name: 'Wilton Veras', pos: '3B', bats: 'R', age: 21, pa: 127, h: 34, double: 5, triple: 1, hr: 2, bb: 5, so: 14, hbp: 2, sb: 0, cs: 2, sec: '1B', fld: 58, rk: true },
    ],
    reserveBatters: [
      { id: 'sadledo01', name: 'Donnie Sadler', pos: 'SS', bats: 'R', age: 24, pa: 115, h: 27, double: 4, triple: 2, hr: 1, bb: 5, so: 21, hbp: 1, sb: 3, cs: 1, sec: '2B' },
      { id: 'hattesc01', name: 'Scott Hatteberg', pos: 'C', bats: 'L', age: 29, pa: 100, h: 24, double: 6, triple: 0, hr: 2, bb: 12, so: 15, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 68, arm: 60 },
      { id: 'gubancr01', name: 'Creighton Gubanich', pos: 'C', bats: 'R', age: 27, pa: 52, h: 13, double: 2, triple: 1, hr: 1, bb: 3, so: 13, hbp: 2, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'martipe02', name: 'Pedro Martinez', role: 'SP', throws: 'R', age: 27, g: 31, gs: 29, outs: 640, h: 158, hr: 15, bb: 49, so: 272, hbp: 8, er: 54, w: 23, l: 4, sv: 0, fld: 62 },
      { id: 'portuma01', name: 'Mark Portugal', role: 'SP', throws: 'R', age: 36, g: 31, gs: 27, outs: 451, h: 177, hr: 26, bb: 37, so: 85, hbp: 4, er: 85, w: 7, l: 12, sv: 0, fld: 75 },
      { id: 'rapppa01', name: 'Pat Rapp', role: 'SP', throws: 'R', age: 31, g: 37, gs: 26, outs: 439, h: 152, hr: 15, bb: 74, so: 94, hbp: 7, er: 75, w: 6, l: 7, sv: 0, fld: 67 },
      { id: 'wakefti01', name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 32, g: 49, gs: 17, outs: 420, h: 143, hr: 19, bb: 63, so: 103, hbp: 8, er: 75, w: 6, l: 11, sv: 15, fld: 62 },
      { id: 'saberbr01', name: 'Bret Saberhagen', role: 'SP', throws: 'R', age: 35, g: 22, gs: 22, outs: 357, h: 121, hr: 13, bb: 16, so: 73, hbp: 3, er: 46, w: 10, l: 6, sv: 0, fld: 71 },
      { id: 'lowede01', name: 'Derek Lowe', role: 'CL', throws: 'R', age: 26, g: 74, gs: 0, outs: 328, h: 94, hr: 7, bb: 30, so: 72, hbp: 4, er: 41, w: 6, l: 3, sv: 15, fld: 79 },
      { id: 'wasdijo01', name: 'John Wasdin', role: 'RP', throws: 'R', age: 26, g: 45, gs: 0, outs: 223, h: 72, hr: 12, bb: 19, so: 50, hbp: 1, er: 37, w: 8, l: 3, sv: 2, fld: 70 },
      { id: 'cormirh01', name: 'Rheal Cormier', role: 'RP', throws: 'L', age: 32, g: 60, gs: 0, outs: 190, h: 62, hr: 4, bb: 18, so: 39, hbp: 5, er: 27, w: 2, l: 0, sv: 0, fld: 64 },
      { id: 'guthrma01', name: 'Mark Guthrie', role: 'RP', throws: 'L', age: 33, g: 57, gs: 0, outs: 176, h: 58, hr: 8, bb: 25, so: 44, hbp: 2, er: 31, w: 1, l: 3, sv: 2, fld: 62 },
      { id: 'garceri01', name: 'Rich Garces', role: 'RP', throws: 'R', age: 28, g: 30, gs: 0, outs: 122, h: 28, hr: 3, bb: 20, so: 31, hbp: 1, er: 11, w: 5, l: 1, sv: 2, fld: 71 },
      { id: 'choji01', name: 'Jin Ho Cho', role: 'RP', throws: 'R', age: 23, g: 9, gs: 7, outs: 118, h: 48, hr: 7, bb: 7, so: 19, hbp: 2, er: 27, w: 2, l: 3, sv: 0, fld: 60, rk: true },
    ],
    reservePitchers: [
      { id: 'rosebr01', name: 'Brian Rose', role: 'SP', throws: 'R', age: 23, g: 22, gs: 18, outs: 294, h: 112, hr: 20, bb: 31, so: 50, hbp: 3, er: 58, w: 7, l: 6, sv: 0, fld: 85, rk: true },
      { id: 'corsiji01', name: 'Jim Corsi', role: 'RP', throws: 'R', age: 37, g: 36, gs: 0, outs: 112, h: 38, hr: 4, bb: 17, so: 27, hbp: 2, er: 15, w: 1, l: 3, sv: 0, fld: 90 },
      { id: 'martira02', name: 'Ramon Martinez', role: 'RP', throws: 'R', age: 31, g: 4, gs: 4, outs: 62, h: 16, hr: 2, bb: 9, so: 17, hbp: 1, er: 7, w: 2, l: 1, sv: 0, fld: 81 },
      { id: 'gordoto01', name: 'Tom Gordon', role: 'RP', throws: 'R', age: 31, g: 21, gs: 0, outs: 53, h: 16, hr: 1, bb: 8, so: 19, hbp: 0, er: 8, w: 0, l: 2, sv: 11, fld: 60 },
      { id: 'harikti01', name: 'Tim Harikkala', role: 'RP', throws: 'R', age: 27, g: 7, gs: 0, outs: 39, h: 15, hr: 0, bb: 6, so: 7, hbp: 1, er: 9, w: 1, l: 1, sv: 0, fld: 69, rk: true },
    ],
  },
  // NYY (NYA 1999)
  {
    franchiseId: 'NYY',
    season: 1999,
    batters: [
      { id: 'posadjo01', name: 'Jorge Posada', pos: 'C', bats: 'S', age: 28, pa: 437, h: 96, double: 21, triple: 1, hr: 14, bb: 53, so: 91, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 62, arm: 66 },
      { id: 'martiti02', name: 'Tino Martinez', pos: '1B', bats: 'L', age: 31, pa: 665, h: 160, double: 30, triple: 2, hr: 31, bb: 69, so: 85, hbp: 4, sb: 3, cs: 3, sec: '3B', fld: 76 },
      { id: 'knoblch01', name: 'Chuck Knoblauch', pos: '2B', bats: 'R', age: 30, pa: 715, h: 172, double: 31, triple: 5, hr: 16, bb: 81, so: 66, hbp: 19, sb: 35, cs: 10, sec: 'SS', fld: 53 },
      { id: 'brosisc01', name: 'Scott Brosius', pos: '3B', bats: 'R', age: 32, pa: 529, h: 122, double: 26, triple: 1, hr: 16, bb: 41, so: 83, hbp: 7, sb: 9, cs: 5, sec: '1B', fld: 69 },
      { id: 'jeterde01', name: 'Derek Jeter', pos: 'SS', bats: 'R', age: 25, pa: 739, h: 213, double: 33, triple: 8, hr: 20, bb: 78, so: 121, hbp: 10, sb: 24, cs: 8, sec: '2B', fld: 59 },
      { id: 'curtich01', name: 'Chad Curtis', pos: 'LF', bats: 'R', age: 30, pa: 245, h: 52, double: 9, triple: 0, hr: 5, bb: 35, so: 36, hbp: 3, sb: 9, cs: 3, sec: 'CF', fld: 60, arm: 65 },
      { id: 'willibe02', name: 'Bernie Williams', pos: 'CF', bats: 'S', age: 30, pa: 697, h: 202, double: 33, triple: 6, hr: 27, bb: 95, so: 96, hbp: 1, sb: 13, cs: 10, sec: 'LF', fld: 71, arm: 69 },
      { id: 'oneilpa01', name: 'Paul O\'Neill', pos: 'RF', bats: 'L', age: 36, pa: 675, h: 180, double: 40, triple: 3, hr: 21, bb: 65, so: 95, hbp: 2, sb: 12, cs: 6, sec: 'LF', fld: 63, arm: 69 },
      { id: 'davisch01', name: 'Chili Davis', pos: 'DH', bats: 'S', age: 39, pa: 554, h: 130, double: 24, triple: 1, hr: 21, bb: 75, so: 97, hbp: 2, sb: 4, cs: 2, sec: 'RF' },
    ],
    bench: [
      { id: 'ledeeri01', name: 'Ricky Ledee', pos: 'LF', bats: 'L', age: 25, pa: 280, h: 68, double: 14, triple: 5, hr: 8, bb: 27, so: 76, hbp: 0, sb: 5, cs: 3, sec: 'RF', fld: 65, arm: 67, rk: true },
      { id: 'girarjo01', name: 'Joe Girardi', pos: 'C', bats: 'R', age: 34, pa: 229, h: 54, double: 13, triple: 2, hr: 2, bb: 11, so: 28, hbp: 1, sb: 2, cs: 2, fld: 71, arm: 64 },
      { id: 'spencsh01', name: 'Shane Spencer', pos: 'LF', bats: 'R', age: 27, pa: 226, h: 53, double: 10, triple: 0, hr: 12, bb: 18, so: 49, hbp: 2, sb: 0, cs: 4, sec: 'RF', fld: 79, arm: 80, rk: true },
      { id: 'sojolu01', name: 'Luis Sojo', pos: '3B', bats: 'R', age: 34, pa: 133, h: 32, double: 4, triple: 0, hr: 1, bb: 5, so: 13, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 60 },
      { id: 'strawda01', name: 'Darryl Strawberry', pos: 'DH', bats: 'L', age: 37, pa: 66, h: 14, double: 3, triple: 0, hr: 4, bb: 10, so: 17, hbp: 0, sb: 2, cs: 1, sec: 'RF' },
    ],
    reserveBatters: [
      { id: 'bellicl01', name: 'Clay Bellinger', pos: '3B', bats: 'R', age: 30, pa: 46, h: 9, double: 2, triple: 0, hr: 1, bb: 1, so: 10, hbp: 0, sb: 1, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'hernaor01', name: 'Orlando Hernandez', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 643, h: 184, hr: 22, bb: 85, so: 171, hbp: 8, er: 91, w: 17, l: 9, sv: 0, fld: 70 },
      { id: 'coneda01', name: 'David Cone', role: 'SP', throws: 'R', age: 36, g: 31, gs: 31, outs: 580, h: 168, hr: 20, bb: 78, so: 193, hbp: 11, er: 74, w: 12, l: 9, sv: 0, fld: 56 },
      { id: 'pettian01', name: 'Andy Pettitte', role: 'SP', throws: 'L', age: 27, g: 31, gs: 31, outs: 575, h: 210, hr: 17, bb: 80, so: 129, hbp: 4, er: 91, w: 14, l: 11, sv: 0, fld: 74 },
      { id: 'clemero02', name: 'Roger Clemens', role: 'SP', throws: 'R', age: 36, g: 30, gs: 30, outs: 563, h: 167, hr: 14, bb: 78, so: 202, hbp: 8, er: 74, w: 14, l: 10, sv: 0, fld: 79 },
      { id: 'irabuhi01', name: 'Hideki Irabu', role: 'SP', throws: 'R', age: 30, g: 32, gs: 27, outs: 508, h: 169, hr: 27, bb: 58, so: 132, hbp: 7, er: 88, w: 11, l: 7, sv: 0, fld: 59 },
      { id: 'riverma01', name: 'Mariano Rivera', role: 'CL', throws: 'R', age: 29, g: 66, gs: 0, outs: 207, h: 49, hr: 3, bb: 18, so: 50, hbp: 2, er: 14, w: 4, l: 3, sv: 45, fld: 62 },
      { id: 'mendora01', name: 'Ramiro Mendoza', role: 'RP', throws: 'R', age: 27, g: 53, gs: 6, outs: 371, h: 137, hr: 12, bb: 27, so: 70, hbp: 5, er: 54, w: 9, l: 9, sv: 3, fld: 64 },
      { id: 'grimsja01', name: 'Jason Grimsley', role: 'RP', throws: 'R', age: 31, g: 55, gs: 0, outs: 225, h: 66, hr: 7, bb: 40, so: 49, hbp: 4, er: 30, w: 7, l: 2, sv: 1, fld: 60 },
      { id: 'stantmi02', name: 'Mike Stanton', role: 'RP', throws: 'L', age: 32, g: 73, gs: 1, outs: 187, h: 63, hr: 7, bb: 22, so: 59, hbp: 2, er: 32, w: 2, l: 2, sv: 0, fld: 60 },
      { id: 'naultda01', name: 'Dan Naulty', role: 'RP', throws: 'R', age: 29, g: 33, gs: 0, outs: 148, h: 43, hr: 8, bb: 21, so: 28, hbp: 3, er: 26, w: 1, l: 0, sv: 0, fld: 64 },
      { id: 'nelsoje01', name: 'Jeff Nelson', role: 'RP', throws: 'R', age: 32, g: 39, gs: 0, outs: 91, h: 28, hr: 2, bb: 18, so: 32, hbp: 4, er: 13, w: 2, l: 1, sv: 1, fld: 72 },
    ],
    reservePitchers: [
      { id: 'yarnaed01', name: 'Ed Yarnall', role: 'RP', throws: 'L', age: 23, g: 5, gs: 2, outs: 51, h: 17, hr: 1, bb: 10, so: 13, hbp: 0, er: 7, w: 1, l: 0, sv: 0, fld: 77, rk: true },
    ],
  },
  // TBR (TBA 1999)
  {
    franchiseId: 'TBR',
    season: 1999,
    batters: [
      { id: 'flahejo01', name: 'John Flaherty', pos: 'C', bats: 'R', age: 31, pa: 482, h: 115, double: 19, triple: 0, hr: 11, bb: 25, so: 64, hbp: 4, sb: 1, cs: 4, sec: '1B', fld: 76, arm: 77 },
      { id: 'mcgrifr01', name: 'Fred McGriff', pos: '1B', bats: 'L', age: 35, pa: 620, h: 158, double: 30, triple: 1, hr: 25, bb: 79, so: 109, hbp: 2, sb: 4, cs: 1, fld: 69 },
      { id: 'cairomi01', name: 'Miguel Cairo', pos: '2B', bats: 'R', age: 25, pa: 508, h: 132, double: 19, triple: 5, hr: 4, bb: 23, so: 44, hbp: 6, sb: 20, cs: 7, sec: 'SS', fld: 86 },
      { id: 'boggswa01', name: 'Wade Boggs', pos: '3B', bats: 'L', age: 41, pa: 334, h: 86, double: 16, triple: 2, hr: 3, bb: 36, so: 30, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 56 },
      { id: 'ledesaa01', name: 'Aaron Ledesma', pos: 'SS', bats: 'R', age: 28, pa: 312, h: 86, double: 15, triple: 1, hr: 0, bb: 14, so: 40, hbp: 2, sb: 4, cs: 3, sec: '2B', fld: 76 },
      { id: 'trammbu01', name: 'Bubba Trammell', pos: 'LF', bats: 'R', age: 27, pa: 328, h: 82, double: 21, triple: 0, hr: 15, bb: 37, so: 50, hbp: 1, sb: 1, cs: 2, sec: 'RF', fld: 74, arm: 63 },
      { id: 'winnra01', name: 'Randy Winn', pos: 'CF', bats: 'S', age: 25, pa: 324, h: 81, double: 12, triple: 6, hr: 1, bb: 20, so: 61, hbp: 1, sb: 15, cs: 10, sec: 'LF', fld: 77, arm: 69 },
      { id: 'martida01', name: 'Dave Martinez', pos: 'RF', bats: 'L', age: 34, pa: 594, h: 144, double: 22, triple: 4, hr: 7, bb: 59, so: 78, hbp: 4, sb: 13, cs: 7, sec: 'CF', fld: 64, arm: 68 },
      { id: 'cansejo01', name: 'Jose Canseco', pos: 'DH', bats: 'R', age: 34, pa: 502, h: 112, double: 19, triple: 0, hr: 33, bb: 55, so: 130, hbp: 6, sb: 12, cs: 6, sec: 'RF' },
    ],
    bench: [
      { id: 'sorrepa01', name: 'Paul Sorrento', pos: 'LF', bats: 'L', age: 33, pa: 348, h: 72, double: 16, triple: 0, hr: 13, bb: 42, so: 93, hbp: 3, sb: 1, cs: 2, sec: '1B', fld: 53, arm: 66 },
      { id: 'guilljo01', name: 'Jose Guillen', pos: 'RF', bats: 'R', age: 23, pa: 318, h: 78, double: 17, triple: 1, hr: 6, bb: 14, so: 54, hbp: 5, sb: 1, cs: 1, sec: 'LF', fld: 52, arm: 72 },
      { id: 'stockke01', name: 'Kevin Stocker', pos: 'SS', bats: 'S', age: 29, pa: 286, h: 66, double: 10, triple: 2, hr: 2, bb: 23, so: 49, hbp: 4, sb: 6, cs: 4, sec: '2B', fld: 78 },
      { id: 'perryhe01', name: 'Herbert Perry', pos: '3B', bats: 'R', age: 29, pa: 239, h: 53, double: 10, triple: 1, hr: 6, bb: 16, so: 42, hbp: 10, sb: 0, cs: 0, sec: '1B', fld: 86 },
      { id: 'smithbo06', name: 'Bob Smith', pos: '3B', bats: 'R', age: 25, pa: 219, h: 46, double: 6, triple: 1, hr: 5, bb: 17, so: 61, hbp: 2, sb: 3, cs: 3, sec: '2B', fld: 72 },
    ],
    reserveBatters: [
      { id: 'lowerte01', name: 'Terrell Lowery', pos: 'CF', bats: 'R', age: 28, pa: 206, h: 47, double: 14, triple: 1, hr: 2, bb: 20, so: 54, hbp: 1, sb: 0, cs: 2, sec: 'LF', fld: 49, arm: 75, rk: true },
      { id: 'difelmi01', name: 'Mike Difelice', pos: 'C', bats: 'R', age: 30, pa: 191, h: 47, double: 9, triple: 1, hr: 4, bb: 10, so: 33, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 59, arm: 79 },
      { id: 'mccraqu01', name: 'Quinton McCracken', pos: 'LF', bats: 'S', age: 28, pa: 165, h: 42, double: 8, triple: 1, hr: 1, bb: 12, so: 26, hbp: 1, sb: 6, cs: 3, sec: 'CF', fld: 78, arm: 63 },
      { id: 'graffto01', name: 'Tony Graffanino', pos: '2B', bats: 'R', age: 27, pa: 142, h: 32, double: 7, triple: 2, hr: 3, bb: 11, so: 27, hbp: 1, sb: 2, cs: 2, sec: 'SS', fld: 100 },
      { id: 'lambda01', name: 'David Lamb', pos: 'SS', bats: 'S', age: 24, pa: 134, h: 28, double: 5, triple: 1, hr: 1, bb: 10, so: 18, hbp: 0, sb: 0, cs: 1, sec: '2B', fld: 76, rk: true },
    ],
    pitchers: [
      { id: 'wittbo01', name: 'Bobby Witt', role: 'SP', throws: 'R', age: 35, g: 32, gs: 32, outs: 541, h: 219, hr: 27, bb: 86, so: 112, hbp: 3, er: 117, w: 7, l: 15, sv: 0, fld: 71 },
      { id: 'alvarwi01', name: 'Wilson Alvarez', role: 'SP', throws: 'L', age: 29, g: 28, gs: 28, outs: 480, h: 153, hr: 20, bb: 77, so: 129, hbp: 7, er: 76, w: 9, l: 9, sv: 0, fld: 61 },
      { id: 'rupery01', name: 'Ryan Rupe', role: 'SP', throws: 'R', age: 24, g: 24, gs: 24, outs: 427, h: 136, hr: 17, bb: 57, so: 97, hbp: 12, er: 72, w: 8, l: 9, sv: 0, fld: 52, rk: true },
      { id: 'arrojro01', name: 'Rolando Arrojo', role: 'SP', throws: 'R', age: 33, g: 24, gs: 24, outs: 422, h: 154, hr: 20, bb: 54, so: 110, hbp: 14, er: 71, w: 7, l: 12, sv: 0, fld: 78 },
      { id: 'rekarbr01', name: 'Bryan Rekar', role: 'SP', throws: 'R', age: 27, g: 27, gs: 12, outs: 284, h: 118, hr: 16, bb: 36, so: 58, hbp: 4, er: 60, w: 6, l: 6, sv: 0, fld: 76 },
      { id: 'hernaro01', name: 'Roberto Hernandez', role: 'CL', throws: 'R', age: 34, g: 72, gs: 0, outs: 220, h: 63, hr: 3, bb: 36, so: 66, hbp: 4, er: 27, w: 2, l: 3, sv: 43, fld: 69 },
      { id: 'whiteri01', name: 'Rick White', role: 'RP', throws: 'R', age: 30, g: 63, gs: 1, outs: 324, h: 126, hr: 10, bb: 38, so: 76, hbp: 2, er: 49, w: 5, l: 3, sv: 0, fld: 74 },
      { id: 'lopezal02', name: 'Albie Lopez', role: 'RP', throws: 'R', age: 27, g: 51, gs: 0, outs: 192, h: 66, hr: 7, bb: 26, so: 44, hbp: 2, er: 30, w: 3, l: 2, sv: 1, fld: 62 },
      { id: 'yanes01', name: 'Esteban Yan', role: 'RP', throws: 'R', age: 24, g: 50, gs: 1, outs: 183, h: 70, hr: 8, bb: 32, so: 51, hbp: 7, er: 37, w: 3, l: 4, sv: 0, fld: 76 },
      { id: 'santaju01', name: 'Julio Santana', role: 'RP', throws: 'R', age: 26, g: 22, gs: 5, outs: 166, h: 66, hr: 8, bb: 28, so: 30, hbp: 4, er: 37, w: 1, l: 4, sv: 0, fld: 76 },
      { id: 'charlno01', name: 'Norm Charlton', role: 'RP', throws: 'L', age: 36, g: 42, gs: 0, outs: 152, h: 53, hr: 5, bb: 35, so: 44, hbp: 1, er: 30, w: 2, l: 3, sv: 0, fld: 84 },
    ],
    reservePitchers: [
      { id: 'eilanda01', name: 'Dave Eiland', role: 'SP', throws: 'R', age: 32, g: 21, gs: 15, outs: 241, h: 99, hr: 8, bb: 28, so: 52, hbp: 3, er: 52, w: 4, l: 8, sv: 0, fld: 67 },
      { id: 'saundto01', name: 'Tony Saunders', role: 'RP', throws: 'L', age: 25, g: 9, gs: 9, outs: 126, h: 47, hr: 4, bb: 27, so: 39, hbp: 2, er: 24, w: 3, l: 3, sv: 0, fld: 77 },
      { id: 'duvalmi01', name: 'Mike Duvall', role: 'RP', throws: 'L', age: 24, g: 40, gs: 0, outs: 120, h: 46, hr: 5, bb: 27, so: 18, hbp: 2, er: 19, w: 1, l: 1, sv: 0, fld: 82, rk: true },
      { id: 'wheelda01', name: 'Dan Wheeler', role: 'RP', throws: 'R', age: 21, g: 6, gs: 6, outs: 92, h: 35, hr: 7, bb: 13, so: 32, hbp: 0, er: 20, w: 0, l: 4, sv: 0, fld: 62, rk: true },
      { id: 'mecirji01', name: 'Jim Mecir', role: 'RP', throws: 'R', age: 29, g: 17, gs: 0, outs: 62, h: 18, hr: 1, bb: 10, so: 18, hbp: 1, er: 8, w: 0, l: 1, sv: 0, fld: 76 },
    ],
  },
  // TOR (TOR 1999)
  {
    franchiseId: 'TOR',
    season: 1999,
    batters: [
      { id: 'fletcda01', name: 'Darrin Fletcher', pos: 'C', bats: 'L', age: 32, pa: 448, h: 118, double: 25, triple: 1, hr: 16, bb: 25, so: 44, hbp: 6, sb: 0, cs: 0, sec: '1B', fld: 73, arm: 66 },
      { id: 'delgaca01', name: 'Carlos Delgado', pos: '1B', bats: 'L', age: 27, pa: 681, h: 161, double: 43, triple: 1, hr: 42, bb: 82, so: 146, hbp: 13, sb: 2, cs: 1, sec: 'LF', fld: 63 },
      { id: 'bushho01', name: 'Homer Bush', pos: '2B', bats: 'R', age: 26, pa: 523, h: 158, double: 25, triple: 4, hr: 5, bb: 22, so: 86, hbp: 5, sb: 33, cs: 9, sec: 'SS', fld: 78, rk: true },
      { id: 'fernato01', name: 'Tony Fernandez', pos: '3B', bats: 'S', age: 37, pa: 576, h: 159, double: 38, triple: 1, hr: 8, bb: 60, so: 60, hbp: 10, sb: 9, cs: 8, sec: 'SS', fld: 54 },
      { id: 'batisto01', name: 'Tony Batista', pos: 'SS', bats: 'R', age: 25, pa: 573, h: 141, double: 30, triple: 1, hr: 30, bb: 37, so: 95, hbp: 6, sb: 4, cs: 1, sec: '2B', fld: 83 },
      { id: 'stewash01', name: 'Shannon Stewart', pos: 'LF', bats: 'R', age: 25, pa: 682, h: 176, double: 31, triple: 4, hr: 11, bb: 65, so: 84, hbp: 11, sb: 44, cs: 16, sec: 'CF', fld: 62, arm: 63 },
      { id: 'cruzjo02', name: 'Jose Cruz', pos: 'CF', bats: 'S', age: 25, pa: 414, h: 87, double: 17, triple: 3, hr: 15, bb: 57, so: 97, hbp: 0, sb: 12, cs: 4, sec: 'LF', fld: 85, arm: 75 },
      { id: 'greensh01', name: 'Shawn Green', pos: 'RF', bats: 'L', age: 26, pa: 696, h: 184, double: 39, triple: 2, hr: 37, bb: 59, so: 130, hbp: 8, sb: 25, cs: 8, sec: 'LF', fld: 80, arm: 62 },
      { id: 'greenwi01', name: 'Willie Greene', pos: 'DH', bats: 'L', age: 27, pa: 248, h: 51, double: 9, triple: 0, hr: 10, bb: 30, so: 50, hbp: 1, sb: 2, cs: 1, sec: '3B' },
    ],
    bench: [
      { id: 'otanewi01', name: 'Willis Otanez', pos: '3B', bats: 'R', age: 26, pa: 226, h: 49, double: 11, triple: 0, hr: 7, bb: 15, so: 47, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 54, rk: true },
      { id: 'brumfja01', name: 'Jacob Brumfield', pos: 'CF', bats: 'R', age: 34, pa: 212, h: 44, double: 7, triple: 3, hr: 2, bb: 18, so: 42, hbp: 0, sb: 2, cs: 3, sec: 'LF', fld: 75, arm: 78 },
      { id: 'mathemi01', name: 'Mike Matheny', pos: 'C', bats: 'R', age: 28, pa: 179, h: 38, double: 7, triple: 0, hr: 3, bb: 9, so: 35, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 71 },
      { id: 'gonzaal01', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 26, pa: 173, h: 39, double: 9, triple: 0, hr: 3, bb: 11, so: 31, hbp: 2, sb: 5, cs: 2, sec: '2B', fld: 100 },
      { id: 'grebecr01', name: 'Craig Grebeck', pos: '2B', bats: 'R', age: 34, pa: 134, h: 34, double: 7, triple: 0, hr: 1, bb: 13, so: 14, hbp: 2, sb: 0, cs: 1, sec: 'SS', fld: 53 },
    ],
    reserveBatters: [
      { id: 'kellypa03', name: 'Pat Kelly', pos: '2B', bats: 'R', age: 31, pa: 130, h: 28, double: 6, triple: 0, hr: 4, bb: 10, so: 30, hbp: 1, sb: 3, cs: 1, sec: '3B', fld: 59 },
      { id: 'hollida01', name: 'Dave Hollins', pos: 'DH', bats: 'S', age: 33, pa: 104, h: 24, double: 4, triple: 0, hr: 3, bb: 10, so: 19, hbp: 1, sb: 2, cs: 1, sec: '3B' },
      { id: 'wellsve01', name: 'Vernon Wells', pos: 'CF', bats: 'R', age: 20, pa: 92, h: 23, double: 5, triple: 0, hr: 1, bb: 4, so: 18, hbp: 0, sb: 1, cs: 1, sec: 'LF', fld: 68, arm: 95, rk: true },
      { id: 'berroge01', name: 'Geronimo Berroa', pos: 'DH', bats: 'R', age: 34, pa: 73, h: 16, double: 3, triple: 0, hr: 2, bb: 8, so: 14, hbp: 1, sb: 0, cs: 0, sec: 'RF' },
      { id: 'blakeca01', name: 'Casey Blake', pos: '3B', bats: 'R', age: 25, pa: 41, h: 10, double: 2, triple: 0, hr: 1, bb: 2, so: 7, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'wellsda01', name: 'David Wells', role: 'SP', throws: 'L', age: 36, g: 34, gs: 34, outs: 695, h: 242, hr: 31, bb: 51, so: 175, hbp: 5, er: 113, w: 17, l: 10, sv: 0, fld: 69 },
      { id: 'hentgpa01', name: 'Pat Hentgen', role: 'SP', throws: 'R', age: 30, g: 34, gs: 34, outs: 597, h: 221, hr: 30, bb: 66, so: 115, hbp: 4, er: 103, w: 11, l: 12, sv: 0, fld: 67 },
      { id: 'escobke01', name: 'Kelvim Escobar', role: 'SP', throws: 'R', age: 23, g: 33, gs: 30, outs: 522, h: 194, hr: 17, bb: 83, so: 141, hbp: 7, er: 101, w: 14, l: 11, sv: 0, fld: 56 },
      { id: 'carpech01', name: 'Chris Carpenter', role: 'SP', throws: 'R', age: 24, g: 24, gs: 24, outs: 450, h: 170, hr: 16, bb: 52, so: 110, hbp: 4, er: 74, w: 9, l: 8, sv: 0, fld: 67 },
      { id: 'hallaro01', name: 'Roy Halladay', role: 'SP', throws: 'R', age: 22, g: 36, gs: 18, outs: 448, h: 154, hr: 19, bb: 76, so: 86, hbp: 4, er: 64, w: 8, l: 7, sv: 1, fld: 69, rk: true },
      { id: 'kochbi01', name: 'Billy Koch', role: 'CL', throws: 'R', age: 24, g: 56, gs: 0, outs: 191, h: 55, hr: 5, bb: 30, so: 57, hbp: 3, er: 24, w: 0, l: 5, sv: 31, fld: 87, rk: true },
      { id: 'spoljpa01', name: 'Paul Spoljaric', role: 'RP', throws: 'L', age: 28, g: 42, gs: 5, outs: 220, h: 79, hr: 10, bb: 43, so: 76, hbp: 2, er: 49, w: 2, l: 5, sv: 0, fld: 70 },
      { id: 'lloydgr01', name: 'Graeme Lloyd', role: 'RP', throws: 'L', age: 32, g: 74, gs: 0, outs: 216, h: 67, hr: 10, bb: 22, so: 44, hbp: 4, er: 26, w: 5, l: 3, sv: 3, fld: 67 },
      { id: 'frascjo01', name: 'John Frascatore', role: 'RP', throws: 'R', age: 29, g: 59, gs: 0, outs: 210, h: 70, hr: 9, bb: 24, so: 39, hbp: 3, er: 29, w: 8, l: 5, sv: 1, fld: 87 },
      { id: 'daveyto01', name: 'Tom Davey', role: 'RP', throws: 'R', age: 25, g: 45, gs: 0, outs: 195, h: 62, hr: 5, bb: 40, so: 59, hbp: 7, er: 34, w: 2, l: 1, sv: 1, fld: 69, rk: true },
      { id: 'munrope01', name: 'Peter Munro', role: 'RP', throws: 'R', age: 24, g: 31, gs: 2, outs: 166, h: 70, hr: 6, bb: 23, so: 38, hbp: 2, er: 37, w: 0, l: 2, sv: 0, fld: 74, rk: true },
    ],
    reservePitchers: [
      { id: 'hamiljo02', name: 'Joey Hamilton', role: 'SP', throws: 'R', age: 28, g: 22, gs: 18, outs: 294, h: 108, hr: 10, bb: 43, so: 63, hbp: 4, er: 55, w: 7, l: 8, sv: 0, fld: 67 },
      { id: 'quantpa01', name: 'Paul Quantrill', role: 'RP', throws: 'R', age: 30, g: 41, gs: 0, outs: 146, h: 55, hr: 4, bb: 14, so: 32, hbp: 2, er: 15, w: 3, l: 2, sv: 0, fld: 75 },
      { id: 'plesada01', name: 'Dan Plesac', role: 'RP', throws: 'L', age: 37, g: 64, gs: 0, outs: 133, h: 45, hr: 6, bb: 17, so: 54, hbp: 0, er: 24, w: 2, l: 4, sv: 1, fld: 73 },
    ],
  },
  // CWS (CHA 1999)
  {
    franchiseId: 'CWS',
    season: 1999,
    batters: [
      { id: 'fordybr01', name: 'Brook Fordyce', pos: 'C', bats: 'R', age: 29, pa: 362, h: 94, double: 24, triple: 1, hr: 8, bb: 22, so: 52, hbp: 2, sb: 2, cs: 0, sec: '1B', fld: 71, arm: 69 },
      { id: 'konerpa01', name: 'Paul Konerko', pos: '1B', bats: 'R', age: 23, pa: 564, h: 142, double: 26, triple: 3, hr: 22, bb: 44, so: 74, hbp: 3, sb: 1, cs: 1, sec: '3B', fld: 73 },
      { id: 'durhara01', name: 'Ray Durham', pos: '2B', bats: 'S', age: 27, pa: 694, h: 176, double: 31, triple: 7, hr: 14, bb: 70, so: 102, hbp: 5, sb: 34, cs: 11, sec: 'SS', fld: 68 },
      { id: 'nortogr01', name: 'Greg Norton', pos: '3B', bats: 'S', age: 26, pa: 510, h: 111, double: 26, triple: 1, hr: 15, bb: 60, so: 101, hbp: 2, sb: 4, cs: 4, sec: '1B', fld: 64 },
      { id: 'carusmi01', name: 'Mike Caruso', pos: 'SS', bats: 'L', age: 22, pa: 564, h: 144, double: 13, triple: 5, hr: 3, bb: 18, so: 37, hbp: 5, sb: 16, cs: 11, sec: '2B', fld: 62 },
      { id: 'leeca01', name: 'Carlos Lee', pos: 'LF', bats: 'R', age: 23, pa: 517, h: 144, double: 32, triple: 2, hr: 16, bb: 13, so: 72, hbp: 4, sb: 4, cs: 2, sec: 'RF', fld: 73, arm: 64, rk: true },
      { id: 'singlch01', name: 'Chris Singleton', pos: 'CF', bats: 'L', age: 26, pa: 529, h: 149, double: 31, triple: 6, hr: 17, bb: 22, so: 45, hbp: 1, sb: 20, cs: 5, sec: 'LF', fld: 93, arm: 73, rk: true },
      { id: 'ordonma01', name: 'Magglio Ordonez', pos: 'RF', bats: 'R', age: 25, pa: 677, h: 184, double: 33, triple: 3, hr: 25, bb: 41, so: 64, hbp: 4, sb: 12, cs: 7, sec: 'CF', fld: 77, arm: 72 },
      { id: 'thomafr04', name: 'Frank Thomas', pos: 'DH', bats: 'R', age: 31, pa: 590, h: 144, double: 33, triple: 1, hr: 21, bb: 91, so: 70, hbp: 6, sb: 4, cs: 2, sec: '1B' },
    ],
    bench: [
      { id: 'wilsocr02', name: 'Craig Wilson', pos: '3B', bats: 'R', age: 28, pa: 282, h: 66, double: 10, triple: 1, hr: 5, bb: 22, so: 23, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 89, rk: true },
      { id: 'johnsma02', name: 'Mark Johnson', pos: 'C', bats: 'L', age: 23, pa: 248, h: 45, double: 10, triple: 1, hr: 4, bb: 34, so: 59, hbp: 2, sb: 3, cs: 1, sec: '1B', fld: 64, arm: 72, rk: true },
      { id: 'jacksda03', name: 'Darrin Jackson', pos: 'LF', bats: 'R', age: 35, pa: 155, h: 38, double: 9, triple: 1, hr: 3, bb: 5, so: 23, hbp: 0, sb: 2, cs: 1, sec: 'CF', fld: 99, arm: 70 },
      { id: 'simmobr01', name: 'Brian Simmons', pos: 'LF', bats: 'S', age: 25, pa: 135, h: 31, double: 3, triple: 3, hr: 5, bb: 8, so: 29, hbp: 0, sb: 4, cs: 1, sec: 'CF', fld: 90, arm: 72, rk: true },
      { id: 'liefeje01', name: 'Jeff Liefer', pos: '1B', bats: 'L', age: 24, pa: 122, h: 28, double: 7, triple: 1, hr: 0, bb: 8, so: 28, hbp: 0, sb: 2, cs: 0, sec: 'LF', rk: true },
    ],
    reserveBatters: [
      { id: 'rodrili01', name: 'Liu Rodriguez', pos: '2B', bats: 'S', age: 22, pa: 111, h: 22, double: 2, triple: 2, hr: 1, bb: 12, so: 11, hbp: 3, sb: 0, cs: 0, sec: 'SS', fld: 46, rk: true },
      { id: 'abbotje01', name: 'Jeff Abbott', pos: 'LF', bats: 'R', age: 26, pa: 64, h: 15, double: 2, triple: 0, hr: 3, bb: 3, so: 8, hbp: 0, sb: 1, cs: 1, sec: 'CF', fld: 47, arm: 56 },
      { id: 'chrismc01', name: 'McKay Christensen', pos: 'CF', bats: 'L', age: 23, pa: 60, h: 12, double: 1, triple: 0, hr: 1, bb: 4, so: 7, hbp: 0, sb: 2, cs: 1, sec: 'LF', fld: 77, arm: 54, rk: true },
    ],
    pitchers: [
      { id: 'sirotmi01', name: 'Mike Sirotka', role: 'SP', throws: 'L', age: 28, g: 32, gs: 32, outs: 627, h: 242, hr: 26, bb: 52, so: 126, hbp: 3, er: 101, w: 11, l: 13, sv: 0, fld: 57 },
      { id: 'baldwja01', name: 'James Baldwin', role: 'SP', throws: 'R', age: 27, g: 35, gs: 33, outs: 598, h: 217, hr: 28, bb: 80, so: 130, hbp: 8, er: 115, w: 12, l: 13, sv: 0, fld: 65 },
      { id: 'parquji01', name: 'Jim Parque', role: 'SP', throws: 'L', age: 24, g: 31, gs: 30, outs: 521, h: 210, hr: 23, bb: 78, so: 114, hbp: 10, er: 99, w: 9, l: 15, sv: 0, fld: 65 },
      { id: 'navarja01', name: 'Jaime Navarro', role: 'SP', throws: 'R', age: 32, g: 32, gs: 27, outs: 479, h: 207, hr: 26, bb: 69, so: 79, hbp: 8, er: 110, w: 8, l: 13, sv: 0, fld: 62 },
      { id: 'snydejo02', name: 'John Snyder', role: 'SP', throws: 'R', age: 24, g: 25, gs: 25, outs: 388, h: 163, hr: 26, bb: 45, so: 72, hbp: 5, er: 89, w: 9, l: 12, sv: 0, fld: 71 },
      { id: 'howrybo01', name: 'Bob Howry', role: 'CL', throws: 'R', age: 25, g: 69, gs: 0, outs: 203, h: 56, hr: 9, bb: 34, so: 77, hbp: 3, er: 27, w: 5, l: 3, sv: 28, fld: 48 },
      { id: 'foulkke01', name: 'Keith Foulke', role: 'RP', throws: 'R', age: 26, g: 67, gs: 0, outs: 316, h: 79, hr: 12, bb: 25, so: 105, hbp: 4, er: 37, w: 3, l: 3, sv: 9, fld: 65 },
      { id: 'lowese01', name: 'Sean Lowe', role: 'RP', throws: 'R', age: 28, g: 64, gs: 0, outs: 287, h: 95, hr: 10, bb: 47, so: 59, hbp: 4, er: 46, w: 4, l: 1, sv: 0, fld: 77, rk: true },
      { id: 'simasbi01', name: 'Bill Simas', role: 'RP', throws: 'R', age: 27, g: 70, gs: 0, outs: 216, h: 69, hr: 9, bb: 31, so: 51, hbp: 4, er: 31, w: 6, l: 3, sv: 2, fld: 62 },
      { id: 'castica02', name: 'Carlos Castillo', role: 'RP', throws: 'R', age: 24, g: 18, gs: 2, outs: 123, h: 41, hr: 8, bb: 15, so: 25, hbp: 1, er: 24, w: 2, l: 2, sv: 0, fld: 80 },
      { id: 'wardbr01', name: 'Bryan Ward', role: 'RP', throws: 'L', age: 27, g: 40, gs: 0, outs: 118, h: 59, hr: 9, bb: 11, so: 33, hbp: 0, er: 28, w: 0, l: 1, sv: 0, fld: 69, rk: true },
    ],
    reservePitchers: [
      { id: 'wellski01', name: 'Kip Wells', role: 'RP', throws: 'R', age: 22, g: 7, gs: 7, outs: 107, h: 33, hr: 2, bb: 15, so: 29, hbp: 3, er: 16, w: 4, l: 1, sv: 0, fld: 77, rk: true },
      { id: 'eyresc01', name: 'Scott Eyre', role: 'RP', throws: 'L', age: 27, g: 21, gs: 0, outs: 75, h: 31, hr: 6, bb: 16, so: 18, hbp: 1, er: 17, w: 1, l: 1, sv: 0, fld: 60 },
      { id: 'lundqda01', name: 'David Lundquist', role: 'RP', throws: 'R', age: 26, g: 17, gs: 0, outs: 66, h: 28, hr: 3, bb: 12, so: 18, hbp: 1, er: 21, w: 1, l: 1, sv: 0, fld: 65, rk: true },
      { id: 'penaje01', name: 'Jesus Pena', role: 'RP', throws: 'L', age: 24, g: 26, gs: 0, outs: 61, h: 21, hr: 3, bb: 23, so: 20, hbp: 1, er: 12, w: 0, l: 0, sv: 0, fld: 78, rk: true },
      { id: 'myettaa01', name: 'Aaron Myette', role: 'RP', throws: 'R', age: 21, g: 4, gs: 3, outs: 47, h: 17, hr: 2, bb: 14, so: 11, hbp: 2, er: 11, w: 0, l: 2, sv: 0, fld: 63, rk: true },
    ],
  },
  // CLE (CLE 1999)
  {
    franchiseId: 'CLE',
    season: 1999,
    batters: [
      { id: 'diazei01', name: 'Einar Diaz', pos: 'C', bats: 'R', age: 26, pa: 427, h: 108, double: 20, triple: 1, hr: 4, bb: 23, so: 39, hbp: 6, sb: 10, cs: 4, sec: '1B', fld: 71, arm: 73, rk: true },
      { id: 'thomeji01', name: 'Jim Thome', pos: '1B', bats: 'L', age: 28, pa: 629, h: 142, double: 31, triple: 2, hr: 35, bb: 119, so: 165, hbp: 4, sb: 1, cs: 0, sec: '3B', fld: 78 },
      { id: 'alomaro01', name: 'Roberto Alomar', pos: '2B', bats: 'S', age: 31, pa: 694, h: 182, double: 39, triple: 2, hr: 20, bb: 82, so: 85, hbp: 5, sb: 28, cs: 6, sec: 'SS', fld: 73 },
      { id: 'wilsoen01', name: 'Enrique Wilson', pos: '3B', bats: 'S', age: 25, pa: 368, h: 91, double: 22, triple: 1, hr: 3, bb: 23, so: 40, hbp: 1, sb: 5, cs: 6, sec: 'SS', fld: 57, rk: true },
      { id: 'vizquom01', name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 32, pa: 664, h: 179, double: 32, triple: 5, hr: 4, bb: 63, so: 56, hbp: 2, sb: 41, cs: 11, sec: '2B', fld: 73 },
      { id: 'justida01', name: 'David Justice', pos: 'LF', bats: 'L', age: 33, pa: 530, h: 129, double: 25, triple: 1, hr: 21, bb: 80, so: 84, hbp: 1, sb: 4, cs: 3, sec: 'RF', fld: 61, arm: 76 },
      { id: 'loftoke01', name: 'Kenny Lofton', pos: 'CF', bats: 'L', age: 32, pa: 560, h: 142, double: 26, triple: 6, hr: 8, bb: 73, so: 76, hbp: 4, sb: 32, cs: 9, sec: 'LF', fld: 65, arm: 79 },
      { id: 'ramirma02', name: 'Manny Ramirez', pos: 'RF', bats: 'R', age: 27, pa: 640, h: 171, double: 35, triple: 2, hr: 41, bb: 85, so: 123, hbp: 10, sb: 3, cs: 3, sec: 'LF', fld: 61, arm: 66 },
      { id: 'sexsori01', name: 'Richie Sexson', pos: 'DH', bats: 'R', age: 24, pa: 525, h: 128, double: 21, triple: 6, hr: 31, bb: 31, so: 118, hbp: 5, sb: 3, cs: 3, sec: '1B', fld: 78 },
    ],
    bench: [
      { id: 'frymatr01', name: 'Travis Fryman', pos: '3B', bats: 'R', age: 30, pa: 350, h: 87, double: 17, triple: 2, hr: 13, bb: 25, so: 64, hbp: 2, sb: 5, cs: 3, sec: 'SS', fld: 62 },
      { id: 'cordewi01', name: 'Wil Cordero', pos: 'LF', bats: 'R', age: 27, pa: 217, h: 56, double: 12, triple: 1, hr: 7, bb: 13, so: 40, hbp: 3, sb: 1, cs: 1, sec: '1B', fld: 60, arm: 56 },
      { id: 'roberda07', name: 'Dave Roberts', pos: 'CF', bats: 'L', age: 27, pa: 156, h: 34, double: 4, triple: 0, hr: 2, bb: 9, so: 16, hbp: 0, sb: 11, cs: 3, sec: 'LF', fld: 79, arm: 54, rk: true },
      { id: 'alomasa02', name: 'Sandy Alomar', pos: 'C', bats: 'R', age: 33, pa: 144, h: 37, double: 10, triple: 0, hr: 4, bb: 5, so: 17, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 63, arm: 54 },
      { id: 'ramiral02', name: 'Alex Ramirez', pos: 'RF', bats: 'R', age: 24, pa: 102, h: 28, double: 6, triple: 1, hr: 3, bb: 3, so: 27, hbp: 1, sb: 1, cs: 1, sec: 'LF', rk: true },
    ],
    reserveBatters: [
      { id: 'cruzja01', name: 'Jacob Cruz', pos: 'CF', bats: 'L', age: 26, pa: 96, h: 27, double: 5, triple: 1, hr: 3, bb: 5, so: 14, hbp: 1, sb: 0, cs: 2, sec: 'RF', fld: 73, arm: 54, rk: true },
      { id: 'mantoje01', name: 'Jeff Manto', pos: '3B', bats: 'R', age: 34, pa: 47, h: 9, double: 1, triple: 0, hr: 2, bb: 7, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B' },
      { id: 'branyru01', name: 'Russell Branyan', pos: '3B', bats: 'L', age: 23, pa: 42, h: 8, double: 2, triple: 0, hr: 1, bb: 3, so: 19, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'burbada01', name: 'Dave Burba', role: 'SP', throws: 'R', age: 32, g: 34, gs: 34, outs: 660, h: 217, hr: 31, bb: 89, so: 164, hbp: 8, er: 104, w: 15, l: 9, sv: 0, fld: 76 },
      { id: 'colonba01', name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 26, g: 32, gs: 32, outs: 615, h: 194, hr: 21, bb: 78, so: 156, hbp: 5, er: 90, w: 18, l: 5, sv: 0, fld: 78 },
      { id: 'nagych01', name: 'Charles Nagy', role: 'SP', throws: 'R', age: 32, g: 33, gs: 32, outs: 606, h: 236, hr: 28, bb: 62, so: 123, hbp: 7, er: 110, w: 17, l: 11, sv: 0, fld: 82 },
      { id: 'wrighja02', name: 'Jaret Wright', role: 'SP', throws: 'R', age: 23, g: 26, gs: 26, outs: 401, h: 144, hr: 17, bb: 68, so: 96, hbp: 7, er: 80, w: 8, l: 10, sv: 0, fld: 68 },
      { id: 'goodedw01', name: 'Dwight Gooden', role: 'SP', throws: 'R', age: 34, g: 26, gs: 22, outs: 345, h: 126, hr: 15, bb: 59, so: 82, hbp: 9, er: 67, w: 3, l: 4, sv: 0, fld: 62 },
      { id: 'jacksmi02', name: 'Michael Jackson', role: 'CL', throws: 'R', age: 34, g: 72, gs: 0, outs: 206, h: 56, hr: 8, bb: 23, so: 60, hbp: 3, er: 25, w: 3, l: 4, sv: 39, fld: 65 },
      { id: 'shueypa01', name: 'Paul Shuey', role: 'RP', throws: 'R', age: 28, g: 72, gs: 0, outs: 245, h: 70, hr: 8, bb: 41, so: 96, hbp: 2, er: 33, w: 8, l: 5, sv: 6, fld: 77 },
      { id: 'karsast01', name: 'Steve Karsay', role: 'RP', throws: 'R', age: 27, g: 50, gs: 3, outs: 236, h: 80, hr: 8, bb: 27, so: 59, hbp: 3, er: 36, w: 10, l: 2, sv: 1, fld: 61 },
      { id: 'langsma01', name: 'Mark Langston', role: 'RP', throws: 'L', age: 38, g: 25, gs: 5, outs: 185, h: 73, hr: 9, bb: 30, so: 41, hbp: 0, er: 37, w: 1, l: 2, sv: 0, fld: 75 },
      { id: 'reedst01', name: 'Steve Reed', role: 'RP', throws: 'R', age: 34, g: 63, gs: 0, outs: 185, h: 58, hr: 9, bb: 22, so: 51, hbp: 4, er: 27, w: 3, l: 2, sv: 0, fld: 62 },
      { id: 'rincori01', name: 'Ricardo Rincon', role: 'RP', throws: 'L', age: 29, g: 59, gs: 0, outs: 134, h: 39, hr: 5, bb: 22, so: 41, hbp: 1, er: 19, w: 2, l: 3, sv: 0, fld: 72 },
    ],
    reservePitchers: [
      { id: 'haneych01', name: 'Chris Haney', role: 'RP', throws: 'L', age: 30, g: 13, gs: 4, outs: 121, h: 47, hr: 6, bb: 14, so: 22, hbp: 2, er: 27, w: 0, l: 2, sv: 0, fld: 71 },
      { id: 'assenpa01', name: 'Paul Assenmacher', role: 'RP', throws: 'L', age: 38, g: 55, gs: 0, outs: 99, h: 44, hr: 5, bb: 15, so: 33, hbp: 1, er: 21, w: 2, l: 1, sv: 0, fld: 73 },
      { id: 'broweji01', name: 'Jim Brower', role: 'RP', throws: 'R', age: 26, g: 9, gs: 2, outs: 77, h: 27, hr: 8, bb: 10, so: 18, hbp: 1, er: 13, w: 3, l: 1, sv: 0, fld: 66, rk: true },
      { id: 'riskeda01', name: 'David Riske', role: 'RP', throws: 'R', age: 22, g: 12, gs: 0, outs: 42, h: 20, hr: 2, bb: 6, so: 16, hbp: 0, er: 13, w: 1, l: 1, sv: 0, fld: 61, rk: true },
      { id: 'depause01', name: 'Sean DePaula', role: 'RP', throws: 'R', age: 25, g: 11, gs: 0, outs: 35, h: 8, hr: 0, bb: 3, so: 18, hbp: 0, er: 6, w: 0, l: 0, sv: 0, fld: 75, rk: true },
    ],
  },
  // DET (DET 1999)
  {
    franchiseId: 'DET',
    season: 1999,
    batters: [
      { id: 'ausmubr01', name: 'Brad Ausmus', pos: 'C', bats: 'R', age: 30, pa: 527, h: 125, double: 21, triple: 5, hr: 8, bb: 52, so: 72, hbp: 9, sb: 12, cs: 7, sec: '1B', fld: 77, arm: 74 },
      { id: 'clarkto02', name: 'Tony Clark', pos: '1B', bats: 'S', age: 27, pa: 609, h: 152, double: 30, triple: 0, hr: 30, bb: 65, so: 126, hbp: 4, sb: 2, cs: 2, sec: '3B', fld: 70 },
      { id: 'easleda01', name: 'Damion Easley', pos: '2B', bats: 'R', age: 29, pa: 627, h: 148, double: 33, triple: 2, hr: 22, bb: 49, so: 115, hbp: 17, sb: 15, cs: 5, sec: 'SS', fld: 78 },
      { id: 'palmede01', name: 'Dean Palmer', pos: '3B', bats: 'R', age: 30, pa: 631, h: 151, double: 27, triple: 2, hr: 34, bb: 52, so: 144, hbp: 8, sb: 5, cs: 3, sec: '1B', fld: 62 },
      { id: 'cruzde01', name: 'Deivi Cruz', pos: 'SS', bats: 'R', age: 26, pa: 553, h: 140, double: 31, triple: 1, hr: 9, bb: 14, so: 60, hbp: 3, sb: 2, cs: 5, sec: '2B', fld: 79 },
      { id: 'encarju01', name: 'Juan Encarnacion', pos: 'LF', bats: 'R', age: 23, pa: 538, h: 136, double: 29, triple: 7, hr: 19, bb: 16, so: 111, hbp: 8, sb: 31, cs: 12, sec: 'CF', fld: 73, arm: 76 },
      { id: 'kaplega01', name: 'Gabe Kapler', pos: 'CF', bats: 'R', age: 23, pa: 468, h: 102, double: 21, triple: 5, hr: 17, bb: 41, so: 74, hbp: 2, sb: 12, cs: 5, sec: 'RF', fld: 69, arm: 63, rk: true },
      { id: 'higgibo02', name: 'Bobby Higginson', pos: 'RF', bats: 'L', age: 28, pa: 445, h: 104, double: 21, triple: 2, hr: 15, bb: 52, so: 65, hbp: 3, sb: 4, cs: 4, sec: 'LF', fld: 67, arm: 60 },
      { id: 'polonlu01', name: 'Luis Polonia', pos: 'DH', bats: 'L', age: 35, pa: 355, h: 108, double: 21, triple: 8, hr: 10, bb: 16, so: 32, hbp: 2, sb: 17, cs: 9, sec: 'LF' },
    ],
    bench: [
      { id: 'catalfr01', name: 'Frank Catalanotto', pos: '1B', bats: 'L', age: 25, pa: 315, h: 80, double: 19, triple: 1, hr: 10, bb: 16, so: 51, hbp: 8, sb: 3, cs: 3, sec: '3B', fld: 69 },
      { id: 'garcika01', name: 'Karim Garcia', pos: 'RF', bats: 'L', age: 23, pa: 309, h: 66, double: 9, triple: 5, hr: 11, bb: 19, so: 68, hbp: 0, sb: 3, cs: 4, sec: 'LF', fld: 61, arm: 75 },
      { id: 'jeffegr01', name: 'Gregg Jefferies', pos: 'DH', bats: 'S', age: 31, pa: 225, h: 55, double: 10, triple: 1, hr: 4, bb: 14, so: 12, hbp: 2, sb: 4, cs: 2, sec: 'LF' },
      { id: 'haselbi01', name: 'Bill Haselman', pos: 'C', bats: 'R', age: 33, pa: 153, h: 39, double: 9, triple: 0, hr: 5, bb: 9, so: 26, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 70, arm: 69 },
      { id: 'barteki01', name: 'Kimera Bartee', pos: 'CF', bats: 'S', age: 26, pa: 89, h: 15, double: 2, triple: 2, hr: 1, bb: 8, so: 24, hbp: 0, sb: 6, cs: 4, sec: 'LF', fld: 84, arm: 54 },
    ],
    reserveBatters: [
      { id: 'alvarga01', name: 'Gabe Alvarez', pos: 'DH', bats: 'R', age: 25, pa: 56, h: 11, double: 3, triple: 0, hr: 1, bb: 4, so: 14, hbp: 0, sb: 0, cs: 1, sec: '3B' },
      { id: 'fickro01', name: 'Robert Fick', pos: 'DH', bats: 'L', age: 25, pa: 49, h: 11, double: 1, triple: 0, hr: 4, bb: 6, so: 8, hbp: 0, sb: 1, cs: 0, sec: '1B', rk: true },
      { id: 'woodja02', name: 'Jason Wood', pos: '3B', bats: 'R', age: 29, pa: 47, h: 9, double: 2, triple: 0, hr: 1, bb: 3, so: 12, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
    ],
    pitchers: [
      { id: 'mlickda01', name: 'Dave Mlicki', role: 'SP', throws: 'R', age: 31, g: 33, gs: 31, outs: 597, h: 214, hr: 25, bb: 73, so: 131, hbp: 10, er: 100, w: 14, l: 13, sv: 0, fld: 64 },
      { id: 'moehlbr01', name: 'Brian Moehler', role: 'SP', throws: 'R', age: 27, g: 32, gs: 32, outs: 589, h: 220, hr: 25, bb: 58, so: 110, hbp: 5, er: 102, w: 10, l: 16, sv: 0, fld: 81 },
      { id: 'weaveje01', name: 'Jeff Weaver', role: 'SP', throws: 'R', age: 22, g: 30, gs: 29, outs: 491, h: 176, hr: 27, bb: 56, so: 114, hbp: 17, er: 101, w: 9, l: 12, sv: 0, fld: 69, rk: true },
      { id: 'thompju02', name: 'Justin Thompson', role: 'SP', throws: 'L', age: 26, g: 24, gs: 24, outs: 428, h: 147, hr: 18, bb: 54, so: 93, hbp: 2, er: 69, w: 9, l: 11, sv: 0, fld: 58 },
      { id: 'blairwi01', name: 'Willie Blair', role: 'SP', throws: 'R', age: 33, g: 39, gs: 16, outs: 402, h: 158, hr: 25, bb: 44, so: 77, hbp: 3, er: 86, w: 3, l: 11, sv: 0, fld: 68 },
      { id: 'jonesto02', name: 'Todd Jones', role: 'CL', throws: 'R', age: 31, g: 65, gs: 0, outs: 199, h: 62, hr: 6, bb: 36, so: 63, hbp: 1, er: 30, w: 4, l: 4, sv: 30, fld: 68 },
      { id: 'brocado01', name: 'Doug Brocail', role: 'RP', throws: 'R', age: 32, g: 70, gs: 0, outs: 246, h: 63, hr: 6, bb: 26, so: 73, hbp: 3, er: 24, w: 4, l: 4, sv: 2, fld: 62 },
      { id: 'nitkocj01', name: 'C. J. Nitkowski', role: 'RP', throws: 'L', age: 26, g: 68, gs: 7, outs: 245, h: 65, hr: 9, bb: 41, so: 64, hbp: 5, er: 38, w: 4, l: 5, sv: 0, fld: 76 },
      { id: 'floribr01', name: 'Bryce Florie', role: 'RP', throws: 'R', age: 29, g: 41, gs: 5, outs: 244, h: 89, hr: 8, bb: 37, so: 62, hbp: 2, er: 43, w: 4, l: 1, sv: 0, fld: 55 },
      { id: 'cruzne01', name: 'Nelson Cruz', role: 'RP', throws: 'R', age: 26, g: 29, gs: 6, outs: 200, h: 74, hr: 12, bb: 23, so: 47, hbp: 3, er: 43, w: 2, l: 5, sv: 0, fld: 60, rk: true },
      { id: 'kidama01', name: 'Masao Kida', role: 'RP', throws: 'R', age: 30, g: 49, gs: 0, outs: 194, h: 73, hr: 6, bb: 30, so: 50, hbp: 4, er: 45, w: 1, l: 0, sv: 1, fld: 71, rk: true },
    ],
    reservePitchers: [
      { id: 'borkoda01', name: 'Dave Borkowski', role: 'SP', throws: 'R', age: 22, g: 17, gs: 12, outs: 230, h: 86, hr: 10, bb: 40, so: 50, hbp: 4, er: 52, w: 2, l: 6, sv: 0, fld: 82, rk: true },
      { id: 'anderma01', name: 'Matt Anderson', role: 'RP', throws: 'R', age: 22, g: 37, gs: 0, outs: 114, h: 34, hr: 6, bb: 32, so: 35, hbp: 1, er: 20, w: 2, l: 1, sv: 0, fld: 79, rk: true },
      { id: 'cordefr01', name: 'Francisco Cordero', role: 'RP', throws: 'R', age: 24, g: 20, gs: 0, outs: 57, h: 19, hr: 2, bb: 18, so: 19, hbp: 0, er: 7, w: 2, l: 2, sv: 0, fld: 54, rk: true },
      { id: 'rojasme01', name: 'Mel Rojas', role: 'RP', throws: 'R', age: 32, g: 13, gs: 0, outs: 42, h: 19, hr: 3, bb: 8, so: 14, hbp: 2, er: 14, w: 0, l: 0, sv: 0, fld: 65 },
      { id: 'brunswi01', name: 'Will Brunson', role: 'RP', throws: 'L', age: 29, g: 17, gs: 0, outs: 36, h: 17, hr: 2, bb: 6, so: 8, hbp: 0, er: 8, w: 1, l: 0, sv: 0, fld: 71, rk: true },
    ],
  },
  // KCR (KCA 1999)
  {
    franchiseId: 'KCR',
    season: 1999,
    batters: [
      { id: 'kreutch01', name: 'Chad Kreuter', pos: 'C', bats: 'S', age: 34, pa: 368, h: 75, double: 14, triple: 1, hr: 4, bb: 37, so: 67, hbp: 4, sb: 0, cs: 1, fld: 73, arm: 72 },
      { id: 'sweenmi01', name: 'Mike Sweeney', pos: '1B', bats: 'R', age: 25, pa: 643, h: 173, double: 40, triple: 1, hr: 20, bb: 52, so: 58, hbp: 9, sb: 6, cs: 3, sec: '3B', fld: 53 },
      { id: 'febleca01', name: 'Carlos Febles', pos: '2B', bats: 'R', age: 23, pa: 524, h: 118, double: 22, triple: 10, hr: 10, bb: 48, so: 92, hbp: 9, sb: 21, cs: 5, sec: 'SS', fld: 79, rk: true },
      { id: 'randajo01', name: 'Joe Randa', pos: '3B', bats: 'R', age: 29, pa: 689, h: 184, double: 34, triple: 7, hr: 14, bb: 52, so: 85, hbp: 6, sb: 7, cs: 5, sec: '2B', fld: 78 },
      { id: 'sanchre01', name: 'Rey Sanchez', pos: 'SS', bats: 'R', age: 31, pa: 518, h: 139, double: 21, triple: 4, hr: 2, bb: 23, so: 57, hbp: 4, sb: 7, cs: 4, sec: '2B', fld: 99 },
      { id: 'damonjo01', name: 'Johnny Damon', pos: 'LF', bats: 'L', age: 25, pa: 660, h: 172, double: 32, triple: 9, hr: 14, bb: 60, so: 65, hbp: 3, sb: 30, cs: 9, sec: 'CF', fld: 80, arm: 71 },
      { id: 'beltrca01', name: 'Carlos Beltran', pos: 'CF', bats: 'S', age: 22, pa: 723, h: 193, double: 29, triple: 9, hr: 21, bb: 45, so: 124, hbp: 4, sb: 27, cs: 8, sec: 'LF', fld: 71, arm: 81, rk: true },
      { id: 'dyeje01', name: 'Jermaine Dye', pos: 'RF', bats: 'R', age: 25, pa: 673, h: 170, double: 38, triple: 6, hr: 24, bb: 52, so: 122, hbp: 1, sb: 3, cs: 3, sec: 'LF', fld: 83, arm: 79 },
      { id: 'giambje01', name: 'Jeremy Giambi', pos: 'DH', bats: 'L', age: 24, pa: 336, h: 80, double: 14, triple: 1, hr: 4, bb: 42, so: 64, hbp: 3, sb: 0, cs: 1, sec: '1B', rk: true },
    ],
    bench: [
      { id: 'spehrti01', name: 'Tim Spehr', pos: 'C', bats: 'R', age: 32, pa: 187, h: 30, double: 7, triple: 0, hr: 7, bb: 23, so: 45, hbp: 6, sb: 1, cs: 0, sec: '1B', fld: 71, arm: 59 },
      { id: 'posesc01', name: 'Scott Pose', pos: 'LF', bats: 'L', age: 32, pa: 160, h: 38, double: 3, triple: 0, hr: 0, bb: 20, so: 21, hbp: 0, sb: 6, cs: 2, sec: 'RF' },
      { id: 'suttola01', name: 'Larry Sutton', pos: '1B', bats: 'L', age: 29, pa: 118, h: 25, double: 5, triple: 0, hr: 2, bb: 11, so: 16, hbp: 1, sb: 1, cs: 1, sec: 'LF', fld: 61 },
      { id: 'holbera01', name: 'Ray Holbert', pos: 'SS', bats: 'R', age: 28, pa: 115, h: 26, double: 3, triple: 0, hr: 0, bb: 8, so: 21, hbp: 0, sb: 6, cs: 4, sec: '2B', fld: 67, rk: true },
      { id: 'hanseje01', name: 'Jed Hansen', pos: '2B', bats: 'R', age: 26, pa: 94, h: 18, double: 2, triple: 0, hr: 2, bb: 10, so: 31, hbp: 0, sb: 1, cs: 1, sec: 'SS', fld: 69, rk: true },
    ],
    reserveBatters: [
      { id: 'kingje01', name: 'Jeff King', pos: '1B', bats: 'R', age: 34, pa: 91, h: 20, double: 3, triple: 0, hr: 4, bb: 10, so: 12, hbp: 1, sb: 2, cs: 0, sec: '3B', fld: 73 },
      { id: 'leiussc01', name: 'Scott Leius', pos: '1B', bats: 'R', age: 33, pa: 82, h: 15, double: 1, triple: 0, hr: 1, bb: 3, so: 9, hbp: 1, sb: 1, cs: 0, sec: '3B' },
      { id: 'scarsst01', name: 'Steve Scarsone', pos: 'SS', bats: 'R', age: 33, pa: 79, h: 14, double: 5, triple: 0, hr: 0, bb: 9, so: 24, hbp: 0, sb: 1, cs: 0, sec: '2B' },
      { id: 'fasansa01', name: 'Sal Fasano', pos: 'C', bats: 'R', age: 27, pa: 75, h: 15, double: 3, triple: 0, hr: 3, bb: 4, so: 17, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 79, arm: 68 },
      { id: 'quinnma01', name: 'Mark Quinn', pos: 'LF', bats: 'R', age: 25, pa: 65, h: 20, double: 4, triple: 1, hr: 6, bb: 4, so: 11, hbp: 1, sb: 1, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'appieke01', name: 'Kevin Appier', role: 'SP', throws: 'R', age: 31, g: 34, gs: 34, outs: 627, h: 225, hr: 26, bb: 80, so: 144, hbp: 6, er: 113, w: 16, l: 14, sv: 0, fld: 67 },
      { id: 'suppaje01', name: 'Jeff Suppan', role: 'SP', throws: 'R', age: 24, g: 32, gs: 32, outs: 626, h: 228, hr: 28, bb: 61, so: 110, hbp: 3, er: 112, w: 10, l: 12, sv: 0, fld: 73 },
      { id: 'rosadjo01', name: 'Jose Rosado', role: 'SP', throws: 'L', age: 24, g: 33, gs: 33, outs: 624, h: 203, hr: 26, bb: 71, so: 144, hbp: 5, er: 97, w: 10, l: 14, sv: 0, fld: 65 },
      { id: 'witasja01', name: 'Jay Witasick', role: 'SP', throws: 'R', age: 26, g: 32, gs: 28, outs: 475, h: 193, hr: 26, bb: 83, so: 109, hbp: 7, er: 99, w: 9, l: 12, sv: 0, fld: 52 },
      { id: 'suzukma01', name: 'Mac Suzuki', role: 'SP', throws: 'R', age: 24, g: 38, gs: 13, outs: 330, h: 126, hr: 15, bb: 64, so: 69, hbp: 6, er: 83, w: 2, l: 5, sv: 0, fld: 67, rk: true },
      { id: 'montgje01', name: 'Jeff Montgomery', role: 'CL', throws: 'R', age: 37, g: 49, gs: 0, outs: 154, h: 64, hr: 8, bb: 21, so: 39, hbp: 2, er: 34, w: 1, l: 4, sv: 12, fld: 70 },
      { id: 'servisc01', name: 'Scott Service', role: 'RP', throws: 'R', age: 32, g: 68, gs: 0, outs: 226, h: 81, hr: 10, bb: 38, so: 79, hbp: 5, er: 44, w: 5, l: 5, sv: 8, fld: 80 },
      { id: 'fussech01', name: 'Chris Fussell', role: 'RP', throws: 'R', age: 23, g: 17, gs: 8, outs: 168, h: 71, hr: 9, bb: 38, so: 38, hbp: 4, er: 47, w: 0, l: 5, sv: 2, fld: 65, rk: true },
      { id: 'whisema01', name: 'Matt Whisenant', role: 'RP', throws: 'L', age: 28, g: 67, gs: 0, outs: 163, h: 52, hr: 3, bb: 34, so: 40, hbp: 5, er: 32, w: 4, l: 5, sv: 1, fld: 61 },
      { id: 'mormaal01', name: 'Alvin Morman', role: 'RP', throws: 'L', age: 30, g: 49, gs: 0, outs: 160, h: 64, hr: 7, bb: 25, so: 34, hbp: 3, er: 27, w: 2, l: 4, sv: 1, fld: 80 },
      { id: 'santijo03', name: 'Jose Santiago', role: 'RP', throws: 'R', age: 24, g: 34, gs: 0, outs: 142, h: 48, hr: 7, bb: 14, so: 16, hbp: 2, er: 18, w: 3, l: 4, sv: 2, fld: 76, rk: true },
    ],
    reservePitchers: [
      { id: 'steinbl01', name: 'Blake Stein', role: 'SP', throws: 'R', age: 25, g: 13, gs: 12, outs: 219, h: 69, hr: 12, bb: 45, so: 51, hbp: 5, er: 44, w: 1, l: 2, sv: 0, fld: 65 },
      { id: 'pittsji01', name: 'Jim Pittsley', role: 'RP', throws: 'R', age: 25, g: 20, gs: 5, outs: 126, h: 52, hr: 6, bb: 23, so: 23, hbp: 2, er: 29, w: 1, l: 3, sv: 0, fld: 56 },
      { id: 'mathete01', name: 'Terry Mathews', role: 'RP', throws: 'R', age: 34, g: 24, gs: 1, outs: 117, h: 44, hr: 6, bb: 18, so: 20, hbp: 1, er: 20, w: 2, l: 1, sv: 1, fld: 59 },
      { id: 'reichda01', name: 'Dan Reichert', role: 'RP', throws: 'R', age: 22, g: 8, gs: 8, outs: 110, h: 48, hr: 2, bb: 32, so: 20, hbp: 2, er: 37, w: 2, l: 2, sv: 0, fld: 78, rk: true },
      { id: 'byrdati01', name: 'Tim Byrdak', role: 'RP', throws: 'L', age: 25, g: 33, gs: 0, outs: 74, h: 34, hr: 5, bb: 19, so: 17, hbp: 1, er: 21, w: 0, l: 3, sv: 1, fld: 81, rk: true },
    ],
  },
  // MIN (MIN 1999)
  {
    franchiseId: 'MIN',
    season: 1999,
    batters: [
      { id: 'steinte01', name: 'Terry Steinbach', pos: 'C', bats: 'R', age: 37, pa: 380, h: 90, double: 19, triple: 3, hr: 8, bb: 33, so: 66, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 73, arm: 63 },
      { id: 'coomero01', name: 'Ron Coomer', pos: '1B', bats: 'R', age: 32, pa: 501, h: 129, double: 24, triple: 1, hr: 14, bb: 23, so: 70, hbp: 0, sb: 2, cs: 2, sec: '3B', fld: 81 },
      { id: 'walketo04', name: 'Todd Walker', pos: '2B', bats: 'L', age: 26, pa: 586, h: 155, double: 38, triple: 4, hr: 9, bb: 49, so: 78, hbp: 2, sb: 19, cs: 8, sec: '3B', fld: 63 },
      { id: 'koskico01', name: 'Corey Koskie', pos: '3B', bats: 'L', age: 26, pa: 392, h: 103, double: 20, triple: 0, hr: 11, bb: 39, so: 75, hbp: 5, sb: 4, cs: 4, sec: '1B', fld: 69, rk: true },
      { id: 'guzmacr01', name: 'Cristian Guzman', pos: 'SS', bats: 'S', age: 21, pa: 456, h: 95, double: 12, triple: 3, hr: 1, bb: 22, so: 90, hbp: 3, sb: 9, cs: 7, sec: '2B', fld: 72, rk: true },
      { id: 'allench01', name: 'Chad Allen', pos: 'LF', bats: 'R', age: 24, pa: 523, h: 133, double: 21, triple: 3, hr: 10, bb: 37, so: 89, hbp: 2, sb: 14, cs: 7, sec: 'RF', fld: 75, arm: 74, rk: true },
      { id: 'hunteto01', name: 'Torii Hunter', pos: 'CF', bats: 'R', age: 23, pa: 422, h: 98, double: 17, triple: 2, hr: 9, bb: 27, so: 74, hbp: 6, sb: 10, cs: 6, sec: 'LF', fld: 79, arm: 70, rk: true },
      { id: 'lawtoma02', name: 'Matt Lawton', pos: 'RF', bats: 'L', age: 27, pa: 476, h: 107, double: 22, triple: 2, hr: 11, bb: 60, so: 48, hbp: 8, sb: 17, cs: 5, sec: 'CF', fld: 68, arm: 61 },
      { id: 'cordoma01', name: 'Marty Cordova', pos: 'DH', bats: 'R', age: 29, pa: 488, h: 115, double: 24, triple: 3, hr: 13, bb: 47, so: 99, hbp: 7, sb: 8, cs: 5, sec: 'LF' },
    ],
    bench: [
      { id: 'hockide01', name: 'Denny Hocking', pos: 'SS', bats: 'S', age: 29, pa: 421, h: 97, double: 17, triple: 3, hr: 6, bb: 25, so: 64, hbp: 2, sb: 9, cs: 6, sec: '2B', fld: 68 },
      { id: 'mientdo01', name: 'Doug Mientkiewicz', pos: '1B', bats: 'L', age: 25, pa: 379, h: 75, double: 21, triple: 3, hr: 2, bb: 43, so: 50, hbp: 4, sb: 2, cs: 2, sec: '3B', fld: 69, rk: true },
      { id: 'jonesja04', name: 'Jacque Jones', pos: 'CF', bats: 'L', age: 24, pa: 347, h: 93, double: 24, triple: 2, hr: 9, bb: 17, so: 63, hbp: 4, sb: 3, cs: 4, sec: 'RF', fld: 87, arm: 83, rk: true },
      { id: 'gatesbr01', name: 'Brent Gates', pos: '3B', bats: 'S', age: 29, pa: 346, h: 77, double: 14, triple: 1, hr: 3, bb: 33, so: 50, hbp: 1, sb: 2, cs: 3, sec: '2B', fld: 72 },
      { id: 'valenja01', name: 'Javier Valentin', pos: 'C', bats: 'S', age: 23, pa: 247, h: 51, double: 11, triple: 1, hr: 5, bb: 20, so: 40, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 73, arm: 81 },
    ],
    reserveBatters: [
      { id: 'cummimi01', name: 'Midre Cummings', pos: 'RF', bats: 'L', age: 27, pa: 42, h: 10, double: 2, triple: 0, hr: 1, bb: 4, so: 6, hbp: 0, sb: 1, cs: 1, sec: 'CF' },
    ],
    pitchers: [
      { id: 'radkebr01', name: 'Brad Radke', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 656, h: 236, hr: 26, bb: 44, so: 137, hbp: 4, er: 96, w: 12, l: 14, sv: 0, fld: 83 },
      { id: 'miltoer01', name: 'Eric Milton', role: 'SP', throws: 'L', age: 23, g: 34, gs: 34, outs: 619, h: 200, hr: 28, bb: 69, so: 147, hbp: 3, er: 110, w: 7, l: 11, sv: 0, fld: 54 },
      { id: 'hawkila01', name: 'LaTroy Hawkins', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 523, h: 228, hr: 28, bb: 61, so: 101, hbp: 3, er: 119, w: 10, l: 14, sv: 0, fld: 64 },
      { id: 'maysjo01', name: 'Joe Mays', role: 'SP', throws: 'R', age: 23, g: 49, gs: 20, outs: 513, h: 179, hr: 24, bb: 67, so: 115, hbp: 2, er: 83, w: 6, l: 11, sv: 0, fld: 77, rk: true },
      { id: 'perkida01', name: 'Dan Perkins', role: 'SP', throws: 'R', age: 24, g: 29, gs: 12, outs: 260, h: 117, hr: 14, bb: 43, so: 44, hbp: 5, er: 63, w: 1, l: 7, sv: 0, fld: 58, rk: true },
      { id: 'trombmi01', name: 'Mike Trombley', role: 'CL', throws: 'R', age: 32, g: 75, gs: 0, outs: 262, h: 87, hr: 14, bb: 32, so: 81, hbp: 3, er: 40, w: 2, l: 8, sv: 24, fld: 62 },
      { id: 'wellsbo01', name: 'Bob Wells', role: 'RP', throws: 'R', age: 32, g: 76, gs: 0, outs: 262, h: 86, hr: 12, bb: 27, so: 48, hbp: 4, er: 44, w: 8, l: 3, sv: 1, fld: 63 },
      { id: 'sampsbe01', name: 'Benj Sampson', role: 'RP', throws: 'L', age: 24, g: 30, gs: 4, outs: 213, h: 101, hr: 15, bb: 34, so: 59, hbp: 1, er: 58, w: 3, l: 2, sv: 0, fld: 83, rk: true },
      { id: 'milletr01', name: 'Travis Miller', role: 'RP', throws: 'L', age: 26, g: 52, gs: 0, outs: 149, h: 56, hr: 3, bb: 19, so: 38, hbp: 0, er: 21, w: 2, l: 2, sv: 0, fld: 81 },
      { id: 'carrahe01', name: 'Hector Carrasco', role: 'RP', throws: 'R', age: 29, g: 39, gs: 0, outs: 147, h: 50, hr: 3, bb: 21, so: 36, hbp: 2, er: 24, w: 2, l: 3, sv: 1, fld: 59 },
      { id: 'guarded01', name: 'Eddie Guardado', role: 'RP', throws: 'L', age: 28, g: 63, gs: 0, outs: 144, h: 43, hr: 7, bb: 22, so: 46, hbp: 1, er: 23, w: 2, l: 5, sv: 2, fld: 71 },
    ],
    reservePitchers: [
      { id: 'lincomi01', name: 'Mike Lincoln', role: 'SP', throws: 'R', age: 24, g: 18, gs: 15, outs: 229, h: 102, hr: 11, bb: 26, so: 27, hbp: 1, er: 58, w: 3, l: 10, sv: 0, fld: 63, rk: true },
      { id: 'ryanja04', name: 'Jason Ryan', role: 'RP', throws: 'R', age: 23, g: 8, gs: 8, outs: 122, h: 46, hr: 9, bb: 17, so: 15, hbp: 3, er: 22, w: 1, l: 4, sv: 0, fld: 69, rk: true },
      { id: 'redmama01', name: 'Mark Redman', role: 'RP', throws: 'L', age: 25, g: 5, gs: 1, outs: 38, h: 17, hr: 3, bb: 7, so: 11, hbp: 1, er: 12, w: 1, l: 0, sv: 0, fld: 68, rk: true },
    ],
  },
  // HOU (HOU 1999)
  {
    franchiseId: 'HOU',
    season: 1999,
    batters: [
      { id: 'eusebto01', name: 'Tony Eusebio', pos: 'C', bats: 'R', age: 32, pa: 363, h: 87, double: 13, triple: 0, hr: 3, bb: 38, so: 63, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 76, arm: 71 },
      { id: 'bagweje01', name: 'Jeff Bagwell', pos: '1B', bats: 'R', age: 31, pa: 729, h: 173, double: 36, triple: 1, hr: 41, bb: 137, so: 118, hbp: 11, sb: 27, cs: 10, sec: '3B', fld: 74 },
      { id: 'biggicr01', name: 'Craig Biggio', pos: '2B', bats: 'R', age: 33, pa: 749, h: 197, double: 51, triple: 2, hr: 18, bb: 80, so: 110, hbp: 19, sb: 39, cs: 11, sec: 'SS', fld: 75 },
      { id: 'spierbi01', name: 'Bill Spiers', pos: '3B', bats: 'L', age: 33, pa: 444, h: 111, double: 23, triple: 5, hr: 4, bb: 51, so: 52, hbp: 2, sb: 11, cs: 4, sec: 'SS', fld: 90 },
      { id: 'bogarti01', name: 'Tim Bogar', pos: 'SS', bats: 'R', age: 32, pa: 354, h: 70, double: 15, triple: 3, hr: 4, bb: 33, so: 57, hbp: 4, sb: 4, cs: 4, sec: '3B', fld: 85 },
      { id: 'hidalri01', name: 'Richard Hidalgo', pos: 'LF', bats: 'R', age: 24, pa: 448, h: 97, double: 26, triple: 1, hr: 15, bb: 49, so: 74, hbp: 4, sb: 7, cs: 5, sec: 'CF', fld: 79, arm: 92 },
      { id: 'evereca01', name: 'Carl Everett', pos: 'CF', bats: 'S', age: 28, pa: 535, h: 143, double: 33, triple: 3, hr: 20, bb: 46, so: 101, hbp: 8, sb: 22, cs: 9, sec: 'RF', fld: 56, arm: 77 },
      { id: 'bellde01', name: 'Derek Bell', pos: 'RF', bats: 'R', age: 30, pa: 568, h: 139, double: 28, triple: 1, hr: 15, bb: 46, so: 114, hbp: 5, sb: 15, cs: 5, sec: 'CF', fld: 48, arm: 62 },
      { id: 'mieskma01', name: 'Matt Mieske', pos: 'DH', bats: 'R', age: 31, pa: 161, h: 43, double: 7, triple: 0, hr: 6, bb: 11, so: 29, hbp: 0, sb: 0, cs: 0, sec: 'RF', fld: 95, arm: 72 },
    ],
    bench: [
      { id: 'caminke01', name: 'Ken Caminiti', pos: '3B', bats: 'S', age: 36, pa: 329, h: 75, double: 15, triple: 0, hr: 15, bb: 45, so: 63, hbp: 2, sb: 5, cs: 1, fld: 70 },
      { id: 'gutieri01', name: 'Ricky Gutierrez', pos: 'SS', bats: 'R', age: 29, pa: 311, h: 71, double: 11, triple: 3, hr: 1, bb: 31, so: 46, hbp: 3, sb: 5, cs: 4, sec: '3B', fld: 58 },
      { id: 'bakopa01', name: 'Paul Bako', pos: 'C', bats: 'L', age: 27, pa: 247, h: 58, double: 12, triple: 1, hr: 2, bb: 22, so: 59, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 69, arm: 73 },
      { id: 'johnsru01', name: 'Russ Johnson', pos: '3B', bats: 'R', age: 26, pa: 183, h: 44, double: 9, triple: 0, hr: 5, bb: 19, so: 33, hbp: 1, sb: 3, cs: 3, sec: '2B', fld: 77, rk: true },
      { id: 'wardda01', name: 'Daryle Ward', pos: 'LF', bats: 'L', age: 24, pa: 161, h: 41, double: 6, triple: 0, hr: 8, bb: 10, so: 32, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 40, arm: 67, rk: true },
    ],
    reserveBatters: [
      { id: 'berkmla01', name: 'Lance Berkman', pos: 'LF', bats: 'S', age: 23, pa: 106, h: 22, double: 2, triple: 0, hr: 4, bb: 12, so: 21, hbp: 0, sb: 5, cs: 1, sec: 'RF', fld: 54, arm: 56, rk: true },
      { id: 'barkegl01', name: 'Glen Barker', pos: 'CF', bats: 'S', age: 28, pa: 90, h: 21, double: 2, triple: 0, hr: 1, bb: 11, so: 19, hbp: 1, sb: 17, cs: 6, sec: 'LF', fld: 60, arm: 77, rk: true },
      { id: 'diazal01', name: 'Alex Diaz', pos: 'LF', bats: 'S', age: 30, pa: 53, h: 10, double: 2, triple: 0, hr: 1, bb: 2, so: 11, hbp: 0, sb: 1, cs: 1, sec: 'CF' },
      { id: 'howelja02', name: 'Jack Howell', pos: '1B', bats: 'L', age: 37, pa: 41, h: 9, double: 2, triple: 0, hr: 2, bb: 5, so: 9, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'limajo01', name: 'Jose Lima', role: 'SP', throws: 'R', age: 26, g: 35, gs: 35, outs: 739, h: 252, hr: 32, bb: 41, so: 186, hbp: 5, er: 102, w: 21, l: 10, sv: 0, fld: 65 },
      { id: 'hamptmi01', name: 'Mike Hampton', role: 'SP', throws: 'L', age: 26, g: 34, gs: 34, outs: 717, h: 223, hr: 15, bb: 94, so: 163, hbp: 5, er: 84, w: 22, l: 4, sv: 0, fld: 73 },
      { id: 'reynosh01', name: 'Shane Reynolds', role: 'SP', throws: 'R', age: 31, g: 35, gs: 35, outs: 695, h: 248, hr: 24, bb: 45, so: 198, hbp: 2, er: 96, w: 16, l: 14, sv: 0, fld: 82 },
      { id: 'holtch01', name: 'Chris Holt', role: 'SP', throws: 'R', age: 27, g: 32, gs: 26, outs: 492, h: 188, hr: 13, bb: 55, so: 104, hbp: 8, er: 80, w: 5, l: 13, sv: 1, fld: 69 },
      { id: 'elartsc01', name: 'Scott Elarton', role: 'SP', throws: 'R', age: 23, g: 42, gs: 15, outs: 372, h: 107, hr: 9, bb: 44, so: 123, hbp: 4, er: 48, w: 9, l: 5, sv: 1, fld: 71 },
      { id: 'wagnebi02', name: 'Billy Wagner', role: 'CL', throws: 'L', age: 27, g: 66, gs: 0, outs: 224, h: 43, hr: 6, bb: 26, so: 117, hbp: 1, er: 17, w: 4, l: 1, sv: 39, fld: 79 },
      { id: 'powelja04', name: 'Jay Powell', role: 'RP', throws: 'R', age: 27, g: 67, gs: 0, outs: 225, h: 75, hr: 4, bb: 39, so: 73, hbp: 3, er: 33, w: 5, l: 4, sv: 4, fld: 64 },
      { id: 'willibr01', name: 'Brian Williams', role: 'RP', throws: 'R', age: 30, g: 50, gs: 0, outs: 202, h: 68, hr: 4, bb: 37, so: 52, hbp: 4, er: 32, w: 2, l: 1, sv: 0, fld: 58 },
      { id: 'milletr02', name: 'Trever Miller', role: 'RP', throws: 'L', age: 26, g: 47, gs: 0, outs: 149, h: 58, hr: 5, bb: 26, so: 34, hbp: 3, er: 24, w: 3, l: 2, sv: 1, fld: 67 },
      { id: 'henrydo01', name: 'Doug Henry', role: 'RP', throws: 'R', age: 35, g: 35, gs: 0, outs: 122, h: 40, hr: 6, bb: 23, so: 38, hbp: 1, er: 19, w: 2, l: 3, sv: 2, fld: 65 },
      { id: 'cabrejo01', name: 'Jose Cabrera', role: 'RP', throws: 'R', age: 27, g: 26, gs: 0, outs: 88, h: 22, hr: 3, bb: 9, so: 27, hbp: 0, er: 8, w: 4, l: 0, sv: 0, fld: 72, rk: true },
    ],
    reservePitchers: [
      { id: 'bergmse01', name: 'Sean Bergman', role: 'SP', throws: 'R', age: 29, g: 25, gs: 16, outs: 316, h: 127, hr: 11, bb: 30, so: 58, hbp: 3, er: 56, w: 5, l: 6, sv: 0, fld: 67 },
      { id: 'millewa04', name: 'Wade Miller', role: 'RP', throws: 'R', age: 22, g: 5, gs: 1, outs: 31, h: 17, hr: 4, bb: 5, so: 8, hbp: 0, er: 11, w: 0, l: 1, sv: 0, fld: 82, rk: true },
    ],
  },
  // LAA (ANA 1999)
  {
    franchiseId: 'LAA',
    season: 1999,
    batters: [
      { id: 'walbema01', name: 'Matt Walbeck', pos: 'C', bats: 'S', age: 29, pa: 321, h: 72, double: 10, triple: 1, hr: 4, bb: 26, so: 50, hbp: 2, sb: 2, cs: 2, sec: '1B', fld: 69, arm: 71 },
      { id: 'erstada01', name: 'Darin Erstad', pos: '1B', bats: 'L', age: 25, pa: 638, h: 159, double: 31, triple: 4, hr: 16, bb: 48, so: 94, hbp: 3, sb: 18, cs: 7, sec: 'LF', fld: 74 },
      { id: 'velarra01', name: 'Randy Velarde', pos: '2B', bats: 'R', age: 36, pa: 711, h: 192, double: 28, triple: 6, hr: 15, bb: 77, so: 104, hbp: 6, sb: 24, cs: 8, sec: '3B', fld: 74 },
      { id: 'glaustr01', name: 'Troy Glaus', pos: '3B', bats: 'R', age: 22, pa: 631, h: 131, double: 29, triple: 0, hr: 25, bb: 68, so: 148, hbp: 5, sb: 5, cs: 1, sec: '1B', fld: 69 },
      { id: 'disarga01', name: 'Gary Disarcina', pos: 'SS', bats: 'R', age: 31, pa: 298, h: 71, double: 14, triple: 1, hr: 1, bb: 12, so: 25, hbp: 3, sb: 4, cs: 3, sec: '2B', fld: 80 },
      { id: 'palmeor01', name: 'Orlando Palmeiro', pos: 'LF', bats: 'L', age: 30, pa: 371, h: 90, double: 12, triple: 2, hr: 1, bb: 39, so: 28, hbp: 4, sb: 6, cs: 6, sec: 'CF', fld: 80, arm: 77 },
      { id: 'anderga01', name: 'Garret Anderson', pos: 'CF', bats: 'L', age: 27, pa: 660, h: 187, double: 38, triple: 4, hr: 17, bb: 32, so: 79, hbp: 1, sb: 6, cs: 4, sec: 'LF', fld: 80, arm: 66 },
      { id: 'salmoti01', name: 'Tim Salmon', pos: 'RF', bats: 'R', age: 30, pa: 422, h: 100, double: 21, triple: 1, hr: 19, bb: 63, so: 80, hbp: 2, sb: 3, cs: 2, sec: 'LF', fld: 78, arm: 72 },
      { id: 'vaughmo01', name: 'Mo Vaughn', pos: 'DH', bats: 'L', age: 31, pa: 592, h: 160, double: 23, triple: 1, hr: 34, bb: 58, so: 129, hbp: 10, sb: 0, cs: 0, sec: '1B', fld: 67 },
    ],
    bench: [
      { id: 'greento02', name: 'Todd Greene', pos: 'DH', bats: 'R', age: 28, pa: 338, h: 80, double: 19, triple: 0, hr: 14, bb: 12, so: 67, hbp: 2, sb: 1, cs: 3, sec: 'C' },
      { id: 'sheetan01', name: 'Andy Sheets', pos: 'SS', bats: 'R', age: 27, pa: 269, h: 52, double: 9, triple: 1, hr: 5, bb: 18, so: 67, hbp: 0, sb: 4, cs: 2, sec: '3B', fld: 60 },
      { id: 'husonje01', name: 'Jeff Huson', pos: '2B', bats: 'L', age: 34, pa: 245, h: 55, double: 6, triple: 1, hr: 0, bb: 15, so: 27, hbp: 0, sb: 9, cs: 1, sec: 'SS', fld: 72 },
      { id: 'edmonji01', name: 'Jim Edmonds', pos: 'CF', bats: 'L', age: 29, pa: 233, h: 60, double: 15, triple: 1, hr: 8, bb: 23, so: 40, hbp: 1, sb: 3, cs: 3, sec: 'LF', fld: 86, arm: 78 },
      { id: 'durritr01', name: 'Trent Durrington', pos: '2B', bats: 'R', age: 23, pa: 136, h: 22, double: 2, triple: 0, hr: 0, bb: 9, so: 28, hbp: 0, sb: 4, cs: 3, sec: 'SS', fld: 64, rk: true },
    ],
    reserveBatters: [
      { id: 'molinbe01', name: 'Bengie Molina', pos: 'C', bats: 'R', age: 24, pa: 109, h: 26, double: 5, triple: 0, hr: 1, bb: 6, so: 6, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 67, arm: 77, rk: true },
      { id: 'deckest01', name: 'Steve Decker', pos: 'C', bats: 'R', age: 33, pa: 79, h: 15, double: 6, triple: 0, hr: 0, bb: 13, so: 9, hbp: 1, sb: 0, cs: 0, sec: '1B' },
      { id: 'willire02', name: 'Reggie Williams', pos: 'RF', bats: 'S', age: 33, pa: 71, h: 16, double: 1, triple: 1, hr: 1, bb: 7, so: 20, hbp: 1, sb: 3, cs: 2, sec: 'LF', fld: 69, arm: 94, rk: true },
      { id: 'obriech01', name: 'Charlie O\'Brien', pos: 'C', bats: 'R', age: 39, pa: 67, h: 12, double: 3, triple: 0, hr: 1, bb: 4, so: 12, hbp: 2, sb: 0, cs: 0, fld: 80, arm: 82 },
      { id: 'unroeti01', name: 'Tim Unroe', pos: 'RF', bats: 'R', age: 28, pa: 59, h: 13, double: 2, triple: 0, hr: 2, bb: 4, so: 17, hbp: 1, sb: 1, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'finlech01', name: 'Chuck Finley', role: 'SP', throws: 'L', age: 36, g: 33, gs: 33, outs: 640, h: 198, hr: 22, bb: 96, so: 201, hbp: 7, er: 95, w: 12, l: 11, sv: 0, fld: 63 },
      { id: 'olivaom01', name: 'Omar Olivares', role: 'SP', throws: 'R', age: 31, g: 32, gs: 32, outs: 617, h: 214, hr: 20, bb: 89, so: 102, hbp: 9, er: 96, w: 15, l: 11, sv: 0, fld: 77 },
      { id: 'sparkst01', name: 'Steve Sparks', role: 'SP', throws: 'R', age: 33, g: 28, gs: 26, outs: 443, h: 162, hr: 20, bb: 78, so: 86, hbp: 8, er: 84, w: 5, l: 11, sv: 0, fld: 81 },
      { id: 'belchti01', name: 'Tim Belcher', role: 'SP', throws: 'R', age: 37, g: 24, gs: 24, outs: 397, h: 157, hr: 24, bb: 45, so: 67, hbp: 4, er: 81, w: 6, l: 8, sv: 0, fld: 59 },
      { id: 'hillke01', name: 'Ken Hill', role: 'SP', throws: 'R', age: 33, g: 26, gs: 22, outs: 385, h: 136, hr: 12, bb: 69, so: 74, hbp: 3, er: 68, w: 4, l: 11, sv: 0, fld: 59 },
      { id: 'percitr01', name: 'Troy Percival', role: 'CL', throws: 'R', age: 29, g: 60, gs: 0, outs: 171, h: 38, hr: 7, bb: 25, so: 66, hbp: 3, er: 23, w: 4, l: 6, sv: 31, fld: 76 },
      { id: 'levinal01', name: 'Al Levine', role: 'RP', throws: 'R', age: 31, g: 50, gs: 1, outs: 255, h: 83, hr: 11, bb: 28, so: 36, hbp: 2, er: 37, w: 1, l: 1, sv: 0, fld: 84 },
      { id: 'petkoma01', name: 'Mark Petkovsek', role: 'RP', throws: 'R', age: 33, g: 64, gs: 0, outs: 249, h: 90, hr: 7, bb: 24, so: 42, hbp: 4, er: 38, w: 10, l: 4, sv: 1, fld: 66 },
      { id: 'hasegsh01', name: 'Shigetoshi Hasegawa', role: 'RP', throws: 'R', age: 30, g: 64, gs: 1, outs: 231, h: 77, hr: 12, bb: 31, so: 53, hbp: 2, er: 36, w: 4, l: 6, sv: 2, fld: 60 },
      { id: 'magnami01', name: 'Mike Magnante', role: 'RP', throws: 'L', age: 34, g: 53, gs: 0, outs: 208, h: 68, hr: 2, bb: 29, so: 49, hbp: 3, er: 28, w: 5, l: 2, sv: 0, fld: 66 },
      { id: 'fyhrimi01', name: 'Mike Fyhrie', role: 'RP', throws: 'R', age: 29, g: 16, gs: 7, outs: 155, h: 61, hr: 8, bb: 21, so: 26, hbp: 0, er: 29, w: 0, l: 4, sv: 0, fld: 77, rk: true },
    ],
    reservePitchers: [
      { id: 'washbja01', name: 'Jarrod Washburn', role: 'SP', throws: 'L', age: 24, g: 16, gs: 10, outs: 185, h: 60, hr: 7, bb: 25, so: 40, hbp: 2, er: 34, w: 4, l: 5, sv: 0, fld: 77 },
      { id: 'ortizra01', name: 'Ramon Ortiz', role: 'RP', throws: 'R', age: 26, g: 9, gs: 9, outs: 145, h: 50, hr: 7, bb: 25, so: 44, hbp: 2, er: 35, w: 2, l: 3, sv: 0, fld: 72, rk: true },
      { id: 'schoesc01', name: 'Scott Schoeneweis', role: 'RP', throws: 'L', age: 25, g: 31, gs: 0, outs: 118, h: 47, hr: 4, bb: 14, so: 22, hbp: 0, er: 24, w: 1, l: 1, sv: 0, fld: 62, rk: true },
      { id: 'potelo01', name: 'Lou Pote', role: 'RP', throws: 'R', age: 27, g: 20, gs: 0, outs: 88, h: 23, hr: 1, bb: 12, so: 20, hbp: 0, er: 7, w: 1, l: 1, sv: 3, fld: 60, rk: true },
      { id: 'coopebr01', name: 'Brian Cooper', role: 'RP', throws: 'R', age: 24, g: 5, gs: 5, outs: 83, h: 23, hr: 3, bb: 18, so: 15, hbp: 4, er: 15, w: 1, l: 1, sv: 0, fld: 59, rk: true },
    ],
  },
  // OAK (OAK 1999)
  {
    franchiseId: 'OAK',
    season: 1999,
    batters: [
      { id: 'macfami01', name: 'Mike Macfarlane', pos: 'C', bats: 'R', age: 35, pa: 246, h: 54, double: 15, triple: 0, hr: 6, bb: 14, so: 45, hbp: 3, sb: 0, cs: 0, fld: 72, arm: 77 },
      { id: 'giambja01', name: 'Jason Giambi', pos: '1B', bats: 'L', age: 28, pa: 695, h: 179, double: 36, triple: 1, hr: 30, bb: 93, so: 107, hbp: 6, sb: 1, cs: 1, sec: 'LF', fld: 57 },
      { id: 'phillto02', name: 'Tony Phillips', pos: '2B', bats: 'S', age: 40, pa: 484, h: 102, double: 25, triple: 3, hr: 11, bb: 74, so: 90, hbp: 4, sb: 9, cs: 4, sec: '3B', fld: 63 },
      { id: 'chaveer01', name: 'Eric Chavez', pos: '3B', bats: 'L', age: 21, pa: 402, h: 90, double: 22, triple: 2, hr: 12, bb: 44, so: 55, hbp: 0, sb: 2, cs: 2, sec: '1B', fld: 62, rk: true },
      { id: 'tejadmi01', name: 'Miguel Tejada', pos: 'SS', bats: 'R', age: 25, pa: 674, h: 146, double: 33, triple: 4, hr: 20, bb: 52, so: 109, hbp: 11, sb: 8, cs: 8, sec: '2B', fld: 83 },
      { id: 'grievbe01', name: 'Ben Grieve', pos: 'LF', bats: 'L', age: 23, pa: 558, h: 134, double: 27, triple: 1, hr: 22, bb: 66, so: 106, hbp: 8, sb: 3, cs: 1, sec: 'RF', fld: 71, arm: 69 },
      { id: 'chrisry01', name: 'Ryan Christenson', pos: 'CF', bats: 'R', age: 25, pa: 319, h: 63, double: 14, triple: 1, hr: 4, bb: 33, so: 68, hbp: 1, sb: 5, cs: 5, sec: 'LF', fld: 72, arm: 64 },
      { id: 'stairma01', name: 'Matt Stairs', pos: 'RF', bats: 'L', age: 31, pa: 623, h: 148, double: 29, triple: 2, hr: 35, bb: 78, so: 111, hbp: 4, sb: 4, cs: 5, sec: 'LF', fld: 59, arm: 75 },
      { id: 'jahajo01', name: 'John Jaha', pos: 'DH', bats: 'R', age: 33, pa: 570, h: 118, double: 20, triple: 0, hr: 30, bb: 99, so: 130, hbp: 10, sb: 2, cs: 1, sec: '1B' },
    ],
    bench: [
      { id: 'saenzol01', name: 'Olmedo Saenz', pos: '3B', bats: 'R', age: 28, pa: 295, h: 70, double: 18, triple: 0, hr: 11, bb: 22, so: 47, hbp: 15, sb: 1, cs: 1, sec: '1B', fld: 65, rk: true },
      { id: 'spiezsc01', name: 'Scott Spiezio', pos: '2B', bats: 'S', age: 26, pa: 282, h: 62, double: 17, triple: 1, hr: 7, bb: 26, so: 35, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 87 },
      { id: 'hinchaj01', name: 'A. J. Hinch', pos: 'C', bats: 'R', age: 25, pa: 228, h: 45, double: 5, triple: 0, hr: 6, bb: 14, so: 47, hbp: 2, sb: 4, cs: 1, sec: '1B', fld: 60, arm: 65 },
      { id: 'mcdonja02', name: 'Jason McDonald', pos: 'CF', bats: 'S', age: 27, pa: 220, h: 43, double: 6, triple: 1, hr: 2, bb: 27, so: 42, hbp: 3, sb: 8, cs: 4, sec: 'LF', fld: 84, arm: 68 },
      { id: 'raineti01', name: 'Tim Raines', pos: 'LF', bats: 'S', age: 39, pa: 164, h: 38, double: 6, triple: 0, hr: 3, bb: 24, so: 19, hbp: 1, sb: 4, cs: 1, sec: 'CF', fld: 77, arm: 56 },
    ],
    reserveBatters: [
      { id: 'hernara02', name: 'Ramon Hernandez', pos: 'C', bats: 'R', age: 23, pa: 158, h: 38, double: 7, triple: 0, hr: 3, bb: 18, so: 11, hbp: 1, sb: 1, cs: 0, sec: '1B', fld: 65, arm: 65, rk: true },
      { id: 'velanjo01', name: 'Jorge Velandia', pos: '2B', bats: 'R', age: 24, pa: 51, h: 9, double: 1, triple: 0, hr: 0, bb: 2, so: 13, hbp: 1, sb: 2, cs: 0, sec: 'SS', fld: 95, rk: true },
    ],
    pitchers: [
      { id: 'heredgi01', name: 'Gil Heredia', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 601, h: 226, hr: 22, bb: 32, so: 119, hbp: 9, er: 102, w: 13, l: 8, sv: 0, fld: 72 },
      { id: 'rogerke01', name: 'Kenny Rogers', role: 'SP', throws: 'L', age: 34, g: 31, gs: 31, outs: 586, h: 199, hr: 17, bb: 66, so: 121, hbp: 10, er: 88, w: 10, l: 4, sv: 0, fld: 92 },
      { id: 'hayneji01', name: 'Jimmy Haynes', role: 'SP', throws: 'R', age: 26, g: 30, gs: 25, outs: 426, h: 162, hr: 19, bb: 73, so: 98, hbp: 3, er: 89, w: 7, l: 12, sv: 0, fld: 54 },
      { id: 'oquismi01', name: 'Mike Oquist', role: 'SP', throws: 'R', age: 31, g: 28, gs: 24, outs: 422, h: 162, hr: 20, bb: 56, so: 91, hbp: 4, er: 89, w: 9, l: 10, sv: 0, fld: 60 },
      { id: 'hudsoti01', name: 'Tim Hudson', role: 'SP', throws: 'R', age: 23, g: 21, gs: 21, outs: 409, h: 121, hr: 8, bb: 62, so: 132, hbp: 4, er: 49, w: 11, l: 2, sv: 0, fld: 77, rk: true },
      { id: 'taylobi04', name: 'Billy Taylor', role: 'CL', throws: 'R', age: 37, g: 61, gs: 0, outs: 169, h: 62, hr: 5, bb: 22, so: 51, hbp: 3, er: 27, w: 1, l: 6, sv: 26, fld: 69 },
      { id: 'jonesdo01', name: 'Doug Jones', role: 'RP', throws: 'R', age: 42, g: 70, gs: 0, outs: 312, h: 107, hr: 13, bb: 21, so: 77, hbp: 4, er: 42, w: 5, l: 5, sv: 10, fld: 64 },
      { id: 'rigbybr01', name: 'Brad Rigby', role: 'RP', throws: 'R', age: 26, g: 49, gs: 0, outs: 251, h: 102, hr: 12, bb: 30, so: 36, hbp: 6, er: 47, w: 4, l: 6, sv: 0, fld: 75 },
      { id: 'worreti01', name: 'Tim Worrell', role: 'RP', throws: 'R', age: 31, g: 53, gs: 0, outs: 208, h: 72, hr: 9, bb: 28, so: 58, hbp: 2, er: 37, w: 2, l: 2, sv: 0, fld: 75 },
      { id: 'mathetj01', name: 'T. J. Mathews', role: 'RP', throws: 'R', age: 29, g: 50, gs: 0, outs: 177, h: 51, hr: 7, bb: 21, so: 43, hbp: 2, er: 25, w: 9, l: 5, sv: 3, fld: 85 },
      { id: 'groombu01', name: 'Buddy Groom', role: 'RP', throws: 'L', age: 33, g: 76, gs: 0, outs: 138, h: 50, hr: 3, bb: 17, so: 31, hbp: 1, er: 24, w: 3, l: 2, sv: 0, fld: 61 },
    ],
    reservePitchers: [
      { id: 'candito01', name: 'Tom Candiotti', role: 'SP', throws: 'R', age: 42, g: 18, gs: 13, outs: 214, h: 82, hr: 12, bb: 25, so: 40, hbp: 4, er: 44, w: 4, l: 6, sv: 0, fld: 73 },
      { id: 'mahayro01', name: 'Ron Mahay', role: 'RP', throws: 'L', age: 28, g: 6, gs: 1, outs: 58, h: 12, hr: 2, bb: 6, so: 12, hbp: 0, er: 5, w: 2, l: 0, sv: 1, fld: 85 },
      { id: 'harvich01', name: 'Chad Harville', role: 'RP', throws: 'R', age: 22, g: 15, gs: 0, outs: 43, h: 18, hr: 2, bb: 10, so: 15, hbp: 0, er: 11, w: 0, l: 2, sv: 0, fld: 76, rk: true },
      { id: 'jarvike01', name: 'Kevin Jarvis', role: 'RP', throws: 'R', age: 29, g: 4, gs: 1, outs: 42, h: 25, hr: 5, bb: 6, so: 11, hbp: 1, er: 15, w: 0, l: 1, sv: 0, fld: 65 },
      { id: 'kubinti01', name: 'Tim Kubinski', role: 'RP', throws: 'L', age: 27, g: 14, gs: 0, outs: 37, h: 14, hr: 3, bb: 5, so: 8, hbp: 1, er: 8, w: 0, l: 0, sv: 0, fld: 58, rk: true },
    ],
  },
  // SEA (SEA 1999)
  {
    franchiseId: 'SEA',
    season: 1999,
    batters: [
      { id: 'wilsoda01', name: 'Dan Wilson', pos: 'C', bats: 'R', age: 30, pa: 457, h: 108, double: 23, triple: 2, hr: 9, bb: 30, so: 74, hbp: 4, sb: 4, cs: 1, sec: '1B', fld: 78, arm: 63 },
      { id: 'seguida01', name: 'David Segui', pos: '1B', bats: 'S', age: 32, pa: 486, h: 132, double: 27, triple: 2, hr: 16, bb: 43, so: 63, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 76 },
      { id: 'bellda01', name: 'David Bell', pos: '2B', bats: 'R', age: 26, pa: 667, h: 161, double: 35, triple: 3, hr: 18, bb: 51, so: 93, hbp: 2, sb: 5, cs: 4, sec: '3B', fld: 70 },
      { id: 'davisru01', name: 'Russ Davis', pos: '3B', bats: 'R', age: 29, pa: 478, h: 111, double: 22, triple: 1, hr: 20, bb: 31, so: 112, hbp: 4, sb: 4, cs: 3, sec: '1B', fld: 61 },
      { id: 'rodrial01', name: 'Alex Rodriguez', pos: 'SS', bats: 'R', age: 23, pa: 572, h: 153, double: 27, triple: 2, hr: 35, bb: 44, so: 99, hbp: 6, sb: 27, cs: 8, sec: '2B', fld: 80 },
      { id: 'huntebr02', name: 'Brian Hunter', pos: 'LF', bats: 'R', age: 28, pa: 589, h: 133, double: 20, triple: 5, hr: 4, bb: 39, so: 91, hbp: 2, sb: 45, cs: 10, sec: 'CF', fld: 89, arm: 85 },
      { id: 'griffke02', name: 'Ken Griffey', pos: 'CF', bats: 'L', age: 29, pa: 706, h: 176, double: 29, triple: 3, hr: 52, bb: 83, so: 114, hbp: 7, sb: 21, cs: 6, sec: 'LF', fld: 72, arm: 71 },
      { id: 'buhneja01', name: 'Jay Buhner', pos: 'RF', bats: 'R', age: 34, pa: 343, h: 64, double: 10, triple: 1, hr: 17, bb: 61, so: 93, hbp: 3, sb: 0, cs: 0, sec: 'CF', fld: 56, arm: 74 },
      { id: 'martied01', name: 'Edgar Martinez', pos: 'DH', bats: 'R', age: 36, pa: 608, h: 165, double: 37, triple: 1, hr: 25, bb: 98, so: 91, hbp: 6, sb: 4, cs: 2, sec: '3B' },
    ],
    bench: [
      { id: 'huskebu01', name: 'Butch Huskey', pos: 'DH', bats: 'R', age: 27, pa: 423, h: 106, double: 18, triple: 0, hr: 19, bb: 29, so: 67, hbp: 0, sb: 5, cs: 3, sec: 'RF' },
      { id: 'mabryjo01', name: 'John Mabry', pos: 'RF', bats: 'L', age: 28, pa: 285, h: 66, double: 14, triple: 0, hr: 7, bb: 21, so: 55, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 86, arm: 93 },
      { id: 'ibanera01', name: 'Raul Ibanez', pos: 'RF', bats: 'L', age: 27, pa: 227, h: 54, double: 9, triple: 1, hr: 8, bb: 15, so: 36, hbp: 0, sb: 4, cs: 1, sec: '1B', fld: 83, arm: 61 },
      { id: 'lampkto01', name: 'Tom Lampkin', pos: 'C', bats: 'L', age: 35, pa: 227, h: 53, double: 10, triple: 1, hr: 7, bb: 18, so: 30, hbp: 5, sb: 2, cs: 2, fld: 63, arm: 82 },
      { id: 'bournra01', name: 'Rafael Bournigal', pos: 'SS', bats: 'R', age: 33, pa: 108, h: 25, double: 5, triple: 0, hr: 1, bb: 6, so: 6, hbp: 1, sb: 1, cs: 0, sec: '2B' },
    ],
    reserveBatters: [
      { id: 'gipsoch01', name: 'Charles Gipson', pos: '3B', bats: 'R', age: 26, pa: 89, h: 18, double: 4, triple: 1, hr: 0, bb: 7, so: 13, hbp: 1, sb: 3, cs: 3, sec: '1B', fld: 100, rk: true },
      { id: 'jacksry01', name: 'Ryan Jackson', pos: '1B', bats: 'L', age: 27, pa: 77, h: 17, double: 4, triple: 0, hr: 1, bb: 6, so: 20, hbp: 0, sb: 1, cs: 1, sec: 'LF', fld: 60 },
      { id: 'blowemi01', name: 'Mike Blowers', pos: '1B', bats: 'R', age: 34, pa: 50, h: 11, double: 2, triple: 0, hr: 1, bb: 4, so: 12, hbp: 0, sb: 0, cs: 0, sec: '3B' },
      { id: 'timmooz01', name: 'Ozzie Timmons', pos: 'LF', bats: 'R', age: 28, pa: 48, h: 6, double: 2, triple: 0, hr: 1, bb: 4, so: 12, hbp: 0, sb: 0, cs: 1, sec: 'RF' },
    ],
    pitchers: [
      { id: 'moyerja01', name: 'Jamie Moyer', role: 'SP', throws: 'L', age: 36, g: 32, gs: 32, outs: 684, h: 233, hr: 23, bb: 46, so: 144, hbp: 9, er: 96, w: 14, l: 8, sv: 0, fld: 82 },
      { id: 'garcifr02', name: 'Freddy Garcia', role: 'SP', throws: 'R', age: 22, g: 33, gs: 33, outs: 604, h: 205, hr: 18, bb: 90, so: 170, hbp: 10, er: 91, w: 17, l: 8, sv: 0, fld: 71, rk: true },
      { id: 'halamjo01', name: 'John Halama', role: 'SP', throws: 'L', age: 27, g: 38, gs: 24, outs: 537, h: 193, hr: 18, bb: 57, so: 106, hbp: 7, er: 87, w: 11, l: 10, sv: 0, fld: 73, rk: true },
      { id: 'fasseje01', name: 'Jeff Fassero', role: 'SP', throws: 'L', age: 36, g: 37, gs: 27, outs: 469, h: 188, hr: 28, bb: 68, so: 128, hbp: 5, er: 97, w: 5, l: 14, sv: 0, fld: 76 },
      { id: 'mechegi01', name: 'Gil Meche', role: 'SP', throws: 'R', age: 20, g: 16, gs: 15, outs: 257, h: 73, hr: 9, bb: 57, so: 47, hbp: 2, er: 45, w: 8, l: 4, sv: 0, fld: 71, rk: true },
      { id: 'mesajo01', name: 'Jose Mesa', role: 'CL', throws: 'R', age: 33, g: 68, gs: 0, outs: 206, h: 81, hr: 9, bb: 35, so: 50, hbp: 4, er: 35, w: 3, l: 6, sv: 33, fld: 64 },
      { id: 'paniajo01', name: 'Jose Paniagua', role: 'RP', throws: 'R', age: 25, g: 59, gs: 0, outs: 233, h: 75, hr: 6, bb: 48, so: 70, hbp: 8, er: 37, w: 6, l: 11, sv: 3, fld: 84 },
      { id: 'rodrifr02', name: 'Frankie Rodriguez', role: 'RP', throws: 'R', age: 26, g: 28, gs: 5, outs: 220, h: 90, hr: 8, bb: 31, so: 49, hbp: 3, er: 46, w: 2, l: 4, sv: 3, fld: 70 },
      { id: 'abbotpa01', name: 'Paul Abbott', role: 'RP', throws: 'R', age: 31, g: 25, gs: 7, outs: 218, h: 53, hr: 8, bb: 31, so: 67, hbp: 0, er: 26, w: 6, l: 2, sv: 0, fld: 61 },
      { id: 'cloudke01', name: 'Ken Cloude', role: 'RP', throws: 'R', age: 24, g: 31, gs: 6, outs: 217, h: 97, hr: 13, bb: 43, so: 50, hbp: 3, er: 59, w: 4, l: 4, sv: 1, fld: 69 },
      { id: 'hinchbr01', name: 'Brett Hinchliffe', role: 'RP', throws: 'R', age: 24, g: 11, gs: 4, outs: 92, h: 41, hr: 10, bb: 21, so: 14, hbp: 4, er: 30, w: 0, l: 4, sv: 0, fld: 68, rk: true },
    ],
    reservePitchers: [
      { id: 'henrybu01', name: 'Butch Henry', role: 'RP', throws: 'L', age: 30, g: 7, gs: 4, outs: 75, h: 29, hr: 2, bb: 8, so: 16, hbp: 1, er: 12, w: 2, l: 0, sv: 0, fld: 60 },
      { id: 'sinclst01', name: 'Steve Sinclair', role: 'RP', throws: 'L', age: 27, g: 21, gs: 0, outs: 58, h: 21, hr: 3, bb: 12, so: 16, hbp: 1, er: 13, w: 0, l: 1, sv: 0, fld: 72, rk: true },
      { id: 'ramsaro01', name: 'Robert Ramsay', role: 'RP', throws: 'L', age: 25, g: 6, gs: 3, outs: 55, h: 23, hr: 3, bb: 9, so: 11, hbp: 0, er: 13, w: 0, l: 2, sv: 0, fld: 85, rk: true },
      { id: 'carmora01', name: 'Rafael Carmona', role: 'RP', throws: 'R', age: 27, g: 9, gs: 0, outs: 34, h: 17, hr: 3, bb: 9, so: 2, hbp: 0, er: 10, w: 1, l: 0, sv: 0, fld: 71 },
      { id: 'frankry01', name: 'Ryan Franklin', role: 'RP', throws: 'R', age: 26, g: 6, gs: 0, outs: 34, h: 10, hr: 2, bb: 8, so: 6, hbp: 1, er: 6, w: 0, l: 0, sv: 0, fld: 60, rk: true },
    ],
  },
  // TEX (TEX 1999)
  {
    franchiseId: 'TEX',
    season: 1999,
    batters: [
      { id: 'rodriiv01', name: 'Ivan Rodriguez', pos: 'C', bats: 'R', age: 27, pa: 630, h: 193, double: 34, triple: 3, hr: 28, bb: 29, so: 76, hbp: 3, sb: 17, cs: 7, sec: '1B', fld: 78, arm: 89 },
      { id: 'stevele01', name: 'Lee Stevens', pos: '1B', bats: 'L', age: 31, pa: 576, h: 147, double: 30, triple: 3, hr: 26, bb: 47, so: 131, hbp: 0, sb: 1, cs: 3, sec: '3B', fld: 63 },
      { id: 'mclemma01', name: 'Mark McLemore', pos: '2B', bats: 'S', age: 34, pa: 664, h: 148, double: 20, triple: 5, hr: 5, bb: 88, so: 79, hbp: 1, sb: 15, cs: 7, sec: 'SS', fld: 77 },
      { id: 'zeileto01', name: 'Todd Zeile', pos: '3B', bats: 'R', age: 33, pa: 656, h: 163, double: 34, triple: 1, hr: 23, bb: 65, so: 95, hbp: 4, sb: 3, cs: 3, sec: '1B', fld: 67 },
      { id: 'claytro01', name: 'Royce Clayton', pos: 'SS', bats: 'R', age: 29, pa: 520, h: 127, double: 25, triple: 4, hr: 11, bb: 39, so: 88, hbp: 3, sb: 16, cs: 8, sec: '2B', fld: 74 },
      { id: 'greerru01', name: 'Rusty Greer', pos: 'LF', bats: 'L', age: 30, pa: 662, h: 173, double: 37, triple: 4, hr: 19, bb: 87, so: 77, hbp: 4, sb: 3, cs: 3, sec: 'RF', fld: 70, arm: 61 },
      { id: 'goodwto01', name: 'Tom Goodwin', pos: 'CF', bats: 'L', age: 30, pa: 455, h: 108, double: 12, triple: 4, hr: 2, bb: 44, so: 64, hbp: 1, sb: 34, cs: 13, sec: 'LF', fld: 71, arm: 64 },
      { id: 'gonzaju03', name: 'Juan Gonzalez', pos: 'RF', bats: 'R', age: 29, pa: 629, h: 181, double: 38, triple: 2, hr: 41, bb: 46, so: 111, hbp: 4, sb: 2, cs: 2, sec: 'LF', fld: 57, arm: 67 },
      { id: 'palmera01', name: 'Rafael Palmeiro', pos: 'DH', bats: 'L', age: 34, pa: 674, h: 175, double: 30, triple: 1, hr: 43, bb: 84, so: 81, hbp: 5, sb: 5, cs: 5, sec: '1B' },
    ],
    bench: [
      { id: 'kellyro01', name: 'Roberto Kelly', pos: 'CF', bats: 'R', age: 34, pa: 318, h: 90, double: 15, triple: 2, hr: 11, bb: 17, so: 55, hbp: 4, sb: 5, cs: 2, sec: 'LF', fld: 54, arm: 68 },
      { id: 'alicelu01', name: 'Luis Alicea', pos: '2B', bats: 'S', age: 33, pa: 196, h: 40, double: 9, triple: 2, hr: 3, bb: 27, so: 28, hbp: 2, sb: 4, cs: 2, sec: '3B', fld: 62 },
      { id: 'mateoru01', name: 'Ruben Mateo', pos: 'CF', bats: 'R', age: 21, pa: 127, h: 29, double: 9, triple: 1, hr: 5, bb: 4, so: 28, hbp: 1, sb: 3, cs: 0, sec: 'LF', fld: 62, arm: 80, rk: true },
      { id: 'zaungr01', name: 'Gregg Zaun', pos: 'C', bats: 'S', age: 28, pa: 106, h: 20, double: 4, triple: 1, hr: 1, bb: 11, so: 13, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 69, arm: 82 },
      { id: 'shavejo01', name: 'Jon Shave', pos: 'SS', bats: 'R', age: 31, pa: 83, h: 21, double: 4, triple: 0, hr: 0, bb: 5, so: 18, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 76, rk: true },
    ],
    reserveBatters: [
      { id: 'dranske01', name: 'Kelly Dransfeldt', pos: 'SS', bats: 'R', age: 24, pa: 57, h: 10, double: 1, triple: 0, hr: 1, bb: 3, so: 12, hbp: 0, sb: 0, cs: 0, sec: '2B', fld: 95, rk: true },
    ],
    pitchers: [
      { id: 'helliri01', name: 'Rick Helling', role: 'SP', throws: 'R', age: 28, g: 35, gs: 35, outs: 658, h: 220, hr: 35, bb: 87, so: 149, hbp: 5, er: 115, w: 13, l: 11, sv: 0, fld: 57 },
      { id: 'seleaa01', name: 'Aaron Sele', role: 'SP', throws: 'R', age: 29, g: 33, gs: 33, outs: 615, h: 237, hr: 20, bb: 77, so: 171, hbp: 13, er: 106, w: 18, l: 9, sv: 0, fld: 68 },
      { id: 'burkejo03', name: 'John Burkett', role: 'SP', throws: 'R', age: 34, g: 30, gs: 25, outs: 442, h: 184, hr: 16, bb: 38, so: 101, hbp: 4, er: 91, w: 9, l: 8, sv: 0, fld: 70 },
      { id: 'morgami01', name: 'Mike Morgan', role: 'SP', throws: 'R', age: 39, g: 34, gs: 25, outs: 420, h: 173, hr: 23, bb: 47, so: 71, hbp: 8, er: 85, w: 13, l: 10, sv: 0, fld: 75 },
      { id: 'loaizes01', name: 'Esteban Loaiza', role: 'SP', throws: 'R', age: 27, g: 30, gs: 15, outs: 361, h: 132, hr: 14, bb: 37, so: 75, hbp: 3, er: 62, w: 9, l: 5, sv: 0, fld: 65 },
      { id: 'wettejo01', name: 'John Wetteland', role: 'CL', throws: 'R', age: 32, g: 62, gs: 0, outs: 198, h: 60, hr: 8, bb: 19, so: 68, hbp: 0, er: 22, w: 4, l: 4, sv: 43, fld: 66 },
      { id: 'zimmeje02', name: 'Jeff Zimmerman', role: 'RP', throws: 'R', age: 26, g: 65, gs: 0, outs: 263, h: 50, hr: 9, bb: 23, so: 67, hbp: 2, er: 23, w: 9, l: 3, sv: 3, fld: 61, rk: true },
      { id: 'venafmi01', name: 'Mike Venafro', role: 'RP', throws: 'L', age: 25, g: 65, gs: 0, outs: 205, h: 63, hr: 4, bb: 22, so: 37, hbp: 3, er: 25, w: 3, l: 2, sv: 0, fld: 79, rk: true },
      { id: 'crabtti01', name: 'Tim Crabtree', role: 'RP', throws: 'R', age: 29, g: 68, gs: 0, outs: 195, h: 70, hr: 4, bb: 22, so: 48, hbp: 2, er: 27, w: 5, l: 1, sv: 0, fld: 56 },
      { id: 'patteda04', name: 'Danny Patterson', role: 'RP', throws: 'R', age: 28, g: 53, gs: 0, outs: 181, h: 71, hr: 7, bb: 20, so: 44, hbp: 1, er: 33, w: 2, l: 0, sv: 0, fld: 63 },
      { id: 'munozmi01', name: 'Mike Munoz', role: 'RP', throws: 'L', age: 33, g: 56, gs: 0, outs: 158, h: 56, hr: 4, bb: 18, so: 28, hbp: 1, er: 26, w: 2, l: 1, sv: 1, fld: 83 },
    ],
    reservePitchers: [
      { id: 'clarkma01', name: 'Mark Clark', role: 'SP', throws: 'R', age: 31, g: 15, gs: 15, outs: 223, h: 94, hr: 11, bb: 24, so: 54, hbp: 1, er: 50, w: 3, l: 7, sv: 0, fld: 67 },
      { id: 'glynnry01', name: 'Ryan Glynn', role: 'SP', throws: 'R', age: 24, g: 13, gs: 10, outs: 164, h: 71, hr: 10, bb: 35, so: 39, hbp: 1, er: 44, w: 2, l: 4, sv: 0, fld: 86, rk: true },
      { id: 'kolbda01', name: 'Danny Kolb', role: 'RP', throws: 'R', age: 24, g: 16, gs: 0, outs: 93, h: 33, hr: 2, bb: 15, so: 15, hbp: 1, er: 16, w: 2, l: 1, sv: 0, fld: 67, rk: true },
      { id: 'perisma01', name: 'Matt Perisho', role: 'RP', throws: 'L', age: 24, g: 4, gs: 1, outs: 31, h: 11, hr: 1, bb: 5, so: 9, hbp: 1, er: 7, w: 0, l: 0, sv: 0, fld: 63 },
      { id: 'gundeer01', name: 'Eric Gunderson', role: 'RP', throws: 'L', age: 33, g: 11, gs: 0, outs: 30, h: 15, hr: 2, bb: 3, so: 7, hbp: 0, er: 6, w: 0, l: 0, sv: 0, fld: 69 },
    ],
  },
  // ATL (ATL 1999)
  {
    franchiseId: 'ATL',
    season: 1999,
    batters: [
      { id: 'perezed02', name: 'Eddie Perez', pos: 'C', bats: 'R', age: 31, pa: 339, h: 81, double: 17, triple: 0, hr: 8, bb: 20, so: 46, hbp: 5, sb: 0, cs: 1, sec: '1B', fld: 74, arm: 69 },
      { id: 'kleskry01', name: 'Ryan Klesko', pos: '1B', bats: 'L', age: 28, pa: 466, h: 115, double: 27, triple: 2, hr: 20, bb: 51, so: 75, hbp: 3, sb: 5, cs: 3, sec: 'LF', fld: 58 },
      { id: 'boonebr01', name: 'Bret Boone', pos: '2B', bats: 'R', age: 30, pa: 671, h: 153, double: 38, triple: 1, hr: 20, bb: 50, so: 114, hbp: 5, sb: 10, cs: 7, sec: 'SS', fld: 63 },
      { id: 'jonesch06', name: 'Chipper Jones', pos: '3B', bats: 'S', age: 27, pa: 701, h: 183, double: 37, triple: 3, hr: 37, bb: 108, so: 93, hbp: 1, sb: 21, cs: 4, sec: 'SS', fld: 49 },
      { id: 'weisswa01', name: 'Walt Weiss', pos: 'SS', bats: 'S', age: 35, pa: 327, h: 70, double: 14, triple: 3, hr: 1, bb: 41, so: 44, hbp: 2, sb: 6, cs: 2, fld: 56 },
      { id: 'willige02', name: 'Gerald Williams', pos: 'LF', bats: 'R', age: 32, pa: 467, h: 118, double: 26, triple: 2, hr: 15, bb: 28, so: 70, hbp: 5, sb: 18, cs: 9, sec: 'CF', fld: 64, arm: 78 },
      { id: 'jonesan01', name: 'Andruw Jones', pos: 'CF', bats: 'R', age: 22, pa: 679, h: 162, double: 34, triple: 6, hr: 28, bb: 66, so: 122, hbp: 7, sb: 26, cs: 10, sec: 'RF', fld: 89, arm: 74 },
      { id: 'jordabr01', name: 'Brian Jordan', pos: 'RF', bats: 'R', age: 32, pa: 645, h: 170, double: 30, triple: 5, hr: 23, bb: 47, so: 77, hbp: 10, sb: 15, cs: 7, sec: 'CF', fld: 71, arm: 68 },
      { id: 'lopezja01', name: 'Javy Lopez', pos: 'DH', bats: 'R', age: 28, pa: 269, h: 73, double: 14, triple: 1, hr: 14, bb: 18, so: 43, hbp: 3, sb: 1, cs: 2, sec: 'C', fld: 67, arm: 64 },
    ],
    bench: [
      { id: 'guilloz01', name: 'Ozzie Guillen', pos: 'SS', bats: 'L', age: 35, pa: 255, h: 58, double: 13, triple: 1, hr: 1, bb: 16, so: 17, hbp: 0, sb: 3, cs: 3, fld: 58 },
      { id: 'simonra01', name: 'Randall Simon', pos: '1B', bats: 'L', age: 24, pa: 237, h: 68, double: 15, triple: 0, hr: 5, bb: 16, so: 25, hbp: 1, sb: 2, cs: 2, sec: '3B', fld: 64, rk: true },
      { id: 'huntebr01', name: 'Brian Hunter', pos: '1B', bats: 'R', age: 31, pa: 223, h: 44, double: 13, triple: 1, hr: 6, bb: 26, so: 40, hbp: 3, sb: 0, cs: 1, sec: 'LF', fld: 72 },
      { id: 'lockhke01', name: 'Keith Lockhart', pos: '2B', bats: 'L', age: 34, pa: 184, h: 43, double: 7, triple: 1, hr: 3, bb: 16, so: 19, hbp: 1, sb: 2, cs: 1, sec: '3B', fld: 59 },
      { id: 'nixonot01', name: 'Otis Nixon', pos: 'LF', bats: 'S', age: 40, pa: 176, h: 41, double: 3, triple: 1, hr: 0, bb: 18, so: 19, hbp: 0, sb: 17, cs: 4, sec: 'CF', fld: 46, arm: 56 },
    ],
    pitchers: [
      { id: 'glavito02', name: 'Tom Glavine', role: 'SP', throws: 'L', age: 33, g: 35, gs: 35, outs: 702, h: 238, hr: 17, bb: 82, so: 152, hbp: 3, er: 91, w: 14, l: 11, sv: 0, fld: 87 },
      { id: 'millwke01', name: 'Kevin Millwood', role: 'SP', throws: 'R', age: 24, g: 33, gs: 33, outs: 684, h: 185, hr: 22, bb: 63, so: 200, hbp: 4, er: 78, w: 18, l: 7, sv: 0, fld: 62 },
      { id: 'maddugr01', name: 'Greg Maddux', role: 'SP', throws: 'R', age: 33, g: 33, gs: 33, outs: 658, h: 227, hr: 14, bb: 36, so: 164, hbp: 5, er: 73, w: 19, l: 9, sv: 0, fld: 93 },
      { id: 'smoltjo01', name: 'John Smoltz', role: 'SP', throws: 'R', age: 32, g: 29, gs: 29, outs: 559, h: 166, hr: 13, bb: 44, so: 170, hbp: 3, er: 63, w: 11, l: 8, sv: 0, fld: 74 },
      { id: 'perezod01', name: 'Odalis Perez', role: 'SP', throws: 'L', age: 21, g: 18, gs: 17, outs: 279, h: 100, hr: 12, bb: 52, so: 80, hbp: 1, er: 61, w: 4, l: 6, sv: 0, fld: 67, rk: true },
      { id: 'rockejo01', name: 'John Rocker', role: 'CL', throws: 'L', age: 24, g: 74, gs: 0, outs: 217, h: 45, hr: 6, bb: 38, so: 97, hbp: 2, er: 19, w: 4, l: 5, sv: 38, fld: 69, rk: true },
      { id: 'remlimi01', name: 'Mike Remlinger', role: 'RP', throws: 'L', age: 33, g: 73, gs: 0, outs: 251, h: 71, hr: 10, bb: 39, so: 77, hbp: 2, er: 34, w: 10, l: 1, sv: 1, fld: 76 },
      { id: 'mcglike01', name: 'Kevin McGlinchy', role: 'RP', throws: 'R', age: 22, g: 64, gs: 0, outs: 211, h: 66, hr: 6, bb: 30, so: 67, hbp: 1, er: 22, w: 7, l: 3, sv: 0, fld: 86, rk: true },
      { id: 'seaneru01', name: 'Rudy Seanez', role: 'RP', throws: 'R', age: 30, g: 56, gs: 0, outs: 161, h: 44, hr: 3, bb: 22, so: 52, hbp: 1, er: 19, w: 6, l: 1, sv: 3, fld: 74 },
      { id: 'chenbr01', name: 'Bruce Chen', role: 'RP', throws: 'L', age: 22, g: 16, gs: 7, outs: 153, h: 42, hr: 10, bb: 26, so: 44, hbp: 2, er: 29, w: 2, l: 2, sv: 0, fld: 70, rk: true },
      { id: 'sprinru01', name: 'Russ Springer', role: 'RP', throws: 'R', age: 30, g: 49, gs: 0, outs: 142, h: 36, hr: 4, bb: 23, so: 50, hbp: 2, er: 19, w: 2, l: 1, sv: 1, fld: 62 },
    ],
    reservePitchers: [
      { id: 'speieju01', name: 'Justin Speier', role: 'RP', throws: 'R', age: 25, g: 19, gs: 0, outs: 86, h: 30, hr: 8, bb: 14, so: 22, hbp: 0, er: 20, w: 0, l: 0, sv: 0, fld: 75, rk: true },
      { id: 'hudekjo01', name: 'John Hudek', role: 'RP', throws: 'R', age: 32, g: 20, gs: 0, outs: 64, h: 24, hr: 3, bb: 17, so: 23, hbp: 1, er: 13, w: 0, l: 2, sv: 0, fld: 73 },
    ],
  },
  // MIA (FLO 1999)
  {
    franchiseId: 'MIA',
    season: 1999,
    batters: [
      { id: 'redmomi01', name: 'Mike Redmond', pos: 'C', bats: 'R', age: 28, pa: 278, h: 76, double: 11, triple: 0, hr: 2, bb: 22, so: 34, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 75, arm: 75, rk: true },
      { id: 'millake01', name: 'Kevin Millar', pos: '1B', bats: 'R', age: 27, pa: 407, h: 100, double: 17, triple: 4, hr: 9, bb: 40, so: 64, hbp: 7, sb: 1, cs: 0, sec: '3B', fld: 71, rk: true },
      { id: 'castilu01', name: 'Luis Castillo', pos: '2B', bats: 'S', age: 23, pa: 563, h: 137, double: 20, triple: 4, hr: 0, bb: 66, so: 90, hbp: 0, sb: 41, cs: 15, sec: 'SS', fld: 67 },
      { id: 'lowelmi01', name: 'Mike Lowell', pos: '3B', bats: 'R', age: 25, pa: 344, h: 78, double: 15, triple: 0, hr: 12, bb: 25, so: 68, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 72, rk: true },
      { id: 'gonzaal02', name: 'Alex Gonzalez', pos: 'SS', bats: 'R', age: 22, pa: 591, h: 147, double: 26, triple: 7, hr: 14, bb: 19, so: 120, hbp: 11, sb: 3, cs: 5, sec: '2B', fld: 67, rk: true },
      { id: 'avenbr01', name: 'Bruce Aven', pos: 'LF', bats: 'R', age: 27, pa: 440, h: 110, double: 19, triple: 2, hr: 12, bb: 44, so: 82, hbp: 9, sb: 3, cs: 0, sec: 'RF', fld: 79, arm: 68, rk: true },
      { id: 'wilsopr01', name: 'Preston Wilson', pos: 'CF', bats: 'R', age: 24, pa: 543, h: 131, double: 21, triple: 4, hr: 25, bb: 47, so: 158, hbp: 9, sb: 11, cs: 4, sec: 'LF', fld: 70, arm: 75, rk: true },
      { id: 'kotsama01', name: 'Mark Kotsay', pos: 'RF', bats: 'L', age: 23, pa: 535, h: 135, double: 22, triple: 8, hr: 8, bb: 29, so: 51, hbp: 0, sb: 8, cs: 5, sec: 'CF', fld: 78, arm: 92 },
      { id: 'floydcl01', name: 'Cliff Floyd', pos: 'DH', bats: 'L', age: 26, pa: 285, h: 73, double: 19, triple: 1, hr: 10, bb: 26, so: 49, hbp: 2, sb: 9, cs: 6, sec: 'LF', fld: 63, arm: 74 },
    ],
    bench: [
      { id: 'bergda01', name: 'Dave Berg', pos: 'SS', bats: 'R', age: 28, pa: 336, h: 88, double: 18, triple: 1, hr: 3, bb: 31, so: 63, hbp: 1, sb: 3, cs: 1, sec: '2B', fld: 65 },
      { id: 'fabrejo01', name: 'Jorge Fabregas', pos: 'C', bats: 'L', age: 29, pa: 268, h: 51, double: 8, triple: 1, hr: 3, bb: 20, so: 32, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 71, arm: 81 },
      { id: 'orieke01', name: 'Kevin Orie', pos: '3B', bats: 'R', age: 26, pa: 267, h: 58, double: 15, triple: 1, hr: 5, bb: 22, so: 39, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 80 },
      { id: 'leede02', name: 'Derrek Lee', pos: '1B', bats: 'R', age: 23, pa: 236, h: 47, double: 12, triple: 1, hr: 7, bb: 20, so: 62, hbp: 3, sb: 2, cs: 1, sec: '3B', fld: 81 },
      { id: 'bautida01', name: 'Danny Bautista', pos: 'RF', bats: 'R', age: 27, pa: 211, h: 55, double: 11, triple: 1, hr: 5, bb: 6, so: 31, hbp: 1, sb: 3, cs: 0, sec: 'LF', fld: 100, arm: 69 },
    ],
    reserveBatters: [
      { id: 'dunwoto01', name: 'Todd Dunwoody', pos: 'CF', bats: 'L', age: 24, pa: 200, h: 45, double: 9, triple: 3, hr: 2, bb: 11, so: 47, hbp: 2, sb: 3, cs: 2, sec: 'LF', fld: 59, arm: 71 },
      { id: 'hyersti01', name: 'Tim Hyers', pos: '1B', bats: 'L', age: 27, pa: 96, h: 18, double: 4, triple: 1, hr: 2, bb: 14, so: 11, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
      { id: 'castrra01', name: 'Ramon Castro', pos: 'C', bats: 'R', age: 23, pa: 78, h: 12, double: 4, triple: 0, hr: 2, bb: 10, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 64, arm: 81, rk: true },
      { id: 'clapich01', name: 'Chris Clapinski', pos: '3B', bats: 'S', age: 27, pa: 66, h: 13, double: 1, triple: 2, hr: 0, bb: 9, so: 12, hbp: 1, sb: 1, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'hernali01', name: 'Livan Hernandez', role: 'SP', throws: 'R', age: 24, g: 30, gs: 30, outs: 599, h: 221, hr: 25, bb: 81, so: 142, hbp: 4, er: 101, w: 8, l: 12, sv: 0, fld: 81 },
      { id: 'sprinde01', name: 'Dennis Springer', role: 'SP', throws: 'R', age: 34, g: 38, gs: 29, outs: 589, h: 218, hr: 28, bb: 74, so: 80, hbp: 11, er: 110, w: 6, l: 16, sv: 1, fld: 70 },
      { id: 'meadobr01', name: 'Brian Meadows', role: 'SP', throws: 'R', age: 23, g: 31, gs: 31, outs: 535, h: 219, hr: 27, bb: 53, so: 79, hbp: 4, er: 108, w: 11, l: 15, sv: 0, fld: 68 },
      { id: 'dempsry01', name: 'Ryan Dempster', role: 'SP', throws: 'R', age: 22, g: 25, gs: 25, outs: 441, h: 152, hr: 20, bb: 93, so: 117, hbp: 9, er: 83, w: 7, l: 8, sv: 0, fld: 67 },
      { id: 'fernaal01', name: 'Alex Fernandez', role: 'SP', throws: 'R', age: 29, g: 24, gs: 24, outs: 423, h: 132, hr: 12, bb: 42, so: 100, hbp: 4, er: 54, w: 7, l: 8, sv: 0, fld: 78 },
      { id: 'mantema01', name: 'Matt Mantei', role: 'CL', throws: 'R', age: 25, g: 65, gs: 0, outs: 196, h: 45, hr: 4, bb: 39, so: 92, hbp: 6, er: 21, w: 1, l: 3, sv: 32, fld: 77 },
      { id: 'edmonbr01', name: 'Brian Edmondson', role: 'RP', throws: 'R', age: 26, g: 68, gs: 0, outs: 282, h: 103, hr: 12, bb: 45, so: 56, hbp: 5, er: 54, w: 5, l: 8, sv: 1, fld: 62 },
      { id: 'loopebr01', name: 'Braden Looper', role: 'RP', throws: 'R', age: 24, g: 72, gs: 0, outs: 249, h: 97, hr: 7, bb: 31, so: 51, hbp: 1, er: 35, w: 3, l: 3, sv: 0, fld: 72, rk: true },
      { id: 'alfonan01', name: 'Antonio Alfonseca', role: 'RP', throws: 'R', age: 27, g: 73, gs: 0, outs: 233, h: 81, hr: 7, bb: 31, so: 48, hbp: 4, er: 31, w: 4, l: 5, sv: 21, fld: 59 },
      { id: 'burneaj01', name: 'A. J. Burnett', role: 'RP', throws: 'R', age: 22, g: 7, gs: 7, outs: 124, h: 37, hr: 3, bb: 25, so: 33, hbp: 0, er: 16, w: 4, l: 2, sv: 0, fld: 71, rk: true },
      { id: 'darenvi01', name: 'Vic Darensbourg', role: 'RP', throws: 'L', age: 28, g: 56, gs: 0, outs: 104, h: 40, hr: 3, bb: 20, so: 31, hbp: 2, er: 25, w: 0, l: 1, sv: 0, fld: 78 },
    ],
    reservePitchers: [
      { id: 'nunezvl01', name: 'Vladimir Nunez', role: 'SP', throws: 'R', age: 24, g: 44, gs: 12, outs: 326, h: 96, hr: 11, bb: 53, so: 84, hbp: 4, er: 51, w: 7, l: 10, sv: 1, fld: 73, rk: true },
      { id: 'sanchje01', name: 'Jesus Sanchez', role: 'SP', throws: 'L', age: 24, g: 59, gs: 10, outs: 229, h: 84, hr: 12, bb: 50, so: 64, hbp: 3, er: 45, w: 5, l: 7, sv: 0, fld: 70 },
      { id: 'medinra01', name: 'Rafael Medina', role: 'RP', throws: 'R', age: 24, g: 20, gs: 0, outs: 70, h: 24, hr: 3, bb: 18, so: 16, hbp: 1, er: 15, w: 1, l: 1, sv: 0, fld: 62 },
      { id: 'corbiar01', name: 'Archie Corbin', role: 'RP', throws: 'R', age: 31, g: 17, gs: 0, outs: 63, h: 25, hr: 2, bb: 15, so: 30, hbp: 1, er: 17, w: 0, l: 1, sv: 0, fld: 61, rk: true },
      { id: 'cornere01', name: 'Reid Cornelius', role: 'RP', throws: 'R', age: 29, g: 5, gs: 2, outs: 58, h: 16, hr: 0, bb: 5, so: 12, hbp: 0, er: 7, w: 1, l: 0, sv: 0, fld: 59 },
    ],
  },
  // NYM (NYN 1999)
  {
    franchiseId: 'NYM',
    season: 1999,
    batters: [
      { id: 'piazzmi01', name: 'Mike Piazza', pos: 'C', bats: 'R', age: 30, pa: 593, h: 171, double: 30, triple: 0, hr: 36, bb: 55, so: 72, hbp: 2, sb: 2, cs: 1, sec: '1B', fld: 71, arm: 63 },
      { id: 'olerujo01', name: 'John Olerud', pos: '1B', bats: 'L', age: 30, pa: 723, h: 187, double: 39, triple: 2, hr: 22, bb: 114, so: 72, hbp: 9, sb: 2, cs: 1, sec: '3B', fld: 73 },
      { id: 'alfoned01', name: 'Edgardo Alfonzo', pos: '2B', bats: 'R', age: 25, pa: 726, h: 188, double: 37, triple: 2, hr: 22, bb: 81, so: 84, hbp: 4, sb: 10, cs: 3, sec: '3B', fld: 62 },
      { id: 'venturo01', name: 'Robin Ventura', pos: '3B', bats: 'L', age: 31, pa: 671, h: 167, double: 35, triple: 2, hr: 27, bb: 78, so: 107, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 87 },
      { id: 'ordonre01', name: 'Rey Ordonez', pos: 'SS', bats: 'R', age: 28, pa: 588, h: 131, double: 21, triple: 2, hr: 1, bb: 38, so: 60, hbp: 1, sb: 7, cs: 5, sec: '2B', fld: 72 },
      { id: 'henderi01', name: 'Rickey Henderson', pos: 'LF', bats: 'R', age: 40, pa: 526, h: 118, double: 21, triple: 0, hr: 11, bb: 89, so: 86, hbp: 3, sb: 44, cs: 12, sec: 'CF', fld: 56, arm: 56 },
      { id: 'mcraebr01', name: 'Brian McRae', pos: 'CF', bats: 'S', age: 31, pa: 472, h: 98, double: 22, triple: 3, hr: 13, bb: 56, so: 74, hbp: 6, sb: 9, cs: 7, sec: 'LF', fld: 55, arm: 60 },
      { id: 'cedenro01', name: 'Roger Cedeno', pos: 'RF', bats: 'S', age: 24, pa: 525, h: 133, double: 23, triple: 4, hr: 4, bb: 58, so: 103, hbp: 3, sb: 50, cs: 13, sec: 'CF', fld: 75, arm: 71 },
      { id: 'agbaybe01', name: 'Benny Agbayani', pos: 'DH', bats: 'R', age: 27, pa: 314, h: 78, double: 17, triple: 3, hr: 14, bb: 32, so: 61, hbp: 3, sb: 6, cs: 5, sec: 'RF', fld: 61, arm: 64, rk: true },
    ],
    bench: [
      { id: 'francma01', name: 'Matt Franco', pos: '1B', bats: 'L', age: 29, pa: 161, h: 35, double: 5, triple: 1, hr: 3, bb: 22, so: 22, hbp: 0, sb: 0, cs: 0, sec: '3B' },
      { id: 'prattto02', name: 'Todd Pratt', pos: 'C', bats: 'R', age: 32, pa: 160, h: 41, double: 8, triple: 0, hr: 3, bb: 13, so: 36, hbp: 2, sb: 1, cs: 0, sec: '1B', fld: 73, arm: 66 },
      { id: 'bonilbo01', name: 'Bobby Bonilla', pos: 'RF', bats: 'S', age: 36, pa: 141, h: 30, double: 6, triple: 0, hr: 4, bb: 16, so: 20, hbp: 1, sb: 1, cs: 1, sec: 'LF', fld: 65, arm: 79 },
      { id: 'lopezlu02', name: 'Luis Lopez', pos: 'SS', bats: 'S', age: 28, pa: 121, h: 26, double: 5, triple: 1, hr: 1, bb: 9, so: 27, hbp: 2, sb: 1, cs: 1, sec: '2B' },
      { id: 'allenje01', name: 'Jermaine Allensworth', pos: 'RF', bats: 'R', age: 27, pa: 86, h: 19, double: 4, triple: 0, hr: 1, bb: 7, so: 17, hbp: 2, sb: 3, cs: 1, sec: 'CF', fld: 91, arm: 66 },
    ],
    reserveBatters: [
      { id: 'kinkami01', name: 'Mike Kinkade', pos: 'LF', bats: 'R', age: 26, pa: 51, h: 9, double: 2, triple: 1, hr: 2, bb: 3, so: 9, hbp: 2, sb: 1, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'leiteal01', name: 'Al Leiter', role: 'SP', throws: 'L', age: 33, g: 32, gs: 32, outs: 639, h: 195, hr: 16, bb: 94, so: 178, hbp: 11, er: 88, w: 13, l: 12, sv: 0, fld: 48 },
      { id: 'hershor01', name: 'Orel Hershiser', role: 'SP', throws: 'R', age: 40, g: 32, gs: 32, outs: 537, h: 177, hr: 18, bb: 74, so: 99, hbp: 11, er: 90, w: 13, l: 12, sv: 0, fld: 84 },
      { id: 'yoshima01', name: 'Masato Yoshii', role: 'SP', throws: 'R', age: 34, g: 31, gs: 29, outs: 522, h: 168, hr: 24, bb: 56, so: 111, hbp: 6, er: 82, w: 12, l: 8, sv: 0, fld: 60 },
      { id: 'reedri01', name: 'Rick Reed', role: 'SP', throws: 'R', age: 34, g: 26, gs: 26, outs: 448, h: 157, hr: 21, bb: 33, so: 105, hbp: 3, er: 66, w: 11, l: 5, sv: 0, fld: 82 },
      { id: 'doteloc01', name: 'Octavio Dotel', role: 'SP', throws: 'R', age: 25, g: 19, gs: 14, outs: 256, h: 69, hr: 12, bb: 49, so: 85, hbp: 6, er: 51, w: 8, l: 3, sv: 0, fld: 85, rk: true },
      { id: 'benitar01', name: 'Armando Benitez', role: 'CL', throws: 'R', age: 26, g: 77, gs: 0, outs: 234, h: 45, hr: 7, bb: 42, so: 113, hbp: 2, er: 21, w: 4, l: 3, sv: 22, fld: 61 },
      { id: 'wendetu01', name: 'Turk Wendell', role: 'RP', throws: 'R', age: 32, g: 80, gs: 0, outs: 257, h: 76, hr: 7, bb: 41, so: 72, hbp: 2, er: 31, w: 5, l: 4, sv: 3, fld: 66 },
      { id: 'watsoal01', name: 'Allen Watson', role: 'RP', throws: 'L', age: 28, g: 38, gs: 4, outs: 231, h: 83, hr: 12, bb: 30, so: 56, hbp: 2, er: 39, w: 6, l: 3, sv: 1, fld: 73 },
      { id: 'isrinja01', name: 'Jason Isringhausen', role: 'RP', throws: 'R', age: 26, g: 33, gs: 5, outs: 194, h: 66, hr: 9, bb: 35, so: 51, hbp: 3, er: 36, w: 1, l: 4, sv: 9, fld: 71 },
      { id: 'mahompa01', name: 'Pat Mahomes', role: 'RP', throws: 'R', age: 28, g: 39, gs: 0, outs: 191, h: 46, hr: 7, bb: 38, so: 49, hbp: 2, er: 27, w: 8, l: 0, sv: 0, fld: 63 },
      { id: 'cookde01', name: 'Dennis Cook', role: 'RP', throws: 'L', age: 36, g: 71, gs: 0, outs: 189, h: 53, hr: 8, bb: 26, so: 68, hbp: 2, er: 23, w: 10, l: 5, sv: 3, fld: 71 },
    ],
    reservePitchers: [
      { id: 'jonesbo03', name: 'Bobby Jones', role: 'RP', throws: 'R', age: 29, g: 12, gs: 9, outs: 178, h: 61, hr: 6, bb: 16, so: 36, hbp: 2, er: 29, w: 3, l: 3, sv: 0, fld: 66 },
      { id: 'beltrri01', name: 'Rigo Beltran', role: 'RP', throws: 'L', age: 29, g: 33, gs: 0, outs: 126, h: 46, hr: 6, bb: 18, so: 47, hbp: 1, er: 20, w: 1, l: 1, sv: 0, fld: 62 },
      { id: 'francjo01', name: 'John Franco', role: 'RP', throws: 'L', age: 38, g: 46, gs: 0, outs: 122, h: 40, hr: 2, bb: 18, so: 39, hbp: 2, er: 14, w: 0, l: 2, sv: 19, fld: 76 },
      { id: 'mcmicgr01', name: 'Greg McMichael', role: 'RP', throws: 'R', age: 32, g: 36, gs: 0, outs: 101, h: 36, hr: 5, bb: 17, so: 27, hbp: 2, er: 16, w: 1, l: 1, sv: 0, fld: 71 },
      { id: 'manzajo01', name: 'Josias Manzanillo', role: 'RP', throws: 'R', age: 31, g: 12, gs: 0, outs: 56, h: 18, hr: 4, bb: 7, so: 23, hbp: 1, er: 11, w: 0, l: 0, sv: 0, fld: 63 },
    ],
  },
  // PHI (PHI 1999)
  {
    franchiseId: 'PHI',
    season: 1999,
    batters: [
      { id: 'liebemi01', name: 'Mike Lieberthal', pos: 'C', bats: 'R', age: 27, pa: 574, h: 144, double: 31, triple: 2, hr: 25, bb: 41, so: 83, hbp: 10, sb: 1, cs: 1, sec: '1B', fld: 74, arm: 70 },
      { id: 'brognri01', name: 'Rico Brogna', pos: '1B', bats: 'L', age: 29, pa: 679, h: 167, double: 34, triple: 3, hr: 23, bb: 51, so: 134, hbp: 1, sb: 9, cs: 6, sec: '3B', fld: 81 },
      { id: 'anderma02', name: 'Marlon Anderson', pos: '2B', bats: 'L', age: 25, pa: 484, h: 116, double: 26, triple: 4, hr: 5, bb: 23, so: 61, hbp: 2, sb: 13, cs: 2, sec: 'SS', fld: 67, rk: true },
      { id: 'rolensc01', name: 'Scott Rolen', pos: '3B', bats: 'R', age: 24, pa: 497, h: 118, double: 29, triple: 2, hr: 22, bb: 64, so: 106, hbp: 6, sb: 11, cs: 4, sec: '1B', fld: 90 },
      { id: 'ariasal01', name: 'Alex Arias', pos: 'SS', bats: 'R', age: 31, pa: 390, h: 103, double: 19, triple: 1, hr: 4, bb: 36, so: 35, hbp: 4, sb: 2, cs: 2, sec: '3B', fld: 58 },
      { id: 'gantro01', name: 'Ron Gant', pos: 'LF', bats: 'R', age: 34, pa: 605, h: 130, double: 25, triple: 4, hr: 22, bb: 77, so: 127, hbp: 1, sb: 13, cs: 3, sec: 'CF', fld: 76, arm: 70 },
      { id: 'glanvdo01', name: 'Doug Glanville', pos: 'CF', bats: 'R', age: 28, pa: 692, h: 193, double: 33, triple: 6, hr: 9, bb: 43, so: 80, hbp: 5, sb: 28, cs: 5, sec: 'LF', fld: 77, arm: 77 },
      { id: 'abreubo01', name: 'Bobby Abreu', pos: 'RF', bats: 'L', age: 25, pa: 662, h: 178, double: 34, triple: 9, hr: 19, bb: 101, so: 128, hbp: 2, sb: 25, cs: 10, sec: 'LF', fld: 61, arm: 67 },
      { id: 'duceyro01', name: 'Rob Ducey', pos: 'DH', bats: 'L', age: 34, pa: 227, h: 50, double: 14, triple: 2, hr: 7, bb: 28, so: 55, hbp: 3, sb: 3, cs: 2, sec: 'LF', fld: 88, arm: 63 },
    ],
    bench: [
      { id: 'jordake01', name: 'Kevin Jordan', pos: '3B', bats: 'R', age: 29, pa: 380, h: 99, double: 18, triple: 2, hr: 5, bb: 19, so: 39, hbp: 5, sb: 0, cs: 0, sec: '1B', fld: 68 },
      { id: 'relafde01', name: 'Desi Relaford', pos: 'SS', bats: 'S', age: 25, pa: 242, h: 52, double: 11, triple: 2, hr: 2, bb: 17, so: 37, hbp: 3, sb: 4, cs: 2, sec: '2B', fld: 74 },
      { id: 'sefcike01', name: 'Kevin Sefcik', pos: 'LF', bats: 'R', age: 28, pa: 242, h: 60, double: 12, triple: 2, hr: 2, bb: 27, so: 28, hbp: 3, sb: 7, cs: 3, sec: 'RF', fld: 70, arm: 63 },
      { id: 'cedendo01', name: 'Domingo Cedeno', pos: 'SS', bats: 'S', age: 30, pa: 120, h: 26, double: 6, triple: 1, hr: 2, bb: 9, so: 26, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 65 },
      { id: 'dosteda01', name: 'David Doster', pos: '2B', bats: 'R', age: 28, pa: 112, h: 19, double: 2, triple: 0, hr: 3, bb: 12, so: 23, hbp: 0, sb: 1, cs: 0, sec: 'SS', fld: 94, rk: true },
    ],
    reserveBatters: [
      { id: 'bennega01', name: 'Gary Bennett', pos: 'C', bats: 'R', age: 27, pa: 94, h: 24, double: 3, triple: 0, hr: 1, bb: 6, so: 11, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 56, arm: 54, rk: true },
      { id: 'lovulto01', name: 'Torey Lovullo', pos: '1B', bats: 'S', age: 33, pa: 41, h: 8, double: 0, triple: 0, hr: 1, bb: 3, so: 9, hbp: 0, sb: 0, cs: 0, sec: '3B' },
    ],
    pitchers: [
      { id: 'byrdpa01', name: 'Paul Byrd', role: 'SP', throws: 'R', age: 28, g: 32, gs: 32, outs: 599, h: 198, hr: 32, bb: 72, so: 114, hbp: 15, er: 98, w: 15, l: 11, sv: 0, fld: 60 },
      { id: 'schilcu01', name: 'Curt Schilling', role: 'SP', throws: 'R', age: 32, g: 24, gs: 24, outs: 541, h: 158, hr: 20, bb: 42, so: 187, hbp: 4, er: 67, w: 15, l: 6, sv: 0, fld: 70 },
      { id: 'ogeach01', name: 'Chad Ogea', role: 'SP', throws: 'R', age: 28, g: 36, gs: 28, outs: 504, h: 189, hr: 30, bb: 61, so: 87, hbp: 7, er: 103, w: 6, l: 12, sv: 0, fld: 63 },
      { id: 'persoro01', name: 'Robert Person', role: 'SP', throws: 'R', age: 29, g: 42, gs: 22, outs: 444, h: 144, hr: 25, bb: 82, so: 131, hbp: 6, er: 84, w: 10, l: 7, sv: 2, fld: 63 },
      { id: 'wolfra02', name: 'Randy Wolf', role: 'SP', throws: 'L', age: 22, g: 22, gs: 21, outs: 365, h: 126, hr: 20, bb: 67, so: 116, hbp: 5, er: 75, w: 6, l: 9, sv: 0, fld: 69, rk: true },
      { id: 'gomeswa01', name: 'Wayne Gomes', role: 'CL', throws: 'R', age: 26, g: 73, gs: 0, outs: 222, h: 75, hr: 6, bb: 44, so: 63, hbp: 2, er: 37, w: 5, l: 5, sv: 19, fld: 63 },
      { id: 'montgst01', name: 'Steve Montgomery', role: 'RP', throws: 'R', age: 28, g: 53, gs: 0, outs: 194, h: 55, hr: 10, bb: 32, so: 53, hbp: 0, er: 25, w: 1, l: 5, sv: 3, fld: 80, rk: true },
      { id: 'aldresc01', name: 'Scott Aldred', role: 'RP', throws: 'L', age: 31, g: 66, gs: 0, outs: 170, h: 63, hr: 5, bb: 25, so: 36, hbp: 2, er: 32, w: 4, l: 3, sv: 1, fld: 74 },
      { id: 'gracemi02', name: 'Mike Grace', role: 'RP', throws: 'R', age: 29, g: 27, gs: 5, outs: 165, h: 76, hr: 6, bb: 24, so: 31, hbp: 5, er: 40, w: 1, l: 4, sv: 0, fld: 71 },
      { id: 'telemam01', name: 'Amaury Telemaco', role: 'RP', throws: 'R', age: 25, g: 49, gs: 0, outs: 159, h: 55, hr: 8, bb: 20, so: 34, hbp: 2, er: 28, w: 4, l: 0, sv: 0, fld: 73 },
      { id: 'schrest01', name: 'Steve Schrenk', role: 'RP', throws: 'R', age: 30, g: 32, gs: 2, outs: 151, h: 41, hr: 6, bb: 14, so: 36, hbp: 7, er: 24, w: 1, l: 3, sv: 1, fld: 77, rk: true },
    ],
    reservePitchers: [
      { id: 'loeweca01', name: 'Carlton Loewer', role: 'SP', throws: 'R', age: 25, g: 20, gs: 13, outs: 269, h: 104, hr: 11, bb: 27, so: 44, hbp: 1, er: 54, w: 2, l: 6, sv: 0, fld: 74 },
      { id: 'pooleji02', name: 'Jim Poole', role: 'RP', throws: 'L', age: 33, g: 54, gs: 0, outs: 109, h: 50, hr: 4, bb: 16, so: 23, hbp: 2, er: 22, w: 2, l: 1, sv: 1, fld: 72 },
      { id: 'grahejo01', name: 'Joe Grahe', role: 'RP', throws: 'R', age: 31, g: 13, gs: 5, outs: 98, h: 40, hr: 1, bb: 17, so: 16, hbp: 3, er: 14, w: 1, l: 4, sv: 0, fld: 57 },
      { id: 'perezyo01', name: 'Yorkis Perez', role: 'RP', throws: 'L', age: 31, g: 35, gs: 0, outs: 96, h: 28, hr: 3, bb: 15, so: 26, hbp: 0, er: 15, w: 3, l: 1, sv: 0, fld: 66 },
      { id: 'brewebi01', name: 'Billy Brewer', role: 'RP', throws: 'L', age: 31, g: 25, gs: 0, outs: 77, h: 29, hr: 4, bb: 15, so: 26, hbp: 0, er: 20, w: 1, l: 1, sv: 2, fld: 65 },
    ],
  },
  // WSH (MON 1999)
  {
    franchiseId: 'WSH',
    season: 1999,
    batters: [
      { id: 'widgech01', name: 'Chris Widger', pos: 'C', bats: 'R', age: 28, pa: 419, h: 96, double: 22, triple: 1, hr: 13, bb: 28, so: 83, hbp: 4, sb: 3, cs: 2, sec: '1B', fld: 70, arm: 62 },
      { id: 'fullmbr01', name: 'Brad Fullmer', pos: '1B', bats: 'L', age: 24, pa: 374, h: 95, double: 32, triple: 2, hr: 9, bb: 24, so: 42, hbp: 2, sb: 3, cs: 3, sec: '3B', fld: 60 },
      { id: 'vidrojo01', name: 'Jose Vidro', pos: '2B', bats: 'S', age: 24, pa: 531, h: 136, double: 40, triple: 2, hr: 9, bb: 36, so: 56, hbp: 5, sb: 1, cs: 4, sec: '3B', fld: 61 },
      { id: 'barremi01', name: 'Michael Barrett', pos: '3B', bats: 'R', age: 22, pa: 469, h: 127, double: 32, triple: 3, hr: 8, bb: 33, so: 41, hbp: 4, sb: 0, cs: 2, sec: '1B', fld: 66, rk: true },
      { id: 'cabreor01', name: 'Orlando Cabrera', pos: 'SS', bats: 'R', age: 24, pa: 407, h: 99, double: 23, triple: 6, hr: 7, bb: 20, so: 38, hbp: 2, sb: 4, cs: 3, sec: '2B', fld: 82 },
      { id: 'whitero02', name: 'Rondell White', pos: 'LF', bats: 'R', age: 27, pa: 588, h: 162, double: 27, triple: 5, hr: 24, bb: 34, so: 88, hbp: 10, sb: 14, cs: 7, sec: 'CF', fld: 76, arm: 70 },
      { id: 'martima02', name: 'Manny Martinez', pos: 'CF', bats: 'R', age: 28, pa: 357, h: 81, double: 14, triple: 6, hr: 4, bb: 17, so: 59, hbp: 1, sb: 14, cs: 6, sec: 'LF', fld: 74, arm: 83 },
      { id: 'guerrvl01', name: 'Vladimir Guerrero', pos: 'RF', bats: 'R', age: 24, pa: 674, h: 195, double: 37, triple: 6, hr: 38, bb: 48, so: 75, hbp: 8, sb: 12, cs: 8, sec: 'LF', fld: 62, arm: 76 },
      { id: 'andresh01', name: 'Shane Andrews', pos: 'DH', bats: 'R', age: 27, pa: 404, h: 76, double: 17, triple: 0, hr: 17, bb: 45, so: 105, hbp: 1, sb: 1, cs: 3, sec: '3B', fld: 62 },
    ],
    bench: [
      { id: 'guerrwi01', name: 'Wilton Guerrero', pos: '2B', bats: 'S', age: 24, pa: 340, h: 92, double: 13, triple: 7, hr: 2, bb: 11, so: 44, hbp: 1, sb: 6, cs: 4, sec: 'SS', fld: 41 },
      { id: 'mordemi01', name: 'Mike Mordecai', pos: '2B', bats: 'R', age: 31, pa: 250, h: 50, double: 9, triple: 3, hr: 5, bb: 19, so: 34, hbp: 1, sb: 2, cs: 4, sec: 'SS' },
      { id: 'merceor01', name: 'Orlando Merced', pos: 'LF', bats: 'S', age: 32, pa: 221, h: 53, double: 12, triple: 1, hr: 6, bb: 23, so: 30, hbp: 1, sb: 2, cs: 2, sec: 'RF', fld: 76, arm: 79 },
      { id: 'mcguiry01', name: 'Ryan McGuire', pos: '1B', bats: 'L', age: 27, pa: 170, h: 31, double: 8, triple: 1, hr: 2, bb: 23, so: 34, hbp: 0, sb: 1, cs: 1, sec: 'LF', fld: 95 },
      { id: 'blumge01', name: 'Geoff Blum', pos: 'SS', bats: 'S', age: 26, pa: 153, h: 32, double: 7, triple: 2, hr: 8, bb: 17, so: 25, hbp: 0, sb: 1, cs: 0, sec: '2B', fld: 40, rk: true },
    ],
    reserveBatters: [
      { id: 'moutoja01', name: 'James Mouton', pos: 'LF', bats: 'R', age: 30, pa: 146, h: 29, double: 5, triple: 1, hr: 2, bb: 16, so: 27, hbp: 1, sb: 7, cs: 4, sec: 'RF', fld: 70, arm: 76 },
      { id: 'seguife01', name: 'Fernando Seguignol', pos: '1B', bats: 'S', age: 24, pa: 119, h: 27, double: 9, triple: 0, hr: 5, bb: 6, so: 34, hbp: 6, sb: 0, cs: 0, sec: 'LF', fld: 62, rk: true },
      { id: 'joneste02', name: 'Terry Jones', pos: 'CF', bats: 'S', age: 28, pa: 66, h: 14, double: 2, triple: 1, hr: 0, bb: 5, so: 13, hbp: 0, sb: 3, cs: 1, sec: 'LF' },
      { id: 'bergepe01', name: 'Peter Bergeron', pos: 'LF', bats: 'L', age: 21, pa: 55, h: 11, double: 2, triple: 0, hr: 0, bb: 9, so: 5, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
      { id: 'coquitr01', name: 'Trace Coquillette', pos: '3B', bats: 'R', age: 25, pa: 55, h: 13, double: 3, triple: 0, hr: 0, bb: 4, so: 7, hbp: 1, sb: 1, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'hermadu01', name: 'Dustin Hermanson', role: 'SP', throws: 'R', age: 26, g: 34, gs: 34, outs: 649, h: 212, hr: 22, bb: 72, so: 164, hbp: 5, er: 93, w: 9, l: 14, sv: 0, fld: 73 },
      { id: 'vazquja01', name: 'Javier Vazquez', role: 'SP', throws: 'R', age: 22, g: 26, gs: 26, outs: 464, h: 160, hr: 23, bb: 55, so: 115, hbp: 6, er: 92, w: 9, l: 8, sv: 0, fld: 84 },
      { id: 'thurmmi01', name: 'Mike Thurman', role: 'SP', throws: 'R', age: 25, g: 29, gs: 27, outs: 440, h: 138, hr: 17, bb: 53, so: 82, hbp: 7, er: 69, w: 7, l: 11, sv: 0, fld: 63 },
      { id: 'batismi01', name: 'Miguel Batista', role: 'SP', throws: 'R', age: 28, g: 39, gs: 17, outs: 404, h: 143, hr: 11, bb: 62, so: 94, hbp: 6, er: 67, w: 8, l: 7, sv: 1, fld: 67 },
      { id: 'pavanca01', name: 'Carl Pavano', role: 'SP', throws: 'R', age: 23, g: 19, gs: 18, outs: 312, h: 111, hr: 11, bb: 35, so: 68, hbp: 5, er: 58, w: 6, l: 8, sv: 0, fld: 77 },
      { id: 'urbinug01', name: 'Ugueth Urbina', role: 'CL', throws: 'R', age: 25, g: 71, gs: 0, outs: 227, h: 54, hr: 6, bb: 36, so: 102, hbp: 0, er: 25, w: 6, l: 6, sv: 41, fld: 58 },
      { id: 'telfoan01', name: 'Anthony Telford', role: 'RP', throws: 'R', age: 33, g: 79, gs: 0, outs: 288, h: 103, hr: 7, bb: 39, so: 68, hbp: 4, er: 42, w: 5, l: 4, sv: 2, fld: 57 },
      { id: 'ayalabo01', name: 'Bobby Ayala', role: 'RP', throws: 'R', age: 29, g: 66, gs: 0, outs: 246, h: 82, hr: 10, bb: 34, so: 76, hbp: 4, er: 42, w: 1, l: 7, sv: 0, fld: 62 },
      { id: 'klinest02', name: 'Steve Kline', role: 'RP', throws: 'L', age: 26, g: 82, gs: 0, outs: 209, h: 61, hr: 7, bb: 34, so: 66, hbp: 3, er: 28, w: 7, l: 4, sv: 0, fld: 66 },
      { id: 'motagu01', name: 'Guillermo Mota', role: 'RP', throws: 'R', age: 25, g: 51, gs: 0, outs: 166, h: 54, hr: 5, bb: 25, so: 27, hbp: 2, er: 18, w: 2, l: 4, sv: 0, fld: 77, rk: true },
      { id: 'smartjd01', name: 'J. D. Smart', role: 'RP', throws: 'R', age: 25, g: 29, gs: 0, outs: 156, h: 56, hr: 4, bb: 17, so: 21, hbp: 0, er: 29, w: 0, l: 1, sv: 0, fld: 67, rk: true },
    ],
    reservePitchers: [
      { id: 'powelje01', name: 'Jeremy Powell', role: 'SP', throws: 'R', age: 23, g: 17, gs: 17, outs: 291, h: 112, hr: 15, bb: 44, so: 46, hbp: 9, er: 56, w: 4, l: 8, sv: 0, fld: 90, rk: true },
      { id: 'smithda06', name: 'Dan Smith', role: 'SP', throws: 'R', age: 23, g: 20, gs: 17, outs: 269, h: 104, hr: 12, bb: 39, so: 72, hbp: 4, er: 60, w: 4, l: 9, sv: 0, fld: 58, rk: true },
      { id: 'lillyte01', name: 'Ted Lilly', role: 'RP', throws: 'L', age: 23, g: 9, gs: 3, outs: 71, h: 30, hr: 7, bb: 9, so: 28, hbp: 3, er: 20, w: 0, l: 1, sv: 0, fld: 91, rk: true },
      { id: 'stricsc01', name: 'Scott Strickland', role: 'RP', throws: 'R', age: 23, g: 17, gs: 0, outs: 54, h: 15, hr: 3, bb: 11, so: 23, hbp: 0, er: 9, w: 0, l: 1, sv: 0, fld: 81, rk: true },
      { id: 'bennesh01', name: 'Shayne Bennett', role: 'RP', throws: 'R', age: 27, g: 5, gs: 1, outs: 34, h: 16, hr: 2, bb: 6, so: 8, hbp: 1, er: 10, w: 0, l: 1, sv: 0, fld: 74 },
    ],
  },
  // CHC (CHN 1999)
  {
    franchiseId: 'CHC',
    season: 1999,
    batters: [
      { id: 'santibe01', name: 'Benito Santiago', pos: 'C', bats: 'R', age: 34, pa: 386, h: 88, double: 18, triple: 2, hr: 8, bb: 28, so: 74, hbp: 2, sb: 1, cs: 1, sec: '1B', fld: 67, arm: 74 },
      { id: 'gracema01', name: 'Mark Grace', pos: '1B', bats: 'L', age: 35, pa: 688, h: 183, double: 40, triple: 4, hr: 16, bb: 87, so: 48, hbp: 2, sb: 3, cs: 5, fld: 70 },
      { id: 'moranmi01', name: 'Mickey Morandini', pos: '2B', bats: 'L', age: 33, pa: 521, h: 123, double: 20, triple: 4, hr: 4, bb: 51, so: 65, hbp: 6, sb: 9, cs: 5, sec: 'SS', fld: 72 },
      { id: 'houstty01', name: 'Tyler Houston', pos: '3B', bats: 'L', age: 28, pa: 309, h: 68, double: 10, triple: 1, hr: 9, bb: 24, so: 69, hbp: 0, sb: 1, cs: 1, sec: '1B', fld: 53 },
      { id: 'hernajo01', name: 'Jose Hernandez', pos: 'SS', bats: 'R', age: 29, pa: 568, h: 134, double: 22, triple: 5, hr: 21, bb: 48, so: 145, hbp: 3, sb: 8, cs: 5, sec: '3B', fld: 69 },
      { id: 'rodrihe02', name: 'Henry Rodriguez', pos: 'LF', bats: 'L', age: 31, pa: 504, h: 124, double: 27, triple: 1, hr: 28, bb: 54, so: 121, hbp: 0, sb: 2, cs: 4, sec: '1B', fld: 69, arm: 72 },
      { id: 'johnsla03', name: 'Lance Johnson', pos: 'CF', bats: 'L', age: 35, pa: 377, h: 93, double: 11, triple: 6, hr: 2, bb: 34, so: 23, hbp: 0, sb: 13, cs: 6, sec: 'LF', fld: 87, arm: 73 },
      { id: 'sosasa01', name: 'Sammy Sosa', pos: 'RF', bats: 'R', age: 30, pa: 712, h: 183, double: 24, triple: 2, hr: 59, bb: 71, so: 171, hbp: 2, sb: 13, cs: 9, sec: 'CF', fld: 84, arm: 66 },
      { id: 'reedje02', name: 'Jeff Reed', pos: 'DH', bats: 'L', age: 36, pa: 306, h: 71, double: 15, triple: 1, hr: 7, bb: 41, so: 58, hbp: 2, sb: 1, cs: 1, sec: 'C', fld: 71, arm: 63 },
    ],
    bench: [
      { id: 'gaettga01', name: 'Gary Gaetti', pos: '3B', bats: 'R', age: 40, pa: 308, h: 68, double: 15, triple: 1, hr: 10, bb: 23, so: 46, hbp: 4, sb: 1, cs: 1, sec: '1B', fld: 74 },
      { id: 'hillgl01', name: 'Glenallen Hill', pos: 'LF', bats: 'R', age: 34, pa: 278, h: 76, double: 14, triple: 1, hr: 15, bb: 19, so: 56, hbp: 1, sb: 3, cs: 1, sec: 'RF', fld: 48, arm: 72 },
      { id: 'blausje01', name: 'Jeff Blauser', pos: '2B', bats: 'R', age: 33, pa: 238, h: 50, double: 7, triple: 2, hr: 6, bb: 29, so: 48, hbp: 6, sb: 2, cs: 1, sec: 'SS' },
      { id: 'nievejo01', name: 'Jose Nieves', pos: 'SS', bats: 'R', age: 24, pa: 199, h: 45, double: 9, triple: 1, hr: 2, bb: 8, so: 25, hbp: 4, sb: 0, cs: 2, sec: '2B', fld: 61, rk: true },
      { id: 'alexama02', name: 'Manny Alexander', pos: 'SS', bats: 'R', age: 28, pa: 189, h: 44, double: 9, triple: 2, hr: 2, bb: 11, so: 40, hbp: 1, sb: 4, cs: 0, sec: '2B', fld: 83 },
    ],
    reserveBatters: [
      { id: 'goodwcu01', name: 'Curtis Goodwin', pos: 'CF', bats: 'L', age: 26, pa: 183, h: 39, double: 6, triple: 0, hr: 0, bb: 14, so: 38, hbp: 0, sb: 6, cs: 4, sec: 'LF', fld: 81, arm: 77 },
      { id: 'meyerch02', name: 'Chad Meyers', pos: '2B', bats: 'R', age: 23, pa: 156, h: 33, double: 9, triple: 0, hr: 0, bb: 9, so: 27, hbp: 3, sb: 4, cs: 2, sec: 'SS', fld: 52, rk: true },
      { id: 'brownro01', name: 'Roosevelt Brown', pos: 'LF', bats: 'L', age: 23, pa: 70, h: 14, double: 6, triple: 1, hr: 1, bb: 2, so: 14, hbp: 0, sb: 1, cs: 0, sec: 'RF', rk: true },
    ],
    pitchers: [
      { id: 'trachst01', name: 'Steve Trachsel', role: 'SP', throws: 'R', age: 28, g: 34, gs: 34, outs: 617, h: 218, hr: 30, bb: 71, so: 150, hbp: 5, er: 114, w: 8, l: 18, sv: 0, fld: 72 },
      { id: 'liebejo01', name: 'Jon Lieber', role: 'SP', throws: 'R', age: 29, g: 31, gs: 31, outs: 610, h: 221, hr: 27, bb: 48, so: 178, hbp: 2, er: 94, w: 10, l: 11, sv: 0, fld: 66 },
      { id: 'mulhote01', name: 'Terry Mulholland', role: 'SP', throws: 'L', age: 36, g: 42, gs: 24, outs: 511, h: 186, hr: 19, bb: 49, so: 92, hbp: 4, er: 77, w: 10, l: 8, sv: 1, fld: 69 },
      { id: 'tapanke01', name: 'Kevin Tapani', role: 'SP', throws: 'R', age: 35, g: 23, gs: 23, outs: 408, h: 149, hr: 15, bb: 36, so: 80, hbp: 4, er: 71, w: 6, l: 12, sv: 0, fld: 67 },
      { id: 'farnsky01', name: 'Kyle Farnsworth', role: 'SP', throws: 'R', age: 23, g: 27, gs: 21, outs: 390, h: 140, hr: 28, bb: 52, so: 70, hbp: 3, er: 73, w: 5, l: 9, sv: 0, fld: 76, rk: true },
      { id: 'aguilri01', name: 'Rick Aguilera', role: 'CL', throws: 'R', age: 37, g: 61, gs: 0, outs: 203, h: 59, hr: 8, bb: 14, so: 50, hbp: 2, er: 26, w: 9, l: 4, sv: 14, fld: 80 },
      { id: 'sandesc02', name: 'Scott Sanders', role: 'RP', throws: 'R', age: 30, g: 67, gs: 6, outs: 313, h: 117, hr: 19, bb: 47, so: 88, hbp: 1, er: 68, w: 4, l: 7, sv: 2, fld: 58 },
      { id: 'adamste01', name: 'Terry Adams', role: 'RP', throws: 'R', age: 26, g: 52, gs: 0, outs: 195, h: 63, hr: 7, bb: 31, so: 58, hbp: 0, er: 30, w: 6, l: 3, sv: 13, fld: 73 },
      { id: 'myersro01', name: 'Rodney Myers', role: 'RP', throws: 'R', age: 30, g: 46, gs: 0, outs: 191, h: 74, hr: 10, bb: 25, so: 42, hbp: 1, er: 34, w: 3, l: 1, sv: 0, fld: 65 },
      { id: 'serafda01', name: 'Dan Serafini', role: 'RP', throws: 'L', age: 25, g: 42, gs: 4, outs: 187, h: 84, hr: 8, bb: 29, so: 28, hbp: 1, er: 46, w: 3, l: 2, sv: 1, fld: 56 },
      { id: 'heredfe01', name: 'Felix Heredia', role: 'RP', throws: 'L', age: 24, g: 69, gs: 0, outs: 156, h: 53, hr: 4, bb: 28, so: 49, hbp: 2, er: 28, w: 3, l: 1, sv: 1, fld: 71 },
    ],
    reservePitchers: [
      { id: 'lorraan01', name: 'Andrew Lorraine', role: 'SP', throws: 'L', age: 26, g: 11, gs: 11, outs: 185, h: 72, hr: 8, bb: 24, so: 38, hbp: 0, er: 37, w: 2, l: 5, sv: 0, fld: 62 },
      { id: 'bowiemi01', name: 'Micah Bowie', role: 'SP', throws: 'L', age: 24, g: 14, gs: 11, outs: 153, h: 81, hr: 9, bb: 34, so: 41, hbp: 2, er: 58, w: 2, l: 7, sv: 0, fld: 80, rk: true },
      { id: 'beckro01', name: 'Rod Beck', role: 'RP', throws: 'R', age: 30, g: 43, gs: 0, outs: 132, h: 49, hr: 6, bb: 13, so: 37, hbp: 1, er: 21, w: 2, l: 5, sv: 10, fld: 58 },
      { id: 'karchma01', name: 'Matt Karchner', role: 'RP', throws: 'R', age: 32, g: 16, gs: 0, outs: 54, h: 17, hr: 2, bb: 9, so: 12, hbp: 2, er: 8, w: 1, l: 0, sv: 0, fld: 79 },
      { id: 'woodabr01', name: 'Brad Woodall', role: 'RP', throws: 'L', age: 30, g: 6, gs: 3, outs: 48, h: 17, hr: 3, bb: 6, so: 10, hbp: 1, er: 9, w: 0, l: 1, sv: 0, fld: 71 },
    ],
  },
  // CIN (CIN 1999)
  {
    franchiseId: 'CIN',
    season: 1999,
    batters: [
      { id: 'taubeed01', name: 'Ed Taubensee', pos: 'C', bats: 'L', age: 30, pa: 461, h: 123, double: 24, triple: 1, hr: 17, bb: 38, so: 79, hbp: 1, sb: 0, cs: 1, sec: '1B', fld: 72, arm: 56 },
      { id: 'caseyse01', name: 'Sean Casey', pos: '1B', bats: 'L', age: 24, pa: 669, h: 186, double: 41, triple: 3, hr: 22, bb: 66, so: 88, hbp: 8, sb: 0, cs: 2, sec: '3B', fld: 60 },
      { id: 'reesepo01', name: 'Pokey Reese', pos: '2B', bats: 'R', age: 26, pa: 636, h: 158, double: 31, triple: 5, hr: 9, bb: 39, so: 92, hbp: 6, sb: 35, cs: 8, sec: 'SS', fld: 79 },
      { id: 'booneaa01', name: 'Aaron Boone', pos: '3B', bats: 'R', age: 26, pa: 520, h: 131, double: 27, triple: 5, hr: 12, bb: 31, so: 81, hbp: 9, sb: 16, cs: 5, sec: '1B', fld: 74 },
      { id: 'larkiba01', name: 'Barry Larkin', pos: 'SS', bats: 'R', age: 35, pa: 687, h: 175, double: 33, triple: 7, hr: 14, bb: 93, so: 64, hbp: 2, sb: 30, cs: 6, fld: 60 },
      { id: 'vaughgr01', name: 'Greg Vaughn', pos: 'LF', bats: 'R', age: 33, pa: 643, h: 139, double: 22, triple: 2, hr: 44, bb: 82, so: 134, hbp: 4, sb: 13, cs: 3, sec: 'RF', fld: 70, arm: 71 },
      { id: 'camermi01', name: 'Mike Cameron', pos: 'CF', bats: 'R', age: 26, pa: 636, h: 134, double: 30, triple: 8, hr: 18, bb: 72, so: 146, hbp: 7, sb: 37, cs: 12, sec: 'RF', fld: 72, arm: 67 },
      { id: 'tuckemi01', name: 'Michael Tucker', pos: 'RF', bats: 'L', age: 28, pa: 340, h: 77, double: 14, triple: 4, hr: 10, bb: 34, so: 79, hbp: 3, sb: 8, cs: 3, sec: 'LF', fld: 86, arm: 78 },
      { id: 'youngdm01', name: 'Dmitri Young', pos: 'DH', bats: 'S', age: 25, pa: 409, h: 111, double: 29, triple: 2, hr: 11, bb: 33, so: 68, hbp: 2, sb: 3, cs: 2, sec: '1B', fld: 71, arm: 66 },
    ],
    bench: [
      { id: 'hammoje01', name: 'Jeffrey Hammonds', pos: 'RF', bats: 'R', age: 28, pa: 293, h: 71, double: 14, triple: 1, hr: 13, bb: 29, so: 57, hbp: 2, sb: 6, cs: 4, sec: 'LF', fld: 88, arm: 71 },
      { id: 'lewisma01', name: 'Mark Lewis', pos: '3B', bats: 'R', age: 29, pa: 184, h: 42, double: 9, triple: 1, hr: 4, bb: 12, so: 31, hbp: 1, sb: 1, cs: 1, sec: '2B', fld: 51 },
      { id: 'stynech01', name: 'Chris Stynes', pos: '2B', bats: 'R', age: 26, pa: 129, h: 31, double: 3, triple: 0, hr: 2, bb: 10, so: 12, hbp: 1, sb: 5, cs: 1, sec: '3B', fld: 40 },
      { id: 'johnsbr01', name: 'Brian Johnson', pos: 'C', bats: 'R', age: 31, pa: 127, h: 28, double: 4, triple: 0, hr: 5, bb: 9, so: 24, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 71 },
      { id: 'morriha02', name: 'Hal Morris', pos: '1B', bats: 'L', age: 34, pa: 112, h: 30, double: 7, triple: 0, hr: 0, bb: 8, so: 14, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
    ],
    reserveBatters: [
      { id: 'larueja01', name: 'Jason LaRue', pos: 'C', bats: 'R', age: 25, pa: 103, h: 19, double: 7, triple: 0, hr: 3, bb: 11, so: 32, hbp: 2, sb: 4, cs: 1, sec: '1B', fld: 70, arm: 80, rk: true },
    ],
    pitchers: [
      { id: 'harnipe01', name: 'Pete Harnisch', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 595, h: 183, hr: 24, bb: 61, so: 132, hbp: 5, er: 79, w: 16, l: 10, sv: 0, fld: 56 },
      { id: 'tomkobr01', name: 'Brett Tomko', role: 'SP', throws: 'R', age: 26, g: 33, gs: 26, outs: 516, h: 168, hr: 25, bb: 58, so: 134, hbp: 5, er: 88, w: 5, l: 7, sv: 0, fld: 66 },
      { id: 'villoro01', name: 'Ron Villone', role: 'SP', throws: 'L', age: 29, g: 29, gs: 22, outs: 428, h: 119, hr: 9, bb: 78, so: 94, hbp: 5, er: 67, w: 9, l: 7, sv: 2, fld: 69 },
      { id: 'parrist01', name: 'Steve Parris', role: 'SP', throws: 'R', age: 31, g: 22, gs: 21, outs: 386, h: 123, hr: 15, bb: 49, so: 92, hbp: 6, er: 52, w: 11, l: 4, sv: 0, fld: 76 },
      { id: 'neaglde01', name: 'Denny Neagle', role: 'SP', throws: 'L', age: 30, g: 20, gs: 19, outs: 335, h: 100, hr: 16, bb: 33, so: 83, hbp: 3, er: 46, w: 9, l: 5, sv: 0, fld: 75 },
      { id: 'graveda01', name: 'Danny Graves', role: 'CL', throws: 'R', age: 25, g: 75, gs: 0, outs: 333, h: 97, hr: 9, bb: 47, so: 64, hbp: 2, er: 40, w: 8, l: 7, sv: 27, fld: 75 },
      { id: 'sullisc01', name: 'Scott Sullivan', role: 'RP', throws: 'R', age: 28, g: 79, gs: 0, outs: 341, h: 95, hr: 12, bb: 43, so: 88, hbp: 9, er: 47, w: 5, l: 4, sv: 3, fld: 80 },
      { id: 'willisc01', name: 'Scott Williamson', role: 'RP', throws: 'R', age: 23, g: 62, gs: 0, outs: 280, h: 54, hr: 8, bb: 43, so: 107, hbp: 1, er: 25, w: 12, l: 7, sv: 19, fld: 61, rk: true },
      { id: 'reyesde01', name: 'Dennys Reyes', role: 'RP', throws: 'L', age: 22, g: 65, gs: 1, outs: 185, h: 56, hr: 4, bb: 38, so: 68, hbp: 2, er: 28, w: 2, l: 2, sv: 2, fld: 73 },
      { id: 'whitega01', name: 'Gabe White', role: 'RP', throws: 'L', age: 27, g: 50, gs: 0, outs: 183, h: 62, hr: 12, bb: 15, so: 56, hbp: 1, er: 30, w: 1, l: 2, sv: 0, fld: 83 },
      { id: 'belinst01', name: 'Stan Belinda', role: 'RP', throws: 'R', age: 32, g: 29, gs: 0, outs: 128, h: 38, hr: 7, bb: 18, so: 44, hbp: 2, er: 20, w: 3, l: 1, sv: 2, fld: 87 },
    ],
    reservePitchers: [
      { id: 'averyst01', name: 'Steve Avery', role: 'SP', throws: 'L', age: 29, g: 19, gs: 19, outs: 288, h: 92, hr: 11, bb: 62, so: 48, hbp: 2, er: 56, w: 6, l: 7, sv: 0, fld: 67 },
      { id: 'bereja01', name: 'Jason Bere', role: 'SP', throws: 'R', age: 28, g: 17, gs: 14, outs: 200, h: 76, hr: 9, bb: 46, so: 47, hbp: 2, er: 44, w: 5, l: 0, sv: 0, fld: 72 },
    ],
  },
  // MIL (MIL 1999)
  {
    franchiseId: 'MIL',
    season: 1999,
    batters: [
      { id: 'nilssda01', name: 'Dave Nilsson', pos: 'C', bats: 'L', age: 29, pa: 404, h: 102, double: 19, triple: 1, hr: 17, bb: 46, so: 60, hbp: 2, sb: 1, cs: 2, sec: '1B', fld: 76, arm: 60 },
      { id: 'berryse01', name: 'Sean Berry', pos: '1B', bats: 'R', age: 33, pa: 281, h: 67, double: 14, triple: 1, hr: 6, bb: 21, so: 46, hbp: 4, sb: 1, cs: 1, sec: '3B', fld: 60 },
      { id: 'belliro01', name: 'Ronnie Belliard', pos: '2B', bats: 'R', age: 24, pa: 531, h: 135, double: 29, triple: 4, hr: 8, bb: 64, so: 59, hbp: 0, sb: 4, cs: 5, sec: 'SS', fld: 70, rk: true },
      { id: 'cirilje01', name: 'Jeff Cirillo', pos: '3B', bats: 'R', age: 29, pa: 697, h: 193, double: 36, triple: 1, hr: 14, bb: 75, so: 84, hbp: 6, sb: 8, cs: 4, sec: '2B', fld: 85 },
      { id: 'loretma01', name: 'Mark Loretta', pos: 'SS', bats: 'R', age: 27, pa: 664, h: 174, double: 34, triple: 4, hr: 6, bb: 55, so: 64, hbp: 9, sb: 7, cs: 4, sec: '2B', fld: 71 },
      { id: 'jenkige01', name: 'Geoff Jenkins', pos: 'LF', bats: 'L', age: 24, pa: 493, h: 130, double: 37, triple: 3, hr: 19, bb: 35, so: 92, hbp: 6, sb: 4, cs: 2, sec: 'RF', fld: 80, arm: 87 },
      { id: 'grissma02', name: 'Marquis Grissom', pos: 'CF', bats: 'R', age: 32, pa: 661, h: 163, double: 29, triple: 2, hr: 16, bb: 42, so: 101, hbp: 2, sb: 21, cs: 8, sec: 'RF', fld: 72, arm: 56 },
      { id: 'burnije01', name: 'Jeromy Burnitz', pos: 'RF', bats: 'L', age: 30, pa: 580, h: 131, double: 30, triple: 3, hr: 32, bb: 77, so: 125, hbp: 10, sb: 9, cs: 5, sec: 'CF', fld: 70, arm: 69 },
      { id: 'ochoaal01', name: 'Alex Ochoa', pos: 'DH', bats: 'R', age: 27, pa: 329, h: 81, double: 17, triple: 3, hr: 6, bb: 32, so: 43, hbp: 4, sb: 6, cs: 4, sec: 'RF', fld: 68, arm: 74 },
    ],
    bench: [
      { id: 'beckeri01', name: 'Rich Becker', pos: 'CF', bats: 'L', age: 27, pa: 327, h: 66, double: 9, triple: 2, hr: 7, bb: 52, so: 85, hbp: 2, sb: 8, cs: 2, sec: 'RF', fld: 56, arm: 83 },
      { id: 'valenjo03', name: 'Jose Valentin', pos: 'SS', bats: 'S', age: 29, pa: 313, h: 62, double: 12, triple: 2, hr: 10, bb: 39, so: 60, hbp: 2, sb: 6, cs: 4, sec: '2B', fld: 59 },
      { id: 'banksbr01', name: 'Brian Banks', pos: '1B', bats: 'S', age: 28, pa: 249, h: 53, double: 7, triple: 1, hr: 5, bb: 25, so: 59, hbp: 0, sb: 5, cs: 1, sec: 'LF', fld: 75, rk: true },
      { id: 'vinafe01', name: 'Fernando Vina', pos: '2B', bats: 'L', age: 30, pa: 177, h: 46, double: 8, triple: 1, hr: 2, bb: 12, so: 10, hbp: 5, sb: 5, cs: 3, sec: 'SS', fld: 78 },
      { id: 'collilo01', name: 'Lou Collier', pos: 'SS', bats: 'R', age: 25, pa: 152, h: 33, double: 6, triple: 1, hr: 1, bb: 13, so: 30, hbp: 1, sb: 2, cs: 1, sec: '2B', fld: 40 },
    ],
    reserveBatters: [
      { id: 'barkeke01', name: 'Kevin Barker', pos: '1B', bats: 'L', age: 23, pa: 127, h: 33, double: 3, triple: 0, hr: 3, bb: 9, so: 19, hbp: 0, sb: 1, cs: 0, sec: '3B', fld: 75, rk: true },
      { id: 'hughebo01', name: 'Bobby Hughes', pos: 'C', bats: 'R', age: 28, pa: 106, h: 24, double: 3, triple: 1, hr: 4, bb: 6, so: 26, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 55, arm: 69 },
      { id: 'greench02', name: 'Charlie Greene', pos: 'C', bats: 'R', age: 28, pa: 49, h: 8, double: 1, triple: 0, hr: 0, bb: 4, so: 13, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 72, arm: 59, rk: true },
      { id: 'cancero01', name: 'Robinson Cancel', pos: 'C', bats: 'R', age: 23, pa: 48, h: 8, double: 2, triple: 0, hr: 0, bb: 2, so: 12, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'karlsc01', name: 'Scott Karl', role: 'SP', throws: 'L', age: 27, g: 33, gs: 33, outs: 593, h: 238, hr: 22, bb: 70, so: 93, hbp: 6, er: 103, w: 11, l: 11, sv: 0, fld: 79 },
      { id: 'woodast01', name: 'Steve Woodard', role: 'SP', throws: 'R', age: 24, g: 31, gs: 29, outs: 555, h: 210, hr: 23, bb: 37, so: 134, hbp: 8, er: 92, w: 11, l: 8, sv: 0, fld: 73 },
      { id: 'nomohi01', name: 'Hideo Nomo', role: 'SP', throws: 'R', age: 30, g: 28, gs: 28, outs: 529, h: 163, hr: 24, bb: 86, so: 176, hbp: 4, er: 90, w: 12, l: 8, sv: 0, fld: 64 },
      { id: 'pulsibi01', name: 'Bill Pulsipher', role: 'SP', throws: 'L', age: 25, g: 19, gs: 16, outs: 262, h: 101, hr: 16, bb: 36, so: 49, hbp: 2, er: 55, w: 5, l: 6, sv: 0, fld: 58 },
      { id: 'abbotji01', name: 'Jim Abbott', role: 'SP', throws: 'L', age: 31, g: 20, gs: 15, outs: 246, h: 108, hr: 12, bb: 40, so: 37, hbp: 2, er: 59, w: 2, l: 8, sv: 0, fld: 71 },
      { id: 'wickmbo01', name: 'Bob Wickman', role: 'CL', throws: 'R', age: 30, g: 71, gs: 0, outs: 223, h: 73, hr: 6, bb: 36, so: 62, hbp: 3, er: 28, w: 3, l: 8, sv: 37, fld: 79 },
      { id: 'weathda01', name: 'David Weathers', role: 'RP', throws: 'R', age: 29, g: 63, gs: 0, outs: 279, h: 106, hr: 10, bb: 37, so: 75, hbp: 2, er: 50, w: 7, l: 4, sv: 2, fld: 84 },
      { id: 'roquera01', name: 'Rafael Roque', role: 'RP', throws: 'L', age: 27, g: 43, gs: 9, outs: 253, h: 91, hr: 16, bb: 43, so: 65, hbp: 3, er: 50, w: 1, l: 6, sv: 1, fld: 57, rk: true },
      { id: 'plunker01', name: 'Eric Plunk', role: 'RP', throws: 'R', age: 35, g: 68, gs: 0, outs: 226, h: 74, hr: 13, bb: 39, so: 70, hbp: 5, er: 40, w: 4, l: 4, sv: 0, fld: 58 },
      { id: 'reyesal01', name: 'Alberto Reyes', role: 'RP', throws: 'R', age: 29, g: 53, gs: 0, outs: 197, h: 56, hr: 9, bb: 37, so: 66, hbp: 5, er: 32, w: 4, l: 3, sv: 0, fld: 60 },
      { id: 'coppiro01', name: 'Rocky Coppinger', role: 'RP', throws: 'R', age: 25, g: 40, gs: 2, outs: 175, h: 60, hr: 12, bb: 40, so: 56, hbp: 0, er: 35, w: 5, l: 4, sv: 0, fld: 77 },
    ],
    reservePitchers: [
      { id: 'eldreca01', name: 'Cal Eldred', role: 'SP', throws: 'R', age: 31, g: 20, gs: 15, outs: 246, h: 97, hr: 14, bb: 41, so: 56, hbp: 2, er: 55, w: 2, l: 8, sv: 0, fld: 74 },
      { id: 'peterky01', name: 'Kyle Peterson', role: 'SP', throws: 'R', age: 23, g: 17, gs: 12, outs: 231, h: 87, hr: 3, bb: 25, so: 34, hbp: 4, er: 39, w: 4, l: 7, sv: 0, fld: 76, rk: true },
      { id: 'myersmi01', name: 'Mike Myers', role: 'RP', throws: 'L', age: 30, g: 71, gs: 0, outs: 124, h: 42, hr: 6, bb: 16, so: 35, hbp: 3, er: 20, w: 2, l: 1, sv: 0, fld: 63 },
      { id: 'ramirhe01', name: 'Hector Ramirez', role: 'RP', throws: 'R', age: 27, g: 15, gs: 0, outs: 63, h: 19, hr: 1, bb: 11, so: 9, hbp: 0, er: 8, w: 1, l: 2, sv: 0, fld: 74, rk: true },
      { id: 'faltest01', name: 'Steve Falteisek', role: 'RP', throws: 'R', age: 27, g: 10, gs: 0, outs: 36, h: 17, hr: 2, bb: 3, so: 5, hbp: 0, er: 9, w: 0, l: 0, sv: 0, fld: 90, rk: true },
    ],
  },
  // PIT (PIT 1999)
  {
    franchiseId: 'PIT',
    season: 1999,
    batters: [
      { id: 'kendaja01', name: 'Jason Kendall', pos: 'C', bats: 'R', age: 25, pa: 334, h: 91, double: 20, triple: 2, hr: 7, bb: 31, so: 30, hbp: 15, sb: 16, cs: 3, sec: '1B', fld: 67, arm: 80 },
      { id: 'youngke01', name: 'Kevin Young', pos: '1B', bats: 'R', age: 30, pa: 675, h: 172, double: 40, triple: 5, hr: 27, bb: 60, so: 130, hbp: 11, sb: 20, cs: 8, sec: '3B', fld: 60 },
      { id: 'morriwa02', name: 'Warren Morris', pos: '2B', bats: 'L', age: 25, pa: 581, h: 147, double: 20, triple: 3, hr: 15, bb: 59, so: 88, hbp: 2, sb: 3, cs: 7, sec: 'SS', fld: 66, rk: true },
      { id: 'spraged02', name: 'Ed Sprague', pos: '3B', bats: 'R', age: 31, pa: 564, h: 123, double: 28, triple: 2, hr: 21, bb: 44, so: 97, hbp: 14, sb: 2, cs: 4, sec: '1B', fld: 62 },
      { id: 'benjami01', name: 'Mike Benjamin', pos: 'SS', bats: 'R', age: 33, pa: 404, h: 94, double: 26, triple: 4, hr: 2, bb: 18, so: 85, hbp: 4, sb: 7, cs: 1, sec: '2B', fld: 97 },
      { id: 'martial03', name: 'Al Martin', pos: 'LF', bats: 'L', age: 31, pa: 593, h: 144, double: 30, triple: 6, hr: 20, bb: 47, so: 115, hbp: 3, sb: 23, cs: 4, sec: 'CF', fld: 43, arm: 62 },
      { id: 'gilesbr02', name: 'Brian Giles', pos: 'CF', bats: 'L', age: 28, pa: 627, h: 153, double: 30, triple: 2, hr: 33, bb: 97, so: 86, hbp: 3, sb: 10, cs: 4, sec: 'LF', fld: 61, arm: 69 },
      { id: 'brownad01', name: 'Adrian Brown', pos: 'RF', bats: 'S', age: 25, pa: 267, h: 61, double: 6, triple: 2, hr: 3, bb: 27, so: 35, hbp: 1, sb: 6, cs: 3, sec: 'CF', fld: 57, arm: 66 },
      { id: 'brownbr01', name: 'Brant Brown', pos: 'DH', bats: 'L', age: 28, pa: 371, h: 86, double: 19, triple: 4, hr: 15, bb: 24, so: 103, hbp: 3, sb: 3, cs: 4, sec: 'LF', fld: 77, arm: 68 },
    ],
    bench: [
      { id: 'nunezab01', name: 'Abraham Nunez', pos: 'SS', bats: 'S', age: 23, pa: 301, h: 56, double: 8, triple: 1, hr: 1, bb: 31, so: 56, hbp: 1, sb: 10, cs: 2, sec: '2B', fld: 70, rk: true },
      { id: 'osikke01', name: 'Keith Osik', pos: 'C', bats: 'R', age: 30, pa: 181, h: 33, double: 5, triple: 1, hr: 1, bb: 14, so: 29, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 80, arm: 69 },
      { id: 'olivejo01', name: 'Joe Oliver', pos: 'C', bats: 'R', age: 33, pa: 146, h: 30, double: 6, triple: 0, hr: 3, bb: 10, so: 27, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 77, arm: 58 },
      { id: 'garcifr01', name: 'Freddy Garcia', pos: 'LF', bats: 'R', age: 26, pa: 138, h: 31, double: 6, triple: 0, hr: 7, bb: 9, so: 38, hbp: 1, sb: 0, cs: 1, sec: 'RF', fld: 74, arm: 56 },
      { id: 'wardtu01', name: 'Turner Ward', pos: 'CF', bats: 'S', age: 34, pa: 135, h: 31, double: 6, triple: 1, hr: 3, bb: 13, so: 15, hbp: 1, sb: 2, cs: 2, sec: 'RF', fld: 44, arm: 64 },
    ],
    reserveBatters: [
      { id: 'mearepa01', name: 'Pat Meares', pos: 'SS', bats: 'R', age: 30, pa: 104, h: 26, double: 5, triple: 0, hr: 1, bb: 5, so: 17, hbp: 2, sb: 1, cs: 1, sec: '2B', fld: 59 },
      { id: 'sveumda01', name: 'Dale Sveum', pos: '3B', bats: 'S', age: 35, pa: 80, h: 16, double: 4, triple: 0, hr: 2, bb: 6, so: 22, hbp: 0, sb: 0, cs: 0, sec: 'SS' },
      { id: 'wehnejo01', name: 'John Wehner', pos: 'LF', bats: 'R', age: 32, pa: 75, h: 14, double: 2, triple: 0, hr: 0, bb: 6, so: 11, hbp: 0, sb: 1, cs: 0, sec: 'RF' },
      { id: 'hermach01', name: 'Chad Hermansen', pos: 'CF', bats: 'R', age: 21, pa: 69, h: 14, double: 3, triple: 0, hr: 1, bb: 7, so: 19, hbp: 1, sb: 2, cs: 2, sec: 'LF', fld: 45, arm: 54, rk: true },
      { id: 'ramirar01', name: 'Aramis Ramirez', pos: '3B', bats: 'R', age: 21, pa: 64, h: 13, double: 2, triple: 0, hr: 1, bb: 5, so: 15, hbp: 1, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'schmija01', name: 'Jason Schmidt', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 638, h: 222, hr: 23, bb: 80, so: 152, hbp: 4, er: 100, w: 13, l: 11, sv: 0, fld: 58 },
      { id: 'bensokr01', name: 'Kris Benson', role: 'SP', throws: 'R', age: 24, g: 31, gs: 31, outs: 590, h: 184, hr: 16, bb: 83, so: 139, hbp: 6, er: 89, w: 11, l: 14, sv: 0, fld: 73, rk: true },
      { id: 'ritchto01', name: 'Todd Ritchie', role: 'SP', throws: 'R', age: 27, g: 28, gs: 26, outs: 518, h: 174, hr: 17, bb: 55, so: 108, hbp: 4, er: 72, w: 15, l: 9, sv: 0, fld: 74 },
      { id: 'cordofr01', name: 'Francisco Cordova', role: 'SP', throws: 'R', age: 27, g: 27, gs: 27, outs: 482, h: 161, hr: 16, bb: 54, so: 109, hbp: 4, er: 70, w: 8, l: 10, sv: 0, fld: 78 },
      { id: 'schoupe01', name: 'Pete Schourek', role: 'SP', throws: 'L', age: 30, g: 30, gs: 17, outs: 339, h: 123, hr: 19, bb: 49, so: 91, hbp: 5, er: 64, w: 4, l: 7, sv: 0, fld: 60 },
      { id: 'willimi03', name: 'Mike Williams', role: 'CL', throws: 'R', age: 30, g: 58, gs: 0, outs: 175, h: 60, hr: 6, bb: 32, so: 75, hbp: 1, er: 27, w: 3, l: 4, sv: 23, fld: 68 },
      { id: 'sauersc01', name: 'Scott Sauerbeck', role: 'RP', throws: 'L', age: 27, g: 65, gs: 0, outs: 203, h: 53, hr: 6, bb: 38, so: 55, hbp: 4, er: 15, w: 4, l: 1, sv: 2, fld: 64, rk: true },
      { id: 'wilkima01', name: 'Marc Wilkins', role: 'RP', throws: 'R', age: 28, g: 46, gs: 0, outs: 153, h: 47, hr: 4, bb: 26, so: 42, hbp: 4, er: 23, w: 2, l: 3, sv: 0, fld: 68 },
      { id: 'clontbr01', name: 'Brad Clontz', role: 'RP', throws: 'R', age: 28, g: 56, gs: 0, outs: 148, h: 48, hr: 6, bb: 23, so: 40, hbp: 3, er: 20, w: 1, l: 3, sv: 2, fld: 71 },
      { id: 'hansegr01', name: 'Greg Hansell', role: 'RP', throws: 'R', age: 28, g: 33, gs: 0, outs: 118, h: 42, hr: 5, bb: 11, so: 34, hbp: 3, er: 18, w: 1, l: 3, sv: 0, fld: 67 },
      { id: 'wallaje01', name: 'Jeff Wallace', role: 'RP', throws: 'L', age: 23, g: 41, gs: 0, outs: 117, h: 26, hr: 2, bb: 37, so: 42, hbp: 0, er: 15, w: 1, l: 0, sv: 0, fld: 56, rk: true },
    ],
    reservePitchers: [
      { id: 'silvajo01', name: 'Jose Silva', role: 'SP', throws: 'R', age: 25, g: 34, gs: 12, outs: 292, h: 109, hr: 9, bb: 36, so: 72, hbp: 2, er: 57, w: 2, l: 8, sv: 4, fld: 61 },
      { id: 'peterch01', name: 'Chris Peters', role: 'SP', throws: 'L', age: 27, g: 19, gs: 11, outs: 213, h: 85, hr: 11, bb: 29, so: 50, hbp: 3, er: 40, w: 5, l: 4, sv: 0, fld: 65 },
      { id: 'chrisja01', name: 'Jason Christiansen', role: 'RP', throws: 'L', age: 29, g: 39, gs: 0, outs: 113, h: 30, hr: 2, bb: 19, so: 39, hbp: 1, er: 13, w: 2, l: 3, sv: 3, fld: 61 },
      { id: 'anderji02', name: 'Jimmy Anderson', role: 'RP', throws: 'L', age: 23, g: 13, gs: 4, outs: 88, h: 25, hr: 2, bb: 16, so: 13, hbp: 1, er: 13, w: 2, l: 1, sv: 0, fld: 58, rk: true },
      { id: 'loiseri01', name: 'Rich Loiselle', role: 'RP', throws: 'R', age: 27, g: 13, gs: 0, outs: 46, h: 16, hr: 1, bb: 9, so: 14, hbp: 1, er: 6, w: 3, l: 2, sv: 0, fld: 66 },
    ],
  },
  // STL (SLN 1999)
  {
    franchiseId: 'STL',
    season: 1999,
    batters: [
      { id: 'marreel01', name: 'Eli Marrero', pos: 'C', bats: 'R', age: 25, pa: 343, h: 66, double: 16, triple: 1, hr: 6, bb: 23, so: 55, hbp: 1, sb: 10, cs: 2, sec: '1B', fld: 73, arm: 78 },
      { id: 'mcgwima01', name: 'Mark McGwire', pos: '1B', bats: 'R', age: 35, pa: 661, h: 147, double: 22, triple: 0, hr: 65, bb: 136, so: 147, hbp: 4, sb: 1, cs: 0, sec: '3B', fld: 63 },
      { id: 'mcewijo01', name: 'Joe McEwing', pos: '2B', bats: 'R', age: 26, pa: 574, h: 140, double: 28, triple: 4, hr: 9, bb: 41, so: 87, hbp: 6, sb: 7, cs: 5, sec: 'SS', fld: 76, rk: true },
      { id: 'tatisfe01', name: 'Fernando Tatis', pos: '3B', bats: 'R', age: 24, pa: 639, h: 160, double: 32, triple: 3, hr: 25, bb: 64, so: 129, hbp: 12, sb: 18, cs: 7, sec: '1B', fld: 71 },
      { id: 'renteed01', name: 'Edgar Renteria', pos: 'SS', bats: 'R', age: 22, pa: 653, h: 162, double: 28, triple: 2, hr: 7, bb: 51, so: 87, hbp: 3, sb: 39, cs: 14, sec: '2B', fld: 64 },
      { id: 'lankfra01', name: 'Ray Lankford', pos: 'LF', bats: 'L', age: 32, pa: 476, h: 123, double: 30, triple: 1, hr: 20, bb: 61, so: 111, hbp: 2, sb: 17, cs: 5, sec: 'CF', fld: 78, arm: 71 },
      { id: 'drewjd01', name: 'J. D. Drew', pos: 'CF', bats: 'L', age: 23, pa: 430, h: 93, double: 17, triple: 6, hr: 15, bb: 50, so: 79, hbp: 6, sb: 18, cs: 3, sec: 'LF', fld: 70, arm: 79, rk: true },
      { id: 'daviser01', name: 'Eric Davis', pos: 'RF', bats: 'R', age: 37, pa: 223, h: 59, double: 12, triple: 1, hr: 9, bb: 23, so: 49, hbp: 2, sb: 4, cs: 3, sec: 'CF', fld: 73, arm: 73 },
      { id: 'dunstsh01', name: 'Shawon Dunston', pos: 'DH', bats: 'R', age: 36, pa: 255, h: 70, double: 12, triple: 3, hr: 6, bb: 4, so: 37, hbp: 4, sb: 12, cs: 4, sec: 'LF', fld: 66, arm: 69 },
    ],
    bench: [
      { id: 'braggda01', name: 'Darren Bragg', pos: 'CF', bats: 'L', age: 29, pa: 325, h: 75, double: 17, triple: 1, hr: 6, bb: 36, so: 65, hbp: 3, sb: 4, cs: 2, sec: 'RF', fld: 59, arm: 79 },
      { id: 'castial01', name: 'Alberto Castillo', pos: 'C', bats: 'R', age: 29, pa: 290, h: 63, double: 8, triple: 0, hr: 4, bb: 25, so: 49, hbp: 2, sb: 0, cs: 1, sec: '1B', fld: 71, arm: 86 },
      { id: 'mcgeewi01', name: 'Willie McGee', pos: 'RF', bats: 'S', age: 40, pa: 290, h: 71, double: 10, triple: 1, hr: 1, bb: 17, so: 55, hbp: 0, sb: 7, cs: 3, sec: 'CF', fld: 59, arm: 63 },
      { id: 'polanpl01', name: 'Placido Polanco', pos: '2B', bats: 'R', age: 23, pa: 240, h: 60, double: 8, triple: 3, hr: 1, bb: 14, so: 22, hbp: 0, sb: 2, cs: 2, sec: 'SS', fld: 77, rk: true },
      { id: 'howarth01', name: 'Thomas Howard', pos: 'RF', bats: 'S', age: 34, pa: 215, h: 52, double: 11, triple: 0, hr: 5, bb: 16, so: 31, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 68, arm: 55 },
    ],
    reserveBatters: [
      { id: 'paquecr01', name: 'Craig Paquette', pos: 'RF', bats: 'R', age: 30, pa: 166, h: 42, double: 8, triple: 0, hr: 8, bb: 6, so: 38, hbp: 0, sb: 1, cs: 0, sec: 'LF', fld: 49, arm: 55 },
      { id: 'kennead01', name: 'Adam Kennedy', pos: '2B', bats: 'L', age: 23, pa: 110, h: 26, double: 10, triple: 1, hr: 1, bb: 3, so: 8, hbp: 2, sb: 0, cs: 1, sec: 'SS', fld: 69, rk: true },
      { id: 'howarda02', name: 'David Howard', pos: 'SS', bats: 'S', age: 32, pa: 92, h: 19, double: 3, triple: 0, hr: 1, bb: 7, so: 21, hbp: 1, sb: 0, cs: 1, sec: '2B' },
      { id: 'jensema01', name: 'Marcus Jensen', pos: 'C', bats: 'S', age: 26, pa: 42, h: 7, double: 3, triple: 0, hr: 1, bb: 5, so: 13, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
    ],
    pitchers: [
      { id: 'oliveda02', name: 'Darren Oliver', role: 'SP', throws: 'L', age: 28, g: 30, gs: 30, outs: 589, h: 209, hr: 20, bb: 75, so: 110, hbp: 11, er: 100, w: 9, l: 9, sv: 0, fld: 71 },
      { id: 'botteke01', name: 'Kent Bottenfield', role: 'SP', throws: 'R', age: 30, g: 31, gs: 31, outs: 571, h: 194, hr: 21, bb: 87, so: 134, hbp: 5, er: 88, w: 18, l: 7, sv: 0, fld: 76 },
      { id: 'jimenjo01', name: 'Jose Jimenez', role: 'SP', throws: 'R', age: 25, g: 29, gs: 28, outs: 489, h: 173, hr: 15, bb: 70, so: 112, hbp: 10, er: 102, w: 5, l: 14, sv: 0, fld: 78, rk: true },
      { id: 'merckke01', name: 'Kent Mercker', role: 'SP', throws: 'L', age: 31, g: 30, gs: 23, outs: 388, h: 150, hr: 13, bb: 55, so: 71, hbp: 3, er: 69, w: 8, l: 5, sv: 0, fld: 65 },
      { id: 'aceveju01', name: 'Juan Acevedo', role: 'SP', throws: 'R', age: 29, g: 50, gs: 12, outs: 307, h: 108, hr: 14, bb: 43, so: 58, hbp: 5, er: 53, w: 6, l: 8, sv: 4, fld: 58 },
      { id: 'bottari01', name: 'Ricky Bottalico', role: 'CL', throws: 'R', age: 29, g: 68, gs: 0, outs: 220, h: 83, hr: 9, bb: 47, so: 67, hbp: 3, er: 41, w: 3, l: 7, sv: 20, fld: 79 },
      { id: 'aybarma01', name: 'Manny Aybar', role: 'RP', throws: 'R', age: 27, g: 65, gs: 1, outs: 291, h: 103, hr: 11, bb: 41, so: 69, hbp: 4, er: 58, w: 4, l: 5, sv: 3, fld: 52 },
      { id: 'crousri01', name: 'Rich Croushore', role: 'RP', throws: 'R', age: 28, g: 59, gs: 0, outs: 215, h: 65, hr: 9, bb: 42, so: 80, hbp: 4, er: 36, w: 3, l: 7, sv: 3, fld: 68 },
      { id: 'paintla01', name: 'Lance Painter', role: 'RP', throws: 'L', age: 31, g: 56, gs: 4, outs: 190, h: 60, hr: 6, bb: 29, so: 54, hbp: 3, er: 32, w: 4, l: 5, sv: 1, fld: 56 },
      { id: 'slocuhe01', name: 'Heathcliff Slocumb', role: 'RP', throws: 'R', age: 33, g: 50, gs: 0, outs: 186, h: 65, hr: 5, bb: 39, so: 54, hbp: 2, er: 31, w: 3, l: 2, sv: 2, fld: 59 },
      { id: 'mohlemi01', name: 'Mike Mohler', role: 'RP', throws: 'L', age: 30, g: 48, gs: 0, outs: 148, h: 51, hr: 4, bb: 22, so: 31, hbp: 2, er: 26, w: 1, l: 1, sv: 1, fld: 75 },
    ],
    reservePitchers: [
      { id: 'stephga01', name: 'Garrett Stephenson', role: 'SP', throws: 'R', age: 27, g: 18, gs: 12, outs: 256, h: 88, hr: 10, bb: 33, so: 59, hbp: 4, er: 42, w: 6, l: 3, sv: 0, fld: 81 },
      { id: 'luebbla01', name: 'Larry Luebbers', role: 'RP', throws: 'R', age: 29, g: 8, gs: 8, outs: 137, h: 46, hr: 8, bb: 16, so: 16, hbp: 3, er: 26, w: 3, l: 3, sv: 0, fld: 65 },
      { id: 'ankieri01', name: 'Rick Ankiel', role: 'RP', throws: 'L', age: 19, g: 9, gs: 5, outs: 99, h: 26, hr: 2, bb: 14, so: 39, hbp: 1, er: 12, w: 0, l: 1, sv: 1, fld: 71, rk: true },
      { id: 'osbordo01', name: 'Donovan Osborne', role: 'RP', throws: 'L', age: 30, g: 6, gs: 6, outs: 88, h: 32, hr: 4, bb: 9, so: 21, hbp: 1, er: 16, w: 1, l: 3, sv: 0, fld: 65 },
      { id: 'thompma01', name: 'Mark Thompson', role: 'RP', throws: 'R', age: 28, g: 5, gs: 5, outs: 88, h: 32, hr: 5, bb: 15, so: 17, hbp: 3, er: 16, w: 1, l: 3, sv: 0, fld: 60 },
    ],
  },
  // ARI (ARI 1999)
  {
    franchiseId: 'ARI',
    season: 1999,
    batters: [
      { id: 'milleda02', name: 'Damian Miller', pos: 'C', bats: 'R', age: 29, pa: 320, h: 81, double: 20, triple: 1, hr: 9, bb: 19, so: 76, hbp: 2, sb: 0, cs: 0, sec: '1B', fld: 64, arm: 72 },
      { id: 'leetr01', name: 'Travis Lee', pos: '1B', bats: 'L', age: 24, pa: 436, h: 97, double: 15, triple: 2, hr: 12, bb: 52, so: 67, hbp: 0, sb: 11, cs: 2, sec: '3B', fld: 74 },
      { id: 'bellja01', name: 'Jay Bell', pos: '2B', bats: 'R', age: 33, pa: 688, h: 163, double: 31, triple: 5, hr: 30, bb: 82, so: 129, hbp: 5, sb: 6, cs: 5, sec: 'SS', fld: 54 },
      { id: 'willima04', name: 'Matt Williams', pos: '3B', bats: 'R', age: 33, pa: 678, h: 179, double: 35, triple: 2, hr: 32, bb: 44, so: 106, hbp: 3, sb: 5, cs: 1, sec: 'SS', fld: 81 },
      { id: 'foxan01', name: 'Andy Fox', pos: 'SS', bats: 'L', age: 28, pa: 320, h: 74, double: 12, triple: 3, hr: 5, bb: 29, so: 58, hbp: 9, sb: 6, cs: 3, sec: '2B', fld: 53 },
      { id: 'gonzalu01', name: 'Luis Gonzalez', pos: 'LF', bats: 'L', age: 31, pa: 693, h: 185, double: 41, triple: 4, hr: 24, bb: 67, so: 67, hbp: 7, sb: 11, cs: 6, sec: 'RF', fld: 64, arm: 73 },
      { id: 'finlest01', name: 'Steve Finley', pos: 'CF', bats: 'L', age: 34, pa: 663, h: 155, double: 34, triple: 8, hr: 27, bb: 54, so: 97, hbp: 3, sb: 11, cs: 4, sec: 'RF', fld: 78, arm: 63 },
      { id: 'womacto01', name: 'Tony Womack', pos: 'RF', bats: 'L', age: 29, pa: 684, h: 174, double: 25, triple: 9, hr: 4, bb: 45, so: 83, hbp: 1, sb: 65, cs: 10, sec: 'CF', fld: 79, arm: 72 },
      { id: 'colbrgr01', name: 'Greg Colbrunn', pos: 'DH', bats: 'R', age: 29, pa: 153, h: 43, double: 7, triple: 2, hr: 4, bb: 9, so: 26, hbp: 3, sb: 2, cs: 2, sec: '1B', fld: 76 },
    ],
    bench: [
      { id: 'stinnke01', name: 'Kelly Stinnett', pos: 'C', bats: 'R', age: 29, pa: 317, h: 68, double: 14, triple: 0, hr: 12, bb: 28, so: 79, hbp: 5, sb: 1, cs: 1, sec: '1B', fld: 71, arm: 68 },
      { id: 'gilkebe01', name: 'Bernard Gilkey', pos: 'RF', bats: 'R', age: 32, pa: 241, h: 53, double: 12, triple: 0, hr: 6, bb: 27, so: 44, hbp: 2, sb: 3, cs: 3, sec: 'LF', fld: 64, arm: 70 },
      { id: 'durazer01', name: 'Erubiel Durazo', pos: '1B', bats: 'L', age: 25, pa: 185, h: 51, double: 4, triple: 2, hr: 11, bb: 26, so: 43, hbp: 1, sb: 1, cs: 1, sec: '3B', fld: 72, rk: true },
      { id: 'friasha01', name: 'Hanley Frias', pos: 'SS', bats: 'S', age: 25, pa: 180, h: 39, double: 3, triple: 2, hr: 1, bb: 26, so: 20, hbp: 0, sb: 4, cs: 3, sec: '2B', fld: 43, rk: true },
      { id: 'delluda01', name: 'David Dellucci', pos: 'RF', bats: 'L', age: 25, pa: 123, h: 33, double: 6, triple: 3, hr: 1, bb: 10, so: 27, hbp: 2, sb: 1, cs: 1, sec: 'LF', fld: 68, arm: 66 },
    ],
    pitchers: [
      { id: 'johnsra05', name: 'Randy Johnson', role: 'SP', throws: 'L', age: 35, g: 35, gs: 35, outs: 815, h: 207, hr: 27, bb: 81, so: 360, hbp: 11, er: 81, w: 17, l: 9, sv: 0, fld: 53 },
      { id: 'daalom01', name: 'Omar Daal', role: 'SP', throws: 'L', age: 27, g: 32, gs: 32, outs: 644, h: 195, hr: 20, bb: 75, so: 157, hbp: 6, er: 85, w: 16, l: 9, sv: 0, fld: 74 },
      { id: 'benesan01', name: 'Andy Benes', role: 'SP', throws: 'R', age: 31, g: 33, gs: 32, outs: 595, h: 205, hr: 27, bb: 75, so: 153, hbp: 5, er: 96, w: 13, l: 12, sv: 0, fld: 61 },
      { id: 'reynoar02', name: 'Armando Reynoso', role: 'SP', throws: 'R', age: 33, g: 31, gs: 27, outs: 501, h: 174, hr: 17, bb: 68, so: 84, hbp: 8, er: 80, w: 10, l: 6, sv: 0, fld: 74 },
      { id: 'anderbr02', name: 'Brian Anderson', role: 'SP', throws: 'L', age: 27, g: 31, gs: 19, outs: 390, h: 143, hr: 21, bb: 22, so: 67, hbp: 2, er: 65, w: 8, l: 2, sv: 1, fld: 71 },
      { id: 'olsongr01', name: 'Gregg Olson', role: 'CL', throws: 'R', age: 32, g: 61, gs: 0, outs: 182, h: 55, hr: 6, bb: 25, so: 46, hbp: 1, er: 25, w: 9, l: 4, sv: 14, fld: 74 },
      { id: 'swindgr01', name: 'Greg Swindell', role: 'RP', throws: 'L', age: 34, g: 63, gs: 0, outs: 194, h: 58, hr: 8, bb: 19, so: 46, hbp: 1, er: 22, w: 4, l: 0, sv: 1, fld: 64 },
      { id: 'holmeda01', name: 'Darren Holmes', role: 'RP', throws: 'R', age: 33, g: 44, gs: 0, outs: 146, h: 54, hr: 4, bb: 20, so: 34, hbp: 1, er: 22, w: 4, l: 3, sv: 0, fld: 73 },
      { id: 'chouibo01', name: 'Bobby Chouinard', role: 'RP', throws: 'R', age: 27, g: 32, gs: 0, outs: 121, h: 36, hr: 4, bb: 11, so: 24, hbp: 0, er: 14, w: 5, l: 2, sv: 1, fld: 65 },
      { id: 'kimby01', name: 'Byung-Hyun Kim', role: 'RP', throws: 'R', age: 20, g: 25, gs: 0, outs: 82, h: 20, hr: 2, bb: 20, so: 31, hbp: 5, er: 14, w: 1, l: 2, sv: 1, fld: 72, rk: true },
      { id: 'sabeler01', name: 'Erik Sabel', role: 'RP', throws: 'R', age: 24, g: 7, gs: 0, outs: 29, h: 12, hr: 1, bb: 6, so: 6, hbp: 2, er: 7, w: 0, l: 0, sv: 0, fld: 75, rk: true },
    ],
    reservePitchers: [
      { id: 'stottto01', name: 'Todd Stottlemyre', role: 'SP', throws: 'R', age: 34, g: 17, gs: 17, outs: 304, h: 101, hr: 11, bb: 39, so: 88, hbp: 4, er: 45, w: 6, l: 3, sv: 0, fld: 75 },
    ],
  },
  // COL (COL 1999)
  {
    franchiseId: 'COL',
    season: 1999,
    batters: [
      { id: 'blanche01', name: 'Henry Blanco', pos: 'C', bats: 'R', age: 27, pa: 303, h: 61, double: 12, triple: 3, hr: 6, bb: 34, so: 38, hbp: 1, sb: 1, cs: 1, sec: '1B', fld: 72, arm: 76, rk: true },
      { id: 'heltoto01', name: 'Todd Helton', pos: '1B', bats: 'L', age: 25, pa: 656, h: 184, double: 39, triple: 4, hr: 32, bb: 64, so: 70, hbp: 6, sb: 5, cs: 5, sec: 'LF', fld: 74 },
      { id: 'abbotku01', name: 'Kurt Abbott', pos: '2B', bats: 'R', age: 30, pa: 305, h: 77, double: 18, triple: 2, hr: 8, bb: 16, so: 72, hbp: 1, sb: 3, cs: 2, sec: 'SS', fld: 68 },
      { id: 'castivi02', name: 'Vinny Castilla', pos: '3B', bats: 'R', age: 31, pa: 674, h: 182, double: 25, triple: 2, hr: 38, bb: 47, so: 84, hbp: 4, sb: 3, cs: 5, sec: 'SS', fld: 71 },
      { id: 'perezne01', name: 'Neifi Perez', pos: 'SS', bats: 'S', age: 26, pa: 732, h: 189, double: 27, triple: 11, hr: 11, bb: 33, so: 64, hbp: 1, sb: 10, cs: 6, sec: '2B', fld: 83 },
      { id: 'bicheda01', name: 'Dante Bichette', pos: 'LF', bats: 'R', age: 35, pa: 659, h: 190, double: 40, triple: 2, hr: 29, bb: 41, so: 82, hbp: 2, sb: 9, cs: 5, sec: 'RF', fld: 53, arm: 87 },
      { id: 'hamilda02', name: 'Darryl Hamilton', pos: 'CF', bats: 'L', age: 34, pa: 568, h: 151, double: 22, triple: 3, hr: 7, bb: 63, so: 52, hbp: 2, sb: 9, cs: 8, sec: 'RF', fld: 75, arm: 61 },
      { id: 'walkela01', name: 'Larry Walker', pos: 'RF', bats: 'L', age: 32, pa: 513, h: 163, double: 34, triple: 3, hr: 33, bb: 59, so: 58, hbp: 9, sb: 15, cs: 4, sec: '1B', fld: 65, arm: 81 },
      { id: 'harrile01', name: 'Lenny Harris', pos: 'DH', bats: 'L', age: 34, pa: 194, h: 51, double: 11, triple: 0, hr: 2, bb: 9, so: 11, hbp: 1, sb: 3, cs: 2, sec: '3B', fld: 87 },
    ],
    bench: [
      { id: 'shumpte01', name: 'Terry Shumpert', pos: '2B', bats: 'R', age: 32, pa: 304, h: 89, double: 25, triple: 3, hr: 10, bb: 30, so: 43, hbp: 2, sb: 13, cs: 0, sec: '3B', fld: 82 },
      { id: 'echevan01', name: 'Angel Echevarria', pos: 'RF', bats: 'R', age: 28, pa: 211, h: 57, double: 8, triple: 0, hr: 10, bb: 17, so: 33, hbp: 4, sb: 1, cs: 3, sec: 'LF', fld: 74, arm: 76, rk: true },
      { id: 'barryje01', name: 'Jeff Barry', pos: 'CF', bats: 'S', age: 29, pa: 192, h: 43, double: 15, triple: 0, hr: 4, bb: 18, so: 32, hbp: 2, sb: 0, cs: 4, sec: 'RF', fld: 67, arm: 79, rk: true },
      { id: 'clemeed02', name: 'Edgard Clemente', pos: 'CF', bats: 'R', age: 23, pa: 171, h: 42, double: 9, triple: 2, hr: 7, bb: 8, so: 48, hbp: 0, sb: 0, cs: 0, sec: 'RF', fld: 68, arm: 67, rk: true },
      { id: 'lansimi01', name: 'Mike Lansing', pos: '2B', bats: 'R', age: 31, pa: 155, h: 40, double: 10, triple: 0, hr: 4, bb: 9, so: 22, hbp: 1, sb: 2, cs: 1, sec: '3B', fld: 88 },
    ],
    reserveBatters: [
      { id: 'manwaki01', name: 'Kirt Manwaring', pos: 'C', bats: 'R', age: 33, pa: 155, h: 35, double: 5, triple: 1, hr: 1, bb: 15, so: 25, hbp: 2, sb: 0, cs: 2, sec: '1B', fld: 69, arm: 59 },
      { id: 'petribe01', name: 'Ben Petrick', pos: 'C', bats: 'R', age: 22, pa: 72, h: 20, double: 3, triple: 0, hr: 4, bb: 10, so: 13, hbp: 0, sb: 1, cs: 0, sec: '1B', fld: 54, arm: 50, rk: true },
      { id: 'sextoch01', name: 'Chris Sexton', pos: '2B', bats: 'R', age: 27, pa: 70, h: 14, double: 0, triple: 1, hr: 1, bb: 11, so: 10, hbp: 0, sb: 4, cs: 2, sec: 'SS', rk: true },
      { id: 'philljr01', name: 'J. R. Phillips', pos: 'RF', bats: 'L', age: 29, pa: 40, h: 8, double: 2, triple: 0, hr: 2, bb: 2, so: 14, hbp: 0, sb: 0, cs: 0, sec: '1B' },
    ],
    pitchers: [
      { id: 'astacpe01', name: 'Pedro Astacio', role: 'SP', throws: 'R', age: 30, g: 34, gs: 34, outs: 696, h: 257, hr: 38, bb: 76, so: 199, hbp: 13, er: 136, w: 17, l: 11, sv: 0, fld: 64 },
      { id: 'bohanbr01', name: 'Brian Bohanon', role: 'SP', throws: 'L', age: 30, g: 33, gs: 33, outs: 592, h: 217, hr: 26, bb: 88, so: 134, hbp: 14, er: 112, w: 12, l: 12, sv: 0, fld: 70 },
      { id: 'kileda01', name: 'Darryl Kile', role: 'SP', throws: 'R', age: 30, g: 32, gs: 32, outs: 572, h: 215, hr: 27, bb: 94, so: 134, hbp: 6, er: 117, w: 8, l: 13, sv: 0, fld: 69 },
      { id: 'jonesbo04', name: 'Bobby Jones', role: 'SP', throws: 'L', age: 27, g: 30, gs: 20, outs: 337, h: 132, hr: 18, bb: 68, so: 80, hbp: 5, er: 76, w: 6, l: 10, sv: 0, fld: 75 },
      { id: 'wrighja01', name: 'Jamey Wright', role: 'SP', throws: 'R', age: 24, g: 16, gs: 16, outs: 283, h: 112, hr: 11, bb: 48, so: 43, hbp: 5, er: 58, w: 4, l: 3, sv: 0, fld: 85 },
      { id: 'veresda01', name: 'Dave Veres', role: 'CL', throws: 'R', age: 32, g: 73, gs: 0, outs: 231, h: 83, hr: 11, bb: 34, so: 73, hbp: 2, er: 36, w: 4, l: 8, sv: 31, fld: 71 },
      { id: 'dipotje01', name: 'Jerry Dipoto', role: 'RP', throws: 'R', age: 31, g: 63, gs: 0, outs: 260, h: 90, hr: 9, bb: 38, so: 68, hbp: 3, er: 41, w: 4, l: 5, sv: 1, fld: 69 },
      { id: 'leskacu01', name: 'Curt Leskanic', role: 'RP', throws: 'R', age: 31, g: 63, gs: 0, outs: 255, h: 87, hr: 9, bb: 47, so: 73, hbp: 3, er: 47, w: 6, l: 2, sv: 0, fld: 57 },
      { id: 'dejeami01', name: 'Mike DeJean', role: 'RP', throws: 'R', age: 28, g: 56, gs: 0, outs: 183, h: 77, hr: 8, bb: 27, so: 30, hbp: 2, er: 41, w: 2, l: 4, sv: 0, fld: 56 },
      { id: 'mcelrch01', name: 'Chuck McElroy', role: 'RP', throws: 'L', age: 31, g: 56, gs: 0, outs: 162, h: 60, hr: 6, bb: 27, so: 48, hbp: 1, er: 27, w: 3, l: 1, sv: 0, fld: 80 },
      { id: 'leeda01', name: 'David Lee', role: 'RP', throws: 'R', age: 26, g: 36, gs: 0, outs: 147, h: 43, hr: 4, bb: 29, so: 38, hbp: 4, er: 20, w: 3, l: 2, sv: 0, fld: 78, rk: true },
    ],
    reservePitchers: [
      { id: 'thomsjo01', name: 'John Thomson', role: 'SP', throws: 'R', age: 25, g: 14, gs: 13, outs: 188, h: 80, hr: 9, bb: 26, so: 42, hbp: 1, er: 43, w: 1, l: 10, sv: 0, fld: 76 },
      { id: 'ramirro01', name: 'Roberto Ramirez', role: 'RP', throws: 'L', age: 27, g: 32, gs: 4, outs: 121, h: 63, hr: 9, bb: 25, so: 36, hbp: 0, er: 36, w: 1, l: 5, sv: 1, fld: 70, rk: true },
      { id: 'brownma04', name: 'Mark Brownson', role: 'RP', throws: 'R', age: 24, g: 7, gs: 7, outs: 89, h: 41, hr: 7, bb: 7, so: 21, hbp: 1, er: 24, w: 0, l: 2, sv: 0, fld: 67, rk: true },
      { id: 'wainhda01', name: 'Dave Wainhouse', role: 'RP', throws: 'R', age: 31, g: 19, gs: 0, outs: 86, h: 37, hr: 5, bb: 16, so: 17, hbp: 1, er: 22, w: 0, l: 0, sv: 0, fld: 74 },
      { id: 'hackmlu01', name: 'Luther Hackman', role: 'RP', throws: 'R', age: 24, g: 5, gs: 3, outs: 48, h: 26, hr: 5, bb: 12, so: 10, hbp: 0, er: 19, w: 1, l: 2, sv: 0, fld: 58, rk: true },
    ],
  },
  // LAD (LAN 1999)
  {
    franchiseId: 'LAD',
    season: 1999,
    batters: [
      { id: 'hundlto01', name: 'Todd Hundley', pos: 'C', bats: 'S', age: 30, pa: 428, h: 80, double: 15, triple: 0, hr: 22, bb: 51, so: 116, hbp: 4, sb: 3, cs: 1, sec: '1B', fld: 62, arm: 62 },
      { id: 'karroer01', name: 'Eric Karros', pos: '1B', bats: 'R', age: 31, pa: 639, h: 170, double: 32, triple: 0, hr: 31, bb: 54, so: 112, hbp: 2, sb: 9, cs: 4, sec: '3B', fld: 78 },
      { id: 'younger01', name: 'Eric Young', pos: '2B', bats: 'R', age: 32, pa: 534, h: 130, double: 24, triple: 3, hr: 5, bb: 56, so: 31, hbp: 5, sb: 45, cs: 17, sec: 'SS', fld: 67 },
      { id: 'beltrad01', name: 'Adrian Beltre', pos: '3B', bats: 'R', age: 20, pa: 614, h: 143, double: 27, triple: 4, hr: 16, bb: 57, so: 105, hbp: 6, sb: 16, cs: 6, sec: '1B', fld: 67 },
      { id: 'grudzma01', name: 'Mark Grudzielanek', pos: 'SS', bats: 'R', age: 29, pa: 534, h: 146, double: 25, triple: 3, hr: 7, bb: 25, so: 62, hbp: 9, sb: 12, cs: 6, sec: '3B', fld: 62 },
      { id: 'sheffga01', name: 'Gary Sheffield', pos: 'LF', bats: 'R', age: 30, pa: 663, h: 157, double: 25, triple: 1, hr: 30, bb: 111, so: 66, hbp: 8, sb: 16, cs: 7, sec: 'RF', fld: 55, arm: 69 },
      { id: 'whitede03', name: 'Devon White', pos: 'CF', bats: 'S', age: 36, pa: 526, h: 127, double: 23, triple: 2, hr: 15, bb: 39, so: 89, hbp: 10, sb: 19, cs: 6, sec: 'RF', fld: 61, arm: 61 },
      { id: 'mondera01', name: 'Raul Mondesi', pos: 'RF', bats: 'R', age: 28, pa: 680, h: 167, double: 31, triple: 5, hr: 33, bb: 55, so: 126, hbp: 4, sb: 30, cs: 11, sec: 'CF', fld: 66, arm: 64 },
      { id: 'hanseda01', name: 'Dave Hansen', pos: 'DH', bats: 'L', age: 30, pa: 136, h: 29, double: 7, triple: 1, hr: 2, bb: 25, so: 21, hbp: 2, sb: 0, cs: 0, sec: '3B' },
    ],
    bench: [
      { id: 'vizcajo01', name: 'Jose Vizcaino', pos: 'SS', bats: 'S', age: 31, pa: 298, h: 69, double: 9, triple: 1, hr: 2, bb: 21, so: 33, hbp: 1, sb: 4, cs: 2, sec: '2B', fld: 65 },
      { id: 'hollato01', name: 'Todd Hollandsworth', pos: 'CF', bats: 'L', age: 26, pa: 287, h: 72, double: 13, triple: 3, hr: 7, bb: 20, so: 60, hbp: 1, sb: 5, cs: 3, sec: 'LF', fld: 67, arm: 65 },
      { id: 'counscr01', name: 'Craig Counsell', pos: '2B', bats: 'L', age: 28, pa: 195, h: 41, double: 8, triple: 1, hr: 1, bb: 20, so: 23, hbp: 1, sb: 1, cs: 0, sec: 'SS', fld: 76 },
      { id: 'penaan01', name: 'Angel Pena', pos: 'C', bats: 'R', age: 24, pa: 135, h: 25, double: 6, triple: 0, hr: 4, bb: 11, so: 26, hbp: 0, sb: 0, cs: 1, sec: '1B', fld: 59, arm: 70, rk: true },
      { id: 'hubbatr01', name: 'Trent Hubbard', pos: 'LF', bats: 'R', age: 35, pa: 120, h: 32, double: 5, triple: 0, hr: 2, bb: 11, so: 24, hbp: 1, sb: 5, cs: 3, sec: 'CF', fld: 80, arm: 68 },
    ],
    reserveBatters: [
      { id: 'loducpa01', name: 'Paul Lo Duca', pos: 'C', bats: 'R', age: 27, pa: 110, h: 23, double: 2, triple: 0, hr: 3, bb: 9, so: 9, hbp: 2, sb: 1, cs: 2, sec: '1B', fld: 77, arm: 71, rk: true },
      { id: 'crometr01', name: 'Tripp Cromer', pos: '2B', bats: 'R', age: 31, pa: 57, h: 12, double: 1, triple: 0, hr: 2, bb: 4, so: 10, hbp: 0, sb: 0, cs: 0, sec: 'SS' },
    ],
    pitchers: [
      { id: 'brownke01', name: 'Kevin Brown', role: 'SP', throws: 'R', age: 34, g: 35, gs: 35, outs: 757, h: 215, hr: 14, bb: 57, so: 230, hbp: 9, er: 76, w: 18, l: 9, sv: 0, fld: 89 },
      { id: 'valdeis01', name: 'Ismael Valdez', role: 'SP', throws: 'R', age: 25, g: 32, gs: 32, outs: 610, h: 205, hr: 26, bb: 63, so: 144, hbp: 4, er: 86, w: 9, l: 14, sv: 0, fld: 76 },
      { id: 'parkch01', name: 'Chan Ho Park', role: 'SP', throws: 'R', age: 26, g: 33, gs: 33, outs: 583, h: 194, hr: 25, bb: 94, so: 177, hbp: 12, er: 98, w: 13, l: 11, sv: 0, fld: 81 },
      { id: 'dreifda01', name: 'Darren Dreifort', role: 'SP', throws: 'R', age: 27, g: 30, gs: 29, outs: 536, h: 173, hr: 16, bb: 71, so: 155, hbp: 8, er: 88, w: 13, l: 13, sv: 0, fld: 76 },
      { id: 'perezca01', name: 'Carlos Perez', role: 'SP', throws: 'L', age: 28, g: 17, gs: 16, outs: 269, h: 106, hr: 13, bb: 30, so: 49, hbp: 3, er: 51, w: 2, l: 10, sv: 0, fld: 78 },
      { id: 'shawje01', name: 'Jeff Shaw', role: 'CL', throws: 'R', age: 32, g: 64, gs: 0, outs: 204, h: 62, hr: 6, bb: 14, so: 46, hbp: 1, er: 19, w: 2, l: 4, sv: 34, fld: 58 },
      { id: 'millsal01', name: 'Alan Mills', role: 'RP', throws: 'R', age: 32, g: 68, gs: 0, outs: 217, h: 65, hr: 9, bb: 47, so: 52, hbp: 3, er: 31, w: 3, l: 4, sv: 0, fld: 61 },
      { id: 'arnolja01', name: 'Jamie Arnold', role: 'RP', throws: 'R', age: 25, g: 36, gs: 3, outs: 207, h: 81, hr: 6, bb: 34, so: 26, hbp: 6, er: 42, w: 2, l: 4, sv: 1, fld: 84, rk: true },
      { id: 'masaoon01', name: 'Onan Masaoka', role: 'RP', throws: 'L', age: 21, g: 54, gs: 0, outs: 200, h: 55, hr: 8, bb: 47, so: 61, hbp: 2, er: 32, w: 2, l: 4, sv: 1, fld: 83, rk: true },
      { id: 'maddumi01', name: 'Mike Maddux', role: 'RP', throws: 'R', age: 37, g: 53, gs: 0, outs: 179, h: 62, hr: 5, bb: 21, so: 42, hbp: 4, er: 27, w: 1, l: 1, sv: 0, fld: 67 },
      { id: 'borbope02', name: 'Pedro Borbon', role: 'RP', throws: 'L', age: 31, g: 70, gs: 0, outs: 152, h: 39, hr: 5, bb: 29, so: 33, hbp: 1, er: 23, w: 4, l: 3, sv: 1, fld: 80 },
    ],
    reservePitchers: [
      { id: 'gagneer01', name: 'Eric Gagne', role: 'RP', throws: 'R', age: 23, g: 5, gs: 5, outs: 90, h: 18, hr: 3, bb: 15, so: 30, hbp: 0, er: 7, w: 1, l: 1, sv: 0, fld: 79, rk: true },
      { id: 'juddmi01', name: 'Mike Judd', role: 'RP', throws: 'R', age: 24, g: 7, gs: 4, outs: 84, h: 32, hr: 5, bb: 13, so: 24, hbp: 1, er: 22, w: 3, l: 1, sv: 0, fld: 65, rk: true },
      { id: 'hergema01', name: 'Matt Herges', role: 'RP', throws: 'R', age: 29, g: 17, gs: 0, outs: 73, h: 24, hr: 5, bb: 8, so: 18, hbp: 1, er: 11, w: 0, l: 2, sv: 0, fld: 69, rk: true },
      { id: 'willije01', name: 'Jeff Williams', role: 'RP', throws: 'L', age: 27, g: 5, gs: 3, outs: 53, h: 12, hr: 2, bb: 9, so: 7, hbp: 0, er: 8, w: 2, l: 0, sv: 0, fld: 73, rk: true },
      { id: 'checoro01', name: 'Robinson Checo', role: 'RP', throws: 'R', age: 27, g: 9, gs: 2, outs: 47, h: 23, hr: 5, bb: 11, so: 12, hbp: 0, er: 16, w: 2, l: 2, sv: 0, fld: 71, rk: true },
    ],
  },
  // SDP (SDN 1999)
  {
    franchiseId: 'SDP',
    season: 1999,
    batters: [
      { id: 'davisbe01', name: 'Ben Davis', pos: 'C', bats: 'S', age: 22, pa: 293, h: 65, double: 14, triple: 1, hr: 5, bb: 25, so: 70, hbp: 0, sb: 2, cs: 1, sec: '1B', fld: 69, arm: 69, rk: true },
      { id: 'joynewa01', name: 'Wally Joyner', pos: '1B', bats: 'L', age: 37, pa: 386, h: 94, double: 19, triple: 1, hr: 8, bb: 47, so: 44, hbp: 1, sb: 1, cs: 2, fld: 78 },
      { id: 'verasqu01', name: 'Quilvio Veras', pos: '2B', bats: 'S', age: 28, pa: 545, h: 128, double: 23, triple: 2, hr: 5, bb: 68, so: 79, hbp: 4, sb: 27, cs: 13, sec: 'SS', fld: 77 },
      { id: 'nevinph01', name: 'Phil Nevin', pos: '3B', bats: 'R', age: 28, pa: 441, h: 99, double: 23, triple: 1, hr: 20, bb: 44, so: 93, hbp: 3, sb: 1, cs: 0, sec: '1B', fld: 84 },
      { id: 'jacksda04', name: 'Damian Jackson', pos: 'SS', bats: 'R', age: 25, pa: 447, h: 89, double: 22, triple: 2, hr: 8, bb: 53, so: 100, hbp: 3, sb: 33, cs: 9, sec: '2B', fld: 63, rk: true },
      { id: 'sandere02', name: 'Reggie Sanders', pos: 'LF', bats: 'R', age: 31, pa: 550, h: 132, double: 23, triple: 6, hr: 22, bb: 60, so: 123, hbp: 6, sb: 29, cs: 11, sec: 'RF', fld: 66, arm: 65 },
      { id: 'riverru01', name: 'Ruben Rivera', pos: 'CF', bats: 'R', age: 25, pa: 475, h: 81, double: 16, triple: 2, hr: 21, bb: 57, so: 139, hbp: 5, sb: 17, cs: 6, sec: 'RF', fld: 75, arm: 72 },
      { id: 'gwynnto01', name: 'Tony Gwynn', pos: 'RF', bats: 'L', age: 39, pa: 446, h: 139, double: 30, triple: 0, hr: 12, bb: 30, so: 16, hbp: 2, sb: 6, cs: 2, sec: 'CF', fld: 54, arm: 64 },
      { id: 'vandejo02', name: 'John Vander Wal', pos: 'DH', bats: 'L', age: 33, pa: 288, h: 66, double: 19, triple: 0, hr: 7, bb: 37, so: 63, hbp: 1, sb: 2, cs: 1, sec: 'LF', fld: 82, arm: 71 },
    ],
    bench: [
      { id: 'owenser01', name: 'Eric Owens', pos: 'LF', bats: 'R', age: 28, pa: 485, h: 114, double: 21, triple: 3, hr: 9, bb: 37, so: 52, hbp: 3, sb: 31, cs: 7, sec: 'CF', fld: 82, arm: 67 },
      { id: 'magadda01', name: 'Dave Magadan', pos: '3B', bats: 'L', age: 36, pa: 300, h: 72, double: 13, triple: 1, hr: 2, bb: 43, so: 35, hbp: 0, sb: 1, cs: 2, sec: '1B', fld: 64 },
      { id: 'gomezch02', name: 'Chris Gomez', pos: 'SS', bats: 'R', age: 28, pa: 265, h: 60, double: 12, triple: 1, hr: 2, bb: 26, so: 48, hbp: 2, sb: 1, cs: 2, sec: '2B', fld: 62 },
      { id: 'leyriji01', name: 'Jim Leyritz', pos: '1B', bats: 'R', age: 35, pa: 233, h: 51, double: 9, triple: 0, hr: 8, bb: 29, so: 50, hbp: 5, sb: 0, cs: 0, sec: '3B', fld: 63 },
      { id: 'myersgr01', name: 'Greg Myers', pos: 'C', bats: 'L', age: 33, pa: 227, h: 52, double: 9, triple: 0, hr: 5, bb: 23, so: 35, hbp: 0, sb: 0, cs: 0, sec: '1B', fld: 77, arm: 68 },
    ],
    reserveBatters: [
      { id: 'ariasge01', name: 'George Arias', pos: '3B', bats: 'R', age: 27, pa: 170, h: 39, double: 7, triple: 1, hr: 6, bb: 7, so: 53, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 79 },
      { id: 'baergca01', name: 'Carlos Baerga', pos: '3B', bats: 'S', age: 30, pa: 152, h: 37, double: 6, triple: 0, hr: 2, bb: 7, so: 17, hbp: 2, sb: 1, cs: 1, sec: '2B', fld: 48 },
      { id: 'gonzawi01', name: 'Wiki Gonzalez', pos: 'C', bats: 'R', age: 25, pa: 85, h: 21, double: 2, triple: 1, hr: 3, bb: 1, so: 8, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 73, arm: 95, rk: true },
      { id: 'giovaed01', name: 'Ed Giovanola', pos: '3B', bats: 'L', age: 30, pa: 69, h: 12, double: 1, triple: 1, hr: 0, bb: 9, so: 9, hbp: 0, sb: 1, cs: 1, sec: '2B' },
      { id: 'darrmi02', name: 'Mike Darr', pos: 'RF', bats: 'L', age: 23, pa: 53, h: 13, double: 1, triple: 0, hr: 2, bb: 5, so: 18, hbp: 0, sb: 2, cs: 1, sec: 'LF', rk: true },
    ],
    pitchers: [
      { id: 'williwo02', name: 'Woody Williams', role: 'SP', throws: 'R', age: 32, g: 33, gs: 33, outs: 625, h: 208, hr: 34, bb: 75, so: 141, hbp: 3, er: 103, w: 12, l: 12, sv: 0, fld: 63 },
      { id: 'ashbyan01', name: 'Andy Ashby', role: 'SP', throws: 'R', age: 31, g: 31, gs: 31, outs: 618, h: 205, hr: 23, bb: 53, so: 136, hbp: 6, er: 84, w: 14, l: 10, sv: 0, fld: 76 },
      { id: 'hitchst01', name: 'Sterling Hitchcock', role: 'SP', throws: 'L', age: 28, g: 33, gs: 33, outs: 617, h: 204, hr: 31, bb: 69, so: 184, hbp: 7, er: 97, w: 12, l: 14, sv: 0, fld: 65 },
      { id: 'clemema01', name: 'Matt Clement', role: 'SP', throws: 'R', age: 24, g: 31, gs: 31, outs: 542, h: 190, hr: 17, bb: 86, so: 137, hbp: 9, er: 90, w: 10, l: 12, sv: 0, fld: 59, rk: true },
      { id: 'boehrbr01', name: 'Brian Boehringer', role: 'SP', throws: 'R', age: 30, g: 33, gs: 11, outs: 283, h: 92, hr: 10, bb: 44, so: 73, hbp: 2, er: 36, w: 6, l: 5, sv: 0, fld: 69 },
      { id: 'hoffmtr01', name: 'Trevor Hoffman', role: 'CL', throws: 'R', age: 31, g: 64, gs: 0, outs: 202, h: 45, hr: 4, bb: 17, so: 79, hbp: 0, er: 15, w: 2, l: 3, sv: 40, fld: 85 },
      { id: 'reyesca01', name: 'Carlos Reyes', role: 'RP', throws: 'R', age: 30, g: 65, gs: 0, outs: 232, h: 77, hr: 10, bb: 24, so: 53, hbp: 1, er: 34, w: 2, l: 4, sv: 1, fld: 78 },
      { id: 'walldo01', name: 'Donne Wall', role: 'RP', throws: 'R', age: 31, g: 55, gs: 0, outs: 211, h: 58, hr: 9, bb: 26, so: 52, hbp: 1, er: 24, w: 7, l: 4, sv: 0, fld: 74 },
      { id: 'micelda01', name: 'Dan Miceli', role: 'RP', throws: 'R', age: 28, g: 66, gs: 0, outs: 206, h: 66, hr: 7, bb: 32, so: 64, hbp: 1, er: 32, w: 4, l: 5, sv: 2, fld: 73 },
      { id: 'murrahe01', name: 'Heath Murray', role: 'RP', throws: 'L', age: 26, g: 22, gs: 8, outs: 150, h: 62, hr: 6, bb: 26, so: 24, hbp: 2, er: 32, w: 0, l: 4, sv: 0, fld: 66, rk: true },
      { id: 'spencst02', name: 'Stan Spencer', role: 'RP', throws: 'R', age: 29, g: 9, gs: 8, outs: 115, h: 52, hr: 10, bb: 9, so: 39, hbp: 1, er: 34, w: 0, l: 7, sv: 0, fld: 77, rk: true },
    ],
    reservePitchers: [
      { id: 'carlybu01', name: 'Buddy Carlyle', role: 'RP', throws: 'R', age: 21, g: 7, gs: 7, outs: 113, h: 36, hr: 7, bb: 17, so: 29, hbp: 2, er: 25, w: 1, l: 3, sv: 0, fld: 59, rk: true },
      { id: 'almanca01', name: 'Carlos Almanzar', role: 'RP', throws: 'R', age: 25, g: 28, gs: 0, outs: 112, h: 47, hr: 6, bb: 14, so: 30, hbp: 2, er: 28, w: 0, l: 0, sv: 0, fld: 72, rk: true },
      { id: 'cunnawi01', name: 'Will Cunnane', role: 'RP', throws: 'R', age: 25, g: 24, gs: 0, outs: 93, h: 35, hr: 6, bb: 14, so: 23, hbp: 1, er: 18, w: 2, l: 1, sv: 0, fld: 60 },
      { id: 'vosbeed01', name: 'Ed Vosberg', role: 'RP', throws: 'L', age: 37, g: 19, gs: 0, outs: 33, h: 18, hr: 1, bb: 4, so: 9, hbp: 2, er: 8, w: 0, l: 1, sv: 0, fld: 81 },
      { id: 'whitema02', name: 'Matt Whiteside', role: 'RP', throws: 'R', age: 31, g: 10, gs: 0, outs: 33, h: 17, hr: 2, bb: 4, so: 8, hbp: 0, er: 11, w: 1, l: 0, sv: 0, fld: 66 },
    ],
  },
  // SFG (SFN 1999)
  {
    franchiseId: 'SFG',
    season: 1999,
    batters: [
      { id: 'maynebr01', name: 'Brent Mayne', pos: 'C', bats: 'L', age: 31, pa: 374, h: 95, double: 25, triple: 0, hr: 3, bb: 41, so: 59, hbp: 4, sb: 2, cs: 1, sec: '1B', fld: 79, arm: 69 },
      { id: 'snowjt01', name: 'J. T. Snow', pos: '1B', bats: 'L', age: 31, pa: 668, h: 153, double: 31, triple: 2, hr: 24, bb: 86, so: 120, hbp: 3, sb: 1, cs: 4, sec: '3B', fld: 81 },
      { id: 'kentje01', name: 'Jeff Kent', pos: '2B', bats: 'R', age: 31, pa: 585, h: 147, double: 38, triple: 2, hr: 26, bb: 53, so: 112, hbp: 7, sb: 11, cs: 5, sec: '3B', fld: 65 },
      { id: 'muellbi02', name: 'Bill Mueller', pos: '3B', bats: 'S', age: 28, pa: 492, h: 122, double: 24, triple: 0, hr: 5, bb: 62, so: 61, hbp: 2, sb: 3, cs: 2, sec: '2B', fld: 73 },
      { id: 'aurilri01', name: 'Rich Aurilia', pos: 'SS', bats: 'R', age: 27, pa: 614, h: 154, double: 28, triple: 2, hr: 19, bb: 43, so: 76, hbp: 4, sb: 3, cs: 3, sec: '2B', fld: 65 },
      { id: 'bondsba01', name: 'Barry Bonds', pos: 'LF', bats: 'L', age: 34, pa: 434, h: 98, double: 22, triple: 3, hr: 28, bb: 80, so: 59, hbp: 4, sb: 18, cs: 5, sec: 'CF', fld: 70, arm: 67 },
      { id: 'benarma01', name: 'Marvin Benard', pos: 'CF', bats: 'L', age: 28, pa: 625, h: 164, double: 36, triple: 4, hr: 13, bb: 58, so: 94, hbp: 6, sb: 25, cs: 12, sec: 'RF', fld: 70, arm: 64 },
      { id: 'burksel01', name: 'Ellis Burks', pos: 'RF', bats: 'R', age: 34, pa: 469, h: 115, double: 20, triple: 2, hr: 26, bb: 57, so: 85, hbp: 5, sb: 8, cs: 5, sec: 'CF', fld: 74, arm: 61 },
      { id: 'javiest01', name: 'Stan Javier', pos: 'DH', bats: 'S', age: 35, pa: 446, h: 112, double: 16, triple: 3, hr: 4, bb: 47, so: 61, hbp: 2, sb: 18, cs: 5, sec: 'RF', fld: 69, arm: 69 },
    ],
    bench: [
      { id: 'santafp01', name: 'F. P. Santangelo', pos: 'CF', bats: 'S', age: 31, pa: 325, h: 62, double: 15, triple: 2, hr: 3, bb: 41, so: 53, hbp: 14, sb: 8, cs: 3, sec: 'LF', fld: 68, arm: 73 },
      { id: 'hayesch01', name: 'Charlie Hayes', pos: '3B', bats: 'R', age: 34, pa: 301, h: 65, double: 9, triple: 0, hr: 8, bb: 31, so: 46, hbp: 1, sb: 2, cs: 1, sec: '1B', fld: 51 },
      { id: 'servasc01', name: 'Scott Servais', pos: 'C', bats: 'R', age: 32, pa: 217, h: 49, double: 10, triple: 0, hr: 4, bb: 14, so: 30, hbp: 3, sb: 0, cs: 0, sec: '1B', fld: 67, arm: 61 },
      { id: 'riosar01', name: 'Armando Rios', pos: 'RF', bats: 'L', age: 27, pa: 177, h: 50, double: 9, triple: 0, hr: 8, bb: 25, so: 35, hbp: 1, sb: 7, cs: 4, sec: 'LF', fld: 81, arm: 85, rk: true },
      { id: 'martira03', name: 'Ramon Martinez', pos: '2B', bats: 'R', age: 26, pa: 165, h: 38, double: 6, triple: 0, hr: 5, bb: 15, so: 17, hbp: 0, sb: 1, cs: 2, sec: 'SS', fld: 94, rk: true },
    ],
    reserveBatters: [
      { id: 'mirabdo01', name: 'Doug Mirabelli', pos: 'C', bats: 'R', age: 28, pa: 98, h: 22, double: 6, triple: 0, hr: 1, bb: 9, so: 26, hbp: 1, sb: 0, cs: 0, sec: '1B', fld: 84, arm: 77, rk: true },
      { id: 'delgawi01', name: 'Wilson Delgado', pos: 'SS', bats: 'S', age: 26, pa: 78, h: 17, double: 3, triple: 1, hr: 0, bb: 5, so: 10, hbp: 1, sb: 1, cs: 0, sec: '2B', rk: true },
    ],
    pitchers: [
      { id: 'ortizru01', name: 'Russ Ortiz', role: 'SP', throws: 'R', age: 25, g: 33, gs: 33, outs: 623, h: 194, hr: 24, bb: 121, so: 166, hbp: 7, er: 94, w: 18, l: 9, sv: 0, fld: 76 },
      { id: 'estessh01', name: 'Shawn Estes', role: 'SP', throws: 'L', age: 26, g: 32, gs: 32, outs: 609, h: 202, hr: 19, bb: 110, so: 172, hbp: 6, er: 106, w: 11, l: 11, sv: 0, fld: 78 },
      { id: 'rueteki01', name: 'Kirk Rueter', role: 'SP', throws: 'L', age: 28, g: 33, gs: 33, outs: 554, h: 208, hr: 26, bb: 55, so: 101, hbp: 4, er: 99, w: 15, l: 10, sv: 0, fld: 79 },
      { id: 'gardnma01', name: 'Mark Gardner', role: 'SP', throws: 'R', age: 37, g: 29, gs: 21, outs: 417, h: 142, hr: 23, bb: 50, so: 97, hbp: 5, er: 82, w: 5, l: 11, sv: 0, fld: 71 },
      { id: 'brockch01', name: 'Chris Brock', role: 'SP', throws: 'R', age: 29, g: 19, gs: 19, outs: 320, h: 123, hr: 16, bb: 41, so: 74, hbp: 3, er: 63, w: 6, l: 8, sv: 0, fld: 76 },
      { id: 'nenro01', name: 'Robb Nen', role: 'CL', throws: 'R', age: 29, g: 72, gs: 0, outs: 217, h: 69, hr: 6, bb: 28, so: 86, hbp: 0, er: 25, w: 3, l: 8, sv: 37, fld: 68 },
      { id: 'rodrife01', name: 'Felix Rodriguez', role: 'RP', throws: 'R', age: 26, g: 47, gs: 0, outs: 199, h: 66, hr: 6, bb: 34, so: 53, hbp: 3, er: 32, w: 2, l: 3, sv: 0, fld: 69 },
      { id: 'johnsjo07', name: 'John Johnstone', role: 'RP', throws: 'R', age: 30, g: 62, gs: 0, outs: 197, h: 50, hr: 7, bb: 24, so: 57, hbp: 1, er: 20, w: 4, l: 6, sv: 3, fld: 57 },
      { id: 'spradje01', name: 'Jerry Spradlin', role: 'RP', throws: 'R', age: 32, g: 63, gs: 0, outs: 183, h: 62, hr: 6, bb: 25, so: 58, hbp: 5, er: 32, w: 3, l: 1, sv: 0, fld: 73 },
      { id: 'embreal01', name: 'Alan Embree', role: 'RP', throws: 'L', age: 29, g: 68, gs: 0, outs: 176, h: 48, hr: 6, bb: 25, so: 50, hbp: 2, er: 22, w: 3, l: 2, sv: 0, fld: 79 },
      { id: 'rodriri02', name: 'Rich Rodriguez', role: 'RP', throws: 'L', age: 36, g: 62, gs: 0, outs: 170, h: 61, hr: 7, bb: 23, so: 40, hbp: 1, er: 28, w: 3, l: 0, sv: 0, fld: 85 },
    ],
    reservePitchers: [
      { id: 'nathajo01', name: 'Joe Nathan', role: 'SP', throws: 'R', age: 24, g: 19, gs: 14, outs: 271, h: 84, hr: 17, bb: 46, so: 54, hbp: 1, er: 42, w: 7, l: 4, sv: 1, fld: 68, rk: true },
      { id: 'tavarju01', name: 'Julian Tavarez', role: 'RP', throws: 'R', age: 26, g: 47, gs: 0, outs: 164, h: 64, hr: 5, bb: 24, so: 32, hbp: 6, er: 29, w: 2, l: 0, sv: 0, fld: 64 },
      { id: 'deltomi01', name: 'Miguel Del Toro', role: 'RP', throws: 'R', age: 27, g: 14, gs: 0, outs: 71, h: 24, hr: 5, bb: 11, so: 20, hbp: 0, er: 11, w: 0, l: 0, sv: 0, fld: 73, rk: true },
    ],
  },
];
