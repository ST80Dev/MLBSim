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
- **Base intenzionale** (`intentionalWalk`) — avanzamento forzato deterministico
  (nessun RNG); conta come BB.
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
- Gli scollegatori ERA-vs-talento da introdurre: **difesa dietro il lanciatore**,
  **fattore stadio**, e **varianza di sequenza (BABIP/LOB)**.

Curva ERA↔bravura misurata in Fase 0 (media, gare complete, lega calda): livello
doti 50→ERA ~4.3; 60→~3.2; ~61 è la soglia del 3.00; 66→~2.4; 72→~1.8; 80→~1.4.
Con la distribuzione generata, **~8-10 partenti sotto il 3.00 in tutta la lega** —
è un valore desiderato, l'ERA sotto 2 resta appannaggio dei soli assi.

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
le altre 29 (senza simulare ogni loro partita). Due livelli di varianza:

- **stagione su stagione** — un *profilo d'annata* seedato con `form` (livello
  generale: molte stat su/giù INSIEME), asse `power`↔contatto, e **code rare**
  (`powerSpike`/`contactSpike`/`kSpike`/`domSpike` ~5%, `collapse` ~7%) che
  producono le **gemme** (non legate al rating tutti gli anni);
- **intra-stagione** — curve di forma monotone che si **riallineano** al target
  d'annata entro la giornata 162 (tanta varianza a inizio anno, poi converge).

Distribuzione del **campione di lega** (leader per annata, misurata su ~48
lega-annate; p50 / p90 / max — gemma = coda rara "ogni tanto"):

| | p50 | p90 | max | %gemma |
|---|---|---|---|---|
| HR | 55 | 60 | 65 | 60+ ≈ 13% |
| BA | .379 | .402 | .42 | .400+ ≈ 13% |
| K | 264 | 307 | — | 300+ ≈ 17% |
| ERA | 2.39 | 1.96 | — | ≤2.10 ≈ 15% |

Giocatore tipico (mediana titolari): **BA ~.263, ~20 HR**; ERA SP mediana ~4.78.
Ri-tarare: gli SD di routine restano piccoli (il **max su ~600** amplifica già la
coda ~3σ), le gemme sono termini **additivi e limitati**; misura con uno script
Monte-Carlo nello scratchpad (distribuzione del leader + % gemme), non a occhio.

## Varietà: fra squadre, fra compagni, code basse

**Fra squadre** — `generateTeamFromFranchise` estrae un `teamTalent` (gauss, σ≈5)
che sposta TUTTI i giocatori della rosa su/giù insieme: alcune franchigie sono da
contender, altre da cantina (le stagioni non finiscono tutte sul .500). Centrato
su 0 → la media di lega non si sposta.

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
