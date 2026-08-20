// Instrument Comprehension: the geometry of an aircraft attitude, and how it projects onto the
// page. Pure maths, no React, so the QC scripts can audit it on plain Node.
//
// THE SPEC, verified against the AFPC pamphlet's Part 5 directions (transcribed in
// docs/afoqt/RESEARCH.md). Four things here are counter-intuitive and every one of them is the
// whole point of an item:
//
//   1. ⚠ BANK IS INVERTED. "If the airplane is banked to the pilot's RIGHT, the pointer is seen
//      to the LEFT of zero." The pointer moves opposite the bank. This is the subtest's trap.
//   2. THE SILHOUETTE ON THE DIAL NEVER MOVES. The horizon line and the pointer move around it.
//      That is the reverse of a real attitude indicator, where the horizon is the fixed thing.
//   3. THE VIEWER IS ALWAYS LOOKING NORTH, at the same altitude. Verbatim: "EAST IS ALWAYS TO
//      YOUR RIGHT AS YOU LOOK AT THE PAGE." So screen-right is +X (east) and screen-up is +Z.
//      An aircraft heading NORTH flies AWAY from you - a rear view. Heading SOUTH is a front view.
//   4. FOUR OPTIONS, not five. Instrument Comprehension is the only subtest on the test that
//      does not offer five, and afoqtSpec already encodes that.
//
// The item space is FINITE and small - roughly 3 pitch states x 5 bank states x 16 headings, so
// about 240 distinct attitudes. That is plenty for six weeks of study and it is declared rather
// than pretended away: the templates carry `stemSpace`.

export const HEADINGS = [
  { deg: 0, name: 'north' }, { deg: 45, name: 'northeast' },
  { deg: 90, name: 'east' }, { deg: 135, name: 'southeast' },
  { deg: 180, name: 'south' }, { deg: 225, name: 'southwest' },
  { deg: 270, name: 'west' }, { deg: 315, name: 'northwest' },
];

export const PITCHES = [
  { deg: -25, name: 'diving' }, { deg: 0, name: 'level' }, { deg: 25, name: 'climbing' },
];

// Bank magnitudes observed in official items. Positive is a bank to the PILOT'S RIGHT.
export const BANKS = [
  { deg: -90, name: 'banked 90 degrees left' }, { deg: -45, name: 'banked 45 degrees left' },
  { deg: 0, name: 'not banked' },
  { deg: 45, name: 'banked 45 degrees right' }, { deg: 90, name: 'banked 90 degrees right' },
];

const rad = (d) => (d * Math.PI) / 180;

/**
 * Body axes of an aircraft, expressed in world coordinates.
 *
 * World frame: +X east, +Y north, +Z up. Attitude is the usual aerospace triple - heading
 * measured clockwise from north, pitch positive nose-up, bank positive right-wing-down.
 *
 * @returns {{nose: number[], wing: number[], up: number[]}} unit vectors
 */
export function bodyAxes({ heading, pitch, bank }) {
  const h = rad(heading);
  const p = rad(pitch);
  const b = rad(bank);

  // Nose direction: heading rotates it around the vertical, pitch lifts it.
  const nose = [Math.sin(h) * Math.cos(p), Math.cos(h) * Math.cos(p), Math.sin(p)];
  // Right wing before any bank - horizontal, 90 degrees clockwise from the heading.
  const wing0 = [Math.cos(h), -Math.sin(h), 0];
  // wing x nose, NOT nose x wing. Forward-cross-right points DOWN in a right-handed frame, which
  // silently mirrored every banked aircraft: a right bank raised the right wing instead of
  // dropping it, and every bank distractor was therefore the correct answer.
  const up0 = cross(wing0, nose);

  // Rolling right drops the right wing toward the ground: at 90 degrees of right bank the wing
  // points straight down, which is exactly -up0.
  const wing = add(scale(wing0, Math.cos(b)), scale(up0, -Math.sin(b)));
  const up = add(scale(wing0, Math.sin(b)), scale(up0, Math.cos(b)));
  return { nose, wing, up };
}

const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

