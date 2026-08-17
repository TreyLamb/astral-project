import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { spriteMarkerLayer, MARKER_SCALES } from './SpriteMarkerLayer';
import { labelStyle, autoLabel, hasPin } from './eftMapLabels';

// Two basemaps, two coordinate systems:
//
//   'tiles' — mapgenie's tile pyramid. Standard EPSG:3857 Web Mercator, open
//             and unauthenticated, so Leaflet's DEFAULT CRS renders it and the
//             source's own lat/lngs land on it exactly. No calibration.
//   'svg'   — tarkov.dev's open vector maps. Their own flat coordinate space,
//             so CRS.Simple plus a per-map calibration to place markers.
//
// Leaflet fixes its CRS at construction, so the caller remounts this component
// (via `key`) when the basemap changes rather than trying to swap it in place.
//
// Markers are drawn by SpriteMarkerLayer into its own pane, which sits BELOW
// the overlay pane so routes and zones stay legible over a dense field of pins.

const SVG_CACHE = new Map();
const SPRITE_PANE = 'eftSprites';

async function loadSvg(url) {
  if (!SVG_CACHE.has(url)) {
    SVG_CACHE.set(url, fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((t) => new DOMParser().parseFromString(t, 'image/svg+xml').documentElement)
      .catch((err) => { SVG_CACHE.delete(url); throw err; }));
  }
  return (await SVG_CACHE.get(url)).cloneNode(true);
}

