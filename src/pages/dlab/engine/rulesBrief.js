// Turns a language's parameters into the rule sheet the test-taker studies.
//
// This file is the other half of the correctness guarantee. The coverage
// validator asserts that every ruleId appearing in an item's trace also appears
// as a section here — so it is structurally impossible to ask a question whose
// answer depends on a rule the test-taker was never shown. Adding a new rule to
// compose.js without adding a section here fails the selftest, by design.

import { renderWord, renderSyllabified, renderWithStress, STRESS_RULE_LABELS } from './phonology.js';
import { compose } from './compose.js';
import { allContentWords } from './lexicon.js';

const ORDER_WORDS = { S: 'subject', O: 'object', V: 'verb' };

function demo(lang, spec) {
  return compose(spec, lang).surface;
}

function affixForm(lang, id) {
  const m = lang.lex.morphemes[id];
  return m ? renderWord(m.syllables) : null;
}

/**
 * @param {import('./language.js').Language} lang
 * @returns {{ruleId: string, title: string, body: string, examples: string[]}[]}
 */
export function buildSections(lang) {
  const { grammar, phon, lex } = lang;
  const s = [];
  const noun = 'dog';
  const bare = renderWord(lex.nouns[noun]);

  s.push({
    ruleId: 'vocabulary',
    title: 'Vocabulary',
    body: 'Every word below is part of this language. Learn the forms — they are different in every test.',
    examples: [],
  });

  s.push({
    ruleId: 'wordOrder',
    title: 'Word order',
    body: `A sentence is built ${grammar.wordOrder.split('').map((c) => ORDER_WORDS[c]).join(' → ')}. This order is fixed.`,
    examples: [demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'see', tense: 'present' }, object: { lex: 'cat' } }) + '  =  "A dog sees a cat."'],
  });

  s.push({
    ruleId: 'adjPlacement',
    title: 'Adjectives',
    body: `An adjective goes ${grammar.adjPlacement === 'pre' ? 'BEFORE' : 'AFTER'} the noun it describes.`,
    examples: [demo(lang, { kind: 'np', np: { lex: noun, adjectives: ['big'] } }) + '  =  "a big dog"'],
  });

  s.push({ ruleId: 'plural', title: 'Plural', body: pluralBody(lang), examples: [
    `${bare}  =  "dog"`,
    demo(lang, { kind: 'np', np: { lex: noun, plural: true } }) + '  =  "dogs"',
  ] });

  s.push({ ruleId: 'case', title: 'Marking who does what', body: caseBody(lang), examples: caseExamples(lang) });

  s.push({ ruleId: 'tense', title: 'Tense', body: tenseBody(lang), examples: [
    demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'see', tense: 'present' } }) + '  =  "A dog sees."',
    demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'see', tense: 'past' } }) + '  =  "A dog saw."',
    demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'see', tense: 'future' } }) + '  =  "A dog will see."',
  ] });

  s.push({ ruleId: 'negation', title: 'Negation', body: negationBody(lang), examples: [
    demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'see', tense: 'present' }, negated: true }) + '  =  "A dog does not see."',
  ] });

  s.push({ ruleId: 'question', title: 'Yes/no questions', body: questionBody(lang), examples: [
    demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'see', tense: 'present' }, question: true }) + '  =  "Does a dog see?"',
  ] });

  s.push({ ruleId: 'possession', title: 'Possession', body: possessionBody(lang), examples: [
    demo(lang, { kind: 'np', np: { lex: 'house', possessor: { lex: 'woman' } } }) + '  =  "the woman\'s house"',
  ] });

  if (grammar.definiteness !== 'none') {
    s.push({ ruleId: 'definiteness', title: 'Definite ("the")', body: definitenessBody(lang), examples: [
      demo(lang, { kind: 'np', np: { lex: noun, definite: true } }) + '  =  "the dog"',
    ] });
  } else {
    s.push({ ruleId: 'definiteness', title: 'Definite ("the")', body: 'This language does not mark "the". A noun on its own can mean either "a dog" or "the dog".', examples: [] });
  }

  s.push({ ruleId: 'agreement', title: 'Agreement', body: agreementBody(lang), examples: agreementExamples(lang) });

  s.push({
    ruleId: 'stress',
    title: 'Stress',
    body: `In every word, the main stress falls ${STRESS_RULE_LABELS[phon.stressRule]}. Stress is worked out from the word as it finally stands — if you add an ending, count the syllables again, because the stress can move.`,
    examples: stressExamples(lang),
  });

  if (grammar.morphophonology !== 'none') {
    s.push({ ruleId: 'morphophonology', title: 'Sound changes where pieces join', body: morphophonologyBody(lang), examples: [] });
  }

  return s;
}

