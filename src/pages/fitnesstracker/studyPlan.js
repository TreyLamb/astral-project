// The day-by-day plan for Fri 10-23 to Sat 10-31 (2026): ROTC fixed events, classes, travel and the work
// blocks that get every deadline done. ONE source, two views: the MFT calendar draws these as read-only
// chips (CalendarView merges PLAN_BY_DATE with the Google overlay), and `npm run`-free script
// `scripts/planToHtml.mjs` prints the same data as a list page.
//
// Maintained by the agent from what Trey has said (STATE.md in Drive is the source of truth for WHY).
// Rules it was built to: no more than ~5.5 hours of work on any day, the cap he set is 5 and he allowed
// going over only when it is planned ahead; nothing is due before it is scheduled; every day has the
// Air Force Song / Airman's Creed slot. Times he has not given are marked with a note and are guesses.

const pad = (n) => String(n).padStart(2, '0');
let seq = 0;
const E = (date, start, end, kind, title, extra = {}) => ({ id: `p${++seq}`, date, start, end, kind, title, ...extra });
const ALL = (date, kind, title, extra = {}) => ({ id: `p${++seq}`, date, start: null, end: null, kind, title, ...extra });

const D = {
  fri: '2026-10-23', sat: '2026-10-24', sun: '2026-10-25', mon: '2026-10-26', tue: '2026-10-27',
  wed: '2026-10-28', thu: '2026-10-29', fri2: '2026-10-30', sat2: '2026-10-31',
};

