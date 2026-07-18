import { useStashMap } from './stashmapContext';
import { ROOM_COLORS } from './stashmapConfig';

export default function LayoutView() {
  const { rooms, zones, actions } = useStashMap();

  const handleAddRoom = () => {
    actions.addRoom({
      name: 'New Room', x: 0, y: 0, w: 200, h: 200,
      color: ROOM_COLORS[rooms.length % ROOM_COLORS.length],
    });
  };

  const handleRemoveRoom = (room) => {
    if (window.confirm(`Delete "${room.name}" and all its zones? Items placed there become unplaced.`)) {
      actions.removeRoom(room.id);
    }
  };

  const handleAddZone = (room) => {
    actions.addZone({
      roomId: room.id, name: 'New Zone', x: room.x + 10, y: room.y + 10, w: 100, h: 100, grid: null,
    });
  };

  const handleRemoveZone = (zone) => {
    if (window.confirm(`Delete "${zone.name}"? Items placed there fall back to room-only placement.`)) {
      actions.removeZone(zone.id);
    }
  };

  const handleGridToggle = (zone, checked) => {
    actions.updateZone(zone.id, { grid: checked ? { rows: 2, cols: 2 } : null });
  };

  const handleGridField = (zone, field, value) => {
    actions.updateZone(zone.id, { grid: { ...zone.grid, [field]: Math.max(1, Number(value) || 1) } });
  };

  return (
    <div className="stash-layout-view">
      <div className="stash-panel stash-panel-accent stash-layout-preview">
        <div className="stash-section-label">House Preview</div>
        <svg viewBox="0 0 1000 1000" className="stash-layout-preview-svg" preserveAspectRatio="xMidYMid meet">
          <rect x="0" y="0" width="1000" height="1000" className="stash-floorplan-bg" />
          {rooms.map((room) => (
            <g key={room.id}>
              <rect
                x={room.x} y={room.y} width={room.w} height={room.h}
                className="stash-preview-room-rect"
                style={{ fill: room.color, stroke: room.color }}
              />
              {zones.filter((z) => z.roomId === room.id).map((zone) => (
                <rect
                  key={zone.id}
                  x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                  className="stash-preview-zone-rect"
                />
              ))}
            </g>
          ))}
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
                              <span>{field.toUpperCase()}</span>
                              <input
                                className="stash-input"
                                type="number"
                                value={zone[field]}
                                onChange={(e) => actions.updateZone(zone.id, { [field]: Number(e.target.value) || 0 })}
                              />
                            </label>
                          ))}
                        </div>

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
