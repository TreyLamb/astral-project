#!/usr/bin/env node
/**
 * Reading Comprehension content lint.
 *
 * `registerPassages()` validates SHAPE - five choices, a band in range, a correctIndex that
 * exists. Everything below is a defect it cannot see, and every one of them ships a question
 * that is well-formed and wrong:
 *
 *   1. A line reference that points at the wrong line. "As used in line 14, 'redundancy'..."
 *      is unanswerable if line 14 does not contain the word `redundancy`. This is THE defect
 *      class for authored RC and nothing caught it before - the renderer numbers by splitting
 *      on '\n', so the author is counting array entries by hand, blank spacer lines included.
 *   2. A declared wordCount that disagrees with the passage.
 *   3. Answer-position bias. 100 passages x ~6 questions is 600 hand-placed correct answers,
 *      and a human (or a model) placing them one at a time does not produce a flat distribution.
 *      The folder CLAUDE.md already records this exact failure on Block Counting, where C came
 *      up 38% more often than chance and handed back the guess-the-letter reflex.
 *   4. A type spread too narrow to keep a sheet-mode drill on one passage - engine/passage.js
 *      falls back to a different passage when the sheet's own passage has no question of the
 *      needed type, and the fallback is a safety net, not the intended path.
 *   5. A "why" that does not explain, or a choice set with a giveaway length tell (the correct
 *      answer being reliably the longest option is the oldest test-taking hack there is).
 *
 * Exit code is non-zero on any ERROR. Warnings print but do not fail, because a couple of them
 * are judgement calls that a human should read rather than a script should block.
 *
 *   node scripts/afoqtRcLint.mjs
 *   node scripts/afoqtRcLint.mjs --verbose
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { allPassages } from '../src/pages/theknowledgebase/afoqt/engine/passage.js';

const VERBOSE = process.argv.includes('--verbose');

// `--file=<path>` lints ONE passage file on its own, without it being wired into
// templates/index.js yet. This is how a batch is checked while it is being authored: ten agents
// writing ten files must not all be editing the shared index to make their work visible, and a
// bank-wide length-tell percentage is meaningless to an author who only owns six of a hundred
// passages. Integration into index.js happens once, afterwards, and then the whole bank is
// linted together.
const fileArg = process.argv.find((a) => a.startsWith('--file='))?.slice('--file='.length);
if (fileArg) {
  await import(pathToFileURL(path.resolve(fileArg)).href);
} else {
  await import('../src/pages/theknowledgebase/afoqt/templates/index.js');
}
const errors = [];
const warns = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warns.push(`${id}: ${msg}`);

const TYPES = ['main-idea', 'vocabulary-in-context', 'detail-inference', 'function-of-paragraph', 'author-agreement'];

/** Words the stem quotes, in the order a line reference would name them. */
const QUOTED = /["“”']([^"“”']{2,60})["“”']/g;
/** "line 14", "lines 14-16", "line 14 and line 22". */
const LINE_REF = /\blines?\s+(\d+)(?:\s*[-–—]\s*(\d+))?/gi;

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;

const passages = allPassages();
if (passages.length === 0) {
  console.error('No passages registered - did templates/index.js stop importing templates/rc?');
  process.exit(1);
}

const seenIds = new Set();
const byBand = {};
const typeTotals = {};
const posTotals = [0, 0, 0, 0, 0];
let questionTotal = 0;
let longestCorrect = 0;

