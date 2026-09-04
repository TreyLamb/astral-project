// Read-aloud and voice-answer support. PURE - no browser APIs live here, which is what lets the
// whole thing be unit-tested. The Web Speech plumbing is in ../voice/.
//
// Trey's request, 2026-09-03: "I want to be able to hear the question read well and then if
// possible reply with voice for my answer... it has to be super smooth."
//
// "READ WELL" IS THE HARD PART, AND IT IS A DATA PROBLEM, NOT AN API PROBLEM.
// A speech synthesiser handed `11 + 7(12 - 8)^2 = ?` says "eleven plus seven twelve eight two"
// - it drops every operator. Handed `BENEVOLENT most nearly means:` it spells B-E-N-E-V-O-L-E-N-T
// one letter at a time, because most engines treat an all-caps run as an initialism. Neither is
// catchable by a test that only checks "did it speak" - you have to know what the bank actually
// emits. So the transforms below were built from an inventory of every non-alphanumeric character
// and every all-caps token the generator produces across all 354 templates, not from a guess at
// what a math stem looks like.
//
// SUBSTITUTION ORDER IS LOAD-BEARING. Several rules consume the characters a later rule looks
// for (the parenthesis rewrite deletes the brackets the "implicit multiply" rule keys on), so
// they run in the sequence below and the tests pin the sequence, not just the outputs.

export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * How much of a subtest a voice can actually carry.
 *
 * This is the honest version of Trey's own caveat ("it probably won't ever get used for half of
 * the equations"). Three levels, and the distinction that matters is not "is it hard to
 * pronounce" but WHERE THE QUESTION LIVES:
 *
 *   full    - the question is entirely words. Voice loses nothing.
 *   math    - the question is words plus notation. Readable, but you are listening to
 *             `the quantity x plus 7, times the quantity x plus 5` and that is a genuinely
 *             harder listen than reading it. Offered, not pushed.
 *   figure  - the question is a PICTURE. The stem reads fine and tells you nothing, because the
 *             answer is in a grid / a pile of blocks / an attitude indicator. Reading these aloud
 *             is not wrong, it is just not useful, so it never autoplays and the UI says why.
 */
export const SPEAKABILITY = {
  VA: { level: 'full', note: null },
  AR: { level: 'full', note: 'Word problems - the numbers are read as spoken quantities.' },
  WK: { level: 'full', note: null },
  MK: { level: 'math', note: 'Notation is spoken out ("x squared", "the quantity x plus 7"). Fine for a word-form question, awkward for a long expression.' },
  RC: { level: 'full', note: 'The passage has its own Read button - it serves several questions, so it is not re-read with each one.' },
  SJ: { level: 'full', note: null },
  PS: { level: 'full', note: null },
  AI: { level: 'full', note: null },
  TR: { level: 'figure', note: 'The answer is a lookup in a 33x33 grid. Nothing a voice says can substitute for finding the cell.' },
  BC: { level: 'figure', note: 'The answer is the number of blocks touching a block in a drawn pile.' },
  IC: { level: 'figure', note: 'Both the question (two dials) and the options (four aircraft) are pictures.' },
};

/** True where reading the question aloud actually conveys the question. */
export function isSpeakable(code) {
  return (SPEAKABILITY[code]?.level ?? 'full') !== 'figure';
}

/**
 * Acronyms a synthesiser SHOULD spell or say as a unit, so they survive the all-caps rule below.
 *
 * Every one of these was taken from generated Aviation Information output rather than invented -
 * an acronym the bank never emits is dead weight, and a missing one gets read as a word ("ILS"
 * becomes "ils"). Note the mixed nature deliberately: TTS spells ILS/VOR/ADF letter by letter and
 * pronounces PAPI/VASI/ATIS/UNICOM as words, which is exactly what a pilot does with them.
 */
export const ACRONYMS = new Set([
  'ADF', 'ATC', 'ATIS', 'CTAF', 'DME', 'GPS', 'IAS', 'TAS', 'ILS', 'MDS', 'NDB',
  'PAPI', 'VASI', 'VFR', 'IFR', 'VIP', 'VOR', 'VSI', 'VTOL', 'RPM', 'AGL', 'MSL',
  'AOA', 'FAA', 'USAF', 'PME', 'AFOQT', 'ASVAB', 'OATTS', 'SJT', 'CFI', 'MEA', 'NOTAM',
]);