export const PLAN = [
  // ── Fri 10-23: run, reveille, one assignment before the physical, the rest before leaving ──
  E(D.fri, '06:00', '07:00', 'fixed', 'Run'),
  E(D.fri, '07:15', '07:45', 'fixed', 'Reveille (helping)', { course: 'AFROTC', note: 'Walmart pharmacy does not open until 9 AM (Orem store), so it moves to after the physical.' }),
  E(D.fri, '07:50', '08:05', 'fixed', 'Det: print the recommendation letter', { note: 'The Det is a 3 minute drive from the flag. Open the file on your phone after the run (around 6:45) to see if it will print.' }),
  E(D.fri, '08:15', '08:40', 'fixed', 'Home: shower'),
  E(D.fri, '08:50', '09:00', 'work', 'Honor Points', { note: '10 minutes in the car at the physical.' }),
  E(D.fri, '09:00', '10:00', 'fixed', 'Physical (bring the DoDMERB form)', { note: 'End time not known: 10:00 is a guess.' }),
  E(D.fri, '10:15', '11:45', 'work', 'MICR OLQ 9 (reading + quiz)', { course: 'MICR 2060', note: 'Due Sat 11:59 PM, 20 pts. Done before the drive so Saturday has no homework. Study guide: MICR 2060 folder.' }),
  E(D.fri, '11:45', '12:30', 'work', 'MICR Post-Lab #6', { course: 'MICR 2065', note: 'Due tonight 11:59 PM.' }),
  E(D.fri, '12:30', '12:50', 'fixed', 'Lunch / buffer', { note: 'Skip it to leave about 20 minutes earlier.' }),
  E(D.fri, '12:50', '13:50', 'work', 'MICR Lab Notebook #6', { course: 'MICR 2065', note: 'Due tonight 11:59 PM, 30 pts with the Post-Lab.' }),
  E(D.fri, '13:50', '14:20', 'work', 'AERO 2100 DB6', { course: 'AERO 2100', note: 'Due tonight 11:59 PM. If you are running late, this is the one to do in Idaho tonight.' }),
  E(D.fri, '14:20', '14:45', 'fixed', 'Walmart pharmacy pickup (on your way out of town)', { note: 'The prescription is already called in and ready. Skip it and pick it up Sunday if you are running late.' }),
  E(D.fri, '14:45', '18:45', 'travel', 'Drive to Paris, ID', { note: 'About 4 hours, arriving around 6:45.' }),
  E(D.fri, '23:59', null, 'due', 'DUE: Notebook, Post-Lab #6, DB6'),

  // ── Sat 10-24: Idaho, no homework ──
  ALL(D.sat, 'fixed', 'Idaho (all day, no homework planned)'),

  // ── Sun 10-25: drive home early; Assignment 2 (late, same 10% penalty through Thu 10-29) ──
  E(D.sun, '08:00', '12:00', 'travel', 'Drive home from Paris, ID', { note: 'If you work Sunday instead of leaving early, leave at 12:00 and Assignment 2 moves to Monday evening.' }),
  E(D.sun, '13:30', '14:30', 'work', 'CHEM Q18 prep', { course: 'CHEM 1210', note: 'Quiz is due Mon 2:30 PM.' }),
  E(D.sun, '14:45', '17:45', 'work', 'ESMG Assignment 2: write + submit (late)', { course: 'ESMG 3200', note: 'Was due Thu 10/22. Late penalty is 10% per week (about 5 pts), so Sunday costs the same as Friday. Research brief is in your ESMG Drive folder.' }),
  E(D.sun, '18:15', '18:45', 'work', 'ODC prep 1 of 3 (ORI Wed 10/28)', { course: 'AFROTC' }),
  E(D.sun, '19:00', '20:00', 'work', 'ESFF 3+4: read the initiatives + outline', { course: 'ESFF 1120', note: 'One combined paper, due Wed 11:59 PM.' }),
  E(D.sun, '20:15', '20:35', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),

  // ── Mon 10-26: on campus at UVU early, GP follow-up at 10:00, CHEM class at 1:00 ──
  E(D.mon, '08:15', '09:00', 'work', 'CHEM Q18 take (on campus)', { course: 'CHEM 1210', note: 'Due 2:30 PM. Prep was Sunday, so take it first thing while you are fresh.' }),
  E(D.mon, '09:00', '09:45', 'work', 'ESMG W3 post: reading + draft', { course: 'ESMG 3200', note: 'Due tonight 11:59 PM.' }),
  E(D.mon, '09:45', '10:00', 'fixed', 'Walk to the appointment', { note: 'About 10 minutes, plus a buffer.' }),
  E(D.mon, '10:00', '10:30', 'fixed', 'GP follow-up (UVU campus)', { note: 'About 30 minutes.' }),
  E(D.mon, '10:45', '11:45', 'work', 'CHEM Q19 prep', { course: 'CHEM 1210', note: 'Quiz is due Tue 12:30 PM.' }),
  E(D.mon, '11:45', '12:45', 'work', 'ESMG W3 post: finish + submit', { course: 'ESMG 3200', note: 'Due tonight 11:59 PM; submit before class.' }),
  E(D.mon, '13:00', '14:00', 'class', 'CHEM class'),
  E(D.mon, '14:30', null, 'due', 'DUE: CHEM Q18'),
  E(D.mon, '14:15', '15:15', 'work', 'MICR OLQ 10 reading', { course: 'MICR 2060', note: 'MMAHP Ch 10, M2OS Ch 19-20.' }),
  E(D.mon, '19:00', '19:30', 'work', 'ODC prep 2 of 3', { course: 'AFROTC' }),
  E(D.mon, '19:30', '19:50', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),

  // ── Tue 10-27: busy (PT, feedback meeting, Retreat) ──
  E(D.tue, '06:00', '07:00', 'fixed', 'PT (read the OPORD, 5 min)'),
  E(D.tue, '10:00', '10:30', 'fixed', 'Feedback meeting: C/Capt McGuire', { note: 'Length and topic not known.' }),
  E(D.tue, '11:15', '12:00', 'work', 'CHEM Q19 take', { course: 'CHEM 1210', note: 'Due 12:30 PM.' }),
  E(D.tue, '13:00', '14:30', 'work', 'ESFF 3+4: write + submit', { course: 'ESFF 1120', note: 'Due Wed 11:59 PM; submit today.' }),
  E(D.tue, '14:45', '15:45', 'work', 'CHEM Q20 prep', { course: 'CHEM 1210', note: 'Quiz is due Wed 1:30 PM.' }),
  E(D.tue, '16:45', '17:30', 'travel', 'Leave for Retreat (arrive early)'),
  E(D.tue, '17:30', '18:00', 'fixed', 'RETREAT (be early)', { course: 'AFROTC' }),
  E(D.tue, '19:00', '20:30', 'work', 'MICR Pre-Lab #7 + Case Study #7', { course: 'MICR 2065', note: 'Due Thu 4 PM.' }),
  E(D.tue, '20:45', '21:15', 'work', 'ODC prep 3 of 3 (ORI tomorrow 6 AM)', { course: 'AFROTC' }),
  E(D.tue, '21:15', '21:35', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),

  // ── Wed 10-28: ORI at 6 AM ──
  E(D.wed, '06:00', '07:00', 'fixed', 'ODC: ORI (Service Dress)', { course: 'AFROTC' }),
  E(D.wed, '07:30', '08:00', 'work', 'MICR OLQ 10 take', { course: 'MICR 2060', note: 'Due tonight 11:59 PM.' }),
  E(D.wed, '09:00', '10:00', 'work', 'ESMG A3: research', { course: 'ESMG 3200', note: 'Due Thu 11:59 PM, 50 pts.' }),
  E(D.wed, '12:00', '12:45', 'work', 'CHEM Q20 take', { course: 'CHEM 1210', note: 'Due 1:30 PM.' }),
  E(D.wed, '13:00', '15:00', 'work', 'ESMG A3: outline + draft', { course: 'ESMG 3200' }),
  E(D.wed, '19:00', '20:00', 'work', 'AERO Memo #2', { course: 'AERO 1100', note: 'Due Thu.' }),
  E(D.wed, '20:00', '20:20', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),

  // ── Thu 10-29: classes all day, a late A3 block ──
  E(D.thu, '06:00', '07:00', 'fixed', 'PT'),
  E(D.thu, '08:00', '10:00', 'class', 'AERO 1100 + AERO 2100'),
  E(D.thu, '11:00', '13:00', 'class', 'LLAB'),
  E(D.thu, '14:00', '15:00', 'work', 'CHEM exam prep', { course: 'CHEM 1210', note: 'Exam 3 date not known yet.' }),
  E(D.thu, '16:00', '18:00', 'class', 'MICR lab'),
  E(D.thu, '19:00', '21:00', 'work', 'ESMG A3: finish + submit', { course: 'ESMG 3200', note: 'Due tonight 11:59 PM.' }),
  E(D.thu, '21:00', '21:20', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),

  // ── Fri 10-30 ──
  E(D.fri2, '09:00', '10:15', 'work', 'MICR AIWP 3', { course: 'MICR 2060', note: 'Due tonight 11:59 PM. No grace period.' }),
  E(D.fri2, '10:30', '12:30', 'work', 'MICR Notebook + Post-Lab #7', { course: 'MICR 2065', note: 'Due tonight 11:59 PM.' }),
  E(D.fri2, '13:00', '13:30', 'work', 'AERO 2100 DB7', { course: 'AERO 2100', note: 'Due date assumed Fri.' }),
  E(D.fri2, '14:00', '16:00', 'work', 'CHEM exam prep', { course: 'CHEM 1210', note: 'Exam 3 date not known yet.' }),

  // ── Sat 10-31 ──
  ALL(D.sat2, 'fixed', 'Stadium cleanup after the BYU game (times not given)'),
];

