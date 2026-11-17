import { describe, it, expect } from 'vitest';
import { chipTextColor, tidyTitle, courseChipLabel, dedupeCrossListed, chipDotColor } from './calendarText.js';
import { planOverlayByDate, KIND_COLORS } from './studyPlan.js';

describe('tidyTitle: the chips Trey complained about', () => {
  const cases = [
    ['MICR 2060 OLQ 11 (Ch 11)', 'MICR 2060 OLQ 11'],
    ['MICR 2060 OLQ 12 (Ch 12) + eat', 'MICR 2060 OLQ 12 + eat'],
    ['ESFF 1120 Init 5+6: draft, polish, SUBMIT', 'ESFF 1120 Initiatives 5 + 6: draft, polish, submit'],
    ['Warrior Knowledge (30 min)', 'Warrior Knowledge'],
    ['Warrior Knowledge (daily 30 min; fine in 5-min pieces during the off hours)', 'Warrior Knowledge'],
    ['Workout (PT cancelled this week)', 'Workout (PT cancelled)'],
    ['AEROS 210 DB8 (Learning Suite)', 'AEROS 210 Discussion Board 8'],
    ['CHEM 1210 Quiz 15 make-up (Sec 5-1, 5-2)', 'CHEM 1210 Quiz 15 make-up'],
    ['CHEM 1210 EXAM 3 (cumulative Ch 1-6)', 'CHEM 1210 Exam 3'],
    ['CHEM 1210 Exam 3 prep: library block, timed Ch 1-6 practice exam (~2 min/question), then rework the misses',
      'CHEM 1210 Exam 3 prep: library block, timed Ch 1-6 practice exam, then rework the misses'],
    ['DUE: ESMG 3200 A4 · CHEM Q21 (12:30)', 'DUE: ESMG 3200 Assignment 4 · CHEM Quiz 21 (12:30)'],
    ['MICR 2065 Lab Notebook #8 + Post-Lab #8', 'MICR 2065 Lab Notebook 8 + Post-Lab 8'],
    ['TBAS paperwork: Candidate Worksheet, transcript, ID + SOCIAL SECURITY CARD', 'TBAS paperwork: Candidate Worksheet, transcript, ID + Social Security Card'],
    ['CHEM 1210 quizzes: Quiz 9 (0/8, never taken), retakes Quiz 10 (63%), 11 (25%)', 'CHEM 1210 quizzes: Quiz 9, retakes Quiz 10, 11'],
    ['Holy War run: report by 0600 (CONFIRM time, place, uniform, ride)', 'Holy War run: report by 0600'],
    ['Presidential Review practice (0600, PTGs)', 'Presidential Review practice (0600, PTGs)'],
  ];
  it.each(cases)('%s', (raw, want) => expect(tidyTitle(raw)).toBe(want));
});

describe('coursework chips', () => {
  const t = (code, name) => ({ code, name });
  it.each([
    [t('CHEM 1210', 'Quiz 21, 7-1 to 7-3'), 'CHEM 1210 Quiz 21'],
    [t('MICR 2060', 'Take OLQ 11 on MMAHP Ch 11/ M2OS Ch 15'), 'MICR 2060 OLQ 11'],
    [t('MICR 2060', 'Take Exam 3 on MMAHP Ch 9, 11 & 12 or Equivalent'), 'MICR 2060 Exam 3'],
    [t('ESFF 1120', 'INITIATIVE 5: Evolving Health Practices - Paper'), 'ESFF 1120 Initiative 5'],
    [t('ESMG 3200', 'Week 4 Discussion: Protecting Responders While Serving the Public'), 'ESMG 3200 Week 4 Discussion'],
    [t('MICR 2065', 'Pre-Lab Preparation Assignment #8: Blood Microscopy'), 'MICR 2065 Pre-Lab 8'],
    [t('MICR 2065', 'Post-Lab Assessment #8: Medical Microbiology (Lab 7) (Remotely Proctored)'), 'MICR 2065 Post-Lab Assessment 8'],
    [t('AERO 2100', 'Discussion Board 8'), 'AERO 2100 Discussion Board 8'],
  ])('%j', (task, want) => expect(courseChipLabel(task)).toBe(want));

  it('drops the cross-listed shell but keeps a lone one', () => {
    const real = { id: 1, code: 'ESMG 3200', name: 'Week 4 Discussion: X' };
    const shell = { id: 2, code: '2026-XLIST', name: 'Week 4 Discussion: X' };
    expect(dedupeCrossListed([real, shell])).toEqual([real]);
    expect(dedupeCrossListed([shell])).toEqual([shell]);
  });
});

