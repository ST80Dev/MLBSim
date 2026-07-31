import type { Batter, Pitcher, Position } from '../engine/types';
import type { BattingLine, PitchingLine } from '../engine/boxscore';
import { formatAvg, formatIp } from '../engine/boxscore';
import { RATING_AVG } from '../engine/ratings';
import type { SeasonBat, SeasonPit } from '../data/season';

// Righe statistiche mostrate nella UI, in tre modalita':
//  - 'game'   : statistiche della partita in corso (dato reale).
//  - 'season' : proiezione di stagione derivata dalle DOTI (player.stats, ~650
//               PA / 1000 BF). Non e' una stagione realmente giocata: e' il
//               rendimento atteso dalle caratteristiche. L'accumulo vero arriva
//               in Fase 4.
//  - 'last'   : stagione precedente — NON disponibile finche' non esiste uno
//               storico (Fase 4). La UI la tiene disabilitata.
export type StatsMode = 'game' | 'season' | 'last';

export interface StatItem {
  k: string;
  v: string;
}

export const STATS_MODE_LABEL: Record<StatsMode, string> = {
  game: 'Partita',
  season: 'Stagione',
  last: 'Carriera',
};

/** Iniziale per i pulsantini G/S/C. */
export const STATS_MODE_SHORT: Record<StatsMode, string> = {
  game: 'G',
  season: 'S',
  last: 'C',
};

export const STATS_MODE_TITLE: Record<StatsMode, string> = {
  game: 'Partita — statistiche di questa gara',
  season: 'Stagione — proiezione dalle doti',
  last: 'Carriera — disponibile con lo storico (Fase 4)',
};

/** Riga statistica di un battitore per la modalita' scelta. */
export function batterStatLine(
  mode: StatsMode,
  game: BattingLine | undefined,
  b?: Batter,
): StatItem[] {
  if (mode === 'season' && b) {
    const s = b.stats;
    const ab = Math.max(1, s.pa - s.bb - s.hbp);
    const singles = Math.max(0, s.h - s.double - s.triple - s.hr);
    const avg = s.h / ab;
    const obp = (s.h + s.bb + s.hbp) / Math.max(1, s.pa);
    const slg = (singles + 2 * s.double + 3 * s.triple + 4 * s.hr) / ab;
    // RBI: risultato di contesto, non un peripheral. Stima coerente con la
    // proiezione del motore (data/projection.ts): fuoricampo + quota da valide.
    const rbi = Math.round(s.hr * 1.65 + (s.h - s.hr) * 0.3);
    return [
      { k: 'AVG', v: formatAvg(avg) },
      { k: 'OBP', v: formatAvg(obp) },
      { k: 'SLG', v: formatAvg(slg) },
      { k: 'HR', v: String(s.hr) },
      { k: 'RBI', v: String(rbi) },
      { k: 'BB', v: String(s.bb) },
      { k: 'SO', v: String(s.so) },
      { k: 'SB', v: String(s.sb) },
    ];
  }
  const ab = game?.ab ?? 0;
  return [
    { k: 'AB', v: String(ab) },
    { k: 'R', v: String(game?.r ?? 0) },
    { k: 'H', v: String(game?.h ?? 0) },
    { k: 'HR', v: String(game?.hr ?? 0) },
    { k: 'RBI', v: String(game?.rbi ?? 0) },
    { k: 'BB', v: String(game?.bb ?? 0) },
    { k: 'SO', v: String(game?.so ?? 0) },
    { k: 'AVG', v: formatAvg(ab ? (game as BattingLine).h / ab : 0) },
  ];
}

/** Riga statistica di un lanciatore per la modalita' scelta. */
export function pitcherStatLine(
  mode: StatsMode,
  game: PitchingLine | undefined,
  p?: Pitcher,
): StatItem[] {
  if (mode === 'season' && p) {
    const s = p.stats;
    const outs = Math.max(1, s.bf - s.h - s.bb - s.hbp);
    const ip = outs / 3;
    return [
      { k: 'K/9', v: ((s.so / ip) * 9).toFixed(1) },
      { k: 'BB/9', v: ((s.bb / ip) * 9).toFixed(1) },
      { k: 'WHIP', v: ((s.h + s.bb) / ip).toFixed(2) },
      { k: 'HR/9', v: ((s.hr / ip) * 9).toFixed(1) },
      { k: 'SO', v: String(s.so) },
    ];
  }
  return [
    { k: 'IP', v: game ? formatIp(game.outs) : '0.0' },
    { k: 'H', v: String(game?.h ?? 0) },
    { k: 'R', v: String(game?.r ?? 0) },
    { k: 'ER', v: String(game?.er ?? 0) },
    { k: 'BB', v: String(game?.bb ?? 0) },
    { k: 'SO', v: String(game?.so ?? 0) },
  ];
}

