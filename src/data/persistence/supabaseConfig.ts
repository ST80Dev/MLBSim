// Configurazione del backend Supabase (Fase 2 — persistenza dei salvataggi).
//
// Design condiviso con l'utente: single-user, NESSUNA autenticazione, RLS
// aperta. La chiave "publishable" e' pubblica per costruzione (sito statico su
// GitHub Pages) e non protegge nulla di sensibile: qui vivono solo salvataggi di
// partita. Va quindi bene committarla come fallback.
//
// In locale/CI si possono comunque sovrascrivere URL e chiave con le variabili
// d'ambiente Vite `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, senza toccare
// il codice.

const FALLBACK_URL = 'https://fxjwdtvnevzojxfcwkvr.supabase.co';
const FALLBACK_ANON_KEY = 'sb_publishable_awEu19hqY4AM_kT-32mbug_eBL_wZT0';

const env = (import.meta as ImportMeta).env ?? {};

export const SUPABASE_URL: string =
  (env.VITE_SUPABASE_URL as string | undefined) ?? FALLBACK_URL;

export const SUPABASE_ANON_KEY: string =
  (env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? FALLBACK_ANON_KEY;
