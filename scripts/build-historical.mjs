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

const CORE = ['Teams', 'Batting', 'Pitching', 'People', 'Appearances', 'Fielding'];
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
  ANA: 'LAA', LAA: 'LAA', ARI: 'ARI', ATL: 'ATL', BAL: 'BAL', BOS: 'BOS',
  CHA: 'CWS', CHN: 'CHC', CIN: 'CIN', CLE: 'CLE', COL: 'COL',
  DET: 'DET', FLO: 'MIA', HOU: 'HOU', KCA: 'KCR', LAN: 'LAD',
  MIL: 'MIL', ML4: 'MIL', MIN: 'MIN', MON: 'WSH', WAS: 'WSH', NYA: 'NYY', NYN: 'NYM',
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

// Posizioni secondarie AMMESSE per ruolo primario (deve combaciare con
// engine/positions.ts SECONDARY_OPTIONS: nulla valida a runtime, quindi filtriamo
// qui per non generare secondarie illegali — invariante dei test generati).
const SECONDARY_OPTIONS = {
  C: ['1B'], '1B': ['3B', 'LF'], '2B': ['SS', '3B'], SS: ['2B', '3B'],
  '3B': ['1B', '2B', 'SS'], LF: ['RF', 'CF', '1B'], CF: ['LF', 'RF'],
  RF: ['LF', 'CF', '1B'], DH: ['1B', 'LF', 'RF', '3B', 'C'],
};
const SEC_MIN_GAMES = 10; // partite minime a una casella per considerarla "seconda posizione"
const SEC_FALLBACK_MAX_AGE = 33; // sotto: mono-ruolo prende una secondaria plausibile per adiacenza
// Seconda posizione REALE: la casella più giocata (oltre la primaria) tra quelle
// ammesse dall'archetipo, se il giocatore vi ha davvero giocato ≥ soglia. Per i DH
// è la loro "casa" difensiva (dove scendono in campo). Da Appearances (gAt).
function deriveSecondary(gAt, primary) {
  const opts = SECONDARY_OPTIONS[primary];
  if (!opts || !gAt) return null;
  let best = null, bestG = 0;
  for (const p of opts) {
    const g = gAt[p] ?? 0;
    if (g >= SEC_MIN_GAMES && g > bestG) { best = p; bestG = g; }
  }
  return best;
}

function ageOf(person, year) {
  const by = num(person.birthYear);
  if (!by) return 27; // fallback ragionevole
  const bm = num(person.birthMonth);
  return year - by - (bm >= 7 ? 1 : 0);
}

const batHand = (b) => (b === 'B' ? 'S' : b === 'L' ? 'L' : 'R');
const throwHand = (t) => (t === 'L' ? 'L' : 'R');

// Finestra Marcel (abilità ATTUALE da più stagioni, per non ingabbiare un
// giocatore in una singola annata storta). Pesi ANNO-DOMINANTI 3/2/1: l'anno di
// gioco è metà del peso, così le stelle del 1999 restano riconoscibili (i picchi
// non si spengono) mentre uno slump del veterano è cuscinettato dal biennio
// precedente. Include YEAR → un ROOKIE (senza anni prima) ricade sul solo anno di
// debutto, tarato sulle sue stats del 1999 (+ regressione per campione), poi
// evolve libero. NON guarda il FUTURO: nessuna preveggenza (docs/players-and-
// ratings.md § Potenziale come STIMA incerta — non sai in anticipo chi sboccerà).
const MARCEL = [
  { y: YEAR, w: 3 },
  { y: YEAR - 1, w: 2 },
  { y: YEAR - 2, w: 1 },
];