describe('colour means one thing', () => {
  const colorOf = (c) => `course:${c}`;
  const ev = (o) => ({ calId: 'plan', color: '#000', ...o });
  it('a course keeps one colour on every kind of block', () => {
    for (const kind of ['work', 'class', 'fixed']) {
      expect(chipDotColor(ev({ kind, title: 'CHEM 1210 class' }), colorOf, KIND_COLORS)).toBe('course:CHEM 1210');
    }
    expect(chipDotColor(ev({ kind: 'work', title: 'ESMG 3200 Week 4 reply #1', course: 'ESMG 3200' }), colorOf, KIND_COLORS)).toBe('course:ESMG 3200');
    expect(chipDotColor(ev({ kind: 'work', title: 'AEROS 210 DB8' }), colorOf, KIND_COLORS)).toBe('course:AERO 2100');
  });
  it('due is red, star is white, ROTC blue, real Google events keep their own colour', () => {
    expect(chipDotColor(ev({ kind: 'due', title: 'DUE: CHEM 1210 Quiz 22' }), colorOf, KIND_COLORS)).toBe('#f87171');
    expect(chipDotColor(ev({ kind: 'star', title: '★ Exam' }), colorOf, KIND_COLORS)).toBe('#f8fafc');
    expect(chipDotColor(ev({ kind: 'work', title: 'Warrior Knowledge', course: 'AFROTC' }), colorOf, KIND_COLORS)).toBe('#38bdf8');
    expect(chipDotColor({ calId: 'abc', color: '#123456', title: 'x' }, colorOf, KIND_COLORS)).toBe('#123456');
  });
});

describe('every plan title, as the calendar shows it', () => {
  const titles = Object.values(planOverlayByDate()).flat().map((e) => tidyTitle(e.title));
  it('has no shorthand, durations, scores or shouting left', () => {
    for (const s of titles) {
      expect(s, s).not.toMatch(/\bDB\s?\d|\bInit\b|\bQ\d|\bA\d\b|\bW\d\b|#\d/);
      expect(s, s).not.toMatch(/\b\d+[- ]?(?:min|hrs?|hours?)\b/i);
      expect(s, s).not.toMatch(/\(\s*(?:Ch|Sec)\b|\([^)]*(?:\d+%|\d\/\d)/);
      expect(s, s).not.toMatch(/\b(?!(?:CHEM|MICR|ESFF|ESMG|AERO|AEROS|AFROTC|ROTC|ODC|OPORD|TBAS|LLAB|DUE|ACS|ORI|OLQ|AIWP|MMAHP|M2OS|XLIST|DODMERB|AFOQT|UVU|BYU|TBC|PFRA)\b)[A-Z]{4,}\b/);
    }
  });
});

describe('text colour matches the course', () => {
  const colorOf = (c) => `course:${c}`;
  const ev = (o) => ({ calId: 'plan', ...o });
  it('a course chip is written in its course colour, including its DUE line', () => {
    expect(chipTextColor(ev({ kind: 'work', title: 'CHEM 1210 Quiz 21' }), colorOf)).toBe('course:CHEM 1210');
    expect(chipTextColor(ev({ kind: 'due', title: 'DUE: CHEM 1210 Quiz 22' }), colorOf)).toBe('course:CHEM 1210');
    expect(chipTextColor(ev({ kind: 'work', title: 'Honor Points', course: 'ESMG 3200' }), colorOf)).toBe('course:ESMG 3200');
  });
  it('ROTC is blue; personal items, stars and lines mixing courses stay white', () => {
    expect(chipTextColor(ev({ kind: 'work', title: 'Warrior Knowledge', course: 'AFROTC' }), colorOf)).toBe('#38bdf8');
    expect(chipTextColor(ev({ kind: 'rest', title: 'Lunch' }), colorOf)).toBeNull();
    expect(chipTextColor(ev({ kind: 'star', title: 'CHEM 1210 Exam 3' }), colorOf)).toBeNull();
    expect(chipTextColor(ev({ kind: 'due', title: 'DUE: ESFF 1120 Initiatives 5 + 6 · MICR 2060 OLQ 11' }), colorOf)).toBeNull();
    expect(chipTextColor({ calId: 'abc', title: 'CHEM 1210' }, colorOf)).toBeNull();
  });
});

import { COURSE_COLORS } from '../theknowledgebase/courses/coursework/courseworkModel.js';

describe('the colour assignments Trey chose', () => {
  const hue = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b); const d = max - Math.min(r, g, b);
    if (!d) return 0;
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  it('CHEM green, micro lab purple, both fire classes orange, every AERO class blue, all colours distinct', () => {
    expect(hue(COURSE_COLORS['CHEM 1210'])).toBeGreaterThan(90);
    expect(hue(COURSE_COLORS['CHEM 1210'])).toBeLessThan(160);
    expect(hue(COURSE_COLORS['MICR 2065'])).toBeGreaterThan(260);
    expect(hue(COURSE_COLORS['MICR 2065'])).toBeLessThan(290);
    for (const code of ['ESFF 1120', 'ESMG 3200']) {
      expect(hue(COURSE_COLORS[code]), code).toBeGreaterThan(15);
      expect(hue(COURSE_COLORS[code]), code).toBeLessThan(35);
    }
    for (const [code, color] of Object.entries(COURSE_COLORS).filter(([c]) => c.startsWith('AERO'))) {
      expect(hue(color), code).toBeGreaterThan(195);
      expect(hue(color), code).toBeLessThan(225);
    }
    const all = Object.values(COURSE_COLORS);
    expect(new Set(all).size).toBe(all.length);
  });
});
