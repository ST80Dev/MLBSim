import { describe, it, expect } from 'vitest';
import { importHistoricalTeam } from '../import';
import { SEASON_1999 } from '../season1999';
import {
  buildHistoricalLeague,
  buildHistoricalFreeAgents,
  HISTORICAL_SEASONS,
  HISTORICAL_YEARS,
} from '../league';
import { SAMPLE_CLE_1999, SAMPLE_BOS_1999 } from './fixtures';
import { simulateGame } from '../../../engine/game';
import { batterOverall, pitcherOverall } from '../../../engine/ratings';
import { startOffseason } from '../../offseason';
import { HISTORICAL_MODE } from '../../leagueMode';
import { SECONDARY_OPTIONS } from '../../../engine/positions';
import { FRANCHISES } from '../../franchises';

// Property test dell'IMPORTATORE su fixture curate (dati noti e stabili).
describe('importHistoricalTeam (fixture CLE/BOS 1999)', () => {
  const cle = importHistoricalTeam(SAMPLE_CLE_1999);
  const bos = importHistoricalTeam(SAMPLE_BOS_1999);

  it('costruisce squadre valide per il motore', () => {
    expect(cle.team.abbrev).toBe('CLE');
    expect(cle.team.lineup).toHaveLength(9);
    expect(cle.team.rotation.length).toBeGreaterThanOrEqual(1);
    expect(cle.team.bullpen.length).toBeGreaterThanOrEqual(1);
    // Ogni battitore ha stats ri-derivate coerenti (AB > 0).
    for (const b of cle.team.lineup) {
      expect(b.stats.pa).toBeGreaterThan(0);
      expect(b.stats.h).toBeGreaterThan(0);
    }
  });

  it('assegna rating coerenti con le fasce reali', () => {
    const byName = (t: typeof cle) =>
      new Map([...t.team.lineup].map((b) => [b.name, b]));
    const cb = byName(cle);
    const bb = byName(bos);

    // Manny Ramirez: potenza da campione.
    expect(cb.get('Manny Ramirez')!.ratings.power).toBeGreaterThanOrEqual(90);
    // Omar Vizquel: contatto/velocita' alti, potenza scarsa.
    expect(cb.get('Omar Vizquel')!.ratings.power).toBeLessThanOrEqual(55);
    expect(cb.get('Omar Vizquel')!.ratings.speed).toBeGreaterThanOrEqual(85);
    // Darren Lewis: potenza sotto la media (con la regressione per campione i
    // valori estremi rientrano verso 70, ma resta chiaramente sotto-media).
    expect(bb.get('Darren Lewis')!.ratings.power).toBeLessThanOrEqual(60);

    // Pedro Martinez: dominio da asso, controllo alto.
    const pedro = bos.team.rotation.find((p) => p.name === 'Pedro Martinez')!;
    expect(pedro.ratings.stuff).toBeGreaterThanOrEqual(92);
    expect(pedro.ratings.control).toBeGreaterThanOrEqual(85);
  });

  it('assegna un potenziale STIMATO (headroom), non appiattito sull\'attuale', () => {
    // Almeno un giovane importato deve avere potenziale > overall (crescita
    // possibile). NON e' il picco reale futuro: e' una stima eta'-scalata.
    const anyHeadroom = bos.team.lineup.some(
      (b) => b.age < 27 && b.potential > batterOverall(b.ratings),
    );
    expect(anyHeadroom).toBe(true);
    // Il potenziale non scende mai sotto l'overall attuale.
    for (const b of bos.team.lineup) {
      expect(b.potential).toBeGreaterThanOrEqual(batterOverall(b.ratings));
    }
  });

  it('l\'import e\' riproducibile (stessi potenziali a parita\' di seed)', () => {
    const a = importHistoricalTeam(SAMPLE_BOS_1999);
    const b = importHistoricalTeam(SAMPLE_BOS_1999);
    const pa = a.team.lineup.map((x) => x.potential);
    const pb = b.team.lineup.map((x) => x.potential);
    expect(pa).toEqual(pb);
    // Seed diverso -> potenziali (in genere) diversi.
    const c = importHistoricalTeam(SAMPLE_BOS_1999, 999);
    const pc = c.team.lineup.map((x) => x.potential);
    expect(pc).not.toEqual(pa);
  });

  it('le squadre importate si simulano in modo deterministico', () => {
    const a = simulateGame(cle.team, bos.team, 42);
    const b = simulateGame(cle.team, bos.team, 42);
    expect(a.final).toEqual(b.final);
    expect(a.winner === 'away' || a.winner === 'home').toBe(true);
  });

  it('importa anche panca e riserve quando presenti', () => {
    const withBench: typeof SAMPLE_CLE_1999 = {
      ...SAMPLE_CLE_1999,
      bench: [SAMPLE_CLE_1999.batters[0]],
      reservePitchers: [SAMPLE_CLE_1999.pitchers[0]],
    };
    const t = importHistoricalTeam(withBench).team;
    expect(t.bench).toHaveLength(1);
    expect(t.reservePitchers).toHaveLength(1);
    // Gli id restano unici tra i gruppi.
    const ids = [...t.lineup, ...t.bench].map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // Bonus "horse" = max(volume, profondità/BF-per-partenza): un asso a stagione
  // corta ma PROFONDO (Halladay infortunato: pochi start, 7+ IP/start) non è più
  // punito come uno spot-starter shallow. Stessi totali/rate, solo GS diverso.
  it('l\'asso profondo-per-partenza batte lo shallow a parità di totali', () => {
    const base = { name: 'X', role: 'SP' as const, throws: 'R' as const, age: 28,
      outs: 425, h: 127, hr: 12, bb: 24, so: 103, hbp: 5, er: 48, w: 12, l: 4, sv: 0 };
    const deep = { ...SAMPLE_CLE_1999, pitchers: [{ ...base, id: 'deep', gs: 19 }] };   // 7.5 IP/start
    const shallow = { ...SAMPLE_CLE_1999, pitchers: [{ ...base, id: 'shallow', gs: 28 }] }; // ~5 IP/start
    const dOvr = pitcherOverall(importHistoricalTeam(deep).team.rotation[0].ratings);
    const sOvr = pitcherOverall(importHistoricalTeam(shallow).team.rotation[0].ratings);
    expect(dOvr).toBeGreaterThan(sOvr);
  });
});

// Dataset REALE generato dalla pipeline Lahman: copertura completa della lega.
describe('SEASON_1999 (dataset Lahman, 30 squadre)', () => {
  it('copre tutte e 30 le franchigie, una per franchigia', () => {
    expect(SEASON_1999).toHaveLength(30);
    const ids = SEASON_1999.map((t) => t.franchiseId);
    expect(new Set(ids).size).toBe(30);
    for (const id of ids) {
      expect(FRANCHISES.some((f) => f.id === id)).toBe(true);
    }
  });

  it('ogni squadra costruisce un roster valido per il motore', () => {
    for (const h of SEASON_1999) {
      const { team } = importHistoricalTeam(h);
      expect(team.lineup, `${h.franchiseId} lineup`).toHaveLength(9);
      expect(team.rotation.length, `${h.franchiseId} rotation`).toBeGreaterThanOrEqual(3);
      expect(team.bullpen.length, `${h.franchiseId} bullpen`).toBeGreaterThanOrEqual(1);
      // Ogni casella difensiva del lineup è coperta una sola volta.
      const positions = team.lineup.map((b) => b.position);
      expect(new Set(positions).size, `${h.franchiseId} posizioni`).toBe(9);
    }
  });

  it('preserva le fasce reali anche nel dataset generato', () => {
    const cle = importHistoricalTeam(SEASON_1999.find((t) => t.franchiseId === 'CLE')!);
    const manny = cle.team.lineup.find((b) => b.name === 'Manny Ramirez');
    expect(manny, 'Manny presente in CLE 1999').toBeTruthy();
    expect(manny!.ratings.power).toBeGreaterThanOrEqual(88);

    const bos = importHistoricalTeam(SEASON_1999.find((t) => t.franchiseId === 'BOS')!);
    const pedro = [...bos.team.rotation, ...bos.team.bullpen].find(
      (p) => p.name === 'Pedro Martinez',
    );
    expect(pedro, 'Pedro presente in BOS 1999').toBeTruthy();
    expect(pedro!.ratings.stuff).toBeGreaterThanOrEqual(90);
  });

  it('una lega di squadre storiche si simula in modo deterministico', () => {
    const a = importHistoricalTeam(SEASON_1999[0]).team;
    const b = importHistoricalTeam(SEASON_1999[1]).team;
    expect(simulateGame(a, b, 7).final).toEqual(simulateGame(a, b, 7).final);
  });

  it('nessun giocatore duplicato in tutta la lega (dedup per persona)', () => {
    const league = buildHistoricalLeague();
    const ids: string[] = [];
    for (const t of league) {
      for (const p of [...t.lineup, ...t.bench, ...t.rotation, ...t.bullpen,
        ...t.reserveBatters, ...t.reservePitchers]) ids.push(p.id);
    }
    // Ogni giocatore reale compare una sola volta nell'intera lega.
    expect(new Set(ids).size).toBe(ids.length);
    // L'identità è stabile e derivata dal playerID Lahman.
    expect(ids.every((id) => id.startsWith('hist-'))).toBe(true);
  });
});

describe('Annate storiche multiple (1997→2005)', () => {
  it('espone gli anni giocabili in ordine crescente', () => {
    expect(HISTORICAL_YEARS).toEqual([
      1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005,
    ]);
  });

  // Conteggi reali: dal 1998 la MLB ha 30 squadre; il 1997 ne aveva 28
  // (Arizona e Tampa Bay debuttano nel 1998).
  it.each([
    [1997, 28],
    [1998, 30],
    [1999, 30],
    [2000, 30],
    [2001, 30],
    [2002, 30],
    [2003, 30],
    [2004, 30],
    [2005, 30],
  ])('la stagione %i copre %i franchigie distinte', (year, count) => {
    const dataset = HISTORICAL_SEASONS[year];
    expect(dataset).toHaveLength(count);
    expect(new Set(dataset.map((t) => t.franchiseId)).size).toBe(count);
    for (const h of dataset) {
      expect(FRANCHISES.some((f) => f.id === h.franchiseId)).toBe(true);
    }
  });

  it('il 1997 non contiene le franchigie non ancora esistite (ARI/TBR)', () => {
    const ids = new Set(HISTORICAL_SEASONS[1997].map((t) => t.franchiseId));
    expect(ids.has('ARI')).toBe(false);
    expect(ids.has('TBR')).toBe(false);
  });

  it.each(HISTORICAL_YEARS)(
    'buildHistoricalLeague(%i) produce roster validi e senza doppioni',
    (year) => {
      const league = buildHistoricalLeague(year);
      expect(league.length).toBe(HISTORICAL_SEASONS[year].length);
      const ids: string[] = [];
      for (const t of league) {
        expect(t.lineup, `${t.abbrev} lineup`).toHaveLength(9);
        expect(new Set(t.lineup.map((b) => b.position)).size).toBe(9);
        expect(t.rotation.length, `${t.abbrev} rotation`).toBeGreaterThanOrEqual(3);
        for (const p of [...t.lineup, ...t.bench, ...t.rotation, ...t.bullpen,
          ...t.reserveBatters, ...t.reservePitchers]) ids.push(p.id);
      }
      // Dedup per persona: ogni giocatore reale una sola volta nell'intera lega.
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('hist-'))).toBe(true);
    },
  );

  // Replica-gemma (calibrazione "Fedele"): una stagione memorabile esce con OVR
  // da fenomeno (>=90) e numeri da gemma, non schiacciata dalla media piatta.
  it('la gemma di Bonds 2001 esce OVR >=90 e ~55+ HR', () => {
    const bonds = buildHistoricalLeague(2001)
      .flatMap((t) => [...t.lineup, ...t.bench, ...t.reserveBatters])
      .find((b) => b.name === 'Barry Bonds');
    expect(bonds, 'Bonds presente nel 2001').toBeTruthy();
    expect(batterOverall(bonds!.ratings)).toBeGreaterThanOrEqual(90);
    expect(bonds!.stats.hr).toBeGreaterThanOrEqual(50);
    // Potenza/occhio da fenomeno assoluto, ma il taper dello stretch evita la
    // saturazione piatta a 100 (niente caricature): elite senza toccare il tetto.
    expect(bonds!.ratings.power).toBeGreaterThanOrEqual(96);
    expect(bonds!.ratings.eye).toBeGreaterThanOrEqual(96);
  });
});

