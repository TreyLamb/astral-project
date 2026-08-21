// Arithmetic Reasoning (Phase 8).
//
// Section A is the generic structural gate, scoped to the 37 AR templates, plus the
// bidirectional concept-coverage check (Doctrine rule 2) run the same way afoqt:coverage runs
// it. Section B is regression coverage for defects that actually shipped this phase and were
// fixed - each test here is written so it would have caught the bug before the fix, not to
// re-verify the fix's own arithmetic. Section C is the source-hygiene guard against a heredoc
// turning a regex backslash into a literal control byte, which has bitten this project before.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import '../../templates/index.js';
import { templatesFor, generateInstance, getTemplate } from '../generator.js';
import { auditTemplate, seedForSample } from '../templateAudit.js';
import { CHAPTERS } from '../../curriculum/chapters.js';
import { TRAVEL, COUNTABLES, WEIGHED } from '../../templates/ar/words.js';

// 400 matches the SAMPLES used by engine/__tests__/templates.test.js, which already runs every
// registered template (AR included) at this count. The CLI runs far higher on demand
// (`npm run afoqt:selftest -- --samples=8000`).
const SAMPLES = 400;

const arTemplates = templatesFor('AR');
const reasoningChapters = CHAPTERS.filter((c) => c.track === 'reasoning');

describe('every AR template', () => {
  it('registers all 37 of them', () => {
    expect(arTemplates).toHaveLength(37);
  });

  it.each(arTemplates.map((t) => [t.id, t]))('%s holds its structural contract', (_id, t) => {
    const result = auditTemplate(t, { samples: SAMPLES });
    expect(result.problems, `${t.id}:\n  ${result.problems.join('\n  ')}`).toEqual([]);
  });

  it.each(arTemplates.map((t) => [t.id, t]))(
    '%s declares subtest AR, a band 1-4, and a non-empty concepts array', (_id, t) => {
      expect(t.subtest).toBe('AR');
      expect(t.band).toBeGreaterThanOrEqual(1);
      expect(t.band).toBeLessThanOrEqual(4);
      expect(Array.isArray(t.concepts)).toBe(true);
      expect(t.concepts.length).toBeGreaterThan(0);
    });

  // Mirrors `npm run afoqt:coverage`, scoped to the reasoning track: every concept a template
  // claims has to be owned by exactly one reasoning chapter, and every concept a reasoning
  // chapter teaches has to be tested by at least one template. Doctrine rule 2, both directions.
  it('every concept an AR template declares is owned by exactly one reasoning chapter', () => {
    const templateConcepts = new Set(arTemplates.flatMap((t) => t.concepts));
    for (const c of templateConcepts) {
      const owners = reasoningChapters.filter((ch) => ch.concepts.includes(c));
      expect(owners.map((ch) => ch.id), `concept "${c}"`).toHaveLength(1);
    }
  });

  it('every concept a reasoning chapter teaches is tested by at least one AR template', () => {
    const testedConcepts = new Set(arTemplates.flatMap((t) => t.concepts));
    for (const ch of reasoningChapters) {
      for (const c of ch.concepts) {
        expect(testedConcepts.has(c), `"${c}" is taught by ${ch.id} but no template tests it`).toBe(true);
      }
    }
  });

  it.each(arTemplates.map((t) => [t.id, t]))('%s never emits a bad explanation', (_id, t) => {
    for (let i = 0; i < 200; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance(t.id, seed);
      expect(q.explanation, `${t.id} seed ${seed}: no explanation`).toBeTruthy();
      expect(/NaN|undefined|Infinity/.test(String(q.explanation)),
        `${t.id} seed ${seed}: bad explanation "${q.explanation}"`).toBe(false);
    }
  });
});

