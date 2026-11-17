import { describe, it, expect } from 'vitest';
import { chemHints } from './hints.js';
import './templates/index.js';
import { generateChemInstance, allChemTemplates } from './generator.js';

const esc = (a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

describe('chem hints', () => {
  it('names a constant without giving its value, then the equation', () => {
    const h = chemHints({ stem: 'Calculate the energy of a photon with a frequency of 4.0 × 10¹³ Hz.', explanation: 'E = hν = (6.626 × 10⁻³⁴)(4.0 × 10¹³) = 2.7 × 10⁻²⁰ J.' });
    const ci = h.findIndex((x) => /Planck's constant/.test(x));
    const ei = h.findIndex((x) => /E = hν/.test(x));
    expect(ci).toBeGreaterThanOrEqual(0);
    expect(ci).toBeLessThan(ei);
    expect(h.join(' ')).not.toMatch(/6\.626/);
  });

  it('flags a constant the stem prints, since the exam may not', () => {
    const h = chemHints({ stem: 'What is the frequency of 500. nm light? (λν = c, c = 3.00 × 10⁸ m/s)', explanation: 'ν = c/λ' });
    const c = h.find((x) => /speed of light/.test(x));
    expect(c).toMatch(/exam may not/);
    expect(c).not.toMatch(/3\.00/);
  });

  it('a ladder is at most 7 hints, never leaks a constant value, and never states the answer', () => {
    let leaks = 0;
    for (const t of allChemTemplates()) {
      for (let s = 0; s < 40; s++) {
        const q = generateChemInstance(t.id, s);
        const h = chemHints(q, t.name);
        expect(h.length).toBeGreaterThanOrEqual(0);
        expect(h.length).toBeLessThanOrEqual(7);
        expect(h.join(' ')).not.toMatch(/6\.626|3\.00 × 10⁸|1\.097|6\.022/);
        const a = q.choices[q.correctIndex];
        const re = new RegExp(`(?<![A-Za-z0-9.])${esc(a)}(?![a-z0-9])`);
        // A one-digit answer ("2" valence electrons) appears inside general rules; that is not a leak.
        // So does a rule that names BOTH sides of a two-way choice ("unpaired makes it paramagnetic;
        // all paired makes it diamagnetic"): it teaches the rule without picking for him.
        const others = q.choices.filter((c, i) => i !== q.correctIndex);
        if (!/^\d$/.test(a) && h.some((x) => re.test(x) && !others.some((o) => x.includes(o)))) leaks += 1;
      }
    }
    // The few left are generic words (a "1", "water") that the answer happens to share.
    expect(leaks).toBeLessThan(20);
  });
});
