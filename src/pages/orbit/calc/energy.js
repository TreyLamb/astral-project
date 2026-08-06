// Orbit gas-tank energy model (guidelinesScheduler.md §4/§8) — pure calc, no
// storage/React. Energy is a tank that drains 1:1 as tasks are done; a hard
// day reduces tomorrow's starting capacity (cross-day fatigue). Task drain can
// rise with midday heat (heatMultiplier) — that's the TASK costing more, not
// a circadian/body-clock curve (explicitly rejected model, see the doc). Also
// covers the adjacent estWorkMin/estRecoveryMin duration-learning helpers
// (§8) since blockMinutes needs both energy and time to size a task's block.

const DEFAULT_FATIGUE = { thresholdPct: 0.7, carryFactor: 0.5, maxCarryPct: 0.5 };

const DEFAULT_CATEGORY_WORK_MIN = {
  errand: 30,
  shopping: 45,
  'deep-work': 90,
  admin: 30,
  physical: 60,
  outdoor: 120,
  chore: 30,
  call: 20,
  health: 30,
};

const GLOBAL_DEFAULT_WORK_MIN = 30;
const DEFAULT_RECOVERY_MIN = 10;

// Tomorrow's tank = today's capacity minus a carry that only kicks in once
// yesterday's load passed thresholdPct of C, ramping linearly and capped at
// maxCarryPct — a brutal 100%-drained day still leaves half a tank, it never
// zeroes out.
export function startingTank(capacity, yesterdayLoad, fatigueCfg = {}) {
  const { thresholdPct = 0.7, carryFactor = 0.5, maxCarryPct = 0.5 } = fatigueCfg;
  if (capacity <= 0) return capacity; // guard: nothing to fatigue against

  const loadPct = capacity > 0 ? yesterdayLoad / capacity : 0;
  if (loadPct <= thresholdPct || 1 - thresholdPct <= 0) return capacity;

  const slope = (carryFactor * (loadPct - thresholdPct)) / (1 - thresholdPct);
  const carry = Math.min(maxCarryPct, slope) * capacity;
  return capacity - carry;
}

// Time-of-day heat proxy, not weather — a hill centered on the midpoint of
// [peakStart, peakEnd] (edges = 1.0, matching "cool early/late, hot midday"),
// so it ramps up monotonically approaching the center and back down leaving
// it, rather than a step function. tempF (when known) adds real heat on top,
// but the whole thing is hard-capped at 1.5 regardless of input.
export function heatMultiplier(hourOfDay, opts = {}) {
  const { peakStart = 11, peakEnd = 16, maxMultiplier = 1.3, tempF = null } = opts;

  let base = 1.0;
  const halfWidth = (peakEnd - peakStart) / 2;
  if (halfWidth > 0) {
    const mid = (peakStart + peakEnd) / 2;
    const distance = Math.abs(hourOfDay - mid);
    const t = Math.max(0, 1 - distance / halfWidth); // 0 at/beyond the window edge, 1 at center
    base = 1.0 + (maxMultiplier - 1.0) * t;
  }

  let total = base;
  if (typeof tempF === 'number' && tempF > 85) {
    total += (tempF - 85) * 0.01; // ~+0.2 at 105F
  }
  return Math.min(1.5, Math.max(1.0, total));
}

// Rain is a hard constraint handled elsewhere (guardrails/weather-avoid) —
// this only ever returns a heat-driven multiplier or a flat 1.0.
export function conditionMultiplier(task, slot) {
  if (task.indoorOutdoor === 'outdoor' || task.weatherSensitive) {
    return heatMultiplier(slot.hourOfDay, { tempF: slot.tempF });
  }
  return 1.0;
}

export function energyCost(task, slot = { hourOfDay: 9 }) {
  const baseIntensity = task.intensity ?? task.energy ?? 3;
  return baseIntensity * conditionMultiplier(task, slot);
}

export function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+$/g, '');
}

function durationDbValue(entry) {
  if (!entry) return undefined;
  if (entry.medianMin != null) return entry.medianMin;
  if (entry.lastActualMin != null) return entry.lastActualMin;
  return undefined; // entry exists but carries no usable sample yet — fall through
}

// Priority: user-specified > learned duration DB (by title, then by
// category) > category default > global default. AI estimation (doc's third
// rung) lives outside this pure module — it isn't a deterministic function.
export function estimateWorkMin(task, durationDb = [], categoryDefaults = DEFAULT_CATEGORY_WORK_MIN) {
  if (task.estWorkMin != null) return task.estWorkMin;
  if (task.timeMin != null) return task.timeMin;

  const key = normalizeTitle(task.title);
  const byKey = durationDbValue(durationDb.find((d) => d.key === key));
  if (byKey !== undefined) return byKey;

  const byCategory = durationDbValue(durationDb.find((d) => d.category === task.category));
  if (byCategory !== undefined) return byCategory;

  return categoryDefaults[task.category] ?? GLOBAL_DEFAULT_WORK_MIN;
}

export function recoveryMin(task, energySpent, defaultRecoveryMin = DEFAULT_RECOVERY_MIN) {
  if (task.estRecoveryMin != null) return task.estRecoveryMin;
  const raw = Math.round(defaultRecoveryMin * (energySpent / 3));
  return Math.min(60, Math.max(0, raw));
}

export function blockMinutes(task, slot, opts = {}) {
  const workMin = estimateWorkMin(task, opts.durationDb, opts.categoryDefaults);
  const spent = energyCost(task, slot);
  return workMin + recoveryMin(task, spent, opts.defaultRecoveryMin);
}
