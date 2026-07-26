import type { Team } from '../engine/types';

// ---------------------------------------------------------------------------
// Modalita' di lega e politica del salary cap.
//
// Decisione di design (vedi docs/franchise.md § Modalita' e squilibrio):
//   - Lega GENERATA: talento ~gaussiano centrato su 50, squadre di forza simile.
//     Ha senso un cap RIGIDO (la sandbox gestionale: parita' di partenza).
//   - Import STORICO: le rose reali NON sono bilanciate (le vincenti hanno
//     giocatori migliori). E' la verita' dello snapshot e va abbracciata, non
//     ri-bilanciata. Il cap qui e' MORBIDO (o disattivato): forzarlo falserebbe
//     la stagione reale.
//
// Questa e' la FONDAZIONE minima (tipi + utilita' sul monte-ingaggi); l'enforce
// vero e proprio (scambi/rinnovi che rispettano il cap) arriva col layer
// gestionale di Fase 2. `salaryFromOverall` gia' scala lo stipendio col talento,
// quindi una corazzata storica implica un monte-ingaggi alto: col cap morbido e'
// lecito, col cap rigido sarebbe fuori norma.
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

/** Tetto di riferimento dell'epoca "alta offesa anni '90/2000" (milioni). */
export const DEFAULT_CAP_AMOUNT = 120;

/** Lega generata: forze bilanciate, cap RIGIDO. */
export const GENERATED_MODE: LeagueMode = {
  source: 'generated',
  cap: { mode: 'hard', amount: DEFAULT_CAP_AMOUNT },
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
