// Pure "where I am" base-location resolution (Guidelines_Scheduler.md §7/§9).
// The fitness calendar tags each day with a base (Orem, Paris UT, Hawaii, …);
// this module turns those tags into the concrete origin/coords/weather-
// locationId that the scheduler and weather layer consume. No network, no
// React — geocoding + forecast fetching live in orbitContext/
// orbitWeatherService; this is the deterministic, unit-testable glue so the
// whole travel/weather/geo stack reasons from the day's actual base.

// Synthetic weather-cache locationId for the global home-ZIP forecast — the id
// refreshWeather() already stores/reads the home forecast under. Untagged days
// (and the home base itself) resolve here so existing weather behavior is
// preserved until a distinct away-base is actually tagged onto a day.
export const HOME_LOCATION_ID = 'home';

export function basesById(bases = []) {
  return new Map((bases || []).map((b) => [b.id, b]));
}

// The default base for days with no explicit tag: the one flagged isHome.
export function homeBase(bases = []) {
  return (bases || []).find((b) => b && b.isHome) || null;
}

// The base object governing a given ISO date: an explicit day tag wins, else the
// home base, else null (→ callers fall back to the global home ZIP / no base).
export function baseForDate(iso, dayLocations = {}, bases = []) {
  const map = basesById(bases);
  const id = dayLocations && dayLocations[iso];
  if (id && map.has(id)) return map.get(id);
  return homeBase(bases);
}

function coordsOf(base) {
  return base && base.lat != null && base.lng != null ? { lat: base.lat, lng: base.lng } : null;
}

// A (iso) → {lat,lng}|null resolver for the scheduler's per-day travel origin.
// Yields the day's base coords when it has them, else the global home coords —
// so behavior is byte-identical to before until bases are set up + geocoded.
export function makeHomePlaceForDate(dayLocations = {}, bases = [], homePlace = null) {
  return (iso) => coordsOf(baseForDate(iso, dayLocations, bases)) || homePlace;
}

// The weather-cache locationId to read for a given date. Only an explicitly-
// tagged, geocoded, NON-home base reads its own forecast (cached under its id);
// untagged days and the home base itself use the 'home' cache. This keeps the
// existing home-weather path untouched when no away-base is in play, and avoids
// a regression where marking a home base would orphan the cached home forecast.
export function weatherLocationForDate(iso, dayLocations = {}, bases = []) {
  const explicitId = dayLocations && dayLocations[iso];
  if (explicitId) {
    const base = basesById(bases).get(explicitId);
    if (base && !base.isHome && base.lat != null && base.lng != null) return base.id;
  }
  return HOME_LOCATION_ID;
}
