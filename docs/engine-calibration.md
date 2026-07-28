# Motore di gioco e calibrazione

## Come si risolve un turno di battuta

1. `batterRates(stats)` e `pitcherRates(stats)` → rate per-PA (in
   `probabilities.ts`).
2. `combineRates(batter, pitcher, ctx)` combina col metodo **odds-ratio / Log5**:
   per ogni esito `rate = rate_batt × rate_lanc / rate_lega`, poi **platoon**
   (vantaggio mano opposta) e **affaticamento** del lanciatore, infine normalizza
   a somma 1.
3. `resolveAtBat` estrae l'esito grezzo (BB/HBP/SO/HR/3B/2B/1B/IPO) con l'RNG.
4. `game.ts` applica l'esito allo stato (basi, out, punteggio), inclusi doppio
   gioco, volata di sacrificio, avanzamenti su singolo/doppio.

Le costanti di corsa sulle basi sono in `TUNING` (`constants.ts`): probabilità di
GIDP, di segnare dalla terza su out, di segnare dalla seconda su singolo, di
arrivare in terza dalla prima, bonus/penalità di platoon, affaticamento.

### Logica di campo sugli out in gioco (`resolveInPlayOut`)

L'out su palla in gioco (`IPO`) non è più "lineare" (battitore eliminato e
corridori fermi): `resolveInPlayOut` decide un **tipo di battuta** e i relativi
**effetti reali** sui corridori. Il tipo (`ground` / `fly` / `popup`) diventa
`PlayEvent.outInfo.ball` ed è la **fonte di verità** condivisa con la UI, così
telecronaca e codice da segnapunti concordano fra loro e con ciò che accade sulle
basi (niente più "out in prima" con un codice di volata). Effetti:

- **Rimbalzo** (`ground`): doppio gioco (corridore in 1ª, `gidpProb`); **scelta
  difensiva** (corridore in 2ª, 1ª e 3ª libere → eliminato verso la 3ª, battitore
  salvo in prima: `outInfo.fc`); **groundout RBI** dalla 3ª. Poi gli avanzamenti,
  distinguendo **forzati** da **produttivi**: col battitore eliminato in prima il
  corridore in 1ª è **sempre** forzato in 2ª (se libera), quello in 2ª è forzato in
  3ª se la 1ª è occupata, la 3ª segna d'ufficio a **basi piene**; gli avanzamenti
  **non forzati** (es. dalla 2ª con 1ª vuota) restano probabilistici
  (`productiveAdvanceOnGrounder`). *(Prima l'avanzamento del corridore forzato
  dalla 1ª era erroneamente gated dietro `productiveAdvanceOnGrounder` ~35%, così
  con 1ª+3ª restava spesso fermo — bug corretto.)*
- **Volata profonda** (`fly`): **volata di sacrificio** / punto dalla 3ª e
  **tag-up 2ª→3ª**.
- **Presa comoda** (`popup`): nessun avanzamento.

Costanti in `TUNING.outField`. L'impatto sull'ambiente-punti è modesto (i corridori
forzati che avanzano restano dentro la banda di realismo 4.3–6.2) e rispettano
l'occupazione delle basi. Coperto dai test in `engine/__tests__/live.test.ts`,
`engine/__tests__/inplayout.test.ts` (avanzamenti forzati) e
`ui/__tests__/scorecode.test.ts`.

## Tattiche interattive (Fase 1) e loro calibrazione

Il motore è una **macchina a stati** (`LiveGame` in `game.ts`): `simulateGame`
non è che `quickSim` con la CPU su entrambe le squadre. Il turno "swing" consuma
l'RNG **esattamente** come in Fase 0 (cambio-lanciatore automatico → `resolveAtBat`
→ `applyEvent`), quindi la calibrazione è intatta. Le tattiche manuali consumano
RNG solo quando vengono scelte: non entrano mai nella simulazione CPU e non
spostano gli aggregati di lega.

