// Copies the GOOD ASVAB questions into a separate AFOQT bank.
//
// ⚠️ READ-ONLY on the ASVAB side. asvabQuestions.json is never written. Trey's rule: the
// ASVAB review material stays untouched and we clean the COPY instead. Junk questions are
// excluded from the copy, not retired from the deck.
//
//   node scripts/migrateAsvabToAfoqt.mjs            report only
//   node scripts/migrateAsvabToAfoqt.mjs --write    write afoqt/data/migratedAsvab.json

import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'src/pages/theknowledgebase/asvabQuestions.json';
const OUT = 'src/pages/theknowledgebase/afoqt/data/migratedAsvab.json';
const WRITE = process.argv.includes('--write');

// Which ASVAB subtopics have an AFOQT counterpart. Mechanical Comprehension, Electronics,
// Auto & Shop and Biology are NOT on Form T at all - they stay ASVAB-only.
const SUBTEST_OF = {
  'subtopic-word-knowledge': 'WK',
  'subtopic-paragraph-comprehension': 'RC',
  'subtopic-arithmetic-reasoning': 'AR',
  'subtopic-mathematics-knowledge': 'MK',
  'subtopic-physical-science': 'PS',
  // Earth & Space is mostly NOT AFOQT Physical Science (no earth science on Form T);
  // only the astronomy slice crosses over, so it is filtered by keyword below.
  'subtopic-earth-space-science': 'PS_ASTRO_ONLY',
};

// The 258 supplemental imports are the pollution that made Trey stop using the tool.
const isJunkSource = (q) => q.source !== 'import' || /supplemental/i.test(q.sourceNote ?? '');

// Form T Physical Science covers astronomy but no earth science / geology / meteorology.
const ASTRO = /\b(planet|solar|moon|lunar|eclipse|star|galaxy|orbit|comet|asteroid|sun|astronom|universe|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|meteor)\b/i;

// Many stems carry their options inline as "\n(A) x  (B) y ...". Split them back out so the
// copy has real choices instead of a wall of text baked into the question.
function splitChoices(text) {
  const nl = text.indexOf('\n');
  if (nl === -1) return { stem: text.trim(), choices: null };
  const stem = text.slice(0, nl).trim();
  const tail = text.slice(nl + 1);
  const parts = [...tail.matchAll(/\(([A-E])\)\s*([^(]+)/g)].map((m) => ({ label: m[1], text: m[2].trim() }));
  if (parts.length < 2) return { stem: text.replace(/\n/g, ' ').trim(), choices: null };
  return { stem, choices: parts };
}

const all = JSON.parse(readFileSync(SRC, 'utf8'));
const stats = { total: all.length, junk: 0, noSubtest: 0, wrongTopic: 0, kept: 0, withChoices: 0 };
const out = [];
const seen = new Set();

for (const q of all) {
  if (isJunkSource(q)) { stats.junk++; continue; }
  const mapped = SUBTEST_OF[q.subtopicId];
  if (!mapped) { stats.noSubtest++; continue; }

  let subtest = mapped;
  if (mapped === 'PS_ASTRO_ONLY') {
    if (!ASTRO.test(q.question)) { stats.wrongTopic++; continue; }
    subtest = 'PS';
  }

  // ~60 core questions are misfiled under arithmetic-reasoning but contain no arithmetic.
  // Excluded from the COPY (the ASVAB deck keeps them exactly as-is).
  if (subtest === 'AR' && !/\d/.test(q.question)) { stats.wrongTopic++; continue; }

  const key = q.question.replace(/\s+/g, ' ').trim().toLowerCase();
  if (seen.has(key)) { stats.wrongTopic++; continue; }
  seen.add(key);

  const { stem, choices } = splitChoices(q.question);
  if (choices) stats.withChoices++;
  out.push({
    id: `asvab-${q.id}`,
    subtest,
    question: stem,
    choices,
    answer: q.answer,
    answerAlternates: q.answerAlternates ?? [],
    explanation: q.explanation ?? null,
    difficulty: q.difficulty,
    tags: q.styleTags ?? [],
    // Authored, not "real": these were written for the ASVAB, not published as AFOQT items.
    provenance: { kind: 'authored', source: 'ASVAB deck (migrated copy)', originalId: q.id },
  });
  stats.kept++;
}

const bySubtest = {};
for (const q of out) bySubtest[q.subtest] = (bySubtest[q.subtest] ?? 0) + 1;

console.log(`source (READ-ONLY): ${SRC}`);
console.log(`  ${stats.total} questions in`);
console.log(`  - ${stats.junk} skipped: supplemental/junk imports`);
console.log(`  - ${stats.noSubtest} skipped: subtopic not on Form T (mech/electronics/auto/bio)`);
console.log(`  - ${stats.wrongTopic} skipped: misfiled, off-topic or duplicate`);
console.log(`  = ${stats.kept} copied (${stats.withChoices} had inline choices split out)`);
console.log(`  by subtest: ${Object.entries(bySubtest).map(([k, v]) => `${k}:${v}`).join('  ')}`);

if (WRITE) {
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nwrote ${OUT}`);
  console.log('ASVAB source untouched.');
}
