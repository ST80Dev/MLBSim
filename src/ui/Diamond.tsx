import type { Team, Position } from '../engine/types';
import { stadiumImage } from '../data/stadiumImages';

// Campo + stadio ORIGINALI generati a runtime (nessuna foto/logo ufficiale).
// Vista IN PROSPETTIVA da dietro casa base (come dagli spalti): casa base in
// basso vicina, il campo si allarga salendo verso il muro e le tribune in alto.
// Piccole variazioni per stadio (tetto, torri-faro, tinte) sono seedate dal
// nome del ballpark. Se l'utente fornisce una foto (stadiumImages) diventa lo
// sfondo pieno e restano solo i marker.

interface Spot {
  pos: Position;
  x: number;
  y: number;
}

// viewBox 420x400. Casa base in basso al centro; outfield in alto, largo.
const HOME = { x: 210, y: 366 };
const FIRST = { x: 300, y: 300 };
const SECOND = { x: 210, y: 250 };
const THIRD = { x: 120, y: 300 };
const MOUND = { x: 210, y: 310 };
// Pali di fallo (in alto, larghi) e vertice del muro (curva verso l'alto).
const POLE_L = { x: 26, y: 150 };
const POLE_R = { x: 394, y: 150 };
const WALL_C = { x: 210, y: 40 };

