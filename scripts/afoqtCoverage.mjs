// npm run afoqt:coverage
//
// Doctrine rule 2, made checkable. Trey's words:
//
//   "If there's a biology question about how many chromosomes do humans have and your chapter
//    intro asks what is an organelle? and nowhere else are organelles ever discussed - that is
//    an unrelated question."
//
// The check runs BOTH directions and fails the run if either breaks:
//
//   1. NO ORPHAN LESSON CONTENT - every concept a chapter declares must be tested by at least
//      one template. If nothing tests it, it should not be taught.
//   2. NO UNTAUGHT QUESTION - every concept a template declares must appear in some chapter.
//      A question must never test something the curriculum never presented.
//
// The elegant part is that this makes "overprepare intelligently" self-policing rather than a
// judgement call: if an edge case is worth teaching, the rule forces you to write the question
// that tests it, and if it is not worth a question it does not belong in the lesson. Breadth
// is encouraged - it just has to be paid for in questions.

import '../src/pages/theknowledgebase/afoqt/templates/index.js';
import { allTemplates } from '../src/pages/theknowledgebase/afoqt/engine/generator.js';
import { CHAPTERS, TRACKS, TOTAL_LESSON_MINUTES } from '../src/pages/theknowledgebase/afoqt/curriculum/chapters.js';
import { SUBTESTS, secPerQuestion, compositeReach } from '../src/pages/theknowledgebase/afoqt/engine/afoqtSpec.js';

const templates = allTemplates();

// concept -> templates that test it
const tested = new Map();
for (const t of templates) {
  for (const c of t.concepts ?? []) {
    if (!tested.has(c)) tested.set(c, []);
    tested.get(c).push(t);
  }
}

// concept -> chapters that teach it
const taught = new Map();
for (const ch of CHAPTERS) {
  for (const c of ch.concepts) {
    if (!taught.has(c)) taught.set(c, []);
    taught.get(c).push(ch);
  }
}

const orphanConcepts = [];   // taught, never tested
const untaughtConcepts = []; // tested, never taught
const duplicated = [];       // claimed by more than one chapter

for (const [c, chs] of taught) {
  if (!tested.has(c)) orphanConcepts.push({ concept: c, chapters: chs.map((x) => x.id) });
  if (chs.length > 1) duplicated.push({ concept: c, chapters: chs.map((x) => x.id) });
}
for (const [c, ts] of tested) {
  if (!taught.has(c)) untaughtConcepts.push({ concept: c, templates: ts.map((x) => x.id) });
}

// A chapter with concepts but no templates at any of its declared bands cannot run a drill,
// which makes the lesson unreachable in practice even if every concept is technically tested.
const undrillable = [];
for (const ch of CHAPTERS) {
  const pool = templates.filter((t) => ch.concepts.some((c) => (t.concepts ?? []).includes(c)));
  if (pool.length === 0) { undrillable.push({ chapter: ch.id, reason: 'no templates at all' }); continue; }
  // ⚠ Counts TEMPLATES, which is only a reachability check - it is NOT a statement about whether
  // a gate repeats. This used to demand >= 5 and reported nine chapters as broken for many
  // sessions; that was wrong in both directions. One Situational Judgment template holds ~30
  // scenarios and deals five distinct questions perfectly well, while `rc-02-main-idea` had
  // three templates, passed this check, and genuinely returned 2 distinct questions for 5 on
  // every seed. Whether a gate actually repeats is measured against real generated drills in
  // afoqt/engine/__tests__/drillDedup.test.js - do not re-add a template-count threshold here.
  const inBand = pool.filter((t) => ch.bands.includes(t.band));
  if (inBand.length === 0) {
    undrillable.push({ chapter: ch.id, reason: `no templates inside its declared bands [${ch.bands.join(', ')}]` });
  }
}

// Prereq graph sanity: no dangling ids, no cycles.
const ids = new Set(CHAPTERS.map((c) => c.id));
const badPrereqs = [];
for (const ch of CHAPTERS) {
  for (const p of ch.prereqs ?? []) if (!ids.has(p)) badPrereqs.push(`${ch.id} -> ${p}`);
}
const cycles = [];
for (const ch of CHAPTERS) {
  const seen = new Set();
  const walk = (id, path) => {
    if (path.includes(id)) { cycles.push([...path, id].join(' -> ')); return; }
    if (seen.has(id)) return;
    seen.add(id);
    for (const p of CHAPTERS.find((c) => c.id === id)?.prereqs ?? []) walk(p, [...path, id]);
  };
  walk(ch.id, []);
}

// --- report ---------------------------------------------------------------

console.log('AFOQT curriculum coverage\n');
for (const track of TRACKS) {
  const chs = CHAPTERS.filter((c) => c.track === track.id);
  const spec = SUBTESTS.find((s) => s.code === track.subtest);
  console.log(`${track.name} (${track.subtest})  -  ${chs.length} chapters, ${chs.reduce((n, c) => n + c.minutes, 0)} min of lessons`);
  if (spec) {
    console.log(`  real test: ${spec.questions} questions in ${spec.minutes} min (${secPerQuestion(spec).toFixed(1)}s each), feeds ${compositeReach(spec.code).join(' ') || 'no composite'}`);
  }
  for (const ch of chs.sort((a, b) => a.order - b.order)) {
    const pool = templates.filter((t) => ch.concepts.some((c) => (t.concepts ?? []).includes(c)));
    const bands = [...new Set(pool.map((t) => t.band))].sort();
    console.log(`  ${String(ch.order).padStart(2)}. ${ch.title.padEnd(46)} ${String(ch.concepts.length).padStart(2)} concepts  ${String(pool.length).padStart(2)} templates  bands ${bands.join('/') || '-'}`);
  }
  console.log('');
}

const subtestsWithChapters = new Set(CHAPTERS.map((c) => c.subtest));
const pending = SUBTESTS.filter((s) => s.studyable && !subtestsWithChapters.has(s.code));
console.log(`${CHAPTERS.length} chapters, ${TOTAL_LESSON_MINUTES} lesson-minutes, ${templates.length} templates, ${taught.size} concepts`);
if (pending.length) {
  console.log(`no curriculum yet (later phases): ${pending.map((s) => s.code).join(' ')}`);
}

let failed = false;
const fail = (title, rows, fmt) => {
  if (!rows.length) return;
  failed = true;
  console.log(`\nFAIL - ${title}`);
  for (const r of rows) console.log('  ' + fmt(r));
};

fail('orphan lesson content: taught but nothing tests it', orphanConcepts,
  (r) => `${r.concept}  (taught in ${r.chapters.join(', ')})  -> write a template, or drop it from the lesson`);
fail('untaught questions: tested but no chapter teaches it', untaughtConcepts,
  (r) => `${r.concept}  (tested by ${r.templates.join(', ')})  -> add it to a chapter's concepts`);
fail('a concept is claimed by more than one chapter', duplicated,
  (r) => `${r.concept}  (${r.chapters.join(', ')})  -> one chapter owns a concept`);
fail('chapter cannot fill a drill', undrillable, (r) => `${r.chapter}: ${r.reason}`);
fail('prerequisite does not exist', badPrereqs, (r) => r);
fail('prerequisite cycle', [...new Set(cycles)], (r) => r);

if (failed) process.exit(1);
console.log('\ncoverage holds in both directions');
