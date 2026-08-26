// Physical Science (Phase 12).
//
// Same fact engine as Aviation Information (engine/facts.js), so the same failure modes apply -
// see aviation.test.js's header for the four editorial defect classes this pattern exists to
// catch. None of them break a build or produce a structurally wrong answer; all of them were
// only ever caught by reading generated questions aloud.

import { describe, it, expect } from 'vitest';
import '../../templates/index.js';
import { templatesFor, generateInstance } from '../generator.js';
import { auditTemplate } from '../templateAudit.js';
import { allFacts, getFact, identifyStem, distractorsFor, shoutedWord } from '../facts.js';
import { CHAPTERS } from '../../curriculum/chapters.js';
import { LESSONS } from '../../curriculum/lessons.js';

const facts = allFacts().filter((f) => f.chapter.startsWith('ps-'));
const templates = templatesFor('PS');
const chapters = CHAPTERS.filter((c) => c.subtest === 'PS');

/** Content words, minus the ones every option in a set legitimately shares. */
const CATEGORY_WORDS = new Set([
  'that', 'this', 'with', 'from', 'into', 'have', 'which', 'when', 'than', 'they', 'them',
  'what', 'does', 'called', 'other', 'their', 'about', 'through', 'around', 'called',
  // A five-option set is naturally all planets, or all waves, or all forces - repeating the
  // category noun is how the question is asked, not a leak.
  'wave', 'light', 'force', 'sound', 'atom', 'atomic', 'electron', 'proton', 'neutron',
  'energy', 'change', 'circuit', 'current', 'field', 'medium', 'matter', 'state', 'moon',
  'earth', 'planet', 'orbit', 'shadow', 'heat', 'temperature', 'friction', 'element',
  'period', 'reaction', 'decay', 'phase', 'mirror', 'lens', 'spectrum', 'magnet', 'magnetic',
  'metal', 'resistance', 'conductor', 'thermal',
]);

const contentWords = (s) =>
  new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !CATEGORY_WORDS.has(w)));

const overlap = (a, b) => [...contentWords(a)].filter((w) => contentWords(b).has(w));

describe('the physical science fact base', () => {
  it('carries a substantial body of facts across eight chapters', () => {
    expect(facts.length).toBeGreaterThan(250);
    expect(chapters).toHaveLength(8);
    expect(templates.length).toBeGreaterThan(40);
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
      expect(LESSONS[ch.id].length, `${ch.id} lesson is a stub`).toBeGreaterThan(1500);
    }
  });
});

describe('a question never contains its own answer', () => {
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
    // The gloss has to be a PREDICATE, since the identify stem is only ever the term. A gloss
    // starting with an article is a noun phrase, not a sentence the term can complete.
    expect(/^(a|an|the) /i.test(f.gloss), `gloss is a noun phrase: "${f.gloss}"`).toBe(false);
    // A gloss becomes an answer option, so emphasis capitals in one are a visual tell.
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
    // A distractor from another subject is eliminable on sight and turns a five-option item
    // into a two-option one.
    const byGloss = new Map(facts.map((x) => [x.gloss, x]));
    for (const f of facts) {
      for (const d of distractorsFor(f, (x) => x.gloss).slice(0, 4)) {
        expect(byGloss.get(d.value).chapter).toBe(f.chapter);
      }
    }
  });

  it('names an error mode on every distractor', () => {
    for (const f of facts) {
      for (const d of distractorsFor(f, (x) => x.term)) {
        expect(d.error).toBeTruthy();
        expect(d.why).toBeTruthy();
      }
    }
  });
});

describe('every Physical Science template', () => {
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

// The official OATTS items (oatts-PS-045 through oatts-PS-069, already in
// afoqt/data/realQuestions.json) are the calibration anchors for the whole subtest, split evenly
// across all 8 areas. If one stops being covered, the level has drifted from the real test and
// nothing else would say so.
describe('the official items are all covered', () => {
  const has = (needle) => facts.some(
    (f) => (f.term + ' ' + f.gloss).toLowerCase().includes(needle.toLowerCase()));

  it.each([
    ['oatts-PS-045: comets grow a tail near the Sun', 'grows a glowing tail'],
    ['oatts-PS-047: axial tilt causes seasons', 'cause of the seasons'],
    ['oatts-PS-048: an electron gains energy moving up', 'gains energy'],
    ['oatts-PS-049: mass number = protons + neutrons', 'sum of an atom'],
    ['oatts-PS-050: electronegativity increases across a period', 'electronegativity'],
    ['oatts-PS-051: a solid has definite shape and volume', 'definite shape'],
    ['oatts-PS-052: the periodic table orders by atomic number', 'increasing atomic number'],
    ['oatts-PS-053: a chemical change always produces new matter', 'new kinds of matter'],
    ['oatts-PS-054: series circuit current is the same throughout', 'same current flows'],
    ['oatts-PS-055: a better conductor reduces resistance', 'reduces a wire'],
    ['oatts-PS-056: a switch opens or closes the current path', 'opens or closes the path'],
    ['oatts-PS-057: light needs no medium to travel', 'no medium'],
    ['oatts-PS-058: reflection is light bouncing off a surface', 'bounces off a surface'],
    ['oatts-PS-059: frequency determines color', 'determines the color'],
    ['oatts-PS-060: friction opposes motion', 'opposes a moving object'],
    ['oatts-PS-061: a stationary tug-of-war means zero net force', 'a net force of zero'],
    ['oatts-PS-062: an inclined plane reduces the force needed', 'reduces the force needed'],
    ['oatts-PS-063: compression and rarefaction', 'compressions'],
    ['oatts-PS-064: sound is fastest in a solid', 'sound travels fastest'],
    ['oatts-PS-065: frequency determines pitch', 'determined by the'],
    ['oatts-PS-066: diffraction bends sound around obstacles', 'bending or spreading'],
    ['oatts-PS-067: conduction is direct-contact heat transfer', 'direct contact between particles'],
    ['oatts-PS-068: the first law is conservation of energy', 'cannot be created or destroyed'],
    ['oatts-PS-069: heating makes particles move faster and spread apart', 'move faster'],
  ])('%s', (_label, needle) => {
    expect(has(needle)).toBe(true);
  });
});
