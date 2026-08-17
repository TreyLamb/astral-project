import { describe, it, expect } from 'vitest';

import { metresPerSourceUnit } from './eftMapProject';
import { routePolyline } from './useMapDrawing';
import { routeManifest } from './eftMapFilters';
import woods from './data/markers/woods.json';
import customs from './data/markers/customs.json';
import sprites from './data/markerSprites.json';
import {
  labelStyle, autoLabel, textSizeForZoom, FLOOR_SCALE, hasPin, hasText,
} from './eftMapLabels';

// These lock in the parts that come from the source rather than from us. If a
// re-fetch changes the shape of mapgenie's payload, the failure should land
// here rather than as a silently wrong distance or a map of blank pins.

describe('mapgenie distance scale', () => {
  it('reduces their calculateLineDistance to a constant metres-per-unit', () => {
    // Their formula: sum(euclid(a*1e6, b*1e6)) / 1e6 * (1e5 / scale).
    // The 1e6 cancels, leaving 1e5 / scale.
    expect(metresPerSourceUnit({ distanceScale: 56, useHaversine: false }))
      .toBeCloseTo(100000 / 56, 6);
  });

  it('agrees with a direct port of their loop', () => {
    const scale = woods.distanceScale;
    const pts = [[0.70, -0.84], [0.75, -0.80], [0.75, -0.70]];

    // Direct transcription of mapgenie's non-haversine branch.
    const S = 1e6;
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      acc += Math.hypot(
        pts[i][0] * S - pts[i + 1][0] * S,
        pts[i][1] * S - pts[i + 1][1] * S,
      );
    }
    const theirs = Math.round((acc / S) * (1e5 / scale));

    const perUnit = metresPerSourceUnit(woods);
    let units = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      units += Math.hypot(pts[i][0] - pts[i + 1][0], pts[i][1] - pts[i + 1][1]);
    }
    expect(Math.round(units * perUnit)).toBe(theirs);
  });

  it('refuses to guess when the map declares haversine', () => {
    expect(metresPerSourceUnit({ distanceScale: 56, useHaversine: true })).toBeNull();
    expect(metresPerSourceUnit({ distanceScale: 0, useHaversine: false })).toBeNull();
    expect(metresPerSourceUnit(null)).toBeNull();
  });

  it('puts Woods in the right ballpark for a real Tarkov map', () => {
    const perUnit = metresPerSourceUnit(woods);
    const lats = woods.markers.map((m) => m.lat);
    const span = (Math.max(...lats) - Math.min(...lats)) * perUnit;
    expect(span).toBeGreaterThan(1000);
    expect(span).toBeLessThan(4000);
  });
});

