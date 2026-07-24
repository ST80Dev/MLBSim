# Layer gestione franchigia (volutamente semplice)

Filosofia: divertirsi a costruire e gestire una squadra **senza** la complessità
di un GM manager completo. Tutto ciò che segue è **design per fasi successive**
(non ancora implementato in Fase 0); i campi base esistono già nel modello
(`CareerProfile`: `age`, `potential`, `salary`, `retired`, `twoWay`).

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
- `salary` è derivato dall'overall (`salaryFromOverall` in `ratings.ts`) e si
  aggiorna quando il giocatore evolve.

## Salary cap

- **Cap rigido da rispettare** quando componi/scambi la rosa (evita di ammassare
  troppe stelle strapagate).
- **Niente** luxury tax, multe per sforamento, o gestione finanziaria della
  franchigia. Solo un tetto da non superare.

## Scambi

- Valutati da un **"valore giocatore"** = mix di:
  - **forza attuale** (overall),
  - **prospettiva/potenziale** in funzione dell'**età** (un giovane con alto
    potenziale vale di più a parità di forza),
  - **stipendio**.
- La CPU **accetta/rifiuta** in base all'**equità** dello scambio (e al rispetto
  del cap da entrambe le parti).
- Niente aste complesse: proposta → valutazione → sì/no.

## Draft

- **Semplificato**: un ingresso di giovani nel pool, senza le complicazioni di un
  draft annuale a più giri con scouting profondo.
- Budget squadra basilare.

## Nota di scope

Se una sessione tende ad aggiungere complessità gestionale (contratti multi-anno,
finanze, tasse), **fermarsi**: è esplicitamente fuori dalla visione. La
managerialità resta un contorno leggero; il cuore del gioco è **scegliere
giocatori/formazioni e le mosse tattiche di partita**.
