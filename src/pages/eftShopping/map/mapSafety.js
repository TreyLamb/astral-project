// Is this Leaflet map still safe to project through?
//
// WHY THIS IS NOT `if (map)`. Leaflet's `Map.remove()` does `delete this._mapPane` and never
// touches `this._loaded`, so a torn-down map reports `_loaded === true` forever. Anything that
// projects — `containerPointToLatLng`, `latLngToContainerPoint`, `panTo`, `getBounds` — then
// runs `_getMapPanePos()`, which is `getPosition(this._mapPane)`, which is
// `undefined._leaflet_pos`:
//
//   TypeError: Cannot read properties of undefined (reading '_leaflet_pos')
//
// That is the crash Trey reported from production on 2026-09-11, and it is the SECOND time
// this exact message has been chased. The first (2026-08-19) was the other half of the same
// lifecycle: a map constructed but not yet given a view, where `_loaded` was false and the
// `_loaded` check was the right fix. The check was then documented as sufficient. It is not —
// it covers "not started yet" and says nothing about "already finished".
//
//   before setView : _loaded false, _mapPane exists      -> unsafe
//   normal         : _loaded true,  _mapPane positioned  -> safe
//   after remove   : _loaded TRUE,  _mapPane undefined    -> unsafe, and _loaded lies
//
// The root cause is fixed separately — MapCanvas now calls `onReady(null)` as it tears the map
// down, so nobody holds a dead reference in the first place. This stays as the backstop,
// because a stale map can also be captured directly by a closure that never sees the ref.

/**
 * @param {object|null} map a Leaflet map instance, or whatever a stale ref is holding
 * @returns {boolean} true only when projecting through it will not throw
 */
export function isLiveMap(map) {
  return !!(map && map._loaded && map._mapPane);
}

/**
 * Runs `fn(map)` only if the map is live, otherwise returns `fallback`.
 *
 * For the call sites that are one-liners (`panTo`, `getCenter`) and would otherwise each grow
 * their own two-part guard — and get it half right, which is how this bug shipped twice.
 */
export function withMap(map, fn, fallback = undefined) {
  return isLiveMap(map) ? fn(map) : fallback;
}
