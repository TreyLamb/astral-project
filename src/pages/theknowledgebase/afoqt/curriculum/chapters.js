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
    id: 'perceptual',
    name: 'Perceptual speed',
    subtest: 'TR',
    blurb: 'Table Reading feeds all three rated composites and is pure trainable speed - no knowledge to forget. 40 questions in 7 minutes is 10.5s each, and most people do not finish.',
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
      'factor-difference-of-squares', 'factor-trinomial', 'factor-ac-method'],
  },
  {
    id: 'mk-07-quadratics',
    track: 'math', subtest: 'MK', order: 7,
    title: 'Quadratics',
    summary: 'Roots by factoring, the formula for when nothing factors, and the discriminant as a shortcut.',
    minutes: 13, bands: [3, 4], prereqs: ['mk-06-polynomials'], testOutPass: 4,
    concepts: ['quadratic-by-factoring', 'quadratic-formula', 'discriminant', 'vertex-and-roots'],
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
      'volume-prism-cylinder', 'volume-cone-sphere', 'surface-area'],
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
    track: 'perceptual', subtest: 'BC', order: 27,
    title: 'Block Counting - the method',
    summary: 'Faces touch, corners do not. Count above, below, alongside - then see into the pile.',
    minutes: 9, bands: [1, 2, 3, 4], prereqs: [], testOutPass: 5,
    concepts: ['block-face-contact', 'block-corner-exclusion',
      'block-hidden-inference', 'block-scan-order'],
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
