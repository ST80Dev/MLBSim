# Calibrazioni per-foto (file JSON)

Qui vanno i file di calibrazione del campo, **uno per foto-stadio**. Il pannello
**🎯 Calibra campo** (in partita) ha il pulsante **«⤓ Esporta file»** che scarica
il JSON già nominato correttamente: basta spostarlo qui e committare.

## Convenzione

- Nome file = **nome della foto senza estensione** + `.json`:
  - `stadiums/BAL.jpg` → `BAL.json`
  - `stadiums/SFG3.jpg` → `SFG3.json`
- Contenuto = l'oggetto di calibrazione completo (i parametri del pannello). Il
  campo `image` (se presente) indica quale foto usare per quello stadio.

## Come si applicano

I file vengono **impacchettati al build** (`import.meta.glob` in
`../stadiumCalibration.ts`): aggiungi il file, committa, e al deploy la
calibrazione è attiva — **nessuna modifica al codice**.

Per uno stadio, se esistono più file (principale + varianti), viene usato il
primo tra: `<ID>.json`, `<ID>2.json`, `<ID>3.json`, … Per forzare una variante,
non mettere il file della principale (o rimuovilo).

In alternativa resta possibile l'override inline in `STADIUM_CALIBRATION`
(`../stadiumCalibration.ts`).
