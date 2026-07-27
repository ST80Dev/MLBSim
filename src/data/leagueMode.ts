import type { Team } from '../engine/types';

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
 * `ratings.ts` (scala "MLB", stelle fino a ~45M): il payroll medio di lega
 * (~193M) sta sotto (~77% del cap), cosi' esiste spazio aggregato per la
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

/** Import storico: squilibrio reale, cap MORBIDO (sforabile). */
export const HISTORICAL_MODE: LeagueMode = {
  source: 'historical',
  cap: { mode: 'soft', amount: DEFAULT_CAP_AMOUNT },
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
