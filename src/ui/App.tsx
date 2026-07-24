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
import { formatIp, formatAvg } from '../engine/boxscore';
import { generateMatchup } from '../data/generator';
import { gameSeed, newRandomSeed, ratingColor, stars } from './format';
import { Diamond } from './Diamond';
import {
  batterStatLine,
  pitcherStatLine,
  STATS_MODE_LABEL,
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
  const [cronacaOpen, setCronacaOpen] = useState(true);
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
  const result = toGameResult(live);
  const sit = situation(live);
  const final = live.status === 'final';

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
            <Diamond home={result.home} away={result.away} background bases={sit.bases} />

            <CronacaOverlay
              result={result}
              open={cronacaOpen}
              onToggle={() => setCronacaOpen((o) => !o)}
            />

            <div className="lineup-corner left">
              <LineupSide side="away" team={result.away} stats={result.awayStats} sit={sit} />
            </div>
            <div className="lineup-corner right">
              <LineupSide side="home" team={result.home} stats={result.homeStats} sit={sit} />
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
        win={decided && sit.winner === 'away'}
      />

      <div className="statbar-center">
        <div className="sb-situation">
          <span className="sb-inning">
            {arrow} {sit.inning}° <span className="sb-half">{halfLabel}</span>
          </span>
          <BaseDiamond bases={sit.bases} />
          <OutsDots outs={sit.outs} />
        </div>
        <LineScore result={result} />
        <StatsToggle mode={statsMode} setMode={setStatsMode} />
      </div>

      <TeamStatSide
        side="home"
        team={result.home}
        score={result.final.home}
        involved={involvedFor(result, sit, 'home')}
        mode={statsMode}
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
  win,
}: {
  side: Side;
  team: Team;
  score: number;
  involved: Involved;
  mode: StatsMode;
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
          {involved.kind === 'batter' ? 'AL PIATTO' : 'IN PEDANA'}
        </span>
        <span className="ts-pname">{player.name}</span>
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

function StatsToggle({ mode, setMode }: { mode: StatsMode; setMode: (m: StatsMode) => void }) {
  const modes: StatsMode[] = ['game', 'season', 'last'];
  const title: Record<StatsMode, string> = {
    game: 'Statistiche di questa partita',
    season: 'Proiezione di stagione dalle doti',
    last: 'Disponibile con lo storico (Fase 4)',
  };
  return (
    <div className="stats-toggle" role="group" aria-label="Modalità statistiche">
      {modes.map((m) => (
        <button
          key={m}
          className={`st-btn${mode === m ? ' active' : ''}`}
          disabled={m === 'last'}
          title={title[m]}
          onClick={() => setMode(m)}
        >
          {STATS_MODE_LABEL[m]}
        </button>
      ))}
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
    <div className="card actionbar">
      <div className="turn-tag off">Tocca a te — attacco · {sit.battingTeam.abbrev}</div>
      <div className="btn-row">
        <button className="btn primary big" onClick={() => act((g) => playOffense(g, 'swing'))}>
          Battuta
        </button>
        <button
          className="btn big"
          disabled={!sit.canBunt}
          onClick={() => act((g) => playOffense(g, 'bunt'))}
          title={sit.canBunt ? 'Bunt di sacrificio' : 'Bunt inutile con 2 out'}
        >
          Bunt
        </button>
        {sit.stealFrom.includes(1) && (
          <button className="btn big" onClick={() => act((g) => attemptSteal(g, 1))}>
            Ruba la 2ª
          </button>
        )}
        {sit.stealFrom.includes(2) && (
          <button className="btn big" onClick={() => act((g) => attemptSteal(g, 2))}>
            Ruba la 3ª
          </button>
        )}
      </div>
      <div className="hint">La rubata non consuma il turno: puoi tentarla e poi battere.</div>
    </div>
  ) : (
    <div className="card actionbar">
      <div className="turn-tag def">Tocca a te — difesa · {sit.fieldingTeam.abbrev}</div>
      <div className="btn-row">
        <button className="btn primary big" onClick={() => act((g) => playOffense(g, 'swing'))}>
          Lancia ▸
        </button>
        <button className="btn big" onClick={() => act((g) => intentionalWalk(g))}>
          Base intenzionale
        </button>
        <PitcherChange live={live} act={act} />
      </div>
      <div className="hint">La CPU decide la battuta: premi «Lancia» per risolvere.</div>
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
      <button className="btn" onClick={() => setOpen((o) => !o)}>
        Cambio lanciatore ▾
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
}: {
  team: Team;
  stats: TeamGameStats;
  side: Side;
  sit: LiveSituation;
}) {
  const isBatting = sit.offenseSide === side && sit.status === 'live';
  const currentId = isBatting ? sit.batter.id : null;
  // Lanciatore attualmente in pedana per questa squadra (ultima riga usata).
  const curP = stats.pitching[stats.pitching.length - 1];
  return (
    <div className="card lineup-side" style={{ borderTopColor: team.primaryColor }}>
      <div className="ls-head">
        <TeamBadge team={team} size={24} />
        <span className="ls-name">{team.name}</span>
        <span className={`ls-role ${side}`}>{side === 'away' ? 'ospite' : 'casa'}</span>
      </div>
      <table className="ls-table">
        <thead>
          <tr>
            <th className="l">#</th>
            <th className="l">Battitore</th>
            <th>AB</th>
            <th>H</th>
            <th>RBI</th>
            <th>BB</th>
            <th>SO</th>
            <th>AVG</th>
          </tr>
        </thead>
        <tbody>
          {stats.batting.map((l, i) => (
            <tr key={l.id} className={l.id === currentId ? 'at-bat' : undefined}>
              <td className="l num">{i + 1}</td>
              <td className="l bname">
                <span className="pos">{l.position}</span> {lastName(l.name)}
                {l.id === currentId && <span className="atbat-dot">●</span>}
              </td>
              <td>{l.ab}</td>
              <td>{l.h}</td>
              <td>{l.rbi}</td>
              <td>{l.bb}</td>
              <td>{l.so}</td>
              <td className="avg">{formatAvg(l.ab ? l.h / l.ab : 0)}</td>
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

function CronacaOverlay({
  result,
  open,
  onToggle,
}: {
  result: GameResult;
  open: boolean;
  onToggle: () => void;
}) {
  const groups = groupPlays(result);
  const last = result.play[result.play.length - 1];
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [result.play.length, open]);

  return (
    <div className={`cronaca-overlay${open ? ' open' : ' collapsed'}`}>
      <button className="cr-head" onClick={onToggle}>
        <span className="cr-title">📣 Cronaca</span>
        <span className="cr-toggle">{open ? '▾' : '▸'}</span>
      </button>
      {open ? (
        <div className="cr-body" ref={bodyRef}>
          {groups.length === 0 && <div className="cr-empty">La partita sta per cominciare…</div>}
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
      ) : (
        <div className="cr-collapsed-line">
          {last ? last.text : 'La partita sta per cominciare…'}
        </div>
      )}
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