for (const p of passages) {
  if (seenIds.has(p.id)) err(p.id, 'duplicate passage id');
  seenIds.add(p.id);
  byBand[p.band] = (byBand[p.band] ?? 0) + 1;

  // Lines are 1-INDEXED and include blank spacer entries, because that is exactly what
  // render/PassageView.jsx numbers when it splits the joined text on '\n'.
  const lines = p.text.split('\n');
  const realWords = wordCount(p.text);

  if (Math.abs(realWords - p.wordCount) > 25) {
    err(p.id, `declared wordCount ${p.wordCount} but the text has ${realWords} words`);
  }
  if (realWords < 400 || realWords > 600) {
    err(p.id, `real word count ${realWords} is outside the 400-600 contract`);
  }
  if (lines.some((l) => wordCount(l) > 22)) {
    warn(p.id, 'a line is over 22 words - long lines make a "line N" reference hard to eyeball');
  }

  const types = new Set();
  for (let qi = 0; qi < p.questions.length; qi++) {
    const q = p.questions[qi];
    const tag = `${p.id} q${qi + 1}`;
    questionTotal++;
    types.add(q.type);
    typeTotals[q.type] = (typeTotals[q.type] ?? 0) + 1;
    posTotals[q.correctIndex]++;

    // --- 1. LINE REFERENCES ------------------------------------------------------------------
    // The stem names a line; the quoted term must actually appear on it. A vocabulary-in-context
    // item is the usual carrier, but a detail question can cite a line too.
    const refs = [...q.stem.matchAll(LINE_REF)];
    const quotes = [...q.stem.matchAll(QUOTED)].map((m) => m[1]);
    for (const r of refs) {
      const from = Number(r[1]);
      const to = r[2] ? Number(r[2]) : from;
      if (from < 1 || to > lines.length) {
        err(tag, `cites line ${from}${r[2] ? `-${to}` : ''} but the passage has ${lines.length} lines`);
        continue;
      }
      const span = norm(lines.slice(from - 1, to).join(' '));
      if (!span) {
        err(tag, `cites line ${from}${r[2] ? `-${to}` : ''}, which is BLANK (a paragraph spacer counts as a numbered line)`);
        continue;
      }
      for (const quoted of quotes) {
        const needle = norm(quoted);
        if (!needle) continue;
        // Match the quoted term, or its stem, so "sustainment"/"sustained" style inflections pass.
        const root = needle.length > 6 ? needle.slice(0, needle.length - 2) : needle;
        if (!span.includes(needle) && !span.includes(root)) {
          err(tag, `quotes "${quoted}" at line ${from}${r[2] ? `-${to}` : ''}, but that line reads: "${lines.slice(from - 1, to).join(' ').trim().slice(0, 80)}"`);
        }
      }
    }
    if (q.type === 'vocabulary-in-context' && refs.length === 0) {
      warn(tag, 'vocabulary-in-context with no line reference - the real subtest always cites one');
    }

    // --- 2. CHOICE HYGIENE -------------------------------------------------------------------
    const correct = q.choices[q.correctIndex];
    const others = q.choices.filter((_, i) => i !== q.correctIndex);
    if (others.every((o) => correct.length > o.length * 1.35)) {
      longestCorrect++;
      warn(tag, 'the correct answer is far longer than every distractor - a length tell');
    }
    for (const c of q.choices) {
      if (!c || !c.trim()) err(tag, 'an empty choice');
      if (/\b(all|none) of the above\b/i.test(c)) err(tag, '"all/none of the above" is not an AFOQT option form');
    }

    // --- 3. EXPLANATIONS ---------------------------------------------------------------------
    if (wordCount(q.why) < 12) {
      warn(tag, `"why" is only ${wordCount(q.why)} words - it should say what in the passage settles it`);
    }
    if (norm(q.why) === norm(correct)) err(tag, '"why" just restates the correct choice');

    // --- 4. THE ANSWER MUST BE FINDABLE ------------------------------------------------------
    // Not provable in general, but a main-idea or detail answer that shares NO content word with
    // the passage is almost always an authoring slip.
    if (q.type === 'detail-inference' || q.type === 'main-idea') {
      const body = norm(p.text);
      const content = norm(correct).split(' ').filter((w) => w.length > 5);
      if (content.length >= 3 && !content.some((w) => body.includes(w.slice(0, w.length - 1)))) {
        warn(tag, 'the correct answer shares no substantial word with the passage');
      }
    }
  }

  if (p.questions.length < 5) {
    err(p.id, `${p.questions.length} questions - a passage must carry at least 5 so a sheet-mode run can stay on it`);
  }
  if (types.size < 3) {
    err(p.id, `only ${types.size} question type(s) (${[...types].join(', ')}) - needs at least 3 so a shared sheet can serve different concepts`);
  }
}

