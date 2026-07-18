// Pure geometry/pointer-math helpers shared by MapView's direct-manipulation
// canvas and LayoutView's rough-placement canvas — framework-agnostic (no
// React) so both views run the exact same drag/resize/snap math instead of
// two implementations quietly drifting apart.

export const CANVAS_MIN = 0;
export const CANVAS_MAX = 1000;
export const SNAP_GRID = 20;
export const SNAP_THRESHOLD = 10;
export const DRAG_THRESHOLD = 4;
export const MIN_ROOM_SIZE = 60;
export const MIN_ZONE_SIZE = 30;

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Converts a pointer event's screen coordinates into the SVG's own viewBox
// coordinate space via the element's screen CTM. This is what keeps drag
// math correct regardless of the current zoom/frame (viewBox) or CSS
// scaling, without us tracking those transforms by hand.
export function screenToSvgPoint(svg, clientX, clientY) {
  if (!svg) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const local = pt.matrixTransform(ctm.inverse());
  return { x: local.x, y: local.y };
}

export function snapToGrid(value, gridSize = SNAP_GRID) {
  return Math.round(value / gridSize) * gridSize;
}

// Snaps `value` to whichever candidate is closest within `threshold`, else
// returns null (no snap). Candidates are other objects' edges plus canvas
// bounds — the caller decides what counts as a candidate for the drag.
export function snapEdge(value, candidates, threshold = SNAP_THRESHOLD) {
  let best = null;
  let bestDist = threshold;
  for (const c of candidates) {
    const dist = Math.abs(value - c);
    if (dist <= bestDist) {
      best = c;
      bestDist = dist;
    }
  }
  return best;
}

export function clampPosition(x, y, w, h, max = CANVAS_MAX, min = CANVAS_MIN) {
  return { x: clamp(x, min, max - w), y: clamp(y, min, max - h) };
}

export function clampRect(rect, minSize, max = CANVAS_MAX, min = CANVAS_MIN) {
  let { x, y, w, h } = rect;
  w = clamp(w, minSize, max - min);
  h = clamp(h, minSize, max - min);
  x = clamp(x, min, max - w);
  y = clamp(y, min, max - h);
  return { x, y, w, h };
}

// Corner-resize math for a single corner drag: dx/dy is pointer movement
// since drag start (SVG units), startRect is the rect's shape at drag
// start. Anchors the OPPOSITE corner so it doesn't drift while resizing.
export function resizeCorner(startRect, corner, dx, dy, minSize) {
  let { x, y, w, h } = startRect;
  if (corner === 'se') {
    w = startRect.w + dx;
    h = startRect.h + dy;
  } else if (corner === 'sw') {
    w = startRect.w - dx;
    h = startRect.h + dy;
    x = startRect.x + dx;
  } else if (corner === 'ne') {
    w = startRect.w + dx;
    h = startRect.h - dy;
    y = startRect.y + dy;
  } else if (corner === 'nw') {
    w = startRect.w - dx;
    h = startRect.h - dy;
    x = startRect.x + dx;
    y = startRect.y + dy;
  }

  if (w < minSize) {
    const rightEdge = startRect.x + startRect.w;
    w = minSize;
    if (corner === 'sw' || corner === 'nw') x = rightEdge - minSize;
  }
  if (h < minSize) {
    const bottomEdge = startRect.y + startRect.h;
    h = minSize;
    if (corner === 'ne' || corner === 'nw') y = bottomEdge - minSize;
  }

  return clampRect({ x, y, w, h }, minSize);
}
