import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Team } from '../engine/types';
import { createLiveGame, toGameResult, situation } from '../engine/game';
import { computeMarkers } from './Diamond';
import { teamById } from '../data/league';
import {
  getCalibrationFor,
  calibrationStem,
  PHOTO_DEFAULT_CALIBRATION,
  CALIBRATION_RANGE,
  CALIBRATION_LABEL,
} from '../data/stadiumCalibration';
import type { FieldCalibration, NumericCalKey } from '../data/stadiumCalibration';
import { stadiumImage, stadiumImageCandidates } from '../data/stadiumImages';
import type { StadiumImageCandidate } from '../data/stadiumImages';
import { GameScreen } from './game-screen';
import { ActionBar } from './game-actionbar';



// ---------------------------------------------------------------------------
// Pannello di calibrazione: sposta/allarga/allunga i marker rispetto alla foto
// di sfondo (perno = casa base) e zooma/pan la foto. Live, con output JSON da
// incollare in src/data/stadiumCalibration.ts. Solo UI, non tocca il motore.
// ---------------------------------------------------------------------------

const CAL_FIELD_KEYS: NumericCalKey[] = [
  'homeX',
  'homeY',
  'spreadX',
  'depthY',
  'ofDist',
  'rotation',
  'fan',
];
const CAL_PHOTO_KEYS: NumericCalKey[] = ['bgZoom', 'bgX', 'bgY'];

function fmtCalNum(v: number, step: number): string {
  return step >= 1 ? String(Math.round(v)) : v.toFixed(2);
}

function calEntry(id: string, cal: FieldCalibration): string {
  const r0 = (n: number) => Math.round(n);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const img = cal.image ? `, image: '${cal.image}'` : '';
  return `  ${id}: { homeX: ${r0(cal.homeX)}, homeY: ${r0(cal.homeY)}, spreadX: ${r2(
    cal.spreadX,
  )}, depthY: ${r2(cal.depthY)}, ofDist: ${r2(cal.ofDist)}, rotation: ${r2(cal.rotation)}, fan: ${r2(
    cal.fan,
  )}, bgZoom: ${r2(cal.bgZoom)}, bgX: ${r0(cal.bgX)}, bgY: ${r0(cal.bgY)}${img} },`;
}

// ---------------------------------------------------------------------------
// Schermata dedicata "🎯 Stadi": calibra i marker di QUALSIASI stadio senza
// giocarci una partita. Rende la PLANCIA IDENTICA a un match (GameScreen su una
// partita "mock"), così la foto e i marker appaiono con la stessa cornice e le
// stesse proporzioni che si vedranno in gara — niente rischio di ricalibrare.
// Parte già in piazzamento manuale; il pannello ospita il selettore di stadio,
// lo spostamento in blocco e il "blocca alla foto". Persistenza = Esporta file.
// ---------------------------------------------------------------------------

/** Seme fisso della partita mock (nessun RNG interattivo: resta al 1° inning). */
const CAL_MOCK_SEED = 20260726;

/** Una foto-stadio selezionabile (principale o doppione), rilevata nel repo. */
interface PhotoOption {
  teamId: string;
  /** undefined = principale; altrimenti `stadiums/<ID><n>.jpg`. */
  image?: string;
  label: string;
  key: string;
}

