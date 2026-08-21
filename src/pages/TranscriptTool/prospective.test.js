import { describe, it, expect } from 'vitest';
import { buildProspective, termOrderOf, EMPTY_PROSPECTIVE, UNDATED_ORDER } from './prospective';
import { gpaOf, isCounted, gradeOf } from './gpa';

const form = (p = {}) => ({ ...EMPTY_PROSPECTIVE, ...p });

describe('termOrderOf', () => {
  // Same encoding parseTranscript.js uses, so a dated prospective class sorts
  // among the real courses instead of piling up at one end.
  it('orders terms within and across years', () => {
    expect(termOrderOf(2026, 'SPRING')).toBeLessThan(termOrderOf(2026, 'SUMMER'));
    expect(termOrderOf(2026, 'SUMMER')).toBeLessThan(termOrderOf(2026, 'FALL'));
    expect(termOrderOf(2026, 'FALL')).toBeLessThan(termOrderOf(2027, 'SPRING'));
  });

  it('sends an unusable term to the end rather than to 1970', () => {
    expect(termOrderOf('', 'FALL')).toBe(UNDATED_ORDER);
    expect(termOrderOf(2026, 'WINTER')).toBe(UNDATED_ORDER);
  });
});

describe('buildProspective', () => {
  it('rejects only the field the GPA cannot be computed without', () => {
    expect(buildProspective(form({ credits: '0' })).error).toBeTruthy();
    expect(buildProspective(form({ credits: '' })).error).toBeTruthy();
    expect(buildProspective(form({ credits: 'abc' })).error).toBeTruthy();
    expect(buildProspective(form({ credits: '-3' })).error).toBeTruthy();
  });

  it('accepts a class with nothing but credits filled in', () => {
    const { course, error } = buildProspective(form());
    expect(error).toBeUndefined();
    expect(course.credits).toBe(3);
    expect(course.code).toBe('NEW');
    expect(course.course).toBe('Prospective class');
  });

  it('builds the code the registrar would print', () => {
    const { course } = buildProspective(form({ subject: 'engl', number: '2010' }));
    expect(course.code).toBe('ENGL 2010');
    expect(course.subject).toBe('ENGL');
  });

  it('dates a class into a real term', () => {
    const { course } = buildProspective(form({ year: '2026', term: 'SPRING' }));
    expect(course.semester).toBe('2026 SPRING');
    expect(course.termOrder).toBe(termOrderOf(2026, 'SPRING'));
  });

  it('sorts an undated class to the end', () => {
    const { course } = buildProspective(form({ dated: false }));
    expect(course.semester).toBe('Prospective');
    expect(course.year).toBeNull();
    expect(course.termOrder).toBe(UNDATED_ORDER);
  });

  it('gives every class a distinct id', () => {
    const ids = new Set(Array.from({ length: 50 }, () => buildProspective(form()).course.id));
    expect(ids.size).toBe(50);
  });

  // Real courses and prospective ones go through the same gpa.js, sorts and
  // exports. A field the parser emits but this does not would show up as an
  // unexplained blank cell rather than as an error.
  it('carries every field the parser emits', () => {
    const { course } = buildProspective(form({ subject: 'MATH', number: '1050', attribute: 'QL' }));
    for (const key of ['id', 'subject', 'number', 'code', 'course', 'attribute', 'credits',
      'grade', 'printedPoints', 'repeatFlag', 'semester', 'year', 'term', 'termOrder']) {
      expect(course).toHaveProperty(key);
    }
    expect(isCounted(course, true)).toBe(true);
    expect(gradeOf(course, {})).toBe('A');
  });

  it('moves the GPA exactly as a real course of the same weight would', () => {
    const real = [{ id: 'r', credits: 3, grade: 'C' }];
    const { course } = buildProspective(form({ credits: '3', grade: 'A' }));
    expect(gpaOf([...real, course]).gpa).toBeCloseTo(3.0, 6);
    expect(gpaOf([...real, course]).gpaHours).toBe(6);
  });

  it('leaves the actual GPA untouched — it is only ever in the what-if list', () => {
    const real = [{ id: 'r', credits: 3, grade: 'C' }];
    expect(gpaOf(real).gpa).toBeCloseTo(2.0, 6);
  });
});
