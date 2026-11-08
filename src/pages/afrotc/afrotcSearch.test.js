import { describe, it, expect } from 'vitest';
import { splitMarkdown, searchEntries, snippet, highlight, tokens } from './afrotcSearch.js';

const MD = [
  '# Handbook',
  'intro line',
  '## Air Force Major Commands',
  'ACC, AETC and AMC are major commands.',
  '```',
  '# not a heading',
  '```',
  '### Pacific Air Forces',
  'PACAF covers the Indo-Pacific.',
].join('\n');

describe('splitMarkdown', () => {
  const parts = splitMarkdown(MD);
  it('makes one entry per heading with its own line number', () => {
    expect(parts.map((p) => [p.title, p.line])).toEqual([['Handbook', 1], ['Air Force Major Commands', 3], ['Pacific Air Forces', 8]]);
  });
  it('ignores # inside a code fence', () => {
    expect(parts.some((p) => p.title === 'not a heading')).toBe(false);
    expect(parts[1].text).toContain('not a heading');
  });
  it('keeps the parent heading as the path', () => {
    expect(parts[2].where).toBe('Handbook › Air Force Major Commands');
  });
});

describe('searchEntries', () => {
  const entries = [
    { title: 'Air Force Major Commands', text: 'ACC, AETC, AMC', group: 'Handbook' },
    { title: 'Pacific Air Forces', text: 'PACAF covers the Indo-Pacific', group: 'Handbook' },
    { title: 'Creed', text: 'I am an American Airman.', group: 'Song' },
  ];
  it('requires every word', () => {
    expect(searchEntries(entries, 'pacaf indo').hits.map((e) => e.title)).toEqual(['Pacific Air Forces']);
    expect(searchEntries(entries, 'pacaf creed').total).toBe(0);
  });
  it('matches inside words and ignores case, curly quotes and accents', () => {
    expect(searchEntries(entries, 'AIRMAN').hits[0].title).toBe('Creed');
    expect(searchEntries([{ title: 'Airman’s Creed', text: '' }], "airman's").total).toBe(1);
    expect(searchEntries([{ title: 'Café', text: '' }], 'cafe').total).toBe(1);
  });
  it('ranks a title hit above a body hit', () => {
    const r = searchEntries([{ title: 'Other', text: 'mentions pacaf once' }, { title: 'PACAF', text: '' }], 'pacaf');
    expect(r.hits[0].title).toBe('PACAF');
  });
  it('returns nothing for an empty query', () => {
    expect(searchEntries(entries, '   ').total).toBe(0);
  });
});

describe('snippet and highlight', () => {
  it('centres on the first hit and marks every query word', () => {
    const long = `${'word '.repeat(80)}needle ${'tail '.repeat(80)}`;
    const parts = snippet(long, 'needle');
    expect(parts.find((p) => p.hit).t).toBe('needle');
    expect(parts.map((p) => p.t).join('').length).toBeLessThan(400);
  });
  it('highlights a repeated word everywhere', () => {
    expect(highlight('air and air', tokens('air')).filter((p) => p.hit)).toHaveLength(2);
  });
});
