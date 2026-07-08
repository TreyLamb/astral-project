// Config-driven lists — add/remove a stat or item here, nothing else needs to change.

export const TYPE_COLORS = [
  { name: 'fire', bg: '#FF6B35' },
  { name: 'water', bg: '#5B9BD5' },
  { name: 'grass', bg: '#6BBD44' },
  { name: 'electric', bg: '#E8B923' },
  { name: 'psychic', bg: '#E699D3' },
  { name: 'ice', bg: '#5FBEBE' },
  { name: 'dragon', bg: '#7038F8' },
  { name: 'dark', bg: '#705848' },
];

export function typeColorFor(index) {
  return TYPE_COLORS[index % TYPE_COLORS.length];
}

// Long account names shrink a step at a time instead of ellipsis-truncating
// or overflowing their pill; past a length threshold they also wrap to 2
// lines at the smallest size. Caps at 2 steps down from the base font-size.
export function nameSizeClass(name) {
  const len = (name || '').length;
  if (len <= 9) return '';
  if (len <= 13) return 'pgo-name-sm';
  return 'pgo-name-xs pgo-name-wrap';
}

// Done/not-done streak stats. Each is a checkbox on the Acc Dash (done = 1,
// not done = 0) and a done-count + name list on the Main dash — same shape
// for all five. Order here drives both the Acc Dash checkbox order and the
// Main dash tile order.
// listRemaining: the Main dash name list shows accounts that HAVEN'T checked
// this off yet, and each account drops out of the list the moment it checks
// off (so a fully-done stat shows the full count with an empty list). Megas
// is the one exception — it keeps listing who HAS done it.
export const CHECK_STAT_CONFIG = [
  { key: 'megas', label: 'Megas Evolved', icon: '💠' },
  { key: 'caught', label: 'Caught Pokemon - streak', icon: '🎯', listRemaining: true },
  { key: 'stops', label: 'Spun Stop - Streak', icon: '🔵', listRemaining: true },
  { key: 'research', label: 'Daily Research', icon: '📋', listRemaining: true },
  { key: 'transferred', label: 'Transferred', icon: '♻️', listRemaining: true },
];

// Raid passes are real inventory stock (not a daily dashboard counter) — this
// is the single source of truth. Every place that shows/edits a raid pass
// (Inventory, Overall's bulk raid section) reads/writes account.inventory
// directly via these keys, so there's never a second copy to fall out of
// sync. Icons use the same ticket emoji tinted per type (real Niantic art is
// copyrighted; this app is emoji-icon-only everywhere else too) instead of
// fetched game assets. `max` caps that item's count (undefined = unbounded).
export const RAID_PASS_CONFIG = [
  { key: 'freeraidpass', label: 'Free Raid Pass', icon: '🎟️', chipColor: '#B7B0A8' },
  { key: 'premiumraidpass', label: 'Premium Raid Pass', icon: '🎟️', chipColor: '#F5A623' },
  { key: 'remoteraidpass', label: 'Remote Raid Pass', icon: '🎟️', chipColor: '#4FA8E0', max: 3 },
];
const RAID_PASS_KEYS = RAID_PASS_CONFIG.map((c) => c.key);

export const ITEM_CONFIG = [
  ...RAID_PASS_CONFIG,
  { key: 'pokeball', label: 'Poké Ball', icon: '⚪' },
  { key: 'greatball', label: 'Great Ball', icon: '🔵' },
  { key: 'ultraball', label: 'Ultra Ball', icon: '🟡' },
  { key: 'potion', label: 'Potion', icon: '💊' },
  { key: 'superpotion', label: 'Super Potion', icon: '💊' },
  { key: 'hyperpotion', label: 'Hyper Potion', icon: '💊' },
  { key: 'maxpotion', label: 'Max Potion', icon: '💊' },
  { key: 'revive', label: 'Revive', icon: '✚' },
  { key: 'maxrevive', label: 'Max Revive', icon: '✚' },
  { key: 'razzberry', label: 'Razz Berry', icon: '🍇' },
  { key: 'nanabberry', label: 'Nanab Berry', icon: '🍌' },
  { key: 'pinapberry', label: 'Pinap Berry', icon: '🍍' },
  { key: 'incense', label: 'Incense', icon: '🌫️' },
  { key: 'luckyegg', label: 'Lucky Egg', icon: '🥚' },
  { key: 'starpiece', label: 'Star Piece', icon: '⭐' },
  { key: 'incubator', label: 'Incubator', icon: '🥚' },
];

// Items shown in the plain Inventory list, i.e. everything except the raid
// passes (which get their own dedicated colored section up top).
export const NON_RAID_ITEM_CONFIG = ITEM_CONFIG.filter((c) => !RAID_PASS_KEYS.includes(c.key));

export const STEPS = [1, 25, 50, 100];

// Clamps to an item's configured max (raid pass caps like Remote's 3), or
// just floors at 0 for anything uncapped. Use this on every inventory write
// path (single-account bump, bulk bump) so the cap can never be bypassed
// depending on which screen you're adjusting from.
export function clampInventoryValue(key, value) {
  const config = ITEM_CONFIG.find((c) => c.key === key);
  const max = config?.max;
  const floored = Math.max(0, value);
  return max !== undefined ? Math.min(max, floored) : floored;
}

export function emptyStats() {
  const s = {};
  CHECK_STAT_CONFIG.forEach((c) => (s[c.key] = false));
  return s;
}

export function emptyInventory() {
  const inv = {};
  ITEM_CONFIG.forEach((c) => (inv[c.key] = 0));
  return inv;
}
