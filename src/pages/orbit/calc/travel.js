// Orbit travel estimator — pure local geometry (haversine great-circle
// distance) plus a static rush-hour multiplier, used for schedule-fit checks
// and errand-batching. Real predictive-traffic routing (Google/Maps API) is a
// later phase per the scheduler spec; this module is deliberately offline math
// only, no imports, so it can be unit-tested and reasoned about in isolation.

const EARTH_RADIUS_MILES = 3958.8;

const DEFAULT_ROAD_OPTS = { avgSpeedMph: 30, roadFactor: 1.3 };
const DEFAULT_RUSH_CFG = { windows: [[7, 9], [16, 18]], factor: 1.35 };

function hasCoords(p) {
  return !!p && typeof p.lat === 'number' && !Number.isNaN(p.lat) && typeof p.lng === 'number' && !Number.isNaN(p.lng);
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineMiles(a, b) {
  if (!hasCoords(a) || !hasCoords(b)) return null;
  if (a.lat === b.lat && a.lng === b.lng) return 0; // skip trig for identical points — avoids float noise near 0

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function roadMinutes(miles, opts = {}) {
  if (miles === null || miles === undefined) return null; // no distance -> no estimate, not zero
  const { avgSpeedMph, roadFactor } = { ...DEFAULT_ROAD_OPTS, ...opts };
  return ((miles * roadFactor) / avgSpeedMph) * 60;
}

export function rushHourMultiplier(hourOfDay, cfg = {}) {
  const { windows, factor } = { ...DEFAULT_RUSH_CFG, ...cfg };
  const inWindow = windows.some(([start, end]) => hourOfDay >= start && hourOfDay < end); // [start, end) so the top of the hour clears the window
  return inWindow ? factor : 1.0;
}

export function travelMinutes(fromPlace, toPlace, hourOfDay, opts = {}) {
  const miles = haversineMiles(fromPlace, toPlace);
  if (miles === null) return null; // propagate "can't estimate" rather than guessing
  return roadMinutes(miles, opts) * rushHourMultiplier(hourOfDay, opts.rush);
}

// Greedy single-seed clustering for errand-batching: walk items in order,
// join the first cluster whose original seed is close enough, else become a
// new seed. Deliberately simple (no re-centering/merging) so the result is
// deterministic and stable as tasks are added one at a time.
export function clusterByProximity(items, radiusMiles) {
  const clusters = []; // { seed, ids }

  for (const item of items) {
    if (!hasCoords(item)) {
      clusters.push({ seed: item, ids: [item.id] }); // no coords -> can never be grouped, always its own singleton
      continue;
    }

    const home = clusters.find((c) => hasCoords(c.seed) && haversineMiles(c.seed, item) <= radiusMiles);
    if (home) {
      home.ids.push(item.id);
    } else {
      clusters.push({ seed: item, ids: [item.id] });
    }
  }

  return clusters.map((c) => c.ids);
}
