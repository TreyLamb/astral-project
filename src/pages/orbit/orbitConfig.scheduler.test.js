// Phase-1 scheduler foundation (Guidelines_Scheduler.md §3): new task fields,
// scheduler settings normalization, and the five new DB factories. Pure data
// model — no placement logic here (that arrives with calc/energy, calc/travel,
// calc/scheduler in later phases).
import { describe, it, expect } from 'vitest';
import {
  newTask, withTaskDefaults,
  defaultSettings, withSettingsDefaults,
  newPlace, withPlaceDefaults, newBase, withBaseDefaults,
  nextBaseColor, BASE_COLOR_SLOTS, PEARL_EASTER_COLORS,
  newDurationEntry, newWeatherEntry, newRule, newTravelLogEntry,
} from './orbitConfig';

describe('newTask — scheduler annotation fields (§3.1)', () => {
  it('adds every new field with a safe default and does not require any of them', () => {
    const t = newTask({ title: 'paint truck' });
    expect(t).toMatchObject({
      category: null,
      intensity: null,
      indoorOutdoor: null,
      weatherSensitive: false,
      perishable: false,
      locationId: null,
      estWorkMin: null,
      estRecoveryMin: null,
      idealWindow: null,
      batchKey: null,
      constraints: [],
    });
  });

  it('does not store a flat energyCost — it is computed at placement time (§3.1/§4)', () => {
    expect(newTask({ title: 'x' })).not.toHaveProperty('energyCost');
  });

  it('passes through supplied annotations and preserves the existing 1-5 model', () => {
    const t = newTask({
      title: 'buy cold groceries',
      category: 'shopping',
      intensity: 2,
      indoorOutdoor: 'indoor',
      perishable: true,
      idealWindow: 'evening',
      estWorkMin: 25,
      energy: 3,
      importance: 4,
    });
    expect(t.category).toBe('shopping');
    expect(t.perishable).toBe(true);
    expect(t.estWorkMin).toBe(25);
    expect(t.energy).toBe(3); // legacy field untouched
    expect(t.priorityScore).toBeGreaterThan(0);
  });

  it('coerces a non-array constraints value to []', () => {
    expect(newTask({ constraints: 'nope' }).constraints).toEqual([]);
  });
});

describe('withTaskDefaults — backfills pre-scheduler rows', () => {
  it('fills missing scheduler fields on an old stored task without dropping its data', () => {
    const old = { id: 'o1', title: 'legacy', status: 'todo', importance: 3, urgency: 3, difficulty: 3, energy: 2, createdAt: 1 };
    const norm = withTaskDefaults(old);
    expect(norm.title).toBe('legacy');
    expect(norm.energy).toBe(2);
    expect(norm).toMatchObject({
      category: null, intensity: null, indoorOutdoor: null,
      weatherSensitive: false, perishable: false, locationId: null,
      estWorkMin: null, estRecoveryMin: null, idealWindow: null,
      batchKey: null, constraints: [],
    });
  });

  it('keeps already-set scheduler values intact', () => {
    const norm = withTaskDefaults({ id: 'o2', title: 't', category: 'errand', weatherSensitive: true, constraints: [{ type: 'notAfter' }] });
    expect(norm.category).toBe('errand');
    expect(norm.weatherSensitive).toBe(true);
    expect(norm.constraints).toHaveLength(1);
  });
});

describe('scheduler settings (§4/§5/§6/§7)', () => {
  it('defaultSettings carries homeZip, gas-tank fatigue, guardrails, and the cost guard', () => {
    const s = defaultSettings();
    expect(s.homeZip).toBe('');
    expect(s.scheduler.fatigue).toMatchObject({ thresholdPct: 0.7, carryFactor: 0.5, maxCarryPct: 0.5 });
    expect(s.scheduler.guardrails.awake).toEqual(['07:00', '22:00']);
    expect(s.scheduler.guardrails.byCategory.shopping).toEqual(['09:00', '20:00']);
    expect(s.scheduler.defaultRecoveryMin).toBe(10);
    expect(s.scheduler.weatherAvoidPrecipPct).toBe(50);
    expect(s.googleCostGuard).toMatchObject({ monthlyElementCap: 8000, elementsUsedThisMonth: 0, seedingEnabled: false });
  });

  it('does NOT introduce a separate 100-point energy scale — tank capacity stays capacityDefault.energy', () => {
    const s = defaultSettings();
    expect(s.capacityDefault.energy).toBe(15);
    expect(s.scheduler).not.toHaveProperty('energyTank');
  });

  it('withSettingsDefaults deep-merges a partial scheduler override, keeping untouched defaults', () => {
    const merged = withSettingsDefaults({
      scheduler: { fatigue: { carryFactor: 0.8 }, guardrails: { byCategory: { gym: ['06:00', '21:00'] } } },
    });
    // overridden value wins
    expect(merged.scheduler.fatigue.carryFactor).toBe(0.8);
    // sibling fatigue defaults survive
    expect(merged.scheduler.fatigue.thresholdPct).toBe(0.7);
    // new category added AND the default categories preserved
    expect(merged.scheduler.guardrails.byCategory.gym).toEqual(['06:00', '21:00']);
    expect(merged.scheduler.guardrails.byCategory.shopping).toEqual(['09:00', '20:00']);
    // awake window untouched default
    expect(merged.scheduler.guardrails.awake).toEqual(['07:00', '22:00']);
  });

  it('withSettingsDefaults leaves the legacy fields alone', () => {
    const merged = withSettingsDefaults({ importanceWeight: 5 });
    expect(merged.importanceWeight).toBe(5);
    expect(merged.homeZip).toBe('');
    expect(merged.scheduler.defaultRecoveryMin).toBe(10);
  });

  it('seeds OREM + PARIS starter bases + empty dayLocations, and carries them through a patch', () => {
    const s = defaultSettings();
    expect(s.dayLocations).toEqual({});
    expect(s.bases.map((b) => b.tag)).toEqual(['OREM', 'PARIS']);
    expect(s.bases[0]).toMatchObject({ tag: 'OREM', isHome: true });
    expect(s.bases[1]).toMatchObject({ tag: 'PARIS', isHome: false, query: 'Paris, Idaho' });
    expect(s.bases[0].lat).not.toBeNull(); // pre-geocoded, works offline
    // fresh/empty registry re-seeds the full starter set
    expect(withSettingsDefaults({ bases: [] }).bases.map((b) => b.tag)).toEqual(['OREM', 'PARIS']);
    expect(withSettingsDefaults({}).bases.map((b) => b.tag)).toEqual(['OREM', 'PARIS']);
    // …but a stored home base is preserved (no duplicate seed), and a patch that
    // never mentions bases/dayLocations must NOT drop them.
    const stored = withSettingsDefaults({
      bases: [{ id: 'b1', tag: 'paris', query: 'Paris, Utah', lat: 42.2, lng: -111.4, isHome: true }],
      dayLocations: { '2026-08-01': 'b1' },
    });
    expect(stored.bases).toHaveLength(1);
    const afterUnrelatedPatch = withSettingsDefaults({ ...stored, importanceWeight: 4 });
    expect(afterUnrelatedPatch.dayLocations).toEqual({ '2026-08-01': 'b1' });
    expect(afterUnrelatedPatch.bases[0]).toMatchObject({ id: 'b1', tag: 'PARIS', isHome: true });
  });
});

