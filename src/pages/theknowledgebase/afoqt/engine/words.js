// Word Knowledge: the vocabulary registry and its question frames.
//
// A sibling of engine/facts.js rather than a user of it. A fact row has a `term` and a `gloss`
// and can be asked in either direction; a vocabulary row is asked one way only - here is a word,
// pick the closest meaning - so it needs its own shape and its own distractor rules.
//
// WHY EVERY ROW CARRIES ITS OWN FOUR DISTRACTORS. The obvious design is to draw wrong options
// from other rows' answers. It cannot be made safe: English is full of near-synonyms, so a
// blind draw will eventually offer a second correct answer, and no structural check can catch
// it because both options are perfectly well-formed words. A row therefore declares its whole
// slate, and `registerWords` validates it once at import.
//
// THE FOUR ARE NAMED ERROR MODES, and three of the four come straight out of the official
// OATTS Word Knowledge items, whose own worked solutions state the method:
//
//   antonym    - "Eliminate obviously wrong choices." The official ARDUOUS item offers Simple;
//                the CURSORY item offers Detailed and Thoughtful. The opposite is the single
//                most common trap, because a candidate who half-remembers a word usually
//                remembers its AXIS and not its direction.
//   confusable - every official item names one: "avoid confusing arduous with ardent",
//                "don't confuse with exasperate", "avoid mixing benevolent and malevolent".
//                The distractor is the confusable word's MEANING, so picking it is exactly the
//                mistake the AF warns about.
//   related    - step 5 of the official method is "choose the best synonym, NOT just a related
//                word". This option is in the right semantic field and is not the meaning.
//   decoy      - same part of speech and register, plainly wrong once the word is known.
//
// The row also carries a `root` where the morphology genuinely helps, because step 3 of the
// official method is "use word parts if unsure" - and that is the whole of chapter 2.

import { registerTemplate } from './generator.js';

/**
 * @typedef {Object} WordRow
 * @property {string} id
 * @property {string} chapter
 * @property {string[]} concepts     must be declared by that chapter - afoqt:coverage checks it
 * @property {1|2|3|4|5} band
 * @property {string} word           the headword. Shown in capitals, as the real subtest does.
 * @property {'adj'|'noun'|'verb'|'adv'} pos
 * @property {string} gloss          full definition, for the explanation and the lesson
 * @property {string} answer         the correct option: ONE word, the closest in meaning
 * @property {string} antonym        option: the opposite
 * @property {string} related        option: same field, not the meaning
 * @property {string} decoy          option: same register, plainly wrong
 * @property {{word: string, meaning: string}} confusable  option is `meaning`
 * @property {string} [sentence]     the word used in context; enables the context frame
 * @property {{form: string, sense: string}} [root]
 * @property {'pos'|'neg'|'neutral'} charge   connotation. Not decoration: on a 12-second clock
 *                                   the fastest usable signal is often "is this word approving
 *                                   or disapproving", which eliminates two or three options
 *                                   without recalling a definition at all.
 */

const REGISTRY = new Map();
const POS = new Set(['adj', 'noun', 'verb', 'adv']);
const CHARGE = new Set(['pos', 'neg', 'neutral']);

/** Options are compared case- and space-insensitively; "Set Free" and "set free" are one option. */
const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Would this option hand the answer over by looking like the headword?
 *
 * Two ways it can. An option containing the word outright ("arduousness" for ARDUOUS) is a
 * giveaway; so is one sharing a long prefix, because the candidate can match on shape without
 * knowing any meaning. Six characters is the threshold that separates `arduous`/`ardent` (share
 * three, genuinely a confusable pair worth testing) from `gregarious`/`gregariousness`.
 */
export function looksLikeHeadword(word, option) {
  const w = norm(word);
  const o = norm(option);
  if (o.includes(w) || w.includes(o)) return true;
  const n = Math.min(6, w.length, o.length);
  return n >= 6 && w.slice(0, n) === o.slice(0, n);
}

/**
 * Suffixes that betray a part of speech. Every option on a real Word Knowledge item is the same
 * part of speech as the headword - a lone noun among four adjectives is findable without
 * knowing what any of them mean, which is the whole item gone.
 */
