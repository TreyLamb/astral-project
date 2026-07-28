import { describe, it, expect } from 'vitest';
import {
  startingTank,
  heatMultiplier,
  conditionMultiplier,
  energyCost,
  normalizeTitle,
  estimateWorkMin,
  recoveryMin,
  blockMinutes,
} from './energy';

describe('startingTank', () => {
  it('returns capacity unchanged when yesterday load is at or below the fatigue threshold', () => {
    expect(startingTank(10, 7)).toBe(10); // loadPct === thresholdPct (0.7)
    expect(startingTank(10, 3)).toBe(10); // well below threshold
  });

  it('returns exactly half the tank when yesterday fully drained it (default fatigue cfg)', () => {
    expect(startingTank(10, 10)).toBe(5);
    expect(startingTank(15, 15, {})).toBe(7.5);
  });

  it('returns a partial carry for a load between threshold and full', () => {
    // loadPct 0.85: slope = 0.5*(0.85-0.7)/0.3 = 0.25 -> carry = 0.25*C
    expect(startingTank(10, 8.5)).toBe(7.5);
  });

  it('caps the carry at maxCarryPct even for an extreme overload beyond the tank', () => {
    // loadPct 3 would produce slope > 1 without the cap
    expect(startingTank(10, 30)).toBe(5); // capped at default maxCarryPct 0.5
  });

  it('guards capacity <= 0 by returning it unchanged', () => {
    expect(startingTank(0, 5)).toBe(0);
    expect(startingTank(-3, 5)).toBe(-3);
  });

  it('applies defaults for a missing or partial fatigueCfg', () => {
    expect(startingTank(10, 10, undefined)).toBe(5);
    expect(startingTank(10, 10, {})).toBe(5);
  });

  it('honors an overridden field while defaulting the rest of a partial cfg', () => {
    // loadPct 3, thresholdPct/carryFactor default (0.7/0.5) -> slope = 0.5*(3-0.7)/0.3 = 3.833
    // with default maxCarryPct 0.5 this would cap at 5; raising it to 0.9 should carry more.
    expect(startingTank(10, 30, { maxCarryPct: 0.9 })).toBe(1);
  });
});

describe('heatMultiplier', () => {
  it('returns 1.0 well outside the midday peak window', () => {
    expect(heatMultiplier(3)).toBe(1.0);
    expect(heatMultiplier(22)).toBe(1.0);
  });

  it('returns 1.0 exactly at the peak window edges', () => {
    expect(heatMultiplier(12, { peakStart: 12, peakEnd: 16, maxMultiplier: 1.3 })).toBeCloseTo(1.0, 10);
    expect(heatMultiplier(16, { peakStart: 12, peakEnd: 16, maxMultiplier: 1.3 })).toBeCloseTo(1.0, 10);
  });

  it('ramps continuously and monotonically up to the peak at the window center, then back down', () => {
    const opts = { peakStart: 12, peakEnd: 16, maxMultiplier: 1.3 };
    const at12 = heatMultiplier(12, opts);
    const at13 = heatMultiplier(13, opts);
    const at14 = heatMultiplier(14, opts); // center
    const at15 = heatMultiplier(15, opts);
    const at16 = heatMultiplier(16, opts);

    expect(at14).toBeCloseTo(1.3, 10); // hits maxMultiplier at the center
    expect(at12).toBeLessThan(at13);
    expect(at13).toBeLessThan(at14);
    expect(at14).toBeGreaterThan(at15);
    expect(at15).toBeGreaterThan(at16);
    expect(at13).toBeCloseTo(at15, 10); // symmetric around the center
  });

  it('stays within [1.0, maxMultiplier] when no tempF is supplied', () => {
    for (let h = 0; h < 24; h += 1) {
      const m = heatMultiplier(h);
      expect(m).toBeGreaterThanOrEqual(1.0);
      expect(m).toBeLessThanOrEqual(1.3);
    }
  });

  it('adds extra heat once tempF exceeds 85F, roughly +0.2 near 105F', () => {
    const opts = { peakStart: 12, peakEnd: 16, maxMultiplier: 1.3, tempF: 105 };
    expect(heatMultiplier(14, opts)).toBeCloseTo(1.5, 10); // 1.3 base + 0.2
  });

  it('ignores tempF at or below 85F', () => {
    const withCoolTemp = heatMultiplier(14, { peakStart: 12, peakEnd: 16, maxMultiplier: 1.3, tempF: 80 });
    const withoutTemp = heatMultiplier(14, { peakStart: 12, peakEnd: 16, maxMultiplier: 1.3 });
    expect(withCoolTemp).toBeCloseTo(withoutTemp, 10);
  });

  it('hard-caps the combined total at 1.5 even for an extreme tempF', () => {
    const opts = { peakStart: 12, peakEnd: 16, maxMultiplier: 1.3, tempF: 150 };
    expect(heatMultiplier(14, opts)).toBe(1.5);
  });

  it('lets a hot tempF push the multiplier above 1.0 even off-peak', () => {
    expect(heatMultiplier(3, { tempF: 105 })).toBeCloseTo(1.2, 10); // 1.0 base + 0.2
  });
});

