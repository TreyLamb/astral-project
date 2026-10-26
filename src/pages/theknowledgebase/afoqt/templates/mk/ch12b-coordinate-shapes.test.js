import { describe, it, expect } from 'vitest';
import '../index.js';
import { generateInstance, allTemplates } from '../../engine/generator.js';
import { pt, rotCCW, rotCW, wholeMid, shoelace, cross, d2 } from './shapes.js';

const IDS = allTemplates()
  .map((t) => t.id)
  .filter((id) => /^mk-(vertex-|triangle-classify|perimeter-polygon|area-triangle-base|area-quadrilateral|centroid|diagonals-meet|transform-|collinear-k)/.test(id));
const skeleton = (s) => s.replace(/-?\d+/g, '#').replace(/\b[A-Z]\b/g, 'L').replace(/\s+/g, ' ');

describe('coordinate shapes: geometry helpers', () => {
  it('rotates a quarter turn each way and undoes itself', () => {
    expect(rotCCW(pt(3, 2))).toEqual(pt(-2, 3));
    expect(rotCW(pt(3, 2))).toEqual(pt(2, -3));
    expect(rotCW(rotCCW(pt(5, -7)))).toEqual(pt(5, -7));
  });
  it('finds whole-number midpoints only', () => {
    expect(wholeMid(pt(0, 0), pt(4, 6))).toEqual(pt(2, 3));
    expect(wholeMid(pt(0, 0), pt(3, 6))).toBeNull();
  });
  it('shoelace area and cross product agree on a parallelogram', () => {
    const A = pt(0, 0), B = pt(3, 4), C = pt(9, 4), D = pt(6, 0);
    expect(shoelace([A, B, C, D])).toBe(24);
    expect(Math.abs(cross(pt(3, 4), pt(6, 0)))).toBe(24);
    expect(d2(A, B)).toBe(25);
  });
});

describe('coordinate shapes: the question family', () => {
  it('is a family of at least 14 different question types', () => {
    expect(IDS.length).toBeGreaterThanOrEqual(14);
  });

  it.each(IDS)('%s: always well formed, with the answer among distinct choices', (id) => {
    for (let seed = 1; seed <= 300; seed++) {
      const q = generateInstance(id, seed * 7919);
      expect(q.choices.length).toBeGreaterThanOrEqual(4);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
      expect(q.explanation.length).toBeGreaterThan(40);
    }
  });

  it.each(IDS)('%s: does not repeat itself (different instances, different questions)', (id) => {
    const stems = new Set();
    for (let seed = 1; seed <= 300; seed++) stems.add(generateInstance(id, seed * 104729).stem);
    expect(stems.size).toBeGreaterThan(240);
  });

  it('is not the same few questions over and over: many distinct wordings across the family', () => {
    const sk = new Set();
    for (const id of IDS) for (let seed = 1; seed <= 300; seed++) sk.add(skeleton(generateInstance(id, seed * 7919).stem));
    expect(sk.size).toBeGreaterThanOrEqual(100);
  });

  it('draws different shapes and tilts: parallelogram family turns up every kind', () => {
    const kinds = new Set();
    for (let seed = 1; seed <= 400; seed++) {
      const m = generateInstance('mk-vertex-parallelogram', seed * 7919).stem.match(/\b(Parallelogram|Rectangle|Rhombus|Square|parallelogram|rectangle|rhombus|square)\b/);
      if (m) kinds.add(m[1].toLowerCase());
    }
    expect([...kinds].sort()).toEqual(['parallelogram', 'rectangle', 'rhombus', 'square']);
  });

  it('classifies all four possible triangle types, and never answers "equilateral"', () => {
    const answers = new Set();
    for (let seed = 1; seed <= 400; seed++) {
      const q = generateInstance('mk-triangle-classify', seed * 7919);
      answers.add(q.choices[q.correctIndex]);
    }
    expect(answers.size).toBe(4);
    expect(answers.has('equilateral')).toBe(false);
  });
});

describe('a long run on ONE topic (Trey: "100 questions on only vertices, never repeating, varying as much as possible")', () => {
  it('100 questions on polygon-vertices: no repeats, many structural kinds, none dominating', async () => {
    const { buildDrill } = await import('../../engine/generator.js');
    const { mulberry32 } = await import('../../../engine/rng.js');
    for (const seed of [1, 2, 3]) {
      const qs = buildDrill({ subtest: 'MK', count: 100, rng: mulberry32(seed), distinct: true, filter: (t) => (t.concepts ?? []).includes('polygon-vertices') });
      expect(qs).toHaveLength(100);
      expect(new Set(qs.map((q) => q.stem)).size).toBe(100);
      const variants = new Map();
      for (const q of qs) variants.set(`${q.templateId}|${q.variant}`, (variants.get(`${q.templateId}|${q.variant}`) ?? 0) + 1);
      expect(qs.every((q) => q.variant)).toBe(true);          // every generator in this topic reports what kind it drew
      expect(variants.size).toBeGreaterThanOrEqual(40);       // many different structural kinds
      expect(Math.max(...variants.values())).toBeLessThanOrEqual(6); // and no single kind fills the run
      const numberSets = new Set(qs.map((q) => `${q.templateId}|${(q.stem.match(/-?\d+/g) ?? []).sort().join(',')}`));
      expect(numberSets.size).toBe(100);                       // never the same figure with the same numbers twice
    }
  });
});
