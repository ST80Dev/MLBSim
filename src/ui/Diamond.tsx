import type { Team, Position } from '../engine/types';
import { stadiumImage } from '../data/stadiumImages';

// Campo + stadio ORIGINALI generati a runtime (nessuna foto/logo ufficiale).
// I giocatori della difesa di casa sono posizionati sul diamante con etichetta.
// Piccole variazioni per stadio (tetto, torri-faro, tinte) sono seedate dal
// nome del ballpark: ogni parco ha un'identita' visiva sua, senza immagini reali.

interface Spot {
  pos: Position;
  x: number;
  y: number;
}

// Posizioni difensive sul diamante (viewBox 420x400, casa base in basso).
const DEFENSE: Spot[] = [
  { pos: 'P', x: 210, y: 258 },
  { pos: 'C', x: 210, y: 350 },
  { pos: '1B', x: 298, y: 244 },
  { pos: '2B', x: 250, y: 216 },
  { pos: 'SS', x: 170, y: 216 },
  { pos: '3B', x: 122, y: 244 },
  { pos: 'LF', x: 106, y: 118 },
  { pos: 'CF', x: 210, y: 84 },
  { pos: 'RF', x: 314, y: 118 },
];

const HOME_PLATE = { x: 210, y: 330 };
const FIRST = { x: 280, y: 260 };
const SECOND = { x: 210, y: 190 };
const THIRD = { x: 140, y: 260 };
const MOUND = { x: 210, y: 260 };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function lastNameOf(name: string): string {
  const i = name.indexOf(' ');
  return i < 0 ? name : name.slice(i + 1);
}

function playerAt(team: Team, pos: Position): string {
  // La difesa deriva dal lineup: si trova chi gioca in quel ruolo; il DH non
  // difende, quindi il lanciatore partente copre 'P'.
  if (pos === 'P') return team.rotation[0]?.name ?? '';
  const b = team.lineup.find((p) => p.position === pos);
  return b?.name ?? '';
}

function FielderLabel({ x, y, pos, name }: { x: number; y: number; pos: Position; name: string }) {
  const label = `${pos} ${lastNameOf(name)}`;
  const w = Math.max(28, label.length * 5.4 + 10);
  // Tiene l'etichetta dentro la cornice.
  const lx = Math.min(414 - w / 2, Math.max(6 + w / 2, x));
  const ly = y + 13;
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill="var(--fld)" stroke="var(--fld2)" strokeWidth={1.5} />
      <circle cx={x} cy={y - 1.5} r={3} fill="rgba(255,255,255,0.55)" />
      <g transform={`translate(${lx}, ${ly})`}>
        <rect x={-w / 2} y={0} width={w} height={14} rx={4} fill="rgba(6,12,24,0.82)" stroke="var(--fld2)" strokeWidth={0.6} />
        <text x={0} y={10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#eaf1ff" fontFamily="system-ui, sans-serif">
          {label}
        </text>
      </g>
    </g>
  );
}

