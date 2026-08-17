import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { parseTranscript } from './parseTranscript.js';
import { gpaOf, impactOf, creditsToReach, isCounted, fmtGpa } from './gpa.js';

// Transcript.json is NOT json — it is the raw registrar text dump, kept under
// that name because it is the source of record. Read as text on purpose.
const RAW = readFileSync(new URL('./Transcript.json', import.meta.url), 'utf8');
const { courses, terms, totals, unparsed } = parseTranscript(RAW);

const inTerm = (semester) => courses.filter((c) => c.semester === semester);

describe('parseTranscript — structure', () => {
  it('finds all 15 institution terms', () => {
    expect(terms.map((t) => t.semester)).toEqual([
      '2008 FALL', '2009 SPRING', '2009 SUMMER', '2012 SPRING', '2012 FALL',
      '2013 SPRING', '2013 FALL', '2014 SPRING', '2014 SUMMER', '2014 FALL',
      '2015 SPRING', '2015 SUMMER', '2015 FALL', '2016 SPRING', '2016 SUMMER',
    ]);
  });

  it('finds all 64 course rows', () => {
    expect(courses).toHaveLength(64);
  });

  it('assigns every course to a term', () => {
    expect(courses.filter((c) => !c.semester)).toEqual([]);
  });

  it('gives every course a unique id', () => {
    expect(new Set(courses.map((c) => c.id)).size).toBe(courses.length);
  });

  it('leaves nothing unparsed', () => {
    expect(unparsed).toEqual([]);
  });
});

describe('parseTranscript — the fused-row cases', () => {
  // The single hardest line in the file: three courses with no separator,
  // "...0.00 EMICR 2065 ...0.00 EPES 1097 Fitness for Life FE 2.00 A 8.00".
  it('splits three courses out of one line in 2012 FALL', () => {
    const fall = inTerm('2012 FALL');
    expect(fall).toHaveLength(6);
    expect(fall.map((c) => c.code)).toEqual([
      'ART 1020', 'MICR 2060', 'MICR 2065', 'PES 1097', 'ZOOL 2420', 'ZOOL 2425',
    ]);
    expect(fall.find((c) => c.code === 'MICR 2060').repeatFlag).toBe('E');
    expect(fall.find((c) => c.code === 'MICR 2065').repeatFlag).toBe('E');
    expect(fall.find((c) => c.code === 'PES 1097')).toMatchObject({
      course: 'Fitness for Life', attribute: 'FE', credits: 2, grade: 'A', repeatFlag: null,
    });
  });

  it('splits the fused 2015 FALL rows and keeps their flags', () => {
    const fall = inTerm('2015 FALL');
    expect(fall.map((c) => c.code)).toEqual([
      'ESMG 310G', 'ESMG 3200', 'ESMG 3250', 'ESMG 4500', 'ESMG 4650',
    ]);
    expect(fall.find((c) => c.code === 'ESMG 3200').repeatFlag).toBe('E');
    expect(fall.find((c) => c.code === 'ESMG 4500').repeatFlag).toBe('E');
    expect(fall.find((c) => c.code === 'ESMG 3250').repeatFlag).toBe(null);
  });

  it('reads an I flag fused to the next subject (…7.20 IESMG 4500…)', () => {
    const summer = inTerm('2016 SUMMER');
    expect(summer).toHaveLength(4);
    expect(summer.find((c) => c.code === 'ESMG 3200')).toMatchObject({ grade: 'C+', repeatFlag: 'I' });
    expect(summer.find((c) => c.code === 'ESMG 4500')).toMatchObject({ grade: 'B+', repeatFlag: 'I' });
  });

  // A flagless row followed by a line starting with E must NOT borrow that E.
  it('does not steal the next line\'s subject letter as a repeat flag', () => {
    const fall = inTerm('2014 FALL');
    expect(fall.find((c) => c.code === 'EXSC 4500')).toMatchObject({ grade: 'A-', repeatFlag: null });
    expect(fall.find((c) => c.code === 'EXSC 4550')).toMatchObject({ grade: 'A', repeatFlag: null });
    expect(courses.some((c) => c.subject === 'XSC')).toBe(false);
  });
});

describe('parseTranscript — titles and course numbers', () => {
  it('strips the GE attribute code out of the title', () => {
    const chin = courses.find((c) => c.code === 'CHIN 1010');
    expect(chin.course).toBe('Beginning Chinese I');
    expect(chin.attribute).toBe('LH');
  });

  // "Intermediate Chinese II HH" — II is a roman numeral, HH is the attribute.
  // A naive "trailing two capitals" rule eats the numeral instead.
  it('keeps roman numerals that look like attribute codes', () => {
    expect(courses.find((c) => c.code === 'CHIN 2020').course).toBe('Intermediate Chinese II');
    expect(courses.find((c) => c.code === 'CHIN 2020').attribute).toBe('HH');
    expect(courses.find((c) => c.code === 'ESEC 3130').course).toBe('Paramedic II');
    expect(courses.find((c) => c.code === 'ESEC 3130').attribute).toBe(null);
    expect(courses.find((c) => c.code === 'CHEM 1210').course).toBe('Principles of Chem I');
  });

  it('handles letter-suffixed course numbers', () => {
    expect(courses.map((c) => c.number)).toEqual(expect.arrayContaining(['270G', '310G', '242H', '242L', '0990']));
  });
});

