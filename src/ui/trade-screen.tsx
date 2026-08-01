import { useMemo, useState } from 'react';
import type { Batter, Pitcher, Team } from '../engine/types';
import type { LeagueMode } from '../data/leagueMode';
import { effectiveCap, teamPayroll } from '../data/leagueMode';
import { evaluateTrade, applyTrade } from '../data/trades';
import { overallOf, playerValue } from '../engine/value';
import { TeamBadge } from './widgets';
import { PlayerLink } from './player-modal';
import { salaryFmt } from './statlines';

// ---------------------------------------------------------------------------
// SCHERMATA SCAMBI (Fase 5B) — proponi uno scambio a una CPU; `evaluateTrade`
// decide (equità + cap + premio di consolidamento). In stagione fino alla trade
// deadline (~gara 103). Applicando, `applyTrade` sposta i giocatori e ricompone
// entrambe le rose; la lega diventa PERSISTITA (divergente dal seed).
// ---------------------------------------------------------------------------

type Player = Batter | Pitcher;
const isPitcher = (p: Player): p is Pitcher => 'role' in p;
const slotOf = (p: Player): string => (isPitcher(p) ? p.role : p.position);
const allPlayers = (t: Team): Player[] => [
  ...t.lineup, ...t.bench, ...t.reserveBatters,
  ...t.rotation, ...t.bullpen, ...t.reservePitchers,
];

