// Chapter 7 - Sound waves and how they travel.
//
// PART 21B of docs/afoqt/HANDOFF.md. One of the two 3-concept chapters, so a lighter row count
// is correct here, not a shortfall. Grounded in the real OATTS bank: oatts-PS-063 (compression/
// rarefaction), oatts-PS-064 (sound travels fastest in a solid, like steel), oatts-PS-065
// (frequency determines pitch), oatts-PS-066 (diffraction - sound bending around obstacles).

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'ps-07-sound';
const WAVE_PROPERTIES = ['ps-sound-wave-properties'];
const PROPAGATION = ['ps-sound-propagation-medium'];
const BEHAVIOR = ['ps-wave-behavior-diffraction-doppler'];

registerFacts([
  // ============================ BAND 2 ============================
  {
    id: 'ps-sound-wave', chapter: CH, concepts: WAVE_PROPERTIES, band: 2,
    term: 'a sound wave', gloss: 'is a vibration that travels through a medium as a pattern of pressure changes',
    recallStem: 'What is a vibration that travels through a medium as a pattern of pressure changes called?',
    confusions: ['ps-pitch', 'ps-volume'],
  },
  {
    id: 'ps-pitch', chapter: CH, concepts: WAVE_PROPERTIES, band: 2,
    term: 'pitch', gloss: "is how high or low a sound seems, and is determined by the sound wave's frequency",
    recallStem: 'What determines how high or low a sound seems?',
    confusions: ['ps-sound-wave', 'ps-volume'],
    source: 'OATTS',
  },
  {
    id: 'ps-volume', chapter: CH, concepts: WAVE_PROPERTIES, band: 2,
    term: 'volume', gloss: "is how loud a sound seems, and is determined by the sound wave's amplitude",
    recallStem: 'What determines how loud a sound seems?',
    confusions: ['ps-sound-wave', 'ps-pitch'],
  },
  {
    id: 'ps-sound-needs-medium', chapter: CH, concepts: PROPAGATION, band: 2,
    term: 'a medium', gloss: 'is what sound requires in order to travel, unlike light, which can cross the vacuum of space',
    recallStem: 'What does sound require in order to travel, unlike light?',
    confusions: ['ps-solid-fastest', 'ps-gas-slowest'],
  },
  {
    id: 'ps-solid-fastest', chapter: CH, concepts: PROPAGATION, band: 2,
    term: 'a solid', gloss: 'is the state of matter in which sound travels fastest, since its tightly packed particles pass vibrations quickly',
    recallStem: 'In which state of matter does sound travel fastest?',
    confusions: ['ps-sound-needs-medium', 'ps-gas-slowest'],
    source: 'OATTS',
  },
  {
    id: 'ps-gas-slowest', chapter: CH, concepts: PROPAGATION, band: 2,
    term: 'a gas', gloss: 'is the state of matter in which sound travels slowest, since its widely spaced particles pass vibrations less efficiently',
    recallStem: 'In which state of matter does sound travel slowest?',
    confusions: ['ps-sound-needs-medium', 'ps-solid-fastest'],
  },
  {
    id: 'ps-echo', chapter: CH, concepts: BEHAVIOR, band: 2,
    term: 'an echo', gloss: 'is a sound wave reflecting off a distant surface and returning to the listener as a distinct, delayed repeat',
    recallStem: 'What is a sound wave reflecting off a distant surface and returning as a delayed repeat called?',
    confusions: ['ps-reverberation'],
  },
  {
    id: 'ps-reverberation', chapter: CH, concepts: BEHAVIOR, band: 2,
    term: 'reverberation', gloss: 'is the persistence of sound in an enclosed space caused by many rapid, overlapping reflections',
    recallStem: 'What is the persistence of sound in an enclosed space, from many overlapping reflections, called?',
    confusions: ['ps-echo', 'ps-absorption'],
  },
  {
    id: 'ps-absorption', chapter: CH, concepts: BEHAVIOR, band: 2,
    term: 'sound absorption', gloss: 'happens when a soft material takes in sound energy rather than reflecting it, reducing echo',
    recallStem: 'What happens when a soft material takes in sound energy rather than reflecting it?',
    confusions: ['ps-echo', 'ps-reverberation'],
  },

  // ============================ BAND 3 ============================
  {
    id: 'ps-sound-frequency', chapter: CH, concepts: WAVE_PROPERTIES, band: 3,
    term: 'frequency', gloss: 'is the number of sound wave vibrations that pass a point each second, measured in hertz',
    recallStem: 'What is the number of sound wave vibrations passing a point each second, measured in hertz, called?',
    confusions: ['ps-sound-wavelength', 'ps-timbre'],
  },
  {
    id: 'ps-sound-wavelength', chapter: CH, concepts: WAVE_PROPERTIES, band: 3,
    term: 'wavelength', gloss: 'is the distance between two consecutive compressions of a sound wave',
    recallStem: 'What is the distance between two consecutive compressions of a sound wave called?',
    confusions: ['ps-sound-frequency', 'ps-timbre'],
  },
  {
    id: 'ps-timbre', chapter: CH, concepts: WAVE_PROPERTIES, band: 3,
    term: 'timbre', gloss: 'is the quality that lets a listener distinguish two sounds of the same pitch and volume, such as a violin from a flute',
    recallStem: 'What quality lets a listener distinguish two sounds of the same pitch and volume?',
    confusions: ['ps-sound-frequency', 'ps-sound-wavelength'],
  },
  {
    id: 'ps-compression-rarefaction', chapter: CH, concepts: PROPAGATION, band: 3,
    term: 'compressions and rarefactions', gloss: 'are the regions of tightly packed and spread-out particles a sound wave creates as it moves through a medium',
    recallStem: 'What are the regions of tightly packed and spread-out particles a sound wave creates called?',
    confusions: ['ps-liquid-speed', 'ps-vacuum-silence'],
    source: 'OATTS',
  },
  {
    id: 'ps-liquid-speed', chapter: CH, concepts: PROPAGATION, band: 3,
    term: "sound's speed in a liquid", gloss: 'is faster than in a gas but slower than in a solid, since a liquid\'s particles are more loosely packed than a solid\'s',
    recallStem: 'How does the speed of sound in a liquid compare to a gas and a solid?',
    confusions: ['ps-compression-rarefaction', 'ps-vacuum-silence'],
  },
  {
    id: 'ps-vacuum-silence', chapter: CH, concepts: PROPAGATION, band: 3,
    term: 'a vacuum', gloss: 'cannot carry sound at all, since sound requires particles of a medium to transmit its vibrations',
    recallStem: 'What kind of space cannot carry sound at all?',
    confusions: ['ps-compression-rarefaction', 'ps-liquid-speed'],
  },
  {
    id: 'ps-diffraction-sound', chapter: CH, concepts: BEHAVIOR, band: 3,
    term: 'diffraction', gloss: 'is sound bending or spreading out as it passes around an obstacle or through an opening',
    recallStem: 'What is sound bending or spreading out as it passes around an obstacle called?',
    confusions: ['ps-doppler-sound', 'ps-reflection-vs-diffraction'],
    source: 'OATTS',
  },
  {
    id: 'ps-doppler-sound', chapter: CH, concepts: BEHAVIOR, band: 3,
    term: 'the Doppler effect', gloss: "raises a sound's perceived pitch as its source approaches and lowers it as the source moves away",
    recallStem: "What effect raises a sound's perceived pitch as its source approaches, and lowers it as the source recedes?",
    confusions: ['ps-diffraction-sound', 'ps-reflection-vs-diffraction'],
  },
  {
    id: 'ps-reflection-vs-diffraction', chapter: CH, concepts: BEHAVIOR, band: 3,
    term: "sound's reflection", gloss: 'bounces a wave off a surface at an angle, unlike diffraction, which bends a wave around an obstacle entirely',
    recallStem: "How does sound's reflection off a surface differ from diffraction around an obstacle?",
    confusions: ['ps-diffraction-sound', 'ps-doppler-sound'],
  },

  // ============================ BAND 4 ============================
  {
    id: 'ps-ultrasound', chapter: CH, concepts: WAVE_PROPERTIES, band: 4,
    term: 'ultrasound', gloss: 'is sound with a frequency higher than the upper limit of human hearing, roughly 20,000 hertz',
    recallStem: 'What is sound with a frequency above the upper limit of human hearing called?',
    confusions: ['ps-infrasound', 'ps-decibel'],
  },
  {
    id: 'ps-infrasound', chapter: CH, concepts: WAVE_PROPERTIES, band: 4,
    term: 'infrasound', gloss: 'is sound with a frequency lower than the lower limit of human hearing, roughly 20 hertz',
    recallStem: 'What is sound with a frequency below the lower limit of human hearing called?',
    confusions: ['ps-ultrasound', 'ps-decibel'],
  },
  {
    id: 'ps-decibel', chapter: CH, concepts: WAVE_PROPERTIES, band: 4,
    term: 'the decibel scale', gloss: 'measures sound intensity logarithmically, so each ten-decibel increase represents a tenfold rise in intensity',
    recallStem: 'What scale measures sound intensity logarithmically, where each ten-unit rise is a tenfold intensity increase?',
    confusions: ['ps-ultrasound', 'ps-infrasound'],
  },
  {
    id: 'ps-air-speed-sound', chapter: CH, concepts: PROPAGATION, band: 4,
    term: 'the speed of sound in air', gloss: 'is approximately 343 meters per second at room temperature, far slower than the speed of light',
    recallStem: 'Approximately how fast does sound travel through air at room temperature?',
    confusions: ['ps-temperature-sound-speed'],
  },
  {
    id: 'ps-temperature-sound-speed', chapter: CH, concepts: PROPAGATION, band: 4,
    term: 'rising air temperature', gloss: 'increases the speed of sound, since warmer air molecules move faster and transmit vibrations more quickly',
    recallStem: 'What happens to the speed of sound as air temperature rises?',
    confusions: ['ps-air-speed-sound', 'ps-sonic-boom'],
  },
  {
    id: 'ps-sonic-boom', chapter: CH, concepts: PROPAGATION, band: 4,
    term: 'a sonic boom', gloss: 'is the loud shock wave produced when an object travels faster than the speed of sound',
    recallStem: 'What is the loud shock wave called that is produced when an object exceeds the speed of sound?',
    confusions: ['ps-air-speed-sound', 'ps-temperature-sound-speed'],
  },
  {
    id: 'ps-interference', chapter: CH, concepts: BEHAVIOR, band: 4,
    term: 'interference', gloss: 'occurs when two sound waves overlap, combining to make a louder wave or canceling each other into silence',
    recallStem: 'What occurs when two sound waves overlap, either reinforcing or canceling each other?',
    confusions: ['ps-resonance', 'ps-standing-wave'],
  },
  {
    id: 'ps-resonance', chapter: CH, concepts: BEHAVIOR, band: 4,
    term: 'resonance', gloss: 'occurs when an object vibrates at unusually large amplitude because a driving frequency matches its own natural frequency',
    recallStem: "What occurs when an object vibrates at unusually large amplitude because a driving frequency matches its natural frequency?",
    confusions: ['ps-interference', 'ps-standing-wave'],
  },
  {
    id: 'ps-standing-wave', chapter: CH, concepts: BEHAVIOR, band: 4,
    term: 'a standing wave', gloss: 'is a stationary interference pattern formed when a wave reflects back on itself within a fixed medium, such as a guitar string',
    recallStem: 'What is a stationary interference pattern formed within a fixed medium, such as a guitar string, called?',
    confusions: ['ps-interference', 'ps-resonance'],
  },
]);

export default [
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 2, idBase: 'ps-sound-b2', name: 'Sound waves and how they travel' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 3, idBase: 'ps-sound-b3', name: 'Sound waves and how they travel' }),
  ...factTemplates({ subtest: 'PS', chapter: CH, band: 4, idBase: 'ps-sound-b4', name: 'Sound waves and how they travel' }),
];
