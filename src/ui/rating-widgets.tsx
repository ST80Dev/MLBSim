import { ratingColor } from './format';
import type { TeamSynth } from '../engine/teamRatings';

// ---------------------------------------------------------------------------
// Widget di RATING riusabili (estratti da App.tsx). Puri e presentazionali:
// dipendono solo dal colore-forza e dai numeri passati. Nessuno stato.
// ---------------------------------------------------------------------------

const clamp01 = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

/** Cella rating colorata in tono con la forza. */
export function Rating({ v }: { v: number }) {
  return (
    <td className="rat" style={{ background: ratingColor(v) }}>
      {v}
    </td>
  );
}

/** Badge di sintesi squadra (OVR / Attacco / Difesa / staff Lanciatori). Riusato
 *  nel Roster (schieramento corrente) e in partita (titolari coinvolti). */
export function SynthBadges({ synth, staff }: { synth: TeamSynth; staff: number }) {
  const item = (lbl: string, v: number, cls = '') => (
    <span className={`ts-item ${cls}`.trim()}>
      <b>{lbl}</b>
      <i style={{ color: ratingColor(v) }}>{v}</i>
    </span>
  );
  return (
    <>
      {item('OVR', synth.ovr, 'ovrbig')}
      {item('ATT', synth.off)}
      {item('DIF', synth.def)}
      {item('LAN', staff, 'pit')}
    </>
  );
}

/**
 * Rating generale numerico in una card colorata in tono con la forza (testo
 * bianco grassetto), come le celle delle singole caratteristiche: stima precisa,
 * al posto delle stelle (troppo grossolane).
 */
export function OvrBadge({ overall }: { overall: number }) {
  return (
    <span className="ovr-badge" style={{ background: ratingColor(overall) }} title={`${overall} OVR`}>
      {overall}
    </span>
  );
}

// Percentuale 0-100 di un rating sulla scala 40-100 (per le barre).
const ratingPct = (v: number) => clamp01((v - 40) / 60, 0, 1) * 100;

// Hash deterministico dell'id -> [0,1): rende la "nebbia di scouting" STABILE per
// giocatore (non sfarfalla tra un render e l'altro) ma diversa da uno all'altro.
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export type Outlook = { dir: 'up' | 'flat' | 'down'; lo: number; hi: number };

// Prospettiva di crescita "nebbiosa" mostrata in rosa AL POSTO del potenziale
// nudo: una FASCIA (non un numero-verdetto), direzionale per fase d'età, così non
// si legge il futuro esatto in anticipo.
//  - giovane con margine    -> ▲ verso l'alto (upside dal potenziale, offuscato)
//  - picco / nessun margine  -> numero secco (flat)
//  - veterano (> 30)         -> ▼ verso il basso (declino stimato dalla curva
//    d'età: fascia inferiore all'attuale)
// La fascia CONTIENE il valore vero (stima onesta), ma con ampiezza e posizione
// variabili per giocatore (seed sull'id): il tetto esatto resta nascosto.
export function growthOutlook(id: string, overall: number, potential: number, age: number): Outlook {
  const seed = hash01(id);
  if (age > 30) {
    // Declino: fascia INFERIORE all'attuale, dal calo atteso (~ (età-30)/anno).
    const dec = Math.max(1, Math.min(9, Math.round((age - 30) * 0.7)));
    const hi = Math.max(40, overall - Math.round(seed));
    const lo = Math.max(40, Math.min(hi, overall - dec - Math.round(seed * 2)));
    return { dir: 'down', lo, hi };
  }
  const margin = potential - overall;
  if (margin <= 1) return { dir: 'flat', lo: overall, hi: overall };
  // Ampiezza della nebbia: cresce col margine e con la gioventù (un 20enne è più
  // imprevedibile). La fascia racchiude il potenziale vero, spostata dal seed.
  const spread = Math.max(1, Math.min(5, Math.round(margin * 0.4 + (age < 24 ? 2 : 1))));
  const lo = Math.max(overall, Math.min(potential, potential - 1 - Math.round(seed * spread)));
  const hi = Math.min(100, Math.max(potential, potential + 1 + Math.round((1 - seed) * spread)));
  return { dir: 'up', lo, hi };
}

// Barra OVR mini: il riempimento (colore del rating) è l'overall corrente; se c'è
// upside, il tratto fino al bordo ALTO della fascia (hi, non il potenziale esatto)
// resta visibile come segmento più chiaro = "spazio di crescita". Info di corredo.
export function OvrBar({ id, overall, potential, age }: { id: string; overall: number; potential: number; age: number }) {
  const o = growthOutlook(id, overall, potential, age);
  const head = o.dir === 'up';
  return (
    <span className="ovr-bar" title={head ? `OVR ${overall} · crescita stimata ~${o.lo}-${o.hi}` : `OVR ${overall}`}>
      {head && <span className="ovr-bar-pot" style={{ width: `${ratingPct(o.hi)}%` }} />}
      <span className="ovr-bar-fill" style={{ width: `${ratingPct(overall)}%`, background: ratingColor(overall) }} />
    </span>
  );
}

// Colonna DEDICATA per la barra OVR (fissa, allineata verticalmente riga per
// riga: niente più barre "a scorrimento" dopo nomi di lunghezza diversa).
export function OvrBarCell({ id, overall, potential, age }: { id: string; overall: number; potential: number; age: number }) {
  return (
    <td className="ovrbar-c">
      <OvrBar id={id} overall={overall} potential={potential} age={age} />
    </td>
  );
}

// Colonna DEDICATA per la prospettiva (40-100). Mostra una FASCIA "nebbiosa" (mai
// il tetto esatto): ▲lo-hi se c'è upside (giovane), ▼lo-hi se è probabile un
// declino (veterano), o il numero secco al picco. Formato diverso dal badge OVR
// per non confonderlo a colpo d'occhio: è una stima da scout, non un verdetto.
export function PotCell({ id, overall, potential, age }: { id: string; overall: number; potential: number; age: number }) {
  const o = growthOutlook(id, overall, potential, age);
  if (o.dir === 'flat') {
    return (
      <td className="pot-c">
        <span className="pot-num" title="Al picco: nessun margine di crescita atteso">
          {overall}
        </span>
      </td>
    );
  }
  const arrow = o.dir === 'up' ? '▲' : '▼';
  const title =
    o.dir === 'up'
      ? `Crescita stimata ~${o.lo}-${o.hi} (stima da scout, non il tetto esatto)`
      : `Declino stimato ~${o.lo}-${o.hi} col progredire dell'età (stima da scout)`;
  return (
    <td className="pot-c">
      <span className={`pot-num ${o.dir}`} title={title}>
        {arrow}
        {o.lo}-{o.hi}
      </span>
    </td>
  );
}