const POS_SUFFIX = [
  { re: /(ness|ity|tion|sion|ment|ance|ence)$/, pos: 'noun' },
  { re: /ly$/, pos: 'adv' },
];

/**
 * `-ly` is an adverb ending except when it is not, and English has a long tail of `-ly`
 * ADJECTIVES. Without this list the guard rejects "unruly", "friendly" and "orderly" - all
 * perfectly good adjective options - which would push an author toward weaker words to satisfy
 * a check that was wrong. Same shape as the ACRONYMS list in engine/facts.js, and for the same
 * reason: a heuristic over English needs to know its own exceptions.
 */
const LY_ADJECTIVES = new Set([
  'unruly', 'friendly', 'orderly', 'lonely', 'lovely', 'lively', 'costly', 'timely', 'surly',
  'burly', 'wily', 'homely', 'ghastly', 'ugly', 'deadly', 'elderly', 'cowardly', 'worldly',
  'scholarly', 'miserly', 'portly', 'stately', 'kindly', 'silly', 'holy', 'jolly', 'oily',
  'early', 'likely', 'unlikely', 'motley', 'princely', 'saintly', 'sickly', 'steely', 'wobbly',
  'grisly', 'gnarly', 'seemly', 'unseemly', 'manly', 'godly', 'curly', 'burly', 'crumbly',
  'prickly', 'wobbly', 'gangly', 'knobbly', 'stately', 'courtly', 'comely', 'homely',
]);

/**
 * Bare verbs an author reaches for when glossing a confusable.
 *
 * The suffix rules above cannot see these: "ponder" has no ending that marks it, so a COGENT
 * item shipped with options Persuasive / Detailed / Unconvincing / Expensive / **Ponder** - one
 * verb among four adjectives, findable in under a second without knowing a single one of them.
 * The confusable there was `cogitate`, and the fix is to render its meaning in the HEADWORD's
 * part of speech ("thoughtful"), which is also the truer error mode: someone who mixes cogent
 * with cogitate believes cogent means thoughtful.
 *
 * This list is a partial guard and is meant to be - it covers the verbs that actually turn up in
 * glosses rather than attempting a lexicon. Reading the sampled output is still the real check.
 */
const COMMON_VERBS = new Set([
  'ponder', 'think', 'thrive', 'wane', 'wax', 'scold', 'praise', 'condemn', 'rebuke', 'flatter',
  'hesitate', 'linger', 'wander', 'ramble', 'boast', 'mock', 'soothe', 'worsen', 'lessen',
  'weaken', 'strengthen', 'delay', 'hasten', 'reveal', 'conceal', 'forgive', 'refuse', 'accept',
  'destroy', 'build', 'gather', 'scatter', 'shrink', 'expand', 'endure', 'yield', 'resist',
  'pretend', 'confess', 'quibble', 'squander', 'hoard', 'placate', 'provoke', 'deceive',
  'wither', 'flourish', 'meander', 'chastise', 'admonish', 'extol', 'deride', 'berate',
]);

function suffixPos(option) {
  const o = norm(option);
  if (LY_ADJECTIVES.has(o)) return 'adj';
  if (COMMON_VERBS.has(o)) return 'verb';
  for (const { re, pos } of POS_SUFFIX) if (re.test(o)) return pos;
  return null;
}

