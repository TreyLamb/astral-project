import { describe, it, expect } from 'vitest';
import { karvonen, hrZones, zoneForHr } from './hr';

describe('Karvonen HR zones', () => {
  it('70% of a 190/50 heart-rate reserve is 148', () => {
    expect(karvonen(190, 50, 0.70)).toBeCloseTo(148, 6);
  });
  it('builds 5 zones with correct bounds', () => {
    const z = hrZones(190, 50);
    expect(z).toHaveLength(5);
    expect(z[0].loBpm).toBe(120); // 0.50*140 + 50
    expect(z[4].hiBpm).toBe(190); // 1.00*140 + 50
  });
  it('classifies a heart rate into its zone', () => {
    expect(zoneForHr(148, 190, 50).id).toBe('z3'); // 70% HRR
    expect(zoneForHr(190, 190, 50).id).toBe('z5');
  });
  it('returns nothing without real max/rest HR', () => {
    expect(hrZones(null, 50)).toEqual([]);
  });
});
