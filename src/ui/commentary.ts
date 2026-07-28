// Costruzione della cronaca "da telecronista" per il banner della schermata
// partita e della riga sintetica del log laterale. Trasforma UN PlayEvent (esito
// gia' calcolato dal motore) in testo vario.
//
// NB: e' puramente PRESENTAZIONE. Non tocca il motore, non consuma RNG: la
// varieta' delle frasi e' DETERMINISTICA (hash dell'evento), cosi' lo stesso
// turno produce sempre la stessa telecronaca.
//
// --- Sottotipi di battuta pesati sulle frequenze reali MLB -------------------
// Il motore risolve solo l'ESITO (1B/2B/3B/HR/strikeout/out su palla in gioco):
// non sa se un out e' una rullata o una volata, ne' se un singolo passa a terra o
// cade come bloop. Quel dettaglio e' narrazione, quindi lo assegniamo QUI, ma non
// a caso: ogni esito estrae un SOTTOTIPO con pesi che approssimano il mix reale
// della MLB (fonti sabermetriche, era moderna). Cosi', su tante azioni, la
// frequenza dei groundout/flyout/lineout/popout, o dei singoli a terra/in
// linea/bloop, rispecchia la realta' del gioco — pur restando pura presentazione.
//
//   Palline in gioco (MLB): ground ball ~44%, fly ball ~36%, line drive ~20%.
//   Ma pesate per la probabilita' di diventare OUT (la line drive e' quasi sempre
//   valida, BABIP ~.68; il pop-up e' quasi sempre out): tra gli OUT su palla in
//   gioco prevalgono groundout e flyout, la lineout e' rara.
//   Strikeout: ~72% a vuoto (swinging), ~28% guardati (called) — dato MLB.

import type { PlayEvent, PlayKind } from '../engine/game';

/** Squadra coinvolta, con quel che serve per tema e testo. */
export interface BannerTeam {
  abbrev: string;
  name: string;
  color: string;
}

export interface BannerContext {
  /** Squadra in attacco (batte). */
  offense: BannerTeam;
  /** Squadra in difesa (lancia/difende). */
  defense: BannerTeam;
}

/** Una fase della telecronaca: testo + eventuale enfasi (l'ultima e' il verdetto). */
export interface CommentaryPhase {
  text: string;
  /** true sull'ultima fase (l'esito), che regge l'enfasi maggiore. */
  climax: boolean;
}

export interface Commentary {
  phases: CommentaryPhase[];
  /** Categoria grafica (guida icona/etichetta). */
  category: PlayKind;
  /** Intensita' 0..5 (crescente): guida dimensione, glow, animazione. */
  tier: number;
  /** Colore-tema del banner (colore della squadra protagonista). */
  color: string;
  /** Chi e' protagonista: chi attacca o chi difende. */
  accent: 'offense' | 'defense';
  /** Punti segnati sull'azione (per l'enfasi del verdetto). */
  scored: number;
  /** Etichetta breve maiuscola dell'esito (chip nel banner). */
  label: string;
  /** Icona/emoji dell'esito. */
  icon: string;
}

// --- Hashing deterministico --------------------------------------------------

/** Firma stabile di un evento: stesse componenti -> stessa telecronaca. */
function signature(ev: PlayEvent): string {
  return `${ev.inning}|${ev.half}|${ev.kind}|${ev.batter ?? ''}|${ev.text}`;
}

/** Hash FNV-1a di una stringa. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Indice deterministico 0..n-1 per l'evento, con un `salt` che separa i flussi
 *  (cosi' scelta del sottotipo e scelta della frase non sono correlate). */
function idx(ev: PlayEvent, salt: string, n: number): number {
  return hashStr(signature(ev) + '#' + salt) % n;
}

/** Sceglie una variante di frase (flusso separato per `salt`). */
function pick(ev: PlayEvent, opts: string[], salt = 'p'): string {
  return opts[idx(ev, salt, opts.length)];
}

/** Estrazione PESATA deterministica: i pesi (interi) approssimano le frequenze
 *  reali MLB. Su molti eventi distinti la distribuzione converge ai pesi. */
