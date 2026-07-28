import { createContext, useContext, useCallback, useEffect, useMemo, useReducer, useRef, useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { Batter, Pitcher, Position, Team } from '../engine/types';
import type { GameResult, TeamGameStats, PlayEvent } from '../engine/game';
import type { LiveGame, LiveSituation } from '../engine/game';
import type { BattingLine, PitchingLine } from '../engine/boxscore';
import {
  createLiveGame,
  situation,
  toGameResult,
  playOffense,
  attemptSteal,
  intentionalWalk,
  changePitcher,
  defenseSide,
  offenseSide,
  availableRelievers,
  substituteFielder,
  pinchRun,
  autoManageDefense,
  quickSim,
  hitAndRun,
  pinchHit,
  setInfieldIn,
} from '../engine/game';
import { batterOverall, pitcherOverall, RATING_AVG } from '../engine/ratings';
import { disambiguateLastNames } from '../engine/names';
import { ratingsAtPosition, canOccupy } from '../engine/positions';
import { teamSynthesis, staffSynthesis } from '../engine/teamRatings';
import type { TeamSynth } from '../engine/teamRatings';
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
import { formatIp, estimatedPitches } from '../engine/boxscore';
import {
  generateLeague,
  teamById,
  byDivision,
  divisionRivals,
  LEAGUE_LABEL,
  DIVISION_LABEL,
} from '../data/league';
import { generateSchedule } from '../data/schedule';
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
import { withRotationStarter, potentialRole } from '../data/generator';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import { stadiumImage, stadiumImageCandidates, assetUrl } from '../data/stadiumImages';
import type { StadiumImageCandidate } from '../data/stadiumImages';
import {
  getCalibrationFor,
  calibratedVariants,
  calibrationStem,
  PHOTO_DEFAULT_CALIBRATION,
  CALIBRATION_RANGE,
  CALIBRATION_LABEL,
} from '../data/stadiumCalibration';
import type { FieldCalibration, NumericCalKey } from '../data/stadiumCalibration';
import { gameSeed, newRandomSeed, ratingColor, upperLast } from './format';
import { Diamond, computeMarkers } from './Diamond';
import {
  batterStatLine,
  pitcherStatLine,
  STATS_MODE_SHORT,
  STATS_MODE_TITLE,
} from './statlines';
import type { StatItem, StatsMode } from './statlines';
import { buildCommentary, logLine, PHASE_MS, HOLD_MS } from './commentary';
import type { Commentary } from './commentary';
import { scoreCode } from './scorecode';

type View =
  | 'home'
  | 'roster'
  | 'overview'
  | 'leaderboard'
  | 'standings'
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
type Side = 'away' | 'home';

// ---------------------------------------------------------------------------
// Mini-popup giocatore (Fase 3): scheda compatta apribile da OVUNQUE compaia un
// nome (roster, partita, leaderboard, home). Per non passare callback attraverso
// tutta la gerarchia, un Context espone `openPlayer`; App monta il modale una
// volta sola con `season`/`seed` correnti. Solo UI: non tocca il motore.
// ---------------------------------------------------------------------------

interface PlayerModalRequest {
  player: Batter | Pitcher;
  /** Posizione difensiva "del momento" (fielder): usata per DIF alla posizione. */
  pos?: Position;
  /** Fascia di rosa per la proiezione "carriera/storico" (battitore). */
  tier?: BatTier;
}

/** True se il giocatore è un battitore (ha `bats`); i lanciatori hanno `throws`. */
function isBatter(p: Batter | Pitcher): p is Batter {
  return 'bats' in p;
}

const PlayerModalContext = createContext<(req: PlayerModalRequest) => void>(() => {});

/** Nome cliccabile che apre il mini-popup giocatore. Uno `span` (non `draggable`)
 *  così dentro le righe trascinabili del roster il drag continua a funzionare e
 *  il click apre la scheda. */
function PlayerLink({
  player,
  pos,
  tier,
  className,
  children,
}: {
  player: Batter | Pitcher;
  pos?: Position;
  tier?: BatTier;
  className?: string;
  children: ReactNode;
}) {
  const open = useContext(PlayerModalContext);
  const fire = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    open({ player, pos, tier });
  };
  return (
    <span
      className={`player-link${className ? ` ${className}` : ''}`}
      role="button"
      tabIndex={0}
      title="Apri scheda giocatore"
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fire(e);
        }
      }}
    >
      {/* Cognome in MAIUSCOLO quando il contenuto è un nome (stringa). */}
      {typeof children === 'string' ? upperLast(children) : children}
    </span>
  );
}

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
  // franchigia; l'avversario esce dal calendario della gara scelta.
  const league = useMemo(() => generateLeague(leagueSeed), [leagueSeed]);
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
  const teams = useMemo(() => {
    const base = applyArrangement(managedTeam, arrangement);
    // In regular season la rotazione GIRA col riposo: partente = scelta di oggi
    // o il consigliato dal ciclo. Prestagione/playoff: parte l'asso (rotation[0]).
    const rotIds = base.rotation.map((p) => p.id);
    const starterId = isRegularGame
      ? todayStarter ?? suggestedStarter(season.rotation, rotIds, season.day)
      : base.rotation[0]?.id;
    const applied = starterId ? withStarterId(base, starterId) : base;
    // L'avversario ruota anch'esso il partente (come il resto della lega).
    const oppDay = isRegularGame ? season.day : activeGame?.day ?? 0;
    const opp = withRotationStarter(opponent, oppDay);
    return controlled === 'home'
      ? { away: opp, home: applied }
      : { away: applied, home: opp };
  }, [managedTeam, opponent, controlled, arrangement, isRegularGame, todayStarter, season.rotation, season.day, activeGame]);

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
          const team =
            typeof pl.seed === 'number'
              ? teamById(generateLeague(pl.seed), managedTeamId)
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

  const persist = (arrs: Record<string, MatchArrangement>, seas: SeasonState) => {
    if (!currentSlot) return; // nessuno slot attivo: niente da salvare
    saveStore
      .save(currentSlot, { seed: leagueSeed, source, managedTeamId: myId, lineups: arrs, season: seas })
      .catch(() => {
        /* offline: si continua, si risalvera' piu' tardi. */
      });
  };

  // Dall'hub: avvia una NUOVA carriera con la sorgente scelta e vai alla
  // panoramica per scegliere la squadra da gestire.
  const startNewLeague = (src: LeagueSource) => {
    setSource(src);
    setLeagueSeed(newRandomSeed());
    setManagedId('');
    setArrangements({});
    setActiveGame(null);
    setSeason(createSeason());
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
        onNewHistorical={() => startNewLeague('historical')}
      />
    );
  }
  if (stage === 'league') {
    return (
      <LeagueOverview
        league={league}
        seed={leagueSeed}
        mode={leagueMode}
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
                isSeasonGame ? (
                  <button className="btn primary" onClick={advanceDay}>
                    Conferma e avanza ▸
                  </button>
                ) : (
                  <button
                    className="btn primary"
                    onClick={() => {
                      setActiveGame(null);
                      setView('home');
                    }}
                  >
                    Al calendario ▸
                  </button>
                )
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
                newLabel={isSeasonGame ? 'Conferma e avanza ▸' : 'Al calendario ▸'}
                onNew={
                  isSeasonGame
                    ? advanceDay
                    : () => {
                        setActiveGame(null);
                        setView('home');
                      }
                }
                onRecap={() => setRecapOpen(true)}
              />
            ) : (
              <ActionBar live={live} sit={sit} act={act} />
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

function GameScreen({
  result,
  sit,
  displayResult,
  displaySit,
  statsMode,
  setStatsMode,
  editing,
  cal,
  onMarkerMove,
  basesShown,
  runners,
  runnerSpeeds,
  batterName,
  shownPlays,
  onReveal,
  controls,
}: {
  result: GameResult;
  sit: LiveSituation;
  // Istantanea RITARDATA di result/sit: la plancia (scoreboard, difensori e
  // lanciatore sul campo, boxscore) mostra questa, che avanza solo al verdetto
  // della telecronaca. Il PlayBanner invece riceve il `result` REALE (deve
  // vedere subito la nuova giocata per animarla e poi far scattare il reveal).
  // Se omesse si usano result/sit reali (schermata calibrazione).
  displayResult?: GameResult;
  displaySit?: LiveSituation;
  statsMode: StatsMode;
  setStatsMode: (m: StatsMode) => void;
  editing: boolean;
  cal: FieldCalibration;
  onMarkerMove: (id: string, pos: { x: number; y: number }) => void;
  // Basi mostrate sul diamante: possono essere in ritardo rispetto a `sit.bases`
  // (rivelate al verdetto della cronaca). Se omesse, si usa lo stato reale.
  basesShown?: [boolean, boolean, boolean];
  runners?: (string | null)[];
  runnerSpeeds?: (number | null)[];
  batterName?: string | null;
  // Numero di giocate già "lette" al centro: le cronache laterali si fermano qui
  // per non anticipare l'esito. Se omesso, si mostra tutto.
  shownPlays?: number;
  onReveal?: () => void;
  controls: ReactNode;
}) {
  const dResult = displayResult ?? result;
  const dSit = displaySit ?? sit;
  const fieldBases = basesShown ?? dSit.bases;
  return (
    <div className="game-screen">
      <StatBar
        result={dResult}
        sit={dSit}
        basesShown={fieldBases}
        statsMode={statsMode}
        setStatsMode={setStatsMode}
      />

      <div className={editing ? 'gamefield editing' : 'gamefield'}>
        <Diamond
          home={dResult.home}
          away={dResult.away}
          background
          bases={fieldBases}
          runners={runners}
          runnerSpeeds={runnerSpeeds}
          batterName={batterName}
          defenseTeam={dSit.offenseSide === 'away' ? dResult.home : dResult.away}
          pitcherName={dSit.pitcher.name}
          cal={cal}
          editable={editing}
          onMarkerMove={onMarkerMove}
        />

        {!editing && <PlayBanner result={result} onReveal={onReveal} />}

        <div className="cronaca-corner left">
          <CronacaTeam result={result} side="away" shownPlays={shownPlays} />
        </div>
        <div className="cronaca-corner right">
          <CronacaTeam result={result} side="home" shownPlays={shownPlays} />
        </div>

        <div className="lineup-corner left">
          <LineupSide
            side="away"
            team={dResult.away}
            stats={dResult.awayStats}
            sit={dSit}
            mode={statsMode}
            setMode={setStatsMode}
          />
        </div>
        <div className="lineup-corner right">
          <LineupSide
            side="home"
            team={dResult.home}
            stats={dResult.homeStats}
            sit={dSit}
            mode={statsMode}
            setMode={setStatsMode}
          />
        </div>

        <div className="controls-overlay">{controls}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra stat (sotto l'header, fuori dallo sfondo stadio): info squadre + forza,
// giocatori coinvolti nell'azione, line score, toggle stat.
// ---------------------------------------------------------------------------

interface Involved {
  kind: 'batter' | 'pitcher';
  batter?: Batter;
  pitcher?: Pitcher;
  batLine?: BattingLine;
  pitLine?: PitchingLine;
}

function involvedFor(result: GameResult, sit: LiveSituation, side: Side): Involved {
  const stats = side === 'away' ? result.awayStats : result.homeStats;
  if (sit.offenseSide === side) {
    const b = sit.batter;
    return { kind: 'batter', batter: b, batLine: stats.batting.find((l) => l.id === b.id) };
  }
  const p = sit.pitcher;
  return { kind: 'pitcher', pitcher: p, pitLine: stats.pitching.find((l) => l.id === p.id) };
}

function StatBar({
  result,
  sit,
  basesShown,
  statsMode,
  setStatsMode,
}: {
  result: GameResult;
  sit: LiveSituation;
  basesShown?: [boolean, boolean, boolean];
  statsMode: StatsMode;
  setStatsMode: (m: StatsMode) => void;
}) {
  const arrow = sit.half === 'top' ? '▲' : '▼';
  const halfLabel = sit.half === 'top' ? 'attacco' : 'chiusura';
  const decided = sit.status === 'final';
  return (
    <div className="statbar">
      <TeamStatSide
        side="away"
        team={result.away}
        score={result.final.away}
        involved={involvedFor(result, sit, 'away')}
        mode={statsMode}
        setMode={setStatsMode}
        win={decided && sit.winner === 'away'}
      />

      <div className="statbar-center">
        <LineScore result={result} />
        <div className="sb-situation">
          <span className="sb-inning">
            {arrow} {sit.inning}° <span className="sb-half">{halfLabel}</span>
          </span>
          <BaseDiamond bases={basesShown ?? sit.bases} />
          <OutsDots outs={sit.outs} />
        </div>
      </div>

      <TeamStatSide
        side="home"
        team={result.home}
        score={result.final.home}
        involved={involvedFor(result, sit, 'home')}
        mode={statsMode}
        setMode={setStatsMode}
        win={decided && sit.winner === 'home'}
      />
    </div>
  );
}

function TeamStatSide({
  side,
  team,
  score,
  involved,
  mode,
  setMode,
  win,
}: {
  side: Side;
  team: Team;
  score: number;
  involved: Involved;
  mode: StatsMode;
  setMode: (m: StatsMode) => void;
  win: boolean;
}) {
  // Sintesi dei TITOLARI COINVOLTI ora (il lineup riflette i pinch-hit) + il
  // lanciatore sul monte quando la squadra difende (staff se sta battendo).
  const synth = teamSynthesis(team.lineup.map((b) => ({ b, pos: b.position })));
  const items: StatItem[] =
    involved.kind === 'batter'
      ? batterStatLine(mode, involved.batLine, involved.batter!)
      : pitcherStatLine(mode, involved.pitLine, involved.pitcher!);
  const player = involved.kind === 'batter' ? involved.batter! : involved.pitcher!;
  const lan =
    involved.kind === 'pitcher'
      ? pitcherOverall(involved.pitcher!.ratings)
      : staffSynthesis(team.rotation, team.bullpen);
  const strength: [string, number][] = [
    ['OVR', synth.ovr],
    ['ATT', synth.off],
    ['DIF', synth.def],
    ['LAN', lan],
  ];
  // Doti del giocatore del turno (battitore o lanciatore): stesse chip colorate,
  // così durante il match si valuta il DUELLO (non solo la forza di squadra).
  const playerRatings = subRatingChips(player);
  return (
    <div className={`team-stat ${side}${win ? ' win' : ''}`} style={{ ['--tc' as string]: team.primaryColor }}>
      <div className="ts-head">
        <TeamBadge team={team} size={30} />
        <div className="ts-id">
          <div className="ts-name">{team.name}</div>
          <div className="ts-strength">
            {strength.map(([k, v]) => (
              <span key={k} className="ts-str">
                <span className="ts-str-k">{k}</span>
                <span className="ts-str-v" style={{ background: strengthColor(v) }}>
                  {v}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="ts-score">{score}</div>
      </div>
      <div className="ts-player">
        <span className={`ts-role ${involved.kind}`}>
          {involved.kind === 'batter' ? 'ALLA BATTUTA' : 'SUL MONTE'}
        </span>
        <span className="ts-pname">
          <PlayerLink
            player={player}
            pos={involved.kind === 'batter' ? involved.batter!.position : undefined}
          >
            {player.name}
          </PlayerLink>
        </span>
        <StatsToggle mode={mode} setMode={setMode} />
      </div>
      <div className="ts-ratings" title="Doti del giocatore in azione">
        {playerRatings.map(([k, v]) => (
          <span key={k} className="ts-rat">
            <span className="ts-rat-k">{k}</span>
            <span className="ts-rat-v" style={{ background: ratingColor(v) }}>
              {v}
            </span>
          </span>
        ))}
      </div>
      <div className="ts-line">
        {items.map((it) => (
          <span key={it.k} className="ts-stat">
            <span className="ts-stat-k">{it.k}</span>
            <span className="ts-stat-v">{it.v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const STATS_MODES: StatsMode[] = ['game', 'season', 'last'];

/** Toggle compatto G/S/C (Game/Season/Career), condiviso ovunque. */
function StatsToggle({ mode, setMode }: { mode: StatsMode; setMode: (m: StatsMode) => void }) {
  return (
    <div className="stats-toggle" role="group" aria-label="Modalità statistiche">
      {STATS_MODES.map((m) => (
        <button
          key={m}
          className={`st-btn${mode === m ? ' active' : ''}`}
          disabled={m === 'last'}
          title={STATS_MODE_TITLE[m]}
          onClick={() => setMode(m)}
        >
          {STATS_MODE_SHORT[m]}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pannello di calibrazione: sposta/allarga/allunga i marker rispetto alla foto
// di sfondo (perno = casa base) e zooma/pan la foto. Live, con output JSON da
// incollare in src/data/stadiumCalibration.ts. Solo UI, non tocca il motore.
// ---------------------------------------------------------------------------

const CAL_FIELD_KEYS: NumericCalKey[] = [
  'homeX',
  'homeY',
  'spreadX',
  'depthY',
  'ofDist',
  'rotation',
  'fan',
];
const CAL_PHOTO_KEYS: NumericCalKey[] = ['bgZoom', 'bgX', 'bgY'];

function fmtCalNum(v: number, step: number): string {
  return step >= 1 ? String(Math.round(v)) : v.toFixed(2);
}

function calEntry(id: string, cal: FieldCalibration): string {
  const r0 = (n: number) => Math.round(n);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const img = cal.image ? `, image: '${cal.image}'` : '';
  return `  ${id}: { homeX: ${r0(cal.homeX)}, homeY: ${r0(cal.homeY)}, spreadX: ${r2(
    cal.spreadX,
  )}, depthY: ${r2(cal.depthY)}, ofDist: ${r2(cal.ofDist)}, rotation: ${r2(cal.rotation)}, fan: ${r2(
    cal.fan,
  )}, bgZoom: ${r2(cal.bgZoom)}, bgX: ${r0(cal.bgX)}, bgY: ${r0(cal.bgY)}${img} },`;
}

// ---------------------------------------------------------------------------
// Schermata dedicata "🎯 Stadi": calibra i marker di QUALSIASI stadio senza
// giocarci una partita. Rende la PLANCIA IDENTICA a un match (GameScreen su una
// partita "mock"), così la foto e i marker appaiono con la stessa cornice e le
// stesse proporzioni che si vedranno in gara — niente rischio di ricalibrare.
// Parte già in piazzamento manuale; il pannello ospita il selettore di stadio,
// lo spostamento in blocco e il "blocca alla foto". Persistenza = Esporta file.
// ---------------------------------------------------------------------------

/** Seme fisso della partita mock (nessun RNG interattivo: resta al 1° inning). */
const CAL_MOCK_SEED = 20260726;

/** Una foto-stadio selezionabile (principale o doppione), rilevata nel repo. */
interface PhotoOption {
  teamId: string;
  /** undefined = principale; altrimenti `stadiums/<ID><n>.jpg`. */
  image?: string;
  label: string;
  key: string;
}

function CalibrationScreen({
  league,
  teamId,
  setTeamId,
  onClose,
}: {
  league: Team[];
  teamId: string;
  setTeamId: (id: string) => void;
  onClose: () => void;
}) {
  // Elenca TUTTE le foto presenti nel repo — principale E doppioni (`<ID>2.jpg`,
  // `<ID>3.jpg`…) — provando a caricarle: così sono selezionabili e calibrabili
  // a sé, anche le varianti non ancora calibrate.
  const [options, setOptions] = useState<PhotoOption[]>([]);
  useEffect(() => {
    let alive = true;
    const jobs: Promise<PhotoOption | null>[] = [];
    for (const t of league) {
      stadiumImageCandidates(t.id).forEach((c, i) => {
        jobs.push(
          new Promise((res) => {
            const img = new Image();
            img.onload = () =>
              res({
                teamId: t.id,
                image: i === 0 ? undefined : c.path,
                label: `📷 ${t.abbrev} · ${c.label} — ${t.ballpark}`,
                key: `${t.id}|${i === 0 ? '' : c.path}`,
              });
            img.onerror = () => res(null);
            img.src = c.url;
          }),
        );
      });
    }
    Promise.all(jobs).then((r) => {
      if (alive) setOptions(r.filter((o): o is PhotoOption => o !== null));
    });
    return () => {
      alive = false;
    };
  }, [league]);

  const team = teamById(league, teamId) ?? league[0];
  const away = league.find((t) => t.id !== teamId) ?? league[0];

  // Partita mock (away @ team-scelto): dà la stessa plancia del match. Non la si
  // fa avanzare, quindi resta all'inizio (nessun corridore reale in base).
  const live = useMemo(
    () => createLiveGame(away, team, CAL_MOCK_SEED, 'home'),
    [away, team],
  );
  const result = useMemo(() => toGameResult(live), [live]);
  const sit = useMemo(() => situation(live), [live]);
  const [statsMode, setStatsMode] = useState<StatsMode>('season');

  // Foto selezionata (principale o doppione) e sua calibrazione. Parte GIÀ in
  // piazzamento manuale (marker seminati dalla proiezione se assenti).
  const [image, setImage] = useState<string | undefined>(undefined);
  const [cal, setCal] = useState<FieldCalibration>(() =>
    withManualMarkers(getCalibrationFor(teamId, undefined)),
  );
  // Selezionare una foto (dal dropdown o dai chip varianti) ne CARICA la
  // calibrazione salvata: ogni doppione si calibra e si esporta a sé.
  const selectPhoto = (tId: string, img?: string) => {
    setTeamId(tId);
    setImage(img);
    setCal(withManualMarkers(getCalibrationFor(tId, img)));
  };

  const editing = !!cal.markers;
  const moveMarker = (id: string, pos: { x: number; y: number }) => {
    setCal({ ...cal, markers: { ...(cal.markers ?? {}), [id]: pos } });
  };

  // Nomi campione per le etichette (basi + battitore): la partita mock è a
  // basi vuote, quindi passiamo dei nomi dai roster per renderle posizionabili.
  const sampleRunners = team.lineup.slice(0, 3).map((b) => b.name);
  const sampleBatter = away.lineup[0]?.name ?? sit.batter.name;

  const currentKey = `${teamId}|${image ?? ''}`;
  const opts: PhotoOption[] = options.length
    ? options
    : [{ teamId, image: undefined, label: `📷 ${team.abbrev} · Principale — ${team.ballpark}`, key: currentKey }];

  const picker = (
    <div className="cal-picker">
      <div className="cal-group">Stadio / foto (incl. doppioni)</div>
      <select
        className="cal-select"
        value={currentKey}
        onChange={(e) => {
          const o = opts.find((x) => x.key === e.target.value);
          if (o) selectPhoto(o.teamId, o.image);
        }}
      >
        {opts.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <GameScreen
        result={result}
        sit={sit}
        statsMode={statsMode}
        setStatsMode={setStatsMode}
        editing={editing}
        cal={cal}
        onMarkerMove={moveMarker}
        runners={sampleRunners}
        batterName={sampleBatter}
        controls={<ActionBar live={live} sit={sit} act={() => {}} />}
      />
      <CalibrationPanel
        team={team}
        hasPhoto={!!stadiumImage(teamId)}
        cal={cal}
        setCal={setCal}
        onClose={onClose}
        picker={picker}
        blockTools
        onPickImage={(img) => selectPhoto(teamId, img)}
      />
    </>
  );
}

/** Assicura che la calibrazione sia in piazzamento manuale: se non ha già i
 *  marker, li semina dalla proiezione corrente (così la schermata Stadi parte
 *  subito in modalità trascinamento). */
function withManualMarkers(cal: FieldCalibration): FieldCalibration {
  return cal.markers ? cal : { ...cal, markers: computeMarkers(cal) };
}

// --- Aggancio marker↔foto: la foto è resa in un box che scala/trasla con
// bgZoom/bgX/bgY (viewBox 900×420). Un marker a coord. viewBox corrisponde a un
// punto normalizzato del box; ricollocandolo con i nuovi parametri resta
// "incollato" alla foto (stessa scala e traslazione del box). ------------------
const CAL_VB = { w: 900, h: 420 };
function photoBox(zoom: number, x: number, y: number) {
  const iw = CAL_VB.w * zoom;
  const ih = CAL_VB.h * zoom;
  return { ix: (CAL_VB.w - iw) / 2 + x, iy: (CAL_VB.h - ih) / 2 + y, iw, ih };
}
/** Ricolloca i marker perché seguano la foto quando cambiano i parametri bg. */
function relockMarkers(
  markers: Record<string, { x: number; y: number }>,
  prev: FieldCalibration,
  next: { bgZoom: number; bgX: number; bgY: number },
): Record<string, { x: number; y: number }> {
  const a = photoBox(prev.bgZoom, prev.bgX, prev.bgY);
  const b = photoBox(next.bgZoom, next.bgX, next.bgY);
  const out: Record<string, { x: number; y: number }> = {};
  for (const id in markers) {
    const m = markers[id];
    const u = (m.x - a.ix) / a.iw;
    const v = (m.y - a.iy) / a.ih;
    out[id] = { x: Math.round(b.ix + u * b.iw), y: Math.round(b.iy + v * b.ih) };
  }
  return out;
}

function CalibrationPanel({
  team,
  hasPhoto,
  cal,
  setCal,
  onClose,
  picker,
  blockTools,
  onPickImage,
}: {
  team: Team;
  hasPhoto: boolean;
  cal: FieldCalibration;
  setCal: (c: FieldCalibration) => void;
  onClose: () => void;
  /** Nodo opzionale (selettore di stadio) mostrato in cima al pannello. */
  picker?: ReactNode;
  /** Mostra spostamento in blocco + "blocca alla foto" (schermata Stadi). */
  blockTools?: boolean;
  /** Se presente, scegliere una variante-foto delega qui (per ricaricarne la
   *  calibrazione salvata) invece di limitarsi a cambiare `cal.image`. */
  onPickImage?: (path: string | undefined) => void;
}) {
  const [copied, setCopied] = useState(false);
  // "Blocca marker alla foto": quando è attivo, ogni zoom/pan dello sfondo
  // ri-aggancia i marker alla foto (restano incollati proporzionalmente).
  const [locked, setLocked] = useState(true);

  // Rileva le varianti-foto presenti nel repo (principale + XXX2/XXX3/…):
  // prova a caricarle e tiene solo quelle che esistono.
  const [variants, setVariants] = useState<StadiumImageCandidate[]>([]);
  useEffect(() => {
    let alive = true;
    const cands = stadiumImageCandidates(team.id);
    if (cands.length === 0) {
      setVariants([]);
      return;
    }
    Promise.all(
      cands.map(
        (c) =>
          new Promise<boolean>((res) => {
            const img = new Image();
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = c.url;
          }),
      ),
    ).then((oks) => {
      if (alive) setVariants(cands.filter((_, i) => oks[i]));
    });
    return () => {
      alive = false;
    };
  }, [team.id]);

  const clampKey = (k: NumericCalKey, val: number) => {
    const rng = CALIBRATION_RANGE[k];
    const clamped = Math.max(rng.min, Math.min(rng.max, val));
    const dec = rng.step >= 1 ? 0 : 2;
    const p = Math.pow(10, dec);
    return Math.round(clamped * p) / p;
  };
  const set = (k: NumericCalKey, val: number) => {
    setCal({ ...cal, [k]: clampKey(k, val) });
    setCopied(false);
  };
  // Setter per i parametri della FOTO: se "blocca alla foto" è attivo e ci sono
  // marker manuali, li ri-aggancia così seguono zoom/pan (restano sulla foto).
  const setBg = (k: NumericCalKey, val: number) => {
    const next: FieldCalibration = { ...cal, [k]: clampKey(k, val) };
    if (locked && cal.markers) {
      next.markers = relockMarkers(cal.markers, cal, next);
    }
    setCal(next);
    setCopied(false);
  };
  // Sposta TUTTI i marker in blocco (le 4 direzioni), utile se cambia
  // l'inquadratura della foto: tiene le distanze relative.
  const nudgeAll = (dx: number, dy: number) => {
    if (!cal.markers) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const id in cal.markers) {
      next[id] = { x: cal.markers[id].x + dx, y: cal.markers[id].y + dy };
    }
    setCal({ ...cal, markers: next });
    setCopied(false);
  };

  const pickImage = (path: string | undefined) => {
    if (onPickImage) {
      onPickImage(path);
    } else {
      // Cambiare foto CARICA la calibrazione salvata di QUELLA foto (marker
      // inclusi): mai la foto di una variante con i marker di un'altra.
      setCal(getCalibrationFor(team.id, path));
    }
    setCopied(false);
  };

  const entry = calEntry(team.id, cal);
  const copy = () => {
    navigator.clipboard?.writeText(entry).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  // Piazzamento manuale: seed dei marker dalla proiezione corrente, poi trascino.
  const manual = !!cal.markers;
  const enterManual = () => setCal({ ...cal, markers: computeMarkers(cal) });
  const exitManual = () => {
    const next = { ...cal };
    delete next.markers;
    setCal(next);
  };

  // Esporta un file JSON nominato come la foto (<STEM>.json), da mettere in
  // src/data/calibrations/ e committare: si applica al deploy.
  const stem = calibrationStem(team.id, cal.image);
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(cal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stem}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const row = (k: NumericCalKey, setter: (k: NumericCalKey, v: number) => void = set) => {
    const rng = CALIBRATION_RANGE[k];
    const v = cal[k];
    // Passo dei pulsanti −/+: 5 px per i parametri in pixel (step 1).
    const nudge = rng.step * 5;
    return (
      <div className="cal-row" key={k}>
        <div className="cal-row-top">
          <span className="cal-label">{CALIBRATION_LABEL[k]}</span>
          <span className="cal-val">{fmtCalNum(v, rng.step)}</span>
        </div>
        <div className="cal-ctrl">
          <button className="cal-step" onClick={() => setter(k, v - nudge)} aria-label="diminuisci">
            −
          </button>
          <input
            type="range"
            min={rng.min}
            max={rng.max}
            step={rng.step}
            value={v}
            onChange={(e) => setter(k, parseFloat(e.target.value))}
          />
          <button className="cal-step" onClick={() => setter(k, v + nudge)} aria-label="aumenta">
            +
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="cal-panel">
      <div className="cal-head">
        <span className="cal-title">🎯 Calibra campo · {team.abbrev}</span>
        <button className="modal-close" onClick={onClose} aria-label="Chiudi">
          ✕
        </button>
      </div>
      {picker}
      {!hasPhoto && (
        <div className="cal-note">
          Nessuna foto per questo stadio: stai calibrando sul campo generato. Aggiungi
          <code> public/stadiums/{team.id}.jpg</code> per lo sfondo reale.
        </div>
      )}
      {variants.length >= 1 && (
        <>
          <div className="cal-group">Foto dello stadio ({variants.length})</div>
          <div className="cal-variants">
            {variants.map((c, i) => {
              const active = i === 0 ? !cal.image : cal.image === c.path;
              return (
                <button
                  key={c.path}
                  className={`cal-var${active ? ' active' : ''}`}
                  title={c.path}
                  onClick={() => pickImage(i === 0 ? undefined : c.path)}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {variants.length === 1 && (
            <div className="cal-hint">
              Una sola foto. Aggiungi <code>{team.id}2.jpg</code> in{' '}
              <code>public/stadiums/</code> per averne alternative.
            </div>
          )}
        </>
      )}
      {manual ? (
        <>
          <div className="cal-group">Piazzamento manuale</div>
          <div className="cal-note">
            Trascina i marker sulla foto: <b>9 difensori</b>, <b>3 basi</b>, casa base
            e <b>battitore</b>. Le <b>etichette-nome</b> (corridori sulle basi e
            battitore) si spostano <b>insieme</b> al marker.
          </div>
          {blockTools && (
            <>
              <div className="cal-group">Sposta tutti in blocco</div>
              <div className="cal-note">
                Muove <b>tutti</b> i marker insieme, tenendo le distanze — utile se
                cambi l'inquadratura della foto.
              </div>
              <div className="cal-pad">
                <button className="cal-padbtn up" onClick={() => nudgeAll(0, -4)} aria-label="su">
                  ▲
                </button>
                <button className="cal-padbtn left" onClick={() => nudgeAll(-4, 0)} aria-label="sinistra">
                  ◀
                </button>
                <button className="cal-padbtn right" onClick={() => nudgeAll(4, 0)} aria-label="destra">
                  ▶
                </button>
                <button className="cal-padbtn down" onClick={() => nudgeAll(0, 4)} aria-label="giù">
                  ▼
                </button>
              </div>
              <label className="cal-lock">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(e) => setLocked(e.target.checked)}
                />
                🔒 Blocca marker alla foto (seguono zoom/pan)
              </label>
            </>
          )}
          <button className="btn" onClick={exitManual}>
            ↩︎ Torna ai parametri
          </button>
        </>
      ) : (
        <>
          <div className="cal-group">Campo (perno = casa base)</div>
          {CAL_FIELD_KEYS.map((k) => row(k))}
          <button className="btn" onClick={enterManual} title="Sposta i marker a mano sulla foto">
            ✋ Piazza marker a mano
          </button>
        </>
      )}
      <div className="cal-group">Foto di sfondo</div>
      {CAL_PHOTO_KEYS.map((k) => row(k, setBg))}
      <div className="cal-actions">
        <button
          className="btn"
          onClick={() => {
            const base: FieldCalibration = { ...PHOTO_DEFAULT_CALIBRATION, image: cal.image };
            // In manuale mantieni la modalità (ri-semina i marker), altrimenti torna ai parametri.
            setCal(cal.markers ? { ...base, markers: computeMarkers(base) } : base);
          }}
          title="Riporta ai valori iniziali per le foto (mantiene la foto scelta)"
        >
          Azzera
        </button>
        <button className="btn primary" onClick={exportFile} title={`Scarica ${stem}.json`}>
          ⤓ Esporta file
        </button>
      </div>
      <div className="cal-hint">
        <b>Esporta file</b> → scarica <code>{stem}.json</code>. Mettilo in{' '}
        <code>src/data/calibrations/</code> e committa: si applica al deploy per la foto{' '}
        <code>{stem}.jpg</code>, su qualsiasi dispositivo. Nessuna modifica al codice.
      </div>
      <details className="cal-alt">
        <summary>oppure incolla la riga a mano</summary>
        <textarea className="cal-out" readOnly value={entry} onFocus={(e) => e.target.select()} />
        <button className="btn sm" onClick={copy}>
          {copied ? 'Copiato ✓' : 'Copia JSON'}
        </button>
        <div className="cal-hint">
          In <code>STADIUM_CALIBRATION</code> (<code>src/data/stadiumCalibration.ts</code>).
        </div>
      </details>
    </div>
  );
}

function ActionBar({
  live,
  sit,
  act,
}: {
  live: LiveGame;
  sit: LiveSituation;
  act: (fn: (g: LiveGame) => void) => void;
}) {
  // Modale di sostituzione (popup a tutto schermo): rimpiazza i vecchi menu a
  // discesa che restavano nascosti dietro la barra comandi.
  const [sub, setSub] = useState<SubMode | null>(null);
  const noBench = sit.bench.length === 0;
  const noRelievers = availableRelievers(defenseSide(live)).length === 0;
  const hasRunner = sit.bases.some(Boolean);

  const bar = sit.controlledBatting ? (
    <div className="card actionbar compact">
      <span className="turn-tag off">ATTACCO · {sit.battingTeam.abbrev}</span>
      <button className="btn primary sm" onClick={() => act((g) => playOffense(g, 'swing'))}>
        Battuta
      </button>
      <button
        className="btn sm"
        disabled={!sit.canBunt}
        onClick={() => act((g) => playOffense(g, 'bunt'))}
        title={sit.canBunt ? 'Bunt di sacrificio' : 'Bunt inutile con 2 out'}
      >
        Bunt
      </button>
      {sit.stealFrom.includes(1) && (
        <button
          className="btn sm"
          onClick={() => act((g) => attemptSteal(g, 1))}
          title="La rubata non consuma il turno: puoi tentarla e poi battere"
        >
          Ruba 2ª
        </button>
      )}
      {sit.stealFrom.includes(2) && (
        <button
          className="btn sm"
          onClick={() => act((g) => attemptSteal(g, 2))}
          title="La rubata non consuma il turno: puoi tentarla e poi battere"
        >
          Ruba 3ª
        </button>
      )}
      {sit.canHitAndRun && (
        <button
          className="btn sm"
          onClick={() => act((g) => hitAndRun(g))}
          title="Hit-and-run: il corridore parte, il battitore protegge"
        >
          Mob &amp; corri
        </button>
      )}
      <button
        className="btn sm"
        disabled={noBench}
        onClick={() => setSub('pinchhit')}
        title="Pinch-hit: sostituisci il battitore"
      >
        Pinch-hit
      </button>
      {hasRunner && (
        <button
          className="btn sm"
          disabled={noBench}
          onClick={() => setSub('pinchrun')}
          title="Pinch-runner: sostituisci un corridore in base"
        >
          Pinch-run
        </button>
      )}
    </div>
  ) : (
    <div className="card actionbar compact">
      <span className="turn-tag def">DIFESA · {sit.fieldingTeam.abbrev}</span>
      <button
        className="btn primary sm"
        onClick={() => act((g) => playOffense(g, 'swing'))}
        title="La CPU decide la battuta: premi «Lancia» per risolvere"
      >
        Lancia ▸
      </button>
      <button
        className="btn sm"
        onClick={() => act((g) => intentionalWalk(g))}
        title="Base intenzionale"
      >
        Base int.
      </button>
      {sit.bases[2] && sit.outs < 2 && (
        <button
          className={sit.infieldIn ? 'btn sm active' : 'btn sm'}
          onClick={() => act((g) => setInfieldIn(g, !g.infieldIn))}
          title="Interni dentro: taglia il punto da terra, ma concede più valide"
        >
          Interni dentro
        </button>
      )}
      <button
        className="btn sm"
        disabled={noRelievers}
        onClick={() => setSub('pitcher')}
        title="Cambio lanciatore: scegli un rilievo dal bullpen"
      >
        Cambio lanc.
      </button>
      <button
        className="btn sm"
        disabled={noBench}
        onClick={() => setSub('fielders')}
        title="Sostituzione difensiva: cambia un difensore"
      >
        Cambio dif.
      </button>
    </div>
  );

  return (
    <>
      {bar}
      {sub && <SubModal live={live} mode={sub} act={act} onClose={() => setSub(null)} />}
    </>
  );
}

// --- Sostituzioni: popup "ad hoc" in stile roster --------------------------
// Un unico modale mostra il pool giusto (rilievi / panchina) con OVR e
// caratteristiche, come una mini-scheda roster. Per i cambi difensivi e i
// pinch-runner c'è un primo passo (chi esce), poi la scelta di chi entra.
type SubMode = 'pitcher' | 'fielders' | 'pinchhit' | 'pinchrun';

const SUB_TITLE: Record<SubMode, string> = {
  pitcher: 'Cambio lanciatore',
  fielders: 'Sostituzione difensiva',
  pinchhit: 'Pinch-hit',
  pinchrun: 'Pinch-runner',
};

const BASE_LABEL = ['1ª', '2ª', '3ª'];

/** Caratteristiche fondamentali per la riga sostituto (come nel roster). */
function subRatingChips(p: Batter | Pitcher): Array<[string, number]> {
  if (isBatter(p)) {
    return [
      ['CON', p.ratings.contact],
      ['POT', p.ratings.power],
      ['OCC', p.ratings.eye],
      ['VEL', p.ratings.speed],
      ['DIF', p.ratings.fielding],
      ['BRA', p.ratings.arm],
    ];
  }
  const r = (p as Pitcher).ratings;
  return [
    ['DOM', r.stuff],
    ['CTR', r.control],
    ['MOV', r.movement],
    ['RES', r.stamina],
    ['DIF', r.fielding],
  ];
}

/** Etichette-colonna delle caratteristiche per il tipo (batter/pitcher). */
function subRatingKeys(p: Batter | Pitcher): string[] {
  return subRatingChips(p).map(([k]) => k);
}

/** Riga sostituto come nel Roster: OVR, nome+sottotitolo, colonne dote, «Scegli». */
function SubRow({
  player,
  subtitle,
  onPick,
}: {
  player: Batter | Pitcher;
  subtitle: string;
  onPick: () => void;
}) {
  const ovr = isBatter(player)
    ? batterOverall(player.ratings)
    : pitcherOverall((player as Pitcher).ratings);
  return (
    <tr className="subrow">
      <td className="subrow-ovr-c">
        <span className="subrow-ovr" style={{ background: ratingColor(ovr) }}>
          {ovr}
        </span>
      </td>
      <td className="l subrow-id">
        <PlayerLink player={player} className="subrow-name">
          {player.name}
        </PlayerLink>
        <span className="subrow-sub">{subtitle}</span>
      </td>
      {subRatingChips(player).map(([k, v]) => (
        <td key={k} className="subrow-stat">
          <span className="subrow-rat" style={{ background: ratingColor(v) }}>
            {v}
          </span>
        </td>
      ))}
      <td className="subrow-pick-c">
        <button className="btn sm primary subrow-pick" onClick={onPick}>
          Scegli ▸
        </button>
      </td>
    </tr>
  );
}

function SubModal({
  live,
  mode,
  act,
  onClose,
}: {
  live: LiveGame;
  mode: SubMode;
  act: (fn: (g: LiveGame) => void) => void;
  onClose: () => void;
}) {
  const [outId, setOutId] = useState<string | null>(null); // titolare che esce (fielders)
  const [outBase, setOutBase] = useState<number | null>(null); // corridore (pinchrun)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const off = offenseSide(live);
  const def = defenseSide(live);

  let hint = '';
  let targets: ReactNode = null; // primo passo (chi esce), quando serve
  let incoming: Array<{ id: string; player: Batter | Pitcher; subtitle: string; onPick: () => void }> = [];
  let emptyMsg = 'Nessun giocatore disponibile.';

  if (mode === 'pitcher') {
    hint = 'Scegli il rilievo da mandare sul monte.';
    emptyMsg = 'Nessun rilievo disponibile in bullpen.';
    incoming = availableRelievers(def).map((p) => ({
      id: p.id,
      player: p,
      subtitle: p.role === 'CL' ? 'RP (closer)' : p.role,
      onPick: () => {
        act((g) => changePitcher(g, defenseSide(g), p.id));
        onClose();
      },
    }));
  } else if (mode === 'pinchhit') {
    const cur = off.team.lineup[off.battingIndex];
    hint = `Sostituisci ${upperLast(cur.name)} in battuta.`;
    emptyMsg = 'Nessun giocatore in panchina.';
    incoming = off.team.bench.map((b) => ({
      id: b.id,
      player: b,
      subtitle: `panchina · ${b.position}`,
      onPick: () => {
        act((g) => pinchHit(g, b.id));
        onClose();
      },
    }));
  } else if (mode === 'fielders') {
    emptyMsg = 'Nessun giocatore in panchina.';
    if (outId == null) {
      hint = 'Chi esce dalla difesa?';
      targets = (
        <div className="sub-targets">
          {def.team.lineup.map((b) => (
            <button key={b.id} className="sub-target" onClick={() => setOutId(b.id)}>
              <span className="pos">{b.position}</span>
              <span className="nm">{upperLast(b.name)}</span>
              <span className="ov" style={{ color: ratingColor(batterOverall(b.ratings)) }}>
                {batterOverall(b.ratings)}
              </span>
            </button>
          ))}
        </div>
      );
    } else {
      const out = def.team.lineup.find((b) => b.id === outId)!;
      hint = `Chi entra per ${upperLast(out.name)} (${out.position})?`;
      incoming = def.team.bench.map((b) => ({
        id: b.id,
        player: b,
        subtitle: `entra in ${out.position}`,
        onPick: () => {
          act((g) => substituteFielder(g, defenseSide(g), outId, b.id));
          onClose();
        },
      }));
    }
  } else {
    // pinchrun
    emptyMsg = 'Nessun giocatore in panchina.';
    const occupied = [0, 1, 2].filter((i) => live.bases[i]);
    if (outBase == null) {
      hint = 'Quale corridore sostituire?';
      targets = (
        <div className="sub-targets">
          {occupied.map((i) => {
            const r = live.bases[i]!.batter;
            return (
              <button key={i} className="sub-target" onClick={() => setOutBase(i)}>
                <span className="pos">{BASE_LABEL[i]}</span>
                <span className="nm">{upperLast(r.name)}</span>
                <span className="ov" style={{ color: ratingColor(batterOverall(r.ratings)) }}>
                  {batterOverall(r.ratings)}
                </span>
              </button>
            );
          })}
        </div>
      );
    } else {
      const r = live.bases[outBase]!.batter;
      hint = `Chi corre per ${upperLast(r.name)} (${BASE_LABEL[outBase]})?`;
      incoming = off.team.bench.map((b) => ({
        id: b.id,
        player: b,
        subtitle: `panchina · VEL ${b.ratings.speed}`,
        onPick: () => {
          act((g) => pinchRun(g, offenseSide(g), outBase, b.id));
          onClose();
        },
      }));
    }
  }

  const statCols = incoming.length > 0 ? subRatingKeys(incoming[0].player) : [];

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal submodal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{SUB_TITLE[mode]}</div>
          <button className="modal-close" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="sub-hint">{hint}</div>
        {targets ?? (
          <div className="sub-list">
            {incoming.length === 0 ? (
              <div className="sub-empty">{emptyMsg}</div>
            ) : (
              <table className="ratings sub-tbl">
                <thead>
                  <tr>
                    <th title="Valore totale">OVR</th>
                    <th className="l">Giocatore</th>
                    {statCols.map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {incoming.map((it) => (
                    <SubRow key={it.id} player={it.player} subtitle={it.subtitle} onPick={it.onPick} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function BaseDiamond({ bases }: { bases: [boolean, boolean, boolean] }) {
  // 1B destra, 2B sopra, 3B sinistra.
  const fill = (on: boolean) => (on ? 'var(--win)' : 'transparent');
  return (
    <svg className="diamond" width="70" height="70" viewBox="0 0 100 100" aria-label="basi">
      <g stroke="var(--line)" strokeWidth="3">
        <rect x="60" y="42" width="16" height="16" transform="rotate(45 68 50)" fill={fill(bases[0])} />
        <rect x="42" y="24" width="16" height="16" transform="rotate(45 50 32)" fill={fill(bases[1])} />
        <rect x="24" y="42" width="16" height="16" transform="rotate(45 32 50)" fill={fill(bases[2])} />
      </g>
    </svg>
  );
}

function OutsDots({ outs }: { outs: number }) {
  return (
    <div className="outs" title={`${outs} out`}>
      <span className="outs-label">OUT</span>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`out-dot${i < outs ? ' on' : ''}`} />
      ))}
    </div>
  );
}

function FinalOverlay({
  result,
  controlled,
  newLabel,
  onNew,
  onRecap,
}: {
  result: GameResult;
  controlled: Side;
  newLabel: string;
  onNew: () => void;
  onRecap: () => void;
}) {
  const youWon = result.winner === controlled;
  const winTeam = result.winner === 'away' ? result.away : result.home;
  return (
    <div className={`final-overlay ${youWon ? 'won' : 'lost'}`}>
      <div className="final-title">{youWon ? '🏆 Hai vinto!' : 'Sconfitta'}</div>
      <div className="final-line">
        {winTeam.name} {result.final.away}–{result.final.home}
        {result.innings > 9 && <span className="final-extra"> · {result.innings} inning</span>}
      </div>
      <div className="final-btns">
        <button className="btn" onClick={onRecap}>
          Recap partita
        </button>
        <button className="btn primary big" onClick={onNew}>
          {newLabel}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componenti di visualizzazione (in gran parte ereditati dalla Fase 0)
// ---------------------------------------------------------------------------

function TeamBadge({ team, size = 46 }: { team: Team; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={team.name}>
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="22"
        fill={team.primaryColor}
        stroke={team.secondaryColor}
        strokeWidth="6"
      />
      <text
        x="50"
        y="54"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={team.abbrev.length > 2 ? 30 : 36}
        fontWeight={800}
        fill={team.secondaryColor}
        fontFamily="system-ui, sans-serif"
      >
        {team.abbrev}
      </text>
    </svg>
  );
}

function strengthColor(v: number): string {
  const t = Math.max(0, Math.min(1, (v - (RATING_AVG - 20)) / 45));
  return `hsl(${Math.round(t * 125)} 60% 46%)`;
}

/**
 * Stato d'affaticamento del lanciatore, ancorato alla vera meccanica del motore:
 * la soglia è la **Resistenza** (`pitcher.stamina`, in battitori affrontabili),
 * non i lanci stimati. Il malus ai peripherals scatta appena i battitori
 * affrontati superano la soglia (`fatigueFactor`); il cambio automatico avviene
 * a soglia + margine (SP +4, rilievo +2, come `autoManagePitcher`).
 *  - `fresh`  : ampio margine, nessun malus
 *  - `tiring` : entro 2 battitori dalla soglia o appena oltre → affaticamento in corso
 *  - `spent`  : oltre la soglia di cambio automatico
 */
function pitcherFatigue(
  role: string | undefined,
  stamina: number,
  bf: number,
): { state: 'fresh' | 'tiring' | 'spent'; tone?: string } {
  const margin = role === 'SP' ? 4 : 2;
  if (bf >= stamina + margin) return { state: 'spent', tone: '#ff6b6b' };
  if (bf >= stamina - 2) return { state: 'tiring', tone: '#ffcf5c' };
  return { state: 'fresh' };
}

function LineupSide({
  team,
  stats,
  side,
  sit,
  mode,
  setMode,
}: {
  team: Team;
  stats: TeamGameStats;
  side: Side;
  sit: LiveSituation;
  mode: StatsMode;
  setMode: (m: StatsMode) => void;
}) {
  const isBatting = sit.offenseSide === side && sit.status === 'live';
  const currentId = isBatting ? sit.batter.id : null;
  const batById = new Map(team.lineup.map((b) => [b.id, b]));
  const pitById = new Map([...team.rotation, ...team.bullpen].map((p) => [p.id, p]));
  const rows = stats.batting.map((l) => ({
    line: l,
    items: batterStatLine(mode, l, batById.get(l.id)),
  }));
  const head = rows[0]?.items.map((i) => i.k) ?? [];
  // Cognomi disambiguati per i battitori mostrati (es. R. Alomar / S. Alomar).
  const batLabels = disambiguateLastNames(rows.map((r) => r.line.name));
  // TUTTI i lanciatori usati da questa squadra (partente + rilievi entrati), non
  // solo quello in pedana: così il box tiene traccia dei 3/5/7 cambi.
  const lastPitIdx = stats.pitching.length - 1;
  const pitLabels = disambiguateLastNames(stats.pitching.map((p) => p.name));
  return (
    <div className="card lineup-side" style={{ borderTopColor: team.primaryColor }}>
      <div className="ls-head">
        <TeamBadge team={team} size={22} />
        <span className="ls-name">{team.name}</span>
        <StatsToggle mode={mode} setMode={setMode} />
      </div>
      <div className="ls-scroll">
        <table className="ls-table">
          <thead>
            <tr>
              <th className="l">#</th>
              <th className="l">Battitore</th>
              {head.map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.line.id} className={r.line.id === currentId ? 'at-bat' : undefined}>
                <td className="l num">{i + 1}</td>
                <td className="l bname">
                  <span className="pos">{r.line.position}</span>{' '}
                  {(() => {
                    const b = batById.get(r.line.id);
                    return b ? (
                      <PlayerLink player={b} pos={b.position}>{batLabels[i]}</PlayerLink>
                    ) : (
                      upperLast(batLabels[i])
                    );
                  })()}
                  {r.line.id === currentId && <span className="atbat-dot">●</span>}
                </td>
                {r.items.map((it) => (
                  <td key={it.k}>{it.v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stats.pitching.length > 0 && (
        <div className="ls-pits">
          {stats.pitching.map((pl, idx) => {
            const p = pitById.get(pl.id);
            const label = pitLabels[idx];
            const isCur = idx === lastPitIdx && sit.status === 'live';
            const pt = estimatedPitches(pl);
            const fat = p ? pitcherFatigue(p.role, p.stamina, pl.bf) : undefined;
            const stateWord =
              fat?.state === 'spent' ? 'esausto' : fat?.state === 'tiring' ? 'in calo' : 'fresco';
            return (
              <div className={`ls-pit${isCur ? ' cur' : ''}`} key={pl.id}>
                <span className="ls-pit-tag">{idx === 0 ? 'LANC.' : '↳'}</span>
                <span className="ls-pit-name">
                  {p ? <PlayerLink player={p}>{label}</PlayerLink> : upperLast(label)}
                </span>
                <span className="ls-pit-stat">{formatIp(pl.outs)} IP</span>
                <span
                  className="ls-pit-stat"
                  style={{ color: fat?.tone }}
                  title="Lanci (stima): cresce con battitori affrontati, valide, BB e SO — rende l'affaticamento"
                >
                  {pt} PT
                </span>
                {p && (
                  <span
                    className="ls-pit-stat"
                    style={{ color: fat?.tone }}
                    title={`Battitori affrontati / Resistenza (${stateWord}). La Resistenza è la soglia oltre la quale scatta l'affaticamento (peggiora BB/valide/HR, cala negli SO); superata di ${p.role === 'SP' ? 4 : 2} il lanciatore verrebbe cambiato d'ufficio.`}
                  >
                    {pl.bf}/{p.stamina} BF
                  </span>
                )}
                <span className="ls-pit-stat">{pl.so} SO</span>
                <span className="ls-pit-stat">{pl.er} ER</span>
                {pl.dec && <span className={`dec dec-${pl.dec}`}>{decLabel(pl.dec)}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LineScore({ result }: { result: GameResult }) {
  const cols = Math.max(
    9,
    result.awayStats.lineByInning.length,
    result.homeStats.lineByInning.length,
  );
  const innings = Array.from({ length: cols }, (_, i) => i + 1);
  return (
    <div className="card linescore-card">
      <table className="linescore">
        <thead>
          <tr>
            <th className="team-col"></th>
            {innings.map((i) => (
              <th key={i}>{i}</th>
            ))}
            <th className="tot">R</th>
            <th className="tot">H</th>
            <th className="tot">E</th>
          </tr>
        </thead>
        <tbody>
          <LineRow team={result.away} stats={result.awayStats} innings={innings} />
          <LineRow team={result.home} stats={result.homeStats} innings={innings} />
        </tbody>
      </table>
    </div>
  );
}

function LineRow({
  team,
  stats,
  innings,
}: {
  team: Team;
  stats: TeamGameStats;
  innings: number[];
}) {
  return (
    <tr>
      <td className="team-col">
        <span className="pill" style={{ background: team.primaryColor }}>
          {team.abbrev}
        </span>
      </td>
      {innings.map((i) => {
        const v = stats.lineByInning[i - 1];
        return <td key={i}>{v === undefined ? '·' : v}</td>;
      })}
      <td className="tot">{stats.runs}</td>
      <td className="tot">{stats.hits}</td>
      <td className="tot">{stats.errors}</td>
    </tr>
  );
}

function BoxScore({
  team,
  stats,
  mode,
}: {
  team: Team;
  stats: TeamGameStats;
  mode: StatsMode;
}) {
  const batById = new Map(team.lineup.map((b) => [b.id, b]));
  const pitById = new Map([...team.rotation, ...team.bullpen].map((p) => [p.id, p]));

  const batRows = stats.batting.map((l) => ({
    id: l.id,
    label: l.position,
    name: l.name,
    items: batterStatLine(mode, l, batById.get(l.id)),
  }));
  const pitRows = stats.pitching.map((l) => ({
    id: l.id,
    name: l.name,
    dec: l.dec,
    items: pitcherStatLine(mode, l, pitById.get(l.id)),
  }));
  const batHead = batRows[0]?.items.map((i) => i.k) ?? [];
  const pitHead = pitRows[0]?.items.map((i) => i.k) ?? [];

  return (
    <div className="card">
      <div className="card-title" style={{ borderColor: team.primaryColor }}>
        <TeamBadge team={team} size={26} /> {team.name}
      </div>
      <table className="box">
        <thead>
          <tr>
            <th className="l">Battitore</th>
            {batHead.map((k) => (
              <th key={k}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batRows.map((r) => (
            <tr key={r.id}>
              <td className="l">
                <span className="pos">{r.label}</span> {upperLast(r.name)}
              </td>
              {r.items.map((it) => (
                <td key={it.k}>{it.v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="box pit">
        <thead>
          <tr>
            <th className="l">Lanciatore</th>
            {pitHead.map((k) => (
              <th key={k}>{k}</th>
            ))}
            {mode === 'game' && <th>Dec</th>}
          </tr>
        </thead>
        <tbody>
          {pitRows.map((r) => (
            <tr key={r.id}>
              <td className="l">{upperLast(r.name)}</td>
              {r.items.map((it) => (
                <td key={it.k}>{it.v}</td>
              ))}
              {mode === 'game' && (
                <td>{r.dec ? <span className={`dec dec-${r.dec}`}>{decLabel(r.dec)}</span> : ''}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function decLabel(d: 'W' | 'L' | 'SV'): string {
  return d === 'W' ? 'V' : d === 'L' ? 'P' : 'SV';
}

interface CronacaGroup {
  key: string;
  header: string;
  events: PlayEvent[];
}

function groupPlays(result: GameResult): CronacaGroup[] {
  const groups: CronacaGroup[] = [];
  let cur: CronacaGroup | null = null;
  for (const ev of result.play) {
    const key = `${ev.inning}-${ev.half}`;
    if (!cur || cur.key !== key) {
      const batting = ev.half === 'top' ? result.away : result.home;
      const arrow = ev.half === 'top' ? '▲' : '▼';
      cur = { key, header: `${ev.inning}° ${arrow} ${batting.abbrev}`, events: [] };
      groups.push(cur);
    }
    cur.events.push(ev);
  }
  return groups;
}

/**
 * Banner di cronaca in alto-centro sopra la foto stadio: mostra la telecronaca
 * dell'ultima giocata in 2-3 fasi (attesa → sviluppo → verdetto), a tema coi
 * colori della squadra protagonista e con intensita' crescente per gli esiti
 * piu' straordinari (fuoricampo, doppio gioco…). A fine sequenza svanisce e la
 * frase sintetica resta nella cronaca laterale (dx/sx).
 */
function PlayBanner({ result, onReveal }: { result: GameResult; onReveal?: () => void }) {
  const plays = result.play;
  const len = plays.length;
  // Non ri-animare le giocate gia' presenti al montaggio (partita ripresa).
  const seenRef = useRef(len);
  const [state, setState] = useState<{ com: Commentary; phase: number; leaving: boolean } | null>(
    null,
  );
  // `onReveal` cambia identita' quando cambia la partita: lo leggo da una ref
  // cosi' i timer schedulati usano sempre l'ultima versione senza ri-eseguire
  // l'effetto (che dipende solo da `len`).
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;
  const reveal = () => revealRef.current?.();

  useEffect(() => {
    if (len <= seenRef.current) {
      seenRef.current = len;
      reveal(); // nessuna telecronaca da animare: marker allineati subito.
      return;
    }
    seenRef.current = len;
    const ev = plays[len - 1];
    // La sostituzione (pinch-hit) non e' una giocata: niente banner.
    if (ev.kind === 'sub') {
      setState(null);
      reveal();
      return;
    }
    const offenseIsAway = ev.half === 'top';
    const off = offenseIsAway ? result.away : result.home;
    const def = offenseIsAway ? result.home : result.away;
    const com = buildCommentary(ev, {
      offense: { abbrev: off.abbrev, name: off.name, color: off.primaryColor },
      defense: { abbrev: def.abbrev, name: def.name, color: def.primaryColor },
    });

    setState({ com, phase: 0, leaving: false });
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < com.phases.length; i++) {
      timers.push(setTimeout(() => setState((s) => (s ? { ...s, phase: i } : s)), i * PHASE_MS));
    }
    // Al VERDETTO (ultima fase, "conquista la base"/"eliminato") sposto i marker
    // sul diamante: e' il momento in cui l'esito viene letto in cronaca.
    const revealAt = (com.phases.length - 1) * PHASE_MS;
    timers.push(setTimeout(reveal, revealAt));
    const end = (com.phases.length - 1) * PHASE_MS + HOLD_MS;
    timers.push(setTimeout(() => setState((s) => (s ? { ...s, leaving: true } : s)), end));
    timers.push(setTimeout(() => setState(null), end + 420));
    return () => timers.forEach(clearTimeout);
  }, [len]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;
  const { com, phase, leaving } = state;
  const cur = com.phases[phase];

  return (
    <div
      className={`play-banner tier-${com.tier} accent-${com.accent}${leaving ? ' leaving' : ''}${
        cur.climax ? ' climax' : ''
      }`}
      style={{ ['--bc' as string]: com.color }}
      aria-live="polite"
    >
      <div className="pb-strip" />
      <div className="pb-inner">
        <div className="pb-head">
          {cur.climax ? (
            <div className="pb-verdict">
              <span className="pb-icon">{com.icon}</span>
              <span className="pb-label">{com.label}</span>
              {com.scored > 0 && <span className="pb-runs">+{com.scored}</span>}
            </div>
          ) : (
            <span className="pb-dots">
              {com.phases.map((_, i) => (
                <i key={i} className={i <= phase ? 'on' : ''} />
              ))}
            </span>
          )}
        </div>
        <div className={`pb-text${cur.climax ? ' big' : ''}`} key={phase}>
          {cur.text}
        </div>
      </div>
    </div>
  );
}

/** Cronaca di UNA squadra (ospite = mezzi alti; casa = mezzi bassi). Sempre
 *  visibile, scorre verso l'ultimo evento. */
function CronacaTeam({
  result,
  side,
  shownPlays,
}: {
  result: GameResult;
  side: Side;
  shownPlays?: number;
}) {
  const half = side === 'away' ? 'top' : 'bottom';
  // Le cronache laterali non anticipano l'esito scritto al centro: si fermano
  // alle giocate già "lette" (shownPlays). Se omesso, si mostra tutto.
  const shownLen = shownPlays ?? result.play.length;
  const shown = shownLen >= result.play.length ? result : { ...result, play: result.play.slice(0, shownLen) };
  const groups = groupPlays(shown).filter((g) => g.key.endsWith(half));
  const team = side === 'away' ? result.away : result.home;
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [shownLen]);

  return (
    <div className="cronaca-team" style={{ ['--tc' as string]: team.primaryColor }}>
      <div className="crt-head">
        <span className="pill" style={{ background: team.primaryColor }}>
          {team.abbrev}
        </span>
        <span className="crt-title">Cronaca {side === 'away' ? 'ospite' : 'casa'}</span>
      </div>
      {/* Testate ed eventi sono figli DIRETTI del contenitore scrollabile (non
          annidati in un box per-inning): così ogni testata `sticky` resta
          agganciata all'intero corpo e le testate si IMPILANO in cima invece di
          scorrere via una alla volta. */}
      <div className="crt-body" ref={bodyRef}>
        {groups.length === 0 && <div className="cr-empty">In attesa…</div>}
        {groups.map((g, gi) => (
          <Fragment key={g.key}>
            <div
              className="cr-inhead"
              // Impilamento: ogni testata si ferma un gradino più in basso della
              // precedente, così 1°/2°/3°… restano accumulati e fissi in cima.
              style={{ top: `calc(var(--crh) * ${gi})`, zIndex: groups.length - gi }}
            >
              <span>{g.header}</span>
              <span className="cr-score">
                {g.events[g.events.length - 1].away}–{g.events[g.events.length - 1].home}
              </span>
            </div>
            <ul>
              {g.events.map((ev, i) => {
                const sc = scoreCode(ev);
                return (
                  <li key={i} className={ev.runsScored > 0 ? 'scored' : ''}>
                    {sc && (
                      <span className="cr-code" title={sc.title}>
                        {sc.code}
                      </span>
                    )}
                    {logLine(ev)}
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function RecapModal({
  result,
  statsMode,
  setStatsMode,
  onClose,
}: {
  result: GameResult;
  statsMode: StatsMode;
  setStatsMode: (m: StatsMode) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal recap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            Recap · {result.away.abbrev} {result.final.away} – {result.final.home}{' '}
            {result.home.abbrev}
          </div>
          <StatsToggle mode={statsMode} setMode={setStatsMode} />
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <LineScore result={result} />
          <div className="grid2">
            <BoxScore team={result.away} stats={result.awayStats} mode={statsMode} />
            <BoxScore team={result.home} stats={result.homeStats} mode={statsMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Rating({ v }: { v: number }) {
  return (
    <td className="rat" style={{ background: ratingColor(v) }}>
      {v}
    </td>
  );
}

// Colonne del mini-popup: battuta e lancio (una riga "Stagione" reale + una
// "Carriera/Storico" derivata dai rating).
const PM_BAT_COLS: Array<[string, (l: BatLine) => string]> = [
  ['G', (l) => `${l.g}`],
  ['AVG', (l) => pct3(l.avg)],
  ['OBP', (l) => pct3(l.obp)],
  ['SLG', (l) => pct3(l.slg)],
  ['HR', (l) => `${l.hr}`],
  ['RBI', (l) => `${l.rbi}`],
  ['H', (l) => `${l.h}`],
  ['2B', (l) => `${l.d2}`],
  ['3B', (l) => `${l.t3}`],
  ['BB', (l) => `${l.bb}`],
  ['SO', (l) => `${l.so}`],
  ['SB', (l) => `${l.sb}`],
];
const PM_PIT_COLS: Array<[string, (l: PitLine) => string]> = [
  ['W', (l) => `${l.w}`],
  ['L', (l) => `${l.l}`],
  ['ERA', (l) => (l.ip ? l.era.toFixed(2) : '—')],
  ['G', (l) => `${l.g}`],
  ['GS', (l) => `${l.gs}`],
  ['IP', (l) => ipFmt(l.ipOuts)],
  ['H', (l) => `${l.h}`],
  ['BB', (l) => `${l.bb}`],
  ['K', (l) => `${l.k}`],
  ['SV', (l) => `${l.sv}`],
  ['WHIP', (l) => (l.ip ? l.whip.toFixed(2) : '—')],
  ['K/9', (l) => (l.ip ? l.k9.toFixed(1) : '—')],
];

/** Stipendio annuale (milioni) come "12.5 M$". */
function salaryFmt(m: number): string {
  return `${m.toFixed(1)} M$`;
}

/**
 * Mini-popup giocatore: intestazione (nome, età, ruolo/i, overall + stelle,
 * stipendio), RATING DEL MOMENTO colorati (per il fielder la DIF è calcolata
 * alla posizione occupata), e due righe STAT — "Stagione" REALE (season.bat/pit)
 * e "Carriera/Storico" derivata dai rating (backstory). Chiudibile con ✕,
 * click sul backdrop o Esc. Riusa le classi `.modal-*` esistenti.
 */
function PlayerModal({
  req,
  season,
  seed,
  onClose,
}: {
  req: PlayerModalRequest;
  season: SeasonState;
  seed: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { player, pos, tier } = req;
  const batter = isBatter(player) ? player : null;
  const pitcher = isBatter(player) ? null : (player as Pitcher);

  // Overall, ruolo/i e rating "del momento".
  let overall: number;
  let rolesLabel: string;
  let ratingChips: Array<[string, number]>;
  let statCols: Array<[string, (l: BatLine) => string]> | Array<[string, (l: PitLine) => string]>;
  let seasonLine: BatLine | PitLine;
  let careerLine: BatLine | PitLine;

  if (batter) {
    const activePos = pos ?? batter.position;
    const rp = ratingsAtPosition(batter, activePos);
    overall = batterOverall(batter.ratings);
    rolesLabel = rolesOf(batter);
    ratingChips = [
      ['CON', batter.ratings.contact],
      ['POT', batter.ratings.power],
      ['OCC', batter.ratings.eye],
      ['VEL', batter.ratings.speed],
      ['DIF', rp.fielding],
      ['BRA', batter.ratings.arm],
    ];
    statCols = PM_BAT_COLS;
    seasonLine = seasonBatLine(season.bat[batter.id]);
    careerLine = seasonBatLine(
      projectBatterSeason(batter, tier ?? 'starter', {
        seed,
        year: season.year - 1,
        day: SEASON_GAMES,
      }),
    );
  } else {
    const p = pitcher!;
    overall = pitcherOverall(p.ratings);
    rolesLabel = potentialRole(p.ratings) + (p.role === 'CL' ? ' · closer' : '');
    ratingChips = [
      ['DOM', p.ratings.stuff],
      ['CTR', p.ratings.control],
      ['MOV', p.ratings.movement],
      ['PAT', p.ratings.groundball],
      ['RES', p.ratings.stamina],
      ['DIF', p.ratings.fielding],
    ];
    statCols = PM_PIT_COLS;
    seasonLine = seasonPitLine(season.pit[p.id]);
    careerLine = seasonPitLine(
      projectPitcherSeason(p, { seed, year: season.year - 1, day: SEASON_GAMES }),
    );
  }

  const statRow = (line: BatLine | PitLine, label: string, cls?: string) => (
    <tr className={cls}>
      <td className="pm-row-lbl">{label}</td>
      {batter
        ? (statCols as Array<[string, (l: BatLine) => string]>).map(([k, f]) => (
            <td key={k}>{f(line as BatLine)}</td>
          ))
        : (statCols as Array<[string, (l: PitLine) => string]>).map(([k, f]) => (
            <td key={k}>{f(line as PitLine)}</td>
          ))}
    </tr>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal player" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{upperLast(player.name)}</div>
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body pm-body">
          <div className="pm-top">
            <div className="pm-ident">
              <span className="pm-role">{rolesLabel}</span>
              <span className="pm-meta">{player.age} anni · {salaryFmt(player.salary)}</span>
            </div>
            <div className="pm-ovr">
              <OvrBadge overall={overall} />
              <span className="pm-ovr-n" style={{ color: ratingColor(overall) }}>
                {overall}
              </span>
            </div>
          </div>

          <div className="pm-ratings">
            {ratingChips.map(([k, v]) => (
              <div className="pm-rt" key={k}>
                <span className="pm-rt-k">{k}</span>
                <span className="pm-rt-v" style={{ background: ratingColor(v) }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          <div className="pm-stats">
            <div className="roster-scroll">
              <table className="ratings pm-stat-tbl">
                <thead>
                  <tr>
                    <th className="l"></th>
                    {(statCols as Array<[string, unknown]>).map(([k]) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statRow(seasonLine, 'Stagione')}
                  {statRow(careerLine, 'Carriera', 'pm-career')}
                </tbody>
              </table>
            </div>
            <p className="muted pm-note">
              La riga <b>Stagione</b> è reale (partite giocate). La <b>Carriera/Storico</b> è
              una stima derivata dai rating (backstory): lo storico reale si comporrà col
              rollover di stagione (Fase 4).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Badge di sintesi squadra (OVR / Attacco / Difesa / staff Lanciatori). Riusato
 *  nel Roster (schieramento corrente) e in partita (titolari coinvolti). */
function SynthBadges({ synth, staff }: { synth: TeamSynth; staff: number }) {
  const item = (lbl: string, v: number, cls = '') => (
    <span className={`ts-item ${cls}`.trim()}>
      <b>{lbl}</b>
      <i style={{ color: ratingColor(v) }}>{v}</i>
    </span>
  );
  return (
    <>
      {item('OVR', synth.ovr, 'ovrbig')}
      {item('ATT', synth.off)}
      {item('DIF', synth.def)}
      {item('LAN', staff, 'pit')}
    </>
  );
}

/** Voto in stelle 1..5 dall'overall: piene evidenti, vuote smorzate. */
/**
 * Rating generale numerico in una card colorata in tono con la forza (testo
 * bianco grassetto), come le celle delle singole caratteristiche: stima precisa,
 * al posto delle stelle (troppo grossolane).
 */
function OvrBadge({ overall }: { overall: number }) {
  return (
    <span className="ovr-badge" style={{ background: ratingColor(overall) }} title={`${overall} OVR`}>
      {overall}
    </span>
  );
}

// Percentuale 0-100 di un rating sulla scala 40-100 (per le barre).
const ratingPct = (v: number) => clamp01((v - 40) / 60, 0, 1) * 100;

// Hash deterministico dell'id -> [0,1): rende la "nebbia di scouting" STABILE per
// giocatore (non sfarfalla tra un render e l'altro) ma diversa da uno all'altro.
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

type Outlook = { dir: 'up' | 'flat' | 'down'; lo: number; hi: number };

// Prospettiva di crescita "nebbiosa" mostrata in rosa AL POSTO del potenziale
// nudo: una FASCIA (non un numero-verdetto), direzionale per fase d'età, così non
// si legge il futuro esatto in anticipo.
//  - giovane con margine    -> ▲ verso l'alto (upside dal potenziale, offuscato)
//  - picco / nessun margine  -> numero secco (flat)
//  - veterano (> 30)         -> ▼ verso il basso (declino stimato dalla curva
//    d'età: fascia inferiore all'attuale)
// La fascia CONTIENE il valore vero (stima onesta), ma con ampiezza e posizione
// variabili per giocatore (seed sull'id): il tetto esatto resta nascosto.
function growthOutlook(id: string, overall: number, potential: number, age: number): Outlook {
  const seed = hash01(id);
  if (age > 30) {
    // Declino: fascia INFERIORE all'attuale, dal calo atteso (~ (età-30)/anno).
    const dec = Math.max(1, Math.min(9, Math.round((age - 30) * 0.7)));
    const hi = Math.max(40, overall - Math.round(seed));
    const lo = Math.max(40, Math.min(hi, overall - dec - Math.round(seed * 2)));
    return { dir: 'down', lo, hi };
  }
  const margin = potential - overall;
  if (margin <= 1) return { dir: 'flat', lo: overall, hi: overall };
  // Ampiezza della nebbia: cresce col margine e con la gioventù (un 20enne è più
  // imprevedibile). La fascia racchiude il potenziale vero, spostata dal seed.
  const spread = Math.max(1, Math.min(5, Math.round(margin * 0.4 + (age < 24 ? 2 : 1))));
  const lo = Math.max(overall, Math.min(potential, potential - 1 - Math.round(seed * spread)));
  const hi = Math.min(100, Math.max(potential, potential + 1 + Math.round((1 - seed) * spread)));
  return { dir: 'up', lo, hi };
}

// Barra OVR mini: il riempimento (colore del rating) è l'overall corrente; se c'è
// upside, il tratto fino al bordo ALTO della fascia (hi, non il potenziale esatto)
// resta visibile come segmento più chiaro = "spazio di crescita". Info di corredo.
function OvrBar({ id, overall, potential, age }: { id: string; overall: number; potential: number; age: number }) {
  const o = growthOutlook(id, overall, potential, age);
  const head = o.dir === 'up';
  return (
    <span className="ovr-bar" title={head ? `OVR ${overall} · crescita stimata ~${o.lo}-${o.hi}` : `OVR ${overall}`}>
      {head && <span className="ovr-bar-pot" style={{ width: `${ratingPct(o.hi)}%` }} />}
      <span className="ovr-bar-fill" style={{ width: `${ratingPct(overall)}%`, background: ratingColor(overall) }} />
    </span>
  );
}

// Colonna DEDICATA per la barra OVR (fissa, allineata verticalmente riga per
// riga: niente più barre "a scorrimento" dopo nomi di lunghezza diversa).
function OvrBarCell({ id, overall, potential, age }: { id: string; overall: number; potential: number; age: number }) {
  return (
    <td className="ovrbar-c">
      <OvrBar id={id} overall={overall} potential={potential} age={age} />
    </td>
  );
}

// Colonna DEDICATA per la prospettiva (40-100). Mostra una FASCIA "nebbiosa" (mai
// il tetto esatto): ▲lo-hi se c'è upside (giovane), ▼lo-hi se è probabile un
// declino (veterano), o il numero secco al picco. Formato diverso dal badge OVR
// per non confonderlo a colpo d'occhio: è una stima da scout, non un verdetto.
function PotCell({ id, overall, potential, age }: { id: string; overall: number; potential: number; age: number }) {
  const o = growthOutlook(id, overall, potential, age);
  if (o.dir === 'flat') {
    return (
      <td className="pot-c">
        <span className="pot-num" title="Al picco: nessun margine di crescita atteso">
          {overall}
        </span>
      </td>
    );
  }
  const arrow = o.dir === 'up' ? '▲' : '▼';
  const title =
    o.dir === 'up'
      ? `Crescita stimata ~${o.lo}-${o.hi} (stima da scout, non il tetto esatto)`
      : `Declino stimato ~${o.lo}-${o.hi} col progredire dell'età (stima da scout)`;
  return (
    <td className="pot-c">
      <span className={`pot-num ${o.dir}`} title={title}>
        {arrow}
        {o.lo}-{o.hi}
      </span>
    </td>
  );
}

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

const clamp01 = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const round = (x: number) => Math.round(x);

/** Media/percentuale come .312 (senza zero iniziale). */
function pct3(x: number): string {
  return x.toFixed(3).replace(/^0/, '');
}

/** Ruolo/i naturali del battitore (principale + eventuale secondario). */
function rolesOf(b: Batter): string {
  return b.secondaryPosition ? `${b.position}/${b.secondaryPosition}` : b.position;
}

interface BatLine {
  g: number; avg: number; obp: number; slg: number;
  h: number; d2: number; t3: number; hr: number; rbi: number; bb: number; so: number; sb: number;
}

interface PitLine {
  w: number; l: number; g: number; gs: number; ip: number; ipOuts: number; era: number;
  h: number; bb: number; k: number; svo: number; sv: number; whip: number; k9: number;
}

/** IP in notazione baseball: interi + terzi (es. 200.1). */
function ipFmt(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

/** Linea di battuta REALE dalle statistiche accumulate della stagione. */
function seasonBatLine(a?: SeasonBat): BatLine {
  const g = a?.g ?? 0, ab = a?.ab ?? 0, h = a?.h ?? 0, bb = a?.bb ?? 0;
  const d2 = a?.double ?? 0, t3 = a?.triple ?? 0, hr = a?.hr ?? 0;
  const singles = h - d2 - t3 - hr;
  const tb = singles + 2 * d2 + 3 * t3 + 4 * hr;
  return {
    g,
    avg: ab ? h / ab : 0,
    obp: ab + bb ? (h + bb) / (ab + bb) : 0,
    slg: ab ? tb / ab : 0,
    h, d2, t3, hr, rbi: a?.rbi ?? 0, bb, so: a?.so ?? 0, sb: a?.sb ?? 0,
  };
}

/** Linea di lancio REALE dalle statistiche accumulate della stagione. */
function seasonPitLine(a?: SeasonPit): PitLine {
  const outs = a?.outs ?? 0;
  const ip = outs / 3;
  const h = a?.h ?? 0, bb = a?.bb ?? 0, k = a?.so ?? 0, er = a?.er ?? 0;
  return {
    w: a?.w ?? 0, l: a?.l ?? 0, g: a?.g ?? 0, gs: a?.gs ?? 0, ip, ipOuts: outs,
    era: ip ? (er / ip) * 9 : 0,
    h, bb, k, svo: a?.svo ?? 0, sv: a?.sv ?? 0,
    whip: ip ? (h + bb) / ip : 0, k9: ip ? (k / ip) * 9 : 0,
  };
}

// Modello difensivo (stima): chances per gara per ruolo, quota di assist,
// tasso base di errore. Gli eventi difensivi non sono ancora simulati dal
// motore, quindi queste colonne sono STIME da ruolo + rating di difesa.
const DEF_MODEL: Record<string, { ch: number; aShare: number; err: number }> = {
  C: { ch: 7.5, aShare: 0.12, err: 0.006 },
  '1B': { ch: 9.2, aShare: 0.08, err: 0.006 },
  '2B': { ch: 4.6, aShare: 0.55, err: 0.02 },
  SS: { ch: 4.4, aShare: 0.62, err: 0.025 },
  '3B': { ch: 2.8, aShare: 0.65, err: 0.03 },
  LF: { ch: 2.0, aShare: 0.05, err: 0.01 },
  CF: { ch: 2.7, aShare: 0.05, err: 0.008 },
  RF: { ch: 2.1, aShare: 0.06, err: 0.01 },
  DH: { ch: 0, aShare: 0, err: 0 },
};

interface DefLine {
  e: number;
  a: number;
  po: number;
  fp: number;
}

/** Stima difensiva (E/A/PO/FLD%) da ruolo, partite e rating di difesa. */
function defLine(pos: Position, g: number, fielding: number): DefLine {
  const m = DEF_MODEL[pos] ?? DEF_MODEL.LF;
  const chances = m.ch * g;
  const a = round(chances * m.aShare);
  const po = round(chances - a);
  const e = round(chances * m.err * clamp01(1 - (fielding - RATING_AVG) / 60, 0.4, 1.7));
  const tc = po + a + e;
  return { e, a, po, fp: tc ? (po + a) / tc : 0 };
}

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
type GlossItem = { k: string; name: string; desc: string };
type GlossBlock = { title: string; kind: 'rating' | 'stat'; items: GlossItem[] };
const GLOSSARY: Record<'bat' | 'def' | 'pit', GlossBlock[]> = {
  bat: [
    {
      title: 'Doti offensive (scala 40-100, 70 = media di lega)',
      kind: 'rating',
      items: [
        { k: 'CON', name: 'Contatto', desc: 'battute valide e media: più singoli, meno strikeout (la parte "AVG").' },
        { k: 'POT', name: 'Potenza', desc: 'extrabase e fuoricampo (la parte "SLG").' },
        { k: 'OCC', name: 'Occhio', desc: 'basi ball: alza l\'OBP e limita un po\' gli strikeout.' },
        { k: 'VEL', name: 'Velocità', desc: 'rubate, tripli e basi extra in corsa.' },
      ],
    },
    {
      title: 'Statistiche offensive',
      kind: 'stat',
      items: [
        { k: 'G', name: 'Gare', desc: 'partite giocate.' },
        { k: 'AVG', name: 'Media battuta', desc: 'valide / turni ufficiali.' },
        { k: 'OBP', name: 'On-base %', desc: 'quante volte raggiunge la base (valide + BB su arrivi al piatto).' },
        { k: 'SLG', name: 'Slugging %', desc: 'basi totali per turno: pesa gli extrabase.' },
        { k: 'H', name: 'Valide', desc: 'battute valide totali.' },
        { k: '2B', name: 'Doppi', desc: 'battute da due basi.' },
        { k: '3B', name: 'Tripli', desc: 'battute da tre basi.' },
        { k: 'HR', name: 'Fuoricampo', desc: 'home run.' },
        { k: 'RBI', name: 'Punti battuti a casa', desc: 'corridori mandati a punto.' },
        { k: 'BB', name: 'Basi ball', desc: 'basi su ball (walk).' },
        { k: 'SO', name: 'Strikeout', desc: 'eliminazioni al piatto (K).' },
        { k: 'SB', name: 'Basi rubate', desc: 'rubate riuscite.' },
      ],
    },
  ],
  def: [
    {
      title: 'Doti difensive (scala 40-100 · variano con la casella giocata)',
      kind: 'rating',
      items: [
        { k: 'DIF', name: 'Difesa', desc: 'palle in gioco trasformate in out e meno errori; dipende dalla casella coperta.' },
        { k: 'BRA', name: 'Braccio', desc: 'elimina i ladri di base (ricevitore) e gli assist dagli esterni.' },
        { k: 'VEL', name: 'Velocità', desc: 'copertura di campo e corsa verso la palla.' },
      ],
    },
    {
      title: 'Statistiche difensive (stima: la difesa non è ancora simulata dal motore)',
      kind: 'stat',
      items: [
        { k: 'G', name: 'Gare', desc: 'partite giocate.' },
        { k: 'E', name: 'Errori', desc: 'giocate difensive sbagliate.' },
        { k: 'A', name: 'Assist', desc: 'tocchi che portano a un\'eliminazione altrui.' },
        { k: 'PO', name: 'Put-out', desc: 'eliminazioni dirette (presa al volo, out in base).' },
        { k: 'FLD%', name: 'Fielding %', desc: 'giocate pulite su totali (PO+A su PO+A+E).' },
      ],
    },
  ],
  pit: [
    {
      title: 'Doti del lanciatore (scala 40-100, 70 = media di lega)',
      kind: 'rating',
      items: [
        { k: 'DOM', name: 'Dominio (stuff)', desc: 'strikeout: più K, meno palle in gioco.' },
        { k: 'CTR', name: 'Controllo', desc: 'pochi base ball concessi.' },
        { k: 'MOV', name: 'Movimento', desc: 'poche battute valide concesse sulle palle in gioco.' },
        { k: 'PAT', name: 'Palle a terra', desc: 'induce battute rasoterra: pochi fuoricampo concessi e più doppi giochi.' },
        { k: 'RES', name: 'Resistenza', desc: 'quanti battitori regge prima di calare (durata sul monte).' },
        { k: 'DIF', name: 'Difesa', desc: 'tiene i corridori (hold) e difende sui bunt.' },
      ],
    },
    {
      title: 'Statistiche di lancio',
      kind: 'stat',
      items: [
        { k: 'W', name: 'Vittorie', desc: 'vittorie accreditate.' },
        { k: 'L', name: 'Sconfitte', desc: 'sconfitte accreditate.' },
        { k: 'G', name: 'Presenze', desc: 'partite in cui ha lanciato.' },
        { k: 'GS', name: 'Partenze', desc: 'partite iniziate da starter (games started).' },
        { k: 'IP', name: 'Inning lanciati', desc: 'riprese completate (.1/.2 = 1/3, 2/3).' },
        { k: 'ERA', name: 'Media PGL', desc: 'punti guadagnati subiti ogni 9 inning: risultato di contesto, non dote diretta.' },
        { k: 'H', name: 'Valide concesse', desc: 'battute valide subite.' },
        { k: 'BB', name: 'Basi ball concesse', desc: 'basi su ball regalate.' },
        { k: 'K', name: 'Strikeout', desc: 'battitori eliminati al piatto.' },
        { k: 'SVO', name: 'Opportunità salvezza', desc: 'occasioni di save affrontate.' },
        { k: 'SV', name: 'Salvezze', desc: 'save convertiti.' },
        { k: 'WHIP', name: 'WHIP', desc: '(basi ball + valide) per inning: baserunner concessi.' },
        { k: 'K/9', name: 'K per 9 inning', desc: 'strikeout ogni 9 riprese.' },
      ],
    },
  ],
};

/** Modale-legenda: spiega le sigle di una sezione (attacco / difesa / lancio). */
function StatLegend({ section, onClose }: { section: 'bat' | 'def' | 'pit'; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const title = section === 'bat' ? 'Legenda — Attacco' : section === 'def' ? 'Legenda — Difesa' : 'Legenda — Lancio';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal legend" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body legend-body">
          {GLOSSARY[section].map((block) => (
            <div className="legend-block" key={block.title}>
              <div className="legend-block-title">{block.title}</div>
              <dl className="legend-dl">
                {block.items.map((it) => (
                  <div className="legend-row" key={it.k}>
                    <dt className={`legend-abbr ${block.kind}`}>{it.k}</dt>
                    <dd className="legend-def">
                      <b>{it.name}</b> — {it.desc}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <p className="muted pm-note">
            Le <b>doti</b> (40-100) sono la fonte di verità e guidano ciò che il giocatore
            controlla; le <b>statistiche</b> sono un risultato simulato. ERA e Vittorie dipendono
            anche dal contesto (difesa, stadio, supporto), non solo dal talento.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Iconcina "i" cliccabile da mettere a fianco della testata di una tabella. */
function InfoDot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="info-dot"
      onClick={onClick}
      aria-label="Cosa significano le sigle"
      title="Cosa significano le sigle"
    >
      i
    </button>
  );
}

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
  const restById = new Map(
    restInfo(season.rotation, pitchers.map((p) => p.id), season.day).map((r) => [r.id, r]),
  );
  const suggestedSp = suggestedStarter(season.rotation, arr.rotation, season.day);
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
                  {starterChosen ? '(scelto)' : '(consigliato)'} · giornata {season.day} · scegli
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
  onPlay,
  onOverview,
  onNewLeague,
}: {
  league: Team[];
  managedTeam: Team;
  schedule: Schedule;
  season: SeasonState;
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
  onNewHistorical: () => void;
}) {
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
          <button className="start-card" onClick={onNewHistorical}>
            <div className="sc-icon">📜</div>
            <div className="sc-title">
              Stagione storica <span className="badge-soon">anteprima</span>
            </div>
            <div className="sc-desc">
              Seed d'archivio da un'annata reale (rose sbilanciate, cap morbido). Dataset ancora
              limitato: pipeline completa in arrivo.
            </div>
          </button>
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
}: {
  team: Team;
  mode: LeagueMode;
  onClose: () => void;
  onPick: () => void;
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
          <button className="btn primary" onClick={onPick}>
            Gestisci questa squadra ▸
          </button>
        </div>
      </div>
    </div>
  );
}

/** Panoramica lega: 30 squadre per division con forza e cap; scelta squadra. */
function LeagueOverview({
  league,
  seed,
  mode,
  onPick,
  onBack,
  embedded = false,
}: {
  league: Team[];
  seed: number;
  mode: LeagueMode;
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
