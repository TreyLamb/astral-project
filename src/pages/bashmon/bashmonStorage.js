const SAVE_KEY = 'bashmon_save';

export const DEFAULT_SAVE = {
  playerName: 'Trainer',
  badges: [],
  money: 3000,
  playtime: 0,
  currentTown: 'listfield',
  party: [],
  box: [],
  bag: { pokeball: 5, potion: 3 },
  rivalDefeated: [],
  flags: {},
  defeatedTrainers: [],
  starterId: null,
  startedAt: null,
};

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function loadSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function writeSave(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function addToParty(save, mon) {
  if (save.party.length < 6) save.party.push(mon);
  else save.box.push(mon);
  return save;
}

export function addItem(save, itemId, qty = 1) {
  save.bag[itemId] = (save.bag[itemId] || 0) + qty;
  return save;
}

export function removeItem(save, itemId, qty = 1) {
  save.bag[itemId] = Math.max(0, (save.bag[itemId] || 0) - qty);
  return save;
}

export function addMoney(save, amount) {
  save.money = Math.max(0, save.money + amount);
  return save;
}

export function earnBadge(save, badgeId) {
  if (!save.badges.includes(badgeId)) save.badges.push(badgeId);
  return save;
}
