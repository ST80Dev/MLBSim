import type { Batter, BatterRatings, Position, Team } from './types';
import { clampRating } from './ratings';

// Seconda posizione difensiva: struttura leggera e NON dinamica.
//
// - Ogni ruolo ha un insieme fisso di seconde posizioni PLAUSIBILI (niente
//   "ovunque"): un interbase puo' fare la seconda base, non l'esterno centro.
// - Se un giocatore viene schierato nella sua seconda posizione, cambia SOLO la
//   DIFESA (fielding): e' una skill legata al ruolo. Le altre doti (contatto,
//   potenza, occhio, velocita', braccio) sono del giocatore e restano.
// - La variazione dipende dalla "domanda difensiva" del ruolo: spostarsi verso
//   un ruolo piu' facile puo' anche far salire il fielding; verso uno piu'
//   difficile lo fa scendere. In piu' c'e' una penalita' di adattamento fissa
//   per il fatto di giocare fuori dal ruolo naturale ("variata, non per forza
//   in calo", ma di norma non e' un guadagno netto).

/** Seconde posizioni ammesse per ruolo principale. */
export const SECONDARY_OPTIONS: Partial<Record<Position, Position[]>> = {
  C: ['1B'],
  '1B': ['3B', 'LF'],
  '2B': ['SS', '3B'],
  SS: ['2B', '3B'],
  '3B': ['1B', '2B', 'SS'],
  LF: ['RF', 'CF', '1B'],
  CF: ['LF', 'RF'],
  RF: ['LF', 'CF', '1B'],
  // Il DH e' un bat-first con una vera casa difensiva d'angolo/ricevitore (vedi
  // DH_HOME_POSITIONS nel generatore): quando riprende il guanto gioca la'.
  DH: ['1B', 'LF', 'RF', '3B', 'C'],
};

/** Domanda difensiva del ruolo (alto = piu' difficile). */
const POS_FIELD_DEMAND: Record<Position, number> = {
  SS: 9,
  CF: 8,
  C: 8,
  '2B': 6,
  '3B': 5,
  RF: 3,
  LF: 2,
  '1B': 1,
  DH: 0,
  P: 0,
};

/** Penalita' fissa per giocare fuori dal ruolo naturale (punti di fielding). */
const ADAPT_PENALTY = 4;

/** Vero se `pos` e' un ruolo lecito per il giocatore (principale o secondario). */
export function canPlay(b: Batter, pos: Position): boolean {
  return pos === b.position || b.secondaryPosition === pos;
}

/** Fielding effettivo del battitore se schierato in `pos`. */
export function fieldingAtPosition(b: Batter, pos: Position): number {
  // Il ruolo 'DH' non e' una casa difensiva: la vera casa di un DH e' la sua
  // posizione secondaria (il ruolo che gioca quando riprende il guanto). Cosi'
  // difende bene la' e paga la penalita' d'adattamento solo altrove.
  const home = b.position === 'DH' && b.secondaryPosition ? b.secondaryPosition : b.position;
  if (pos === home) return b.ratings.fielding;
  const demandDelta = (POS_FIELD_DEMAND[home] ?? 0) - (POS_FIELD_DEMAND[pos] ?? 0);
  return clampRating(b.ratings.fielding + demandDelta - ADAPT_PENALTY);
}

/**
 * Doti del battitore come se giocasse in `pos`: cambia solo il fielding.
 * Nel ruolo naturale (o al DH, che non difende) ritorna le doti invariate.
 */
export function ratingsAtPosition(b: Batter, pos: Position): BatterRatings {
  if (pos === b.position || pos === 'DH') return b.ratings;
  return { ...b.ratings, fielding: fieldingAtPosition(b, pos) };
}

// ---------------------------------------------------------------------------
// Schieramento difensivo (alignment): quale ruolo occupa ciascun battitore.
// Rappresentato come mappa id -> posizione attiva, solo per chi NON e' nel ruolo
// naturale. Le operazioni mantengono un permutazione valida dei ruoli di campo.
// ---------------------------------------------------------------------------

export type Alignment = Record<string, Position>;

/** Posizione attualmente occupata dal battitore (naturale se non spostato). */
export function activePos(b: Batter, al: Alignment): Position {
  return al[b.id] ?? b.position;
}

/** Un giocatore puo' occupare un ruolo se e' il naturale, la sua seconda
 *  posizione, o il DH (che non richiede difesa: chiunque puo' farlo). */
export function canOccupy(b: Batter, pos: Position): boolean {
  return pos === 'DH' || b.position === pos || b.secondaryPosition === pos;
}