// --- B1. Vehicle speeds must be plausible ------------------------------------------------
//
// The original bug drew a speed independently of the vehicle and produced a boat at 140 mph.
// The fix (speedFor / OUT_AND_BACK filtered against TRAVEL) is in ch02-rates.js; this test does
// not trust that fix, it re-parses the rendered stem and checks the number against the
// vehicle's own [slow, fast] range from words.js.
describe('vehicle speeds stay inside the named vehicle\'s plausible range', () => {
  const TRAVEL_BY_MODE = Object.fromEntries(TRAVEL.map((t) => [t.mode, t]));
  const SPEED_TEMPLATES = ['ar-rtd-distance', 'ar-rtd-time', 'ar-average-speed'];

  it.each(SPEED_TEMPLATES.map((id) => [id]))('%s never quotes a vehicle outside its range', (id) => {
    const t = getTemplate(id);
    for (let i = 0; i < 300; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance(id, seed);
      const vehicleMatch = q.stem.match(/^A (\w+) /);
      expect(vehicleMatch, `${id} seed ${seed}: no vehicle found in "${q.stem}"`).toBeTruthy();
      const range = TRAVEL_BY_MODE[vehicleMatch[1]];
      expect(range, `${id} seed ${seed}: unknown vehicle "${vehicleMatch[1]}"`).toBeTruthy();

      const speeds = [...q.stem.matchAll(/(\d+(?:\.\d+)?) miles per hour/g)].map((m) => Number(m[1]));
      expect(speeds.length, `${id} seed ${seed}: no speeds found in "${q.stem}"`).toBeGreaterThan(0);
      for (const speed of speeds) {
        expect(speed,
          `${id} seed ${seed}: ${speed} mph is outside ${vehicleMatch[1]}'s [${range.slow}, ${range.fast}] in "${q.stem}"`
        ).toBeGreaterThanOrEqual(range.slow);
        expect(speed).toBeLessThanOrEqual(range.fast);
      }
    }
  });
});

// --- B2. Declared verb forms, not derived ones -------------------------------------------
//
// `replace(/ed$/, '')` used to derive the bare form from the past tense and mangled five of ten
// COUNTABLES entries the moment they were read aloud: filed -> "fil", moved -> "mov", assembled
// -> "assembl", logged -> "logg". words.js now declares `bare` outright; this guards against the
// derivation creeping back in, at the data level and at the rendered-stem level.
describe('AR word tables declare complete verb forms, not derived ones', () => {
  it.each(COUNTABLES.map((w, i) => [i, w]))('COUNTABLES[%s] has non-empty one, many, verb, bare', (_i, w) => {
    expect(w.one, JSON.stringify(w)).toBeTruthy();
    expect(w.many, JSON.stringify(w)).toBeTruthy();
    expect(w.verb, JSON.stringify(w)).toBeTruthy();
    expect(w.bare, JSON.stringify(w)).toBeTruthy();
  });

  it.each(WEIGHED.map((w, i) => [i, w]))('WEIGHED[%s] has non-empty one, many, verb, bare', (_i, w) => {
    expect(w.one, JSON.stringify(w)).toBeTruthy();
    expect(w.many, JSON.stringify(w)).toBeTruthy();
    expect(w.verb, JSON.stringify(w)).toBeTruthy();
    expect(w.bare, JSON.stringify(w)).toBeTruthy();
  });

  it('no generated AR stem contains a mangled fragment from a stripped "ed" suffix', () => {
    // A bounded word ending in one of these stems, standing on its own between word boundaries,
    // is exactly what `replace(/ed$/, '')` produces and a correctly declared `bare` never does
    // ("filed" -> bare "file", never a bare "fil").
    const mangled = /\b(assembl|logg|mov|fil)\b/;
    for (const t of arTemplates) {
      for (let i = 0; i < 150; i++) {
        const seed = seedForSample(i, t);
        const q = generateInstance(t.id, seed);
        expect(mangled.test(q.stem), `${t.id} seed ${seed}: "${q.stem}"`).toBe(false);
      }
    }
  });
});

