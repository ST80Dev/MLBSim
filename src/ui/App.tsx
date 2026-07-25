import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
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
} from '../engine/game';
import { batterOverall, pitcherOverall } from '../engine/ratings';
import { ratingsAtPosition, canOccupy, fieldingAtPosition } from '../engine/positions';
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
import { generateLeague, teamById, byDivision, LEAGUE_LABEL, DIVISION_LABEL } from '../data/league';
import { generateSchedule } from '../data/schedule';
import type { ScheduleGame, Schedule } from '../data/schedule';
import { stadiumImage, stadiumImageCandidates, assetUrl } from '../data/stadiumImages';
import type { StadiumImageCandidate } from '../data/stadiumImages';
import {
  getCalibration,
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

type View = 'home' | 'roster' | 'leaderboard' | 'standings' | 'franchise' | 'game';

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
  const [, forceTick] = useReducer((x) => x + 1, 0);
  // Assetti applicati (per teamId) che entrano DAVVERO nella simulazione: la
  // squadra gestita scende in campo con l'ordine di battuta e la difesa scelti
  // nell'editor. Idratati dal salvataggio all'avvio.
  const [arrangements, setArrangements] = useState<Record<string, MatchArrangement>>({});

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
  useEffect(() => {
    setCal(getCalibration(homeId));
  }, [homeId]);
  const result = toGameResult(live);
  const sit = situation(live);
  const final = live.status === 'final';
  // Sfondo-stadio ambientale (attenuato) dietro tutta la plancia: riempie i bordi
  // e sfuma sotto testata/pannelli, per ridurre il nero. La stessa foto scelta.
  const backdropUrl = cal.image ? assetUrl(cal.image) : stadiumImage(homeId);
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

  const newLeague = () => {
    setLeagueSeed(newRandomSeed());
    setManagedId('');
    setActiveGame(null);
  };

  // Dal calendario: scegli la gara da giocare. La preparazione (Roster) e la
  // partita useranno questa gara. Per ora "gioca" porta direttamente in campo;
  // la pagina di preparazione dedicata arrivera' col rifacimento del Roster.
  const playGame = (g: ScheduleGame) => {
    setActiveGame(g);
    setView('game');
  };

  // Editor: applica l'assetto alla sola squadra gestita (entra nella sim,
  // riavvia la gara) ed eventualmente lo rende persistente sul cloud.
  const applyManaged = (arr: MatchArrangement) => {
    setArrangements((m) => ({ ...m, [myId]: arr }));
  };
  const saveManaged = async (arr: MatchArrangement) => {
    const next = { ...arrangements, [myId]: arr };
    setArrangements(next);
    await saveStore.save(SAVE_SLOT, { managedTeamId: myId, lineups: next });
  };

  return (
    <div className={view === 'game' ? 'app app-game' : 'app'}>
      {view === 'game' && backdropUrl && (
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
            ] as Array<[View, string]>
          ).map(([v, label]) => (
            <button
              key={v}
              className={view === v ? 'tab active' : 'tab'}
              onClick={() => setView(v)}
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
                <button
                  className="btn primary"
                  onClick={() => {
                    setActiveGame(null);
                    setView('home');
                  }}
                >
                  Al calendario ▸
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
        <div className="game-screen">
          <StatBar
            result={result}
            sit={sit}
            statsMode={statsMode}
            setStatsMode={setStatsMode}
          />

          <div className={editing ? 'gamefield editing' : 'gamefield'}>
            <Diamond
              home={result.home}
              away={result.away}
              background
              bases={sit.bases}
              cal={cal}
              editable={editing}
              onMarkerMove={moveMarker}
            />

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

            <div className="controls-overlay">
              {final ? (
                <FinalOverlay
                  result={result}
                  controlled={controlled}
                  onNew={() => {
                    setActiveGame(null);
                    setView('home');
                  }}
                  onRecap={() => setRecapOpen(true)}
                />
              ) : (
                <ActionBar live={live} sit={sit} act={act} />
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'home' && (
        <HomePage
          league={league}
          managedTeam={managedTeam}
          schedule={schedule}
          activeGameId={activeGame?.id ?? null}
          onPlay={playGame}
          onManagedChange={(id) => {
            setManagedId(id);
            setActiveGame(null);
          }}
          onNewLeague={newLeague}
        />
      )}

      {view === 'roster' && (
        <ManageView
          key={myId}
          team={managedTeam}
          initial={arrangement}
          onApply={applyManaged}
          onSave={saveManaged}
        />
      )}

      {view === 'leaderboard' && <LeaderboardPage league={league} />}
      {view === 'standings' && <StandingsPage league={league} managedId={myId} />}
      {view === 'franchise' && <FranchisePage team={managedTeam} />}

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

function CalibrationPanel({
  team,
  hasPhoto,
  cal,
  setCal,
  onClose,
}: {
  team: Team;
  hasPhoto: boolean;
  cal: FieldCalibration;
  setCal: (c: FieldCalibration) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

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

  const set = (k: NumericCalKey, val: number) => {
    const rng = CALIBRATION_RANGE[k];
    const clamped = Math.max(rng.min, Math.min(rng.max, val));
    const dec = rng.step >= 1 ? 0 : 2;
    const p = Math.pow(10, dec);
    setCal({ ...cal, [k]: Math.round(clamped * p) / p });
    setCopied(false);
  };

  const pickImage = (path: string | undefined) => {
    setCal({ ...cal, image: path });
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

  const row = (k: NumericCalKey) => {
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
          <button className="cal-step" onClick={() => set(k, v - nudge)} aria-label="diminuisci">
            −
          </button>
          <input
            type="range"
            min={rng.min}
            max={rng.max}
            step={rng.step}
            value={v}
            onChange={(e) => set(k, parseFloat(e.target.value))}
          />
          <button className="cal-step" onClick={() => set(k, v + nudge)} aria-label="aumenta">
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
            Trascina i <b>14 marker</b> sulla foto (9 difensori, 3 basi, casa base,
            battitore). La foto è fissata: regola prima <b>zoom/pan</b> qui sotto.
          </div>
          <button className="btn" onClick={exitManual}>
            ↩︎ Torna ai parametri
          </button>
        </>
      ) : (
        <>
          <div className="cal-group">Campo (perno = casa base)</div>
          {CAL_FIELD_KEYS.map(row)}
          <button className="btn" onClick={enterManual} title="Sposta i marker a mano sulla foto">
            ✋ Piazza marker a mano
          </button>
        </>
      )}
      <div className="cal-group">Foto di sfondo</div>
      {CAL_PHOTO_KEYS.map(row)}
      <div className="cal-actions">
        <button
          className="btn"
          onClick={() => setCal({ ...PHOTO_DEFAULT_CALIBRATION, image: cal.image })}
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
      <PitcherChange live={live} act={act} />
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
  onNew,
  onRecap,
}: {
  result: GameResult;
  controlled: Side;
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
          Nuova partita ▸
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

function lastName(name: string): string {
  const i = name.indexOf(' ');
  return i < 0 ? name : name.slice(i + 1);
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
  // Lanciatore attualmente in pedana per questa squadra (ultima riga usata).
  const curP = stats.pitching[stats.pitching.length - 1];
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
                <span className="pos">{r.line.position}</span> {lastName(r.line.name)}
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
          <span className="ls-pit-name">{lastName(curP.name)}</span>
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

// ---------------------------------------------------------------------------
// Vista "Gestisci": il "foglio partita" della squadra gestita. Quattro pannelli
// scelgono i partecipanti dalla rosa completa (battitori / lanciatori) e ne
// decidono ordine e ruoli: ordine di battuta, difesa (casella -> giocatore),
// rotazione (il primo starter parte) e bullpen (ordine dei rilievi). Le
// modifiche vivono in una bozza locale finche' non premi "Applica" (entra nella
// simulazione, riavvia la gara) o "Salva" (persiste sul cloud e applica).
// Salvataggio esplicito, come da scelta dell'utente.
// ---------------------------------------------------------------------------

function ManageView({
  team,
  initial,
  onApply,
  onSave,
}: {
  team: Team;
  initial?: MatchArrangement;
  onApply: (arr: MatchArrangement) => void;
  onSave: (arr: MatchArrangement) => Promise<void>;
}) {
  const [arr, setArr] = useState<MatchArrangement>(() => initial ?? defaultArrangement(team));
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const batters = rosterBatters(team);
  const pitchers = rosterPitchers(team);
  const bById = new Map(batters.map((b) => [b.id, b]));
  const pById = new Map(pitchers.map((p) => [p.id, p]));
  const check = validateArrangement(team, arr);

  const update = (patch: Partial<MatchArrangement>) => {
    setArr((a) => ({ ...a, ...patch }));
    setSaveState('idle');
  };

  // order deve restare una permutazione dei partecipanti (le chiavi di defense).
  const reconcileOrder = (order: string[], participants: string[]): string[] => {
    const set = new Set(participants);
    const kept = order.filter((id) => set.has(id));
    const seen = new Set(kept);
    for (const id of participants) if (!seen.has(id)) kept.push(id);
    return kept;
  };

  // --- Ordine di battuta -------------------------------------------------
  const lineup = arr.order.map((id) => bById.get(id)).filter(Boolean) as Batter[];
  const moveBat = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= arr.order.length) return;
    const order = [...arr.order];
    [order[i], order[j]] = [order[j], order[i]];
    update({ order });
  };
  const autoBat = () => update({ order: autoLineup(lineup).map((b) => b.id) });

  // --- Difesa: casella -> battitore --------------------------------------
  const occupantOf = (slot: Position): string | undefined =>
    Object.keys(arr.defense).find((id) => arr.defense[id] === slot);
  const setSlot = (slot: Position, x: string) => {
    const defense: Record<string, Position> = { ...arr.defense };
    const y = occupantOf(slot); // occupante attuale della casella (di norma definito)
    const sx = defense[x]; // casella attuale di x (undefined se pescato dalla panca)
    if (sx) {
      // x gia' titolare altrove: scambio di caselle tra x e y.
      defense[x] = slot;
      if (y) defense[y] = sx;
    } else {
      // x dalla panca: prende la casella, y esce dai nove.
      if (y) delete defense[y];
      defense[x] = slot;
    }
    update({ defense, order: reconcileOrder(arr.order, Object.keys(defense)) });
  };

  // --- Lanciatori: liste ordinate rotazione / bullpen --------------------
  const usedP = new Set([...arr.rotation, ...arr.bullpen]);
  const moveP = (field: 'rotation' | 'bullpen', i: number, dir: -1 | 1) => {
    const list = [...arr[field]];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    update({ [field]: list });
  };
  const removeP = (field: 'rotation' | 'bullpen', id: string) =>
    update({ [field]: arr[field].filter((x) => x !== id) });
  const addP = (field: 'rotation' | 'bullpen', id: string) => {
    if (!id) return;
    update({ [field]: [...arr[field], id] });
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

  // Pool disponibile ad aggiungere un lanciatore (non gia' in rotazione/bullpen).
  const freePitchers = pitchers.filter((p) => !usedP.has(p.id));

  const pitcherList = (field: 'rotation' | 'bullpen', title: string, subtitle: string) => {
    const ids = arr[field];
    return (
      <div className="card pitch-card">
        <div className="card-title" style={{ borderColor: team.primaryColor }}>
          {title} <span className="card-sub">{subtitle}</span>
        </div>
        <ol className="pitch-list">
          {ids.length === 0 && <li className="empty">Nessun lanciatore selezionato.</li>}
          {ids.map((id, i) => {
            const p = pById.get(id);
            if (!p) return null;
            const starts = field === 'rotation' && i === 0;
            return (
              <li key={id} className={starts ? 'starts' : undefined}>
                <span className="ord">
                  <button className="ordbtn" title="Su" disabled={i === 0} onClick={() => moveP(field, i, -1)}>
                    ▲
                  </button>
                  <button
                    className="ordbtn"
                    title="Giù"
                    disabled={i === ids.length - 1}
                    onClick={() => moveP(field, i, 1)}
                  >
                    ▼
                  </button>
                </span>
                <span className="pnum">{i + 1}</span>
                <span className="pname">
                  {p.name}
                  {starts && <span className="tag">parte</span>}
                </span>
                <span className="povr">{stars(pitcherOverall(p.ratings))}</span>
                <button className="rmbtn" title="Rimuovi" onClick={() => removeP(field, id)}>
                  ✕
                </button>
              </li>
            );
          })}
        </ol>
        <div className="pitch-add">
          <select
            value=""
            onChange={(e) => {
              addP(field, e.target.value);
              e.currentTarget.value = '';
            }}
            disabled={freePitchers.length === 0}
          >
            <option value="">
              {freePitchers.length === 0 ? 'Nessun lanciatore libero' : '+ Aggiungi lanciatore…'}
            </option>
            {freePitchers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role} · {stars(pitcherOverall(p.ratings))}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="roster-view manage-view">
      <div className="card-title manage-head" style={{ borderColor: team.primaryColor }}>
        <TeamBadge team={team} size={26} /> {team.name} — foglio partita
        <div className="manage-actions">
          {check.ok ? (
            <span className="save-state saved">Assetto valido</span>
          ) : (
            <span className="manage-warn inline">⚠ {check.errors[0]}</span>
          )}
          <button className="btn" onClick={autoBat} title="Ordine di battuta automatico">
            ⚙ Auto ordine
          </button>
          <button
            className="btn"
            onClick={() => onApply(arr)}
            disabled={!check.ok}
            title="Applica alla partita (riavvia la gara in corso)"
          >
            ✓ Applica
          </button>
          <button
            className="btn primary"
            onClick={save}
            disabled={!check.ok || saveState === 'saving'}
            title="Salva sul cloud e applica"
          >
            {saveState === 'saving' ? '… Salvataggio' : '💾 Salva'}
          </button>
          <span className={`save-state ${saveState}`}>
            {saveState === 'saved' && 'Salvato'}
            {saveState === 'error' && 'Errore (offline?)'}
          </span>
        </div>
      </div>

      <div className="manage-grid4">
        {/* Pannello 1: ordine di battuta dei 9 titolari. */}
        <div className="card">
          <div className="card-title" style={{ borderColor: team.primaryColor }}>
            Ordine di battuta <span className="card-sub">chi batte, in che ordine</span>
          </div>
          <table className="ratings lineup-edit">
            <thead>
              <tr>
                <th className="n">#</th>
                <th className="ord"></th>
                <th className="l">Battitore</th>
                <th title="Ruolo in difesa">DIF</th>
                <th title="Contatto">CON</th>
                <th title="Potenza">POT</th>
                <th title="Occhio">OCC</th>
                <th title="Overall">OVR</th>
              </tr>
            </thead>
            <tbody>
              {lineup.map((b, i) => {
                const pos = arr.defense[b.id] ?? b.position;
                const r = ratingsAtPosition(b, pos);
                return (
                  <tr key={b.id}>
                    <td className="n">{i + 1}</td>
                    <td className="ord">
                      <button className="ordbtn" title="Su" disabled={i === 0} onClick={() => moveBat(i, -1)}>
                        ▲
                      </button>
                      <button
                        className="ordbtn"
                        title="Giù"
                        disabled={i === lineup.length - 1}
                        onClick={() => moveBat(i, 1)}
                      >
                        ▼
                      </button>
                    </td>
                    <td className="l">{b.name}</td>
                    <td>
                      <span className={pos === b.position ? 'pos' : 'pos moved'}>{pos}</span>
                    </td>
                    <Rating v={r.contact} />
                    <Rating v={r.power} />
                    <Rating v={r.eye} />
                    <td className="ovr">{stars(batterOverall(r))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pannello 2: difesa, una casella per riga -> scegli il giocatore. */}
        <div className="card">
          <div className="card-title" style={{ borderColor: team.secondaryColor }}>
            Difesa <span className="card-sub">chi copre ogni casella</span>
          </div>
          <table className="ratings def-edit">
            <thead>
              <tr>
                <th className="l">Casella</th>
                <th className="l">Giocatore</th>
                <th title="Fielding nella casella">FIE</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_SLOTS.map((slot) => {
                const id = occupantOf(slot);
                const b = id ? bById.get(id) : undefined;
                const fie = b ? fieldingAtPosition(b, slot) : 0;
                const outOfRole = b ? !canOccupy(b, slot) : false;
                return (
                  <tr key={slot} className={outOfRole ? 'moved' : undefined}>
                    <td className="l">
                      <span className="pos">{slot}</span>
                    </td>
                    <td className="l">
                      <select value={id ?? ''} onChange={(e) => setSlot(slot, e.target.value)}>
                        {batters.map((cand) => (
                          <option key={cand.id} value={cand.id}>
                            {cand.name} ({cand.position})
                          </option>
                        ))}
                      </select>
                      {outOfRole && (
                        <span className="warn-badge" title="Fuori dal ruolo naturale/secondario">
                          ⚠
                        </span>
                      )}
                    </td>
                    <Rating v={fie} />
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="manage-hint">
            Scegli tra tutti i battitori della rosa: la selezione qui definisce i 9 titolari.
            ⚠ = fuori ruolo (fielding penalizzato).
          </p>
        </div>

        {/* Pannello 3: rotazione (il primo parte). */}
        {pitcherList('rotation', 'Rotazione', 'il primo parte in questa gara')}

        {/* Pannello 4: bullpen (ordine d'uso dei rilievi). */}
        {pitcherList('bullpen', 'Rilievi', "ordine d'ingresso dal bullpen")}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagine argomentali raggiungibili dall'header. In questa fase Home (dashboard +
// calendario) e' completa; Leaderboard e Franchigia sono impalcature che si
// riempiranno nei rispettivi passi; Classifiche mostra gia' la struttura reale
// delle division. Tutte leggono la stessa lega generata da seed.
// ---------------------------------------------------------------------------

function GameChip({
  g,
  league,
  active,
  onPlay,
}: {
  g: ScheduleGame;
  league: Team[];
  active: boolean;
  onPlay: (g: ScheduleGame) => void;
}) {
  const opp = g.opponentId ? teamById(league, g.opponentId) : undefined;
  return (
    <button
      className={`gchip${active ? ' active' : ''}${opp ? '' : ' tbd'}`}
      disabled={!opp}
      onClick={() => opp && onPlay(g)}
      title={
        opp
          ? `Giornata ${g.day}: ${g.home ? 'vs' : '@'} ${opp.name} — gioca`
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
    </button>
  );
}

function CalSection({
  title,
  hint,
  games,
  league,
  activeGameId,
  onPlay,
}: {
  title: string;
  hint: string;
  games: ScheduleGame[];
  league: Team[];
  activeGameId: string | null;
  onPlay: (g: ScheduleGame) => void;
}) {
  return (
    <div className="card cal-section">
      <div className="card-title">
        {title} <span className="card-sub">{hint}</span>
      </div>
      <div className="cal-chips">
        {games.map((g) => (
          <GameChip
            key={g.id}
            g={g}
            league={league}
            active={g.id === activeGameId}
            onPlay={onPlay}
          />
        ))}
      </div>
    </div>
  );
}

function HomePage({
  league,
  managedTeam,
  schedule,
  activeGameId,
  onPlay,
  onManagedChange,
  onNewLeague,
}: {
  league: Team[];
  managedTeam: Team;
  schedule: Schedule;
  activeGameId: string | null;
  onPlay: (g: ScheduleGame) => void;
  onManagedChange: (id: string) => void;
  onNewLeague: () => void;
}) {
  const next = schedule.regular[0];
  const nextOpp = next?.opponentId ? teamById(league, next.opponentId) : undefined;
  return (
    <div className="page home-page">
      <div className="card dash">
        <div className="dash-team">
          <TeamBadge team={managedTeam} size={40} />
          <div>
            <div className="dash-name">{managedTeam.name}</div>
            <div className="dash-sub">
              {LEAGUE_LABEL[managedTeam.league]} · {DIVISION_LABEL[managedTeam.division]} ·{' '}
              {managedTeam.ballpark}
            </div>
          </div>
        </div>
        {next && nextOpp && (
          <button className="btn primary next-game" onClick={() => onPlay(next)}>
            ▶ Gioca giornata 1 {next.home ? 'vs' : '@'} {nextOpp.abbrev}
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

      <CalSection
        title="Prestagione"
        hint={`${schedule.preseason.length} amichevoli · usi futuri: draft / trasferimenti`}
        games={schedule.preseason}
        league={league}
        activeGameId={activeGameId}
        onPlay={onPlay}
      />
      <CalSection
        title="Stagione regolare"
        hint={`${schedule.regular.length} giornate · clicca una gara per giocarla`}
        games={schedule.regular}
        league={league}
        activeGameId={activeGameId}
        onPlay={onPlay}
      />
      <CalSection
        title="Playoff"
        hint="date potenziali · avversari da determinare"
        games={schedule.playoff}
        league={league}
        activeGameId={activeGameId}
        onPlay={onPlay}
      />
    </div>
  );
}

function StandingsPage({ league, managedId }: { league: Team[]; managedId: string }) {
  const groups = byDivision(league);
  return (
    <div className="page standings-page">
      <div className="page-note">
        Record a 0–0: si popoleranno quando la stagione verra' giocata (motore di
        stagione, Fase 4). La struttura di lega e division e' quella reale.
      </div>
      <div className="standings-grid">
        {groups.map((grp) => (
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
                {grp.teams.map((t) => (
                  <tr key={t.id} className={t.id === managedId ? 'me' : undefined}>
                    <td className="l">
                      <TeamBadge team={t} size={18} /> {t.abbrev}{' '}
                      <span className="tname">{t.name}</span>
                    </td>
                    <td>0</td>
                    <td>0</td>
                    <td>—</td>
                    <td>—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardPage({ league }: { league: Team[] }) {
  return (
    <div className="page">
      <div className="card page-stub">
        <div className="card-title">Leaderboard — {league.length} squadre</div>
        <p>
          Classifiche giocatori della stagione MLB, con linguette <b>Batting</b> (AVG, HR,
          RBI, OBP, SLG…) e <b>Pitching</b> (ERA, W, K, WHIP, SV…), ordinabili per colonna.
        </p>
        <p className="muted">
          In arrivo nel passo dedicato: ora la lega e i giocatori esistono gia'; le colonne
          si popoleranno con una linea-stat attesa derivata dai rating (e coi numeri reali
          quando la stagione verra' giocata).
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