type Weighted<T> = ReadonlyArray<readonly [number, T]>;
function weighted<T>(ev: PlayEvent, salt: string, table: Weighted<T>): T {
  const total = table.reduce((a, [w]) => a + w, 0);
  let r = hashStr(signature(ev) + '@' + salt) % total;
  for (const [w, v] of table) {
    if (r < w) return v;
    r -= w;
  }
  return table[table.length - 1][1];
}

// --- Tabelle dei sottotipi (pesi = % reali MLB approssimate) -----------------

/** OUT su palla in gioco (escl. strikeout): prevalgono groundout e flyout. */
const OUT_TYPES: Weighted<'groundout' | 'flyout' | 'popout' | 'lineout'> = [
  [47, 'groundout'],
  [33, 'flyout'],
  [12, 'popout'],
  [8, 'lineout'],
];

/** SINGOLO: rullata nel buco > linea in esterno > bloop > singolo interno. */
const SINGLE_TYPES: Weighted<'grounder' | 'liner' | 'blooper' | 'infield'> = [
  [46, 'grounder'],
  [34, 'liner'],
  [13, 'blooper'],
  [7, 'infield'],
];

/** DOPPIO: linea in gap > lungo la linea > sul muro > rullata nell'angolo. */
const DOUBLE_TYPES: Weighted<'gap' | 'line' | 'wall' | 'corner'> = [
  [42, 'gap'],
  [26, 'line'],
  [18, 'wall'],
  [14, 'corner'],
];

/** TRIPLO (raro): gap con le ali > carambola d'angolo > esterno pasticciato. */
const TRIPLE_TYPES: Weighted<'gap' | 'corner' | 'misplay'> = [
  [55, 'gap'],
  [30, 'corner'],
  [15, 'misplay'],
];

/** STRIKEOUT: a vuoto ~72% / guardato ~28%. */
const K_TYPES: Weighted<'swinging' | 'looking'> = [
  [72, 'swinging'],
  [28, 'looking'],
];

/** FUORICAMPO: bomba netta > profondo > di un soffio oltre il muro. */
const HR_TYPES: Weighted<'nodoubter' | 'deep' | 'justenough'> = [
  [45, 'nodoubter'],
  [35, 'deep'],
  [20, 'justenough'],
];

// --- Pool di frasi per sottotipo ---------------------------------------------
// Ogni sottotipo ha: `log` (riga sintetica laterale), `action` (fase centrale
// prima del verdetto) e `verdict` (l'esito, in coda al banner). `{b}` = nome.

interface Flavor {
  log: string[];
  action: string[];
  verdict: string[];
}

const SINGLE_FLAVOR: Record<string, Flavor> = {
  grounder: {
    log: ['{b} singolo, rullata nel buco', '{b} singolo a terra tra gli interni', '{b} singolo, la palla passa a destra'],
    action: ['Attacca a terra, la palla s’infila nel buco…', 'Rimbalzo che scivola tra gli interni…'],
    verdict: ['SINGOLO di {b}!', '{b} in prima: SINGOLO!'],
  },
  liner: {
    log: ['{b} singolo in linea nell’esterno', '{b} singolo, frustata che cade davanti', '{b} singolo su una gran linea'],
    action: ['Frustata in linea che cade in esterno…', 'Contatto pulito, linea davanti all’esterno…'],
    verdict: ['SINGOLO di {b}!', 'Valida netta! {b} sul primo cuscino.'],
  },
  blooper: {
    log: ['{b} singolo, un bloop che cade tra le linee', '{b} singolo, palla molle che nessuno prende', '{b} singolo di fortuna nel nessun-uomo'],
    action: ['Elevata molle a campanile… cade tra i difensori…', 'Bloop sul quadrante, nessuno ci arriva…'],
    verdict: ['Cade! {b} sul singolo.', 'SINGOLO fortunoso di {b}!'],
  },
  infield: {
    log: ['{b} singolo interno, la batte per un soffio', '{b} singolo interno, sfrutta le gambe', '{b} singolo, colpo piano e volata in prima'],
    action: ['Colpo piano sull’interno, parte a razzo…', 'Battuta lenta, è una corsa fino alla prima…'],
    verdict: ['Bruciato in prima: SINGOLO interno di {b}!', 'Salvo per un soffio: SINGOLO!'],
  },
};

