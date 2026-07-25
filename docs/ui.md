# Interfaccia

## Direzione

**"Cuore tattico di SBS, presentazione di OOTP."** Grafica **testuale ma
moderna**: tema scuro, accenti coi colori squadra, tabelle in monospace, rating
colorati (rosso→verde). Testi in **italiano**. **Desktop-first**: la schermata
partita è una plancia a **100% dell'altezza** (niente scroll di pagina; scroll
solo interno a cronaca/recap), con **poco padding e dati espliciti** su schermi
HD. Il mobile non è più un obiettivo (deve solo "non rompersi").

## Stack

React + TypeScript + Vite. La UI principale è in `src/ui/App.tsx` (con
sotto-componenti in-file), più `src/ui/Diamond.tsx` (campo/stadio generato),
`src/ui/format.ts` (helper: colore rating, stelle, colore accento, seed) e
`src/styles.css` (tema, variabili CSS, griglie).

## Schermata partita (plancia stile SBS, 100% altezza)

Regioni, dall'alto in basso:

- **Header** (fuori dallo sfondo stadio): brand, **Gestisci** (ospite/casa),
  tab Partita/Rose, **Recap partita**, **Nuove squadre**, **Salta a fine**.
- **Barra stat** (a tutta larghezza, sotto l'header): a **sinistra** la squadra
  ospite (badge, nome in MAIUSCOLO separato da una riga, **forza TOT/ATT/DIF/LAN**
  in **celle a riquadro** — sigla sopra, valore colorato sotto — e punteggio) + il
  **giocatore coinvolto nell'azione** (battitore se attacca, lanciatore se
  difende) con la sua riga stat; al **centro** situazione (inning/mezzo, out,
  rombo basi), **line score** e il **toggle stat**; a **destra** la squadra di
  casa, speculare.
