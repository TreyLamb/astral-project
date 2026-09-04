// Speech tests.
//
// Every case below is a REAL string the generator emits, and most of them are here because the
// first implementation got them wrong and the only thing that caught it was reading the output
// aloud. `afoqt:selftest` proves a question is well-formed and says nothing about whether it is
// well-SPOKEN, so this file is the standing version of that reading pass.

import { describe, it, expect } from 'vitest';
import '../../templates/index.js';
import { allTemplates, generateInstance } from '../generator.js';
import {
  spokenText, speechFor, passageSpeech, matchUtterance, isGeometryLabel, isSpeakable, SPEAKABILITY,
} from '../speech.js';

const math = (s) => spokenText(s, { math: true });

describe('spokenText - math notation', () => {
  it('reads operators a synthesiser would otherwise drop', () => {
    expect(math('11 + 7(12 - 8)^2 = ?'))
      .toBe('11 plus 7 times the quantity 12 minus 8, squared equals what?');
  });

  it('distinguishes subtraction from a negative sign', () => {
    // The bug that shipped first: signs ran after the comparison operators, so every `a - b`
    // became "a negative b".
    expect(math('12 - 8')).toBe('12 minus 8');
    expect(math('x < -52')).toBe('x is less than negative 52');
    expect(math('-23/90')).toBe('negative 23 over 90');
  });

  it('keeps a hyphenated word out of the arithmetic', () => {
    expect(math('the x-coordinate of the vertex')).toBe('the x-coordinate of the vertex');
    expect(math('a regular 18-sided polygon')).toBe('a regular 18-sided polygon');
  });

  it('reads a mixed number as a mixed number', () => {
    expect(math('2 1/5 x 4 3/5 = ?')).toBe('2 and 1 over 5 times 4 and 3 over 5 equals what?');
  });

  it('reads function application as "of", not as multiplication', () => {
    expect(math('If f(x) = 5x - 7, what is f(-6)?'))
      .toBe('If f of x equals 5 x minus 7, what is f of negative 6?');
    expect(math('what is f(g(6))?')).toBe('what is f of g of 6?');
  });

  it('keeps brackets balanced when an exponent sits inside one', () => {
    // `\)?` on the exponent pattern used to eat the closing bracket of the enclosing expression.
    const said = math('(7x^3)(8x^6)');
    expect(said).toBe('the quantity 7 x cubed, times the quantity 8 x to the power of 6');
    expect(said).not.toContain('(');
  });

  it('reads a negative exponent as negative, not as a subtraction', () => {
    expect(math('7x^-5')).toBe('7 x to the power of negative 5');
  });

  it('leaves an English aside as an aside', () => {
    // A bracket with no arithmetic in it is prose, and "the quantity co-interior" is nonsense.
    expect(math('its same-side interior (co-interior) angle'))
      .toBe('its same-side interior, co-interior, angle');
  });

  it('handles radicals, absolute values and the quadratic formula', () => {
    expect(math('|15 - 27| - |9 - 22| = ?'))
      .toBe('the absolute value of 15 minus 27, minus the absolute value of 9 minus 22, equals what?');
    expect(math('19√8')).toBe('19 the square root of 8');
    expect(math('(7 ± √-47) / 6'))
      .toBe('the quantity 7 plus or minus the square root of negative 47, over 6');
  });

  it('reads a numeric ratio but never a prose colon', () => {
    expect(math('in the ratio 6:11')).toBe('in the ratio 6 is to 11');
    expect(math('Solve for x: 10x + 25')).toBe('Solve for x: 10 x plus 25');
  });
});

