# CLAUDE.md — MLBSim

Simulatore di baseball **testuale** e leggermente **manageriale**, web statico
(React + TypeScript + Vite), pubblicato su GitHub Pages. Ispirazione:
**cuore tattico di SBS + presentazione e leggerezza gestionale di OOTP mobile**.
Interfaccia e testi di gioco in **italiano**. Giocatore singolo.

Questo file è volutamente **snello**: contiene solo le linee guida. I dettagli
di ogni settore stanno in `docs/` e vanno letti **su richiesta**, solo quando la
sessione tocca quell'argomento (vedi la mappa in fondo).

---

## 1. Principi non negoziabili

1. **Caratteristiche = fonte di verità.** Le doti (scala 40-100, 70 = media di
   lega) definiscono il giocatore *generato*; le statistiche (media, HR, ERA…)
   sono un *output* derivato + simulato, mai un dato inserito a mano.
   *(Eccezione: i giocatori **storici** sono snapshot congelati — lì la verità è
   la statistica reale dell'annata e i rating si **stimano** da essa. Vedi
   `docs/players-and-ratings.md`.)*
2. **Caratteristiche → *peripherals*, NON → risultati.** I rating guidano ciò che
   il giocatore controlla (K, BB, HR, contatto → K/9, WHIP, FIP). **ERA e
   Vittorie sono risultati** di contesto (difesa, stadio, supporto offensivo,
   fortuna) e devono restare liberi di galleggiare, mai una funzione rigida del
   talento.
3. **Motore puro e testato.** `src/engine/` non importa nulla dalla UI ed è
   coperto da test (determinismo + realismo). La UI (`src/ui/`) consuma il motore.
   Tutta la casualità passa da un `Rng` seedato: **niente `Math.random()`/
   `Date.now()`** in `src/engine` e `src/data`.
4. **Epoca "alta offesa anni '90/2000".** Medie alte, tanti punti, sluggers da
   45+ HR, ma assi capaci di dominare. Non le medie basse della MLB recente.
5. **Gestione franchigia semplice.** Stipendio unico annuale, salary cap con
   sforamento stocastico minimale, scambi a valore, draft basilare. Niente
   contratti pluriennali.

## 2. Convenzioni di sviluppo

- **Branch**: si sviluppa una fase (o un incremento) per volta su un branch
  dedicato creato da `main` (es. `claude/fase-5-...`); si apre una **PR verso
  `main`**; si mergia dopo che i test passano. `main` è il tronco.
- **Test obbligatori**: `npm test` deve passare prima di ogni merge/deploy.
- **Deploy**: automatico su GitHub Pages ad ogni push su `main` (workflow
  `.github/workflows/deploy.yml`, sorgente Pages = "GitHub Actions").
- **Asset**: mai committare loghi/foto ufficiali (marchi protetti). Solo badge
  originali generati a runtime.
- **Modello**: non citare l'identificativo del modello in commit/PR/codice.
- **Doc allineata al codice**: se prendi una nuova decisione di design, aggiorna
  il doc del settore corrispondente nello stesso lavoro.

## 3. Note operative

- **Routine post-PR — DISATTIVATA (scelta dell'utente).** Dopo aver aperto una
  PR: **non** restare in ascolto degli eventi della PR (niente monitoraggio
  review/CI) e **non** creare promemoria o check-in schedulati (`send_later`,
  trigger). Se l'ambiente iscrive in automatico, **disiscriviti subito**. Aprire
  la PR e fermarsi.

## 4. Stato attuale (sintesi)

**Live**: https://st80dev.github.io/MLBSim/. Test verdi.

Il gioco copre l'intero ciclo **crea squadra → gioca stagione → playoff →
off-season → anno successivo**:

- **Fasi 0-1 (motore + turno interattivo): complete.** Motore unificato a stati
  (`createLiveGame` + azioni + `quickSim`), gestisci una squadra vs CPU con tutte
  le tattiche (attacco: swing/bunt/squeeze/cerca-fly/rubata/hit-and-run/
  pinch-hit; difesa: cambio lanciatore/base intenzionale/interni dentro-DP-righe),
  quick-sim, decisioni W/L/SV. AI tattica CPU (small-ball + gestione panchina e
  bullpen). Le tattiche usano l'RNG **solo nei turni umani**: calibrazione Fase 0
  e sim di lega invariate.
- **Fase 2 (costruzione squadra + import storico): completa.** Editor rosa
  drag&drop, foglio partita in simulazione, squadra gestita persistente,
  persistenza **Supabase**, e **import storico Lahman**: **14 annate reali
  giocabili (1997-2010)** con inversione stat→rating, dedup a identità stabile,
  finestra Marcel multi-annata e pool free agent per ogni annata.
- **Fase 3 (UI stile SBS/OOTP): avviata.** Struttura a pagine, cronaca a fasi +
  micro-eventi, plancia partita, mini-popup giocatore, schermata calibrazione
  stadi.
- **Fase 4 (stagione): completa.** Calendario a serie (10 prestagione + 162
  regular), stagione a stati con classifiche e leaderboard reali, difesa dietro
  il lanciatore (scollegatore ERA), **playoff giocabili a 12 squadre** fino al
  campione.
- **Fase 5 (franchigia): in corso.** **5A (motore puro) completo** — `playerValue`,
  cap enforce con ε, mercato off-season a blocchi, draft inverso, valutazione
  scambi, `runOffseason` + rollover di stagione. **5B (UI + aggancio) in corso** —
  fatti schema v3 con rose persistite, rollover automatico + `RolloverRecap`, UI
  scambi (`TradeScreen`); manca l'off-season interattiva a blocchi e il `perf`
  reale dall'impiego.

> Dettaglio completo e roadmap per fase in `docs/roadmap-and-status.md`.

## 5. Mappa della documentazione — leggi SOLO ciò che serve

| Se la sessione riguarda… | Leggi |
|---|---|
| struttura codice, moduli, flusso dati, RNG, persistenza | `docs/architecture.md` |
| caratteristiche giocatore, scala 40-100, evoluzione età/potenziale | `docs/players-and-ratings.md` |
| motore di gioco, Log5, corsa sulle basi, **calibrazione**, ERA/W, difesa, proiezione | `docs/engine-calibration.md` |
| scambi, draft, stipendi, salary cap, off-season, rollover (layer gestione) | `docs/franchise.md` |
| interfaccia, pagine, stile, componenti, tema, stadi | `docs/ui.md` |
| roadmap, cosa è fatto, cosa manca per fase | `docs/roadmap-and-status.md` |
| git, branch, PR, build, deploy, come far girare | `docs/dev-workflow.md` |

> Prima di lavorare su un settore, **apri il file corrispondente**. Se prendi una
> nuova decisione di design, **aggiornalo** (mantieni il doc allineato al codice).
