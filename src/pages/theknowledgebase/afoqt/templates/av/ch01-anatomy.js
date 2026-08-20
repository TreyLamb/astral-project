// Chapter 1 - Aircraft anatomy and the control surfaces.
//
// The from-zero chapter of the from-zero subtest. Aviation Information is the highest-ROI
// subtest on the test for someone with no aviation background, for the blunt reason that no
// background means no points and every point here is learnable in an evening.
//
// Everything in this file is standard FAA Pilot's Handbook of Aeronautical Knowledge material
// (FAA-H-8083-25, US Government work, free and public). Two official AFOQT items calibrate the
// level directly: *"An aircraft's elevator functions to"* -> change pitch, and *"The cowling is
// located"* -> around the engine. That is the register - name the part, say what it does. It is
// not an engineering exam.
//
// The distractors are the confusions people actually make, declared per fact. Aileron/elevator/
// rudder is the confusion that matters most here and every one of the three names the other two.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-01-anatomy';

registerFacts([
  // --- band 1: the parts you can point at -------------------------------------------------
  {
    id: 'av-fuselage', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'the fuselage', gloss: 'is the central body that carries the crew, passengers and cargo',
    recallStem: 'Which structure is the central body an aircraft is built around?',
    confusions: ['av-empennage', 'av-nacelle', 'av-cowling'],
  },
  {
    id: 'av-empennage', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'the empennage', gloss: 'is the tail assembly - the fin, the tailplane and their surfaces',
    recallStem: 'What is the tail assembly of an aircraft called?',
    confusions: ['av-fuselage', 'av-vertical-stabilizer', 'av-horizontal-stabilizer'],
  },
  {
    id: 'av-cowling', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'the cowling', gloss: 'is the removable covering around the engine',
    recallStem: 'What is the removable covering around an aircraft engine called?',
    confusions: ['av-nacelle', 'av-fuselage', 'av-fairing'],
    source: 'AFPC pamphlet, Aviation Information sample item 2',
  },
  {
    id: 'av-nacelle', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'a nacelle', gloss: 'is the streamlined housing that holds an engine, separate from the fuselage',
    recallStem: 'What is the streamlined housing that carries an engine away from the fuselage called?',
    confusions: ['av-cowling', 'av-fairing', 'av-fuselage'],
  },
  {
    id: 'av-fairing', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'a fairing', gloss: 'is a non-structural cover fitted purely to smooth the airflow',
    recallStem: 'What is a non-structural cover fitted only to reduce drag called?',
    confusions: ['av-cowling', 'av-nacelle', 'av-winglet'],
  },
  {
    id: 'av-vertical-stabilizer', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'the vertical stabilizer', gloss: 'is the fixed fin that gives an aircraft directional stability',
    recallStem: 'Which part of the tail gives an aircraft its directional stability?',
    confusions: ['av-horizontal-stabilizer', 'av-rudder', 'av-empennage'],
  },
  {
    id: 'av-horizontal-stabilizer', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'the horizontal stabilizer', gloss: 'is the fixed tailplane that gives an aircraft longitudinal stability',
    recallStem: 'Which part of the tail gives an aircraft its longitudinal stability?',
    confusions: ['av-vertical-stabilizer', 'av-elevator', 'av-stabilator'],
  },
  {
    id: 'av-winglet', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'a winglet', gloss: 'reduces drag by weakening the vortex that forms at the wingtip',
    recallStem: 'Which wingtip device is fitted to reduce induced drag?',
    confusions: ['av-fairing', 'av-slat', 'av-spoiler'],
    source: 'OATTS Knowledge Check, Aircraft Function',
    why: 'A winglet weakens the wingtip vortex, which is the source of induced drag. It is a drag device, not a lift device.',
  },
  {
    id: 'av-landing-gear-tricycle', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'tricycle gear', gloss: 'places the third wheel under the nose, ahead of the main wheels',
    recallStem: 'Which landing gear arrangement puts the third wheel under the nose?',
    confusions: ['av-landing-gear-conventional'],
  },
  {
    id: 'av-landing-gear-conventional', chapter: CH, concepts: ['airframe-structure'], band: 1,
    term: 'conventional gear', gloss: 'places the third wheel at the tail, behind the main wheels',
    recallStem: 'Which landing gear arrangement puts the third wheel at the tail?',
    confusions: ['av-landing-gear-tricycle'],
  },

  // --- band 2: the primary controls, and which axis each one moves -------------------------
  {
    id: 'av-aileron', chapter: CH, concepts: ['primary-control-surfaces', 'axes-of-flight'], band: 2,
    term: 'the aileron', gloss: 'controls roll about the longitudinal axis',
    recallStem: 'Which primary control surface controls roll?',
    confusions: ['av-elevator', 'av-rudder', 'av-flaperon'],
    why: 'Ailerons are on the outer trailing edge of each wing and move in opposite directions - one up, one down - which rolls the aircraft about its nose-to-tail axis.',
  },
  {
    id: 'av-elevator', chapter: CH, concepts: ['primary-control-surfaces', 'axes-of-flight'], band: 2,
    term: 'the elevator', gloss: 'controls pitch about the lateral axis',
    recallStem: 'Which primary control surface controls pitch?',
    confusions: ['av-aileron', 'av-rudder', 'av-stabilator'],
    source: 'OATTS Knowledge Check, Aircraft Function',
    why: 'The elevator is hinged to the horizontal stabilizer and moves the nose up and down about the wingtip-to-wingtip axis.',
  },
  {
    id: 'av-rudder', chapter: CH, concepts: ['primary-control-surfaces', 'axes-of-flight'], band: 2,
    term: 'the rudder', gloss: 'controls yaw about the vertical axis',
    recallStem: 'Which primary control surface controls yaw?',
    confusions: ['av-aileron', 'av-elevator', 'av-vertical-stabilizer'],
    why: 'The rudder is hinged to the vertical stabilizer and swings the nose left and right. It does NOT turn the aircraft - ailerons do that; the rudder coordinates the turn.',
  },
  {
    id: 'av-longitudinal-axis', chapter: CH, concepts: ['axes-of-flight'], band: 2,
    term: 'the longitudinal axis', gloss: 'runs nose to tail, and is the axis an aircraft rolls about',
    recallStem: 'Which axis does an aircraft roll about?',
    confusions: ['av-lateral-axis', 'av-vertical-axis'],
  },
  {
    id: 'av-lateral-axis', chapter: CH, concepts: ['axes-of-flight'], band: 2,
    term: 'the lateral axis', gloss: 'runs wingtip to wingtip, and is the axis an aircraft pitches about',
    recallStem: 'Which axis does an aircraft pitch about?',
    confusions: ['av-longitudinal-axis', 'av-vertical-axis'],
  },
  {
    id: 'av-vertical-axis', chapter: CH, concepts: ['axes-of-flight'], band: 2,
    term: 'the vertical axis', gloss: 'runs top to bottom through the centre of gravity, and is the axis an aircraft yaws about',
    recallStem: 'Which axis does an aircraft yaw about?',
    confusions: ['av-longitudinal-axis', 'av-lateral-axis'],
  },
  {
    id: 'av-flap', chapter: CH, concepts: ['secondary-control-surfaces'], band: 2,
    term: 'a flap', gloss: 'increases both lift and drag so an aircraft can fly slower on approach',
    recallStem: 'Which surface is extended to increase lift and drag for a slower approach?',
    confusions: ['av-slat', 'av-spoiler', 'av-aileron'],
    why: 'Flaps increase camber, raising the lift the wing makes at a given speed AND the drag. The extra drag is useful: it lets you descend steeply without gaining speed.',
  },
  {
    id: 'av-slat', chapter: CH, concepts: ['secondary-control-surfaces'], band: 2,
    term: 'a slat', gloss: 'extends from the leading edge to delay the stall to a higher angle of attack',
    why: 'A slat comes out of the LEADING edge and lets the wing keep flying at a steeper angle. A flap comes out of the TRAILING edge and adds lift and drag. That is the pair people swap.',
    recallStem: 'Which leading-edge device delays the stall to a higher angle of attack?',
    confusions: ['av-flap', 'av-spoiler', 'av-slot'],
  },
  {
    id: 'av-slot', chapter: CH, concepts: ['secondary-control-surfaces'], band: 2,
    term: 'a slot', gloss: 'is a fixed gap near the leading edge that feeds high-energy air over the upper surface',
    recallStem: 'Which fixed leading-edge feature ducts air onto the upper wing surface?',
    confusions: ['av-slat', 'av-flap'],
  },
  {
    id: 'av-spoiler', chapter: CH, concepts: ['secondary-control-surfaces'], band: 2,
    term: 'a spoiler', gloss: 'destroys lift and adds drag by disrupting the airflow over the upper wing',
    recallStem: 'Which surface is raised to destroy lift and increase drag?',
    confusions: ['av-flap', 'av-slat', 'av-aileron'],
    why: 'Spoilers "spoil" the lift - used in flight to descend or slow down, and on touchdown to put the aircraft weight onto the wheels so the brakes work.',
  },
  {
    id: 'av-trim-tab', chapter: CH, concepts: ['trim-devices'], band: 2,
    term: 'a trim tab', gloss: 'holds a control surface in position so the pilot does not have to hold pressure on it',
    recallStem: 'Which device relieves the pilot of holding continuous control pressure?',
    confusions: ['av-antiservo-tab', 'av-elevator', 'av-flap'],
  },

  // --- band 3: the parts that get confused with the ones above -----------------------------
  {
    id: 'av-stabilator', chapter: CH, concepts: ['primary-control-surfaces'], band: 3,
    term: 'a stabilator', gloss: 'is a one-piece horizontal tail surface that pivots as a whole instead of having a separate elevator',
    recallStem: 'What is a one-piece pivoting horizontal tail surface called?',
    confusions: ['av-elevator', 'av-horizontal-stabilizer', 'av-antiservo-tab'],
  },
  {
    id: 'av-antiservo-tab', chapter: CH, concepts: ['trim-devices'], band: 3,
    term: 'an antiservo tab', gloss: 'moves in the same direction as the surface, to make a stabilator feel less sensitive',
    recallStem: 'Which tab moves in the same direction as the surface it is fitted to?',
    confusions: ['av-trim-tab', 'av-servo-tab', 'av-stabilator'],
    why: 'A stabilator is powerful and would be twitchy, so the antiservo tab deliberately adds resistance. A trim tab moves the OPPOSITE way; this one moves with the surface.',
  },
  {
    id: 'av-servo-tab', chapter: CH, concepts: ['trim-devices'], band: 3,
    term: 'a servo tab', gloss: 'moves opposite to the surface so the airflow does the work of deflecting it',
    recallStem: 'Which tab deflects opposite to its surface so the airflow moves the surface for you?',
    confusions: ['av-antiservo-tab', 'av-trim-tab'],
  },
  {
    id: 'av-flaperon', chapter: CH, concepts: ['secondary-control-surfaces'], band: 3,
    term: 'a flaperon', gloss: 'is a single surface that acts as both an aileron and a flap',
    recallStem: 'What is a surface that serves as both an aileron and a flap called?',
    confusions: ['av-aileron', 'av-flap', 'av-spoiler'],
  },
  {
    id: 'av-krueger-flap', chapter: CH, concepts: ['secondary-control-surfaces'], band: 3,
    term: 'a Krueger flap', gloss: 'is a leading-edge flap hinged at its front that folds down out of the lower wing surface',
    recallStem: 'Which leading-edge device folds down out of the underside of the wing?',
    confusions: ['av-slat', 'av-flap', 'av-slot'],
  },
  {
    id: 'av-adverse-yaw', chapter: CH, concepts: ['primary-control-surfaces'], band: 3,
    term: 'adverse yaw', gloss: 'is the yaw away from a turn caused by the rising wing producing more drag as well as more lift',
    recallStem: 'What is the tendency of an aircraft to yaw away from the direction of a rolled turn called?',
    confusions: ['av-rudder', 'av-differential-ailerons', 'av-dihedral'],
    why: 'The outside wing goes up because its aileron made it lift more - and more lift means more induced drag, which drags that wing back. Rudder in the direction of the turn is what corrects it.',
  },
  {
    id: 'av-differential-ailerons', chapter: CH, concepts: ['primary-control-surfaces'], band: 3,
    term: 'differential ailerons', gloss: 'deflect the up-going aileron further than the down-going one to reduce adverse yaw',
    recallStem: 'Which aileron design deflects one further than the other to reduce adverse yaw?',
    confusions: ['av-adverse-yaw', 'av-aileron', 'av-frise-aileron'],
  },
  {
    id: 'av-frise-aileron', chapter: CH, concepts: ['primary-control-surfaces'], band: 3,
    term: 'a Frise aileron', gloss: 'projects its leading edge into the airflow when raised, adding drag on the down-going wing',
    recallStem: 'Which aileron design pushes its own nose into the airstream to counter adverse yaw?',
    confusions: ['av-differential-ailerons', 'av-aileron', 'av-adverse-yaw'],
  },
  {
    id: 'av-dihedral', chapter: CH, concepts: ['airframe-structure'], band: 3,
    term: 'dihedral', gloss: 'is the upward angle of the wings from root to tip, which gives lateral stability',
    recallStem: 'What is the upward angle of the wings from root to tip called?',
    confusions: ['av-anhedral', 'av-sweep', 'av-washout'],
  },
  {
    id: 'av-anhedral', chapter: CH, concepts: ['airframe-structure'], band: 3,
    term: 'anhedral', gloss: 'is the downward angle of the wings from root to tip',
    why: 'Anhedral angles DOWN from root to tip; dihedral angles UP. Dihedral is the one that gives lateral stability, which is why almost every light aircraft has it.',
    recallStem: 'What is a downward wing angle from root to tip called?',
    confusions: ['av-dihedral', 'av-sweep', 'av-washout'],
  },
  {
    id: 'av-washout', chapter: CH, concepts: ['airframe-structure'], band: 3,
    term: 'washout', gloss: 'twists the wing so the tip has a lower angle of incidence than the root, so the root stalls first',
    recallStem: 'Which wing feature makes the root stall before the tip so the ailerons stay effective?',
    confusions: ['av-dihedral', 'av-anhedral', 'av-sweep'],
    why: 'If the tip stalled first you would lose aileron authority exactly when you needed it. Washout guarantees the root lets go first.',
  },
  {
    id: 'av-sweep', chapter: CH, concepts: ['airframe-structure'], band: 3,
    term: 'wing sweep', gloss: 'angles the wings rearward to delay the drag rise as an aircraft approaches the speed of sound',
    recallStem: 'Which wing shape delays the transonic drag rise?',
    confusions: ['av-dihedral', 'av-anhedral', 'av-aspect-ratio'],
  },
  {
    id: 'av-aspect-ratio', chapter: CH, concepts: ['airframe-structure'], band: 3,
    term: 'the aspect ratio', gloss: 'is wingspan divided by average chord - a long thin wing has a high one and less induced drag',
    recallStem: 'Which wing measurement is span divided by average chord?',
    confusions: ['av-sweep', 'av-dihedral', 'av-wing-loading-ref'],
  },
  {
    id: 'av-wing-loading-ref', chapter: CH, concepts: ['airframe-structure'], band: 3,
    term: 'wing loading', gloss: 'is aircraft weight divided by wing area',
    recallStem: 'Which measurement is aircraft weight divided by wing area?',
    confusions: ['av-aspect-ratio', 'av-sweep'],
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 1, idBase: 'av-anatomy-b1', name: 'Airframe parts' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-anatomy-b2', name: 'Controls and axes' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-anatomy-b3', name: 'Surfaces in detail' }),
];
