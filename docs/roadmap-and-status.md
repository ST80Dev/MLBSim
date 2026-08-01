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
  - Tattiche **complete**: in attacco Swing / Bunt di sacrificio / **Squeeze**
    (bunt suicida col corridore in 3ª) / **Cerca fly** (volata di sacrificio dalla
    3ª) / Rubata / **Hit-and-run** / **Pinch-hit** (panchina); in difesa cambio
    lanciatore manuale / base intenzionale /
    **interni dentro** / **interni a doppio gioco** / **difendi le righe**
    (anti-extrabase). Le tre difensive sono *toggle* di posizionamento.
  - **AI tattica della CPU (small-ball)**: nel gioco interattivo la CPU può
    rubare / cercare il fly (punto dalla 3ª) / buntare / hit-and-run secondo doti
    e situazione (`cpuOffenseTurn`).
    **Solo turni interattivi**: `autoStep`/`quickSim` restano *swing puro* →
    Fase 0 e sim di lega invariate (guardia nel test `tactics.test.ts`).
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

- **Fase 2 — Costruzione squadra & import storico: COMPLETA.**
  - Editor rosa con **UI drag&drop**, **foglio partita** che entra nella
    simulazione, **squadra gestita persistente**, **persistenza Supabase**,
    **import storico** end-to-end (inversione stat→rating) con **pipeline Lahman
    completa: le 30 rose reali 1999 cablate nella modalità storica** e
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
  - **Pipeline Lahman — FATTO:** `scripts/build-historical.mjs` genera
    `data/historical/season<ANNO>.ts` (rose reali) dal Baseball Databank; la
    modalità storica ora costruisce la lega da quelle rose
    (`data/historical/league.ts`, `buildHistoricalLeague`) invece che
    procedurale. Dettaglio sotto.
  - **Annate multiple giocabili — FATTO:** importate **1997, 1998, 1999, 2000,
    2001, 2003** (`HISTORICAL_SEASONS` / `HISTORICAL_YEARS`) — le annate-gemma
    2001 (Bonds 73 HR, RJ 372 K) e 2003 (Pujols breakout, Gagné 55/55) confermano
    che le doti-firma si saturano (pow/eye 100) mentre l'OVR resta una media
    piatta (Bonds OVR ~82-86) — selezionabili dalla schermata
    iniziale (picker d'annata sulla card storica). Il 1997 è a **28 squadre**
    (Arizona e Tampa Bay debuttano nel 1998): la lega tollera l'organico ridotto
    (calendario con pad/trim a 162, division 4×). Ogni annata ha la sua finestra
    Marcel (es. il 2000 usa 2000/99/98) e il suo pool free agent. La lega storica
    è costruita da `season.year` (fissato all'avvio, persistito nel salvataggio).
    L'alias `ML4→MIL` copre Milwaukee pre-1998 (teamID Lahman storico).
  - **Dedup + identità stabile — FATTO:** ogni giocatore reale compare UNA volta
    (niente doppioni in classifica né tra le rose), con `id` = playerID Lahman
    (identità stabile negli anni). I giocatori con spezzoni su più squadre sono
    assegnati alla squadra di **max minutaggio** con le stat di **tutta la
    stagione** (rating dal campione più ampio); gli scambiati-cardine sono ~5 in
    tutta la lega. Gli esclusi dalle rose confluiscono nel **pool free agent**
    (`data/historical/freeAgents1999.ts`) — dati pronti per il mercato/draft di
    Fase 5 (aggancio UI ancora da fare). Gli omonimi reali (playerID diversi)
    restano correttamente distinti.
  - **Stima rating multi-annata — FATTO:** l'abilità NON si stima da una singola
    stagione (che ingabbierebbe un giocatore in un'annata storta o pre-sbocciatura)
    ma da una **finestra Marcel anno-dominante 3/2/1** (anno di gioco + due
    precedenti, pesati anche per minutaggio, riscalati sul minutaggio dell'anno di
    gioco). Un ROOKIE senza pregresso ricade sul solo anno di debutto. Sopra ci
    sono: **regressione per campione** (i micro-campioni — rilievi da pochi BF,
    panchinari da poche PA — tornano verso la media: niente più sconosciuti sopra
    gli assi) e un **boost horse × qualità (FIP)** per i partenti: il carico è il
    **max(volume totale, profondità per partenza in BF/GS)**, così un asso che va in
    fondo (Halladay: 7+ IP/start) resta valorizzato anche in una stagione ACCORCIATA
    DA INFORTUNIO — si premia la durata reale, non le partite saltate. La finestra guarda SOLO il
    passato: **nessuna preveggenza** (il potenziale resta una stima cieca; non sai
    in anticipo chi diventerà campione — vedi `players-and-ratings.md`).

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
    Dataset completo (`data/historical/season1999.ts`, 30 rose reali generate
    dalla pipeline Lahman; fixture curate CLE/BOS in `__tests__/fixtures.ts` per i
    property test) + importatore (`data/historical/import.ts`, con panca/riserve e
    `autoLineup`) costruiscono squadre pronte al motore con **stats ri-derivate dai
    rating stimati**. Nomi
    reali separati nome/cognome (`engine/names.ts`); **potenziale stimato**
    all'import (`projectPotential`) con code bust/breakout in `aging.ts` (lo
    sviluppo futuro dal seed NON replica la realtà). Verifica: round-trip fedele,
    i **campioni** escono campioni e gli **scarsi** affondano, aggregati
    closed-loop nell'epoca. **UI di selezione dell'annata — FATTO:** picker
    1997/1998/1999/2000 sulla card storica (default 1999).
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
  - **FATTO:** **calendario a SERIE** (10 prestagione + 162 regular + slot playoff,
    `data/schedule.ts`): la regular season è organizzata in **serie di 2-4 gare
    consecutive (~3)** contro lo stesso avversario, stessa sede per l'intera serie
    — e nella serie l'**avversario AI ruota i partenti** giorno per giorno
    (`withRotationStarter` + sfasamento per-squadra `rotationPhase`: ogni squadra
    cicla i suoi 5 SP in modo indipendente); **stagione a stati** (`data/season.ts`)
    che accumula i
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
  - **FATTO (playoff giocabili):** postseason moderna a **12 squadre** (6 teste
    per lega: 3 campioni division + 3 wild card) — **Wild Card bo3** (teste 1-2 in
    bye) → **Division Series bo5** → **Championship bo7** → **World Series bo7**,
    fino al **campione**. L'utente gioca **partita per partita** le serie della
    propria squadra; le altre serie sono **quick-simulate** (come il resto della
    lega in regular season). Seeding dai record reali, bracket fisso, fattore campo
    alla testa di serie più alta (record per la WS). Motore di stato puro in
    `data/playoff.ts` (nessuna modifica al motore di gioco), UI **tabellone**
    (`PlayoffPage`) + celebrazione campione, stat di playoff in un **bucket
    separato**, persistenza nel save (`playoff?`). **Rotazione accorciata nei
    playoff**: riposo del partente ridotto a **2 gare** (`PLAYOFF_REST_STARTER`,
    sul modello riposo-per-uso di `rotation.ts`), così l'asso può lanciare Gara 1 e
    Gara 4. Test in `data/__tests__/playoff.test.ts`.
  - **Rollover di stagione** (stagione → anno successivo, con aging): **motore
    FATTO** in Fase 5A step 6 (`rollover.ts`/`offseasonRun.ts`). L'**aggancio UI**
    (trigger a fine postseason + persistenza schema v3) è il passo 5B. Il **fattore
    stadio** è **fuori scope** per scelta (non serve a questo livello). Il seam
    `perf=0` dell'aging resta neutro finché l'impiego reale non lo alimenta.
- **Fase 5 — Franchigia (gestione leggera)** *(pianificata; 5A avviabile ora)*
  - Vedi `docs/franchise.md`: stipendi annuali, salary cap, scambi a valore, draft
    semplice. Fondazione modalità/cap già presente (vedi Fase 2).
  - **Split 5A/5B** (vedi `docs/franchise.md § Piano di esecuzione`): il layer
    franchigia è **quasi tutto logica pura** e si sgancia dalla Fase 4 grazie alla
    cucitura `advanceSeasonBatter/Pitcher(…, perf = 0)` (segnale d'impiego oggi
    neutro, collegabile al `perf` reale a rollover Fase 4 pronto).
  - **5A — motore franchigia (puro, testabile, NIENTE dipendenza da Fase 4):**
    1) `playerValue` (atomo scambi+cap, `engine/value.ts`) — **FATTO**;
    2) cap enforce + ε seedato (`leagueMode.ts`: `capOverageMargin`/`effectiveCap`/
    `overEffectiveCap`) — **FATTO**; 3) mercato off-season a **blocchi**
    (`offseason.ts`): rilasci/firme intrecciati AI+utente + pool reattivo + gate cap
    + **riallineamento AI↔AI** (scambi 1-per-1 stesso valore, fit posizionale,
    cap-legali, bounded) — **FATTO**. Rilascio da cap: si cede il più **caro tra gli
    espendibili** (metà inferiore per valore), non lo scrub economico → sollievo di
    cap reale, riconciliazione a senso unico verso il basso;
    4) draft inverso (`draft.ts`: classe prospetti giovani/grezzi deterministica,
    ordine inverso alla classifica, BPA per `playerValue`, immessi nella **depth**)
    — **FATTO**; 5) valutazione scambi umano→1 AI (`trades.ts`: `evaluateTrade` — equità di
    `playerValue` + cap-legalità bilaterale sul tetto **effettivo** + **premio di
    consolidamento** per gli slot roster finiti) — **FATTO**;
    6) `runOffseason` (perf=0) + **finalize/reslot** — **FATTO**: `assembleTeam`
    (reslot delle rose piatte in lineup/rotazione/depth, riempimento a taglia coi
    replacement), `offseasonRun.ts` (aging+ritiri → draft inverso → mercato a blocchi
    → finalize) e `rollover.ts` (`rolloverSeason`: lega conclusa → anno successivo +
    stagione fresca). Test in `data/__tests__/rollover.test.ts` (validità pluriennale,
    determinismo, muro rispettato).
  - **Cadenza mercato** (decisa): in stagione **solo scambi** umano→1 AI fino alla
    **trade deadline ~gara 103** (`TRADE_DEADLINE_GAME` in `schedule.ts`), poi rose
    congelate; pool FA e riallineamento AI↔AI sono **eventi di off-season**.
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
