# CLAUDE.md — MLBSim

Simulatore di baseball **testuale** e leggermente **manageriale**, web statico
(React + TypeScript + Vite), pubblicato su GitHub Pages. Ispirazione:
**cuore tattico di SBS + presentazione e leggerezza gestionale di OOTP mobile**.
Interfaccia e testi di gioco in **italiano**. Giocatore singolo.

Questo file è volutamente **snello**: contiene solo le linee guida. I dettagli
di ogni settore stanno in `docs/` e vanno letti **su richiesta**, solo quando la
sessione tocca quell'argomento (vedi la mappa in fondo).

## Principi non negoziabili

1. **Caratteristiche = fonte di verità.** Le doti (scala 40-100, 70 = media di
   lega) definiscono il
   giocatore; le statistiche (media, HR, ERA…) sono un *output* derivato +
   simulato, mai un dato inserito a mano.
2. **Caratteristiche → *peripherals*, NON → risultati.** I rating guidano ciò che
   il giocatore controlla (K, BB, HR, contatto → K/9, WHIP, FIP). **ERA e
   Vittorie sono risultati** di contesto (difesa, stadio, supporto offensivo,
   fortuna) e devono restare liberi di galleggiare, mai una funzione rigida del
   talento.
3. **Motore puro e testato.** `src/engine/` non importa nulla dalla UI ed è
   coperto da test (determinismo + realismo). La UI (`src/ui/`) consuma il motore.
4. **Epoca "alta offesa anni '90/2000".** Medie alte, tanti punti, sluggers da
   45+ HR, ma assi capaci di dominare. Non le medie basse della MLB recente.
5. **Gestione franchigia semplice.** Stipendio unico annuale, salary cap rigido
   senza multe, scambi a valore, draft basilare. Niente contratti pluriennali.

## Convenzioni di sviluppo

- **Branch**: si sviluppa una fase per volta su un branch dedicato creato da
  `main` (es. `claude/fase-1-...`); si apre una **PR verso `main`**; si mergia
  dopo che i test passano. `main` è il tronco.
- **Test obbligatori**: `npm test` deve passare prima di ogni merge/deploy.
- **Deploy**: automatico su GitHub Pages ad ogni push su `main` (workflow
  `.github/workflows/deploy.yml`, sorgente Pages = "GitHub Actions").
- **Asset**: mai committare loghi/foto ufficiali (marchi protetti). Solo badge
  originali generati a runtime.
- **Modello**: non citare l'identificativo del modello in commit/PR/codice.

## Note operative

- **Routine post-PR — DISATTIVATA (scelta dell'utente).** Dopo aver aperto una
  PR: **non** restare in ascolto degli eventi della PR (niente monitoraggio
  review/CI) e **non** creare promemoria o check-in schedulati (`send_later`,
  trigger). Se l'ambiente iscrive in automatico, **disiscriviti subito**. Aprire
  la PR e fermarsi.

## Stato attuale

**Fase 0** (motore + UI base) **live**: https://st80dev.github.io/MLBSim/.
**Fase 1 — turno interattivo completata**: motore unificato a stati, gestisci
una squadra vs CPU con tutte le tattiche (Swing/Bunt/Rubata/Hit-and-run/Pinch-hit
in attacco; cambio lanciatore/base intenzionale/interni dentro in difesa),
quick-sim, decisioni W/L/SV. Le tattiche usano l'RNG solo nei turni umani (Fase 0
invariata). Dettaglio in `docs/roadmap-and-status.md`.

## Mappa della documentazione — leggi SOLO ciò che serve

| Se la sessione riguarda… | Leggi |
|---|---|
| struttura codice, moduli, flusso dati, RNG | `docs/architecture.md` |
| caratteristiche giocatore, scala 40-100, evoluzione età/potenziale | `docs/players-and-ratings.md` |
| motore di gioco, Log5, corsa sulle basi, **calibrazione**, ERA/W | `docs/engine-calibration.md` |
| scambi, draft, stipendi, salary cap (layer gestione) | `docs/franchise.md` |
| interfaccia, stile, componenti, tema | `docs/ui.md` |
| roadmap, cosa è fatto, cosa manca per fase | `docs/roadmap-and-status.md` |
| git, branch, PR, build, deploy, come far girare | `docs/dev-workflow.md` |

> Prima di lavorare su un settore, **apri il file corrispondente**. Se prendi una
> nuova decisione di design, **aggiornalo** (mantieni il doc allineato al codice).
