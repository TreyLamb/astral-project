// Chapter 5 - Engines and propellers.
//
// One official AFOQT item lives here and it is a good indicator of the level:
//   "If the aircraft ammeter is indicating a minus value, this means the" -> generator or
//    alternator output is inadequate.
// That is a systems question with a common-sense answer, not an engineering one. The chapter is
// built to match: know which engine is which, know the four strokes in order, and know the four
// left-turning tendencies by name.
//
// The four left-turning tendencies (torque, P-factor, gyroscopic precession, spiralling
// slipstream) are the highest-value thing here - they are distinct, nameable, and every one of
// them is a plausible distractor for the other three.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-05-powerplant';

registerFacts([
  // --- band 2: engine types -----------------------------------------------------------------
  {
    id: 'av-reciprocating', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'a reciprocating engine', gloss: 'drives a propeller using pistons moving up and down in cylinders',
    recallStem: 'Which engine type uses pistons in cylinders to turn a propeller?',
    confusions: ['av-turboprop', 'av-turbojet', 'av-turbofan'],
  },
  {
    id: 'av-turbojet', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'a turbojet', gloss: 'produces thrust entirely from the jet of exhaust gas leaving the engine',
    recallStem: 'Which engine produces all of its thrust from exhaust gas velocity?',
    confusions: ['av-turbofan', 'av-turboprop', 'av-turboshaft'],
  },
  {
    id: 'av-turbofan', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'a turbofan', gloss: 'produces most of its thrust from a large ducted fan bypassing the core',
    recallStem: 'Which engine gets most of its thrust from a ducted fan around the core?',
    confusions: ['av-turbojet', 'av-turboprop', 'av-turboshaft'],
    why: 'The efficient choice at airliner speeds, which is why almost every large transport uses one. High bypass ratio means quieter and more efficient.',
  },
  {
    id: 'av-turboprop', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'a turboprop', gloss: 'uses a turbine to drive a propeller through a reduction gearbox',
    recallStem: 'Which engine uses a turbine to turn a propeller through a gearbox?',
    confusions: ['av-turboshaft', 'av-turbofan', 'av-reciprocating'],
  },
  {
    id: 'av-turboshaft', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'a turboshaft', gloss: 'delivers its power to a shaft rather than to a propeller or a jet, and is the usual helicopter engine',
    recallStem: 'Which engine delivers power to a drive shaft and is standard on helicopters?',
    confusions: ['av-turboprop', 'av-turbojet', 'av-turbofan'],
  },
  {
    id: 'av-ramjet', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'a ramjet', gloss: 'has no moving compressor and cannot produce thrust until it is already moving fast',
    recallStem: 'Which engine has no compressor and cannot start from a standstill?',
    confusions: ['av-turbojet', 'av-turbofan'],
  },
  {
    id: 'av-afterburner', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'an afterburner', gloss: 'injects extra fuel into the exhaust to add thrust at a heavy cost in fuel',
    recallStem: 'Which system burns additional fuel in the exhaust stream for extra thrust?',
    confusions: ['av-turbojet', 'av-ramjet', 'av-turbofan'],
  },
  {
    id: 'av-thrust-reverser', chapter: CH, concepts: ['engine-types'], band: 2,
    term: 'a thrust reverser', gloss: 'redirects engine exhaust forward to help slow an aircraft after landing',
    recallStem: 'Which system redirects exhaust forward to slow the aircraft on the runway?',
    confusions: ['av-afterburner', 'av-turbofan'],
  },

  // --- band 3: how a piston engine runs ------------------------------------------------------
  {
    id: 'av-intake-stroke', chapter: CH, concepts: ['four-stroke-cycle'], band: 3,
    term: 'the intake stroke', gloss: 'is the first stroke, drawing the fuel-air mixture into the cylinder',
    recallStem: 'Which stroke draws the fuel-air mixture into the cylinder?',
    confusions: ['av-compression-stroke', 'av-power-stroke', 'av-exhaust-stroke'],
    why: 'The order is intake, compression, power, exhaust - "suck, squeeze, bang, blow".',
  },
  {
    id: 'av-compression-stroke', chapter: CH, concepts: ['four-stroke-cycle'], band: 3,
    term: 'the compression stroke', gloss: 'is the second stroke, squeezing the mixture before ignition',
    recallStem: 'Which stroke compresses the mixture before the spark?',
    confusions: ['av-intake-stroke', 'av-power-stroke', 'av-exhaust-stroke'],
  },
  {
    id: 'av-power-stroke', chapter: CH, concepts: ['four-stroke-cycle'], band: 3,
    term: 'the power stroke', gloss: 'is the third stroke, in which the burning mixture drives the piston down',
    recallStem: 'Which stroke actually produces the engine power?',
    confusions: ['av-compression-stroke', 'av-exhaust-stroke', 'av-intake-stroke'],
  },
  {
    id: 'av-exhaust-stroke', chapter: CH, concepts: ['four-stroke-cycle'], band: 3,
    term: 'the exhaust stroke', gloss: 'is the fourth stroke, pushing burnt gases out of the cylinder',
    recallStem: 'Which stroke expels the burnt gases?',
    confusions: ['av-power-stroke', 'av-intake-stroke', 'av-compression-stroke'],
  },
  {
    id: 'av-magneto', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'a magneto', gloss: 'generates the ignition spark independently of the aircraft electrical system',
    recallStem: 'Which component makes the ignition spark without needing the electrical system?',
    confusions: ['av-alternator', 'av-carburetor', 'av-spark-redundancy'],
    why: 'Self-powered, which is why the engine keeps running if the electrical system fails entirely.',
  },
  {
    id: 'av-spark-redundancy', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'dual magnetos and two spark plugs per cylinder', gloss: 'give redundancy and a more complete, even burn',
    confusions: ['av-magneto', 'av-alternator'],
  },
  {
    id: 'av-carburetor', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'a carburetor', gloss: 'mixes fuel with incoming air using the pressure drop through a venturi',
    recallStem: 'Which component meters fuel into the airflow using a venturi?',
    confusions: ['av-fuel-injection', 'av-mixture-control', 'av-carb-ice'],
  },
  {
    id: 'av-fuel-injection', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'fuel injection', gloss: 'sprays fuel directly at each cylinder and is not vulnerable to induction icing',
    recallStem: 'Which fuel system delivers fuel to each cylinder and cannot suffer carburetor ice?',
    confusions: ['av-carburetor', 'av-carb-ice', 'av-mixture-control'],
  },
  {
    id: 'av-carb-ice', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'carburetor ice', gloss: 'forms from the temperature drop as fuel vaporises, and can occur on warm humid days',
    recallStem: 'Which hazard can form in the induction system even at outside temperatures well above freezing?',
    confusions: ['av-carburetor', 'av-carb-heat', 'av-fuel-injection'],
    why: 'The counter-intuitive one, and therefore the one that gets asked: vaporising fuel cools the air by tens of degrees, so ice can form at 20 degrees Celsius on a humid day.',
  },
  {
    id: 'av-carb-heat', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'carburetor heat', gloss: 'routes warm air into the induction system to melt or prevent carburetor ice',
    recallStem: 'Which control feeds warmed air to the induction system?',
    confusions: ['av-carb-ice', 'av-mixture-control', 'av-carburetor'],
  },
  {
    id: 'av-mixture-control', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'the mixture control', gloss: 'leans the fuel-air ratio as altitude increases and the air becomes less dense',
    recallStem: 'Which control adjusts the fuel-air ratio for altitude?',
    confusions: ['av-carb-heat', 'av-carburetor', 'av-throttle-5'],
    why: 'Thinner air at altitude means the same fuel flow makes the mixture too rich. Leaning restores the ratio.',
  },
  {
    id: 'av-throttle-5', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'the throttle', gloss: 'controls how much fuel-air mixture reaches the cylinders, and therefore engine power',
    confusions: ['av-mixture-control', 'av-prop-control'],
  },
  {
    id: 'av-detonation', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'detonation', gloss: 'is the uncontrolled explosion of the mixture after the spark, instead of a smooth burn',
    recallStem: 'Which abnormal combustion happens after the spark rather than before it?',
    confusions: ['av-preignition', 'av-carb-ice'],
  },
  {
    id: 'av-preignition', chapter: CH, concepts: ['induction-and-fuel'], band: 3,
    term: 'pre-ignition', gloss: 'is the mixture igniting before the spark, usually from a hot spot in the cylinder',
    recallStem: 'Which abnormal combustion happens before the spark plug fires?',
    confusions: ['av-detonation', 'av-carb-ice'],
  },

  // --- band 4: propellers and the left-turning tendencies -------------------------------------
  {
    id: 'av-fixed-pitch', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'a fixed-pitch propeller', gloss: 'has a blade angle set at manufacture that cannot be changed in flight',
    recallStem: 'Which propeller has a blade angle that cannot be altered in flight?',
    confusions: ['av-constant-speed', 'av-feathering', 'av-prop-control'],
  },
  {
    id: 'av-constant-speed', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'a constant-speed propeller', gloss: 'varies its blade angle automatically to hold a selected engine RPM',
    recallStem: 'Which propeller adjusts blade angle to maintain a chosen RPM?',
    confusions: ['av-fixed-pitch', 'av-feathering', 'av-prop-control'],
  },
  {
    id: 'av-feathering', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'feathering', gloss: 'turns the blades edge-on to the airflow to minimise drag from a failed engine',
    recallStem: 'What is turning the blades edge-on to the airflow after an engine failure called?',
    confusions: ['av-constant-speed', 'av-fixed-pitch', 'av-reverse-pitch'],
  },
  {
    id: 'av-reverse-pitch', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'reverse pitch', gloss: 'angles the blades to push air forward, slowing the aircraft on the ground',
    recallStem: 'Which propeller setting pushes air forward to slow the aircraft after landing?',
    confusions: ['av-feathering', 'av-constant-speed'],
  },
  {
    id: 'av-prop-control', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'the propeller control', gloss: 'sets the RPM the governor will maintain on a constant-speed installation',
    confusions: ['av-constant-speed', 'av-throttle-5', 'av-manifold-pressure'],
  },
  {
    id: 'av-torque-effect', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'torque effect', gloss: 'rolls the aircraft opposite to the propeller rotation, by Newton third law',
    recallStem: 'Which left-turning tendency is the equal and opposite reaction to propeller rotation?',
    confusions: ['av-p-factor', 'av-spiralling-slipstream', 'av-gyro-precession-5'],
  },
  {
    id: 'av-p-factor', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'P-factor', gloss: 'is the yaw caused at high angles of attack when the descending blade bites more air than the ascending one',
    recallStem: 'Which left-turning tendency comes from the descending blade taking a bigger bite of air?',
    confusions: ['av-torque-effect', 'av-spiralling-slipstream', 'av-gyro-precession-5'],
    why: 'Strongest when slow and nose-high - climbing out after takeoff, which is exactly when you feel it.',
  },
  {
    id: 'av-spiralling-slipstream', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'spiralling slipstream', gloss: 'is the corkscrewing propeller wash striking one side of the vertical fin and yawing the aircraft',
    recallStem: 'Which left-turning tendency is the propeller wash striking the vertical stabilizer?',
    confusions: ['av-torque-effect', 'av-p-factor', 'av-gyro-precession-5'],
  },
  {
    id: 'av-gyro-precession-5', chapter: CH, concepts: ['propeller-effects'], band: 4,
    term: 'gyroscopic precession', gloss: 'yaws the aircraft when the propeller disc is pitched, because the force acts 90 degrees later',
    recallStem: 'Which left-turning tendency appears only when the pitch attitude is being changed?',
    confusions: ['av-p-factor', 'av-torque-effect', 'av-spiralling-slipstream'],
  },
  {
    id: 'av-ammeter', chapter: CH, concepts: ['engine-instruments'], band: 4,
    term: 'an inadequate alternator or generator output', gloss: 'is what a negative ammeter reading indicates',
    confusions: ['av-oil-pressure', 'av-manifold-pressure', 'av-egt'],
    source: 'AFPC pamphlet, Aviation Information sample item 4',
    why: 'A minus reading means the battery is being discharged to carry the load, so the charging system is not keeping up.',
  },
  {
    id: 'av-oil-pressure', chapter: CH, concepts: ['engine-instruments'], band: 4,
    term: 'the oil pressure gauge', gloss: 'is the first instrument to check after starting, and a lack of indication means shut down',
    recallStem: 'Which engine instrument must show a reading within seconds of start or the engine is shut down?',
    confusions: ['av-ammeter', 'av-egt', 'av-manifold-pressure'],
  },
  {
    id: 'av-manifold-pressure', chapter: CH, concepts: ['engine-instruments'], band: 4,
    term: 'the manifold pressure gauge', gloss: 'shows the pressure of the fuel-air charge entering the cylinders, as a measure of power',
    recallStem: 'Which instrument shows induction system pressure as a measure of engine power?',
    confusions: ['av-tachometer', 'av-oil-pressure', 'av-egt'],
  },
  {
    id: 'av-tachometer', chapter: CH, concepts: ['engine-instruments'], band: 4,
    term: 'the tachometer', gloss: 'shows engine speed in revolutions per minute',
    recallStem: 'Which instrument shows engine RPM?',
    confusions: ['av-manifold-pressure', 'av-egt', 'av-oil-pressure'],
  },
  {
    id: 'av-egt', chapter: CH, concepts: ['engine-instruments'], band: 4,
    term: 'the exhaust gas temperature gauge', gloss: 'is used to lean the mixture precisely by finding the peak temperature',
    recallStem: 'Which instrument is used to set the mixture accurately?',
    confusions: ['av-tachometer', 'av-manifold-pressure', 'av-ammeter'],
  },
  {
    id: 'av-alternator', chapter: CH, concepts: ['engine-instruments'], band: 4,
    term: 'the alternator', gloss: 'supplies electrical power in flight and keeps the battery charged',
    recallStem: 'Which component supplies electrical power in flight and recharges the battery?',
    confusions: ['av-magneto', 'av-ammeter'],
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-power-b2', name: 'Engine types' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-power-b3', name: 'The piston engine' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-power-b4', name: 'Propellers and instruments' }),
];
