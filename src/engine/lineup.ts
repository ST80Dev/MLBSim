import type { Batter, Position } from './types';
import { batterOverall } from './ratings';

// Costruzione dell'ordine di battuta e validazione dello schieramento.
//
// Puro e testabile: nessuna dipendenza dalla UI, niente RNG (deterministico a
// parita' di input). L'editor (Fase 2) usa `autoLineup` come default e come
// pulsante "Auto"; `validateFieldSet` fa da guardia sul vincolo duro difensivo.

/** Le 9 caselle che un lineup valido deve coprire ESATTAMENTE una volta. */
export const FIELD_SLOTS: readonly Position[] = [
  'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH',
];

/**
 * Ordina i battitori in un ordine di battuta plausibile per l'epoca "alta
 * offesa" (anni '90/2000), non un ottimo assoluto:
 *   1 leadoff  -> occhio (OBP) + velocita'
 *   2          -> table-setter: contatto + occhio
 *   3          -> il miglior bastone completo
 *   4 cleanup  -> potenza pura
 *   5          -> protezione: potenza secondaria
 *   6..9       -> per overall decrescente
 *
 * ORDINE DI ASSEGNAZIONE: si reclamano PRIMA i posti da run-producer (4 → 3 → 5),
 * poi leadoff/#2 pescano dai RESTANTI. Fondamentale: un bombardiere con OBP alto
 * (Adam Dunn 2006: occhio 97 MA potenza 96) ha l'occhio più alto della squadra e,
 * se il leadoff fosse scelto per primo, finirebbe assurdamente in testa. Prendendo
 * prima il cleanup, lo slugger va al centro (dove segna), e il leadoff resta ai
 * veri table-setter da OBP+velocità. Con meno di 5 battitori ripiega sull'overall.
 * NON muta l'input: ritorna un nuovo array.
 */
export function autoLineup(batters: Batter[]): Batter[] {
  return autoLineupBy(batters, (b) => b.ratings);
}

/**
 * Come `autoLineup`, ma i punteggi si calcolano su `ratingsOf(b)` invece che su
 * `b.ratings`. Serve al lineup "con forma" (`data/formLineup.ts`), che passa i
 * rating MISCHIATI col rendimento in-season: la logica di ordinamento resta UNA
 * sola (qui), il chiamante decide solo *quali rating* pesare. Le posizioni, gli
 * id e gli oggetti Batter restituiti sono sempre quelli reali.
 */
export function autoLineupBy(
  batters: Batter[],
  ratingsOf: (b: Batter) => Batter['ratings'],
): Batter[] {
  const pool = [...batters];
  const ovr = (b: Batter) => batterOverall(ratingsOf(b), b.position);
  if (pool.length < 5) {
    return pool.sort((a, b) => ovr(b) - ovr(a));
  }

  const take = (score: (b: Batter) => number): Batter => {
    let best = 0;
    for (let i = 1; i < pool.length; i++) {
      if (score(pool[i]) > score(pool[best])) best = i;
    }
    return pool.splice(best, 1)[0];
  };
  const r = (b: Batter) => ratingsOf(b);

  const order: Batter[] = [];
  // Run-producer PRIMA: i bastoni pesanti occupano il centro (4-3-5)…
  order[3] = take((b) => r(b).power * 1.0 + r(b).contact * 0.2); // cleanup: potenza pura
  order[2] = take((b) => r(b).contact * 0.7 + r(b).power * 0.6 + r(b).eye * 0.3); // n.3: miglior bastone
  order[4] = take((b) => r(b).power * 0.9 + r(b).contact * 0.3); // n.5: protezione
  // …poi i table-setter dai RESTANTI (gli slugger sono già stati presi).
  order[0] = take((b) => r(b).eye * 1.0 + r(b).speed * 0.6); // leadoff: OBP + velocità
  order[1] = take((b) => r(b).contact * 0.7 + r(b).eye * 0.7); // n.2: contatto + occhio

  pool.sort((a, b) => ovr(b) - ovr(a));
  let slot = 5;
  for (const b of pool) order[slot++] = b;
  return order;
}

/**
 * Riordina il lineup secondo `order` (id dei battitori nell'ordine di battuta
 * voluto). Robusto e totale: gli id sconosciuti o duplicati in `order` vengono
 * ignorati; i battitori del lineup non citati restano in coda nell'ordine
 * originale. Cosi' un `order` salvato non piu' allineato alla rosa (giocatore
 * ceduto, rosa rigenerata) degrada in modo pulito invece di perdere battitori.
 * NON muta l'input: ritorna un nuovo array.
 */
export function reorderLineup(lineup: Batter[], order: string[]): Batter[] {
  const byId = new Map(lineup.map((b) => [b.id, b]));
  const seen = new Set<string>();
  const out: Batter[] = [];
  for (const id of order) {
    const b = byId.get(id);
    if (b && !seen.has(id)) {
      out.push(b);
      seen.add(id);
    }
  }
  for (const b of lineup) if (!seen.has(b.id)) out.push(b);
  return out;
}

export interface FieldSetCheck {
  ok: boolean;
  /** Caselle scoperte. */
  missing: Position[];
  /** Caselle occupate da piu' di un giocatore. */
  duplicates: Position[];
}

/**
 * Verifica il vincolo DURO dell'editor: le 9 posizioni schierate devono essere
 * una permutazione esatta di `FIELD_SLOTS` (niente buchi, niente doppioni sul
 * diamante). L'ordine di battuta e la scelta di CHI copre una casella (con
 * eventuale malus fuori-ruolo) sono liberi: qui si controlla solo la copertura.
 */
export function validateFieldSet(positions: Position[]): FieldSetCheck {
  const counts = new Map<Position, number>();
  for (const p of positions) counts.set(p, (counts.get(p) ?? 0) + 1);
  const missing = FIELD_SLOTS.filter((s) => (counts.get(s) ?? 0) === 0);
  const duplicates = FIELD_SLOTS.filter((s) => (counts.get(s) ?? 0) > 1);
  return {
    ok: positions.length === 9 && missing.length === 0 && duplicates.length === 0,
    missing,
    duplicates,
  };
}
