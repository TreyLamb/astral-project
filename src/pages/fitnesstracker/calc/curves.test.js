import { describe, it, expect } from 'vitest';
import { cardioCurve, strengthCurve, bodyCompCurve, genericCurve, curveFor } from './curves';

describe('cardioCurve', () => {
  it('endpoints are exact: frac=0 -> baseline, frac=1 -> target', () => {
    const vals = cardioCurve(40, 50, [0, 1]);
    expect(vals[0]).toBeCloseTo(40, 6);
    expect(vals[1]).toBeCloseTo(50, 6);
  });
  it('is front-loaded (diminishing returns): mid-fraction gain exceeds the linear interpolation', () => {
    const [linear25] = genericCurve(0, 100, [0.25]);
    const [curve25] = cardioCurve(0, 100, [0.25]); // gamma=0.6 default
    expect(curve25).toBeCloseTo(43.53, 1); // 0.25^0.6 * 100
    expect(curve25).toBeGreaterThan(linear25);
  });
});

describe('strengthCurve', () => {
  it('is flat-linear up to the plateau fraction, then holds flat', () => {
    const vals = strengthCurve(100, 200, [0, 0.35, 0.7, 0.85, 1], 0.7);
    expect(vals[0]).toBeCloseTo(100, 6);
    expect(vals[1]).toBeCloseTo(150, 6); // 0.35/0.7 = 0.5 of the way
    expect(vals[2]).toBeCloseTo(200, 6); // reaches target exactly at the plateau fraction
    expect(vals[3]).toBeCloseTo(200, 6); // holds flat past the plateau
    expect(vals[4]).toBeCloseTo(200, 6);
  });
});

describe('bodyCompCurve', () => {
  it('is exactly linear in absolute weight', () => {
    const vals = bodyCompCurve(90, 80, [0, 0.5, 1]);
    expect(vals[0]).toBeCloseTo(90, 6);
    expect(vals[1]).toBeCloseTo(85, 6);
    expect(vals[2]).toBeCloseTo(80, 6);
  });
});

describe('curveFor', () => {
  it('routes run/swim to cardioCurve, lift to strengthCurve, weight to bodyCompCurve, else generic', () => {
    expect(curveFor('run', 0, 100, [0.25])[0]).toBeCloseTo(43.53, 1);
    expect(curveFor('swim', 0, 100, [0.25])[0]).toBeCloseTo(43.53, 1);
    expect(curveFor('lift', 100, 200, [0.7])[0]).toBeCloseTo(200, 6);
    expect(curveFor('weight', 90, 80, [0.5])[0]).toBeCloseTo(85, 6);
    expect(curveFor('generic', 0, 100, [0.25])[0]).toBeCloseTo(25, 6);
  });
});
