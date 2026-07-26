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

## Caratteristiche del battitore (6) — `BatterRatings`

Criterio: **ognuna governa UNA sola leva** del motore (zero ridondanza).

| Dote | Governa | Nota |
|---|---|---|
| **Contatto** | battute valide / media (↑ singoli, ↓ strikeout) | la parte "AVG" |
| **Potenza** | extrabase e fuoricampo | la parte "SLG" |
| **Occhio** | basi ball (↑ OBP, lieve ↓ strikeout) | la parte "OBP" |
| **Velocità** | rubate, tripli, basi extra in corsa | rubate e bunt attivi (Fase 1) |
| **Difesa** | palle in gioco → out, errori | (difesa sul campo: Fase 4) |
| **Braccio** | eliminare ladri di base (ricevitore), assist esterni | attivo sulle rubate (Fase 1) |

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
- `deriveStamina(rating, role)` converte la Resistenza in soglia di battitori.
- `batterOverall` / `pitcherOverall` = media pesata delle doti (40-100).
- `salaryFromOverall` = stipendio annuale (milioni) dall'overall.

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
- Ogni giocatore ha un solo **potenziale** (tetto 40-100). Dopo l'evoluzione le
  statistiche vengono ri-derivate dalle nuove caratteristiche.

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
