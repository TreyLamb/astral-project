// The structural contract every template must hold, in one place.
//
// Both `npm run afoqt:selftest` and the vitest suite call this, so the CLI check and the
// build check can never drift apart. See docs/afoqt/QUESTION-DOCTRINE.md for why each rule
// is here; in short, this is the gate that stops a broken generator from reaching a study
// session the way the bulk-imported ASVAB junk did.

import { allTemplates, generateInstance } from './generator.js';
import { getSubtest } from './afoqtSpec.js';

export const DEFAULT_SAMPLES = 400;
/** A template with no declared bound must vary its stem in at least this share of samples. */
export const MIN_STEM_RATIO = 0.1;
/**
 * ...but the requirement stops climbing here. A ratio alone would mean raising --samples
 * silently raises the bar, so a template with 60 legitimate parameter combinations would
 * pass at 400 samples and fail at 1500 without anything about it having changed. 40 distinct
 * stems is plenty to prove a template is not a static question in disguise.
 */
export const STEM_FLOOR_CAP = 40;

/**
 * Which seeds a sample walks.
 *
 * Ordinary templates take seed 0, 1, 2... - mulberry32 decorrelates adjacent seeds completely,
 * so that is already a fair sample of the item space.
 *
 * A `sheet` template is different, and getting this wrong would have hollowed out the entire
 * Table Reading audit. Its seed is split (see SHEET_BITS): the low 12 bits pick the question
 * and the HIGH bits pick the figure. Walking 0..7999 therefore only ever produces two
 * different grids, so 8,000 samples would have checked distractor collisions against two
 * tables and reported a clean run. Spreading the seeds with a Knuth multiplicative hash gives
 * a different grid AND a different cell on every sample, which is the coverage the check is
 * for.
 */
export const seedForSample = (i, template) =>
  template?.sheet ? (Math.imul(i + 1, 2654435761) >>> 0) : i;

/**
 * What makes two instances of a template DIFFERENT questions.
 *
 * Normally it is the stem, and a template that emits one stem forever is a static question
 * wearing a template's clothes. But a few frames deliberately hold the stem constant and vary
 * the OPTIONS - "which of these words carries a negative connotation?" is the same sentence
 * every time, and the item is which word is the answer. Keying those off the stem would report
 * a working generator as broken, so they declare `varies: 'options'` and are keyed off the
 * correct choice instead. Declared, not inferred: the same rule `stemSpace` follows.
 */
export const itemKey = (q, t) => (t?.varies === 'options' ? String(q.choices[q.correctIndex]) : q.stem);

/**
 * @param {Template} t
 * @param {{samples?: number}} [opts]
 * @returns {{id: string, band: number, subtest: string, stems: number, shortCount: number,
 *            firstShort: {seed: number, instance: object}|null, problems: string[]}}
 */
export function auditTemplate(t, { samples = DEFAULT_SAMPLES } = {}) {
  const spec = getSubtest(t.subtest);
  const problems = [];
  const stems = new Set();
  let firstShort = null;
  let shortCount = 0;

  if (!spec) {
    return { id: t.id, band: t.band, subtest: t.subtest, stems: 0, shortCount: 0, firstShort: null,
      problems: [`unknown subtest "${t.subtest}"`] };
  }
  if (!(t.band >= 1 && t.band <= 5)) problems.push(`band ${t.band} is outside 1-5`);
  // Doctrine rule 2: a template mapping to no chapter concept is untraceable content.
  if (!Array.isArray(t.concepts) || t.concepts.length === 0) problems.push('declares no concepts');

  for (let i = 0; i < samples; i++) {
    const seed = seedForSample(i, t);
    const q = generateInstance(t.id, seed);
    if (!q) { problems.push(`seed ${seed}: generate() returned nothing`); continue; }
    stems.add(itemKey(q, t));

    // The real test gives 5 options everywhere except Instrument Comprehension. A short slate
    // means two error-modes produced the same value for those parameters and one was deduped
    // away - which usually also means one of them landed ON the answer.
    if (q.choices.length !== spec.choices) {
      shortCount++;
      if (!firstShort) firstShort = { seed, instance: q };
    }
    if (new Set(q.choices).size !== q.choices.length) {
      problems.push(`seed ${seed}: duplicate choice in ${JSON.stringify(q.choices)}`);
    }
    if (!(q.correctIndex >= 0 && q.correctIndex < q.choices.length)) {
      problems.push(`seed ${seed}: correctIndex ${q.correctIndex} out of range`);
    }
    if (!String(q.stem).trim()) problems.push(`seed ${seed}: empty stem`);
    // "undefined" is a legitimate word in a domain question, so stems are only checked for
    // tokens that can never be intentional.
    if (/NaN|Infinity/.test(String(q.stem))) problems.push(`seed ${seed}: bad stem "${q.stem}"`);
    for (const c of q.choices) {
      const str = String(c);
      if (!str.trim()) problems.push(`seed ${seed}: empty choice`);
      if (/NaN|undefined|Infinity/.test(str)) problems.push(`seed ${seed}: bad choice "${str}"`);
    }
  }

  if (shortCount) {
    problems.push(`${shortCount}/${samples} instances produced fewer than ${spec.choices} choices`);
  }

  // Iteration is the point of a template. Some item spaces are genuinely bounded, though -
  // there are only so many regular polygons worth naming - so a template may DECLARE its
  // size with `stemSpace`. Declaring it is the honest move; silently emitting six stems
  // forever is a static question wearing a template's clothes.
  const base = Math.min(Math.ceil(samples * MIN_STEM_RATIO), STEM_FLOOR_CAP);
  const floor = t.stemSpace ? Math.min(t.stemSpace, base) : base;
  const unit = t.varies === 'options' ? 'answers' : 'stems';
  if (stems.size < floor) {
    problems.push(t.stemSpace
      ? `only ${stems.size} distinct ${unit}, but stemSpace declares ${t.stemSpace}`
      : `only ${stems.size} distinct ${unit} in ${samples} samples (needs ${floor}+, or declare stemSpace)`);
  }

  return { id: t.id, band: t.band, subtest: t.subtest, stems: stems.size, shortCount, firstShort, problems };
}

export function auditAll(opts = {}) {
  return allTemplates()
    .filter((t) => (opts.only ? t.id.includes(opts.only) : true))
    .filter((t) => (opts.subtest ? t.subtest === opts.subtest : true))
    .map((t) => auditTemplate(t, opts));
}