// ---------------------------------------------------------------------------
// Righe/etichette statistiche del ROSTER e dei mini-popup (estratte da App.tsx).
// Pure: nessuna dipendenza da React. Le "linee" reali derivano dalle statistiche
// accumulate della stagione (SeasonBat/SeasonPit); la difesa e' una STIMA da
// ruolo + rating (gli eventi difensivi non sono simulati dal motore).
// ---------------------------------------------------------------------------

const clamp01 = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));
const round = (x: number): number => Math.round(x);

/** Stipendio annuale (milioni) come "12.5 M$". */
export function salaryFmt(m: number): string {
  return `${m.toFixed(1)} M$`;
}

/** Media/percentuale come .312 (senza zero iniziale). */
export function pct3(x: number): string {
  return x.toFixed(3).replace(/^0/, '');
}

/** Ruolo/i naturali del battitore (principale + eventuale secondario). */
export function rolesOf(b: Batter): string {
  return b.secondaryPosition ? `${b.position}/${b.secondaryPosition}` : b.position;
}

export interface BatLine {
  g: number; avg: number; obp: number; slg: number;
  h: number; d2: number; t3: number; hr: number; rbi: number; bb: number; so: number; sb: number;
}

export interface PitLine {
  w: number; l: number; g: number; gs: number; ip: number; ipOuts: number; era: number;
  h: number; bb: number; k: number; svo: number; sv: number; whip: number; k9: number;
}

/** IP in notazione baseball: interi + terzi (es. 200.1). */
export function ipFmt(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

/** Linea di battuta REALE dalle statistiche accumulate della stagione. */
export function seasonBatLine(a?: SeasonBat): BatLine {
  const g = a?.g ?? 0, ab = a?.ab ?? 0, h = a?.h ?? 0, bb = a?.bb ?? 0;
  const d2 = a?.double ?? 0, t3 = a?.triple ?? 0, hr = a?.hr ?? 0;
  const singles = h - d2 - t3 - hr;
  const tb = singles + 2 * d2 + 3 * t3 + 4 * hr;
  return {
    g,
    avg: ab ? h / ab : 0,
    obp: ab + bb ? (h + bb) / (ab + bb) : 0,
    slg: ab ? tb / ab : 0,
    h, d2, t3, hr, rbi: a?.rbi ?? 0, bb, so: a?.so ?? 0, sb: a?.sb ?? 0,
  };
}

/** Linea di lancio REALE dalle statistiche accumulate della stagione. */
export function seasonPitLine(a?: SeasonPit): PitLine {
  const outs = a?.outs ?? 0;
  const ip = outs / 3;
  const h = a?.h ?? 0, bb = a?.bb ?? 0, k = a?.so ?? 0, er = a?.er ?? 0;
  return {
    w: a?.w ?? 0, l: a?.l ?? 0, g: a?.g ?? 0, gs: a?.gs ?? 0, ip, ipOuts: outs,
    era: ip ? (er / ip) * 9 : 0,
    h, bb, k, svo: a?.svo ?? 0, sv: a?.sv ?? 0,
    whip: ip ? (h + bb) / ip : 0, k9: ip ? (k / ip) * 9 : 0,
  };
}

// Modello difensivo (stima): chances per gara per ruolo, quota di assist, tasso
// base di errore. Gli eventi difensivi non sono ancora simulati dal motore.
const DEF_MODEL: Record<string, { ch: number; aShare: number; err: number }> = {
  C: { ch: 7.5, aShare: 0.12, err: 0.006 },
  '1B': { ch: 9.2, aShare: 0.08, err: 0.006 },
  '2B': { ch: 4.6, aShare: 0.55, err: 0.02 },
  SS: { ch: 4.4, aShare: 0.62, err: 0.025 },
  '3B': { ch: 2.8, aShare: 0.65, err: 0.03 },
  LF: { ch: 2.0, aShare: 0.05, err: 0.01 },
  CF: { ch: 2.7, aShare: 0.05, err: 0.008 },
  RF: { ch: 2.1, aShare: 0.06, err: 0.01 },
  DH: { ch: 0, aShare: 0, err: 0 },
};

export interface DefLine {
  e: number;
  a: number;
  po: number;
  fp: number;
}

/** Stima difensiva (E/A/PO/FLD%) da ruolo, partite e rating di difesa. */
export function defLine(pos: Position, g: number, fielding: number): DefLine {
  const m = DEF_MODEL[pos] ?? DEF_MODEL.LF;
  const chances = m.ch * g;
  const a = round(chances * m.aShare);
  const po = round(chances - a);
  const e = round(chances * m.err * clamp01(1 - (fielding - RATING_AVG) / 60, 0.4, 1.7));
  const tc = po + a + e;
  return { e, a, po, fp: tc ? (po + a) / tc : 0 };
}
