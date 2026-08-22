import type { GameResult, TeamGameStats } from '../engine/game';
import type { Team } from '../engine/types';
import { batterStatLine, pitcherStatLine } from './statlines';
import type { StatsMode } from './statlines';
import type { GameStatCtx } from './stat-context';
import { rosterBatters, rosterPitchers } from '../engine/arrangement';
import { TeamBadge } from './widgets';
import { upperLast } from './format';

// ---------------------------------------------------------------------------
// Line score (punti per inning) e box score (battitori/lanciatori) di una gara.
// Estratti da App.tsx. Puri: leggono GameResult/TeamGameStats.
// ---------------------------------------------------------------------------

export function LineScore({ result }: { result: GameResult }) {
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

export function BoxScore({
  team,
  stats,
  mode,
  ctx,
}: {
  team: Team;
  stats: TeamGameStats;
  mode: StatsMode;
  // Contesto per le stat di stagione/precedente (assente = solo Partita).
  ctx?: GameStatCtx;
}) {
  // Dall'INTERA rosa (titolari + panca + riserve), non solo dai titolari: così i
  // SOSTITUTI entrati in partita (pinch-hit/run, rilievi di profondità) trovano la
  // loro riga di stagione. Prima, non trovandoli, la riga cadeva nel ramo "Partita"
  // (conteggi AB/R/H…) mostrata sotto l'header di stagione → colonne disallineate.
  const batById = new Map(rosterBatters(team).map((b) => [b.id, b]));
  const pitById = new Map(rosterPitchers(team).map((p) => [p.id, p]));

  const batRows = stats.batting.map((l) => {
    const b = batById.get(l.id);
    return {
      id: l.id,
      label: l.position,
      name: l.name,
      items: batterStatLine(mode, l, b && ctx?.batLine(mode, b)),
    };
  });
  const pitRows = stats.pitching.map((l) => {
    const p = pitById.get(l.id);
    return {
      id: l.id,
      name: l.name,
      dec: l.dec,
      items: pitcherStatLine(mode, l, p && ctx?.pitLine(mode, p)),
    };
  });
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

export function decLabel(d: 'W' | 'L' | 'SV'): string {
  return d === 'W' ? 'V' : d === 'L' ? 'P' : 'SV';
}
