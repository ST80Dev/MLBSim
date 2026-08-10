import type { Batter } from './types';
import type { TeamGameStats } from './game';
import type { Rng } from './rng';
import { clamp } from './rng';
import { RATING_AVG } from './ratings';

// ---------------------------------------------------------------------------
// Rubate SINTETIZZATE per le partite quick-sim (CPU-vs-CPU della lega).
//
// Il quick-sim (`autoStep`) NON modella le tattiche — quindi nemmeno le rubate —
// per tenere lo stream RNG (e la calibrazione "Fase 0") deterministico e
// invariato. Risultato: senza questo layer, ogni partita CPU-vs-CPU produce 0 SB
// e la leaderboard mostra rubate solo per chi ha giocato contro l'umano.
//
// Qui le rubate si SINTETIZZANO come statistica derivata-ma-simulata SOPRA il box
// score, con un RNG DEDICATO (seedato a parte): il core-sim resta byte-identico
// (punti, ERA, record invariati), ma ogni squadra accumula SB/CS realistiche
// guidate dalla Velocità dei corridori. Coerente col principio "le statistiche
// sono un output": le doti guidano il peripheral (SB), non un dato inserito.
//
// Calibrazione: epoca alta-offesa anni '90/2000 → i velocisti di lega arrivano a
// ~40-60 SB in 162 gare, i giocatori lenti restano vicini a 0.
// ---------------------------------------------------------------------------

export const STEAL_SYNTH = {
  /** Tentativi per occasione (in 1ª) a Velocità media: quasi nulli. */
  attemptBase: 0.015,
  /** Incremento per sigma di Velocità sopra la media (10 pt = 1 sigma). */
  attemptPerSpeed: 0.075,
  /** Tetto sulla frequenza di tentativo (anche i fenomeni non rubano su ~1/4
   *  delle volte in base): tiene i leader di lega a ~40-60 SB/162. */
  attemptMax: 0.22,
  /** Sotto questa Velocità (in sigma) non si tenta: i lenti restano ~0 SB. */
  minSpeedSigma: 0.5,
  /** Riuscita base della rubata (della 2ª), a Velocità media. */
  successBase: 0.7,
  successPerSpeed: 0.04,
  successMin: 0.5,
  successMax: 0.9,
};

/**
 * Aggiunge rubate/eliminazioni-in-rubata alle righe offensive di UNA squadra,
 * mutando `stats.batting[].sb/.cs`. Le occasioni sono le volte in cui il
 * battitore è arrivato in 1ª base (singoli + basi ball, ricavati dal box score);
 * per ognuna si tira un tentativo (frequenza guidata dalla Velocità) e, se parte,
 * l'esito (riuscita guidata dalla Velocità). Usa un RNG a parte: NON tocca lo
 * stream del quick-sim. Idempotenza NON garantita (accumula): chiamare una volta
 * per partita. I giocatori senza voce in rosa (id sconosciuto) sono ignorati.
 */
export function synthesizeStolenBases(batters: Batter[], stats: TeamGameStats, rng: Rng): void {
  const speedById = new Map(batters.map((b) => [b.id, b.ratings.speed]));
  for (const bl of stats.batting) {
    const speed = speedById.get(bl.id);
    if (speed === undefined) continue;
    const sigma = (speed - RATING_AVG) / 10;
    if (sigma < STEAL_SYNTH.minSpeedSigma) continue;
    const singles = bl.h - bl.double - bl.triple - bl.hr;
    const opps = Math.max(0, singles) + bl.bb; // volte in 1ª da cui rubare la 2ª
    if (opps <= 0) continue;
    const pAttempt = clamp(
      STEAL_SYNTH.attemptBase + sigma * STEAL_SYNTH.attemptPerSpeed,
      0,
      STEAL_SYNTH.attemptMax,
    );
    const pSuccess = clamp(
      STEAL_SYNTH.successBase + sigma * STEAL_SYNTH.successPerSpeed,
      STEAL_SYNTH.successMin,
      STEAL_SYNTH.successMax,
    );
    for (let i = 0; i < opps; i++) {
      if (!rng.chance(pAttempt)) continue;
      if (rng.chance(pSuccess)) bl.sb += 1;
      else bl.cs += 1;
    }
  }
}
