// Chapter 10 - Aircraft type and the Mission-Design-Series system.
//
// ⭐ THIS CHAPTER EXISTS BECAUSE OF THE RESEARCH, and it is the single best-value chapter in the
// subtest. TWO of the ten official OATTS Aviation Information items test MDS letters:
//
//     "An aircraft with a Q designation means"        -> remotely piloted
//     "A UH-60 is designated by which of the following" -> Utility and Helicopter
//
// That is 20 percent of the official item bank on one topic, and almost no commercial AFOQT
// guide covers it at all. Skipping it would have been a straight, silent blind spot.
//
// The system is a RULE, not a list, which is why it is worth learning properly: read the letters
// right to left. The LAST letter before the number is the basic mission; letters before it are
// modifiers. UH-60 is a Helicopter (basic type) modified for Utility. AC-130 is a Cargo aircraft
// modified for Attack. Once you can read the letters, you can decode a designation you have
// never seen.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-10-aircraft-type';

registerFacts([
  // --- band 2: the mission letters ---------------------------------------------------------------
  {
    id: 'av-mds-a', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'A', gloss: 'is the mission letter for attack',
    recallStem: 'Which letter designates an attack aircraft?',
    confusions: ['av-mds-b', 'av-mds-f', 'av-mds-c'],
  },
  {
    id: 'av-mds-b', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'B', gloss: 'is the mission letter for bomber',
    recallStem: 'Which letter designates a bomber?',
    confusions: ['av-mds-a', 'av-mds-f', 'av-mds-c'],
  },
  {
    id: 'av-mds-c', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'C', gloss: 'is the mission letter for cargo or transport',
    recallStem: 'Which letter designates a cargo or transport aircraft?',
    confusions: ['av-mds-k', 'av-mds-u', 'av-mds-b'],
  },
  {
    id: 'av-mds-e', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'E', gloss: 'is the mission letter for special electronic installation, such as airborne early warning',
    recallStem: 'Which letter designates a special electronic mission aircraft?',
    confusions: ['av-mds-r', 'av-mds-f', 'av-mds-c'],
  },
  {
    id: 'av-mds-f', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'F', gloss: 'is the mission letter for fighter',
    recallStem: 'Which letter designates a fighter?',
    confusions: ['av-mds-a', 'av-mds-b', 'av-mds-e'],
  },
  {
    id: 'av-mds-h', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'H', gloss: 'is the letter for helicopter as a basic type, or search and rescue as a modifier',
    recallStem: 'Which letter designates a helicopter, or a search and rescue role?',
    confusions: ['av-mds-v', 'av-mds-u', 'av-mds-q'],
    why: 'Position decides which meaning applies. In UH-60 the H is the basic type - a helicopter. In HH-60 the leading H is the modifier, making it a search and rescue helicopter.',
  },
  {
    id: 'av-mds-k', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'K', gloss: 'is the modifier for tanker, meaning air-to-air refuelling',
    recallStem: 'Which letter designates an aerial refuelling tanker?',
    confusions: ['av-mds-c', 'av-mds-u', 'av-mds-a'],
  },
  {
    id: 'av-mds-q', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'Q', gloss: 'is the letter for a remotely piloted or unmanned aircraft',
    recallStem: 'Which letter designates a remotely piloted aircraft?',
    confusions: ['av-mds-r', 'av-mds-u', 'av-mds-x'],
    source: 'OATTS Knowledge Check, Aircraft Type',
    why: 'MQ-9 Reaper: M for multi-mission, Q for remotely piloted. RQ-4 Global Hawk: R for reconnaissance, Q for remotely piloted.',
  },
  {
    id: 'av-mds-r', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'R', gloss: 'is the mission letter for reconnaissance',
    recallStem: 'Which letter designates a reconnaissance aircraft?',
    confusions: ['av-mds-e', 'av-mds-q', 'av-mds-c'],
  },
  {
    id: 'av-mds-t', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'T', gloss: 'is the mission letter for trainer',
    recallStem: 'Which letter designates a trainer aircraft?',
    confusions: ['av-mds-u', 'av-mds-f', 'av-mds-x'],
  },
  {
    id: 'av-mds-u', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'U', gloss: 'is the mission letter for utility, meaning general-purpose work',
    recallStem: 'Which letter designates a general-purpose utility aircraft?',
    confusions: ['av-mds-c', 'av-mds-t', 'av-mds-h'],
  },
  {
    id: 'av-mds-v', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'V', gloss: 'is the letter for vertical or short takeoff and landing',
    recallStem: 'Which letter designates a VTOL or STOL aircraft?',
    confusions: ['av-mds-h', 'av-mds-x', 'av-mds-u'],
  },
  {
    id: 'av-mds-x', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'X', gloss: 'is the status prefix for an experimental aircraft',
    recallStem: 'Which letter marks an experimental aircraft?',
    confusions: ['av-mds-y', 'av-mds-t', 'av-mds-v'],
  },
  {
    id: 'av-mds-y', chapter: CH, concepts: ['mds-mission-letters'], band: 2,
    term: 'Y', gloss: 'is the status prefix for a prototype or service-test aircraft',
    recallStem: 'Which letter marks a prototype or service-test aircraft?',
    confusions: ['av-mds-x', 'av-mds-t'],
  },

  // --- band 3: reading the letters in order --------------------------------------------------------
  {
    id: 'av-mds-order', chapter: CH, concepts: ['mds-decoding'], band: 2,
    identify: false,
    term: 'the letter immediately before the number', gloss: 'is the basic mission, with any letters before it acting as modifiers',
    recallStem: 'Which part of an MDS designation names the basic type of aircraft?',
    confusions: ['av-mds-h', 'av-mds-q', 'av-mds-c'],
    why: 'Read right to left. The letter touching the number is what the aircraft IS; everything to its left is what it has been modified to DO.',
  },
  {
    id: 'av-mds-uh60', chapter: CH, concepts: ['mds-decoding'], band: 3,
    identify: false,
    term: 'a UH-60', gloss: 'is a utility helicopter - H for helicopter as the basic type, U for utility as the modifier',
    recallStem: 'Which designation is a utility helicopter?',
    confusions: ['av-mds-hh60', 'av-mds-ac130', 'av-mds-order'],
    source: 'OATTS Knowledge Check, Aircraft Type',
  },
  {
    id: 'av-mds-hh60', chapter: CH, concepts: ['mds-decoding'], band: 3,
    identify: false,
    term: 'an HH-60', gloss: 'is a helicopter modified for combat search and rescue',
    recallStem: 'Which designation is a search and rescue helicopter?',
    confusions: ['av-mds-uh60', 'av-mds-order'],
  },
  {
    id: 'av-mds-ac130', chapter: CH, concepts: ['mds-decoding'], band: 3,
    identify: false,
    term: 'an AC-130', gloss: 'is a cargo aircraft modified for attack - a gunship built on a transport airframe',
    recallStem: 'Which designation is a gunship built on a cargo airframe?',
    confusions: ['av-mds-kc135', 'av-mds-rc135', 'av-mds-uh60'],
    why: 'C is the basic type, so it is fundamentally a C-130 Hercules transport. The A in front says it has been modified for attack.',
  },
  {
    id: 'av-mds-kc135', chapter: CH, concepts: ['mds-decoding'], band: 3,
    identify: false,
    term: 'a KC-135', gloss: 'is a cargo airframe fitted as a tanker for air-to-air refuelling',
    recallStem: 'Which designation is a tanker built on a transport airframe?',
    confusions: ['av-mds-ac130', 'av-mds-rc135', 'av-mds-order'],
  },
  {
    id: 'av-mds-rc135', chapter: CH, concepts: ['mds-decoding'], band: 3,
    identify: false,
    term: 'an RC-135', gloss: 'is the same 135 airframe as the tanker, fitted instead for reconnaissance',
    recallStem: 'Which designation is a reconnaissance aircraft on the 135 airframe?',
    confusions: ['av-mds-kc135', 'av-mds-ac130'],
  },
  {
    id: 'av-mds-mq9', chapter: CH, concepts: ['mds-decoding'], band: 3,
    identify: false,
    term: 'an MQ-9', gloss: 'is a multi-mission remotely piloted aircraft, the Reaper',
    recallStem: 'Which designation is a multi-mission remotely piloted aircraft?',
    confusions: ['av-mds-uh60', 'av-mds-rc135'],
  },
  {
    id: 'av-mds-v22', chapter: CH, concepts: ['mds-decoding'], band: 3,
    identify: false,
    term: 'a V-22', gloss: 'is a tiltrotor with vertical takeoff and landing, the Osprey',
    recallStem: 'Which designation is a tiltrotor VTOL aircraft?',
    confusions: ['av-mds-uh60', 'av-mds-hh60'],
  },

  // --- band 4: the aircraft themselves ---------------------------------------------------------------
  {
    id: 'av-f22', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the F-22 Raptor', gloss: 'is the air superiority stealth fighter',
    recallStem: 'Which aircraft is the F-22?',
    confusions: ['av-f35', 'av-f16', 'av-b2'],
  },
  {
    id: 'av-f35', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the F-35 Lightning II', gloss: 'is the multirole stealth fighter flown by all three services',
    recallStem: 'Which aircraft is the F-35?',
    confusions: ['av-f22', 'av-f16', 'av-a10'],
  },
  {
    id: 'av-f16', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the F-16 Fighting Falcon', gloss: 'is the single-engine multirole fighter flown by the Thunderbirds',
    recallStem: 'Which aircraft is the F-16?',
    confusions: ['av-f22', 'av-f35', 'av-a10'],
  },
  {
    id: 'av-a10', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the A-10 Thunderbolt II', gloss: 'is the close air support aircraft built around a 30mm rotary cannon',
    recallStem: 'Which aircraft is the A-10?',
    confusions: ['av-f16', 'av-ac130-4', 'av-f35'],
  },
  {
    id: 'av-b52', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the B-52 Stratofortress', gloss: 'is the eight-engine long-range heavy bomber in service since the 1950s',
    recallStem: 'Which aircraft is the B-52?',
    confusions: ['av-b2', 'av-b1', 'av-c17'],
  },
  {
    id: 'av-b2', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the B-2 Spirit', gloss: 'is the flying-wing stealth bomber',
    recallStem: 'Which aircraft is the B-2?',
    confusions: ['av-b52', 'av-b1', 'av-f22'],
  },
  {
    id: 'av-b1', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the B-1 Lancer', gloss: 'is the supersonic swing-wing bomber',
    recallStem: 'Which aircraft is the B-1?',
    confusions: ['av-b52', 'av-b2'],
  },
  {
    id: 'av-c17', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the C-17 Globemaster III', gloss: 'is the large jet strategic airlifter able to use short runways',
    recallStem: 'Which aircraft is the C-17?',
    confusions: ['av-c130', 'av-c5', 'av-kc135-4'],
  },
  {
    id: 'av-c130', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the C-130 Hercules', gloss: 'is the four-engine turboprop tactical transport',
    recallStem: 'Which aircraft is the C-130?',
    confusions: ['av-c17', 'av-c5', 'av-ac130-4'],
  },
  {
    id: 'av-c5', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the C-5 Galaxy', gloss: 'is the largest aircraft in the Air Force inventory',
    recallStem: 'Which aircraft is the C-5?',
    confusions: ['av-c17', 'av-c130'],
  },
  {
    id: 'av-kc135-4', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the KC-135 Stratotanker', gloss: 'is the long-serving jet aerial refuelling tanker',
    recallStem: 'Which aircraft is the KC-135?',
    confusions: ['av-c17', 'av-e3', 'av-c130'],
  },
  {
    id: 'av-e3', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the E-3 Sentry', gloss: 'is the airborne warning and control aircraft with a rotating radar dome',
    recallStem: 'Which aircraft is the E-3?',
    confusions: ['av-kc135-4', 'av-c17', 'av-rc135-4'],
  },
  {
    id: 'av-rc135-4', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the RC-135 Rivet Joint', gloss: 'is the signals intelligence aircraft built on the 135 airframe',
    recallStem: 'Which aircraft is the RC-135?',
    confusions: ['av-e3', 'av-kc135-4'],
  },
  {
    id: 'av-ac130-4', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the AC-130 gunship', gloss: 'is the side-firing gunship converted from a Hercules transport',
    recallStem: 'Which aircraft is the AC-130?',
    confusions: ['av-c130', 'av-a10'],
  },
  {
    id: 'av-t6', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the T-6 Texan II', gloss: 'is the single-engine turboprop primary flight trainer',
    recallStem: 'Which aircraft is the T-6?',
    confusions: ['av-t38', 'av-c130'],
  },
  {
    id: 'av-t38', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the T-38 Talon', gloss: 'is the twin-engine supersonic jet trainer',
    recallStem: 'Which aircraft is the T-38?',
    confusions: ['av-t6', 'av-f16'],
  },
  {
    id: 'av-u2', chapter: CH, concepts: ['airframe-families'], band: 4,
    term: 'the U-2 Dragon Lady', gloss: 'is the very-high-altitude single-engine reconnaissance aircraft',
    recallStem: 'Which aircraft is the U-2?',
    confusions: ['av-rc135-4', 'av-e3'],
    why: 'A rare case where U does not mean utility - the U-2 was deliberately given a misleading designation to disguise its reconnaissance role.',
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-mds-b2', name: 'Mission letters' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-mds-b3', name: 'Decoding a designation' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-mds-b4', name: 'The aircraft themselves' }),
];
