// Chapter 11 - Navigation, and the pilot as a physiological system.
//
// Navigation is one of the five pillars the official OATTS module tree names for Aviation
// Information, so it is examinable even though none of the ten sampled official items happened
// to land on it.
//
// The TVMDC chain is the highest-value thing here because it is a procedure rather than a fact:
// True, Variation, Magnetic, Deviation, Compass - "True Virgins Make Dull Companions" - and it
// converts in both directions. Everything else in the navigation half is vocabulary.
//
// The aeromedical section is short and worth every line. Hypoxia and spatial disorientation are
// standard aviation-knowledge material, they are asked, and the four types of hypoxia are a
// clean confusion set where each is a plausible wrong answer for the others.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-11-navigation';

registerFacts([
  // --- band 2: finding your way --------------------------------------------------------------------
  {
    id: 'av-pilotage', chapter: CH, concepts: ['navigation-methods'], band: 2,
    term: 'pilotage', gloss: 'is navigation by direct reference to visible landmarks',
    recallStem: 'Which navigation method uses visible ground features alone?',
    confusions: ['av-dead-reckoning', 'av-radio-navigation', 'av-gps'],
  },
  {
    id: 'av-dead-reckoning', chapter: CH, concepts: ['navigation-methods'], band: 2,
    term: 'dead reckoning', gloss: 'is navigation by computing position from heading, airspeed, wind and elapsed time',
    recallStem: 'Which navigation method computes position from heading, speed and elapsed time?',
    confusions: ['av-pilotage', 'av-radio-navigation', 'av-gps'],
  },
  {
    id: 'av-radio-navigation', chapter: CH, concepts: ['navigation-methods'], band: 2,
    term: 'radio navigation', gloss: 'is navigation using ground-based transmitters and cockpit receivers',
    confusions: ['av-pilotage', 'av-dead-reckoning', 'av-gps'],
  },
  {
    id: 'av-gps', chapter: CH, concepts: ['navaids'], band: 2,
    term: 'GPS', gloss: 'fixes position from the timing of signals received from a constellation of satellites',
    recallStem: 'Which navigation system uses a satellite constellation?',
    confusions: ['av-vor', 'av-ndb', 'av-radio-navigation'],
  },
  {
    id: 'av-vor', chapter: CH, concepts: ['navaids'], band: 2,
    term: 'a VOR', gloss: 'is a ground station broadcasting radials that an aircraft can track inbound or outbound',
    recallStem: 'Which navaid broadcasts radials for an aircraft to fly toward or away from?',
    confusions: ['av-ndb', 'av-dme', 'av-gps'],
  },
  {
    id: 'av-ndb', chapter: CH, concepts: ['navaids'], band: 2,
    term: 'an NDB', gloss: 'is a simple non-directional beacon that an ADF needle simply points toward',
    recallStem: 'Which navaid does an ADF needle simply point toward?',
    confusions: ['av-vor', 'av-dme', 'av-gps'],
  },
  {
    id: 'av-dme', chapter: CH, concepts: ['navaids'], band: 2,
    term: 'DME', gloss: 'measures slant-range distance from the aircraft to a ground station',
    recallStem: 'Which equipment measures distance to a ground navaid?',
    confusions: ['av-vor', 'av-ndb', 'av-gps'],
  },
  {
    id: 'av-ils', chapter: CH, concepts: ['navaids'], band: 2,
    term: 'an ILS', gloss: 'provides both lateral and vertical guidance down to a runway in poor visibility',
    recallStem: 'Which approach system provides both lateral and vertical guidance to a runway?',
    confusions: ['av-localizer', 'av-glideslope', 'av-vor'],
  },
  {
    id: 'av-localizer', chapter: CH, concepts: ['navaids'], band: 2,
    term: 'the localizer', gloss: 'is the part of an ILS that provides lateral guidance along the runway centreline',
    recallStem: 'Which ILS component gives left and right guidance?',
    confusions: ['av-glideslope', 'av-ils', 'av-vor'],
  },
  {
    id: 'av-glideslope', chapter: CH, concepts: ['navaids'], band: 2,
    term: 'the glideslope', gloss: 'is the part of an ILS that provides vertical guidance on the descent path',
    recallStem: 'Which ILS component gives up and down guidance?',
    confusions: ['av-localizer', 'av-ils'],
  },

  // --- band 3: true, magnetic and compass ------------------------------------------------------------
  {
    id: 'av-true-north', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'true north', gloss: 'is the direction of the geographic North Pole, and the reference charts are drawn to',
    recallStem: 'Which north is the geographic pole that charts are drawn to?',
    confusions: ['av-magnetic-north', 'av-compass-north', 'av-grid-north'],
  },
  {
    id: 'av-magnetic-north', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'magnetic north', gloss: 'is the direction a compass needle points, which differs from true north almost everywhere',
    recallStem: 'Which north does a compass needle actually point to?',
    confusions: ['av-true-north', 'av-compass-north', 'av-variation-11'],
  },
  {
    id: 'av-variation-11', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'variation', gloss: 'is the angle between true north and magnetic north at a given location',
    recallStem: 'Which correction converts a true direction into a magnetic one?',
    confusions: ['av-deviation-11', 'av-isogonic', 'av-magnetic-north'],
  },
  {
    id: 'av-deviation-11', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'deviation', gloss: 'is the compass error caused by magnetic influences inside the aircraft itself',
    recallStem: 'Which correction converts a magnetic direction into a compass heading?',
    confusions: ['av-variation-11', 'av-compass-north', 'av-isogonic'],
  },
  {
    id: 'av-tvmdc', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'True, Variation, Magnetic, Deviation, Compass', gloss: 'is the order of the conversion chain from a charted course to a compass heading',
    recallStem: 'Which memory aid gives the order of navigation direction conversions?',
    confusions: ['av-variation-11', 'av-deviation-11', 'av-isogonic'],
    why: '"True Virgins Make Dull Companions." Going down the chain you ADD westerly corrections; going back up you subtract them.',
  },
  {
    id: 'av-isogonic', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'an isogonic line', gloss: 'joins points on a chart that share the same magnetic variation',
    recallStem: 'Which chart line joins points of equal magnetic variation?',
    confusions: ['av-agonic', 'av-variation-11', 'av-isobar'],
  },
  {
    id: 'av-agonic', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'the agonic line', gloss: 'is the line along which magnetic variation is zero and true and magnetic north agree',
    recallStem: 'Which line marks zero magnetic variation?',
    confusions: ['av-isogonic', 'av-variation-11'],
  },
  {
    id: 'av-isobar', chapter: CH, concepts: ['time-and-charts'], band: 3,
    term: 'an isobar', gloss: 'joins points of equal atmospheric pressure on a weather chart',
    recallStem: 'Which chart line joins points of equal atmospheric pressure?',
    confusions: ['av-isogonic', 'av-agonic'],
  },
  {
    id: 'av-compass-north', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'compass north', gloss: 'is what the instrument actually reads once deviation has acted on magnetic north',
    confusions: ['av-magnetic-north', 'av-true-north', 'av-deviation-11'],
  },
  {
    id: 'av-grid-north', chapter: CH, concepts: ['magnetic-vs-true'], band: 3,
    term: 'grid north', gloss: 'is the direction of the vertical grid lines on a map projection',
    confusions: ['av-true-north', 'av-magnetic-north'],
  },
  {
    id: 'av-zulu', chapter: CH, concepts: ['time-and-charts'], band: 3,
    term: 'Zulu time', gloss: 'is Coordinated Universal Time, used worldwide in aviation so no flight crosses a time zone boundary on paper',
    recallStem: 'Which time standard does aviation use everywhere?',
    confusions: ['av-local-time', 'av-isobar'],
  },
  {
    id: 'av-local-time', chapter: CH, concepts: ['time-and-charts'], band: 3,
    term: 'local time', gloss: 'is the civil clock time at a place, which aviation deliberately avoids for flight planning',
    confusions: ['av-zulu'],
  },
  {
    id: 'av-great-circle', chapter: CH, concepts: ['time-and-charts'], band: 3,
    term: 'a great circle', gloss: 'is the shortest route between two points on the earth, though its heading changes constantly',
    recallStem: 'Which route is the shortest distance between two points on the earth?',
    confusions: ['av-rhumb-line', 'av-isogonic'],
  },
  {
    id: 'av-rhumb-line', chapter: CH, concepts: ['time-and-charts'], band: 3,
    term: 'a rhumb line', gloss: 'crosses every meridian at the same angle, so it holds a constant heading but is not the shortest route',
    recallStem: 'Which route holds a constant compass heading throughout?',
    confusions: ['av-great-circle', 'av-isogonic'],
  },

  // --- band 4: the pilot ------------------------------------------------------------------------------
  {
    id: 'av-hypoxic-hypoxia', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'hypoxic hypoxia', gloss: 'is oxygen starvation caused by insufficient oxygen pressure at altitude',
    recallStem: 'Which type of hypoxia is caused by low ambient oxygen pressure?',
    confusions: ['av-hypemic-hypoxia', 'av-stagnant-hypoxia', 'av-histotoxic-hypoxia'],
  },
  {
    id: 'av-hypemic-hypoxia', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'hypemic hypoxia', gloss: 'is oxygen starvation caused by the blood being unable to carry oxygen, as in carbon monoxide poisoning',
    recallStem: 'Which type of hypoxia results from carbon monoxide poisoning or blood loss?',
    confusions: ['av-hypoxic-hypoxia', 'av-stagnant-hypoxia', 'av-histotoxic-hypoxia'],
  },
  {
    id: 'av-stagnant-hypoxia', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'stagnant hypoxia', gloss: 'is oxygen starvation caused by inadequate blood flow, as under high G loading',
    recallStem: 'Which type of hypoxia is caused by restricted blood flow?',
    confusions: ['av-hypemic-hypoxia', 'av-hypoxic-hypoxia', 'av-histotoxic-hypoxia'],
  },
  {
    id: 'av-histotoxic-hypoxia', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'histotoxic hypoxia', gloss: 'is oxygen starvation in which the cells cannot use the oxygen delivered to them, as after alcohol or drugs',
    recallStem: 'Which type of hypoxia leaves the cells unable to use the oxygen delivered?',
    confusions: ['av-stagnant-hypoxia', 'av-hypemic-hypoxia', 'av-hypoxic-hypoxia'],
  },
  {
    id: 'av-hyperventilation', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'hyperventilation', gloss: 'is over-breathing that flushes out carbon dioxide, producing symptoms easily mistaken for hypoxia',
    recallStem: 'Which condition mimics hypoxia but is caused by breathing too fast?',
    confusions: ['av-hypoxic-hypoxia', 'av-histotoxic-hypoxia'],
  },
  {
    id: 'av-spatial-disorientation', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'spatial disorientation', gloss: 'is the conflict between what the inner ear reports and the aircraft actual attitude',
    recallStem: 'What is the sensory conflict about aircraft attitude called?',
    confusions: ['av-graveyard-spiral', 'av-somatogravic', 'av-hyperventilation'],
    why: 'The rule that follows from it is absolute: in instrument conditions, believe the instruments and not your body.',
  },
  {
    id: 'av-graveyard-spiral', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'the graveyard spiral', gloss: 'is the illusion after a prolonged turn that makes a pilot re-enter the turn while trying to correct a descent',
    recallStem: 'Which illusion follows a prolonged constant-rate turn?',
    confusions: ['av-spatial-disorientation', 'av-somatogravic', 'av-false-horizon'],
  },
  {
    id: 'av-somatogravic', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'the somatogravic illusion', gloss: 'makes rapid acceleration feel like a nose-up pitch, tempting a pilot to push the nose down',
    recallStem: 'Which illusion makes acceleration feel like climbing?',
    confusions: ['av-graveyard-spiral', 'av-spatial-disorientation', 'av-false-horizon'],
  },
  {
    id: 'av-false-horizon', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'the false horizon', gloss: 'is the illusion of mistaking a sloping cloud deck or a line of lights for the true horizon',
    recallStem: 'Which illusion comes from misreading a sloping cloud layer as the horizon?',
    confusions: ['av-somatogravic', 'av-graveyard-spiral', 'av-night-vision'],
  },
  {
    id: 'av-night-vision', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    term: 'looking slightly to one side of an object', gloss: 'is the correct technique for seeing faint objects at night',
    confusions: ['av-false-horizon', 'av-spatial-disorientation'],
    why: 'The centre of the retina has no rod cells, so a faint light disappears if you look straight at it. Off-centre viewing puts it on the rods.',
  },
  {
    id: 'av-hypoxia-altitude', chapter: CH, concepts: ['aeromedical-factors'], band: 4,
    identify: false,
    term: '12,500 feet', gloss: 'is the cabin altitude above which supplemental oxygen becomes required after thirty minutes',
    recallStem: 'Above which cabin altitude does the 30-minute oxygen rule begin?',
    confusions: ['av-hypoxic-hypoxia', 'av-hyperventilation'],
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-nav-b2', name: 'Navigation and navaids' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-nav-b3', name: 'True, magnetic and compass' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-nav-b4', name: 'The pilot' }),
];
