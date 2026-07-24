# ⚾ MLBSim

Simulatore di baseball testuale e (leggermente) manageriale, ispirato a
**Strategic Baseball Simulator (SBS)** per il cuore tattico e a **OOTP mobile**
per la presentazione moderna e il tocco gestionale leggero.

> **Filosofia:** *look e leggerezza di OOTP mobile, cuore tattico di SBS.*
> Divertirsi a costruire una squadra e giocare **molte partite in fretta**,
> intervenendo però **ad ogni turno di battuta** quando conta.

Web app statica (React + TypeScript + Vite), gira interamente nel browser →
pubblicabile su **GitHub Pages** senza backend, spostabile su un VPS senza
modifiche.

---

## Come si gioca (Fase 0)

Al momento è disponibile il **motore di simulazione** con interfaccia base:

- Due franchigie MLB reali generate a caso si affrontano su 9 inning (+ extra).
- **Scoreboard**, **line score** per inning (R/H/E), **tabellini** di battuta e
  lancio, e **cronaca** play-by-play.
- Scheda **"Rose & caratteristiche"**: le doti 20–80 di ogni giocatore, colorate.
- *Nuove squadre* rigenera il matchup; *Prossima partita* gioca un'altra gara
  con le stesse rose.

```bash
npm install
npm run dev      # sviluppo su http://localhost:5173
npm test         # test del motore (determinismo + realismo statistico)
npm run build    # build statica in dist/
```

---

## Il motore

Simulatore **probabilistico** in stile SBS. Ogni apparizione al piatto si
risolve combinando le tendenze del battitore e del lanciatore col metodo
**odds-ratio / Log5** rispetto alla media di lega, poi si applicano platoon
(vantaggio mano opposta) e affaticamento del lanciatore.

- `src/engine/` — motore puro, senza UI, interamente testabile.
- `src/data/` — generazione procedurale di giocatori e franchigie.
- `src/ui/` — interfaccia React.

### Le caratteristiche dei giocatori (scala 20–80)

Poche e confrontabili: **ognuna governa una sola leva del motore** (zero
ridondanza). Le statistiche (media, HR, ...) sono un *output* derivato dalle
caratteristiche + dalla simulazione — così evolverle è banale.

**Battitore (6):** Contatto (AVG) · Potenza (SLG) · Occhio (OBP) · Velocità ·
Difesa · Braccio.

**Lanciatore (6):** Dominio (K) · Controllo (BB) · Movimento (hit concesse) ·
Palla a terra (HR + doppi giochi) · Resistenza (affaticamento) · Difesa
(ritorni, bunt, cut-off, tenere i corridori — attiva da Fase 1).

I giocatori **evolvono** con età e potenziale: crescita verso il potenziale da
giovani, picco a ~27–30, poi declino (prima le doti fisiche, poi le tecniche),
fino al ritiro automatico.

---

## Roadmap

- **Fase 0 — Motore** ✅ *(attuale)* — simulazione completa di una partita,
  caratteristiche 20–80, generazione procedurale, UI con line score / box score
  / cronaca / rose, deploy su Pages.
- **Fase 1 — Turno interattivo** — gestisci una squadra e decidi **ad ogni
  turno**: swing / bunt / rubata / hit-and-run / pinch-hit, cambi lanciatore,
  base intenzionale, difesa avanzata. Con toggle **quick-sim** per macinare le
  gare veloci.
- **Fase 2 — Costruzione squadra & import storico** — editor di lineup e
  rotazione; import di **giocatori e franchigie storiche reali** (database
  Lahman).
- **Fase 3 — UI stile SBS/OOTP** — campo con etichette, card giocatore ricche,
  pannelli colorati, pulsanti-azione.
- **Fase 4 — Stagione** — calendario, classifiche, playoff, statistiche
  accumulate.
- **Fase 5 — Franchigia (gestione leggera)** — vedi sotto.

### Fase 5 — Gestione franchigia (volutamente semplice)

- **Stipendio unico annuale**, rinnovato automaticamente; niente contratti
  pluriennali né negoziazioni a scadenze diverse. Il giocatore resta finché non
  si ritira.
- **Salary cap rigido** da rispettare (per non ammassare troppe stelle); niente
  luxury tax, multe o finanze di franchigia.
- **Scambi** valutati da un "valore giocatore" = forza attuale + prospettiva
  (in funzione dell'età/potenziale) + stipendio; la CPU accetta/rifiuta in base
  all'equità.
- **Draft semplificato** e budget squadra basilare.

---

## Note su nomi, loghi e stadi

Nomi, città, colori e nomi degli stadi delle franchigie reali sono dati
fattuali inclusi nel progetto. I **loghi e le foto-stadio ufficiali** sono
marchi/immagini protette e **non** sono inclusi nel repository: la UI mostra un
**badge originale** coi colori squadra. Per uso personale puoi aggiungere gli
asset reali in locale (verrà predisposta una cartella dedicata in Fase 3).

## Deploy su GitHub Pages

Il workflow `.github/workflows/deploy.yml` builda e pubblica su Pages. Attiva
**Settings → Pages → Source = "GitHub Actions"**. La base URL è `/MLBSim/`
(configurabile via `BASE_PATH`, es. `/` per un dominio dedicato o un VPS).
