import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { MapStore } from './eftMapStorage';
import {
  saveRoute as libSave, overwriteSaved, renameSaved, removeSaved,
  savedForMap, routeFromSaved,
} from './eftRouteLibrary';
import {
  boxRing, nearestVertex, nearestSegment, routeToPolyline, arcBetween, dist,
  nearestRouteEnd, joinRoutes,
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
// Two route modes run against the SAME data so they can be compared directly:
//
//   'spline'    place-as-you-go. Straight by default; hold C and the pending
//               segment becomes an arc that the wheel bends and flips.
//   'onthegomap' edit-in-place. Drag a vertex to move it, drag a segment to
//               insert one, shift-click to delete, with undo/redo.

export const TOOLS = {
  none: null,
  zoneRect: 'zone-rect',
  zonePoly: 'zone-poly',
  route: 'route',
};

export const ROUTE_MODES = [
  { value: 'spline', label: 'Curve draw', hint: 'Click to place. Hold C and scroll to bend the segment.' },
  { value: 'onthegomap', label: 'Drag edit', hint: 'Drag a point to move it, drag a line to insert one, shift-click to delete.' },
];

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

export function useMapDrawing({ mapKey, getUnitsPerPixel, onToast }) {
  const [zones, setZonesState] = useState([]);
  const [routes, setRoutesState] = useState([]);
  const [activeZoneId, setActiveZoneId] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [tool, setTool] = useState(null);
  const [routeMode, setRouteMode] = useState('spline');

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
  // Only route geometry is versioned. Zone edits are single discrete acts with
  // an obvious delete button; route drawing is the one place a slip costs work.
  const snapshot = useCallback(() => {
    if (!activeRouteId) return;
    const route = routes.find((r) => r.id === activeRouteId);
    if (!route) return;
    history.current.past.push(JSON.stringify(route.waypoints));
    if (history.current.past.length > 60) history.current.past.shift();
    history.current.future = [];
    syncHist();
  }, [activeRouteId, routes]);

  const undo = useCallback(() => {
    const h = history.current;
    if (!h.past.length || !activeRouteId) return;
    setRoutes((prev) => prev.map((r) => {
      if (r.id !== activeRouteId) return r;
      h.future.push(JSON.stringify(r.waypoints));
      return { ...r, waypoints: JSON.parse(h.past.pop()) };
    }));
    syncHist();
  }, [activeRouteId, setRoutes]);

  const redo = useCallback(() => {
    const h = history.current;
    if (!h.future.length || !activeRouteId) return;
    setRoutes((prev) => prev.map((r) => {
      if (r.id !== activeRouteId) return r;
      h.past.push(JSON.stringify(r.waypoints));
      return { ...r, waypoints: JSON.parse(h.future.pop()) };
    }));
    syncHist();
  }, [activeRouteId, setRoutes]);

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

  const removeRoute = useCallback((id) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    setActiveRouteId((cur) => (cur === id ? null : cur));
  }, [setRoutes]);

  // --- the saved library --------------------------------------------------
  const saveRouteAs = useCallback((routeId, name) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route?.waypoints.length) return;
    setSavedRoutes((prev) => libSave(prev, route, mapKey, name));
    onToast?.(`Saved “${name || route.name}” — it will be here next session`);
  }, [routes, mapKey, setSavedRoutes, onToast]);

  const updateSavedFrom = useCallback((savedId, routeId) => {
    const route = routes.find((r) => r.id === routeId);
    if (!route) return;
    setSavedRoutes((prev) => overwriteSaved(prev, savedId, route));
    onToast?.('Saved route updated');
  }, [routes, setSavedRoutes, onToast]);

  const renameSavedRoute = useCallback(
    (savedId, name) => setSavedRoutes((prev) => renameSaved(prev, savedId, name)),
    [setSavedRoutes],
  );

  const deleteSavedRoute = useCallback(
    (savedId) => setSavedRoutes((prev) => removeSaved(prev, savedId)),
    [setSavedRoutes],
  );

  /** Loads a COPY onto the map, so editing it never touches the saved one. */
  const loadSavedRoute = useCallback((savedId) => {
    const saved = savedRoutes.find((s) => s.id === savedId);
    if (!saved) return null;
    const route = routeFromSaved(saved, uid);
    setRoutes((prev) => [...prev, route]);
    setActiveRouteId(route.id);
    setTool(null);
    onToast?.(`Loaded “${saved.name}”`);
    return route.id;
  }, [savedRoutes, setRoutes, onToast]);

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
   * Letting go of an endpoint next to another route's endpoint joins the two
   * into one route. This is the whole reason two separately drawn halves can
   * become a single corridor — before, they only looked connected, and the
   * manifest still treated them as unrelated.
   */
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
    if (moved === false) return;
    if (activeRoute.closed) return;

    const isEnd = index === 0 || index === wps.length - 1;
    if (!isEnd || wps.length < 2) return;

    const here = [wps[index].y, wps[index].x];
    const hit = nearestRouteEnd(routes, here, { exceptId: activeRoute.id, threshold: snapUnits() });
    if (!hit) return;

    const other = routes.find((r) => r.id === hit.routeId);
    snapshot();
    setRoutes((prev) => joinRoutes(prev, activeRoute.id, index === 0 ? 'start' : 'end', hit.routeId, hit.end));
    onToast?.(`Joined ${other?.name || 'that route'} into ${activeRoute.name}`);
  }, [drag, activeRoute, routes, snapUnits, snapshot, setRoutes, onToast]);

  /** The same join, from the panel, for when dragging onto a point is fiddly. */
  const joinTo = useCallback((otherId) => {
    if (!activeRoute) return;
    const ends = { a: activeRoute.waypoints.length - 1 };
    const other = routes.find((r) => r.id === otherId);
    if (!other) return;
    snapshot();
    setRoutes((prev) => joinRoutes(prev, activeRoute.id, 'end', otherId, 'start'));
    onToast?.(`Joined ${other.name} onto the end of ${activeRoute.name}`);
    void ends;
  }, [activeRoute, routes, snapshot, setRoutes, onToast]);

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
  }, [cursorPoint, tool, activeRoute, draft, snapUnits]);

  return {
    zones, routes, activeZoneId, activeRouteId, activeRoute,
    tool, routeMode, draft, curveArmed, pendingBulge, drag,
    previewRing, previewSegment, snapTarget, cursorPoint, editTarget,
    setTool, setRouteMode, setActiveZoneId, setActiveRouteId,
    addZone, updateZone, removeZone, moveZone,
    newRoute, updateRoute, removeRoute, joinTo,
    savedRoutes: savedForMap(savedRoutes, mapKey),
    allSavedRoutes: savedRoutes,
    setSavedRoutes,
    saveRouteAs, updateSavedFrom, renameSavedRoute, deleteSavedRoute, loadSavedRoute,
    handleClick, handleMove, handleDown, handleUp, handleRightClick,
    undo, redo,
    canUndo: histDepth.past > 0,
    canRedo: histDepth.future > 0,
    cancelDraft: () => { setDraft(null); setTool(null); setPendingBulge(0); },
  };
}
