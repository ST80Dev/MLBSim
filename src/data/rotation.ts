import type { Team } from '../engine/types';
import { withRotationStarter } from './generator';

// Gestione della ROTAZIONE dei partenti della squadra gestita: scelta 4/5 uomini
// e vincolo di riposo. Puro e testabile (nessuna UI, nessun RNG).
//
// Modello semplice ma sufficiente: un partente, dopo aver lanciato, deve fare un
// minimo di partite di riposo (REST_MIN_DAYS) prima di poter ripartire. Con 3 di
// riposo il ciclo più stretto è a 4 uomini (parte ogni 4ª partita); a 5 uomini
// ognuno riposa un giorno in più. Il giocatore sceglie il partente del giorno tra
// i disponibili — es. richiamare l'asso appena idoneo oppure dare spazio al #5 e
// far riposare l'asso un giorno extra.

/** Partite di riposo OBBLIGATORIE dopo una partenza (regular season). */
export const REST_MIN_DAYS = 3;
/** Riposo minimo nei PLAYOFF: più corto (più off-day reali tra le gare + gare che
 *  contano), così l'asso può lanciare Gara 1 e Gara 4 (2 gare di riposo). */
export const PLAYOFF_REST_MIN = 2;

export type RotationSize = 4 | 5;

export interface RotationState {
  /** Uomini nel ciclo: 4 o 5. */
  size: RotationSize;
  /** id SP -> giorno (indice) dell'ultima partenza. Assente = mai partito. */
  lastStart: Record<string, number>;
}

export function createRotation(size: RotationSize = 5): RotationState {
  return { size, lastStart: {} };
}

/** Partite di riposo maturate da uno SP al giorno `day` (Infinity se mai partito). */
export function restDays(rot: RotationState, spId: string, day: number): number {
  const last = rot.lastStart[spId];
  if (last === undefined) return Infinity;
  return day - last - 1; // partite saltate dall'ultima partenza
}

/** Vero se lo SP ha riposato abbastanza per ripartire al giorno `day`. Il riposo
 *  minimo è parametrico (`REST_MIN_DAYS` di default; `PLAYOFF_REST_MIN` nei playoff). */
export function isAvailable(
  rot: RotationState,
  spId: string,
  day: number,
  restMin: number = REST_MIN_DAYS,
): boolean {
  return restDays(rot, spId, day) >= restMin;
}

export interface StarterOption {
  id: string;
  /** Partite di riposo maturate (Infinity = mai partito / "fresco"). */
  restDays: number;
  available: boolean;
  /** Fa parte dei primi `size` della rotazione (il ciclo attivo). */
  inCycle: boolean;
}

/**
 * Opzioni di partente per il giorno, nell'ordine della rotazione della squadra
 * (`rotationIds` = team.rotation, asso in testa). La UI le mostra con riposo e
 * disponibilità così il giocatore sceglie.
 */
export function starterOptions(
  rot: RotationState,
  rotationIds: string[],
  day: number,
  restMin: number = REST_MIN_DAYS,
): StarterOption[] {
  return rotationIds.map((id, i) => ({
    id,
    restDays: restDays(rot, id, day),
    available: isAvailable(rot, id, day, restMin),
    inCycle: i < rot.size,
  }));
}

/**
 * Partente CONSIGLIATO: tra i disponibili del ciclo (primi `size`), il più
 * riposato; a parità mantiene l'ordine di rotazione (così il ciclo gira in
 * ordine, l'asso rientra appena idoneo). Se nessuno del ciclo è disponibile
 * ripiega sul più riposato in assoluto — robustezza, non dovrebbe capitare con
 * size≥4 e REST=3.
 */
export function suggestedStarter(
  rot: RotationState,
  rotationIds: string[],
  day: number,
  restMin: number = REST_MIN_DAYS,
): string {
  const opts = starterOptions(rot, rotationIds, day, restMin);
  const cycle = opts.filter((o) => o.inCycle);
  const avail = cycle.filter((o) => o.available);
  const pool = avail.length ? avail : cycle.length ? cycle : opts;
  // Il primo del pool è già il più in alto in rotazione; tengo quello a meno che
  // un successivo non abbia STRETTAMENTE più riposo (ordine stabile a parità).
  return pool.reduce((best, o) => (o.restDays > best.restDays ? o : best), pool[0]).id;
}

/** Registra una partenza: aggiorna l'ultima-partenza dello SP. Non muta l'input. */
export function recordStart(rot: RotationState, spId: string, day: number): RotationState {
  return { ...rot, lastStart: { ...rot.lastStart, [spId]: day } };
}

/** Cambia il numero di uomini del ciclo (4/5). Non muta l'input. */
export function setSize(rot: RotationState, size: RotationSize): RotationState {
  return { ...rot, size };
}

/**
 * Ritorna la squadra con lo SP scelto in testa alla rotazione (così `makeSide`,
 * che parte da `rotation[0]`, lo fa partire). Se l'id non è in rotazione o è già
 * in testa, ritorna la squadra invariata.
 */
export function withStarterId(team: Team, spId: string): Team {
  const idx = team.rotation.findIndex((p) => p.id === spId);
  return idx <= 0 ? team : withRotationStarter(team, idx);
}
