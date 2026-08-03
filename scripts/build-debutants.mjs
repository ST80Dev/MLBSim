#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Pipeline nomi-debuttanti (Fase 5 — draft storico "nomi reali, rating ciechi").
//
// Genera `src/data/historical/debutants.ts`: per ogni anno di debutto reale, i
// NOMI dei giocatori che hanno esordito in MLB quell'anno (dall'archivio Lahman
// `People.csv`, campo `debut`). Servono al draft storico degli anni successivi al
// primo importato: i prospetti entrano con NOMI REALI ma RATING CIECHI (nessuna
// preveggenza — vedi docs/franchise.md § Draft in modalità STORICA). Qui non c'è
// nessuna statistica: solo nome, mano di battuta/lancio.
//
// Uso:
//   node scripts/build-debutants.mjs [--people <People.csv>] [--from 1998] [--to 2015] [--cap 200]
//
// `People.csv` si scarica come per build-historical.mjs (core Lahman). Deterministico.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const PEOPLE = String(flag('people', join(__dirname, '.lahman', 'People.csv')));
const FROM = Number(flag('from', 1998));
const TO = Number(flag('to', 2015));
const CAP = Number(flag('cap', 200));

// --- CSV parser (virgolette + virgole nei campi) ---------------------------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCsv(readFileSync(PEOPLE, 'utf8'));
const header = rows[0];
const col = (name) => header.indexOf(name);
const iId = col('playerID');
const iFirst = col('nameFirst');
const iLast = col('nameLast');
const iBats = col('bats');
const iThrows = col('throws');
const iDebut = col('debut');

const mapBats = (b) => (b === 'B' ? 'S' : b === 'L' ? 'L' : 'R');
const mapThrows = (t) => (t === 'L' ? 'L' : 'R');

const byYear = new Map();
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  const debut = row[iDebut];
  const first = (row[iFirst] || '').trim();
  const last = (row[iLast] || '').trim();
  if (!debut || !first || !last) continue;
  const year = Number(debut.slice(0, 4));
  if (!Number.isFinite(year) || year < FROM || year > TO) continue;
  if (!byYear.has(year)) byYear.set(year, []);
  byYear.get(year).push({
    id: row[iId],
    first,
    last,
    bats: mapBats(row[iBats]),
    throws: mapThrows(row[iThrows]),
  });
}

// Ordine stabile per playerID; cap per contenere la dimensione del bundle.
const years = [...byYear.keys()].sort((a, b) => a - b);
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
let body = '';
for (const y of years) {
  const list = byYear.get(y).sort((a, b) => a.id.localeCompare(b.id)).slice(0, CAP);
  const items = list
    .map((p) => `{ first: '${esc(p.first)}', last: '${esc(p.last)}', bats: '${p.bats}', throws: '${p.throws}' }`)
    .join(',\n    ');
  body += `  ${y}: [\n    ${items},\n  ],\n`;
}

const out = `// GENERATO da scripts/build-debutants.mjs — NON modificare a mano.
// Nomi reali dei debuttanti MLB per anno (fonte: Lahman People.csv, campo \`debut\`).
// Solo NOMI + mano: nessuna statistica. Alimentano il draft storico "nomi reali,
// rating ciechi" (docs/franchise.md § Draft in modalità STORICA). Nessuna
// preveggenza: i rating dei prospetti restano ciechi/stocastici.
import type { Hand, ThrowHand } from '../../engine/types';

export interface DebutName {
  first: string;
  last: string;
  bats: Hand;
  throws: ThrowHand;
}

/** anno di debutto → nomi reali dei debuttanti di quell'anno (ordine stabile). */
export const DEBUTANTS_BY_YEAR: Record<number, DebutName[]> = {
${body}};

/** Nomi reali dei debuttanti di un anno (undefined fuori dalla copertura reale). */
export function debutantsForYear(year: number): DebutName[] | undefined {
  return DEBUTANTS_BY_YEAR[year];
}
`;

const dest = join(ROOT, 'src', 'data', 'historical', 'debutants.ts');
writeFileSync(dest, out, 'utf8');
const total = years.reduce((s, y) => s + Math.min(byYear.get(y).length, CAP), 0);
console.log(`debutants.ts: ${years.length} anni (${years[0]}-${years[years.length - 1]}), ${total} nomi (cap ${CAP}/anno).`);
