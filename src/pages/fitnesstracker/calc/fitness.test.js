import { describe, it, expect } from 'vitest';
import {
  vdotAtFraction, impliedVdotRange, impliedVdotFromReps, measuredVdot,
  inferredVdotFromEasy, currentFitness, classifyPace, suggestsRecalibration, isTimeTrial,
} from './fitness';
import { trainingPaces, vdotFromRace } from './vdot';

const MI = 1609.344;
const run = (p) => ({ activityType: 'run', status: 'completed', ...p });

describe('vdotAtFraction', () => {
  it('inverts trainingPaces — a pace run AT a zone implies the VDOT it came from', () => {
    // Round-trip: take VDOT 44's T pace, feed it back in at the T fraction.
    const t = trainingPaces(44).T; // sec/m
    const back = vdotAtFraction(1000, t * 1000, 0.88);
    expect(back).toBeCloseTo(44, 1);
  });

  it('same pace at an easier fraction implies a higher VDOT', () => {
    const easy = vdotAtFraction(1000, 300, 0.62);
    const harder = vdotAtFraction(1000, 300, 0.70);
    expect(easy).toBeGreaterThan(harder);
  });

  it('returns null on missing inputs rather than NaN', () => {
    expect(vdotAtFraction(0, 300, 0.7)).toBeNull();
    expect(vdotAtFraction(1000, 0, 0.7)).toBeNull();
    expect(vdotAtFraction(1000, 300, 0)).toBeNull();
  });
});

describe("impliedVdotRange — the gap estimateRunBaseline can't fill", () => {
  it("bounds VDOT from a non-standard easy distance (2.83mi, which matches no PR bucket)", () => {
    const [lo, hi] = impliedVdotRange(2.83 * MI, 2.83 * 623, 'E'); // 10:23/mi
    expect(lo).toBeGreaterThan(30);
    expect(hi).toBeGreaterThan(lo);
    // Sanity: an easy 10:23/mi is not a VDOT-20 runner nor a VDOT-70 one.
    expect(lo).toBeLessThan(hi);
    expect(hi).toBeLessThan(60);
  });

  it('a faster easy run implies a higher VDOT range', () => {
    const slow = impliedVdotRange(5000, 5000 * 0.42, 'E');
    const fast = impliedVdotRange(5000, 5000 * 0.36, 'E');
    expect(fast[0]).toBeGreaterThan(slow[0]);
  });

  it('returns null for an unknown zone', () => {
    expect(impliedVdotRange(5000, 1500, 'Z')).toBeNull();
  });
});

describe('impliedVdotFromReps', () => {
  it('brackets VDOT between the I and R readings of the same rep', () => {
    const [lo, hi] = impliedVdotFromReps(400, 103); // 1:43
    expect(lo).toBeLessThan(hi);
    // R is the harder fraction, so it yields the LOWER implied VDOT.
    expect(hi - lo).toBeGreaterThan(1);
  });
});

describe('measuredVdot — only real efforts count', () => {
  it('ignores easy runs entirely', () => {
    expect(measuredVdot([run({ distanceM: 5000, durationSec: 2000, rpe: 4 })])).toBeNull();
  });

  it('uses a run explicitly noted as a time trial', () => {
    const w = run({ distanceM: 3218.688, durationSec: 900, note: 'time trial', date: '2026-08-31' });
    const got = measuredVdot([w]);
    expect(got.via).toBe('timeTrial');
    expect(got.vdot).toBeCloseTo(vdotFromRace(3218.688, 900), 5);
  });

  it('uses a max-effort RPE run even without a note', () => {
    const got = measuredVdot([run({ distanceM: 3218.688, durationSec: 900, rpe: 9 })]);
    expect(got.via).toBe('rpe');
  });

  it('picks the best VDOT when several qualify', () => {
    const slow = run({ distanceM: 3218.688, durationSec: 1080, rpe: 9, date: '2026-08-01' });
    const fast = run({ distanceM: 3218.688, durationSec: 900, rpe: 9, date: '2026-08-31' });
    expect(measuredVdot([slow, fast]).workout.durationSec).toBe(900);
  });

  it('skips planned sessions — they never happened', () => {
    expect(measuredVdot([{ ...run({ distanceM: 3218.688, durationSec: 900, rpe: 9 }), status: 'planned' }])).toBeNull();
  });
});

describe('isTimeTrial', () => {
  it('matches the words a person actually writes', () => {
    expect(isTimeTrial({ note: 'Checkpoint Test 1' })).toBe(true);
    expect(isTimeTrial({ title: '2-mile TT' })).toBe(true);
    expect(isTimeTrial({ note: 'all-out' })).toBe(true);
    expect(isTimeTrial({ note: 'easy shakeout' })).toBe(false);
  });
});

describe('currentFitness', () => {
  it('prefers a measured effort over inferred easy runs', () => {
    const got = currentFitness([
      run({ distanceM: 5000, durationSec: 1800, rpe: 3, date: '2026-08-18' }),
      run({ distanceM: 3218.688, durationSec: 900, rpe: 9, date: '2026-08-17' }),
    ]);
    expect(got.confidence).toBe('measured');
    expect(got.needsTimeTrial).toBe(false);
  });

  it('falls back to an inferred range and asks for a time trial', () => {
    const got = currentFitness([run({ distanceM: 2.83 * MI, durationSec: 2.83 * 623, rpe: 4, date: '2026-08-17' })]);
    expect(got.confidence).toBe('inferred');
    expect(got.needsTimeTrial).toBe(true);
    expect(got.vdot).toBeGreaterThan(got.range[0]);
    expect(got.vdot).toBeLessThan(got.range[1]);
  });

  it('reports none rather than guessing when nothing is logged', () => {
    const got = currentFitness([]);
    expect(got.confidence).toBe('none');
    expect(got.vdot).toBeNull();
  });
});

describe('classifyPace', () => {
  it('identifies the zone a pace was actually run in', () => {
    const p = trainingPaces(44);
    expect(classifyPace(p.T, 44).zone).toBe('T');
    expect(classifyPace(p.I, 44).zone).toBe('I');
    expect(classifyPace(p.R, 44).zone).toBe('R');
  });

  it('reports faster-than-zone as a negative delta', () => {
    const p = trainingPaces(44);
    const got = classifyPace(p.T * 0.95, 44);
    expect(got.faster).toBe(true);
    expect(got.deltaPct).toBeLessThan(0);
  });
});

describe('suggestsRecalibration', () => {
  it('fires when an easy run comes in well under the easy band', () => {
    const p = trainingPaces(30); // stale, too-slow model
    expect(suggestsRecalibration(p.E[1] * 0.8, 30, 'E')).toBe(true);
  });

  it('stays quiet when the session lands where it should', () => {
    const p = trainingPaces(44);
    expect(suggestsRecalibration(p.T, 44, 'T')).toBe(false);
  });

  it('is false rather than throwing on missing data', () => {
    expect(suggestsRecalibration(null, 44, 'T')).toBe(false);
    expect(suggestsRecalibration(0.3, null, 'T')).toBe(false);
  });
});
