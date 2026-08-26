// Template registry barrel. Every template module self-registers on import, so this file
// is the single place that decides what exists.
//
// READ docs/afoqt/QUESTION-DOCTRINE.md BEFORE ADDING ONE.
//   - `band` (1-5) is the difficulty rule made structural: a template emits instances only
//     inside its own band. A harder question needs a DIFFERENT template.
//   - Distractors must be ERROR-MODES (sign slip, forgot to halve, radius-vs-diameter),
//     never random numbers. Random distractors are trivially eliminable and teach nothing.
//   - `concepts` must match ids declared by a curriculum chapter, or afoqt:coverage fails.
//
// One file per curriculum chapter, so "what does chapter 7 test?" is answered by opening
// chapter 7. Phases 4-13 add the remaining subtests alongside these.

// --- Math Knowledge (Phase 3) ----------------------------------------------
import './mk/ch01-fluency.js';
import './mk/ch02-ratios.js';
import './mk/ch03-percent.js';
import './mk/ch04-linear.js';
import './mk/ch05-exponents.js';
import './mk/ch06-polynomials.js';
import './mk/ch07-quadratics.js';
import './mk/ch08-functions.js';
import './mk/ch09-geometry-foundations.js';
import './mk/ch10-geometry-measurement.js';
import './mk/ch11-right-triangles-solids.js';
import './mk/ch12-coordinate.js';
import './mk/ch13-probability-stats.js';

// --- Arithmetic Reasoning (Phase 8) ----------------------------------------
// 69.6s per question, the most generous clock on the test - so difficulty here is reading and
// setting up, never arithmetic weight. Chapter 1 is the translation spine deferred from the
// Math Knowledge build; chapters 2-6 are the prose families the official items actually use.
// Concepts are `ar-` prefixed because Math Knowledge already owns the bare names.
import './ar/ch01-translation.js';
import './ar/ch02-rates.js';
import './ar/ch03-proportion.js';
import './ar/ch04-percent-context.js';
import './ar/ch05-averages.js';
import './ar/ch06-counting-measure.js';

// --- Word Knowledge (Phase 9) ----------------------------------------------
// 12.0 s/question, and pure recall - the most improvable subtest in the project. Two engines:
// engine/words.js (vocabulary rows, each declaring its own four error-mode distractors) and
// engine/morphology.js (roots, affixes and the sound-alike pairs every official item names).
import './wk/ch01-method.js';
import './wk/ch02-roots.js';
import './wk/ch03-affixes.js';
import './wk/ch04-confusables.js';
import './wk/ch05-people-speech.js';
import './wk/ch06-change-degree.js';

// --- Table Reading (Phase 4) -----------------------------------------------
// One chapter, because the subtest is one skill performed 40 times. Difficulty is scan
// distance across the real 33x33 grid, never a smaller grid - see the file header.
import './tr/ch01-table-reading.js';

// --- Aviation Information (Phase 5) ----------------------------------------
// Fact-driven: each chapter registers its facts, then builds two question frames per band.
// See engine/facts.js for why distractors are declared confusions rather than generated.
import './av/ch01-anatomy.js';
import './av/ch02-forces.js';
import './av/ch03-stalls.js';
import './av/ch04-instruments.js';
import './av/ch05-powerplant.js';
import './av/ch06-airports.js';
import './av/ch07-airspace.js';
import './av/ch08-weather.js';
import './av/ch09-vspeeds-rotary.js';
import './av/ch10-aircraft-type.js';
import './av/ch11-navigation.js';

// --- Instrument Comprehension (Phase 6) ------------------------------------
// The only subtest with FOUR options. Bank is inverted and the viewer always looks north -
// see engine/attitude.js, which carries the geometry and the official distractor formula.
import './ic/ch01-instruments.js';

// --- Block Counting (Phase 7) -----------------------------------------------
// 9.0 s/question, the tightest clock on the test. Corner contacts do not count, and the
// answer key shifts range every question and can run descending - see engine/blocks.js.
import './bc/ch01-block-counting.js';

// --- Verbal Analogies (Phase 10) --------------------------------------------
// Relation-pair rows against engine/analogy.js. Format 2 ("pick the matching pair") is the
// primary frame - it outnumbers format 1 roughly 3:1 in the sourced sample.
import './va/ch02-structure.js';
import './va/ch03-cause-consequence.js';
import './va/ch04-meaning-degree.js';
import './va/ch05-defining-traits.js';

// --- Reading Comprehension (Phase 11) ---------------------------------------
// Sheet mode: one passage stays on screen for a run of consecutive questions - see the header
// comment in engine/passage.js. Set A covers bands 2-3; ch02-passages-set-B.js (PART 16) covers
// bands 4-5 of the same three chapters.
import './rc/ch01-passages-set-A.js';
import './rc/ch02-passages-set-B.js';

// --- Physical Science (Phase 12) --------------------------------------------
// Fact-driven, same engine/facts.js as Aviation Information - see PART 19's design record in
// docs/afoqt/HANDOFF.md for why no new engine was needed.
import './ps/ch01-astronomy.js';
import './ps/ch02-atomic-physics.js';
import './ps/ch03-chemistry.js';
import './ps/ch04-electrical.js';
import './ps/ch05-light.js';
import './ps/ch06-mechanics.js';
import './ps/ch07-sound.js';
import './ps/ch08-thermodynamics.js';
