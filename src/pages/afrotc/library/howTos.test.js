// Every how-to step must point at something that really exists on the site: a hosted publication and a paragraph
// or page that is actually in its text. A citation that resolves to nothing is a how-to built on a guess.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { HOWTOS, HOWTO_LEVELS, howToBySlug } from './howTos.js';
import { PUBS, PUB_CATEGORIES } from './pubCatalog.js';
import status from './pubStatus.json';

const ROOT = path.resolve(__dirname, '../../../..');
const loaded = new Map();
const pubText = (slug) => {
  if (!loaded.has(slug)) loaded.set(slug, JSON.parse(fs.readFileSync(path.join(ROOT, 'public/afrotc/pubs', `${slug}.json`), 'utf8')));
  return loaded.get(slug);
};

const allCites = () => HOWTOS.flatMap((h) => [
  ...(h.llab ? [{ h, c: { pub: h.llab.pub, para: h.llab.para } }] : []),
  ...h.roles.flatMap((r) => r.steps.flatMap((s) => (s.cite ?? []).map((c) => ({ h, c })))),
  ...[...(h.local ?? []), ...(h.notes ?? [])].flatMap((n) => (n.cite ?? []).map((c) => ({ h, c }))),
]);

describe('how-to citations', () => {
  it('every publication citation is to a hosted publication, and the paragraph or page is in its text', () => {
    const bad = [];
    for (const { h, c } of allCites()) {
      if (!c.pub) continue;
      if (!status[c.pub]) { bad.push(`${h.slug}: ${c.pub} is not hosted`); continue; }
      const { sections, pages } = pubText(c.pub);
      if (c.para && !sections.some((s) => s.para === c.para)) bad.push(`${h.slug}: ${c.pub} has no para ${c.para}`);
      if (c.page && (c.page < 1 || c.page > pages)) bad.push(`${h.slug}: ${c.pub} has no page ${c.page}`);
    }
    expect(bad).toEqual([]);
  });

  it('every step cites at least one source', () => {
    const bare = HOWTOS.flatMap((h) => h.roles.flatMap((r) => r.steps.filter((s) => !s.cite?.length).map((s) => `${h.slug} / ${r.role}: ${s.do.slice(0, 40)}`)));
    expect(bare).toEqual([]);
  });

  it('cross-references between how-tos resolve, and other-tab citations name a real tab', () => {
    const refs = HOWTOS.flatMap((h) => h.roles.flatMap((r) => r.steps.filter((s) => s.ref).map((s) => s.ref)));
    refs.forEach((r) => expect(howToBySlug(r), r).toBeTruthy());
    allCites().filter(({ c }) => c.doc).forEach(({ c }) => expect(c.doc).toBe('handbook'));
  });

  it('has simple, middle and full procedures, including the three Trey named', () => {
    const levels = new Set(HOWTOS.map((h) => h.level));
    HOWTO_LEVELS.forEach((l) => expect(levels.has(l.id), l.id).toBe(true));
    ['fall-in', 'reveille', 'retreat', 'ori'].forEach((s) => expect(howToBySlug(s), s).toBeTruthy());
    expect(howToBySlug('reveille').roles.length).toBeGreaterThan(1);
    expect(howToBySlug('retreat').roles.length).toBeGreaterThan(1);
  });
});

describe('publication catalog', () => {
  it('has unique slugs, a known category for each, and either a Drive file or a local copy', () => {
    expect(new Set(PUBS.map((p) => p.slug)).size).toBe(PUBS.length);
    const cats = new Set(PUB_CATEGORIES.map((c) => c.id));
    PUBS.forEach((p) => { expect(cats.has(p.category), p.slug).toBe(true); expect(Boolean(p.file || p.local), p.slug).toBe(true); });
  });

  it('every hosted publication has its PDF and its text on disk', () => {
    for (const [slug, s] of Object.entries(status)) {
      expect(fs.existsSync(path.join(ROOT, 'public', s.pdf)), `${slug} pdf`).toBe(true);
      expect(fs.existsSync(path.join(ROOT, 'public/afrotc/pubs', `${slug}.json`)), `${slug} json`).toBe(true);
    }
  });
});
