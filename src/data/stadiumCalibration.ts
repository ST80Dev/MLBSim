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
  /** Distanza interni↔esterni: scala la profondita' oltre gli angoli
   *  dell'interno (tiene ferme 1a/3a e monte, avvicina 2a/SS ed esterni).
   *  <1 avvicina (schiaccia la prospettiva), >1 allontana. 1 = neutro. */
  ofDist: number;
  /** Prospettiva laterale (campo storto): allunga le distanze dei marker di un
   *  lato e avvicina quelli opposti. >0 allunga a destra e avvicina a sinistra
   *  (e viceversa). 0 = niente. Non è una rotazione rigida: è uno stiramento
   *  della profondità in funzione del lato (regole di prospettiva). */
  rotation: number;
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

/** Valori neutri: identita' della proiezione. Usati per il CAMPO GENERATO
 *  (squadre senza foto), che non va deformato. */
export const DEFAULT_CALIBRATION: FieldCalibration = {
  homeX: 450,
  homeY: 394,
  spreadX: 1,
  depthY: 1,
  ofDist: 1,
  rotation: 0,
  fan: 0,
  bgZoom: 1,
  bgX: 0,
  bgY: 0,
};

/**
 * Calibrazione iniziale per gli stadi con FOTO. Quasi tutte le foto (viste da
 * dietro casa base) hanno: casa base un po' più in alto del bordo inferiore, e
 * gli esterni schiacciati in prospettiva (poco più in alto degli interni).
 * Questi valori partono già così, per non dover rifare gli stessi aggiustamenti
 * a ogni stadio. Ogni stadio può poi sovrascriverli in STADIUM_CALIBRATION.
 */
export const PHOTO_DEFAULT_CALIBRATION: FieldCalibration = {
  homeX: 450,
  homeY: 360,
  spreadX: 1,
  depthY: 0.78,
  ofDist: 0.85,
  rotation: 0,
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
  | 'rotation'
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
  ofDist: { min: 0.2, max: 1.8, step: 0.02 },
  rotation: { min: -0.8, max: 0.8, step: 0.02 },
  fan: { min: -1.5, max: 1.8, step: 0.01 },
  bgZoom: { min: 0.3, max: 5, step: 0.01 },
  bgX: { min: -1500, max: 1500, step: 1 },
  bgY: { min: -1200, max: 1200, step: 1 },
};

/** Etichette leggibili degli slider. */
export const CALIBRATION_LABEL: Record<NumericCalKey, string> = {
  homeX: 'Casa base — orizzontale',
  homeY: 'Casa base — verticale',
  spreadX: 'Larghezza campo',
  depthY: 'Profondita campo',
  ofDist: 'Distanza interni↔esterni',
  rotation: 'Rotazione asse sx/dx',
  fan: 'Apertura prospettica',
  bgZoom: 'Foto — zoom',
  bgX: 'Foto — sposta orizz.',
  bgY: 'Foto — sposta vert.',
};

// Override inline per stadio (ID franchigia). Alternativa ai file (sotto):
// le chiavi non indicate restano a PHOTO_DEFAULT_CALIBRATION.
export const STADIUM_CALIBRATION: Record<string, Partial<FieldCalibration>> = {};

// --- Calibrazioni PER-FOTO da file JSON --------------------------------------
// Metti un file `src/data/calibrations/<STEM>.json` per ogni foto calibrata,
// dove <STEM> è il nome della foto senza estensione (es. `BAL.json` per
// `stadiums/BAL.jpg`, `SFG3.json` per `stadiums/SFG3.jpg`). Il pannello di
// calibrazione ha il pulsante «Esporta file» che scarica il JSON già nominato.
// Vengono impacchettati al build: basta aggiungere il file e committare, si
// applicano al deploy — nessuna modifica al codice.
const CAL_FILE_MODULES = import.meta.glob('./calibrations/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Partial<FieldCalibration>>;

const CAL_FILES: Record<string, Partial<FieldCalibration>> = {};
for (const path in CAL_FILE_MODULES) {
  const stem = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
  CAL_FILES[stem] = CAL_FILE_MODULES[path];
}

/** Stem del file di calibrazione per una foto (nome senza estensione). */
export function calibrationStem(teamId: string, image?: string): string {
  if (!image) return teamId;
  const file = image.slice(image.lastIndexOf('/') + 1);
  const dot = file.lastIndexOf('.');
  return dot < 0 ? file : file.slice(0, dot);
}

/** Calibrazione da file per uno stadio: prima la principale, poi le varianti. */
function fileCalibration(teamId: string): Partial<FieldCalibration> | null {
  for (const suffix of ['', '2', '3', '4', '5']) {
    const found = CAL_FILES[teamId + suffix];
    if (found) return found;
  }
  return null;
}

/**
 * Calibrazione effettiva di uno stadio: default-foto sovrascritto da (in ordine
 * di priorità) il file JSON per-foto, oppure l'override inline STADIUM_CALIBRATION.
 */
export function getCalibration(teamId: string): FieldCalibration {
  const override = fileCalibration(teamId) ?? STADIUM_CALIBRATION[teamId] ?? {};
  return { ...PHOTO_DEFAULT_CALIBRATION, ...override };
}
