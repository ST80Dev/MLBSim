import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Batter } from '../engine/types';
import type { LiveGame } from '../engine/game';
import {
  defenseSide,
  substituteFielder,
  swapDefensivePositions,
  autoRealignDefense,
} from '../engine/game';
import { batterOverall } from '../engine/ratings';
import { ratingColor, upperLast } from './format';
import { PlayerLink } from './player-modal';

// ---------------------------------------------------------------------------
// Pannello "Gestione difesa": oltre a far ENTRARE una riserva, permette di
// RUOTARE i ruoli fra chi è già in campo (drag&drop, come il Roster). Aperto a
// inizio inning dopo un pinch-hit/run, o dal pulsante. Ogni riga mostra il doppio
// ruolo e i rating difensivi (DIF/BRA). Le operazioni non consumano il turno.
// PIENA LIBERTÀ (come il Roster): il manager può schierare CHIUNQUE OVUNQUE, anche
// fuori ruolo. Non c'è più il vincolo `canOccupy`: la "penalità" è strategica (la
// sintesi DIFESA, pesata per domanda del ruolo, cala se metti un guanto scarso in
// una casella difficile), non un blocco. Così dopo una sostituzione puoi comunque
// continuare a ruotare tutti gli altri.
//  - trascina un titolare su un altro titolare → SCAMBIO di casella;
//  - trascina una riserva su un titolare → SOSTITUZIONE in quella casella.
// ---------------------------------------------------------------------------

type Drag = { id: string; from: 'field' | 'bench' } | null;

function ratBadge(v: number) {
  return (
    <span className="def-rat" style={{ background: ratingColor(v) }}>
      {v}
    </span>
  );
}

/** Etichetta ruoli NATURALI: ruolo principale (naturale, non la casella attuale) +
 *  eventuale seconda posizione. Usa `nativePosition` se il giocatore è schierato
 *  fuori ruolo (là `position` è la casella attuale), altrimenti `position`. */
function roles(b: Batter): string {
  const primary = b.nativePosition ?? b.position;
  return b.secondaryPosition && b.secondaryPosition !== primary
    ? `${primary} / ${b.secondaryPosition}`
    : primary;
}

