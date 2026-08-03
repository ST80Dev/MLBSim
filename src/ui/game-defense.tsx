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
import { canOccupy } from '../engine/positions';
import { batterOverall } from '../engine/ratings';
import { ratingColor, upperLast } from './format';
import { PlayerLink } from './player-modal';

// ---------------------------------------------------------------------------
// Pannello "Gestione difesa": oltre a far ENTRARE una riserva, permette di
// RUOTARE i ruoli fra chi è già in campo (drag&drop, come il Roster). Aperto a
// inizio inning dopo un pinch-hit/run, o dal pulsante. Ogni riga mostra il doppio
// ruolo e i rating difensivi (DIF/BRA). Le operazioni non consumano il turno.
//  - trascina un titolare su un altro titolare → SCAMBIO di casella (se entrambi
//    possono coprire quella dell'altro);
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

/** Etichetta ruoli: casella/ruolo principale + eventuale seconda posizione. */
function roles(b: Batter): string {
  return b.secondaryPosition && b.secondaryPosition !== b.position
    ? `${b.position} / ${b.secondaryPosition}`
    : b.position;
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

  // Un drop del giocatore trascinato SULLA casella `targetId` è lecito?
  const canDropOn = (targetId: string): boolean => {
    if (!drag || drag.id === targetId) return false;
    const target = lineup.find((b) => b.id === targetId);
    const src = find(drag.id);
    if (!target || !src) return false;
    if (drag.from === 'field') {
      // Scambio: ciascuno deve poter coprire la casella dell'altro.
      return canOccupy(src, target.position) && canOccupy(target, src.position);
    }
    // Panchina → casella: il subentrante deve poter coprire quella casella.
    return canOccupy(src, target.position);
  };

  const dropOn = (targetId: string) => {
    if (!canDropOn(targetId)) {
      setDrag(null);
      return;
    }
    const { id, from } = drag!;
    if (from === 'field') act((g) => swapDefensivePositions(g, defenseSide(g), id, targetId));
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
        <td className="l def-sec">{b.secondaryPosition ?? '—'}</td>
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
          una <b>riserva</b> su un titolare per <b>sostituirlo</b>. Si evidenziano le caselle valide.
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
                <th className="c">Casella</th>
                <th className="l">Giocatore</th>
                <th className="l">2ª pos.</th>
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