export function registerWords(rows) {
  for (const r of rows) {
    const at = `${r.id ?? '(no id)'}`;
    if (!r.id) throw new Error('word row needs an id');
    if (REGISTRY.has(r.id)) throw new Error(`duplicate word id: ${r.id}`);
    if (!r.word || !r.answer || !r.gloss) throw new Error(`${at}: needs word, answer and gloss`);
    if (!POS.has(r.pos)) throw new Error(`${at}: pos must be one of ${[...POS].join(', ')}`);
    if (!(r.band >= 1 && r.band <= 5)) throw new Error(`${at}: band must be 1-5`);
    if (!CHARGE.has(r.charge)) throw new Error(`${at}: charge must be one of ${[...CHARGE].join(', ')}`);
    if (!r.concepts?.length) throw new Error(`${at}: declares no concepts`);
    if (!r.confusable?.word || !r.confusable?.meaning) {
      throw new Error(`${at}: needs a confusable {word, meaning} - every official item names one`);
    }
    if (norm(r.confusable.word) === norm(r.word)) {
      throw new Error(`${at}: confusable is the headword itself`);
    }
    for (const w of REGISTRY.values()) {
      if (norm(w.word) === norm(r.word)) throw new Error(`${at}: "${r.word}" is already in the bank as ${w.id}`);
    }

    const slate = optionsFor(r);
    const seen = new Set();
    for (const o of slate) {
      if (!o.value?.trim()) throw new Error(`${at}: empty option`);
      const k = norm(o.value);
      if (seen.has(k)) throw new Error(`${at}: "${o.value}" appears twice on the slate`);
      seen.add(k);
      if (looksLikeHeadword(r.word, o.value)) {
        throw new Error(`${at}: option "${o.value}" gives away the headword "${r.word}"`);
      }
    }
    // A LENGTH outlier is a tell too, and a subtler one. Added 2026-09-02 after 69 of the 132
    // rows in chapters 7-12 shipped a confusable gloss like "to treat something sacred with
    // disrespect" onto a slate of one-word options - every structural check passed, and the
    // trap was findable in under a second by anyone who noticed the long option is always
    // wrong. It was caught by reading `npm run afoqt:sample` output, which is exactly the
    // failure mode the folder CLAUDE.md warns knowledge subtests about. Two words longer than
    // every other option is the threshold: it allows "a wide view" next to "vista" but rejects
    // a full sentence among single words.
    const wordCount = (v) => String(v).trim().split(/\s+/).length;
    const longest = Math.max(...slate.slice(1).filter((o) => o.error !== 'confused-with').map((o) => wordCount(o.value)));
    const trapLength = wordCount(r.confusable.meaning);
    if (trapLength >= longest + 2) {
      throw new Error(`${at}: confusable gloss "${r.confusable.meaning}" is ${trapLength} words against a longest-other of ${longest} - the trap is findable by shape, shorten it`);
    }

    // A part-of-speech outlier is a tell. Checked against the ANSWER's apparent class rather
    // than the declared `pos`, because the answer is what the other four have to match.
    const answerPos = suffixPos(r.answer) ?? r.pos;
    for (const o of slate.slice(1)) {
      const p = suffixPos(o.value);
      if (p && p !== answerPos) {
        throw new Error(`${at}: option "${o.value}" reads as a ${p} but the answer "${r.answer}" reads as a ${answerPos} - a lone outlier is findable without knowing the word`);
      }
    }
    if (r.sentence && !new RegExp(r.word.slice(0, Math.max(4, r.word.length - 3)), 'i').test(r.sentence)) {
      throw new Error(`${at}: sentence does not contain the headword`);
    }
    REGISTRY.set(r.id, r);
  }
  return rows;
}

/** The full slate, correct answer FIRST. Order here is the order `h.choices` prefers. */
export function optionsFor(r) {
  return [
    { value: r.answer, error: null, why: null },
    { value: r.confusable.meaning, error: 'confused-with', why: `that is what "${r.confusable.word}" means` },
    { value: r.antonym, error: 'antonym-trap', why: `that is the opposite of ${r.word}` },
    { value: r.related, error: 'related-not-synonym', why: `related to ${r.word}, but not what it means` },
    { value: r.decoy, error: 'wrong-meaning', why: `${r.word} does not mean this` },
  ];
}

export const allWords = () => [...REGISTRY.values()];
export const getWord = (id) => REGISTRY.get(id) ?? null;
export const wordsFor = (chapter, band = null) =>
  allWords().filter((w) => w.chapter === chapter && (band == null || w.band === band));
export function _resetWords() { REGISTRY.clear(); }

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Register the question frames for one chapter at one band.
 *
 * Two frames, both real AFOQT formats:
 *   plain   - the headword alone, in capitals. This is the dominant format and what the ten
 *             official items all use.
 *   context - the word inside a sentence, then asked. Only rows carrying a `sentence` qualify,
 *             and the frame is skipped entirely unless five of them do.
 *
 * `concepts` is derived from the rows actually drawn, never copied from the chapter, so the
 * coverage check measures what is really tested rather than what was claimed.
 */
