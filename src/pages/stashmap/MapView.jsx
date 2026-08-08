import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStashMap } from './stashmapContext';
import {
  buildBreadcrumb, computeCellRect, categoryColor, zoneAbs, zoneRel, roomsBounds, ROOM_COLORS,
} from './stashmapConfig';
import DupeFlag from './DupeFlag';
import {
  screenToSvgPoint, snapToGrid, snapEdge, resizeCorner, clampPosition, clampRect, clamp,
  DRAG_THRESHOLD, MIN_ROOM_SIZE, MIN_ZONE_SIZE, CANVAS_MAX,
} from './stashmapCanvas';

const HOVER_CARD_WIDTH = 260;
const ITEM_DND_TYPE = 'application/x-stashmap-item';

// Free-zoom limits in viewBox units. 60 puts a single grid cell across the
// screen; 3000 pulls back far enough to see the house with room to spare.
const MIN_VIEW = 60;
const MAX_VIEW = 3000;
// Breathing room around the framed content, in canvas units. Proportional so
// it reads the same whether the house spans 200 units or 900, with a floor so
// a tiny plan still doesn't touch the border.
function framePad(rect) {
  return Math.max(12, Math.min(rect.w, rect.h) * 0.03);
}

function padRect(rect, pad) {
  return { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 };
}

// Grows a rect to the viewport's aspect ratio so the viewBox never
// letterboxes — which is what keeps wheel-zoom anchored under the cursor.
// Only needed when framing something whose shape differs from the element's
// (a single room or zone); the whole-house frame matches by construction,
// because the element is sized to the rooms' own aspect ratio.
function fitRect(rect, pad, aspect) {
  const x = rect.x - pad;
  const y = rect.y - pad;
  const w = rect.w + pad * 2;
  const h = rect.h + pad * 2;
  let vw = w;
  let vh = h;
  if (w / h > aspect) vh = w / aspect;
  else vw = h * aspect;
  return { x: x - (vw - w) / 2, y: y - (vh - h) / 2, w: vw, h: vh };
}

