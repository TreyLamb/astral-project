// Chapter 8 - Heat, temperature and the laws of thermodynamics.
//
// PART 21B of docs/afoqt/HANDOFF.md. The second of the two 3-concept chapters. Grounded in the
// real OATTS bank: oatts-PS-067 (conduction - direct-contact heat transfer), oatts-PS-068 (the
// first law of thermodynamics is conservation of energy), oatts-PS-069 (heating makes particles
// move faster and spread farther apart).
//
// `ps-thermal-expansion-phase-change` rows below deliberately stay on the HEAT/PARTICLE-MOTION
// mechanism behind expansion and phase change, not on re-defining melting/freezing/boiling
// themselves - those are already `ps-states-of-matter` facts in ch03-chemistry.js, and repeating
// them here under a different id would be exactly the redundant-teaching problem the av-02/
// ps-06-mechanics overlap note in PART 19's design record warns about, just one chapter over.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-08-thermodynamics';
const HEAT_TRANSFER = ['ps-heat-transfer-methods'];
const LAWS = ['ps-laws-of-thermodynamics'];
const EXPANSION_PHASE = ['ps-thermal-expansion-phase-change'];

registerFacts([
  // ============================ BAND 2 ============================
  {
    id: 'ps-conduction', chapter: CH, concepts: HEAT_TRANSFER, band: 2,
    term: 'conduction', gloss: 'is the transfer of heat through direct contact between particles, and works most effectively in solids',
    recallStem: 'What is the transfer of heat through direct contact between particles called?',
    confusions: ['ps-convection', 'ps-radiation-heat'],
    source: 'OATTS',
  },
  {
    id: 'ps-convection', chapter: CH, concepts: HEAT_TRANSFER, band: 2,
    term: 'convection', gloss: 'is the transfer of heat through the movement of a fluid, such as rising warm air or water',
    recallStem: 'What is the transfer of heat through the movement of a fluid, such as air or water, called?',
    confusions: ['ps-conduction', 'ps-radiation-heat'],
  },
  {
    id: 'ps-radiation-heat', chapter: CH, concepts: HEAT_TRANSFER, band: 2,
    term: 'radiation', gloss: 'is the transfer of heat through electromagnetic waves, requiring no medium at all, as from the Sun to Earth',
    recallStem: 'What is the transfer of heat through electromagnetic waves, needing no medium, called?',
    confusions: ['ps-conduction', 'ps-convection'],
  },
  {
    id: 'ps-temperature', chapter: CH, concepts: LAWS, band: 2,
    term: 'temperature', gloss: 'measures the average kinetic energy of the particles in a substance',
    recallStem: 'What measures the average kinetic energy of the particles in a substance?',
    confusions: ['ps-thermal-energy', 'ps-heat-def'],
  },
  {
    id: 'ps-thermal-energy', chapter: CH, concepts: LAWS, band: 2,
    term: 'thermal energy', gloss: 'is the total kinetic energy of all the particles in a substance combined',
    recallStem: 'What is the total kinetic energy of all the particles in a substance called?',
    confusions: ['ps-temperature', 'ps-heat-def'],
  },
  {
    id: 'ps-heat-def', chapter: CH, concepts: LAWS, band: 2,
    term: 'heat', gloss: 'is thermal energy actually flowing from a warmer object to a cooler one',
    recallStem: 'What is thermal energy flowing from a warmer object to a cooler one called?',
    confusions: ['ps-temperature', 'ps-thermal-energy'],
  },
  {
    id: 'ps-thermal-expansion', chapter: CH, concepts: EXPANSION_PHASE, band: 2,
    term: 'thermal expansion', gloss: "is matter increasing in size as it is heated, because its particles move faster and spread farther apart",
    recallStem: 'What is it called when matter increases in size as it is heated?',
    confusions: ['ps-thermal-contraction', 'ps-particle-kinetic-heat'],
    source: 'OATTS',
  },
  {
    id: 'ps-thermal-contraction', chapter: CH, concepts: EXPANSION_PHASE, band: 2,
    term: 'thermal contraction', gloss: 'is matter decreasing in size as it is cooled, because its particles slow down and pack closer together',
    recallStem: 'What is it called when matter decreases in size as it is cooled?',
    confusions: ['ps-thermal-expansion', 'ps-particle-kinetic-heat'],
  },
  {
    id: 'ps-particle-kinetic-heat', chapter: CH, concepts: EXPANSION_PHASE, band: 2,
    term: "heating a substance", gloss: "gives its particles more kinetic energy, making them move faster and, in most cases, spread farther apart",
    recallStem: "What happens to a substance's particles when it is heated?",
    confusions: ['ps-thermal-expansion', 'ps-thermal-contraction'],
    source: 'OATTS',
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-conductor-insulator-thermal', chapter: CH, concepts: HEAT_TRANSFER, band: 3,
    term: 'a thermal insulator', gloss: 'resists the flow of heat, unlike a thermal conductor, which transfers it readily',
    recallStem: 'What kind of material resists the flow of heat, unlike a thermal conductor?',
    confusions: ['ps-convection-current', 'ps-heat-vs-temp'],
  },
  {
    id: 'ps-convection-current', chapter: CH, concepts: HEAT_TRANSFER, band: 3,
    term: 'a convection current', gloss: 'is the circular flow that forms when warm fluid rises and cooler fluid sinks to replace it',
    recallStem: 'What circular flow forms when warm fluid rises and cooler fluid sinks to replace it?',
    confusions: ['ps-conductor-insulator-thermal', 'ps-heat-vs-temp'],
  },
  {
    id: 'ps-heat-vs-temp', chapter: CH, concepts: HEAT_TRANSFER, band: 3,
    term: 'heat and temperature', gloss: 'are distinct - heat is total energy transferred, while temperature is the average energy per particle',
    recallStem: 'How do heat and temperature differ as physical quantities?',
    confusions: ['ps-conductor-insulator-thermal', 'ps-convection-current'],
  },
  {
    id: 'ps-first-law', chapter: CH, concepts: LAWS, band: 3,
    term: 'the first law of thermodynamics', gloss: 'states that energy cannot be created or destroyed, only converted from one form to another',
    recallStem: 'What law states that energy cannot be created or destroyed, only converted between forms?',
    confusions: ['ps-second-law-thermo', 'ps-zeroth-law'],
    source: 'OATTS',
  },
  {
    id: 'ps-second-law-thermo', chapter: CH, concepts: LAWS, band: 3,
    term: 'the second law of thermodynamics', gloss: 'states that heat flows spontaneously from a warmer object to a cooler one, never the reverse',
    recallStem: 'What law states that heat flows spontaneously from a warmer object to a cooler one?',
    confusions: ['ps-first-law', 'ps-zeroth-law'],
  },
  {
    id: 'ps-zeroth-law', chapter: CH, concepts: LAWS, band: 3,
    term: 'the zeroth law of thermodynamics', gloss: 'states that if two objects are each in thermal equilibrium with a third, they are in thermal equilibrium with each other',
    recallStem: 'What law states that two objects each in thermal equilibrium with a third are in equilibrium with each other?',
    confusions: ['ps-first-law', 'ps-second-law-thermo'],
  },
  {
    id: 'ps-latent-heat', chapter: CH, concepts: EXPANSION_PHASE, band: 3,
    term: 'latent heat', gloss: 'is the energy absorbed or released during a phase change, without any change in temperature',
    recallStem: 'What is the energy absorbed or released during a phase change, without a temperature change, called?',
    confusions: ['ps-expansion-joint', 'ps-gas-expansion'],
  },
  {
    id: 'ps-expansion-joint', chapter: CH, concepts: EXPANSION_PHASE, band: 3,
    term: 'an expansion joint', gloss: 'is a gap built into a bridge or roadway specifically to allow room for thermal expansion',
    recallStem: 'What is a gap built into a bridge or roadway to allow room for thermal expansion called?',
    confusions: ['ps-latent-heat', 'ps-gas-expansion'],
  },
  {
    id: 'ps-gas-expansion', chapter: CH, concepts: EXPANSION_PHASE, band: 3,
    term: 'a gas', gloss: 'expands far more than a solid or liquid for the same rise in temperature, since its particles are already loosely bound',
    recallStem: 'Which state of matter expands the most for a given rise in temperature?',
    confusions: ['ps-latent-heat', 'ps-expansion-joint'],
  },

  // ============================ BAND 4 ============================
  {
    id: 'ps-thermal-equilibrium', chapter: CH, concepts: HEAT_TRANSFER, band: 4,
    term: 'thermal equilibrium', gloss: 'is the state two objects reach when heat stops flowing between them because they have reached the same temperature',
    recallStem: 'What state do two objects reach when heat stops flowing because they share the same temperature?',
    confusions: ['ps-specific-heat', 'ps-radiative-transfer-detail'],
  },
  {
    id: 'ps-specific-heat', chapter: CH, concepts: HEAT_TRANSFER, band: 4,
    term: 'specific heat capacity', gloss: 'is the amount of energy needed to raise one unit of a substance\'s mass by one degree of temperature',
    recallStem: "What is the energy needed to raise one unit of a substance's mass by one degree of temperature called?",
    confusions: ['ps-thermal-equilibrium', 'ps-radiative-transfer-detail'],
  },
  {
    id: 'ps-radiative-transfer-detail', chapter: CH, concepts: HEAT_TRANSFER, band: 4,
    term: 'radiative heat transfer', gloss: 'travels chiefly as infrared electromagnetic waves, which is why radiant heat can be felt from a distance without any contact',
    recallStem: "What form of electromagnetic wave carries most of the Sun's heat to Earth?",
    confusions: ['ps-thermal-equilibrium', 'ps-specific-heat'],
  },
  {
    id: 'ps-third-law-thermo', chapter: CH, concepts: LAWS, band: 4,
    term: 'the third law of thermodynamics', gloss: "states that a system's entropy approaches a constant minimum as its temperature approaches absolute zero",
    recallStem: "What law states that a system's entropy approaches a minimum as its temperature approaches absolute zero?",
    confusions: ['ps-entropy', 'ps-heat-engine'],
  },
  {
    id: 'ps-entropy', chapter: CH, concepts: LAWS, band: 4,
    term: 'entropy', gloss: 'measures the disorder of a system, and tends to increase over time in an isolated system',
    recallStem: 'What measures the disorder of a system, and tends to increase over time when isolated?',
    confusions: ['ps-third-law-thermo', 'ps-heat-engine'],
  },
  {
    id: 'ps-heat-engine', chapter: CH, concepts: LAWS, band: 4,
    term: 'a heat engine', gloss: 'converts thermal energy into mechanical work, but can never convert all of that heat into work, per the second law',
    recallStem: 'What device converts thermal energy into mechanical work, though never with perfect efficiency?',
    confusions: ['ps-third-law-thermo', 'ps-entropy'],
  },
  {
    id: 'ps-bimetallic-strip', chapter: CH, concepts: EXPANSION_PHASE, band: 4,
    term: 'a bimetallic strip', gloss: 'bends when heated because it is made of two metals bonded together that expand at different rates',
    recallStem: 'What bends when heated because it is made of two bonded metals that expand at different rates?',
    confusions: ['ps-expansion-coefficient', 'ps-water-anomaly'],
  },
  {
    id: 'ps-expansion-coefficient', chapter: CH, concepts: EXPANSION_PHASE, band: 4,
    term: 'the coefficient of thermal expansion', gloss: 'is a material-specific number describing how much a substance expands for each degree of temperature increase',
    recallStem: 'What material-specific number describes how much a substance expands per degree of temperature increase?',
    confusions: ['ps-bimetallic-strip', 'ps-water-anomaly'],
  },
  {
    id: 'ps-water-anomaly', chapter: CH, concepts: EXPANSION_PHASE, band: 4,
    term: "water's anomalous expansion", gloss: 'causes water to expand rather than contract as it freezes, unlike almost every other common substance',
    recallStem: 'What unusual thermal behavior causes water to expand, rather than contract, as it freezes?',
    confusions: ['ps-bimetallic-strip', 'ps-expansion-coefficient'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-thermodynamics-b2', name: 'Heat, temperature and the laws of thermodynamics' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-thermodynamics-b3', name: 'Heat, temperature and the laws of thermodynamics' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 4, idBase: 'ps-thermodynamics-b4', name: 'Heat, temperature and the laws of thermodynamics' }),
];
