// Canvas coursework, read onto the fitness calendar.
//
// The snapshot belongs to TKB — `npm run canvas -- --from-capture canvas-capture.json`
// writes src/pages/theknowledgebase/courses/data/canvasSchedule.json and /TKB/courses/dashboard
// renders it. MFT IMPORTS that same file rather than keeping a second copy, so one capture
// refreshes both surfaces. Strictly read-only here: nothing on the calendar writes back.

import SNAPSHOT from '../theknowledgebase/courses/data/canvasSchedule.json';

// Canvas's own per-course colours, lifted a few stops for this dark theme — Canvas picks them
// against a white page (CHEM's #0374B5 is unreadable on --ft-panel). Same hues, so a course is
// still recognisable between the two tools.
const COURSE_COLORS = {
  'CHEM 1210': '#38bdf8',
  'MICR 2060': '#34d399',
  'MICR 2065': '#c084fc',
};
const FALLBACK_COLOR = '#94a3b8';

export const courseColor = (code) => COURSE_COLORS[code] ?? FALLBACK_COLOR;

// Finished — never something still to do. Note that a capture taken without submission data
// reports every row as 'unknown', which is NOT done: an unknown item stays on the list, because
// hiding work you might still owe is the one failure mode that actually costs points.
const DONE = new Set(['graded', 'submitted', 'excused']);

// Short tag for the chip. `kind` comes straight off Canvas.
const KIND_ABBR = { quiz: 'quiz', assignment: 'asgn', discussion: 'disc', exam: 'exam' };
export const kindAbbr = (kind) => KIND_ABBR[kind] ?? (kind || 'item');

function buildTasks() {
  const out = [];
  for (const course of Object.values(SNAPSHOT.courses ?? {})) {
    for (const row of course.schedule ?? []) {
      if (!row.due) continue; // undated items exist and belong on no calendar day
      out.push({
        // Canvas assignment ids are unique per course only; the code prefix makes it global.
        id: `${course.code}::${row.id}`,
        code: course.code,
        name: (row.name || '').trim(),
        kind: row.kind || null,
        due: row.due,
        dueTime: row.dueTime || null,
        points: row.points ?? null,
        questions: row.questions ?? null,
        timeLimit: row.timeLimit ?? null,
        url: row.url || null,
        status: row.status || 'unknown',
        done: DONE.has(row.status),
        color: courseColor(course.code),
      });
    }
  }
  // Sort by date, then course, so a day's items always come out in the same order.
  out.sort((a, b) => (a.due === b.due ? a.code.localeCompare(b.code) : a.due.localeCompare(b.due)));
  return out;
}

// Computed once at module load: a static import can't change at runtime.
export const COURSE_TASKS = buildTasks();

export const COURSE_SYNCED_AT = SNAPSHOT.generatedAt || null;

export const COURSE_CODES = [...new Set(COURSE_TASKS.map((t) => t.code))];

/** { 'YYYY-MM-DD': Task[] } — what the day cells index into. */
export const COURSE_TASKS_BY_DATE = COURSE_TASKS.reduce((map, t) => {
  (map[t.due] ||= []).push(t);
  return map;
}, {});

/** Inclusive on both ends — the week columns hand it a Sunday and a Saturday. */
export function courseTasksInRange(fromISO, toISO) {
  return COURSE_TASKS.filter((t) => t.due >= fromISO && t.due <= toISO);
}

/** Still owed as of `todayISO`, oldest first. */
export function overdueCourseTasks(todayISO) {
  return COURSE_TASKS.filter((t) => t.due < todayISO && !t.done);
}

/** Open items from today out to `days` ahead, in date order. */
export function upcomingCourseTasks(todayISO, days) {
  if (days == null) return COURSE_TASKS.filter((t) => t.due >= todayISO && !t.done);
  const end = new Date(`${todayISO}T00:00:00`);
  end.setDate(end.getDate() + days);
  const endISO = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  return COURSE_TASKS.filter((t) => t.due >= todayISO && t.due <= endISO && !t.done);
}

/** [[dayISO, Task[]], …] in date order — the rail renders day headers off this. */
export function groupByDay(tasks) {
  const map = new Map();
  for (const t of tasks) {
    if (!map.has(t.due)) map.set(t.due, []);
    map.get(t.due).push(t);
  }
  return [...map.entries()];
}
