import { C, polar, arcPath, Fig, Label, Guide, RightAngle, Ticks } from './geo.jsx';

// Figures for Chapter 11 (right triangles and solids). Two of these - the special triangles and
// the cone in its cylinder - carry a "why" the chapter states in one sentence and cannot show.
// Those sentences are the ones that stop the ratios and the ⅓ from being arbitrary things to
// forget, so they are the ones most worth a picture.

// --- 1. Which side is the hypotenuse --------------------------------------

export function PythagorasSides() {
  // 13.33 px per unit, so the drawn 9-12-15 really is 120-160-200 on screen. Sizing the triangle
  // to fill its viewBox matters more here than anywhere else in the folder: the whole claim is
  // "the hypotenuse is visibly the longest side", and a small drawing floating in whitespace
  // makes that comparison harder rather than easier.
  const x0 = 30;
  const yB = 162;
  const legA = 160;  // 12 units
  const legB = 120;  // 9 units
  const A = [x0, yB - legB];
  const B = [x0, yB];
  const Cv = [x0 + legA, yB];

  return (
    <Fig
      width={340}
      viewBox="0 0 236 190"
      label="A 9-12-15 right triangle with the hypotenuse marked opposite the right angle"
      caption={
        <>
          <strong style={{ color: C.ok }}>The hypotenuse is the side facing the right angle</strong>,
          and it is always the longest — that is how you identify it, not by where it sits on the
          page. Given the two <span style={{ color: C.a }}>legs</span>, add: 81 + 144 = 225, so
          c = 15. Given the hypotenuse and one leg, <strong>subtract</strong>. If your answer comes
          out bigger than the hypotenuse you added when you should have subtracted, because no side
          can beat the longest one.
        </>
      }
    >
      <polygon points={`${A[0]},${A[1]} ${B[0]},${B[1]} ${Cv[0]},${Cv[1]}`}
        fill={C.a} fillOpacity="0.1" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1={A[0]} y1={A[1]} x2={Cv[0]} y2={Cv[1]} stroke={C.ok} strokeWidth="3.6" strokeLinecap="round" />
      <RightAngle cx={B[0]} cy={B[1]} a={0} b={90} size={17} color={C.no} />

      <Label x={A[0] - 15} y={(A[1] + B[1]) / 2} color={C.a} size={15}>9</Label>
      <Label x={(B[0] + Cv[0]) / 2} y={yB + 18} color={C.a} size={15}>12</Label>
      {/* outside the hypotenuse, on the far side from the right angle, so it covers no edge */}
      <Label x={(A[0] + Cv[0]) / 2 + 26} y={(A[1] + Cv[1]) / 2 - 16} color={C.ok} size={16}>c = 15</Label>
    </Fig>
  );
}

// --- 2a. 45-45-90 is half a square ----------------------------------------

export function Triangle454590() {
  const s = 118;
  const x0 = 34;
  const y0 = 30;

  return (
    <Fig
      width={310}
      viewBox="0 0 210 196"
      label="A square cut along its diagonal, showing that the 45-45-90 triangle is half a square"
      caption={
        <>
          Cut a square along its diagonal and you get this triangle. Both{' '}
          <span style={{ color: C.a }}>legs are sides of the square</span>, so they are equal — that
          is why the two angles are both 45°. The diagonal is the hypotenuse, and Pythagoras gives
          it directly: x² + x² = 2x², so it is{' '}
          <strong style={{ color: C.ok }}>x√2</strong>. The √2 lives here, and only here.
        </>
      }
    >
      <rect x={x0} y={y0} width={s} height={s} fill="none" stroke={C.dim}
        strokeWidth="1.8" strokeDasharray="5 4" />
      <polygon points={`${x0},${y0} ${x0},${y0 + s} ${x0 + s},${y0 + s}`}
        fill={C.a} fillOpacity="0.14" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1={x0} y1={y0} x2={x0 + s} y2={y0 + s} stroke={C.ok} strokeWidth="3.2" strokeLinecap="round" />

      <RightAngle cx={x0} cy={y0 + s} a={0} b={90} size={14} color={C.no} />
      <Ticks x1={x0} y1={y0} x2={x0} y2={y0 + s} n={1} color={C.a} />
      <Ticks x1={x0} y1={y0 + s} x2={x0 + s} y2={y0 + s} n={1} color={C.a} />
      <path d={arcPath(x0, y0, 26, -90, -45)} fill="none" stroke={C.b} strokeWidth="2.6" />
      <path d={arcPath(x0 + s, y0 + s, 26, 135, 180)} fill="none" stroke={C.b} strokeWidth="2.6" />

      <Label x={x0 - 14} y={y0 + s / 2} color={C.a} size={14}>x</Label>
      <Label x={x0 + s / 2} y={y0 + s + 17} color={C.a} size={14}>x</Label>
      <Label x={x0 + s * 0.66} y={y0 + s * 0.4} color={C.ok} size={15}>x√2</Label>
      <Label x={x0 + 32} y={y0 + 26} color={C.b} size={12}>45°</Label>
      <Label x={x0 + s - 34} y={y0 + s - 20} color={C.b} size={12}>45°</Label>
    </Fig>
  );
}

