# Roadmap e stato

## Stato attuale

- **Fase 0 — Motore + UI base: COMPLETATA e LIVE.**
  - URL: https://st80dev.github.io/MLBSim/
  - Motore completo (Log5, corsa sulle basi, cambi lanciatore, walk-off, extra
    inning), caratteristiche 20-80 con derivazione ed evoluzione, generazione
    procedurale, 30 franchigie reali, UI con scoreboard/line score/box
    score/cronaca/rose. Test verdi (determinismo + realismo + cime).
  - Calibrazione "alta offesa anni '90/2000" (vedi `docs/engine-calibration.md`).

- **Fase 1 — Turno interattivo: COMPLETATA (nucleo).**
  - Motore **unificato a stati** (`createLiveGame` + azioni + `quickSim`):
    `simulateGame` è ora un caso particolare CPU-vs-CPU dello stesso codice, con
    **l'ordine dell'RNG preservato** (calibrazione Fase 0 invariata).
  - **Gestisci una squadra vs CPU**, decidendo ai tuoi turni. Toggle
    **quick-sim** ("Salta a fine partita").
  - Tattiche del **nucleo**: in attacco Swing / Bunt di sacrificio / Rubata; in
    difesa cambio lanciatore manuale e base intenzionale.
  - Doti prima dormienti ora **attive**: Velocità del corridore + Braccio del
    ricevitore + Difesa (hold) del lanciatore sulle rubate; Difesa del lanciatore
    sui bunt.
  - **Decisioni W/L/SV** tracciate (pitcher of record sul vantaggio decisivo,
    regola dei 5 inning del partente, save al finisher con vantaggio ≤3). Le W
    restano guidate dal **supporto offensivo**, non dall'ERA.
  - **Rimandato** a una rifinitura successiva (non nel nucleo): Hit-and-run,
    Pinch-hit, difesa avanzata (interni dentro).
  - **Nota di design** — il selettore "Gestisci ospite/casa" per singola partita
    è **solo un'affordance di test** di questa fase iniziale (provare in fretta
    entrambi i lati). **A regime la squadra gestita è una scelta persistente**,
    fatta una volta all'avvio del gioco / in setup franchigia, non ripetuta ad
    ogni partita: la sostituzione avverrà con Fase 2/5 (vedi sotto).

## Roadmap
- **Fase 2 — Costruzione squadra & import storico**
  - Editor di lineup/rotazione; import di **giocatori e franchigie storiche
    reali** (database Lahman, pubblico).
  - **Scelta della squadra gestita resa persistente**: la si sceglie una volta
    (setup) e vale per tutte le partite; il selettore per-partita della Fase 1
    diventa strumento di test/debug, non il flusso principale.
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
