// Curriculum + drill-assembly tests.
//
// The coverage half duplicates `npm run afoqt:coverage` on purpose: the CLI is what you run
// while authoring, but `npm test` is what runs in CI, and Doctrine rule 2 is too important to
// live only in a script someone has to remember to invoke.

import { describe, it, expect } from 'vitest';
import '../../templates';
import { allTemplates, templatesFor } from '../generator';
import { CHAPTERS, TRACKS, chapterForConcept, isUnlocked, getChapter } from '../../curriculum/chapters';
import { LESSONS } from '../../curriculum/lessons';
import { assembleDrill, drawFromMissPool } from '../drill';
import { mulberry32 } from '../../../engine/rng';
import { defaultProgress, applyAnswer, recordTestOut, isChapterDone, chapterState } from '../../afoqtStorage';

const templates = allTemplates();
const conceptsTested = new Set(templates.flatMap((t) => t.concepts ?? []));

describe('curriculum coverage (Doctrine rule 2)', () => {
  it.each(CHAPTERS.map((c) => [c.id, c]))('%s teaches nothing that no question tests', (_id, ch) => {
    const orphans = ch.concepts.filter((c) => !conceptsTested.has(c));
    expect(orphans, `orphan concepts in ${ch.id}: ${orphans.join(', ')}`).toEqual([]);
  });

  it('every concept a template tests is taught by some chapter', () => {
    const untaught = [...conceptsTested].filter((c) => !chapterForConcept(c));
    expect(untaught, `untaught: ${untaught.join(', ')}`).toEqual([]);
  });

  it('a concept belongs to exactly one chapter', () => {
    const counts = {};
    for (const ch of CHAPTERS) for (const c of ch.concepts) counts[c] = (counts[c] ?? 0) + 1;
    expect(Object.entries(counts).filter(([, n]) => n > 1)).toEqual([]);
  });

  it('every chapter can fill its own test-out gate without repeating a template', () => {
    for (const ch of CHAPTERS) {
      const pool = templatesFor(ch.subtest)
        .filter((t) => ch.concepts.some((c) => t.concepts.includes(c)) && ch.bands.includes(t.band));
      expect(pool.length, `${ch.id} has ${pool.length} in-band templates`).toBeGreaterThanOrEqual(5);
    }
  });

  it('every chapter has a lesson and a track', () => {
    const trackIds = new Set(TRACKS.map((t) => t.id));
    for (const ch of CHAPTERS) {
      expect(LESSONS[ch.id], `${ch.id} has no lesson`).toBeTruthy();
      expect(LESSONS[ch.id].length, `${ch.id} lesson is a stub`).toBeGreaterThan(500);
      expect(trackIds.has(ch.track)).toBe(true);
    }
  });

  it('prerequisites exist and contain no cycles', () => {
    const ids = new Set(CHAPTERS.map((c) => c.id));
    for (const ch of CHAPTERS) for (const p of ch.prereqs) expect(ids.has(p), `${ch.id} -> ${p}`).toBe(true);

    const walk = (id, path) => {
      expect(path.includes(id), `cycle: ${[...path, id].join(' -> ')}`).toBe(false);
      for (const p of getChapter(id).prereqs) walk(p, [...path, id]);
    };
    for (const ch of CHAPTERS) walk(ch.id, []);
  });

  it('at least one chapter is unlocked on a fresh profile', () => {
    const p = defaultProgress();
    expect(CHAPTERS.filter((c) => isUnlocked(c, p.chapters)).length).toBeGreaterThan(0);
  });

  // Trey named geometry as his weakest area, so those chapters must not be skippable on a
  // lucky 4 out of 5. This is a real requirement, not a styling choice.
  it('the geometry chapters demand a clean test-out sweep', () => {
    for (const ch of CHAPTERS.filter((c) => c.title.startsWith('Geometry'))) {
      expect(ch.testOutPass, `${ch.id}`).toBe(5);
    }
  });
});

