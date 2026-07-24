# Immagini stadio (sfondo del campo)

Questa cartella ospita le **tue** immagini di sfondo per il campo, una per
squadra. Sono **fornite e committate dall'utente**: il progetto non include
alcuna foto ufficiale.

## Come usarle

1. Metti qui un file per squadra, nominato **esattamente** con l'`id`
   franchigia (codice a 3 lettere, standard MLB — vedi `src/data/franchises.ts`)
   ed estensione **minuscola** `.jpg`: `NYY.jpg`, `BOS.jpg`, `SFG.jpg`,
   `KCR.jpg`, `SDP.jpg`, `TBR.jpg`, … GitHub Pages è **case-sensitive**: usa
   maiuscole nel codice e `.jpg` minuscolo nell'estensione.
2. Non serve modificare codice: `src/data/stadiumImages.ts` elenca già **tutte
   e 30 le squadre**. Basta caricare il file col nome giusto e la foto compare.
3. Dove il file **non** c'è (ancora), il Diamond ripiega automaticamente sul
   **campo/stadio originale generato** a runtime (`src/ui/Diamond.tsx`, tramite
   `onError`): nessuna immagine rotta.

### Codici delle 30 squadre

```
AL East    BAL BOS NYY TBR TOR
AL Central CWS CLE DET KCR MIN
AL West    HOU LAA OAK SEA TEX
NL East    ATL MIA NYM PHI WSH
NL Central CHC CIN MIL PIT STL
NL West    ARI COL LAD SDP SFG
```

## Calibrazione dei marker

In partita, il pulsante **🎯 Calibra campo** (header) apre un pannello con
slider **live** per far combaciare i marker (basi, monte, difensori) con la
foto, usando **casa base come perno**:

- **Casa base — orizzontale/verticale**: sposta il perno del campo.
- **Larghezza / Profondità campo**: allarga-stringe e allunga-accorcia i marker.
- **Apertura prospettica**: apre di più i marker lontani (effetto prospettiva).
- **Foto — zoom / sposta orizz. / sposta vert.**: inquadra la foto di sfondo.

Copia il JSON prodotto e incollalo in `STADIUM_CALIBRATION`
(`src/data/stadiumCalibration.ts`), una voce per stadio.

### Foto alternative dello stesso stadio

Puoi tenere più foto dello stesso stadio nominandole `<ID>2.jpg`, `<ID>3.jpg`
(es. `SFG2.jpg`, `SFG3.jpg`). Il pannello di calibrazione le rileva da solo e
mostra i chip **Principale / Alt 2 / Alt 3**: scegli quella che preferisci e la
scelta viene salvata nel campo `image` del JSON di calibrazione.

## Avvertenze

- **Deploy su GitHub Pages**: perché le immagini si vedano nel gioco pubblicato
  vanno **committate** (il build le impacchetta). I siti Pages sono **pubblici
  anche se il repository è privato**: le immagini committate saranno quindi
  accessibili pubblicamente. È una scelta consapevole dell'utente.
- Le immagini reali degli stadi possono essere **materiale protetto**: la
  responsabilità della scelta e dell'uso è di chi le aggiunge.
- Taglio consigliato: vista da **dietro casa base** verso il centro; la
  calibrazione adatta i marker ad angolazioni non perfettamente in asse.
