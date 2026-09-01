// Lesson markdown, ?raw-imported per chapter. Mirrors afoqt/curriculum/lessons.js's flat
// hand-written import map exactly, for the same reason: ?raw only works in the browser/vitest,
// not plain Node, so this stays a separate file from curriculum.js (which the selftest/coverage
// scripts load under plain node).

import toolbox from './lessons/toolbox.md?raw';
import ch01 from './lessons/ch01-atomic-structure.md?raw';
import ch02 from './lessons/ch02-electronic-structure.md?raw';
import ch03 from './lessons/ch03-mole-calculations.md?raw';
import ch04 from './lessons/ch04-stoichiometry.md?raw';
import ch05 from './lessons/ch05-solutions-aqueous-1.md?raw';
import ch06 from './lessons/ch06-heat-enthalpy.md?raw';
import ch07 from './lessons/ch07-structure-bonding.md?raw';
import ch08 from './lessons/ch08-states-of-matter.md?raw';

export const CHEM_LESSONS = {
  'chem1-00-toolbox': toolbox,
  'chem1-01-atomic-structure': ch01,
  'chem1-02-electronic-structure': ch02,
  'chem1-03-mole-calculations': ch03,
  'chem1-04-stoichiometry': ch04,
  'chem1-05-solutions-aqueous-1': ch05,
  'chem1-06-heat-enthalpy': ch06,
  'chem1-07-structure-bonding': ch07,
  'chem1-08-states-of-matter': ch08,
};

export const getChemLesson = (chapterId) => CHEM_LESSONS[chapterId] ?? null;
