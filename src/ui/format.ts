import { formatAvg } from '../engine/boxscore';
import { RATING_MIN } from '../engine/ratings';

export { formatAvg };

/** Colore accento deterministico dal nome squadra (tinta HSL). */
export function teamAccent(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 62% 52%)`;
}

/** Combina seed squadre e numero partita in un seed di gioco. */
export function gameSeed(teamSeed: number, gameNo: number): number {
  return (Math.imul(teamSeed ^ 0x9e3779b9, 2654435761) + gameNo * 40503) >>> 0;
}

/** Mette il COGNOME in MAIUSCOLO (per riconoscere i giocatori a colpo d'occhio):
 *  "Aaron Visser" → "Aaron VISSER", "A. Visser" → "A. VISSER", "Visser" →
 *  "VISSER". Il cognome è tutto ciò che segue il primo spazio (nome singolo =
 *  tutto maiuscolo). Solo presentazione: non tocca i nomi nel motore/dati. */
export function upperLast(name: string): string {
  const i = name.indexOf(' ');
  if (i < 0) return name.toUpperCase();
  return name.slice(0, i) + ' ' + name.slice(i + 1).toUpperCase();
}

/** Voto in stelle (1..5) da un overall (scala 40-100), stile OOTP. */
export function stars(overall: number): string {
  const n = Math.max(1, Math.min(5, Math.round((overall - RATING_MIN) / 15) + 1));
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

export function newRandomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

/** Colore di una caratteristica 40-100: rosso (basso) -> verde (alto). */
export function ratingColor(v: number): string {
  const t = Math.max(0, Math.min(1, (v - RATING_MIN) / 60));
  return `hsl(${Math.round(t * 125)} 58% 42%)`;
}
