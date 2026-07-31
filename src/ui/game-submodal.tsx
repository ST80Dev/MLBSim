import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { Batter, Pitcher } from '../engine/types';
import type { LiveGame } from '../engine/game';
import {
  offenseSide, defenseSide, availableRelievers, changePitcher, pinchHit, pinchRun, substituteFielder,
} from '../engine/game';
import { batterOverall, pitcherOverall } from '../engine/ratings';
import { ratingColor, upperLast } from './format';
import { isBatter, PlayerLink } from './player-modal';


// --- Sostituzioni: popup "ad hoc" in stile roster --------------------------
// Un unico modale mostra il pool giusto (rilievi / panchina) con OVR e
// caratteristiche, come una mini-scheda roster. Per i cambi difensivi e i
// pinch-runner c'è un primo passo (chi esce), poi la scelta di chi entra.
export type SubMode = 'pitcher' | 'fielders' | 'pinchhit' | 'pinchrun';

const SUB_TITLE: Record<SubMode, string> = {
  pitcher: 'Cambio lanciatore',
  fielders: 'Sostituzione difensiva',
  pinchhit: 'Pinch-hit',
  pinchrun: 'Pinch-runner',
};

const BASE_LABEL = ['1ª', '2ª', '3ª'];

/** Caratteristiche fondamentali per la riga sostituto (come nel roster). */
export function subRatingChips(p: Batter | Pitcher): Array<[string, number]> {
  if (isBatter(p)) {
    return [
      ['CON', p.ratings.contact],
      ['POT', p.ratings.power],
      ['OCC', p.ratings.eye],
      ['VEL', p.ratings.speed],
      ['DIF', p.ratings.fielding],
      ['BRA', p.ratings.arm],
    ];
  }
  const r = (p as Pitcher).ratings;
  return [
    ['DOM', r.stuff],
    ['CTR', r.control],
    ['MOV', r.movement],
    ['RES', r.stamina],
    ['DIF', r.fielding],
  ];
}

/** Etichette-colonna delle caratteristiche per il tipo (batter/pitcher). */
function subRatingKeys(p: Batter | Pitcher): string[] {
  return subRatingChips(p).map(([k]) => k);
}

/** Riga sostituto come nel Roster: OVR, nome+sottotitolo, colonne dote, «Scegli». */
function SubRow({
  player,
  subtitle,
  onPick,
}: {
  player: Batter | Pitcher;
  subtitle: string;
  onPick: () => void;
}) {
  const ovr = isBatter(player)
    ? batterOverall(player.ratings)
    : pitcherOverall((player as Pitcher).ratings);
  return (
    <tr className="subrow">
      <td className="subrow-ovr-c">
        <span className="subrow-ovr" style={{ background: ratingColor(ovr) }}>
          {ovr}
        </span>
      </td>
      <td className="l subrow-id">
        <PlayerLink player={player} className="subrow-name">
          {player.name}
        </PlayerLink>
        <span className="subrow-sub">{subtitle}</span>
      </td>
      {subRatingChips(player).map(([k, v]) => (
        <td key={k} className="subrow-stat">
          <span className="subrow-rat" style={{ background: ratingColor(v) }}>
            {v}
          </span>
        </td>
      ))}
      <td className="subrow-pick-c">
        <button className="btn sm primary subrow-pick" onClick={onPick}>
          Scegli ▸
        </button>
      </td>
    </tr>
  );
}

