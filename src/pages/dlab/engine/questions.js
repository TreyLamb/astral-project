// Item generation. Every item's answer is the composer's output for a spec —
// never a hand-written string — and every item carries the trace that produced
// it, so the answer key and the explanation are the same artifact.
//
// Tier is MEASURED, not declared. An item's tier comes from how many distinct
// grammatical decisions its trace actually contains (compose.ruleDepth), so a
// language whose plural happens to be unmarked cannot smuggle a trivial item
// into the hard section just because the template that built it was ambitious.
// Band edges were calibrated against the observed depth distribution across 300
// languages at ten complexity levels; see the monotonicity assertion in
// engine.selftest.mjs, which is what actually holds them honest.

import { compose, ruleDepth, renderStressed, traceRuleIds } from './compose.js';
import { glossSpec, transformLabel, hasDistinctPlural } from './gloss.js';
import { renderWord, renderWithStress, renderSyllabified, stressIndex } from './phonology.js';
import { pick, randInt, shuffle } from './rng.js';

export const TIERS = ['easy', 'medium', 'hard', 'extreme'];

export const TIER_BANDS = {
  easy: [0, 2],
  medium: [3, 5],
  hard: [6, 7],
  extreme: [8, Infinity],
};

export function tierForDepth(depth) {
  for (const t of TIERS) {
    const [lo, hi] = TIER_BANDS[t];
    if (depth >= lo && depth <= hi) return t;
  }
  return 'extreme';
}

// Nouns with a clean, unambiguous English plural. A prompt reading "Translate:
// the fish" cannot signal number, so the expected answer would be genuinely
// ambiguous — those nouns are simply never used in plural contexts.
const COUNTABLE = ['dog', 'cat', 'house', 'tree', 'stone', 'bird', 'man', 'woman', 'child', 'river', 'mountain', 'road', 'book', 'horse', 'door'].filter(hasDistinctPlural);

// Nouns SceneSvg can actually draw. Pictorial items are restricted to these.
export const DRAWABLE = ['tree', 'house', 'sun', 'moon', 'bird', 'fish', 'stone', 'fire'];

let itemCounter = 0;
function nextId(seed) {
  itemCounter += 1;
  return `${seed.toString(36)}-${itemCounter.toString(36)}`;
}

/** Reset per test build so item ids are stable for a given seed. */
export function resetItemIds() {
  itemCounter = 0;
}

function nounFor(lang, rng, { plural = false, drawable = false } = {}) {
  const pool = drawable ? DRAWABLE : plural ? COUNTABLE : Object.keys(lang.lex.nouns);
  return pick(pool, rng);
}

/**
 * Builds an NP spec at a requested feature load. Feature order is fixed so that
 * raising `features` only ever ADDS a decision — that monotonicity is what makes
 * the depth bands meaningful.
 */
function randomNP(lang, rng, features, { drawable = false } = {}) {
  const plural = features >= 1 && rng() < 0.75;
  const np = { lex: nounFor(lang, rng, { plural, drawable }), plural };
  if (features >= 2) np.adjectives = [pick(Object.keys(lang.lex.adjectives), rng)];
  if (features >= 3) np.definite = true;
  if (features >= 4) np.possessor = { lex: pick(['woman', 'man', 'child'], rng) };
  return np;
}

function randomSpec(lang, rng, level) {
  if (level <= 3) {
    return { kind: 'np', np: randomNP(lang, rng, level) };
  }
  const spec = {
    kind: 'sentence',
    subject: randomNP(lang, rng, Math.max(0, level - 5)),
    verb: { lex: pick(Object.keys(lang.lex.verbs), rng), tense: 'present' },
  };
  if (level >= 5) spec.object = randomNP(lang, rng, Math.max(0, level - 6));
  if (level >= 6) spec.verb.tense = pick(['past', 'future'], rng);
  if (level >= 7) spec.negated = true;
  if (level >= 8 && spec.object) spec.object.possessor = { lex: pick(['woman', 'man', 'child'], rng) };
  if (level >= 9) spec.question = true;
  return spec;
}

function item(fields) {
  return {
    alternates: [],
    scene: null,
    spoken: null,
    // Syllable structure of whatever `spoken` says, one entry per word.
    //
    // WHY this is carried rather than re-derived from `spoken`: a flat string
    // does not determine its own syllable boundaries. "ongoso" is both on-go-so
    // and o-ngo-so, and nothing in the string picks between them. The audio
    // layer needs the true boundaries to place audible stress — a stress item
    // whose emphasis lands on a syllable the generator never intended is asking
    // about something the test-taker did not hear. Keep the structure.
    spokenWords: null,
    assistable: fields.tier === 'hard' || fields.tier === 'extreme',
    ...fields,
  };
}