describe('chapter-scoped drills', () => {
  const chapter = getChapter('mk-09-geometry-foundations');

  it('only draws questions the chapter actually teaches', () => {
    const qs = assembleDrill({
      subtest: 'MK', count: 12, rng: mulberry32(11), concepts: chapter.concepts, bands: chapter.bands,
    });
    expect(qs.length).toBe(12);
    for (const q of qs) {
      expect(q.concepts.some((c) => chapter.concepts.includes(c)), `${q.templateId} is out of scope`).toBe(true);
      expect(chapter.bands).toContain(q.band);
    }
  });

  // The gate that produced this test asked two isosceles questions out of five and never
  // asked about the transversal, which is not a valid test of the chapter.
  it('deals distinct templates before repeating any', () => {
    for (let seed = 1; seed < 30; seed++) {
      const qs = assembleDrill({
        subtest: 'MK', count: 5, rng: mulberry32(seed), concepts: chapter.concepts, bands: chapter.bands,
      });
      expect(new Set(qs.map((q) => q.templateId)).size, `seed ${seed} repeated a template`).toBe(5);
    }
  });

  it('never mixes bank items into a chapter drill', () => {
    const qs = assembleDrill({
      subtest: 'MK', count: 10, rng: mulberry32(3), concepts: chapter.concepts, bands: chapter.bands,
    });
    // Bank items have no templateId; a chapter drill must be entirely traceable to templates.
    for (const q of qs) expect(q.templateId).toBeTruthy();
  });
});

describe('miss pool (requirement 12)', () => {
  const withMisses = () => {
    let p = defaultProgress();
    for (const id of ['mk-factor-ac', 'mk-quadratic-formula', 'mk-arc-sector']) {
      p = applyAnswer(p, { templateId: id, seed: 42, correct: false, elapsedMs: 5000 });
    }
    return p;
  };

  it('captures a wrong answer and can replay the exact instance', () => {
    const p = withMisses();
    expect(Object.keys(p.missPool)).toContain('mk-factor-ac');
    const drawn = drawFromMissPool(p, 'MK', 20, mulberry32(5));
    const exact = drawn.filter((q) => q.missFlavour === 'exact');
    expect(exact.length, 'no exact replays offered').toBeGreaterThan(0);
    for (const q of exact) expect(q.seed).toBe(42);
  });

  it('offers fresh siblings as well as exact replays', () => {
    const drawn = drawFromMissPool(withMisses(), 'MK', 40, mulberry32(9));
    expect(drawn.filter((q) => q.missFlavour === 'sibling').length).toBeGreaterThan(0);
  });

  it('injects roughly a tenth of a drill, not more', () => {
    const qs = assembleDrill({ subtest: 'MK', count: 20, rng: mulberry32(7), progress: withMisses() });
    const injected = qs.filter((q) => q.fromMissPool).length;
    expect(injected).toBe(2);
    expect(qs.length).toBe(20);
  });

  it('is ignored entirely when the run has to be an honest baseline', () => {
    const qs = assembleDrill({
      subtest: 'MK', count: 20, rng: mulberry32(7), progress: withMisses(), ignoreMissPool: true,
    });
    expect(qs.filter((q) => q.fromMissPool).length).toBe(0);
  });

  it('only resurfaces templates from the subtest being drilled', () => {
    expect(drawFromMissPool(withMisses(), 'WK', 10, mulberry32(2))).toEqual([]);
  });
});

describe('chapter progress', () => {
  it('a passing gate completes the chapter and skips the lesson', () => {
    const ch = getChapter('mk-01-fluency');
    const p = recordTestOut(defaultProgress(), ch.id, { correct: 4, total: 5, pass: ch.testOutPass });
    expect(isChapterDone(p, ch.id)).toBe(true);
    expect(chapterState(p, ch.id).testedOut).toBe(true);
  });

  it('a 4/5 does NOT clear a geometry chapter', () => {
    const ch = getChapter('mk-09-geometry-foundations');
    const p = recordTestOut(defaultProgress(), ch.id, { correct: 4, total: 5, pass: ch.testOutPass });
    expect(isChapterDone(p, ch.id)).toBe(false);
    expect(chapterState(p, ch.id).status).toBe('reading');
  });

  it('completing a prerequisite unlocks what depends on it', () => {
    const ch10 = getChapter('mk-10-geometry-measurement');
    expect(isUnlocked(ch10, defaultProgress().chapters)).toBe(false);
    const p = recordTestOut(defaultProgress(), 'mk-09-geometry-foundations', { correct: 5, total: 5, pass: 5 });
    expect(isUnlocked(ch10, p.chapters)).toBe(true);
  });
});