- **Rubata** (`stealSuccessProb`, `attemptSteal`) — attiva **Velocità** del
  corridore, **Braccio** del ricevitore e **Difesa/hold** del lanciatore:
  `p = base + speed·perSpeed − arm·perArm − hold·perHold − (rubata di 3a? pen.)`,
  in sigma `(rating−50)/10`, poi clamp `[min,max]`. Costanti in `TUNING.steal`
  (default: base .70, riuscita ~95% per il fulmine contro braccio debole, ~43%
  per il lento contro braccio forte). La rubata **non consuma il turno**.
- **Bunt di sacrificio** (`buntOutcomeProbs`, `buntAtBat`) — attiva la **Difesa**
  del lanciatore e la **Velocità** del battitore. Ripartizione dell'esito:
  `hit` (bunt valido) / `fail` (corridore di testa eliminato) / `pop` /
  `sac` (riuscito, il resto). Costanti in `TUNING.bunt`. Il sacrificio riuscito
  **non addebita l'AB** (non intacca la media); il bunt valido sì (è una hit).
- **Squeeze / bunt suicida** (`squeezeAtBat`, tattica `'squeeze'`) — disponibile
  **solo col corridore in terza** e `<2 out`. Riusa `buntOutcomeProbs` ma il
  corridore in terza **parte al lancio**: `hit` → battitore salvo in prima e il
  corridore **segna**; `sac` → battitore eliminato e corridore **segna**; `fail`
  → il corridore lanciato è **eliminato a casa** (battitore salvo in prima su
  scelta difensiva, niente punto); `pop` → **doppio gioco al piatto** (pop preso,
  corridore doppiato sulla terza). Alto rischio/rendimento: distinto dal sac bunt
  perché l'obiettivo è il punto, ma un bunt sbagliato brucia il corridore.
- **Base intenzionale** (`intentionalWalk`) — avanzamento forzato deterministico
  (nessun RNG); conta come BB.
- **Interni a doppio gioco** (`setDpDepth`, flag `LiveGame.dpDepth`) — difensiva,
  speculare a "interni dentro" (mutuamente escluse). Col **corridore in prima** e
  `<2 out`, sul **rimbalzo** alza la conversione del doppio gioco
  (`gidpProb + TUNING.dpDepth.gidpBonus`, default `.13 → .25`) al costo di qualche
  **buco** (`TUNING.dpDepth.hitThrough` .06: un rimbalzo passa per un singolo,
  `detail:'dphole'`). Flag `false` di default: quando spenta **non consuma RNG** e
  il `gidpProb` resta il valore base → quick-sim e Fase 0 **invariati**.
- **Difendi le righe / anti-extrabase** (`setNoDoubles`, flag `noDoubles`) —
  difensiva tardo-gara per proteggere un vantaggio. In `swingAtBat`, quando il
  risultato è un `2B`/`3B`, con probabilità `TUNING.noDoubles.downgrade` (.50) lo
  **declassa a singolo** (i corridori avanzano una base in meno). Gated sul flag:
  spenta **non consuma RNG**, quindi la calibrazione resta intatta.
