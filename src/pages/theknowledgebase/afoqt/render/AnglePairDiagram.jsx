// Two straight lines crossing at a point, with all four angle regions labeled and color-coded
// so vertical angles (diagonally opposite, same color) and a linear pair (adjacent, different
// colors, summing to 180) are visible rather than just described in prose. This is the first
// instance of a small reusable "plot an angle figure" primitive - built for the ch09 vertical
// angle / linear pair confusion specifically, but the region-math generalizes to any two-line
// crossing at any angle, not hardcoded to one picture.
//
// `acute` is the smaller angle (in degrees) between the two lines; the other three regions are
// derived from it (180 - acute, and the two verticals). `tilt` just rotates the whole figure so
// it doesn't look artificially axis-aligned - purely cosmetic, changes no angle values.
export default function AnglePairDiagram({ acute = 40, size = 220 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;
  const toRad = (d) => (d * Math.PI) / 180;
  const pt = (deg, dist = r) => [cx + dist * Math.cos(toRad(deg)), cy - dist * Math.sin(toRad(deg))];

  const tilt = 12;
  const aDeg = tilt;
  const bDeg = tilt + acute;

  const [ax1, ay1] = pt(aDeg);
  const [ax2, ay2] = pt(aDeg + 180);
  const [bx1, by1] = pt(bDeg);
  const [bx2, by2] = pt(bDeg + 180);

  const VERTICAL_1 = '#60a5fa';
  const VERTICAL_2 = '#f0b429';

  // Four regions going around the crossing point. Each vertical pair (1&3, 2&4) shares a color -
  // that's the whole point being illustrated - and each adjacent pair (any two next to each
  // other in this list) is a linear pair, summing to 180.
  const regions = [
    { from: aDeg, to: bDeg, value: acute, color: VERTICAL_1 },
    { from: bDeg, to: aDeg + 180, value: 180 - acute, color: VERTICAL_2 },
    { from: aDeg + 180, to: bDeg + 180, value: acute, color: VERTICAL_1 },
    { from: bDeg + 180, to: aDeg + 360, value: 180 - acute, color: VERTICAL_2 },
  ];

  return (
    <figure className="afq-geo-figure">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img"
        aria-label="Two straight lines crossing, forming two pairs of vertical angles and four linear pairs">
        <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke="currentColor" strokeWidth="2" />
        <line x1={bx1} y1={by1} x2={bx2} y2={by2} stroke="currentColor" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="3" fill="currentColor" />
        {regions.map((reg, i) => {
          const mid = (reg.from + reg.to) / 2;
          const [lx, ly] = pt(mid, r * 0.58);
          return (
            <text key={i} x={lx} y={ly} fill={reg.color} fontSize="15" fontWeight="700"
              textAnchor="middle" dominantBaseline="middle">
              {reg.value}°
            </text>
          );
        })}
      </svg>
      <figcaption>
        The two <strong style={{ color: VERTICAL_1 }}>{acute}° angles</strong> face each other
        across the crossing — that is a <strong>vertical pair</strong>, and vertical pairs are
        always equal. The two <strong style={{ color: VERTICAL_2 }}>{180 - acute}° angles</strong>{' '}
        are the other vertical pair. Any two angles sitting <em>next to</em> each other here (one
        of each colour) are a <strong>linear pair</strong>, and they add to 180°.
      </figcaption>
    </figure>
  );
}
