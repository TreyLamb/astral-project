// Barrel: every chapter's templates self-register on import. Mirrors afoqt/templates/index.js.
import './toolbox.js';
import './ch01-atomic-structure.js';
import './ch02-electronic-structure.js';
import './ch03-mole-calculations.js';
import './ch04-stoichiometry.js';
import './ch05-solutions-aqueous-1.js';
import './ch06-heat-enthalpy.js';
import './ch07-structure-bonding.js';
import './ch08-states-of-matter.js';

// Exam 1 review sheet from the instructor (2026-09-09): the gaps his own Ch 1-2 Review
// surfaced that nothing in the bank could ask. See rev1-ch00-toolbox.js's header.
import './rev1-ch00-toolbox.js';
import './rev1-ch01-atomic-structure.js';

// Gaps found by auditing the bank against his ACTUAL assigned textbook (AcademiQ), rather than
// against the ACS study guide the first 88 templates were built from.
import './academiq-ch01-essential-ideas.js';

// Built from his OWN GRADED QUIZZES (Canvas attempt reviews). Highest-fidelity source there
// is - his instructor's actual wording, distractors and marked answers. Read that file's header
// before opening those PDFs: they have no text layer and the questions start on page 3.
import './quiz-ch01-observed.js';

// Exam 2 (ch 1-4): AcademiQ ch 3-4 end-of-section exercises with CORRECTED keys, plus generated
// templates for the ch 3-4 skills nothing could ask. Read that file's header before trusting a
// book answer key.
import './academiq-ch03-ch04.js';

// His REAL Ch 1-2 items (graded AcademiQ quizzes, the professor's review sheet, the book's Ch 2
// exercises), recovered from an unpushed 2026-09-08 session. See that file's header.
import './real-items-ch01-ch02.js';
