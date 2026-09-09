// npm run afoqt:words-lint [-- src/.../wk/pool-09.js ...]
//
// Batch linter for Word Knowledge word rows. `registerWords()` in engine/words.js already
// enforces most of this, but it THROWS on the first bad row, so authoring a 30-word batch turns
// into thirty edit-run cycles. This reports every violation in every file at once.
//
// It also carries one check registerWords cannot: **a sentence that contains one of its own
// options**. The context frame (`wk-*-ctx`) prints the sentence and the five options together,
// so a sentence containing the answer hands the item over, and one containing a distractor
// makes a wrong option look supported. Six rows in the pre-2026-09-09 bank had this.
//
// What it CANNOT check is the semantic half - a `related` distractor that is simply another
// correct answer (SACROSANCT: "inviolable" and "holy"). Nothing mechanical sees that. Read the
// slates. See docs/afoqt/WORD-BANK-EXPANSION.md.
//
// Only files that call registerWords are parsed; wk/ch04-confusables.js uses registerPairs and
// has a different row shape, so it is skipped rather than reported as 20 parse failures.

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DIR = 'src/pages/theknowledgebase/afoqt/templates/wk';

// Mirrors of engine/words.js. Kept as copies on purpose: this script runs before a row is
// registered, over source text rather than over objects. If the engine's rules change, change
// them here too - the engine stays the authority, this is the early-warning pass.
const POS_SUFFIX = [
  { re: /(ness|ity|tion|sion|ment|ance|ence)$/, pos: 'noun' },
  { re: /ly$/, pos: 'adv' },
];
const LY_ADJECTIVES = new Set(['unruly', 'friendly', 'orderly', 'lonely', 'lovely', 'lively', 'costly', 'timely', 'surly', 'burly', 'wily', 'homely', 'ghastly', 'ugly', 'deadly', 'elderly', 'cowardly', 'worldly', 'scholarly', 'miserly', 'portly', 'stately', 'kindly', 'silly', 'holy', 'jolly', 'oily', 'early', 'likely', 'unlikely', 'motley', 'princely', 'saintly', 'sickly', 'steely', 'wobbly', 'grisly', 'gnarly', 'seemly', 'unseemly', 'manly', 'godly', 'curly', 'crumbly', 'prickly', 'gangly', 'knobbly', 'courtly', 'comely']);
const COMMON_VERBS = new Set(['ponder', 'think', 'thrive', 'wane', 'wax', 'scold', 'praise', 'condemn', 'rebuke', 'flatter', 'hesitate', 'linger', 'wander', 'ramble', 'boast', 'mock', 'soothe', 'worsen', 'lessen', 'weaken', 'strengthen', 'delay', 'hasten', 'reveal', 'conceal', 'forgive', 'refuse', 'accept', 'destroy', 'build', 'gather', 'scatter', 'shrink', 'expand', 'endure', 'yield', 'resist', 'pretend', 'confess', 'quibble', 'squander', 'hoard', 'placate', 'provoke', 'deceive', 'wither', 'flourish', 'meander', 'chastise', 'admonish', 'extol', 'deride', 'berate']);

const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordCount = (v) => String(v).trim().split(/\s+/).length;

function suffixPos(option) {
  const o = norm(option);
  if (LY_ADJECTIVES.has(o)) return 'adj';
  if (COMMON_VERBS.has(o)) return 'verb';
  for (const { re, pos } of POS_SUFFIX) if (re.test(o)) return pos;
  return null;
}

function looksLikeHeadword(word, option) {
  const w = norm(word);
  const o = norm(option);
  if (o.includes(w) || w.includes(o)) return true;
  const n = Math.min(6, w.length, o.length);
  return n >= 6 && w.slice(0, n) === o.slice(0, n);
}

const field = (block, name) => {
  const single = block.match(new RegExp(name + ":\\s*'([^']*)'"));
  if (single) return single[1];
  const double = block.match(new RegExp(name + ':\\s*"([^"]*)"'));
  return double ? double[1] : null;
};

/**
 * Does the sentence contain this option?
 *
 * Matched on a WORD BOUNDARY against a shortened stem, so "temporary duty" is caught for the
 * option "temporary" and "divided" for the option "divide" - but the option's letters appearing
 * INSIDE another word are not a hit. Two false positives made that necessary: "au(ster)e"
 * against the option `stern`, and "s(urge)on" against the option `urgent`. Matches falling
 * inside the headword itself are also ignored, since the headword is supposed to be there.
 */
