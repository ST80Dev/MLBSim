import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { Team, Position } from '../engine/types';
import { stadiumImage, assetUrl } from '../data/stadiumImages';
import { ratingColor } from './format';
import { DEFAULT_CALIBRATION } from '../data/stadiumCalibration';
import type { FieldCalibration } from '../data/stadiumCalibration';

// Campo + marker ORIGINALI generati a runtime (nessun logo ufficiale). Vista IN
// PROSPETTIVA da dietro casa base: il piatto in basso, il campo si allarga
// salendo verso il muro. viewBox 900x420. Se l'utente fornisce una foto
// (stadiumImages) diventa lo sfondo pieno con soli i marker sovrapposti.
//
// I marker si ri-proiettano con la CALIBRAZIONE (perno = casa base): vedi
// src/data/stadiumCalibration.ts. Con i valori di default la proiezione e'
// l'identita' (campo generato non deformato).

interface Pt {
  x: number;
  y: number;
}
interface Spot {
  pos: Position;
  x: number;
  y: number;
}

const VB = { w: 900, h: 420 };

// Geometria BASE (calibrazione neutra). Casa base = perno.
const BASE = {
  HOME: { x: 450, y: 394 },
  FIRST: { x: 612, y: 322 },
  SECOND: { x: 450, y: 244 },
  THIRD: { x: 288, y: 322 },
  MOUND: { x: 450, y: 302 },
  POLE_L: { x: 34, y: 168 },
  POLE_R: { x: 866, y: 168 },
  WALL_C: { x: 450, y: 50 },
};
const DEPTH_REF = BASE.HOME.y - BASE.WALL_C.y;
// Profondita' normalizzata oltre la quale agisce ofDist: tiene fermi gli angoli
// dell'interno (1a/3a) e il monte, comprime/allontana 2a-SS e gli esterni.
const INFIELD_DEPTH = 0.3;

const DEFENSE: Spot[] = [
  { pos: 'P', x: 450, y: 302 },
  { pos: 'C', x: 450, y: 408 },
  { pos: '1B', x: 604, y: 314 },
  { pos: '2B', x: 512, y: 250 },
  { pos: 'SS', x: 388, y: 250 },
  { pos: '3B', x: 296, y: 314 },
  // Esterni dx/sx nei vialetti (non lungo le linee di foul): partono già
  // "dentro" il campo, tra 2a e 3a (LF) e tra 1a e 2a (RF).
  { pos: 'LF', x: 314, y: 176 },
  { pos: 'CF', x: 450, y: 126 },
  { pos: 'RF', x: 586, y: 176 },
];