- **AI tattica della CPU** (`cpuOffenseTurn`, `cpuTryTactic`) — nel **solo gioco
  interattivo** (quando l'umano difende, bottone "Lancia ▸") la CPU può fare
  *small-ball*: **rubata** (corridore veloce, buone chance, più probabile a fine
  gara equilibrata, rara in blowout), **bunt di sacrificio** (0 out, corridore in
  1ª/2ª, battitore debole, gara in bilico), **hit-and-run** (corridore in 1ª, 2ª
  libera, battitore con buon contatto). Soglie in `TUNING.cpuTactics`. **Non è mai
  chiamata da `autoStep`/`quickSim`**: la Fase 0 e le sim di lega/stagione/playoff
  restano *swing puro* e byte-identiche (guardia nel test `tactics.test.ts`).
- **Micro-eventi pre-lancio** (`prePitchEvent`) — coi **corridori in base**, prima
  che il turno si risolva, può scattare un **lancio pazzo / palla passata / balk**;
  il turno **non è consumato** (il battitore resta al piatto). La *probabilità che
  accada* è guidata dalle doti (marginale): il **Controllo** del lanciatore riduce
  i lanci pazzi, la **Difesa** del ricevitore le palle passate. L'**avanzamento**
  si processa dal corridore di testa e rispetta l'occupazione (mai due corridori
  sulla stessa base, mai un corridore sovrascritto): i corridori indietro salgono
  **facilmente** di una base se quella davanti si libera, ma il corridore in
  **terza va a casa solo con probabilità contenuta** (guidata dalla sua Velocità;
  il **balk** lo manda a segno d'ufficio, per regola). Se nessuno può avanzare (es.
  basi piene col 3ª che tiene), il lancio non produce evento e il turno prosegue.
  Costanti in `TUNING.wildPitch`. Girano **solo nel gioco interattivo**
  (`playOffense`): `autoStep`/`quickSim` non li chiamano mai, quindi l'aggregato di
  lega e la calibrazione restano invariati. Spegnibili con
  `LiveGame.microEvents = false` (usato nelle misurazioni controllate dei test).
  *Taratura*: `wpBase 0.019` (era `0.032`) → un lanciatore di **Controllo** medio
  concede il lancio pazzo nel ~1,9 % dei turni-con-corridori (~0,3/partita, in
  linea con la MLB, prima era ~0,5), scarso ~3,5 %, ottimo verso `wpMin`. Ridotti
  in proporzione anche palla passata (`pbBase 0.009`) e balk (`balk 0.003`) per
  non farli diventare l'evento dominante una volta abbassati i lanci pazzi.
- **Cambio lanciatore** (`changePitcher` manuale / `autoManagePitcher` per la CPU)
  — porta in pedana un rilievo e ne registra `enteredDiff` (per i save).

## Decisioni W/L/SV (Fase 1)

Coerenti col principio "**ERA e W sono risultati**": la **W** va al lanciatore in
pedana quando la sua squadra prende il **vantaggio decisivo** (ultimo cambio di
leadership che regge fino alla fine) → dipende dal supporto offensivo, non
dall'ERA. La **L** va al lanciatore avversario che ha concesso quel run. Un
partente vincente che **non completa 5 inning** (`outs < 15`) cede la W al rilievo
più efficace (più out, poi meno ER). Il **save** va al finisher della vincente,
diverso dal vincitore, entrato con vantaggio 1-3. Vedi `computeDecisions`.

## Epoca target: "alta offesa anni '90/2000"

Non la MLB spenta recente. Aggregati di lega desiderati (misurati su molte
partite generate):

| Metrica | Target |
|---|---|
| Punti / squadra / partita | ~5.0 – 5.4 |
| Media di lega (BA) | ~.270 – .280 |
| OBP | ~.340 |
| HR / squadra / partita | ~1.3 – 1.6 |
| K% | ~18 – 20% |

## Cime di eccellenza (indicazioni, non cifre rigide)

Il campione che vince le classifiche, come indicazione (con le **gemme** rare che
sfondano — vedi la tabella in "Proiezione di lega"):

- **Battitore top**: ~.370 / ~53 HR / ~145 RBI tipico; la gemma d'annata tocca
  .400+ o 60-72 HR *ogni tanto* (~8-10% delle annate), non a comando.
- **Lanciatore top**: ~18-20 W / ~260 K / ERA ~2.4 tipico; la gemma scende sotto
  2.10 o supera 300 K *di rado* (asso vero, rating ~72+).

## ERA e Vittorie NON sono cardini rigidi

**Principio chiave** (vedi anche `CLAUDE.md`): le caratteristiche guidano i
*peripherals* controllabili (K/9, BB/9, WHIP, FIP), che **sì** scalano col
talento. **ERA e W sono risultati** e devono galleggiare:

- Esiste il **lanciatore forte con ERA >3.00 in carriera ma 15-20 W**: ottimi
  peripherals + supporto offensivo + durata. Va supportato, non impedito.
- Le vittorie dipenderanno dal **supporto offensivo** e dal contesto partita
  (chi è in pedana al cambio di vantaggio) → da tracciare con W/L/SV (Fase 1/4).
