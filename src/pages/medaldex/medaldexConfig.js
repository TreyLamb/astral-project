// Config-driven constants for MedalDex. Mirrors pogoaccsConfig.js's pattern
// (see src/pages/pogoaccs/pogoaccsConfig.js) -- add/remove a category or
// generation here, nothing else needs to change. No uid() helper here (unlike
// pogoaccsConfig.js) -- MedalDex never creates its own sub-entities (dex
// progress is keyed by speciesId, medal values by medalId, both fixed IDs
// from the shared data), so there's nothing that needs a generated id.

// Pokedex tracking categories. Order here drives both the Dex grid's chip
// order and the Summary breakdown order. "Hundo" is deliberately excluded
// per the build brief -- IV-based, not a Pokedex/medal completion axis.
export const CATEGORIES = [
  { key: 'normal', label: 'Normal', icon: '●' },
  { key: 'lucky', label: 'Lucky', icon: '✦' },
  { key: 'shadow', label: 'Shadow', icon: '◆' },
  { key: 'purified', label: 'Purified', icon: '✦' },
  { key: 'mega', label: 'Mega', icon: '▲' },
  { key: 'shiny', label: 'Shiny', icon: '★' },
];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export function emptySpeciesFlags() {
  const flags = {};
  CATEGORY_KEYS.forEach((k) => (flags[k] = false));
  return flags;
}

// Medal tier order. Onyx is included in the ordering (and the UI renders it
// when present) even though no medal in data/medals.json currently ships an
// onyx threshold -- see medals.json's _meta.onyxTier for why. Keeping it in
// this list means a future data drop needs zero code changes.
export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'onyx'];
export const TIER_LABELS = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  onyx: 'Onyx',
};

// dex -> generation/region mapping. EXACT ranges from the build brief.
export const GENERATIONS = [
  { gen: 1, name: 'Kanto', min: 1, max: 151 },
  { gen: 2, name: 'Johto', min: 152, max: 251 },
  { gen: 3, name: 'Hoenn', min: 252, max: 386 },
  { gen: 4, name: 'Sinnoh', min: 387, max: 493 },
  { gen: 5, name: 'Unova', min: 494, max: 649 },
  { gen: 6, name: 'Kalos', min: 650, max: 721 },
  { gen: 7, name: 'Alola', min: 722, max: 809 },
  { gen: 8, name: 'Galar', min: 810, max: 905 },
  { gen: 9, name: 'Paldea', min: 906, max: 1025 },
];

export function generationFor(dex) {
  return GENERATIONS.find((g) => dex >= g.min && dex <= g.max) || null;
}

// Standard 18-type color set (community-standard Pokemon type colors --
// stable convention, not fabricated). Used for type chips + the Summary
// by-type breakdown. pogoaccsConfig.js's TYPE_COLORS only covers 8 types
// (it's used there for account-color-coding, not real Pokemon types) so
// this is a separate, complete set rather than importing that one.
export const TYPE_COLORS = {
  normal: '#A8A77A', fighting: '#C22E28', flying: '#A98FF3', poison: '#A33EA1',
  ground: '#E2BF65', rock: '#B6A136', bug: '#A6B91A', ghost: '#735797',
  steel: '#B7B7CE', fire: '#EE8130', water: '#6390F0', grass: '#7AC74C',
  electric: '#F7D02C', psychic: '#F95587', ice: '#96D9D6', dragon: '#6F35FC',
  dark: '#705746', fairy: '#D685AD',
};

export function typeColor(type) {
  return TYPE_COLORS[type] || '#888888';
}

export const ALL_TYPES = Object.keys(TYPE_COLORS);

// Backfills a dex-progress account doc to the full shape -- stored values
// always win, this only fills in what's genuinely missing.
export function withAccountDexDefaults(doc, accountId) {
  return { accountId, species: {}, ...doc };
}

export function withMedalsDefaults(doc, accountId) {
  return { accountId, medals: {}, ...doc };
}
