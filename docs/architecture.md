# Architettura

## Filosofia dei dati (fondamentale)

```
Caratteristiche (20-80)  ──derive──►  Statistiche di conteggio  ──sim──►  Risultati
   (fonte di verità)                    (input del motore)              (box score, ERA, W…)
```

- Le **caratteristiche** (ratings) sono l'identità del giocatore ed evolvono con
  età/potenziale.
- Da esse si **derivano** le statistiche di conteggio per-PA (rate) che il motore
  consuma. Cambiare una caratteristica → il rendimento si ricalcola da solo.
- I **risultati** (media di una partita, ERA, vittorie) emergono dalla
  simulazione: non sono mai dati inseriti.

## Struttura delle cartelle

- `src/engine/` — **motore puro, nessun import dalla UI**, interamente testabile.
  - `types.ts` — modello di dominio (Batter, Pitcher, Team, ratings, stats…).
  - `constants.ts` — medie di lega (`LEAGUE`) e costanti di calibrazione (`TUNING`).
  - `rng.ts` — RNG deterministico seedabile (mulberry32) + `clamp`.
  - `ratings.ts` — **derivazione** caratteristiche→statistiche, overall, stipendio.
  - `aging.ts` — evoluzione stagionale (crescita/picco/declino/ritiro).
  - `probabilities.ts` — rate battitore/lanciatore + combinazione **Log5**.
  - `atbat.ts` — risoluzione di un turno in un esito grezzo.
  - `game.ts` — **macchina a stati unificata** della partita. Il tipo `LiveGame`
    tiene lo stato completo (inning, mezzo, basi, out, punteggio, lanciatori,
    decisioni). Espone l'API interattiva — `createLiveGame`, `situation`,
    `playOffense` (swing/bunt), `attemptSteal`, `intentionalWalk`,
    `changePitcher`, `autoStep`/`quickSim` — e le tattiche attive in Fase 1
    (rubata, bunt, base intenzionale, cambio lanciatore) con il tracciamento
    **W/L/SV**. `simulateGame` è un wrapper CPU-vs-CPU (`quickSim`) sullo stesso
    codice: l'**ordine dell'RNG per il turno normale è identico** alla Fase 0,
    così i test/calibrazione restano invariati.
  - `boxscore.ts` — righe di tabellino e formattazione (IP, media…), incluse
    `sb`/`cs` del battitore e la decisione (`dec`, `enteredDiff`) del lanciatore.
  - `strength.ts` — forza squadra (TOT/ATT/DIF/LAN) da lineup+bench+staff.
  - `positions.ts` — seconda posizione difensiva: rivalutazione difesa
    (`ratingsAtPosition`) e schieramento a scambi validi (`computeSwap`).
  - `index.ts` — barrel dell'API pubblica.
  - `__tests__/` — test Vitest (determinismo, realismo, cime di eccellenza).
- `src/data/` — generazione procedurale e dati.
  - `generator.ts` — genera giocatori/rose da caratteristiche + franchigie;
    `makeNameFactory` pesca nomi per **origine** (peso ~ demografia MLB). I
    doppioni di cognome **non** sono vietati: capitano in modo casuale e
    occasionale (piu' coi cognomi comuni NA/latini), evitando solo gli eccessi.
  - `franchises.ts` — le 30 franchigie MLB reali (dati fattuali).
  - `names.ts` — pool di nomi per **origine** (`NAME_ORIGINS`: nordamericana,
    latina, giapponese, coreana, varie) con pesi.
  - `stadiumImages.ts` — override opzionale foto-stadio *in locale* (mappa vuota
    di default; nessun asset ufficiale nel repo).
  - `persistence/` — **layer di salvataggio** (Fase 2). `saveStore.ts` definisce
    l'interfaccia `SaveStore` (list/load/save/remove) + il tipo versionato
    `GameSave` e `SCHEMA_VERSION`; `supabaseSaveStore.ts` la implementa su
    Supabase (tabella `saves`, upsert su `slot_name`); `supabaseClient.ts` e
    `supabaseConfig.ts` reggono client e credenziali. L'app importa solo
    `saveStore` da `persistence/index.ts` e **non sa quale backend** c'è sotto.
- `src/ui/` — React: `App.tsx`, `Diamond.tsx` (campo/stadio generato),
  `format.ts` (helper), `styles.css`.
- `src/main.tsx` — entry React.

## Determinismo

Tutta la casualità passa da `makeRng(seed)`. **Stesso seed → stessa partita**
(replay riproducibili, test stabili). In `src/engine` e `src/data` **non usare
mai `Math.random()`**: passare sempre un `Rng`. (Nella UI React `Math.random`
è ammesso solo per generare un nuovo seed.)

## Confini

- Il motore non conosce React. Se serve logica di gioco nuova, va in `src/engine`
  con relativi test, non nei componenti.
- La UI non ricalcola statistiche di gioco: le legge dall'output del motore.

## Persistenza (Fase 2)

Salvataggi su **Supabase** (Postgres gestito), dietro l'interfaccia `SaveStore`.
Decisioni di design **condivise con l'utente** (single-player, gioco personale):

- **Cloud come sorgente primaria.** Nessuna cache locale: il save vive su
  Supabase. (Tradeoff accettato: se il progetto free-tier va in pausa, il
  caricamento non funziona finché non lo si riattiva.)
- **Nessuna autenticazione.** Gioca un solo utente; non c'è login.
- **RLS aperta per scelta esplicita.** La tabella `saves` ha Row-Level Security
  attiva ma con 4 policy permissive (`select/insert/update/delete` per
  `public`). La chiave *publishable* è pubblica nel bundle statico: qui **non**
  si conservano dati sensibili, solo stato di partita. Il DB è quindi un
  archivio personale **non privato** — tradeoff accettato in cambio di zero
  attrito.
- **Save versionato.** Ogni record ha `schema_version`; il payload (`GameSave`)
  crescerà fase per fase (lineup/rotazione → stagione → franchigia), quindi la
  versione serve a **migrare** i vecchi salvataggi invece di romperli.
- **Config.** URL e chiave stanno in `supabaseConfig.ts` con fallback pubblici;
  sovrascrivibili via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- **Fuori dai save:** l'import storico (Lahman, Fase 2) è dato di riferimento
  read-only del bundle, non stato del giocatore.