/**
 * Project a world point onto the page for a viewer looking north.
 *
 * Orthographic on purpose: the directions place the viewer at the same altitude and give no
 * viewing distance, so there is no perspective to apply and adding one would invent a depth cue
 * the real item does not have.
 *
 * ⚠ THE ONE DEPARTURE, and it is a legibility fix rather than a spec change.
 *
 * A camera exactly level with the aircraft and exactly on the north axis sees a northbound
 * aircraft perfectly END-ON, and at 90 degrees of bank the entire shape collapses to a single
 * line - two of the four options rendered as an invisible stroke. That is not a bug that can be
 * tuned away: for ANY camera elevation E there is a pitch of -E that points the nose straight
 * down the view axis, so a pure north-axis camera always has a degenerate attitude somewhere.
 * The official figures are pictorial drawings and plainly do not do this.
 *
 * So the camera is offset slightly in azimuth AND raised slightly. Because the offset is not a
 * multiple of 45 degrees, no heading on the dial can ever align the nose with the view axis, and
 * the degeneracy disappears entirely rather than moving somewhere else. Measured across all 120
 * attitudes the thinnest silhouette went from an invisible 0.00 to 0.22 of the mean area, and
 * all 120 still project to visibly distinct shapes.
 *
 * What is preserved, which is what actually matters: east is still to the right, north still
 * flies away from you, south still flies toward you, every option is drawn from the same
 * viewpoint, and no answer changes.
 */
export const VIEW_AZIMUTH = 15;
export const VIEW_ELEVATION = 30;

const norm = (v) => {
  const m = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / m, v[1] / m, v[2] / m];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const AZ = rad(VIEW_AZIMUTH);
const EL = rad(VIEW_ELEVATION);
// Looking mostly north and slightly down. `right` is perpendicular to both the view direction
// and world up, which keeps the horizon level on the page and east on the right.
const CAM_DIR = norm([Math.sin(AZ) * Math.cos(EL), Math.cos(AZ) * Math.cos(EL), -Math.sin(EL)]);
const CAM_RIGHT = norm(cross(CAM_DIR, [0, 0, 1]));
const CAM_UP = norm(cross(CAM_RIGHT, CAM_DIR));

export const project = (p) => ({ x: dot(p, CAM_RIGHT), y: -dot(p, CAM_UP), depth: dot(p, CAM_DIR) });

/**
 * A stylised aircraft, in body coordinates (forward, right, up).
 *
 * Deliberately blunt - the official silhouettes are solid shapes with no detail, and detail only
 * survives at one attitude anyway.
 *
 * ⚠ THE FUSELAGE IS TWO CROSSED PLATES, not one. A single flat plan-view plate is invisible
 * edge-on, which is exactly what happened at 90 degrees of bank: the wing went vertical, the
 * plan-view fuselage went with it, and the option rendered as a hairline. Crossing a side
 * profile through it guarantees that whatever angle the aircraft is seen from, at least one
 * surface still presents area. The fin and tailplane are already crossed for the same reason.
 */
export const AIRCRAFT_PARTS = [
  {
    id: 'fuselage-plan',
    poly: [[1.15, 0, 0], [0.35, 0.09, 0], [-1.0, 0.07, 0],
      [-1.15, 0, 0], [-1.0, -0.07, 0], [0.35, -0.09, 0]],
  },
  {
    id: 'fuselage-side',
    poly: [[1.15, 0, 0], [0.35, 0, 0.1], [-1.0, 0, 0.09],
      [-1.15, 0, 0.06], [-1.0, 0, -0.05], [0.35, 0, -0.07]],
  },
  {
    id: 'wing',
    poly: [[0.3, 0, 0], [0.05, 1.05, 0], [-0.2, 1.05, 0], [-0.35, 0, 0],
      [-0.2, -1.05, 0], [0.05, -1.05, 0]],
  },
  {
    id: 'tailplane',
    poly: [[-0.8, 0, 0.02], [-0.92, 0.42, 0.02], [-1.05, 0.42, 0.02], [-1.1, 0, 0.02],
      [-1.05, -0.42, 0.02], [-0.92, -0.42, 0.02]],
  },
  { id: 'fin', poly: [[-0.8, 0, 0.02], [-0.95, 0, 0.5], [-1.12, 0, 0.5], [-1.12, 0, 0.02]] },
];

