// The composer. Takes a semantic spec and produces the surface string plus an
// ordered trace of every rule that fired to get there.
//
// This file is the reason the tool can promise a correct answer key. The key is
// this function's OUTPUT, never a hand-written string, and the step-by-step
// explanation shown at the end of a test is this function's TRACE, rendered. An
// answer cannot disagree with its question, and an explanation cannot drift
// from its answer, because there is only one source for both.
//
// Trace rule IDs are the same IDs the rules brief is keyed by. The coverage
// validator uses that correspondence to prove no item ever needs a rule the
// test-taker was not shown.

import { renderWord, renderWithStress, stressIndex } from './phonology.js';
import { resolveAffix } from './grammar.js';
import { ablaut } from './lexicon.js';

/**
 * @typedef {Object} NPSpec
 * @property {string} lex - meaning key
 * @property {'noun'|'pronoun'} [pos]
 * @property {boolean} [plural]
 * @property {boolean} [definite]
 * @property {string[]} [adjectives]
 * @property {NPSpec|null} [possessor]
 */

/**
 * @typedef {Object} Spec
 * @property {'sentence'|'np'|'verb'} kind
 * @property {NPSpec} [subject]
 * @property {NPSpec} [object]
 * @property {{lex: string, tense: 'present'|'past'|'future'}} [verb]
 * @property {boolean} [negated]
 * @property {boolean} [question]
 * @property {NPSpec} [np] - for kind 'np'
 */

/** @typedef {{syllables: import('./phonology.js').Syllable[], gloss: string}} Word */

function word(syllables, gloss) {
  return { syllables, gloss };
}

function clone(syllables) {
  return syllables.map((s) => ({ ...s }));
}

/**
 * Attaches an affix to a stem, running the language's morphophonological rule
 * and pushing both the affixation and any alternation it triggered onto the
 * trace as separate steps — a test-taker applies them as two decisions, so the
 * explanation shows them as two decisions.
 */
function attach(stem, affixId, position, lang, trace, ruleId, why) {
  const affix = lang.lex.morphemes[affixId];
  const { syllables: resolved, note } = resolveAffix(affix, stem, position, lang);
  const before = renderWord(stem);
  const out = position === 'suffix' ? [...clone(stem), ...clone(resolved)] : [...clone(resolved), ...clone(stem)];

  trace.push({
    ruleId,
    label: why,
    detail: `${before} ${position === 'suffix' ? '+' : '←'} ${renderWord(resolved)} → ${renderWord(out)}`,
  });
  if (note) {
    trace.push({ ruleId: 'morphophonology', label: 'Sound change at the join', detail: note });
  }
  return out;
}

function markPlural(stem, lang, trace) {
  const { grammar, lex } = lang;
  switch (grammar.plural) {
    case 'suffix':
      return attach(stem, 'plural', 'suffix', lang, trace, 'plural', 'Plural: add the plural suffix');
    case 'prefix':
      return attach(stem, 'plural', 'prefix', lang, trace, 'plural', 'Plural: add the plural prefix');
    case 'reduplication': {
      const last = stem[stem.length - 1];
      const out = [...clone(stem), { ...last }];
      trace.push({
        ruleId: 'plural',
        label: 'Plural: repeat the final syllable',
        detail: `${renderWord(stem)} → ${renderWord(out)}`,
      });
      return out;
    }
    case 'ablaut': {
      const out = ablaut(stem, lex.vowelSeries, 1);
      trace.push({
        ruleId: 'plural',
        label: 'Plural: shift the last vowel forward one step in the vowel series',
        detail: `${renderWord(stem)} → ${renderWord(out)}`,
      });
      return out;
    }
    default:
      return stem;
  }
}

