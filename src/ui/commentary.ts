// Costruzione della cronaca "da telecronista" per il banner della schermata
// partita e della riga sintetica del log laterale. Trasforma UN PlayEvent (esito
// gia' calcolato dal motore) in testo vario.
//
// NB: e' puramente PRESENTAZIONE. Non tocca il motore, non consuma RNG: la
// varieta' delle frasi e' DETERMINISTICA (hash dell'evento), cosi' lo stesso
// turno produce sempre la stessa telecronaca.
//
// --- Come si racconta un turno ------------------------------------------------
// Il banner mostra 2-3 fasi: APERTURA (il battitore al piatto) → SVILUPPO
// (la "preliminare": contatto o duello a due strike) → VERDETTO (l'esito).
//
//  * L'APERTURA e' comune a QUASI TUTTI gli esiti: e' solo l'attesa, non anticipa
//    nulla.
//  * Lo SVILUPPO NON e' piu' legato all'esito uno-a-uno: pesca da DUE sorgenti
//    entrambe condivise tra piu' esiti —
//      (a) la TRAIETTORIA (rullata / linea / volata / bordata / campanile / duello):
//          una rullata puo' diventare singolo, doppio d'angolo, out in prima,
//          doppio gioco… (vedi `TRAJECTORY_ACTION` + `trajectoryOf`);
//      (b) il CONTO + TIPO DI LANCIO ("Conto sul 2-2, arriva una slider bassa…"),
//          universale: precede strikeout o valide di ogni tipo (vedi
//          `countPitchLine`). Il conto e' sintetizzato in modo plausibile
//          (strikeout = X-2, base ball = 3-X), NON e' un dato del motore.
//    Cosi' vedere la preliminare NON basta per indovinare il verdetto, e lo stesso
//    esito ha molte preliminari diverse.
//  * Il VERDETTO (ultima fase, "climax") e' invece specifico: e' li' che l'esito
//    viene svelato e i marker sul diamante si muovono.
//
// --- Due sorgenti di sottotipo (per VERDETTO e log laterale) ------------------
// 1) OUT su palla in gioco: la FORMA (rimbalzo/volata/presa) e' VERITA' DEL
//    MOTORE — `ev.outInfo.ball` (ground/fly/popup) — cosi' verdetto, codice da
//    segnapunti (`scorecode.ts`) e avanzamenti reali dei corridori concordano.
// 2) VALIDE e STRIKEOUT: il motore NON dice se un singolo passa a terra o cade
//    come bloop, ne' se lo strikeout e' a vuoto o guardato. Quel dettaglio e'
//    solo narrazione: lo assegniamo QUI, ma non a caso — ogni esito estrae un
//    sottotipo con pesi che approssimano il mix reale MLB (fonti sabermetriche),
//    cosi' su tante azioni la frequenza dei singoli a terra/in linea/bloop, o
//    degli strikeout a vuoto/guardati, rispecchia la realta'. Resta presentazione.
//
//    Strikeout: ~72% a vuoto / ~28% guardati (dato MLB).

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
  return `${ev.inning}${ev.half}${ev.kind}${ev.batter ?? ''}${ev.text}`;
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

/** Indice deterministico piccolo, per scegliere una variante di frase. */
function variant(ev: PlayEvent, n: number): number {
  return hashStr(signature(ev)) % n;
}

const pick = (ev: PlayEvent, opts: string[]): string => opts[variant(ev, opts.length)];

/** Come `pick`, ma con un `salt` che separa i flussi (cosi' scelta del sottotipo
 *  e scelta della frase non sono correlate tra loro). */
const pickS = (ev: PlayEvent, opts: string[], salt: string): string =>
  opts[hashStr(signature(ev) + '#' + salt) % opts.length];

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

/** Tipo di eliminazione su palla in gioco (`inplayout`). La FONTE DI VERITÀ è il
 *  motore: `ev.outInfo.ball` (ground/fly/popup) decide, così telecronaca e codice
 *  da segnapunti (`scorecode.ts`) raccontano lo stesso esito e concordano anche
 *  con gli avanzamenti reali dei corridori. Se manca (eventi vecchi) si ripiega
 *  su un hash deterministico. */
