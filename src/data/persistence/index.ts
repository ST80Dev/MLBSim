// Punto d'ingresso del layer di persistenza.
//
// Il resto dell'app importa da qui: usa `saveStore` senza sapere quale backend
// c'e' sotto. Cambiare backend = cambiare questa sola riga.

export * from './saveStore';
export { supabase } from './supabaseClient';
export { supabaseSaveStore } from './supabaseSaveStore';

import { supabaseSaveStore } from './supabaseSaveStore';
import type { SaveStore } from './saveStore';

/** Store di default usato dall'app. */
export const saveStore: SaveStore = supabaseSaveStore;
