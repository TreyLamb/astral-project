// Coursework on the fitness calendar — LIVE, from the shared coursework model
// (src/pages/theknowledgebase/courses/coursework/, owner doc courses/SCHOOL-OPS.md).
//
// Until 2026-10-06 this module froze TKB's Canvas snapshot at import time. Two things that hid:
//   - every item past its due date whose captured status was 'todo' — neither "past due" nor
//     "no status", just gone (Quizzes 9-13 and a dozen MICR items vanished this way), and
//   - every undated item, which is how CHEM Exam 2 was missing the day before it happened.
// The model now carries those as `past-unverified` and patched-in exam dates, plus his own
// check-offs and the school feeds pulled through Google Calendar. Read-only toward Canvas: a
// check-off lives in his prefs and is never written back to an LMS.

import { useCoursework } from '../theknowledgebase/courses/coursework/useCoursework';

export { courseColor } from '../theknowledgebase/courses/coursework/courseworkModel';

const KIND_ABBR = { quiz: 'quiz', assignment: 'asgn', discussion: 'disc', exam: 'exam' };
export const kindAbbr = (kind) => KIND_ABBR[kind] ?? (kind || 'item');

/** { byDate, inRange, tasks, upcoming, doNext, missing, pastUnverified, undated, meta, actions } */
export const useCourseTasks = useCoursework;

/** [[dayISO, Task[]], …] in date order — the rail renders day headers off this. */
export function groupByDay(tasks) {
  const map = new Map();
  for (const t of tasks) {
    if (!map.has(t.due)) map.set(t.due, []);
    map.get(t.due).push(t);
  }
  return [...map.entries()];
}
