import { useState } from 'react';
import { C, polar, arcPath, Fig, FigSlider, Label, Guide, RightAngle, Ticks } from './geo.jsx';

// Figures for Chapter 10 (perimeter, area, circles). The chapter's own thesis is that every
// formula has exactly one thing people drop, so each figure here is built around the dropped
// thing rather than around the shape - a picture of a parallelogram teaches nothing, a picture of
// the slant side NOT being the height teaches the item.

// --- 2. The parallelogram height -------------------------------------------
//
// Interactive on purpose. "The slant side belongs to the perimeter, never to the area" is a claim
// about what changes and what does not, and the only honest way to show a claim like that is to
// let the reader change it: drag the lean and watch the slant side climb from 9 to 15 while the
// area sits at 180 the whole time.

export function ParallelogramHeight() {
  const [skew, setSkew] = useState(9.4);
  const u = 8;
  const baseU = 20;
  const hU = 9;
  const slant = Math.sqrt(skew * skew + hU * hU);

  const x0 = 26;
  const yB = 118;
  const yT = yB - hU * u;
  const pts = [
    [x0, yB], [x0 + baseU * u, yB],
    [x0 + baseU * u + skew * u, yT], [x0 + skew * u, yT],
  ];

  return (
    <div className="afq-fig-interactive">
      <Fig
        wide
        width={430}
        viewBox="0 0 300 152"
        label="A parallelogram with its perpendicular height and its slant side both marked"
        caption={
          <>
            <strong style={{ color: C.ok }}>Height</strong> is the straight-up distance between the
            two parallel sides — it meets the base at a right angle.{' '}
            <strong style={{ color: C.no }}>The slant side ({slant.toFixed(1)})</strong> is longer,
            and it is not the height. Lean the shape over and watch: the slant side changes, the{' '}
            <strong>area stays 180</strong>. That is the whole reason the question
            prints the slant side at all.
          </>
        }
      >
        <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
          fill={C.a} fillOpacity="0.12" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />

        {/* the slant side, redrawn on top in the trap colour */}
        <line x1={pts[1][0]} y1={pts[1][1]} x2={pts[2][0]} y2={pts[2][1]}
          stroke={C.no} strokeWidth="3.2" strokeLinecap="round" />

        <Guide x1={pts[3][0]} y1={yT} x2={pts[3][0]} y2={yB} color={C.ok} />
        <RightAngle cx={pts[3][0]} cy={yB} a={0} b={90} size={12} color={C.ok} />

        {/* Every label is placed relative to a vertex rather than to the middle of the figure,
            because the shape moves under the slider - a label parked at a fixed centre ends up
            underneath the height guide at one end of the range and outside the shape at the
            other. The area label sits low and right of the guide, which is empty at every skew. */}
        <Label x={pts[3][0] - 9} y={(yT + yB) / 2} color={C.ok} size={14} anchor="end">{`h = ${hU}`}</Label>
        <Label x={x0 + (baseU * u) / 2} y={yB + 17} color="currentColor" size={14}>{`base = ${baseU}`}</Label>
        <Label x={(pts[1][0] + pts[2][0]) / 2 + 24} y={(yB + yT) / 2} color={C.no} size={14}>
          {slant.toFixed(1)}
        </Label>
        <Label x={pts[3][0] + 74} y={yB - 20} color={C.ok} size={15}>
          {`area = ${baseU} × ${hU} = ${baseU * hU}`}
        </Label>
      </Fig>
      <FigSlider label="Lean the shape over" value={skew} min={0} max={12} step={0.2}
        suffix="" onChange={setSkew} />
    </div>
  );
}

// --- 3a. Why a triangle has a half ----------------------------------------
//
// The lesson says "a triangle is exactly half of the parallelogram with the same base and height,
// that is where the half comes from, and remembering why makes it harder to drop." That sentence
// is a description of a picture. Here is the picture.

