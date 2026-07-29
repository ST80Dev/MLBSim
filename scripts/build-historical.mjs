#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Pipeline import storico — dal dataset Lahman (Baseball Databank) a `HistTeam`.
//
// Genera `src/data/historical/season<ANNO>.ts` con le 30 rose reali di
// un'annata, nel formato che l'importatore (`import.ts`) inverte in rating 20-80
// e ri-simula. NON committiamo loghi/foto: solo dati statistici fattuali.
//
// Uso:
//   1. Scarica i CSV Lahman "core" in una cartella (default ./scripts/.lahman):
//        Teams.csv Batting.csv Pitching.csv People.csv Appearances.csv
//      Fonte: Baseball Databank (Chadwick Bureau), file `core/*.csv`.
//        node scripts/build-historical.mjs --download            # scarica da un mirror
//   2. Genera il dataset di un'annata:
//        node scripts/build-historical.mjs --year 1999 [--lahman <dir>]
//
// Selezione rosa (approssima la rosa reale con le regole del gioco):
//   - Battitori: posizione primaria da Appearances (G per casella, split OF).
//     Lineup = miglior titolare per PA a C/1B/2B/3B/SS + i 3 esterni + DH.
//     Bench e reserve = i successivi per PA.
//   - Lanciatori: SP (gs alti) -> rotazione (top 5 per outs); il rilievo con più
//     salvezze -> closer (CL); gli altri per outs -> bullpen; il resto -> reserve.
//   - Età alla stagione = anno - annoNascita - (meseNascita >= 7 ? 1 : 0).
//
// Deterministico: nessun RNG qui. L'unica stima incerta (potenziale) è
// nell'importatore, seedata per franchigia+annata.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- argomenti -------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const YEAR = Number(flag('year', 1999));
const LAHMAN_DIR = String(flag('lahman', join(__dirname, '.lahman')));
const DO_DOWNLOAD = flag('download', false);

const CORE = ['Teams', 'Batting', 'Pitching', 'People', 'Appearances'];
const MIRROR =
  'https://raw.githubusercontent.com/cbwinslow/baseballdatabank/master/core';

// --- CSV parser (gestisce virgolette e virgole nei campi) ------------------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const num = (v) => (v === '' || v == null ? 0 : Number(v));

async function download(name) {
  const url = `${MIRROR}/${name}.csv`;
  const dest = join(LAHMAN_DIR, `${name}.csv`);
  await new Promise((resolve, reject) => {
    const chunks = [];
    get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`${url} -> ${res.statusCode}`));
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { writeFileSync(dest, Buffer.concat(chunks)); resolve(); });
    }).on('error', reject);
  });
  console.log(`scaricato ${name}.csv`);
}

function loadCsv(name) {
  const p = join(LAHMAN_DIR, `${name}.csv`);
  if (!existsSync(p)) {
    throw new Error(
      `Manca ${p}. Scarica i CSV Lahman core oppure usa --download.`,
    );
  }
  return parseCsv(readFileSync(p, 'utf8'));
}

// --- mappatura Lahman teamID(anno) -> id franchigia del gioco ---------------
// Le franchigie del gioco sono le 30 moderne; le storiche vi si mappano 1:1
// (Expos->WSH, Devil Rays->TBR, Anaheim->LAA, Florida->MIA, ecc.).
const TEAM_TO_FRANCHISE = {
  ANA: 'LAA', ARI: 'ARI', ATL: 'ATL', BAL: 'BAL', BOS: 'BOS',
  CHA: 'CWS', CHN: 'CHC', CIN: 'CIN', CLE: 'CLE', COL: 'COL',
  DET: 'DET', FLO: 'MIA', HOU: 'HOU', KCA: 'KCR', LAN: 'LAD',
  MIL: 'MIL', MIN: 'MIN', MON: 'WSH', NYA: 'NYY', NYN: 'NYM',
  OAK: 'OAK', PHI: 'PHI', PIT: 'PIT', SDN: 'SDP', SEA: 'SEA',
  SFN: 'SFG', SLN: 'STL', TBA: 'TBR', TEX: 'TEX', TOR: 'TOR',
};

// Ordine fisso delle franchigie (deve combaciare con src/data/franchises.ts):
// così il file generato ha le squadre nell'ordine di lega/division.
const FRANCHISE_ORDER = [
  'BAL', 'BOS', 'NYY', 'TBR', 'TOR',
  'CWS', 'CLE', 'DET', 'KCR', 'MIN',
  'HOU', 'LAA', 'OAK', 'SEA', 'TEX',
  'ATL', 'MIA', 'NYM', 'PHI', 'WSH',
  'CHC', 'CIN', 'MIL', 'PIT', 'STL',
  'ARI', 'COL', 'LAD', 'SDP', 'SFG',
];

