import type { BatterRatings, PitcherRatings, Team, Batter, Pitcher } from './types';
import { clampRating, pitcherOverall } from './ratings';

// Punteggio di forza della squadra, comparabile fra squadre e scomposto in
// Totale / Attacco / Difesa / Lancio. Deriva SOLO dai giocatori "in formazione":
// lineup + panchina (battitori) e rotazione + bullpen (lanciatori). Chi e' a
// roster ma fuori formazione non incide (per ora non esiste tale distinzione:
// lineup+bench e rotation+bullpen sono l'organico schierato).
//
// Scala 20-80 come le doti, cosi' i numeri sono leggibili e confrontabili.

export interface TeamStrength {
  total: number;
  attack: number;
  defense: number;
  pitching: number;
}

/** Valore offensivo del battitore (contatto/potenza/occhio, spruzzo di velocita'). */
function batterOffense(r: BatterRatings): number {
  return 0.42 * r.contact + 0.34 * r.power + 0.2 * r.eye + 0.04 * r.speed;
}

/** Valore difensivo del battitore (difesa + braccio). */
function batterDefense(r: BatterRatings): number {
  return 0.68 * r.fielding + 0.32 * r.arm;
}

/** Valore di lancio (Resistenza esclusa: conta la qualita', non l'autonomia). */
function pitchValue(r: PitcherRatings): number {
  return pitcherOverall(r);
}

/** Media pesata: i titolari pesano piu' delle riserve (giocano di piu'). */
function weightedMean(
  starters: number[],
  reserves: number[],
  reserveWeight: number,
): number {
  let sum = 0;
  let w = 0;
  for (const v of starters) {
    sum += v;
    w += 1;
  }
  for (const v of reserves) {
    sum += v * reserveWeight;
    w += reserveWeight;
  }
  return w > 0 ? sum / w : 0;
}

export function teamStrength(team: Team): TeamStrength {
  const off = (b: Batter) => batterOffense(b.ratings);
  const def = (b: Batter) => batterDefense(b.ratings);
  const pit = (p: Pitcher) => pitchValue(p.ratings);

  const attack = weightedMean(team.lineup.map(off), team.bench.map(off), 0.4);
  const defense = weightedMean(team.lineup.map(def), team.bench.map(def), 0.4);
  const pitching = weightedMean(team.rotation.map(pit), team.bullpen.map(pit), 0.6);

  // Peso relativo nel "totale": attacco e lancio guidano, la difesa rifinisce.
  const total = 0.4 * attack + 0.2 * defense + 0.4 * pitching;

  return {
    total: clampRating(total),
    attack: clampRating(attack),
    defense: clampRating(defense),
    pitching: clampRating(pitching),
  };
}