- **Campo di gioco** (`Diamond` in modalità `background`): il campo/stadio
  **generato** riempie lo sfondo, con i marker della difesa, delle basi
  (occupate evidenziate), del battitore e del lanciatore. Sopra si sovrappongono:
  - **Cronaca** (`CronacaOverlay`), overlay in alto-centro, **collassabile**, a
    sezioni per inning/mezzo, poche righe con **scroll** (auto verso l'ultima).
  - **Lineup** delle due squadre negli **angoli in basso** (ordine + stat live,
    battitore corrente evidenziato, lanciatore in pedana).
  - **Comandi del turno** in **basso-centro**, in **una sola riga compatta**
    (Battuta/Bunt/Ruba · oppure Lancia/Base int./Cambio lanc.), per lasciare più
    spazio a casa base.
  - A partita finita, **overlay del risultato** con Recap/Nuova partita.

Il campo generato disegna **solo il terreno di gioco** (niente tribune/cielo
finti): sotto una foto reale sarebbe ridondante e ruberebbe spazio.

**Sfondo-stadio ambientale**: dietro tutta la plancia (`.stadium-backdrop`) la
stessa foto, **attenuata e sfocata**, riempie i bordi (letterbox), gli angoli
sotto lineup/cronaca e la fascia alta sotto testata/barra stat (queste sono
semi-trasparenti): riduce al minimo il nero senza rubare nitidezza al campo. Se
la foto manca, resta lo sfondo scuro.

**Etichette dei marker**: sopra il marker per tutti tranne **lanciatore,
ricevitore e battitore** (in basso nella foto), che le hanno sotto.

**Toggle stat** (`StatsToggle`, tre stati): **Partita** (dato reale) ·
**Stagione** (proiezione dalle doti, `player.stats`, ~650 PA / 1000 BF) ·
**Scorsa** (disabilitato: nessuno storico finché non arriva la Fase 4). Governa
le righe del giocatore coinvolto e il **Recap**. Le righe sono calcolate in
`src/ui/statlines.ts`.

**Recap partita** (`RecapModal`): popup quasi a tutto schermo con line score e
**box score completo** di entrambe le squadre (battuta + lancio, V/P/SV), col
toggle stat. Chiudibile con ✕, click fuori o Esc.

- **Scheda "Rose & caratteristiche"**: doti 20-80 colorate per lineup e rotazione,
  con OVR a stelle e lo scambio difensivo (seconda posizione).

La partita interattiva (`LiveGame`) è **mutabile** e vive tra i render: `App`
la tiene in un `useRef` con chiave `teamSeed|gara|squadra`, ricreandola solo al
cambio di quei parametri, e forza il re-render dopo ogni azione.

## Loghi e stadi (importante)

- La UI genera un **badge originale** (SVG) coi colori squadra dall'abbreviazione
  e un **campo/stadio originale** a runtime (`Diamond.tsx`): è il default e non
  contiene alcun asset ufficiale. **Loghi ufficiali**: mai nel repo.
- Nomi, città, colori e nomi degli stadi reali sono dati fattuali ammessi
  (`src/data/franchises.ts`).
- **Foto-stadio dell'utente**: `src/data/stadiumImages.ts` mappa `id → file`
  per **tutte e 30 le squadre** con la convenzione `public/stadiums/<ID>.jpg`
  (ID = codice franchigia a 3 lettere, standard MLB; estensione `.jpg`
  minuscola, Pages è case-sensitive). Basta committare il file col nome giusto e
  la foto compare come sfondo; se il file manca, il Diamond ripiega
  automaticamente sul campo generato (`onError`), senza immagini rotte. La
  cartella `public/stadiums/` è **tracciata** (scelta esplicita dell'utente per
  il deploy su Pages). **Nota**: il sito Pages è pubblico anche da repo privato →
  le immagini committate sono accessibili pubblicamente; la scelta e la
  responsabilità sono dell'utente. Il progetto non fornisce né committa immagini
  reali. Vedi `public/stadiums/README.md`.

### Calibrazione del campo sulla foto (🎯 Calibra campo)

Le foto reali sono scattate da angolazioni diverse, non perfettamente in asse
con casa base. Il pulsante **🎯 Calibra campo** (header, in Partita) apre un
**pannello live** (`CalibrationPanel`) che ri-proietta i marker tenendo **casa
base come perno**. Parametri (`src/data/stadiumCalibration.ts`):

- `homeX`/`homeY`: posizione di casa base (perno).
- `spreadX`/`depthY`: larghezza e profondità dei marker.
- `ofDist`: **distanza interni↔esterni** — scala la profondità *oltre* l'interno
  tenendo fermo l'interno (`<1` avvicina gli esterni = schiaccia la prospettiva).
- `skewX`: **inclinazione sx/dx** — sposta i marker più lontani a destra/sinistra
  per raddrizzare un campo storto.
- `fan`: apertura prospettica (i marker lontani si allargano di più).
- `bgZoom`/`bgX`/`bgY`: zoom e pan della foto di sfondo.
- `image` (opzionale): **variante-foto** scelta. Il pannello rileva
  automaticamente le foto alternative presenti nel repo (`<ID>.jpg`,
  `<ID>2.jpg`, `<ID>3.jpg`, … — provate via `onload`) e mostra dei chip
  **Principale / Alt 2 / Alt 3**: selezionandone uno cambia lo sfondo live e
  salva il percorso in `image`. Se assente si usa la principale `<ID>.jpg`.

Con i valori di default la proiezione è l'**identità** (campo generato non
deformato). Il pannello mostra il valore live, ha slider con stepper −/+ e
produce il **JSON** da incollare in `STADIUM_CALIBRATION` (una voce per stadio,
chiave = ID franchigia). «Azzera» reimposta la geometria ma **mantiene la foto
scelta**. È **solo UI**: non tocca il motore.

**Persistenza = repository.** La calibrazione non usa storage del browser: la
fonte di verità è `src/data/stadiumCalibration.ts` **committato**. Si calibra
live, si copia la riga JSON in `STADIUM_CALIBRATION` e si committa: da lì la
calibrazione è permanente e uguale su ogni dispositivo (il sito Pages la
ricarica al load). La calibrazione è **per foto** (include il campo `image`).

## Prossimi passi UI (Fasi 1+/3)

- **Rifinitura Fase 1**: pulsanti per Hit-and-run, Pinch-hit (menu panchina) e
  difesa avanzata (interni dentro).
- **Fase 3**: campo con etichette giocatori posizionate, card giocatore ricche,
  pannelli in stile SBS/OOTP.

## Regole di stile

- La schermata partita sta in **100% dell'altezza**: header + barra stat auto,
  campo `flex:1`; overflow interno solo dove serve (cronaca, recap, angoli).
- **Poco padding, dati espliciti**, font leggibili con peso adeguato: la plancia
  è pensata per uno schermo desktop HD.
- Colori accento derivati dai colori squadra.
