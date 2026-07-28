# Roadmap e stato

## Stato attuale

- **Fase 0 — Motore + UI base: COMPLETATA e LIVE.**
  - URL: https://st80dev.github.io/MLBSim/
  - Motore completo (Log5, corsa sulle basi, cambi lanciatore, walk-off, extra
    inning), caratteristiche 40-100 con derivazione ed evoluzione, generazione
    procedurale, 30 franchigie reali, UI con scoreboard/line score/box
    score/cronaca/rose. Test verdi (determinismo + realismo + cime).
  - Calibrazione "alta offesa anni '90/2000" (vedi `docs/engine-calibration.md`).

- **Fase 1 — Turno interattivo: COMPLETATA (nucleo).**
  - Motore **unificato a stati** (`createLiveGame` + azioni + `quickSim`):
    `simulateGame` è ora un caso particolare CPU-vs-CPU dello stesso codice, con
    **l'ordine dell'RNG preservato** (calibrazione Fase 0 invariata).
  - **Gestisci una squadra vs CPU**, decidendo ai tuoi turni. Toggle
    **quick-sim** ("Salta a fine partita").
  - Tattiche **complete**: in attacco Swing / Bunt di sacrificio / Rubata /
    **Hit-and-run** / **Pinch-hit** (panchina); in difesa cambio lanciatore
    manuale / base intenzionale / **interni dentro** (difesa avanzata).
  - Doti prima dormienti ora **attive**: Velocità del corridore + Braccio del
    ricevitore + Difesa (hold) del lanciatore sulle rubate; Difesa del lanciatore
    sui bunt; Contatto del battitore sull'hit-and-run.
  - **Decisioni W/L/SV** tracciate (pitcher of record sul vantaggio decisivo,
    regola dei 5 inning del partente, save al finisher con vantaggio ≤3). Le W
    restano guidate dal **supporto offensivo**, non dall'ERA.
  - Le tattiche usano l'RNG **solo nei turni umani**: il quick-sim CPU-vs-CPU e
    la calibrazione Fase 0 restano identici (test di determinismo verdi).
  - **Nota di design** — il selettore "Gestisci ospite/casa" per singola partita
    è **solo un'affordance di test** di questa fase iniziale (provare in fretta
    entrambi i lati). **A regime la squadra gestita è una scelta persistente**,
    fatta una volta all'avvio del gioco / in setup franchigia, non ripetuta ad
    ogni partita: la sostituzione avverrà con Fase 2/5 (vedi sotto).

- **Fase 2 — Costruzione squadra & import storico: QUASI COMPLETA.**
  - Editor rosa con **UI drag&drop**, **foglio partita** che entra nella
    simulazione, **squadra gestita persistente**, **persistenza Supabase**,
    **import storico** end-to-end (inversione stat→rating, prova 1999) e
    **fondazione modalità lega + salary cap**. In più, anticipati dalla Fase 4:
    **calendario**, **classifiche**, **Leaderboard** e accumulo stat reali.
  - **Flusso d'ingresso — FATTO:** schermata iniziale (`StartScreen`: nuova lega
    **generata** / **storica** in anteprima / riprendi salvataggio) → **panoramica
    lega** (`LeagueOverview`: 30 squadre per division con forza `teamStrength` e
    indicatore payroll-vs-cap; dettaglio rosa in modale) → scelta squadra gestita
    → dashboard. Il **seed e la sorgente** sono ora **persistiti** nel `GameSave`
    (schema v2): ricaricare rigenera la STESSA lega (prima il seed era casuale ad
    ogni avvio → bug). Indicatore cap a due confini anche sulla **Franchigia**.
  - **Salary cap — RICALIBRATO:** curva stipendi compressa (`salaryFromOverall`:
    payroll medio ~193M sotto il cap base 250M, stelle fino a ~45M, spread da
    ~10x a ~4-5x) +
    **`youthFactor`** (stipendio = f(overall, età), modello B-lite). Modello a due
    confini (base soft + muro esterno) con `capZone` per l'indicatore. Enforce
    (ε, riconciliazione al rollover via pool) resta design di Fase 4/5. Vedi
    `docs/franchise.md`.
  - **Manca per chiudere la fase:** pipeline Lahman completa (30 squadre ×
    annata) per rendere davvero giocabile la modalità storica (oggi solo dataset
    1999 di prova, esposta come **anteprima**). Dettaglio sotto.

