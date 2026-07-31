// Tipi UI condivisi tra App e i moduli estratti (game/pagine). Tenuti a parte per
// evitare import circolari (i moduli non devono importare da App.tsx).

/** Lato di una gara: ospite o casa. */
export type Side = 'away' | 'home';
