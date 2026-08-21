// Prefixes and suffixes.
//
// The official AF Word Knowledge syllabus lists exactly TWO modules - "Strategies for Studying"
// and "Parts of a Word (prefix, root, suffix)". Chapter 2 covers roots; this chapter covers the
// two pieces that wrap around them, and they do different jobs. A PREFIX changes the meaning
// (active -> INactive, active -> REactive) without touching the part of speech. A SUFFIX changes
// the part of speech (active -> activ-ATE, a verb) and frequently leaves the core meaning close
// to untouched. Knowing which one you are looking at is itself a strategy: a suffix alone tells
// you whether an unfamiliar headword is a noun, verb or adjective, which is often enough to
// eliminate an option you cannot otherwise define.
//
// CONFUSIONS ARE DECLARED, not drawn, for the same reason ch02-roots.js declares them: a wrong
// option has to be a mistake somebody actually makes. ante- / anti- differ by one letter and
// mean unrelated things; hyper- / hypo- are opposites that get swapped constantly; -cracy and
// -archy both gloss as "rule by," which makes them a genuine pair rather than a coincidence.
//
// AUTHORING RULES (registerMorphemes enforces the first one; the rest are on the author):
//   - every example word must VISIBLY contain the form - the validator checks a prefix of the
//     stripped form against the lowercased word, so a short prefix like "de-" only proves itself
//     against a two-letter match; pick words where the part is genuinely legible, not merely
//     technically present
//   - `sense` must be a unique STRING within its band - the "-mean" frame builds its wrong
//     answers from every other row's `sense` in the same band, so two rows reading identically
//     silently collapse the answer slate
//   - every example `word` must be unique across this whole file - the "-apply" frame's wrong
//     answers are drawn from other rows' first example, chapter-wide
//   - `confusions` may only name an id declared in THIS file, and only pairs that are genuinely
//     mixed up in practice, not any two affixes that happen to share a syllable
//   - do NOT merge spellings into one `form` string ("in-, im-") - the validator strips only
//     hyphens, so the separator survives inside the required substring and the row fails every
//     example it is given. Spelling variants (in- / im-, a- / an-) get their own rows instead.

import { registerMorphemes, morphemeTemplates } from '../../engine/morphology.js';

const CH = 'wk-03-affixes';
const NEGATION = ['wk-prefix-negation'];
const DIRECTION = ['wk-prefix-direction-degree'];
const WORDCLASS = ['wk-suffix-wordclass'];

