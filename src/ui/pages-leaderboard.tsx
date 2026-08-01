import { useState, useMemo } from 'react';
import type { Team, Batter, Pitcher } from '../engine/types';
import type { SeasonState, SeasonBat, SeasonPit } from '../data/season';
import { addBat, addPit } from '../data/season';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import { seasonBatLine, seasonPitLine, pct3, ipFmt } from './statlines';
import type { BatLine, PitLine } from './statlines';
import { PlayerLink, isBatter } from './player-modal';
import { TeamBadge } from './widgets';
import { rosterPitchers } from '../engine/arrangement';

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

export function LeaderboardPage({
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
