// Chapter 4 — Synonym, antonym and degree.
//
// PART 11 of docs/afoqt/HANDOFF.md. The one VA data chapter where the whole difficulty is a
// single linguistic test, not a vocabulary problem:
//
//   CAN YOU SAY "a IS A WEAKER (OR STRONGER) FORM OF b"?
//     - yes -> DEGREE.    WARM is a weaker form of HOT.        symmetric: false (order is real).
//     - no  -> SYNONYM.   HAPPY is not a weaker form of GLAD - they are equally happy.
//                         symmetric: true (swapping changes nothing).
//
// ANTONYM is the third relation - direct opposites, symmetric: true. The trap here is a
// NATURAL-DIRECTION check: the opposite of LOVE is HATE, not INDIFFERENCE, so a pair only
// qualifies if the reverse reads just as naturally. Every antonym row below passes that test.
//
// Antonym is real but genuinely rarer on the real test (~4/75 sourced items) than synonym or
// degree - see PART 8's design record - so this file keeps a 5 synonym / 2 antonym / 3 degree
// split at every band rather than treating all three as equally common. Two antonym rows per
// band is the floor `relationTemplates`' distractor arithmetic needs; do not let it drop to one.
//
// `symmetric: true` on synonym/antonym is not optional polish - without it, the engine's own
// reversed-pair distractor becomes a second correct answer (HAPPY/GLAD and GLAD/HAPPY are
// equally correct), exactly the defect PART 10B's header comment documents for part-part.

import { registerRelations, relationTemplates } from '../../engine/analogy.js';

const CH = 'va-04-meaning-degree';
const SYNONYM = ['va-synonym'];
const ANTONYM = ['va-antonym'];
const DEGREE = ['va-degree'];

