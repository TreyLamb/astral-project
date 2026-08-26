// Chapter 6 - Forces, friction and simple machines.
//
// PART 21 of docs/afoqt/HANDOFF.md. The from-zero chapter of this subtest, the same role
// av-01/02 play for Aviation Information - so it is declared at bands [1, 2, 3] in
// curriculum/chapters.js, not [2, 3, 4] like every other PS chapter. Rows below follow that
// declaration, not the generic 2/3/4 guidance repeated elsewhere in this file's siblings.
//
// ⚠ Mechanics overlap with Aviation Information (see PART 19's design record in HANDOFF.md):
// av-02-forces already covers Newton's laws AS THEY APPLY TO FLIGHT - an airfoil, lift/drag/
// thrust/weight, angle of attack. Every row below is written from a general, non-aviation angle
// instead - blocks, ramps, a tug-of-war, not wings - on purpose.
//
// Grounded in the real OATTS bank: oatts-PS-060 (friction opposes a moving object's motion),
// oatts-PS-061 (a stationary tug-of-war means the net force is zero), oatts-PS-062 (an inclined
// plane reduces the force needed to lift something by increasing the distance force is applied over).

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-06-mechanics';
const NEWTONS_LAWS = ['ps-newtons-laws-general'];
const FRICTION = ['ps-friction'];
const SIMPLE_MACHINES = ['ps-simple-machines'];
const EQUILIBRIUM = ['ps-equilibrium-and-net-force'];

