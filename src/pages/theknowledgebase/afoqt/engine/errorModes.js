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

  // --- Verbal Analogies: engine/analogy.js's buildMatch/buildFourthTerm --------------------
  'reversed-order': 'reversed the pair (right words, wrong order)',
  'wrong-relation': "picked a pair related a different way than the base pair",
  'reused-base-word': 'picked a word already used earlier in the analogy',

  // --- Situational Judgment: engine/judgment.js tags a wrong action with the COMPETENCY lens
  // it actually represents (there is no error-mode/confusion concept for SJT - see that file's
  // own header comment), so the six ids here are COMPETENCIES verbatim, not new taxonomy.
  'integrity-professionalism': 'leaned on an integrity/professionalism angle over the stronger action',
  leadership: 'leaned on a leadership angle over the stronger action',
  'resource-management': 'leaned on a resource-management angle over the stronger action',
  communication: 'leaned on a communication angle over the stronger action',
  innovation: 'leaned on an innovation angle over the stronger action',
  mentoring: 'leaned on a mentoring angle over the stronger action',

  // --- Word Knowledge: engine/words.js -----------------------------------------------------
  // The reversed stem ("most nearly OPPOSITE") is the whole trap here, so the four ways of
  // getting the direction wrong are kept separate - each calls for a different correction.
  'antonym-trap': 'picked the opposite when the meaning was asked',
  'took-the-synonym': 'picked the meaning when the opposite was asked',
  'related-not-synonym': 'picked a related word rather than what it means',
  'related-not-opposite': 'picked a related word rather than its opposite',
  'wrong-meaning': 'picked a meaning the word does not have',
  'wrong-charge': 'misjudged whether the word is approving, neutral or critical',
  'confused-with': 'gave the meaning of a similar-looking word',
  'confused-parts': 'confused it with a different word part',

  // --- Math Knowledge: engine-free, from templates/mk/ ---------------------------------------
  'soap-same': 'wrong SOAP sign - the first sign matches the original binomial',
  'soap-opposite': 'wrong SOAP sign - the middle term takes the OPPOSITE sign',
  'dropped-cross-term': 'dropped the middle term of the trinomial',
  'squares-pattern': 'treated it as a difference of squares',
  'forgot-halve': 'used b itself instead of half of b',
  'squared-b-not-half': 'squared b instead of b/2',
  'forgot-adjustment': 'completed the square but never subtracted the adjustment back out',
  'bracket-sign': 'used the same sign as b inside the bracket instead of its negative',
  'forgot-sqrt': 'never took the final square root',
  'added-edges': 'added the edge lengths instead of applying Pythagoras',
  'used-volume-formula': 'used the volume formula instead of the diagonal formula',
  'halved-result': 'halved a result that was already correct',
  'dropped-a-dimension': 'used only some of the dimensions',

  // --- Arithmetic Reasoning: templates/ar/ ---------------------------------------------------
  // The largest group by far, because a word problem has more ways to go wrong than an
  // equation does. Grouped by the KIND of mistake, since that is what the fix differs by:
  // answering the wrong question, an arithmetic slip, a unit error, or a setup error.

  // Answered a real number - just not the one that was asked for.
  'answered-with-the-total': 'gave the total rather than the part asked for',
  'answered-with-the-subtotal': 'gave the subtotal of the known values',
  'answered-with-a-given': 'answered with a number the question already gave you',
  'answered-with-a-value': 'gave one value rather than the difference',
  'answered-with-a-group': 'gave one group rather than the combined figure',
  'answered-with-a-leg': 'gave one leg of the trip rather than the whole',
  'answered-with-a-worker': 'gave one worker alone rather than the pair',
  'answered-with-a-price': 'gave one price rather than the gap between them',
  'answered-with-the-parts': 'gave the number of shares rather than the amount',
  'answered-with-the-length': 'reported a length where a count was asked',
  'answered-with-the-lengths': 'gave the sides rather than the quantity asked for',
  'answered-with-the-distance': 'reported a distance where a time was asked',
  'answered-with-the-interest': 'gave the interest rather than the balance',
  'answered-with-the-shadow': 'reported the shadow as the height',
  'answered-with-the-blend': 'gave the finished blend rather than a part of it',
  'answered-with-the-losses': 'gave the points given away rather than the net',
  'answered-with-the-target': 'gave the target average rather than the score needed',
  'answered-with-the-tip': 'gave a share of the tip only',
  'answered-with-the-unknown': 'solved for the wrong unknown',
  'answered-with-a-price-gap': 'reported a price difference as a weight',
  'answered-for-the-other': 'answered for the other person',
  'answered-the-other-half': 'gave the number right when the number wrong was asked',
  'wrong-side-of-the-split': 'gave the wrong side of the split',
  'stopped-at-stage-one': 'gave the whole group rather than the share asked for',
  'stopped-at-the-unit-rate': 'stopped at the price of one',
  'stopped-at-the-volume': 'stopped at the volume without converting',
  'stopped-at-the-wins': 'counted only the gains, not the losses',
  'stopped-early': 'stopped before the last step',
  'dropped-a-step': 'stopped one step short',
  'no-change': 'reported a given figure unchanged',

  // Setup errors - the arithmetic was fine, the model was not.
  'wrong-operation': 'read the wording as the wrong operation',
  'reversed-subtraction': 'subtracted in the order the words appear',
  'mis-grouped': 'did the operations in the wrong order',
  'wrong-undo-order': 'undid the operations in the given order rather than in reverse',
  'undid-twice': 'undid the same operation twice',
  'failed-to-distribute': 'multiplied only part of the sum',
  'swapped-numbers': 'swapped the multiplier and the constant',
  'inverted-quotient': 'divided the wrong way round',
  'inverted-the-proportion': 'set the proportion up upside down',
  'inverted-the-ratio': 'scaled by the ratio the wrong way round',
  'inverted-the-gaps': 'paired each gap with the wrong side of the blend',
  'weighted-backwards': 'paired each average with the wrong group size',
  'used-the-difference': 'used a difference where a ratio was needed',
  'used-prices-not-gaps': 'scaled by the prices rather than their distance from the target',
  'matched-the-known': 'assumed equal amounts of each',
  'assumed-it-is-the-average': 'assumed the missing value equals the average',
  'assumed-it-cancels': 'assumed a rise and a fall cancel out',
  'split-evenly': 'split evenly and ignored the ratio',
  'used-one-speed': 'used only one of the two speeds',
  'used-one-test': 'balanced against one previous test instead of all of them',
  'used-the-perimeter': 'measured around the room instead of across it',
  'used-surface-area': 'computed the surface area instead of the volume',
  'used-simple-interest': 'used simple interest where it compounds',

  // Arithmetic slips.
  'divided-not-multiplied': 'divided where you should have multiplied',
  'skipped-the-divide': 'multiplied without dividing by the rate',
  'skipped-the-rate': 'multiplied by the amount without dividing by the rate',
  'divided-twice': 'applied the same step a second time',
  'converted-twice': 'applied the conversion a second time',
  'doubled-the-gap': 'doubled the difference',
  'halved-the-answer': 'split the result in two',
  'forgot-to-halve': 'took both lengths off and never halved the rest',
  'forgot-to-split': 'gave the whole amount rather than one share',
  'guessed-a-doubling': 'doubled instead of scaling',
  'multiplied-by-the-gap': 'multiplied the time by the difference in speeds',
  'multiplied-by-the-shadow': 'multiplied by the reference instead of dividing by it',
  'added-the-speeds': 'added the two speeds as if they combined',
  'added-the-times': 'added the times, as if the work were done one after the other',
  'added-the-gap': 'added the speed difference to a time',
  'added-the-sides': 'added the two sides instead of multiplying them',
  'added-the-dimensions': 'added the dimensions instead of multiplying them',
  'added-the-losses': 'added the losses instead of subtracting them',
  'added-the-difference': 'added the extra count as if it were a weight',
  'subtracted-one-length': 'subtracted the length once instead of twice',
  'subtracted-the-averages': 'subtracted the averages and ignored the group sizes',
  'averaged-the-averages': 'averaged two averages over unequal groups',
  'averaged-the-speeds': 'averaged the speeds - the slow leg takes longer',
  'averaged-the-times': 'averaged the times, which is slower than one worker alone',
  'averaged-the-known': 'averaged the values you were given',
  'compared-totals': 'compared totals that cover different amounts',
  'miscounted-shares': 'divided by the wrong number of shares',
  'wrong-number-of-parts': 'divided by the wrong number of parts',
  'wrong-subtotal': 'subtracted one value instead of the total',
  'went-the-wrong-way': 'added it back instead of removing it',

  // Percentages - their own family, because the base is what goes wrong.
  'wrong-base': 'took the percent of the wrong base',
  'subtracted-the-percent': 'took the percent off the wrong base',
  'added-the-percents': 'added two percentages into a single net change',
  'percent-as-money': 'subtracted the percent as if it were dollars',
  'percent-as-a-count': 'reported percentage points as a count',
  'percent-as-multiplier': 'multiplied by the percent rather than by 1 plus the percent',
  'mixed-units': 'mixed a percentage with a count',
  'ignored-the-discount': 'counted every item at full price',
  'discounted-everything': 'applied the discount to the whole purchase',
  'dropped-the-discounted-items': 'counted only the full-price items',
  'dropped-the-full-price-items': 'counted only the discounted items',
  'one-period-only': 'applied the rate once rather than once per period',
  'off-by-a-period': 'compounded one period too many',

  // Units and conversion.
  'never-converted': 'never converted the units',
  'converted-backwards': 'converted the wrong way round',
  'linear-factor-on-an-area': 'used the linear conversion on an area - it must be squared',
  'ignored-the-scale': 'read the drawing straight off and ignored the scale',
  'dropped-the-price': 'reported a converted length as if it were money',
  'decimal-as-minutes': 'read hours and minutes as a decimal',
  'dropped-the-minutes': 'used the whole hours and dropped the minutes',
  'dropped-the-remainder': 'discarded the part-hour',
  'rounded-up': 'rounded the part-hour up to a whole one',
  'off-by-an-hour': 'carried an extra hour',

  // Counting - the fencepost family.
  'off-by-one': 'off by one at an end - the fencepost trap',
  'off-by-one-test': 'spread the gap over one test too few',
  'counted-gaps-not-events': 'counted the intervals and missed the one at the start',
  'wrong-variant': 'used the wrong posts-and-gaps rule for the shape',
  'forgot-the-fixed-cost': 'left out the fixed charge',
  'forgot-the-tip': 'split the bill before adding the tip',
};

export const labelFor = (id) => ERROR_LABELS[id] ?? id;
