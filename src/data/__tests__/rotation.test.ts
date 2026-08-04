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
  migrateRotation,
  REST_STARTER,
  REST_RELIEF,
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

  it('gare di riposo per carico: partente 3, rilievo 2+ IP salta una gara, sotto 0', () => {
    expect(restForUsage(21, true)).toBe(REST_STARTER); // apre la gara
    expect(restForUsage(2, true)).toBe(REST_STARTER); // spot start = comunque partente
    expect(restForUsage(12, false)).toBe(REST_RELIEF); // 4 IP di rilievo
    expect(restForUsage(6, false)).toBe(REST_RELIEF); // esattamente 2 IP
    expect(restForUsage(5, false)).toBe(0); // 1.2 IP: pronto la gara dopo
    expect(restForUsage(3, false)).toBe(0); // 1 IP
    expect(restForUsage(0, false)).toBe(0);
  });

  it('il partente torna disponibile dopo 3 gare (consente la rotazione a 4 uomini)', () => {
    let rot = createRotation();
    rot = recordUsage(rot, started('SP1'), 0); // apre al giorno 0
    // giorni 1..3 a riposo, disponibile al giorno 4 (asso di gara 1 → gara 5)
    expect(restRemaining(rot, 'SP1', 1)).toBe(3);
    expect(isAvailable(rot, 'SP1', 3)).toBe(false);
    expect(restRemaining(rot, 'SP1', 3)).toBe(1);
    expect(isAvailable(rot, 'SP1', 4)).toBe(true);
  });

  it('il riposo si RICALCOLA con la regola corrente (cambio regola valido a stagione in corso)', () => {
    // Un partente che ha aperto al giorno 0: col +3 corrente rientra al giorno 4.
    let rot = recordUsage(createRotation(), started('SP1'), 0);
    expect(restRemaining(rot, 'SP1', 1)).toBe(3); // regola regular (default)
    // La stessa registrazione, interrogata con la regola playoff (+2), dà meno riposo.
    expect(restRemaining(rot, 'SP1', 1, 2)).toBe(2);
    expect(isAvailable(rot, 'SP1', 3, 2)).toBe(true); // playoff: rientra al giorno 3
    expect(isAvailable(rot, 'SP1', 3)).toBe(false); // regular: non ancora
  });

  it('migra un vecchio stato {availableFrom} (+4 cotto) al +3 corrente', () => {
    // Stagione iniziata sotto la vecchia regola: SP1 aperse al giorno 2 → availableFrom
    // = 2+1+4 = 7 (a stagione in corso, giorno 3, mostrava +4). Migrato → +3.
    const legacy = { availableFrom: { SP1: 7 } } as unknown;
    const rot = migrateRotation(legacy);
    expect(restRemaining(rot, 'SP1', 3)).toBe(3); // era +4, ora +3
    // SP1 aperse al giorno 2 → col +3 rientra al giorno 6 (2+1+3), non più al 7.
    expect(isAvailable(rot, 'SP1', 5)).toBe(false);
    expect(isAvailable(rot, 'SP1', 6)).toBe(true);
  });

  it('migrateRotation è idempotente sul nuovo schema', () => {
    const rot = recordUsage(createRotation(), started('SP1'), 0);
    expect(migrateRotation(rot)).toBe(rot);
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
        { id: 'SP1', outs: 18, started: true }, // 3 gare
        { id: 'RP1', outs: 9, started: false }, // 3 IP -> 1 gara
        { id: 'RP2', outs: 3, started: false }, // 1 IP -> 0
      ],
      0,
    );
    expect(restRemaining(rot, 'SP1', 1)).toBe(3);
    expect(restRemaining(rot, 'RP1', 1)).toBe(REST_RELIEF);
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

  it('l’asso rientra quando ha smaltito le 3 gare di riposo (giorno 4)', () => {
    let rot = createRotation();
    for (let day = 0; day < 5; day++) rot = recordUsage(rot, started(IDS[day]), day);
    // SP1 ha aperto al giorno 0 → riposa 1,2,3, torna disponibile al giorno 4.
    expect(isAvailable(rot, 'SP1', 3)).toBe(false);
    expect(isAvailable(rot, 'SP1', 4)).toBe(true);
    expect(suggestedStarter(rot, IDS, 5)).toBe('SP1');
  });

  it('rotazione a 4 uomini: l’asso rientra puntuale (nessuno resta a secco)', () => {
    let rot = createRotation();
    const four = ['SP1', 'SP2', 'SP3', 'SP4'];
    const seq: string[] = [];
    for (let day = 0; day < 8; day++) {
      const sp = suggestedStarter(rot, four, day);
      seq.push(sp);
      rot = recordUsage(rot, started(sp), day);
    }
    // Con 4 partenti e riposo minimo 3, il ciclo a 4 uomini è pulito: SP1 di gara
    // 1 (giorno 0) rientra alla gara 5 (giorno 4).
    expect(seq).toEqual(['SP1', 'SP2', 'SP3', 'SP4', 'SP1', 'SP2', 'SP3', 'SP4']);
  });

  it('con 5 partenti sani la rotazione NON collassa a 4 (parte il più riposato)', () => {
    let rot = createRotation();
    const seq: string[] = [];
    for (let day = 0; day < 10; day++) {
      const sp = suggestedStarter(rot, IDS, day);
      seq.push(sp);
      rot = recordUsage(rot, started(sp), day);
    }
    // Anche se al giorno 4 SP1 sarebbe già disponibile (3 gare di riposo), parte
    // SP5 (mai lanciato = più riposato): il ciclo a 5 uomini resta intatto.
    expect(seq).toEqual(['SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP1', 'SP2', 'SP3', 'SP4', 'SP5']);
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
    expect(info.find((r) => r.id === 'SP1')!.restRemaining).toBe(2);
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
