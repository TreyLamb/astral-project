import { computeCellRect, zoneAbs, roomsBounds } from './stashmapConfig';

// Tiny inline-SVG floor plan used by the Inventory breadcrumb hover
// popover: every room drawn faintly, the item's room framed, and its exact
// grid cell highlighted if it has one. Shares computeCellRect with
// MapView's own grid rendering so the geometry always matches.
export default function MiniFloorPlan({ rooms, zones, item }) {
  const room = rooms.find((r) => r.id === item?.roomId) || null;
  const rawZone = zones.find((z) => z.id === item?.zoneId) || null;
  // Zone coords are stored relative to their room; resolve before drawing.
  const zone = rawZone ? zoneAbs(rawZone, rooms.find((r) => r.id === rawZone.roomId)) : null;
  const cellRect = zone?.grid && item?.cell ? computeCellRect(zone, item.cell.row, item.cell.col) : null;

  // Framed to the rooms rather than the fixed canvas, so the thumbnail isn't
  // mostly empty space when the house doesn't fill the working area.
  const b = roomsBounds(rooms);
  const pad = Math.max(10, Math.min(b.w, b.h) * 0.04);
  const viewBox = `${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}`;

  return (
    <svg viewBox={viewBox} className="stash-mini-floorplan" preserveAspectRatio="xMidYMid meet">
      <rect
        x={b.x - pad} y={b.y - pad} width={b.w + pad * 2} height={b.h + pad * 2}
        className="stash-mini-bg"
      />

      {rooms.map((r) => (
        <rect
          key={r.id}
          x={r.x} y={r.y} width={r.w} height={r.h}
          className="stash-mini-room-rect"
          style={{ fill: r.color, stroke: r.color }}
        />
      ))}

      {room && (
        <rect
          x={room.x} y={room.y} width={room.w} height={room.h}
          className="stash-mini-room-rect-focused"
          style={{ stroke: room.color }}
        />
      )}

      {zone && (
        <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} className="stash-mini-zone-rect" />
      )}

      {cellRect && (
        <rect
          x={cellRect.x} y={cellRect.y} width={cellRect.w} height={cellRect.h}
          className="stash-mini-cell-highlight"
        />
      )}
    </svg>
  );
}
