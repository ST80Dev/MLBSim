import { useMemo, useState } from 'react';
import type { Team, Batter, Position } from '../engine/types';
import type { GameResult, TeamGameStats, PlayEvent } from '../engine/game';
import { simulateGame } from '../engine/game';
import { batterOverall, pitcherOverall } from '../engine/ratings';
import { ratingsAtPosition } from '../engine/positions';
import { teamStrength } from '../engine/strength';
import type { TeamStrength } from '../engine/strength';
import { formatIp, formatAvg } from '../engine/boxscore';
import { generateMatchup } from '../data/generator';
import { gameSeed, newRandomSeed, ratingColor, stars, teamAccent } from './format';
import { Diamond } from './Diamond';

type View = 'game' | 'roster';

export function App() {
  const [teamSeed, setTeamSeed] = useState<number>(() => newRandomSeed());
  const [gameNo, setGameNo] = useState(1);
  const [view, setView] = useState<View>('game');

  const teams = useMemo(() => generateMatchup(teamSeed), [teamSeed]);
  const result = useMemo(
    () => simulateGame(teams.away, teams.home, gameSeed(teamSeed, gameNo)),
    [teams, teamSeed, gameNo],
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⚾</span> MLBSim
          <span className="phase">Fase 0 · motore di simulazione</span>
        </div>
        <div className="actions">
          <button
            className="btn"
            onClick={() => {
              setTeamSeed(newRandomSeed());
              setGameNo(1);
            }}
          >
            Nuove squadre
          </button>
          <button className="btn primary" onClick={() => setGameNo((g) => g + 1)}>
            Prossima partita ▸
          </button>
        </div>
      </header>

      <Scoreboard result={result} />

      <nav className="tabs">
        <button className={view === 'game' ? 'tab active' : 'tab'} onClick={() => setView('game')}>
          Partita
        </button>
        <button className={view === 'roster' ? 'tab active' : 'tab'} onClick={() => setView('roster')}>
          Rose &amp; caratteristiche
        </button>
        <span className="seed">seed squadre {teamSeed} · gara #{gameNo}</span>
      </nav>

      {view === 'game' ? (
        <>
          <Diamond home={result.home} away={result.away} />
          <StrengthPanel away={result.away} home={result.home} />
          <LineScore result={result} />
          <div className="grid2">
            <BoxScore team={result.away} stats={result.awayStats} />
            <BoxScore team={result.home} stats={result.homeStats} />
          </div>
          <PlayByPlay result={result} />
        </>
      ) : (
        <div className="grid2">
          <RosterRatings team={result.away} />
          <RosterRatings team={result.home} />
        </div>
      )}

      <footer className="foot">
        Motore probabilistico Log5 · caratteristiche scala 20–80 · loghi originali
        (asset reali aggiungibili in locale).
      </footer>
    </div>
  );
}

function TeamBadge({ team, size = 46 }: { team: Team; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={team.name}>
      <rect x="5" y="5" width="90" height="90" rx="22" fill={team.primaryColor} stroke={team.secondaryColor} strokeWidth="6" />
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

function Scoreboard({ result }: { result: GameResult }) {
  const { away, home, final, winner } = result;
  return (
    <section className="scoreboard">
      <TeamScore team={away} score={final.away} win={winner === 'away'} align="right" />
      <div className="mid">
        <div className="at">@</div>
        <div className="ballpark">🏟 {home.ballpark}</div>
        {result.innings > 9 && <div className="extra">{result.innings} inning</div>}
      </div>
      <TeamScore team={home} score={final.home} win={winner === 'home'} align="left" />
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
        return <td key={i}>{v === undefined ? 'X' : v}</td>;
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

function LineupRow({ b }: { b: Batter }) {
  const [pos, setPos] = useState<Position>(b.position);
  const moved = pos !== b.position;
  const r = ratingsAtPosition(b, pos);
  // Etichetta del pulsante = il ruolo verso cui si passerebbe cliccando.
  const target = moved ? b.position : b.secondaryPosition;
  return (
    <tr className={moved ? 'moved' : undefined}>
      <td className="l">
        <span className={moved ? 'pos moved' : 'pos'}>{pos}</span> {b.name}
        {b.secondaryPosition && (
          <button
            className="posbtn"
            title={moved ? 'Torna al ruolo naturale' : `Prova come ${b.secondaryPosition}`}
            onClick={() => setPos(moved ? b.position : (b.secondaryPosition as Position))}
          >
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

function RosterRatings({ team }: { team: Team }) {
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
          {team.lineup.map((b) => (
            <LineupRow key={b.id} b={b} />
          ))}
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