describe('parseTranscript — repeated courses', () => {
  it('keeps all three ZOOL 2320 attempts with the right flags', () => {
    const attempts = courses.filter((c) => c.code === 'ZOOL 2320');
    expect(attempts.map((c) => [c.semester, c.grade, c.repeatFlag])).toEqual([
      ['2013 FALL', 'D', 'E'],
      ['2014 SUMMER', 'E', 'E'],
      ['2014 FALL', 'A', 'I'],
    ]);
  });

  it('keeps both MICR 2060 attempts', () => {
    expect(courses.filter((c) => c.code === 'MICR 2060').map((c) => [c.grade, c.repeatFlag]))
      .toEqual([['D+', 'E'], ['C-', 'I']]);
  });

  it('counts exactly one attempt of each repeated course', () => {
    for (const code of ['ZOOL 2320', 'ZOOL 2325', 'MICR 2060', 'MICR 2065', 'ESMG 3200', 'ESMG 4500']) {
      const counted = courses.filter((c) => c.code === code && isCounted(c));
      expect(counted, code).toHaveLength(1);
    }
  });
});

describe('parseTranscript — printed figures captured for validation', () => {
  it('captures a footer for every term', () => {
    expect(terms.filter((t) => !t.printed)).toEqual([]);
  });

  it('captures the grand totals', () => {
    expect(totals.institution).toEqual({ earnedHours: 164, gpaHours: 171, points: 522.3, gpa: 3.05 });
    expect(totals.transfer).toEqual({ earnedHours: 7, gpaHours: 0, points: 0, gpa: 0 });
    expect(totals.overall).toEqual({ earnedHours: 171, gpaHours: 171, points: 522.3, gpa: 3.05 });
  });
});

// The transcript prints its own answers, so the parser and the GPA engine are
// checked against the registrar rather than against my reading of the file.
describe('gpaOf — reconciles with every printed figure', () => {
  it.each([
    ['2008 FALL', 16, 16, 52.2, 3.26],
    ['2009 SPRING', 13, 13, 39.7, 3.05],
    ['2009 SUMMER', 4, 4, 16.0, 4.0],
    ['2012 SPRING', 13, 13, 50.8, 3.9],
    ['2012 FALL', 9, 9, 22.0, 2.44],
    ['2013 SPRING', 7, 11, 21.0, 1.9],
    ['2013 FALL', 10, 10, 34.5, 3.45],
    ['2014 SPRING', 12, 12, 19.8, 1.65],
    ['2014 SUMMER', 0, 0, 0.0, 0.0],
    ['2014 FALL', 16, 16, 63.1, 3.94],
    ['2015 SPRING', 14, 14, 32.3, 2.3],
    ['2015 SUMMER', 4, 7, 12.0, 1.71],
    ['2015 FALL', 9, 9, 36.0, 4.0],
    ['2016 SPRING', 19, 19, 68.9, 3.62],
    ['2016 SUMMER', 18, 18, 54.0, 3.0],
  ])('%s → %i earned / %i GPA hrs / %f pts / %f GPA', (semester, earned, gpaHours, points, gpa) => {
    const r = gpaOf(inTerm(semester));
    expect(r.earnedHours).toBe(earned);
    expect(r.gpaHours).toBe(gpaHours);
    expect(r.points).toBeCloseTo(points, 2);
    if (gpaHours > 0) expect(fmtGpa(r.gpa)).toBe(gpa.toFixed(2));
  });

  it('every term matches its own printed footer, GPA included', () => {
    for (const t of terms) {
      const r = gpaOf(inTerm(t.semester));
      expect([t.semester, r.gpaHours]).toEqual([t.semester, t.printed.gpaHours]);
      expect([t.semester, r.earnedHours]).toEqual([t.semester, t.printed.earnedHours]);
      expect(r.points, t.semester).toBeCloseTo(t.printed.points, 2);
      if (r.gpaHours > 0) expect([t.semester, fmtGpa(r.gpa)]).toEqual([t.semester, t.printed.gpa.toFixed(2)]);
    }
  });

  // The three terms that prove truncation rather than rounding.
  it.each([
    ['2012 SPRING', 3.9077, '3.90'],
    ['2013 SPRING', 1.9091, '1.90'],
    ['2016 SPRING', 3.6263, '3.62'],
  ])('%s truncates %f to %s, matching the registrar', (semester, raw, shown) => {
    const r = gpaOf(inTerm(semester));
    expect(r.gpa).toBeCloseTo(raw, 3);
    expect(fmtGpa(r.gpa)).toBe(shown);
  });

  it('does not let float drift truncate an exact value down a cent', () => {
    expect(fmtGpa(gpaOf(inTerm('2013 FALL')).gpa)).toBe('3.45');
    expect(fmtGpa(4)).toBe('4.00');
  });

  it('reproduces the grand total: 164 earned, 171 GPA hrs, 522.30 pts, 3.05', () => {
    const r = gpaOf(courses);
    expect(r.earnedHours).toBe(164);
    expect(r.gpaHours).toBe(171);
    expect(r.points).toBeCloseTo(522.3, 2);
    expect(r.gpa).toBeCloseTo(3.0544, 4);
    expect(r.gpa.toFixed(2)).toBe('3.05');
  });
});

