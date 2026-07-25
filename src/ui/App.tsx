import { useEffect, useReducer, useRef, useState } from 'react';
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
import { ratingsAtPosition, activePos, computeSwap } from '../engine/positions';
import type { Alignment } from '../engine/positions';
import { teamStrength } from '../engine/strength';
import { formatIp } from '../engine/boxscore';
import { generateMatchup } from '../data/generator';
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
import { Diamond } from './Diamond';
import {
  batterStatLine,
  pitcherStatLine,
  STATS_MODE_SHORT,
  STATS_MODE_TITLE,
} from './statlines';
import type { StatItem, StatsMode } from './statlines';

type View = 'game' | 'roster';
type Side = 'away' | 'home';

export function App() {
  const [teamSeed, setTeamSeed] = useState<number>(() => newRandomSeed());
  const [gameNo, setGameNo] = useState(1);
  const [controlled, setControlled] = useState<Side>('home');
  const [view, setView] = useState<View>('game');
  const [statsMode, setStatsMode] = useState<StatsMode>('game');
  const [recapOpen, setRecapOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [, forceTick] = useReducer((x) => x + 1, 0);
  // Schieramenti difensivi modificabili nella scheda "Rose" (id -> ruolo attivo).
  // Strumento di editing del roster; azzerati quando cambiano le squadre.
  const [alignAway, setAlignAway] = useState<Alignment>({});
  const [alignHome, setAlignHome] = useState<Alignment>({});

  // La partita interattiva e' mutabile e vive tra i render: la ricreo solo
  // quando cambiano squadre, numero di gara o squadra gestita.
  const key = `${teamSeed}|${gameNo}|${controlled}`;
  const ref = useRef<{ key: string; teams: { away: Team; home: Team }; game: LiveGame } | null>(
    null,
  );
  if (!ref.current || ref.current.key !== key) {
    const teams = generateMatchup(teamSeed);
    ref.current = {
      key,
      teams,
      game: createLiveGame(teams.away, teams.home, gameSeed(teamSeed, gameNo), controlled),
    };
  }
  const live = ref.current.game;
  const teams = ref.current.teams;
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

  const act = (fn: (g: LiveGame) => void) => {
    fn(live);
    // Se ora tocca all'umano battere, la CPU in difesa gestisce il suo lanciatore.
    if (live.status === 'live' && situation(live).controlledBatting) autoManageDefense(live);
    forceTick();
  };

  const newTeams = () => {
    setTeamSeed(newRandomSeed());
    setGameNo(1);
    setAlignAway({});
    setAlignHome({});
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
          <span className="phase">Fase 1</span>
        </div>

        <div className="hdr-manage">
          <span className="manage-label">Gestisci</span>
          <div className="seg">
            {(['away', 'home'] as Side[]).map((s) => (
              <button
                key={s}
                className={`seg-btn${controlled === s ? ' active' : ''}`}
                onClick={() => setControlled(s)}
                title="Cambiare squadra riavvia questa gara"
              >
                {(s === 'away' ? teams.away : teams.home).abbrev}
                <span className="seg-sub">{s === 'away' ? 'ospite' : 'casa'}</span>
              </button>
            ))}
          </div>
        </div>

        <nav className="tabs inline">
          <button className={view === 'game' ? 'tab active' : 'tab'} onClick={() => setView('game')}>
            Partita
          </button>
          <button
            className={view === 'roster' ? 'tab active' : 'tab'}
            onClick={() => setView('roster')}
          >
            Rose
          </button>
        </nav>

        <div className="actions">
          {view === 'game' && (
            <button
              className={calOpen ? 'btn active' : 'btn'}
              onClick={() => setCalOpen((o) => !o)}
              title="Calibra i marker del campo sulla foto-stadio"
            >
              🎯 Calibra campo
            </button>
          )}
          <button className="btn" onClick={() => setRecapOpen(true)}>
            Recap partita
          </button>
          <button className="btn" onClick={newTeams}>
            Nuove squadre
          </button>
          {final ? (
            <button className="btn primary" onClick={() => setGameNo((g) => g + 1)}>
              Nuova partita ▸
            </button>
          ) : (
            <button className="btn" onClick={() => act((g) => quickSim(g))}>
              Salta a fine ⏩
            </button>
          )}
        </div>
      </header>

      {view === 'game' ? (
        <div className="game-screen">
          <StatBar
            result={result}
            sit={sit}
            statsMode={statsMode}
            setStatsMode={setStatsMode}
          />

          <div className="gamefield">
            <Diamond home={result.home} away={result.away} background bases={sit.bases} cal={cal} />

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
                  onNew={() => setGameNo((g) => g + 1)}
                  onRecap={() => setRecapOpen(true)}
                />
              ) : (
                <ActionBar live={live} sit={sit} act={act} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="roster-view">
          <div className="grid2">
            <RosterRatings
              team={teams.away}
              alignment={alignAway}
              onSwap={(id, pos) => {
                const next = computeSwap(teams.away, alignAway, id, pos);
                if (next) setAlignAway(next);
              }}
            />
            <RosterRatings
              team={teams.home}
              alignment={alignHome}
              onSwap={(id, pos) => {
                const next = computeSwap(teams.home, alignHome, id, pos);
                if (next) setAlignHome(next);
              }}
            />
          </div>
        </div>
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
      <div className="cal-group">Campo (perno = casa base)</div>
      {CAL_FIELD_KEYS.map(row)}
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

function LineupRow({
  b,
  pos,
  target,
  canSwitch,
  onSwitch,
}: {
  b: Batter;
  pos: Position;
  target?: Position;
  canSwitch: boolean;
  onSwitch: () => void;
}) {
  const moved = pos !== b.position;
  const r = ratingsAtPosition(b, pos);
  const title = !target
    ? undefined
    : !canSwitch
      ? `Scambio con ${target} non disponibile (nessun compagno idoneo)`
      : moved
        ? 'Torna al ruolo naturale'
        : `Schiera come ${target}`;
  return (
    <tr className={moved ? 'moved' : undefined}>
      <td className="l">
        <span className={moved ? 'pos moved' : 'pos'}>{pos}</span> {b.name}
        {target && (
          <button className="posbtn" title={title} disabled={!canSwitch} onClick={onSwitch}>
            ⇄ {target}
          </button>
        )}
      </td>
      <td>{b.age}</td>
      <Rating v={r.contact} />
      <Rating v={r.power} />
      <Rating v={r.eye} />
      <Rating v={r.speed} />
      <Rating v={r.fielding} />
      <Rating v={r.arm} />
      <td className="ovr">{stars(batterOverall(r))}</td>
    </tr>
  );
}

function RosterRatings({
  team,
  alignment,
  onSwap,
}: {
  team: Team;
  alignment: Alignment;
  onSwap: (playerId: string, targetPos: Position) => void;
}) {
  const rotation = team.rotation.slice(0, 3);
  return (
    <div className="card">
      <div className="card-title" style={{ borderColor: team.primaryColor }}>
        <TeamBadge team={team} size={26} /> {team.name}
      </div>
      <table className="ratings">
        <thead>
          <tr>
            <th className="l">Lineup</th>
            <th>Età</th>
            <th title="Contatto">CON</th>
            <th title="Potenza">POT</th>
            <th title="Occhio">OCC</th>
            <th title="Velocità">VEL</th>
            <th title="Difesa">DIF</th>
            <th title="Braccio">BRA</th>
            <th title="Overall">OVR</th>
          </tr>
        </thead>
        <tbody>
          {team.lineup.map((b) => {
            const pos = activePos(b, alignment);
            const moved = pos !== b.position;
            const target = moved ? b.position : b.secondaryPosition;
            const canSwitch = !!target && computeSwap(team, alignment, b.id, target) !== null;
            return (
              <LineupRow
                key={b.id}
                b={b}
                pos={pos}
                target={target}
                canSwitch={canSwitch}
                onSwitch={() => target && onSwap(b.id, target)}
              />
            );
          })}
        </tbody>
      </table>

      <table className="ratings">
        <thead>
          <tr>
            <th className="l">Lanciatori</th>
            <th>Età</th>
            <th title="Dominio">DOM</th>
            <th title="Controllo">CTR</th>
            <th title="Movimento">MOV</th>
            <th title="Palla a terra">PAT</th>
            <th title="Resistenza">RES</th>
            <th title="Difesa">DIF</th>
            <th title="Overall">OVR</th>
          </tr>
        </thead>
        <tbody>
          {rotation.map((p) => (
            <tr key={p.id}>
              <td className="l">
                <span className="pos">{p.role}</span> {p.name}
              </td>
              <td>{p.age}</td>
              <Rating v={p.ratings.stuff} />
              <Rating v={p.ratings.control} />
              <Rating v={p.ratings.movement} />
              <Rating v={p.ratings.groundball} />
              <Rating v={p.ratings.stamina} />
              <Rating v={p.ratings.fielding} />
              <td className="ovr">{stars(pitcherOverall(p.ratings))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
