// Calibrazione dei marker di campo rispetto alla foto-stadio di sfondo.
//
// I marker (basi, monte, casa base, difensori, linee di foul, muro) sono
// definiti in coordinate "base" nel viewBox 900x420 del Diamond. Per adattarli
// a una foto reale — scattata da dietro casa base, non perfettamente in asse —
// il Diamond li ri-proietta con questi parametri, usando CASA BASE come perno:
//
//   dx    = xBase - HOME_BASE.x            (spostamento laterale dal piatto)
//   depth = HOME_BASE.y - yBase            (profondita': 0 a casa, cresce salendo)
//   x     = homeX + dx * spreadX * (1 + depthN * fan)
//   y     = homeY - depth * depthY
//
// dove depthN e' la profondita' normalizzata (0 a casa base, 1 al muro centrale).
// Cosi' spostando homeX/homeY si trascina tutto il campo tenendo il piatto come
// perno; spreadX allarga/stringe in orizzontale; depthY allunga/accorcia in
// profondita'; fan apre di piu' i marker lontani (prospettiva a ventaglio).
//
// La foto di sfondo ha i suoi zoom/pan: bgZoom (scala), bgX/bgY (traslazione).
//
// Il pannello "🎯 Calibra campo" (in partita) modifica questi valori LIVE e
// stampa il JSON da incollare qui sotto, una voce per stadio (ID franchigia).

export interface FieldCalibration {
  /** Posizione orizzontale di casa base (perno) nel viewBox 900x420. */
  homeX: number;
  /** Posizione verticale di casa base (perno). */
  homeY: number;
  /** Scala orizzontale dei marker (1 = neutro). */
  spreadX: number;
  /** Scala di profondita' dei marker (1 = neutro). */
  depthY: number;
  /** Distanza interni↔esterni: scala la profondita' OLTRE l'interno, tenendo
   *  fermo l'interno. <1 avvicina gli esterni (schiaccia la prospettiva),
   *  >1 li allontana. 1 = neutro. */
  ofDist: number;
  /** Inclinazione sx/dx: sposta i marker piu' lontani verso destra (>0) o
   *  sinistra (<0), per raddrizzare un campo storto (0 = niente). */
  skewX: number;
  /** Apertura a ventaglio: quanto si allargano i marker piu' lontani (0 = niente). */
  fan: number;
  /** Zoom della foto di sfondo (1 = riempimento base). */
  bgZoom: number;
  /** Traslazione orizzontale della foto di sfondo (unita' viewBox). */
  bgX: number;
  /** Traslazione verticale della foto di sfondo (unita' viewBox). */
  bgY: number;
  /** Foto scelta (percorso relativo in public/): se assente usa la principale
   *  `<ID>.jpg`. Serve a preferire un'alternativa `<ID>2.jpg`/`<ID>3.jpg`/…. */
  image?: string;
}

/** Valori neutri: identita' della proiezione (campo generato non deformato). */
export const DEFAULT_CALIBRATION: FieldCalibration = {
  homeX: 450,
  homeY: 394,
  spreadX: 1,
  depthY: 1,
  ofDist: 1,
  skewX: 0,
  fan: 0,
  bgZoom: 1,
  bgX: 0,
  bgY: 0,
};

/** Chiavi numeriche (con slider) della calibrazione — esclude `image`. */
export type NumericCalKey =
  | 'homeX'
  | 'homeY'
  | 'spreadX'
  | 'depthY'
  | 'ofDist'
  | 'skewX'
  | 'fan'
  | 'bgZoom'
  | 'bgX'
  | 'bgY';

/** Limiti degli slider del pannello di calibrazione. */
export const CALIBRATION_RANGE: Record<
  NumericCalKey,
  { min: number; max: number; step: number }
> = {
  homeX: { min: 200, max: 700, step: 1 },
  homeY: { min: 250, max: 419, step: 1 },
  spreadX: { min: 0.3, max: 2.2, step: 0.01 },
  depthY: { min: 0.3, max: 2.2, step: 0.01 },
  ofDist: { min: 0.3, max: 1.8, step: 0.02 },
  skewX: { min: -300, max: 300, step: 2 },
  fan: { min: -0.6, max: 1.2, step: 0.01 },
  bgZoom: { min: 0.5, max: 3, step: 0.01 },
  bgX: { min: -400, max: 400, step: 1 },
  bgY: { min: -300, max: 300, step: 1 },
};

/** Etichette leggibili degli slider. */
export const CALIBRATION_LABEL: Record<NumericCalKey, string> = {
  homeX: 'Casa base — orizzontale',
  homeY: 'Casa base — verticale',
  spreadX: 'Larghezza campo',
  depthY: 'Profondita campo',
  ofDist: 'Distanza interni↔esterni',
  skewX: 'Inclinazione sx/dx',
  fan: 'Apertura prospettica',
  bgZoom: 'Foto — zoom',
  bgX: 'Foto — sposta orizz.',
  bgY: 'Foto — sposta vert.',
};

// Override per stadio (ID franchigia). Le chiavi non indicate restano ai
// valori di DEFAULT_CALIBRATION. Incolla qui l'output del pannello di calibrazione.
export const STADIUM_CALIBRATION: Record<string, Partial<FieldCalibration>> = {};

/** Calibrazione effettiva di uno stadio (default + eventuale override). */
export function getCalibration(teamId: string): FieldCalibration {
  return { ...DEFAULT_CALIBRATION, ...(STADIUM_CALIBRATION[teamId] ?? {}) };
}
