import { useState } from 'react';
import { C, Fig, Label, Guide, RightAngle } from './geo.jsx';

// Figures for Chapter 12 (coordinate geometry). The chapter's own diagnosis is that "almost every
// error here is an orientation error - run over rise, x and y swapped, a sign lost on the way
// down", and that "the wrong answers are the same numbers arranged differently rather than
// different numbers". Numbers arranged differently is precisely the failure a picture fixes,
// because on a grid 12/5 and 5/12 are not two arrangements of one thing, they are two visibly
// different lines.

const AX = { x0: 34, y0: 206, u: 11.6 };
const px = (x) => AX.x0 + x * AX.u;
const py = (y) => AX.y0 - y * AX.u;

function Grid({ xMax, yMax, step = 1 }) {
  const lines = [];
  for (let x = 0; x <= xMax; x += step) {
    lines.push(<line key={`v${x}`} x1={px(x)} y1={py(0)} x2={px(x)} y2={py(yMax)}
      stroke="currentColor" strokeWidth="0.6" opacity="0.13" />);
  }
  for (let y = 0; y <= yMax; y += step) {
    lines.push(<line key={`h${y}`} x1={px(0)} y1={py(y)} x2={px(xMax)} y2={py(y)}
      stroke="currentColor" strokeWidth="0.6" opacity="0.13" />);
  }
  return (
    <g>
      {lines}
      <line x1={px(0)} y1={py(0)} x2={px(xMax)} y2={py(0)} stroke="currentColor" strokeWidth="1.8" />
      <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(yMax)} stroke="currentColor" strokeWidth="1.8" />
    </g>
  );
}

// --- 1/2/3. One picture, three formulas -----------------------------------
//
// Slope, midpoint and distance are taught as three formulas and they are three readings of a
// single right triangle: the legs are the coordinate differences, the slope is one leg over the
// other, the distance is the hypotenuse, and the midpoint is the middle of the sloped side. The
// chapter already says distance "is not a new formula", so drawing them apart would contradict it.
// The chips switch which reading is lit; the triangle never moves.

const MODES = [
  { id: 'slope', name: 'Slope' },
  { id: 'mid', name: 'Midpoint' },
  { id: 'dist', name: 'Distance' },
];

