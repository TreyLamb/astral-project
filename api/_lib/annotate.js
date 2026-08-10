// Pure logic for turning a task title into a validated scheduling annotation.
// NO imports of firebase/askAI/network here on purpose — this module is the
// "bounded structured extraction" piece described in guidelinesScheduler.md
// §1 and §15 ("AI annotates, script schedules"): it must be fully unit-
// testable in isolation from the network/auth plumbing that calls it.
//
// A bad AI reply must never crash or corrupt the schedule — parseAnnotation
// returns null on any failure, and validateAnnotation clamps/coerces every
// field to something safe, falling back to SAFE_DEFAULTS field-by-field.

export const SAFE_DEFAULTS = {
  category: null,
  intensity: 3,
  indoorOutdoor: 'indoor',
  weatherSensitive: false,
  perishable: false,
  estWorkMin: 30,
  estRecoveryMin: 10,
  idealWindow: 'any',
  locationName: null,
};

const CATEGORIES = ['errand', 'shopping', 'deep-work', 'admin', 'physical', 'outdoor', 'chore', 'call', 'health'];
const INDOOR_OUTDOOR = ['indoor', 'outdoor', 'either'];
const IDEAL_WINDOWS = ['morning', 'midday', 'afternoon', 'evening', 'any'];

export function buildAnnotationPrompt(title) {
  return [
    'You are annotating a single personal task for an auto-scheduler.',
    'Return ONLY a minified JSON object — no code fences, no commentary, no labels.',
    'The JSON object must have exactly these keys:',
    `- category: one of ${JSON.stringify(CATEGORIES)}, or null if none fits`,
    '- intensity: integer 1-5, the physical/mental drain of doing the work itself',
    `- indoorOutdoor: one of ${JSON.stringify(INDOOR_OUTDOOR)}`,
    '- weatherSensitive: boolean, true if rain/heat should affect scheduling this task',
    '- perishable: boolean, true if it involves something that can spoil/degrade (e.g. cold groceries)',
    '- estWorkMin: integer, estimated minutes > 0 to do the work',
    '- estRecoveryMin: integer, estimated minutes >= 0 of recovery/buffer needed after',
    `- idealWindow: one of ${JSON.stringify(IDEAL_WINDOWS)}`,
    '- locationName: a short place name string implied by the task, or null if none is implied',
    'Output JSON only. Do not include any text before or after the JSON object.',
    '',
    `Task title: ${title}`,
  ].join('\n');
}

// Strips ``` / ```json fences and surrounding whitespace, extracts the first
// {...} object in the text, and JSON.parses it. Never throws — returns null
// on any failure (missing object, malformed JSON, non-string input, etc.).
export function parseAnnotation(rawText) {
  if (typeof rawText !== 'string') return null;

  let text = rawText.trim();
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;

  const candidate = text.slice(start, end + 1);
  try {
    const parsed = JSON.parse(candidate);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function coerceBool(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function coerceEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function coerceIntensity(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return SAFE_DEFAULTS.intensity;
  return Math.min(5, Math.max(1, n));
}

function coercePositiveInt(value, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

function coerceNonNegativeInt(value, fallback) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function coerceNullableString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

// Given a parsed (but untrusted) object, returns a fully-populated, cleaned
// annotation — every field coerced/clamped into its allowed range, missing
// keys filled from SAFE_DEFAULTS. Returns null only when `obj` itself is
// null/not a plain object (i.e. parseAnnotation already gave up).
export function validateAnnotation(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;

  return {
    category: coerceEnum(obj.category, CATEGORIES, null),
    intensity: coerceIntensity(obj.intensity),
    indoorOutdoor: coerceEnum(obj.indoorOutdoor, INDOOR_OUTDOOR, SAFE_DEFAULTS.indoorOutdoor),
    weatherSensitive: coerceBool(obj.weatherSensitive, SAFE_DEFAULTS.weatherSensitive),
    perishable: coerceBool(obj.perishable, SAFE_DEFAULTS.perishable),
    estWorkMin: coercePositiveInt(obj.estWorkMin, SAFE_DEFAULTS.estWorkMin),
    estRecoveryMin: coerceNonNegativeInt(obj.estRecoveryMin, SAFE_DEFAULTS.estRecoveryMin),
    idealWindow: coerceEnum(obj.idealWindow, IDEAL_WINDOWS, SAFE_DEFAULTS.idealWindow),
    locationName: coerceNullableString(obj.locationName),
  };
}
