// Every word gets the same chance of being asked.
//
// Trey, 2026-09-04: "Every word should be in the same database and they should all have the same
// chance of showing up. It should all be one bank. By band or something so if I want easier words
// I do an easier band."
//
// They did not have the same chance, for two structural reasons that had nothing to do with
// difficulty and everything to do with how the rows happened to be filed:
//
//   1. A drill dealt one slot per TEMPLATE, and a Word Knowledge template is a bag of words whose
//      size runs from 7 (wk-11-b4-syn) to 40 (wk-opposite-b2). A word in the small bag was 5.7x
//      more likely to be asked than one in the large bag.
//   2. A word is askable by however many FRAMES accept it - a sentence enables the context frame,
//      an antonym enables the opposite frame - so dealing (template, word) pairs still gave
//      `indolent` four tickets against `noisome`'s one.
//
// Both are fixed by dealing over DISTINCT WORD IDS and then choosing a frame from that word's own
// hosts. The band skew this removed was the visible one: band 2 words were being asked 20.9 times
// per 200 drills against band 5's 11.7, so the harder half of the bank - the half that matters -
// was systematically under-drilled.
//
// This is a statistical property, so it is asserted statistically. A uniform draw is Poisson, so
// the spread is compared against sqrt(mean) rather than to zero; demanding equal counts would
// fail on randomness alone.

import { describe, it, expect } from 'vitest';
import '../../templates/index.js';
import { assembleDrill } from '../drill.js';
import { allWords } from '../words.js';
import { getTemplate } from '../generator.js';
import { mulberry32 } from '../../../engine/rng';

const RUNS = 200;
const COUNT = 25;

function exposures(opts = {}) {
  const progress = { templateStats: {}, missPool: {} };
  const counts = new Map();
  for (let s = 0; s < RUNS; s++) {
    const qs = assembleDrill({ subtest: 'WK', count: COUNT, rng: mulberry32(s * 2654435761 + 7), progress, ...opts });
    for (const q of qs) {
      const w = q.vocab?.word?.toLowerCase();
      if (w) counts.set(w, (counts.get(w) || 0) + 1);
      const p = progress.templateStats[q.templateId] ?? { seen: 0, correct: 0, totalMs: 0 };
      progress.templateStats[q.templateId] = { ...p, seen: p.seen + 1 };
    }
  }
  // Measured over the REGISTRY, not over whatever turned up: a word that is never served has to
  // count as a zero, and it cannot do that if the population is "words that appeared".
  return allWords().map((w) => ({ ...w, n: counts.get(w.word.toLowerCase()) || 0 }));
}

describe('word exposure is uniform', () => {
  it('serves every word in the registry', () => {
    const seen = exposures();
    const never = seen.filter((s) => s.n === 0);
    expect(never.map((s) => s.word)).toEqual([]);
  });

  it('spreads no wider than randomness alone would', () => {
    const seen = exposures();
    const ns = seen.map((s) => s.n);
    const mean = ns.reduce((a, b) => a + b, 0) / ns.length;
    const sd = Math.sqrt(ns.reduce((a, b) => a + (b - mean) ** 2, 0) / ns.length);
    // A uniform (Poisson) draw has sd = sqrt(mean). Real bias shows up as sd well above that;
    // the old template-dealt selection sat at 6.4 against an expected 3.96. Allowing 1.5x leaves
    // room for sampling noise while still catching a return of structural bias.
    expect(sd).toBeLessThan(1.5 * Math.sqrt(mean));
  });

  it('does not favour easy bands over hard ones', () => {
    // The user-visible symptom. Band 2 has 40 words and band 4 has 100, so per-template dealing
    // handed a band-2 word far more airtime - the exact opposite of what a candidate aiming at
    // band 4-5 material needs.
    const seen = exposures();
    const byBand = new Map();
    for (const s of seen) {
      if (!byBand.has(s.band)) byBand.set(s.band, []);
      byBand.get(s.band).push(s.n);
    }
    const means = [...byBand.entries()].map(([band, ns]) => ({ band, mean: ns.reduce((a, b) => a + b, 0) / ns.length }));
    const lo = Math.min(...means.map((m) => m.mean));
    const hi = Math.max(...means.map((m) => m.mean));
    expect(means.length).toBeGreaterThan(1);
    // Was 20.9 vs 11.7 - a 1.79x gap. Under 1.25x is "the same, allowing for noise".
    expect(hi / lo, means.map((m) => `b${m.band}=${m.mean.toFixed(1)}`).join(' ')).toBeLessThan(1.25);
  });
});

describe('band is the difficulty control', () => {
  it('restricts a drill to templates of the requested band', () => {
    // The contract `bands` actually promises, and the one the difficulty picker relies on. Note
    // it is about the QUESTION's band, not the headword's: `wk-root-loqu` is a band-3 question
    // ("which word is built on a root meaning 'to speak'?") that happens to use `loquacious` as
    // an example, while the band-4 registry row asks what loquacious MEANS. Two different
    // skills, legitimately banded apart, so asserting on the word's band would be wrong.
    for (const band of [2, 3, 4, 5]) {
      const qs = assembleDrill({ subtest: 'WK', count: 25, rng: mulberry32(band * 31 + 1), bands: [band] });
      expect(qs.length).toBeGreaterThan(0);
      const bands = new Set(qs.map((q) => getTemplate(q.templateId)?.band).filter((b) => b != null));
      expect([...bands], `band ${band} drill leaked other bands`).toEqual([band]);
    }
  });

  it('each band can actually fill a full-length drill', () => {
    // A difficulty the user can select has to be able to serve a real run. If a band's pool were
    // too thin the picker would silently hand back a short drill.
    for (const band of [2, 3, 4, 5]) {
      const qs = assembleDrill({ subtest: 'WK', count: 25, rng: mulberry32(band * 7919), bands: [band] });
      expect(qs, `band ${band} could not fill 25`).toHaveLength(25);
    }
  });
});
