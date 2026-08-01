import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Batter, Pitcher, Position, Team } from '../engine/types';
import type { GameResult } from '../engine/game';
import type { LiveGame, LiveSituation } from '../engine/game';
import {
  createLiveGame,
  situation,
  toGameResult,
  autoManageDefense,
  quickSim,
} from '../engine/game';
import { batterOverall, pitcherOverall } from '../engine/ratings';
import { ratingsAtPosition, canOccupy } from '../engine/positions';
import { autoLineup, FIELD_SLOTS } from '../engine/lineup';
import {
  defaultArrangement,
  buildManagedTeam,
  validateArrangement,
  rosterBatters,
  rosterPitchers,
} from '../engine/arrangement';
import { saveStore } from '../data/persistence';
import type { MatchArrangement } from '../data/persistence';
import {
  teamPayroll,
  capZone,
  outerWall,
  GENERATED_MODE,
  HISTORICAL_MODE,
} from '../data/leagueMode';
import type { LeagueMode, LeagueSource, CapZone } from '../data/leagueMode';
import { teamStrength } from '../engine/strength';
import type { TeamStrength } from '../engine/strength';
import {
  generateLeague,
  teamById,
  byDivision,
  divisionRivals,
  LEAGUE_LABEL,
  DIVISION_LABEL,
} from '../data/league';
import {
  buildHistoricalLeague,
  DEFAULT_HISTORICAL_YEAR,
  HISTORICAL_YEARS,
} from '../data/historical/league';
import { generateSchedule, REGULAR_GAMES } from '../data/schedule';
import type { ScheduleGame, Schedule } from '../data/schedule';
import {
  createSeason,
  ensureSeason,
  advanceWithResult,
  recordOf,
  winPct,
  gamesBehind,
  sortByRecord,
  addBat,
  addPit,
} from '../data/season';
import type { SeasonState, SeasonBat, SeasonPit, WLRecord } from '../data/season';
import { suggestedStarter, withStarterId, restInfo } from '../data/rotation';
import type { RotationState } from '../data/rotation';
import { withRotationStarter, potentialRole } from '../data/generator';
import {
  seedPlayoffs,
  recordManagedGame,
  simRestOfPlayoffs,
  nextManagedGame,
  managedEliminated,
  seriesByRound,
  winsNeeded,
} from '../data/playoff';
import type { PlayoffState, Series, Round, NextGame } from '../data/playoff';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import { stadiumImage, assetUrl } from '../data/stadiumImages';
import { getCalibrationFor, calibratedVariants } from '../data/stadiumCalibration';
import type { FieldCalibration } from '../data/stadiumCalibration';
import { gameSeed, newRandomSeed, ratingColor, upperLast } from './format';
import {
  pct3,
  rolesOf,
  ipFmt,
  seasonBatLine,
  seasonPitLine,
  defLine,
} from './statlines';
import type { StatsMode, BatLine, PitLine } from './statlines';
import { Rating, SynthBadges, OvrBadge, OvrBarCell, PotCell } from './rating-widgets';
import { StatLegend, InfoDot } from './glossary';
import { PlayerLink, PlayerModal, PlayerModalContext, isBatter } from './player-modal';
import type { PlayerModalRequest } from './player-modal';
import { TeamBadge } from './widgets';
import { FinalOverlay } from './game-lineup';
import { RecapModal } from './game-recap';
import { GameScreen } from './game-screen';
import { ActionBar } from './game-actionbar';
import { CalibrationScreen, CalibrationPanel } from './calibration';
import type { Side } from './types';

type View =
  | 'home'
  | 'roster'
  | 'overview'
  | 'leaderboard'
  | 'standings'
  | 'playoff'
  | 'franchise'
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
interface SavedGame {
  slot: string;
  updatedAt: string;
  source: LeagueSource;
  seed?: number;
  managedTeamId?: string;
  team?: Team;
  year: number;
  day: number;
  record: WLRecord;
}

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
  const [statsMode, setStatsMode] = useState<StatsMode>('game');
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

  // Politica di cap derivata dalla sorgente (vedi leagueMode.ts).
  const leagueMode: LeagueMode = source === 'historical' ? HISTORICAL_MODE : GENERATED_MODE;

  // La lega (30 squadre) e' generata da un seed unico: calendario, classifiche e
  // leaderboard leggono tutti QUESTA stessa lega. La squadra gestita e' una
  // franchigia; l'avversario esce dal calendario della gara scelta. In modalita'
  // STORICA le 30 rose reali dell'annata sostituiscono quelle procedurali
  // (snapshot fisso, indipendente dal seed).
  const league = useMemo(
    () =>
      source === 'historical'
        ? buildHistoricalLeague(season.year)
        : generateLeague(leagueSeed),
    [leagueSeed, source, season.year],
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
    // serie (asso in Gara 1), in regular col giorno di stagione.
    const oppDay = isRegularGame ? season.day : isPlayoffGame ? playoffCtx?.gameNo ?? 0 : activeGame?.day ?? 0;
    const opp = withRotationStarter(opponent, oppDay);
    return controlled === 'home'
      ? { away: opp, home: applied }
      : { away: applied, home: opp };
  }, [managedTeam, opponent, controlled, arrangement, isRegularGame, isPlayoffGame, playoff, playoffCtx, todayStarter, season.rotation, season.day, activeGame]);

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
            pl.source === 'historical'
              ? buildHistoricalLeague(seas.year)
              : typeof pl.seed === 'number'
                ? generateLeague(pl.seed)
                : undefined;
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
          statsMode={statsMode}
          setStatsMode={setStatsMode}
          editing={editing}
          cal={cal}
          onMarkerMove={moveMarker}
          basesShown={shownField.bases}
          runners={shownField.baseRunners}
          runnerSpeeds={shownField.baseRunnerSpeeds}
          batterName={shownField.batterName}
          shownPlays={shownPlays}
          onReveal={revealField}
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
              <ActionBar live={live} sit={sit} act={act} onSub={revealField} />
            )
          }
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
        />
      )}
      {view === 'franchise' && <FranchisePage team={managedTeam} mode={leagueMode} />}
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
          statsMode={statsMode}
          setStatsMode={setStatsMode}
          onClose={() => setRecapOpen(false)}
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

type RosterStat = 'season' | 'last' | 'hist' | 'ratings';

const ROSTER_STAT_LABEL: Record<RosterStat, string> = {
  season: 'Stagione',
  last: 'Scorsa',
  hist: 'Storico',
  ratings: 'Caratteristiche',
};

// Colonne divise per schermata: ATTACCO (lineup) vs DIFESA (schieramento).
const BAT_ATK_COLS = ['G', 'AVG', 'OBP', 'SLG', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB'];
const BAT_ATK_RATING_COLS = ['CON', 'POT', 'OCC', 'VEL'];
const BAT_DEF_COLS = ['G', 'E', 'A', 'PO', 'FLD%'];
const BAT_DEF_RATING_COLS = ['DIF', 'BRA', 'VEL'];
const PIT_COLS = ['W', 'L', 'G', 'GS', 'IP', 'ERA', 'H', 'BB', 'K', 'SVO', 'SV', 'WHIP', 'K/9'];
const PIT_RATING_COLS = ['DOM', 'CTR', 'MOV', 'PAT', 'RES', 'DIF'];

// Legenda delle sigle mostrate nel roster. Per le DOTI (rating) la descrizione
// dice SU COSA INFLUISCONO nel motore (fonte: docs/players-and-ratings.md); per
// le STATISTICHE dice cosa rappresentano. Divisa per sezione (attacco / difesa /
// lancio) cosi' l'icona "i" a fianco di ogni tabella apre solo il pezzo pertinente.

// Posizioni difensive sul campo semplificato (percentuali dentro il riquadro).
// Le CASELLE sono FISSE: si spostano i giocatori. Il DH sta fuori dal diamante.
const FIELD_LAYOUT: Array<{ pos: Position; x: number; y: number }> = [
  { pos: 'CF', x: 50, y: 11 },
  { pos: 'LF', x: 19, y: 26 },
  { pos: 'RF', x: 81, y: 26 },
  { pos: 'SS', x: 37, y: 46 },
  { pos: '2B', x: 63, y: 46 },
  { pos: '3B', x: 21, y: 61 },
  { pos: '1B', x: 79, y: 61 },
  { pos: 'C', x: 50, y: 88 },
];

/** Campo da baseball semplificato (vista dall'alto): erba a ventaglio tra le linee
 *  di foul, recinzione esterna, diamante interno di terra, basi e monte. Fa da
 *  sfondo alle caselle FISSE dei difensori (allineato al viewBox 4:3). */
function DefenseFieldSVG() {
  return (
    <svg className="def-svg" viewBox="0 0 320 240" preserveAspectRatio="none" aria-hidden="true">
      <path d="M160 216 L24 76 Q160 2 296 76 Z" className="ff-grass" />
      <path d="M24 76 Q160 2 296 76" className="ff-fence" />
      <line x1="160" y1="216" x2="24" y2="76" className="ff-foul" />
      <line x1="160" y1="216" x2="296" y2="76" className="ff-foul" />
      <path d="M160 214 L234 150 L160 90 L86 150 Z" className="ff-dirt" />
      <path d="M160 196 L214 150 L160 108 L106 150 Z" className="ff-ingrass" />
      <circle cx="160" cy="150" r="9" className="ff-mound" />
      <g className="ff-base">
        <rect x="155.5" y="209.5" width="9" height="9" transform="rotate(45 160 214)" />
        <rect x="229.5" y="145.5" width="9" height="9" transform="rotate(45 234 150)" />
        <rect x="155.5" y="85.5" width="9" height="9" transform="rotate(45 160 90)" />
        <rect x="81.5" y="145.5" width="9" height="9" transform="rotate(45 86 150)" />
      </g>
    </svg>
  );
}

/**
 * Ordina `pool` secondo la lista di id preferiti `pref` (quelli noti nell'ordine
 * indicato, poi il resto nell'ordine originale). Usato per le riserve battitori:
 * l'ordine scelto dal manager e' stabile e i nuovi arrivi finiscono in coda.
 */
function orderByPref<T extends { id: string }>(pool: T[], pref?: string[]): T[] {
  if (!pref || pref.length === 0) return pool;
  const byId = new Map(pool.map((x) => [x.id, x]));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of pref) {
    const x = byId.get(id);
    if (x && !seen.has(id)) {
      out.push(x);
      seen.add(id);
    }
  }
  for (const x of pool) if (!seen.has(x.id)) out.push(x);
  return out;
}

