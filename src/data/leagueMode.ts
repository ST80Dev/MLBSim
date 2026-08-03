import type { Team } from '../engine/types';
import { makeRng, clamp } from '../engine/rng';

// ---------------------------------------------------------------------------
// Modalita' di lega e politica del salary cap.
//
// Decisione di design (vedi docs/franchise.md § Salary cap):
//   - Lega GENERATA: talento ~gaussiano centrato su 70, con offset di squadra
//     (`teamTalent`). Cap a DUE CONFINI: un cap BASE "soft" (la norma) piu' un
//     margine di sforamento; non piu' un cap rigido unico (appiattirebbe la lega
//     negli anni). Il monte-ingaggi MEDIO e' sotto il base per calibrazione, ma
//     lo spread lascia sempre qualche squadra in "fascia tassa".
//   - Import STORICO: le rose reali NON sono bilanciate (le vincenti hanno
//     giocatori migliori). E' la verita' dello snapshot e va abbracciata: cap
//     MORBIDO (o off), forzarlo falserebbe la stagione reale.
//
// Questa e' la FONDAZIONE (tipi + utilita' sul monte-ingaggi + zone di cap per
// l'indicatore informativo). L'ENFORCE vero (riconciliazione al rollover via
// pool, margine ε per-squadra-per-anno, scambi/rinnovi) e' del layer di Fase 4/5.
// `salaryFor` scala lo stipendio con overall+eta', calibrato perche' il payroll
// medio stia sotto il cap base.
// ---------------------------------------------------------------------------

export type LeagueSource = 'generated' | 'historical';

/**
 * Politica del salary cap.
 *   - `hard`   : tetto invalicabile (nessuna multa, come da CLAUDE.md).
 *   - `soft`   : tetto indicativo, sforabile (import storico).
 *   - `off`    : nessun tetto.
 */
export type CapMode = 'hard' | 'soft' | 'off';

export interface SalaryCapPolicy {
  mode: CapMode;
  /** Tetto in milioni (ignorato se `mode === 'off'`). */
  amount: number;
}

export interface LeagueMode {
  source: LeagueSource;
  cap: SalaryCapPolicy;
}

/**
 * Cap BASE di riferimento (milioni), CALIBRATO sulla curva stipendi di
 * `ratings.ts` (scala "MLB", stelle fino a ~55M dopo l'OVR convesso): il payroll
 * medio di lega (~194M) sta sotto (~78% del cap), cosi' esiste spazio aggregato per la
 * redistribuzione (vedi docs/franchise.md § C'e' spazio aggregato). ~6
 * squadre/lega partono sopra il base (fascia tassa) e ~2-3 oltre il muro esterno
 * (le corazzate, riassorbite gradualmente al rollover). Ritararlo con lo script
 * di probe se si tocca `salaryFromOverall`/`youthFactor`.
 */
export const DEFAULT_CAP_AMOUNT = 250;

/**
 * Frazione di sforamento del cap base che definisce il MURO ESTERNO rigido
 * (`base × (1 + OVERAGE)`): il tetto assoluto che, a regime, nessuna squadra
 * supera. Il margine ε per-squadra-per-anno (Fase 4/5) vive DENTRO questa banda.
 */
export const CAP_OVERAGE = 0.25;

/** Muro esterno rigido (milioni) dal cap base. */
export function outerWall(base = DEFAULT_CAP_AMOUNT): number {
  return Math.round(base * (1 + CAP_OVERAGE) * 10) / 10;
}

/** Lega generata: cap BASE soft (norma) + muro esterno; sandbox a parita' morbida. */
export const GENERATED_MODE: LeagueMode = {
  source: 'generated',
  cap: { mode: 'soft', amount: DEFAULT_CAP_AMOUNT },
};

/** Import storico: cap PIÙ BASSO del generato (172 vs 250, muro 215 vs 312 — stesso
 *  rapporto ×1.25). Le rose reali sono "dense di scarti" e partono a ~110-195M (contro
 *  i ~200M dei generati, pieni di stelle garantite): un cap 250 non vincolava nulla e
 *  lasciava impilare campioni via scambi. 172/215 morde davvero — le corazzate reali
 *  (max ~195M) restano GIOCABILI (`capOk`: chi è sopra può alleggerirsi, mai
 *  appesantirsi) e si sgonfiano gradualmente ai rollover, ma non si può più ammassare
 *  talento. Muro derivato dal rapporto standard: nessun override, invariante salva. */
export const HISTORICAL_MODE: LeagueMode = {
  source: 'historical',
  cap: { mode: 'soft', amount: 172 },
};

/** Monte-ingaggi di una squadra (milioni): somma degli stipendi dei 25 attivi + depth. */
export function teamPayroll(team: Team): number {
  const players = [
    ...team.lineup,
    ...team.bench,
    ...team.rotation,
    ...team.bullpen,
    ...team.reserveBatters,
    ...team.reservePitchers,
  ];
  const total = players.reduce((s, p) => s + p.salary, 0);
  return Math.round(total * 10) / 10;
}

export interface CapReport {
  payroll: number;
  amount: number;
  mode: CapMode;
  /** Quanto si sfora il tetto (0 se sotto o cap `off`). */
  over: number;
  /** true se la rosa e' consentita: sotto il tetto, oppure cap non rigido. */
  allowed: boolean;
}

