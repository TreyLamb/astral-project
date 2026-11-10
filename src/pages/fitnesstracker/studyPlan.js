// The day-by-day plan for Fri 10-23 to Sat 10-31 (2026): ROTC fixed events, classes, travel and the work
// blocks that get every deadline done. ONE source, two views: the MFT calendar draws these as read-only
// chips (CalendarView merges PLAN_BY_DATE with the Google overlay), and `npm run`-free script
// `scripts/planToHtml.mjs` prints the same data as a list page.
//
// Maintained by the agent from what Trey has said (STATE.md in Drive is the source of truth for WHY).
// Rules it was built to: the 5 hr/day cap he set is LIFTED for the 10-26 to 10-30 catch-up push (2026-10-25: he
// will do more than 5 hours a day "if I need to"), so those days run 6-7.5 hours and are named in the test;
// nothing is due before it is scheduled; each paper is ONE ~2-hour sitting (Trey, 11-9); from 11-10 every day is an EASY minimum plus 2-3 'extra' blocks at the end (kind 'extra', not counted as work hours) he can pick up on a good day (Trey, 11-10); one ESMG discussion post a day Mon-Thu; every day has the
// Air Force Song / Airman's Creed slot. Times he has not given are marked with a note and are guesses.

const pad = (n) => String(n).padStart(2, '0');
let seq = 0;
const E = (date, start, end, kind, title, extra = {}) => ({ id: `p${++seq}`, date, start, end, kind, title, ...extra });
const ALL = (date, kind, title, extra = {}) => ({ id: `p${++seq}`, date, start: null, end: null, kind, title, ...extra });