export function TriangleIsHalf() {
  const u = 9;
  const baseU = 16;
  const hU = 10;
  const skew = 5;
  const x0 = 30;
  const yB = 128;
  const yT = yB - hU * u;
  const p = [
    [x0, yB], [x0 + baseU * u, yB],
    [x0 + baseU * u + skew * u, yT], [x0 + skew * u, yT],
  ];

  return (
    <Fig
      wide
      width={400}
      viewBox="0 0 260 160"
      label="A parallelogram split along its diagonal into two identical triangles"
      caption={
        <>
          One diagonal cuts a parallelogram into <strong>two identical triangles</strong> — spin
          either one around and it lands exactly on the other. So a triangle on the same base and
          the same height covers half the area, and <strong style={{ color: C.ok }}>½bh</strong> is
          that half rather than an arbitrary rule. Dropping the ½ gives you the parallelogram, and
          that number is always one of the options.
        </>
      }
    >
      <polygon points={p.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none" stroke={C.dim} strokeWidth="1.8" strokeDasharray="5 4" strokeLinejoin="round" />
      <polygon points={`${p[0][0]},${p[0][1]} ${p[1][0]},${p[1][1]} ${p[2][0]},${p[2][1]}`}
        fill={C.ok} fillOpacity="0.2" stroke={C.ok} strokeWidth="2.4" strokeLinejoin="round" />
      <polygon points={`${p[0][0]},${p[0][1]} ${p[2][0]},${p[2][1]} ${p[3][0]},${p[3][1]}`}
        fill={C.a} fillOpacity="0.12" stroke={C.a} strokeWidth="2" strokeLinejoin="round" />

      <Guide x1={p[3][0]} y1={yT} x2={p[3][0]} y2={yB} />
      <RightAngle cx={p[3][0]} cy={yB} a={0} b={90} size={11} color={C.dim} />
      <Label x={p[3][0] - 14} y={(yT + yB) / 2} color={C.dim} size={13}>h</Label>
      <Label x={x0 + (baseU * u) / 2} y={yB + 16} color="currentColor" size={13}>b</Label>
      <Label x={x0 + baseU * u * 0.62} y={yB - hU * u * 0.28} color={C.ok} size={14}>½bh</Label>
      <Label x={x0 + baseU * u * 0.34} y={yB - hU * u * 0.72} color={C.a} size={14}>the other half</Label>
    </Fig>
  );
}

// --- 3b. The height that falls outside -------------------------------------
//
// The lesson warns that an obtuse triangle's height can land outside the shape, "which is legal
// and occasionally drawn that way to unsettle you". A reader who has never seen it drawn will
// still be unsettled by it. Seeing it once removes the whole effect.

export function ObtuseHeight() {
  const B = [96, 132];
  const Cv = [232, 132];
  const A = [40, 44];

  return (
    <Fig
      width={330}
      viewBox="0 0 268 168"
      label="An obtuse triangle whose perpendicular height falls outside the triangle"
      caption={
        <>
          In an obtuse triangle the height can land <strong>outside</strong> the shape — the base
          gets extended (the dashed part) so the perpendicular has somewhere to meet it. This is
          normal, not a misprint, and <strong style={{ color: C.ok }}>½ × base × height</strong>{' '}
          still uses the <strong>solid</strong> base only. The dashed extension is scaffolding; it
          is not part of the base you multiply by.
        </>
      }
    >
      <line x1={A[0]} y1={B[1]} x2={B[0]} y2={B[1]} stroke={C.dim} strokeWidth="2" strokeDasharray="6 4" />
      <polygon points={`${A[0]},${A[1]} ${B[0]},${B[1]} ${Cv[0]},${Cv[1]}`}
        fill={C.a} fillOpacity="0.1" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <Guide x1={A[0]} y1={A[1]} x2={A[0]} y2={B[1]} color={C.ok} />
      <RightAngle cx={A[0]} cy={B[1]} a={0} b={90} size={11} color={C.ok} />

      <Label x={A[0] - 12} y={(A[1] + B[1]) / 2} color={C.ok} size={14}>h</Label>
      <Label x={(B[0] + Cv[0]) / 2} y={B[1] + 17} color="currentColor" size={14}>base</Label>
      <Label x={(A[0] + B[0]) / 2} y={B[1] + 17} color={C.dim} size={11} weight={500} plate={false}>extension</Label>
    </Fig>
  );
}

// --- 4. The trapezoid is a rectangle at the average width ------------------
//
// "Average them, then multiply" is a rule to memorise. "It is a rectangle whose width is the
// average of the two bases" is a reason, and the reason survives longer - but only if you can see
// that the corner cut off one side exactly fills the notch on the other, which is a picture.

export function TrapezoidAverage() {
  const u = 13;
  const b1 = 9;
  const b2 = 15;
  const h = 8;
  const avg = (b1 + b2) / 2;
  const x0 = 34;
  const yB = 142;
  const yT = yB - h * u;
  const botL = x0;
  const botR = x0 + b2 * u;
  const topL = x0 + ((b2 - b1) / 2) * u;
  const topR = topL + b1 * u;
  const recL = x0 + ((b2 - avg) / 2) * u;
  const recR = recL + avg * u;
  // The trapezoid's slanted side crosses the rectangle's vertical side at exactly half height -
  // both offsets are (b2 - b1) / 4 wide, so the crossing is the midpoint. That crossing is what
  // splits the side strip into the two congruent right triangles this figure is about; drawing
  // the wedges to the trapezoid's CORNERS instead (the obvious-looking version) makes two
  // triangles that are not congruent and are not even wholly inside the shapes they claim to be.
  const yM = (yT + yB) / 2;

  return (
    <Fig
      wide
      width={400}
      viewBox="0 0 292 176"
      label="A trapezoid with a dashed rectangle of the average width drawn over it, showing equal areas"
      caption={
        <>
          The <strong style={{ color: C.ok }}>dashed rectangle</strong> is {avg} wide — the average
          of {b1} and {b2} — and it has exactly the trapezoid&rsquo;s area. The two{' '}
          <strong style={{ color: C.b }}>amber wedges</strong> are the parts of the trapezoid that
          poke out past the rectangle at the bottom, and the two{' '}
          <strong style={{ color: C.a }}>blue wedges</strong> are the gaps it leaves inside the
          rectangle at the top. They are the same size, so they cancel exactly. That is why the
          formula averages the two bases first — and why forgetting the ÷ 2 uses their total width
          instead of their average.
        </>
      }
    >
      {/* what the trapezoid has and the rectangle does not (amber), and vice versa (blue) */}
      <polygon points={`${botL},${yB} ${recL},${yB} ${recL},${yM}`} fill={C.b} fillOpacity="0.45" />
      <polygon points={`${botR},${yB} ${recR},${yB} ${recR},${yM}`} fill={C.b} fillOpacity="0.45" />
      <polygon points={`${recL},${yM} ${recL},${yT} ${topL},${yT}`} fill={C.a} fillOpacity="0.45" />
      <polygon points={`${recR},${yM} ${recR},${yT} ${topR},${yT}`} fill={C.a} fillOpacity="0.45" />

      <polygon points={`${botL},${yB} ${botR},${yB} ${topR},${yT} ${topL},${yT}`}
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <rect x={recL} y={yT} width={recR - recL} height={yB - yT}
        fill="none" stroke={C.ok} strokeWidth="2.4" strokeDasharray="7 4" />

      <Label x={(topL + topR) / 2} y={yT - 13} color="currentColor" size={14}>{`b₁ = ${b1}`}</Label>
      <Label x={(botL + botR) / 2} y={yB + 17} color="currentColor" size={14}>{`b₂ = ${b2}`}</Label>
      <Guide x1={botR + 16} y1={yT} x2={botR + 16} y2={yB} />
      <Label x={botR + 28} y={(yT + yB) / 2} color={C.dim} size={13} anchor="start">{`h = ${h}`}</Label>
      <Label x={(recL + recR) / 2} y={(yT + yB) / 2} color={C.ok} size={14}>{`${avg} × ${h} = ${avg * h}`}</Label>
    </Fig>
  );
}

// --- 5. Radius versus diameter --------------------------------------------
//
// The chapter calls this "the trap to watch for" and the cost of it is invisible in arithmetic:
// 676π looks no more absurd than 169π on a page. Drawn, it is absurd - the mistake claims a
// circle four times the size of the one in the question, and that is impossible to un-see.

export function RadiusDiameter() {
  const cx = 116;
  const cy = 118;
  const rPix = 46;
  const [rEnd] = [polar(cx, cy, rPix, 52)];

  return (
    <Fig
      wide
      width={400}
      viewBox="0 0 280 236"
      label="A circle of radius 13 shown inside the much larger circle you get by using the diameter as the radius"
      caption={
        <>
          A question that says <strong>&ldquo;diameter 26&rdquo;</strong> is describing the{' '}
          <strong style={{ color: C.ok }}>solid circle</strong>: radius 13, area 169π. Using 26 as
          the radius describes the <strong style={{ color: C.no }}>dashed circle</strong> instead —
          twice as wide, <strong>four times the area</strong>, and nothing like the circle in the
          question. Halve the diameter and write the radius down before you do anything else.
        </>
      }
    >
      <circle cx={cx} cy={cy} r={rPix * 2} fill={C.no} fillOpacity="0.06"
        stroke={C.no} strokeWidth="2" strokeDasharray="8 5" />
      <circle cx={cx} cy={cy} r={rPix} fill={C.ok} fillOpacity="0.14" stroke={C.ok} strokeWidth="2.6" />

      <line x1={cx - rPix} y1={cy} x2={cx + rPix} y2={cy} stroke={C.b} strokeWidth="2.4" />
      <line x1={cx} y1={cy} x2={rEnd[0]} y2={rEnd[1]} stroke={C.a} strokeWidth="2.8" />
      <circle cx={cx} cy={cy} r="3.5" fill="currentColor" />

      <Label x={cx + rPix / 2 + 4} y={cy + 15} color={C.b} size={13}>d = 26</Label>
      <Label x={(cx + rEnd[0]) / 2 + 16} y={(cy + rEnd[1]) / 2 - 4} color={C.a} size={13}>r = 13</Label>
      <Label x={cx} y={cy - rPix - 13} color={C.ok} size={14}>area = 169π</Label>
      <Label x={cx} y={cy - rPix * 2 - 12} color={C.no} size={14}>676π — the trap</Label>
    </Fig>
  );
}

// --- 6. Sector and arc are the same fraction ------------------------------
//
// Both come off "θ/360 of the whole circle", and the only thing separating them is whether you
// take a fraction of the AREA or a fraction of the EDGE. Colouring the slice and the curve
// separately makes that the visible difference rather than a remembered one.

export function SectorArc() {
  const cx = 134;
  const cy = 148;
  const r = 72;
  const theta = 120;
  // Symmetric about straight up, so the slice has a clean axis to hang every label off. An
  // off-axis wedge pushes its own labels outside itself at the ends.
  const start = 30;
  const end = start + theta;
  const bisect = start + theta / 2;
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);

  return (
    <Fig
      wide
      width={400}
      viewBox="0 0 270 248"
      label="A 120 degree sector of a circle of radius 6, with the sector area and the arc length distinguished"
      caption={
        <>
          120° is a <strong>third</strong> of the full 360°, so this slice takes a third of
          everything the circle has. A third of the <strong style={{ color: C.a }}>area</strong>{' '}
          (πr² = 36π) is <strong>12π</strong>. A third of the{' '}
          <strong style={{ color: C.no }}>edge</strong> (2πr = 12π) is <strong>4π</strong>. Same
          fraction, two different things to take it of — the area is the filled wedge, the arc is
          only the curved rim.
        </>
      }
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.dim} strokeWidth="1.6" strokeDasharray="5 4" />
      <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${theta > 180 ? 1 : 0} 0 ${x2} ${y2} Z`}
        fill={C.a} fillOpacity="0.22" stroke={C.a} strokeWidth="2" />
      <path d={arcPath(cx, cy, r, start, end)} fill="none" stroke={C.no} strokeWidth="4.5" strokeLinecap="round" />
      <path d={arcPath(cx, cy, 24, start, end)} fill="none" stroke={C.b} strokeWidth="2.4" />
      <circle cx={cx} cy={cy} r="3.5" fill="currentColor" />

      {/* Everything hangs off the wedge's own axis of symmetry, at increasing radius: the angle at
          the point, the area in the body, the arc beyond the rim. `r` labels one of the slice's
          OWN bounding radii - the earlier version drew a separate radius off to the east, which
          implied the radius had nothing to do with the slice. */}
      {(() => { const [x, y] = polar(cx, cy, 36, bisect); return <Label x={x} y={y} color={C.b} size={14}>120°</Label>; })()}
      {(() => { const [x, y] = polar(cx, cy, 62, bisect); return <Label x={x} y={y} color={C.a} size={13}>area 12π</Label>; })()}
      {(() => { const [x, y] = polar(cx, cy, r + 22, bisect); return <Label x={x} y={y} color={C.no} size={13}>arc 4π</Label>; })()}
      {(() => { const [x, y] = polar(cx, cy, r * 0.62, start); return <Label x={x + 20} y={y + 6} color={C.dim} size={12} weight={600}>r = 6</Label>; })()}
    </Fig>
  );
}

// --- 7. Whole minus hole ---------------------------------------------------
//
// "Look for the shared dimension" is the whole technique, and the shared dimension is a visual
// fact: the circle touches all four sides, so its diameter IS the square's side. Nothing in the
// wording of a stem makes that as obvious as one drawing does.

export function CompositeSquareCircle() {
  const s = 148;
  const x0 = 40;
  const y0 = 34;

  return (
    <Fig
      width={340}
      viewBox="0 0 236 238"
      label="A circle inscribed in a square, with the leftover corner area shaded"
      caption={
        <>
          The circle touches all four sides, so its <strong>diameter is the square&rsquo;s side</strong>{' '}
          — 12 — and its radius is <strong>6</strong>. The{' '}
          <span style={{ color: C.b }}>shaded leftover</span> is the square minus the circle:{' '}
          144 − 36π. Spotting that shared 12 is what turns this into a fifteen-second problem. Use
          12 as the radius by mistake and you get 144 − 144π, a{' '}
          <span style={{ color: C.no }}>negative area</span> — impossible, and worth noticing.
        </>
      }
    >
      <path d={`M ${x0} ${y0} h ${s} v ${s} h ${-s} Z M ${x0 + s / 2} ${y0} A ${s / 2} ${s / 2} 0 1 0 ${x0 + s / 2} ${y0 + s} A ${s / 2} ${s / 2} 0 1 0 ${x0 + s / 2} ${y0}`}
        fill={C.b} fillOpacity="0.3" fillRule="evenodd" />
      <rect x={x0} y={y0} width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx={x0 + s / 2} cy={y0 + s / 2} r={s / 2} fill="none" stroke={C.ok} strokeWidth="2.4" />
      <line x1={x0} y1={y0 + s / 2} x2={x0 + s} y2={y0 + s / 2} stroke={C.a} strokeWidth="2" strokeDasharray="6 4" />
      <circle cx={x0 + s / 2} cy={y0 + s / 2} r="3" fill="currentColor" />

      <Label x={x0 + s / 2} y={y0 + s + 17} color="currentColor" size={14}>side = 12</Label>
      <Label x={x0 + s * 0.74} y={y0 + s / 2 - 14} color={C.a} size={13}>d = 12, so r = 6</Label>
      {/* The leftover is four thin corner slivers, none of them wide enough to hold a word - so
          the label sits outside the square with a leader into one corner. */}
      <line x1={x0 + 12} y1={y0 - 6} x2={x0 + 15} y2={y0 + 15} stroke={C.b} strokeWidth="1.5" />
      <Label x={x0 + 4} y={y0 - 14} color={C.b} size={13} anchor="start" plate={false}>leftover</Label>
    </Fig>
  );
}