## Roadmap
- **Fase 2 — Costruzione squadra & import storico** *(quasi completa)*
  - **Import storico — decisione di design**: le stagioni reali sono *snapshot
    congelati*, quindi le **statistiche** dell'annata sono la verità di quel
    giocatore storico e i rating 40-100 si **stimano** dalle stat solo per
    pilotare le leve del motore. Il principio "caratteristiche = fonte di verità"
    resta pieno per i giocatori **generati** (che evolvono); lo snapshot storico
    non evolve. Import di **stagioni intere** dal Lahman via pipeline di build
    (JSON compatti per annata, non CSV a runtime).
  - **Import storico — FATTO (prova end-to-end):** l'inversione *statistiche →
    rating 40-100* vive in `engine/statsToRatings.ts`
    (`ratingsFromBatterStats`/`ratingsFromPitcherStats`, inverse di
    `deriveBatterStats`/`derivePitcherStats`; vedi `docs/players-and-ratings.md`).
    Dataset di prova (`data/historical/season1999.ts`, linee reali approssimate di
    CLE e BOS 1999) + importatore (`data/historical/import.ts`) costruiscono
    squadre pronte al motore con **stats ri-derivate dai rating stimati**. Nomi
    reali separati nome/cognome (`engine/names.ts`); **potenziale stimato**
    all'import (`projectPotential`) con code bust/breakout in `aging.ts` (lo
    sviluppo futuro dal seed NON replica la realtà). Verifica: round-trip fedele,
    i **campioni** escono campioni e gli **scarsi** affondano, aggregati
    closed-loop nell'epoca. **Manca:** pipeline Lahman completa (30 squadre ×
    annata) e **UI di selezione stagione/sorgente**.
  - **Editor squadra — FATTO (motore/dati + UI):** roster **25 attivi + ~10
    depth**, split **14/11**, **sempre DH**, posizioni **libere con malus**
    (`engine/lineup.ts`: `autoLineup` + `validateFieldSet`). La **UI** è la
    pagina **Roster** (linguette Fielders/Pitchers, **drag&drop** ordine/ruoli/
    panca, tabelle stat con toggle Stagione/Scorsa/Storico/Caratteristiche). Il
    **foglio partita** (`engine/arrangement.ts`: `MatchArrangement`) entra
    davvero nella simulazione (`buildManagedTeam`) ed è **persistito**
    (`lineups` in `GameSave`).
  - **Squadra gestita persistente — FATTO:** `managedTeamId` scelto e salvato
    (selettore nella Home); il selettore per-partita della Fase 1 resta solo
    strumento di test.
  - **Persistenza — FATTO (fondamenta):** salvataggi su **Supabase** dietro
    `SaveStore` (`src/data/persistence/`). Cloud sorgente primaria, niente auth,
    RLS aperta per scelta, save versionati. Vedi `docs/architecture.md`.
  - **Modalità lega + salary cap — FONDAZIONE:** `data/leagueMode.ts` distingue
    lega **generata** (talento ~gaussiano → cap **rigido**, sandbox paritaria) da
    import **storico** (rose sbilanciate reali → cap **morbido/off**). Tipi +
    utilità sul monte-ingaggi; l'enforce (scambi/rinnovi) è del layer gestionale.
    Vedi `docs/franchise.md` § Modalità e squilibrio.
- **Fase 3 — UI stile SBS/OOTP** *(avviata)*
  - Campo con etichette, card giocatore ricche, pannelli colorati, pulsanti.
  - **FATTO (primi passi):** struttura a **pagine** con header di navigazione
    (Home/Roster/Leaderboard/Classifiche/Franchigia); **banner di cronaca a fasi**
    sopra la foto stadio + **micro-eventi** partita (lancio pazzo / palla passata
    / balk) — vedi `src/ui/commentary.ts` e `docs/engine-calibration.md`.
- **Fase 4 — Stagione** *(gran parte anticipata in Fase 2)*
  - **FATTO:** **calendario** (10 prestagione + 162 regular + slot playoff,
    `data/schedule.ts`); **stagione a stati** (`data/season.ts`) che accumula i
    box score **reali** di entrambe le squadre nelle mie partite e **quick-sima**
    il resto della lega per classifiche reali; pagina **Classifiche** (record di
    division reali) e pagina **Leaderboard** (Batting/Pitching: numeri reali per
    la mia squadra, **proiezione** d'annata credibile per le altre 29, con
    identità statistiche rispettate — `data/projection.ts`).
  - **FATTO (scollegatore ERA):** **difesa dietro il lanciatore** — la sintesi
    difensiva dei 9 schierati (`teamSynthesis().def`, la stessa della UI) sposta la
    BABIP (hit su palla in gioco ⟷ out), mai i three true outcomes. Neutrale alla
    media di lega (aggregati di Fase 0 invariati), scollega l'ERA del singolo
    lanciatore di ~±0.35 fra difesa scarsa ed élite. Vedi
    `docs/engine-calibration.md` § Difesa dietro il lanciatore; `TUNING.defense`.
  - **Manca:** **playoff giocabili** (ora slot placeholder); **rollover di
    stagione** (stagione → scorsa → carriera dai dati reali degli anni gestiti). Il
    **fattore stadio** è **fuori scope** per scelta (non serve a questo livello).
- **Fase 5 — Franchigia (gestione leggera)** *(pianificata; 5A avviabile ora)*
  - Vedi `docs/franchise.md`: stipendi annuali, salary cap, scambi a valore, draft
    semplice. Fondazione modalità/cap già presente (vedi Fase 2).
  - **Split 5A/5B** (vedi `docs/franchise.md § Piano di esecuzione`): il layer
    franchigia è **quasi tutto logica pura** e si sgancia dalla Fase 4 grazie alla
    cucitura `advanceSeasonBatter/Pitcher(…, perf = 0)` (segnale d'impiego oggi
    neutro, collegabile al `perf` reale a rollover Fase 4 pronto).
  - **5A — motore franchigia (puro, testabile, NIENTE dipendenza da Fase 4):**
    1) `playerValue` (atomo scambi+cap, `engine/value.ts`) — **avviato**;
    2) cap enforce + ε seedato; 3) pool free agent + riconciliazione;
    4) draft inverso; 5) valutazione scambi; 6) `runOffseason` (perf=0).
  - **5B — UI + accoppiamento stagione (dopo Fase 4):** finestra di gestione fra le
    partite, UI scambi/draft/off-season, `perf` reale, normalizzazione PA battitori.
  - **Persistenza:** `GameSave` schema **v3** con **rose persistite** (il multi-anno
    diverge dal seed dopo aging + scambi umani). ε seedato, pool transitorio.

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
