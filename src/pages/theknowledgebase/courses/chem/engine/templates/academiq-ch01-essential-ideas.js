// Gaps found by auditing the bank against Trey's ACTUAL assigned textbook — the AcademiQ
// "Fall 2026 Chem 1210" course text his instructor wrote and hosts himself, exported to
// `SupplementalCourseDocs/CHEM 1210/_academiq/` on 2026-09-02.
//
// WHY THIS FILE EXISTS AS ITS OWN SOURCE (2026-09-09)
// The bank's first 88 templates were built from the ACS study guide's "Specific topics covered"
// lists. That is the right ruler for the FINAL (which really is an ACS standardized exam) and
// the wrong one for the four midterms, which his instructor writes himself against his own book.
// Reading `ch01-essential-ideas.md` §1-6 against the bank turned up three skills its own
// end-of-section exercises test outright and that nothing here could ask:
//
//   Ex. 1/2 + a video exercise  scientific notation PRESERVING significant figures
//                               -> sci-notation-sigfigs. `chem1-toolbox-sci-notation` only went
//                                  the other way (sci -> decimal) and ignored sig figs entirely.
//   Ex. 4                       the uncertainty a written measurement IMPLIES
//                               -> implied-uncertainty. Nothing in the bank touched it.
//   §1-6 opening paragraph      reading an instrument to one estimated digit past the smallest
//                               division -> read-instrument. `toolbox.md` TAUGHT this and no
//                               question tested it — an orphan concept under Doctrine rule 2,
//                               hiding in plain sight because it shares the `significant-figures`
//                               id with the arithmetic rules.
//
// The book's own worked numbers are used where it gives them (711.0 g, 0.05499, 0.01400 g/mL,
// 6.72 g, the 21.6 mL meniscus) — per the scope note in theknowledgebase/CLAUDE.md, quoting
// course material exactly is REQUIRED here, not merely allowed.

import { registerChemTemplate } from '../generator.js';

const CH = 'chem1-00-toolbox';

// ---------------------------------------------------------------------------
// §1-6 Additional Exercises 1 and 2, and the Video Exercise above them.
//
// Two things are tested at once and the distractors separate them: the COEFFICIENT must be
// normalized to 1 <= a < 10, and the significant figures must survive the rewrite. Every
// option below is the same magnitude — only the sig figs or the normalization is wrong — so
// you cannot pick it off by size.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-aq-01-sci-notation-sigfigs',
  chapterId: CH,
  section: '1-6',
  band: 2,
  mental: true,
  name: 'Scientific notation that preserves the significant figures',
  concepts: ['scientific-notation', 'significant-figures'],
  generate: (rng, h) => {
    // Declared, never derived: every form here turns on a trailing zero, and a JS number
    // destroys those. `unnormalized` is the book's own favourite trap (0.7110 x 10^3).
    const ITEMS = [
      { plain: '711.0 g', sf: 4, right: '7.110 × 10² g', dropped: '7.11 × 10² g', unnorm: '0.7110 × 10³ g', unnorm2: '71.10 × 10¹ g' },
      { plain: '0.05499', sf: 4, right: '5.499 × 10⁻²', dropped: '5.50 × 10⁻²', unnorm: '54.99 × 10⁻³', unnorm2: '0.5499 × 10⁻¹' },
      { plain: '90743', sf: 5, right: '9.0743 × 10⁴', dropped: '9.074 × 10⁴', unnorm: '90.743 × 10³', unnorm2: '0.90743 × 10⁵' },
      { plain: '134.2', sf: 4, right: '1.342 × 10²', dropped: '1.34 × 10²', unnorm: '13.42 × 10¹', unnorm2: '0.1342 × 10³' },
      { plain: '10000.0', sf: 6, right: '1.000000 × 10⁴', dropped: '1.0 × 10⁴', unnorm: '10.00000 × 10³', unnorm2: '0.1000000 × 10⁵' },
      { plain: '0.000000738592', sf: 6, right: '7.38592 × 10⁻⁷', dropped: '7.386 × 10⁻⁷', unnorm: '73.8592 × 10⁻⁸', unnorm2: '0.738592 × 10⁻⁶' },
      { plain: '0.239', sf: 3, right: '2.39 × 10⁻¹', dropped: '2.4 × 10⁻¹', unnorm: '23.9 × 10⁻²', unnorm2: '0.239 × 10⁰' },
      { plain: '0.01400 g/mL', sf: 4, right: '1.400 × 10⁻² g/mL', dropped: '1.4 × 10⁻² g/mL', unnorm: '14.00 × 10⁻³ g/mL', unnorm2: '0.1400 × 10⁻¹ g/mL' },
    ];
    const it = h.pick(ITEMS);
    return {
      stem: `A quantity is measured as ${it.plain}. Which form writes it in scientific notation with the correct number of significant figures?`,
      ...h.choices(
        it.right,
        [
          { value: it.dropped, error: 'sig-figs-lost', why: 'threw away significant figures the measurement actually had — the rewrite must not change the precision' },
          { value: it.unnorm, error: 'coefficient-not-normalized', why: 'left a coefficient of 10 or more; scientific notation needs exactly one non-zero digit before the decimal point' },
          { value: it.unnorm2, error: 'coefficient-not-normalized', why: 'left a coefficient below 1; scientific notation needs exactly one non-zero digit before the decimal point' },
        ],
      ),
      explanation: `${it.plain} has ${it.sf} significant figures, so the coefficient must carry all ${it.sf} of them — ${it.right}. Two rules run at once here: the coefficient is normalized so that 1 ≤ a < 10 (which rules out ${it.unnorm} and ${it.unnorm2}, both of which are the right SIZE), and the precision is preserved (which rules out ${it.dropped}). Changing the exponent never changes the significant figures; only the digits in the coefficient count.`,
    };
  },
});