export function Diamond({ home, away }: { home: Team; away: Team }) {
  const primary = home.primaryColor || '#3a7d3a';
  const secondary = home.secondaryColor || '#1b2947';
  const bg = stadiumImage(home.id);

  const seed = hash(home.ballpark);
  const towers = 2 + (seed % 2) * 2; // 2 o 4 torri-faro
  const roof = seed % 3; // 0 aperto, 1 tettoia parziale, 2 cupola bassa
  const clip = 'field-clip';

  // Torri-faro dietro le tribune, disposte simmetricamente.
  const towerXs =
    towers === 2 ? [95, 325] : [70, 150, 270, 350];

  return (
    <div className="card diamond-card">
      <div className="diamond-marquee">
        <span className="dm-park">🏟 {home.ballpark}</span>
        <span className="dm-teams">
          {away.abbrev} <span className="dm-at">@</span> {home.abbrev}
        </span>
      </div>
      <div
        className="field-wrap"
        style={{
          ['--fld' as string]: primary,
          ['--fld2' as string]: secondary,
        }}
      >
        <svg viewBox="0 0 420 400" role="img" aria-label={`Campo di ${home.ballpark}`} className="field-svg">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#20304f" />
              <stop offset="55%" stopColor="#38507a" />
              <stop offset="100%" stopColor="#8a6f52" />
            </linearGradient>
            <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2f6b32" />
              <stop offset="100%" stopColor="#3f8b3e" />
            </linearGradient>
            <clipPath id={clip}>
              {/* Territorio buono: cuneo da casa base al muro. */}
              <path d="M 210 330 L 55 175 Q 210 -40 365 175 Z" />
            </clipPath>
          </defs>

          {/* Cielo / sfondo */}
          <rect x="0" y="0" width="420" height="200" fill="url(#sky)" />
          {bg && (
            <image href={bg} x="0" y="0" width="420" height="200" preserveAspectRatio="xMidYMid slice" />
          )}

          {/* Torri-faro */}
          {!bg &&
            towerXs.map((tx, i) => (
              <g key={i}>
                <rect x={tx - 1.5} y={40} width={3} height={70} fill="#2a3550" />
                <rect x={tx - 11} y={28} width={22} height={14} rx={2} fill="#26324c" />
                {[0, 1, 2].map((c) => (
                  <circle key={c} cx={tx - 6 + c * 6} cy={35} r={2} fill="#ffe9a8" opacity={0.9} />
                ))}
              </g>
            ))}

          {/* Tribune dietro il muro (colore squadra) */}
          {!bg && (
            <g>
              <path d="M 40 172 Q 210 -55 380 172 L 380 120 Q 210 -30 40 120 Z" fill={secondary} opacity={0.9} />
              <path d="M 55 118 Q 210 -18 365 118 L 365 96 Q 210 -6 55 96 Z" fill={secondary} opacity={0.7} />
              {/* Tetto/cupola variabile per stadio */}
              {roof === 1 && (
                <path d="M 60 96 Q 210 30 360 96 L 360 84 Q 210 20 60 84 Z" fill="rgba(0,0,0,0.35)" />
              )}
              {roof === 2 && (
                <path d="M 70 100 Q 210 -30 350 100" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={6} />
              )}
            </g>
          )}

          {/* Erba (cuneo) + strisce di taglio */}
          <g clipPath={`url(#${clip})`}>
            <rect x="0" y="0" width="420" height="400" fill="url(#grass)" />
            {Array.from({ length: 9 }, (_, i) => (
              <rect
                key={i}
                x={i * 48}
                y={0}
                width={48}
                height={400}
                fill={i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}
              />
            ))}
            {/* Warning track lungo il muro */}
            <path d="M 55 175 Q 210 -40 365 175" fill="none" stroke="#8a5a34" strokeWidth={10} opacity={0.85} />
          </g>

          {/* Muro esterno (colore squadra) */}
          <path d="M 55 175 Q 210 -40 365 175" fill="none" stroke={primary} strokeWidth={5} />
          {/* Pali di fallo */}
          <line x1="210" y1="330" x2="55" y2="175" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
          <line x1="210" y1="330" x2="365" y2="175" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />

          {/* Interno: linee delle basi (terra) */}
          <path
            d={`M ${HOME_PLATE.x} ${HOME_PLATE.y} L ${FIRST.x} ${FIRST.y} L ${SECOND.x} ${SECOND.y} L ${THIRD.x} ${THIRD.y} Z`}
            fill="rgba(180,120,70,0.18)"
            stroke="#b5764a"
            strokeWidth={9}
            strokeLinejoin="round"
          />
          {/* Zolla del monte e del piatto */}
          <circle cx={MOUND.x} cy={MOUND.y} r={16} fill="#b5764a" />
          <circle cx={HOME_PLATE.x} cy={HOME_PLATE.y} r={20} fill="#b5764a" opacity={0.55} />

          {/* Basi */}
          {[FIRST, SECOND, THIRD].map((b, i) => (
            <rect key={i} x={b.x - 4} y={b.y - 4} width={8} height={8} fill="#f4f6fb" transform={`rotate(45 ${b.x} ${b.y})`} />
          ))}
          {/* Casa base */}
          <path d={`M ${HOME_PLATE.x - 5} ${HOME_PLATE.y - 3} L ${HOME_PLATE.x + 5} ${HOME_PLATE.y - 3} L ${HOME_PLATE.x + 5} ${HOME_PLATE.y + 1} L ${HOME_PLATE.x} ${HOME_PLATE.y + 6} L ${HOME_PLATE.x - 5} ${HOME_PLATE.y + 1} Z`} fill="#f4f6fb" />
          {/* Pedana di lancio */}
          <rect x={MOUND.x - 5} y={MOUND.y - 1} width={10} height={3} rx={1} fill="#f4f6fb" />

          {/* Battitore (colore squadra ospite) nel box */}
          <circle cx={HOME_PLATE.x - 12} cy={HOME_PLATE.y - 6} r={6} fill={away.primaryColor || '#888'} stroke="#fff" strokeWidth={1.2} />

          {/* Difesa di casa con etichette */}
          {DEFENSE.map((s) => (
            <FielderLabel key={s.pos} x={s.x} y={s.y} pos={s.pos} name={playerAt(home, s.pos)} />
          ))}
        </svg>
      </div>
    </div>
  );
}
