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
  mon5: '2026-11-16', tue5: '2026-11-17',
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
  E(D.tue3, '14:45', '16:15', 'work', 'ESFF 1120 Init 7+8: written, final-edited and SUBMITTED (9:43 PM)', { course: 'ESFF 1120', prio: 'must', note: 'Due Wed 11/11 11:59 PM, one attempt. Brief: ESFF 1120/ESFF1120_Init7+8_BRIEF_2026-11-05.pdf; skeleton: Lamb_Initiatives7and8_SKELETON.docx. 500-700 words for both. Use Dr. L outline headings; 5+6 scored 100/100 that way.' }),
  E(D.tue3, '16:15', '16:35', 'work', 'ESMG 3200 W5 reply #2', { course: 'ESMG 3200', prio: 'must', note: 'Canvas 11:10 AM: Monday night you posted AND replied once (day 1, reply 1). The 9 AM reply had not posted, so it moved here. Today = day 2 of 3, reply 2 of 3+. Use Kales et al. (2007) if it fits a classmate post.' }),
  E(D.tue3, '16:35', '16:55', 'rest', 'Break: gas station', { note: 'Trey, 11-10 2:40 PM.' }),
  E(D.tue3, '16:55', '17:25', 'work', 'CHEM 1210 Quiz 23 prep (Sec 7-6): not done, moved to Wednesday 11:15 AM', { course: 'CHEM 1210', prio: 'must', note: 'Due Wed 12:30 PM; Wednesday morning is ODC, so take it tonight.' }),
  E(D.tue3, '17:25', '17:55', 'work', 'CHEM 1210 Quiz 23 take: not done, moved to Wednesday 11:15 AM', { course: 'CHEM 1210', prio: 'must', note: '30-minute time limit.' }),
  E(D.tue3, '17:55', '18:25', 'work', 'Warrior Knowledge: memorize a jodie for ODC first, then customs and courtesies cards', { course: 'AFROTC', prio: 'habit', note: 'Trey, 11-10: needs a jodie for Wednesday morale PT. "I Can Run to California" (backups: "Everywhere We Go", "Mama, Mama"); the words are in AFROTC/Jodies.docx. Say it out loud at running pace, then the rest of the block is customs and courtesies cards for the Week 9 quiz.' }),
  E(D.tue3, '18:30', '19:30', 'fixed', 'AEROS 210 Yes-Men group meeting', { course: 'AERO 2100', note: 'Trey, 11-10 2:40 PM: moved from about 3 PM to 6:30 PM (length assumed one hour). Settle who presents what and put the slides in one place; presented Thu 9 AM.' }),
  E(D.tue3, '19:30', '20:00', 'rest', 'Dinner'),
  E(D.tue3, '20:00', '20:30', 'work', 'TBAS practice (30 min, daily until the test)', { course: 'AFROTC', prio: 'must' }),
  E(D.tue3, '11:45', '12:45', 'rest', 'Lunch + get to class'),
  E(D.tue3, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210' }),
  E(D.tue3, '21:00', '21:15', 'work', 'Read the ODC OPORD + lay out PTGs for Wednesday Morale physical training (6 AM) + say your jodie twice out loud', { course: 'AFROTC', prio: 'must', note: 'OPLAN: ODC 11 Nov is Morale PT, PTG uniform.' }),
  // Trey, 11-10 12:30 PM: 'easy' schedule from now on = the minimum he must do, then 2-3 extras at the end of the day for a good day.
  E(D.tue3, '21:15', '21:45', 'extra', 'Extra if you have time: CHEM 1210: Monday’s lecture recording at 1.5x', { course: 'CHEM 1210', note: 'Moved out of the minimum (Trey, 11-10: CHEM will stay behind this week).' }),
  E(D.tue3, '21:45', '22:15', 'extra', 'Extra if you have time: CHEM 1210 Quiz 21 (late)', { course: 'CHEM 1210', note: '0/8 now, no lock, unlimited attempts.' }),
  E(D.tue3, '22:15', '22:45', 'extra', 'Extra if you have time: OTS application: start essay 1 (objectives and reasons for a commission)', { course: 'AFROTC', note: '2,000 characters; AFROTC/OTS_Application_Objectives.docx has the prompt and helper text.' }),
  // Trey, 11-9 7:30 PM: ESMG A4 finished this week at -10% (option B), as ONE 2-hour block; papers are written in one sitting from now on.
  E(D.wed3, '05:30', '05:45', 'rest', 'Change into PTGs'),
  E(D.wed3, '06:00', '07:00', 'fixed', 'ODC: Veterans Day morale PT (PTGs, bring Jodies)', { course: 'AFROTC', note: 'From Teams: read the OPORD beforehand.' }),
  E(D.wed3, '07:00', '07:45', 'rest', 'Ask Capt Malone for a TBAS date, then home, shower and change', { course: 'AFROTC', note: 'Trey, 11-10: follow up on TBAS scheduling. The OTS application cannot be submitted until the TBAS is taken (and both essays are in); then the commander’s interview. Emailed him 11-5, no reply yet. Ask in person after ODC; if he is not there, send the short follow-up email today.' }),
  E(D.wed3, '07:45', '08:00', 'rest', 'Breakfast'),
  E(D.wed3, '08:15', '09:15', 'work', 'CHEM 1210 Quiz 23 prep + take (Sec 7-6, due 12:30 PM)', { course: 'CHEM 1210', prio: 'must', note: '30-minute time limit. Not taken Tuesday night.' }),
  // ── 2026-11-11 REALISTIC REBUILD (Trey: "This schedule is INSANELY packed ... it has to be realistic") ──
  // GOAL OF THIS STRETCH (Wed 11-11 to Sun 11-15): (1) nothing new goes late, (2) CHEM 1210 Exam 4 (probably Tue 11-17)
  // gets about 4 hours of prep before Monday, (3) get ahead where it fits: ESFF 1120 Initiatives 9+10 on Sunday (3 days
  // early); ESMG 3200 Assignment 6 is the Saturday lock-in extra (5 days early if he takes it, on time if not).
  // REALISM RULES (enforced in studyPlan.test.js): committed time (work + class + ROTC + travel) <= 11 h a day; lunch and
  // dinner 45+ min; a break or transition before every work block; no block over about 2 h; 45+ min of downtime every day;
  // the night before a 6 AM PT/ODC the must-do list ends by 9:30 PM.
  E(D.wed3, '09:15', '09:30', 'rest', 'Break'),
  E(D.wed3, '09:30', '11:30', 'work', 'ESMG 3200 Assignment 4 (late): write it (one sitting)', { course: 'ESMG 3200', prio: 'must', note: 'Late (0/50 now; -10% through Thu 11:59 PM, then -20%). Write into ESMG 3200/A4 Program Proposal.docx with ESMG3200_A4_BRIEF_by-section_2026-11-11.docx open beside it. Write "(citation)" wherever you use a source; tell me when done and I do the final edit while you are in class.' }),
  E(D.wed3, '11:30', '11:45', 'rest', 'Break'),
  E(D.wed3, '11:45', '12:45', 'rest', 'Lunch + get to class'),
  E(D.wed3, '13:00', '14:00', 'class', 'CHEM 1210 class', { course: 'CHEM 1210', note: 'Ask whether Exam 4 really is Tuesday 11-17.' }),
  E(D.wed3, '14:00', '14:15', 'rest', 'Break (walk, bathroom)'),
  E(D.wed3, '14:15', '15:00', 'work', 'CHEM 1210 Quiz 24 prep + take (8-1 to 8-3)', { course: 'CHEM 1210', prio: 'must', note: 'Due Thursday 2:30 PM, but Thursday has no realistic slot (PT, two AERO classes, LLAB, CHEM, lab). Today, fresh out of class, is the best time.' }),
  E(D.wed3, '15:00', '15:15', 'work', 'ESMG 3200 W5 reply #3 (done, posted before bed)', { course: 'ESMG 3200', prio: 'done', note: 'Day 3 of 3: this one earns the discussion extra credit. Trey, 11-11 night: posted.' }),
  E(D.wed3, '15:15', '15:25', 'rest', 'Break'),
  E(D.wed3, '15:25', '17:10', 'work', 'MICR 2065 Pre-Lab #9 + Module 9 Case Study', { course: 'MICR 2065', prio: 'must', note: 'Due Thu 4 PM. Rosie (11-9): this case study takes longer than the others and needs Google for some answers; NO AI allowed, so this one is yours alone. Start with the case study. If it runs long, Thursday 2:45-3:40 is held open to finish it.' }),
  E(D.wed3, '17:10', '18:15', 'fixed', 'Pick up Mom (5:30 PM)', { note: 'Trey, 11-11: pickup at 5:30. Where from and how long she is staying are still unknown.' }),
  E(D.wed3, '18:15', '18:30', 'rest', 'Settle Mom in'),
  E(D.wed3, '18:30', '19:00', 'travel', 'Drive to the BYU Det'),
  E(D.wed3, '19:00', '19:30', 'fixed', 'AEROS 210 Yes-Men project at the BYU Det', { course: 'AERO 2100', note: 'Trey, 11-11: group work 7:00-7:30 PM. Bring your part; presented Thursday 9 AM.' }),
  E(D.wed3, '19:30', '20:00', 'travel', 'Home'),
  E(D.wed3, '20:00', '20:45', 'rest', 'Dinner (with Mom)'),
  E(D.wed3, '20:45', '21:00', 'work', 'Thursday prep: PTGs, LLAB OPORD, Happy Jacket in the car, your Yes-Men part + ESMG 3200 W5 reply #3 before bed', { course: 'AFROTC', prio: 'must', note: 'Fact sheet is printed at the Det tomorrow (Trey, 11-11). W5 reply #3 was not posted during the day; Trey posts it before bed (day 3). Trey, 11-11 ~9:20 PM: no papers tonight, so ESMG A4 is not submitted today.' }),
  E(D.wed3, '21:00', '21:15', 'extra', 'Extra if you have time: Warrior Knowledge cards (15 minutes)', { course: 'AFROTC', note: 'No Warrior Knowledge or TBAS block fit today without cutting meals or sleep.' }),
  E(D.wed3, '21:15', '21:45', 'extra', 'Extra if you have time: CHEM 1210 Quiz 22 (late)', { course: 'CHEM 1210', note: 'Only if you are not tired. Late quizzes still count.' }),
  E(D.thu3, '05:30', '05:45', 'rest', 'Change into PTGs'),
  E(D.thu3, '06:00', '07:00', 'fixed', 'AFROTC PT (AERO 1430R): Group 2, Track/Grey: threshold pyramid + push-up ladder', { course: 'AFROTC', note: 'Threshold pace about 9:00 per mile (from your 16:42 test): hard breathing, short phrases, never a sprint, even on the 1-minute reps. Then the push-up / push-press ladder 1 to 10 and back.' }),
  E(D.thu3, '07:00', '07:40', 'rest', 'Home, shower and change'),
  E(D.thu3, '07:40', '08:00', 'rest', 'Breakfast'),
  E(D.thu3, '08:00', '09:00', 'class', 'AERO 1100 class', { course: 'AERO 1100' }),
  E(D.thu3, '09:00', '10:00', 'class', 'AERO 2100 class: Yes-Men group presentation', { course: 'AERO 2100' }),
  E(D.thu3, '10:00', '10:15', 'rest', 'Break, walk to the Det'),
  E(D.thu3, '10:15', '10:35', 'fixed', 'Det: return the Happy Jacket, PRINT the MICR 2065 Biochemical Fact Sheet, talk to Capt Malone (TBAS date), get your Det patch', { course: 'AFROTC', note: 'Trey, 11-12: talk to Capt Malone (TBAS date; your 11-5 email got no reply; if he is not in, catch him around LLAB). Det patch: you expect to get it today; if not, buy it on your next Det visit. Trey, 11-11: print the fact sheet at the Det. Canvas: MICR 2065, Module 9: Dichotomous Key/Flow Chart Information. Rosie wants it on paper; no laptops in lab. Happy Jacket window is 1 hour before and after LLAB.' }),
  E(D.thu3, '10:35', '11:00', 'rest', 'Downtime before LLAB (arrive early, decompress)'),
  E(D.thu3, '11:00', '13:00', 'fixed', 'LLAB (AERO 2000): Intro to GLP, Duty uniform, Crabtree 214', { course: 'AFROTC', note: 'From the OPLAN (11-12 row): Intro to GLP, Duty uniform, Crabtree 214. Read the LLAB OPORD on Teams if one was posted.' }),
  E(D.thu3, '13:00', '14:00', 'class', 'CHEM 1210 class (may skip: LLAB runs to 1)', { course: 'CHEM 1210', note: 'Trey, 11-11: may miss CHEM class for LLAB. If you skip, eat lunch 1:00-1:45 (no other meal slot until dinner) and start the Case Study at 1:45.' }),
  E(D.thu3, '14:00', '14:15', 'rest', 'Break'),
  E(D.thu3, '14:15', '15:40', 'work', 'Email Lt Col Smith (AEROS 110 midterm makeup, 5 min, unless already sent), then MICR 2065 Module 9 Case Study + Pre-Lab #9 (both due 4 PM), then skim the biochemical assay protocol', { course: 'MICR 2065', prio: 'must', note: 'Lt Col Smith: corbanjs@byu.edu; the AEROS 110 midterm closed Wed 11-11 11:59 PM and is 0/33; ask for a makeup. Not done Wednesday (Canvas 11-11 9:17 PM: both unsubmitted), so this uses the slot held open for exactly that. Case Study first (yours alone, no AI; Google allowed), Pre-Lab second; skip the walkthrough video if short on time. Rosie (11-9): you get your unknown and inoculate the biochemical assays right away; you also pass off a quadrant streak and pipetting into a DNA gel.' }),
  E(D.thu3, '15:40', '16:00', 'rest', 'Get to MICR 2065 lab: PRINT the Biochemical Fact Sheet at a UVU printer on the way', { note: 'Trey, 11-12: not printed at the Det this morning. Canvas: MICR 2065, Module 9: Dichotomous Key/Flow Chart Information. Rosie wants it on paper; no laptops in lab.' }),
  E(D.thu3, '16:00', '18:00', 'class', 'MICR 2065 lab', { course: 'MICR 2065' }),
  E(D.thu3, '18:00', '18:20', 'travel', 'Home'),
  E(D.thu3, '18:20', '19:05', 'rest', 'Dinner'),
  // Trey, 11-11 ~9:30 PM: no papers Wednesday. Thursday night = Post-Lab #9 right after lab, then both papers; no early Friday, so he stays up.
  // A5 first (due 11:59 PM, still on time). A4 is late: -10% through 11:59 PM tonight, -20% after, so it most likely lands at -20%.
  E(D.thu3, '19:05', '19:40', 'work', 'MICR 2065 Lab Notebook #9 (Blood Microscopy, Lab 8): about half', { course: 'MICR 2065', prio: 'must', note: 'Trey, 11-12: about half tonight, the Post-Lab #9 quiz tomorrow. Both due Fri 11:59 PM.' }),
  E(D.thu3, '19:40', '19:50', 'rest', 'Break'),
  E(D.thu3, '19:50', '21:50', 'work', 'ESMG 3200 Assignment 5: write it (one sitting)', { course: 'ESMG 3200', prio: 'must', note: 'Due tonight 11:59 PM, 1,000-1,500 words. Topic: hazmat, the 2020 Satartia CO2 pipeline rupture. Skeleton: ESMG 3200/A5 Case Analysis HAZMAT SKELETON.docx; brief: ESMG3200_A5_HAZMAT_BRIEF_by-section_2026-11-11.docx. Tell me when done; I do the final edit while you take a break.' }),
  E(D.thu3, '21:50', '22:05', 'rest', 'Break while I do the A5 final edit'),
  E(D.thu3, '22:05', '22:15', 'work', 'ESMG 3200 Assignment 5: SUBMIT (moved to Monday)', { course: 'ESMG 3200', prio: 'must', note: 'Due 11:59 PM.' }),
  E(D.thu3, '22:15', '22:30', 'rest', 'Break'),
  E(D.thu3, '22:30', '23:59', 'work', 'ESMG 3200 Assignment 4 (late): write it (one sitting, finishes after midnight)', { course: 'ESMG 3200', prio: 'must', note: 'Topic: cardiovascular health and fitness. Skeleton: ESMG 3200/A4 Program Proposal - CARDIOVASCULAR SKELETON.docx; brief: ESMG3200_A4_CARDIO_BRIEF_by-section_2026-11-11.docx. Submitted after 11:59 PM it is -20% instead of -10% (about 5 more points of 50). Tell me when done; I do the final edit.' }),
  // Thursday ends after midnight (Trey's call), so Friday starts late and the run moves to the afternoon. Post-Lab #9 quiz is Friday afternoon.
  // 11-13 morning check (Canvas 9:12 AM): A4 submitted 12:56 AM; ESMG A5 was NOT written Thursday night (0/50 missing, late
  // -10% through Thu 11-19; Trey, 11-13 00:50: A5 is Friday). Trey, 11-13 ~10 AM: nothing starts until noon, and the
  // STANDING Friday 1500 flight meeting was missing from this day (it was only ever planned week by week; now a test).
  E(D.fri4, '00:00', '00:30', 'work', 'ESMG 3200 Assignment 4: SUBMITTED 12:56 AM (late)', { course: 'ESMG 3200', prio: 'done', note: 'Final edit 12:50 AM: 1,988 body words, 13 references. Late tier -20%.' }),
  E(D.fri4, '11:15', '12:00', 'rest', 'Lunch (eat before you start: the exam runs past 2)'),
  E(D.fri4, '12:00', '14:15', 'work', 'MICR 2060 Exam 3: take it (did not happen Friday; moved to Saturday 9:45 AM)', { course: 'MICR 2060', prio: 'must', note: 'One attempt, 125 minutes, about 50 questions + a reading comprehension; the study guide may be open. You scored 19-20/20 on OLQs 9-12. Closes Sat 11:59 PM; Saturday has no open slot for it, so do it now.' }),
  E(D.fri4, '14:15', '14:30', 'rest', 'Break'),
  E(D.fri4, '14:30', '15:00', 'travel', 'To the flight meeting'),
  E(D.fri4, '15:00', '16:00', 'fixed', 'Charlie Flight meeting (1500, every Friday): workout homework up to date first', { course: 'AFROTC', note: 'Standing weekly meeting. Trey, 11-13: the Charlie Flight workout homework is not required but they like it current; you update it daily, so just check it is up to date before you go. Length is not set and can run past an hour; planned as 1 hour with 30 minutes of travel each way.' }),
  E(D.fri4, '16:00', '16:30', 'travel', 'Back from the flight meeting (later if it runs long)'),
  E(D.fri4, '16:30', '16:40', 'rest', 'Break'),
  E(D.fri4, '16:40', '17:55', 'work', 'DONE: MICR 2065 Lab Notebook #9 (11:20 PM) + Post-Lab #9 (11:41 PM, 12.83/15)', { course: 'MICR 2065', prio: 'done', note: 'Both due tonight 11:59 PM. Both cover Blood Microscopy (Lab 8). Notebook has 2 attempts; the Post-Lab has one.' }),
  E(D.fri4, '17:55', '18:05', 'rest', 'Break'),
  E(D.fri4, '18:05', '18:20', 'work', 'To-do list (15 min): message Capt Malone to book TBAS + ask for the right Form 48; email Kellie Lake for a Form 48 signature; react to the cadre PFRA post', { course: 'AFROTC', prio: 'must', note: 'Trey, 11-12: no-deadline items that keep slipping. (1) Capt Malone: TBAS on Mon 11-16 or Wed 11-18 after ODC (avoid Tue 11-17: PT 2-mile + CHEM Exam 4 + your final retreat); in the same message ask which Form 48 template he wants (or save it from the Holm Center Form 048 page). (2) Form 48: tell me your Spring 2027 classes (12+ credit hours) and your graduation term; email your advisor Kellie Lake to re-sign. (3) Lt Col Smith: emailed (Trey, 11-13); watch for his reply. (4) 10 seconds: react to the cadre PFRA final-chance post on Teams (due Mon 11-23 0800).' }),
  E(D.fri4, '18:20', '18:30', 'rest', 'Break'),
  E(D.fri4, '18:30', '19:00', 'work', 'Yankee Flight: assign the new flight roles and post them (TODAY)', { course: 'AFROTC', prio: 'must', note: 'Trey, 11-13: roles need to go out today. Your call who goes where; the Yankee GMC roster (19) is in STATE.md (11-12). Post it to the Yankee Flight ODC chat.' }),
  E(D.fri4, '19:00', '19:45', 'rest', 'Dinner'),
  E(D.fri4, '19:45', '21:45', 'work', 'ESMG 3200 Assignment 5 (late): did not happen Friday (moved to Monday)', { course: 'ESMG 3200', prio: 'must', note: 'Not written Thursday (Canvas 11-13 9:12 AM: 0/50, missing). Late: -10% through Thu 11-19, so if tonight runs long it can slide to Sunday with no extra loss. 1,000-1,500 words. Topic: hazmat, the 2020 Satartia CO2 pipeline rupture. Skeleton: ESMG 3200/A5 Case Analysis HAZMAT SKELETON.docx; brief: ESMG3200_A5_HAZMAT_BRIEF_by-section_2026-11-11.docx. Write "(citation)" wherever you use a source; tell me when done and I do the final edit during your break.' }),
  E(D.fri4, '21:45', '22:00', 'rest', 'Break (I do the A5 final edit)'),
  E(D.fri4, '22:00', '22:15', 'work', 'ESMG 3200 Assignment 5: SUBMIT', { course: 'ESMG 3200', prio: 'must', note: 'Upload Lamb_ESMG3200_A5_FINAL.docx.' }),
  E(D.fri4, '22:15', '23:00', 'rest', 'Downtime'),
  E(D.fri4, '23:00', '23:30', 'extra', 'Extra if you have time: Warrior Knowledge review (roster, insignia, Song and Creed)', { course: 'AFROTC', note: 'Week 9 quiz DONE (Trey, Fri 11-13). This is the daily review only.' }),
  E(D.fri4, '23:30', '23:59', 'extra', 'Extra if you have time: MICR 2065 Pre-Lab #9 (late, 10 points, 30 min)', { course: 'MICR 2065', note: 'Trey, 11-13: not done; allot 30 minutes. Canvas: unsubmitted, no lock. 300+ word synopsis of the Unknown Part 1 videos. If skipped, it moves to Saturday.' }),
  // The easy run moved to Sunday 7:45 AM: a noon start plus the flight meeting leaves no room for it on Friday.
  // Sat 11-14 rebuilt 11-11 (Trey): UVU Resource Fair 12:30-1:30 (signing up) + stadium cleanup at the BYU vs Baylor home game
  // (kickoff 1:30 PM Mountain per the AP preview, not officially confirmed; cleanup is announced only as "after halftime", so plan
  // on being there ~30 min before the estimated end, as on 10/31). Three trips out, so the gym workout is dropped (it was workout 6
  // of the week) and CHEM moves to the morning. ESMG A6 is no longer a Saturday extra: it goes to Tuesday night after Exam 4.
  E(D.sat4, '08:30', '09:00', 'rest', 'Breakfast'),
  // 11-14 morning check (Canvas 9:31 AM): MICR 2060 Exam 3 was NEVER STARTED (no attempt on Canvas) and it closes TONIGHT 11:59 PM,
  // 150 points, one attempt. It takes the morning, before the fair, so cleanup running long can't cost it. CHEM Quiz 24 + 22 move
  // to after dinner; honor points ride with TBAS after lunch (due 4 PM).
  E(D.sat4, '09:35', '09:45', 'rest', 'Set up for the exam: Ch 9, 11, 12 + OLQ 9-12 open, access code from your proctor (same as Exams 1 and 2)'),
  E(D.sat4, '09:45', '11:50', 'work', 'DONE: MICR 2060 Exam 3 (10:22 AM-12:22 PM, 93.39/150)', { course: 'MICR 2060', prio: 'done', note: 'Canvas 11-15: complete, 93.39 of 149.99 (62%).' }),
  E(D.sat4, '11:50', '11:55', 'rest', 'Break'),
  E(D.sat4, '11:55', '12:00', 'work', 'Honor points: submit + DM the Deputy your count (due 4 PM). Pack running gear', { course: 'AFROTC', prio: 'must', note: 'Trey, 11-14: remind him. Warrior Knowledge Week 9 quiz is DONE (Friday).' }),
  E(D.sat4, '12:00', '12:30', 'travel', 'Drive to UVU, park, walk to the Sorensen Center'),
  E(D.sat4, '12:30', '13:30', 'fixed', 'UVU Resource Fair, Sorensen Center (set-up 12:30-12:55, fair 12:55-1:30)', { note: 'Trey signing up, 11-11. Other dates: Tue 12/15, Wed 1/6, Fri 1/8, same times.' }),
  // Trey, 11-14: run right after the fair, changing on campus. As coach: EASY effort (conversational), not a workout:
  // the PT 2-mile is Tuesday, so this replaces Sunday's easy run and Sunday + Monday stay off running.
  E(D.sat4, '13:30', '13:45', 'rest', 'Change into running gear at UVU'),
  E(D.sat4, '13:45', '14:30', 'fixed', 'Easy run from campus (conversational effort, about 30-40 minutes)', { note: 'Workout 5 of the week (replaces Sunday). Easy, not a test: the PT 2-mile is Tuesday.' }),
  E(D.sat4, '14:30', '14:45', 'rest', 'Cool down, change'),
  E(D.sat4, '14:45', '15:05', 'travel', 'Home'),
  E(D.sat4, '15:05', '15:20', 'rest', 'Shower and change'),
  E(D.sat4, '15:20', '16:05', 'rest', 'Lunch (late: have a snack before running)'),
  E(D.sat4, '16:05', '16:50', 'rest', 'Downtime'),
  E(D.sat4, '16:50', '17:20', 'work', 'Yankee Flight: assign the new flight roles and post them (overdue from Friday)', { course: 'AFROTC', prio: 'must', note: 'Trey, 11-14: not done Friday. Your call who goes where; the Yankee GMC roster (19) is in STATE.md (11-12). Post it to the Yankee Flight ODC chat.' }),
  E(D.sat4, '17:20', '17:30', 'rest', 'Break'),
  E(D.sat4, '17:30', '18:00', 'work', 'TBAS practice (30 min)', { course: 'AFROTC', prio: 'must' }),
  E(D.sat4, '18:00', '18:15', 'rest', 'Break'),
  E(D.sat4, '18:15', '19:00', 'rest', 'Dinner'),
  E(D.sat4, '19:00', '19:15', 'rest', 'Change for stadium cleanup (warm, waterproof)'),
  E(D.sat4, '19:15', '19:45', 'travel', 'To LaVell Edwards Stadium (leave 7:00-7:30; game-day traffic and parking)'),
  E(D.sat4, '19:45', '21:45', 'fixed', 'Stadium cleanup, BYU vs Baylor (starts about 8 PM; kickoff moved to about 5 PM)', { course: 'AFROTC', note: 'Trey, 11-14 ~10 AM: the game now kicks off around 5 PM, so cleanup starts around 8 PM; leave 7:00-7:30. End time unknown: planned to 9:45.' }),
  E(D.sat4, '21:45', '22:15', 'travel', 'Home'),
  E(D.sat4, '22:15', '22:45', 'extra', 'Extra if you have time: Warrior Knowledge review (roster, insignia, Song and Creed)', { course: 'AFROTC' }),
  E(D.sat4, '22:45', '23:15', 'extra', 'Extra if you have time: MICR 2065 Pre-Lab #9 (late, 10 points, 30 min)', { course: 'MICR 2065', note: 'Canvas 11-14: still unsubmitted, no lock. 300+ word synopsis of the Unknown Part 1 videos.' }),
  E(D.sun4, '08:45', '09:15', 'rest', 'Breakfast'),
  E(D.sun4, '09:30', '11:30', 'work', 'CHEM 1210 Quiz 24 + Quiz 22 + Exam 4 prep: not done (Canvas 11-16: both still 0/8), moved to Monday 7:55 AM and Tuesday 8:25 AM', { course: 'CHEM 1210', prio: 'must', note: 'Moved to the morning 11-15 (the ESFF brief was not ready). Canvas 11-15: Quiz 24 + 22 still 0/8, no lock. Quiz 25 (8-4, 8-5) is due Monday 12:30 PM; Exam 4 probably Tuesday.' }),
  E(D.sun4, '11:30', '11:45', 'rest', 'Break'),
  E(D.sun4, '11:45', '12:15', 'work', 'TBAS practice (30 min)', { course: 'AFROTC', prio: 'must' }),
  E(D.sun4, '12:15', '13:15', 'rest', 'Lunch'),
  E(D.sun4, '13:15', '15:15', 'work', 'ESFF 1120 Initiatives 9+10: not written (the skeleton is unchanged since 9:15 AM Sunday), moved to Tuesday 2:10 PM', { course: 'ESFF 1120', prio: 'must', note: 'Due Wed 11-18, so this is 3 days AHEAD. Brief + skeleton READY 11-15 9:20 AM (a day late, my miss): ESFF 1120/ESFF1120_Init9+10_BRIEF_by-section_2026-11-15.pdf and Lamb_Initiatives9and10_SKELETON.docx. Headings follow the rubric: Explain the Initiative, Apply the Initiative, Organizational Impact, Professional Reflection. Tell me when done; final edit, then you submit.' }),
  E(D.sun4, '15:15', '15:25', 'rest', 'Break'),
  E(D.sun4, '15:25', '15:55', 'work', 'Warrior Knowledge (30 min)', { course: 'AFROTC', prio: 'habit' }),
  E(D.sun4, '15:55', '16:05', 'rest', 'Break'),
  E(D.sun4, '16:05', '16:20', 'work', 'To-do list (15 min): message Capt Malone (TBAS date + which Form 48 template); email Kellie Lake for a Form 48 signature', { course: 'AFROTC', prio: 'must', note: 'Status unknown; repeated Monday 10:15 AM (skip it there if it is done). Trey, 11-14: not done Friday (the day was too tight). TBAS: ask for Wed 11-18 after ODC or later; avoid Tue 11-17 (PT 2-mile + CHEM Exam 4 + your final retreat). PFRA post reaction: DONE days ago.' }),
  E(D.sun4, '16:20', '17:10', 'rest', 'Downtime'),
  E(D.sun4, '17:10', '17:45', 'travel', 'Service Dress on, to the BYU Conference Center'),
  E(D.sun4, '18:00', '19:00', 'fixed', 'Veterans Day Devotional (BYU Conference Center 2254)', { course: 'AFROTC', note: 'Service Dress or Sunday dress, 40 honor points (+100 flight bonus at 90%). React to the Wing Bulletins post for the headcount; plus-ones welcome (Mom?).' }),
  E(D.sun4, '19:00', '19:30', 'travel', 'Home'),
  E(D.sun4, '19:30', '20:15', 'rest', 'Dinner'),
  E(D.sun4, '20:15', '21:30', 'work', 'OTS application: both Objectives essays: not written (the file is unchanged since 11-9), moved to Wednesday after CHEM Exam 4', { course: 'AFROTC', prio: 'must', note: 'Moved from Saturday night (cleanup moved to ~8 PM, Trey 11-14). Trey, 11-12: a must now, not an extra. Promised to the recruiter and already late; once TBAS is booked, these are the only thing left before you can submit the OTS application. File: AFROTC/OTS_Application_Objectives.docx. Box 1: your objectives and reasons for wanting a commission. Box 2: the leadership attributes that would make you a good officer. 2,000 characters each (about 300-350 words). Tell me when done: I check the character count and grammar.' }),
  E(D.sun4, '21:35', '22:05', 'extra', 'Extra if you have time: CHEM 1210 Quiz 25: take it early (due Monday 12:30 PM)', { course: 'CHEM 1210' }),
  E(D.sun4, '22:05', '22:50', 'extra', 'Extra if you have time: CHEM 1210 Exam 4: one timed practice set (Ch 1-6 review)', { course: 'CHEM 1210' }),
  // ── Mon 11-16: CHEM Exam 4 is WEDNESDAY (Supplemental Instruction post 11-12), so today is quizzes + the 2-hour review; ESMG A5 tonight ──
  // Mon 11-16, re-planned at 10:35 AM: Trey was not up at 6, and he wants to HYPERFOCUS on CHEM Exam 4 (Trey: "tomorrow").
  // Only hard deadlines due tonight or Tuesday morning stay; everything else moved past the exam.
  E(D.mon5, '10:40', '11:10', 'work', 'CHEM 1210 Quiz 25 (8-4 to 8-5): take it NOW, before you leave (due 12:30 PM)', { course: 'CHEM 1210', prio: 'must', note: 'Due 12:30 PM and the review runs past that, so it has to be done before you go. Chapter 8 is on the exam: write down every miss and bring the list.' }),
  E(D.mon5, '11:10', '11:30', 'travel', 'To UVU (Science Building, room SB 074)'),
  E(D.mon5, '11:30', '13:00', 'class', 'CHEM 1210 Exam 4 review (Supplemental Instruction), SB 074: join late, stay to the end', { course: 'CHEM 1210', note: 'Runs 11 AM to 1 PM. Bring your Quiz 25 misses and a snack: lunch is after class. Ask the leader for the review problems and the answer key.' }),
  E(D.mon5, '13:00', '14:00', 'class', 'CHEM 1210 class: confirm the Exam 4 day, time and room with Dr. Scott', { course: 'CHEM 1210', note: 'The Supplemental Instruction post (11-12) says Wednesday; Dr. Scott said "probably" Tuesday on 11-11 and you are planning for Tuesday. Tell me which.' }),
  E(D.mon5, '14:00', '14:45', 'rest', 'Lunch (on campus)'),
  E(D.mon5, '14:45', '15:05', 'travel', 'Home'),
  E(D.mon5, '15:05', '15:15', 'rest', 'Break'),
  E(D.mon5, '15:15', '16:00', 'work', 'ESMG 3200 Week 6 discussion post: write + post it (due tonight 11:59 PM), then it is off your plate', { course: 'ESMG 3200', prio: 'must', note: 'The only non-chemistry item left today: it closes tonight. Day 1 of 3 for the extra credit. Prompt "Who Owns Safety?": OPEN your post with an open-ended question about how responsibility for responder health and safety is shared (the responder, the supervisor, the safety officer, the administrators). Your cardiovascular topic fits: who owns a firefighter\'s heart health?' }),
  E(D.mon5, '16:00', '16:15', 'rest', 'Break'),
  E(D.mon5, '16:15', '18:15', 'work', 'CHEM 1210 Exam 4 study 1: Quiz 24 (8-1 to 8-3, late), then rework every review problem you missed today', { course: 'CHEM 1210', prio: 'must', note: 'Quiz 24 is still 0/8 with no lock, and Chapter 8 is on the exam, so it is study and points at once. Then the review problems, cold, without looking at the key first.' }),
  E(D.mon5, '18:15', '19:05', 'rest', 'Dinner (lay out PTGs and running shoes first: 2-mile at 6 AM)'),
  E(D.mon5, '19:05', '19:15', 'rest', 'Break'),
  E(D.mon5, '19:15', '20:15', 'work', 'CHEM 1210 Exam 4 study 2: Quiz 22 (7-4 to 7-5, late), then write every miss on one sheet', { course: 'CHEM 1210', prio: 'must', note: 'Exam 4 is WEDNESDAY (Trey, 11-16), so tonight is quizzes and misses; the timed sets are tomorrow. Use /TKB/courses/chem/exam.' }),
  E(D.mon5, '20:15', '20:25', 'rest', 'Break'),
  E(D.mon5, '20:25', '21:10', 'work', 'ODC review 1 (Wednesday 0600 = Lesson 12, Impromptu Briefings, Duty uniform)', { course: 'AFROTC', prio: 'must', note: 'Trey, 11-16: needs a lot of ODC review today and tomorrow. OPLAN-F26: ODC 18 Nov, Lesson 12 Impromptu Briefings, objectives 8.1-8.2 and 9.1-9.2, Duty uniform, BYU Wells Building. The OPORD is not posted yet. Tell me what the review covers so the next block is aimed right.' }),
  E(D.mon5, '21:10', '21:55', 'rest', 'Downtime, then bed (2-mile at 6 AM)'),
  E(D.mon5, '21:55', '22:05', 'extra', 'Extra if you have time: CHEM 1210: one read-through of the reference sheet', { course: 'CHEM 1210' }),
  E(D.mon5, '22:05', '22:15', 'extra', 'Extra if you have time: Warrior Knowledge (10 min)', { course: 'AFROTC' }),

  // Tue 11-17: CHEM Exam 4 is WEDNESDAY (Trey, 11-16), so today is the full study day plus ODC review.
  E(D.tue5, '05:30', '05:45', 'rest', 'Change into PTGs'),
  E(D.tue5, '06:00', '07:00', 'fixed', 'AFROTC PT (AERO 1430R): 2 minutes of push-ups + 2-mile run (your checkpoint) + 20-minute superset', { course: 'AFROTC', note: 'Group 2, Weight Room (Trey, 11-11). Run the 2-mile as a PFRA rehearsal; the plan is in runningworkouts/training.md. Send me the time (and lap splits if you have them): every training pace gets re-derived from it. Superset: front-rack dumbbell march + pike push-ups (your pick).' }),
  E(D.tue5, '07:00', '07:45', 'rest', 'Home, shower and change'),
  E(D.tue5, '07:45', '08:15', 'rest', 'Breakfast'),
  E(D.tue5, '08:25', '10:25', 'work', 'CHEM 1210 Exam 4 study 3: Quiz 25 (8-4 to 8-5, late, still open), then the review problems with their answer key, then a timed mixed Chapter 1-8 set', { course: 'CHEM 1210', prio: 'must', note: 'Canvas 11-17 4:32 AM: Quiz 25 was not taken Monday (0/8, no lock), and Chapter 8 is on the exam. The study session leader posted the Exam 4 review problems + answer key on Canvas (announcement 11-16, "Supplemental Exam 4 Review Questions"): work them, then check. Timed set at about 2 minutes a question; add every miss to the sheet.' }),
  E(D.tue5, '10:25', '10:40', 'rest', 'Break'),
  E(D.tue5, '10:40', '11:40', 'work', 'ODC review 2 (Impromptu Briefings, Wednesday 0600): read the ODC 11 PDF, then practice briefs out loud', { course: 'AFROTC', prio: 'must', note: 'The OPORD is out: AFROTC/ODC11_Impromptu_Briefings_2026-11-18.pdf (page 1 is my half-page brief, the 25-topic list is on OPORD page 4, the Briefing Evaluation Guide is pages 6-13). Practice: pick a topic from the list, 1 minute to think, a 2-minute brief out loud (bottom line first, 2-3 main points, close).' }),
  E(D.tue5, '11:40', '12:25', 'rest', 'Lunch'),
  E(D.tue5, '12:25', '12:40', 'rest', 'Pack: calculator, the miss sheet, and the retreat uniform (you go straight to the Det from campus)'),
  E(D.tue5, '12:40', '13:00', 'travel', 'To UVU'),
  E(D.tue5, '13:00', '14:00', 'class', 'CHEM 1210 class (last class before Exam 4)', { course: 'CHEM 1210' }),
  E(D.tue5, '14:00', '14:15', 'rest', 'Break'),
  E(D.tue5, '14:15', '15:00', 'work', 'CHEM 1210 Exam 4 study 4: rework the miss sheet cold, on campus', { course: 'CHEM 1210', prio: 'must' }),
  E(D.tue5, '15:00', '16:00', 'class', 'CHEM 1210 last Supplemental Instruction session before Exam 4, SB 138 (leave by 4:10 for the retreat)', { course: 'CHEM 1210', note: 'Per the SI announcement (11-12): Tuesday 3 PM, SB 138. End time not stated: if it runs past 4:10, leave anyway; the retreat is not optional.' }),
  E(D.tue5, '16:10', '16:45', 'travel', 'UVU to the Det (BYU)'),
  E(D.tue5, '16:45', '17:00', 'rest', 'Change into uniform at the Det'),
  E(D.tue5, '17:00', '17:45', 'fixed', 'Retreat (your FINAL one): be there AT 1700 for the 1730 retreat', { course: 'AFROTC', note: 'Trey, 11-13: arrive 1700 so you are not late for 1730. The uniform is not on file: check the Teams retreat post.' }),
  E(D.tue5, '17:45', '18:30', 'travel', 'Home'),
  E(D.tue5, '18:30', '19:15', 'rest', 'Dinner'),
  E(D.tue5, '19:15', '19:30', 'rest', 'Break'),
  E(D.tue5, '19:30', '20:15', 'work', 'ODC review 3 (two more practice briefs) + lay out the Duty uniform, backpack and laptop for 0600', { course: 'AFROTC', prio: 'must', note: 'OPORD: Wed 18 Nov, Wells ROTC Building, Duty uniform or civilian equivalent; form up in the lot behind the building WITH backpacks; Yankee Flight goes to the Cadet Lounge; bring a laptop. Yankee roles are done (posted 11-16).' }),
  E(D.tue5, '20:15', '20:25', 'rest', 'Break'),
  E(D.tue5, '20:25', '20:55', 'work', 'TBAS practice (30 min)', { course: 'AFROTC', prio: 'must', note: 'Trey, 11-16: needs more practice.' }),
  E(D.tue5, '20:55', '21:40', 'rest', 'Downtime, then bed (ODC at 0600)'),
  E(D.tue5, '21:40', '21:55', 'extra', 'Extra if you have time: CHEM 1210: reference sheet, formulas and units (the full final pass is Wednesday morning after ODC)', { course: 'CHEM 1210' }),
  E(D.tue5, '21:55', '22:10', 'extra', 'Extra if you have time: Warrior Knowledge (15 min)', { course: 'AFROTC' }),
  E(D.tue5, '22:10', '22:40', 'extra', 'Extra if you have time: ESMG 3200 Week 6 discussion post (late)', { course: 'ESMG 3200', note: 'Canvas 11-17: not posted (0/20, -10% a week late). Posting tonight keeps the 3-different-days extra credit alive (post Tue, reply Wed, reply Thu). If not, it is first thing after the exam Wednesday.' }),
  ALL('2026-11-18', 'work', 'CHEM 1210 Exam 4 final pass after ODC: reference sheet, formulas and units, then the three hardest misses. Nothing new. (Exam in class, 1 PM assumed)', { course: 'CHEM 1210', prio: 'must' }),
  ALL('2026-11-18', 'work', 'ESFF 1120 Initiatives 9+10: write it in the skeleton, one sitting, after CHEM Exam 4 (due 11:59 PM tonight; moved from Tuesday for the exam)', { course: 'ESFF 1120', prio: 'must', note: 'One attempt. Files in ESFF 1120/: Lamb_Initiatives9and10_SKELETON.docx + ESFF1120_Init9+10_BRIEF_by-section_2026-11-15.pdf. Tell me when done; I do the final edit, you submit tonight.' }),
  ALL('2026-11-18', 'work', 'OTS application: write BOTH Objectives essays, one sitting, after CHEM Exam 4 (time set when Wednesday is planned)', { course: 'AFROTC', prio: 'must', note: 'Not written Sunday. Promised to the recruiter and late; with TBAS booked, these are the last thing before you can submit the OTS application.' }),
  ALL('2026-11-18', 'work', 'ESMG 3200 Assignment 5 (late): write it in the skeleton, one sitting (moved from Monday night for the exam)', { course: 'ESMG 3200', prio: 'must', note: 'Late tier stays -10% through Thu 11-19; after Thursday it is -20%. Files in ESMG 3200/: A5 Case Analysis HAZMAT SKELETON.docx + ESMG3200_A5_HAZMAT_BRIEF_by-section_2026-11-11. I do the final edit, you submit.' }),
  ALL('2026-11-18', 'work', 'MICR 2065 Pre-Lab #9 (late, 10 points), if not done Tuesday night', { course: 'MICR 2065', prio: 'must' }),
  ALL('2026-11-18', 'work', 'MICR 2060 OLQ 13 (MMAHP Ch 13; due 11:59 PM tonight): read the chapter worksheet, then take it', { course: 'MICR 2060', prio: 'must', note: 'Had no block in the plan (morning check 11-17). Locks 12-12, but the due date is tonight.' }),
  ALL('2026-11-18', 'work', 'To-do: email Kellie Lake the filled Form 48 to sign (AFROTC/Lamb, Trey_Form 48_FS26.pdf), then upload it to AEROS 100R on Learning Suite', { course: 'AFROTC', prio: 'must', note: 'Form 48 is 39.6% of the AEROS 100R (Leadership Lab) grade, was due Oct 23 and is unsubmitted; Submit is still open. She signs Block 4 (signature + date) and the Fall 2026 Term Reevaluation line.' }),
  ALL('2026-11-18', 'work', 'ESMG 3200 Week 6 discussion post (late, -10%), if not posted Tuesday night', { course: 'ESMG 3200', prio: 'must', note: 'Missed Monday 11:59 PM (Canvas 11-17). Prompt "Who Owns Safety?": open with an open-ended question about how responsibility for responder safety is shared.' }),
  ALL('2026-11-18', 'work', 'ESMG 3200 Week 6 discussion reply #1 (moved from Tuesday for the exam)', { course: 'ESMG 3200', prio: 'must', note: 'Day 2 of 3 for the extra credit.' }),
  ALL('2026-11-19', 'work', 'After AEROS 110 class: ask Lt Col Smith in person to reopen the midterm (his first email said no)', { course: 'AFROTC', prio: 'must', note: 'Short and respectful: own the miss, ask once, offer to take it any time this week. If he says yes, get the close time and tell me.' }),
  ALL('2026-11-19', 'work', 'ESMG 3200 Week 6 discussion reply #2', { course: 'ESMG 3200', prio: 'must', note: 'Day 3 of 3; earns the extra credit.' }),
  // ── Fri 11-13 to Sun 11-15: easy minimum + extras (Trey, 11-10). Mom is visiting from Wed evening (length unknown: ask).
  E('2026-11-13', '23:59', null, 'due', 'DONE: AEROS 210 DB9 (posted Thursday)'),
  E('2026-11-20', '23:59', null, 'due', 'DUE: AEROS 210 DB10 (Learning Suite; opens Sat 11-14) · MICR 2065 Lab Notebook #11 (Unknown Part 2), 11:59 PM'),
  E('2026-11-21', '23:59', null, 'due', 'DUE: MICR 2060 OLQ 14 (MMAHP Ch 14), 11:59 PM'),
  // AEROS (BYU Learning Suite) graded items, with their weight, so none is a surprise (Trey, 11-18: "you act like its no big deal").
  E('2026-12-02', '16:00', null, 'due', 'DUE: AEROS 210 Official Memorandum (1 page max), 4:00 PM: 24.75% of the AEROS 210 grade'),
  E('2026-12-03', '10:59', null, 'due', 'DUE: AEROS 110 Official Memorandum (final AFSC memo), 10:59 AM: 8.33% of the AEROS 110 grade'),
  E('2026-12-04', '23:59', null, 'due', 'DUE: AEROS 143R PT absence memorandums, 11:59 PM. PT attendance is 21 of 28 (75%); the syllabus needs 80% to PASS'),
  E('2026-12-12', '18:00', null, 'due', 'DUE: AEROS 210 Final Exam, 6:00 PM: 24.75% of the AEROS 210 grade'),
  E('2026-12-15', '23:59', null, 'due', 'DUE: AEROS 110 Final Exam, 11:59 PM: 35% of the AEROS 110 grade'),
  E('2026-11-14', '16:00', null, 'due', 'DUE: honor points, 4 PM (Warrior Knowledge Week 9 quiz DONE)'),
  E('2026-11-16', '23:59', null, 'due', 'MISSED: ESMG 3200 Week 6 discussion post, 11:59 PM (not posted; late, -10% a week)'),
  E('2026-11-18', '23:59', null, 'due', 'DUE: ESFF 1120 Initiatives 9+10 · MICR 2060 OLQ 13, 11:59 PM'),
  E('2026-11-19', '12:30', null, 'due', 'DUE: CHEM 1210 Quiz 26 (9-1 to 9-3), 12:30 PM'),
  E('2026-11-19', '16:00', null, 'due', 'DUE: MICR 2065 Lab Notebook #10 (4 PM) · ESMG 3200 Assignment 6 (11:59 PM)'),
  E('2026-11-12', '23:59', null, 'due', 'DUE: ESMG 3200 Assignment 4 (late), last day at -10%, 11:59 PM (planned Wednesday)'),
  E('2026-11-11', '23:59', null, 'due', 'DONE: ESFF 1120 Initiatives 7+8 (submitted Tue 9:43 PM)'),
  E('2026-11-12', '09:00', null, 'due', 'DUE: AEROS 210 Yes-Men group presentation, 9 AM in class (followership: the yes-man follower type)'),
  E('2026-11-12', '16:00', null, 'due', 'DUE: MICR 2065 Pre-Lab #9 + Module 9 Case Study (4 PM) · ESMG 3200 Assignment 5 + Week 5 replies (11:59 PM)'),
  E('2026-11-13', '23:59', null, 'due', 'DONE: MICR 2065 Lab Notebook #9 + Post-Lab #9 · ESMG 3200 Assignment 5 not submitted (late, moved to Monday)'),
  E('2026-11-14', '23:59', null, 'due', 'DONE: MICR 2060 Exam 3 (93.39/150)'),
  E('2026-11-07', '16:00', null, 'due', 'DUE: Warrior Knowledge quiz (4 PM) · Honor Points (EOD) · MICR 2060 OLQ 12 retake (11:59 PM)'),
  // CHEM quizzes under 90% (Trey, 11-3: take/retake every one, ~30 min each) were planned Sat 9-12 + Sun 9-10.
  // 11-4 writing marathon: Quiz 9, 11, 14 stay (Sat 4:15); retakes of Quiz 10, 12, 20, 1 and 4 move to next week.
  E('2026-11-09', '14:30', null, 'due', 'DUE: CHEM 1210 Quiz 22 (7-4, 7-5), 2:30 PM'),
  E('2026-11-11', '12:30', null, 'due', 'DUE: CHEM 1210 Quiz 23 (7-6), 12:30 PM'),
  E('2026-11-12', '14:30', null, 'due', 'DUE: CHEM 1210 Quiz 24 (8-1 to 8-3), 2:30 PM'),
  E('2026-11-16', '12:30', null, 'due', 'MISSED: CHEM 1210 Quiz 25 (8-4 to 8-5), 12:30 PM (still open late: Tuesday 8:25 AM)'),
];