const D = {
  fri: '2026-10-23', sat: '2026-10-24', sun: '2026-10-25', mon: '2026-10-26', tue: '2026-10-27',
  wed: '2026-10-28', thu: '2026-10-29', fri2: '2026-10-30', sat2: '2026-10-31', sun2: '2026-11-01', mon2: '2026-11-02', tue2: '2026-11-03',
  wed2: '2026-11-04', thu2: '2026-11-05', fri3: '2026-11-06', sat3: '2026-11-07', sun3: '2026-11-08',
  mon3: '2026-11-09', tue3: '2026-11-10', wed3: '2026-11-11', thu3: '2026-11-12', fri4: '2026-11-13', sat4: '2026-11-14', sun4: '2026-11-15',
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
  E(D.mon, '20:15', '20:45', 'work', 'CHEM 1210 Quiz 18 take', { course: 'CHEM 1210', note: '30-minute time limit.' }),
  E(D.mon, '21:00', '21:30', 'work', 'ODC prep: ORI (Wed 10-28, Service Dress)', { course: 'AFROTC', note: 'ORI Procedures tab on /AFROTC.' }),
  E(D.mon, '23:59', null, 'due', 'DUE: ESMG 3200 W3 discussion post'),

  // ── Tue 10-27 (rebuilt 4:10 PM): ESFF draft around Retreat; W3 reply #2 done 4:08 PM ──
  E(D.tue, '15:50', '16:08', 'work', 'ESMG 3200 W3 discussion reply #2 (DONE 4:08 PM)', { course: 'ESMG 3200', prio: 'done' }),
  E(D.tue, '16:10', '16:55', 'work', 'ESFF 1120 Init 3+4 combined paper: start the draft', { course: 'ESFF 1120', prio: 'must', note: 'Real due date Wed 11:59 PM. Brief with verified sources: ESFF 1120/ESFF1120_Init3+4_BRIEF_2026-10-27.md.' }),
  E(D.tue, '16:55', '17:30', 'travel', 'To Retreat (be early)'),
  E(D.tue, '17:30', '18:00', 'fixed', 'RETREAT 1730', { course: 'AFROTC', prio: 'fixed' }),
  E(D.tue, '18:00', '19:00', 'travel', 'Home + dinner'),
  E(D.tue, '19:00', '19:30', 'work', 'ODC prep: ORI tomorrow 6 AM + lay out Service Dress', { course: 'AFROTC', prio: 'must', note: 'Last slot before the 6 AM ORI.' }),
  E(D.tue, '19:30', '21:30', 'work', 'ESFF 1120 Init 3+4: finish the draft (~95%)', { course: 'ESFF 1120', prio: 'must', note: '500-700 words; Init 3 section then Init 4, 4 bold headings each, 1 academic source each, personal examples.' }),
  E(D.tue, '21:30', '21:50', 'work', 'Air Force Song + Airman\u2019s Creed', { course: 'AFROTC', prio: 'habit' }),

  // ── Wed 10-28 (rebuilt 6 PM): morning blocks were missed; run 5:15-6. Q20 pulled to tonight because Thu 6 AM-1 PM is all ROTC ──
  E(D.wed, '06:00', '07:00', 'fixed', 'ODC: ORI (Service Dress, RB-134)', { course: 'AFROTC', prio: 'fixed' }),
  E(D.wed, '12:30', null, 'due', 'MISSED: CHEM 1210 Quiz 19 (make-up Fri)'),
  E(D.wed, '18:15', '19:00', 'fixed', 'Run (own)', { prio: 'fixed' }),
  E(D.wed, '19:00', '20:15', 'work', 'MICR 2060 OLQ 10: Ch 10 + take', { course: 'MICR 2060', prio: 'deadline', note: 'Due tonight 11:59 PM.' }),
  E(D.wed, '20:15', '21:00', 'work', 'AERO 2100 group presentation: your 2 slides (weaknesses of management by exception)', { course: 'AERO 2100', prio: 'deadline', note: 'Group needs them tonight. Brief: AERO 2100/AERO2100_MBE_BRIEF_2026-10-27.pdf.' }),
  E(D.wed, '21:00', '21:30', 'work', 'AERO 1100 mini presentation (Memo #2): prep', { course: 'AERO 1100', prio: 'must', note: 'You present Thu morning.' }),
  E(D.wed, '21:30', '21:40', 'work', 'LLAB OPORD (Thu = Career Day, Wilk Center Garden Court, Duty uniform)', { course: 'AFROTC', prio: 'must' }),
  E(D.wed, '21:40', '22:00', 'work', 'CHEM 1210 Quiz 20 prep (Sec 6-5)', { course: 'CHEM 1210', prio: 'must', note: 'Due Thu 1:30 PM, but Thu 6 AM-1 PM is all ROTC, so it has to be tonight.' }),
  E(D.wed, '22:00', '22:30', 'work', 'CHEM 1210 Quiz 20 take (30 min)', { course: 'CHEM 1210', prio: 'must' }),
  E(D.wed, '23:59', null, 'due', 'DUE: MICR 2060 OLQ 10'),

  // ── Thu 10-29: 6 AM-1 PM ALL ROTC (classes, presentation, LLAB Career Day). Nothing scheduled there. ──
  ALL(D.thu, 'fixed', 'LLAB = Career Day, Wilk Center Garden Court, Duty uniform', { course: 'AFROTC', prio: 'fixed' }),
  E(D.thu, '06:00', '13:00', 'fixed', 'ROTC (6 AM-1 PM): AERO 1100 (present Memo #2) + AERO 2100 + LLAB', { course: 'AFROTC', prio: 'fixed', note: 'About a 1 hr break inside; it stays a break.' }),
  E(D.thu, '13:00', '13:30', 'travel', 'To UVU + lunch', { note: 'CHEM class (1-2 PM) is missed: ROTC runs to 1.' }),
  E(D.thu, '13:30', null, 'due', 'MISSED: CHEM 1210 Quiz 20 (make-up Fri)'),
  E(D.thu, '13:30', '15:00', 'work', 'MICR 2065 Pre-Lab #7 + Module 7 Case Study', { course: 'MICR 2065', prio: 'deadline', note: 'Both due 4 PM today.' }),
  E(D.thu, '15:00', '15:15', 'work', 'ESMG 3200 Assignment 2: start writing', { course: 'ESMG 3200', prio: 'deadline' }),
  E(D.thu, '15:15', '15:25', 'fixed', 'ROTC mentor phone call (~10 min)', { course: 'AFROTC', prio: 'fixed', note: 'Mentor is free 3:15-4 PM.' }),
  E(D.thu, '15:25', '15:55', 'work', 'ESMG 3200 Assignment 2: keep writing', { course: 'ESMG 3200', prio: 'deadline' }),
  E(D.thu, '16:00', null, 'due', 'DUE: MICR 2065 Pre-Lab #7 + Module 7 Case Study'),
  E(D.thu, '16:00', '18:00', 'class', 'MICR 2065 lab'),
  E(D.thu, '18:00', '18:30', 'rest', 'Dinner'),
  E(D.thu, '18:30', '20:00', 'work', 'ESMG 3200 Assignment 2: finish + SUBMIT', { course: 'ESMG 3200', prio: 'deadline', note: 'Last day before the penalty grows (Thu 11:59 PM). Brief: ESMG 3200/ESMG3200_A2_BRIEF_2026-10-27.pdf.' }),
  E(D.thu, '20:00', '23:00', 'work', 'ESMG 3200 Assignment 3: write + SUBMIT', { course: 'ESMG 3200', prio: 'deadline', note: 'Due tonight 11:59 PM. Brief: ESMG 3200/ESMG3200_A3_BRIEF_2026-10-27.pdf. If the night runs out: A2 and A3 cost the same 5 pts each if late; finish whichever is closer first.' }),
  ALL(D.thu, 'work', 'ESMG 3200 W3 discussion: final reply (done, ~6:50 PM)', { course: 'ESMG 3200', prio: 'done', note: 'W3: 4 replies over 4 days, graded 26/20.' }),
  E(D.thu, '23:59', null, 'due', 'DUE: ESMG 3200 Assignment 3 (+ A2 penalty step)'),

  // ── Fri 10-30 (rebuilt Thu 11:59 PM): AIWP 3 already SUBMITTED, so everything moves up an hour and a
  //    second Exam 3 block takes the evening. MICR + AERO due tonight. ──
  E(D.fri2, '11:45', '12:30', 'travel', "Drive to the Det (day starts late)", {"course":"AFROTC","note":"Trey, 10-30: just starting the day."}),
  E(D.fri2, '12:30', '13:30', 'fixed', "At the Det: pick up OCPs for Saturday’s game", {"course":"AFROTC","prio":"fixed","note":"Homework can’t start until ~1:30."}),
  E(D.fri2, '13:30', '13:50', 'work', "MICR 2060 AIWP 3: read the draft + SUBMIT", {"course":"MICR 2060","prio":"deadline","note":"Locks tonight 11:59 PM, no grace. Draft: MICR 2060/Lamb_AIWP3_Problem2_DRAFT.docx."}),
  E(D.fri2, '13:50', '15:00', 'work', "MICR 2065 Lab Notebook #7 (Lab 6: PCR): start", {"course":"MICR 2065","prio":"deadline","note":"Due tonight 11:59 PM. ~1.75 h total. Submit the copy ending in \"_\"."}),
  E(D.fri2, '15:00', '16:00', 'fixed', "Flight meeting (1500)", {"course":"AFROTC","prio":"fixed","note":"End time is a guess (1 hr)."}),
  E(D.fri2, '16:00', '16:35', 'work', "MICR 2065 Lab Notebook #7: finish + SUBMIT", {"course":"MICR 2065","prio":"deadline"}),
  E(D.fri2, '16:35', '16:55', 'work', "MICR 2065 Post-Lab #7 + Post-Lab #1 make-up (Handwashing, Lab 0)", {"course":"MICR 2065","prio":"deadline","note":"Remotely proctored: needs a quiet spot with the camera. ~7 min each."}),
  E(D.fri2, '16:55', '17:25', 'work', "AERO 2100 DB7", {"course":"AERO 2100","prio":"deadline","note":"Due tonight 11:59 PM (Learning Suite)."}),
  E(D.fri2, '17:25', '18:00', 'rest', "Dinner"),
  E(D.fri2, '18:00', '19:00', 'work', "CHEM 1210 Quiz 18 make-up (Sec 6-1, 6-2): prep + take", {"course":"CHEM 1210","prio":"deadline","note":"Late quizzes accepted. Ch 6 is on Monday’s exam."}),
  E(D.fri2, '19:00', '20:00', 'work', "CHEM 1210 Quiz 19 make-up (Sec 6-3, 6-4): prep + take", {"course":"CHEM 1210","prio":"deadline"}),
  E(D.fri2, '20:00', '20:30', 'work', "Warrior Knowledge: final review + TAKE this week’s Warrior Knowledge Quiz", {"course":"AFROTC","prio":"deadline","note":"Due Sat 4 PM; Saturday is the game 10:30-6, so tonight."}),
  E(D.fri2, '20:30', '21:30', 'work', "CHEM 1210 Quiz 20 make-up (Sec 6-5): prep + take", {"course":"CHEM 1210","prio":"deadline","note":"If the night runs out, this one moves to Sunday morning before the practice exam."}),
  E(D.fri2, '23:59', null, 'due', 'DUE: MICR 2065 Lab Notebook #7 + Post-Lab #7, AERO 2100 DB7'),

  // ── Sat 10-31: Warrior Knowledge, CHEM make-ups inside Exam 3 prep, MICR reading, stadium cleanup ~4:20 PM ──
  E(D.sat2, '08:00', '09:30', 'work', 'CHEM 1210 Quiz 15 + Quiz 16 make-ups (Sec 5-1 to 5-4)', { course: 'CHEM 1210', prio: 'deadline', note: 'Already late (late quizzes accepted). Ch 5 = the heat math Exam 3 leans on.' }),
  E(D.sat2, '09:30', '09:50', 'work', 'MICR 2060 AIWP 4: read the agent draft + submit', { course: 'MICR 2060', prio: 'must', note: 'Opens today; drafted by the agent this morning. Rule: submit the day it opens. Real due date Wed 11/4.' }),
  E(D.sat2, '10:00', '10:30', 'travel', 'To the game (OCPs)'),
  E(D.sat2, '10:30', '18:00', 'fixed', 'ROTC at the BYU game: push-ups (OCPs)', { course: 'AFROTC', prio: 'fixed', note: 'Trey, 10-29: 10:30 to about 6.' }),
  E(D.sat2, '18:00', '19:00', 'rest', 'Home + dinner'),
  E(D.sat2, '19:00', '19:30', 'work', 'Warrior Knowledge (daily 30 min)', { course: 'AFROTC', prio: 'habit' }),
  E(D.sat2, '19:30', '20:30', 'work', 'MICR 2060 reading: MMAHP Ch 12 (OLQ 12, due Sat 11/7)', { course: 'MICR 2060', prio: 'must', note: 'Hour 2 of your 2 hr/week MICR reading. Light on purpose after a long day.' }),

  // ── Sun 11-1: Trey's plan (9:30 AM): CHEM make-up quizzes in hour-on / hour-off blocks, ESMG W4 post ──
  E(D.sun2, '10:00', '11:00', 'work', "CHEM 1210 Quiz 15 make-up (Sec 5-1, 5-2)", {"course":"CHEM 1210","prio":"must","note":"Hour on, hour off (Trey, 11-1). Late quizzes accepted; doubles as Exam 3 warm-up."}),
  E(D.sun2, '12:00', '13:00', 'work', "CHEM 1210 Quiz 16 make-up (Sec 5-3, 5-4)", {"course":"CHEM 1210","prio":"must"}),
  E(D.sun2, '14:00', '15:00', 'work', "CHEM 1210 Quiz 18 make-up (Sec 6-1, 6-2)", {"course":"CHEM 1210","prio":"must"}),
  E(D.sun2, '16:00', '17:00', 'work', "CHEM 1210 Quiz 19 make-up (Sec 6-3, 6-4)", {"course":"CHEM 1210","prio":"must"}),
  E(D.sun2, '17:00', '17:30', 'work', "Warrior Knowledge (daily 30 min; fine in 5-min pieces during the off hours)", {"course":"AFROTC","prio":"habit"}),
  E(D.sun2, '18:00', '19:00', 'work', "CHEM 1210 Quiz 20 make-up (Sec 6-5)", {"course":"CHEM 1210","prio":"must"}),
  E(D.sun2, '20:00', '21:00', 'work', "ESMG 3200 Week 4 discussion: initial post", {"course":"ESMG 3200","prio":"must","note":"Real due date Mon 11/2 11:59 PM; Monday is the 6 AM practice + exam, so it goes up today."}),

  // ── Mon 11-2: CHEM Exam 3 at 1 PM ──
  E(D.mon2, '06:00', '07:00', 'fixed', "Presidential Review practice (0600, PTGs)", {"course":"AFROTC","prio":"fixed","note":"End time is a guess."}),
  E(D.mon2, '07:30', '11:30', 'work', "CHEM 1210 Exam 3 prep: library block, timed Ch 1-6 practice exam (~2 min/question), then rework the misses", {"course":"CHEM 1210","prio":"must","note":"Trey, 11-1: big library block before the exam. /TKB/courses/chem/exam -> Exam 3."}),
  E(D.mon2, '11:30', '12:30', 'rest', 'Lunch + get to class'),
  E(D.mon2, '13:00', '14:00', 'fixed', 'CHEM 1210 EXAM 3 (cumulative Ch 1-6)', { course: 'CHEM 1210', prio: 'deadline' }),
  E(D.mon2, '15:00', '15:20', 'work', 'ESMG 3200 Week 4 reply #1', { course: 'ESMG 3200', prio: 'must', note: '2 replies are REQUIRED (6 of 20 pts); real due date Thu 11/5.' }),
  E(D.mon2, '15:30', '17:30', 'work', 'ESFF 1120 Init 5+6: sources + skeleton + start the draft', { course: 'ESFF 1120', prio: 'must', note: 'Real due date Wed 11/4.' }),
  E(D.mon2, '19:00', '19:30', 'work', 'CHEM 1210 Quiz 21 prep (Sec 7-1 to 7-3)', { course: 'CHEM 1210', prio: 'must', note: 'Quiz 21 is due Tue 11/3 12:30 PM; take it Tue 8:00 AM after PT.' }),
  E(D.mon2, '19:30', '19:50', 'work', 'Air Force Song + Airman\u2019s Creed', { course: 'AFROTC', prio: 'habit' }),
  E(D.mon2, '23:59', null, 'due', 'DUE: ESMG 3200 Week 4 initial post (posted Sunday night)'),

  // ── Tue 11-3: PT cancelled all week (Presidential Review practices). Everything due Thu moves to Tue/Wed,
  //    because Thursday morning is the review. CHEM 3 hr/day + workout + Warrior Knowledge (standing, 11-2). ──
  E(D.tue2, '09:45', '09:55', 'work', 'AEROS 210: check Learning Suite for DB8 (one Duo approval)', { course: 'AERO 2100', prio: 'must', note: 'Not on Canvas. DB7 was due Fri, so DB8 is probably Fri 11-6.' }),
  E(D.tue2, '09:55', '10:55', 'work', 'MICR 2060 reading: MMAHP Ch 11', { course: 'MICR 2060', prio: 'must', note: 'For OLQ 11 (due Wed 11:59 PM). Hour 1 of the 2 hr/week MICR reading.' }),
  E(D.tue2, '11:15', '12:15', 'work', 'MICR 2060 OLQ 11 (Ch 11)', { course: 'MICR 2060', prio: 'must', note: 'Due Wed 11/4. Study guide: /TKB/courses/worksheets/mmahp-ch10-12 (Trey, 11-3: with the guide these are ~1 hr at the PC, little prep).' }),
  E(D.tue2, '12:15', '12:55', 'work', 'MICR 2060 OLQ 12 (Ch 12) + eat', { course: 'MICR 2060', prio: 'must', note: 'Due Fri 11/7; done early. Same study guide. Finish after CHEM if it runs over.' }),
  E(D.tue2, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210' }),
  E(D.tue2, '14:15', '17:00', 'fixed', 'Run + pick up dinner on the way back', { note: 'Trey, 11-3: ran early instead of 4:30, back ~5 PM with dinner.' }),
  E(D.tue2, '17:00', '20:40', 'fixed', 'AFROTC duties (ran long)', { note: 'Trey, 11-3 evening.' }),
  E(D.tue2, '20:45', '22:45', 'work', 'ESFF 1120 Init 5+6: write the whole paper + SUBMIT', { course: 'ESFF 1120', prio: 'must', note: 'Due Wed 11:59 PM, one attempt. Skeleton: ESFF 1120/Lamb_Initiatives5and6_SKELETON.docx. Dr. L outline: Explanation/Implementation/Impact/Reflection/Reference(s) FOR INITIATIVE N.' }),
  E(D.tue2, '22:45', '23:05', 'work', 'Read the ODC OPORD (Lesson 10, GLPs) + lay out Duty uniform', { course: 'AFROTC', prio: 'must', note: 'ODC is 6 AM Wed.' }),

  // ── Wed 11-4: ODC, then clear everything due Wed AND Thu ──
  E(D.wed2, '06:00', '07:00', 'fixed', 'ODC Lesson 10: GLPs (Duty uniform)', { course: 'AFROTC', note: 'Confirm it is on this week; PT is cancelled for the review practices.' }),
  E(D.wed2, '07:00', '07:10', 'fixed', 'After ODC: ask cadre to schedule the TBAS for next week', { course: 'AFROTC', note: 'For the PCSM (RPA pilot on the OTS list). Allow 7-10 days to get a slot.' }),
  E(D.wed2, '07:15', '12:30', 'rest', 'Slept after ODC', { note: 'Trey, 11-4: slept through the morning blocks; everything re-planned after CHEM class.' }),
  E(D.wed2, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210' }),
  E(D.wed2, '14:15', '16:45', 'work', 'ESFF 1120 Initiatives 5+6: write + SUBMIT', { course: 'ESFF 1120', prio: 'must', note: 'Due TONIGHT 11:59 PM, one attempt. Skeleton: ESFF 1120/Lamb_Initiatives5and6_SKELETON.docx; brief: ESFF1120_Init5+6_BRIEF_2026-11-03.pdf. Check 500-700 words, one source cited per initiative, Reference(s) after each initiative.' }),
  E(D.wed2, '16:45', '17:45', 'work', 'CHEM 1210 review 7-1 to 7-3 for Quiz 21', { course: 'CHEM 1210', prio: 'must', note: 'Slides: CHEM 1210/slides/CHEM1210_Ch7_Slides_Bonding_and_Molecular_Geometry.pdf.' }),
  E(D.wed2, '17:45', '18:15', 'work', 'CHEM 1210 Quiz 21 (7-1 to 7-3)', { course: 'CHEM 1210', prio: 'must', note: 'Due Thu 11/5 12:30 PM; Thursday morning is the Presidential Review.' }),
  E(D.wed2, '18:15', '18:45', 'rest', 'Dinner'),
  E(D.wed2, '18:45', '19:45', 'work', 'MICR 2065 Pre-Lab #8 + Module 8 Case Study', { course: 'MICR 2065', prio: 'must', note: 'Due Thu 11/5 4:00 PM. Fallback: Thu 2-4 PM.' }),
  E(D.wed2, '19:45', '21:15', 'work', 'ESMG 3200 Assignment 4: prompt, rubric, topic, sources, skeleton', { course: 'ESMG 3200', prio: 'must', note: 'Due Thu 11/5 11:59 PM. 1,500-2,000 words, 50 pts. Done today so Thursday is not overloaded.' }),
  E(D.wed2, '21:15', '21:30', 'fixed', 'Lay out review uniform (khakis, polo, Happy Jacket)', { course: 'AFROTC', note: 'Rehearsal 6 AM. Warrior Knowledge and CHEM prep for Thursday dropped today (slept); WK resumes Thu.' }),
  E(D.wed2, '21:30', '21:45', 'work', 'ESMG 3200 Week 4 discussion reply to Ashley Davis (done, 10:47 PM)', { course: 'ESMG 3200', prio: 'done', note: 'Posted 10:47 PM. That is three replies on two separate days, which is more than the two required (Week 1 earned extra credit the same way).' }),
  E(D.wed2, '23:59', null, 'due', 'DUE: ESFF 1120 Initiatives 5+6 paper (one attempt)'),

  // ── Thu 11-5: Presidential Review ──
  E(D.thu2, '06:00', '07:00', 'fixed', 'Presidential Review dress rehearsal at the Det', { course: 'AFROTC' }),
  E(D.thu2, '07:15', '08:00', 'work', 'CHEM 1210 Quiz 21 (7-1 to 7-3)', { course: 'CHEM 1210', prio: 'must', note: 'Due today 12:30 PM, and this is the only free time before then. Bring the laptop. Slides: CHEM 1210/slides/CHEM1210_Ch7_Slides_Bonding_and_Molecular_Geometry.pdf.' }),
  E(D.thu2, '08:00', '09:00', 'class', 'AERO 1100 class', { course: 'AERO 1100', note: 'Trey, 11-5: both morning classes are on today despite the Presidential Review.' }),
  E(D.thu2, '09:00', '09:45', 'class', 'AERO 2100 class, then first formation at the Det', { course: 'AERO 2100', note: 'Trey, 11-5: AERO 2100 is on today. The Presidential Review timeline has first formation at 0915 at the Det, so follow cadre on when class breaks for it.' }),
  E(D.thu2, '09:45', '10:00', 'fixed', 'March to the Presidential Review', { course: 'AFROTC' }),
  E(D.thu2, '10:00', '11:00', 'fixed', 'Presidential Review ceremony (BYU Brigham Square)', { course: 'AFROTC' }),
  E(D.thu2, '11:00', '12:00', 'fixed', 'Reception, Wilkinson Center Garden Court', { course: 'AFROTC', note: 'Trey will probably skip this or the 12:00 Q&A. Use the hour you skip for AEROS 210 DB8 (15 minutes) and 45 minutes of ESMG 3200 Assignment 4. The 8:00 Assignment 4 block was lost to AERO 1100, so this hour matters.' }),
  E(D.thu2, '12:00', '13:00', 'fixed', 'Optional Q&A with LTG Taylor, JKB 1102', { course: 'AFROTC', note: 'Optional. Trey will probably skip this or the 11:00 reception. It ends at 1:00, when CHEM 1210 class starts at UVU: to make class, leave by about 12:40.' }),
  E(D.thu2, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210' }),
  E(D.thu2, '14:00', '15:30', 'work', 'MICR 2065 Pre-Lab #8 + Module 8 Case Study (done)', { course: 'MICR 2065', prio: 'done', note: 'Trey, 11-5: about 1.5 hours for both, as usual. The plan had 1 hour; future weeks get 1.5 hours.' }),
  E(D.thu2, '15:30', '16:00', 'rest', 'Get to MICR 2065 lab', { note: 'The 2-mile run did not happen: the plan gave no time to change into PT gear after the homework or to change back before lab. Tomorrow’s Holy War leg is your run.' }),
  E(D.thu2, '16:00', '18:00', 'class', 'MICR 2065 lab', { course: 'MICR 2065' }),
  E(D.thu2, '18:00', '18:30', 'rest', 'Dinner'),
  E(D.thu2, '18:30', '18:45', 'work', 'ESMG 3200 Week 4 discussion reply to Danielle Peck (done, 10:19 PM)', { course: 'ESMG 3200', prio: 'done', note: 'Extra credit needs posts on 3 separate days. You have Monday (post + 2 replies) and Wednesday (Ashley Davis, 10:47 PM); today is day 3, reply 4. Replies close tonight 11:59 PM. Ideas: ESMG 3200/ESMG3200_W4_REPLY_BRAINSTORM_2026-11-02.md, Reply D.' }),
  E(D.thu2, '18:45', '19:00', 'work', 'AEROS 210 DB8 (Learning Suite), if not done at noon', { course: 'AERO 2100', prio: 'must', note: 'Trey, 11-4: about 15 minutes. Due Friday 11:59 PM if it follows DB7 (check Learning Suite).' }),
  E(D.thu2, '19:00', '22:00', 'work', 'ESMG 3200 Assignment 4: not done, moved to Friday', { course: 'ESMG 3200', prio: 'habit', note: 'Due tonight 11:59 PM. Word count 1,500-2,000 (excluding title + reference pages). Skeleton: ESMG 3200/A4 Program Proposal.docx; every section has its facts and citations in the gray notes. Lengthened to 3 hours because the morning block became AERO 1100. Tell me when done and I will do the final edit.' }),
  E(D.thu2, '23:59', null, 'due', 'DUE: CHEM 1210 Quiz 21 (12:30 PM) · MICR 2065 Pre-Lab #8 + Module 8 Case Study (4 PM) · ESMG 3200 Assignment 4 (11:59 PM)'),

  // ── Fri 11-6: Holy War run (Trey, 11-3: back on the list; ready by 0600 he believes, his leg 0845-0935) ──
  E(D.fri3, '06:00', '08:45', 'fixed', 'Holy War run: report by 0600 (CONFIRM time, place, uniform, ride)', { course: 'AFROTC', note: 'Details still missing: where to report, uniform, transport, when you are back. Downtime before your leg: optional, draft the ESMG 3200 Week 5 post on your phone (brief in the ESMG 3200 folder).' }),
  E(D.fri3, '08:45', '09:35', 'fixed', 'Holy War run: YOUR LEG (0845-0935)', { course: 'AFROTC' }),
  E(D.fri3, '09:35', '10:30', 'travel', 'Back from the run (end time unknown)'),
  E(D.fri3, '10:30', '11:00', 'rest', 'Shower and change'),
  E(D.fri3, '11:00', '11:30', 'work', 'Charlie Flight: update the workout homework', { course: 'AFROTC', prio: 'must', note: 'Trey, 11-5: after the run and 100% before the 1500 flight meeting. Length assumed 30 minutes.' }),
  E(D.fri3, '11:30', '13:15', 'work', 'Studied for the Warrior Knowledge Week 9 quiz (done)', { course: 'AFROTC', prio: 'done', note: 'Trey, 11-6: studied for the quiz after the run instead of the MICR 2065 work, which moves to tonight.' }),
  E(D.fri3, '13:15', '13:45', 'rest', 'Lunch'),
  E(D.fri3, '13:45', '14:30', 'work', 'Studied for the Warrior Knowledge Week 9 quiz (done)', { course: 'AFROTC', prio: 'done' }),
  E(D.fri3, '14:30', '15:00', 'travel', 'To the flight meeting'),
  E(D.fri3, '15:00', '16:00', 'fixed', 'Flight meeting, 1500', { course: 'AFROTC', note: 'Trey, 11-5: going to try to make it; the morning run is a possible excuse, but probably going. Length and place assumed (1 hour); tell me if different.' }),
  E(D.fri3, '16:00', '16:30', 'travel', 'Back from the flight meeting'),
  E(D.fri3, '16:30', '17:45', 'rest', 'Break'),
  E(D.fri3, '17:45', '18:30', 'work', 'TBAS practice session 1 (done)', { course: 'AFROTC', prio: 'done' }),
  E(D.fri3, '18:30', '20:35', 'fixed', 'ROTC emergency (home about 8:45 PM)', { course: 'AFROTC', note: 'Trey, 11-6. The Warrior Knowledge quiz moved to Saturday morning.' }),
  E(D.fri3, '20:50', '22:25', 'work', 'MICR 2065 Lab Notebook #8 + Post-Lab #8 (done: Notebook 10:13 PM, Post-Lab 10:24 PM)', { course: 'MICR 2065', prio: 'done', note: 'Notebook started 8:51 PM and submitted 10:13 PM (82 minutes, mostly photos); Post-Lab submitted 10:24 PM (Canvas). Notebook is pending review.' }),
  E(D.fri3, '20:35', '20:50', 'work', 'AEROS 210 DB8 (Learning Suite): read the article, brainstorm, post', { course: 'AERO 2100', prio: 'must', note: 'Posted status not visible from Canvas; confirm on Learning Suite.' }),
  E(D.fri3, '22:35', '23:00', 'rest', 'Bed (leave for the game about 7:30 AM)'),
  // CHEM 1210 on Friday: Quiz 22 (due Mon 11/9 2:30 PM) moves to Monday morning and the never-taken make-ups (Quiz 5-8)
  // move to next week, because Assignment 4 took the afternoon (Trey, 11-5: not done Thursday).
  E(D.fri3, '23:59', null, 'due', 'DUE: MICR 2065 Lab Notebook #8 + Post-Lab #8 (11:59 PM) · AEROS 210 DB8 (check Learning Suite)'),

  // ── Sat 11-7 + Sun 11-8 (re-planned 11-5, Trey: probably going to the Holy War game Saturday, which takes the first
  // half of the day; must finish the OTS application essays (two sections, about 1,000 words each) this weekend; TBAS
  // practice so he is comfortable testing by Mon, Tue or Wed). Game: BYU at Utah, Rice-Eccles Stadium, 10 AM kickoff.
  // Moved to next week: ESFF 1120 Initiatives 7+8 (Mon/Tue, due Wed 11/11), ESMG 3200 Assignment 5 finish (due Thu 11/12), ESFF 7+8 is submitted only after Dr. L grades 5+6 (Trey, 11-5) and must follow the 11-5 module post.
  // ESMG 3200 Assignment 6 (next weekend, due Thu 11/19), CHEM 1210 Quiz 9 and retakes of Quiz 11 and Quiz 14.
  // ESMG 3200 Assignment 4 (already late, 0/50 until submitted): later this weekend if there is downtime, otherwise next week (Trey, 11-6: "not sweating it tonight").
  // ESMG 3200 Assignment 5 pick-and-read (due Thu 11/12) moved from Sunday to Monday so both OTS essay sections fit on Sunday (11-7, game ran late).
  E(D.sat3, '06:45', '07:15', 'work', 'Honor Points + Warrior Knowledge Week 9 quiz, before you leave', { course: 'AFROTC', prio: 'must', note: 'Closes 4 PM, which is during the game. If you cannot do it before you leave, do it on your phone at the game.' }),
  E(D.sat3, '07:30', '17:30', 'fixed', 'Holy War game: BYU at Utah, 10 AM kickoff (Rice-Eccles Stadium, Salt Lake City)', { note: 'Trey, 11-5: probably going. Home about 5:30 PM (Trey, 5 PM: almost home).' }),
  E(D.sat3, '17:30', '17:45', 'rest', 'Change into running gear'),
  E(D.sat3, '17:45', '18:30', 'fixed', 'Easy run', { note: 'Trey asked for a run and some downtime after the game. Keep it conversational; no workout logged since the Holy War leg Friday.' }),
  E(D.sat3, '18:30', '19:00', 'rest', 'Shower and change'),
  E(D.sat3, '19:00', '19:30', 'rest', 'Dinner'),
  E(D.sat3, '19:30', '20:00', 'work', 'TBAS practice (daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.sat3, '20:00', '20:30', 'work', 'CHEM 1210 Quiz 21 (not taken, moved to Sunday 7:30 PM)', { course: 'CHEM 1210', prio: 'must', note: 'Canvas on Sun 4:30 AM still shows 0/8, missing. It has no lock date and unlimited attempts, so it can still be taken. The 11-5 check wrongly called it done.' }),
  E(D.sat3, '20:30', '21:00', 'work', 'TBAS paperwork: Candidate Worksheet, transcript, ID + SOCIAL SECURITY CARD', { course: 'AFROTC', prio: 'must', note: 'Worksheet: access.afpc.af.mil/pcsmdmz/Candidate Worksheet.pdf (a copy is in AFROTC/PCSM_TBAS_official/). Flight logs only if any, fully totaled. Have it ready in case Capt Malone can test you Monday.' }),
  E(D.sat3, '21:00', '22:00', 'rest', 'Evening off', { note: 'Done: MICR 2060 OLQ 12 retake taken 10:37 PM, 19/20 (up from 16.5; Canvas keeps the highest).' }),

  E(D.sun3, '08:30', '09:15', 'work', 'ESMG 3200 Week 5 discussion post (not posted, moved to Monday 9:30 AM)', { course: 'ESMG 3200', prio: 'must', note: 'Due Mon 11/9 11:59 PM. Open-ended question + one credible source. Replies Mon-Thu for the extra credit. Brief: ESMG 3200/ESMG3200_W5_DISCUSSION_BRIEF_2026-11-05.pdf (three question options with sources). Draft in ESMG3200_W5_Discussion_SKELETON.docx.' }),
  E(D.sun3, '09:30', '11:45', 'work', 'OTS application: first essay section (not written, moved to Monday)', { course: 'AFROTC', prio: 'must', note: 'Moved from Saturday afternoon (the game ran until about 5:30 PM). Tell me the two section prompts and I will build a skeleton with word targets.' }),
  E(D.sun3, '11:45', '12:30', 'rest', 'Lunch'),
  E(D.sun3, '12:30', '13:00', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.sun3, '13:00', '15:15', 'work', 'OTS application: second essay section (not written, moved to Monday)', { course: 'AFROTC', prio: 'must', note: 'Then reread the first section with fresh eyes. Tell me when both are done and I will check grammar, length and any character limits on the form.' }),
  E(D.sun3, '15:15', '15:45', 'work', 'Warrior Knowledge (30 min)', { course: 'AFROTC', prio: 'habit' }),
  E(D.sun3, '16:00', '19:00', 'fixed', 'With friends', { note: 'Trey, 11-4: around 4-7 PM.' }),
  E(D.sun3, '19:30', '20:00', 'work', 'CHEM 1210 Quiz 21 take (late): not taken, moved to Monday 9:00 AM', { course: 'CHEM 1210', prio: 'must', note: 'Missed Thursday and not taken Saturday: Canvas still shows 0/8, missing. No lock date, unlimited attempts, 8 points back.' }),
  E(D.sun3, '20:00', '20:45', 'work', 'CHEM 1210 prep for Monday’s class (Ch 7)', { course: 'CHEM 1210', prio: 'must', note: 'Cut to 45 minutes so Quiz 21 fits and Sunday stays at 7.5 hours of work.' }),

  // ── Mon 11-9: workout, CHEM Quiz 22 before class, ESMG A5 start + W5 reply, TBAS, ESMG A4 (late), PTGs for Tue PT ──
  // ESFF 7+8 (due Wed 11/11): brief + skeleton already exist, so it starts with the bulk draft Tuesday and is polished Wednesday.
  // MICR 2060 Exam 3 (Ch 9, 11, 12; window through Sat 11-14) review starts Tuesday.
  E(D.mon3, '05:45', '06:00', 'rest', 'Change into workout gear'),
  E(D.mon3, '06:00', '06:45', 'fixed', 'Workout before 7 AM (lift or easy run)'),
  E(D.mon3, '06:45', '07:15', 'rest', 'Shower and change'),
  E(D.mon3, '07:15', '07:45', 'rest', 'Breakfast'),
  // Trey, 8:40 AM: Det drop-off around 9, then UVU; OTS essays not written Sunday and promised to the recruiter, so they are today's
  // top priority. He asked for plenty of slack between blocks and to drop the lowest-priority work. Moved off today: CHEM Quiz 21
  // (late, no lock), ESMG W5 reply #1 (Tuesday), ESMG A4 bulk (late; penalty step after Thu 11-12), Warrior Knowledge (skipped today).
  E(D.mon3, '08:45', '09:30', 'travel', 'Drive to the Det: drop-off', { course: 'AFROTC', note: 'Trey, 8:40 AM. Length assumed.' }),
  // 10:40 AM (Trey): at the Det at BYU; rock painting there 2-5 PM. Plan: stay at BYU, skip in-person CHEM class, watch the lecture recording tonight. CHEM attendance is -5 points (of 1,100) per absence unless excused. TBAS kept (30 min, 9:15 PM); Tuesday's CHEM prep folded into the recording.
  E(D.mon3, '09:30', '10:45', 'rest', 'At the Det (BYU): drop-off done, settle in', { course: 'AFROTC' }),
  E(D.mon3, '10:45', '11:15', 'work', 'CHEM 1210 Quiz 22 prep (Sec 7-4, 7-5): not done', { course: 'CHEM 1210', prio: 'must', note: 'Due today 2:30 PM. Do it first: rock painting starts at 2.' }),
  E(D.mon3, '11:15', '11:45', 'work', 'CHEM 1210 Quiz 22: not taken (0/8 missing at 7:15 PM; no lock, take it late this week)', { course: 'CHEM 1210', prio: 'must', note: '30-minute time limit. Due 2:30 PM.' }),
  E(D.mon3, '12:00', '13:30', 'work', 'OTS application: first essay section (about 1,000 words)', { course: 'AFROTC', prio: 'must', note: 'Promised to the recruiter for Sunday; finish today. Get a full rough draft down; it gets finished tonight. Tell me the two section prompts and I will build a skeleton with word targets.' }),
  E(D.mon3, '13:30', '14:00', 'rest', 'Lunch, walk to rock painting'),
  E(D.mon3, '14:00', '17:00', 'fixed', 'AFROTC rock painting (BYU)', { course: 'AFROTC', note: 'Trey: 1400 to about 1700. Instead of CHEM 1210 class (1 PM, UVU).' }),
  E(D.mon3, '17:00', '17:45', 'rest', 'Home + dinner'),
  E(D.mon3, '17:45', '18:00', 'work', 'Lay out PTGs for Tuesday physical training (6 AM)', { course: 'AFROTC', prio: 'must', note: 'Check the Teams OPORD for Tuesday physical training and Wednesday ODC (Morale PT, PTG uniform).' }),
  E(D.mon3, '19:30', '20:15', 'work', 'ESMG 3200 Week 5 discussion post: write + post (DUE TONIGHT)', { course: 'ESMG 3200', prio: 'must', note: 'Not posted Sunday (Canvas 4:32 AM Monday: no entry from you). Due 11:59 PM tonight, 20 pts. Open-ended question + one credible source. Brief: ESMG 3200/ESMG3200_W5_DISCUSSION_BRIEF_2026-11-05.pdf; draft in ESMG3200_W5_Discussion_SKELETON.docx. Discussion day 1 of 3.' }),
  E(D.mon3, '20:15', '22:00', 'work', 'OTS application: second essay section + finish the first', { course: 'AFROTC', prio: 'must', note: 'Then reread both. Tell me when they are done and I will check grammar, length and any character limits on the form before you send them.' }),
  E(D.mon3, '22:00', '22:30', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.mon3, '23:59', null, 'due', 'DUE: ESMG 3200 Week 5 discussion post, 11:59 PM (planned 7:30 PM)'),

  // ── Tue 11-10: PT, ESMG A5 start (moved from Monday) + W5 reply #2, ESFF 7+8 bulk draft, MICR 2060 Exam 3 review (Ch 9), CHEM Quiz 23 early ──
  E(D.tue3, '05:30', '05:45', 'rest', 'Change into PTGs'),
  E(D.tue3, '06:00', '07:00', 'fixed', 'AFROTC PT (AERO 1430R)', { course: 'AFROTC', note: 'Speed day. Workout: Medal of Honor "Chappy", 10 rounds of 3 burpees, 16 walking lunges and a 200m run. There is no rest between rounds, so aim for about 54 seconds per 200m on every round (acceptable 52 to 57). Start at that pace, never faster than 52, and hold the effort if two in a row go over about 58. Gold is under 27:00, which is 2:42 per round. Aim per round: 0:54 for the 200m plus about 1:30 for burpees and lunges (2:24). Clock at the end of round 3: aim 7:12, gold limit 8:06. Round 5: aim 12:00, limit 13:30. Round 8: aim 19:12, limit 21:36. Finish: aim 24:00, limit 27:00.' }),
  E(D.tue3, '07:00', '07:45', 'rest', 'Home, shower and change'),
  E(D.tue3, '07:45', '08:00', 'rest', 'Breakfast'),
  E(D.tue3, '08:00', '09:00', 'work', 'MICR 2060 reading: Exam 3 review, MMAHP Ch 11', { course: 'MICR 2060', prio: 'must', note: 'Exam 3 (Ch 9, 11, 12, 149.99 pts) closes Sat 11-14 11:59 PM. ESMG A5 moved to one 2-hour block Thursday (Trey, 11-9: papers in one sitting).' }),
  E(D.tue3, '16:50', '18:20', 'work', 'ESFF 1120 Init 7+8: write it (one sitting)', { course: 'ESFF 1120', prio: 'must', note: 'Due Wed 11/11 11:59 PM, one attempt. Brief: ESFF 1120/ESFF1120_Init7+8_BRIEF_2026-11-05.pdf; skeleton: Lamb_Initiatives7and8_SKELETON.docx. 500-700 words for both. Use Dr. L outline headings; 5+6 scored 100/100 that way.' }),
  E(D.tue3, '11:15', '11:45', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.tue3, '11:45', '12:45', 'rest', 'Lunch + get to class'),
  E(D.tue3, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210' }),
  E(D.tue3, '14:15', '15:00', 'work', 'MICR 2060 reading: Exam 3 review, MMAHP Ch 9', { course: 'MICR 2060', prio: 'must', note: 'Exam 3 covers Ch 9, 11 and 12; window closes Sat 11-14 11:59 PM, 150 pts. Study guide: /TKB/courses/worksheets/mmahp-ch10-12 (Ch 12 now checked against your graded OLQ 12).' }),
  E(D.tue3, '16:00', '16:30', 'work', 'Warrior Knowledge: memorize a jodie for ODC first, then customs and courtesies cards', { course: 'AFROTC', prio: 'habit', note: 'Trey, 11-10: needs a jodie for Wednesday morale PT. "I Can Run to California" (backups: "Everywhere We Go", "Mama, Mama"); the words are in AFROTC/Jodies.docx. Say it out loud at running pace, then the rest of the block is customs and courtesies cards for the Week 9 quiz.' }),
  E(D.tue3, '15:00', '16:00', 'fixed', 'AEROS 210 Yes-Men group meeting (about 3 PM)', { course: 'AERO 2100', note: 'Trey, 11-10: the group is meeting today around 3. Settle who presents what, put the slides in one place, and set a run-through time. Presentation is Thursday 9 AM in class (followership: the yes-man follower type).' }),
  E(D.tue3, '16:30', '16:50', 'work', 'ESMG 3200 W5 reply #2', { course: 'ESMG 3200', prio: 'must', note: 'Canvas 11:10 AM: Monday night you posted AND replied once (day 1, reply 1). The 9 AM reply had not posted, so it moved here. Today = day 2 of 3, reply 2 of 3+. Use Kales et al. (2007) if it fits a classmate post.' }),
  E(D.tue3, '18:20', '19:00', 'rest', 'Dinner'),
  E(D.tue3, '19:00', '19:30', 'work', 'CHEM 1210 Quiz 23 prep (Sec 7-6)', { course: 'CHEM 1210', prio: 'must', note: 'Due Wed 12:30 PM; Wednesday morning is ODC, so take it tonight.' }),
  E(D.tue3, '19:30', '20:00', 'work', 'CHEM 1210 Quiz 23 take', { course: 'CHEM 1210', prio: 'must', note: '30-minute time limit.' }),
  E(D.tue3, '21:00', '21:15', 'work', 'Read the ODC OPORD + lay out PTGs for Wednesday Morale physical training (6 AM) + say your jodie twice out loud', { course: 'AFROTC', prio: 'must', note: 'OPLAN: ODC 11 Nov is Morale PT, PTG uniform.' }),
  // Trey, 11-10 12:30 PM: 'easy' schedule from now on = the minimum he must do, then 2-3 extras at the end of the day for a good day.
  E(D.tue3, '21:15', '21:45', 'extra', 'Extra if you have time: CHEM 1210: Monday’s lecture recording at 1.5x', { course: 'CHEM 1210', note: 'Moved out of the minimum (Trey, 11-10: CHEM will stay behind this week).' }),
  E(D.tue3, '21:45', '22:15', 'extra', 'Extra if you have time: CHEM 1210 Quiz 21 (late)', { course: 'CHEM 1210', note: '0/8 now, no lock, unlimited attempts.' }),
  E(D.tue3, '22:15', '22:45', 'extra', 'Extra if you have time: OTS application: start essay 1 (objectives and reasons for a commission)', { course: 'AFROTC', note: '2,000 characters; AFROTC/OTS_Application_Objectives.docx has the prompt and helper text.' }),
  // Trey, 11-9 7:30 PM: ESMG A4 finished this week at -10% (option B), as ONE 2-hour block; papers are written in one sitting from now on.
  E(D.wed3, '05:30', '05:45', 'rest', 'Change into PTGs'),
  E(D.wed3, '06:00', '07:00', 'fixed', 'ODC: Veterans Day morale PT (PTGs, bring Jodies)', { course: 'AFROTC', note: 'From Teams: read the OPORD beforehand.' }),
  E(D.wed3, '07:00', '07:45', 'rest', 'Home, shower and change'),
  E(D.wed3, '07:45', '08:00', 'rest', 'Breakfast'),
  E(D.wed3, '08:00', '10:00', 'work', 'ESMG 3200 Assignment 4 (late): write it', { course: 'ESMG 3200', prio: 'must', note: 'Late (0/50 now; -10% through Thu 11:59 PM, then -20%). One 2-hour sitting (Trey, 11-9). Write into ESMG 3200/A4 Program Proposal.docx: the gray notes carry each section target, rubric points and cited facts (about 1,800 words, limit 1,500-2,000). Tell me when done; I do the final edit.' }),
  E(D.wed3, '10:15', '11:15', 'work', 'MICR 2060 reading: Exam 3 review, MMAHP Ch 12', { course: 'MICR 2060', prio: 'must', note: 'Exam 3 closes Sat 11-14 11:59 PM.' }),
  E(D.wed3, '11:15', '11:45', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.wed3, '11:45', '12:45', 'rest', 'Lunch + get to class'),
  E(D.wed3, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210', note: 'Veterans Day: assumed on (events do not cancel classes unless stated).' }),
  E(D.wed3, '14:15', '16:15', 'work', 'MICR 2065 Pre-Lab #9 + Module 9 Case Study', { course: 'MICR 2065', prio: 'must', note: 'Due Thu 4 PM. Rosie (11-9): this case study takes longer than the others and needs Google for some answers; NO AI allowed, so this one is yours alone. Start with the case study. If it runs long, finish it Thursday 2:15 (that block moves to the weekend).' }),
  E(D.wed3, '18:30', '19:00', 'work', 'Warrior Knowledge (30 min)', { course: 'AFROTC', prio: 'habit' }),
  E(D.wed3, '16:15', '16:45', 'work', 'AEROS 210 Yes-Men presentation: your part + slides', { course: 'AERO 2100', prio: 'must', note: 'Presented Thu 9 AM. Parts split at the Tuesday 3 PM group meeting.' }),
  E(D.wed3, '16:45', '17:45', 'fixed', 'Pick up Mom (about 5 PM)', { note: 'Trey, 11-10. Where from, how long the drive is, and how long she is staying are not known yet: ask him. If she stays, it may change Thursday night (ESMG Assignment 5) and the weekend.' }),
  E(D.wed3, '17:45', '18:15', 'rest', 'Dinner'),
  E(D.wed3, '18:15', '18:30', 'work', 'ESMG 3200 W5 reply #3', { course: 'ESMG 3200', prio: 'must', note: 'Day 3 of 3 and reply 3: this one earns both kinds of extra credit (Mon post + reply, Tue reply, Wed reply).' }),
  E(D.wed3, '19:00', '19:15', 'work', 'ESFF 1120 Init 7+8 + ESMG 3200 A4: SUBMIT both after my final edit', { course: 'ESFF 1120', prio: 'must', note: 'ESFF is one attempt, due 11:59 PM tonight. A4 is in by tonight, a day ahead of the -20% step.' }),
  E(D.wed3, '19:15', '19:30', 'work', 'Thursday prep: LLAB OPORD, PTGs, Happy Jacket; PRINT the MICR 2065 Biochemical Fact Sheet (+ study guide)', { course: 'AFROTC', prio: 'must', note: 'Happy Jacket returns: Det basement, 1 hour before or after LLAB Thursday. Fact sheet: Canvas, MICR 2065 Module 9: Dichotomous Key/Flow Chart Information. Rosie wants it on paper for the downtime in lab; no laptops in lab.' }),
  E(D.wed3, '19:30', '20:00', 'extra', 'Extra if you have time: CHEM 1210 Quiz 22 (late)', { course: 'CHEM 1210', note: '0/8 now, no lock, unlimited attempts.' }),
  E(D.wed3, '20:00', '20:45', 'extra', 'Extra if you have time: CHEM 1210 prep for Thursday’s class', { course: 'CHEM 1210' }),
  E(D.wed3, '20:45', '21:15', 'extra', 'Extra if you have time: OTS application: essay 1', { course: 'AFROTC' }),
  E(D.thu3, '05:30', '05:45', 'rest', 'Change into PTGs'),
  E(D.thu3, '06:00', '07:00', 'fixed', 'AFROTC PT (AERO 1430R)', { course: 'AFROTC' }),
  E(D.thu3, '07:00', '07:45', 'rest', 'Home, shower and change'),
  E(D.thu3, '07:45', '08:00', 'rest', 'Breakfast'),
  E(D.thu3, '08:00', '09:00', 'class', 'AERO 1100 class', { course: 'AERO 1100' }),
  E(D.thu3, '09:00', '10:00', 'class', 'AERO 2100 class: Yes-Men group presentation', { course: 'AERO 2100' }),
  E(D.thu3, '10:00', '10:15', 'fixed', 'Return the Happy Jacket (Det basement)', { course: 'AFROTC', note: 'Open 1 hour before and after LLAB. Wash per the tag if worn a lot (Teams).' }),
  E(D.thu3, '10:15', '10:30', 'work', 'ESMG 3200 W5 reply #4 (optional)', { course: 'ESMG 3200', prio: 'must', note: 'Only needed if Tuesday or Wednesday slipped; replies close tonight.' }),
  E(D.thu3, '10:30', '11:00', 'work', 'MICR 2065 lab prep: read the biochemical assay protocol + watch the fact-sheet walkthrough video', { course: 'MICR 2065', prio: 'must', note: 'Rosie (11-9): no lecture or procedure review before you start; you get your unknown and inoculate the biochemical assays right away. You also pass off a quadrant streak and pipetting into a DNA gel (counts toward the practical exam score).' }),
  E(D.thu3, '11:00', '13:00', 'fixed', 'LLAB (AERO 2000)', { course: 'AFROTC' }),
  E(D.thu3, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210', note: 'LLAB ends at 1; you usually arrive late.' }),
  E(D.thu3, '14:15', '15:45', 'work', 'MICR 2060 reading: Exam 3 review, MMAHP Ch 9 + practice', { course: 'MICR 2060', prio: 'must', note: 'Exam 3 closes Sat 11-14 11:59 PM.' }),
  E(D.thu3, '15:45', '16:00', 'rest', 'Get to MICR 2065 lab'),
  E(D.thu3, '16:00', '18:00', 'class', 'MICR 2065 lab', { course: 'MICR 2065' }),
  E(D.thu3, '18:00', '18:30', 'rest', 'Dinner'),
  E(D.thu3, '18:30', '20:30', 'work', 'ESMG 3200 Assignment 5: write it', { course: 'ESMG 3200', prio: 'must', note: 'Due tonight 11:59 PM, 1,000-1,500 words. One 2-hour sitting (Trey, 11-9). Skeleton: ESMG 3200/A5 Case Analysis SKELETON.docx; incident options in the brief PDF (Option A recommended). Tell me when done; I do the final edit.' }),
  E(D.thu3, '20:45', '21:00', 'work', 'ESMG 3200 Assignment 5: SUBMIT after my final edit', { course: 'ESMG 3200', prio: 'must', note: 'Due 11:59 PM.' }),
  E(D.thu3, '21:00', '21:30', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.thu3, '21:30', '22:00', 'work', 'Warrior Knowledge (30 min)', { course: 'AFROTC', prio: 'habit', note: 'Customs and courtesies cards for Saturday’s Week 9 quiz.' }),
  E(D.thu3, '22:00', '22:30', 'extra', 'Extra if you have time: CHEM 1210 Quiz 21 or 22, whichever is still open (late)', { course: 'CHEM 1210' }),
  E(D.thu3, '22:30', '23:00', 'extra', 'Extra if you have time: MICR 2060 Exam 3 practice questions', { course: 'MICR 2060', note: 'The exam is planned for Friday morning.' }),
  // ── Fri 11-13 to Sun 11-15: easy minimum + extras (Trey, 11-10). Mom is visiting from Wed evening (length unknown: ask).
  E(D.fri4, '05:45', '06:00', 'rest', 'Change into running gear'),
  E(D.fri4, '06:00', '06:45', 'fixed', 'Easy run', { note: 'Workout 5 of the week (Tue PT, Wed ODC, Thu PT, Fri, Sat). Conversational pace.' }),
  E(D.fri4, '06:45', '07:30', 'rest', 'Shower and change'),
  E(D.fri4, '07:30', '08:00', 'rest', 'Breakfast'),
  E(D.fri4, '08:00', '09:00', 'work', 'MICR 2060 reading: Exam 3 final review, Ch 11 + study guide', { course: 'MICR 2060', prio: 'must' }),
  E(D.fri4, '09:15', '11:20', 'work', 'MICR 2060 Exam 3: take it', { course: 'MICR 2060', prio: 'must', note: 'One attempt, 125 minutes, about 50 questions + a reading comprehension; the study guide may be open. Closes Sat 11:59 PM, so Friday morning keeps a day of margin.' }),
  E(D.fri4, '11:30', '12:00', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.fri4, '12:00', '13:00', 'rest', 'Lunch'),
  E(D.fri4, '13:00', '14:30', 'work', 'MICR 2065 Lab Notebook #9 + Post-Lab #9 (Blood Microscopy)', { course: 'MICR 2065', prio: 'must', note: 'Due tonight 11:59 PM. Post-Lab is Honorlock, closed book, one attempt; the Notebook has 2 attempts.' }),
  E(D.fri4, '14:45', '15:30', 'work', 'AEROS 210 DB9 (Learning Suite)', { course: 'AERO 2100', prio: 'must', note: 'Due tonight 11:59 PM.' }),
  E(D.fri4, '15:30', '16:00', 'work', 'Warrior Knowledge (30 min)', { course: 'AFROTC', prio: 'habit', note: 'Customs and courtesies cards; the Week 9 quiz is due Saturday 4 PM.' }),
  E(D.fri4, '16:00', '17:00', 'extra', 'Extra if you have time: ESMG 3200 Assignment 6: start writing (due Thu 11-19)', { course: 'ESMG 3200', note: 'Getting ahead: skeleton and brief are in ESMG 3200/. Anything written today shortens Saturday.' }),
  E(D.fri4, '17:00', '17:30', 'extra', 'Extra if you have time: CHEM 1210 make-up Quizzes 5 + 6 (Ch 2)', { course: 'CHEM 1210', note: '0/8 each, no lock.' }),
  E(D.fri4, '17:30', '18:00', 'extra', 'Extra if you have time: MICR 2060 OLQ 13 (Ch 13; due Wed 11-18)', { course: 'MICR 2060' }),
  E(D.sat4, '08:30', '08:45', 'rest', 'Change into gym clothes'),
  E(D.sat4, '08:45', '09:30', 'fixed', 'Workout (lift or easy run)', { note: 'Workout 6 of the week; skip it if Mom’s plans need the morning.' }),
  E(D.sat4, '09:30', '10:00', 'rest', 'Shower and change'),
  E(D.sat4, '10:00', '12:00', 'work', 'ESMG 3200 Assignment 6: write it (one sitting)', { course: 'ESMG 3200', prio: 'must', note: 'Due Thu 11-19, so this is 5 days AHEAD. Skeleton: ESMG 3200/A6 Advocacy Brief SKELETON.docx. Tell me when done; I do the final edit and you submit.' }),
  E(D.sat4, '12:00', '12:45', 'rest', 'Lunch'),
  E(D.sat4, '12:45', '13:15', 'work', 'Warrior Knowledge Week 9 quiz (customs and courtesies): review the cards, then take it', { course: 'AFROTC', prio: 'must', note: 'Closed note. Due 4 PM with your honor points: submit both, then DM the Deputy your point count.' }),
  E(D.sat4, '13:15', '13:45', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.sat4, '13:45', '14:30', 'work', 'OTS application: essay 1 (objectives and reasons for a commission)', { course: 'AFROTC', prio: 'must', note: '2,000 characters. Prompt + helper text: AFROTC/OTS_Application_Objectives.docx. Tell me when done; I check length and grammar.' }),
  E(D.sat4, '14:45', '15:30', 'extra', 'Extra if you have time: CHEM 1210 make-up Quizzes 7 + 8', { course: 'CHEM 1210', note: '0/8 each, no lock.' }),
  E(D.sat4, '15:30', '16:00', 'extra', 'Extra if you have time: CHEM 1210 make-up Quiz 9', { course: 'CHEM 1210' }),
  E(D.sat4, '16:00', '16:30', 'extra', 'Extra if you have time: ESFF 1120 Initiatives 9+10: read the brief before Sunday', { course: 'ESFF 1120' }),
  E(D.sun4, '09:00', '10:45', 'work', 'ESFF 1120 Initiatives 9+10: write it (one sitting)', { course: 'ESFF 1120', prio: 'must', note: 'Due Wed 11-18, so this is 3 days AHEAD. I build the brief and skeleton by Saturday night. Tell me when done; final edit, then you submit.' }),
  E(D.sun4, '11:00', '11:30', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.sun4, '11:30', '12:00', 'work', 'Warrior Knowledge (30 min)', { course: 'AFROTC', prio: 'habit' }),
  E(D.sun4, '12:00', '13:00', 'rest', 'Lunch'),
  E(D.sun4, '13:00', '13:45', 'work', 'ESMG 3200: draft the Week 6 discussion post (post it Monday)', { course: 'ESMG 3200', prio: 'must', note: 'Who Owns Safety? Post Monday so Mon-Tue-Wed are the 3 days for the extra credit.' }),
  E(D.sun4, '14:00', '15:00', 'work', 'CHEM 1210 Quiz 24 prep (8-1 to 8-3) + Monday class prep', { course: 'CHEM 1210', prio: 'must', note: 'Quiz 24 is due Monday 2:30 PM.' }),
  E(D.sun4, '15:00', '15:45', 'work', 'OTS application: essay 2 (leadership attributes)', { course: 'AFROTC', prio: 'must' }),
  E(D.sun4, '17:00', '17:45', 'travel', 'Service Dress on, to the BYU Conference Center'),
  E(D.sun4, '18:00', '19:00', 'fixed', 'Veterans Day Devotional (BYU Conference Center 2254)', { course: 'AFROTC', note: 'Service Dress or Sunday dress, 40 honor points (+100 flight bonus at 90%). React to the Wing Bulletins post for the headcount; plus-ones welcome (Mom?).' }),
  E(D.sun4, '19:00', '19:30', 'travel', 'Home'),
  E(D.sun4, '19:30', '20:00', 'extra', 'Extra if you have time: CHEM 1210 Quiz 24: take it early (due Monday 2:30 PM)', { course: 'CHEM 1210' }),
  E(D.sun4, '20:00', '20:45', 'extra', 'Extra if you have time: CHEM 1210 catch-up: read Ch 8 (8-1 to 8-3)', { course: 'CHEM 1210' }),
  E(D.sun4, '20:45', '21:15', 'extra', 'Extra if you have time: MICR 2060 OLQ 13 if not done (due Wed 11-18)', { course: 'MICR 2060' }),
  E('2026-11-13', '23:59', null, 'due', 'DUE: AEROS 210 DB9 (Learning Suite), 11:59 PM'),
  E('2026-11-14', '16:00', null, 'due', 'DUE: Warrior Knowledge Week 9 quiz (customs and courtesies) + honor points, 4 PM'),
  ALL('2026-11-16', 'work', 'ESMG 3200 Week 6 discussion post (from Sunday’s draft; time set when Monday is planned)', { course: 'ESMG 3200', prio: 'must', note: 'Day 1 of 3 for the extra credit.' }),
  ALL('2026-11-17', 'work', 'ESMG 3200 Week 6 discussion reply #1 (time set when Tuesday is planned)', { course: 'ESMG 3200', prio: 'must', note: 'Day 2 of 3.' }),
  ALL('2026-11-18', 'work', 'ESMG 3200 Week 6 discussion reply #2 (time set when Wednesday is planned)', { course: 'ESMG 3200', prio: 'must', note: 'Day 3 of 3; earns both extra credits with a third reply by Thursday.' }),
  E('2026-11-16', '23:59', null, 'due', 'DUE: ESMG 3200 Week 6 discussion post, 11:59 PM'),
  E('2026-11-18', '12:30', null, 'due', 'DUE: CHEM 1210 Quiz 25 (8-4 to 8-5), 12:30 PM'),
  E('2026-11-18', '23:59', null, 'due', 'DUE: ESFF 1120 Initiatives 9+10 · MICR 2060 OLQ 13, 11:59 PM'),
  E('2026-11-19', '12:30', null, 'due', 'DUE: CHEM 1210 Quiz 26 (9-1 to 9-3), 12:30 PM'),
  E('2026-11-19', '16:00', null, 'due', 'DUE: MICR 2065 Lab Notebook #10 (4 PM) · ESMG 3200 Assignment 6 (11:59 PM)'),
  E('2026-11-12', '23:59', null, 'due', 'DUE: ESMG 3200 Assignment 4 (late), last day at -10%, 11:59 PM (planned Wednesday)'),
  E('2026-11-11', '23:59', null, 'due', 'DUE: ESFF 1120 Initiatives 7+8 paper, 11:59 PM (one attempt)'),
  E('2026-11-12', '09:00', null, 'due', 'DUE: AEROS 210 Yes-Men group presentation, 9 AM in class (followership: the yes-man follower type)'),
  E('2026-11-12', '16:00', null, 'due', 'DUE: MICR 2065 Pre-Lab #9 + Module 9 Case Study (4 PM) · ESMG 3200 Assignment 5 + Week 5 replies (11:59 PM)'),
  E('2026-11-13', '23:59', null, 'due', 'DUE: MICR 2065 Lab Notebook #9 + Post-Lab #9, 11:59 PM'),
  E('2026-11-14', '23:59', null, 'due', 'DUE: MICR 2060 Exam 3 (Ch 9, 11, 12), 11:59 PM'),
  E('2026-11-07', '16:00', null, 'due', 'DUE: Warrior Knowledge quiz (4 PM) · Honor Points (EOD) · MICR 2060 OLQ 12 retake (11:59 PM)'),
  // CHEM quizzes under 90% (Trey, 11-3: take/retake every one, ~30 min each) were planned Sat 9-12 + Sun 9-10.
  // 11-4 writing marathon: Quiz 9, 11, 14 stay (Sat 4:15); retakes of Quiz 10, 12, 20, 1 and 4 move to next week.
  E('2026-11-09', '14:30', null, 'due', 'DUE: CHEM 1210 Quiz 22 (7-4, 7-5), 2:30 PM'),
  E('2026-11-11', '12:30', null, 'due', 'DUE: CHEM 1210 Quiz 23 (7-6), 12:30 PM'),
  E('2026-11-16', '14:30', null, 'due', 'DUE: CHEM 1210 Quiz 24 (8-1 to 8-3), 2:30 PM'),
];

// Dates that matter beyond the day-by-day blocks: exams, ROTC events, windows. Drawn on the MFT calendar
// as all-day ★ chips (planOverlayByDate) and included in the phone feed (scripts/exportSchedule.mjs). `tbc` marks a date that is a best estimate.
export const IMPORTANT_DATES = [
  { date: '2026-11-05', title: 'Presidential Review (practice 0600, review 1000)', course: 'AFROTC' },
  { date: '2026-11-06', title: 'Holy War run (your leg 0845-0935)', course: 'AFROTC', tbc: true },
  { date: '2026-11-08', end: '2026-11-14', title: 'MICR 2060 Exam 3 window', course: 'MICR 2060' },
  { date: '2026-11-11', title: 'ODC: Morale PT (PTG uniform)', course: 'AFROTC' },
  { date: '2026-11-17', title: 'Retreat, 1730', course: 'AFROTC' },
  { date: '2026-11-19', title: 'ORI I (Service Dress)', course: 'AFROTC' },
  { date: '2026-11-30', title: 'CHEM 1210 Exam 4 (Ch 1-8): date not announced, late Nov likely', course: 'CHEM 1210', tbc: true },
  { date: '2026-12-03', title: 'Change of Command', course: 'AFROTC' },
  { date: '2026-12-07', title: 'CHEM 1210 FINAL (ACS), 1:00 PM, no makeup', course: 'CHEM 1210' },
];

// Course colours come from COURSE_COLORS; these are only for items with no course (greys, so they never read as a class).
export const KIND_COLORS = { fixed: '#e2e8f0', work: '#e2e8f0', due: '#f87171', travel: '#9ca3af', class: '#e2e8f0', rest: '#a8a29e', extra: '#7dd3fc' };
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
export function planOverlayByDate(plan = PLAN, important = IMPORTANT_DATES) {
  const map = {};
  for (const e of plan) {
    const timed = Boolean(e.start);
    (map[e.date] ||= []).push({
      id: `plan::${e.id}`, calId: 'plan', calName: 'Plan', color: KIND_COLORS[e.kind] ?? '#94a3b8',
      title: e.title, date: e.date, kind: e.kind, course: e.course ?? null, time: timed ? clock(e.start) : null, sortKey: timed ? e.start : '', allDay: !timed, link: null,
    });
  }
  for (const d of important) {
    (map[d.date] ||= []).push({
      id: `plan::imp::${d.date}::${d.title}`, calId: 'plan', calName: 'Plan', color: '#f472b6',
      title: `★ ${d.title}${d.end ? ` (through ${d.end.slice(5)})` : ''}${d.tbc ? ' (to confirm)' : ''}`,
      date: d.date, kind: 'star', course: d.course ?? null, time: null, sortKey: '', allDay: true, link: null,
    });
  }
  for (const list of Object.values(map)) list.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return map;
}

export const PLAN_BY_DATE = planOverlayByDate();
