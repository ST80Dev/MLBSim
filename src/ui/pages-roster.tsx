import { useState } from 'react';
import type { Batter, Pitcher, Position, Team } from '../engine/types';
import type { MatchArrangement } from '../data/persistence';
import { defaultArrangement, rosterBatters, rosterPitchers, validateArrangement, buildManagedTeam } from '../engine/arrangement';
import { autoLineup, FIELD_SLOTS } from '../engine/lineup';
import { ratingsAtPosition, canOccupy } from '../engine/positions';
import type { RotationState } from '../data/rotation';
import { suggestedStarter, restInfo } from '../data/rotation';
import type { SeasonState } from '../data/season';
import { batterOverall, pitcherOverall } from '../engine/ratings';
import { teamStrength } from '../engine/strength';
import { potentialRole } from '../data/generator';
import { projectBatterSeason, projectPitcherSeason, SEASON_GAMES } from '../data/projection';
import type { BatTier } from '../data/projection';
import { ratingColor } from './format';
import { seasonBatLine, seasonPitLine, defLine, ipFmt, pct3, rolesOf } from './statlines';
import type { BatLine, PitLine } from './statlines';
import { PlayerLink } from './player-modal';
import { Rating, OvrBadge, OvrBarCell, PotCell, SynthBadges } from './rating-widgets';
import { TeamBadge } from './widgets';
import { StatLegend, InfoDot } from './glossary';

type RosterStat = 'season' | 'last' | 'hist' | 'ratings';

const ROSTER_STAT_LABEL: Record<RosterStat, string> = {
  season: 'Stagione',
  last: 'Scorsa',
  hist: 'Storico',
  ratings: 'Caratteristiche',
};

// Colonne divise per schermata: ATTACCO (lineup) vs DIFESA (schieramento).
const BAT_ATK_COLS = ['G', 'AVG', 'OBP', 'SLG', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'SO', 'SB'];
const BAT_ATK_RATING_COLS = ['CON', 'POT', 'OCC', 'VEL'];
const BAT_DEF_COLS = ['G', 'E', 'A', 'PO', 'FLD%'];
const BAT_DEF_RATING_COLS = ['DIF', 'BRA', 'VEL'];
const PIT_COLS = ['W', 'L', 'G', 'GS', 'IP', 'ERA', 'H', 'BB', 'K', 'SVO', 'SV', 'WHIP', 'K/9'];
const PIT_RATING_COLS = ['DOM', 'CTR', 'MOV', 'PAT', 'RES', 'DIF'];

// Legenda delle sigle mostrate nel roster. Per le DOTI (rating) la descrizione
// dice SU COSA INFLUISCONO nel motore (fonte: docs/players-and-ratings.md); per
// le STATISTICHE dice cosa rappresentano. Divisa per sezione (attacco / difesa /
// lancio) cosi' l'icona "i" a fianco di ogni tabella apre solo il pezzo pertinente.

// Posizioni difensive sul campo semplificato (percentuali dentro il riquadro).
// Le CASELLE sono FISSE: si spostano i giocatori. Il DH sta fuori dal diamante.
const FIELD_LAYOUT: Array<{ pos: Position; x: number; y: number }> = [
  { pos: 'CF', x: 50, y: 11 },
  { pos: 'LF', x: 19, y: 26 },
  { pos: 'RF', x: 81, y: 26 },
  { pos: 'SS', x: 37, y: 46 },
  { pos: '2B', x: 63, y: 46 },
  { pos: '3B', x: 21, y: 61 },
  { pos: '1B', x: 79, y: 61 },
  { pos: 'C', x: 50, y: 88 },
];

/** Campo da baseball semplificato (vista dall'alto): erba a ventaglio tra le linee
 *  di foul, recinzione esterna, diamante interno di terra, basi e monte. Fa da
 *  sfondo alle caselle FISSE dei difensori (allineato al viewBox 4:3). */
function DefenseFieldSVG() {
  return (
    <svg className="def-svg" viewBox="0 0 320 240" preserveAspectRatio="none" aria-hidden="true">
      <path d="M160 216 L24 76 Q160 2 296 76 Z" className="ff-grass" />
      <path d="M24 76 Q160 2 296 76" className="ff-fence" />
      <line x1="160" y1="216" x2="24" y2="76" className="ff-foul" />
      <line x1="160" y1="216" x2="296" y2="76" className="ff-foul" />
      <path d="M160 214 L234 150 L160 90 L86 150 Z" className="ff-dirt" />
      <path d="M160 196 L214 150 L160 108 L106 150 Z" className="ff-ingrass" />
      <circle cx="160" cy="150" r="9" className="ff-mound" />
      <g className="ff-base">
        <rect x="155.5" y="209.5" width="9" height="9" transform="rotate(45 160 214)" />
        <rect x="229.5" y="145.5" width="9" height="9" transform="rotate(45 234 150)" />
        <rect x="155.5" y="85.5" width="9" height="9" transform="rotate(45 160 90)" />
        <rect x="81.5" y="145.5" width="9" height="9" transform="rotate(45 86 150)" />
      </g>
    </svg>
  );
}

