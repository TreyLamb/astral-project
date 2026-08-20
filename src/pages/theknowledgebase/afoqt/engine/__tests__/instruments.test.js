// Instrument Comprehension (Phase 6).
//
// The whole subtest hangs on four conventions, and three of them are counter-intuitive enough
// that getting one backwards would produce a tool that trains the WRONG reflex while every
// question still looked plausible. So each is asserted directly against the AFPC pamphlet's own
// wording rather than against the implementation:
//
//   BANK IS INVERTED     "banked to the pilot's RIGHT, the pointer is seen to the LEFT of zero"
//   CLIMB IS THE MIDDLE  "if the airplane is climbing, the fuselage silhouette is seen between
//                         the horizon line and the pointer"
//   LOOKING NORTH        "EAST IS ALWAYS TO YOUR RIGHT AS YOU LOOK AT THE PAGE"
//   FOUR OPTIONS         the only subtest on the test that does not offer five
//
// One bug this file exists to have caught: the body-axis cross product was the wrong way round,
// so a right bank RAISED the right wing. Every bank distractor was therefore the correct answer
// and every correct answer was a distractor - and nothing about the generated questions looked
// wrong from the outside.

import { describe, it, expect } from 'vitest';
import '../../templates';
import { templatesFor, generateInstance } from '../generator';
import { auditTemplate } from '../templateAudit';
import { assembleDrill } from '../drill';
import { mulberry32 } from '../../../engine/rng';
import { getChapter } from '../../curriculum/chapters';
import { LESSONS } from '../../curriculum/lessons';
import { getSubtest } from '../afoqtSpec';
import {
  bodyAxes, project, silhouettePolys, pointerAngle, horizonOffset, optionSet,
  HEADINGS, PITCHES, BANKS, describe as describeAttitude,
} from '../attitude';

const templates = templatesFor('IC');
const ALL = HEADINGS.flatMap((h) => PITCHES.flatMap((p) => BANKS.map((b) =>
  ({ heading: h.deg, pitch: p.deg, bank: b.deg }))));

/** Shoelace area of the projected silhouette - a collapsed, invisible option is near zero. */
const projectedArea = (a) => silhouettePolys(a).reduce((total, part) => {
  const pts = part.points;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return total + Math.abs(s) / 2;
}, 0);

describe('the viewing convention', () => {
  const nose = (a) => project(bodyAxes(a).nose);
  const wing = (a) => project(bodyAxes(a).wing);

  it('puts east to the right of the page and west to the left', () => {
    expect(nose({ heading: 90, pitch: 0, bank: 0 }).x).toBeGreaterThan(0.5);
    expect(nose({ heading: 270, pitch: 0, bank: 0 }).x).toBeLessThan(-0.5);
  });

  it('flies a northbound aircraft AWAY from the viewer and a southbound one TOWARD', () => {
    // Depth is distance from the viewer, so a rear view recedes and a front view approaches.
    expect(nose({ heading: 0, pitch: 0, bank: 0 }).depth).toBeGreaterThan(0.5);
    expect(nose({ heading: 180, pitch: 0, bank: 0 }).depth).toBeLessThan(-0.5);
  });

  it('drops the RIGHT wing on a right bank', () => {
    // The bug this catches: `nose x wing` instead of `wing x nose` mirrors every banked
    // aircraft, which silently swaps the answer with its own distractor.
    for (const heading of [0, 45, 90, 180, 270]) {
      expect(wing({ heading, pitch: 0, bank: 45 }).y, `heading ${heading}`).toBeGreaterThan(0);
      expect(wing({ heading, pitch: 0, bank: -45 }).y, `heading ${heading}`).toBeLessThan(0);
    }
  });

  it('raises the nose in a climb and lowers it in a dive', () => {
    expect(nose({ heading: 90, pitch: 25, bank: 0 }).y).toBeLessThan(0); // negative y is up
    expect(nose({ heading: 90, pitch: -25, bank: 0 }).y).toBeGreaterThan(0);
  });
});

describe('the artificial horizon', () => {
  // ⚠ The trap the whole subtest is built on.
  it('INVERTS the bank pointer', () => {
    expect(pointerAngle(45)).toBeLessThan(0); // banked right -> pointer LEFT of zero
    expect(pointerAngle(-45)).toBeGreaterThan(0); // banked left -> pointer RIGHT of zero
    expect(pointerAngle(0)).toBe(0);
  });

  it('puts the horizon BELOW the silhouette in a climb', () => {
    // "the fuselage silhouette is seen between the horizon line and the pointer" - the pointer
    // is at the top of the dial, so the horizon has to be underneath.
    expect(horizonOffset(25)).toBeGreaterThan(0); // positive is down the page
    expect(horizonOffset(-25)).toBeLessThan(0);
    expect(horizonOffset(0)).toBe(0);
  });

  it('grows the horizon displacement with the steepness', () => {
    expect(Math.abs(horizonOffset(45))).toBeGreaterThan(Math.abs(horizonOffset(15)));
  });
});