const POS_SLOTS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

function ageOf(person, year) {
  const by = num(person.birthYear);
  if (!by) return 27; // fallback ragionevole
  const bm = num(person.birthMonth);
  return year - by - (bm >= 7 ? 1 : 0);
}

const batHand = (b) => (b === 'B' ? 'S' : b === 'L' ? 'L' : 'R');
const throwHand = (t) => (t === 'L' ? 'L' : 'R');

function main() {
  const teams = loadCsv('Teams').filter((t) => num(t.yearID) === YEAR);
  const batting = loadCsv('Batting').filter((r) => num(r.yearID) === YEAR);
  const pitching = loadCsv('Pitching').filter((r) => num(r.yearID) === YEAR);
  const appear = loadCsv('Appearances').filter((r) => num(r.yearID) === YEAR);
  const peopleRows = loadCsv('People');
  const people = new Map(peopleRows.map((p) => [p.playerID, p]));

  // Appearances per (playerID, teamID): giochi per casella difensiva.
  const appByKey = new Map();
  for (const a of appear) {
    appByKey.set(`${a.playerID}|${a.teamID}`, {
      C: num(a.G_c), '1B': num(a.G_1b), '2B': num(a.G_2b), '3B': num(a.G_3b),
      SS: num(a.G_ss), LF: num(a.G_lf), CF: num(a.G_cf), RF: num(a.G_rf),
      DH: num(a.G_dh), P: num(a.G_p),
    });
  }

  // Somma degli "stint" (spezzoni) per giocatore in una squadra.
  function accumBatting(teamID) {
    const acc = new Map();
    for (const r of batting) {
      if (r.teamID !== teamID) continue;
      const k = r.playerID;
      const c = acc.get(k) ?? { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0, sf: 0, sh: 0 };
      c.ab += num(r.AB); c.h += num(r.H); c.d += num(r['2B']); c.t += num(r['3B']);
      c.hr += num(r.HR); c.bb += num(r.BB); c.so += num(r.SO); c.hbp += num(r.HBP);
      c.sb += num(r.SB); c.cs += num(r.CS); c.sf += num(r.SF); c.sh += num(r.SH);
      acc.set(k, c);
    }
    return acc;
  }
  function accumPitching(teamID) {
    const acc = new Map();
    for (const r of pitching) {
      if (r.teamID !== teamID) continue;
      const k = r.playerID;
      const c = acc.get(k) ?? { w: 0, l: 0, g: 0, gs: 0, sv: 0, outs: 0, h: 0, er: 0, hr: 0, bb: 0, so: 0, hbp: 0 };
      c.w += num(r.W); c.l += num(r.L); c.g += num(r.G); c.gs += num(r.GS);
      c.sv += num(r.SV); c.outs += num(r.IPouts); c.h += num(r.H); c.er += num(r.ER);
      c.hr += num(r.HR); c.bb += num(r.BB); c.so += num(r.SO); c.hbp += num(r.HBP);
      acc.set(k, c);
    }
    return acc;
  }

  function primaryPos(playerID, teamID) {
    const g = appByKey.get(`${playerID}|${teamID}`);
    if (!g) return null;
    let best = null, bestG = -1;
    for (const s of POS_SLOTS) {
      if (g[s] > bestG) { bestG = g[s]; best = s; }
    }
    // Se ha giocato quasi solo da lanciatore -> non è un position player.
    if (bestG <= 0) return null;
    return best;
  }

  function buildBatters(teamID) {
    const acc = accumBatting(teamID);
    const cand = [];
    for (const [pid, s] of acc) {
      const pa = s.ab + s.bb + s.hbp + s.sf + s.sh;
      if (pa < 1) continue;
      const pos = primaryPos(pid, teamID);
      if (!pos) continue; // lanciatore che ha battuto (NL): escluso dal lineup
      const p = people.get(pid) ?? {};
      const g = appByKey.get(`${pid}|${teamID}`) ?? {};
      cand.push({
        pid, pos, pa,
        gAt: g,
        name: `${p.nameFirst ?? ''} ${p.nameLast ?? ''}`.trim() || pid,
        bats: batHand(p.bats),
        age: ageOf(p, YEAR),
        line: {
          pa, h: s.h, double: s.d, triple: s.t, hr: s.hr,
          bb: s.bb, so: s.so, hbp: s.hbp, sb: s.sb, cs: s.cs,
        },
      });
    }
    cand.sort((a, b) => b.pa - a.pa);

    const used = new Set();
    const pick = (pred) => {
      let best = null;
      for (const c of cand) {
        if (used.has(c.pid) || !pred(c)) continue;
        if (!best || c.pa > best.pa) best = c;
      }
      if (best) used.add(best.pid);
      return best;
    };
    const pickMaxG = (slot) => {
      // Miglior esterno per giochi in quello slot (split OF), tie -> PA.
      let best = null;
      for (const c of cand) {
        if (used.has(c.pid)) continue;
        const gv = c.gAt[slot] ?? 0;
        if (gv <= 0) continue;
        if (!best || gv > best.gAt[slot] || (gv === best.gAt[slot] && c.pa > best.pa)) best = c;
      }
      if (best) used.add(best.pid);
      return best;
    };
    const fillBest = () => {
      for (const c of cand) if (!used.has(c.pid)) { used.add(c.pid); return c; }
      return null;
    };

    const lineupSlots = {};
    for (const slot of ['C', '1B', '2B', '3B', 'SS']) {
      lineupSlots[slot] = pick((c) => c.pos === slot) || pickMaxG(slot);
    }
    lineupSlots.CF = pickMaxG('CF') || pick((c) => c.pos === 'CF');
    lineupSlots.LF = pickMaxG('LF') || pick((c) => c.pos === 'LF');
    lineupSlots.RF = pickMaxG('RF') || pick((c) => c.pos === 'RF');
    lineupSlots.DH = pick((c) => c.gAt.DH > 0) || fillBest();
    // Eventuali caselle vuote (squadra atipica): riempi col miglior residuo.
    for (const slot of POS_SLOTS) if (!lineupSlots[slot]) lineupSlots[slot] = fillBest();

    const lineup = POS_SLOTS.map((slot) => {
      const c = lineupSlots[slot];
      return { name: c.name, pos: slot, bats: c.bats, age: c.age, ...c.line };
    });

    const rest = cand.filter((c) => !used.has(c.pid));
    const bench = rest.slice(0, 5).map((c) => ({ name: c.name, pos: c.pos, bats: c.bats, age: c.age, ...c.line }));
    const reserveBatters = rest.slice(5).filter((c) => c.pa >= 40).slice(0, 5)
      .map((c) => ({ name: c.name, pos: c.pos, bats: c.bats, age: c.age, ...c.line }));

    return { lineup, bench, reserveBatters };
  }

  function buildPitchers(teamID) {
    const acc = accumPitching(teamID);
    const cand = [];
    for (const [pid, s] of acc) {
      if (s.outs < 1) continue;
      const p = people.get(pid) ?? {};
      cand.push({
        pid, ...s,
        name: `${p.nameFirst ?? ''} ${p.nameLast ?? ''}`.trim() || pid,
        throws: throwHand(p.throws),
        age: ageOf(p, YEAR),
      });
    }
    const line = (c, role) => ({
      name: c.name, role, throws: c.throws, age: c.age,
      gs: c.gs, outs: c.outs, h: c.h, hr: c.hr, bb: c.bb, so: c.so,
      hbp: c.hbp, er: c.er, w: c.w, l: c.l, sv: c.sv,
    });

    const starters = cand.filter((c) => c.gs >= 10).sort((a, b) => b.outs - a.outs);
    const relievers = cand.filter((c) => c.gs < 10).sort((a, b) => b.outs - a.outs);

    const rotation = starters.slice(0, 5).map((c) => line(c, 'SP'));
    const usedP = new Set(starters.slice(0, 5).map((c) => c.pid));

    // Closer = rilievo con più salvezze (tie -> più outs).
    let closer = null;
    for (const c of relievers) {
      if (!closer || c.sv > closer.sv || (c.sv === closer.sv && c.outs > closer.outs)) closer = c;
    }
    const bullpen = [];
    if (closer && closer.sv > 0) { bullpen.push(line(closer, 'CL')); usedP.add(closer.pid); }
    for (const c of relievers) {
      if (usedP.has(c.pid)) continue;
      if (bullpen.length >= 6) break;
      bullpen.push(line(c, 'RP')); usedP.add(c.pid);
    }
    // Se nessun salvatore, il primo rilievo diventa comunque il closer nominale.
    if (!bullpen.some((p) => p.role === 'CL') && bullpen.length) bullpen[0].role = 'CL';

    const reservePitchers = cand
      .filter((c) => !usedP.has(c.pid) && c.outs >= 30)
      .sort((a, b) => b.outs - a.outs)
      .slice(0, 5)
      .map((c) => line(c, c.gs >= 10 ? 'SP' : 'RP'));

    return { pitchers: [...rotation, ...bullpen], reservePitchers };
  }

  // --- assembla le 30 squadre nell'ordine delle franchigie -------------------
  const franchiseToTeam = new Map();
  for (const t of teams) {
    const fid = TEAM_TO_FRANCHISE[t.teamID];
    if (fid) franchiseToTeam.set(fid, t.teamID);
  }

  const built = [];
  for (const fid of FRANCHISE_ORDER) {
    const teamID = franchiseToTeam.get(fid);
    if (!teamID) { console.warn(`ATTENZIONE: nessuna squadra ${YEAR} per ${fid}`); continue; }
    const { lineup, bench, reserveBatters } = buildBatters(teamID);
    const { pitchers, reservePitchers } = buildPitchers(teamID);
    built.push({ franchiseId: fid, lahmanTeam: teamID, lineup, bench, reserveBatters, pitchers, reservePitchers });
  }

  writeFileSync(join(LAHMAN_DIR, `season${YEAR}.built.json`), JSON.stringify(built, null, 0));
  emitTs(built);
}

