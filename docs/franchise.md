# Layer gestione franchigia (volutamente semplice)

Filosofia: divertirsi a costruire e gestire una squadra **senza** la complessità
di un GM manager completo. I campi base vivono nel modello (`CareerProfile`:
`age`, `potential`, `salary`, `retired`, `twoWay`).

> **Stato (agosto 2026):** la **Fase 5A** (motore franchigia puro) è
> **implementata e testata** — `playerValue`, cap enforce + ε, mercato
> off-season a blocchi, draft inverso, valutazione scambi, `runOffseason` +
> rollover. La **Fase 5B** (UI + aggancio stagione) è **in corso**: fatti schema
> v3 con rose persistite, rollover automatico + recap, UI scambi; manca
> l'off-season interattiva a blocchi e il `perf` reale dall'impiego. Il testo che
> segue è **sia design sia documentazione di ciò che è stato costruito** — dove
> resta un divario col codice è segnalato inline (⚠️).

## Piano di esecuzione Fase 5 — 5A (motore, FATTO) vs 5B (UI, in corso)

**Decisione di design.** Il layer franchigia è **quasi tutto logica pura** e si
disaccoppia dalla Fase 4 grazie a una cucitura già presente nel motore:
`advanceSeasonBatter/Pitcher(…, perf = 0)` accetta un segnale d'impiego opzionale,
oggi **neutro**. Quindi tutta la meccanica franchigia si costruisce con `perf = 0`
e si collega il `perf` reale (box score reali per la squadra gestita, `projection.ts`
per le 29 CPU) **quando** la Fase 4 chiuderà il rollover di stagione — **senza**
toccarne la struttura.

**Fase 5A — motore franchigia (puro, testabile, ZERO dipendenza da Fase 4) — FATTO:**

1. **`playerValue`** — l'atomo comune a scambi e cap (vedi § sotto). **FATTO**
   (`engine/value.ts`).
2. **Cap enforce + margine ε** — `effectiveCap(seed, teamId, year) = base × (1+ε)`,
   ε **seedato** e deterministico (niente stato da salvare), con piccola componente
   persistente di franchigia (vedi § Salary cap). **FATTO** (`leagueMode.ts`:
   `capOverageMargin`/`effectiveCap`/`overEffectiveCap`).
3. **Pool di free agent + riconciliazione** — funzione pura: sopra il *proprio*
   tetto si scarica a valore crescente-dal-basso, sotto si ripesca (vedi §
   Riconciliazione). **FATTO** (`offseason.ts`: mercato a blocchi).
4. **Draft inverso** — generazione classe prospetti (`generator` + `projectPotential`,
   tetto *possibile* non certo) + assegnazione a ordine di classifica inversa
   (accetta una qualsiasi mappa di record W-L). **FATTO** (`draft.ts`).
5. **Valutazione scambi** — `evaluateTrade(give, get, capCtx) → sì/no` (equità +
   rispetto cap bilaterale). **FATTO** (`trades.ts`).
6. **`runOffseason(league, seed, year, perf?)`** — orchestratore che cuce 1–5 con
   `perf` di default 0. **FATTO** (`offseasonRun.ts` + `rollover.ts`:
   `rolloverSeason` è il "rollover di stagione" completo, aging→ritiri→draft→
   mercato→finalize).

**Fase 5B — UI + accoppiamento con la stagione — IN CORSO:**

- **UI scambi** (proponi → *una* CPU valuta): **FATTO** (`TradeScreen`, aperta in
  stagione fino a `TRADE_DEADLINE_GAME`).
- **Rollover automatico + riepilogo** (`RolloverRecap` a campione deciso): **FATTO**.
- **Schema v3 + rose persistite**: **FATTO** (`GameSave.teams?`).
- **Manca:** off-season **interattiva a blocchi** (il motore `advanceBlock`/
  `humanRelease`/`humanSign` c'è, l'UI dei blocchi no); **collegamento del `perf`
  reale** dall'impiego (aging oggi neutro, `perf=0`) e **normalizzazione PA
  battitori** (`Σ squadra ≈ 6.180`, vedi § Normalizzazione PA).

**Persistenza (schema v3).** Il multi-anno introduce **stato che diverge dal
seed**: appena c'è aging + uno scambio umano, la lega non è più ri-derivabile da
`seed`. Scelta: **persistere le rose complete** dopo ogni off-season (`GameSave`
schema v3), robusto agli scambi umani. ε resta seedato (niente finanza da salvare);
il pool di free agent è transitorio (si consuma nell'off-season, non si salva).

### `playerValue` — l'atomo (punti overall-equivalenti)

Mix dei tre ingredienti di § Scambi, in un'unica scala interpretabile (punti di
overall), così che l'ordinamento serva **sia** gli scambi **sia** lo scarico da cap:

```
valore = overall                                    // forza attuale (segnale dominante)
       + upsideWeight(età) × max(0, potential−overall)  // prospettiva/potenziale per età
       − SALARY_WEIGHT × salary                     // freno stipendio (tiebreak secondario)

upsideWeight(età): 1.0 a ≤22  →  0 a ≥30 (lineare in mezzo)
```

Conseguenze: una stella batte uno scarso (l'overall domina); a **pari overall** un
giovane con headroom o un contratto economico vale di più; un veterano maturo e caro
scende. Ordinando dal valore **più basso** si scaricano prima i maturi cari senza
prospettiva, **mai** i giovani-affare (che ai deboli arrivano via pool/draft). Puro:
niente RNG, non muta il giocatore. Vive in `engine/value.ts`.

## Finestra di gestione (tra le partite di calendario)

Il gioco gestisce **una sola squadra** (quella dell'utente). Roster e
**lineup/rotazione** si modificano nel **tempo di gestione fra una partita e la
successiva** in calendario (non durante la partita, non nella preview d'esibizione
di Fase 0). Le altre squadre avanzano da sole, **simulate giorno per giorno**.

Quindi la persistenza di formazione/schieramento appartiene a **questo** momento:
si prepara la squadra, si conferma, si gioca la partita, poi di nuovo gestione.

### Riposo dei lanciatori e scelta del partente (`data/rotation.ts`)

Non c'è un riquadro "4/5 uomini": la rotazione è semplicemente l'ordine della
lista dei partenti nel Roster. Ogni lanciatore matura un **riposo in gare** in
base all'**uso reale** dell'ultima partita (out lanciati), tracciato in
`SeasonState.rotation.availableFrom`:

- **partente / spot start** → 3 gare (riposo **minimo**: l'asso di gara 1 rientra
  alla gara 5, così è possibile anche una **rotazione a 4 uomini**; con 5 partenti
  sani si gira comunque a 5, vedi sotto);
- **rilievo da 2+ IP** (6+ out) → 1 gara; **sotto le 2 IP** → 0 (pronto la gara dopo).

I rilievi restano quasi sempre disponibili (i bullpen sono corti): solo chi si
carica di 2+ inning salta una gara, così non si resta a secco dopo una partita
difficile. *(Nota: non c'è un tetto al numero di lanciatori attivi/bullpen in
`validateArrangement` — serve solo ≥1 partente in rotazione.)*

Nel Roster (tab lanciatori, pre-gara di regular season) due **colonne dedicate**:
**RIP.** (badge `pronto` / `+N g`) e **PARTE** (pulsante “parte” sulle righe di
rotazione). I partenti a riposo non sono eleggibili. Il **partente del giorno** è
di default il **più riposato** fra i disponibili (`suggestedStarter`, ordine di
rotazione a spareggio): così con 5 partenti sani la rotazione a 5 **non collassa**
a 4 solo perché il riposo minimo (3 gare) renderebbe l'asso già schierabile — parte
il più fresco e l'asso si prende la gara di riposo in più. Si sceglie/conferma dalla
colonna PARTE (per far partire una riserva la si **scambia** prima in rotazione);
per una rotazione a 4 uomini basta schierare l'asso appena smaltite le 3 gare. Portare un lanciatore da *Disponibili* agli
attivi è sempre uno **swap** (la rosa attiva resta a taglia costante).

## Stipendi

- **Un solo stipendio annuale** per giocatore, **rinnovato automaticamente**.
- **Niente** contratti pluriennali, scadenze diverse, arbitrato, negoziazioni.
- Il giocatore resta nella franchigia finché non si **ritira** (per età/declino).
- `salary` è **derivato** — mai inserito a mano — ed è funzione di **(overall,
  età)**: `salaryFor(overall, age)` in `ratings.ts`, cioè
  `salaryFromOverall(overall) × youthFactor(age)`. Si ri-calcola ad ogni
  evoluzione stagionale (`aging.ts`).

### `youthFactor` — lo sconto gioventù (modello "B-lite")

**Decisione di design.** Nel baseball vero un giovane fuoriclasse è forte **e**
costa poco (rookie deal/arbitrato). Per riprodurlo **senza** reintrodurre
contratti/service-time/arbitrato (vietati sopra), lo stipendio porta un
moltiplicatore **funzione della sola età**, *stateless*:

```
youthFactor(age): ~0.4 a 21 anni  →  1.0 a ~27 anni  (poi resta 1.0)
salary = salaryFromOverall(overall) × youthFactor(age)
```

Conseguenze (tutte automatiche, guidate da `aging.ts` che incrementa l'età e
ri-deriva il salario ogni anno):

- Il **neo-draftato** entra vicino al **minimo** (overall basso × youthFactor
  basso): è un asset a buon mercato che **si apprezza**.
- Durante lo sviluppo lo stipendio sale su **due spinte** (overall che cresce +
  youthFactor che sale), ma resta un **affare** rispetto a un pari-overall
  maturo.
- A ~27 anni youthFactor = 1.0 → **prezzo pieno di mercato**: è lì che scatta la
  decisione "lo tengo/lo estendo?".
- Oltre i 30 l'overall cala → lo stipendio cala con lui.

L'"arbitrato" diventa così una **rampa liscia** (non uno scalino contrattuale):
nessun nuovo stato, nessuna scadenza, compatibile al 100% col rinnovo annuale.
Nota: lo stipendio **non** è più funzione del solo overall — un 24enne e un
30enne allo stesso overall costano diverso (è voluto).

## Salary cap — modello a due confini con sforamento stocastico

**Decisione di design (rivista dopo lo studio multi-stagione).** Un cap *rigido*
unico appiattirebbe la lega negli anni: riconciliando ogni squadra sotto lo
stesso tetto si comprime **sia** il monte-ingaggi **sia** il talento → dopo 3-4
stagioni tutte ammassate appena sotto il cap (noioso, e irrealistico: la MLB non
ha un hard cap, ha una **luxury tax** che i grandi club scelgono di pagare).
Quindi il cap è **soft con sforamento tollerato**, a **due confini**:

- **Cap base** = la *norma*, linea "soft": bersaglio della redistribuzione, non
  un muro.
- **Muro esterno** a `cap_base + max_overage` = tetto **rigido invalicabile**
  (nessuno lo supera mai → niente runaway).
- In mezzo, la **"fascia tassa"**: una squadra può starci se il suo margine di
  quest'anno glielo consente.

### Margine di sforamento ε (la luxury tax, minimale)

Il tetto effettivo **non** è una costante globale ma varia **per squadra e per
anno**:

```
tetto_effettivo(team, anno) = cap_base × (1 + ε)
ε  = margine stocastico, limitato   (indicativo: ε ∈ [-0.10 … +0.25])
```

La riconciliazione fa rientrare ogni squadra **sotto il *suo* tetto**, non sotto
il cap base → **ogni anno alcune squadre stanno sopra il cap base** ("hanno
pagato la tassa"), altre sotto: il tessuto non collassa mai in omogeneità.

### Cap PER MODALITÀ (generato 250/312 vs storico 172/215)

Il cap base **non è lo stesso** nelle due modalità, perché le due leghe hanno una
densità-talento diversa:

- **Generata** — cap **250** / muro **312**. Il generatore dà a ogni squadra stelle
  garantite + pavimenti di rosa (niente scarti): payroll mediano ~200M, alcune
  corazzate fino a ~350M. Il cap 250 è calibrato su questa densità.
- **Storica** — cap **172** / muro **215** (stesso rapporto ×1.25). Le rose reali
  sono "dense di scarti" (i loro scrub costano il minimo), quindi partono più
  leggere (~110-205M, mediana ~155M): col cap 250 il tetto **non vincolava nulla**
  e si potevano ammassare campioni via scambi restando sotto il muro (una dream-team
  dei 25 più forti costa ~420M, ma bastava riempire l'ampio margine). A 172/215 il
  cap **morde**: le corazzate reali (max ~205M) restano **giocabili** (`capOk`: chi è
  sopra può alleggerirsi, mai appesantirsi) e si sgonfiano ai rollover, la mediana
  ha ~3 stelle di headroom (non ~8), nessuna squadra parte oltre il muro. Muro
  derivato dal rapporto standard (`outerWall`): nessun override, invariante ε salva.

**Espressione minimale, zero finanza:** ε è **seedato** da `(seed, teamId, anno)`
→ deterministico, **niente soldi/multe/registri/stato da salvare**. Solo un tetto
che oscilla.

**Knob (transitorio vs persistente):** ε è **in prevalenza transitorio** (rumore
per-anno → stagioni-splurge occasionali, mobilità piena) con una **piccola
componente persistente** (profilo di franchigia → un accenno di identità
grande/piccolo mercato). Il margine persistente è **piccolo apposta**: dà colore,
non destino — draft inverso e aging garantiscono comunque il ricambio.

### Cosa resta fuori (per scelta)

- **Niente** gestione finanziaria: nessuna cassa, budget, tasse pagate, registri.
  Il cap è una **regola di validità della rosa**, non una risorsa da spendere.
- **Niente** trade AI↔AI (vedi § Evoluzione pluriennale): la redistribuzione
  passa da un **pool di free agent**, non da un motore di matching.

### Stato dell'implementazione

`data/leagueMode.ts` ha `CapMode` (`hard`/`soft`/`off`) + `capReport` e il modello
a due confini è **attivo**: `capOverageMargin` (ε seedato), `effectiveCap` e
`overEffectiveCap` **enforçano** davvero i rilasci/firme nel mercato a blocchi
(`offseason.ts`) e i controlli di cap bilaterali negli scambi (`trades.ts`).
L'indicatore payroll-vs-cap resta visibile in Franchigia/panoramica lega, ma non è
più "solo informativo": è la stessa regola che il rollover applica.

## Modalità di lega e squilibrio (generata vs import storico)

**Decisione di design.** La lega **generata** ha talento ~gaussiano centrato su
70 (media di lega), con un **modello a stelle + profondità**: `teamTalent` morbido
(σ≈2.5 clamp ±6) per la profondità + **1-3 stelle garantite per squadra** e
pavimenti realistici (nessun titolare <55, nessun partente <52). Le rose NON
partono uguali — alcune da contender, altre da cantina — ma anche la peggiore ha
una stella. Un **profilo d'età** per franchigia (`ageSkew`) disaccoppia il payroll
dalla forza (cheap-good / expensive-mediocre). Così le
stagioni simulate non finiscono tutte sul filo del .500. Restano comunque entro
una forbice gestibile dal **cap rigido** (la media di lega non si sposta).
L'**import storico** è diverso: le rose reali **non sono bilanciate** — le squadre
vincenti hanno giocatori con stat/rating
migliori, le perdenti peggiori. È la **verità dello snapshot** e va **abbracciata,
non ri-bilanciata** (ri-livellare falserebbe la stagione reale).

Esempio misurato (import 1999): **CLE** ha lineup ovr ~55.6 ma **rotazione ~47**
(sotto media, com'era davvero), **BOS** rotazione ~55.5 (Pedro); negli scontri
diretti **CLE vince solo ~35%**. Una squadra realmente scarsa dell'annata starebbe
molto più in basso.

Conseguenza sul cap: `salaryFromOverall` scala col talento, quindi una corazzata
storica implica un **monte-ingaggi alto** che sfonderebbe un cap rigido. Perciò:

- **Lega generata** → cap **soft a due confini** (base + ε + muro esterno, vedi
  § Salary cap): parità *morbida*, non appiattita. La media di lega resta sotto
  il cap base per calibrazione, ma lo spread `teamTalent` + ε lascia sempre
  qualche squadra in fascia-tassa.
- **Import storico** → cap **morbido/off**: le rose reali sbilanciate non vanno
  ri-livellate, si abbraccia lo snapshot.

Fondazione in `src/data/leagueMode.ts`: `LeagueMode` (`source` + `SalaryCapPolicy`
con `mode: 'hard' | 'soft' | 'off'`), costanti `GENERATED_MODE`/`HISTORICAL_MODE`,
e utilità `teamPayroll`/`capReport`. L'**enforce** vero (scambi/rinnovi che
rispettano il cap) è **attivo** in `offseason.ts`/`trades.ts` (vedi § sopra).

## Evoluzione pluriennale (rollover di stagione)

Ciò che segue è **implementato** (`rollover.ts` + `offseasonRun.ts`; era design
bancato per la Fase 5, oggi live e coperto da `data/__tests__/rollover.test.ts`).
Garantisce che la lega resti **verosimile e giocabile per molti anni** senza
deriva da GM-manager. Principio-guida: il
riequilibrio nasce da **meccanismi veri** (età, draft, mercato), **mai** da
bonus/malus artificiali ai rating (tradirebbe "caratteristiche = fonte di
verità" e si *sentirebbe* finto).

### I tre motori del riequilibrio verso la media

1. **Aging** (`aging.ts`, già presente) — le dinastie invecchiano e calano, i
   giovani forti crescono. Da solo è **entropia**: fa declinare tutti, non
   favorisce i deboli.
2. **Draft a ordine inverso** — è l'**"handicap" strutturale**: la peggiore
   sceglie per prima → prospetti migliori → risale in 2-4 anni. Il debole riceve
   *opportunità* (talento **economico**, vedi youthFactor), non punti-rating
   regalati.
3. **Cap uniforme + mercato (pool di free agent)** — converte la ricchezza in
   *vincolo* (i forti non ricaricano) e lo spazio dei deboli in *opportunità*.

**Parità morbida (scelta):** i motori **spingono** verso la media ma **non la
garantiscono**. Una franchigia ben gestita resta in alto, una gestita male
affonda: la bravura dell'utente è il differenziale.

### Impiego → crescita dei giovani (niente allenamento, niente veterani)

*(Discussione "allenamento" e "mantenimento veterani/estensione picco":
**scartata** — resterebbe deriva gestionale. Il declino è **età-only**.)*

La crescita dei **giovani** può dipendere dall'**impiego** (segnale unico: le
partite/PA giocate), così che tenere un prospetto in panca **costi** in sviluppo:

- **Segnale = impiego stagionale**, letto verso un **carico pieno da titolare**
  (`crescita × impiego/carico-pieno`): il giovane che gioca sboccia, quello
  sepolto in riserva ristagna. Crea la scelta manageriale "gioco il ragazzo (più
  debole ora) o vinco subito?".
- **Sorgente dell'impiego:** squadra **gestita** → G/PA **reali** dai box score
  (il tuo panchinare abbassa davvero il carico); **29 CPU** → linea **proiettata**
  di `projection.ts` (che *già* modella il minutaggio per ruolo/età/overall). Non
  serve nuovo contatore: al rollover si **consuma** il numero già prodotto.

### Normalizzazione PA — verosimiglianza tra squadre negli anni

`projection.ts` calcola le PA **per giocatore in modo indipendente**, non
vincolate a un budget-squadra: sommate sulla rosa dei battitori superano il
reale (~9.000 vs **~6.180 PA** di una squadra da 162 gare da 9 inning), e
`ovrplayFactor` dà uno spread ±~15-20% tra squadre forti e deboli. Per il singolo
è realistico (i buoni giocano di più), ma il **totale-squadra** va **ancorato**.

- **Fix (in Fase 4, quando l'impiego alimenta l'aging):** normalizzare le PA
  proiettate dei **battitori** così che `Σ squadra ≈ 6.180`, **mantenendo i pesi
  relativi** (lo spread realistico resta, si riscala solo la somma). Una passata
  per squadra/anno.
- I **lanciatori** sono già a posto: `PITCH_LOAD` somma ~6.200 BF ≈ le PA
  concesse reali. Il fix è **solo battitori**.
- L'overshoot attuale sulla leaderboard è **cosmetico** (sta nella coda
  panca/riserve) e resta separato dal fix di aging.

### Riconciliazione del cap per le AI (senza trade AI↔AI)

La CPU rispetta il cap **al rollover** (fine stagione), non a metà anno; la
ridistribuzione passa da un **pool di free agent**, **non** da un motore di
matching a coppie. L'off-season ha una **fase deterministica una-tantum** seguita
da un **mercato a più blocchi**:

**Fase una-tantum (all'apertura dell'off-season):**

1. **Aging + ri-derivo stipendi** (i payroll si spostano).
2. **Ritiri** → buchi in rosa + monte liberato.
3. **Draft inverso** → gioventù al minimo in ingresso.

**Mercato a blocchi (rilasci e firme INTRECCIATI, non due passi chiusi):**

> **Decisione di design.** Rilasciare e firmare **non** sono due fasi separate
> ("scarica tutti, poi firma tutti"): sarebbe innaturale e toglierebbe scelta.
> L'off-season è una **sequenza di blocchi-data** (finestre che simulano il
> susseguirsi delle date reali di novembre→febbraio). In **ogni blocco** accadono
> **entrambe le cose**, sia lato AI sia lato **utente**, e il **pool di free agent
> resta osservabile fra un blocco e l'altro**. Così puoi **vedere chi è
> disponibile prima** di rilasciare apposta un giocatore per far spazio — e
> viceversa — in **più momenti**, invece che in un colpo solo.

- Ogni blocco, ciascuna AI fa mosse **limitate** (al più un rilascio se sopra il
  *suo* tetto/oltre la taglia rosa, al più una firma se sotto taglia e il pool
  offre un upgrade **che rientra nel cap**): il mercato **si schiarisce nell'arco
  dei blocchi**, non istantaneamente.
- Il **pool è reattivo**: se firmi tu un free agent che un'AI puntava, al blocco
  successivo l'AI **si adatta** (ricalcola sul pool aggiornato). È l'interazione
  emergente voluta.
- **Rilascio per pressione da CAP**: si cede il **più caro tra gli espendibili** —
  la metà inferiore per `playerValue` (l'**elite è protetto**), e di quella il
  **salary più alto**. *(Correzione emersa col rollover pluriennale: scaricare il
  `playerValue` in assoluto più basso libera uno **scrub economico** che NON
  alleggerisce il monte-ingaggi → la corazzata non rientra mai e il payroll deriva
  verso l'alto. Cedere il caro-espendibile è il "maturo caro senza prospettiva" che
  il design vuole: sollievo di cap reale, riconciliazione a **senso unico verso il
  basso**.)* **Rilascio sopra-taglia** (depth in eccesso, es. prospetti dal draft):
  il `playerValue` più basso del tipo in eccesso. **Firma per bisogno**: dal pool il
  `playerValue` più alto del **tipo mancante** (verso 20/15) che **sta sotto il
  proprio tetto effettivo**.
- **Taglie rosa**: 20 battitori + 15 lanciatori per squadra (9+5+6 / 5+7+3). Il
  bullpen è a **7** (6 rilievi + closer) così il pool di gara `[starter, ...bullpen]`
  è di **8 lanciatori** e gli extra inning non restano a secco; il 7° rilievo viene
  dai depth (reserve 3, non 4) mantenendo il pool totale a 15 (seed-stabile). In
  import storico il 7° rilievo è il miglior arm di riserva promosso. I rilasci non
  scendono sotto la taglia; le firme non la superano.
- **L'utente agisce con le STESSE primitive** in qualunque blocco (rilascia/firma
  sulla propria franchigia): la CPU è semplicemente l'automa che le applica alle
  altre 29. Fine off-season → **ricomposizione** di lineup/rotazione dai set piatti
  (via `autoLineup` + assegnazione ruoli, come il generatore).

Conseguenze:

- **La squadra AI forte** non viene fermata da un muro a metà stagione (rosa
  congelata durante l'anno): **a fine stagione non può portarsi dietro** un monte
  da all-star — la riconciliazione le taglia l'eccedenza. La dinastia è tassata
  per **attrito** (deve lasciar partire buoni giocatori verso i deboli). È la
  valvola di parità, **automatica, senza interazione dell'utente**.
- **Chi PARTE molto sopra il muro** (le ~2-3 corazzate generate, fino a ~1.55× il
  muro): **non ha "margine" — ha il problema opposto**, zero spazio e obbligo di
  cedere. Ma lo sfoltimento è **graduale**, non un azzeramento all'anno 1: ogni
  off-season rientra di una frazione dell'eccesso, così la dinastia **si spegne
  in 2-4 stagioni** invece di crollare di colpo. La direzione è **a senso unico
  verso il basso**: il muro le impedisce di ri-caricare, l'aging ne erode i
  veterani costosi, il draft inverso rifornisce le rivali. Quindi **no**, non
  mantiene il vantaggio "per anni e anni": lo perde, in modo credibile.
- **Trade AI↔AI: SOLO riallineamento leggero in off-season** (decisione rivista —
  prima erano escluse). Servono a dare **varietà alle rose**, ma con guardrail che
  evitano un trade-AI pesante (ricerca N×N, pacchetti, aste):
  - **1-per-1** dello stesso tipo (bat↔bat, pit↔pit): niente pacchetti → niente
    premio di consolidamento da modellare, niente esplosione di ricerca.
  - **bilanciati per valore**: `|Δ playerValue| ≤ REALIGN_VALUE_TOL` (≈3 pt).
  - **cap-legali per ENTRAMBE** dopo lo scambio (rispetto del tetto effettivo).
  - **guidati dal bisogno posizionale**: A cede un **doppione** (ha un pari-ruolo
    quasi equivalente) e riceve un **upgrade** dove è scoperta; B **simmetrico**.
    Stesso valore, **fit migliore per entrambe** — è un riallineamento, non un
    affare.
  - **bounded & deterministico**: al più **una** trade AI↔AI per squadra per
    blocco, ordine di scansione fisso, nessun RNG. Avviene **in parallelo** al
    mercato FA nello stesso blocco.
  - Il **pool** resta la valvola di parità principale (scarico dei forti → deboli);
    le trade AI↔AI aggiungono solo **mescolamento** a parità di valore.
- Le trade con l'**utente** restano una feature a sé (tu proponi, *una* AI valuta
  sì/no), consentite **anche in stagione fino alla deadline** (vedi § Cadenza).

### Cadenza del mercato: stagione vs off-season (decisione di design)

Il mercato ha **due regimi distinti**, per tenere la gestione leggera:

- **Durante la stagione → SOLO scambi** (umano → *una* AI valuta sì/no), fino a una
  **trade deadline a ~gara 103** su 162 (i ~2/3, come la deadline reale di fine
  luglio; `TRADE_DEADLINE_GAME` in `schedule.ts`). Dopo la deadline le rose sono
  **congelate agli scambi** fino all'off-season. **Nessuna firma dal pool FA in
  stagione** e **nessun trade AI↔AI**: il colpo di metà stagione è lo scambio, non
  il mercato dei free agent.
- **A fine anno → off-season** (fase una-tantum + mercato FA a blocchi, §
  Riconciliazione): è qui che avviene la vera ristrutturazione e il riequilibrio
  di parità via pool.

### Draft → depth, non → rosa attiva (niente overfill)

**Decisione di design.** Le scelte del draft inverso entrano nella **profondità**
(`reserveBatters`/`reservePitchers`), **non** nei 26 attivi: sono giocatori reali
*contati* nella franchigia, ma **acquisire ≠ schierare**. Durante l'off-season la
rosa piatta **può sforare** la taglia 20/15 (draft + ripescaggi); la taglia si
**riconcilia solo alla fine**, nel passo **`finalize`** — **è lì che "si decidono
gli X della rosa"**, sia le AI (automatico, per `playerValue`) sia l'utente
(scelta). L'eccedenza (peggior valore) viene tagliata → **pool**; i buchi si
riempiono. Conseguenza sul mercato a blocchi: il trigger di rilascio dell'AI è
**"sopra il cap OPPURE sopra la taglia"**, così la profondità in eccesso dal draft
**defluisce nel pool** durante i blocchi invece di restare bloccata.

### Draft in modalità STORICA: nomi reali, rating ciechi

> ⚠️ **Non ancora implementato.** `generateDraftClass` (`draft.ts`) usa **sempre**
> nomi **fittizi** (`makeNameFactory`) con rating ciechi, senza il ramo storico
> descritto qui: in una lega storica le classi di draft degli anni successivi al
> primo escono con nomi generati, non con i debuttanti reali dell'annata. Il
> design sotto resta il bersaglio; i **rating ciechi** (nessuna preveggenza) sono
> già rispettati — manca solo l'aggancio dei **nomi reali** dall'archivio Lahman.

**Decisione di design.** In una lega storica (import di un'annata, es. 1999) le
classi di draft/ingresso degli anni successivi (2000, 2001, …) usano i **nomi
reali** dei debuttanti di quell'anno (dall'archivio Lahman: nome, età, mano,
ruolo) **ma NON i loro rating derivati dalle stats reali**. Il motivo è il
principio non negoziabile *niente preveggenza* (vedi `players-and-ratings.md` §
Potenziale come STIMA incerta): il draft avviene nell'off-season *prima* di
giocare quella stagione in-game, quindi ratare un rookie dal suo rendimento reale
= sapere in anticipo chi diventerà campione e accaparrarselo. **Vietato.**

Quindi la classe è: **`rating → stats`** con **rating da prospetto CIECO**
(giovane/grezzo, potenziale stocastico come `draft.ts` genera già), i nomi reali
solo per immersione. Il vero fuoriclasse e il vero bidone entrano
**indistinguibili**: l'esito lo decide l'aging (breakout/bust), non la realtà. I
rookie del *primo* anno importato fanno eccezione perché il loro anno di debutto
*è* l'annata importata (la fotografia): lì `stats → rating` è lecito (è il
presente, non il futuro). L'unica alternativa che userebbe le stats reali senza
barare è il *replay* (i rookie compaiono d'ufficio sulle loro squadre reali, non
draftabili) — scartata perché toglie l'agency del draft.

