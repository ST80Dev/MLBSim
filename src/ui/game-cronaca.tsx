import { useState, useRef, useEffect, Fragment } from 'react';
import type { GameResult, PlayEvent } from '../engine/game';
import type { Side } from './types';
import { buildCommentary, logLine, PHASE_MS, HOLD_MS } from './commentary';
import type { Commentary } from './commentary';
import { scoreCode } from './scorecode';

// ---------------------------------------------------------------------------
// Cronaca della partita: raggruppa gli eventi per mezzo-inning (groupPlays),
// banner a fasi (PlayBanner) e cronaca laterale per squadra (CronacaTeam).
// Estratti da App.tsx.
// ---------------------------------------------------------------------------

interface CronacaGroup {
  key: string;
  header: string;
  events: PlayEvent[];
}

export function groupPlays(result: GameResult): CronacaGroup[] {
  const groups: CronacaGroup[] = [];
  let cur: CronacaGroup | null = null;
  for (const ev of result.play) {
    const key = `${ev.inning}-${ev.half}`;
    if (!cur || cur.key !== key) {
      const batting = ev.half === 'top' ? result.away : result.home;
      const arrow = ev.half === 'top' ? '▲' : '▼';
      cur = { key, header: `${ev.inning}° ${arrow} ${batting.abbrev}`, events: [] };
      groups.push(cur);
    }
    cur.events.push(ev);
  }
  return groups;
}

/**
 * Banner di cronaca in alto-centro sopra la foto stadio: mostra la telecronaca
 * dell'ultima giocata in 2-3 fasi (attesa → sviluppo → verdetto), a tema coi
 * colori della squadra protagonista e con intensita' crescente per gli esiti
 * piu' straordinari (fuoricampo, doppio gioco…). A fine sequenza svanisce e la
 * frase sintetica resta nella cronaca laterale (dx/sx).
 */
export function PlayBanner({ result, onReveal }: { result: GameResult; onReveal?: () => void }) {
  const plays = result.play;
  const len = plays.length;
  // Non ri-animare le giocate gia' presenti al montaggio (partita ripresa).
  const seenRef = useRef(len);
  const [state, setState] = useState<{ com: Commentary; phase: number; leaving: boolean } | null>(
    null,
  );
  // `onReveal` cambia identita' quando cambia la partita: lo leggo da una ref
  // cosi' i timer schedulati usano sempre l'ultima versione senza ri-eseguire
  // l'effetto (che dipende solo da `len`).
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;
  const reveal = () => revealRef.current?.();

  useEffect(() => {
    if (len <= seenRef.current) {
      seenRef.current = len;
      reveal(); // nessuna telecronaca da animare: marker allineati subito.
      return;
    }
    seenRef.current = len;
    const ev = plays[len - 1];
    // La sostituzione (pinch-hit) non e' una giocata: niente banner.
    if (ev.kind === 'sub') {
      setState(null);
      reveal();
      return;
    }
    const offenseIsAway = ev.half === 'top';
    const off = offenseIsAway ? result.away : result.home;
    const def = offenseIsAway ? result.home : result.away;
    const com = buildCommentary(ev, {
      offense: { abbrev: off.abbrev, name: off.name, color: off.primaryColor },
      defense: { abbrev: def.abbrev, name: def.name, color: def.primaryColor },
    });

    setState({ com, phase: 0, leaving: false });
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < com.phases.length; i++) {
      timers.push(setTimeout(() => setState((s) => (s ? { ...s, phase: i } : s)), i * PHASE_MS));
    }
    // Al VERDETTO (ultima fase, "conquista la base"/"eliminato") sposto i marker
    // sul diamante: e' il momento in cui l'esito viene letto in cronaca.
    const revealAt = (com.phases.length - 1) * PHASE_MS;
    timers.push(setTimeout(reveal, revealAt));
    const end = (com.phases.length - 1) * PHASE_MS + HOLD_MS;
    timers.push(setTimeout(() => setState((s) => (s ? { ...s, leaving: true } : s)), end));
    timers.push(setTimeout(() => setState(null), end + 420));
    return () => timers.forEach(clearTimeout);
  }, [len]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;
  const { com, phase, leaving } = state;
  const cur = com.phases[phase];

  return (
    <div
      className={`play-banner tier-${com.tier} accent-${com.accent}${leaving ? ' leaving' : ''}${
        cur.climax ? ' climax' : ''
      }`}
      style={{ ['--bc' as string]: com.color }}
      aria-live="polite"
    >
      <div className="pb-strip" />
      <div className="pb-inner">
        <div className="pb-head">
          {cur.climax ? (
            <div className="pb-verdict">
              <span className="pb-icon">{com.icon}</span>
              <span className="pb-label">{com.label}</span>
              {com.scored > 0 && <span className="pb-runs">+{com.scored}</span>}
            </div>
          ) : (
            <span className="pb-dots">
              {com.phases.map((_, i) => (
                <i key={i} className={i <= phase ? 'on' : ''} />
              ))}
            </span>
          )}
        </div>
        <div className={`pb-text${cur.climax ? ' big' : ''}`} key={phase}>
          {cur.text}
        </div>
      </div>
    </div>
  );
}