registerFacts([
  // ============================ BAND 1 ============================
  {
    id: 'ps-force', chapter: CH, concepts: NEWTONS_LAWS, band: 1,
    term: 'a force', gloss: 'is a push or a pull that can change an object\'s motion',
    recallStem: "What is a push or a pull that can change an object's motion called?",
    confusions: ['ps-motion', 'ps-inertia'],
  },
  {
    id: 'ps-motion', chapter: CH, concepts: NEWTONS_LAWS, band: 1,
    term: 'motion', gloss: "is a change in an object's position over time",
    recallStem: "What is a change in an object's position over time called?",
    confusions: ['ps-force', 'ps-inertia'],
  },
  {
    id: 'ps-inertia', chapter: CH, concepts: NEWTONS_LAWS, band: 1,
    term: "Newton's first law", gloss: 'states that an object at rest stays at rest, and an object in motion stays in motion, unless acted on by an outside force',
    recallStem: 'What law states that an object stays at rest or in motion unless an outside force acts on it?',
    confusions: ['ps-force', 'ps-motion'],
  },
  {
    id: 'ps-friction-basic', chapter: CH, concepts: FRICTION, band: 1,
    term: 'friction', gloss: "is a force that opposes a moving object's motion, slowing it down or stopping it over time",
    recallStem: "What force opposes a moving object's motion, slowing it down over time?",
    confusions: ['ps-rough-smooth'],
    source: 'OATTS',
  },
  {
    id: 'ps-rough-smooth', chapter: CH, concepts: FRICTION, band: 1,
    term: 'a rough surface', gloss: 'produces more friction than a smooth surface, since it grips a moving object more',
    recallStem: 'What kind of surface produces more friction than a smooth one?',
    confusions: ['ps-friction-basic'],
  },
  {
    id: 'ps-lever', chapter: CH, concepts: SIMPLE_MACHINES, band: 1,
    term: 'a lever', gloss: 'is a rigid bar that pivots on a fixed point to multiply an applied force',
    recallStem: 'What rigid bar pivots on a fixed point to multiply an applied force?',
    confusions: ['ps-inclined-plane', 'ps-wheel-axle'],
  },
  {
    id: 'ps-inclined-plane', chapter: CH, concepts: SIMPLE_MACHINES, band: 1,
    term: 'an inclined plane', gloss: 'is a flat, sloped surface that reduces the force needed to lift an object by increasing the distance the force is applied over',
    recallStem: 'What flat, sloped surface reduces the force needed to lift an object by increasing the distance?',
    confusions: ['ps-lever', 'ps-wheel-axle'],
    source: 'OATTS',
  },
  {
    id: 'ps-wheel-axle', chapter: CH, concepts: SIMPLE_MACHINES, band: 1,
    term: 'a wheel and axle', gloss: 'is a simple machine made of a large wheel fixed to a smaller rod, multiplying force as it turns',
    recallStem: 'What simple machine pairs a large wheel with a smaller fixed rod to multiply force?',
    confusions: ['ps-lever', 'ps-inclined-plane'],
  },
  {
    id: 'ps-balanced-forces', chapter: CH, concepts: EQUILIBRIUM, band: 1,
    term: 'balanced forces', gloss: 'are forces on an object that are equal in size and opposite in direction, producing no change in motion',
    recallStem: 'What are forces called that are equal in size and opposite in direction, producing no change in motion?',
    confusions: ['ps-unbalanced-forces'],
  },
  {
    id: 'ps-unbalanced-forces', chapter: CH, concepts: EQUILIBRIUM, band: 1,
    term: 'unbalanced forces', gloss: 'are forces on an object that are unequal, causing a change in its motion',
    recallStem: 'What are forces called that are unequal, causing a change in an object\'s motion?',
    confusions: ['ps-balanced-forces'],
  },

  // ============================ BAND 2 ============================
  {
    id: 'ps-second-law', chapter: CH, concepts: NEWTONS_LAWS, band: 2,
    term: "Newton's second law", gloss: 'states that an object\'s acceleration equals the net force acting on it divided by its mass',
    recallStem: "What law states that an object's acceleration equals net force divided by mass?",
    confusions: ['ps-third-law', 'ps-mass-vs-weight'],
  },
  {
    id: 'ps-third-law', chapter: CH, concepts: NEWTONS_LAWS, band: 2,
    term: "Newton's third law", gloss: 'states that for every action force, there is an equal and opposite reaction force',
    recallStem: 'What law states that for every action force, there is an equal and opposite reaction?',
    confusions: ['ps-second-law', 'ps-mass-vs-weight'],
  },
  {
    id: 'ps-mass-vs-weight', chapter: CH, concepts: NEWTONS_LAWS, band: 2,
    term: 'mass', gloss: 'is the amount of matter in an object, unlike weight, which is the force gravity exerts on that mass',
    recallStem: "What is the amount of matter in an object called, distinct from its weight?",
    confusions: ['ps-second-law', 'ps-third-law'],
  },
  {
    id: 'ps-static-friction', chapter: CH, concepts: FRICTION, band: 2,
    term: 'static friction', gloss: 'acts on an object that is not yet moving, resisting the start of motion',
    recallStem: 'What kind of friction acts on an object that is not yet moving?',
    confusions: ['ps-kinetic-friction'],
  },
  {
    id: 'ps-kinetic-friction', chapter: CH, concepts: FRICTION, band: 2,
    term: 'kinetic friction', gloss: 'acts on an object that is already moving, resisting its continued motion',
    recallStem: 'What kind of friction acts on an object that is already moving?',
    confusions: ['ps-static-friction'],
  },
  {
    id: 'ps-pulley', chapter: CH, concepts: SIMPLE_MACHINES, band: 2,
    term: 'a pulley', gloss: 'is a wheel with a grooved rim that a rope or cable runs over, changing the direction of an applied force',
    recallStem: 'What simple machine is a grooved wheel that a rope runs over, changing the direction of a force?',
    confusions: ['ps-wedge', 'ps-screw'],
  },
  {
    id: 'ps-wedge', chapter: CH, concepts: SIMPLE_MACHINES, band: 2,
    term: 'a wedge', gloss: 'is a simple machine with a thin edge, used to split or separate materials apart by force',
    recallStem: 'What simple machine has a thin edge used to split or separate materials apart?',
    confusions: ['ps-pulley', 'ps-screw'],
  },
  {
    id: 'ps-screw', chapter: CH, concepts: SIMPLE_MACHINES, band: 2,
    term: 'a screw', gloss: 'is an inclined plane wrapped around a cylinder, converting rotational force into linear force',
    recallStem: 'What simple machine is an inclined plane wrapped around a cylinder?',
    confusions: ['ps-pulley', 'ps-wedge'],
  },
  {
    id: 'ps-net-force-zero', chapter: CH, concepts: EQUILIBRIUM, band: 2,
    term: 'a net force of zero', gloss: 'is what a tug-of-war with neither side moving demonstrates, since the opposing pulls are equal and cancel out',
    recallStem: "What does a stationary tug-of-war, with neither side moving, tell you about the net force?",
    confusions: ['ps-equilibrium-ref'],
    source: 'OATTS',
  },
  {
    id: 'ps-equilibrium-ref', chapter: CH, concepts: EQUILIBRIUM, band: 2,
    term: 'equilibrium', gloss: 'is the state an object is in when all the forces acting on it are balanced',
    recallStem: 'What is the state called when all the forces acting on an object are balanced?',
    confusions: ['ps-net-force-zero'],
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-acceleration', chapter: CH, concepts: NEWTONS_LAWS, band: 3,
    term: 'acceleration', gloss: "is the rate at which an object's velocity changes over time",
    recallStem: "What is the rate at which an object's velocity changes over time called?",
    confusions: ['ps-net-force', 'ps-gravity-force'],
  },
  {
    id: 'ps-net-force', chapter: CH, concepts: NEWTONS_LAWS, band: 3,
    term: 'the net force', gloss: 'is the single combined force found by adding all the individual forces acting on an object',
    recallStem: 'What is the single combined force found by adding all forces acting on an object called?',
    confusions: ['ps-acceleration', 'ps-gravity-force'],
  },
  {
    id: 'ps-gravity-force', chapter: CH, concepts: NEWTONS_LAWS, band: 3,
    term: 'gravity', gloss: 'is the force of attraction that pulls objects with mass toward one another',
    recallStem: 'What force of attraction pulls objects with mass toward one another?',
    confusions: ['ps-acceleration', 'ps-net-force'],
  },
  {
    id: 'ps-friction-heat', chapter: CH, concepts: FRICTION, band: 3,
    term: 'heat from friction', gloss: 'is produced when two surfaces rub together, converting some of their motion energy into thermal energy',
    recallStem: 'What is produced when two surfaces rub together, converting motion energy into thermal energy?',
    confusions: ['ps-lubrication', 'ps-friction-coefficient'],
  },
  {
    id: 'ps-lubrication', chapter: CH, concepts: FRICTION, band: 3,
    term: 'lubrication', gloss: 'reduces friction between two surfaces by adding a substance, such as oil, that lets them slide past each other more easily',
    recallStem: 'What reduces friction between two surfaces by letting them slide past each other more easily?',
    confusions: ['ps-friction-heat', 'ps-friction-coefficient'],
  },
  {
    id: 'ps-friction-coefficient', chapter: CH, concepts: FRICTION, band: 3,
    term: 'the coefficient of friction', gloss: 'is a number that describes how much friction exists between two specific surfaces in contact',
    recallStem: 'What number describes how much friction exists between two specific surfaces?',
    confusions: ['ps-friction-heat', 'ps-lubrication'],
  },
  {
    id: 'ps-mechanical-advantage', chapter: CH, concepts: SIMPLE_MACHINES, band: 3,
    term: 'mechanical advantage', gloss: 'is the factor by which a simple machine multiplies an applied force',
    recallStem: 'What is the factor called by which a simple machine multiplies an applied force?',
    confusions: ['ps-effort-load', 'ps-work-unchanged'],
  },
  {
    id: 'ps-effort-load', chapter: CH, concepts: SIMPLE_MACHINES, band: 3,
    term: 'effort and load', gloss: 'are the force you apply to a simple machine and the resisting force it must overcome, respectively',
    recallStem: 'What are the applied force and the resisting force on a simple machine called, respectively?',
    confusions: ['ps-mechanical-advantage', 'ps-work-unchanged'],
  },
  {
    id: 'ps-work-unchanged', chapter: CH, concepts: SIMPLE_MACHINES, band: 3,
    term: 'the total work', gloss: 'done using a simple machine stays the same as without one - the machine trades force for distance, it does not reduce the work itself',
    recallStem: 'Does a simple machine reduce how much work is ultimately required to move a load?',
    confusions: ['ps-mechanical-advantage', 'ps-effort-load'],
  },
  {
    id: 'ps-tension', chapter: CH, concepts: EQUILIBRIUM, band: 3,
    term: 'tension', gloss: 'is the pulling force transmitted through a rope, cable, or string that is stretched taut',
    recallStem: 'What is the pulling force transmitted through a taut rope or cable called?',
    confusions: ['ps-normal-force', 'ps-static-equilibrium'],
  },
  {
    id: 'ps-normal-force', chapter: CH, concepts: EQUILIBRIUM, band: 3,
    term: 'the normal force', gloss: 'is the support force a surface exerts perpendicular to an object resting on it',
    recallStem: 'What support force does a surface exert perpendicular to an object resting on it?',
    confusions: ['ps-tension', 'ps-static-equilibrium'],
  },
  {
    id: 'ps-static-equilibrium', chapter: CH, concepts: EQUILIBRIUM, band: 3,
    term: 'static equilibrium', gloss: 'describes a structure at rest where all forces and rotational effects acting on it are perfectly balanced',
    recallStem: 'What describes a structure at rest where all forces and rotational effects are perfectly balanced?',
    confusions: ['ps-tension', 'ps-normal-force'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 1, idBase: 'ps-mechanics-b1', name: 'Forces, friction and simple machines' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-mechanics-b2', name: 'Forces, friction and simple machines' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-mechanics-b3', name: 'Forces, friction and simple machines' }),
];
