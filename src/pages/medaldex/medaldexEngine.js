// MedalDex calculation engine -- Pokedex feasibility/completion math and
// medal tier analytics. Pure functions only (no React, no storage I/O) so
// every view can share the exact same numbers without recomputing logic.
//
// Honesty rule that drives every function below (see MedalDexPlan.md and
// data/feasibility.json's _meta): where the underlying truth isn't known
// (mostly Shiny/Shadow release status per species), this engine reports
// `null` ("unknown") rather than guessing `true` or `false`. Every
// completion percentage is computed against the FEASIBLE denominator only
// -- unknown-feasibility species are tracked in their own bucket and never
// silently folded into "impossible" or "possible".

import speciesJson from '../pogoaccs/data/species.json';
import megasJson from '../pogoaccs/data/megas.json';
import typeChartJson from '../pogoaccs/data/typeChart.json';
import feasibilityJson from './data/feasibility.json';
import medalsJson from './data/medals.json';
import speciesFactsJson from './data/speciesFacts.json';
import { CATEGORY_KEYS, generationFor, ALL_TYPES, TIER_ORDER, TIER_LABELS, GENERATIONS, FORM_GROUP_LABELS } from './medaldexConfig';

const SPECIES = speciesJson.species;

// ---------------------------------------------------------------------
// Canonical National Dex list
// ---------------------------------------------------------------------
// species.json ships ~1099 entries because it includes every Mega/Primal
// form and every regional/alternate form as its own id sharing the base
// species' dex number (e.g. dex 19 has both "rattata" and
// "alolan_rattata"). The brief wants ONE row per base species per dex
// number. A form id is detected by a known prefix (mega_/primal_/
// alolan_/galarian_/hisuian_/paldea_) or a known form suffix; whichever
// id in a dex group does NOT match either list is the canonical row. This
// was verified against the live dataset (see build report) to resolve
// all 132 multi-entry dex numbers to exactly one canonical id apiece,
// EXCEPT it can't happen that zero match -- the shortest-id fallback
// below exists purely as a defensive last resort, not because any real
// dex number currently needs it.
const FORM_PREFIXES = ['mega_', 'primal_', 'alolan_', 'galarian_', 'hisuian_', 'paldea_'];
const FORM_SUFFIXES = [
  '_origin', '_therian', '_sky', '_attack', '_defense', '_speed',
  '_rainy', '_snowy', '_sunny', '_sandy', '_trash',
  '_fan', '_frost', '_heat', '_mow', '_wash',
  '_zen', '_standard', '_pirouette', '_shield',
  '_large', '_small', '_super',
  '_complete_fifty_percent', '_complete_ten_percent', '_fifty_percent', '_ten_percent',
  '_unbound', '_pau', '_pompom', '_sensu',
  '_midday', '_midnight', '_dawn_wings', '_dusk_mane', '_ultra',
  '_male', '_female', '_hero', '_eternamax', '_single_strike',
  '_black', '_white', '_a',
];

export function isFormId(id) {
  if (FORM_PREFIXES.some((p) => id.startsWith(p))) return true;
  if (FORM_SUFFIXES.some((s) => id.endsWith(s))) return true;
  return false;
}

function buildDexList() {
  const byDex = new Map();
  Object.keys(SPECIES).forEach((id) => {
    const dex = SPECIES[id].dex;
    if (dex == null) return;
    if (!byDex.has(dex)) byDex.set(dex, []);
    byDex.get(dex).push(id);
  });

  const list = [];
  const altFormsByDex = {};
  byDex.forEach((ids, dex) => {
    altFormsByDex[dex] = ids.slice().sort();
    const nonForm = ids.filter((id) => !isFormId(id));
    const canonicalId = nonForm.length >= 1
      ? nonForm[0]
      : ids.slice().sort((a, b) => a.length - b.length)[0]; // defensive fallback, see note above
    const entry = SPECIES[canonicalId];
    const gen = generationFor(dex);
    list.push({
      id: canonicalId,
      name: entry.name,
      dex,
      types: entry.types,
      generation: gen ? gen.gen : null,
      generationName: gen ? gen.name : 'Unknown',
    });
  });

  list.sort((a, b) => a.dex - b.dex);
  return { list, altFormsByDex };
}