describe('committed source data', () => {
  it('has markers and categories for both built maps', () => {
    for (const map of [woods, customs]) {
      expect(map.markers.length).toBeGreaterThan(500);
      expect(map.categories.length).toBeGreaterThan(20);
      expect(map.orphanCategories).toEqual([]);
    }
  });

  it('serves tiles from the /games/ path that made them look locked', () => {
    for (const map of [woods, customs]) {
      expect(map.tiles.url).toMatch(/^https:\/\/tiles\.mapgenie\.io\/games\/tarkov\//);
      expect(map.tiles.url).toContain('{z}/{x}/{y}');
    }
  });

  it('has a sprite rectangle for every category the source ships art for', () => {
    const missing = new Set();
    for (const map of [woods, customs]) {
      for (const c of map.categories) {
        if (!sprites.positions[c.id]) missing.add(c.title);
      }
    }
    // 'Black Division' is a category mapgenie added without adding it to the
    // sprite sheet — its one marker is a "help us find these" prompt. Pinned so
    // a genuinely new gap fails here rather than rendering as a bare dot in
    // silence.
    expect([...missing]).toEqual(['Black Division']);
  });

  it('has an icon-font glyph for every category icon except the one the source omits', () => {
    const missing = new Set();
    for (const map of [woods, customs]) {
      for (const c of map.categories) {
        if (c.icon && !sprites.glyphs[c.icon]) missing.add(c.icon);
      }
    }
    // `map_edit` is a real category with real markers, but mapgenie's own icon
    // font v3 ships no glyph for it. Pinned rather than ignored so a NEW gap
    // fails here instead of quietly rendering blank rows.
    expect([...missing].sort()).toEqual(['black_division', 'map_edit']);
  });

  it('always leaves something to draw a category with', () => {
    // Art can be missing (see above), so the guarantee is weaker but real:
    // every category has EITHER source art or a colour, and the renderer falls
    // back to a coloured dot / swatch. Nothing is ever invisible.
    for (const map of [woods, customs]) {
      for (const c of map.categories) {
        const drawable = sprites.glyphs[c.icon] || sprites.positions[c.id] || c.color;
        expect(drawable).toBeTruthy();
      }
    }
  });

  it('keeps sprite rectangles inside the sheet', () => {
    for (const p of Object.values(sprites.positions)) {
      expect(p.x + p.width).toBeLessThanOrEqual(sprites.sheetWidth);
      expect(p.y + p.height).toBeLessThanOrEqual(sprites.sheetHeight);
    }
  });
});

describe('route geometry', () => {
  const wp = (y, x, bulge = 0) => ({ y, x, bulge });

  it('draws straight by default', () => {
    const pts = routePolyline({ waypoints: [wp(0, 0), wp(0, 10), wp(5, 10)] });
    expect(pts).toEqual([[0, 0], [0, 10], [5, 10]]);
  });

  it('bends only the segment that was drawn with C held', () => {
    const route = { waypoints: [wp(0, 0), wp(0, 10, 0.4), wp(5, 10)] };
    const pts = routePolyline(route);
    // The curved segment is sampled, the straight one is not.
    expect(pts.length).toBeGreaterThan(3);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[pts.length - 1]).toEqual([5, 10]);
    // A midpoint of the arc must leave the chord.
    const mid = pts[Math.floor(pts.length / 3)];
    expect(Math.abs(mid[0])).toBeGreaterThan(0.01);
  });

  it('flips the arc to the other side when the bulge sign flips', () => {
    const up = routePolyline({ waypoints: [wp(0, 0), wp(0, 10, 0.4)] });
    const down = routePolyline({ waypoints: [wp(0, 0), wp(0, 10, -0.4)] });
    const midUp = up[Math.floor(up.length / 2)][0];
    const midDown = down[Math.floor(down.length / 2)][0];
    expect(Math.sign(midUp)).toBe(-Math.sign(midDown));
    expect(midUp).not.toBe(0);
  });

  it('closes a loop back onto the original waypoint, not a copy of it', () => {
    const waypoints = [wp(0, 0), wp(0, 10), wp(10, 10)];
    const open = routePolyline({ waypoints, closed: false });
    const closed = routePolyline({ waypoints, closed: true });

    expect(open[open.length - 1]).toEqual([10, 10]);
    // Closing adds exactly one point, and it is the ORIGINAL first vertex.
    expect(closed.length).toBe(open.length + 1);
    expect(closed[closed.length - 1]).toEqual([0, 0]);
    expect(closed[closed.length - 1]).toEqual(closed[0]);
    // And the waypoint list itself never grew — no duplicate vertex.
    expect(waypoints).toHaveLength(3);
  });

  it('will not close a two-point route', () => {
    const pts = routePolyline({ waypoints: [wp(0, 0), wp(0, 10)], closed: true });
    expect(pts).toEqual([[0, 0], [0, 10]]);
  });
});

describe('corridor manifest against real Woods data', () => {
  it('orders what you pass by when you pass it, in real metres', () => {
    const perUnit = metresPerSourceUnit(woods);
    const placed = woods.markers.map((m) => ({ ...m, y: m.lat, x: m.lng }));
    const all = new Set(woods.categories.map((c) => c.id));

    // A line straight across the DENSE middle of the marker cloud. The bbox
    // centre is not usable: mapgenie ships a stray 'Black Division' prompt
    // marker far outside the playable area, which drags the bounding box into
    // empty space and would put this route where nothing is.
    const pct = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor((sorted.length - 1) * p)];
    };
    const lats = placed.map((m) => m.y);
    const lngs = placed.map((m) => m.x);
    const midLat = pct(lats, 0.5);
    const polyline = [[midLat, pct(lngs, 0.05)], [midLat, pct(lngs, 0.95)]];

    const manifest = routeManifest(
      placed,
      { globalCategories: all, zones: [], route: { polyline, radius: 50 / perUnit, rule: { mode: 'inherit' } } },
      { metresPerUnit: perUnit, speeds: woods.speeds },
    );

    expect(manifest.rows.length).toBeGreaterThan(0);
    for (let i = 1; i < manifest.rows.length; i++) {
      expect(manifest.rows[i].alongMetres).toBeGreaterThanOrEqual(manifest.rows[i - 1].alongMetres);
    }
    // Nothing in the corridor may be further off the line than its radius.
    for (const r of manifest.rows) expect(r.offRouteMetres).toBeLessThanOrEqual(50.001);

    expect(manifest.totalMetres).toBeGreaterThan(500);
    expect(manifest.times.length).toBe(woods.speeds.length);
    for (const t of manifest.times) expect(t.seconds).toBeGreaterThan(0);
  });
});

