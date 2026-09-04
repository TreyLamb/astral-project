import { describe, it, expect } from 'vitest';
import '../../templates/index.js';
import { assembleDrill } from '../drill.js';
import { CHAPTERS, getChapter } from '../../curriculum/chapters.js';
import { mulberry32 } from '../../../engine/rng.js';

/**
 * A drill must not ask the SAME question twice in one sitting. "Same" means the same item on the
 * same figure - not the same stem text, which legitimately repeats across figures (the real
 * Reading Comprehension subtest reuses "The author would most likely agree that:" constantly,
 * and "how many blocks does block 2 touch" is a different question on a different pile).
 *
 * `buildDrill` used to key its dedup on the numeric run-sheet rather than the figure the
 * instance actually rendered. Every template in a run shares that number but maps it to its own
 * figure, so two genuinely different questions collided, the retry loop exhausted, and a REAL
 * duplicate shipped. `rc-02-main-idea` repeated in 300 of 300 five-question gates.
 */
// Exact item identity: the whole figure plus the stem. Note this is deliberately STRICTER than
// what buildDrill keys on - a subtest with no shared sheet (Instrument Comprehension) carries no
// `sheetSeed` at all, and its identity is entirely in the dial values inside `render`.
const itemKey = (q) => `${JSON.stringify(q.render ?? null)}::${q.stem}`;

describe('a test-out gate never repeats an item', () => {
  // The gate is what this protects: 5 questions, chapter-scoped, deciding whether a chapter is
  // skipped entirely. A repeat there both wastes a slot and inflates the score.
  const gated = CHAPTERS.filter((c) => c.testOutPass);

  it('covers a substantial number of chapters (anti-vacuity guard)', () => {
    expect(gated.length).toBeGreaterThan(50);
  });

  // What is actually guaranteed, and why it is not "never repeats, ever":
  //
  // Some chapters have a genuinely BOUNDED item space, declared honestly via `stemSpace` rather
  // than pretended away. Measured totals: ic-01-instruments = 102 items (8 headings x 3 pitches
  // x 5 banks), wk-01-method = 121, and a bc-01-block-counting gate is confined to a single pile
  // of exactly 6 numbered blocks by `sheetSpan`. Drawing 5 from spaces that small will
  // occasionally collide no matter how good the selection is - that is coupon-collecting in a
  // declared space, not a defect.
  //
  // So the contract is: a gate never COLLAPSES. Measured over 200 seeds, only two chapters ever
  // dip below 5 distinct and their worst case is 3 - `bc-01-block-counting` (a gate is confined
  // to one pile of exactly 6 numbered blocks by sheetSpan) and `wk-01-method`. Everything else
  // is a clean 5 of 5. `rc-02-main-idea` used to return 2 distinct on EVERY seed, which is the
  // collapse this guards against coming back.
  it('no chapter gate collapses below 3 of 5, across 50 seeds', () => {
    const broken = [];
    for (const ch of gated) {
      for (let r = 0; r < 50; r++) {
        const q = assembleDrill({
          subtest: ch.subtest, count: 5, rng: mulberry32(r * 7919 + 1),
          concepts: ch.concepts, bands: ch.bands, ignoreMissPool: true,
        });
        if (q.length === 0) break; // chapter with no reachable content is a different concern
        const distinct = new Set(q.map(itemKey)).size;
        if (distinct < q.length - 2) { broken.push(`${ch.id} seed ${r}: ${distinct}/${q.length}`); break; }
      }
    }
    expect(broken, `chapter gates collapsing to repeats: ${broken.join(', ')}`).toEqual([]);
  });
});

