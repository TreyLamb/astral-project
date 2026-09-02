import { useState } from 'react';
import { C, polar, arcPath, minorArc, midDir, dirTo, Fig, FigSlider, Label, Ticks, apexFrom } from './geo.jsx';

// Figures for Chapter 9 (angles, lines, triangles). Every angle drawn here is the angle named in
// the label - the drawing is generated from the numbers rather than the numbers written onto a
// drawing - so the picture cannot quietly disagree with the prose beside it.

// --- 2. Parallel lines cut by a transversal ---------------------------------
//
// The chapter's hardest claim to believe from words alone is "eight angles, two values". Drawing
// all eight and letting the reader drag the slant settles it in about two seconds: every label
// is one of two numbers, and dragging changes both while the pattern of which-is-where holds.
//
// The relationship chips exist because the lesson's table names six relationships and a table
// cannot show WHERE any of them is. Clicking one lights the exact pair, which is the only part
// of this topic that is genuinely hard.

const REL = [
  { id: 'corr', name: 'Corresponding', pair: [1, 5], equal: true, where: 'the same corner at each crossing' },
  { id: 'ai', name: 'Alternate interior', pair: [3, 5], equal: true, where: 'opposite sides of the transversal, both between the parallels' },
  { id: 'ae', name: 'Alternate exterior', pair: [1, 7], equal: true, where: 'opposite sides of the transversal, both outside the parallels' },
  { id: 'vert', name: 'Vertical', pair: [1, 3], equal: true, where: 'straight across one crossing from each other' },
  { id: 'ssi', name: 'Same-side interior', pair: [4, 5], equal: false, where: 'the same side of the transversal, both between the parallels' },
  { id: 'lin', name: 'Linear pair', pair: [1, 2], equal: false, where: 'side by side along one straight line' },
];

const regionsAt = (px, py, theta, base) =>
  [
    { from: 0, to: theta, value: theta },
    { from: theta, to: 180, value: 180 - theta },
    { from: 180, to: 180 + theta, value: theta },
    { from: 180 + theta, to: 360, value: 180 - theta },
  ].map((r, i) => ({ ...r, id: base + i, px, py, mid: (r.from + r.to) / 2 }));

