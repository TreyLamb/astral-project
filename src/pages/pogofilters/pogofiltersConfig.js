// PogoFilters shared constants, factories and normalisers.
// Pure data + pure functions only — no React, no I/O, so both the storage
// layers and the linter can import it.

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// ---------------------------------------------------------------------------
// CP tiers
// ---------------------------------------------------------------------------
// Five presets, up from the three thresholds Trey has been sorting by. Editable
// in settings — these are only the starting point, and free numeric entry sits
// alongside them everywhere (never instead of them).
export const DEFAULT_CP_PRESETS = [800, 1300, 1600, 1900, 2300];

// Levels shown in the matrix's reference section. Not a setting: three columns
// is what fits a row legibly, and 15/25/35 spans the range that matters.
export const REFERENCE_LEVELS = [15, 25, 35];

// A species "needs custom" when even its level-35 CP sits below the lowest
// preset — every tier button would be unreachable for it, so a preset would
// silently mean "keep every one of these". Magikarp (192) is the type case.
export function needsCustomCp(maxCp, presets = DEFAULT_CP_PRESETS) {
  return maxCp < presets[0];
}

// ---------------------------------------------------------------------------
// Star bands
// ---------------------------------------------------------------------------
// A trash filter covers a band of appraisal ratings. The apply engine reads
// this to decide whether a filter could delete a specimen the species' star
// threshold says to keep.
export const STAR_BANDS = {
  low: { id: 'low', label: '0–2★', covers: [0, 1, 2] },
  high: { id: 'high', label: '3–4★', covers: [3, 4] },
  three: { id: 'three', label: '3★', covers: [3] },
  any: { id: 'any', label: 'any ★', covers: [0, 1, 2, 3, 4] },
};

// Trey's preferred form is the exclusive one — "filter the good ones OUT".
// `0*,1*,2*` is logically identical to `!3*&!4*`; the normaliser rewrites the
// former into the latter so every trash tier reads the same way.
export const STAR_BAND_PATTERNS = [
  { band: 'low', test: /^!3\*&!4\*/, canonical: true },
  { band: 'low', test: /^0\*,1\*,2\*/, canonical: false, rewriteTo: '!3*&!4*' },
  { band: 'high', test: /^3\*,4\*/, canonical: true },
  { band: 'three', test: /^3\*(?!,)/, canonical: true },
];

export function detectStarBand(query) {
  const q = (query || '').trim();
  for (const p of STAR_BAND_PATTERNS) if (p.test.test(q)) return p.band;
  return 'any';
}

