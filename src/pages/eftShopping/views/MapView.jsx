import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import MapCanvas from '../map/MapCanvas';
import mapConfigFile from '../map/data/mapConfig.json';
import { MapStore } from '../map/eftMapStorage';
import {
  autoFit, solveFromPairs, calibrationError, project,
  metresPerMapUnit, metresPerSourceUnit,
} from '../map/eftMapProject';
import { resolveMarkers, routeManifest } from '../map/eftMapFilters';
import { useMapDrawing, routePolyline } from '../map/useMapDrawing';
import { ZonePanel, RoutePanel, ManifestPanel, CatIcon } from '../map/MapSidePanels';
import {
  fetchWaypoints, saveWaypoint, deleteWaypoint, pushWaypoints, mergeWaypoints,
  fetchSavedRoutes, pushSavedRoutes,
} from '../map/eftMapFirestore';
import { mergeSaved } from '../map/eftRouteLibrary';
import { useAuth } from '../../../AuthContext';
import { Panel, Stat, Seg } from '../EftBits';
import { useEft } from '../eftContext';

// Marker files are committed per map and code-split, so only the map you open
// is ever downloaded. Maps without a file are scaffolded placeholders.
const MARKER_FILES = import.meta.glob('../map/data/markers/*.json');
const markerLoader = (key) => MARKER_FILES[`../map/data/markers/${key}.json`];

const MAPS = mapConfigFile.maps;

// Opening a map with all ~40 categories on is an unreadable wall of pins. These
// two are the orientation layer — where you can leave, and what the places are
// called — so they are the only ones on by default. Everything else is opt-in.
const DEFAULT_ON = new Set(['Extraction', 'Location']);
const defaultVisible = (categories) => new Set(
  (categories || []).filter((c) => DEFAULT_ON.has(c.title)).map((c) => c.id),
);

// Presets are ours, not the source's. mapgenie ships exactly one per map
// ("Extracts + PMC Spawns") and spawn points are not what this map gets opened
// for, so the starter preset is the same pair the filters default to.
const seedPresets = (categories) => [{
  id: 'seed-extract-location',
  title: 'Extracts + Locations',
  categories: [...defaultVisible(categories)],
}];

const uid = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Same soft, client-side gate as QATracker: it keeps the page from being
// stumbled into, nothing more, and is not pretending to be security.
//
// localStorage, not session: it is a speed bump, not a secret, and re-typing it
// every time the tab was reopened on the same machine was pure friction.
const PASSWORD = 'trogdor';
const UNLOCK_KEY = 'eftmap-unlocked';

// Belt and braces, because the failure mode is silent: if localStorage.setItem
// throws — private mode, quota, a strict privacy setting, a partitioned
// context — the old code caught it and did nothing, so you stayed unlocked for
// that session and were asked again on every future one, with no clue why.
// A plain cookie is written alongside; between them, anything that keeps ANY
// client-side state keeps this.
const readUnlock = () => {
  try { if (localStorage.getItem(UNLOCK_KEY) === '1') return true; } catch { /* blocked */ }
  try { if (sessionStorage.getItem(UNLOCK_KEY) === '1') return true; } catch { /* blocked */ }
  return document.cookie.split('; ').some((c) => c === `${UNLOCK_KEY}=1`);
};

const writeUnlock = () => {
  let stored = false;
  try { localStorage.setItem(UNLOCK_KEY, '1'); stored = localStorage.getItem(UNLOCK_KEY) === '1'; } catch { /* blocked */ }
  try {
    // One year, root path, so it is the same answer on every page of the site.
    document.cookie = `${UNLOCK_KEY}=1; path=/; max-age=31536000; SameSite=Lax`;
  } catch { /* blocked */ }
  return stored || document.cookie.includes(`${UNLOCK_KEY}=1`);
};

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const attempt = () => {
    if (input.trim().toLowerCase() === PASSWORD) onUnlock();
    else { setError(true); setInput(''); }
  };

  return (
    <div className="eft-map-gate">
      <div className="eft-map-gate-box">
        <div className="eft-label" style={{ marginBottom: 10 }}>enter the secret password</div>
        <input
          className="eft-input"
          type="password"
          value={input}
          placeholder="password"
          autoFocus
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') attempt(); }}
          style={{ width: '100%', marginBottom: 8 }}
        />
        {error ? <div className="eft-note" style={{ color: 'var(--eft-red)', marginBottom: 8 }}>incorrect</div> : null}
        <button type="button" className="eft-btn eft-is-primary" onClick={attempt} style={{ width: '100%' }}>
          Enter
        </button>
      </div>
    </div>
  );
}