export type InPlayOutShape = 'air' | 'ground' | 'fly';
export function inPlayOutShape(ev: PlayEvent): InPlayOutShape {
  if (ev.outInfo) {
    return ev.outInfo.ball === 'ground' ? 'ground' : ev.outInfo.ball === 'fly' ? 'fly' : 'air';
  }
  const v = variant(ev, 3);
  return v === 0 ? 'air' : v === 1 ? 'ground' : 'fly';
}

// --- Tabelle dei sottotipi presentazione (pesi = % reali MLB approssimate) ----

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

// --- Pool di frasi per sottotipo (VERDETTO + log laterale) --------------------
// Ogni sottotipo ha `log` (riga sintetica laterale) e `verdict` (l'esito, in coda
// al banner). La fase di SVILUPPO (preliminare) NON sta qui: e' condivisa per
// traiettoria (vedi `TRAJECTORY_ACTION`), cosi' non anticipa il verdetto. `{b}` =
// nome del battitore.

interface Flavor {
  log: string[];
  verdict: string[];
}

const SINGLE_FLAVOR: Record<string, Flavor> = {
  grounder: {
    log: ['{b} singolo, rullata nel buco', '{b} singolo a terra tra gli interni', '{b} singolo, la palla passa a destra'],
    verdict: ['SINGOLO di {b}!', '{b} in prima: SINGOLO!'],
  },
  liner: {
    log: ['{b} singolo in linea nell’esterno', '{b} singolo, frustata che cade davanti', '{b} singolo su una gran linea'],
    verdict: ['SINGOLO di {b}!', 'Valida netta! {b} sul primo cuscino.'],
  },
  blooper: {
    log: ['{b} singolo, un bloop che cade tra le linee', '{b} singolo, palla molle che nessuno prende', '{b} singolo di fortuna nel nessun-uomo'],
    verdict: ['Cade! {b} sul singolo.', 'SINGOLO fortunoso di {b}!'],
  },
  infield: {
    log: ['{b} singolo interno, la batte per un soffio', '{b} singolo interno, sfrutta le gambe', '{b} singolo, colpo piano e volata in prima'],
    verdict: ['Bruciato in prima: SINGOLO interno di {b}!', 'Salvo per un soffio: SINGOLO!'],
  },
};

const DOUBLE_FLAVOR: Record<string, Flavor> = {
  gap: {
    log: ['{b} doppio nella gap', '{b} doppio, la palla vola tra gli esterni', '{b} doppio in mezzo agli esterni'],
    verdict: ['{b} in scivolata in seconda: DOPPIO!', 'DOPPIO di {b}!'],
  },
  line: {
    log: ['{b} doppio lungo la linea', '{b} doppio che pizzica la riga', '{b} doppio in angolo, sulla linea'],
    verdict: ['{b} si ferma in seconda: DOPPIO!', 'DOPPIO lungo la linea di {b}!'],
  },
  wall: {
    log: ['{b} doppio sul muro', '{b} doppio, la palla sbatte sul tabellone', '{b} doppio, carambola sul muro'],
    verdict: ['DOPPIO di {b}, per un pelo non è fuori!', '{b} in seconda comodo: DOPPIO!'],
  },
  corner: {
    log: ['{b} doppio, rullata che scappa in angolo', '{b} doppio a terra fin nell’angolo'],
    verdict: ['DOPPIO di {b}!', '{b} arriva in seconda: DOPPIO!'],
  },
};

const TRIPLE_FLAVOR: Record<string, Flavor> = {
  gap: {
    log: ['{b} triplo nella gap con le ali', '{b} triplo, spacca la gap e vola'],
    verdict: ['{b} sfreccia sulle basi… TRIPLO!', 'TRIPLO di {b}!'],
  },
  corner: {
    log: ['{b} triplo, carambola d’angolo', '{b} triplo sulla riga fin nell’angolo'],
    verdict: ['{b} in piedi in terza: TRIPLO!', 'TRIPLO di {b}!'],
  },
  misplay: {
    log: ['{b} triplo, l’esterno pasticcia', '{b} triplo su una palla persa in esterno'],
    verdict: ['Fino in terza: TRIPLO di {b}!', 'TRIPLO! {b} sfrutta l’errore.'],
  },
};