/** @param {import('./compose.js').Word[]} words */
function syllablesOf(words) {
  return words.map((w) => w.syllables);
}

// ── Item builders ───────────────────────────────────────────────────────────
// Each returns an item or null (null = this language cannot support this type,
// try another). None of them ever guesses an answer.

function buildVocab(lang, rng, seed) {
  const bag = pick(['nouns', 'verbs', 'adjectives', 'pronouns', 'numerals'], rng);
  const meaning = pick(Object.keys(lang.lex[bag]), rng);
  const answer = renderWord(lang.lex[bag][meaning]);
  const trace = [{ ruleId: 'vocabulary', label: 'Straight vocabulary recall', detail: `"${meaning}" = ${answer}` }];
  return item({
    id: nextId(seed),
    type: 'vocab',
    tier: 'easy',
    depth: 0,
    modality: 'either',
    prompt: `Write the word for "${meaning}".`,
    answer,
    spec: null,
    trace,
    ruleIds: ['vocabulary'],
  });
}

function buildVocabReverse(lang, rng, seed) {
  const bag = pick(['nouns', 'verbs', 'adjectives'], rng);
  const meaning = pick(Object.keys(lang.lex[bag]), rng);
  const form = renderWord(lang.lex[bag][meaning]);
  return item({
    id: nextId(seed),
    type: 'vocabReverse',
    tier: 'easy',
    depth: 0,
    modality: 'audio',
    prompt: 'You will hear one word. Write its English meaning.',
    spoken: form,
    spokenWords: [lang.lex[bag][meaning]],
    answer: meaning,
    spec: null,
    trace: [{ ruleId: 'vocabulary', label: 'Straight vocabulary recall, heard not seen', detail: `${form} = "${meaning}"` }],
    ruleIds: ['vocabulary'],
  });
}

function buildTranslation(lang, rng, seed, level, modality) {
  const spec = randomSpec(lang, rng, level);
  const r = compose(spec, lang);
  const depth = ruleDepth(r.trace);
  return item({
    id: nextId(seed),
    type: spec.kind === 'np' ? 'np' : 'sentence',
    tier: tierForDepth(depth),
    depth,
    modality,
    prompt: `Translate into the language: ${glossSpec(spec)}`,
    answer: r.surface,
    spec,
    composedSurface: r.surface,
    trace: r.trace,
    ruleIds: traceRuleIds(r.trace),
  });
}

function buildBlank(lang, rng, seed, level, modality) {
  const spec = randomSpec(lang, rng, Math.max(4, level));
  const r = compose(spec, lang);
  if (r.words.length < 2) return null;

  // Blank the head word of a constituent rather than a particle — recovering a
  // bare particle is a memory test, recovering an inflected head is a rule test.
  const candidates = r.words.map((w, i) => ({ w, i })).filter(({ w }) => w.gloss && !/^[A-Z]+$/.test(w.gloss));
  if (candidates.length === 0) return null;
  const chosen = pick(candidates, rng);

  const shown = r.words.map((w, i) => (i === chosen.i ? '_____' : renderWord(w.syllables))).join(' ');
  const depth = ruleDepth(r.trace);
  return item({
    id: nextId(seed),
    type: 'blank',
    tier: tierForDepth(depth),
    depth,
    modality,
    prompt: `This sentence means "${glossSpec(spec)}"\n\n    ${shown}\n\nWrite the missing word.`,
    answer: renderWord(chosen.w.syllables),
    spec,
    composedSurface: r.surface,
    trace: r.trace,
    ruleIds: traceRuleIds(r.trace),
  });
}

function buildTransform(lang, rng, seed, level, modality) {
  const base = randomSpec(lang, rng, Math.max(4, Math.min(level, 7)));
  if (base.kind !== 'sentence') return null;

  const options = [];
  if ((base.verb.tense || 'present') === 'present') options.push('tense');
  if (!base.negated) options.push('negate');
  if (!base.question) options.push('question');
  if (!base.subject.plural && hasDistinctPlural(base.subject.lex)) options.push('pluralize');
  if (options.length === 0) return null;

  const target = JSON.parse(JSON.stringify(base));
  switch (pick(options, rng)) {
    case 'tense': target.verb.tense = pick(['past', 'future'], rng); break;
    case 'negate': target.negated = true; break;
    case 'question': target.question = true; break;
    case 'pluralize': target.subject.plural = true; break;
    default: return null;
  }

  const from = compose(base, lang);
  const to = compose(target, lang);
  if (from.surface === to.surface) return null;

  const depth = ruleDepth(to.trace);
  return item({
    id: nextId(seed),
    type: 'transform',
    tier: tierForDepth(depth),
    depth,
    modality,
    prompt: `This sentence means "${glossSpec(base)}"\n\n    ${from.surface}\n\nRewrite it in ${transformLabel(base, target)}.`,
    answer: to.surface,
    spec: target,
    composedSurface: to.surface,
    trace: to.trace,
    ruleIds: traceRuleIds(to.trace),
  });
}

