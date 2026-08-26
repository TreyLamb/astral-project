// Lesson text, keyed by chapter id.
//
// Split out from chapters.js on purpose: `?raw` is a Vite import, so anything that touches
// this file can only run in the browser or under vitest. `npm run afoqt:coverage` runs on
// plain Node against chapters.js alone, and keeping the markdown out of there is what lets it.
//
// Lessons are markdown rather than JSX so a chapter can be edited (or handed to an outside
// contributor) without touching code. They render with react-markdown + remark-gfm, both
// already dependencies.

import ch01 from './chapters/mk/ch01-fluency.md?raw';
import ch02 from './chapters/mk/ch02-ratios.md?raw';
import ch03 from './chapters/mk/ch03-percent.md?raw';
import ch04 from './chapters/mk/ch04-linear.md?raw';
import ch05 from './chapters/mk/ch05-exponents.md?raw';
import ch06 from './chapters/mk/ch06-polynomials.md?raw';
import ch07 from './chapters/mk/ch07-quadratics.md?raw';
import ch08 from './chapters/mk/ch08-functions.md?raw';
import ch09 from './chapters/mk/ch09-geometry-foundations.md?raw';
import ch10 from './chapters/mk/ch10-geometry-measurement.md?raw';
import ch11 from './chapters/mk/ch11-right-triangles-solids.md?raw';
import ch12 from './chapters/mk/ch12-coordinate.md?raw';
import ch13 from './chapters/mk/ch13-probability-stats.md?raw';
import tr01 from './chapters/tr/ch01-table-reading.md?raw';
import av01 from './chapters/av/ch01-anatomy.md?raw';
import av02 from './chapters/av/ch02-forces.md?raw';
import av03 from './chapters/av/ch03-stalls.md?raw';
import av04 from './chapters/av/ch04-instruments.md?raw';
import av05 from './chapters/av/ch05-powerplant.md?raw';
import av06 from './chapters/av/ch06-airports.md?raw';
import av07 from './chapters/av/ch07-airspace.md?raw';
import av08 from './chapters/av/ch08-weather.md?raw';
import av09 from './chapters/av/ch09-vspeeds-rotary.md?raw';
import av10 from './chapters/av/ch10-aircraft-type.md?raw';
import av11 from './chapters/av/ch11-navigation.md?raw';
import ic01 from './chapters/ic/ch01-instruments.md?raw';
import bc01 from './chapters/bc/ch01-block-counting.md?raw';
import ar01 from './chapters/ar/ch01-translation.md?raw';
import ar02 from './chapters/ar/ch02-rates.md?raw';
import ar03 from './chapters/ar/ch03-proportion.md?raw';
import ar04 from './chapters/ar/ch04-percent-context.md?raw';
import ar05 from './chapters/ar/ch05-averages.md?raw';
import ar06 from './chapters/ar/ch06-counting-measure.md?raw';
import wk01 from './chapters/wk/ch01-method.md?raw';
import wk02 from './chapters/wk/ch02-roots.md?raw';
import wk03 from './chapters/wk/ch03-affixes.md?raw';
import wk04 from './chapters/wk/ch04-confusables.md?raw';
import wk05 from './chapters/wk/ch05-people-speech.md?raw';
import wk06 from './chapters/wk/ch06-change-degree.md?raw';
import va01 from './chapters/va/ch01-method.md?raw';
import va02 from './chapters/va/ch02-structure.md?raw';
import va03 from './chapters/va/ch03-cause-consequence.md?raw';
import va04 from './chapters/va/ch04-meaning-degree.md?raw';
import va05 from './chapters/va/ch05-defining-traits.md?raw';

export const LESSONS = {
  'mk-01-fluency': ch01,
  'mk-02-ratios': ch02,
  'mk-03-percent': ch03,
  'mk-04-linear': ch04,
  'mk-05-exponents': ch05,
  'mk-06-polynomials': ch06,
  'mk-07-quadratics': ch07,
  'mk-08-functions': ch08,
  'mk-09-geometry-foundations': ch09,
  'mk-10-geometry-measurement': ch10,
  'mk-11-right-triangles-solids': ch11,
  'mk-12-coordinate': ch12,
  'mk-13-probability-stats': ch13,
  'tr-01-table-reading': tr01,
  'av-01-anatomy': av01,
  'av-02-forces': av02,
  'av-03-stalls': av03,
  'av-04-instruments': av04,
  'av-05-powerplant': av05,
  'av-06-airports': av06,
  'av-07-airspace': av07,
  'av-08-weather': av08,
  'av-09-vspeeds-rotary': av09,
  'av-10-aircraft-type': av10,
  'av-11-navigation': av11,
  'ic-01-instruments': ic01,
  'bc-01-block-counting': bc01,
  'ar-01-translation': ar01,
  'ar-02-rates': ar02,
  'ar-03-proportion': ar03,
  'ar-04-percent-context': ar04,
  'ar-05-averages': ar05,
  'ar-06-counting-measure': ar06,
  'wk-01-method': wk01,
  'wk-02-roots': wk02,
  'wk-03-affixes': wk03,
  'wk-04-confusables': wk04,
  'wk-05-vocab-people-speech': wk05,
  'wk-06-vocab-change-degree': wk06,
  'va-01-method': va01,
  'va-02-structure': va02,
  'va-03-cause-consequence': va03,
  'va-04-meaning-degree': va04,
  'va-05-defining-traits': va05,
};

export const getLesson = (chapterId) => LESSONS[chapterId] ?? null;