// Difesa REALE (Fielding.csv): individualizzata per giocatore, non più un archetipo
// piatto per ruolo. Prima ogni SS/C era identico e nessuno superava ~84.
describe('difesa individualizzata (Fielding.csv)', () => {
  it('la difesa NON è più piatta per ruolo: c\'è varianza dentro ogni casella', () => {
    const league = buildHistoricalLeague(2002);
    const ssFld = league
      .flatMap((t) => [...t.lineup, ...t.bench])
      .filter((b) => b.position === 'SS')
      .map((b) => b.ratings.fielding);
    // Almeno 5 SS titolari con valori DISTINTI (prima erano tutti uguali).
    expect(ssFld.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ssFld).size).toBeGreaterThanOrEqual(5);
  });

  it('i difensori elite sfondano 90 e la mediana resta ~media (fascia comune intatta)', () => {
    const fld = buildHistoricalLeague(2002)
      .flatMap((t) => [...t.lineup, ...t.bench])
      .map((b) => b.ratings.fielding)
      .sort((a, b) => a - b);
    const median = fld[Math.floor(fld.length / 2)];
    expect(Math.max(...fld)).toBeGreaterThanOrEqual(90); // qualcuno arriva a 90+
    expect(Math.min(...fld)).toBeLessThanOrEqual(60); // e qualcuno è scarso
    expect(median).toBeGreaterThanOrEqual(66);
    expect(median).toBeLessThanOrEqual(74); // mediana ~70 (archetipo baseline)
  });
});

