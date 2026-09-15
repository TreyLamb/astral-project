import L from 'leaflet';

import sheetUrl from './data/assets/markers.png';
import spriteData from './data/markerSprites.json';
import {
  textSizeForZoom, DEFAULT_DETAIL_ZOOM, DOT_FILL, DOT_RING, DOT_FOUND,
} from './eftMapLabels';

// --- key callouts ----------------------------------------------------------
//
// A locked door draws as a target on the door itself plus a labelled key out in clear
// space, joined by a thin leader. See `calloutStyle` in eftMapLabels for why.

/** How far the label sits from the door, and in which directions it is tried. */
const CALLOUT_LEAD = 26;
// Up-right first: these are doors on buildings, and mapgenie's own place names sit below
// their points, so above is usually the emptier side.
const CALLOUT_DIRS = [
  [1, -1], [-1, -1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, -1], [0, 1],
];
// Tried at each direction before moving on, so a crowded corner pushes further out rather
// than giving up and stacking labels on each other.
const CALLOUT_REACH = [1, 1.9, 2.9, 4.2];

/**
 * A small key, drawn rather than cropped: the sheet's key art is a pin, not an icon.
 *
 * Drawn on a diagonal, which is not decoration. Horizontal, at the ~12px this renders at,
 * a ring-plus-shaft is exactly the shape of a lowercase "o" followed by a dash — the first
 * version read as the word "On" in front of every code on the map. Tilting it off the text
 * baseline stops it parsing as a letter, and a solid bow with a punched hole reads as a key
 * at sizes where an outlined ring just fills in.
 */
function drawKeyGlyph(ctx, x, y, size, color) {
  const r = size * 0.27;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'butt';

  // Bow: a thick-stroked ring, NOT a fill with the middle punched out —
  // `destination-out` would cut through the callout's own background and show the
  // basemap through the hole, because this is all one shared canvas.
  ctx.lineWidth = Math.max(1.5, r * 0.72);
  ctx.beginPath();
  ctx.arc(-size * 0.26, 0, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  const shaftH = Math.max(1.4, size * 0.15);
  ctx.fillRect(-size * 0.26, -shaftH / 2, size * 0.74, shaftH);
  // Teeth, on one side only — a symmetric comb reads as a bracket, not a key.
  const toothW = Math.max(1.4, size * 0.15);
  ctx.fillRect(size * 0.34, shaftH / 2, toothW, size * 0.26);
  ctx.fillRect(size * 0.05, shaftH / 2, toothW, size * 0.18);
  ctx.restore();
}

/** A padlock, for a door with no key behind it (keypad, breachable, unknown). */
function drawLockGlyph(ctx, x, y, size, color) {
  const w = size * 0.62;
  const h = size * 0.5;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.1, size * 0.12);
  ctx.beginPath();
  ctx.arc(x, y - h * 0.45, w * 0.32, Math.PI, 0);
  ctx.stroke();
  ctx.fillRect(x - w / 2, y - h * 0.1, w, h * 0.72);
  ctx.restore();
}

/** The precise door position: a ring with a dot, so the leader has something to land on. */
function drawTarget(ctx, x, y, color, dim) {
  ctx.save();
  ctx.globalAlpha = dim ? 0.45 : 1;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0d0d0b';
  ctx.beginPath();
  ctx.arc(x, y, 4.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, 4.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The leader: a hairline from the label to the door, with a small head at the door. */
function drawLeader(ctx, fromX, fromY, toX, toY, color, dim) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  // Stop short of the target ring so the line never crosses it.
  const endX = toX - Math.cos(angle) * 5.4;
  const endY = toY - Math.sin(angle) * 5.4;
  ctx.save();
  ctx.globalAlpha = dim ? 0.4 : 0.95;
  // Drawn twice: a dark casing under a thin bright line, so the leader survives running
  // across pale concrete and dark treeline in the same map.
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(13, 13, 11, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
}

// The detail-zoom dot, doubled from the 3.5px pip it shipped as. That was
// precise and effectively invisible: a red speck on a map already full of red
// and brown, and it is the only marker art left at this zoom.
const DOT_R = 7;
const DOT_RING_W = 3;

const LABEL_FONT = "'Bahnschrift', 'DIN Alternate', 'Roboto Condensed', 'Segoe UI', system-ui, sans-serif";

// Draws the source's own marker artwork.
//
// mapgenie ships one sprite sheet plus a category-id → rectangle table, both
// public and both already committed by `npm run eft:markers`. Every pin here is
// that PNG cropped, not a lookalike — the only thing this file decides is where
// on the canvas each crop lands.
//
// It is a single canvas rather than ~900 DOM markers because that many nodes
// makes panning stutter, and Leaflet's own circleMarker canvas path can't draw
// images. Hit-testing is therefore ours too, done against the same rectangles
// that were drawn.

const POSITIONS = spriteData.positions || {};
export const SPRITE_GLYPHS = spriteData.glyphs || {};

export const MARKER_SCALES = { small: 0.62, normal: 0.85, large: 1.15 };

let sheetPromise = null;

function loadSheet() {
  if (!sheetPromise) {
    sheetPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('sprite sheet failed to load'));
      img.src = sheetUrl;
    });
  }
  return sheetPromise;
}

