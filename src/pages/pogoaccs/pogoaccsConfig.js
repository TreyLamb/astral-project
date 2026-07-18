// Config-driven defaults for POGO Accs. Mirrors pgoConfig.js's pattern (see
// src/pages/pgotracker/pgoConfig.js) — add/remove a default field here,
// nothing else needs to change.

export const DEFAULT_IVS = { atk: 10, def: 10, sta: 10 };
export const DEFAULT_LEVEL = 25;
export const MAX_LEVEL = 51;
export const MEGA_LEVEL_MAX = 3;
export const SWAP_DELAY_SEC = 1;

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Backfills a pokébox entry to the full shape — stored values always win,
// this only fills in what's genuinely missing so it never shows "undefined".
// Also assigns a fresh id when one isn't present, so this doubles as the
// entry-creation path (addEntries) and the schema-backfill path (getBox).
export function withEntryDefaults(entry) {
  return {
    id: entry.id ?? uid(),
    speciesId: entry.speciesId ?? null,
    count: entry.count ?? 1,
    level: entry.level ?? null,
    cp: entry.cp ?? null,
    ivs: entry.ivs ?? null,
    fastMove: entry.fastMove ?? null,
    chargedMoves: entry.chargedMoves ?? [],
    isShadow: entry.isShadow ?? false,
    isPurified: entry.isPurified ?? false,
    isBestBuddy: entry.isBestBuddy ?? false,
    canMega: entry.canMega ?? false,
    megaLevel: entry.megaLevel ?? 0,
    notes: entry.notes ?? '',
  };
}

export function emptyBox(accountId) {
  return { accountId, entries: [] };
}

export function withMegasDefaults(doc, accountId) {
  return { megas: {}, ...doc, accountId };
}