const DOUBLE_FLAVOR: Record<string, Flavor> = {
  gap: {
    log: ['{b} doppio nella gap', '{b} doppio, la palla vola tra gli esterni', '{b} doppio in mezzo agli esterni'],
    action: ['La palla vola nella gap, gli esterni a rincorrere…', 'Spacca la difesa in mezzo agli esterni…'],
    verdict: ['{b} in scivolata in seconda: DOPPIO!', 'DOPPIO di {b}!'],
  },
  line: {
    log: ['{b} doppio lungo la linea', '{b} doppio che pizzica la riga', '{b} doppio in angolo, sulla linea'],
    action: ['Linea che pizzica la riga e corre in angolo…', 'La tira giù per la linea, l’esterno insegue…'],
    verdict: ['{b} si ferma in seconda: DOPPIO!', 'DOPPIO lungo la linea di {b}!'],
  },
  wall: {
    log: ['{b} doppio sul muro', '{b} doppio, la palla sbatte sul tabellone', '{b} doppio, carambola sul muro'],
    action: ['Bordata che sbatte sul muro e torna in campo…', 'La schiaccia sul muro, rimbalzo lontano…'],
    verdict: ['DOPPIO di {b}, per un pelo non è fuori!', '{b} in seconda comodo: DOPPIO!'],
  },
  corner: {
    log: ['{b} doppio, rullata che scappa in angolo', '{b} doppio a terra fin nell’angolo'],
    action: ['Rullata potente che sfugge nell’angolo…', 'La palla corre via lungo la riga…'],
    verdict: ['DOPPIO di {b}!', '{b} arriva in seconda: DOPPIO!'],
  },
};

const TRIPLE_FLAVOR: Record<string, Flavor> = {
  gap: {
    log: ['{b} triplo nella gap con le ali', '{b} triplo, spacca la gap e vola'],
    action: ['Spacca la gap, gli esterni a rincorrere…', 'La palla rotola al muro, {b} non si ferma…'],
    verdict: ['{b} sfreccia sulle basi… TRIPLO!', 'TRIPLO di {b}!'],
  },
  corner: {
    log: ['{b} triplo, carambola d’angolo', '{b} triplo sulla riga fin nell’angolo'],
    action: ['Carambola d’angolo imprevedibile…', 'Rimbalzo pazzo in angolo, l’esterno la perde…'],
    verdict: ['{b} in piedi in terza: TRIPLO!', 'TRIPLO di {b}!'],
  },
  misplay: {
    log: ['{b} triplo, l’esterno pasticcia', '{b} triplo su una palla persa in esterno'],
    action: ['L’esterno la perde… la palla rotola via…', 'Presa mancata! {b} gira le basi…'],
    verdict: ['Fino in terza: TRIPLO di {b}!', 'TRIPLO! {b} sfrutta l’errore.'],
  },
};

const K_FLAVOR: Record<string, Flavor> = {
  swinging: {
    log: ['{b} strikeout, a vuoto sull’ultima', '{b} strikeout girando a vuoto', '{b} strikeout, non aggancia la terza'],
    action: ['Due strike, il lanciatore va per il colpo…', 'Prepara il fuori-giri per chiudere…'],
    verdict: ['Aria! {b} eliminato a vuoto.', 'STRIKEOUT! {b} gira su una palla imprendibile.', 'Terzo strike a vuoto: {b} a sedere.'],
  },
  looking: {
    log: ['{b} strikeout guardando la terza', '{b} strikeout, terzo strike chiamato', '{b} strikeout senza togliere la mazza'],
    action: ['Il conto si stringe, il lanciatore punta il cantone…', 'Rifinisce sull’angolo, {b} indeciso…'],
    verdict: ['Terzo strike CHIAMATO! {b} resta di sasso.', 'STRIKEOUT guardato: {b} non parte.', 'Sul cantone: terzo strike, {b} eliminato.'],
  },
};

