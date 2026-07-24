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

/** URL assoluto (con base path del sito) della foto-stadio, se presente. */
export function stadiumImage(teamId: string): string | undefined {
  const path = STADIUM_IMAGES[teamId];
  if (!path) return undefined;
  return import.meta.env.BASE_URL + path;
}
