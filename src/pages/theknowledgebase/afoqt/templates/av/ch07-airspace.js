// Chapter 7 - Airspace, right of way and cruising altitudes.
//
// The most rule-shaped chapter in the subtest, which makes it the most reliably scoreable: none
// of it requires understanding, all of it is lookup, and the rules do not change.
//
// Two things here are worth more than the rest combined because they are RULES that generate
// answers rather than facts to be recalled:
//   - The hemispheric rule. Heading 0-179 magnetic, cruise ODD thousands plus 500. Heading
//     180-359, EVEN thousands plus 500. Any altitude question falls out of that.
//   - Right of way is a fixed pecking order, least manoeuvrable first.
//
// Airspace classes are easiest as a shape: A is the high-altitude structure, B is an upside-down
// wedding cake over the biggest airports, C is smaller, D is a tower airport, E is the general
// controlled airspace filling the gaps, G is what is left over.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-07-airspace';

registerFacts([
  // --- band 2: the classes -------------------------------------------------------------------
  {
    id: 'av-class-a', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'Class A', gloss: 'runs from 18,000 feet to flight level 600 and may only be flown under instrument rules',
    recallStem: 'Which airspace class begins at 18,000 feet and permits no VFR flight at all?',
    confusions: ['av-class-b', 'av-class-e', 'av-class-g'],
  },
  {
    id: 'av-class-b', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'Class B', gloss: 'surrounds the busiest airports in tiers like an upside-down wedding cake and requires an explicit clearance to enter',
    recallStem: 'Which airspace class is shaped like an inverted wedding cake and needs a specific clearance to enter?',
    confusions: ['av-class-c', 'av-class-d', 'av-class-a'],
  },
  {
    id: 'av-class-c', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'Class C', gloss: 'surrounds moderately busy airports with radar service and requires two-way radio contact before entry',
    recallStem: 'Which airspace class surrounds a radar-equipped airport of moderate traffic?',
    confusions: ['av-class-b', 'av-class-d', 'av-class-e'],
  },
  {
    id: 'av-class-d', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'Class D', gloss: 'surrounds an airport with an operating control tower and requires two-way radio contact',
    recallStem: 'Which airspace class exists simply because an airport has a control tower?',
    confusions: ['av-class-c', 'av-class-e', 'av-class-b'],
  },
  {
    id: 'av-class-e', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'Class E', gloss: 'is general controlled airspace that fills the gaps and needs no clearance for visual flight',
    recallStem: 'Which airspace class is controlled but requires no clearance for a VFR flight?',
    confusions: ['av-class-g', 'av-class-d', 'av-class-c'],
  },
  {
    id: 'av-class-g', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'Class G', gloss: 'is uncontrolled airspace in which air traffic control provides no separation service',
    recallStem: 'Which airspace class is uncontrolled?',
    confusions: ['av-class-e', 'av-class-d', 'av-class-a'],
  },
  {
    id: 'av-mode-c-veil', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'the Mode C veil', gloss: 'is the 30-nautical-mile ring around a Class B airport within which a transponder is required',
    recallStem: 'What is the 30 nm transponder requirement ring around Class B airspace called?',
    confusions: ['av-class-b', 'av-transponder', 'av-class-c'],
  },
  {
    id: 'av-transponder', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'a transponder', gloss: 'replies to radar interrogation with an identifying code and, in Mode C, the aircraft altitude',
    recallStem: 'Which equipment reports a code and altitude in response to radar interrogation?',
    confusions: ['av-mode-c-veil', 'av-atis'],
  },
  {
    id: 'av-atis', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'ATIS', gloss: 'is a continuously repeating broadcast of weather and field conditions at a busy airport',
    recallStem: 'Which broadcast continuously repeats airport weather and field information?',
    confusions: ['av-ctaf', 'av-unicom', 'av-transponder'],
  },
  {
    id: 'av-ctaf', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'CTAF', gloss: 'is the common frequency pilots use to announce their positions at an airport without a tower',
    recallStem: 'Which frequency is used to announce position where there is no control tower?',
    confusions: ['av-unicom', 'av-atis'],
  },
  {
    id: 'av-unicom', chapter: CH, concepts: ['airspace-classes'], band: 2,
    term: 'UNICOM', gloss: 'is a non-government radio station at an airport providing advisory and service information',
    confusions: ['av-ctaf', 'av-atis'],
  },

  // --- band 3: special use airspace and VFR minimums -------------------------------------------
  {
    id: 'av-prohibited-area', chapter: CH, concepts: ['special-use-airspace'], band: 3,
    term: 'a prohibited area', gloss: 'is airspace in which flight is forbidden outright',
    recallStem: 'Which special-use airspace forbids flight entirely?',
    confusions: ['av-restricted-area', 'av-warning-area', 'av-moa'],
  },
  {
    id: 'av-restricted-area', chapter: CH, concepts: ['special-use-airspace'], band: 3,
    term: 'a restricted area', gloss: 'contains hazards such as artillery or guided missiles and may be entered only with permission',
    recallStem: 'Which special-use airspace contains hazards and needs permission to enter?',
    confusions: ['av-prohibited-area', 'av-warning-area', 'av-moa'],
  },
  {
    id: 'av-warning-area', chapter: CH, concepts: ['special-use-airspace'], band: 3,
    term: 'a warning area', gloss: 'contains the same hazards as a restricted area but lies over international waters',
    recallStem: 'Which special-use airspace holds hazards but sits over international water?',
    confusions: ['av-restricted-area', 'av-prohibited-area', 'av-moa'],
  },
  {
    id: 'av-moa', chapter: CH, concepts: ['special-use-airspace'], band: 3,
    term: 'a military operations area', gloss: 'separates military training from civil traffic but may legally be flown through under visual rules',
    recallStem: 'Which special-use airspace may be entered by a VFR flight without permission?',
    confusions: ['av-restricted-area', 'av-warning-area', 'av-alert-area'],
  },
  {
    id: 'av-alert-area', chapter: CH, concepts: ['special-use-airspace'], band: 3,
    term: 'an alert area', gloss: 'marks a high volume of unusual flight activity, with all pilots equally responsible for avoidance',
    confusions: ['av-moa', 'av-warning-area'],
  },
  {
    id: 'av-tfr', chapter: CH, concepts: ['special-use-airspace'], band: 3,
    term: 'a temporary flight restriction', gloss: 'is short-notice airspace closed around a disaster, a major event or a VIP movement',
    recallStem: 'What is short-notice restricted airspace around an event or incident called?',
    confusions: ['av-prohibited-area', 'av-restricted-area'],
  },
  {
    id: 'av-vfr-visibility', chapter: CH, concepts: ['vfr-minimums'], band: 3,
    identify: false,
    term: '3 statute miles', gloss: 'is the basic visual flight visibility requirement in controlled airspace below 10,000 feet',
    recallStem: 'What flight visibility is required for VFR in controlled airspace below 10,000 feet?',
    confusions: ['av-vfr-cloud-clearance', 'av-vfr-class-g'],
  },
  {
    id: 'av-vfr-cloud-clearance', chapter: CH, concepts: ['vfr-minimums'], band: 3,
    identify: false,
    term: '500 below, 1,000 above and 2,000 horizontally', gloss: 'is the standard cloud clearance for visual flight in controlled airspace',
    recallStem: 'Which cloud clearance applies to VFR flight in controlled airspace below 10,000 feet?',
    confusions: ['av-vfr-visibility', 'av-vfr-class-g'],
    why: 'Remember it as the "1-3-5-2": 1,000 above, 3 miles visibility, 500 below, 2,000 horizontal.',
  },
  {
    id: 'av-vfr-class-g', chapter: CH, concepts: ['vfr-minimums'], band: 3,
    term: '1 statute mile and clear of clouds', gloss: 'is the reduced daytime visual requirement in Class G airspace below 1,200 feet',
    confusions: ['av-vfr-visibility', 'av-vfr-cloud-clearance'],
  },
  {
    id: 'av-vfr-class-b', chapter: CH, concepts: ['vfr-minimums'], band: 3,
    term: '3 statute miles and clear of clouds', gloss: 'is the visual requirement inside Class B airspace, where ATC separates everyone',
    confusions: ['av-vfr-cloud-clearance', 'av-vfr-visibility'],
    why: 'No distance-from-cloud requirement, because in Class B air traffic control is separating every aircraft in there anyway.',
  },
  {
    id: 'av-special-vfr', chapter: CH, concepts: ['vfr-minimums'], band: 3,
    term: 'special VFR', gloss: 'is a clearance allowing flight in a control zone below normal visual minimums',
    recallStem: 'Which clearance allows VFR flight below the usual weather minimums in a control zone?',
    confusions: ['av-vfr-visibility', 'av-vfr-class-b'],
  },

  // --- band 4: right of way and cruising altitudes ---------------------------------------------
  {
    id: 'av-row-distress', chapter: CH, concepts: ['right-of-way'], band: 4,
    identify: false,
    term: 'an aircraft in distress', gloss: 'has right of way over every other aircraft, without exception',
    recallStem: 'Which aircraft has absolute right of way over every other?',
    confusions: ['av-row-balloon', 'av-row-glider', 'av-row-airship'],
  },
  {
    id: 'av-row-balloon', chapter: CH, concepts: ['right-of-way'], band: 4,
    identify: false,
    term: 'a balloon', gloss: 'has right of way over every aircraft except one in distress, being the least manoeuvrable',
    recallStem: 'Which aircraft type is highest in the normal right-of-way order?',
    confusions: ['av-row-glider', 'av-row-airship', 'av-row-distress'],
    why: 'The order runs from least manoeuvrable to most: distress, balloon, glider, airship, then aeroplane and rotorcraft. A powered aircraft gives way to everything.',
  },
  {
    id: 'av-row-glider', chapter: CH, concepts: ['right-of-way'], band: 4,
    term: 'a glider', gloss: 'gives way only to balloons and to aircraft in distress',
    confusions: ['av-row-balloon', 'av-row-airship', 'av-row-towing'],
  },
  {
    id: 'av-row-airship', chapter: CH, concepts: ['right-of-way'], band: 4,
    term: 'an airship', gloss: 'gives way to balloons and gliders but has right of way over an aeroplane',
    confusions: ['av-row-glider', 'av-row-balloon'],
  },
  {
    id: 'av-row-towing', chapter: CH, concepts: ['right-of-way'], band: 4,
    term: 'an aircraft towing or refuelling another', gloss: 'has right of way over all other powered aircraft',
    confusions: ['av-row-airship', 'av-row-glider'],
  },
  {
    id: 'av-row-headon', chapter: CH, concepts: ['right-of-way'], band: 4,
    identify: false,
    term: 'both aircraft turn right', gloss: 'is the rule when two aircraft approach each other head on',
    recallStem: 'What must both pilots do when two aircraft converge head on?',
    confusions: ['av-row-converging', 'av-row-overtaking'],
  },
  {
    id: 'av-row-converging', chapter: CH, concepts: ['right-of-way'], band: 4,
    term: 'the aircraft on the right has right of way', gloss: 'is the rule when two aircraft of the same category converge',
    confusions: ['av-row-headon', 'av-row-overtaking', 'av-row-landing'],
  },
  {
    id: 'av-row-overtaking', chapter: CH, concepts: ['right-of-way'], band: 4,
    term: 'the overtaking aircraft alters course to the right', gloss: 'is the rule when one aircraft passes another',
    confusions: ['av-row-converging', 'av-row-headon'],
  },
  {
    id: 'av-row-landing', chapter: CH, concepts: ['right-of-way'], band: 4,
    term: 'the aircraft at the lower altitude has right of way', gloss: 'is the rule when two aircraft are approaching to land',
    confusions: ['av-row-converging', 'av-row-overtaking'],
    why: 'Lower has right of way - but you may not use that to cut in front of an aircraft already on final approach.',
  },
  {
    id: 'av-hemispheric-east', chapter: CH, concepts: ['cruising-altitudes'], band: 4,
    identify: false,
    term: 'odd thousands plus 500 feet', gloss: 'is the VFR cruising altitude for a magnetic course from 0 through 179 degrees',
    recallStem: 'Which VFR cruising altitudes apply to an easterly magnetic course?',
    confusions: ['av-hemispheric-west', 'av-hemispheric-floor'],
    why: 'Eastbound is odd: 3,500, 5,500, 7,500. Westbound is even: 4,500, 6,500, 8,500. The rule keeps opposing traffic 1,000 feet apart.',
  },
  {
    id: 'av-hemispheric-west', chapter: CH, concepts: ['cruising-altitudes'], band: 4,
    identify: false,
    term: 'even thousands plus 500 feet', gloss: 'is the VFR cruising altitude for a magnetic course from 180 through 359 degrees',
    recallStem: 'Which VFR cruising altitudes apply to a westerly magnetic course?',
    confusions: ['av-hemispheric-east', 'av-hemispheric-floor'],
  },
  {
    id: 'av-hemispheric-floor', chapter: CH, concepts: ['cruising-altitudes'], band: 4,
    identify: false,
    term: '3,000 feet above the surface', gloss: 'is the height above which the VFR cruising altitude rule begins to apply',
    recallStem: 'Above what height above ground level does the VFR cruising rule apply?',
    confusions: ['av-hemispheric-east', 'av-hemispheric-west'],
  },
  {
    id: 'av-magnetic-course-basis', chapter: CH, concepts: ['cruising-altitudes'], band: 4,
    term: 'magnetic course', gloss: 'is the direction the cruising altitude rule is based on, not the heading being flown',
    confusions: ['av-hemispheric-east', 'av-hemispheric-west'],
    why: 'Course, not heading. A strong crosswind can have you heading well off your course, and the rule follows the course.',
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-airspace-b2', name: 'Airspace classes' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-airspace-b3', name: 'Special use and minimums' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-airspace-b4', name: 'Right of way and altitudes' }),
];
