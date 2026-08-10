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
  /** Prob. che un RIMBALZO-out con corridore in prima e <2 out diventi doppio
   *  gioco. Alzata 0.13 → 0.30: a 0.13 il DP era ~0.22/squadra/gara (~1/4 della MLB
   *  0.7-0.9, quasi invisibile); ora ~0.5/squadra, ben visibile, senza tassare
   *  troppo l'offesa dell'era (i DP tolgono corridori e chiudono inning). Modulata
   *  dal RANGE interni (`dpRange`). */
  gidpProb: 0.3,
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
   * "Hook" dell'auto-manager sul PARTENTE (SP): due inneschi oltre l'affaticamento,
   * entrambi per togliere un partente che sta andando male (entra un rilievo lungo,
   * `pickReliever`). Solo auto-gestione (CPU / quick-sim), non la difesa manuale.
   *  - EMORRAGIA PRECOCE: `inning < beforeInning` e la squadra è sotto di `deficit`+
   *    punti (limita i danni presto, prima ancora dell'affaticamento);
   *  - BOMBARDATO: il partente ha subìto `shelledRuns`+ punti, a QUALSIASI inning
   *    (un manager non lascia in campo chi prende una valanga anche se non è ancora
   *    al limite di resistenza — era il buco: dal 5° in poi restava solo la fatica).
   */
  earlyHook: {
    beforeInning: 5, // emorragia precoce: solo nei primi 4 inning ("prima del 5°")
    deficit: 4, // sotto di 4+ punti col partente in pedana
    shelledRuns: 6, // punti subiti dal partente oltre cui va tolto, a ogni inning
  },

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
   * Hit-and-run (corridori in movimento): il corridore "lanciato" parte col lancio
   * e il battitore protegge (bias al contatto). Disponibile con un corridore in 1ª
   * (2ª libera) O in 2ª (3ª libera): dalla 2ª su singolo SEGNA, ma su rimbalzo
   * rischia di più l'eliminazione alla base d'arrivo.
   * - `contactSaveBase` = prob. che uno strikeout diventi palla in gioco (sale col
   *   contatto). `firstToThird` = prob. che su groundout il corridore dalla 1ª
   *   arrivi in 3ª (di solito va in 2ª).
   * - `caughtAdvancingFrom1st/2nd` = su rimbalzo, prob. che la difesa elimini il
   *   corridore lanciato alla base d'arrivo (più alta dalla 2ª verso la 3ª, palla
   *   agli interni): è il RISCHIO della giocata. Se preso, il battitore è salvo in
   *   prima (scelta difensiva).
   */
  hitAndRun: {
    contactSaveBase: 0.35,
    contactSavePerContact: 0.05,
    contactSaveMin: 0.1,
    contactSaveMax: 0.6,
    firstToThird: 0.3,
    caughtAdvancingFrom1st: 0.1,
    caughtAdvancingFrom2nd: 0.3,
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
   * Difesa PESATA PER REPARTO — layer differenziali che fanno contare i *fielder
   * coinvolti* nella giocata, sopra il modello base (che resta invariato). I
   * neutrali sono le medie di lega MISURATE sul generatore (interni ~82.9, esterni
   * ~82.1), così una squadra media è un NO-OP su questi layer e non sposta gli
   * aggregati; solo lo SPREAD attorno alla media cambia. sigma = (rep − neutral)/10.
   *
   *  - `extraBaseDefense`: gli ESTERNI limitano i doppi/tripli (range nei gap e
   *    sulle righe). Soppressione AGGIUNTIVA di 2B/3B in `combineRates`, oltre a
   *    quella uniforme del modello base → una gran difesa esterna taglia gli
   *    extrabase più dei singoli. Neutro = no-op.
   *  - `dpRange`: gli INTERNI schierati bene convertono più doppi giochi (col
   *    corridore in 1ª, <2 out). Bonus/malus sul `gidpProb`, simmetrico attorno al
   *    neutro → offense-neutral in media.
   */
  extraBaseDefense: {
    neutral: 82.1,
    perSigma: 0.06, // per sigma di difesa esterna: quota di 2B/3B in più/meno spostata su out
    min: 0.82,
    max: 1.18,
  },
  dpRange: {
    neutral: 82.9,
    perSigma: 0.05, // +/- conversione DP per sigma di difesa interna
    maxBonus: 0.12,
  },

  /**
   * ERRORI difensivi. Su un out in gioco il fielder coinvolto (interni sul
   * rimbalzo, esterni in aria) può sbagliare: il battitore raggiunge la prima
   * (reached-on-error), i corridori avanzano di una, l'eventuale punto è *unearned*.
   * Prob. guidata dal fielding del reparto rispetto al neutro (difesa scarsa =
   * più errori). A difesa media vale `base`: è la nuova baseline dell'ambiente
   * (il quick-sim la usa → gli aggregati sono ricalibrati attorno a questa).
   *   pErr = clamp(base − sigmaReparto·perSigma, min, max)
   */
  errors: {
    base: 0.022, // ~ errore su 2.2% degli out in gioco a difesa media
    perSigma: 0.011,
    min: 0.004,
    max: 0.06,
    // Sottotipo dell'errore su palla IN GIOCO (avanzamento realistico, non più un
    // "tutti +1 a palla ferma"): quota di errori che valgono una BASE IN PIÙ —
    // battitore fino in 2ª e corridori +2 invece di +1.
    //  - interni/pop: errore di LANCIO (tiro sbagliato) oltre al semplice bobble;
    //  - esterni: volata LASCIATA CADERE (≈ un doppio).
    throwShare: 0.25, // errori di interni/pop che diventano errori di lancio
    flyExtraShare: 0.6, // volate su errore che valgono la seconda base
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
   * Tattica offensiva "cerca fly ball": col corridore in terza e <2 out il
   * battitore ELEVA per la volata di sacrificio. La palla va quasi sempre in aria
   * (`flyShare`); una volata profonda porta a casa il corridore con conversione
   * alta (`sacflyConv`, ben sopra il `runnerScoresFromThirdOnOut` base .35). Il
   * costo dell'elevazione: parte del contatto "buono" diventa un out in aria
   * (`singleToFly` / `extraBaseToFly`) — meno valide, ma il punto arriva. Azione
   * one-shot INTERATTIVA: mai chiamata dal quick-sim (Fase 0 invariata).
   */
  flyBall: {
    flyShare: 0.78, // quota di palle davvero elevate (resto = pop mancato, corridore fermo)
    sacflyConv: 0.82, // conversione volata di sacrificio (3ª -> casa)
    singleToFly: 0.35, // singoli sacrificati per l'elevazione
    extraBaseToFly: 0.2, // costo minore sui doppi/tripli (drive genuino, li tieni piu' spesso)
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
    // Rubata — CALMIERATA: la CPU rubava ~2.2/squadra/partita (troppe, ~3× il
    // realistico ~0.6-0.7). Solo corridori davvero veloci, alte chance, di rado.
    stealMinSpeed: 68, // sotto questa VEL il corridore non tenta
    stealMinProb: 0.7, // sotto questa prob. di riuscita non tenta
    stealBase: 0.04,
    stealPerSpeed: 0.08, // per sigma di VEL sopra la media
    stealLateBonus: 0.05, // dal 7° con partita in bilico
    stealMax: 0.25,
    // Bunt di sacrificio (0 out, corridore in 1ª/2ª, battitore debole)
    buntMaxHitter: 58, // media potenza+contatto sotto cui e' "debole"
    buntProb: 0.35,
    // Hit-and-run (corridore in 1ª, 2ª libera, buon contatto)
    hnrMinContact: 68,
    hnrProb: 0.18,
    // Cerca fly ball (corridore in 3ª, <2 out): incassa il punto con la volata
    flyProb: 0.3,
    flySkipPower: 78, // gli slugger tentano il colpo, non il fly di servizio
  },

  /**
   * Gestione PANCHINA della CPU (SOLO gioco interattivo): pinch-hit, pinch-runner
   * e sostituzioni difensive. Conservativa (tardo-gara, situazioni chiave) per non
   * bruciare la panchina. Mai nel quick-sim → calibrazione di stagione invariata.
   *  - Pinch-hit: dal `phMinInning`, gara in bilico (|diff| ≤ `phMaxDeficit`), con
   *    corridori in posizione punto (o dall'`phLateInning`), per un titolare debole
   *    (OVR < `phMaxStarterOvr`) se un panchinaro è meglio di `phMinGain`+ (incluso
   *    il bonus platoon `phPlatoonBonus` contro la mano del lanciatore).
   *  - Pinch-runner: dal `prMinInning`, gara tirata, per un corridore LENTO
   *    (VEL < `prMaxRunnerSpeed`) se un panchinaro è più veloce di `prMinSpeedGain`+.
   *  - Sostituzione difensiva: dal `defSubMinInning` proteggendo un vantaggio 1-
   *    `defSubLeadMax`, sostituisce un titolare con difesa scarsa alla casella
   *    (< `defSubMaxStarterField`) con un panchinaro migliore di `defSubMinGain`+.
   */
  cpuBench: {
    phMinInning: 7,
    phLateInning: 8, // senza corridori in posizione punto serve almeno l'8°
    phMaxStarterOvr: 66, // non si pinch-hitta un titolare valido
    phMaxDeficit: 3,
    phMinGain: 6,
    phPlatoonBonus: 5,
    prMinInning: 8,
    prMaxDeficit: 2,
    prMaxRunnerSpeed: 55,
    prMinSpeedGain: 18,
    defSubMinInning: 8,
    defSubLeadMax: 4,
    defSubMaxStarterField: 66,
    defSubMinGain: 8,
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
    // Balk fisso, dimezzato per allinearlo alla MLB reale (~0.06/gara both, prima
    // ~2x): su ~34-40 turni-con-corridori a gara → ~0.06/gara.
    balk: 0.0015,
    homeBase: 0.5,
    homePerSpeed: 0.09,
    homeMin: 0.25,
    homeMax: 0.8,
  },
};
