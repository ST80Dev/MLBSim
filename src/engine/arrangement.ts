import type { Batter, Pitcher, Position, Team } from './types';
import { ratingsAtPosition } from './positions';
import { validateFieldSet } from './lineup';
import type { FieldSetCheck } from './lineup';

// Assetto del match: chi partecipa (dalla rosa completa, divisa battitori /
// lanciatori), il loro ordine di battuta, la difesa (chi copre quale casella),
// l'ordine della rotazione (il primo parte) e l'ordine del bullpen (uso dei
// rilievi). E' il "foglio partita" che l'editor produce e che il motore consuma:
// `buildManagedTeam` lo trasforma nella `Team` che scende in campo.
//
// Puro e testabile: nessuna dipendenza da UI o persistenza. La persistenza
// (GameSave) importa QUESTO tipo, non il contrario, cosi' il motore resta puro.

export interface MatchArrangement {
  /** Ordine di battuta: i 9 battitori titolari, in ordine. */
  order: string[];
  /** Difesa: id battitore -> casella coperta. Deve coprire le 9 caselle una volta. */
  defense: Record<string, Position>;
  /** Rotazione: id starter in ordine; il primo lancia in questa gara. */
  rotation: string[];
  /** Bullpen: id rilievi nell'ordine d'uso. */
  bullpen: string[];
  /**
   * Closer designato: il rilievo che CHIUDE (usato per ultimo), mostrato come CL.
   * Il ruolo NON e' rigido: qualsiasi rilievo puo' essere nominato closer per la
   * stagione. Se assente, chiude semplicemente l'ultimo del bullpen.
   */
  closerId?: string;
}

/** Tutti i battitori della rosa (titolari + panca + riserve di profondita'). */
export function rosterBatters(t: Team): Batter[] {
  return [...t.lineup, ...t.bench, ...t.reserveBatters];
}

/** Tutti i lanciatori della rosa (rotazione + bullpen + riserve di profondita'). */
export function rosterPitchers(t: Team): Pitcher[] {
  return [...t.rotation, ...t.bullpen, ...t.reservePitchers];
}

/**
 * Assetto di default a partire dalla rosa generata: lineup e difesa come li ha
 * prodotti il generatore, rotazione e bullpen negli ordini di rosa. E' il punto
 * di partenza dell'editor e il fallback quando non c'e' un assetto salvato.
 */
export function defaultArrangement(t: Team): MatchArrangement {
  const defense: Record<string, Position> = {};
  for (const b of t.lineup) defense[b.id] = b.position;
  const closer = t.bullpen.find((p) => p.role === 'CL');
  return {
    order: t.lineup.map((b) => b.id),
    defense,
    rotation: t.rotation.map((p) => p.id),
    bullpen: t.bullpen.map((p) => p.id),
    closerId: closer?.id,
  };
}

/**
 * Trasforma un assetto nella `Team` che gioca: il lineup adotta ordine di
 * battuta e caselle scelte (fielding rivalutato fuori ruolo), rotazione e
 * bullpen adottano gli ordini scelti. Panca e riserve raccolgono il resto per
 * coerenza (il motore non le usa). Robusto agli id non piu' validi: li ignora.
 *
 * NB: assume un assetto valido a monte (vedi `validateArrangement`); come rete
 * di sicurezza, se la rotazione risultasse vuota ripiega su quella di rosa, che
 * il motore richiede per lo starter.
 */
