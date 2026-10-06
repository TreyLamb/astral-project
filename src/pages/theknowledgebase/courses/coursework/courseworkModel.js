// Everything Trey owes, from every source, as one list — pure, so both MFT's calendar and TKB's
// course pages render the same truth and vitest can pin every rule. Owner: courses/SCHOOL-OPS.md.
//
// Sources, merged in this order (later ones refine earlier ones):
//   1. Canvas snapshot (data/canvasSchedule.json) — the only source of status, score, points and
//      the date an item OPENS. Stale the moment it is captured.
//   2. Canvas calendar feed (.ics) — fresher due dates, and every course Canvas has (it is how
//      ESFF/ESMG appear without a re-capture). No status, no points, no open date.
//   3. Learning Suite feeds (.ics, one per BYU course) — the AERO courses.
//   4. Manual patches/extras (data/manualCoursework.js) and items Trey adds himself.
// …then his own check-offs, which override any LMS status (both directions).

export const COURSE_COLORS = {
  'CHEM 1210': '#38bdf8',
  'MICR 2060': '#34d399',
  'MICR 2065': '#c084fc',
  'ESFF 1120': '#fb923c',
  'ESMG 3200': '#f472b6',
  'AERO 1100': '#93c5fd',
  'AERO 2100': '#a5b4fc',
  'AERO 1430R': '#7dd3fc',
  'AERO 1800R': '#c4b5fd',
  'AERO 2000': '#818cf8',
};
const FALLBACK_COLOR = '#94a3b8';
export const courseColor = (code) => COURSE_COLORS[code] ?? FALLBACK_COLOR;

const DONE_STATUSES = new Set(['graded', 'submitted', 'excused', 'complete']);

// Running grade buckets, not things to do: "Attendance", "Lab 3 Participation Score", "Roll Call
// Attendance", CHEM's single undated "Homework" total. Only when undated — a dated "Homework 4"
// is real work.
const BUCKET = /\battendance\b|participation score|roll call|^homework$/i;

// ---------------------------------------------------------------------------------------------
// dates (plain YYYY-MM-DD strings, local calendar days — the same frame MFT's calendar uses)
// ---------------------------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, '0');
export const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayLocalISO = () => isoOf(new Date());

export function addDaysISO(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

export function daysBetween(fromISO, toISO) {
  return Math.round((new Date(`${toISO}T00:00:00`) - new Date(`${fromISO}T00:00:00`)) / 86400000);
}

const maxISO = (a, b) => (!a ? b : !b ? a : a > b ? a : b);

/** Sort key that puts an untimed item after a timed one on the same day. */
export function minutesOf(time) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(time ?? '').trim());
  if (!m) return 24 * 60;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

// ---------------------------------------------------------------------------------------------
// classification
// ---------------------------------------------------------------------------------------------

export function kindOf(title, rawKind) {
  const t = String(title ?? '');
  if (/\b(exam|midterm)\b|\bfinal\b/i.test(t)) return 'exam';
  if (rawKind) return rawKind;
  if (/\bquiz|\bolq\b|\btest\b/i.test(t)) return 'quiz';
  return 'assignment';
}

/**
 * How many days before the due date to START. A coaching rule, not a measurement: an 8-point
 * quiz is an evening's work; a 125-point cumulative exam is a week of spaced review. Tunable here
 * and nowhere else, so the reasoning lives in one place (SCHOOL-OPS.md §2, workstream 2).
 */
export function leadDays(item) {
  if (item.kind === 'exam') return (item.points ?? 100) >= 100 ? 7 : 4;
  const p = item.points;
  if (p == null) return 2;
  if (p <= 10) return 1;
  if (p <= 20) return 2;
  if (p <= 50) return 4;
  return 6;
}

// ---------------------------------------------------------------------------------------------
// source adapters
// ---------------------------------------------------------------------------------------------

function snapshotStatus(r) {
  // A graded exam can come back as status 'todo' with a score on it (Exam 1 did).
  if (r.score != null && (r.status === 'todo' || r.status === 'unknown' || !r.status)) return 'graded';
  return r.status || 'unknown';
}

export function fromSnapshot(snapshot) {
  const items = [];
  const capturedOn = snapshot?.generatedAt ? String(snapshot.generatedAt).slice(0, 10) : null;
  for (const course of Object.values(snapshot?.courses ?? {})) {
    for (const r of course.schedule ?? []) {
      const name = String(r.name ?? '').trim();
      items.push({
        id: `canvas:${r.id}`,
        lms: 'canvas',
        code: course.code,
        name,
        kind: !r.due && BUCKET.test(name) ? 'bucket' : kindOf(name, r.kind),
        due: r.due || null,
        dueTime: r.dueTime || null,
        dueAt: r.dueAt || null,
        opens: r.unlock ? String(r.unlock).slice(0, 10) : null,
        points: r.points ?? null,
        questions: r.questions ?? null,
        timeLimit: r.timeLimit ?? null,
        url: r.url || null,
        score: r.score ?? null,
        status: snapshotStatus(r),
        statusAsOf: capturedOn,
        sources: ['snapshot'],
      });
    }
  }
  return items;
}