describe('the specific regression: rc-02-main-idea', () => {
  it('pools two once-per-passage concepts and still fills a gate without repeating', () => {
    const ch = getChapter('rc-02-main-idea');
    for (let r = 0; r < 300; r++) {
      const q = assembleDrill({
        subtest: 'RC', count: 5, rng: mulberry32(r * 7919 + 1),
        concepts: ch.concepts, bands: ch.bands, ignoreMissPool: true,
      });
      expect(new Set(q.map(itemKey)).size, `seed ${r} repeated an item`).toBe(q.length);
    }
  });

  it('stem TEXT is still allowed to repeat across different passages', () => {
    // Guards the fix from being "corrected" back into stem-only dedup, which would suppress
    // legitimate questions rather than duplicates.
    const ch = getChapter('rc-02-main-idea');
    let sawSharedStemOnDifferentPassages = false;
    for (let r = 0; r < 200 && !sawSharedStemOnDifferentPassages; r++) {
      const q = assembleDrill({
        subtest: 'RC', count: 10, rng: mulberry32(r * 7919 + 1),
        concepts: ch.concepts, bands: ch.bands, ignoreMissPool: true,
      });
      const byStem = new Map();
      for (const x of q) {
        const set = byStem.get(x.stem) ?? new Set();
        set.add(x.render?.sheetSeed);
        byStem.set(x.stem, set);
      }
      if ([...byStem.values()].some((s) => s.size > 1)) sawSharedStemOnDifferentPassages = true;
    }
    expect(sawSharedStemOnDifferentPassages).toBe(true);
  });
});

describe('a full-length exam run does not repeat an item', () => {
  // Eight of the eleven subtests can fill a real full-length run with ZERO repeats and are held
  // to exactly that. Instrument Comprehension is in this list only because of the askedKey fix -
  // its stem is identical on every question and it carries no sheetSeed, so keying on stem alone
  // made every question look like a duplicate, all retries failed, and dedup silently never ran.
  // It scored min 17 of 25 before, and 25 of 25 after.
  it('is exact for every subtest whose item space allows it', () => {
    for (const [code, count] of [
      ['IC', 25], ['TR', 40], ['BC', 30], ['RC', 25], ['VA', 25], ['MK', 25], ['AI', 20], ['AR', 25],
      // SJ joined this list on 2026-09-04 - see the note below.
      ['SJ', 50],
    ]) {
      for (let r = 0; r < 60; r++) {
        const q = assembleDrill({ subtest: code, count, rng: mulberry32(r * 104729 + 3), exam: true });
        const distinct = new Set(q.map(itemKey)).size;
        expect(distinct, `${code} seed ${r} repeated: ${distinct}/${q.length}`).toBe(q.length);
      }
    }
  });

  // The remaining three are limited by how much CONTENT exists, not by selection. These floors
  // are measured minimums over 200 seeds, recorded so a regression is visible - not targets to
  // relax when one drifts. Raising them means authoring more content, nothing else.
  //   Word Knowledge      580 stems, but split across per-band pools -> min 23 of 25
  //   Physical Science    532 facts                                  -> min 19 of 20
  //
  // SITUATIONAL JUDGMENT WAS HERE, at "60 items total, and the subtest asks 50 -> min 31 of 50".
  // That floor was never really about content. Two separate defects were hiding under it, both
  // fixed 2026-09-04, and it now scores a clean 50 of 50 on every seed:
  //
  //   1. `scenarioTemplates()` builds per chapter+band and refuses a pool under 5, so of 63
  //      authored scenarios only the 36 at band 3 ever reached a template - bands 2 and 4 were
  //      registered, validated, coverage-clean and never asked. Fixed by pooling those bands
  //      across chapters (templates/sjt/ch99-pooled-bands.js), taking the reachable item count
  //      from 60 to 126.
  //   2. `askedKey()` prefixed the numeric run-sheet when an instance had no figure, which is a
  //      no-op for every non-sheet template but broke the one figure-less SHEET template there
  //      is. SJ draws its whole scenario from `h.sheetSeed`, so the same situation reached under
  //      two sheet values produced one stem under two keys - the duplicate was invisible and the
  //      repeat shipped.
  //
  // The lesson worth keeping: a "content floor" is a hypothesis until the selection path has been
  // measured. This one was recorded as a content limit and was a selection bug for both halves.
  it('degrades only as far as the content genuinely allows', () => {
    for (const [code, count, floor] of [['WK', 25, 23], ['PS', 20, 19]]) {
      for (let r = 0; r < 60; r++) {
        const q = assembleDrill({ subtest: code, count, rng: mulberry32(r * 104729 + 3), exam: true });
        const distinct = new Set(q.map(itemKey)).size;
        expect(distinct, `${code} seed ${r}: ${distinct}/${count}`).toBeGreaterThanOrEqual(floor);
      }
    }
  });
});