function markCase(stem, role, transitive, lang, trace) {
  const { grammar } = lang;
  if (role === 'none') return stem;

  switch (grammar.caseMarking) {
    case 'nomAccSuffix':
      if (role === 'object') {
        return attach(stem, 'accusative', 'suffix', lang, trace, 'case', 'Object: add the object suffix');
      }
      trace.push({ ruleId: 'case', label: 'Subject: takes no marker', detail: `${renderWord(stem)} is unchanged` });
      return stem;
    case 'prefix':
      if (role === 'object') {
        return attach(stem, 'accusative', 'prefix', lang, trace, 'case', 'Object: add the object prefix');
      }
      trace.push({ ruleId: 'case', label: 'Subject: takes no marker', detail: `${renderWord(stem)} is unchanged` });
      return stem;
    case 'ergative':
      // Ergative marks only the subject OF A TRANSITIVE clause. An intransitive
      // subject patterns with the object and stays bare — that split is the
      // whole point of the system and the thing the item is testing.
      if (role === 'subject' && transitive) {
        return attach(stem, 'ergative', 'suffix', lang, trace, 'case', 'Subject of a verb with an object: add the ergative suffix');
      }
      trace.push({
        ruleId: 'case',
        label: role === 'subject' ? 'Subject of a verb with no object: takes no marker' : 'Object: takes no marker',
        detail: `${renderWord(stem)} is unchanged`,
      });
      return stem;
    default:
      return stem;
  }
}

function buildNP(np, role, transitive, lang, trace) {
  const { grammar, lex } = lang;
  const pos = np.pos || 'noun';
  const bag = pos === 'pronoun' ? lex.pronouns : lex.nouns;
  let head = clone(bag[np.lex]);

  let numeralWord = null;

  if (np.plural) {
    if (grammar.plural === 'numeralOnly') {
      numeralWord = word(clone(lex.numerals.many), 'many');
      trace.push({
        ruleId: 'plural',
        label: 'Plural: the noun does not change — put the word for "many" in front of it',
        detail: `${renderWord(lex.numerals.many)} ${renderWord(head)}`,
      });
    } else {
      head = markPlural(head, lang, trace);
    }
  }

  if (grammar.possession === 'headMarked' && np.possessor) {
    head = attach(head, 'possessed', 'suffix', lang, trace, 'possession', 'Possession is marked on the thing owned, not the owner');
  }

  if (np.definite) {
    if (grammar.definiteness === 'prefix') {
      head = attach(head, 'definite', 'prefix', lang, trace, 'definiteness', 'Definite ("the"): add the definite prefix');
    } else if (grammar.definiteness === 'suffix') {
      head = attach(head, 'definite', 'suffix', lang, trace, 'definiteness', 'Definite ("the"): add the definite suffix');
    }
  }

  head = markCase(head, role, transitive, lang, trace);

  // Possessor phrase
  const possessorWords = [];
  if (np.possessor) {
    const inner = buildNP({ ...np.possessor, possessor: null }, 'none', false, lang, trace);
    let ownerHead = inner.words;
    if (grammar.possession === 'possessorSuffix') {
      const owner = attach(inner.head, 'possessive', 'suffix', lang, trace, 'possession', 'Possession: the owner takes the possessive suffix');
      ownerHead = inner.words.map((w) => (w === inner.headWord ? word(owner, w.gloss) : w));
    } else if (grammar.possession === 'possessorPrefix') {
      const owner = attach(inner.head, 'possessive', 'prefix', lang, trace, 'possession', 'Possession: the owner takes the possessive prefix');
      ownerHead = inner.words.map((w) => (w === inner.headWord ? word(owner, w.gloss) : w));
    } else if (grammar.possession === 'particle') {
      const particle = word(clone(lex.morphemes.possessive.syllables), 'POSS');
      ownerHead = grammar.possessorFirst ? [...inner.words, particle] : [particle, ...inner.words];
      trace.push({
        ruleId: 'possession',
        label: 'Possession: a separate possessive word joins owner and owned',
        detail: `${renderWord(lex.morphemes.possessive.syllables)} is a separate word`,
      });
    }
    possessorWords.push(...ownerHead);
  }

  const adjectiveWords = (np.adjectives || []).map((adjKey) => {
    let adj = clone(lex.adjectives[adjKey]);
    if (grammar.agreement === 'adjNoun' && np.plural) {
      adj = attach(adj, 'adjPlural', 'suffix', lang, trace, 'agreement', 'Agreement: the adjective copies the noun\'s plural');
    }
    return word(adj, adjKey);
  });

  const headWord = word(head, np.lex);

  // Assembled in one place so the slot order is readable and stateable in the
  // rules brief: determiner, then quantity, then owner/adjectives, then head.
  const words = [];

  if (grammar.definiteness === 'clitic' && np.definite) {
    words.push(word(clone(lex.morphemes.definite.syllables), 'the'));
    trace.push({
      ruleId: 'definiteness',
      label: 'Definite ("the"): a separate word before the noun',
      detail: `${renderWord(lex.morphemes.definite.syllables)} is a separate word`,
    });
  }

  if (numeralWord) words.push(numeralWord);
  if (grammar.possessorFirst) words.push(...possessorWords);
  if (grammar.adjPlacement === 'pre') words.push(...adjectiveWords);
  words.push(headWord);
  if (grammar.adjPlacement === 'post') words.push(...adjectiveWords);
  if (!grammar.possessorFirst) words.push(...possessorWords);

  if (adjectiveWords.length > 0) {
    trace.push({
      ruleId: 'adjPlacement',
      label: `Adjectives go ${grammar.adjPlacement === 'pre' ? 'before' : 'after'} the noun`,
      detail: words.map((w) => renderWord(w.syllables)).join(' '),
    });
  }

  if (grammar.caseMarking === 'particle' && role !== 'none') {
    const pid = role === 'subject' ? 'subjectParticle' : 'objectParticle';
    words.push(word(clone(lex.morphemes[pid].syllables), role === 'subject' ? 'SUBJ' : 'OBJ'));
    trace.push({
      ruleId: 'case',
      label: `${role === 'subject' ? 'Subject' : 'Object'}: followed by its own marker word`,
      detail: `${renderWord(lex.morphemes[pid].syllables)} follows the ${role}`,
    });
  }

  return { words, head, headWord };
}

