// The day-by-day plan for Fri 10-23 to Sat 10-31 (2026): ROTC fixed events, classes, travel and the work
// blocks that get every deadline done. ONE source, two views: the MFT calendar draws these as read-only
// chips (CalendarView merges PLAN_BY_DATE with the Google overlay), and `npm run`-free script
// `scripts/planToHtml.mjs` prints the same data as a list page.
//
// Maintained by the agent from what Trey has said (STATE.md in Drive is the source of truth for WHY).
// Rules it was built to: the 5 hr/day cap he set is LIFTED for the 10-26 to 10-30 catch-up push (2026-10-25: he
// will do more than 5 hours a day "if I need to"), so those days run 6-7.5 hours and are named in the test;
// nothing is due before it is scheduled; each paper is spread over 3 days (sources + skeleton + AI brief 1 hr,
// bulk draft 2-3 hr, fine-tune + submit 30 min); one ESMG discussion post a day Mon-Thu; every day has the
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

  // ── Sun 10-25: home ~4 PM and rest first. Day 1 of the 3-day method (sources + skeleton + AI brief) for A2 ──
  E(D.sun, '16:00', '18:00', 'rest', 'Home from Idaho: unpack, dinner, rest', { note: 'Back around 4 PM. Nothing scheduled until 6.' }),
  E(D.sun, '18:00', '19:00', 'work', 'ESMG 3200 Assignment 2 Day 1: sources + skeleton + AI brief', { course: 'ESMG 3200', note: 'Already late: a one-time rest-week exception (Trey, 10-25). Finish it as early as possible and do not plan late again. The research brief already exists in the ESMG 3200 Drive folder (A2_VEHICLE_CRASHES_BRIEF).' }),
  E(D.sun, '19:15', '20:15', 'work', 'CHEM 1210 Quiz 18 prep (Sec 6-1, 6-2)', { course: 'CHEM 1210', note: 'Learn the section first. Take the quiz Mon 8:15 AM, due Mon 2:30 PM.' }),
  E(D.sun, '20:30', '21:15', 'work', 'ODC prep: ORI (Wed 10-28, Service Dress)', { course: 'AFROTC', note: 'ORI Procedures tab on /AFROTC.' }),
  E(D.sun, '21:15', '21:45', 'work', 'AERO 2100 group presentation: your slide', { course: 'AERO 2100', note: 'Group project: contribute before Tuesday.' }),
  E(D.sun, '21:45', '22:05', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),

  // ── Mon 10-26: on campus at UVU early, appointment at 10:00, CHEM class at 1:00 ──
  E(D.mon, '08:00', '08:15', 'work', 'OPORD check (Teams): Tue PT, Thu LLAB', { course: 'AFROTC', note: 'OPORDs usually post Sunday evening or Monday morning. Resize the Wed LLAB prep block once you see it.' }),
  E(D.mon, '09:45', '10:00', 'travel', 'Walk to the appointment', { note: 'About 10 minutes plus a buffer.' }),
  E(D.mon, '10:00', '10:30', 'fixed', 'Appointment (UVU campus)', { note: 'About 30 minutes.' }),
  E(D.mon, '10:45', '11:45', 'work', 'ESFF 1120 Initiatives 3+4 Day 1: sources + skeleton + AI brief', { course: 'ESFF 1120', note: 'ONE combined paper (Dr. L announcement 10-22): submit ONLY in the Initiative 3 portal, nothing in Initiative 4. 500-700 words TOTAL (headings and references excluded), 100 pts. Initiative 3 section then Initiative 4 section, each with the 4 bold headings (Explain / Apply / Organizational Impact / Professional Reflection), a personal example, and ONE academic citation each (different sources; journals or books, no wikis or magazines; earlier papers lost 7.5 pts on this). References at the bottom. Word, double spaced, pasted into the text box, one attempt. Due Wed 11:59 PM.' }),
  E(D.mon, '11:45', '12:30', 'work', 'ESMG 3200 W3 discussion post: write + POST', { course: 'ESMG 3200', note: 'Due tonight 11:59 PM; post before class. Must start with an open-ended question and cite one credible source. Discussion day 1 of 4.' }),
  E(D.mon, '12:30', '13:00', 'rest', 'Lunch'),
  E(D.mon, '13:00', '14:00', 'class', 'CHEM 1210 class'),
  E(D.mon, '14:00', '15:45', 'travel', 'Drive to Eagle Mountain and back + Air Force Song/Airman’s Creed loop in the car', { note: 'Letter of recommendation signed there. About 90 min driving plus ~10 min. The Song and Creed loop in the car is today’s memorizing.' }),
  E(D.mon, '16:00', '18:30', 'work', 'ESMG 3200 Assignment 2 Day 2: bulk writing to ~90% draft', { course: 'ESMG 3200', note: 'NOT started as of Mon morning (Trey). Late by choice; week-1 penalty window ends Thu 10-29 11:59 PM.' }),
  E(D.mon, '18:30', '19:15', 'rest', 'Dinner'),
  E(D.mon, '19:15', '20:15', 'work', 'CHEM 1210 Quiz 18 prep (Sec 6-1, 6-2)', { course: 'CHEM 1210', note: 'Learn the section first. Canvas due is Tue 2:30 PM; taking it tonight keeps you ahead. CHEM real study moves to Thu/Fri this week.' }),
  E(D.mon, '20:15', '21:00', 'work', 'CHEM 1210 Quiz 18 take', { course: 'CHEM 1210', note: 'Time limit 45 or 60 min (not confirmed): the first CHEM quiz I can time.' }),
  E(D.mon, '21:00', '21:30', 'work', 'ODC prep: ORI (Wed 10-28, Service Dress)', { course: 'AFROTC', note: 'ORI Procedures tab on /AFROTC.' }),
  E(D.mon, '23:59', null, 'due', 'DUE: ESMG 3200 W3 discussion post'),

  // ── Tue 10-27: PT, McGuire at 10, Retreat at 5:30, the BYU mentor visit folded into the retreat trip ──
  E(D.tue, '06:00', '07:00', 'fixed', 'PT', { note: 'Read the OPORD Monday morning.' }),
  E(D.tue, '07:15', '08:15', 'work', 'CHEM 1210 Quiz 19 prep (Sec 6-3, 6-4)', { course: 'CHEM 1210' }),
  E(D.tue, '08:15', '09:00', 'work', 'CHEM 1210 Quiz 19 take', { course: 'CHEM 1210', note: 'Canvas due is Wed 12:30 PM; taking it a day early on purpose (stay ahead).' }),
  E(D.tue, '09:30', '10:00', 'travel', 'To the Det (time assumed)', { note: 'Your location and drive time are my guess.' }),
  E(D.tue, '10:00', '10:30', 'fixed', 'Feedback meeting: C/Capt McGuire (at the Det)', { note: 'Length and topic not known.' }),
  E(D.tue, '10:30', '11:00', 'travel', 'Back to a work spot (time assumed)'),
  E(D.tue, '11:00', '11:30', 'work', 'ESMG 3200 Assignment 2 Day 3: fine-tune + SUBMIT', { course: 'ESMG 3200', note: 'Done well inside the Thu 10-29 week-1 window.' }),
  E(D.tue, '11:30', '11:50', 'work', 'ESMG 3200 W3 discussion reply 1', { course: 'ESMG 3200', note: 'Discussion day 2 of 4. Substantive: no "I agree".' }),
  E(D.tue, '11:50', '12:30', 'rest', 'Lunch'),
  E(D.tue, '12:30', '15:00', 'work', 'ESFF 1120 Initiatives 3+4 Day 2: bulk writing to ~90% draft', { course: 'ESFF 1120', note: 'Skips CHEM class (1 PM). The 2.5 hr block. About 75 words per sub-section (8 sub-sections in 500-700 words).' }),
  E(D.tue, '14:30', null, 'due', 'DUE: CHEM 1210 Quiz 18'),
  E(D.tue, '15:15', '16:15', 'travel', 'To BYU campus (about 1 hr incl. parking)'),
  E(D.tue, '16:15', '16:45', 'fixed', 'ROTC mentor follow-up (BYU, proposed)', { note: 'Max 30 min. Confirm the retreat is on BYU campus; if it is not, move this to Fri 10-30 after 3 PM.' }),
  E(D.tue, '17:30', '18:00', 'fixed', 'RETREAT (be early)', { course: 'AFROTC' }),
  E(D.tue, '18:00', '19:00', 'travel', 'Home + dinner'),
  E(D.tue, '19:00', '20:30', 'work', 'MICR 2065 Pre-Lab #7 + Case Study #7', { course: 'MICR 2065', note: 'Moved up from Thursday at your request. Officially due Thu 4 PM. Pre-Lab is a 300+ word synopsis of the lab videos, so the watch time is the risk.' }),
  E(D.tue, '20:30', '20:50', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),
  E(D.tue, '20:50', '21:05', 'work', 'ODC prep refresher (ORI tomorrow 6 AM)', { course: 'AFROTC' }),

  // ── Wed 10-28: ORI at 6 AM, ESFF submitted by 8 AM ──
  E(D.wed, '06:00', '07:00', 'fixed', 'ODC: ORI (Service Dress, RB-134)', { course: 'AFROTC' }),
  E(D.wed, '07:30', '08:00', 'work', 'ESFF 1120 Initiatives 3+4 Day 3: fine-tune + SUBMIT', { course: 'ESFF 1120', note: 'Due tonight 11:59 PM; submit this morning.' }),
  E(D.wed, '08:30', '09:30', 'work', 'CHEM 1210 Quiz 20 prep (Sec 6-5)', { course: 'CHEM 1210' }),
  E(D.wed, '09:30', '10:15', 'work', 'CHEM 1210 Quiz 20 take', { course: 'CHEM 1210', note: 'Canvas due is Thu 1:30 PM; taking it a day early on purpose (stay ahead).' }),
  E(D.wed, '10:15', '10:35', 'work', 'ESMG 3200 W3 discussion reply 2', { course: 'ESMG 3200', note: 'Discussion day 3 of 4: this is the day that unlocks the extra credit.' }),
  E(D.wed, '10:45', '11:45', 'work', 'ESMG 3200 Assignment 3 Day 1: sources + skeleton + AI brief', { course: 'ESMG 3200', note: 'Due Thu 11:59 PM, 50 pts.' }),
  E(D.wed, '11:45', '12:30', 'rest', 'Lunch'),
  E(D.wed, '12:30', '14:15', 'work', 'MICR 2060 OLQ 10: reading (Ch 10 worksheets) + take', { course: 'MICR 2060', note: 'Due tonight 11:59 PM, 20 pts. Skips CHEM class (1 PM). Do the Ch 10 worksheets first.' }),
  E(D.wed, '12:30', null, 'due', 'DUE: CHEM 1210 Quiz 19'),
  E(D.wed, '18:00', '19:00', 'rest', 'Dinner'),
  E(D.wed, '19:00', '19:30', 'work', 'LLAB OPORD prep (Thu; placeholder until it posts)', { course: 'AFROTC' }),
  E(D.wed, '19:30', '20:30', 'work', 'AERO 1100 Memo #2', { course: 'AERO 1100', note: 'Due Thu. Your dashboard note says it is 16.67% of the grade, so it is NOT a cut candidate.' }),
  E(D.wed, '20:30', '20:50', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),
  E(D.wed, '23:59', null, 'due', 'DUE: ESFF 1120 Initiatives 3+4, MICR 2060 OLQ 10'),

  // ── Thu 10-29: classes all day, A3 bulk in the gap, lab 4-6 ──
  E(D.thu, '06:00', '07:00', 'fixed', 'PT'),
  E(D.thu, '07:15', '07:35', 'work', 'ESMG 3200 W3 discussion reply 3', { course: 'ESMG 3200', note: 'Discussion day 4 of 4 (bonus). Replies are due Thu; do it before Fisher grades.' }),
  E(D.thu, '13:30', null, 'due', 'DUE: CHEM 1210 Quiz 20'),
  E(D.thu, '08:00', '10:00', 'class', 'AERO 1100 + AERO 2100'),
  E(D.thu, '10:00', '11:00', 'work', 'MICR 2065 Lab Notebook #7 (Lab 6: PCR)', { course: 'MICR 2065', note: 'Due Fri 11:59 PM; done early.' }),
  E(D.thu, '11:00', '13:00', 'class', 'LLAB'),
  E(D.thu, '13:30', '16:00', 'work', 'ESMG 3200 Assignment 3 Day 2: bulk writing to ~90% draft', { course: 'ESMG 3200', note: 'Skips CHEM class (1 PM).' }),
  E(D.thu, '16:00', '18:00', 'class', 'MICR 2065 lab'),
  E(D.thu, '18:00', '19:00', 'rest', 'Dinner'),
  E(D.thu, '19:00', '19:30', 'work', 'ESMG 3200 Assignment 3 Day 3: fine-tune + SUBMIT', { course: 'ESMG 3200', note: 'Due tonight 11:59 PM.' }),
  E(D.thu, '19:30', '20:30', 'work', 'CHEM 1210 real study: current-chapter problems, ACS-style, timed ~2 min each', { course: 'CHEM 1210', note: 'Exam 3 date not known yet.' }),
  E(D.thu, '20:30', '21:00', 'work', 'MICR 2065 Post-Lab #7 (remotely proctored)', { course: 'MICR 2065', note: 'Due Fri 11:59 PM; done early.' }),
  E(D.thu, '21:00', '21:20', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),
  E(D.thu, '23:59', null, 'due', 'DUE: ESMG 3200 Assignment 3'),

  // ── Fri 10-30 ──
  E(D.fri2, '09:00', '10:15', 'work', 'MICR 2060 AIWP 3', { course: 'MICR 2060', note: 'Due tonight 11:59 PM. No grace period; AIWPs 1 and 2 were lost.' }),
  E(D.fri2, '10:30', '11:00', 'work', 'AERO 2100 DB7', { course: 'AERO 2100', note: 'Due date assumed Fri.' }),
  E(D.fri2, '11:00', '13:00', 'work', 'CHEM 1210 real study: current-chapter problems, ACS-style, timed ~2 min each', { course: 'CHEM 1210', note: 'Exam 3 date not known yet.' }),
  E(D.fri2, '13:00', '14:00', 'rest', 'Lunch'),
  E(D.fri2, '14:00', '15:00', 'work', 'Revise ESMG 3200 Assignment 1 from Fisher’s comments', { note: 'Trey says Fisher allowed a resubmission (10-25). Paste or screenshot the comments first; the resubmission deadline is not in writing yet.' }),
  E(D.fri2, '15:00', '15:30', 'work', 'AFROTC Warrior Knowledge Quiz + Honor Points', { course: 'AFROTC', note: 'Quiz due Sat 11:59 PM.' }),
  E(D.fri2, '15:30', '15:50', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),
  E(D.fri2, '16:00', '17:00', 'work', 'MICR 2060 reading: MMAHP Ch 11 (next OLQ)', { course: 'MICR 2060', note: 'Hour 1 of your 2 hr/week MICR reading. Confirm in Canvas which OLQ is next; read before it opens, not the day it is due.' }),
  E(D.fri2, '23:59', null, 'due', 'DUE: MICR 2060 AIWP 3 (Notebook and Post-Lab #7 done Thu)'),

  // ── Sat 10-31 ──
  ALL(D.sat2, 'fixed', 'Stadium cleanup after the BYU game (times not given)'),
  E(D.sat2, '09:00', '12:00', 'work', 'CHEM 1210 real study: current-chapter problems, ACS-style, timed ~2 min each', { course: 'CHEM 1210', note: 'Placed in the morning because the cleanup time is not known.' }),
  E(D.sat2, '12:00', '12:20', 'work', 'Air Force Song + Airman’s Creed', { course: 'AFROTC' }),
  E(D.sat2, '13:00', '14:00', 'work', 'MICR 2060 reading: MMAHP Ch 12 (following OLQ)', { course: 'MICR 2060', note: 'Hour 2 of your 2 hr/week MICR reading.' }),
];

export const KIND_COLORS = { fixed: '#60a5fa', work: '#34d399', due: '#f87171', travel: '#9ca3af', class: '#a78bfa', rest: '#fbbf24' };
export const KIND_LABELS = { fixed: 'Fixed', work: 'Work block', due: 'Deadline', travel: 'Travel', class: 'Class', rest: 'Meal / rest' };

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
