# Interfaccia

## Direzione

**"Look e leggerezza di OOTP mobile, cuore tattico di SBS."** Grafica **testuale
ma moderna**: layout a card, tema scuro, accenti coi colori squadra, tabelle
statistiche leggibili in monospace, rating colorati (rosso→verde). Testi in
**italiano**. Responsive (deve funzionare anche da telefono).

## Stack

React + TypeScript + Vite. La UI principale è in `src/ui/App.tsx` (con
sotto-componenti in-file), più `src/ui/Diamond.tsx` (campo/stadio generato),
`src/ui/format.ts` (helper: colore rating, stelle, colore accento, seed) e
`src/styles.css` (tema, variabili CSS, griglie).

## Componenti attuali

- **Barra "Gestisci"** (Fase 1): scegli quale squadra pilotare (ospite/casa);
  cambiarla riavvia la gara corrente.
- **Pannello di controllo interattivo** (Fase 1): situazione (inning/mezzo, rombo
  delle basi, out), mini-schede battitore/lanciatore con le doti chiave, e i
  pulsanti-azione contestuali. In attacco: **Battuta / Bunt / Ruba la 2ª / Ruba
  la 3ª** (solo quando ha senso). In difesa: **Lancia / Base intenzionale /
  Cambio lanciatore** (menu dei rilievi). Fuori dal pannello, **quick-sim**
  ("Salta a fine partita") e, a partita finita, il **banner del risultato**.
- **Scoreboard**: due squadre, badge, punteggio, stadio, indicatore vincitore
  (evidenziato solo a partita conclusa). Il sotto-titolo mostra la **forza
  totale** della squadra.
- **Diamante/campo** (`Diamond.tsx`): campo + stadio **originali** generati a
  runtime (SVG). La difesa di casa è posizionata sul diamante con etichetta
  (ruolo + cognome); piccole variazioni per stadio (tetto, torri-faro, tinte)
  sono seedate dal nome del ballpark. Colori dalle tinte squadra.
- **Forza squadre**: pannello comparativo con **TOT / ATT / DIF / LAN** per
  entrambe le squadre (vedi `src/engine/strength.ts`).
- **Line score** per inning (R/H/E), scrollabile in orizzontale.
- **Box score**: tabellino battuta (AB R H RBI BB SO **SB** AVG) + lancio (IP H R
  ER BB SO HR **Dec** con V/P/SV) per entrambe le squadre.
- **Cronaca** play-by-play raggruppata per mezzo inning, che cresce a ogni azione.
- **Scheda "Rose & caratteristiche"**: doti 20-80 colorate per lineup e rotazione,
  con OVR a stelle.

La partita interattiva (`LiveGame`) è **mutabile** e vive tra i render: `App`
la tiene in un `useRef` con chiave `teamSeed|gara|squadra`, ricreandola solo al
cambio di quei parametri, e forza il re-render dopo ogni azione.

## Loghi e stadi (importante)

- **Mai** loghi o foto-stadio ufficiali nel repo (marchi/immagini protette).
- La UI genera un **badge originale** (SVG) coi colori squadra dall'abbreviazione,
  e un **campo/stadio originale** generato a runtime (`Diamond.tsx`).
- Nomi, città, colori e nomi degli stadi reali sono dati fattuali ammessi
  (`src/data/franchises.ts`).
- **Foto-stadio reali in locale**: `src/data/stadiumImages.ts` espone una mappa
  `id → url` **vuota di default**. Chi vuole può mettere le proprie immagini in
  `public/stadiums/` (ignorata da git) e mappare la voce: il Diamond le usa come
  sfondo. Nessun asset ufficiale finisce nel repo.

## Prossimi passi UI (Fasi 1+/3)

- **Rifinitura Fase 1**: pulsanti per Hit-and-run, Pinch-hit (menu panchina) e
  difesa avanzata (interni dentro).
- **Fase 3**: campo con etichette giocatori posizionate, card giocatore ricche,
  pannelli in stile SBS/OOTP.

## Regole di stile

- Nessun contenuto che scrolli in orizzontale la pagina intera: usare contenitori
  `overflow-x:auto` per tabelle larghe.
- Colori accento derivati dai colori squadra o da `teamAccent()`.
- Unità relative e griglie flessibili per la resa mobile.
