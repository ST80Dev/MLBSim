# Interfaccia

## Direzione

**"Cuore tattico di SBS, presentazione di OOTP."** Grafica **testuale ma
moderna**: tema scuro, accenti coi colori squadra, tabelle in monospace, rating
colorati (rosso→verde). Testi in **italiano**. **Desktop-first**: la schermata
partita è una plancia a **100% dell'altezza** (niente scroll di pagina; scroll
solo interno a cronaca/recap), con **poco padding e dati espliciti** su schermi
HD. Il mobile non è più un obiettivo (deve solo "non rompersi").

## Stack

React + TypeScript + Vite. La UI **non** è più un solo `App.tsx`: è divisa in
~28 file. `App.tsx` regge lo stato globale (view attiva, save, lega, stagione,
partita) e la navigazione; il resto è modularizzato per settore:

- **Partita** — `game-screen.tsx` (plancia), `game-lineup.tsx` (side lineup +
  fatica), `game-cronaca.tsx` (cronaca compatta), `game-actionbar.tsx` (tattiche),
  `game-submodal.tsx` (sostituzioni), `game-boxscore.tsx`, `game-recap.tsx`,
  `Diamond.tsx` (campo/stadio generato), `commentary.ts` + `scorecode.ts`.
- **Pagine di stagione/gestione** — `pages-start.tsx` (hub salvataggi + StartScreen
  + LeagueOverview + modalità storica), `pages-home.tsx` (dashboard + calendario),
  `pages-roster.tsx` (editor rosa), `pages-standings.tsx` (classifiche + tabellone
  playoff), `pages-leaderboard.tsx`, `trade-screen.tsx` (scambi),
  `rollover-recap.tsx` (riepilogo off-season).
- **Comuni** — `widgets.tsx` + `rating-widgets.tsx`, `player-modal.tsx`,
  `glossary.tsx` (`GLOSSARY`, prima in `App.tsx`), `calibration.tsx` (stadi),
  `format.ts`/`statlines.ts` (helper), `styles.css` (tema, variabili CSS, griglie).

## Schermata partita (plancia stile SBS, 100% altezza)

Regioni, dall'alto in basso:

- **Header** (fuori dallo sfondo stadio, condiviso da tutte le view): brand +
  badge fase, `GameInfoBadge`, badge squadra gestita, e le **tab di navigazione**
  Home / Roster / Lega / Leaderboard / Classifiche / [🏆 Playoff] / Franchigia /
  [Scambi] / 🎯 Stadi / [⚾ Partita]. In partita compaiono le azioni **🎯 Calibra
  campo**, **Recap** e **Salta a fine ⏩** (non c'è più il toggle "Gestisci
  ospite/casa" né le tab "Partita/Rose": la squadra gestita è persistente).
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
  - **Banner di cronaca** (`PlayBanner` + `src/ui/commentary.ts`), overlay in
    **alto-centro** sopra la foto: telecronaca dell'ultima giocata in **2-3 fasi
    sintetiche** (attesa «al piatto…» → sviluppo → **verdetto**), poi svanisce.
    A **tema coi colori** della squadra protagonista (attacco per le battute
    valide, difesa per gli eliminati) e con **intensità crescente** (`tier 0-5`)
    per gli esiti più straordinari: singolo→doppio→triplo→**fuoricampo** in
    attacco, eliminato in gioco→strikeout→eliminato in rubata→**doppio gioco**
    in difesa; più i micro-eventi coi corridori (**lancio pazzo / palla passata /
    balk**) che li fanno avanzare. Un punto segnato alza di un gradino. La categoria arriva dal
    motore via `PlayEvent.kind` (metadato puramente descrittivo, non tocca la
    simulazione né l'RNG). Non interattivo (`pointer-events:none`).
  - **Cronaca laterale** (`CronacaTeam`, angoli **alti** sx/dx per ospite/casa):
    a fine turno la giocata resta **sintetizzata in una riga** (`commentary.logLine`,
    con la stessa varietà narrativa del banner) nella timeline della squadra in
    attacco. Davanti al testo, un **chip col
    codice da segnapunti** (`scoreCode` in `src/ui/scorecode.ts`): `6-4-3 DP`
    (doppio gioco SS→2B→1B), `F7` (eliminato al volo, LF), `K`/`ꓘ` (strikeout),
    `CS 2-6` (eliminato in rubata), `3U` (rimbalzo non assistito in 1ª), ecc.,
    con tooltip esplicativo in italiano. **Il motore non simula ancora la difesa**
    (dove va la palla / quale difensore la gioca): il codice è quindi
    **sintetizzato in modo PLAUSIBILE e DETERMINISTICO** dal `PlayEvent.kind`
    (hash dell'evento, come `commentary.ts`) — descrittivo, non un dato del
    motore, **niente RNG, determinismo invariato**. Quando la difesa sarà
    simulata (fase futura) i ruoli reali sostituiranno la sintesi senza cambiare
    la UI. Coperto da test (`src/ui/__tests__/scorecode.test.ts`).
  - **Varietà narrativa pesata sulle frequenze MLB** (`commentary.ts`): banner e
    log laterale hanno **4-5+ modi diversi** per lo stesso esito, scelti in modo
    **deterministico** (hash dell'evento, niente RNG). Due sorgenti di sottotipo:
    - **Valide e strikeout** (il motore non dice *com'è* la battuta): un
      **sottotipo pesato** sul mix reale MLB — singolo a terra/in linea/bloop/
      interno (46/34/13/7), doppio gap/linea/muro/angolo (42/26/18/14), strikeout
      a vuoto/guardato (72/28), più HR netto/profondo/di un soffio. Su tante azioni
      la *distribuzione dei testi* rispecchia il gioco reale.
    - **Out su palla in gioco**: la forma NON è inventata — viene dalla **verità
      del motore** `inPlayOutShape(ev)` (`ev.outInfo.ball`: rimbalzo/volata/presa);
      il testo varia solo la resa. Così banner, log laterale e codice da segnapunti
      restano **coerenti** fra loro e con gli avanzamenti reali dei corridori.
    Test: `src/ui/__tests__/commentary.test.ts` (determinismo, convergenza ai pesi,
    coerenza con `outInfo`).
    - **Coerenza cronaca ↔ codice.** Per l'out su palla in gioco (`inplayout`)
      la categoria (rimbalzo / volata / presa) NON è più scelta due volte in
      modo indipendente: viene da un'unica fonte, `inPlayOutShape(ev)` in
      `commentary.ts`, usata sia dal verdetto del banner sia dal codice. Così
      non capita più "out in prima" (rimbalzo) con un codice di volata `F8`.
    - **Testate d'inning impilabili.** Testate (`cr-inhead`) ed eventi sono
      figli **diretti** di `.crt-body`: ogni testata è `position: sticky` con
      `top = --crh * indice`, così scorrendo gli inning passati collassano alla
      loro testata e queste si **accumulano fisse** in cima (1°/2°/3°…). Se
      restassero annidate in un box per-inning scorrerebbero via una per volta.
  - **Marker sulle basi a rivelazione ritardata.** I marker del diamante (basi +
    corridori) NON si spostano appena eseguito il turno: si aggiornano al
    **verdetto** della telecronaca di quel turno (callback `onReveal` dal
    `PlayBanner`, sincronizzata con l'ultima fase). Così non si vede il corridore
    già in base prima di averne letto l'esito. Fuori dalla telecronaca (ripresa
    partita, quick-sim, cambio) i marker si allineano subito. Stato in `App`
    (`shownField`), passato a `Diamond`/`BaseDiamond`; il motore e i controlli
    restano sullo stato reale (`sit`), solo i marker sono in ritardo.
  - **Lineup** delle due squadre negli **angoli in basso** (ordine + stat live,
    battitore corrente evidenziato, lanciatori usati in pedana). Il riquadro
    lanciatori elenca **ogni lanciatore impiegato** (il partente con tag `LANC.`,
    i rilievi con `↳`), ciascuno con **IP / PT / BF / SO / ER**: **PT = stima
    lanci** (`estimatedPitches`, formula di Tango `3.3·BF + 1.5·SO + 2.2·BB`) —
    stima DETERMINISTICA (nessun RNG, nessun impatto sulla calibrazione) che cresce
    con battitori affrontati, valide, BB e SO, così si percepisce l'affaticamento.
    **BF = battitori affrontati / Resistenza** (`pl.bf` / `pitcher.stamina`): è il
    **raffronto esplicito** sulla durata sul monte, ancorato alla *vera* meccanica
    del motore (l'affaticamento va a battitori, non a lanci). Sia PT sia BF virano
    all'**ambra** quando i battitori si avvicinano/superano la soglia di Resistenza
    (malus ai peripherals attivo) e al **rosso** oltre la soglia di cambio
    automatico (Resistenza +4 SP / +2 rilievo), via `pitcherFatigue`.
  - **Comandi del turno** in **basso-centro**, in **una sola riga compatta**:
    in attacco Battuta / Bunt / **Squeeze** e **Cerca fly** (se corridore in 3ª e
    <2 out) / Ruba / **Hit & Run** (se corridore in 1ª e 2ª libera)
    / **Pinch-hit** /
    **Pinch-run** (se c'è un corridore); in difesa Lancia / Base int. /
    **Interni dentro** (se corridore in 3ª e <2 out) / **Interni a DP** (se
    corridore in 1ª e <2 out) / **Difendi le righe** (anti-extrabase) /
    **Cambio lanc.** / **Cambio dif.** I bottoni difensivi di posizionamento sono
    *toggle* (evidenziati quando attivi) e si resettano a fine mezzo-inning.
    Il bottone **Lancia** ora passa da `cpuOffenseTurn`: la CPU può fare
    *small-ball* (rubare/buntare/hit-and-run) secondo doti e situazione.
  - **Sostituzioni — modale in stile roster** (`SubModal`). I vecchi menu a
    discesa (nascosti dietro la barra) sono sostituiti da un **popup ad hoc** che
    mostra il pool giusto con **OVR e caratteristiche** (come una mini-scheda
    roster) e i nomi cliccabili aprono la scheda giocatore:
    - **Pinch-hit** (`pinchHit`): panchina → battitore corrente.
    - **Pinch-run** (`pinchRun`): scegli il corridore in base → panchina.
    - **Cambio lanc.** (`changePitcher`): bullpen (rilievi disponibili).
    - **Cambio dif.** (`substituteFielder`): scegli il difensore che esce →
      panchina. Il sostituto eredita lo **slot in battuta**, ma **non** la casella
      difensiva.
    Cambio lanciatore e difensore sono disponibili **per tutta la fase difensiva**
    (non solo appena prima del lancio). Le sostituzioni non consumano il turno.
    - **Riallineamento difensivo automatico** (`realignDefense` in
      `engine/positions.ts`): dopo **ogni** sostituzione (pinch-hit / pinch-run /
      cambio difensivo) la difesa è **riorganizzata** perché ognuno giochi un ruolo
      che **sa coprire** (naturale o secondario), col minimo di spostamenti — niente
      più "ricevitore all'interbase" perché il subentrante ha ereditato la casella
      di chi esce. Il subentrante va al suo ruolo, i compagni si spostano per
      coprire; gli spostamenti compaiono in cronaca ("Riassetto difensivo: …").
      **Deterministico** (niente RNG), solo gioco interattivo → calibrazione intatta.
    Motore in `engine/game.ts`; test in `engine/__tests__/live.test.ts` e
    `engine/__tests__/positions.test.ts`.
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

**Cognomi in MAIUSCOLO**: ovunque compaia un nome di giocatore (lineup, campo,
cronaca, roster, schede, sostituzioni…) il **cognome** è reso in maiuscolo per
riconoscerlo a colpo d'occhio (es. "Aaron VISSER", "O. LEWIS"). Helper di
presentazione `upperLast` (`format.ts`) applicato ai punti di render (in primis
`PlayerLink` e le etichette del `Diamond`); la cronaca lo eredita da `shortName`
nel motore. Solo visuale: i nomi nei dati/motore restano invariati.

**Toggle stat** (`StatsToggle`): **Partita** (dato reale) · **Stagione**
(proiezione dalle doti, `player.stats`, ~650 PA / 1000 BF) · **Scorsa** (storico
dell'anno precedente, ora popolato dal rollover di Fase 4/5). Ogni blocco ha il
**proprio** `StatsMode` indipendente: la barra stat per lato, le due liste in
`LineupSide` e il `RecapModal` non condividono lo stato. Le righe sono calcolate
in `src/ui/statlines.ts`.

**Recap partita** (`RecapModal`): popup quasi a tutto schermo con line score e
**box score completo** di entrambe le squadre (battuta + lancio, V/P/SV), col
toggle stat. Chiudibile con ✕, click fuori o Esc.

### Mini-popup giocatore (Fase 3, `PlayerModal`)

Scheda compatta e **riusabile**, apribile da **qualsiasi nome cliccabile** in
tutta l'interfaccia (`.player-link`). Filosofia coerente col progetto:
manageriale/minimal, niente grafica pesante stile MLB 2K. Riusa le classi modale
esistenti (`.modal-backdrop` / `.modal` / `.modal-head` / `.modal-close`) con una
variante compatta `.modal.player` (max ~560px).

- **Contenuto.** Intestazione (nome, ruolo/i, età, stipendio, overall + `<Stars>`
  colorato); **RATING DEL MOMENTO** colorati (`ratingColor`) in una griglia di 6
  chip — battitore **CON/POT/OCC/VEL/DIF/BRA** (la **DIF** è il fielding **alla
  posizione occupata**, via `ratingsAtPosition`), lanciatore
  **DOM/CTR/MOV/PAT/RES/DIF**; una tabellina STAT con riga **«Stagione»** REALE
  (`season.bat[id]`/`season.pit[id]` → `seasonBatLine`/`seasonPitLine`) e riga
  **«Carriera/Storico»** derivata dai rating (backstory, via
  `projectBatterSeason`/`projectPitcherSeason`), con nota che lo storico reale si
  comporrà col rollover di stagione (Fase 4). Chiudibile con ✕, backdrop o Esc.
- **Distribuzione.** Per non passare callback attraverso tutta la gerarchia, un
  **Context** (`PlayerModalContext`) espone `openPlayer`; `App` monta il modale
  **una volta sola** coi `season`/`seed` correnti. Il wrapper `<PlayerLink>` è
  uno `span` (mai `draggable`) così **dentro le righe trascinabili del roster il
  drag continua a funzionare** e il click apre la scheda (`stopPropagation`).
- **Dove sono cliccabili i nomi.** Roster: tabelle Lineup e Difesa (per-posizione
  + riserve/disponibili), righe lanciatori e caselle del campo (`.fpos-name`); in
  partita: pannelli `LineupSide` (`.bname` + lanciatore in pedana) e giocatore
  coinvolto nella barra stat (`.ts-pname`); Leaderboard (righe); Home (card
  Leader). Solo UI: **non tocca il motore né l'RNG** (determinismo invariato).

- **Scheda "Rose & caratteristiche"**: doti 40-100 colorate per lineup e rotazione,
  con OVR a stelle e lo scambio difensivo (seconda posizione).

### Editor schieramento — drag&drop (Roster)

Regola unica: **muovere dentro la stessa ripartizione è uno SWAP** (i due si
scambiano di posto, gli altri restano fermi — mai inserimento a scorrimento);
**passare fra ripartizioni è una sostituzione/spostamento**.

- **Battuta / Difesa titolari.** Trascinare un titolare su un altro **scambia**
  i due slot: nell'ordine di battuta scambia i numeri (la difesa resta), nella
  vista difesa scambia le caselle (`setSlot`). Un **titolare trascinato su una
  riserva** lo **scarica** (swap titolare↔riserva, tiene la casella;
  `substitute`), valido sia dalla lista battuta sia dalla difesa
  (`dropBenchRow` accetta qualunque id attualmente in `arr.order`).
- **Riserve.** Una **riserva su un'altra riserva** le **riordina**: l'ordine
  scelto è persistito in `MatchArrangement.benchOrder` (id preferiti in testa,
  gli altri in coda via `orderByPref`). Campo **opzionale**, ignorato dal motore
  (`buildManagedTeam`/`validateArrangement` non lo usano) e retrocompatibile coi
  salvataggi che ne sono privi; un titolare appena scaricato finisce in coda.
- **Lanciatori.** Riordino dentro Rotazione o Bullpen = **swap**; il drop fra
  Rotazione / Bullpen / Disponibili resta uno **spostamento** (il numero per
  lista è variabile: nessuna casella fissa), `placePitcher` distingue i due casi
  da `drag.from` vs lista di destinazione.

### Colonne OVR bar e MAX (prospettiva "nebbiosa")

Ogni elenco del roster ha, subito dopo la colonna **OVR**, due **colonne
dedicate a larghezza fissa** (allineate verticalmente riga per riga — niente
info impilate nella stessa cella, quindi zero disallineamenti):

- **Barra OVR** (`OvrBarCell`/`OvrBar`, header vuoto): riempimento colorato =
  overall corrente (`ratingColor`); se c'è **upside**, il tratto fino al bordo
  **alto della fascia stimata** (`hi`, *non* il potenziale esatto) resta come
  segmento più chiaro = *spazio di crescita*. Scala 40-100 → 0-100% (`ratingPct`).
- **MAX** (`PotCell`): **non mostra più il potenziale nudo** (svelava il futuro).
  Al suo posto una **fascia direzionale "da scout"** (`growthOutlook`), stabile
  per giocatore (seed sull'id) ma volutamente imprecisa — vedi
  `docs/players-and-ratings.md` § *Nebbia di scouting*:
  - **giovane con margine** → `▲lo-hi` verde (la fascia *contiene* il potenziale
    vero senza rivelarlo; si allarga con gioventù e margine);
  - **picco / nessun margine** → **numero secco** dell'OVR in grigio neutro;
  - **veterano (> 30)** → `▼lo-hi` ambrato, **inferiore all'attuale** (declino
    stimato dalla curva d'età): la tensione è "quanto in fretta cala?".
  Formato distinto dal badge OVR (niente pill piena, più piccolo) per non
  confonderlo a colpo d'occhio. NB: l'etichetta è `MAX`, non `POT`, perché in
  modalità *Caratteristiche* `POT` è già la **Potenza** del battitore.

Presente in tutti gli elenchi (Ordine di battuta, Disponibili, Per posizione,
Riserve, tabelle lanciatori); l'overall usato è quello della riga (in Difesa è
rivalutato sulla casella via `ratingsAtPosition`, come il badge). La **posizione
secondaria** non ha una colonna propria: è già nella colonna **RUOLI**
(`rolesOf` → `SS/3B`). Fuori scope il menu Pinch-hit in partita.

**Ordine colonne**: `# · Giocatore · ETÀ · RUOLI · OVR · barra · MAX · stat…`
(l'età sta **a sinistra** del ruolo).

### Larghezza tabella e celle rating

Le card colorate dei rating (`.rat`) hanno **larghezza fissa** (~34px, quasi
quadrate) scoped a `.roster-tbl`. La tabella NON si stira più a tutta larghezza:
`.roster-tbl { width:auto; margin-inline:auto }` la dimensiona sul **contenuto**
e la **centra** nel contenitore — così su desktop largo non resta un enorme vuoto
fra i nomi e le stat, e la tabella è sempre centrata (con molte colonne, se
supera il contenitore, `.roster-scroll` scrolla). La colonna **Giocatore** è a
larghezza-contenuto (non più `width:100%`).

### Legenda sigle (icona «i»)

A fianco della testata di ogni tabella del roster c'è un'iconcina **`i`**
(`InfoDot`) che apre un modale-legenda (`StatLegend`) con la spiegazione delle
sigle **di quella sezione**: attacco (`bat`), difesa (`def`) o lancio (`pit`).
Fonte unica `GLOSSARY` (in `src/ui/glossary.tsx`): per ogni voce distingue **doti** (rating
40-100, descrizione = *su cosa influiscono* nel motore, allineata a
`docs/players-and-ratings.md`) e **statistiche** (descrizione = cosa
rappresentano). Copre sia la modalità *Ratings* sia le modalità statistiche,
così una sola «i» per sezione basta a chiarire tutte le colonne visibili.
Chiudibile con ✕, backdrop o Esc, come gli altri modali. Se aggiungi/rinomini
una colonna (`*_COLS`), aggiorna la voce corrispondente in `GLOSSARY`.

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

### Schermata dedicata «🎯 Stadi» (calibrazione fuori partita)

Con il calendario (niente più partite casuali "al volo") non si può più contare
sul giocare una gara in ogni stadio per calibrarlo. Il tab **🎯 Stadi** apre una
**schermata dedicata** (`CalibrationScreen`) che permette di calibrare
**qualsiasi stadio** senza scendere in campo.

- **Plancia identica al match.** La schermata riusa lo **stesso** componente
  `GameScreen` della partita (statbar + campo + riquadri lineup/cronaca + barra
  controlli) su una **partita "mock"** (`createLiveGame`, seme fisso, mai fatta
  avanzare). Così la foto e i marker appaiono con **la stessa cornice e le
  stesse proporzioni** che si vedranno in gara: ciò che calibri è ciò che
  comparirà, senza rischio di doverlo rifare.
- **Selettore di stadio/foto** in cima al pannello (`<select>`): elenca **tutte**
  le foto presenti nel repo — principale **e doppioni** (`<ID>2.jpg`,
  `<ID>3.jpg`… come *Alt 2 / Alt 3*, rilevati provando a caricarli). Sceglierne
  una **carica la sua calibrazione** (`getCalibrationFor`, stem-specifica) e la
  esporta a sé (`<STEM>.json`): così **ogni doppione si calibra separatamente**.
  Anche i chip *Principale/Alt* del pannello passano per lo stesso caricamento.
- **Parte già in piazzamento manuale.** Se la calibrazione non ha marker manuali
  li **semina dalla proiezione** (`withManualMarkers`), così si trascina subito.
- **Nomi campione** (dai roster) su corridori e battitore, per posizionarne le
  etichette anche a basi vuote.
- **Sposta tutti in blocco** (croce ▲◀▼▶): trasla **tutti** i marker insieme
  mantenendo le distanze, utile se cambia l'inquadratura della foto.
- **🔒 Blocca marker alla foto** (default attivo): a marker manuali presenti,
  ogni **zoom/pan** dello sfondo **ri-aggancia** i marker alla foto
  (`relockMarkers`), così restano incollati proporzionalmente invece di "sfilarsi".

Stessa **persistenza** del resto (**Esporta file → `<STEM>.json`**). Il tab è
**bloccato durante una partita live**. Il vecchio pulsante **🎯 Calibra campo**
dell'header resta disponibile *in Partita* (stesso `CalibrationPanel`).

### Sfondo-stadio variabile in partita

Ad ogni gara lo sfondo dello stadio di **casa** varia tra le foto **calibrate**
disponibili (principale + doppioni con file JSON): `calibratedVariants(homeId)`
elenca solo quelle già allineate — così i marker restano coerenti — e la scelta
è **deterministica per-partita** (indice dal `gameSeed`), quindi stabile nella
gara ma diversa tra una gara e l'altra. Con una sola foto calibrata resta quella;
senza nessuna, si usa la calibrazione di default. Le varianti **non ancora
calibrate** non entrano nella rotazione (si mostrano solo dopo averle sistemate
nella schermata 🎯 Stadi).

### Calibrazione del campo sulla foto (🎯 Calibra campo)

Le foto reali sono scattate da angolazioni diverse, non perfettamente in asse
con casa base. Il pulsante **🎯 Calibra campo** (header, in Partita) e la
schermata **🎯 Stadi** aprono un **pannello live** (`CalibrationPanel`) che
ri-proietta i marker tenendo **casa base come perno**. Parametri
(`src/data/stadiumCalibration.ts`):

- `homeX`/`homeY`: posizione di casa base (perno).
- `spreadX`/`depthY`: larghezza e profondità dei marker.
- `ofDist`: **distanza interni↔esterni** — scala la profondità oltre gli angoli
  (tiene ferme 1ª/3ª e monte, avvicina 2ª/SS ed esterni). `<1` schiaccia.
- `rotation`: **rotazione dell'asse** casa base–2ª–CF attorno a casa base (in
  gradi). `>0` inclina l'asse a destra: **1ª e RF si allungano verso destra** e
  **3ª e LF salgono** (e viceversa) — l'intero diamante ruota coerentemente per
  seguire un campo storto in foto. A piccoli angoli è un tilt dell'asse, non un
  giro. Range ±30°.
- `fan`: apertura prospettica (i marker lontani si allargano di più).
- `bgZoom`/`bgX`/`bgY`: zoom e pan della foto di sfondo. La foto è mostrata
  **intera** (`meet`, mai ritagliata): con zoom e pan si porta in campo qualsiasi
  parte (anche casa base ai bordi). Range ampi per foto molto larghe o alte.
- `image` (opzionale): **variante-foto** scelta. Il pannello rileva
  automaticamente le foto alternative presenti nel repo (`<ID>.jpg`,
  `<ID>2.jpg`, `<ID>3.jpg`, … — provate via `onload`) e mostra dei chip
  **Principale / Alt 2 / Alt 3**: selezionandone uno cambia lo sfondo live e
  salva il percorso in `image`. Se assente si usa la principale `<ID>.jpg`.

### Piazzamento manuale dei marker (✋)

Alternativa ai parametri: nel pannello, **«✋ Piazza marker a mano»** entra in
modalità manuale. Si fissa prima la foto (zoom/pan), poi si **trascinano i 14
marker** direttamente sulla foto — 9 difensori (P, C, 1B, 2B, SS, 3B, LF, CF,
RF), 3 basi (1ª/2ª/3ª), casa base e battitore (il monte segue P). Le posizioni
si salvano in `cal.markers` (coord. assolute nel viewBox 900×420) e finiscono
nel file `<STEM>.json` via **Esporta file**; se presenti, hanno la **precedenza**
sulla proiezione parametrica. «↩︎ Torna ai parametri» le rimuove. Convenzione
anti-sovrapposizione: etichette difensori **sopra**, basi/runner **sotto**.
Durante il drag i pannelli laterali sono non-interattivi (`.gamefield.editing`).

**Etichette-nome su basi e battitore.** Oltre ai 9 difensori (che hanno già
l'etichetta col ruolo+cognome), anche i **3 marker delle basi** e il **marker
del battitore** (casa base) portano un'**etichetta col nome**, agganciata al
marker: si sposta **insieme** ad esso nel drag (come i difensori). Sotto la
base compare il cognome del corridore, sotto il battitore quello di chi è alla
battuta. In partita l'etichetta del corridore appare **solo se la base è
occupata** (il motore espone `LiveSituation.baseRunners`); in calibrazione (e
nella schermata **🎯 Stadi**) sono sempre visibili — con nomi campione — per
poterle posizionare. Il `Diamond` riceve i nomi via le prop `runners` (basi) e
`batterName`.

**Default dedicato alle foto**: gli stadi con foto partono da
`PHOTO_DEFAULT_CALIBRATION` (casa base più in alto e esterni un po' compressi),
perché quasi tutte le foto — viste da dietro casa base — hanno quel taglio; così
non si rifanno gli stessi aggiustamenti a ogni stadio. Il **campo generato**
(squadre senza foto) usa invece l'**identità** (`DEFAULT_CALIBRATION`): il
Diamond applica la calibrazione solo sopra una foto reale, mai al campo
generato. «Azzera» riporta al default-foto (mantiene la foto scelta).

Il pannello mostra il valore live, ha slider con stepper −/+ e
produce il **JSON** da incollare in `STADIUM_CALIBRATION` (una voce per stadio,
chiave = ID franchigia). «Azzera» reimposta la geometria ma **mantiene la foto
scelta**. È **solo UI**: non tocca il motore.

**Persistenza = repository, via file per-foto.** La calibrazione non usa storage
del browser. Il pulsante **«⤓ Esporta file»** scarica un JSON **nominato come la
foto** (`<STEM>.json`, es. `BAL.json`, `SFG3.json`): si mette in
`src/data/calibrations/` e si committa. I file vengono **impacchettati al build**
(`import.meta.glob` in `stadiumCalibration.ts`) e applicati al deploy, **senza
modifiche al codice**. Per uno stadio, se esistono più file, vale il primo tra
`<ID>.json`, `<ID>2.json`, … In alternativa resta l'override inline in
`STADIUM_CALIBRATION`. La calibrazione è **per foto** (include il campo `image`).

## Pagine di stagione e gestione (Fasi 2/4/5)

Oltre alla schermata partita, la UI è un'app a **view** commutate dall'header:

- **Avvio & salvataggi** (`pages-start.tsx`): hub multi-slot (lista salvataggi
  Supabase), `StartScreen` (nuova lega **generata** / **storica** in anteprima /
  riprendi) con **picker d'annata** sulla card storica (1997-2010), e
  `LeagueOverview` (30 squadre per division con forza `teamStrength` e indicatore
  payroll-vs-cap; dettaglio rosa in modale) → scelta della squadra gestita.
- **Home / dashboard** (`pages-home.tsx`): stato stagione, **calendario a serie**,
  prossima partita, accesso a gioca/quick-sim del giorno.
- **Roster** (`pages-roster.tsx`): editor rosa a linguette Fielders/Pitchers,
  **drag&drop** (ordine/ruoli/panca), tabelle stat con toggle Stagione/Scorsa/
  Storico/Caratteristiche, colonne riposo/parte per la rotazione.
- **Classifiche & Playoff** (`pages-standings.tsx`): record di division reali e,
  in postseason, il **tabellone** a 12 squadre + celebrazione campione.
- **Leaderboard** (`pages-leaderboard.tsx`): Batting/Pitching, numeri reali per la
  mia squadra e **proiezione** d'annata per le altre 29.
- **Franchigia**: monte-ingaggi, indicatore cap a due confini, valore rosa.
- **Scambi** (`trade-screen.tsx`): tab aperta in stagione fino alla trade deadline;
  proponi a una CPU, `evaluateTrade` decide live, `applyTrade` ricompone le rose.
- **Riepilogo off-season** (`rollover-recap.tsx`): a campione deciso, il modale
  `RolloverRecap` mostra ritiri/draft/mercato del passaggio all'anno successivo.

## Prossimi passi UI

- **Fase 5B**: off-season **interattiva a blocchi** (oggi il rollover è automatico
  col recap; il motore `advanceBlock`/`humanRelease`/`humanSign` c'è, l'UI dei
  blocchi no); aggancio UI del **pool free agent** e del **draft**.
- **Fase 3 (rifinitura)**: card giocatore più ricche e ulteriori pannelli in stile
  SBS/OOTP. Fatti: etichette giocatori sul campo, **mini-popup giocatore**
  cliccabile ovunque (vedi «Mini-popup giocatore»), cronaca a fasi + micro-eventi.

## Regole di stile

- La schermata partita sta in **100% dell'altezza**: header + barra stat auto,
  campo `flex:1`; overflow interno solo dove serve (cronaca, recap, angoli).
- **Poco padding, dati espliciti**, font leggibili con peso adeguato: la plancia
  è pensata per uno schermo desktop HD.
- Colori accento derivati dai colori squadra.