// --- B3. ar-work-rate must not round the combined rate ------------------------------------
//
// Writing the combined rate as a decimal ran 1/10 + 1/40 through num(), which rounds to two
// places and printed "0.13" - then claimed 1 / 0.13 = 8, arithmetic that is simply wrong on the
// page. The fix keeps the explanation in exact fraction form; this asserts the exact form is
// there and the rounded form is not, plus the two structural facts the item depends on.
describe('ar-work-rate never rounds the combined rate', () => {
  it('explanation states the exact 1/n fraction, and the combined time beats both workers', () => {
    const t = getTemplate('ar-work-rate');
    for (let i = 0; i < 300; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance('ar-work-rate', seed);

      const answerMatch = q.choices[q.correctIndex].match(/^(\d+(?:\.\d+)?) hours$/);
      expect(answerMatch, `seed ${seed}: "${q.choices[q.correctIndex]}"`).toBeTruthy();
      const correctTime = Number(answerMatch[1]);
      expect(Number.isInteger(correctTime), `seed ${seed}: combined time ${correctTime} is not whole`).toBe(true);

      expect(q.explanation, `seed ${seed}`).toMatch(new RegExp(`1/${correctTime}\\b`));
      expect(q.explanation, `seed ${seed}: rounded rate leaked into the explanation`).not.toMatch(/0\.\d{2}\b/);

      const stemMatch = q.stem.match(
        /Working alone, \S+ can complete a job in (\d+) hours and \S+ can complete the same job in (\d+) hours/);
      expect(stemMatch, `seed ${seed}: "${q.stem}"`).toBeTruthy();
      const [ta, tb] = stemMatch.slice(1).map(Number);
      expect(correctTime, `seed ${seed}: combined time not less than ${ta}`).toBeLessThan(ta);
      expect(correctTime, `seed ${seed}: combined time not less than ${tb}`).toBeLessThan(tb);
    }
  });
});

// --- B4. ar-weighted-groups ----------------------------------------------------------------
describe('ar-weighted-groups', () => {
  it('answer is always an integer, section sizes always differ, and the naive mean is never it', () => {
    const t = getTemplate('ar-weighted-groups');
    for (let i = 0; i < 500; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance('ar-weighted-groups', seed);
      const correct = Number(q.choices[q.correctIndex]);
      expect(Number.isInteger(correct), `seed ${seed}: ${correct}`).toBe(true);

      const stemMatch = q.stem.match(
        /One section of (\d+) students averaged (\d+(?:\.\d+)?) on an exam, and a second section of (\d+) students averaged (\d+(?:\.\d+)?)/);
      expect(stemMatch, `seed ${seed}: "${q.stem}"`).toBeTruthy();
      const [n1, a1, n2, a2] = stemMatch.slice(1).map(Number);
      expect(n1, `seed ${seed}: equal section sizes ${n1}`).not.toBe(n2);
      expect((a1 + a2) / 2, `seed ${seed}: naive mean equals the correct answer`).not.toBe(correct);
    }
  });
});

// --- B5. ar-percent-remaining: whole staff only --------------------------------------------
describe('ar-percent-remaining', () => {
  it('correct answer is always a whole number of people', () => {
    const t = getTemplate('ar-percent-remaining');
    for (let i = 0; i < 500; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance('ar-percent-remaining', seed);
      const correct = Number(q.choices[q.correctIndex]);
      expect(Number.isInteger(correct), `seed ${seed}: ${correct}`).toBe(true);
    }
  });
});

// --- B6. ar-volume-words: the cited distractor must actually be on the page ----------------
//
// `h.choices` keeps only the first `need - 1` distinct distractors; a distractor listed too far
// down the array never reaches the page even though the explanation still names it. The fix
// moved "used only two of the three dimensions" earlier in the list; this checks it stays
// present via its error label, not by re-deriving the numeric value.
describe('ar-volume-words', () => {
  it('the dropped-a-dimension distractor is present among the rendered choices', () => {
    const t = getTemplate('ar-volume-words');
    for (let i = 0; i < 300; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance('ar-volume-words', seed);
      expect(q.errors, `seed ${seed}: no error labels`).toBeTruthy();
      expect(q.errors.includes('dropped-a-dimension'),
        `seed ${seed}: dropped-a-dimension missing from ${JSON.stringify(q.choices)}`).toBe(true);
    }
  });
});