// Gate rookie (present-only, niente preveggenza): l'esordiente non riceve lo
// stretch, così un mezzo anno "caldo" da un-tool non si gonfia a OVR da stella.
describe('gate rookie', () => {
  const ovrOf = (year: number, name: string) => {
    const b = buildHistoricalLeague(year)
      .flatMap((t) => [...t.lineup, ...t.bench, ...t.reserveBatters])
      .find((x) => x.name === name);
    expect(b, `${name} ${year}`).toBeTruthy();
    return batterOverall(b!.ratings, b!.position);
  };

  it('un rookie a profilo VUOTO (velocità/media, poca sostanza) non si gonfia', () => {
    // Willy Taveras 2005: .291 senza potenza né walk — con lo stretch saliva a ~90.
    expect(ovrOf(2005, 'Willy Taveras')).toBeLessThan(84);
  });

  it('un rookie a produzione GENUINA resta valorizzato (no hindsight)', () => {
    // Pujols/Ichiro 2001: stagioni davvero elite → il gate non le affossa.
    expect(ovrOf(2001, 'Albert Pujols')).toBeGreaterThanOrEqual(88);
    expect(ovrOf(2001, 'Ichiro Suzuki')).toBeGreaterThanOrEqual(87);
  });
});

// Seconde posizioni REALI (Appearances): i multi-ruolo storici sono schierabili
// fuori ruolo (canOccupy) come nel seed generato, per gestione/ottimizzazione.
describe('seconde posizioni storiche (Appearances)', () => {
  it('secondarie SEMPRE valide e copertura maggioritaria (carriera reale + fallback ≤33)', () => {
    const players = buildHistoricalLeague(2002).flatMap((t) => [
      ...t.lineup,
      ...t.bench,
      ...t.reserveBatters,
    ]);
    const withSec = players.filter((b) => b.secondaryPosition);
    // Copertura: stragrande maggioranza (storia di carriera + fallback plausibile
    // per i giovani), ma NON il 100% (i mono-ruolo veterani restano fedeli).
    expect(withSec.length / players.length).toBeGreaterThan(0.85);
    expect(withSec.length / players.length).toBeLessThan(1);
    for (const b of withSec) {
      const opts = SECONDARY_OPTIONS[b.position];
      expect(opts, `${b.name} ${b.position}`).toBeTruthy();
      expect(opts).toContain(b.secondaryPosition);
      expect(b.secondaryPosition).not.toBe(b.position);
    }
  });

  it('Garciaparra 2005 (3B primario, 26 partite a SS) ha SS come secondaria', () => {
    const nomar = buildHistoricalLeague(2005)
      .flatMap((t) => [...t.lineup, ...t.bench, ...t.reserveBatters])
      .find((b) => b.name === 'Nomar Garciaparra');
    expect(nomar).toBeTruthy();
    expect(nomar!.secondaryPosition).toBe('SS');
  });
});

