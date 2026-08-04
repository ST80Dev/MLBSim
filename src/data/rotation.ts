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
// `lastUsed[id]` = ultimo impiego (giorno + carico); il riposo residuo si RICALCOLA
// alla query con la regola corrente. Chi non ha ancora lanciato e' sempre disponibile.
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
// Gara 1 e Gara 4 (riposo di 2 gare). Ora il riposo si RICALCOLA alla query: le
// funzioni (`restRemaining`/`isAvailable`/`restInfo`/`suggestedStarter`) accettano
// `starterRest`, e i chiamanti dei PLAYOFF passano `PLAYOFF_REST_STARTER`.

export const REST_STARTER = 3;
export const REST_RELIEF = 1;
/** Riposo del partente nei playoff (piu' corto): l'asso rientra alla 3ª gara dopo. */
export const PLAYOFF_REST_STARTER = 2;

/** Ultimo impiego di un lanciatore: giorno + carico (out lanciati, se ha aperto). */
export interface LastUse {
  day: number;
  outs: number;
  started: boolean;
}

export interface RotationState {
  /** id lanciatore -> ultimo impiego. Assente = mai lanciato = pronto.
   *  Il riposo NON è memorizzato "cotto": si RICALCOLA a ogni query con la regola
   *  CORRENTE (`REST_STARTER`/`PLAYOFF_REST_STARTER`), così un cambio di regola vale
   *  anche a stagione GIÀ IN CORSO (prima `availableFrom` bloccava il vecchio +4). */
  lastUsed: Record<string, LastUse>;
}

export function createRotation(): RotationState {
  return { lastUsed: {} };
}

/** Gare di riposo dovute in base agli out lanciati e se il lanciatore era il
 *  partente. `starterRest` = riposo del partente (default regular; più corto nei
 *  playoff via `PLAYOFF_REST_STARTER`). */
export function restForUsage(outs: number, started: boolean, starterRest: number = REST_STARTER): number {
  if (started) return starterRest;
  if (outs >= 6) return REST_RELIEF; // rilievo da 2+ IP: salta una gara
  return 0; // rilievo sotto le 2 IP: pronto la gara dopo
}

/** Gare di riposo ancora da smaltire al giorno `day` (0 = pronto, >0 = a riposo),
 *  ricalcolate dalla regola corrente. `starterRest` = riposo partente (playoff più corto). */
export function restRemaining(
  rot: RotationState,
  id: string,
  day: number,
  starterRest: number = REST_STARTER,
): number {
  const u = rot.lastUsed[id];
  if (!u) return 0;
  return Math.max(0, u.day + 1 + restForUsage(u.outs, u.started, starterRest) - day);
}

/** Vero se il lanciatore ha smaltito il riposo ed e' utilizzabile al giorno `day`. */
export function isAvailable(
  rot: RotationState,
  id: string,
  day: number,
  starterRest: number = REST_STARTER,
): boolean {
  return restRemaining(rot, id, day, starterRest) <= 0;
}

export interface PitcherUsage {
  id: string;
  outs: number;
  /** true = ha aperto la gara (partente o spot start). */
  started: boolean;
}

/**
 * Registra l'uso di TUTTI i lanciatori scesi in campo in una gara al giorno
 * `day`: memorizza SOLO il fatto (giorno + carico), non il riposo derivato — così
 * il riposo resta ricalcolabile con la regola corrente. Non muta l'input.
 */
export function recordUsage(rot: RotationState, usage: PitcherUsage[], day: number): RotationState {
  const lastUsed = { ...rot.lastUsed };
  for (const u of usage) {
    lastUsed[u.id] = { day, outs: u.outs, started: u.started };
  }
  return { lastUsed };
}

export interface RestInfo {
  id: string;
  /** Gare di riposo ancora da smaltire (0 = pronto). */
  restRemaining: number;
  available: boolean;
}

/** Stato di riposo per una lista di lanciatori (per i badge del Roster). */
export function restInfo(
  rot: RotationState,
  ids: string[],
  day: number,
  starterRest: number = REST_STARTER,
): RestInfo[] {
  return ids.map((id) => ({
    id,
    restRemaining: restRemaining(rot, id, day, starterRest),
    available: isAvailable(rot, id, day, starterRest),
  }));
}

/**
 * Migra un vecchio `RotationState` (schema `availableFrom`, riposo "cotto") al
 * nuovo schema `lastUsed`. Ricostruisce il giorno dell'ultima uscita assumendo un
 * PARTENTE sotto la regola d'epoca (`+4`): così un valore bloccato a +4 di una
 * stagione iniziata prima del cambio si riallinea SUBITO al `+3` corrente. I
 * rilievi (rari nel display rotazione) si riallineano al primo impiego. Idempotente.
 */
export function migrateRotation(rot: unknown): RotationState {
  if (rot && typeof rot === 'object' && 'lastUsed' in rot) {
    return rot as RotationState;
  }
  const lastUsed: Record<string, LastUse> = {};
  const legacy = (rot as { availableFrom?: Record<string, number> } | undefined)?.availableFrom;
  if (legacy) {
    for (const id in legacy) {
      // availableFrom = pitchDay + 1 + 4 (vecchia regola partente) → pitchDay = from − 5.
      lastUsed[id] = { day: legacy[id] - 5, outs: 18, started: true };
    }
  }
  return { lastUsed };
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
export function suggestedStarter(
  rot: RotationState,
  rotationIds: string[],
  day: number,
  starterRest: number = REST_STARTER,
): string {
  const available = rotationIds.filter((id) => isAvailable(rot, id, day, starterRest));
  if (available.length === 0) return rotationIds[0];
  // `lastUsed.day` più basso = ha lanciato più tempo fa (assente = mai lanciato =
  // il più riposato). reduce in ordine di rotazione → a parità tiene il primo.
  const lastDay = (id: string) => rot.lastUsed[id]?.day ?? -Infinity;
  return available.reduce((best, id) => (lastDay(id) < lastDay(best) ? id : best));
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