- Scollegatori ERA-vs-talento: **difesa dietro il lanciatore FATTA** (Fase 4, sotto);
  **varianza di sequenza (BABIP/LOB)** emerge già dalla simulazione. Il **fattore
  stadio** è fuori scope per scelta (non serve a questo livello di affinatezza).

### Difesa dietro il lanciatore (Fase 4)

La qualità del reparto difensivo sposta la **BABIP** e scollega l'ERA dal solo
talento del lanciatore (principio **DIPS**: il lanciatore controlla K/BB/HR, il
resto è difesa + sequenza). Tocca **solo le palle in gioco** (1B/2B/3B ⟷ out su
palla in gioco), **mai** HR/BB/HBP/SO.

- **Metrica**: `teamSynthesis().def` dei 9 schierati (fielding+braccio pesati per
  ruolo, SS/CF/C contano di più, DH escluso) — la **stessa** difesa mostrata nella
  UI Roster, così migliorare i difensori si vede davvero sull'ERA.
- **Legge** (`combineRates`, guidata da `TUNING.defense`): `d = (def − 76)/10` in
  sigma, `f = clamp(1 − d·perSigma, min, max)`; le hit su palla in gioco vengono
  scalate per `f` e la massa spostata dentro/fuori dagli out. **Non consuma RNG**
  (sposta solo le soglie prima del sorteggio: la struttura della Fase 0 è intatta).
- **Neutrale alla media di lega**: `neutral = 76` è la media misurata della metrica
  sul generatore (i ruoli difensivi hanno bonus di forma, quindi **non** 70). Una
  difesa media è un **no-op** → gli aggregati di lega (BA, R/g, ERA di lega)
  restano quelli di Fase 0 (drift BA misurato ~.001). Solo l'ERA del **singolo**
  lanciatore galleggia col reparto dietro di lui.
- **Effetto misurato** (400 gare, su 3 fasce di difesa): la difesa **ottima** (82+)
  toglie **~0.37 ERA**, la **scarsa** (<70) ne aggiunge **~0.35**, oltre al talento
  → uno spread di ~0.7 ERA fra i due estremi. Sensibile ma **non dominante**: il
  lanciatore resta il fattore principale. Test in `engine/__tests__/defense.test.ts`.

Curva ERA↔bravura **del motore** (Log5, gare complete), misurata simulando una
stagione intera con rotazione piena (R/g ~5.4): ovr ~72→ERA ~6.3; ~80→~4.3;
~84→~3.6; ~92→~2.2. Il motore **regredisce ogni sfida verso la media di lega**
(il fenomeno affronta anche avversari forti), quindi comprime i totali: in tutta
la lega restano **~3-6 partenti sotto il 3.00** e l'ERA sotto 2 è appannaggio dei
soli assi. Questo è il **bersaglio** a cui la proiezione dev'essere allineata
(vedi "Proiezione di lega").

## Come ri-calibrare (procedura)

1. I moltiplicatori di derivazione stanno in `ratings.ts` (`deriveBatterStats` /
   `derivePitcherStats`); le medie di lega e le costanti di corsa in `constants.ts`.
2. La causa più comune di offesa "gonfia": la mappatura esponenziale è **convessa**
   (una popolazione centrata a 70 con dispersione ampia rende sopra la media —
   disuguaglianza di Jensen). Per cambiare la *cima* senza spostare la *media*,
   agisci sui `perSigma`; per spostare la media, sui `LEAGUE`.
3. **Misura sempre** dopo una modifica. Script diagnostici usati in Fase 0 (da
   ricreare nello scratchpad, non committare): aggregati di lega su ~400 partite;
   righe stagionali di archetipi (medio/contact/slugger/asso); curva ERA per
   livello via simulazione reale di gare complete.
4. I test `src/engine/__tests__/` codificano gli intervalli dell'epoca e le cime:
   se cambi la taratura, aggiornali di conseguenza.

## Soft-cap sulla media (BA)

