import { describe, it, expect } from 'vitest';
import { per100, swolf, css, cssZones } from './swim';

describe('swim pace + SWOLF', () => {
  it('pace per 100m', () => {
    expect(per100(400, 380, 'm')).toBeCloseTo(95, 6); // 400m in 6:20 -> 1:35/100m
  });
  it('SWOLF adds strokes + seconds', () => {
    expect(swolf(18, 22)).toBe(40);
  });
});

describe('Critical Swim Speed', () => {
  it('computes CSS from a 400/200 trial pair', () => {
    // 400m in 6:00 (360s), 200m in 2:50 (170s)
    const r = css(200, 170, 400, 360);
    expect(r.speedMps).toBeCloseTo(1.0526, 3);
    expect(r.per100mSec).toBeCloseTo(95, 0);
  });
  it('is order-independent', () => {
    expect(css(400, 360, 200, 170).speedMps).toBeCloseTo(css(200, 170, 400, 360).speedMps, 6);
  });
  it('builds zones slower than CSS for recovery', () => {
    const z = cssZones(95);
    const rec = z.find((x) => x.id === 'rec');
    const spr = z.find((x) => x.id === 'spr');
    expect(rec.per100mSec).toBeGreaterThan(95); // recovery is slower
    expect(spr.per100mSec).toBeLessThan(95);    // sprint is faster
  });
});
