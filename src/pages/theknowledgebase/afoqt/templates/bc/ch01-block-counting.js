// Block Counting - 30 questions in 4.5 minutes, the tightest clock on the whole test at
// 9.0 seconds per question. It feeds CSO and ABM.
//
// The subtest is one skill repeated: given a numbered block in a pile, count how many other
// blocks touch its FACES. Two properties make it harder than that sounds, and both are
// reproduced here because a generator that skipped either would train the wrong reflex.
//
// 1. CORNER CONTACTS DO NOT COUNT, and the pile is built so that they exist. The pamphlet
//    works this out loud on its own sample S3 - two above, two below, one either side, and
//    two blocks "diagonally below it to the right or left" that touch only at a corner. Six,
//    not eight. See engine/blocks.js.
//
// 2. ⚠ THE ANSWER KEY SHIFTS RANGE EVERY QUESTION, AND CAN RUN DESCENDING. This is why the
//    options here are NOT shuffled - the ordering IS the item. The official Form T key for
//    five consecutive samples reads:
//        S1  1 2 3 4 5     S2  3 4 5 6 7     S3  5 6 7 8 9     S4  2 3 4 5 6     S5  2 3 4 5 6
//    and Barron's Test #1 keys block 23 as  A6 B5 C4 D3 E2, descending. So "4 is usually C"
//    is worth nothing, and a candidate who has drilled against a fixed key will read the
//    wrong letter under time pressure. Every instance re-rolls the window and the direction.
//
// Every template is `sheet: true`: one pile serves a whole run, exactly as one printed figure
// serves 5-13 numbered questions on the real test.

import { registerTemplate } from '../../engine/generator.js';
import {
  buildPile, touchCount, touchBreakdown, cornerInclusiveCount, visibleOnlyCount,
  NUMBERED_PER_PILE,
} from '../../engine/blocks.js';

/**
 * Five consecutive integers containing the answer, in a seeded window and direction.
 *
 * NOT shuffled, and deliberately so - see note 2 above. `h.choices` exists to randomise
 * option order, which is right for every other subtest and wrong for this one.
 */
function orderedSlate(correct, position, descending, labels) {
  // `position` is where the answer sits in the ASCENDING window, drawn uniformly over the
  // slots that keep the lowest option at 1 or more (the official keys never show a zero).
  //
  // ⚠ Deriving the window from an offset and then clamping - the obvious way - biased the
  // answer to the middle: a count of 3 clamped every offset above 2 down onto slot 2, so C
  // came up 38% more often than chance and E 38% less. That hands back exactly the reflex
  // this subtest's shifting key exists to destroy. Choose the slot, then build the window.
  const lo = correct - position;
  const values = [0, 1, 2, 3, 4].map((i) => lo + i);
  const ordered = descending ? [...values].reverse() : values;
  return {
    choices: ordered.map(String),
    correctIndex: ordered.indexOf(correct),
    errors: ordered.map((v) => labels.get(v)?.error ?? null),
    whys: ordered.map((v) => labels.get(v)?.why ?? null),
  };
}

/**
 * The two mistakes worth naming, mapped onto whichever option they happen to land on.
 *
 * Both are real, specific and repeatable, which is the standard a distractor has to meet
 * here. Any option they do not land on is simply a neighbouring count - and on this subtest
 * that is authentic, because the real key is always five consecutive integers.
 */
function errorLabels(pile, blockId, visibleIds) {
  const labels = new Map();
  const right = touchCount(pile, blockId);

  const withCorners = cornerInclusiveCount(pile, blockId);
  if (withCorners !== right) {
    labels.set(withCorners, {
      error: 'counted-corners',
      why: 'Counted blocks that meet this one only at a corner or along an edge. Faces only.',
    });
  }

  const visibleOnly = visibleOnlyCount(pile, blockId, visibleIds);
  if (visibleOnly !== right) {
    labels.set(visibleOnly, {
      error: 'missed-hidden',
      why: 'Counted only the blocks you can see and missed one hidden inside the pile.',
    });
  }
  return labels;
}

const describe = (b) => {
  const parts = [];
  if (b.above) parts.push(`${b.above} above`);
  if (b.below) parts.push(`${b.below} below`);
  if (b.beside) parts.push(`${b.beside} alongside`);
  return parts.join(', ');
};

/**
 * @param {object} cfg
 * @param {(ctx:{count:number,corner:number,hidden:number}) => boolean} cfg.want
 *        Which numbered blocks this band is about. Falls back to any numbered block when a
 *        particular pile has none matching, so a template never fails to emit.
 */
