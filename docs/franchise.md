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

## Modalità di lega e squilibrio (generata vs import storico)

**Decisione di design.** La lega **generata** ha talento ~gaussiano centrato su
50: le squadre partono di **forza simile**, quindi il **cap rigido** ha senso
(parità della sandbox gestionale). L'**import storico** è diverso: le rose reali
**non sono bilanciate** — le squadre vincenti hanno giocatori con stat/rating
migliori, le perdenti peggiori. È la **verità dello snapshot** e va **abbracciata,
non ri-bilanciata** (ri-livellare falserebbe la stagione reale).

Esempio misurato (import 1999): **CLE** ha lineup ovr ~55.6 ma **rotazione ~47**
(sotto media, com'era davvero), **BOS** rotazione ~55.5 (Pedro); negli scontri
diretti **CLE vince solo ~35%**. Una squadra realmente scarsa dell'annata starebbe
molto più in basso.

Conseguenza sul cap: `salaryFromOverall` scala col talento, quindi una corazzata
storica implica un **monte-ingaggi alto** che sfonderebbe un cap rigido. Perciò:

- **Lega generata** → cap **rigido** (`hard`).
- **Import storico** → cap **morbido** (`soft`, sforabile) o **off**: non impedire
  di rivivere l'annata reale.

Fondazione in `src/data/leagueMode.ts`: `LeagueMode` (`source` + `SalaryCapPolicy`
con `mode: 'hard' | 'soft' | 'off'`), costanti `GENERATED_MODE`/`HISTORICAL_MODE`,
e utilità `teamPayroll`/`capReport`. L'**enforce** vero (scambi/rinnovi che
rispettano il cap) arriva col resto del layer gestionale.

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