export function SlopeMidpointDistance() {
  const [mode, setMode] = useState('slope');
  const p1 = [2, 3];
  const p2 = [7, 15];
  const run = p2[0] - p1[0];
  const rise = p2[1] - p1[1];
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const corner = [p2[0], p1[1]];

  const dim = (on) => (on ? 1 : 0.2);

  return (
    <div className="afq-fig-interactive">
      <Fig
        width={300}
        viewBox="0 0 196 232"
        label="Two points on a grid joined by a line, with the horizontal and vertical differences drawn as a right triangle"
        caption={
          mode === 'slope' ? (
            <>
              <strong style={{ color: C.b }}>Rise</strong> is how far up,{' '}
              <strong style={{ color: C.a }}>run</strong> is how far across, and slope is{' '}
              <strong>rise over run = 12/5</strong>. Flip them and you get 5/12 — a line so much
              flatter it is a different picture, which is the point: on a grid the trap stops being
              plausible. This line climbs steeply, so its slope is bigger than 1.
            </>
          ) : mode === 'mid' ? (
            <>
              The <strong style={{ color: C.ok }}>midpoint</strong> is the middle of the joining
              line, so it must sit <em>between</em> the two ends in both directions — here{' '}
              <strong>(4.5, 9)</strong>. You get it by <strong>averaging</strong>: x is halfway from
              2 to 7, y is halfway from 3 to 15. Subtracting instead throws the answer off the
              segment entirely, and that is the check — a midpoint outside the two points is wrong
              on sight.
            </>
          ) : (
            <>
              The <strong style={{ color: C.no }}>distance</strong> is the sloped side of the same
              triangle, so it is just <strong>Pythagoras</strong> on the run and the rise:
              5² + 12² = 169, and √169 = <strong>13</strong>. Those three numbers are the 5-12-13
              triple, and real items are usually built on a triple — spot one and there is no
              arithmetic left to do. Note the distance is longer than either leg, always.
            </>
          )
        }
      >
        <Grid xMax={9} yMax={17} />

        <g opacity={dim(mode === 'slope')}>
          <line x1={px(p1[0])} y1={py(p1[1])} x2={px(corner[0])} y2={py(corner[1])}
            stroke={C.a} strokeWidth="3.4" strokeLinecap="round" />
          <line x1={px(corner[0])} y1={py(corner[1])} x2={px(p2[0])} y2={py(p2[1])}
            stroke={C.b} strokeWidth="3.4" strokeLinecap="round" />
          <RightAngle cx={px(corner[0])} cy={py(corner[1])} a={180} b={90} size={11} color={C.dim} />
        </g>

        <line x1={px(p1[0])} y1={py(p1[1])} x2={px(p2[0])} y2={py(p2[1])}
          stroke={mode === 'dist' ? C.no : 'currentColor'}
          strokeWidth={mode === 'dist' ? 3.8 : 2.2} strokeLinecap="round" />

        {mode === 'mid' && (
          <>
            <Guide x1={px(0)} y1={py(mid[1])} x2={px(mid[0])} y2={py(mid[1])} color={C.ok} />
            <Guide x1={px(mid[0])} y1={py(0)} x2={px(mid[0])} y2={py(mid[1])} color={C.ok} />
            <circle cx={px(mid[0])} cy={py(mid[1])} r="5.5" fill={C.ok} />
          </>
        )}

        <circle cx={px(p1[0])} cy={py(p1[1])} r="4.5" fill="currentColor" />
        <circle cx={px(p2[0])} cy={py(p2[1])} r="4.5" fill="currentColor" />
        {/* above-left of the point: below it is where the run leg and its label live */}
        <Label x={px(p1[0]) - 7} y={py(p1[1]) - 15} color="currentColor" size={12} anchor="end">(2, 3)</Label>
        <Label x={px(p2[0]) + 4} y={py(p2[1]) - 13} color="currentColor" size={12}>(7, 15)</Label>

        {mode === 'slope' && (
          <>
            <Label x={(px(p1[0]) + px(corner[0])) / 2} y={py(p1[1]) + 15} color={C.a} size={13}>run 5</Label>
            <Label x={px(corner[0]) + 28} y={(py(corner[1]) + py(p2[1])) / 2} color={C.b} size={13}>rise 12</Label>
          </>
        )}
        {mode === 'mid' && <Label x={px(mid[0]) + 34} y={py(mid[1])} color={C.ok} size={13}>(4.5, 9)</Label>}
        {mode === 'dist' && (
          <Label x={px(p1[0]) + 6} y={(py(p1[1]) + py(p2[1])) / 2 - 4} color={C.no} size={14} anchor="end">13</Label>
        )}
      </Fig>

      <div className="afq-fig-chips">
        {MODES.map((m) => (
          <button key={m.id} type="button"
            className={'afq-fig-chip' + (mode === m.id ? ' afq-fig-chip-on' : '')}
            onClick={() => setMode(m.id)}>{m.name}</button>
        ))}
      </div>
    </div>
  );
}

// --- 5. Intercepts: each one zeroes the OTHER variable --------------------
//
// The reversal is the entire item, and the reason the reversal is easy is that "x-intercept" and
// "set x = 0" contain the same letter. On a picture the letters stop mattering: the x-intercept is
// the point sitting ON the x-axis, and every point on the x-axis has a height of zero.

export function Intercepts() {
  const xInt = 21;
  const yInt = 12;
  const u = 8.2;
  const ox = 40;
  const oy = 150;
  const X = (x) => ox + x * u;
  const Y = (y) => oy - y * u;

  return (
    <Fig
      wide
      width={400}
      viewBox="0 0 260 182"
      label="A line crossing both axes, with the x-intercept and y-intercept marked"
      caption={
        <>
          The <strong style={{ color: C.a }}>x-intercept</strong> is where the line touches the
          x-axis. Every point on that axis has <strong>height zero</strong>, so you set{' '}
          <strong>y = 0</strong> to find it — 4x = 84, x = 21. The{' '}
          <strong style={{ color: C.b }}>y-intercept</strong> sits on the vertical axis, where
          across-ness is zero, so you set <strong>x = 0</strong> — 7y = 84, y = 12. Each intercept
          is found by zeroing <em>the other</em> letter, which is exactly the step that gets
          reversed under time pressure.
        </>
      }
    >
      <line x1={ox - 12} y1={oy} x2={X(26)} y2={oy} stroke="currentColor" strokeWidth="1.8" />
      <line x1={ox} y1={oy + 12} x2={ox} y2={Y(16)} stroke="currentColor" strokeWidth="1.8" />
      <line x1={X(-1.5)} y1={Y(yInt + 0.857)} x2={X(24)} y2={Y(-1.714)}
        stroke="currentColor" strokeWidth="2.6" />

      <Guide x1={X(xInt)} y1={oy} x2={X(xInt)} y2={Y(3)} color={C.a} />
      <circle cx={X(xInt)} cy={oy} r="5.5" fill={C.a} />
      <circle cx={ox} cy={Y(yInt)} r="5.5" fill={C.b} />

      <Label x={X(xInt)} y={oy + 19} color={C.a} size={13}>(21, 0)</Label>
      <Label x={ox + 38} y={Y(yInt)} color={C.b} size={13}>(0, 12)</Label>
      <Label x={X(xInt) - 6} y={Y(4.4)} color={C.a} size={11} weight={600} anchor="end">y = 0 here</Label>
      <Label x={ox + 38} y={Y(yInt) - 17} color={C.b} size={11} weight={600}>x = 0 here</Label>
      <Label x={X(16)} y={Y(9)} color="currentColor" size={13}>4x + 7y = 84</Label>
    </Fig>
  );
}