/** Proietta un punto BASE nello spazio calibrato (perno = casa base). */
function proj(p: Pt, cal: FieldCalibration): Pt {
  const dx = p.x - BASE.HOME.x;
  const depth = BASE.HOME.y - p.y;
  const depthN = depth / DEPTH_REF;
  // Distanza interni↔esterni: comprime/espande la profondita' oltre gli angoli.
  const depthAdj =
    depthN <= INFIELD_DEPTH ? depthN : INFIELD_DEPTH + (depthN - INFIELD_DEPTH) * cal.ofDist;
  let x = cal.homeX + dx * cal.spreadX * (1 + depthAdj * cal.fan);
  let y = cal.homeY - depthAdj * DEPTH_REF * cal.depthY;
  // Rotazione dell'asse casa base–2a–CF attorno a casa base: >0 inclina l'asse a
  // destra → 1a/RF si allungano verso destra e 3a/LF salgono (campo storto in
  // foto). A piccoli angoli è un tilt dell'asse, non un giro.
  if (cal.rotation) {
    const a = (cal.rotation * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const rx = x - cal.homeX;
    const ry = y - cal.homeY;
    x = cal.homeX + rx * c - ry * s;
    y = cal.homeY + rx * s + ry * c;
  }
  return { x, y };
}

// Cognome in MAIUSCOLO per le etichette sul campo (riconoscibilità a colpo d'occhio).
function lastNameOf(name: string): string {
  const i = name.indexOf(' ');
  return (i < 0 ? name : name.slice(i + 1)).toUpperCase();
}

/** Etichetta col solo nome (senza ruolo), per corridori in base e battitore.
 *  Sta SOTTO il marker (convenzione anti-sovrapposizione) e lo segue nel drag.
 *  Se `speed` è definito, accanto al nome compare una card VEL colorata (sfondo
 *  = colore-rating, numero bianco), per capire a colpo d'occhio il corridore. */
function NameChip({
  x,
  y,
  name,
  color,
  speed,
}: {
  x: number;
  y: number;
  name: string;
  color: string;
  speed?: number;
}) {
  const label = lastNameOf(name);
  const nameW = Math.max(32, label.length * 6.4 + 12);
  const badgeW = 20;
  const gap = 3;
  const hasSpeed = speed != null;
  const totalW = nameW + (hasSpeed ? gap + badgeW : 0);
  const cx = Math.min(VB.w - 8 - totalW / 2, Math.max(8 + totalW / 2, x));
  const left = cx - totalW / 2;
  const nameCx = left + nameW / 2;
  const badgeCx = left + nameW + gap + badgeW / 2;
  return (
    <g>
      {hasSpeed && <title>{`VEL ${speed}`}</title>}
      <g transform={`translate(${nameCx}, ${y})`}>
        <rect
          x={-nameW / 2}
          y={0}
          width={nameW}
          height={16}
          rx={5}
          fill="rgba(6,12,24,0.82)"
          stroke={color}
          strokeWidth={1.1}
        />
        <text
          x={0}
          y={11.5}
          textAnchor="middle"
          fontSize={10.5}
          fontWeight={700}
          fill="#eaf1ff"
          fontFamily="system-ui, sans-serif"
        >
          {label}
        </text>
      </g>
      {hasSpeed && (
        <g transform={`translate(${badgeCx}, ${y})`}>
          <rect x={-badgeW / 2} y={0} width={badgeW} height={16} rx={4} fill={ratingColor(speed)} />
          <text
            x={0}
            y={11.5}
            textAnchor="middle"
            fontSize={10}
            fontWeight={800}
            fill="#fff"
            fontFamily="system-ui, sans-serif"
          >
            {speed}
          </text>
        </g>
      )}
    </g>
  );
}

function playerAt(team: Team, pos: Position): string {
  if (pos === 'P') return team.rotation[0]?.name ?? '';
  const b = team.lineup.find((p) => p.position === pos);
  return b?.name ?? '';
}

function FielderLabel({
  x,
  y,
  pos,
  name,
  below,
}: {
  x: number;
  y: number;
  pos: Position;
  name: string;
  below?: boolean;
}) {
  const label = `${pos} ${lastNameOf(name)}`;
  const w = Math.max(40, label.length * 6.6 + 14);
  const lx = Math.min(VB.w - 8 - w / 2, Math.max(8 + w / 2, x));
  // Etichetta sopra il marker (default) o sotto (P/C/battitore: sono in basso).
  const ly = below ? y + 13 : y - 30;
  return (
    <g>
      <circle cx={x} cy={y} r={7.5} fill="var(--fld)" stroke="var(--fld2)" strokeWidth={1.8} />
      <circle cx={x} cy={y - 1.6} r={3} fill="rgba(255,255,255,0.55)" />
      <g transform={`translate(${lx}, ${ly})`}>
        <rect x={-w / 2} y={0} width={w} height={17} rx={5} fill="rgba(6,12,24,0.82)" stroke="var(--fld2)" strokeWidth={0.7} />
        {/* Ruolo (sigla) più piccolo e attenuato del cognome, per distinguerli. */}
        <text x={0} y={12.5} textAnchor="middle" fontWeight={700} fill="#eaf1ff" fontFamily="system-ui, sans-serif">
          <tspan fontSize={8.5} fontWeight={800} fill="#9fb2d6">{pos}</tspan>
          <tspan fontSize={11} dx={3}>{lastNameOf(name)}</tspan>
        </text>
      </g>
    </g>
  );
}

/** ID dei 14 marker piazzabili a mano (il monte segue P). */
export const MARKER_IDS = [
  'P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF',
  'base1', 'base2', 'base3', 'home', 'batter',
] as const;

/** Posizioni di partenza dei marker (proiezione parametrica) per il piazzamento. */
export function computeMarkers(cal: FieldCalibration): Record<string, { x: number; y: number }> {
  const r = (p: Pt) => ({ x: Math.round(p.x), y: Math.round(p.y) });
  const m: Record<string, { x: number; y: number }> = {};
  DEFENSE.forEach((s) => {
    m[s.pos] = r(proj(s, cal));
  });
  m.base1 = r(proj(BASE.FIRST, cal));
  m.base2 = r(proj(BASE.SECOND, cal));
  m.base3 = r(proj(BASE.THIRD, cal));
  const h = proj(BASE.HOME, cal);
  m.home = r(h);
  m.batter = { x: Math.round(h.x - 16), y: Math.round(h.y - 10) };
  return m;
}

export function Diamond({
  home,
  away,
  background,
  bases,
  runners,
  runnerSpeeds,
  batterName,
  defenseTeam,
  pitcherName,
  cal = DEFAULT_CALIBRATION,
  editable,
  onMarkerMove,
}: {
  home: Team;
  away: Team;
  background?: boolean;
  bases?: [boolean, boolean, boolean];
  /** Nomi dei corridori in base (1B, 2B, 3B); null/assente = base libera.
   *  In calibrazione (editable) le etichette si mostrano comunque, per poterle
   *  posizionare; in partita solo sulle basi occupate. */
  runners?: (string | null)[];
  /** Velocità (VEL, 40-100) dei corridori in base, allineata a `runners`: se
   *  presente, il marker mostra la card-dote colorata accanto al nome. */
  runnerSpeeds?: (number | null)[];
  /** Nome del battitore a casa base (etichetta accanto al marker battitore). */
  batterName?: string | null;
  /** Squadra attualmente IN DIFESA: i difensori sul campo sono i SUOI giocatori.
   *  Cambia a ogni mezzo inning; se assente si ripiega sulla squadra di casa. */
  defenseTeam?: Team;
  /** Nome del lanciatore ATTUALMENTE sul monte (non il partente di rotazione). */
  pitcherName?: string;
  cal?: FieldCalibration;
  editable?: boolean;
  onMarkerMove?: (id: string, pos: { x: number; y: number }) => void;
}) {
  // I difensori disegnati sono quelli della squadra in difesa (che si alterna),
  // NON per forza la squadra di casa proprietaria dello stadio.
  const fielders = defenseTeam ?? home;
  const primary = home.primaryColor || '#3a7d3a';
  const secondary = home.secondaryColor || '#1b2947';
  // Foto scelta in calibrazione (variante) oppure la principale dello stadio.
  const bg = cal.image ? assetUrl(cal.image) : stadiumImage(home.id);
  // Se la foto non e' (ancora) presente, si ripiega sul campo generato.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useImage = !!bg && bg !== failedSrc;

  // Drag dei marker in modalità manuale.
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const toVB = (e: { clientX: number; clientY: number }): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const q = pt.matrixTransform(m.inverse());
    return { x: Math.round(q.x), y: Math.round(q.y) };
  };
  const onDown = (id: string, e: ReactPointerEvent) => {
    if (!editable) return;
    e.stopPropagation();
    setDragId(id);
    svgRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!dragId) return;
    const p = toVB(e);
    if (p) onMarkerMove?.(dragId, p);
  };
  const onUp = (e: ReactPointerEvent) => {
    if (dragId) {
      setDragId(null);
      svgRef.current?.releasePointerCapture?.(e.pointerId);
    }
  };
  // La calibrazione vale solo sopra una foto: il campo GENERATO usa sempre
  // l'identita' (non va deformato dai default-foto).
  const effCal = useImage ? cal : DEFAULT_CALIBRATION;

  // Punti calibrati.
  const HOME = proj(BASE.HOME, effCal);
  const FIRST = proj(BASE.FIRST, effCal);
  const SECOND = proj(BASE.SECOND, effCal);
  const THIRD = proj(BASE.THIRD, effCal);
  const MOUND = proj(BASE.MOUND, effCal);
  const POLE_L = proj(BASE.POLE_L, effCal);
  const POLE_R = proj(BASE.POLE_R, effCal);
  const WALL_C = proj(BASE.WALL_C, effCal);
  const defense = DEFENSE.map((s) => ({ pos: s.pos, ...proj(s, effCal) }));

  /** Punto sulla curva del muro (Bézier POLE_L → WALL_C → POLE_R). */
  const wallPoint = (t: number): [number, number] => {
    const mt = 1 - t;
    const x = mt * mt * POLE_L.x + 2 * mt * t * WALL_C.x + t * t * POLE_R.x;
    const y = mt * mt * POLE_L.y + 2 * mt * t * WALL_C.y + t * t * POLE_R.y;
    return [x, y];
  };

  const fairPath = `M ${HOME.x} ${HOME.y} L ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y} Z`;
  const wallPath = `M ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y}`;

  const N = 11;
  const wedges: string[] = [];
  for (let i = 0; i < N; i++) {
    const [x1, y1] = wallPoint(i / N);
    const [x2, y2] = wallPoint((i + 1) / N);
    wedges.push(`M ${HOME.x} ${HOME.y} L ${x1} ${y1} L ${x2} ${y2} Z`);
  }

  const infield = `M ${HOME.x} ${HOME.y} L ${FIRST.x} ${FIRST.y} L ${SECOND.x} ${SECOND.y} L ${THIRD.x} ${THIRD.y} Z`;

  // Solo il terreno di gioco: niente tribune/cielo generati (sfondo scuro o foto).
  const generated = (
    <>
      <clipPath id="fair-clip">
        <path d={fairPath} />
      </clipPath>
      <path d={fairPath} fill="url(#grass)" />
      <g clipPath="url(#fair-clip)">
        {wedges.map((d, i) => (
          <path key={i} d={d} fill={i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'} />
        ))}
      </g>

      <path d={wallPath} fill="none" stroke="#8a5a34" strokeWidth={11} opacity={0.85} />
      <path d={wallPath} fill="none" stroke={primary} strokeWidth={6} />

      <line x1={HOME.x} y1={HOME.y} x2={POLE_L.x} y2={POLE_L.y} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} />
      <line x1={HOME.x} y1={HOME.y} x2={POLE_R.x} y2={POLE_R.y} stroke="rgba(255,255,255,0.7)" strokeWidth={1.8} />

      <path d={infield} fill="rgba(180,120,70,0.22)" stroke="#b5764a" strokeWidth={13} strokeLinejoin="round" />
      <circle cx={MOUND.x} cy={MOUND.y} r={16} fill="#b5764a" />
      <circle cx={HOME.x} cy={HOME.y} r={22} fill="#b5764a" opacity={0.55} />
    </>
  );

  // Posizioni effettive dei marker: manuali (se piazzate a mano su foto) o proiettate.
  const defenseByPos: Record<string, Pt> = {};
  defense.forEach((d) => {
    defenseByPos[d.pos] = { x: d.x, y: d.y };
  });
  const man = useImage ? cal.markers : undefined;
  const mp = (id: string, fb: Pt): Pt => man?.[id] ?? fb;
  const pHome = mp('home', HOME);
  const pMound = mp('P', MOUND);
  const pBatter = mp('batter', { x: HOME.x - 16, y: HOME.y - 10 });
  const baseData: [string, Pt, number, string][] = [
    ['base1', mp('base1', FIRST), 0, '1ª'],
    ['base2', mp('base2', SECOND), 1, '2ª'],
    ['base3', mp('base3', THIRD), 2, '3ª'],
  ];

  // Rende un marker trascinabile in modalità manuale (con area di presa ampia).
  const grab = (id: string, cx: number, cy: number, node: ReactNode): ReactNode =>
    editable ? (
      <g key={id} className="mk-drag" onPointerDown={(e) => onDown(id, e)}>
        {node}
        <circle className="mk-hit" cx={cx} cy={cy} r={15} fill="transparent" />
      </g>
    ) : (
      <g key={id}>{node}</g>
    );

  const FIELDERS: Position[] = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'];

  const markers = (
    <>
      {baseData.map(([id, b, i, lab]) => {
        const on = !!bases && bases[i];
        const s = on ? 8 : 5;
        const rname = runners?.[i] ?? null;
        const rspeed = runnerSpeeds?.[i] ?? null;
        // Etichetta corridore: in calibrazione sempre (per posizionarla), in
        // partita solo se la base è occupata e conosciamo il nome.
        const showRunner = editable || (on && !!rname);
        return grab(
          id,
          b.x,
          b.y,
          <>
            <rect
              x={b.x - s}
              y={b.y - s}
              width={s * 2}
              height={s * 2}
              fill={on ? '#ffd15c' : '#f4f6fb'}
              stroke={on ? '#b5764a' : 'none'}
              strokeWidth={on ? 2 : 0}
              transform={`rotate(45 ${b.x} ${b.y})`}
            />
            {editable && (
              <text x={b.x} y={b.y - 12} textAnchor="middle" fontSize={10} fontWeight={800} fill="#ffd15c">
                {lab}
              </text>
            )}
            {showRunner && (
              <NameChip
                x={b.x}
                y={b.y + 12}
                name={rname ?? 'Corridore'}
                color="#ffd15c"
                speed={rspeed ?? undefined}
              />
            )}
          </>,
        );
      })}
      {grab(
        'home',
        pHome.x,
        pHome.y,
        <path
          d={`M ${pHome.x - 6} ${pHome.y - 4} L ${pHome.x + 6} ${pHome.y - 4} L ${pHome.x + 6} ${pHome.y + 1} L ${pHome.x} ${pHome.y + 7} L ${pHome.x - 6} ${pHome.y + 1} Z`}
          fill="#f4f6fb"
        />,
      )}
      <rect x={pMound.x - 6} y={pMound.y - 2} width={12} height={4} rx={1.5} fill="#f4f6fb" />
      {grab(
        'batter',
        pBatter.x,
        pBatter.y,
        <>
          <circle cx={pBatter.x} cy={pBatter.y} r={7.5} fill={away.primaryColor || '#888'} stroke="#fff" strokeWidth={1.4} />
          {(editable || !!batterName) && (
            <NameChip
              x={pBatter.x}
              y={pBatter.y + 10}
              name={batterName || 'Battitore'}
              color={away.primaryColor || '#f4f6fb'}
            />
          )}
        </>,
      )}

      {FIELDERS.map((pos) => {
        const p = mp(pos, defenseByPos[pos]);
        return grab(
          pos,
          p.x,
          p.y,
          <FielderLabel
            x={p.x}
            y={p.y}
            pos={pos}
            name={pos === 'P' && pitcherName ? pitcherName : playerAt(fielders, pos)}
            below={pos === 'P' || pos === 'C'}
          />,
        );
      })}
    </>
  );

  const defs = (
    <defs>
      <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2f6b32" />
        <stop offset="100%" stopColor="#429340" />
      </linearGradient>
    </defs>
  );

  // Foto di sfondo con zoom/pan (calibrazione).
  const iw = VB.w * effCal.bgZoom;
  const ih = VB.h * effCal.bgZoom;
  const ix = (VB.w - iw) / 2 + effCal.bgX;
  const iy = (VB.h - ih) / 2 + effCal.bgY;

  const content = (
    <>
      {defs}
      {useImage ? (
        <image
          href={bg}
          x={ix}
          y={iy}
          width={iw}
          height={ih}
          preserveAspectRatio="xMidYMid meet"
          onError={() => setFailedSrc(bg!)}
        />
      ) : (
        generated
      )}
      {markers}
    </>
  );

  const style = {
    ['--fld' as string]: primary,
    ['--fld2' as string]: secondary,
  };

  if (background) {
    return (
      <div className={`field-bg${editable ? ' editing' : ''}`} style={style}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          role="img"
          aria-label={`Campo di ${home.ballpark}`}
          className="field-bg-svg"
          preserveAspectRatio="xMidYMid meet"
          onPointerMove={editable ? onMove : undefined}
          onPointerUp={editable ? onUp : undefined}
          style={editable ? { touchAction: 'none' } : undefined}
        >
          {content}
        </svg>
      </div>
    );
  }

  return (
    <div className="card diamond-card">
      <div className="diamond-marquee">
        <span className="dm-park">🏟 {home.ballpark}</span>
        <span className="dm-teams">
          {away.abbrev} <span className="dm-at">@</span> {home.abbrev}
        </span>
      </div>
      <div className="field-wrap" style={style}>
        <svg viewBox={`0 0 ${VB.w} ${VB.h}`} role="img" aria-label={`Campo di ${home.ballpark}`} className="field-svg">
          {content}
        </svg>
      </div>
    </div>
  );
}