function PropertiesPanel({ selType, obj, itemCount, actions, onDeselect, onDelete, onDuplicate }) {
  const isZone = selType === 'zone';

  // Plain field writes on both types now: a room's x/y is not part of a
  // zone's stored position, so moving a room can't strand anything.
  const updateField = (field, value) => {
    if (isZone) actions.updateZone(obj.id, { [field]: value });
    else actions.updateRoom(obj.id, { [field]: value });
  };

  return (
    <div className="stash-properties-panel">
      <div className="stash-focused-item-header">
        <span className="stash-section-label">{isZone ? 'Zone' : 'Room'} Properties</span>
        <button type="button" className="stash-icon-btn" onClick={onDeselect} aria-label="Deselect">×</button>
      </div>

      <label className="stash-field">
        <span>Name</span>
        <input className="stash-input" value={obj.name} onChange={(e) => updateField('name', e.target.value)} />
      </label>

      {isZone && (
        <label className="stash-field">
          <span>
            Capacity
            {obj.capacity != null && <span className="stash-usage-note"> ({itemCount}/{obj.capacity} used)</span>}
          </span>
          <input
            className="stash-input"
            type="number"
            min="0"
            placeholder="No limit"
            value={obj.capacity ?? ''}
            onChange={(e) => updateField('capacity', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))}
          />
        </label>
      )}

      {isZone && (
        <>
          <label className="stash-checkbox-field">
            <input
              type="checkbox"
              checked={!!obj.grid}
              onChange={(e) => updateField('grid', e.target.checked ? { rows: 2, cols: 2 } : null)}
            />
            <span>Has grid</span>
          </label>
          {obj.grid && (
            <div className="stash-field-row">
              <label className="stash-field stash-field-tiny">
                <span>Rows</span>
                <input
                  className="stash-input"
                  type="number"
                  min="1"
                  value={obj.grid.rows}
                  onChange={(e) => updateField('grid', { ...obj.grid, rows: Math.max(1, Number(e.target.value) || 1) })}
                />
              </label>
              <label className="stash-field stash-field-tiny">
                <span>Cols</span>
                <input
                  className="stash-input"
                  type="number"
                  min="1"
                  value={obj.grid.cols}
                  onChange={(e) => updateField('grid', { ...obj.grid, cols: Math.max(1, Number(e.target.value) || 1) })}
                />
              </label>
            </div>
          )}
        </>
      )}

      {!isZone && (
        <div className="stash-field">
          <span>Color</span>
          <div className="stash-color-swatches">
            {ROOM_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`stash-swatch${obj.color === color ? ' stash-swatch-active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => updateField('color', color)}
                aria-label={`Set room color ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="stash-coord-fields">
        {['x', 'y', 'w', 'h'].map((field) => (
          <label key={field} className="stash-field stash-field-tiny">
            {/* A zone's X/Y is an offset from its room's corner. */}
            <span>{isZone && (field === 'x' || field === 'y') ? `${field.toUpperCase()} in room` : field.toUpperCase()}</span>
            <input
              className="stash-input"
              type="number"
              value={Math.round(obj[field])}
              onChange={(e) => updateField(field, Number(e.target.value) || 0)}
            />
          </label>
        ))}
      </div>

      <div className="stash-form-actions">
        <button type="button" className="stash-btn" onClick={() => onDuplicate(selType, obj)}>Duplicate</button>
        <button type="button" className="stash-btn stash-btn-danger" onClick={() => onDelete(selType, obj)}>Delete</button>
      </div>
    </div>
  );
}

// Dashboard-mode "what's in this section" card. Anchored to the hovered SVG
// shape's screen rect and rendered as fixed-position HTML rather than inside
// the SVG, so its text stays at a readable size no matter how far the viewBox
// is zoomed into a room.
function HoverCard({ hover, dupeFlags }) {
  const { anchor, title, subtitle, items } = hover;
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - HOVER_CARD_WIDTH - 12));
  const below = anchor.bottom + 10;
  const fitsBelow = window.innerHeight - anchor.bottom > 240;
  const top = fitsBelow ? below : Math.max(8, anchor.top - 240);

  return (
    <div className="stash-map-hovercard" style={{ top, left }}>
      <div className="stash-map-hovercard-title">{title}</div>
      <div className="stash-map-hovercard-sub">{subtitle}</div>
      {items.length === 0 ? (
        <div className="stash-map-hovercard-empty">Nothing stored here.</div>
      ) : (
        <ul className="stash-map-hovercard-list">
          {items.slice(0, 12).map((item) => (
            <li key={item.id} className="stash-map-hovercard-item">
              <span className="stash-color-dot" style={{ background: categoryColor(item.category) }} />
              <span className="stash-map-hovercard-name">{item.name}</span>
              {dupeFlags.get(item.id) && (
                <span className="stash-map-hovercard-dupe" title="Also stored elsewhere">⚑</span>
              )}
              <span className="stash-item-qty">×{item.quantity}</span>
            </li>
          ))}
          {items.length > 12 && (
            <li className="stash-map-hovercard-more">+{items.length - 12} more…</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function MapView() {
  const { rooms, zones, items, settings, selectedItemId, focusToken, duplicates, actions } = useStashMap();
  const [focusedRoomId, setFocusedRoomId] = useState(null);
  const [focusedZoneId, setFocusedZoneId] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null);

  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null); // { type: 'room'|'zone', id }
  const [draft, setDraft] = useState(null); // live drag/resize override: { type, id, x, y, w, h }
  const [guides, setGuides] = useState(null); // { x, y } snap guide lines while dragging
  const [snapEnabled, setSnapEnabled] = useState(true);
  // Properties start closed on purpose: this view's job is reading what's in a
  // space, not recolouring it. See the dock at the bottom of the side column.
  const [propsOpen, setPropsOpen] = useState(false);
  const [hover, setHover] = useState(null); // dashboard-mode section preview
  const [dropTarget, setDropTarget] = useState(null); // { zoneId, row, col } | { roomId }
  const [reparentRoomId, setReparentRoomId] = useState(null); // room a dragged zone would land in

  // The camera. Held as explicit viewBox state rather than derived from the
  // focused room, so wheel-zoom and pan are first-class and clicking a room
  // just moves the camera instead of being the only way to move it.
  // The box the rooms actually occupy. The plan is framed to THIS, not to the
  // fixed 1000x1000 canvas — the canvas is a working space, not a scale, and
  // framing the canvas is what previously drew the house small and centred
  // inside a sea of empty grid.
  const bounds = useMemo(() => roomsBounds(rooms), [rooms]);

  const [view, setView] = useState(() => {
    const b = roomsBounds(rooms);
    return padRect(b, framePad(b));
  });
  const aspectRef = useRef(bounds.w / bounds.h);
  const panRef = useRef(null);

  // Measured purely to keep wheel-zoom and room framing aspect-correct. It no
  // longer sets the view: the element carries the content's aspect ratio, so
  // the initial frame is exact without measuring anything.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) aspectRef.current = width / height;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitView = useCallback((rect, pad) => (
    fitRect(rect, pad ?? framePad(rect), aspectRef.current)
  ), []);

  const frameWholeHouse = useCallback(() => {
    const b = roomsBounds(rooms);
    setView(padRect(b, framePad(b)));
  }, [rooms]);

  const zoomBy = useCallback((factor, anchor) => {
    setView((v) => {
      const w = clamp(v.w * factor, MIN_VIEW, MAX_VIEW);
      const k = w / v.w;
      const cx = anchor ? anchor.x : v.x + v.w / 2;
      const cy = anchor ? anchor.y : v.y + v.h / 2;
      return { x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, w, h: v.h * k };
    });
  }, []);

  // Native listener, not onWheel: React registers wheel passively on the root,
  // so preventDefault from a synthetic handler wouldn't stop the page scroll.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      zoomBy(Math.exp(e.deltaY * 0.0015), screenToSvgPoint(el, e.clientX, e.clientY));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const mode = settings.mapMode === 'edit' ? 'edit' : 'dashboard';
  const isEdit = mode === 'edit';
  const showLabels = !!settings.mapLabels;
  const stashOpen = settings.mapStashOpen !== false;

  const setMode = (next) => {
    actions.updateSettings({ mapMode: next });
    setHover(null);
    if (next === 'dashboard') {
      setSelected(null);
      setPropsOpen(false);
    }
  };

  // Auto-frame + select whatever focusItemOnMap pointed us at. focusToken
  // (not just selectedItemId) is in the deps so re-clicking the same item's
  // "show on map" button still re-frames it. items is intentionally left
  // out — an unrelated item edit shouldn't yank the camera back.
  useEffect(() => {
    if (!selectedItemId) return;
    const item = items.find((i) => i.id === selectedItemId);
    if (!item || !item.roomId) return;
    setFocusedRoomId(item.roomId);
    setFocusedZoneId(item.zoneId || null);
    setFocusedCell(item.cell || null);
    const zone = zones.find((z) => z.id === item.zoneId);
    const room = rooms.find((r) => r.id === item.roomId);
    if (zone && room) setView(fitView(zoneAbs(zone, room), 20));
    else if (room) setView(fitView(room));
  }, [selectedItemId, focusToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrow-key nudge for whatever's selected on the canvas — edit mode only,
  // since dashboard mode has no selection to move. Ignored while focus is
  // inside a text field (e.g. typing in the properties panel).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { setSelected(null); return; }
      if (!isEdit || !selected) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;
      e.preventDefault();
      const list = selected.type === 'room' ? rooms : zones;
      const obj = list.find((o) => o.id === selected.id);
      if (!obj) return;
      if (selected.type === 'room') {
        actions.updateRoom(obj.id, clampPosition(obj.x + dx, obj.y + dy, obj.w, obj.h));
      } else {
        // A zone's x/y is an offset inside its room, so the canvas clamp
        // doesn't apply — the room is what bounds it.
        actions.updateZone(obj.id, { x: obj.x + dx, y: obj.y + dy });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, rooms, zones, actions, isEdit]);

  const focusedRoom = rooms.find((r) => r.id === focusedRoomId) || null;
  const focusedZone = zones.find((z) => z.id === focusedZoneId) || null;
  const highlightedItem = items.find((i) => i.id === selectedItemId) || null;

  const viewBox = `${view.x} ${view.y} ${view.w} ${view.h}`;

  const handleRoomClick = (room) => {
    setFocusedRoomId(room.id);
    setFocusedZoneId(null);
    setFocusedCell(null);
    setView(fitView(room));
  };

  const handleZoneClick = (zone) => {
    setFocusedRoomId(zone.roomId);
    setFocusedZoneId(zone.id);
    setFocusedCell(null);
    setView(fitView(getZoneRect(zone), 20));
  };

  const handleCellClick = (zone, row, col) => {
    setFocusedRoomId(zone.roomId);
    setFocusedZoneId(zone.id);
    setFocusedCell({ row, col });
  };

  // Deliberately does NOT clear `selected` — so a room selected while
  // zoomed in stays selected once you back out to whole-house, letting you
  // drag it relative to the other rooms without re-selecting it.
  const handleWholeHouse = useCallback(() => {
    setFocusedRoomId(null);
    setFocusedZoneId(null);
    setFocusedCell(null);
    frameWholeHouse();
  }, [frameWholeHouse]);

  const handleBackToRoom = () => {
    setFocusedZoneId(null);
    setFocusedCell(null);
    if (focusedRoom) setView(fitView(focusedRoom));
  };


  // Clicking any dead space — the letterboxing around the plan, the padding
  // in the map column, the canvas backdrop — zooms back out. Reaching for the
  // "Whole House" button on every single exit was the friction here; the
  // button stays as the explicit affordance, this is the fluid path.
  const handleBackdropClick = (e) => {
    if (e.target.closest('.stash-keep-focus')) return;
    handleWholeHouse();
    setSelected(null);
  };

  const itemsInZone = (zoneId) => items.filter((i) => i.zoneId === zoneId);
  const itemsInCell = (zoneId, row, col) => items.filter((i) => (
    i.zoneId === zoneId && i.cell && i.cell.row === row && i.cell.col === col
  ));
  const itemsInRoom = (roomId) => items.filter((i) => i.roomId === roomId);

  // ---- dashboard hover previews ----

  const openHover = (e, payload) => {
    if (!payload) return;
    setHover({ ...payload, anchor: e.currentTarget.getBoundingClientRect() });
  };

  const roomHover = (room) => ({
    title: room.name,
    subtitle: `${itemsInRoom(room.id).length} items · ${zones.filter((z) => z.roomId === room.id).length} zones`,
    items: itemsInRoom(room.id),
  });

  const zoneHover = (zone) => {
    const zoneItems = itemsInZone(zone.id);
    const capacity = zone.capacity != null ? ` · ${zoneItems.length}/${zone.capacity} used` : '';
    return {
      title: zone.name,
      subtitle: `${zoneItems.length} item${zoneItems.length === 1 ? '' : 's'}${capacity}`,
      items: zoneItems,
    };
  };

  const cellHover = (zone, row, col) => {
    const cellItems = itemsInCell(zone.id, row, col);
    return {
      title: `${zone.name} · R${row + 1}·C${col + 1}`,
      subtitle: `${cellItems.length} item${cellItems.length === 1 ? '' : 's'} in this cell`,
      items: cellItems,
    };
  };

  // ---- direct manipulation: select / drag / resize (edit mode only) ----

  const getRoomRect = useCallback((room) => (
    draft && draft.type === 'room' && draft.id === room.id ? draft : room
  ), [draft]);
  // Absolute rect for a zone, resolved against wherever its room is CURRENTLY
  // drawn — including a live drag draft. That single indirection is what makes
  // shelves track a moving or resizing room with no per-call-site bookkeeping.
  // A zone's own draft is already absolute, because the drag math runs in
  // absolute space; it's converted back to an offset on drop.
  const getZoneRect = useCallback((zone) => {
    if (draft && draft.type === 'zone' && draft.id === zone.id) {
      return { ...zone, x: draft.x, y: draft.y, w: draft.w, h: draft.h };
    }
    const room = rooms.find((r) => r.id === zone.roomId);
    const roomRect = room
      ? (draft && draft.type === 'room' && draft.id === room.id ? draft : room)
      : null;
    return zoneAbs(zone, roomRect);
  }, [draft, rooms]);

  // All in absolute coords — snapping happens during the drag, which runs in
  // absolute space regardless of how the zone is stored.
  function siblingEdges(type, obj) {
    const xs = [0, CANVAS_MAX];
    const ys = [0, CANVAS_MAX];
    if (type === 'room') {
      rooms.filter((r) => r.id !== obj.id).forEach((o) => {
        xs.push(o.x, o.x + o.w);
        ys.push(o.y, o.y + o.h);
      });
    } else {
      zones.filter((z) => z.roomId === obj.roomId && z.id !== obj.id).forEach((z) => {
        const a = getZoneRect(z);
        xs.push(a.x, a.x + a.w);
        ys.push(a.y, a.y + a.h);
      });
      const room = rooms.find((r) => r.id === obj.roomId);
      if (room) { xs.push(room.x, room.x + room.w); ys.push(room.y, room.y + room.h); }
    }
    return { xs, ys };
  }

  // Which room a dragged zone's centre currently sits over. Centre rather
  // than top-left so a bin that visually overlaps two rooms lands in the one
  // it's mostly inside.
  function roomUnderRect(rect, excludeId) {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    return rooms.find((r) => (
      r.id !== excludeId && cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h
    )) || null;
  }

  const beginDrag = (e, type, obj, mode_, corner) => {
    if (!isEdit) return;
    e.stopPropagation();
    const start = screenToSvgPoint(svgRef.current, e.clientX, e.clientY);
    // Zones drag in absolute space, so seed the drag from the resolved rect
    // rather than the stored offset.
    const r = type === 'zone' ? getZoneRect(obj) : obj;
    dragRef.current = {
      type, id: obj.id, mode: mode_, corner,
      startPointer: start,
      startRect: { x: r.x, y: r.y, w: r.w, h: r.h },
      moved: false,
    };
    setSelected({ type, id: obj.id });
    setDraft({ type, id: obj.id, mode: mode_, ...dragRef.current.startRect });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  // Drag on empty canvas = pan. Tracked separately from shape drags, and only
  // counts as a pan once it passes the threshold — a click that never moved
  // still means "back out to the whole house".
  const beginPan = (e) => {
    panRef.current = {
      startClient: { x: e.clientX, y: e.clientY },
      startView: view,
      moved: false,
    };
    svgRef.current?.setPointerCapture?.(e.pointerId);
  };

  const handleSvgPointerMove = (e) => {
    const pan = panRef.current;
    if (pan) {
      const dxClient = e.clientX - pan.startClient.x;
      const dyClient = e.clientY - pan.startClient.y;
      if (Math.abs(dxClient) > 3 || Math.abs(dyClient) > 3) pan.moved = true;
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect?.width) {
        const scale = pan.startView.w / rect.width;
        setView({
          ...pan.startView,
          x: pan.startView.x - dxClient * scale,
          y: pan.startView.y - dyClient * scale,
        });
      }
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const pt = screenToSvgPoint(svgRef.current, e.clientX, e.clientY);
    const dx = pt.x - drag.startPointer.x;
    const dy = pt.y - drag.startPointer.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true;

    const obj = drag.type === 'room' ? rooms.find((r) => r.id === drag.id) : zones.find((z) => z.id === drag.id);
    if (!obj) return;
    const minSize = drag.type === 'room' ? MIN_ROOM_SIZE : MIN_ZONE_SIZE;

    if (drag.mode === 'move') {
      let x = drag.startRect.x + dx;
      let y = drag.startRect.y + dy;
      let guideX = null;
      let guideY = null;
      if (snapEnabled) {
        const { xs, ys } = siblingEdges(drag.type, obj);
        const leftSnap = snapEdge(x, xs);
        const rightSnap = snapEdge(x + drag.startRect.w, xs);
        if (leftSnap != null) { x = leftSnap; guideX = leftSnap; } else if (rightSnap != null) {
          x = rightSnap - drag.startRect.w; guideX = rightSnap;
        } else {
          const g = snapToGrid(x);
          if (Math.abs(g - x) <= 10) { x = g; guideX = g; }
        }
        const topSnap = snapEdge(y, ys);
        const bottomSnap = snapEdge(y + drag.startRect.h, ys);
        if (topSnap != null) { y = topSnap; guideY = topSnap; } else if (bottomSnap != null) {
          y = bottomSnap - drag.startRect.h; guideY = bottomSnap;
        } else {
          const g = snapToGrid(y);
          if (Math.abs(g - y) <= 10) { y = g; guideY = g; }
        }
      }
      const pos = clampPosition(x, y, drag.startRect.w, drag.startRect.h);
      const rect = { x: pos.x, y: pos.y, w: drag.startRect.w, h: drag.startRect.h };
      setGuides(drag.moved ? { x: guideX, y: guideY } : null);
      if (drag.type === 'zone' && drag.moved) {
        const target = roomUnderRect(rect, null);
        setReparentRoomId(target && target.id !== obj.roomId ? target.id : null);
      }
      setDraft({ type: drag.type, id: drag.id, mode: 'move', ...rect });
    } else {
      let rect = resizeCorner(drag.startRect, drag.corner, dx, dy, minSize);
      let guideX = null;
      let guideY = null;
      if (snapEnabled) {
        const { xs, ys } = siblingEdges(drag.type, obj);
        if (drag.corner === 'se' || drag.corner === 'ne') {
          const snapped = snapEdge(rect.x + rect.w, xs);
          if (snapped != null) { rect = { ...rect, w: snapped - rect.x }; guideX = snapped; }
        } else {
          const snapped = snapEdge(rect.x, xs);
          if (snapped != null) { rect = { ...rect, w: rect.w + (rect.x - snapped), x: snapped }; guideX = snapped; }
        }
        if (drag.corner === 'se' || drag.corner === 'sw') {
          const snapped = snapEdge(rect.y + rect.h, ys);
          if (snapped != null) { rect = { ...rect, h: snapped - rect.y }; guideY = snapped; }
        } else {
          const snapped = snapEdge(rect.y, ys);
          if (snapped != null) { rect = { ...rect, h: rect.h + (rect.y - snapped), y: snapped }; guideY = snapped; }
        }
        rect = clampRect(rect, minSize);
      }
      setGuides(drag.moved ? { x: guideX, y: guideY } : null);
      setDraft({ type: drag.type, id: drag.id, mode: 'resize', ...rect });
    }
  };

  const handleSvgPointerUp = () => {
    const pan = panRef.current;
    if (pan) {
      panRef.current = null;
      if (!pan.moved) { handleWholeHouse(); setSelected(null); }
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setGuides(null);
    const landingRoomId = reparentRoomId;
    setReparentRoomId(null);

    if (!drag.moved) {
      setDraft(null);
      const obj = drag.type === 'room' ? rooms.find((r) => r.id === drag.id) : zones.find((z) => z.id === drag.id);
      if (obj) {
        if (drag.type === 'room') handleRoomClick(obj);
        else handleZoneClick(obj);
      }
      return;
    }

    // Read `draft` from the render closure rather than a setDraft updater —
    // updaters must be pure, and StrictMode runs them twice, which would fire
    // every action (and every toast) a second time.
    const current = draft;
    if (current) {
      if (drag.type === 'room') {
        // No zone bookkeeping here by design: zone offsets are stored
        // relative to the room, so both move and resize carry them along.
        actions.updateRoom(drag.id, { x: current.x, y: current.y, w: current.w, h: current.h });
      } else {
        const zone = zones.find((z) => z.id === drag.id);
        // Dropped inside a different room: re-parent the bin and drag every
        // item in it along, so the inventory breadcrumb, the room grouping
        // and the map all agree without a second edit.
        const targetRoomId = landingRoomId || zone?.roomId;
        const targetRoom = rooms.find((r) => r.id === targetRoomId) || null;
        const rel = zoneRel(current, targetRoom);
        if (landingRoomId) {
          actions.moveZoneToRoom(drag.id, landingRoomId, rel.x, rel.y);
          const moved = zone ? items.filter((i) => i.zoneId === zone.id).length : 0;
          actions.showToast(
            `Moved "${zone?.name}" to ${targetRoom?.name}${moved ? ` — ${moved} item${moved === 1 ? '' : 's'} followed` : ''}`,
          );
        } else {
          actions.updateZone(drag.id, { x: rel.x, y: rel.y, w: current.w, h: current.h });
        }
      }
    }
    setDraft(null);
  };

  // ---- item drag & drop between spaces (edit mode) ----

  const startItemDrag = (e, item) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(ITEM_DND_TYPE, item.id);
    e.dataTransfer.setData('text/plain', item.name);
  };

  const allowItemDrop = (e, target) => {
    if (!isEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(target);
  };

  const dropItem = (e, placement, label) => {
    if (!isEdit) return;
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    const itemId = e.dataTransfer.getData(ITEM_DND_TYPE);
    if (!itemId) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    actions.updateItem(itemId, placement);
    actions.showToast(`Moved "${item.name}" to ${label}`);
  };

  const handleDeleteSelected = (type, obj) => {
    if (!window.confirm(`Delete this ${type} "${obj.name}"?`)) return;
    if (type === 'room') {
      actions.removeRoom(obj.id);
      if (focusedRoomId === obj.id) handleWholeHouse();
    } else {
      actions.removeZone(obj.id);
      if (focusedZoneId === obj.id) handleBackToRoom();
    }
    setSelected(null);
  };

  const handleDuplicateSelected = (type, obj) => {
    // A zone's x/y is an offset inside its room, so nudging it needs no canvas
    // clamp — the copy just lands 20 units further into the same room.
    const nextPos = type === 'room'
      ? clampPosition(obj.x + 20, obj.y + 20, obj.w, obj.h)
      : { x: obj.x + 20, y: obj.y + 20 };
    const copy = { ...obj, id: undefined, name: `${obj.name} copy`, x: nextPos.x, y: nextPos.y };
    if (type === 'room') actions.addRoom(copy);
    else actions.addZone(copy);
  };

  const selectedObj = selected
    ? (selected.type === 'room' ? rooms.find((r) => r.id === selected.id) : zones.find((z) => z.id === selected.id))
    : null;
  // Resolved, not raw: a zone's stored x/y is a room offset, so the outline
  // and resize handles would otherwise be drawn near the canvas origin.
  const selectedRect = selectedObj
    ? (draft && draft.id === selectedObj.id
      ? draft
      : (selected.type === 'zone' ? getZoneRect(selectedObj) : selectedObj))
    : null;

  let sidePanelTitle = 'Whole House';
  let sidePanelSub = `${items.length} items across ${rooms.length} rooms`;
  let sidePanelItems = [];
  let dropPlacement = null;
  if (focusedCell && focusedZone) {
    sidePanelTitle = `${focusedZone.name} — R${focusedCell.row + 1}·C${focusedCell.col + 1}`;
    sidePanelItems = itemsInCell(focusedZone.id, focusedCell.row, focusedCell.col);
    sidePanelSub = focusedRoom ? focusedRoom.name : '';
    dropPlacement = {
      placement: { roomId: focusedZone.roomId, zoneId: focusedZone.id, cell: focusedCell },
      label: sidePanelTitle,
    };
  } else if (focusedZone) {
    sidePanelTitle = focusedZone.name;
    sidePanelItems = itemsInZone(focusedZone.id);
    sidePanelSub = `${focusedRoom ? `${focusedRoom.name} · ` : ''}${sidePanelItems.length} item${sidePanelItems.length === 1 ? '' : 's'}`
      + (focusedZone.capacity != null ? ` · ${sidePanelItems.length}/${focusedZone.capacity} used` : '');
    dropPlacement = {
      placement: { roomId: focusedZone.roomId, zoneId: focusedZone.id, cell: null },
      label: focusedZone.name,
    };
  } else if (focusedRoom) {
    sidePanelTitle = focusedRoom.name;
    sidePanelItems = itemsInRoom(focusedRoom.id);
    sidePanelSub = `${sidePanelItems.length} item${sidePanelItems.length === 1 ? '' : 's'} · ${zones.filter((z) => z.roomId === focusedRoom.id).length} zones`;
    dropPlacement = {
      placement: { roomId: focusedRoom.id, zoneId: null, cell: null },
      label: focusedRoom.name,
    };
  }

  if (rooms.length === 0) {
    return <div className="stash-panel stash-empty">No rooms yet — add one in the Layout tab.</div>;
  }

  return (
    <div className="stash-map" onClick={handleBackdropClick}>
      <div className="stash-map-controls stash-keep-focus">
        <div className="stash-mode-switch" role="group" aria-label="Map mode">
          <button
            type="button"
            className={`stash-mode-btn${!isEdit ? ' stash-mode-btn-active' : ''}`}
            onClick={() => setMode('dashboard')}
          >
            👁 Dashboard
          </button>
          <button
            type="button"
            className={`stash-mode-btn${isEdit ? ' stash-mode-btn-active' : ''}`}
            onClick={() => setMode('edit')}
          >
            ✏️ Edit
          </button>
        </div>

        {/* Scroll wheel is the main path; these are the discoverable fallback. */}
        <div className="stash-zoom-group" role="group" aria-label="Zoom">
          <button type="button" className="stash-zoom-btn" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom in">+</button>
          <button type="button" className="stash-zoom-btn" onClick={() => zoomBy(1.25)} aria-label="Zoom out">−</button>
          <button
            type="button"
            className="stash-zoom-btn stash-zoom-btn-wide"
            onClick={() => {
              if (focusedZone) setView(fitView(getZoneRect(focusedZone)));
              else if (focusedRoom) setView(fitView(focusedRoom));
              else frameWholeHouse();
            }}
            aria-label="Fit to view"
          >
            ⤢ Fit
          </button>
        </div>

        <button className="stash-btn" onClick={handleWholeHouse} disabled={!focusedRoomId}>🏠 Whole House</button>
        {focusedZoneId && (
          <button className="stash-btn" onClick={handleBackToRoom}>← Back to {focusedRoom?.name}</button>
        )}

        <button
          type="button"
          className={`stash-btn${showLabels ? ' stash-btn-primary' : ''}`}
          onClick={() => actions.updateSettings({ mapLabels: !showLabels })}
          title="Print item names straight onto the plan instead of only on hover"
        >
          🏷 Labels {showLabels ? 'On' : 'Off'}
        </button>

        {isEdit && (
          <button
            type="button"
            className={`stash-btn${snapEnabled ? ' stash-btn-primary' : ''}`}
            onClick={() => setSnapEnabled((v) => !v)}
          >
            🧲 Snap {snapEnabled ? 'On' : 'Off'}
          </button>
        )}

        <span className="stash-mode-hint">
          Scroll to zoom · drag empty space to pan · click it to back out
          {isEdit
            ? ' · drag a zone into another room to re-home it'
            : ' · hover anything to see what’s inside'}
        </span>
      </div>

      <div className="stash-map-layout">
        <div className="stash-floorplan-wrap">
          {/* aspectRatio is shaped from the rooms themselves, so the
              whole-house frame fills the element instead of floating in dead
              canvas — that empty canvas was the "huge side padding". The CSS
              caps the element by available width and height; this sets the
              ratio it grows along. */}
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className={`stash-floorplan-svg stash-keep-focus${isEdit ? ' stash-floorplan-svg-edit' : ''}`}
            style={{ aspectRatio: `${bounds.w} / ${bounds.h}` }}
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerCancel={handleSvgPointerUp}
            onMouseLeave={() => setHover(null)}
            onDragLeave={() => setDropTarget(null)}
          >
            {/* Oversized well past the canvas so there's always backdrop under
                the cursor to pan/click-out on, however far you zoom out. */}
            <rect
              x="-2000" y="-2000" width="5000" height="5000"
              className="stash-floorplan-bg"
              onPointerDown={beginPan}
            />

            {rooms.map((room) => {
              const roomRect = getRoomRect(room);
              const isRoomFocused = room.id === focusedRoomId;
              const isRoomSelected = selected?.type === 'room' && selected.id === room.id;
              const roomHighlighted = highlightedItem?.roomId === room.id && !highlightedItem?.zoneId;
              const isReparentTarget = reparentRoomId === room.id;
              const isRoomDropTarget = dropTarget?.roomId === room.id && !dropTarget.zoneId;

              return (
                <g key={room.id}>
                  <rect
                    x={roomRect.x} y={roomRect.y} width={roomRect.w} height={roomRect.h}
                    className={
                      'stash-room-rect'
                      + (isRoomFocused ? ' stash-room-rect-focused' : '')
                      + (isRoomSelected ? ' stash-room-rect-selected' : '')
                      + (isReparentTarget ? ' stash-room-rect-reparent' : '')
                      + (isRoomDropTarget ? ' stash-room-rect-droptarget' : '')
                    }
                    style={{ fill: room.color, stroke: room.color }}
                    onPointerDown={(e) => beginDrag(e, 'room', room, 'move', null)}
                    onClick={isEdit ? undefined : () => handleRoomClick(room)}
                    onMouseEnter={isEdit ? undefined : (e) => openHover(e, roomHover(room))}
                    onDragOver={(e) => allowItemDrop(e, { roomId: room.id })}
                    onDrop={(e) => dropItem(e, { roomId: room.id, zoneId: null, cell: null }, room.name)}
                  />
                  <text x={roomRect.x + 12} y={roomRect.y + 28} className="stash-room-label">{room.name}</text>

                  {zones.filter((z) => z.roomId === room.id).map((zone) => {
                    const zoneRect = getZoneRect(zone);
                    const zoneItems = itemsInZone(zone.id);
                    const zoneItemCount = zoneItems.length;
                    const isZoneFocused = zone.id === focusedZoneId;
                    const isZoneSelected = selected?.type === 'zone' && selected.id === zone.id;
                    const zoneHighlighted = highlightedItem?.zoneId === zone.id && !highlightedItem?.cell;
                    const isZoneDropTarget = dropTarget?.zoneId === zone.id && dropTarget.row == null;

                    return (
                      <g key={zone.id}>
                        <rect
                          x={zoneRect.x} y={zoneRect.y} width={zoneRect.w} height={zoneRect.h}
                          className={
                            'stash-zone-rect'
                            + (isZoneFocused ? ' stash-zone-rect-focused' : '')
                            + (isZoneSelected ? ' stash-zone-rect-selected' : '')
                            + (isZoneDropTarget ? ' stash-zone-rect-droptarget' : '')
                          }
                          onPointerDown={(e) => beginDrag(e, 'zone', zone, 'move', null)}
                          onClick={isEdit ? undefined : () => handleZoneClick(zone)}
                          onMouseEnter={isEdit ? undefined : (e) => openHover(e, zoneHover(zone))}
                          onDragOver={(e) => allowItemDrop(e, { zoneId: zone.id })}
                          onDrop={(e) => dropItem(e, { roomId: zone.roomId, zoneId: zone.id, cell: null }, zone.name)}
                        />
                        <text x={zoneRect.x + 6} y={zoneRect.y + 16} className="stash-zone-label">{zone.name}</text>

                        {zone.grid && Array.from({ length: zone.grid.rows }, (_, row) => (
                          Array.from({ length: zone.grid.cols }, (_, col) => {
                            const cellRect = computeCellRect({ ...zoneRect, grid: zone.grid }, row, col);
                            const cellItems = itemsInCell(zone.id, row, col);
                            const count = cellItems.length;
                            const isCellFocused = isZoneFocused && focusedCell
                              && focusedCell.row === row && focusedCell.col === col;
                            const isCellHighlighted = highlightedItem?.zoneId === zone.id
                              && highlightedItem?.cell?.row === row && highlightedItem?.cell?.col === col;
                            const isCellDropTarget = dropTarget?.zoneId === zone.id
                              && dropTarget.row === row && dropTarget.col === col;

                            return (
                              // Cells sit on top of their zone, so they take
                              // the zone's own drag handler — without it a
                              // gridded bin could never be dragged at all,
                              // because the cells swallowed every pointerdown.
                              <g key={`${row}-${col}`}>
                                <rect
                                  x={cellRect.x} y={cellRect.y} width={cellRect.w} height={cellRect.h}
                                  className={
                                    'stash-cell-rect'
                                    + (isCellFocused ? ' stash-cell-rect-focused' : '')
                                    + (isCellHighlighted ? ' stash-cell-highlight' : '')
                                    + (isCellDropTarget ? ' stash-cell-rect-droptarget' : '')
                                  }
                                  onPointerDown={isEdit ? (e) => beginDrag(e, 'zone', zone, 'move', null) : undefined}
                                  onClick={isEdit ? undefined : () => handleCellClick(zone, row, col)}
                                  onMouseEnter={isEdit ? undefined : (e) => openHover(e, cellHover(zone, row, col))}
                                  onDragOver={(e) => allowItemDrop(e, { zoneId: zone.id, row, col })}
                                  onDrop={(e) => dropItem(
                                    e,
                                    { roomId: zone.roomId, zoneId: zone.id, cell: { row, col } },
                                    `${zone.name} R${row + 1}·C${col + 1}`,
                                  )}
                                />
                                {count > 0 && (
                                  <text x={cellRect.x + cellRect.w - 4} y={cellRect.y + 12} className="stash-cell-badge" textAnchor="end">
                                    {count}
                                  </text>
                                )}
                                {showLabels && count > 0 && cellRect.h > 26 && (
                                  <text
                                    x={cellRect.x + cellRect.w / 2}
                                    y={cellRect.y + cellRect.h / 2 + 3}
                                    className="stash-cell-item-label"
                                    textAnchor="middle"
                                  >
                                    {cellItems[0].name.slice(0, 14)}
                                  </text>
                                )}
                              </g>
                            );
                          })
                        ))}

                        {(zoneItemCount > 0 || zone.capacity != null) && (
                          <text x={zoneRect.x + zoneRect.w - 6} y={zoneRect.y + 16} className="stash-zone-badge" textAnchor="end">
                            {zone.capacity != null ? `${zoneItemCount}/${zone.capacity}` : zoneItemCount}
                          </text>
                        )}

                        {/* Always-on alternative to hovering — asked for as the
                            "or somehow generically" way to read a section. */}
                        {showLabels && !zone.grid && zoneItems.slice(0, 4).map((item, i) => (
                          <text
                            key={item.id}
                            x={zoneRect.x + 6}
                            y={zoneRect.y + 32 + i * 13}
                            className="stash-zone-item-label"
                          >
                            {item.name.slice(0, 22)}
                          </text>
                        ))}

                        {!zone.grid && zoneHighlighted && (
                          <rect
                            x={zoneRect.x} y={zoneRect.y} width={zoneRect.w} height={zoneRect.h}
                            className="stash-cell-highlight stash-zone-highlight-overlay"
                          />
                        )}
                      </g>
                    );
                  })}

                  {roomHighlighted && (
                    <rect
                      x={roomRect.x + 4} y={roomRect.y + 4} width={roomRect.w - 8} height={roomRect.h - 8}
                      className="stash-cell-highlight stash-room-highlight-overlay"
                    />
                  )}
                </g>
              );
            })}

            {guides?.x != null && <line x1={guides.x} y1="0" x2={guides.x} y2="1000" className="stash-snap-guide" />}
            {guides?.y != null && <line x1="0" y1={guides.y} x2="1000" y2={guides.y} className="stash-snap-guide" />}

            {isEdit && selectedRect && (
              <g className="stash-selection-overlay">
                <rect
                  x={selectedRect.x} y={selectedRect.y} width={selectedRect.w} height={selectedRect.h}
                  className="stash-selection-outline"
                />
                {[
                  ['nw', selectedRect.x, selectedRect.y],
                  ['ne', selectedRect.x + selectedRect.w, selectedRect.y],
                  ['sw', selectedRect.x, selectedRect.y + selectedRect.h],
                  ['se', selectedRect.x + selectedRect.w, selectedRect.y + selectedRect.h],
                ].map(([corner, cx, cy]) => (
                  <rect
                    key={corner}
                    x={cx - 10} y={cy - 10} width={20} height={20}
                    className={`stash-handle stash-handle-${corner}`}
                    onPointerDown={(e) => beginDrag(e, selected.type, selectedObj, 'resize', corner)}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>

        <div className={`stash-map-side-col stash-keep-focus${stashOpen ? '' : ' stash-map-side-col-collapsed'}`}>
          {/* Corner tab straddling the gap between plan and column, so the
              whole stash can be folded away when the floor plan is the thing
              you actually want the pixels for. */}
          <button
            type="button"
            className="stash-stash-tab"
            onClick={() => actions.updateSettings({ mapStashOpen: !stashOpen })}
            aria-expanded={stashOpen}
            title={stashOpen ? 'Collapse the stash panel' : 'Open the stash panel'}
          >
            <span aria-hidden="true">{stashOpen ? '⟩' : '⟨'}</span>
            <span className="stash-stash-tab-text">
              Stash{sidePanelItems.length ? ` · ${sidePanelItems.length}` : ''}
            </span>
          </button>

          {/* The stash itself is the headline panel — what's in the space you
              picked. Geometry/colour editing lives in the dock below it. */}
          {stashOpen && (
          <div
            className={`stash-panel stash-side-panel stash-side-panel-primary${dropTarget?.panel ? ' stash-side-panel-drop' : ''}`}
            onDragOver={(e) => dropPlacement && allowItemDrop(e, { panel: true })}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => dropPlacement && dropItem(e, dropPlacement.placement, dropPlacement.label)}
          >
            {highlightedItem && (
              <div className="stash-focused-item">
                <div className="stash-focused-item-header">
                  <span className="stash-section-label">Focused Item</span>
                  <button
                    type="button"
                    className="stash-icon-btn"
                    onClick={actions.clearFocus}
                    aria-label="Clear focused item"
                  >
                    ×
                  </button>
                </div>
                <div className="stash-focused-item-name">{highlightedItem.name}</div>
                <div className="stash-focused-item-meta">
                  <span className="stash-badge">{highlightedItem.category}</span>
                  <span className="stash-item-qty">×{highlightedItem.quantity}</span>
                  <DupeFlag item={highlightedItem} compact />
                </div>
                {highlightedItem.description && <p className="stash-item-desc">{highlightedItem.description}</p>}
                <p className="stash-focused-item-location">{buildBreadcrumb(highlightedItem, rooms, zones)}</p>
              </div>
            )}

            <div className="stash-side-panel-head">
              <span className="stash-side-panel-title">{sidePanelTitle}</span>
              {sidePanelSub && <span className="stash-side-panel-sub">{sidePanelSub}</span>}
            </div>

            {sidePanelItems.length === 0 ? (
              <div className="stash-empty">
                {focusedRoom ? 'No items here.' : 'Click a room to explore its zones and items.'}
              </div>
            ) : (
              <div className="stash-side-item-list">
                {sidePanelItems.map((item) => (
                  <div
                    key={item.id}
                    className={`stash-side-item${item.id === selectedItemId ? ' stash-side-item-active' : ''}${isEdit ? ' stash-side-item-draggable' : ''}`}
                    draggable={isEdit}
                    onDragStart={(e) => startItemDrag(e, item)}
                  >
                    {isEdit && <span className="stash-side-item-grip" aria-hidden="true">⠿</span>}
                    <span className="stash-side-item-name">{item.name}</span>
                    <span className="stash-badge">{item.category}</span>
                    <span className="stash-item-qty">×{item.quantity}</span>
                    {/* "…or from the shelf" — dismissing a false duplicate has
                        to work here, not only in the inventory table. */}
                    <DupeFlag item={item} compact />
                  </div>
                ))}
              </div>
            )}

            {isEdit && dropPlacement && (
              <p className="stash-side-panel-dnd-hint">
                Drag any item onto a room, zone or cell on the plan to move it — or drop it here to
                put it in {dropPlacement.label}.
              </p>
            )}
          </div>
          )}

          {stashOpen && isEdit && (
            <div className="stash-props-dock">
              <button
                type="button"
                className={`stash-props-dock-toggle${propsOpen ? ' stash-props-dock-toggle-open' : ''}`}
                onClick={() => setPropsOpen((v) => !v)}
                aria-expanded={propsOpen}
              >
                <span className="stash-props-dock-label">
                  ⚙ {selectedObj
                    ? `${selected.type === 'zone' ? 'Zone' : 'Room'} settings — ${selectedObj.name}`
                    : 'Space settings'}
                </span>
                <span aria-hidden="true">{propsOpen ? '▾' : '▸'}</span>
              </button>

              {propsOpen && (
                <div className="stash-props-dock-body">
                  {selectedObj ? (
                    <PropertiesPanel
                      selType={selected.type}
                      obj={selectedObj}
                      itemCount={selected.type === 'zone' ? itemsInZone(selectedObj.id).length : 0}
                      actions={actions}
                      onDeselect={() => setSelected(null)}
                      onDelete={handleDeleteSelected}
                      onDuplicate={handleDuplicateSelected}
                    />
                  ) : (
                    <div className="stash-empty stash-empty-small">
                      Click a room or zone on the plan to edit its name, colour, grid and size.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isEdit && hover && <HoverCard hover={hover} dupeFlags={duplicates.flags} />}
    </div>
  );
}
