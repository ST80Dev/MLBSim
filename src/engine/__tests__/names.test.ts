import { describe, it, expect } from 'vitest';
import { splitName, lastNameOf, firstNameOf, disambiguateLastNames } from '../names';

describe('splitName', () => {
  it('separa nome e cognome', () => {
    expect(splitName('Roberto Alomar')).toEqual({ first: 'Roberto', last: 'Alomar' });
  });
  it('tiene insieme i cognomi composti (tutto dopo il 1° spazio)', () => {
    expect(splitName('Troy O’Leary')).toEqual({ first: 'Troy', last: 'O’Leary' });
    expect(splitName('Adam De La Rosa')).toEqual({ first: 'Adam', last: 'De La Rosa' });
  });
  it('gestisce il nome singolo', () => {
    expect(splitName('Ichiro')).toEqual({ first: '', last: 'Ichiro' });
  });
});

describe('lastNameOf / firstNameOf', () => {
  it('preferisce i campi espliciti', () => {
    const p = { name: 'X Y', firstName: 'Nomar', lastName: 'Garciaparra' };
    expect(lastNameOf(p)).toBe('Garciaparra');
    expect(firstNameOf(p)).toBe('Nomar');
  });
  it('ripiega sul nome completo se i campi mancano', () => {
    const p = { name: 'Jim Thome' };
    expect(lastNameOf(p)).toBe('Thome');
    expect(firstNameOf(p)).toBe('Jim');
  });
});

describe('disambiguateLastNames', () => {
  it('disambigua i cognomi ripetuti con l\'iniziale', () => {
    const out = disambiguateLastNames(['Roberto Alomar', 'Manny Ramirez', 'Sandy Alomar']);
    expect(out).toEqual(['R. Alomar', 'Ramirez', 'S. Alomar']);
  });
  it('lascia nudi i cognomi unici', () => {
    expect(disambiguateLastNames(['Kenny Lofton', 'Jim Thome'])).toEqual(['Lofton', 'Thome']);
  });
  it('preserva l\'ordine', () => {
    const out = disambiguateLastNames(['Pedro Martinez', 'Ramon Martinez', 'Derek Lowe']);
    expect(out).toEqual(['P. Martinez', 'R. Martinez', 'Lowe']);
  });
});
