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
  onOpenDefense,
  onOffenseSub,
  waiting,
}: {
  live: LiveGame;
  sit: LiveSituation;
  act: (fn: (g: LiveGame) => void) => void;
  // Chiamata SUBITO dopo una sostituzione confermata (cambio lanc./difensore,
  // pinch-hit/run): una sostituzione non è una "giocata" con verdetto, quindi
  // deve rivelare immediatamente marker/testata/boxscore invece di aspettare il
  // verdetto della telecronaca del turno successivo.
  onSub?: () => void;
  // Apre il pannello "Gestione difesa" (rotazione ruoli + sostituzioni).
  onOpenDefense?: () => void;
  // Segnala che l'umano ha fatto un pinch-hit/run: a inizio della sua metà
  // difensiva il pannello difesa si aprirà da solo per risistemare lo schieramento.
  onOffenseSub?: () => void;
  // true mentre la telecronaca del turno APPENA giocato non è ancora arrivata al
  // verdetto: la barra NON deve proporre i comandi del turno successivo (non sai
  // ancora se sei stato eliminato o è stata una valida). Mostra un'attesa.
  waiting?: boolean;
}) {
  // Modale di sostituzione (popup a tutto schermo): rimpiazza i vecchi menu a
  // discesa che restavano nascosti dietro la barra comandi.
  const [sub, setSub] = useState<SubMode | null>(null);
  const noBench = sit.bench.length === 0;
  const noRelievers = availableRelievers(defenseSide(live)).length === 0;
  const hasRunner = sit.bases.some(Boolean);

  // Layout a 3 ZONE: [tag + SOSTITUZIONI] · [AZIONE PRIMARIA centrata FISSA] · [TATTICHE].
  // Il primario (Battuta/Lancia) è ancorato al centro (sotto casa base) e NON si
  // sposta. Le altre azioni sono DIVISE PER TIPO ai due lati: a SINISTRA (col tag
  // di turno) le azioni di giocatori/squadra = sostituzioni (pinch-hit/run;
  // cambio lanc./gestione difesa); a DESTRA le azioni di gioco del turno = tattiche
  // (bunt/squeeze/rubate/hit&run; base int./interni/difendi le righe). Così i
  // pulsanti non si accumulano tutti da un lato e non finiscono sul boxscore.
  const bar = waiting ? (
    // Turno in corso: si aspetta il verdetto della telecronaca prima di mostrare
    // i comandi del turno successivo.
    <div className="card actionbar compact waiting" aria-live="polite">
      <span className="turn-tag wait">⏳ Turno in corso…</span>
    </div>
  ) : sit.controlledBatting ? (
    <div className="card actionbar compact">
      <div className="ab-side left">
        <span className="turn-tag off">ATTACCO · {sit.battingTeam.abbrev}</span>
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
      <div className="ab-main">
        <button className="btn primary sm" onClick={() => act((g) => playOffense(g, 'swing'))}>
          Battuta
        </button>
      </div>
      <div className="ab-side right">
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
            Hit &amp; Run
          </button>
        )}
      </div>
    </div>
  ) : (
    <div className="card actionbar compact">
      <div className="ab-side left">
        <span className="turn-tag def">DIFESA · {sit.fieldingTeam.abbrev}</span>
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
          onClick={() => onOpenDefense?.()}
          title="Gestione difesa: ruota i ruoli fra i difensori e sostituisci dalla panchina"
        >
          Gestione difesa
        </button>
      </div>
      <div className="ab-main">
        <button
          className="btn primary sm"
          onClick={() => act((g) => cpuOffenseTurn(g))}
          title="La CPU decide la battuta (può anche rubare/buntare): premi «Lancia» per risolvere"
        >
          Lancia ▸
        </button>
      </div>
      <div className="ab-side right">
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
      </div>
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
            if (sub === 'pinchhit' || sub === 'pinchrun') onOffenseSub?.();
          }}
          onClose={() => setSub(null)}
        />
      )}
    </>
  );
}