const { list: DEX_LIST, altFormsByDex: ALT_FORMS_BY_DEX } = buildDexList();
export { DEX_LIST, ALT_FORMS_BY_DEX };

const DEX_BY_ID = new Map(DEX_LIST.map((s) => [s.id, s]));
export function getDexEntry(speciesId) {
  return DEX_BY_ID.get(speciesId) || null;
}

// Full species.json record (baseStats/moves/aliases) for a canonical dex
// entry -- used by SpeciesDetail for the tips block. Separate from
// getDexEntry because most call sites only need the slim {id,name,dex,
// types,generation} shape.
export function getSpeciesRecord(speciesId) {
  return SPECIES[speciesId] || null;
}

// speciesFacts.json is `{ [speciesId]: { funFact, faq: [{q,a}] } }`, owned
// and populated by a separate agent (see task brief) -- currently a `{}`
// stub. Returns null for any id with no entry so callers can hide the
// section cleanly instead of rendering an empty panel.
export function getSpeciesFacts(speciesId) {
  const facts = speciesFactsJson[speciesId];
  if (!facts) return null;
  const funFact = facts.funFact || null;
  const faq = Array.isArray(facts.faq) ? facts.faq.filter((f) => f?.q && f?.a) : [];
  if (!funFact && faq.length === 0) return null;
  return { funFact, faq };
}

// Other ids at the same dex number (Mega/Primal/regional forms), i.e.
// "what forms exist for this species" -- real, derived data (not
// fabricated lore) since it's read straight out of species.json's id set.
export function getAlternateFormIds(speciesId) {
  const entry = getDexEntry(speciesId);
  if (!entry) return [];
  const ids = ALT_FORMS_BY_DEX[entry.dex] || [];
  return ids.filter((id) => id !== speciesId);
}

// ---------------------------------------------------------------------
// Forms dimension
// ---------------------------------------------------------------------
// "By form" completion, requirement #4. Regional/alternate forms (Alolan
// Rattata, Galarian Ponyta, Hisuian Zorua, Deoxys-Attack, Rotom-Wash,
// Giratina-Origin, etc.) are real, independently-catchable entries in
// species.json that DEX_LIST intentionally collapses out (one row per dex
// number -- see buildDexList's header comment). To make them trackable in
// their own right without touching data/ or the storage schema, each form
// id is treated exactly like a canonical speciesId: setSpeciesCategory
// already accepts any string id and stores flags keyed by it, so a form's
// progress lives alongside canonical species under the same dex-progress
// map. Mega/Primal ids are excluded here -- those are already tracked via
// the 'mega' category chip on the base species, not as separate rows.
function classifyFormGroup(id) {
  if (id.startsWith('alolan_')) return 'alolan';
  if (id.startsWith('galarian_')) return 'galarian';
  if (id.startsWith('hisuian_')) return 'hisuian';
  if (id.startsWith('paldea_')) return 'paldean';
  return 'other';
}

function buildFormList() {
  const list = [];
  Object.keys(SPECIES).forEach((id) => {
    if (id.startsWith('mega_') || id.startsWith('primal_')) return;
    if (!isFormId(id)) return;
    const entry = SPECIES[id];
    if (entry.dex == null) return;
    const gen = generationFor(entry.dex);
    const altIds = ALT_FORMS_BY_DEX[entry.dex] || [];
    const baseId = altIds.find((altId) => !isFormId(altId)) || null;
    list.push({
      id,
      name: entry.name,
      dex: entry.dex,
      types: entry.types,
      generation: gen ? gen.gen : null,
      generationName: gen ? gen.name : 'Unknown',
      baseId,
      group: classifyFormGroup(id),
    });
  });
  list.sort((a, b) => a.dex - b.dex || a.id.localeCompare(b.id));
  return list;
}

// Real, derived data -- 108 regional/alternate form rows as of this build
// (18 Alolan, 19 Galarian, 14 Hisuian, 4 Paldean, 53 other-suffix forms e.g.
// Deoxys/Rotom/origin/therian formes), read straight out of species.json's
// existing id set. Not fabricated, not a stub -- but coverage is exactly as
// deep as species.json's form roster, no deeper (see MedalDexPlan.md).
export const FORM_LIST = buildFormList();
const FORM_BY_ID = new Map(FORM_LIST.map((f) => [f.id, f]));
export function getFormEntry(formId) {
  return FORM_BY_ID.get(formId) || null;
}