// --- serializzazione TS ----------------------------------------------------
function q(s) { return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`; }

function batObj(b) {
  return `{ name: ${q(b.name)}, pos: '${b.pos}', bats: '${b.bats}', age: ${b.age}, pa: ${b.pa}, h: ${b.h}, double: ${b.double}, triple: ${b.triple}, hr: ${b.hr}, bb: ${b.bb}, so: ${b.so}, hbp: ${b.hbp}, sb: ${b.sb}, cs: ${b.cs} }`;
}
function pitObj(p) {
  return `{ name: ${q(p.name)}, role: '${p.role}', throws: '${p.throws}', age: ${p.age}, gs: ${p.gs}, outs: ${p.outs}, h: ${p.h}, hr: ${p.hr}, bb: ${p.bb}, so: ${p.so}, hbp: ${p.hbp}, er: ${p.er}, w: ${p.w}, l: ${p.l}, sv: ${p.sv} }`;
}

function emitTs(built) {
  const arr = (items, fn, indent) =>
    items.length
      ? `[\n${items.map((x) => `${indent}  ${fn(x)},`).join('\n')}\n${indent}]`
      : '[]';

  const teamBlocks = built.map((t) => {
    const parts = [
      `    franchiseId: '${t.franchiseId}',`,
      `    season: ${YEAR},`,
      `    batters: ${arr(t.lineup, batObj, '    ')},`,
    ];
    if (t.bench.length) parts.push(`    bench: ${arr(t.bench, batObj, '    ')},`);
    if (t.reserveBatters.length) parts.push(`    reserveBatters: ${arr(t.reserveBatters, batObj, '    ')},`);
    parts.push(`    pitchers: ${arr(t.pitchers, pitObj, '    ')},`);
    if (t.reservePitchers.length) parts.push(`    reservePitchers: ${arr(t.reservePitchers, pitObj, '    ')},`);
    return `  // ${t.franchiseId} (${t.lahmanTeam} ${YEAR})\n  {\n${parts.join('\n')}\n  }`;
  });

  const header = `import type { Hand, ThrowHand, Position, PitcherRole } from '../../engine/types';

// ---------------------------------------------------------------------------
// Dataset storico — stagione ${YEAR} (epoca-base "alta offesa anni '90/2000").
//
// GENERATO da \`scripts/build-historical.mjs\` dal Baseball Databank (Lahman):
// tabellini reali delle 30 squadre. NON modificare a mano: rigenera con
//   node scripts/build-historical.mjs --year ${YEAR}
//
// Pipeline: le stat reali sono la FONTE; l'importatore (\`import.ts\`) le inverte
// in rating 20-100 (\`engine/statsToRatings\`) e da lì ri-deriva/ri-simula. Nessun
// logo/foto (marchi protetti): solo dati statistici fattuali. La rosa è una
// APPROSSIMAZIONE (titolari per PA, ruoli da Appearances): prova di pipeline
// end-to-end, non il roster-move esatto giorno per giorno.
// ---------------------------------------------------------------------------

export interface HistBatLine {
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
}

export interface HistPitLine {
  name: string;
  role: PitcherRole;
  throws: ThrowHand;
  age: number;
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

export const SEASON_${YEAR}: HistTeam[] = [
${teamBlocks.join(',\n')},
];
`;

  const out = join(ROOT, 'src', 'data', 'historical', `season${YEAR}.ts`);
  writeFileSync(out, header);
  console.log(`scritto ${out} (${built.length} squadre)`);
}

// --- entrypoint ------------------------------------------------------------
(async () => {
  if (!existsSync(LAHMAN_DIR)) mkdirSync(LAHMAN_DIR, { recursive: true });
  if (DO_DOWNLOAD) {
    for (const f of CORE) await download(f);
  }
  main();
})().catch((e) => { console.error(e.message); process.exit(1); });
