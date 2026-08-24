// Block Counting (Phase 7).
//
// The subtest hangs on one rule and one presentation quirk, and both are the kind of thing
// that produces a generator which looks completely normal while training the wrong reflex.
// So each is asserted against the AFPC Form T pamphlet's own wording:
//
//   FACES, NOT CORNERS   "Blocks are considered touching only if all or part of their faces
//                         touch. Blocks that only touch corners do not count."
//   THE KEY MOVES        the five options are consecutive, but the window slides every
//                         question and can run descending
//   SEE INTO THE PILE    blocks you cannot see still count, so the pile must be inferable
//
// Two bugs this file exists to have caught:
//   1. A cube-lattice pile. It cannot represent the official worked example at all - S3 is
//      keyed at 7 in the Form S pamphlet and a lattice block tops out at 6 neighbours.
//   2. An answer position biased to the middle. Deriving the option window from an offset and
//      clamping it at 1 made C come up 38% more often than chance, handing back the very
//      guess-the-letter reflex that the shifting key exists to destroy.

import { describe, it, expect } from 'vitest';
import '../../templates';
import { templatesFor, generateInstance } from '../generator';
import { auditTemplate } from '../templateAudit';
import { assembleDrill } from '../drill';
import { mulberry32 } from '../../../engine/rng';
import { getChapter } from '../../curriculum/chapters';
import { LESSONS } from '../../curriculum/lessons';
import { getSubtest } from '../afoqtSpec';
import {
  makeBlock, contactArea, touching, cornerTouching, touchCount, touchBreakdown,
  buildPile, labelAnchor, visibleBlocks, NUMBERED_PER_PILE, LENGTHS,
} from '../blocks';

const templates = templatesFor('BC');
const SEEDS = Array.from({ length: 120 }, (_, i) => i * 7919 + 3);

describe('the touching rule', () => {
  const unit = makeBlock(1, 0, 0, 0, 1, 1, 1);

  it('counts a shared face', () => {
    expect(touching(unit, makeBlock(2, 1, 0, 0, 1, 1, 1))).toBe(true);
  });

  it('counts PART of a face - "all or part of their faces touch"', () => {
    expect(contactArea(unit, makeBlock(2, 0, 0, 1, 3, 1, 1))).toBe(1);
  });

  it('does NOT count an edge, which shares only a line', () => {
    const edgeOn = makeBlock(2, 1, 1, 0, 1, 1, 1);
    expect(touching(unit, edgeOn)).toBe(false);
    expect(cornerTouching(unit, edgeOn)).toBe(true);
  });

  it('does NOT count a corner, which shares only a point', () => {
    const cornerOn = makeBlock(2, 1, 1, 1, 1, 1, 1);
    expect(touching(unit, cornerOn)).toBe(false);
    expect(cornerTouching(unit, cornerOn)).toBe(true);
  });

  it('does not count blocks that are simply apart', () => {
    expect(touching(unit, makeBlock(2, 3, 0, 0, 1, 1, 1))).toBe(false);
    expect(cornerTouching(unit, makeBlock(2, 3, 0, 0, 1, 1, 1))).toBe(false);
  });
});

