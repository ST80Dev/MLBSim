// Astrazione di persistenza dei salvataggi.
//
// Il game loop parla con questa interfaccia e NON sa dove finiscono i dati
// (oggi Supabase; domani, se serve, un backend locale dietro la stessa
// interfaccia). Un salvataggio e' uno snapshot serializzabile e VERSIONATO:
// `schemaVersion` accompagna ogni record cosi' che, quando il formato del
// payload cambiera' (Fase 4 stagione, Fase 5 franchigia), i vecchi salvataggi
// possano essere migrati invece di rompersi.

import type { Position } from '../../engine/types';

/** Versione corrente del formato di `GameSave`. Da alzare a ogni cambio incompatibile. */
export const SCHEMA_VERSION = 1;

/**
 * Assetto persistente di una squadra gestita (Fase 2): ordine di battuta e
 * schieramento difensivo scelti nell'editor. Applicato alla rosa (rigenerata da
 * seed) prima della partita, cosi' la squadra scende in campo come preparata.
 */
export interface TeamArrangement {
  /** Ordine di battuta: id dei 9 battitori del lineup, in ordine. */
  order: string[];
  /** Schieramento difensivo: id battitore -> ruolo attivo (solo chi e' fuori ruolo). */
  alignment: Record<string, Position>;
}

/**
 * Stato di gioco persistente (fetta della Fase 2). Cresce nelle fasi
 * successive: qui vivranno lineup/rotazione modificati, e piu' avanti
 * calendario, classifiche e statistiche accumulate della stagione.
 *
 * NB: l'import storico (Lahman) NON vive qui — e' dato di riferimento read-only
 * nel bundle, non stato del giocatore.
 */
export interface GameSave {
  /**
   * Squadra gestita resa persistente: sostituisce il selettore per-partita
   * "ospite/casa" della Fase 1 (che resta come strumento di test/debug).
   */
  managedTeamId?: string;
  /** Assetti (ordine di battuta + difesa) per teamId, dall'editor di Fase 2. */
  lineups?: Record<string, TeamArrangement>;
}

/** Metadati di uno slot, senza il payload (per elencare i salvataggi). */
export interface SaveMeta {
  slot: string;
  schemaVersion: number;
  updatedAt: string;
}

/** Uno slot completo di payload. */
export interface SaveRecord<T = GameSave> extends SaveMeta {
  payload: T;
}

/** Contratto di persistenza indipendente dal backend. */
export interface SaveStore {
  /** Elenca gli slot esistenti, dal piu' recente. */
  list(): Promise<SaveMeta[]>;
  /** Carica uno slot per nome, o `null` se non esiste. */
  load<T = GameSave>(slot: string): Promise<SaveRecord<T> | null>;
  /** Crea o aggiorna (upsert) uno slot. */
  save<T = GameSave>(slot: string, payload: T, schemaVersion?: number): Promise<void>;
  /** Elimina uno slot. */
  remove(slot: string): Promise<void>;
}

/** Riga grezza della tabella `saves` (mapping 1:1 con lo schema SQL). */
export interface SaveRow {
  slot_name: string;
  schema_version: number;
  payload: unknown;
  updated_at: string;
}

/** Converte una riga del DB nel record applicativo. Puro: testabile senza rete. */
export function rowToRecord<T = GameSave>(row: SaveRow): SaveRecord<T> {
  return {
    slot: row.slot_name,
    schemaVersion: row.schema_version,
    payload: row.payload as T,
    updatedAt: row.updated_at,
  };
}
