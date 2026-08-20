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
