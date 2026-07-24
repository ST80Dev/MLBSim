import { useReducer, useRef, useState } from 'react';
import type { Batter, Pitcher, Position, Team } from '../engine/types';
import type { GameResult, TeamGameStats, PlayEvent } from '../engine/game';
import type { LiveGame, LiveSituation } from '../engine/game';
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
import type { TeamStrength } from '../engine/strength';
import { formatIp, formatAvg } from '../engine/boxscore';
import { generateMatchup } from '../data/generator';
import { gameSeed, newRandomSeed, ratingColor, stars, teamAccent } from './format';
import { Diamond } from './Diamond';

type View = 'game' | 'roster';
type Side = 'away' | 'home';

export function App() {
  const [teamSeed, setTeamSeed] = useState<number>(() => newRandomSeed());
  const [gameNo, setGameNo] = useState(1);
  const [controlled, setControlled] = useState<Side>('home');
  const [view, setView] = useState<View>('game');
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
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⚾</span> MLBSim
          <span className="phase">Fase 1 · turno interattivo</span>
        </div>
        <div className="actions">
          <button className="btn" onClick={newTeams}>
            Nuove squadre
          </button>
          {final ? (
            <button className="btn primary" onClick={() => setGameNo((g) => g + 1)}>
              Nuova partita ▸
            </button>
          ) : (
            <button className="btn" onClick={() => act((g) => quickSim(g))}>
              Salta a fine partita ⏩
            </button>
          )}
        </div>
      </header>

      <div className="managebar">
        <span className="manage-label">Gestisci</span>
        <div className="seg">
          {(['away', 'home'] as Side[]).map((s) => (
            <button
              key={s}
              className={`seg-btn${controlled === s ? ' active' : ''}`}
              onClick={() => setControlled(s)}
              title="Cambiare squadra riavvia questa gara"
            >
              {(s === 'away' ? ref.current!.teams.away : ref.current!.teams.home).abbrev}
              <span className="seg-sub">{s === 'away' ? 'ospite' : 'casa'}</span>
            </button>
          ))}
        </div>
        <span className="manage-hint">
          decidi ai tuoi turni · la CPU guida l'altra squadra
        </span>
      </div>

      <Scoreboard result={result} decided={final} />

      <nav className="tabs">
        <button className={view === 'game' ? 'tab active' : 'tab'} onClick={() => setView('game')}>
          Partita
        </button>
        <button
          className={view === 'roster' ? 'tab active' : 'tab'}
          onClick={() => setView('roster')}
        >
          Rose &amp; caratteristiche
        </button>
        <span className="seed">
          seed squadre {teamSeed} · gara #{gameNo}
        </span>
      </nav>

      {view === 'game' ? (
        <div className="cockpit">
          <LineScore result={result} />

          <div className="ck-main">
            <LineupSide side="away" team={result.away} stats={result.awayStats} sit={sit} />
            <div className="ck-center">
              <Diamond home={result.home} away={result.away} />
              {final ? (
                <FinalBanner result={result} controlled={controlled} />
              ) : (
                <AtBatPanel sit={sit} />
              )}
            </div>
            <LineupSide side="home" team={result.home} stats={result.homeStats} sit={sit} />
          </div>

          <div className="ck-bottom">
            <div className="ck-actions">
              {final ? (
                <button className="btn primary big" onClick={() => setGameNo((g) => g + 1)}>
                  Nuova partita ▸
                </button>
              ) : (
                <ActionBar live={live} sit={sit} act={act} />
              )}
            </div>
            <PlayByPlay result={result} />
          </div>

          <StrengthPanel away={result.away} home={result.home} />
          <div className="grid2">
            <BoxScore team={result.away} stats={result.awayStats} />
            <BoxScore team={result.home} stats={result.homeStats} />
          </div>
        </div>
      ) : (
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
      )}

      <footer className="foot">
        Motore probabilistico Log5 · caratteristiche scala 20–80 · rubata, bunt,
        base intenzionale e cambio lanciatore attivi in Fase 1.
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pannello di controllo interattivo
// ---------------------------------------------------------------------------

function AtBatPanel({ sit }: { sit: LiveSituation }) {
  const arrow = sit.half === 'top' ? '▲' : '▼';
  const halfLabel = sit.half === 'top' ? 'attacco' : 'chiusura';
  return (
    <div className="card atbat">
      <div className="situation">
        <div className="inning-badge">
          {arrow} {sit.inning}°
          <span className="half">{halfLabel}</span>
        </div>
        <BaseDiamond bases={sit.bases} />
        <OutsDots outs={sit.outs} />
      </div>
      <div className="matchup-mini">
        <MiniPlayer
          label={`Al piatto · ${sit.battingTeam.abbrev}`}
          player={sit.batter}
          ratings={[
            ['CON', sit.batter.ratings.contact],
            ['POT', sit.batter.ratings.power],
            ['OCC', sit.batter.ratings.eye],
            ['VEL', sit.batter.ratings.speed],
          ]}
        />
        <div className="vs">vs</div>
        <MiniPlayer
          label={`In pedana · ${sit.fieldingTeam.abbrev}`}
          player={sit.pitcher}
          ratings={[
            ['DOM', sit.pitcher.ratings.stuff],
            ['CTR', sit.pitcher.ratings.control],
            ['MOV', sit.pitcher.ratings.movement],
            ['DIF', sit.pitcher.ratings.fielding],
          ]}
        />
      </div>
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

function MiniPlayer({
  label,
  player,
  ratings,
}: {
  label: string;
  player: Batter | Pitcher;
  ratings: [string, number][];
}) {
  return (
    <div className="mini">
      <div className="mini-label">{label}</div>
      <div className="mini-name">{player.name}</div>
      <div className="mini-rats">
        {ratings.map(([k, v]) => (
          <span key={k} className="mini-rat">
            <span className="mini-rat-k">{k}</span>
            <span className="mini-rat-v" style={{ background: ratingColor(v) }}>
              {v}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FinalBanner({ result, controlled }: { result: GameResult; controlled: Side }) {
  const youWon = result.winner === controlled;
  const winTeam = result.winner === 'away' ? result.away : result.home;
  return (
    <div className={`card final-banner ${youWon ? 'won' : 'lost'}`}>
      <div className="final-title">
        {youWon ? '🏆 Hai vinto!' : 'Sconfitta'} — {winTeam.name} vince{' '}
        {result.final.away}–{result.final.home}
        {result.innings > 9 && <span className="final-extra"> · {result.innings} inning</span>}
      </div>
      <div className="final-sub">Guarda il tabellino e la cronaca qui sotto.</div>
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

function StrengthPanel({ away, home }: { away: Team; home: Team }) {
  const rows: { team: Team; s: TeamStrength }[] = [
    { team: away, s: teamStrength(away) },
    { team: home, s: teamStrength(home) },
  ];
  const cols: { key: keyof TeamStrength; label: string; title: string }[] = [
    { key: 'total', label: 'TOT', title: 'Forza totale' },
    { key: 'attack', label: 'ATT', title: 'Attacco' },
    { key: 'defense', label: 'DIF', title: 'Difesa' },
    { key: 'pitching', label: 'LAN', title: 'Lancio' },
  ];
  return (
    <div className="card strength-card">
      <div className="card-title">Forza squadre</div>
      <table className="strength">
        <thead>
          <tr>
            <th className="l">Squadra</th>
            {cols.map((c) => (
              <th key={c.key} title={c.title}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ team, s }) => (
            <tr key={team.id}>
              <td className="l">
                <span className="pill" style={{ background: team.primaryColor }}>
                  {team.abbrev}
                </span>{' '}
                {team.name}
              </td>
              {cols.map((c) => (
                <td key={c.key}>
                  <span
                    className={c.key === 'total' ? 'str-val str-total' : 'str-val'}
                    style={{ background: strengthColor(s[c.key]) }}
                  >
                    {s[c.key]}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

function Scoreboard({ result, decided }: { result: GameResult; decided: boolean }) {
  const { away, home, final, winner } = result;
  return (
    <section className="scoreboard">
      <TeamScore
        team={away}
        score={final.away}
        win={decided && winner === 'away'}
        align="right"
      />
      <div className="mid">
        <div className="at">@</div>
        <div className="ballpark">🏟 {home.ballpark}</div>
        {result.innings > 9 && <div className="extra">{result.innings} inning</div>}
      </div>
      <TeamScore
        team={home}
        score={final.home}
        win={decided && winner === 'home'}
        align="left"
      />
    </section>
  );
}

function TeamScore({
  team,
  score,
  win,
  align,
}: {
  team: Team;
  score: number;
  win: boolean;
  align: 'left' | 'right';
}) {
  const accent = teamAccent(team.name);
  return (
    <div
      className={`teamscore ${align}${win ? ' win' : ''}`}
      style={{ ['--accent' as string]: team.primaryColor || accent }}
    >
      {align === 'left' && <TeamBadge team={team} />}
      <div className="tinfo">
        <div className="tname">{team.name}</div>
        <div className="tsub">
          {team.league} {team.division} · forza {teamStrength(team).total}
        </div>
      </div>
      <div className="runs">{score}</div>
      {align === 'right' && <TeamBadge team={team} />}
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

function BoxScore({ team, stats }: { team: Team; stats: TeamGameStats }) {
  const totals = stats.batting.reduce(
    (a, l) => ({
      ab: a.ab + l.ab,
      r: a.r + l.r,
      h: a.h + l.h,
      rbi: a.rbi + l.rbi,
      bb: a.bb + l.bb,
      so: a.so + l.so,
    }),
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, so: 0 },
  );
  const teamSb = stats.batting.reduce((a, l) => a + l.sb, 0);
  return (
    <div className="card">
      <div className="card-title" style={{ borderColor: team.primaryColor }}>
        <TeamBadge team={team} size={26} /> {team.name}
      </div>
      <table className="box">
        <thead>
          <tr>
            <th className="l">Battitore</th>
            <th>AB</th>
            <th>R</th>
            <th>H</th>
            <th>RBI</th>
            <th>BB</th>
            <th>SO</th>
            <th>SB</th>
            <th>AVG</th>
          </tr>
        </thead>
        <tbody>
          {stats.batting.map((l) => (
            <tr key={l.id}>
              <td className="l">
                <span className="pos">{l.position}</span> {l.name}
              </td>
              <td>{l.ab}</td>
              <td>{l.r}</td>
              <td>{l.h}</td>
              <td>{l.rbi}</td>
              <td>{l.bb}</td>
              <td>{l.so}</td>
              <td>{l.sb || ''}</td>
              <td>{formatAvg(l.ab ? l.h / l.ab : 0)}</td>
            </tr>
          ))}
          <tr className="totrow">
            <td className="l">Totali</td>
            <td>{totals.ab}</td>
            <td>{totals.r}</td>
            <td>{totals.h}</td>
            <td>{totals.rbi}</td>
            <td>{totals.bb}</td>
            <td>{totals.so}</td>
            <td>{teamSb || ''}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <table className="box pit">
        <thead>
          <tr>
            <th className="l">Lanciatore</th>
            <th>IP</th>
            <th>H</th>
            <th>R</th>
            <th>ER</th>
            <th>BB</th>
            <th>SO</th>
            <th>HR</th>
            <th>Dec</th>
          </tr>
        </thead>
        <tbody>
          {stats.pitching.map((p) => (
            <tr key={p.id}>
              <td className="l">{p.name}</td>
              <td>{formatIp(p.outs)}</td>
              <td>{p.h}</td>
              <td>{p.r}</td>
              <td>{p.er}</td>
              <td>{p.bb}</td>
              <td>{p.so}</td>
              <td>{p.hr}</td>
              <td>{p.dec ? <span className={`dec dec-${p.dec}`}>{decLabel(p.dec)}</span> : ''}</td>
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

function PlayByPlay({ result }: { result: GameResult }) {
  const groups: { key: string; header: string; events: PlayEvent[] }[] = [];
  let cur: { key: string; header: string; events: PlayEvent[] } | null = null;
  for (const ev of result.play) {
    const key = `${ev.inning}-${ev.half}`;
    if (!cur || cur.key !== key) {
      const batting = ev.half === 'top' ? result.away : result.home;
      const arrow = ev.half === 'top' ? '▲' : '▼';
      cur = { key, header: `${ev.inning}° ${arrow} attacco ${batting.name}`, events: [] };
      groups.push(cur);
    }
    cur.events.push(ev);
  }

  return (
    <div className="card pbp-card">
      <div className="card-title">Cronaca</div>
      <div className="pbp">
        {groups.length === 0 && <div className="pbp-empty">La partita sta per cominciare…</div>}
        {groups.map((g) => (
          <div key={g.key} className="pbp-inning">
            <div className="pbp-head">
              {g.header}
              <span className="pbp-score">
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