function pluralBody(lang) {
  const { grammar, lex } = lang;
  const f = affixForm(lang, 'plural');
  switch (grammar.plural) {
    case 'suffix': return `Add "${f}" to the END of the noun.`;
    case 'prefix': return `Add "${f}" to the FRONT of the noun.`;
    case 'reduplication': return 'Repeat the noun\'s LAST syllable at the end of the word.';
    case 'ablaut': return `Change the noun's LAST vowel to the next vowel in this series: ${lex.vowelSeries.join(' → ')} → ${lex.vowelSeries[0]}.`;
    case 'numeralOnly': return `The noun itself never changes. Put "${renderWord(lex.numerals.many)}" ("many") in front of it.`;
    default: return '';
  }
}

function caseBody(lang) {
  const { grammar } = lang;
  switch (grammar.caseMarking) {
    case 'nomAccSuffix': return `The OBJECT takes "${affixForm(lang, 'accusative')}" on the end. The subject takes nothing.`;
    case 'prefix': return `The OBJECT takes "${affixForm(lang, 'accusative')}" on the front. The subject takes nothing.`;
    case 'ergative': return `The SUBJECT takes "${affixForm(lang, 'ergative')}" on the end — but ONLY when the verb has an object. If there is no object, the subject takes nothing. The object never takes anything.`;
    case 'particle': return `A separate marker word follows each one: "${affixForm(lang, 'subjectParticle')}" after the subject, "${affixForm(lang, 'objectParticle')}" after the object.`;
    default: return 'Nothing is marked. Word order alone tells you who does what.';
  }
}

function caseExamples(lang) {
  const both = demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'see', tense: 'present' }, object: { lex: 'cat' } });
  const intrans = demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'run', tense: 'present' } });
  return [`${both}  =  "A dog sees a cat."`, `${intrans}  =  "A dog runs."`];
}

function tenseBody(lang) {
  const { grammar, lex } = lang;
  const past = affixForm(lang, 'past');
  const fut = affixForm(lang, 'future');
  switch (grammar.tense) {
    case 'suffix': return `Present is unmarked. Past adds "${past}" to the END of the verb; future adds "${fut}".`;
    case 'prefix': return `Present is unmarked. Past adds "${past}" to the FRONT of the verb; future adds "${fut}".`;
    case 'auxiliary': return `Present is unmarked. Past puts the separate word "${past}" directly before the verb; future puts "${fut}".`;
    case 'vowelChange': return `Present is unmarked. Past shifts the verb's LAST vowel BACK one step in the series ${lex.vowelSeries.join(' → ')} → ${lex.vowelSeries[0]}; future shifts it FORWARD one step.`;
    default: return '';
  }
}