function buildStress(lang, rng, seed, level) {
  // Use an INFLECTED form where possible: stress is derived from syllable count,
  // so affixation can move it. A test-taker who memorised the root's stress and
  // did not re-derive it gets this wrong, which is exactly the discrimination
  // the real exam's stress sections are after.
  const spec = { kind: 'np', np: randomNP(lang, rng, level >= 6 ? 2 : 1) };
  const r = compose(spec, lang);
  // Longest word available, not merely the first eligible one: a two-syllable
  // word admits only two stress placements, which makes the item close to a
  // coin flip once the assist toggle is on. More syllables, more discrimination.
  const target = r.words
    .filter((w) => w.syllables.length >= 2)
    .sort((a, b) => b.syllables.length - a.syllables.length)[0];
  if (!target) return null;

  const idx = stressIndex(target.syllables, lang.phon);
  const form = renderWord(target.syllables);
  const askNumber = rng() < 0.5;
  const depth = Math.max(1, ruleDepth(r.trace));

  const trace = [
    ...r.trace,
    {
      ruleId: 'stress',
      label: `Stress is ${lang.phon.stressRule === 'heavy' ? 'on the last heavy syllable' : `${lang.phon.stressRule}`}`,
      detail: `${renderSyllabified(target.syllables)} has ${target.syllables.length} syllables → stress falls on syllable ${idx + 1} (${renderWithStress(target.syllables, lang.phon)})`,
    },
  ];

  return item({
    id: nextId(seed),
    type: 'stress',
    tier: tierForDepth(depth + 1),
    depth: depth + 1,
    modality: 'audio',
    prompt: askNumber
      ? 'You will hear one word. Write the NUMBER of the syllable that carries the main stress (1 for the first syllable, 2 for the second, and so on).'
      : 'You will hear one word. Write it back with its syllables separated by hyphens and the stressed syllable in CAPITAL LETTERS.',
    spoken: form,
    spokenWords: [target.syllables],
    answer: askNumber ? String(idx + 1) : renderWithStress(target.syllables, lang.phon),
    alternates: askNumber ? [] : [renderWithStress(target.syllables, lang.phon).replace(/-/g, ' ')],
    spec,
    composedSurface: r.surface,
    trace,
    ruleIds: [...traceRuleIds(r.trace), 'stress'],
  });
}

function buildDictation(lang, rng, seed, level) {
  const spec = randomSpec(lang, rng, Math.max(5, level));
  const r = compose(spec, lang);
  const depth = ruleDepth(r.trace);
  return item({
    id: nextId(seed),
    type: 'dictation',
    tier: tierForDepth(depth),
    depth,
    modality: 'audio',
    prompt: 'You will hear one sentence. Write down exactly what you hear.',
    spoken: r.surface,
    spokenWords: syllablesOf(r.words),
    answer: r.surface,
    spec,
    composedSurface: r.surface,
    trace: [
      ...r.trace,
      { ruleId: 'stress', label: 'Heard form', detail: renderStressed(r.words, lang) },
    ],
    ruleIds: [...traceRuleIds(r.trace), 'stress'],
  });
}

// Strip the morphology off a heard noun. A single noun phrase can only ever
// carry so many decisions, so this tops out in the medium band no matter how it
// is dressed up — it is listed in the tier it actually reaches, not the tier it
// looks like it ought to reach.
function buildRootRecall(lang, rng, seed, level) {
  const lex = nounFor(lang, rng, { plural: true });
  const np = { lex, plural: true };
  if (level >= 5) np.definite = true;
  const spec = { kind: 'np', np };
  const r = compose(spec, lang);
  if (r.words.length !== 1) return null;

  const inflected = r.surface;
  const bare = renderWord(lang.lex.nouns[lex]);
  if (inflected === bare) return null;

  const depth = Math.max(2, ruleDepth(r.trace) + 1);
  return item({
    id: nextId(seed),
    type: 'rootRecall',
    tier: tierForDepth(depth),
    depth,
    modality: 'audio',
    prompt: np.definite
      ? 'You will hear a word carrying more than one ending. Write the plain dictionary form of that word — singular, with nothing added.'
      : 'You will hear a word in its plural form. Write the plain singular form of that word.',
    spoken: inflected,
    spokenWords: syllablesOf(r.words),
    answer: bare,
    spec,
    composedSurface: r.surface,
    trace: [
      ...r.trace,
      { ruleId: 'plural', label: 'Working backwards', detail: `${inflected} → remove the endings → ${bare}` },
    ],
    ruleIds: traceRuleIds(r.trace),
  });
}

