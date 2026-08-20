// Chapter 6 - Airports, markings, lighting and the traffic pattern.
//
// This is the densest scoring chapter in the subtest. Three of the ten official OATTS Aviation
// Information items are airfield operations, and two of them are pure decoding:
//
//   "Runway 16R is decoded as"                  -> 160 degrees, right-most runway
//   "A row of white lights on the airfield most likely indicate" -> runway edge
//
// Runway numbering is the single best-value fact in the whole subtest because it is a RULE, not
// a fact: the number is the magnetic heading with the last digit dropped, so any runway number
// can be decoded from first principles and any heading converted back.
//
// The lighting colours are worth memorising as a set, because they are asked as a set: runway
// edges white, taxiway edges blue, taxiway centreline green, threshold green from one side and
// red from the other.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-06-airports';

registerFacts([
  // --- band 2: reading a runway --------------------------------------------------------------
  {
    id: 'av-runway-number', chapter: CH, concepts: ['runway-numbering'], band: 2,
    term: 'a runway number', gloss: 'is the magnetic heading of that runway with its last digit dropped',
    confusions: ['av-runway-16r', 'av-true-heading-runway', 'av-runway-length-marker'],
    why: 'Runway 27 points to magnetic 270 degrees, due west. Rounded to the nearest ten degrees, so runway 27 covers headings from 265 to 274.',
  },
  {
    id: 'av-runway-16r', chapter: CH, concepts: ['runway-numbering'], band: 2,
    term: 'runway 16R', gloss: 'is heading 160 degrees magnetic, and the right-hand runway of a parallel pair',
    recallStem: 'Which runway is aligned with a magnetic heading of 160 degrees?',
    confusions: ['av-runway-number', 'av-parallel-runways', 'av-true-heading-runway'],
    source: 'OATTS Knowledge Check, Airfield Operation',
  },
  {
    id: 'av-parallel-runways', chapter: CH, concepts: ['runway-numbering'], band: 2,
    term: 'L, C and R suffixes', gloss: 'distinguish parallel runways as left, centre and right',
    recallStem: 'How are parallel runways on the same heading told apart?',
    confusions: ['av-runway-16r', 'av-runway-number'],
  },
  {
    id: 'av-reciprocal-runway', chapter: CH, concepts: ['runway-numbering'], band: 2,
    term: 'a difference of 18', gloss: 'separates the two numbers painted at each end of the same runway',
    recallStem: 'What is the numerical relationship between the two ends of one runway?',
    confusions: ['av-runway-number', 'av-parallel-runways'],
    why: 'The two ends face opposite directions - 180 degrees apart - and the number is the heading over ten. Runway 09 at one end is runway 27 at the other.',
  },
  {
    id: 'av-true-heading-runway', chapter: CH, concepts: ['runway-numbering'], band: 2,
    term: 'magnetic north', gloss: 'is the reference that runway numbers are measured from, not true north',
    confusions: ['av-runway-number', 'av-runway-16r'],
  },
  {
    id: 'av-runway-length-marker', chapter: CH, concepts: ['runway-numbering'], band: 2,
    term: 'a distance remaining sign', gloss: 'shows a single white numeral on black, giving the runway left in thousands of feet',
    recallStem: 'Which sign counts down the runway you have left?',
    confusions: ['av-runway-number', 'av-location-sign'],
  },
  {
    id: 'av-wind-landing', chapter: CH, concepts: ['traffic-pattern'], band: 2,
    identify: false,
    term: 'into the wind', gloss: 'is the direction aircraft normally take off and land in',
    recallStem: 'Relative to the wind, in which direction do aircraft normally land?',
    confusions: ['av-crosswind-leg', 'av-downwind-leg'],
    source: 'OATTS Knowledge Check, Weather',
    why: 'A headwind lowers the groundspeed at touchdown, so you need less runway and have better control.',
  },
  {
    id: 'av-windsock', chapter: CH, concepts: ['traffic-pattern'], band: 2,
    term: 'a wind sock', gloss: 'shows both wind direction and, by how far it lifts, wind strength',
    recallStem: 'Which airfield device shows wind direction and rough strength?',
    confusions: ['av-segmented-circle', 'av-rotating-beacon'],
  },
  {
    id: 'av-segmented-circle', chapter: CH, concepts: ['traffic-pattern'], band: 2,
    term: 'a segmented circle', gloss: 'surrounds the wind indicator and displays the traffic pattern direction in use',
    recallStem: 'Which airfield marking shows which way the traffic pattern turns?',
    confusions: ['av-windsock', 'av-rotating-beacon'],
  },

  // --- band 3: the traffic pattern and the markings ------------------------------------------
  {
    id: 'av-upwind-leg', chapter: CH, concepts: ['traffic-pattern'], band: 3,
    term: 'the upwind leg', gloss: 'is flown parallel to the runway in the direction of landing',
    recallStem: 'Which leg of the traffic pattern runs parallel to the runway in the direction of landing?',
    confusions: ['av-downwind-leg', 'av-crosswind-leg', 'av-base-leg'],
  },
  {
    id: 'av-crosswind-leg', chapter: CH, concepts: ['traffic-pattern'], band: 3,
    term: 'the crosswind leg', gloss: 'is flown at right angles to the departure end of the runway',
    recallStem: 'Which leg is flown at right angles off the departure end of the runway?',
    confusions: ['av-upwind-leg', 'av-downwind-leg', 'av-base-leg'],
  },
  {
    id: 'av-downwind-leg', chapter: CH, concepts: ['traffic-pattern'], band: 3,
    term: 'the downwind leg', gloss: 'is flown parallel to the runway in the direction opposite to landing',
    recallStem: 'Which leg is flown parallel to the runway opposite the landing direction?',
    confusions: ['av-upwind-leg', 'av-base-leg', 'av-final-approach'],
  },
  {
    id: 'av-base-leg', chapter: CH, concepts: ['traffic-pattern'], band: 3,
    term: 'the base leg', gloss: 'is flown at right angles to the approach end of the runway, between downwind and final',
    recallStem: 'Which leg connects the downwind leg to final approach?',
    confusions: ['av-downwind-leg', 'av-final-approach', 'av-crosswind-leg'],
  },
  {
    id: 'av-final-approach', chapter: CH, concepts: ['traffic-pattern'], band: 3,
    term: 'final approach', gloss: 'is the last leg, aligned with the runway centreline before landing',
    recallStem: 'Which leg is flown aligned with the runway immediately before landing?',
    confusions: ['av-base-leg', 'av-upwind-leg', 'av-downwind-leg'],
  },
  {
    id: 'av-left-pattern', chapter: CH, concepts: ['traffic-pattern'], band: 3,
    term: 'left turns', gloss: 'are the standard direction of turn in a traffic pattern unless published otherwise',
    confusions: ['av-segmented-circle', 'av-base-leg'],
  },
  {
    id: 'av-displaced-threshold', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'a displaced threshold', gloss: 'is pavement usable for taxi and takeoff but not for landing',
    recallStem: 'Which runway area may be used for takeoff and taxi but not for touchdown?',
    confusions: ['av-blast-pad', 'av-threshold-markings', 'av-aiming-point'],
  },
  {
    id: 'av-blast-pad', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'a blast pad or stopway', gloss: 'is pavement marked with yellow chevrons that is not usable at all',
    recallStem: 'Which pavement, marked with yellow chevrons, must not be used for taxi, takeoff or landing?',
    confusions: ['av-displaced-threshold', 'av-threshold-markings'],
    why: 'Chevrons mean stay off entirely. Arrows mean you may roll on it but not land on it. That is the pair that gets swapped.',
  },
  {
    id: 'av-threshold-markings', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'threshold stripes', gloss: 'are the longitudinal white bars at the runway end whose number indicates its width',
    recallStem: 'Which runway marking indicates the width of the runway by its number of stripes?',
    confusions: ['av-aiming-point', 'av-touchdown-zone', 'av-displaced-threshold'],
  },
  {
    id: 'av-aiming-point', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'the aiming point markings', gloss: 'are the two broad white rectangles about 1,000 feet down the runway',
    recallStem: 'Which runway markings are the two broad white bars 1,000 feet from the threshold?',
    confusions: ['av-touchdown-zone', 'av-threshold-markings', 'av-runway-centerline'],
  },
  {
    id: 'av-touchdown-zone', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'touchdown zone markings', gloss: 'are the groups of white bars in pairs that show distance along the runway in 500-foot steps',
    confusions: ['av-aiming-point', 'av-threshold-markings'],
  },
  {
    id: 'av-runway-centerline', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'the runway centreline', gloss: 'is a dashed white line down the middle of the runway',
    recallStem: 'Which marking is a dashed WHITE line down the centre of the pavement?',
    confusions: ['av-taxiway-centerline', 'av-hold-short-marking'],
    why: 'Colour is the tell throughout: runway markings are WHITE, taxiway markings are YELLOW.',
  },
  {
    id: 'av-taxiway-centerline', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'the taxiway centreline', gloss: 'is a continuous yellow line the nosewheel is kept on while taxiing',
    recallStem: 'Which marking is a solid YELLOW line to keep the nosewheel on?',
    confusions: ['av-runway-centerline', 'av-hold-short-marking'],
  },
  {
    id: 'av-hold-short-marking', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'the runway holding position marking', gloss: 'is two solid and two dashed yellow lines that must not be crossed without clearance',
    recallStem: 'Which marking must not be crossed without a specific clearance?',
    confusions: ['av-taxiway-centerline', 'av-ils-critical-area', 'av-location-sign'],
    why: 'You approach from the SOLID side and hold there. Crossing from the dashed side back onto the taxiway needs no clearance.',
  },
  {
    id: 'av-ils-critical-area', chapter: CH, concepts: ['airport-markings'], band: 3,
    term: 'the ILS critical area marking', gloss: 'is a yellow ladder pattern protecting the instrument landing signal from interference',
    recallStem: 'Which marking protects an instrument landing system signal from being disturbed?',
    confusions: ['av-hold-short-marking', 'av-taxiway-centerline'],
  },

  // --- band 4: signs and lights ---------------------------------------------------------------
  {
    id: 'av-runway-edge-lights', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'runway edge lights', gloss: 'are the white lights that outline the edges of a runway',
    recallStem: 'Which airfield lights are WHITE?',
    confusions: ['av-taxiway-edge-lights', 'av-taxiway-centerline-lights', 'av-threshold-lights'],
    source: 'OATTS Knowledge Check, Airfield Operation',
    why: 'White for runway edges. They turn amber in the last 2,000 feet of an instrument runway as a warning that the end is coming.',
  },
  {
    id: 'av-taxiway-edge-lights', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'taxiway edge lights', gloss: 'are the blue lights that outline the edges of a taxiway',
    recallStem: 'Which airfield lights are BLUE?',
    confusions: ['av-runway-edge-lights', 'av-taxiway-centerline-lights'],
    source: 'AFPC pamphlet, Aviation Information sample item 3',
  },
  {
    id: 'av-taxiway-centerline-lights', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'taxiway centreline lights', gloss: 'are the green lights running down the middle of a taxiway',
    recallStem: 'Which airfield lights are GREEN and run down the centre of a taxiway?',
    confusions: ['av-taxiway-edge-lights', 'av-threshold-lights', 'av-runway-edge-lights'],
  },
  {
    id: 'av-threshold-lights', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'threshold lights', gloss: 'show green to an arriving aircraft and red to one at the far end of the runway',
    recallStem: 'Which lights are green on approach and red from the runway side?',
    confusions: ['av-runway-edge-lights', 'av-taxiway-centerline-lights'],
  },
  {
    id: 'av-rotating-beacon', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'the airport rotating beacon', gloss: 'alternates white and green at a civilian land airport to mark its position at night',
    recallStem: 'Which light alternates white and green to identify a civil land airport?',
    confusions: ['av-military-beacon', 'av-anticollision-beacon', 'av-windsock'],
  },
  {
    id: 'av-military-beacon', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'a military airport beacon', gloss: 'shows two quick white flashes between each green flash',
    recallStem: 'Which beacon shows two quick white flashes between each green one?',
    confusions: ['av-rotating-beacon', 'av-anticollision-beacon'],
  },
  {
    id: 'av-anticollision-beacon', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'the anti-collision beacon', gloss: 'is the flashing red light on an aircraft that warns the engines are running or about to be',
    recallStem: 'Which aircraft light flashes red to show the aircraft is active?',
    confusions: ['av-position-lights', 'av-rotating-beacon', 'av-military-beacon'],
    source: 'OATTS Knowledge Check',
  },
  {
    id: 'av-position-lights', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'position lights', gloss: 'are red on the left wingtip, green on the right, and white at the tail',
    recallStem: 'Which aircraft lights are red on the left wing and green on the right?',
    confusions: ['av-anticollision-beacon', 'av-landing-light'],
    why: 'If you see green on your left and red on your right, the other aircraft is pointing at you. Same convention as ships.',
  },
  {
    id: 'av-landing-light', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'the landing light', gloss: 'is a forward-facing white light used on approach and, for visibility, below 10,000 feet',
    confusions: ['av-position-lights', 'av-anticollision-beacon'],
  },
  {
    id: 'av-vasi', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'a VASI', gloss: 'gives glide path guidance in two bars - red over white means on the correct path',
    recallStem: 'Which approach light system uses two bars, with red over white meaning on path?',
    confusions: ['av-papi', 'av-threshold-lights'],
    why: '"Red over white, you are all right. Red over red, you are dead. White over white, you will fly all night."',
  },
  {
    id: 'av-papi', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'a PAPI', gloss: 'gives glide path guidance in a single row of four lights - two red and two white means on path',
    recallStem: 'Which approach light system is a single row of four lights?',
    confusions: ['av-vasi', 'av-runway-edge-lights'],
  },
  {
    id: 'av-mandatory-sign', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'a mandatory instruction sign', gloss: 'has white lettering on a red background and marks an entrance you may not cross without clearance',
    recallStem: 'Which airfield sign is white on red?',
    confusions: ['av-location-sign', 'av-direction-sign', 'av-hold-short-marking'],
  },
  {
    id: 'av-location-sign', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'a location sign', gloss: 'has yellow lettering on a black background and tells you which taxiway you are on',
    recallStem: 'Which airfield sign is yellow on black?',
    confusions: ['av-mandatory-sign', 'av-direction-sign', 'av-runway-length-marker'],
  },
  {
    id: 'av-direction-sign', chapter: CH, concepts: ['airport-lighting'], band: 4,
    term: 'a direction sign', gloss: 'has black lettering on a yellow background and points to the taxiways you can turn onto',
    recallStem: 'Which airfield sign is black on yellow?',
    confusions: ['av-location-sign', 'av-mandatory-sign'],
    why: 'The pair to keep straight: yellow ON black tells you where you ARE; black ON yellow tells you where you can GO.',
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-airport-b2', name: 'Reading a runway' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-airport-b3', name: 'Pattern and markings' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-airport-b4', name: 'Signs and lighting' }),
];
