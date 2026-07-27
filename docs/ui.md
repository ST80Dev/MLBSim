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
    a fine turno la giocata resta **sintetizzata in una riga** (`PlayEvent.text`)
    nella timeline della squadra in attacco.
  - **Lineup** delle due squadre negli **angoli in basso** (ordine + stat live,
    battitore corrente evidenziato, lanciatore in pedana).
  - **Comandi del turno** in **basso-centro**, in **una sola riga compatta**:
    in attacco Battuta / Bunt / Ruba / **Mob & corri** (hit-and-run, se corridore
    in 1ª e 2ª libera) / **Pinch-hit** (menu panchina); in difesa Lancia / Base
    int. / **Interni dentro** (se corridore in 3ª e <2 out) / Cambio lanc.
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

## Prossimi passi UI (Fasi 1+/3)

- **Rifinitura Fase 1**: pulsanti per Hit-and-run, Pinch-hit (menu panchina) e
  difesa avanzata (interni dentro).
- **Fase 3**: campo con etichette giocatori posizionate ✓, **mini-popup
  giocatore** cliccabile ovunque ✓ (vedi «Mini-popup giocatore»). Restano card
  giocatore più ricche e ulteriori pannelli in stile SBS/OOTP.

## Regole di stile

- La schermata partita sta in **100% dell'altezza**: header + barra stat auto,
  campo `flex:1`; overflow interno solo dove serve (cronaca, recap, angoli).
- **Poco padding, dati espliciti**, font leggibili con peso adeguato: la plancia
  è pensata per uno schermo desktop HD.
- Colori accento derivati dai colori squadra.
