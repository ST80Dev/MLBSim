import type { Batter, Pitcher, Team } from '../engine/types';
import { clamp, makeRng } from '../engine/rng';
import { playerValue, overallOf } from '../engine/value';
import { assembleTeam } from './generator';
import { effectiveCap, teamPayroll } from './leagueMode';
import type { LeagueMode } from './leagueMode';
import { TARGET_BATTERS, TARGET_PITCHERS } from './offseason';

// ---------------------------------------------------------------------------
// VALUTAZIONE SCAMBI — il decisore umano→1 CPU (Fase 5A, step 5).
//
// Puro: nessuna dipendenza da UI/rete/RNG, non muta nulla. La CPU accetta o
// rifiuta una proposta in base a TRE vincoli (vedi docs/franchise.md § Scambi):
//   1. entrambe le rose restano CAP-LEGALI dopo lo scambio (tetto EFFETTIVO, o
//      almeno non peggiora una situazione gia' oltre il tetto);
//   2. EQUITA' di valore dal punto di vista della CPU (somma dei `playerValue`);
//   3. PREMIO DI CONSOLIDAMENTO: `playerValue` e' additivo con un pavimento, quindi
//      due giocatori sommano quasi sempre piu' di uno. Gli slot roster sono pero'
//      FINITI: concentrare valore in un giocatore LIBERA uno slot (bene per un
//      contender a rosa piena), frammentarlo ne OCCUPA di piu'. Il premio corregge
//      esattamente cio' che `playerValue` non vede. Vedi docs/franchise.md
//      § «playerValue è additivo → il premio di consolidamento».
//
// Regola del SOLO decisore: la riconciliazione del cap via pool NON ne ha bisogno
// (la' il valore additivo e' esattamente cio' che serve per lo scarico).
// ---------------------------------------------------------------------------

type Player = Batter | Pitcher;

/** Proposta di scambio dal punto di vista dell'UMANO (il proponente). */
export interface TradeProposal {
  /** Giocatori che l'umano CEDE alla CPU. */
  fromHuman: Player[];
  /** Giocatori che la CPU CEDE all'umano. */
  fromAI: Player[];
}

/** Contesto necessario alla valutazione (le due rose + politica di cap). */
export interface TradeContext {
  humanTeam: Team;
  aiTeam: Team;
  mode: LeagueMode;
  seed: number;
  year: number;
}

export type TradeVerdict =
  | 'accepted'
  | 'empty' //   proposta vuota da un lato: non e' uno scambio
  | 'humanCap' // la rosa umana sforerebbe il proprio tetto: proposta non valida
  | 'aiCap' //   la CPU sforerebbe il proprio tetto: rifiuta
  | 'unfair'; // equita' (con premio) insufficiente per la CPU

export interface TradeEvaluation {
  accepted: boolean;
  verdict: TradeVerdict;
  /** Motivazione leggibile (italiano), pronta per la UI. */
  reason: string;
  /** Valore netto GREZZO per la CPU: Σvalore(ricevuti) − Σvalore(ceduti). */
  rawDelta: number;
  /** Premio/sconto di consolidamento applicato (positivo se la CPU consolida). */
  premium: number;
  /** Valore netto per la CPU DOPO il premio (il numero su cui decide). */
  adjustedDelta: number;
  humanCapOk: boolean;
  aiCapOk: boolean;
}

/**
 * Valore-slot MASSIMO (punti overall-equivalenti) di uno slot roster liberato,
 * a rosa piena e da contender. E' vicino al PAVIMENTO del `playerValue` di un
 * singolo giocatore (~48): il senso e' che, a rosa piena, una testa in piu' oltre
 * il bisogno vale ~replacement, quindi consolidare due mediocri in una stella
 * "recupera" quasi il valore-pavimento di quella testa. Scalato poi da quanto la
 * rosa e' PIENA e COMPETITIVA (un ricostruttore, che i pezzi multipli li vuole,
 * non lo paga). Vedi docs/franchise.md § premio di consolidamento.
 */
export const SLOT_PREMIUM_MAX = 38;

/** Tolleranza di equita': la CPU accetta se `adjustedDelta ≥ −FAIRNESS_TOL`. */
export const FAIRNESS_TOL = 2;