describe('gpaOf — options', () => {
  it('counting every attempt adds the 18 excluded credits to the 171', () => {
    const excluded = courses.filter((c) => c.repeatFlag === 'E');
    expect(excluded.reduce((s, c) => s + c.credits, 0)).toBe(18);
    const all = gpaOf(courses, { honorRepeats: false });
    expect(all.gpaHours).toBe(189);
    expect(all.gpa).toBeLessThan(3.05);
  });

  it('the standard scale lowers the GPA (B+/C+/D+ each drop 0.1)', () => {
    const std = gpaOf(courses, { scale: 'standard' });
    expect(std.gpaHours).toBe(171);
    expect(std.gpa).toBeLessThan(3.0544);
    expect(std.gpa).toBeGreaterThan(3.0);
  });

  it('an override changes only the grade, never the credits or inclusion', () => {
    const base = gpaOf(courses);
    const lifted = gpaOf(courses, { overrides: { 'MATH-2040-2013-SPRING': 'A' } });
    expect(lifted.gpaHours).toBe(base.gpaHours);
    expect(lifted.points).toBeCloseTo(base.points + 16, 2);
    expect(lifted.earnedHours).toBe(base.earnedHours + 4);
  });

  it('overriding an excluded attempt does nothing while flags are honoured', () => {
    const base = gpaOf(courses);
    const poked = gpaOf(courses, { overrides: { 'ZOOL-2320-2013-FALL': 'A' } });
    expect(poked).toEqual(base);
  });

  it('empty overrides reproduce the actual GPA exactly', () => {
    expect(gpaOf(courses, { overrides: {} })).toEqual(gpaOf(courses));
  });
});

describe('impactOf', () => {
  it('weights by credit hours, not by how bad the letter looks', () => {
    const emt = courses.find((c) => c.code === 'ESEC 1140');   // 9.00 cr, B-
    const weights = courses.find((c) => c.code === 'PES 1085'); // 1.00 cr, A-
    expect(impactOf(courses, emt)).toBeGreaterThan(impactOf(courses, weights));
  });

  it('ranks the failed 4-credit stats course near the top', () => {
    const ranked = [...courses]
      .filter((c) => isCounted(c))
      .sort((a, b) => impactOf(courses, b) - impactOf(courses, a))
      .slice(0, 5)
      .map((c) => c.code);
    expect(ranked).toContain('MATH 2040');
    expect(ranked).toContain('ESEC 1140');
  });

  it('is zero for an already-A course and for an excluded attempt', () => {
    expect(impactOf(courses, courses.find((c) => c.code === 'MATH 1050'))).toBeCloseTo(0, 10);
    expect(impactOf(courses, courses.find((c) => c.code === 'ZOOL 2320' && c.repeatFlag === 'E'))).toBe(0);
  });
});

describe('creditsToReach', () => {
  it('reports an already-met goal', () => {
    expect(creditsToReach(courses, 3.0)).toMatchObject({ met: true, credits: 0 });
  });

  it('solves for credits at an A', () => {
    const r = creditsToReach(courses, 3.25);
    expect(r.met).toBe(false);
    expect(r.credits).toBeGreaterThan(0);
    // Adding exactly that many A-credits must clear the goal.
    const withNew = [...courses, { id: 'x', credits: r.credits, grade: 'A', repeatFlag: null }];
    expect(gpaOf(withNew).gpa).toBeGreaterThanOrEqual(3.25);
  });

  it('flags an unreachable goal', () => {
    expect(creditsToReach(courses, 3.9, { targetGrade: 'B+' })).toMatchObject({ unreachable: true });
  });
});

describe('parseTranscript — degenerate input', () => {
  it('returns empty structures rather than throwing', () => {
    for (const input of ['', '   ', null, undefined, 42, {}]) {
      const r = parseTranscript(input);
      expect(r.courses).toEqual([]);
      expect(r.terms).toEqual([]);
    }
  });

  it('parses a single hand-written row', () => {
    const r = parseTranscript('2020 FALL\nABC 1234 Some Course GE 3.00 B+ 10.20\n');
    expect(r.courses).toHaveLength(1);
    expect(r.courses[0]).toMatchObject({ course: 'Some Course', attribute: 'GE', credits: 3, grade: 'B+', semester: '2020 FALL' });
  });

  it('surfaces a course-shaped line it could not read', () => {
    const r = parseTranscript('2020 FALL\nABC 1234 Broken Row 3.00 Q 10.20\n');
    expect(r.courses).toHaveLength(0);
    expect(r.unparsed.map((u) => u.text)).toContain('ABC 1234 Broken Row 3.00 Q 10.20');
  });
});