export function Transversal() {
  const [theta, setTheta] = useState(55);
  const [rel, setRel] = useState(null);

  const yTop = 88;
  const yBot = 186;
  const midY = (yTop + yBot) / 2;
  const midX = 172;
  const half = (midY - yTop) / Math.tan((theta * Math.PI) / 180);

  const p1 = [midX + half, yTop];
  const p2 = [midX - half, yBot];
  const over = 30 / Math.tan((theta * Math.PI) / 180);

  const regions = [...regionsAt(p1[0], p1[1], theta, 1), ...regionsAt(p2[0], p2[1], theta, 5)];
  const active = REL.find((r) => r.id === rel) ?? null;
  const lit = active ? active.pair : null;

  return (
    <div className="afq-fig-interactive">
      <Fig
        wide
        width={420}
        viewBox="0 0 340 250"
        label={`Two parallel lines cut by a transversal at ${theta} degrees, with all eight angles labelled`}
        caption={
          active ? (
            <>
              <strong>{active.name}</strong> — {active.where}. The two lit angles are{' '}
              {active.equal ? (
                <><strong>equal</strong> ({theta === 90 ? 90 : lit.map((id) => regions.find((r) => r.id === id).value).join('° and ')}°).</>
              ) : (
                <><strong>supplementary</strong> — {regions.find((r) => r.id === lit[0]).value}° + {regions.find((r) => r.id === lit[1]).value}° = 180°.</>
              )}
            </>
          ) : (
            <>
              Eight angles, and only <strong>two numbers</strong> in the whole picture:{' '}
              <span style={{ color: C.a, fontWeight: 700 }}>{theta}°</span> and{' '}
              <span style={{ color: C.b, fontWeight: 700 }}>{180 - theta}°</span>. Drag the slant and
              both change together — one always makes up the other to 180°. Tap a name below to see
              where that relationship lives.
            </>
          )
        }
      >
        <line x1="22" y1={yTop} x2="318" y2={yTop} stroke="currentColor" strokeWidth="2.2" />
        <line x1="22" y1={yBot} x2="318" y2={yBot} stroke="currentColor" strokeWidth="2.2" />
        <line x1={p1[0] + over} y1={yTop - 30} x2={p2[0] - over} y2={yBot + 30}
          stroke="currentColor" strokeWidth="2.2" />

        {/* The arrowheads are the standard notation for "these two lines are parallel". Without
            them the figure is just three lines and the reader has to take parallelism on trust. */}
        {[yTop, yBot].map((y) => (
          <g key={y} stroke={C.dim} strokeWidth="2" fill="none" strokeLinecap="round">
            <path d={`M 40 ${y - 6} L 47 ${y} L 40 ${y + 6}`} />
            <path d={`M 292 ${y - 6} L 299 ${y} L 292 ${y + 6}`} />
          </g>
        ))}

        {regions.map((r) => {
          const [lx, ly] = polar(r.px, r.py, 36, r.mid);
          const on = !lit || lit.includes(r.id);
          const colour = r.value === theta ? C.a : C.b;
          return (
            <g key={r.id} opacity={on ? 1 : 0.22}>
              <path d={arcPath(r.px, r.py, 20, r.from, r.to)} fill="none" stroke={colour}
                strokeWidth={lit && lit.includes(r.id) ? 3.5 : 2} />
              {lit && lit.includes(r.id) && (
                <circle cx={lx} cy={ly} r="17" fill={colour} opacity="0.16" />
              )}
              <Label x={lx} y={ly} color={colour} size={14} plate={false}>{`${r.value}°`}</Label>
            </g>
          );
        })}
      </Fig>

      <FigSlider label="Slant of the transversal" value={theta} min={35} max={75}
        onChange={(v) => setTheta(v)} />

      <div className="afq-fig-chips">
        {REL.map((r) => (
          <button key={r.id} type="button"
            className={'afq-fig-chip' + (rel === r.id ? ' afq-fig-chip-on' : '')}
            onClick={() => setRel(rel === r.id ? null : r.id)}>
            {r.name}
            <em>{r.equal ? '=' : '+ = 180°'}</em>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 3. The exterior angle theorem -----------------------------------------
//
// The theorem is one line of algebra and almost impossible to picture from that line. Drawn, the
// claim is obvious: the exterior angle opens up to exactly cover the two angles at the far end.
// The trap (using the ADJACENT interior angle as a remote one) is drawn in the trap colour at the
// vertex, so the word "remote" acquires a location instead of staying a definition.

export function ExteriorAngle() {
  const B = [52, 176];
  const Cv = [196, 176];
  const angB = 71;
  const angC = 62;
  const A = apexFrom(B[0], B[1], Cv[0], Cv[1], angB, angC);
  const D = [278, 176];

  const dirCA = dirTo(Cv[0], Cv[1], A[0], A[1]);
  const dirAB = dirTo(A[0], A[1], B[0], B[1]);
  const dirAC = dirTo(A[0], A[1], Cv[0], Cv[1]);

  return (
    <Fig
      width={340}
      viewBox="0 0 310 210"
      label="A triangle with one side extended, forming an exterior angle equal to the sum of the two far interior angles"
      caption={
        <>
          The <strong style={{ color: C.ok }}>118° exterior angle</strong> is exactly the two{' '}
          <strong style={{ color: C.a }}>remote</strong> interior angles added up: 47 + 71 = 118.
          The <strong style={{ color: C.no }}>62° angle touching it</strong> is the one the theorem
          does <em>not</em> use — that is what &ldquo;remote&rdquo; rules out.
        </>
      }
    >
      <line x1={Cv[0]} y1={Cv[1]} x2={D[0]} y2={D[1]} stroke={C.dim} strokeWidth="2" strokeDasharray="6 4" />
      <polygon points={`${A[0]},${A[1]} ${B[0]},${B[1]} ${Cv[0]},${Cv[1]}`}
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />

      {/* exterior angle at C, from the extended base round to CA */}
      <path d={minorArc(Cv[0], Cv[1], 34, 0, dirCA)} fill="none" stroke={C.ok} strokeWidth="3.2" />
      <path d={minorArc(Cv[0], Cv[1], 22, dirCA, 180)} fill="none" stroke={C.no} strokeWidth="2.4" />
      <path d={minorArc(B[0], B[1], 30, 0, angB)} fill="none" stroke={C.a} strokeWidth="2.8" />
      <path d={minorArc(A[0], A[1], 30, dirAB, dirAC)} fill="none" stroke={C.a} strokeWidth="2.8" />

      {(() => { const [x, y] = polar(Cv[0], Cv[1], 54, midDir(0, dirCA)); return <Label x={x} y={y} color={C.ok}>118°</Label>; })()}
      {(() => { const [x, y] = polar(Cv[0], Cv[1], 40, midDir(dirCA, 180)); return <Label x={x} y={y} color={C.no} size={13}>62°</Label>; })()}
      {(() => { const [x, y] = polar(B[0], B[1], 50, midDir(0, angB)); return <Label x={x} y={y} color={C.a}>71°</Label>; })()}
      {(() => { const [x, y] = polar(A[0], A[1], 52, midDir(dirAB, dirAC)); return <Label x={x} y={y} color={C.a}>47°</Label>; })()}
      <Label x={D[0] + 20} y={D[1] + 18} color={C.dim} size={11} weight={500} anchor="end" plate={false}>side extended</Label>
    </Fig>
  );
}

// --- 4. Isosceles: the halving step ----------------------------------------
//
// The item is not "what is an isosceles triangle", it is "did you remember to halve". So the
// figure draws the 140 that has to be shared and the two 70s that result, in different colours,
// with the tick marks doing the work of saying which sides are equal.

export function IsoscelesHalving() {
  const vertex = 40;
  const base = (180 - vertex) / 2;
  const B = [62, 172];
  const Cv = [218, 172];
  const A = apexFrom(B[0], B[1], Cv[0], Cv[1], base, base);

  const dirAB = dirTo(A[0], A[1], B[0], B[1]);
  const dirAC = dirTo(A[0], A[1], Cv[0], Cv[1]);

  return (
    <Fig
      width={330}
      viewBox="0 0 280 210"
      label="An isosceles triangle with a 40 degree vertex angle and two 70 degree base angles"
      caption={
        <>
          The <strong style={{ color: C.b }}>40° vertex angle</strong> leaves 180 − 40 ={' '}
          <strong style={{ color: C.no }}>140°</strong> for the bottom of the triangle — and that
          140 is <em>shared by two angles</em>, not owned by one. Each{' '}
          <strong style={{ color: C.a }}>base angle is 70°</strong>, because 70 + 70 = 140. The
          matching tick marks show which two sides are equal; the equal base angles are the ones
          facing them. <strong style={{ color: C.no }}>Answering 140 is the trap</strong> — that is
          both base angles at once, and the question asks for one.
        </>
      }
    >
      <polygon points={`${A[0]},${A[1]} ${B[0]},${B[1]} ${Cv[0]},${Cv[1]}`}
        fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />

      <Ticks x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} n={2} color={C.ok} />
      <Ticks x1={A[0]} y1={A[1]} x2={Cv[0]} y2={Cv[1]} n={2} color={C.ok} />

      <path d={minorArc(A[0], A[1], 34, dirAB, dirAC)} fill="none" stroke={C.b} strokeWidth="3" />
      <path d={minorArc(B[0], B[1], 30, 0, base)} fill="none" stroke={C.a} strokeWidth="3" />
      <path d={minorArc(Cv[0], Cv[1], 30, 180 - base, 180)} fill="none" stroke={C.a} strokeWidth="3" />

      {(() => { const [x, y] = polar(A[0], A[1], 54, midDir(dirAB, dirAC)); return <Label x={x} y={y} color={C.b}>40°</Label>; })()}
      {(() => { const [x, y] = polar(B[0], B[1], 50, midDir(0, base)); return <Label x={x} y={y} color={C.a}>70°</Label>; })()}
      {(() => { const [x, y] = polar(Cv[0], Cv[1], 50, midDir(180 - base, 180)); return <Label x={x} y={y} color={C.a}>70°</Label>; })()}

    </Fig>
  );
}

// --- 5. Similar triangles: ratio, not difference ---------------------------
//
// The additive trap ("DE is 12 more than AB, so EF is 12 more than BC") survives any amount of
// prose because 6→18 and 8→20 look equally plausible written down. Side by side and to scale it
// stops being plausible: the second triangle is visibly three times the first, and a shape whose
// sides grew by a fixed 12 would not be the same shape at all.

export function SimilarTriangles() {
  const k = 3;
  const small = { b: [30, 150], c: [30 + 42, 150], angB: 64, angC: 52, tag: 'ABC' };
  const smallA = apexFrom(small.b[0], small.b[1], small.c[0], small.c[1], small.angB, small.angC);
  const big = { b: [150, 168], c: [150 + 42 * k, 168], angB: 64, angC: 52, tag: 'DEF' };
  const bigA = apexFrom(big.b[0], big.b[1], big.c[0], big.c[1], big.angB, big.angC);

  return (
    <Fig
      wide
      width={420}
      viewBox="0 0 300 200"
      label="Two similar triangles drawn to scale, the second three times the first"
      caption={
        <>
          Same shape, three times the size. Every side is multiplied by the{' '}
          <strong style={{ color: C.ok }}>same factor of 3</strong> — 6 → 18 and 8 → 24 — and all
          three angles are unchanged. The trap adds instead:{' '}
          <span style={{ color: C.no }}>18 is 12 more than 6, so 8 + 12 = 20</span>. A triangle
          whose sides each grew by 12 would be a different shape, which is why the additive answer
          is always wrong.
        </>
      }
    >
      <polygon points={`${smallA[0]},${smallA[1]} ${small.b[0]},${small.b[1]} ${small.c[0]},${small.c[1]}`}
        fill={C.a} fillOpacity="0.1" stroke={C.a} strokeWidth="2.2" strokeLinejoin="round" />
      <polygon points={`${bigA[0]},${bigA[1]} ${big.b[0]},${big.b[1]} ${big.c[0]},${big.c[1]}`}
        fill={C.ok} fillOpacity="0.1" stroke={C.ok} strokeWidth="2.2" strokeLinejoin="round" />

      <Label x={(smallA[0] + small.b[0]) / 2 - 14} y={(smallA[1] + small.b[1]) / 2} color={C.a} size={13}>6</Label>
      <Label x={(small.b[0] + small.c[0]) / 2} y={small.b[1] + 15} color={C.a} size={13}>8</Label>
      <Label x={(bigA[0] + big.b[0]) / 2 - 18} y={(bigA[1] + big.b[1]) / 2} color={C.ok} size={14}>18</Label>
      <Label x={(big.b[0] + big.c[0]) / 2} y={big.b[1] + 16} color={C.ok} size={14}>24</Label>

      <Label x={51} y={168} color="currentColor" size={12} weight={600} plate={false}>△ABC</Label>
      <Label x={213} y={186} color="currentColor" size={12} weight={600} plate={false}>△DEF</Label>
      <Label x={112} y={40} color={C.ok} size={15} plate={false}>× 3</Label>
      <path d="M 86 52 C 104 34, 124 34, 140 48" fill="none" stroke={C.ok} strokeWidth="2" />
      <path d="M 134 40 L 141 49 L 130 51" fill="none" stroke={C.ok} strokeWidth="2" strokeLinecap="round" />
    </Fig>
  );
}

// --- 6. Polygons: the interior/exterior linear pair -------------------------
//
// Two separate facts get one picture because they are the same picture: every exterior angle
// finishes the straight line its interior angle started (so they sum to 180), and walking all the
// way round the shape turns you through exactly one full circle (so the exterior angles sum to
// 360). The second is the reason 360/n works, and it is genuinely hard to state in words.

export function PolygonAngles({ n = 8 }) {
  const cx = 118;
  const cy = 118;
  const r = 78;
  const interior = ((n - 2) * 180) / n;
  const exterior = 360 / n;
  const pts = Array.from({ length: n }, (_, i) => polar(cx, cy, r, 90 + (360 / n) * i));

  // Extend the side arriving at vertex 0, so the exterior angle at that vertex is a real drawn
  // angle between the extension and the next side rather than a labelled gap.
  const prev = pts[n - 1];
  const v = pts[0];
  const ux = (v[0] - prev[0]) / Math.hypot(v[0] - prev[0], v[1] - prev[1]);
  const uy = (v[1] - prev[1]) / Math.hypot(v[0] - prev[0], v[1] - prev[1]);
  const ext = [v[0] + ux * 52, v[1] + uy * 52];
  const dirExt = dirTo(v[0], v[1], ext[0], ext[1]);
  const dirNext = dirTo(v[0], v[1], pts[1][0], pts[1][1]);
  const dirPrev = dirTo(v[0], v[1], prev[0], prev[1]);

  return (
    <Fig
      width={360}
      viewBox="0 0 236 236"
      label={`A regular ${n}-sided polygon with one interior angle and its exterior angle marked`}
      caption={
        <>
          At every corner the <strong style={{ color: C.a }}>interior angle ({interior}°)</strong> and
          the <strong style={{ color: C.b }}>exterior angle ({exterior}°)</strong> lie along one
          straight line, so they add to 180. Walking right around the shape turns you through every
          exterior angle and leaves you facing the way you started — one full turn — which is why{' '}
          <strong>the exterior angles of any polygon total 360°</strong>, and why one of them is
          360 ÷ {n}.
        </>
      }
    >
      <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />

      {/* the faint exterior angle at every other corner: the 360 total is a property of the whole
          shape, so showing it at only one corner would undersell it */}
      {pts.map((p, i) => {
        if (i === 0) return null;
        const pr = pts[(i - 1 + n) % n];
        const nx = pts[(i + 1) % n];
        const l = Math.hypot(p[0] - pr[0], p[1] - pr[1]);
        const e = [p[0] + ((p[0] - pr[0]) / l) * 26, p[1] + ((p[1] - pr[1]) / l) * 26];
        const dE = dirTo(p[0], p[1], e[0], e[1]);
        const dN = dirTo(p[0], p[1], nx[0], nx[1]);
        return (
          <g key={i} opacity="0.5">
            <line x1={p[0]} y1={p[1]} x2={e[0]} y2={e[1]} stroke={C.dim} strokeWidth="1.5" strokeDasharray="4 3" />
            <path d={minorArc(p[0], p[1], 15, dE, dN)} fill="none" stroke={C.b} strokeWidth="2" />
          </g>
        );
      })}

      <line x1={v[0]} y1={v[1]} x2={ext[0]} y2={ext[1]} stroke={C.dim} strokeWidth="2" strokeDasharray="6 4" />
      <path d={minorArc(v[0], v[1], 30, dirExt, dirNext)} fill="none" stroke={C.b} strokeWidth="3.2" />
      <path d={minorArc(v[0], v[1], 22, dirNext, dirPrev)} fill="none" stroke={C.a} strokeWidth="3.2" />

      {(() => { const [x, y] = polar(v[0], v[1], 48, midDir(dirExt, dirNext)); return <Label x={x} y={y} color={C.b} size={14}>{`${exterior}°`}</Label>; })()}
      {(() => { const [x, y] = polar(v[0], v[1], 46, midDir(dirNext, dirPrev)); return <Label x={x} y={y} color={C.a} size={14}>{`${interior}°`}</Label>; })()}
    </Fig>
  );
}
