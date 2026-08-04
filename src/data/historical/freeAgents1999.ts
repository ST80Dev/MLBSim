import type { HistBatLine, HistPitLine } from './season1999';

// ---------------------------------------------------------------------------
// Pool FREE AGENT storico — stagione 1999. GENERATO da
// `scripts/build-historical.mjs`: i giocatori reali con minutaggio significativo
// che NON entrano nelle 30 rose attive (dedup: un giocatore = una squadra
// primaria). Alimentano il mercato/draft della gestione (Fase 5): svincolati,
// riserve di lega, ricambio. `id` = playerID Lahman (identità stabile).
// ---------------------------------------------------------------------------

/** Battitori disponibili sul mercato (ordinati per minutaggio). */
export const FREE_AGENT_BATTERS_1999: HistBatLine[] = [
  { id: 'clybuda01', name: 'Danny Clyburn', pos: 'LF', bats: 'R', age: 25, pa: 89, h: 17, double: 3, triple: 0, hr: 3, bb: 6, so: 23, hbp: 1, sb: 0, cs: 0, sec: 'RF', fld: 85, arm: 95, rk: true },
  { id: 'pritcch01', name: 'Chris Pritchett', pos: '1B', bats: 'L', age: 29, pa: 49, h: 10, double: 1, triple: 0, hr: 1, bb: 2, so: 9, hbp: 0, sb: 1, cs: 0, sec: '3B', rk: true },
  { id: 'vitiejo01', name: 'Joe Vitiello', pos: '1B', bats: 'R', age: 29, pa: 45, h: 8, double: 1, triple: 0, hr: 1, bb: 3, so: 10, hbp: 1, sb: 0, cs: 0, sec: 'LF' },
  { id: 'matthga02', name: 'Gary Matthews', pos: 'RF', bats: 'S', age: 24, pa: 45, h: 8, double: 0, triple: 0, hr: 0, bb: 9, so: 9, hbp: 0, sb: 2, cs: 0, sec: 'LF', rk: true },
  { id: 'newhada01', name: 'David Newhan', pos: '2B', bats: 'L', age: 25, pa: 44, h: 6, double: 1, triple: 0, hr: 2, bb: 1, so: 11, hbp: 0, sb: 2, cs: 1, sec: 'SS', rk: true },
  { id: 'cabrejo02', name: 'Jolbert Cabrera', pos: 'CF', bats: 'R', age: 26, pa: 39, h: 7, double: 1, triple: 0, hr: 0, bb: 1, so: 8, hbp: 1, sb: 3, cs: 0, sec: 'LF', rk: true },
  { id: 'morame01', name: 'Melvin Mora', pos: 'LF', bats: 'R', age: 27, pa: 39, h: 5, double: 0, triple: 0, hr: 0, bb: 4, so: 7, hbp: 1, sb: 2, cs: 1, sec: 'CF', rk: true },
  { id: 'perezed01', name: 'Eduardo Perez', pos: 'LF', bats: 'R', age: 29, pa: 39, h: 9, double: 1, triple: 0, hr: 1, bb: 4, so: 9, hbp: 0, sb: 0, cs: 0, sec: '1B' },
  { id: 'melusmi01', name: 'Mitch Meluskey', pos: 'C', bats: 'S', age: 25, pa: 38, h: 7, double: 1, triple: 0, hr: 1, bb: 5, so: 7, hbp: 0, sb: 1, cs: 0, sec: '1B', rk: true },
  { id: 'wittke01', name: 'Kevin Witt', pos: 'DH', bats: 'L', age: 23, pa: 37, h: 7, double: 1, triple: 0, hr: 1, bb: 2, so: 10, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'tarasto01', name: 'Tony Tarasco', pos: 'LF', bats: 'L', age: 28, pa: 35, h: 6, double: 2, triple: 0, hr: 1, bb: 4, so: 6, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
  { id: 'dellaja01', name: 'Jason Dellaero', pos: 'SS', bats: 'S', age: 22, pa: 35, h: 3, double: 0, triple: 0, hr: 0, bb: 1, so: 13, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
  { id: 'bordepa01', name: 'Pat Borders', pos: 'C', bats: 'R', age: 36, pa: 35, h: 8, double: 1, triple: 0, hr: 0, bb: 2, so: 7, hbp: 0, sb: 0, cs: 1 },
  { id: 'sweenma01', name: 'Mark Sweeney', pos: '1B', bats: 'L', age: 29, pa: 35, h: 8, double: 2, triple: 0, hr: 1, bb: 4, so: 6, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
  { id: 'garcije01', name: 'Jesse Garcia', pos: 'SS', bats: 'R', age: 25, pa: 34, h: 6, double: 0, triple: 0, hr: 2, bb: 2, so: 3, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
  { id: 'martino01', name: 'Norberto Martin', pos: '2B', bats: 'R', age: 32, pa: 33, h: 8, double: 1, triple: 0, hr: 0, bb: 1, so: 5, hbp: 0, sb: 0, cs: 0, sec: 'SS' },
  { id: 'lennopa01', name: 'Pat Lennon', pos: 'LF', bats: 'R', age: 31, pa: 32, h: 8, double: 2, triple: 0, hr: 1, bb: 3, so: 10, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
  { id: 'lukema01', name: 'Matt Luke', pos: '1B', bats: 'L', age: 28, pa: 32, h: 7, double: 1, triple: 0, hr: 2, bb: 2, so: 8, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
  { id: 'knorrra01', name: 'Randy Knorr', pos: 'C', bats: 'R', age: 30, pa: 31, h: 6, double: 2, triple: 0, hr: 1, bb: 1, so: 7, hbp: 0, sb: 0, cs: 0, sec: '1B' },
  { id: 'coraal01', name: 'Alex Cora', pos: 'SS', bats: 'L', age: 23, pa: 31, h: 4, double: 1, triple: 0, hr: 0, bb: 1, so: 5, hbp: 1, sb: 0, cs: 0, sec: '2B', rk: true },
  { id: 'liniaco01', name: 'Cole Liniak', pos: '3B', bats: 'R', age: 22, pa: 30, h: 7, double: 2, triple: 0, hr: 0, bb: 1, so: 4, hbp: 0, sb: 0, cs: 1, sec: '1B', rk: true },
  { id: 'martisa01', name: 'Sandy Martinez', pos: 'C', bats: 'L', age: 28, pa: 30, h: 6, double: 2, triple: 0, hr: 0, bb: 3, so: 8, hbp: 0, sb: 0, cs: 0, sec: '1B' },
  { id: 'ryanro02', name: 'Rob Ryan', pos: 'RF', bats: 'L', age: 26, pa: 30, h: 7, double: 1, triple: 0, hr: 2, bb: 1, so: 8, hbp: 0, sb: 0, cs: 0, sec: 'LF', rk: true },
  { id: 'dalesma01', name: 'Mark Dalesandro', pos: 'C', bats: 'R', age: 31, pa: 29, h: 7, double: 1, triple: 0, hr: 1, bb: 0, so: 2, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'woodwch01', name: 'Chris Woodward', pos: 'SS', bats: 'R', age: 23, pa: 29, h: 6, double: 1, triple: 0, hr: 0, bb: 2, so: 6, hbp: 0, sb: 0, cs: 0, sec: '2B', rk: true },
  { id: 'levisje01', name: 'Jesse Levis', pos: 'C', bats: 'L', age: 31, pa: 29, h: 7, double: 0, triple: 0, hr: 0, bb: 3, so: 3, hbp: 1, sb: 0, cs: 0, sec: '1B' },
  { id: 'portebo03', name: 'Bo Porter', pos: 'LF', bats: 'R', age: 26, pa: 29, h: 5, double: 1, triple: 0, hr: 0, bb: 2, so: 13, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
  { id: 'gibsode01', name: 'Derrick Gibson', pos: 'RF', bats: 'R', age: 24, pa: 29, h: 7, double: 1, triple: 0, hr: 1, bb: 0, so: 6, hbp: 1, sb: 0, cs: 0, sec: 'LF', rk: true },
  { id: 'whitema01', name: 'Mark Whiten', pos: 'LF', bats: 'S', age: 32, pa: 28, h: 6, double: 1, triple: 0, hr: 1, bb: 3, so: 6, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
  { id: 'powelda01', name: 'Dante Powell', pos: 'CF', bats: 'R', age: 25, pa: 28, h: 6, double: 2, triple: 0, hr: 1, bb: 3, so: 6, hbp: 0, sb: 1, cs: 1, sec: 'LF', rk: true },
  { id: 'brownde02', name: 'Dee Brown', pos: 'LF', bats: 'L', age: 21, pa: 27, h: 2, double: 0, triple: 0, hr: 0, bb: 2, so: 7, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
  { id: 'hemphbr01', name: 'Bret Hemphill', pos: 'C', bats: 'S', age: 27, pa: 27, h: 3, double: 0, triple: 0, hr: 0, bb: 4, so: 4, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'garciam01', name: 'Amaury Garcia', pos: '2B', bats: 'R', age: 24, pa: 27, h: 6, double: 0, triple: 1, hr: 2, bb: 3, so: 11, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
  { id: 'coxda02', name: 'Darron Cox', pos: 'C', bats: 'R', age: 31, pa: 27, h: 6, double: 1, triple: 0, hr: 1, bb: 0, so: 5, hbp: 2, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'ortizda01', name: 'David Ortiz', pos: 'DH', bats: 'L', age: 23, pa: 25, h: 5, double: 1, triple: 0, hr: 1, bb: 3, so: 6, hbp: 0, sb: 0, cs: 0, sec: '1B' },
  { id: 'fernajo01', name: 'Jose Fernandez', pos: '3B', bats: 'R', age: 24, pa: 25, h: 5, double: 2, triple: 0, hr: 0, bb: 1, so: 7, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
];

/** Lanciatori disponibili sul mercato (ordinati per minutaggio). */
export const FREE_AGENT_PITCHERS_1999: HistPitLine[] = [
  { id: 'radinsc01', name: 'Scott Radinsky', role: 'RP', throws: 'L', age: 31, g: 43, gs: 0, outs: 83, h: 28, hr: 2, bb: 12, so: 20, hbp: 1, er: 11, w: 2, l: 1, sv: 3, fld: 56 },
  { id: 'wengedo01', name: 'Don Wengert', role: 'RP', throws: 'R', age: 29, g: 11, gs: 1, outs: 73, h: 34, hr: 4, bb: 8, so: 14, hbp: 1, er: 18, w: 0, l: 1, sv: 0, fld: 82 },
  { id: 'shumaan01', name: 'Anthony Shumaker', role: 'RP', throws: 'L', age: 26, g: 8, gs: 4, outs: 68, h: 23, hr: 3, bb: 14, so: 17, hbp: 1, er: 15, w: 0, l: 3, sv: 0, fld: 86, rk: true },
  { id: 'holtzmi01', name: 'Mike Holtz', role: 'RP', throws: 'L', age: 26, g: 28, gs: 0, outs: 67, h: 26, hr: 2, bb: 12, so: 20, hbp: 1, er: 15, w: 2, l: 3, sv: 0, fld: 82 },
  { id: 'callami01', name: 'Mickey Callaway', role: 'RP', throws: 'R', age: 24, g: 5, gs: 4, outs: 58, h: 30, hr: 2, bb: 14, so: 11, hbp: 0, er: 16, w: 1, l: 2, sv: 0, fld: 71, rk: true },
  { id: 'mcdowja01', name: 'Jack McDowell', role: 'RP', throws: 'R', age: 33, g: 4, gs: 4, outs: 57, h: 27, hr: 3, bb: 6, so: 13, hbp: 1, er: 13, w: 0, l: 4, sv: 0, fld: 65 },
  { id: 'barbebr02', name: 'Brian Barber', role: 'RP', throws: 'R', age: 26, g: 8, gs: 3, outs: 56, h: 27, hr: 4, bb: 8, so: 10, hbp: 1, er: 17, w: 1, l: 3, sv: 1, fld: 62 },
  { id: 'politcl01', name: 'Cliff Politte', role: 'RP', throws: 'R', age: 25, g: 13, gs: 0, outs: 53, h: 21, hr: 3, bb: 12, so: 13, hbp: 0, er: 13, w: 1, l: 0, sv: 0, fld: 66, rk: true },
  { id: 'busbymi01', name: 'Mike Busby', role: 'RP', throws: 'R', age: 26, g: 15, gs: 0, outs: 53, h: 21, hr: 2, bb: 9, so: 11, hbp: 2, er: 12, w: 0, l: 1, sv: 0, fld: 67 },
  { id: 'bennejo02', name: 'Joel Bennett', role: 'RP', throws: 'R', age: 29, g: 5, gs: 3, outs: 51, h: 25, hr: 9, bb: 8, so: 12, hbp: 0, er: 16, w: 2, l: 1, sv: 0, fld: 63, rk: true },
  { id: 'newmaal02', name: 'Alan Newman', role: 'RP', throws: 'L', age: 29, g: 18, gs: 0, outs: 47, h: 22, hr: 2, bb: 9, so: 20, hbp: 1, er: 12, w: 2, l: 2, sv: 0, fld: 69, rk: true },
  { id: 'almanar01', name: 'Armando Almanza', role: 'RP', throws: 'L', age: 26, g: 14, gs: 0, outs: 47, h: 8, hr: 1, bb: 9, so: 20, hbp: 1, er: 3, w: 0, l: 1, sv: 0, fld: 77, rk: true },
  { id: 'ryanke01', name: 'Ken Ryan', role: 'RP', throws: 'R', age: 30, g: 15, gs: 0, outs: 47, h: 16, hr: 2, bb: 12, so: 9, hbp: 1, er: 10, w: 1, l: 2, sv: 0, fld: 64 },
  { id: 'danekpa01', name: 'Pat Daneker', role: 'RP', throws: 'R', age: 23, g: 3, gs: 2, outs: 45, h: 14, hr: 1, bb: 6, so: 5, hbp: 0, er: 7, w: 0, l: 0, sv: 0, fld: 76, rk: true },
  { id: 'almonhe01', name: 'Hector Almonte', role: 'RP', throws: 'R', age: 23, g: 15, gs: 0, outs: 45, h: 20, hr: 1, bb: 6, so: 8, hbp: 0, er: 7, w: 0, l: 2, sv: 0, fld: 47, rk: true },
  { id: 'rainst01', name: 'Steve Rain', role: 'RP', throws: 'R', age: 24, g: 16, gs: 0, outs: 44, h: 28, hr: 1, bb: 7, so: 12, hbp: 1, er: 15, w: 0, l: 1, sv: 0, fld: 73, rk: true },
  { id: 'porzimi01', name: 'Mike Porzio', role: 'RP', throws: 'L', age: 26, g: 16, gs: 0, outs: 44, h: 21, hr: 5, bb: 10, so: 10, hbp: 0, er: 14, w: 0, l: 0, sv: 0, fld: 60, rk: true },
  { id: 'ohkato01', name: 'Tomo Ohka', role: 'RP', throws: 'R', age: 23, g: 8, gs: 2, outs: 39, h: 21, hr: 2, bb: 6, so: 8, hbp: 0, er: 9, w: 1, l: 2, sv: 0, fld: 66, rk: true },
  { id: 'penaju01', name: 'Juan Pena', role: 'RP', throws: 'R', age: 22, g: 2, gs: 2, outs: 39, h: 9, hr: 0, bb: 3, so: 15, hbp: 0, er: 1, w: 2, l: 0, sv: 0, fld: 73, rk: true },
  { id: 'bochtdo01', name: 'Doug Bochtler', role: 'RP', throws: 'R', age: 28, g: 12, gs: 0, outs: 39, h: 12, hr: 2, bb: 8, so: 8, hbp: 1, er: 8, w: 0, l: 0, sv: 0, fld: 68 },
  { id: 'grosski01', name: 'Kip Gross', role: 'RP', throws: 'R', age: 34, g: 11, gs: 1, outs: 38, h: 15, hr: 3, bb: 8, so: 9, hbp: 3, er: 11, w: 0, l: 2, sv: 0, fld: 70 },
  { id: 'harrire01', name: 'Reggie Harris', role: 'RP', throws: 'R', age: 30, g: 8, gs: 0, outs: 36, h: 10, hr: 1, bb: 8, so: 9, hbp: 1, er: 6, w: 0, l: 0, sv: 0, fld: 68 },
  { id: 'tamje01', name: 'Jeff Tam', role: 'RP', throws: 'R', age: 28, g: 10, gs: 0, outs: 35, h: 9, hr: 2, bb: 4, so: 7, hbp: 1, er: 7, w: 0, l: 0, sv: 0, fld: 60, rk: true },
  { id: 'rayke01', name: 'Ken Ray', role: 'RP', throws: 'R', age: 24, g: 13, gs: 0, outs: 34, h: 23, hr: 2, bb: 6, so: 0, hbp: 1, er: 11, w: 1, l: 0, sv: 0, fld: 75, rk: true },
  { id: 'runyase01', name: 'Sean Runyan', role: 'RP', throws: 'L', age: 25, g: 12, gs: 0, outs: 32, h: 9, hr: 2, bb: 5, so: 7, hbp: 1, er: 4, w: 0, l: 1, sv: 0, fld: 52 },
  { id: 'ojalaki01', name: 'Kirt Ojala', role: 'RP', throws: 'L', age: 30, g: 8, gs: 1, outs: 32, h: 14, hr: 1, bb: 6, so: 8, hbp: 0, er: 7, w: 0, l: 1, sv: 0, fld: 82 },
  { id: 'kingra01', name: 'Ray King', role: 'RP', throws: 'L', age: 25, g: 10, gs: 0, outs: 32, h: 11, hr: 2, bb: 10, so: 5, hbp: 1, er: 7, w: 0, l: 0, sv: 0, fld: 65, rk: true },
  { id: 'mcnicbr01', name: 'Brian McNichol', role: 'RP', throws: 'L', age: 25, g: 4, gs: 2, outs: 32, h: 15, hr: 4, bb: 7, so: 12, hbp: 1, er: 8, w: 0, l: 2, sv: 0, fld: 77, rk: true },
  { id: 'murrada02', name: 'Dan Murray', role: 'RP', throws: 'R', age: 25, g: 5, gs: 0, outs: 31, h: 13, hr: 4, bb: 6, so: 9, hbp: 1, er: 9, w: 0, l: 0, sv: 0, fld: 71, rk: true },
  { id: 'sparkje01', name: 'Jeff Sparks', role: 'RP', throws: 'R', age: 27, g: 8, gs: 0, outs: 30, h: 6, hr: 1, bb: 12, so: 17, hbp: 1, er: 6, w: 0, l: 0, sv: 1, fld: 78, rk: true },
  { id: 'bunchme01', name: 'Melvin Bunch', role: 'RP', throws: 'R', age: 27, g: 5, gs: 1, outs: 30, h: 20, hr: 3, bb: 7, so: 4, hbp: 0, er: 13, w: 0, l: 0, sv: 0, fld: 89, rk: true },
];
