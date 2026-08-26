// Chapter 2 - Atoms, electrons and the periodic trends.
//
// PART 20 of docs/afoqt/HANDOFF.md. Grounded in the real OATTS bank: oatts-PS-048 (electron
// energy levels - an electron GAINS energy moving to a higher level), oatts-PS-049 (mass number
// = protons + neutrons), oatts-PS-050 (electronegativity increases left to right across a
// period). Read for phrasing register before adding rows.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-02-atomic-physics';
const STRUCTURE = ['ps-atomic-structure'];
const ENERGY_LEVELS = ['ps-electron-energy-levels'];
const TRENDS = ['ps-periodic-trends'];
const DECAY = ['ps-radioactivity-decay'];

registerFacts([
  // ============================ BAND 2 ============================
  {
    id: 'ps-proton', chapter: CH, concepts: STRUCTURE, band: 2,
    term: 'a proton', gloss: "is a positively charged particle found in an atom's nucleus",
    recallStem: "What is a positively charged particle in an atom's nucleus called?",
    confusions: ['ps-neutron', 'ps-electron'],
  },
  {
    id: 'ps-neutron', chapter: CH, concepts: STRUCTURE, band: 2,
    term: 'a neutron', gloss: "is an uncharged particle found alongside protons in an atom's nucleus",
    recallStem: "What is an uncharged particle found in an atom's nucleus, alongside protons, called?",
    confusions: ['ps-proton', 'ps-electron'],
  },
  {
    id: 'ps-electron', chapter: CH, concepts: STRUCTURE, band: 2,
    term: 'an electron', gloss: "is a negatively charged particle that orbits an atom's nucleus",
    recallStem: "What is a negatively charged particle that orbits an atom's nucleus called?",
    confusions: ['ps-proton', 'ps-neutron'],
  },
  {
    id: 'ps-electron-shell', chapter: CH, concepts: ENERGY_LEVELS, band: 2,
    term: 'an electron shell', gloss: 'is a region around the nucleus where electrons at a given energy level are found',
    recallStem: 'What is a region around the nucleus called, where electrons at a given energy level are found?',
    confusions: ['ps-ground-state', 'ps-excited-state'],
  },
  {
    id: 'ps-ground-state', chapter: CH, concepts: ENERGY_LEVELS, band: 2,
    term: 'the ground state', gloss: 'is the lowest energy level an electron in an atom can occupy',
    recallStem: 'What is the lowest energy level an electron can occupy called?',
    confusions: ['ps-excited-state', 'ps-electron-shell'],
  },
  {
    id: 'ps-excited-state', chapter: CH, concepts: ENERGY_LEVELS, band: 2,
    term: 'the excited state', gloss: 'is any energy level higher than an electron\'s ground state',
    recallStem: "What is a higher energy level than an electron's ground state called?",
    confusions: ['ps-ground-state'],
  },
  {
    id: 'ps-period', chapter: CH, concepts: TRENDS, band: 2,
    term: 'a period', gloss: 'is a horizontal row of the periodic table',
    recallStem: 'What is a horizontal row of the periodic table called?',
    confusions: ['ps-group'],
  },
  {
    id: 'ps-group', chapter: CH, concepts: TRENDS, band: 2,
    term: 'a group', gloss: 'is a vertical column of the periodic table, whose elements share similar chemical properties',
    recallStem: 'What is a vertical column of the periodic table called?',
    confusions: ['ps-period'],
  },
  {
    id: 'ps-periodic-table', chapter: CH, concepts: TRENDS, band: 2,
    term: 'the periodic table', gloss: 'is the chart that arranges all known elements by increasing atomic number',
    recallStem: 'What chart arranges all known elements by increasing atomic number?',
    confusions: ['ps-period', 'ps-group'],
    source: 'OATTS',
  },
  {
    id: 'ps-radioactivity', chapter: CH, concepts: DECAY, band: 2,
    term: 'radioactivity', gloss: "is the spontaneous release of particles or energy from an atom's unstable nucleus",
    recallStem: "What is the spontaneous release of particles or energy from an atom's unstable nucleus called?",
    confusions: ['ps-radiation'],
  },
  {
    id: 'ps-radiation', chapter: CH, concepts: DECAY, band: 2,
    term: 'radiation', gloss: 'is the particles or energy actually given off by a radioactive atom as it decays',
    recallStem: 'What is the particles or energy given off by a radioactive atom called?',
    confusions: ['ps-radioactivity'],
  },
  {
    id: 'ps-half-life', chapter: CH, concepts: DECAY, band: 2,
    term: 'a half-life', gloss: 'is the time it takes for half of a sample of a radioactive substance to decay',
    recallStem: 'What is the time called for half of a radioactive sample to decay?',
    confusions: ['ps-radioactivity'],
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-atomic-number', chapter: CH, concepts: STRUCTURE, band: 3,
    term: 'the atomic number', gloss: "is the number of protons in an atom's nucleus, and defines which element it is",
    recallStem: "What number tells you how many protons are in an atom's nucleus, defining the element?",
    confusions: ['ps-mass-number'],
  },
  {
    id: 'ps-mass-number', chapter: CH, concepts: STRUCTURE, band: 3,
    term: 'the mass number', gloss: "is the sum of an atom's protons and neutrons",
    recallStem: "What is the sum of an atom's protons and neutrons called?",
    confusions: ['ps-atomic-number'],
    source: 'OATTS',
  },
  {
    id: 'ps-nucleus', chapter: CH, concepts: STRUCTURE, band: 3,
    term: 'the nucleus', gloss: 'is the dense central core of an atom, made up of protons and neutrons',
    recallStem: 'What is the dense central core of an atom, made up of protons and neutrons, called?',
    confusions: ['ps-atomic-number', 'ps-mass-number'],
  },
  {
    id: 'ps-energy-absorption', chapter: CH, concepts: ENERGY_LEVELS, band: 3,
    term: 'absorption', gloss: 'happens when an electron gains energy and jumps to a higher energy level',
    recallStem: 'What happens to an electron\'s energy when it jumps to a higher energy level?',
    confusions: ['ps-energy-emission'],
    source: 'OATTS',
  },
  {
    id: 'ps-energy-emission', chapter: CH, concepts: ENERGY_LEVELS, band: 3,
    term: 'emission', gloss: 'happens when an electron releases energy and falls to a lower energy level',
    recallStem: "What happens to an electron's energy when it falls to a lower energy level?",
    confusions: ['ps-energy-absorption'],
  },
  {
    id: 'ps-electron-cloud', chapter: CH, concepts: ENERGY_LEVELS, band: 3,
    term: 'the electron cloud', gloss: "is the region around a nucleus where an electron is most likely to be found at any instant",
    recallStem: 'What describes the region around a nucleus where an electron is most likely to be found?',
    confusions: ['ps-ground-state'],
  },
  {
    id: 'ps-atomic-radius', chapter: CH, concepts: TRENDS, band: 3,
    term: 'atomic radius', gloss: 'is the size of an atom, and generally decreases moving left to right across a period',
    recallStem: "What atomic property generally decreases moving left to right across a period?",
    confusions: ['ps-electronegativity', 'ps-ionization-energy'],
  },
  {
    id: 'ps-electronegativity', chapter: CH, concepts: TRENDS, band: 3,
    term: 'electronegativity', gloss: "is an atom's pull on shared bonding electrons, and generally increases moving left to right across a period",
    recallStem: "What atomic property generally increases moving left to right across a period?",
    confusions: ['ps-atomic-radius', 'ps-ionization-energy'],
    source: 'OATTS',
  },
  {
    id: 'ps-ionization-energy', chapter: CH, concepts: TRENDS, band: 3,
    term: 'ionization energy', gloss: 'is the energy required to remove an electron from an atom, and generally increases moving left to right across a period',
    recallStem: 'What is the energy required to remove an electron from an atom called?',
    confusions: ['ps-atomic-radius', 'ps-electronegativity'],
  },
  {
    id: 'ps-alpha-decay', chapter: CH, concepts: DECAY, band: 3,
    term: 'alpha decay', gloss: 'is radioactive decay that releases two protons and two neutrons bound together',
    recallStem: 'What type of radioactive decay releases two protons and two neutrons bound together?',
    confusions: ['ps-beta-decay', 'ps-gamma-decay'],
  },
  {
    id: 'ps-beta-decay', chapter: CH, concepts: DECAY, band: 3,
    term: 'beta decay', gloss: 'is radioactive decay in which a neutron converts to a proton, releasing a fast-moving electron',
    recallStem: 'What type of radioactive decay releases a fast-moving electron as a neutron converts to a proton?',
    confusions: ['ps-alpha-decay', 'ps-gamma-decay'],
  },
  {
    id: 'ps-gamma-decay', chapter: CH, concepts: DECAY, band: 3,
    term: 'gamma decay', gloss: "is radioactive decay that releases pure high-energy electromagnetic radiation, with no mass at all",
    recallStem: 'What type of radioactive decay releases pure high-energy electromagnetic radiation with no mass?',
    confusions: ['ps-alpha-decay', 'ps-beta-decay'],
  },

  // ============================ BAND 4 ============================
  {
    id: 'ps-isotope', chapter: CH, concepts: STRUCTURE, band: 4,
    term: 'an isotope', gloss: 'is a version of an element with a different number of neutrons than its most common form',
    recallStem: "What is a version of an element with a different number of neutrons than its most common form called?",
    confusions: ['ps-ion', 'ps-valence-electron'],
  },
  {
    id: 'ps-ion', chapter: CH, concepts: STRUCTURE, band: 4,
    term: 'an ion', gloss: 'is an atom that has gained or lost electrons, giving it an overall electric charge',
    recallStem: 'What is an atom called that has gained or lost electrons, giving it an overall charge?',
    confusions: ['ps-isotope', 'ps-valence-electron'],
  },
  {
    id: 'ps-valence-electron', chapter: CH, concepts: STRUCTURE, band: 4,
    term: 'a valence electron', gloss: "is an electron in an atom's outermost shell, and is chiefly responsible for its chemical bonding",
    recallStem: "What is an electron in an atom's outermost shell called, chiefly responsible for its chemical bonding?",
    confusions: ['ps-ion', 'ps-isotope'],
  },
  {
    id: 'ps-quantum-leap', chapter: CH, concepts: ENERGY_LEVELS, band: 4,
    term: 'a quantum leap', gloss: "is an electron's abrupt jump between discrete energy levels, with no state possible in between",
    recallStem: "What is an electron's abrupt jump between discrete energy levels called?",
    confusions: ['ps-photon', 'ps-spectral-line'],
  },
  {
    id: 'ps-photon', chapter: CH, concepts: ENERGY_LEVELS, band: 4,
    term: 'a photon', gloss: 'is a discrete packet of light energy released when an electron drops to a lower energy level',
    recallStem: 'What is a discrete packet of light energy released when an electron drops to a lower level called?',
    confusions: ['ps-quantum-leap', 'ps-spectral-line'],
  },
  {
    id: 'ps-spectral-line', chapter: CH, concepts: ENERGY_LEVELS, band: 4,
    term: 'a spectral line', gloss: "is a distinct colored line produced by the specific photon energies an element's electrons release",
    recallStem: "What is a distinct colored line produced by an element's characteristic photon energies called?",
    confusions: ['ps-photon', 'ps-quantum-leap'],
  },
  {
    id: 'ps-metallic-character', chapter: CH, concepts: TRENDS, band: 4,
    term: 'metallic character', gloss: 'describes how easily an atom gives up electrons, and generally increases moving down a group',
    recallStem: 'What periodic property describes how easily an atom gives up electrons?',
    confusions: ['ps-alkali-reactivity', 'ps-noble-gas-stability'],
  },
  {
    id: 'ps-alkali-reactivity', chapter: CH, concepts: TRENDS, band: 4,
    term: 'alkali metal reactivity', gloss: 'increases moving down group 1, since the single outer electron is held less tightly with each added shell',
    recallStem: "What periodic trend describes group 1 elements becoming more reactive moving down the group?",
    confusions: ['ps-metallic-character', 'ps-noble-gas-stability'],
  },
  {
    id: 'ps-noble-gas-stability', chapter: CH, concepts: TRENDS, band: 4,
    term: 'noble gas stability', gloss: 'describes the low reactivity of group 18 elements, whose outermost electron shell is already full',
    recallStem: 'What periodic property describes why group 18 elements are so unreactive?',
    confusions: ['ps-metallic-character', 'ps-alkali-reactivity'],
  },
  {
    id: 'ps-fission', chapter: CH, concepts: DECAY, band: 4,
    term: 'nuclear fission', gloss: 'is the splitting of a heavy atomic nucleus into smaller nuclei, releasing energy',
    recallStem: 'What nuclear process splits a heavy atomic nucleus into smaller nuclei, releasing energy?',
    confusions: ['ps-fusion', 'ps-decay-chain'],
  },
  {
    id: 'ps-fusion', chapter: CH, concepts: DECAY, band: 4,
    term: 'nuclear fusion', gloss: 'is the combining of two light atomic nuclei into a heavier one, releasing energy',
    recallStem: 'What nuclear process combines two light atomic nuclei into a heavier one, releasing energy?',
    confusions: ['ps-fission', 'ps-decay-chain'],
  },
  {
    id: 'ps-decay-chain', chapter: CH, concepts: DECAY, band: 4,
    term: 'a decay chain', gloss: 'is a series of radioactive decays an unstable isotope undergoes on its way to becoming a stable element',
    recallStem: 'What is a series of radioactive decays an unstable isotope undergoes, on its way to a stable element, called?',
    confusions: ['ps-fission', 'ps-fusion'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-atomic-physics-b2', name: 'Atoms, electrons and periodic trends' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-atomic-physics-b3', name: 'Atoms, electrons and periodic trends' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 4, idBase: 'ps-atomic-physics-b4', name: 'Atoms, electrons and periodic trends' }),
];
