import { describe, it, expect } from 'vitest';
import {
  shapeOpenMeteoForecast, weatherLookup, dateIsRainy, outdoorRescheduleFlags,
} from './weather';

const OPEN_METEO = {
  hourly: {
    time: ['2026-07-27T08:00', '2026-07-27T09:00', '2026-07-28T08:00'],
    temperature_2m: [72, 78, 65],
    precipitation_probability: [10, 90, 0],
  },
};

describe('shapeOpenMeteoForecast', () => {
  it('folds parallel arrays into per-date hourly rows', () => {
    const out = shapeOpenMeteoForecast(OPEN_METEO, 'home');
    expect(out).toHaveLength(2);
    const d27 = out.find((e) => e.date === '2026-07-27');
    expect(d27.locationId).toBe('home');
    expect(d27.hourly).toEqual([
      { hour: 8, tempF: 72, precipProb: 10 },
      { hour: 9, tempF: 78, precipProb: 90 },
    ]);
  });

  it('returns [] for a malformed response', () => {
    expect(shapeOpenMeteoForecast({})).toEqual([]);
    expect(shapeOpenMeteoForecast(null)).toEqual([]);
  });
});

describe('weatherLookup', () => {
  const cache = shapeOpenMeteoForecast(OPEN_METEO, 'home');
  it('finds an entry by date', () => {
    expect(weatherLookup(cache, 'home')('2026-07-27').date).toBe('2026-07-27');
  });
  it('falls back to a location-agnostic entry for the same date', () => {
    const generic = [{ date: '2026-07-27', locationId: null, hourly: [] }];
    expect(weatherLookup(generic, 'somewhere')('2026-07-27')).not.toBeNull();
  });
  it('returns null when the date is absent', () => {
    expect(weatherLookup(cache, 'home')('2026-08-01')).toBeNull();
  });
});

describe('dateIsRainy', () => {
  const cache = shapeOpenMeteoForecast(OPEN_METEO, 'home');
  it('is true when a daytime hour is over the threshold', () => {
    expect(dateIsRainy(weatherLookup(cache)('2026-07-27'), 50)).toBe(true);
  });
  it('is false on a clear day', () => {
    expect(dateIsRainy(weatherLookup(cache)('2026-07-28'), 50)).toBe(false);
  });
  it('ignores overnight rain outside daytime hours', () => {
    const nightRain = { hourly: [{ hour: 3, precipProb: 100 }] };
    expect(dateIsRainy(nightRain, 50)).toBe(false);
  });
});

describe('outdoorRescheduleFlags', () => {
  const cache = shapeOpenMeteoForecast(OPEN_METEO, 'home');
  it('flags a scheduled outdoor task on a newly-rainy day', () => {
    const tasks = [
      { id: 'paint', status: 'todo', scheduledDate: '2026-07-27', indoorOutdoor: 'outdoor' },
      { id: 'desk', status: 'todo', scheduledDate: '2026-07-27', indoorOutdoor: 'indoor' },
      { id: 'clear', status: 'todo', scheduledDate: '2026-07-28', weatherSensitive: true },
      { id: 'unscheduled', status: 'todo', scheduledDate: null, indoorOutdoor: 'outdoor' },
      { id: 'done', status: 'done', scheduledDate: '2026-07-27', indoorOutdoor: 'outdoor' },
    ];
    const flags = outdoorRescheduleFlags(tasks, cache, 50);
    expect(flags.map((f) => f.taskId)).toEqual(['paint']);
  });
});
