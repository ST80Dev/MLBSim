import type { Team, Position } from '../engine/types';
import { stadiumImage } from '../data/stadiumImages';

// Campo + stadio ORIGINALI generati a runtime (nessuna foto/logo ufficiale).
// Vista IN PROSPETTIVA da dietro casa base (come dagli spalti): casa base in
// basso vicina, il campo si allarga salendo verso il muro e le tribune in alto.
// viewBox panoramico 900x420 per riempire bene la larghezza. Se l'utente
// fornisce una foto (stadiumImages) diventa lo sfondo pieno con soli i marker.

interface Spot {
  pos: Position;
  x: number;
  y: number;
}

const VB = { w: 900, h: 420 };
const HOME = { x: 450, y: 394 };
const FIRST = { x: 612, y: 322 };
const SECOND = { x: 450, y: 244 };
const THIRD = { x: 288, y: 322 };
const MOUND = { x: 450, y: 302 };
const POLE_L = { x: 34, y: 168 };
const POLE_R = { x: 866, y: 168 };
const WALL_C = { x: 450, y: 50 };

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

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Punto sulla curva del muro (Bézier quadratica POLE_L → WALL_C → POLE_R). */
function wallPoint(t: number): [number, number] {
  const mt = 1 - t;
  const x = mt * mt * POLE_L.x + 2 * mt * t * WALL_C.x + t * t * POLE_R.x;
  const y = mt * mt * POLE_L.y + 2 * mt * t * WALL_C.y + t * t * POLE_R.y;
  return [x, y];
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
}: {
  home: Team;
  away: Team;
  background?: boolean;
  bases?: [boolean, boolean, boolean];
}) {
  const primary = home.primaryColor || '#3a7d3a';
  const secondary = home.secondaryColor || '#1b2947';
  const bg = stadiumImage(home.id);

  const seed = hash(home.ballpark);
  const towers = 2 + (seed % 2) * 2;
  const roof = seed % 3;
  const towerXs = towers === 2 ? [150, 750] : [110, 320, 580, 790];

  const fairPath = `M ${HOME.x} ${HOME.y} L ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y} Z`;
  const wallPath = `M ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y}`;
  const standsPath = `M ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y} L ${VB.w} 0 L 0 0 Z`;

  const N = 11;
  const wedges: string[] = [];
  for (let i = 0; i < N; i++) {
    const [x1, y1] = wallPoint(i / N);
    const [x2, y2] = wallPoint((i + 1) / N);
    wedges.push(`M ${HOME.x} ${HOME.y} L ${x1} ${y1} L ${x2} ${y2} Z`);
  }

  const infield = `M ${HOME.x} ${HOME.y} L ${FIRST.x} ${FIRST.y} L ${SECOND.x} ${SECOND.y} L ${THIRD.x} ${THIRD.y} Z`;

  const generated = (
    <>
      <rect x="0" y="0" width={VB.w} height="210" fill="url(#sky)" />
      {towerXs.map((tx, i) => (
        <g key={i}>
          <rect x={tx - 2} y={16} width={4} height={50} fill="#2a3550" />
          <rect x={tx - 12} y={7} width={24} height={13} rx={2} fill="#26324c" />
          {[0, 1, 2].map((c) => (
            <circle key={c} cx={tx - 7 + c * 7} cy={13.5} r={2.2} fill="#ffe9a8" opacity={0.9} />
          ))}
        </g>
      ))}
      <path d={standsPath} fill={secondary} opacity={0.92} />
      {[0.3, 0.46, 0.62, 0.78].map((f, i) => (
        <path
          key={i}
          d={`M ${POLE_L.x - f * 34} ${POLE_L.y - f * 168} Q ${WALL_C.x} ${WALL_C.y - f * 100} ${POLE_R.x + f * 34} ${POLE_R.y - f * 168}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={2}
        />
      ))}
      {roof === 2 && (
        <path d={`M 0 8 Q ${WALL_C.x} -20 ${VB.w} 8`} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={7} />
      )}

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

  const markers = (
    <>
      {[FIRST, SECOND, THIRD].map((b, i) => {
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

      {DEFENSE.map((s) => (
        <FielderLabel key={s.pos} x={s.x} y={s.y} pos={s.pos} name={playerAt(home, s.pos)} />
      ))}
    </>
  );

  const defs = (
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#20304f" />
        <stop offset="60%" stopColor="#38507a" />
        <stop offset="100%" stopColor="#8a6f52" />
      </linearGradient>
      <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2f6b32" />
        <stop offset="100%" stopColor="#429340" />
      </linearGradient>
    </defs>
  );

  const content = (
    <>
      {defs}
      {bg ? (
        <image href={bg} x="0" y="0" width={VB.w} height={VB.h} preserveAspectRatio="xMidYMid slice" />
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
