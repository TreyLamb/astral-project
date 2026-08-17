import L from 'leaflet';

import sheetUrl from './data/assets/markers.png';
import spriteData from './data/markerSprites.json';
import {
  textSizeForZoom, autoLabel, DEFAULT_DETAIL_ZOOM, DOT_FILL, DOT_RING, DOT_FOUND,
} from './eftMapLabels';

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

      // Text categories are collected and drawn last, so a place name is never
      // buried under the pins around it.
      if (item.label) labels.push({ item, pt });
      else if (detail && item.pin && item.auto) labels.push({ item, pt, auto: true });
      if (!item.pin) continue;

      if (detail) {
        // The dot IS the coordinate — no anchor offset, no artwork.
        const r = 3.5;
        ctx.globalAlpha = item.dim ? 0.4 : 1;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r + 1.5, 0, Math.PI * 2);
        ctx.fillStyle = DOT_RING;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = item.dim ? DOT_FOUND : DOT_FILL;
        ctx.fill();
        const grab = 7;
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

    for (const { item, pt, auto } of labels) {
      const style = auto ? item.auto : item.label;
      if (!style) continue;
      const { text, color, haloWidth, haloColor, sizes } = style;
      if (!text) continue;
      const px = textSizeForZoom(zoom, sizes);
      // Zero means "too far in for names" — see textSizeForZoom.
      if (px <= 0) continue;
      ctx.font = `600 ${px}px ${LABEL_FONT}`;
      // A category that also has a pin puts its name below the point, since
      // the pin (or, at detail zoom, the dot) occupies the point itself.
      const y = item.pin ? pt.y + px * 0.9 : pt.y;

      ctx.globalAlpha = item.dim ? 0.35 : 1;
      if (haloWidth) {
        ctx.strokeStyle = haloColor;
        ctx.lineWidth = haloWidth * 2;
        ctx.strokeText(text, pt.x, y);
      }
      ctx.fillStyle = color;
      ctx.fillText(text, pt.x, y);

      const w = ctx.measureText(text).width;
      hits.push({ marker: item.marker, x: pt.x - w / 2, y: y - px / 2, w, h: px });
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
