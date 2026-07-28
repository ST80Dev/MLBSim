# Layer gestione franchigia (volutamente semplice)

Filosofia: divertirsi a costruire e gestire una squadra **senza** la complessità
di un GM manager completo. Tutto ciò che segue è **design per fasi successive**
(non ancora implementato in Fase 0); i campi base esistono già nel modello
(`CareerProfile`: `age`, `potential`, `salary`, `retired`, `twoWay`).

## Piano di esecuzione Fase 5 — cosa è costruibile ORA (5A) vs dopo (5B)

**Decisione di design.** Il layer franchigia è **quasi tutto logica pura** e si
disaccoppia dalla Fase 4 grazie a una cucitura già presente nel motore:
`advanceSeasonBatter/Pitcher(…, perf = 0)` accetta un segnale d'impiego opzionale,
oggi **neutro**. Quindi tutta la meccanica franchigia si costruisce con `perf = 0`
e si collega il `perf` reale (box score reali per la squadra gestita, `projection.ts`
per le 29 CPU) **quando** la Fase 4 chiuderà il rollover di stagione — **senza**
toccarne la struttura.

**Fase 5A — motore franchigia (puro, testabile, ZERO dipendenza da Fase 4):**

1. **`playerValue`** — l'atomo comune a scambi e cap (vedi § sotto). *(fatto/in corso)*
2. **Cap enforce + margine ε** — `effectiveCap(seed, teamId, year) = base × (1+ε)`,
   ε **seedato** e deterministico (niente stato da salvare), con piccola componente
   persistente di franchigia (vedi § Salary cap).
3. **Pool di free agent + riconciliazione** — funzione pura: sopra il *proprio*
   tetto si scarica a valore crescente-dal-basso, sotto si ripesca (vedi §
   Riconciliazione).
4. **Draft inverso** — generazione classe prospetti (`generator` + `projectPotential`,
   tetto *possibile* non certo) + assegnazione a ordine di classifica inversa
   (accetta una qualsiasi mappa di record W-L).
5. **Valutazione scambi** — `evaluateTrade(give, get, capCtx) → sì/no` (equità +
   rispetto cap bilaterale). Motore ora, UI dopo.
6. **`runOffseason(league, seed, year, perf?)`** — orchestratore che cuce 1–5 con
   `perf` di default 0. È la **metà franchigia** del "rollover di stagione" (l'altra
   metà, stagione→scorsa→carriera, resta di Fase 4).

**Fase 5B — UI + accoppiamento con la stagione (RICHIEDE prima la Fase 4):**

- **Finestra di gestione tra le partite** (dove si toccano roster/scambi): dipende
  dal loop di calendario.
- **UI scambi** (proponi → *una* CPU valuta) e **UI draft / riepilogo off-season**.
- **Collegamento del `perf` reale** e **normalizzazione PA battitori**
  (`Σ squadra ≈ 6.180`, vedi § Normalizzazione PA).

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

### Fondazione presente vs da fare

`data/leagueMode.ts` ha già `CapMode` (`hard`/`soft`/`off`) + `capReport`. Il
modello a due confini + ε + riconciliazione è **enforce di Fase 4/5**: oggi
l'indicatore payroll-vs-cap è **solo informativo** (Franchigia/panoramica lega).

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
rispettano il cap) arriva col resto del layer gestionale.

## Evoluzione pluriennale (rollover di stagione) — modello di design

Tutto ciò che segue è **design bancato per Fase 4/5** (rollover + franchigia),
non ancora implementato. Serve a garantire che la lega resti **verosimile e
giocabile per molti anni** senza deriva da GM-manager. Principio-guida: il
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
matching a coppie. Sequenza di ogni off-season, per tutte e 30:

1. **Aging + ri-derivo stipendi** (i payroll si spostano).
2. **Ritiri** → buchi in rosa + monte liberato.
3. **Draft inverso** → gioventù al minimo in ingresso.
4. **Riconciliazione:** ogni squadra sopra il **suo** tetto (`cap_base × (1+ε)`)
   **scarica** i contratti a *peggior valore* (overall-per-$ più basso = i
   veterani strapagati, **non** i giovani economici) nel pool, finché rientra.
5. **Le squadre sotto tetto** pescano dal pool per riempire i minimi/migliorarsi,
   rispettando il proprio tetto.

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
- **Niente trade AI↔AI**, di proposito: il pool ottiene lo stesso riequilibrio
  senza un motore di valutazione+ricerca su 29 squadre. Le trade a coppie restano
  una feature **solo-umana** (tu proponi, *una* AI valuta sì/no).

### C'è spazio aggregato? Sì, per costruzione

La curva è calibrata così che il **payroll medio ≈ 193M ≈ 0.77 × cap base
(250M)**: `Σ stipendi ≈ 23 unità-cap` contro `Σ tetti ≈ 30` → **avanza spazio
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

- **Semplificato**: un ingresso di giovani nel pool, senza le complicazioni di un
  draft annuale a più giri con scouting profondo.
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