export function wordTemplates({ chapter, band, idBase, name, calibratedAgainst = 'oatts' }) {
  const rows = wordsFor(chapter, band);
  const made = [];

  const build = (suffix, frameName, usable, ask, extraConcepts = []) => {
    if (usable.length < 5) return;
    made.push(registerTemplate({
      id: `${idBase}-${suffix}`,
      subtest: 'WK',
      band,
      name: `${name} - ${frameName}`,
      concepts: [...new Set([...usable.flatMap((w) => w.concepts), ...extraConcepts])],
      calibratedAgainst,
      // Bounded and declared: the bank is a finite list of words, and pretending otherwise
      // would be a static question wearing a template's clothes.
      stemSpace: usable.length,
      itemPool: true,
      // The identity of each item, in index order, so buildDrill can deal WORDS rather than
      // (template, word) pairs - see dealRounds. Word ids, not headwords: two frames asking the
      // same word must return the same key or the word gets a ticket per frame.
      itemKeys: () => usable.map((w) => w.id),
      generate: (rng, h) => {
        // INDEXED, not drawn. `h.pick` chose the word from the seed's rng stream, which made the
        // word unaddressable - the only way to ask about a specific word was to guess seeds until
        // one produced it. Indexing off `h.item` (the seed's low 12 bits) makes word selection a
        // plain function of the seed, which is what lets buildDrill deal WORDS uniformly instead
        // of dealing templates and hoping. Still fully deterministic: (templateId, seed)
        // regenerates byte-identically, which is the property that actually matters.
        const w = usable[h.item % usable.length];
        const [correct, ...distractors] = optionsFor(w).map((o) => ({ ...o, value: cap(o.value) }));
        const { choices, correctIndex, errors, whys } = h.choices(correct, distractors);
        return {
          stem: ask(w),
          choices, correctIndex, errors, whys,
          tags: ['wk', ...w.concepts],
          explanation: `${cap(w.word)} (${w.pos}) - ${w.gloss}. The trap is "${w.confusable.meaning}", which is what "${w.confusable.word}" means.${w.root ? ` Word parts: "${w.root.form}" means ${w.root.sense}.` : ''}`,
          // A structural field, not parsed out of the explanation string, so the word bank
          // (afoqtStorage.js addToWordBank) can capture a miss reliably regardless of how the
          // explanation prose is worded.
          vocab: { word: w.word, pos: w.pos, gloss: w.gloss, root: w.root ?? null },
        };
      },
    }));
  };

  build('syn', 'closest in meaning', rows, (w) => `${w.word.toUpperCase()}`);
  build('ctx', 'in context', rows.filter((w) => w.sentence),
    (w) => `${w.sentence}\n\n${w.word.toUpperCase()} most nearly means:`);

  return made;
}

/**
 * The two METHOD frames. Both draw across the whole bank rather than one chapter, so both
 * declare the method chapter's own concepts explicitly instead of inheriting the rows' - the
 * rows are only raw material here, and claiming their concepts would tell the coverage check
 * that chapter 5 is tested by a question that has nothing to do with chapter 5.
 */
