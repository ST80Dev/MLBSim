import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
  autoManageDefense,
  quickSim,
  hitAndRun,
  pinchHit,
  setInfieldIn,
} from '../engine/game';
import { batterOverall, pitcherOverall, deriveBatterStats, derivePitcherStats } from '../engine/ratings';
import { disambiguateLastNames } from '../engine/names';
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
import { teamStrength } from '../engine/strength';
import { formatIp } from '../engine/boxscore';
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
  advanceWithResult,
  recordOf,
  winPct,
  gamesBehind,
  sortByRecord,
  addBat,
  addPit,
} from '../data/season';
import type { SeasonState, SeasonBat, SeasonPit } from '../data/season';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import { stadiumImage, stadiumImageCandidates, assetUrl } from '../data/stadiumImages';
import type { StadiumImageCandidate } from '../data/stadiumImages';
import {
  getCalibration,
  getCalibrationFor,
  calibratedVariants,
  calibrationStem,
  PHOTO_DEFAULT_CALIBRATION,
  CALIBRATION_RANGE,
  CALIBRATION_LABEL,
} from '../data/stadiumCalibration';
import type { FieldCalibration, NumericCalKey } from '../data/stadiumCalibration';
import { gameSeed, newRandomSeed, ratingColor, stars } from './format';
import { Diamond, computeMarkers } from './Diamond';
import {
  batterStatLine,
  pitcherStatLine,
  STATS_MODE_SHORT,
  STATS_MODE_TITLE,
} from './statlines';
import type { StatItem, StatsMode } from './statlines';
import { buildCommentary, PHASE_MS, HOLD_MS } from './commentary';
import type { Commentary } from './commentary';

type View = 'home' | 'roster' | 'leaderboard' | 'standings' | 'franchise' | 'calibrate' | 'game';

/** Slot di salvataggio unico della Fase 2 (single-player, una carriera). */
const SAVE_SLOT = 'principale';

/**
 * Applica un foglio partita alla squadra gestita ricostruendo lineup, difesa,
 * rotazione e bullpen (vedi `buildManagedTeam`). Senza assetto ritorna la
 * squadra invariata. E' il punto in cui l'editor "entra" nella simulazione.
 */