function sentenceCarries(sentence, option, headword) {
  const head = String(option).trim().split(/\s+/)[0];
  if (head.length < 4) return false;
  const stem = head.slice(0, Math.max(4, head.length - 2));
  const re = new RegExp('\\b' + esc(stem), 'gi');
  const headRe = new RegExp('\\b' + esc(headword.slice(0, Math.max(4, headword.length - 3))), 'i');
  for (const m of sentence.matchAll(re)) {
    const token = sentence.slice(m.index).match(/^[A-Za-z'-]+/)?.[0] ?? '';
    if (headRe.test(token)) continue;   // it is the headword, which belongs there
    return true;
  }
  return false;
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : fs.readdirSync(DEFAULT_DIR).filter((f) => f.endsWith('.js')).map((f) => path.join(DEFAULT_DIR, f));

let problems = 0;
let rows = 0;
let skipped = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const short = path.basename(file);
  if (!src.includes('registerWords(')) { skipped++; continue; }

  for (const block of src.split(/\r?\n {2}\{\r?\n/).slice(1)) {
    const word = field(block, 'word');
    if (!word) continue;
    rows++;
    const answer = field(block, 'answer');
    const antonym = field(block, 'antonym');
    const related = field(block, 'related');
    const decoy = field(block, 'decoy');
    const pos = field(block, 'pos');
    const sentence = field(block, 'sentence');
    const cm = block.match(/confusable:\s*\{\s*word:\s*'([^']*)',\s*meaning:\s*'([^']*)'/);
    const confusableWord = cm ? cm[1] : null;
    const trap = cm ? cm[2] : null;

    const say = (msg) => { console.log(`  ${short}  ${word}: ${msg}`); problems++; };
    const slate = [answer, trap, antonym, related, decoy];
    if (slate.some((v) => v == null)) { say('a slate field did not parse'); continue; }

    const seen = new Set();
    for (const v of slate) {
      if (seen.has(norm(v))) say(`duplicate option "${v}"`);
      seen.add(norm(v));
      if (looksLikeHeadword(word, v)) say(`option "${v}" gives away the headword`);
    }
    if (confusableWord && norm(confusableWord) === norm(word)) say('confusable is the headword itself');

    const longest = Math.max(...[antonym, related, decoy].map(wordCount));
    if (wordCount(trap) >= longest + 2) {
      say(`trap "${trap}" is ${wordCount(trap)} words against a longest-other of ${longest}`);
    }

    const answerPos = suffixPos(answer) ?? pos;
    for (const v of [trap, antonym, related, decoy]) {
      const p = suffixPos(v);
      if (p && p !== answerPos) say(`option "${v}" reads as ${p}, answer "${answer}" reads as ${answerPos}`);
    }

    // NOT CHECKED: whether the gloss names one of its own wrong options. It was tried and
    // removed on 2026-09-09 - it fired on 40+ rows and was right about roughly three of them.
    // A gloss legitimately names its own antonym all the time ("dormant: temporarily inactive,
    // but able to become ACTIVE again"), and unlike the sentence, the gloss NEVER appears
    // beside the options during a question - it is explanation-and-card-back text only, where
    // naming the opposite is helpful rather than leaky. The real defect it was chasing is a
    // gloss that DEFINES the headword using a word it then marks wrong (`expedient` glossed
    // "convenient and practical" with *practical* as a distractor), and telling that apart from
    // a contrast clause is a judgement, not a regex. Read the slates instead.

    if (sentence) {
      const stem = word.slice(0, Math.max(4, word.length - 3));
      if (!new RegExp(esc(stem), 'i').test(sentence)) say('sentence does not contain the headword');
      for (const v of slate) {
        if (sentenceCarries(sentence, v, word)) say(`sentence contains option "${v}"`);
      }
    }
  }
}

const tail = skipped ? ` (${skipped} file(s) skipped - no registerWords)` : '';
console.log(problems ? `\n${rows} rows, ${problems} problem(s)${tail}` : `\n${rows} rows, clean${tail}`);
process.exit(problems ? 1 : 0);
