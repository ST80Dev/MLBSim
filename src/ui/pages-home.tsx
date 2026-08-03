import { useState } from 'react';
import type { Team, Batter, Pitcher } from '../engine/types';
import type { SeasonState, SeasonBat, SeasonPit } from '../data/season';
import { recordOf, sortByRecord, gamesBehind } from '../data/season';
import type { ScheduleGame, Schedule } from '../data/schedule';
import { teamById, divisionRivals, LEAGUE_LABEL, DIVISION_LABEL } from '../data/league';
import { rosterBatters, rosterPitchers } from '../engine/arrangement';
import { withRotationStarter, rotationPhase } from '../data/generator';
import { pitcherOverall } from '../engine/ratings';
import { ratingColor } from './format';
import { TeamBadge } from './widgets';
import { PlayerLink, isBatter } from './player-modal';
import type { PlayoffState, NextGame } from '../data/playoff';
import { ROUND_LABEL } from './pages-standings';

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

export function HomePage({
  league,
  managedTeam,
  schedule,
  season,
  playoff,
  nextPlayoffGame,
  onPlayoff,
  onBracket,
  onPlay,
  onOverview,
  onNewLeague,
}: {
  league: Team[];
  managedTeam: Team;
  schedule: Schedule;
  season: SeasonState;
  playoff: PlayoffState | null;
  nextPlayoffGame: NextGame | null;
  onPlayoff: () => void;
  onBracket: () => void;
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
        {playoff && (() => {
          const champ = playoff.championId ? teamById(league, playoff.championId) : undefined;
          const oppTeam = nextPlayoffGame ? teamById(league, nextPlayoffGame.opponentId) : undefined;
          if (champ) {
            const iWon = champ.id === managedTeam.id;
            return (
              <button className="btn primary next-game" onClick={onBracket}>
                🏆 {iWon ? 'Campioni!' : `Campione: ${champ.abbrev}`} — vedi il tabellone
              </button>
            );
          }
          if (nextPlayoffGame && oppTeam) {
            return (
              <button className="btn primary next-game" onClick={onPlayoff}>
                🏆 {ROUND_LABEL[nextPlayoffGame.round]} Gara {nextPlayoffGame.gameNo + 1}{' '}
                {nextPlayoffGame.home ? 'vs' : '@'} {oppTeam.abbrev}
              </button>
            );
          }
          return (
            <button className="btn primary next-game" onClick={onBracket}>
              🏆 Postseason — vedi il tabellone
            </button>
          );
        })()}
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
                season={season}
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
  season,
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
  season: SeasonState;
  onPlay: (g: ScheduleGame) => void;
}) {
  const mySP = managedTeam.rotation[i % managedTeam.rotation.length];
  // Partente avversario: STESSA formula della gara reale (App.tsx `teams`), cioè
  // rotazione posizionale per giorno + lo sfasamento proprio della squadra
  // (`rotationPhase`). Senza la fase il card mostrava un partente e ne giocava un
  // altro (`i` == giorno di stagione per il card corrente).
  const oppSP = withRotationStarter(opp, i + rotationPhase(opp)).rotation[0];
  const won = result ? result.us > result.them : false;
  // OVR + record di stagione (W-L) del partente probabile, accanto al nome.
  const spMeta = (sp?: Pitcher) => {
    if (!sp) return null;
    const ovr = pitcherOverall(sp.ratings);
    const rec = season.pit[sp.id];
    return (
      <span className="mc-sp-meta">
        <b className="mc-sp-ovr" style={{ background: ratingColor(ovr) }}>{ovr}</b>
        <span className="mc-sp-rec">{rec ? `${rec.w}-${rec.l}` : '0-0'}</span>
      </span>
    );
  };
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
      <div className="mc-sp" title="Lanciatori partenti probabili (OVR · record di stagione)">
        <span className="mc-spn">
          <span className="mc-sp-name">{mySP?.name ?? '—'}</span>
          {spMeta(mySP)}
        </span>
        <span className="mc-vs2">SP</span>
        <span className="mc-spn">
          <span className="mc-sp-name">{oppSP?.name ?? '—'}</span>
          {spMeta(oppSP)}
        </span>
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
