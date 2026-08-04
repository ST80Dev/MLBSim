import { useEffect, useState } from 'react';
import type { GameResult } from '../engine/game';
import type { StatsMode } from './statlines';
import type { GameStatCtx } from './stat-context';
import { StatsToggle } from './game-lineup';
import { LineScore, BoxScore } from './game-boxscore';

// ---------------------------------------------------------------------------
// Modale "Recap" di fine partita: line score + i due box score, con toggle
// modalità statistiche (LOCALE al recap). Estratto da App.tsx.
// ---------------------------------------------------------------------------

export function RecapModal({
  result,
  onClose,
  ctxAway,
  ctxHome,
}: {
  result: GameResult;
  onClose: () => void;
  ctxAway?: GameStatCtx;
  ctxHome?: GameStatCtx;
}) {
  const [statsMode, setStatsMode] = useState<StatsMode>('game');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal recap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            Recap · {result.away.abbrev} {result.final.away} – {result.final.home}{' '}
            {result.home.abbrev}
          </div>
          <StatsToggle mode={statsMode} setMode={setStatsMode} />
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <LineScore result={result} />
          <div className="grid2">
            <BoxScore team={result.away} stats={result.awayStats} mode={statsMode} ctx={ctxAway} />
            <BoxScore team={result.home} stats={result.homeStats} mode={statsMode} ctx={ctxHome} />
          </div>
        </div>
      </div>
    </div>
  );
}