// Pool FREE AGENT storico cablato: i fuori rosa non spariscono, alimentano il
// mercato dell'off-season (startOffseason).
describe('pool free agent storico', () => {
  it('buildHistoricalFreeAgents istanzia i fuori rosa come giocatori del motore', () => {
    const fa = buildHistoricalFreeAgents(2002);
    expect(fa.batters.length + fa.pitchers.length).toBeGreaterThan(20);
    for (const p of [...fa.batters, ...fa.pitchers]) {
      expect(p.id.startsWith('hist-')).toBe(true);
      expect(p.salary).toBeGreaterThan(0);
    }
  });

  it('startOffseason semina il pool coi FA storici (mercato con profondità reale)', () => {
    const teams = buildHistoricalLeague(2002);
    const fa = buildHistoricalFreeAgents(2002);
    const state = startOffseason(teams, 1, 2002, undefined, HISTORICAL_MODE, [
      ...fa.batters,
      ...fa.pitchers,
    ]);
    expect(state.pool.length).toBeGreaterThan(20);
    // Dedup: nessun giocatore già a roster finisce nel pool.
    const rostered = new Set(
      Object.values(state.rosters).flatMap((s) =>
        [...s.batters, ...s.pitchers].map((p) => p.id),
      ),
    );
    expect(state.pool.some((p) => rostered.has(p.id))).toBe(false);
  });
});
