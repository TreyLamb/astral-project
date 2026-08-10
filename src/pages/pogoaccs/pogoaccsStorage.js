// POGO Accs localStorage data layer. Mirrors pgoStorage.js's API shape (see
// src/pages/pgotracker/pgoStorage.js). Accounts themselves are NOT owned
// here — they're read from the existing POGO Tracker storage/Firestore
// modules (pgoStorage.js / pgoFirestore.js); this module only owns the
// pokébox/mega/group/settings data that's specific to this sub-app.
import { uid, withEntryDefaults, emptyBox, withMegasDefaults } from './pogoaccsConfig';

const BOXES_KEY = 'pogoaccs_boxes_v1';
const MEGAS_KEY = 'pogoaccs_megas_v1';
const GROUPS_KEY = 'pogoaccs_groups_v1';
const SETTINGS_KEY = 'pogoaccs_settings_v1';

function loadBoxes() {
  try {
    return JSON.parse(localStorage.getItem(BOXES_KEY)) || {};
  } catch {
    return {};
  }
}

function storeBoxes(boxes) {
  localStorage.setItem(BOXES_KEY, JSON.stringify(boxes));
}

function loadMegas() {
  try {
    return JSON.parse(localStorage.getItem(MEGAS_KEY)) || {};
  } catch {
    return {};
  }
}

function storeMegas(megas) {
  localStorage.setItem(MEGAS_KEY, JSON.stringify(megas));
}

function loadGroups() {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_KEY)) || [];
  } catch {
    return [];
  }
}

function storeGroups(groups) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

function defaultSettings() {
  return { activeAccountId: null };
}

function loadSettings() {
  try {
    return { ...defaultSettings(), ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return defaultSettings();
  }
}

function storeSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const PogoAccsStorage = {
  getBoxes() {
    return loadBoxes();
  },

  getBox(accountId) {
    const box = loadBoxes()[accountId] || emptyBox(accountId);
    return { ...box, entries: (box.entries || []).map(withEntryDefaults) };
  },

  setBoxEntries(accountId, entries) {
    const boxes = loadBoxes();
    boxes[accountId] = { accountId, entries: entries.map(withEntryDefaults) };
    storeBoxes(boxes);
    return boxes[accountId];
  },

  addEntries(accountId, newEntries) {
    const boxes = loadBoxes();
    const current = boxes[accountId] || emptyBox(accountId);
    const added = newEntries.map(withEntryDefaults);
    boxes[accountId] = { accountId, entries: [...current.entries, ...added] };
    storeBoxes(boxes);
    return boxes[accountId];
  },

  getMegas() {
    return loadMegas();
  },

  // cell = { count, megaLevel }. Passing count 0 (or no cell) removes the
  // key entirely rather than storing a zero — an account with no stored
  // entry for a mega is indistinguishable from "never invested" either way.
  setMegaCell(accountId, megaId, cell) {
    const megas = loadMegas();
    const current = withMegasDefaults(megas[accountId], accountId);
    const nextMegas = { ...current.megas };
    if (!cell || cell.count <= 0) {
      delete nextMegas[megaId];
    } else {
      nextMegas[megaId] = cell;
    }
    megas[accountId] = { ...current, megas: nextMegas };
    storeMegas(megas);
    return megas[accountId];
  },

  getGroups() {
    return loadGroups();
  },

  addGroup(name) {
    const groups = loadGroups();
    const group = { id: uid(), name: name || `Group ${groups.length + 1}`, memberAccountIds: [] };
    groups.push(group);
    storeGroups(groups);
    return group;
  },

  renameGroup(id, name) {
    const groups = loadGroups();
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    groups[idx] = { ...groups[idx], name };
    storeGroups(groups);
    return groups[idx];
  },

  removeGroup(id) {
    storeGroups(loadGroups().filter((g) => g.id !== id));
  },

  setGroupMembers(id, memberAccountIds) {
    const groups = loadGroups();
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    groups[idx] = { ...groups[idx], memberAccountIds };
    storeGroups(groups);
    return groups[idx];
  },

  getSettings() {
    return loadSettings();
  },

  updateSettings(updates) {
    const settings = { ...loadSettings(), ...updates };
    storeSettings(settings);
    return settings;
  },
};
