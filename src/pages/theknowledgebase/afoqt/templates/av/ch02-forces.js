// Chapter 2 - The four forces, and how a wing actually makes lift.
//
// Two official AFOQT items sit squarely in this chapter and set the level:
//   "The rearward retarding force of airplane drag is opposed by" -> thrust
//   "The angle formed by the chord of an airfoil and the direction of the relative wind is
//    called the" -> angle of attack
// Both are vocabulary questions wearing physics clothing. That is the register: know which word
// names which thing, and which pairs oppose each other.
//
// The angle-of-attack / angle-of-incidence confusion is the single most reliable trap in the
// whole subtest and is declared on both rows.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-02-forces';

registerFacts([
  // --- band 1: the four forces and what opposes what ---------------------------------------
  {
    id: 'av-lift', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'lift', gloss: 'is the upward force produced by the wings, opposing weight',
    recallStem: 'Which of the four forces acts upward and opposes weight?',
    confusions: ['av-weight', 'av-thrust', 'av-drag'],
  },
  {
    id: 'av-weight', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'weight', gloss: 'is the downward force of gravity acting through the centre of gravity',
    recallStem: 'The downward force acting on an aircraft is called what?',
    confusions: ['av-lift', 'av-drag', 'av-thrust'],
    source: 'OATTS Knowledge Check',
  },
  {
    id: 'av-thrust', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'thrust', gloss: 'is the forward force produced by the engine and propeller, opposing drag',
    recallStem: 'Which of the four forces acts forward and opposes drag?',
    confusions: ['av-drag', 'av-lift', 'av-weight'],
    source: 'AFPC pamphlet, Aviation Information sample item 1',
  },
  {
    id: 'av-drag', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'drag', gloss: 'is the rearward retarding force produced by moving through the air',
    recallStem: 'Which of the four forces acts rearward and opposes thrust?',
    confusions: ['av-thrust', 'av-weight', 'av-lift'],
  },
  {
    id: 'av-unaccelerated-flight', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'straight-and-level unaccelerated flight', gloss: 'is the condition in which lift equals weight and thrust equals drag',
    recallStem: 'In which flight condition are all four forces in balance?',
    confusions: ['av-climb-forces', 'av-stall-basic'],
  },
  {
    id: 'av-climb-forces', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'a climb', gloss: 'requires thrust greater than drag, and is limited by excess power rather than by lift',
    confusions: ['av-unaccelerated-flight', 'av-thrust'],
    why: 'A common misconception is that a climb comes from extra lift. In a steady climb lift is actually slightly LESS than weight - what buys you the climb is surplus thrust.',
  },
  {
    id: 'av-stall-basic', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'a stall', gloss: 'is the loss of lift that happens when the wing exceeds its critical angle of attack',
    recallStem: 'What is the loss of lift caused by exceeding the critical angle of attack called?',
    confusions: ['av-unaccelerated-flight', 'av-climb-forces'],
  },
  {
    id: 'av-centre-of-gravity', chapter: CH, concepts: ['four-forces'], band: 1,
    term: 'the centre of gravity', gloss: 'is the point through which the entire weight of an aircraft is considered to act',
    recallStem: 'Through which point is the whole weight of an aircraft considered to act?',
    confusions: ['av-centre-of-pressure', 'av-weight'],
  },

  // --- band 2: the shape of a wing ----------------------------------------------------------
  {
    id: 'av-airfoil', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'an airfoil', gloss: 'is any surface shaped to produce a useful aerodynamic force from the air flowing over it',
    recallStem: 'What is any surface shaped to generate aerodynamic force called?',
    confusions: ['av-chord-line', 'av-camber', 'av-planform'],
  },
  {
    id: 'av-chord-line', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'the chord line', gloss: 'is the straight line drawn from the leading edge to the trailing edge of an airfoil',
    recallStem: 'Which line runs straight from the leading edge to the trailing edge?',
    confusions: ['av-camber', 'av-mean-camber-line', 'av-relative-wind'],
  },
  {
    id: 'av-mean-camber-line', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'the mean camber line', gloss: 'is the line drawn halfway between the upper and lower surfaces of an airfoil',
    recallStem: 'Which line runs midway between the upper and lower surfaces of an airfoil?',
    confusions: ['av-chord-line', 'av-camber'],
  },
  {
    id: 'av-camber', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'camber', gloss: 'is the curvature of an airfoil, and more of it means more lift at a given angle of attack',
    recallStem: 'What is the curvature of an airfoil surface called?',
    confusions: ['av-chord-line', 'av-mean-camber-line', 'av-planform'],
  },
  {
    id: 'av-relative-wind', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'the relative wind', gloss: 'is the airflow as the wing meets it, always directly opposite the flight path',
    recallStem: 'What is the airflow opposite the flight path of the wing called?',
    confusions: ['av-chord-line', 'av-angle-of-attack', 'av-downwash'],
  },
  {
    id: 'av-angle-of-attack', chapter: CH, concepts: ['airfoil-geometry', 'lift-and-drag'], band: 2,
    term: 'angle of attack', gloss: 'is the angle between the chord line and the relative wind',
    recallStem: 'Which angle is measured between the chord line and the relative wind?',
    confusions: ['av-angle-of-incidence', 'av-pitch-attitude', 'av-relative-wind'],
    source: 'AFPC pamphlet, Aviation Information sample item 5',
    why: 'Angle of ATTACK is between the chord line and the relative wind, and it changes moment to moment. Angle of INCIDENCE is between the chord line and the fuselage, and it is fixed when the aircraft is built. This pair is the most reliable trap on the subtest.',
  },
  {
    id: 'av-angle-of-incidence', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'angle of incidence', gloss: 'is the fixed angle at which the wing is mounted to the fuselage',
    recallStem: 'Which angle is built in when the wing is mounted and never changes in flight?',
    confusions: ['av-angle-of-attack', 'av-pitch-attitude'],
    why: 'Fixed at the factory. If the question mentions the relative wind, the answer is angle of ATTACK instead.',
  },
  {
    id: 'av-pitch-attitude', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'pitch attitude', gloss: 'is the angle between the aircraft and the horizon, which is not the same as angle of attack',
    recallStem: 'Which angle is measured between the aircraft and the horizon?',
    confusions: ['av-angle-of-attack', 'av-angle-of-incidence'],
    why: 'You can be nose-high with a low angle of attack, or nose-low and stalled. Attitude is against the horizon; angle of attack is against the relative wind.',
  },
  {
    id: 'av-centre-of-pressure', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'the centre of pressure', gloss: 'is the point on the chord where the total lift of the airfoil is considered to act',
    recallStem: 'At which point on the chord is the total lift of a wing considered to act?',
    confusions: ['av-centre-of-gravity', 'av-chord-line'],
  },
  {
    id: 'av-planform', chapter: CH, concepts: ['airfoil-geometry'], band: 2,
    term: 'the planform', gloss: 'is the shape of a wing as seen from directly above',
    recallStem: 'What is the shape of the wing viewed from above called?',
    confusions: ['av-camber', 'av-airfoil'],
  },

  // --- band 3: lift, drag, and the things that trade off ------------------------------------
  {
    id: 'av-bernoulli', chapter: CH, concepts: ['lift-and-drag'], band: 3,
    term: "Bernoulli's principle", gloss: 'states that as the velocity of a fluid increases, its static pressure decreases',
    recallStem: 'Which principle states that increasing a fluid velocity lowers its pressure?',
    confusions: ['av-newton-third', 'av-venturi', 'av-downwash'],
  },
  {
    id: 'av-newton-third', chapter: CH, concepts: ['lift-and-drag'], band: 3,
    term: "Newton's third law", gloss: 'explains lift as the reaction to the wing deflecting a mass of air downward',
    recallStem: 'Which law explains lift as the equal and opposite reaction to deflected air?',
    confusions: ['av-bernoulli', 'av-venturi', 'av-downwash'],
    why: 'Both explanations are correct and both are examinable. Bernoulli is about pressure difference; Newton is about deflected air mass.',
  },
  {
    id: 'av-venturi', chapter: CH, concepts: ['lift-and-drag'], band: 3,
    term: 'the venturi effect', gloss: 'is the speed-up and pressure drop of air forced through a constriction',
    recallStem: 'What is the acceleration and pressure drop through a constriction called?',
    confusions: ['av-bernoulli', 'av-newton-third'],
  },
  {
    id: 'av-downwash', chapter: CH, concepts: ['lift-and-drag'], band: 3,
    term: 'downwash', gloss: 'is the mass of air deflected downward behind a wing that is producing lift',
    recallStem: 'What is the downward-deflected air behind a lifting wing called?',
    confusions: ['av-wingtip-vortices', 'av-newton-third', 'av-induced-drag'],
  },
  {
    id: 'av-induced-drag', chapter: CH, concepts: ['drag-types'], band: 3,
    term: 'induced drag', gloss: 'is the drag created as a by-product of producing lift, and it is greatest at low speed',
    recallStem: 'Which type of drag increases as airspeed decreases?',
    confusions: ['av-parasite-drag', 'av-form-drag', 'av-skin-friction'],
    why: 'Induced drag is highest slow and lowest fast; parasite drag is the opposite. Where the two curves cross is the best lift-to-drag speed.',
  },
  {
    id: 'av-parasite-drag', chapter: CH, concepts: ['drag-types'], band: 3,
    term: 'parasite drag', gloss: 'is the drag of simply moving the airframe through the air, and it grows with the square of speed',
    recallStem: 'Which type of drag increases as airspeed increases?',
    confusions: ['av-induced-drag', 'av-form-drag', 'av-interference-drag'],
  },
  {
    id: 'av-form-drag', chapter: CH, concepts: ['drag-types'], band: 3,
    term: 'form drag', gloss: 'is the part of parasite drag caused purely by the shape of a component',
    recallStem: 'Which component of parasite drag comes from the shape of the structure?',
    confusions: ['av-skin-friction', 'av-interference-drag', 'av-parasite-drag'],
  },
  {
    id: 'av-skin-friction', chapter: CH, concepts: ['drag-types'], band: 3,
    term: 'skin friction drag', gloss: 'is the part of parasite drag caused by air rubbing against the surface of the aircraft',
    recallStem: 'Which component of parasite drag comes from air dragging along the skin?',
    confusions: ['av-form-drag', 'av-interference-drag', 'av-boundary-layer'],
  },
  {
    id: 'av-interference-drag', chapter: CH, concepts: ['drag-types'], band: 3,
    term: 'interference drag', gloss: 'is the extra drag produced where two airflows meet, such as at a wing root',
    recallStem: 'Which drag arises where two separate airflows join, such as at a wing root?',
    confusions: ['av-form-drag', 'av-skin-friction', 'av-parasite-drag'],
  },
  {
    id: 'av-wingtip-vortices', chapter: CH, concepts: ['drag-types'], band: 3,
    term: 'wingtip vortices', gloss: 'are the spiralling airflows formed where high pressure below the wing escapes around the tip',
    recallStem: 'What is the spiralling flow around a wingtip called?',
    confusions: ['av-downwash', 'av-induced-drag', 'av-ground-effect'],
    why: 'Strongest when the aircraft is heavy, slow and clean - which is exactly the takeoff and landing configuration, and why wake turbulence separation exists.',
  },
  {
    id: 'av-ground-effect', chapter: CH, concepts: ['wing-performance'], band: 3,
    term: 'ground effect', gloss: 'is the reduction in induced drag within about one wingspan of the surface',
    recallStem: 'What is the reduction in induced drag close to the surface called?',
    confusions: ['av-induced-drag', 'av-wingtip-vortices', 'av-boundary-layer'],
    why: 'The ground interrupts the wingtip vortices, so induced drag falls. It is why an overloaded aircraft can get airborne and then refuse to climb out of it.',
  },
  {
    id: 'av-boundary-layer', chapter: CH, concepts: ['wing-performance'], band: 3,
    term: 'the boundary layer', gloss: 'is the thin band of air immediately against the surface that is slowed by friction',
    recallStem: 'What is the thin layer of air slowed by friction at the surface called?',
    confusions: ['av-skin-friction', 'av-downwash', 'av-ground-effect'],
  },
  {
    id: 'av-ld-ratio', chapter: CH, concepts: ['wing-performance'], band: 3,
    term: 'the lift-to-drag ratio', gloss: 'is a measure of aerodynamic efficiency, and its maximum gives the best glide',
    recallStem: 'Which ratio is maximised at the best glide speed?',
    confusions: ['av-induced-drag', 'av-parasite-drag', 'av-wing-loading-2'],
  },
  {
    id: 'av-wing-loading-2', chapter: CH, concepts: ['wing-performance'], band: 3,
    term: 'high wing loading', gloss: 'gives a smoother ride in turbulence but a higher stall speed',
    confusions: ['av-ld-ratio', 'av-ground-effect'],
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 1, idBase: 'av-forces-b1', name: 'The four forces' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-forces-b2', name: 'Airfoil geometry' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-forces-b3', name: 'Lift and drag' }),
];
