import { describe, it, expect } from 'vitest';
import {
  defaultArrangement,
  buildManagedTeam,
  validateArrangement,
  rosterBatters,
  rosterPitchers,
} from '../arrangement';
import { generateMatchup } from '../../data/generator';
import type { Team } from '../types';

// Rosa realistica dal generatore (deterministica dal seed).
const team: Team = generateMatchup(12345).home;

describe('defaultArrangement', () => {
  it('riflette lineup, difesa, rotazione e bullpen di rosa', () => {
    const arr = defaultArrangement(team);
    expect(arr.order).toEqual(team.lineup.map((b) => b.id));
    expect(arr.rotation).toEqual(team.rotation.map((p) => p.id));
    expect(arr.bullpen).toEqual(team.bullpen.map((p) => p.id));
    for (const b of team.lineup) expect(arr.defense[b.id]).toBe(b.position);
  });

  it('e valido di default', () => {
    expect(validateArrangement(team, defaultArrangement(team)).ok).toBe(true);
  });
});

describe('validateArrangement', () => {
  it('segnala lineup incompleto', () => {
    const arr = defaultArrangement(team);
    arr.order = arr.order.slice(0, 8);
    const res = validateArrangement(team, arr);
    expect(res.ok).toBe(false);
    expect(res.lineupOk).toBe(false);
  });

  it('segnala una casella scoperta e una doppia', () => {
    const arr = defaultArrangement(team);
    const first = arr.order[0];
    const second = arr.order[1];
    // Metto due giocatori sulla stessa casella: uno scopre la sua.
    arr.defense[first] = arr.defense[second];
    const res = validateArrangement(team, arr);
    expect(res.ok).toBe(false);
    expect(res.defense.ok).toBe(false);
  });

  it('esige almeno uno starter', () => {
    const arr = defaultArrangement(team);
    arr.rotation = [];
    const res = validateArrangement(team, arr);
    expect(res.ok).toBe(false);
    expect(res.hasStarter).toBe(false);
  });

  it('accetta un titolare pescato dalla panca', () => {
    if (team.bench.length === 0) return;
    const arr = defaultArrangement(team);
    const benchGuy = team.bench[0];
    const out = arr.order[8];
    // Sostituisco l'ultimo titolare con un panchinaro nella stessa casella.
    arr.order[8] = benchGuy.id;
    arr.defense[benchGuy.id] = arr.defense[out];
    delete arr.defense[out];
    expect(validateArrangement(team, arr).ok).toBe(true);
  });
});

describe('buildManagedTeam', () => {
  it('applica ordine di battuta e starter scelti', () => {
    const arr = defaultArrangement(team);
    // Inverto l'ordine di battuta e scelgo come starter il secondo di rotazione.
    arr.order = [...arr.order].reverse();
    arr.rotation = [team.rotation[1].id, team.rotation[0].id];
    const built = buildManagedTeam(team, arr);
    expect(built.lineup.map((b) => b.id)).toEqual(arr.order);
    expect(built.rotation[0].id).toBe(team.rotation[1].id);
    expect(built.lineup).toHaveLength(9);
  });

  it('rivaluta il fielding di chi gioca fuori ruolo', () => {
    const arr = defaultArrangement(team);
    // Trovo un titolare e lo sposto su una casella diversa dalla sua.
    const b = team.lineup[0];
    const otherSlot = b.position === 'SS' ? '1B' : 'SS';
    // Scambio le due caselle tra i due occupanti per restare una permutazione.
    const other = team.lineup.find((p) => p.position === otherSlot)!;
    arr.defense[b.id] = otherSlot;
    arr.defense[other.id] = b.position;
    const built = buildManagedTeam(team, arr);
    const movedRow = built.lineup.find((p) => p.id === b.id)!;
    expect(movedRow.position).toBe(otherSlot);
  });

  it('ripiega sulla rotazione di rosa se nessuno starter e scelto', () => {
    const arr = defaultArrangement(team);
    arr.rotation = [];
    const built = buildManagedTeam(team, arr);
    expect(built.rotation.length).toBeGreaterThan(0);
  });

  it('raccoglie i non selezionati tra panca e riserve pitcher', () => {
    const arr = defaultArrangement(team);
    const built = buildManagedTeam(team, arr);
    expect(rosterBatters(built).length).toBe(rosterBatters(team).length);
    expect(rosterPitchers(built).length).toBe(rosterPitchers(team).length);
  });
});