// --- 2b. 30-60-90 is half an equilateral triangle -------------------------
//
// This is the figure that fixes the most-missed half of the ratio. "The hypotenuse is twice the
// SHORTER leg" is arbitrary as a rule and inevitable as a picture: the hypotenuse is a whole side
// of the equilateral triangle and the short leg is that same side cut in half by the fold.

export function Triangle306090() {
  const side = 132;
  const x0 = 42;
  const yB = 176;
  const apex = [x0 + side / 2, yB - (side * Math.sqrt(3)) / 2];
  const mid = [x0 + side / 2, yB];

  return (
    <Fig
      width={330}
      viewBox="0 0 226 212"
      label="An equilateral triangle folded down the middle, producing a 30-60-90 triangle"
      caption={
        <>
          Fold an equilateral triangle down the middle. The fold cuts the bottom side{' '}
          <strong>exactly in half</strong> — so the <span style={{ color: C.a }}>short leg is x</span>{' '}
          while the <strong style={{ color: C.ok }}>hypotenuse is still the full side, 2x</strong>.
          That is where &ldquo;twice the shorter leg&rdquo; comes from, and why doubling the{' '}
          <em>longer</em> leg is wrong. The 60° angle survives the fold; the 30° is the folded half
          of the original 60°.
        </>
      }
    >
      <polygon points={`${apex[0]},${apex[1]} ${x0},${yB} ${x0 + side},${yB}`}
        fill="none" stroke={C.dim} strokeWidth="1.8" strokeDasharray="5 4" strokeLinejoin="round" />
      <polygon points={`${apex[0]},${apex[1]} ${mid[0]},${mid[1]} ${x0 + side},${yB}`}
        fill={C.a} fillOpacity="0.14" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1={apex[0]} y1={apex[1]} x2={x0 + side} y2={yB} stroke={C.ok} strokeWidth="3.2" strokeLinecap="round" />
      <Guide x1={apex[0]} y1={apex[1]} x2={mid[0]} y2={mid[1]} color={C.b} dash="7 4" />

      <RightAngle cx={mid[0]} cy={yB} a={0} b={90} size={13} color={C.no} />
      <Ticks x1={x0} y1={yB} x2={mid[0]} y2={yB} n={1} color={C.a} />
      <Ticks x1={mid[0]} y1={yB} x2={x0 + side} y2={yB} n={1} color={C.a} />
      <path d={arcPath(apex[0], apex[1], 30, -90, -60)} fill="none" stroke={C.b} strokeWidth="2.6" />
      <path d={arcPath(x0 + side, yB, 30, 120, 180)} fill="none" stroke={C.b} strokeWidth="2.6" />

      <Label x={(mid[0] + x0 + side) / 2} y={yB + 17} color={C.a} size={14}>x</Label>
      <Label x={(x0 + mid[0]) / 2} y={yB + 17} color={C.dim} size={13} weight={500}>x</Label>
      <Label x={apex[0] + 44} y={(apex[1] + yB) / 2 - 10} color={C.ok} size={15}>2x</Label>
      <Label x={mid[0] - 30} y={(apex[1] + yB) / 2} color={C.b} size={14} anchor="end">x√3</Label>
      <Label x={apex[0] + 20} y={apex[1] + 34} color={C.b} size={12}>30°</Label>
      <Label x={x0 + side - 34} y={yB - 18} color={C.b} size={12}>60°</Label>
    </Fig>
  );
}

// --- 3. The cone is a third of its cylinder -------------------------------
//
// The chapter calls the ⅓ "the biggest trap in solid geometry". Drawing the cone inside the
// cylinder it belongs to turns the ⅓ into a statement about a picture you can hold - and shows
// at the same time exactly which number is sitting in the answer choices waiting for you.

