import { describe, it, expect } from 'vitest';
import { needsReset, applyReset, qualifyToday, increment } from './trackers';

// lastResetAt/lastQualifiedDate round-trip through isoDate (local calendar
// fields), so ms fixtures are built with the local Date(y,m,d) constructor
// rather than an ISO 'Z' string — keeps the test deterministic regardless of
// the machine's timezone (see calc/recurrence.js header for the same rule).
const localMs = (y, m, d) => new Date(y, m - 1, d, 12).getTime();

const tracker = (over = {}) => ({
  id: 'tr1', type: 'counter', currentValue: 0, resetInterval: 'none',
  lastResetAt: localMs(2026, 7, 23), lastQualifiedDate: null, ...over,
});

describe('needsReset', () => {
  const today = '2026-07-23'; // Thursday, week of Mon 2026-07-20

  it('never resets for resetInterval none', () => {
    const t = tracker({ resetInterval: 'none', lastResetAt: localMs(2026, 1, 1) });
    expect(needsReset(t, today)).toBe(false);
  });

  it('daily: resets when lastResetAt is a prior calendar day', () => {
    const t = tracker({ resetInterval: 'daily', lastResetAt: localMs(2026, 7, 22) });
    expect(needsReset(t, today)).toBe(true);
  });

  it('daily: does not reset when lastResetAt is today', () => {
    const t = tracker({ resetInterval: 'daily', lastResetAt: localMs(2026, 7, 23) });
    expect(needsReset(t, today)).toBe(false);
  });

  it('weekly: resets when lastResetAt falls in a prior ISO week', () => {
    const t = tracker({ resetInterval: 'weekly', lastResetAt: localMs(2026, 7, 15) }); // week of Mon 07-13
    expect(needsReset(t, today)).toBe(true);
  });

  it('weekly: does not reset when lastResetAt falls in the current week', () => {
    const t = tracker({ resetInterval: 'weekly', lastResetAt: localMs(2026, 7, 21) }); // week of Mon 07-20
    expect(needsReset(t, today)).toBe(false);
  });

  it('streak: resets when a full day was missed (lastQualifiedDate older than yesterday)', () => {
    const t = tracker({ type: 'streak', resetInterval: 'none', lastQualifiedDate: '2026-07-21' });
    expect(needsReset(t, today)).toBe(true);
  });

  it('streak: does not reset when lastQualifiedDate is yesterday', () => {
    const t = tracker({ type: 'streak', resetInterval: 'none', lastQualifiedDate: '2026-07-22' });
    expect(needsReset(t, today)).toBe(false);
  });

  it('streak: does not reset when never yet qualified', () => {
    const t = tracker({ type: 'streak', resetInterval: 'none', lastQualifiedDate: null });
    expect(needsReset(t, today)).toBe(false);
  });
});

describe('applyReset', () => {
  const today = '2026-07-23';

  it('zeroes currentValue and bumps lastResetAt when a reset is due', () => {
    const t = tracker({ resetInterval: 'daily', lastResetAt: localMs(2026, 7, 22), currentValue: 5 });
    const out = applyReset(t, today);
    expect(out.currentValue).toBe(0);
    expect(out.lastResetAt).not.toBe(t.lastResetAt);
  });

  it('returns the tracker unchanged when no reset is due', () => {
    const t = tracker({ resetInterval: 'daily', lastResetAt: localMs(2026, 7, 23), currentValue: 5 });
    expect(applyReset(t, today)).toBe(t);
  });
});

describe('qualifyToday', () => {
  const today = '2026-07-23';

  it('increments currentValue and sets lastQualifiedDate', () => {
    const t = tracker({ type: 'streak', currentValue: 2, lastQualifiedDate: '2026-07-22' });
    const out = qualifyToday(t, today);
    expect(out.currentValue).toBe(3);
    expect(out.lastQualifiedDate).toBe(today);
  });

  it('does not double-count when already qualified today', () => {
    const t = tracker({ type: 'streak', currentValue: 3, lastQualifiedDate: today });
    expect(qualifyToday(t, today)).toEqual(t);
  });
});

describe('increment', () => {
  it('adds delta to currentValue', () => {
    expect(increment(tracker({ currentValue: 4 }), 2).currentValue).toBe(6);
  });

  it('supports a negative delta', () => {
    expect(increment(tracker({ currentValue: 4 }), -1).currentValue).toBe(3);
  });
});