/** Tutte le teste in rosa (attivi + depth). */
function rosterHeads(team: Team): number {
  return (
    team.lineup.length +
    team.bench.length +
    team.rotation.length +
    team.bullpen.length +
    team.reserveBatters.length +
    team.reservePitchers.length
  );
}

/** Media overall della rosa (segnale contender vs ricostruttore, scala 40-100). */
function rosterAvgOverall(team: Team): number {
  const all: Player[] = [
    ...team.lineup,
    ...team.bench,
    ...team.rotation,
    ...team.bullpen,
    ...team.reserveBatters,
    ...team.reservePitchers,
  ];
  if (all.length === 0) return 70;
  return all.reduce((s, p) => s + overallOf(p), 0) / all.length;
}

/**
 * Premio-per-slot che la CPU attribuisce a liberare/occupare uno slot roster.
 * Scala con:
 *   - PIENEZZA della rosa PRE-scambio (una rosa gia' piena valorizza lo slot
 *     liberato; una rosa magra vuole teste, non premia il consolidamento);
 *   - COMPETITIVITA' (media overall): un contender paga lo slot, un ricostruttore no.
 * A rosa magra o debole → ~0 (decide sul solo valore grezzo, additivo).
 */
function slotPremium(team: Team): number {
  const heads = rosterHeads(team);
  const THIN = 26; //           rosa attiva minima giocabile → nessun premio
  const FULL = TARGET_BATTERS + TARGET_PITCHERS; // 35: rosa piena → premio pieno
  const fullness = clamp((heads - THIN) / (FULL - THIN), 0, 1);
  // Contender ~76 di media → 1.3; ricostruttore ~66 → 0.6 (lineare in mezzo).
  const contention = 0.6 + 0.7 * clamp((rosterAvgOverall(team) - 66) / 10, 0, 1);
  return SLOT_PREMIUM_MAX * fullness * contention;
}

const sum = (ps: Player[]): number => ps.reduce((s, p) => s + playerValue(p), 0);
const salarySum = (ps: Player[]): number => ps.reduce((s, p) => s + p.salary, 0);

/**
 * Cap-legalita' di una squadra DOPO lo scambio: consentito se il nuovo monte
 * ingaggi sta sotto il proprio tetto effettivo, OPPURE — se gia' oltre — se lo
 * scambio non lo PEGGIORA (nessun aumento del payroll). Cosi' una squadra oltre
 * il muro puo' comunque scambiare per alleggerirsi, mai per appesantirsi.
 */
function capOk(prePayroll: number, postPayroll: number, cap: number): boolean {
  if (postPayroll <= cap + 1e-9) return true;
  return postPayroll <= prePayroll + 1e-9;
}

/**
 * Decide se la CPU accetta la proposta `fromHuman ⇄ fromAI`. Deterministico e
 * puro (non muta le squadre). L'ordine dei controlli — vuoto → cap umano → cap
 * CPU → equita' — assegna la motivazione piu' specifica.
 */
