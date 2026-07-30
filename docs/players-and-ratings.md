# Giocatori e caratteristiche

## Scala

Tutte le caratteristiche usano la **scala 40-100**: **70 = media di lega**,
~10 punti = una deviazione standard. Confrontabile fra giocatori. Definita in
`src/engine/ratings.ts` (`RATING_MIN=40`, `RATING_MAX=100`, `RATING_AVG=70`,
`clampRating`).

Scelta di design: ogni giocatore MLB è già un atleta d'élite, quindi il
**pavimento è 40** (nessun professionista sotto quel livello) e le **gemme
arrivano a 100**. L'ampiezza (60 punti) è la stessa della vecchia 20-80: tutti
gli ancoraggi del motore sono espressi *relativamente* a `RATING_AVG`, così la
scala si sposta senza cambiare l'output simulato (stat, ERA, stipendi). Le
**stelle** (UI, `format.ts`/`App.tsx`) mappano 40→1★, 70≈3★, 100→5★
(secchielli da 15 punti).

Il **generatore** (`src/data/generator.ts`) disperde il talento con `sd` ampio
(≈8.5 battitori, ≈9 lanciatori) più una **coda rara di gemme** (~4%): così
l'overall spazia davvero da 2 a 4 stelle con qualche 5★, invece di incollarsi a
3★. Il talento resta **centrato**, quindi cambia la *dispersione*, non gli
aggregati di lega (epoca "alta offesa").

### Elite = SPECIALISTI, non maxati-ovunque (archetipi pesati)

Un OVR alto **non** deve avere 100 in tutto: il 50 HR / 50 SB, i 15 tripli per un
massiccio, il bat-first che difende anche 100 sono irreali. La generazione separa
due componenti:
- **`base`** = livello uniforme (talento di squadra + rumore individuale): dà la
  varietà d'overall, sposta tutte le doti insieme.
- **`spec`** = bonus di **specializzazione** (coda-gemma + bias-stella): fluisce
  nelle doti **CORE** dell'archetipo (peso ~1) ed è **smorzato** sulle **OFF-TYPE**
  (peso ~0.1-0.3). Così una stella è elite nel SUO mestiere e resta media/bassa
  nell'opposto.

**Battitori** (`BATTER_ARCHETYPES`): slugger (potenza, lento), pura-potenza/TTO,
contatto/slap, occhio/OBP, velocista (speed, poca potenza), **battitore completo**
(il vero 96 OVR: elite col bastone, lento, difesa media — RARO), **guanto-first**
(difesa/braccio elite, bastone modesto), equilibrato. La **difesa è disaccoppiata**
dall'attacco (peso spec basso su fielding/arm per i bat-first). Misurato: i
fast-slugger passano dal 4.4% allo **0.8%**, i "5-tool" dal 3.6% allo 0.8%.

**Lanciatori** (`PITCHER_ARCHETYPES`): power/strikeout (tanti K, controllo così
così), finesse/pitch-to-contact (pochi BB e valide, pochi K), sinkerballer (palla
a terra), **flamethrower selvaggio** (stoffa elite ma tante BB), ace completo
(RARO), equilibrato. Anche una squadra **scarsa** ha così il suo power-arm, il
finesse — non 5 cloni allineati all'OVR (spread medio interno alle doti-skill ~25
punti). La **Resistenza è un rating INTRINSECO**, indipendente da bravura *e*
ruolo: centrata sulla media con varianza ampia (sd 14) → dai bracci da 1 ripresa
(~45) ai cavalli (~95). La **difesa del lanciatore** è centrata **sotto** la media
(~57, non ~70): un lanciatore non difende come un interno; solo qualche Maddux
supera 80.

### Un solo pool di bracci → i migliori CON resistenza partono

Niente più pool SP e pool RP separati (davano reliever più forti dei titolari,
"tanto vale spostarli"). Si genera **un unico pool** di 15 bracci; la **rotazione**
sono i 5 con la migliore *attitudine a partire* = `pitcherOverall + 0.9·(resistenza
− media)` (chi non regge non parte); il **closer** è il miglior braccio rimasto
orientato al dominio; poi bullpen e profondità. Effetti:
- la rotazione ha **varianza vera di resistenza** (cavalli da 30+ battitori e
  partenti corti), non tutti allineati a ~72;
- i bracci **top-stoffa ma poco durevoli** finiscono in bullpen (dove esplodono in
  1 ripresa), non sprecati come 5° partente debole;
- ruolo ed endurance sono assegnati dallo **slot** (`setPitcherRole` /
  `deriveStamina`), coerenti per squadra gestita e CPU.