function buildVerb(verbSpec, subjectPlural, negated, isQuestion, lang, trace) {
  const { grammar, lex } = lang;
  let stem = clone(lex.verbs[verbSpec.lex]);
  const extraWords = { before: [], sentenceEnd: [] };

  const tense = verbSpec.tense || 'present';
  if (tense !== 'present') {
    const id = tense === 'past' ? 'past' : 'future';
    if (grammar.tense === 'suffix') {
      stem = attach(stem, id, 'suffix', lang, trace, 'tense', `${tense === 'past' ? 'Past' : 'Future'}: add the ${tense} suffix`);
    } else if (grammar.tense === 'prefix') {
      stem = attach(stem, id, 'prefix', lang, trace, 'tense', `${tense === 'past' ? 'Past' : 'Future'}: add the ${tense} prefix`);
    } else if (grammar.tense === 'auxiliary') {
      extraWords.before.push(word(clone(lex.morphemes[id].syllables), tense.toUpperCase()));
      trace.push({
        ruleId: 'tense',
        label: `${tense === 'past' ? 'Past' : 'Future'}: a separate helper word before the verb`,
        detail: `${renderWord(lex.morphemes[id].syllables)} ${renderWord(stem)}`,
      });
    } else if (grammar.tense === 'vowelChange') {
      const dir = tense === 'past' ? -1 : 1;
      const out = ablaut(stem, lex.vowelSeries, dir);
      trace.push({
        ruleId: 'tense',
        label: `${tense === 'past' ? 'Past' : 'Future'}: shift the verb's last vowel ${dir === 1 ? 'forward' : 'back'} one step in the vowel series`,
        detail: `${renderWord(stem)} → ${renderWord(out)}`,
      });
      stem = out;
    }
  } else {
    trace.push({ ruleId: 'tense', label: 'Present tense is unmarked', detail: `${renderWord(stem)} is unchanged` });
  }

  if (grammar.agreement === 'verbSubject' && subjectPlural) {
    stem = attach(stem, 'verbPlural', 'suffix', lang, trace, 'agreement', 'Agreement: a plural subject adds the plural marker to the verb');
  }

  if (negated) {
    if (grammar.negation === 'prefix') {
      stem = attach(stem, 'negation', 'prefix', lang, trace, 'negation', 'Negation: add the negative prefix to the verb');
    } else if (grammar.negation === 'suffix') {
      stem = attach(stem, 'negation', 'suffix', lang, trace, 'negation', 'Negation: add the negative suffix to the verb');
    } else if (grammar.negation === 'circumfix') {
      stem = attach(stem, 'negation', 'prefix', lang, trace, 'negation', 'Negation: the negative wraps the verb — first half in front');
      stem = attach(stem, 'negationEnd', 'suffix', lang, trace, 'negation', 'Negation: second half of the negative behind');
    } else if (grammar.negation === 'preverbalParticle') {
      extraWords.before.push(word(clone(lex.morphemes.negation.syllables), 'NOT'));
      trace.push({
        ruleId: 'negation',
        label: 'Negation: a separate word directly before the verb',
        detail: `${renderWord(lex.morphemes.negation.syllables)} ${renderWord(stem)}`,
      });
    } else if (grammar.negation === 'finalParticle') {
      extraWords.sentenceEnd.push(word(clone(lex.morphemes.negation.syllables), 'NOT'));
      trace.push({
        ruleId: 'negation',
        label: 'Negation: a separate word at the very end of the sentence',
        detail: `${renderWord(lex.morphemes.negation.syllables)} closes the sentence`,
      });
    }
  }

  if (isQuestion && grammar.question === 'verbSuffix') {
    stem = attach(stem, 'question', 'suffix', lang, trace, 'question', 'Question: add the question suffix to the verb');
  }

  return { words: [...extraWords.before, word(stem, verbSpec.lex)], sentenceEnd: extraWords.sentenceEnd };
}