describe('conditionMultiplier', () => {
  const slot = { hourOfDay: 14, tempF: 95 };

  it('returns 1.0 for an indoor, non-weather-sensitive task', () => {
    expect(conditionMultiplier({ indoorOutdoor: 'indoor' }, slot)).toBe(1.0);
    expect(conditionMultiplier({}, slot)).toBe(1.0);
  });

  it('applies heatMultiplier for an outdoor task', () => {
    const expected = heatMultiplier(slot.hourOfDay, { tempF: slot.tempF });
    expect(conditionMultiplier({ indoorOutdoor: 'outdoor' }, slot)).toBeCloseTo(expected, 10);
    expect(conditionMultiplier({ indoorOutdoor: 'outdoor' }, slot)).toBeGreaterThan(1.0);
  });

  it('applies heatMultiplier for a weatherSensitive task regardless of indoorOutdoor', () => {
    const expected = heatMultiplier(slot.hourOfDay, { tempF: slot.tempF });
    expect(conditionMultiplier({ indoorOutdoor: 'indoor', weatherSensitive: true }, slot)).toBeCloseTo(expected, 10);
  });

  it('does not fold precipProb into the multiplier (rain is a hard constraint elsewhere)', () => {
    const dry = conditionMultiplier({ indoorOutdoor: 'outdoor' }, { ...slot, precipProb: 0 });
    const soaked = conditionMultiplier({ indoorOutdoor: 'outdoor' }, { ...slot, precipProb: 0.9 });
    expect(dry).toBe(soaked);
  });
});

describe('energyCost', () => {
  it('costs more outdoors at midday than the same task indoors', () => {
    const slot = { hourOfDay: 14, tempF: 95 };
    const indoor = energyCost({ intensity: 4, indoorOutdoor: 'indoor' }, slot);
    const outdoor = energyCost({ intensity: 4, indoorOutdoor: 'outdoor' }, slot);
    expect(outdoor).toBeGreaterThan(indoor);
    expect(indoor).toBe(4);
  });

  it('falls back from intensity to energy to a flat 3', () => {
    expect(energyCost({ energy: 2, indoorOutdoor: 'indoor' })).toBe(2);
    expect(energyCost({ indoorOutdoor: 'indoor' })).toBe(3);
  });

  it('defaults the slot to hourOfDay 9 when omitted', () => {
    // hour 9 is outside the default peak window (11-16) -> multiplier 1.0
    expect(energyCost({ intensity: 5, indoorOutdoor: 'outdoor' })).toBe(5);
  });
});

describe('normalizeTitle', () => {
  it('lowercases, trims, collapses internal whitespace, and strips trailing punctuation', () => {
    expect(normalizeTitle('  Buy Milk!!  ')).toBe('buy milk');
    expect(normalizeTitle('Call   Mom,   Please.')).toBe('call mom, please');
    expect(normalizeTitle('Multiple   Spaces \t here')).toBe('multiple spaces here');
  });

  it('is null/empty safe', () => {
    expect(normalizeTitle(undefined)).toBe('');
    expect(normalizeTitle(null)).toBe('');
    expect(normalizeTitle('')).toBe('');
  });
});