describe('scheduler DB factories (§3.2)', () => {
  it('newPlace defaults an ungeocoded user place', () => {
    const p = newPlace({ name: 'Home' });
    expect(p).toMatchObject({ name: 'Home', lat: null, lng: null, zip: null, source: 'user', openHours: null, geocodedAt: null });
    expect(p.id).toBeTruthy();
  });

  it('withPlaceDefaults backfills an older place row', () => {
    expect(withPlaceDefaults({ id: 'p1', name: 'Store' })).toMatchObject({ lat: null, lng: null, source: 'user', geocodedAt: null });
  });

  it('newBase uppercases the tag, keeps the disambiguated query, defaults ungeocoded', () => {
    const b = newBase({ tag: 'paris', query: 'Paris, Utah' });
    expect(b).toMatchObject({ tag: 'PARIS', query: 'Paris, Utah', lat: null, lng: null, isHome: false, geocodedAt: null });
    expect(b.id).toBeTruthy();
  });

  it('newBase falls back to the tag as its own query when none is given', () => {
    expect(newBase({ tag: 'Hawaii' }).query).toBe('Hawaii');
  });

  it('withBaseDefaults backfills + normalizes an older base row', () => {
    expect(withBaseDefaults({ id: 'b1', tag: 'orem' })).toMatchObject({ tag: 'OREM', query: 'orem', lat: null, lng: null, isHome: false });
  });

  it('assigns per-base outline colors: fixed slots then a pearlescent pastel', () => {
    // fixed first three (cyan → magenta → neon-orange)
    expect(nextBaseColor(0)).toBe(BASE_COLOR_SLOTS[0]);
    expect(nextBaseColor(1)).toBe(BASE_COLOR_SLOTS[1]);
    expect(nextBaseColor(2)).toBe(BASE_COLOR_SLOTS[2]);
    // fourth+ is a pastel from the easter palette
    expect(PEARL_EASTER_COLORS).toContain(nextBaseColor(3));
    expect(PEARL_EASTER_COLORS).toContain(nextBaseColor(9));
    // seeds carry their fixed colors; newBase honors an explicit color, else cyan
    expect(defaultSettings().bases[0].color).toBe('#67e8f9');
    expect(defaultSettings().bases[1].color).toBe('#f472b6');
    expect(newBase({ tag: 'x' }).color).toBe(BASE_COLOR_SLOTS[0]);
    expect(newBase({ tag: 'x', color: '#abcdef' }).color).toBe('#abcdef');
    // a pre-color PARIS row backfills to magenta by id
    expect(withBaseDefaults({ id: 'paris-id', tag: 'PARIS' }).color).toBe('#f472b6');
  });

  it('newDurationEntry uses its key as identity for idempotent upserts', () => {
    const d = newDurationEntry({ key: 'paint truck', samples: [110, 130] });
    expect(d.id).toBe('paint truck');
    expect(d.key).toBe('paint truck');
    expect(d.samples).toEqual([110, 130]);
    expect(d.medianMin).toBeNull();
  });

  it('newWeatherEntry keys by date and defaults to an Open-Meteo empty forecast', () => {
    const w = newWeatherEntry({ date: '2026-07-25' });
    expect(w).toMatchObject({ date: '2026-07-25', locationId: null, hourly: [], source: 'open-meteo' });
  });

  it('newRule builds a policy rule with a forbid default', () => {
    const r = newRule({ subject: 'perishable', relation: 'notAfter', object: 'category:outdoor' });
    expect(r).toMatchObject({ subject: 'perishable', relation: 'notAfter', object: 'category:outdoor', action: 'forbid', active: true });
    expect(r.id).toBeTruthy();
  });

  it('newTravelLogEntry uses its composite key as identity and defaults source google', () => {
    const e = newTravelLogEntry({ key: 'home|store|2|14', origin: 'home', dest: 'store', weekday: 2, hourBucket: 14 });
    expect(e.id).toBe('home|store|2|14');
    expect(e).toMatchObject({ origin: 'home', dest: 'store', weekday: 2, hourBucket: 14, source: 'google', samples: [] });
  });
});