function negationBody(lang) {
  const { grammar } = lang;
  const n = affixForm(lang, 'negation');
  switch (grammar.negation) {
    case 'prefix': return `Add "${n}" to the FRONT of the verb.`;
    case 'suffix': return `Add "${n}" to the END of the verb.`;
    case 'circumfix': return `The negative comes in two pieces that wrap the verb: "${n}" on the front AND "${affixForm(lang, 'negationEnd')}" on the end. Both are required.`;
    case 'preverbalParticle': return `Put the separate word "${n}" directly before the verb.`;
    case 'finalParticle': return `Put the separate word "${n}" at the very END of the sentence, after everything else.`;
    default: return '';
  }
}

function questionBody(lang) {
  const { grammar } = lang;
  const q = affixForm(lang, 'question');
  switch (grammar.question) {
    case 'initialParticle': return `Put "${q}" at the START of the sentence. Nothing else changes.`;
    case 'finalParticle': return `Put "${q}" at the END of the sentence. Nothing else changes.`;
    case 'verbSuffix': return `Add "${q}" to the END of the verb. Nothing else changes.`;
    case 'inversion': return `Move the VERB to the front of the sentence. Everything else keeps its order. No extra word is added.`;
    default: return '';
  }
}

function possessionBody(lang) {
  const { grammar } = lang;
  const where = grammar.possessorFirst ? 'The owner comes FIRST, then the thing owned.' : 'The thing owned comes FIRST, then the owner.';
  switch (grammar.possession) {
    case 'possessorSuffix': return `${where} The OWNER takes "${affixForm(lang, 'possessive')}" on the end.`;
    case 'possessorPrefix': return `${where} The OWNER takes "${affixForm(lang, 'possessive')}" on the front.`;
    case 'particle': return `${where} A separate word "${affixForm(lang, 'possessive')}" sits between them, directly after the owner.`;
    case 'headMarked': return `${where} The marking goes on the THING OWNED, not the owner: it takes "${affixForm(lang, 'possessed')}" on the end. The owner is left plain.`;
    default: return '';
  }
}

function definitenessBody(lang) {
  const { grammar } = lang;
  const d = affixForm(lang, 'definite');
  switch (grammar.definiteness) {
    case 'prefix': return `Add "${d}" to the FRONT of the noun.`;
    case 'suffix': return `Add "${d}" to the END of the noun.`;
    case 'clitic': return `Put the separate word "${d}" before the noun phrase.`;
    default: return '';
  }
}

function agreementBody(lang) {
  const { grammar } = lang;
  switch (grammar.agreement) {
    case 'verbSubject': return `When the SUBJECT is plural, the verb takes "${affixForm(lang, 'verbPlural')}" on the end. A singular subject leaves the verb alone.`;
    case 'adjNoun': return `When the NOUN is plural, any adjective describing it also takes "${affixForm(lang, 'adjPlural')}" on the end.`;
    default: return 'Nothing agrees with anything. Verbs and adjectives never change to match the noun.';
  }
}

function agreementExamples(lang) {
  if (lang.grammar.agreement === 'none') return [];
  if (lang.grammar.agreement === 'verbSubject') {
    return [
      demo(lang, { kind: 'sentence', subject: { lex: 'dog' }, verb: { lex: 'run', tense: 'present' } }) + '  =  "A dog runs."',
      demo(lang, { kind: 'sentence', subject: { lex: 'dog', plural: true }, verb: { lex: 'run', tense: 'present' } }) + '  =  "Dogs run."',
    ];
  }
  return [
    demo(lang, { kind: 'np', np: { lex: 'dog', adjectives: ['big'] } }) + '  =  "a big dog"',
    demo(lang, { kind: 'np', np: { lex: 'dog', plural: true, adjectives: ['big'] } }) + '  =  "big dogs"',
  ];
}

function stressExamples(lang) {
  const short = lang.lex.nouns.dog;
  const infl = compose({ kind: 'np', np: { lex: 'dog', plural: true } }, lang);
  const out = [`${renderSyllabified(short)}  →  ${renderWithStress(short, lang.phon)}`];
  const w = infl.words[infl.words.length - 1];
  if (w.syllables.length !== short.length) {
    out.push(`${renderSyllabified(w.syllables)}  →  ${renderWithStress(w.syllables, lang.phon)}   (adding the plural moved the stress)`);
  }
  return out;
}