const K_FLAVOR: Record<string, Flavor> = {
  swinging: {
    log: ['{b} strikeout, a vuoto sull’ultima', '{b} strikeout girando a vuoto', '{b} strikeout, non aggancia la terza'],
    verdict: ['Aria! {b} eliminato a vuoto.', 'STRIKEOUT! {b} gira su una palla imprendibile.', 'Terzo strike a vuoto: {b} a sedere.'],
  },
  looking: {
    log: ['{b} strikeout guardando la terza', '{b} strikeout, terzo strike chiamato', '{b} strikeout senza togliere la mazza'],
    verdict: ['Terzo strike CHIAMATO! {b} resta di sasso.', 'STRIKEOUT guardato: {b} non parte.', 'Sul cantone: terzo strike, {b} eliminato.'],
  },
};

const HR_FLAVOR: Record<string, Flavor> = {
  nodoubter: {
    log: ['{b} FUORICAMPO, bomba senza discussioni', '{b} FUORICAMPO, la spedisce lontanissima'],
    verdict: ['FUORICAMPO di {b}, no-doubter!', 'DENTRO! Che bomba di {b}!'],
  },
  deep: {
    log: ['{b} FUORICAMPO in tribuna profonda', '{b} FUORICAMPO, sale e sparisce'],
    verdict: ['FUORICAMPO di {b}!', 'La manda sugli spalti: FUORICAMPO!'],
  },
  justenough: {
    log: ['{b} FUORICAMPO, la scavalca di un soffio', '{b} FUORICAMPO, quanto basta oltre il muro'],
    verdict: ['Oltre di un soffio: FUORICAMPO di {b}!', 'Just enough! {b} la porta di là.'],
  },
};

/** Valide/K/HR: mappa kind -> tabella pesi + pool di frasi. Gli OUT no: la loro
 *  forma e' verita' del motore (vedi `inPlayOutShape`), non un peso. */
const HIT_KINDS: Partial<Record<PlayKind, { table: Weighted<string>; flavor: Record<string, Flavor> }>> = {
  single: { table: SINGLE_TYPES, flavor: SINGLE_FLAVOR },
  double: { table: DOUBLE_TYPES, flavor: DOUBLE_FLAVOR },
  triple: { table: TRIPLE_TYPES, flavor: TRIPLE_FLAVOR },
  strikeout: { table: K_TYPES, flavor: K_FLAVOR },
  homerun: { table: HR_TYPES, flavor: HR_FLAVOR },
};

/** OUT su palla in gioco: frasi (log + verdetto) per forma reale (`inPlayOutShape`). */
const OUT_FLAVOR: Record<InPlayOutShape, Flavor> = {
  ground: {
    log: ['{b} eliminato, rimbalzo e out in prima', '{b} out su rullata all’interno', '{b} groundout senza problemi'],
    verdict: ['Raccolta e sparo in prima: {b} eliminato.', 'Out di routine in prima.'],
  },
  fly: {
    log: ['{b} eliminato, volata catturata in esterno', '{b} out su elevata all’esterno', '{b} flyout, presa in corsa'],
    verdict: ['Presa in corsa: {b} eliminato.', 'Volata catturata: out.'],
  },
  air: {
    log: ['{b} eliminato, pop-up sull’interno', '{b} out, campanile raccolto', '{b} popout sull’interno'],
    verdict: ['Sotto la palla, presa: {b} eliminato.', 'Pop-up raccolto: out.'],
  },
};

// --- Traiettorie condivise (fase di SVILUPPO / "preliminare") -----------------
// La preliminare descrive COME la palla lascia la mazza (o il duello a due
// strike), NON l'esito. Piu' esiti diversi ma plausibili condividono la stessa
// traiettoria, cosi' la preliminare non tradisce il verdetto e lo stesso esito
// ha molte aperture diverse. Frasi volutamente neutre sull'esito.
export type Trajectory = 'grounder' | 'liner' | 'flare' | 'fly' | 'deep' | 'pop' | 'battle';

