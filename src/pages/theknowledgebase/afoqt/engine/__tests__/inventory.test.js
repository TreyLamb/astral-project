import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../../templates/index.js';
import { DRILLABLE } from '../afoqtSpec.js';
import { subtestInventory, nonRepeatingRuns, depthVerdict } from '../inventory.js';
import { askableWords, allWords } from '../words.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSV = path.join(HERE, '..', '..', 'data', 'wordCandidates.csv');

/**
 * These tests exist because of a trust problem, not a correctness problem.
 *
 * Trey, 2026-09-11: "i keep getting told by other agents that the text bank is only like 500+
 * words when before i was told it would be 2000+ ... tell me what is real." Several different
 * numbers had been stated in conversation, all of them either a different unit or an invention,
 * and a number asserted in chat cannot be checked a week later. So the claims the UI makes are
 * pinned here instead: if the content changes these fail and get updated deliberately, and if an
 * agent states a figure that contradicts them, the test is right and the agent is wrong.
 */
describe('subtest inventory', () => {
  it('reports a non-zero, unit-labelled figure for every drillable subtest', () => {
    for (const s of DRILLABLE) {
      const inv = subtestInventory(s.code);
      expect(inv.templates, `${s.code} has no templates`).toBeGreaterThan(0);
      expect(inv.lines.length, `${s.code} has no display lines`).toBeGreaterThan(0);
      // Every fragment names its unit. The whole "35 words" misreading came from one that did not.
      for (const l of inv.lines) expect(l.unit, `${s.code} line without a unit`).toBeTruthy();
    }
  });

  it('measures depth against the real subtest length, not in the abstract', () => {
    // The point of the metric: a bank is only big or small relative to how long the subtest is.
    const wk = subtestInventory('WK');
    expect(wk.realQuestions).toBe(25);
    expect(nonRepeatingRuns('WK')).toBeCloseTo(wk.items / 25, 6);

    // Open subtests cannot have a depth - they never run out.
    expect(nonRepeatingRuns('MK')).toBeNull();
    expect(depthVerdict('MK').level).toBe('open');
    expect(depthVerdict('AR').level).toBe('open');
    expect(depthVerdict('TR').level).toBe('open');
  });

  it('pins the four Word Knowledge counts that get confused for each other', () => {
    // docs/afoqt/QUESTION-SELECTION.md §2. Four numbers, all correct, all different units.
    const inv = subtestInventory('WK');
    expect(inv.words).toBe(askableWords('WK').length);   // askable headwords
    expect(inv.registry).toBe(allWords().length);        // registry rows (a SUBSET of the above)
    expect(inv.words).toBeGreaterThan(inv.registry);     // morphology + pairs live outside the registry
    expect(inv.templates).toBeLessThan(inv.registry);    // templates are shapes, never a word count
    expect(inv.banked).toBeLessThan(inv.templates);      // pre-written items: the SMALLEST of the four

    // Floors, not exact values, so authoring a batch does not break the build. These are the
    // numbers quoted to Trey on 2026-09-11 and they may only ever go up.
    expect(inv.words).toBeGreaterThanOrEqual(637);
    expect(inv.registry).toBeGreaterThanOrEqual(535);
    expect(inv.items).toBeGreaterThanOrEqual(1496);
  });

  it('has authored the high-confidence GRE words first, not an arbitrary slice', () => {
    // THE claim that answers "am I studying the right word bank". `hardListHits` is how many of
    // the five curated GRE lists (Manhattan 1000, GregMat 960, Powerscore, Magoosh Advanced,
    // Barron's 333) a word appears in - the authoring priority in WORD-BANK-EXPANSION.md.
    // A bank built in that order is the RIGHT 637 words; one built alphabetically would not be.
    const rows = fs.readFileSync(CSV, 'utf8').trim().split('\n').slice(1);
    const live = new Set(askableWords('WK').map((w) => String(w).toLowerCase()));

    const unauthoredByHits = {};
    let total3plus = 0;
    let done3plus = 0;
    for (const line of rows) {
      const [word, hitsRaw] = line.split(',');
      const hits = Number(hitsRaw);
      if (hits >= 3) {
        total3plus++;
        if (live.has(word.toLowerCase())) done3plus++;
      }
      if (!live.has(word.toLowerCase())) unauthoredByHits[hits] = (unauthoredByHits[hits] ?? 0) + 1;
    }

    // Every word appearing in three or more of the five curated lists is in the bank.
    expect(total3plus).toBeGreaterThan(0);
    expect(done3plus).toBe(total3plus);
    // Nothing above the single-list tail is left. A 2 here would mean priority was not followed.
    expect(unauthoredByHits[3] ?? 0).toBe(0);
    expect(unauthoredByHits[4] ?? 0).toBe(0);
    expect(unauthoredByHits[5] ?? 0).toBe(0);
  });
});
