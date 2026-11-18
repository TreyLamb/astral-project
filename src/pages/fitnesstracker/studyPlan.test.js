import { describe, it, expect } from 'vitest';
import { PLAN, IMPORTANT_DATES, workHoursByDay, planOverlayByDate, clock, minutesOf } from './studyPlan.js';
import { COURSEWORK_EXTRA } from '../theknowledgebase/courses/data/manualCoursework.js';

describe('study plan', () => {
  // Trey, 2026-11-18: "I keep missing deadlines because i rely on you to remind me of things and you act like its no big
  // deal." Every open item the agent tracks by hand (Learning Suite has no feed) must show up in the plan on its due date.
  it('puts every open hand-tracked deadline (Learning Suite, Det, exams) in the plan on its date', () => {
    const FROM = '2026-11-18';
    const onDay = (d) => [...PLAN.filter((e) => e.date === d), ...IMPORTANT_DATES.filter((e) => e.date === d)].map((e) => `${e.course || ''} ${e.title}`).join(' | ');
    for (const it of COURSEWORK_EXTRA.filter((x) => x.status === 'todo' && x.due >= FROM)) {
      const course = it.course.split(' ')[0];
      expect({ id: it.id, due: it.due, inPlan: onDay(it.due).includes(course) }).toEqual({ id: it.id, due: it.due, inPlan: true });
    }
  });

  it('every timed entry has a valid, ordered time range on a real day', () => {
    for (const e of PLAN) {
      expect(e.date).toMatch(/^2026-1[012]-\d\d$/);
      if (e.start) {
        expect(e.start).toMatch(/^\d\d:\d\d$/);
        if (e.end) expect(minutesOf(e)).toBeGreaterThan(0);
      }
    }
  });

  it('no two work blocks overlap on the same day, and none overlaps a fixed event or class', () => {
    const byDay = {};
    for (const e of PLAN) if (e.start && e.end) (byDay[e.date] ||= []).push(e);
    for (const [day, list] of Object.entries(byDay)) {
      list.sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1];
        const b = list[i];
        const clash = b.start < a.end;
        expect({ day, a: a.title, b: b.title, clash }).toEqual({ day, a: a.title, b: b.title, clash: false });
      }
    }
  });

  it('keeps every day at or under 9 hours, and only the push weeks run past 7.5', () => {
    // 2026-10-25: Trey lifted his 5 hr cap for the catch-up week. 2026-10-27: "I will put in extra time this week".
    // 2026-11-02: Presidential Review week. Thursday morning is all ROTC, so everything due Thu is done Tue/Wed,
    // and CHEM now gets 3 hr every day (his standing rule), which alone pushes a normal day past 7.5.
    const hours = workHoursByDay();
    for (const [day, h] of Object.entries(hours)) expect({ day, ok: h <= 9 }).toEqual({ day, ok: true });
    const over75 = Object.entries(hours).filter(([, h]) => h > 7.5).map(([d]) => d);
    // 2026-11-04: Trey asked for a weekend writing marathon (Sat 11-7, Sun 11-8).
    // 2026-11-05: ESMG Assignment 4 slipped to Friday 11-6 ("gonna have to do it tomorrow"), on top of two MICR 2065 items due that night.
    const push = (d) => (d >= '2026-10-26' && d <= '2026-11-04') || d === '2026-11-06' || d === '2026-11-07';
    for (const d of over75) expect({ d, inPushWeek: push(d) }).toEqual({ d, inPushWeek: true });
  });

  it('puts the Air Force Song / Airman’s Creed slot on every weekday-evening plan day it was promised', () => {
    // 2026-10-28: the Song/Creed slot became the daily 30-min Warrior Knowledge block (it covers Song/Creed).
    const days = new Set(PLAN.filter((e) => /Song|Warrior Knowledge/.test(e.title)).map((e) => e.date));
    // Wed 10-28 / Thu 10-29 have none on purpose: Trey, 10-28, Warrior Knowledge waits until Friday night this week.
    for (const d of ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-30']) expect(days.has(d)).toBe(true);
  });

  it('schedules three ODC prep blocks (Sun, Mon, plus a Tuesday refresher: Trey asked for 3 x 30 min) before the ORI on Wed 10/28 6 AM', () => {
    const odc = PLAN.filter((e) => /^ODC prep/.test(e.title));
    expect(odc).toHaveLength(3);
    for (const e of odc) expect(`${e.date}T${e.start}` < '2026-10-28T06:00').toBe(true);
  });

  it('plans ESMG discussion work on 3+ separate days of EVERY discussion week (Sun-Thu), for the extra credit', () => {
    // Every Monday in the plan whose Thursday is also planned, not one hard-coded week: this test used to check
    // only Week 3, so Week 4 shipped with no reply after Monday and the extra credit was nearly missed (Trey, 11-4).
    const dates = [...new Set(PLAN.map((e) => e.date))].sort();
    const shift = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
    const mondays = dates.filter((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 1 && dates.includes(shift(d, 3)));
    expect(mondays.length).toBeGreaterThan(0);
    for (const mon of mondays) {
      const week = [-1, 0, 1, 2, 3].map((n) => shift(mon, n));
      const days = new Set(PLAN.filter((e) => week.includes(e.date) && /ESMG 3200 (W|Week )\d+ (discussion|reply)/.test(e.title)).map((e) => e.date));
      expect({ mon, days: days.size >= 3 }).toEqual({ mon, days: true });
    }
  });

  it('puts the standing 1500 flight meeting on EVERY planned Friday (Trey, 11-13: "this should have been documented MONTHS AGO")', () => {
    // It was planned week by week (10-30, 11-6) and never as a standing block, so Friday 11-13 shipped without it.
    const fridays = [...new Set(PLAN.filter((e) => e.start && e.end && e.date >= '2026-11-13').map((e) => e.date))]
      .filter((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 5);
    expect(fridays.length).toBeGreaterThan(0);
    for (const d of fridays) {
      // Trey, 11-13: remind him to have the Charlie Flight workout homework up to date before every meeting.
      const ok = PLAN.some((e) => e.date === d && e.start === '15:00' && e.kind === 'fixed' && /flight meeting/i.test(e.title) && /workout homework/i.test(e.title));
      expect({ d, ok }).toEqual({ d, ok: true });
    }
  });

  it('plans MICR 2065 Pre-Lab + Case Study at 90 minutes or more (Trey, 11-5: "about an hr and a half, as per usual")', () => {
    // The 90 minutes is for the PAIR. A Pre-Lab on its own is 30 minutes (Trey, 11-13: "Alott 30 minutes for that").
    for (const e of PLAN) {
      if (e.date < '2026-11-05' || !e.end || !/MICR 2065 Pre-Lab/.test(e.title) || !/Case Study/.test(e.title)) continue;
      expect({ title: e.title, min: minutesOf(e) >= 90 }).toEqual({ title: e.title, min: true });
    }
  });

  it('gives every run or workout time to change before it and after it (Trey, 11-5)', () => {
    const byDay = {};
    for (const e of PLAN) if (e.start && e.end && e.date >= '2026-11-05') (byDay[e.date] ||= []).push(e);
    const isWorkout = (e) => /\brun\b|workout|\bPT\b/i.test(e.title) && e.kind !== 'travel' && !/Holy War|Get to|Change|homework/i.test(e.title);
    const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
    const isChange = (e) => e.kind === 'rest' && /change|shower/i.test(e.title);
    for (const list of Object.values(byDay)) {
      list.sort((a, b) => a.start.localeCompare(b.start));
      list.forEach((w, i) => {
        if (!isWorkout(w)) return;
        const prev = list[i - 1];
        const next = list[i + 1];
        const before = !prev || isChange(prev) || mins(w.start) - mins(prev.end) >= 15;
        const after = !next || isChange(next) || mins(next.start) - mins(w.end) >= 30;
        expect({ date: w.date, title: w.title, before, after }).toEqual({ date: w.date, title: w.title, before: true, after: true });
      });
    }
  });

  it('plans 30+ minutes of TBAS practice on most planned days until the test (Trey, 11-6; realistic version 11-11)', () => {
    // Trey asked for TBAS every day (11-6). On 11-11 the realism rules showed Wed/Thu cannot hold it without cutting meals or
    // sleep, so the must-do is 30 min on at least 4 of every 7 planned days, and it is an extra on the others.
    const TBAS_TEST = '2026-11-24'; // Trey, 11-18: TBAS is scheduled Tue 11-24 at 12:30
    // The day before an exam is chemistry plus hard deadlines only, and it drops out of the count. Each needs a written reason.
    const EXAM_EVE = { '2026-11-16': 'Trey, 11-16: "I want to hyperfocus on my chem test tomorrow. Anything without a hard deadline tonight or tomorrow morning needs pushed"' };
    const days = [...new Set(PLAN.filter((e) => e.start && e.end && e.kind === 'work').map((e) => e.date))]
      .filter((d) => d >= '2026-11-06' && (!TBAS_TEST || d < TBAS_TEST) && !EXAM_EVE[d]).sort();
    const has = (d) => PLAN.filter((e) => e.date === d && e.end && e.kind === 'work' && /^TBAS practice/.test(e.title)).reduce((s, e) => s + minutesOf(e), 0) >= 30;
    for (let i = 0; i + 7 <= days.length; i++) {
      const hits = days.slice(i, i + 7).filter(has).length;
      expect({ from: days[i], ok: hits >= 4 }).toEqual({ from: days[i], ok: true });
    }
  });

  it('ends every planned day from 11-10 with 2-3 "extra if you have time" blocks (Trey, 11-10)', () => {
    // A day whose must-do list runs to midnight has no room for extras; it needs a written reason here.
    const NO_EXTRAS = { '2026-11-12': 'Trey, 11-11: Post-Lab #9 + ESMG A5 + ESMG A4 all Thursday night, past midnight' };
    const days = [...new Set(PLAN.filter((e) => e.start && e.end && e.kind === 'work' && e.date >= '2026-11-10').map((e) => e.date))].filter((d) => !NO_EXTRAS[d]);
    for (const d of days) {
      const timed = PLAN.filter((e) => e.date === d && e.start && e.end);
      const extras = timed.filter((e) => e.kind === 'extra');
      // Extras come after the day's must-do list; meals and downtime may follow them.
      const lastEnd = timed.filter((e) => e.kind !== 'extra' && e.kind !== 'rest').reduce((m, e) => (e.end > m ? e.end : m), '00:00');
      const titled = extras.every((e) => /^Extra if you have time: /.test(e.title));
      const atEnd = extras.every((e) => e.start >= lastEnd);
      expect({ d, count: extras.length >= 2 && extras.length <= 3, titled, atEnd }).toEqual({ d, count: true, titled: true, atEnd: true });
    }
  });

  // Trey, 2026-11-11: "you are scheduling things within minutes of each other like I can simply go from one task to the next
  // seamlessly, like i'm in a vacuum ... Like I shove food into my face in 15 minutes ... I've said in the past i'm down to lock
  // in. but it has to be realistic." The 7.5 h cap above counts homework only; these count the whole day.
  describe('is realistic from 11-12 on (Trey, 11-11)', () => {
    const FROM = '2026-11-12';
    const timedOn = (d) => PLAN.filter((e) => e.date === d && e.start && e.end).sort((a, b) => a.start.localeCompare(b.start));
    const days = [...new Set(PLAN.filter((e) => e.start && e.end && e.kind === 'work' && e.date >= FROM).map((e) => e.date))];
    const mins = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
    // A day over 11 committed hours needs a written reason here.
    const LONG_DAYS = { '2026-11-12': 'PT, two AERO classes, LLAB, CHEM and lab are 8+ hours that cannot move, ESMG A5 is due that night, and (Trey, 11-11 ~9:30 PM, his call) the Case Study, Pre-Lab, Post-Lab and ESMG A4 all land here; he stays up, nothing early Friday: about 15 hours' };

    it('keeps committed time (work + class + ROTC + travel) at or under 11 hours a day', () => {
      for (const d of days) {
        const h = timedOn(d).filter((e) => ['work', 'class', 'fixed', 'travel'].includes(e.kind)).reduce((s, e) => s + minutesOf(e), 0) / 60;
        expect({ d, ok: h <= (LONG_DAYS[d] ? 15.5 : 11) }).toEqual({ d, ok: true });
      }
    });

    it('gives lunch and dinner 45+ minutes and breakfast 15+', () => {
      for (const e of PLAN) {
        if (e.date < FROM || e.kind !== 'rest' || !e.end) continue;
        const need = /lunch|dinner/i.test(e.title) ? 45 : /breakfast/i.test(e.title) ? 15 : 0;
        expect({ d: e.date, t: e.title, ok: minutesOf(e) >= need }).toEqual({ d: e.date, t: e.title, ok: true });
      }
    });

    it('puts a break or a transition before every work block (no back-to-back after class, ROTC or other work)', () => {
      for (const d of days) {
        const list = timedOn(d).filter((e) => e.kind !== 'extra');
        list.forEach((w, i) => {
          if (w.kind !== 'work' || i === 0) return;
          const prev = list[i - 1];
          const ok = prev.kind === 'rest' || prev.kind === 'travel' || mins(w.start) - mins(prev.end) >= 10
            || /SUBMIT|Submit/.test(w.title) || /TBAS|Warrior Knowledge/.test(w.title) && /TBAS|Warrior Knowledge/.test(prev.title);
          expect({ d, after: prev.title, block: w.title, ok }).toEqual({ d, after: prev.title, block: w.title, ok: true });
        });
      }
    });

    it('keeps every work block to about 2 hours (an exam may run its full length)', () => {
      for (const e of PLAN) {
        if (e.date < FROM || e.kind !== 'work' || !e.end || /Exam \d: take it/.test(e.title)) continue;
        expect({ t: e.title, ok: minutesOf(e) <= 125 }).toEqual({ t: e.title, ok: true });
      }
    });

    // A day short on downtime needs a written reason here.
    const SHORT_DOWNTIME = { '2026-11-12': 'the MICR 2065 Case Study + Pre-Lab slipped from 11-11 into the overflow slot held open for it' };
    it('gives every day 45+ minutes of downtime', () => {
      for (const d of days) {
        const m = timedOn(d).filter((e) => e.kind === 'rest' && /downtime/i.test(e.title)).reduce((s, e) => s + minutesOf(e), 0);
        expect({ d, ok: m >= (SHORT_DOWNTIME[d] ? 20 : 45) }).toEqual({ d, ok: true });
      }
    });

    it('ends the must-do list by 9:30 PM the night before a 6 AM PT or ODC', () => {
      const shift = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
      for (const d of days) {
        const early = PLAN.some((e) => e.date === shift(d, 1) && e.kind === 'fixed' && e.start && e.start <= '06:00');
        if (!early) continue;
        const last = timedOn(d).filter((e) => ['work', 'class', 'fixed', 'travel'].includes(e.kind)).reduce((m, e) => (e.end > m ? e.end : m), '00:00');
        expect({ d, last, ok: last <= '21:30' }).toEqual({ d, last, ok: true });
      }
    });
  });

  it('plans about 2 hours of MICR 2060 reading in its own blocks', () => {
    const mins = PLAN.filter((e) => /^MICR 2060 reading/.test(e.title)).reduce((s, e) => s + minutesOf(e), 0);
    expect(mins).toBeGreaterThanOrEqual(120);
  });

  it('keeps the chem real-study blocks separate from the quiz blocks', () => {
    expect(PLAN.some((e) => /CHEM 1210 (real study|Exam 3 prep)/.test(e.title))).toBe(true);
    expect(PLAN.some((e) => /CHEM 1210 Quiz \d+ take/.test(e.title))).toBe(true);
  });

  it('overlay events use the calendar chip shape', () => {
    const map = planOverlayByDate();
    const fri = map['2026-10-23'];
    expect(fri[0]).toMatchObject({ calId: 'plan', allDay: false, time: '6:00 AM' });
    expect(fri.map((x) => x.sortKey)).toEqual([...fri.map((x) => x.sortKey)].sort());
    expect(map['2026-10-24'][0].allDay).toBe(true);
    expect(clock('13:05')).toBe('1:05 PM');
    expect(clock('00:30')).toBe('12:30 AM');
  });
});
