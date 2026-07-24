import { describe, it, expect } from 'vitest';
import { occurrencesBetween, datesToGenerate } from './recurrence';

const rule = (over = {}) => ({
  id: 'r1', freq: 'daily', interval: 1, weekdays: [], dayOfMonth: 1,
  anchorDate: '2026-01-01', active: true, lastGeneratedDate: null, ...over,
});

describe('occurrencesBetween', () => {
  it('fires every day for freq daily', () => {
    expect(occurrencesBetween(rule(), '2026-07-20', '2026-07-23')).toEqual([
      '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23',
    ]);
  });

  it('fires every N days from anchorDate for freq interval', () => {
    const r = rule({ freq: 'interval', interval: 3, anchorDate: '2026-07-01' });
    expect(occurrencesBetween(r, '2026-07-01', '2026-07-10')).toEqual([
      '2026-07-01', '2026-07-04', '2026-07-07', '2026-07-10',
    ]);
  });

  it('fires only on the given weekdays for freq weekly', () => {
    // 2026-07-13 is a Monday; Mon(1) and Thu(4) requested over that week
    const r = rule({ freq: 'weekly', weekdays: [1, 4], anchorDate: '2026-01-01' });
    expect(occurrencesBetween(r, '2026-07-13', '2026-07-19')).toEqual([
      '2026-07-13', '2026-07-16',
    ]);
  });

  it('fires on dayOfMonth each month for freq monthly', () => {
    const r = rule({ freq: 'monthly', dayOfMonth: 15, anchorDate: '2026-01-01' });
    expect(occurrencesBetween(r, '2026-06-01', '2026-08-01')).toEqual([
      '2026-06-15', '2026-07-15',
    ]);
  });

  it('clamps dayOfMonth to the last day of a shorter month', () => {
    const r = rule({ freq: 'monthly', dayOfMonth: 31, anchorDate: '2026-01-01' });
    // Feb 2026 has 28 days (not a leap year)
    expect(occurrencesBetween(r, '2026-02-01', '2026-02-28')).toEqual(['2026-02-28']);
  });

  it('excludes dates before anchorDate even if the requested range starts earlier', () => {
    const r = rule({ freq: 'daily', anchorDate: '2026-07-22' });
    expect(occurrencesBetween(r, '2026-07-19', '2026-07-23')).toEqual([
      '2026-07-22', '2026-07-23',
    ]);
  });

  it('returns nothing for an inactive rule', () => {
    const r = rule({ active: false });
    expect(occurrencesBetween(r, '2026-07-20', '2026-07-23')).toEqual([]);
  });
});

describe('datesToGenerate', () => {
  it('generates from anchorDate through today when never generated before', () => {
    const r = rule({ anchorDate: '2026-07-21' });
    expect(datesToGenerate(r, '2026-07-23', new Set())).toEqual([
      '2026-07-21', '2026-07-22', '2026-07-23',
    ]);
  });

  it('resumes the day after lastGeneratedDate', () => {
    const r = rule({ anchorDate: '2026-07-01', lastGeneratedDate: '2026-07-21' });
    expect(datesToGenerate(r, '2026-07-23', new Set())).toEqual([
      '2026-07-22', '2026-07-23',
    ]);
  });

  it('skips dates that already have an instance', () => {
    const r = rule({ anchorDate: '2026-07-21' });
    const existing = new Set(['2026-07-22']);
    expect(datesToGenerate(r, '2026-07-23', existing)).toEqual([
      '2026-07-21', '2026-07-23',
    ]);
  });

  it('returns nothing for an inactive rule', () => {
    const r = rule({ anchorDate: '2026-07-01', active: false });
    expect(datesToGenerate(r, '2026-07-23', new Set())).toEqual([]);
  });

  it('returns nothing when already generated through today', () => {
    const r = rule({ anchorDate: '2026-07-01', lastGeneratedDate: '2026-07-23' });
    expect(datesToGenerate(r, '2026-07-23', new Set())).toEqual([]);
  });
});