export function evaluateTrade(proposal: TradeProposal, ctx: TradeContext): TradeEvaluation {
  const { fromHuman, fromAI } = proposal;
  const { humanTeam, aiTeam, mode, seed, year } = ctx;

  const rawDelta = Math.round((sum(fromHuman) - sum(fromAI)) * 10) / 10;
  // Consolidamento: la CPU riceve `fromHuman` e cede `fromAI`. Se riceve MENO teste
  // di quante ne cede (fromAI.length > fromHuman.length) consolida → premio positivo.
  const freedSlots = fromAI.length - fromHuman.length;
  const premium = Math.round(slotPremium(aiTeam) * freedSlots * 10) / 10;
  const adjustedDelta = Math.round((rawDelta + premium) * 10) / 10;

  // Cap DOPO lo scambio (tetto effettivo per-squadra-per-anno).
  const humanPre = teamPayroll(humanTeam);
  const aiPre = teamPayroll(aiTeam);
  const humanPost = Math.round((humanPre - salarySum(fromHuman) + salarySum(fromAI)) * 10) / 10;
  const aiPost = Math.round((aiPre - salarySum(fromAI) + salarySum(fromHuman)) * 10) / 10;
  const humanCap = effectiveCap(mode, seed, humanTeam.id, year);
  const aiCap = effectiveCap(mode, seed, aiTeam.id, year);
  const humanCapOk = capOk(humanPre, humanPost, humanCap);
  const aiCapOk = capOk(aiPre, aiPost, aiCap);

  const base = { rawDelta, premium, adjustedDelta, humanCapOk, aiCapOk };

  if (fromHuman.length === 0 || fromAI.length === 0) {
    return {
      ...base,
      accepted: false,
      verdict: 'empty',
      reason: 'Uno scambio deve prevedere giocatori da entrambe le parti.',
    };
  }
  if (!humanCapOk) {
    return {
      ...base,
      accepted: false,
      verdict: 'humanCap',
      reason: `La tua rosa sforerebbe il tetto (monte ingaggi $${humanPost.toFixed(0)}M oltre $${humanCap.toFixed(0)}M).`,
    };
  }
  if (!aiCapOk) {
    return {
      ...base,
      accepted: false,
      verdict: 'aiCap',
      reason: `${aiTeam.abbrev} non puo' sforare il proprio tetto salariale con questo scambio.`,
    };
  }
  if (adjustedDelta < -FAIRNESS_TOL) {
    return {
      ...base,
      accepted: false,
      verdict: 'unfair',
      reason:
        premium > 0.05
          ? `${aiTeam.abbrev} valuta la proposta squilibrata a proprio sfavore, anche considerando lo slot liberato.`
          : `${aiTeam.abbrev} valuta la proposta squilibrata a proprio sfavore.`,
    };
  }
  return {
    ...base,
    accepted: true,
    verdict: 'accepted',
    reason:
      premium < -0.05
        ? `${aiTeam.abbrev} accetta: si tiene la stella e assorbe qualche pezzo in piu'.`
        : `${aiTeam.abbrev} accetta: lo scambio e' equo.`,
  };
}

// ---------------------------------------------------------------------------
// APPLICAZIONE DELLO SCAMBIO — puro, deterministico. Sposta i giocatori tra le due
// squadre e RICOMPONE entrambe (via `assembleTeam`) così restano schierabili anche
// se lo scambio tocca un titolare (niente buchi in lineup/rotazione). Non muta
// l'input: ritorna una nuova lega con le due squadre sostituite. La ricomposizione
// può riordinare lineup/rotazione (l'utente può poi rifinire dall'editor rosa).
// ---------------------------------------------------------------------------

const flatBat = (t: Team): Batter[] => [...t.lineup, ...t.bench, ...t.reserveBatters];
const flatPit = (t: Team): Pitcher[] => [...t.rotation, ...t.bullpen, ...t.reservePitchers];

function tradeRng(seed: number, teamId: string, year: number) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < teamId.length; i++) {
    h ^= teamId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return makeRng((seed ^ h ^ Math.imul(year + 1, 2654435761)) >>> 0);
}

export function applyTrade(
  league: Team[],
  humanId: string,
  aiId: string,
  giveIds: string[],
  getIds: string[],
  seed: number,
  year: number,
): Team[] {
  const human = league.find((t) => t.id === humanId);
  const ai = league.find((t) => t.id === aiId);
  if (!human || !ai) return league;
  const give = new Set(giveIds);
  const get = new Set(getIds);

  const hb = flatBat(human);
  const hp = flatPit(human);
  const ab = flatBat(ai);
  const ap = flatPit(ai);

  const giveBat = hb.filter((p) => give.has(p.id));
  const givePit = hp.filter((p) => give.has(p.id));
  const getBat = ab.filter((p) => get.has(p.id));
  const getPit = ap.filter((p) => get.has(p.id));

  const newHuman = assembleTeam(
    human,
    [...hb.filter((p) => !give.has(p.id)), ...getBat],
    [...hp.filter((p) => !give.has(p.id)), ...getPit],
    tradeRng(seed, humanId, year),
  );
  const newAi = assembleTeam(
    ai,
    [...ab.filter((p) => !get.has(p.id)), ...giveBat],
    [...ap.filter((p) => !get.has(p.id)), ...givePit],
    tradeRng(seed, aiId, year),
  );

  return league.map((t) => (t.id === humanId ? newHuman : t.id === aiId ? newAi : t));
}
