import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Team } from '../engine/types';
import type { GameResult } from '../engine/game';
import type { LiveGame, LiveSituation } from '../engine/game';
import {
  createLiveGame,
  situation,
  toGameResult,
  autoManageDefense,
  quickSim,
} from '../engine/game';
import { buildManagedTeam } from '../engine/arrangement';
import { saveStore } from '../data/persistence';
import type { MatchArrangement } from '../data/persistence';
import {
  GENERATED_MODE,
  HISTORICAL_MODE,
} from '../data/leagueMode';
import type { LeagueMode, LeagueSource } from '../data/leagueMode';
import {
  generateLeague,
  teamById,
} from '../data/league';
import {
  buildHistoricalLeague,
  DEFAULT_HISTORICAL_YEAR,
} from '../data/historical/league';
import { generateSchedule, REGULAR_GAMES, TRADE_DEADLINE_GAME } from '../data/schedule';
import type { ScheduleGame } from '../data/schedule';
import {
  createSeason,
  ensureSeason,
  advanceWithResult,
  recordOf,
} from '../data/season';
import type { SeasonState } from '../data/season';
import { suggestedStarter, withStarterId } from '../data/rotation';
import { withRotationStarter, rotationPhase } from '../data/generator';
import { withFormLineup } from '../data/formLineup';
import {
  seedPlayoffs,
  recordManagedGame,
  simRestOfPlayoffs,
  nextManagedGame,
} from '../data/playoff';
import type { PlayoffState, NextGame } from '../data/playoff';
import { stadiumImage, assetUrl } from '../data/stadiumImages';
import { getCalibrationFor, calibratedVariants } from '../data/stadiumCalibration';
import type { FieldCalibration } from '../data/stadiumCalibration';
import { gameSeed, newRandomSeed } from './format';

import { PlayerModal, PlayerModalContext } from './player-modal';
import type { PlayerModalRequest } from './player-modal';
import { TeamBadge } from './widgets';
import { FinalOverlay } from './game-lineup';
import { RecapModal } from './game-recap';
import { GameScreen } from './game-screen';
import { makeGameStatCtx } from './stat-context';
import { ActionBar } from './game-actionbar';
import { DefenseModal } from './game-defense';
import { RosterPage } from './pages-roster';
import { HomePage } from './pages-home';
import { StartScreen, LeagueOverview, GameInfoBadge, FranchisePage } from './pages-start';
import { LeaderboardPage } from './pages-leaderboard';
import { StandingsPage, PlayoffPage } from './pages-standings';
import { RolloverRecap } from './rollover-recap';
import type { RolloverRecapData } from './rollover-recap';
import { rolloverSeason } from '../data/rollover';
import { TradeScreen } from './trade-screen';
import { CalibrationScreen, CalibrationPanel } from './calibration';
import type { Side, SavedGame } from './types';

type View =
  | 'home'
  | 'roster'
  | 'overview'
  | 'leaderboard'
  | 'standings'
  | 'playoff'
  | 'franchise'
  | 'trades'
  | 'calibrate'
  | 'game';

// Nota: le prime build usavano un unico slot 'principale'; quei salvataggi
// compaiono comunque nell'hub via `saveStore.list()` (retro-compatibili). Le
// nuove carriere usano slot dedicati (`newSlotId`).

