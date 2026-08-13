// Fuzz gate for the DLAB engine. Run with:  node src/pages/dlab/engine/engine.selftest.mjs
//
// Everything the tool promises about correctness is asserted here, across many
// randomly generated languages rather than one hand-picked example. A change
// that makes a single language nicer at the cost of a rare ambiguous item shows
// up here and nowhere else.

import { rollLanguage, paramVector } from './language.js';
import { buildRulesBrief } from './rulesBrief.js';
import { compose, ruleDepth } from './compose.js';
import { buildTest } from './buildTest.js';
import { validateItem, specSignature } from './validate.js';
import { gradeAnswer, normalizeAnswer } from './grade.js';
import { buildDistractors, distractorKey } from './examSim.js';
import { TIERS } from './questions.js';
import { mulberry32 } from './rng.js';
import { paramDistance, GRAMMAR_AXES } from './grammar.js';
import { spokenTextFor, stressedSegmentsFor } from './audioScript.js';

const LANGUAGES = Number(process.env.DLAB_SEEDS || 500);

// Item types that can only be delivered by ear.
const AUDIO_ONLY = ['stress', 'dictation', 'rootRecall', 'verbRootRecall', 'vocabReverse'];

// Every type the generator is supposed to be capable of producing. A type that
// silently stops appearing — because its measured depth can no longer reach the
// tier it is listed under, say — is a real regression that nothing else catches.
const EXPECTED_TYPES = [
  'vocab', 'vocabReverse', 'np', 'blank', 'sentence', 'transform',
  'stress', 'dictation', 'rootRecall', 'verbRootRecall', 'pictorial', 'composite',
];

let failures = 0;
const seen = { types: new Set(), tiers: new Set(), grammarValues: {} };

function fail(seed, what, detail) {
  failures += 1;
  if (failures <= 25) console.error(`  ✗ [seed ${seed}] ${what}: ${detail}`);
}

function assert(cond, seed, what, detail) {
  if (!cond) fail(seed, what, detail);
  return cond;
}

console.log(`DLAB engine selftest — ${LANGUAGES} languages\n`);

// ── 1. Language determinism ─────────────────────────────────────────────────
for (let seed = 1; seed <= 200; seed++) {
  const a = rollLanguage(seed);
  const b = rollLanguage(seed);
  assert(JSON.stringify(a.grammar) === JSON.stringify(b.grammar), seed, 'determinism', 'same seed gave two different grammars');
  assert(JSON.stringify(a.lex.nouns) === JSON.stringify(b.lex.nouns), seed, 'determinism', 'same seed gave two different lexicons');
}
console.log('1. language determinism ......... ok');

// ── 2. Lexical uniqueness ───────────────────────────────────────────────────
for (let seed = 1; seed <= LANGUAGES; seed++) {
  const lang = rollLanguage(seed);
  const forms = new Map();
  const add = (bag, kind) => {
    for (const [meaning, syl] of Object.entries(bag)) {
      const f = syl.map((s) => s.onset + s.nucleus + s.coda).join('');
      if (forms.has(f)) fail(seed, 'lexical collision', `"${f}" is both ${forms.get(f)} and ${kind}:${meaning}`);
      forms.set(f, `${kind}:${meaning}`);
    }
  };
  add(lang.lex.nouns, 'noun');
  add(lang.lex.verbs, 'verb');
  add(lang.lex.adjectives, 'adj');
  add(lang.lex.pronouns, 'pron');
  add(lang.lex.numerals, 'num');
  add(lang.lex.questionWords, 'q');
  add(lang.lex.prepositions, 'prep');
  for (const [id, m] of Object.entries(lang.lex.morphemes)) {
    const f = m.syllables.map((s) => s.onset + s.nucleus + s.coda).join('');
    if (forms.has(f)) fail(seed, 'lexical collision', `morpheme ${id} "${f}" collides with ${forms.get(f)}`);
    forms.set(f, `morpheme:${id}`);
  }
}
console.log('2. lexical uniqueness .......... ok');

