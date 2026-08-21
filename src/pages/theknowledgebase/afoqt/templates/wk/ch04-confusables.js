// Chapter 4 — Words that are mistaken for each other.
//
// Every one of the ten official OATTS Word Knowledge items names a confusable pair in its own
// worked solution: "avoid confusing arduous with ardent", "read carefully to avoid mixing with
// cogitate", "avoid mixing benevolent and malevolent", "don't confuse with exasperate". Nothing
// else in the official material is repeated ten times out of ten.
//
// The pair is also the highest-yield unit of study here. Learning one word of a pair is worth
// less than half the pair, because a candidate who knows only one is MORE likely to be
// confidently wrong on the other - which is why this chapter's test-out gate is 5/5.
//
// Each pair generates items from BOTH sides, so the answer cannot be learned as a position.
//
// AUTHORING RULES (registerPairs enforces the first two; the third it cannot see):
//   - `a.gloss` and `b.gloss` must genuinely differ, or no question can distinguish the two
//   - `tell` is the one line that keeps them apart, and it is shown after a miss. Make it a
//     memory hook, not a restatement of the two definitions.
//   - the pair must be one people ACTUALLY mix up. An invented pair teaches a confusion that
//     does not exist and costs the candidate the item it was supposed to win.
//
// ⚠ THE PART-OF-SPEECH ARITHMETIC IS THE TRAP IN THIS FILE, and nothing warns you about it
// until the selftest fails. `pairTemplates` draws its distractors only from halves that share
// the headword's `pos`, WITHIN THE SAME BAND - because a verb definition offered under an
// adjective headword is eliminable on sight, without knowing either word. So a headword needs
// its mate PLUS THREE MORE same-pos halves from other pairs in its band, or the slate comes up
// short. A single lonely noun pair in a band silently breaks that band. The counts here:
//
//   band 2  -  5 adj pairs, 4 verb pairs
//   band 3  -  4 adj + 1 adj half, 5 verb pairs, 5 noun halves
//   band 4  -  5 adj pairs, 3 verb pairs
//
// Count them again before adding a row.

import { registerPairs, pairTemplates } from '../../engine/morphology.js';

const CH = 'wk-04-confusables';
const PAIRS = ['wk-confusable-pairs'];