/** Canvas course id -> course code, learned from the snapshot's own URLs. */
export function canvasCourseIds(snapshot) {
  const map = {};
  for (const course of Object.values(snapshot?.courses ?? {})) {
    for (const r of course.schedule ?? []) {
      const m = /\/courses\/(\d+)\//.exec(r.url || '');
      if (m) map[m[1]] = course.code;
    }
  }
  return map;
}

export function canvasAssignmentId(ev) {
  const m = /event-assignment-(\d+)/.exec(ev.uid || '') || /\/assignments\/(\d+)/.exec(ev.url || '');
  return m ? m[1] : null;
}

/** "Quiz 14, Sec 4-6 [CHEM-1210-004 Fall 2026]" -> "CHEM 1210" */
export function courseFromSummary(summary) {
  const m = /\[\s*([A-Z]{2,5})[\s-]?(\d{3,4}[A-Z]?)\b[^\]]*\]\s*$/.exec(String(summary ?? ''));
  return m ? `${m[1]} ${m[2]}` : null;
}

export const stripCourseTag = (summary) => String(summary ?? '').replace(/\s*\[[^\]]*\]\s*$/, '').trim();

/**
 * Fold one Canvas feed into the item list in place. Matching is by Canvas assignment id, so the
 * feed refreshes a snapshot item's due date without losing its status/points/open date.
 */
export function mergeCanvasFeed(items, events, courseIds) {
  const byId = new Map(items.map((it) => [it.id, it]));
  for (const ev of events) {
    if (!ev.start) continue;
    const aid = canvasAssignmentId(ev);
    const id = aid ? `canvas:${aid}` : `canvas-ev:${ev.uid}`;
    const existing = byId.get(id);
    if (existing) {
      existing.due = ev.start.date;
      existing.dueTime = ev.start.time;
      existing.dueAt = ev.start.at;
      if (!existing.sources.includes('canvas-feed')) existing.sources.push('canvas-feed');
      continue;
    }
    const courseId = /\/courses\/(\d+)\//.exec(ev.url || '')?.[1];
    const name = stripCourseTag(ev.summary);
    const item = {
      id,
      lms: 'canvas',
      code: courseFromSummary(ev.summary) || courseIds[courseId] || 'Canvas',
      name,
      kind: aid ? kindOf(name, null) : 'event',
      due: ev.start.date,
      dueTime: ev.start.time,
      dueAt: ev.start.at,
      opens: null,
      points: null,
      url: ev.url,
      score: null,
      status: 'unknown',
      statusAsOf: null,
      sources: ['canvas-feed'],
    };
    items.push(item);
    byId.set(id, item);
  }
  return items;
}

/** One Learning Suite course feed. Every entry is treated as work: hiding owed work costs points. */
export function mergeLearningSuiteFeed(items, events, feed) {
  for (const ev of events) {
    if (!ev.start) continue;
    const key = ev.uid || `${ev.summary}|${ev.start.date}`;
    items.push({
      id: `ls:${feed.id}:${key}`,
      lms: 'learningsuite',
      code: feed.course || feed.label || 'BYU',
      name: ev.summary || '(untitled)',
      kind: kindOf(ev.summary, null),
      due: ev.start.date,
      dueTime: ev.start.time,
      dueAt: ev.start.at,
      opens: null,
      points: null,
      url: ev.url || feed.courseUrl || null,
      score: null,
      status: 'unknown',
      statusAsOf: null,
      note: ev.description ? ev.description.slice(0, 280) : undefined,
      sources: ['ls-feed'],
    });
  }
  return items;
}

const norm = (s) => String(s ?? '').trim().toLowerCase();

export function applyPatches(items, patches) {
  for (const p of patches ?? []) {
    for (const it of items) {
      if (it.code === p.match.course && norm(it.name) === norm(p.match.title)) {
        Object.assign(it, p.set);
        it.patchSource = p.source;
        if (!it.sources.includes('manual')) it.sources.push('manual');
      }
    }
  }
  return items;
}

export function addExtras(items, extras, origin) {
  for (const x of extras ?? []) {
    items.push({
      lms: origin,
      opens: null,
      points: null,
      url: null,
      score: null,
      status: 'unknown',
      statusAsOf: null,
      dueTime: null,
      dueAt: null,
      ...x,
      code: x.code ?? x.course,
      name: x.name ?? x.title,
      kind: x.kind ?? kindOf(x.name ?? x.title, null),
      sources: [origin],
    });
  }
  return items;
}

