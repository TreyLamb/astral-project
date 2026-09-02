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
export function composeDrill({ subtest, count, rng, generated = [], bankRatio = 0.5 }) {
  const pool = bankItems(subtest);
  if (pool.length === 0) return generated.slice(0, count);
  if (generated.length === 0) return pickN(pool, count, rng);

  const wantBank = Math.min(pool.length, Math.round(count * bankRatio));
  const fromBank = pickN(pool, wantBank, rng);
  const fromGen = generated.slice(0, Math.max(0, count - fromBank.length));
  return shuffleInPlace([...fromBank, ...fromGen], rng);
}

/** Sample without replacement; if asked for more than exist, returns all of them shuffled. */
function pickN(items, n, rng) {
  const copy = shuffleInPlace(items.slice(), rng);
  return copy.slice(0, Math.min(n, copy.length));
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
