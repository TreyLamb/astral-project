// Prose furniture for Arithmetic Reasoning.
//
// Every other subtest varies its items by varying NUMBERS. This one has to vary the sentence
// too, or forty drills teach the shape of one paragraph rather than the skill of reading a
// paragraph. So names, objects and settings are drawn alongside the parameters, and the stem
// counter in the template audit is measuring something real.
//
// Kept deliberately plain. AFOQT word problems are written in flat administrative English -
// no jokes, no scene-setting, no names that pull attention - and a drill that reads more
// colourfully than the test is training the wrong reading speed.

/**
 * Provenance for a template modelled on a specific official item. OATTS is USAF material
 * cleared for public release, so unlike the commercial books it may be cited directly - and
 * citing it is the point, since it lets Trey open the original and check the calibration.
 */
export const OATTS = {
  kind: 'derived',
  source: 'OATTS (official USAF) Arithmetic Reasoning Knowledge Check',
  url: 'https://github.com/af-oatts/content',
};

/** "twice" reads like English; "2 times" reads like a calculator. The test uses the words. */
export const MULT_WORD = { 2: 'twice', 3: 'three times', 4: 'four times', 5: 'five times',
  6: 'six times', 7: 'seven times', 8: 'eight times', 9: 'nine times' };
export const times = (k) => MULT_WORD[k] ?? `${k} times`;

export const NAMES = [
  'Alvarez', 'Brooks', 'Chen', 'Diaz', 'Ellis', 'Fowler', 'Grant', 'Hayes', 'Ibrahim',
  'Jensen', 'Kaur', 'Lawson', 'Meyer', 'Novak', 'Okafor', 'Patel', 'Quinn', 'Reyes',
  'Sorensen', 'Tran', 'Vaughn', 'Walsh', 'Yates', 'Zimmer',
];

// Both `verb` (past tense, for the setup sentence) and `bare` (for "how many did X ___?") are
// DECLARED rather than derived. Stripping "ed" looked fine until the questions were read out
// loud: it turns filed into "fil", moved into "mov", assembled into "assembl", logged into
// "logg", and leaves the irregular "sold" untouched - five of ten entries broken, and not one
// of them visible to any structural check, because a mangled verb is still a valid string.

/** Countable objects for "loaded / sold / assembled N of them" items. */
export const COUNTABLES = [
  { one: 'crate', many: 'crates', verb: 'loaded', bare: 'load' },
  { one: 'carton', many: 'cartons', verb: 'packed', bare: 'pack' },
  { one: 'pallet', many: 'pallets', verb: 'moved', bare: 'move' },
  { one: 'report', many: 'reports', verb: 'filed', bare: 'file' },
  { one: 'panel', many: 'panels', verb: 'installed', bare: 'install' },
  { one: 'box', many: 'boxes', verb: 'stacked', bare: 'stack' },
  { one: 'ticket', many: 'tickets', verb: 'sold', bare: 'sell' },
  { one: 'kit', many: 'kits', verb: 'assembled', bare: 'assemble' },
  { one: 'sample', many: 'samples', verb: 'logged', bare: 'log' },
  { one: 'container', many: 'containers', verb: 'sealed', bare: 'seal' },
];

/** Things measured in pounds, so a total can be split among people. */
export const WEIGHED = [
  { one: 'pound of apples', many: 'pounds of apples', verb: 'picked', bare: 'pick' },
  { one: 'pound of scrap', many: 'pounds of scrap', verb: 'collected', bare: 'collect' },
  { one: 'pound of gravel', many: 'pounds of gravel', verb: 'hauled', bare: 'haul' },
  { one: 'pound of produce', many: 'pounds of produce', verb: 'gathered', bare: 'gather' },
];

/** Vehicles and the speeds that read naturally with them, for rate/time/distance items. */
export const TRAVEL = [
  { mode: 'car', verb: 'drives', slow: 25, fast: 70 },
  { mode: 'truck', verb: 'drives', slow: 30, fast: 65 },
  { mode: 'van', verb: 'drives', slow: 25, fast: 60 },
  { mode: 'train', verb: 'travels', slow: 40, fast: 90 },
  { mode: 'boat', verb: 'travels', slow: 8, fast: 30 },
];

/** Rooms and surfaces, for the area/volume-in-words chapter. */
export const ROOMS = [
  { name: 'storage room', surface: 'floor' },
  { name: 'workshop', surface: 'floor' },
  { name: 'hangar bay', surface: 'floor' },
  { name: 'briefing room', surface: 'floor' },
  { name: 'corridor', surface: 'floor' },
  { name: 'loading dock', surface: 'floor' },
];