export function ConeInCylinder() {
  const cx = 96;
  const rx = 54;
  const ry = 17;
  const yTop = 46;
  const yBot = 168;

  return (
    <Fig
      wide
      width={420}
      viewBox="0 0 300 216"
      label="A cone drawn inside the cylinder with the same base and height, illustrating the one-third relationship"
      caption={
        <>
          Same circular base, same height — and the{' '}
          <strong style={{ color: C.ok }}>cone fills exactly one third</strong> of the cylinder
          around it. Three cones of ice would pour into that cylinder and fill it once. So with
          r = 5 and h = 12 the cylinder is πr²h = <strong>300π</strong> and the cone is a third of
          that, <strong>100π</strong>. Forget the ⅓ and you answer 300π, which is among the answer choices
          because it is the shape you did <em>not</em> draw. Pyramids sit inside prisms the same
          way.
        </>
      }
    >
      <ellipse cx={cx} cy={yBot} rx={rx} ry={ry} fill="none" stroke={C.dim} strokeWidth="1.6" strokeDasharray="5 4" />
      <path d={`M ${cx - rx} ${yBot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${yBot}`} fill="none" stroke="currentColor" strokeWidth="2.2" />
      <line x1={cx - rx} y1={yTop} x2={cx - rx} y2={yBot} stroke="currentColor" strokeWidth="2.2" />
      <line x1={cx + rx} y1={yTop} x2={cx + rx} y2={yBot} stroke="currentColor" strokeWidth="2.2" />
      <ellipse cx={cx} cy={yTop} rx={rx} ry={ry} fill="none" stroke="currentColor" strokeWidth="2.2" />

      <path d={`M ${cx - rx} ${yBot} L ${cx} ${yTop} L ${cx + rx} ${yBot}`}
        fill={C.ok} fillOpacity="0.18" stroke={C.ok} strokeWidth="2.6" strokeLinejoin="round" />
      <path d={`M ${cx - rx} ${yBot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${yBot}`}
        fill="none" stroke={C.ok} strokeWidth="2.6" />

      <Guide x1={cx + rx + 22} y1={yTop} x2={cx + rx + 22} y2={yBot} />
      <Label x={cx + rx + 40} y={(yTop + yBot) / 2} color={C.dim} size={13}>h = 12</Label>
      <Guide x1={cx} y1={yBot} x2={cx + rx} y2={yBot} color={C.a} dash="0" />
      <Label x={cx + rx / 2} y={yBot + 16} color={C.a} size={13}>r = 5</Label>

      <Label x={cx} y={yTop - 18} color={C.ok} size={15}>cone = ⅓ × cylinder</Label>
      <Label x={cx} y={yBot + 38} color="currentColor" size={14}>300π → 100π</Label>
    </Fig>
  );
}

// --- 4a. The cylinder, unrolled -------------------------------------------
//
// `2πr² + 2πrh` is two unrelated-looking terms until the shape is flattened, at which point it is
// obviously two circles plus one rectangle - and the rectangle's mystery width is just the
// circumference of the circles it was wrapped around.

