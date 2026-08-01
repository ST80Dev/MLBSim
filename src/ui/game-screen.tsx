import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Batter, Pitcher, Team } from '../engine/types';
import type { GameResult, LiveSituation } from '../engine/game';
import type { BattingLine, PitchingLine } from '../engine/boxscore';
import { teamSynthesis, staffSynthesis } from '../engine/teamRatings';
import { pitcherOverall } from '../engine/ratings';
import type { FieldCalibration } from '../data/stadiumCalibration';
import { Diamond } from './Diamond';
import type { Side } from './types';
import { batterStatLine, pitcherStatLine } from './statlines';
import type { StatsMode, StatItem } from './statlines';
import { ratingColor } from './format';
import { TeamBadge, BaseDiamond, OutsDots, strengthColor } from './widgets';
import { PlayerLink } from './player-modal';
import { LineScore } from './game-boxscore';
import { PlayBanner, CronacaTeam } from './game-cronaca';
import { StatsToggle, LineupSide } from './game-lineup';
import { subRatingChips } from './game-submodal';

// ---------------------------------------------------------------------------
// Plancia di partita: barra stat (squadre + duello del turno + line score) e il
// campo con diamante/foto, cronaca a fasi, colonne lineup e overlay comandi.
// Estratti da App.tsx.
// ---------------------------------------------------------------------------

export function GameScreen({
  result,
  sit,
  displayResult,
  displaySit,
  editing,
  cal,
  onMarkerMove,
  basesShown,
  runners,
  runnerSpeeds,
  batterName,
  shownPlays,
  onReveal,
  controls,
}: {
  result: GameResult;
  sit: LiveSituation;
  // Istantanea RITARDATA di result/sit: la plancia (scoreboard, difensori e
  // lanciatore sul campo, boxscore) mostra questa, che avanza solo al verdetto
  // della telecronaca. Il PlayBanner invece riceve il `result` REALE (deve
  // vedere subito la nuova giocata per animarla e poi far scattare il reveal).
  // Se omesse si usano result/sit reali (schermata calibrazione).
  displayResult?: GameResult;
  displaySit?: LiveSituation;
  editing: boolean;
  cal: FieldCalibration;
  onMarkerMove: (id: string, pos: { x: number; y: number }) => void;
  // Basi mostrate sul diamante: possono essere in ritardo rispetto a `sit.bases`
  // (rivelate al verdetto della cronaca). Se omesse, si usa lo stato reale.
  basesShown?: [boolean, boolean, boolean];
  runners?: (string | null)[];
  runnerSpeeds?: (number | null)[];
  batterName?: string | null;
  // Numero di giocate già "lette" al centro: le cronache laterali si fermano qui
  // per non anticipare l'esito. Se omesso, si mostra tutto.
  shownPlays?: number;
  onReveal?: () => void;
  controls: ReactNode;
}) {
  const dResult = displayResult ?? result;
  const dSit = displaySit ?? sit;
  const fieldBases = basesShown ?? dSit.bases;
  return (
    <div className="game-screen">
      <StatBar result={dResult} sit={dSit} basesShown={fieldBases} />

      <div className={editing ? 'gamefield editing' : 'gamefield'}>
        <Diamond
          home={dResult.home}
          away={dResult.away}
          background
          bases={fieldBases}
          runners={runners}
          runnerSpeeds={runnerSpeeds}
          batterName={batterName}
          defenseTeam={dSit.offenseSide === 'away' ? dResult.home : dResult.away}
          pitcherName={dSit.pitcher.name}
          cal={cal}
          editable={editing}
          onMarkerMove={onMarkerMove}
        />

        {!editing && <PlayBanner result={result} onReveal={onReveal} />}

        <div className="cronaca-corner left">
          <CronacaTeam result={result} side="away" shownPlays={shownPlays} />
        </div>
        <div className="cronaca-corner right">
          <CronacaTeam result={result} side="home" shownPlays={shownPlays} />
        </div>

        <div className="lineup-corner left">
          <LineupSide side="away" team={dResult.away} stats={dResult.awayStats} sit={dSit} />
        </div>
        <div className="lineup-corner right">
          <LineupSide side="home" team={dResult.home} stats={dResult.homeStats} sit={dSit} />
        </div>

        <div className="controls-overlay">{controls}</div>
      </div>
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
  basesShown,
}: {
  result: GameResult;
  sit: LiveSituation;
  basesShown?: [boolean, boolean, boolean];
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
        win={decided && sit.winner === 'away'}
      />

      <div className="statbar-center">
        <LineScore result={result} />
        <div className="sb-situation">
          <span className="sb-inning">
            {arrow} {sit.inning}° <span className="sb-half">{halfLabel}</span>
          </span>
          <BaseDiamond bases={basesShown ?? sit.bases} />
          <OutsDots outs={sit.outs} />
        </div>
      </div>

      <TeamStatSide
        side="home"
        team={result.home}
        score={result.final.home}
        involved={involvedFor(result, sit, 'home')}
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
  win,
}: {
  side: Side;
  team: Team;
  score: number;
  involved: Involved;
  win: boolean;
}) {
  // Selettore stat LOCALE a questo lato dello scoreboard (indipendente dagli altri
  // blocchi della schermata).
  const [mode, setMode] = useState<StatsMode>('game');
  // Sintesi dei TITOLARI COINVOLTI ora (il lineup riflette i pinch-hit) + il
  // lanciatore sul monte quando la squadra difende (staff se sta battendo).
  const synth = teamSynthesis(team.lineup.map((b) => ({ b, pos: b.position })));
  const items: StatItem[] =
    involved.kind === 'batter'
      ? batterStatLine(mode, involved.batLine, involved.batter!)
      : pitcherStatLine(mode, involved.pitLine, involved.pitcher!);
  const player = involved.kind === 'batter' ? involved.batter! : involved.pitcher!;
  const lan =
    involved.kind === 'pitcher'
      ? pitcherOverall(involved.pitcher!.ratings)
      : staffSynthesis(team.rotation, team.bullpen);
  const strength: [string, number][] = [
    ['OVR', synth.ovr],
    ['ATT', synth.off],
    ['DIF', synth.def],
    ['LAN', lan],
  ];
  // Doti del giocatore del turno (battitore o lanciatore): stesse chip colorate,
  // così durante il match si valuta il DUELLO (non solo la forza di squadra).
  const playerRatings = subRatingChips(player);
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
          {involved.kind === 'batter' ? 'ALLA BATTUTA' : 'SUL MONTE'}
        </span>
        <span className="ts-pname">
          <PlayerLink
            player={player}
            pos={involved.kind === 'batter' ? involved.batter!.position : undefined}
          >
            {player.name}
          </PlayerLink>
        </span>
        <StatsToggle mode={mode} setMode={setMode} />
      </div>
      <div className="ts-ratings" title="Doti del giocatore in azione">
        {playerRatings.map(([k, v]) => (
          <span key={k} className="ts-rat">
            <span className="ts-rat-k">{k}</span>
            <span className="ts-rat-v" style={{ background: ratingColor(v) }}>
              {v}
            </span>
          </span>
        ))}
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
