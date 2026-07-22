import { describe, it, expect } from 'vitest';
import { requiredWeeklyRatePct, impliedDailyKcalDeficit, rateCapPctPerWeek } from './bodyComposition';
import { KG_PER_LB } from '../units';

describe('requiredWeeklyRatePct', () => {
  it('200 -> 190 over 10 weeks is exactly 0.5%/week — the ISSN cut-rate floor', () => {
    // A pure ratio, so unit-agnostic: (200-190)/200 = 5% total / 10 weeks = 0.5%/week.
    expect(requiredWeeklyRatePct(200, 190, 10)).toBeCloseTo(0.005, 6);
  });
  it('returns null when any input is missing', () => {
    expect(requiredWeeklyRatePct(null, 190, 10)).toBeNull();
    expect(requiredWeeklyRatePct(200, null, 10)).toBeNull();
    expect(requiredWeeklyRatePct(200, 190, 0)).toBeNull();
  });
});

describe('impliedDailyKcalDeficit', () => {
  it('1 lb/week (in kg) implies the commonly-cited ~500 kcal/day deficit', () => {
    const oneLbPerWeekInKg = 1 * KG_PER_LB;
    expect(impliedDailyKcalDeficit(oneLbPerWeekInKg)).toBeCloseTo(500, 1);
  });
});

describe('rateCapPctPerWeek', () => {
  it('loss cap (0.5-0.75%/wk) is tighter than the gain cap (0.25-0.5%/wk) at the top end', () => {
    const loss = rateCapPctPerWeek('loss');
    const gain = rateCapPctPerWeek('gain');
    expect(loss.max).toBeCloseTo(0.0075, 6);
    expect(gain.max).toBeCloseTo(0.005, 6);
    expect(gain.max).toBeLessThan(loss.max); // lean gain is recommended slower than a cut
  });
});
