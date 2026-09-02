// The map is pure data that everything else keys off, so its invariants are worth pinning.
// A silent drift here (a renamed ACS chapter id, a section that stops matching a quiz title)
// would misroute drills without any visible error.

import { describe, it, expect } from 'vitest';
import {
  ACS_CHAPTERS, COURSE_CHAPTERS, SECTIONS, EXAMS,
  sectionsInChapter, sectionsForExam, sectionsForAcsChapter,
  sectionsFromQuizTitle, courseOnlySections,
} from '../syllabusMap.js';
import { CHEM_CHAPTERS } from '../curriculum.js';

describe('syllabusMap structure', () => {
  it('covers all 10 course chapters and 45 teaching sections', () => {
    expect(COURSE_CHAPTERS).toHaveLength(10);
    // 55 sections in the book minus the 10 "-1 Introduction" front-matter sections.
    expect(SECTIONS).toHaveLength(45);
  });

  it('every ACS chapter id is a real curriculum.js chapter', () => {
    const real = new Set(CHEM_CHAPTERS.map((c) => c.id));
    for (const c of ACS_CHAPTERS) expect(real.has(c.id), `${c.id} is not in curriculum.js`).toBe(true);
  });

  it('every section maps to a real ACS chapter or explicitly to null', () => {
    const ids = new Set(ACS_CHAPTERS.map((c) => c.id));
    for (const s of SECTIONS) {
      if (s.acs === null) continue;
      expect(ids.has(s.acs), `${s.section} maps to unknown ACS chapter ${s.acs}`).toBe(true);
    }
  });

  it('every declared concept is one the ACS chapter actually lists', () => {
    // Catches a typo'd concept id, which would otherwise just silently drill nothing.
    const byId = new Map(CHEM_CHAPTERS.map((c) => [c.id, c]));
    for (const s of SECTIONS) {
      if (!s.acs || !s.concepts.length) continue;
      const chapter = byId.get(s.acs);
      for (const concept of s.concepts) {
        expect(chapter.concepts, `${s.section} declares "${concept}", absent from ${s.acs}`).toContain(concept);
      }
    }
  });

  it('section numbers are unique and in course order', () => {
    const nums = SECTIONS.map((s) => s.section);
    expect(new Set(nums).size).toBe(nums.length);
    const key = (s) => s.split('-').map(Number);
    for (let i = 1; i < SECTIONS.length; i++) {
      const [ac, as] = key(SECTIONS[i - 1].section);
      const [bc, bs] = key(SECTIONS[i].section);
      expect(bc > ac || (bc === ac && bs > as), `${SECTIONS[i - 1].section} then ${SECTIONS[i].section}`).toBe(true);
    }
  });
});

describe('exam coverage', () => {
  it('every exam is cumulative from chapter 1', () => {
    for (const e of EXAMS) {
      expect(e.chapters[0]).toBe(1);
      expect(e.chapters).toEqual([...e.chapters].sort((a, b) => a - b));
    }
  });

  it('the final covers every course chapter', () => {
    expect(EXAMS.at(-1).chapters).toHaveLength(10);
    expect(EXAMS.at(-1).acsEquivalent).toBe(true);
  });

  it('each exam covers strictly more than the one before it', () => {
    for (let i = 1; i < EXAMS.length; i++) {
      expect(EXAMS[i].chapters.length).toBeGreaterThan(EXAMS[i - 1].chapters.length);
    }
  });

  it('sectionsForExam grows with each exam and ends at every section', () => {
    expect(sectionsForExam('exam-1').length).toBeLessThan(sectionsForExam('exam-2').length);
    expect(sectionsForExam('final')).toHaveLength(SECTIONS.length);
  });
});

describe('lookups', () => {
  it('sectionsInChapter returns only that chapter', () => {
    const ch4 = sectionsInChapter(4);
    expect(ch4.length).toBe(5);
    for (const s of ch4) expect(s.section.startsWith('4-')).toBe(true);
  });

  it('sectionsForAcsChapter gathers sections the course splits apart', () => {
    // Bonding is ONE ACS chapter but two course chapters (7 and 8) - the whole reason this map
    // exists. If this ever returns only chapter-7 sections, the ACS track has silently lost half
    // its bonding material.
    const bonding = sectionsForAcsChapter('chem1-07-structure-bonding');
    const chapters = new Set(bonding.map((s) => s.section.split('-')[0]));
    expect(chapters).toEqual(new Set(['7', '8']));
  });

  it('states of matter gathers the course Gases and IMF chapters', () => {
    const som = sectionsForAcsChapter('chem1-08-states-of-matter');
    expect(new Set(som.map((s) => s.section.split('-')[0]))).toEqual(new Set(['9', '10']));
  });

  it('electronic structure is course chapter 6, not chapter 2', () => {
    // The displacement that made this map necessary.
    const es = sectionsForAcsChapter('chem1-02-electronic-structure');
    expect(es.length).toBeGreaterThan(0);
    for (const s of es) expect(s.section.startsWith('6-')).toBe(true);
  });

  it('redox is course-only — the ACS first-term exam does not test it', () => {
    const only = courseOnlySections();
    expect(only.map((s) => s.section)).toEqual(['5-2']);
  });
});

describe('sectionsFromQuizTitle', () => {
  it('reads a single section', () => {
    expect(sectionsFromQuizTitle('Quiz 4, Sec 1-7')).toEqual(['1-7']);
  });

  it('expands a range rather than returning only its endpoints', () => {
    expect(sectionsFromQuizTitle('Quiz 12, Sec 4-3 to 4-4')).toEqual(['4-3', '4-4']);
  });

  it('expands a range that STARTS on an omitted "-1 Introduction" section', () => {
    // Both of these are real Canvas titles. Requiring each endpoint to be a known teaching
    // section made them collapse to one section and silently under-drill the quiz.
    expect(sectionsFromQuizTitle('Quiz 5, Sec 2-1 to 2-3')).toEqual(['2-2', '2-3']);
    expect(sectionsFromQuizTitle('Quiz Zero 1-1 to 1-2')).toEqual(['1-2']);
  });

  it('spans a chapter boundary', () => {
    // "Sec 6-5 to 7-2" must not stop at the end of chapter 6.
    expect(sectionsFromQuizTitle('Quiz X, Sec 6-5 to 7-2')).toEqual(['6-5', '7-2']);
  });

  it('returns nothing for a title naming no section, rather than guessing', () => {
    expect(sectionsFromQuizTitle('Quiz Zero')).toEqual([]);
    expect(sectionsFromQuizTitle('')).toEqual([]);
    expect(sectionsFromQuizTitle(null)).toEqual([]);
  });

  it('ignores numbers that look like sections but are not', () => {
    // 99-99 is not a real section; it must not be invented into the result.
    expect(sectionsFromQuizTitle('Quiz 3, Sec 99-99')).toEqual([]);
  });
});
