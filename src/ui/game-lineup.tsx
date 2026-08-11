import { useRef, useEffect, useState } from 'react';
import type { Team } from '../engine/types';
import type { GameResult, TeamGameStats, LiveSituation } from '../engine/game';
import { estimatedPitches, newPitchingLine } from '../engine/boxscore';
import { disambiguateLastNames } from '../engine/names';
import type { Side } from './types';
import { batterStatLine, pitcherStatLine, STATS_MODE_SHORT, STATS_MODE_TITLE } from './statlines';
import type { StatsMode } from './statlines';
import type { GameStatCtx } from './stat-context';
import { TeamBadge, pitcherFatigue } from './widgets';
import { PlayerLink } from './player-modal';
import { decLabel } from './game-boxscore';
import { upperLast } from './format';

// ---------------------------------------------------------------------------
// Colonna lineup di partita (battitori + lanciatori usati con affaticamento),
// toggle modalità statistiche e overlay di fine gara. Estratti da App.tsx.
// ---------------------------------------------------------------------------

const STATS_MODES: StatsMode[] = ['game', 'season', 'last'];

/** Selettore modalità statistiche (Partita / Stagione / Precedente). */
export function StatsToggle({ mode, setMode }: { mode: StatsMode; setMode: (m: StatsMode) => void }) {
  return (
    <div className="stats-toggle" role="group" aria-label="Modalità statistiche">
      {STATS_MODES.map((m) => (
        <button
          key={m}
          className={`st-btn${mode === m ? ' active' : ''}`}
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

/** Colonna lineup di una squadra durante la gara: DUE blocchi indipendenti —
 *  Ordine di battuta e Lanciatori usati — ognuno con la PROPRIA selezione stat
 *  (Partita/Stagione) e le proprie intestazioni. I toggle sono locali: cambiare
 *  uno NON tocca gli altri blocchi della schermata. */
export function LineupSide({
  team,
  stats,
  side,
  sit,
  ctx,
  livePitcherId,
}: {
  team: Team;
  stats: TeamGameStats;
  side: Side;
  sit: LiveSituation;
  // Contesto per le stat di stagione/precedente (assente = solo modalità Partita).
  ctx?: GameStatCtx;
  // Id del lanciatore CORRENTE (stato reale) di questa squadra, quando difende:
  // garantisce che la sua riga sia SEMPRE presente nel boxscore anche se la
  // rivelazione ritardata non l'ha ancora agganciato.
  livePitcherId?: string;
}) {
  // Selettori INDIPENDENTI per blocco (battitori vs lanciatori).
  const [batMode, setBatMode] = useState<StatsMode>('game');
  const [pitMode, setPitMode] = useState<StatsMode>('game');

  const isBatting = sit.offenseSide === side && sit.status === 'live';
  const currentId = isBatting ? sit.batter.id : null;
  const pitById = new Map([...team.rotation, ...team.bullpen].map((p) => [p.id, p]));

  // Ordine di battuta = i 9 titolari CORRENTI (sostituzione COMPLETA: il pinch
  // sostituito non compare più; le sue stat restano nel box/recap).
  const lineById = new Map(stats.batting.map((l) => [l.id, l]));
  const batRows = team.lineup.map((b) => {
    const line = lineById.get(b.id);
    return { b, line, items: batterStatLine(batMode, line, ctx?.batLine(batMode, b)) };
  });
  const batHead = batRows[0]?.items.map((i) => i.k) ?? [];
  const batLabels = disambiguateLastNames(team.lineup.map((b) => b.name));

  // TUTTI i lanciatori usati (partente + rilievi), con intestazioni proprie
  // (pitcherStatLine): tabella, non righe a-capo. Colonne dipendenti dal toggle
  // lanciatori (Partita: IP/H/R/ER/BB/SO — Stagione: K9/BB9/WHIP/HR9/SO).
  // GARANZIA lanciatore corrente: se lo stato reale ha un lanciatore che il
  // boxscore ritardato non mostra ancora (appena entrato, verdetto non arrivato),
  // aggiungo la sua riga con stat a ZERO — non anticipa l'esito del turno e la
  // linea reale la sostituisce al verdetto. Così non manca MAI dal boxscore.
  const livePit = livePitcherId ? pitById.get(livePitcherId) : undefined;
  const pits =
    livePit && !stats.pitching.some((pl) => pl.id === livePit.id)
      ? [...stats.pitching, newPitchingLine(livePit)]
      : stats.pitching;
  const lastPitIdx = pits.length - 1;
  const pitLabels = disambiguateLastNames(pits.map((p) => p.name));
  const firstPit = pits.length > 0 ? pitById.get(pits[0].id) : undefined;
  const pitHead =
    pits.length > 0
      ? pitcherStatLine(pitMode, pits[0], firstPit && ctx?.pitLine(pitMode, firstPit)).map((i) => i.k)
      : [];
  // Tabella lanciatori ad altezza fissa, scrollata sul lanciatore ATTUALE.
  const pitsRef = useRef<HTMLDivElement>(null);
  const curPitRef = useRef<HTMLTableRowElement>(null);
  // Il lanciatore corrente è SEMPRE l'ultima riga (ordine d'ingresso): porta il
  // fondo in vista così il subentrato non resta sotto la piega quando i
  // lanciatori superano l'altezza del box. Il vecchio calcolo con `offsetTop`
  // non scrollava (dipende dall'offsetParent).
  // Si ri-scrolla non solo quando entra un nuovo lanciatore, ma anche mentre il
  // corrente lavora (bf che cresce): le righe possono RIFLUIRE più alte (badge di
  // affaticamento che va a capo) e far uscire il corrente dalla vista.
  const curBf = pits[lastPitIdx]?.bf ?? 0;
  useEffect(() => {
    const box = pitsRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [lastPitIdx, pits.length, curBf]);

  return (
    <div className="card lineup-side" style={{ borderTopColor: team.primaryColor }}>
      <div className="ls-head">
        <TeamBadge team={team} size={22} />
        <span className="ls-name">{team.name}</span>
      </div>

      <div className="ls-section bat">
        <div className="ls-subhead">
          <span className="ls-subtitle">Ordine di battuta</span>
          <StatsToggle mode={batMode} setMode={setBatMode} />
        </div>
        <div className="ls-scroll">
          <table className="ls-table">
            <thead>
              <tr>
                <th className="n">#</th>
                <th className="l">Battitore</th>
                {batHead.map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batRows.map((r, i) => (
                <tr key={r.b.id} className={r.b.id === currentId ? 'at-bat' : undefined}>
                  <td className="n">{i + 1}</td>
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
      </div>

      {pits.length > 0 && (
        <div className="ls-section pit">
          <div className="ls-subhead">
            <span className="ls-subtitle">Lanciatori</span>
            <StatsToggle mode={pitMode} setMode={setPitMode} />
          </div>
          <div className="ls-scroll ls-pit-scroll" ref={pitsRef}>
            <table className="ls-table">
              <thead>
                <tr>
                  <th className="l">Lanc.</th>
                  {pitHead.map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pits.map((pl, idx) => {
                  const p = pitById.get(pl.id);
                  const items = pitcherStatLine(pitMode, pl, p && ctx?.pitLine(pitMode, p));
                  const isCur = idx === lastPitIdx && sit.status === 'live';
                  const fat = p ? pitcherFatigue(p.role, p.stamina, pl.bf) : undefined;
                  const stateWord =
                    fat?.state === 'spent' ? 'esausto' : fat?.state === 'tiring' ? 'in calo' : 'fresco';
                  return (
                    <tr
                      key={pl.id}
                      className={isCur ? 'at-bat' : undefined}
                      ref={idx === lastPitIdx ? curPitRef : undefined}
                    >
                      <td className="l bname">
                        <span className="pos">{p?.role ?? (idx === 0 ? 'SP' : 'RP')}</span>{' '}
                        {p ? <PlayerLink player={p}>{pitLabels[idx]}</PlayerLink> : upperLast(pitLabels[idx])}
                        {p && (
                          <span
                            className="pit-fat"
                            style={{ color: fat?.tone }}
                            title={`Lanci ~${estimatedPitches(pl)} · battitori affrontati ${pl.bf}/${p.stamina} Resistenza (${stateWord}): soglia oltre cui scatta l'affaticamento.`}
                          >
                            {estimatedPitches(pl)}PT · {pl.bf}/{p.stamina}
                          </span>
                        )}
                        {pl.dec && <span className={`dec dec-${pl.dec}`}>{decLabel(pl.dec)}</span>}
                      </td>
                      {items.map((it) => (
                        <td key={it.k}>{it.v}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