describe('spokenText - quantities and capitals', () => {
  it('speaks money as money', () => {
    expect(spokenText('$580.00')).toBe('580 dollars');
    expect(spokenText('$3402.63')).toBe('3402 dollars and 63 cents');
    expect(spokenText('$1.75')).toBe('1 dollar and 75 cents');
  });

  it('agrees the noun after a degree measurement', () => {
    expect(spokenText('a 64° angle')).toBe('a 64 degree angle');
    expect(spokenText('75° and 68°')).toBe('75 degrees and 68 degrees');
  });

  it('lowercases an emphasised or tested word so it is not spelled out', () => {
    // Left alone, most engines read BENEVOLENT as B-E-N-E-V-O-L-E-N-T, which makes a Word
    // Knowledge item unanswerable by ear.
    expect(spokenText('BENEVOLENT most nearly means:')).toBe('benevolent most nearly means:');
    expect(spokenText('How much INTEREST is earned?')).toBe('How much interest is earned?');
  });

  it('keeps a real acronym and spells a geometry label', () => {
    expect(spokenText('the ILS glideslope')).toBe('the ILS glideslope');
    expect(spokenText('Triangle ABC is similar to triangle DEF.'))
      .toBe('Triangle A B C is similar to triangle D E F.');
  });

  it('separates the letters of an aircraft designator', () => {
    expect(spokenText('the C-17 Globemaster III')).toBe('the C 17 Globemaster three');
  });

  it('does not double a full stop at a paragraph break', () => {
    expect(spokenText('His curt reply left no room.\n\nCURT most nearly means:'))
      .toBe('His curt reply left no room. curt most nearly means:');
  });

  it('reads a Verbal Analogies pair as a pair', () => {
    expect(spokenText('Ant : Insect', { analogy: true })).toBe('Ant is to Insect');
  });
});

describe('isGeometryLabel', () => {
  it('accepts the labels the bank actually uses', () => {
    for (const t of ['AB', 'BC', 'DE', 'EF', 'ABC', 'DEF']) expect(isGeometryLabel(t)).toBe(true);
  });

  it('rejects every all-caps English word in the bank', () => {
    // The whole point of the ascending-letters rule: these are emphasis or headwords, not labels.
    for (const t of ['OAK', 'ANT', 'CAT', 'ARM', 'ADD', 'BIG', 'AREA', 'FACE', 'BASE', 'HALF']) {
      expect(isGeometryLabel(t)).toBe(false);
    }
  });
});

describe('speechFor', () => {
  it('warns before reading a question whose answer is a picture', () => {
    const q = { subtest: 'BC', stem: 'How many other blocks does block 2 touch?', choices: ['2', '3'], render: { kind: 'blocks' } };
    expect(speechFor(q)[0].text).toMatch(/has a figure/);
  });

  it('never reads picture options aloud', () => {
    const q = {
      subtest: 'IC',
      stem: 'Which aircraft is in the position shown?',
      choices: ['banked right, climbing', 'level'],
      optionRender: [{}, {}],
    };
    const said = speechFor(q);
    expect(said.some((s) => s.kind === 'option')).toBe(false);
    expect(said.at(-1).text).toMatch(/pictures/);
  });

  it('labels each option with its letter', () => {
    const q = { subtest: 'WK', stem: 'CURT', choices: ['Colorful', 'Abrupt'] };
    const opts = speechFor(q).filter((s) => s.kind === 'option');
    expect(opts.map((o) => o.text)).toEqual(['A. Colorful', 'B. Abrupt']);
    expect(opts.map((o) => o.index)).toEqual([0, 1]);
  });

  it('can be asked for the stem alone', () => {
    const q = { subtest: 'WK', stem: 'CURT', choices: ['Colorful', 'Abrupt'] };
    expect(speechFor(q, { includeOptions: false })).toHaveLength(1);
  });
});

describe('passageSpeech', () => {
  it('splits a passage into one utterance per line', () => {
    // Short utterances are the defence against Chrome's ~15s cutoff - a dropped segment costs one
    // line rather than the rest of the passage.
    const said = passageSpeech({ kind: 'passage', text: 'One line.\nTwo lines.\n\nThree.' });
    expect(said.map((s) => s.text)).toEqual(['One line.', 'Two lines.', 'Three.']);
    expect(said.every((s) => s.kind === 'passage')).toBe(true);
  });

  it('returns nothing for a figure that is not a passage', () => {
    expect(passageSpeech({ kind: 'table' })).toEqual([]);
  });
});