/** Id di slot unico per una nuova carriera. */
function newSlotId(): string {
  return `save-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Una partita salvata, arricchita per l'hub di caricamento: metadati dello slot +
 * dati derivati (squadra gestita, anno, giornata, record) letti dal payload.
 */
/**
 * Applica un foglio partita alla squadra gestita ricostruendo lineup, difesa,
 * rotazione e bullpen (vedi `buildManagedTeam`). Senza assetto ritorna la
 * squadra invariata. E' il punto in cui l'editor "entra" nella simulazione.
 */
function applyArrangement(team: Team, arr?: MatchArrangement): Team {
  return arr ? buildManagedTeam(team, arr) : team;
}

// ---------------------------------------------------------------------------
// Mini-popup giocatore (Fase 3): scheda compatta apribile da OVUNQUE compaia un
// nome (roster, partita, leaderboard, home). Per non passare callback attraverso
// tutta la gerarchia, un Context espone `openPlayer`; App monta il modale una
// volta sola con `season`/`seed` correnti. Solo UI: non tocca il motore.
// ---------------------------------------------------------------------------


/**
 * Calibrazione dello stadio di casa per una gara: sceglie (deterministico per
 * seme-partita) una delle foto CALIBRATE dello stadio — principale o doppione —
 * e ne carica foto + marker insieme con `getCalibrationFor`, così non si
 * mischiano mai i marker di una foto con l'immagine di un'altra. Senza foto
 * calibrate, resta la calibrazione della principale (o il default-foto).
 */
function pickMatchCalibration(
  homeId: string,
  leagueSeed: number,
  gnum: number,
): FieldCalibration {
  const variants = calibratedVariants(homeId);
  if (variants.length === 0) return getCalibrationFor(homeId, undefined);
  const pick = variants[Math.abs(gameSeed(leagueSeed, gnum)) % variants.length];
  return getCalibrationFor(homeId, pick.image);
}

// Istantanea dei soli marker sul diamante (basi + corridori + battitore),
// mostrata con ritardo rispetto allo stato reale finché la telecronaca del
// turno non arriva al verdetto. Vedi `shownField` in App.
type FieldSnap = {
  bases: [boolean, boolean, boolean];
  baseRunners: [string | null, string | null, string | null];
  baseRunnerSpeeds: [number | null, number | null, number | null];
  batterName: string | null;
};
const fieldSnap = (s: LiveSituation): FieldSnap => ({
  bases: s.bases,
  baseRunners: s.baseRunners,
  baseRunnerSpeeds: s.baseRunnerSpeeds,
  batterName: s.batter?.name ?? null,
});

export function App() {
  const [leagueSeed, setLeagueSeed] = useState<number>(() => newRandomSeed());
  const [managedId, setManagedId] = useState<string>('');
  const [activeGame, setActiveGame] = useState<ScheduleGame | null>(null);
  const [view, setView] = useState<View>('home');
  const [recapOpen, setRecapOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  // Stadio selezionato nella schermata dedicata "🎯 Stadi".
  const [calTeamId, setCalTeamId] = useState('');
  const [, forceTick] = useReducer((x) => x + 1, 0);
  // Assetti applicati (per teamId) che entrano DAVVERO nella simulazione: la
  // squadra gestita scende in campo con l'ordine di battuta e la difesa scelti
  // nell'editor. Idratati dal salvataggio all'avvio.
  const [arrangements, setArrangements] = useState<Record<string, MatchArrangement>>({});
  // Stato di stagione: giorno corrente, record di lega reali, statistiche reali
  // accumulate dalle partite giocate. Idratato dal salvataggio all'avvio.
  const [season, setSeason] = useState<SeasonState>(() => createSeason());
  // Postseason (Fase 4): tabellone/semine/esiti. Nasce a fine regular season
  // (giornata 162). `null` finché la stagione è in corso. Persistita nel save.
  const [playoff, setPlayoff] = useState<PlayoffState | null>(null);
  // Contesto della gara di playoff in corso (serie, n° gara, avversario, casa):
  // guida seme, rotazione avversaria e registrazione dell'esito.
  const [playoffCtx, setPlayoffCtx] = useState<NextGame | null>(null);
  // Sorgente della lega (generata/storica) → politica di cap. Persistita nel save.
  const [source, setSource] = useState<LeagueSource>('generated');
  // Fase del flusso d'ingresso: schermata iniziale → panoramica lega/scelta
  // squadra → gioco (dashboard). Sotto 'play' vive la navigazione `view`.
  const [stage, setStage] = useState<'start' | 'league' | 'play'>('start');
  // Idratazione conclusa? Evita di lampeggiare la schermata iniziale prima di
  // aver elencato i salvataggi.
  const [booted, setBooted] = useState(false);
  // Elenco delle partite salvate (multi-slot), per l'hub di caricamento.
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  // Slot del salvataggio ATTIVO: ogni nuova carriera ne crea uno dedicato, così
  // più partite coesistono invece di sovrascrivere un'unica cache.
  const [currentSlot, setCurrentSlot] = useState<string>('');
  // Mini-popup giocatore: aperto da qualsiasi nome cliccabile via Context.
  const [playerModal, setPlayerModal] = useState<PlayerModalRequest | null>(null);
  const openPlayer = useCallback((req: PlayerModalRequest) => setPlayerModal(req), []);
  // Rose PERSISTITE (schema v3): quando la lega DIVERGE dal seed (dopo un rollover
  // di stagione o uno scambio umano) diventa la fonte di verità e va salvata. `null`
  // = lega ancora coincidente con la derivazione da seed/sorgente (nessuna divergenza).
  const [leagueTeams, setLeagueTeams] = useState<Team[] | null>(null);
  // Riepilogo dell'off-season appena eseguita (modale post-rollover). `null` = chiuso.
  const [rolloverRecap, setRolloverRecap] = useState<RolloverRecapData | null>(null);

  // Politica di cap derivata dalla sorgente (vedi leagueMode.ts).
  const leagueMode: LeagueMode = source === 'historical' ? HISTORICAL_MODE : GENERATED_MODE;

  // La lega (30 squadre) e' generata da un seed unico: calendario, classifiche e
  // leaderboard leggono tutti QUESTA stessa lega. La squadra gestita e' una
  // franchigia; l'avversario esce dal calendario della gara scelta. In modalita'
  // STORICA le 30 rose reali dell'annata sostituiscono quelle procedurali
  // (snapshot fisso, indipendente dal seed).
  // Rose PERSISTITE (schema v3) se presenti — la lega diverge dal seed dopo
  // rollover/scambi; altrimenti si deriva (generata da seed o storica dall'annata).
  const league = useMemo(
    () =>
      leagueTeams ??
      (source === 'historical' ? buildHistoricalLeague(season.year) : generateLeague(leagueSeed)),
    [leagueTeams, leagueSeed, source, season.year],
  );
  const myId = managedId || league[0].id;
  const managedTeam = teamById(league, myId) ?? league[0];
  const schedule = useMemo(
    () => generateSchedule(leagueSeed, myId, league),
    [leagueSeed, myId, league],
  );

  const opponentId = activeGame?.opponentId ?? league.find((t) => t.id !== myId)!.id;
  const opponent = teamById(league, opponentId) ?? league[0];
  // La squadra gestita gioca in casa/trasferta secondo il calendario.
  const controlled: Side = activeGame && activeGame.home === false ? 'away' : 'home';
  const arrangement = arrangements[myId];
  // Partente scelto per OGGI dalla UI (override); null = usa il consigliato dal
  // ciclo di rotazione (rispetta il riposo). Si azzera al cambio gara/giorno.
  const [todayStarter, setTodayStarter] = useState<string | null>(null);
  // Pannello "Gestione difesa" (rotazione ruoli + sostituzioni). Si apre da solo a
  // inizio della metà difensiva dell'umano se nell'attacco precedente ha usato un
  // pinch-hit/run (così può risistemare lo schieramento prima di lanciare).
  const [defenseOpen, setDefenseOpen] = useState(false);
  const pendingDefReview = useRef(false);
  const prevControlledBatting = useRef(false);
  const isRegularGame = !activeGame || activeGame.phase === 'regular';
  const isPlayoffGame = !!activeGame && activeGame.phase === 'playoff';
  const teams = useMemo(() => {
    const base = applyArrangement(managedTeam, arrangement);
    // In regular season la rotazione GIRA col riposo (partente = scelta di oggi o
    // il consigliato dal ciclo). Nei PLAYOFF vale la rotazione playoff (riposo del
    // partente più corto, già scontato in `availableFrom`; indice = gare di playoff
    // giocate). Prestagione: parte l'asso (rotation[0]).
    const rotIds = base.rotation.map((p) => p.id);
    const starterId = isRegularGame
      ? todayStarter ?? suggestedStarter(season.rotation, rotIds, season.day)
      : isPlayoffGame && playoff
        ? todayStarter ?? suggestedStarter(playoff.rotation, rotIds, playoff.managedGames)
        : base.rotation[0]?.id;
    const applied = starterId ? withStarterId(base, starterId) : base;
    // L'avversario ruota anch'esso il partente. Nei playoff col n° di gara nella
    // serie (asso in Gara 1), in regular col giorno di stagione + lo sfasamento
    // proprio della squadra (`rotationPhase`): ogni squadra AI cicla i suoi 5
    // partenti in modo indipendente, così in una serie ne affronti 3 diversi.
    const oppDay = isRegularGame ? season.day : isPlayoffGame ? playoffCtx?.gameNo ?? 0 : activeGame?.day ?? 0;
    const oppPhase = isRegularGame ? rotationPhase(opponent) : 0;
    // Lineup AVVERSARIO "con forma": ri-ordinato pesando il rendimento in-season
    // accumulato (no-op sotto 30 partite o senza dati). SOLO l'avversario — la MIA
    // squadra resta manuale. Poi la rotazione del partente.
    const opp = withRotationStarter(withFormLineup(opponent, season.bat), oppDay + oppPhase);
    return controlled === 'home'
      ? { away: opp, home: applied }
      : { away: applied, home: opp };
  }, [managedTeam, opponent, controlled, arrangement, isRegularGame, isPlayoffGame, playoff, playoffCtx, todayStarter, season.rotation, season.day, season.bat, activeGame]);

  // Ricarica l'elenco delle partite salvate (multi-slot), arricchendo ogni slot
  // con squadra/anno/giornata/record letti dal payload per l'hub di caricamento.
  const refreshSaves = useCallback(async (): Promise<void> => {
    try {
      const metas = await saveStore.list();
      const games = await Promise.all(
        metas.map(async (m) => {
          const rec = await saveStore.load(m.slot).catch(() => null);
          const managedTeamId = rec?.payload.managedTeamId;
          if (!rec || !managedTeamId) return null;
          const pl = rec.payload;
          const seas = ensureSeason(pl.season);
          const leagueForPreview =
            pl.teams ??
            (pl.source === 'historical'
              ? buildHistoricalLeague(seas.year)
              : typeof pl.seed === 'number'
                ? generateLeague(pl.seed)
                : undefined);
          const team = leagueForPreview
            ? teamById(leagueForPreview, managedTeamId)
            : undefined;
          return {
            slot: m.slot,
            updatedAt: m.updatedAt,
            source: pl.source ?? 'generated',
            seed: pl.seed,
            managedTeamId,
            team,
            year: seas.year,
            day: seas.day,
            record: recordOf(seas, managedTeamId),
          } as SavedGame;
        }),
      );
      setSavedGames(games.filter((g): g is SavedGame => g !== null));
    } catch {
      setSavedGames([]);
    }
  }, []);

  // Elenca i salvataggi per l'hub (una volta). NON riprende in automatico: si
  // parte SEMPRE dal pannello iniziale, dove si sceglie carica/nuova partita.
  useEffect(() => {
    let alive = true;
    refreshSaves().finally(() => {
      if (alive) setBooted(true);
    });
    return () => {
      alive = false;
    };
  }, [refreshSaves]);

  // Il partente scelto vale per un solo giorno/gara: azzera al cambiare.
  useEffect(() => {
    setTodayStarter(null);
    setDefenseOpen(false);
    pendingDefReview.current = false;
    prevControlledBatting.current = false;
  }, [season.day, activeGame]);

  // Seme di gara deterministico dalla partita di calendario scelta.
  const gnum = activeGame
    ? (activeGame.phase === 'playoff' ? 20000 : activeGame.phase === 'preseason' ? 0 : 10000) +
      activeGame.day
    : 1;

  // La partita interattiva e' mutabile e vive tra i render: la ricreo solo quando
  // cambiano lega, squadra gestita, avversario, casa/trasferta, gara o assetto.
  const key = `${leagueSeed}|${myId}|${opponentId}|${controlled}|${gnum}|${arrangement ? JSON.stringify(arrangement) : ''}`;
  const ref = useRef<{ key: string; game: LiveGame } | null>(null);
  if (!ref.current || ref.current.key !== key) {
    ref.current = {
      key,
      game: createLiveGame(teams.away, teams.home, gameSeed(leagueSeed, gnum), controlled),
    };
  }
  const live = ref.current.game;
  // Calibrazione dei marker sulla foto-stadio (perno = casa base). E' per stadio
  // di casa: si reimposta ai valori salvati quando cambia la squadra di casa.
  const homeId = teams.home.id;
  // Ad ogni gara, lo sfondo dello stadio di casa varia (in modo deterministico
  // per-partita) tra le foto CALIBRATE disponibili: principale + eventuali
  // doppioni `<ID>2.jpg`… La calibrazione (foto + marker) è caricata SEMPRE per
  // la foto scelta con `getCalibrationFor`, così marker e foto non si mischiano.
  const [cal, setCal] = useState<FieldCalibration>(() =>
    pickMatchCalibration(homeId, leagueSeed, gnum),
  );
  useEffect(() => {
    setCal(pickMatchCalibration(homeId, leagueSeed, gnum));
  }, [homeId, gnum, leagueSeed]);
  const result = toGameResult(live);
  const sit = situation(live);
  const final = live.status === 'final';
  // Contesti stat per il boxscore: la squadra gestita usa i valori REALI
  // accumulati in stagione; l'avversario una proiezione dalle doti. La riga
  // "Precedente" è la proiezione dell'annata scorsa. Costruzione leggera: le
  // proiezioni si calcolano solo quando una modalità stagione/precedente è a
  // schermo (accessori lazy).
  const ctxAway = makeGameStatCtx(result.away, season, leagueSeed, controlled === 'away');
  const ctxHome = makeGameStatCtx(result.home, season, leagueSeed, controlled === 'home');

  // Apertura automatica del pannello difesa: quando l'umano PASSA in difesa
  // (batteva, ora schiera) dopo aver usato un pinch-hit/run, così può riorganizzare
  // lo schieramento prima del primo lancio. `sit.controlledBatting` = l'umano batte.
  const controlledBatting = sit.controlledBatting;
  useEffect(() => {
    if (prevControlledBatting.current && !controlledBatting && pendingDefReview.current && !final) {
      pendingDefReview.current = false;
      setDefenseOpen(true);
    }
    prevControlledBatting.current = controlledBatting;
  }, [controlledBatting, final]);

  // --- Rivelazione ritardata dei marker sulle basi -------------------------
  // I marker (basi + corridori sul diamante) NON si spostano appena eseguito il
  // turno: aspettano il VERDETTO della telecronaca di quel turno (PlayBanner),
  // così non si vede il corridore già in base prima di averne letto l'esito in
  // cronaca. Fuori dalla telecronaca (ripresa partita, quick-sim, cambio) si
  // aggiornano subito. `live` cambia identità solo quando si ricrea la partita,
  // non a ogni turno: l'effetto qui sotto riazzera i marker a inizio gara.
  const [shownField, setShownField] = useState<FieldSnap>(() => fieldSnap(sit));
  // Quante giocate sono già "lette": le cronache laterali NON anticipano l'esito
  // scritto al centro (PlayBanner), che resta la prima fonte del turno. Cresce
  // solo al verdetto della telecronaca, in sync coi marker sul diamante.
  const [shownPlays, setShownPlays] = useState<number>(() => result.play.length);
  // Anche lo SCOREBOARD in alto (punteggi, linescore, inning/out, giocatore
  // coinvolto) non anticipa l'esito: aggiorna solo al verdetto della telecronaca,
  // con la stessa istantanea di `result`/`sit` usata dal resto della plancia.
  const [shownScore, setShownScore] = useState<{ result: GameResult; sit: LiveSituation }>(() => ({
    result,
    sit,
  }));
  useEffect(() => {
    const s = situation(live);
    const r = toGameResult(live);
    setShownField(fieldSnap(s));
    setShownPlays(r.play.length);
    setShownScore({ result: r, sit: s });
  }, [live]);
  // Passata al PlayBanner: chiamata al verdetto (o subito se non c'è cronaca).
  const revealField = useCallback(() => {
    const s = situation(live);
    const r = toGameResult(live);
    setShownField(fieldSnap(s));
    setShownPlays(r.play.length);
    setShownScore({ result: r, sit: s });
  }, [live]);
  // Lock: a partita iniziata (in campo e non finita) le altre sezioni non sono
  // consultabili finche' non finisce la gara.
  const inLiveGame = view === 'game' && !!activeGame && !final;
  // Sfondo-stadio ambientale (attenuato) dietro tutta la plancia: riempie i bordi
  // e sfuma sotto testata/pannelli, per ridurre il nero. La stessa foto scelta.
  // Layout "immersivo" (100% altezza + sfondo) sia in partita sia in calibrazione.
  const calId = calTeamId || league[0].id;
  const immersive = view === 'game' || view === 'calibrate';
  const backdropUrl =
    view === 'calibrate'
      ? stadiumImage(calId)
      : cal.image
        ? assetUrl(cal.image)
        : stadiumImage(homeId);
  // Modalità piazzamento manuale dei marker (attiva col pannello aperto).
  const manual = !!cal.markers;
  const editing = calOpen && manual && !!stadiumImage(homeId);
  const moveMarker = (id: string, pos: { x: number; y: number }) => {
    setCal({ ...cal, markers: { ...(cal.markers ?? {}), [id]: pos } });
  };

  const act = (fn: (g: LiveGame) => void) => {
    fn(live);
    // Se ora tocca all'umano battere, la CPU in difesa gestisce il suo lanciatore.
    if (live.status === 'live' && situation(live).controlledBatting) autoManageDefense(live);
    forceTick();
  };

  // Gara corrente di regular season (quella che fa avanzare la stagione).
  const currentRegular = schedule.regular[season.day] ?? null;
  // La gara attiva e' la giornata corrente di regular season?
  const isSeasonGame =
    !!activeGame && activeGame.phase === 'regular' && activeGame.id === currentRegular?.id;

  const persist = (
    arrs: Record<string, MatchArrangement>,
    seas: SeasonState,
    pl: PlayoffState | null = playoff,
    tms: Team[] | null = leagueTeams,
  ) => {
    if (!currentSlot) return; // nessuno slot attivo: niente da salvare
    saveStore
      .save(currentSlot, {
        seed: leagueSeed,
        source,
        managedTeamId: myId,
        lineups: arrs,
        season: seas,
        playoff: pl ?? undefined,
        // Rose persistite solo quando la lega è divergente (schema v3); altrimenti
        // il save resta ri-derivabile da seed/sorgente (compatibile v2).
        teams: tms ?? undefined,
      })
      .catch(() => {
        /* offline: si continua, si risalvera' piu' tardi. */
      });
  };

  // Dall'hub: avvia una NUOVA carriera con la sorgente scelta e vai alla
  // panoramica per scegliere la squadra da gestire.
  const startNewLeague = (src: LeagueSource, histYear = DEFAULT_HISTORICAL_YEAR) => {
    setSource(src);
    setLeagueSeed(newRandomSeed());
    setManagedId('');
    setArrangements({});
    setActiveGame(null);
    // La modalita' storica parte dall'annata scelta (es. "Anno 1999"); la generata
    // dal contatore relativo "Anno 1".
    setSeason(createSeason(src === 'historical' ? histYear : 1));
    setPlayoff(null);
    setPlayoffCtx(null);
    setLeagueTeams(null); // nuova lega: si deriva dal seed finché non diverge
    setCurrentSlot(''); // lo slot nasce alla conferma della squadra
    setStage('league');
  };

  // Dalla panoramica: conferma la squadra gestita, CREA un nuovo slot dedicato,
  // salva e passa alla dashboard. Così più carriere coesistono.
  const pickManagedTeam = (id: string) => {
    const slot = newSlotId();
    setCurrentSlot(slot);
    setManagedId(id);
    setActiveGame(null);
    setStage('play');
    setView('home');
    saveStore
      .save(slot, { seed: leagueSeed, source, managedTeamId: id, lineups: arrangements, season })
      .then(() => refreshSaves())
      .catch(() => {
        /* offline: si continua. */
      });
  };

  // Dall'hub: carica una partita salvata e riprendi dalla dashboard.
  const loadSave = async (game: SavedGame) => {
    try {
      const rec = await saveStore.load(game.slot);
      if (!rec) return;
      const pl = rec.payload;
      if (typeof pl.seed === 'number') setLeagueSeed(pl.seed);
      setSource(pl.source ?? 'generated');
      setArrangements(pl.lineups ?? {});
      setSeason(ensureSeason(pl.season));
      setPlayoff(pl.playoff ?? null);
      setPlayoffCtx(null);
      setLeagueTeams(pl.teams ?? null); // v3: rose persistite se presenti
      setManagedId(pl.managedTeamId ?? '');
      setCurrentSlot(game.slot);
      setActiveGame(null);
      setView('home');
      setStage('play');
    } catch {
      /* offline o slot sparito: resta nell'hub. */
    }
  };

  // Dall'hub: elimina una partita salvata.
  const deleteSave = async (slot: string) => {
    try {
      await saveStore.remove(slot);
    } catch {
      /* offline: ignora */
    }
    if (slot === currentSlot) setCurrentSlot('');
    await refreshSaves();
  };

  // Dal calendario: scegli la gara. "Gioca" apre la preparazione (Roster), da
  // cui si "Entra in campo". Cosi' la schermata di prep coincide col Roster.
  const playGame = (g: ScheduleGame) => {
    setActiveGame(g);
    setView('roster');
  };

  // Fine gara di regular season: registra il risultato reale, accumula le
  // statistiche, quick-simula il resto della lega, avanza di un giorno e salva.
  const advanceDay = () => {
    const ns = advanceWithResult(season, toGameResult(live), myId, league, leagueSeed);
    setSeason(ns);
    persist(arrangements, ns);
    setActiveGame(null);
    setView('home');
  };

  // --- Postseason (Fase 4) --------------------------------------------------
  const regularOver = season.day >= REGULAR_GAMES;
  // Prossima gara di playoff della gestita (null = bye/eliminata/non qualificata).
  const nextPlayoffGame = playoff ? nextManagedGame(playoff) : null;

  // A fine regular season crea la postseason dai record reali (una volta sola).
  useEffect(() => {
    if (stage !== 'play' || !managedId) return;
    if (regularOver && !playoff) {
      const ps = seedPlayoffs(season, league, leagueSeed, myId);
      setPlayoff(ps);
      persist(arrangements, season, ps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, managedId, regularOver, playoff, leagueSeed, myId]);

  // Ordine fisso delle serie: dà un `day` unico (→ seme gara unico) a ogni gara.
  const PO_ORDER = [
    'AL-WC-A', 'AL-WC-B', 'NL-WC-A', 'NL-WC-B',
    'AL-DS-1', 'AL-DS-2', 'NL-DS-1', 'NL-DS-2',
    'AL-LCS', 'NL-LCS', 'WS',
  ];

  // Avvia la prossima gara di playoff: sintetizza la gara (avversario/casa dal
  // bracket) e va alla preparazione (Roster), come per una gara di calendario.
  const playPlayoffGame = () => {
    if (!nextPlayoffGame) return;
    const ng = nextPlayoffGame;
    setPlayoffCtx(ng);
    setActiveGame({
      id: `po-${ng.seriesId}-${ng.gameNo}`,
      phase: 'playoff',
      day: PO_ORDER.indexOf(ng.seriesId) * 10 + ng.gameNo, // unico per gara
      opponentId: ng.opponentId,
      home: ng.home,
      round: ng.round,
    });
    setView('roster');
  };

  // Fine gara di playoff: registra l'esito, fa avanzare il bracket (quick-sim
  // delle altre serie), salva e torna alla postseason.
  const advancePlayoff = () => {
    if (!playoff) return;
    const np = recordManagedGame(playoff, toGameResult(live), league, leagueSeed);
    setPlayoff(np);
    persist(arrangements, season, np);
    setActiveGame(null);
    setPlayoffCtx(null);
    setView('playoff');
  };

  // Simula il resto della postseason (gestita non qualificata o eliminata).
  const simPlayoffRest = () => {
    if (!playoff) return;
    const np = simRestOfPlayoffs(playoff, league, leagueSeed);
    setPlayoff(np);
    persist(arrangements, season, np);
  };

  // --- Rollover di stagione (Fase 5B) --------------------------------------
  // A postseason conclusa (campione deciso): esegue l'off-season automatica
  // (`rolloverSeason`: aging+ritiri → draft inverso → mercato → finalize), sostituisce
  // la lega con quella dell'anno successivo (rose PERSISTITE, ora divergenti dal seed),
  // apre la stagione nuova e mostra il riepilogo. Gli assetti vecchi si azzerano (le
  // rose sono cambiate: la squadra riparte dal lineup di default ricomposto).
  const startNextSeason = () => {
    const before = managedTeam;
    const beforeIds = [
      ...before.lineup, ...before.bench, ...before.reserveBatters,
      ...before.rotation, ...before.bullpen, ...before.reservePitchers,
    ].map((p) => p.id);
    const championId = playoff?.championId;
    const result = rolloverSeason({
      teams: league,
      season,
      seed: leagueSeed,
      options: { managedId: myId, mode: leagueMode },
    });
    setLeagueTeams(result.teams);
    setSeason(result.season);
    setPlayoff(null);
    setPlayoffCtx(null);
    setActiveGame(null);
    setArrangements({});
    setView('home');
    persist({}, result.season, null, result.teams);
    setRolloverRecap({
      summary: result.summary,
      nextLeague: result.teams,
      managedId: myId,
      managedBeforeIds: beforeIds,
      championId,
    });
  };

  // Scambio umano→1 CPU applicato (Fase 5B): la lega diventa PERSISTITA (divergente
  // dal seed). Le rose sono ricomposte, quindi l'assetto salvato della gestita non
  // vale più: si azzera (riparte dal lineup di default; l'utente può rifinirlo).
  const commitTrade = (nextLeague: Team[]) => {
    const nextArr = { ...arrangements };
    delete nextArr[myId];
    setLeagueTeams(nextLeague);
    setArrangements(nextArr);
    persist(nextArr, season, playoff, nextLeague);
  };

  // Finestra scambi: in stagione (o prestagione) fino alla trade deadline; chiusa
  // in postseason e a stagione conclusa.
  const tradesOpen = stage === 'play' && !regularOver && season.day < TRADE_DEADLINE_GAME;

  // Etichetta/azione del pulsante di fine gara secondo la fase.
  const finishLabel = isSeasonGame
    ? 'Conferma e avanza ▸'
    : isPlayoffGame
      ? 'Alla postseason ▸'
      : 'Al calendario ▸';
  const finishGame = isSeasonGame
    ? advanceDay
    : isPlayoffGame
      ? advancePlayoff
      : () => {
          setActiveGame(null);
          setView('home');
        };

  // Editor: applica l'assetto alla sola squadra gestita (entra nella sim,
  // riavvia la gara) ed eventualmente lo rende persistente sul cloud.
  const applyManaged = (arr: MatchArrangement) => {
    setArrangements((m) => ({ ...m, [myId]: arr }));
  };
  const saveManaged = async (arr: MatchArrangement) => {
    const next = { ...arrangements, [myId]: arr };
    setArrangements(next);
    const slot = currentSlot || newSlotId();
    if (!currentSlot) setCurrentSlot(slot);
    await saveStore.save(slot, {
      seed: leagueSeed,
      source,
      managedTeamId: myId,
      lineups: next,
      season,
      teams: leagueTeams ?? undefined,
    });
  };

  // --- Flusso d'ingresso: prima della dashboard ---
  if (!booted) {
    return (
      <div className="app boot-splash">
        <div className="splash-logo">⚾ MLBSim</div>
        <div className="muted">Caricamento…</div>
      </div>
    );
  }
  if (stage === 'start') {
    return (
      <StartScreen
        savedGames={savedGames}
        onLoad={loadSave}
        onDelete={deleteSave}
        onNewGenerated={() => startNewLeague('generated')}
        onNewHistorical={(year) => startNewLeague('historical', year)}
      />
    );
  }
  if (stage === 'league') {
    return (
      <LeagueOverview
        league={league}
        seed={leagueSeed}
        mode={leagueMode}
        year={season.year}
        onPick={pickManagedTeam}
        onBack={() => setStage('start')}
      />
    );
  }

  return (
    <PlayerModalContext.Provider value={openPlayer}>
    <div className={immersive ? 'app app-game' : 'app'}>
      {immersive && backdropUrl && (
        <div
          className="stadium-backdrop"
          style={{ backgroundImage: `url("${backdropUrl}")` }}
          aria-hidden="true"
        />
      )}
      <header className="topbar">
        <div className="brand">
          <span className="logo">⚾</span> MLBSim
          <span className="phase">Fase 2</span>
        </div>

        <GameInfoBadge source={source} year={season.year} />

        <div className="hdr-team" title="Squadra gestita">
          <TeamBadge team={managedTeam} size={22} />
          <span className="hdr-team-name">{managedTeam.abbrev}</span>
        </div>

        <nav className="tabs inline">
          {(
            [
              ['home', 'Home'],
              ['roster', 'Roster'],
              ['overview', 'Lega'],
              ['leaderboard', 'Leaderboard'],
              ['standings', 'Classifiche'],
              ...(playoff ? ([['playoff', '🏆 Playoff']] as Array<[View, string]>) : []),
              ['franchise', 'Franchigia'],
              ...(tradesOpen ? ([['trades', 'Scambi']] as Array<[View, string]>) : []),
              ['calibrate', '🎯 Stadi'],
            ] as Array<[View, string]>
          ).map(([v, label]) => (
            <button
              key={v}
              className={view === v ? 'tab active' : 'tab'}
              onClick={() => setView(v)}
              disabled={inLiveGame}
              title={inLiveGame ? 'Sezione bloccata durante la partita' : undefined}
            >
              {label}
            </button>
          ))}
          {activeGame && (
            <button
              className={view === 'game' ? 'tab active' : 'tab'}
              onClick={() => setView('game')}
              title="Partita in corso"
            >
              ⚾ Partita
            </button>
          )}
        </nav>

        <div className="actions">
          {view === 'game' && (
            <>
              <button
                className={calOpen ? 'btn active' : 'btn'}
                onClick={() => setCalOpen((o) => !o)}
                title="Calibra i marker del campo sulla foto-stadio"
              >
                🎯 Calibra campo
              </button>
              <button className="btn" onClick={() => setRecapOpen(true)}>
                Recap
              </button>
              {final ? (
                <button className="btn primary" onClick={finishGame}>
                  {finishLabel}
                </button>
              ) : (
                <button className="btn" onClick={() => act((g) => quickSim(g))}>
                  Salta a fine ⏩
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {view === 'game' && activeGame && (
        <GameScreen
          result={result}
          sit={sit}
          displayResult={shownScore.result}
          displaySit={shownScore.sit}
          editing={editing}
          cal={cal}
          onMarkerMove={moveMarker}
          basesShown={shownField.bases}
          runners={shownField.baseRunners}
          runnerSpeeds={shownField.baseRunnerSpeeds}
          batterName={shownField.batterName}
          shownPlays={shownPlays}
          onReveal={revealField}
          ctxAway={ctxAway}
          ctxHome={ctxHome}
          controls={
            final ? (
              <FinalOverlay
                result={result}
                controlled={controlled}
                newLabel={finishLabel}
                onNew={finishGame}
                onRecap={() => setRecapOpen(true)}
              />
            ) : (
              <ActionBar
                live={live}
                sit={sit}
                act={act}
                onSub={revealField}
                onOpenDefense={() => setDefenseOpen(true)}
                onOffenseSub={() => {
                  pendingDefReview.current = true;
                }}
                waiting={result.play.length > shownPlays}
              />
            )
          }
        />
      )}

      {view === 'game' && activeGame && defenseOpen && !final && (
        <DefenseModal
          live={live}
          act={(fn) => {
            act(fn);
            revealField();
          }}
          onClose={() => setDefenseOpen(false)}
        />
      )}

      {view === 'home' && (
        <HomePage
          league={league}
          managedTeam={managedTeam}
          schedule={schedule}
          season={season}
          playoff={playoff}
          nextPlayoffGame={nextPlayoffGame}
          onPlayoff={playPlayoffGame}
          onBracket={() => setView('playoff')}
          onPlay={playGame}
          onOverview={() => setView('overview')}
          onNewLeague={() => setStage('start')}
        />
      )}

      {view === 'roster' && (
        <RosterPage
          key={myId}
          team={managedTeam}
          seed={leagueSeed}
          initial={arrangement}
          activeGame={!!activeGame}
          season={season}
          playoffRot={isPlayoffGame && playoff ? { rotation: playoff.rotation, day: playoff.managedGames } : null}
          todayStarter={todayStarter}
          onPickStarter={setTodayStarter}
          canPickStarter={isRegularGame}
          onApply={applyManaged}
          onSave={saveManaged}
          onStart={() => setView('game')}
        />
      )}

      {view === 'overview' && (
        <LeagueOverview
          league={league}
          seed={leagueSeed}
          mode={leagueMode}
          embedded
          onPick={(id) => {
            setManagedId(id);
            setActiveGame(null);
            setView('home');
          }}
        />
      )}

      {view === 'leaderboard' && (
        <LeaderboardPage league={league} season={season} seed={leagueSeed} managedId={myId} />
      )}
      {view === 'standings' && <StandingsPage league={league} season={season} managedId={myId} />}
      {view === 'playoff' && playoff && (
        <PlayoffPage
          league={league}
          playoff={playoff}
          managedId={myId}
          nextGame={nextPlayoffGame}
          onPlay={playPlayoffGame}
          onSimRest={simPlayoffRest}
          onNextSeason={playoff.championId ? startNextSeason : undefined}
        />
      )}
      {view === 'franchise' && <FranchisePage team={managedTeam} mode={leagueMode} />}
      {view === 'trades' && (
        <TradeScreen
          league={league}
          managedId={myId}
          mode={leagueMode}
          seed={leagueSeed}
          year={season.year}
          open={tradesOpen}
          deadlineGame={TRADE_DEADLINE_GAME}
          currentGame={season.day}
          onCommit={commitTrade}
        />
      )}
      {view === 'calibrate' && (
        <CalibrationScreen
          league={league}
          teamId={calId}
          setTeamId={setCalTeamId}
          onClose={() => setView('home')}
        />
      )}

      {recapOpen && (
        <RecapModal
          result={result}
          onClose={() => setRecapOpen(false)}
          ctxAway={ctxAway}
          ctxHome={ctxHome}
        />
      )}

      {view === 'game' && calOpen && (
        <CalibrationPanel
          team={teams.home}
          hasPhoto={!!stadiumImage(homeId)}
          cal={cal}
          setCal={setCal}
          onClose={() => setCalOpen(false)}
        />
      )}

      {playerModal && (
        <PlayerModal
          req={playerModal}
          season={season}
          seed={leagueSeed}
          onClose={() => setPlayerModal(null)}
        />
      )}

      {rolloverRecap && (
        <RolloverRecap data={rolloverRecap} onClose={() => setRolloverRecap(null)} />
      )}
    </div>
    </PlayerModalContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Plancia di gioco (statbar + campo con marker + riquadri lineup/cronaca +
// overlay controlli). Estratta perché la usano IDENTICA sia la partita sia la
// schermata di calibrazione "🎯 Stadi": così ciò che si calibra è esattamente
// ciò che comparirà in match (stessa cornice, stesse proporzioni del campo).
// ---------------------------------------------------------------------------







// ---------------------------------------------------------------------------
// Pagina "Roster": gestione rosa della squadra gestita, anche schermata di
// preparazione partita. Linguette Fielders / Pitchers. Le mosse si fanno per
// TRASCINAMENTO del nome su un altro (niente scelte "al buio"), vedendo sempre
// valori e statistiche:
//   Fielders  - riga titolare -> riga titolare = riordina ordine di battuta
//             - trascina su una cella DEF       = assegna/scambia la casella
//             - panchinaro <-> titolare         = sostituzione
//   Pitchers  - trascina tra Rotazione / Bullpen / Disponibili per comporre
//               lo staff; nella lista, rilascia su una riga per riordinare.
// Toggle stat: Stagione / Scorsa / Storico / Caratteristiche. Le tre modalita'
// statistiche mostrano una linea ATTESA derivata dai rating (segnaposto: la
// stagione in corso e' a zero); i risultati (RBI, W-L, SV...) sono stime finche'
// non si gioca. Fissi accanto a ogni giocatore: overall, eta', ruolo/i.
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Pagine argomentali raggiungibili dall'header. In questa fase Home (dashboard +
// calendario) e' completa; Leaderboard e Franchigia sono impalcature che si
// riempiranno nei rispettivi passi; Classifiche mostra gia' la struttura reale
// delle division. Tutte leggono la stessa lega generata da seed.
// ---------------------------------------------------------------------------





// ---------------------------------------------------------------------------
// Cap: indicatore payroll-vs-cap (modello a due confini), forza squadra, e il
// flusso d'ingresso (schermata iniziale + panoramica lega + scelta squadra).
// ---------------------------------------------------------------------------


/** Card di una partita salvata nell'hub (Continua / Elimina). */
