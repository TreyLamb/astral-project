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
    match: { course: 'MICR 2065', title: 'Pre-Lab Preparation Assignment #6: Microbial PCR and Bioinformatics' },
    set: { note: 'Do this weekend: Trey is attending the Tuesday 10/20 10 AM lab section (ROTC all day Thu 10/22).' },
    source: 'Trey, 2026-10-14',
  },
  {
    match: { course: 'MICR 2065', title: 'Module 6 Case Study: The Golden State Killer' },
    set: { note: 'Do this weekend, before the Tuesday 10/20 lab (ROTC all day Thu 10/22).' },
    source: 'Trey, 2026-10-14',
  },
  {
    match: { course: 'CHEM 1210', title: 'Exam 1' },
    set: { kind: 'exam', note: 'Ch 1-2. Scored 76/100.' },
    source: 'Canvas capture 2026-09-18 (score)',
  },
];

// ESMG 3200 Week 1 Discussion (Canvas assignment 9346368). Only Week 1's prompt prints these rules;
// weeks 2-7 do not repeat them, so they are not guessed here.
const ESMG_W1 = {
  course: 'ESMG 3200',
  kind: 'assignment',
  status: 'todo',
  url: 'https://uvu.instructure.com/courses/655081/discussion_topics/4571443',
  source: 'Week 1 Discussion prompt, Canvas, captured 2026-10-12; Trey asked for the extra-credit days on the calendar',
};

// AERO courses live in BYU Learning Suite, which no feed reaches yet; Trey pasted both gradebooks.
const AERO2100_LS = { course: 'AERO 2100', status: 'todo', dueTime: '11:59 PM', source: 'Trey, 2026-10-14 (pasted Learning Suite gradebook)' };
const AERO1100_LS = { course: 'AERO 1100', status: 'todo', dueTime: '11:59 PM', source: 'Trey, 2026-10-14 (pasted Learning Suite gradebook)' };

