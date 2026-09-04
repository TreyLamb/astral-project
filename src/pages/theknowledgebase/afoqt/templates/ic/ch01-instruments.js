// Instrument Comprehension - read two dials, pick the aircraft.
//
// The whole subtest is one item type asked 25 times in 5 minutes (12.0s each), so like Table
// Reading the bands come from how much work the reading takes, not from a different question.
//
// ⚠ THE ITEM SPACE IS BOUNDED AND THAT IS DECLARED, NOT HIDDEN. Roughly 8 headings x 3 pitches x
// 5 banks is about 120 readable attitudes, and the plan's "90-100% automatable" estimate does not
// apply here. It is far more than anyone will see in six weeks of study, but `stemSpace` says so
// out loud rather than pretending the supply is infinite.
//
// The distractor formula is official, from the pamphlet's own worked sample: the correct
// attitude, a REAR view, a FRONT view, and a WRONG-BANK version. Since the viewer always looks
// north, a rear view is an aircraft heading north and a front view one heading south - so two of
// the three wrong answers are compass misreadings and the third is the inverted-pointer trap.

import { registerTemplate } from '../../engine/generator.js';
import { HEADINGS, BANKS, PITCHES, optionSet, describe } from '../../engine/attitude.js';

const CH = 'ic-01-instruments';

/** Headings that are NOT due north or south, so the answer is never also the rear/front view. */
const OBLIQUE = HEADINGS.filter((h) => h.deg % 180 !== 0);

// `stemSpace` is DERIVED, never passed. Every call site used to hand in a literal 1 while this
// file's own header said the space was about 120 attitudes - so the declared bound contradicted
// the prose above it, and templateAudit.js, which samples `stemSpace` instances, was checking a
// single attitude per template and reporting clean. The product of the three pools is the actual
// number of distinct items the template can emit. (Fixed 2026-09-02.)
function icTemplate({ id, band, name, headings, banks, pitches, blurb, concepts, drillOnly }) {
  const stemSpace = headings.length * banks.length * pitches.length;
  registerTemplate({
    id,
    subtest: 'IC',
    band,
    name,
    concepts,
    drillOnly,
    calibratedAgainst: 'oatts',
    stemSpace,
    // The stem is the same sentence every time; the ATTITUDE is the item, and it reaches
    // the audit as the correct option's canonical description. See templateAudit.js itemKey.
    varies: 'options',
    generate: (rng, h) => {
      const correct = {
        heading: h.pick(headings).deg,
        pitch: h.pick(pitches).deg,
        bank: h.pick(banks).deg,
      };
      const opts = optionSet(correct);
      // Four options, not five - the one subtest on the whole test that differs.
      const [right, ...wrong] = opts;
      const { choices, correctIndex, errors, whys, optionRender } = h.choices(
        { value: describe(right.attitude), render: { kind: 'silhouette', ...right.attitude } },
        wrong.map((o) => ({
          value: describe(o.attitude),
          error: o.error,
          why: o.why,
          render: { kind: 'silhouette', ...o.attitude },
        })),
      );
      return {
        stem: 'Which aircraft is in the position shown by the two dials?',
        choices, correctIndex, errors, whys, optionRender,
        render: { kind: 'instrument', ...correct },
        tags: ['instrument-comprehension'],
        explanation: `${blurb} The dials show an aircraft ${describe(correct)}. Remember the pointer is INVERTED - it sits on the opposite side of zero from the bank - and that you are always looking north, so an aircraft heading north is flying away from you.`,
      };
    },
  });
}

// Band 2 - level flight. One thing to read: the compass. Builds the viewing convention before
// the bank trap is introduced.
icTemplate({
  id: 'ic-heading',
  band: 2,
  name: 'Read the heading',
  headings: OBLIQUE,
  banks: BANKS.filter((b) => b.deg === 0),
  pitches: PITCHES.filter((p) => p.deg === 0),
  concepts: ['instrument-viewing-convention'],
  drillOnly: true,
  blurb: 'Level and unbanked, so only the compass matters.',
});

