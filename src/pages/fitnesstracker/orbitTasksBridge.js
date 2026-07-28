// Standalone Orbit data bridge for the MFT calendar (CalendarView.jsx).
// Deliberately NOT orbitContext/useOrbitState — that context belongs to a
// different provider tree (OrbitApp), and per this feature's constraints MFT
// never mounts it. This talks straight to orbitStorage/orbitFirestore/
// orbitConfig, mirroring the same cloud-vs-local split fitnessContext.js
// itself uses (see makeBackend there) — just a much smaller slice of it
// (tasks + areas + settings only; no write-coalescing, no housekeeping).
import { OrbitStorage } from '../orbit/orbitStorage';
import { OrbitFirestore } from '../orbit/orbitFirestore';
import { newTask, newInboxItem, newBase, nextBaseColor } from '../orbit/orbitConfig';
import { geocodePlaceName } from '../orbit/orbitWeatherService';

function backendFor(user, firebaseReady) {
  if (user && firebaseReady) {
    const uid = user.uid;
    return {
      mode: 'cloud',
      getTasks: () => OrbitFirestore.getTasks(uid),
      getAreas: () => OrbitFirestore.getAreas(uid),
      getSettings: () => OrbitFirestore.getSettings(uid),
      saveTask: (t) => OrbitFirestore.saveTask(uid, t),
      saveInboxItem: (i) => OrbitFirestore.saveInboxItem(uid, i),
      updateSettings: (patch) => OrbitFirestore.updateSettings(uid, patch),
    };
  }
  return {
    mode: 'local',
    getTasks: async () => OrbitStorage.getTasks(),
    getAreas: async () => OrbitStorage.getAreas(),
    getSettings: async () => OrbitStorage.getSettings(),
    saveTask: async (t) => OrbitStorage.saveTask(t),
    saveInboxItem: async (i) => OrbitStorage.saveInboxItem(i),
    updateSettings: async (patch) => OrbitStorage.updateSettings(patch),
  };
}

// Everything the calendar needs in one round trip: tasks to render as chips,
// areas (chip color + quick-add's area pick), settings (quick-add's
// newTask(partial, settings) priority scoring). Defensive array/object
// fallbacks throughout — a bad read here must degrade to "no Orbit chips on
// the calendar", never take the whole fitness calendar down with it.
export async function loadOrbitBridgeData(user, firebaseReady) {
  const backend = backendFor(user, firebaseReady);
  const [tasks, areas, settings] = await Promise.all([
    backend.getTasks(), backend.getAreas(), backend.getSettings(),
  ]);
  return {
    mode: backend.mode,
    tasks: Array.isArray(tasks) ? tasks : [],
    areas: Array.isArray(areas) ? areas : [],
    settings: settings || null,
  };
}

// Quick-add a to-do straight into Orbit's own store, bypassing Orbit's React
// context entirely (a live Orbit tab won't see this until it reloads/
// refetches — acceptable per this feature's constraints, not something to
// try to live-sync). Files under the first non-archived area; with none,
// falls back to an Orbit Inbox capture (same "nothing lost" behavior Orbit's
// own CaptureBar/TriageView rely on) so a workspace with zero areas set up
// still has somewhere for the title to land.
export async function quickAddOrbitTask(user, firebaseReady, { title, scheduledDate, areas, settings }) {
  const backend = backendFor(user, firebaseReady);
  const area = (areas || []).find((a) => !a.archived) || null;
  if (!area) {
    const item = newInboxItem({ rawText: title });
    await backend.saveInboxItem(item);
    return { kind: 'inbox', item };
  }
  const task = newTask({ title, scheduledDate, areaId: area.id }, settings);
  await backend.saveTask(task);
  return { kind: 'task', item: task };
}

// ---- "where I am" per-day base locations (writes back to Orbit settings) ----
// The fitness calendar tags each day with the base the owner is at; Orbit's
// travel/weather/scheduler then reason from there. Both writes go through Orbit's
// own settings so a live Orbit tab picks them up on its next read (same
// eventual-consistency contract as quickAddOrbitTask above).

// Set (baseId) or clear (baseId=null) the base for a given ISO day.
export async function setOrbitDayLocation(user, firebaseReady, iso, baseId) {
  const backend = backendFor(user, firebaseReady);
  const settings = await backend.getSettings();
  const dayLocations = { ...(settings.dayLocations || {}) };
  if (baseId) dayLocations[iso] = baseId; else delete dayLocations[iso];
  await backend.updateSettings({ dayLocations });
  return dayLocations;
}

// Every ISO day in [fromISO, toISO] inclusive (swaps an inverted range, caps at
// ~1yr so a typo can't blow up the settings doc).
function isoRange(fromISO, toISO) {
  let a = fromISO; let b = toISO;
  if (a > b) { const t = a; a = b; b = t; }
  const out = [];
  const d = new Date(`${a}T00:00:00`);
  const end = new Date(`${b}T00:00:00`);
  if (Number.isNaN(d.getTime()) || Number.isNaN(end.getTime())) return out;
  while (d <= end && out.length < 400) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Tag (baseId) or clear (baseId=null) a whole date range in ONE settings write —
// "I'll be in Paris Aug 1–10". The multi-day counterpart to setOrbitDayLocation.
export async function setOrbitDayLocationsRange(user, firebaseReady, fromISO, toISO, baseId) {
  const backend = backendFor(user, firebaseReady);
  const settings = await backend.getSettings();
  const dayLocations = { ...(settings.dayLocations || {}) };
  for (const iso of isoRange(fromISO, toISO)) {
    if (baseId) dayLocations[iso] = baseId; else delete dayLocations[iso];
  }
  await backend.updateSettings({ dayLocations });
  return dayLocations;
}

// Create a new base (geocoded once via its disambiguated query — best-effort;
// a geocode miss still stores the base, just without coords) and return it.
export async function addOrbitBase(user, firebaseReady, { tag, query, isHome = false }) {
  const backend = backendFor(user, firebaseReady);
  const settings = await backend.getSettings();
  const existing = settings.bases || [];
  const base = newBase({ tag, query, isHome, color: nextBaseColor(existing.length) });
  const geo = await geocodePlaceName(base.query || base.tag);
  if (geo) { base.lat = geo.lat; base.lng = geo.lng; base.geocodedAt = Date.now(); }
  await backend.updateSettings({ bases: [...existing, base] });
  return base;
}