const OUT_FLAVOR: Record<string, Flavor> = {
  groundout: {
    log: ['{b} eliminato, rimbalzo e out in prima', '{b} out su rullata all’interno', '{b} groundout senza problemi'],
    action: ['Rimbalzo comodo verso l’interno…', 'La batte a terra sull’interno…'],
    verdict: ['Raccolta e sparo in prima: {b} eliminato.', 'Out di routine in prima.'],
  },
  flyout: {
    log: ['{b} eliminato, volata catturata in esterno', '{b} out su elevata all’esterno', '{b} flyout, presa comoda'],
    action: ['Elevata verso l’esterno, il difensore sotto…', 'La alza in esterno, l’esterno si sistema…'],
    verdict: ['Presa in corsa: {b} eliminato.', 'Volata catturata: out.'],
  },
  popout: {
    log: ['{b} eliminato, pop-up sull’interno', '{b} out, campanile raccolto', '{b} popout sull’interno'],
    action: ['Campanile altissimo sull’interno…', 'Pop-up, i difensori si chiamano…'],
    verdict: ['Sotto la palla, presa: {b} eliminato.', 'Pop-up raccolto: out.'],
  },
  lineout: {
    log: ['{b} eliminato, gran linea presa al volo', '{b} out, frustata dritta nel guantone', '{b} lineout, sfortunato'],
    action: ['Frustata in linea… ma dritta sul difensore…', 'Gran contatto… e la difesa è lì…'],
    verdict: ['Che presa in linea! {b} eliminato.', 'Linea catturata al volo: out.'],
  },
};

const HR_FLAVOR: Record<string, Flavor> = {
  nodoubter: {
    log: ['{b} FUORICAMPO, bomba senza discussioni', '{b} FUORICAMPO, la spedisce lontanissima'],
    action: ['Contatto pieno… la palla parte come un missile…', 'La schiaccia in pieno… vola altissima…'],
    verdict: ['FUORICAMPO di {b}, no-doubter!', 'DENTRO! Che bomba di {b}!'],
  },
  deep: {
    log: ['{b} FUORICAMPO in tribuna profonda', '{b} FUORICAMPO, sale e sparisce'],
    action: ['Gira le braccia… la palla sale, sale…', 'Vola profondissima verso le tribune…'],
    verdict: ['FUORICAMPO di {b}!', 'La manda sugli spalti: FUORICAMPO!'],
  },
  justenough: {
    log: ['{b} FUORICAMPO, la scavalca di un soffio', '{b} FUORICAMPO, quanto basta oltre il muro'],
    action: ['La spinge verso il muro… ce la fa?…', 'Palla al confine… l’esterno guarda in alto…'],
    verdict: ['Oltre di un soffio: FUORICAMPO di {b}!', 'Just enough! {b} la porta di là.'],
  },
};

/** Sottotipo narrativo deterministico dell'evento (per kind con sottotipi). */
export function subtypeOf(ev: PlayEvent): string | null {
  switch (ev.kind) {
    case 'single':
      return weighted(ev, 'sub', SINGLE_TYPES);
    case 'double':
      return weighted(ev, 'sub', DOUBLE_TYPES);
    case 'triple':
      return weighted(ev, 'sub', TRIPLE_TYPES);
    case 'strikeout':
      return weighted(ev, 'sub', K_TYPES);
    case 'homerun':
      return weighted(ev, 'sub', HR_TYPES);
    case 'inplayout':
      // Se sull'out segna un corridore (dalla terza), e' per forza una palla
      // profonda a terra/in aria: forziamo groundout, coerente col punto.
      return ev.runsScored > 0 ? 'groundout' : weighted(ev, 'sub', OUT_TYPES);
    default:
      return null;
  }
}

const FLAVORS: Partial<Record<PlayKind, Record<string, Flavor>>> = {
  single: SINGLE_FLAVOR,
  double: DOUBLE_FLAVOR,
  triple: TRIPLE_FLAVOR,
  strikeout: K_FLAVOR,
  homerun: HR_FLAVOR,
  inplayout: OUT_FLAVOR,
};

const fill = (s: string, b: string): string => s.replace(/\{b\}/g, b);

/** Suffisso "(N punti)" per la riga di log, nello stile del motore. */
function logRuns(scored: number): string {
  if (scored <= 0) return '';
  return ` (${scored} ${scored === 1 ? 'punto' : 'punti'})`;
}

/** Suffisso "e segnano N" per il verdetto del banner. */
function runsTail(scored: number): string {
  if (scored <= 0) return '';
  return scored === 1 ? ' Un punto a casa!' : ` ${scored} punti a casa!`;
}

/**
 * Riga sintetica per la CRONACA laterale (una frase). Varia il testo per
 * sottotipo pesato-MLB; per i tipi senza sottotipo usa il testo del motore.
 */
