import { useCallback, useRef, useState } from 'react';
import MiniFloorPlan from './MiniFloorPlan';
import { buildBreadcrumb } from './stashmapConfig';

const POPOVER_WIDTH = 220;
const POPOVER_HEIGHT = 220;

// Clickable location control shared by the flat table (full breadcrumb) and
// the grouped-by-room view (short "zone · R#·C#" sub-label). Hovering shows
// an attached mini floor-plan preview; clicking still jumps to the Map
// (hover = preview, click = jump). Positioned with `fixed` off the
// trigger's own bounding rect so it can never get clipped by an ancestor's
// overflow, and clamped to the viewport so it never falls off-screen.
export default function LocationHover({
  item, rooms, zones, items, onFocus, variant = 'breadcrumb', label,
}) {
  const [hoverPos, setHoverPos] = useState(null);
  const triggerRef = useRef(null);

  const openPopover = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > POPOVER_HEIGHT + 12 ? rect.bottom + 8 : rect.top - POPOVER_HEIGHT - 8;
    setHoverPos({ top: Math.max(8, top), left: Math.max(8, left) });
  }, []);

  const closePopover = useCallback(() => setHoverPos(null), []);

  if (!item.roomId) {
    return <span className="stash-item-location stash-item-unplaced">Unplaced</span>;
  }

  const breadcrumb = buildBreadcrumb(item, rooms, zones);
  const zone = zones.find((z) => z.id === item.zoneId) || null;
  const usage = zone && zone.capacity != null && items
    ? ` · ${items.filter((i) => i.zoneId === zone.id).length}/${zone.capacity}`
    : '';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={variant === 'sub' ? 'stash-link stash-sub-location' : 'stash-link stash-item-location'}
        onMouseEnter={openPopover}
        onMouseLeave={closePopover}
        onFocus={openPopover}
        onBlur={closePopover}
        onClick={() => onFocus(item.id)}
      >
        {variant === 'sub' ? label : `📍 ${breadcrumb}`}
      </button>

      {hoverPos && (
        <div className="stash-breadcrumb-popover" style={{ top: hoverPos.top, left: hoverPos.left }}>
          <MiniFloorPlan rooms={rooms} zones={zones} item={item} />
          <div className="stash-breadcrumb-popover-caption">{breadcrumb}{usage}</div>
        </div>
      )}
    </>
  );
}
