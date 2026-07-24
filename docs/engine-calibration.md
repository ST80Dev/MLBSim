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

Il campione che vince le classifiche, come indicazione (ci scappa anche la
stagione fuori scala tipo 60 HR o .360):

- **Battitore top**: ~.340 / 45-50 HR / ~130 RBI. Il contact hitter puro sfiora
  .340 con pochi HR; lo slugger puro fa 45-53 HR.
- **Lanciatore top**: ~20 W / ~200-270 K / ERA sotto 2 (asso vero, rating ~72+).

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
