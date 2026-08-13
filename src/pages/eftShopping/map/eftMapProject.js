// Projecting source markers onto a map image.
//
// Marker coordinates come from mapgenie in their own CRS; the base images come
// from tarkov.dev's open SVG/tile maps in a different one. Nothing links the
// two: both maps report the same game-wide `sourceBounds` of [-1.4, 0, 0, 1.4]
// rather than a per-map extent, and blind point-cloud registration against the
// game files' spawn points stalls at ~22 m because mapgenie's spawn markers are
// zone labels, not the game's individual spawn positions.
//
// So a per-map calibration is stored as data. `autoFit` gets close enough to
// see and work with, and `solveFromPairs` makes it exact once someone marks two
// landmarks. Nothing here mutates or caches — calibration is just numbers.
//
// A calibration is a similarity transform, deliberately not a full affine:
// the two coordinate systems differ by scale, flip and offset only, and
// allowing shear/rotation would let a two-point solve distort the map to fit
// noise instead of failing honestly.
//
//   x = lng * sx + tx
//   y = lat * sy + ty

export const IDENTITY = { sx: 1, sy: 1, tx: 0, ty: 0 };

/** Leaflet CRS.Simple wants [y, x]. Everything here speaks that order. */
export function project(cal, lat, lng) {
  return [lat * cal.sy + cal.ty, lng * cal.sx + cal.tx];
}

export function unproject(cal, y, x) {
  return { lat: (y - cal.ty) / cal.sy, lng: (x - cal.tx) / cal.sx };
}

const bbox = (pts, get) => {
  let min = Infinity;
  let max = -Infinity;
  for (const p of pts) {
    const v = get(p);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return [min, max];
};

/**
 * First-guess calibration: stretch the marker cloud's bounding box onto the
 * map image's bounding box.
 *
 * This leans on markers covering roughly the whole playable area, which holds
 * because extracts ring the edges of every map. It is close enough to see and
 * to click on, never close enough to trust for distance work — which is why
 * the UI labels an auto-fitted map as uncalibrated.
 */
export function autoFit(markers, bounds) {
  if (!markers?.length || !bounds) return IDENTITY;

  const [latMin, latMax] = bbox(markers, (m) => m.lat);
  const [lngMin, lngMax] = bbox(markers, (m) => m.lng);
  if (latMax === latMin || lngMax === lngMin) return IDENTITY;

  // Leaflet bounds arrive as [[y1, x1], [y2, x2]] with no guaranteed ordering.
  const [[y1, x1], [y2, x2]] = bounds;
  const yLo = Math.min(y1, y2);
  const yHi = Math.max(y1, y2);
  const xLo = Math.min(x1, x2);
  const xHi = Math.max(x1, x2);

  const sx = (xHi - xLo) / (lngMax - lngMin);
  const sy = (yHi - yLo) / (latMax - latMin);

  return {
    sx,
    tx: xLo - lngMin * sx,
    sy,
    ty: yLo - latMin * sy,
  };
}

/**
 * Exact calibration from landmark pairs: each pair is a source coordinate and
 * the point on the image where it actually belongs.
 *
 * Two pairs give an exact answer; more are least-squared. Axes are solved
 * independently so a flipped axis resolves itself (a negative scale) instead of
 * needing to be declared up front.
 *
 * @param pairs [{ lat, lng, y, x }]
 * @returns {{ok:true, calibration}|{ok:false, error:string}}
 */
export function solveFromPairs(pairs) {
  const clean = (pairs || []).filter((p) => (
    Number.isFinite(p?.lat) && Number.isFinite(p?.lng)
    && Number.isFinite(p?.y) && Number.isFinite(p?.x)
  ));
  if (clean.length < 2) return { ok: false, error: 'Need at least two landmarks.' };

  const fit = (src, dst) => {
    const n = src.length;
    const mean = (a) => a.reduce((s, v) => s + v, 0) / n;
    const ms = mean(src);
    const md = mean(dst);
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (src[i] - ms) * (dst[i] - md);
      den += (src[i] - ms) ** 2;
    }
    if (!den) return null;
    const s = num / den;
    return { s, t: md - ms * s };
  };

  const fx = fit(clean.map((p) => p.lng), clean.map((p) => p.x));
  const fy = fit(clean.map((p) => p.lat), clean.map((p) => p.y));
  if (!fx) return { ok: false, error: 'Landmarks share a longitude — pick two further apart horizontally.' };
  if (!fy) return { ok: false, error: 'Landmarks share a latitude — pick two further apart vertically.' };

  return { ok: true, calibration: { sx: fx.s, tx: fx.t, sy: fy.s, ty: fy.t } };
}

/**
 * Worst and mean residual, in map units, of a calibration against its
 * landmarks. Surfaced in the UI so a bad calibration is visible as a number
 * rather than as markers that look subtly wrong.
 */
export function calibrationError(cal, pairs) {
  if (!cal || !pairs?.length) return null;
  let total = 0;
  let worst = 0;
  for (const p of pairs) {
    const [y, x] = project(cal, p.lat, p.lng);
    const d = Math.hypot(y - p.y, x - p.x);
    total += d;
    if (d > worst) worst = d;
  }
  return { mean: total / pairs.length, worst, count: pairs.length };
}

/**
 * Map units per in-game metre.
 *
 * tarkov.dev's per-map `transform` is [scaleX, offsetX, scaleY, offsetY] taking
 * game-world coordinates (which are metres) to map coordinates, so its scale
 * term IS the conversion. Without a transform, distances can't be reported in
 * metres and callers are expected to say so rather than guess.
 */
export function metresPerMapUnit(mapConfig) {
  const t = mapConfig?.transform;
  if (!t || !t[0]) return null;
  return 1 / Math.abs(t[0]);
}

/**
 * Metres per coordinate unit on the source's own tile basemap.
 *
 * This is not a guess or a fitted constant — it is mapgenie's own
 * `calculateLineDistance`, read out of their map.js and reduced:
 *
 *     for each segment: total += euclid(a.lng*1e6, a.lat*1e6, b.lng*1e6, b.lat*1e6)
 *     metres = total / 1e6 * (1e5 / scale)
 *
 * The 1e6 is a float-precision guard that cancels out, so the whole function
 * collapses to a constant metres-per-degree of `1e5 / scale`. Woods ships
 * scale 56, giving ~1786 m per unit over a 1.4-unit map — about 2500 m across,
 * which matches the in-game size.
 *
 * Their `useHaversine` branch is deliberately NOT ported: it is false for every
 * Tarkov map, and if one ever ships with it true this returns null so the
 * caller reports "no scale" instead of quietly applying the wrong formula.
 */
export function metresPerSourceUnit(data) {
  if (!data || data.useHaversine) return null;
  const scale = Number(data.distanceScale);
  if (!Number.isFinite(scale) || scale <= 0) return null;
  return 1e5 / scale;
}

/** Game-world coordinates for a projected point, when the map supports it. */
export function toGameCoords(mapConfig, y, x) {
  const t = mapConfig?.transform;
  if (!t || !t[0] || !t[2]) return null;
  return { x: (x - t[1]) / t[0], z: (y - t[3]) / t[2] };
}
