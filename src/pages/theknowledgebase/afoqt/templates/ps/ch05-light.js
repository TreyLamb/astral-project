// Chapter 5 - Light, reflection and the spectrum.
//
// PART 21 of docs/afoqt/HANDOFF.md. Grounded in the real OATTS bank: oatts-PS-057 (light needs
// no medium - it is an electromagnetic wave), oatts-PS-058 (reflection - light bouncing off a
// surface), oatts-PS-059 (frequency, not wavelength or speed, determines color and survives a
// medium change). Same fact-row rules as PARTS 20/20B.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-05-light';
const WAVE_PROPERTIES = ['ps-light-wave-properties'];
const REFLECTION_REFRACTION = ['ps-reflection-and-refraction'];
const LENSES_MIRRORS = ['ps-lenses-and-mirrors'];
const SPECTRUM = ['ps-electromagnetic-spectrum'];

registerFacts([
  // ============================ BAND 2 ============================
  {
    id: 'ps-wavelength', chapter: CH, concepts: WAVE_PROPERTIES, band: 2,
    term: 'wavelength', gloss: 'is the distance between two consecutive crests of a light wave',
    recallStem: 'What is the distance between two consecutive crests of a light wave called?',
    confusions: ['ps-amplitude', 'ps-light-speed'],
  },
  {
    id: 'ps-amplitude', chapter: CH, concepts: WAVE_PROPERTIES, band: 2,
    term: 'amplitude', gloss: "is a light wave's height, and determines how bright the light appears",
    recallStem: "What property of a light wave determines how bright it appears?",
    confusions: ['ps-wavelength', 'ps-light-speed'],
  },
  {
    id: 'ps-light-speed', chapter: CH, concepts: WAVE_PROPERTIES, band: 2,
    term: 'the speed of light', gloss: 'is the fastest speed anything can travel, reached by light moving through a vacuum',
    recallStem: 'What is the fastest speed anything can travel, reached by light in a vacuum, called?',
    confusions: ['ps-wavelength', 'ps-amplitude'],
  },
  {
    id: 'ps-reflection', chapter: CH, concepts: REFLECTION_REFRACTION, band: 2,
    term: 'reflection', gloss: 'happens when light bounces off a surface, such as a mirror, and travels in a new direction',
    recallStem: 'What happens when light bounces off a surface and travels in a new direction?',
    confusions: ['ps-refraction', 'ps-angle-of-incidence'],
    source: 'OATTS',
  },
  {
    id: 'ps-refraction', chapter: CH, concepts: REFLECTION_REFRACTION, band: 2,
    term: 'refraction', gloss: 'happens when light bends as it passes from one medium into another of different density',
    recallStem: 'What happens when light bends as it passes from one medium into another?',
    confusions: ['ps-reflection', 'ps-angle-of-incidence'],
  },
  {
    id: 'ps-angle-of-incidence', chapter: CH, concepts: REFLECTION_REFRACTION, band: 2,
    term: 'the angle of incidence', gloss: 'is the angle between an incoming light ray and the normal line at the surface it strikes',
    recallStem: 'What is the angle between an incoming light ray and the surface\'s normal line called?',
    confusions: ['ps-reflection', 'ps-refraction'],
  },
  {
    id: 'ps-convex-lens', chapter: CH, concepts: LENSES_MIRRORS, band: 2,
    term: 'a convex lens', gloss: 'curves outward and bends light rays inward, converging them toward a focal point',
    recallStem: 'What kind of lens curves outward and converges light rays toward a focal point?',
    confusions: ['ps-concave-lens', 'ps-plane-mirror'],
  },
  {
    id: 'ps-concave-lens', chapter: CH, concepts: LENSES_MIRRORS, band: 2,
    term: 'a concave lens', gloss: 'curves inward and spreads light rays outward, causing them to diverge',
    recallStem: 'What kind of lens curves inward and causes light rays to diverge?',
    confusions: ['ps-convex-lens', 'ps-plane-mirror'],
  },
  {
    id: 'ps-plane-mirror', chapter: CH, concepts: LENSES_MIRRORS, band: 2,
    term: 'a plane mirror', gloss: 'is a flat mirror that produces an upright, same-sized virtual image',
    recallStem: 'What kind of flat mirror produces an upright, same-sized virtual image?',
    confusions: ['ps-convex-lens', 'ps-concave-lens'],
  },
  {
    id: 'ps-visible-light', chapter: CH, concepts: SPECTRUM, band: 2,
    term: 'visible light', gloss: 'is the narrow band of the electromagnetic spectrum the human eye can actually detect',
    recallStem: 'What narrow band of the electromagnetic spectrum can the human eye detect?',
    confusions: ['ps-infrared', 'ps-ultraviolet'],
  },
  {
    id: 'ps-infrared', chapter: CH, concepts: SPECTRUM, band: 2,
    term: 'infrared radiation', gloss: 'has a longer wavelength than visible light and is felt chiefly as heat',
    recallStem: 'What kind of radiation has a longer wavelength than visible light and is felt as heat?',
    confusions: ['ps-visible-light', 'ps-ultraviolet'],
  },
  {
    id: 'ps-ultraviolet', chapter: CH, concepts: SPECTRUM, band: 2,
    term: 'ultraviolet radiation', gloss: 'has a shorter wavelength than visible light and can cause sunburn',
    recallStem: 'What kind of radiation has a shorter wavelength than visible light and can cause sunburn?',
    confusions: ['ps-visible-light', 'ps-infrared'],
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-frequency-determines-color', chapter: CH, concepts: WAVE_PROPERTIES, band: 3,
    term: "a light wave's frequency", gloss: "determines the color perceived, and stays constant even as speed and wavelength change when light enters a new medium",
    recallStem: "What property of a light wave determines its perceived color, and stays constant across a medium change?",
    confusions: ['ps-no-medium-needed', 'ps-wave-particle-duality'],
    source: 'OATTS',
  },
  {
    id: 'ps-no-medium-needed', chapter: CH, concepts: WAVE_PROPERTIES, band: 3,
    term: 'no medium', gloss: "is what light needs to travel, since it is an electromagnetic wave able to cross empty space",
    recallStem: 'What does light NOT need in order to travel, unlike a sound wave?',
    confusions: ['ps-frequency-determines-color', 'ps-wave-particle-duality'],
    source: 'OATTS',
  },
  {
    id: 'ps-wave-particle-duality', chapter: CH, concepts: WAVE_PROPERTIES, band: 3,
    term: 'wave-particle duality', gloss: 'describes how light exhibits the behavior of both a wave and a stream of particles',
    recallStem: 'What describes light exhibiting the behavior of both a wave and a stream of particles?',
    confusions: ['ps-frequency-determines-color', 'ps-no-medium-needed'],
  },
  {
    id: 'ps-law-of-reflection', chapter: CH, concepts: REFLECTION_REFRACTION, band: 3,
    term: 'the law of reflection', gloss: 'states that the angle of incidence always equals the angle of reflection',
    recallStem: 'What law states that the angle of incidence always equals the angle of reflection?',
    confusions: ['ps-index-of-refraction', 'ps-critical-angle'],
  },
  {
    id: 'ps-index-of-refraction', chapter: CH, concepts: REFLECTION_REFRACTION, band: 3,
    term: 'the index of refraction', gloss: 'measures how much a specific material slows down and bends light passing through it',
    recallStem: 'What measures how much a material slows down and bends light passing through it?',
    confusions: ['ps-law-of-reflection', 'ps-critical-angle'],
  },
  {
    id: 'ps-critical-angle', chapter: CH, concepts: REFLECTION_REFRACTION, band: 3,
    term: 'the critical angle', gloss: 'is the angle of incidence beyond which light no longer refracts out of a denser medium at all',
    recallStem: 'What is the angle of incidence beyond which light no longer refracts out of a denser medium?',
    confusions: ['ps-law-of-reflection', 'ps-index-of-refraction'],
  },
  {
    id: 'ps-concave-mirror', chapter: CH, concepts: LENSES_MIRRORS, band: 3,
    term: 'a concave mirror', gloss: 'curves inward and converges reflected light rays toward a focal point',
    recallStem: 'What kind of mirror curves inward and converges reflected light toward a focal point?',
    confusions: ['ps-convex-mirror', 'ps-focal-point'],
  },
  {
    id: 'ps-convex-mirror', chapter: CH, concepts: LENSES_MIRRORS, band: 3,
    term: 'a convex mirror', gloss: 'curves outward and spreads reflected light rays apart, producing a wider field of view',
    recallStem: 'What kind of mirror curves outward and produces a wider field of view?',
    confusions: ['ps-concave-mirror', 'ps-focal-point'],
  },
  {
    id: 'ps-focal-point', chapter: CH, concepts: LENSES_MIRRORS, band: 3,
    term: 'the focal point', gloss: 'is the single point where parallel light rays converge after passing through a lens or reflecting off a curved mirror',
    recallStem: 'What is the single point called where parallel light rays converge after a lens or curved mirror?',
    confusions: ['ps-concave-mirror', 'ps-convex-mirror'],
  },
  {
    id: 'ps-radio-waves', chapter: CH, concepts: SPECTRUM, band: 3,
    term: 'radio waves', gloss: 'have the longest wavelength of the electromagnetic spectrum and are used to carry broadcast signals',
    recallStem: 'What has the longest wavelength on the electromagnetic spectrum and carries broadcast signals?',
    confusions: ['ps-x-rays', 'ps-gamma-rays'],
  },
  {
    id: 'ps-x-rays', chapter: CH, concepts: SPECTRUM, band: 3,
    term: 'X-rays', gloss: 'have a short wavelength and enough energy to pass through soft tissue, which is why they are used in medical imaging',
    recallStem: 'What short-wavelength radiation passes through soft tissue and is used in medical imaging?',
    confusions: ['ps-radio-waves', 'ps-gamma-rays'],
  },
  {
    id: 'ps-gamma-rays', chapter: CH, concepts: SPECTRUM, band: 3,
    term: 'gamma rays', gloss: 'have the shortest wavelength and highest energy of the entire electromagnetic spectrum',
    recallStem: 'What has the shortest wavelength and highest energy on the electromagnetic spectrum?',
    confusions: ['ps-radio-waves', 'ps-x-rays'],
  },

  // ============================ BAND 4 ============================
  {
    id: 'ps-photon-energy', chapter: CH, concepts: WAVE_PROPERTIES, band: 4,
    term: "a photon's energy", gloss: "increases as its light's frequency increases, and decreases as wavelength increases",
    recallStem: "What happens to a photon's energy as the light's frequency increases?",
    confusions: ['ps-light-doppler', 'ps-polarization'],
  },
  {
    id: 'ps-light-doppler', chapter: CH, concepts: WAVE_PROPERTIES, band: 4,
    term: 'the Doppler effect', gloss: "shifts a light source's observed wavelength toward blue as it approaches and toward red as it recedes",
    recallStem: "What effect shifts a light source's observed wavelength depending on whether it approaches or recedes?",
    confusions: ['ps-photon-energy', 'ps-polarization'],
  },
  {
    id: 'ps-polarization', chapter: CH, concepts: WAVE_PROPERTIES, band: 4,
    term: 'polarization', gloss: 'restricts a light wave\'s vibrations to a single plane, which is how polarized sunglasses cut glare',
    recallStem: "What restricts a light wave's vibrations to a single plane, as polarized sunglasses use to cut glare?",
    confusions: ['ps-photon-energy', 'ps-light-doppler'],
  },
  {
    id: 'ps-dispersion', chapter: CH, concepts: REFLECTION_REFRACTION, band: 4,
    term: 'dispersion', gloss: 'splits white light into its component colors, since each wavelength refracts by a slightly different amount',
    recallStem: 'What splits white light into its component colors as each wavelength refracts differently?',
    confusions: ['ps-total-internal-reflection', 'ps-snells-law'],
  },
  {
    id: 'ps-total-internal-reflection', chapter: CH, concepts: REFLECTION_REFRACTION, band: 4,
    term: 'total internal reflection', gloss: 'reflects light entirely back into a denser medium once it strikes the boundary beyond the critical angle',
    recallStem: 'What reflects light entirely back into a denser medium once past the critical angle?',
    confusions: ['ps-dispersion', 'ps-snells-law'],
  },
  {
    id: 'ps-snells-law', chapter: CH, concepts: REFLECTION_REFRACTION, band: 4,
    term: "Snell's law", gloss: 'relates the angles and the indices of refraction of the two media light passes between',
    recallStem: "What law relates the angles and the indices of refraction of two media light passes between?",
    confusions: ['ps-dispersion', 'ps-total-internal-reflection'],
  },
  {
    id: 'ps-real-virtual-image', chapter: CH, concepts: LENSES_MIRRORS, band: 4,
    term: 'a real image', gloss: 'forms where light rays actually converge and can be projected onto a screen, unlike a virtual image',
    recallStem: 'What kind of image forms where light rays actually converge and can be projected onto a screen?',
    confusions: ['ps-magnification', 'ps-corrective-lens'],
  },
  {
    id: 'ps-magnification', chapter: CH, concepts: LENSES_MIRRORS, band: 4,
    term: 'magnification', gloss: "is the ratio of an image's size to the size of the actual object producing it",
    recallStem: "What is the ratio of an image's size to the size of the actual object called?",
    confusions: ['ps-real-virtual-image', 'ps-corrective-lens'],
  },
  {
    id: 'ps-corrective-lens', chapter: CH, concepts: LENSES_MIRRORS, band: 4,
    term: 'a corrective lens', gloss: 'bends incoming light to focus it properly on the retina, treating conditions such as nearsightedness or farsightedness',
    recallStem: 'What bends incoming light to focus it properly on the retina, treating nearsightedness or farsightedness?',
    confusions: ['ps-real-virtual-image', 'ps-magnification'],
  },
  {
    id: 'ps-microwaves', chapter: CH, concepts: SPECTRUM, band: 4,
    term: 'microwaves', gloss: "sit between radio waves and infrared on the spectrum, with a wavelength long enough to be absorbed efficiently by water molecules",
    recallStem: 'What part of the spectrum sits between radio waves and infrared, and is absorbed efficiently by water?',
    confusions: ['ps-wavelength-energy', 'ps-spectrum-ordering'],
  },
  {
    id: 'ps-wavelength-energy', chapter: CH, concepts: SPECTRUM, band: 4,
    term: 'the wavelength-energy relationship', gloss: 'across the electromagnetic spectrum is inverse - the shorter the wavelength, the higher the energy',
    recallStem: "How do a photon's wavelength and its energy relate to each other?",
    confusions: ['ps-microwaves', 'ps-spectrum-ordering'],
  },
  {
    id: 'ps-spectrum-ordering', chapter: CH, concepts: SPECTRUM, band: 4,
    term: 'the spectrum\'s ordering', gloss: 'runs from radio waves at the longest wavelength through microwaves, infrared, visible light, ultraviolet, and X-rays to gamma rays at the shortest',
    recallStem: 'From longest to shortest wavelength, how is the electromagnetic spectrum ordered?',
    confusions: ['ps-microwaves', 'ps-wavelength-energy'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-light-b2', name: 'Light, reflection and the spectrum' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-light-b3', name: 'Light, reflection and the spectrum' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 4, idBase: 'ps-light-b4', name: 'Light, reflection and the spectrum' }),
];
