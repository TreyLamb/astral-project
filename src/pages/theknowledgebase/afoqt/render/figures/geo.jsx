// Shared drawing primitives for the lesson figures.
//
// Every figure in this folder is pure SVG with no dependencies, drawn from real geometry rather
// than hand-placed coordinates - so a figure that claims "these two angles are equal" is equal
// because the same number drew both, not because someone eyeballed it. That is the whole reason
// these are components instead of static images.
//
// STRUCTURE uses `currentColor` so the figure inherits the lesson's ink in both themes. Only
// MEANING gets a colour, from the small fixed palette below - the palette is chosen to sit
// legibly on both the light (#faf7f0) and dark (#26231d) surfaces, which is why it does not
// reuse --tkb-correct / --tkb-wrong (those are tuned for the light theme only and go muddy).

export const C = {
  a: '#60a5fa',    // "this group" - the given angle / the value you were handed
  b: '#f0b429',    // "the other group" - its supplement / the value it is confused with
  ok: '#34d399',   // the move that is correct
  no: '#f87171',   // the trap
  dim: '#9aa4b2',  // construction lines: heights, radii, guides - not part of the shape
};

export const rad = (deg) => (deg * Math.PI) / 180;

// Screen y grows downward, so every helper here negates it. Pass maths-convention degrees
// (0 = east, 90 = up) and get back screen pixels.
export const polar = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy - r * Math.sin(rad(deg))];

