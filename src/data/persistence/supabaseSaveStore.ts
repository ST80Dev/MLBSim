// Implementazione di `SaveStore` su Supabase (tabella `saves`).
//
// La tabella ha `slot_name` UNIQUE: il salvataggio e' un upsert su quel campo,
// cosi' ogni slot con lo stesso nome viene sovrascritto. `updated_at` e' gestito
// da un trigger lato DB.

import { supabase } from './supabaseClient';
import type { SaveMeta, SaveRecord, SaveRow, SaveStore } from './saveStore';
import { SCHEMA_VERSION, rowToRecord } from './saveStore';

const TABLE = 'saves';

export const supabaseSaveStore: SaveStore = {
  async list(): Promise<SaveMeta[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('slot_name, schema_version, updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw new Error(`saves.list: ${error.message}`);
    return (data ?? []).map((r) => ({
      slot: r.slot_name,
      schemaVersion: r.schema_version,
      updatedAt: r.updated_at,
    }));
  },

  async load<T>(slot: string): Promise<SaveRecord<T> | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('slot_name, schema_version, payload, updated_at')
      .eq('slot_name', slot)
      .maybeSingle();
    if (error) throw new Error(`saves.load: ${error.message}`);
    return data ? rowToRecord<T>(data as SaveRow) : null;
  },

  async save<T>(slot: string, payload: T, schemaVersion = SCHEMA_VERSION): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        { slot_name: slot, schema_version: schemaVersion, payload },
        { onConflict: 'slot_name' },
      );
    if (error) throw new Error(`saves.save: ${error.message}`);
  },

  async remove(slot: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('slot_name', slot);
    if (error) throw new Error(`saves.remove: ${error.message}`);
  },
};