export const FORM_GROUP_ORDER = ['alolan', 'galarian', 'hisuian', 'paldean', 'other'];

// ---------------------------------------------------------------------
// Mega feasibility (fully derivable from megas.json)
// ---------------------------------------------------------------------
const megasList = megasJson.megas || [];
const MEGAS_BY_BASE = new Map();
megasList.forEach((m) => {
  if (!MEGAS_BY_BASE.has(m.base)) MEGAS_BY_BASE.set(m.base, []);
  MEGAS_BY_BASE.get(m.base).push(m.id);
});

export function isMegaCapable(speciesId) {
  return MEGAS_BY_BASE.has(speciesId);
}

export function getMegaFormIds(speciesId) {
  return MEGAS_BY_BASE.get(speciesId) || [];
}

// ---------------------------------------------------------------------
// Feasibility engine
// ---------------------------------------------------------------------
// Returns true | false | null. null means "unknown -- needs data", and
// must be surfaced as such by every UI that calls this, never silently
// treated as either true or false.
export function isCategoryFeasible(speciesId, category) {
  switch (category) {
    case 'normal':
      // Every id in species.json is, by construction, a released species OR
      // form (species.json only contains Pokemon/forms that exist in GO), so
      // it can always be caught in its normal form. Checked against SPECIES
      // directly (not DEX_BY_ID, which only holds canonical per-dex-number
      // ids) so regional/alternate FORM_LIST rows are feasible too -- see
      // the forms-dimension addition below.
      return Object.prototype.hasOwnProperty.call(SPECIES, speciesId);
    case 'lucky':
      // Broad default: Lucky status comes from trading, and the large
      // majority of species are tradeable. This does NOT model the small,
      // well-known set of non-tradeable Mythicals (Mew, Celebi, Jirachi,
      // Meltan/Melmetal, etc.) -- that exception list isn't in species.json
      // and modeling it from memory risked exactly the kind of unverified
      // per-species guessing this engine is built to avoid. Documented
      // limitation, called out in the build report.
      return Object.prototype.hasOwnProperty.call(SPECIES, speciesId) ? true : null;
    case 'mega':
      return isMegaCapable(speciesId);
    case 'shadow':
      if (Object.prototype.hasOwnProperty.call(feasibilityJson.shadowAvailable, speciesId)) {
        return feasibilityJson.shadowAvailable[speciesId];
      }
      return feasibilityJson.defaults.shadow;
    case 'purified':
      // A Pokemon can only be Purified if it can exist as Shadow first --
      // reuse the exact same lookup rather than maintaining a second map
      // that could drift out of sync.
      if (Object.prototype.hasOwnProperty.call(feasibilityJson.shadowAvailable, speciesId)) {
        return feasibilityJson.shadowAvailable[speciesId];
      }
      return feasibilityJson.defaults.shadow;
    case 'shiny':
      if (Object.prototype.hasOwnProperty.call(feasibilityJson.shinyReleased, speciesId)) {
        return feasibilityJson.shinyReleased[speciesId];
      }
      return feasibilityJson.defaults.shiny;
    default:
      return null;
  }
}

export function feasibilityReason(category, feasible) {
  if (feasible === true) return null;
  if (feasible === false) {
    if (category === 'mega') return 'No Mega Evolution released for this species.';
    if (category === 'shadow' || category === 'purified') return 'Not currently obtainable as Shadow (per known Team GO Rocket roster).';
    if (category === 'shiny') return 'Shiny not yet released for this species.';
    return 'Not currently obtainable.';
  }
  return 'Unknown -- data pending. Not counted as possible or impossible.';
}

