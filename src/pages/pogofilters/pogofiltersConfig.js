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
// Game search vocabulary
// ---------------------------------------------------------------------------
// Sourced and cross-checked in data/searchTerms.json — see its _meta for which
// sources agree and what is still unverified.
//
// This used to be a hardcoded Set derived from pokemon_go_search_filters.md,
// whose own header admits it came from a chatbot and needs verification. That
// list was missing mega0-3, buddy0-5, evolvenew, tradeevolve, fusion, xs/xl,
// every region name and the whole tag syntax — so the linter confidently
// flagged real, working terms like mega1 as unknown. Don't reintroduce a
// hand-typed list here; add to the JSON.
// Import attribute is required by Node (applyEngine.selftest.mjs loads this
// chain) and accepted by Vite — without it `node --run` on the selftest throws
// ERR_IMPORT_ATTRIBUTE_MISSING.
import searchTerms from './data/searchTerms.json' with { type: 'json' };

export const SEARCH_TERMS = searchTerms;

export const GAME_KEYWORDS = new Set(searchTerms.keywords.map((k) => k.term));

// term -> its record, so the linter can report confidence and notes rather than
// treating every term as equally certain.
export const KEYWORD_INFO = new Map(searchTerms.keywords.map((k) => [k.term, k]));

export const GAME_TYPES = new Set(searchTerms.types);

// Parameterised terms (mega1, cp1500-, 15attack, @1grass, #tag …). Compiled
// once; each carries its provenance so a warning can say how sure we are.
export const TERM_PATTERNS = searchTerms.patterns.map((p) => ({
  ...p,
  re: new RegExp(p.regex, 'i'),
}));

export function matchPattern(text) {
  return TERM_PATTERNS.find((p) => p.re.test(String(text ?? '').trim())) || null;
}

// Operators that take a numeric argument and MUST NOT contain a space
// (`!cp 2750-` is broken; `!cp2750-` works — confirmed in game).
// Note: attack/defense/hp are NUMBER-FIRST (`15attack`), so they are not in
// this prefix list — the spacing rule below only applies to true prefixes.
export const NUMERIC_OPERATORS = ['cp', 'hp', 'age', 'year', 'distance'];

// Suffix form for IV stats. There is no `stamina` term — stamina IV is `hp`.
export const IV_SUFFIXES = ['attack', 'defense', 'hp'];

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

export const STAR_RATINGS = [0, 1, 2, 3, 4];

// The choices offered for a species' MINIMUM stars to keep — 0-2 only, never
// 3 or 4.
//
// Every main trash filter starts `!3*&!4*`, so 3★ and 4★ specimens are already
// spared by construction and never enter a trash filter at all. A species
// minimum of 3★ therefore asks for protection that is only needed in filters
// that don't exist, and the engine correctly writes nothing — which reads in
// the matrix as an assigned rule that silently does nothing. That is a control
// offering a choice the filters cannot express, so the choice is gone.
//
// Trey's framing: choosing a star means "I'm okay with keeping this one BELOW
// 3★". 3★ is the baseline, not an option.
export const SPECIES_STAR_CHOICES = [0, 1, 2];

// Normalises the per-star CP map. Every rating gets an explicit key so the UI
// never has to distinguish "absent" from "deliberately null".
export function withStarRules(raw) {
  const out = {};
  for (const s of STAR_RATINGS) {
    const v = raw?.[s];
    out[s] = typeof v === 'number' && Number.isFinite(v) ? v : null;
  }
  return out;
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
    // null = inherit the tier default. Clamped to 0-2 so a value stored before
    // SPECIES_STAR_CHOICES existed can never silently cancel a CP tier — a 3★
    // or 4★ minimum reaches no trash filter at all, and a rule that looks
    // assigned but writes nothing is worse than no rule.
    starThreshold: typeof s.starThreshold === 'number'
      ? Math.min(Math.max(s.starThreshold, 0), Math.max(...SPECIES_STAR_CHOICES))
      : null,

    // 'flat'    — one CP threshold + one minimum star rating (the default).
    // 'perStar' — a different CP threshold per star rating, so a 4★ can be kept
    //             from 1000 CP up while a 1★ of the same species has to reach
    //             2000. A better specimen earns a lower bar.
    ruleMode: s.ruleMode === 'perStar' ? 'perStar' : 'flat',
    // null = inherit the classification default (legendary/mythical are
    // excluded — hidden from the matrix and the queue, never named in a rule).
    // true/false = an explicit override for this species. `manualOnly` is the
    // old name for the same flag; read it so anything saved under it survives.
    excluded: typeof s.excluded === 'boolean' ? s.excluded
      : typeof s.manualOnly === 'boolean' ? s.manualOnly : null,
    // Keyed by star rating 0-4. null = that rating is never kept for this
    // species, which is different from 0 (kept at any CP).
    starRules: withStarRules(s.starRules),
    labels: Array.isArray(s.labels) ? s.labels : [],
    notes: s.notes || '',
    updatedAt: s.updatedAt || Date.now(),
  };
}

// A species counts as decided when it has a flat threshold OR at least one
// per-star rule. Used for the "assigned / unassigned" counts and filter chips —
// without this, a species configured entirely through per-star rules would read
// as unassigned forever.
export function isAssigned(s) {
  if (s?.ruleMode === 'perStar') {
    return STAR_RATINGS.some((n) => typeof s.starRules?.[n] === 'number');
  }
  return s?.tier != null || s?.customCp != null;
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

// Terms every managed filter must carry. Legendaries and mythicals are excluded
// from the matrix and never rated, so these two terms — not any per-species
// rule — are what keeps a mass filter from reaching one.
export const DEFAULT_REQUIRED_TERMS = ['!legendary', '!mythical'];

export function withSettingsDefaults(s = {}) {
  return {
    cpPresets: Array.isArray(s.cpPresets) && s.cpPresets.length ? s.cpPresets : [...DEFAULT_CP_PRESETS],
    requiredTerms: Array.isArray(s.requiredTerms) ? s.requiredTerms : [...DEFAULT_REQUIRED_TERMS],
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