// The hard-tier counterpart: the morphology to strip sits inside a whole
// sentence, so the trace is the sentence's trace and the depth rises with it.
// Answering means parsing everything heard, then isolating one stem.
function buildVerbRootRecall(lang, rng, seed, level) {
  const spec = randomSpec(lang, rng, Math.max(6, level));
  if (spec.kind !== 'sentence') return null;
  const r = compose(spec, lang);

  const bare = renderWord(lang.lex.verbs[spec.verb.lex]);
  // Only worth asking when the verb actually surfaced changed — otherwise the
  // answer is just a word that was said aloud, which tests nothing.
  if (r.surface.split(' ').includes(bare)) return null;

  const depth = ruleDepth(r.trace);
  return item({
    id: nextId(seed),
    type: 'verbRootRecall',
    tier: tierForDepth(depth),
    depth,
    modality: 'audio',
    prompt: 'You will hear one sentence. Write the plain dictionary form of its VERB — no tense, no negation, no endings of any kind.',
    spoken: r.surface,
    spokenWords: syllablesOf(r.words),
    answer: bare,
    spec,
    composedSurface: r.surface,
    trace: [
      ...r.trace,
      { ruleId: 'vocabulary', label: 'Then isolate the verb stem', detail: `strip every ending back off → ${bare} ("${spec.verb.lex}")` },
    ],
    ruleIds: [...traceRuleIds(r.trace), 'vocabulary'],
  });
}

function buildPictorial(lang, rng, seed, level) {
  const count = rng() < 0.55 ? 3 : 1;
  const noun = nounFor(lang, rng, { plural: count > 1, drawable: true });
  if (count > 1 && !hasDistinctPlural(noun)) return null;

  const size = rng() < 0.7 ? pick(['big', 'small'], rng) : null;
  const red = !size || rng() < 0.4;

  const np = { lex: noun, plural: count > 1 };
  const adjectives = [];
  if (size) adjectives.push(size);
  else if (red) adjectives.push('red');
  if (adjectives.length) np.adjectives = adjectives;
  if (level >= 6) np.definite = true;

  const spec = { kind: 'np', np };
  const r = compose(spec, lang);
  const depth = ruleDepth(r.trace);

  return item({
    id: nextId(seed),
    type: 'pictorial',
    tier: tierForDepth(depth),
    depth,
    modality: 'written',
    prompt: 'Write what this picture shows, in the language.',
    answer: r.surface,
    spec,
    composedSurface: r.surface,
    trace: r.trace,
    ruleIds: traceRuleIds(r.trace),
    scene: { noun, count, size, color: adjectives.includes('red') ? 'red' : null, definite: !!np.definite },
  });
}

function buildComposite(lang, rng, seed, modality) {
  const spec = randomSpec(lang, rng, 9);
  const r = compose(spec, lang);
  const depth = ruleDepth(r.trace);

  // The extreme tier layers a phonological condition on top of the morphology:
  // produce the sentence AND mark where stress lands on one of its words. That
  // forces the stress rule to be re-derived against the inflected form the
  // test-taker has just built, rather than recalled from the dictionary form.
  const targets = r.words.filter((w) => w.syllables.length >= 2);
  const withStress = targets.length > 0 && rng() < 0.6;

  if (!withStress) {
    return item({
      id: nextId(seed),
      type: 'composite',
      tier: tierForDepth(depth),
      depth,
      modality,
      prompt: `Translate into the language: ${glossSpec(spec)}`,
      answer: r.surface,
      spec,
      composedSurface: r.surface,
      trace: r.trace,
      ruleIds: traceRuleIds(r.trace),
    });
  }

  const target = targets[targets.length - 1];
  const idx = stressIndex(target.syllables, lang.phon);
  const answer = r.words
    .map((w) => (w === target ? renderWithStress(w.syllables, lang.phon) : renderWord(w.syllables)))
    .join(' ');

  return item({
    id: nextId(seed),
    type: 'composite',
    tier: 'extreme',
    depth: depth + 1,
    modality,
    prompt: `Translate into the language: ${glossSpec(spec)}\n\nThen write the LAST word of your answer with its syllables hyphenated and its stressed syllable in CAPITAL LETTERS. Leave every other word as normal.`,
    answer,
    alternates: [r.surface],
    spec,
    composedSurface: r.surface,
    trace: [
      ...r.trace,
      {
        ruleId: 'stress',
        label: 'Then re-derive stress on the finished word',
        detail: `${renderSyllabified(target.syllables)} has ${target.syllables.length} syllables → stress on syllable ${idx + 1} → ${renderWithStress(target.syllables, lang.phon)}`,
      },
    ],
    ruleIds: [...traceRuleIds(r.trace), 'stress'],
  });
}

