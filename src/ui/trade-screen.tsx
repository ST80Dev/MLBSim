import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Batter, Pitcher, Team } from '../engine/types';
import type { LeagueMode } from '../data/leagueMode';
import { effectiveCap, teamPayroll } from '../data/leagueMode';
import { evaluateTrade, applyTrade } from '../data/trades';
import { overallOf, playerValue } from '../engine/value';
import { TeamBadge } from './widgets';
import { PlayerLink } from './player-modal';
import { salaryFmt } from './statlines';
import { ratingColor } from './format';

// ---------------------------------------------------------------------------
// SCHERMATA SCAMBI (Fase 5B) — ricerca-prima, non squadra-prima.
//
// Flusso: si PRE-FILTRA tutta la lega (OVR, età, salary — singoli o in accoppiata)
// per trovare un obiettivo; scegliendolo, la sua squadra diventa il "partner"; poi
// si sfoglia la rosa di QUEL partner (divisa Battitori / Lanciatori, intestazioni
// fisse) per completare lo scambio alla pari. Un pannello di RIASSUNTO è sempre
// visibile: chi cedi, chi ricevi, il saldo dei salari e il verdetto della CPU.
//
// Uno scambio coinvolge UNA sola squadra CPU (vincolo di `evaluateTrade`/`applyTrade`):
// selezionare un giocatore di un'altra squadra cambia il partner. `evaluateTrade`
// decide (equità + cap + premio di consolidamento). In stagione fino alla trade
// deadline. Applicando, `applyTrade` ricompone entrambe le rose e la lega diventa
// PERSISTITA (divergente dal seed).
// ---------------------------------------------------------------------------

type Player = Batter | Pitcher;
const isPitcher = (p: Player): p is Pitcher => 'role' in p;
const slotOf = (p: Player): string => (isPitcher(p) ? p.role : p.position);
const battersOf = (t: Team): Batter[] => [...t.lineup, ...t.bench, ...t.reserveBatters];
const pitchersOf = (t: Team): Pitcher[] => [...t.rotation, ...t.bullpen, ...t.reservePitchers];
const allPlayers = (t: Team): Player[] => [...battersOf(t), ...pitchersOf(t)];
const byOvrDesc = (a: Player, b: Player) => overallOf(b) - overallOf(a);
const lastUpper = (name: string): string => (name.split(' ').slice(-1)[0] || name).toUpperCase();
const sumVal = (ps: Player[]): number => ps.reduce((s, p) => s + playerValue(p), 0);
const sumSal = (ps: Player[]): number => ps.reduce((s, p) => s + p.salary, 0);
const capFmt = (c: number): string => (c === Infinity ? 'nessun tetto' : `$${c.toFixed(0)}M`);

/** Quante righe di mercato mostrare per sezione prima di troncare (con avviso). */
const RESULT_CAP = 60;

interface Filters {
  ovrMin: number;
  ovrMax: number;
  ageMin: number;
  ageMax: number;
  salMin: number;
  salMax: number;
  kind: 'all' | 'bat' | 'pit';
}

const FILTER_DEFAULTS: Filters = {
  ovrMin: 40,
  ovrMax: 100,
  ageMin: 16,
  ageMax: 45,
  salMin: 0,
  salMax: 99,
  kind: 'all',
};

/** Riga giocatore cliccabile (toggle nello scambio). `teamAbbrev` mostra la
 *  colonna squadra (ricerca lega); `dim` sbiadisce i giocatori di squadre diverse
 *  dal partner attuale (cliccarli cambia partner). */
function TradeRow({
  p,
  teamAbbrev,
  on,
  side,
  dim,
  onToggle,
}: {
  p: Player;
  teamAbbrev?: string;
  on: boolean;
  side: 'give' | 'get';
  dim?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`trade-row${teamAbbrev ? ' wteam' : ''}${on ? ` on ${side}` : ''}${dim ? ' dim' : ''}`}
      onClick={onToggle}
      title={on ? 'Rimuovi dallo scambio' : 'Aggiungi allo scambio'}
    >
      <span className="trade-check">{on ? '✓' : ''}</span>
      {teamAbbrev && <span className="trade-team">{teamAbbrev}</span>}
      <span className="trade-slot">{slotOf(p)}</span>
      <span className="trade-name">
        <PlayerLink player={p}>{p.name}</PlayerLink>
      </span>
      <span className="trade-ovr" style={{ color: ratingColor(overallOf(p)) }}>
        {overallOf(p)}
      </span>
      <span className="trade-age muted">{p.age}a</span>
      <span className="trade-sal muted">{salaryFmt(p.salary)}</span>
      <span className="trade-val">{playerValue(p).toFixed(0)}</span>
    </button>
  );
}