export function CalibrationScreen({
  league,
  teamId,
  setTeamId,
  onClose,
}: {
  league: Team[];
  teamId: string;
  setTeamId: (id: string) => void;
  onClose: () => void;
}) {
  // Elenca TUTTE le foto presenti nel repo — principale E doppioni (`<ID>2.jpg`,
  // `<ID>3.jpg`…) — provando a caricarle: così sono selezionabili e calibrabili
  // a sé, anche le varianti non ancora calibrate.
  const [options, setOptions] = useState<PhotoOption[]>([]);
  useEffect(() => {
    let alive = true;
    const jobs: Promise<PhotoOption | null>[] = [];
    for (const t of league) {
      stadiumImageCandidates(t.id).forEach((c, i) => {
        jobs.push(
          new Promise((res) => {
            const img = new Image();
            img.onload = () =>
              res({
                teamId: t.id,
                image: i === 0 ? undefined : c.path,
                label: `📷 ${t.abbrev} · ${c.label} — ${t.ballpark}`,
                key: `${t.id}|${i === 0 ? '' : c.path}`,
              });
            img.onerror = () => res(null);
            img.src = c.url;
          }),
        );
      });
    }
    Promise.all(jobs).then((r) => {
      if (alive) setOptions(r.filter((o): o is PhotoOption => o !== null));
    });
    return () => {
      alive = false;
    };
  }, [league]);

  const team = teamById(league, teamId) ?? league[0];
  const away = league.find((t) => t.id !== teamId) ?? league[0];

  // Partita mock (away @ team-scelto): dà la stessa plancia del match. Non la si
  // fa avanzare, quindi resta all'inizio (nessun corridore reale in base).
  const live = useMemo(
    () => createLiveGame(away, team, CAL_MOCK_SEED, 'home'),
    [away, team],
  );
  const result = useMemo(() => toGameResult(live), [live]);
  const sit = useMemo(() => situation(live), [live]);

  // Foto selezionata (principale o doppione) e sua calibrazione. Parte GIÀ in
  // piazzamento manuale (marker seminati dalla proiezione se assenti).
  const [image, setImage] = useState<string | undefined>(undefined);
  const [cal, setCal] = useState<FieldCalibration>(() =>
    withManualMarkers(getCalibrationFor(teamId, undefined)),
  );
  // Selezionare una foto (dal dropdown o dai chip varianti) ne CARICA la
  // calibrazione salvata: ogni doppione si calibra e si esporta a sé.
  const selectPhoto = (tId: string, img?: string) => {
    setTeamId(tId);
    setImage(img);
    setCal(withManualMarkers(getCalibrationFor(tId, img)));
  };

  const editing = !!cal.markers;
  const moveMarker = (id: string, pos: { x: number; y: number }) => {
    setCal({ ...cal, markers: { ...(cal.markers ?? {}), [id]: pos } });
  };

  // Nomi campione per le etichette (basi + battitore): la partita mock è a
  // basi vuote, quindi passiamo dei nomi dai roster per renderle posizionabili.
  const sampleRunners = team.lineup.slice(0, 3).map((b) => b.name);
  const sampleBatter = away.lineup[0]?.name ?? sit.batter.name;

  const currentKey = `${teamId}|${image ?? ''}`;
  const opts: PhotoOption[] = options.length
    ? options
    : [{ teamId, image: undefined, label: `📷 ${team.abbrev} · Principale — ${team.ballpark}`, key: currentKey }];

  const picker = (
    <div className="cal-picker">
      <div className="cal-group">Stadio / foto (incl. doppioni)</div>
      <select
        className="cal-select"
        value={currentKey}
        onChange={(e) => {
          const o = opts.find((x) => x.key === e.target.value);
          if (o) selectPhoto(o.teamId, o.image);
        }}
      >
        {opts.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <GameScreen
        result={result}
        sit={sit}
        editing={editing}
        cal={cal}
        onMarkerMove={moveMarker}
        runners={sampleRunners}
        batterName={sampleBatter}
        controls={<ActionBar live={live} sit={sit} act={() => {}} />}
      />
      <CalibrationPanel
        team={team}
        hasPhoto={!!stadiumImage(teamId)}
        cal={cal}
        setCal={setCal}
        onClose={onClose}
        picker={picker}
        blockTools
        onPickImage={(img) => selectPhoto(teamId, img)}
      />
    </>
  );
}

/** Assicura che la calibrazione sia in piazzamento manuale: se non ha già i
 *  marker, li semina dalla proiezione corrente (così la schermata Stadi parte
 *  subito in modalità trascinamento). */
function withManualMarkers(cal: FieldCalibration): FieldCalibration {
  return cal.markers ? cal : { ...cal, markers: computeMarkers(cal) };
}

// --- Aggancio marker↔foto: la foto è resa in un box che scala/trasla con
// bgZoom/bgX/bgY (viewBox 900×420). Un marker a coord. viewBox corrisponde a un
// punto normalizzato del box; ricollocandolo con i nuovi parametri resta
// "incollato" alla foto (stessa scala e traslazione del box). ------------------
const CAL_VB = { w: 900, h: 420 };
function photoBox(zoom: number, x: number, y: number) {
  const iw = CAL_VB.w * zoom;
  const ih = CAL_VB.h * zoom;
  return { ix: (CAL_VB.w - iw) / 2 + x, iy: (CAL_VB.h - ih) / 2 + y, iw, ih };
}
/** Ricolloca i marker perché seguano la foto quando cambiano i parametri bg. */
function relockMarkers(
  markers: Record<string, { x: number; y: number }>,
  prev: FieldCalibration,
  next: { bgZoom: number; bgX: number; bgY: number },
): Record<string, { x: number; y: number }> {
  const a = photoBox(prev.bgZoom, prev.bgX, prev.bgY);
  const b = photoBox(next.bgZoom, next.bgX, next.bgY);
  const out: Record<string, { x: number; y: number }> = {};
  for (const id in markers) {
    const m = markers[id];
    const u = (m.x - a.ix) / a.iw;
    const v = (m.y - a.iy) / a.ih;
    out[id] = { x: Math.round(b.ix + u * b.iw), y: Math.round(b.iy + v * b.ih) };
  }
  return out;
}

export function CalibrationPanel({
  team,
  hasPhoto,
  cal,
  setCal,
  onClose,
  picker,
  blockTools,
  onPickImage,
}: {
  team: Team;
  hasPhoto: boolean;
  cal: FieldCalibration;
  setCal: (c: FieldCalibration) => void;
  onClose: () => void;
  /** Nodo opzionale (selettore di stadio) mostrato in cima al pannello. */
  picker?: ReactNode;
  /** Mostra spostamento in blocco + "blocca alla foto" (schermata Stadi). */
  blockTools?: boolean;
  /** Se presente, scegliere una variante-foto delega qui (per ricaricarne la
   *  calibrazione salvata) invece di limitarsi a cambiare `cal.image`. */
  onPickImage?: (path: string | undefined) => void;
}) {
  const [copied, setCopied] = useState(false);
  // "Blocca marker alla foto": quando è attivo, ogni zoom/pan dello sfondo
  // ri-aggancia i marker alla foto (restano incollati proporzionalmente).
  const [locked, setLocked] = useState(true);

  // Rileva le varianti-foto presenti nel repo (principale + XXX2/XXX3/…):
  // prova a caricarle e tiene solo quelle che esistono.
  const [variants, setVariants] = useState<StadiumImageCandidate[]>([]);
  useEffect(() => {
    let alive = true;
    const cands = stadiumImageCandidates(team.id);
    if (cands.length === 0) {
      setVariants([]);
      return;
    }
    Promise.all(
      cands.map(
        (c) =>
          new Promise<boolean>((res) => {
            const img = new Image();
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = c.url;
          }),
      ),
    ).then((oks) => {
      if (alive) setVariants(cands.filter((_, i) => oks[i]));
    });
    return () => {
      alive = false;
    };
  }, [team.id]);

  const clampKey = (k: NumericCalKey, val: number) => {
    const rng = CALIBRATION_RANGE[k];
    const clamped = Math.max(rng.min, Math.min(rng.max, val));
    const dec = rng.step >= 1 ? 0 : 2;
    const p = Math.pow(10, dec);
    return Math.round(clamped * p) / p;
  };
  const set = (k: NumericCalKey, val: number) => {
    setCal({ ...cal, [k]: clampKey(k, val) });
    setCopied(false);
  };
  // Setter per i parametri della FOTO: se "blocca alla foto" è attivo e ci sono
  // marker manuali, li ri-aggancia così seguono zoom/pan (restano sulla foto).
  const setBg = (k: NumericCalKey, val: number) => {
    const next: FieldCalibration = { ...cal, [k]: clampKey(k, val) };
    if (locked && cal.markers) {
      next.markers = relockMarkers(cal.markers, cal, next);
    }
    setCal(next);
    setCopied(false);
  };
  // Sposta TUTTI i marker in blocco (le 4 direzioni), utile se cambia
  // l'inquadratura della foto: tiene le distanze relative.
  const nudgeAll = (dx: number, dy: number) => {
    if (!cal.markers) return;
    const next: Record<string, { x: number; y: number }> = {};
    for (const id in cal.markers) {
      next[id] = { x: cal.markers[id].x + dx, y: cal.markers[id].y + dy };
    }
    setCal({ ...cal, markers: next });
    setCopied(false);
  };

  const pickImage = (path: string | undefined) => {
    if (onPickImage) {
      onPickImage(path);
    } else {
      // Cambiare foto CARICA la calibrazione salvata di QUELLA foto (marker
      // inclusi): mai la foto di una variante con i marker di un'altra.
      setCal(getCalibrationFor(team.id, path));
    }
    setCopied(false);
  };

  const entry = calEntry(team.id, cal);
  const copy = () => {
    navigator.clipboard?.writeText(entry).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  };

  // Piazzamento manuale: seed dei marker dalla proiezione corrente, poi trascino.
  const manual = !!cal.markers;
  const enterManual = () => setCal({ ...cal, markers: computeMarkers(cal) });
  const exitManual = () => {
    const next = { ...cal };
    delete next.markers;
    setCal(next);
  };

  // Esporta un file JSON nominato come la foto (<STEM>.json), da mettere in
  // src/data/calibrations/ e committare: si applica al deploy.
  const stem = calibrationStem(team.id, cal.image);
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(cal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stem}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const row = (k: NumericCalKey, setter: (k: NumericCalKey, v: number) => void = set) => {
    const rng = CALIBRATION_RANGE[k];
    const v = cal[k];
    // Passo dei pulsanti −/+: 5 px per i parametri in pixel (step 1).
    const nudge = rng.step * 5;
    return (
      <div className="cal-row" key={k}>
        <div className="cal-row-top">
          <span className="cal-label">{CALIBRATION_LABEL[k]}</span>
          <span className="cal-val">{fmtCalNum(v, rng.step)}</span>
        </div>
        <div className="cal-ctrl">
          <button className="cal-step" onClick={() => setter(k, v - nudge)} aria-label="diminuisci">
            −
          </button>
          <input
            type="range"
            min={rng.min}
            max={rng.max}
            step={rng.step}
            value={v}
            onChange={(e) => setter(k, parseFloat(e.target.value))}
          />
          <button className="cal-step" onClick={() => setter(k, v + nudge)} aria-label="aumenta">
            +
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="cal-panel">
      <div className="cal-head">
        <span className="cal-title">🎯 Calibra campo · {team.abbrev}</span>
        <button className="modal-close" onClick={onClose} aria-label="Chiudi">
          ✕
        </button>
      </div>
      {picker}
      {!hasPhoto && (
        <div className="cal-note">
          Nessuna foto per questo stadio: stai calibrando sul campo generato. Aggiungi
          <code> public/stadiums/{team.id}.jpg</code> per lo sfondo reale.
        </div>
      )}
      {variants.length >= 1 && (
        <>
          <div className="cal-group">Foto dello stadio ({variants.length})</div>
          <div className="cal-variants">
            {variants.map((c, i) => {
              const active = i === 0 ? !cal.image : cal.image === c.path;
              return (
                <button
                  key={c.path}
                  className={`cal-var${active ? ' active' : ''}`}
                  title={c.path}
                  onClick={() => pickImage(i === 0 ? undefined : c.path)}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {variants.length === 1 && (
            <div className="cal-hint">
              Una sola foto. Aggiungi <code>{team.id}2.jpg</code> in{' '}
              <code>public/stadiums/</code> per averne alternative.
            </div>
          )}
        </>
      )}
      {manual ? (
        <>
          <div className="cal-group">Piazzamento manuale</div>
          <div className="cal-note">
            Trascina i marker sulla foto: <b>9 difensori</b>, <b>3 basi</b>, casa base
            e <b>battitore</b>. Le <b>etichette-nome</b> (corridori sulle basi e
            battitore) si spostano <b>insieme</b> al marker.
          </div>
          {blockTools && (
            <>
              <div className="cal-group">Sposta tutti in blocco</div>
              <div className="cal-note">
                Muove <b>tutti</b> i marker insieme, tenendo le distanze — utile se
                cambi l'inquadratura della foto.
              </div>
              <div className="cal-pad">
                <button className="cal-padbtn up" onClick={() => nudgeAll(0, -4)} aria-label="su">
                  ▲
                </button>
                <button className="cal-padbtn left" onClick={() => nudgeAll(-4, 0)} aria-label="sinistra">
                  ◀
                </button>
                <button className="cal-padbtn right" onClick={() => nudgeAll(4, 0)} aria-label="destra">
                  ▶
                </button>
                <button className="cal-padbtn down" onClick={() => nudgeAll(0, 4)} aria-label="giù">
                  ▼
                </button>
              </div>
              <label className="cal-lock">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(e) => setLocked(e.target.checked)}
                />
                🔒 Blocca marker alla foto (seguono zoom/pan)
              </label>
            </>
          )}
          <button className="btn" onClick={exitManual}>
            ↩︎ Torna ai parametri
          </button>
        </>
      ) : (
        <>
          <div className="cal-group">Campo (perno = casa base)</div>
          {CAL_FIELD_KEYS.map((k) => row(k))}
          <button className="btn" onClick={enterManual} title="Sposta i marker a mano sulla foto">
            ✋ Piazza marker a mano
          </button>
        </>
      )}
      <div className="cal-group">Foto di sfondo</div>
      {CAL_PHOTO_KEYS.map((k) => row(k, setBg))}
      <div className="cal-actions">
        <button
          className="btn"
          onClick={() => {
            const base: FieldCalibration = { ...PHOTO_DEFAULT_CALIBRATION, image: cal.image };
            // In manuale mantieni la modalità (ri-semina i marker), altrimenti torna ai parametri.
            setCal(cal.markers ? { ...base, markers: computeMarkers(base) } : base);
          }}
          title="Riporta ai valori iniziali per le foto (mantiene la foto scelta)"
        >
          Azzera
        </button>
        <button className="btn primary" onClick={exportFile} title={`Scarica ${stem}.json`}>
          ⤓ Esporta file
        </button>
      </div>
      <div className="cal-hint">
        <b>Esporta file</b> → scarica <code>{stem}.json</code>. Mettilo in{' '}
        <code>src/data/calibrations/</code> e committa: si applica al deploy per la foto{' '}
        <code>{stem}.jpg</code>, su qualsiasi dispositivo. Nessuna modifica al codice.
      </div>
      <details className="cal-alt">
        <summary>oppure incolla la riga a mano</summary>
        <textarea className="cal-out" readOnly value={entry} onFocus={(e) => e.target.select()} />
        <button className="btn sm" onClick={copy}>
          {copied ? 'Copiato ✓' : 'Copia JSON'}
        </button>
        <div className="cal-hint">
          In <code>STADIUM_CALIBRATION</code> (<code>src/data/stadiumCalibration.ts</code>).
        </div>
      </details>
    </div>
  );
}
