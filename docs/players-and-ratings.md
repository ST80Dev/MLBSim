# Giocatori e caratteristiche

## Scala

Tutte le caratteristiche usano la **scala scout 20-80**: **50 = media di lega**,
~10 punti = una deviazione standard. Confrontabile fra giocatori. Definita in
`src/engine/ratings.ts` (`RATING_MIN/MAX/AVG`, `clampRating`).

## Caratteristiche del battitore (6) — `BatterRatings`

Criterio: **ognuna governa UNA sola leva** del motore (zero ridondanza).

| Dote | Governa | Nota |
|---|---|---|
| **Contatto** | battute valide / media (↑ singoli, ↓ strikeout) | la parte "AVG" |
| **Potenza** | extrabase e fuoricampo | la parte "SLG" |
| **Occhio** | basi ball (↑ OBP, lieve ↓ strikeout) | la parte "OBP" |
| **Velocità** | rubate, tripli, basi extra in corsa | |
| **Difesa** | palle in gioco → out, errori | |
| **Braccio** | eliminare ladri di base, assist esterni | attivo dalla tattica (Fase 1+) |

## Caratteristiche del lanciatore (6) — `PitcherRatings`

| Dote | Governa |
|---|---|
| **Dominio** (stuff) | strikeout |
| **Controllo** (control) | pochi base ball concessi |
| **Movimento** (movement) | poche battute valide concesse |
| **Palla a terra** (groundball) | pochi HR concessi + doppi giochi |
| **Resistenza** (stamina) | quanti battitori regge prima di calare |
| **Difesa** (fielding) | ritorni, bunt, cut-off, tenere i corridori (attivo Fase 1+) |

**Dominio vs Controllo** sono indipendenti: esiste il tutto-Dominio/poco-Controllo
(tanti K ma tante basi ball) e il contrario ("pitch to contact").

## Doppio ruolo

Raro giocatore che batte **e** lancia: flag `twoWay` in `CareerProfile`; porta
entrambi i blocchi di caratteristiche e compare sia nel lineup sia nello staff.
(Non ancora generato in Fase 0 — probabilità bassissima, ~1%.)

## Seconda posizione difensiva

Campo opzionale `secondaryPosition` sul `Batter`: **solo alcuni** giocatori
(~35%) hanno un secondo ruolo, scelto da un insieme **fisso** di coppie
plausibili (`SECONDARY_OPTIONS` in `src/engine/positions.ts`) — niente "ovunque".

Se schierato nella seconda posizione, cambia **solo la difesa** (fielding): è una
skill legata al ruolo, mentre contatto/potenza/occhio/velocità/braccio sono del
giocatore e restano. La variazione dipende dalla *domanda difensiva* del ruolo
(`ratingsAtPosition`): verso un ruolo più facile la difesa può anche salire,
verso uno più duro scende, meno una penalità fissa di adattamento (fuori ruolo
naturale). Quindi "variata, non per forza in calo".

In UI (scheda *Rose & caratteristiche*) i giocatori idonei mostrano un toggle
`⇄ <ruolo>`: al clic il ruolo attivo cambia e DIF/OVR si aggiornano subito, così
si vede la variazione e si decide se tenerla. L'impatto sul motore di gioco
arriverà quando la difesa conterà davvero (Fase 4).

## Derivazione caratteristiche → statistiche

In `src/engine/ratings.ts`:
- `deriveBatterStats(ratings, pa=650)` e `derivePitcherStats(ratings, bf=1000)`
  usano `ratingMult(rating, perSigma)` = moltiplicatore 1.0 a 50, ×`perSigma`
  ogni 10 punti. A tutte le doti a 50 si ottengono le medie di lega.
- I moltiplicatori sono **tarati** (vedi `docs/engine-calibration.md`): non
  toccarli senza rimisurare gli aggregati.
- `deriveStamina(rating, role)` converte la Resistenza in soglia di battitori.
- `batterOverall` / `pitcherOverall` = media pesata delle doti (20-80).
- `salaryFromOverall` = stipendio annuale (milioni) dall'overall.

## Evoluzione età/potenziale

In `src/engine/aging.ts` (`advanceSeasonBatter`, `advanceSeasonPitcher`):
- **< 27 anni**: crescita verso il potenziale (più rapida da giovanissimi).
- **27-30**: picco, stabile.
- **> 30**: declino; calano **prima le doti fisiche** (Potenza, Velocità,
  Dominio, Resistenza, Braccio) e **poi le tecniche** (Contatto, Occhio,
  Controllo, Movimento, Difesa).
- **Ritiro** automatico quando età alta + overall crollato.
- Ogni giocatore ha un solo **potenziale** (tetto 20-80). Dopo l'evoluzione le
  statistiche vengono ri-derivate dalle nuove caratteristiche.
