// Pure data/search layer for the MMAHP combined reader. No React here on purpose - the view
// imports this for the chapter list and the search index, and it's the thing a test would import
// too. Chapter data itself is committed JSON built by scripts/buildMmahpReader.mjs (see that
// script's header for why the PDFs themselves never enter the repo).

import ch01 from './data/ch01.json';
import ch02 from './data/ch02.json';
import ch03 from './data/ch03.json';
import ch04 from './data/ch04.json';
import ch05 from './data/ch05.json';
import ch06 from './data/ch06.json';
import ch07 from './data/ch07.json';
import ch08 from './data/ch08.json';
import ch09 from './data/ch09.json';
import ch10 from './data/ch10.json';
import ch11 from './data/ch11.json';
import ch12 from './data/ch12.json';
import ch13 from './data/ch13.json';
import ch14 from './data/ch14.json';
import ch16 from './data/ch16.json';

// Chapter 15 does not exist in this course - MMAHP's own chapter list skips it (confirmed against
// the Canvas module listing, not a build gap).
export const ALL_CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch13, ch14, ch16];

export function getChapter(id) {
  return ALL_CHAPTERS.find((c) => c.id === id) ?? null;
}

/**
 * Flattens every chapter into searchable records - one per section's own prose, one per slide
 * group attached to a section. Built once and reused; the view memoizes it since ALL_CHAPTERS
 * never changes at runtime.
 */
export function buildSearchIndex() {
  const records = [];
  for (const ch of ALL_CHAPTERS) {
    for (const section of ch.sections) {
      const text = section.blocks.map((b) => b.text).join(' ');
      records.push({
        kind: 'text',
        chapterId: ch.id,
        chapterNumber: ch.number,
        chapterTitle: ch.title,
        sectionNumber: section.number,
        sectionHeading: section.heading,
        text,
      });
      for (const slide of section.slides) {
        if (!slide.bullets.length) continue;
        records.push({
          kind: 'slide',
          chapterId: ch.id,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          sectionNumber: section.number,
          sectionHeading: section.heading,
          slideTitle: slide.title,
          text: slide.bullets.join(' '),
        });
      }
      for (const os of section.openstax ?? []) {
        records.push({
          kind: 'openstax',
          chapterId: ch.id,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          sectionNumber: section.number,
          sectionHeading: section.heading,
          slideTitle: `OpenStax Ch ${os.chapterNumber} §${os.number} — ${os.heading}`,
          text: os.blocks.map((b) => b.text).join(' '),
        });
      }
    }
  }
  return records;
}

/**
 * Groups a section's flat block list into "runs" - a subheading plus every block under it, up to
 * the next subheading. Blocks before the first subheading form a headless leading run. This is
 * the unit the in-page filter search (below) keeps or hides as a whole, per Trey's own framing:
 * searching "protist" should keep "the section 'about' protists", not just the one paragraph that
 * happens to contain the word.
 */
export function groupIntoRuns(blocks) {
  const runs = [];
  let current = { heading: null, blocks: [] };
  for (const b of blocks) {
    if (b.type === 'subheading') {
      if (current.heading || current.blocks.length) runs.push(current);
      current = { heading: b.text, blocks: [] };
    } else {
      current.blocks.push(b);
    }
  }
  if (current.heading || current.blocks.length) runs.push(current);
  return runs;
}

/** Case-insensitive plain-text containment - the in-page filter is a literal match, not fuzzy. */
export function runMatchesQuery(run, query) {
  const q = query.toLowerCase();
  if (run.heading && run.heading.toLowerCase().includes(q)) return true;
  return run.blocks.some((b) => b.text.toLowerCase().includes(q));
}

/**
 * Same literal-match test for a lecture-slide box. Trey, 2026-09-18: "the powerpoints NEVER go
 * away so they are just always in the way even if they are unrelated" - slide boxes get the same
 * filter treatment as paragraph runs, not a free pass.
 */
export function slideMatchesQuery(slide, query) {
  const q = query.toLowerCase();
  if (slide.title && slide.title.toLowerCase().includes(q)) return true;
  return slide.bullets.some((b) => b.toLowerCase().includes(q));
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0, from = 0;
  const h = haystack.toLowerCase();
  while (true) {
    const i = h.indexOf(needle, from);
    if (i === -1) break;
    count++;
    from = i + needle.length;
  }
  return count;
}

/**
 * Total literal occurrences of `query` across every open chapter's blocks and slide bullets -
 * the number the in-page filter's status line reports, so "0 matches" is an explicit, visible
 * state rather than a page that just quietly collapses to nothing with no explanation.
 */
export function countFilterMatches(chapters, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let total = 0;
  for (const ch of chapters) {
    for (const s of ch.sections) {
      for (const b of s.blocks) total += countOccurrences(b.text, q);
      for (const slide of s.slides) {
        if (slide.title) total += countOccurrences(slide.title, q);
        for (const bullet of slide.bullets) total += countOccurrences(bullet, q);
      }
    }
  }
  return total;
}

const STOP = new Set(['a', 'an', 'the', 'of', 'and', 'or', 'in', 'to', 'is', 'are', 'for', 'on', 'with']);
function queryTerms(q) {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
}

/**
 * Global search, scoped to chapters NOT in `excludeChapterIds` - the point of "global search" here
 * is finding things in chapters the user hasn't opened, per Trey's own framing: "a global search
 * feature to search chapters i haven't highlighted specifically." Ranks by term-hit count, and a
 * heading/slide-title hit outranks a body-text hit at the same term count (it's a stronger, more
 * specific signal that the result is actually about the query, not just mentioning it in passing).
 */
export function searchChapters(index, query, excludeChapterIds = new Set(), limit = 30) {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  const scored = [];
  for (const rec of index) {
    if (excludeChapterIds.has(rec.chapterId)) continue;
    const haystack = (rec.text + ' ' + (rec.slideTitle || rec.sectionHeading || '')).toLowerCase();
    let hits = 0;
    for (const t of terms) if (haystack.includes(t)) hits++;
    if (!hits) continue;
    const titleHaystack = (rec.slideTitle || rec.sectionHeading || '').toLowerCase();
    const titleHits = terms.filter((t) => titleHaystack.includes(t)).length;
    scored.push({ rec, score: hits + titleHits * 2 });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.rec);
}

/** A short, term-centered excerpt for a search result card - never the whole section body. */
export function snippet(text, query, radius = 90) {
  const terms = queryTerms(query);
  const lower = text.toLowerCase();
  let idx = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (idx === -1 || i < idx)) idx = i;
  }
  if (idx === -1) return text.slice(0, radius * 2) + (text.length > radius * 2 ? '…' : '');
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}