/**
 * A geometry label - `AB`, `BC`, `ABC`, `DEF` - which must be SPELLED, not lowercased.
 *
 * The bank labels segments and triangles from the front of the alphabet and always in ascending
 * order, so "strictly ascending letters drawn from A-H" separates them from the emphasis caps
 * around them without a hand-maintained list. It accepts AB / BC / DE / EF / ABC / DEF and
 * rejects every all-caps English word the generator emits - OAK, ANT, CAT, ARM, ADD, BIG - because
 * none of those ascend. Checked against the real corpus, not asserted.
 */
export function isGeometryLabel(token) {
  if (!/^[A-H]{2,4}$/.test(token)) return false;
  for (let i = 1; i < token.length; i++) {
    if (token.charCodeAt(i) <= token.charCodeAt(i - 1)) return false;
  }
  return true;
}

const ROMAN = { II: 'two', III: 'three', IV: 'four' };

/**
 * All-caps runs. The bank uses capitals for THREE different jobs and a synthesiser cannot tell
 * them apart, so this can:
 *   - the tested headword           BENEVOLENT most nearly means  -> benevolent
 *   - emphasis inside a stem        How much INTEREST is earned   -> interest
 *   - a real initialism             the ILS glideslope            -> ILS (kept)
 * Lowercasing is right for the first two: emphasis is lost, but emphasis was never going to
 * survive a synthesiser anyway, and a spelled-out headword makes the question unanswerable.
 */
function fixCaps(text) {
  return text.replace(/\b[A-Z]{2,}\b/g, (token) => {
    if (ACRONYMS.has(token)) return token;
    if (ROMAN[token]) return ROMAN[token];
    if (isGeometryLabel(token)) return token.split('').join(' ');
    return token.toLowerCase();
  });
}

/** Aircraft designators: `C-17`, `UH-60`, `KC-135`. The hyphen reads as "minus" otherwise. */
function fixDesignators(text) {
  return text.replace(/\b([A-Z]{1,3})-(\d{1,3}\b)/g, (_, letters, num) => `${letters.split('').join(' ')} ${num}`);
}

/**
 * Money and percent. Shared by every subtest - AR is full of both and needs no other math.
 *
 * Cents are split off rather than left as a decimal: the bank formats currency to two places, so
 * a straight read gives "five hundred eighty point zero zero dollars" on every whole-dollar
 * option, which is both wrong-sounding and slow on a slate of five.
 */
function fixQuantities(text) {
  return text
    .replace(/\$\s*([\d,]+)\.00\b/g, '$1 dollars')
    .replace(/\$\s*([\d,]+)\.(\d\d)\b/g, '$1 dollars and $2 cents')
    .replace(/\$\s*([\d,]+(?:\.\d+)?)/g, '$1 dollars')
    .replace(/\b1 dollars\b/g, '1 dollar')
    .replace(/(\d)\s*%/g, '$1 percent')
    // "a 64 degree angle", not "a 64 degrees angle" - a measurement used attributively takes the
    // singular, and the bank writes plenty of them (`the complement of a 64° angle`). The
    // following nouns are listed rather than matched as "any lowercase word", which caught
    // `75° and 68°` and produced "75 degree and 68 degrees".
    .replace(/(\d)\s*°(?=\s+(?:angle|arc|sector|segment|turn|rotation|bank|pitch|heading)\b)/g, '$1 degree')
    .replace(/(\d)\s*°/g, '$1 degrees')
    .replace(/°/g, ' degrees ');
}

/** An exponent, spoken. The sign is resolved HERE rather than left to the sign pass below, which
 *  would see `to the power of -5` with a letter to the left of the minus and call it a
 *  subtraction ("to the power of minus five"). */
function powerWords(n) {
  const v = Number(n);
  if (v === 2) return ' squared';
  if (v === 3) return ' cubed';
  return v < 0 ? ` to the power of negative ${Math.abs(v)}` : ` to the power of ${v}`;
}