export function detectCpTier(query) {
  const m = (query || '').match(/!?cp\s*(\d+)\s*-/i);
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Game search keywords
// ---------------------------------------------------------------------------
// Built-in Pokemon GO search terms. A token matching one of these means the
// GAME's meaning, never a label of the same name — which is exactly why a
// label must never be named after one (see PogoFilters/FilterRules.md).
export const GAME_KEYWORDS = new Set([
  'shiny', 'legendary', 'mythical', 'ultra beast', 'ultra beasts',
  'shadow', 'purified', 'lucky', 'mega', 'costume', 'baby', 'evolve',
  'favorite', 'item', 'traded', 'defender', 'hatched', 'raid', 'research',
  'remote', 'dynamax', 'gigantamax', 'xxs', 'xxl', 'male', 'female',
]);

export const GAME_TYPES = new Set([
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
  'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark',
  'steel', 'fairy',
]);

// Prefix operators that take a numeric argument and MUST NOT contain a space
// (`!cp 2750-` is broken; `!cp2750-` works — confirmed in-game).
export const NUMERIC_OPERATORS = ['cp', 'hp', 'age', 'year', 'distance', 'attack', 'defense', 'stamina'];

// ---------------------------------------------------------------------------
// Label colours
// ---------------------------------------------------------------------------
// One distinct colour per label, assigned deterministically from the label name
// so a colour never shifts between sessions or machines. Seeded from MedalDex's
// TYPE_COLORS hues so the sub-apps feel related.
export const LABEL_PALETTE = [
  '#f0b23a', '#22e0a8', '#67e8f9', '#a78bfa', '#f472b6', '#fb923c',
  '#4ade80', '#60a5fa', '#facc15', '#f87171', '#2dd4bf', '#c084fc',
  '#34d399', '#38bdf8', '#fbbf24', '#e879f9', '#a3e635', '#fca5a5',
  '#5eead4', '#93c5fd', '#fdba74', '#d8b4fe',
];

export function colorForLabel(name, index = null) {
  if (index !== null) return LABEL_PALETTE[index % LABEL_PALETTE.length];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LABEL_PALETTE[h % LABEL_PALETTE.length];
}

// ---------------------------------------------------------------------------
// Normalisers — applied on read, which is how schema changes migrate
// ---------------------------------------------------------------------------
export function withFilterDefaults(f = {}) {
  return {
    id: f.id || uid(),
    name: f.name || 'Untitled filter',
    query: f.query || '',
    notes: f.notes || '',
    group: f.group || '',
    pinned: !!f.pinned,
    // Opt-in. The apply engine never touches a filter that isn't managed.
    managed: !!f.managed,
    cpTier: f.cpTier ?? detectCpTier(f.query),
    starBand: f.starBand ?? detectStarBand(f.query),
    // Provenance: only tokens listed here may ever be removed automatically.
    managedTokens: Array.isArray(f.managedTokens) ? f.managedTokens : [],
    sourceLine: f.sourceLine ?? null,
    order: f.order ?? 0,
    createdAt: f.createdAt || Date.now(),
    updatedAt: f.updatedAt || Date.now(),
  };
}

export function withLabelDefaults(l = {}, index = null) {
  const name = l.name || 'Untitled';
  return {
    id: l.id || uid(),
    name,
    notes: l.notes || '',
    color: l.color || colorForLabel(name, index),
    kind: l.kind || 'label',
    createdAt: l.createdAt || Date.now(),
  };
}

export function withSpeciesDefaults(s = {}) {
  return {
    dex: s.dex ?? null,
    speciesId: s.speciesId || '',
    name: s.name || '',
    // "Do I ever want this species saved at all?" — ON for every species by
    // default; unchecking is the deliberate act and hides it from the matrix.
    // An untracked species is never saved, so the apply engine must never write
    // protection for it (and must strip protection it wrote earlier).
    tracked: s.tracked !== false,
    tier: s.tier ?? null,          // one of settings.cpPresets, or null
    customCp: s.customCp ?? null,  // free entry, always available
    starThreshold: s.starThreshold ?? null, // null = inherit the tier default
    labels: Array.isArray(s.labels) ? s.labels : [],
    notes: s.notes || '',
    updatedAt: s.updatedAt || Date.now(),
  };
}

export function withGroupDefaults(g = {}) {
  return {
    id: g.id || uid(),
    name: g.name || 'Untitled group',
    members: Array.isArray(g.members) ? g.members : [],
    derivedFrom: g.derivedFrom || null,
    notes: g.notes || '',
    createdAt: g.createdAt || Date.now(),
  };
}

export function withSettingsDefaults(s = {}) {
  return {
    cpPresets: Array.isArray(s.cpPresets) && s.cpPresets.length ? s.cpPresets : [...DEFAULT_CP_PRESETS],
    // Per-tier default star requirement. A species inherits its tier's value
    // unless it sets its own starThreshold.
    tierStarDefaults: s.tierStarDefaults || {},
    density: s.density || 'compact',   // compact | comfortable (B's big sprites)
    seeded: !!s.seeded,
    viewPrefs: s.viewPrefs || {},
  };
}

export function newFilter(partial = {}) {
  return withFilterDefaults({ ...partial, id: uid(), createdAt: Date.now(), updatedAt: Date.now() });
}

export function newLabel(partial = {}) {
  return withLabelDefaults({ ...partial, id: uid(), createdAt: Date.now() });
}
