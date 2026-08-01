import type { Team } from '../engine/types';
import type { SeasonState } from '../data/season';
import { recordOf, winPct, gamesBehind, sortByRecord } from '../data/season';
import { byDivision, LEAGUE_LABEL, DIVISION_LABEL, teamById } from '../data/league';
import type { PlayoffState, Series, Round, NextGame } from '../data/playoff';
import { seriesByRound, winsNeeded, managedEliminated } from '../data/playoff';
import { pct3 } from './statlines';
import { TeamBadge } from './widgets';

export function StandingsPage({
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

export const ROUND_LABEL: Record<Round, string> = {
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

export function PlayoffPage({
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