export const COURSEWORK_EXTRA = [
  {
    ...ESMG_W1,
    id: 'manual:esmg3200-w1-xc-day2',
    title: 'W1 Discussion: extra-credit day 2 (post or reply)',
    status: 'submitted', // Trey, 2026-10-14: one reply done 10-13
    due: '2026-10-13',
    dueTime: '11:59 PM',
    note: 'Extra credit = participate on 3 different days. Day 1 is the Monday post.',
  },
  {
    ...ESMG_W1,
    id: 'manual:esmg3200-w1-replies',
    title: 'W1 Discussion: reply to 2 classmates (day 3)',
    due: '2026-10-15',
    dueTime: '11:59 PM',
    note: 'Follow-up comments are due Thursday. Substantive, not "I agree". Replying to more than 2 is also extra credit. Same day as Assignment 1.',
  },
  {
    id: 'manual:aero2100-midterm',
    course: 'AERO 2100',
    title: 'Midterm exam',
    kind: 'exam',
    status: 'todo',
    due: '2026-10-17',
    dueTime: '6:00 PM',
    note: 'Trey said "due before Oct 17 1800"; the Learning Suite gradebook says Oct 19 11:59 PM. Targeting the earlier date. 24.75% of the grade. Study from the slides.',
    source: 'Trey, 2026-10-14 (chat + pasted Learning Suite gradebook)',
  },
  ...[['6', '2026-10-23'], ['7', '2026-10-30'], ['8', '2026-11-06'], ['9', '2026-11-13'], ['10', '2026-11-20']].map(([n, due]) => ({
    ...AERO2100_LS,
    id: `manual:aero2100-db${n}`,
    title: `Discussion Board ${n}`,
    kind: 'assignment',
    due,
    points: 1,
    note: 'Weekly, Fridays; about 1% of the grade each. No board the week of Oct 16.',
  })),
  { ...AERO2100_LS, id: 'manual:aero2100-paper', title: 'Paper', kind: 'assignment', due: '2026-12-02', dueTime: '4:00 PM', points: 50, note: '24.75% of the grade.' },
  { ...AERO2100_LS, id: 'manual:aero2100-briefing', title: 'Briefing', kind: 'assignment', due: '2026-12-03', points: 50, note: '14.85% of the grade.' },
  { ...AERO2100_LS, id: 'manual:aero2100-final', title: 'Final exam', kind: 'exam', due: '2026-12-12', dueTime: '6:00 PM', note: 'Opens Dec 3. 24.75% of the grade.' },
  {
    id: 'manual:micr2065-lab-tue-1020',
    course: 'MICR 2065',
    title: 'Lab: attending the Tuesday 10 AM section',
    kind: 'event',
    status: 'todo',
    due: '2026-10-20',
    dueTime: '10:00 AM',
    note: 'Instead of Thursday (ROTC full-day event Thu 10/22). Pre-Lab #6 + Module 6 Case Study done first.',
    source: 'Trey, 2026-10-14',
  },
  { ...AERO1100_LS, id: 'manual:aero1100-memo2', title: 'Official Memorandum #2', kind: 'assignment', due: '2026-10-29', points: 5, note: '16.67% of the grade.' },
  { ...AERO1100_LS, id: 'manual:aero1100-memo3', title: 'Official Memorandum #3', kind: 'assignment', due: '2026-12-03', points: 15, note: '16.67% of the grade.' },
  { course: 'AFROTC', id: 'manual:med-exam-tue', title: 'ROTC medical appointment (2 of 2)', kind: 'event', status: 'todo', due: '2026-10-20', dueTime: '3:15 PM', note: 'Medical exam, not a cadre event.', source: 'Trey, 2026-10-19' },
  { course: 'AFROTC', id: 'manual:drone-challenge', title: 'DTRA/Penn State virtual drone challenge (1 hour)', kind: 'assignment', status: 'todo', due: '2026-10-20', note: 'Registered. Window closes 10/20; do not leave it to the last hour (Penn State is on Eastern time).', source: 'Trey, 2026-10-16 (registered); window per flyer' },
  { course: 'AFROTC', id: 'manual:col-randall', title: 'MEETING WITH COL RANDALL: CANNOT MISS', kind: 'event', status: 'todo', due: '2026-10-21', dueTime: '10:00 AM', note: 'Make-up for the missed 10/14 appointment. Arrive 10 min early.', source: 'Trey, 2026-10-19' },
  { course: 'AFROTC', id: 'manual:rotc-full-day-thu', title: 'ROTC full-day event + dinner ~5 PM', kind: 'event', status: 'todo', due: '2026-10-22', dueTime: '5:00 PM', note: 'Full-day event; the dinner he thought was Friday is Thursday ~5 PM. Detail still unknown.', source: 'Trey, 2026-10-14 and 2026-10-19' },
  { course: 'AFROTC', id: 'manual:med-exam-fri', title: 'ROTC medical appointment (1 of 2, moved from Tue 10 AM)', kind: 'event', status: 'todo', due: '2026-10-23', dueTime: '9:00 AM', note: 'Medical exam. Length unknown.', source: 'Trey, 2026-10-19' },
  { course: 'AFROTC', id: 'manual:flight-meeting-wed', title: 'Charlie Flight meeting', kind: 'event', status: 'todo', due: '2026-10-21', dueTime: '5:00 PM', note: 'Trey presides as flight commander. Length and place unknown. His Teams post said it must happen before LLab this week.', source: 'Trey, 2026-10-21' },
  { course: 'AFROTC', id: 'manual:retreat-1027', title: 'RETREAT (be there early)', kind: 'event', status: 'todo', due: '2026-10-27', dueTime: '5:30 PM', note: 'Trey will forget: be there early.', source: 'Trey, 2026-10-22' },
  { course: 'AFROTC', id: 'manual:retreat-1117', title: 'RETREAT (time not given)', kind: 'event', status: 'todo', due: '2026-11-17', note: 'Confirm the time.', source: 'Trey, 2026-10-22' },
  { course: 'AFROTC', id: 'manual:stadium-cleanup-1031', title: 'Stadium cleanup after the BYU game', kind: 'event', status: 'todo', due: '2026-10-31', note: 'Game and cleanup times not given; confirm.', source: 'Trey, 2026-10-22' },
  { course: 'Personal', id: 'manual:dr-appt-mon', title: 'GP follow-up (UVU campus)', kind: 'event', status: 'todo', due: '2026-10-26', dueTime: '10:00 AM', note: 'About 30 minutes. CHEM Quiz 18 is due 2:30 PM the same day; CHEM class at 1.', source: 'Trey, 2026-10-19' },
  { course: 'AFROTC', id: 'manual:mcguire-feedback', title: 'Feedback meeting with C/Capt McGuire (at the Det)', kind: 'event', status: 'todo', due: '2026-10-27', dueTime: '10:00 AM', note: 'At the Det. Length and topic unknown. CHEM Quiz 19 is due 12:30 PM the same day.', source: 'Trey, 2026-10-20' },
];
