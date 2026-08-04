import type { Team } from '../engine/types';
import { withRotationStarter } from './generator';

// Riposo dei lanciatori della squadra gestita, in base all'USO REALE in partita
// (out lanciati), non solo per i partenti. Puro e testabile (nessuna UI, RNG).
//
// Dopo aver lanciato, ogni lanciatore matura un riposo obbligatorio in GARE, in
// funzione del carico:
//   - Partente / spot start ............... 3 gare  (MINIMO: consente la rotazione
//                                                     a 4 uomini; l'asso di gara 1
//                                                     rientra alla gara 5)
//   - Rilievo da 2+ IP (6+ out) ........... 1 gara  (salta la gara dopo)
//   - Rilievo sotto le 2 IP (0-5 out) ..... 0       (disponibile la gara dopo)
// I rilievi restano quasi sempre disponibili (bullpen corti): solo chi si carica
// di 2+ inning salta una gara, cosi' non si resta a secco dopo una gara difficile.
// `availableFrom[id]` = prima giornata in cui il lanciatore torna disponibile
// (per partire O per rilevare). Chi non ha ancora lanciato e' sempre disponibile.
//
// Il riposo del partente è un **MINIMO** (3 gare), non un ciclo rigido: con 5
// partenti sani `suggestedStarter` gira comunque a 5 uomini (sceglie il PIÙ
// riposato, così l'asso salta la sua gara-3-di-riposo e ne fa una in più), ma con
// 4 partenti la rotazione a 4 è lecita e l'asso rientra puntuale alla 4ª gara dopo
// la sua. L'utente può sempre schierare manualmente l'asso appena smaltite le 3
// gare (rotazione a 4 a comando).
//
// NEI PLAYOFF il riposo del PARTENTE si accorcia ancora (`PLAYOFF_REST_STARTER`):
// piu' off-day reali tra le gare + gare che contano, cosi' l'asso puo' lanciare
// Gara 1 e Gara 4 (riposo di 2 gare). Vale solo alla REGISTRAZIONE dell'uso
// (`recordUsage(..., starterRest)`); le query di disponibilita' non cambiano.

export const REST_STARTER = 3;
export const REST_RELIEF = 1;
/** Riposo del partente nei playoff (piu' corto): l'asso rientra alla 3ª gara dopo. */
export const PLAYOFF_REST_STARTER = 2;

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

/** Gare di riposo dovute in base agli out lanciati e se il lanciatore era il
 *  partente. `starterRest` = riposo del partente (default regular; più corto nei
 *  playoff via `PLAYOFF_REST_STARTER`). */
export function restForUsage(outs: number, started: boolean, starterRest: number = REST_STARTER): number {
  if (started) return starterRest;
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
 * `day`: ognuno matura il proprio riposo (out + se ha aperto). `starterRest`
 * accorcia il riposo del partente nei playoff. Non muta l'input.
 */
export function recordUsage(
  rot: RotationState,
  usage: PitcherUsage[],
  day: number,
  starterRest: number = REST_STARTER,
): RotationState {
  const availableFrom = { ...rot.availableFrom };
  for (const u of usage) {
    availableFrom[u.id] = day + 1 + restForUsage(u.outs, u.started, starterRest);
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
 * Partente CONSIGLIATO: fra i disponibili (riposo smaltito), il **più riposato**
 * — chi ha lanciato più tempo fa (o mai) — con l'ordine di rotazione a spareggio.
 * Così, anche se il riposo minimo (3 gare) renderebbe l'asso già schierabile alla
 * casella del 5° partente, la rotazione a 5 uomini **non collassa** a 4: parte il
 * partente più fresco, l'asso si prende la gara di riposo extra. Con 4 partenti,
 * invece, l'asso è l'unico disponibile al suo turno e rientra puntuale. Se nessuno
 * è disponibile (rotazione malmessa) parte il primo dell'ordine.
 */
export function suggestedStarter(rot: RotationState, rotationIds: string[], day: number): string {
  const available = rotationIds.filter((id) => isAvailable(rot, id, day));
  if (available.length === 0) return rotationIds[0];
  // `availableFrom` più basso = ha lanciato più tempo fa (assente = mai lanciato =
  // il più riposato). reduce in ordine di rotazione → a parità tiene il primo.
  return available.reduce((best, id) =>
    (rot.availableFrom[id] ?? 0) < (rot.availableFrom[best] ?? 0) ? id : best,
  );
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
