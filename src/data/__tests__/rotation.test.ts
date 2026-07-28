import { describe, it, expect } from 'vitest';
import {
  createRotation,
  restRemaining,
  isAvailable,
  restForUsage,
  recordUsage,
  restInfo,
  suggestedStarter,
  withStarterId,
  REST_STARTER,
  REST_LONG,
  REST_HEAVY,
} from '../rotation';
import { generateLeague } from '../league';

const IDS = ['SP1', 'SP2', 'SP3', 'SP4', 'SP5'];
const started = (id: string) => [{ id, outs: 18, started: true }];

describe('riposo per uso reale', () => {
  it('mai lanciato = pronto (riposo 0, disponibile)', () => {
    const rot = createRotation();
    expect(restRemaining(rot, 'SP1', 0)).toBe(0);
    expect(isAvailable(rot, 'SP1', 0)).toBe(true);
  });

  it('gare di riposo per carico: partente 4, lungo 2, pesante 1, breve 0', () => {
    expect(restForUsage(21, true)).toBe(REST_STARTER); // apre la gara
    expect(restForUsage(2, true)).toBe(REST_STARTER); // spot start = comunque partente
    expect(restForUsage(12, false)).toBe(REST_LONG); // 4 IP di rilievo
    expect(restForUsage(9, false)).toBe(REST_LONG); // 3 IP
    expect(restForUsage(6, false)).toBe(REST_HEAVY); // 2 IP
    expect(restForUsage(4, false)).toBe(REST_HEAVY); // oltre 1 IP
    expect(restForUsage(3, false)).toBe(0); // 1 IP: pronto domani
    expect(restForUsage(0, false)).toBe(0);
  });

  it('il partente torna disponibile dopo 4 gare (ciclo a 5 uomini)', () => {
    let rot = createRotation();
    rot = recordUsage(rot, started('SP1'), 0); // apre al giorno 0
    // giorni 1..4 a riposo, disponibile al giorno 5
    expect(restRemaining(rot, 'SP1', 1)).toBe(4);
    expect(isAvailable(rot, 'SP1', 4)).toBe(false);
    expect(restRemaining(rot, 'SP1', 4)).toBe(1);
    expect(isAvailable(rot, 'SP1', 5)).toBe(true);
  });

  it('un rilievo breve è di nuovo disponibile la gara dopo', () => {
    let rot = createRotation();
    rot = recordUsage(rot, [{ id: 'RP1', outs: 3, started: false }], 10);
    expect(isAvailable(rot, 'RP1', 10)).toBe(false); // stessa giornata: usato
    expect(isAvailable(rot, 'RP1', 11)).toBe(true); // giorno dopo: pronto
  });

  it('registra TUTTI i lanciatori usati in una gara, non solo il partente', () => {
    let rot = createRotation();
    rot = recordUsage(
      rot,
      [
        { id: 'SP1', outs: 18, started: true }, // 4 gare
        { id: 'RP1', outs: 9, started: false }, // 2 gare (lungo)
        { id: 'RP2', outs: 3, started: false }, // 0 (breve)
      ],
      0,
    );
    expect(restRemaining(rot, 'SP1', 1)).toBe(4);
    expect(restRemaining(rot, 'RP1', 1)).toBe(2);
    expect(isAvailable(rot, 'RP2', 1)).toBe(true);
  });
});

describe('partente consigliato = primo in ordine non a riposo', () => {
  it('la rotazione gira in ordine SP1..SP5 usando il partente ogni giorno', () => {
    let rot = createRotation();
    const seq: string[] = [];
    for (let day = 0; day < 10; day++) {
      const sp = suggestedStarter(rot, IDS, day);
      seq.push(sp);
      rot = recordUsage(rot, started(sp), day);
    }
    expect(seq).toEqual(['SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5']);
  });

  it('l’asso rientra solo quando ha smaltito il riposo (giorno 5)', () => {
    let rot = createRotation();
    for (let day = 0; day < 5; day++) rot = recordUsage(rot, started(IDS[day]), day);
    // giorni 0..4: SP1..SP5. Al giorno 4 SP1 riposa ancora (torna disponibile al 5).
    expect(isAvailable(rot, 'SP1', 4)).toBe(false);
    expect(suggestedStarter(rot, IDS, 5)).toBe('SP1');
  });

  it('a parità di ordine si sceglie il primo disponibile (salta chi riposa)', () => {
    let rot = createRotation();
    // Solo SP1 e SP2 hanno lanciato di recente (riposano); SP3 è il primo pronto.
    rot = recordUsage(rot, started('SP1'), 3);
    rot = recordUsage(rot, started('SP2'), 3);
    expect(suggestedStarter(rot, IDS, 4)).toBe('SP3');
  });

  it('restInfo espone riposo e disponibilità per la lista del Roster', () => {
    let rot = createRotation();
    rot = recordUsage(rot, started('SP1'), 0);
    const info = restInfo(rot, IDS, 2);
    expect(info.find((r) => r.id === 'SP1')!.restRemaining).toBe(3);
    expect(info.find((r) => r.id === 'SP1')!.available).toBe(false);
    expect(info.find((r) => r.id === 'SP2')!.available).toBe(true);
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
