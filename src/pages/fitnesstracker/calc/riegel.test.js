import { describe, it, expect } from 'vitest';
import { riegelPredict, RIEGEL_EXPONENT } from './riegel';

describe('Riegel predictor', () => {
  it('uses the 1.06 fatigue exponent', () => {
    expect(RIEGEL_EXPONENT).toBe(1.06);
  });
  it('predicts a 10K from a 20:00 5K (~41:42)', () => {
    const t = riegelPredict(5000, 1200, 10000);
    // 1200 * 2^1.06 = 2502s
    expect(t).toBeCloseTo(2502, 0);
  });
  it('predicts a marathon from a 20:00 5K in a plausible band', () => {
    const t = riegelPredict(5000, 1200, 42195);
    expect(t / 3600).toBeGreaterThan(3.0); // > 3:00
    expect(t / 3600).toBeLessThan(3.6);    // < 3:36
  });
  it('is identity at the same distance', () => {
    expect(riegelPredict(5000, 1200, 5000)).toBeCloseTo(1200, 6);
  });
});