/** Verifica il monte-ingaggi di una squadra contro la politica di cap della modalita'. */
export function capReport(team: Team, mode: LeagueMode): CapReport {
  const payroll = teamPayroll(team);
  const { mode: capMode, amount } = mode.cap;
  const over = capMode === 'off' ? 0 : Math.max(0, Math.round((payroll - amount) * 10) / 10);
  const allowed = capMode !== 'hard' || over === 0;
  return { payroll, amount, mode: capMode, over, allowed };
}

/**
 * Zona di cap per l'INDICATORE informativo (modello a due confini):
 *   - `under` : payroll ≤ cap base (sotto la norma);
 *   - `tax`   : tra cap base e muro esterno (fascia tassa, sforamento tollerato);
 *   - `over`  : oltre il muro esterno (a regime lo si rientra al rollover; puo'
 *               capitare come condizione di PARTENZA di una corazzata generata).
 * Con cap `off` la zona e' sempre `under`.
 */
export type CapZone = 'under' | 'tax' | 'over';

export function capZone(payroll: number, mode: LeagueMode): CapZone {
  if (mode.cap.mode === 'off') return 'under';
  const base = mode.cap.amount;
  if (payroll <= base) return 'under';
  return payroll <= outerWall(base) ? 'tax' : 'over';
}

// ---------------------------------------------------------------------------
// CAP ENFORCE + MARGINE ε SEEDATO (Fase 5A)
//
// Il tetto EFFETTIVO di una squadra NON e' una costante globale: e'
//   tetto_effettivo(team, anno) = cap_base × (1 + ε)
// con ε margine stocastico ma DETERMINISTICO (seedato) e limitato. Cosi' la
// riconciliazione al rollover fa rientrare ogni squadra sotto il *suo* tetto, non
// sotto il cap base: ogni anno alcune stanno in "fascia tassa" e il tessuto non
// collassa in omogeneita'. Puro e SENZA STATO da salvare (niente soldi/multe):
// ε si ricalcola da (seed, teamId, anno). Vedi docs/franchise.md § Margine ε.
// ---------------------------------------------------------------------------

/** Limiti di ε. Il massimo coincide con `CAP_OVERAGE`: il tetto effettivo non
 *  supera MAI il muro esterno rigido (nessun runaway). */
export const EPS_MIN = -0.1;
export const EPS_MAX = CAP_OVERAGE; // 0.25

/** Hash FNV-1a di una stringa → uint32 (per foldare il teamId nel seed). */
function strHash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Uniforme [0,1) deterministica da (seed, teamId, salt). Salt distingue gli
 *  stream (componente persistente vs transitoria). */
function unit(seed: number, teamId: string, salt: number): number {
  const s = (seed ^ Math.imul(strHash(teamId) ^ (salt | 0), 2654435761)) >>> 0;
  return makeRng(s).next();
}

const lerp = (u: number, lo: number, hi: number): number => lo + u * (hi - lo);

/**
 * Margine di sforamento ε ∈ [EPS_MIN, EPS_MAX] per (squadra, anno). Somma di:
 *   - **transitoria** (dominante): rumore per-anno → stagioni-splurge occasionali,
 *     mobilita' piena. Varia con l'anno.
 *   - **persistente** (piccola): profilo di franchigia → accenno di identita'
 *     grande/piccolo mercato. Stabile negli anni (NON dipende dall'anno).
 * Il persistente e' piccolo apposta: da' colore, non destino (draft inverso +
 * aging garantiscono comunque il ricambio). Deterministico, nessuno stato salvato.
 */
export function capOverageMargin(seed: number, teamId: string, year: number): number {
  const persistent = lerp(unit(seed, teamId, 0x9e3779b1), -0.03, 0.07); // identita' franchigia
  const transient = lerp(unit(seed, teamId, Math.imul(year + 1, 0x85ebca6b)), -0.09, 0.18); // rumore anno
  return clamp(Math.round((persistent + transient) * 1000) / 1000, EPS_MIN, EPS_MAX);
}

/**
 * Tetto EFFETTIVO (milioni) di una squadra per l'anno dato: `base × (1 + ε)`.
 * Cap `off` → `Infinity` (nessun tetto). Per costruzione il risultato sta in
 * `[base × (1+EPS_MIN), muro esterno]`: non sfonda mai il muro.
 */
export function effectiveCap(mode: LeagueMode, seed: number, teamId: string, year: number): number {
  if (mode.cap.mode === 'off') return Infinity;
  const eps = capOverageMargin(seed, teamId, year);
  return Math.round(mode.cap.amount * (1 + eps) * 10) / 10;
}

/**
 * Sforamento del tetto EFFETTIVO (0 se sotto o cap `off`): l'eccedenza che la
 * riconciliazione al rollover dovra' scaricare nel pool di free agent. E' la
 * primitiva di enforce che consumeranno gli step 3 (pool) e 6 (offseason) di 5A.
 */
export function overEffectiveCap(
  payroll: number,
  mode: LeagueMode,
  seed: number,
  teamId: string,
  year: number,
): number {
  const cap = effectiveCap(mode, seed, teamId, year);
  return cap === Infinity ? 0 : Math.max(0, Math.round((payroll - cap) * 10) / 10);
}
