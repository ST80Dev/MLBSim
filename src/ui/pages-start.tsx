import { useState } from 'react';
import type { Team, Batter, Pitcher } from '../engine/types';
import type { LeagueMode, LeagueSource } from '../data/leagueMode';
import { teamPayroll, outerWall, capZone } from '../data/leagueMode';
import { byDivision, teamById, LEAGUE_LABEL, DIVISION_LABEL } from '../data/league';
import { batterOverall, pitcherOverall } from '../engine/ratings';
import { teamStrength } from '../engine/strength';
import { ratingColor, upperLast } from './format';
import { HISTORICAL_YEARS, DEFAULT_HISTORICAL_YEAR } from '../data/historical/league';
import { TeamBadge, CapIndicator, StrengthBars } from './widgets';
import { OvrBadge } from './rating-widgets';
import type { SavedGame } from './types';

export function SavedGameCard({
  game,
  onLoad,
  onDelete,
}: {
  game: SavedGame;
  onLoad: (g: SavedGame) => void;
  onDelete: (slot: string) => void;
}) {
  const when = (() => {
    try {
      return new Date(game.updatedAt).toLocaleString('it-IT');
    } catch {
      return '';
    }
  })();
  const label = game.team ? `${game.team.abbrev} — ${game.team.name}` : game.managedTeamId ?? '—';
  const played = game.day > 0 || game.record.w + game.record.l > 0;
  return (
    <div className="save-card">
      <div className="save-badge">
        {game.team ? <TeamBadge team={game.team} size={34} /> : <span className="sc-icon">💾</span>}
      </div>
      <div className="save-info">
        <div className="save-name">{label}</div>
        <div className="save-meta">
          {game.source === 'historical' ? 'Storica' : 'Generata'} · Anno {game.year} ·{' '}
          {played ? `giornata ${game.day} · ${game.record.w}-${game.record.l}` : 'nuova'}
        </div>
        {when && <div className="save-when muted">{when}</div>}
      </div>
      <div className="save-actions">
        <button className="btn primary" onClick={() => onLoad(game)}>
          Continua ▸
        </button>
        <button
          className="btn ghost danger"
          title="Elimina partita"
          onClick={() => {
            if (confirm(`Eliminare la partita ${label}? L'operazione è irreversibile.`)) {
              onDelete(game.slot);
            }
          }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

/** Hub iniziale: continua una partita salvata (caricamento) o iniziane una nuova. */
/** Occhiello (una riga) per ciascuna annata storica giocabile. */
const HISTORICAL_YEAR_BLURB: Record<number, string> = {
  1997: 'Griffey Jr. da 56 HR e Larry Walker MVP, Roger Clemens di nuovo Cy Young. Solo 28 squadre: Arizona e Tampa Bay debuttano nel 1998.',
  1998: "L'estate dei fuoricampo: McGwire 70, Sosa 66. Arrivano Diamondbacks e Devil Rays, gli Yankees vincono 114 gare.",
  1999: "L'attacco da 1009 punti di Cleveland, il Pedro Martinez da 2.07/313K, e tutti gli altri.",
  2000: 'Offesa alle stelle e il Pedro Martinez da 1.74 di ERA: forse la miglior stagione da lanciatore dell\'epoca.',
  2001: 'I 73 fuoricampo di Barry Bonds, i 372 K di Randy Johnson, l\'esordio di Ichiro da .350 e 242 valide.',
  2002: 'Bonds da .370 e OBP .582, gli A\'s di Moneyball con 20 vittorie di fila, Randy Johnson di nuovo a 334 K.',
  2003: 'Il breakout di Pujols (.359/43 HR), le 55/55 salvezze di Éric Gagné a 1.20 di ERA, Bonds ancora devastante.',
  2004: 'La stagione da .372/232 valide di Ichiro (record MLB), Bonds con OBP .609, i Cardinals da 105 vittorie.',
  2005: 'La rimonta iridata dei White Sox, Derrek Lee sfiora la Tripla Corona, gli Angels e i Nationals cambiano casa.',
};

export function StartScreen({
  savedGames,
  onLoad,
  onDelete,
  onNewGenerated,
  onNewHistorical,
}: {
  savedGames: SavedGame[];
  onLoad: (g: SavedGame) => void;
  onDelete: (slot: string) => void;
  onNewGenerated: () => void;
  onNewHistorical: (year: number) => void;
}) {
  const [histYear, setHistYear] = useState<number>(DEFAULT_HISTORICAL_YEAR);
  const blurb =
    HISTORICAL_YEAR_BLURB[histYear] ??
    `Le rose reali del ${histYear} dall'archivio (rose sbilanciate, cap morbido).`;
  return (
    <div className="app start-app">
      <div className="start-hero">
        <div className="start-title">
          <span className="logo">⚾</span> MLBSim
        </div>
        <div className="start-sub">
          Simulatore di baseball testuale · epoca alta offesa anni '90/2000
        </div>
      </div>

      {savedGames.length > 0 && (
        <section className="start-section">
          <div className="start-section-title">Continua una partita</div>
          <div className="save-list">
            {savedGames.map((g) => (
              <SavedGameCard key={g.slot} game={g} onLoad={onLoad} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}

      <section className="start-section">
        <div className="start-section-title">Nuova partita</div>
        <div className="start-cards">
          <button className="start-card" onClick={onNewGenerated}>
            <div className="sc-icon">🎲</div>
            <div className="sc-title">Nuova carriera generata</div>
            <div className="sc-desc">
              30 franchigie con rose procedurali da un seed casuale. Calendario 162 gare, cap a due
              confini, evoluzione negli anni.
            </div>
          </button>
          <div className="start-card start-card--historical">
            <div className="sc-icon">📜</div>
            <div className="sc-title">Stagione storica {histYear}</div>
            <div className="sc-year-picker" role="group" aria-label="Scegli l'annata">
              {HISTORICAL_YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  className={`sc-year${y === histYear ? ' is-active' : ''}`}
                  aria-pressed={y === histYear}
                  onClick={() => setHistYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="sc-desc">{blurb}</div>
            <button
              type="button"
              className="sc-start-btn"
              onClick={() => onNewHistorical(histYear)}
            >
              Inizia il {histYear} →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Dettaglio rosa di una squadra nella panoramica (modale). */
function TeamDetailModal({
  team,
  mode,
  onClose,
  onPick,
  canManage = true,
}: {
  team: Team;
  mode: LeagueMode;
  onClose: () => void;
  onPick: () => void;
  /** Se false (carriera avviata) la squadra gestita è bloccata: niente switch. */
  canManage?: boolean;
}) {
  const s = teamStrength(team);
  const pay = teamPayroll(team);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal team-detail" onClick={(e) => e.stopPropagation()}>
        <div className="td-head">
          <TeamBadge team={team} size={40} />
          <div className="td-id">
            <div className="td-name">{team.name}</div>
            <div className="muted">
              {LEAGUE_LABEL[team.league]} · {DIVISION_LABEL[team.division]}
            </div>
          </div>
          <button className="btn ghost" onClick={onClose} title="Chiudi">
            ✕
          </button>
        </div>
        <div className="td-strength">
          <div className="td-total">
            Forza <b style={{ color: ratingColor(s.total) }}>{s.total.toFixed(0)}</b>
          </div>
          <StrengthBars s={s} />
        </div>
        <CapIndicator payroll={pay} mode={mode} />
        <div className="td-rosters">
          <div className="td-col">
            <div className="card-title">Lineup</div>
            <table className="ratings">
              <thead>
                <tr>
                  <th className="l">Giocatore</th>
                  <th>Pos</th>
                  <th>Età</th>
                  <th>OVR</th>
                  <th>$M</th>
                </tr>
              </thead>
              <tbody>
                {team.lineup.map((b) => {
                  const o = batterOverall(b.ratings);
                  return (
                    <tr key={b.id}>
                      <td className="l">{upperLast(b.name)}</td>
                      <td>{b.position}</td>
                      <td>{b.age}</td>
                      <td style={{ color: ratingColor(o) }}>{o.toFixed(0)}</td>
                      <td>{b.salary.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="td-col">
            <div className="card-title">Rotazione</div>
            <table className="ratings">
              <thead>
                <tr>
                  <th className="l">Lanciatore</th>
                  <th>Ruolo</th>
                  <th>Età</th>
                  <th>OVR</th>
                  <th>$M</th>
                </tr>
              </thead>
              <tbody>
                {team.rotation.map((p) => {
                  const o = pitcherOverall(p.ratings);
                  return (
                    <tr key={p.id}>
                      <td className="l">{upperLast(p.name)}</td>
                      <td>{p.role}</td>
                      <td>{p.age}</td>
                      <td style={{ color: ratingColor(o) }}>{o.toFixed(0)}</td>
                      <td>{p.salary.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="td-foot">
          <span className="muted">Monte-ingaggi ${pay.toFixed(0)}M</span>
          {canManage ? (
            <button className="btn primary" onClick={onPick}>
              Gestisci questa squadra ▸
            </button>
          ) : (
            <span className="muted" title="La squadra gestita si sceglie a inizio carriera e non cambia in corso di stagione">
              🔒 Squadra gestita bloccata a stagione avviata
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Etichetta del tipo di gioco (sorgente della lega) per l'indicatore d'header.
 * Stessa vocabolario della SavedGameCard ("Storica"/"Generata"), per coerenza.
 */
function gameTypeLabel(source: LeagueSource): { icon: string; label: string } {
  return source === 'historical'
    ? { icon: '📜', label: 'Storica' }
    : { icon: '🎲', label: 'Generata' };
}

/**
 * Badge FISSO d'header: tipo di gioco + anno di stagione. Sempre visibile — dalla
 * panoramica lega a tutte le pagine di gioco — così il giocatore ha sempre
 * presente COSA sta giocando e in che stagione. L'anno è `season.year`:
 * PROGRESSIVO da 1 in modalità generata, ANNO REALE (+avanzamenti) in storica.
 */
export function GameInfoBadge({ source, year }: { source: LeagueSource; year: number }) {
  const { icon, label } = gameTypeLabel(source);
  const full = source === 'historical' ? `Stagione storica ${year}` : `Carriera generata · anno ${year}`;
  return (
    <div className="game-info" title={`Tipo di gioco: ${full}`}>
      <span className="gi-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="gi-type">{label}</span>
      <span className="gi-sep" aria-hidden="true">
        ·
      </span>
      <span className="gi-year">Anno {year}</span>
    </div>
  );
}

/** Panoramica lega: 30 squadre per division con forza e cap; scelta squadra. */
export function LeagueOverview({
  league,
  seed,
  mode,
  year,
  onPick,
  onBack,
  embedded = false,
}: {
  league: Team[];
  seed: number;
  mode: LeagueMode;
  /** Anno/stagione corrente, per il badge d'header (assente in modalità embedded). */
  year?: number;
  onPick: (id: string) => void;
  onBack?: () => void;
  /** Incorporata come pagina DENTRO la partita (usa la header di gioco): niente
   *  topbar né "Indietro" propri, così non si esce dal flusso di gioco. */
  embedded?: boolean;
}) {
  const [selId, setSelId] = useState<string>('');
  const groups = byDivision(league);
  const sel = selId ? teamById(league, selId) : undefined;
  return (
    <div className={embedded ? 'overview-embed' : 'app overview-app'}>
      {!embedded && (
        <header className="topbar">
          <div className="brand">
            <span className="logo">⚾</span> MLBSim <span className="phase">Panoramica lega</span>
          </div>
          {year != null && <GameInfoBadge source={mode.source} year={year} />}
          <div className="actions">
            <span className="muted seed-note">seed {seed}</span>
            <button className="btn" onClick={onBack}>
              ← Indietro
            </button>
          </div>
        </header>
      )}
      <div className="page overview-page">
        <div className="ov-legend">
          <span>
            {embedded ? 'Panoramica della lega' : 'Scegli la squadra da gestire'}. Forza 40-100 ·
            monte-ingaggi vs cap ${mode.cap.amount}M (muro ${outerWall(mode.cap.amount).toFixed(0)}M).
          </span>
          <span className="cap-legend">
            <span className="cap-chip under">Sotto</span>
            <span className="cap-chip tax">Tassa</span>
            <span className="cap-chip over">Oltre muro</span>
          </span>
        </div>
        {groups.map((g) => (
          <div className="ov-div" key={`${g.league}-${g.division}`}>
            <div className="ov-div-title">
              {LEAGUE_LABEL[g.league]} · {DIVISION_LABEL[g.division]}
            </div>
            <div className="ov-grid">
              {g.teams.map((t) => {
                const s = teamStrength(t);
                const pay = teamPayroll(t);
                const zone = capZone(pay, mode);
                return (
                  <button
                    key={t.id}
                    className={`ov-card${selId === t.id ? ' sel' : ''}`}
                    onClick={() => setSelId(t.id)}
                  >
                    <div className="ov-head">
                      <TeamBadge team={t} size={30} />
                      <div className="ov-name">
                        <div className="ov-abbrev">{t.abbrev}</div>
                        <div className="ov-full">{t.name}</div>
                      </div>
                      <div className="ov-total" style={{ color: ratingColor(s.total) }}>
                        {s.total.toFixed(0)}
                      </div>
                    </div>
                    <StrengthBars s={s} />
                    <div className="ov-cap">
                      <CapIndicator payroll={pay} mode={mode} compact />
                      <span className={`cap-chip ${zone}`}>${pay.toFixed(0)}M</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {sel && (
        <TeamDetailModal
          team={sel}
          mode={mode}
          onClose={() => setSelId('')}
          onPick={() => onPick(sel.id)}
          canManage={!embedded}
        />
      )}
    </div>
  );
}

export function FranchisePage({ team, mode }: { team: Team; mode: LeagueMode }) {
  const pay = teamPayroll(team);
  return (
    <div className="page">
      <div className="card">
        <div className="card-title">
          <TeamBadge team={team} size={22} /> Franchigia — {team.name}
        </div>
        <div className="fr-cap">
          <div className="card-sub">Monte-ingaggi vs salary cap</div>
          <CapIndicator payroll={pay} mode={mode} />
          <p className="muted">
            Cap a <b>due confini</b> (base + muro esterno): oggi è solo un <b>indicatore</b>.
            L'enforce (riconciliazione al rollover via pool, margine di sforamento per-squadra,
            scambi/rinnovi che rispettano il cap) arriva col layer gestionale. Vedi
            docs/franchise.md § Salary cap.
          </p>
        </div>
      </div>
      <RosterSalaryTable team={team} />
      <div className="card page-stub">
        <p className="muted">
          Stipendio unico annuale, cap soft, scambi a valore, draft basilare: i controlli di
          gestione (rinnovi, scambi) arriveranno qui.
        </p>
      </div>
    </div>
  );
}

interface FrRow {
  id: string;
  name: string;
  kind: 'B' | 'P';
  role: string;
  tier: string;
  age: number;
  ovr: number;
  salary: number;
}

/** Elenco COMPLETO della rosa (battitori + lanciatori) per giudicarla sul piano
 *  salariale: tipo, ruolo, reparto, età, rating e stipendio, ordinato per costo. */
function RosterSalaryTable({ team }: { team: Team }) {
  const bRow = (b: Batter, tier: string): FrRow => ({
    id: b.id,
    name: b.name,
    kind: 'B',
    role: b.position,
    tier,
    age: b.age,
    ovr: batterOverall(b.ratings),
    salary: b.salary,
  });
  const pRow = (p: Pitcher, tier: string): FrRow => ({
    id: p.id,
    name: p.name,
    kind: 'P',
    role: p.role,
    tier,
    age: p.age,
    ovr: pitcherOverall(p.ratings),
    salary: p.salary,
  });
  const rows: FrRow[] = [
    ...team.lineup.map((b) => bRow(b, 'Titolare')),
    ...team.bench.map((b) => bRow(b, 'Panca')),
    ...team.reserveBatters.map((b) => bRow(b, 'Riserva')),
    ...team.rotation.map((p) => pRow(p, 'Rotazione')),
    ...team.bullpen.map((p) => pRow(p, 'Bullpen')),
    ...team.reservePitchers.map((p) => pRow(p, 'Riserva')),
  ].sort((a, b) => b.salary - a.salary);

  const total = Math.round(rows.reduce((s, r) => s + r.salary, 0) * 10) / 10;
  const avgAge = rows.length ? Math.round((rows.reduce((s, r) => s + r.age, 0) / rows.length) * 10) / 10 : 0;

  return (
    <div className="card">
      <div className="card-title">
        Rosa completa{' '}
        <span className="card-sub">
          {rows.length} giocatori · monte-ingaggi ${total.toFixed(1)}M · età media {avgAge}
        </span>
      </div>
      <table className="ratings fr-roster">
        <thead>
          <tr>
            <th className="l">Giocatore</th>
            <th>Tipo</th>
            <th>Ruolo</th>
            <th>Reparto</th>
            <th>Età</th>
            <th>OVR</th>
            <th>$M</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="l">{upperLast(r.name)}</td>
              <td>
                <span className={`type-chip ${r.kind === 'B' ? 'bat' : 'pit'}`}>
                  {r.kind === 'B' ? 'Bat' : 'Lan'}
                </span>
              </td>
              <td>{r.role}</td>
              <td className="tier">{r.tier}</td>
              <td>{r.age}</td>
              <td className="ovr">
                <OvrBadge overall={r.ovr} />
              </td>
              <td className="sal">{r.salary.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