/**
 * The notation pass. MK only - running it over prose would turn `well-designed` into
 * `well minus designed` and `(rounded to the nearest cent)` into `the quantity rounded to the
 * nearest cent`, which is why this is gated on the subtest rather than applied everywhere.
 */
function fixMath(text) {
  let s = text;

  // Absolute value first: the bars have to come off before anything starts rewriting what is
  // between them, and the trailing comma keeps `|a - b| - |c - d|` from running together into one
  // unparseable sentence.
  s = s.replace(/\|([^|]+)\|/g, 'the absolute value of $1,');

  // Radicals before signs, so the minus inside a root is still adjacent to a space when the
  // negative-number rule below looks for it. The leading space is not cosmetic - the bank writes
  // a coefficient flush against the radical (`19√8`), and without it that reads as one word.
  s = s.replace(/\s*√\s*/g, ' the square root of ');

  s = s.replace(/π/g, ' pi ')
    .replace(/±/g, ' plus or minus ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ');

  // A mixed number. `2 1/5` is "two and one fifth", NOT "two, one over five" - and the bank
  // writes both mixed numbers and bare fractions with the same slash, so the whole-part has to be
  // consumed here or the two become indistinguishable by ear on a slate that contains both
  // (`mk-mixed-number-multiply` ships `16 3/25` against `24/25`).
  s = s.replace(/(\d)\s+(\d+)\s*\/\s*(\d+)/g, '$1 and $2 over $3');

  // `2 1/5 x 4 3/5` - a spaced lowercase x between two numbers is the bank's multiplication sign,
  // not a variable. A variable x is never flanked by digits on both sides with spaces.
  s = s.replace(/(\d)\s+x\s+(?=\d)/g, '$1 times ');

  // FUNCTION APPLICATION IS NOT MULTIPLICATION, and it has to be settled before either the
  // implicit-multiply rule or the bracket rewrite touches it. `f(x)` is "f of x"; treating its
  // bracket like any other produced "if fthe quantity x, equals..." on every composite-function
  // item. Innermost-first so `f(g(6))` unwinds as "f of g of 6".
  for (let i = 0; i < 3 && /\b[fgh]\s*\([^()]*\)/.test(s); i++) {
    s = s.replace(/\b([fgh])\s*\(([^()]*)\)/g, '$1 of $2');
  }

  // Implicit multiplication. A bracket is a PRODUCT only when what precedes it is an operand -
  // a digit, a closing bracket, or a lone variable letter. Allowing any letter turned the prose
  // aside in "its same-side interior (co-interior) angle" into "interior TIMES the quantity
  // co-interior", so the operand test is deliberately narrow and `\b` does the work: the final
  // `r` of "interior" is not at a word boundary, a standalone `x` is.
  s = s.replace(/(\d)([a-z])\b/g, '$1 $2')
    .replace(/([\d)])\s*\(/g, '$1 times (')
    .replace(/\b([a-z])\s*\(/g, '$1 times (');

  // EXPONENTS RUN AFTER THE IMPLICIT-MULTIPLY RULE, never before. `14x^3(4x + 8)` is a product,
  // and the operand to the left of that bracket is the `3` of the exponent - rewrite it to the
  // word "cubed" first and the multiply rule sees a letter instead, producing "14 x cubedthe
  // quantity 4 x plus 8". That exact string has a regression test.
  //
  // The bracketed form is matched as a PAIR and never as two optional halves: a trailing optional
  // `\)` on the bare form swallows the closing bracket of the enclosing expression, and
  // `(7x^3)(8x^6)` came out with two opening brackets and no closing ones.
  s = s.replace(/\^\s*\(\s*(-?\d+)\s*\)/g, (_, n) => powerWords(n))
    .replace(/\^\s*(-?\d+)/g, (_, n) => powerWords(n));

  // "the quantity ..., " is how a person reads a bracket aloud; "open parenthesis" is how a
  // screen reader does, and it is much harder to hold in your head across a five-option slate.
  // Innermost-first, repeatedly, so a nested expression still comes out in order.
  //
  // A bracket with no arithmetic in it is an ENGLISH ASIDE, not a subexpression, and gets its
  // brackets dropped instead - MK stems carry parenthetical glosses, and "the quantity
  // co-interior" is nonsense where a plain pause is right. The test excludes a bare hyphen on
  // purpose: `co-interior` is hyphenated, not subtracted.
  for (let i = 0; i < 4 && /\([^()]*\)/.test(s); i++) {
    let rewrote = false;
    s = s.replace(/\(([^()]*)\)/g, (whole, inner) => {
      if (!/[\d+*/^=√π]|\s-\s/.test(inner)) return `, ${inner},`;
      rewrote = true;
      return `the quantity ${inner},`;
    });
    if (!rewrote) break;
  }

  // SIGNS RUN BEFORE THE COMPARISON OPERATORS, and this ordering is the whole correctness of the
  // pass. `-` is subtraction when something stands to its left and a negative sign otherwise, so
  // the test is "what character precedes it" - which stops being answerable the moment `<` has
  // been spelled out as the word "than". The first version of this ran signs last and read
  // `12 - 8` as "twelve negative eight" on every order-of-operations item in the bank.
  //
  // A minus after a LETTER only counts as subtraction when it is spaced on both sides. Without
  // that, `x-coordinate` reads as "x minus coordinate" - a hyphenated word is the one thing in a
  // math stem that is not arithmetic, and the bank has them.
  //
  // After a COMMA the spacing decides it, and both forms are in the bank: `|a - b| - |c - d|`
  // leaves ", - the absolute value" (subtraction) while the sequence `15, 5, -5, -15` is a list of
  // negatives. Spaced on both sides is subtraction; flush against its digit is a sign.
  //
  // And a hyphen joining a number to a WORD is a compound adjective, not arithmetic: the bank
  // ships `a regular 18-sided polygon`, which the first version read as "18 minus sided". So the
  // right-hand side has to look like an operand too - a number, a bracket, a root, or a lone
  // variable letter.
  s = s.replace(/(the square root of )\s*-\s*/g, '$1negative ')
    .replace(/([\d)])\s*-\s*(?=[\d(]|the square root|[a-z]\b)/g, '$1 minus ')
    .replace(/([A-Za-z,])\s+-\s+/g, '$1 minus ')
    .replace(/(^|\s|,)\s*-\s*/g, '$1 negative ')
    .replace(/\+/g, ' plus ');

  s = s.replace(/=\s*\?/g, ' equals what?')
    .replace(/≤/g, ' is less than or equal to ')
    .replace(/≥/g, ' is greater than or equal to ')
    .replace(/≠/g, ' is not equal to ')
    .replace(/</g, ' is less than ')
    .replace(/>/g, ' is greater than ')
    .replace(/=/g, ' equals ');

  // Ratios and division. A ratio colon is DIGITS ON BOTH SIDES (`6:11` is "6 is to 11") - the
  // looser `\w` version turned every `Solve for x: 10x + 25` stem in the bank into "solve for x
  // is to 10x plus 25". A bare slash between anything is "over", which covers both `4/9` and the
  // `(...) / 6` of the quadratic formula.
  s = s.replace(/(\d)\s*:\s*(?=\d)/g, '$1 is to ')
    .replace(/\s*\/\s*/g, ' over ');

  return s;
}

/** Verbal Analogies writes its pairs as `Ant : Insect`. Spaced on both sides, always - which is
 *  what separates it from Word Knowledge's stem-final `most nearly means:`. */
function fixAnalogy(text) {
  return text.replace(/(\w)\s+:\s+(?=\w)/g, '$1 is to ');
}

/**
 * One string, ready to hand to a synthesiser.
 * @param {string} text
 * @param {{ math?: boolean, analogy?: boolean }} opts  `math` turns on the notation pass - MK
 *   only; `analogy` turns on the `A : B` pair reading - VA only.
 */
export function spokenText(text, { math = false, analogy = false } = {}) {
  if (text == null) return '';
  let s = String(text)
    // Curly quotes and dashes: some voices pause oddly on them, and the bank has both (the
    // apostrophe in `commander’s` came in with the band-5 word rows).
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, ' - ');

  s = fixDesignators(s);
  if (math) s = fixMath(s);
  if (analogy) s = fixAnalogy(s);
  s = fixQuantities(s);
  s = fixCaps(s);

  // A semicolon is a full stop to a reader and a comma to a synthesiser; the bank uses it to
  // separate two independent statements in an option (`209; no real solutions`).
  s = s.replace(/;/g, '.');

  // Blank lines carry meaning in the bank - a WK context item is `sentence\n\nWORD most nearly
  // means:` - so they become a real sentence break rather than being collapsed into a space.
  // Only where the line above did not already end in one, or every context item reads
  // "...no room for follow-up questions.. curt most nearly means".
  s = s.replace(/([.?!])\s*\n\s*\n\s*/g, '$1 ').replace(/\n\s*\n/g, '. ').replace(/\n/g, ' ');

  // A trailing comma is left behind whenever an expression ENDS in a bracket - `13(m - 10)` reads
  // as "13 times the quantity m minus 10," and a synthesiser holds that pause before the next
  // option starts, which sounds like a dropped word.
  return s.replace(/\s+/g, ' ').replace(/\s+([,.?!])/g, '$1').replace(/,+$/, '').trim();
}

