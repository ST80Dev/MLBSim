import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Batter, Pitcher, Position } from '../engine/types';
import type { SeasonState } from '../data/season';
import { ratingsAtPosition } from '../engine/positions';
import { batterOverall, pitcherOverall } from '../engine/ratings';
import { potentialRole } from '../data/generator';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import { ratingColor, upperLast } from './format';
import { rolesOf, seasonBatLine, seasonPitLine, salaryFmt, pct3, ipFmt } from './statlines';
import type { BatLine, PitLine } from './statlines';
import { OvrBadge } from './rating-widgets';

// ---------------------------------------------------------------------------
// Scheda giocatore (mini-popup) + link cliccabile + context per aprirla.
// Estratti da App.tsx. La riga "Stagione" è reale (season.bat/pit); la
// "Carriera/Storico" è una stima dai rating (projection).
// ---------------------------------------------------------------------------

export interface PlayerModalRequest {
  player: Batter | Pitcher;
  /** Posizione difensiva "del momento" (fielder): usata per DIF alla posizione. */
  pos?: Position;
  /** Fascia di rosa per la proiezione "carriera/storico" (battitore). */
  tier?: BatTier;
}

/** True se il giocatore è un battitore (ha `bats`); i lanciatori hanno `throws`. */
export function isBatter(p: Batter | Pitcher): p is Batter {
  return 'bats' in p;
}

export const PlayerModalContext = createContext<(req: PlayerModalRequest) => void>(() => {});

/** Nome cliccabile che apre il mini-popup giocatore. Uno `span` (non `draggable`)
 *  così dentro le righe trascinabili del roster il drag continua a funzionare e
 *  il click apre la scheda. */
export function PlayerLink({
  player,
  pos,
  tier,
  className,
  children,
}: {
  player: Batter | Pitcher;
  pos?: Position;
  tier?: BatTier;
  className?: string;
  children: ReactNode;
}) {
  const open = useContext(PlayerModalContext);
  const fire = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    open({ player, pos, tier });
  };
  return (
    <span
      className={`player-link${className ? ` ${className}` : ''}`}
      role="button"
      tabIndex={0}
      title="Apri scheda giocatore"
      onClick={fire}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fire(e);
        }
      }}
    >
      {/* Cognome in MAIUSCOLO quando il contenuto è un nome (stringa). */}
      {typeof children === 'string' ? upperLast(children) : children}
    </span>
  );
}

// Colonne del mini-popup: battuta e lancio (una riga "Stagione" reale + una
// "Carriera/Storico" derivata dai rating).
const PM_BAT_COLS: Array<[string, (l: BatLine) => string]> = [
  ['G', (l) => `${l.g}`],
  ['AVG', (l) => pct3(l.avg)],
  ['OBP', (l) => pct3(l.obp)],
  ['SLG', (l) => pct3(l.slg)],
  ['HR', (l) => `${l.hr}`],
  ['RBI', (l) => `${l.rbi}`],
  ['H', (l) => `${l.h}`],
  ['2B', (l) => `${l.d2}`],
  ['3B', (l) => `${l.t3}`],
  ['BB', (l) => `${l.bb}`],
  ['SO', (l) => `${l.so}`],
  ['SB', (l) => `${l.sb}`],
];
const PM_PIT_COLS: Array<[string, (l: PitLine) => string]> = [
  ['W', (l) => `${l.w}`],
  ['L', (l) => `${l.l}`],
  ['ERA', (l) => (l.ip ? l.era.toFixed(2) : '—')],
  ['G', (l) => `${l.g}`],
  ['GS', (l) => `${l.gs}`],
  ['IP', (l) => ipFmt(l.ipOuts)],
  ['H', (l) => `${l.h}`],
  ['BB', (l) => `${l.bb}`],
  ['K', (l) => `${l.k}`],
  ['SV', (l) => `${l.sv}`],
  ['WHIP', (l) => (l.ip ? l.whip.toFixed(2) : '—')],
  ['K/9', (l) => (l.ip ? l.k9.toFixed(1) : '—')],
];

/**
 * Mini-popup giocatore: intestazione (nome, età, ruolo/i, overall + stelle,
 * stipendio), RATING DEL MOMENTO colorati (per il fielder la DIF è calcolata
 * alla posizione occupata), e due righe STAT — "Stagione" REALE (season.bat/pit)
 * e "Carriera/Storico" derivata dai rating (backstory). Chiudibile con ✕,
 * click sul backdrop o Esc. Riusa le classi `.modal-*` esistenti.
 */
