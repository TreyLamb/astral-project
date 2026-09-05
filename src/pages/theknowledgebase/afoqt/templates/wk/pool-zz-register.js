// Turns the word pool into templates. MUST be imported LAST of the pool files.
//
// The pool is spread over templates/wk/pool-NN-*.js, all registering against the single chapter
// `wk-20-vocab-pool` (see curriculum/chapters.js for why it is one chapter and not forty-five).
// A chapter is not a file: the pool grows by adding word files, and this one call turns whatever
// they registered into the drill templates, so nothing here changes as the pool gets bigger.
//
// Bands 3-5 only. Band 2 is below what the AFOQT asks and Trey's own ranking puts it below the
// level worth studying for meaning - the taught chapters already carry the easier tiers, and the
// Speed drill covers bands 1-2 for pace rather than vocabulary.

import { wordTemplates } from '../../engine/words.js';

const CH = 'wk-20-vocab-pool';

for (const band of [3, 4, 5]) {
  wordTemplates({ chapter: CH, band, idBase: `wk-20-b${band}`, name: 'Word pool' });
}
