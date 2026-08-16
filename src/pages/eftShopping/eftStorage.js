// localStorage layer for EFT Shopping.
//
// Stations are keyed by `normalizedName`, never by id: the live tarkov.dev
// station ids and the snapshot's BSG area ids are not guaranteed to be the
// same value, and a saved hideout that silently resets when the tool falls
// back to snapshot data would be worse than no persistence at all. Item
// counts ARE keyed by item id — those are BSG template ids and identical in
// both sources.

import {
  SEED_RAID_KITS, SEED_MED_BASELINE, SEED_AMMO_GROUPS, SEED_AMMO_NOTES,
  SEED_FRUGAL, SEED_MED_NOTES, SEED_WATCHLIST, SEED_FOOD_TIER,
  SEED_LOOT_CALC, SEED_SIGHTS,
} from './data/eftSeeds';

const P = 'eftsh_';

export const STORE_KEYS = {
  levels: `${P}levels_v1`,
  targets: `${P}targets_v1`,
  disabled: `${P}disabled_v1`,
  inventory: `${P}inventory_v1`,
  profile: `${P}profile_v1`,
  prefs: `${P}prefs_v1`,
  watchlist: `${P}watchlist_v1`,
  raidKits: `${P}raidkits_v1`,
  medBaseline: `${P}medbaseline_v1`,
  raidChecks: `${P}raidchecks_v1`,
  ammo: `${P}ammo_v1`,
  ammoNotes: `${P}ammonotes_v1`,
  frugal: `${P}frugal_v1`,
  medNotes: `${P}mednotes_v1`,
  foodTier: `${P}foodtier_v1`,
  lootCalc: `${P}lootcalc_v1`,
  sights: `${P}sights_v1`,
  craftGraph: `${P}craftgraph_v1`,
  questsDone: `${P}questsdone_v1`,
};

export const DEFAULTS = {
  // { [stationNormalizedName]: currentLevel }
  levels: {},
  // { [stationNormalizedName]: targetLevel } — absent means "go to max"
  targets: {},
  // [stationNormalizedName] excluded from the shopping list
  disabled: [],
  // { [itemId]: countOnHand }
  inventory: {},
  profile: {
    playerLevel: 1,
    // { [traderNormalizedName]: loyaltyLevel }
    traders: {},
    // { [skillName]: level }
    skills: {},
  },
  prefs: {
    gameMode: 'regular',
    // 'all' = every remaining level, 'next' = only each station's next level
    scope: 'all',
    groupBy: 'item',
    soloStation: null,
    // Which station cards the hideout grid draws, and the predicate filter over
    // them. Separate from `disabled`, which is about the shopping list.
    hiddenStations: [],
    stationView: 'all',
    hideOwned: false,
    showFirOnly: false,
    search: '',
    // Shopping list presentation. 'grid' is the in-raid quick-reference —
    // picture and quantity, nothing else competing for the glance you get
    // between fights. 'table' is the full detail, 'order' is the build order.
    listMode: 'grid',
    // Tile size for the grid, so the same list works on a second monitor and
    // on a phone propped against the keyboard.
    tileSize: 'md',
  },
  watchlist: SEED_WATCHLIST,
  raidKits: SEED_RAID_KITS,
  medBaseline: SEED_MED_BASELINE,
  // { [kitId]: { [lineText]: true } } — which lines are ticked for the run
  raidChecks: {},
  ammo: SEED_AMMO_GROUPS,
  ammoNotes: SEED_AMMO_NOTES,
  frugal: SEED_FRUGAL,
  medNotes: SEED_MED_NOTES,
  foodTier: SEED_FOOD_TIER,
  lootCalc: SEED_LOOT_CALC,
  sights: SEED_SIGHTS,
  craftGraph: {
    mode: 'overview',        // 'overview' | 'station' | 'item'
    overview: 'chains',      // 'chains' | 'final' | 'intermediate' | 'all'
    stationKey: null,
    itemId: null,
    direction: 'up',         // 'up' = ingredients, 'down' = used in
    includeTools: true,
    craftableOnly: false,
    autoDepth: 3,
    limit: 12,
    zoom: 1,
    controlsOpen: true,
    detailOpen: true,
    // Node keys the user folded. A leading '!' means "expanded on purpose",
    // which is what overrides the auto-fold depth — see eftCraftGraph.
    collapsed: [],
    // { [nodeKey]: recipeIndex } — which recipe a multi-recipe item is showing.
    recipeChoice: {},
  },
  // Quest ids the user has finished. Ticking one here is what turns
  // "Used in 3 quests" into "Used in quests 1/3" the next time an item comes up.
  questsDone: [],
};

export function read(name) {
  const fallback = DEFAULTS[name];
  try {
    const raw = localStorage.getItem(STORE_KEYS[name]);
    if (raw === null) return structuredClone(fallback);
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return structuredClone(fallback);
    // Objects get their defaults backfilled so a key added in a later version
    // does not read as undefined against saved data from an earlier one.
    if (!Array.isArray(fallback) && typeof fallback === 'object') {
      return { ...structuredClone(fallback), ...parsed };
    }
    return parsed;
  } catch {
    return structuredClone(fallback);
  }
}

export function write(name, value) {
  try {
    localStorage.setItem(STORE_KEYS[name], JSON.stringify(value));
  } catch {
    /* quota or private mode — the session still works, it just won't persist */
  }
}

export function readAll() {
  return Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, read(k)]));
}

// --- Backup / restore ----------------------------------------------------

export function exportAll() {
  return JSON.stringify(
    { format: 'eftsh-backup', version: 1, exportedAt: new Date().toISOString(), data: readAll() },
    null,
    2,
  );
}

/** @returns {{ok:true, keys:string[]} | {ok:false, error:string}} */
export function importAll(json) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That is not valid JSON.' };
  }
  const data = parsed?.data;
  if (parsed?.format !== 'eftsh-backup' || !data || typeof data !== 'object') {
    return { ok: false, error: 'Not an EFT Shopping backup file.' };
  }
  const keys = [];
  for (const name of Object.keys(DEFAULTS)) {
    if (data[name] === undefined) continue;
    write(name, data[name]);
    keys.push(name);
  }
  return { ok: true, keys };
}

export function resetAll() {
  for (const key of Object.values(STORE_KEYS)) {
    try { localStorage.removeItem(key); } catch { /* nothing to do */ }
  }
}
