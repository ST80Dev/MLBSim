// Override delle foto-stadio (sfondo del campo).
//
// Di default questa mappa e' VUOTA e la UI disegna un campo/stadio ORIGINALE
// generato a runtime (vedi src/ui/Diamond.tsx). Il progetto non include foto
// ufficiali.
//
// L'UTENTE puo' aggiungere le proprie immagini (scelta esplicita, per il deploy
// su GitHub Pages — vedi public/stadiums/README.md):
//   1. mette i file in `public/stadiums/` (es. `NYY.jpg`), chiavati sull'id
//      franchigia (codice a 3 lettere);
//   2. aggiunge qui la voce, es.  NYY: '/stadiums/NYY.jpg'.
// Se presente, il Diamond usa l'immagine come sfondo dietro il diamante.
//
// Nota: il sito Pages e' pubblico anche da repo privato → le immagini committate
// sono accessibili pubblicamente. Le foto reali possono essere materiale
// protetto: la responsabilita' della scelta e' di chi le aggiunge.

export const STADIUM_IMAGES: Record<string, string> = {
  // NYY: '/stadiums/NYY.jpg',
};

export function stadiumImage(teamId: string): string | undefined {
  return STADIUM_IMAGES[teamId];
}
