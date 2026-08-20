// Aviation Information (Phase 5).
//
// The fact engine has no arithmetic to be wrong at, so the failure modes are all editorial - and
// every guard below was written after the corresponding defect actually shipped and was caught by
// reading generated questions out loud. In order of how badly each one hurt:
//
//   1. THE QUESTION CONTAINED ITS OWN ANSWER. "Pressure altitude corrected for non-standard
//      temperature is ___" offered "is pressure altitude corrected for temperature" as the right
//      choice. Sixty rows had a version of this.
//   2. THE QUESTION AND ANSWER DID NOT AGREE GRAMMATICALLY. "An aircraft's elevator functions to
//      ___" wants an infinitive; the gloss is third-person.
//   3. TERM AND GLOSS WERE INVERTED. The MDS rows asked "Which designation marks a multi-mission
//      remotely piloted aircraft?" and answered "a multi-mission remotely piloted aircraft."
//   4. A VISUAL TELL. One option in capitals, or one plural among four singulars, is findable
//      without knowing anything about aeroplanes.
//
// None of these break a build, none of them produce a wrong answer, and none of them would ever
// have been caught by asserting the generator is internally consistent. They are exactly the kind
// of quiet rot that ended the ASVAB deck.

import { describe, it, expect } from 'vitest';
import '../../templates';
import { templatesFor, generateInstance } from '../generator';
import { auditTemplate } from '../templateAudit';
import { allFacts, getFact, identifyStem, distractorsFor, shoutedWord } from '../facts';
import { CHAPTERS, chaptersForTrack } from '../../curriculum/chapters';
import { LESSONS } from '../../curriculum/lessons';

const facts = allFacts().filter((f) => f.chapter.startsWith('av-'));
const templates = templatesFor('AI');
const chapters = chaptersForTrack('aviation');

/** Content words, minus the ones every option in a set legitimately shares. */
const CATEGORY_WORDS = new Set([
  'aircraft', 'airspeed', 'speed', 'that', 'this', 'with', 'from', 'into', 'have', 'which',
  'when', 'than', 'they', 'them', 'what', 'does', 'called', 'other', 'their', 'about',
  // A five-option set is naturally all clouds, or all fronts, or all classes. Repeating the
  // category noun is how the question is asked, not a leak.
  'class', 'cloud', 'front', 'stage', 'axis', 'drag', 'line', 'angle', 'lights', 'sign',
  'gear', 'stroke', 'north', 'altitude', 'hypoxia', 'turbulence', 'fog', 'leg', 'arc',
  'propeller', 'engine', 'instrument', 'marking', 'markings', 'beacon', 'wind', 'lift',
  'load', 'stall', 'spin', 'time', 'ratio', 'layer', 'phase', 'limit', 'control', 'pressure',
  'system', 'temperature', 'illusion', 'horizon', 'rotor', 'navigation', 'designation',
  'runway', 'taxiway', 'flight', 'wing', 'tab', 'prefix', 'principle', 'ice', 'area',
]);

const contentWords = (s) =>
  new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !CATEGORY_WORDS.has(w)));

const overlap = (a, b) => [...contentWords(a)].filter((w) => contentWords(b).has(w));

describe('the aviation fact base', () => {
  it('carries a substantial body of facts across eleven chapters', () => {
    expect(facts.length).toBeGreaterThan(350);
    expect(chapters).toHaveLength(11);
    expect(templates.length).toBeGreaterThan(55);
  });

  it('gives every chapter enough templates to fill a five-question gate', () => {
    for (const ch of chapters) {
      const pool = templates.filter((t) => t.concepts.some((c) => ch.concepts.includes(c)));
      expect(pool.length, `${ch.id} has ${pool.length} templates`).toBeGreaterThanOrEqual(5);
    }
  });

  it('gives every chapter a lesson that teaches what it tests', () => {
    for (const ch of chapters) {
      expect(LESSONS[ch.id], `${ch.id} has no lesson`).toBeTruthy();
      expect(LESSONS[ch.id].length, `${ch.id} lesson is a stub`).toBeGreaterThan(2000);
    }
  });
});

