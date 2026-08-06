import { describe, it, expect } from 'vitest';
import { parseShorthand, parseDistanceTotalM } from './shorthand';

const MI = 1609.344;

describe('parseDistanceTotalM', () => {
  it('reads a single plain distance', () => {
    expect(parseDistanceTotalM('Easy 1.5 mi')).toBeCloseTo(1.5 * MI, 1);
  });

  it('sums every distance in a session description', () => {
    // WU 1mi + 4x400m + CD 0.5mi
    expect(parseDistanceTotalM('WU 1mi + 4x400m + CD 0.5mi')).toBeCloseTo(MI + 1600 + 0.5 * MI, 1);
  });

  it('applies rep multipliers', () => {
    expect(parseDistanceTotalM('6x400m')).toBe(2400);
    expect(parseDistanceTotalM('4 x 25m')).toBe(100);
    expect(parseDistanceTotalM('3×50m')).toBe(150);
  });

  // The reason the Miles column can trust free text: a pace has a slash between
  // the number and the unit, so it can never be mistaken for a distance.
  it('does NOT mistake a pace for a distance', () => {
    expect(parseDistanceTotalM('@ 11:10/mi')).toBe(0);
    expect(parseDistanceTotalM('2.0 mi @ 11:10/mi (~22:20)')).toBeCloseTo(2 * MI, 1);
  });

  it('does not read "min" as metres', () => {
    expect(parseDistanceTotalM('45 min easy')).toBe(0);
  });

  it('handles km, yards and bare metres', () => {
    expect(parseDistanceTotalM('10k')).toBe(10000);
    expect(parseDistanceTotalM('5 km')).toBe(5000);
    expect(parseDistanceTotalM('2000yd')).toBeCloseTo(2000 * 0.9144, 3);
    expect(parseDistanceTotalM('800m')).toBe(800);
  });

  it('returns 0 for text with no distance at all', () => {
    expect(parseDistanceTotalM('Lift A (chest/arms)')).toBe(0);
    expect(parseDistanceTotalM('')).toBe(0);
    expect(parseDistanceTotalM(null)).toBe(0);
    expect(parseDistanceTotalM(undefined)).toBe(0);
  });

  it('handles a real sled/carry session line', () => {
    const t = 'sled drag 4x25m + lateral sprint 4x50m + farmers carry 3x50m + 3x50m sprints';
    expect(parseDistanceTotalM(t)).toBe(100 + 200 + 150 + 150);
  });
});

describe('parseShorthand', () => {
  it('still parses type + distance + duration', () => {
    const r = parseShorthand('swim 2000yd 40:00');
    expect(r.activityType).toBe('swim');
    expect(r.distanceM).toBeCloseTo(2000 * 0.9144, 3);
    expect(r.durationSec).toBe(2400);
  });

  it('returns null when nothing is recognisable', () => {
    expect(parseShorthand('')).toBeNull();
    expect(parseShorthand('qqq')).toBeNull();
  });
});
