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

// Media STAR-SENSIBILE: i titolari migliori (difference-maker, che decidono le
// partite) pesano piu' dei comprimari — cosi' una squadra con 2-3 fenomeni legge
// nettamente piu' forte di una piatta con la stessa media aritmetica. I titolari
// sono ordinati per valore e pesati a scalare (il top `1+STAR_TILT`, l'ultimo 1);
// le riserve pesano meno (giocano poco). Il tutto-medio resta ~media (no-op).
const STAR_TILT = 0.7;
function starMean(
  starters: number[],
  reserves: number[],
  reserveWeight: number,
): number {
  const vals = [...starters].sort((a, b) => b - a);
  const denom = Math.max(1, vals.length - 1);
  let sum = 0;
  let w = 0;
  vals.forEach((v, i) => {
    const ww = 1 + STAR_TILT * (1 - i / denom);
    sum += v * ww;
    w += ww;
  });
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

  const attack = starMean(team.lineup.map(off), team.bench.map(off), 0.4);
  const pitching = starMean(team.rotation.map(pit), team.bullpen.map(pit), 0.6);
  let defense = starMean(team.lineup.map(def), team.bench.map(def), 0.4);

  // Forza IBRIDA: i rating individuali restano peripherals (abilita' controllabile),
  // ma la DIFESA della squadra assorbe la PREVENZIONE-PUNTI reale (ERA vera del team:
  // difesa+park+staff, l'edge che i peripherals dei singoli non colgono). Solo import
  // storico (context presente); la lega generata resta 100% rating.
  if (team.context) defense = 0.5 * defense + 0.5 * team.context.prevent;

  // Attacco e prevenzione (lancio+difesa) guidano; la difesa pesa un filo di piu'
  // (ibrido) cosi' i team run-prevention leggono forte senza gonfiare i lanciatori.
  const total = 0.4 * attack + 0.25 * defense + 0.35 * pitching;

  return {
    total: clampRating(total),
    attack: clampRating(attack),
    defense: clampRating(defense),
    pitching: clampRating(pitching),
  };
}
