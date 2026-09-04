// Static question banks, normalised to the same shape the generator emits so the runner
// does not care where a question came from.
//
// Two sources, with very different standing:
//   realQuestions.json  - OATTS, official USAF, cleared for public release. May ship
//                         verbatim and is labelled `real`.
//   migratedAsvab.json  - a CLEANED COPY of the good ASVAB questions. The ASVAB deck
//                         itself is read-only; nothing here writes back to it.
//
// Bank items keep a stable id, so mastery is tracked per item (there is only one of each)
// rather than per template. `bank:<id>` namespacing keeps them out of the template stats.

import REAL from '../data/realQuestions.json';
import MIGRATED from '../data/migratedAsvab.json';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

// The OATTS Word Knowledge items ship as a bare word - "OBSTINATE" - because on the real
// subtest the instruction lives once in the printed directions, not on every item. Dropped into
// a mixed drill that reads as no question at all: the screen shows a word and five adjectives
// and never says what is being asked. Generated WK questions already phrase it
// `WORD most nearly means:` (engine/morphology.js), so bank items get the same frame rather
// than a second convention.
const bareWord = (s) => typeof s === 'string' && /^[A-Za-z][A-Za-z-]*$/.test(s.trim());
const frameStem = (q) =>
  (q.subtest === 'WK' && bareWord(q.question)
    ? `${q.question.trim().toUpperCase()} most nearly means:`
    : q.question);

function fromReal(q) {
  // Items needing a figure we do not have alongside them are unanswerable - skip.
  if (q.needsImage || !q.choices || q.correct == null) return null;
  const choices = q.choices.map((c) => c.text);
  const correctIndex = q.choices.findIndex((c) => c.label === q.correct);
  if (correctIndex < 0) return null;
  return {
    templateId: `bank:${q.id}`,
    seed: 0,
    subtest: q.subtest,
    band: 3,
    stretch: false,
    concepts: q.topic ? [q.topic] : [],
    provenance: q.provenance,
    stem: frameStem(q),
    choices,
    correctIndex,
    explanation: q.explanation ?? null,
    tags: [],
    render: null,
  };
}

function fromMigrated(q) {
  // Many migrated stems had no inline options; without distractors there is nothing to
  // pick between, so they are held back until a template can generate options for them.
  if (!q.choices || q.choices.length < 2) return null;
  const choices = q.choices.map((c) => c.text);
  // The ASVAB deck stores the answer as TEXT, not a letter, so match on content.
  const norm = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, '');
  let correctIndex = choices.findIndex((c) => norm(c) === norm(q.answer));
  if (correctIndex < 0) correctIndex = choices.findIndex((c) => norm(c).includes(norm(q.answer)) || norm(q.answer).includes(norm(c)));
  if (correctIndex < 0) return null;
  return {
    templateId: `bank:${q.id}`,
    seed: 0,
    subtest: q.subtest,
    band: q.difficulty === 'basic' ? 2 : q.difficulty === 'advanced' ? 4 : 3,
    stretch: false,
    concepts: [],
    provenance: q.provenance,
    stem: q.question,
    choices,
    correctIndex,
    explanation: q.explanation ?? null,
    tags: q.tags ?? [],
    render: null,
  };
}

const ITEMS = [
  ...REAL.map(fromReal),
  ...MIGRATED.map(fromMigrated),
].filter(Boolean);

export const bankItems = (subtest) => ITEMS.filter((q) => q.subtest === subtest);
export const bankCount = (subtest) => bankItems(subtest).length;
export const bankTotal = () => ITEMS.length;

// A bank item has no template + rng behind it (seed is always 0, the item IS the content), so it
// cannot be looked up through engine/generator.js's generateInstance the way a real template can.
// Anything that wants to replay a specific question by (templateId, seed) - the flagged-questions
// review page - needs this instead whenever templateId starts with "bank:".
export const bankItemByTemplateId = (templateId) => ITEMS.find((q) => q.templateId === templateId) ?? null;

/** Counts by subtest, for the dashboard and the drill picker. */
export function bankSummary() {
  const out = {};
  for (const q of ITEMS) {
    out[q.subtest] ??= { total: 0, real: 0 };
    out[q.subtest].total++;
    if (q.provenance?.kind === 'real') out[q.subtest].real++;
  }
  return out;
}

/**
 * Compose a drill from generated instances and static bank items.
 *
 * Both matter and neither is sufficient: generated questions give unlimited non-repeating
 * practice but only where a template exists, while bank items cover subtests with no
 * templates yet and carry the official/real-source material. Mixing means a subtest is
 * useful from day one rather than waiting on its template phase.
 */
/**
 * The bank's share of a drill ONCE THE SUBTEST HAS TEMPLATES.
 *
 * This was a flat 0.5, and on a built-out subtest that is badly wrong. Trey, 2026-09-04: "I've
 * seen the word 'belie' like 30x... I haven't seen a new word in a while." He was right, and
 * the arithmetic is stark. Word Knowledge has **35 bank items** against **450 distinct headwords**
 * reachable from its 60 templates. At a 0.5 share a 25-question drill drew ~12 of those same 35
 * every single run - roughly a THIRD of the entire bank per drill - while any given template word
 * had a ~2.4% chance of appearing. A bank item was about **13x more likely** to be seen than a
 * generated one, so the bank's handful of words felt like the whole subtest.
 *
 * 0.5 is still right where the bank is all there is: `composeDrill` returns early on an empty
 * `generated`, so a subtest with no templates keeps getting a pure bank drill. This constant only
 * governs the mix once generation can carry the run, which is what drill.js's own header says the
 * bank is for - "covers subtests whose template phase has not been built yet."
 */
const BANK_SHARE_WITH_TEMPLATES = 0.15;

export function composeDrill({ subtest, count, rng, generated = [], seen = null, bankRatio = null }) {
  const pool = bankItems(subtest);
  if (pool.length === 0) return generated.slice(0, count);
  if (generated.length === 0) return pickN(pool, count, rng, seen);

  const ratio = bankRatio ?? BANK_SHARE_WITH_TEMPLATES;
  const wantBank = Math.min(pool.length, Math.round(count * ratio));
  const fromBank = pickN(pool, wantBank, rng, seen);
  const fromGen = generated.slice(0, Math.max(0, count - fromBank.length));
  return shuffleInPlace([...fromBank, ...fromGen], rng);
}

/**
 * Sample without replacement, LEAST-SEEN FIRST; if asked for more than exist, returns all of
 * them shuffled.
 *
 * Lowering the share alone would have thinned the repetition without ever fixing "I haven't seen
 * a new word in a while" - a uniform draw from a 35-item pool re-serves a seen item just as
 * happily as an unseen one, so the same few words keep coming back while others never appear at
 * all. `seen` is `progress.templateStats`, which already counts every bank item because
 * recordAnswer keys on `templateId` and a bank item's is `bank:<id>`. Nothing new is stored.
 *
 * Shuffle FIRST and then sort: Array#sort is stable, so items with equal seen-counts keep their
 * shuffled order and the choice among equally-fresh items stays random rather than settling into
 * a fixed rotation.
 */
function pickN(items, n, rng, seen = null) {
  const copy = shuffleInPlace(items.slice(), rng);
  if (seen) copy.sort((a, b) => (seen[a.templateId]?.seen ?? 0) - (seen[b.templateId]?.seen ?? 0));
  return copy.slice(0, Math.min(n, copy.length));
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
