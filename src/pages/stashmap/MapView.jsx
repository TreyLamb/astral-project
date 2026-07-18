import { useState, useEffect, useRef, useCallback } from 'react';
import { useStashMap } from './stashmapContext';
import { buildBreadcrumb, computeCellRect, ROOM_COLORS } from './stashmapConfig';
import {
  screenToSvgPoint, snapToGrid, snapEdge, resizeCorner, clampPosition, clampRect,
  DRAG_THRESHOLD, MIN_ROOM_SIZE, MIN_ZONE_SIZE, CANVAS_MAX,
} from './stashmapCanvas';

function PropertiesPanel({ selType, obj, itemCount, actions, onDeselect, onDelete, onDuplicate }) {
  const isZone = selType === 'zone';

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
            <span>{field.toUpperCase()}</span>
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

export default function MapView() {
  const { rooms, zones, items, selectedItemId, focusToken, actions } = useStashMap();
  const [focusedRoomId, setFocusedRoomId] = useState(null);
  const [focusedZoneId, setFocusedZoneId] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null);

  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null); // { type: 'room'|'zone', id }
  const [draft, setDraft] = useState(null); // live drag/resize override: { type, id, x, y, w, h }
  const [guides, setGuides] = useState(null); // { x, y } snap guide lines while dragging
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null); // { zoneId, row, col }

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
  }, [selectedItemId, focusToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrow-key nudge for whatever's selected on the canvas. Ignored while
  // focus is inside a text field (e.g. typing in the properties panel).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') { setSelected(null); return; }
      if (!selected) return;
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
      const next = clampPosition(obj.x + dx, obj.y + dy, obj.w, obj.h);
      if (selected.type === 'room') actions.updateRoom(obj.id, next);
      else actions.updateZone(obj.id, next);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, rooms, zones, actions]);

  const focusedRoom = rooms.find((r) => r.id === focusedRoomId) || null;
  const focusedZone = zones.find((z) => z.id === focusedZoneId) || null;
  const highlightedItem = items.find((i) => i.id === selectedItemId) || null;

  const viewBox = focusedRoom
    ? `${focusedRoom.x - 30} ${focusedRoom.y - 30} ${focusedRoom.w + 60} ${focusedRoom.h + 60}`
    : '0 0 1000 1000';

  const handleRoomClick = (room) => {
    setFocusedRoomId(room.id);
    setFocusedZoneId(null);
    setFocusedCell(null);
  };

  const handleZoneClick = (zone) => {
    setFocusedRoomId(zone.roomId);
    setFocusedZoneId(zone.id);
    setFocusedCell(null);
  };

  const handleCellClick = (zone, row, col) => {
    setFocusedRoomId(zone.roomId);
    setFocusedZoneId(zone.id);
    setFocusedCell({ row, col });
  };

  // Deliberately does NOT clear `selected` — so a room selected while
  // zoomed in stays selected once you back out to whole-house, letting you
  // drag it relative to the other rooms without re-selecting it.
  const handleWholeHouse = () => {
    setFocusedRoomId(null);
    setFocusedZoneId(null);
    setFocusedCell(null);
  };

  const handleBackToRoom = () => {
    setFocusedZoneId(null);
    setFocusedCell(null);
  };

  const itemsInZone = (zoneId) => items.filter((i) => i.zoneId === zoneId);
  const itemsInCell = (zoneId, row, col) => items.filter((i) => (
    i.zoneId === zoneId && i.cell && i.cell.row === row && i.cell.col === col
  ));
  const itemsInRoom = (roomId) => items.filter((i) => i.roomId === roomId);

  // ---- direct manipulation: select / drag / resize ----

  const getRoomRect = useCallback((room) => (
    draft && draft.type === 'room' && draft.id === room.id ? draft : room
  ), [draft]);
  const getZoneRect = useCallback((zone) => (
    draft && draft.type === 'zone' && draft.id === zone.id ? draft : zone
  ), [draft]);

  function siblingEdges(type, obj) {
    const siblings = type === 'room'
      ? rooms.filter((r) => r.id !== obj.id)
      : zones.filter((z) => z.roomId === obj.roomId && z.id !== obj.id);
    const xs = [0, CANVAS_MAX];
    const ys = [0, CANVAS_MAX];
    siblings.forEach((o) => { xs.push(o.x, o.x + o.w); ys.push(o.y, o.y + o.h); });
    if (type === 'zone') {
      const room = rooms.find((r) => r.id === obj.roomId);
      if (room) { xs.push(room.x, room.x + room.w); ys.push(room.y, room.y + room.h); }
    }
    return { xs, ys };
  }

  const beginDrag = (e, type, obj, mode, corner) => {
    e.stopPropagation();
    const start = screenToSvgPoint(svgRef.current, e.clientX, e.clientY);
    dragRef.current = {
      type, id: obj.id, mode, corner,
      startPointer: start,
      startRect: { x: obj.x, y: obj.y, w: obj.w, h: obj.h },
      moved: false,
    };
    setSelected({ type, id: obj.id });
    setDraft({ type, id: obj.id, ...dragRef.current.startRect });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleSvgPointerMove = (e) => {
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
      setGuides(drag.moved ? { x: guideX, y: guideY } : null);
      setDraft({ type: drag.type, id: drag.id, x: pos.x, y: pos.y, w: drag.startRect.w, h: drag.startRect.h });
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
      setDraft({ type: drag.type, id: drag.id, ...rect });
    }
  };

  const handleSvgPointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setGuides(null);

    if (!drag.moved) {
      setDraft(null);
      const obj = drag.type === 'room' ? rooms.find((r) => r.id === drag.id) : zones.find((z) => z.id === drag.id);
      if (obj) {
        if (drag.type === 'room') handleRoomClick(obj);
        else handleZoneClick(obj);
      }
      return;
    }

    setDraft((current) => {
      if (current) {
        if (drag.type === 'room') {
          actions.updateRoom(drag.id, { x: current.x, y: current.y, w: current.w, h: current.h });
        } else {
          actions.updateZone(drag.id, { x: current.x, y: current.y, w: current.w, h: current.h });
        }
      }
      return null;
    });
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
    const nextPos = clampPosition(obj.x + 20, obj.y + 20, obj.w, obj.h);
    const copy = { ...obj, id: undefined, name: `${obj.name} copy`, x: nextPos.x, y: nextPos.y };
    if (type === 'room') actions.addRoom(copy);
    else actions.addZone(copy);
  };

  const selectedObj = selected
    ? (selected.type === 'room' ? rooms.find((r) => r.id === selected.id) : zones.find((z) => z.id === selected.id))
    : null;
  const selectedRect = selectedObj
    ? (draft && draft.id === selectedObj.id ? draft : selectedObj)
    : null;

  let sidePanelTitle = 'Whole House';
  let sidePanelItems = [];
  if (focusedCell && focusedZone) {
    sidePanelTitle = `${focusedZone.name} — R${focusedCell.row + 1}·C${focusedCell.col + 1}`;
    sidePanelItems = itemsInCell(focusedZone.id, focusedCell.row, focusedCell.col);
  } else if (focusedZone) {
    sidePanelTitle = focusedZone.name;
    sidePanelItems = itemsInZone(focusedZone.id);
  } else if (focusedRoom) {
    sidePanelTitle = focusedRoom.name;
    sidePanelItems = itemsInRoom(focusedRoom.id);
  }

  if (rooms.length === 0) {
    return <div className="stash-panel stash-empty">No rooms yet — add one in the Layout tab.</div>;
  }

  return (
    <div className="stash-map">
      <div className="stash-map-controls">
        <button className="stash-btn" onClick={handleWholeHouse} disabled={!focusedRoomId}>🏠 Whole House</button>
        {focusedZoneId && (
          <button className="stash-btn" onClick={handleBackToRoom}>← Back to {focusedRoom?.name}</button>
        )}
        <button
          type="button"
          className={`stash-btn${snapEnabled ? ' stash-btn-primary' : ''}`}
          onClick={() => setSnapEnabled((v) => !v)}
        >
          🧲 Snap {snapEnabled ? 'On' : 'Off'}
        </button>
      </div>

      <div className="stash-map-layout">
        <div className="stash-floorplan-wrap">
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className="stash-floorplan-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={handleSvgPointerMove}
            onPointerUp={handleSvgPointerUp}
            onPointerCancel={handleSvgPointerUp}
          >
            <rect
              x="0" y="0" width="1000" height="1000"
              className="stash-floorplan-bg"
              onClick={() => setSelected(null)}
            />

            {rooms.map((room) => {
              const roomRect = getRoomRect(room);
              const isRoomFocused = room.id === focusedRoomId;
              const isRoomSelected = selected?.type === 'room' && selected.id === room.id;
              const roomHighlighted = highlightedItem?.roomId === room.id && !highlightedItem?.zoneId;

              return (
                <g key={room.id}>
                  <rect
                    x={roomRect.x} y={roomRect.y} width={roomRect.w} height={roomRect.h}
                    className={`stash-room-rect${isRoomFocused ? ' stash-room-rect-focused' : ''}${isRoomSelected ? ' stash-room-rect-selected' : ''}`}
                    style={{ fill: room.color, stroke: room.color }}
                    onPointerDown={(e) => beginDrag(e, 'room', room, 'move', null)}
                  />
                  <text x={roomRect.x + 12} y={roomRect.y + 28} className="stash-room-label">{room.name}</text>

                  {zones.filter((z) => z.roomId === room.id).map((zone) => {
                    const zoneRect = getZoneRect(zone);
                    const zoneItemCount = itemsInZone(zone.id).length;
                    const isZoneFocused = zone.id === focusedZoneId;
                    const isZoneSelected = selected?.type === 'zone' && selected.id === zone.id;
                    const zoneHighlighted = highlightedItem?.zoneId === zone.id && !highlightedItem?.cell;
                    const isZoneHovered = hoveredZoneId === zone.id;

                    return (
                      <g key={zone.id}>
                        <rect
                          x={zoneRect.x} y={zoneRect.y} width={zoneRect.w} height={zoneRect.h}
                          className={`stash-zone-rect${isZoneFocused ? ' stash-zone-rect-focused' : ''}${isZoneSelected ? ' stash-zone-rect-selected' : ''}`}
                          onPointerDown={(e) => beginDrag(e, 'zone', zone, 'move', null)}
                          onMouseEnter={() => setHoveredZoneId(zone.id)}
                          onMouseLeave={() => { setHoveredZoneId(null); setHoveredCell(null); }}
                        />
                        <text x={zoneRect.x + 6} y={zoneRect.y + 16} className="stash-zone-label">{zone.name}</text>

                        {zone.grid && Array.from({ length: zone.grid.rows }, (_, row) => (
                          Array.from({ length: zone.grid.cols }, (_, col) => {
                            const cellRect = computeCellRect({ ...zoneRect, grid: zone.grid }, row, col);
                            const count = itemsInCell(zone.id, row, col).length;
                            const isCellFocused = isZoneFocused && focusedCell
                              && focusedCell.row === row && focusedCell.col === col;
                            const isCellHighlighted = highlightedItem?.zoneId === zone.id
                              && highlightedItem?.cell?.row === row && highlightedItem?.cell?.col === col;
                            const isCellHovered = hoveredCell?.zoneId === zone.id
                              && hoveredCell.row === row && hoveredCell.col === col;

                            return (
                              <g key={`${row}-${col}`}>
                                <rect
                                  x={cellRect.x} y={cellRect.y} width={cellRect.w} height={cellRect.h}
                                  className={
                                    'stash-cell-rect'
                                    + (isZoneHovered ? ' stash-cell-rect-zone-hovered' : '')
                                    + (isCellHovered ? ' stash-cell-rect-cell-hovered' : '')
                                    + (isCellFocused ? ' stash-cell-rect-focused' : '')
                                    + (isCellHighlighted ? ' stash-cell-highlight' : '')
                                  }
                                  onClick={() => handleCellClick(zone, row, col)}
                                  onMouseEnter={() => { setHoveredZoneId(zone.id); setHoveredCell({ zoneId: zone.id, row, col }); }}
                                  onMouseLeave={() => setHoveredCell(null)}
                                />
                                {count > 0 && (
                                  <text x={cellRect.x + cellRect.w - 4} y={cellRect.y + 12} className="stash-cell-badge" textAnchor="end">
                                    {count}
                                  </text>
                                )}
                              </g>
                            );
                          })
                        ))}

                        {isZoneHovered && hoveredCell?.zoneId === zone.id && zone.grid && (() => {
                          const r = computeCellRect({ ...zoneRect, grid: zone.grid }, hoveredCell.row, hoveredCell.col);
                          return (
                            <g className="stash-cell-hover-label">
                              <rect x={r.x + r.w / 2 - 20} y={r.y - 16} width={40} height={16} rx={3} />
                              <text x={r.x + r.w / 2} y={r.y - 4} textAnchor="middle">
                                {`R${hoveredCell.row + 1}·C${hoveredCell.col + 1}`}
                              </text>
                            </g>
                          );
                        })()}

                        {(zoneItemCount > 0 || zone.capacity != null) && (
                          <text x={zoneRect.x + zoneRect.w - 6} y={zoneRect.y + 16} className="stash-zone-badge" textAnchor="end">
                            {zone.capacity != null ? `${zoneItemCount}/${zone.capacity}` : zoneItemCount}
                          </text>
                        )}

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

            {selectedRect && (
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

        <div className="stash-map-side-col">
          {selectedObj && (
            <div className="stash-panel">
              <PropertiesPanel
                selType={selected.type}
                obj={selectedObj}
                itemCount={selected.type === 'zone' ? itemsInZone(selectedObj.id).length : 0}
                actions={actions}
                onDeselect={() => setSelected(null)}
                onDelete={handleDeleteSelected}
                onDuplicate={handleDuplicateSelected}
              />
            </div>
          )}

          <div className="stash-panel stash-side-panel">
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
                </div>
                {highlightedItem.description && <p className="stash-item-desc">{highlightedItem.description}</p>}
                <p className="stash-focused-item-location">{buildBreadcrumb(highlightedItem, rooms, zones)}</p>
              </div>
            )}

            <div className="stash-section-label">{sidePanelTitle}</div>
            {sidePanelItems.length === 0 ? (
              <div className="stash-empty">
                {focusedRoom ? 'No items here.' : 'Click a room to explore its zones and items.'}
              </div>
            ) : (
              <div className="stash-side-item-list">
                {sidePanelItems.map((item) => (
                  <div
                    key={item.id}
                    className={`stash-side-item${item.id === selectedItemId ? ' stash-side-item-active' : ''}`}
                  >
                    <span className="stash-side-item-name">{item.name}</span>
                    <span className="stash-badge">{item.category}</span>
                    <span className="stash-item-qty">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
