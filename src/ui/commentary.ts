// Costruzione della cronaca "da telecronista" per il banner della schermata
// partita. Trasforma UN PlayEvent (esito gia' calcolato dal motore) in una
// sequenza di 2-3 frasi sintetiche, con intensita' crescente e colori a tema.
//
// NB: e' puramente PRESENTAZIONE. Non tocca il motore, non consuma RNG: la
// varieta' delle frasi e' deterministica (hash dell'evento), cosi' lo stesso
// turno produce sempre la stessa telecronaca.

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

/** Hash deterministico piccolo, per scegliere una variante di frase. */
function variant(ev: PlayEvent, n: number): number {
  const s = `${ev.inning}${ev.half}${ev.kind}${ev.batter ?? ''}${ev.text}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % n;
}

const pick = (ev: PlayEvent, opts: string[]): string => opts[variant(ev, opts.length)];

/** Suffisso "e segnano N" per il verdetto quando l'azione produce punti. */
function runsTail(scored: number): string {
  if (scored <= 0) return '';
  return scored === 1 ? ' Un punto a casa!' : ` ${scored} punti a casa!`;
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
  return pick(ev, [
    `${b} si porta in battuta per ${ctx.offense.abbrev}…`,
    `${b} al piatto…`,
    `Tocca a ${b}…`,
    `${b} pronto nel box…`,
  ]);
}

/** Costruisce la sequenza di fasi (verdetto in coda) per l'esito. */
function phasesFor(ev: PlayEvent, ctx: BannerContext): string[] {
  const b = ev.batter ?? 'Il battitore';
  const t = runsTail(ev.runsScored);
  const open = opener(ev, ctx);

  switch (ev.kind) {
    case 'homerun':
      return [
        open,
        pick(ev, [
          'Gira le braccia… la palla parte altissima…',
          'Contatto pieno… vola profondissima verso le tribune…',
          'La spedisce lontano… sale, sale…',
        ]),
        `FUORICAMPO di ${b}!${t}`,
      ];
    case 'triple':
      return [
        open,
        pick(ev, [
          'La palla vola nella gap, gli esterni inseguono…',
          'Battuta in profonditá, la difesa rincorre…',
        ]),
        `${b} sfreccia sulle basi… TRIPLO!${t}`,
      ];
    case 'double':
      return [
        open,
        pick(ev, [
          'Palla in mezzo agli esterni, rotola verso il muro…',
          'Linea che taglia il campo…',
        ]),
        `${b} in scivolata in seconda: DOPPIO!${t}`,
      ];
    case 'single':
      return [
        open,
        pick(ev, [
          'Attacca e mette la palla in campo…',
          'Contatto, la palla trova il buco…',
          'Bella lettura, palla in gioco…',
        ]),
        `SINGOLO di ${b}!${t}`,
      ];
    case 'bunthit':
      return [
        open,
        'Smorza a sorpresa lungo la linea…',
        `Nessuno ci arriva: BUNT VALIDO!${t}`,
      ];
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
      return [
        open,
        'Bunt di sacrificio verso l’interno…',
        `${b} si immola: corridore avanzato.${t}`,
      ];
    case 'strikeout':
      return [
        open,
        pick(ev, [
          'Due strike, il lanciatore rifinisce…',
          'Il conto si stringe…',
        ]),
        pick(ev, [`Terzo strike! ${b} a sedere.`, `STRIKEOUT! ${b} eliminato al piatto.`]),
      ];
    case 'gidp':
      return [
        open,
        'Rimbalzo verso l’interno con corridore in corsa…',
        pick(ev, [
          'Presa, tocco di seconda e sparo in prima… DOPPIO GIOCO!',
          'Palla girata in un lampo: due eliminati, DOPPIO GIOCO!',
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
    case 'buntout':
      return [open, 'Prova la smorzata…', `Difesa pronta: ${b} eliminato.`];
    case 'inplayout':
      return [
        open,
        pick(ev, ['Palla messa in gioco…', 'Contatto, palla in campo…']),
        pick(ev, [
          `Presa comoda: ${b} eliminato.${t}`,
          `Rimbalzo raccolto, out in prima.${t}`,
          `Volata catturata: eliminato.${t}`,
        ]),
      ];
    case 'sub':
      return [ev.text];
    case 'other':
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
