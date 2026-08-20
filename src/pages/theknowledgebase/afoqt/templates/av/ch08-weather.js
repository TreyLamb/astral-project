// Chapter 8 - Weather and aircraft performance.
//
// Weather is one of the four sections the official AFOQT Knowledge Check is divided into, and
// two of the ten official items are here:
//   "Which weather condition is best for smooth flight?" -> cool and dry
//   "It is best to land" -> into the wind
// Both are common-sense questions with a physical reason behind them, which is the level.
//
// The one genuinely counter-intuitive block is DENSITY ALTITUDE, and it is worth the effort:
// hot, high and humid all make the air thinner, and thin air degrades everything at once - less
// lift, less thrust, less propeller bite, longer takeoff roll, worse climb. Humid is the part
// people get wrong, because moist air is LIGHTER than dry air, not heavier.

import { registerFacts, factTemplates } from '../../engine/facts.js';

const CH = 'av-08-weather';

registerFacts([
  // --- band 2: the atmosphere and pressure systems --------------------------------------------
  {
    id: 'av-troposphere', chapter: CH, concepts: ['atmosphere-and-pressure'], band: 2,
    term: 'the troposphere', gloss: 'is the lowest layer of the atmosphere, where essentially all weather occurs',
    recallStem: 'In which layer of the atmosphere does virtually all weather occur?',
    confusions: ['av-stratosphere', 'av-tropopause'],
  },
  {
    id: 'av-tropopause', chapter: CH, concepts: ['atmosphere-and-pressure'], band: 2,
    term: 'the tropopause', gloss: 'is the boundary at the top of the troposphere where the jet stream is found',
    recallStem: 'At which boundary is the jet stream found?',
    confusions: ['av-troposphere', 'av-stratosphere', 'av-jet-stream'],
  },
  {
    id: 'av-stratosphere', chapter: CH, concepts: ['atmosphere-and-pressure'], band: 2,
    term: 'the stratosphere', gloss: 'lies above the tropopause and has very little water vapour or turbulence',
    confusions: ['av-troposphere', 'av-tropopause'],
  },
  {
    id: 'av-jet-stream', chapter: CH, concepts: ['atmosphere-and-pressure'], band: 2,
    term: 'the jet stream', gloss: 'is a narrow band of very strong winds near the tropopause, generally flowing west to east',
    recallStem: 'Which high-altitude wind band flows generally from west to east?',
    confusions: ['av-tropopause', 'av-stratosphere'],
  },
  {
    id: 'av-high-pressure', chapter: CH, concepts: ['fronts-and-systems'], band: 2,
    term: 'a high pressure system', gloss: 'has descending air and circulates clockwise outward in the northern hemisphere, bringing good weather',
    recallStem: 'Which pressure system has descending air and generally fair weather?',
    confusions: ['av-low-pressure', 'av-cold-front', 'av-warm-front'],
    why: 'Sinking air warms and dries, so cloud cannot form. Lows do the opposite: rising air cools, water condenses, and you get weather.',
  },
  {
    id: 'av-low-pressure', chapter: CH, concepts: ['fronts-and-systems'], band: 2,
    term: 'a low pressure system', gloss: 'has rising air and circulates counter-clockwise inward in the northern hemisphere, bringing cloud and precipitation',
    recallStem: 'Which pressure system has rising air and generally poor weather?',
    confusions: ['av-high-pressure', 'av-cold-front', 'av-warm-front'],
  },
  {
    id: 'av-smooth-air', chapter: CH, concepts: ['fronts-and-systems'], band: 2,
    term: 'cool and dry air', gloss: 'gives the smoothest flight, because it lacks the moisture and heating that drive convection',
    recallStem: 'Which air mass gives the smoothest ride?',
    confusions: ['av-high-pressure', 'av-thermal-turbulence', 'av-low-pressure'],
    source: 'OATTS Knowledge Check, Weather',
  },
  {
    id: 'av-thermal-turbulence', chapter: CH, concepts: ['icing-and-turbulence'], band: 2,
    term: 'convective turbulence', gloss: 'is the bumpiness caused by columns of air rising from unevenly heated ground',
    recallStem: 'Which turbulence comes from rising columns of air over heated ground?',
    confusions: ['av-mechanical-turbulence', 'av-wind-shear', 'av-clear-air-turbulence'],
  },
  {
    id: 'av-mechanical-turbulence', chapter: CH, concepts: ['icing-and-turbulence'], band: 2,
    term: 'mechanical turbulence', gloss: 'is caused by wind being disrupted by terrain, buildings or trees',
    recallStem: 'Which turbulence is caused by wind striking terrain and structures?',
    confusions: ['av-thermal-turbulence', 'av-wind-shear', 'av-clear-air-turbulence'],
  },

  // --- band 3: fronts, clouds and fog ----------------------------------------------------------
  {
    id: 'av-cold-front', chapter: CH, concepts: ['fronts-and-systems'], band: 3,
    term: 'a cold front', gloss: 'moves fast and shoves warm air upward steeply, bringing brief violent weather and then clearing',
    recallStem: 'Which front brings brief, severe weather followed by rapid clearing?',
    confusions: ['av-warm-front', 'av-occluded-front', 'av-stationary-front'],
    why: 'Steep slope, fast movement, cumulus cloud, short and nasty. A warm front is the opposite: shallow, slow, stratus cloud, and hours of poor visibility.',
  },
  {
    id: 'av-warm-front', chapter: CH, concepts: ['fronts-and-systems'], band: 3,
    term: 'a warm front', gloss: 'rides slowly up over cold air, producing layered cloud, steady rain and long periods of poor visibility',
    recallStem: 'Which front brings layered cloud and prolonged steady precipitation?',
    confusions: ['av-cold-front', 'av-occluded-front', 'av-stationary-front'],
  },
  {
    id: 'av-stationary-front', chapter: CH, concepts: ['fronts-and-systems'], band: 3,
    term: 'a stationary front', gloss: 'is a boundary where neither air mass is displacing the other',
    recallStem: 'Which front occurs when neither air mass advances?',
    confusions: ['av-occluded-front', 'av-cold-front', 'av-warm-front'],
  },
  {
    id: 'av-occluded-front', chapter: CH, concepts: ['fronts-and-systems'], band: 3,
    term: 'an occluded front', gloss: 'forms when a fast cold front overtakes a warm front and lifts the warm air clear of the surface',
    recallStem: 'Which front forms when a cold front overtakes a warm front?',
    confusions: ['av-stationary-front', 'av-cold-front', 'av-warm-front'],
  },
  {
    id: 'av-cirrus', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'cirrus cloud', gloss: 'is high, thin and made of ice crystals, often the first sign of an approaching warm front',
    recallStem: 'Which cloud type is high, wispy and made of ice crystals?',
    confusions: ['av-stratus', 'av-cumulus', 'av-nimbus'],
  },
  {
    id: 'av-stratus', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'stratus cloud', gloss: 'forms in flat featureless layers and indicates stable air',
    recallStem: 'Which cloud type forms in flat layers and signals stable air?',
    confusions: ['av-cumulus', 'av-cirrus', 'av-nimbus'],
  },
  {
    id: 'av-cumulus', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'cumulus cloud', gloss: 'is heaped and puffy, and indicates unstable air and turbulence',
    recallStem: 'Which cloud type is heaped and signals unstable, turbulent air?',
    confusions: ['av-stratus', 'av-cirrus', 'av-nimbus'],
  },
  {
    id: 'av-nimbus', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'the prefix or suffix nimbus', gloss: 'indicates a cloud that is producing precipitation',
    recallStem: 'Which part of a cloud name tells you it is raining or snowing from it?',
    confusions: ['av-alto-prefix', 'av-cumulus', 'av-stratus'],
  },
  {
    id: 'av-alto-prefix', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'the prefix alto', gloss: 'indicates a cloud at middle altitude, roughly 6,500 to 20,000 feet',
    recallStem: 'Which prefix in a cloud name means middle altitude?',
    confusions: ['av-nimbus', 'av-cirrus'],
  },
  {
    id: 'av-radiation-fog', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'radiation fog', gloss: 'forms on clear calm nights as the ground cools the air above it to its dew point',
    recallStem: 'Which fog forms on clear, calm nights from ground cooling?',
    confusions: ['av-advection-fog', 'av-upslope-fog', 'av-steam-fog'],
  },
  {
    id: 'av-advection-fog', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'advection fog', gloss: 'forms when moist air moves horizontally over a colder surface, and needs wind to persist',
    recallStem: 'Which fog is caused by moist air blowing over a colder surface?',
    confusions: ['av-radiation-fog', 'av-upslope-fog', 'av-steam-fog'],
  },
  {
    id: 'av-upslope-fog', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'upslope fog', gloss: 'forms as moist air is pushed up rising terrain and cools by expansion',
    confusions: ['av-radiation-fog', 'av-advection-fog'],
  },
  {
    id: 'av-steam-fog', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'steam fog', gloss: 'forms when cold dry air moves over much warmer water',
    confusions: ['av-advection-fog', 'av-radiation-fog'],
  },
  {
    id: 'av-dew-point', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'the dew point', gloss: 'is the temperature at which the air becomes saturated and moisture begins to condense',
    recallStem: 'At which temperature does air become saturated?',
    confusions: ['av-temperature-inversion', 'av-radiation-fog'],
    why: 'When temperature and dew point converge to within a few degrees, expect cloud, fog or precipitation.',
  },
  {
    id: 'av-temperature-inversion', chapter: CH, concepts: ['clouds-and-fog'], band: 3,
    term: 'a temperature inversion', gloss: 'is a layer in which temperature rises with height instead of falling, trapping haze beneath it',
    recallStem: 'What is a layer where temperature increases with altitude called?',
    confusions: ['av-dew-point', 'av-stratus'],
  },

  // --- band 4: hazards and density altitude -----------------------------------------------------
  {
    id: 'av-cumulus-stage', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'the cumulus stage', gloss: 'is the first stage of a thunderstorm, dominated by a continuous updraught',
    recallStem: 'Which thunderstorm stage is characterised by updraughts only?',
    confusions: ['av-mature-stage', 'av-dissipating-stage'],
  },
  {
    id: 'av-mature-stage', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'the mature stage', gloss: 'is the most dangerous stage of a thunderstorm, when updraughts and downdraughts coexist and rain begins',
    recallStem: 'Which thunderstorm stage is the most dangerous to fly near?',
    confusions: ['av-cumulus-stage', 'av-dissipating-stage', 'av-microburst'],
    why: 'The tell is rain reaching the ground. That means a downdraught now exists alongside the updraught, and the shear between them is what tears aircraft apart.',
  },
  {
    id: 'av-dissipating-stage', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'the dissipating stage', gloss: 'is the final stage of a thunderstorm, dominated by downdraughts as the cell rains itself out',
    confusions: ['av-mature-stage', 'av-cumulus-stage'],
  },
  {
    id: 'av-microburst', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'a microburst', gloss: 'is a small intense column of sinking air producing a violent, brief outflow near the surface',
    recallStem: 'Which hazard is a small, intense downdraught with a severe surface outflow?',
    confusions: ['av-wind-shear', 'av-mature-stage', 'av-clear-air-turbulence'],
  },
  {
    id: 'av-wind-shear', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'wind shear', gloss: 'is a sudden change in wind speed or direction over a short distance',
    recallStem: 'What is a sudden change of wind speed or direction over a short distance called?',
    confusions: ['av-microburst', 'av-clear-air-turbulence', 'av-mechanical-turbulence'],
  },
  {
    id: 'av-clear-air-turbulence', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'clear air turbulence', gloss: 'occurs at high altitude near the jet stream with no cloud to warn of it',
    recallStem: 'Which turbulence occurs at altitude with no cloud to signal it?',
    confusions: ['av-wind-shear', 'av-mechanical-turbulence', 'av-microburst'],
  },
  {
    id: 'av-clear-ice', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'clear ice', gloss: 'is hard, heavy and transparent, forming from large supercooled droplets that flow back before freezing',
    recallStem: 'Which structural ice is transparent, dense and the hardest to shed?',
    confusions: ['av-rime-ice', 'av-mixed-ice', 'av-frost'],
  },
  {
    id: 'av-rime-ice', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'rime ice', gloss: 'is opaque, milky and brittle, forming from small droplets that freeze on contact',
    recallStem: 'Which structural ice is opaque, milky and forms from small droplets?',
    confusions: ['av-clear-ice', 'av-mixed-ice', 'av-frost'],
  },
  {
    id: 'av-mixed-ice', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'mixed ice', gloss: 'combines the characteristics of clear and rime ice in a single accumulation',
    confusions: ['av-clear-ice', 'av-rime-ice'],
  },
  {
    id: 'av-frost', chapter: CH, concepts: ['icing-and-turbulence'], band: 4,
    term: 'frost', gloss: 'must be removed before flight because it disrupts airflow and can prevent the wing lifting at all',
    recallStem: 'Which surface contamination must always be removed before flight, even though it adds almost no weight?',
    confusions: ['av-rime-ice', 'av-clear-ice'],
    why: 'It is not the weight - it is the roughness. Frost spoils the airflow enough to stop the wing producing lift on the takeoff roll.',
  },
  {
    id: 'av-density-altitude', chapter: CH, concepts: ['density-altitude'], band: 4,
    term: 'density altitude', gloss: 'is pressure altitude corrected for temperature, and it is the figure that governs aircraft performance',
    recallStem: 'Which altitude actually determines how an aircraft will perform?',
    confusions: ['av-pressure-altitude', 'av-true-altitude', 'av-high-density-effect'],
  },
  {
    id: 'av-pressure-altitude', chapter: CH, concepts: ['density-altitude'], band: 4,
    term: 'pressure altitude', gloss: 'is the altitude read when the altimeter is set to 29.92 inches of mercury',
    recallStem: 'Which altitude is read with the altimeter set to 29.92?',
    confusions: ['av-density-altitude', 'av-true-altitude'],
  },
  {
    id: 'av-true-altitude', chapter: CH, concepts: ['density-altitude'], band: 4,
    term: 'true altitude', gloss: 'is the actual height above mean sea level',
    recallStem: 'Which altitude is the real height above mean sea level?',
    confusions: ['av-pressure-altitude', 'av-density-altitude'],
  },
  {
    id: 'av-high-density-effect', chapter: CH, concepts: ['density-altitude'], band: 4,
    term: 'high density altitude', gloss: 'produces a longer takeoff roll and a reduced rate of climb',
    confusions: ['av-density-altitude', 'av-humid-air', 'av-pressure-altitude'],
    why: 'Thin air degrades everything at once: the wing makes less lift, the engine draws less air, and the propeller has less to bite on.',
  },
  {
    id: 'av-humid-air', chapter: CH, concepts: ['density-altitude'], band: 4,
    term: 'humid air', gloss: 'is less dense than dry air, which is why humidity worsens aircraft performance',
    confusions: ['av-high-density-effect', 'av-density-altitude'],
    why: 'The counter-intuitive one. A water molecule is lighter than the nitrogen or oxygen it displaces, so moist air weighs LESS - which is why hot, high AND humid all hurt.',
  },
]);

export default [
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 2, idBase: 'av-wx-b2', name: 'Atmosphere and systems' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 3, idBase: 'av-wx-b3', name: 'Fronts, cloud and fog' }),
  ...factTemplates({ subtest: 'AI', chapter: CH, band: 4, idBase: 'av-wx-b4', name: 'Hazards and performance' }),
];
