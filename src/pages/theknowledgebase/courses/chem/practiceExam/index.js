// CHEM 1210 study-guide practice exam: every QUESTION STYLE that appeared on any of his exam study
// guides, 3 questions each (Trey, 2026-11-17: "since it's cumulative i DO want 3 questions per
// style across all the exams ... if 2 exams cover the same topic, just give me 3 questions for
// that"). Rule recorded in PREFERENCES.md.
//
// One style = one generator. Question "a" is his REAL question from a study guide (the most
// recent guide that asked it, when the wording allows); "b" and "c" are the same frame with new
// numbers or substances, computed by the generator, so no sibling carries hand arithmetic.
//
// Real-question spec on a style (`real`):
//   { from: 'ch12' | 'ex2', idx }  -> an item already transcribed and worked in examReviewItems.js /
//                                     examReview2Items.js, shown verbatim.
//   { src, q, stem, p?, choices?, answer, explanation? } -> a question from a newer source. `p`
//                                     makes the generator reproduce it (the test checks the generator's
//                                     answer equals `answer`), and supplies the worked explanation.

import { mulberry32, shuffle } from '../../../engine/rng.js';
import { makeHelpers, tidy } from '../engine/generator.js';
import { REVIEW_REAL_ITEMS } from '../examReviewItems.js';
import { REVIEW2_REAL_ITEMS } from '../examReview2Items.js';
import { STYLES_CH1 } from './styles-ch1.js';
import { STYLES_CH2 } from './styles-ch2.js';
import { STYLES_CH3_4 } from './styles-ch3-4.js';
import { STYLES_CH5_8 } from './styles-ch5-8.js';
import { STYLES_EXAM3 } from './styles-exam3.js';
import { LADDERS } from './ladders.js';

// Questions on the Exam 3 Review (photographed 2026-11-17) that are a style already in the bank.
// Kept here rather than edited into each style file so the whole mapping of that review reads in
// one place: 42 questions, every one accounted for (the other 11 are the styles in styles-exam3.js).
const EXTRA_ASKED = {
  'thermo-stoich': ['ex3:4', 'ex3:24'], 'oxidation-number': ['ex3:6', 'ex3:29'], 'acid-formula': ['ex3:7'], 'sigfig-mixed': ['ex3:8'],
  'ionic-formula-to-name': ['ex3:9'], pne: ['ex3:10'], 'area-convert': ['ex3:11'], 'avg-mass-2': ['ex3:12'], 'solution-stoich-volume': ['ex3:13'],
  'limiting-reactant-mass': ['ex3:14'], 'electrons-transferred': ['ex3:15'], 'empirical-from-percent': ['ex3:17'], 'percent-yield': ['ex3:18', 'ex3:32'],
  'reducing-agent': ['ex3:19'], 'conductivity-rank': ['ex3:20'], 'dilution-water-to-add': ['ex3:21'], 'volume-for-ion-mass': ['ex3:22'],
  'titration-molarity': ['ex3:27'], 'combustion-analysis': ['ex3:30', 'ex3:31'], 'transition-wavelength': ['ex3:35', 'ex3:39'],
  'photon-molar-energy': ['ex3:36'], 'atomic-size-order': ['ex3:37'], 'photon-wavelength': ['ex3:38'], 'electron-configuration': ['ex3:40'],
  'valence-electrons': ['ex3:41'], paramagnetic: ['ex3:42'],
};

export const SOURCES = {
  ch12: { name: "Professor's Chapter 1-2 Review (before Exam 1)", short: 'Chapter 1-2 Review' },
  ex1: { name: 'Exam 1 Review handout (3 pages, photographed 9-9)', short: 'Exam 1 Review' },
  ex2: { name: "Professor's Exam 2 review sheet", short: 'Exam 2 review sheet' },
  si2: { name: 'Supplemental Instruction Exam 2 Review', short: 'Supplemental Instruction Exam 2 Review' },
  prep: { name: 'Canvas "Exam 2 Prep Quiz Practice"', short: 'Exam 2 Prep Quiz' },
  sample2: { name: 'Exam 2 sample exam shown in class (screenshots)', short: 'Exam 2 sample exam' },
  ex3: { name: 'Exam 3 Review, Chapters 1-6 (photographed 11-17)', short: 'Exam 3 Review' },
  ex4: { name: 'Exam 4 review, Chapters 1-8 (photographed 11-17)', short: 'Exam 4 review' },
};
const FROM = { ch12: REVIEW_REAL_ITEMS, ex2: REVIEW2_REAL_ITEMS };

const secKey = (s) => s.split('-').map(Number);
export const STYLES = [...STYLES_CH1, ...STYLES_CH2, ...STYLES_CH3_4, ...STYLES_CH5_8, ...STYLES_EXAM3]
  .map((s, i) => ({ ...s, asked: [...s.asked, ...(EXTRA_ASKED[s.id] ?? [])], order: i }))
  .sort((a, b) => {
    const [a1, a2] = secKey(a.section), [b1, b2] = secKey(b.section);
    return a1 - b1 || a2 - b2 || a.order - b.order;
  });