// ── 3. Rules-brief coverage of every rule the composer can emit ─────────────
for (let seed = 1; seed <= LANGUAGES; seed++) {
  const lang = rollLanguage(seed);
  const brief = buildRulesBrief(lang);
  const specs = [
    { kind: 'np', np: { lex: 'dog', plural: true, definite: true, adjectives: ['big'], possessor: { lex: 'woman' } } },
    { kind: 'sentence', subject: { lex: 'dog', plural: true, adjectives: ['big'], definite: true }, verb: { lex: 'see', tense: 'past' }, object: { lex: 'cat', definite: true, possessor: { lex: 'woman' } }, negated: true, question: true },
    { kind: 'sentence', subject: { lex: 'child' }, verb: { lex: 'run', tense: 'future' } },
  ];
  for (const spec of specs) {
    const { trace } = compose(spec, lang);
    for (const t of trace) {
      if (!brief.ruleIds.includes(t.ruleId)) {
        fail(seed, 'coverage', `composer emitted rule "${t.ruleId}" with no section in the brief`);
      }
    }
  }
  for (const sec of brief.sections) {
    assert(sec.title && typeof sec.body === 'string', seed, 'brief', `section ${sec.ruleId} is missing title or body`);
  }
}
console.log('3. brief covers every rule ..... ok');

// ── 4. Full test build: every item valid, unique, correctly tiered ──────────
const depthByTier = { easy: [], medium: [], hard: [], extreme: [] };
let totalItems = 0;
let degraded = 0;

for (let seed = 1; seed <= LANGUAGES; seed++) {
  const test = buildTest({ seed, written: 12, audio: 18 });
  const briefRuleIds = test.brief.ruleIds;
  const sigs = new Set();

  assert(test.items.length === 30, seed, 'pool size', `expected 30 items, got ${test.items.length}`);
  degraded += test.report.degraded;

  for (const it of test.items) {
    totalItems += 1;
    seen.types.add(it.type);
    seen.tiers.add(it.tier);

    const v = validateItem(it, test.language, briefRuleIds);
    if (!v.ok) fail(seed, `item invalid (${v.failed})`, `${it.type} — ${v.reason}`);

    const sig = specSignature(it);
    if (sigs.has(sig)) fail(seed, 'cross-pool duplicate', `${it.type} appears twice`);
    sigs.add(sig);

    assert(it.answer && String(it.answer).trim() !== '', seed, 'empty answer', it.type);
    assert(it.prompt && it.prompt.trim() !== '', seed, 'empty prompt', it.type);
    assert(['written', 'audio'].includes(it.pool), seed, 'pool tag', `${it.type} has pool "${it.pool}"`);

    // An audio item must carry something to speak, or it cannot be delivered —
    // and it must carry SYLLABLE STRUCTURE, not just a flat string. Syllable
    // boundaries are not recoverable from spelling, and the audio layer needs
    // them both to respell for the TTS engine and to place audible stress.
    if (it.pool === 'audio' && AUDIO_ONLY.includes(it.type)) {
      assert(it.spoken && it.spoken.trim() !== '', seed, 'audio item has nothing to speak', it.type);
      assert(Array.isArray(it.spokenWords) && it.spokenWords.length > 0, seed, 'audio item has no syllable structure', it.type);
      assert(it.spokenWords.length === it.spoken.trim().split(/\s+/).length, seed, 'spokenWords does not match spoken', `${it.type}: "${it.spoken}"`);
      assert(spokenTextFor(it).trim() !== '', seed, 'respelling produced nothing', it.type);
      // A stress item that cannot produce prosody cannot be answered by ear.
      if (it.type === 'stress') {
        const segs = stressedSegmentsFor(it, test.language);
        assert(segs && segs.length >= 2, seed, 'stress item has no audible prosody', `"${it.spoken}"`);
      }
    }
    // A written-only item must never be routed to the audio pool, and vice versa.
    assert(!(it.pool === 'audio' && it.type === 'pictorial'), seed, 'modality', 'pictorial item landed in the audio pool');
    assert(!(it.pool === 'written' && AUDIO_ONLY.includes(it.type)), seed, 'modality', `${it.type} landed in the written pool`);

    // The grader must accept the item's own answer.
    const g = gradeAnswer(it, it.answer);
    assert(g.correct, seed, 'grader rejects its own answer', `${it.type}: "${it.answer}"`);

    if (typeof it.depth === 'number') depthByTier[it.tier]?.push(it.depth);
  }
}
console.log(`4. ${totalItems} items all valid ....... ok`);

// ── 5. Difficulty is monotonic ──────────────────────────────────────────────
const means = {};
for (const t of TIERS) {
  const a = depthByTier[t];
  means[t] = a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}
console.log(`   mean rule-depth  easy ${means.easy.toFixed(2)}  medium ${means.medium.toFixed(2)}  hard ${means.hard.toFixed(2)}  extreme ${means.extreme.toFixed(2)}`);
if (!(means.easy < means.medium && means.medium < means.hard && means.hard < means.extreme)) {
  failures += 1;
  console.error('  ✗ difficulty is not monotonic across tiers');
} else {
  console.log('5. difficulty monotonic ........ ok');
}
if (!(means.extreme >= 8)) {
  failures += 1;
  console.error(`  ✗ extreme tier averages ${means.extreme.toFixed(2)} simultaneous rules, expected at least 8`);
}

