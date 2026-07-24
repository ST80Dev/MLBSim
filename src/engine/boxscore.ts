import type { Batter, Pitcher } from './types';

/** Esito di una decisione da lanciatore. */
export type PitchDecision = 'W' | 'L' | 'SV';

/** Riga di tabellino offensivo di un giocatore. */
export interface BattingLine {
  id: string;
  name: string;
  position: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  so: number;
  double: number;
  triple: number;
  hr: number;
  sb: number; // basi rubate (attivata in Fase 1)
  cs: number; // eliminato in rubata (attivata in Fase 1)
  lob: number; // corridori lasciati in base
}

/** Riga di tabellino di un lanciatore. */
export interface PitchingLine {
  id: string;
  name: string;
  outs: number; // out registrati (IP = outs/3)
  bf: number;
  h: number;
  r: number;
  er: number;
  bb: number;
  so: number;
  hr: number;
  /** Decisione (W/L/SV) assegnata a fine partita; null se nessuna. */
  dec: PitchDecision | null;
  /** Vantaggio della propria squadra al momento dell'ingresso (per i save). */
  enteredDiff: number;
}

export function newBattingLine(b: Batter): BattingLine {
  return {
    id: b.id,
    name: b.name,
    position: b.position,
    ab: 0,
    r: 0,
    h: 0,
    rbi: 0,
    bb: 0,
    so: 0,
    double: 0,
    triple: 0,
    hr: 0,
    sb: 0,
    cs: 0,
    lob: 0,
  };
}

export function newPitchingLine(p: Pitcher): PitchingLine {
  return {
    id: p.id,
    name: p.name,
    outs: 0,
    bf: 0,
    h: 0,
    r: 0,
    er: 0,
    bb: 0,
    so: 0,
    hr: 0,
    dec: null,
    enteredDiff: 0,
  };
}

/** Formatta gli inning lanciati (es. 6.2 = 6 inning e 2 out). */
export function formatIp(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

/** Formatta una media come nel baseball: senza lo zero iniziale (.256). */
export function formatAvg(value: number): string {
  if (!isFinite(value)) return '.000';
  return value.toFixed(3).replace(/^0/, '');
}