export function SubModal({
  live,
  mode,
  act,
  onClose,
}: {
  live: LiveGame;
  mode: SubMode;
  act: (fn: (g: LiveGame) => void) => void;
  onClose: () => void;
}) {
  const [outId, setOutId] = useState<string | null>(null); // titolare che esce (fielders)
  const [outBase, setOutBase] = useState<number | null>(null); // corridore (pinchrun)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const off = offenseSide(live);
  const def = defenseSide(live);

  let hint = '';
  let targets: ReactNode = null; // primo passo (chi esce), quando serve
  let incoming: Array<{ id: string; player: Batter | Pitcher; subtitle: string; onPick: () => void }> = [];
  let emptyMsg = 'Nessun giocatore disponibile.';

  if (mode === 'pitcher') {
    hint = 'Scegli il rilievo da mandare sul monte.';
    emptyMsg = 'Nessun rilievo disponibile in bullpen.';
    incoming = availableRelievers(def).map((p) => ({
      id: p.id,
      player: p,
      subtitle: p.role === 'CL' ? 'RP (closer)' : p.role,
      onPick: () => {
        act((g) => changePitcher(g, defenseSide(g), p.id));
        onClose();
      },
    }));
  } else if (mode === 'pinchhit') {
    const cur = off.team.lineup[off.battingIndex];
    hint = `Sostituisci ${upperLast(cur.name)} in battuta.`;
    emptyMsg = 'Nessun giocatore in panchina.';
    incoming = off.team.bench.map((b) => ({
      id: b.id,
      player: b,
      subtitle: `panchina · ${b.position}`,
      onPick: () => {
        act((g) => pinchHit(g, b.id));
        onClose();
      },
    }));
  } else if (mode === 'fielders') {
    emptyMsg = 'Nessun giocatore in panchina.';
    if (outId == null) {
      hint = 'Chi esce dalla difesa?';
      targets = (
        <div className="sub-targets">
          {def.team.lineup.map((b) => (
            <button key={b.id} className="sub-target" onClick={() => setOutId(b.id)}>
              <span className="pos">{b.position}</span>
              <span className="nm">{upperLast(b.name)}</span>
              <span className="ov" style={{ color: ratingColor(batterOverall(b.ratings)) }}>
                {batterOverall(b.ratings)}
              </span>
            </button>
          ))}
        </div>
      );
    } else {
      const out = def.team.lineup.find((b) => b.id === outId)!;
      hint = `Chi entra per ${upperLast(out.name)} (${out.position})?`;
      incoming = def.team.bench.map((b) => ({
        id: b.id,
        player: b,
        subtitle: `entra in ${out.position}`,
        onPick: () => {
          act((g) => substituteFielder(g, defenseSide(g), outId, b.id));
          onClose();
        },
      }));
    }
  } else {
    // pinchrun
    emptyMsg = 'Nessun giocatore in panchina.';
    const occupied = [0, 1, 2].filter((i) => live.bases[i]);
    if (outBase == null) {
      hint = 'Quale corridore sostituire?';
      targets = (
        <div className="sub-targets">
          {occupied.map((i) => {
            const r = live.bases[i]!.batter;
            return (
              <button key={i} className="sub-target" onClick={() => setOutBase(i)}>
                <span className="pos">{BASE_LABEL[i]}</span>
                <span className="nm">{upperLast(r.name)}</span>
                <span className="ov" style={{ color: ratingColor(batterOverall(r.ratings)) }}>
                  {batterOverall(r.ratings)}
                </span>
              </button>
            );
          })}
        </div>
      );
    } else {
      const r = live.bases[outBase]!.batter;
      hint = `Chi corre per ${upperLast(r.name)} (${BASE_LABEL[outBase]})?`;
      incoming = off.team.bench.map((b) => ({
        id: b.id,
        player: b,
        subtitle: `panchina · VEL ${b.ratings.speed}`,
        onPick: () => {
          act((g) => pinchRun(g, offenseSide(g), outBase, b.id));
          onClose();
        },
      }));
    }
  }

  const statCols = incoming.length > 0 ? subRatingKeys(incoming[0].player) : [];

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal submodal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{SUB_TITLE[mode]}</div>
          <button className="modal-close" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="sub-hint">{hint}</div>
        {targets ?? (
          <div className="sub-list">
            {incoming.length === 0 ? (
              <div className="sub-empty">{emptyMsg}</div>
            ) : (
              <table className="ratings sub-tbl">
                <thead>
                  <tr>
                    <th title="Valore totale">OVR</th>
                    <th className="l">Giocatore</th>
                    {statCols.map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {incoming.map((it) => (
                    <SubRow key={it.id} player={it.player} subtitle={it.subtitle} onPick={it.onPick} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
