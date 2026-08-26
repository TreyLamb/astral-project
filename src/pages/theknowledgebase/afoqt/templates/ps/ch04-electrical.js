// Chapter 4 - Circuits, resistance and magnetism.
//
// PART 20B of docs/afoqt/HANDOFF.md. Grounded in the real OATTS bank: oatts-PS-054 (current is
// the same through every component of a series circuit), oatts-PS-055 (a better conductor like
// copper reduces resistance), oatts-PS-056 (a switch opens or closes the path for current). Same
// fact-row rules as PART 20/20B - never author the identify stem, gloss never shouts, confusions
// stay in-chapter, sample and read the output before calling this done.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-04-electrical';
const FUNDAMENTALS = ['ps-circuit-fundamentals'];
const RESISTANCE = ['ps-resistance-and-conductors'];
const COMPONENTS = ['ps-circuit-components'];
const MAGNETISM = ['ps-magnetism-and-electromagnetism'];

registerFacts([
  // ============================ BAND 2 ============================
  {
    id: 'ps-circuit', chapter: CH, concepts: FUNDAMENTALS, band: 2,
    term: 'a circuit', gloss: 'is a closed loop through which electric current can flow',
    recallStem: 'What is a closed loop through which electric current can flow called?',
    confusions: ['ps-current', 'ps-voltage'],
  },
  {
    id: 'ps-current', chapter: CH, concepts: FUNDAMENTALS, band: 2,
    term: 'electric current', gloss: 'is the flow of electric charge through a conductor, measured in amperes',
    recallStem: 'What is the flow of electric charge through a conductor called?',
    confusions: ['ps-circuit', 'ps-voltage'],
  },
  {
    id: 'ps-voltage', chapter: CH, concepts: FUNDAMENTALS, band: 2,
    term: 'voltage', gloss: 'is the electrical pressure that pushes current through a circuit, measured in volts',
    recallStem: 'What is the electrical pressure that pushes current through a circuit called?',
    confusions: ['ps-circuit', 'ps-current'],
  },
  {
    id: 'ps-conductor', chapter: CH, concepts: RESISTANCE, band: 2,
    term: 'a conductor', gloss: 'is a material that allows electric current to flow through it easily',
    recallStem: 'What is a material that allows electric current to flow through it easily called?',
    confusions: ['ps-insulator', 'ps-resistance'],
  },
  {
    id: 'ps-insulator', chapter: CH, concepts: RESISTANCE, band: 2,
    term: 'an insulator', gloss: 'is a material that strongly resists the flow of electric current through it',
    recallStem: 'What is a material that strongly resists the flow of electric current called?',
    confusions: ['ps-conductor', 'ps-resistance'],
  },
  {
    id: 'ps-resistance', chapter: CH, concepts: RESISTANCE, band: 2,
    term: 'resistance', gloss: 'is the opposition a material offers to the flow of electric current, measured in ohms',
    recallStem: 'What is the opposition a material offers to the flow of electric current called?',
    confusions: ['ps-conductor', 'ps-insulator'],
  },
  {
    id: 'ps-battery', chapter: CH, concepts: COMPONENTS, band: 2,
    term: 'a battery', gloss: 'is a component that stores chemical energy and converts it into electrical energy to power a circuit',
    recallStem: 'What component stores chemical energy and converts it into electrical energy for a circuit?',
    confusions: ['ps-wire', 'ps-switch'],
  },
  {
    id: 'ps-wire', chapter: CH, concepts: COMPONENTS, band: 2,
    term: 'a wire', gloss: 'is a conducting path that carries current between the components of a circuit',
    recallStem: 'What component carries current between the other parts of a circuit?',
    confusions: ['ps-battery', 'ps-switch'],
  },
  {
    id: 'ps-switch', chapter: CH, concepts: COMPONENTS, band: 2,
    term: 'a switch', gloss: 'opens or closes the path for current, turning a circuit off or on',
    recallStem: 'What component opens or closes the path for current in a circuit?',
    confusions: ['ps-battery', 'ps-wire'],
    source: 'OATTS',
  },
  {
    id: 'ps-magnet', chapter: CH, concepts: MAGNETISM, band: 2,
    term: 'a magnet', gloss: 'is an object that produces a magnetic field and attracts materials such as iron',
    recallStem: 'What object produces a magnetic field and attracts materials such as iron?',
    confusions: ['ps-magnetic-field', 'ps-poles'],
  },
  {
    id: 'ps-magnetic-field', chapter: CH, concepts: MAGNETISM, band: 2,
    term: 'a magnetic field', gloss: 'is the region around a magnet where its magnetic force can be detected',
    recallStem: 'What is the region around a magnet called, where its magnetic force can be detected?',
    confusions: ['ps-magnet', 'ps-poles'],
  },
  {
    id: 'ps-poles', chapter: CH, concepts: MAGNETISM, band: 2,
    term: 'a magnet\'s north and south poles', gloss: 'are the two ends where a magnet\'s force is strongest, and where opposite poles attract while like poles repel',
    recallStem: "What are the two ends of a magnet called, where its force is strongest?",
    confusions: ['ps-magnet', 'ps-magnetic-field'],
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-series-circuit', chapter: CH, concepts: FUNDAMENTALS, band: 3,
    term: 'a series circuit', gloss: 'connects components along a single path, so the same current flows through every one of them',
    recallStem: 'What kind of circuit connects components along a single path, giving them all the same current?',
    confusions: ['ps-parallel-circuit', 'ps-open-closed-circuit'],
    source: 'OATTS',
  },
  {
    id: 'ps-parallel-circuit', chapter: CH, concepts: FUNDAMENTALS, band: 3,
    term: 'a parallel circuit', gloss: 'connects components along separate branches, so current can split and take more than one path',
    recallStem: 'What kind of circuit connects components along separate branches, letting current split?',
    confusions: ['ps-series-circuit', 'ps-open-closed-circuit'],
  },
  {
    id: 'ps-open-closed-circuit', chapter: CH, concepts: FUNDAMENTALS, band: 3,
    term: 'a closed circuit', gloss: 'has a complete path for current to flow, unlike an open circuit, whose path is broken',
    recallStem: 'What kind of circuit has a complete path for current to flow?',
    confusions: ['ps-series-circuit', 'ps-parallel-circuit'],
  },
  {
    id: 'ps-conductor-reduces-resistance', chapter: CH, concepts: RESISTANCE, band: 3,
    term: 'using a better conductor', gloss: 'reduces a wire\'s resistance, since a material like copper lets electrons flow more easily than a poorer conductor',
    recallStem: "What change to a wire's material reduces its resistance?",
    confusions: ['ps-resistor', 'ps-superconductor'],
    source: 'OATTS',
  },
  {
    id: 'ps-resistor', chapter: CH, concepts: RESISTANCE, band: 3,
    term: 'a resistor', gloss: 'is a component added to a circuit specifically to limit the flow of current',
    recallStem: 'What component is added to a circuit specifically to limit current?',
    confusions: ['ps-conductor-reduces-resistance', 'ps-superconductor'],
  },
  {
    id: 'ps-superconductor', chapter: CH, concepts: RESISTANCE, band: 3,
    term: 'a superconductor', gloss: 'is a material that offers zero electrical resistance once cooled below a specific critical temperature',
    recallStem: 'What material offers zero electrical resistance once cooled below a critical temperature?',
    confusions: ['ps-conductor-reduces-resistance', 'ps-resistor'],
  },
  {
    id: 'ps-fuse', chapter: CH, concepts: COMPONENTS, band: 3,
    term: 'a fuse', gloss: 'protects a circuit by melting and breaking the current path if too much current flows through it',
    recallStem: 'What component protects a circuit by melting and breaking the path if too much current flows?',
    confusions: ['ps-capacitor', 'ps-load'],
  },
  {
    id: 'ps-capacitor', chapter: CH, concepts: COMPONENTS, band: 3,
    term: 'a capacitor', gloss: 'is a component that stores electrical energy temporarily in an electric field between two plates',
    recallStem: 'What component stores electrical energy temporarily between two plates?',
    confusions: ['ps-fuse', 'ps-load'],
  },
  {
    id: 'ps-load', chapter: CH, concepts: COMPONENTS, band: 3,
    term: 'a load', gloss: 'is any component, such as a light bulb or motor, that consumes electrical energy to do useful work',
    recallStem: 'What is any component called that consumes electrical energy to do useful work?',
    confusions: ['ps-fuse', 'ps-capacitor'],
  },
  {
    id: 'ps-electromagnet', chapter: CH, concepts: MAGNETISM, band: 3,
    term: 'an electromagnet', gloss: 'is a magnet whose field is created by current flowing through a coil of wire',
    recallStem: 'What kind of magnet has its field created by current flowing through a coil of wire?',
    confusions: ['ps-induction', 'ps-wire-field'],
  },
  {
    id: 'ps-induction', chapter: CH, concepts: MAGNETISM, band: 3,
    term: 'electromagnetic induction', gloss: 'is the process by which a changing magnetic field generates an electric current in a nearby conductor',
    recallStem: 'What process generates an electric current in a conductor from a changing magnetic field?',
    confusions: ['ps-electromagnet', 'ps-wire-field'],
  },
  {
    id: 'ps-wire-field', chapter: CH, concepts: MAGNETISM, band: 3,
    term: 'the magnetic field around a wire', gloss: 'forms in circles around any wire that is actively carrying electric current',
    recallStem: 'What forms in circles around any wire that is carrying electric current?',
    confusions: ['ps-electromagnet', 'ps-induction'],
  },

  // ============================ BAND 4 ============================
  {
    id: 'ps-ohms-law', chapter: CH, concepts: FUNDAMENTALS, band: 4,
    term: "Ohm's law", gloss: 'states that voltage equals current multiplied by resistance in a circuit',
    recallStem: 'What law states that voltage equals current multiplied by resistance?',
    confusions: ['ps-power', 'ps-schematic'],
  },
  {
    id: 'ps-power', chapter: CH, concepts: FUNDAMENTALS, band: 4,
    term: 'electrical power', gloss: 'is the rate at which a circuit converts electrical energy, measured in watts',
    recallStem: 'What is the rate at which a circuit converts electrical energy, measured in watts, called?',
    confusions: ['ps-ohms-law', 'ps-schematic'],
  },
  {
    id: 'ps-schematic', chapter: CH, concepts: FUNDAMENTALS, band: 4,
    term: 'a circuit schematic', gloss: 'is a diagram that represents a circuit\'s components and connections using standardized symbols',
    recallStem: "What kind of diagram represents a circuit's components using standardized symbols?",
    confusions: ['ps-ohms-law', 'ps-power'],
  },
  {
    id: 'ps-semiconductor', chapter: CH, concepts: RESISTANCE, band: 4,
    term: 'a semiconductor', gloss: 'is a material whose conductivity falls between that of a conductor and an insulator, and can be precisely controlled',
    recallStem: "What material's conductivity falls between that of a conductor and an insulator?",
    confusions: ['ps-resistivity', 'ps-temperature-resistance'],
  },
  {
    id: 'ps-resistivity', chapter: CH, concepts: RESISTANCE, band: 4,
    term: 'resistivity', gloss: "is a wire's inherent resistance property, which increases with the wire's length and decreases with its cross-sectional thickness",
    recallStem: "What wire property increases with length and decreases with cross-sectional thickness?",
    confusions: ['ps-semiconductor', 'ps-temperature-resistance'],
  },
  {
    id: 'ps-temperature-resistance', chapter: CH, concepts: RESISTANCE, band: 4,
    term: 'rising temperature', gloss: "generally increases a conductor's resistance, since heated atoms vibrate more and obstruct electron flow",
    recallStem: "What generally happens to a conductor's resistance as its temperature rises?",
    confusions: ['ps-semiconductor', 'ps-resistivity'],
  },
  {
    id: 'ps-diode', chapter: CH, concepts: COMPONENTS, band: 4,
    term: 'a diode', gloss: 'allows current to flow through a circuit in only one direction',
    recallStem: 'What component allows current to flow through a circuit in only one direction?',
    confusions: ['ps-transistor', 'ps-circuit-breaker'],
  },
  {
    id: 'ps-transistor', chapter: CH, concepts: COMPONENTS, band: 4,
    term: 'a transistor', gloss: 'can amplify a signal or switch current on and off using a much smaller control current',
    recallStem: 'What component can amplify a signal or switch current using a smaller control current?',
    confusions: ['ps-diode', 'ps-circuit-breaker'],
  },
  {
    id: 'ps-circuit-breaker', chapter: CH, concepts: COMPONENTS, band: 4,
    term: 'a circuit breaker', gloss: 'protects a circuit by automatically opening if current exceeds a safe level, and unlike a fuse, can be reset and reused',
    recallStem: 'What protective component opens automatically on excess current but can be reset and reused, unlike a fuse?',
    confusions: ['ps-diode', 'ps-transistor'],
  },
  {
    id: 'ps-solenoid', chapter: CH, concepts: MAGNETISM, band: 4,
    term: 'a solenoid', gloss: 'is a tightly wound coil of wire that produces a strong, uniform magnetic field along its center when carrying current',
    recallStem: 'What tightly wound coil of wire produces a strong, uniform magnetic field along its center?',
    confusions: ['ps-motor-principle', 'ps-generator-principle'],
  },
  {
    id: 'ps-motor-principle', chapter: CH, concepts: MAGNETISM, band: 4,
    term: "a motor's operating principle", gloss: 'uses the force a magnetic field exerts on a current-carrying wire to produce mechanical motion',
    recallStem: 'What principle uses the force a magnetic field exerts on a current-carrying wire to produce motion?',
    confusions: ['ps-solenoid', 'ps-generator-principle'],
  },
  {
    id: 'ps-generator-principle', chapter: CH, concepts: MAGNETISM, band: 4,
    term: "a generator's operating principle", gloss: 'uses mechanical motion of a conductor through a magnetic field to induce an electric current',
    recallStem: "What principle uses mechanical motion through a magnetic field to induce an electric current?",
    confusions: ['ps-solenoid', 'ps-motor-principle'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-electrical-b2', name: 'Circuits, resistance and magnetism' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-electrical-b3', name: 'Circuits, resistance and magnetism' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 4, idBase: 'ps-electrical-b4', name: 'Circuits, resistance and magnetism' }),
];