function RosterPicker({
  team,
  selected,
  onToggle,
  side,
}: {
  team: Team;
  selected: Set<string>;
  onToggle: (id: string) => void;
  side: 'give' | 'get';
}) {
  const players = useMemo(
    () => [...allPlayers(team)].sort((a, b) => overallOf(b) - overallOf(a)),
    [team],
  );
  return (
    <div className="trade-roster">
      <div className="trade-roster-head">
        <TeamBadge team={team} size={26} />
        <span className="trade-roster-name">{team.name}</span>
        <span className="muted">${teamPayroll(team).toFixed(0)}M</span>
      </div>
      <div className="trade-roster-list">
        {players.map((p) => {
          const on = selected.has(p.id);
          return (
            <button
              key={p.id}
              className={`trade-row${on ? ` on ${side}` : ''}`}
              onClick={() => onToggle(p.id)}
              title={on ? 'Rimuovi dallo scambio' : 'Aggiungi allo scambio'}
            >
              <span className="trade-check">{on ? '✓' : ''}</span>
              <span className="trade-slot">{slotOf(p)}</span>
              <span className="trade-name">
                <PlayerLink player={p}>{p.name}</PlayerLink>
              </span>
              <span className="trade-ovr">{overallOf(p)}</span>
              <span className="trade-age muted">{p.age}a</span>
              <span className="trade-sal muted">{salaryFmt(p.salary)}</span>
              <span className="trade-val">{playerValue(p).toFixed(0)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TradeScreen({
  league,
  managedId,
  mode,
  seed,
  year,
  open,
  deadlineGame,
  currentGame,
  onCommit,
}: {
  league: Team[];
  managedId: string;
  mode: LeagueMode;
  seed: number;
  year: number;
  /** Finestra scambi aperta (in stagione, prima della deadline). */
  open: boolean;
  deadlineGame: number;
  currentGame: number;
  /** Applica lo scambio: riceve la nuova lega (rose ricomposte). */
  onCommit: (nextLeague: Team[], partnerId: string) => void;
}) {
  const me = league.find((t) => t.id === managedId) ?? league[0];
  const others = league.filter((t) => t.id !== me.id);
  const [partnerId, setPartnerId] = useState<string>(others[0]?.id ?? '');
  const partner = league.find((t) => t.id === partnerId) ?? others[0];
  const [give, setGive] = useState<Set<string>>(new Set());
  const [get, setGet] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void) => (id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setFn(next);
  };

  const giveP = allPlayers(me).filter((p) => give.has(p.id));
  const getP = partner ? allPlayers(partner).filter((p) => get.has(p.id)) : [];

  const evalRes = useMemo(() => {
    if (!partner) return null;
    return evaluateTrade(
      { fromHuman: giveP, fromAI: getP },
      { humanTeam: me, aiTeam: partner, mode, seed, year },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, partner, give, get, mode, seed, year]);

  const resetPartner = (id: string) => {
    setPartnerId(id);
    setGive(new Set());
    setGet(new Set());
  };

  const commit = () => {
    if (!partner || !evalRes?.accepted) return;
    const next = applyTrade(league, me.id, partner.id, [...give], [...get], seed, year);
    setGive(new Set());
    setGet(new Set());
    onCommit(next, partner.id);
  };

  if (!open) {
    return (
      <div className="page trade-page">
        <div className="page-note">
          Mercato scambi <b>chiuso</b>. In stagione si scambia solo fino alla{' '}
          <b>trade deadline</b> (gara {deadlineGame}); sei alla gara {currentGame}. Il mercato
          dei free agent e i riallineamenti tra CPU sono eventi di off-season.
        </div>
      </div>
    );
  }

  const nEmpty = giveP.length === 0 || getP.length === 0;

  return (
    <div className="page trade-page">
      <div className="page-note">
        Proponi uno scambio a una squadra CPU. La CPU accetta se lo scambio è <b>equo</b>
        {' '}(valore giocatore), rispetta il <b>cap</b> di entrambe e regge il{' '}
        <b>premio di consolidamento</b> (concentrare valore libera uno slot, frammentarlo lo
        occupa). Aperto fino alla gara {deadlineGame} · ora gara {currentGame}.
      </div>

      <div className="trade-partner-bar">
        <label className="muted">Squadra con cui trattare:</label>
        <select value={partnerId} onChange={(e) => resetPartner(e.target.value)}>
          {others.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="trade-cols">
        <div>
          <div className="trade-col-title">Cedi ({giveP.length})</div>
          <RosterPicker team={me} selected={give} onToggle={toggle(give, setGive)} side="give" />
        </div>
        <div>
          <div className="trade-col-title">Ricevi ({getP.length})</div>
          {partner && (
            <RosterPicker team={partner} selected={get} onToggle={toggle(get, setGet)} side="get" />
          )}
        </div>
      </div>

      {evalRes && (
        <div className={`trade-verdict ${evalRes.accepted ? 'ok' : 'no'}`}>
          <div className="trade-verdict-head">
            {nEmpty ? (
              <span className="muted">Seleziona almeno un giocatore per parte.</span>
            ) : (
              <>
                <span className="trade-verdict-tag">{evalRes.accepted ? '✓ Accettato' : '✕ Rifiutato'}</span>
                <span>{evalRes.reason}</span>
              </>
            )}
          </div>
          {!nEmpty && (
            <div className="trade-verdict-meta muted">
              <span>Δ valore (CPU): {evalRes.rawDelta > 0 ? '+' : ''}{evalRes.rawDelta}</span>
              {Math.abs(evalRes.premium) > 0.05 && (
                <span>premio slot: {evalRes.premium > 0 ? '+' : ''}{evalRes.premium}</span>
              )}
              <span>netto: {evalRes.adjustedDelta > 0 ? '+' : ''}{evalRes.adjustedDelta}</span>
              <span>tua rosa: {evalRes.humanCapOk ? 'cap ok' : 'sfora il cap'}</span>
              <span>
                {partner?.abbrev}: {evalRes.aiCapOk ? 'cap ok' : 'sfora il cap'} · tetto ${effectiveCap(mode, seed, partner!.id, year).toFixed(0)}M
              </span>
            </div>
          )}
          <button
            className="btn primary trade-commit"
            disabled={!evalRes.accepted}
            onClick={commit}
          >
            Conferma scambio ▸
          </button>
        </div>
      )}
    </div>
  );
}
