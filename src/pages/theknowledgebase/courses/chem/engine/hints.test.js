import { describe, it, expect } from 'vitest';
import { chemHints } from './hints.js';
import './templates/index.js';
import { generateChemInstance } from './generator.js';

describe('chem hints', () => {
  it('names a constant without giving its value', () => {
    const h = chemHints({ stem: 'Calculate the energy of a photon with a frequency of 4.0 × 10¹³ Hz.', explanation: 'E = hν = (6.626 × 10⁻³⁴)(4.0 × 10¹³) = 2.7 × 10⁻²⁰ J.' });
    expect(h[0]).toMatch(/Planck's constant/);
    expect(h.join(' ')).not.toMatch(/6\.626/);
    expect(h[1]).toMatch(/E = hν/);
  });

  it('flags a constant the stem prints, since the exam may not', () => {
    const h = chemHints({ stem: 'What is the frequency of 500. nm light? (λν = c, c = 3.00 × 10⁸ m/s)', explanation: 'ν = c/λ' });
    expect(h[0]).toMatch(/speed of light/);
    expect(h[0]).toMatch(/exam may not/);
    expect(h[0]).not.toMatch(/3\.00/);
  });

  it('every new Exam 3 generator yields at least one hint and never leaks a constant value', () => {
    for (const id of ['chem1-06q-light-calcs', 'chem1-06q-shell-counts', 'chem1-06q-isoelectronic']) {
      for (let s = 0; s < 200; s++) {
        const q = generateChemInstance(id, s);
        const h = chemHints(q, 'x');
        expect(h.length).toBeGreaterThan(0);
        expect(h.join(' ')).not.toMatch(/6\.626|3\.00 × 10⁸|1\.097|6\.022/);
      }
    }
  });
});