/** Every part of the aircraft, projected to the page and sorted far-to-near for filling. */
export function silhouettePolys(attitude) {
  const { nose, wing, up } = bodyAxes(attitude);
  return AIRCRAFT_PARTS
    .map((part) => {
      const pts = part.poly.map(([f, r, u]) =>
        project(add(add(scale(nose, f), scale(wing, r)), scale(up, u))));
      return {
        id: part.id,
        points: pts.map((p) => [p.x, p.y]),
        depth: pts.reduce((n, p) => n + p.depth, 0) / pts.length,
      };
    })
    .sort((a, b) => b.depth - a.depth);
}

/** Where the artificial horizon's bank pointer sits, in degrees on the dial face. */
export const pointerAngle = (bank) => (bank === 0 ? 0 : -bank); // ⚠ inverted: right bank -> pointer to the LEFT

/**
 * How far the horizon line sits from the fixed silhouette, as a fraction of the dial radius.
 * Positive is DOWN the page.
 *
 * Climbing pushes the horizon BELOW the silhouette, which is what the directions describe: with
 * the pointer at the top of the dial, "the fuselage silhouette is seen between the horizon line
 * and the pointer" puts the horizon underneath. It is also how a real attitude indicator behaves.
 */
export const horizonOffset = (pitch) => pitch / 90;

export const isClimbing = (pitch) => pitch > 0;
export const isDiving = (pitch) => pitch < 0;

const deg360 = (d) => ((d % 360) + 360) % 360;
export const headingName = (deg) => HEADINGS.find((h) => h.deg === deg360(deg))?.name ?? `${deg360(deg)} degrees`;
export const bankName = (deg) => BANKS.find((b) => b.deg === deg)?.name ?? `banked ${Math.abs(deg)} degrees ${deg > 0 ? 'right' : 'left'}`;
export const pitchName = (deg) => (deg > 0 ? 'climbing' : deg < 0 ? 'diving' : 'neither climbing nor diving');

export const describe = (a) =>
  `${pitchName(a.pitch)}, ${bankName(a.bank)}, heading ${headingName(a.heading)}`;

export const sameAttitude = (a, b) =>
  deg360(a.heading) === deg360(b.heading) && a.pitch === b.pitch && a.bank === b.bank;

/**
 * The four options, built by the official formula.
 *
 * The pamphlet's own worked sample names them: *"Note that B is a rear view, whereas D is a front
 * view. Note also that A is banked to the right and that B is banked to the left."* So the wrong
 * answers are not near-misses in the abstract - they are three specific misreadings:
 *
 *   REAR VIEW    you read the compass as north when it was not. The aircraft flies away from you.
 *   FRONT VIEW   you read it as south. The aircraft flies toward you.
 *   WRONG BANK   you forgot the pointer is inverted and banked it the other way.
 *
 * Each carries its error id, so a miss reports as a named mistake rather than a red X.
 */
export function optionSet(correct) {
  const out = [{ attitude: correct, error: null, why: null }];
  const push = (attitude, error, why) => {
    if (out.some((o) => sameAttitude(o.attitude, attitude))) return;
    out.push({ attitude, error, why });
  };

  if (correct.bank !== 0) {
    push({ ...correct, bank: -correct.bank }, 'bank-inverted',
      'banked it the wrong way - the pointer moves OPPOSITE the bank, so a pointer left of zero means banked RIGHT');
  }
  push({ ...correct, heading: 0 }, 'rear-view',
    'took a rear view - an aircraft heading north is flying away from you, not toward you');
  push({ ...correct, heading: 180 }, 'front-view',
    'took a front view - an aircraft heading south is the one flying toward you');
  // Only if the three above could not fill the slate, and still a real misreading: the pitch
  // rule reversed. Climbing is the silhouette between the horizon and the pointer.
  if (correct.pitch !== 0) {
    push({ ...correct, pitch: -correct.pitch }, 'pitch-inverted',
      'read the climb as a dive - the silhouette sits between the horizon line and the pointer when CLIMBING');
  }
  push({ ...correct, heading: deg360(correct.heading + 90) }, 'heading-quarter-turn',
    'misread the compass by a quarter turn');
  push({ ...correct, bank: correct.bank === 0 ? 45 : 0 }, 'bank-missed',
    'missed the bank - the pointer is off zero, so the aircraft is banked');
  return out;
}
