// Manual row ordering inside the what-if sections.
//
// Dragging a row is a stronger statement than any column sort — it is the one
// ordering the tool cannot derive, so it wins. It applies ONLY inside a band
// (retakes, prospective classes): the printed transcript has a real order and
// is not yours to rearrange.
//
// The order is stored as a list of course ids per band rather than an index on
// each row, so it survives a re-sort, a filter, and a reload without having to
// be rewritten. Ids that are no longer in the band are ignored on read, which
// is what makes "take it out and put it back" reset that row — it comes back
// unranked and falls to the bottom of its section.
import { BAND_RETAKE, BAND_PROSPECTIVE } from './creditBlocks';

export const ORDERABLE_BANDS = [BAND_RETAKE, BAND_PROSPECTIVE];

export const EMPTY_ORDER = { [BAND_RETAKE]: [], [BAND_PROSPECTIVE]: [] };

// Saved state is untrusted — it outlives the transcript it was made against.
export function cleanOrder(o) {
  const out = { [BAND_RETAKE]: [], [BAND_PROSPECTIVE]: [] };
  if (!o || typeof o !== 'object') return out;
  for (const band of ORDERABLE_BANDS) {
    if (!Array.isArray(o[band])) continue;
    const seen = new Set();
    out[band] = o[band].filter((id) => typeof id === 'string' && !seen.has(id) && seen.add(id));
  }
  return out;
}

// Position of each id within its band. An id with no entry sorts after every
// ranked one and then falls through to whatever the column sort says, so a
// course you have only just re-graded appears at the bottom of its section
// instead of silently jumping into the middle of an order you arranged.
export function manualRank(order, band, id) {
  const list = order?.[band];
  if (!Array.isArray(list)) return Infinity;
  const i = list.indexOf(id);
  return i === -1 ? Infinity : i;
}

export function hasManualOrder(order) {
  return ORDERABLE_BANDS.some((b) => (order?.[b]?.length ?? 0) > 0);
}

export function manualCount(order) {
  return ORDERABLE_BANDS.reduce((n, b) => n + (order?.[b]?.length ?? 0), 0);
}

/**
 * Move `dragId` next to `overId` within a band's id list.
 *
 * `visible` is the band's ids in the order they are on screen right now,
 * including the unranked ones. Taking the whole visible run — not just the
 * previously-saved list — is what lets a single drag absorb rows that had no
 * manual position yet: after one drag the section is fully ordered, so the
 * next drag does what it looks like it does.
 *
 * @param {string[]} visible band ids in current display order
 * @param {string} dragId    the row being moved
 * @param {string} overId    the row it was dropped on
 * @param {boolean} after    dropped below that row's midpoint
 * @returns {string[]} the new id list for the band
 */
export function moveWithin(visible, dragId, overId, after) {
  if (dragId === overId) return [...visible];
  const from = visible.indexOf(dragId);
  const to = visible.indexOf(overId);
  if (from === -1 || to === -1) return [...visible];

  const next = visible.filter((id) => id !== dragId);
  // Index of the target AFTER the dragged row was pulled out, so dragging
  // downward does not land one slot short of where it was dropped.
  const at = next.indexOf(overId) + (after ? 1 : 0);
  next.splice(at, 0, dragId);
  return next;
}

// Drop the ids a band no longer contains. Called when a scenario changes, so a
// stale order cannot pin a course that is not in that section any more.
export function pruneOrder(order, idsByBand) {
  const out = { [BAND_RETAKE]: [], [BAND_PROSPECTIVE]: [] };
  for (const band of ORDERABLE_BANDS) {
    const live = idsByBand?.[band];
    if (!live || !Array.isArray(order?.[band])) continue;
    const set = live instanceof Set ? live : new Set(live);
    out[band] = order[band].filter((id) => set.has(id));
  }
  return out;
}
