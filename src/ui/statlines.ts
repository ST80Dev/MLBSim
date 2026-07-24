import type { Batter, Pitcher } from '../engine/types';
import type { BattingLine, PitchingLine } from '../engine/boxscore';
import { formatAvg, formatIp } from '../engine/boxscore';

// Righe statistiche mostrate nella UI, in tre modalita':
//  - 'game'   : statistiche della partita in corso (dato reale).
//  - 'season' : proiezione di stagione derivata dalle DOTI (player.stats, ~650
//               PA / 1000 BF). Non e' una stagione realmente giocata: e' il
//               rendimento atteso dalle caratteristiche. L'accumulo vero arriva
//               in Fase 4.
//  - 'last'   : stagione precedente — NON disponibile finche' non esiste uno
//               storico (Fase 4). La UI la tiene disabilitata.
export type StatsMode = 'game' | 'season' | 'last';

export interface StatItem {
  k: string;
  v: string;
}

export const STATS_MODE_LABEL: Record<StatsMode, string> = {
  game: 'Partita',
  season: 'Stagione',
  last: 'Carriera',
};

/** Iniziale per i pulsantini G/S/C. */
export const STATS_MODE_SHORT: Record<StatsMode, string> = {
  game: 'G',
  season: 'S',
  last: 'C',
};

export const STATS_MODE_TITLE: Record<StatsMode, string> = {
  game: 'Partita — statistiche di questa gara',
  season: 'Stagione — proiezione dalle doti',
  last: 'Carriera — disponibile con lo storico (Fase 4)',
};

/** Riga statistica di un battitore per la modalita' scelta. */
export function batterStatLine(
  mode: StatsMode,
  game: BattingLine | undefined,
  b?: Batter,
): StatItem[] {
  if (mode === 'season' && b) {
    const s = b.stats;
    const ab = Math.max(1, s.pa - s.bb - s.hbp);
    const singles = Math.max(0, s.h - s.double - s.triple - s.hr);
    const avg = s.h / ab;
    const obp = (s.h + s.bb + s.hbp) / Math.max(1, s.pa);
    const slg = (singles + 2 * s.double + 3 * s.triple + 4 * s.hr) / ab;
    return [
      { k: 'AVG', v: formatAvg(avg) },
      { k: 'OBP', v: formatAvg(obp) },
      { k: 'SLG', v: formatAvg(slg) },
      { k: 'HR', v: String(s.hr) },
      { k: 'BB', v: String(s.bb) },
      { k: 'SO', v: String(s.so) },
      { k: 'SB', v: String(s.sb) },
    ];
  }
  const ab = game?.ab ?? 0;
  return [
    { k: 'AB', v: String(ab) },
    { k: 'R', v: String(game?.r ?? 0) },
    { k: 'H', v: String(game?.h ?? 0) },
    { k: 'HR', v: String(game?.hr ?? 0) },
    { k: 'RBI', v: String(game?.rbi ?? 0) },
    { k: 'BB', v: String(game?.bb ?? 0) },
    { k: 'SO', v: String(game?.so ?? 0) },
    { k: 'AVG', v: formatAvg(ab ? (game as BattingLine).h / ab : 0) },
  ];
}

/** Riga statistica di un lanciatore per la modalita' scelta. */
export function pitcherStatLine(
  mode: StatsMode,
  game: PitchingLine | undefined,
  p?: Pitcher,
): StatItem[] {
  if (mode === 'season' && p) {
    const s = p.stats;
    const outs = Math.max(1, s.bf - s.h - s.bb - s.hbp);
    const ip = outs / 3;
    return [
      { k: 'K/9', v: ((s.so / ip) * 9).toFixed(1) },
      { k: 'BB/9', v: ((s.bb / ip) * 9).toFixed(1) },
      { k: 'WHIP', v: ((s.h + s.bb) / ip).toFixed(2) },
      { k: 'HR/9', v: ((s.hr / ip) * 9).toFixed(1) },
      { k: 'SO', v: String(s.so) },
    ];
  }
  return [
    { k: 'IP', v: game ? formatIp(game.outs) : '0.0' },
    { k: 'H', v: String(game?.h ?? 0) },
    { k: 'R', v: String(game?.r ?? 0) },
    { k: 'ER', v: String(game?.er ?? 0) },
    { k: 'BB', v: String(game?.bb ?? 0) },
    { k: 'SO', v: String(game?.so ?? 0) },
  ];
}
