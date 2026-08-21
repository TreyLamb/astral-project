// Deterministic picture for a pictorial item. Same scene object always draws the
// same picture — it is derived from the test's seed like everything else.
//
// The frame is drawn and is always the same size on purpose: it is the size
// REFERENCE. "big" and "small" are only meaningful relative to something, and a
// lone glyph on a blank field says nothing about its own size. A big glyph fills
// the frame; a small one takes about a third of it. The difference is deliberately
// exaggerated so it is never a judgement call.
//
// Definiteness is NOT drawable — no picture distinguishes "a tree" from "the
// tree" — so buildPictorial never marks it, and this file never has to. See the
// note there for why no validator would have caught it.

const FRAME_W = 260;
const FRAME_H = 170;

const SIZE_SCALE = { big: 0.82, small: 0.34, null: 0.56 };

// Three glyphs at single-object scale would overrun the frame, and the frame
// cannot grow without ceasing to be a constant size reference. buildPictorial
// therefore never puts a size adjective on a plural scene, which frees this to
// be whatever fits — see the note there.
const MULTI_SCALE = 0.42;

const NEUTRAL = 'var(--dlab-ink)';
const RED = '#ef4444';

function Glyph({ noun, cx, cy, s, fill }) {
  const stroke = fill;
  switch (noun) {
    case 'tree':
      return (
        <g>
          <rect x={cx - s * 0.07} y={cy} width={s * 0.14} height={s * 0.42} fill={stroke} />
          <path d={`M ${cx} ${cy - s * 0.5} L ${cx + s * 0.34} ${cy + s * 0.04} L ${cx - s * 0.34} ${cy + s * 0.04} Z`} fill={fill} />
        </g>
      );
    case 'house':
      return (
        <g>
          <rect x={cx - s * 0.3} y={cy - s * 0.1} width={s * 0.6} height={s * 0.5} fill="none" stroke={stroke} strokeWidth={s * 0.08} />
          <path d={`M ${cx - s * 0.4} ${cy - s * 0.1} L ${cx} ${cy - s * 0.48} L ${cx + s * 0.4} ${cy - s * 0.1} Z`} fill={fill} />
        </g>
      );
    case 'sun':
      return (
        <g>
          <circle cx={cx} cy={cy} r={s * 0.24} fill={fill} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={cx + Math.cos(r) * s * 0.32}
                y1={cy + Math.sin(r) * s * 0.32}
                x2={cx + Math.cos(r) * s * 0.46}
                y2={cy + Math.sin(r) * s * 0.46}
                stroke={stroke}
                strokeWidth={s * 0.07}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      );
    case 'moon':
      return (
        <path
          d={`M ${cx + s * 0.1} ${cy - s * 0.42}
              A ${s * 0.42} ${s * 0.42} 0 1 0 ${cx + s * 0.1} ${cy + s * 0.42}
              A ${s * 0.33} ${s * 0.33} 0 1 1 ${cx + s * 0.1} ${cy - s * 0.42} Z`}
          fill={fill}
        />
      );
    case 'bird':
      return (
        <g fill="none" stroke={stroke} strokeWidth={s * 0.09} strokeLinecap="round">
          <path d={`M ${cx - s * 0.42} ${cy} Q ${cx - s * 0.2} ${cy - s * 0.3} ${cx} ${cy}`} />
          <path d={`M ${cx} ${cy} Q ${cx + s * 0.2} ${cy - s * 0.3} ${cx + s * 0.42} ${cy}`} />
        </g>
      );
    case 'fish':
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={s * 0.32} ry={s * 0.19} fill={fill} />
          <path d={`M ${cx + s * 0.3} ${cy} L ${cx + s * 0.48} ${cy - s * 0.17} L ${cx + s * 0.48} ${cy + s * 0.17} Z`} fill={fill} />
          <circle cx={cx - s * 0.16} cy={cy - s * 0.04} r={s * 0.032} fill="var(--dlab-bg)" />
        </g>
      );
    case 'stone':
      return (
        <path
          d={`M ${cx - s * 0.34} ${cy + s * 0.2}
              Q ${cx - s * 0.42} ${cy - s * 0.1} ${cx - s * 0.14} ${cy - s * 0.24}
              Q ${cx + s * 0.16} ${cy - s * 0.34} ${cx + s * 0.34} ${cy - s * 0.06}
              Q ${cx + s * 0.42} ${cy + s * 0.16} ${cx + s * 0.16} ${cy + s * 0.22} Z`}
          fill={fill}
        />
      );
    case 'fire':
      return (
        <path
          d={`M ${cx} ${cy - s * 0.46}
              Q ${cx + s * 0.26} ${cy - s * 0.1} ${cx + s * 0.18} ${cy + s * 0.14}
              Q ${cx + s * 0.12} ${cy + s * 0.3} ${cx} ${cy + s * 0.3}
              Q ${cx - s * 0.12} ${cy + s * 0.3} ${cx - s * 0.18} ${cy + s * 0.14}
              Q ${cx - s * 0.26} ${cy - s * 0.1} ${cx} ${cy - s * 0.46} Z`}
          fill={fill}
        />
      );
    default:
      return <circle cx={cx} cy={cy} r={s * 0.3} fill={fill} />;
  }
}

export default function SceneSvg({ scene }) {
  if (!scene) return null;
  const { noun, count, size, color } = scene;
  const s = FRAME_H * (count > 1 ? MULTI_SCALE : (SIZE_SCALE[size] ?? SIZE_SCALE.null));
  const fill = color === 'red' ? RED : NEUTRAL;

  // Evenly spaced across the frame so the count reads at a glance without
  // needing to be counted twice.
  const slots = Array.from({ length: count }, (_, i) => FRAME_W * ((i + 1) / (count + 1)));

  return (
    <figure className="dlab-scene">
      <svg
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        className="dlab-scene-svg"
        role="img"
        aria-label={`${count} ${size || ''} ${color || ''} ${count > 1 ? `${noun}s` : noun}`.replace(/\s+/g, ' ')}
      >
        <rect x="1" y="1" width={FRAME_W - 2} height={FRAME_H - 2} className="dlab-scene-frame" />
        {slots.map((cx, i) => (
          <Glyph key={i} noun={noun} cx={cx} cy={FRAME_H / 2} s={s} fill={fill} />
        ))}
      </svg>
    </figure>
  );
}