### C'è spazio aggregato? Sì, per costruzione

La curva è calibrata così che il **payroll medio ≈ 194M ≈ 0.78 × cap base
(250M)**, con le stelle fino a ~55M (`salaryFromOverall`, `ratings.ts`):
`Σ stipendi ≈ 23 unità-cap` contro `Σ tetti ≈ 30` → **avanza spazio
aggregato**, quindi un giocatore scaricato trova sempre una destinazione a
stipendio adeguato. L'unico che non si ricolloca è il vero *replacement-level*,
che nella realtà sarebbe fuori dalla lega comunque (churn fisiologico). **La
media-sotto-cap è ciò che garantisce che il pool si svuoti.**

### Il payroll non cresce all'infinito

Lo sviluppo dei giovani spinge il monte **su**; ma i veterani costosi che si
**ritirano** (stipendio → 0, rimpiazzati da rookie al minimo), lo **scarico da
cap** e l'**inflow economico del draft** lo spingono **giù**. Il payroll
**oscilla attorno alla banda del cap**, non monotòno. Tetto = `cap_base + ε`;
pavimento = gli stipendi-minimo di rosa.

## Scambi

- Valutati da un **"valore giocatore"** = mix di:
  - **forza attuale** (overall),
  - **prospettiva/potenziale** in funzione dell'**età** (un giovane con alto
    potenziale vale di più a parità di forza),
  - **stipendio**.
