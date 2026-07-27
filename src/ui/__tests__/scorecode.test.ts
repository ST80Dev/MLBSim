import { describe, it, expect } from 'vitest';
import { scoreCode } from '../scorecode';
import type { PlayEvent, PlayKind } from '../../engine/game';

function ev(kind: PlayKind, over: Partial<PlayEvent> = {}): PlayEvent {
  return {
    inning: 3,
    half: 'top',
    text: 'test',
    away: 0,
    home: 0,
    runsScored: 0,
    kind,
    batter: 'Rossi',
    ...over,
  };
}

describe('scoreCode', () => {
  it('è deterministico: stesso evento → stesso codice', () => {
    const e = ev('gidp');
    expect(scoreCode(e)).toEqual(scoreCode(e));
    const e2 = ev('inplayout', { text: 'altra giocata', inning: 7 });
    expect(scoreCode(e2)).toEqual(scoreCode(e2));
  });

  it('restituisce null solo per cambi e note', () => {
    expect(scoreCode(ev('sub'))).toBeNull();
    expect(scoreCode(ev('other'))).toBeNull();
  });

  it('produce un codice non vuoto con tooltip per ogni esito giocabile', () => {
    const kinds: PlayKind[] = [
      'single', 'double', 'triple', 'homerun', 'walk', 'hbp', 'ibb',
      'strikeout', 'inplayout', 'gidp', 'sacfly', 'sacbunt', 'bunthit',
      'buntout', 'steal', 'caughtstealing', 'wildpitch', 'passedball', 'balk',
    ];
    for (const k of kinds) {
      const sc = scoreCode(ev(k));
      expect(sc, k).not.toBeNull();
      expect(sc!.code.length, k).toBeGreaterThan(0);
      expect(sc!.title.length, k).toBeGreaterThan(0);
    }
  });

  it('doppio gioco: codice a tre ruoli con suffisso DP', () => {
    const sc = scoreCode(ev('gidp'))!;
    expect(sc.code).toMatch(/^\d-\d-\d DP$/);
  });

  it('eliminato in rubata: prefisso CS e sequenza dal ricevitore (2)', () => {
    const sc = scoreCode(ev('caughtstealing'))!;
    expect(sc.code).toMatch(/^CS 2-\d$/);
  });

  it('volata di sacrificio: SF + esterno (7/8/9)', () => {
    const sc = scoreCode(ev('sacfly'))!;
    expect(sc.code).toMatch(/^SF[789]$/);
  });

  it('inplayout genera categorie valide (rimbalzo/volata/linea/cielo)', () => {
    // Campiona vari eventi: ogni codice deve rientrare nei formati previsti.
    const re = /^(\d(-\d){0,2}|\dU|F[789]|L[1-9]|P[1-9])$/;
    for (let i = 0; i < 60; i++) {
      const sc = scoreCode(ev('inplayout', { text: `giocata-${i}`, inning: (i % 9) + 1 }))!;
      expect(sc.code, sc.code).toMatch(re);
    }
  });
});
