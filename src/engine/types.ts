// Modello di dominio del simulatore.
//
// Filosofia: le CARATTERISTICHE (ratings 40-100, 70 = media di lega) sono la fonte di verita' del
// giocatore; le statistiche di conteggio (media, HR, ...) sono un OUTPUT, sia
// derivato dalle caratteristiche sia prodotto dalla simulazione. Cosi' le doti
// restano poche e confrontabili, ed evolverle (eta'/potenziale) e' banale:
// si cambia la caratteristica e il motore ricalcola il rendimento.

export type Hand = 'L' | 'R' | 'S'; // S = switch hitter
export type ThrowHand = 'L' | 'R';

export type Position =
  | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'P';

// ---------------------------------------------------------------------------
// Caratteristiche (scala scout 40-100: 70 = media di lega, ~10 pt = 1 sigma)
// ---------------------------------------------------------------------------

/** Sei doti del battitore. Ognuna governa UNA leva del motore (zero ridondanza). */
export interface BatterRatings {
  contact: number; // media / battute valide (^ singoli, v strikeout)  -> "AVG"
  power: number; // extrabase e fuoricampo                             -> "SLG"
  eye: number; // basi ball (^ OBP, leggero v strikeout)               -> "OBP"
  speed: number; // rubate, tripli, basi extra in corsa
  fielding: number; // palle in gioco trasformate in out, errori
  arm: number; // eliminare ladri di base, assist dagli esterni
}

/** Sei doti del lanciatore. */
export interface PitcherRatings {
  stuff: number; // Dominio: strikeout
  control: number; // Controllo: pochi base ball
  movement: number; // Movimento: poche battute valide concesse
  groundball: number; // Palla a terra: pochi HR concessi + doppi giochi
  stamina: number; // Resistenza: quanti battitori regge prima di calare
  fielding: number; // Difesa: ritorni, bunt, cut-off, tenere i corridori (attiva da Fase 1)
}

// ---------------------------------------------------------------------------
// Statistiche di conteggio (input del motore, derivate dalle caratteristiche)
// ---------------------------------------------------------------------------

export interface BatterStats {
  pa: number;
  h: number; // include 2B/3B/HR
  double: number;
  triple: number;
  hr: number;
  bb: number;
  so: number;
  hbp: number;
  sb: number;
  cs: number;
}

export interface PitcherStats {
  bf: number; // batters faced (denominatore dei rate)
  h: number; // include HR
  hr: number;
  bb: number;
  so: number;
  hbp: number;
}

export type PitcherRole = 'SP' | 'RP' | 'CL';

/**
 * Dati di carriera/franchigia comuni a battitori e lanciatori (il motore di
 * gioco NON li usa: servono al layer di gestione — scambi, draft, stipendi).
 *   - potential: tetto di crescita (scala 40-100)
 *   - salary: unico stipendio annuale (milioni), rinnovato automaticamente
 *   - retired: true quando il giocatore lascia la lega
 *   - twoWay: raro giocatore a doppio ruolo (batte e lancia)
 */
export interface CareerProfile {
  age: number;
  potential: number;
  salary: number;
  retired: boolean;
  twoWay?: boolean;
}

export interface Batter extends CareerProfile {
  id: string;
  name: string; // nome completo (per comodita' di visualizzazione)
  /** Nome/cognome separati (come Lahman nameFirst/nameLast). Opzionali: se assenti
   *  si ricavano dal `name` completo (vedi `engine/names.ts`). */
  firstName?: string;
  lastName?: string;
  bats: Hand;
  position: Position; // ruolo naturale (principale)
  /**
   * Seconda posizione difensiva, SOLO per alcuni giocatori. Se schierato qui, le
   * doti difensive si rivalutano come se fosse il suo ruolo (vedi
   * `ratingsAtPosition`). L'assenza = giocatore mono-ruolo.
   */
  secondaryPosition?: Position;
  ratings: BatterRatings;
  stats: BatterStats; // derivate dalle ratings
}

export interface Pitcher extends CareerProfile {
  id: string;
  name: string; // nome completo (per comodita' di visualizzazione)
  /** Nome/cognome separati (come Lahman nameFirst/nameLast). Opzionali: se assenti
   *  si ricavano dal `name` completo (vedi `engine/names.ts`). */
  firstName?: string;
  lastName?: string;
  throws: ThrowHand;
  role: PitcherRole;
  ratings: PitcherRatings;
  stats: PitcherStats; // derivate dalle ratings
  /** Soglia di battitori affrontabili prima dell'affaticamento (da ratings.stamina). */
  stamina: number;
}

export interface Team {
  id: string;
  name: string; // es. "New York Yankees"
  abbrev: string; // es. "NYY"
  primaryColor: string;
  secondaryColor: string;
  ballpark: string;
  league: 'AL' | 'NL';
  division: 'E' | 'C' | 'W';
  lineup: Batter[]; // 9 battitori nell'ordine di battuta
  bench: Batter[];
  rotation: Pitcher[];
  bullpen: Pitcher[];
  usesDH: boolean;
  /**
   * Profondita' (depth): riserve OLTRE i 25 attivi (lineup+bench+rotation+
   * bullpen). Il motore NON le usa — sono un concetto del layer di gestione:
   * conservano platoon/swingman/sostituti reali di una stagione importata e
   * alimentano gli scambi (Fase 2) swap active<->depth tra le partite, draft
   * (Fase 5). Possono essere vuote.
   */
  reserveBatters: Batter[];
  reservePitchers: Pitcher[];
  /**
   * Contesto REALE della stagione (solo import storico; assente nella lega
   * generata). Serve alla forza-squadra "ibrida": gli individui restano rated dai
   * peripherals (abilità controllabile), ma la SQUADRA assorbe la prevenzione-punti
   * reale — così un team run-prevention (difesa+park, es. gli A's del dinasty) legge
   * forte senza gonfiare i singoli lanciatori. `prevent` è un rating 40-100 dalla
   * ERA vera del team vs epoca. Vedi engine/strength.ts § forza ibrida.
   */
  context?: { prevent: number };
}

// ---------------------------------------------------------------------------
// Esiti per apparizione al piatto
// ---------------------------------------------------------------------------

/** Probabilita' per PA, una per esito; sommano a 1. `outInPlay` e' il resto. */
export interface PaRates {
  bb: number;
  hbp: number;
  so: number;
  hr: number;
  triple: number;
  double: number;
  single: number;
  outInPlay: number;
}

export const PA_EVENT_KEYS = [
  'bb',
  'hbp',
  'so',
  'hr',
  'triple',
  'double',
  'single',
] as const;

/** Esito grezzo di un turno, prima di applicare basi/eliminati. */
export type RawEvent =
  | 'BB'
  | 'HBP'
  | 'SO'
  | 'HR'
  | '3B'
  | '2B'
  | '1B'
  | 'IPO'; // in-play out (da risolvere nel game loop)