// Band 2 - pitch only. Isolates the climb/dive reading: the silhouette between the horizon line
// and the pointer means CLIMBING, and the gap grows with the angle.
icTemplate({
  id: 'ic-pitch',
  band: 2,
  name: 'Read the climb or dive',
  headings: OBLIQUE,
  banks: BANKS.filter((b) => b.deg === 0),
  pitches: PITCHES.filter((p) => p.deg !== 0),
  concepts: ['instrument-pitch-reading'],
  drillOnly: true,
  blurb: 'Unbanked, so the horizon line only moves up and down.',
});

// Band 2 - bank only, and therefore the inverted pointer with nothing else to distract from it.
icTemplate({
  id: 'ic-bank',
  band: 2,
  name: 'Read the bank',
  headings: OBLIQUE,
  banks: BANKS.filter((b) => b.deg !== 0),
  pitches: PITCHES.filter((p) => p.deg === 0),
  concepts: ['instrument-bank-inversion'],
  drillOnly: true,
  blurb: 'Level flight, so the only thing to read is which way the pointer has moved.',
});

// Band 3 - the real item: heading, pitch and bank all at once.
icTemplate({
  id: 'ic-attitude',
  band: 3,
  name: 'Read the full attitude',
  headings: OBLIQUE,
  banks: BANKS,
  pitches: PITCHES,
  concepts: ['instrument-attitude-reading'],
  blurb: 'This is the subtest exactly as it is asked.',
});

// Band 4 - banked hard and pitched, where the silhouette is hardest to read and the inverted
// pointer costs the most.
icTemplate({
  id: 'ic-steep',
  band: 4,
  name: 'Steep bank with pitch',
  headings: OBLIQUE,
  banks: BANKS.filter((b) => Math.abs(b.deg) === 90),
  pitches: PITCHES.filter((p) => p.deg !== 0),
  concepts: ['instrument-attitude-reading'],
  drillOnly: true,
  blurb: 'Ninety degrees of bank puts the wings vertical - read the pointer, not the picture.',
});

/**
 * Band 1 - the pointer, on its own.
 *
 * ~ Not a real AFOQT item format: the real subtest only ever shows two dials and four aircraft.
 * This is a technique drill, and it earns its place because the inverted pointer is the single
 * fact the subtest is built to punish and it is worth isolating before it has to be applied
 * under a twelve-second clock. Tagged so it is identifiable, and `drillOnly` keeps it out of any
 * exam simulation.
 */
registerTemplate({
  id: 'ic-pointer',
  subtest: 'IC',
  band: 1,
  name: 'Which way is it banked',
  concepts: ['instrument-bank-inversion'],
  drillOnly: true,
  calibratedAgainst: 'oatts',
  // Banked attitudes only (the pointer is the point), times every pitch.
  stemSpace: BANKS.filter((b) => b.deg !== 0).length * PITCHES.length,
  varies: 'options',
  provenance: { kind: 'authored', note: 'technique drill - not a real AFOQT item format' },
  generate: (rng, h) => {
    const bank = h.pick(BANKS.filter((b) => b.deg !== 0)).deg;
    const pitch = h.pick(PITCHES).deg;
    const say = (b, p) =>
      `${Math.abs(b)} degrees ${b > 0 ? 'right' : 'left'}, ${p > 0 ? 'climbing' : p < 0 ? 'diving' : 'level'}`;
    const { choices, correctIndex, errors, whys } = h.choices(say(bank, pitch), [
      { value: say(-bank, pitch), error: 'bank-inverted', why: 'the pointer moves OPPOSITE the bank - a pointer left of zero means banked RIGHT' },
      { value: say(bank, -pitch || 25), error: 'pitch-inverted', why: 'the silhouette sits between the horizon line and the pointer when CLIMBING' },
      { value: say(-bank, -pitch || -25), error: 'bank-inverted', why: 'both readings inverted' },
    ]);
    return {
      stem: 'The artificial horizon shows an aircraft banked how far, and doing what?',
      choices, correctIndex, errors, whys,
      render: { kind: 'instrument', heading: null, pitch, bank },
      tags: ['instrument-comprehension', 'technique-drill'],
      explanation: `Banked ${Math.abs(bank)} degrees to the pilot's ${bank > 0 ? 'right' : 'left'}, ${pitch > 0 ? 'climbing' : pitch < 0 ? 'diving' : 'level'}. The pointer sits on the OPPOSITE side of zero from the bank, and the silhouette between the horizon and the pointer means climbing.`,
    };
  },
});