registerPairs([
  // --- Band 2. Pairs an educated adult already meets in print and still gets wrong. ---------
  {
    id: 'wk-pair-historic', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'historic', pos: 'adj', gloss: 'important enough to be remembered in history' },
    b: { word: 'historical', pos: 'adj', gloss: 'belonging to or dealing with the past' },
    tell: 'A historic day is one that mattered. A historical novel is merely set in the past.',
  },
  {
    id: 'wk-pair-continual', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'continual', pos: 'adj', gloss: 'happening repeatedly, with breaks in between' },
    b: { word: 'continuous', pos: 'adj', gloss: 'going on without a single break' },
    tell: 'Continual interruptions stop and start. A continuous line never lifts off the page.',
  },
  {
    id: 'wk-pair-economic', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'economic', pos: 'adj', gloss: 'relating to the economy or to finance' },
    b: { word: 'economical', pos: 'adj', gloss: 'careful not to waste money or resources' },
    tell: 'Economical is the longer word and it is the one that saves you money. Economic is about the economy itself.',
  },
  {
    id: 'wk-pair-hardy', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'hardy', pos: 'adj', gloss: 'able to endure difficult conditions' },
    b: { word: 'hearty', pos: 'adj', gloss: 'warm and enthusiastic, or large and satisfying' },
    tell: 'A hearty welcome comes from the heart. A hardy plant survives the winter.',
  },
  {
    id: 'wk-pair-later', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'later', pos: 'adj', gloss: 'occurring at a subsequent time' },
    b: { word: 'latter', pos: 'adj', gloss: 'the second of two things already mentioned' },
    tell: 'Latter has two Ts for the second of two things. Later has one, and just means afterwards.',
  },
  {
    id: 'wk-pair-emigrate', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'emigrate', pos: 'verb', gloss: 'to leave your own country in order to settle elsewhere' },
    b: { word: 'immigrate', pos: 'verb', gloss: 'to come into a country in order to settle there' },
    tell: 'Emigrate is exit. Immigrate is in. The same move, named from the two ends.',
  },
  {
    id: 'wk-pair-raise', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'raise', pos: 'verb', gloss: 'to lift something else to a higher position' },
    b: { word: 'rise', pos: 'verb', gloss: 'to move upward under your own power' },
    tell: 'You raise something. You rise yourself. Raise always takes an object.',
  },
  {
    id: 'wk-pair-borrow', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'borrow', pos: 'verb', gloss: 'to take something temporarily, intending to give it back' },
    b: { word: 'lend', pos: 'verb', gloss: 'to hand something over temporarily, expecting it back' },
    tell: 'You borrow from whoever lends to you. The lender is the one who owns it.',
  },
  {
    id: 'wk-pair-accept', chapter: CH, concepts: PAIRS, band: 2,
    a: { word: 'accept', pos: 'verb', gloss: 'to agree to receive or take what is offered' },
    b: { word: 'except', pos: 'verb', gloss: 'to leave something out of a group' },
    tell: 'Except excludes. Accept takes it in. Both are hiding inside the word exception.',
  },

  // --- Band 3. Standard AFOQT level, and the six the chapter was seeded with. ---------------
  {
    id: 'wk-pair-eminent', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'eminent', pos: 'adj', gloss: 'famous and respected within a field' },
    b: { word: 'imminent', pos: 'adj', gloss: 'about to happen at any moment' },
    tell: 'Imminent has an "i" for "immediate"; eminent has an "e" for "esteemed".',
  },
  {
    id: 'wk-pair-discreet', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'discreet', pos: 'adj', gloss: 'careful not to attract attention' },
    b: { word: 'discrete', pos: 'adj', gloss: 'separate and individually distinct' },
    tell: 'Discrete has the two "e"s separated by the "t" - separate letters, separate things.',
  },
  {
    id: 'wk-pair-flout', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'flout', pos: 'verb', gloss: 'to openly disregard a rule' },
    b: { word: 'flaunt', pos: 'verb', gloss: 'to display something showily' },
    tell: 'You flout the rules and flaunt your wealth - flout defies, flaunt shows off.',
  },
  {
    id: 'wk-pair-censure', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'censure', pos: 'verb', gloss: 'to criticise someone severely' },
    b: { word: 'censor', pos: 'verb', gloss: 'to suppress objectionable parts of something' },
    tell: 'A censor removes material; to censure is to condemn a person.',
  },
  {
    id: 'wk-pair-principal', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'principal', pos: 'adj', gloss: 'first in rank or importance' },
    b: { word: 'principle', pos: 'noun', gloss: 'a fundamental rule or belief' },
    tell: 'A principle is a rule, and both end in "-le".',
  },
  {
    id: 'wk-pair-prodigal', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'prodigal', pos: 'adj', gloss: 'wastefully extravagant with money' },
    b: { word: 'prodigious', pos: 'adj', gloss: 'remarkably great in size or degree' },
    tell: 'Prodigal squanders; prodigious impresses. Only one of them is a compliment.',
  },
  {
    id: 'wk-pair-imply', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'imply', pos: 'verb', gloss: 'to suggest something without stating it outright' },
    b: { word: 'infer', pos: 'verb', gloss: 'to work out a conclusion from the evidence' },
    tell: 'The speaker implies. The listener infers. Only one of the two is doing the talking.',
  },
  {
    id: 'wk-pair-precede', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'precede', pos: 'verb', gloss: 'to come before something in time or order' },
    b: { word: 'proceed', pos: 'verb', gloss: 'to carry on with a course of action' },
    tell: 'Precede carries pre-, before. Proceed carries pro-, forward.',
  },
  {
    id: 'wk-pair-persecute', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'persecute', pos: 'verb', gloss: 'to harass or oppress someone persistently' },
    b: { word: 'prosecute', pos: 'verb', gloss: 'to bring legal proceedings against someone' },
    tell: 'A prosecutor works in a court. A persecutor simply will not let up.',
  },
  {
    id: 'wk-pair-complement', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'complement', pos: 'noun', gloss: 'something that completes another thing or sets it off well' },
    b: { word: 'compliment', pos: 'noun', gloss: 'an expression of praise' },
    tell: 'A complement completes - the "e" is the one in complete. A compliment is something nice you said.',
  },
  {
    id: 'wk-pair-council', chapter: CH, concepts: PAIRS, band: 3,
    a: { word: 'council', pos: 'noun', gloss: 'a body of people who meet to advise or to govern' },
    b: { word: 'counsel', pos: 'noun', gloss: 'advice given formally, or the lawyer giving it' },
    tell: 'A council is a group of people. Counsel is what one of them gives you.',
  },

  // --- Band 4. The hard end: pairs that differ by a syllable and reverse the meaning. -------
  {
    id: 'wk-pair-ingenious', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'ingenious', pos: 'adj', gloss: 'cleverly inventive or resourceful' },
    b: { word: 'ingenuous', pos: 'adj', gloss: 'innocent and unguarded, to the point of naivety' },
    tell: 'Ingenious hides genius. Ingenuous hides the "nu" of naive.',
  },
  {
    id: 'wk-pair-credible', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'credible', pos: 'adj', gloss: 'believable and deserving to be trusted' },
    b: { word: 'credulous', pos: 'adj', gloss: 'far too ready to believe what you are told' },
    tell: 'A credible account is worth believing. A credulous listener believes anything.',
  },
  {
    id: 'wk-pair-tortuous', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'tortuous', pos: 'adj', gloss: 'full of twists and turns, or needlessly complicated' },
    b: { word: 'torturous', pos: 'adj', gloss: 'involving great pain or suffering' },
    tell: 'Torturous has torture inside it, spelled out in full. Tortuous merely winds.',
  },
  {
    id: 'wk-pair-venal', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'venal', pos: 'adj', gloss: 'open to bribery; corruptly available for money' },
    b: { word: 'venial', pos: 'adj', gloss: 'minor and easily forgiven' },
    tell: 'A venal official takes the money. A venial fault is barely worth mentioning.',
  },
  {
    id: 'wk-pair-judicious', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'judicious', pos: 'adj', gloss: 'showing good sense and sound judgement' },
    b: { word: 'judicial', pos: 'adj', gloss: 'relating to courts of law or to a judge' },
    tell: 'Judicial belongs to the judge. Judicious belongs to anyone with sense.',
  },
  {
    id: 'wk-pair-proscribe', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'proscribe', pos: 'verb', gloss: 'to forbid something officially' },
    b: { word: 'prescribe', pos: 'verb', gloss: 'to lay down a remedy or a course of action to follow' },
    tell: 'Pro-scribe writes it off. Pre-scribe writes it down for you.',
  },
  {
    id: 'wk-pair-deprecate', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'deprecate', pos: 'verb', gloss: 'to express disapproval of something' },
    b: { word: 'depreciate', pos: 'verb', gloss: 'to fall in value over time' },
    tell: 'Depreciate is about price. Deprecate is about disapproval. Only one shows up on a balance sheet.',
  },
  {
    id: 'wk-pair-abjure', chapter: CH, concepts: PAIRS, band: 4,
    a: { word: 'abjure', pos: 'verb', gloss: 'to renounce something formally, often under oath' },
    b: { word: 'adjure', pos: 'verb', gloss: 'to urge or command someone solemnly' },
    tell: 'Abjure is ab-, away from: you give it up. Adjure is ad-, toward: you press it on somebody else.',
  },
]);

for (const band of [2, 3, 4]) {
  pairTemplates({ chapter: CH, band, idBase: `wk-04-b${band}`, name: 'Confusable pairs' });
}