### Swingman (doppio ruolo SP/RP)

`swingCapable(ratings)` marca i bracci con **resistenza da partenza + qualità da
rilievo** (resistenza 60-82, overall ≥ 52): possono fare **entrambi**. In UI
mostrano un chip **SP/RP** (tabella lanciatori e popup), così il giocatore sa chi
può spostare tra rotazione e bullpen. `buildManagedTeam` **ri-assegna ruolo e
ricalcola la resistenza** (`asRole` → `deriveStamina(rating, ruolo)`) secondo lo
slot: un long-reliever forte messo in rotazione diventa un **vero SP** (regge una
partenza intera), un partente in bullpen accorcia — l'endurance segue il *rating*,
non i battitori-soglia della generazione.

### Età alla generazione (`makeAge`)

L'età dei **battitori** e dei **rilievi** non è uniforme: `makeAge` usa una
*split-normal* centrata a 27 (σ sinistra 3.0, destra 5.5) clampata a **[20, 40]**
→ campana asimmetrica con **picco a 26**, **media ~28** (un filo sotto la MLB
reale, "al ribasso"), coda a destra, estremi 20-21 e 38-40 **rari ma possibili**
(~1-2%). I **partenti** invece hanno finestre d'età **per-slot** (`SP_SLOTS`): il
back-end (#4/#5) è più giovane (prospetti da sviluppare).

### Allocazione per merito (best-starts)

I bias di `SP_SLOTS`/`teamTalent` **riducono** ma non **eliminano** il caso in cui
la coda-gemma fa nascere una stella tra panca/riserve mentre un titolare debole
parte (il "5★ tra i Disponibili"). Dopo la generazione si **garantisce** che i
migliori siano attivi:
- **Battitori** — generati per posizione (stesso multiset → copertura invariata),
  il migliore di ogni posizione va in lineup, poi `alignLineupDefense` **permuta i
  9 titolari** al miglior fit *alla posizione* (2ª posizione inclusa, DH al miglior
  bat) e infine `autoLineup` dà l'ordine di battuta.
- **Partenti** — generati col gradiente `SP_SLOTS`, poi i 5 migliori in rotazione
  (n.1 = asso), i più deboli in profondità.
- **Bullpen coerente** — non rilievi a caso: un **closer** shutdown
  (dominio+controllo), un **setup**/candidato-closer (stessa stoffa, poca
  resistenza), **2 long-reliever** (resistenza alta) e i **middle** fungibili (con
  profondità, best-starts fra loro). Il `tilt` per-dote di `makePitcherRatings`
  modella l'archetipo a somma ~0 (non sposta gli aggregati).

Popolazione invariata (stessi ruoli/posizioni, stesso `teamTalent`) → **aggregati
di lega invariati**: cambia solo *quale slot* occupa ciascuno.

### Uso della rotazione nella simulazione

`makeSide` (engine) fa sempre partire `rotation[0]`. Con la rotazione **ordinata**
(n.1 = asso), senza accorgimenti ogni squadra lancerebbe l'asso in **ogni** partita
(ambiente-punti ~3.9 R/gara). La sim di stagione (`data/season.ts`) e il test di
realismo ruotano il partente col giorno via `withRotationStarter(team, n)`, così i
5 SP girano equamente e l'ambiente resta in epoca (~5.4 R/gara).

## Caratteristiche del battitore (6) — `BatterRatings`

Criterio: **ognuna governa UNA sola leva** del motore (zero ridondanza).

| Dote | Governa | Nota |
|---|---|---|
| **Contatto** | battute valide / media (↑ singoli, ↓ strikeout) | la parte "AVG" |
| **Potenza** | extrabase e fuoricampo | la parte "SLG" |
| **Occhio** | basi ball (↑ OBP, lieve ↓ strikeout) | la parte "OBP" |
| **Velocità** | rubate, tripli, basi extra in corsa | rubate e bunt attivi (Fase 1) |
| **Difesa** (fielding) | palle in gioco → out, doppi giochi, **errori** (reached-on-error) | **attiva**: pesata per reparto (interni sui rimbalzi, esterni sugli extrabase); vedi `engine-calibration.md` |
| **Braccio** | eliminare ladri di base (ricevitore), assist esterni | attivo sulle rubate (Fase 1) e nella sintesi difensiva per reparto |

## Caratteristiche del lanciatore (6) — `PitcherRatings`

| Dote | Governa |
|---|---|
| **Dominio** (stuff) | strikeout |
| **Controllo** (control) | pochi base ball concessi |
| **Movimento** (movement) | poche battute valide concesse |
| **Palla a terra** (groundball) | pochi HR concessi + doppi giochi |
| **Resistenza** (stamina) | quanti battitori regge prima di calare |
| **Difesa** (fielding) | tenere i corridori (hold) e difesa sui bunt (attivo Fase 1); ritorni/cut-off in seguito |

**Dominio vs Controllo** sono indipendenti: esiste il tutto-Dominio/poco-Controllo
(tanti K ma tante basi ball) e il contrario ("pitch to contact").

## Doppio ruolo

Raro giocatore che batte **e** lancia: flag `twoWay` in `CareerProfile`; porta
entrambi i blocchi di caratteristiche e compare sia nel lineup sia nello staff.
(Non ancora generato in Fase 0 — probabilità bassissima, ~1%.)

## Seconda posizione difensiva

Campo opzionale `secondaryPosition` sul `Batter`: **quasi tutti** i giocatori
(~95%) hanno un secondo ruolo, scelto da un insieme **fisso** di coppie
plausibili e adiacenti (`SECONDARY_OPTIONS` in `src/engine/positions.ts`) — niente
"ovunque". Serve a garantire abbastanza **duttilità** dentro ogni rosa: anche se i
ruoli PRIMARI sono un po' sbilanciati, ogni casella ha di norma ≥2 coperture (fine
delle rose con "3 SS e 1 solo LF"). Le fasce panchina/profondità sono anch'esse
distribuite per non accumulare doppioni.

