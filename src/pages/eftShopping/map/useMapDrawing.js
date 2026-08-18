import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { MapStore } from './eftMapStorage';
import {
  saveRoute as libSave, overwriteSaved, renameSaved, removeSaved,
  savedForMap, routeFromSaved, zonesFromSaved,
} from './eftRouteLibrary';
import {
  boxRing, nearestVertex, nearestSegment, routeToPolyline, arcBetween, dist,
  joinRoutes, bestJoin,
} from './eftMapGeometry';

// The zone + route drawing state machine.
//
// Nothing off the shelf covers this. mapgenie draws with mapbox-gl-draw, which
// is MapLibre-only and has no concept of a curved segment; Leaflet's draw
// plugins are polygon/polyline editors with the same limitation. The two
// behaviours that matter most here — holding C to bend a segment and having a
// click on an existing vertex LINK to it rather than drop a near-duplicate —
// are exactly what those libraries get wrong, so the interaction is ours even
// though the map, tiles, coordinates and artwork are the source's.
//
// Drawing and editing are one mode, not two: with `tool` set to 'route' a click
// places the next point, and with no tool the open route is editable in place —
// drag a vertex to move it, drag a segment to insert one mid-route, shift-click
// to delete. There used to be a `routeMode` switch between the two; nothing
// ever set it, and the only thing it still did was hide the edit hint.

export const TOOLS = {
  none: null,
  zoneRect: 'zone-rect',
  zonePoly: 'zone-poly',
  route: 'route',
};

const ZONE_COLOURS = ['#e0c07a', '#6d8ba3', '#7a9a5c', '#c08b4a', '#b4544a', '#9a86c8'];

// A route has to be findable at a glance against green canopy, tan dirt, grey
// concrete and dark water — the whole map. The old first two were a pale
// yellow that vanished into roads and sand, and a desaturated slate that read
// as water. These are all high-chroma and none of them occur in the map art.
const ROUTE_COLOURS = [
  '#ff2fa0', // magenta
  '#00e0ff', // cyan
  '#ff8a1f', // orange
  '#b26bff', // violet
  '#b6ff2e', // lime
  '#ff4d4d', // red
];

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const pick = (list, n) => list[n % list.length];

/** Snap radius in screen pixels, converted per-zoom so it feels constant. */
const SNAP_PX = 12;
// One notch per wheel event, not scaled by deltaY: a mouse sends ~100 per
// notch and a trackpad sends a stream of small ones, so scaling would make the
// same gesture behave completely differently on the two. A fixed step means
// roughly three notches for a strong bend and two to flip through centre.
const BULGE_STEP = 0.15;
const BULGE_MAX = 1.6;

// Joining is strict on purpose. Two endpoints landing near each other is not
// evidence that two routes are the same path there — every route drawn beside
// another has that, and acting on it is what made "absorb" mangle a line.
//
// A join needs a real shared stretch: MIN_MERGE_POINTS consecutive waypoints
// that coincide, counting inward from both joining ends, each pair inside
// MERGE_METRES. The run is then merged in full, so three shared points collapse
// three and thirty collapse thirty.
export const MIN_MERGE_POINTS = 3;

// A ground distance, not a screen one. Screen tolerance would mean zooming out
// makes two separate places mergeable, which is exactly the wrong direction for
// a rule whose whole job is to be strict.
const MERGE_METRES = 12;
// Only for a map with no scale at all, where there is no ground distance to
// work in. Tighter than SNAP_PX because this asks "is this the same point?",
// not "did you mean to grab this?".
const MERGE_PX = 5;

export function routePolyline(route) {
  if (!route?.waypoints?.length) return [];
  const pts = routeToPolyline(route.waypoints);
  if (route.closed && route.waypoints.length > 2) {
    const last = route.waypoints[route.waypoints.length - 1];
    const first = route.waypoints[0];
    const a = [last.y, last.x];
    const b = [first.y, first.x];
    // The closing segment is a segment like any other and carries its own
    // bulge, so a closed loop can still be all curves.
    pts.push(...(route.closeBulge ? arcBetween(a, b, route.closeBulge).slice(1) : [b]));
  }
  return pts;
}

