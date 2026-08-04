import type { HistBatLine, HistPitLine } from './season1998';

// ---------------------------------------------------------------------------
// Pool FREE AGENT storico — stagione 1998. GENERATO da
// `scripts/build-historical.mjs`: i giocatori reali con minutaggio significativo
// che NON entrano nelle 30 rose attive (dedup: un giocatore = una squadra
// primaria). Alimentano il mercato/draft della gestione (Fase 5): svincolati,
// riserve di lega, ricambio. `id` = playerID Lahman (identità stabile).
// ---------------------------------------------------------------------------

/** Battitori disponibili sul mercato (ordinati per minutaggio). */
export const FREE_AGENT_BATTERS_1998: HistBatLine[] = [
  { id: 'leiussc01', name: 'Scott Leius', pos: '3B', bats: 'R', age: 32, pa: 47, h: 8, double: 1, triple: 0, hr: 0, bb: 1, so: 7, hbp: 0, sb: 0, cs: 0, sec: 'SS' },
  { id: 'seguife01', name: 'Fernando Seguignol', pos: 'LF', bats: 'S', age: 23, pa: 46, h: 11, double: 4, triple: 0, hr: 2, bb: 3, so: 15, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
  { id: 'willire02', name: 'Reggie Williams', pos: 'LF', bats: 'S', age: 32, pa: 45, h: 13, double: 1, triple: 0, hr: 1, bb: 7, so: 11, hbp: 1, sb: 3, cs: 3, sec: 'CF', rk: true },
  { id: 'guillca01', name: 'Carlos Guillen', pos: '2B', bats: 'S', age: 22, pa: 42, h: 13, double: 1, triple: 1, hr: 0, bb: 3, so: 9, hbp: 0, sb: 2, cs: 0, sec: 'SS', rk: true },
  { id: 'garcica01', name: 'Carlos Garcia', pos: '2B', bats: 'R', age: 30, pa: 40, h: 9, double: 2, triple: 0, hr: 0, bb: 2, so: 6, hbp: 0, sb: 1, cs: 0, sec: 'SS' },
  { id: 'garcigu01', name: 'Guillermo Garcia', pos: 'C', bats: 'R', age: 26, pa: 38, h: 7, double: 2, triple: 0, hr: 2, bb: 2, so: 13, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'coraal01', name: 'Alex Cora', pos: 'SS', bats: 'L', age: 22, pa: 38, h: 4, double: 0, triple: 1, hr: 0, bb: 2, so: 8, hbp: 1, sb: 0, cs: 0, sec: '2B', rk: true },
  { id: 'bennega01', name: 'Gary Bennett', pos: 'C', bats: 'R', age: 26, pa: 37, h: 9, double: 0, triple: 0, hr: 0, bb: 5, so: 6, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'waltoje01', name: 'Jerome Walton', pos: 'LF', bats: 'R', age: 32, pa: 36, h: 10, double: 2, triple: 0, hr: 1, bb: 2, so: 6, hbp: 0, sb: 0, cs: 0, sec: 'CF' },
  { id: 'kirbywa01', name: 'Wayne Kirby', pos: 'RF', bats: 'L', age: 34, pa: 33, h: 7, double: 1, triple: 0, hr: 0, bb: 3, so: 5, hbp: 0, sb: 0, cs: 0, sec: 'CF' },
  { id: 'echevan01', name: 'Angel Echevarria', pos: '1B', bats: 'R', age: 27, pa: 33, h: 10, double: 3, triple: 0, hr: 1, bb: 2, so: 5, hbp: 1, sb: 0, cs: 0, sec: '3B', rk: true },
  { id: 'incavpe01', name: 'Pete Incaviglia', pos: 'LF', bats: 'R', age: 34, pa: 32, h: 7, double: 1, triple: 0, hr: 1, bb: 2, so: 9, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
  { id: 'lakerti01', name: 'Tim Laker', pos: '1B', bats: 'R', age: 28, pa: 32, h: 7, double: 1, triple: 0, hr: 1, bb: 2, so: 7, hbp: 0, sb: 0, cs: 1, sec: '3B' },
  { id: 'koskico01', name: 'Corey Koskie', pos: '3B', bats: 'L', age: 25, pa: 31, h: 4, double: 0, triple: 0, hr: 1, bb: 2, so: 10, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'willied01', name: 'Eddie Williams', pos: '1B', bats: 'R', age: 33, pa: 31, h: 6, double: 1, triple: 0, hr: 1, bb: 3, so: 7, hbp: 0, sb: 0, cs: 0, sec: '3B' },
  { id: 'santibe01', name: 'Benito Santiago', pos: 'C', bats: 'R', age: 33, pa: 30, h: 7, double: 1, triple: 0, hr: 1, bb: 2, so: 6, hbp: 0, sb: 0, cs: 0, sec: '1B' },
  { id: 'malloma01', name: 'Marty Malloy', pos: '2B', bats: 'L', age: 26, pa: 30, h: 5, double: 1, triple: 0, hr: 1, bb: 2, so: 2, hbp: 0, sb: 0, cs: 0, sec: 'SS', rk: true },
  { id: 'febleca01', name: 'Carlos Febles', pos: '2B', bats: 'R', age: 22, pa: 29, h: 10, double: 1, triple: 2, hr: 0, bb: 4, so: 7, hbp: 0, sb: 2, cs: 1, sec: 'SS', rk: true },
  { id: 'mientdo01', name: 'Doug Mientkiewicz', pos: '1B', bats: 'L', age: 24, pa: 29, h: 5, double: 1, triple: 0, hr: 0, bb: 4, so: 3, hbp: 0, sb: 1, cs: 1, sec: '3B', rk: true },
  { id: 'sanfoch01', name: 'Chance Sanford', pos: '3B', bats: 'L', age: 26, pa: 29, h: 4, double: 1, triple: 1, hr: 0, bb: 1, so: 6, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'nixontr01', name: 'Trot Nixon', pos: 'RF', bats: 'L', age: 24, pa: 28, h: 7, double: 1, triple: 0, hr: 0, bb: 1, so: 3, hbp: 0, sb: 0, cs: 0, sec: 'LF', rk: true },
  { id: 'tarasto01', name: 'Tony Tarasco', pos: 'LF', bats: 'L', age: 27, pa: 28, h: 5, double: 1, triple: 0, hr: 1, bb: 3, so: 5, hbp: 0, sb: 0, cs: 0, sec: 'RF' },
  { id: 'banksbr01', name: 'Brian Banks', pos: 'C', bats: 'S', age: 27, pa: 28, h: 6, double: 1, triple: 0, hr: 1, bb: 3, so: 7, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'shumpte01', name: 'Terry Shumpert', pos: '2B', bats: 'R', age: 31, pa: 28, h: 6, double: 1, triple: 0, hr: 1, bb: 2, so: 6, hbp: 0, sb: 0, cs: 0, sec: '3B' },
  { id: 'woodja02', name: 'Jason Wood', pos: '1B', bats: 'R', age: 28, pa: 27, h: 8, double: 2, triple: 0, hr: 1, bb: 3, so: 5, hbp: 0, sb: 0, cs: 1, sec: '3B', rk: true },
  { id: 'barremi01', name: 'Michael Barrett', pos: 'C', bats: 'R', age: 21, pa: 27, h: 7, double: 2, triple: 0, hr: 1, bb: 3, so: 6, hbp: 1, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'clybuda01', name: 'Danny Clyburn', pos: 'LF', bats: 'R', age: 24, pa: 26, h: 7, double: 0, triple: 0, hr: 1, bb: 1, so: 11, hbp: 0, sb: 0, cs: 0, sec: 'RF', rk: true },
  { id: 'ashlebi01', name: 'Billy Ashley', pos: 'DH', bats: 'R', age: 27, pa: 26, h: 6, double: 1, triple: 0, hr: 2, bb: 2, so: 9, hbp: 0, sb: 0, cs: 0, sec: 'LF' },
  { id: 'romerma01', name: 'Mandy Romero', pos: 'C', bats: 'S', age: 30, pa: 26, h: 4, double: 0, triple: 0, hr: 1, bb: 2, so: 8, hbp: 0, sb: 0, cs: 0, sec: '1B', rk: true },
  { id: 'kaplega01', name: 'Gabe Kapler', pos: 'RF', bats: 'R', age: 22, pa: 26, h: 5, double: 0, triple: 1, hr: 0, bb: 1, so: 4, hbp: 0, sb: 2, cs: 0, sec: 'LF', rk: true },
];

/** Lanciatori disponibili sul mercato (ordinati per minutaggio). */
export const FREE_AGENT_PITCHERS_1998: HistPitLine[] = [
  { id: 'ludwier01', name: 'Eric Ludwick', role: 'RP', throws: 'R', age: 26, g: 13, gs: 6, outs: 98, h: 45, hr: 8, bb: 19, so: 26, hbp: 1, er: 28, w: 1, l: 4, sv: 0, fld: 78, rk: true },
  { id: 'wardbr01', name: 'Bryan Ward', role: 'RP', throws: 'L', age: 26, g: 28, gs: 0, outs: 81, h: 30, hr: 4, bb: 7, so: 17, hbp: 0, er: 10, w: 1, l: 2, sv: 1, fld: 69, rk: true },
  { id: 'speieju01', name: 'Justin Speier', role: 'RP', throws: 'R', age: 24, g: 19, gs: 0, outs: 62, h: 27, hr: 7, bb: 13, so: 17, hbp: 0, er: 20, w: 0, l: 3, sv: 0, fld: 75, rk: true },
  { id: 'henrios01', name: 'Oscar Henriquez', role: 'RP', throws: 'R', age: 24, g: 15, gs: 0, outs: 60, h: 24, hr: 4, bb: 12, so: 19, hbp: 1, er: 18, w: 0, l: 0, sv: 0, fld: 64, rk: true },
  { id: 'whitema02', name: 'Matt Whiteside', role: 'RP', throws: 'R', age: 30, g: 10, gs: 0, outs: 54, h: 24, hr: 3, bb: 6, so: 12, hbp: 0, er: 13, w: 1, l: 1, sv: 0, fld: 66 },
  { id: 'sampsbe01', name: 'Benj Sampson', role: 'RP', throws: 'L', age: 23, g: 5, gs: 2, outs: 52, h: 10, hr: 0, bb: 6, so: 16, hbp: 1, er: 3, w: 1, l: 0, sv: 0, fld: 83, rk: true },
  { id: 'manueba01', name: 'Barry Manuel', role: 'RP', throws: 'R', age: 32, g: 13, gs: 0, outs: 47, h: 18, hr: 3, bb: 9, so: 13, hbp: 1, er: 9, w: 1, l: 0, sv: 0, fld: 60 },
  { id: 'wilkima01', name: 'Marc Wilkins', role: 'RP', throws: 'R', age: 27, g: 16, gs: 0, outs: 46, h: 14, hr: 1, bb: 7, so: 12, hbp: 1, er: 6, w: 0, l: 0, sv: 0, fld: 68 },
  { id: 'hammoch01', name: 'Chris Hammond', role: 'RP', throws: 'L', age: 32, g: 3, gs: 3, outs: 41, h: 19, hr: 2, bb: 6, so: 10, hbp: 1, er: 10, w: 0, l: 2, sv: 0, fld: 55 },
  { id: 'munozbo01', name: 'Bobby Munoz', role: 'RP', throws: 'R', age: 30, g: 9, gs: 1, outs: 36, h: 18, hr: 2, bb: 5, so: 6, hbp: 1, er: 12, w: 0, l: 0, sv: 0, fld: 74 },
  { id: 'harride01', name: 'Denny Harriger', role: 'RP', throws: 'R', age: 28, g: 4, gs: 2, outs: 36, h: 17, hr: 1, bb: 8, so: 3, hbp: 0, er: 9, w: 0, l: 3, sv: 0, fld: 62, rk: true },
  { id: 'wadete01', name: 'Terrell Wade', role: 'RP', throws: 'L', age: 25, g: 2, gs: 2, outs: 32, h: 12, hr: 2, bb: 5, so: 10, hbp: 0, er: 5, w: 1, l: 1, sv: 0, fld: 79 },
  { id: 'fordbe01', name: 'Ben Ford', role: 'RP', throws: 'R', age: 22, g: 8, gs: 0, outs: 30, h: 13, hr: 2, bb: 3, so: 5, hbp: 2, er: 11, w: 0, l: 0, sv: 0, fld: 64, rk: true },
];