function morphophonologyBody(lang) {
  const { grammar, phon, lex } = lang;
  switch (grammar.morphophonology) {
    case 'vowelHarmony':
      return `Endings change their vowel to match the word they attach to. If the nearest vowel in the stem is a FRONT vowel (${phon.frontVowels.join(', ')}), the ending uses its front form. If it is a BACK vowel (${phon.backVowels.join(', ')}), the ending uses its back form. Both forms of each ending are listed in the word list.`;
    case 'assimilation':
      return 'When an ending starts with p, t, k, s or f and the stem before it ends in a VOICED consonant (b, d, g, z, v, m, n, l, r, ng), that first sound becomes its voiced partner: p→b, t→d, k→g, s→z, f→v. After an unvoiced consonant it goes the other way.';
    case 'linkingVowel':
      return `When the stem ends in a consonant AND the ending begins with a consonant, insert "${lex.vowelSeries[0] || phon.vowels[0]}" between them.`;
    case 'syllableAllomorph':
      return 'Every ending has two forms. Stems of one or two syllables take the short-stem form; stems of three or more syllables take the long-stem form. Both are listed in the word list.';
    case 'stressAllomorph':
      return 'Every ending has two forms. Which one you use depends on the stem BEFORE the ending is added: if that stem\'s stress falls on its final syllable, use the final-stress form; otherwise use the default form. Both are listed in the word list.';
    default: return '';
  }
}

/**
 * @param {import('./language.js').Language} lang
 * @returns {{sections: object[], vocabulary: object[], ruleIds: string[]}}
 */
export function buildRulesBrief(lang) {
  const sections = buildSections(lang);
  const vocabulary = allContentWords(lang.lex).map((w) => ({
    meaning: w.meaning,
    pos: w.pos,
    form: renderWord(w.syllables),
    syllabified: renderSyllabified(w.syllables),
    // Kept structured for the audio layer: syllable boundaries cannot be
    // recovered from the flat form, and read-aloud pronunciation needs them.
    syllables: w.syllables,
  }));
  return { sections, vocabulary, ruleIds: sections.map((s) => s.ruleId) };
}

/**
 * Grammatical markers as a lookup table, for the brief's second table. Harmony
 * and allomorphy languages list BOTH forms of each ending — the rule tells you
 * which to pick, so hiding one would make those items unanswerable.
 */
export function markerTable(lang) {
  const { grammar, lex } = lang;
  const rows = [];
  const label = {
    plural: 'plural', accusative: 'object', ergative: 'subject (with an object)',
    subjectParticle: 'subject marker word', objectParticle: 'object marker word',
    past: 'past', future: 'future', negation: 'not', negationEnd: 'not (second half)',
    question: 'question', definite: 'the', possessive: 'possessive', possessed: 'possessed',
    verbPlural: 'verb plural agreement', adjPlural: 'adjective plural agreement',
  };
  for (const [id, m] of Object.entries(lex.morphemes)) {
    const row = { id, label: label[id] || id, form: renderWord(m.syllables), alternates: [] };
    if (grammar.morphophonology === 'vowelHarmony' && m.altFront) {
      row.form = `${renderWord(m.altFront)} (front) / ${renderWord(m.altBack)} (back)`;
    } else if (grammar.morphophonology === 'syllableAllomorph' && m.altLong) {
      row.form = `${renderWord(m.syllables)} (short stem) / ${renderWord(m.altLong)} (long stem)`;
    } else if (grammar.morphophonology === 'stressAllomorph' && m.altFinalStress) {
      row.form = `${renderWord(m.syllables)} (default) / ${renderWord(m.altFinalStress)} (stem stressed on last syllable)`;
    }
    rows.push(row);
  }
  return rows;
}
