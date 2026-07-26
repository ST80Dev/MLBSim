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
   (una popolazione media a 50 rende sopra la media). Per cambiare la *cima* senza
   spostare la *media*, agisci sui `perSigma`; per spostare la media, sui `LEAGUE`.
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
| HR | 53 | 60 | 72 | 60+ ≈ 10% |
| BA | .374 | .398 | .424 | .400+ ≈ 8% |
| K | 261 | 297 | 359 | 300+ ≈ 8% |
| ERA | 2.38 | 2.07 | 1.77 | ≤2.10 ≈ 15% |

Giocatore tipico (mediana titolari): **BA ~.263, ~20 HR**; ERA SP mediana ~4.78.
Ri-tarare: gli SD di routine restano piccoli (il **max su ~600** amplifica già la
coda ~3σ), le gemme sono termini **additivi e limitati**; misura con uno script
Monte-Carlo nello scratchpad (distribuzione del leader + % gemme), non a occhio.
