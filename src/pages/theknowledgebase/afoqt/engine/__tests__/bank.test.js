import { describe, it, expect } from 'vitest';
import { bankItems, bankSummary, bankTotal } from '../bank';
import { getSubtest } from '../afoqtSpec';

describe('static question banks', () => {
  it('loads items from both sources', () => {
    // 65 usable OATTS + 128 usable migrated ASVAB. The rest are held back:
    // 24 OATTS need a figure or have no distractors, 183 ASVAB items are free-recall.
    expect(bankTotal()).toBeGreaterThanOrEqual(190);
  });

  it('every item is answerable: a real correct index into real choices', () => {
    for (const q of ['MK', 'AR', 'WK', 'RC', 'PS', 'VA', 'AI', 'BC'].flatMap(bankItems)) {
      expect(q.choices.length, `${q.templateId} has too few choices`).toBeGreaterThanOrEqual(2);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
      expect(String(q.stem).trim().length).toBeGreaterThan(0);
      expect(new Set(q.choices).size, `${q.templateId} has a duplicate choice`).toBe(q.choices.length);
    }
  });

  it('only maps items onto real subtests', () => {
    for (const [code] of Object.entries(bankSummary())) {
      expect(getSubtest(code), `unknown subtest ${code}`).toBeTruthy();
    }
  });

  it('labels official USAF items as real and migrated ASVAB items as authored', () => {
    const all = Object.keys(bankSummary()).flatMap(bankItems);
    const real = all.filter((q) => q.provenance?.kind === 'real');
    const authored = all.filter((q) => q.provenance?.kind === 'authored');
    expect(real.length).toBeGreaterThan(0);
    expect(authored.length).toBeGreaterThan(0);
    // Only OATTS material may claim "real" - commercial/ASVAB content must never.
    for (const q of real) expect(q.provenance.source).toMatch(/OATTS/);
  });

  it('excludes items whose figure is missing', () => {
    // Block Counting / Instrument Comprehension items are meaningless without their image.
    const all = Object.keys(bankSummary()).flatMap(bankItems);
    expect(all.every((q) => q.render !== undefined)).toBe(true);
  });
});
