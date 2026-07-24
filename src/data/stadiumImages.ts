// Override opzionale delle foto-stadio *in locale*.
//
// REGOLA DEL REPO: mai committare foto ufficiali degli stadi (immagini
// protette). Di default questa mappa e' VUOTA e la UI disegna un campo/stadio
// ORIGINALE generato a runtime (vedi src/ui/Diamond.tsx).
//
// Come usarla in locale (senza committare gli asset):
//   1. metti le tue immagini in `public/stadiums/` (es. `NYY.jpg`);
//   2. aggiungi qui la voce, es.  NYY: '/stadiums/NYY.jpg'
//      (o un data-URL / import), chiavata sull'id franchigia.
// Se presente, il Diamond usa l'immagine come sfondo dietro il diamante.
//
// `public/stadiums/` e i file immagine restano fuori dal versionamento
// (vedi .gitignore); tieni le tue voci fuori dai commit condivisi.

export const STADIUM_IMAGES: Record<string, string> = {
  // NYY: '/stadiums/NYY.jpg',
};

export function stadiumImage(teamId: string): string | undefined {
  return STADIUM_IMAGES[teamId];
}