// ---------------------------------------------------------------------
// Type effectiveness (derived straight from typeChart.json -- real data,
// not fabricated). typeChart.json is attacker -> { defender: multiplier },
// non-1.0 entries only. GO combines dual-type multipliers by product.
// ---------------------------------------------------------------------
export function computeTypeMatchups(types) {
  const results = ALL_TYPES.map((attackType) => {
    const multiplier = types.reduce((acc, defendType) => {
      const table = typeChartJson[attackType] || {};
      const m = Object.prototype.hasOwnProperty.call(table, defendType) ? table[defendType] : 1;
      return acc * m;
    }, 1);
    return { type: attackType, multiplier: Math.round(multiplier * 1000) / 1000 };
  });
  results.sort((a, b) => b.multiplier - a.multiplier);
  return {
    weaknesses: results.filter((r) => r.multiplier > 1),
    resistances: results.filter((r) => r.multiplier < 1),
    neutral: results.filter((r) => r.multiplier === 1),
  };
}

// ---------------------------------------------------------------------
// Per-account completion calculators
// ---------------------------------------------------------------------
function emptyStatBucket() {
  return { have: 0, feasibleTotal: 0, unknownTotal: 0, infeasibleTotal: 0, totalSpecies: 0 };
}

function finalizeStatBucket(bucket) {
  return {
    ...bucket,
    pct: bucket.feasibleTotal > 0 ? (bucket.have / bucket.feasibleTotal) * 100 : 0,
  };
}

// dexProgress: { [speciesId]: { normal, lucky, shadow, purified, mega, shiny } }
export function categoryStats(dexProgress, category, speciesList = DEX_LIST) {
  const bucket = emptyStatBucket();
  bucket.totalSpecies = speciesList.length;
  speciesList.forEach((s) => {
    const feasible = isCategoryFeasible(s.id, category);
    if (feasible === true) {
      bucket.feasibleTotal += 1;
      if (dexProgress?.[s.id]?.[category]) bucket.have += 1;
    } else if (feasible === null) {
      bucket.unknownTotal += 1;
    } else {
      bucket.infeasibleTotal += 1;
    }
  });
  return finalizeStatBucket(bucket);
}

export function allCategoryStats(dexProgress) {
  const out = {};
  CATEGORY_KEYS.forEach((cat) => { out[cat] = categoryStats(dexProgress, cat); });
  return out;
}

// Weighted overall completion -- total flags earned / total feasible flags
// across every category. Directly answers "of everything currently
// possible, how much have I done".
export function overallCompletion(dexProgress) {
  const perCategory = allCategoryStats(dexProgress);
  let have = 0;
  let feasibleTotal = 0;
  let unknownTotal = 0;
  CATEGORY_KEYS.forEach((cat) => {
    have += perCategory[cat].have;
    feasibleTotal += perCategory[cat].feasibleTotal;
    unknownTotal += perCategory[cat].unknownTotal;
  });
  return {
    have,
    feasibleTotal,
    unknownTotal,
    pct: feasibleTotal > 0 ? (have / feasibleTotal) * 100 : 0,
    perCategory,
  };
}

export function breakdownByGeneration(dexProgress, category) {
  return GENERATIONS.map((g) => {
    const speciesInGen = DEX_LIST.filter((s) => s.generation === g.gen);
    return {
      gen: g.gen,
      name: g.name,
      ...categoryStats(dexProgress, category, speciesInGen),
    };
  });
}

export function breakdownByType(dexProgress, category) {
  return ALL_TYPES.map((type) => {
    const speciesOfType = DEX_LIST.filter((s) => s.types.includes(type));
    return {
      type,
      ...categoryStats(dexProgress, category, speciesOfType),
    };
  });
}

// "By form" breakdown (requirement #4) -- same categoryStats machinery as
// by-region/by-type, just grouped over FORM_LIST instead of DEX_LIST. Reuses
// the exact same isCategoryFeasible/categoryStats path, so a form's
// feasibility honesty rules (null = unknown, never guessed) apply here too.
export function breakdownByForm(dexProgress, category) {
  return FORM_GROUP_ORDER.map((key) => {
    const speciesInGroup = FORM_LIST.filter((f) => f.group === key);
    return {
      key,
      label: FORM_GROUP_LABELS[key],
      formCount: speciesInGroup.length,
      ...categoryStats(dexProgress, category, speciesInGroup),
    };
  });
}