/** Sezione con intestazione (titolo + colonne) FISSA in cima mentre si scorre. */
function TradeSection({
  title,
  wteam,
  note,
  children,
}: {
  title: string;
  wteam?: boolean;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="trade-sec">
      <div className="trade-sec-head">
        <div className="trade-sec-title">{title}</div>
        <div className={`trade-colhead${wteam ? ' wteam' : ''}`}>
          <span className="c" />
          {wteam && <span className="c">SQ</span>}
          <span className="c">POS</span>
          <span>Giocatore</span>
          <span className="r">OVR</span>
          <span className="r">ETÀ</span>
          <span className="r">SAL</span>
          <span className="r">VAL</span>
        </div>
      </div>
      <div className="trade-sec-rows">{children}</div>
      {note && <div className="trade-sec-note muted">{note}</div>}
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

  const [give, setGive] = useState<Set<string>>(new Set());
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [get, setGet] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>(FILTER_DEFAULTS);
  const [src, setSrc] = useState<'league' | 'partner'>('league');

  const partner = partnerId ? league.find((t) => t.id === partnerId) ?? null : null;

  // Pool di mercato: tutti i giocatori della lega tranne i miei, con la squadra.
  const marketPool = useMemo(
    () =>
      league
        .filter((t) => t.id !== me.id)
        .flatMap((t) => allPlayers(t).map((p) => ({ p, team: t }))),
    [league, me.id],
  );
  const maxSal = useMemo(
    () => Math.max(1, ...marketPool.map((m) => Math.ceil(m.p.salary))),
    [marketPool],
  );

  const giveP = allPlayers(me).filter((p) => give.has(p.id));
  const getP = partner ? allPlayers(partner).filter((p) => get.has(p.id)) : [];

  const toggleGive = (id: string) => {
    const next = new Set(give);
    next.has(id) ? next.delete(id) : next.add(id);
    setGive(next);
  };

  // Selezione di un giocatore da ricevere: se è del partner attuale lo si toggla;
  // altrimenti diventa il nuovo partner (uno scambio = una sola squadra).
  const pickGet = (p: Player, teamId: string) => {
    if (partnerId && teamId === partnerId) {
      const next = new Set(get);
      next.has(p.id) ? next.delete(p.id) : next.add(p.id);
      setGet(next);
    } else {
      setPartnerId(teamId);
      setGet(new Set([p.id]));
    }
  };

  const clearDeal = () => {
    setGive(new Set());
    setGet(new Set());
    setPartnerId(null);
    setSrc('league');
  };

  // --- Filtri di ricerca lega ------------------------------------------
  const passes = (p: Player): boolean => {
    if (filters.kind === 'bat' && isPitcher(p)) return false;
    if (filters.kind === 'pit' && !isPitcher(p)) return false;
    const o = overallOf(p);
    if (o < filters.ovrMin || o > filters.ovrMax) return false;
    if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
    if (p.salary < filters.salMin || p.salary > filters.salMax) return false;
    return true;
  };
  const matched = useMemo(
    () => marketPool.filter((m) => passes(m.p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marketPool, filters],
  );
  const matchedBat = matched.filter((m) => !isPitcher(m.p)).sort((a, b) => byOvrDesc(a.p, b.p));
  const matchedPit = matched.filter((m) => isPitcher(m.p)).sort((a, b) => byOvrDesc(a.p, b.p));
  const setF = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const filtersDirty =
    filters.ovrMin !== 40 ||
    filters.ovrMax !== 100 ||
    filters.ageMin !== 16 ||
    filters.ageMax !== 45 ||
    filters.salMin !== 0 ||
    filters.salMax !== 99 ||
    filters.kind !== 'all';

  // --- Valutazione + saldi ---------------------------------------------
  const evalRes = useMemo(() => {
    if (!partner) return null;
    return evaluateTrade(
      { fromHuman: giveP, fromAI: getP },
      { humanTeam: me, aiTeam: partner, mode, seed, year },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, partner, give, get, mode, seed, year]);

  const givenSal = sumSal(giveP);
  const gotSal = sumSal(getP);
  const salBalance = gotSal - givenSal; // + = assorbi ingaggi, − = liberi
  const myCap = effectiveCap(mode, seed, me.id, year);
  const partnerCap = partner ? effectiveCap(mode, seed, partner.id, year) : Infinity;
  const myNext = teamPayroll(me) - givenSal + gotSal;
  const partnerNext = partner ? teamPayroll(partner) - gotSal + givenSal : 0;

  const bothSides = giveP.length > 0 && getP.length > 0;

  const commit = () => {
    if (!partner || !evalRes?.accepted) return;
    const next = applyTrade(league, me.id, partner.id, [...give], [...get], seed, year);
    const pid = partner.id;
    clearDeal();
    onCommit(next, pid);
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

  // Chip di riepilogo (removibile) per un lato dello scambio.
  const chip = (p: Player, side: 'give' | 'get', onRemove: () => void) => (
    <button key={p.id} className={`trade-chip ${side}`} onClick={onRemove} title="Rimuovi dallo scambio">
      <span className="trade-chip-slot">{slotOf(p)}</span>
      <span className="trade-chip-nm">{lastUpper(p.name)}</span>
      <span className="trade-chip-ovr" style={{ color: ratingColor(overallOf(p)) }}>
        {overallOf(p)}
      </span>
      <span className="x">✕</span>
    </button>
  );

  return (
    <div className="page trade-page">
      <div className="page-note trade-note">
        Cerca un <b>obiettivo</b> in tutta la lega coi filtri (OVR · età · ingaggio), poi
        completa lo scambio con altri giocatori della sua squadra. La CPU accetta se lo scambio è{' '}
        <b>equo</b>, rispetta il <b>cap</b> di entrambe e regge il{' '}
        <b>premio di consolidamento</b>. Aperto fino alla gara {deadlineGame} · ora gara {currentGame}.
      </div>

      {/* ---- Riepilogo SEMPRE visibile --------------------------------- */}
      <div className={`trade-summary ${evalRes && bothSides ? (evalRes.accepted ? 'ok' : 'no') : ''}`}>
        <div className="trade-summary-cols">
          <div className="trade-sum-side give">
            <div className="trade-sum-head">
              <span className="trade-sum-tag give">Cedi</span>
              <span className="muted">({giveP.length})</span>
              <TeamBadge team={me} size={16} />
              <span className="trade-sum-team">{me.abbrev}</span>
            </div>
            <div className="trade-sum-chips">
              {giveP.length === 0 ? (
                <span className="muted trade-sum-empty">nessun giocatore selezionato</span>
              ) : (
                giveP.map((p) => chip(p, 'give', () => toggleGive(p.id)))
              )}
            </div>
            <div className="trade-sum-tot muted">
              Σ valore <b>{sumVal(giveP).toFixed(0)}</b> · Σ ingaggi <b>{salaryFmt(givenSal)}</b>
            </div>
          </div>

          <div className="trade-sum-side get">
            <div className="trade-sum-head">
              <span className="trade-sum-tag get">Ricevi</span>
              <span className="muted">({getP.length})</span>
              {partner ? (
                <>
                  <TeamBadge team={partner} size={16} />
                  <span className="trade-sum-team">{partner.abbrev}</span>
                </>
              ) : (
                <span className="muted">— nessun partner</span>
              )}
            </div>
            <div className="trade-sum-chips">
              {getP.length === 0 ? (
                <span className="muted trade-sum-empty">scegli un giocatore dalla ricerca</span>
              ) : (
                getP.map((p) => chip(p, 'get', () => pickGet(p, partner!.id)))
              )}
            </div>
            <div className="trade-sum-tot muted">
              Σ valore <b>{sumVal(getP).toFixed(0)}</b> · Σ ingaggi <b>{salaryFmt(gotSal)}</b>
            </div>
          </div>
        </div>

        <div className="trade-summary-balance">
          <span
            className={`trade-bal ${salBalance > 0.05 ? 'absorb' : salBalance < -0.05 ? 'shed' : 'even'}`}
            title="Variazione del TUO monte ingaggi dopo lo scambio"
          >
            Saldo ingaggi: {salBalance > 0 ? '+' : ''}
            {salBalance.toFixed(1)} M${' '}
            <em>
              {salBalance > 0.05 ? 'assorbi' : salBalance < -0.05 ? 'liberi' : 'in pari'}
            </em>
          </span>
          <span className={`trade-cap ${myNext > myCap + 1e-9 ? 'over' : ''}`}>
            Tua rosa: ${myNext.toFixed(0)}M / {capFmt(myCap)}
            {myNext > myCap + 1e-9 ? ' ⚠' : ''}
          </span>
          {partner && (
            <span className={`trade-cap ${partnerNext > partnerCap + 1e-9 ? 'over' : ''}`}>
              {partner.abbrev}: ${partnerNext.toFixed(0)}M / {capFmt(partnerCap)}
              {partnerNext > partnerCap + 1e-9 ? ' ⚠' : ''}
            </span>
          )}

          {evalRes && bothSides ? (
            <span className="trade-verdict-inline">
              <span className={`trade-verdict-tag ${evalRes.accepted ? 'ok' : 'no'}`}>
                {evalRes.accepted ? '✓ Accettato' : '✕ Rifiutato'}
              </span>
              <span className="muted">{evalRes.reason}</span>
              <span className="muted trade-verdict-nums">
                Δ {evalRes.rawDelta > 0 ? '+' : ''}
                {evalRes.rawDelta}
                {Math.abs(evalRes.premium) > 0.05 &&
                  ` · premio ${evalRes.premium > 0 ? '+' : ''}${evalRes.premium}`}
                {' · netto '}
                {evalRes.adjustedDelta > 0 ? '+' : ''}
                {evalRes.adjustedDelta}
              </span>
            </span>
          ) : (
            <span className="muted">Seleziona almeno un giocatore per parte.</span>
          )}

          <div className="trade-summary-actions">
            {(giveP.length > 0 || getP.length > 0) && (
              <button className="btn sm" onClick={clearDeal} title="Svuota la proposta">
                Azzera
              </button>
            )}
            <button
              className="btn primary trade-commit"
              disabled={!evalRes?.accepted}
              onClick={commit}
            >
              Conferma scambio ▸
            </button>
          </div>
        </div>
      </div>

      {/* ---- Corpo: la tua rosa | mercato ------------------------------ */}
      <div className="trade-body">
        <div className="trade-panel">
          <div className="trade-panel-head">
            <TeamBadge team={me} size={22} />
            <span className="trade-panel-name">{me.name}</span>
            <span className="trade-panel-sub muted">
              ceduti selezionati · ${teamPayroll(me).toFixed(0)}M
            </span>
          </div>
          <div className="trade-scroll">
            <TradeSection title={`⚾ Battitori · ${battersOf(me).length}`}>
              {[...battersOf(me)].sort(byOvrDesc).map((p) => (
                <TradeRow
                  key={p.id}
                  p={p}
                  on={give.has(p.id)}
                  side="give"
                  onToggle={() => toggleGive(p.id)}
                />
              ))}
            </TradeSection>
            <TradeSection title={`✦ Lanciatori · ${pitchersOf(me).length}`}>
              {[...pitchersOf(me)].sort(byOvrDesc).map((p) => (
                <TradeRow
                  key={p.id}
                  p={p}
                  on={give.has(p.id)}
                  side="give"
                  onToggle={() => toggleGive(p.id)}
                />
              ))}
            </TradeSection>
          </div>
        </div>

        <div className="trade-panel">
          <div className="trade-panel-head">
            <span className="trade-panel-name">Ricevi</span>
            <div className="seg sm trade-src">
              <button
                className={`seg-btn${src === 'league' ? ' active' : ''}`}
                onClick={() => setSrc('league')}
              >
                Tutta la lega
              </button>
              <button
                className={`seg-btn${src === 'partner' ? ' active' : ''}`}
                disabled={!partner}
                title={partner ? `Sfoglia la rosa di ${partner.abbrev}` : 'Scegli prima un obiettivo'}
                onClick={() => partner && setSrc('partner')}
              >
                Solo {partner?.abbrev ?? '—'}
              </button>
            </div>
          </div>

          {src === 'league' ? (
            <>
              <div className="trade-filters">
                <div className="seg sm trade-kind">
                  {(['all', 'bat', 'pit'] as const).map((k) => (
                    <button
                      key={k}
                      className={`seg-btn${filters.kind === k ? ' active' : ''}`}
                      onClick={() => setF({ kind: k })}
                    >
                      {k === 'all' ? 'Tutti' : k === 'bat' ? 'Battitori' : 'Lanciatori'}
                    </button>
                  ))}
                </div>
                <div className="trade-filt">
                  <span className="trade-filt-lbl">OVR</span>
                  <div className="trade-range">
                    <input
                      type="number"
                      min={40}
                      max={100}
                      value={filters.ovrMin}
                      onChange={(e) => setF({ ovrMin: Number(e.target.value) || 40 })}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      min={40}
                      max={100}
                      value={filters.ovrMax}
                      onChange={(e) => setF({ ovrMax: Number(e.target.value) || 100 })}
                    />
                  </div>
                </div>
                <div className="trade-filt">
                  <span className="trade-filt-lbl">Età</span>
                  <div className="trade-range">
                    <input
                      type="number"
                      min={16}
                      max={45}
                      value={filters.ageMin}
                      onChange={(e) => setF({ ageMin: Number(e.target.value) || 16 })}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      min={16}
                      max={45}
                      value={filters.ageMax}
                      onChange={(e) => setF({ ageMax: Number(e.target.value) || 45 })}
                    />
                  </div>
                </div>
                <div className="trade-filt">
                  <span className="trade-filt-lbl">Ingaggio M$</span>
                  <div className="trade-range">
                    <input
                      type="number"
                      min={0}
                      max={maxSal}
                      step={0.5}
                      value={filters.salMin}
                      onChange={(e) => setF({ salMin: Number(e.target.value) || 0 })}
                    />
                    <span>–</span>
                    <input
                      type="number"
                      min={0}
                      max={maxSal}
                      step={0.5}
                      value={filters.salMax}
                      onChange={(e) => setF({ salMax: Number(e.target.value) || 99 })}
                    />
                  </div>
                </div>
                {filtersDirty && (
                  <button
                    className="btn sm trade-filt-reset"
                    onClick={() => setFilters(FILTER_DEFAULTS)}
                    title="Azzera i filtri"
                  >
                    ↺ Filtri
                  </button>
                )}
                <span className="trade-filt-count muted">
                  {matched.length} giocator{matched.length === 1 ? 'e' : 'i'}
                </span>
              </div>

              {partner && (
                <div className="trade-hint muted">
                  Obiettivo da <b>{partner.abbrev}</b>: apri «Solo {partner.abbrev}» per
                  aggiungere altri suoi giocatori e pareggiare lo scambio.
                </div>
              )}

              <div className="trade-scroll">
                {matched.length === 0 ? (
                  <div className="trade-empty muted">Nessun giocatore coi filtri attuali.</div>
                ) : (
                  <>
                    {filters.kind !== 'pit' && matchedBat.length > 0 && (
                      <TradeSection
                        title={`⚾ Battitori · ${matchedBat.length}`}
                        wteam
                        note={
                          matchedBat.length > RESULT_CAP
                            ? `+${matchedBat.length - RESULT_CAP} altri — affina i filtri`
                            : undefined
                        }
                      >
                        {matchedBat.slice(0, RESULT_CAP).map(({ p, team }) => (
                          <TradeRow
                            key={p.id}
                            p={p}
                            teamAbbrev={team.abbrev}
                            on={get.has(p.id)}
                            side="get"
                            dim={!!partnerId && team.id !== partnerId}
                            onToggle={() => pickGet(p, team.id)}
                          />
                        ))}
                      </TradeSection>
                    )}
                    {filters.kind !== 'bat' && matchedPit.length > 0 && (
                      <TradeSection
                        title={`✦ Lanciatori · ${matchedPit.length}`}
                        wteam
                        note={
                          matchedPit.length > RESULT_CAP
                            ? `+${matchedPit.length - RESULT_CAP} altri — affina i filtri`
                            : undefined
                        }
                      >
                        {matchedPit.slice(0, RESULT_CAP).map(({ p, team }) => (
                          <TradeRow
                            key={p.id}
                            p={p}
                            teamAbbrev={team.abbrev}
                            on={get.has(p.id)}
                            side="get"
                            dim={!!partnerId && team.id !== partnerId}
                            onToggle={() => pickGet(p, team.id)}
                          />
                        ))}
                      </TradeSection>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            partner && (
              <>
                <div className="trade-panel-head sub">
                  <TeamBadge team={partner} size={20} />
                  <span className="trade-panel-name">{partner.name}</span>
                  <span className="trade-panel-sub muted">${teamPayroll(partner).toFixed(0)}M</span>
                </div>
                <div className="trade-scroll">
                  <TradeSection title={`⚾ Battitori · ${battersOf(partner).length}`}>
                    {[...battersOf(partner)].sort(byOvrDesc).map((p) => (
                      <TradeRow
                        key={p.id}
                        p={p}
                        on={get.has(p.id)}
                        side="get"
                        onToggle={() => pickGet(p, partner.id)}
                      />
                    ))}
                  </TradeSection>
                  <TradeSection title={`✦ Lanciatori · ${pitchersOf(partner).length}`}>
                    {[...pitchersOf(partner)].sort(byOvrDesc).map((p) => (
                      <TradeRow
                        key={p.id}
                        p={p}
                        on={get.has(p.id)}
                        side="get"
                        onToggle={() => pickGet(p, partner.id)}
                      />
                    ))}
                  </TradeSection>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
