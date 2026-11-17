import { describe, it, expect } from 'vitest';
import { runProfile, personalExponent, maxEfforts, translateEffort, slowdownPerDoubling, DEFAULT_EXPONENT } from './performance';
import { vdotFromRace, equivalentRaceTime, trainingPaces } from './vdot';

const MI = 1609.344;
const tt = (date, distanceM, durationSec) => ({ activityType: 'run', status: 'completed', title: 'time trial', date, distanceM, durationSec });

// Trey's real tests, autumn 2026.
const TREY = [
  tt('2026-08-01', 1600, 503),     // 8:23 1600m, 91°F
  tt('2026-09-08', 2 * MI, 1140),  // 19:00 2 mile
  tt('2026-09-29', 2 * MI, 1091),  // 18:11 2 mile
  tt('2026-10-20', MI, 454),       // 7:34 mile
];

describe('runProfile — never assumes the fastest mile repeats', () => {
  it('predicts a 2-mile well slower than Daniels equivalence from the same mile', () => {
    const p = runProfile(TREY, { asOf: '2026-10-21' });
    const daniels = equivalentRaceTime(vdotFromRace(MI, 454), 2 * MI); // ~16:03
    const mine = p.predict(2 * MI).timeSec;
    expect(daniels).toBeLessThan(970);
    expect(mine).toBeGreaterThan(daniels + 20);
    // and still faster than the 18:11 he ran three weeks before the mile
    expect(mine).toBeLessThan(1091);
  });

  it('anchors on the most recent effort, not the best-ever one', () => {
    const old = [tt('2026-01-01', MI, 400), tt('2026-10-01', MI, 480)];
    const p = runProfile(old, { asOf: '2026-10-02' });
    expect(p.anchor.timeSec).toBe(480);
  });

  it('a test at the target distance predicts itself exactly', () => {
    const p = runProfile([...TREY, tt('2026-10-22', 2 * MI, 1010)], { asOf: '2026-10-22' });
    expect(p.predict(2 * MI).timeSec).toBeCloseTo(1010, 6);
  });

  it('fits the personal exponent cleanly from two tests close together', () => {
    const p = runProfile([...TREY, tt('2026-10-22', 2 * MI, 1010)], { asOf: '2026-10-22' });
    expect(p.exponent.source).toBe('fitted');
    expect(p.exponent.k).toBeCloseTo(Math.log(1010 / 454) / Math.log(2), 6); // ~1.154
  });

  it('flags tests weeks apart as loose and gives a range rather than a point', () => {
    const p = runProfile(TREY, { asOf: '2026-10-21' });
    expect(p.exponent.source).toBe('loose');
    const { range, timeSec } = p.predict(2 * MI);
    expect(range[0]).toBeLessThan(timeSec);
    expect(range[1]).toBeGreaterThan(timeSec);
  });

  it('drops efforts outside the fit window from the exponent', () => {
    const p = runProfile(TREY, { asOf: '2026-10-21' });
    expect(p.exponent.points.map((x) => x.date)).not.toContain('2026-08-01');
  });

  it('reports a stale model when the newest test is old', () => {
    expect(runProfile(TREY, { asOf: '2026-12-15' }).stale).toBe(true);
    expect(runProfile(TREY, { asOf: '2026-10-21' }).stale).toBe(false);
  });

  it('returns null with no max efforts at all', () => {
    expect(runProfile([{ activityType: 'run', status: 'completed', date: '2026-10-01', distanceM: 5000, durationSec: 1800, rpe: 4 }])).toBeNull();
  });
});

describe('zone paces come off the personal curve', () => {
  it('a speed-limited runner gets slower T than their mile alone implies', () => {
    const p = runProfile([...TREY, tt('2026-10-22', 2 * MI, 1010)], { asOf: '2026-10-22' });
    const fromMileAlone = trainingPaces(vdotFromRace(MI, 454));
    expect(p.paces.T).toBeGreaterThan(fromMileAlone.T);
    expect(p.paces.R).toBeCloseTo(fromMileAlone.R, 6); // R is mile pace, and the mile is real
  });

  it('never extrapolates a zone past the longest tested distance', () => {
    const p = runProfile([...TREY, tt('2026-10-22', 2 * MI, 1010)], { asOf: '2026-10-22' });
    expect(p.zoneAnchors.T.distanceM).toBeCloseTo(2 * MI, 6);
    expect(p.zoneAnchors.T.extrapolationCapped).toBe(true);
    expect(p.zoneAnchors.E).toBe(p.zoneAnchors.I);
  });

  it('keeps zone order R < I < T < M < E for any plausible runner', () => {
    for (const k of [1.02, 1.06, 1.12, 1.18]) {
      const p = runProfile([tt('2026-10-01', MI, 420), tt('2026-10-03', 5000, Math.round(420 * Math.pow(5000 / MI, k)))], { asOf: '2026-10-04' });
      expect(p.paces.R).toBeLessThan(p.paces.I);
      expect(p.paces.I).toBeLessThan(p.paces.T);
      expect(p.paces.T).toBeLessThan(p.paces.M);
      expect(p.paces.M).toBeLessThan(p.paces.E[1]);
    }
  });

  it('an average runner (k≈1.06) lands within a few sec/mi of plain Daniels', () => {
    const p = runProfile([tt('2026-10-01', 5000, 1200), tt('2026-10-03', 10000, Math.round(1200 * Math.pow(2, 1.06)))], { asOf: '2026-10-04' });
    const d = trainingPaces(vdotFromRace(5000, 1200));
    expect(Math.abs(p.paces.I - d.I) * MI).toBeLessThan(8);
    expect(Math.abs(p.paces.R - d.R) * MI).toBeLessThan(12);
  });
});

describe('personalExponent', () => {
  it('falls back to the population value with one distance and says so', () => {
    const e = personalExponent(maxEfforts([tt('2026-10-01', MI, 454)]));
    expect(e.source).toBe('default');
    expect(e.k).toBe(DEFAULT_EXPONENT);
    expect(e.band[0]).toBeLessThan(e.band[1]);
  });

  it('clamps a fit outside physiology and marks it', () => {
    const e = personalExponent(maxEfforts([tt('2026-10-01', MI, 400), tt('2026-10-02', 2 * MI, 1200)]));
    expect(e.clamped).toBe(true);
    expect(e.k).toBe(1.2);
  });

  it('ignores an older effort at a distance that has a newer one', () => {
    const e = personalExponent(maxEfforts([tt('2026-10-01', 2 * MI, 1300), tt('2026-10-05', 2 * MI, 1000), tt('2026-10-06', MI, 460)]));
    expect(e.points.find((p) => p.distanceM > 3000).timeSec).toBe(1000);
  });
});

describe('helpers', () => {
  it('slowdownPerDoubling reads as the pace cost of doubling distance', () => {
    expect(slowdownPerDoubling(1.06)).toBeCloseTo(0.0425, 3);
    expect(slowdownPerDoubling(1)).toBe(0);
  });
  it('translateEffort uses the given exponent', () => {
    expect(translateEffort(MI, 454, 2 * MI, 1.15)).toBeCloseTo(454 * Math.pow(2, 1.15), 6);
  });
});