const TRAJECTORY_ACTION: Record<Trajectory, string[]> = {
  // Rullata sull'interno: singolo nel buco/interno, doppio d'angolo, out in
  // prima, scelta difensiva, doppio gioco.
  grounder: [
    'Batte una rimbalzante interna…',
    'Colpo secco verso il diamante…',
    'Rimbalzo che schizza tra gli interni…',
    'La batte giù, gli interni si muovono…',
    'Rullata potente sull’interno…',
    'Batte in campo interno, il difensore raccoglie la palla…',
    'Palla battuta in diamante, si gioca il rimbalzo…',
  ],
  // Linea tesa: singolo davanti, doppio in gap o lungo la linea.
  liner: [
    'Frustata in linea che taglia l’aria…',
    'Contatto pulito, la palla parte tesa…',
    'Bordata in linea, gli esterni scattano…',
    'Che linea! il campo si apre…',
    'Sventola tesa in mezzo al campo…',
    'La schiaccia in linea verso l’esterno…',
  ],
  // Colpo molle/flare: bloop che puo' cadere o essere preso.
  flare: [
    'Battuta alta debole appena dietro l’interno…',
    'Palla a campanile corto verso l’esterno…',
    'Colpita piano, sale fiacca tra le linee…',
    'Blooper dove non c’è nessuno…',
  ],
  // Volata all'esterno: out al volo, volata di sacrificio, doppio sul muro,
  // triplo d'angolo, fuoricampo di un soffio.
  fly: [
    'La alza verso l’esterno, il difensore indietreggia…',
    'Vola lunga verso l’esterno…',
    'Elevata profonda, l’esterno gira e insegue…',
    'Contatto in aria, la palla sale verso il fondo…',
    'La spinge alta in esterno…',
    'Palla in cielo verso le tribune, chi la prende?…',
  ],
  // Bordata piena: fuoricampo, doppio sul muro, triplo in gap.
  deep: [
    'Contatto pieno… la palla parte come un missile…',
    'La batte pulita, forte…',
    'Bordata devastante verso il fondo del campo…',
    'La colpisce in pieno… sale, sale…',
    'Legnata piena, palla spedita lontano…',
  ],
  // Campanile: pop-up sull'interno.
  pop: [
    'Campanile altissimo sull’interno…',
    'Pop-up, i difensori si chiamano…',
    'La alza cortissima, palla verticale…',
    'Elevata debole nel diamante…',
  ],
  // Duello a due strike / al piatto: strikeout, base ball, colpito.
  battle: [
    'Il conto si stringe, tensione sul monte…',
    'Duello sul piatto, arriva il lancio…',
    'Il lanciatore carica ed esegue…',
    'Ultimo lancio in canna…',
    'Si gioca tutto su questo confronto…',
    'Braccio di ferro sul piatto, ecco il lancio…',
  ],
};

/**
 * Traiettoria (fase di sviluppo) di un evento. NON e' l'esito: piu' esiti la
 * condividono. Deriva da kind + sottotipo (per valide/K), o dalla forma reale
 * del motore (per gli OUT).
 */
function trajectoryOf(ev: PlayEvent): Trajectory {
  switch (ev.kind) {
    case 'single': {
      const sub = weighted(ev, 'sub', SINGLE_TYPES);
      return sub === 'liner' ? 'liner' : sub === 'blooper' ? 'flare' : 'grounder';
    }
    case 'double': {
      const sub = weighted(ev, 'sub', DOUBLE_TYPES);
      return sub === 'wall' ? 'deep' : sub === 'corner' ? 'grounder' : 'liner';
    }
    case 'triple':
      return weighted(ev, 'sub', TRIPLE_TYPES) === 'gap' ? 'deep' : 'fly';
    case 'homerun':
      return weighted(ev, 'sub', HR_TYPES) === 'justenough' ? 'fly' : 'deep';
    case 'gidp':
      return 'grounder';
    case 'sacfly':
      return 'fly';
    case 'inplayout': {
      if (ev.outInfo?.fc) return 'grounder';
      const shape = inPlayOutShape(ev);
      return shape === 'ground' ? 'grounder' : shape === 'fly' ? 'fly' : 'pop';
    }
    case 'strikeout':
    case 'walk':
    case 'ibb':
    case 'hbp':
      return 'battle';
    default:
      return 'battle';
  }
}

