import type { Team } from '../engine/types';
import { RATING_AVG } from '../engine/ratings';
import { ratingColor } from './format';
import { outerWall, capZone } from '../data/leagueMode';
import type { LeagueMode, CapZone } from '../data/leagueMode';
import type { TeamStrength } from '../engine/strength';

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

export const CAP_ZONE: Record<CapZone, { label: string; cls: string }> = {
  under: { label: 'Sotto cap', cls: 'under' },
  tax: { label: 'Fascia tassa', cls: 'tax' },
  over: { label: 'Oltre il muro', cls: 'over' },
};

/** Barra monte-ingaggi con tacche cap base e muro esterno; zona colorata. */
export function CapIndicator({
  payroll,
  mode,
  compact,
}: {
  payroll: number;
  mode: LeagueMode;
  compact?: boolean;
}) {
  const base = mode.cap.amount;
  const wall = outerWall(base);
  const z = CAP_ZONE[capZone(payroll, mode)];
  const scale = wall * 1.12; // margine oltre il muro, così la tacca resta visibile
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / scale) * 100))}%`;
  return (
    <div className={`cap-ind${compact ? ' compact' : ''}`}>
      <div
        className="cap-bar"
        title={`Monte-ingaggi $${payroll.toFixed(0)}M · cap base $${base}M · muro $${wall.toFixed(0)}M`}
      >
        <div className={`cap-fill ${z.cls}`} style={{ width: pct(payroll) }} />
        <div className="cap-mark base" style={{ left: pct(base) }} title={`Cap base $${base}M`} />
        <div className="cap-mark wall" style={{ left: pct(wall) }} title={`Muro $${wall.toFixed(0)}M`} />
      </div>
      {!compact && (
        <div className="cap-row">
          <span className={`cap-chip ${z.cls}`}>{z.label}</span>
          <span className="muted">
            ${payroll.toFixed(0)}M / cap ${base}M · muro ${wall.toFixed(0)}M
          </span>
        </div>
      )}
    </div>
  );
}

/** Tre barrette Attacco/Difesa/Lancio (scala 40-100). */
export function StrengthBars({ s }: { s: TeamStrength }) {
  const rows: Array<[string, number]> = [
    ['ATT', s.attack],
    ['DIF', s.defense],
    ['LAN', s.pitching],
  ];
  return (
    <div className="str-bars">
      {rows.map(([k, v]) => (
        <div className="str-row" key={k}>
          <span className="str-k">{k}</span>
          <span className="str-track">
            <span
              className="str-fill"
              style={{ width: `${((v - 40) / 60) * 100}%`, background: ratingColor(v) }}
            />
          </span>
          <span className="str-v">{v.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}
