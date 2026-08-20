// Where to rule off the what-if list. Its own module rather than a helper
// inside CourseTable.jsx for the same reason columns.js is — a component
// module may only export components (react-refresh/only-export-components) —
// and because the arithmetic is worth a test of its own.
import { isCounted } from './gpa';

// A semester's worth of credits, which is how the retake list is actually
// read: "how many terms of retaking is this?".
export const DEFAULT_CREDIT_BLOCK = 12;

// The three bands the table is grouped into, in the order they are shown:
// courses you re-graded, courses that do not exist yet, then the transcript as
// the registrar printed it.
export const BAND_RETAKE = 'changed';
export const BAND_PROSPECTIVE = 'extra';
export const BAND_PLAIN = 'plain';

export function bandOf(course, overrides = {}) {
  if (course.isExtra) return BAND_PROSPECTIVE;
  return overrides[course.id] ? BAND_RETAKE : BAND_PLAIN;
}

// Free entry, so it is clamped rather than trusted. Anything unusable falls
// back to the default instead of silently disabling the breaks — a block of 0
// would want a rule after every single row.
export function clampCreditBlock(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return DEFAULT_CREDIT_BLOCK;
  return Math.min(99, Math.round(v * 2) / 2);
}

/**
 * Break the what-if rows into credit-sized blocks so a long list reads as "a
 * semester, then four more credits" instead of one undifferentiated run.
 *
 * The retake band and the prospective band count SEPARATELY — they are two
 * different commitments (re-sitting a class you already took vs. taking a new
 * one), and the header's Estimated readout already splits them the same way.
 * Only credits that actually count toward the GPA accumulate: an override on a
 * superseded attempt moves nothing, so it must not pad a block or the two
 * numbers would disagree.
 *
 * @returns {Map<number, {block?: number, credits?: number, kind?: string, boundary?: string}>}
 *   row index -> the mark drawn AFTER that row.
 *     { block, credits, kind }  a full block of that band closed here
 *     { boundary: 'extras' }    end of the retakes, prospective classes below
 *     { boundary: 'rest' }      end of the what-if, the real transcript below
 */
export function creditBreaks(rows, overrides = {}, honorRepeats = true, size = DEFAULT_CREDIT_BLOCK) {
  const marks = new Map();
  if (!(size > 0)) return marks;

  // Where each band stops. Computed up front so a band that is not contiguous
  // — review mode off leaves the re-graded rows scattered — still gets exactly
  // one closing rule instead of one after every row.
  const lastOf = { [BAND_RETAKE]: -1, [BAND_PROSPECTIVE]: -1, [BAND_PLAIN]: -1 };
  rows.forEach((c, i) => { lastOf[bandOf(c, overrides)] = i; });

  const put = (at, patch) => {
    if (at < 0) return;
    marks.set(at, { ...(marks.get(at) || {}), ...patch });
  };

  const state = {
    [BAND_RETAKE]: { acc: 0, block: 1 },
    [BAND_PROSPECTIVE]: { acc: 0, block: 1 },
  };

  rows.forEach((c, i) => {
    const band = bandOf(c, overrides);
    if (band === BAND_PLAIN) return;
    const s = state[band];

    // Float drift: 0.5-credit courses summed across a long list otherwise land
    // at 11.999999999999998 and never close a 12-credit block.
    if (isCounted(c, honorRepeats)) s.acc = Math.round((s.acc + (Number(c.credits) || 0)) * 100) / 100;
    if (s.acc >= size) {
      put(i, { block: s.block, credits: s.acc, kind: band });
      s.block += 1;
      s.acc = 0;
    }

    if (i !== lastOf[band]) return;

    // The remainder is a block too — 16 credits at 12 is 12 + 4, not 12 and a
    // loose tail. It lands on the same row as the divider out of the band, so
    // the two become one mark rather than two stacked rules.
    if (s.acc > 0) put(i, { block: s.block, credits: s.acc, kind: band });

    const boundary = band === BAND_RETAKE
      ? (lastOf[BAND_PROSPECTIVE] > i ? 'extras' : (lastOf[BAND_PLAIN] > i ? 'rest' : null))
      : (lastOf[BAND_PLAIN] > i ? 'rest' : null);
    if (boundary) put(i, { boundary, kind: band });
  });

  return marks;
}