describe('matchUtterance', () => {
  const ctx = { choices: ['Colorful', 'Abrupt', 'Gracious', 'Present', 'Impatient'] };

  it('takes a bare letter', () => {
    expect(matchUtterance('B', ctx)).toEqual({ kind: 'answer', index: 1, via: 'letter' });
  });

  it('takes the homophones a recogniser actually returns', () => {
    // A spoken "B" comes back as "be" or "bee"; "C" as "see" or "sea". Rejecting those is the
    // main reason a naive implementation feels broken.
    for (const [said, index] of [['bee', 1], ['be', 1], ['see', 2], ['sea', 2], ['dee', 3], ['eh', 0]]) {
      expect(matchUtterance(said, ctx)).toMatchObject({ kind: 'answer', index });
    }
  });

  it('takes the NATO alphabet', () => {
    expect(matchUtterance('delta', ctx)).toEqual({ kind: 'answer', index: 3, via: 'phonetic' });
    expect(matchUtterance('charlie', ctx)).toEqual({ kind: 'answer', index: 2, via: 'phonetic' });
  });

  it('strips the words people wrap an answer in', () => {
    expect(matchUtterance("I'll go with option C", ctx)).toMatchObject({ index: 2 });
    expect(matchUtterance('the answer is delta', ctx)).toMatchObject({ index: 3 });
  });

  it('takes the option itself, spoken', () => {
    expect(matchUtterance('abrupt', ctx)).toEqual({ kind: 'answer', index: 1, via: 'text' });
  });

  it('refuses an ambiguous utterance rather than guessing', () => {
    // Committing on a coin-flip costs a scored question; asking again costs a second.
    const ambiguous = { choices: ['a large dog', 'a large cat'] };
    expect(matchUtterance('a large', ambiguous)).toBe(null);
  });

  it('never reads an answer out of a sentence that merely contains one', () => {
    expect(matchUtterance('a pilot flies the aircraft', ctx)).toBe(null);
  });

  it('will not offer a letter the question does not have', () => {
    // Instrument Comprehension has four options, not five.
    expect(matchUtterance('echo', { choices: ['w', 'x', 'y', 'z'] })).toBe(null);
  });

  it('recognises the commands', () => {
    for (const [said, name] of [
      ['repeat', 'repeat'], ['say that again', 'repeat'], ['next', 'next'], ['go back', 'back'],
      ['flag this', 'flag'], ['finish', 'finish'], ['no', 'undo'], ['stop listening', 'stop'],
      ['read the options', 'options'], ['read the passage', 'passage'],
    ]) {
      expect(matchUtterance(said, ctx)).toEqual({ kind: 'command', name });
    }
  });

  it('ignores silence and noise', () => {
    expect(matchUtterance('', ctx)).toBe(null);
    expect(matchUtterance('   ', ctx)).toBe(null);
  });
});

describe('the whole bank is speakable without producing garbage', () => {
  const codes = [...new Set(allTemplates().map((t) => t.subtest))];

  it('declares a speakability level for every subtest that has templates', () => {
    for (const code of codes) expect(SPEAKABILITY[code], `no SPEAKABILITY for ${code}`).toBeTruthy();
  });

  it('marks the figure subtests unspeakable and nothing else', () => {
    expect(codes.filter((c) => !isSpeakable(c)).sort()).toEqual(['BC', 'IC', 'TR']);
  });

  it('leaves no unspoken notation in any generated question', () => {
    // A character from this set surviving into the spoken text means a synthesiser will either
    // skip it silently or spell it - both of which change what the question asks.
    const leftovers = /[\^√π±|<>%$°×÷]/;
    const bad = [];
    for (const t of allTemplates()) {
      for (let i = 0; i < 6; i++) {
        let q;
        try { q = generateInstance(t.id, (i + 1) * 7919); } catch { continue; }
        if (!q) continue;
        for (const seg of speechFor(q)) {
          if (leftovers.test(seg.text)) bad.push(`${t.id}: ${seg.text}`);
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('never leaves an unbalanced bracket behind', () => {
    const bad = [];
    for (const t of allTemplates()) {
      const q = generateInstance(t.id, 7919);
      if (!q) continue;
      for (const seg of speechFor(q)) {
        const opens = (seg.text.match(/\(/g) ?? []).length;
        const closes = (seg.text.match(/\)/g) ?? []).length;
        if (opens !== closes) bad.push(`${t.id}: ${seg.text}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('never runs two words together where a symbol used to be', () => {
    // `19√8` became "19the square root of 8" and `14x^3(4x+8)` became "14 x cubedthe quantity".
    const bad = [];
    for (const t of allTemplates()) {
      const q = generateInstance(t.id, 7919);
      if (!q) continue;
      for (const seg of speechFor(q)) {
        if (/\d(?:the|minus|plus|times|over|squared|cubed)\b/.test(seg.text)) bad.push(`${t.id}: ${seg.text}`);
        if (/(?:cubed|squared|quantity|pi)the\b/.test(seg.text)) bad.push(`${t.id}: ${seg.text}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});
