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
  ospite (badge, nome, **forza TOT/ATT/DIF/LAN** sotto al team, punteggio) + il
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
  - **Comandi del turno** in **basso-centro** (Battuta/Bunt/Ruba · oppure
    Lancia/Base intenzionale/Cambio lanciatore).
  - A partita finita, **overlay del risultato** con Recap/Nuova partita.

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
- **Foto-stadio dell'utente**: `src/data/stadiumImages.ts` mappa `id → url`
  (**vuota di default**). La cartella `public/stadiums/` è ora **tracciata**
  (scelta esplicita dell'utente per il deploy su Pages): l'utente vi committa le
  proprie immagini e mappa la voce; il Diamond le usa come sfondo. **Nota**: il
  sito Pages è pubblico anche da repo privato → le immagini committate sono
  accessibili pubblicamente; la scelta e la responsabilità sono dell'utente. Il
  progetto non fornisce né committa immagini reali. Vedi
  `public/stadiums/README.md`.

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
