import { describe, it, expect } from 'vitest';
import REAL from '../../data/realQuestions.json';
import { bankItems } from '../bank.js';
import { splitFusedChoice } from '../../../../../../scripts/oattsText.mjs';

// Why this file exists.
//
// 23 of the 89 official OATTS items shipped with their entire solution walkthrough glued onto
// the last answer choice. Option E of the OBSTINATE item read "Honest Step 1: Read the word
// carefully... 'Stubborn' is perfect." - 432 characters that both named the answer and made the
// tool look broken. Every one of those items also had `explanation: null`, because the text that
// should have become the explanation was sitting in the choice instead.
//
// The parser was ALREADY FIXED for this. `splitFusedChoice` existed, was correct, and was
// exported - but nothing imported it and nothing tested it, and the committed bank was never
// regenerated. So the fix had no effect on anything that shipped, and repeated reviews of "the
// engine" found nothing because the defect was in DATA, which nothing asserted against.
//
// The lesson is the one this folder already learned about generated questions and had not
// applied to static ones: structural checks must run over what SHIPS, not over the code that
// produces it.

const choicesOf = (q) => (q.choices ?? []).map((c) => c.text);

describe('the shipped OATTS bank', () => {
  it('has no solution walkthrough fused into an answer choice', () => {
    const fused = [];
    for (const q of REAL) {
      for (const c of q.choices ?? []) {
        const [, why] = splitFusedChoice(c.text);
        if (why) fused.push(`${q.id} option ${c.label}: ${why.slice(0, 60)}...`);
      }
    }
    expect(fused).toEqual([]);
  });

  // The fused text always named the correct answer, which is the part that actually costs a
  // practice question its value - you can pick the right one without knowing the word.
  it('never prints the correct answer inside a wrong choice', () => {
    const leaks = [];
    for (const q of REAL) {
      if (!q.choices || !q.answer || String(q.answer).length < 4) continue;
      const answer = String(q.answer).toLowerCase();
      for (const c of q.choices) {
        if (c.label === q.correct) continue;
        if (String(c.text).toLowerCase().includes(answer)) leaks.push(`${q.id} option ${c.label}`);
      }
    }
    expect(leaks).toEqual([]);
  });

  // A Word Knowledge option is one word. An Arithmetic Reasoning option is a number with a unit.
  // Nothing in either subtest is a paragraph, so length alone separates a real option from
  // absorbed prose - and it catches shapes of corruption the marker regex does not know about.
  it('has no answer choice long enough to be absorbed prose', () => {
    const long = [];
    for (const q of REAL) {
      for (const c of q.choices ?? []) {
        const limit = q.subtest === 'WK' || q.subtest === 'AR' || q.subtest === 'MK' ? 60 : 200;
        if (String(c.text).length > limit) long.push(`${q.id} ${c.label} (${c.text.length} chars)`);
      }
    }
    expect(long).toEqual([]);
  });

  it('gives every Word Knowledge item a stem that asks something', () => {
    // A bare "OBSTINATE" on screen is a word and five adjectives with no question attached.
    const bare = bankItems('WK')
      .filter((q) => q.provenance?.kind === 'real')
      .filter((q) => q.stem.trim().split(/\s+/).length < 2)
      .map((q) => q.stem);
    expect(bare).toEqual([]);
  });

  it('keeps every item answerable: the correct letter exists among the choices', () => {
    const broken = REAL
      .filter((q) => q.choices && q.correct)
      .filter((q) => !q.choices.some((c) => c.label === q.correct))
      .map((q) => q.id);
    expect(broken).toEqual([]);
  });

  it('has no duplicate option text within one item', () => {
    const dupes = [];
    for (const q of REAL) {
      const texts = choicesOf(q).map((t) => String(t).trim().toLowerCase());
      if (new Set(texts).size !== texts.length) dupes.push(q.id);
    }
    expect(dupes).toEqual([]);
  });
});

// A guard that has never rejected anything is indistinguishable from a dead one, so these run the
// checks against the exact corrupt strings that shipped.
describe('the guards actually reject the corruption they were written for', () => {
  const CORRUPT_E =
    "Honest Step 1: Read the word carefully. Avoid mixing obstinate and ostentatious. " +
    "Step 2: Try to recall the meaning immediately. Recall: refusing to change opinion or behavior. " +
    "Step 5: Choose the best synonym, not just a related word. Stubborn is perfect.";

  it('splits a fused Step-N walkthrough off the option', () => {
    const [opt, why] = splitFusedChoice(CORRUPT_E);
    expect(opt).toBe('Honest');
    expect(why).toMatch(/^Step 1:/);
  });

  it('splits the other three separators seen in the source PDFs', () => {
    expect(splitFusedChoice('7,250 Solution Walkthrough: First find the rate.')[0]).toBe('7,250');
    expect(splitFusedChoice('48 in2 Walkthrough: Area of a triangle is half.')[0]).toBe('48 in2');
    expect(splitFusedChoice('Airplane D The correct answer is D. Based on the compass')[0]).toBe('Airplane D');
  });

  it('leaves a clean option untouched', () => {
    expect(splitFusedChoice('Stubborn')).toEqual(['Stubborn', null]);
    expect(splitFusedChoice('30 feet')).toEqual(['30 feet', null]);
  });

  it('the length guard would have flagged the shipped option E', () => {
    expect(CORRUPT_E.length).toBeGreaterThan(60);
  });
});
