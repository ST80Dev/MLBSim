import { useRef, useEffect } from 'react';
import type { Team } from '../engine/types';
import type { GameResult, TeamGameStats, LiveSituation } from '../engine/game';
import { estimatedPitches, formatIp } from '../engine/boxscore';
import { disambiguateLastNames } from '../engine/names';
import type { Side } from './types';
import { batterStatLine, STATS_MODE_SHORT, STATS_MODE_TITLE } from './statlines';
import type { StatsMode } from './statlines';
import { TeamBadge, pitcherFatigue } from './widgets';
import { PlayerLink } from './player-modal';
import { decLabel } from './game-boxscore';
import { upperLast } from './format';

// ---------------------------------------------------------------------------
// Colonna lineup di partita (battitori + lanciatori usati con affaticamento),
// toggle modalità statistiche e overlay di fine gara. Estratti da App.tsx.
// ---------------------------------------------------------------------------

const STATS_MODES: StatsMode[] = ['game', 'season', 'last'];

/** Selettore modalità statistiche (Partita / Stagione / Carriera). */
export function StatsToggle({ mode, setMode }: { mode: StatsMode; setMode: (m: StatsMode) => void }) {
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

/** Overlay di fine partita (vittoria/sconfitta + azioni recap / nuova gara). */
export function FinalOverlay({
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

/** Colonna lineup di una squadra durante la gara: ordine di battuta con la
 *  BattingLine accumulata + lista dei lanciatori usati con stato d'affaticamento. */
export function LineupSide({
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
  const pitById = new Map([...team.rotation, ...team.bullpen].map((p) => [p.id, p]));
  // Ordine di battuta = i 9 titolari CORRENTI (sostituzione COMPLETA: il pinch
  // sostituito non compare più qui; le sue stat restano nel box/recap). Ogni
  // slot mostra la sua BattingLine accumulata (se già entrato).
  const lineById = new Map(stats.batting.map((l) => [l.id, l]));
  const rows = team.lineup.map((b) => {
    const line = lineById.get(b.id);
    return { b, line, items: batterStatLine(mode, line, b) };
  });
  const head = rows[0]?.items.map((i) => i.k) ?? [];
  // Cognomi disambiguati per i battitori mostrati (es. R. Alomar / S. Alomar).
  const batLabels = disambiguateLastNames(team.lineup.map((b) => b.name));
  // TUTTI i lanciatori usati da questa squadra (partente + rilievi entrati), non
  // solo quello in pedana: così il box tiene traccia dei 3/5/7 cambi.
  const lastPitIdx = stats.pitching.length - 1;
  const pitLabels = disambiguateLastNames(stats.pitching.map((p) => p.name));
  // Lista lanciatori ad altezza fissa: la teniamo scrollata sul lanciatore
  // ATTUALE (l'ultimo entrato), centrandolo, così un nuovo rilievo compare senza
  // far crescere il riquadro verso l'alto.
  const pitsRef = useRef<HTMLDivElement>(null);
  const curPitRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = pitsRef.current;
    const row = curPitRef.current;
    if (box && row) {
      box.scrollTop = Math.max(0, row.offsetTop - (box.clientHeight - row.offsetHeight) / 2);
    }
  }, [lastPitIdx]);
  return (
    <div className="card lineup-side" style={{ borderTopColor: team.primaryColor }}>
      <div className="ls-head">
        <TeamBadge team={team} size={22} />
        <span className="ls-name">{team.name}</span>
        <StatsToggle mode={mode} setMode={setMode} />
      </div>
      <div className="ls-scroll">
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
              <tr key={r.b.id} className={r.b.id === currentId ? 'at-bat' : undefined}>
                <td className="l num">{i + 1}</td>
                <td className="l bname">
                  <span className="pos">{r.b.position}</span>{' '}
                  <PlayerLink player={r.b} pos={r.b.position}>{batLabels[i]}</PlayerLink>
                  {r.b.id === currentId && <span className="atbat-dot">●</span>}
                </td>
                {r.items.map((it) => (
                  <td key={it.k}>{it.v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {stats.pitching.length > 0 && (
        <div className="ls-pits" ref={pitsRef}>
          {stats.pitching.map((pl, idx) => {
            const p = pitById.get(pl.id);
            const label = pitLabels[idx];
            const isCur = idx === lastPitIdx && sit.status === 'live';
            const pt = estimatedPitches(pl);
            const fat = p ? pitcherFatigue(p.role, p.stamina, pl.bf) : undefined;
            const stateWord =
              fat?.state === 'spent' ? 'esausto' : fat?.state === 'tiring' ? 'in calo' : 'fresco';
            return (
              <div
                className={`ls-pit${isCur ? ' cur' : ''}`}
                key={pl.id}
                ref={idx === lastPitIdx ? curPitRef : undefined}
              >
                <span className="ls-pit-tag">{idx === 0 ? 'LANC.' : '↳'}</span>
                <span className="ls-pit-name">
                  {p ? <PlayerLink player={p}>{label}</PlayerLink> : upperLast(label)}
                </span>
                <span className="ls-pit-stat">{formatIp(pl.outs)} IP</span>
                <span
                  className="ls-pit-stat"
                  style={{ color: fat?.tone }}
                  title="Lanci (stima): cresce con battitori affrontati, valide, BB e SO — rende l'affaticamento"
                >
                  {pt} PT
                </span>
                {p && (
                  <span
                    className="ls-pit-stat"
                    style={{ color: fat?.tone }}
                    title={`Battitori affrontati / Resistenza (${stateWord}). La Resistenza è la soglia oltre la quale scatta l'affaticamento (peggiora BB/valide/HR, cala negli SO); superata di ${p.role === 'SP' ? 4 : 2} il lanciatore verrebbe cambiato d'ufficio.`}
                  >
                    {pl.bf}/{p.stamina} BF
                  </span>
                )}
                <span className="ls-pit-stat">{pl.so} SO</span>
                <span className="ls-pit-stat">{pl.er} ER</span>
                {pl.dec && <span className={`dec dec-${pl.dec}`}>{decLabel(pl.dec)}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
