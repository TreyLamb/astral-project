// Orbit weather + geocoding network layer (Guidelines_Scheduler.md §6/§7/§9).
// Free, NO API KEY: Open-Meteo (forecast) and Nominatim/OpenStreetMap
// (geocoding). Both send permissive CORS headers so these run straight from the
// browser. Kept OUT of calc/weather.js so the shaping/lookup logic stays pure
// and unit-testable; this module is the only part that touches the network.
import { shapeOpenMeteoForecast } from './calc/weather';

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// Geocode a US ZIP → { lat, lng } via Nominatim. Called ONCE per home ZIP and
// cached by the caller (§7: never re-geocode a known place). Returns null on
// any failure so the scheduler degrades gracefully (weather simply stays off).
export async function geocodeZip(zip) {
  if (!zip) return null;
  try {
    const url = `${NOMINATIM}?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const arr = await res.json();
    const hit = Array.isArray(arr) && arr[0];
    if (!hit) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon) };
  } catch {
    return null;
  }
}

// Geocode a free-text place name → { lat, lng } (§7 places DB). Same caching
// contract: resolve once, store in the places DB, never re-hit for a known place.
export async function geocodePlaceName(name) {
  if (!name) return null;
  try {
    const url = `${NOMINATIM}?q=${encodeURIComponent(name)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const arr = await res.json();
    const hit = Array.isArray(arr) && arr[0];
    if (!hit) return null;
    return { lat: Number(hit.lat), lng: Number(hit.lon) };
  } catch {
    return null;
  }
}

// Fetch the hourly forecast for a location and shape it into the cache rows the
// solver reads (one row per date). forecast_days maxes at 16 on Open-Meteo —
// plenty for any realistic planning horizon. Fahrenheit to match the heat
// multiplier's tempF assumptions. Returns [] on failure (scheduler runs without
// weather constraints rather than blocking).
export async function fetchForecast(lat, lng, locationId = null) {
  if (lat == null || lng == null) return [];
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      hourly: 'temperature_2m,precipitation_probability',
      temperature_unit: 'fahrenheit',
      forecast_days: '16',
      timezone: 'auto',
    });
    const res = await fetch(`${OPEN_METEO}?${params.toString()}`);
    if (!res.ok) return [];
    const json = await res.json();
    return shapeOpenMeteoForecast(json, locationId);
  } catch {
    return [];
  }
}
