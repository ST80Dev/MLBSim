import type { HistTeam } from '../season1999';

// ---------------------------------------------------------------------------
// Fixture di prova — rose 1999 curate a mano (linee reali approssimate) di CLE e
// BOS. Servono a testare la PROPRIETÀ dell'importatore (inversione stat→rating:
// Ramirez potenza da campione, Vizquel contatto/velocità, Pedro dominio) con dati
// noti e stabili, indipendenti dal dataset Lahman generato (`season1999.ts`, che
// può cambiare selezione al rigenerarsi). Coprono le tre fasce: campioni, medi,
// scarsi.
// ---------------------------------------------------------------------------

export const SAMPLE_CLE_1999: HistTeam = {
  franchiseId: 'CLE',
  season: 1999,
  batters: [
    { name: 'Kenny Lofton', pos: 'CF', bats: 'L', age: 32, pa: 540, h: 140, double: 28, triple: 6, hr: 7, bb: 65, so: 84, hbp: 4, sb: 25, cs: 8 },
    { name: 'Omar Vizquel', pos: 'SS', bats: 'S', age: 32, pa: 655, h: 191, double: 36, triple: 4, hr: 5, bb: 65, so: 50, hbp: 5, sb: 42, cs: 9 },
    { name: 'Roberto Alomar', pos: '2B', bats: 'S', age: 31, pa: 673, h: 182, double: 40, triple: 3, hr: 24, bb: 99, so: 96, hbp: 5, sb: 37, cs: 6 },
    { name: 'Manny Ramirez', pos: 'RF', bats: 'R', age: 27, pa: 634, h: 174, double: 34, triple: 3, hr: 44, bb: 96, so: 131, hbp: 9, sb: 2, cs: 4 },
    { name: 'Jim Thome', pos: '1B', bats: 'L', age: 28, pa: 614, h: 137, double: 27, triple: 2, hr: 33, bb: 108, so: 171, hbp: 9, sb: 0, cs: 3 },
    { name: 'Richie Sexson', pos: 'LF', bats: 'R', age: 24, pa: 526, h: 122, double: 22, triple: 2, hr: 31, bb: 40, so: 116, hbp: 4, sb: 1, cs: 1 },
    { name: 'David Justice', pos: 'DH', bats: 'L', age: 33, pa: 512, h: 118, double: 25, triple: 1, hr: 21, bb: 79, so: 89, hbp: 4, sb: 1, cs: 1 },
    { name: 'Travis Fryman', pos: '3B', bats: 'R', age: 30, pa: 425, h: 97, double: 18, triple: 1, hr: 10, bb: 40, so: 66, hbp: 6, sb: 3, cs: 2 },
    { name: 'Sandy Alomar', pos: 'C', bats: 'R', age: 33, pa: 405, h: 121, double: 22, triple: 0, hr: 10, bb: 24, so: 48, hbp: 3, sb: 2, cs: 1 },
  ],
  pitchers: [
    { name: 'Bartolo Colon', role: 'SP', throws: 'R', age: 26, gs: 32, outs: 615, h: 189, hr: 22, bb: 76, so: 161, hbp: 6, er: 90, w: 18, l: 5, sv: 0 },
    { name: 'Dave Burba', role: 'SP', throws: 'R', age: 32, gs: 34, outs: 660, h: 217, hr: 28, bb: 92, so: 174, hbp: 7, er: 104, w: 15, l: 9, sv: 0 },
    { name: 'Charles Nagy', role: 'SP', throws: 'R', age: 32, gs: 33, outs: 606, h: 221, hr: 30, bb: 71, so: 120, hbp: 8, er: 111, w: 17, l: 11, sv: 0 },
    { name: 'Jaret Wright', role: 'SP', throws: 'R', age: 23, gs: 26, outs: 399, h: 141, hr: 20, bb: 87, so: 91, hbp: 7, er: 90, w: 8, l: 10, sv: 0 },
    { name: 'Mike Jackson', role: 'CL', throws: 'R', age: 34, gs: 0, outs: 186, h: 46, hr: 6, bb: 19, so: 51, hbp: 2, er: 23, w: 4, l: 6, sv: 39 },
    { name: 'Paul Shuey', role: 'RP', throws: 'R', age: 28, gs: 0, outs: 217, h: 62, hr: 5, bb: 34, so: 79, hbp: 3, er: 25, w: 5, l: 3, sv: 3 },
  ],
};

