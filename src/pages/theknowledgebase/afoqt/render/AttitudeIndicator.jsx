import { pointerAngle, horizonOffset } from '../engine/attitude.js';

// The ARTIFICIAL HORIZON dial, drawn to the AFPC pamphlet's Part 5 directions.
//
// This instrument is NOT a real attitude indicator and drawing it like one would teach the wrong
// reading. Three things are specific to it:
//
//   1. The aircraft silhouette is FIXED at the centre. The horizon line and the pointer move
//      around it. (A real AI moves the horizon too, but candidates who fly expect the symbol to
//      be the thing that stays put, so it is worth being exact.)
//   2. ⚠ THE POINTER IS INVERTED. Banked to the pilot's RIGHT puts the pointer LEFT of zero.
//      This is the trap the whole subtest is built on, so it is not softened here.
//   3. The horizon line is ALWAYS at right angles to the pointer - so both rotate together, by
//      the same inverted angle.

const R = 46;

export default function AttitudeIndicator({ pitch = 0, bank = 0, size = 130 }) {
  const tilt = pointerAngle(bank); // degrees, SVG clockwise-positive
  const off = horizonOffset(pitch) * R; // positive = horizon below the silhouette

  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} className="afq-dial" role="img"
      aria-label={`Artificial horizon: ${pitch > 0 ? 'climbing' : pitch < 0 ? 'diving' : 'level'}, ${bank === 0 ? 'no bank' : `banked ${Math.abs(bank)} degrees ${bank > 0 ? 'right' : 'left'}`}`}>
      <defs>
        <clipPath id={`ai-face-${size}`}><circle cx="0" cy="0" r={R} /></clipPath>
      </defs>

      <circle cx="0" cy="0" r={R} className="afq-dial-face" />

      {/* Sky above the horizon line, ground shaded below it. Both rotate with the bank. */}
      <g clipPath={`url(#ai-face-${size})`} transform={`rotate(${tilt})`}>
        <rect x={-R * 2} y={off - R * 2} width={R * 4} height={R * 2} className="afq-dial-sky" />
        <rect x={-R * 2} y={off} width={R * 4} height={R * 2} className="afq-dial-ground" />
        <line x1={-R} y1={off} x2={R} y2={off} className="afq-dial-horizon" />
      </g>

      {/* Bank scale, and the zero index at the top. */}
      {[-90, -45, 0, 45, 90].map((d) => (
        <line key={d} x1="0" y1={-R} x2="0" y2={-R + (d === 0 ? 9 : 6)}
          className={d === 0 ? 'afq-dial-zero' : 'afq-dial-tick'}
          transform={`rotate(${d})`} />
      ))}

      {/* The pointer. Its angle is the INVERTED bank - see pointerAngle. */}
      <g transform={`rotate(${tilt})`}>
        <polygon points={`0,${-R + 2} -5,${-R + 13} 5,${-R + 13}`} className="afq-dial-pointer" />
      </g>

      {/* The fixed aircraft silhouette. Never moves, whatever the aircraft is doing. */}
      <g className="afq-dial-symbol">
        <line x1="-26" y1="0" x2="-9" y2="0" />
        <line x1="9" y1="0" x2="26" y2="0" />
        <circle cx="0" cy="0" r="3" />
      </g>

      <circle cx="0" cy="0" r={R} className="afq-dial-rim" />
    </svg>
  );
}
