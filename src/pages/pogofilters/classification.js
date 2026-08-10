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

import classification from './data/classification.json';

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

export const CLASSIFICATION_META = classification._meta || {};
