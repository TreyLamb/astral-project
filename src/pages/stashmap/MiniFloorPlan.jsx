import { computeCellRect } from './stashmapConfig';

// Tiny inline-SVG floor plan used by the Inventory breadcrumb hover
// popover: every room drawn faintly, the item's room framed, and its exact
// grid cell highlighted if it has one. Shares computeCellRect with
// MapView's own grid rendering so the geometry always matches.
export default function MiniFloorPlan({ rooms, zones, item }) {
  const room = rooms.find((r) => r.id === item?.roomId) || null;
  const zone = zones.find((z) => z.id === item?.zoneId) || null;
  const cellRect = zone?.grid && item?.cell ? computeCellRect(zone, item.cell.row, item.cell.col) : null;

  return (
    <svg viewBox="0 0 1000 1000" className="stash-mini-floorplan" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="1000" height="1000" className="stash-mini-bg" />

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
