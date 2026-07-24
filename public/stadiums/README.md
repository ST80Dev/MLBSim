# Immagini stadio (sfondo del campo)

Questa cartella ospita le **tue** immagini di sfondo per il campo, una per
squadra. Sono **fornite e committate dall'utente**: il progetto non include
alcuna foto ufficiale.

## Come usarle

1. Metti qui un file per squadra, nominato con l'`id` franchigia (codice a 3
   lettere): `NYY.jpg`, `BOS.jpg`, `LAD.jpg`, …
2. Mappa la voce in `src/data/stadiumImages.ts`:

   ```ts
   export const STADIUM_IMAGES: Record<string, string> = {
     NYY: '/stadiums/NYY.jpg',
     BOS: '/stadiums/BOS.jpg',
   };
   ```

3. Dove non c'è una voce, la UI disegna il **campo/stadio originale generato**
   a runtime (`src/ui/Diamond.tsx`). Nessun asset ufficiale è necessario.

## Avvertenze

- **Deploy su GitHub Pages**: perché le immagini si vedano nel gioco pubblicato
  vanno **committate** (il build le impacchetta). I siti Pages sono **pubblici
  anche se il repository è privato**: le immagini committate saranno quindi
  accessibili pubblicamente. È una scelta consapevole dell'utente.
- Le immagini reali degli stadi possono essere **materiale protetto**: la
  responsabilità della scelta e dell'uso è di chi le aggiunge.
- Taglio consigliato: vista da **dietro casa base** verso il centro, per far
  combaciare i marker del campo. Angolazioni molto diverse possono richiedere
  una calibrazione degli offset dei marker (in arrivo se servirà).