// ---------------------------------------------------------------------------------------------
// enrichment + views
// ---------------------------------------------------------------------------------------------

/**
 * @param {Object} item
 * @param {string} todayISO
 * @param {Object<string,{v:boolean,t:number}>} done  his check-offs, last write wins per id
 * @param {Object<string,number>} courseTotals          points per course, for % of grade
 */
export function enrich(item, todayISO, done = {}, courseTotals = {}) {
  const mark = done[item.id];
  const lmsDone = DONE_STATUSES.has(item.status);
  // v: null is a cleared override (a tombstone, so the merge can't resurrect an older mark).
  const overridden = mark != null && mark.v != null;
  const isDone = overridden ? mark.v === true : lmsDone;
  const daysLeft = item.due ? daysBetween(todayISO, item.due) : null;

  let state;
  if (item.kind === 'bucket') state = 'bucket';
  else if (isDone) state = 'done';
  else if (!item.due) state = 'undated';
  else if (daysLeft < 0) state = item.status === 'missing' ? 'missing' : 'past-unverified';
  else state = 'upcoming';

  const lead = leadDays(item);
  // For an exam, "opens" is when it can be TAKEN; studying for it starts a week out regardless.
  // For everything else the work itself is locked until it opens, so the start date waits.
  const isExam = item.kind === 'exam';
  const startBy = item.due
    ? (isExam ? addDaysISO(item.due, -lead) : maxISO(item.opens, addDaysISO(item.due, -lead)))
    : null;
  const opensLater = !!item.opens && item.opens > todayISO;
  const total = courseTotals[item.code];
  return {
    ...item,
    color: courseColor(item.code),
    done: isDone,
    checkedOff: overridden,
    state,
    daysLeft,
    lead,
    startBy,
    opensLater,
    // "In the window" = it is time to be working on this, and it is open.
    inWindow: state === 'upcoming' && startBy <= todayISO && (isExam || !opensLater),
    // Points per day of runway left. Exams get a bump: they are cumulative and unrecoverable.
    priority: state === 'upcoming'
      ? ((item.points ?? 5) / (daysLeft + 1)) * (item.kind === 'exam' ? 1.5 : 1)
      : 0,
    pctOfGrade: item.points != null && total ? (item.points / total) * 100 : null,
  };
}

export function byDueThenCourse(a, b) {
  if (a.due !== b.due) return String(a.due ?? '9999').localeCompare(String(b.due ?? '9999'));
  const t = minutesOf(a.dueTime) - minutesOf(b.dueTime);
  if (t) return t;
  return a.code.localeCompare(b.code);
}

/**
 * Build the full, enriched list plus the views every surface needs.
 */
export function buildCoursework({
  snapshot, canvasFeeds = [], lsFeeds = [], patches = [], extras = [], userItems = [],
  done = {}, todayISO = todayLocalISO(), courseTotals = null,
}) {
  let items = fromSnapshot(snapshot);
  const ids = canvasCourseIds(snapshot);
  for (const f of canvasFeeds) mergeCanvasFeed(items, f.events ?? [], ids);
  for (const f of lsFeeds) mergeLearningSuiteFeed(items, f.events ?? [], f);
  addExtras(items, extras, 'manual');
  addExtras(items, userItems, 'user');
  applyPatches(items, patches);

  const totals = courseTotals ?? {};
  if (!courseTotals) {
    for (const it of items) if (it.points != null) totals[it.code] = (totals[it.code] ?? 0) + it.points;
  }

  items = items.map((it) => enrich(it, todayISO, done, totals)).sort(byDueThenCourse);

  const tasks = items.filter((it) => it.kind !== 'bucket' && it.kind !== 'event');
  const byDate = {};
  for (const it of tasks) if (it.due) (byDate[it.due] ||= []).push(it);

  return {
    todayISO,
    items,
    tasks,
    byDate,
    inRange: (fromISO, toISO) => tasks.filter((t) => t.due && t.due >= fromISO && t.due <= toISO),
    upcoming: tasks.filter((t) => t.state === 'upcoming'),
    inWindow: tasks.filter((t) => t.inWindow),
    // Only what is (nearly) in its start window competes — otherwise a 275-point final two months
    // out outranks the quiz due tomorrow on raw points-per-day.
    doNext: (n = 5) => tasks
      .filter((t) => t.state === 'upcoming' && t.startBy <= addDaysISO(todayISO, 1))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, n),
    missing: tasks.filter((t) => t.state === 'missing'),
    pastUnverified: tasks.filter((t) => t.state === 'past-unverified'),
    undated: tasks.filter((t) => t.state === 'undated'),
    done: tasks.filter((t) => t.state === 'done'),
    courses: [...new Set(tasks.map((t) => t.code))].sort(),
  };
}
