import { useMemo } from 'react';
import { buildPile, blockFaces, paintOrder, labelAnchor } from '../engine/blocks.js';

// The pile of blocks, drawn as line art - the convention Barron's and the AFPC pamphlet both
// use. Flat white faces with a black outline is not a stylistic choice: a shaded or coloured
// render makes the interior edges that define "which block is which" harder to trace, and
// tracing them is the entire task.
//
// The projection is isometric with the camera on the (1,1,1) axis, so each block shows its
// top, its right face and its left face - the same three-faces-of-a-corner view as the
// official figure. Blocks are painted far to near, so nearer ones simply overpaint.
//
// The whole pile is a pure function of `sheetSeed`, which is what lets one figure serve a
// whole run of questions exactly as one printed figure does on the real test.

const SCALE = 26;
const PAD = 16;

export default function BlockPile({ sheetSeed, highlight = null, reveal = false, size = 340 }) {
  const model = useMemo(() => {
    const pile = buildPile(sheetSeed);
    if (!pile) return null;

    const order = paintOrder(pile.blocks);
    const drawn = order.map((b) => ({ id: b.id, faces: blockFaces(b) }));

    const pts = drawn.flatMap((d) => d.faces.flatMap((f) => f.poly));
    const xs = pts.map((p) => p[0] * SCALE);
    const ys = pts.map((p) => p[1] * SCALE);
    const minX = Math.min(...xs) - PAD;
    const minY = Math.min(...ys) - PAD;

    const labels = pile.numbered.map((n) => {
      const a = labelAnchor(pile.blocks, n.blockId);
      return a ? { label: n.label, x: a.at[0] * SCALE, y: a.at[1] * SCALE } : null;
    }).filter(Boolean);

    return {
      drawn,
      labels,
      viewBox: `${minX} ${minY} ${Math.max(...xs) - minX + PAD} ${Math.max(...ys) - minY + PAD}`,
    };
  }, [sheetSeed]);

  if (!model) return null;

  return (
    <svg
      viewBox={model.viewBox}
      width={size}
      height={size}
      className="afq-blockpile"
      role="img"
      aria-label={highlight != null
        ? `A pile of identical blocks. Count the blocks whose faces touch block ${highlight}.`
        : 'A pile of identical blocks.'}
    >
      {model.drawn.map((d) => (
        <g key={d.id}>
          {d.faces.map((f) => (
            <polygon
              key={f.face}
              className="afq-block-face"
              points={f.poly.map(([x, y]) => `${(x * SCALE).toFixed(1)},${(y * SCALE).toFixed(1)}`).join(' ')}
            />
          ))}
        </g>
      ))}

      {model.labels.map((l) => (
        <text
          key={l.label}
          // ⚠ Marked only AFTER answering. The real figure numbers its blocks and highlights
          // nothing, so locating the one being asked about is part of the nine seconds -
          // colouring it in during the question would quietly train against a task the test
          // actually sets. On reveal it is marked, so a wrong answer can be traced.
          className={'afq-block-label' + (reveal && l.label === highlight ? ' afq-block-label-on' : '')}
          x={l.x.toFixed(1)}
          y={(l.y + 6).toFixed(1)}
          textAnchor="middle"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}
