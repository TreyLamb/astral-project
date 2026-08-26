// Chapter 1 - The solar system and the sky.
//
// PART 20 of docs/afoqt/HANDOFF.md. Grounded in the real OATTS bank: oatts-PS-045 (comets),
// oatts-PS-046 (solar/lunar eclipses) and oatts-PS-047 (axial tilt and seasons) are already in
// afoqt/data/realQuestions.json - read for phrasing register before adding rows. Short, direct,
// conceptual-recall items, non-mathematical - exactly the shape engine/facts.js (built for
// Aviation Information) was designed around, so no new engine work was needed here (PART 19).
//
// FACT-ROW RULES (see PART 20's brief in HANDOFF.md for the full version, not repeated here):
// never author the identify stem by hand, the gloss is a third-person predicate with the article
// belonging to the term, a gloss must never shout, give every fact a recallStem by default, and
// confusions stay inside this file. Sampled and read aloud before calling this done - selftest
// proves a question is well-FORMED, never well-WRITTEN.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-01-astronomy';
const SOLAR_SYSTEM = ['ps-solar-system'];
const EARTH_MOTION = ['ps-earth-motion-seasons'];
const ECLIPSES = ['ps-eclipses-moon-phases'];
const STARS = ['ps-stars-and-universe'];

registerFacts([
  // ============================ BAND 2 ============================
  {
    id: 'ps-planet', chapter: CH, concepts: SOLAR_SYSTEM, band: 2,
    term: 'a planet', gloss: 'is a body that orbits a star and has cleared its orbital path of other debris',
    recallStem: 'What is a body called that orbits a star and has cleared its orbital path of debris?',
    confusions: ['ps-moon', 'ps-dwarf-planet'],
  },
  {
    id: 'ps-moon', chapter: CH, concepts: SOLAR_SYSTEM, band: 2,
    term: 'a moon', gloss: 'is a natural satellite that orbits a planet',
    recallStem: 'What is a natural satellite that orbits a planet called?',
    confusions: ['ps-planet', 'ps-asteroid'],
  },
  {
    id: 'ps-comet', chapter: CH, concepts: SOLAR_SYSTEM, band: 2,
    term: 'a comet', gloss: 'is an icy body that grows a glowing tail when it passes near the Sun',
    recallStem: 'What is an icy body called that grows a glowing tail when it passes near the Sun?',
    confusions: ['ps-asteroid', 'ps-meteor'],
    source: 'OATTS',
  },
  {
    id: 'ps-rotation', chapter: CH, concepts: EARTH_MOTION, band: 2,
    term: "Earth's rotation", gloss: "is the spin of Earth on its own axis, completing about once every 24 hours",
    recallStem: 'What is the name for the spin of Earth on its own axis?',
    confusions: ['ps-revolution', 'ps-axial-tilt'],
  },
  {
    id: 'ps-revolution', chapter: CH, concepts: EARTH_MOTION, band: 2,
    term: "Earth's revolution", gloss: 'is the roughly year-long orbit Earth makes around the Sun',
    recallStem: "What is Earth's year-long orbit around the Sun called?",
    confusions: ['ps-rotation'],
  },
  {
    id: 'ps-axial-tilt', chapter: CH, concepts: EARTH_MOTION, band: 2,
    term: "Earth's axial tilt", gloss: "is the roughly 23.5-degree lean of Earth's axis relative to its orbital plane, and is the direct cause of the seasons",
    recallStem: 'What causes Earth to have seasons?',
    confusions: ['ps-rotation', 'ps-revolution'],
    source: 'OATTS',
  },
  {
    id: 'ps-new-moon', chapter: CH, concepts: ECLIPSES, band: 2,
    term: 'a new moon', gloss: "is the phase when the Moon sits between Earth and the Sun, with its lit side facing away from Earth",
    recallStem: 'What is the phase called when the Moon is between Earth and the Sun, lit side away from us?',
    confusions: ['ps-full-moon', 'ps-solar-eclipse'],
  },
  {
    id: 'ps-full-moon', chapter: CH, concepts: ECLIPSES, band: 2,
    term: 'a full moon', gloss: "is the phase when Earth sits between the Sun and the Moon, showing the Moon's whole lit side",
    recallStem: "What is the phase called when the Moon's whole lit side faces Earth?",
    confusions: ['ps-new-moon', 'ps-lunar-eclipse'],
  },
  {
    id: 'ps-solar-eclipse', chapter: CH, concepts: ECLIPSES, band: 2,
    term: 'a solar eclipse', gloss: "occurs when the Moon passes between the Sun and Earth, blocking the Sun's light",
    recallStem: 'What is it called when the Moon passes between the Sun and Earth, blocking sunlight?',
    confusions: ['ps-lunar-eclipse', 'ps-new-moon'],
    source: 'OATTS',
  },
  {
    id: 'ps-star', chapter: CH, concepts: STARS, band: 2,
    term: 'a star', gloss: 'is a massive ball of hot gas that produces its own light and heat through nuclear fusion',
    recallStem: 'What produces its own light and heat through nuclear fusion?',
    confusions: ['ps-planet'],
  },
  {
    id: 'ps-galaxy', chapter: CH, concepts: STARS, band: 2,
    term: 'a galaxy', gloss: 'is an enormous collection of stars, gas, and dust held together by gravity',
    recallStem: 'What is an enormous collection of stars, gas, and dust held together by gravity called?',
    confusions: ['ps-milky-way', 'ps-nebula'],
  },
  {
    id: 'ps-constellation', chapter: CH, concepts: STARS, band: 2,
    term: 'a constellation', gloss: 'is a recognizable pattern of stars as seen from Earth',
    recallStem: 'What is a recognizable pattern of stars, as seen from Earth, called?',
    confusions: ['ps-galaxy'],
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-asteroid', chapter: CH, concepts: SOLAR_SYSTEM, band: 3,
    term: 'an asteroid', gloss: 'is a rocky body, smaller than a planet, that orbits the Sun mostly within the asteroid belt',
    recallStem: 'What is a small rocky body that orbits the Sun, mostly within the asteroid belt, called?',
    confusions: ['ps-comet', 'ps-meteoroid'],
  },
  {
    id: 'ps-meteoroid', chapter: CH, concepts: SOLAR_SYSTEM, band: 3,
    term: 'a meteoroid', gloss: 'is a small rock or dust particle traveling through space',
    recallStem: 'What is a small rock or dust particle traveling through space called, before it enters an atmosphere?',
    confusions: ['ps-asteroid', 'ps-meteor'],
  },
  {
    id: 'ps-meteor', chapter: CH, concepts: SOLAR_SYSTEM, band: 3,
    term: 'a meteor', gloss: "is the streak of light produced when a meteoroid burns up in Earth's atmosphere",
    recallStem: "What is the streak of light called when a meteoroid burns up in Earth's atmosphere?",
    confusions: ['ps-meteoroid', 'ps-comet'],
  },
  {
    id: 'ps-solstice', chapter: CH, concepts: EARTH_MOTION, band: 3,
    term: 'a solstice', gloss: 'is the point in Earth\'s orbit when a hemisphere is tilted most directly toward or away from the Sun',
    recallStem: "What is the point in Earth's orbit called when a hemisphere is tilted most directly toward or away from the Sun?",
    confusions: ['ps-equinox'],
  },
  {
    id: 'ps-equinox', chapter: CH, concepts: EARTH_MOTION, band: 3,
    term: 'an equinox', gloss: 'is the point in Earth\'s orbit when day and night are of roughly equal length nearly everywhere on Earth',
    recallStem: "What is the point in Earth's orbit called when day and night are roughly equal in length?",
    confusions: ['ps-solstice'],
  },
  {
    id: 'ps-perihelion', chapter: CH, concepts: EARTH_MOTION, band: 3,
    term: 'perihelion', gloss: "is the point in Earth's orbit when it is closest to the Sun",
    recallStem: "What is the point in Earth's orbit called when it is closest to the Sun?",
    confusions: ['ps-aphelion'],
  },
  {
    id: 'ps-lunar-eclipse', chapter: CH, concepts: ECLIPSES, band: 3,
    term: 'a lunar eclipse', gloss: "occurs when Earth passes between the Sun and the Moon, casting Earth's shadow onto the Moon",
    recallStem: "What is it called when Earth passes between the Sun and the Moon, casting a shadow on the Moon?",
    confusions: ['ps-solar-eclipse', 'ps-full-moon'],
    source: 'OATTS',
  },
  {
    id: 'ps-waxing', chapter: CH, concepts: ECLIPSES, band: 3,
    term: 'waxing', gloss: "describes a Moon phase in which more of the lit surface becomes visible each night",
    recallStem: 'What term describes a Moon phase in which more of the lit surface becomes visible each night?',
    confusions: ['ps-waning'],
  },
  {
    id: 'ps-waning', chapter: CH, concepts: ECLIPSES, band: 3,
    term: 'waning', gloss: "describes a Moon phase in which less of the lit surface is visible each night",
    recallStem: 'What term describes a Moon phase in which less of the lit surface is visible each night?',
    confusions: ['ps-waxing'],
  },
  {
    id: 'ps-light-year', chapter: CH, concepts: STARS, band: 3,
    term: 'a light-year', gloss: 'is the distance light travels in one year, used to measure distances between stars',
    recallStem: 'What unit of distance is defined as how far light travels in one year?',
    confusions: ['ps-nebula'],
  },
  {
    id: 'ps-nebula', chapter: CH, concepts: STARS, band: 3,
    term: 'a nebula', gloss: 'is a giant cloud of gas and dust in space, often the birthplace of new stars',
    recallStem: 'What is a giant cloud of gas and dust in space, often where new stars form, called?',
    confusions: ['ps-galaxy', 'ps-light-year'],
  },
  {
    id: 'ps-milky-way', chapter: CH, concepts: STARS, band: 3,
    term: 'the Milky Way', gloss: "is the spiral galaxy that contains Earth's own solar system",
    recallStem: "What is the name of the spiral galaxy that contains Earth's solar system?",
    confusions: ['ps-galaxy'],
  },

  // ============================ BAND 4 ============================
  {
    id: 'ps-meteorite', chapter: CH, concepts: SOLAR_SYSTEM, band: 4,
    term: 'a meteorite', gloss: 'is a meteoroid that survives its fall through the atmosphere and actually lands on the ground',
    recallStem: 'What is a meteoroid called once it survives its fall and lands on the ground?',
    confusions: ['ps-meteoroid', 'ps-dwarf-planet'],
  },
  {
    id: 'ps-dwarf-planet', chapter: CH, concepts: SOLAR_SYSTEM, band: 4,
    term: 'a dwarf planet', gloss: 'is a body that orbits the Sun and is round, but has not cleared its orbital neighborhood of other debris',
    recallStem: 'What is a round body that orbits the Sun but has not cleared its orbital neighborhood called?',
    confusions: ['ps-planet', 'ps-kuiper-belt'],
  },
  {
    id: 'ps-kuiper-belt', chapter: CH, concepts: SOLAR_SYSTEM, band: 4,
    term: 'the Kuiper Belt', gloss: 'is the region beyond Neptune containing icy bodies and dwarf planets such as Pluto',
    recallStem: 'What region beyond Neptune contains icy bodies and dwarf planets such as Pluto?',
    confusions: ['ps-dwarf-planet'],
  },
  {
    id: 'ps-aphelion', chapter: CH, concepts: EARTH_MOTION, band: 4,
    term: 'aphelion', gloss: "is the point in Earth's orbit when it is farthest from the Sun",
    recallStem: "What is the point in Earth's orbit called when it is farthest from the Sun?",
    confusions: ['ps-perihelion'],
  },
  {
    id: 'ps-precession', chapter: CH, concepts: EARTH_MOTION, band: 4,
    term: "Earth's precession", gloss: "is the slow wobble of Earth's rotational axis, completing one cycle roughly every 26,000 years",
    recallStem: "What is the slow, roughly 26,000-year wobble of Earth's rotational axis called?",
    confusions: ['ps-sidereal-day'],
  },
  {
    id: 'ps-sidereal-day', chapter: CH, concepts: EARTH_MOTION, band: 4,
    term: 'a sidereal day', gloss: 'is the time for Earth to rotate once relative to the distant stars, about four minutes shorter than a solar day',
    recallStem: 'What is the time for Earth to rotate once relative to the distant stars called?',
    confusions: ['ps-precession'],
  },
  {
    id: 'ps-umbra', chapter: CH, concepts: ECLIPSES, band: 4,
    term: 'the umbra', gloss: 'is the darkest, central part of a shadow, where light is completely blocked',
    recallStem: 'What is the darkest, central part of a shadow called, where light is completely blocked?',
    confusions: ['ps-penumbra'],
  },
  {
    id: 'ps-penumbra', chapter: CH, concepts: ECLIPSES, band: 4,
    term: 'the penumbra', gloss: 'is the lighter, outer part of a shadow, where light is only partially blocked',
    recallStem: 'What is the lighter, outer part of a shadow called, where light is only partially blocked?',
    confusions: ['ps-umbra'],
  },
  {
    id: 'ps-syzygy', chapter: CH, concepts: ECLIPSES, band: 4,
    term: 'syzygy', gloss: 'is the alignment of three celestial bodies in a straight line, as happens during an eclipse',
    recallStem: 'What term describes three celestial bodies lining up in a straight line, as happens during an eclipse?',
    confusions: ['ps-umbra'],
  },
  {
    id: 'ps-red-giant', chapter: CH, concepts: STARS, band: 4,
    term: 'a red giant', gloss: 'is a dying star that has expanded and cooled after exhausting the hydrogen fuel in its core',
    recallStem: 'What is a dying star called that has expanded and cooled after exhausting its core hydrogen?',
    confusions: ['ps-white-dwarf', 'ps-supernova'],
  },
  {
    id: 'ps-white-dwarf', chapter: CH, concepts: STARS, band: 4,
    term: 'a white dwarf', gloss: "is the small, dense, cooling remnant left behind after a low-mass star sheds its outer layers",
    recallStem: 'What is the small, dense, cooling remnant of a low-mass star called?',
    confusions: ['ps-red-giant', 'ps-supernova'],
  },
  {
    id: 'ps-supernova', chapter: CH, concepts: STARS, band: 4,
    term: 'a supernova', gloss: 'is the explosive death of a massive star, briefly outshining an entire galaxy',
    recallStem: 'What is the explosive death of a massive star called?',
    confusions: ['ps-red-giant', 'ps-white-dwarf'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-astronomy-b2', name: 'The solar system and the sky' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-astronomy-b3', name: 'The solar system and the sky' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 4, idBase: 'ps-astronomy-b4', name: 'The solar system and the sky' }),
];
