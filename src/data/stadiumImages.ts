// Foto-stadio usate come sfondo del campo (fornite e committate dall'utente).
//
// CONVENZIONE: ogni file si chiama `public/stadiums/<ID>.jpg`, dove <ID> e' il
// codice franchigia (3 lettere, standard MLB) di src/data/franchises.ts, con
// estensione minuscola `.jpg` (GitHub Pages e' case-sensitive). Es: `NYY.jpg`,
// `SFG.jpg`, `KCR.jpg`.
//
// Sono elencate TUTTE e 30 le squadre: basta caricare il file col nome giusto
// perche' la foto compaia. Se il file non c'e' (ancora), il Diamond ripiega
// automaticamente sul campo ORIGINALE generato a runtime (onError, vedi
// src/ui/Diamond.tsx): nessuna immagine rotta.
//
// Nota: il sito Pages e' pubblico anche da repo privato → le immagini committate
// sono accessibili pubblicamente; la scelta e la responsabilita' sono di chi le
// aggiunge. Vedi public/stadiums/README.md.

// Percorso relativo del file dentro public/ (senza slash iniziale).
export const STADIUM_IMAGES: Record<string, string> = {
  // AL East
  BAL: 'stadiums/BAL.jpg',
  BOS: 'stadiums/BOS.jpg',
  NYY: 'stadiums/NYY.jpg',
  TBR: 'stadiums/TBR.jpg',
  TOR: 'stadiums/TOR.jpg',
  // AL Central
  CWS: 'stadiums/CWS.jpg',
  CLE: 'stadiums/CLE.jpg',
  DET: 'stadiums/DET.jpg',
  KCR: 'stadiums/KCR.jpg',
  MIN: 'stadiums/MIN.jpg',
  // AL West
  HOU: 'stadiums/HOU.jpg',
  LAA: 'stadiums/LAA.jpg',
  OAK: 'stadiums/OAK.jpg',
  SEA: 'stadiums/SEA.jpg',
  TEX: 'stadiums/TEX.jpg',
  // NL East
  ATL: 'stadiums/ATL.jpg',
  MIA: 'stadiums/MIA.jpg',
  NYM: 'stadiums/NYM.jpg',
  PHI: 'stadiums/PHI.jpg',
  WSH: 'stadiums/WSH.jpg',
  // NL Central
  CHC: 'stadiums/CHC.jpg',
  CIN: 'stadiums/CIN.jpg',
  MIL: 'stadiums/MIL.jpg',
  PIT: 'stadiums/PIT.jpg',
  STL: 'stadiums/STL.jpg',
  // NL West
  ARI: 'stadiums/ARI.jpg',
  COL: 'stadiums/COL.jpg',
  LAD: 'stadiums/LAD.jpg',
  SDP: 'stadiums/SDP.jpg',
  SFG: 'stadiums/SFG.jpg',
};

/** Prepende il base path del sito a un percorso relativo di public/. */
export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path;
}

/** URL assoluto (con base path del sito) della foto-stadio principale, se presente. */
export function stadiumImage(teamId: string): string | undefined {
  const path = STADIUM_IMAGES[teamId];
  if (!path) return undefined;
  return assetUrl(path);
}

// Suffissi delle varianti: `` = principale (`<ID>.jpg`), poi `<ID>2.jpg`,
// `<ID>3.jpg`, … Il pannello di calibrazione prova a caricarle e mostra solo
// quelle che esistono davvero nel repository.
const VARIANT_SUFFIXES = ['', '2', '3', '4', '5'];

export interface StadiumImageCandidate {
  /** Etichetta leggibile (Principale / Alt 2 / …). */
  label: string;
  /** Percorso relativo dentro public/ (da salvare in `image`). */
  path: string;
  /** URL assoluto per caricare/provare l'immagine. */
  url: string;
}

/** Candidate foto-stadio (principale + eventuali alternative XXX2/XXX3/…). */
export function stadiumImageCandidates(teamId: string): StadiumImageCandidate[] {
  const base = STADIUM_IMAGES[teamId];
  if (!base) return [];
  const dot = base.lastIndexOf('.');
  const stem = dot < 0 ? base : base.slice(0, dot);
  const ext = dot < 0 ? '.jpg' : base.slice(dot);
  return VARIANT_SUFFIXES.map((s, i) => {
    const path = `${stem}${s}${ext}`;
    return { label: i === 0 ? 'Principale' : `Alt ${s}`, path, url: assetUrl(path) };
  });
}
