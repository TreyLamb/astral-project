/**
 * ONE honest answer to "how much is actually in here", in units a person can read.
 *
 * This module exists because the count question has been answered wrong, by several different
 * agents, several times - 500, 2000, 60, 35 - and every one of those numbers was either a
 * different unit or an invention. `docs/afoqt/QUESTION-SELECTION.md` §2 is the written version
 * of the same problem: FOUR different numbers all sound like "the word count", and a UI that
 * prints one without naming its unit is unreadable even when it is correct.
 *
 * So: everything here is DERIVED FROM THE REGISTRY AT RUNTIME. Nothing is a stored constant,
 * nothing is copied out of a doc, and no caller may state a count that did not come through
 * here. If the content changes, these numbers change with it; if an agent claims a number that
 * disagrees with this screen, this screen is right.
 *
 * The unit definitions, stated once:
 *
 *   words      askableWords('WK') - distinct HEADWORDS Word Knowledge can ask about, including
 *              the ~100 that reach the screen only as a morphology example or a confusable pair
 *              and are therefore NOT registry rows. WK only; meaningless elsewhere.
 *   questions  subtestItemSpace().items - distinct QUESTIONS the subtest can ever ask, generated
 *              plus pre-written. `null` when the subtest is open (parameterised, never repeats).
 *   templates  question SHAPES. Never a content count: a word batch widens a template's item
 *              space instead of adding templates, so this barely moves while words double.
 *   written    pre-written OATTS / cleaned-ASVAB items. The smallest of the four numbers and the
 *              one most often mistaken for the largest.
 */

import { subtestItemSpace } from './scoring.js';
import { askableWords, allWords } from './words.js';
import { getSubtest } from './afoqtSpec.js';

/**
 * Full-length, non-repeating sessions a capped subtest can serve.
 *
 * This is the number that actually answers "is there enough here to prepare me" - a bank is not
 * big or small in the abstract, it is big or small relative to the length of the real subtest.
 * 165 Reading Comprehension questions sounds ample until you divide by a 25-question subtest.
 */
export function nonRepeatingRuns(code) {
  const { items } = subtestItemSpace(code);
  const meta = getSubtest(code);
  if (items == null || !meta?.questions) return null;
  return items / meta.questions;
}

/** How thin a capped subtest is, as a judgement the UI can colour by. Open subtests never run out. */
export function depthVerdict(code) {
  const runs = nonRepeatingRuns(code);
  const meta = getSubtest(code);
  if (runs == null) {
    return { level: 'open', label: 'never repeats', hint: 'Generated from parameters - this subtest cannot run out of questions.' };
  }
  const n = runs < 1 ? runs.toFixed(1) : Math.floor(runs);
  const hint = `${subtestItemSpace(code).items} questions over a ${meta?.questions}-question subtest: ${n} full sittings before the bank must repeat itself.`;
  if (runs >= 20) return { level: 'deep', label: `${n} full sittings before a repeat`, hint };
  if (runs >= 6) return { level: 'ok', label: `${n} full sittings before a repeat`, hint };
  return { level: 'thin', label: `only ${n} full sittings before a repeat`, hint: `${hint} Thin - expect to recognise questions.` };
}

/**
 * Everything known about one subtest's content, each figure carrying its own unit.
 *
 * `lines` is the display form and is deliberately built here rather than in a view: three views
 * printed their own variants of this list and one of them dropped the word "written", which is
 * the entire reason 35 got read as a word count.
 */
export function subtestInventory(code) {
  const space = subtestItemSpace(code);
  const meta = getSubtest(code);
  const words = code === 'WK' ? askableWords('WK').length : 0;
  const registry = code === 'WK' ? allWords().length : 0;

  const lines = [
    words ? { n: words, unit: words === 1 ? 'word' : 'words', hint: `Distinct headwords Word Knowledge can ask about. ${registry} of them are full registry rows with named distractors; the rest appear as root examples or confusable pairs.` } : null,
    space.items != null
      ? { n: space.items, unit: space.items === 1 ? 'distinct question' : 'distinct questions', hint: `${space.generated} generated + ${space.banked} pre-written. This is the whole bank - working through it is a real finish line.` }
      : { n: null, unit: 'open', hint: `${space.unbounded} of ${space.templates} templates are built from parameters, so this subtest never runs out of questions.` },
    { n: space.templates, unit: space.templates === 1 ? 'template' : 'templates', hint: 'Question SHAPES, not content. Adding words widens a template instead of adding one, so this number barely moves while the bank grows.' },
    space.banked ? { n: space.banked, unit: 'pre-written', hint: 'Real OATTS / cleaned ASVAB items, kept verbatim. A garnish on each drill (15%), never half of it.' } : null,
  ].filter(Boolean);

  return {
    ...space,
    words,
    registry,
    lines,
    runs: nonRepeatingRuns(code),
    depth: depthVerdict(code),
    realQuestions: meta?.questions ?? null,
  };
}
