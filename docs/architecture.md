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
  - `index.ts` — barrel dell'API pubblica.
  - `__tests__/` — test Vitest (determinismo, realismo, cime di eccellenza).
- `src/data/` — generazione procedurale e dati.
  - `generator.ts` — genera giocatori/rose da caratteristiche + franchigie.
  - `franchises.ts` — le 30 franchigie MLB reali (dati fattuali).
  - `names.ts` — pool di nomi per la generazione.
- `src/ui/` — React: `App.tsx` (tutto in-file), `format.ts` (helper), `styles.css`.
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
