import { describe, it, expect } from 'vitest';
import { getCalibrationFor, calibratedVariants } from '../stadiumCalibration';

// Carica gli STESSI file JSON impacchettati dal modulo, per confrontare i marker
// caricati con quelli reali su disco (indipendente dalla logica sotto test).
const RAW = import.meta.glob('../calibrations/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, { image?: string | null; markers?: Record<string, { x: number; y: number }> }>;

const byStem: Record<string, { image?: string | null; markers?: Record<string, { x: number; y: number }> }> = {};
for (const p in RAW) byStem[p.slice(p.lastIndexOf('/') + 1, -'.json'.length)] = RAW[p];

const teamIds = [...new Set(Object.keys(byStem).map((s) => s.replace(/\d+$/, '')))];

describe('calibrazione per-foto: nessuna mescolanza foto↔marker', () => {
  it('getCalibrationFor carica i marker della foto GIUSTA (principale o doppione)', () => {
    for (const stem in byStem) {
      const teamId = stem.replace(/\d+$/, '');
      const isVariant = /\d$/.test(stem);
      const image = isVariant ? `stadiums/${stem}.jpg` : undefined;
      const cal = getCalibrationFor(teamId, image);
      // La variante porta la sua immagine; la principale non ne forza una.
      expect(cal.image ?? null).toBe(image ?? null);
      // I marker sono ESATTAMENTE quelli del file di quella foto.
      if (byStem[stem].markers) {
        expect(cal.markers).toEqual(byStem[stem].markers);
      }
    }
  });

  it('principale e doppioni dello stesso stadio non condividono i marker', () => {
    let checked = 0;
    for (const teamId of teamIds) {
      const vs = calibratedVariants(teamId);
      if (vs.length < 2) continue;
      const cals = vs.map((v) => getCalibrationFor(teamId, v.image));
      for (let i = 0; i < cals.length; i++) {
        for (let j = i + 1; j < cals.length; j++) {
          expect(cals[i].markers).not.toEqual(cals[j].markers);
          checked++;
        }
      }
    }
    // Deve esserci almeno uno stadio con più foto calibrate, altrimenti il test
    // non prova nulla (guardia contro falsi verdi).
    expect(checked).toBeGreaterThan(0);
  });

  it('calibratedVariants elenca la principale con image undefined e i doppioni con il loro path', () => {
    for (const teamId of teamIds) {
      for (const v of calibratedVariants(teamId)) {
        if (v.stem === teamId) {
          expect(v.image).toBeUndefined();
        } else {
          expect(v.image).toBe(`stadiums/${v.stem}.jpg`);
        }
      }
    }
  });
});
