// Chapter 3 - Stalls, spins and load factor.
//
// The chapter that carries the single most-tested misconception in aviation: a stall is an ANGLE
// OF ATTACK event, not an airspeed event. An aircraft can stall at any speed and any attitude,
// and every wrong answer built around "flying too slowly" trades on people not knowing that.
//
// The numbers in the load-factor section are worth memorising because they are exact and the
// test likes exact: 60 degrees of bank is 2.0 G, and stall speed goes up by the square root of
// load factor, which makes it 41% higher in that same 60-degree turn.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-03-stalls';

registerFacts([
  // --- band 2: what a stall actually is -----------------------------------------------------
  {
    id: 'av-critical-aoa', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'the critical angle of attack', gloss: 'is the angle beyond which the airflow separates and the wing stalls',
    recallStem: 'Beyond which angle does a wing always stall, regardless of speed?',
    confusions: ['av-stall-speed', 'av-angle-of-attack-3', 'av-airflow-separation'],
    why: 'It is a fixed angle for a given wing. Speed, weight and attitude do not change it - which is why a wing can stall at any airspeed.',
  },
  {
    id: 'av-angle-of-attack-3', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'angle of attack', gloss: 'is the one thing that determines whether a wing is stalled',
    confusions: ['av-stall-speed', 'av-critical-aoa', 'av-airflow-separation'],
    why: 'Not airspeed, not attitude, not weight. Exceed the critical angle of attack and the wing stalls; stay below it and it does not.',
  },
  {
    id: 'av-airflow-separation', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'airflow separation', gloss: 'is the breakaway of the smooth flow from the upper wing surface that destroys lift',
    recallStem: 'What is the breakdown of smooth airflow over the upper wing surface called?',
    confusions: ['av-critical-aoa', 'av-buffet', 'av-stall-speed'],
  },
  {
    id: 'av-buffet', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'buffet', gloss: 'is the airframe shaking caused by separated air striking the tail, and it warns of an approaching stall',
    recallStem: 'What is the pre-stall airframe shaking called?',
    confusions: ['av-airflow-separation', 'av-stall-warning-horn', 'av-stall-strip'],
  },
  {
    id: 'av-stall-warning-horn', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'the stall warning system', gloss: 'is triggered by a vane or tab on the wing leading edge a few knots before the stall',
    confusions: ['av-buffet', 'av-stall-strip', 'av-airflow-separation'],
  },
  {
    id: 'av-stall-strip', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'a stall strip', gloss: 'is a small leading-edge wedge fitted to make the wing root stall before the tip',
    recallStem: 'Which leading-edge fitting forces the wing root to stall first?',
    confusions: ['av-stall-warning-horn', 'av-buffet', 'av-stall-recovery'],
    why: 'Same purpose as washout: keep the tips flying so the ailerons still work while the root has let go.',
  },
  {
    id: 'av-stall-recovery', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'reducing the angle of attack', gloss: 'is the first and essential action in recovering from any stall',
    confusions: ['av-critical-aoa', 'av-stall-speed', 'av-spin-recovery'],
    why: 'Lower the nose. Adding power helps the recovery but does not by itself un-stall the wing - only reducing the angle of attack does that.',
  },
  {
    id: 'av-stall-speed', chapter: CH, concepts: ['stall-aerodynamics'], band: 2,
    term: 'stall speed', gloss: 'is the speed at which a wing reaches its critical angle of attack in level flight at a given weight',
    confusions: ['av-critical-aoa', 'av-angle-of-attack-3'],
    why: 'Note the qualifiers. It is only that speed in LEVEL flight at THAT weight - bank the aircraft or load it more heavily and the number changes.',
  },

  // --- band 3: spins ------------------------------------------------------------------------
  {
    id: 'av-spin', chapter: CH, concepts: ['spin-mechanics'], band: 3,
    term: 'a spin', gloss: 'is an aggravated stall in which the aircraft descends in a corkscrew path',
    recallStem: 'What is an aggravated stall with autorotation called?',
    confusions: ['av-spiral-dive', 'av-incipient-spin', 'av-slip'],
  },
  {
    id: 'av-spin-cause', chapter: CH, concepts: ['spin-mechanics'], band: 3,
    term: 'a stall with yaw', gloss: 'is the combination required to enter a spin - one wing more stalled than the other',
    confusions: ['av-spin', 'av-spiral-dive', 'av-slip'],
    why: 'Two ingredients, and you need both: the wing must be stalled AND there must be yaw. Uncoordinated flight near the stall is the classic setup.',
  },
  {
    id: 'av-incipient-spin', chapter: CH, concepts: ['spin-mechanics'], band: 3,
    term: 'the incipient phase', gloss: 'is the first part of a spin, before the rotation and descent rate have stabilised',
    recallStem: 'Which phase of a spin comes before it becomes fully developed?',
    confusions: ['av-spin', 'av-spin-recovery', 'av-spiral-dive'],
  },
  {
    id: 'av-spin-recovery', chapter: CH, concepts: ['spin-mechanics'], band: 3,
    term: 'opposite rudder then forward elevator', gloss: 'is the control sequence that stops the rotation and then breaks the stall',
    confusions: ['av-stall-recovery', 'av-spin-cause', 'av-spiral-dive'],
    why: 'Power idle, ailerons neutral, FULL OPPOSITE RUDDER, then elevator forward. Rudder first: breaking the stall while still yawing just starts a new spin.',
  },
  {
    id: 'av-spiral-dive', chapter: CH, concepts: ['spin-mechanics'], band: 3,
    term: 'a spiral dive', gloss: 'looks like a spin but the wing is not stalled, and the airspeed builds rapidly',
    recallStem: 'Which manoeuvre resembles a spin but has an unstalled wing and rising airspeed?',
    confusions: ['av-spin', 'av-incipient-spin', 'av-spin-cause'],
    why: 'The tell is the airspeed. A spin holds a low, roughly constant speed; a spiral dive accelerates, and pulling on the controls only tightens it.',
  },
  {
    id: 'av-slip', chapter: CH, concepts: ['spin-mechanics'], band: 3,
    term: 'a slip', gloss: 'is uncoordinated flight in which the aircraft moves toward the inside of the turn',
    recallStem: 'What is uncoordinated flight toward the inside of a turn called?',
    confusions: ['av-skid', 'av-spin-cause'],
  },
  {
    id: 'av-skid', chapter: CH, concepts: ['spin-mechanics'], band: 3,
    term: 'a skid', gloss: 'is uncoordinated flight in which the aircraft slides toward the outside of the turn',
    recallStem: 'What is uncoordinated flight toward the outside of a turn called?',
    confusions: ['av-slip', 'av-spin-cause'],
    why: 'A skidding turn near the stall is the classic base-to-final spin entry, because the inside wing stalls first and drops into the turn.',
  },

  // --- band 4: load factor, where the numbers are exact --------------------------------------
  {
    id: 'av-load-factor', chapter: CH, concepts: ['load-factor'], band: 4,
    term: 'load factor', gloss: 'is the ratio of the load the wings carry to the actual weight of the aircraft',
    recallStem: 'Which quantity is the ratio of wing load to aircraft weight?',
    confusions: ['av-limit-load', 'av-wing-loading-4', 'av-bank-60'],
  },
  {
    id: 'av-bank-60', chapter: CH, concepts: ['load-factor'], band: 4,
    identify: false,
    term: '2.0 G', gloss: 'is the load factor in a level 60-degree banked turn',
    recallStem: 'Which load factor corresponds to a level 60-degree banked turn?',
    confusions: ['av-bank-30', 'av-bank-45', 'av-limit-load'],
    why: 'Load factor is 1/cos(bank). cos 60 = 0.5, so the answer is exactly 2. This is the one number to have memorised.',
  },
  {
    id: 'av-bank-30', chapter: CH, concepts: ['load-factor'], band: 4,
    term: 'about 1.15 G', gloss: 'is the load factor in a level 30-degree banked turn',
    confusions: ['av-bank-60', 'av-bank-45'],
  },
  {
    id: 'av-bank-45', chapter: CH, concepts: ['load-factor'], band: 4,
    term: 'about 1.41 G', gloss: 'is the load factor in a level 45-degree banked turn',
    confusions: ['av-bank-60', 'av-bank-30'],
  },
  {
    id: 'av-stall-speed-turn', chapter: CH, concepts: ['load-factor'], band: 4,
    term: 'about 41 percent higher', gloss: 'is how much the stall speed rises in a level 60-degree banked turn',
    confusions: ['av-bank-60', 'av-limit-load', 'av-maneuvering-speed'],
    why: 'Stall speed rises with the SQUARE ROOT of load factor. At 2 G that is the square root of 2, about 1.41 - so 41 percent higher.',
  },
  {
    id: 'av-accelerated-stall', chapter: CH, concepts: ['load-factor'], band: 4,
    term: 'an accelerated stall', gloss: 'is a stall that happens above the published stall speed because load factor has been increased',
    recallStem: 'What is a stall caused by increased load factor rather than low speed called?',
    confusions: ['av-stall-speed-turn', 'av-load-factor', 'av-maneuvering-speed'],
  },
  {
    id: 'av-maneuvering-speed', chapter: CH, concepts: ['maneuvering-speed'], band: 4,
    term: 'maneuvering speed', gloss: 'is the highest speed at which full deflection of a control will stall the wing before it breaks anything',
    recallStem: 'Which speed is the maximum for abrupt full control deflection?',
    confusions: ['av-limit-load', 'av-accelerated-stall', 'av-turbulence-penetration'],
    why: 'It goes DOWN as the aircraft gets lighter, which is the counter-intuitive part - a lighter aircraft accelerates to a damaging load factor more easily.',
  },
  {
    id: 'av-turbulence-penetration', chapter: CH, concepts: ['maneuvering-speed'], band: 4,
    term: 'slowing to maneuvering speed', gloss: 'is the correct response to encountering severe turbulence',
    confusions: ['av-maneuvering-speed', 'av-limit-load'],
  },
  {
    id: 'av-limit-load', chapter: CH, concepts: ['load-factor'], band: 4,
    term: 'the limit load factor', gloss: 'is the maximum load an airframe is certified to carry without permanent deformation',
    recallStem: 'Which limit is the maximum certified load before permanent deformation?',
    confusions: ['av-load-factor', 'av-maneuvering-speed', 'av-wing-loading-4'],
  },
  {
    id: 'av-wing-loading-4', chapter: CH, concepts: ['load-factor'], band: 4,
    term: 'wing loading', gloss: 'is weight divided by wing area, and a higher figure means a rougher stall but a smoother ride',
    confusions: ['av-load-factor', 'av-limit-load'],
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-stalls-b2', name: 'What a stall is' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-stalls-b3', name: 'Spins' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-stalls-b4', name: 'Load factor' }),
];