/**
 * Break a question into the utterances a run speaks, in order.
 *
 * SEGMENTED, NOT ONE STRING, for three reasons that all show up as "smoothness":
 *   1. the UI can highlight the option currently being read;
 *   2. a barge-in ("B") can be acted on the instant it is heard, without waiting out the rest;
 *   3. the synthesiser gets short utterances, which is what keeps a long RC item from hitting
 *      Chrome's ~15-second cutoff mid-sentence.
 *
 * @returns {{ kind: 'stem'|'option'|'note', index?: number, text: string }[]}
 */
export function speechFor(q, { includeOptions = true } = {}) {
  if (!q) return [];
  // TR takes the notation pass too - its stem is pure notation (`What value is at X = +2, Y = -1?`)
  // even though the ANSWER is a grid lookup no voice can help with.
  const opts = { math: q.subtest === 'MK' || q.subtest === 'TR', analogy: q.subtest === 'VA' };
  const out = [{ kind: 'stem', text: spokenText(q.stem, opts) }];

  if (q.render && q.render.kind !== 'passage') {
    // Said once, up front, so listening-only does not silently become guessing. The alternative -
    // reading the stem as though it were self-contained - is the one failure mode a voice feature
    // must not have.
    out.unshift({ kind: 'note', text: 'This question has a figure. Look at the screen.' });
  }

  if (!includeOptions) return out;

  if (q.optionRender) {
    out.push({ kind: 'note', text: `The ${q.choices.length} options are pictures. Look at the screen to choose.` });
    return out;
  }

  q.choices.forEach((c, i) => {
    out.push({ kind: 'option', index: i, text: `${LETTERS[i]}. ${spokenText(c, opts)}` });
  });
  return out;
}

