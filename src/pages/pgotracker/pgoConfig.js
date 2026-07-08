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

// The one stat that stays a real number per account (not a checkbox) — Main
// dash shows it as a per-account list instead of a done-count.
export const RAID_STAT = { key: 'raids', label: 'Raid Passes', icon: '🎟️' };

export const ITEM_CONFIG = [
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

export const STEPS = [1, 25, 50, 100];

export function emptyStats() {
  const s = {};
  CHECK_STAT_CONFIG.forEach((c) => (s[c.key] = false));
  s[RAID_STAT.key] = 0;
  return s;
}

export function emptyInventory() {
  const inv = {};
  ITEM_CONFIG.forEach((c) => (inv[c.key] = 0));
  return inv;
}