function applyArrangement(team: Team, arr?: MatchArrangement): Team {
  return arr ? buildManagedTeam(team, arr) : team;
}
type Side = 'away' | 'home';

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
  const teams = useMemo(() => {
    const applied = applyArrangement(managedTeam, arrangement);
    return controlled === 'home'
      ? { away: opponent, home: applied }
      : { away: applied, home: opponent };
  }, [managedTeam, opponent, controlled, arrangement]);

  // Idrata squadra gestita e assetti salvati (una volta).
  useEffect(() => {
    let alive = true;
    saveStore
      .load(SAVE_SLOT)
      .then((rec) => {
        if (!alive || !rec) return;
        if (rec.payload.managedTeamId) setManagedId(rec.payload.managedTeamId);
        if (rec.payload.lineups) setArrangements(rec.payload.lineups);
        if (rec.payload.season) setSeason(rec.payload.season);
      })
      .catch(() => {
        /* offline o slot assente: si parte dai default. */
      });
    return () => {
      alive = false;
    };
  }, []);

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
  // Calibrazione dal repository (STADIUM_CALIBRATION, committato) o default.
  const [cal, setCal] = useState<FieldCalibration>(() => getCalibration(homeId));
  // Ad ogni gara, lo sfondo dello stadio di casa varia (in modo deterministico
  // per-partita) tra le foto CALIBRATE disponibili: principale + eventuali
  // doppioni `<ID>2.jpg`… così i marker restano allineati. Se ce n'è una sola,
  // resta quella; se nessuna è calibrata, si usa la calibrazione di default.
  useEffect(() => {
    const variants = calibratedVariants(homeId);
    if (variants.length === 0) {
      setCal(getCalibration(homeId));
      return;
    }
    const pick = variants[Math.abs(gameSeed(leagueSeed, gnum)) % variants.length];
    setCal(getCalibrationFor(homeId, pick.image));
  }, [homeId, gnum, leagueSeed]);
  const result = toGameResult(live);
  const sit = situation(live);
  const final = live.status === 'final';
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
    saveStore
      .save(SAVE_SLOT, { managedTeamId: myId, lineups: arrs, season: seas })
      .catch(() => {
        /* offline: si continua, si risalvera' piu' tardi. */
      });
  };

  const newLeague = () => {
    setLeagueSeed(newRandomSeed());
    setManagedId('');
    setActiveGame(null);
    setSeason(createSeason());
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
    await saveStore.save(SAVE_SLOT, { managedTeamId: myId, lineups: next, season });
  };

  return (
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
          statsMode={statsMode}
          setStatsMode={setStatsMode}
          editing={editing}
          cal={cal}
          onMarkerMove={moveMarker}
          runners={sit.baseRunners}
          batterName={sit.batter.name}
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
          onManagedChange={(id) => {
            setManagedId(id);
            setActiveGame(null);
          }}
          onNewLeague={newLeague}
        />
      )}

      {view === 'roster' && (
        <RosterPage
          key={myId}
          team={managedTeam}
          initial={arrangement}
          activeGame={!!activeGame}
          season={season}
          onApply={applyManaged}
          onSave={saveManaged}
          onStart={() => setView('game')}
        />
      )}

      {view === 'leaderboard' && (
        <LeaderboardPage league={league} season={season} seed={leagueSeed} managedId={myId} />
      )}
      {view === 'standings' && <StandingsPage league={league} season={season} managedId={myId} />}
      {view === 'franchise' && <FranchisePage team={managedTeam} />}
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
    </div>
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
  statsMode,
  setStatsMode,
  editing,
  cal,
  onMarkerMove,
  runners,
  batterName,
  controls,
}: {
  result: GameResult;
  sit: LiveSituation;
  statsMode: StatsMode;
  setStatsMode: (m: StatsMode) => void;
  editing: boolean;
  cal: FieldCalibration;
  onMarkerMove: (id: string, pos: { x: number; y: number }) => void;
  runners?: (string | null)[];
  batterName?: string | null;
  controls: ReactNode;
}) {
  return (
    <div className="game-screen">
      <StatBar result={result} sit={sit} statsMode={statsMode} setStatsMode={setStatsMode} />

      <div className={editing ? 'gamefield editing' : 'gamefield'}>
        <Diamond
          home={result.home}
          away={result.away}
          background
          bases={sit.bases}
          runners={runners}
          batterName={batterName}
          cal={cal}
          editable={editing}
          onMarkerMove={onMarkerMove}
        />

        {!editing && <PlayBanner result={result} />}

        <div className="cronaca-corner left">
          <CronacaTeam result={result} side="away" />
        </div>
        <div className="cronaca-corner right">
          <CronacaTeam result={result} side="home" />
        </div>

        <div className="lineup-corner left">
          <LineupSide
            side="away"
            team={result.away}
            stats={result.awayStats}
            sit={sit}
            mode={statsMode}
            setMode={setStatsMode}
          />
        </div>
        <div className="lineup-corner right">
          <LineupSide
            side="home"
            team={result.home}
            stats={result.homeStats}
            sit={sit}
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
  statsMode,
  setStatsMode,
}: {
  result: GameResult;
  sit: LiveSituation;
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
          <BaseDiamond bases={sit.bases} />
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
  const s = teamStrength(team);
  const items: StatItem[] =
    involved.kind === 'batter'
      ? batterStatLine(mode, involved.batLine, involved.batter!)
      : pitcherStatLine(mode, involved.pitLine, involved.pitcher!);
  const player = involved.kind === 'batter' ? involved.batter! : involved.pitcher!;
  const strength: [string, number][] = [
    ['TOT', s.total],
    ['ATT', s.attack],
    ['DIF', s.defense],
    ['LAN', s.pitching],
  ];
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
        <span className="ts-pname">{player.name}</span>
        <StatsToggle mode={mode} setMode={setMode} />
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
      setCal({ ...cal, image: path });
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
  return sit.controlledBatting ? (
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
      <PinchHitMenu bench={sit.bench} act={act} />
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
      <PitcherChange live={live} act={act} />
    </div>
  );
}

function PinchHitMenu({
  bench,
  act,
}: {
  bench: Batter[];
  act: (fn: (g: LiveGame) => void) => void;
}) {
  const [open, setOpen] = useState(false);
  if (bench.length === 0) return null;
  return (
    <div className="pchange">
      <button className="btn sm" onClick={() => setOpen((o) => !o)} title="Sostituisci il battitore">
        Pinch-hit ▾
      </button>
      {open && (
        <div className="pchange-menu">
          {bench.map((b) => (
            <button
              key={b.id}
              className="pchange-item"
              onClick={() => {
                act((g) => pinchHit(g, b.id));
                setOpen(false);
              }}
            >
              <span className="pos">{b.position}</span> {b.name}
              <span className="pchange-ovr">{stars(batterOverall(b.ratings))}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PitcherChange({
  live,
  act,
}: {
  live: LiveGame;
  act: (fn: (g: LiveGame) => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const def = defenseSide(live);
  const relievers = def.pitchers.slice(def.pitcherIdx + 1);
  if (relievers.length === 0) return null;
  return (
    <div className="pchange">
      <button className="btn sm" onClick={() => setOpen((o) => !o)}>
        Cambio lanc. ▾
      </button>
      {open && (
        <div className="pchange-menu">
          {relievers.map((p) => (
            <button
              key={p.id}
              className="pchange-item"
              onClick={() => {
                act((g) => changePitcher(g, defenseSide(g), p.id));
                setOpen(false);
              }}
            >
              <span className="pos">{p.role}</span> {p.name}
              <span className="pchange-ovr">{stars(pitcherOverall(p.ratings))}</span>
            </button>
          ))}
        </div>
      )}
    </div>
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
  const t = Math.max(0, Math.min(1, (v - 30) / 45));
  return `hsl(${Math.round(t * 125)} 60% 46%)`;
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
  const rows = stats.batting.map((l) => ({
    line: l,
    items: batterStatLine(mode, l, batById.get(l.id)),
  }));
  const head = rows[0]?.items.map((i) => i.k) ?? [];
  // Cognomi disambiguati per i battitori mostrati (es. R. Alomar / S. Alomar).
  const batLabels = disambiguateLastNames(rows.map((r) => r.line.name));
  // Lanciatore attualmente in pedana per questa squadra (ultima riga usata).
  const curP = stats.pitching[stats.pitching.length - 1];
  const pitLabels = disambiguateLastNames(stats.pitching.map((p) => p.name));
  return (
    <div className="card lineup-side" style={{ borderTopColor: team.primaryColor }}>
      <div className="ls-head">
        <TeamBadge team={team} size={22} />
        <span className="ls-name">{team.name}</span>
        <StatsToggle mode={mode} setMode={setMode} />
      </div>
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
                <span className="pos">{r.line.position}</span> {batLabels[i]}
                {r.line.id === currentId && <span className="atbat-dot">●</span>}
              </td>
              {r.items.map((it) => (
                <td key={it.k}>{it.v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {curP && (
        <div className="ls-pit">
          <span className="ls-pit-tag">LANC.</span>
          <span className="ls-pit-name">{pitLabels[pitLabels.length - 1]}</span>
          <span className="ls-pit-stat">{formatIp(curP.outs)} IP</span>
          <span className="ls-pit-stat">{curP.so} SO</span>
          <span className="ls-pit-stat">{curP.er} ER</span>
          {curP.dec && <span className={`dec dec-${curP.dec}`}>{decLabel(curP.dec)}</span>}
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
                <span className="pos">{r.label}</span> {r.name}
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
              <td className="l">{r.name}</td>
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
function PlayBanner({ result }: { result: GameResult }) {
  const plays = result.play;
  const len = plays.length;
  // Non ri-animare le giocate gia' presenti al montaggio (partita ripresa).
  const seenRef = useRef(len);
  const [state, setState] = useState<{ com: Commentary; phase: number; leaving: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (len <= seenRef.current) {
      seenRef.current = len;
      return;
    }
    seenRef.current = len;
    const ev = plays[len - 1];
    // La sostituzione (pinch-hit) non e' una giocata: niente banner.
    if (ev.kind === 'sub') {
      setState(null);
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
function CronacaTeam({ result, side }: { result: GameResult; side: Side }) {
  const half = side === 'away' ? 'top' : 'bottom';
  const groups = groupPlays(result).filter((g) => g.key.endsWith(half));
  const team = side === 'away' ? result.away : result.home;
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [result.play.length]);

  return (
    <div className="cronaca-team" style={{ ['--tc' as string]: team.primaryColor }}>
      <div className="crt-head">
        <span className="pill" style={{ background: team.primaryColor }}>
          {team.abbrev}
        </span>
        <span className="crt-title">Cronaca {side === 'away' ? 'ospite' : 'casa'}</span>
      </div>
      <div className="crt-body" ref={bodyRef}>
        {groups.length === 0 && <div className="cr-empty">In attesa…</div>}
        {groups.map((g) => (
          <div key={g.key} className="cr-inning">
            <div className="cr-inhead">
              <span>{g.header}</span>
              <span className="cr-score">
                {g.events[g.events.length - 1].away}–{g.events[g.events.length - 1].home}
              </span>
            </div>
            <ul>
              {g.events.map((ev, i) => (
                <li key={i} className={ev.runsScored > 0 ? 'scored' : ''}>
                  {ev.text}
                </li>
              ))}
            </ul>
          </div>
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

/** Voto in stelle 1..5 dall'overall: piene evidenti, vuote smorzate. */
function Stars({ overall }: { overall: number }) {
  const n = Math.max(1, Math.min(5, Math.round((overall - 20) / 15) + 1));
  return (
    <span className="stars" title={`${overall} OVR`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? 'st full' : 'st empty'}>
          {i < n ? '★' : '☆'}
        </span>
      ))}
    </span>
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

/** Linea di battuta ATTESA dai rating (o zeri per la stagione in corso). */
function batLine(b: Batter, mode: RosterStat): BatLine {
  if (mode === 'season') {
    return { g: 0, avg: 0, obp: 0, slg: 0, h: 0, d2: 0, t3: 0, hr: 0, rbi: 0, bb: 0, so: 0, sb: 0 };
  }
  const s = deriveBatterStats(b.ratings);
  const ab = Math.max(1, s.pa - s.bb - s.hbp);
  const singles = s.h - s.double - s.triple - s.hr;
  const tb = singles + 2 * s.double + 3 * s.triple + 4 * s.hr;
  return {
    g: round(s.pa / 4.3),
    avg: s.h / ab,
    obp: (s.h + s.bb + s.hbp) / s.pa,
    slg: tb / ab,
    h: s.h, d2: s.double, t3: s.triple, hr: s.hr,
    rbi: round(s.hr * 1.9 + (s.h - s.hr) * 0.35), // stima: risultato, non peripheral
    bb: s.bb, so: s.so, sb: s.sb,
  };
}

interface PitLine {
  w: number; l: number; g: number; gs: number; ip: number; ipOuts: number; era: number;
  h: number; bb: number; k: number; svo: number; sv: number; whip: number; k9: number;
}

/** Stima dei punti guadagnati (ER) da una linea attesa: ERA e' un risultato. */
function estimateER(h: number, hr: number, bb: number): number {
  return 0.32 * (h - hr) + 1.44 * hr + 0.11 * bb;
}

/** Carico stagionale atteso per ruolo (partite, aperture, battitori affrontati). */
const PITCH_LOAD: Record<string, { g: number; gs: number; bf: number }> = {
  SP: { g: 32, gs: 32, bf: 800 },
  RP: { g: 65, gs: 0, bf: 280 },
  CL: { g: 62, gs: 0, bf: 248 },
};

/** Linea di lancio ATTESA dai rating (peripherals derivati; risultati stimati). */
function pitLine(p: Pitcher, mode: RosterStat): PitLine {
  if (mode === 'season') {
    return { w: 0, l: 0, g: 0, gs: 0, ip: 0, ipOuts: 0, era: 0, h: 0, bb: 0, k: 0, svo: 0, sv: 0, whip: 0, k9: 0 };
  }
  const load = PITCH_LOAD[p.role] ?? PITCH_LOAD.RP;
  const s = derivePitcherStats(p.ratings, load.bf);
  const outs = Math.max(1, load.bf - s.h - s.bb - s.hbp);
  const ip = outs / 3;
  const ovr = pitcherOverall(p.ratings);
  const wp = clamp01(0.5 + (ovr - 50) / 60, 0.35, 0.68);
  const dec = p.role === 'SP' ? 20 : p.role === 'CL' ? 6 : 8;
  const w = round(dec * wp);
  let svo = 0;
  let sv = 0;
  if (p.role === 'CL') {
    svo = round(38 + (ovr - 55) * 0.4);
    sv = round(svo * clamp01(0.8 + (ovr - 55) / 120, 0.7, 0.93));
  } else if (p.role === 'RP') {
    svo = 6;
    sv = round(svo * 0.5);
  }
  return {
    w, l: dec - w, g: load.g, gs: load.gs, ip, ipOuts: outs,
    era: (estimateER(s.h, s.hr, s.bb) / ip) * 9,
    h: s.h, bb: s.bb, k: s.so, svo, sv,
    whip: (s.h + s.bb) / ip, k9: (s.so / ip) * 9,
  };
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
  const e = round(chances * m.err * clamp01(1 - (fielding - 50) / 60, 0.4, 1.7));
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

// Posizioni difensive sul campo semplificato (percentuali dentro il riquadro).
// Le CASELLE sono FISSE: si spostano i giocatori. Il DH sta fuori dal diamante.
const FIELD_LAYOUT: Array<{ pos: Position; x: number; y: number }> = [
  { pos: 'CF', x: 50, y: 9 },
  { pos: 'LF', x: 17, y: 24 },
  { pos: 'RF', x: 83, y: 24 },
  { pos: 'SS', x: 36, y: 45 },
  { pos: '2B', x: 64, y: 45 },
  { pos: '3B', x: 19, y: 60 },
  { pos: '1B', x: 81, y: 60 },
  { pos: 'C', x: 50, y: 85 },
];

function RosterPage({
  team,
  initial,
  activeGame,
  season,
  onApply,
  onSave,
  onStart,
}: {
  team: Team;
  initial?: MatchArrangement;
  activeGame: boolean;
  season: SeasonState;
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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const batters = rosterBatters(team);
  const pitchers = rosterPitchers(team);
  const bById = new Map(batters.map((b) => [b.id, b]));
  const pById = new Map(pitchers.map((p) => [p.id, p]));
  const lineup = arr.order.map((id) => bById.get(id)).filter(Boolean) as Batter[];
  const starterIds = new Set(arr.order);
  const bench = batters.filter((b) => !starterIds.has(b.id));
  const check = validateArrangement(team, arr);
  const ratingsMode = statMode === 'ratings';
  const lastName = (n: string) => n.split(' ').slice(-1)[0] || n;
  const posRank = (p: Position) => FIELD_SLOTS.indexOf(p);
  const defOrder = [...lineup].sort(
    (a, b) => posRank(arr.defense[a.id] ?? a.position) - posRank(arr.defense[b.id] ?? b.position),
  );

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
  const reorderBatting = (targetId: string, draggedId: string) => {
    if (draggedId === targetId) return;
    const cur = arr.order;
    const fromI = cur.indexOf(draggedId);
    const toI = cur.indexOf(targetId);
    if (fromI < 0 || toI < 0) return;
    const order = cur.filter((id) => id !== draggedId);
    // Scendendo si inserisce DOPO il target, salendo PRIMA: cosi' il riordino
    // funziona in entrambe le direzioni (prima scendeva "una posizione corta").
    const at = order.indexOf(targetId) + (fromI < toI ? 1 : 0);
    order.splice(at, 0, draggedId);
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
    if (drag) setSlot(slot, drag.id);
    setDrag(null);
  };
  const dropBenchRow = (benchId: string) => {
    if (drag && drag.from === 'lineup') substitute(drag.id, benchId);
    setDrag(null);
  };

  // --- Pitchers: composizione staff via drag&drop ----------------------
  const usedP = new Set([...arr.rotation, ...arr.bullpen]);
  const availP = pitchers.filter((p) => !usedP.has(p.id));
  const placePitcher = (toList: 'rotation' | 'bullpen' | 'avail', targetId?: string) => {
    if (!drag) return;
    const id = drag.id;
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
  // Nomina closer: qualsiasi rilievo puo' esserlo. Lo si porta nel bullpen (fuori
  // dalla rotazione) e lo si segna come closer; a video diventa CL, in gara chiude.
  const setCloser = (id: string) => {
    if (!drag && !pById.has(id)) return;
    const rotation = arr.rotation.filter((x) => x !== id);
    const bullpen = arr.bullpen.includes(id) ? arr.bullpen : [...arr.bullpen, id];
    update({ rotation, bullpen, closerId: id });
    setDrag(null);
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
    const s = statMode === 'season' ? seasonBatLine(season.bat[b.id]) : batLine(b, statMode);
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
    const g = statMode === 'season' ? seasonBatLine(season.bat[b.id]).g : batLine(b, statMode).g;
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
    const s = statMode === 'season' ? seasonPitLine(season.pit[p.id]) : pitLine(p, statMode);
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
  const pitcherRow = (p: Pitcher, from: string, i: number, tag?: string) => (
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
        ⠿ {p.name}
        {tag && <span className="tag">{tag}</span>}
      </td>
      <td className="roles">
        <span className={p.id === arr.closerId ? 'rolebadge cl' : 'rolebadge'}>
          {p.id === arr.closerId ? 'CL' : p.role}
        </span>
      </td>
      <td className="ovr"><Stars overall={pitcherOverall(p.ratings)} /></td>
      <td>{p.age}</td>
      {pitStatCells(p)}
    </tr>
  );

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
        {title} <span className="card-sub">{hint}</span>
      </div>
      <div className="roster-scroll">
        <table className="ratings roster-tbl">
          <thead>
            <tr>
              <th className="n">#</th>
              <th className="l">Lanciatore</th>
              <th>RUOLO</th>
              <th title="Valore totale">OVR</th>
              <th title="Età">ETÀ</th>
              {pitCols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) =>
              pitcherRow(p, list, i, list === 'rotation' && i === 0 ? 'parte' : undefined),
            )}
            {rows.length === 0 && (
              <tr>
                <td className="l" colSpan={5 + pitCols.length}>
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
          <>
            <div className="card">
              <div className="card-title">
                Ordine di battuta{' '}
                <span className="card-sub">
                  trascina per riordinare (su e giù); un disponibile su un titolare = sostituzione
                </span>
              </div>
              <div className="roster-scroll">
                <table className="ratings roster-tbl">
                  <thead>
                    <tr>
                      <th className="n">#</th>
                      <th className="l">Giocatore</th>
                      <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                      <th title="Valore totale">OVR</th>
                      <th className="age-h" title="Età">ETÀ</th>
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
                        <td className="l grip">⠿ {b.name}</td>
                        <td className="roles">{rolesOf(b)}</td>
                        <td className="ovr"><Stars overall={batterOverall(b.ratings)} /></td>
                        <td className="age">{b.age}</td>
                        {batAtkCells(b)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" onDragOver={(e) => e.preventDefault()}>
              <div className="card-title">
                Disponibili ({bench.length}){' '}
                <span className="card-sub">trascina su un titolare per sostituire</span>
              </div>
              <div className="roster-scroll">
                <table className="ratings roster-tbl">
                  <thead>
                    <tr>
                      <th className="l">Giocatore</th>
                      <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                      <th title="Valore totale">OVR</th>
                      <th className="age-h" title="Età">ETÀ</th>
                      {batAtkCols.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bench.map((b) => (
                      <tr
                        key={b.id}
                        className={`drow${drag?.id === b.id ? ' dragging' : ''}`}
                        draggable
                        onDragStart={() => setDrag({ id: b.id, from: 'bench' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => { dropBenchRow(b.id); setOver(null); }}
                      >
                        <td className="l grip">⠿ {b.name}</td>
                        <td className="roles">{rolesOf(b)}</td>
                        <td className="ovr"><Stars overall={batterOverall(b.ratings)} /></td>
                        <td className="age">{b.age}</td>
                        {batAtkCells(b)}
                      </tr>
                    ))}
                    {bench.length === 0 && (
                      <tr>
                        <td className="l" colSpan={4 + batAtkCols.length}>
                          Nessun disponibile.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <div className="card-title">
                Schieramento{' '}
                <span className="card-sub">
                  le caselle sono FISSE: trascina i giocatori sulle posizioni per scambiarli
                </span>
              </div>
              <div className="def-field">
                {FIELD_LAYOUT.map(({ pos, x, y }) => {
                  const id = occupantOf(pos);
                  const b = id ? bById.get(id) : undefined;
                  const outOfRole = b ? !canOccupy(b, pos) : false;
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
                    >
                      <span className="fpos-lbl">{pos}</span>
                      <span className="fpos-name">{b ? lastName(b.name) : '—'}</span>
                      {b && <span className="fpos-ovr"><Stars overall={batterOverall(ratingsAtPosition(b, pos))} /></span>}
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
                      <span className="fpos-name">{b ? lastName(b.name) : '—'}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                Per posizione{' '}
                <span className="card-sub">
                  dal ricevitore al n.9; trascina un nome su una riga per scambiare la casella
                </span>
              </div>
              <div className="roster-scroll">
                <table className="ratings roster-tbl">
                  <thead>
                    <tr>
                      <th title="Casella difensiva">POS</th>
                      <th className="l">Giocatore</th>
                      <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                      <th title="Valore totale">OVR</th>
                      <th className="age-h" title="Età">ETÀ</th>
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
                          <td className="l grip">⠿ {b.name}</td>
                          <td className="roles">{rolesOf(b)}</td>
                          <td className="ovr"><Stars overall={batterOverall(ratingsAtPosition(b, pos))} /></td>
                          <td className="age">{b.age}</td>
                          {batDefCells(b, pos)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : (
        <>
          {pitTable(
            'Rotazione',
            'ordine degli starter · il primo parte',
            'rotation',
            arr.rotation.map((id) => pById.get(id)).filter(Boolean) as Pitcher[],
          )}

          <div
            className={`card closer-card${over === 'closer' && drag ? ' over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver('closer'); }}
            onDrop={() => { if (drag) setCloser(drag.id); setOver(null); }}
          >
            <div className="card-title">
              Closer{' '}
              <span className="card-sub">
                trascina qui un rilievo: chiude le gare (ruolo CL per la stagione, non è rigido)
              </span>
            </div>
            {(() => {
              const c = arr.closerId ? pById.get(arr.closerId) : undefined;
              if (!c) {
                return <div className="closer-empty">Nessun closer designato — trascina qui un rilievo.</div>;
              }
              return (
                <div
                  className={`closer-slot${drag?.id === c.id ? ' dragging' : ''}`}
                  draggable
                  onDragStart={() => setDrag({ id: c.id, from: 'bullpen' })}
                  onDragEnd={() => { setDrag(null); setOver(null); }}
                >
                  <span className="rolebadge cl">CL</span>
                  <span className="closer-name">⠿ {c.name}</span>
                  <Stars overall={pitcherOverall(c.ratings)} />
                  <span className="closer-meta">
                    {c.age} anni · DOM {c.ratings.stuff} · CTR {c.ratings.control} · MOV{' '}
                    {c.ratings.movement}
                  </span>
                </div>
              );
            })()}
          </div>

          {pitTable(
            'Bullpen',
            "ordine d'ingresso dei rilievi · l'ultimo chiude",
            'bullpen',
            arr.bullpen
              .filter((id) => id !== arr.closerId)
              .map((id) => pById.get(id))
              .filter(Boolean) as Pitcher[],
          )}
          {pitTable('Disponibili', 'trascina in rotazione o bullpen', 'avail', availP)}
        </>
      )}
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
  onManagedChange,
  onNewLeague,
}: {
  league: Team[];
  managedTeam: Team;
  schedule: Schedule;
  season: SeasonState;
  onPlay: (g: ScheduleGame) => void;
  onManagedChange: (id: string) => void;
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
  const leaders: Array<{ label: string; who?: string; val: string }> = [
    (() => {
      const x = topBy(myBatters, batOf, (s: SeasonBat) => s.hr);
      return { label: 'HR', who: x?.t.name, val: x ? `${x.v}` : '—' };
    })(),
    (() => {
      const x = topBy(myBatters, batOf, (s: SeasonBat) => s.rbi);
      return { label: 'RBI', who: x?.t.name, val: x ? `${x.v}` : '—' };
    })(),
    (() => {
      const x = topBy(myBatters, batOf, (s: SeasonBat) => (s.ab ? s.h / s.ab : 0), 5);
      return { label: 'AVG', who: x?.t.name, val: x ? x.v.toFixed(3).replace(/^0/, '') : '—' };
    })(),
    (() => {
      const x = topBy(myPitchers, pitOf, (s: SeasonPit) => s.w);
      return { label: 'W', who: x?.t.name, val: x ? `${x.v}` : '—' };
    })(),
    (() => {
      const x = topBy(myPitchers, pitOf, (s: SeasonPit) => s.so);
      return { label: 'K', who: x?.t.name, val: x ? `${x.v}` : '—' };
    })(),
    (() => {
      const x = topBy(myPitchers, pitOf, (s: SeasonPit) => s.sv);
      return { label: 'SV', who: x?.t.name, val: x ? `${x.v}` : '—' };
    })(),
  ];
  const played = Object.keys(season.results).length > 0;

  // Mini-classifica della mia division (reale).
  const myDiv = sortByRecord(season, divisionRivals(league, managedTeam.id));
  const divLeader = recordOf(season, myDiv[0]?.id ?? managedTeam.id);

  // Calendario a finestra: ~10 gare attorno al turno, scorrimento manuale.
  const regState = (i: number): ChipState =>
    i < day ? 'played' : i === day ? 'current' : 'locked';
  const WIN = 10;
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
          <label className="dash-pick">
            <span>Squadra gestita</span>
            <select value={managedTeam.id} onChange={(e) => onManagedChange(e.target.value)}>
              {league.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.abbrev} — {t.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={onNewLeague} title="Rigenera l'intera lega da un nuovo seed">
            🔄 Nuova lega
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
                    <span className="lwho">{l.who ?? '—'}</span>
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
          <TeamBadge team={managedTeam} size={18} /> {managedTeam.abbrev}
          <span className="mc-rec">{myRec.w}-{myRec.l}</span>
        </span>
        <span className="mc-vs">{g.home ? 'vs' : '@'}</span>
        <span className="mc-team">
          <TeamBadge team={opp} size={18} /> {opp.abbrev}
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
}
interface LbPit {
  id: string;
  name: string;
  team: Team;
  managed: boolean;
  line: PitLine;
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

function LbTable<R extends { id: string; name: string; team: Team; managed: boolean }>({
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
              <td className="l name">{r.name}</td>
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
          out.push({ id: b.id, name: b.name, team: t, managed, line: seasonBatLine(sb), pa });
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
        out.push({ id: p.id, name: p.name, team: t, managed, line: seasonPitLine(sp) });
      }
    }
    return out;
  }, [league, season, seed, managedId, day, preseason, projDay]);

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

        {tab === 'batting' ? (
          <LbTable key="bat" rows={batRows} cols={BAT_LB_COLS} defaultKey="hr" />
        ) : (
          <LbTable key="pit" rows={pitRows} cols={PIT_LB_COLS} defaultKey="era" />
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

function FranchisePage({ team }: { team: Team }) {
  return (
    <div className="page">
      <div className="card page-stub">
        <div className="card-title">
          <TeamBadge team={team} size={22} /> Franchigia — {team.name}
        </div>
        <p>
          Il layer manageriale: stipendio unico annuale, salary cap rigido, scambi a valore,
          draft basilare. Da ampliare nei passi successivi.
        </p>
        <p className="muted">Impalcatura: i controlli di gestione arriveranno qui.</p>
      </div>
    </div>
  );
}