/** The reading passage, as its own utterance list - one per printed line, so a long passage is
 *  many short utterances rather than one four-minute one that no engine reliably completes. */
export function passageSpeech(render) {
  if (!render || render.kind !== 'passage') return [];
  return String(render.text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => ({ kind: 'passage', index: i, text: spokenText(line) }));
}

// --- voice answers -------------------------------------------------------------------------

/**
 * Everything a spoken answer can sound like.
 *
 * The NATO alphabet is in here on purpose and is not a novelty: this is an Air Force officer
 * qualifying test, alpha/bravo/charlie is the phonetic set the candidate already uses, and it is
 * the single most reliably recognised way to say a letter - "B" and "D" and "E" are among the
 * worst-confused tokens in any recogniser, and "bravo" and "delta" are among the best.
 *
 * The homophones are not padding either. A recogniser hands back real words, so a spoken "B"
 * arrives as "be" or "bee", "C" as "see" or "sea", "D" as "dee", "A" as "eh" or "hey".
 */
const SPOKEN_LETTERS = {
  a: 0, ay: 0, eh: 0, hey: 0, alpha: 0, alfa: 0, first: 0, one: 0, 1: 0,
  b: 1, be: 1, bee: 1, bravo: 1, second: 1, two: 1, 2: 1,
  c: 2, see: 2, sea: 2, cee: 2, charlie: 2, third: 2, three: 2, 3: 2,
  d: 3, dee: 3, delta: 3, fourth: 3, four: 3, 4: 3,
  e: 4, ee: 4, echo: 4, fifth: 4, five: 4, 5: 4,
};

