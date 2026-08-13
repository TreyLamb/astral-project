// Turns a sitting into something a speech engine can read aloud.
//
// Two problems this file exists to solve:
//
// 1. A TTS engine reading "zemsemchit" applies English spelling rules and says
//    something that is not the word. Respelling maps each generated sound onto
//    an English grapheme that reads unambiguously, so what the test-taker hears
//    is the word the answer key expects.
//
// 2. Stress items are unanswerable if the engine does not actually STRESS a
//    syllable. Web Speech ignores SSML emphasis almost everywhere, so a word
//    that must be heard with audible stress is emitted as per-syllable segments
//    carrying their own rate/pitch/volume, and the voice layer plays them back
//    to back. Slightly more mechanical than a single utterance — and the only
//    way the item measures what it claims to.
//
// Everything here consumes SYLLABLE STRUCTURE, never a flat string. A flat
// string does not determine its own syllable boundaries — "ongoso" is both
// on-go-so and o-ngo-so and nothing in the spelling picks between them — so an
// earlier version that re-parsed the string disagreed with the generator on
// half of all words, which would have put audible stress on the wrong syllable
// in half of all stress items. Items carry `spokenWords`; the brief's
// vocabulary carries `syllables`. Neither is optional.

import { stressIndex } from './phonology.js';
import { poolItems } from './buildTest.js';

// Chosen so an English-tuned engine lands on the intended vowel. These are
// spellings, not IPA — the target is "what makes the synthesiser say it right".
const VOWEL_RESPELL = {
  a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo',
  ai: 'eye', au: 'ow', ei: 'ay', ou: 'oh',
};

/** @param {import('./phonology.js').Syllable} syl */
export function respellSyllable(syl) {
  const nucleus = VOWEL_RESPELL[syl.nucleus] || syl.nucleus;
  return `${syl.onset}${nucleus}${syl.coda}`;
}

/**
 * @param {import('./phonology.js').Syllable[]} syllables
 * @returns {string} a spelling an English-tuned TTS engine reads correctly
 */
export function respell(syllables) {
  return syllables.map(respellSyllable).join('-');
}

/**
 * Segments for a word that must be heard WITH its stress. The stressed syllable
 * is slower, higher and louder — the three cues a listener actually uses.
 * @param {import('./phonology.js').Syllable[]} syllables
 * @param {import('./phonology.js').Phonology} phon
 * @returns {{text: string, rate: number, pitch: number, volume: number}[]}
 */
export function stressedSegments(syllables, phon) {
  const idx = stressIndex(syllables, phon);
  return syllables.map((syl, i) => (
    i === idx
      ? { text: respellSyllable(syl), rate: 0.7, pitch: 1.3, volume: 1 }
      : { text: respellSyllable(syl), rate: 0.95, pitch: 0.9, volume: 0.7 }
  ));
}

/**
 * The constructed-language text an item speaks, respelled word by word. Word
 * boundaries become commas so the engine pauses between words instead of
 * running a sentence together into one unparseable blur.
 * @param {object} item
 * @returns {string}
 */
export function spokenTextFor(item) {
  if (!item.spokenWords?.length) return item.spoken || '';
  return item.spokenWords.map(respell).join(', ');
}

/**
 * Per-syllable prosody for an item that must be HEARD with its stress. Only
 * single-word stimuli get this; a whole sentence read syllable by syllable is
 * unlistenable, and no item asks for stress on a sentence.
 * @param {object} item
 * @param {import('./language.js').Language} lang
 * @returns {{text: string, rate: number, pitch: number, volume: number}[]|null}
 */
export function stressedSegmentsFor(item, lang) {
  if (item.type !== 'stress') return null;
  if (item.spokenWords?.length !== 1) return null;
  return stressedSegments(item.spokenWords[0], lang.phon);
}

const PAUSE = { short: 400, medium: 900, long: 1600 };

