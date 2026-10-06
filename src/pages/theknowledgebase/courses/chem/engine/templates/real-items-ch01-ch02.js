// The Ch 1-2 REAL-ITEM pools, registered as templates so every study surface draws from them.
//
// WHY THIS FILE EXISTS (2026-10-06)
// ch1Items.js, ch2Items.js and examReviewItems.js were built on 2026-09-08 on one machine and never
// pushed; a parallel session rebuilt Exam 1 prep from the same sources as generators instead
// (rev1-*.js, quiz-ch01-observed.js). The pools surfaced again in a git stash the night before
// Exam 2. Exam 2 is cumulative (Ch 1-4), so the 188 items he was ACTUALLY asked (graded AcademiQ
// quizzes), the professor's own review sheet, and the book's exercises belong in tonight's pool,
// not in a dead route. Registering them here, rather than reviving the old flat `/ch1` page, means
// Exam prep, Quick Review, per-quiz practice and chapter drills all see them with no extra wiring.
//
// One template per (pool, section, needs-arithmetic?) so `mental` stays a truthful flag. A
// template draws one item per instance; the generator shuffles the options, which is safe — none
// of these refer to another option by position (checked: "both"/"neither" options are complete
// sentences, never "both A and B").
//
// ⚠ Four keys were corrected before registering (see the "Re-keyed 2026-10-06" notes in
// ch1Items.js / ch2Items.js). Two of them are AcademiQ's OWN grader being wrong; their
// explanations say what the AcademiQ quiz expects so he is not surprised on a real attempt.

import { registerChemTemplate } from '../generator.js';
import { SECTIONS } from '../../syllabusMap.js';
import { CH1_REAL_ITEMS, CH1_FACT_ITEMS } from '../../ch1Items.js';
import { CH2_REAL_ITEMS, CH2_FACT_ITEMS } from '../../ch2Items.js';
import { REVIEW_REAL_ITEMS, REVIEW_ITERATIONS } from '../../examReviewItems.js';

const POOLS = [
  { key: 'quiz', label: 'Your real Ch 1 quiz questions', items: CH1_REAL_ITEMS, band: 2 },
  { key: 'ch1def', label: 'Ch 1 definitions from the reading', items: CH1_FACT_ITEMS, band: 1 },
  { key: 'book2', label: 'AcademiQ Ch 2 exercises', items: CH2_REAL_ITEMS, band: 2 },
  { key: 'ch2def', label: 'Ch 2 definitions from the reading', items: CH2_FACT_ITEMS, band: 1 },
  { key: 'review', label: "Professor's Ch 1-2 review sheet", items: REVIEW_REAL_ITEMS, band: 2 },
  { key: 'reviter', label: 'Review-sheet iterations (same skill, new numbers)', items: REVIEW_ITERATIONS, band: 2 },
];

const sectionInfo = new Map(SECTIONS.map((s) => [s.section, s]));

export const REAL_ITEM_TEMPLATE_IDS = [];

for (const pool of POOLS) {
  const groups = new Map();
  for (const it of pool.items) {
    const k = `${it.section}|${it.noMath ? 'm' : 'c'}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(it);
  }
  for (const [k, items] of groups) {
    const [section, kind] = k.split('|');
    const sec = sectionInfo.get(section);
    if (!sec?.acs) throw new Error(`real-items: section ${section} has no ACS chapter to file under`);
    const id = `chem1-real-${pool.key}-${section}-${kind}`;
    REAL_ITEM_TEMPLATE_IDS.push(id);
    registerChemTemplate({
      id,
      chapterId: sec.acs,
      section,
      band: pool.band,
      mental: kind === 'm',
      name: `${pool.label} · §${section}`,
      concepts: sec.concepts,
      real: pool.key === 'quiz' || pool.key === 'review',
      generate: (rng, h) => {
        const it = h.pick(items);
        const right = it.choices[it.correctIndex];
        const wrong = it.choices.filter((_, i) => i !== it.correctIndex);
        const src = it.provenance ? ` (Source: ${it.provenance})` : '';
        return {
          stem: it.stem,
          ...h.choices(right, wrong),
          explanation: `${it.explanation ?? `Answer: ${right}.`}${src}`,
        };
      },
    });
  }
}