// ── Tier-targeted generation ────────────────────────────────────────────────

const WRITTEN_TYPES = {
  easy: ['vocab', 'np', 'np', 'blank'],
  medium: ['sentence', 'blank', 'transform', 'sentence'],
  hard: ['sentence', 'transform', 'pictorial', 'blank'],
  extreme: ['composite', 'composite', 'sentence'],
};

const AUDIO_TYPES = {
  easy: ['vocab', 'vocabReverse', 'np', 'stress'],
  medium: ['sentence', 'stress', 'transform', 'blank', 'rootRecall'],
  hard: ['dictation', 'stress', 'verbRootRecall', 'transform', 'sentence'],
  extreme: ['composite', 'dictation', 'composite'],
};

const LEVEL_FOR_TIER = { easy: [1, 2, 3], medium: [4, 5, 6], hard: [6, 7, 8], extreme: [8, 9, 9] };

function buildOfType(type, lang, rng, seed, level, modality) {
  switch (type) {
    case 'vocab': return buildVocab(lang, rng, seed);
    case 'vocabReverse': return buildVocabReverse(lang, rng, seed);
    case 'np': case 'sentence': return buildTranslation(lang, rng, seed, level, modality);
    case 'blank': return buildBlank(lang, rng, seed, level, modality);
    case 'transform': return buildTransform(lang, rng, seed, level, modality);
    case 'stress': return buildStress(lang, rng, seed, level);
    case 'dictation': return buildDictation(lang, rng, seed, level);
    case 'rootRecall': return buildRootRecall(lang, rng, seed, level);
    case 'verbRootRecall': return buildVerbRootRecall(lang, rng, seed, level);
    case 'pictorial': return buildPictorial(lang, rng, seed, level);
    case 'composite': return buildComposite(lang, rng, seed, modality);
    default: return null;
  }
}

/**
 * Generates one item at the requested tier and modality.
 *
 * Measured tier is authoritative: a candidate whose trace lands in a different
 * band than requested is retried. After `maxTries` the closest candidate is
 * accepted and RELABELLED to its measured tier — a language whose grammar
 * genuinely cannot produce a depth-8 item should not have one invented for it,
 * and the selftest's monotonicity check is what guarantees the sections still
 * get harder as they go.
 *
 * @returns {object|null}
 */
export function generateItem(lang, rng, seed, tier, modality, maxTries = 24) {
  const table = modality === 'audio' ? AUDIO_TYPES : WRITTEN_TYPES;
  let best = null;
  let bestGap = Infinity;
  const [lo, hi] = TIER_BANDS[tier];

  for (let i = 0; i < maxTries; i++) {
    const type = pick(table[tier], rng);
    const level = pick(LEVEL_FOR_TIER[tier], rng);
    const candidate = buildOfType(type, lang, rng, seed, level, modality);
    if (!candidate) continue;
    if (!candidate.answer || candidate.answer.trim() === '') continue;

    if (candidate.depth >= lo && candidate.depth <= hi) {
      candidate.tier = tier;
      return candidate;
    }
    const gap = candidate.depth < lo ? lo - candidate.depth : candidate.depth - hi;
    if (gap < bestGap) {
      bestGap = gap;
      best = candidate;
    }
  }

  if (best) best.tier = tierForDepth(best.depth);
  return best;
}

/** Per-tier counts for a pool of `n` items: 33 / 33 / 17 / 17, remainder to easy. */
export function tierCounts(n) {
  if (n <= 0) return { easy: 0, medium: 0, hard: 0, extreme: 0 };
  const medium = Math.round(n * 0.333);
  const hard = Math.round(n * 0.167);
  const extreme = Math.round(n * 0.167);
  const easy = n - medium - hard - extreme;
  return { easy: Math.max(0, easy), medium, hard, extreme };
}

export { shuffle, randInt };