Il **DH** non è un ruolo difensivo ma uno slot di battuta: il generatore gli dà una
**vera casa difensiva** (un angolo/ricevitore, `DH_HOME_POSITIONS`) come posizione
secondaria, e `fieldingAtPosition` la tratta come casa naturale (difende bene lì,
paga la penalità solo altrove). Così un DH è "un 1B/angolo che oggi riposa il
guanto", non un vuoto difensivo, e può rientrare in campo.

Se schierato nella seconda posizione, cambia **solo la difesa** (fielding): è una
skill legata al ruolo, mentre contatto/potenza/occhio/velocità/braccio sono del
giocatore e restano. La variazione dipende dalla *domanda difensiva* del ruolo
(`ratingsAtPosition`): verso un ruolo più facile la difesa può anche salire,
verso uno più duro scende, meno una penalità fissa di adattamento (fuori ruolo
naturale). Quindi "variata, non per forza in calo".

In UI (scheda *Rose & caratteristiche*) i giocatori idonei mostrano un toggle
`⇄ <ruolo>`: al clic DIF/OVR si aggiornano subito, così si vede la variazione.

Il cambio è uno **scambio difensivo** (`computeSwap`/`applyAlignment` in
`positions.ts`): il giocatore prende il nuovo ruolo e chi lo occupava passa al
ruolo lasciato libero — ma **solo se può coprirlo** (naturale, seconda posizione,
o DH). Così il campo resta sempre valido (un giocatore per ruolo, niente buchi).
Lo schieramento è **stato persistente** della squadra: vale per lineup, box score
e **Diamond**, si mantiene tra le partite dello stesso matchup e si azzera con
*Nuove squadre*. L'impatto sui risultati arriverà quando la difesa conterà
davvero (Fase 4); per ora cambia posizioni mostrate e forza difensiva.

## Derivazione caratteristiche → statistiche

In `src/engine/ratings.ts`:
- `deriveBatterStats(ratings, pa=650)` e `derivePitcherStats(ratings, bf=1000)`
  usano `ratingMult(rating, perSigma)` = moltiplicatore 1.0 a `RATING_AVG` (70),
  ×`perSigma` ogni 10 punti. A tutte le doti = 70 si ottengono le medie di lega.
- I moltiplicatori sono **tarati** (vedi `docs/engine-calibration.md`): non
  toccarli senza rimisurare gli aggregati.
- **Battute valide ∝ AB, non PA.** BB e HBP consumano una PA che NON è un AB:
  gli esiti da AB (SO e valide) si scalano sugli **AB** (`ab·AB_SCALE`, con
  `AB_SCALE = 1/(1−bb−hbp)` che riporta il giocatore *medio* esattamente a `pa` →
  media di lega **neutra**). Effetto: chi cammina di più ha meno AB → **meno hit** —
  niente più "BB alte E media alta insieme" (un occhio-100 alza l'OBP coi walk, non
  la media). L'inverso `statsToRatings` divide per la stessa base-AB (round-trip
  coerente).
- `deriveStamina(rating, role)` converte la Resistenza in soglia di battitori.
- `batterOverall` / `pitcherOverall` = media pesata delle doti (40-100).
- `salaryFromOverall(overall)` = curva base dello stipendio (milioni). La curva è
  **calibrata** perché il payroll **medio** di squadra stia sotto il cap base
  (vedi `docs/franchise.md` § Salary cap); non toccarla senza rimisurare i
  monte-ingaggi con lo script di probe.
