# Roadmap e stato

## Stato attuale

- **Fase 0 — Motore + UI base: COMPLETATA e LIVE.**
  - URL: https://st80dev.github.io/MLBSim/
  - Motore completo (Log5, corsa sulle basi, cambi lanciatore, walk-off, extra
    inning), caratteristiche 20-80 con derivazione ed evoluzione, generazione
    procedurale, 30 franchigie reali, UI con scoreboard/line score/box
    score/cronaca/rose. Test verdi (determinismo + realismo + cime).
  - Calibrazione "alta offesa anni '90/2000" (vedi `docs/engine-calibration.md`).

## Roadmap

- **Fase 1 — Turno interattivo** (il cuore giocabile)
  - Gestisci una squadra e decidi **ad ogni turno**: Swing / Bunt / Rubata /
    Hit-and-run / Pinch-hit; in difesa: cambio lanciatore, base intenzionale,
    difesa avanzata.
  - Toggle **quick-sim** per macinare le partite veloci.
  - Attiva le doti finora "dormienti": Velocità/Braccio (rubate), Difesa
    lanciatore (bunt/ritorni/tenere i corridori).
  - Inizia a **tracciare le decisioni W/L/SV** dei lanciatori (W guidate dal
    supporto offensivo, non dall'ERA).
- **Fase 2 — Costruzione squadra & import storico**
  - Editor di lineup/rotazione; import di **giocatori e franchigie storiche
    reali** (database Lahman, pubblico).
- **Fase 3 — UI stile SBS/OOTP**
  - Campo con etichette, card giocatore ricche, pannelli colorati, pulsanti.
- **Fase 4 — Stagione**
  - Calendario, classifiche, playoff, statistiche accumulate; qui emergono le
    annate individuali con la loro varianza (ERA/W realistiche).
  - Introdurre **difesa dietro il lanciatore** e **fattore stadio** (scollegatori
    ERA-vs-talento).
- **Fase 5 — Franchigia (gestione leggera)**
  - Vedi `docs/franchise.md`: stipendi annuali, salary cap rigido, scambi a
    valore, draft semplice.

## Modello di gioco a regime (bussola per Fasi 4/5)

Il gioco ruota attorno a **una sola squadra scelta dall'utente**:

- Si gioca il **calendario** partita per partita **solo** con la propria squadra.
- Tra una partita e la successiva c'è una **finestra di gestione squadra &
  franchigia**: è lì (e solo lì) che si modificano **roster e lineup/rotazione**,
  scambi, ecc. Le modifiche valgono dalla partita successiva in poi.
- Le partite delle **altre squadre** (non dell'utente) sono **simulate giorno per
  giorno** (quick-sim) per far avanzare classifiche e statistiche di lega.

> Nota di scope UI: la schermata Fase 0 (due squadre casuali, esibizione singola)
> è **provvisoria**. NON vincolarle logiche di stagione/gestione: la persistenza
> di roster/lineup vive nella finestra di gestione tra le partite di calendario,
> non nella preview d'esibizione attuale.

## Principio di scope

Divertirsi a **creare una squadra e giocare molte partite velocemente**,
intervenendo però **ad ogni turno di battuta** quando conta. La managerialità
resta leggera; niente derive da GM manager completo.
