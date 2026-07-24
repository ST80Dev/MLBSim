import { useState } from 'react';
import type { Team, Position } from '../engine/types';
import { stadiumImage } from '../data/stadiumImages';
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

const DEFENSE: Spot[] = [
  { pos: 'P', x: 450, y: 302 },
  { pos: 'C', x: 450, y: 408 },
  { pos: '1B', x: 604, y: 314 },
  { pos: '2B', x: 512, y: 250 },
  { pos: 'SS', x: 388, y: 250 },
  { pos: '3B', x: 296, y: 314 },
  { pos: 'LF', x: 198, y: 190 },
  { pos: 'CF', x: 450, y: 126 },
  { pos: 'RF', x: 702, y: 190 },
];

/** Proietta un punto BASE nello spazio calibrato (perno = casa base). */
function proj(p: Pt, cal: FieldCalibration): Pt {
  const dx = p.x - BASE.HOME.x;
  const depth = BASE.HOME.y - p.y;
  const depthN = depth / DEPTH_REF;
  const x = cal.homeX + dx * cal.spreadX * (1 + depthN * cal.fan);
  const y = cal.homeY - depth * cal.depthY;
  return { x, y };
}

function lastNameOf(name: string): string {
  const i = name.indexOf(' ');
  return i < 0 ? name : name.slice(i + 1);
}

function playerAt(team: Team, pos: Position): string {
  if (pos === 'P') return team.rotation[0]?.name ?? '';
  const b = team.lineup.find((p) => p.position === pos);
  return b?.name ?? '';
}

function FielderLabel({ x, y, pos, name }: { x: number; y: number; pos: Position; name: string }) {
  const label = `${pos} ${lastNameOf(name)}`;
  const w = Math.max(40, label.length * 6.6 + 14);
  const lx = Math.min(VB.w - 8 - w / 2, Math.max(8 + w / 2, x));
  const ly = y + 13;
  return (
    <g>
      <circle cx={x} cy={y} r={7.5} fill="var(--fld)" stroke="var(--fld2)" strokeWidth={1.8} />
      <circle cx={x} cy={y - 1.6} r={3} fill="rgba(255,255,255,0.55)" />
      <g transform={`translate(${lx}, ${ly})`}>
        <rect x={-w / 2} y={0} width={w} height={17} rx={5} fill="rgba(6,12,24,0.82)" stroke="var(--fld2)" strokeWidth={0.7} />
        <text x={0} y={12.5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#eaf1ff" fontFamily="system-ui, sans-serif">
          {label}
        </text>
      </g>
    </g>
  );
}

export function Diamond({
  home,
  away,
  background,
  bases,
  cal = DEFAULT_CALIBRATION,
}: {
  home: Team;
  away: Team;
  background?: boolean;
  bases?: [boolean, boolean, boolean];
  cal?: FieldCalibration;
}) {
  const primary = home.primaryColor || '#3a7d3a';
  const secondary = home.secondaryColor || '#1b2947';
  const bg = stadiumImage(home.id);
  // Se la foto non e' (ancora) presente, si ripiega sul campo generato.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const useImage = !!bg && bg !== failedSrc;

  // Punti calibrati.
  const HOME = proj(BASE.HOME, cal);
  const FIRST = proj(BASE.FIRST, cal);
  const SECOND = proj(BASE.SECOND, cal);
  const THIRD = proj(BASE.THIRD, cal);
  const MOUND = proj(BASE.MOUND, cal);
  const POLE_L = proj(BASE.POLE_L, cal);
  const POLE_R = proj(BASE.POLE_R, cal);
  const WALL_C = proj(BASE.WALL_C, cal);
  const defense = DEFENSE.map((s) => ({ pos: s.pos, ...proj(s, cal) }));

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

  const baseSpots = [FIRST, SECOND, THIRD];
  const markers = (
    <>
      {baseSpots.map((b, i) => {
        const on = !!bases && bases[i];
        const s = on ? 8 : 5;
        return (
          <rect
            key={i}
            x={b.x - s}
            y={b.y - s}
            width={s * 2}
            height={s * 2}
            fill={on ? '#ffd15c' : '#f4f6fb'}
            stroke={on ? '#b5764a' : 'none'}
            strokeWidth={on ? 2 : 0}
            transform={`rotate(45 ${b.x} ${b.y})`}
          />
        );
      })}
      <path
        d={`M ${HOME.x - 6} ${HOME.y - 4} L ${HOME.x + 6} ${HOME.y - 4} L ${HOME.x + 6} ${HOME.y + 1} L ${HOME.x} ${HOME.y + 7} L ${HOME.x - 6} ${HOME.y + 1} Z`}
        fill="#f4f6fb"
      />
      <rect x={MOUND.x - 6} y={MOUND.y - 2} width={12} height={4} rx={1.5} fill="#f4f6fb" />
      <circle cx={HOME.x - 16} cy={HOME.y - 10} r={7.5} fill={away.primaryColor || '#888'} stroke="#fff" strokeWidth={1.4} />

      {defense.map((s) => (
        <FielderLabel key={s.pos} x={s.x} y={s.y} pos={s.pos} name={playerAt(home, s.pos)} />
      ))}
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
  const iw = VB.w * cal.bgZoom;
  const ih = VB.h * cal.bgZoom;
  const ix = (VB.w - iw) / 2 + cal.bgX;
  const iy = (VB.h - ih) / 2 + cal.bgY;

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
          preserveAspectRatio="xMidYMid slice"
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
      <div className="field-bg" style={style}>
        <svg
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          role="img"
          aria-label={`Campo di ${home.ballpark}`}
          className="field-bg-svg"
          preserveAspectRatio="xMidYMid meet"
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