describe('label styling, ported from mapgenie map.js', () => {
  const cat = (id, displayType, title = 'X') => ({ id, displayType, title });

  it('draws Location as text with no pin', () => {
    const c = woods.categories.find((x) => x.title === 'Location');
    expect(c.displayType).toBe('text');
    expect(hasPin(c.displayType)).toBe(false);
    expect(hasText(c.displayType)).toBe(true);
  });

  it('draws Extraction as both a pin and text', () => {
    const c = woods.categories.find((x) => x.title === 'Extraction');
    expect(c.displayType).toBe('text|marker');
    expect(hasPin(c.displayType)).toBe(true);
    expect(hasText(c.displayType)).toBe(true);
  });

  it('leaves loot as a pin with no text', () => {
    const c = woods.categories.find((x) => x.title === 'Cache');
    expect(hasPin(c.displayType)).toBe(true);
    expect(labelStyle({ title: 'Cache' }, c)).toBeNull();
  });

  it('uppercases extracts and strips the tag into a colour', () => {
    const ex = cat(954, 'text|marker', 'Extraction');
    expect(labelStyle({ title: 'Eastern Rocks [SCAV]' }, ex))
      .toMatchObject({ text: 'EASTERN ROCKS', color: '#FFAA00' });
    expect(labelStyle({ title: 'UN Roadblock [ALL]' }, ex))
      .toMatchObject({ text: 'UN ROADBLOCK', color: '#62CEFE' });
    expect(labelStyle({ title: 'Factory Gate [CO-OP]' }, ex))
      .toMatchObject({ text: 'FACTORY GATE', color: '#62CEFE' });
    expect(labelStyle({ title: 'Spawn [PMC]' }, ex))
      .toMatchObject({ text: 'SPAWN', color: '#00E99B' });
  });

  it('gives Transit its own colour regardless of tag', () => {
    expect(labelStyle({ title: 'Transit to Streets [ALL]' }, cat(4744, 'text|marker')))
      .toMatchObject({ color: '#FEF467' });
  });

  it('leaves plain place names alone', () => {
    expect(labelStyle({ title: 'Sawmill' }, cat(952, 'text')))
      .toMatchObject({ text: 'Sawmill', color: '#ffffff' });
  });

  // Deliberately NOT the source's ramp any more. Theirs grew 12px -> 18px from
  // zoom 10 to 16 while the map itself doubled every level, so a place name
  // withered against the terrain it was naming.
  describe('place-name sizing', () => {
    const sizes = [12, 14, 18];

    it('holds one steady size while you are still orienting', () => {
      for (const z of [8, 9, 10, 11, 12, 13]) {
        expect(textSizeForZoom(z, sizes)).toBe(14);
      }
    });

    it('shrinks once past the hold, never growing', () => {
      const a = textSizeForZoom(13.5, sizes);
      const b = textSizeForZoom(14, sizes);
      const c = textSizeForZoom(14.5, sizes);
      expect(a).toBeLessThan(14);
      expect(b).toBeLessThan(a);
      expect(c).toBeLessThan(b);
    });

    it('disappears entirely once you are too far in', () => {
      expect(textSizeForZoom(15, sizes)).toBe(0);
      expect(textSizeForZoom(16, sizes)).toBe(0);
      expect(textSizeForZoom(20, sizes)).toBe(0);
    });

    it('never shrinks below the floor before it vanishes', () => {
      for (let z = 13; z < 15; z += 0.1) {
        expect(textSizeForZoom(z, sizes)).toBeGreaterThanOrEqual(12 * FLOOR_SCALE - 1e-9);
      }
    });

    it('bottoms out 15% above the original floor, so the last visible zoom reads', () => {
      // The size names settle at just before they vanish.
      const last = textSizeForZoom(15 - 1e-6, sizes);
      expect(last).toBeCloseTo(12 * 0.7 * 1.15, 4);
      expect(last / (12 * 0.7)).toBeCloseTo(1.15, 4);
    });

    it('is still continuous at the hold — no jump when it starts shrinking', () => {
      expect(textSizeForZoom(13 + 1e-6, sizes)).toBeCloseTo(textSizeForZoom(13, sizes), 3);
    });

    it('falls back to the base size for a nonsense zoom', () => {
      expect(textSizeForZoom(undefined, sizes)).toBe(14);
      expect(textSizeForZoom(NaN, sizes)).toBe(14);
    });

    it('survives a missing sizes array', () => {
      expect(textSizeForZoom(10, undefined)).toBeGreaterThan(0);
    });
  });

  it('truncates a quest objective so it cannot stripe the map', () => {
    const long = "Eliminate 15 PMC's without using any armor or helmets on Woods";
    const label = autoLabel({ title: long }, cat(955, 'marker'));
    expect(label.text.length).toBeLessThanOrEqual(34);
    expect(label.text.endsWith('…')).toBe(true);
    // Short titles are untouched.
    expect(autoLabel({ title: 'Cache' }, cat(948, 'marker')).text).toBe('Cache');
  });
});
