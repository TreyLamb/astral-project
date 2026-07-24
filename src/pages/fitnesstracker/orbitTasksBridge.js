// Standalone Orbit data bridge for the MFT calendar (CalendarView.jsx).
// Deliberately NOT orbitContext/useOrbitState — that context belongs to a
// different provider tree (OrbitApp), and per this feature's constraints MFT
// never mounts it. This talks straight to orbitStorage/orbitFirestore/
// orbitConfig, mirroring the same cloud-vs-local split fitnessContext.js
// itself uses (see makeBackend there) — just a much smaller slice of it
// (tasks + areas + settings only; no write-coalescing, no housekeeping).
import { OrbitStorage } from '../orbit/orbitStorage';
import { OrbitFirestore } from '../orbit/orbitFirestore';
import { newTask, newInboxItem } from '../orbit/orbitConfig';

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
    };
  }
  return {
    mode: 'local',
    getTasks: async () => OrbitStorage.getTasks(),
    getAreas: async () => OrbitStorage.getAreas(),
    getSettings: async () => OrbitStorage.getSettings(),
    saveTask: async (t) => OrbitStorage.saveTask(t),
    saveInboxItem: async (i) => OrbitStorage.saveInboxItem(i),
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
