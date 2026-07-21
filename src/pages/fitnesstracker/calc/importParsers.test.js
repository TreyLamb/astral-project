import { describe, it, expect } from 'vitest';
import { haversineM, pointsToSummary, workoutsToCSV, csvToWorkouts } from './importParsers';

describe('haversine', () => {
  it('~111.2 km per degree of latitude', () => {
    const d = haversineM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 });
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });
});

describe('pointsToSummary', () => {
  it('uses cumulative distM when present and computes duration', () => {
    const t0 = '2026-07-01T12:00:00Z';
    const points = [
      { lat: 0, lon: 0, ele: 100, time: t0, hr: 140, distM: 0 },
      { lat: 0, lon: 0, ele: 110, time: '2026-07-01T12:05:00Z', hr: 150, distM: 1000 },
      { lat: 0, lon: 0, ele: 105, time: '2026-07-01T12:10:00Z', hr: 160, distM: 2000 },
    ];
    const s = pointsToSummary(points);
    expect(s.distanceM).toBe(2000);
    expect(s.durationSec).toBe(600);
    expect(s.avgHr).toBe(150);
    expect(s.elevationGainM).toBeGreaterThanOrEqual(0);
  });
  it('returns null for too-few points', () => {
    expect(pointsToSummary([{ lat: 0, lon: 0 }])).toBeNull();
  });
});

describe('CSV round-trip', () => {
  it('exports and re-imports a workout losslessly on core fields', () => {
    const w = [{ date: '2026-07-01', time: '07:30', activityType: 'run', status: 'completed', distanceM: 5000, durationSec: 1200, rpe: 6, note: 'felt, good', metrics: { elevationGainM: 40, elevationLossM: 35, avgHr: 155 } }];
    const csv = workoutsToCSV(w);
    const back = csvToWorkouts(csv);
    expect(back).toHaveLength(1);
    expect(back[0].distanceM).toBe(5000);
    expect(back[0].durationSec).toBe(1200);
    expect(back[0].note).toBe('felt, good'); // comma survived quoting
    expect(back[0].metrics.avgHr).toBe(155);
  });
});
