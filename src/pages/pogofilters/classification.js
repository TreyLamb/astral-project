// Lookup over data/classification.json — the legendary / mythical / ultra-beast
// / regional flags that species.json does not carry.
//
// These matter because the filter keywords `!legendary`, `!mythical` and
// `!ultra beasts` appear in almost every trash filter, and until now nothing in
// the app could say WHICH species those terms actually spare. Costume is
// deliberately absent: Trey said it isn't important.
//
// Sourcing and every uncertainty are recorded in data/SOURCES.md and in the
// file's own _meta.uncertain / _meta.unmatched.

// Import attribute required by Node (applyEngine.selftest.mjs loads this chain
// through applyEngine) and accepted by Vite.
import classification from './data/classification.json' with { type: 'json' };

const CATEGORIES = ['legendary', 'mythical', 'ultraBeast', 'regional'];

const byDex = new Map();
for (const cat of CATEGORIES) {
  for (const entry of classification[cat] || []) {
    if (entry.dex == null) continue;
    if (!byDex.has(entry.dex)) byDex.set(entry.dex, []);
    byDex.get(entry.dex).push(cat);
  }
}

export const CATEGORY_LABEL = {
  legendary: 'Legendary',
  mythical: 'Mythical',
  ultraBeast: 'Ultra Beast',
  regional: 'Regional',
};

export const CATEGORY_SHORT = {
  legendary: 'LGD',
  mythical: 'MYT',
  ultraBeast: 'UB',
  regional: 'REG',
};

export function categoriesFor(dex) {
  return byDex.get(dex) || [];
}

// Legendaries and mythicals can't be mass-transferred, so a CP tier on one is
// mostly decoration — worth saying rather than silently ignoring.
export function isBulkTransferable(dex) {
  const cats = categoriesFor(dex);
  return !cats.includes('legendary') && !cats.includes('mythical');
}

// Legendaries and mythicals are handled by hand, always. This is the DEFAULT
// only — a species can override it — and it is deliberately distinct from
// "never save":
//
//   tracked: false  -> never saved, safe to delete, hidden from the matrix
//   manual-only     -> still kept, still visible, but the apply engine never
//                      writes a rule for it either way
//
// Trey's reason: "I don't want them deleted forever because maybe in the future
// I'll think of a label for them, but as of right now they won't ever be
// filtered in or out specifically." So they sit at null in the matrix on
// purpose, and must not be nagged about as unassigned work.
export function isManualByDefault(dex) {
  const cats = categoriesFor(dex);
  return cats.includes('legendary') || cats.includes('mythical');
}

// Resolved handling for a species: its explicit override if it set one,
// otherwise the classification-derived default.
export function isManualOnly(species, dex) {
  if (species?.manualOnly === true) return true;
  if (species?.manualOnly === false) return false;
  return isManualByDefault(dex ?? species?.dex);
}

export const CLASSIFICATION_META = classification._meta || {};