/** Words that only ever wrap an answer and never carry one. Stripped before matching so
 *  "I'll go with option C" reduces to "c". */
const FILLER = new Set([
  'the', 'answer', 'option', 'letter', 'choice', 'is', 'my', 'i', 'ill', 'll', 'go', 'with',
  'pick', 'choose', 'select', 'say', 'im', 'gonna', 'its', 'thats', 'uh', 'um', 'er', 'like',
  'lets', 'just', 'think', 'as', 'in', 'please', 'ok', 'okay', 'yeah',
]);

const COMMANDS = [
  ['repeat', /^(repeat|again|say (that )?again|read (it |that )?again|one more time|what)$/],
  ['options', /^(options|read (the )?options|choices|read (the )?choices)$/],
  ['passage', /^(passage|read (the )?passage|read (the )?text)$/],
  ['next', /^(next|forward|skip|move on|go on)$/],
  ['back', /^(back|previous|go back|last one)$/],
  ['flag', /^(flag|flag (it|this|question)|mark (it|this))$/],
  ['finish', /^(finish|end|done|end (the )?(drill|test)|im done)$/],
  ['undo', /^(undo|cancel|no|wait|nope|scratch that|never mind|nevermind)$/],
  ['stop', /^(stop|stop listening|quiet|mute|shut up|pause)$/],
];

const normalise = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/**
 * Turn one recognised utterance into an action.
 *
 * ORDER: commands before letters, because "no" is a command and "know" is not an option; letters
 * before option text, because "a" as a spoken letter must beat "a" appearing inside an option.
 *
 * AMBIGUITY IS AN ANSWER. Where two options both match the spoken text, this returns null rather
 * than picking one - a wrong auto-commit costs a scored question, and asking again costs a second.
 *
 * @param {string} transcript  raw text from the recogniser
 * @param {{ choices?: string[], count?: number }} ctx
 * @returns {{ kind: 'answer', index: number, via: string } | { kind: 'command', name: string } | null}
 */
export function matchUtterance(transcript, { choices = [], count = choices.length } = {}) {
  const raw = normalise(transcript);
  if (!raw) return null;

  for (const [name, re] of COMMANDS) {
    if (re.test(raw)) return { kind: 'command', name };
  }

  const words = raw.split(' ').filter((w) => !FILLER.has(w));

  // A bare letter, phonetic or ordinal. Accepted only when it is ALL that is left once the filler
  // words come off - "I'll go with option C" reduces to "c", while "a large dog" keeps three words
  // and falls through to the option-text match below. Allowing two would let the leading "a" of
  // any short answer register as choice A.
  if (words.length === 1) {
    for (const w of words) {
      const idx = SPOKEN_LETTERS[w];
      if (idx != null && idx < count) {
        const via = /^(alpha|alfa|bravo|charlie|delta|echo)$/.test(w) ? 'phonetic'
          : /^(one|two|three|four|five|first|second|third|fourth|fifth|[1-5])$/.test(w) ? 'ordinal'
            : 'letter';
        return { kind: 'answer', index: idx, via };
      }
    }
  }

  // The option itself, spoken. This is the natural thing to do on Word Knowledge - you say the
  // synonym, not the letter - and it is why `choices` is passed in rather than just a count.
  const spoken = words.join(' ');
  if (spoken.length >= 3) {
    const hits = [];
    choices.slice(0, count).forEach((c, i) => {
      const norm = normalise(c);
      if (!norm) return;
      if (norm === spoken || (norm.length >= 4 && (spoken.includes(norm) || norm.includes(spoken)))) hits.push(i);
    });
    if (hits.length === 1) return { kind: 'answer', index: hits[0], via: 'text' };
  }

  return null;
}