// ── 6. Grader rejects deliberately wrong answers ────────────────────────────
for (let seed = 1; seed <= 120; seed++) {
  const test = buildTest({ seed, written: 6, audio: 6 });
  for (const it of test.items) {
    if (it.type === 'stress' && /^\d+$/.test(it.answer)) continue;
    const wrong = `${it.answer}zzq`;
    assert(!gradeAnswer(it, wrong).correct, seed, 'grader too lenient', `accepted "${wrong}"`);
    assert(!gradeAnswer(it, '').correct, seed, 'grader too lenient', 'accepted an empty answer');
    // Case and spacing must never be the reason an answer fails.
    const noisy = `  ${it.answer.toUpperCase()}  `;
    if (!/[A-Z]/.test(it.answer)) {
      assert(gradeAnswer(it, noisy).correct, seed, 'grader too strict', `rejected "${noisy}"`);
    }
  }
}
console.log('6. grader strict and forgiving . ok');

// ── 7. Distractors are real, distinct, and include the answer ──────────────
for (let seed = 1; seed <= 120; seed++) {
  const test = buildTest({ seed, written: 8, audio: 8, mc: true });
  for (const it of test.items) {
    const { options, correctIndex } = it.choices;
    assert(correctIndex >= 0, seed, 'distractors', `${it.type}: correct answer missing from its own options`);
    // A two-syllable word admits exactly two stress placements, so a two-option
    // list there is exhaustive rather than short-changed. Everything else must
    // reach three.
    const floor = it.type === 'stress' ? 2 : 3;
    assert(options.length >= floor, seed, 'distractors', `${it.type}: only ${options.length} option(s)`);
    const key = distractorKey(it);
    const norm = options.map((o) => key(o.text));
    assert(new Set(norm).size === norm.length, seed, 'distractors', `${it.type}: duplicate options`);
    for (const o of options) {
      assert(o.text && o.text.trim() !== '', seed, 'distractors', `${it.type}: blank option`);
    }
  }
}
console.log('7. distractors well-formed ..... ok');

// ── 8. Anti-staleness filter genuinely separates consecutive sittings ───────
{
  const recent = [];
  let tooSimilar = 0;
  for (let i = 0; i < 60; i++) {
    const test = buildTest({ seed: 90000 + i * 7919, written: 2, audio: 2, recentVectors: recent });
    for (const prev of recent) {
      if (paramDistance(test.paramVector, prev) < 5) tooSimilar += 1;
    }
    recent.push(test.paramVector);
    if (recent.length > 20) recent.shift();
  }
  if (tooSimilar > 0) {
    failures += 1;
    console.error(`  ✗ anti-staleness: ${tooSimilar} sitting pairs differed on fewer than 5 of ${GRAMMAR_AXES.length} axes`);
  } else {
    console.log('8. anti-staleness holds ........ ok');
  }
}

// ── 9. Generator exercises the whole parameter space ───────────────────────
for (let seed = 1; seed <= LANGUAGES; seed++) {
  const g = rollLanguage(seed).grammar;
  for (const [axis, value] of Object.entries(g)) {
    (seen.grammarValues[axis] ||= new Set()).add(String(value));
  }
}
{
  const thin = Object.entries(seen.grammarValues).filter(([, s]) => s.size < 2);
  if (thin.length) {
    failures += 1;
    console.error(`  ✗ axes that never varied: ${thin.map(([a]) => a).join(', ')}`);
  } else {
    console.log(`9. all ${Object.keys(seen.grammarValues).length} grammar axes vary ... ok`);
  }
}
{
  const missing = EXPECTED_TYPES.filter((t) => !seen.types.has(t));
  if (missing.length) {
    failures += 1;
    console.error(`  ✗ item types that never generated: ${missing.join(', ')}`);
  } else {
    console.log(`10. all ${EXPECTED_TYPES.length} item types appear ... ok`);
  }
}
console.log(`   item types produced: ${[...seen.types].sort().join(', ')}`);
if (degraded > 0) console.log(`   note: ${degraded} item(s) across ${LANGUAGES} tests fell back to the easy generator`);

// ── result ──────────────────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.error(`FAILED — ${failures} problem(s)`);
  process.exit(1);
}
console.log('All checks passed.');
