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
  wed: '2026-10-28', thu: '2026-10-29', fri2: '2026-10-30', sat2: '2026-10-31', sun2: '2026-11-01', mon2: '2026-11-02',
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

  // ── Sun 11-1: Exam 3 practice exam; get ahead on ESMG W4, ESFF 5+6, MICR Ch 11, ESMG A4 ──
  E(D.sun2, '09:00', '12:00', 'work', 'CHEM 1210 Exam 3 prep: mixed Ch 1-6 timed practice exam', { course: 'CHEM 1210', prio: 'must', note: '~2 min/question. Mark misses for Monday. Saturday’s Ch 3-4 review moved here: weight Ch 3-4 heavier.' }),
  E(D.sun2, '12:00', '13:00', 'work', 'CHEM 1210: rework the practice-exam misses, Ch 3-4 first', { course: 'CHEM 1210', prio: 'must', note: 'Quiz 8, 9 make-ups and the Quiz 14 retake move to after the exam (late quizzes accepted).' }),
  E(D.sun2, '13:00', '13:45', 'rest', 'Lunch'),
  E(D.sun2, '13:45', '14:45', 'work', 'ESMG 3200 Week 4 discussion: initial post', { course: 'ESMG 3200', prio: 'must', note: 'Real due date Mon 11/2 11:59 PM; Monday is exam day. Not known whether Fisher counts a Sunday post as a day for the 3-day extra credit.' }),
  E(D.sun2, '15:00', '16:00', 'work', 'ESFF 1120 Init 5+6 combined paper: sources + skeleton (day 1 of 3)', { course: 'ESFF 1120', prio: 'must', note: 'Real due date Wed 11/4 11:59 PM, 100 pts, 500-700 words, one academic source per initiative.' }),
  E(D.sun2, '16:00', '16:20', 'work', 'Air Force Song + Airman\u2019s Creed', { course: 'AFROTC', prio: 'habit' }),
  E(D.sun2, '16:30', '17:30', 'work', 'MICR 2060 reading: MMAHP Ch 11 (OLQ 11, due Wed 11/4)', { course: 'MICR 2060', prio: 'must', note: 'Hour 1 of your 2 hr/week MICR reading.' }),
  E(D.sun2, '17:30', '18:30', 'work', 'ESMG 3200 Assignment 4: read the prompt + sources + skeleton (day 1)', { course: 'ESMG 3200', prio: 'must', note: 'Real due date Thu 11/5 11:59 PM, 50 pts (Program Proposal).' }),

  // ── Mon 11-2: CHEM Exam 3 at 1 PM ──
  E(D.mon2, '08:30', '11:30', 'work', 'CHEM 1210 Exam 3 final prep: Sunday\u2019s misses + heat math', { course: 'CHEM 1210', prio: 'must' }),
  E(D.mon2, '11:30', '12:30', 'rest', 'Lunch + get to class'),
  E(D.mon2, '13:00', '14:00', 'fixed', 'CHEM 1210 EXAM 3 (cumulative Ch 1-6)', { course: 'CHEM 1210', prio: 'deadline' }),
  E(D.mon2, '15:00', '15:20', 'work', 'ESMG 3200 Week 4 reply #1', { course: 'ESMG 3200', prio: 'must', note: '2 replies are REQUIRED (6 of 20 pts); real due date Thu 11/5.' }),
  E(D.mon2, '15:30', '17:30', 'work', 'ESFF 1120 Init 5+6: bulk draft (day 2 of 3)', { course: 'ESFF 1120', prio: 'must', note: 'Real due date Wed 11/4.' }),
  E(D.mon2, '19:00', '19:30', 'work', 'CHEM 1210 Quiz 21 prep (Sec 7-1 to 7-3)', { course: 'CHEM 1210', prio: 'must', note: 'Quiz 21 is due Tue 11/3 12:30 PM; take it Tue 8:00 AM after PT.' }),
  E(D.mon2, '19:30', '19:50', 'work', 'Air Force Song + Airman\u2019s Creed', { course: 'AFROTC', prio: 'habit' }),
  E(D.mon2, '23:59', null, 'due', 'DUE: ESMG 3200 Week 4 initial post (posted Sunday)'),
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