// --- Preliminare "conto + tipo di lancio" (universale) ------------------------
// Sorgente di sviluppo alternativa alla traiettoria e ANCORA piu' condivisa: il
// conto e il lancio in arrivo. Precede QUALSIASI esito (strikeout o valida di
// ogni tipo), quindi "Conto sul 2-2, arriva una slider bassa…" non tradisce
// nulla. UNICO vincolo di realismo: il conto dev'essere coerente con l'esito —
// uno strikeout ha gia' 2 strike (X-2), una base ball ha gia' 3 ball (3-X); una
// palla in gioco puo' arrivare su qualunque conto. Il conto NON e' un dato del
// motore (non lo traccia in `PlayEvent`): e' sintetizzato in modo plausibile e
// deterministico, pura presentazione.

/** Quota (%) di turni in cui la preliminare e' "conto + lancio" invece della
 *  traiettoria. Il resto usa `TRAJECTORY_ACTION`. */
const COUNT_PITCH_PCT = 45;

const PITCHES = [
  'palla veloce',
  'veloce alta',
  'veloce sul cantone',
  'slider',
  'slider bassa',
  'curva',
  'curva che spezza',
  'cambio di velocità',
  'sinker sulle ginocchia',
  'splitter nel terreno',
  'cutter interno',
];

const COUNT_PITCH_TMPL = [
  'Conto sul {c}, il lanciatore lascia partire una {p}…',
  'Sul {c}, ecco una {p}…',
  '{c}, il monte sceglie una {p}…',
  'Conto {c}: arriva una {p}…',
];

const FULL_COUNT_TMPL = [
  'Conto pieno, il lanciatore lascia partire una {p}…',
  'Sul pieno, ecco una {p}…',
  'Conto pieno: arriva una {p}…',
];

/** Conto (ball-strike) PLAUSIBILE per l'esito. Non è verità del motore: serve
 *  solo a non contraddire il verdetto (uno strikeout ha 2 strike, una base ball
 *  3 ball; la palla in gioco su qualunque conto). */
function countFor(ev: PlayEvent): { c: string; full: boolean } {
  const h = hashStr(signature(ev) + '=cnt');
  let balls: number;
  let strikes: number;
  if (ev.kind === 'strikeout') {
    balls = h % 4; // 0..3
    strikes = 2;
  } else if (ev.kind === 'walk') {
    balls = 3;
    strikes = h % 3; // 0..2
  } else {
    balls = h % 4; // 0..3
    strikes = (h >>> 2) % 3; // 0..2
  }
  return { c: `${balls}-${strikes}`, full: balls === 3 && strikes === 2 };
}

/** Preliminare "conto + tipo di lancio", condivisa da ogni esito. */
function countPitchLine(ev: PlayEvent): string {
  const { c, full } = countFor(ev);
  const p = pickS(ev, PITCHES, 'pitch');
  const useFull = full && hashStr(signature(ev) + '=full') % 2 === 0;
  const tmpl = useFull ? pickS(ev, FULL_COUNT_TMPL, 'cpt') : pickS(ev, COUNT_PITCH_TMPL, 'cpt');
  return tmpl.replace(/\{c\}/g, c).replace(/\{p\}/g, p);
}

/**
 * Frase di SVILUPPO (preliminare). Alterna, in modo deterministico e scorrelato
 * dall'esito, tra due sorgenti entrambe CONDIVISE tra piu' esiti: la TRAIETTORIA
 * (come parte la palla) e il CONTO + TIPO DI LANCIO (universale). Cosi' lo stesso
 * esito ha moltissime aperture e la stessa apertura precede esiti diversi.
 */
function actionPhrase(ev: PlayEvent): string {
  if (hashStr(signature(ev) + '~devmode') % 100 < COUNT_PITCH_PCT) {
    return countPitchLine(ev);
  }
  return pickS(ev, TRAJECTORY_ACTION[trajectoryOf(ev)], 'act');
}

/** Sottotipo narrativo deterministico dell'evento (etichetta descrittiva).
 *  Valide/K/HR: pesato-MLB. OUT in gioco: derivato dalla VERITA' del motore
 *  (`fc` o forma `ground/fly/popup`). Altri kind: null. */