function main() {
  const teams = loadCsv('Teams').filter((t) => num(t.yearID) === YEAR);
  const battingAll = loadCsv('Batting');
  const pitchingAll = loadCsv('Pitching');
  const batting = battingAll.filter((r) => num(r.yearID) === YEAR);
  const pitching = pitchingAll.filter((r) => num(r.yearID) === YEAR);
  const appearAll = loadCsv('Appearances');
  const appear = appearAll.filter((r) => num(r.yearID) === YEAR);
  const fielding = loadCsv('Fielding').filter((r) => num(r.yearID) === YEAR);
  const peopleRows = loadCsv('People');
  const people = new Map(peopleRows.map((p) => [p.playerID, p]));

  // Totali per (playerID, anno) sull'intera finestra Marcel, per battuta e
  // lancio. Servono a stimare il TALENTO da più stagioni (non da un anno solo).
  const winYears = new Set(MARCEL.map((m) => m.y));

  // Apparizioni per casella su TUTTA LA CARRIERA fino all'anno di gioco (nessuna
  // preveggenza: solo yearID <= YEAR): la storia posizionale completa del giocatore,
  // per derivare la SECONDA posizione con ampia copertura — un veterano ha quasi
  // sempre giocato più caselle nel corso della carriera (es. un ex-SS ora stabile a
  // 3B, un ex-2B ora a 1B). La posizione PRIMARIA resta quella dell'anno (`appTot`).
  const appCareer = new Map(); // pid -> {C,1B,...,DH} partite sommate (carriera <= YEAR)
  for (const a of appearAll) {
    if (num(a.yearID) > YEAR) continue; // niente futuro
    const pid = a.playerID;
    const c = appCareer.get(pid) ?? { C: 0, '1B': 0, '2B': 0, '3B': 0, SS: 0, LF: 0, CF: 0, RF: 0, DH: 0 };
    c.C += num(a.G_c); c['1B'] += num(a.G_1b); c['2B'] += num(a.G_2b); c['3B'] += num(a.G_3b);
    c.SS += num(a.G_ss); c.LF += num(a.G_lf); c.CF += num(a.G_cf); c.RF += num(a.G_rf); c.DH += num(a.G_dh);
    appCareer.set(pid, c);
  }

  // Esperienza MLB PRIMA dell'anno di gioco (gate rookie, nessuna preveggenza: solo
  // yearID < YEAR). Rookie = quasi nessun track record → più regressione nel rating
  // (un mezzo anno caldo non diventa un OVR da stella). Soglie ~ rookie-eligibility MLB.
  const careerBatPA = new Map();
  for (const r of battingAll) {
    if (num(r.yearID) >= YEAR) continue;
    const pa = num(r.AB) + num(r.BB) + num(r.HBP) + num(r.SF) + num(r.SH);
    careerBatPA.set(r.playerID, (careerBatPA.get(r.playerID) ?? 0) + pa);
  }
  const careerPitOuts = new Map();
  for (const r of pitchingAll) {
    if (num(r.yearID) >= YEAR) continue;
    careerPitOuts.set(r.playerID, (careerPitOuts.get(r.playerID) ?? 0) + num(r.IPouts));
  }
  const ROOKIE_PA_MAX = 130; // ~ limite AB da rookie MLB
  const ROOKIE_OUTS_MAX = 150; // ~ 50 IP (limite IP da rookie MLB)
  const isRookieBat = (pid) => (careerBatPA.get(pid) ?? 0) < ROOKIE_PA_MAX;
  const isRookiePit = (pid) => (careerPitOuts.get(pid) ?? 0) < ROOKIE_OUTS_MAX;
  const batByYear = new Map(); // pid -> Map(anno -> totali battuta)
  for (const r of battingAll) {
    const y = num(r.yearID);
    if (!winYears.has(y)) continue;
    const pid = r.playerID;
    const m = batByYear.get(pid) ?? new Map();
    const c = m.get(y) ?? { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0, sf: 0, sh: 0 };
    c.ab += num(r.AB); c.h += num(r.H); c.d += num(r['2B']); c.t += num(r['3B']);
    c.hr += num(r.HR); c.bb += num(r.BB); c.so += num(r.SO); c.hbp += num(r.HBP);
    c.sb += num(r.SB); c.cs += num(r.CS); c.sf += num(r.SF); c.sh += num(r.SH);
    m.set(y, c); batByYear.set(pid, m);
  }
  const pitByYear = new Map(); // pid -> Map(anno -> totali lancio)
  for (const r of pitchingAll) {
    const y = num(r.yearID);
    if (!winYears.has(y)) continue;
    const pid = r.playerID;
    const m = pitByYear.get(pid) ?? new Map();
    const c = m.get(y) ?? { outs: 0, h: 0, er: 0, hr: 0, bb: 0, so: 0, hbp: 0 };
    c.outs += num(r.IPouts); c.h += num(r.H); c.er += num(r.ER); c.hr += num(r.HR);
    c.bb += num(r.BB); c.so += num(r.SO); c.hbp += num(r.HBP);
    m.set(y, c); pitByYear.set(pid, m);
  }

  // Rate Marcel di un battitore (per PA, pesati 5/4/3 e per minutaggio), riscalati
  // sul minutaggio dell'anno di gioco (pa99). Chi ha solo YEAR ricade su di esso.
  const marcelBat = (pid, pa99) => {
    const yt = batByYear.get(pid);
    const acc = { h: 0, d: 0, t: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0 };
    let denom = 0;
    for (const { y, w } of MARCEL) {
      const t = yt?.get(y);
      if (!t) continue;
      const pa = t.ab + t.bb + t.hbp + t.sf + t.sh;
      if (pa <= 0) continue;
      denom += w * pa;
      for (const k of Object.keys(acc)) acc[k] += w * t[k];
    }
    if (denom <= 0) return null;
    const s = (x) => Math.round((x / denom) * pa99);
    const h = s(acc.h), d = s(acc.d), t = s(acc.t), hr = s(acc.hr);
    // Coerenza: i singoli (h - extrabase) non possono essere negativi.
    const extra = d + t + hr;
    return {
      pa: pa99, h: Math.max(h, extra), double: d, triple: t, hr,
      bb: s(acc.bb), so: s(acc.so), hbp: s(acc.hbp), sb: s(acc.sb), cs: s(acc.cs),
    };
  };

  // Rate Marcel di un lanciatore (per BF), riscalati sul BF dell'anno di gioco.
  const marcelPit = (pid, bf99) => {
    const yt = pitByYear.get(pid);
    const acc = { h: 0, er: 0, hr: 0, bb: 0, so: 0, hbp: 0 };
    let denom = 0;
    for (const { y, w } of MARCEL) {
      const t = yt?.get(y);
      if (!t) continue;
      const bf = t.outs + t.h + t.bb + t.hbp;
      if (bf <= 0) continue;
      denom += w * bf;
      for (const k of Object.keys(acc)) acc[k] += w * t[k];
    }
    if (denom <= 0) return null;
    const s = (x) => Math.round((x / denom) * bf99);
    return { h: s(acc.h), er: s(acc.er), hr: s(acc.hr), bb: s(acc.bb), so: s(acc.so), hbp: s(acc.hbp) };
  };

  // Appearances per (playerID, teamID): giochi per casella difensiva.
  const appByKey = new Map();
  for (const a of appear) {
    appByKey.set(`${a.playerID}|${a.teamID}`, {
      C: num(a.G_c), '1B': num(a.G_1b), '2B': num(a.G_2b), '3B': num(a.G_3b),
      SS: num(a.G_ss), LF: num(a.G_lf), CF: num(a.G_cf), RF: num(a.G_rf),
      DH: num(a.G_dh), P: num(a.G_p),
    });
  }

  // --- DEDUP per PERSONA: un giocatore reale (playerID) = UNA voce -----------
  // Le stat sono di TUTTA la stagione (somma degli spezzoni su ogni squadra); il
  // giocatore è assegnato alla squadra dove ha giocato di più (PA per i
  // battitori, outs per i lanciatori). Niente doppioni tra rose e leaderboard, e
  // l'identità (playerID) resta stabile → gestibile anche negli anni successivi.

  const batTot = new Map(); // pid -> totali battuta full-season
  const batTeamPA = new Map(); // pid -> Map(teamID -> PA con quella squadra)
  for (const r of batting) {
    const pid = r.playerID;
    const c = batTot.get(pid) ?? { ab: 0, h: 0, d: 0, t: 0, hr: 0, bb: 0, so: 0, hbp: 0, sb: 0, cs: 0, sf: 0, sh: 0 };
    c.ab += num(r.AB); c.h += num(r.H); c.d += num(r['2B']); c.t += num(r['3B']);
    c.hr += num(r.HR); c.bb += num(r.BB); c.so += num(r.SO); c.hbp += num(r.HBP);
    c.sb += num(r.SB); c.cs += num(r.CS); c.sf += num(r.SF); c.sh += num(r.SH);
    batTot.set(pid, c);
    const pa = num(r.AB) + num(r.BB) + num(r.HBP) + num(r.SF) + num(r.SH);
    const m = batTeamPA.get(pid) ?? new Map();
    m.set(r.teamID, (m.get(r.teamID) ?? 0) + pa);
    batTeamPA.set(pid, m);
  }

  const pitTot = new Map();
  const pitTeamOuts = new Map();
  for (const r of pitching) {
    const pid = r.playerID;
    const c = pitTot.get(pid) ?? { w: 0, l: 0, g: 0, gs: 0, sv: 0, outs: 0, h: 0, er: 0, hr: 0, bb: 0, so: 0, hbp: 0 };
    c.w += num(r.W); c.l += num(r.L); c.g += num(r.G); c.gs += num(r.GS);
    c.sv += num(r.SV); c.outs += num(r.IPouts); c.h += num(r.H); c.er += num(r.ER);
    c.hr += num(r.HR); c.bb += num(r.BB); c.so += num(r.SO); c.hbp += num(r.HBP);
    pitTot.set(pid, c);
    const m = pitTeamOuts.get(pid) ?? new Map();
    m.set(r.teamID, (m.get(r.teamID) ?? 0) + num(r.IPouts));
    pitTeamOuts.set(pid, m);
  }

  // Apparizioni sommate su tutte le squadre: posizione primaria robusta.
  const appTot = new Map();
  for (const a of appear) {
    const pid = a.playerID;
    const c = appTot.get(pid) ?? { C: 0, '1B': 0, '2B': 0, '3B': 0, SS: 0, LF: 0, CF: 0, RF: 0, DH: 0, P: 0 };
    for (const s of [...POS_SLOTS, 'P']) c[s] += (appByKey.get(`${pid}|${a.teamID}`)?.[s] ?? 0);
    appTot.set(pid, c);
  }
  // (appByKey ha già i giochi per casella per squadra; qui li ri-uso sommando.)

  const primaryPosOf = (pid) => {
    const g = appTot.get(pid);
    if (!g) return null;
    let best = null, bestG = -1;
    for (const s of [...POS_SLOTS, 'P']) if (g[s] > bestG) { bestG = g[s]; best = s; }
    return bestG > 0 ? best : null;
  };
  const maxKey = (m) => {
    let best = null, bv = -1;
    for (const [k, v] of m) if (v > bv) { bv = v; best = k; }
    return best;
  };

  // -------------------------------------------------------------------------
  // DIFESA REALE (da Fielding.csv). Il tabellino di battuta non ha metriche
  // difensive → prima la difesa era un ARCHETIPO piatto per ruolo (ogni SS
  // uguale). Qui la individualizziamo dai dati reali, normalizzati PER RUOLO
  // (roster) rispetto ai pari-ruolo dell'annata (z-score → 70 = media di ruolo):
  //   - fielding ← Range Factor (PO+A)/9inn [range/attività] + errori [mani];
  //     + DP per gli interni (turning), + PB per i ricevitori (ricezione).
  //   - arm ← SOLO dove c'è dato reale: CS% per i ricevitori, assist per gli
  //     esterni. Interni/1B (nessun segnale di braccio affidabile) → archetipo.
  // I valori sono 40-100 PRE-stretch; l'importatore applica lo spread come al
  // solito. Chi ha pochi inning (< ~33) ricade sull'archetipo. Vedi import.ts.
  // -------------------------------------------------------------------------
  const fldPosOf = (rosterPos) => (['LF', 'CF', 'RF'].includes(rosterPos) ? 'OF' : rosterPos);
  // Aggrega Fielding per (pid, POS) sommando stint/righe.
  const fldAgg = new Map(); // `${pid}|${POS}` -> {po,a,e,dp,pb,sb,cs,inn}
  for (const f of fielding) {
    const k = `${f.playerID}|${f.POS}`;
    const c = fldAgg.get(k) ?? { po: 0, a: 0, e: 0, dp: 0, pb: 0, sb: 0, cs: 0, inn: 0 };
    c.po += num(f.PO); c.a += num(f.A); c.e += num(f.E); c.dp += num(f.DP);
    c.pb += num(f.PB); c.sb += num(f.SB); c.cs += num(f.CS); c.inn += num(f.InnOuts);
    fldAgg.set(k, c);
  }
  // Metriche grezze per giocatore (sul suo ruolo primario di roster).
  const rawDef = new Map(); // pid -> {pos, rf, err, dp9, pb9, csRate, arm9, inn}
  for (const pid of new Set([...batTot.keys()])) {
    const pos = primaryPosOf(pid);
    if (!pos || pos === 'P' || pos === 'DH') continue;
    const c = fldAgg.get(`${pid}|${fldPosOf(pos)}`);
    if (!c || c.inn < 400) continue; // < ~133 inning: campione difensivo instabile (RF flukey) → archetipo
    const chances = c.po + c.a + c.e;
    rawDef.set(pid, {
      pos,
      rf: ((c.po + c.a) * 27) / c.inn,
      err: chances > 0 ? c.e / chances : 0,
      dp9: (c.dp * 27) / c.inn,
      pb9: (c.pb * 27) / c.inn,
      csRate: c.sb + c.cs > 0 ? c.cs / (c.sb + c.cs) : null,
      arm9: (c.a * 27) / c.inn,
      inn: c.inn,
    });
  }
  // Baseline per RUOLO (media/sd dei pari-ruolo con abbastanza inning).
  const meanSd = (arr) => {
    if (!arr.length) return { m: 0, s: 1 };
    const m = arr.reduce((x, y) => x + y, 0) / arr.length;
    const s = Math.sqrt(arr.reduce((x, y) => x + (y - m) ** 2, 0) / arr.length) || 1;
    return { m, s };
  };
  const byPos = {};
  for (const d of rawDef.values()) (byPos[d.pos] ??= []).push(d);
  const base = {};
  for (const [pos, arr] of Object.entries(byPos)) {
    base[pos] = {
      rf: meanSd(arr.map((d) => d.rf)),
      err: meanSd(arr.map((d) => d.err)),
      dp9: meanSd(arr.map((d) => d.dp9)),
      pb9: meanSd(arr.map((d) => d.pb9)),
      cs: meanSd(arr.filter((d) => d.csRate != null).map((d) => d.csRate)),
      arm9: meanSd(arr.map((d) => d.arm9)),
    };
  }
  const clampZ = (z) => Math.max(-2.8, Math.min(2.8, z)); // cap più ampio → picchi più netti
  const z = (x, ms) => clampZ((x - ms.m) / ms.s);
  const roundR = (v) => Math.max(40, Math.min(100, Math.round(v)));
  // Deriva fielding/arm 40-100 (pre-stretch) dai dati reali; null = usa archetipo.
  const deriveDef = (pid) => {
    const d = rawDef.get(pid);
    if (!d) return { fld: null, arm: null };
    const b = base[d.pos];
    const IF = ['2B', '3B', 'SS'].includes(d.pos);
    let fld;
    if (d.pos === 'C') {
      // Ricevitore: le PO sono strikeout (non range) → pesa ricezione (PB) + errori.
      fld = 70 - 4 * z(d.pb9, b.pb9) - 3 * z(d.err, b.err);
    } else if (d.pos === '1B') {
      // Prima base: le PO sono throw RICEVUTI (contesto di squadra, non skill) → NON
      // usare il range factor. Vale l'AGGRESSIVITÀ/copertura (assist) + l'affidabilità
      // (pochi errori, lo scoop). Così un guanto d'oro come Grace non è sotto-valutato.
      fld = 70 + 5 * z(d.arm9, b.arm9) - 4 * z(d.err, b.err);
    } else {
      // Posizioni di RANGE (SS/2B/3B/OF): range factor (coeff più alto → più picchi) + errori.
      fld = 70 + 8 * z(d.rf, b.rf) - 3 * z(d.err, b.err);
      if (IF) fld += 1 * z(d.dp9, b.dp9); // turning dei doppi giochi (peso lieve: context-dipendente)
    }
    let arm = null;
    if (d.pos === 'C' && d.csRate != null) arm = 70 + 7 * z(d.csRate, b.cs);
    else if (['LF', 'CF', 'RF'].includes(d.pos)) arm = 70 + 7 * z(d.arm9, b.arm9);
    return { fld: roundR(fld), arm: arm == null ? null : roundR(arm) };
  };

  // DIFESA del LANCIATORE (POS=P in Fielding.csv): comebacker, coprire prima,
  // assist. Range Factor (PO+A/inn) + errori, normalizzati vs i lanciatori pari
  // campione (z-score → 70 media). Individualizza il fielding dei partenti (era
  // tutto 70): Maddux/Kenny Rogers elite, gli scarsi sotto. Chi ha pochi inning →
  // archetipo (70). Segnale rumoroso (poche palle giocate) → coefficiente prudente.
  const pitFieldRaw = new Map(); // pid -> {rf, err}
  for (const [key, c] of fldAgg) {
    if (!key.endsWith('|P') || c.inn < 400) continue;
    const pid = key.slice(0, -2);
    const chances = c.po + c.a + c.e;
    pitFieldRaw.set(pid, { rf: ((c.po + c.a) * 27) / c.inn, err: chances > 0 ? c.e / chances : 0 });
  }
  const pfRf = meanSd([...pitFieldRaw.values()].map((d) => d.rf));
  const pfErr = meanSd([...pitFieldRaw.values()].map((d) => d.err));
  const derivePitField = (pid) => {
    const d = pitFieldRaw.get(pid);
    if (!d) return null;
    return roundR(70 + 6 * z(d.rf, pfRf) - 2.5 * z(d.err, pfErr));
  };

  // Assegnazione unica alla squadra primaria.
  const teamBatCand = new Map(); // teamID -> [cand battitore]
  for (const [pid, s] of batTot) {
    const pos = primaryPosOf(pid);
    if (!pos || pos === 'P') continue; // lanciatore (anche se ha battuto in NL)
    const pa = s.ab + s.bb + s.hbp + s.sf + s.sh;
    if (pa < 1) continue;
    const teamID = maxKey(batTeamPA.get(pid));
    if (!teamID) continue;
    const p = people.get(pid) ?? {};
    const list = teamBatCand.get(teamID) ?? [];
    // La riga stat riflette il TALENTO su finestra Marcel (riscalato sulle PA
    // 1999): uno slump del 1999 è ribilanciato dal 1997/98. Il ruolo in rosa
    // resta deciso dalle PA 1999 (`pa`). Fallback difensivo alla riga secca.
    const line =
      marcelBat(pid, pa) ?? { pa, h: s.h, double: s.d, triple: s.t, hr: s.hr, bb: s.bb, so: s.so, hbp: s.hbp, sb: s.sb, cs: s.cs };
    list.push({
      pid, pos, pa,
      gAt: appTot.get(pid) ?? {},
      name: `${p.nameFirst ?? ''} ${p.nameLast ?? ''}`.trim() || pid,
      bats: batHand(p.bats),
      age: ageOf(p, YEAR),
      line,
    });
    teamBatCand.set(teamID, list);
  }

  const teamPitCand = new Map();
  for (const [pid, s] of pitTot) {
    if (s.outs < 1) continue;
    const pos = primaryPosOf(pid);
    if (pos && pos !== 'P') continue; // in realtà è un position player: non un lanciatore
    const teamID = maxKey(pitTeamOuts.get(pid));
    if (!teamID) continue;
    const p = people.get(pid) ?? {};
    const list = teamPitCand.get(teamID) ?? [];
    // Talento su finestra Marcel: blend dei rate concessi (K/BB/HR/hit/ER)
    // riscalati sui BF 1999. Carico (outs, gs) e record (w/l/sv) restano del 1999.
    const bf99 = s.outs + s.h + s.bb + s.hbp;
    const mb = marcelPit(pid, bf99);
    list.push({
      pid, ...s, ...(mb ?? {}),
      name: `${p.nameFirst ?? ''} ${p.nameLast ?? ''}`.trim() || pid,
      throws: throwHand(p.throws),
      age: ageOf(p, YEAR),
    });
    teamPitCand.set(teamID, list);
  }

  // Chi resta fuori da ogni rosa confluisce nel pool free agent (globale).
  const faBat = [];
  const faPit = [];

  function buildBatters(teamID) {
    const cand = (teamBatCand.get(teamID) ?? []).slice().sort((a, b) => b.pa - a.pa);

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

    const bLine = (c, pos) => {
      const def = deriveDef(c.pid); // difesa reale (null = archetipo di ruolo)
      const primary = pos ?? c.pos;
      // Seconda posizione dalla STORIA POSIZIONALE di CARRIERA (fino a quell'anno):
      // ampia copertura senza inventare nulla — la casella che ha davvero giocato.
      let sec = deriveSecondary(appCareer.get(c.pid), primary);
      // Fallback PLAUSIBILE (non-dato) per i mono-ruolo GIOVANI (≤33 anni, più
      // verosimilmente spostabili): la casella più naturale per adiacenza. I
      // veterani mono-ruolo restano fedeli (nessuna secondaria inventata).
      if (!sec && c.age <= SEC_FALLBACK_MAX_AGE) {
        const opts = SECONDARY_OPTIONS[primary];
        if (opts && opts.length) sec = opts[0];
      }
      return {
        id: c.pid, name: c.name, pos: primary, bats: c.bats, age: c.age, ...c.line,
        ...(sec ? { sec } : {}),
        ...(def.fld != null ? { fld: def.fld } : {}),
        ...(def.arm != null ? { arm: def.arm } : {}),
        ...(isRookieBat(c.pid) ? { rk: true } : {}),
      };
    };
    const lineup = POS_SLOTS.map((slot) => bLine(lineupSlots[slot], slot));

    const rest = cand.filter((c) => !used.has(c.pid));
    const bench = rest.slice(0, 5).map((c) => bLine(c));
    const reserveBatters = rest.slice(5).filter((c) => c.pa >= 40).slice(0, 5).map((c) => bLine(c));

    // Il resto (minutaggio reale ma fuori rosa) → pool free agent.
    const rosteredIds = new Set([...lineup, ...bench, ...reserveBatters].map((b) => b.id));
    for (const c of rest) if (!rosteredIds.has(c.pid) && c.pa >= 25) faBat.push(bLine(c));

    return { lineup, bench, reserveBatters };
  }

  function buildPitchers(teamID) {
    const cand = teamPitCand.get(teamID) ?? [];
    const line = (c, role) => {
      const fld = derivePitField(c.pid); // difesa reale del lanciatore (null = archetipo 70)
      return {
        id: c.pid, name: c.name, role, throws: c.throws, age: c.age,
        g: c.g, gs: c.gs, outs: c.outs, h: c.h, hr: c.hr, bb: c.bb, so: c.so,
        hbp: c.hbp, er: c.er, w: c.w, l: c.l, sv: c.sv,
        ...(fld != null ? { fld } : {}),
        ...(isRookiePit(c.pid) ? { rk: true } : {}),
      };
    };

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
    for (const c of reservePitchers) usedP.add(c.id);

    // Il resto (outs reali ma fuori staff) → pool free agent.
    for (const c of cand) if (!usedP.has(c.pid) && c.outs >= 30) faPit.push(line(c, c.gs >= 10 ? 'SP' : 'RP'));

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

  // Ordina il pool per minutaggio (i più rilevanti in cima).
  faBat.sort((a, b) => b.pa - a.pa);
  faPit.sort((a, b) => b.outs - a.outs);

  writeFileSync(join(LAHMAN_DIR, `season${YEAR}.built.json`), JSON.stringify({ built, faBat, faPit }, null, 0));
  emitTs(built);
  emitFreeAgents(faBat, faPit);
  console.log(`pool free agent: ${faBat.length} battitori + ${faPit.length} lanciatori`);
}

// --- serializzazione TS ----------------------------------------------------
function q(s) { return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`; }

function batObj(b) {
  const sec = b.sec ? `, sec: '${b.sec}'` : '';
  const def =
    (b.fld != null ? `, fld: ${b.fld}` : '') + (b.arm != null ? `, arm: ${b.arm}` : '');
  const rk = b.rk ? ', rk: true' : '';
  return `{ id: ${q(b.id)}, name: ${q(b.name)}, pos: '${b.pos}', bats: '${b.bats}', age: ${b.age}, pa: ${b.pa}, h: ${b.h}, double: ${b.double}, triple: ${b.triple}, hr: ${b.hr}, bb: ${b.bb}, so: ${b.so}, hbp: ${b.hbp}, sb: ${b.sb}, cs: ${b.cs}${sec}${def}${rk} }`;
}
function pitObj(p) {
  const fld = p.fld != null ? `, fld: ${p.fld}` : '';
  const rk = p.rk ? ', rk: true' : '';
  return `{ id: ${q(p.id)}, name: ${q(p.name)}, role: '${p.role}', throws: '${p.throws}', age: ${p.age}, g: ${p.g}, gs: ${p.gs}, outs: ${p.outs}, h: ${p.h}, hr: ${p.hr}, bb: ${p.bb}, so: ${p.so}, hbp: ${p.hbp}, er: ${p.er}, w: ${p.w}, l: ${p.l}, sv: ${p.sv}${fld}${rk} }`;
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
//
// DEDUP: ogni giocatore reale compare UNA volta sola, con le stat di TUTTA la
// stagione, sulla squadra dove ha giocato di più. \`id\` è il playerID Lahman:
// identità stabile (niente doppioni in classifica, gestibile negli anni). I
// giocatori fuori rosa confluiscono nel pool free agent (\`freeAgents${YEAR}.ts\`).
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
   *  l'archetipo di ruolo. \`arm\` c'è solo dove misurabile (ricevitori: CS%;
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

export const SEASON_${YEAR}: HistTeam[] = [
${teamBlocks.join(',\n')},
];
`;

  const out = join(ROOT, 'src', 'data', 'historical', `season${YEAR}.ts`);
  writeFileSync(out, header);
  console.log(`scritto ${out} (${built.length} squadre)`);
}

function emitFreeAgents(faBat, faPit) {
  const arr = (items, fn) => items.map((x) => `  ${fn(x)},`).join('\n');
  const header = `import type { HistBatLine, HistPitLine } from './season${YEAR}';

// ---------------------------------------------------------------------------
// Pool FREE AGENT storico — stagione ${YEAR}. GENERATO da
// \`scripts/build-historical.mjs\`: i giocatori reali con minutaggio significativo
// che NON entrano nelle 30 rose attive (dedup: un giocatore = una squadra
// primaria). Alimentano il mercato/draft della gestione (Fase 5): svincolati,
// riserve di lega, ricambio. \`id\` = playerID Lahman (identità stabile).
// ---------------------------------------------------------------------------

/** Battitori disponibili sul mercato (ordinati per minutaggio). */
export const FREE_AGENT_BATTERS_${YEAR}: HistBatLine[] = [
${arr(faBat, batObj)}
];

/** Lanciatori disponibili sul mercato (ordinati per minutaggio). */
export const FREE_AGENT_PITCHERS_${YEAR}: HistPitLine[] = [
${arr(faPit, pitObj)}
];
`;
  const out = join(ROOT, 'src', 'data', 'historical', `freeAgents${YEAR}.ts`);
  writeFileSync(out, header);
  console.log(`scritto ${out} (${faBat.length}+${faPit.length} free agent)`);
}

// --- entrypoint ------------------------------------------------------------
(async () => {
  if (!existsSync(LAHMAN_DIR)) mkdirSync(LAHMAN_DIR, { recursive: true });
  if (DO_DOWNLOAD) {
    for (const f of CORE) await download(f);
  }
  main();
})().catch((e) => { console.error(e.message); process.exit(1); });