export function logLine(ev: PlayEvent): string {
  const b = ev.batter ?? 'Il battitore';
  const sub = subtypeOf(ev);
  const flavors = FLAVORS[ev.kind];
  if (sub && flavors && flavors[sub]) {
    return fill(pick(ev, flavors[sub].log, 'log'), b) + logRuns(ev.runsScored);
  }
  return ev.text;
}

/** Tabella metadati per categoria (tier, icona, etichetta, protagonista). */
const META: Record<
  PlayKind,
  { tier: number; icon: string; label: string; accent: 'offense' | 'defense' }
> = {
  homerun: { tier: 5, icon: '💥', label: 'FUORICAMPO', accent: 'offense' },
  triple: { tier: 4, icon: '🔥', label: 'TRIPLO', accent: 'offense' },
  gidp: { tier: 4, icon: '⚡', label: 'DOPPIO GIOCO', accent: 'defense' },
  double: { tier: 3, icon: '⚾', label: 'DOPPIO', accent: 'offense' },
  caughtstealing: { tier: 3, icon: '🎯', label: 'ELIMINATO', accent: 'defense' },
  single: { tier: 2, icon: '⚾', label: 'SINGOLO', accent: 'offense' },
  steal: { tier: 2, icon: '🏃', label: 'RUBATA', accent: 'offense' },
  strikeout: { tier: 2, icon: '✖', label: 'STRIKEOUT', accent: 'defense' },
  sacfly: { tier: 2, icon: '🕊️', label: 'VOLATA', accent: 'offense' },
  bunthit: { tier: 2, icon: '🎯', label: 'BUNT VALIDO', accent: 'offense' },
  wildpitch: { tier: 2, icon: '💨', label: 'LANCIO PAZZO', accent: 'offense' },
  passedball: { tier: 2, icon: '🧤', label: 'PALLA PASSATA', accent: 'offense' },
  balk: { tier: 2, icon: '🚫', label: 'BALK', accent: 'offense' },
  walk: { tier: 1, icon: '🅱️', label: 'BASE BALL', accent: 'offense' },
  hbp: { tier: 1, icon: '🤕', label: 'COLPITO', accent: 'offense' },
  ibb: { tier: 1, icon: '🅱️', label: 'BASE INTENZ.', accent: 'offense' },
  sacbunt: { tier: 1, icon: '🥎', label: 'SACRIFICIO', accent: 'offense' },
  buntout: { tier: 1, icon: '✖', label: 'ELIMINATO', accent: 'defense' },
  inplayout: { tier: 1, icon: '✖', label: 'ELIMINATO', accent: 'defense' },
  sub: { tier: 0, icon: '🔁', label: 'CAMBIO', accent: 'offense' },
  other: { tier: 0, icon: '•', label: 'AZIONE', accent: 'offense' },
};

/**
 * Frase d'apertura: il battitore si presenta al piatto. Comune a quasi tutti
 * gli esiti — e' l'attesa prima che l'azione si risolva.
 */
function opener(ev: PlayEvent, ctx: BannerContext): string {
  const b = ev.batter ?? 'Il battitore';
  return pick(
    ev,
    [
      `${b} si porta in battuta per ${ctx.offense.abbrev}…`,
      `${b} al piatto…`,
      `Tocca a ${b}…`,
      `${b} pronto nel box…`,
    ],
    'open',
  );
}

/** Costruisce (per i kind con sottotipo) le tre fasi: apertura, azione, verdetto. */
function flavoredPhases(ev: PlayEvent, ctx: BannerContext): string[] | null {
  const sub = subtypeOf(ev);
  const flavors = FLAVORS[ev.kind];
  if (!sub || !flavors || !flavors[sub]) return null;
  const b = ev.batter ?? 'Il battitore';
  const f = flavors[sub];
  const t = runsTail(ev.runsScored);
  return [
    opener(ev, ctx),
    fill(pick(ev, f.action, 'act'), b),
    fill(pick(ev, f.verdict, 'ver'), b) + t,
  ];
}