// An arc marking the angle between two rays out of (cx, cy). Used for every angle label in the
// folder, so an angle marker is never drawn at a size that disagrees with the angle it marks.
export function arcPath(cx, cy, r, from, to) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const sweep = ((to - from) % 360 + 360) % 360;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${x2} ${y2}`;
}

// The arc between two ray directions, always taking the SHORT way round.
//
// `arcPath` sweeps in one fixed direction, which means feeding it a vertex's two rays in the
// wrong order draws the reflex angle - a 47° apex renders as a 313° arc looping outside the
// triangle. It looks like a styling glitch rather than a wrong angle, so it survives review.
// Interior angles are always the minor arc, so this removes the ordering question entirely.
export function minorArc(cx, cy, r, d1, d2) {
  const diff = ((d2 - d1) % 360 + 360) % 360;
  return diff > 180 ? arcPath(cx, cy, r, d2, d1) : arcPath(cx, cy, r, d1, d2);
}

// The direction from one point to another, in the same maths-convention degrees everything else
// here uses. Written out because doing it inline gets the screen-y negation wrong roughly half
// the time.
export const dirTo = (fromX, fromY, toX, toY) => (Math.atan2(-(toY - fromY), toX - fromX) * 180) / Math.PI;

// The midpoint direction between two rays, on the short side - so a label sits inside the angle
// it belongs to rather than diametrically opposite it.
export function midDir(d1, d2) {
  const diff = ((d2 - d1) % 360 + 360) % 360;
  return diff > 180 ? d1 + (diff - 360) / 2 : d1 + diff / 2;
}

// Where the apex of a triangle lands, given a base and the two base angles. Every triangle in
// this folder is built this way rather than from hand-picked vertices: the angles in the caption
// and the angles in the drawing are then the same numbers by construction, so a figure cannot
// drift out of agreement with the text it illustrates.
export function apexFrom(bx, by, cx, cy, angleB, angleC) {
  const base = Math.hypot(cx - bx, cy - by);
  const baseDir = Math.atan2(cy - by, cx - bx);
  // Law of sines: the side from B to the apex, opposite angle C.
  const angleA = 180 - angleB - angleC;
  const bLen = (base * Math.sin(rad(angleC))) / Math.sin(rad(angleA));
  const dir = baseDir - rad(angleB); // screen y is down, so "up from the base" subtracts
  return [bx + bLen * Math.cos(dir), by + bLen * Math.sin(dir)];
}

// The square corner marker. Anywhere this appears the angle really is 90 - it is drawn from the
// two ray directions rather than assumed to be axis-aligned.
export function RightAngle({ cx, cy, a, b, size = 13, color = 'currentColor' }) {
  const [ax, ay] = polar(0, 0, size, a);
  const [bx, by] = polar(0, 0, size, b);
  const pts = [[cx, cy], [cx + ax, cy + ay], [cx + ax + bx, cy + ay + by], [cx + bx, cy + by]];
  return (
    <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
      fill="none" stroke={color} strokeWidth="1.5" opacity="0.75" />
  );
}

// Hatch marks across a segment's midpoint: one, two or three strokes. This is the standard
// notation for "these sides are equal", and using it means a figure can state equality without
// spending a label on it.
export function Ticks({ x1, y1, x2, y2, n = 1, size = 7, color = 'currentColor', gap = 5 }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const marks = [];
  for (let i = 0; i < n; i += 1) {
    const off = (i - (n - 1) / 2) * gap;
    const px = mx + ux * off;
    const py = my + uy * off;
    marks.push(
      <line key={i} x1={px - uy * size / 2} y1={py + ux * size / 2}
        x2={px + uy * size / 2} y2={py - ux * size / 2}
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />,
    );
  }
  return <g>{marks}</g>;
}

// A dashed segment for anything that is not an edge of the shape: a height dropped to a base, a
// radius, an axis. Keeping construction visually distinct from structure is what stops a reader
// counting a height as a side.
export function Guide({ x1, y1, x2, y2, color = C.dim, dash = '5 4' }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.8"
    strokeDasharray={dash} strokeLinecap="round" />;
}

// Text with a plate of surface colour behind it, so a label sitting on top of a line stays
// readable. `--tkb-surface` follows the theme, so this works on both.
//
// ⚠ KEEP LABELS SHORT - a few words at most. SVG text does not wrap and does not scroll, so a
// sentence wider than the viewBox is silently sliced off at BOTH ends and still looks like a
// deliberate caption. A whole explanatory line was lost this way in the isosceles figure and only
// a screenshot found it. Sentences belong in the `caption`, which is real HTML and wraps.
export function Label({ x, y, children, color = 'currentColor', size = 15, weight = 700, anchor = 'middle', plate = true, pad = 3 }) {
  const text = String(children);
  const w = text.length * size * 0.58 + pad * 2;
  const dx = anchor === 'middle' ? -w / 2 : anchor === 'end' ? -w : 0;
  return (
    <g>
      {plate && (
        <rect x={x + dx} y={y - size * 0.62 - pad} width={w} height={size + pad * 2}
          rx="3" fill="var(--tkb-surface)" opacity="0.88" />
      )}
      <text x={x} y={y} fill={color} fontSize={size} fontWeight={weight}
        textAnchor={anchor} dominantBaseline="middle">{text}</text>
    </g>
  );
}

// The standard wrapper. Every figure returns one of these, so spacing, caption width and the
// responsive max-width are decided once rather than per drawing.
export function Fig({ label, viewBox, width = 300, children, caption, wide = false }) {
  return (
    <figure className={'afq-geo-figure' + (wide ? ' afq-geo-wide' : '')}>
      <svg viewBox={viewBox} role="img" aria-label={label}
        style={{ width: '100%', maxWidth: `${width}px`, height: 'auto' }}>
        {children}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// A labelled slider under a figure, for the few cases where watching the numbers move IS the
// lesson - the transversal's "only two distinct values" and the parallelogram's "the slant side
// changes and the area does not" are both far more convincing when the reader drives them than
// when they are asserted. Deliberately rare: a control on a figure that has nothing to vary is
// noise.
export function FigSlider({ label, value, min, max, step = 1, onChange, suffix = '°' }) {
  return (
    <label className="afq-fig-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <output>{value}{suffix}</output>
    </label>
  );
}
