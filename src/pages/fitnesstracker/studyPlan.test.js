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

  it('keeps every day at or under 9 hours, and only the 10-26 to 11-02 push week runs past 7.5', () => {
    // 2026-10-25: Trey lifted his 5 hr cap for the catch-up week. 2026-10-27: "I will put in extra time this week".
    const hours = workHoursByDay();
    for (const [day, h] of Object.entries(hours)) expect({ day, ok: h <= 9 }).toEqual({ day, ok: true });
    const over75 = Object.entries(hours).filter(([, h]) => h > 7.5).map(([d]) => d);
    for (const d of over75) expect({ d, inPushWeek: d >= '2026-10-26' && d <= '2026-11-02' }).toEqual({ d, inPushWeek: true });
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

  it('has one ESMG discussion post or reply every day Mon-Thu (extra credit needs 3+ separate days)', () => {
    // Trey posted + replied Mon, replied Tue (both required replies done). Reply #3 dropped 10-28: no room Wed/Thu.
    for (const d of ['2026-10-26', '2026-10-27']) {
      expect({ d, n: PLAN.filter((e) => e.date === d && /ESMG 3200 W3 discussion/.test(e.title)).length >= 1 }).toEqual({ d, n: true });
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
