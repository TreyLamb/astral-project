// Renders a semantic spec as ordinary English, for the prompt side of an item.
//
// WHY this is a real module and not a template string: the prompt and the answer
// must describe the same meaning exactly. If the prompt says "the dogs saw" but
// the spec says future tense, the item is unanswerable and no validator would
// catch it — the composed answer would be internally consistent and simply wrong
// for the question asked. Deriving both sides from one spec removes the failure.

const PLURALS = {
  dog: 'dogs', cat: 'cats', house: 'houses', tree: 'trees', water: 'waters',
  stone: 'stones', bird: 'birds', fish: 'fish', man: 'men', woman: 'women',
  child: 'children', river: 'rivers', mountain: 'mountains', road: 'roads',
  book: 'books', fire: 'fires', sun: 'suns', moon: 'moons', horse: 'horses', door: 'doors',
};

const VERB_FORMS = {
  see: { s: 'sees', past: 'saw', base: 'see' },
  eat: { s: 'eats', past: 'ate', base: 'eat' },
  run: { s: 'runs', past: 'ran', base: 'run' },
  give: { s: 'gives', past: 'gave', base: 'give' },
  take: { s: 'takes', past: 'took', base: 'take' },
  make: { s: 'makes', past: 'made', base: 'make' },
  sleep: { s: 'sleeps', past: 'slept', base: 'sleep' },
  walk: { s: 'walks', past: 'walked', base: 'walk' },
  hear: { s: 'hears', past: 'heard', base: 'hear' },
  want: { s: 'wants', past: 'wanted', base: 'want' },
  find: { s: 'finds', past: 'found', base: 'find' },
  carry: { s: 'carries', past: 'carried', base: 'carry' },
  know: { s: 'knows', past: 'knew', base: 'know' },
  break: { s: 'breaks', past: 'broke', base: 'break' },
};

// Nouns that take no indefinite article in English. "A big water" is not a
// sentence anyone would write, and a prompt that reads as broken English makes
// the test-taker wonder what is being asked rather than how to say it.
//
// These are only ever glossed bare — never as "the sun" — because the prompt's
// article has to agree with the spec's definiteness flag. Saying "the" while the
// spec is indefinite would mean the expected answer carries a definiteness
// marker the prompt did not ask for, which is an ambiguity on the prompt side
// that no validator inspects.
const NO_ARTICLE = new Set(['water', 'fire', 'sun', 'moon']);

/** @param {string} n */
export function pluralOf(n) {
  return PLURALS[n] || `${n}s`;
}

/**
 * Nouns whose English plural is identical to the singular give an item where
 * the English prompt cannot signal number, making the expected answer
 * genuinely ambiguous. Item generators exclude these from plural contexts.
 */
export function hasDistinctPlural(n) {
  return pluralOf(n) !== n;
}

function npGloss(np, { capitalize = false } = {}) {
  const parts = [];
  const head = np.plural ? pluralOf(np.lex) : np.lex;

  if (np.possessor) {
    const owner = np.possessor.plural ? pluralOf(np.possessor.lex) : np.possessor.lex;
    parts.push(`the ${owner}'s`);
  } else if (np.definite) {
    parts.push('the');
  } else if (!np.plural && !NO_ARTICLE.has(np.lex)) {
    parts.push(/^[aeiou]/.test((np.adjectives || [])[0] || head) ? 'an' : 'a');
  }

  for (const adj of np.adjectives || []) parts.push(adj);
  parts.push(head);

  const out = parts.join(' ');
  return capitalize ? out[0].toUpperCase() + out.slice(1) : out;
}

function verbGloss(verb, subjectPlural, negated, question) {
  const f = VERB_FORMS[verb.lex];
  const tense = verb.tense || 'present';

  if (question) {
    if (tense === 'past') return { aux: negated ? "didn't" : 'did', main: f.base };
    if (tense === 'future') return { aux: negated ? "won't" : 'will', main: f.base };
    return { aux: negated ? (subjectPlural ? "don't" : "doesn't") : (subjectPlural ? 'do' : 'does'), main: f.base };
  }

  if (negated) {
    if (tense === 'past') return { aux: null, main: `did not ${f.base}` };
    if (tense === 'future') return { aux: null, main: `will not ${f.base}` };
    return { aux: null, main: `${subjectPlural ? 'do not' : 'does not'} ${f.base}` };
  }

  if (tense === 'past') return { aux: null, main: f.past };
  if (tense === 'future') return { aux: null, main: `will ${f.base}` };
  return { aux: null, main: subjectPlural ? f.base : f.s };
}

/**
 * @param {import('./compose.js').Spec} spec
 * @returns {string} the English the test-taker is asked to translate
 */
export function glossSpec(spec) {
  if (spec.kind === 'np') return npGloss(spec.np, { capitalize: true });

  const subjectPlural = !!(spec.subject && spec.subject.plural);
  const v = verbGloss(spec.verb, subjectPlural, !!spec.negated, !!spec.question);
  const subj = npGloss(spec.subject);
  const obj = spec.object ? npGloss(spec.object) : null;

  let s;
  if (spec.question) {
    s = `${v.aux} ${subj} ${v.main}${obj ? ` ${obj}` : ''}?`;
    s = s[0].toUpperCase() + s.slice(1);
  } else {
    s = `${subj} ${v.main}${obj ? ` ${obj}` : ''}.`;
    s = s[0].toUpperCase() + s.slice(1);
  }
  return s;
}

/**
 * A short label naming what changed between two specs, for transform-style
 * prompts ("Rewrite this in the past tense").
 * @param {import('./compose.js').Spec} from
 * @param {import('./compose.js').Spec} to
 * @returns {string}
 */
export function transformLabel(from, to) {
  if (from.verb && to.verb && from.verb.tense !== to.verb.tense) {
    return to.verb.tense === 'past' ? 'the past tense' : to.verb.tense === 'future' ? 'the future tense' : 'the present tense';
  }
  if (!from.negated && to.negated) return 'the negative';
  if (!from.question && to.question) return 'a yes/no question';
  if (!from.subject?.plural && to.subject?.plural) return 'a plural subject';
  return 'the new form';
}