// --- B7. ar-fencepost-loop: open vs. closed must both occur and both compute right --------
describe('ar-fencepost-loop', () => {
  it('a closed loop answers length/spacing, an open run answers length/spacing + 1, both occur', () => {
    const t = getTemplate('ar-fencepost-loop');
    let sawClosed = false;
    let sawOpen = false;
    for (let i = 0; i < 300; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance('ar-fencepost-loop', seed);
      const correct = Number(q.choices[q.correctIndex]);
      const closedMatch = q.stem.match(/^A \S+ \S+ (\d+) feet around has \S+ spaced every (\d+) feet\. How many/);
      const openMatch = q.stem.match(
        /^A \S+ \S+ (\d+) feet long has \S+ spaced every (\d+) feet, including one at each end\. How many/);
      if (closedMatch) {
        sawClosed = true;
        const [length, spacing] = closedMatch.slice(1).map(Number);
        expect(correct, `seed ${seed}: "${q.stem}"`).toBe(length / spacing);
      } else if (openMatch) {
        sawOpen = true;
        const [length, spacing] = openMatch.slice(1).map(Number);
        expect(correct, `seed ${seed}: "${q.stem}"`).toBe(length / spacing + 1);
      } else {
        throw new Error(`seed ${seed}: stem matched neither the open nor the closed pattern: "${q.stem}"`);
      }
    }
    expect(sawClosed, 'never sampled a closed loop across 300 seeds').toBe(true);
    expect(sawOpen, 'never sampled an open run across 300 seeds').toBe(true);
  });
});

// --- B8. ar-percent-to-count: never a 100-question test ------------------------------------
//
// On a 100-question test the count missed and the percentage missed are the same number, which
// collapses the "reported the percentage as a count" distractor onto the answer.
describe('ar-percent-to-count', () => {
  it('never presents a 100-question test', () => {
    const t = getTemplate('ar-percent-to-count');
    for (let i = 0; i < 500; i++) {
      const seed = seedForSample(i, t);
      const q = generateInstance('ar-percent-to-count', seed);
      const totalMatch = q.stem.match(/^A test has (\d+) questions/);
      expect(totalMatch, `seed ${seed}: "${q.stem}"`).toBeTruthy();
      expect(Number(totalMatch[1]), `seed ${seed}: "${q.stem}"`).not.toBe(100);
    }
  });
});

// --- C. Source hygiene: no stray control characters ----------------------------------------
//
// `\b` written through a bash heredoc becomes a literal 0x08 backspace byte - this has bitten
// this project four times, once silently disabling a validation guard for an entire phase. The
// character class is built from String.fromCharCode rather than a literal escape, so the guard
// itself cannot be defeated by the same class of accident it is checking for.
describe('AR template source files contain no stray control characters', () => {
  const arDir = join(dirname(fileURLToPath(import.meta.url)), '../../templates/ar');
  const files = readdirSync(arDir).filter((f) => f.endsWith('.js'));

  function buildControlCharPattern() {
    const codes = [];
    for (let c = 0x01; c <= 0x08; c++) codes.push(c);
    codes.push(0x0b, 0x0c);
    for (let c = 0x0e; c <= 0x1f; c++) codes.push(c);
    const chars = codes.map((c) => String.fromCharCode(c)).join('');
    return new RegExp(`[${chars}]`);
  }
  const controlCharPattern = buildControlCharPattern();

  it('found the six chapter files plus words.js', () => {
    expect(files.length).toBeGreaterThanOrEqual(7);
  });

  // A guard that has never rejected anything is indistinguishable from a dead one - prove this
  // one actually fires, against the exact byte a heredoc-mangled \b turns into, before trusting
  // it against the real source files below.
  it('the guard actually rejects a string containing such a byte', () => {
    const poisoned = `before${String.fromCharCode(0x08)}after`;
    expect(controlCharPattern.test(poisoned)).toBe(true);
    const alsoPoisoned = `vertical${String.fromCharCode(0x0b)}tab`;
    expect(controlCharPattern.test(alsoPoisoned)).toBe(true);
    const clean = 'an ordinary line\twith a tab, a\nnewline, and a carriage\r return';
    expect(controlCharPattern.test(clean)).toBe(false);
  });

  it.each(files.map((f) => [f]))('%s has no control characters in 0x01-0x08, 0x0B, 0x0C, 0x0E-0x1F', (f) => {
    const content = readFileSync(join(arDir, f), 'utf8');
    expect(controlCharPattern.test(content), `${f} contains a stray control character`).toBe(false);
  });
});
