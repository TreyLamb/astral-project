// The curriculum spine: tracks, chapters, prerequisites, and the concepts each chapter
// claims to teach.
//
// PURE DATA, and deliberately free of markdown imports so `npm run afoqt:coverage` can load
// it under plain Node. The lesson text lives in curriculum/lessons.js, which is browser-only
// because it uses Vite's `?raw`.
//
// `concepts` is the contract that makes Doctrine rule 2 checkable in both directions:
//   - every concept listed here must be tested by at least one template
//   - every concept any template declares must appear in some chapter
// `npm run afoqt:coverage` fails if either half breaks. Adding a concept to a chapter without
// writing the question that tests it is exactly the "orphan lesson content" the rule forbids.

export const TRACKS = [
  {
    id: 'math',
    name: 'Math Knowledge',
    subtest: 'MK',
    blurb: 'Feeds five of the six composites - more reach than any other subtest. 25 questions in 22 minutes (52.8s each), and no calculator.',
  },
  {
    id: 'reasoning',
    name: 'Arithmetic Reasoning',
    subtest: 'AR',
    blurb: 'The other half of the Quantitative composite, and 69.6s per question - the most generous clock on the test. The arithmetic is easy on purpose; the difficulty is reading a paragraph and deciding what to compute.',
  },
  {
    id: 'vocabulary',
    name: 'Word Knowledge',
    subtest: 'WK',
    blurb: '25 questions in 5 minutes - 12 seconds each, joint-tightest clock on the test outside the perceptual subtests. Pure recall, so it is the most improvable subtest here, and roots pay out on words you have never seen.',
  },
  {
    id: 'perceptual',
    name: 'Table Reading',
    subtest: 'TR',
    blurb: 'Feeds all three rated composites and is pure trainable speed - no knowledge to forget. 40 questions in 7 minutes is 10.5s each, and most people do not finish.',
  },
  // Block Counting gets its own track rather than sharing "perceptual speed" with Table
  // Reading. A track prints its subtest's pace and composites in its header, so the shared
  // arrangement labelled the tightest clock on the test (9.0s) with Table Reading's 10.5s and
  // credited it with Table Reading's composites. Same family of skill, different subtest.
  {
    id: 'blocks',
    name: 'Block Counting',
    subtest: 'BC',
    blurb: 'The tightest clock on the whole test at 9.0s per question. One rule - faces touch, corners do not - decides most of it, and the answer key shifts range every question.',
  },
  {
    id: 'aviation',
    name: 'Aviation Information',
    subtest: 'AI',
    blurb: 'The from-zero track, and the highest return on the whole test for someone without an aviation background - no background means no points, and every point here is learnable. 20 questions in 8 minutes.',
  },
  {
    id: 'instruments',
    name: 'Instrument Comprehension',
    subtest: 'IC',
    blurb: 'Four conventions, one of them deliberately backwards. No knowledge, no arithmetic - and the only subtest on the test with FOUR options rather than five. 25 questions in 5 minutes.',
  },
  {
    id: 'reading',
    name: 'Reading Comprehension',
    subtest: 'RC',
    blurb: '25 questions in 38 minutes (91.2s each) based on passages of strategic prose. Requires distinguishing main ideas from supporting details and inferring vocabulary from context.',
  },
  {
    id: 'analogies',
    name: 'Verbal Analogies',
    subtest: 'VA',
    blurb: 'Feeds ABM, Academic and Verbal. 25 questions in 8 minutes (19.2s each) - the most generous verbal clock on the test, because the difficulty is the relationship, not the recall.',
  },
  {
    id: 'science',
    name: 'Physical Science',
    subtest: 'PS',
    blurb: 'Unscored - feeds no composite - but the stated goal here is dominating every topic regardless of whether it counts. 20 questions in 10 minutes (30.0s each), general conceptual physics/chemistry/astronomy, no math required.',
  },
  {
    id: 'judgment',
    name: 'Situational Judgment',
    subtest: 'SJ',
    blurb: 'No fixed right answer - scored against the consensus judgment of experienced Air Force officers. Every situation asks two questions back to back: MOST effective action, then LEAST effective. 50 questions in 35 minutes. Composite status is disputed - AFPC\'s own 2015 pamphlet and Barron\'s 4th Ed both name a seventh composite; current commercial sources omit it. Do not deprioritise it on the assumption it is worthless.',
  },
];

/**
 * @typedef {Object} Chapter
 * @property {string} id
 * @property {string} track
 * @property {string} subtest
 * @property {number} order
 * @property {string} title
 * @property {string} summary       one line, shown on the curriculum map
 * @property {number} minutes       honest reading estimate for the lesson
 * @property {number[]} bands       difficulty bands the drills draw from
 * @property {string[]} prereqs     chapter ids; a locked chapter names what unlocks it
 * @property {number} testOutPass   correct answers out of 5 needed to skip the lesson
 * @property {string[]} concepts    every concept the lesson teaches - all must be tested
 */
