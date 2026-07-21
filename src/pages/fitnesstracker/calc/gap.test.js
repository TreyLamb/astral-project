import { describe, it, expect } from 'vitest';
import { costOfRunning, gapFactor, gradeAdjustedPace, FLAT_COST } from './gap';

describe('Minetti grade-adjusted pace', () => {
  it('flat cost is 3.6 J/kg/m', () => {
    expect(costOfRunning(0)).toBeCloseTo(3.6, 6);
    expect(FLAT_COST).toBe(3.6);
  });
  it('+10% grade costs ~1.66x flat', () => {
    expect(gapFactor(0.10)).toBeCloseTo(1.658, 2);
  });
  it('min cost is near -20% and below flat (Minetti headline result)', () => {
    expect(costOfRunning(-0.20)).toBeLessThan(FLAT_COST);
    expect(costOfRunning(-0.20)).toBeLessThan(costOfRunning(-0.05));
    expect(costOfRunning(-0.20)).toBeLessThan(costOfRunning(-0.40));
  });
  it('uphill graded pace maps to a faster equivalent flat pace', () => {
    const actual = 0.30; // s/m
    expect(gradeAdjustedPace(actual, 0.10)).toBeLessThan(actual);
  });
  it('downhill graded pace maps to a slower equivalent flat pace', () => {
    const actual = 0.30;
    expect(gradeAdjustedPace(actual, -0.10)).toBeGreaterThan(actual);
  });
  it('clamps beyond the validated ±45% range', () => {
    expect(costOfRunning(0.9)).toBe(costOfRunning(0.45));
  });
});