// Posizioni difensive nella prospettiva (outfield largo in alto).
const DEFENSE: Spot[] = [
  { pos: 'P', x: 210, y: 310 },
  { pos: 'C', x: 210, y: 380 },
  { pos: '1B', x: 300, y: 292 },
  { pos: '2B', x: 254, y: 250 },
  { pos: 'SS', x: 166, y: 250 },
  { pos: '3B', x: 120, y: 292 },
  { pos: 'LF', x: 92, y: 168 },
  { pos: 'CF', x: 210, y: 116 },
  { pos: 'RF', x: 328, y: 168 },
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
  const w = Math.max(28, label.length * 5.4 + 10);
  const lx = Math.min(414 - w / 2, Math.max(6 + w / 2, x));
  const ly = y + 12;
  return (
    <g>
      <circle cx={x} cy={y} r={6.5} fill="var(--fld)" stroke="var(--fld2)" strokeWidth={1.5} />
      <circle cx={x} cy={y - 1.5} r={2.6} fill="rgba(255,255,255,0.55)" />
      <g transform={`translate(${lx}, ${ly})`}>
        <rect x={-w / 2} y={0} width={w} height={13} rx={4} fill="rgba(6,12,24,0.82)" stroke="var(--fld2)" strokeWidth={0.6} />
        <text x={0} y={9.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#eaf1ff" fontFamily="system-ui, sans-serif">
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
  const towerXs = towers === 2 ? [70, 350] : [50, 150, 270, 370];

  // Territorio buono: casa base → palo sx → muro → palo dx.
  const fairPath = `M ${HOME.x} ${HOME.y} L ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y} Z`;
  const wallPath = `M ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y}`;
  const standsPath = `M ${POLE_L.x} ${POLE_L.y} Q ${WALL_C.x} ${WALL_C.y} ${POLE_R.x} ${POLE_R.y} L 420 0 L 0 0 Z`;
  // Cunei d'erba che convergono verso casa base (mow pattern in prospettiva).
  const N = 9;
  const wedges: string[] = [];
  for (let i = 0; i < N; i++) {
    const [x1, y1] = wallPoint(i / N);
    const [x2, y2] = wallPoint((i + 1) / N);
    wedges.push(`M ${HOME.x} ${HOME.y} L ${x1} ${y1} L ${x2} ${y2} Z`);
  }

  const infield = `M ${HOME.x} ${HOME.y} L ${FIRST.x} ${FIRST.y} L ${SECOND.x} ${SECOND.y} L ${THIRD.x} ${THIRD.y} Z`;

  const generated = (
    <>
      {/* Cielo e tribune (si allargano verso l'alto ai lati) */}
      <rect x="0" y="0" width="420" height="200" fill="url(#sky)" />
      {towerXs.map((tx, i) => (
        <g key={i}>
          <rect x={tx - 1.5} y={16} width={3} height={44} fill="#2a3550" />
          <rect x={tx - 10} y={8} width={20} height={12} rx={2} fill="#26324c" />
          {[0, 1, 2].map((c) => (
            <circle key={c} cx={tx - 5.5 + c * 5.5} cy={14} r={1.8} fill="#ffe9a8" opacity={0.9} />
          ))}
        </g>
      ))}
      <path d={standsPath} fill={secondary} opacity={0.92} />
      {/* File delle tribune (arci concentrici che salgono) */}
      {[0.34, 0.52, 0.7].map((f, i) => (
        <path
          key={i}
          d={`M ${POLE_L.x - f * 26} ${POLE_L.y - f * 150} Q ${WALL_C.x} ${WALL_C.y - f * 90} ${POLE_R.x + f * 26} ${POLE_R.y - f * 150}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={2}
        />
      ))}
      {roof === 2 && (
        <path d={`M 0 6 Q 210 -18 420 6`} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={6} />
      )}

      {/* Erba + cunei convergenti */}
      <clipPath id="fair-clip">
        <path d={fairPath} />
      </clipPath>
      <path d={fairPath} fill="url(#grass)" />
      <g clipPath="url(#fair-clip)">
        {wedges.map((d, i) => (
          <path key={i} d={d} fill={i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'} />
        ))}
      </g>

      {/* Warning track + muro (colore squadra) */}
      <path d={wallPath} fill="none" stroke="#8a5a34" strokeWidth={9} opacity={0.85} />
      <path d={wallPath} fill="none" stroke={primary} strokeWidth={5} />

      {/* Pali di fallo */}
      <line x1={HOME.x} y1={HOME.y} x2={POLE_L.x} y2={POLE_L.y} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
      <line x1={HOME.x} y1={HOME.y} x2={POLE_R.x} y2={POLE_R.y} stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />

      {/* Terra dell'interno + basi */}
      <path d={infield} fill="rgba(180,120,70,0.22)" stroke="#b5764a" strokeWidth={10} strokeLinejoin="round" />
      <circle cx={MOUND.x} cy={MOUND.y} r={13} fill="#b5764a" />
      <circle cx={HOME.x} cy={HOME.y} r={18} fill="#b5764a" opacity={0.55} />
    </>
  );

  const markers = (
    <>
      {/* Basi (occupata = evidenziata) */}
      {[FIRST, SECOND, THIRD].map((b, i) => {
        const on = !!bases && bases[i];
        return (
          <rect
            key={i}
            x={b.x - (on ? 6 : 4)}
            y={b.y - (on ? 6 : 4)}
            width={on ? 12 : 8}
            height={on ? 12 : 8}
            fill={on ? '#ffd15c' : '#f4f6fb'}
            stroke={on ? '#b5764a' : 'none'}
            strokeWidth={on ? 1.5 : 0}
            transform={`rotate(45 ${b.x} ${b.y})`}
          />
        );
      })}
      {/* Casa base */}
      <path
        d={`M ${HOME.x - 5} ${HOME.y - 3} L ${HOME.x + 5} ${HOME.y - 3} L ${HOME.x + 5} ${HOME.y + 1} L ${HOME.x} ${HOME.y + 6} L ${HOME.x - 5} ${HOME.y + 1} Z`}
        fill="#f4f6fb"
      />
      <rect x={MOUND.x - 5} y={MOUND.y - 1.5} width={10} height={3} rx={1} fill="#f4f6fb" />
      {/* Battitore (colore squadra ospite) nel box */}
      <circle cx={HOME.x - 13} cy={HOME.y - 8} r={6} fill={away.primaryColor || '#888'} stroke="#fff" strokeWidth={1.2} />

      {/* Difesa di casa con etichette */}
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
        <image href={bg} x="0" y="0" width="420" height="400" preserveAspectRatio="xMidYMid slice" />
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
          viewBox="0 0 420 400"
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
        <svg viewBox="0 0 420 400" role="img" aria-label={`Campo di ${home.ballpark}`} className="field-svg">
          {content}
        </svg>
      </div>
    </div>
  );
}
