import { describe, it, expect } from 'vitest';
import { parseShorthand } from './shorthand';
import { M_PER_MILE, M_PER_YARD } from '../units';

describe('shorthand parser', () => {
  it('parses "5mi 38:20"', () => {
    const r = parseShorthand('5mi 38:20');
    expect(r.distanceM).toBeCloseTo(5 * M_PER_MILE, 3);
    expect(r.durationSec).toBe(2300);
  });
  it('parses "1500m 22:10"', () => {
    const r = parseShorthand('1500m 22:10');
    expect(r.distanceM).toBe(1500);
    expect(r.durationSec).toBe(1330);
  });
  it('parses "10k 41:00"', () => {
    expect(parseShorthand('10k 41:00').distanceM).toBe(10000);
  });
  it('parses bare "45min"', () => {
    expect(parseShorthand('45min').durationSec).toBe(2700);
    expect(parseShorthand('45min').distanceM).toBeNull();
  });
  it('detects an activity word and yards: "swim 2000yd 40:00"', () => {
    const r = parseShorthand('swim 2000yd 40:00');
    expect(r.activityType).toBe('swim');
    expect(r.distanceM).toBeCloseTo(2000 * M_PER_YARD, 3);
    expect(r.durationSec).toBe(2400);
  });
  it('handles H:MM:SS: "bike 20mi 1:05:00"', () => {
    const r = parseShorthand('bike 20mi 1:05:00');
    expect(r.activityType).toBe('bike');
    expect(r.durationSec).toBe(3900);
  });
  it('returns null on empty input', () => {
    expect(parseShorthand('')).toBeNull();
  });
});
