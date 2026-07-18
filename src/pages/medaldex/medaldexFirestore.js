// MedalDex Firestore data layer -- used only when signed in (see
// AuthContext). Mirrors medaldexStorage.js's API shape 1:1, just persisted
// under users/{uid}/medaldex_dex/{accountId}, users/{uid}/medaldex_medals/{accountId}
// and users/{uid}/medaldex_meta/settings -- same collection-per-account-doc
// pattern as pogoaccsFirestore.js (see src/pages/pogoaccs/pogoaccsFirestore.js).
// Accounts themselves live in PGO Tracker's own collections (pgoFirestore.js)
// -- this module never reads or writes them.
import { collection, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { emptySpeciesFlags, withAccountDexDefaults, withMedalsDefaults } from './medaldexConfig';

function dexRef(uidStr) {
  return collection(db, 'users', uidStr, 'medaldex_dex');
}
function dexDocRef(uidStr, accountId) {
  return doc(db, 'users', uidStr, 'medaldex_dex', accountId);
}
function medalsRef(uidStr) {
  return collection(db, 'users', uidStr, 'medaldex_medals');
}
function medalsDocRef(uidStr, accountId) {
  return doc(db, 'users', uidStr, 'medaldex_medals', accountId);
}
function settingsDocRef(uidStr) {
  return doc(db, 'users', uidStr, 'medaldex_meta', 'settings');
}

function defaultSettings() {
  return { activeAccountId: null };
}

export const MedalDexFirestore = {
  // Creates the settings doc if missing -- also doubles as the security-rules
  // write probe on first signed-in load (see pogoaccsFirestore.js's identical
  // comment). No other seeding: empty dex/medals docs are the valid zero
  // state, nothing to create for them.
  async ensureSettings(uidStr) {
    const snap = await getDoc(settingsDocRef(uidStr));
    if (snap.exists()) return { ...defaultSettings(), ...snap.data() };
    const settings = defaultSettings();
    await setDoc(settingsDocRef(uidStr), settings);
    return settings;
  },

  async getDex(uidStr) {
    const snap = await getDocs(dexRef(uidStr));
    const dex = {};
    snap.docs.forEach((d) => { dex[d.id] = d.data(); });
    return dex;
  },

  async setSpeciesCategory(uidStr, accountId, speciesId, category, value) {
    const snap = await getDoc(dexDocRef(uidStr, accountId));
    const current = withAccountDexDefaults(snap.exists() ? snap.data() : undefined, accountId);
    const currentFlags = { ...emptySpeciesFlags(), ...current.species[speciesId] };
    const nextFlags = { ...currentFlags, [category]: value };
    const nextSpecies = { ...current.species, [speciesId]: nextFlags };
    const next = { ...current, species: nextSpecies };
    await setDoc(dexDocRef(uidStr, accountId), next);
    return nextFlags;
  },

  async getMedals(uidStr) {
    const snap = await getDocs(medalsRef(uidStr));
    const medals = {};
    snap.docs.forEach((d) => { medals[d.id] = d.data(); });
    return medals;
  },

  async setMedalValue(uidStr, accountId, medalId, value) {
    const snap = await getDoc(medalsDocRef(uidStr, accountId));
    const current = withMedalsDefaults(snap.exists() ? snap.data() : undefined, accountId);
    const clamped = Math.max(0, Number(value) || 0);
    const nextMedals = { ...current.medals, [medalId]: clamped };
    const next = { ...current, medals: nextMedals };
    await setDoc(medalsDocRef(uidStr, accountId), next);
    return nextMedals;
  },

  async getSettings(uidStr) {
    const snap = await getDoc(settingsDocRef(uidStr));
    return snap.exists() ? { ...defaultSettings(), ...snap.data() } : defaultSettings();
  },

  async updateSettings(uidStr, updates) {
    const current = await this.getSettings(uidStr);
    const merged = { ...current, ...updates };
    await setDoc(settingsDocRef(uidStr), merged);
    return merged;
  },
};
