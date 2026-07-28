import { describe, it, expect } from 'vitest';
import {
  createRotation,
  restDays,
  isAvailable,
  starterOptions,
  suggestedStarter,
  recordStart,
  setSize,
  withStarterId,
  REST_MIN_DAYS,
} from '../rotation';
import { generateLeague } from '../league';

const IDS = ['SP1', 'SP2', 'SP3', 'SP4', 'SP5'];

describe('riposo dei partenti', () => {
  it('mai partito = riposo infinito e disponibile', () => {
    const rot = createRotation(5);
    expect(restDays(rot, 'SP1', 0)).toBe(Infinity);
    expect(isAvailable(rot, 'SP1', 0)).toBe(true);
  });

  it('serve REST_MIN_DAYS partite di riposo per ripartire', () => {
    let rot = createRotation(5);
    rot = recordStart(rot, 'SP1', 0); // parte al giorno 0
    // giorni 1,2,3 -> riposo 0,1,2 (non ancora idoneo); giorno 4 -> riposo 3 (idoneo)
    expect(restDays(rot, 'SP1', 3)).toBe(2);
    expect(isAvailable(rot, 'SP1', 3)).toBe(false);
    expect(restDays(rot, 'SP1', 4)).toBe(REST_MIN_DAYS);
    expect(isAvailable(rot, 'SP1', 4)).toBe(true);
  });
});

describe('ciclo della rotazione', () => {
  it('a 5 uomini gira in ordine SP1..SP5 e riparte da SP1', () => {
    let rot = createRotation(5);
    const seq: string[] = [];
    for (let day = 0; day < 10; day++) {
      const sp = suggestedStarter(rot, IDS, day);
      seq.push(sp);
      rot = recordStart(rot, sp, day);
    }
    expect(seq).toEqual(['SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5']);
  });

  it('a 4 uomini usa solo i primi 4 e l’asso rientra ogni 4ª partita', () => {
    let rot = createRotation(4);
    const seq: string[] = [];
    for (let day = 0; day < 8; day++) {
      const sp = suggestedStarter(rot, IDS, day);
      seq.push(sp);
      rot = recordStart(rot, sp, day);
    }
    expect(seq).toEqual(['SP1', 'SP2', 'SP3', 'SP4', 'SP1', 'SP2', 'SP3', 'SP4']);
  });

  it('a 4 uomini l’asso ha esattamente 3 giorni di riposo al rientro', () => {
    let rot = createRotation(4);
    // Primo giro: SP1..SP4 nei giorni 0..3.
    for (let day = 0; day < 4; day++) rot = recordStart(rot, IDS[day], day);
    // Al giorno 4 SP1 rientra con riposo 3 (è il più riposato del ciclo).
    expect(restDays(rot, 'SP1', 4)).toBe(3);
    expect(suggestedStarter(rot, IDS, 4)).toBe('SP1');
  });
});

describe('scelta manuale: #5 al posto dell’asso', () => {
  it('il #5 è selezionabile (disponibile) e dà all’asso un giorno extra', () => {
    let rot = createRotation(4);
    // giorni 0..3: SP1..SP4
    for (let day = 0; day < 4; day++) rot = recordStart(rot, IDS[day], day);
    const opts = starterOptions(rot, IDS, 4);
    const ace = opts.find((o) => o.id === 'SP1')!;
    const fifth = opts.find((o) => o.id === 'SP5')!;
    expect(ace.available).toBe(true); // l'asso sarebbe pronto
    expect(fifth.available).toBe(true); // ma anche il #5 (mai partito)
    expect(fifth.inCycle).toBe(false); // fuori dal ciclo a 4
    // Il giocatore sceglie il #5: l'asso salta un giro e avrà 4 gg di riposo.
    rot = recordStart(rot, 'SP5', 4);
    expect(restDays(rot, 'SP1', 5)).toBe(4);
  });
});

describe('withStarterId', () => {
  it('porta lo SP scelto in testa alla rotazione, senza mutare l’originale', () => {
    const team = generateLeague(3)[0];
    const target = team.rotation[2].id;
    const t2 = withStarterId(team, target);
    expect(t2.rotation[0].id).toBe(target);
    expect(team.rotation[0].id).not.toBe(target); // originale intatto
  });
  it('id sconosciuto o già in testa → squadra invariata', () => {
    const team = generateLeague(3)[0];
    expect(withStarterId(team, 'nope')).toBe(team);
    expect(withStarterId(team, team.rotation[0].id)).toBe(team);
  });
});

describe('setSize', () => {
  it('cambia gli uomini del ciclo senza toccare i riposi', () => {
    let rot = createRotation(5);
    rot = recordStart(rot, 'SP1', 0);
    const r2 = setSize(rot, 4);
    expect(r2.size).toBe(4);
    expect(r2.lastStart).toEqual(rot.lastStart);
  });
});