- `salaryFor(overall, age)` = `salaryFromOverall(overall) × youthFactor(age)`: lo
  stipendio **effettivo** usato ovunque (generatore, import, aging). `youthFactor`
  sale da ~0.4 a 21 anni a 1.0 a ~27 (sconto gioventù *stateless*, modello
  "B-lite" — vedi `docs/franchise.md` § Stipendi). Un neo-draftato entra vicino al
  minimo e si apprezza mentre matura.

## Minutaggio: PA/gare non uniformi

Le linee di **stagione proiettata** (backstory "scorsa"/"storico" nel roster e le
29 squadre CPU nella leaderboard) non danno 650 PA a tutti. `data/projection.ts`
(`seasonalPA`) modella il minutaggio per:
- **Fascia di rosa** — `starter` (~150 gare, ma con varianza: dai 46 ai 162),
  `bench` (primo backup, ~63 gare mediane), `reserve` (poche gare, mediana ~27,
  da chi è sceso in campo pochissimo a chi è arrivato da un'altra squadra e ha
  giocato molto — coda ~12%).
- **Età** (`ageplayFactor`) — giovanissimi (call-up/part-time) e veterani
  (logorio) giocano meno del picco 24-34.
- **Overall** (`ovrplayFactor`) — i migliori reggono il posto (~1.0 dal 3° stellato
  in su), i **1-2 stelle giocano poco** anche se in rosa (alternati, spediti in
  minor, rimpiazzati): un 2★ ha mediana ~42 gare, ~92 se costretto titolare in una
  squadra debole, contro le ~160 di un 4★ titolare.
- **Annata** — forma/infortunio (`prof.paMult`), che fa galleggiare le gare.

La squadra dell'utente, appena gioca, usa comunque le stat **reali** dai box score
(`data/season.ts`): la proiezione è solo la backstory finché non esistono stagioni
davvero giocate.

## Inversione statistiche → caratteristiche (import storico)

In `src/engine/statsToRatings.ts` — l'**inverso** della derivazione, per
importare una stagione reale: dal tabellino si stimano le doti che, ri-derivate,
lo riproducono. `ratingFromMult(mult, perSigma) = 70 + 10·ln(mult)/ln(perSigma)`
inverte `ratingMult`; `mult` = rate osservato / rate di lega.

- **Battitore** (`ratingsFromBatterStats`): Occhio ← BB (leva pulita); Potenza ←
  media pesata **HR (0.8)** + 2B (0.2) — l'HR è la leva marcante dell'epoca, i
  doppi la sfumano; Contatto ← media di singoli e strikeout (dato l'Occhio);
  Velocità ← media di SB (leva diretta) e tripli (data la Potenza).
- **Lanciatore** (`ratingsFromPitcherStats`): Dominio ← K; Controllo ← BB (meno
  = più); Palla-terra ← HR (meno = più); Movimento ← hit non-HR; Resistenza ←
  battitori per partenza (inverte `deriveStamina`).
- **Non deducibili dal tabellino**: Difesa/Braccio del battitore (archetipo di
  ruolo) e Difesa del lanciatore (50). Sono skill di campo, non offensive.

**Round-trip fedele ma non bit-esatto**: dove una dote governa più leve (Potenza
su HR *e* 2B) le stime sono mediate, quindi restano piccoli residui (misurati nei
test); e il **soft-cap sulla media** comprime i .350+ storici in derivazione. È
per costruzione: lo snapshot storico ha le **statistiche** come verità, i rating
sono una stima per pilotare il motore (vedi `docs/roadmap-and-status.md` § Fase 2).

## Evoluzione età/potenziale

In `src/engine/aging.ts` (`advanceSeasonBatter`, `advanceSeasonPitcher`):
- **< 27 anni**: crescita verso il potenziale (più rapida da giovanissimi).
- **27-30**: picco, stabile.
- **> 30**: declino; calano **prima le doti fisiche** (Potenza, Velocità,
  Dominio, Resistenza, Braccio) e **poi le tecniche** (Contatto, Occhio,
  Controllo, Movimento, Difesa).
- **Ritiro** automatico quando età alta + overall crollato.
- Dopo l'evoluzione le statistiche vengono ri-derivate dalle nuove caratteristiche.
- Lo **stipendio** viene ri-derivato con `salaryFor(overall, età)`: cala coi
  veterani in declino, sale coi giovani che maturano (doppia spinta overall +
  youthFactor).

### Potenziale DINAMICO (`driftPotential`)

Il **potenziale non è più un verdetto scolpito alla nascita**: galleggia di anno
in anno, così il futuro resta aperto e non lo si "legge" dalla rosa fin dal
primo giorno. `driftPotential` (in `aging.ts`) muove il tetto **senza consumare
RNG** (drift = funzione deterministica della coda già estratta + segnale di
rendimento), per non disturbare calibrazione né stream degli avanzamenti:
- **Breakout** → il soffitto si alza (talento emerso oltre le attese);
  **bust/crollo** → si abbassa (il prospetto che non sboccia). Deriva dallo
  `shift` di `developmentTail`, che ora ritorna `{ shift, kind }`.
- **`perf`** — parametro opzionale (default `0` = neutro): segnale di
  rendimento/utilizzo stagionale, **simmetrico** tra squadra umana (dai box score
  reali, `data/season.ts`) e 29 CPU (dalla stagione proiettata, `data/projection.ts`),
  **standardizzato e clampato a [−2, +2]** perché nessun lato oscilli più
  dell'altro. `perf > 0` (sopra le attese / molto impiegato) alza il tetto;
  `perf < 0` (sotto le attese o "non usato") lo abbassa — "use it or lose it".
  La coda breakout/bust resta **identica per tutti e 30 i club** (stesso codice,
  stesse probabilità). *Nota:* l'offseason che chiamerà `advanceSeason*` passando
  `perf` è **fase futura**; oggi (solo test) `perf` resta 0 e a muovere il tetto
  è la sola coda breakout/bust.
- **Veterani (> 30)**: il tetto **converge verso l'overall** (erosione ≥1/anno),
  niente soffitti alti fantasma su chi è già in discesa.
- **Invariante**: il tetto non scende mai sotto l'overall corrente (un soffitto
  già superato non ha senso) e resta in scala 40-100.