/**
 * @param {Spec} spec
 * @param {import('./language.js').Language} lang
 * @returns {{surface: string, words: Word[], trace: {ruleId: string, label: string, detail: string}[]}}
 */
export function compose(spec, lang) {
  const { grammar } = lang;
  const trace = [];

  if (spec.kind === 'np') {
    const { words } = buildNP(spec.np, spec.role || 'none', !!spec.transitive, lang, trace);
    return finish(words, trace);
  }

  const transitive = !!spec.object;
  const subjectPlural = !!(spec.subject && spec.subject.plural);

  const S = spec.subject ? buildNP(spec.subject, 'subject', transitive, lang, trace).words : [];
  const O = spec.object ? buildNP(spec.object, 'object', transitive, lang, trace).words : [];
  const vp = buildVerb(spec.verb, subjectPlural, !!spec.negated, !!spec.question, lang, trace);
  const V = vp.words;

  let order = grammar.wordOrder;
  if (spec.question && grammar.question === 'inversion') {
    // Fronting the verb: pull V out of wherever it sits and put it first. The
    // remaining constituents keep their relative order.
    order = 'V' + order.replace('V', '');
    trace.push({
      ruleId: 'question',
      label: 'Question: move the verb to the front of the sentence',
      detail: `${grammar.wordOrder} → ${order}`,
    });
  }

  const slots = { S, O, V };
  let words = [];
  for (const ch of order) words = words.concat(slots[ch]);

  trace.push({
    ruleId: 'wordOrder',
    label: `Word order is ${order}`,
    detail: order.split('').map((c) => ({ S: 'subject', O: 'object', V: 'verb' })[c]).join(' → '),
  });

  if (spec.question && grammar.question === 'initialParticle') {
    words = [word(clone(lang.lex.morphemes.question.syllables), 'Q'), ...words];
    trace.push({
      ruleId: 'question',
      label: 'Question: a question word opens the sentence',
      detail: `${renderWord(lang.lex.morphemes.question.syllables)} …`,
    });
  }

  words = [...words, ...vp.sentenceEnd];

  if (spec.question && grammar.question === 'finalParticle') {
    words = [...words, word(clone(lang.lex.morphemes.question.syllables), 'Q')];
    trace.push({
      ruleId: 'question',
      label: 'Question: a question word closes the sentence',
      detail: `… ${renderWord(lang.lex.morphemes.question.syllables)}`,
    });
  }

  return finish(words, trace);
}

function finish(words, trace) {
  const surface = words.map((w) => renderWord(w.syllables)).join(' ');
  return { surface, words, trace };
}

/**
 * @param {Word[]} words
 * @param {import('./language.js').Language} lang
 * @returns {string} every word syllabified with its stressed syllable capitalised
 */
export function renderStressed(words, lang) {
  return words.map((w) => renderWithStress(w.syllables, lang.phon)).join(' ');
}

/**
 * @param {Word} w
 * @param {import('./language.js').Language} lang
 */
export function wordStressIndex(w, lang) {
  return stressIndex(w.syllables, lang.phon);
}

/** Distinct rule IDs a trace touched — the input to the coverage validator. */
export function traceRuleIds(trace) {
  return [...new Set(trace.map((t) => t.ruleId))];
}

/**
 * How many DISTINCT grammatical decisions the item required. This is the
 * measured difficulty of an item — tiers are assigned from it rather than
 * guessed at by the template that happened to produce the item.
 *
 * 'stress' is excluded: it applies to every word in every language and so
 * carries no discriminating load.
 */
export function ruleDepth(trace) {
  return traceRuleIds(trace).filter((id) => id !== 'stress').length;
}
