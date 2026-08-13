// Marker visibility: three tiers, highest wins.
//
//   1. route corridor  — markers within `radius` of the drawn route
//   2. user zone       — markers inside a drawn shape
//   3. map-wide        — everything else
//
// Each tier says one of three things:
//
//   inherit  defer to the tier below (a zone that only exists to be labelled)
//   only     show ONLY these categories here, ignoring wider filters ("minimal")
//   all      show everything here, ignoring wider filters ("maximal")
//
// Worked example, which is also a test case:
//   map-wide shows A B C D E
//   a zone set to `only [A B C]`
//   a route set to `only [A]` within 40 m
// =>  inside the corridor            A
//     inside the zone, outside it    A B C
//     everywhere else                A B C D E
//
// Resolution is per marker and returns WHICH tier decided, so the UI can
// explain why something is hidden rather than leaving the user guessing.

import {
  pointInPolygon, distanceToPolyline, ringBounds, inBounds,
} from './eftMapGeometry';

export const ZONE_MODES = [
  { value: 'inherit', label: 'Inherit', hint: 'Use the map-wide filters here' },
  { value: 'only', label: 'Minimal', hint: 'Show ONLY the categories picked for this area' },
  { value: 'all', label: 'Maximal', hint: 'Show everything here, ignoring map-wide filters' },
];

const asSet = (v) => (v instanceof Set ? v : new Set(v || []));

function applyRule(rule, catId, globalVisible) {
  if (!rule || rule.mode === 'inherit') return globalVisible.has(catId);
  if (rule.mode === 'all') return true;
  return asSet(rule.categories).has(catId);
}

/**
 * Precomputes the per-zone bounding boxes and the route polyline once, so the
 * per-marker loop stays a handful of arithmetic ops. With ~900 markers and a
 * few zones this runs comfortably inside a single render.
 */
export function makeResolver({ globalCategories, zones, route }) {
  const globalVisible = asSet(globalCategories);

  // Reversed so the LAST zone in the list is tested first: the list is shown
  // top-down in the UI and the topmost zone wins an overlap, which matches how
  // layers behave everywhere else.
  const activeZones = [...(zones || [])]
    .filter((z) => z.ring?.length >= 3 && !z.hidden)
    .reverse()
    .map((z) => ({ ...z, bounds: ringBounds(z.ring) }));

  const corridor = route?.polyline?.length && route.radius > 0
    ? { polyline: route.polyline, radius: route.radius, rule: route.rule }
    : null;

  return function resolve(point, catId) {
    if (corridor) {
      const hit = distanceToPolyline(point, corridor.polyline);
      if (hit && hit.distance <= corridor.radius) {
        return {
          visible: applyRule(corridor.rule, catId, globalVisible),
          scope: 'route',
          along: hit.along,
          offRoute: hit.distance,
        };
      }
    }

    for (const zone of activeZones) {
      if (!inBounds(point, zone.bounds)) continue;
      if (!pointInPolygon(point, zone.ring)) continue;
      return {
        visible: applyRule(zone.rule, catId, globalVisible),
        scope: 'zone',
        zoneId: zone.id,
        zoneName: zone.name,
      };
    }

    return { visible: globalVisible.has(catId), scope: 'global' };
  };
}

/**
 * Runs every marker through the resolver.
 *
 * Hidden markers are counted rather than returned — the counts drive the "42
 * hidden by this zone" hints that stop the nested filters from feeling like
 * things are silently disappearing.
 */
export function resolveMarkers(markers, opts) {
  const resolve = makeResolver(opts);
  const visible = [];
  const hidden = { total: 0, byScope: { route: 0, zone: 0, global: 0 } };

  for (const m of markers || []) {
    const point = [m.y, m.x];
    const r = resolve(point, m.cat);
    if (r.visible) {
      visible.push(r.scope === 'route' ? { ...m, along: r.along, offRoute: r.offRoute } : m);
    } else {
      hidden.total += 1;
      hidden.byScope[r.scope] += 1;
    }
  }

  return { visible, hidden };
}

/**
 * Everything the route passes, ordered by when you reach it rather than by how
 * close it is. This is the part neither the wiki nor mapgenie offers.
 *
 * `metresPerUnit` converts map units to in-game metres; when the map has no
 * transform it stays null and the caller must present distances as unitless
 * rather than inventing metres.
 */
export function routeManifest(markers, opts, { metresPerUnit = null, speeds = [] } = {}) {
  const { visible } = resolveMarkers(markers, opts);
  const onRoute = visible
    .filter((m) => m.along !== undefined)
    .sort((a, b) => a.along - b.along);

  const toM = (u) => (metresPerUnit == null ? null : u * metresPerUnit);

  const rows = onRoute.map((m) => ({
    ...m,
    alongMetres: toM(m.along),
    offRouteMetres: toM(m.offRoute),
  }));

  const totalUnits = opts.route?.polyline?.length
    ? opts.route.polyline.reduce((sum, p, i, arr) => (
      i ? sum + Math.hypot(p[0] - arr[i - 1][0], p[1] - arr[i - 1][1]) : 0
    ), 0)
    : 0;
  const totalMetres = toM(totalUnits);

  return {
    rows,
    totalUnits,
    totalMetres,
    // Speeds come straight from the source's own movement table, so the
    // estimates match what the game actually does rather than a guess.
    times: totalMetres == null ? [] : speeds.map((s) => ({
      name: s.name,
      seconds: s.speedMps ? totalMetres / s.speedMps : null,
    })),
  };
}

/** Category ids present in a set of markers, for "only what's actually here". */
export function categoriesPresent(markers) {
  return new Set((markers || []).map((m) => m.cat));
}