const countTemplate = ({ id, band, name, concepts, want, blurb, drillOnly }) =>
  registerTemplate({
    id,
    subtest: 'BC',
    // The figure itself is generated, not drawn from an authored list, so
    // `stemSpace` here counts questions PER FIGURE and the subtest total is unbounded.
    generatedFigure: true,
    band,
    name,
    concepts,
    sheet: true,
    // One pile, six numbered blocks, then a fresh pile - which is what the real test does
    // ("one pile image serves 5-13 numbered questions"). Without this a 30-question run asked
    // six questions and repeated the rest.
    sheetSpan: NUMBERED_PER_PILE,
    drillOnly,
    // Declared rather than hidden. The stem names one of six numbered blocks and says nothing
    // else, so six distinct stem strings is the true and complete stem space - the item space
    // behind it is unbounded, because every sheet seed builds a different pile.
    stemSpace: NUMBERED_PER_PILE,
    calibratedAgainst: 'oatts',
    generate: (rng, h) => {
      const pile = buildPile(h.sheetSeed);
      if (!pile) return null;

      const scored = pile.numbered.map((n) => {
        const count = touchCount(pile.blocks, n.blockId);
        return {
          ...n,
          count,
          corner: cornerInclusiveCount(pile.blocks, n.blockId) - count,
          hidden: count - visibleOnlyCount(pile.blocks, n.blockId, pile.visibleIds),
        };
      });

      const pool = scored.filter(want);
      const from = pool.length ? pool : scored;
      // Indexed by item rather than drawn at random, so a run walks the numbered blocks in
      // turn and asks about each exactly once - as the real test does with one printed pile.
      // Drawing randomly left it to chance and chance duplicated: a 30-question exam came out
      // with 29 distinct items on some seeds.
      const chosen = from[h.item % from.length];

      const labels = errorLabels(pile.blocks, chosen.blockId, pile.visibleIds);
      const { choices, correctIndex, errors, whys } =
        orderedSlate(chosen.count, h.int(0, Math.min(4, chosen.count - 1)), h.int(0, 3) === 0, labels);

      const b = touchBreakdown(pile.blocks, chosen.blockId);
      const cornerNote = b.corner === 1
        ? ' One further block meets it only at a corner, so it does not count.'
        : b.corner > 1
          ? ` A further ${b.corner} blocks meet it only at a corner or an edge, so they do not count.`
          : '';

      return {
        stem: `How many other blocks does block ${chosen.label} touch?`,
        choices,
        correctIndex,
        errors,
        whys,
        render: { kind: 'blockpile', sheetSeed: h.sheetSeed, highlight: chosen.label },
        tags: ['block-counting'],
        explanation: `${blurb} Block ${chosen.label} touches ${describe(b)} - ${b.total} in all.${cornerNote}`,
      };
    },
  });

// Band 1 - the corner rule on its own, before any clock. Every numbered block here has at
// least one diagonal neighbour to reject, so the question cannot be answered by counting
// everything nearby. `drillOnly`: the real subtest does not select its blocks this way.
countTemplate({
  id: 'bc-corner-rule',
  band: 1,
  name: 'Faces touch, corners do not',
  concepts: ['block-face-contact', 'block-corner-exclusion'],
  want: (b) => b.corner >= 1 && b.hidden === 0,
  drillOnly: true,
  blurb: 'Count faces, never corners.',
});

// Band 2 - everything that touches it is visible. Builds the scan order (above, below,
// alongside) without also demanding that you infer anything.
countTemplate({
  id: 'bc-surface',
  band: 2,
  name: 'Counting a block in plain sight',
  concepts: ['block-scan-order'],
  want: (b) => b.hidden === 0 && b.count <= 5,
  drillOnly: true,
  blurb: 'Work above, below, then alongside, in that order every time.',
});

// Band 3 - THE REAL ITEM, and the only template here without `drillOnly`. Any numbered block
// on the pile, drawn uniformly, which is the real distribution - so an exam assembled from
// this template alone IS the subtest.
countTemplate({
  id: 'bc-count',
  band: 3,
  name: 'Block Counting',
  concepts: ['block-face-contact', 'block-corner-exclusion', 'block-hidden-inference', 'block-scan-order'],
  want: () => true,
  blurb: 'Above, below, alongside - then check for anything buried.',
});

// Band 4 - at least one of the blocks it touches cannot be seen. This is the "see into the
// pile" half of the subtest, and it is the only place the phrase in the official directions
// actually bites.
countTemplate({
  id: 'bc-hidden',
  band: 4,
  name: 'Seeing into the pile',
  concepts: ['block-hidden-inference'],
  want: (b) => b.hidden >= 1,
  // drillOnly, like every band but 3: the real subtest numbers its blocks and asks about
  // them, it does not go looking for the ones with buried neighbours. Letting a selective
  // template into an exam run would make the simulated score harder than the real test and
  // therefore meaningless - the same mistake Table Reading shipped in Phase 4.
  drillOnly: true,
  blurb: 'Something it touches is buried - the layers below are solid.',
});

// Band 4 - a block buried in the middle of the pile, touching six or more. Nothing new to
// know; it is the scan order under load, where losing count or double-counting a neighbour
// is easiest and where nine seconds is genuinely tight.
countTemplate({
  id: 'bc-crowded',
  band: 4,
  name: 'A block with many neighbours',
  concepts: ['block-scan-order', 'block-face-contact'],
  want: (b) => b.count >= 6,
  drillOnly: true,
  blurb: 'Keep a running total in one fixed order and do not re-scan.',
});
