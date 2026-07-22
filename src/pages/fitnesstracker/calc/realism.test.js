import { describe, it, expect } from 'vitest';
import { realismScore, realismScoreLift, REALISM_BOUNDS } from './realism';

describe('realismScore — weight (ISSN/Helms-derived bounds)', () => {
  it('0.4%/week loss is conservative (well within the 0.5-0.75% ISSN range)', () => {
    expect(realismScore('weight', 0.004, 'loss').band).toBe('conservative');
  });
  it('0.9%/week loss is plausible (above the ISSN ceiling but within the stretch band)', () => {
    expect(realismScore('weight', 0.009, 'loss').band).toBe('plausible');
  });
  it('1.5%/week loss is implausible (well past the ISSN ceiling)', () => {
    expect(realismScore('weight', 0.015, 'loss').band).toBe('implausible');
  });
  it('gain has a stricter (lower) ceiling than loss, per Helms lean-bulk research', () => {
    expect(REALISM_BOUNDS.weight_gain.plausibleWeeklyPct).toBeLessThan(REALISM_BOUNDS.weight_loss.plausibleWeeklyPct);
  });
});

describe('realismScore — cardio (run/swim)', () => {
  it('bands escalate with rate', () => {
    expect(realismScore('run', 0.001, null).band).toBe('conservative');
    expect(realismScore('run', 0.002, null).band).toBe('plausible');
    expect(realismScore('run', 0.005, null).band).toBe('implausible');
  });
  it('is direction-agnostic (abs value) — a fast pace DROP scores the same as an equivalent VDOT rise', () => {
    expect(realismScore('swim', -0.002, null).band).toBe(realismScore('swim', 0.002, null).band);
  });
});

describe('realismScoreLift — absolute kg/week, not %/week', () => {
  it('is scored on a different (absolute) unit than the proportional domains, per the spec\'s own warning against one-size-fits-all curves', () => {
    expect(realismScoreLift(1.0).band).toBe('conservative');
    expect(realismScoreLift(3.0).band).toBe('plausible');
    expect(realismScoreLift(6.0).band).toBe('implausible');
  });
});

describe('realismScore — null input', () => {
  it('returns null rather than throwing when no rate is available', () => {
    expect(realismScore('run', null, null)).toBeNull();
    expect(realismScoreLift(null)).toBeNull();
  });
});