- La CPU **accetta/rifiuta** in base all'**equità** dello scambio (e al rispetto
  del cap da entrambe le parti).
- Niente aste complesse: proposta → valutazione → sì/no.

### `playerValue` è additivo → il "premio di consolidamento" (regola di `evaluateTrade`)

**Decisione di design (emersa provando scambi reali).** `playerValue` è **puramente
additivo** e ha un **pavimento** (il valore minimo di un singolo giocatore è ~il
pavimento dell'overall, ~48-50). Conseguenza: **due giocatori sommano quasi sempre
più di uno**, quindi un vero **2-per-1 "stella ⇄ pacchetto" non risulta MAI
bilanciato** a somma-valore. Non è un difetto dell'atomo (che resta pulito e
serve intatto al cap): è il **decisore** `evaluateTrade` che deve modellare ciò
che `playerValue` non vede — gli **slot roster sono finiti**. Concentrare valore in
un giocatore **libera uno slot** (bene per un contender a rosa piena); frammentarlo
ne **occupa** di più. Quindi `evaluateTrade`:

- applica un **premio di consolidamento** a chi **riduce** il numero di giocatori
  in rosa (riceve meno teste di quante ne cede), e uno **sconto** a chi la
  frammenta;
- il premio scala con quanto la rosa del ricevente è **piena/competitiva** (un
  contender lo paga, un ricostruttore no — a lui i pezzi multipli servono);