// --- 6. Perpendicular is the same staircase, turned ------------------------
//
// "Flip it and change the sign" is two instructions and the chapter says doing only half of it is
// the common miss. The picture collapses both halves into one act: the step triangle on the second
// line is the first line's triangle rotated a quarter turn, so the 1 and the 3 swap places
// (the flip) and the climb becomes a fall (the sign) in a single motion.

export function PerpendicularSlopes() {
  const cx = 130;
  const cy = 100;
  const u = 24;
  const m1 = 3;
  // Both lines are drawn from an explicit x-range through the crossing point, with screen-y
  // negating the slope. Extending them by "multiples of u" instead - which is what this did
  // first - runs the steep line 245px down a 196px viewBox and silently clips it.
  const at = (m, d) => [cx + d, cy - m * d];
  const blue = [at(m1, -22), at(m1, 26)];
  const amber = [at(-1 / m1, -104), at(-1 / m1, 112)];

  return (
    <Fig
      wide
      width={400}
      viewBox="0 0 268 196"
      label="Two perpendicular lines with their rise-over-run step triangles drawn, showing the negative reciprocal relationship"
      caption={
        <>
          Both step triangles are the <strong>same triangle</strong> — one across and three up,
          turned a quarter turn. Turning it swaps which side is the run and which is the rise
          (that is the <strong>flip</strong>: 3/1 becomes 1/3) and turns the climb into a fall
          (that is the <strong>sign</strong>: +3 becomes −1/3). Doing only one of the two leaves you
          with 1/3 or −3, and both are among the answer choices. Check by multiplying: 3 × (−1/3) = −1.
        </>
      }
    >
      <line x1={blue[0][0]} y1={blue[0][1]} x2={blue[1][0]} y2={blue[1][1]} stroke={C.a} strokeWidth="2.6" />
      <line x1={amber[0][0]} y1={amber[0][1]} x2={amber[1][0]} y2={amber[1][1]} stroke={C.b} strokeWidth="2.6" />

      <g stroke={C.a} strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1={cx} y1={cy} x2={cx + u} y2={cy} />
        <line x1={cx + u} y1={cy} x2={cx + u} y2={cy - 3 * u} />
      </g>
      <g stroke={C.b} strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1={cx} y1={cy} x2={cx} y2={cy + u} />
        <line x1={cx} y1={cy + u} x2={cx + 3 * u} y2={cy + u} />
      </g>

      <RightAngle cx={cx} cy={cy} a={0} b={90} size={13} color={C.no} />
      <circle cx={cx} cy={cy} r="4" fill="currentColor" />

      <Label x={cx + u / 2} y={cy - 13} color={C.a} size={12}>1</Label>
      <Label x={cx + u + 15} y={cy - 1.5 * u} color={C.a} size={12}>3</Label>
      <Label x={cx - 14} y={cy + u / 2} color={C.b} size={12}>1</Label>
      <Label x={cx + 1.5 * u} y={cy + u + 15} color={C.b} size={12}>3</Label>

      {/* Each name sits at its own line's far end, on opposite sides of the figure, so neither
          plate lands on the other line or on a step label. */}
      <Label x={cx + 50} y={cy - 3.4 * u} color={C.a} size={14} anchor="start">slope 3</Label>
      <Label x={amber[0][0] + 2} y={amber[0][1] - 16} color={C.b} size={14} anchor="start">slope −1/3</Label>
    </Fig>
  );
}
