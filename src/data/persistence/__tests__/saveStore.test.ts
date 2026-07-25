import { describe, it, expect } from 'vitest';
import { rowToRecord, SCHEMA_VERSION } from '../saveStore';
import type { GameSave, SaveRow } from '../saveStore';

describe('persistence — mapping riga DB', () => {
  it('rowToRecord mappa i campi snake_case sul record applicativo', () => {
    const row: SaveRow = {
      slot_name: 'slot-1',
      schema_version: 1,
      payload: { managedTeamId: 'NYY' } satisfies GameSave,
      updated_at: '2026-07-25T09:00:00.000Z',
    };

    const rec = rowToRecord<GameSave>(row);

    expect(rec.slot).toBe('slot-1');
    expect(rec.schemaVersion).toBe(1);
    expect(rec.updatedAt).toBe('2026-07-25T09:00:00.000Z');
    expect(rec.payload.managedTeamId).toBe('NYY');
  });

  it('preserva un payload arbitrario (jsonb opaco)', () => {
    const payload = { a: 1, b: { c: [true, 'x'] } };
    const row: SaveRow = {
      slot_name: 's',
      schema_version: SCHEMA_VERSION,
      payload,
      updated_at: '2026-07-25T00:00:00.000Z',
    };

    expect(rowToRecord(row).payload).toEqual(payload);
  });
});