export default function MapView() {
  const { showToast } = useEft();

  const [unlocked, setUnlocked] = useState(readUnlock);
  const [prefs, setPrefsState] = useState(() => MapStore.getPrefs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [visibleCats, setVisibleCats] = useState(() => new Set());
  const [found, setFound] = useState({});
  // The user's own pins, and the one being placed right now. The list itself
  // is derived from storage rather than mirrored into state — `wpVersion` is
  // just the "storage changed" nudge, which keeps the map-switch case from
  // needing a setState inside an effect.
  const [wpVersion, setWpVersion] = useState(0);
  const [draft, setDraft] = useState(null);
  const [calibration, setCalibrationState] = useState(null);
  const [calMode, setCalMode] = useState(false);
  const [calPairs, setCalPairs] = useState([]);
  const [pendingMarker, setPendingMarker] = useState(null);
  const [search, setSearch] = useState('');
  const [presets, setPresetsState] = useState([]);
  // { x, y, cat } while a filter's right-click menu is open.
  const [ctxMenu, setCtxMenu] = useState(null);
  // Deliberately NOT persisted. It was a stored pref, so opening it once left
  // it open on every future visit and reload — the map is the point of this
  // page, and a panel covering a third of it should never be the state you
  // arrive in. The side panels stay persisted; this one always starts shut.
  const [mapMenuOpen, setMapMenuOpen] = useState(false);
  // 'tiles' = mapgenie's own pyramid, exact and calibration-free.
  // 'svg'   = tarkov.dev's open vector map, needs calibrating.
  const [base, setBase] = useState('tiles');

  const mapRef = useRef(null);

  const mapKey = prefs.lastMap;
  const mapConfig = useMemo(() => MAPS.find((m) => m.key === mapKey) || MAPS[0], [mapKey]);
  const hasMarkers = !!markerLoader(mapKey);

  const setPanel = useCallback((name, open) => {
    setPrefsState((prev) => {
      const next = { ...prev, panels: { ...prev.panels, [name]: open } };
      MapStore.setPrefs(next);
      return next;
    });
  }, []);

  const setPresets = useCallback((next) => {
    setPresetsState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      MapStore.setPresets(mapKey, value);
      return value;
    });
  }, [mapKey]);

  const setPrefs = useCallback((patch) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      MapStore.setPrefs(next);
      return next;
    });
  }, []);

  // Screen-relative snapping: a 12 px grab radius has to mean a different
  // number of map units at every zoom level.
  const getUnitsPerPixel = useCallback(() => {
    const map = mapRef.current;
    if (!map) return 1;
    const a = map.containerPointToLatLng([0, 0]);
    const b = map.containerPointToLatLng([0, 1]);
    return Math.abs(b.lat - a.lat) || 1;
  }, []);

  // Metres per map unit. On tiles this is mapgenie's own distance-tool
  // constant; on the vector basemap it comes from tarkov.dev's transform.
  // Computed up here because the drawing hook needs it: whether two waypoints
  // are the same place is a question about ground distance.
  const usingTilesForScale = base === 'tiles' && !!data?.tiles?.url;
  const metresPerUnit = usingTilesForScale ? metresPerSourceUnit(data) : metresPerMapUnit(mapConfig);
  const unitsPerMetre = metresPerUnit ? 1 / metresPerUnit : null;

  const draw = useMapDrawing({ mapKey, getUnitsPerPixel, metresPerUnit, onToast: showToast });

  // --- load the selected map ---------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLoadError(null);
    setCalMode(false);
    setCalPairs([]);
    setActiveFloor(null);

    const loader = markerLoader(mapKey);
    if (!loader) return undefined;

    setLoading(true);
    loader().then((mod) => {
      if (cancelled) return;
      const d = mod.default || mod;
      setData(d);
      setVisibleCats(defaultVisible(d.categories));
      setFound(MapStore.getFound(mapKey));
      setPresets(MapStore.getPresets(mapKey) ?? seedPresets(d.categories));
      setCalibrationState(MapStore.getCalibration(mapKey) || autoFit(d.markers, mapConfig.bounds));
      setBase(d.tiles?.url ? 'tiles' : 'svg');
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setLoadError(err.message);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [mapKey, mapConfig]);

  // --- waypoints ----------------------------------------------------------
  // localStorage is the source of truth so the map still works signed out; the
  // Firestore copy is what makes a pin placed on the desktop show up on the
  // laptop. On sign-in the two are merged rather than one overwriting the
  // other, so points made while signed out are not stranded.
  const { user } = useAuth() || {};
  const userId = user?.uid || null;

  const waypoints = useMemo(() => {
    // Read purely so the memo re-runs after a write: MapStore is localStorage
    // and not reactive, so bumping a counter is what invalidates this.
    void wpVersion;
    return MapStore.getWaypoints(mapKey);
  }, [mapKey, wpVersion]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    fetchWaypoints(userId).then((remote) => {
      if (cancelled) return;
      const mine = remote.filter((w) => w.mapKey === mapKey);
      const local = MapStore.getWaypoints(mapKey);
      const merged = mergeWaypoints(local, mine);
      MapStore.setWaypoints(mapKey, merged);
      setWpVersion((v) => v + 1);
      // Anything local the server has never seen goes up once.
      const known = new Set(mine.map((w) => w.id));
      pushWaypoints(userId, merged.filter((w) => !known.has(w.id))).catch(() => {});
    }).catch(() => { /* offline — the local copy is already on screen */ });
    return () => { cancelled = true; };
  }, [userId, mapKey]);

  // The saved-route library rides the same rails as waypoints: local copy is
  // primary, the account copy is what carries it between machines, and the two
  // are merged on sign-in rather than one clobbering the other.
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    fetchSavedRoutes(userId).then((remote) => {
      if (cancelled) return;
      const local = MapStore.getSavedRoutes();
      const merged = mergeSaved(local, remote);
      MapStore.setSavedRoutes(merged);
      draw.setSavedRoutes(merged);
      const known = new Set(remote.map((r) => r.id));
      pushSavedRoutes(userId, merged.filter((r) => !known.has(r.id))).catch(() => {});
    }).catch(() => { /* offline — the local library is already on screen */ });
    return () => { cancelled = true; };
    // draw.setSavedRoutes is stable; re-running on every draw change would
    // refetch the whole library on each edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Any change to the library goes up as a whole. It is a handful of documents,
  // not a hot path, and a full push means a delete cannot leave an orphan.
  useEffect(() => {
    if (!userId || !draw.allSavedRoutes.length) return;
    pushSavedRoutes(userId, draw.allSavedRoutes).catch(() => {});
  }, [userId, draw.allSavedRoutes]);

  const writeWaypoints = useCallback((next) => {
    MapStore.setWaypoints(mapKey, next);
    setWpVersion((v) => v + 1);
  }, [mapKey]);

  // A pin starts life dead centre of what you are already looking at, which is
  // almost always within a drag of where you want it — and the further in you
  // are zoomed, the finer that drag gets. Nothing snaps.
  const startWaypoint = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    setDraft({
      id: `wp-${uid()}`,
      mapKey,
      name: '',
      catId: '',
      lat: c.lat,
      lng: c.lng,
    });
  }, [mapKey]);

  const recentreDraft = useCallback(() => {
    const map = mapRef.current;
    if (!map || !draft) return;
    const c = map.getCenter();
    setDraft((d) => (d ? { ...d, lat: c.lat, lng: c.lng } : d));
  }, [draft]);

  const commitWaypoint = useCallback(() => {
    if (!draft) return;
    const cat = (data?.categories || []).find((c) => String(c.id) === String(draft.catId));
    const wp = {
      ...draft,
      name: draft.name.trim() || cat?.title || 'Waypoint',
      color: cat?.color ? `#${cat.color}` : '#e0c07a',
      updatedAt: Date.now(),
    };
    writeWaypoints([...waypoints.filter((w) => w.id !== wp.id), wp]);
    setDraft(null);
    if (userId) saveWaypoint(userId, wp).catch(() => showToast('Saved here, but the cloud copy failed'));
    showToast(userId ? `${wp.name} saved to your account` : `${wp.name} saved on this device`);
  }, [draft, waypoints, writeWaypoints, userId, data, showToast]);

  const removeWaypoint = useCallback((id) => {
    writeWaypoints(waypoints.filter((w) => w.id !== id));
    if (userId) deleteWaypoint(userId, id).catch(() => {});
  }, [waypoints, writeWaypoints, userId]);

  // The offered thresholds have moved twice. A stored value that is not on the
  // current list would leave the control showing nothing selected, so anything
  // unrecognised falls to the nearest behaviour instead of going blank.
  const detailChoice = [13, 14, 15].includes(prefs.detailZoom) ? String(prefs.detailZoom)
    : prefs.detailZoom >= 90 ? '99' : '15';

  const savedCalibration = MapStore.getCalibration(mapKey);
  const isCalibrated = !!savedCalibration;
  const usingTiles = usingTilesForScale;

  // On the tile basemap the source coordinates ARE the map coordinates.
  const toPoint = useCallback(
    (m) => (usingTiles ? [m.lat, m.lng] : (calibration ? project(calibration, m.lat, m.lng) : null)),
    [usingTiles, calibration],
  );

  // Everything downstream works in map units, so project once here rather than
  // re-projecting inside every filter pass.
  const placed = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const out = [];
    for (const m of data.markers) {
      if (!prefs.showFound && found[m.id]) continue;
      if (q && !`${m.title} ${m.desc}`.toLowerCase().includes(q)) continue;
      const pt = toPoint(m);
      if (!pt) continue;
      out.push({ ...m, y: pt[0], x: pt[1] });
    }
    return out;
  }, [data, toPoint, search, prefs.showFound, found]);

  const activeRoute = draw.activeRoute;

  // The route tier only exists when there is a drawn line with a real corridor.
  const routeFilter = useMemo(() => {
    if (!activeRoute || activeRoute.hidden) return null;
    const polyline = routePolyline(activeRoute);
    if (polyline.length < 2 || !activeRoute.radius) return null;
    // The slider is in metres; the geometry is in map units.
    const radius = unitsPerMetre ? activeRoute.radius * unitsPerMetre : activeRoute.radius;
    return { polyline, radius, rule: activeRoute.rule };
  }, [activeRoute, unitsPerMetre]);

  const resolverOpts = useMemo(() => ({
    globalCategories: visibleCats,
    zones: draw.zones,
    route: routeFilter,
  }), [visibleCats, draw.zones, routeFilter]);

  const { visible: shownMarkers, hidden } = useMemo(
    () => resolveMarkers(placed, resolverOpts),
    [placed, resolverOpts],
  );

  const manifest = useMemo(
    () => (routeFilter
      ? routeManifest(placed, resolverOpts, { metresPerUnit, speeds: data?.speeds || [] })
      : { rows: [], totalUnits: 0, totalMetres: null, times: [] }),
    [placed, resolverOpts, routeFilter, metresPerUnit, data],
  );

  const groups = useMemo(() => {
    if (!data) return [];
    const byGroup = new Map();
    for (const c of data.categories) {
      if (!byGroup.has(c.group)) byGroup.set(c.group, []);
      byGroup.get(c.group).push(c);
    }
    return [...byGroup.entries()];
  }, [data]);

  const toggleCat = (id) => setVisibleCats((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const setGroup = (cats, on) => setVisibleCats((prev) => {
    const next = new Set(prev);
    for (const c of cats) {
      if (on) next.add(c.id);
      else next.delete(c.id);
    }
    return next;
  });

  // A preset is "on" when everything in it is showing. Clicking then turns it
  // off rather than re-applying the same set, so a second click does something.
  // Additive on purpose: two presets can be on at once.
  const presetActive = (preset) => !!preset.categories?.length
    && preset.categories.every((id) => visibleCats.has(id));

  const togglePreset = (preset) => setVisibleCats((prev) => {
    const next = new Set(prev);
    const on = preset.categories?.length && preset.categories.every((id) => next.has(id));
    for (const id of preset.categories || []) {
      if (on) next.delete(id);
      else next.add(id);
    }
    return next;
  });

  const addToPreset = (presetId, catId) => {
    setPresets((prev) => prev.map((p) => (
      p.id === presetId && !p.categories.includes(catId)
        ? { ...p, categories: [...p.categories, catId] }
        : p
    )));
    setCtxMenu(null);
    showToast(`Added to ${presets.find((p) => p.id === presetId)?.title}`);
  };

  const newPresetFrom = (cat) => {
    setPresets((prev) => [...prev, { id: uid(), title: cat.title, categories: [cat.id] }]);
    setCtxMenu(null);
    showToast(`New preset "${cat.title}"`);
  };

  const removePreset = (id) => setPresets((prev) => prev.filter((p) => p.id !== id));

  const toggleFound = (marker) => {
    setFound((prev) => {
      const next = { ...prev };
      if (next[marker.id]) delete next[marker.id];
      else next[marker.id] = true;
      MapStore.setFound(mapKey, next);
      return next;
    });
  };

  // --- calibration --------------------------------------------------------
  // Two clicks per landmark: pick a marker whose real position you recognise,
  // then click where it actually belongs on the image.
  const handleMarkerClick = (marker) => {
    if (calMode) { setPendingMarker(marker); return; }
    toggleFound(marker);
  };

  const applyCalibration = () => {
    const res = solveFromPairs(calPairs);
    if (!res.ok) { showToast(res.error); return; }
    MapStore.setCalibration(mapKey, res.calibration);
    setCalibrationState(res.calibration);
    setCalMode(false);
    const err = calibrationError(res.calibration, calPairs);
    showToast(`Calibrated — worst residual ${err.worst.toFixed(1)} map units`);
  };

  const resetCalibration = () => {
    MapStore.clearCalibration(mapKey);
    setCalibrationState(autoFit(data?.markers || [], mapConfig.bounds));
    setCalPairs([]);
    showToast('Calibration reset to auto-fit');
  };

  // --- pointer routing ----------------------------------------------------
  const drawing = !!draw.tool;

  const onMapClick = (point) => {
    if (calMode) {
      if (!pendingMarker) return;
      setCalPairs((prev) => [...prev, {
        lat: pendingMarker.lat, lng: pendingMarker.lng, y: point[0], x: point[1],
        label: pendingMarker.title || `#${pendingMarker.id}`,
      }]);
      setPendingMarker(null);
      return;
    }
    draw.handleClick(point);
  };

  const onMapMove = (point) => {
    draw.handleMove(point);
  };

  // The context menu closes on the next click anywhere, or on Escape — a menu
  // you cannot dismiss without picking something is worse than no menu.
  useEffect(() => {
    if (!ctxMenu) return undefined;
    const close = () => setCtxMenu(null);
    const key = (e) => { if (e.key === 'Escape') setCtxMenu(null); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', key);
    };
  }, [ctxMenu]);

  // A drag that starts on a route handle must move the handle, so panning is
  // suspended while one is under the cursor.
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.dragging) return;
    if (draw.editTarget || draw.drag) map.dragging.disable();
    else map.dragging.enable();
  }, [draw.editTarget, draw.drag]);

  const onMapDown = (point, e) => { draw.handleDown(point, e); };
  const onMapUp = () => { draw.handleUp(); };

  // --- overlays -----------------------------------------------------------
  const overlays = useMemo(() => {
    const out = [];

    // The user's own pins sit on top of everything: they are the one thing on
    // this map that nobody else published.
    for (const wp of waypoints) {
      out.push({ kind: 'pin', point: [wp.lat, wp.lng], label: wp.name || 'Waypoint', color: wp.color || '#e0c07a' });
    }

    for (const z of draw.zones) {
      if (z.hidden || !z.ring?.length) continue;
      out.push({
        kind: 'polygon',
        ring: z.ring,
        color: z.color,
        active: z.id === draw.activeZoneId,
        fillOpacity: z.id === draw.activeZoneId ? 0.18 : 0.1,
      });
    }

    if (draw.previewRing) {
      out.push({ kind: 'polygon', ring: draw.previewRing, color: '#e0c07a', dashed: true, fillOpacity: 0.08, active: true });
    }

    for (const r of draw.routes) {
      if (r.hidden) continue;
      const pts = routePolyline(r);
      if (pts.length < 2) continue;
      const isActive = r.id === draw.activeRouteId;
      out.push({
        kind: 'line',
        points: pts,
        color: r.color,
        active: isActive,
        // Drawn as a fat translucent stroke so the corridor reads as the
        // catchment area it is, at whatever the current zoom happens to be.
        corridorUnits: isActive && r.radius
          ? (unitsPerMetre ? r.radius * unitsPerMetre : r.radius)
          : 0,
      });
      if (isActive) {
        // Handles you cannot see are handles you cannot grab. When the route is
        // open for editing these are drawn at roughly small-marker size with a
        // dark ring, rather than the 4px pip that vanished into the line.
        const editing = draw.tool !== 'route';
        for (const w of r.waypoints) {
          out.push({
            kind: 'vertex',
            point: [w.y, w.x],
            color: r.color,
            radius: editing ? 7 : 4,
            fill: editing ? '#0d0d0b' : undefined,
          });
        }
      }
    }

    if (draw.previewSegment) {
      out.push({ kind: 'line', points: draw.previewSegment, color: '#e0c07a', dashed: true });
    }

    if (draw.snapTarget) {
      out.push({
        kind: 'vertex',
        point: draw.snapTarget.point,
        color: draw.snapTarget.closes ? '#7a9a5c' : '#e0c07a',
        fill: draw.snapTarget.closes ? '#7a9a5c' : '#0d0d0b',
        radius: 9,
      });
    }

    if (draw.editTarget) {
      // A segment hover means "a click inserts a point HERE", which is a
      // different promise from "this point moves". Same circle in a slightly
      // different colour said neither, so the insert never read as one.
      out.push(draw.editTarget.kind === 'vertex'
        ? { kind: 'vertex', point: draw.editTarget.point, color: '#e0c07a', radius: 8 }
        : { kind: 'insert', point: draw.editTarget.point, color: '#7cd65a' });
    }

    if (calMode && calibration) {
      for (const p of calPairs) {
        out.push({ kind: 'pin', point: [p.y, p.x], label: p.label, color: '#7a9a5c' });
        out.push({ kind: 'vertex', point: project(calibration, p.lat, p.lng), color: '#b4544a', radius: 4 });
      }
      if (pendingMarker) {
        out.push({
          kind: 'vertex',
          point: project(calibration, pendingMarker.lat, pendingMarker.lng),
          color: '#e0c07a',
          radius: 8,
        });
      }
    }

    return out;
  }, [draw.zones, draw.routes, draw.activeZoneId, draw.activeRouteId, draw.previewRing,
    draw.previewSegment, draw.snapTarget, draw.editTarget, unitsPerMetre,
    calMode, calPairs, pendingMarker, calibration, waypoints, draw.tool]);

  if (!unlocked) {
    return (
      <PasswordGate onUnlock={() => {
        // If nothing would stick, say so rather than silently asking again
        // next time — that is indistinguishable from the feature being broken.
        if (!writeUnlock()) showToast('Unlocked, but this browser is blocking storage — you will be asked again');
        setUnlocked(true);
      }}
      />
    );
  }


  const hint = (() => {
    if (calMode) return null;
    if (draw.tool === 'zone-rect') return <>Click one corner, then the opposite corner. <kbd>Esc</kbd> cancels.</>;
    if (draw.tool === 'zone-poly') {
      return (
        <>Click each corner. Click the <b>first point</b> again — or press <kbd>Enter</kbd> — to close it.
          {' '}<kbd>Backspace</kbd> removes the last, <kbd>Esc</kbd> cancels.</>
      );
    }
    if (draw.tool === 'route') {
      return draw.curveArmed ? (
        <><b>Curve armed</b> — scroll to bend, scroll past centre to flip it the other way.
          {' '}Click to commit this waypoint. Bulge {draw.pendingBulge.toFixed(2)}.</>
      ) : (
        <>Click to place a waypoint. Hold <kbd>C</kbd> and scroll to curve the next segment.
          {' '}Click the <b>first waypoint</b> to link back and close the loop.
          {' '}<kbd>Backspace</kbd> undoes a point, <kbd>Enter</kbd> finishes.</>
      );
    }
    // Having a route open and no tool running IS edit mode. This used to be
    // gated on a `routeMode` that nothing ever set, so the one line telling you
    // a mid-route point exists never rendered and the feature looked missing.
    if (activeRoute?.waypoints.length >= 2) {
      return draw.editTarget?.kind === 'segment' ? (
        <><b>Drag here to insert a waypoint</b> between those two points — it stays in order and follows the cursor.</>
      ) : draw.editTarget?.kind === 'vertex' ? (
        <>Drag to move this point · <kbd>Shift</kbd>+click deletes it{draw.editTarget.index === activeRoute.waypoints.length - 1 ? ' · click it to carry on drawing' : ''}.</>
      ) : (
        <>Editing <b>{activeRoute.name}</b> — drag a point to move it, drag the <b>line</b> to insert one mid-route, <kbd>Shift</kbd>+click to delete. <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes.</>
      );
    }
    return null;
  })();

  const panelOpen = (name) => prefs.panels?.[name] ?? false;

  return (
    <div className="eft-map-full">
      <div className="eft-map-stage">
        {loadError ? (
          <div className="eft-empty">Could not load markers for {mapConfig.name} — {loadError}</div>
        ) : !hasMarkers ? (
          <div className="eft-empty">
            <strong>{mapConfig.name}</strong> is scaffolded but its markers are not imported yet.
            <div className="eft-note" style={{ marginTop: 8 }}>
              {mapConfig.mapgenie.id
                ? <>Run <code>npm run eft:markers {mapConfig.key}</code> to pull them in.</>
                : 'No marker source is wired up for this map yet.'}
            </div>
          </div>
        ) : loading ? (
          <div className="eft-empty">Loading {mapConfig.name}…</div>
        ) : (
          <MapCanvas
            key={`${mapKey}-${base}`}
            base={usingTiles ? 'tiles' : 'svg'}
            mapConfig={mapConfig}
            tiles={data?.tiles}
            view={data?.view}
            markers={shownMarkers}
            categories={data?.categories}
            toPoint={null}
            activeFloor={activeFloor}
            found={found}
            markerSize={prefs.markerSize}
            detailZoom={prefs.detailZoom}
            markersInteractive={!drawing && !draw.editTarget}
            overlays={overlays}
            cursor={drawing || calMode ? 'crosshair'
              : draw.editTarget?.kind === 'segment' ? 'copy'
                : draw.editTarget ? 'move' : ''}
            draftWaypoint={draft}
            onDraftMove={({ lat, lng }) => setDraft((d) => (d ? { ...d, lat, lng } : d))}
            onMarkerClick={handleMarkerClick}
            onMapClick={onMapClick}
            onMapMove={onMapMove}
            onMapDown={onMapDown}
            onMapUp={onMapUp}
            onMapRightClick={() => {
              // Cancels a waypoint placement too — same "I'm done" gesture.
              if (draft) { setDraft(null); return; }
              draw.handleRightClick();
            }}
            onReady={(map) => { mapRef.current = map; }}
          />
        )}
      </div>

      {/* Floating chrome. Everything here overlays the map rather than
          shrinking it, so the canvas keeps the whole window. */}
      {/* Both sides fold away behind a single arrow on their own edge, the way
          mapgenie does it. One arrow per side takes the whole side with it —
          the map is the point of this page and everything else is furniture.
          The map menu sits RIGHT and the filter rail LEFT. */}
      {prefs.toolbarOpen ? (
        <div className="eft-map-toolbar">
          <button
            type="button"
            className={`eft-btn eft-btn-sm${mapMenuOpen ? ' eft-is-on' : ''}`}
            onClick={() => setMapMenuOpen((v) => !v)}
            aria-expanded={mapMenuOpen}
          >
            {mapMenuOpen ? '▾' : '▸'} {mapConfig.name}
          </button>
          <input
            className="eft-input eft-input-sm"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 140 }}
          />
        </div>
      ) : null}

      {/* Right edge: the map menu. */}
      <button
        type="button"
        className={`eft-railtab eft-railtab-right${prefs.toolbarOpen ? '' : ' eft-is-closed'}`}
        onClick={() => { setPrefs({ toolbarOpen: !prefs.toolbarOpen }); setMapMenuOpen(false); }}
        aria-expanded={prefs.toolbarOpen}
        title={prefs.toolbarOpen ? 'Hide the map menu' : 'Show the map menu'}
      >
        {prefs.toolbarOpen ? '❯' : '❮'}
      </button>

      {/* Left edge: filters, waypoints, zones, routes. */}
      <button
        type="button"
        className={`eft-railtab eft-railtab-left${prefs.railOpen ? '' : ' eft-is-closed'}`}
        onClick={() => setPrefs({ railOpen: !prefs.railOpen })}
        aria-expanded={prefs.railOpen}
        title={prefs.railOpen ? 'Hide filters, zones and routes' : 'Show filters, zones and routes'}
      >
        {prefs.railOpen ? '❮' : '❯'}
      </button>

      {mapMenuOpen ? (
        <div className="eft-map-menu">
          <div className="eft-map-menu-head">
            <span className="eft-label">Map</span>
            <button type="button" className="eft-btn eft-btn-sm"
              onClick={() => setMapMenuOpen(false)}>✕</button>
          </div>

          <div className="eft-map-picker">
            {MAPS.map((m) => {
              const ready = !!markerLoader(m.key);
              // A map with no mapgenie id ships as basemap only: it opens and
              // takes zones and routes, but nobody publishes pins for it, so
              // it draws on the vector basemap with its known rough edges.
              const basemapOnly = ready && !m.mapgenie.id;
              const title = !ready ? `${m.name} — scaffolded, markers not imported yet`
                : basemapOnly ? `${m.name} — basemap only, no marker source exists yet. Draw your own zones and routes.`
                  : `${m.name} — markers imported`;
              return (
                <button
                  key={m.key}
                  type="button"
                  className={`eft-btn eft-btn-sm${m.key === mapKey ? ' eft-is-on' : ''}`}
                  onClick={() => setPrefs({ lastMap: m.key })}
                  title={title}
                >
                  {m.name}
                  {!ready ? <span className="eft-added-flag" style={{ marginLeft: 6 }}>soon</span> : null}
                  {basemapOnly ? <span className="eft-added-flag" style={{ marginLeft: 6 }}>no pins</span> : null}
                </button>
              );
            })}
          </div>

          <div className="eft-controls" style={{ marginTop: 10 }}>
            <div className="eft-field">
              <span className="eft-label">Marker size</span>
              <Seg
                value={prefs.markerSize}
                onChange={(v) => setPrefs({ markerSize: v })}
                options={[
                  { value: 'small', label: 'S' },
                  { value: 'normal', label: 'M' },
                  { value: 'large', label: 'L' },
                ]}
              />
            </div>

            <div className="eft-field">
              <span className="eft-label">Detail zoom</span>
              <Seg
                value={detailChoice}
                onChange={(v) => setPrefs({ detailZoom: Number(v) })}
                options={[
                  { value: '13', label: '13', title: 'Swap to dots and names a step earlier' },
                  { value: '14', label: '14', title: 'Swap partway in' },
                  { value: '15', label: '15', title: 'Default — keep pins until you are well zoomed in' },
                  { value: '99', label: 'Off', title: 'Always use pins' },
                ]}
              />
              <div className="eft-note">
                Past this zoom, pins become a 3px dot on the exact spot plus the marker name.
              </div>
            </div>

            {/* No basemap toggle. Vector is parked, so offering the choice was
                offering a worse map. A map with tiles uses them; one without
                (Terminal) falls back to the SVG on its own — see the load
                effect, which is now the only thing that sets `base`. */}
            {!usingTiles && mapConfig.floors.length ? (
              <div className="eft-field">
                <span className="eft-label">Floor</span>
                <Seg
                  value={activeFloor || '__base'}
                  onChange={(v) => setActiveFloor(v === '__base' ? null : v)}
                  options={[
                    { value: '__base', label: 'Ground' },
                    ...mapConfig.floors.map((f) => ({ value: f.name, label: f.name })),
                  ]}
                />
              </div>
            ) : null}
          </div>

          <div className="eft-controls" style={{ marginTop: 10 }}>
            <label className="eft-checkline">
              <input type="checkbox" checked={prefs.showFound}
                onChange={(e) => setPrefs({ showFound: e.target.checked })} />
              Show found markers
            </label>
            <label className="eft-checkline">
              <input type="checkbox" checked={prefs.showStats}
                onChange={(e) => setPrefs({ showStats: e.target.checked })} />
              Show stats overlay
            </label>
            {/* Tiles need no calibration, and with the toggle gone this would
                otherwise be a permanently disabled button on every map. */}
            {usingTiles ? null : (
              <button type="button" className={`eft-btn eft-btn-sm${calMode ? ' eft-is-on' : ''}`}
                onClick={() => { setCalMode((v) => !v); setCalPairs([]); setPendingMarker(null); }}
                disabled={!data}
                title="Place two landmarks to solve the projection">
                {calMode ? 'Cancel calibration' : 'Calibrate'}
              </button>
            )}
          </div>

          {!usingTiles ? (
            <div className="eft-note" style={{ marginTop: 8, color: 'var(--eft-orange)' }}>
              No tile basemap exists for {mapConfig.name}, so it draws on the vector map —
              which is known to be rough and is not being worked on.
            </div>
          ) : null}
        </div>
      ) : null}

      {prefs.showStats ? (
        <div className="eft-map-stats">
          <Stat label="Map" value={mapConfig.name}
            sub={usingTiles ? 'mapgenie tiles' : 'tarkov.dev vector'} />
          <Stat label="Shown" value={shownMarkers.length}
            sub={data ? `of ${data.markers.length}` : '—'} />
          <Stat label="Hidden" value={hidden.total}
            sub={hidden.total
              ? `${hidden.byScope.route} route · ${hidden.byScope.zone} zone · ${hidden.byScope.global} map`
              : 'nothing filtered'} />
          <Stat label="Found" value={Object.keys(found).length} tone="green" />
          <Stat label="Scale" value={metresPerUnit ? `${Math.round(metresPerUnit)} m/u` : '—'}
            tone={metresPerUnit ? 'green' : 'red'}
            sub={metresPerUnit ? 'mapgenie distance tool' : 'no scale'} />
        </div>
      ) : null}

      {calMode ? (
        <div className="eft-map-callout">
          <strong>Calibration — {calPairs.length} landmark{calPairs.length === 1 ? '' : 's'} placed.</strong>{' '}
          {pendingMarker
            ? `Now click where "${pendingMarker.title || pendingMarker.id}" actually belongs.`
            : 'Click a marker you can place confidently, then click its true position.'}
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="eft-btn eft-btn-sm eft-is-primary"
              onClick={applyCalibration} disabled={calPairs.length < 2}>
              Solve &amp; save ({calPairs.length}/2)
            </button>
            <button type="button" className="eft-btn eft-btn-sm" onClick={() => setCalPairs([])}
              disabled={!calPairs.length}>Clear landmarks</button>
            {isCalibrated ? (
              <button type="button" className="eft-btn eft-btn-sm eft-is-danger" onClick={resetCalibration}>
                Reset to auto-fit
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {hint ? <div className="eft-map-hint">{hint}</div> : null}

      {ctxMenu ? (
        <div
          className="eft-ctxmenu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="eft-ctxmenu-head">
            <CatIcon icon={ctxMenu.cat.icon} color={ctxMenu.cat.color} />
            <span className="eft-line-text">{ctxMenu.cat.title}</span>
          </div>
          <div className="eft-ctxmenu-label">Add to preset</div>
          {presets.length ? presets.map((p) => {
            const already = p.categories.includes(ctxMenu.cat.id);
            return (
              <button
                key={p.id}
                type="button"
                className="eft-ctxmenu-item"
                disabled={already}
                onClick={() => addToPreset(p.id, ctxMenu.cat.id)}
              >
                {p.title}
                {already ? <span className="eft-note"> already in</span> : null}
              </button>
            );
          }) : <div className="eft-note" style={{ padding: '3px 10px' }}>No presets yet.</div>}
          <button type="button" className="eft-ctxmenu-item eft-is-new"
            onClick={() => newPresetFrom(ctxMenu.cat)}>
            + New preset from this
          </button>
        </div>
      ) : null}

      {prefs.railOpen ? (
        <aside className="eft-map-rail">
          <Panel
            title="Filters"
            flush
            collapsible
            open={panelOpen('filters')}
            onToggle={(v) => setPanel('filters', v)}
            help={(
              <>
                <p>
                  The map-wide layer — the bottom of three tiers. Zones override it inside their
                  outline, and a route&apos;s corridor overrides both.
                </p>
                <p><b>Right-click any category</b> to drop it into a preset.</p>
              </>
            )}
            actions={(
              <>
                <button type="button" className="eft-btn eft-btn-sm"
                  onClick={() => setVisibleCats(new Set((data?.categories || []).map((c) => c.id)))}>
                  All
                </button>
                <button type="button" className="eft-btn eft-btn-sm"
                  onClick={() => setVisibleCats(defaultVisible(data?.categories))}>
                  Reset
                </button>
                <button type="button" className="eft-btn eft-btn-sm" onClick={() => setVisibleCats(new Set())}>
                  None
                </button>
              </>
            )}
          >
            <div className="eft-map-filters">
              {groups.map(([groupName, cats]) => {
                const on = cats.filter((c) => visibleCats.has(c.id)).length;
                return (
                  <div key={groupName} className="eft-map-group">
                    <div className="eft-map-group-head">
                      <span>{groupName}</span>
                      <span className="eft-note">{on}/{cats.length}</span>
                      <button type="button" className="eft-btn eft-btn-sm"
                        onClick={() => setGroup(cats, on < cats.length)}>
                        {on < cats.length ? 'All' : 'None'}
                      </button>
                    </div>
                    {cats.map((c) => (
                      <label
                        key={c.id}
                        className="eft-checkline eft-map-cat"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setCtxMenu({ x: e.clientX, y: e.clientY, cat: c });
                        }}
                      >
                        <input type="checkbox" checked={visibleCats.has(c.id)} onChange={() => toggleCat(c.id)} />
                        <CatIcon icon={c.icon} color={c.color} />
                        <span className="eft-line-text">{c.title}</span>
                        <span className="eft-note">{c.count}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
              {!data ? <div className="eft-empty">No categories loaded.</div> : null}
            </div>
          </Panel>

          <Panel
            title={`My waypoints${waypoints.length ? ` (${waypoints.length})` : ''}`}
            collapsible
            open={panelOpen('waypoints')}
            onToggle={(v) => setPanel('waypoints', v)}
            help={(
              <>
                <p>
                  Your own pins, separate from the route waypoints below. <b>+ Waypoint</b> drops a
                  draggable dot — place it, name it, save it. It lands exactly where you let go,
                  so zoom in for a finer placement.
                </p>
                <p>Click a name to centre the map on it.</p>
                <p>
                  {userId
                    ? 'Synced to your account — the same points on any computer you sign in on.'
                    : 'Saved on this device only. Sign in on the hub to sync them.'}
                </p>
              </>
            )}
            actions={(
              <button type="button" className="eft-btn eft-btn-sm eft-is-primary"
                onClick={startWaypoint} disabled={!!draft}>
                + Waypoint
              </button>
            )}
          >
            {draft ? (
              <div className="eft-wp-form">
                <div className="eft-note eft-note-tight" style={{ marginBottom: 6 }}>
                  Drag the dot on the map, then name it.
                </div>
                <input
                  className="eft-input"
                  autoFocus
                  placeholder="Name this spot…"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitWaypoint(); if (e.key === 'Escape') setDraft(null); }}
                  style={{ width: '100%', marginBottom: 6 }}
                />
                <select
                  className="eft-select"
                  value={draft.catId}
                  onChange={(e) => setDraft((d) => ({ ...d, catId: e.target.value }))}
                  style={{ width: '100%', marginBottom: 6 }}
                >
                  <option value="">No filter — always shown</option>
                  {(data?.categories || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.group} — {c.title}</option>
                  ))}
                </select>
                <div className="eft-note" style={{ marginBottom: 6 }}>
                  {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}
                </div>
                <div className="eft-controls">
                  <button type="button" className="eft-btn eft-btn-sm eft-is-primary" onClick={commitWaypoint}>Save</button>
                  <button type="button" className="eft-btn eft-btn-sm" onClick={recentreDraft}
                    title="Move the dot back to the middle of the current view">Recentre</button>
                  <button type="button" className="eft-btn eft-btn-sm" onClick={() => setDraft(null)}>Cancel</button>
                </div>
              </div>
            ) : null}

            {!waypoints.length && !draft ? (
              <div className="eft-empty">No waypoints on {mapConfig.name} yet.</div>
            ) : null}

            {waypoints.length ? (
              <ul className="eft-linelist">
                {waypoints.map((wp) => (
                  <li key={wp.id}>
                    <span className="eft-swatch" style={{ background: wp.color || '#e0c07a' }} />
                    <button
                      type="button"
                      className="eft-line-text eft-wp-jump"
                      title="Centre the map on this waypoint"
                      onClick={() => mapRef.current?.panTo([wp.lat, wp.lng])}
                    >
                      {wp.name}
                    </button>
                    <button type="button" className="eft-iconbtn" title="Move or rename"
                      onClick={() => setDraft({ ...wp })}>✎</button>
                    <button type="button" className="eft-iconbtn" title="Delete this waypoint"
                      onClick={() => removeWaypoint(wp.id)}>×</button>
                  </li>
                ))}
              </ul>
            ) : null}

            {waypoints.length && !userId ? (
              <div className="eft-note eft-note-tight" style={{ marginTop: 8 }}>
                This device only — sign in on the hub to sync.
              </div>
            ) : null}
          </Panel>

          <ZonePanel
            zones={draw.zones}
            categories={data?.categories || []}
            visibleCats={visibleCats}
            activeZoneId={draw.activeZoneId}
            tool={draw.tool}
            hiddenByZone={hidden.byScope.zone}
            open={panelOpen('zones')}
            onToggleOpen={(v) => setPanel('zones', v)}
            onSetTool={draw.setTool}
            onSelect={draw.setActiveZoneId}
            onUpdate={draw.updateZone}
            onRemove={draw.removeZone}
            onMove={draw.moveZone}
          />

          <RoutePanel
            routes={draw.routes}
            categories={data?.categories || []}
            visibleCats={visibleCats}
            activeRouteId={draw.activeRouteId}
            tool={draw.tool}
            metresPerUnit={metresPerUnit}
            mergeTolerance={draw.mergeTolerance}
            minMergePoints={draw.minMergePoints}
            canUndo={draw.canUndo}
            canRedo={draw.canRedo}
            open={panelOpen('routes')}
            onToggleOpen={(v) => setPanel('routes', v)}
            onNew={draw.newRoute}
            onSelect={(id) => {
              // Clearing the tool is the fix for "clicking edit made me start a
              // new line": `tool` is global, so it stayed on 'route' from the
              // last route you drew and the next map click extended this one.
              draw.setTool(null);
              draw.setActiveRouteId(id);
            }}
            onUpdate={draw.updateRoute}
            onRemove={draw.removeRoute}
            onClear={draw.clearRoute}
            onSetTool={draw.setTool}
            onUndo={draw.undo}
            onRedo={draw.redo}
            onJoin={draw.joinTo}
            savedRoutes={draw.savedRoutes}
            onSaveAs={draw.saveRouteAs}
            onUpdateSaved={draw.updateSavedFrom}
            onRenameSaved={draw.renameSavedRoute}
            onDeleteSaved={draw.deleteSavedRoute}
            onLoadSaved={draw.loadSavedRoute}
          />

          {routeFilter ? (
            <ManifestPanel
              manifest={manifest}
              categories={data?.categories || []}
              route={activeRoute}
              metresPerUnit={metresPerUnit}
              open={panelOpen('manifest')}
              onToggleOpen={(v) => setPanel('manifest', v)}
              onFocus={(m) => mapRef.current?.panTo([m.y, m.x])}
            />
          ) : null}

          <Panel
            title={`Presets${presets.length ? ` (${presets.length})` : ''}`}
            collapsible
            open={panelOpen('presets')}
            onToggle={(v) => setPanel('presets', v)}
            help={(
              <p>
                A preset is a bundle of filter categories. <b>Right-click a category</b> in Filters
                to add it to one. A preset adds and removes only its own categories, so more than
                one can be on at a time.
              </p>
            )}
          >
            {presets.length ? presets.map((p) => (
              <div key={p.id} className="eft-preset-row">
                <button
                  type="button"
                  className={`eft-btn eft-btn-sm${presetActive(p) ? ' eft-is-on' : ''}`}
                  onClick={() => togglePreset(p)}
                  aria-pressed={presetActive(p)}
                  title={`${presetActive(p) ? 'Hide' : 'Show'} ${p.categories.length} categories`}
                  style={{ flex: 1, textAlign: 'left' }}
                >
                  {presetActive(p) ? '■' : '□'} {p.title}
                  <span className="eft-note" style={{ marginLeft: 6 }}>{p.categories.length}</span>
                </button>
                <button type="button" className="eft-btn eft-btn-sm eft-is-danger"
                  onClick={() => removePreset(p.id)} title="Delete this preset">×</button>
              </div>
            )) : (
              <div className="eft-empty">
                No presets. Right-click any filter to start one.
              </div>
            )}
          </Panel>
        </aside>
      ) : null}
    </div>
  );
}
