// Chapter 1 — The method, and the twelve-second clock.
//
// This chapter has no vocabulary of its own. It draws on the whole bank and asks two questions
// that are about HOW to read an item rather than about any particular word, which is why its
// templates declare the method concepts explicitly rather than inheriting the rows'.
//
// Both frames exist because of the clock. Twelve seconds is not enough to retrieve a definition,
// weigh five options and commit - so the subtest rewards partial knowledge used well:
//
//   CONNOTATION. Knowing only that a word is disapproving eliminates every approving option.
//   That judgement is available in about a second, and long before a definition is.
//
//   THE REVERSED STEM. An item that asks for the OPPOSITE puts the correct meaning on the page
//   as a trap, and at speed the eye takes the word it recognises. Drilling it backwards is what
//   makes the forward version visible.
//
// See engine/words.js for the builders. The rows themselves live in chapters 5 and 6.

import { methodTemplates } from '../../engine/words.js';

// Imported for their side effect: the bank must be fully registered before these frames are
// built, because they sample across all of it rather than one chapter.
import './ch05-people-speech.js';
import './ch06-change-degree.js';

for (const band of [2, 3, 4]) {
  methodTemplates({ band });
}