export const SAMPLE_BOS_1999: HistTeam = {
  franchiseId: 'BOS',
  season: 1999,
  batters: [
    { name: 'Jose Offerman', pos: '2B', bats: 'S', age: 30, pa: 685, h: 169, double: 37, triple: 8, hr: 8, bb: 89, so: 108, hbp: 3, sb: 18, cs: 8 },
    { name: 'John Valentin', pos: '3B', bats: 'R', age: 32, pa: 585, h: 129, double: 25, triple: 0, hr: 12, bb: 65, so: 74, hbp: 3, sb: 1, cs: 2 },
    { name: 'Nomar Garciaparra', pos: 'SS', bats: 'R', age: 25, pa: 595, h: 190, double: 42, triple: 4, hr: 27, bb: 51, so: 39, hbp: 8, sb: 14, cs: 4 },
    { name: 'Troy O’Leary', pos: 'LF', bats: 'L', age: 30, pa: 610, h: 154, double: 27, triple: 1, hr: 28, bb: 45, so: 96, hbp: 4, sb: 4, cs: 3 },
    { name: 'Brian Daubach', pos: 'DH', bats: 'L', age: 27, pa: 430, h: 112, double: 20, triple: 4, hr: 21, bb: 39, so: 105, hbp: 5, sb: 1, cs: 1 },
    { name: 'Jason Varitek', pos: 'C', bats: 'S', age: 27, pa: 540, h: 130, double: 39, triple: 2, hr: 20, bb: 46, so: 84, hbp: 3, sb: 0, cs: 2 },
    { name: 'Mike Stanley', pos: '1B', bats: 'R', age: 36, pa: 520, h: 128, double: 26, triple: 0, hr: 19, bb: 66, so: 87, hbp: 4, sb: 0, cs: 0 },
    { name: 'Trot Nixon', pos: 'RF', bats: 'L', age: 25, pa: 434, h: 105, double: 21, triple: 2, hr: 15, bb: 43, so: 69, hbp: 3, sb: 3, cs: 3 },
    { name: 'Darren Lewis', pos: 'DH', bats: 'R', age: 31, pa: 415, h: 90, double: 15, triple: 3, hr: 4, bb: 40, so: 55, hbp: 2, sb: 15, cs: 6 },
  ],
  pitchers: [
    { name: 'Pedro Martinez', role: 'SP', throws: 'R', age: 27, gs: 30, outs: 640, h: 160, hr: 9, bb: 37, so: 313, hbp: 9, er: 49, w: 23, l: 4, sv: 0 },
    { name: 'Bret Saberhagen', role: 'SP', throws: 'R', age: 35, gs: 22, outs: 357, h: 105, hr: 15, bb: 11, so: 81, hbp: 2, er: 39, w: 10, l: 6, sv: 0 },
    { name: 'Tim Wakefield', role: 'SP', throws: 'R', age: 32, gs: 17, outs: 420, h: 135, hr: 21, bb: 72, so: 104, hbp: 4, er: 79, w: 6, l: 11, sv: 0 },
    { name: 'Mark Portugal', role: 'SP', throws: 'R', age: 36, gs: 28, outs: 474, h: 197, hr: 20, bb: 45, so: 87, hbp: 5, er: 97, w: 7, l: 12, sv: 0 },
    { name: 'Derek Lowe', role: 'CL', throws: 'R', age: 26, gs: 0, outs: 327, h: 91, hr: 9, bb: 25, so: 80, hbp: 3, er: 32, w: 6, l: 3, sv: 15 },
    { name: 'Rich Garces', role: 'RP', throws: 'R', age: 28, gs: 0, outs: 122, h: 28, hr: 4, bb: 16, so: 40, hbp: 2, er: 12, w: 5, l: 1, sv: 1 },
  ],
};