describe("the pamphlet's own worked sample", () => {
  // S3, reconstructed from the Form T directions: crossed layers, block length 2.
  // This is the ONLY arrangement that gives both "two below" and diagonals that touch at a
  // corner - in a running-bond wall the diagonals do not touch at all, which would make the
  // official warning vacuous. That is how the pile geometry was identified.
  const S3 = makeBlock(100, 0, 0, 1, 2, 1, 1);
  const around = [
    makeBlock(101, 0, 0, 2, 1, 2, 1), makeBlock(102, 1, 0, 2, 1, 2, 1),   // two above
    makeBlock(103, 0, 0, 0, 1, 2, 1), makeBlock(104, 1, 0, 0, 1, 2, 1),   // two below
    makeBlock(105, 0, -1, 1, 2, 1, 1), makeBlock(106, 0, 1, 1, 2, 1, 1),  // left and right
    makeBlock(107, -1, 0, 0, 1, 2, 1), makeBlock(108, 2, 0, 0, 1, 2, 1),  // diagonally below
  ];
  const pile = [S3, ...around];

  it('answers SIX, exactly as the Air Force keys it', () => {
    expect(touchCount(pile, 100)).toBe(6);
  });

  it('excludes both diagonals below, which touch only at a corner', () => {
    expect(cornerTouching(S3, around[6])).toBe(true);
    expect(cornerTouching(S3, around[7])).toBe(true);
  });

  it('would answer 8 if corners were counted - the mistake being trained against', () => {
    expect(touchCount(pile, 100) + 2).toBe(8);
  });

  it('breaks the count down the way the directions narrate it', () => {
    expect(touchBreakdown(pile, 100)).toMatchObject({ above: 2, below: 2, beside: 2, corner: 2, total: 6 });
  });
});

describe('a block can touch MORE than six others', () => {
  // 🔴 The trap. An axis-aligned lattice of cubes gives one neighbour per direction and six
  // in total, so it cannot even represent the Form S sample - "three blocks above, three
  // blocks below, and one block on the right", keyed at 7.
  const crossed = [makeBlock(200, 0, 0, 1, 3, 1, 1), makeBlock(500, 3, 0, 1, 3, 1, 1)];
  for (let i = 0; i < 3; i++) {
    crossed.push(makeBlock(300 + i, i, 0, 2, 1, 3, 1));
    crossed.push(makeBlock(400 + i, i, 0, 0, 1, 3, 1));
  }

  it('reproduces the Form S sample of 7', () => {
    expect(touchCount(crossed, 200)).toBe(7);
  });

  it('is therefore not representable as a lattice of cubes', () => {
    expect(touchCount(crossed, 200)).toBeGreaterThan(6);
  });
});