export const hasSprite = (catId) => !!POSITIONS[catId];

/** Sheet rectangle for a category, as a CSS-pixel background offset. */
export function spriteStyle(catId, height = 20) {
  const p = POSITIONS[catId];
  if (!p) return null;
  const scale = height / (p.height / p.pixelRatio);
  const cssW = (p.width / p.pixelRatio) * scale;
  return {
    width: `${cssW}px`,
    height: `${height}px`,
    backgroundImage: `url(${sheetUrl})`,
    backgroundPosition: `-${(p.x / p.pixelRatio) * scale}px -${(p.y / p.pixelRatio) * scale}px`,
    backgroundSize: `${(spriteData.sheetWidth || 462) / p.pixelRatio * scale}px auto`,
  };
}

export const SpriteMarkerLayer = L.Layer.extend({
  initialize(options) {
    L.setOptions(this, options);
    this._items = [];
    this._hits = [];
  },

  onAdd(map) {
    this._map = map;
    const canvas = L.DomUtil.create('canvas', 'eft-sprite-layer leaflet-zoom-animated');
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    map.getPanes().overlayPane.appendChild(canvas);

    map.on('move zoomend resize', this._reset, this);
    if (map.options.zoomAnimation && L.Browser.any3d) map.on('zoomanim', this._animateZoom, this);

    loadSheet().then((img) => {
      this._sheet = img;
      this._draw();
    }).catch(() => { /* falls back to plain dots */ });

    this._reset();
  },

  onRemove(map) {
    map.off('move zoomend resize', this._reset, this);
    map.off('zoomanim', this._animateZoom, this);
    if (this._canvas?.parentNode) this._canvas.parentNode.removeChild(this._canvas);
    this._canvas = null;
    this._map = null;
  },

  /** `items` are `{ marker, point: [y, x], colour, dim }`, already projected. */
  setItems(items) {
    this._items = items || [];
    this._draw();
    return this;
  },

  setScale(scale) {
    this._scale = scale || 1;
    this._draw();
    return this;
  },

  setDetailZoom(z) {
    this._detailZoom = Number.isFinite(z) ? z : DEFAULT_DETAIL_ZOOM;
    this._draw();
    return this;
  },

  // Mirrors Leaflet's own Canvas renderer so the layer tracks the zoom
  // animation instead of jumping at the end of it.
  _animateZoom(e) {
    const scale = this._map.getZoomScale(e.zoom, this._map._zoom);
    const offset = this._map._latLngBoundsToNewLayerBounds(
      this._map.getBounds(), e.zoom, e.center,
    ).min;
    L.DomUtil.setTransform(this._canvas, offset, scale);
  },

  _reset() {
    if (!this._map || !this._canvas) return;
    const map = this._map;
    const size = map.getSize();
    const dpr = window.devicePixelRatio || 1;

    L.DomUtil.setTransform(this._canvas, map.containerPointToLayerPoint([0, 0]), 1);

    if (this._canvas.width !== size.x * dpr || this._canvas.height !== size.y * dpr) {
      this._canvas.width = size.x * dpr;
      this._canvas.height = size.y * dpr;
      this._canvas.style.width = `${size.x}px`;
      this._canvas.style.height = `${size.y}px`;
    }
    this._draw();
  },

  _draw() {
    const ctx = this._ctx;
    const map = this._map;
    if (!ctx || !map) return;

    const dpr = window.devicePixelRatio || 1;
    const size = map.getSize();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.x, size.y);

    const scale = this._scale || 1;
    const hits = [];
    const labels = [];
    const callouts = [];
    const zoom = map.getZoom();
    // A pin sitting just off-screen still has its point on-screen, so pad the
    // cull box by one marker rather than by nothing.
    const pad = 60;

    // Zoomed in far enough that precision matters more than legibility at a
    // glance: pins become an exact dot plus a name.
    const detail = zoom >= (this._detailZoom ?? DEFAULT_DETAIL_ZOOM);

    for (const item of this._items) {
      const pt = map.latLngToContainerPoint(item.point);
      if (pt.x < -pad || pt.y < -pad || pt.x > size.x + pad || pt.y > size.y + pad) continue;

      // A locked door is drawn as a target plus an offset key, settled last against
      // everything else on the canvas so the leader never runs under another name.
      if (item.callout) { callouts.push({ item, pt }); continue; }

      // Text categories are collected and drawn last, so a place name is never
      // buried under the pins around it.
      if (item.label) labels.push({ item, pt });
      else if (detail && item.pin && item.auto) labels.push({ item, pt, auto: true });
      if (!item.pin) continue;

      if (detail) {
        // The dot IS the coordinate — no anchor offset, no artwork.
        ctx.globalAlpha = item.dim ? 0.4 : 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, DOT_R + DOT_RING_W, 0, Math.PI * 2);
        ctx.fillStyle = DOT_RING;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, DOT_R, 0, Math.PI * 2);
        ctx.fillStyle = item.dim ? DOT_FOUND : DOT_FILL;
        ctx.fill();
        const grab = DOT_R + DOT_RING_W;
        hits.push({ marker: item.marker, x: pt.x - grab, y: pt.y - grab, w: grab * 2, h: grab * 2 });
        continue;
      }

      const p = POSITIONS[item.marker.cat];
      ctx.globalAlpha = item.dim ? 0.32 : 1;

      if (p && this._sheet) {
        const w = (p.width / p.pixelRatio) * scale;
        const h = (p.height / p.pixelRatio) * scale;
        // Pin art: the tip is the position, so anchor bottom-centre.
        const x = pt.x - w / 2;
        const y = pt.y - h;
        ctx.drawImage(this._sheet, p.x, p.y, p.width, p.height, x, y, w, h);
        hits.push({ marker: item.marker, x, y, w, h });
      } else {
        const r = 5 * scale;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = item.colour || '#cdbb96';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#0d0d0b';
        ctx.stroke();
        hits.push({ marker: item.marker, x: pt.x - r, y: pt.y - r, w: r * 2, h: r * 2 });
      }

      if (item.dim) {
        // A found marker needs to read as done at a glance, not just as faint.
        const tick = 5 * scale;
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#7a9a5c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pt.x - tick, pt.y - tick);
        ctx.lineTo(pt.x, pt.y);
        ctx.lineTo(pt.x + tick * 1.6, pt.y - tick * 2);
        ctx.stroke();
      }
    }

    // --- text labels, on top of every pin --------------------------------
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    // Measure everything first, so a label that has to dodge knows what it is dodging.
    const placed = [];
    const queued = [];
    for (const { item, pt, auto } of labels) {
      const style = auto ? item.auto : item.label;
      if (!style?.text) continue;
      const px = textSizeForZoom(zoom, style.sizes, { persist: style.persist });
      // Zero means "too far in for names" — see textSizeForZoom. A `persist` label never
      // returns zero, because for those the text IS the marker.
      if (px <= 0) continue;
      ctx.font = `${style.weight || 600} ${px}px ${LABEL_FONT}`;
      // A category that also has a pin puts its name below the point, since
      // the pin (or, at detail zoom, the dot) occupies the point itself.
      const y = item.pin
        ? pt.y + (detail ? DOT_R + DOT_RING_W + px * 0.55 : px * 0.9)
        : pt.y;
      const w = ctx.measureText(style.text).width;
      const box = { x: pt.x - w / 2, y: y - px / 2, w, h: px };
      // Labels that keep the source's own placement are laid down first and claim their
      // space; the ones that dodge are settled afterwards, against the finished picture.
      if (style.persist) queued.push({ item, pt, style, px, y, w });
      else { placed.push(box); queued.push({ item, pt, style, px, y, w, box }); }
    }

    const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x
      && a.y < b.y + b.h && a.y + a.h > b.y;

    // A BTR stop has no pin behind its name, so it cannot just be dropped when it collides —
    // dropping it deletes the stop from the map. It is nudged instead: straight up first,
    // because these sit on roads and junctions where the clear space is usually above.
    const NUDGES = [0, -1, 1, -2, 2, -3, 3];

    for (const entry of queued) {
      const { item, pt, style, px, w } = entry;
      let { y } = entry;
      let box = entry.box;

      if (!box) {
        for (const step of NUDGES) {
          const tryY = y + step * px * 1.35;
          const tryBox = { x: pt.x - w / 2, y: tryY - px / 2, w, h: px };
          if (!placed.some((other) => overlaps(tryBox, other))) { y = tryY; box = tryBox; break; }
        }
        // Every candidate collided. Draw it anyway at its own coordinate — an overlapping
        // name still tells you a BTR stops here, and it is drawn last so it reads on top.
        if (!box) box = { x: pt.x - w / 2, y: y - px / 2, w, h: px };
        placed.push(box);
      }

      ctx.font = `${style.weight || 600} ${px}px ${LABEL_FONT}`;
      ctx.globalAlpha = item.dim ? 0.35 : 1;
      if (style.haloWidth) {
        ctx.strokeStyle = style.haloColor;
        ctx.lineWidth = style.haloWidth * 2;
        ctx.strokeText(style.text, pt.x, y);
      }
      ctx.fillStyle = style.color;
      ctx.fillText(style.text, pt.x, y);

      hits.push({ marker: item.marker, ...box });
    }

    // --- key callouts, last of all ---------------------------------------
    //
    // Settled against the finished picture for the same reason the BTR labels are: the
    // whole point of a leader is that the label sits in clear space, so it has to know
    // what "clear" means. Every door still gets one — on a collision the label moves
    // further out, and if nothing is clear it draws anyway rather than deleting a door.
    for (const { item, pt } of callouts) {
      const style = item.callout;
      const px = textSizeForZoom(zoom, style.sizes, { persist: true });
      ctx.font = `${style.weight || 800} ${px}px ${LABEL_FONT}`;
      const glyph = px * 1.15;
      const padX = px * 0.42;
      const gap = px * 0.3;
      const textW = ctx.measureText(style.text).width;
      const w = padX * 2 + glyph + gap + textW;
      const h = px * 1.5;

      let box = null;
      for (const reach of CALLOUT_REACH) {
        for (const [dx, dy] of CALLOUT_DIRS) {
          const len = CALLOUT_LEAD * reach;
          // Normalised so a diagonal is not 1.41x further out than a straight one.
          const norm = Math.hypot(dx, dy) || 1;
          const cx = pt.x + (dx / norm) * (len + w / 2);
          const cy = pt.y + (dy / norm) * (len + h / 2);
          const candidate = { x: cx - w / 2, y: cy - h / 2, w, h };
          if (!placed.some((other) => overlaps(candidate, other))) { box = candidate; break; }
        }
        if (box) break;
      }
      if (!box) {
        const norm = Math.SQRT2;
        box = { x: pt.x + (CALLOUT_LEAD / norm), y: pt.y - (CALLOUT_LEAD / norm) - h, w, h };
      }
      placed.push(box);

      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      // Leave the box from the edge facing the door, not from its centre, so the leader
      // never draws across its own label.
      const ang = Math.atan2(pt.y - cy, pt.x - cx);
      const half = Math.min(
        Math.abs(box.w / 2 / (Math.cos(ang) || 1e-6)),
        Math.abs(box.h / 2 / (Math.sin(ang) || 1e-6)),
      );
      drawLeader(ctx, cx + Math.cos(ang) * half, cy + Math.sin(ang) * half, pt.x, pt.y, style.color, item.dim);
      drawTarget(ctx, pt.x, pt.y, style.color, item.dim);

      ctx.globalAlpha = item.dim ? 0.42 : 1;
      ctx.fillStyle = 'rgba(13, 13, 11, 0.86)';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

      const glyphX = box.x + padX + glyph / 2;
      if (style.glyph === 'lock') drawLockGlyph(ctx, glyphX, cy, glyph, style.color);
      else drawKeyGlyph(ctx, glyphX, cy, glyph, style.color);

      ctx.font = `${style.weight || 800} ${px}px ${LABEL_FONT}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = style.color;
      ctx.fillText(style.text, box.x + padX + glyph + gap, cy + 0.5);
      ctx.textAlign = 'center';

      // Both the label and the door itself answer a hover — you point at whichever of
      // the two you can see.
      hits.push({ marker: item.marker, ...box });
      hits.push({ marker: item.marker, x: pt.x - 7, y: pt.y - 7, w: 14, h: 14 });
    }

    ctx.globalAlpha = 1;
    // Last drawn is topmost, so search backwards when hit-testing.
    this._hits = hits.reverse();
  },

  hitTest(containerPoint) {
    const { x, y } = containerPoint;
    for (const h of this._hits) {
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h.marker;
    }
    return null;
  },
});

export const spriteMarkerLayer = (options) => new SpriteMarkerLayer(options);