/** Costruisce la sequenza di fasi (verdetto in coda) per l'esito. */
function phasesFor(ev: PlayEvent, ctx: BannerContext): string[] {
  const b = ev.batter ?? 'Il battitore';
  const t = runsTail(ev.runsScored);

  // I kind "di battuta" (singolo/doppio/triplo/HR/strikeout/out) passano dal
  // modello a sottotipi pesati-MLB.
  const flavored = flavoredPhases(ev, ctx);
  if (flavored) return flavored;

  const open = opener(ev, ctx);
  switch (ev.kind) {
    case 'bunthit':
      return [open, 'Smorza a sorpresa lungo la linea…', `Nessuno ci arriva: BUNT VALIDO!${t}`];
    case 'walk':
      return [open, `${b} legge bene i lanci… BASE BALL.${t}`];
    case 'ibb':
      return [open, `Difesa che preferisce non rischiare: base intenzionale a ${b}.${t}`];
    case 'hbp':
      return [open, `Lancio addosso: ${b} colpito, va in prima.${t}`];
    case 'sacfly':
      return [
        open,
        'Elevata profonda verso l’esterno…',
        `Presa, ma il corridore parte dopo il tocco… VOLATA DI SACRIFICIO!${t}`,
      ];
    case 'sacbunt':
      return [open, 'Bunt di sacrificio verso l’interno…', `${b} si immola: corridore avanzato.${t}`];
    case 'gidp':
      return [
        open,
        'Rimbalzo verso l’interno con corridore in corsa…',
        pick(ev, [
          'Presa, tocco di seconda e sparo in prima… DOPPIO GIOCO!',
          'Palla girata in un lampo: due eliminati, DOPPIO GIOCO!',
          'Sei-quattro-tre: DOPPIO GIOCO da manuale!',
        ]),
      ];
    case 'caughtstealing':
      return [
        pick(ev, [`${b} prova la fuga…`, `${b} scatta col lancio…`]),
        'Il ricevitore spara in seconda…',
        `Preso! ${b} ELIMINATO in rubata.`,
      ];
    case 'steal':
      return [
        pick(ev, [`${b} studia il lanciatore…`, `${b} allunga il piede…`]),
        `Parte… e ruba la base! ${b} sicuro.`,
      ];
    case 'wildpitch':
      return [
        pick(ev, ['Il lanciatore carica…', 'Sul monte si prepara il lancio…']),
        pick(ev, [
          'La palla scappa via, rimbalza lontano dal ricevitore…',
          'Lancio che finisce nella terra e schizza via…',
        ]),
        `LANCIO PAZZO! I corridori avanzano.${t}`,
      ];
    case 'passedball':
      return [
        'Arriva il lancio al ricevitore…',
        'La palla gli sfugge dal guantone…',
        `PALLA PASSATA! Corridori in movimento.${t}`,
      ];
    case 'balk':
      return [
        'Il lanciatore imposta la posizione…',
        `Movimento irregolare: BALK! Corridori avanzati d’ufficio.${t}`,
      ];
    case 'buntout':
      return [open, 'Prova la smorzata…', `Difesa pronta: ${b} eliminato.`];
    case 'sub':
    case 'other':
      return [ev.text];
    default:
      return [ev.text];
  }
}

/**
 * Trasforma un PlayEvent nella telecronaca del banner: fasi, tema, intensita'.
 */
export function buildCommentary(ev: PlayEvent, ctx: BannerContext): Commentary {
  const meta = META[ev.kind] ?? META.other;
  const scored = ev.runsScored ?? 0;
  const texts = phasesFor(ev, ctx);
  const phases: CommentaryPhase[] = texts.map((text, i) => ({
    text,
    climax: i === texts.length - 1,
  }));
  // Un punto segnato alza sempre di un gradino l'intensita' (fino a 5).
  const tier = Math.min(5, meta.tier + (scored > 0 && meta.tier < 5 ? 1 : 0));
  const team = meta.accent === 'offense' ? ctx.offense : ctx.defense;
  return {
    phases,
    category: ev.kind,
    tier,
    color: team.color,
    accent: meta.accent,
    scored,
    label: meta.label,
    icon: meta.icon,
  };
}

/** Durata (ms) di permanenza di ciascuna fase prima della successiva. */
export const PHASE_MS = 1150;
/** Tempo di permanenza del verdetto prima che il banner sparisca (ms). */
export const HOLD_MS = 2200;
