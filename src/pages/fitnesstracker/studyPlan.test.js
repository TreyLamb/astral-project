import { describe, it, expect } from 'vitest';
import { PLAN, workHoursByDay, planOverlayByDate, clock, minutesOf } from './studyPlan.js';

describe('study plan', () => {
  it('every timed entry has a valid, ordered time range on a real day', () => {
    for (const e of PLAN) {
      expect(e.date).toMatch(/^2026-1[01]-\d\d$/);
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

  it('plans MICR 2065 Pre-Lab + Case Study at 90 minutes or more (Trey, 11-5: "about an hr and a half, as per usual")', () => {
    for (const e of PLAN) {
      if (e.date < '2026-11-05' || !e.end || !/MICR 2065 Pre-Lab/.test(e.title)) continue;
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

  it('plans 30+ minutes of TBAS practice every planned day until the test (Trey, 11-6)', () => {
    const TBAS_TEST = null; // set to the test date once Capt Malone schedules it
    const days = [...new Set(PLAN.filter((e) => e.start && e.end && e.kind === 'work').map((e) => e.date))]
      .filter((d) => d >= '2026-11-06' && (!TBAS_TEST || d < TBAS_TEST));
    for (const d of days) {
      const mins = PLAN.filter((e) => e.date === d && e.end && /^TBAS practice/.test(e.title)).reduce((s, e) => s + minutesOf(e), 0);
      expect({ d, ok: mins >= 30 }).toEqual({ d, ok: true });
    }
  });

  it('ends every planned day from 11-10 with 2-3 "extra if you have time" blocks (Trey, 11-10)', () => {
    const days = [...new Set(PLAN.filter((e) => e.start && e.end && e.kind === 'work' && e.date >= '2026-11-10').map((e) => e.date))];
    for (const d of days) {
      const timed = PLAN.filter((e) => e.date === d && e.start && e.end);
      const extras = timed.filter((e) => e.kind === 'extra');
      const lastEnd = timed.filter((e) => e.kind !== 'extra').reduce((m, e) => (e.end > m ? e.end : m), '00:00');
      const titled = extras.every((e) => /^Extra if you have time: /.test(e.title));
      const atEnd = extras.every((e) => e.start >= lastEnd);
      expect({ d, count: extras.length >= 2 && extras.length <= 3, titled, atEnd }).toEqual({ d, count: true, titled: true, atEnd: true });
    }
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
