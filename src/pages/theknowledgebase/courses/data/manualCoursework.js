// Coursework facts no LMS feed carries — maintained by the agent (see courses/SCHOOL-OPS.md §8).
//
// Two kinds of entry:
//   PATCHES  fill a gap on an item an LMS already has (CHEM's exams are Canvas assignments with
//            no due date — the syllabus leaves every midterm date null). Matched by course +
//            exact title, so a re-capture of the snapshot keeps the patch applying.
//   EXTRA    whole items nothing else knows about (an in-class event, a Learning Suite course
//            that never publishes a feed).
//
// Every entry carries `source` — who said it and when. A date with no source is a guess, and a
// guessed exam date is worse than a missing one (AGENT-PROMPT.md §6A). If Trey says it in chat,
// the source is "Trey, <date>".

export const COURSEWORK_PATCHES = [
  {
    match: { course: 'CHEM 1210', title: 'Exam 2' },
    set: { due: '2026-10-07', dueTime: '1:00 PM', kind: 'exam', note: 'Ch 1-4, cumulative. In class.' },
    source: 'Trey, 2026-10-06 ("The exam is tomorrow"); class meets 1:00 PM',
  },
  {
    match: { course: 'CHEM 1210', title: 'Final Exam' },
    set: { due: '2026-12-07', dueTime: '1:00 PM', kind: 'exam', note: 'ACS standardized, comprehensive, no makeup.' },
    source: 'CHEM 1210 syllabus (data/syllabi.json)',
  },
  {
    match: { course: 'CHEM 1210', title: 'Exam 1' },
    set: { kind: 'exam', note: 'Ch 1-2. Scored 76/100.' },
    source: 'Canvas capture 2026-09-18 (score)',
  },
];

export const COURSEWORK_EXTRA = [];