describe('every generated pile', () => {
  const piles = SEEDS.map((s) => ({ s, p: buildPile(s) }));

  it('builds for every seed', () => {
    for (const { s, p } of piles) expect(p, `seed ${s}`).not.toBeNull();
  });

  it('is deterministic - the same seed is the same pile forever', () => {
    for (const { s, p } of piles.slice(0, 20)) {
      expect(JSON.stringify(buildPile(s).blocks)).toBe(JSON.stringify(p.blocks));
    }
  });

  it('uses one block size throughout - "the same size and shape"', () => {
    for (const { s, p } of piles) {
      const shapes = new Set(p.blocks.map((b) => [b.dx, b.dy, b.dz].sort().join('x')));
      expect(shapes.size, `seed ${s}`).toBe(1);
      const len = Math.max(...p.blocks.map((b) => Math.max(b.dx, b.dy, b.dz)));
      expect(LENGTHS, `seed ${s}`).toContain(len);
    }
  });

  it('never floats a block, and never hides a gap under one', () => {
    // Fairness, not tidiness: hidden blocks only count as practice if a candidate can deduce
    // them. Every block above the ground is fully supported, so the layers below are solid
    // and inferable - there is no cavity you would have to guess at.
    for (const { s, p } of piles) {
      for (const b of p.blocks) {
        if (b.z === 0) continue;
        const under = p.blocks
          .filter((o) => o.z + o.dz === b.z)
          .reduce((a, o) => a + contactArea(b, o), 0);
        expect(under, `seed ${s} block ${b.id}`).toBe(b.dx * b.dy);
      }
    }
  });

  it('numbers exactly six blocks, and every one of them can be seen', () => {
    for (const { s, p } of piles) {
      expect(p.numbered, `seed ${s}`).toHaveLength(NUMBERED_PER_PILE);
      for (const n of p.numbered) {
        expect(labelAnchor(p.blocks, n.blockId), `seed ${s} label ${n.label}`).not.toBeNull();
      }
      expect(new Set(p.numbered.map((n) => n.label))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    }
  });

  it('keeps every numbered block inside a sane answer range', () => {
    for (const { s, p } of piles) {
      for (const n of p.numbered) {
        const c = touchCount(p.blocks, n.blockId);
        expect(c, `seed ${s} label ${n.label}`).toBeGreaterThanOrEqual(2);
        expect(c, `seed ${s} label ${n.label}`).toBeLessThanOrEqual(9);
      }
    }
  });

  it('draws at least eight blocks and shows a good share of them', () => {
    for (const { s, p } of piles) {
      expect(p.blocks.length, `seed ${s}`).toBeGreaterThanOrEqual(8);
      expect(visibleBlocks(p.blocks).length, `seed ${s}`).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('the answer key', () => {
  const items = Array.from({ length: 1200 }, (_, i) => generateInstance('bc-count', i * 7919)).filter(Boolean);

  it('always offers five consecutive integers', () => {
    for (const q of items) {
      const nums = q.choices.map(Number);
      const step = nums[1] - nums[0];
      expect(Math.abs(step)).toBe(1);
      for (let i = 1; i < nums.length; i++) expect(nums[i] - nums[i - 1]).toBe(step);
    }
  });

  it('never shows a zero or a negative option', () => {
    for (const q of items) expect(Math.min(...q.choices.map(Number))).toBeGreaterThanOrEqual(1);
  });

  it('SHIFTS the window, so no count keeps a fixed letter', () => {
    // The point of the whole quirk: find one count that appears under several letters.
    const lettersFor = new Map();
    for (const q of items) {
      const answer = q.choices[q.correctIndex];
      if (!lettersFor.has(answer)) lettersFor.set(answer, new Set());
      lettersFor.get(answer).add(q.correctIndex);
    }
    const spread = [...lettersFor.values()].map((s) => s.size);
    expect(Math.max(...spread)).toBeGreaterThanOrEqual(4);
  });

  it('runs DESCENDING a real share of the time', () => {
    const desc = items.filter((q) => Number(q.choices[0]) > Number(q.choices[1])).length;
    const share = desc / items.length;
    expect(share).toBeGreaterThan(0.15);
    expect(share).toBeLessThan(0.35);
  });

  it('does not park the answer on one letter', () => {
    // Not uniform, and honestly so: a count of 3 cannot sit in the fifth slot without
    // printing a zero, and real counts cluster low. What matters is that no letter runs away
    // with it - the middle-bias bug had C at nearly twice E.
    const counts = [0, 0, 0, 0, 0];
    for (const q of items) counts[q.correctIndex]++;
    const expected = items.length / 5;
    for (const c of counts) {
      expect(c).toBeGreaterThan(expected * 0.55);
      expect(c).toBeLessThan(expected * 1.45);
    }
  });

  it('marks an option that really is the number of touching blocks', () => {
    // Re-derive from the figure rather than trusting the generator's own index.
    for (const q of items.slice(0, 300)) {
      const pile = buildPile(q.render.sheetSeed);
      const target = pile.numbered.find((n) => n.label === q.render.highlight);
      expect(Number(q.choices[q.correctIndex])).toBe(touchCount(pile.blocks, target.blockId));
    }
  });
});

describe('every Block Counting template', () => {
  it('registered five of them across bands 1-4', () => {
    expect(templates).toHaveLength(5);
    expect([...new Set(templates.map((t) => t.band))].sort()).toEqual([1, 2, 3, 4]);
  });

  it.each(templates.map((t) => [t.id, t]))('%s holds the structural contract', (_id, t) => {
    expect(auditTemplate(t, { samples: 600 }).problems).toEqual([]);
  });

  it('offers five options and ships a pile with every question', () => {
    expect(getSubtest('BC').choices).toBe(5);
    for (const t of templates) {
      for (let seed = 0; seed < 40; seed++) {
        const q = generateInstance(t.id, seed);
        expect(q.choices, t.id).toHaveLength(5);
        expect(q.render.kind, t.id).toBe('blockpile');
        expect(q.render.highlight, t.id).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('keeps the technique drills out of any exam run', () => {
    const qs = assembleDrill({ subtest: 'BC', count: 30, rng: mulberry32(11), exam: true });
    expect(new Set(qs.map((q) => q.templateId))).toEqual(new Set(['bc-count']));
  });

  it('runs a short drill off ONE pile, as the real figure does', () => {
    const qs = assembleDrill({ subtest: 'BC', count: NUMBERED_PER_PILE, rng: mulberry32(5), exam: true });
    expect(new Set(qs.map((q) => q.render.sheetSeed)).size).toBe(1);
  });

  it('rotates to a fresh pile rather than repeating itself over a full subtest', () => {
    // 🔴 The bug this locks down: one pile numbers six blocks, so a 30-question exam built on
    // a single figure asked SIX questions and repeated the other 24 - a quarter of an hour of
    // "practice" that was really six items. Nothing structural could see it, because every
    // individual question was perfectly well formed.
    // Across many runs, not one: the first fix passed on rng seed 42 and still duplicated on
    // seed 5, because it was leaving block choice to chance and retrying on collision.
    for (let s = 1; s <= 25; s++) {
      const qs = assembleDrill({ subtest: 'BC', count: 30, rng: mulberry32(s), exam: true });
      expect(qs, `rng ${s}`).toHaveLength(30);

      const items = qs.map((q) => `${q.render.sheetSeed}:${q.render.highlight}`);
      expect(new Set(items).size, `rng ${s}: 30 questions must be 30 different questions`).toBe(30);

      // "One pile image serves 5-13 numbered questions" - so a 30-question subtest runs on
      // several piles, not one and not thirty.
      const figures = new Set(qs.map((q) => q.render.sheetSeed)).size;
      expect(figures, `rng ${s}`).toBeGreaterThanOrEqual(3);
      expect(figures, `rng ${s}`).toBeLessThanOrEqual(6);

      // And the questions on one pile must come TOGETHER. The queue is shuffled to mix in
      // miss-pool items, which scattered the piles so badly that the drill jumped to a new
      // drawing almost every question - 30 re-orientations instead of 5.
      const runs = qs.map((q) => q.render.sheetSeed)
        .filter((v, i, a) => i === 0 || v !== a[i - 1]).length;
      expect(runs, `rng ${s}: piles must be contiguous, not interleaved`).toBe(figures);
    }
  });
});

describe('the Block Counting chapter', () => {
  const ch = getChapter('bc-01-block-counting');

  it('exists, needs a clean sweep, and teaches what it tests', () => {
    expect(ch).toBeTruthy();
    expect(ch.testOutPass).toBe(5);
    const tested = new Set(templates.flatMap((t) => t.concepts));
    for (const c of ch.concepts) expect(tested.has(c), `${c} is taught but untested`).toBe(true);
  });

  it('leads with the corner rule and warns that the key moves', () => {
    const lesson = LESSONS['bc-01-block-counting'];
    expect(lesson.length).toBeGreaterThan(2000);
    // Flattened, because the quotes are wrapped across blockquote lines and a naive match
    // silently passes or fails on where the line happens to break. The \r has to go first:
    // on a CRLF checkout it survives the \n replace and lands inside the very phrases below,
    // so the whole assertion fails on Windows and passes everywhere else.
    const flat = lesson.replace(/\r/g, '').replace(/\n>?[ \t]*/g, ' ').replace(/[ \t]+/g, ' ');
    expect(flat).toMatch(/only touch corners do not count/);
    expect(flat).toMatch(/Six, not eight/);
    expect(flat).toMatch(/descending/);
  });
});