function RosterPage({
  team,
  seed,
  initial,
  activeGame,
  season,
  playoffRot,
  todayStarter,
  onPickStarter,
  canPickStarter,
  onApply,
  onSave,
  onStart,
}: {
  team: Team;
  seed: number;
  initial?: MatchArrangement;
  activeGame: boolean;
  season: SeasonState;
  /** Contesto rotazione nei playoff (riposo più corto): assente in regular season. */
  playoffRot?: { rotation: RotationState; day: number } | null;
  todayStarter: string | null;
  onPickStarter: (id: string | null) => void;
  /** Vero in pre-gara di regular season: si sceglie il partente e conta il riposo. */
  canPickStarter: boolean;
  onApply: (arr: MatchArrangement) => void;
  onSave: (arr: MatchArrangement) => Promise<void>;
  onStart: () => void;
}) {
  const [tab, setTab] = useState<'fielders' | 'pitchers'>('fielders');
  const [fieldView, setFieldView] = useState<'lineup' | 'defense'>('lineup');
  const [arr, setArr] = useState<MatchArrangement>(() => initial ?? defaultArrangement(team));
  const [statMode, setStatMode] = useState<RosterStat>('ratings');
  const [drag, setDrag] = useState<{ id: string; from: string } | null>(null);
  const [over, setOver] = useState<string | null>(null); // bersaglio sotto il cursore
  const [legend, setLegend] = useState<'bat' | 'def' | 'pit' | null>(null); // popup sigle
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const batters = rosterBatters(team);
  const pitchers = rosterPitchers(team);
  const bById = new Map(batters.map((b) => [b.id, b]));
  const pById = new Map(pitchers.map((p) => [p.id, p]));
  // Riposo per-lanciatore (badge nelle liste) e partente effettivo del giorno.
  // Nei playoff vale la rotazione playoff (riposo del partente più corto); in
  // regular season quella di stagione. `rotDay` è l'indice-gara di riferimento.
  const rot = playoffRot ? playoffRot.rotation : season.rotation;
  const rotDay = playoffRot ? playoffRot.day : season.day;
  const rotLabel = playoffRot ? `playoff · gara ${rotDay + 1}` : `giornata ${season.day}`;
  const restById = new Map(
    restInfo(rot, pitchers.map((p) => p.id), rotDay).map((r) => [r.id, r]),
  );
  const suggestedSp = suggestedStarter(rot, arr.rotation, rotDay);
  const effectiveStarter =
    todayStarter && arr.rotation.includes(todayStarter) && restById.get(todayStarter)?.available
      ? todayStarter
      : suggestedSp;
  // "scelto" = l'utente ha confermato/scelto esplicitamente (todayStarter valido);
  // altrimenti si mostra il consigliato. Confermare = fissare todayStarter.
  const starterChosen = todayStarter != null && todayStarter === effectiveStarter;
  const lineup = arr.order.map((id) => bById.get(id)).filter(Boolean) as Batter[];
  const starterIds = new Set(arr.order);
  // Riserve = non-titolari, ORDINATE secondo la preferenza salvata (benchOrder):
  // gli id noti in quell'ordine, poi eventuali nuovi (es. un titolare appena
  // scaricato) in coda. Cosi' l'ordine scelto dal manager e' stabile e persistente.
  const benchPool = batters.filter((b) => !starterIds.has(b.id));
  const bench = orderByPref(benchPool, arr.benchOrder);
  const check = validateArrangement(team, arr);
  const ratingsMode = statMode === 'ratings';

  // Minutaggio realistico nella "scorsa"/"storico": la linea attesa NON e' 650 PA
  // per tutti. Si proietta per FASCIA di rosa (titolare/panca/riserva, dalle liste
  // originali della squadra) cosi' le riserve hanno PA/gare da riserve e i titolari
  // non giocano tutti 162 uguali (vedi data/projection.ts: eta' + ruolo + annata).
  const batTierOf = new Map<string, BatTier>();
  team.lineup.forEach((b) => batTierOf.set(b.id, 'starter'));
  team.bench.forEach((b) => batTierOf.set(b.id, 'bench'));
  team.reserveBatters.forEach((b) => batTierOf.set(b.id, 'reserve'));
  const projYear = () => season.year - (statMode === 'hist' ? 2 : 1);
  const projBat = (b: Batter): BatLine =>
    seasonBatLine(projectBatterSeason(b, batTierOf.get(b.id) ?? 'bench', { seed, year: projYear(), day: SEASON_GAMES }));
  const projPit = (p: Pitcher): PitLine =>
    seasonPitLine(projectPitcherSeason(p, { seed, year: projYear(), day: SEASON_GAMES }));
  const lastName = (n: string) => n.split(' ').slice(-1)[0] || n;
  const posRank = (p: Position) => FIELD_SLOTS.indexOf(p);
  const defOrder = [...lineup].sort(
    (a, b) => posRank(arr.defense[a.id] ?? a.position) - posRank(arr.defense[b.id] ?? b.position),
  );
  // Sintesi di squadra dello schieramento CORRENTE: si aggiorna a ogni mossa,
  // così si vede subito se una sostituzione migliora o peggiora. USA la STESSA
  // `teamStrength` della Panoramica lega (che include il LANCIO nell'OVR), così il
  // totale del Roster coincide con la "Forza" mostrata alla scelta squadra —
  // niente più OVR 82 nel Roster e 77 in panoramica.
  const built = buildManagedTeam(team, arr);
  // Panchina ORIGINALE (5 attivi), non quella di buildManagedTeam (che vi accorpa
  // anche le riserve profonde e diluirebbe la media): così il totale coincide
  // ESATTAMENTE con la "Forza" della Panoramica per l'assetto di default.
  const str = teamStrength({
    ...team,
    lineup: built.lineup,
    rotation: built.rotation,
    bullpen: built.bullpen,
  });
  const synth = { off: str.attack, def: str.defense, ovr: str.total };
  const staff = str.pitching;

  const update = (patch: Partial<MatchArrangement>) => {
    setArr((a) => ({ ...a, ...patch }));
    setSaveState('idle');
  };
  const reconcileOrder = (order: string[], participants: string[]): string[] => {
    const set = new Set(participants);
    const kept = order.filter((id) => set.has(id));
    const seen = new Set(kept);
    for (const id of participants) if (!seen.has(id)) kept.push(id);
    return kept;
  };

  // --- Fielders: operazioni --------------------------------------------
  const occupantOf = (slot: Position) =>
    Object.keys(arr.defense).find((id) => arr.defense[id] === slot);
  const setSlot = (slot: Position, x: string) => {
    const defense: Record<string, Position> = { ...arr.defense };
    const y = occupantOf(slot);
    const sx = defense[x];
    if (sx) {
      defense[x] = slot;
      if (y) defense[y] = sx;
    } else {
      if (y) delete defense[y];
      defense[x] = slot;
    }
    update({ defense, order: reconcileOrder(arr.order, Object.keys(defense)) });
  };
  // Riordino dell'ordine di battuta come SWAP: i due slot si SCAMBIANO e tutti
  // gli altri restano fermi (niente inserimento a scorrimento). La difesa, che e'
  // indipendente dall'ordine di battuta, non viene toccata.
  const reorderBatting = (targetId: string, draggedId: string) => {
    if (draggedId === targetId) return;
    const order = [...arr.order];
    const fromI = order.indexOf(draggedId);
    const toI = order.indexOf(targetId);
    if (fromI < 0 || toI < 0) return;
    [order[fromI], order[toI]] = [order[toI], order[fromI]];
    update({ order });
  };
  const substitute = (starterId: string, benchId: string) => {
    const order = arr.order.map((id) => (id === starterId ? benchId : id));
    const defense = { ...arr.defense };
    defense[benchId] = defense[starterId];
    delete defense[starterId];
    update({ order, defense });
  };
  const autoBat = () => update({ order: autoLineup(lineup).map((b) => b.id) });

  const dropLineupRow = (starterId: string) => {
    if (!drag) return;
    if (drag.from === 'lineup') reorderBatting(starterId, drag.id);
    else substitute(starterId, drag.id);
    setDrag(null);
  };
  const dropDefCell = (slot: Position) => {
    if (drag) {
      if (arr.order.includes(drag.id)) {
        setSlot(slot, drag.id); // gia' titolare: sposta/scambia la casella
      } else {
        // riserva trascinata sul campo: sostituisce chi occupa quella casella.
        const occ = occupantOf(slot);
        if (occ) substitute(occ, drag.id);
      }
    }
    setDrag(null);
  };
  // Riordino delle riserve come SWAP: le due riserve si scambiano di posto nella
  // preferenza (benchOrder), le altre restano ferme. Si parte dall'ordine mostrato.
  const reorderBench = (targetId: string, draggedId: string) => {
    if (draggedId === targetId) return;
    const ids = bench.map((b) => b.id);
    const fromI = ids.indexOf(draggedId);
    const toI = ids.indexOf(targetId);
    if (fromI < 0 || toI < 0) return;
    [ids[fromI], ids[toI]] = [ids[toI], ids[fromI]];
    update({ benchOrder: ids });
  };
  // Drop su una riga riserva: un TITOLARE trascinato qui (dalla lista battuta o
  // dalla difesa) fa lo swap e scende; una RISERVA trascinata su un'altra riserva
  // riordina la lista dei backup.
  const dropBenchRow = (benchId: string) => {
    if (drag && drag.id !== benchId) {
      if (arr.order.includes(drag.id)) substitute(drag.id, benchId);
      else reorderBench(benchId, drag.id);
    }
    setDrag(null);
  };

  // --- Pitchers: composizione staff via drag&drop ----------------------
  const usedP = new Set([...arr.rotation, ...arr.bullpen]);
  const availP = pitchers.filter((p) => !usedP.has(p.id));
  const placePitcher = (toList: 'rotation' | 'bullpen' | 'avail', targetId?: string) => {
    if (!drag) return;
    const id = drag.id;
    // Riordino DENTRO la stessa lista (rotazione o bullpen) = SWAP: i due si
    // scambiano di posto, gli altri restano fermi. Cross-lista resta uno spostamento
    // (il numero di lanciatori per lista e' variabile, non c'e' una casella fissa).
    if (drag.from === toList && targetId && id !== targetId && toList !== 'avail') {
      const swap = (list: string[]) => {
        const a = list.indexOf(id);
        const b = list.indexOf(targetId);
        if (a < 0 || b < 0) return list;
        const next = [...list];
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      };
      update(toList === 'rotation' ? { rotation: swap(arr.rotation) } : { bullpen: swap(arr.bullpen) });
      setDrag(null);
      return;
    }
    // Riserva -> attivi = SWAP (mai append): il lanciatore entra al posto del
    // target (o dell'ultimo se rilasciato sull'area vuota) e il rimpiazzato torna
    // in riserva. Cosi' la rosa attiva (rotazione+bullpen) resta a taglia costante.
    if (drag.from === 'avail' && toList !== 'avail') {
      const destList = toList === 'rotation' ? arr.rotation : arr.bullpen;
      if (destList.length === 0) {
        update(toList === 'rotation' ? { rotation: [id] } : { bullpen: [id] });
        setDrag(null);
        return;
      }
      const outId = targetId && destList.includes(targetId) ? targetId : destList[destList.length - 1];
      const newDest = destList.map((x) => (x === outId ? id : x));
      const closerId = arr.closerId === outId ? undefined : arr.closerId; // il rimpiazzato perde CL
      update(toList === 'rotation' ? { rotation: newDest, closerId } : { bullpen: newDest, closerId });
      setDrag(null);
      return;
    }
    let rotation = arr.rotation.filter((x) => x !== id);
    let bullpen = arr.bullpen.filter((x) => x !== id);
    const insert = (list: string[]) => {
      if (targetId && list.includes(targetId)) {
        const i = list.indexOf(targetId);
        return [...list.slice(0, i), id, ...list.slice(i)];
      }
      return [...list, id];
    };
    if (toList === 'rotation') rotation = insert(rotation);
    else if (toList === 'bullpen') bullpen = insert(bullpen);
    // Se il closer lascia il bullpen (va in rotazione o fuori), decade la nomina.
    const closerId = arr.closerId === id && toList !== 'bullpen' ? undefined : arr.closerId;
    update({ rotation, bullpen, closerId });
    setDrag(null);
  };
  // CL e' solo un'etichetta AGGIUNTIVA su un rilievo (tutti RP di base): il toggle
  // assegna/toglie il ruolo di closer a un singolo RP del bullpen. Uno solo alla
  // volta. In gara chiude le gare (buildManagedTeam lo mette per ultimo).
  const toggleCloser = (id: string) => {
    update({ closerId: arr.closerId === id ? undefined : id });
  };

  const save = async () => {
    setSaveState('saving');
    try {
      await onSave(arr);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };
  const start = () => {
    onApply(arr);
    onStart();
  };

  // --- Celle statistiche: ATTACCO (lineup) e DIFESA (schieramento) separate --
  const batAtkCells = (b: Batter) => {
    if (ratingsMode) {
      const r = b.ratings;
      return (
        <>
          <Rating v={r.contact} /><Rating v={r.power} /><Rating v={r.eye} /><Rating v={r.speed} />
        </>
      );
    }
    const s = statMode === 'season' ? seasonBatLine(season.bat[b.id]) : projBat(b);
    return (
      <>
        <td>{s.g}</td><td>{pct3(s.avg)}</td><td>{pct3(s.obp)}</td><td>{pct3(s.slg)}</td>
        <td>{s.h}</td><td>{s.d2}</td><td>{s.t3}</td><td>{s.hr}</td><td>{s.rbi}</td>
        <td>{s.bb}</td><td>{s.so}</td><td>{s.sb}</td>
      </>
    );
  };
  const batDefCells = (b: Batter, pos: Position) => {
    const rp = ratingsAtPosition(b, pos);
    if (ratingsMode) {
      return (
        <>
          <Rating v={rp.fielding} /><Rating v={rp.arm} /><Rating v={rp.speed} />
        </>
      );
    }
    const g = statMode === 'season' ? seasonBatLine(season.bat[b.id]).g : projBat(b).g;
    const d = defLine(pos, g, rp.fielding);
    return (
      <>
        <td>{g}</td><td>{d.e}</td><td>{d.a}</td><td>{d.po}</td><td>{d.fp ? pct3(d.fp) : '—'}</td>
      </>
    );
  };
  const pitStatCells = (p: Pitcher) => {
    if (ratingsMode) {
      const r = p.ratings;
      return (
        <>
          <Rating v={r.stuff} /><Rating v={r.control} /><Rating v={r.movement} />
          <Rating v={r.groundball} /><Rating v={r.stamina} /><Rating v={r.fielding} />
        </>
      );
    }
    const s = statMode === 'season' ? seasonPitLine(season.pit[p.id]) : projPit(p);
    return (
      <>
        <td>{s.w}</td><td>{s.l}</td><td>{s.g}</td><td>{s.gs}</td><td>{ipFmt(s.ipOuts)}</td>
        <td>{s.ip ? s.era.toFixed(2) : '—'}</td>
        <td>{s.h}</td><td>{s.bb}</td><td>{s.k}</td><td>{s.svo}</td><td>{s.sv}</td>
        <td>{s.whip.toFixed(2)}</td><td>{s.k9.toFixed(1)}</td>
      </>
    );
  };
  const batAtkCols = ratingsMode ? BAT_ATK_RATING_COLS : BAT_ATK_COLS;
  const batDefCols = ratingsMode ? BAT_DEF_RATING_COLS : BAT_DEF_COLS;
  const pitCols = ratingsMode ? PIT_RATING_COLS : PIT_COLS;

  // Riga pitcher riusabile per Rotazione / Bullpen / Disponibili.
  const pitcherRow = (p: Pitcher, from: string, i: number) => {
    const ri = restById.get(p.id);
    const resting = ri ? ri.restRemaining > 0 : false;
    const available = ri ? ri.available : true;
    return (
    <tr
      key={p.id}
      className={`drow${drag?.id === p.id ? ' dragging' : ''}`}
      draggable
      onDragStart={() => setDrag({ id: p.id, from })}
      onDragEnd={() => setDrag(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.stopPropagation();
        placePitcher(from === 'avail' ? 'avail' : (from as 'rotation' | 'bullpen'), p.id);
      }}
    >
      <td className="n">{from === 'avail' ? '' : i + 1}</td>
      <td className="l grip">
        ⠿ <PlayerLink player={p}>{p.name}</PlayerLink>
      </td>
      {canPickStarter && (
        <td className="rest-col">
          <span
            className={`rest-badge${resting ? ' resting' : ' ready'}`}
            title={resting ? `A riposo: ${ri!.restRemaining} gare` : 'Pronto a lanciare'}
          >
            {resting ? `+${ri!.restRemaining}g` : 'pronto'}
          </span>
        </td>
      )}
      {canPickStarter && (
        <td className="pick-col">
          {from === 'rotation' && (
            <button
              type="button"
              className={`start-pick${effectiveStarter === p.id ? ' sel' : ''}`}
              disabled={!available}
              onClick={() => onPickStarter(p.id)}
              title={
                available ? 'Fai partire oggi questo lanciatore' : 'A riposo: non può partire oggi'
              }
            >
              {effectiveStarter === p.id ? '✓ parte' : 'parte'}
            </button>
          )}
        </td>
      )}
      <td>{p.age}</td>
      <td className="roles">
        <span
          className={`rolebadge${potentialRole(p.ratings) === 'SP/RP' ? ' swing' : ''}`}
          title="Ruoli potenziali (dalla resistenza): dove è schierato si vede dalla sezione"
        >
          {potentialRole(p.ratings)}
        </span>
        {from === 'bullpen' && (
          <button
            type="button"
            className={`cl-toggle${p.id === arr.closerId ? ' on' : ''}`}
            onClick={() => toggleCloser(p.id)}
            title={
              p.id === arr.closerId
                ? 'Closer (chiude le gare) — clic per togliere l’etichetta'
                : 'Dai a questo rilievo anche il ruolo di closer'
            }
          >
            CL
          </button>
        )}
      </td>
      <td className="ovr"><OvrBadge overall={pitcherOverall(p.ratings)} /></td>
      <OvrBarCell id={p.id} overall={pitcherOverall(p.ratings)} potential={p.potential} age={p.age} />
      <PotCell id={p.id} overall={pitcherOverall(p.ratings)} potential={p.potential} age={p.age} />
      {pitStatCells(p)}
    </tr>
    );
  };

  const pitTable = (
    title: string,
    hint: string,
    list: 'rotation' | 'bullpen' | 'avail',
    rows: Pitcher[],
  ) => (
    <div
      className="card"
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => placePitcher(list)}
    >
      <div className="card-title">
        {title} <InfoDot onClick={() => setLegend('pit')} /> <span className="card-sub">{hint}</span>
      </div>
      <div className="roster-scroll">
        <table className="ratings roster-tbl">
          <thead>
            <tr>
              <th className="n">#</th>
              <th className="l">Lanciatore</th>
              {canPickStarter && <th className="rest-col" title="Riposo residuo prima di poter rilanciare">RIP.</th>}
              {canPickStarter && <th className="pick-col" title="Partente del giorno (scegli nella rotazione)">PARTE</th>}
              <th title="Età">ETÀ</th>
              <th>RUOLO</th>
              <th title="Valore totale">OVR</th>
              <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
              <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
              {pitCols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => pitcherRow(p, list, i))}
            {rows.length === 0 && (
              <tr>
                <td className="l" colSpan={(canPickStarter ? 9 : 7) + pitCols.length}>
                  {list === 'avail' ? 'Nessun disponibile.' : 'Trascina qui un lanciatore.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="page roster-page">
      <div className="subhead">
        <div className="subtabs">
          <button
            className={tab === 'fielders' ? 'subtab active' : 'subtab'}
            onClick={() => setTab('fielders')}
          >
            Fielders
          </button>
          <button
            className={tab === 'pitchers' ? 'subtab active' : 'subtab'}
            onClick={() => setTab('pitchers')}
          >
            Pitchers
          </button>
          {tab === 'fielders' && (
            <div className="seg view-seg">
              <button
                className={`seg-btn${fieldView === 'lineup' ? ' active' : ''}`}
                onClick={() => setFieldView('lineup')}
              >
                ⚾ Lineup
              </button>
              <button
                className={`seg-btn${fieldView === 'defense' ? ' active' : ''}`}
                onClick={() => setFieldView('defense')}
              >
                🛡 Difesa
              </button>
            </div>
          )}
        </div>

        <div className="rp-actions">
          <div className="seg stat-seg">
            {(['season', 'last', 'hist', 'ratings'] as RosterStat[]).map((m) => (
              <button
                key={m}
                className={`seg-btn${statMode === m ? ' active' : ''}`}
                onClick={() => setStatMode(m)}
              >
                {ROSTER_STAT_LABEL[m]}
              </button>
            ))}
          </div>
          {!check.ok && <span className="manage-warn inline">⚠ {check.errors[0]}</span>}
          <button className="btn" onClick={autoBat} title="Ordine di battuta automatico">
            ⚙ Auto
          </button>
          <button className="btn" onClick={() => onApply(arr)} disabled={!check.ok}>
            ✓ Applica
          </button>
          <button className="btn" onClick={save} disabled={!check.ok || saveState === 'saving'}>
            {saveState === 'saving' ? '… Salvataggio' : '💾 Salva'}
          </button>
          {activeGame && (
            <button className="btn primary" onClick={start} disabled={!check.ok}>
              ▶ Entra in campo
            </button>
          )}
          <span className={`save-state ${saveState}`}>
            {saveState === 'saved' && 'Salvato'}
            {saveState === 'error' && 'Errore (offline?)'}
          </span>
        </div>
      </div>

      <div className="team-synth">
        <span className="ts-team">
          <TeamBadge team={team} size={16} /> {team.abbrev}
        </span>
        <SynthBadges synth={synth} staff={staff} />
        <span className="ts-hint">sintesi dello schieramento attuale · si aggiorna a ogni mossa</span>
      </div>

      {statMode === 'season' && (
        <div className="page-note">
          Statistiche <b>reali</b> della stagione in corso (battuta e lancio), accumulate dalle
          partite giocate (giornata {season.day}). Le stat di <b>difesa</b> (E/A/PO/FLD%) sono
          ancora una stima: gli eventi difensivi non sono simulati dal motore.
        </div>
      )}
      {(statMode === 'last' || statMode === 'hist') && (
        <div className="page-note">
          Valori <b>attesi</b> derivati dai rating (backstory): finche' non completi stagioni
          gestite, "scorsa" e "storico" restano stime; poi si comporranno dagli anni realmente
          giocati.
        </div>
      )}

      {tab === 'fielders' ? (
        fieldView === 'lineup' ? (
          <div className="lineup-layout">
            <div className="card">
              <div className="card-title">
                Ordine di battuta <InfoDot onClick={() => setLegend('bat')} />{' '}
                <span className="card-sub">
                  trascina un titolare su un altro per scambiarli; un disponibile su un titolare = sostituzione
                </span>
              </div>
              <div className="roster-scroll">
                <table className="ratings roster-tbl">
                  <thead>
                    <tr>
                      <th className="n">#</th>
                      <th className="l">Giocatore</th>
                      <th className="age-h" title="Età">ETÀ</th>
                      <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                      <th title="Valore totale">OVR</th>
                      <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                      <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                      {batAtkCols.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineup.map((b, i) => (
                      <tr
                        key={b.id}
                        className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                        draggable
                        onDragStart={() => setDrag({ id: b.id, from: 'lineup' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                        onDrop={() => { dropLineupRow(b.id); setOver(null); }}
                      >
                        <td className="n">{i + 1}</td>
                        <td className="l grip">
                          ⠿ <PlayerLink player={b} pos={arr.defense[b.id] ?? b.position} tier={batTierOf.get(b.id)}>{b.name}</PlayerLink>
                        </td>
                        <td className="age">{b.age}</td>
                        <td className="roles">{rolesOf(b)}</td>
                        <td className="ovr"><OvrBadge overall={batterOverall(b.ratings)} /></td>
                        <OvrBarCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        <PotCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        {batAtkCells(b)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" onDragOver={(e) => e.preventDefault()}>
              <div className="card-title">
                Disponibili ({bench.length}) <InfoDot onClick={() => setLegend('bat')} />{' '}
                <span className="card-sub">trascina un titolare qui per scaricarlo · o riordina le riserve fra loro</span>
              </div>
              <div className="roster-scroll">
                <table className="ratings roster-tbl">
                  <thead>
                    <tr>
                      <th className="l">Giocatore</th>
                      <th className="age-h" title="Età">ETÀ</th>
                      <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                      <th title="Valore totale">OVR</th>
                      <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                      <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                      {batAtkCols.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bench.map((b) => (
                      <tr
                        key={b.id}
                        className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                        draggable
                        onDragStart={() => setDrag({ id: b.id, from: 'bench' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                        onDrop={() => { dropBenchRow(b.id); setOver(null); }}
                      >
                        <td className="l grip">
                          ⠿ <PlayerLink player={b} pos={b.position} tier={batTierOf.get(b.id) ?? 'bench'}>{b.name}</PlayerLink>
                        </td>
                        <td className="age">{b.age}</td>
                        <td className="roles">{rolesOf(b)}</td>
                        <td className="ovr"><OvrBadge overall={batterOverall(b.ratings)} /></td>
                        <OvrBarCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        <PotCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        {batAtkCells(b)}
                      </tr>
                    ))}
                    {bench.length === 0 && (
                      <tr>
                        <td className="l" colSpan={6 + batAtkCols.length}>
                          Nessun disponibile.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="def-layout">
            <div className="def-col-list">
              <div className="card">
                <div className="card-title">
                  Per posizione <InfoDot onClick={() => setLegend('def')} />{' '}
                  <span className="card-sub">
                    dal ricevitore al n.9; trascina un nome (o una riserva) su una riga/casella
                  </span>
                </div>
                <div className="roster-scroll">
                  <table className="ratings roster-tbl">
                    <thead>
                      <tr>
                        <th title="Casella difensiva">POS</th>
                        <th className="l">Giocatore</th>
                        <th className="age-h" title="Età">ETÀ</th>
                        <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                        <th title="Valore totale">OVR</th>
                        <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                        <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                        {batDefCols.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {defOrder.map((b) => {
                        const pos = arr.defense[b.id] ?? b.position;
                        const outOfRole = !canOccupy(b, pos);
                        return (
                          <tr
                            key={b.id}
                            className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                            draggable
                            onDragStart={() => setDrag({ id: b.id, from: 'def' })}
                            onDragEnd={() => { setDrag(null); setOver(null); }}
                            onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                            onDrop={(e) => { e.stopPropagation(); dropDefCell(pos); setOver(null); }}
                          >
                            <td>
                              <span className={`pos${pos === b.position ? '' : ' moved'}`}>{pos}</span>
                              {outOfRole && ' ⚠'}
                            </td>
                            <td className="l grip">
                              ⠿ <PlayerLink player={b} pos={pos} tier={batTierOf.get(b.id)}>{b.name}</PlayerLink>
                            </td>
                            <td className="age">{b.age}</td>
                            <td className="roles">{rolesOf(b)}</td>
                            <td className="ovr"><OvrBadge overall={batterOverall(ratingsAtPosition(b, pos))} /></td>
                            <OvrBarCell id={b.id} overall={batterOverall(ratingsAtPosition(b, pos))} potential={b.potential} age={b.age} />
                            <PotCell id={b.id} overall={batterOverall(ratingsAtPosition(b, pos))} potential={b.potential} age={b.age} />
                            {batDefCells(b, pos)}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  Riserve ({bench.length}) <InfoDot onClick={() => setLegend('def')} />{' '}
                  <span className="card-sub">trascina su una casella per schierarle · un titolare qui lo scarica · fra riserve = riordina</span>
                </div>
                <div className="roster-scroll">
                  <table className="ratings roster-tbl">
                    <thead>
                      <tr>
                        <th className="l">Giocatore</th>
                        <th className="age-h" title="Età">ETÀ</th>
                        <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                        <th title="Valore totale">OVR</th>
                        <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                        <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                        {batDefCols.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bench.map((b) => (
                        <tr
                          key={b.id}
                          className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                          draggable
                          onDragStart={() => setDrag({ id: b.id, from: 'bench' })}
                          onDragEnd={() => { setDrag(null); setOver(null); }}
                          onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                          onDrop={() => { dropBenchRow(b.id); setOver(null); }}
                        >
                          <td className="l grip">
                            ⠿ <PlayerLink player={b} pos={b.position} tier={batTierOf.get(b.id) ?? 'bench'}>{b.name}</PlayerLink>
                          </td>
                          <td className="age">{b.age}</td>
                          <td className="roles">{rolesOf(b)}</td>
                          <td className="ovr"><OvrBadge overall={batterOverall(b.ratings)} /></td>
                          <OvrBarCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                          <PotCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                          {batDefCells(b, b.position)}
                        </tr>
                      ))}
                      {bench.length === 0 && (
                        <tr>
                          <td className="l" colSpan={6 + batDefCols.length}>Nessuna riserva.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="def-col-field">
              <div className="card">
                <div className="card-title">
                  Schieramento{' '}
                  <span className="card-sub">le caselle sono FISSE: trascina i giocatori</span>
                </div>
                <div className="def-field">
                  <DefenseFieldSVG />
                  {FIELD_LAYOUT.map(({ pos, x, y }) => {
                    const id = occupantOf(pos);
                    const b = id ? bById.get(id) : undefined;
                    const outOfRole = b ? !canOccupy(b, pos) : false;
                    const natural = b ? pos === b.position : true;
                    const dif = b ? ratingsAtPosition(b, pos).fielding : 0;
                    return (
                      <div
                        key={pos}
                        className={`fpos${outOfRole ? ' warn' : ''}${over === `slot-${pos}` && drag ? ' over' : ''}${drag?.id === id ? ' dragging' : ''}`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        draggable={!!id}
                        onDragStart={() => id && setDrag({ id, from: 'def' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver(`slot-${pos}`); }}
                        onDrop={(e) => { e.stopPropagation(); dropDefCell(pos); setOver(null); }}
                        title={
                          b
                            ? natural
                              ? `${b.name} — DIF ${dif} (ruolo naturale)`
                              : `${b.name} — DIF ${dif} fuori ruolo (nat. ${b.ratings.fielding} in ${b.position})`
                            : undefined
                        }
                      >
                        <span className="fpos-lbl">{pos}</span>
                        <span className="fpos-name">
                          {b ? (
                            <PlayerLink player={b} pos={pos} tier={batTierOf.get(b.id)}>
                              {lastName(b.name)}
                            </PlayerLink>
                          ) : (
                            '—'
                          )}
                        </span>
                        {b && (
                          <span
                            className={`fpos-dif${natural ? '' : ' off'}`}
                            style={{ background: ratingColor(dif) }}
                          >
                            DIF {dif}
                            {!natural && (
                              <em className="difdelta">
                                {dif - b.ratings.fielding >= 0 ? '+' : ''}
                                {dif - b.ratings.fielding}
                              </em>
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {(() => {
                    const id = occupantOf('DH');
                    const b = id ? bById.get(id) : undefined;
                    return (
                      <div
                        className={`fpos dh${over === 'slot-DH' && drag ? ' over' : ''}${drag?.id === id ? ' dragging' : ''}`}
                        draggable={!!id}
                        onDragStart={() => id && setDrag({ id, from: 'def' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver('slot-DH'); }}
                        onDrop={(e) => { e.stopPropagation(); dropDefCell('DH'); setOver(null); }}
                      >
                        <span className="fpos-lbl">DH</span>
                        <span className="fpos-name">
                          {b ? (
                            <PlayerLink player={b} pos={'DH'} tier={batTierOf.get(b.id)}>
                              {lastName(b.name)}
                            </PlayerLink>
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          {canPickStarter && (
            <div className="card starter-bar">
              <span className="sb-label">
                Oggi parte:{' '}
                <b>{pById.get(effectiveStarter)?.lastName ?? '—'}</b>{' '}
                <span className="card-sub">
                  {starterChosen ? '(scelto)' : '(consigliato)'} · {rotLabel} · scegli
                  dall’elenco con “parte oggi”
                </span>
              </span>
              <span className="sb-actions">
                {!starterChosen && pById.get(effectiveStarter) && (
                  <button
                    className="btn small"
                    onClick={() => onPickStarter(effectiveStarter)}
                    title="Conferma il partente consigliato"
                  >
                    ✓ Conferma
                  </button>
                )}
                {todayStarter && (
                  <button
                    className="btn small ghost"
                    onClick={() => onPickStarter(null)}
                    title="Torna al partente consigliato (primo in ordine non a riposo)"
                  >
                    ↺ consigliato
                  </button>
                )}
              </span>
            </div>
          )}
          {pitTable(
            'Rotazione',
            canPickStarter
              ? 'ordine · riposo a lato · “parte oggi” per scegliere il partente'
              : 'ordine degli starter · il primo parte',
            'rotation',
            arr.rotation.map((id) => pById.get(id)).filter(Boolean) as Pitcher[],
          )}
          {pitTable(
            'Bullpen',
            "ordine d'ingresso · tocca CL per dare a un rilievo il ruolo di closer",
            'bullpen',
            arr.bullpen.map((id) => pById.get(id)).filter(Boolean) as Pitcher[],
          )}
          {pitTable('Disponibili', 'trascina in rotazione o bullpen (fa uno scambio)', 'avail', availP)}
        </>
      )}

      {legend && <StatLegend section={legend} onClose={() => setLegend(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagine argomentali raggiungibili dall'header. In questa fase Home (dashboard +
// calendario) e' completa; Leaderboard e Franchigia sono impalcature che si
// riempiranno nei rispettivi passi; Classifiche mostra gia' la struttura reale
// delle division. Tutte leggono la stessa lega generata da seed.
// ---------------------------------------------------------------------------

type ChipState = 'played' | 'current' | 'locked' | 'exhibition' | 'tbd';

function GameChip({
  g,
  league,
  state,
  result,
  onPlay,
}: {
  g: ScheduleGame;
  league: Team[];
  state: ChipState;
  result?: { us: number; them: number };
  onPlay: (g: ScheduleGame) => void;
}) {
  const opp = g.opponentId ? teamById(league, g.opponentId) : undefined;
  const playable = (state === 'current' || state === 'exhibition') && !!opp;
  const won = result ? result.us > result.them : false;
  return (
    <button
      className={`gchip ${state}`}
      disabled={!playable}
      onClick={() => playable && opp && onPlay(g)}
      title={
        opp
          ? `Giornata ${g.day}: ${g.home ? 'vs' : '@'} ${opp.name}${playable ? ' — gioca' : ''}`
          : `${g.round}: avversario da determinare`
      }
    >
      <span className="gday">{g.day}</span>
      <span className="gvs">{g.home ? 'vs' : '@'}</span>
      {opp ? (
        <>
          <span className="gdot" style={{ background: opp.primaryColor }} />
          <span className="gopp">{opp.abbrev}</span>
        </>
      ) : (
        <span className="gopp tbdlabel">{g.round}</span>
      )}
      {result && (
        <span className={`gres ${won ? 'w' : 'l'}`}>
          {won ? 'V' : 'P'} {result.us}-{result.them}
        </span>
      )}
    </button>
  );
}

/** Miglior giocatore per una metrica, tra chi ha almeno `minG` partite. */
function topBy<T>(
  players: T[],
  accOf: (t: T) => SeasonBat | SeasonPit | undefined,
  metric: (s: any) => number,
  minG = 1,
): { t: T; v: number } | null {
  let best: { t: T; v: number } | null = null;
  for (const t of players) {
    const s = accOf(t);
    if (!s || s.g < minG) continue;
    const v = metric(s);
    if (!best || v > best.v) best = { t, v };
  }
  return best;
}

function HomePage({
  league,
  managedTeam,
  schedule,
  season,
  playoff,
  nextPlayoffGame,
  onPlayoff,
  onBracket,
  onPlay,
  onOverview,
  onNewLeague,
}: {
  league: Team[];
  managedTeam: Team;
  schedule: Schedule;
  season: SeasonState;
  playoff: PlayoffState | null;
  nextPlayoffGame: NextGame | null;
  onPlayoff: () => void;
  onBracket: () => void;
  onPlay: (g: ScheduleGame) => void;
  onOverview: () => void;
  onNewLeague: () => void;
}) {
  const day = season.day;
  const current = schedule.regular[day];
  const currentOpp = current?.opponentId ? teamById(league, current.opponentId) : undefined;
  const rec = recordOf(season, managedTeam.id);

  // Leader di squadra (statistiche REALI accumulate).
  const myBatters = rosterBatters(managedTeam);
  const myPitchers = rosterPitchers(managedTeam);
  const batOf = (b: Batter) => season.bat[b.id];
  const pitOf = (p: Pitcher) => season.pit[p.id];
  const leaders: Array<{ label: string; who?: string; val: string; player?: Batter | Pitcher }> = [
    (() => {
      const x = topBy(myBatters, batOf, (s: SeasonBat) => s.hr);
      return { label: 'HR', who: x?.t.name, val: x ? `${x.v}` : '—', player: x?.t };
    })(),
    (() => {
      const x = topBy(myBatters, batOf, (s: SeasonBat) => s.rbi);
      return { label: 'RBI', who: x?.t.name, val: x ? `${x.v}` : '—', player: x?.t };
    })(),
    (() => {
      const x = topBy(myBatters, batOf, (s: SeasonBat) => (s.ab ? s.h / s.ab : 0), 5);
      return { label: 'AVG', who: x?.t.name, val: x ? x.v.toFixed(3).replace(/^0/, '') : '—', player: x?.t };
    })(),
    (() => {
      const x = topBy(myPitchers, pitOf, (s: SeasonPit) => s.w);
      return { label: 'W', who: x?.t.name, val: x ? `${x.v}` : '—', player: x?.t };
    })(),
    (() => {
      const x = topBy(myPitchers, pitOf, (s: SeasonPit) => s.so);
      return { label: 'K', who: x?.t.name, val: x ? `${x.v}` : '—', player: x?.t };
    })(),
    (() => {
      const x = topBy(myPitchers, pitOf, (s: SeasonPit) => s.sv);
      return { label: 'SV', who: x?.t.name, val: x ? `${x.v}` : '—', player: x?.t };
    })(),
  ];
  const played = Object.keys(season.results).length > 0;

  // Mini-classifica della mia division (reale).
  const myDiv = sortByRecord(season, divisionRivals(league, managedTeam.id));
  const divLeader = recordOf(season, myDiv[0]?.id ?? managedTeam.id);

  // Calendario a finestra: -3gg / oggi / +3gg (7 gare), scorrimento manuale.
  const regState = (i: number): ChipState =>
    i < day ? 'played' : i === day ? 'current' : 'locked';
  const WIN = 7;
  const maxStart = Math.max(0, schedule.regular.length - WIN);
  const [winStart, setWinStart] = useState(() => Math.min(maxStart, Math.max(0, day - 3)));
  const shift = (d: number) => setWinStart((s) => Math.max(0, Math.min(maxStart, s + d)));
  const slice = schedule.regular.slice(winStart, winStart + WIN);

  return (
    <div className="page home-page">
      <div className="card dash">
        <div className="dash-team">
          <TeamBadge team={managedTeam} size={40} />
          <div>
            <div className="dash-name">{managedTeam.name}</div>
            <div className="dash-sub">
              {LEAGUE_LABEL[managedTeam.league]} · {DIVISION_LABEL[managedTeam.division]} ·{' '}
              {rec.w}-{rec.l} · giornata {day}
            </div>
          </div>
        </div>
        {current && currentOpp && (
          <button className="btn primary next-game" onClick={() => onPlay(current)}>
            ▶ Gioca giornata {day + 1} {current.home ? 'vs' : '@'} {currentOpp.abbrev}
          </button>
        )}
        {playoff && (() => {
          const champ = playoff.championId ? teamById(league, playoff.championId) : undefined;
          const oppTeam = nextPlayoffGame ? teamById(league, nextPlayoffGame.opponentId) : undefined;
          if (champ) {
            const iWon = champ.id === managedTeam.id;
            return (
              <button className="btn primary next-game" onClick={onBracket}>
                🏆 {iWon ? 'Campioni!' : `Campione: ${champ.abbrev}`} — vedi il tabellone
              </button>
            );
          }
          if (nextPlayoffGame && oppTeam) {
            return (
              <button className="btn primary next-game" onClick={onPlayoff}>
                🏆 {ROUND_LABEL[nextPlayoffGame.round]} Gara {nextPlayoffGame.gameNo + 1}{' '}
                {nextPlayoffGame.home ? 'vs' : '@'} {oppTeam.abbrev}
              </button>
            );
          }
          return (
            <button className="btn primary next-game" onClick={onBracket}>
              🏆 Postseason — vedi il tabellone
            </button>
          );
        })()}
        <div className="dash-actions">
          <button className="btn" onClick={onOverview} title="Vedi tutte le squadre della lega">
            📋 Panoramica lega
          </button>
          <button className="btn" onClick={onNewLeague} title="Torna al menu (carica/nuova partita)">
            🏠 Menu
          </button>
        </div>
      </div>

      <div className="home-cards">
        <div className="card">
          <div className="card-title">
            Leader di squadra <span className="card-sub">stagione in corso (reali)</span>
          </div>
          {!played ? (
            <p className="muted">Nessuna partita giocata: i leader compaiono appena giochi.</p>
          ) : (
            <div className="leader-grid">
              {leaders.map((l) => (
                <div className="leader" key={l.label}>
                  <div className="lmain">
                    <span className="lwho">
                      {l.player ? (
                        <PlayerLink
                          player={l.player}
                          pos={isBatter(l.player) ? l.player.position : undefined}
                        >
                          {l.who}
                        </PlayerLink>
                      ) : (
                        (l.who ?? '—')
                      )}
                    </span>
                    <span className="lstat">{l.label}</span>
                  </div>
                  <span className="lval">{l.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            {DIVISION_LABEL[managedTeam.division]} · {LEAGUE_LABEL[managedTeam.league]}{' '}
            <span className="card-sub">classifica division</span>
          </div>
          <table className="ratings standings">
            <thead>
              <tr>
                <th className="l">Squadra</th>
                <th>V</th>
                <th>P</th>
                <th>GB</th>
              </tr>
            </thead>
            <tbody>
              {myDiv.map((t) => {
                const r = recordOf(season, t.id);
                const gb = gamesBehind(divLeader, r);
                return (
                  <tr key={t.id} className={t.id === managedTeam.id ? 'me' : undefined}>
                    <td className="l">
                      <TeamBadge team={t} size={16} /> {t.abbrev}
                    </td>
                    <td>{r.w}</td>
                    <td>{r.l}</td>
                    <td>{gb > 0 ? gb.toFixed(1) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card cal-section">
        <div className="card-title">
          Calendario{' '}
          <span className="card-sub">
            giornate {winStart + 1}–{Math.min(winStart + WIN, schedule.regular.length)} di{' '}
            {schedule.regular.length}
          </span>
          <div className="cal-nav">
            <button className="navbtn" onClick={() => setWinStart(0)} disabled={winStart === 0}>
              ⏮
            </button>
            <button className="navbtn" onClick={() => shift(-WIN)} disabled={winStart === 0}>
              ◀
            </button>
            <button
              className="navbtn"
              onClick={() => setWinStart(Math.min(maxStart, Math.max(0, day - 3)))}
              title="Vai al turno corrente"
            >
              ⦿ Turno
            </button>
            <button
              className="navbtn"
              onClick={() => shift(WIN)}
              disabled={winStart >= maxStart}
            >
              ▶
            </button>
            <button
              className="navbtn"
              onClick={() => setWinStart(maxStart)}
              disabled={winStart >= maxStart}
            >
              ⏭
            </button>
          </div>
        </div>
        <div className="match-grid">
          {slice.map((g, k) => {
            const i = winStart + k;
            const opp = g.opponentId ? teamById(league, g.opponentId) : undefined;
            if (!opp) return null;
            return (
              <MatchCard
                key={g.id}
                g={g}
                i={i}
                managedTeam={managedTeam}
                opp={opp}
                state={regState(i)}
                result={season.results[i]}
                myRec={recordOf(season, managedTeam.id)}
                oppRec={recordOf(season, opp.id)}
                onPlay={onPlay}
              />
            );
          })}
        </div>
      </div>

      {day === 0 && (
        <div className="card cal-section">
          <div className="card-title">
            Prestagione <span className="card-sub">amichevoli · non incidono su record/stat</span>
          </div>
          <div className="cal-chips">
            {schedule.preseason.map((g) => (
              <GameChip key={g.id} g={g} league={league} state="exhibition" onPlay={onPlay} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({
  g,
  i,
  managedTeam,
  opp,
  state,
  result,
  myRec,
  oppRec,
  onPlay,
}: {
  g: ScheduleGame;
  i: number;
  managedTeam: Team;
  opp: Team;
  state: ChipState;
  result?: { us: number; them: number };
  myRec: { w: number; l: number };
  oppRec: { w: number; l: number };
  onPlay: (g: ScheduleGame) => void;
}) {
  const mySP = managedTeam.rotation[i % managedTeam.rotation.length];
  const oppSP = opp.rotation[i % opp.rotation.length];
  const won = result ? result.us > result.them : false;
  return (
    <div className={`match-card ${state}`}>
      <div className="mc-head">
        <span className="mc-day">Giornata {g.day}</span>
        <span className="mc-loc">{g.home ? 'in casa' : 'in trasferta'}</span>
      </div>
      <div className="mc-teams">
        <span className="mc-team">
          <TeamBadge team={managedTeam} size={26} /> {managedTeam.abbrev}
          <span className="mc-rec">{myRec.w}-{myRec.l}</span>
        </span>
        <span className="mc-vs">{g.home ? 'vs' : '@'}</span>
        <span className="mc-team">
          <TeamBadge team={opp} size={26} /> {opp.abbrev}
          <span className="mc-rec">{oppRec.w}-{oppRec.l}</span>
        </span>
      </div>
      <div className="mc-sp" title="Lanciatori partenti probabili">
        <span className="mc-spn">{mySP?.name ?? '—'}</span>
        <span className="mc-vs2">SP</span>
        <span className="mc-spn">{oppSP?.name ?? '—'}</span>
      </div>
      <div className="mc-foot">
        {state === 'current' ? (
          <button className="btn primary sm" onClick={() => onPlay(g)}>
            ▶ Gioca
          </button>
        ) : state === 'played' && result ? (
          <span className={`mc-res ${won ? 'w' : 'l'}`}>
            {won ? 'Vittoria' : 'Sconfitta'} {result.us}-{result.them}
          </span>
        ) : (
          <span className="mc-status lock">Da giocare</span>
        )}
      </div>
    </div>
  );
}

function StandingsPage({
  league,
  season,
  managedId,
}: {
  league: Team[];
  season: SeasonState;
  managedId: string;
}) {
  const groups = byDivision(league);
  return (
    <div className="page standings-page">
      <div className="page-note">
        Classifica reale: i record si aggiornano a ogni giornata giocata (le altre partite
        della lega sono quick-simulate). Giornata corrente: {season.day}.
      </div>
      <div className="standings-grid">
        {groups.map((grp) => {
          const ordered = sortByRecord(season, grp.teams);
          const leader = recordOf(season, ordered[0].id);
          return (
            <div className="card" key={`${grp.league}-${grp.division}`}>
              <div className="card-title">
                {LEAGUE_LABEL[grp.league]} {DIVISION_LABEL[grp.division]}
              </div>
              <table className="ratings standings">
                <thead>
                  <tr>
                    <th className="l">Squadra</th>
                    <th>V</th>
                    <th>P</th>
                    <th>PCT</th>
                    <th>GB</th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((t) => {
                    const r = recordOf(season, t.id);
                    const gb = gamesBehind(leader, r);
                    return (
                      <tr key={t.id} className={t.id === managedId ? 'me' : undefined}>
                        <td className="l">
                          <TeamBadge team={t} size={18} /> {t.abbrev}{' '}
                          <span className="tname">{t.name}</span>
                        </td>
                        <td>{r.w}</td>
                        <td>{r.l}</td>
                        <td>{r.w + r.l ? pct3(winPct(r)) : '—'}</td>
                        <td>{gb > 0 ? gb.toFixed(1) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Postseason (tabellone giocabile) ----------------------------------------

const ROUND_LABEL: Record<Round, string> = {
  WC: 'Wild Card',
  DS: 'Division Series',
  LCS: 'Championship',
  WS: 'World Series',
};

/** Riga di una serie nel tabellone: due squadre col punteggio serie. */
function SeriesRow({
  series,
  league,
  managedId,
}: {
  series: Series;
  league: Team[];
  managedId: string;
}) {
  const high = series.highId ? teamById(league, series.highId) : undefined;
  const low = series.lowId ? teamById(league, series.lowId) : undefined;
  const need = winsNeeded(series.bestOf);
  const cell = (team: Team | undefined, wins: number, isWinner: boolean) => (
    <div
      className={`po-team${team?.id === managedId ? ' me' : ''}${isWinner ? ' win' : ''}`}
    >
      <span className="po-side">
        {team ? (
          <>
            <TeamBadge team={team} size={16} /> {team.abbrev}
          </>
        ) : (
          <span className="po-tbd">—</span>
        )}
      </span>
      <span className="po-wins">{team ? wins : ''}</span>
    </div>
  );
  const decided = !!series.winnerId;
  const live = !decided && !!high && !!low && (high.id === managedId || low.id === managedId);
  return (
    <div className={`po-series${live ? ' live' : ''}`}>
      {cell(high, series.highWins, series.winnerId === series.highId)}
      {cell(low, series.lowWins, series.winnerId === series.lowId)}
      <div className="po-meta">
        best-of-{series.bestOf} · a {need}
        {live ? ' · in corso' : ''}
      </div>
    </div>
  );
}

function PlayoffPage({
  league,
  playoff,
  managedId,
  nextGame,
  onPlay,
  onSimRest,
}: {
  league: Team[];
  playoff: PlayoffState;
  managedId: string;
  nextGame: NextGame | null;
  onPlay: () => void;
  onSimRest: () => void;
}) {
  const rounds = seriesByRound(playoff);
  const champ = playoff.championId ? teamById(league, playoff.championId) : undefined;
  const opp = nextGame ? teamById(league, nextGame.opponentId) : undefined;
  const eliminated = managedEliminated(playoff);
  const iAmChamp = champ?.id === managedId;

  return (
    <div className="page playoff-page">
      <div className="page-note">
        Postseason · anno {playoff.year}. Giochi le serie della tua squadra; le altre sono
        quick-simulate. Formato: Wild Card (bo3) → Division Series (bo5) → Championship (bo7) →
        World Series (bo7).
      </div>

      {champ && (
        <div className={`card po-champion${iAmChamp ? ' mine' : ''}`}>
          <TeamBadge team={champ} size={48} />
          <div>
            <div className="po-champ-title">🏆 {iAmChamp ? 'Campioni del mondo!' : 'Campione'}</div>
            <div className="po-champ-name">{champ.name}</div>
          </div>
        </div>
      )}

      {!champ && nextGame && opp && (
        <button className="btn primary po-cta" onClick={onPlay}>
          ▶ {ROUND_LABEL[nextGame.round]} — Gara {nextGame.gameNo + 1}{' '}
          {nextGame.home ? 'in casa vs' : 'in trasferta @'} {opp.abbrev}
        </button>
      )}

      {!champ && !nextGame && eliminated && (
        <div className="card po-out">
          <div>La tua stagione è finita: eliminata dai playoff.</div>
          <button className="btn primary" onClick={onSimRest}>
            Simula il resto della postseason ▸
          </button>
        </div>
      )}

      <div className="po-bracket">
        {(['WC', 'DS', 'LCS', 'WS'] as Round[]).map((r) => (
          <div className="po-col" key={r}>
            <div className="po-col-title">{ROUND_LABEL[r]}</div>
            {rounds[r].map((s) => (
              <SeriesRow key={s.id} series={s} league={league} managedId={managedId} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Leaderboard di lega -----------------------------------------------------
// La squadra gestita contribuisce con le stat REALI accumulate; le altre 29 con
// una proiezione credibile dai rating (vedi data/projection.ts). A stagione non
// ancora iniziata (giorno 0) si mostra la proiezione piena come anteprima.

interface LbBat {
  id: string;
  name: string;
  team: Team;
  managed: boolean;
  line: BatLine;
  pa: number;
  player: Batter;
}
interface LbPit {
  id: string;
  name: string;
  team: Team;
  managed: boolean;
  line: PitLine;
  player: Pitcher;
}

interface LbCol<R> {
  key: string;
  label: string;
  get: (r: R) => number;
  fmt: (r: R) => string;
  /** true = piu' basso e' meglio (ordina crescente per default). */
  asc?: boolean;
}

const BAT_LB_COLS: LbCol<LbBat>[] = [
  { key: 'g', label: 'G', get: (r) => r.line.g, fmt: (r) => `${r.line.g}` },
  { key: 'avg', label: 'AVG', get: (r) => r.line.avg, fmt: (r) => pct3(r.line.avg) },
  { key: 'obp', label: 'OBP', get: (r) => r.line.obp, fmt: (r) => pct3(r.line.obp) },
  { key: 'slg', label: 'SLG', get: (r) => r.line.slg, fmt: (r) => pct3(r.line.slg) },
  { key: 'hr', label: 'HR', get: (r) => r.line.hr, fmt: (r) => `${r.line.hr}` },
  { key: 'rbi', label: 'RBI', get: (r) => r.line.rbi, fmt: (r) => `${r.line.rbi}` },
  { key: 'h', label: 'H', get: (r) => r.line.h, fmt: (r) => `${r.line.h}` },
  { key: 'd2', label: '2B', get: (r) => r.line.d2, fmt: (r) => `${r.line.d2}` },
  { key: 't3', label: '3B', get: (r) => r.line.t3, fmt: (r) => `${r.line.t3}` },
  { key: 'bb', label: 'BB', get: (r) => r.line.bb, fmt: (r) => `${r.line.bb}` },
  { key: 'so', label: 'SO', get: (r) => r.line.so, fmt: (r) => `${r.line.so}` },
  { key: 'sb', label: 'SB', get: (r) => r.line.sb, fmt: (r) => `${r.line.sb}` },
];

const PIT_LB_COLS: LbCol<LbPit>[] = [
  { key: 'w', label: 'W', get: (r) => r.line.w, fmt: (r) => `${r.line.w}` },
  { key: 'l', label: 'L', get: (r) => r.line.l, fmt: (r) => `${r.line.l}`, asc: true },
  { key: 'era', label: 'ERA', get: (r) => r.line.era, fmt: (r) => r.line.era.toFixed(2), asc: true },
  { key: 'g', label: 'G', get: (r) => r.line.g, fmt: (r) => `${r.line.g}` },
  { key: 'gs', label: 'GS', get: (r) => r.line.gs, fmt: (r) => `${r.line.gs}` },
  { key: 'ip', label: 'IP', get: (r) => r.line.ipOuts, fmt: (r) => ipFmt(r.line.ipOuts) },
  { key: 'h', label: 'H', get: (r) => r.line.h, fmt: (r) => `${r.line.h}` },
  { key: 'bb', label: 'BB', get: (r) => r.line.bb, fmt: (r) => `${r.line.bb}` },
  { key: 'k', label: 'K', get: (r) => r.line.k, fmt: (r) => `${r.line.k}` },
  { key: 'whip', label: 'WHIP', get: (r) => r.line.whip, fmt: (r) => r.line.whip.toFixed(2), asc: true },
  { key: 'k9', label: 'K/9', get: (r) => r.line.k9, fmt: (r) => r.line.k9.toFixed(1) },
  { key: 'sv', label: 'SV', get: (r) => r.line.sv, fmt: (r) => `${r.line.sv}` },
];

const LB_LIMIT = 50;

function LbTable<
  R extends { id: string; name: string; team: Team; managed: boolean; player: Batter | Pitcher },
>({
  rows,
  cols,
  defaultKey,
}: {
  rows: R[];
  cols: LbCol<R>[];
  defaultKey: string;
}) {
  const def = cols.find((c) => c.key === defaultKey) ?? cols[0];
  const [sortKey, setSortKey] = useState(def.key);
  const [asc, setAsc] = useState(!!def.asc);
  const col = cols.find((c) => c.key === sortKey) ?? def;

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => col.get(a) - col.get(b));
    if (!asc) s.reverse();
    return s.slice(0, LB_LIMIT);
  }, [rows, col, asc]);

  const clickCol = (c: LbCol<R>) => {
    if (c.key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(c.key);
      setAsc(!!c.asc);
    }
  };

  if (rows.length === 0) {
    return <p className="muted">Nessun giocatore qualificato ancora: gioca qualche giornata.</p>;
  }

  return (
    <div className="roster-scroll">
      <table className="ratings lb-tbl">
        <thead>
          <tr>
            <th className="rank">#</th>
            <th className="l">Giocatore</th>
            <th className="l">Sq</th>
            {cols.map((c) => (
              <th
                key={c.key}
                className={`sortable${c.key === sortKey ? ' sorted' : ''}`}
                onClick={() => clickCol(c)}
                title="Ordina"
              >
                {c.label}
                {c.key === sortKey ? (asc ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.id} className={r.managed ? 'me' : undefined}>
              <td className="rank">{i + 1}</td>
              <td className="l name">
                <PlayerLink
                  player={r.player}
                  pos={isBatter(r.player) ? r.player.position : undefined}
                >
                  {r.name}
                </PlayerLink>
              </td>
              <td className="l">
                <TeamBadge team={r.team} size={15} /> {r.team.abbrev}
              </td>
              {cols.map((c) => (
                <td key={c.key} className={c.key === sortKey ? 'sorted' : undefined}>
                  {c.fmt(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeaderboardPage({
  league,
  season,
  seed,
  managedId,
}: {
  league: Team[];
  season: SeasonState;
  seed: number;
  managedId: string;
}) {
  const [tab, setTab] = useState<'batting' | 'pitching'>('batting');
  // Filtro settoriale del reparto lanciatori: partenti (>=10 aperture), rilievo
  // (<10), o tutti. Soglia robusta anche in proiezione (un SP proietta ~32 GS).
  const [pitScope, setPitScope] = useState<'all' | 'sp' | 'rp'>('all');
  const day = season.day;
  const preseason = day === 0;
  const projDay = preseason ? SEASON_GAMES : day;

  const batRows = useMemo<LbBat[]>(() => {
    const minPA = preseason ? 480 : Math.round(2.7 * day);
    const out: LbBat[] = [];
    for (const t of league) {
      const managed = t.id === managedId;
      const groups: Array<{ list: Batter[]; tier: BatTier }> = [
        { list: t.lineup, tier: 'starter' },
        { list: t.bench, tier: 'bench' },
        { list: t.reserveBatters, tier: 'reserve' },
      ];
      for (const { list, tier } of groups) {
        for (const b of list) {
          let sb: SeasonBat | undefined;
          if (preseason) {
            sb = projectBatterSeason(b, tier, { seed, year: season.year, day: projDay });
          } else if (managed) {
            sb = season.bat[b.id]; // puro reale (undefined se non ha ancora giocato)
          } else {
            // Avversario: reale nelle gare contro di me + proiezione nelle altre.
            const real = season.bat[b.id];
            const k = real?.g ?? 0;
            const fill = projectBatterSeason(b, tier, { seed, year: season.year, day: Math.max(0, day - k) });
            sb = real ? addBat(real, fill) : fill;
          }
          if (!sb) continue;
          const pa = sb.ab + sb.bb;
          if (pa < minPA) continue;
          out.push({ id: b.id, name: b.name, team: t, managed, line: seasonBatLine(sb), pa, player: b });
        }
      }
    }
    return out;
  }, [league, season, seed, managedId, day, preseason, projDay]);

  const pitRows = useMemo<LbPit[]>(() => {
    const minOuts = preseason ? 150 : Math.max(1, Math.round(day));
    const out: LbPit[] = [];
    for (const t of league) {
      const managed = t.id === managedId;
      for (const p of rosterPitchers(t)) {
        let sp: SeasonPit | undefined;
        if (preseason) {
          sp = projectPitcherSeason(p, { seed, year: season.year, day: projDay });
        } else if (managed) {
          sp = season.pit[p.id];
        } else {
          const real = season.pit[p.id];
          const k = real?.g ?? 0;
          const fill = projectPitcherSeason(p, { seed, year: season.year, day: Math.max(0, day - k) });
          sp = real ? addPit(real, fill) : fill;
        }
        if (!sp || sp.outs < minOuts) continue;
        out.push({ id: p.id, name: p.name, team: t, managed, line: seasonPitLine(sp), player: p });
      }
    }
    return out;
  }, [league, season, seed, managedId, day, preseason, projDay]);

  const pitShown = useMemo<LbPit[]>(() => {
    if (pitScope === 'all') return pitRows;
    return pitRows.filter((r) => (pitScope === 'sp' ? r.line.gs >= 10 : r.line.gs < 10));
  }, [pitRows, pitScope]);

  return (
    <div className="page leaderboard-page">
      <div className="card">
        <div className="card-title">
          Leaderboard MLB{' '}
          <span className="card-sub">
            {preseason
              ? 'proiezione preseason (dai rating)'
              : `stagione in corso · giornata ${day}`}
          </span>
        </div>
        <div className="subtabs">
          <button
            className={tab === 'batting' ? 'subtab active' : 'subtab'}
            onClick={() => setTab('batting')}
          >
            Batting
          </button>
          <button
            className={tab === 'pitching' ? 'subtab active' : 'subtab'}
            onClick={() => setTab('pitching')}
          >
            Pitching
          </button>
        </div>

        {tab === 'pitching' && (
          <div className="subtabs pit-scope">
            {([
              ['all', 'Tutti'],
              ['sp', 'Partenti'],
              ['rp', 'Rilievo'],
            ] as const).map(([k, lbl]) => (
              <button
                key={k}
                className={pitScope === k ? 'subtab active' : 'subtab'}
                onClick={() => setPitScope(k)}
              >
                {lbl}
              </button>
            ))}
          </div>
        )}

        {tab === 'batting' ? (
          <LbTable key="bat" rows={batRows} cols={BAT_LB_COLS} defaultKey="hr" />
        ) : (
          <LbTable
            key={`pit-${pitScope}`}
            rows={pitShown}
            cols={PIT_LB_COLS}
            defaultKey={pitScope === 'rp' ? 'sv' : 'era'}
          />
        )}

        <p className="muted lb-note">
          {preseason
            ? 'Proiezione da rating con varianza d’annata: la classifica prende vita giocando.'
            : 'La tua squadra compare coi numeri REALI delle partite giocate; le altre con una proiezione credibile che si riallinea al totale d’annata a fine stagione.'}{' '}
          Primi {LB_LIMIT}; clic su una colonna per riordinare.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cap: indicatore payroll-vs-cap (modello a due confini), forza squadra, e il
// flusso d'ingresso (schermata iniziale + panoramica lega + scelta squadra).
// ---------------------------------------------------------------------------

const CAP_ZONE: Record<CapZone, { label: string; cls: string }> = {
  under: { label: 'Sotto cap', cls: 'under' },
  tax: { label: 'Fascia tassa', cls: 'tax' },
  over: { label: 'Oltre il muro', cls: 'over' },
};

/** Barra monte-ingaggi con tacche cap base e muro esterno; zona colorata. */
function CapIndicator({
  payroll,
  mode,
  compact,
}: {
  payroll: number;
  mode: LeagueMode;
  compact?: boolean;
}) {
  const base = mode.cap.amount;
  const wall = outerWall(base);
  const z = CAP_ZONE[capZone(payroll, mode)];
  const scale = wall * 1.12; // margine oltre il muro, così la tacca resta visibile
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;
  return (
    <div className={`cap-ind${compact ? ' compact' : ''}`}>
      <div
        className="cap-bar"
        title={`Monte-ingaggi $${payroll.toFixed(0)}M · cap base $${base}M · muro $${wall.toFixed(0)}M`}
      >
        <div className={`cap-fill ${z.cls}`} style={{ width: pct(payroll) }} />
        <div className="cap-mark base" style={{ left: pct(base) }} title={`Cap base $${base}M`} />
        <div className="cap-mark wall" style={{ left: pct(wall) }} title={`Muro $${wall.toFixed(0)}M`} />
      </div>
      {!compact && (
        <div className="cap-row">
          <span className={`cap-chip ${z.cls}`}>{z.label}</span>
          <span className="muted">
            ${payroll.toFixed(0)}M / cap ${base}M · muro ${wall.toFixed(0)}M
          </span>
        </div>
      )}
    </div>
  );
}

/** Tre barrette Attacco/Difesa/Lancio (scala 40-100). */
function StrengthBars({ s }: { s: TeamStrength }) {
  const rows: Array<[string, number]> = [
    ['ATT', s.attack],
    ['DIF', s.defense],
    ['LAN', s.pitching],
  ];
  return (
    <div className="str-bars">
      {rows.map(([k, v]) => (
        <div className="str-row" key={k}>
          <span className="str-k">{k}</span>
          <span className="str-track">
            <span
              className="str-fill"
              style={{ width: `${((v - 40) / 60) * 100}%`, background: ratingColor(v) }}
            />
          </span>
          <span className="str-v">{v.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}

/** Card di una partita salvata nell'hub (Continua / Elimina). */
function SavedGameCard({
  game,
  onLoad,
  onDelete,
}: {
  game: SavedGame;
  onLoad: (g: SavedGame) => void;
  onDelete: (slot: string) => void;
}) {
  const when = (() => {
    try {
      return new Date(game.updatedAt).toLocaleString('it-IT');
    } catch {
      return '';
    }
  })();
  const label = game.team ? `${game.team.abbrev} — ${game.team.name}` : game.managedTeamId ?? '—';
  const played = game.day > 0 || game.record.w + game.record.l > 0;
  return (
    <div className="save-card">
      <div className="save-badge">
        {game.team ? <TeamBadge team={game.team} size={34} /> : <span className="sc-icon">💾</span>}
      </div>
      <div className="save-info">
        <div className="save-name">{label}</div>
        <div className="save-meta">
          {game.source === 'historical' ? 'Storica' : 'Generata'} · Anno {game.year} ·{' '}
          {played ? `giornata ${game.day} · ${game.record.w}-${game.record.l}` : 'nuova'}
        </div>
        {when && <div className="save-when muted">{when}</div>}
      </div>
      <div className="save-actions">
        <button className="btn primary" onClick={() => onLoad(game)}>
          Continua ▸
        </button>
        <button
          className="btn ghost danger"
          title="Elimina partita"
          onClick={() => {
            if (confirm(`Eliminare la partita ${label}? L'operazione è irreversibile.`)) {
              onDelete(game.slot);
            }
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

/** Hub iniziale: continua una partita salvata (caricamento) o iniziane una nuova. */
/** Occhiello (una riga) per ciascuna annata storica giocabile. */
const HISTORICAL_YEAR_BLURB: Record<number, string> = {
  1997: 'Griffey Jr. da 56 HR e Larry Walker MVP, Roger Clemens di nuovo Cy Young. Solo 28 squadre: Arizona e Tampa Bay debuttano nel 1998.',
  1998: "L'estate dei fuoricampo: McGwire 70, Sosa 66. Arrivano Diamondbacks e Devil Rays, gli Yankees vincono 114 gare.",
  1999: "L'attacco da 1009 punti di Cleveland, il Pedro Martinez da 2.07/313K, e tutti gli altri.",
  2000: 'Offesa alle stelle e il Pedro Martinez da 1.74 di ERA: forse la miglior stagione da lanciatore dell\'epoca.',
  2001: 'I 73 fuoricampo di Barry Bonds, i 372 K di Randy Johnson, l\'esordio di Ichiro da .350 e 242 valide.',
  2002: 'Bonds da .370 e OBP .582, gli A\'s di Moneyball con 20 vittorie di fila, Randy Johnson di nuovo a 334 K.',
  2003: 'Il breakout di Pujols (.359/43 HR), le 55/55 salvezze di Éric Gagné a 1.20 di ERA, Bonds ancora devastante.',
  2004: 'La stagione da .372/232 valide di Ichiro (record MLB), Bonds con OBP .609, i Cardinals da 105 vittorie.',
  2005: 'La rimonta iridata dei White Sox, Derrek Lee sfiora la Tripla Corona, gli Angels e i Nationals cambiano casa.',
};

function StartScreen({
  savedGames,
  onLoad,
  onDelete,
  onNewGenerated,
  onNewHistorical,
}: {
  savedGames: SavedGame[];
  onLoad: (g: SavedGame) => void;
  onDelete: (slot: string) => void;
  onNewGenerated: () => void;
  onNewHistorical: (year: number) => void;
}) {
  const [histYear, setHistYear] = useState<number>(DEFAULT_HISTORICAL_YEAR);
  const blurb =
    HISTORICAL_YEAR_BLURB[histYear] ??
    `Le rose reali del ${histYear} dall'archivio (rose sbilanciate, cap morbido).`;
  return (
    <div className="app start-app">
      <div className="start-hero">
        <div className="start-title">
          <span className="logo">⚾</span> MLBSim
        </div>
        <div className="start-sub">
          Simulatore di baseball testuale · epoca alta offesa anni '90/2000
        </div>
      </div>

      {savedGames.length > 0 && (
        <section className="start-section">
          <div className="start-section-title">Continua una partita</div>
          <div className="save-list">
            {savedGames.map((g) => (
              <SavedGameCard key={g.slot} game={g} onLoad={onLoad} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}

      <section className="start-section">
        <div className="start-section-title">Nuova partita</div>
        <div className="start-cards">
          <button className="start-card" onClick={onNewGenerated}>
            <div className="sc-icon">🎲</div>
            <div className="sc-title">Nuova carriera generata</div>
            <div className="sc-desc">
              30 franchigie con rose procedurali da un seed casuale. Calendario 162 gare, cap a due
              confini, evoluzione negli anni.
            </div>
          </button>
          <div className="start-card start-card--historical">
            <div className="sc-icon">📜</div>
            <div className="sc-title">Stagione storica {histYear}</div>
            <div className="sc-year-picker" role="group" aria-label="Scegli l'annata">
              {HISTORICAL_YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`sc-year${y === histYear ? ' is-active' : ''}`}
                  aria-pressed={y === histYear}
                  onClick={() => setHistYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="sc-desc">{blurb}</div>
            <button
              type="button"
              className="sc-start-btn"
              onClick={() => onNewHistorical(histYear)}
            >
              Inizia il {histYear} →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Dettaglio rosa di una squadra nella panoramica (modale). */
function TeamDetailModal({
  team,
  mode,
  onClose,
  onPick,
  canManage = true,
}: {
  team: Team;
  mode: LeagueMode;
  onClose: () => void;
  onPick: () => void;
  /** Se false (carriera avviata) la squadra gestita è bloccata: niente switch. */
  canManage?: boolean;
}) {
  const s = teamStrength(team);
  const pay = teamPayroll(team);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal team-detail" onClick={(e) => e.stopPropagation()}>
        <div className="td-head">
          <TeamBadge team={team} size={40} />
          <div className="td-id">
            <div className="td-name">{team.name}</div>
            <div className="muted">
              {LEAGUE_LABEL[team.league]} · {DIVISION_LABEL[team.division]}
            </div>
          </div>
          <button className="btn ghost" onClick={onClose} title="Chiudi">
            ✕
          </button>
        </div>
        <div className="td-strength">
          <div className="td-total">
            Forza <b style={{ color: ratingColor(s.total) }}>{s.total.toFixed(0)}</b>
          </div>
          <StrengthBars s={s} />
        </div>
        <CapIndicator payroll={pay} mode={mode} />
        <div className="td-rosters">
          <div className="td-col">
            <div className="card-title">Lineup</div>
            <table className="ratings">
              <thead>
                <tr>
                  <th className="l">Giocatore</th>
                  <th>Pos</th>
                  <th>Età</th>
                  <th>OVR</th>
                  <th>$M</th>
                </tr>
              </thead>
              <tbody>
                {team.lineup.map((b) => {
                  const o = batterOverall(b.ratings);
                  return (
                    <tr key={b.id}>
                      <td className="l">{upperLast(b.name)}</td>
                      <td>{b.position}</td>
                      <td>{b.age}</td>
                      <td style={{ color: ratingColor(o) }}>{o.toFixed(0)}</td>
                      <td>{b.salary.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="td-col">
            <div className="card-title">Rotazione</div>
            <table className="ratings">
              <thead>
                <tr>
                  <th className="l">Lanciatore</th>
                  <th>Ruolo</th>
                  <th>Età</th>
                  <th>OVR</th>
                  <th>$M</th>
                </tr>
              </thead>
              <tbody>
                {team.rotation.map((p) => {
                  const o = pitcherOverall(p.ratings);
                  return (
                    <tr key={p.id}>
                      <td className="l">{upperLast(p.name)}</td>
                      <td>{p.role}</td>
                      <td>{p.age}</td>
                      <td style={{ color: ratingColor(o) }}>{o.toFixed(0)}</td>
                      <td>{p.salary.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="td-foot">
          <span className="muted">Monte-ingaggi ${pay.toFixed(0)}M</span>
          {canManage ? (
            <button className="btn primary" onClick={onPick}>
              Gestisci questa squadra ▸
            </button>
          ) : (
            <span className="muted" title="La squadra gestita si sceglie a inizio carriera e non cambia in corso di stagione">
              🔒 Squadra gestita bloccata a stagione avviata
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Etichetta del tipo di gioco (sorgente della lega) per l'indicatore d'header.
 * Stessa vocabolario della SavedGameCard ("Storica"/"Generata"), per coerenza.
 */
function gameTypeLabel(source: LeagueSource): { icon: string; label: string } {
  return source === 'historical'
    ? { icon: '📜', label: 'Storica' }
    : { icon: '🎲', label: 'Generata' };
}

/**
 * Badge FISSO d'header: tipo di gioco + anno di stagione. Sempre visibile — dalla
 * panoramica lega a tutte le pagine di gioco — così il giocatore ha sempre
 * presente COSA sta giocando e in che stagione. L'anno è `season.year`:
 * PROGRESSIVO da 1 in modalità generata, ANNO REALE (+avanzamenti) in storica.
 */
function GameInfoBadge({ source, year }: { source: LeagueSource; year: number }) {
  const { icon, label } = gameTypeLabel(source);
  const full = source === 'historical' ? `Stagione storica ${year}` : `Carriera generata · anno ${year}`;
  return (
    <div className="game-info" title={`Tipo di gioco: ${full}`}>
      <span className="gi-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="gi-type">{label}</span>
      <span className="gi-sep" aria-hidden="true">
        ·
      </span>
      <span className="gi-year">Anno {year}</span>
    </div>
  );
}

/** Panoramica lega: 30 squadre per division con forza e cap; scelta squadra. */
function LeagueOverview({
  league,
  seed,
  mode,
  year,
  onPick,
  onBack,
  embedded = false,
}: {
  league: Team[];
  seed: number;
  mode: LeagueMode;
  /** Anno/stagione corrente, per il badge d'header (assente in modalità embedded). */
  year?: number;
  onPick: (id: string) => void;
  onBack?: () => void;
  /** Incorporata come pagina DENTRO la partita (usa la header di gioco): niente
   *  topbar né "Indietro" propri, così non si esce dal flusso di gioco. */
  embedded?: boolean;
}) {
  const [selId, setSelId] = useState<string>('');
  const groups = byDivision(league);
  const sel = selId ? teamById(league, selId) : undefined;
  return (
    <div className={embedded ? 'overview-embed' : 'app overview-app'}>
      {!embedded && (
        <header className="topbar">
          <div className="brand">
            <span className="logo">⚾</span> MLBSim <span className="phase">Panoramica lega</span>
          </div>
          {year != null && <GameInfoBadge source={mode.source} year={year} />}
          <div className="actions">
            <span className="muted seed-note">seed {seed}</span>
            <button className="btn" onClick={onBack}>
              ← Indietro
            </button>
          </div>
        </header>
      )}
      <div className="page overview-page">
        <div className="ov-legend">
          <span>
            {embedded ? 'Panoramica della lega' : 'Scegli la squadra da gestire'}. Forza 40-100 ·
            monte-ingaggi vs cap ${mode.cap.amount}M (muro ${outerWall(mode.cap.amount).toFixed(0)}M).
          </span>
          <span className="cap-legend">
            <span className="cap-chip under">Sotto</span>
            <span className="cap-chip tax">Tassa</span>
            <span className="cap-chip over">Oltre muro</span>
          </span>
        </div>
        {groups.map((g) => (
          <div className="ov-div" key={`${g.league}-${g.division}`}>
            <div className="ov-div-title">
              {LEAGUE_LABEL[g.league]} · {DIVISION_LABEL[g.division]}
            </div>
            <div className="ov-grid">
              {g.teams.map((t) => {
                const s = teamStrength(t);
                const pay = teamPayroll(t);
                const zone = capZone(pay, mode);
                return (
                  <button
                    key={t.id}
                    className={`ov-card${selId === t.id ? ' sel' : ''}`}
                    onClick={() => setSelId(t.id)}
                  >
                    <div className="ov-head">
                      <TeamBadge team={t} size={30} />
                      <div className="ov-name">
                        <div className="ov-abbrev">{t.abbrev}</div>
                        <div className="ov-full">{t.name}</div>
                      </div>
                      <div className="ov-total" style={{ color: ratingColor(s.total) }}>
                        {s.total.toFixed(0)}
                      </div>
                    </div>
                    <StrengthBars s={s} />
                    <div className="ov-cap">
                      <CapIndicator payroll={pay} mode={mode} compact />
                      <span className={`cap-chip ${zone}`}>${pay.toFixed(0)}M</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {sel && (
        <TeamDetailModal
          team={sel}
          mode={mode}
          onClose={() => setSelId('')}
          onPick={() => onPick(sel.id)}
          canManage={!embedded}
        />
      )}
    </div>
  );
}

function FranchisePage({ team, mode }: { team: Team; mode: LeagueMode }) {
  const pay = teamPayroll(team);
  return (
    <div className="page">
      <div className="card">
        <div className="card-title">
          <TeamBadge team={team} size={22} /> Franchigia — {team.name}
        </div>
        <div className="fr-cap">
          <div className="card-sub">Monte-ingaggi vs salary cap</div>
          <CapIndicator payroll={pay} mode={mode} />
          <p className="muted">
            Cap a <b>due confini</b> (base + muro esterno): oggi è solo un <b>indicatore</b>.
            L'enforce (riconciliazione al rollover via pool, margine di sforamento per-squadra,
            scambi/rinnovi che rispettano il cap) arriva col layer gestionale. Vedi
            docs/franchise.md § Salary cap.
          </p>
        </div>
      </div>
      <RosterSalaryTable team={team} />
      <div className="card page-stub">
        <p className="muted">
          Stipendio unico annuale, cap soft, scambi a valore, draft basilare: i controlli di
          gestione (rinnovi, scambi) arriveranno qui.
        </p>
      </div>
    </div>
  );
}

interface FrRow {
  id: string;
  name: string;
  kind: 'B' | 'P';
  role: string;
  tier: string;
  age: number;
  ovr: number;
  salary: number;
}

/** Elenco COMPLETO della rosa (battitori + lanciatori) per giudicarla sul piano
 *  salariale: tipo, ruolo, reparto, età, rating e stipendio, ordinato per costo. */
function RosterSalaryTable({ team }: { team: Team }) {
  const bRow = (b: Batter, tier: string): FrRow => ({
    id: b.id,
    name: b.name,
    kind: 'B',
    role: b.position,
    tier,
    age: b.age,
    ovr: batterOverall(b.ratings),
    salary: b.salary,
  });
  const pRow = (p: Pitcher, tier: string): FrRow => ({
    id: p.id,
    name: p.name,
    kind: 'P',
    role: p.role,
    tier,
    age: p.age,
    ovr: pitcherOverall(p.ratings),
    salary: p.salary,
  });
  const rows: FrRow[] = [
    ...team.lineup.map((b) => bRow(b, 'Titolare')),
    ...team.bench.map((b) => bRow(b, 'Panca')),
    ...team.reserveBatters.map((b) => bRow(b, 'Riserva')),
    ...team.rotation.map((p) => pRow(p, 'Rotazione')),
    ...team.bullpen.map((p) => pRow(p, 'Bullpen')),
    ...team.reservePitchers.map((p) => pRow(p, 'Riserva')),
  ].sort((a, b) => b.salary - a.salary);

  const total = Math.round(rows.reduce((s, r) => s + r.salary, 0) * 10) / 10;
  const avgAge = rows.length ? Math.round((rows.reduce((s, r) => s + r.age, 0) / rows.length) * 10) / 10 : 0;

  return (
    <div className="card">
      <div className="card-title">
        Rosa completa{' '}
        <span className="card-sub">
          {rows.length} giocatori · monte-ingaggi ${total.toFixed(1)}M · età media {avgAge}
        </span>
      </div>
      <table className="ratings fr-roster">
        <thead>
          <tr>
            <th className="l">Giocatore</th>
            <th>Tipo</th>
            <th>Ruolo</th>
            <th>Reparto</th>
            <th>Età</th>
            <th>OVR</th>
            <th>$M</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="l">{upperLast(r.name)}</td>
              <td>
                <span className={`type-chip ${r.kind === 'B' ? 'bat' : 'pit'}`}>
                  {r.kind === 'B' ? 'Bat' : 'Lan'}
                </span>
              </td>
              <td>{r.role}</td>
              <td className="tier">{r.tier}</td>
              <td>{r.age}</td>
              <td className="ovr">
                <OvrBadge overall={r.ovr} />
              </td>
              <td className="sal">{r.salary.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