export function CylinderNet() {
  // The rectangle is drawn at its TRUE width, 2πr - a bit over six radii, so it comes out
  // dramatically wider than the circles it wrapped. That proportion is the point of the picture:
  // the wrapper being much bigger than the two ends is why surface area is dominated by the 2πrh
  // term. An earlier version scaled the width down to fit and quietly taught the wrong shape.
  const r = 26;
  const w = 2 * Math.PI * r;
  const h = 62;
  const x0 = 26;
  const yR = 58;

  return (
    <Fig
      wide
      width={430}
      viewBox="0 0 232 192"
      label="A cylinder unrolled into two circles and a rectangle"
      caption={
        <>
          Peel a cylinder apart and it is three flat pieces: two{' '}
          <strong style={{ color: C.a }}>circles</strong> (πr² each, so 2πr² together) and one{' '}
          <strong style={{ color: C.ok }}>rectangle</strong> that was wrapped around them. The
          rectangle&rsquo;s width is whatever it had to reach around — the{' '}
          <strong>circumference, 2πr</strong> — and its height is the cylinder&rsquo;s height h. So
          the wrapper is 2πr × h. Nothing to memorise: the formula is just the three pieces added
          up.
        </>
      }
    >
      <circle cx={x0 + w / 2} cy={yR - r - 3} r={r} fill={C.a} fillOpacity="0.16" stroke={C.a} strokeWidth="2.2" />
      <circle cx={x0 + w / 2} cy={yR + h + r + 3} r={r} fill={C.a} fillOpacity="0.16" stroke={C.a} strokeWidth="2.2" />
      <rect x={x0} y={yR} width={w} height={h} fill={C.ok} fillOpacity="0.14" stroke={C.ok} strokeWidth="2.4" />

      <Label x={x0 + w / 2} y={yR - r - 3} color={C.a} size={13}>πr²</Label>
      <Label x={x0 + w / 2} y={yR + h + r + 3} color={C.a} size={13}>πr²</Label>
      <Label x={x0 + w / 2} y={yR + h / 2} color={C.ok} size={15}>2πr × h</Label>

      {/* The width label goes right of the bottom circle - the only stretch of the rectangle's
          bottom edge the circle does not sit over. */}
      <Guide x1={x0 + w / 2 + r + 6} y1={yR + h + 13} x2={x0 + w} y2={yR + h + 13} color={C.ok} dash="0" />
      <Label x={x0 + w - 6} y={yR + h + 26} color={C.ok} size={13} anchor="end">2πr wide</Label>
      <Guide x1={x0 + w + 12} y1={yR} x2={x0 + w + 12} y2={yR + h} color={C.dim} dash="0" />
      <Label x={x0 + w + 24} y={yR + h / 2} color={C.dim} size={13}>h</Label>
    </Fig>
  );
}

// --- 4b. A box has three PAIRS of faces -----------------------------------
//
// The dropped 2 is the whole item. Drawing the box with its three visible faces labelled and its
// three hidden twins ghosted behind makes "three pairs" something you count rather than something
// you are told.

export function BoxFaces() {
  const w = 108;
  const h = 78;
  const dx = 42;
  const dy = -30;
  const x0 = 34;
  const y0 = 118;
  const front = [[x0, y0], [x0 + w, y0], [x0 + w, y0 - h], [x0, y0 - h]];
  const top = [[x0, y0 - h], [x0 + w, y0 - h], [x0 + w + dx, y0 - h + dy], [x0 + dx, y0 - h + dy]];
  const side = [[x0 + w, y0], [x0 + w + dx, y0 + dy], [x0 + w + dx, y0 - h + dy], [x0 + w, y0 - h]];
  const poly = (p) => p.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <Fig
      wide
      width={400}
      viewBox="0 0 250 176"
      label="A rectangular box with its three visible faces labelled and its three hidden faces shown dashed"
      caption={
        <>
          You can see three faces. There are <strong>three more behind them</strong> — the dashed
          edges — and each hidden face is identical to the one facing you. That is three{' '}
          <strong>pairs</strong>: lw, lh and wh, each counted twice, which is the 2 in{' '}
          <strong>2(lw + lh + wh)</strong>. For a 5 × 3 × 4 box the three distinct faces total 47,
          and <span style={{ color: C.no }}>47 is the trap</span> — the real surface is 94.
        </>
      }
    >
      <g stroke={C.dim} strokeWidth="1.6" strokeDasharray="5 4" fill="none">
        <path d={`M ${x0 + dx} ${y0 + dy} L ${x0 + w + dx} ${y0 + dy}`} />
        <path d={`M ${x0 + dx} ${y0 + dy} L ${x0} ${y0}`} />
        <path d={`M ${x0 + dx} ${y0 + dy} L ${x0 + dx} ${y0 - h + dy}`} />
      </g>

      <polygon points={poly(top)} fill={C.b} fillOpacity="0.22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <polygon points={poly(side)} fill={C.ok} fillOpacity="0.22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <polygon points={poly(front)} fill={C.a} fillOpacity="0.22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />

      <Label x={x0 + w / 2} y={y0 - h / 2} color={C.a} size={14} plate={false}>l × w</Label>
      <Label x={x0 + w + dx / 2} y={y0 - h / 2 + dy / 2} color={C.ok} size={13} plate={false}>w × h</Label>
      <Label x={x0 + w / 2 + dx / 2} y={y0 - h + dy / 2} color={C.b} size={13} plate={false}>l × h</Label>
      <Label x={125} y={166} color="currentColor" size={13} plate={false}>each one has a twin you cannot see</Label>
    </Fig>
  );
}
