import { describe, it, expect } from 'vitest';
import { PLAN, workHoursByDay, planOverlayByDate, clock, minutesOf } from './studyPlan.js';

describe('study plan', () => {
  it('every timed entry has a valid, ordered time range on a real day', () => {
    for (const e of PLAN) {
      expect(e.date).toMatch(/^2026-10-\d\d$/);
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

  it('keeps every day at or under 7.5 hours of work, and the planned long days are named', () => {
    // 2026-10-25: Trey lifted his 5 hr cap for the catch-up week ("I'll do more than 5 hours a day on most days").
    const hours = workHoursByDay();
    for (const [day, h] of Object.entries(hours)) expect({ day, ok: h <= 7.5 }).toEqual({ day, ok: true });
    const over5 = Object.entries(hours).filter(([, h]) => h > 5).map(([d]) => d);
    expect(over5).toEqual(['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']);
  });

  it('puts the Air Force Song / Airman’s Creed slot on every weekday-evening plan day it was promised', () => {
    const days = new Set(PLAN.filter((e) => /Song/.test(e.title)).map((e) => e.date));
    for (const d of ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29']) expect(days.has(d)).toBe(true);
  });

  it('schedules three ODC prep blocks (Sun, Mon, plus a Tuesday refresher: Trey asked for 3 x 30 min) before the ORI on Wed 10/28 6 AM', () => {
    const odc = PLAN.filter((e) => /^ODC prep/.test(e.title));
    expect(odc).toHaveLength(3);
    for (const e of odc) expect(`${e.date}T${e.start}` < '2026-10-28T06:00').toBe(true);
  });

  it('has one ESMG discussion post or reply every day Mon-Thu (extra credit needs 3+ separate days)', () => {
    for (const d of ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29']) {
      expect({ d, n: PLAN.filter((e) => e.date === d && /ESMG 3200 W3 discussion/.test(e.title)).length >= 1 }).toEqual({ d, n: true });
    }
  });

  it('plans about 2 hours of MICR 2060 reading in its own blocks', () => {
    const mins = PLAN.filter((e) => /^MICR 2060 reading/.test(e.title)).reduce((s, e) => s + minutesOf(e), 0);
    expect(mins).toBeGreaterThanOrEqual(120);
  });

  it('keeps the chem real-study blocks separate from the quiz blocks', () => {
    expect(PLAN.some((e) => /CHEM 1210 real study/.test(e.title))).toBe(true);
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