/**
 * Ordina `pool` secondo la lista di id preferiti `pref` (quelli noti nell'ordine
 * indicato, poi il resto nell'ordine originale). Usato per le riserve battitori:
 * l'ordine scelto dal manager e' stabile e i nuovi arrivi finiscono in coda.
 */
function orderByPref<T extends { id: string }>(pool: T[], pref?: string[]): T[] {
  if (!pref || pref.length === 0) return pool;
  const byId = new Map(pool.map((x) => [x.id, x]));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const id of pref) {
    const x = byId.get(id);
    if (x && !seen.has(id)) {
      out.push(x);
      seen.add(id);
    }
  }
  for (const x of pool) if (!seen.has(x.id)) out.push(x);
  return out;
}

export function RosterPage({
  team,
  seed,
  initial,
  activeGame,
  season,
  playoffRot,
  todayStarter,
  onPickStarter,
  canPickStarter,
  onApply,
  onSave,
  onStart,
}: {
  team: Team;
  seed: number;
  initial?: MatchArrangement;
  activeGame: boolean;
  season: SeasonState;
  /** Contesto rotazione nei playoff (riposo più corto): assente in regular season. */
  playoffRot?: { rotation: RotationState; day: number } | null;
  todayStarter: string | null;
  onPickStarter: (id: string | null) => void;
  /** Vero in pre-gara di regular season: si sceglie il partente e conta il riposo. */
  canPickStarter: boolean;
  onApply: (arr: MatchArrangement) => void;
  onSave: (arr: MatchArrangement) => Promise<void>;
  onStart: () => void;
}) {
  const [tab, setTab] = useState<'fielders' | 'pitchers'>('fielders');
  const [fieldView, setFieldView] = useState<'lineup' | 'defense'>('lineup');
  const [arr, setArr] = useState<MatchArrangement>(() => initial ?? defaultArrangement(team));
  const [statMode, setStatMode] = useState<RosterStat>('ratings');
  const [drag, setDrag] = useState<{ id: string; from: string } | null>(null);
  const [over, setOver] = useState<string | null>(null); // bersaglio sotto il cursore
  const [legend, setLegend] = useState<'bat' | 'def' | 'pit' | null>(null); // popup sigle
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const batters = rosterBatters(team);
  const pitchers = rosterPitchers(team);
  const bById = new Map(batters.map((b) => [b.id, b]));
  const pById = new Map(pitchers.map((p) => [p.id, p]));
  // Riposo per-lanciatore (badge nelle liste) e partente effettivo del giorno.
  // Nei playoff vale la rotazione playoff (riposo del partente più corto); in
  // regular season quella di stagione. `rotDay` è l'indice-gara di riferimento.
  const rot = playoffRot ? playoffRot.rotation : season.rotation;
  const rotDay = playoffRot ? playoffRot.day : season.day;
  const rotLabel = playoffRot ? `playoff · gara ${rotDay + 1}` : `giornata ${season.day}`;
  const restById = new Map(
    restInfo(rot, pitchers.map((p) => p.id), rotDay).map((r) => [r.id, r]),
  );
  const suggestedSp = suggestedStarter(rot, arr.rotation, rotDay);
  const effectiveStarter =
    todayStarter && arr.rotation.includes(todayStarter) && restById.get(todayStarter)?.available
      ? todayStarter
      : suggestedSp;
  // "scelto" = l'utente ha confermato/scelto esplicitamente (todayStarter valido);
  // altrimenti si mostra il consigliato. Confermare = fissare todayStarter.
  const starterChosen = todayStarter != null && todayStarter === effectiveStarter;
  const lineup = arr.order.map((id) => bById.get(id)).filter(Boolean) as Batter[];
  const starterIds = new Set(arr.order);
  // Riserve = non-titolari, ORDINATE secondo la preferenza salvata (benchOrder):
  // gli id noti in quell'ordine, poi eventuali nuovi (es. un titolare appena
  // scaricato) in coda. Cosi' l'ordine scelto dal manager e' stabile e persistente.
  const benchPool = batters.filter((b) => !starterIds.has(b.id));
  const bench = orderByPref(benchPool, arr.benchOrder);
  const check = validateArrangement(team, arr);
  const ratingsMode = statMode === 'ratings';

  // Minutaggio realistico nella "scorsa"/"storico": la linea attesa NON e' 650 PA
  // per tutti. Si proietta per FASCIA di rosa (titolare/panca/riserva, dalle liste
  // originali della squadra) cosi' le riserve hanno PA/gare da riserve e i titolari
  // non giocano tutti 162 uguali (vedi data/projection.ts: eta' + ruolo + annata).
  const batTierOf = new Map<string, BatTier>();
  team.lineup.forEach((b) => batTierOf.set(b.id, 'starter'));
  team.bench.forEach((b) => batTierOf.set(b.id, 'bench'));
  team.reserveBatters.forEach((b) => batTierOf.set(b.id, 'reserve'));
  const projYear = () => season.year - (statMode === 'hist' ? 2 : 1);
  const projBat = (b: Batter): BatLine =>
    seasonBatLine(projectBatterSeason(b, batTierOf.get(b.id) ?? 'bench', { seed, year: projYear(), day: SEASON_GAMES }));
  const projPit = (p: Pitcher): PitLine =>
    seasonPitLine(projectPitcherSeason(p, { seed, year: projYear(), day: SEASON_GAMES }));
  const lastName = (n: string) => n.split(' ').slice(-1)[0] || n;
  const posRank = (p: Position) => FIELD_SLOTS.indexOf(p);
  const defOrder = [...lineup].sort(
    (a, b) => posRank(arr.defense[a.id] ?? a.position) - posRank(arr.defense[b.id] ?? b.position),
  );
  // Sintesi di squadra dello schieramento CORRENTE: si aggiorna a ogni mossa,
  // così si vede subito se una sostituzione migliora o peggiora. USA la STESSA
  // `teamStrength` della Panoramica lega (che include il LANCIO nell'OVR), così il
  // totale del Roster coincide con la "Forza" mostrata alla scelta squadra —
  // niente più OVR 82 nel Roster e 77 in panoramica.
  const built = buildManagedTeam(team, arr);
  // Panchina ORIGINALE (5 attivi), non quella di buildManagedTeam (che vi accorpa
  // anche le riserve profonde e diluirebbe la media): così il totale coincide
  // ESATTAMENTE con la "Forza" della Panoramica per l'assetto di default.
  const str = teamStrength({
    ...team,
    lineup: built.lineup,
    rotation: built.rotation,
    bullpen: built.bullpen,
  });
  const synth = { off: str.attack, def: str.defense, ovr: str.total };
  const staff = str.pitching;

  const update = (patch: Partial<MatchArrangement>) => {
    setArr((a) => ({ ...a, ...patch }));
    setSaveState('idle');
  };
  const reconcileOrder = (order: string[], participants: string[]): string[] => {
    const set = new Set(participants);
    const kept = order.filter((id) => set.has(id));
    const seen = new Set(kept);
    for (const id of participants) if (!seen.has(id)) kept.push(id);
    return kept;
  };

  // --- Fielders: operazioni --------------------------------------------
  const occupantOf = (slot: Position) =>
    Object.keys(arr.defense).find((id) => arr.defense[id] === slot);
  const setSlot = (slot: Position, x: string) => {
    const defense: Record<string, Position> = { ...arr.defense };
    const y = occupantOf(slot);
    const sx = defense[x];
    if (sx) {
      defense[x] = slot;
      if (y) defense[y] = sx;
    } else {
      if (y) delete defense[y];
      defense[x] = slot;
    }
    update({ defense, order: reconcileOrder(arr.order, Object.keys(defense)) });
  };
  // Riordino dell'ordine di battuta come SWAP: i due slot si SCAMBIANO e tutti
  // gli altri restano fermi (niente inserimento a scorrimento). La difesa, che e'
  // indipendente dall'ordine di battuta, non viene toccata.
  const reorderBatting = (targetId: string, draggedId: string) => {
    if (draggedId === targetId) return;
    const order = [...arr.order];
    const fromI = order.indexOf(draggedId);
    const toI = order.indexOf(targetId);
    if (fromI < 0 || toI < 0) return;
    [order[fromI], order[toI]] = [order[toI], order[fromI]];
    update({ order });
  };
  const substitute = (starterId: string, benchId: string) => {
    const order = arr.order.map((id) => (id === starterId ? benchId : id));
    const defense = { ...arr.defense };
    defense[benchId] = defense[starterId];
    delete defense[starterId];
    update({ order, defense });
  };
  const autoBat = () => update({ order: autoLineup(lineup).map((b) => b.id) });

  const dropLineupRow = (starterId: string) => {
    if (!drag) return;
    if (drag.from === 'lineup') reorderBatting(starterId, drag.id);
    else substitute(starterId, drag.id);
    setDrag(null);
  };
  const dropDefCell = (slot: Position) => {
    if (drag) {
      if (arr.order.includes(drag.id)) {
        setSlot(slot, drag.id); // gia' titolare: sposta/scambia la casella
      } else {
        // riserva trascinata sul campo: sostituisce chi occupa quella casella.
        const occ = occupantOf(slot);
        if (occ) substitute(occ, drag.id);
      }
    }
    setDrag(null);
  };
  // Riordino delle riserve come SWAP: le due riserve si scambiano di posto nella
  // preferenza (benchOrder), le altre restano ferme. Si parte dall'ordine mostrato.
  const reorderBench = (targetId: string, draggedId: string) => {
    if (draggedId === targetId) return;
    const ids = bench.map((b) => b.id);
    const fromI = ids.indexOf(draggedId);
    const toI = ids.indexOf(targetId);
    if (fromI < 0 || toI < 0) return;
    [ids[fromI], ids[toI]] = [ids[toI], ids[fromI]];
    update({ benchOrder: ids });
  };
  // Drop su una riga riserva: un TITOLARE trascinato qui (dalla lista battuta o
  // dalla difesa) fa lo swap e scende; una RISERVA trascinata su un'altra riserva
  // riordina la lista dei backup.
  const dropBenchRow = (benchId: string) => {
    if (drag && drag.id !== benchId) {
      if (arr.order.includes(drag.id)) substitute(drag.id, benchId);
      else reorderBench(benchId, drag.id);
    }
    setDrag(null);
  };

  // --- Pitchers: composizione staff via drag&drop ----------------------
  const usedP = new Set([...arr.rotation, ...arr.bullpen]);
  // Disponibili ORDINATI secondo la preferenza salvata (come le riserve battitori):
  // così la sezione è riordinabile via swap intra-lista.
  const availP = orderByPref(
    pitchers.filter((p) => !usedP.has(p.id)),
    arr.availPitchOrder,
  );
  // Regola UNIFICATA (niente scambio tra sezioni, che disorientava):
  //  - INTRA-sezione (stessa lista, rilasciato su un altro lanciatore) = SWAP:
  //    i due si scambiano di posto. È l'UNICO modo per cambiare posizione dentro
  //    la sezione (rotazione: chi parte per primo; bullpen: ordine d'uso).
  //  - INTER-sezione = AGGIUNTA alla sezione di destinazione: il lanciatore si
  //    sposta nella lista target (in posizione se rilasciato su una riga, in coda
  //    se sull'area vuota) e lascia la sezione di partenza. Verso "Disponibili"
  //    torna in riserva. Le sezioni hanno taglia LIBERA (unico vincolo: almeno
  //    uno starter, vedi validateArrangement) — così si può ridurre la rotazione
  //    e poi riaggiungere un partente senza slot bloccati.
  const placePitcher = (toList: 'rotation' | 'bullpen' | 'avail', targetId?: string) => {
    if (!drag) return;
    const id = drag.id;
    if (drag.from === toList && targetId && id !== targetId) {
      // SWAP intra-sezione (vale anche per i Disponibili, riordinati via
      // `availPitchOrder`): i due si scambiano di posto, gli altri restano fermi.
      const swap = (list: string[]) => {
        const a = list.indexOf(id);
        const b = list.indexOf(targetId);
        if (a < 0 || b < 0) return list;
        const next = [...list];
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      };
      if (toList === 'avail') {
        update({ availPitchOrder: swap(availP.map((p) => p.id)) });
      } else {
        update(toList === 'rotation' ? { rotation: swap(arr.rotation) } : { bullpen: swap(arr.bullpen) });
      }
      setDrag(null);
      return;
    }
    let rotation = arr.rotation.filter((x) => x !== id);
    let bullpen = arr.bullpen.filter((x) => x !== id);
    const insert = (list: string[]) => {
      if (targetId && list.includes(targetId)) {
        const i = list.indexOf(targetId);
        return [...list.slice(0, i), id, ...list.slice(i)];
      }
      return [...list, id];
    };
    if (toList === 'rotation') rotation = insert(rotation);
    else if (toList === 'bullpen') bullpen = insert(bullpen);
    // Se il closer lascia il bullpen (va in rotazione o fuori), decade la nomina.
    const closerId = arr.closerId === id && toList !== 'bullpen' ? undefined : arr.closerId;
    update({ rotation, bullpen, closerId });
    setDrag(null);
  };
  // CL e' solo un'etichetta AGGIUNTIVA su un rilievo (tutti RP di base): il toggle
  // assegna/toglie il ruolo di closer a un singolo RP del bullpen. Uno solo alla
  // volta. In gara chiude le gare (buildManagedTeam lo mette per ultimo).
  const toggleCloser = (id: string) => {
    update({ closerId: arr.closerId === id ? undefined : id });
  };

  const save = async () => {
    setSaveState('saving');
    try {
      await onSave(arr);
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };
  const start = () => {
    onApply(arr);
    onStart();
  };

  // --- Celle statistiche: ATTACCO (lineup) e DIFESA (schieramento) separate --
  const batAtkCells = (b: Batter) => {
    if (ratingsMode) {
      const r = b.ratings;
      return (
        <>
          <Rating v={r.contact} /><Rating v={r.power} /><Rating v={r.eye} /><Rating v={r.speed} />
        </>
      );
    }
    const s = statMode === 'season' ? seasonBatLine(season.bat[b.id]) : projBat(b);
    return (
      <>
        <td>{s.g}</td><td>{pct3(s.avg)}</td><td>{pct3(s.obp)}</td><td>{pct3(s.slg)}</td>
        <td>{s.h}</td><td>{s.d2}</td><td>{s.t3}</td><td>{s.hr}</td><td>{s.rbi}</td>
        <td>{s.bb}</td><td>{s.so}</td><td>{s.sb}</td>
      </>
    );
  };
  const batDefCells = (b: Batter, pos: Position) => {
    const rp = ratingsAtPosition(b, pos);
    if (ratingsMode) {
      return (
        <>
          <Rating v={rp.fielding} /><Rating v={rp.arm} /><Rating v={rp.speed} />
        </>
      );
    }
    const g = statMode === 'season' ? seasonBatLine(season.bat[b.id]).g : projBat(b).g;
    const d = defLine(pos, g, rp.fielding);
    return (
      <>
        <td>{g}</td><td>{d.e}</td><td>{d.a}</td><td>{d.po}</td><td>{d.fp ? pct3(d.fp) : '—'}</td>
      </>
    );
  };
  const pitStatCells = (p: Pitcher) => {
    if (ratingsMode) {
      const r = p.ratings;
      return (
        <>
          <Rating v={r.stuff} /><Rating v={r.control} /><Rating v={r.movement} />
          <Rating v={r.groundball} /><Rating v={r.stamina} /><Rating v={r.fielding} />
        </>
      );
    }
    const s = statMode === 'season' ? seasonPitLine(season.pit[p.id]) : projPit(p);
    return (
      <>
        <td>{s.w}</td><td>{s.l}</td><td>{s.g}</td><td>{s.gs}</td><td>{ipFmt(s.ipOuts)}</td>
        <td>{s.ip ? s.era.toFixed(2) : '—'}</td>
        <td>{s.h}</td><td>{s.bb}</td><td>{s.k}</td><td>{s.svo}</td><td>{s.sv}</td>
        <td>{s.whip.toFixed(2)}</td><td>{s.k9.toFixed(1)}</td>
      </>
    );
  };
  const batAtkCols = ratingsMode ? BAT_ATK_RATING_COLS : BAT_ATK_COLS;
  const batDefCols = ratingsMode ? BAT_DEF_RATING_COLS : BAT_DEF_COLS;
  const pitCols = ratingsMode ? PIT_RATING_COLS : PIT_COLS;

  // Riga pitcher riusabile per Rotazione / Bullpen / Disponibili.
  const pitcherRow = (p: Pitcher, from: string, i: number) => {
    const ri = restById.get(p.id);
    const resting = ri ? ri.restRemaining > 0 : false;
    const available = ri ? ri.available : true;
    return (
    <tr
      key={p.id}
      className={`drow${drag?.id === p.id ? ' dragging' : ''}`}
      draggable
      onDragStart={() => setDrag({ id: p.id, from })}
      onDragEnd={() => setDrag(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.stopPropagation();
        placePitcher(from === 'avail' ? 'avail' : (from as 'rotation' | 'bullpen'), p.id);
      }}
    >
      <td className="n">{from === 'avail' ? '' : i + 1}</td>
      <td className="l grip">
        ⠿ <PlayerLink player={p}>{p.name}</PlayerLink>
      </td>
      {canPickStarter && (
        <td className="rest-col">
          <span
            className={`rest-badge${resting ? ' resting' : ' ready'}`}
            title={resting ? `A riposo: ${ri!.restRemaining} gare` : 'Pronto a lanciare'}
          >
            {resting ? `+${ri!.restRemaining}g` : 'pronto'}
          </span>
        </td>
      )}
      {canPickStarter && (
        <td className="pick-col">
          {from === 'rotation' && (
            <button
              type="button"
              className={`start-pick${effectiveStarter === p.id ? ' sel' : ''}`}
              disabled={!available}
              onClick={() => onPickStarter(p.id)}
              title={
                available ? 'Fai partire oggi questo lanciatore' : 'A riposo: non può partire oggi'
              }
            >
              {effectiveStarter === p.id ? '✓ parte' : 'parte'}
            </button>
          )}
        </td>
      )}
      <td>{p.age}</td>
      <td className="roles">
        <span
          className={`rolebadge${potentialRole(p.ratings) === 'SP/RP' ? ' swing' : ''}`}
          title="Ruoli potenziali (dalla resistenza): dove è schierato si vede dalla sezione"
        >
          {potentialRole(p.ratings)}
        </span>
        {from === 'bullpen' && (
          <button
            type="button"
            className={`cl-toggle${p.id === arr.closerId ? ' on' : ''}`}
            onClick={() => toggleCloser(p.id)}
            title={
              p.id === arr.closerId
                ? 'Closer (chiude le gare) — clic per togliere l’etichetta'
                : 'Dai a questo rilievo anche il ruolo di closer'
            }
          >
            CL
          </button>
        )}
      </td>
      <td className="ovr"><OvrBadge overall={pitcherOverall(p.ratings)} /></td>
      <OvrBarCell id={p.id} overall={pitcherOverall(p.ratings)} potential={p.potential} age={p.age} />
      <PotCell id={p.id} overall={pitcherOverall(p.ratings)} potential={p.potential} age={p.age} />
      {pitStatCells(p)}
    </tr>
    );
  };

  const pitTable = (
    title: string,
    hint: string,
    list: 'rotation' | 'bullpen' | 'avail',
    rows: Pitcher[],
  ) => (
    <div
      className="card"
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => placePitcher(list)}
    >
      <div className="card-title">
        {title} <InfoDot onClick={() => setLegend('pit')} /> <span className="card-sub">{hint}</span>
      </div>
      <div className="roster-scroll">
        <table className="ratings roster-tbl">
          <thead>
            <tr>
              <th className="n">#</th>
              <th className="l">Lanciatore</th>
              {canPickStarter && <th className="rest-col" title="Riposo residuo prima di poter rilanciare">RIP.</th>}
              {canPickStarter && <th className="pick-col" title="Partente del giorno (scegli nella rotazione)">PARTE</th>}
              <th title="Età">ETÀ</th>
              <th>RUOLO</th>
              <th title="Valore totale">OVR</th>
              <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
              <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
              {pitCols.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => pitcherRow(p, list, i))}
            {rows.length === 0 && (
              <tr>
                <td className="l" colSpan={(canPickStarter ? 9 : 7) + pitCols.length}>
                  {list === 'avail' ? 'Nessun disponibile.' : 'Trascina qui un lanciatore.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="page roster-page">
      <div className="subhead">
        <div className="subtabs">
          <button
            className={tab === 'fielders' ? 'subtab active' : 'subtab'}
            onClick={() => setTab('fielders')}
          >
            Fielders
          </button>
          <button
            className={tab === 'pitchers' ? 'subtab active' : 'subtab'}
            onClick={() => setTab('pitchers')}
          >
            Pitchers
          </button>
          {tab === 'fielders' && (
            <div className="seg view-seg">
              <button
                className={`seg-btn${fieldView === 'lineup' ? ' active' : ''}`}
                onClick={() => setFieldView('lineup')}
              >
                ⚾ Lineup
              </button>
              <button
                className={`seg-btn${fieldView === 'defense' ? ' active' : ''}`}
                onClick={() => setFieldView('defense')}
              >
                🛡 Difesa
              </button>
            </div>
          )}
        </div>

        <div className="rp-actions">
          <div className="seg stat-seg">
            {(['season', 'last', 'hist', 'ratings'] as RosterStat[]).map((m) => (
              <button
                key={m}
                className={`seg-btn${statMode === m ? ' active' : ''}`}
                onClick={() => setStatMode(m)}
              >
                {ROSTER_STAT_LABEL[m]}
              </button>
            ))}
          </div>
          {!check.ok && <span className="manage-warn inline">⚠ {check.errors[0]}</span>}
          <button className="btn" onClick={autoBat} title="Ordine di battuta automatico">
            ⚙ Auto
          </button>
          <button className="btn" onClick={() => onApply(arr)} disabled={!check.ok}>
            ✓ Applica
          </button>
          <button className="btn" onClick={save} disabled={!check.ok || saveState === 'saving'}>
            {saveState === 'saving' ? '… Salvataggio' : '💾 Salva'}
          </button>
          {activeGame && (
            <button className="btn primary" onClick={start} disabled={!check.ok}>
              ▶ Entra in campo
            </button>
          )}
          <span className={`save-state ${saveState}`}>
            {saveState === 'saved' && 'Salvato'}
            {saveState === 'error' && 'Errore (offline?)'}
          </span>
        </div>
      </div>

      <div className="team-synth">
        <span className="ts-team">
          <TeamBadge team={team} size={16} /> {team.abbrev}
        </span>
        <SynthBadges synth={synth} staff={staff} />
        <span className="ts-hint">sintesi dello schieramento attuale · si aggiorna a ogni mossa</span>
      </div>

      {statMode === 'season' && (
        <div className="page-note">
          Statistiche <b>reali</b> della stagione in corso (battuta e lancio), accumulate dalle
          partite giocate (giornata {season.day}). Le stat di <b>difesa</b> (E/A/PO/FLD%) sono
          ancora una stima: gli eventi difensivi non sono simulati dal motore.
        </div>
      )}
      {(statMode === 'last' || statMode === 'hist') && (
        <div className="page-note">
          Valori <b>attesi</b> derivati dai rating (backstory): finche' non completi stagioni
          gestite, "scorsa" e "storico" restano stime; poi si comporranno dagli anni realmente
          giocati.
        </div>
      )}

      {tab === 'fielders' ? (
        fieldView === 'lineup' ? (
          <div className="lineup-layout">
            <div className="card">
              <div className="card-title">
                Ordine di battuta <InfoDot onClick={() => setLegend('bat')} />{' '}
                <span className="card-sub">
                  trascina un titolare su un altro per scambiarli; un disponibile su un titolare = sostituzione
                </span>
              </div>
              <div className="roster-scroll">
                <table className="ratings roster-tbl">
                  <thead>
                    <tr>
                      <th className="n">#</th>
                      <th className="l">Giocatore</th>
                      <th className="age-h" title="Età">ETÀ</th>
                      <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                      <th title="Valore totale">OVR</th>
                      <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                      <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                      {batAtkCols.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineup.map((b, i) => (
                      <tr
                        key={b.id}
                        className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                        draggable
                        onDragStart={() => setDrag({ id: b.id, from: 'lineup' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                        onDrop={() => { dropLineupRow(b.id); setOver(null); }}
                      >
                        <td className="n">{i + 1}</td>
                        <td className="l grip">
                          ⠿ <PlayerLink player={b} pos={arr.defense[b.id] ?? b.position} tier={batTierOf.get(b.id)}>{b.name}</PlayerLink>
                        </td>
                        <td className="age">{b.age}</td>
                        <td className="roles">{rolesOf(b)}</td>
                        <td className="ovr"><OvrBadge overall={batterOverall(b.ratings)} /></td>
                        <OvrBarCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        <PotCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        {batAtkCells(b)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" onDragOver={(e) => e.preventDefault()}>
              <div className="card-title">
                Disponibili ({bench.length}) <InfoDot onClick={() => setLegend('bat')} />{' '}
                <span className="card-sub">trascina un titolare qui per scaricarlo · o riordina le riserve fra loro</span>
              </div>
              <div className="roster-scroll">
                <table className="ratings roster-tbl">
                  <thead>
                    <tr>
                      <th className="l">Giocatore</th>
                      <th className="age-h" title="Età">ETÀ</th>
                      <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                      <th title="Valore totale">OVR</th>
                      <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                      <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                      {batAtkCols.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bench.map((b) => (
                      <tr
                        key={b.id}
                        className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                        draggable
                        onDragStart={() => setDrag({ id: b.id, from: 'bench' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                        onDrop={() => { dropBenchRow(b.id); setOver(null); }}
                      >
                        <td className="l grip">
                          ⠿ <PlayerLink player={b} pos={b.position} tier={batTierOf.get(b.id) ?? 'bench'}>{b.name}</PlayerLink>
                        </td>
                        <td className="age">{b.age}</td>
                        <td className="roles">{rolesOf(b)}</td>
                        <td className="ovr"><OvrBadge overall={batterOverall(b.ratings)} /></td>
                        <OvrBarCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        <PotCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                        {batAtkCells(b)}
                      </tr>
                    ))}
                    {bench.length === 0 && (
                      <tr>
                        <td className="l" colSpan={6 + batAtkCols.length}>
                          Nessun disponibile.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="def-layout">
            <div className="def-col-list">
              <div className="card">
                <div className="card-title">
                  Per posizione <InfoDot onClick={() => setLegend('def')} />{' '}
                  <span className="card-sub">
                    dal ricevitore al n.9; trascina un nome (o una riserva) su una riga/casella
                  </span>
                </div>
                <div className="roster-scroll">
                  <table className="ratings roster-tbl">
                    <thead>
                      <tr>
                        <th title="Casella difensiva">POS</th>
                        <th className="l">Giocatore</th>
                        <th className="age-h" title="Età">ETÀ</th>
                        <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                        <th title="Valore totale">OVR</th>
                        <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                        <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                        {batDefCols.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {defOrder.map((b) => {
                        const pos = arr.defense[b.id] ?? b.position;
                        const outOfRole = !canOccupy(b, pos);
                        return (
                          <tr
                            key={b.id}
                            className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                            draggable
                            onDragStart={() => setDrag({ id: b.id, from: 'def' })}
                            onDragEnd={() => { setDrag(null); setOver(null); }}
                            onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                            onDrop={(e) => { e.stopPropagation(); dropDefCell(pos); setOver(null); }}
                          >
                            <td>
                              <span className={`pos${pos === b.position ? '' : ' moved'}`}>{pos}</span>
                              {outOfRole && ' ⚠'}
                            </td>
                            <td className="l grip">
                              ⠿ <PlayerLink player={b} pos={pos} tier={batTierOf.get(b.id)}>{b.name}</PlayerLink>
                            </td>
                            <td className="age">{b.age}</td>
                            <td className="roles">{rolesOf(b)}</td>
                            <td className="ovr"><OvrBadge overall={batterOverall(ratingsAtPosition(b, pos))} /></td>
                            <OvrBarCell id={b.id} overall={batterOverall(ratingsAtPosition(b, pos))} potential={b.potential} age={b.age} />
                            <PotCell id={b.id} overall={batterOverall(ratingsAtPosition(b, pos))} potential={b.potential} age={b.age} />
                            {batDefCells(b, pos)}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  Riserve ({bench.length}) <InfoDot onClick={() => setLegend('def')} />{' '}
                  <span className="card-sub">trascina su una casella per schierarle · un titolare qui lo scarica · fra riserve = riordina</span>
                </div>
                <div className="roster-scroll">
                  <table className="ratings roster-tbl">
                    <thead>
                      <tr>
                        <th className="l">Giocatore</th>
                        <th className="age-h" title="Età">ETÀ</th>
                        <th className="roles-h" title="Ruoli naturali">RUOLI</th>
                        <th title="Valore totale">OVR</th>
                        <th className="ovrbar-h" title="Barra overall (tratto chiaro = margine di crescita)"></th>
                        <th className="pot-h" title="Potenziale — tetto di crescita">MAX</th>
                        {batDefCols.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bench.map((b) => (
                        <tr
                          key={b.id}
                          className={`drow${drag?.id === b.id ? ' dragging' : ''}${over === b.id && drag?.id !== b.id ? ' over' : ''}`}
                          draggable
                          onDragStart={() => setDrag({ id: b.id, from: 'bench' })}
                          onDragEnd={() => { setDrag(null); setOver(null); }}
                          onDragOver={(e) => { e.preventDefault(); setOver(b.id); }}
                          onDrop={() => { dropBenchRow(b.id); setOver(null); }}
                        >
                          <td className="l grip">
                            ⠿ <PlayerLink player={b} pos={b.position} tier={batTierOf.get(b.id) ?? 'bench'}>{b.name}</PlayerLink>
                          </td>
                          <td className="age">{b.age}</td>
                          <td className="roles">{rolesOf(b)}</td>
                          <td className="ovr"><OvrBadge overall={batterOverall(b.ratings)} /></td>
                          <OvrBarCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                          <PotCell id={b.id} overall={batterOverall(b.ratings)} potential={b.potential} age={b.age} />
                          {batDefCells(b, b.position)}
                        </tr>
                      ))}
                      {bench.length === 0 && (
                        <tr>
                          <td className="l" colSpan={6 + batDefCols.length}>Nessuna riserva.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="def-col-field">
              <div className="card">
                <div className="card-title">
                  Schieramento{' '}
                  <span className="card-sub">le caselle sono FISSE: trascina i giocatori</span>
                </div>
                <div className="def-field">
                  <DefenseFieldSVG />
                  {FIELD_LAYOUT.map(({ pos, x, y }) => {
                    const id = occupantOf(pos);
                    const b = id ? bById.get(id) : undefined;
                    const outOfRole = b ? !canOccupy(b, pos) : false;
                    const natural = b ? pos === b.position : true;
                    const dif = b ? ratingsAtPosition(b, pos).fielding : 0;
                    return (
                      <div
                        key={pos}
                        className={`fpos${outOfRole ? ' warn' : ''}${over === `slot-${pos}` && drag ? ' over' : ''}${drag?.id === id ? ' dragging' : ''}`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        draggable={!!id}
                        onDragStart={() => id && setDrag({ id, from: 'def' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver(`slot-${pos}`); }}
                        onDrop={(e) => { e.stopPropagation(); dropDefCell(pos); setOver(null); }}
                        title={
                          b
                            ? natural
                              ? `${b.name} — DIF ${dif} (ruolo naturale)`
                              : `${b.name} — DIF ${dif} fuori ruolo (nat. ${b.ratings.fielding} in ${b.position})`
                            : undefined
                        }
                      >
                        <span className="fpos-lbl">{pos}</span>
                        <span className="fpos-name">
                          {b ? (
                            <PlayerLink player={b} pos={pos} tier={batTierOf.get(b.id)}>
                              {lastName(b.name)}
                            </PlayerLink>
                          ) : (
                            '—'
                          )}
                        </span>
                        {b && (
                          <span
                            className={`fpos-dif${natural ? '' : ' off'}`}
                            style={{ background: ratingColor(dif) }}
                          >
                            DIF {dif}
                            {!natural && (
                              <em className="difdelta">
                                {dif - b.ratings.fielding >= 0 ? '+' : ''}
                                {dif - b.ratings.fielding}
                              </em>
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {(() => {
                    const id = occupantOf('DH');
                    const b = id ? bById.get(id) : undefined;
                    return (
                      <div
                        className={`fpos dh${over === 'slot-DH' && drag ? ' over' : ''}${drag?.id === id ? ' dragging' : ''}`}
                        draggable={!!id}
                        onDragStart={() => id && setDrag({ id, from: 'def' })}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        onDragOver={(e) => { e.preventDefault(); setOver('slot-DH'); }}
                        onDrop={(e) => { e.stopPropagation(); dropDefCell('DH'); setOver(null); }}
                      >
                        <span className="fpos-lbl">DH</span>
                        <span className="fpos-name">
                          {b ? (
                            <PlayerLink player={b} pos={'DH'} tier={batTierOf.get(b.id)}>
                              {lastName(b.name)}
                            </PlayerLink>
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <>
          {canPickStarter && (
            <div className="card starter-bar">
              <span className="sb-label">
                Oggi parte:{' '}
                <b>{pById.get(effectiveStarter)?.lastName ?? '—'}</b>{' '}
                <span className="card-sub">
                  {starterChosen ? '(scelto)' : '(consigliato)'} · {rotLabel} · scegli
                  dall’elenco con “parte oggi”
                </span>
              </span>
              <span className="sb-actions">
                {!starterChosen && pById.get(effectiveStarter) && (
                  <button
                    className="btn small"
                    onClick={() => onPickStarter(effectiveStarter)}
                    title="Conferma il partente consigliato"
                  >
                    ✓ Conferma
                  </button>
                )}
                {todayStarter && (
                  <button
                    className="btn small ghost"
                    onClick={() => onPickStarter(null)}
                    title="Torna al partente consigliato (primo in ordine non a riposo)"
                  >
                    ↺ consigliato
                  </button>
                )}
              </span>
            </div>
          )}
          {pitTable(
            'Rotazione',
            canPickStarter
              ? '“parte oggi” sceglie il partente · trascina su un altro = riordina'
              : 'il primo parte · trascina su un altro = riordina',
            'rotation',
            arr.rotation.map((id) => pById.get(id)).filter(Boolean) as Pitcher[],
          )}
          {pitTable(
            'Bullpen',
            "ordine d'uso · trascina su un altro = riordina · CL nomina il closer",
            'bullpen',
            arr.bullpen.map((id) => pById.get(id)).filter(Boolean) as Pitcher[],
          )}
          {pitTable('Disponibili', 'trascina in Rotazione/Bullpen per aggiungerlo · su un altro = riordina', 'avail', availP)}
        </>
      )}

      {legend && <StatLegend section={legend} onClose={() => setLegend(null)} />}
    </div>
  );
}
