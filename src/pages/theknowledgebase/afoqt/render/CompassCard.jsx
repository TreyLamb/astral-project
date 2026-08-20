// The COMPASS dial. "On this dial, the arrow shows the compass direction in which the airplane
// is headed" - so the card is fixed and the arrow points at the heading, which is the simpler of
// the two conventions and the one the directions describe.

const R = 46;
const CARDINALS = [
  { deg: 0, label: 'N' }, { deg: 90, label: 'E' }, { deg: 180, label: 'S' }, { deg: 270, label: 'W' },
];

export default function CompassCard({ heading = 0, size = 130 }) {
  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} className="afq-dial" role="img"
      aria-label={`Compass: heading ${heading} degrees`}>
      <circle cx="0" cy="0" r={R} className="afq-dial-face" />

      {Array.from({ length: 24 }, (_, i) => i * 15).map((d) => (
        <line key={d} x1="0" y1={-R} x2="0" y2={-R + (d % 45 === 0 ? 8 : 4)}
          className="afq-dial-tick" transform={`rotate(${d})`} />
      ))}

      {CARDINALS.map(({ deg, label }) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return (
          <text key={label} x={Math.cos(a) * (R - 17)} y={Math.sin(a) * (R - 17) + 4}
            className="afq-dial-cardinal">{label}</text>
        );
      })}

      {/* The arrow: straight up is north, and it rotates clockwise with the heading. */}
      <g transform={`rotate(${heading})`} className="afq-dial-needle">
        <polygon points={`0,${-R + 9} -7,-6 0,-11 7,-6`} />
        <line x1="0" y1="-6" x2="0" y2={R - 14} />
      </g>
      <circle cx="0" cy="0" r="2.5" className="afq-dial-hub" />

      <circle cx="0" cy="0" r={R} className="afq-dial-rim" />
    </svg>
  );
}
