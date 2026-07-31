import { useState } from 'react';
import type { LiveGame, LiveSituation } from '../engine/game';
import {
  playOffense,
  attemptSteal,
  intentionalWalk,
  hitAndRun,
  setInfieldIn,
  setDpDepth,
  setNoDoubles,
  availableRelievers,
  defenseSide,
  cpuOffenseTurn,
} from '../engine/game';
import { SubModal } from './game-submodal';
import type { SubMode } from './game-submodal';

// ---------------------------------------------------------------------------
// Barra comandi tattici (attacco: swing/bunt/squeeze/cerca-fly/rubata/hit&run/
// pinch-hit; difesa: cambio lanciatore/base intenzionale/posizionamenti interni)
// + il modale sostituzioni. Estratta da App.tsx.
// ---------------------------------------------------------------------------

export function ActionBar({
  live,
  sit,
  act,
  onSub,
}: {
  live: LiveGame;
  sit: LiveSituation;
  act: (fn: (g: LiveGame) => void) => void;
  // Chiamata SUBITO dopo una sostituzione confermata (cambio lanc./difensore,
  // pinch-hit/run): una sostituzione non è una "giocata" con verdetto, quindi
  // deve rivelare immediatamente marker/testata/boxscore invece di aspettare il
  // verdetto della telecronaca del turno successivo.
  onSub?: () => void;
}) {
  // Modale di sostituzione (popup a tutto schermo): rimpiazza i vecchi menu a
  // discesa che restavano nascosti dietro la barra comandi.
  const [sub, setSub] = useState<SubMode | null>(null);
  const noBench = sit.bench.length === 0;
  const noRelievers = availableRelievers(defenseSide(live)).length === 0;
  const hasRunner = sit.bases.some(Boolean);

  const bar = sit.controlledBatting ? (
    <div className="card actionbar compact">
      <span className="turn-tag off">ATTACCO · {sit.battingTeam.abbrev}</span>
      <button className="btn primary sm" onClick={() => act((g) => playOffense(g, 'swing'))}>
        Battuta
      </button>
      <button
        className="btn sm"
        disabled={!sit.canBunt}
        onClick={() => act((g) => playOffense(g, 'bunt'))}
        title={sit.canBunt ? 'Bunt di sacrificio' : 'Bunt inutile con 2 out'}
      >
        Bunt
      </button>
      {sit.canSqueeze && (
        <button
          className="btn sm"
          onClick={() => act((g) => playOffense(g, 'squeeze'))}
          title="Squeeze: il corridore in terza parte al lancio. Se il bunt è sbagliato, è spacciato a casa"
        >
          Squeeze
        </button>
      )}
      {sit.canFlyBall && (
        <button
          className="btn sm"
          onClick={() => act((g) => playOffense(g, 'flyball'))}
          title="Cerca fly: il battitore eleva per la volata di sacrificio. Segna il corridore dalla terza, ma meno valide"
        >
          Cerca fly
        </button>
      )}
      {sit.stealFrom.includes(1) && (
        <button
          className="btn sm"
          onClick={() => act((g) => attemptSteal(g, 1))}
          title="La rubata non consuma il turno: puoi tentarla e poi battere"
        >
          Ruba 2ª
        </button>
      )}
      {sit.stealFrom.includes(2) && (
        <button
          className="btn sm"
          onClick={() => act((g) => attemptSteal(g, 2))}
          title="La rubata non consuma il turno: puoi tentarla e poi battere"
        >
          Ruba 3ª
        </button>
      )}
      {sit.canHitAndRun && (
        <button
          className="btn sm"
          onClick={() => act((g) => hitAndRun(g))}
          title="Hit-and-run: il corridore parte, il battitore protegge"
        >
          Mob &amp; corri
        </button>
      )}
      <button
        className="btn sm"
        disabled={noBench}
        onClick={() => setSub('pinchhit')}
        title="Pinch-hit: sostituisci il battitore"
      >
        Pinch-hit
      </button>
      {hasRunner && (
        <button
          className="btn sm"
          disabled={noBench}
          onClick={() => setSub('pinchrun')}
          title="Pinch-runner: sostituisci un corridore in base"
        >
          Pinch-run
        </button>
      )}
    </div>
  ) : (
    <div className="card actionbar compact">
      <span className="turn-tag def">DIFESA · {sit.fieldingTeam.abbrev}</span>
      <button
        className="btn primary sm"
        onClick={() => act((g) => cpuOffenseTurn(g))}
        title="La CPU decide la battuta (può anche rubare/buntare): premi «Lancia» per risolvere"
      >
        Lancia ▸
      </button>
      <button
        className="btn sm"
        onClick={() => act((g) => intentionalWalk(g))}
        title="Base intenzionale"
      >
        Base int.
      </button>
      {sit.bases[2] && sit.outs < 2 && (
        <button
          className={sit.infieldIn ? 'btn sm active' : 'btn sm'}
          onClick={() => act((g) => setInfieldIn(g, !g.infieldIn))}
          title="Interni dentro: taglia il punto da terra, ma concede più valide"
        >
          Interni dentro
        </button>
      )}
      {sit.canDpDepth && (
        <button
          className={sit.dpDepth ? 'btn sm active' : 'btn sm'}
          onClick={() => act((g) => setDpDepth(g, !g.dpDepth))}
          title="Interni a doppio gioco: più doppi giochi, ma qualche rimbalzo passa nei buchi"
        >
          Interni a DP
        </button>
      )}
      <button
        className={sit.noDoubles ? 'btn sm active' : 'btn sm'}
        onClick={() => act((g) => setNoDoubles(g, !g.noDoubles))}
        title="Difendi le righe: meno doppi/tripli concessi, al costo di qualche singolo (per proteggere un vantaggio)"
      >
        Difendi le righe
      </button>
      <button
        className="btn sm"
        disabled={noRelievers}
        onClick={() => setSub('pitcher')}
        title="Cambio lanciatore: scegli un rilievo dal bullpen"
      >
        Cambio lanc.
      </button>
      <button
        className="btn sm"
        disabled={noBench}
        onClick={() => setSub('fielders')}
        title="Sostituzione difensiva: cambia un difensore"
      >
        Cambio dif.
      </button>
    </div>
  );

  return (
    <>
      {bar}
      {sub && (
        <SubModal
          live={live}
          mode={sub}
          act={(fn) => {
            act(fn);
            onSub?.(); // sostituzione = aggiornamento UI immediato (no attesa verdetto)
          }}
          onClose={() => setSub(null)}
        />
      )}
    </>
  );
}