describe('every silhouette is actually visible', () => {
  // The failure this guards against was real and shipped: with the camera exactly level and
  // exactly on the north axis, a 90-degree-banked northbound aircraft projected to a single line
  // and two of the four options rendered as an invisible stroke.
  const mean = ALL.reduce((n, a) => n + projectedArea(a), 0) / ALL.length;

  it.each(ALL.map((a) => [describeAttitude(a), a]))('%s has a readable outline', (_label, a) => {
    expect(projectedArea(a)).toBeGreaterThan(mean * 0.15);
  });

  it('draws all 120 attitudes as visibly distinct shapes', () => {
    const seen = new Map();
    for (const a of ALL) {
      const sig = silhouettePolys(a)
        .flatMap((p) => p.points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)).join('|');
      expect(seen.has(sig), `${describeAttitude(a)} renders identically to ${seen.get(sig)}`).toBe(false);
      seen.set(sig, describeAttitude(a));
    }
  });
});

describe('the official distractor formula', () => {
  it('offers a rear view, a front view and the wrong bank', () => {
    const opts = optionSet({ heading: 135, pitch: 0, bank: 45 });
    const errs = opts.slice(1, 4).map((o) => o.error);
    expect(errs).toContain('rear-view');
    expect(errs).toContain('front-view');
    expect(errs).toContain('bank-inverted');
  });

  it('makes the rear view head north and the front view head south', () => {
    const opts = optionSet({ heading: 45, pitch: 25, bank: -45 });
    expect(opts.find((o) => o.error === 'rear-view').attitude.heading).toBe(0);
    expect(opts.find((o) => o.error === 'front-view').attitude.heading).toBe(180);
  });

  it('never repeats an attitude, so no two options can both be right', () => {
    for (const a of ALL) {
      const opts = optionSet(a);
      const keys = opts.map((o) => `${o.attitude.heading}/${o.attitude.pitch}/${o.attitude.bank}`);
      expect(new Set(keys).size, describeAttitude(a)).toBe(keys.length);
    }
  });

  it('can always fill a four-option slate', () => {
    for (const a of ALL) expect(optionSet(a).length, describeAttitude(a)).toBeGreaterThanOrEqual(4);
  });
});

describe('every Instrument Comprehension template', () => {
  it('registered six of them across bands 1-4', () => {
    expect(templates).toHaveLength(6);
    expect([...new Set(templates.map((t) => t.band))].sort()).toEqual([1, 2, 3, 4]);
  });

  it.each(templates.map((t) => [t.id, t]))('%s holds the structural contract', (_id, t) => {
    expect(auditTemplate(t, { samples: 600 }).problems).toEqual([]);
  });

  // The only subtest on the whole test that does not offer five.
  it('offers exactly FOUR options, never five', () => {
    expect(getSubtest('IC').choices).toBe(4);
    for (const t of templates) {
      for (let seed = 0; seed < 60; seed++) {
        expect(generateInstance(t.id, seed).choices, t.id).toHaveLength(4);
      }
    }
  });

  it('ships a figure for the dials and one for every option', () => {
    for (const t of templates.filter((x) => x.id !== 'ic-pointer')) {
      for (let seed = 0; seed < 30; seed++) {
        const q = generateInstance(t.id, seed);
        expect(q.render.kind).toBe('instrument');
        expect(q.optionRender).toHaveLength(4);
        for (const r of q.optionRender) expect(r.kind).toBe('silhouette');
      }
    }
  });

  it('marks the option that actually matches the dials', () => {
    // Do not trust the generator's own index - re-derive the answer from the render payload.
    for (const t of templates.filter((x) => x.id !== 'ic-pointer')) {
      for (let seed = 0; seed < 60; seed++) {
        const q = generateInstance(t.id, seed);
        const marked = q.optionRender[q.correctIndex];
        expect(marked.heading, t.id).toBe(q.render.heading);
        expect(marked.pitch, t.id).toBe(q.render.pitch);
        expect(marked.bank, t.id).toBe(q.render.bank);
      }
    }
  });

  it('keeps the technique drill out of any exam run', () => {
    const qs = assembleDrill({ subtest: 'IC', count: 25, rng: mulberry32(4), exam: true });
    expect(qs.map((q) => q.templateId)).not.toContain('ic-pointer');
    expect(new Set(qs.map((q) => q.templateId))).toEqual(new Set(['ic-attitude']));
  });
});

describe('the Instrument Comprehension chapter', () => {
  const ch = getChapter('ic-01-instruments');

  it('exists, needs a clean sweep, and teaches what it tests', () => {
    expect(ch).toBeTruthy();
    // 5/5, because the inverted pointer is one fact that inverts an entire subtest.
    expect(ch.testOutPass).toBe(5);
    const tested = new Set(templates.flatMap((t) => t.concepts));
    for (const c of ch.concepts) expect(tested.has(c), `${c} is taught but untested`).toBe(true);
  });

  it('has a lesson that leads with the inverted pointer and the north convention', () => {
    const lesson = LESSONS['ic-01-instruments'];
    expect(lesson.length).toBeGreaterThan(2000);
    expect(lesson).toMatch(/INVERTED/);
    expect(lesson).toMatch(/LOOKING NORTH/);
    expect(lesson).toMatch(/FOUR answer options|four aircraft|FOUR/);
  });
});