/**
 * The full read-aloud script for a sitting.
 *
 * Returned as ordered segments rather than one blob so the player can pace
 * them, let the test-taker replay a single item, and stop cleanly — and so the
 * exported text version has the same structure the audio does.
 *
 * @param {object} test
 * @returns {object[]}
 */
export function buildAudioScript(test) {
  const out = [];
  const push = (kind, text, pauseAfter = PAUSE.short, extra = {}) => out.push({ kind, text, pauseAfter, ...extra });

  const items = poolItems(test, 'audio');
  const { brief, markers } = test;

  push('title', `D.L.A.B. practice drill. Language code ${test.seedCode.split('').join(' ')}.`, PAUSE.long);
  push('instruction', `This drill has ${items.length} spoken questions. You will hear the rules of an invented language, then a set of questions about it. Write your answer to each one. Nothing is multiple choice — you must produce every answer yourself.`, PAUSE.long);

  push('heading', 'First, the rules of the language. Listen carefully — they are different every time.', PAUSE.medium);
  for (const section of brief.sections) {
    if (section.ruleId === 'vocabulary') continue;
    push('rule', `${section.title}. ${section.body}`, PAUSE.medium, { ruleId: section.ruleId });
  }

  push('heading', 'Now the word list. Each word is given in English first, then in the language, twice.', PAUSE.medium);
  for (const v of brief.vocabulary) {
    const spoken = v.syllables ? respell(v.syllables) : v.form;
    push('vocab', `${v.meaning}.`, PAUSE.short, { meaning: v.meaning, speak: `${spoken}. ${spoken}.` });
  }

  if (markers.length) {
    push('heading', 'And the grammatical markers.', PAUSE.medium);
    for (const m of markers) push('marker', `${m.label}: ${m.form}.`, PAUSE.short);
  }

  push('heading', `That is the whole language. The ${items.length} questions begin now.`, PAUSE.long);

  for (const it of items) {
    push('question', `Question ${it.index}. ${stripVisualCues(it.prompt)}`, PAUSE.medium, { itemId: it.id });
    if (it.spoken) {
      push('stimulus', spokenTextFor(it), PAUSE.long, { itemId: it.id, isStimulus: true, plain: it.spoken });
    }
    push('pause', '', PAUSE.long, { itemId: it.id, isAnswerGap: true });
  }

  push('heading', 'That is the end of the drill.', PAUSE.long);
  return out;
}

// Prompts are written for a screen. Read aloud, "\n\n    kalu ___ tomi" is
// noise, and a reference to a picture is worse than noise.
function stripVisualCues(prompt) {
  return prompt
    .replace(/\n+/g, ' ')
    .replace(/_{2,}/g, 'blank')
    .replace(/\s{2,}/g, ' ')
    .replace(/CAPITAL LETTERS/g, 'capital letters')
    .trim();
}

/**
 * The audio script as plain text, for the export panel and for pasting into an
 * external TTS tool.
 * @param {object} test
 * @returns {string}
 */
export function audioScriptToText(test) {
  const lines = [
    'DLAB PRACTICE DRILL — AUDIO SCRIPT',
    `Language code: ${test.seedCode}`,
    `Audio questions: ${poolItems(test, 'audio').length}`,
    '',
    'Read aloud at a steady pace. Where a line shows a word in the invented',
    'language, the bracketed spelling after it is how to pronounce it.',
    '',
    '---',
    '',
  ];
  for (const seg of buildAudioScript(test)) {
    if (seg.kind === 'pause') {
      lines.push('    [pause for the answer]', '');
      continue;
    }
    if (seg.kind === 'heading' || seg.kind === 'title') lines.push('', seg.text, '');
    else if (seg.speak) lines.push(`${seg.text}  ${seg.speak}`);
    else if (seg.plain) lines.push(`    ${seg.plain}   [say: ${seg.text}]`);
    else lines.push(seg.text);
  }
  return lines.join('\n');
}

export { PAUSE };