describe('estimateWorkMin', () => {
  const durationDb = [
    { key: 'paint truck', category: 'chore', medianMin: 120 },
    { key: 'paint truck last only', category: 'chore', lastActualMin: 150 },
    { key: 'other thing', category: 'physical', medianMin: 75 },
  ];

  it('prefers a user-specified estWorkMin over everything else', () => {
    const task = { title: 'Paint Truck', category: 'chore', estWorkMin: 45, timeMin: 99 };
    expect(estimateWorkMin(task, durationDb)).toBe(45);
  });

  it('falls back to task.timeMin over the duration DB', () => {
    const task = { title: 'Paint Truck', category: 'chore', timeMin: 20 };
    expect(estimateWorkMin(task, durationDb)).toBe(20);
  });

  it('uses the duration DB medianMin by normalized title key over the category default', () => {
    const task = { title: '  Paint Truck  ', category: 'chore' }; // chore default is 30 — would be wrong if that won
    expect(estimateWorkMin(task, durationDb)).toBe(120);
  });

  it('falls back to lastActualMin when the key entry has no medianMin', () => {
    const task = { title: 'Paint Truck Last Only', category: 'chore' };
    expect(estimateWorkMin(task, durationDb)).toBe(150);
  });

  it('matches by category in the duration DB when no title key matches', () => {
    const task = { title: 'Something Totally Unique', category: 'physical' }; // physical default is 60
    expect(estimateWorkMin(task, durationDb)).toBe(75);
  });

  it('uses the category default when the duration DB has nothing relevant', () => {
    const task = { title: 'Random Task', category: 'admin' };
    expect(estimateWorkMin(task, [])).toBe(30);
  });

  it('uses the global default of 30 when nothing matches and there is no category', () => {
    const task = { title: 'Mystery' };
    expect(estimateWorkMin(task, [])).toBe(30);
  });

  it('honors a custom categoryDefaults override', () => {
    const task = { title: 'X', category: 'errand' };
    expect(estimateWorkMin(task, [], { errand: 99 })).toBe(99);
  });
});

describe('recoveryMin', () => {
  it('scales with energy spent relative to the /3 baseline', () => {
    expect(recoveryMin({}, 3, 10)).toBe(10);
    expect(recoveryMin({}, 6, 10)).toBe(20);
    expect(recoveryMin({}, 1.5, 10)).toBe(5);
  });

  it('uses the default of 10 when defaultRecoveryMin is omitted', () => {
    expect(recoveryMin({}, 3)).toBe(10);
  });

  it('is overridden entirely by task.estRecoveryMin regardless of energy spent', () => {
    expect(recoveryMin({ estRecoveryMin: 7 }, 999, 10)).toBe(7);
    expect(recoveryMin({ estRecoveryMin: 0 }, 999, 10)).toBe(0);
  });

  it('clamps to [0, 60]', () => {
    expect(recoveryMin({}, 100, 10)).toBe(60); // round(333) clamped down
    expect(recoveryMin({}, -5, 10)).toBe(0); // negative energySpent clamped up
  });
});

describe('blockMinutes', () => {
  it('composes estimateWorkMin and recoveryMin using a plain timeMin task', () => {
    const task = { title: 'Task', timeMin: 20, category: 'errand' };
    const slot = { hourOfDay: 9 };
    // energyCost: baseIntensity defaults to 3, indoor (no conditions) -> multiplier 1 -> spent 3
    // recovery: round(10 * (3/3)) = 10
    expect(blockMinutes(task, slot, {})).toBe(30);
  });

  it('threads durationDb, categoryDefaults, and defaultRecoveryMin through opts', () => {
    const task = { title: 'Paint Truck', category: 'chore' };
    const slot = { hourOfDay: 9 };
    const opts = {
      durationDb: [{ key: 'paint truck', category: 'chore', medianMin: 120 }],
      defaultRecoveryMin: 20,
    };
    // workMin 120, energyCost spent 3 (default intensity, indoor), recovery round(20*(3/3))=20
    expect(blockMinutes(task, slot, opts)).toBe(140);
  });

  it('respects estRecoveryMin overriding the computed recovery buffer', () => {
    const task = { title: 'X', timeMin: 15, estRecoveryMin: 5 };
    expect(blockMinutes(task, { hourOfDay: 9 }, {})).toBe(20);
  });

  it('defaults opts to {} when omitted', () => {
    const task = { title: 'Errand', timeMin: 10 };
    expect(blockMinutes(task, { hourOfDay: 9 })).toBe(20); // 10 work + round(10*(3/3))=10 recovery
  });
});