export function DefenseModal({
  live,
  act,
  onClose,
}: {
  live: LiveGame;
  act: (fn: (g: LiveGame) => void) => void;
  onClose: () => void;
}) {
  const [drag, setDrag] = useState<Drag>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const def = defenseSide(live);
  const lineup = def.team.lineup;
  const bench = def.team.bench;
  const find = (id: string): Batter | undefined =>
    lineup.find((b) => b.id === id) ?? bench.find((b) => b.id === id);

  // Un drop del giocatore trascinato SULLA casella `targetId` è lecito? Piena
  // libertà: qualunque titolare può scambiarsi con qualunque altro, e qualunque
  // riserva può rilevare qualunque titolare (schieramento anche fuori ruolo).
  // L'unico vincolo è che il bersaglio sia un titolare diverso dal trascinato.
  const canDropOn = (targetId: string): boolean => {
    if (!drag || drag.id === targetId) return false;
    const target = lineup.find((b) => b.id === targetId);
    return !!target && !!find(drag.id);
  };

  const dropOn = (targetId: string) => {
    if (!canDropOn(targetId)) {
      setDrag(null);
      return;
    }
    const { id, from } = drag!;
    // `free`: scambio senza vincolo di ruolo (piena libertà del manager).
    if (from === 'field') act((g) => swapDefensivePositions(g, defenseSide(g), id, targetId, true));
    else act((g) => substituteFielder(g, defenseSide(g), targetId, id, false));
    setDrag(null);
  };

  const dragging = !!drag;

  const fieldRow = (b: Batter) => {
    const droppable = dragging && canDropOn(b.id);
    const isDragged = drag?.id === b.id;
    const cls =
      'def-row' + (droppable ? ' drop-ok' : '') + (isDragged ? ' dragging' : '') + (dragging && !droppable && !isDragged ? ' dim' : '');
    return (
      <tr
        key={b.id}
        className={cls}
        draggable
        onDragStart={() => setDrag({ id: b.id, from: 'field' })}
        onDragEnd={() => setDrag(null)}
        onDragOver={(e) => droppable && e.preventDefault()}
        onDrop={() => dropOn(b.id)}
      >
        <td className="c">
          <span className="def-slot">{b.position}</span>
        </td>
        <td className="l">
          <span className="def-grip" aria-hidden>⠿</span>
          <PlayerLink player={b} className="def-name">
            {upperLast(b.name)}
          </PlayerLink>
        </td>
        <td className="l def-sec">{roles(b)}</td>
        <td className="c">
          <span className="def-ovr" style={{ background: ratingColor(batterOverall(b.ratings)) }}>
            {batterOverall(b.ratings)}
          </span>
        </td>
        <td className="c">{ratBadge(b.ratings.fielding)}</td>
        <td className="c">{ratBadge(b.ratings.arm)}</td>
      </tr>
    );
  };

  const benchRow = (b: Batter) => {
    const isDragged = drag?.id === b.id;
    return (
      <tr
        key={b.id}
        className={'def-row bench' + (isDragged ? ' dragging' : '')}
        draggable
        onDragStart={() => setDrag({ id: b.id, from: 'bench' })}
        onDragEnd={() => setDrag(null)}
      >
        <td className="l">
          <span className="def-grip" aria-hidden>⠿</span>
          <PlayerLink player={b} className="def-name">
            {upperLast(b.name)}
          </PlayerLink>
        </td>
        <td className="l def-sec">{roles(b)}</td>
        <td className="c">
          <span className="def-ovr" style={{ background: ratingColor(batterOverall(b.ratings)) }}>
            {batterOverall(b.ratings)}
          </span>
        </td>
        <td className="c">{ratBadge(b.ratings.fielding)}</td>
        <td className="c">{ratBadge(b.ratings.arm)}</td>
        <td className="c">{ratBadge(b.ratings.speed)}</td>
      </tr>
    );
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal submodal defmodal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Gestione difesa</div>
          <span className="def-team">{def.team.abbrev}</span>
          <button className="modal-close" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="sub-hint">
          Trascina un giocatore <b>in campo</b> su un altro per <b>scambiare le caselle</b>; trascina
          una <b>riserva</b> su un titolare per <b>sostituirlo</b>. Piena libertà: puoi schierare
          chiunque ovunque (anche fuori ruolo — occhio alla sintesi <b>DIF</b>).
        </div>

        <div className="def-scroll">
          <div className="def-sec-h">
            <h3>In campo</h3>
            <span className="def-count">9 titolari</span>
            <button
              className="def-auto"
              title="Rimetti ognuno al ruolo migliore, col minimo di spostamenti"
              onClick={() => act((g) => autoRealignDefense(g, defenseSide(g)))}
            >
              ✦ Riallinea auto
            </button>
          </div>
          <table className="def-tbl">
            <thead>
              <tr>
                <th className="c" title="Casella difensiva occupata ora">Casella</th>
                <th className="l">Giocatore</th>
                <th className="l" title="Ruoli naturali: principale / seconda posizione">
                  Ruoli
                </th>
                <th className="c" title="Valore totale">OVR</th>
                <th className="c" title="Difesa">DIF</th>
                <th className="c" title="Braccio">BRA</th>
              </tr>
            </thead>
            <tbody>{lineup.map(fieldRow)}</tbody>
          </table>

          <div className="def-sec-h">
            <h3>Riserve</h3>
            <span className="def-count">{bench.length ? 'panchina' : 'nessuna riserva'}</span>
          </div>
          {bench.length === 0 ? (
            <div className="sub-empty">Panchina vuota.</div>
          ) : (
            <table className="def-tbl">
              <thead>
                <tr>
                  <th className="l">Giocatore</th>
                  <th className="l">Ruolo 1° / 2°</th>
                  <th className="c">OVR</th>
                  <th className="c" title="Difesa">DIF</th>
                  <th className="c" title="Braccio">BRA</th>
                  <th className="c" title="Velocità">VEL</th>
                </tr>
              </thead>
              <tbody>{bench.map(benchRow)}</tbody>
            </table>
          )}
        </div>

        <div className="def-foot">
          <button className="btn primary" onClick={onClose}>
            Conferma difesa
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
