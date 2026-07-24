import type { PaRates } from './types';

/**
 * Medie di lega per PA. Sono il riferimento del metodo odds-ratio/Log5:
 * combinano tendenza del battitore e del lanciatore rispetto a questa base.
 * Il giocatore MEDIO (tutte le doti a 50) rende ~.253 BA. La popolazione
 * generata, con le cime, porta l'aggregato di lega verso uno stile "alta
 * offesa anni '90/2000": ~.275 BA, ~5.2 R/squadra/partita, sluggers da 45+
 * HR e assi capaci comunque di ERA sotto 2.
 */
export const LEAGUE: PaRates = {
  bb: 0.085,
  hbp: 0.01,
  so: 0.18,
  hr: 0.028,
  triple: 0.005,
  double: 0.045,
  single: 0.153,
  outInPlay: 0, // calcolato come resto
};
LEAGUE.outInPlay =
  1 -
  (LEAGUE.bb +
    LEAGUE.hbp +
    LEAGUE.so +
    LEAGUE.hr +
    LEAGUE.triple +
    LEAGUE.double +
    LEAGUE.single);

/** Proporzioni fra le hit di lega, per ripartire le hit non-HR di un lanciatore. */
export const LEAGUE_HIT_SPLIT = {
  single: LEAGUE.single,
  double: LEAGUE.double,
  triple: LEAGUE.triple,
  sum: LEAGUE.single + LEAGUE.double + LEAGUE.triple,
};

/**
 * Costanti di calibrazione dell'ambiente di gioco (corsa sulle basi).
 * Raccolte qui per poterle regolare facilmente osservando i test di realismo.
 */
export const TUNING = {
  /** Prob. che un out con corridore in prima e <2 out diventi doppio gioco. */
  gidpProb: 0.13,
  /** Prob. che un out con corridore in terza e <2 out faccia segnare (SF/groundout RBI). */
  runnerScoresFromThirdOnOut: 0.35,
  /** Prob. che su singolo il corridore dalla seconda segni (altrimenti va in terza). */
  runnerScoresFromSecondOnSingle: 0.6,
  /** Prob. che su singolo il corridore in prima arrivi in terza. */
  firstToThirdOnSingle: 0.25,
  /** Vantaggio/penalita' di platoon sulle hit (mano opposta vs stessa mano). */
  platoonHitBonus: 1.08,
  platoonHitPenalty: 0.93,
  /** Incremento dei rate concessi per ogni battitore oltre la stamina. */
  fatiguePerBatter: 0.03,
};
