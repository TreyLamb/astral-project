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

// Deduped per dex: classification.json lists every FORM, so Mewtwo appears
// four times under `legendary` and would otherwise render four LGD chips.
const byDex = new Map();
for (const cat of CATEGORIES) {
  for (const entry of classification[cat] || []) {
    if (entry.dex == null) continue;
    if (!byDex.has(entry.dex)) byDex.set(entry.dex, new Set());
    byDex.get(entry.dex).add(cat);
  }
}
for (const [dex, set] of byDex) byDex.set(dex, [...set]);

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

// Legendaries and mythicals are EXCLUDED: out of the matrix, out of the assign
// queue, out of every count, and never named in a rule. Trey is never going to
// rate them, so showing them is pure noise. This is the DEFAULT only — a
// species can override it — and it is deliberately distinct from "never save":
//
//   tracked: false  -> a species he'd delete; hidden, and any protection the
//                      engine wrote for it earlier is stripped back out
//   excluded        -> not deleted, not rated, just not part of this tool. The
//                      blanket !legendary / !mythical required terms on every
//                      managed filter already keep them out of harm's way, so
//                      naming them individually would achieve nothing.
//
// Trey's reason for the override existing at all: "I don't want them deleted
// forever because maybe in the future I'll think of a label for them." Flipping
// one to excluded: false brings it back into the matrix as an ordinary species.
export function isExcludedByDefault(dex) {
  const cats = categoriesFor(dex);
  return cats.includes('legendary') || cats.includes('mythical');
}

// Resolved handling for a species: its explicit override if it set one,
// otherwise the classification-derived default.
export function isExcluded(species, dex) {
  if (species?.excluded === true) return true;
  if (species?.excluded === false) return false;
  return isExcludedByDefault(dex ?? species?.dex);
}

export const CLASSIFICATION_META = classification._meta || {};
