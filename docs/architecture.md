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
  - `game.ts` — macchina a stati della partita (inning, basi, out, punteggio,
    cambi lanciatore, walk-off, extra inning) + play-by-play.
  - `boxscore.ts` — righe di tabellino e formattazione (IP, media…).
  - `strength.ts` — forza squadra (TOT/ATT/DIF/LAN) da lineup+bench+staff.
  - `index.ts` — barrel dell'API pubblica.
  - `__tests__/` — test Vitest (determinismo, realismo, cime di eccellenza).
- `src/data/` — generazione procedurale e dati.
  - `generator.ts` — genera giocatori/rose da caratteristiche + franchigie;
    `makeNameFactory` pesca nomi per **origine** (peso ~ demografia MLB) evitando
    doppioni di nome/cognome nella stessa squadra.
  - `franchises.ts` — le 30 franchigie MLB reali (dati fattuali).
  - `names.ts` — pool di nomi per **origine** (`NAME_ORIGINS`: nordamericana,
    latina, giapponese, coreana, varie) con pesi.
  - `stadiumImages.ts` — override opzionale foto-stadio *in locale* (mappa vuota
    di default; nessun asset ufficiale nel repo).
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