export const KIND_COLORS = { fixed: '#60a5fa', work: '#34d399', due: '#f87171', travel: '#9ca3af', class: '#a78bfa' };
export const KIND_LABELS = { fixed: 'Fixed', work: 'Work block', due: 'Deadline', travel: 'Travel', class: 'Class' };

const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const minutesOf = (e) => (e.start && e.end ? hm(e.end) - hm(e.start) : 0);

/** "13:30" -> "1:30 PM" (the format the calendar's own chips read). */
export function clock(s) {
  const [h, m] = s.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Hours of WORK blocks per day: { 'YYYY-MM-DD': hours }. Classes, travel and fixed events are not work. */
export function workHoursByDay(plan = PLAN) {
  const out = {};
  for (const e of plan) if (e.kind === 'work') out[e.date] = (out[e.date] ?? 0) + minutesOf(e) / 60;
  return out;
}

/** The plan as the calendar overlay's event shape, grouped by day and sorted by start time. */
export function planOverlayByDate(plan = PLAN) {
  const map = {};
  for (const e of plan) {
    const timed = Boolean(e.start);
    const title = timed && e.end ? `${e.title} → ${clock(e.end)}` : e.title;
    (map[e.date] ||= []).push({
      id: `plan::${e.id}`, calId: 'plan', calName: 'Plan', color: KIND_COLORS[e.kind] ?? '#94a3b8',
      title, date: e.date, time: timed ? clock(e.start) : null, sortKey: timed ? e.start : '', allDay: !timed, link: null,
    });
  }
  for (const list of Object.values(map)) list.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return map;
}

export const PLAN_BY_DATE = planOverlayByDate();