// ---------------------------------------------------------------------------
// §1-6 Additional Exercise 4. The point the book is making: a written measurement is a CLAIM
// about precision, and the last digit written is the estimated one — so it carries roughly
// +/- 1 in its own place. "6.72 g exactly" is the wrong answer that feels right.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-aq-01-implied-uncertainty',
  chapterId: CH,
  section: '1-6',
  band: 2,
  mental: true,
  name: 'The uncertainty a written measurement implies',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    const READINGS = [
      { v: '6.72', unit: 'g', dp: 2 },
      { v: '21.6', unit: 'mL', dp: 1 },
      { v: '0.0450', unit: 'g', dp: 4 },
      { v: '108.35', unit: 'cm', dp: 2 },
      { v: '4.5', unit: 'mL', dp: 1 },
      { v: '99.80', unit: '%', dp: 2 },
      { v: '17.040', unit: 'g', dp: 3 },
    ];
    const r = h.pick(READINGS);
    const place = (dp) => `0.${'0'.repeat(dp - 1)}1`;
    const right = `The value is ${r.v} ${r.unit}, with an implied uncertainty of about ± ${place(r.dp)} ${r.unit}.`;
    return {
      stem: `An instrument reads ${r.v} ${r.unit}. Which statement best matches what that written measurement implies about its uncertainty?`,
      ...h.choices(
        right,
        [
          { value: `The value is ${r.v} ${r.unit} exactly, because the instrument displayed that specific number.`, error: 'treated-as-exact', why: 'treated a measured value as exact — every measurement carries uncertainty, and the digits written are how it is communicated' },
          { value: `The value is ${r.v} ${r.unit}, with an implied uncertainty of about ± ${place(r.dp + 1)} ${r.unit}.`, error: 'uncertainty-too-small', why: 'claimed more precision than the number was written with — you cannot be uncertain in a place you never reported' },
          { value: `The value is ${r.v} ${r.unit}, with an implied uncertainty of about ± ${place(Math.max(1, r.dp - 1))} ${r.unit}.`, error: 'uncertainty-too-large', why: 'put the uncertainty one place too far left, which would make the last digit written meaningless' },
        ],
      ),
      explanation: `The LAST digit you write is the estimated one, so the uncertainty sits in that digit's place: ${r.v} is written to the ${r.dp === 1 ? 'tenths' : r.dp === 2 ? 'hundredths' : r.dp === 3 ? 'thousandths' : 'ten-thousandths'} place, giving about ± ${place(r.dp)} ${r.unit}. This is what significant figures are FOR — they are not a formatting convention, they are the measurement telling you how much of it to trust. No measured value is ever exact.`,
    };
  },
});

// ---------------------------------------------------------------------------
// §1-6's opening paragraph — the meniscus between the 21 and 22 mL marks, read as 21.6 mL.
// The rule ("all certain digits plus ONE estimated digit") was already in toolbox.md and had
// no question anywhere, which is exactly the orphan Doctrine rule 2 forbids.
// ---------------------------------------------------------------------------
registerChemTemplate({
  id: 'chem1-aq-01-read-instrument',
  chapterId: CH,
  section: '1-6',
  band: 2,
  mental: true,
  name: 'Reading an instrument to one estimated digit',
  concepts: ['significant-figures'],
  generate: (rng, h) => {
    const SCALES = [
      { tool: 'graduated cylinder', unit: 'mL', div: 1, low: 21, est: '.6', tooFew: '21', tooMany: '21.63', next: '22' },
      { tool: 'graduated cylinder', unit: 'mL', div: 1, low: 47, est: '.2', tooFew: '47', tooMany: '47.25', next: '48' },
      { tool: 'ruler', unit: 'cm', div: 0.1, low: 8.4, est: '4', tooFew: '8.4', tooMany: '8.442', next: '8.5' },
      { tool: 'thermometer', unit: '°C', div: 1, low: 36, est: '.5', tooFew: '36', tooMany: '36.52', next: '37' },
      { tool: 'burette', unit: 'mL', div: 0.1, low: 12.3, est: '7', tooFew: '12.3', tooMany: '12.3704', next: '12.4' },
    ];
    const s = h.pick(SCALES);
    const right = s.div === 1 ? `${s.low}${s.est} ${s.unit}` : `${s.low}${s.est} ${s.unit}`;
    const upper = s.div === 1 ? `${s.low + 1}` : s.next;
    return {
      stem: `A ${s.tool} is marked in divisions of ${s.div} ${s.unit}. The level sits between the ${s.low} ${s.unit} and ${upper} ${s.unit} marks, a little past halfway. Which is the correctly recorded reading?`,
      ...h.choices(
        right,
        [
          { value: `${s.tooFew} ${s.unit}`, error: 'no-estimated-digit', why: 'reported only the marks you can read off directly — a reading always includes ONE estimated digit past the smallest division' },
          { value: `${s.tooMany} ${s.unit}`, error: 'too-many-estimated-digits', why: 'estimated more than one digit past the smallest division, claiming precision the instrument cannot deliver' },
          { value: `${upper} ${s.unit}`, error: 'rounded-to-a-mark', why: 'rounded to the nearest mark, which throws away the estimate entirely' },
        ],
      ),
      explanation: `Record every CERTAIN digit — the ones the marks give you — plus exactly ONE estimated digit. With ${s.div} ${s.unit} divisions the certain part is ${s.low}, and judging the level past halfway adds one estimated digit, giving ${right}. Two careful people might write slightly different final digits and both be right; that disagreement IS the measurement uncertainty. Stopping at ${s.tooFew} under-reports what the instrument can do, and ${s.tooMany} claims precision it does not have.`,
    };
  },
});