registerRelations([
  // ============================ BAND 2 — everyday, on-sight words ============================
  {
    id: 'va-syn-happy', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'happy', pos: 'adj' }, b: { word: 'glad', pos: 'adj' },
    tell: 'Happy and glad share the same core meaning - neither is a stronger or weaker version of the other.',
  },
  {
    id: 'va-syn-fast', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'fast', pos: 'adj' }, b: { word: 'quick', pos: 'adj' },
    tell: 'Fast and quick mean the same thing - true synonyms, not two different intensities.',
  },
  {
    id: 'va-syn-begin', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'begin', pos: 'verb' }, b: { word: 'start', pos: 'verb' },
    tell: 'Begin and start mean the same thing, interchangeably.',
  },
  {
    id: 'va-syn-small', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'small', pos: 'adj' }, b: { word: 'little', pos: 'adj' },
    tell: 'Small and little mean the same thing - neither one is "more small" than the other.',
  },
  {
    id: 'va-syn-big', chapter: CH, concepts: SYNONYM, band: 2, relation: 'synonym', symmetric: true,
    a: { word: 'big', pos: 'adj' }, b: { word: 'large', pos: 'adj' },
    tell: 'Big and large mean the same thing.',
  },
  {
    id: 'va-ant-hot', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'hot', pos: 'adj' }, b: { word: 'cold', pos: 'adj' },
    tell: 'Hot and cold are direct opposites - the natural opposite reads the same in either direction.',
  },
  {
    id: 'va-ant-up', chapter: CH, concepts: ANTONYM, band: 2, relation: 'antonym', symmetric: true,
    a: { word: 'up', pos: 'adv' }, b: { word: 'down', pos: 'adv' },
    tell: 'Up and down are direct, natural opposites.',
  },
  {
    id: 'va-deg-warm', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'warm', pos: 'adj' }, b: { word: 'boiling', pos: 'adj' },
    tell: 'Warm is a weaker form of boiling - same dimension (temperature), different intensity.',
  },
  {
    id: 'va-deg-annoyed', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'annoyed', pos: 'adj' }, b: { word: 'angry', pos: 'adj' },
    tell: 'Annoyed is a weaker form of angry - both are the same emotion at different strengths.',
  },
  {
    id: 'va-deg-drizzle', chapter: CH, concepts: DEGREE, band: 2, relation: 'degree',
    a: { word: 'drizzle', pos: 'noun' }, b: { word: 'downpour', pos: 'noun' },
    tell: 'A drizzle is a weaker form of a downpour - same dimension (rain), different intensity.',
  },

  // ======================= BAND 3 — standard test-prep vocabulary ============================
  {
    id: 'va-syn-forthright', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'forthright', pos: 'adj' }, b: { word: 'frank', pos: 'adj' },
    tell: 'Forthright and frank both mean openly honest - true synonyms.',
  },
  {
    id: 'va-syn-reticent', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'reticent', pos: 'adj' }, b: { word: 'reserved', pos: 'adj' },
    tell: 'Reticent and reserved both describe someone unwilling to speak freely - the same trait.',
  },
  {
    id: 'va-syn-assiduous', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'assiduous', pos: 'adj' }, b: { word: 'industrious', pos: 'adj' },
    tell: 'Assiduous and industrious both mean hard-working and careful - true synonyms.',
  },
  {
    id: 'va-syn-copious', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'copious', pos: 'adj' }, b: { word: 'abundant', pos: 'adj' },
    tell: 'Copious and abundant both mean plentiful - the same amount, not different amounts.',
  },
  {
    id: 'va-syn-terse', chapter: CH, concepts: SYNONYM, band: 3, relation: 'synonym', symmetric: true,
    a: { word: 'terse', pos: 'adj' }, b: { word: 'brief', pos: 'adj' },
    tell: 'Terse and brief mean the same thing - neither is a stronger version of the other.',
  },
  {
    id: 'va-ant-benevolent', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'benevolent', pos: 'adj' }, b: { word: 'malevolent', pos: 'adj' },
    tell: 'Benevolent and malevolent are direct opposites - kind-intentioned versus evil-intentioned.',
  },
  {
    id: 'va-ant-sparing', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'sparing', pos: 'adj' }, b: { word: 'lavish', pos: 'adj' },
    tell: 'Sparing and lavish are direct opposites - economical versus extravagant.',
  },
  {
    id: 'va-deg-irritated', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'irritated', pos: 'adj' }, b: { word: 'furious', pos: 'adj' },
    tell: 'Irritated and furious are both angry, but furious is the stronger form.',
  },
  {
    id: 'va-deg-trickle', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'trickle', pos: 'noun' }, b: { word: 'flood', pos: 'noun' },
    tell: 'A trickle is a weaker form of a flood - same dimension (water flow), different intensity.',
  },
  {
    id: 'va-deg-concerned', chapter: CH, concepts: DEGREE, band: 3, relation: 'degree',
    a: { word: 'concerned', pos: 'adj' }, b: { word: 'alarmed', pos: 'adj' },
    tell: 'Concerned is a weaker form of alarmed - both are worry at different strengths.',
  },
  {
    // Band forced to 3, not 5, by wordBand() - "proliferate" is already a WK headword at band 3
    // (ch06-change-degree.js). registerRelations throws if a shared word disagrees on band, so
    // this stays here rather than with the rest of the 2026-09-17 batch below.
    id: 'va-ant-proliferate', chapter: CH, concepts: ANTONYM, band: 3, relation: 'antonym', symmetric: true,
    a: { word: 'proliferate', pos: 'verb' }, b: { word: 'cease', pos: 'verb' },
    tell: 'Proliferate and cease are direct opposites - multiplying rapidly versus stopping entirely.',
  },

  // ========================= BAND 4 — low-frequency, inference-level ==========================
  {
    id: 'va-syn-loquacious', chapter: CH, concepts: SYNONYM, band: 4, relation: 'synonym', symmetric: true,
    a: { word: 'loquacious', pos: 'adj' }, b: { word: 'voluble', pos: 'adj' },
    tell: 'Loquacious and voluble both mean excessively talkative - true synonyms.',
  },
  {
    id: 'va-syn-recalcitrant', chapter: CH, concepts: SYNONYM, band: 4, relation: 'synonym', symmetric: true,
    a: { word: 'recalcitrant', pos: 'adj' }, b: { word: 'intransigent', pos: 'adj' },
    tell: 'Recalcitrant and intransigent both mean stubbornly resistant to control - the same trait.',
  },
  {
    id: 'va-syn-parsimonious', chapter: CH, concepts: SYNONYM, band: 4, relation: 'synonym', symmetric: true,
    a: { word: 'parsimonious', pos: 'adj' }, b: { word: 'miserly', pos: 'adj' },
    tell: 'Parsimonious and miserly both mean unwilling to spend - true synonyms.',
  },
  {
    id: 'va-syn-audacious', chapter: CH, concepts: SYNONYM, band: 4, relation: 'synonym', symmetric: true,
    a: { word: 'audacious', pos: 'adj' }, b: { word: 'brazen', pos: 'adj' },
    tell: 'Audacious and brazen both mean boldly disregarding normal restraint - the same trait.',
  },
  {
    id: 'va-syn-lucid', chapter: CH, concepts: SYNONYM, band: 4, relation: 'synonym', symmetric: true,
    a: { word: 'lucid', pos: 'adj' }, b: { word: 'pellucid', pos: 'adj' },
    tell: 'Lucid and pellucid both mean transparently clear - true synonyms.',
  },
  {
    id: 'va-ant-magnanimous', chapter: CH, concepts: ANTONYM, band: 4, relation: 'antonym', symmetric: true,
    a: { word: 'magnanimous', pos: 'adj' }, b: { word: 'petty', pos: 'adj' },
    tell: 'Magnanimous and petty are direct opposites - big-hearted versus small-minded.',
  },
  {
    id: 'va-ant-spartan', chapter: CH, concepts: ANTONYM, band: 4, relation: 'antonym', symmetric: true,
    a: { word: 'spartan', pos: 'adj' }, b: { word: 'opulent', pos: 'adj' },
    tell: 'Spartan and opulent are direct opposites - stark and plain versus lavish and rich.',
  },
  {
    id: 'va-deg-peeved', chapter: CH, concepts: DEGREE, band: 4, relation: 'degree',
    a: { word: 'peeved', pos: 'adj' }, b: { word: 'incensed', pos: 'adj' },
    tell: 'Peeved is a weaker form of incensed - both are anger at different strengths.',
  },
  {
    id: 'va-deg-tepid', chapter: CH, concepts: DEGREE, band: 4, relation: 'degree',
    a: { word: 'tepid', pos: 'adj' }, b: { word: 'scalding', pos: 'adj' },
    tell: 'Tepid is a weaker form of scalding - same dimension (heat), different intensity.',
  },
  {
    id: 'va-deg-quibble', chapter: CH, concepts: DEGREE, band: 4, relation: 'degree',
    a: { word: 'quibble', pos: 'noun' }, b: { word: 'altercation', pos: 'noun' },
    tell: 'A quibble is a weaker form of an altercation - same dimension (conflict), different intensity.',
  },

  // ============ BAND 5 — added 2026-09-17, closing the gap Trey flagged: VA had NO band-5 ========
  // content at all in any chapter (npm run afoqt:check confirmed every VA chapter topped out at
  // band 4). Every word below was checked against the WK bank's `wordBand()` before being
  // assigned here - see the band-3 exception above for what happens when a word already has an
  // opinion. None of these collided.
  {
    id: 'va-syn-pristine', chapter: CH, concepts: SYNONYM, band: 5, relation: 'synonym', symmetric: true,
    a: { word: 'pristine', pos: 'adj' }, b: { word: 'unspoiled', pos: 'adj' },
    tell: 'Pristine and unspoiled both mean untouched and in original condition - true synonyms.',
  },
  {
    id: 'va-syn-tainted', chapter: CH, concepts: SYNONYM, band: 5, relation: 'synonym', symmetric: true,
    a: { word: 'tainted', pos: 'adj' }, b: { word: 'contaminated', pos: 'adj' },
    tell: 'Tainted and contaminated both mean impurely spoiled - the same condition, not different degrees of it.',
  },
  {
    id: 'va-syn-hackneyed', chapter: CH, concepts: SYNONYM, band: 5, relation: 'synonym', symmetric: true,
    a: { word: 'hackneyed', pos: 'adj' }, b: { word: 'banal', pos: 'adj' },
    tell: 'Hackneyed and banal both mean overused and unoriginal - true synonyms.',
  },
  {
    id: 'va-syn-tantamount', chapter: CH, concepts: SYNONYM, band: 5, relation: 'synonym', symmetric: true,
    a: { word: 'tantamount', pos: 'adj' }, b: { word: 'equivalent', pos: 'adj' },
    tell: 'Tantamount and equivalent both mean amounting to the same thing - true synonyms.',
  },
  {
    id: 'va-syn-munificent', chapter: CH, concepts: SYNONYM, band: 5, relation: 'synonym', symmetric: true,
    a: { word: 'munificent', pos: 'adj' }, b: { word: 'generous', pos: 'adj' },
    tell: 'Munificent and generous both mean giving lavishly - the same trait, not different amounts of it.',
  },
  {
    id: 'va-ant-championed', chapter: CH, concepts: ANTONYM, band: 5, relation: 'antonym', symmetric: true,
    a: { word: 'championed', pos: 'adj' }, b: { word: 'abased', pos: 'adj' },
    tell: 'Championed and abased are direct opposites - held up and exalted versus humiliated and lowered.',
  },
  {
    id: 'va-ant-servile', chapter: CH, concepts: ANTONYM, band: 5, relation: 'antonym', symmetric: true,
    a: { word: 'servile', pos: 'adj' }, b: { word: 'domineering', pos: 'adj' },
    tell: 'Servile and domineering are direct opposites - submissively obedient versus controlling and bossy.',
  },
  {
    id: 'va-deg-disquiet', chapter: CH, concepts: DEGREE, band: 5, relation: 'degree',
    a: { word: 'disquiet', pos: 'noun' }, b: { word: 'anguish', pos: 'noun' },
    tell: 'Disquiet is a weaker form of anguish - both are distress at different strengths.',
  },
  {
    id: 'va-deg-apprehensive', chapter: CH, concepts: DEGREE, band: 5, relation: 'degree',
    a: { word: 'apprehensive', pos: 'adj' }, b: { word: 'petrified', pos: 'adj' },
    tell: 'Apprehensive is a weaker form of petrified - both are fear at different strengths.',
  },
  {
    id: 'va-deg-miffed', chapter: CH, concepts: DEGREE, band: 5, relation: 'degree',
    a: { word: 'miffed', pos: 'adj' }, b: { word: 'irate', pos: 'adj' },
    tell: 'Miffed is a weaker form of irate - both are anger at different strengths.',
  },
]);

for (const band of [2, 3, 4, 5]) {
  relationTemplates({ chapter: CH, band, idBase: `va-04-b${band}`, name: 'Synonym, antonym and degree' });
}