- così un 2-per-1 può chiudersi anche con Δ-somma-valore **a favore** di chi cede
  la stella: è il prezzo dello slot, non uno squilibrio.

Resta una regola del **solo decisore** (scambi umano→1 CPU): la riconciliazione
del cap via **pool** non ne ha bisogno (là il valore additivo è esattamente ciò
che serve per lo scarico).

## Draft

- **Semplificato**: un ingresso di giovani, senza le complicazioni di un draft
  annuale a più giri con scouting profondo.
- **Ordine inverso** alla classifica (la peggiore sceglie per prima → prospetti
  migliori ai deboli): è l'"handicap" strutturale del riequilibrio.
- **I prospetti entrano nella DEPTH** (`reserveBatters`/`reservePitchers`), non nei
  26 attivi (vedi § Draft → depth): niente overfill, la taglia si riconcilia al
  `finalize`.
- Budget squadra basilare.

### Draft storico — prospetti con tetto *possibile*, non *certo*

Se si importa una **classe di draft reale**, il principio è lo stesso dell'import
di stagione: importi il **passato** (chi c'era in quella classe), **simuli il
futuro** (chi sboccia). I prospetti entrano con un **potenziale stimato**
(`projectPotential`: headroom ampio perché giovani), **mai** pari al loro picco
reale di carriera. Quindi:

- ✅ *Potenzialmente* i talenti reali possono emergere (il tetto lo consente).
- ❌ **Non** sai in anticipo *chi* diventerà campione: la realizzazione è
  stocastica (`developmentTail` in `aging.ts` → breakout/bust).
- Le **gemme di bassa scelta** che sorprendono sono una **feature**: la classe
  *contiene* il talento, il sim decide chi lo realizza. Niente draft "col senno
  di poi" a colpo sicuro.

## Nota di scope

Se una sessione tende ad aggiungere complessità gestionale (contratti multi-anno,
finanze, tasse), **fermarsi**: è esplicitamente fuori dalla visione. La
managerialità resta un contorno leggero; il cuore del gioco è **scegliere
giocatori/formazioni e le mosse tattiche di partita**.
