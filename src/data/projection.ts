import type { Batter, Pitcher } from '../engine/types';
import { deriveBatterStats, derivePitcherStats, pitcherOverall } from '../engine/ratings';
import { makeRng, clamp } from '../engine/rng';
import type { SeasonBat, SeasonPit } from './season';

// Proiezione delle statistiche di LEGA (le 29 squadre NON gestite) per la
// leaderboard. La squadra dell'utente usa le stat REALI accumulate dai box
// score (vedi season.ts); qui invece produciamo una linea *credibile* dai
// rating, senza simulare partita per partita ogni giocatore. Coerente col
// principio del progetto: caratteristiche -> peripherals proiettati; ERA/W e
// altri "risultati" galleggiano con la loro fortuna.
//
// DUE livelli di varianza, indipendenti:
//   1) STAGIONE su STAGIONE: ogni anno il giocatore ha un "profilo annata"
//      seedato che devia dal rating puro, con correlazioni realistiche (uno
//      slugger da 40 HR puo' fare <30 HR con media un filo piu' alta un anno, e
//      riallinearsi ai 40 HR con media piu' bassa l'anno dopo).
//   2) INTRA stagione: tanta varianza a inizio anno (piccolo campione), che si
//      RIALLINEA per costruzione al totale-annata entro la giornata `total`
//      (le curve di forma sono monotone e valgono 1 esatto a fine stagione).
//
// Puro e deterministico: nessuna dipendenza da UI o rete. Stesso seed/anno ->
// stessa proiezione. Si ricalcola al volo, niente da salvare per le altre 29
// squadre.

export const SEASON_GAMES = 162;

/** Carico stagionale atteso per ruolo lanciatore (gare, aperture, BF). */
const PITCH_LOAD: Record<string, { g: number; gs: number; bf: number }> = {
  SP: { g: 32, gs: 32, bf: 800 },
  RP: { g: 65, gs: 0, bf: 280 },
  CL: { g: 62, gs: 0, bf: 248 },
};

/** Presenze al piatto attese per fascia di impiego. */
export type BatTier = 'starter' | 'bench' | 'reserve';
const TIER_PA: Record<BatTier, number> = { starter: 660, bench: 320, reserve: 150 };

/** Stima dei punti guadagnati (ER) da una linea: ERA e' un risultato. */
function estimateER(h: number, hr: number, bb: number): number {
  return 0.32 * (h - hr) + 1.44 * hr + 0.11 * bb;
}