export default function MapCanvas({
  base,
  mapConfig,
  tiles,
  view,
  markers,
  categories,
  toPoint,
  activeFloor,
  found,
  markerSize = 'normal',
  detailZoom,
  markersInteractive = true,
  overlays,
  cursor,
  draftWaypoint,
  onDraftMove,
  onMarkerClick,
  onMapClick,
  onMapMove,
  onMapDown,
  onMapUp,
  onMapRightClick,
  onReady,
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const spriteRef = useRef(null);
  const overlayLayerRef = useRef(null);
  const overlaysRef = useRef([]);
  const baseRef = useRef(null);
  const tipRef = useRef(null);
  const draftRef = useRef(null);
  const s = useRef({});

  s.current = {
    markers, categories, found, toPoint, markersInteractive,
    onMarkerClick, onMapClick, onMapMove, onMapDown, onMapUp, onDraftMove,
    onMapRightClick,
  };

  const showTip = useCallback((marker, containerPoint) => {
    const tip = tipRef.current;
    if (!tip) return;
    if (!marker) { tip.style.display = 'none'; return; }
    const byCat = new Map((s.current.categories || []).map((c) => [c.id, c]));
    const cat = byCat.get(marker.cat);
    tip.innerHTML = `<strong>${marker.title || cat?.title || 'Marker'}</strong>`
      + (marker.desc ? `<span>${marker.desc}</span>` : '')
      + (cat ? `<em>${cat.group} — ${cat.title}</em>` : '');
    tip.style.display = 'block';
    tip.style.left = `${containerPoint.x}px`;
    tip.style.top = `${containerPoint.y}px`;
  }, []);

  useEffect(() => {
    if (mapRef.current || !hostRef.current) return undefined;

    const map = L.map(hostRef.current, {
      crs: base === 'svg' ? L.CRS.Simple : L.CRS.EPSG3857,
      minZoom: base === 'svg' ? -6 : (tiles?.minZoom ?? 8),
      maxZoom: base === 'svg' ? 6 : (tiles?.maxZoom ?? 16),
      zoomSnap: 0.25,
      attributionControl: false,
      // The top-left corner belongs to the floating map toolbar.
      zoomControl: false,
      preferCanvas: true,
      // Web Mercator wraps the globe; these maps do not.
      worldCopyJump: false,
      maxBoundsViscosity: 1,
    });
    mapRef.current = map;
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Below overlayPane (400) so drawn zones and routes sit over the pins.
    map.createPane(SPRITE_PANE).style.zIndex = 380;

    spriteRef.current = spriteMarkerLayer({ pane: SPRITE_PANE }).addTo(map);
    overlayLayerRef.current = L.layerGroup().addTo(map);

    const hit = (e) => (s.current.markersInteractive
      ? spriteRef.current?.hitTest(e.containerPoint)
      : null);

    map.on('click', (e) => {
      const marker = hit(e);
      if (marker) s.current.onMarkerClick?.(marker, e.originalEvent);
      else s.current.onMapClick?.([e.latlng.lat, e.latlng.lng], e.originalEvent);
    });
    map.on('mousedown', (e) => s.current.onMapDown?.([e.latlng.lat, e.latlng.lng], e.originalEvent, hit(e)));
    map.on('mouseup', (e) => s.current.onMapUp?.([e.latlng.lat, e.latlng.lng], e.originalEvent));
    map.on('mousemove', (e) => {
      showTip(hit(e), e.containerPoint);
      s.current.onMapMove?.([e.latlng.lat, e.latlng.lng], e.originalEvent);
    });
    map.on('mouseout', () => showTip(null));
    // Right-click is "I'm done" — Leaflet fires `contextmenu` for it, and the
    // browser menu is suppressed so the gesture only means the one thing.
    map.on('contextmenu', (e) => {
      e.originalEvent?.preventDefault();
      s.current.onMapRightClick?.([e.latlng.lat, e.latlng.lng], e.originalEvent);
    });

    onReady?.(map);

    return () => { map.remove(); mapRef.current = null; spriteRef.current = null; };
    // Mounts once per basemap; handlers read through the ref so a changed
    // callback never tears down the Leaflet instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base]);

  // --- basemap ------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    if (baseRef.current) { map.removeLayer(baseRef.current); baseRef.current = null; }

    let cancelled = false;

    if (base === 'tiles' && tiles?.url) {
      baseRef.current = L.tileLayer(tiles.url, {
        minZoom: tiles.minZoom ?? 8,
        maxZoom: tiles.maxZoom ?? 16,
        maxNativeZoom: tiles.maxZoom ?? 16,
        noWrap: true,
      }).addTo(map);
      // Fit the playable area to the window rather than using the source's
      // start position and zoom. Theirs is tuned to their own viewport and
      // leaves this one with dead space around a small map.
      //
      // Percentile bounds, not min/max: mapgenie ships stray prompt markers
      // (e.g. "Black Division") far outside the map, and one of those would
      // zoom the whole thing out to nothing.
      const pts = s.current.markers || [];
      if (pts.length > 20) {
        const pct = (arr, p) => arr[Math.floor((arr.length - 1) * p)];
        const lats = pts.map((m) => m.lat).sort((a, b) => a - b);
        const lngs = pts.map((m) => m.lng).sort((a, b) => a - b);
        map.fitBounds(
          L.latLngBounds(
            [pct(lats, 0.02), pct(lngs, 0.02)],
            [pct(lats, 0.98), pct(lngs, 0.98)],
          ),
          { padding: [10, 10] },
        );
      } else if (Number.isFinite(view?.lat) && Number.isFinite(view?.lng)) {
        map.setView([view.lat, view.lng], view.zoom ?? tiles.minZoom ?? 11);
      }
    } else if (base === 'svg' && mapConfig?.svgPath) {
      const bounds = mapConfig.bounds
        ? L.latLngBounds(mapConfig.bounds[0], mapConfig.bounds[1])
        : L.latLngBounds([0, 0], [1000, 1000]);
      loadSvg(mapConfig.svgPath).then((svg) => {
        if (cancelled || !mapRef.current) return;
        // Floors are named groups in one document, so switching is a
        // visibility toggle rather than a refetch.
        const wanted = activeFloor
          ? (mapConfig.floors || []).find((f) => f.name === activeFloor)?.svgLayer
          : mapConfig.svgLayer;
        if (wanted) {
          for (const g of svg.querySelectorAll(':scope > g[id]')) {
            g.style.display = g.id === wanted ? '' : 'none';
          }
        }
        svg.setAttribute('preserveAspectRatio', 'none');
        baseRef.current = L.svgOverlay(svg, bounds, { interactive: false }).addTo(map);
        map.fitBounds(bounds);
      }).catch((err) => {
        console.warn(`EFT map: could not load ${mapConfig.svgPath} — ${err.message}`);
      });
    }

    return () => { cancelled = true; };
  }, [base, tiles, view, mapConfig, activeFloor]);

  // --- markers ------------------------------------------------------------
  useEffect(() => {
    const layer = spriteRef.current;
    if (!layer) return;
    const byCat = new Map((categories || []).map((c) => [c.id, c]));
    const items = [];
    for (const m of markers || []) {
      // Callers that filter in map units hand over already-projected markers;
      // the raw source shape is the fallback.
      const point = toPoint ? toPoint(m) : [m.y ?? m.lat, m.x ?? m.lng];
      if (!point || point[0] == null || point[1] == null) continue;
      const cat = byCat.get(m.cat);
      items.push({
        marker: m,
        point,
        colour: cat?.color ? `#${String(cat.color).replace('#', '')}` : '#cdbb96',
        dim: !!found?.[m.id],
        // The source decides pin vs place-name per category, not us.
        pin: hasPin(cat?.displayType),
        label: labelStyle(m, cat),
        // Only used past the detail zoom, where pins become dots + names.
        auto: autoLabel(m, cat),
      });
    }
    layer.setScale(MARKER_SCALES[markerSize] ?? MARKER_SCALES.normal);
    layer.setDetailZoom(detailZoom);
    layer.setItems(items);
  }, [markers, categories, found, toPoint, markerSize, detailZoom]);

  // --- overlays -----------------------------------------------------------
  // A corridor is a real distance on the ground, so its stroke width has to be
  // recomputed from the current zoom rather than stored as a pixel count.
  const drawOverlays = useCallback(() => {
    const layer = overlayLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    const unitsToPixels = (units, near) => {
      if (!units) return 0;
      const a = map.latLngToLayerPoint(near);
      const b = map.latLngToLayerPoint([near[0] + units, near[1]]);
      return Math.abs(b.y - a.y);
    };

    for (const o of overlaysRef.current || []) {
      if (o.kind === 'polygon' && o.ring?.length >= 3) {
        layer.addLayer(L.polygon(o.ring, {
          color: o.color || '#e0c07a',
          weight: o.active ? 2 : 1,
          fillOpacity: o.fillOpacity ?? 0.12,
          dashArray: o.dashed ? '5,5' : undefined,
          interactive: false,
        }));
      } else if (o.kind === 'line' && o.points?.length >= 2) {
        // Diameter, so a 40 m radius reads as an 80 m band.
        const corridorPx = unitsToPixels(o.corridorUnits, o.points[0]) * 2;
        if (corridorPx > 1) {
          layer.addLayer(L.polyline(o.points, {
            color: o.color || '#e0c07a',
            weight: corridorPx,
            opacity: 0.16,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
          }));
        }
        layer.addLayer(L.polyline(o.points, {
          color: o.color || '#e0c07a',
          weight: o.active ? 3 : 2,
          dashArray: o.dashed ? '6,6' : undefined,
          interactive: false,
        }));
      } else if (o.kind === 'vertex') {
        layer.addLayer(L.circleMarker(o.point, {
          radius: o.radius || 5,
          weight: 2,
          color: o.color || '#e0c07a',
          fillColor: o.fill || '#0d0d0b',
          fillOpacity: 1,
          interactive: false,
        }));
      } else if (o.kind === 'pin') {
        layer.addLayer(L.circleMarker(o.point, {
          radius: 7,
          weight: 2,
          color: o.color || '#7a9a5c',
          fillColor: '#0d0d0b',
          fillOpacity: 0.8,
          interactive: false,
        }).bindTooltip(o.label || '', { permanent: true, direction: 'right' }));
      } else if (o.kind === 'label' && o.point) {
        layer.addLayer(L.marker(o.point, {
          interactive: false,
          icon: L.divIcon({ className: 'eft-map-label', html: o.label || '', iconSize: null }),
        }));
      }
    }
  }, []);

  useEffect(() => {
    overlaysRef.current = overlays;
    drawOverlays();
  }, [overlays, drawOverlays]);

  // --- the draft waypoint -------------------------------------------------
  // Deliberately NOT an overlay. Overlays are non-interactive and get cleared
  // and rebuilt on every zoom, which would drop a marker mid-drag. This is one
  // real Leaflet marker with its own lifecycle, so `draggable` actually works
  // and the position is exact to wherever it is let go — the tighter you zoom,
  // the finer the latlng you get, with no snapping of any kind.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    if (!draftWaypoint) return undefined;

    const marker = L.marker([draftWaypoint.lat, draftWaypoint.lng], {
      draggable: true,
      autoPan: true,
      zIndexOffset: 1000,
      icon: L.divIcon({ className: 'eft-wp-draft', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
    }).addTo(map);

    marker.on('drag', (e) => {
      const { lat, lng } = e.target.getLatLng();
      s.current.onDraftMove?.({ lat, lng }, { live: true });
    });
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      s.current.onDraftMove?.({ lat, lng }, { live: false });
    });

    draftRef.current = marker;
    return () => { map.removeLayer(marker); draftRef.current = null; };
    // Only the draft appearing or disappearing rebuilds it. Position updates
    // while dragging must not, or the marker is torn out from under the cursor.
  }, [!draftWaypoint]); // eslint-disable-line react-hooks/exhaustive-deps

  // Moving the draft from outside (the "recentre" button) still has to move the
  // marker, but never while the user is the one dragging it.
  useEffect(() => {
    const marker = draftRef.current;
    if (!marker || !draftWaypoint || marker.dragging?.moving?.()) return;
    const at = marker.getLatLng();
    if (Math.abs(at.lat - draftWaypoint.lat) < 1e-12 && Math.abs(at.lng - draftWaypoint.lng) < 1e-12) return;
    marker.setLatLng([draftWaypoint.lat, draftWaypoint.lng]);
  }, [draftWaypoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    map.on('zoomend', drawOverlays);
    return () => { map.off('zoomend', drawOverlays); };
  }, [drawOverlays, base]);

  useEffect(() => {
    if (hostRef.current) hostRef.current.style.cursor = cursor || '';
  }, [cursor]);

  return (
    <div className="eft-map-host">
      <div ref={hostRef} className="eft-map-canvas" />
      <div ref={tipRef} className="eft-map-tip" />
    </div>
  );
}
