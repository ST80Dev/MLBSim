import type { Team } from '../engine/types';
import { RATING_AVG } from '../engine/ratings';

// ---------------------------------------------------------------------------
// Widget di visualizzazione puri e riusabili (estratti da App.tsx): basi,
// out, badge squadra, colore-forza, stato d'affaticamento del lanciatore.
// Nessuno stato, nessun hook.
// ---------------------------------------------------------------------------

/** Diamante delle basi occupate (1B destra, 2B sopra, 3B sinistra). */
export function BaseDiamond({ bases }: { bases: [boolean, boolean, boolean] }) {
  const fill = (on: boolean) => (on ? 'var(--win)' : 'transparent');
  return (
    <svg className="diamond" width="70" height="70" viewBox="0 0 100 100" aria-label="basi">
      <g stroke="var(--line)" strokeWidth="3">
        <rect x="60" y="42" width="16" height="16" transform="rotate(45 68 50)" fill={fill(bases[0])} />
        <rect x="42" y="24" width="16" height="16" transform="rotate(45 50 32)" fill={fill(bases[1])} />
        <rect x="24" y="42" width="16" height="16" transform="rotate(45 32 50)" fill={fill(bases[2])} />
      </g>
    </svg>
  );
}

/** Pallini degli out (0-3). */
export function OutsDots({ outs }: { outs: number }) {
  return (
    <div className="outs" title={`${outs} out`}>
      <span className="outs-label">OUT</span>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`out-dot${i < outs ? ' on' : ''}`} />
      ))}
    </div>
  );
}

/** Badge quadrato della squadra (sigla su colori sociali). */
export function TeamBadge({ team, size = 46 }: { team: Team; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={team.name}>
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="22"
        fill={team.primaryColor}
        stroke={team.secondaryColor}
        strokeWidth="6"
      />
      <text
        x="50"
        y="54"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={team.abbrev.length > 2 ? 30 : 36}
        fontWeight={800}
        fill={team.secondaryColor}
        fontFamily="system-ui, sans-serif"
      >
        {team.abbrev}
      </text>
    </svg>
  );
}

/** Colore-forza (rosso→verde) da un rating/overall sulla scala di lega. */
export function strengthColor(v: number): string {
  const t = Math.max(0, Math.min(1, (v - (RATING_AVG - 20)) / 45));
  return `hsl(${Math.round(t * 125)} 60% 46%)`;
}

/**
 * Stato d'affaticamento del lanciatore, ancorato alla vera meccanica del motore:
 * la soglia è la **Resistenza** (`pitcher.stamina`, in battitori affrontabili),
 * non i lanci stimati. Il malus ai peripherals scatta appena i battitori
 * affrontati superano la soglia (`fatigueFactor`); il cambio automatico avviene
 * a soglia + margine (SP +4, rilievo +2, come `autoManagePitcher`).
 *  - `fresh`  : ampio margine, nessun malus
 *  - `tiring` : entro 2 battitori dalla soglia o appena oltre → affaticamento in corso
 *  - `spent`  : oltre la soglia di cambio automatico
 */
export function pitcherFatigue(
  role: string | undefined,
  stamina: number,
  bf: number,
): { state: 'fresh' | 'tiring' | 'spent'; tone?: string } {
  const margin = role === 'SP' ? 4 : 2;
  if (bf >= stamina + margin) return { state: 'spent', tone: '#ff6b6b' };
  if (bf >= stamina - 2) return { state: 'tiring', tone: '#ffcf5c' };
  return { state: 'fresh' };
}
