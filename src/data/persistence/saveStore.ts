// Astrazione di persistenza dei salvataggi.
//
// Il game loop parla con questa interfaccia e NON sa dove finiscono i dati
// (oggi Supabase; domani, se serve, un backend locale dietro la stessa
// interfaccia). Un salvataggio e' uno snapshot serializzabile e VERSIONATO:
// `schemaVersion` accompagna ogni record cosi' che, quando il formato del
// payload cambiera' (Fase 4 stagione, Fase 5 franchigia), i vecchi salvataggi
// possano essere migrati invece di rompersi.

import type { MatchArrangement } from '../../engine/arrangement';
import type { SeasonState } from '../season';
import type { PlayoffState } from '../playoff';
import type { LeagueSource } from '../leagueMode';

// Il "foglio partita" persistente e' definito nel motore (`MatchArrangement`):
// la persistenza lo importa e basta, cosi' il motore resta la fonte di verita'
// del formato e non dipende dal layer di salvataggio.
export type { MatchArrangement } from '../../engine/arrangement';

/**
 * Versione corrente del formato di `GameSave`. Da alzare a ogni cambio
 * incompatibile.
 *   - v2: aggiunge `seed` e `source` (la lega generata da seed diventa
 *     riproducibile; prima il seed era casuale ad ogni avvio → ricaricare un
 *     salvataggio rigenerava una lega DIVERSA da quella salvata).
 */
export const SCHEMA_VERSION = 2;

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
   * Seed della lega: RENDE RIPRODUCIBILE la lega generata (le 30 rose). Senza,
   * ricaricare rigenererebbe rose diverse da quelle salvate. Assente nei save v1.
   */
  seed?: number;
  /**
   * Sorgente della lega: `generated` (seed casuale) o `historical` (import
   * d'archivio). Determina la politica di cap (vedi `leagueMode.ts`). Assente
   * nei save v1 → trattato come `generated`.
   */
  source?: LeagueSource;
  /**
   * Squadra gestita resa persistente: sostituisce il selettore per-partita
   * "ospite/casa" della Fase 1 (che resta come strumento di test/debug).
   */
  managedTeamId?: string;
  /** Foglio partita (lineup, difesa, rotazione, bullpen) per teamId — editor Fase 2. */
  lineups?: Record<string, MatchArrangement>;
  /** Stato di stagione: giorno corrente, record di lega, statistiche reali accumulate. */
  season?: SeasonState;
  /**
   * Postseason (Fase 4): tabellone, semine, esiti serie e campione. Nasce a fine
   * regular season (giornata 162). Assente finché la stagione è in corso o nei
   * save che non hanno ancora raggiunto i playoff → trattato come "nessun playoff".
   */
  playoff?: PlayoffState;
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
