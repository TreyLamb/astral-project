import { useState, useEffect } from 'react';
import { useStashMap } from './stashmapContext';
import { buildBreadcrumb } from './stashmapConfig';

export default function MapView() {
  const { rooms, zones, items, selectedItemId, focusToken, actions } = useStashMap();
  const [focusedRoomId, setFocusedRoomId] = useState(null);
  const [focusedZoneId, setFocusedZoneId] = useState(null);
  const [focusedCell, setFocusedCell] = useState(null);

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
      </div>

      <div className="stash-map-layout">
        <div className="stash-floorplan-wrap">
          <svg viewBox={viewBox} className="stash-floorplan-svg" preserveAspectRatio="xMidYMid meet">
            <rect x="0" y="0" width="1000" height="1000" className="stash-floorplan-bg" />

            {rooms.map((room) => {
              const isRoomFocused = room.id === focusedRoomId;
              const roomHighlighted = highlightedItem?.roomId === room.id && !highlightedItem?.zoneId;

              return (
                <g key={room.id}>
                  <rect
                    x={room.x} y={room.y} width={room.w} height={room.h}
                    className={`stash-room-rect${isRoomFocused ? ' stash-room-rect-focused' : ''}`}
                    style={{ fill: room.color, stroke: room.color }}
                    onClick={() => handleRoomClick(room)}
                  />
                  <text x={room.x + 12} y={room.y + 28} className="stash-room-label">{room.name}</text>

                  {zones.filter((z) => z.roomId === room.id).map((zone) => {
                    const zoneItemCount = itemsInZone(zone.id).length;
                    const isZoneFocused = zone.id === focusedZoneId;
                    const zoneHighlighted = highlightedItem?.zoneId === zone.id && !highlightedItem?.cell;

                    return (
                      <g key={zone.id}>
                        <rect
                          x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                          className={`stash-zone-rect${isZoneFocused ? ' stash-zone-rect-focused' : ''}`}
                          onClick={() => handleZoneClick(zone)}
                        />
                        <text x={zone.x + 6} y={zone.y + 16} className="stash-zone-label">{zone.name}</text>

                        {zone.grid && Array.from({ length: zone.grid.rows }, (_, row) => (
                          Array.from({ length: zone.grid.cols }, (_, col) => {
                            const cw = zone.w / zone.grid.cols;
                            const ch = zone.h / zone.grid.rows;
                            const cx = zone.x + col * cw;
                            const cy = zone.y + row * ch;
                            const count = itemsInCell(zone.id, row, col).length;
                            const isCellFocused = isZoneFocused && focusedCell
                              && focusedCell.row === row && focusedCell.col === col;
                            const isCellHighlighted = highlightedItem?.zoneId === zone.id
                              && highlightedItem?.cell?.row === row && highlightedItem?.cell?.col === col;

                            return (
                              <g key={`${row}-${col}`}>
                                <rect
                                  x={cx} y={cy} width={cw} height={ch}
                                  className={
                                    'stash-cell-rect'
                                    + (isCellFocused ? ' stash-cell-rect-focused' : '')
                                    + (isCellHighlighted ? ' stash-cell-highlight' : '')
                                  }
                                  onClick={() => handleCellClick(zone, row, col)}
                                />
                                {count > 0 && (
                                  <text x={cx + cw - 4} y={cy + 12} className="stash-cell-badge" textAnchor="end">
                                    {count}
                                  </text>
                                )}
                              </g>
                            );
                          })
                        ))}

                        {!zone.grid && zoneItemCount > 0 && (
                          <text x={zone.x + zone.w - 6} y={zone.y + 16} className="stash-zone-badge" textAnchor="end">
                            {zoneItemCount}
                          </text>
                        )}

                        {!zone.grid && zoneHighlighted && (
                          <rect
                            x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                            className="stash-cell-highlight stash-zone-highlight-overlay"
                          />
                        )}
                      </g>
                    );
                  })}

                  {roomHighlighted && (
                    <rect
                      x={room.x + 4} y={room.y + 4} width={room.w - 8} height={room.h - 8}
                      className="stash-cell-highlight stash-room-highlight-overlay"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

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
  );
}