export const CHAPTERS = [
  {
    id: 'mk-01-fluency',
    track: 'math', subtest: 'MK', order: 1,
    title: 'Fluency and the traps inside it',
    summary: 'Order of operations, fractions, absolute value, decimals, and turning a sentence into an expression.',
    minutes: 10, bands: [1, 2, 3], prereqs: [], testOutPass: 4,
    concepts: ['order-of-operations', 'fraction-arithmetic', 'absolute-value', 'signed-numbers',
      'decimal-percent-conversion', 'math-vocabulary', 'divisibility-factors-multiples'],
  },
  {
    id: 'mk-02-ratios',
    track: 'math', subtest: 'MK', order: 2,
    title: 'Ratios, proportions and rates',
    summary: 'One idea four ways: two quantities scale by the same factor. Find the factor, apply it, mind the units.',
    minutes: 9, bands: [2, 3], prereqs: ['mk-01-fluency'], testOutPass: 4,
    concepts: ['proportion-solving', 'ratio-form', 'unit-rate', 'scale-conversion'],
  },
  {
    id: 'mk-03-percent',
    track: 'math', subtest: 'MK', order: 3,
    title: 'Percent, percent change and interest',
    summary: 'Almost never about arithmetic - always about which number is the base.',
    minutes: 10, bands: [1, 3, 4], prereqs: ['mk-02-ratios'], testOutPass: 4,
    concepts: ['percent-of', 'percent-change', 'simple-interest', 'successive-discount'],
  },
  {
    id: 'mk-04-linear',
    track: 'math', subtest: 'MK', order: 4,
    title: 'Linear equations, inequalities and systems',
    summary: 'The highest-frequency algebra on the test. Sign discipline, and answering for the variable actually asked about.',
    minutes: 12, bands: [1, 3, 4], prereqs: ['mk-01-fluency'], testOutPass: 4,
    concepts: ['linear-equations', 'linear-inequalities', 'literal-equations', 'systems-of-equations'],
  },
  {
    id: 'mk-05-exponents',
    track: 'math', subtest: 'MK', order: 5,
    title: 'Exponents, radicals and scientific notation',
    summary: 'Three rules do the work: multiply adds, divide subtracts, power of a power multiplies.',
    minutes: 11, bands: [2, 3], prereqs: ['mk-01-fluency'], testOutPass: 4,
    concepts: ['exponent-rules', 'negative-exponents', 'zero-exponent', 'radicals-simplify',
      'scientific-notation'],
  },
  {
    id: 'mk-06-polynomials',
    track: 'math', subtest: 'MK', order: 6,
    title: 'Polynomials and factoring',
    summary: 'The deepest chapter in the track, because AC-method factoring is the hardest algebra the real test asks.',
    minutes: 16, bands: [2, 3, 4], prereqs: ['mk-04-linear', 'mk-05-exponents'], testOutPass: 4,
    concepts: ['polynomial-arithmetic', 'foil-expansion', 'factor-gcf',
      'factor-difference-of-squares', 'factor-trinomial', 'factor-ac-method',
      'factor-sum-diff-cubes'],
  },
  {
    id: 'mk-07-quadratics',
    track: 'math', subtest: 'MK', order: 7,
    title: 'Quadratics',
    summary: 'Roots by factoring, the formula for when nothing factors, and the discriminant as a shortcut.',
    minutes: 13, bands: [3, 4], prereqs: ['mk-06-polynomials'], testOutPass: 4,
    concepts: ['quadratic-by-factoring', 'quadratic-formula', 'discriminant', 'vertex-and-roots',
      'complete-the-square'],
  },
  {
    id: 'mk-08-functions',
    track: 'math', subtest: 'MK', order: 8,
    title: 'Functions and sequences',
    summary: 'Substitution with a sign trap, composition with a direction trap, sequences with an off-by-one trap.',
    minutes: 11, bands: [2, 3, 4], prereqs: ['mk-04-linear', 'mk-06-polynomials'], testOutPass: 4,
    concepts: ['function-notation', 'function-composition', 'domain-restrictions',
      'arithmetic-sequence', 'geometric-sequence'],
  },
  {
    id: 'mk-09-geometry-foundations',
    track: 'math', subtest: 'MK', order: 9,
    title: 'Geometry I - angles, lines and triangles',
    summary: 'Taught from the ground up. No formulas yet, just the angle facts every later geometry item assumes.',
    // 5/5 to test out of all three geometry chapters. Trey named geometry as his weakest
    // area, and a lucky 4/5 is exactly how a weak area gets skipped.
    minutes: 16, bands: [2, 3], prereqs: [], testOutPass: 5,
    concepts: ['angle-pairs', 'parallel-lines-transversal', 'triangle-angle-sum',
      'triangle-types', 'similar-triangles', 'polygon-angle-sum'],
  },
  {
    id: 'mk-10-geometry-measurement',
    track: 'math', subtest: 'MK', order: 10,
    title: 'Geometry II - perimeter, area and circles',
    summary: 'Every formula here has exactly one thing people drop. Those are the distractors.',
    minutes: 15, bands: [1, 2, 3, 4], prereqs: ['mk-09-geometry-foundations'], testOutPass: 5,
    concepts: ['perimeter', 'area-rectangle-parallelogram', 'area-triangle', 'area-trapezoid',
      'circle-area', 'circle-circumference', 'arc-sector', 'composite-figures'],
  },
  {
    id: 'mk-11-right-triangles-solids',
    track: 'math', subtest: 'MK', order: 11,
    title: 'Geometry III - right triangles and solids',
    summary: 'Pythagorean triples and the two special triangles are the biggest time-savers on the whole subtest.',
    minutes: 15, bands: [2, 3, 4], prereqs: ['mk-10-geometry-measurement'], testOutPass: 5,
    concepts: ['pythagorean-theorem', 'pythagorean-triples', 'special-right-triangles',
      'volume-prism-cylinder', 'volume-cone-sphere', 'surface-area', 'space-diagonal'],
  },
  {
    id: 'mk-12-coordinate',
    track: 'math', subtest: 'MK', order: 12,
    title: 'Coordinate geometry',
    summary: 'Five formulas, four of them the same idea. Almost every error is an orientation error.',
    minutes: 12, bands: [2, 3], prereqs: ['mk-04-linear', 'mk-09-geometry-foundations'], testOutPass: 4,
    concepts: ['slope', 'midpoint', 'distance-formula', 'line-equations', 'intercepts',
      'parallel-perpendicular-slopes'],
  },
  {
    id: 'mk-13-probability-stats',
    track: 'math', subtest: 'MK', order: 13,
    title: 'Probability, counting and statistics',
    summary: 'Four traps: part over whole, without replacement, order or no order, and the average of averages.',
    minutes: 12, bands: [2, 3, 4], prereqs: ['mk-01-fluency', 'mk-03-percent'], testOutPass: 4,
    concepts: ['simple-probability', 'compound-probability', 'permutations', 'combinations',
      'mean-median-mode', 'weighted-average'],
  },

  // --- Perceptual speed --------------------------------------------------
  // One chapter, deliberately. Table Reading is a single skill performed 40 times, so a
  // multi-chapter track would be padding - and this is the one subtest where reading about it
  // is worth about four minutes and DOING it is worth hours. No prerequisites: it shares
  // nothing with the math track and should be reachable on day one.
  {
    id: 'tr-01-table-reading',
    track: 'perceptual', subtest: 'TR', order: 14,
    title: 'Table Reading - the method',
    summary: 'The Y axis descends and the values change gradually. Those two facts are most of the subtest.',
    minutes: 8, bands: [1, 2, 3, 4], prereqs: [], testOutPass: 5,
    concepts: ['table-axis-orientation', 'table-anchor-method', 'table-row-column-tracking',
      'table-scan-distance', 'table-near-miss-discrimination'],
  },

  // --- Aviation Information ------------------------------------------------
  // Eleven chapters, and the largest teaching build in the project. Four of them have no
  // prerequisites (anatomy, airports, weather, aircraft type) so the track can be entered from
  // several directions - a from-zero subject should not force one long chain.
  //
  // Two chapters demand a clean 5/5 test-out rather than 4/5, and both for the same reason:
  // they carry the highest density of official items in the whole subtest. Between them,
  // airfield operations and aircraft type account for FIVE of the ten sampled OATTS questions,
  // and MDS designations are additionally a topic almost no commercial guide covers - so a
  // lucky four out of five is exactly how a blind spot survives.
  {
    id: 'av-01-anatomy',
    track: 'aviation', subtest: 'AI', order: 15,
    title: 'Aircraft anatomy and the controls',
    summary: 'Name the parts, and know which surface moves the aircraft about which axis.',
    minutes: 14, bands: [1, 2, 3], prereqs: [], testOutPass: 4,
    concepts: ['airframe-structure', 'primary-control-surfaces', 'axes-of-flight',
      'secondary-control-surfaces', 'trim-devices'],
  },
  {
    id: 'av-02-forces',
    track: 'aviation', subtest: 'AI', order: 16,
    title: 'The four forces and the wing',
    summary: 'Lift, weight, thrust, drag - then the shape of an airfoil and the angle that decides everything.',
    minutes: 14, bands: [1, 2, 3], prereqs: ['av-01-anatomy'], testOutPass: 4,
    concepts: ['four-forces', 'airfoil-geometry', 'lift-and-drag', 'drag-types', 'wing-performance'],
  },
  {
    id: 'av-03-stalls',
    track: 'aviation', subtest: 'AI', order: 17,
    title: 'Stalls, spins and load factor',
    summary: 'A stall is an angle, not a speed. Everything else in this chapter follows from that.',
    minutes: 12, bands: [2, 3, 4], prereqs: ['av-02-forces'], testOutPass: 4,
    concepts: ['stall-aerodynamics', 'spin-mechanics', 'load-factor', 'maneuvering-speed'],
  },
  {
    id: 'av-04-instruments',
    track: 'aviation', subtest: 'AI', order: 18,
    title: 'Flight instruments and what fails',
    summary: 'Three run on air pressure and three run on gyros. Knowing which answers every failure question.',
    minutes: 14, bands: [2, 3, 4], prereqs: ['av-02-forces'], testOutPass: 4,
    concepts: ['pitot-static-instruments', 'gyroscopic-instruments', 'instrument-failures',
      'airspeed-types', 'magnetic-compass'],
  },
  {
    id: 'av-05-powerplant',
    track: 'aviation', subtest: 'AI', order: 19,
    title: 'Engines and propellers',
    summary: 'Which engine is which, the four strokes in order, and the four left-turning tendencies by name.',
    minutes: 13, bands: [2, 3, 4], prereqs: ['av-01-anatomy'], testOutPass: 4,
    concepts: ['engine-types', 'four-stroke-cycle', 'induction-and-fuel', 'propeller-effects',
      'engine-instruments'],
  },
  {
    id: 'av-06-airports',
    track: 'aviation', subtest: 'AI', order: 20,
    title: 'Airports, markings and the pattern',
    summary: 'Runway numbering is a rule you can apply, not a fact to memorise. The light colours are a set.',
    minutes: 15, bands: [2, 3, 4], prereqs: [], testOutPass: 5,
    concepts: ['runway-numbering', 'traffic-pattern', 'airport-markings', 'airport-lighting'],
  },
  {
    id: 'av-07-airspace',
    track: 'aviation', subtest: 'AI', order: 21,
    title: 'Airspace, right of way and altitudes',
    summary: 'The most rule-shaped chapter here, and therefore the most reliably scoreable.',
    minutes: 13, bands: [2, 3, 4], prereqs: ['av-06-airports'], testOutPass: 4,
    concepts: ['airspace-classes', 'special-use-airspace', 'vfr-minimums', 'right-of-way',
      'cruising-altitudes'],
  },
  {
    id: 'av-08-weather',
    track: 'aviation', subtest: 'AI', order: 22,
    title: 'Weather and performance',
    summary: 'Weather is one of the four official sections. Density altitude is the part people get backwards.',
    minutes: 15, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['atmosphere-and-pressure', 'fronts-and-systems', 'clouds-and-fog',
      'icing-and-turbulence', 'density-altitude'],
  },
  {
    id: 'av-09-vspeeds-rotary',
    track: 'aviation', subtest: 'AI', order: 23,
    title: 'V-speeds and rotary-wing',
    summary: 'Pure flashcard territory - a fixed list with fixed meanings, plus the arcs that draw them.',
    minutes: 12, bands: [2, 3, 4], prereqs: ['av-03-stalls', 'av-04-instruments'], testOutPass: 4,
    concepts: ['v-speeds', 'airspeed-indicator-arcs', 'rotorcraft-controls', 'rotorcraft-aerodynamics'],
  },
  {
    id: 'av-10-aircraft-type',
    track: 'aviation', subtest: 'AI', order: 24,
    title: 'Aircraft type and the MDS system',
    summary: 'Two of the ten official questions are here, and almost no commercial guide covers it.',
    minutes: 12, bands: [2, 3, 4], prereqs: [], testOutPass: 5,
    concepts: ['mds-mission-letters', 'mds-decoding', 'airframe-families'],
  },
  {
    id: 'av-11-navigation',
    track: 'aviation', subtest: 'AI', order: 25,
    title: 'Navigation and the pilot',
    summary: 'The TVMDC chain converts both ways. Then hypoxia and the illusions, which are asked.',
    minutes: 14, bands: [2, 3, 4], prereqs: ['av-04-instruments'], testOutPass: 4,
    concepts: ['navigation-methods', 'magnetic-vs-true', 'navaids', 'time-and-charts',
      'aeromedical-factors'],
  },

  // --- Instrument Comprehension --------------------------------------------
  // One chapter, like Table Reading: the subtest is a single skill performed 25 times. No
  // prerequisites - it shares nothing with any other track and the conventions stand alone.
  //
  // 5/5 to test out, because the inverted bank pointer is a single fact that inverts an entire
  // subtest. Someone who has not met it will get every banked question backwards and still feel
  // confident, which is exactly the failure a four-out-of-five gate would wave through.
  {
    id: 'ic-01-instruments',
    track: 'instruments', subtest: 'IC', order: 26,
    title: 'Instrument Comprehension - the method',
    summary: 'The pointer is inverted and you are always looking north. Those two facts are most of the subtest.',
    minutes: 10, bands: [1, 2, 3, 4], prereqs: [], testOutPass: 5,
    concepts: ['instrument-viewing-convention', 'instrument-bank-inversion',
      'instrument-pitch-reading', 'instrument-attitude-reading'],
  },

  // Block Counting. 5/5 to test out, for the same reason Instrument Comprehension asks for a
  // clean sweep: one rule (corners do not count) decides most of the questions, and someone
  // who has not internalised it over-counts consistently while feeling certain. A 4/5 gate
  // would pass exactly the candidate this chapter exists for.
  {
    id: 'bc-01-block-counting',
    track: 'blocks', subtest: 'BC', order: 27,
    title: 'Block Counting - the method',
    summary: 'Faces touch, corners do not. Count above, below, alongside - then see into the pile.',
    minutes: 9, bands: [1, 2, 3, 4], prereqs: [], testOutPass: 5,
    concepts: ['block-face-contact', 'block-corner-exclusion',
      'block-hidden-inference', 'block-scan-order'],
  },

  // --- Arithmetic Reasoning ------------------------------------------------
  // Six chapters. The arithmetic in this subtest is deliberately easy - what is being measured
  // is whether a paragraph can be turned into the right computation, which is why chapter 1 is
  // the spine and every later chapter is a family of prose the test actually uses.
  //
  // Every concept here is `ar-` prefixed, and that is load-bearing rather than cosmetic. Math
  // Knowledge already owns `percent-of`, `unit-rate`, `proportion-solving`, `scale-conversion`
  // and `weighted-average`, and `afoqt:coverage` fails if two chapters claim one concept. The
  // separation is also true to the test: MK asks you to EXECUTE a proportion, AR asks you to
  // find that there is one.
  //
  // Chapter 1 is the deferred "chapter 14" from the Math Knowledge build. It was parked because
  // word-problem translation is an Arithmetic Reasoning skill wearing a math hat.
  {
    id: 'ar-01-translation',
    track: 'reasoning', subtest: 'AR', order: 28,
    title: 'Turning words into arithmetic',
    summary: 'The whole subtest in one chapter: name the unknown, write the sentence as an equation, and answer the question that was actually asked.',
    // 5/5 to test out. Everything downstream is this skill applied to a topic, so passing here
    // on a lucky four means every later chapter is built on a gap.
    minutes: 14, bands: [1, 2, 3], prereqs: [], testOutPass: 5,
    concepts: ['ar-keyword-translation', 'ar-choose-the-unknown', 'ar-answer-the-question',
      'ar-operation-order-trap', 'ar-unit-tracking'],
  },
  {
    id: 'ar-02-rates',
    track: 'reasoning', subtest: 'AR', order: 29,
    title: 'Rate, time and distance',
    summary: 'One formula, four rearrangements. The traps are the inverse relationship and the average speed that is not an average.',
    minutes: 13, bands: [2, 3, 4], prereqs: ['ar-01-translation'], testOutPass: 4,
    concepts: ['ar-rate-time-distance', 'ar-solve-for-time', 'ar-inverse-rate',
      'ar-average-speed', 'ar-consumption-rate', 'ar-combined-rates'],
  },
  {
    id: 'ar-03-proportion',
    track: 'reasoning', subtest: 'AR', order: 30,
    title: 'Proportion, scale and similar figures',
    summary: 'Set the ratio up with matching units on top, and the arithmetic takes care of itself. Set it up inverted and every answer is plausible.',
    minutes: 12, bands: [2, 3, 4], prereqs: ['ar-01-translation'], testOutPass: 4,
    concepts: ['ar-proportion-setup', 'ar-similar-figures', 'ar-scale-drawing',
      'ar-conversion-chain', 'ar-best-buy'],
  },
  {
    id: 'ar-04-percent-context',
    track: 'reasoning', subtest: 'AR', order: 31,
    title: 'Percent in context',
    summary: 'Percent of a percent, percent back to a count, and the discount question that is really a counting question.',
    minutes: 12, bands: [2, 3, 4], prereqs: ['ar-01-translation'], testOutPass: 4,
    concepts: ['ar-percent-subgroup', 'ar-percent-to-count', 'ar-discount-equivalence',
      'ar-markup-tax-tip', 'ar-percent-remaining'],
  },
  {
    id: 'ar-05-averages',
    track: 'reasoning', subtest: 'AR', order: 32,
    title: 'Averages, totals and combined work',
    summary: 'Every average question is really a total question. Recover the total first and the rest is one step.',
    minutes: 13, bands: [2, 3, 4], prereqs: ['ar-01-translation'], testOutPass: 4,
    concepts: ['ar-average-missing-value', 'ar-weighted-groups', 'ar-signed-net-total',
      'ar-mixture', 'ar-work-rate'],
  },
  {
    id: 'ar-06-counting-measure',
    track: 'reasoning', subtest: 'AR', order: 33,
    title: 'Counting, area and volume in words',
    summary: 'Fenceposts, and the geometry the AF puts in its own Arithmetic Reasoning syllabus rather than in Math Knowledge.',
    minutes: 13, bands: [2, 3, 4], prereqs: ['ar-01-translation'], testOutPass: 4,
    concepts: ['ar-fencepost', 'ar-perimeter-in-words', 'ar-area-in-words',
      'ar-volume-in-words', 'ar-cost-per-area'],
  },

  // --- Word Knowledge ------------------------------------------------------
  // 12.0 s/question. The subtest is pure recall, which makes it the most improvable one in the
  // whole project - and the only one where the right strategy beats raw memorisation, because
  // the vocabulary it draws from is unbounded and word PARTS are not.
  //
  // Chapters 2 and 3 come first in the prereq graph for that reason. The official AF syllabus
  // lists exactly two Word Knowledge modules and one of them is "Parts of a Word (prefix, root,
  // suffix)"; every official item's worked solution uses it at step 3. A memorised word earns
  // one item, a memorised root earns every word built on it.
  {
    id: 'wk-01-method',
    track: 'vocabulary', subtest: 'WK', order: 34,
    title: 'The method, and the twelve-second clock',
    summary: 'Five steps, and the two signals fast enough to use: connotation, and noticing when the question asked for the opposite.',
    minutes: 10, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['wk-connotation', 'wk-antonym-trap'],
  },
  {
    id: 'wk-02-roots',
    track: 'vocabulary', subtest: 'WK', order: 35,
    title: 'Latin and Greek roots',
    summary: 'The only Word Knowledge strategy that works on a word you have never seen.',
    minutes: 14, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['wk-latin-roots', 'wk-greek-roots'],
  },
  {
    id: 'wk-03-affixes',
    track: 'vocabulary', subtest: 'WK', order: 36,
    title: 'Prefixes and suffixes',
    summary: 'Prefixes change the meaning, suffixes change the part of speech. Both are worth more than any single word.',
    minutes: 13, bands: [2, 3, 4], prereqs: ['wk-02-roots'], testOutPass: 4,
    concepts: ['wk-prefix-negation', 'wk-prefix-direction-degree', 'wk-suffix-wordclass'],
  },
  {
    id: 'wk-04-confusables',
    track: 'vocabulary', subtest: 'WK', order: 37,
    title: 'Words that are mistaken for each other',
    summary: 'Every official item names one of these. They are the highest-yield thing in the subtest.',
    // 5/5 to test out. A confusable pair is worth two items and a candidate who has them
    // backwards is CONFIDENTLY wrong, which is exactly what a 4/5 gate waves through.
    minutes: 12, bands: [2, 3, 4], prereqs: [], testOutPass: 5,
    concepts: ['wk-confusable-pairs'],
  },
  {
    id: 'wk-05-vocab-people-speech',
    track: 'vocabulary', subtest: 'WK', order: 38,
    title: 'Core vocabulary I - people and speech',
    summary: 'Words for character and for how people talk and write. The densest cluster on the real subtest.',
    minutes: 15, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['wk-vocab-character', 'wk-vocab-speech'],
  },
  {
    id: 'wk-06-vocab-change-degree',
    track: 'vocabulary', subtest: 'WK', order: 39,
    title: 'Core vocabulary II - change, degree and judgment',
    summary: 'Words for things getting bigger, smaller, better or worse, and for approving and condemning.',
    minutes: 15, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['wk-vocab-change', 'wk-vocab-magnitude', 'wk-vocab-judgment'],
  },

  // HIGH-TIER VOCABULARY (chapters 7-12), added 2026-09-02.
  //
  // `bands: [4, 5]` throughout, and that is the whole point of them. Chapters 5-6 run 2-4 and
  // are where the bank already was; these six exist because band 5 did not exist at all, so
  // there was no tier above OATTS to stretch into. Sourcing and tier math live in
  // docs/afoqt/WORD-BANK-EXPANSION.md.
  //
  // `prereqs` point at chapters 2-4 (roots, affixes, confusables) rather than at chapters 5-6.
  // These words are not harder VERSIONS of the people-and-speech words; they are different
  // words. What actually transfers is the technique - and at band 5 the morphology is doing
  // more work than recall is, which is why the roots chapter is the gate.
  //
  // `testOutPass: 5` rather than 4: at this tier a single lucky guess out of five options is a
  // larger share of a short gate, and testing out of a chapter you have not met is worse here
  // than anywhere else in the curriculum - there is no easier chapter downstream to catch it.
  {
    id: 'wk-07-vocab-deception-truth',
    track: 'vocabulary', subtest: 'WK', order: 40,
    title: 'High-tier vocabulary I - deception and truth',
    summary: 'Words for lying, misleading and moral character, including the sound-alike pairs the official items lean on hardest.',
    minutes: 16, bands: [4, 5], prereqs: ['wk-04-confusables'], testOutPass: 5,
    concepts: ['wk-vocab-deception', 'wk-vocab-integrity'],
  },
  {
    id: 'wk-08-vocab-praise-blame',
    track: 'vocabulary', subtest: 'WK', order: 41,
    title: 'High-tier vocabulary II - praise, blame and scorn',
    summary: 'Approval and condemnation at GRE level. The cluster where connotation alone often answers the question.',
    minutes: 16, bands: [4, 5], prereqs: ['wk-04-confusables'], testOutPass: 5,
    concepts: ['wk-vocab-praise', 'wk-vocab-blame'],
  },
  {
    id: 'wk-09-vocab-temperament-mood',
    track: 'vocabulary', subtest: 'WK', order: 42,
    title: 'High-tier vocabulary III - temperament and mood',
    summary: 'What someone is like and how they feel, built around five near-identical pairs that mean different things.',
    minutes: 16, bands: [4, 5], prereqs: ['wk-04-confusables'], testOutPass: 5,
    concepts: ['wk-vocab-temperament', 'wk-vocab-mood'],
  },
  {
    id: 'wk-10-vocab-clarity-expression',
    track: 'vocabulary', subtest: 'WK', order: 43,
    title: 'High-tier vocabulary IV - clarity and expression',
    summary: 'How clearly something is said, how sharp a mind is, and the named forms writing and speech take.',
    minutes: 16, bands: [4, 5], prereqs: ['wk-02-roots'], testOutPass: 5,
    concepts: ['wk-vocab-clarity', 'wk-vocab-expression'],
  },
  {
    id: 'wk-11-vocab-abundance-harm',
    track: 'vocabulary', subtest: 'WK', order: 44,
    title: 'High-tier vocabulary V - abundance, scarcity and harm',
    summary: 'Too much, too little, healthy and harmful - and the bank’s densest run of near-opposite decoys.',
    minutes: 16, bands: [4, 5], prereqs: ['wk-02-roots'], testOutPass: 5,
    concepts: ['wk-vocab-supply', 'wk-vocab-harm'],
  },
  {
    id: 'wk-12-vocab-rigor-pace',
    track: 'vocabulary', subtest: 'WK', order: 45,
    title: 'High-tier vocabulary VI - rigour, obligation and pace',
    summary: 'How strictly a rule binds and how fast things move. Closes with proscribe/prescribe and ascetic/aesthetic.',
    minutes: 16, bands: [4, 5], prereqs: ['wk-02-roots'], testOutPass: 5,
    concepts: ['wk-vocab-rigor', 'wk-vocab-pace'],
  },
  {
    id: 'wk-13-vocab-power-defiance',
    track: 'vocabulary', subtest: 'WK', order: 46,
    title: 'High-tier vocabulary VII - power, authority and defiance',
    summary: 'Who holds power and how it is formally gained or given up, and who challenges, undermines or abuses it.',
    minutes: 16, bands: [4, 5], prereqs: ['wk-04-confusables'], testOutPass: 5,
    concepts: ['wk-vocab-power', 'wk-vocab-defiance'],
  },

  // PART 8 design, 2026-08-22. Source: docs/afoqt/RESEARCH.md "VA SOURCING" - 75 real
  // official-practice-style items (quizlet3.md, quizlet8.md) classified against the 10 official
  // AF relation concepts. Chapters group those 10 concepts into 5 clusters rather than 1:1,
  // same pattern WK used. Band is assigned by vocabulary rarity of the pair, not by
  // relation-type complexity - the real items show band separation comes from word rarity
  // (TENSION/STRESS reads at band 2; DOMINANCE/HEGEMONY reads at band 4), so PART 9's engine
  // should take a difficulty dependency on the existing WK word-band data rather than invent a
  // second scale.
  //
  // REOPENED 2026-08-23. Part/Part and Sequence - the two official concepts PART 8 left
  // deliberately undeclared because no clean example turned up in the 75-item quizlet sample -
  // now each have a real, sourced item: `afoqt/data/realQuestions.json`, official OATTS content
  // (provenance.kind: 'real', AFRL 2025-4499), a STRONGER source than the quizlet dumps PART 8
  // was working from. `oatts-VA-070` (Venus is to Saturn as Plane is to Bus) is Part/Part in its
  // own official explanation; `oatts-VA-072` (Prototype is to Product as Blueprint is to
  // Building) is Sequence. This is exactly the condition PART 8's record set for adding them -
  // "add them once a real sourced item demonstrates one" - not a backfill from memory. Both are
  // added to va-02-structure alongside the other two structural relations rather than as a new
  // chapter: all four (part-whole, member-category, part-part, sequence) are the same family of
  // skill - naming how two things are positioned relative to each other, as opposed to what one
  // does to the other (chapter 3) or what one means relative to the other (chapter 4).
  {
    id: 'va-01-method',
    track: 'analogies', subtest: 'VA', order: 40,
    title: 'The two formats, and what makes a pair wrong',
    summary: 'Complete the fourth term, or pick the whole matching pair - order matters in both. Then the two checks that catch a same-category trap.',
    minutes: 8, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['va-relation-format', 'va-relation-discriminators'],
  },
  {
    id: 'va-02-structure',
    track: 'analogies', subtest: 'VA', order: 41,
    title: 'Part to whole, member to category, part to part, and sequence',
    summary: 'The single biggest cluster in real items - about 3 in 10. A part must be the same KIND of part; a category must be the right level, not too broad or too narrow; two co-equal parts of one whole are a different relation again, and so is "this comes before that."',
    minutes: 14, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    // va-part-part and va-sequence added 2026-08-23 - see the REOPENED note above this array.
    concepts: ['va-part-whole', 'va-member-category', 'va-part-part', 'va-sequence'],
  },
  {
    id: 'va-03-cause-consequence',
    track: 'analogies', subtest: 'VA', order: 42,
    title: 'Cause to effect, and doer to action',
    summary: 'The effect must be direct, not a downstream side effect; the action must be the defining task, not an occasional one.',
    minutes: 11, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['va-cause-effect', 'va-action-object'],
  },
  {
    id: 'va-04-meaning-degree',
    track: 'analogies', subtest: 'VA', order: 43,
    title: 'Synonym, antonym and degree',
    summary: 'Same meaning, opposite meaning, or same direction at a different intensity - and telling a degree pair from a plain synonym pair.',
    minutes: 13, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    // Antonym is real but rare in the sample (4/75) - keep the row count modest relative to
    // the other two concepts here rather than treating all three as equally common.
    concepts: ['va-synonym', 'va-antonym', 'va-degree'],
  },
  {
    id: 'va-05-defining-traits',
    track: 'analogies', subtest: 'VA', order: 44,
    title: 'What defines it',
    summary: 'A person or thing paired with its defining quality, role, or the place that quality is exercised - not an incidental fact about it.',
    minutes: 11, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    // Folds in the "worker to workplace" pattern (~6/75 real items - beautician/salon,
    // cardiologist/heart) that does not cleanly match any of the 10 official concepts.
    // Treated as a variant of Object/Attribute (the role's defining domain) rather than an
    // 11th invented concept the official taxonomy does not name.
    concepts: ['va-object-attribute'],
  },
  {
    id: 'rc-01-method',
    track: 'reading', subtest: 'RC', order: 50,
    title: 'Approaching the passage',
    summary: 'How to manage time, navigate line numbers, and read PME/Joint-Force prose without getting bogged down in jargon.',
    minutes: 8, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['rc-time-management', 'rc-reading-strategy'],
  },
  {
    id: 'rc-02-main-idea',
    track: 'reading', subtest: 'RC', order: 51,
    title: 'Main idea and author intent',
    summary: 'Distinguishing the thesis from supporting details, and determining what the author actually agrees with.',
    minutes: 12, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['rc-main-idea', 'rc-author-agreement'],
  },
  {
    id: 'rc-03-details',
    track: 'reading', subtest: 'RC', order: 52,
    title: 'Details and paragraph function',
    summary: 'Scanning for specific details and understanding why a paragraph is structured the way it is.',
    minutes: 10, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['rc-detail-inference', 'rc-function-of-paragraph'],
  },
  {
    id: 'rc-04-vocabulary',
    track: 'reading', subtest: 'RC', order: 53,
    title: 'Vocabulary in context',
    summary: 'Inferring word meaning from surrounding context when the word has multiple meanings.',
    minutes: 10, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['rc-vocabulary-in-context'],
  },

  // --- Physical Science ------------------------------------------------------
  // Designed 2026-08-25 (Part 19, Claude-only curriculum design - see docs/afoqt/HANDOFF.md).
  // Grounded in the 25 official OATTS Physical Science items already in the repo
  // (afoqt/data/realQuestions.json, subtest: 'PS'), which split evenly across exactly 8 areas:
  // Astronomy, Atomic Physics, Chemistry, Electrical Physics, Light Physics, Mechanical
  // Physics, Sound Physics, Thermodynamics. One chapter per area - the same "traceable to a
  // real source" approach VA's Part 8 used, not the placeholder "mechanics/forces/energy" +
  // "matter/chemistry/earth-space" split HANDOFF.md originally sketched before this bank was
  // cross-checked (that split does not actually match the real taxonomy; see the design
  // record in HANDOFF.md for the full note).
  //
  // Reuses engine/facts.js AS-IS (built for Aviation Information, flagged reusable for this in
  // the Phase 5 completion notes) - no new engine file, unlike VA which needed engine/analogy.js.
  // Every question is one of the two fact-engine frames (identify / recall), same mechanism as
  // Aviation Information.
  //
  // Unscored (feeds no composite - see afoqtSpec.js SUBTESTS, PS: scored: false), but Trey's
  // stated goal is "dominate all the topics even if I'll never use them," and he confirmed
  // full-depth investment here (2026-08-25) rather than a lighter pass given the ~5-week
  // runway to test day - so this is sized to the same order of magnitude as Aviation
  // Information (374 facts / 64 templates / 11 chapters), not scaled down for being unscored.
  //
  // ⚠ MECHANICS OVERLAP WITH AVIATION INFORMATION, NAMED SO IT ISN'T DUPLICATED BY ACCIDENT.
  // av-02-forces (Aviation Information) already covers Newton's laws AS THEY APPLY TO FLIGHT -
  // an airfoil, lift/drag/thrust/weight, angle of attack. ps-06-mechanics covers the SAME
  // underlying physics from a general, non-aviation angle - blocks and ramps and tug-of-war,
  // not wings. Data-row authors for Part 20 (mechanics/forces/energy) should write facts a
  // civilian physics class would ask, not reach for aviation examples that already belong to
  // av-02-forces - two chapters teaching the identical fact under two different ids is exactly
  // the redundancy Doctrine rule 2 exists to avoid, even though the concepts are technically
  // scoped to different chapters and would not fail the mechanical coverage check.
  //
  // No chapter needs a dedicated "method" lesson the way rc-01-method or wk-01-method do -
  // there is no special technique here beyond direct recall, same as Aviation Information had
  // no ch00-method. Prereqs are mostly empty; the two real pedagogical dependencies (chemistry
  // building on atomic structure; sound and heat both resting on particle motion) are declared,
  // everything else stands alone the way most AI chapters do.
  {
    id: 'ps-01-astronomy',
    track: 'science', subtest: 'PS', order: 54,
    title: 'The solar system and the sky',
    summary: 'Planets, moons and comets; why the Earth has seasons; what causes an eclipse.',
    minutes: 13, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['ps-solar-system', 'ps-earth-motion-seasons', 'ps-eclipses-moon-phases',
      'ps-stars-and-universe'],
  },
  {
    id: 'ps-02-atomic-physics',
    track: 'science', subtest: 'PS', order: 55,
    title: 'Atoms, electrons and the periodic trends',
    summary: 'Protons, neutrons and mass number; what an electron does when it changes energy level; the trends that run across a period.',
    minutes: 13, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['ps-atomic-structure', 'ps-electron-energy-levels', 'ps-periodic-trends',
      'ps-radioactivity-decay'],
  },
  {
    id: 'ps-03-chemistry',
    track: 'science', subtest: 'PS', order: 56,
    title: 'States of matter and chemical change',
    summary: 'Solid, liquid, gas; how the periodic table is organised; telling a chemical change from a physical one.',
    minutes: 13, bands: [2, 3, 4], prereqs: ['ps-02-atomic-physics'], testOutPass: 4,
    concepts: ['ps-states-of-matter', 'ps-periodic-table-organization',
      'ps-physical-chemical-change', 'ps-acids-and-bases'],
  },
  {
    id: 'ps-04-electrical',
    track: 'science', subtest: 'PS', order: 57,
    title: 'Circuits, resistance and magnetism',
    summary: 'How current behaves in a series circuit, what changes a wire\'s resistance, and the link between electricity and magnetism.',
    minutes: 13, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['ps-circuit-fundamentals', 'ps-resistance-and-conductors',
      'ps-circuit-components', 'ps-magnetism-and-electromagnetism'],
  },
  {
    id: 'ps-05-light',
    track: 'science', subtest: 'PS', order: 58,
    title: 'Light, reflection and the spectrum',
    summary: 'What a light wave\'s properties actually determine, how reflection and refraction differ, and where visible light sits in the spectrum.',
    minutes: 13, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['ps-light-wave-properties', 'ps-reflection-and-refraction',
      'ps-lenses-and-mirrors', 'ps-electromagnetic-spectrum'],
  },
  {
    id: 'ps-06-mechanics',
    track: 'science', subtest: 'PS', order: 59,
    title: 'Forces, friction and simple machines',
    summary: 'The from-zero chapter here, same role av-01/02 play for Aviation Information - everyday forces, not flight.',
    minutes: 13, bands: [1, 2, 3], prereqs: [], testOutPass: 4,
    concepts: ['ps-newtons-laws-general', 'ps-friction', 'ps-simple-machines',
      'ps-equilibrium-and-net-force'],
  },
  {
    id: 'ps-07-sound',
    track: 'science', subtest: 'PS', order: 60,
    title: 'Sound waves and how they travel',
    summary: 'Compression and rarefaction, why sound is fastest in a solid, and what pitch actually depends on.',
    minutes: 10, bands: [2, 3, 4], prereqs: ['ps-06-mechanics'], testOutPass: 4,
    concepts: ['ps-sound-wave-properties', 'ps-sound-propagation-medium',
      'ps-wave-behavior-diffraction-doppler'],
  },
  {
    id: 'ps-08-thermodynamics',
    track: 'science', subtest: 'PS', order: 61,
    title: 'Heat, temperature and the laws of thermodynamics',
    summary: 'The three ways heat transfers, what the first law actually says, and what heating does to particles.',
    minutes: 10, bands: [2, 3, 4], prereqs: ['ps-06-mechanics'], testOutPass: 4,
    concepts: ['ps-heat-transfer-methods', 'ps-laws-of-thermodynamics',
      'ps-thermal-expansion-phase-change'],
  },

  // --- Situational Judgment ---------------------------------------------------
  // Designed 2026-08-26 (Part 24, Claude-only curriculum + engine design - see
  // docs/afoqt/HANDOFF.md "PART 24 design record"). Grounded in Barron's 4th Ed's full 25-scenario
  // Practice Test #1 SJT section (PDF 251-263), extracted and read directly - not reasoned about
  // from RESEARCH.md's summary, per the "check the primary source before designing" rule every
  // figure-bearing phase has needed. That extraction is scratchpad-only per the copyright line in
  // CLAUDE.md; nothing from it ships here verbatim.
  //
  // SIX CHAPTERS, ONE PER COMPETENCY (plus a method chapter), not one flat SJT chapter - the AFPC
  // pamphlet and Barron's both name six competencies (Integrity/Professionalism, Leadership,
  // Resource Management, Communication, Innovation, Mentoring; docs/afoqt/RESEARCH.md
  // "Situational Judgment"), and reading the 25 real scenarios confirms they cluster cleanly
  // against those six - the same "group by what the primary source actually shows" approach PS's
  // Part 19 used for its 8 areas, not an invented split.
  //
  // ⚠ INNOVATION IS THIN IN THE SOURCED SAMPLE. 24 of 25 scenarios turn on one of the other five
  // competencies; only one (a section leader inheriting an outdated, overdue-for-update process)
  // even brushes it, and that one reads more like leadership/delegation than a genuine "propose
  // and champion a new idea" situation. sjt-06-innovation is declared anyway, following the same
  // precedent VA's Part/Part and Sequence set (real but rare is still real) - but PART 25's author
  // should pull a second source (Trivium's SJT section, if it has one, or the AFPC pamphlet's own
  // examples) before writing this chapter's rows rather than inventing scenarios to fill it, which
  // is exactly the "orphan content wearing a doctrine-compliant label" failure the coverage check
  // cannot see.
  //
  // ⚠ SCENARIO COUNT: BARRON'S SHIPS 25, THE AFPC PEARSON NOTE SAYS 16 - RECORDED, NOT RESOLVED.
  // afoqtSpec.js's existing pearsonNote already flags "AFPC counts 50 questions across 16
  // scenarios; Pearson counts the 16 scenarios" - but Barron's actual Practice Test #1 SJT section
  // is 25 numbered situations, each producing exactly 2 questions (1-50), which is a DIFFERENT
  // structural claim than "16 scenarios x ~3 questions" would imply. Both are primary-lineage
  // sources (AFPC pamphlet vs. a book that reproduces two full official-style practice tests) and
  // they disagree on something as basic as the scenario count, not just a timing footnote. This
  // curriculum is built to 50 QUESTIONS as the fixed, undisputed number (every source agrees on
  // that), and does not commit to a fixed scenario-bank size - PART 25 should build as many
  // well-sourced scenarios as it reasonably can rather than stopping at either 16 or 25, since the
  // engine (engine/judgment.js) places no ceiling on bank size the way it would if the number 16
  // or 25 had been baked into the data model. Flagged here rather than silently picking one.
  //
  // NO PER-CHAPTER TEMPLATE VARIETY THE WAY MATH HAS BANDS OF PARAMETER RANGE. A scenario's
  // "band" is how CONTESTED the judgment call is (do competent officers mostly agree, or would
  // several actions have real merit), not vocabulary or arithmetic difficulty - see the `band`
  // doc in engine/judgment.js. Every chapter below targets bands [2, 3, 4] like every other
  // subtest's default range; a genuinely split-verdict scenario (Barron's own directions note the
  // official key sometimes accepts two answers on one item) is the natural band-5 `stretch`
  // candidate for later, the same role Trivium plays for MK - not seeded now since there is no
  // real bank yet to draw a genuinely-contested example from.
  {
    id: 'sjt-01-method',
    track: 'judgment', subtest: 'SJ', order: 62,
    title: 'How the subtest actually works',
    summary: 'Two questions per situation, back to back: MOST effective action, then LEAST. There is no penalty for guessing and no single "correct" answer key - your response is scored against the consensus of experienced officers.',
    minutes: 6, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    // No templates of its own - both concepts ride along on every scenarioTemplates() output,
    // the same role va-01-method plays for every relationTemplates() output (see the header
    // comment in engine/analogy.js for why that is not padding).
    concepts: ['sjt-judgment-format', 'sjt-competency-lens'],
  },
  {
    id: 'sjt-02-integrity-professionalism',
    track: 'judgment', subtest: 'SJ', order: 63,
    title: 'Integrity and professionalism',
    summary: 'Reporting the truth even when it is unwelcome, disclosing a personal conflict of interest before it becomes one, owning a mistake immediately rather than concealing it, and checking facts through the proper channel before acting on a suspicion.',
    minutes: 8, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['sjt-honest-reporting', 'sjt-conflict-of-interest', 'sjt-owning-mistakes',
      'sjt-fair-process-before-accusation'],
  },
  {
    id: 'sjt-03-leadership',
    track: 'judgment', subtest: 'SJ', order: 64,
    title: 'Leadership',
    summary: 'Acting decisively at your actual level of authority - neither overstepping it nor abdicating it - holding a standard while reading the team\'s state honestly, sequencing safety before mission before paperwork under real pressure, and addressing a difficult personality directly and privately rather than avoiding it or confronting it in public.',
    minutes: 10, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['sjt-situational-authority', 'sjt-standards-vs-morale', 'sjt-crisis-triage',
      'sjt-difficult-personalities'],
  },
  {
    id: 'sjt-04-resource-management',
    track: 'judgment', subtest: 'SJ', order: 65,
    title: 'Resource management',
    summary: 'Ranking competing demands instead of trying to do everything or picking arbitrarily, routing a request through the correct chain rather than around it, and communicating what is actually achievable rather than over-promising or flatly refusing.',
    minutes: 8, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['sjt-prioritization-under-scarcity', 'sjt-proper-channels-for-requests',
      'sjt-realistic-commitment'],
  },
  {
    id: 'sjt-05-communication',
    track: 'judgment', subtest: 'SJ', order: 66,
    title: 'Communication',
    summary: 'Delivering a hard message privately and specifically without embarrassing the other person, receiving criticism by seeking clarity instead of defending or deflecting, raising a genuine concern to a superior through reasoned explanation rather than staying silent or being insubordinate, and escalating to the person who can actually address it instead of accusing or acting on assumption.',
    minutes: 9, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['sjt-tactful-feedback', 'sjt-receiving-feedback', 'sjt-respectful-dissent',
      'sjt-proper-escalation'],
  },
  {
    id: 'sjt-06-innovation',
    track: 'judgment', subtest: 'SJ', order: 67,
    title: 'Innovation',
    summary: 'Identifying and acting on an outdated process at the right scale of authority, and weighing a new idea\'s real upside against its real cost rather than a reflexive yes or no. The thinnest chapter in the sourced sample - see the design-record note above this array before writing its rows.',
    minutes: 6, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['sjt-process-improvement', 'sjt-calculated-risk'],
  },
  {
    id: 'sjt-07-mentoring',
    track: 'judgment', subtest: 'SJ', order: 68,
    title: 'Mentoring',
    summary: 'Coaching a subordinate through a skill or follow-through gap instead of only directing or punishing, and making real time to develop someone without abandoning your own responsibilities.',
    minutes: 7, bands: [2, 3, 4], prereqs: [], testOutPass: 4,
    concepts: ['sjt-developmental-coaching', 'sjt-balancing-mentorship-with-workload'],
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));
export const getChapter = (id) => CHAPTER_BY_ID[id] ?? null;
export const chaptersForTrack = (trackId) =>
  CHAPTERS.filter((c) => c.track === trackId).sort((a, b) => a.order - b.order);
export const chaptersForSubtest = (code) =>
  CHAPTERS.filter((c) => c.subtest === code).sort((a, b) => a.order - b.order);

/** Which chapter claims a concept. Used by the coverage check and by "where was this taught?" */
export function chapterForConcept(conceptId) {
  return CHAPTERS.find((c) => c.concepts.includes(conceptId)) ?? null;
}

export const ALL_CONCEPTS = [...new Set(CHAPTERS.flatMap((c) => c.concepts))];

/** A chapter is available once every prerequisite is complete or tested out. */
export function isUnlocked(chapter, chapterState = {}) {
  return (chapter.prereqs ?? []).every((p) => {
    const st = chapterState[p];
    return st && (st.status === 'complete' || st.testedOut);
  });
}

export const TOTAL_LESSON_MINUTES = CHAPTERS.reduce((n, c) => n + c.minutes, 0);
