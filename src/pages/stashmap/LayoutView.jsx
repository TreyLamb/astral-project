import { useRef, useState } from 'react';
import { useStashMap } from './stashmapContext';
import { ROOM_COLORS, zoneAbs, zoneRel } from './stashmapConfig';
import {
  screenToSvgPoint, snapToGrid, resizeCorner, clampPosition, clampRect,
  DRAG_THRESHOLD, MIN_ROOM_SIZE, MIN_ZONE_SIZE,
} from './stashmapCanvas';

export default function LayoutView() {
  const { rooms, zones, actions } = useStashMap();

  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null); // { type: 'room'|'zone', id }
  const [draft, setDraft] = useState(null);

  const handleAddRoom = () => {
    actions.addRoom({
      name: 'New Room', x: 0, y: 0, w: 200, h: 200,
      color: ROOM_COLORS[rooms.length % ROOM_COLORS.length],
    });
  };

  const handleRemoveRoom = (room) => {
    if (window.confirm(`Delete "${room.name}" and all its zones? Items placed there become unplaced.`)) {
      actions.removeRoom(room.id);
      setSelected((prev) => (prev?.type === 'room' && prev.id === room.id ? null : prev));
    }
  };

  const handleAddZone = (room) => {
    // x/y are an offset inside the room, so this is 10 units in from its corner.
    actions.addZone({
      roomId: room.id, name: 'New Zone', x: 10, y: 10, w: 100, h: 100, grid: null,
    });
  };

  const handleRemoveZone = (zone) => {
    if (window.confirm(`Delete "${zone.name}"? Items placed there fall back to room-only placement.`)) {
      actions.removeZone(zone.id);
      setSelected((prev) => (prev?.type === 'zone' && prev.id === zone.id ? null : prev));
    }
  };

  const handleGridToggle = (zone, checked) => {
    actions.updateZone(zone.id, { grid: checked ? { rows: 2, cols: 2 } : null });
  };

  const handleGridField = (zone, field, value) => {
    actions.updateZone(zone.id, { grid: { ...zone.grid, [field]: Math.max(1, Number(value) || 1) } });
  };

  // ---- fast rough placement: drag-to-place + corner-resize, always
  // snapped to the coarse 20-unit grid so this stays the "quick drop it
  // roughly in place" tool. The numeric fields below remain the exactness
  // fallback for precise coordinates.

  const getRoomRect = (room) => (draft && draft.type === 'room' && draft.id === room.id ? draft : room);
  // Same rule as MapView: zone x/y is an offset inside its room, resolved
  // against wherever that room is currently drawn (draft included), so zones
  // track a room being moved or resized with no extra bookkeeping.
  const getZoneRect = (zone) => {
    if (draft && draft.type === 'zone' && draft.id === zone.id) {
      return { ...zone, x: draft.x, y: draft.y, w: draft.w, h: draft.h };
    }
    const room = rooms.find((r) => r.id === zone.roomId);
    return zoneAbs(zone, room ? getRoomRect(room) : null);
  };

  const beginDrag = (e, type, obj, mode, corner) => {
    e.stopPropagation();
    const start = screenToSvgPoint(svgRef.current, e.clientX, e.clientY);
    // Zones drag in absolute space; seed from the resolved rect, not the offset.
    const r = type === 'zone' ? getZoneRect(obj) : obj;
    dragRef.current = {
      type, id: obj.id, mode, corner,
      startPointer: start,
      startRect: { x: r.x, y: r.y, w: r.w, h: r.h },
      moved: false,
    };
    setSelected({ type, id: obj.id });
    setDraft({ type, id: obj.id, mode, ...dragRef.current.startRect });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pt = screenToSvgPoint(svgRef.current, e.clientX, e.clientY);
    const dx = pt.x - drag.startPointer.x;
    const dy = pt.y - drag.startPointer.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) drag.moved = true;
    const minSize = drag.type === 'room' ? MIN_ROOM_SIZE : MIN_ZONE_SIZE;

    let rect;
    if (drag.mode === 'move') {
      const x = snapToGrid(drag.startRect.x + dx);
      const y = snapToGrid(drag.startRect.y + dy);
      const pos = clampPosition(x, y, drag.startRect.w, drag.startRect.h);
      rect = { x: pos.x, y: pos.y, w: drag.startRect.w, h: drag.startRect.h };
    } else {
      const raw = resizeCorner(drag.startRect, drag.corner, dx, dy, minSize);
      rect = clampRect({
        x: snapToGrid(raw.x), y: snapToGrid(raw.y),
        w: Math.max(minSize, snapToGrid(raw.w)), h: Math.max(minSize, snapToGrid(raw.h)),
      }, minSize);
    }
    setDraft({ type: drag.type, id: drag.id, mode: drag.mode, ...rect });
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) { setDraft(null); return; }
    // From the render closure, not a setDraft updater: updaters must be pure,
    // and StrictMode runs them twice.
    const current = draft;
    if (current) {
      if (drag.type === 'room') {
        actions.updateRoom(drag.id, { x: current.x, y: current.y, w: current.w, h: current.h });
      } else {
        const zone = zones.find((z) => z.id === drag.id);
        const room = rooms.find((r) => r.id === zone?.roomId) || null;
        const rel = zoneRel(current, room);
        actions.updateZone(drag.id, { x: rel.x, y: rel.y, w: current.w, h: current.h });
      }
    }
    setDraft(null);
  };

  const selectedObj = selected
    ? (selected.type === 'room' ? rooms.find((r) => r.id === selected.id) : zones.find((z) => z.id === selected.id))
    : null;
  const selectedRect = selectedObj
    ? (draft && draft.id === selectedObj.id
      ? draft
      : (selected.type === 'zone' ? getZoneRect(selectedObj) : selectedObj))
    : null;

  return (
    <div className="stash-layout-view">
      <div className="stash-panel stash-panel-accent stash-layout-preview">
        <div className="stash-section-label">House Preview — drag to place, drag a corner to resize (snaps to 20-unit grid)</div>
        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          className="stash-layout-preview-svg"
          preserveAspectRatio="xMidYMid meet"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            <pattern id="stash-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" className="stash-grid-pattern-path" fill="none" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="1000" height="1000" className="stash-floorplan-bg" onClick={() => setSelected(null)} />
          <rect x="0" y="0" width="1000" height="1000" fill="url(#stash-grid-pattern)" pointerEvents="none" />

          {rooms.map((room) => {
            const roomRect = getRoomRect(room);
            const isSelected = selected?.type === 'room' && selected.id === room.id;
            return (
              <g key={room.id}>
                <rect
                  x={roomRect.x} y={roomRect.y} width={roomRect.w} height={roomRect.h}
                  className={`stash-preview-room-rect${isSelected ? ' stash-preview-room-rect-selected' : ''}`}
                  style={{ fill: room.color, stroke: room.color }}
                  onPointerDown={(e) => beginDrag(e, 'room', room, 'move', null)}
                />
                {zones.filter((z) => z.roomId === room.id).map((zone) => {
                  const zoneRect = getZoneRect(zone);
                  const isZoneSelected = selected?.type === 'zone' && selected.id === zone.id;
                  return (
                    <rect
                      key={zone.id}
                      x={zoneRect.x} y={zoneRect.y} width={zoneRect.w} height={zoneRect.h}
                      className={`stash-preview-zone-rect${isZoneSelected ? ' stash-preview-zone-rect-selected' : ''}`}
                      onPointerDown={(e) => beginDrag(e, 'zone', zone, 'move', null)}
                    />
                  );
                })}
              </g>
            );
          })}

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

      <div className="stash-layout-toolbar">
        <button className="stash-btn stash-btn-primary" onClick={handleAddRoom}>+ Add Room</button>
      </div>

      {rooms.length === 0 ? (
        <div className="stash-panel stash-empty">No rooms yet — add one above.</div>
      ) : (
        <div className="stash-room-editor-list">
          {rooms.map((room) => {
            const roomZones = zones.filter((z) => z.roomId === room.id);
            return (
              <div key={room.id} className="stash-panel stash-room-editor">
                <div className="stash-room-editor-header">
                  <input
                    className="stash-input stash-room-name-input"
                    value={room.name}
                    onChange={(e) => actions.updateRoom(room.id, { name: e.target.value })}
                  />
                  <button className="stash-btn stash-btn-danger" onClick={() => handleRemoveRoom(room)}>
                    Delete Room
                  </button>
                </div>

                <div className="stash-coord-fields">
                  {['x', 'y', 'w', 'h'].map((field) => (
                    <label key={field} className="stash-field stash-field-tiny">
                      <span>{field.toUpperCase()}</span>
                      <input
                        className="stash-input"
                        type="number"
                        value={room[field]}
                        onChange={(e) => actions.updateRoom(room.id, { [field]: Number(e.target.value) || 0 })}
                      />
                    </label>
                  ))}
                </div>

                <div className="stash-color-swatches">
                  {ROOM_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`stash-swatch${room.color === color ? ' stash-swatch-active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => actions.updateRoom(room.id, { color })}
                      aria-label={`Set room color ${color}`}
                    />
                  ))}
                </div>

                <div className="stash-divider" />

                <div className="stash-zone-editor-header">
                  <span className="stash-section-label">Zones</span>
                  <button className="stash-btn" onClick={() => handleAddZone(room)}>+ Add Zone</button>
                </div>

                {roomZones.length === 0 ? (
                  <div className="stash-empty stash-empty-small">No zones in this room yet.</div>
                ) : (
                  <div className="stash-zone-editor-list">
                    {roomZones.map((zone) => (
                      <div key={zone.id} className="stash-zone-editor">
                        <div className="stash-zone-editor-header">
                          <input
                            className="stash-input"
                            value={zone.name}
                            onChange={(e) => actions.updateZone(zone.id, { name: e.target.value })}
                          />
                          <button className="stash-btn stash-btn-danger" onClick={() => handleRemoveZone(zone)}>
                            Delete
                          </button>
                        </div>

                        <div className="stash-coord-fields">
                          {['x', 'y', 'w', 'h'].map((field) => (
                            <label key={field} className="stash-field stash-field-tiny">
                              {/* X/Y are measured from the room's corner, not
                                  the canvas — say so rather than showing a
                                  number that looks wrong next to the room's. */}
                              <span>{field === 'x' || field === 'y' ? `${field.toUpperCase()} in room` : field.toUpperCase()}</span>
                              <input
                                className="stash-input"
                                type="number"
                                value={zone[field]}
                                onChange={(e) => actions.updateZone(zone.id, { [field]: Number(e.target.value) || 0 })}
                              />
                            </label>
                          ))}
                        </div>

                        <label className="stash-field stash-field-tiny">
                          <span>Capacity</span>
                          <input
                            className="stash-input"
                            type="number"
                            min="0"
                            placeholder="No limit"
                            value={zone.capacity ?? ''}
                            onChange={(e) => actions.updateZone(zone.id, {
                              capacity: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0),
                            })}
                          />
                        </label>

                        <label className="stash-checkbox-field">
                          <input
                            type="checkbox"
                            checked={!!zone.grid}
                            onChange={(e) => handleGridToggle(zone, e.target.checked)}
                          />
                          <span>Has grid</span>
                        </label>

                        {zone.grid && (
                          <div className="stash-coord-fields">
                            <label className="stash-field stash-field-tiny">
                              <span>Rows</span>
                              <input
                                className="stash-input"
                                type="number"
                                min="1"
                                value={zone.grid.rows}
                                onChange={(e) => handleGridField(zone, 'rows', e.target.value)}
                              />
                            </label>
                            <label className="stash-field stash-field-tiny">
                              <span>Cols</span>
                              <input
                                className="stash-input"
                                type="number"
                                min="1"
                                value={zone.grid.cols}
                                onChange={(e) => handleGridField(zone, 'cols', e.target.value)}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