export const chapterOf = (style) => Number(style.section.split('-')[0]);
export const norm = (s) => String(s).toLowerCase().replace(/[\s,]/g, '').replace(/×10\^?/g, 'e').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => ({ '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9, '⁻': '-' }[c]));

const sourceRef = (s) => {
  const [src, q] = s.split(':');
  return `${SOURCES[src]?.short ?? src} question ${q}`;
};

/** The real study-guide question for a style, as a runner question (options shuffled by rng). */
export function realQuestion(style, rng) {
  const r = style.real;
  let stem, choices, correctIndex, explanation, src, q;
  if (r.from) {
    const it = FROM[r.from][r.idx];
    if (!it) throw new Error(`practiceExam: ${style.id} points at missing ${r.from}[${r.idx}]`);
    const order = shuffle(it.choices.map((_, j) => j), rng);
    stem = it.stem; choices = order.map((j) => it.choices[j]); correctIndex = order.indexOf(it.correctIndex);
    explanation = it.explanation; src = r.from; q = style.asked.find((a) => a.startsWith(`${r.from}:`))?.split(':')[1] ?? r.idx + 1;
  } else {
    const h = makeHelpers(rng, 0);
    const g = r.p ? style.gen(h, r.p) : null;
    explanation = r.explanation ?? g?.explanation;
    if (!explanation) throw new Error(`practiceExam: ${style.id} real question has no explanation`);
    if (r.choices) {
      const order = shuffle(r.choices.map((_, j) => j), rng);
      choices = order.map((j) => r.choices[j]);
      correctIndex = choices.indexOf(r.answer);
    } else {
      ({ choices, correctIndex } = h.choices(r.answer, g.wrong));
    }
    stem = r.stem; src = r.src; q = r.q;
  }
  const others = style.asked.filter((a) => a !== `${src}:${q}`).map(sourceRef);
  const tail = `\n\nThis is the real question from the ${SOURCES[src].name}, question ${q}.${others.length ? ` The same style was also asked on: ${others.join('; ')}.` : ''}`;
  return { stem, choices, correctIndex, explanation: explanation + tail };
}

/** One generated sibling. Retries until its stem differs from everything in `avoid`. */
export function siblingQuestion(style, seed, avoid) {
  for (let t = 0; t < 40; t++) {
    const rng = mulberry32((seed + t * 7919) >>> 0);
    const h = makeHelpers(rng, seed);
    const g = style.gen(h, null);
    if (!g) continue;
    const c = h.choices(g.right, g.wrong);
    // Same stem AND same answer is the same question, whatever the capitalisation or option order.
    const key = `${norm(g.stem)}|${norm(g.right)}`;
    if (avoid.has(key) || c.choices.length < 4) continue;
    avoid.add(key);
    return { stem: g.stem, ...c, explanation: g.explanation };
  }
  throw new Error(`practiceExam: style ${style.id} could not make a distinct sibling`);
}

/** The 3 questions of one style, numbered `${n}a/b/c`. */
export function styleTriple(style, n, seed) {
  const rng = mulberry32(seed >>> 0);
  const real = realQuestion(style, rng);
  const avoid = new Set([`${norm(real.stem)}|${norm(real.choices[real.correctIndex])}`]);
  const out = [{ ...real, k: 'a' }];
  for (const k of ['b', 'c']) {
    const s = siblingQuestion(style, (seed * 31 + k.charCodeAt(0) * 1009) >>> 0, avoid);
    out.push({ ...s, k, explanation: `${s.explanation}\n\nSame style as ${n}a (${style.title}), with new numbers or substances.` });
  }
  return out.map((x) => tidy({
    templateId: `sheet-pe-${style.id}-${x.k}`,
    section: style.section,
    stem: `${n}${x.k}. ${x.stem}`,
    choices: x.choices, correctIndex: x.correctIndex, explanation: x.explanation, errors: null, whys: null,
    ladder: LADDERS[style.id] ?? null,
  }));
}

/**
 * The whole exam, in course order. Filters:
 *   only: 'ex4'         -> styles his Exam 4 review asked (plus nothing else)
 *   chapters: [5,6,7,8] -> styles whose section is in those chapters
 */
export function buildPracticeExam({ seed = Date.now(), only = null, chapters = null } = {}) {
  const styles = STYLES.filter((s) => (!only || s.asked.some((a) => a.startsWith(`${only}:`)))
    && (!chapters || chapters.includes(chapterOf(s))));
  return styles.flatMap((s, i) => styleTriple(s, i + 1, (seed + i * 104729) >>> 0));
}

export const practiceExamCounts = () => {
  const ex4 = STYLES.filter((s) => s.asked.some((a) => a.startsWith('ex4:'))).length;
  return { styles: STYLES.length, questions: STYLES.length * 3, ex4Styles: ex4 };
};
