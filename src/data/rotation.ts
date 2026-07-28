import type { Team } from '../engine/types';
import { withRotationStarter } from './generator';

// Riposo dei lanciatori della squadra gestita, in base all'USO REALE in partita
// (out lanciati), non solo per i partenti. Puro e testabile (nessuna UI, RNG).
//
// Dopo aver lanciato, ogni lanciatore matura un riposo obbligatorio in GARE, in
// funzione del carico:
//   - Partente / spot start ............... 4 gare  (ciclo naturale a 5 uomini)
//   - Rilievo da 2+ IP (6+ out) ........... 1 gara  (salta la gara dopo)
//   - Rilievo sotto le 2 IP (0-5 out) ..... 0       (disponibile la gara dopo)
// I rilievi restano quasi sempre disponibili (bullpen corti): solo chi si carica
// di 2+ inning salta una gara, cosi' non si resta a secco dopo una gara difficile.
// `availableFrom[id]` = prima giornata in cui il lanciatore torna disponibile
// (per partire O per rilevare). Chi non ha ancora lanciato e' sempre disponibile.

export const REST_STARTER = 4;
export const REST_RELIEF = 1;

export interface RotationState {
  /** id lanciatore -> prima giornata in cui torna disponibile. Assente = pronto. */
  availableFrom: Record<string, number>;
}

export function createRotation(): RotationState {
  return { availableFrom: {} };
}

/** Gare di riposo ancora da smaltire al giorno `day` (0 = pronto, >0 = a riposo). */
export function restRemaining(rot: RotationState, id: string, day: number): number {
  const from = rot.availableFrom[id];
  if (from === undefined) return 0;
  return Math.max(0, from - day);
}

/** Vero se il lanciatore ha smaltito il riposo ed e' utilizzabile al giorno `day`. */
export function isAvailable(rot: RotationState, id: string, day: number): boolean {
  return restRemaining(rot, id, day) <= 0;
}

/** Gare di riposo dovute in base agli out lanciati e se il lanciatore era il partente. */
export function restForUsage(outs: number, started: boolean): number {
  if (started) return REST_STARTER;
  if (outs >= 6) return REST_RELIEF; // rilievo da 2+ IP: salta una gara
  return 0; // rilievo sotto le 2 IP: pronto la gara dopo
}

export interface PitcherUsage {
  id: string;
  outs: number;
  /** true = ha aperto la gara (partente o spot start). */
  started: boolean;
}

/**
 * Registra l'uso di TUTTI i lanciatori scesi in campo in una gara al giorno
 * `day`: ognuno matura il proprio riposo (out + se ha aperto). Non muta l'input.
 */
export function recordUsage(rot: RotationState, usage: PitcherUsage[], day: number): RotationState {
  const availableFrom = { ...rot.availableFrom };
  for (const u of usage) {
    availableFrom[u.id] = day + 1 + restForUsage(u.outs, u.started);
  }
  return { availableFrom };
}

export interface RestInfo {
  id: string;
  /** Gare di riposo ancora da smaltire (0 = pronto). */
  restRemaining: number;
  available: boolean;
}

/** Stato di riposo per una lista di lanciatori (per i badge del Roster). */
export function restInfo(rot: RotationState, ids: string[], day: number): RestInfo[] {
  return ids.map((id) => ({
    id,
    restRemaining: restRemaining(rot, id, day),
    available: isAvailable(rot, id, day),
  }));
}

/**
 * Partente CONSIGLIATO: il **primo in ordine di rotazione** che non e' a riposo.
 * Se nessuno e' disponibile (non dovrebbe capitare con una rotazione sana) parte
 * comunque il primo dell'ordine.
 */
export function suggestedStarter(rot: RotationState, rotationIds: string[], day: number): string {
  return rotationIds.find((id) => isAvailable(rot, id, day)) ?? rotationIds[0];
}

/**
 * Ritorna la squadra con lo SP scelto in testa alla rotazione (cosi' `makeSide`,
 * che parte da `rotation[0]`, lo fa partire). Se l'id non e' in rotazione o e'
 * gia' in testa, ritorna la squadra invariata.
 */
export function withStarterId(team: Team, spId: string): Team {
  const idx = team.rotation.findIndex((p) => p.id === spId);
  return idx <= 0 ? team : withRotationStarter(team, idx);
}