registerMorphemes([
  // ---- band 2: affixes an average adult already half-knows ----------------------------------
  {
    id: 'wk-affix-in', chapter: CH, concepts: NEGATION, band: 2,
    form: 'in-', kind: 'prefix', origin: 'Latin', sense: 'not',
    examples: [
      { word: 'inactive', gloss: 'not active or in use' },
      { word: 'incomplete', gloss: 'not finished or whole' },
      { word: 'invisible', gloss: 'not able to be seen' },
    ],
  },
  {
    id: 'wk-affix-dis', chapter: CH, concepts: NEGATION, band: 2,
    form: 'dis-', kind: 'prefix', origin: 'Latin', sense: 'apart, away, or the reverse of',
    examples: [
      { word: 'disconnect', gloss: 'to break a connection that was already there' },
      { word: 'disperse', gloss: 'to scatter in different directions' },
      { word: 'disregard', gloss: 'to pay no attention to something' },
    ],
  },
  {
    id: 'wk-affix-mis', chapter: CH, concepts: NEGATION, band: 2,
    form: 'mis-', kind: 'prefix', origin: 'Latin', sense: 'wrongly or badly',
    examples: [
      { word: 'misplace', gloss: 'to put something where it does not belong' },
      { word: 'misjudge', gloss: 'to form a wrong opinion about something' },
      { word: 'misinform', gloss: 'to give someone false information' },
    ],
  },
  {
    id: 'wk-affix-pre', chapter: CH, concepts: DIRECTION, band: 2,
    form: 'pre-', kind: 'prefix', origin: 'Latin', sense: 'before, in front of',
    examples: [
      { word: 'preview', gloss: 'a look at something before it is fully released' },
      { word: 'prepay', gloss: 'to pay for something before receiving it' },
      { word: 'predict', gloss: 'to say what will happen before it does' },
    ],
  },
  {
    id: 'wk-affix-sub', chapter: CH, concepts: DIRECTION, band: 2,
    form: 'sub-', kind: 'prefix', origin: 'Latin', sense: 'under, below',
    examples: [
      { word: 'submarine', gloss: 'a vessel that travels under the surface of the water' },
      { word: 'subway', gloss: 'a train system that runs under a city' },
      { word: 'subordinate', gloss: 'lower in rank or position' },
    ],
  },
  {
    id: 'wk-affix-inter', chapter: CH, concepts: DIRECTION, band: 2,
    form: 'inter-', kind: 'prefix', origin: 'Latin', sense: 'between, among',
    examples: [
      { word: 'interstate', gloss: 'a highway running between states' },
      { word: 'international', gloss: 'involving more than one nation' },
      { word: 'interact', gloss: 'to act in a way that affects one another' },
    ],
  },
  {
    id: 'wk-affix-able', chapter: CH, concepts: WORDCLASS, band: 2,
    form: '-able', kind: 'suffix', origin: 'Latin', sense: 'capable of, able to be',
    examples: [
      { word: 'washable', gloss: 'able to be washed without damage' },
      { word: 'breakable', gloss: 'likely to break easily' },
      { word: 'portable', gloss: 'able to be carried or moved easily' },
    ],
  },
  {
    id: 'wk-affix-ist', chapter: CH, concepts: WORDCLASS, band: 2,
    form: '-ist', kind: 'suffix', origin: 'Greek', sense: 'one who does or believes',
    examples: [
      { word: 'artist', gloss: 'a person who creates art' },
      { word: 'scientist', gloss: 'a person who studies science' },
      { word: 'pianist', gloss: 'a person who plays the piano' },
    ],
  },

  // ---- band 3: standard AFOQT level -----------------------------------------------------------
  {
    id: 'wk-affix-anti', chapter: CH, concepts: NEGATION, band: 3,
    form: 'anti-', kind: 'prefix', origin: 'Greek', sense: 'opposed to; acting against',
    examples: [
      { word: 'antibiotic', gloss: 'a drug that works against bacterial infection' },
      { word: 'antisocial', gloss: 'avoiding or acting against social contact' },
      { word: 'antivirus', gloss: 'software that works against malicious programs' },
    ],
    confusions: ['wk-affix-ante'],
  },
  {
    id: 'wk-affix-non', chapter: CH, concepts: NEGATION, band: 3,
    form: 'non-', kind: 'prefix', origin: 'Latin', sense: 'not at all; entirely without',
    examples: [
      { word: 'nonfiction', gloss: 'writing about real people and events' },
      { word: 'nonstop', gloss: 'without any pauses or stops' },
      { word: 'nonsense', gloss: 'words or ideas with no real meaning' },
    ],
  },
  {
    id: 'wk-affix-ob', chapter: CH, concepts: NEGATION, band: 3,
    form: 'ob-', kind: 'prefix', origin: 'Latin', sense: 'in the way of; blocking',
    examples: [
      { word: 'obstruct', gloss: 'to block or stand in the way of' },
      { word: 'object', gloss: 'to express opposition to something' },
      { word: 'obstacle', gloss: 'something that stands in the way of progress' },
    ],
  },
  {
    id: 'wk-affix-ante', chapter: CH, concepts: DIRECTION, band: 3,
    form: 'ante-', kind: 'prefix', origin: 'Latin', sense: 'before in time; earlier than',
    examples: [
      { word: 'antebellum', gloss: 'existing before a war, especially the American Civil War' },
      { word: 'anteroom', gloss: 'a small room leading into a larger one' },
      { word: 'antecedent', gloss: 'something that came before, such as the word a pronoun refers to' },
    ],
    confusions: ['wk-affix-anti'],
  },
  {
    id: 'wk-affix-circum', chapter: CH, concepts: DIRECTION, band: 3,
    form: 'circum-', kind: 'prefix', origin: 'Latin', sense: 'around',
    examples: [
      { word: 'circumference', gloss: 'the distance around a circle' },
      { word: 'circumnavigate', gloss: 'to travel all the way around something' },
      { word: 'circumvent', gloss: 'to find a way around an obstacle or rule' },
    ],
  },
  {
    id: 'wk-affix-trans', chapter: CH, concepts: DIRECTION, band: 3,
    form: 'trans-', kind: 'prefix', origin: 'Latin', sense: 'across, beyond',
    examples: [
      { word: 'transport', gloss: 'to carry something across a distance' },
      { word: 'transatlantic', gloss: 'crossing the Atlantic Ocean' },
      { word: 'translate', gloss: 'to change speech or writing from one language to another' },
    ],
  },
  {
    id: 'wk-affix-escent', chapter: CH, concepts: WORDCLASS, band: 3,
    form: '-escent', kind: 'suffix', origin: 'Latin', sense: 'beginning to be; in the process of becoming',
    examples: [
      { word: 'adolescent', gloss: 'a young person becoming an adult' },
      { word: 'luminescent', gloss: 'giving off light without heat' },
      { word: 'convalescent', gloss: 'recovering from an illness' },
    ],
  },
  {
    id: 'wk-affix-ify', chapter: CH, concepts: WORDCLASS, band: 3,
    form: '-ify', kind: 'suffix', origin: 'Latin', sense: 'to make or turn into',
    examples: [
      { word: 'simplify', gloss: 'to make something easier to understand' },
      { word: 'clarify', gloss: 'to make something clearer' },
      { word: 'beautify', gloss: 'to make something more attractive' },
    ],
  },

  // ---- band 4: the harder end -----------------------------------------------------------------
  {
    id: 'wk-affix-de', chapter: CH, concepts: NEGATION, band: 4,
    form: 'de-', kind: 'prefix', origin: 'Latin', sense: 'reverse, remove, or undo',
    examples: [
      { word: 'deactivate', gloss: 'to turn off or make inactive' },
      { word: 'defrost', gloss: 'to remove frost or ice by thawing' },
      { word: 'decompose', gloss: 'to break down into simpler parts' },
    ],
  },
  {
    id: 'wk-affix-contra', chapter: CH, concepts: NEGATION, band: 4,
    form: 'contra-', kind: 'prefix', origin: 'Latin', sense: 'contrary to; running counter to',
    examples: [
      { word: 'contradict', gloss: 'to say the opposite of what was just said' },
      { word: 'contravene', gloss: 'to act in a way that breaks a rule or a treaty' },
      { word: 'contraband', gloss: 'goods that are illegal to possess or trade' },
    ],
  },
  {
    id: 'wk-affix-an', chapter: CH, concepts: NEGATION, band: 4,
    form: 'an-', kind: 'prefix', origin: 'Greek', sense: 'without; lacking altogether',
    examples: [
      { word: 'anonymous', gloss: 'not identified by name' },
      { word: 'anarchy', gloss: 'a state with no governing authority' },
      { word: 'anesthesia', gloss: 'a loss of sensation, often used during surgery' },
    ],
  },
  {
    id: 'wk-affix-hyper', chapter: CH, concepts: DIRECTION, band: 4,
    form: 'hyper-', kind: 'prefix', origin: 'Greek', sense: 'over, excessive, above normal',
    examples: [
      { word: 'hyperactive', gloss: 'excessively or abnormally active' },
      { word: 'hypertension', gloss: 'abnormally high blood pressure' },
      { word: 'hyperbole', gloss: 'exaggerated language not meant to be taken literally' },
    ],
    confusions: ['wk-affix-hypo'],
  },
  {
    id: 'wk-affix-hypo', chapter: CH, concepts: DIRECTION, band: 4,
    form: 'hypo-', kind: 'prefix', origin: 'Greek', sense: 'under, deficient, below normal',
    examples: [
      { word: 'hypothermia', gloss: 'abnormally low body temperature' },
      { word: 'hypoallergenic', gloss: 'unlikely to cause an allergic reaction' },
      { word: 'hypodermic', gloss: 'placed or injected under the skin' },
    ],
    confusions: ['wk-affix-hyper'],
  },
  {
    id: 'wk-affix-supra', chapter: CH, concepts: DIRECTION, band: 4,
    form: 'supra-', kind: 'prefix', origin: 'Latin', sense: 'above; outside the limits of',
    examples: [
      { word: 'supranational', gloss: 'having authority beyond national borders' },
      { word: 'suprarenal', gloss: 'located above the kidney' },
    ],
  },
  {
    id: 'wk-affix-cracy', chapter: CH, concepts: WORDCLASS, band: 4,
    form: '-cracy', kind: 'suffix', origin: 'Greek', sense: 'rule or government by a named group',
    examples: [
      { word: 'democracy', gloss: 'government by the people' },
      { word: 'autocracy', gloss: 'government by one person with absolute power' },
      { word: 'aristocracy', gloss: 'a ruling class of nobility' },
    ],
  },
  {
    id: 'wk-affix-logy', chapter: CH, concepts: WORDCLASS, band: 4,
    form: '-logy', kind: 'suffix', origin: 'Greek', sense: 'the study or science of',
    examples: [
      { word: 'geology', gloss: 'the study of the earth and its rocks' },
      { word: 'etymology', gloss: 'the study of where words come from' },
      { word: 'pathology', gloss: 'the study of disease and what it does to the body' },
    ],
  },
]);

for (const band of [2, 3, 4]) {
  morphemeTemplates({ chapter: CH, band, idBase: `wk-03-b${band}`, name: 'Prefixes and suffixes' });
}
