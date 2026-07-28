import { describe, it, expect } from 'vitest';
import {
  basesById, homeBase, baseForDate, makeHomePlaceForDate, weatherLocationForDate, HOME_LOCATION_ID,
} from './baseLocation';

const orem = { id: 'b-orem', tag: 'OREM', query: 'Orem, Utah', lat: 40.29, lng: -111.69, isHome: true };
const parisUt = { id: 'b-paris', tag: 'PARIS', query: 'Paris, Utah', lat: 42.22, lng: -111.40, isHome: false };
const hawaii = { id: 'b-hi', tag: 'HAWAII', query: 'Honolulu, Hawaii', lat: 21.31, lng: -157.86, isHome: false };
const ungeocoded = { id: 'b-x', tag: 'X', query: 'Somewhere', lat: null, lng: null, isHome: false };
const bases = [orem, parisUt, hawaii, ungeocoded];
const home = { lat: 40.29, lng: -111.69 };

describe('homeBase / basesById', () => {
  it('returns the isHome base, null when none', () => {
    expect(homeBase(bases)).toBe(orem);
    expect(homeBase([parisUt, hawaii])).toBe(null);
    expect(homeBase()).toBe(null);
  });
  it('maps by id', () => {
    expect(basesById(bases).get('b-hi')).toBe(hawaii);
    expect(basesById().size).toBe(0);
  });
});

describe('baseForDate', () => {
  it('an explicit day tag wins', () => {
    expect(baseForDate('2026-08-01', { '2026-08-01': 'b-hi' }, bases)).toBe(hawaii);
  });
  it('falls back to the home base when the day is untagged', () => {
    expect(baseForDate('2026-08-02', {}, bases)).toBe(orem);
  });
  it('is null when untagged and there is no home base', () => {
    expect(baseForDate('2026-08-02', {}, [parisUt, hawaii])).toBe(null);
  });
  it('ignores a stale day tag pointing at a deleted base', () => {
    expect(baseForDate('2026-08-03', { '2026-08-03': 'gone' }, bases)).toBe(orem);
  });
});

describe('makeHomePlaceForDate', () => {
  const resolve = makeHomePlaceForDate({ '2026-08-01': 'b-hi', '2026-08-04': 'b-x' }, bases, home);
  it('yields the tagged base coords', () => {
    expect(resolve('2026-08-01')).toEqual({ lat: 21.31, lng: -157.86 });
  });
  it('yields the home base coords for an untagged day', () => {
    expect(resolve('2026-08-02')).toEqual({ lat: 40.29, lng: -111.69 });
  });
  it('falls back to the global home place when the tagged base has no coords', () => {
    expect(resolve('2026-08-04')).toBe(home);
  });
  it('falls back to the global home place when there is no home base at all', () => {
    const r = makeHomePlaceForDate({}, [parisUt, hawaii], home);
    expect(r('2026-08-09')).toBe(home);
  });
  it('returns null when nothing resolves and no global home was given', () => {
    const r = makeHomePlaceForDate({}, [], null);
    expect(r('2026-08-09')).toBe(null);
  });
});

describe('weatherLocationForDate', () => {
  it("reads an away-base's own forecast id", () => {
    expect(weatherLocationForDate('2026-08-01', { '2026-08-01': 'b-hi' }, bases)).toBe('b-hi');
  });
  it("uses 'home' for an untagged day", () => {
    expect(weatherLocationForDate('2026-08-02', {}, bases)).toBe(HOME_LOCATION_ID);
  });
  it("uses 'home' for the home base even when it is explicitly tagged (avoids orphaning the home forecast)", () => {
    expect(weatherLocationForDate('2026-08-05', { '2026-08-05': 'b-orem' }, bases)).toBe(HOME_LOCATION_ID);
  });
  it("uses 'home' for an away-base that is not geocoded yet", () => {
    expect(weatherLocationForDate('2026-08-04', { '2026-08-04': 'b-x' }, bases)).toBe(HOME_LOCATION_ID);
  });
});