export const CONTAINERS = [
  { name: 'shipping crate', unit: 'foot', unitPl: 'feet' },
  { name: 'water tank', unit: 'foot', unitPl: 'feet' },
  { name: 'storage bin', unit: 'foot', unitPl: 'feet' },
  { name: 'cargo box', unit: 'foot', unitPl: 'feet' },
];

/** Priced goods for percent and discount items - durable things bought one at a time. */
export const GOODS = [
  'jacket', 'toolset', 'monitor', 'chair', 'printer', 'backpack', 'lamp', 'keyboard',
  'tent', 'heater', 'radio', 'camera',
];

/**
 * Goods sold BY WEIGHT, which is a different list from GOODS and has to be. A best-buy item
 * compares two package sizes of one commodity, and "a tent, 28 ounces for $9.24" is not a
 * thing anyone has ever bought.
 */
export const BULK_GOODS = [
  'coffee', 'rice', 'laundry detergent', 'birdseed', 'flour', 'trail mix',
  'grass seed', 'oats', 'dried beans', 'sugar',
];

/**
 * Objects heavy enough to be quoted in pounds. COUNTABLES holds reports, tickets and samples,
 * which are countable but weightless - drawing from it for a weight item produced "5 identical
 * tickets weigh 100 pounds", a perfectly well-formed question about a twenty-pound ticket.
 */
export const WEIGHABLE = [
  { one: 'crate', many: 'crates', lo: 12, hi: 60 },
  { one: 'carton', many: 'cartons', lo: 4, hi: 30 },
  { one: 'pallet', many: 'pallets', lo: 40, hi: 120 },
  { one: 'sandbag', many: 'sandbags', lo: 20, hi: 50 },
  { one: 'toolbox', many: 'toolboxes', lo: 8, hi: 40 },
  { one: 'drum', many: 'drums', lo: 30, hi: 90 },
];

/** Vessels that leak, in the register a US test paper uses. */
export const VESSELS = [
  { thing: 'storage tank', verb: 'leaks' },
  { thing: 'radiator', verb: 'loses' },
  { thing: 'holding tank', verb: 'leaks' },
  { thing: 'water heater', verb: 'loses' },
];

/** Pounds with the singular handled, so a distractor of 1 never prints "1 pounds". */
export const lbs = (x) => `${x} pound${x === 1 ? '' : 's'}`;

/**
 * Populations a percent can be taken of.
 *
 * `subNoun` exists so the SECOND stage can name the subgroup outright. Referring back with
 * "those residents" left it genuinely ambiguous whether the second percentage applied to the
 * subgroup or to everyone - and on an item whose entire subject is which number is the base,
 * an ambiguous base is not a hard question, it is a broken one. `past`/`bare` give the stage-two
 * action a form that negates cleanly in the question.
 */
export const POPULATIONS = [
  { whole: 'squadron', member: 'airmen', sub: 'qualified on the new system',
    subNoun: 'qualified airmen', past: 'passed the fitness assessment', bare: 'pass it' },
  { whole: 'university', member: 'students', sub: 'enrolled full time',
    subNoun: 'full-time students', past: 'registered before the deadline', bare: 'register in time' },
  { whole: 'plant', member: 'employees', sub: 'assigned to the day shift',
    subNoun: 'day-shift employees', past: 'completed the safety course', bare: 'complete it' },
  { whole: 'district', member: 'residents', sub: 'registered to vote',
    subNoun: 'registered voters', past: 'cast a ballot', bare: 'vote' },
  { whole: 'conference', member: 'attendees', sub: 'staying overnight',
    subNoun: 'overnight attendees', past: 'booked through the conference hotel', bare: 'book through it' },
];

/** Employers, for items about a workforce rising or falling. A district does not "employ". */
export const ORGS = [
  'manufacturing plant', 'logistics company', 'regional airline', 'hospital network',
  'construction firm', 'engineering contractor',
];

/** Two people draw without replacement - a repeat name reads as a typo, not a coincidence. */
export function twoNames(h) {
  const a = h.pick(NAMES);
  let b = h.pick(NAMES);
  if (b === a) b = NAMES[(NAMES.indexOf(a) + 1) % NAMES.length];
  return [a, b];
}

export function threeNames(h) {
  const [a, b] = twoNames(h);
  let c = h.pick(NAMES);
  while (c === a || c === b) c = NAMES[(NAMES.indexOf(c) + 1) % NAMES.length];
  return [a, b, c];
}

/** "1 hour 25 minutes" reads like a clock; "85 minutes" reads like a stopwatch. Test uses both. */
export function minutesPhrase(mins) {
  if (mins < 60) return `${mins} minutes`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hp = `${h} hour${h === 1 ? '' : 's'}`;
  return m === 0 ? hp : `${hp} ${m} minutes`;
}

/** Plural agreement, so a drawn count never prints "1 crates". */
export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
