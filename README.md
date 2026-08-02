# ⚾ MLBSim

Simulatore di baseball testuale e (leggermente) manageriale, ispirato a
**Strategic Baseball Simulator (SBS)** per il cuore tattico e a **OOTP mobile**
per la presentazione moderna e il tocco gestionale leggero.

> **Filosofia:** *look e leggerezza di OOTP mobile, cuore tattico di SBS.*
> Divertirsi a costruire una squadra e giocare **molte partite in fretta**,
> intervenendo però **ad ogni turno di battuta** quando conta.

Web app statica (React + TypeScript + Vite), gira interamente nel browser →
pubblicabile su **GitHub Pages** senza backend, spostabile su un VPS senza
modifiche. Interfaccia e testi in **italiano**, giocatore singolo.

**Live:** https://st80dev.github.io/MLBSim/

---

## Come si gioca

Si sceglie **una squadra** e si vive l'intero ciclo di una franchigia:

1. **Nuova lega** — **generata** (30 rose procedurali bilanciate a stelle +
   profondità) oppure **storica**: **14 annate reali giocabili (1997-2010)**,
   importate dal database Lahman con le rose vere di ogni squadra.
2. **Costruisci la squadra** — editor rosa con **drag&drop** di lineup,
   rotazione e panchina; il foglio partita entra davvero nella simulazione.
3. **Gioca il calendario** — 162 gare in **serie** contro le altre squadre. Le
   tue partite si giocano **turno per turno** con tutte le tattiche (swing,
   bunt, squeeze, cerca-fly, rubata, hit-and-run, pinch-hit/run; cambio
   lanciatore, base intenzionale, interni dentro / a DP / difendi le righe),
   oppure in **quick-sim**. Le altre 29 squadre sono simulate giorno per giorno.
4. **Classifiche, leaderboard e playoff** — statistiche reali accumulate,
   **postseason a 12 squadre** giocabile fino al campione.
5. **Off-season & anno successivo** — aging, ritiri, **draft inverso**, mercato
   dei free agent e **scambi** a valore; poi si passa all'anno dopo con le rose
   che evolvono.

```bash
npm install
npm run dev        # sviluppo su http://localhost:5173
npm test           # test del motore (determinismo + realismo statistico)
npm run typecheck  # tsc -b --noEmit
npm run build      # build statica in dist/
```

---

## Il motore

Simulatore **probabilistico** in stile SBS. Ogni apparizione al piatto si
risolve combinando le tendenze del battitore e del lanciatore col metodo
**odds-ratio / Log5** rispetto alla media di lega, poi si applicano platoon
(vantaggio mano opposta), affaticamento del lanciatore, difesa dietro il
lanciatore e le tattiche attive.

- `src/engine/` — **motore puro**, senza UI, interamente testabile e deterministico
  (stesso seed → stessa partita).
- `src/data/` — generazione procedurale, import storico, calendario, stagione,
  playoff, off-season e persistenza.
- `src/ui/` — interfaccia React (plancia partita + pagine di stagione/gestione).

### Le caratteristiche dei giocatori (scala 40-100, 70 = media di lega)

Poche e confrontabili: **ognuna governa una sola leva del motore** (zero
ridondanza). Per i giocatori **generati** le caratteristiche sono la *fonte di
verità* e le statistiche (media, HR, ERA…) sono un *output* derivato + simulato.
Per i giocatori **storici** vale l'inverso: la statistica reale dell'annata è la
verità e i rating si **stimano** da essa per pilotare il motore.

**Battitore (6):** Contatto (AVG) · Potenza (SLG) · Occhio (OBP) · Velocità ·
Difesa · Braccio.

**Lanciatore (6):** Dominio (K) · Controllo (BB) · Movimento (hit concesse) ·
Palla a terra (HR + doppi giochi) · Resistenza (affaticamento) · Difesa
(ritorni, bunt, cut-off, tenere i corridori).

I giocatori **generati evolvono** con età e potenziale: crescita verso il
potenziale da giovani, picco a ~27-30, poi declino (prima le doti fisiche, poi le
tecniche), fino al ritiro automatico. Gli **snapshot storici** non evolvono
(sono la fotografia di un'annata); i loro discendenti nel gioco divergono dalla
realtà (nessuna preveggenza).

---

## Stato per fase

- **Fase 0 — Motore + UI base** ✅ — simulazione completa di una partita.
- **Fase 1 — Turno interattivo** ✅ — gestisci una squadra e decidi **ad ogni
  turno**; toggle **quick-sim**; AI tattica della CPU.
- **Fase 2 — Costruzione squadra & import storico** ✅ — editor rosa,
  persistenza Supabase, 14 annate reali (Lahman), salary cap.
- **Fase 3 — UI stile SBS/OOTP** 🔨 — struttura a pagine, cronaca a fasi,
  mini-popup giocatore (in rifinitura).
- **Fase 4 — Stagione** ✅ — calendario a serie, classifiche, leaderboard,
  playoff a 12 squadre, difesa dietro il lanciatore.
- **Fase 5 — Franchigia (gestione leggera)** 🔨 — motore (5A) completo
  (`playerValue`, cap, mercato a blocchi, draft, scambi, rollover); UI (5B) in
  corso (scambi ✓, rollover automatico ✓; manca l'off-season interattiva).

Dettaglio completo in [`docs/roadmap-and-status.md`](docs/roadmap-and-status.md).

### Fase 5 — Gestione franchigia (volutamente semplice)

- **Stipendio unico annuale**, rinnovato automaticamente; niente contratti
  pluriennali né negoziazioni. Il giocatore resta finché non si ritira.
- **Salary cap** a due confini con sforamento stocastico minimale (una luxury
  tax leggera), niente finanze di franchigia.
- **Scambi** valutati da un "valore giocatore" = forza attuale + prospettiva
  (età/potenziale) + stipendio; la CPU accetta/rifiuta in base all'equità.
- **Draft inverso** semplificato: la peggiore sceglie per prima.

---

## Note su nomi, loghi e stadi

Nomi, città, colori e nomi degli stadi delle franchigie reali sono dati
fattuali inclusi nel progetto. I **loghi e le foto-stadio ufficiali** sono
marchi/immagini protette e **non** sono inclusi nel repository: la UI mostra un
**badge originale** coi colori squadra. Per uso personale puoi aggiungere gli
asset reali in locale.

## Deploy su GitHub Pages

Il workflow `.github/workflows/deploy.yml` builda e pubblica su Pages. Attiva
**Settings → Pages → Source = "GitHub Actions"**. La base URL è `/MLBSim/`
(configurabile via `BASE_PATH`, es. `/` per un dominio dedicato o un VPS).

Documentazione di sviluppo (architettura, motore, giocatori, franchigia, UI,
workflow) in [`docs/`](docs/) — vedi la mappa in [`CLAUDE.md`](CLAUDE.md).
