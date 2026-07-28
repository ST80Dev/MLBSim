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
  hr: 0.026,
  triple: 0.0032,
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

  /**
   * Logica di campo sugli out su palla in gioco (oltre il motore lineare):
   * tipo di battuta e avanzamenti reali dei corridori. Tarati sui test di
   * realismo (l'ambiente-punti deve restare nella banda ~4.3–6.2 R/squadra).
   */
  outField: {
    /** Quota di out in gioco che sono RIMBALZI (il resto e' palla in aria). */
    groundShare: 0.44,
    /** Degli out in aria, quota di PRESE COMODE d'interno (pop, nessun
     *  avanzamento); il resto sono volate profonde (tag-up/SF possibili). */
    popupShareOfAir: 0.3,
    /** Prob. che su un rimbalzo (battitore out in prima) un corridore avanzi di
     *  una base, se quella davanti e' libera (out produttivo). */
    productiveAdvanceOnGrounder: 0.35,
    /** Prob. che, con corridore in 2ª e 1ª libera (<2 out), la difesa scelga di
     *  eliminare il corridore verso la 3ª lasciando il battitore salvo in 1ª. */
    fielderChoiceLeadRunner: 0.35,
    /** Prob. che su volata profonda il corridore in 2ª guadagni la 3ª (tag-up),
     *  se la 3ª e' libera e <2 out. */
    tagUpSecondToThirdOnFly: 0.3,
  },
  /** Prob. che su singolo il corridore dalla seconda segni (altrimenti va in terza). */
  runnerScoresFromSecondOnSingle: 0.6,
  /** Prob. che su singolo il corridore in prima arrivi in terza. */
  firstToThirdOnSingle: 0.25,
  /** Vantaggio/penalita' di platoon sulle hit (mano opposta vs stessa mano). */
  platoonHitBonus: 1.08,
  platoonHitPenalty: 0.93,
  /** Incremento dei rate concessi per ogni battitore oltre la stamina. */
  fatiguePerBatter: 0.03,

  /**
   * Rubata di base (attiva doti Velocita' del corridore, Braccio del ricevitore,
   * Difesa/hold del lanciatore). Probabilita' di riuscita:
   *   base + speed*perSpeed - arm*perArm - hold*perHold - (rubata di 3a? penalita')
   * dove speed/arm/hold sono in sigma (rating-50)/10.
   */
  steal: {
    base: 0.7,
    perSpeed: 0.06,
    perArm: 0.05,
    perHold: 0.02,
    stealThirdPenalty: 0.08,
    min: 0.15,
    max: 0.95,
  },

  /**
   * Bunt di sacrificio (attiva la Difesa del lanciatore e la Velocita' del
   * battitore). Ripartizione dell'esito: valida (hit), sacrificio fallito
   * (corridore di testa eliminato), pop-out, altrimenti sacrificio riuscito.
   */
  bunt: {
    hitBase: 0.1,
    hitPerSpeed: 0.03,
    hitPerField: 0.02,
    hitMin: 0.02,
    hitMax: 0.3,
    failBase: 0.12,
    failPerField: 0.04,
    failMin: 0.05,
    failMax: 0.35,
    popBase: 0.07,
  },

  /**
   * Hit-and-run: il corridore parte, il battitore protegge (bias al contatto).
   * `contactSaveBase` = prob. che uno strikeout diventi palla in gioco (piu' il
   * contatto e' alto, piu' sale). `firstToThird` = prob. che su groundout il
   * corridore dalla prima arrivi in terza (di solito va in seconda).
   */
  hitAndRun: {
    contactSaveBase: 0.35,
    contactSavePerContact: 0.05,
    contactSaveMin: 0.1,
    contactSaveMax: 0.6,
    firstToThird: 0.3,
  },

  /**
   * Difesa dietro il lanciatore (scollegatore ERA↔talento, Fase 4). La qualita'
   * del reparto difensivo sposta la BABIP: una gran difesa trasforma parte delle
   * hit su palla in gioco in out, una difesa scarsa fa il contrario. Tocca SOLO
   * le palle in gioco (1B/2B/3B <-> out su palla in gioco), MAI HR/BB/HBP/SO
   * (principio DIPS: il lanciatore controlla i "three true outcomes", il resto e'
   * difesa + sequenza). Non consuma RNG: sposta solo le soglie prima del sorteggio.
   *   d = (defRating - neutral) / 10          (in sigma; defRating = teamSynthesis().def)
   *   fattore hit-in-play = clamp(1 - d*perSigma, min, max)
   * `neutral` = media di lega della sintesi difensiva misurata sul generatore
   * (~76): cosi' una difesa media e' un NO-OP e gli aggregati di lega (Fase 0)
   * restano invariati; solo l'ERD del singolo lanciatore galleggia col reparto
   * dietro di lui. `perSigma` tarato perche' lo spread di ERA sia sensibile ma
   * non dominante (la difesa conta, il lanciatore resta il fattore principale).
   */
  defense: {
    neutral: 76,
    perSigma: 0.075,
    min: 0.8,
    max: 1.2,
  },

  /**
   * Difesa avanzata "interni dentro": taglia il punto da terra col corridore in
   * terza, ma lascia piu' buchi. `hitThrough` = prob. che il rimbalzo passi per
   * un singolo (il punto segna); altrimenti battitore eliminato e corridore
   * tenuto in terza (niente punto).
   */
  infieldIn: {
    hitThrough: 0.18,
  },

  /**
   * Difesa avanzata "interni a doppio gioco": interni giocati in posizione da DP
   * col corridore in prima (<2 out). Alza la conversione del doppio gioco, ma
   * lascia qualche buco in piu' (rimbalzi che passano per un singolo). SOLO turni
   * interattivi (flag di default false): il quick-sim non la usa mai e la Fase 0
   * resta invariata (nessun RNG consumato quando spenta).
   *   gidp effettiva = gidpProb + gidpBonus
   *   hitThrough = prob. che un rimbalzo passi nei buchi (singolo)
   */
  dpDepth: {
    gidpBonus: 0.12,
    hitThrough: 0.06,
  },

  /**
   * Difesa anti-extrabase ("difendi le righe / esterni profondi"): tardo-gara,
   * per proteggere un vantaggio risicato. Declassa una quota di doppi/tripli a
   * singolo (i corridori avanzano una base in meno). SOLO turni interattivi
   * (flag di default false): il quick-sim non la usa mai (nessun RNG consumato
   * quando spenta), Fase 0 invariata.
   */
  noDoubles: {
    downgrade: 0.5,
  },

  /**
   * AI tattica minima della CPU in attacco (small-ball). Attiva SOLO nei turni
   * interattivi (quando l'umano difende): il quick-sim / Fase 0 restano swing
   * puro e NON consumano questo RNG. Le probabilita' sono guidate dalle doti
   * (VEL per la rubata, contatto/potenza per bunt e hit-and-run) e dal contesto
   * (punteggio, inning). Soglie volutamente basse: la CPU non fa small-ball a
   * caso, solo quando ha senso da manuale.
   */
  cpuTactics: {
    // Rubata
    stealMinSpeed: 62, // sotto questa VEL il corridore non tenta
    stealMinProb: 0.6, // sotto questa prob. di riuscita non tenta
    stealBase: 0.12,
    stealPerSpeed: 0.14, // per sigma di VEL sopra la media
    stealLateBonus: 0.1, // dal 7° con partita in bilico
    stealMax: 0.6,
    // Bunt di sacrificio (0 out, corridore in 1ª/2ª, battitore debole)
    buntMaxHitter: 58, // media potenza+contatto sotto cui e' "debole"
    buntProb: 0.35,
    // Hit-and-run (corridore in 1ª, 2ª libera, buon contatto)
    hnrMinContact: 68,
    hnrProb: 0.18,
  },

  /**
   * Micro-eventi pre-lancio coi corridori in base (SOLO turni interattivi, mai
   * nel quick-sim: la Fase 0 resta invariata). Fanno avanzare i corridori senza
   * consumare il turno. Probabilita' di *accadere* per lancio, guidate dalle doti
   * (peripherals): il Controllo del lanciatore riduce i lanci pazzi, la Difesa
   * del ricevitore le palle passate.
   *   pWp = clamp(wpBase - ctrl_sigma*wpPerControl, wpMin, wpMax)
   *   pPb = clamp(pbBase - catch_sigma*pbPerCatch, pbMin, pbMax)
   *   pBalk = balk (fisso)
   * L'avanzamento dei corridori indietro (1a->2a, 2a->3a) e' facile; il
   * corridore in **terza va a casa** solo con probabilita' contenuta, guidata
   * dalla sua Velocita' (il balk lo manda a segno d'ufficio, per regola):
   *   pHome = clamp(homeBase + speed_sigma*homePerSpeed, homeMin, homeMax)
   */
  wildPitch: {
    wpBase: 0.019,
    wpPerControl: 0.008,
    wpMin: 0.005,
    wpMax: 0.05,
    pbBase: 0.009,
    pbPerCatch: 0.005,
    pbMin: 0.002,
    pbMax: 0.026,
    balk: 0.003,
    homeBase: 0.5,
    homePerSpeed: 0.09,
    homeMin: 0.25,
    homeMax: 0.8,
  },
};