export function useMapDrawing({ mapKey, getUnitsPerPixel, metresPerUnit, onToast }) {
  const [zones, setZonesState] = useState([]);
  const [routes, setRoutesState] = useState([]);
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [tool, setTool] = useState(null);

  // In-progress shape, before it becomes a zone/route.
  const [draft, setDraft] = useState(null);
  const [cursorPoint, setCursorPoint] = useState(null);
  const [curveArmed, setCurveArmed] = useState(false);
  const [pendingBulge, setPendingBulge] = useState(0);

  // The library is global, not per map — each entry carries its own mapKey.
  const [savedRoutes, setSavedRoutesState] = useState(() => MapStore.getSavedRoutes());
  const [drag, setDrag] = useState(null);
  const history = useRef({ past: [], future: [] });
  // A ref alone would leave the undo button stale, so depth is mirrored into
  // state purely so the UI re-renders when it changes.
  const [histDepth, setHistDepth] = useState({ past: 0, future: 0 });
  const syncHist = () => setHistDepth({
    past: history.current.past.length,
    future: history.current.future.length,
  });

  // --- persistence --------------------------------------------------------
  useEffect(() => {
    setZonesState(MapStore.getZones(mapKey));
    setRoutesState(MapStore.getRoutes(mapKey));
    setActiveZoneId(null);
    setActiveRouteId(null);
    setDraft(null);
    setTool(null);
    history.current = { past: [], future: [] };
    syncHist();
  }, [mapKey]);

  const setZones = useCallback((next) => {
    setZonesState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      MapStore.setZones(mapKey, value);
      return value;
    });
  }, [mapKey]);

  const setSavedRoutes = useCallback((next) => {
    setSavedRoutesState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      MapStore.setSavedRoutes(value);
      return value;
    });
  }, []);

  const setRoutes = useCallback((next) => {
    setRoutesState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      MapStore.setRoutes(mapKey, value);
      return value;
    });
  }, [mapKey]);

  const activeRoute = useMemo(
    () => routes.find((r) => r.id === activeRouteId) || null,
    [routes, activeRouteId],
  );

  // --- undo / redo --------------------------------------------------------
  // Zone edits are single discrete acts with an obvious delete button; routes
  // are where a slip costs work, so only routes are versioned.
  //
  // A version is the WHOLE route list, not the active route's waypoints. The
  // waypoint-only history could not describe the two edits that destroy the
  // most: a join deletes the absorbed route and a delete removes one outright,
  // and neither is a change to some surviving route's points. Undo restored the
  // points and left the other route gone for good.
  //
  // The list is also read from the closure rather than from inside the setState
  // updater. React invokes an updater twice under StrictMode, which pushed two
  // entries onto the redo stack per undo.
  const snapshot = useCallback(() => {
    history.current.past.push(JSON.stringify(routes));
    if (history.current.past.length > 60) history.current.past.shift();
    history.current.future = [];
    syncHist();
  }, [routes]);

  const undo = useCallback(() => {
    const h = history.current;
    if (!h.past.length) return;
    const restored = h.past.pop();
    h.future.push(JSON.stringify(routes));
    setRoutes(JSON.parse(restored));
    syncHist();
  }, [routes, setRoutes]);

  const redo = useCallback(() => {
    const h = history.current;
    if (!h.future.length) return;
    const restored = h.future.pop();
    h.past.push(JSON.stringify(routes));
    setRoutes(JSON.parse(restored));
    syncHist();
  }, [routes, setRoutes]);

  // --- zone / route CRUD --------------------------------------------------
  const addZone = useCallback((ring) => {
    const id = uid();
    setZones((prev) => {
      const zone = {
        id,
        name: `Zone ${prev.length + 1}`,
        ring,
        rule: { mode: 'only', categories: [] },
        color: pick(ZONE_COLOURS, prev.length),
        hidden: false,
      };
      return [...prev, zone];
    });
    setActiveZoneId(id);
    return id;
  }, [setZones]);

  const updateZone = useCallback((id, patch) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }, [setZones]);

  const removeZone = useCallback((id) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    setActiveZoneId((cur) => (cur === id ? null : cur));
  }, [setZones]);

  const moveZone = useCallback((id, delta) => {
    setZones((prev) => {
      const i = prev.findIndex((z) => z.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, [setZones]);

  const newRoute = useCallback(() => {
    const id = uid();
    setRoutes((prev) => [...prev, {
      id,
      name: `Route ${prev.length + 1}`,
      waypoints: [],
      closed: false,
      closeBulge: 0,
      radius: 40,
      rule: { mode: 'inherit', categories: [] },
      color: pick(ROUTE_COLOURS, prev.length),
      hidden: false,
    }]);
    setActiveRouteId(id);
    setTool(TOOLS.route);
    history.current = { past: [], future: [] };
    syncHist();
    return id;
  }, [setRoutes]);

  const updateRoute = useCallback((id, patch) => {
    setRoutes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, [setRoutes]);

  /**
   * Wiping the points goes through here rather than through `updateRoute` so it
   * takes a history snapshot first. It did not, which made Clear the one action
   * in the panel that Ctrl+Z could not walk back.
   */
  const clearRoute = useCallback((id) => {
    const route = routes.find((r) => r.id === id);
    if (!route?.waypoints.length) return;
    snapshot();
    setRoutes((prev) => prev.map((r) => (
      r.id === id ? { ...r, waypoints: [], closed: false } : r
    )));
    onToast?.(`Cleared ${route.waypoints.length} waypoints — Ctrl+Z undoes it`);
  }, [routes, snapshot, setRoutes, onToast]);

  const removeRoute = useCallback((id) => {
    snapshot();
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    setActiveRouteId((cur) => (cur === id ? null : cur));
    onToast?.('Route deleted — Ctrl+Z undoes it');
  }, [snapshot, setRoutes, onToast]);

  // --- the saved library --------------------------------------------------
  // Whatever zones are on the map go with the route: they are the other half
  // of the same plan, and a route saved without them comes back filtering
  // nothing.
  const saveRouteAs = useCallback((routeId, name) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route?.waypoints.length) return;
    setSavedRoutes((prev) => libSave(prev, route, zones, mapKey, name));
    onToast?.(zones.length
      ? `Saved “${name || route.name}” with ${zones.length} zone${zones.length === 1 ? '' : 's'}`
      : `Saved “${name || route.name}”`);
  }, [routes, zones, mapKey, setSavedRoutes, onToast]);

  const updateSavedFrom = useCallback((savedId, routeId) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    setSavedRoutes((prev) => overwriteSaved(prev, savedId, route, zones));
    onToast?.('Saved route updated');
  }, [routes, zones, setSavedRoutes, onToast]);

  const renameSavedRoute = useCallback(
    (savedId, name) => setSavedRoutes((prev) => renameSaved(prev, savedId, name)),
    [setSavedRoutes],
  );

  const deleteSavedRoute = useCallback(
    (savedId) => setSavedRoutes((prev) => removeSaved(prev, savedId)),
    [setSavedRoutes],
  );

  /** Loads a COPY onto the map — route and its zones — so editing what comes
   *  back never touches the saved one. */
  const loadSavedRoute = useCallback((savedId) => {
    const saved = savedRoutes.find((s) => s.id === savedId);
    if (!saved) return null;
    const route = routeFromSaved(saved, uid);
    const restored = zonesFromSaved(saved, uid);
    setRoutes((prev) => [...prev, route]);
    if (restored.length) setZones((prev) => [...prev, ...restored]);
    setActiveRouteId(route.id);
    setTool(null);
    onToast?.(restored.length
      ? `Loaded “${saved.name}” and ${restored.length} zone${restored.length === 1 ? '' : 's'}`
      : `Loaded “${saved.name}”`);
    return route.id;
  }, [savedRoutes, setRoutes, setZones, onToast]);

  // --- keyboard -----------------------------------------------------------
  useEffect(() => {
    const down = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '');
      if (typing) return;

      if ((e.key === 'c' || e.key === 'C') && !curveArmed) {
        setCurveArmed(true);
        return;
      }
      if (e.key === 'Escape') {
        setDraft(null);
        setTool(null);
        setPendingBulge(0);
        return;
      }
      if (e.key === 'Enter') {
        if (draft?.kind === 'zone-poly' && draft.ring.length >= 3) {
          addZone(draft.ring);
          setDraft(null);
          setTool(null);
        } else if (tool === TOOLS.route) {
          setTool(null);
          setPendingBulge(0);
        }
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (draft?.kind === 'zone-poly' && draft.ring.length) {
          e.preventDefault();
          setDraft({ ...draft, ring: draft.ring.slice(0, -1) });
        } else if (tool === TOOLS.route && activeRoute?.waypoints.length) {
          e.preventDefault();
          snapshot();
          updateRoute(activeRoute.id, { waypoints: activeRoute.waypoints.slice(0, -1), closed: false });
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      // Ctrl+Shift+Z was the only redo. Ctrl+Y is the one most people reach
      // for on Windows, and it did nothing at all.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    const up = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setCurveArmed(false);
        setPendingBulge(0);
      }
    };

    // Bending the pending segment must not also zoom the map, so the wheel is
    // taken over only while C is held.
    const wheel = (e) => {
      if (!curveArmed || tool !== TOOLS.route) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingBulge((b) => {
        const next = b + (e.deltaY > 0 ? -BULGE_STEP : BULGE_STEP);
        return Math.max(-BULGE_MAX, Math.min(BULGE_MAX, next));
      });
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('wheel', wheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('wheel', wheel, { capture: true });
    };
  }, [curveArmed, draft, tool, activeRoute, addZone, snapshot, updateRoute, undo, redo, getUnitsPerPixel]);

  // --- pointer ------------------------------------------------------------
  const snapUnits = useCallback(
    () => SNAP_PX * (getUnitsPerPixel?.() || 1),
    [getUnitsPerPixel],
  );

  /** How close two waypoints have to be to count as the same place. */
  const mergeTolerance = metresPerUnit
    ? MERGE_METRES / metresPerUnit
    : MERGE_PX * (getUnitsPerPixel?.() || 1);

  const handleClick = useCallback((point) => {
    if (tool === TOOLS.zoneRect) {
      if (!draft || draft.kind !== 'zone-rect') {
        setDraft({ kind: 'zone-rect', start: point });
      } else {
        addZone(boxRing(draft.start, point));
        setDraft(null);
        setTool(null);
      }
      return;
    }

    if (tool === TOOLS.zonePoly) {
      const ring = draft?.kind === 'zone-poly' ? draft.ring : [];
      // Clicking the first vertex closes the shape onto THAT vertex rather
      // than adding a near-identical one beside it.
      if (ring.length >= 3 && dist(point, ring[0]) <= snapUnits()) {
        addZone(ring);
        setDraft(null);
        setTool(null);
        return;
      }
      setDraft({ kind: 'zone-poly', ring: [...ring, point] });
      return;
    }

    if (tool === TOOLS.route && activeRoute) {
      const wps = activeRoute.waypoints;
      const pts = wps.map((w) => [w.y, w.x]);
      const hitIdx = nearestVertex(point, pts, snapUnits());

      if (hitIdx === 0 && wps.length >= 3) {
        // Back to the origin: link to it and close the loop. No duplicate
        // vertex, which is the thing onthegomap gets wrong.
        snapshot();
        updateRoute(activeRoute.id, { closed: true, closeBulge: curveArmed ? pendingBulge : 0 });
        setTool(null);
        setPendingBulge(0);
        onToast?.('Loop closed on the original waypoint');
        return;
      }

      // Any other existing vertex: land exactly on it, don't near-miss it.
      const placed = hitIdx >= 0 ? { y: pts[hitIdx][0], x: pts[hitIdx][1] } : { y: point[0], x: point[1] };
      snapshot();
      updateRoute(activeRoute.id, {
        waypoints: [...wps, { ...placed, bulge: curveArmed ? pendingBulge : 0 }],
      });
      setPendingBulge(0);
    }
  }, [tool, draft, activeRoute, curveArmed, pendingBulge, addZone, snapUnits, snapshot, updateRoute, onToast]);

  const handleMove = useCallback((point) => {
    setCursorPoint(point);

    if (drag && activeRoute) {
      if (!drag.moved) setDrag((d) => (d ? { ...d, moved: true } : d));
      setRoutes((prev) => prev.map((r) => {
        if (r.id !== activeRoute.id) return r;
        const wps = [...r.waypoints];
        wps[drag.index] = { ...wps[drag.index], y: point[0], x: point[1] };
        return { ...r, waypoints: wps };
      }));
    }
  }, [drag, activeRoute, setRoutes]);

  /**
   * Drag-edit mode. Returns true when it takes the gesture, so the caller can
   * lock map panning for the duration.
   */
  const handleDown = useCallback((point, e) => {
    // No mode to select. Having an open route and not currently placing points
    // IS edit mode — requiring a second global toggle on top of picking the
    // route was two ways of saying the same thing.
    if (!activeRoute || tool === TOOLS.route || tool === TOOLS.zoneRect || tool === TOOLS.zonePoly) {
      return false;
    }
    const pts = activeRoute.waypoints.map((w) => [w.y, w.x]);
    const vIdx = nearestVertex(point, pts, snapUnits());

    if (vIdx >= 0) {
      if (e?.shiftKey) {
        snapshot();
        updateRoute(activeRoute.id, {
          waypoints: activeRoute.waypoints.filter((_, i) => i !== vIdx),
          closed: activeRoute.waypoints.length - 1 > 2 ? activeRoute.closed : false,
        });
        return true;
      }
      snapshot();
      setDrag({ index: vIdx, moved: false });
      return true;
    }

    const sIdx = nearestSegment(point, pts, snapUnits());
    if (sIdx >= 0) {
      snapshot();
      const wps = [...activeRoute.waypoints];
      // Inserting keeps the arriving segment's bulge on the segment that still
      // arrives at the old vertex, so the curve does not jump when split.
      wps.splice(sIdx + 1, 0, { y: point[0], x: point[1], bulge: 0 });
      updateRoute(activeRoute.id, { waypoints: wps });
      setDrag({ index: sIdx + 1, moved: true });
      return true;
    }
    return false;
  }, [activeRoute, tool, snapUnits, snapshot, updateRoute]);

  /**
   * Right-click finishes whatever is being drawn. Enter and Escape already did,
   * but reaching for the keyboard mid-line is the wrong hand — every other
   * drawing tool in existence ends a polyline on right-click.
   *
   * A zone in progress is abandoned rather than committed: a half-drawn box or
   * a two-point polygon is not a shape anyone meant to keep.
   */
  const handleRightClick = useCallback(() => {
    if (tool === TOOLS.route) {
      setTool(null);
      setPendingBulge(0);
      setCurveArmed(false);
      onToast?.('Finished drawing — the route is still open for editing');
      return true;
    }
    if (draft) {
      setDraft(null);
      setTool(null);
      return true;
    }
    return false;
  }, [tool, draft, onToast]);

  const handleUp = useCallback(() => {
    if (!drag) return;
    const { index, moved } = drag;
    setDrag(null);
    if (!activeRoute) return;

    const wps = activeRoute.waypoints;

    // A CLICK on the last waypoint (as opposed to a drag) picks the line back
    // up and carries on from there. That is the only way to extend a route now
    // — selecting one puts you in edit, never in draw, so nothing starts
    // adding points behind your back.
    if (!moved && index === wps.length - 1 && !activeRoute.closed) {
      setTool(TOOLS.route);
      onToast?.('Carrying on from that waypoint — click to place, Enter to stop');
      return;
    }
    if (!moved || activeRoute.closed) return;

    // Dropping one end onto the SAME route's other end closes the loop. That is
    // what the end-to-end gesture is for — a square, a circle, a patrol loop —
    // and it is now the only thing it does. It used to reach across to OTHER
    // routes and concatenate them, which an end landing near an end never meant:
    // two separate lines touching at a point are still two lines. Merging two
    // routes is a deliberate act, and it needs a genuinely shared stretch.
    const isEnd = index === 0 || index === wps.length - 1;
    // Four, so that dropping the dragged point still leaves a three-point ring.
    if (!isEnd || wps.length < 4) return;

    const far = index === 0 ? wps[wps.length - 1] : wps[0];
    if (dist([wps[index].y, wps[index].x], [far.y, far.x]) > snapUnits()) return;

    // No snapshot here — handleDown took one when the drag began, so a single
    // Ctrl+Z walks back the whole gesture instead of half of it.
    updateRoute(activeRoute.id, {
      waypoints: wps.filter((_, i) => i !== index),
      closed: true,
    });
    onToast?.('Loop closed on the route\'s other end — Ctrl+Z undoes it');
  }, [drag, activeRoute, snapUnits, updateRoute, onToast]);

  /**
   * The same join, from the panel, for when dragging onto a point is fiddly.
   *
   * It used to hardcode "A's end onto B's start" whichever ends were actually
   * near each other. Absorbing a route that ran the other way therefore spliced
   * in B's far end, and the result doubled back across the map — the join read
   * as having eaten both routes rather than continuing one. It now joins at the
   * nearest pair of ends, and only welds the two vertices into one when they
   * are close enough to be the same place.
   */
  const joinTo = useCallback((otherId) => {
    if (!activeRoute) return;
    const other = routes.find((r) => r.id === otherId);
    if (!other) return;
    const pick = bestJoin(activeRoute, other, mergeTolerance);
    if (!pick) return;

    if (pick.overlap < MIN_MERGE_POINTS) {
      onToast?.(pick.overlap
        ? `${other.name} only shares ${pick.overlap} point${pick.overlap === 1 ? '' : 's'} `
          + `with ${activeRoute.name} — ${MIN_MERGE_POINTS} in a row are needed to merge`
        : `${other.name} does not run along ${activeRoute.name} anywhere — nothing to merge`);
      return;
    }

    snapshot();
    setRoutes((prev) => joinRoutes(
      prev, activeRoute.id, pick.aEnd, otherId, pick.bEnd, { merge: pick.overlap },
    ));
    onToast?.(`Merged ${other.name} into ${activeRoute.name} over `
      + `${pick.overlap} shared points — Ctrl+Z undoes it`);
  }, [activeRoute, routes, mergeTolerance, snapshot, setRoutes, onToast]);

  // --- preview geometry ---------------------------------------------------
  const previewRing = useMemo(() => {
    if (!draft || !cursorPoint) return null;
    if (draft.kind === 'zone-rect') return boxRing(draft.start, cursorPoint);
    if (draft.kind === 'zone-poly' && draft.ring.length) return [...draft.ring, cursorPoint];
    return null;
  }, [draft, cursorPoint]);

  const previewSegment = useMemo(() => {
    if (tool !== TOOLS.route || !activeRoute?.waypoints.length || !cursorPoint) return null;
    const last = activeRoute.waypoints[activeRoute.waypoints.length - 1];
    const a = [last.y, last.x];
    return curveArmed && pendingBulge
      ? arcBetween(a, cursorPoint, pendingBulge)
      : [a, cursorPoint];
  }, [tool, activeRoute, cursorPoint, curveArmed, pendingBulge]);

  /**
   * What drag-edit mode would grab right now. Also the signal to suspend map
   * panning: a drag that starts on a handle must move the handle, and Leaflet
   * would otherwise pan the map out from under it.
   */
  const editTarget = useMemo(() => {
    if (!activeRoute?.waypoints.length || !cursorPoint) return null;
    if (tool === TOOLS.route || tool === TOOLS.zoneRect || tool === TOOLS.zonePoly) return null;
    const pts = activeRoute.waypoints.map((w) => [w.y, w.x]);
    const v = nearestVertex(cursorPoint, pts, snapUnits());
    if (v >= 0) return { kind: 'vertex', index: v, point: pts[v] };
    const seg = nearestSegment(cursorPoint, pts, snapUnits());
    if (seg >= 0) return { kind: 'segment', index: seg, point: cursorPoint };
    return null;
  }, [activeRoute, cursorPoint, tool, snapUnits]);

  // Highlighted when the cursor is close enough that a click would link rather
  // than add — the user should see the link coming, not discover it after.
  const snapTarget = useMemo(() => {
    if (!cursorPoint) return null;
    // Dragging an end within reach of the same route's other end: the drop will
    // close the loop, so say so before the mouse comes up rather than after.
    if (drag && activeRoute && !activeRoute.closed) {
      const wps = activeRoute.waypoints;
      const isEnd = drag.index === 0 || drag.index === wps.length - 1;
      if (isEnd && wps.length >= 4) {
        const far = drag.index === 0 ? wps[wps.length - 1] : wps[0];
        const at = [far.y, far.x];
        if (dist(cursorPoint, at) <= snapUnits()) return { point: at, closes: true };
      }
      return null;
    }
    if (tool === TOOLS.route && activeRoute?.waypoints.length) {
      const pts = activeRoute.waypoints.map((w) => [w.y, w.x]);
      const i = nearestVertex(cursorPoint, pts, snapUnits());
      return i >= 0 ? { point: pts[i], closes: i === 0 && pts.length >= 3 } : null;
    }
    if (draft?.kind === 'zone-poly' && draft.ring.length >= 3) {
      return dist(cursorPoint, draft.ring[0]) <= snapUnits()
        ? { point: draft.ring[0], closes: true }
        : null;
    }
    return null;
  }, [cursorPoint, tool, activeRoute, draft, drag, snapUnits]);

  return {
    zones, routes, activeZoneId, activeRouteId, activeRoute,
    tool, draft, curveArmed, pendingBulge, drag,
    previewRing, previewSegment, snapTarget, cursorPoint, editTarget,
    setTool, setActiveZoneId, setActiveRouteId,
    addZone, updateZone, removeZone, moveZone,
    newRoute, updateRoute, removeRoute, clearRoute, joinTo,
    savedRoutes: savedForMap(savedRoutes, mapKey),
    allSavedRoutes: savedRoutes,
    setSavedRoutes,
    saveRouteAs, updateSavedFrom, renameSavedRoute, deleteSavedRoute, loadSavedRoute,
    handleClick, handleMove, handleDown, handleUp, handleRightClick,
    mergeTolerance, minMergePoints: MIN_MERGE_POINTS,
    undo, redo,
    canUndo: histDepth.past > 0,
    canRedo: histDepth.future > 0,
    cancelDraft: () => { setDraft(null); setTool(null); setPendingBulge(0); },
  };
}
