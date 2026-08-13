// The validators. An item that fails any of these is discarded and regenerated
// rather than shipped, so a failure here costs a retry, never a wrong answer.
//
// These are the whole reason an open-response test is defensible. Multiple
// choice hides ambiguity behind a "closest option" — production does not, so
// the burden of proving an item has exactly one defensible answer falls here.

import { compose } from './compose.js';
import { glossSpec } from './gloss.js';
import { normalizeAnswer } from './grade.js';

/**
 * Every rule the item's trace touched must appear in the rules brief. This is
 * the strongest of the four: it makes it structurally impossible to ask a
 * question whose answer depends on something the test-taker was never told.
 */
export function checkCoverage(item, briefRuleIds) {
  const missing = (item.ruleIds || []).filter((id) => !briefRuleIds.includes(id));
  return missing.length === 0
    ? { ok: true }
    : { ok: false, reason: `trace uses rules absent from the brief: ${missing.join(', ')}` };
}

/**
 * Recomposing from the spec must reproduce the sentence the item was built
 * from, byte for byte.
 *
 * Compared against `composedSurface`, not against `answer`: several item types
 * (blank, stress notation, root recall) ask for something DERIVED from the
 * composed sentence rather than the sentence itself. Checking the answer with a
 * chain of loose fallbacks would let a genuinely broken item slip through on a
 * substring match — pinning the composed form exactly is the check that has
 * teeth, and the answer's relationship to it is the builder's business.
 */
export function checkDeterminism(item, lang) {
  if (!item.spec) return { ok: true };
  if (!item.composedSurface) {
    return { ok: false, reason: 'item has a spec but no composedSurface to verify against' };
  }
  const composed = compose(item.spec, lang).surface;
  return composed === item.composedSurface
    ? { ok: true }
    : { ok: false, reason: `recompose gave "${composed}", item recorded "${item.composedSurface}"` };
}

/**
 * The answer must not be reachable from a DIFFERENT meaning.
 *
 * Full enumeration of a language's surface forms is unbounded, so this checks
 * the neighbourhood a test-taker could actually confuse it with: the same
 * sentence with one lexeme swapped, and the same lexeme with one grammatical
 * feature flipped. A collision inside that set is a genuinely ambiguous item; a
 * collision outside it is not something anyone would ever produce.
 */
export function checkHomophony(item, lang) {
  if (!item.spec) return { ok: true };
  const target = normalizeAnswer(item.answer);
  const ownGloss = glossSpec(item.spec);

  for (const variant of neighbourhood(item.spec, lang)) {
    const g = glossSpec(variant);
    if (g === ownGloss) continue;
    const surface = compose(variant, lang).surface;
    if (normalizeAnswer(surface) === target) {
      return { ok: false, reason: `"${item.answer}" also means "${g}"` };
    }
  }
  return { ok: true };
}

function* neighbourhood(spec, lang) {
  const nounKeys = Object.keys(lang.lex.nouns);
  const verbKeys = Object.keys(lang.lex.verbs);
  const adjKeys = Object.keys(lang.lex.adjectives);

  if (spec.kind === 'np') {
    for (const lex of nounKeys) if (lex !== spec.np.lex) yield { ...spec, np: { ...spec.np, lex } };
    yield { ...spec, np: { ...spec.np, plural: !spec.np.plural } };
    yield { ...spec, np: { ...spec.np, definite: !spec.np.definite } };
    if (spec.np.adjectives) {
      for (const a of adjKeys) {
        if (a !== spec.np.adjectives[0]) yield { ...spec, np: { ...spec.np, adjectives: [a] } };
      }
      yield { ...spec, np: { ...spec.np, adjectives: [] } };
    }
    return;
  }

  for (const lex of verbKeys) {
    if (lex !== spec.verb.lex) yield { ...spec, verb: { ...spec.verb, lex } };
  }
  for (const t of ['present', 'past', 'future']) {
    if (t !== (spec.verb.tense || 'present')) yield { ...spec, verb: { ...spec.verb, tense: t } };
  }
  yield { ...spec, negated: !spec.negated };
  yield { ...spec, question: !spec.question };
  if (spec.subject) {
    yield { ...spec, subject: { ...spec.subject, plural: !spec.subject.plural } };
    for (const lex of nounKeys) {
      if (lex !== spec.subject.lex) yield { ...spec, subject: { ...spec.subject, lex } };
    }
  }
  if (spec.object) {
    yield { ...spec, object: { ...spec.object, plural: !spec.object.plural } };
    for (const lex of nounKeys) {
      if (lex !== spec.object.lex) yield { ...spec, object: { ...spec.object, lex } };
    }
    // Swapping subject and object is the single most confusable variant in any
    // language that marks role by position alone, so it is always tested.
    yield { ...spec, subject: spec.object, object: spec.subject };
  }
}

/**
 * A fill-in-the-blank prompt that already contains its own answer somewhere
 * else in the visible sentence gives the answer away.
 */
export function checkNoLeak(item) {
  if (!item.prompt || !item.answer) return { ok: true };
  if (item.type === 'vocabReverse') return { ok: true };
  const promptWords = normalizeAnswer(item.prompt.replace(/_+/g, ' ')).split(/\s+/);
  const answerNorm = normalizeAnswer(item.answer);
  if (answerNorm.includes(' ')) return { ok: true };
  return promptWords.includes(answerNorm)
    ? { ok: false, reason: `prompt already contains the answer "${item.answer}"` }
    : { ok: true };
}

/** A stable identity for an item's underlying meaning, for cross-pool checks. */
export function specSignature(item) {
  return `${item.type}::${item.spec ? JSON.stringify(item.spec) : item.answer}`;
}

/**
 * Runs every per-item validator.
 * @returns {{ok: boolean, reason?: string, failed?: string}}
 */
export function validateItem(item, lang, briefRuleIds) {
  if (!item || !item.answer || String(item.answer).trim() === '') {
    return { ok: false, failed: 'empty', reason: 'no answer' };
  }
  const checks = [
    ['coverage', checkCoverage(item, briefRuleIds)],
    ['determinism', checkDeterminism(item, lang)],
    ['homophony', checkHomophony(item, lang)],
    ['leak', checkNoLeak(item)],
  ];
  for (const [name, r] of checks) {
    if (!r.ok) return { ok: false, failed: name, reason: r.reason };
  }
  return { ok: true };
}