/**
 * Applica lo schieramento alla rosa: il lineup adotta le posizioni attive e la
 * difesa si rivaluta di conseguenza (fielding). Cosi' i consumatori che leggono
 * `batter.position` (box score, Diamond, motore) restano coerenti col cambio.
 */
export function applyAlignment(team: Team, al: Alignment): Team {
  const lineup = team.lineup.map((b) => {
    const pos = activePos(b, al);
    if (pos === b.position) return b;
    return { ...b, position: pos, ratings: ratingsAtPosition(b, pos) };
  });
  return { ...team, lineup };
}

/** Uno spostamento difensivo prodotto dal riallineamento (per la cronaca). */
export interface DefMove {
  b: Batter;
  from: Position;
  to: Position;
}

/** Costo di schierare `b` nella casella `slot` (basso = più naturale). */
function slotCost(b: Batter, slot: Position): number {
  if (slot === b.position) return 0; // resta dov'è (naturale o casella già coperta)
  if (b.secondaryPosition === slot) return 2; // seconda posizione: la sa giocare
  if (slot === 'DH') return 3; // chiunque può fare il DH (non difende)
  return 20; // fuori ruolo: ultima spiaggia
}

/**
 * Ri-assegna le caselle `slots` (il set difensivo VALIDO pre-sostituzione: le
 * stesse 9 posizioni di prima, così vale anche per una lega senza DH) ai titolari
 * `lineup`, col minimo di spostamenti, così ognuno gioca un ruolo che PUÒ coprire
 * (naturale o secondario). Serve dopo un pinch-hit/run o una sostituzione difensiva:
 * il subentrante NON eredita più ciecamente la casella di chi esce (niente
 * "ricevitore all'interbase"), va al suo ruolo e gli altri si spostano di
 * conseguenza. Greedy per domanda difensiva (caselle difficili prima), a parità di
 * costo preferisce il guanto migliore. Muta `lineup[].position` e ritorna gli
 * spostamenti effettivi (no-op esclusi). **Deterministico** (niente RNG) e usato
 * SOLO nel gioco interattivo (mai in `quickSim`/`autoStep`) → calibrazione intatta.
 */
export function realignDefense(lineup: Batter[], slots: Position[]): DefMove[] {
  // Caselle difficili prima (SS/CF/C…), il DH per ultimo (domanda 0): così i
  // ruoli chiave pescano il titolare giusto e l'avanzo finisce al DH.
  const order = [...slots].sort(
    (a, b) => (POS_FIELD_DEMAND[b] ?? 0) - (POS_FIELD_DEMAND[a] ?? 0),
  );
  const free = new Set(lineup);
  const assign = new Map<Batter, Position>();
  for (const slot of order) {
    let best: Batter | null = null;
    let bestCost = Infinity;
    let bestFld = -Infinity;
    for (const b of free) {
      const c = slotCost(b, slot);
      const f = fieldingAtPosition(b, slot);
      if (c < bestCost || (c === bestCost && f > bestFld)) {
        best = b;
        bestCost = c;
        bestFld = f;
      }
    }
    if (best) {
      assign.set(best, slot);
      free.delete(best);
    }
  }
  const moves: DefMove[] = [];
  for (const b of lineup) {
    const to = assign.get(b);
    if (to && to !== b.position) {
      moves.push({ b, from: b.position, to });
      b.position = to;
    }
  }
  return moves;
}

/**
 * Prova a spostare `playerId` in `targetPos` scambiandolo con chi lo occupa.
 * Ritorna il nuovo schieramento, o `null` se lo scambio non e' lecito (il
 * compagno non puo' coprire il ruolo lasciato libero). Mantiene lo schieramento
 * una permutazione valida: niente buchi, niente doppioni sul diamante.
 */
export function computeSwap(
  team: Team,
  al: Alignment,
  playerId: string,
  targetPos: Position,
): Alignment | null {
  const a = team.lineup.find((p) => p.id === playerId);
  if (!a) return null;
  const aPos = activePos(a, al);
  if (aPos === targetPos) return al;
  if (!canOccupy(a, targetPos)) return null;
  const b = team.lineup.find((p) => activePos(p, al) === targetPos);
  if (b && !canOccupy(b, aPos)) return null;
  const next: Alignment = { ...al };
  const setP = (pl: Batter, pos: Position) => {
    if (pos === pl.position) delete next[pl.id];
    else next[pl.id] = pos;
  };
  setP(a, targetPos);
  if (b) setP(b, aPos);
  return next;
}