// Feasible-but-missing species for a category, optionally scoped to a
// generation -- the "what to hunt next" list.
export function whatsLeft(dexProgress, category, { generation = null, limit = null } = {}) {
  let pool = DEX_LIST;
  if (generation != null) pool = pool.filter((s) => s.generation === generation);
  const missing = pool.filter((s) => {
    const feasible = isCategoryFeasible(s.id, category);
    return feasible === true && !dexProgress?.[s.id]?.[category];
  });
  missing.sort((a, b) => a.dex - b.dex);
  return limit ? missing.slice(0, limit) : missing;
}

// Species whose feasibility for a category is unknown -- the "needs data"
// watchlist, surfaced honestly instead of guessed.
export function unknownFeasibilityList(dexProgress, category, { limit = null } = {}) {
  const unknown = DEX_LIST.filter((s) => isCategoryFeasible(s.id, category) === null);
  unknown.sort((a, b) => a.dex - b.dex);
  return limit ? unknown.slice(0, limit) : unknown;
}

// ---------------------------------------------------------------------
// Medal analytics
// ---------------------------------------------------------------------
export const MEDALS = medalsJson.medals;
export const MEDALS_META = medalsJson._meta;
const MEDAL_BY_ID = new Map(MEDALS.map((m) => [m.id, m]));

export function getMedal(medalId) {
  return MEDAL_BY_ID.get(medalId) || null;
}

export function medalsByCategory() {
  const groups = {};
  MEDALS.forEach((m) => {
    if (!groups[m.category]) groups[m.category] = [];
    groups[m.category].push(m);
  });
  return groups;
}

// currentValue: raw count the player has entered for this medal.
//
// Requirement #6: deltas to EVERY higher tier (not just the next one), and
// -- for daily-capped medals -- the minimum days to reach EACH tier,
// including the max. Every entry in `tiers` now carries its own `delta`
// (raw count still needed, works whether or not that tier is reached) and
// `minDays` (null when the medal has no daily cap, i.e. cap is unknown/not
// applicable -- never guessed). `remainingTiers` is the not-yet-reached
// subset in ascending order -- i.e. "every higher tier from here", which is
// exactly what a delta-to-each-higher-tier UI needs to render. `maxTier` is
// always the highest configured tier for this medal (Platinum for every
// medal currently in medals.json -- see medals.json's _meta.onyxTier for why
// no medal ships an onyx threshold), and `minDaysToMax` surfaces its
// min-days-to-finish explicitly since that's the "including the max" case
// the brief calls out by name.
export function medalProgress(medalId, currentValue) {
  const medal = getMedal(medalId);
  if (!medal) return null;
  const value = Math.max(0, Number(currentValue) || 0);

  const tiers = TIER_ORDER
    .filter((key) => medal.tiers[key] != null)
    .map((key) => {
      const threshold = medal.tiers[key];
      const reached = value >= threshold;
      const delta = Math.max(0, threshold - value);
      const minDays = medal.dailyCap ? Math.ceil(delta / medal.dailyCap) : null;
      return { key, label: TIER_LABELS[key], threshold, reached, delta, minDays };
    });

  const reachedTiers = tiers.filter((t) => t.reached);
  const currentTier = reachedTiers.length > 0 ? reachedTiers[reachedTiers.length - 1] : null;
  const remainingTiers = tiers.filter((t) => !t.reached);
  const next = remainingTiers[0] || null;
  const maxTier = tiers.length > 0 ? tiers[tiers.length - 1] : null;

  return {
    medal,
    value,
    tiers,
    remainingTiers,
    currentTier,
    nextTier: next,
    maxTier,
    maxed: next === null,
    minDaysToTier: next ? next.minDays : null,
    minDaysToMax: maxTier && !maxTier.reached ? maxTier.minDays : null,
  };
}

// ---------------------------------------------------------------------
// Medal <-> species cross-links (COULD #31)
// ---------------------------------------------------------------------
// Type medals (Schoolkid/Black Belt/etc.) and Regional Dex medals (Kanto/
// Johto/etc.) map onto the exact same type/region axes DexView already
// filters by, so the link is real structure, not invented association.
const MEDAL_BY_TYPE = new Map(MEDALS.filter((m) => m.category === 'Type').map((m) => [m.type, m]));
const MEDAL_BY_REGION_NAME = new Map(
  MEDALS.filter((m) => m.category === 'Regional Dex').map((m) => [m.name.toLowerCase(), m])
);

