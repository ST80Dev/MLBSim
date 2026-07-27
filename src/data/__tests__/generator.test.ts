import { describe, it, expect } from 'vitest';
import { generateLeague } from '../league';
import { withRotationStarter } from '../generator';
import { batterOverall, pitcherOverall } from '../../engine/ratings';
import { canOccupy } from '../../engine/positions';
import type { Team } from '../../engine/types';

function collectAges(teams: Team[]): number[] {
  const ages: number[] = [];
  for (const t of teams) {
    for (const b of [...t.lineup, ...t.bench, ...t.reserveBatters]) ages.push(b.age);
    // Nota: i lanciatori partenti hanno finestre d'età per-slot (SP_SLOTS);
    // qui misuriamo i battitori, che usano la distribuzione makeAge.
  }
  return ages;
}
const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

const SEEDS = [1, 7, 42, 2024, 999, 12345, 88, 3];
const teams = SEEDS.flatMap((s) => generateLeague(s));

describe('età dei battitori generati', () => {
  const ages = collectAges(teams);
  it('media di lega ~28 (calibrata, non uniforme)', () => {
    const m = avg(ages);
    expect(m).toBeGreaterThan(27.3);
    expect(m).toBeLessThan(28.7);
  });
  it('sta nel range [20, 40]', () => {
    expect(Math.min(...ages)).toBeGreaterThanOrEqual(20);
    expect(Math.max(...ages)).toBeLessThanOrEqual(40);
  });
  it('asimmetrica: più giovani (<=24) che veterani (>=33)', () => {
    expect(ages.filter((a) => a <= 24).length).toBeGreaterThan(ages.filter((a) => a >= 33).length);
  });
  it('genera fasce rare ma possibili a entrambi gli estremi', () => {
    expect(ages.some((a) => a <= 21)).toBe(true);
    expect(ages.some((a) => a >= 38)).toBe(true);
    expect(ages.filter((a) => a <= 20 || a >= 40).length / ages.length).toBeLessThan(0.06);
  });
});

describe('distribuzione talento per livello di rosa', () => {
  it('gradiente battitori: titolari > panchina > riserve (in media)', () => {
    const starters = avg(teams.flatMap((t) => t.lineup.map((b) => batterOverall(b.ratings))));
    const bench = avg(teams.flatMap((t) => t.bench.map((b) => batterOverall(b.ratings))));
    const reserves = avg(teams.flatMap((t) => t.reserveBatters.map((b) => batterOverall(b.ratings))));
    expect(starters).toBeGreaterThan(bench);
    expect(bench).toBeGreaterThan(reserves);
  });

  it('nessuna stella 5★ (OVR>=91) sepolta tra i lanciatori di riserva', () => {
    const buried = teams.flatMap((t) => t.reservePitchers).filter((p) => pitcherOverall(p.ratings) >= 91);
    expect(buried).toHaveLength(0);
  });

  it('il miglior battitore della squadra è sempre un titolare', () => {
    for (const t of teams) {
      const maxLineup = Math.max(...t.lineup.map((b) => batterOverall(b.ratings)));
      const maxOther = Math.max(...[...t.bench, ...t.reserveBatters].map((b) => batterOverall(b.ratings)));
      expect(maxLineup).toBeGreaterThanOrEqual(maxOther);
    }
  });

  it('schieramento valido: 9 posizioni distinte e ognuno può occupare il suo slot', () => {
    for (const t of teams) {
      expect(new Set(t.lineup.map((b) => b.position)).size).toBe(9);
      for (const b of t.lineup) expect(canOccupy(b, b.position)).toBe(true);
    }
  });

  it('la rotazione è ordinata: n.1 = asso (overall decrescente)', () => {
    for (const t of teams) {
      const ovrs = t.rotation.map((p) => pitcherOverall(p.ratings));
      for (let i = 1; i < ovrs.length; i++) expect(ovrs[i - 1]).toBeGreaterThanOrEqual(ovrs[i]);
    }
  });
});

