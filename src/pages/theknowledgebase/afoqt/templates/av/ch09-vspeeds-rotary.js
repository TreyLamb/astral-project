// Chapter 9 - V-speeds, the airspeed indicator arcs, and rotary-wing basics.
//
// V-speeds are the single most memorisable block in the subtest: a fixed list of abbreviations
// with fixed meanings, asked directly. There is no reasoning to do and no way to derive them, so
// this is pure flashcard territory - which is exactly what this tool is for.
//
// The arcs on the airspeed indicator are the other half of the same fact set, and they interlock
// with the V-speeds by definition: the white arc runs from Vs0 to Vfe, the green arc from Vs1 to
// Vno, the yellow from Vno to Vne, and the red line sits at Vne. Learning them as one diagram is
// far more efficient than learning nine separate facts.
//
// Rotary-wing appears on the AFOQT because the Air Force flies helicopters. The controls and the
// four or five named phenomena are all that is ever asked.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-09-vspeeds-rotary';

registerFacts([
  // --- band 2: the six V-speeds every pilot quotes from memory -----------------------------------
  {
    id: 'av-vso', chapter: CH, concepts: ['v-speeds'], band: 2,
    term: 'Vs0', gloss: 'is the stall speed in the landing configuration, with flaps and gear extended',
    recallStem: 'Which V-speed is the stalling speed in the landing configuration?',
    confusions: ['av-vs1', 'av-vfe', 'av-vr'],
  },
  {
    id: 'av-vs1', chapter: CH, concepts: ['v-speeds'], band: 2,
    term: 'Vs1', gloss: 'is the stall speed in a specified clean configuration',
    recallStem: 'Which V-speed is the stalling speed with the aircraft clean?',
    confusions: ['av-vso', 'av-vno', 'av-va-9'],
  },
  {
    id: 'av-vr', chapter: CH, concepts: ['v-speeds'], band: 2,
    term: 'Vr', gloss: 'is rotation speed, at which back pressure is applied to lift the nosewheel on takeoff',
    recallStem: 'Which V-speed is the speed at which the nose is raised on takeoff?',
    confusions: ['av-vx', 'av-vy', 'av-vso'],
  },
  {
    id: 'av-vx', chapter: CH, concepts: ['v-speeds'], band: 2,
    term: 'Vx', gloss: 'is the best angle of climb speed, giving the most height gained per unit of distance travelled',
    recallStem: 'Which V-speed gives the greatest altitude gain per unit of horizontal distance?',
    confusions: ['av-vy', 'av-vr', 'av-vs1'],
    why: 'X for obstacle: Vx is what you use to clear the trees at the end of the runway. Vy gets you high fastest but takes more ground to do it.',
  },
  {
    id: 'av-vy', chapter: CH, concepts: ['v-speeds'], band: 2,
    term: 'Vy', gloss: 'is the best rate of climb speed, giving the most height gained per unit of time',
    recallStem: 'Which V-speed gives the greatest altitude gain per unit of time?',
    confusions: ['av-vx', 'av-vr', 'av-vno'],
  },
  // --- band 3: the configuration and structural limits -------------------------------------------
  {
    id: 'av-va-9', chapter: CH, concepts: ['v-speeds'], band: 3,
    term: 'Va', gloss: 'is design maneuvering speed, below which full control deflection will not overstress the airframe',
    recallStem: 'Which V-speed is the maximum for abrupt full control inputs?',
    confusions: ['av-vno', 'av-vne', 'av-vs1'],
  },
  {
    id: 'av-vfe', chapter: CH, concepts: ['v-speeds'], band: 3,
    term: 'Vfe', gloss: 'is the maximum speed with the flaps extended',
    recallStem: 'Which V-speed is the highest permitted with flaps down?',
    confusions: ['av-vle', 'av-vlo', 'av-vno'],
  },
  {
    id: 'av-vle', chapter: CH, concepts: ['v-speeds'], band: 3,
    term: 'Vle', gloss: 'is the maximum speed at which the aircraft may be flown with the landing gear already extended',
    recallStem: 'Which V-speed is the maximum with the gear down and locked?',
    confusions: ['av-vlo', 'av-vfe', 'av-vno'],
    why: 'Vle is EXTENDED - gear already down. Vlo is OPERATING - the act of raising or lowering it. Vlo is usually the lower of the two, because moving the doors is harder on the structure.',
  },
  {
    id: 'av-vlo', chapter: CH, concepts: ['v-speeds'], band: 3,
    term: 'Vlo', gloss: 'is the maximum speed at which the landing gear may be raised or lowered',
    recallStem: 'Which V-speed limits the actual operation of the landing gear?',
    confusions: ['av-vle', 'av-vfe'],
  },
  {
    id: 'av-vno', chapter: CH, concepts: ['v-speeds'], band: 3,
    term: 'Vno', gloss: 'is maximum structural cruising speed, not to be exceeded except in smooth air',
    recallStem: 'Which V-speed is the maximum structural cruising speed?',
    confusions: ['av-vne', 'av-va-9', 'av-vfe'],
  },
  {
    id: 'av-vne', chapter: CH, concepts: ['v-speeds'], band: 2,
    term: 'Vne', gloss: 'is the never-exceed speed, marked with a red line on the airspeed indicator',
    recallStem: 'Which V-speed must never be exceeded under any circumstances?',
    confusions: ['av-vno', 'av-va-9', 'av-red-line'],
  },

  // --- band 4: the arcs, which are the same facts drawn as a picture ------------------------------
  {
    id: 'av-white-arc', chapter: CH, concepts: ['airspeed-indicator-arcs'], band: 4,
    term: 'the white arc', gloss: 'is the flap operating range, running from Vs0 up to Vfe',
    recallStem: 'Which arc on the airspeed indicator is the flap operating range?',
    confusions: ['av-green-arc', 'av-yellow-arc', 'av-red-line'],
  },
  {
    id: 'av-green-arc', chapter: CH, concepts: ['airspeed-indicator-arcs'], band: 4,
    term: 'the green arc', gloss: 'is the normal operating range, running from Vs1 up to Vno',
    recallStem: 'Which arc on the airspeed indicator is the normal operating range?',
    confusions: ['av-white-arc', 'av-yellow-arc', 'av-red-line'],
  },
  {
    id: 'av-yellow-arc', chapter: CH, concepts: ['airspeed-indicator-arcs'], band: 4,
    term: 'the yellow arc', gloss: 'is the caution range from Vno to Vne, to be used only in smooth air',
    recallStem: 'Which arc on the airspeed indicator may be used only in smooth air?',
    confusions: ['av-green-arc', 'av-red-line', 'av-white-arc'],
  },
  {
    id: 'av-red-line', chapter: CH, concepts: ['airspeed-indicator-arcs'], band: 4,
    term: 'the red line', gloss: 'marks Vne, the speed beyond which structural failure may occur',
    recallStem: 'Which marking on the airspeed indicator shows the never-exceed speed?',
    confusions: ['av-yellow-arc', 'av-vne', 'av-green-arc'],
  },
  {
    id: 'av-arc-lower-white', chapter: CH, concepts: ['airspeed-indicator-arcs'], band: 4,
    term: 'the bottom of the white arc', gloss: 'marks the stall speed with flaps and gear extended',
    confusions: ['av-arc-lower-green', 'av-white-arc', 'av-green-arc'],
  },
  {
    id: 'av-arc-lower-green', chapter: CH, concepts: ['airspeed-indicator-arcs'], band: 4,
    term: 'the bottom of the green arc', gloss: 'marks the stall speed with the aircraft clean',
    confusions: ['av-arc-lower-white', 'av-green-arc', 'av-white-arc'],
  },

  // --- band 4: rotary-wing ------------------------------------------------------------------------
  {
    id: 'av-collective', chapter: CH, concepts: ['rotorcraft-controls'], band: 4,
    term: 'the collective', gloss: 'changes the pitch of all main rotor blades together, controlling climb and descent',
    recallStem: 'Which helicopter control changes the pitch of all blades together?',
    confusions: ['av-cyclic', 'av-antitorque-pedals', 'av-throttle-9'],
  },
  {
    id: 'av-cyclic', chapter: CH, concepts: ['rotorcraft-controls'], band: 4,
    term: 'the cyclic', gloss: 'tilts the rotor disc to move the helicopter forward, back or sideways',
    recallStem: 'Which helicopter control tilts the rotor disc to move the aircraft horizontally?',
    confusions: ['av-collective', 'av-antitorque-pedals', 'av-throttle-9'],
  },
  {
    id: 'av-antitorque-pedals', chapter: CH, concepts: ['rotorcraft-controls'], band: 4,
    term: 'the anti-torque pedals', gloss: 'vary tail rotor thrust to control the heading of a helicopter',
    recallStem: 'Which helicopter control counteracts main rotor torque and points the nose?',
    confusions: ['av-cyclic', 'av-collective', 'av-tail-rotor'],
  },
  {
    id: 'av-throttle-9', chapter: CH, concepts: ['rotorcraft-controls'], band: 4,
    term: 'the twist grip throttle', gloss: 'is mounted on the collective and sets engine RPM',
    confusions: ['av-collective', 'av-cyclic'],
  },
  {
    id: 'av-tail-rotor', chapter: CH, concepts: ['rotorcraft-controls'], band: 4,
    term: 'the tail rotor', gloss: 'produces sideways thrust to oppose the torque of the main rotor',
    recallStem: 'Which rotor counteracts the torque reaction of the main rotor?',
    confusions: ['av-antitorque-pedals', 'av-collective'],
  },
  {
    id: 'av-autorotation', chapter: CH, concepts: ['rotorcraft-aerodynamics'], band: 4,
    term: 'autorotation', gloss: 'is the descent in which airflow up through the rotor keeps it turning after an engine failure',
    recallStem: 'What is the engine-out descent that keeps the rotor turning called?',
    confusions: ['av-translational-lift', 'av-vortex-ring', 'av-retreating-blade-stall'],
    why: 'It is the helicopter equivalent of gliding. The rotor becomes a windmill, and the energy stored in it is spent to cushion the landing.',
  },
  {
    id: 'av-translational-lift', chapter: CH, concepts: ['rotorcraft-aerodynamics'], band: 4,
    term: 'translational lift', gloss: 'is the extra lift a helicopter gains as it accelerates into undisturbed air',
    recallStem: 'Which effect gives a helicopter extra lift as it moves into clean air?',
    confusions: ['av-autorotation', 'av-ground-effect-9', 'av-vortex-ring'],
  },
  {
    id: 'av-ground-effect-9', chapter: CH, concepts: ['rotorcraft-aerodynamics'], band: 4,
    term: 'hovering in ground effect', gloss: 'requires less power because the cushion of air beneath the rotor reduces induced flow',
    confusions: ['av-translational-lift', 'av-vortex-ring'],
  },
  {
    id: 'av-retreating-blade-stall', chapter: CH, concepts: ['rotorcraft-aerodynamics'], band: 4,
    term: 'retreating blade stall', gloss: 'limits helicopter forward speed when the rearward-moving blade loses lift',
    recallStem: 'Which condition limits how fast a helicopter can fly forward?',
    confusions: ['av-dissymmetry-of-lift', 'av-vortex-ring', 'av-autorotation'],
  },
  {
    id: 'av-dissymmetry-of-lift', chapter: CH, concepts: ['rotorcraft-aerodynamics'], band: 4,
    term: 'dissymmetry of lift', gloss: 'is the imbalance between the advancing and retreating blades in forward flight',
    recallStem: 'What is the lift imbalance across a rotor disc in forward flight called?',
    confusions: ['av-retreating-blade-stall', 'av-translational-lift'],
  },
  {
    id: 'av-vortex-ring', chapter: CH, concepts: ['rotorcraft-aerodynamics'], band: 4,
    term: 'vortex ring state', gloss: 'is settling with power, in which a helicopter descends into its own downwash and loses lift',
    recallStem: 'Which condition occurs when a helicopter settles into its own downwash?',
    confusions: ['av-autorotation', 'av-retreating-blade-stall', 'av-translational-lift'],
    why: 'The recovery is forward cyclic to fly out into clean air. Pulling more collective makes it worse, which is why it catches people.',
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-vspeed-b2', name: 'The core V-speeds' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-vspeed-b3', name: 'Configuration limits' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-vspeed-b4', name: 'Arcs and rotary-wing' }),
];
