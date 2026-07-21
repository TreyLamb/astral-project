import { describe, it, expect } from 'vitest';
import { matchBucket, computePRs, bestPace, longestRun } from './pr';

const run = (date, distanceM, durationSec) => ({ date, distanceM, durationSec, status: 'completed', activityType: 'run' });

describe('PR bucket matching', () => {
  it('matches 5019m to the 5K bucket (within 1.5%)', () => {
    expect(matchBucket(5019).id).toBe('5k');
  });
  it('does not match 5200m to any bucket', () => {
    expect(matchBucket(5200)).toBeNull();
  });
  it('matches a mile', () => {
    expect(matchBucket(1610).id).toBe('1mi');
  });
});

describe('PR computation', () => {
  const ws = [run('2026-07-01', 5000, 1300), run('2026-07-08', 5000, 1200), run('2026-07-15', 5000, 1250)];
  it('keeps the fastest time per bucket', () => {
    const fivek = computePRs(ws).find((p) => p.bucket.id === '5k').pr;
    expect(fivek.timeSec).toBe(1200);
    expect(fivek.date).toBe('2026-07-08');
  });
  it('tracks best average pace across odd distances', () => {
    // 3300m in 720s (0.218 s/m) is faster than any of the 5K runs above
    const best = bestPace([run('2026-07-01', 3300, 720), ...ws]);
    expect(best.secPerM).toBeCloseTo(720 / 3300, 6);
    expect(best.distanceM).toBe(3300); // picked the odd-distance run, not a bucketed 5K
  });
  it('tracks the longest single run', () => {
    expect(longestRun([run('2026-07-01', 3300, 900), run('2026-07-02', 21097.5, 5400)]).distanceM).toBe(21097.5);
  });
});
