import { silhouettePolys } from '../engine/attitude.js';

// One of the four aircraft, drawn as the viewer sees it.
//
// The projection is orthographic and the viewer is looking NORTH at the same altitude, so screen
// right is east - exactly as the directions insist. The shape is deliberately blunt: the official
// silhouettes carry no detail, and detail would vanish at the very attitudes that matter most
// (a thin outline seen edge-on disappears entirely).
//
// ⚠ This is the part of the subtest the plan flagged as NOT de-risked: whether a procedurally
// drawn silhouette reads correctly to a human eye is a judgement, not a proof. The geometry is
// verified numerically in the tests; the legibility is not, and cannot be. If these ever read
// badly, the planned fallback is an authored sprite set - roughly 16 headings x 3-6 attitudes -
// and taking it is not a failure, it is the documented path.

const SCALE = 22;

export default function AircraftSilhouette({ heading = 0, pitch = 0, bank = 0, size = 120, muted = false }) {
  const parts = silhouettePolys({ heading, pitch, bank });
  return (
    <svg viewBox="-48 -48 96 96" width={size} height={size}
      className={'afq-silhouette' + (muted ? ' afq-silhouette-muted' : '')} role="img"
      aria-label="Aircraft in flight, viewed from the south">
      {/* Painter's algorithm: silhouettePolys returns parts sorted far-to-near, so the nearer
          surfaces simply overpaint. With one flat colour that only matters at the edges, but it
          keeps a wing from showing through a fuselage at steep bank angles. */}
      {parts.map((p) => (
        <polygon key={p.id} points={p.points.map(([x, y]) => `${x * SCALE},${y * SCALE}`).join(' ')} />
      ))}
    </svg>
  );
}