export function PlayerModal({
  req,
  season,
  seed,
  onClose,
}: {
  req: PlayerModalRequest;
  season: SeasonState;
  seed: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { player, pos, tier } = req;
  const batter = isBatter(player) ? player : null;
  const pitcher = isBatter(player) ? null : (player as Pitcher);

  // Overall, ruolo/i e rating "del momento".
  let overall: number;
  let rolesLabel: string;
  let ratingChips: Array<[string, number]>;
  let statCols: Array<[string, (l: BatLine) => string]> | Array<[string, (l: PitLine) => string]>;
  let seasonLine: BatLine | PitLine;
  let careerLine: BatLine | PitLine;

  if (batter) {
    const activePos = pos ?? batter.position;
    const rp = ratingsAtPosition(batter, activePos);
    overall = batterOverall(batter.ratings);
    rolesLabel = rolesOf(batter);
    ratingChips = [
      ['CON', batter.ratings.contact],
      ['POT', batter.ratings.power],
      ['OCC', batter.ratings.eye],
      ['VEL', batter.ratings.speed],
      ['DIF', rp.fielding],
      ['BRA', batter.ratings.arm],
    ];
    statCols = PM_BAT_COLS;
    seasonLine = seasonBatLine(season.bat[batter.id]);
    careerLine = seasonBatLine(
      projectBatterSeason(batter, tier ?? 'starter', {
        seed,
        year: season.year - 1,
        day: SEASON_GAMES,
      }),
    );
  } else {
    const p = pitcher!;
    overall = pitcherOverall(p.ratings);
    rolesLabel = potentialRole(p.ratings) + (p.role === 'CL' ? ' · closer' : '');
    ratingChips = [
      ['DOM', p.ratings.stuff],
      ['CTR', p.ratings.control],
      ['MOV', p.ratings.movement],
      ['PAT', p.ratings.groundball],
      ['RES', p.ratings.stamina],
      ['DIF', p.ratings.fielding],
    ];
    statCols = PM_PIT_COLS;
    seasonLine = seasonPitLine(season.pit[p.id]);
    careerLine = seasonPitLine(
      projectPitcherSeason(p, { seed, year: season.year - 1, day: SEASON_GAMES }),
    );
  }

  const statRow = (line: BatLine | PitLine, label: string, cls?: string) => (
    <tr className={cls}>
      <td className="pm-row-lbl">{label}</td>
      {batter
        ? (statCols as Array<[string, (l: BatLine) => string]>).map(([k, f]) => (
            <td key={k}>{f(line as BatLine)}</td>
          ))
        : (statCols as Array<[string, (l: PitLine) => string]>).map(([k, f]) => (
            <td key={k}>{f(line as PitLine)}</td>
          ))}
    </tr>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal player" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{upperLast(player.name)}</div>
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body pm-body">
          <div className="pm-top">
            <div className="pm-ident">
              <span className="pm-role">{rolesLabel}</span>
              <span className="pm-meta">{player.age} anni · {salaryFmt(player.salary)}</span>
            </div>
            <div className="pm-ovr">
              <OvrBadge overall={overall} />
              <span className="pm-ovr-n" style={{ color: ratingColor(overall) }}>
                {overall}
              </span>
            </div>
          </div>

          <div className="pm-ratings">
            {ratingChips.map(([k, v]) => (
              <div className="pm-rt" key={k}>
                <span className="pm-rt-k">{k}</span>
                <span className="pm-rt-v" style={{ background: ratingColor(v) }}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          <div className="pm-stats">
            <div className="roster-scroll">
              <table className="ratings pm-stat-tbl">
                <thead>
                  <tr>
                    <th className="l"></th>
                    {(statCols as Array<[string, unknown]>).map(([k]) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statRow(seasonLine, 'Stagione')}
                  {statRow(careerLine, 'Carriera', 'pm-career')}
                </tbody>
              </table>
            </div>
            <p className="muted pm-note">
              La riga <b>Stagione</b> è reale (partite giocate). La <b>Carriera/Storico</b> è
              una stima derivata dai rating (backstory): lo storico reale si comporrà col
              rollover di stagione (Fase 4).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