// ---------------------------------------------------------------------------
// Seed per giocatore-annata (FNV-1a sull'id, mescolato con seed lega + anno).
// ---------------------------------------------------------------------------
function keyNum(seed: number, id: string, year: number, salt: string): number {
  const s = id + '|' + salt;
  let h = (2166136261 ^ (seed >>> 0) ^ Math.imul(year, 2654435761)) >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Livello 1 — profilo annata (varianza stagione su stagione).
// ---------------------------------------------------------------------------
interface BatProfile {
  hrMult: number;
  xbhMult: number;
  avgMult: number;
  bbMult: number;
  kMult: number;
  speedMult: number;
  sbMult: number;
  paMult: number;
  rbiLuck: number;
}

// Estrazione a coda pesante: valore assoluto di una gaussiana, ma solo con
// probabilita' `p` (altrimenti 0). Serve per gli eventi RARI d'annata (career
// year / crollo): quasi sempre 0, ogni tanto un picco che sfonda le soglie.
function rareTail(rng: ReturnType<typeof makeRng>, p: number): number {
  return rng.next() < p ? Math.abs(rng.gauss(0, 1)) : 0;
}

// Modello d'annata a piu' fattori:
//  - form: livello GENERALE della stagione (molte stat su/giu' INSIEME: una vera
//    career-year alza H/HR/BB, una stagione-no li abbassa tutti);
//  - power: asse potenza<->contatto (potenza su -> media un filo giu', e vice);
//  - powerSpike/contactSpike: code RARE che producono le gemme (60+ HR, .400+),
//    non legate al rating tutti gli anni e poco diffuse;
//  - collapse: coda RARA di annata storta diffusa (molte stat giu' + meno impiego).
function batterProfile(seed: number, id: string, year: number): BatProfile {
  const rng = makeRng(keyNum(seed, id, year, 'bat-profile'));
  const form = clamp(rng.gauss(0, 1), -2.2, 2.2);
  const power = clamp(rng.gauss(0, 1), -2, 2);
  const powerSpike = rareTail(rng, 0.05); // ~5%: annata da bombe fuori scala
  const contactSpike = rareTail(rng, 0.05); // ~5%: annata da media fuori scala
  const collapse = rareTail(rng, 0.07); // ~7%: annata storta diffusa

  // Livello diffuso GENTILE (il max-su-600 amplifica gia' la coda ~3sigma, quindi
  // gli SD di routine restano piccoli). Le gemme sono ADDITIVE e limitate.
  const level = 1 + 0.05 * form - 0.14 * collapse;
  let paMult = clamp(1 + 0.03 * form + rng.gauss(0, 0.04) - 0.12 * collapse, 0.62, 1.06);
  if (rng.next() < 0.08) paMult *= clamp(rng.next() * 0.5 + 0.4, 0.35, 0.9); // infortunio

  return {
    hrMult: clamp(level + 0.13 * power + 0.2 * powerSpike + rng.gauss(0, 0.05), 0.5, 1.66),
    xbhMult: clamp(level + 0.1 * power + 0.11 * powerSpike + rng.gauss(0, 0.05), 0.55, 1.5),
    // Singoli: anti-correlata alla potenza (modesta) + rara gemma di contatto.
    avgMult: clamp(level - 0.04 * power + 0.16 * contactSpike + rng.gauss(0, 0.03), 0.86, 1.32),
    bbMult: clamp(level + rng.gauss(0, 0.1), 0.7, 1.4),
    kMult: clamp((1 + 0.05 * power - 0.1 * contactSpike) * (1 + rng.gauss(0, 0.09)), 0.7, 1.4),
    speedMult: clamp(1 + rng.gauss(0, 0.15), 0.6, 1.5),
    sbMult: clamp(1 + rng.gauss(0, 0.18), 0.5, 1.6),
    paMult,
    rbiLuck: clamp(level + rng.gauss(0, 0.05), 0.82, 1.25),
  };
}

interface PitProfile {
  kMult: number;
  bbMult: number;
  hrMult: number;
  hMult: number;
  eraLuck: number;
  ipMult: number;
  wLuck: number;
  svLuck: number;
}

function pitcherProfile(seed: number, id: string, year: number): PitProfile {
  const rng = makeRng(keyNum(seed, id, year, 'pit-profile'));
  const form = clamp(rng.gauss(0, 1), -2.2, 2.2); // livello generale d'annata
  const kSpike = rareTail(rng, 0.05); // ~5%: annata da K fuori scala
  const domSpike = rareTail(rng, 0.05); // ~5%: annata dominante (ERA giu')
  const collapse = rareTail(rng, 0.07); // ~7%: annata storta diffusa

  // levelBad > 1 = piu' punti concessi; il dominio raro (additivo) lo abbatte.
  const levelBad = clamp(1 - 0.04 * form + 0.13 * collapse - 0.1 * domSpike, 0.72, 1.5);
  const eraLuck = clamp(levelBad + rng.gauss(0, 0.08), 0.72, 1.55); // sequenze/BABIP/LOB: galleggia
  let ipMult = clamp(1 + 0.03 * form + rng.gauss(0, 0.05) - 0.13 * collapse, 0.6, 1.08);
  if (rng.next() < 0.1) ipMult *= clamp(rng.next() * 0.5 + 0.4, 0.35, 0.9);

  return {
    kMult: clamp(1 + 0.07 * form + 0.16 * kSpike + rng.gauss(0, 0.07), 0.72, 1.5),
    bbMult: clamp((1 - 0.05 * form) * (1 + rng.gauss(0, 0.12)), 0.68, 1.5),
    hrMult: clamp(levelBad + rng.gauss(0, 0.11), 0.6, 1.6),
    hMult: clamp(levelBad + rng.gauss(0, 0.06), 0.8, 1.28),
    eraLuck,
    ipMult,
    wLuck: clamp((1 / eraLuck) * (1 + rng.gauss(0, 0.1)), 0.6, 1.6), // buona ERA -> piu' W, + rumore
    svLuck: clamp(1 + rng.gauss(0, 0.12), 0.7, 1.3),
  };
}

// ---------------------------------------------------------------------------
// Livello 2 — curva di forma intra-stagione.
// Monotona crescente da 0 (giorno 0) a 1 esatto (giorno `total`): garantisce il
// RIALLINEAMENTO al totale-annata. Alterna tratti "caldi/freddi" (segmenti a
// velocita' seedata > 0), quindi il RATE (conteggio/partite) oscilla molto a
// inizio anno e si stabilizza. I conteggi restano monotoni (mai in negativo).
// ---------------------------------------------------------------------------
function formFrac(sn: number, gp: number, total: number, segments = 14, sigma = 0.6): number {
  if (gp <= 0) return 0;
  if (gp >= total) return 1;
  const rng = makeRng(sn);
  const speeds: number[] = [];
  let tot = 0;
  for (let i = 0; i < segments; i++) {
    const s = Math.exp(rng.gauss(0, sigma)); // sempre positivo -> monotonia
    speeds.push(s);
    tot += s;
  }
  const segLen = total / segments;
  const seg = Math.min(segments - 1, Math.floor(gp / segLen));
  let acc = 0;
  for (let i = 0; i < seg; i++) acc += speeds[i];
  acc += speeds[seg] * ((gp - seg * segLen) / segLen);
  return acc / tot;
}

const R = Math.round;

// ---------------------------------------------------------------------------
// Target annata (linea piena) — livello 1 applicato ai rating.
// ---------------------------------------------------------------------------
function batterFull(b: Batter, tier: BatTier, prof: BatProfile): SeasonBat {
  const pa = Math.max(1, R(TIER_PA[tier] * prof.paMult));
  const base = deriveBatterStats(b.ratings, pa);
  const singles0 = Math.max(0, base.h - base.double - base.triple - base.hr);

  // ALLOCAZIONE SUL BUDGET PA (rispetta le identita' per costruzione): ogni PA e'
  // UN esito. La varianza agisce sui RATE, poi il resto sono out su palla in gioco.
  // Cosi' e' impossibile far salire la media senza che salgano le hit, o avere piu'
  // SO degli out: i legami tra stat sono strutturali, non casuali.
  let rHR = (base.hr / pa) * prof.hrMult;
  let r2B = (base.double / pa) * prof.xbhMult;
  let r3B = (base.triple / pa) * prof.speedMult;
  let r1B = (singles0 / pa) * prof.avgMult;
  let rBB = (base.bb / pa) * prof.bbMult;
  let rSO = (base.so / pa) * prof.kMult;
  const rHBP = base.hbp / pa;
  // Vincolo: gli esiti (esclusi gli out su palla in gioco) sommano <= MAX_EVENT; il
  // resto sono out in gioco. Se sfora, si scala in proporzione: non si puo' far
  // salire TUTTO senza intaccare gli out (lo dice la matematica del gioco).
  const MAX_EVENT = 0.93;
  const sum = rHR + r2B + r3B + r1B + rBB + rSO + rHBP;
  if (sum > MAX_EVENT) {
    const k = MAX_EVENT / sum;
    rHR *= k; r2B *= k; r3B *= k; r1B *= k; rBB *= k; rSO *= k;
  }

  const bb = R(rBB * pa);
  const hbp = R(rHBP * pa);
  const hr = R(rHR * pa);
  const double = R(r2B * pa);
  const triple = R(r3B * pa);
  const single = R(r1B * pa);
  const so = R(rSO * pa);
  const h = single + double + triple + hr;
  const ab = Math.max(h + so, pa - bb - hbp); // identita': AB = PA - BB - HBP (>= H + SO)
  const sb = R(base.sb * prof.sbMult);
  const cs = R(base.cs * prof.sbMult);
  // Risultati (galleggiano): punti e RBI stimati dalla linea, con fortuna annata.
  const r = R(((h + bb) * 0.33 + hr * 0.5) * prof.rbiLuck);
  const rbi = R((hr * 1.65 + (h - hr) * 0.3) * prof.rbiLuck);
  const g = Math.min(SEASON_GAMES, R(pa / 4.3)); // non si giocano piu' di 162 gare
  return { g, ab, r, h, rbi, bb, so, double, triple, hr, sb, cs };
}

function pitcherFull(p: Pitcher, prof: PitProfile): SeasonPit {
  const load = PITCH_LOAD[p.role] ?? PITCH_LOAD.RP;
  const bf = Math.max(1, R(load.bf * prof.ipMult));
  const base = derivePitcherStats(p.ratings, bf);
  const bb = R(base.bb * prof.bbMult);
  const hr = R(base.hr * prof.hrMult);
  const h = Math.max(hr, R(base.h * prof.hMult)); // le hit includono gli HR
  // BF conservato: Outs = BF - H - BB - HBP. E gli SO sono un SOTTOINSIEME degli
  // out (non puoi eliminare per strike piu' degli out che registri).
  const outs = Math.max(1, bf - h - bb - base.hbp);
  const so = Math.min(R(base.so * prof.kMult), outs);
  const er = R(estimateER(h, hr, bb) * prof.eraLuck);
  const r = R(er * 1.08);
  const g = Math.max(1, R(load.g * prof.ipMult));
  const gs = R(load.gs * prof.ipMult);
  const ovr = pitcherOverall(p.ratings);
  const wp = clamp(0.5 + (ovr - 50) / 60, 0.35, 0.68);
  const dec = R((p.role === 'SP' ? 21 : p.role === 'CL' ? 6 : 8) * prof.ipMult);
  const w = clamp(R(dec * wp * prof.wLuck), 0, dec);
  const l = Math.max(0, dec - w);
  let svo = 0;
  let sv = 0;
  if (p.role === 'CL') {
    svo = Math.max(0, R((38 + (ovr - 55) * 0.4) * prof.ipMult));
    sv = R(svo * clamp(0.8 + (ovr - 55) / 120, 0.7, 0.93) * prof.svLuck);
  } else if (p.role === 'RP') {
    svo = R(6 * prof.svLuck);
    sv = R(svo * 0.5);
  }
  sv = Math.min(sv, svo);
  return { g, gs, outs, bf, h, r, er, bb, so, hr, w, l, sv, svo };
}

// ---------------------------------------------------------------------------
// API pubblica: linea proiettata CUMULATA al giorno `day` (0..total).
// day = partite gia' giocate. A day>=total ritorna il target annata esatto.
// ---------------------------------------------------------------------------
export interface ProjectOpts {
  seed: number;
  year: number;
  /** Partite giocate finora (0..total). */
  day: number;
  total?: number;
}

export function projectBatterSeason(b: Batter, tier: BatTier, opts: ProjectOpts): SeasonBat {
  const total = opts.total ?? SEASON_GAMES;
  const gp = clamp(opts.day, 0, total);
  const full = batterFull(b, tier, batterProfile(opts.seed, b.id, opts.year));
  if (gp <= 0) return { g: 0, ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0, double: 0, triple: 0, hr: 0, sb: 0, cs: 0 };
  const k = (salt: string) => keyNum(opts.seed, b.id, opts.year, salt);
  const fPlay = formFrac(k('play'), gp, total);
  const fH = formFrac(k('hits'), gp, total);
  const fPow = formFrac(k('power'), gp, total);
  const fBB = formFrac(k('walk'), gp, total);
  const fK = formFrac(k('so'), gp, total);
  const fSB = formFrac(k('steal'), gp, total);
  const hr = R(full.hr * fPow);
  const double = R(full.double * fPow);
  const triple = R(full.triple * fPow);
  const h = Math.max(R(full.h * fH), hr + double + triple);
  const ab = Math.max(R(full.ab * fPlay), h);
  return {
    g: R(full.g * fPlay),
    ab,
    r: R(full.r * fH),
    h,
    rbi: R(full.rbi * fH),
    bb: R(full.bb * fBB),
    so: R(full.so * fK),
    double,
    triple,
    hr,
    sb: R(full.sb * fSB),
    cs: R(full.cs * fSB),
  };
}

export function projectPitcherSeason(p: Pitcher, opts: ProjectOpts): SeasonPit {
  const total = opts.total ?? SEASON_GAMES;
  const gp = clamp(opts.day, 0, total);
  const full = pitcherFull(p, pitcherProfile(opts.seed, p.id, opts.year));
  if (gp <= 0) return { g: 0, gs: 0, outs: 0, bf: 0, h: 0, r: 0, er: 0, bb: 0, so: 0, hr: 0, w: 0, l: 0, sv: 0, svo: 0 };
  const k = (salt: string) => keyNum(opts.seed, p.id, opts.year, salt);
  const fWork = formFrac(k('work'), gp, total);
  const fH = formFrac(k('phits'), gp, total);
  const fER = formFrac(k('er'), gp, total);
  const fBB = formFrac(k('pbb'), gp, total);
  const fK = formFrac(k('pso'), gp, total);
  const fHR = formFrac(k('phr'), gp, total);
  const fDec = formFrac(k('dec'), gp, total);
  const hr = R(full.hr * fHR);
  const h = Math.max(R(full.h * fH), hr);
  const svo = R(full.svo * fDec);
  return {
    g: R(full.g * fWork),
    gs: R(full.gs * fWork),
    outs: R(full.outs * fWork),
    bf: R(full.bf * fWork),
    h,
    r: R(full.r * fER),
    er: R(full.er * fER),
    bb: R(full.bb * fBB),
    so: R(full.so * fK),
    hr,
    w: R(full.w * fDec),
    l: R(full.l * fDec),
    sv: Math.min(R(full.sv * fDec), svo),
    svo,
  };
}
