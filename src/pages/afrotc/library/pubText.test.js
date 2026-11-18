import { describe, it, expect } from 'vitest';
import { splitPublication, cleanLines, titleOf } from './pubText.js';

const page = (...lines) => lines.join('\n');

describe('splitPublication', () => {
  const pages = [
    page('BY ORDER OF THE SECRETARY', 'DAFI36-2903 29 FEBRUARY 2024', 'Chapter 2 ROLES AND RESPONSIBILITIES ..........  14'),
    page('4 DAFI36-2903 29 FEBRUARY 2024', 'Chapter 1', 'GENERAL INFORMATION', '1.1. Applicability. This instruction applies to', 'all Airmen and Guardians.', '1.1.1. Officers will maintain uni-', 'forms.'),
    page('AFROTCI36-2011V3 \t13 JANUARY 2025 \t13', '1.2. Wear. See Chapter 4, host installations are responsible', 'for it.', 'Chapter 3', 'GROOMING AND APPEARANCE STANDARDS', '3.1. Hair. Hair will be clean.'),
  ];
  const { mode, sections } = splitPublication(pages);

  it('splits on numbered paragraphs and keeps their page', () => {
    expect(mode).toBe('paragraphs');
    const p = sections.find((s) => s.para === '1.1');
    expect(p.title).toBe('Applicability');
    expect(p.text).toBe('Applicability. This instruction applies to all Airmen and Guardians.');
    expect(p.page).toBe(2);
  });

  it('rejoins a word hyphenated across a line break', () => {
    expect(sections.find((s) => s.para === '1.1.1').text).toBe('Officers will maintain uniforms.');
  });

  it('takes a chapter title from the line after "Chapter N" and labels the paragraphs under it', () => {
    expect(sections.find((s) => s.para === '1.1').where).toBe('Chapter 1: GENERAL INFORMATION');
    expect(sections.find((s) => s.para === '3.1').where).toBe('Chapter 3: GROOMING AND APPEARANCE STANDARDS');
  });

  it('does not treat a cross-reference or a contents line as a chapter heading', () => {
    const wheres = new Set(sections.map((s) => s.where));
    expect([...wheres].some((w) => /host installations/.test(w))).toBe(false);
    expect([...wheres].some((w) => /ROLES AND RESPONSIBILITIES/.test(w))).toBe(false);
    expect(sections.find((s) => s.para === '1.2').text).toContain('See Chapter 4, host installations');
  });

  it('gives every section a unique id', () => {
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
  });

  it('falls back to one section per page when paragraphs are not numbered', () => {
    const r = splitPublication([page('AFROTC Det 025 Training Manual', 'Reveille', 'The detail will fall in.'), page('Retreat', 'The commander salutes.')]);
    expect(r.mode).toBe('pages');
    expect(r.sections.map((s) => s.page)).toEqual([1, 2]);
  });
});

describe('cleanLines', () => {
  it('drops running heads, page numbers and dot-leader contents lines', () => {
    expect(cleanLines(page('AFROTCI36-2011V3 \t13 JANUARY 2025 \t13', '42', 'Figure 3.1. Hair .......... 19', 'Real text.'))).toEqual(['Real text.']);
  });
});

describe('titleOf', () => {
  it('uses the run-in heading when there is one, else the opening words', () => {
    expect(titleOf('University Notification. The detachment must')).toBe('University Notification');
    expect(titleOf('Users will not press or starch the 2PFDU.')).toBe('Users will not press or starch the 2PFDU');
    expect(titleOf('any uniform is authorized while attending off duty education conducted off a base')).toMatch(/…$/);
  });
});
