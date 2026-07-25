// Client Supabase condiviso.
//
// `persistSession: false`: non usiamo autenticazione, quindi non serve tenere
// una sessione in localStorage. Ogni richiesta parte con la sola chiave anon.

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
