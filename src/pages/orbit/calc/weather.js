// Orbit weather helpers (guidelinesScheduler.md §6) — pure shaping + lookup +
// the "did a scheduled outdoor task's day turn rainy" re-check. The actual
// Open-Meteo / Nominatim network calls live in orbitWeatherService.js; this
// stays pure so it's unit-testable. Rain is a HARD constraint for outdoor /
// weather-sensitive tasks; temperature feeds the heat multiplier in energy.js.

// Open-Meteo hourly response comes as parallel arrays (time[], temperature_2m[],
// precipitation_probability[]). Fold them into per-date hourly rows the solver
// reads: { date, hourly:[{hour, tempF, precipProb}] }. timezone=auto means the
// time strings are already local, so date/hour slice straight off the string.
export function shapeOpenMeteoForecast(json, locationId = null) {
  const time = json?.hourly?.time;
  if (!Array.isArray(time)) return [];
  const temps = json.hourly.temperature_2m || [];
  const precip = json.hourly.precipitation_probability || [];

  const byDate = new Map();
  time.forEach((ts, i) => {
    const date = ts.slice(0, 10);
    const hour = Number(ts.slice(11, 13));
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push({
      hour,
      tempF: temps[i] ?? null,
      precipProb: precip[i] ?? null,
    });
  });

  return [...byDate.entries()].map(([date, hourly]) => ({
    date,
    locationId,
    hourly,
    source: 'open-meteo',
    fetchedAt: Date.now(),
  }));
}

// Build the (dateISO) => entry|null accessor the solver's `weatherFor` expects,
// from a cached weather array. Prefers a location-specific entry, falling back
// to a location-agnostic one for the same date.
export function weatherLookup(weatherCache, locationId = null) {
  const cache = Array.isArray(weatherCache) ? weatherCache : [];
  return (dateISO) => {
    const exact = cache.find((w) => w.date === dateISO && (w.locationId ?? null) === (locationId ?? null));
    if (exact) return exact;
    return cache.find((w) => w.date === dateISO) || null;
  };
}

// Does this date have rain at/over the threshold during daytime hours (07-19)?
// Used both by the solver (avoid) and the re-check below (flag).
export function dateIsRainy(entry, threshold = 50, dayStartHour = 7, dayEndHour = 19) {
  if (!entry || !Array.isArray(entry.hourly)) return false;
  return entry.hourly.some((h) => h.hour >= dayStartHour && h.hour < dayEndHour && (h.precipProb ?? 0) >= threshold);
}

// The §6 re-check: after a fresh daily fetch, find already-scheduled outdoor /
// weather-sensitive tasks whose scheduled day is now rainy, so the UI can
// propose a reschedule instead of silently leaving them in the rain.
export function outdoorRescheduleFlags(tasks, weatherCache, threshold = 50) {
  const lookup = weatherLookup(weatherCache);
  const flags = [];
  for (const t of tasks) {
    if (t.status === 'done' || t.status === 'killed') continue;
    if (!t.scheduledDate) continue;
    const isOutdoor = t.indoorOutdoor === 'outdoor' || !!t.weatherSensitive;
    if (!isOutdoor) continue;
    if (dateIsRainy(lookup(t.scheduledDate), threshold)) {
      flags.push({ taskId: t.id, date: t.scheduledDate, reason: 'rain forecast — outdoor task exposed' });
    }
  }
  return flags;
}