### "Nebbia di scouting" in rosa — nessun tetto nudo

La UI **non mostra più il numero di potenziale nudo** (che svelava il futuro): al
suo posto una **fascia direzionale stimata** (`growthOutlook` in `ui/App.tsx`),
stabile per giocatore (seed sull'id) ma volutamente imprecisa:
- **giovane con margine** → `▲lo-hi` (upside, ampiezza cresce con gioventù e
  margine; la fascia *contiene* il potenziale vero senza rivelarlo);
- **picco / nessun margine** → numero secco;
- **veterano (> 30)** → `▼lo-hi` **inferiore all'attuale**, stimato dalla curva di
  declino di `seasonDelta`: la tensione si sposta sul "quanto in fretta cala?".

### Impiego → crescita (design Fase 4, non ancora attivo)

La crescita dei **giovani** dipenderà dall'**impiego** (partite/PA giocate), così
che panchinare un prospetto **costi** in sviluppo — l'unica leva "manageriale"
aggiunta (allenamento e mantenimento veterani: **scartati**; il declino resta
**età-only**). Segnale = impiego reale (squadra gestita, dai box score) o
proiettato (`projection.ts`, 29 CPU), letto verso un carico pieno da titolare. Le
PA proiettate dei battitori andranno **normalizzate al budget-squadra** (~6.180)
prima di alimentare l'aging. Dettaglio in `docs/franchise.md` § Evoluzione
pluriennale.

### Potenziale come STIMA incerta

`projectPotential(rng, overall, age)` (`ratings.ts`) assegna il tetto come
**headroom casuale** sopra l'overall attuale: ampio da giovani (`gauss(8,4)` sotto
i 24), quasi nullo dopo il picco. È una **stima**, non un dato certo — usata sia
dai giocatori **generati** sia dall'**import storico** (che NON guarda il picco
reale futuro: dal seed di una stagione il futuro **non è un replay noto**, così
non sai in anticipo quale giovane diventerà campione).

### Code di sviluppo (bust / breakout)

`developmentTail` aggiunge, a livello di **stagione**, rare deviazioni forti che
fanno **divergere la carriera** dalla media (e dalla realtà storica):
- giovani (< 28): ~6% **breakout** (salto inatteso), ~7% **bust/stallo** (il
  prospetto che non sboccia) → il talento *tende* a emergere, ma non è garantito;
- veterani (≥ 31): ~8% **crollo** extra (infortunio/caduta improvvisa).

Misurato: 400 carriere con **partenza identica** (giovane, potenziale 78) su 5
stagioni finiscono tra ~64 e 80 di overall (sd ~2.6) — imprevedibilità reale nei
singoli, pur mantenendo il **trend medio** corretto (il talento cresce comunque).