export function subtypeOf(ev: PlayEvent): string | null {
  const hk = HIT_KINDS[ev.kind];
  if (hk) return weighted(ev, 'sub', hk.table);
  if (ev.kind === 'inplayout') return ev.outInfo?.fc ? 'fc' : inPlayOutShape(ev);
  return null;
}

const fill = (s: string, b: string): string => s.replace(/\{b\}/g, b);

/** Suffisso "(N punti)" per la riga di log, nello stile del motore. */
function logRuns(scored: number): string {
  if (scored <= 0) return '';
  return ` (${scored} ${scored === 1 ? 'punto' : 'punti'})`;
}

/** Suffisso "e segnano N" per il verdetto quando l'azione produce punti. */
function runsTail(scored: number): string {
  if (scored <= 0) return '';
  return scored === 1 ? ' Un punto a casa!' : ` ${scored} punti a casa!`;
}

/**
 * Riga sintetica per la CRONACA laterale (una frase). Varia il testo per
 * sottotipo (pesato-MLB per le valide/K/HR, forma reale per gli out); per i tipi
 * senza narrazione dedicata usa il testo del motore.
 */
export function logLine(ev: PlayEvent): string {
  const b = ev.batter ?? 'Il battitore';
  const hk = HIT_KINDS[ev.kind];
  if (hk) {
    const sub = weighted(ev, 'sub', hk.table);
    return fill(pickS(ev, hk.flavor[sub].log, 'log'), b) + logRuns(ev.runsScored);
  }
  if (ev.kind === 'inplayout') {
    if (ev.outInfo?.fc) {
      return `${b} eliminato su scelta difensiva, salvo in prima` + logRuns(ev.runsScored);
    }
    const f = OUT_FLAVOR[inPlayOutShape(ev)];
    const adv = ev.outInfo?.advanced ? ', i corridori avanzano' : '';
    return fill(pickS(ev, f.log, 'log'), b) + adv + logRuns(ev.runsScored);
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
  buntfc: { tier: 1, icon: '🔀', label: 'SCELTA DIF.', accent: 'defense' },
  error: { tier: 2, icon: '🧤', label: 'ERRORE', accent: 'offense' },
  inplayout: { tier: 1, icon: '✖', label: 'ELIMINATO', accent: 'defense' },
  sub: { tier: 0, icon: '🔁', label: 'CAMBIO', accent: 'offense' },
  other: { tier: 0, icon: '•', label: 'AZIONE', accent: 'offense' },
};

/** Commento di SITUAZIONE (apertura alternativa). Dipende da inning E margine di
 *  punteggio (dati noti PRIMA dell'azione: il margine è calcolato sul punteggio
 *  pre-turno, sottraendo i punti di QUESTO turno), mai dall'esito. Così non dice
 *  "punto a punto" su un 2-8 né "dominio" su una gara in bilico: le frasi offerte
 *  sono sempre coerenti col tabellone. Resta un "testo duttile" che precede i due
 *  testi di esito e non anticipa nulla. */
function situation(ev: PlayEvent, ctx: BannerContext): string[] {
  const off = ctx.offense.abbrev;
  const def = ctx.defense.abbrev;
  // Punteggio PRIMA del turno: i punti di questo turno vanno alla squadra in
  // attacco (top→away batte, bottom→home batte). Evita di "leggere" l'esito.
  const runsThis = ev.runsScored ?? 0;
  const preAway = ev.away - (ev.half === 'top' ? runsThis : 0);
  const preHome = ev.home - (ev.half === 'bottom' ? runsThis : 0);
  const offScore = ev.half === 'top' ? preAway : preHome;
  const defScore = ev.half === 'top' ? preHome : preAway;
  const diff = offScore - defScore;
  const m = Math.abs(diff);
  const leader = diff > 0 ? off : def; // valido solo se m > 0
  const trailer = diff > 0 ? def : off;
  const early = ev.inning <= 3;
  const late = ev.inning >= 7;
  const veryLate = ev.inning >= 9;

  const out: string[] = [];
  if (m === 0) {
    out.push('Punteggio in parità, partita apertissima…', 'Tutto in equilibrio, nessuno avanti…');
    if (early) out.push(`${off} prova a muovere qualcosa in attacco…`, 'Primi scambi, ci si studia sul diamante…');
    else if (veryLate) out.push('Inning decisivi in perfetta parità…', 'Ultimo atto in bilico, ogni lancio pesa…');
    else if (late) out.push('Parità nel finale, si decide su un episodio…');
    else out.push('Match in equilibrio, nessuno vuole mollare…', 'Si lotta punto a punto…');
  } else if (m === 1) {
    out.push(`Sfida punto a punto, ${leader} avanti di un'incollatura…`, 'Una sola incollatura divide le squadre…');
    if (veryLate) out.push('Ultimo atto, una corsa può ribaltare tutto…');
    else if (late) out.push('Finale tiratissimo, ogni lancio pesa…');
  } else if (m <= 3) {
    out.push(
      `${leader} avanti di poco, ${trailer} resta in scia…`,
      `Match ancora aperto, ${trailer} vuole rientrare…`,
      `${leader} prova a gestire il vantaggio…`,
    );
    if (late) out.push(`${trailer} a caccia del pari nel finale…`);
  } else if (m <= 5) {
    out.push(
      `${leader} in controllo, ${trailer} deve reagire…`,
      `${trailer} insegue un margine importante…`,
      `${leader} tiene le distanze…`,
    );
    if (late) out.push(`${leader} a un passo dal blindare la gara…`);
  } else {
    out.push(
      `${leader} domina, ${trailer} in grande difficoltà…`,
      `${trailer} sotto pesantemente, servirebbe una scossa…`,
      `${leader} dilaga sul tabellone…`,
    );
    if (late) out.push(`${leader} lanciato verso una vittoria larga…`);
  }
  return out;
}

/**
 * Frase d'apertura: attesa prima che l'azione si risolva. Comune a QUASI TUTTI
 * gli esiti e scelta in modo scorrelato dall'esito, quindi non anticipa nulla.
 * Mescola due registri altrettanto duttili: il battitore che si presenta al
 * piatto e un commento sulla SITUAZIONE del match (per fase di partita).
 */
function opener(ev: PlayEvent, ctx: BannerContext): string {
  const b = ev.batter ?? 'Il battitore';
  const intro = [
    `${b} si porta in battuta per ${ctx.offense.abbrev}…`,
    `${b} al piatto…`,
    `Tocca a ${b}…`,
    `${b} pronto nel box…`,
    `${b} scava il piede nella terra, pronto…`,
    `Sul monte contro ${b}, tutto pronto…`,
    `${b} stringe la mazza e aspetta il lancio…`,
    `${ctx.defense.abbrev} in guardia, ${b} in battuta…`,
  ];
  return pickS(ev, [...intro, ...situation(ev, ctx)], 'open');
}

/** Fasi (apertura, sviluppo condiviso, verdetto) per i kind con sottotipo pesato
 *  (valide/K/HR). Il verdetto e' specifico; lo sviluppo e' per traiettoria. */
function flavoredPhases(ev: PlayEvent, ctx: BannerContext): string[] | null {
  const hk = HIT_KINDS[ev.kind];
  if (!hk) return null;
  const b = ev.batter ?? 'Il battitore';
  const f = hk.flavor[weighted(ev, 'sub', hk.table)];
  return [
    opener(ev, ctx),
    actionPhrase(ev),
    fill(pickS(ev, f.verdict, 'ver'), b) + runsTail(ev.runsScored),
  ];
}

/** Costruisce la sequenza di fasi (verdetto in coda) per l'esito. */
function phasesFor(ev: PlayEvent, ctx: BannerContext): string[] {
  const b = ev.batter ?? 'Il battitore';
  const t = runsTail(ev.runsScored);

  // Valide/strikeout/HR: modello a sottotipi pesati-MLB.
  const flavored = flavoredPhases(ev, ctx);
  if (flavored) return flavored;

  const open = opener(ev, ctx);
  switch (ev.kind) {
    case 'bunthit':
      return [open, 'Smorza a sorpresa lungo la linea…', `Nessuno ci arriva: BUNT VALIDO!${t}`];
    case 'walk':
      // Sviluppo condiviso col duello a due strike: la base ball non si vede
      // arrivare dalla preliminare.
      return [open, actionPhrase(ev), `${b} legge bene i lanci… BASE BALL.${t}`];
    case 'ibb':
      return [open, `Difesa che preferisce non rischiare: base intenzionale a ${b}.${t}`];
    case 'hbp':
      return [open, actionPhrase(ev), `Lancio addosso: ${b} colpito, va in prima.${t}`];
    case 'sacfly':
      return [
        open,
        actionPhrase(ev),
        `Presa, ma il corridore parte dopo il tocco… VOLATA DI SACRIFICIO!${t}`,
      ];
    case 'sacbunt':
      return [open, 'Bunt di sacrificio verso l’interno…', `${b} si immola: corridore avanzato.${t}`];
    case 'gidp':
      // Preliminare = rullata generica (come un singolo a terra o un out in
      // prima): il doppio gioco si scopre solo al verdetto.
      return [
        open,
        actionPhrase(ev),
        pick(ev, [
          'Presa, tocco di seconda e sparo in prima… DOPPIO GIOCO!',
          'Palla girata in un lampo: due eliminati, DOPPIO GIOCO!',
          'Sei-quattro-tre: DOPPIO GIOCO da manuale!',
        ]),
      ];
    case 'caughtstealing': {
      const baseTo = ev.base === 3 ? 'terza' : 'seconda';
      return [
        pick(ev, [`${b} prova la fuga…`, `${b} scatta col lancio…`]),
        `Il ricevitore spara in ${baseTo}…`,
        `Preso! ${b} ELIMINATO in rubata della ${baseTo}.`,
      ];
    }
    case 'steal': {
      const baseTo = ev.base === 3 ? 'terza' : 'seconda';
      return [
        pick(ev, [`${b} studia il lanciatore…`, `${b} allunga il piede…`]),
        `Parte… e ruba la ${baseTo}! ${b} sicuro.`,
      ];
    }
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
    case 'buntfc':
      return [
        open,
        'Smorza, ma la difesa sceglie il corridore di testa…',
        `Eliminato il corridore, ${b} salvo in prima: SCELTA DIFENSIVA.`,
      ];
    case 'inplayout': {
      const info = ev.outInfo;
      // Scelta difensiva: out su un corridore, battitore salvo in prima.
      if (info?.fc) {
        return [
          open,
          actionPhrase(ev),
          `Scelta difensiva: eliminato il corridore, ${b} salvo in prima.${t}`,
        ];
      }
      // Il verdetto concorda col codice da segnapunti (stessa `inPlayOutShape`)
      // e con gli avanzamenti reali dei corridori decisi dal motore. La FORMA è
      // verità del motore; qui varia solo la resa testuale. La preliminare
      // (`actionPhrase`) e' condivisa con le valide di pari traiettoria, così
      // non si capisce in anticipo se la palla cadrà o sarà presa.
      const shape = inPlayOutShape(ev);
      const adv = info?.advanced;
      const verdict =
        shape === 'ground'
          ? adv
            ? pick(ev, [`Rimbalzo, out in prima… e i corridori avanzano.${t}`, `Out in prima, ma la corsa avanza.${t}`])
            : fill(pickS(ev, OUT_FLAVOR.ground.verdict, 'ver'), b) + t
          : shape === 'fly'
            ? adv
              ? pick(ev, [`Volata profonda catturata… il corridore guadagna una base.${t}`, `Presa profonda, tag-up riuscito.${t}`])
              : fill(pickS(ev, OUT_FLAVOR.fly.verdict, 'ver'), b) + t
            : fill(pickS(ev, OUT_FLAVOR.air.verdict, 'ver'), b) + t;
      return [open, actionPhrase(ev), verdict];
    }
    case 'sub':
      return [ev.text];
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

/** Durata (ms) di permanenza di ciascuna fase prima della successiva. Tarata per
 *  leggere con calma ogni testo (non solo intravederlo). */
export const PHASE_MS = 1500;
/** Tempo di permanenza del verdetto prima che il banner sparisca (ms). */
export const HOLD_MS = 2500;