export function buildManagedTeam(t: Team, arr: MatchArrangement): Team {
  const bById = new Map(rosterBatters(t).map((b) => [b.id, b]));
  const pById = new Map(rosterPitchers(t).map((p) => [p.id, p]));

  const lineup: Batter[] = [];
  const seenB = new Set<string>();
  for (const id of arr.order) {
    const b = bById.get(id);
    if (!b || seenB.has(id)) continue;
    seenB.add(id);
    const pos = arr.defense[id] ?? b.position;
    lineup.push(
      pos === b.position ? b : { ...b, position: pos, ratings: ratingsAtPosition(b, pos) },
    );
  }

  const pick = (ids: string[], seen: Set<string>): Pitcher[] => {
    const out: Pitcher[] = [];
    for (const id of ids) {
      const p = pById.get(id);
      if (p && !seen.has(id)) {
        seen.add(id);
        out.push(p);
      }
    }
    return out;
  };
  const seenP = new Set<string>();
  let rotation = pick(arr.rotation, seenP);
  let bullpen = pick(arr.bullpen, seenP);
  if (rotation.length === 0) rotation = t.rotation; // il motore esige uno starter

  // Closer designato: lo si porta in fondo al bullpen (chiude la gara) e a video
  // e' CL; gli altri eventuali CL tornano RP. Il ruolo non e' rigido.
  if (arr.closerId && bullpen.some((p) => p.id === arr.closerId)) {
    const closer = bullpen.find((p) => p.id === arr.closerId)!;
    const rest = bullpen
      .filter((p) => p.id !== arr.closerId)
      .map((p) => (p.role === 'CL' ? { ...p, role: 'RP' as const } : p));
    bullpen = [...rest, closer.role === 'CL' ? closer : { ...closer, role: 'CL' as const }];
  }

  const usedB = new Set(lineup.map((b) => b.id));
  const usedP = new Set([...rotation, ...bullpen].map((p) => p.id));
  const bench = rosterBatters(t).filter((b) => !usedB.has(b.id));
  const restP = rosterPitchers(t).filter((p) => !usedP.has(p.id));

  return {
    ...t,
    lineup,
    rotation,
    bullpen,
    bench,
    reserveBatters: [],
    reservePitchers: restP,
  };
}

export interface ArrangementCheck {
  ok: boolean;
  /** Esattamente 9 battitori titolari, tutti in rosa e distinti. */
  lineupOk: boolean;
  /** Copertura delle 9 caselle difensive (buchi / doppioni). */
  defense: FieldSetCheck;
  /** Almeno uno starter selezionato. */
  hasStarter: boolean;
  /** Messaggi leggibili per la UI (vuoto se tutto ok). */
  errors: string[];
}

/**
 * Valida il vincolo DURO del foglio partita: 9 battitori distinti della rosa
 * che coprono esattamente le 9 caselle, e almeno uno starter. L'ordine di
 * battuta, CHI copre una casella (con eventuale malus fuori ruolo) e la
 * composizione del bullpen sono liberi.
 */
export function validateArrangement(t: Team, arr: MatchArrangement): ArrangementCheck {
  const errors: string[] = [];
  const batterIds = new Set(rosterBatters(t).map((b) => b.id));
  const pitcherIds = new Set(rosterPitchers(t).map((p) => p.id));

  const order = arr.order.filter((id) => batterIds.has(id));
  const uniqueOrder = new Set(order);
  const lineupOk = order.length === 9 && uniqueOrder.size === 9;
  if (!lineupOk) errors.push(`Servono 9 battitori titolari distinti (ora ${uniqueOrder.size}).`);

  // La difesa deve assegnare una casella a ciascuno dei 9 titolari.
  const slots: Position[] = [];
  for (const id of uniqueOrder) {
    const pos = arr.defense[id];
    if (pos) slots.push(pos);
  }
  const defense = validateFieldSet(slots);
  if (!defense.ok) {
    if (defense.missing.length) errors.push(`Caselle scoperte: ${defense.missing.join(', ')}.`);
    if (defense.duplicates.length) errors.push(`Caselle doppie: ${defense.duplicates.join(', ')}.`);
    if (slots.length !== uniqueOrder.size) errors.push('Ogni titolare deve avere una casella.');
  }

  const rotation = arr.rotation.filter((id) => pitcherIds.has(id));
  const hasStarter = rotation.length >= 1;
  if (!hasStarter) errors.push('Serve almeno uno starter in rotazione.');

  return {
    ok: lineupOk && defense.ok && hasStarter,
    lineupOk,
    defense,
    hasStarter,
    errors,
  };
}