// --- 5. ANSWER-POSITION BIAS, ACROSS THE WHOLE BANK -----------------------------------------
// Chi-square against uniform at 4 degrees of freedom. 9.488 is p=0.05, 13.277 is p=0.01.
// Warn at 0.05 and fail at 0.01: some wobble is honest randomness, a strong skew is a pattern a
// test-taker can exploit and it must be corrected by MOVING answers, never by rewriting them.
const expected = questionTotal / 5;
const chi = posTotals.reduce((acc, n) => acc + ((n - expected) ** 2) / expected, 0);
const pct = posTotals.map((n) => ((n / questionTotal) * 100).toFixed(1) + '%');

console.log(`\nRC bank: ${passages.length} passages, ${questionTotal} questions`);
console.log(`  by band:   ${Object.keys(byBand).sort().map((b) => `band ${b}: ${byBand[b]}`).join('   ')}`);
console.log(`  by type:   ${TYPES.map((t) => `${t} ${typeTotals[t] ?? 0}`).join('   ')}`);
console.log(`  answer pos A-E: ${posTotals.join(' / ')}  (${pct.join(' ')})  chi2=${chi.toFixed(2)}`);

for (const t of TYPES) {
  if ((typeTotals[t] ?? 0) === 0) err('bank', `no questions at all of type ${t}`);
}
// The AUTHORED position is deliberately NOT an error, and this is worth stating so nobody
// "fixes" it twice. passageTemplates() runs every slate through h.choices(), which shuffles, so
// the on-screen position is a function of the seed and the stored correctIndex never reaches a
// candidate's eyes. The stored skew is real (the first 24 passages sit at 83% B) and completely
// harmless. It is printed only as a tripwire: if the engine ever stops shuffling, this line is
// how you find out, and a bank sitting at chi2=392 would instantly become a guess-B exploit.
if (chi > 13.277) {
  console.log(`  note:      stored answer slots are skewed (chi2=${chi.toFixed(2)}), which is HARMLESS - passageTemplates() shuffles every slate through h.choices(). Only a concern if that ever changes.`);
}

// The length tell, by contrast, SURVIVES the shuffle and is the real defect. If the correct
// answer is reliably the longest option, "pick the longest" scores on our bank and teaches a
// reflex that scores nothing on the real test - which is worse than not practising at all.
const tellPct = (longestCorrect / questionTotal) * 100;
if (tellPct > 40) {
  err('bank', `${longestCorrect} of ${questionTotal} questions (${tellPct.toFixed(0)}%) have a LENGTH TELL - the correct answer is far longer than every distractor. This survives the choice shuffle: a candidate who picks the longest option scores ${tellPct.toFixed(0)}% without reading. Write distractors as long and as specific as the answer.`);
} else if (tellPct > 20) {
  warn('bank', `${longestCorrect} of ${questionTotal} questions (${tellPct.toFixed(0)}%) have a length tell - the correct answer is much longer than every distractor.`);
}

// Depth, the number that made this work necessary in the first place.
const runs = (questionTotal / 25).toFixed(1);
console.log(`  depth:     ${runs} full 25-question sittings before the bank repeats`);
const testLevel = passages.filter((p) => p.band >= 3);
const testLevelQs = testLevel.reduce((n, p) => n + p.questions.length, 0);
console.log(`  at test level (band 3+): ${testLevel.length} passages, ${testLevelQs} questions, ${(testLevelQs / 25).toFixed(1)} sittings\n`);

if (VERBOSE || warns.length) {
  console.log(`${warns.length} warning(s)`);
  for (const w of warns) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log(`\n${errors.length} ERROR(s)`);
  for (const e of errors) console.log(`  x ${e}`);
  process.exit(1);
}
console.log('RC lint clean.');