export function methodTemplates({ band, calibratedAgainst = 'oatts' }) {
  const pool = allWords().filter((w) => w.band === band);
  const made = [];

  // CONNOTATION. On a 12-second clock, "is this word approving or disapproving" is often the
  // only signal there is time to use, and it is enough to strike two or three options. The
  // options here are WORDS rather than meanings, because charge is what is being read.
  const negatives = pool.filter((w) => w.charge === 'neg');
  const others = pool.filter((w) => w.charge !== 'neg');
  if (negatives.length >= 1 && others.length >= 4) {
    made.push(registerTemplate({
      id: `wk-connotation-b${band}`,
      subtest: 'WK',
      band,
      name: 'Connotation - approving or disapproving',
      concepts: ['wk-connotation'],
      calibratedAgainst,
      // The stem is one sentence forever and the ITEM is which word answers it, so the audit
      // has to count answers here rather than stems. See itemKey() in templateAudit.js.
      varies: 'options',
      stemSpace: negatives.length,
      // NOT an item pool, deliberately. The stem here is one fixed sentence forever, so dealing
      // this per-item puts several identical-looking questions into a single run - which reads as
      // exactly the repetition the per-item deal exists to remove. Contrast Instrument
      // Comprehension, which also has a constant stem but whose items are different PICTURES.
      generate: (rng, h) => {
        // Indexed for the same reason as the chapter frames above - see that comment. Only the
        // TARGET is indexed; the four wrong-charge options stay drawn, since they are the
        // varying part of the item rather than its identity.
        const target = negatives[h.item % negatives.length];
        const wrong = [];
        const used = new Set([target.id]);
        for (let i = 0; i < 40 && wrong.length < 4; i++) {
          const o = h.pick(others);
          if (used.has(o.id)) continue;
          used.add(o.id);
          wrong.push({
            value: cap(o.word),
            error: 'wrong-charge',
            why: `${o.word} is ${o.charge === 'pos' ? 'approving' : 'neutral'} - it means ${o.gloss}`,
          });
        }
        const { choices, correctIndex, errors, whys } = h.choices(cap(target.word), wrong);
        return {
          stem: 'Which of the following words carries a NEGATIVE connotation?',
          choices, correctIndex, errors, whys,
          tags: ['wk', 'wk-connotation'],
          // Word-specific only, on purpose - the "charge is a fast signal" strategy pitch lives
          // once in the wk-01-method lesson. Repeating a strategy tip on every single miss is
          // noise, not help, once you've read it the first time (Trey's direct complaint,
          // 2026-08-30: missing 5 connotation questions produced the same paragraph 5 times).
          explanation: `${cap(target.word)} means ${target.gloss} - a disapproving (negative) word.`,
          vocab: { word: target.word, pos: target.pos, gloss: target.gloss, root: target.root ?? null },
        };
      },
    }));
  }

  // THE OPPOSITE FRAME. Asking for the opposite makes the SYNONYM the trap - a candidate
  // reading at speed sees a word they know is connected and takes it. That is the antonym trap
  // running in reverse, and drilling it in reverse is what makes it visible in the forward
  // direction, where it costs real marks.
  const withAntonyms = pool.filter((w) => w.antonym);
  if (withAntonyms.length >= 5) {
    made.push(registerTemplate({
      id: `wk-opposite-b${band}`,
      subtest: 'WK',
      band,
      name: 'The opposite, where the synonym is the trap',
      concepts: ['wk-antonym-trap'],
      calibratedAgainst,
      stemSpace: withAntonyms.length,
      itemPool: true,
      itemKeys: () => withAntonyms.map((w) => w.id),
      generate: (rng, h) => {
        // Indexed - see the chapter frames above.
        const w = withAntonyms[h.item % withAntonyms.length];
        const { choices, correctIndex, errors, whys } = h.choices(cap(w.antonym), [
          { value: cap(w.answer), error: 'took-the-synonym', why: `that is what ${w.word} MEANS, not its opposite` },
          { value: cap(w.related), error: 'related-not-opposite', why: `related to ${w.word}, and not its opposite` },
          { value: cap(w.confusable.meaning), error: 'confused-with', why: `that is what "${w.confusable.word}" means` },
          { value: cap(w.decoy), error: 'wrong-meaning', why: 'unrelated in either direction' },
        ]);
        return {
          stem: `Which word is most nearly OPPOSITE in meaning to ${w.word.toUpperCase()}?`,
          choices, correctIndex, errors, whys,
          tags: ['wk', 'wk-antonym-trap'],
          // "Read the stem carefully" is a strategy tip, not a fact about this word - it belongs
          // in the lesson (read once), not repeated on every miss. See the connotation frame
          // above for why.
          explanation: `${cap(w.word)} means ${w.gloss}, so its opposite is "${w.antonym}". The trap is "${w.answer}" - that is what ${w.word} itself means, not its opposite.`,
          vocab: { word: w.word, pos: w.pos, gloss: w.gloss, root: w.root ?? null },
        };
      },
    }));
  }

  return made;
}
