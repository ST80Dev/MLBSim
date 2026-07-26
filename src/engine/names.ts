// Gestione nome/cognome dei giocatori.
//
// Un giocatore ha `firstName`/`lastName` separati (come negli archivi storici,
// es. Lahman: nameFirst/nameLast). Il campo `name` resta il nome completo per
// comodita' di visualizzazione. Nelle viste strette (box score, line score) si
// mostra il COGNOME, con DISAMBIGUAZIONE quando due giocatori mostrati insieme
// condividono il cognome (es. Roberto e Sandy Alomar, fratelli): in quel caso
// si prefissa l'iniziale del nome -> "R. Alomar" / "S. Alomar".

export interface NameParts {
  first: string;
  last: string;
}

/** Scompone un nome completo in nome e cognome (cognome = tutto dopo il 1° spazio). */
export function splitName(full: string): NameParts {
  const t = full.trim();
  const i = t.indexOf(' ');
  if (i < 0) return { first: '', last: t };
  return { first: t.slice(0, i), last: t.slice(i + 1) };
}

interface HasName {
  name: string;
  firstName?: string;
  lastName?: string;
}

/** Cognome di un giocatore: usa il campo esplicito, altrimenti lo ricava dal nome completo. */
export function lastNameOf(p: HasName): string {
  return p.lastName ?? splitName(p.name).last;
}

/** Nome di un giocatore: usa il campo esplicito, altrimenti lo ricava dal nome completo. */
export function firstNameOf(p: HasName): string {
  return p.firstName ?? splitName(p.name).first;
}

/**
 * Etichette di visualizzazione (cognome) per una LISTA di nomi completi, con
 * disambiguazione: se un cognome ricorre piu' volte nella lista, gli omonimi
 * ricevono l'iniziale del nome ("R. Alomar" / "S. Alomar"); i cognomi unici
 * restano nudi. Preserva l'ordine dell'input. E' una funzione di DISPLAY: opera
 * sui nomi completi (come quelli salvati nelle righe di tabellino).
 */
export function disambiguateLastNames(fullNames: readonly string[]): string[] {
  const parts = fullNames.map(splitName);
  const count = new Map<string, number>();
  for (const p of parts) count.set(p.last, (count.get(p.last) ?? 0) + 1);
  return parts.map((p) =>
    (count.get(p.last) ?? 0) > 1 && p.first ? `${p.first[0]}. ${p.last}` : p.last,
  );
}