describe('bullpen coerente per ruoli', () => {
  it('ogni bullpen ha esattamente un closer (CL) e 6 arm', () => {
    for (const t of teams) {
      expect(t.bullpen).toHaveLength(6);
      expect(t.bullpen.filter((p) => p.role === 'CL')).toHaveLength(1);
    }
  });

  it('esistono long-reliever: i 2 arm più resistenti superano nettamente i meno resistenti', () => {
    // Aggregato: la resistenza dei 2 RP più "long" di ogni bullpen è ben sopra
    // quella dei 2 più corti — cioè il bullpen NON è fatto di rilievi identici.
    let hi = 0;
    let lo = 0;
    for (const t of teams) {
      const stam = t.bullpen.filter((p) => p.role !== 'CL').map((p) => p.ratings.stamina).sort((a, b) => b - a);
      hi += (stam[0] + stam[1]) / 2;
      lo += (stam[stam.length - 1] + stam[stam.length - 2]) / 2;
    }
    expect(hi / teams.length).toBeGreaterThan(lo / teams.length + 8);
  });

  it('il closer è uno shutdown: dominio medio sopra la media di lega dei rilievi', () => {
    const closerStuff = avg(teams.map((t) => t.bullpen.find((p) => p.role === 'CL')!.ratings.stuff));
    const rpStuff = avg(teams.flatMap((t) => t.bullpen.filter((p) => p.role !== 'CL').map((p) => p.ratings.stuff)));
    expect(closerStuff).toBeGreaterThan(rpStuff);
  });
});

describe('rotazione: uso dei partenti', () => {
  it('withRotationStarter porta lo slot n in testa (ciclo completo, non muta l’originale)', () => {
    const t = generateLeague(5)[0];
    const ace = t.rotation[0].id;
    expect(withRotationStarter(t, 0).rotation[0].id).toBe(ace);
    expect(withRotationStarter(t, 1).rotation[0].id).toBe(t.rotation[1].id);
    expect(withRotationStarter(t, 5).rotation[0].id).toBe(t.rotation[0].id); // 5 % 5 = 0
    expect(t.rotation[0].id).toBe(ace); // originale intatto
  });
});

describe('determinismo', () => {
  it('stessa lega dallo stesso seed', () => {
    const a = generateLeague(77).map((t) => [...t.lineup, ...t.rotation, ...t.bullpen].map((p) => p.id).join(','));
    const b = generateLeague(77).map((t) => [...t.lineup, ...t.rotation, ...t.bullpen].map((p) => p.id).join(','));
    expect(a).toEqual(b);
  });
});

describe('realismo delle doti: gli elite sono SPECIALISTI', () => {
  const bats = teams.flatMap((t) => [...t.lineup, ...t.bench, ...t.reserveBatters]);
  const pits = teams.flatMap((t) => [...t.rotation, ...t.bullpen, ...t.reservePitchers]);

  it('i fast-slugger (POT e VEL entrambi >=90) sono rari (<1.5%)', () => {
    const fast = bats.filter((b) => b.ratings.power >= 90 && b.ratings.speed >= 90).length;
    expect(fast / bats.length).toBeLessThan(0.015);
  });

  it('la difesa è disaccoppiata: pochi bat-first anche guanto-elite', () => {
    const both = bats.filter(
      (b) => b.ratings.contact >= 92 && b.ratings.power >= 92 && b.ratings.eye >= 92 && b.ratings.fielding >= 92,
    ).length;
    expect(both / bats.length).toBeLessThan(0.01);
  });

  it('i lanciatori sono specializzati: spread interno alle doti-skill ampio', () => {
    const spread = avg(
      pits.map((p) => {
        const v = [p.ratings.stuff, p.ratings.control, p.ratings.movement, p.ratings.groundball];
        return Math.max(...v) - Math.min(...v);
      }),
    );
    expect(spread).toBeGreaterThan(18); // non "tutte allineate all'OVR"
  });

  it('la resistenza del lanciatore è indipendente dalla bravura', () => {
    const o = pits.map((p) => pitcherOverall(p.ratings));
    const s = pits.map((p) => p.ratings.stamina);
    const mo = avg(o);
    const ms = avg(s);
    let cov = 0;
    let vo = 0;
    let vs = 0;
    for (let i = 0; i < o.length; i++) {
      cov += (o[i] - mo) * (s[i] - ms);
      vo += (o[i] - mo) ** 2;
      vs += (s[i] - ms) ** 2;
    }
    const corr = cov / Math.sqrt(vo * vs);
    expect(Math.abs(corr)).toBeLessThan(0.2); // ~0 = indipendente
  });

  it('anche le squadre deboli hanno staff vari (non tutte le doti allineate all’OVR)', () => {
    // Su TUTTE le rotazioni: lo spread medio interno alle doti-skill è ampio,
    // anche per i lanciatori sotto media — c'è sempre il power-arm, il finesse, ecc.
    const rotationArms = teams.flatMap((t) => t.rotation);
    const spread = avg(
      rotationArms.map((p) => {
        const v = [p.ratings.stuff, p.ratings.control, p.ratings.movement, p.ratings.groundball];
        return Math.max(...v) - Math.min(...v);
      }),
    );
    expect(spread).toBeGreaterThan(15);
  });
});