`deriveBatterStats` applica un **tetto a rendimenti decrescenti** sulla media:
oltre `BA_CAP` (~.330) l'eccesso conta solo per `BA_SLOPE` (~0.33). Serve perché
la mappatura convessa faceva sfondare i multi-tool oltre .420 di *base* (battere
.400 dev'essere rarissimo, non a comando). Il cap agisce **sopra** la soglia,
quindi **non tocca** il contatto-puro (contact 82 ≈ .324) né la media di lega; vale
ovunque (sim reale, backstory, base della proiezione), così la varianza d'annata
può portare a .400+ solo *di rado*.

## Proiezione di lega e varianza d'annata (`data/projection.ts`)

La leaderboard mostra le stat REALI della squadra gestita e una **proiezione** per
le altre 29 (senza simulare ogni loro partita).

**Regressione verso la media (Log5-like) — il cardine dell'allineamento.**
`deriveBatterStats`/`derivePitcherStats` estrapolano il rating **in solitaria**
(mappa esponenziale: power 90 → ~2× HR, 100 → ~2.9×). Il motore invece fa
affrontare al fenomeno anche avversari forti, quindi **ogni sfida regredisce verso
la media** e i totali si comprimono. Senza correzione la proiezione sfornava
decine di "quasi-fenomeni" che il motore non produce (54 BA≥.317, 40 HR≥40, 22 SP
sotto 3.00, leader 190 RBI, 113 in tutte le 162 gare). La proiezione perciò
**regredisce i rating verso `RATING_AVG` prima di derivare**: `r' = 70 + λ·(r−70)`,
con λ per-dote (`regressBat`/`regressPit` in `projection.ts`). λ più basso =
più compressione; la **velocità** si comprime meno (le SB restano salienti), i
**lanciatori** di più (Log5 li regredisce parecchio). Calibrato perché la
distribuzione proiettata **combaci col motore** (stagioni simulate).

Sopra alla base regredita agiscono ancora due livelli di varianza:

- **stagione su stagione** — un *profilo d'annata* seedato con `form`, asse
  `power`↔contatto, `gamesCap` (disponibilità: pochi arrivano a 162), e **code
  rare** (`powerSpike`/`contactSpike`/`kSpike`/`domSpike`, `collapse`) per le
  **gemme**; `eraLuck` galleggia con pavimento 0.80 (l'ERA sotto 3.00 non è a
  comando). RBI/R sono **risultati** stimati dalla linea (coeff. tarati: leader
  RBI ~150, non ~190);
- **intra-stagione** — curve di forma monotone che si **riallineano** al target
  d'annata entro la giornata 162.

Aggregati di lega della proiezione (allineati al motore): **R/g ~5.4**, **HR/g
~1.45**, BA ~.266. Code realistiche **per lega** (bersaglio, misurato su molte
lega-annate):

| Metrica | Proiezione | Metrica | Proiezione |
|---|---|---|---|
| BA ≥ .317 | ~15 | SP ERA < 3.00 | ~5-7 |
| HR ≥ 40 | ~10 (max ~50) | SP K ≥ 200 | ~12 (top ~260) |
| SB ≥ 45 | ~7 | leader RBI | ~150-158 |
| G = 162 | ~1 (raro "iron man") | RBI ≥ 120 | ~10 |

Ri-tarare: cambia i **λ** di `regressBat`/`regressPit` (compressione delle cime,
non tocca la media di lega perché la mappa è convessa — Jensen); misura con uno
script Monte-Carlo nello scratchpad confrontando **sempre** col bersaglio del
motore (stagione simulata), non a occhio.

## Varietà: fra squadre, fra compagni, code basse

**Fra squadre (modello a stelle + profondità)** — la forza di una franchigia NON
è più un semplice shift uniforme (dava rose tutte-scarse/tutte-forti e payroll
fuori scala, es. $45M con tutti <70 vs $390M con 5 SP >83). Ora
`generateTeamFromFranchise` compone:

- **`teamTalent` morbido** (gauss σ≈2.5, clamp ±6): qualità della **profondità**,
  sposta lievemente tutta la rosa. Centrato su 0 → media di lega invariata.
- **Stelle garantite**: **ogni** squadra, anche la peggiore, ha **1-3 franchise
  player** (bias di talento ~+19); le migliori ne hanno di più. Così nessuna rosa
  è tutta <80 (`STAR_FLOOR`=80, con rete di sicurezza).
- **Pavimenti realistici**: nessun **titolare** di movimento sotto 55
  (`LINEUP_FLOOR`) né **partente** titolare sotto 52 (`ROT_FLOOR`) — via i
  giocatori sotto-replacement e i bracci da Tripla-A dai ruoli di partenza.
- **Assi rari**: solo ~1/3 dei team con 2+ stelle spende una stella sull'asso
  (bias ridotto ×0.65 → un asso ~85, non un fenomeno 92), per non deprimere
  l'offesa dell'epoca.

Risultato: gap di forza fra squadre più contenuto (ogni team ha stelle + depth),
spread del monte-ingaggi **~2.5-3× (compresso, come richiesto)**, e nessuna rosa
irreale. I due pavimenti (lineup/rotazione) si **compensano** nel run-environment.

**Payroll disaccoppiato dal talento (come MLB)** — ogni franchigia ha un
**profilo d'età** (`ageSkew`, gauss σ≈3.2, clamp ±6): win-now vecchia (cara) vs
rebuild giovane (a buon mercato, via `youthFactor`) — **senza toccare la forza**.
Così nascono i **cheap-good** e gli **expensive-mediocre**: la correlazione
payroll↔forza scende a ~0.81 (non più incollata) e **a pari forza** il payroll
varia ~2.4×. In MLB il legame monte-ingaggi↔vittorie è debole; il motore è il
talento giovane a costo controllato.

**Rotazione (gradiente)** — i 5 slot di partente NON sono uguali: `SP_SLOTS`
applica un bias di talento a **media ~0** (asso +5 … #5 −6) più una fascia d'età,
così ogni rosa ha **1-2 partenti forti**, un #3 medio e **#4/#5 più deboli e più
giovani** (back-end da sviluppare, soggetti a rotazione con le riserve SP, anch'esse
giovani). Media ~0 → non sposta la calibrazione di lega, cambia solo la
distribuzione dentro la rotazione (niente "5 assi" su una squadra forte).

**Rotazione (gradiente)** — i 5 slot di partente NON sono uguali: `SP_SLOTS`
applica un bias di talento a **media ~0** (asso +5 … #5 −6) più una fascia d'età,
così ogni rosa ha **1-2 partenti forti**, un #3 medio e **#4/#5 più deboli e più
giovani** (back-end da sviluppare, soggetti a rotazione con le riserve SP, anch'esse
giovani). Media ~0 → non sposta la calibrazione di lega, cambia solo la
distribuzione dentro la rotazione (niente "5 assi" su una squadra forte).

**Fra compagni** — il talento individuale (σ≈7) + gli **archetipi** (`batterArchetype`:
**slugger** HR+/media−, **contact/slap** media+/HR−−, **occhio/OBP** BB+, **velocista**
3B+SB+/HR−−, rara **stella completa**) + la coda rara di **gemme** (~4%) danno forma
varia a parità di overall. Il talento totale (squadra ⊕ individuo ⊕ gemme) ha la
stessa dispersione di prima, ridistribuita: overall σ≈9 (2★–5★ reali), non più σ≈5.

**Code basse realistiche** — con la scala 40-100 il pavimento delle doti è 40, ma le
curve derivate ora sono più ripide dove serve, così esistono i **veri specialisti**
di fascia bassa: gli **slap hitter da 3-6 HR** (perSigma HR 1.42, `LEAGUE.hr` 0.026)
e i tanti giocatori da **0-1 tripli** con qualche specialista a 12-15 (perSigma
velocità 1.82, `LEAGUE.triple` 0.0032; i tripli sono la battuta più rara e skewed).
I tilt archetipo sono ~a somma zero sulla popolazione (aggregati di lega: HR/600 ~20,
BA ~.272), cambia solo la dispersione. La risposta derivata di **doppi** (potenza+contatto) e **basi ball**
(occhio) è stata resa un po' più ampia perché la varietà dei rating si traduca in
varietà di statistiche (σ 2B ~7-8, σ BB ~16 tra i 9 titolari, non più ~4 e ~11).