/** Cronaca di UNA squadra (ospite = mezzi alti; casa = mezzi bassi). Per non
 *  invadere il boxscore sotto, mostra SOLO gli ultimi 3 mezzi-inning: l'ultimo
 *  (in corso) è espanso, i precedenti sono collassati alla sola testata impilata
 *  e si riaprono al clic. */
export function CronacaTeam({
  result,
  side,
  shownPlays,
}: {
  result: GameResult;
  side: Side;
  shownPlays?: number;
}) {
  const half = side === 'away' ? 'top' : 'bottom';
  // Le cronache laterali non anticipano l'esito scritto al centro: si fermano
  // alle giocate già "lette" (shownPlays). Se omesso, si mostra tutto.
  const shownLen = shownPlays ?? result.play.length;
  const shown = shownLen >= result.play.length ? result : { ...result, play: result.play.slice(0, shownLen) };
  const allGroups = groupPlays(shown).filter((g) => g.key.endsWith(half));
  // Solo gli ultimi 3 mezzi-inning di questa squadra: la sidebar resta corta e
  // non si sovrappone al boxscore.
  const groups = allGroups.slice(-3);
  const lastKey = groups.length ? groups[groups.length - 1].key : null;
  const team = side === 'away' ? result.away : result.home;
  // Inning riaperti a mano (oltre a quello corrente, sempre aperto).
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set());
  const isOpen = (key: string) => key === lastKey || openKeys.has(key);
  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [shownLen]);

  return (
    <div className="cronaca-team" style={{ ['--tc' as string]: team.primaryColor }}>
      <div className="crt-head">
        <span className="pill" style={{ background: team.primaryColor }}>
          {team.abbrev}
        </span>
        <span className="crt-title">Cronaca {side === 'away' ? 'ospite' : 'casa'}</span>
      </div>
      {/* Testate ed eventi sono figli DIRETTI del contenitore scrollabile (non
          annidati in un box per-inning): così ogni testata `sticky` resta
          agganciata all'intero corpo e le testate si IMPILANO in cima invece di
          scorrere via una alla volta. */}
      <div className="crt-body" ref={bodyRef}>
        {groups.length === 0 && <div className="cr-empty">In attesa…</div>}
        {groups.map((g, gi) => {
          const open = isOpen(g.key);
          const isCurrent = g.key === lastKey;
          return (
            <Fragment key={g.key}>
              <div
                className={`cr-inhead${open ? '' : ' collapsed'}${isCurrent ? ' current' : ''}`}
                // Impilamento: ogni testata si ferma un gradino più in basso della
                // precedente, così restano accumulate e fisse in cima.
                style={{ top: `calc(var(--crh) * ${gi})`, zIndex: groups.length - gi }}
                onClick={isCurrent ? undefined : () => toggle(g.key)}
                title={isCurrent ? undefined : open ? 'Comprimi inning' : 'Espandi inning'}
              >
                <span className="cr-inhead-l">
                  {!isCurrent && <span className="cr-caret">{open ? '▾' : '▸'}</span>}
                  {g.header}
                </span>
                <span className="cr-score">
                  {g.events[g.events.length - 1].away}–{g.events[g.events.length - 1].home}
                </span>
              </div>
              {open && (
                <ul>
                  {g.events.map((ev, i) => {
                    const sc = scoreCode(ev);
                    return (
                      <li key={i} className={ev.runsScored > 0 ? 'scored' : ''}>
                        {sc && (
                          <span className="cr-code" title={sc.title}>
                            {sc.code}
                          </span>
                        )}
                        {logLine(ev)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
