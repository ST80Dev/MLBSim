import type { Batter, Pitcher, Team } from '../engine/types';
import type { OffseasonSummary } from '../data/offseasonRun';
import { overallOf } from '../engine/value';
import { TeamBadge } from './widgets';
import { PlayerLink } from './player-modal';
import { salaryFmt } from './statlines';

// ---------------------------------------------------------------------------
// RIEPILOGO DI OFF-SEASON (Fase 5B) — il modale che si apre dopo il rollover
// automatico: cosa è successo tra una stagione e l'altra (ritiri, draft, mercato),
// con focus sulla franchigia gestita. Solo UI: legge un `OffseasonSummary` puro.
// ---------------------------------------------------------------------------

type Player = Batter | Pitcher;

export interface RolloverRecapData {
  summary: OffseasonSummary;
  /** Lega dell'anno NUOVO (per risolvere i nomi dei prospetti e le rose). */
  nextLeague: Team[];
  /** Squadra gestita (nuova versione, per il focus franchigia). */
  managedId: string;
  /** Id dei giocatori che erano nella rosa gestita PRIMA del rollover (per i ritiri). */
  managedBeforeIds: string[];
  /** Campione della stagione appena conclusa, se disponibile. */
  championId?: string;
}

export function RolloverRecap({
  data,
  onClose,
}: {
  data: RolloverRecapData;
  onClose: () => void;
}) {
  const { summary, nextLeague, managedId, managedBeforeIds, championId } = data;
  const managed = nextLeague.find((t) => t.id === managedId);
  const champ = championId ? nextLeague.find((t) => t.id === championId) : undefined;
  const beforeSet = new Set(managedBeforeIds);

  // Ritiri: notabili di lega (per overall) + quelli della TUA franchigia.
  const retiredSorted = [...summary.retired].sort((a, b) => overallOf(b) - overallOf(a));
  const myRetired = retiredSorted.filter((p) => beforeSet.has(p.id));
  const topRetired = retiredSorted.slice(0, 6);

  // Mappa id → giocatore nella lega nuova (per risolvere prospetti e nuovi arrivi).
  const byId = new Map<string, Player>();
  for (const t of nextLeague) {
    for (const p of [
      ...t.lineup, ...t.bench, ...t.reserveBatters,
      ...t.rotation, ...t.bullpen, ...t.reservePitchers,
    ]) {
      byId.set(p.id, p);
    }
  }

  // Draft: le scelte della squadra gestita, risolte a giocatore.
  const myPicks = summary.draftPicks
    .filter((p) => p.teamId === managedId)
    .map((p) => byId.get(p.playerId))
    .filter((p): p is Player => !!p);

  // Mercato: transazioni della squadra gestita + totali di lega.
  const myTxns = summary.log.filter((t) => t.teamId === managedId);
  const totals = summary.log.reduce(
    (acc, t) => ((acc[t.kind] = (acc[t.kind] ?? 0) + 1), acc),
    {} as Record<string, number>,
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal recap-modal rollover-recap" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Off-season · anno {summary.year} → {summary.year + 1}</h2>
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>

        {champ && (
          <div className={`card po-champion${champ.id === managedId ? ' mine' : ''}`}>
            <TeamBadge team={champ} size={40} />
            <div>
              <div className="po-champ-title">🏆 Campione anno {summary.year}</div>
              <div className="po-champ-name">{champ.name}</div>
            </div>
          </div>
        )}

        <div className="recap-grid">
          {/* --- La tua franchigia --- */}
          {managed && (
            <section className="recap-sec">
              <h3>La tua franchigia · {managed.abbrev}</h3>

              <div className="recap-block">
                <div className="recap-lbl">Ritiri</div>
                {myRetired.length ? (
                  <ul className="recap-list">
                    {myRetired.map((p) => (
                      <li key={p.id}>
                        <PlayerLink player={p}>{p.name}</PlayerLink> · {overallOf(p)} OVR · {p.age} anni
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">Nessun ritiro in rosa.</div>
                )}
              </div>

              <div className="recap-block">
                <div className="recap-lbl">Scelte al draft</div>
                {myPicks.length ? (
                  <ul className="recap-list">
                    {myPicks.map((p) => (
                      <li key={p.id}>
                        <PlayerLink player={p}>{p.name}</PlayerLink> · {overallOf(p)} OVR
                        {' '}(pot. {p.potential}) · {p.age} anni
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">Nessuna scelta.</div>
                )}
              </div>

              <div className="recap-block">
                <div className="recap-lbl">Mercato</div>
                {myTxns.length ? (
                  <ul className="recap-list">
                    {myTxns.map((t, i) => (
                      <li key={i}>
                        <span className={`txn-tag ${t.kind}`}>
                          {t.kind === 'release' ? 'Svincolo' : t.kind === 'sign' ? 'Firma' : 'Scambio'}
                        </span>{' '}
                        {t.playerName} · {salaryFmt(t.salary)}
                        {t.kind === 'trade' && t.sentName ? ` (per ${t.sentName})` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="muted">Nessun movimento.</div>
                )}
              </div>
            </section>
          )}

          {/* --- Attorno alla lega --- */}
          <section className="recap-sec">
            <h3>In giro per la lega</h3>

            <div className="recap-block">
              <div className="recap-lbl">Ritiri illustri</div>
              <ul className="recap-list">
                {topRetired.map((p) => (
                  <li key={p.id}>
                    <PlayerLink player={p}>{p.name}</PlayerLink> · {overallOf(p)} OVR · {p.age} anni
                  </li>
                ))}
              </ul>
            </div>

            <div className="recap-block recap-totals">
              <div><b>{summary.retired.length}</b> ritiri</div>
              <div><b>{summary.draftPicks.length}</b> scelte al draft</div>
              <div><b>{totals.release ?? 0}</b> svincoli</div>
              <div><b>{totals.sign ?? 0}</b> firme</div>
              <div><b>{totals.trade ?? 0}</b> mosse di scambio</div>
            </div>
          </section>
        </div>

        <div className="modal-foot">
          <button className="btn primary" onClick={onClose}>
            Inizia l'anno {summary.year + 1} ▸
          </button>
        </div>
      </div>
    </div>
  );
}
