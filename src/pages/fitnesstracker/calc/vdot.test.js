import { describe, it, expect } from 'vitest';
import { vdotFromRace, trainingPaces, equivalentRaceTime, vo2AtVelocity, pctVo2max } from './vdot';
import { M_PER_MILE } from '../units';

const perMile = (secPerM) => secPerM * M_PER_MILE;

describe('VDOT core equations', () => {
  it('VO2 at 250 m/min ≈ 47.46', () => {
    expect(vo2AtVelocity(250)).toBeCloseTo(47.4645, 3);
  });
  it('%VO2max at 20 min ≈ 0.953', () => {
    expect(pctVo2max(20)).toBeCloseTo(0.9530, 3);
  });
  it('20:00 5K ≈ VDOT 50 (spec reference value)', () => {
    const v = vdotFromRace(5000, 1200);
    expect(v).toBeGreaterThan(49);
    expect(v).toBeLessThan(51);
  });
});

describe('Daniels training paces (reproduce the VDOT-50 table)', () => {
  const p = trainingPaces(50);
  it('Threshold ≈ 6:51/mi', () => {
    expect(perMile(p.T)).toBeGreaterThan(406);
    expect(perMile(p.T)).toBeLessThan(416);
  });
  it('Marathon ≈ 7:06/mi', () => {
    expect(perMile(p.M)).toBeGreaterThan(420);
    expect(perMile(p.M)).toBeLessThan(432);
  });
  it('Interval ≈ 6:10/mi', () => {
    expect(perMile(p.I)).toBeGreaterThan(364);
    expect(perMile(p.I)).toBeLessThan(376);
  });
  it('Repetition ≈ 5:40/mi', () => {
    expect(perMile(p.R)).toBeGreaterThan(332);
    expect(perMile(p.R)).toBeLessThan(348);
  });
  it('Easy range ≈ 8:14–9:04/mi', () => {
    expect(perMile(p.E[1])).toBeGreaterThan(486); // fast end ~8:06
    expect(perMile(p.E[1])).toBeLessThan(502);     // ~8:22
    expect(perMile(p.E[0])).toBeGreaterThan(534);  // slow end ~8:54
    expect(perMile(p.E[0])).toBeLessThan(554);      // ~9:14
  });
  it('paces order slowest→fastest E>M>T>I>R', () => {
    expect(p.E[0]).toBeGreaterThan(p.M);
    expect(p.M).toBeGreaterThan(p.T);
    expect(p.T).toBeGreaterThan(p.I);
    expect(p.I).toBeGreaterThan(p.R);
  });
});

describe('equivalent race times from VDOT', () => {
  it('is self-consistent at 5K for VDOT 50 (~20:00)', () => {
    expect(equivalentRaceTime(50, 5000)).toBeCloseTo(1200, -1); // within ~10s
  });
  it('predicts a VDOT-50 10K around 41–42:30', () => {
    const t = equivalentRaceTime(50, 10000);
    expect(t).toBeGreaterThan(2460); // 41:00
    expect(t).toBeLessThan(2550);    // 42:30
  });
});
