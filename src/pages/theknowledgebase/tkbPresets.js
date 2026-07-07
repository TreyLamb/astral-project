// TKB profile presets, accent color pool, and subject color palette.
// Profiles are code (not persisted) per the phase-1 decision to hardcode
// the 4 presets rather than build a custom-profile UI.

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} name
 * @property {'all'|'scoped'} subjectScope
 * @property {'manual'|'auto'} adjustmentMode
 * @property {'fast'|'slow'} paceClass
 */

/** @type {Profile[]} */
export const PROFILES = [
  { id: 'main_recall', name: 'Main Recall', subjectScope: 'all', adjustmentMode: 'manual', paceClass: 'fast' },
  { id: 'quick_facts', name: 'Quick Facts', subjectScope: 'all', adjustmentMode: 'manual', paceClass: 'slow' },
  { id: 'auto_all', name: 'Auto-Adjust (All)', subjectScope: 'all', adjustmentMode: 'auto', paceClass: 'fast' },
  { id: 'auto_scoped', name: 'Auto-Adjust (Scoped)', subjectScope: 'scoped', adjustmentMode: 'auto', paceClass: 'fast' },
  // Fills the one preset combo phase 1 didn't ship: manual + scoped + fast.
  // Shares settings.autoScopedSubjectIds with auto_scoped (same "which
  // subjects" concept; only adjustmentMode differs) - lets you review just
  // one subject (e.g. a single imported deck) with manual weight control.
  { id: 'focused_review', name: 'Focused Review', subjectScope: 'scoped', adjustmentMode: 'manual', paceClass: 'fast' },
];

export function getProfile(id) {
  return PROFILES.find(p => p.id === id) ?? PROFILES[0];
}

// Weighted accent pool: sky blue + coral dominant (~75%), green + yellow minor
// (~18%), misc rare (~7%). Jitter lightness ±8 within blue/coral so consecutive
// hits don't look identical. Kept structurally distinct from the fixed
// correct/wrong/unsure feedback colors below (never share a bucket).
const ACCENT_BUCKETS = [
  { weight: 40, hue: 203, sat: 68, light: 55 }, // sky blue
  { weight: 35, hue: 9, sat: 72, light: 60 },   // coral
  { weight: 10, hue: 140, sat: 45, light: 48 }, // green
  { weight: 8, hue: 45, sat: 85, light: 55 },   // yellow
  { weight: 4, hue: 265, sat: 40, light: 60 },  // violet
  { weight: 3, hue: 180, sat: 35, light: 45 },  // teal
];

const ACCENT_TOTAL = ACCENT_BUCKETS.reduce((sum, b) => sum + b.weight, 0);
const JITTER_HUES = new Set([203, 9]);

export function pickAccent(rng = Math.random) {
  let roll = rng() * ACCENT_TOTAL;
  const bucket = ACCENT_BUCKETS.find(b => (roll -= b.weight) <= 0) ?? ACCENT_BUCKETS[0];
  const jitter = JITTER_HUES.has(bucket.hue) ? Math.round((rng() - 0.5) * 16) : 0;
  const light = Math.max(30, Math.min(75, bucket.light + jitter));
  return `hsl(${bucket.hue}, ${bucket.sat}%, ${light}%)`;
}

// Fixed 10-hue palette for the "fixed color per subject" experiment toggle
// (colorMode: 'subject'). Muted so they don't compete with the accent pool.
export const SUBJECT_COLOR_PALETTE = [
  'hsl(203, 55%, 50%)', // blue
  'hsl(9, 55%, 55%)',   // coral/red
  'hsl(140, 40%, 42%)', // green
  'hsl(45, 70%, 48%)',  // yellow/gold
  'hsl(265, 35%, 55%)', // violet
  'hsl(180, 35%, 40%)', // teal
  'hsl(28, 60%, 50%)',  // orange
  'hsl(320, 35%, 55%)', // pink/magenta
  'hsl(95, 35%, 42%)',  // olive
  'hsl(230, 30%, 55%)', // indigo
];

export function colorForIndex(i) {
  return SUBJECT_COLOR_PALETTE[i % SUBJECT_COLOR_PALETTE.length];
}
