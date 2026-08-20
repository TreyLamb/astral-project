// Chapter 4 - Flight instruments, and what fails when.
//
// Two things make this chapter examinable in a way most of the others are not:
//
//   1. THE SIX-PACK SPLITS CLEANLY IN TWO. Three instruments run off the pitot-static system
//      (airspeed, altimeter, vertical speed) and three run off gyros (attitude, heading, turn
//      coordinator). Knowing which group an instrument belongs to answers every failure question
//      on the subtest, because a blockage kills one group and a vacuum failure kills the other.
//   2. THE FAILURE TABLE IS EXACT. A blocked pitot kills the airspeed indicator alone. A blocked
//      static port kills all three pitot-static instruments. Those are memorisable facts, and
//      they are asked.
//
// This chapter also carries the IAS / CAS / TAS / GS chain, which is the one place the subtest
// asks something that is nearly arithmetic.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-04-instruments';

registerFacts([
  // --- band 2: the six instruments ----------------------------------------------------------
  {
    id: 'av-altimeter', chapter: CH, concepts: ['pitot-static-instruments'], band: 2,
    term: 'the altimeter', gloss: 'measures altitude by sensing static air pressure',
    recallStem: 'Which instrument measures height from static pressure alone?',
    confusions: ['av-asi', 'av-vsi', 'av-attitude-indicator'],
  },
  {
    id: 'av-asi', chapter: CH, concepts: ['pitot-static-instruments'], band: 2,
    term: 'the airspeed indicator', gloss: 'measures speed from the difference between ram air pressure and static pressure',
    recallStem: 'Which instrument compares pitot pressure with static pressure?',
    confusions: ['av-altimeter', 'av-vsi', 'av-pitot-tube'],
    why: 'It is the only instrument that uses the pitot tube at all - which is why a blocked pitot takes out the airspeed indicator and nothing else.',
  },
  {
    id: 'av-vsi', chapter: CH, concepts: ['pitot-static-instruments'], band: 2,
    term: 'the vertical speed indicator', gloss: 'shows rate of climb or descent from how fast static pressure is changing',
    recallStem: 'Which instrument shows rate of climb from the rate of static pressure change?',
    confusions: ['av-altimeter', 'av-asi', 'av-attitude-indicator'],
  },
  {
    id: 'av-attitude-indicator', chapter: CH, concepts: ['gyroscopic-instruments'], band: 2,
    term: 'the attitude indicator', gloss: 'shows pitch and bank against an artificial horizon using a gyroscope',
    recallStem: 'Which gyroscopic instrument displays both pitch and bank?',
    confusions: ['av-turn-coordinator', 'av-heading-indicator', 'av-vsi'],
  },
  {
    id: 'av-heading-indicator', chapter: CH, concepts: ['gyroscopic-instruments'], band: 2,
    term: 'the heading indicator', gloss: 'shows a steady heading from a gyro and must be reset against the magnetic compass',
    recallStem: 'Which gyroscopic instrument must be periodically realigned with the magnetic compass?',
    confusions: ['av-magnetic-compass', 'av-attitude-indicator', 'av-turn-coordinator'],
    why: 'The gyro drifts, so it is realigned every 15 minutes or so in straight and level flight against the compass.',
  },
  {
    id: 'av-turn-coordinator', chapter: CH, concepts: ['gyroscopic-instruments'], band: 2,
    term: 'the turn coordinator', gloss: 'shows rate of turn and whether the turn is coordinated, but gives no pitch information',
    recallStem: 'Which instrument shows rate of turn and coordination but not pitch?',
    confusions: ['av-attitude-indicator', 'av-inclinometer', 'av-heading-indicator'],
    why: 'Its face is marked "NO PITCH INFORMATION" precisely because the miniature aircraft looks like an attitude indicator and is not one.',
  },
  {
    id: 'av-inclinometer', chapter: CH, concepts: ['gyroscopic-instruments'], band: 2,
    term: 'the inclinometer', gloss: 'is the ball in the turn coordinator that shows whether a turn is slipping or skidding',
    recallStem: 'Which part of the turn instrument shows slip and skid?',
    confusions: ['av-turn-coordinator', 'av-attitude-indicator'],
    why: 'Step on the ball: if it sits left of centre, press the left rudder pedal.',
  },
  {
    id: 'av-magnetic-compass', chapter: CH, concepts: ['magnetic-compass'], band: 2,
    term: 'the magnetic compass', gloss: 'is the only direction instrument that needs no power of any kind',
    recallStem: 'Which direction instrument requires no electrical or vacuum power?',
    confusions: ['av-heading-indicator', 'av-turn-coordinator'],
  },

  // --- band 3: the plumbing, and what breaks -------------------------------------------------
  {
    id: 'av-pitot-tube', chapter: CH, concepts: ['pitot-static-instruments'], band: 3,
    term: 'the pitot tube', gloss: 'faces forward into the airflow to sense ram air pressure',
    recallStem: 'Which probe faces into the airflow to measure ram air pressure?',
    confusions: ['av-static-port', 'av-alternate-static', 'av-asi'],
  },
  {
    id: 'av-static-port', chapter: CH, concepts: ['pitot-static-instruments'], band: 3,
    term: 'the static port', gloss: 'sits flush with the fuselage to sense undisturbed ambient pressure',
    recallStem: 'Which opening senses ambient pressure without ram air effect?',
    confusions: ['av-pitot-tube', 'av-alternate-static'],
  },
  {
    id: 'av-blocked-pitot', chapter: CH, concepts: ['instrument-failures'], band: 3,
    identify: false,
    term: 'the airspeed indicator only', gloss: 'is what fails when the pitot tube becomes blocked',
    recallStem: 'Which instrument alone is affected by a blocked pitot tube?',
    confusions: ['av-blocked-static', 'av-vacuum-failure'],
    why: 'The pitot feeds nothing else. With the drain also blocked, the airspeed indicator then behaves like an altimeter - reading higher as you climb.',
  },
  {
    id: 'av-blocked-static', chapter: CH, concepts: ['instrument-failures'], band: 3,
    identify: false,
    term: 'the altimeter, airspeed indicator and vertical speed indicator', gloss: 'are all affected when the static port becomes blocked',
    recallStem: 'Which group of instruments does a blocked static port disable?',
    confusions: ['av-blocked-pitot', 'av-vacuum-failure'],
    why: 'All three pitot-static instruments need static pressure. The altimeter freezes at the blockage altitude and the VSI reads zero.',
  },
  {
    id: 'av-alternate-static', chapter: CH, concepts: ['instrument-failures'], band: 3,
    term: 'the alternate static source', gloss: 'draws static pressure from inside the cabin when the outside port is blocked',
    recallStem: 'Which system substitutes cabin pressure for a blocked static port?',
    confusions: ['av-static-port', 'av-blocked-static', 'av-pitot-heat'],
    why: 'Cabin pressure is usually slightly lower than outside, so the altimeter reads a little high and the airspeed a little fast.',
  },
  {
    id: 'av-pitot-heat', chapter: CH, concepts: ['instrument-failures'], band: 3,
    term: 'pitot heat', gloss: 'prevents the pitot tube from icing over in visible moisture',
    recallStem: 'Which system stops the airspeed probe icing up?',
    confusions: ['av-alternate-static', 'av-blocked-pitot'],
  },
  {
    id: 'av-vacuum-failure', chapter: CH, concepts: ['instrument-failures'], band: 3,
    identify: false,
    term: 'the attitude indicator and heading indicator', gloss: 'are the instruments lost when the vacuum pump fails',
    recallStem: 'Which instruments does a vacuum pump failure disable?',
    confusions: ['av-blocked-static', 'av-blocked-pitot'],
    why: 'The gyro instruments. The turn coordinator is usually electric, which is exactly why it is wired separately - it survives to give you a backup.',
  },
  {
    id: 'av-precession', chapter: CH, concepts: ['gyroscopic-instruments'], band: 3,
    term: 'precession', gloss: 'is the gyroscopic property by which a force applied to a spinning rotor takes effect 90 degrees later in the rotation',
    recallStem: 'Which gyroscopic property delays the effect of a force by 90 degrees of rotation?',
    confusions: ['av-rigidity', 'av-heading-indicator'],
  },
  {
    id: 'av-rigidity', chapter: CH, concepts: ['gyroscopic-instruments'], band: 3,
    term: 'rigidity in space', gloss: 'is the gyroscopic property that keeps a spinning rotor pointing the same way regardless of the aircraft',
    recallStem: 'Which gyroscopic property keeps the rotor axis fixed while the aircraft moves around it?',
    confusions: ['av-precession', 'av-attitude-indicator'],
  },
  {
    id: 'av-kollsman', chapter: CH, concepts: ['pitot-static-instruments'], band: 3,
    term: 'the Kollsman window', gloss: 'is the small window on the altimeter where the local pressure setting is entered',
    recallStem: 'Where on the altimeter is the local altimeter setting displayed?',
    confusions: ['av-standard-pressure', 'av-altimeter'],
  },

  // --- band 4: the airspeed chain and compass errors ------------------------------------------
  {
    id: 'av-ias', chapter: CH, concepts: ['airspeed-types'], band: 4,
    term: 'indicated airspeed', gloss: 'is the raw number read directly off the airspeed indicator',
    recallStem: 'Which airspeed is the uncorrected reading on the instrument?',
    confusions: ['av-cas', 'av-tas', 'av-groundspeed'],
  },
  {
    id: 'av-cas', chapter: CH, concepts: ['airspeed-types'], band: 4,
    term: 'calibrated airspeed', gloss: 'is indicated airspeed corrected for installation and instrument error',
    recallStem: 'Which airspeed is IAS corrected for installation error?',
    confusions: ['av-ias', 'av-tas', 'av-eas'],
  },
  {
    id: 'av-tas', chapter: CH, concepts: ['airspeed-types'], band: 4,
    term: 'true airspeed', gloss: 'is calibrated airspeed corrected for altitude and temperature, and it exceeds indicated airspeed as you climb',
    recallStem: 'Which airspeed accounts for altitude and temperature?',
    confusions: ['av-cas', 'av-groundspeed', 'av-ias'],
    why: 'Rule of thumb: true airspeed is about 2 percent higher than indicated for every 1,000 feet of altitude. The dial under-reads as the air thins.',
  },
  {
    id: 'av-eas', chapter: CH, concepts: ['airspeed-types'], band: 4,
    term: 'equivalent airspeed', gloss: 'is calibrated airspeed corrected for the compressibility of air at high speed',
    recallStem: 'Which airspeed corrects for compressibility effects?',
    confusions: ['av-cas', 'av-tas'],
  },
  {
    id: 'av-groundspeed', chapter: CH, concepts: ['airspeed-types'], band: 4,
    term: 'groundspeed', gloss: 'is true airspeed adjusted for the wind - the actual speed over the ground',
    recallStem: 'Which speed is the aircraft actual progress across the ground?',
    confusions: ['av-tas', 'av-ias', 'av-cas'],
  },
  {
    id: 'av-standard-pressure', chapter: CH, concepts: ['pitot-static-instruments'], band: 4,
    identify: false,
    term: '29.92 inches of mercury', gloss: 'is the standard sea level pressure setting, used above the transition altitude',
    recallStem: 'What is the standard altimeter setting used above 18,000 feet?',
    confusions: ['av-standard-temp', 'av-kollsman'],
    why: 'Equivalently 1013.2 millibars or hectopascals. Set it above 18,000 feet in the US and everyone is on the same reference.',
  },
  {
    id: 'av-standard-temp', chapter: CH, concepts: ['pitot-static-instruments'], band: 4,
    identify: false,
    term: '15 degrees Celsius', gloss: 'is the standard sea level temperature in the International Standard Atmosphere',
    recallStem: 'What is standard sea level temperature in the standard atmosphere?',
    confusions: ['av-standard-pressure', 'av-lapse-rate-4'],
  },
  {
    id: 'av-lapse-rate-4', chapter: CH, concepts: ['pitot-static-instruments'], band: 4,
    identify: false,
    term: 'about 2 degrees Celsius per 1,000 feet', gloss: 'is the standard temperature lapse rate with altitude',
    recallStem: 'What is the standard temperature lapse rate per 1,000 feet?',
    confusions: ['av-standard-temp', 'av-standard-pressure'],
  },
  {
    id: 'av-variation-instr', chapter: CH, concepts: ['magnetic-compass'], band: 4,
    term: 'variation', gloss: 'is the angular difference between true north and magnetic north at a given place',
    recallStem: 'Which compass error is the difference between true and magnetic north?',
    confusions: ['av-deviation-instr', 'av-dip-error', 'av-ands'],
  },
  {
    id: 'av-deviation-instr', chapter: CH, concepts: ['magnetic-compass'], band: 4,
    term: 'deviation', gloss: 'is compass error caused by the aircraft own metal and electrical equipment',
    recallStem: 'Which compass error is caused by the aircraft own electrical and metal parts?',
    confusions: ['av-variation-instr', 'av-dip-error'],
    why: 'It is why every aircraft carries a small correction card next to the compass - the error is unique to that airframe.',
  },
  {
    id: 'av-dip-error', chapter: CH, concepts: ['magnetic-compass'], band: 4,
    term: 'magnetic dip', gloss: 'is the pull of the magnetic field downward toward the poles, which causes turning and acceleration errors',
    recallStem: 'Which compass effect causes both turning and acceleration errors?',
    confusions: ['av-variation-instr', 'av-deviation-instr', 'av-ands'],
  },
  {
    id: 'av-ands', chapter: CH, concepts: ['magnetic-compass'], band: 4,
    term: 'ANDS', gloss: 'is the reminder that the compass Accelerates North and Decelerates South',
    recallStem: 'Which memory aid covers compass acceleration errors on easterly and westerly headings?',
    confusions: ['av-unos', 'av-dip-error'],
  },
  {
    id: 'av-unos', chapter: CH, concepts: ['magnetic-compass'], band: 4,
    term: 'UNOS', gloss: 'is the reminder that the compass Undershoots North and Overshoots South in a turn',
    recallStem: 'Which memory aid covers compass lead and lag when rolling out of a turn?',
    confusions: ['av-ands', 'av-dip-error'],
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-instr-b2', name: 'The six-pack' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-instr-b3', name: 'Systems and failures' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-instr-b4', name: 'Airspeeds and compass errors' }),
];