describe('a question never contains its own answer', () => {
  // Defect 1. The identify stem is derived from the term alone, so this should now be
  // structurally impossible - but it is asserted anyway, because it was expensive.
  it.each(facts.filter((f) => f.identify !== false).map((f) => [f.id, f]))(
    '%s: the identify stem does not restate its gloss', (_id, f) => {
      const shared = overlap(identifyStem(f), f.gloss);
      expect(shared.length, `"${identifyStem(f)}" shares ${shared} with its own answer`).toBeLessThan(3);
    });

  it.each(facts.filter((f) => f.recallStem).map((f) => [f.id, f]))(
    '%s: the recall question does not restate its term', (_id, f) => {
      const shared = overlap(f.recallStem, f.term);
      expect(shared.length, `"${f.recallStem}" shares ${shared} with "${f.term}"`).toBeLessThan(2);
    });
});

describe('every fact row is well formed', () => {
  it.each(facts.map((f) => [f.id, f]))('%s reads as a sentence', (_id, f) => {
    // Defect 2: the gloss has to be a PREDICATE, because the stem is only the term. A gloss
    // starting with an article is a noun phrase, and "The aileron a control surface" is not a
    // sentence.
    expect(/^(a|an|the) /i.test(f.gloss), `gloss is a noun phrase: "${f.gloss}"`).toBe(false);
    // Defect 4: a gloss becomes an option, so emphasis capitals in one are a visual tell.
    // Acronyms are fine - an ILS is called an ILS.
    expect(shoutedWord(f.gloss), `gloss shouts in "${f.gloss}"`).toBeNull();
    // A row that cannot be asked in either direction is dead content.
    expect(f.identify !== false || !!f.recallStem).toBe(true);
  });

  it('never points a confusion outside its own chapter', () => {
    for (const f of facts) {
      for (const id of f.confusions ?? []) {
        const other = getFact(id);
        expect(other, `${f.id} -> missing "${id}"`).toBeTruthy();
        expect(other.chapter, `${f.id} -> ${id} crosses chapters`).toBe(f.chapter);
      }
    }
  });

  it('draws every distractor from the same chapter as the answer', () => {
    // A distractor from another subject is eliminable on sight and turns a five-option item into
    // a two-option one.
    for (const f of facts.slice(0, 120)) {
      const byGloss = new Map(facts.map((x) => [x.gloss, x]));
      for (const d of distractorsFor(f, (x) => x.gloss).slice(0, 4)) {
        expect(byGloss.get(d.value).chapter).toBe(f.chapter);
      }
    }
  });

  it('names an error mode on every distractor', () => {
    for (const f of facts.slice(0, 120)) {
      for (const d of distractorsFor(f, (x) => x.term)) {
        expect(d.error).toBeTruthy();
        expect(d.why).toBeTruthy();
      }
    }
  });
});

describe('every Aviation Information template', () => {
  it.each(templates.map((t) => [t.id, t]))('%s holds the structural contract', (_id, t) => {
    expect(auditTemplate(t, { samples: 400 }).problems).toEqual([]);
  });

  it('always offers exactly five options, as the real subtest does', () => {
    for (const t of templates) {
      for (let seed = 0; seed < 40; seed++) {
        expect(generateInstance(t.id, seed).choices).toHaveLength(5);
      }
    }
  });
});

// The official items are the calibration anchors for the whole subtest - ten from the OATTS
// Knowledge Check and five from the AFPC pamphlet. If one stops being covered, the level has
// drifted away from the real test and nothing else would say so.
describe('the official items are all covered', () => {
  const has = (needle) => facts.some(
    (f) => (f.term + ' ' + f.gloss).toLowerCase().includes(needle.toLowerCase()));

  it.each([
    ['winglet - reduce drag', 'weakening the vortex'],
    ['elevator - change pitch', 'controls pitch'],
    ['Q designation - remotely piloted', 'remotely piloted'],
    ['UH-60 - utility helicopter', 'utility helicopter'],
    ['runway 16R - 160 degrees, right', '160 degrees'],
    ['white lights - runway edge', 'white lights that outline'],
    ['smooth flight - cool and dry', 'smoothest flight'],
    ['land into the wind', 'take off and land in'],
    ['downward force - weight', 'downward force of gravity'],
    ['drag opposed by thrust', 'forward force produced by the engine'],
    ['cowling - around the engine', 'covering around the engine'],
    ['taxiway lights - blue', 'blue lights that outline'],
    ['ammeter minus - alternator', 'negative ammeter reading'],
    ['angle of attack - chord and relative wind', 'chord line and the relative wind'],
    ['MDS reading order', 'basic mission'],
  ])('%s', (_label, needle) => {
    expect(has(needle)).toBe(true);
  });
});
