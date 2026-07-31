import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Legenda delle sigle del roster (GLOSSARY) + modale StatLegend + iconcina
// InfoDot. Estratti da App.tsx: per le DOTI la descrizione dice SU COSA
// INFLUISCONO nel motore, per le STATISTICHE cosa rappresentano. Puri, nessuno
// stato oltre l'Esc-to-close del modale.
// ---------------------------------------------------------------------------

type GlossItem = { k: string; name: string; desc: string };
type GlossBlock = { title: string; kind: 'rating' | 'stat'; items: GlossItem[] };
export const GLOSSARY: Record<'bat' | 'def' | 'pit', GlossBlock[]> = {
  bat: [
    {
      title: 'Doti offensive (scala 40-100, 70 = media di lega)',
      kind: 'rating',
      items: [
        { k: 'CON', name: 'Contatto', desc: 'battute valide e media: più singoli, meno strikeout (la parte "AVG").' },
        { k: 'POT', name: 'Potenza', desc: 'extrabase e fuoricampo (la parte "SLG").' },
        { k: 'OCC', name: 'Occhio', desc: 'basi ball: alza l\'OBP e limita un po\' gli strikeout.' },
        { k: 'VEL', name: 'Velocità', desc: 'rubate, tripli e basi extra in corsa.' },
      ],
    },
    {
      title: 'Statistiche offensive',
      kind: 'stat',
      items: [
        { k: 'G', name: 'Gare', desc: 'partite giocate.' },
        { k: 'AVG', name: 'Media battuta', desc: 'valide / turni ufficiali.' },
        { k: 'OBP', name: 'On-base %', desc: 'quante volte raggiunge la base (valide + BB su arrivi al piatto).' },
        { k: 'SLG', name: 'Slugging %', desc: 'basi totali per turno: pesa gli extrabase.' },
        { k: 'H', name: 'Valide', desc: 'battute valide totali.' },
        { k: '2B', name: 'Doppi', desc: 'battute da due basi.' },
        { k: '3B', name: 'Tripli', desc: 'battute da tre basi.' },
        { k: 'HR', name: 'Fuoricampo', desc: 'home run.' },
        { k: 'RBI', name: 'Punti battuti a casa', desc: 'corridori mandati a punto.' },
        { k: 'BB', name: 'Basi ball', desc: 'basi su ball (walk).' },
        { k: 'SO', name: 'Strikeout', desc: 'eliminazioni al piatto (K).' },
        { k: 'SB', name: 'Basi rubate', desc: 'rubate riuscite.' },
      ],
    },
  ],
  def: [
    {
      title: 'Doti difensive (scala 40-100 · variano con la casella giocata)',
      kind: 'rating',
      items: [
        { k: 'DIF', name: 'Difesa', desc: 'palle in gioco trasformate in out e meno errori; dipende dalla casella coperta.' },
        { k: 'BRA', name: 'Braccio', desc: 'elimina i ladri di base (ricevitore) e gli assist dagli esterni.' },
        { k: 'VEL', name: 'Velocità', desc: 'copertura di campo e corsa verso la palla.' },
      ],
    },
    {
      title: 'Statistiche difensive (stima: la difesa non è ancora simulata dal motore)',
      kind: 'stat',
      items: [
        { k: 'G', name: 'Gare', desc: 'partite giocate.' },
        { k: 'E', name: 'Errori', desc: 'giocate difensive sbagliate.' },
        { k: 'A', name: 'Assist', desc: 'tocchi che portano a un\'eliminazione altrui.' },
        { k: 'PO', name: 'Put-out', desc: 'eliminazioni dirette (presa al volo, out in base).' },
        { k: 'FLD%', name: 'Fielding %', desc: 'giocate pulite su totali (PO+A su PO+A+E).' },
      ],
    },
  ],
  pit: [
    {
      title: 'Doti del lanciatore (scala 40-100, 70 = media di lega)',
      kind: 'rating',
      items: [
        { k: 'DOM', name: 'Dominio (stuff)', desc: 'strikeout: più K, meno palle in gioco.' },
        { k: 'CTR', name: 'Controllo', desc: 'pochi base ball concessi.' },
        { k: 'MOV', name: 'Movimento', desc: 'poche battute valide concesse sulle palle in gioco.' },
        { k: 'PAT', name: 'Palle a terra', desc: 'induce battute rasoterra: pochi fuoricampo concessi e più doppi giochi.' },
        { k: 'RES', name: 'Resistenza', desc: 'quanti battitori regge prima di calare (durata sul monte).' },
        { k: 'DIF', name: 'Difesa', desc: 'tiene i corridori (hold) e difende sui bunt.' },
      ],
    },
    {
      title: 'Statistiche di lancio',
      kind: 'stat',
      items: [
        { k: 'W', name: 'Vittorie', desc: 'vittorie accreditate.' },
        { k: 'L', name: 'Sconfitte', desc: 'sconfitte accreditate.' },
        { k: 'G', name: 'Presenze', desc: 'partite in cui ha lanciato.' },
        { k: 'GS', name: 'Partenze', desc: 'partite iniziate da starter (games started).' },
        { k: 'IP', name: 'Inning lanciati', desc: 'riprese completate (.1/.2 = 1/3, 2/3).' },
        { k: 'ERA', name: 'Media PGL', desc: 'punti guadagnati subiti ogni 9 inning: risultato di contesto, non dote diretta.' },
        { k: 'H', name: 'Valide concesse', desc: 'battute valide subite.' },
        { k: 'BB', name: 'Basi ball concesse', desc: 'basi su ball regalate.' },
        { k: 'K', name: 'Strikeout', desc: 'battitori eliminati al piatto.' },
        { k: 'SVO', name: 'Opportunità salvezza', desc: 'occasioni di save affrontate.' },
        { k: 'SV', name: 'Salvezze', desc: 'save convertiti.' },
        { k: 'WHIP', name: 'WHIP', desc: '(basi ball + valide) per inning: baserunner concessi.' },
        { k: 'K/9', name: 'K per 9 inning', desc: 'strikeout ogni 9 riprese.' },
      ],
    },
  ],
};

/** Modale-legenda: spiega le sigle di una sezione (attacco / difesa / lancio). */
export function StatLegend({ section, onClose }: { section: 'bat' | 'def' | 'pit'; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const title = section === 'bat' ? 'Legenda — Attacco' : section === 'def' ? 'Legenda — Difesa' : 'Legenda — Lancio';
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal legend" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        <div className="modal-body legend-body">
          {GLOSSARY[section].map((block) => (
            <div className="legend-block" key={block.title}>
              <div className="legend-block-title">{block.title}</div>
              <dl className="legend-dl">
                {block.items.map((it) => (
                  <div className="legend-row" key={it.k}>
                    <dt className={`legend-abbr ${block.kind}`}>{it.k}</dt>
                    <dd className="legend-def">
                      <b>{it.name}</b> — {it.desc}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          <p className="muted pm-note">
            Le <b>doti</b> (40-100) sono la fonte di verità e guidano ciò che il giocatore
            controlla; le <b>statistiche</b> sono un risultato simulato. ERA e Vittorie dipendono
            anche dal contesto (difesa, stadio, supporto), non solo dal talento.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Iconcina "i" cliccabile da mettere a fianco della testata di una tabella. */
export function InfoDot({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="info-dot"
      onClick={onClick}
      aria-label="Cosa significano le sigle"
      title="Cosa significano le sigle"
    >
      i
    </button>
  );
}
