// Combines a diagnostic result with the curriculum chapter graph. Deliberately separate from
// engine/diagnostic.js (pure accuracy math - no chapters, no storage) and afoqtStorage.js (pure
// persistence) - this is the one file allowed to import both, so neither of those has to know the
// other exists.
//
// `results` throughout is `latestDiagnostic(progress)?.results` - the shape
// `{ [subtestCode]: {correct, answered} }` engine/diagnostic.js already expects. Passing `null`
// (no diagnostic taken yet) degrades every function here to the pre-personalization behaviour -
// standard chapter order, no tier - rather than branching in every caller.

import { isUnlocked } from './chapters.js';
import { isChapterDone } from '../afoqtStorage.js';
import { subtestTier, tierRank } from '../engine/diagnostic.js';

/** Chapters ordered weakest-subtest-first. Ties (same tier, or no diagnostic) keep the authored
 *  chapter `order` - prerequisites are declared against that order, not against tier. */
export function personalizedChapterOrder(chapters, results) {
  if (!results) return [...chapters].sort((a, b) => a.order - b.order);
  return [...chapters].sort((a, b) => {
    const ra = tierRank(subtestTier(results, a.subtest));
    const rb = tierRank(subtestTier(results, b.subtest));
    return ra !== rb ? ra - rb : a.order - b.order;
  });
}

/** Tracks (curriculum/chapters.js TRACKS) ordered the same way, for the curriculum map's own
 *  section order - so a track that tested strong stops being the first thing on the page. */
export function personalizedTrackOrder(tracks, results) {
  if (!results) return tracks;
  return [...tracks]
    .map((t, i) => ({ t, i, r: tierRank(subtestTier(results, t.subtest)) }))
    .sort((a, b) => (a.r !== b.r ? a.r - b.r : a.i - b.i))
    .map((x) => x.t);
}

/** The next thing to actually do, personalized: the first unlocked, unfinished chapter in
 *  weakest-first order. Falls back to standard `order` when there is no diagnostic yet. */
export function nextPersonalizedChapter(chapters, progress, results) {
  const ordered = personalizedChapterOrder(chapters, results);
  return ordered.find((c) => !isChapterDone(progress, c.id) && isUnlocked(c, progress.chapters ?? {})) ?? null;
}
