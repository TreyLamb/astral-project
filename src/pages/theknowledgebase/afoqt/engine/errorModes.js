// Every named mistake the tool can diagnose, in one place.
//
// This is the payoff for insisting that a distractor is an ERROR MODE rather than a plausible
// number: after a drill the runner can say "you read Y as ascending on four of your five misses",
// which is a habit to fix, where "4/5" is only a score to feel bad about.
//
// Each subtest's templates contribute the modes its own mistakes come in. Table Reading's are
// spatial, the fact-driven subtests' are lexical, and later phases will add their own - Block
// Counting will want "counted a corner touch" and Instrument Comprehension "read the bank
// backwards". They live here rather than beside their templates so the results screen has one
// map to look in, and so two subtests cannot quietly define the same id differently.

export const ERROR_LABELS = {
  // --- Table Reading: every mistake is spatial -------------------------------------------
  'y-ascending': 'read Y as ascending (it descends)',
  'row-slip': 'slipped a row',
  'column-slip': 'slipped a column',
  'axes-swapped': 'swapped X and Y',
  'sign-blind': 'dropped a minus sign',
  'direction-flip': 'moved the wrong way down the Y axis',
  neighbour: 'landed on a neighbouring cell',

  // --- Fact-driven subtests: every mistake is a confusion ---------------------------------
  // Ordered by how diagnostic each one is. A declared confusion is a specific, nameable
  // mix-up; the other two mean "you were in the right subject but picked the wrong thing",
  // which is worth saying differently because it calls for different revision.
  'confused-terms': 'mixed up two terms that are easy to confuse',
  'same-concept': 'picked a related term from the same topic',
  'same-chapter': 'picked another term from this chapter',

  // --- Instrument Comprehension: the official distractor formula, named --------------------
  'bank-inverted': 'banked it the wrong way (the pointer is inverted)',
  'rear-view': 'took a rear view - that aircraft is heading north, away from you',
  'front-view': 'took a front view - that aircraft is heading south, toward you',
  'pitch-inverted': 'read a climb as a dive',
  'heading-quarter-turn': 'misread the compass by a quarter turn',
  'bank-missed': 'missed the bank entirely',

  // --- Block Counting: the two mistakes, and they are mirror images ------------------------
  // Worth separating, because they call for opposite corrections: one is a rule you are not
  // applying, the other is a pile you are not reading into.
  'counted-corners': 'counted blocks that only touch at a corner',
  'missed-hidden': 'missed a block hidden inside the pile',
};

export const labelFor = (id) => ERROR_LABELS[id] ?? id;
