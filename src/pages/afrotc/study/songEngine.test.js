import { describe, it, expect } from 'vitest';
import { parseSong, buildSteps, hintInitials, hintAt } from './songEngine.js';
import { AIRMANS_CREED } from './creedText.js';

// Public-domain nursery text, so no test fixture is a copyrighted song.
const TEXT = `Twinkle, twinkle, little star,
How I wonder what you are.
Up above the world so high,
Like a diamond in the sky.

[Chorus]
Twinkle, twinkle, little star,
How I wonder what you are.`;

describe('parseSong', () => {
  const s = parseSong(TEXT);
  it('splits lines and stanzas on blank lines and labels', () => {
    expect(s.lines).toHaveLength(6);
    expect(s.stanzas).toHaveLength(2);
    expect(s.stanzas[0].label).toBe('Verse 1');
    expect(s.stanzas[1].label).toBe('Chorus');
    expect(s.stanzas[1].lines.map((l) => l.pos)).toEqual([0, 1]);
  });
  it('names unlabeled stanzas with the word it is given', () => {
    const two = parseSong('a\n\nb', { stanzaWord: 'Part' });
    expect(two.stanzas.map((x) => x.label)).toEqual(['Part 1', 'Part 2']);
  });
  it('keeps a repeated line as two separate lines', () => {
    expect(s.lines[0].text).toBe(s.lines[4].text);
    expect(s.lines[0].n).not.toBe(s.lines[4].n);
  });
  it('survives empty, CRLF and stray whitespace input', () => {
    expect(parseSong('').lines).toEqual([]);
    expect(parseSong(null).stanzas).toEqual([]);
    expect(parseSong('  a  b \r\n\r\n c ').lines.map((l) => l.text)).toEqual(['a b', 'c']);
  });
});

describe('buildSteps', () => {
  const s = parseSong(TEXT);
  it('forward walks the whole song top to bottom exactly once', () => {
    const st = buildSteps(s);
    expect(st.map((x) => x.answer.n)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(st[0].edge).toBe('start');
    expect(st[1].edge).toBeNull();
    expect(st.every((x) => x.dir === 'next')).toBe(true);
    expect(st[3].above.map((l) => l.n)).toEqual([0, 1, 2]);
  });
  it('backward walks bottom to top, asking for the line BEFORE the one shown', () => {
    const st = buildSteps(s, { mode: 'backward' });
    expect(st.map((x) => x.answer.n)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(st[0].edge).toBe('end');
    expect(st[2].below.map((l) => l.n)).toEqual([4, 5]);
    expect(st.every((x) => x.dir === 'prev')).toBe(true);
  });
  it('a stanza scope never leaks lines from outside it', () => {
    const st = buildSteps(s, { stanza: 1 });
    expect(st.map((x) => x.answer.n)).toEqual([4, 5]);
    expect(st[1].above.map((l) => l.n)).toEqual([4]);
    expect(buildSteps(s, { stanza: 9 })).toEqual([]);
  });
  it('shuffle covers every line once and is repeatable for a seed', () => {
    const a = buildSteps(s, { mode: 'shuffle', seed: 7 });
    const b = buildSteps(s, { mode: 'shuffle', seed: 7 });
    expect(a.map((x) => x.answer.n).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(a.map((x) => x.answer.n)).toEqual(b.map((x) => x.answer.n));
    for (const x of a) {
      if (x.dir === 'next') expect(x.edge).toBe(x.answer.n === 0 ? 'start' : null);
      else expect(x.edge).toBe(x.answer.n === 5 ? 'end' : null);
    }
  });
  it('an empty song has no steps', () => {
    expect(buildSteps(parseSong(''))).toEqual([]);
  });
});

describe('hints', () => {
  it('initials keep the first letter and punctuation, blank the rest', () => {
    expect(hintInitials('Twinkle, twinkle, little star,')).toBe('T______, t______, l_____ s___,');
    expect(hintInitials('"Hello" world')).toBe('"H____" w____');
  });
  it('gives the first word, then initials, then nothing more', () => {
    expect(hintAt(1, 'How I wonder')).toBe('How …');
    expect(hintAt(2, 'How I wonder')).toBe('H__ I w_____');
    expect(hintAt(3, 'How I wonder')).toBeNull();
  });
});

describe("built-in Airman's Creed", () => {
  const c = parseSong(AIRMANS_CREED, { stanzaWord: 'Part' });
  it('parses to four parts of 3, 5, 5 and 5 lines', () => {
    expect(c.stanzas.map((s) => s.lines.length)).toEqual([3, 5, 5, 5]);
    expect(c.stanzas[3].label).toBe('Part 4');
  });
  it('opens and closes on the right lines', () => {
    expect(c.lines[0].text).toBe('I am an American Airman.');
    expect(c.lines.at(-1).text).toBe('And I will not fail.');
  });
});
