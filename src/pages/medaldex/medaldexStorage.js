// MedalDex localStorage data layer. Mirrors pogoaccsStorage.js's API shape
// (see src/pages/pogoaccs/pogoaccsStorage.js). Accounts themselves are NOT
// owned here -- they're read from POGO Tracker's storage/Firestore modules
// (pgoStorage.js / pgoFirestore.js); this module only owns MedalDex's own
// dex-progress/medal-value/settings data.
import { emptySpeciesFlags, withAccountDexDefaults, withMedalsDefaults } from './medaldexConfig';

const DEX_KEY = 'medaldex_dex_v1';
const MEDALS_KEY = 'medaldex_medals_v1';
const SETTINGS_KEY = 'medaldex_settings_v1';

function loadDex() {
  try {
    return JSON.parse(localStorage.getItem(DEX_KEY)) || {};
  } catch {
    return {};
  }
}

function storeDex(dex) {
  localStorage.setItem(DEX_KEY, JSON.stringify(dex));
}

function loadMedals() {
  try {
    return JSON.parse(localStorage.getItem(MEDALS_KEY)) || {};
  } catch {
    return {};
  }
}

function storeMedals(medals) {
  localStorage.setItem(MEDALS_KEY, JSON.stringify(medals));
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

export const MedalDexStorage = {
  // { [accountId]: { accountId, species: { [speciesId]: {normal,lucky,shadow,purified,mega,shiny} } } }
  getDex() {
    return loadDex();
  },

  setSpeciesCategory(accountId, speciesId, category, value) {
    const dex = loadDex();
    const doc = withAccountDexDefaults(dex[accountId], accountId);
    const currentFlags = { ...emptySpeciesFlags(), ...doc.species[speciesId] };
    const nextFlags = { ...currentFlags, [category]: value };
    const nextSpecies = { ...doc.species, [speciesId]: nextFlags };
    dex[accountId] = { ...doc, species: nextSpecies };
    storeDex(dex);
    return nextFlags;
  },

  // { [accountId]: { accountId, medals: { [medalId]: number } } }
  getMedals() {
    return loadMedals();
  },

  setMedalValue(accountId, medalId, value) {
    const medals = loadMedals();
    const doc = withMedalsDefaults(medals[accountId], accountId);
    const clamped = Math.max(0, Number(value) || 0);
    const nextMedals = { ...doc.medals, [medalId]: clamped };
    medals[accountId] = { ...doc, medals: nextMedals };
    storeMedals(medals);
    return nextMedals;
  },

  getSettings() {
    return loadSettings();
  },

  updateSettings(updates) {
    const settings = { ...loadSettings(), ...updates };
    storeSettings(settings);
    return settings;
  },

  // Bulk import for progress export/import (COULD #32) -- one localStorage
  // write per data kind instead of one setSpeciesCategory/setMedalValue call
  // per flag/medal, which matters here since a full export can carry
  // hundreds of species entries. Merges into existing data (imported values
  // win per-key) rather than replacing the whole account doc, so importing
  // a partial export never wipes out untouched species/medals.
  importAccountData(accountId, { species, medals } = {}) {
    const out = {};
    if (species) {
      const dex = loadDex();
      const doc = withAccountDexDefaults(dex[accountId], accountId);
      dex[accountId] = { ...doc, species: { ...doc.species, ...species } };
      storeDex(dex);
      out.species = dex[accountId].species;
    }
    if (medals) {
      const medalsStore = loadMedals();
      const doc = withMedalsDefaults(medalsStore[accountId], accountId);
      medalsStore[accountId] = { ...doc, medals: { ...doc.medals, ...medals } };
      storeMedals(medalsStore);
      out.medals = medalsStore[accountId].medals;
    }
    return out;
  },
};