// Dates that matter beyond the day-by-day blocks: exams, ROTC events, windows. Drawn on the MFT calendar
// as all-day ★ chips (planOverlayByDate) and included in the phone feed (scripts/exportSchedule.mjs). `tbc` marks a date that is a best estimate.
export const IMPORTANT_DATES = [
  { date: '2026-11-05', title: 'Presidential Review (practice 0600, review 1000)', course: 'AFROTC' },
  { date: '2026-11-06', title: 'Holy War run (your leg 0845-0935)', course: 'AFROTC', tbc: true },
  { date: '2026-11-08', end: '2026-11-14', title: 'MICR 2060 Exam 3 window', course: 'MICR 2060' },
  { date: '2026-11-11', title: 'ODC: Morale PT (PTG uniform)', course: 'AFROTC' },
  { date: '2026-11-17', title: 'Retreat, 1730', course: 'AFROTC' },
  { date: '2026-11-23', title: 'Final PFRA sign-up closes 0800: react to the cadre post (decided 11-11: taking it)', course: 'AFROTC' },
  { date: '2026-12-02', title: 'ODC 0600: Squadron GLP/Wargame (uniform per OPORD), BYU Wells Building', course: 'AFROTC' },
  { date: '2026-12-03', title: 'LLAB 1100: Change of Command and Awards Ceremony, Service Dress, Crabtree Building room 214', course: 'AFROTC' },
  { date: '2026-11-24', title: 'TBAS test, 12:30 PM (place and length to confirm; overlaps CHEM 1210 class at 1 PM)', course: 'AFROTC' },
  { date: '2026-11-19', title: 'ORI I (Service Dress)', course: 'AFROTC' },
  { date: '2026-11-18', title: 'CHEM 1210 Exam 4 (Ch 1-8), in class (1 PM assumed); confirmed Wednesday by Trey 11-16', course: 'CHEM 1210' },
  { date: '2026-11-18', title: 'ODC Lesson 12: Impromptu Briefings, 0600, Wells ROTC Building, Duty uniform; form up behind the building with backpacks, bring a laptop', course: 'AFROTC' },
  { date: '2026-11-16', title: 'CHEM 1210 Exam 4 review, 11 AM-1 PM, SB 074', course: 'CHEM 1210' },
  { date: '2026-11-23', title: 'PSP/Rated Board PFRA: sign-up deadline 0800. TAKING IT; reacted to the cadre post (DONE, Trey 11-14)', course: 'AFROTC' },
  { date: '2026-12-01', title: 'PSP/Rated Board PFRA day 1: height, weight, waist (Smith Fieldhouse, PT time). Trey is taking it', course: 'AFROTC' },
  { date: '2026-12-03', title: 'Change of Command', course: 'AFROTC' },
  { date: '2026-12-03', title: 'PSP/Rated Board PFRA day 2: push-ups, sit-ups, 2-mile run (Smith Fieldhouse, PT time). Trey is taking it', course: 'AFROTC' },
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
