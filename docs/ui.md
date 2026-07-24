# Interfaccia

## Direzione

**"Look e leggerezza di OOTP mobile, cuore tattico di SBS."** Grafica **testuale
ma moderna**: layout a card, tema scuro, accenti coi colori squadra, tabelle
statistiche leggibili in monospace, rating colorati (rosso→verde). Testi in
**italiano**. Responsive (deve funzionare anche da telefono).

## Stack

React + TypeScript + Vite. In Fase 0 la UI è tutta in `src/ui/App.tsx` (con
sotto-componenti in-file), più `src/ui/format.ts` (helper: colore rating, stelle,
colore accento, seed) e `src/styles.css` (tema, variabili CSS, griglie).

## Componenti attuali (Fase 0)

- **Scoreboard**: due squadre, badge, punteggio, stadio, indicatore vincitore.
- **Line score** per inning (R/H/E), scrollabile in orizzontale.
- **Box score**: tabellino battuta (AB R H RBI BB SO AVG) + lancio (IP H R ER BB
  SO HR) per entrambe le squadre.
- **Cronaca** play-by-play raggruppata per mezzo inning.
- **Scheda "Rose & caratteristiche"**: doti 20-80 colorate per lineup e rotazione,
  con OVR a stelle.

## Loghi e stadi (importante)

- **Mai** loghi o foto-stadio ufficiali nel repo (marchi/immagini protette).
- La UI genera un **badge originale** (SVG) coi colori squadra dall'abbreviazione.
- Nomi, città, colori e nomi degli stadi reali sono dati fattuali ammessi
  (`src/data/franchises.ts`). Un punto per asset reali *in locale* verrà
  predisposto in Fase 3.

## Prossimi passi UI (Fasi 1/3)

- **Fase 1**: pulsanti-azione per turno (Swing / Bunt / Rubata / Hit-and-run /
  Pinch-hit), cambi lanciatore, difesa avanzata; toggle **quick-sim**.
- **Fase 3**: campo con etichette giocatori posizionate, card giocatore ricche,
  pannelli in stile SBS/OOTP.

## Regole di stile

- Nessun contenuto che scrolli in orizzontale la pagina intera: usare contenitori
  `overflow-x:auto` per tabelle larghe.
- Colori accento derivati dai colori squadra o da `teamAccent()`.
- Unità relative e griglie flessibili per la resa mobile.