export function getRelatedMedals(speciesEntry) {
  if (!speciesEntry) return [];
  const related = [];
  (speciesEntry.types || []).forEach((t) => {
    const m = MEDAL_BY_TYPE.get(t);
    if (m && !related.includes(m)) related.push(m);
  });
  const regionMedal = MEDAL_BY_REGION_NAME.get((speciesEntry.generationName || '').toLowerCase());
  if (regionMedal && !related.includes(regionMedal)) related.push(regionMedal);
  return related;
}

export function medalRegionGeneration(medal) {
  if (medal.category !== 'Regional Dex') return null;
  const gen = GENERATIONS.find((g) => g.name.toLowerCase() === medal.name.toLowerCase());
  return gen ? gen.gen : null;
}

// ---------------------------------------------------------------------
// Medal bulk upload parsing (requirement #5)
// ---------------------------------------------------------------------
// Accepts freeform pasted text, one entry per line, in any of:
//   "Kanto: 1234"   "Collector 1234"   "Kanto - 1,234"   "kanto,1234"
// A line is a trailing integer (commas allowed) plus a label; the label is
// fuzzy-matched against every medal's name and id. Never silently drops a
// line -- everything that doesn't parse/match lands in `unmatched` with a
// reason, and the caller decides what to do with it (see BulkUpdate.jsx).
function normalizeMedalKey(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

// Minimal Levenshtein edit distance -- no dependency, small inputs (medal
// names are a handful of words), so the naive O(n*m) DP table is plenty.
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prevDiag = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      row[j] = a[i - 1] === b[j - 1]
        ? prevDiag
        : 1 + Math.min(prevDiag, row[j], row[j - 1]);
      prevDiag = temp;
    }
  }
  return row[n];
}

const MEDAL_KEYS = MEDALS.map((m) => ({
  medal: m,
  keys: [normalizeMedalKey(m.name), normalizeMedalKey(m.id.replace(/_/g, ' '))],
}));

function matchMedalLabel(label) {
  const key = normalizeMedalKey(label);
  if (!key) return null;

  const exact = MEDAL_KEYS.find((nm) => nm.keys.includes(key));
  if (exact) return { medal: exact.medal, matchType: 'exact' };

  const partial = MEDAL_KEYS.find((nm) => nm.keys.some((k) => k.length > 2 && (k.includes(key) || key.includes(k))));
  if (partial) return { medal: partial.medal, matchType: 'partial' };

  let best = null;
  let bestDist = Infinity;
  MEDAL_KEYS.forEach((nm) => {
    nm.keys.forEach((k) => {
      const d = levenshtein(key, k);
      const threshold = Math.max(2, Math.floor(k.length * 0.3));
      if (d <= threshold && d < bestDist) {
        bestDist = d;
        best = nm.medal;
      }
    });
  });
  return best ? { medal: best, matchType: 'fuzzy' } : null;
}

// Returns { matched: [{line,label,value,medalId,medalName,matchType}], unmatched: [{line,reason}] }
export function parseMedalBulkText(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const matched = [];
  const unmatched = [];

  lines.forEach((line) => {
    const numMatch = line.match(/(-?[\d,]+)\s*$/);
    if (!numMatch) {
      unmatched.push({ line, reason: 'No number found at end of line.' });
      return;
    }
    const value = Math.max(0, parseInt(numMatch[1].replace(/,/g, ''), 10) || 0);
    const label = line.slice(0, numMatch.index).trim().replace(/[:\-–—,]+$/, '').trim();
    if (!label) {
      unmatched.push({ line, reason: 'No medal name found before the number.' });
      return;
    }
    const result = matchMedalLabel(label);
    if (!result) {
      unmatched.push({ line, reason: `No medal matched "${label}".` });
      return;
    }
    matched.push({
      line,
      label,
      value,
      medalId: result.medal.id,
      medalName: result.medal.name,
      matchType: result.matchType,
    });
  });

  return { matched, unmatched };
}
