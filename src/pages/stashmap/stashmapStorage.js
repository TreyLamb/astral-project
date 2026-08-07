// StashMap localStorage data layer. Mirrors pgoStorage.js's API shape (see
// src/pages/pgotracker/pgoStorage.js) — module object with methods, JSON
// try/catch on every read, withDefaults backfill on load — so this can swap
// to a Firestore module later (see PogoAccsFirestore.js for that pattern)
// without rewriting call sites.
import {
  withItemDefaults, withRoomDefaults, withZoneDefaults, seedData, DEFAULT_CATEGORIES,
} from './stashmapConfig';
import { withIgnoreDefaults } from './stashmapDuplicates';

const ROOMS_KEY = 'stashmap_rooms_v1';
const ZONES_KEY = 'stashmap_zones_v1';
const ITEMS_KEY = 'stashmap_items_v1';
const SETTINGS_KEY = 'stashmap_settings_v1';
const IGNORE_KEY = 'stashmap_dupe_ignore_v1';

function loadRooms() {
  try {
    const rooms = JSON.parse(localStorage.getItem(ROOMS_KEY)) || [];
    return rooms.map(withRoomDefaults);
  } catch {
    return [];
  }
}

function storeRooms(rooms) {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

function loadZones() {
  try {
    const zones = JSON.parse(localStorage.getItem(ZONES_KEY)) || [];
    return zones.map(withZoneDefaults);
  } catch {
    return [];
  }
}

function storeZones(zones) {
  localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
}

function loadItems() {
  try {
    const items = JSON.parse(localStorage.getItem(ITEMS_KEY)) || [];
    return items.map(withItemDefaults);
  } catch {
    return [];
  }
}

function storeItems(items) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

function defaultSettings() {
  return {
    categories: DEFAULT_CATEGORIES,
    viewMode: 'flat',
    // Map opens read-only. Dragging a room out from under its zones because
    // you meant to click it is the exact accident this default prevents.
    mapMode: 'dashboard',
    mapLabels: false,
  };
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

function loadIgnore() {
  try {
    return withIgnoreDefaults(JSON.parse(localStorage.getItem(IGNORE_KEY)));
  } catch {
    return withIgnoreDefaults(null);
  }
}

function storeIgnore(ignore) {
  localStorage.setItem(IGNORE_KEY, JSON.stringify(ignore));
}

export const StashmapStorage = {
  seed() {
    if (!localStorage.getItem(ROOMS_KEY)) {
      const { rooms, zones, items } = seedData();
      storeRooms(rooms);
      storeZones(zones);
      storeItems(items);
      storeSettings(defaultSettings());
    }
  },

  getRooms() {
    return loadRooms();
  },

  addRoom(room) {
    const rooms = loadRooms();
    const newRoom = withRoomDefaults(room || {});
    rooms.push(newRoom);
    storeRooms(rooms);
    return newRoom;
  },

  updateRoom(id, updates) {
    const rooms = loadRooms();
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rooms[idx] = { ...rooms[idx], ...updates, id };
    storeRooms(rooms);
    return rooms[idx];
  },

  // Moves a room and carries its zones along by the same delta. Zone coords
  // are absolute in the shared 0-1000 space (not relative to the room), so
  // without this a dragged room slides out from under its own shelves and
  // leaves every item behind on the floor plan.
  moveRoomWithZones(id, x, y) {
    const rooms = loadRooms();
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const dx = x - rooms[idx].x;
    const dy = y - rooms[idx].y;
    rooms[idx] = { ...rooms[idx], x, y };
    storeRooms(rooms);
    if (dx || dy) {
      storeZones(loadZones().map((z) => (
        z.roomId === id ? { ...z, x: z.x + dx, y: z.y + dy } : z
      )));
    }
    return rooms[idx];
  },

  // Cascades: deleting a room also deletes its zones and unassigns (rather
  // than orphans) any items that pointed into it, so the inventory never
  // shows a dangling roomId/zoneId that can't resolve to a breadcrumb.
  removeRoom(id) {
    storeRooms(loadRooms().filter((r) => r.id !== id));
    const zoneIdsInRoom = new Set(loadZones().filter((z) => z.roomId === id).map((z) => z.id));
    storeZones(loadZones().filter((z) => z.roomId !== id));
    storeItems(loadItems().map((item) => (
      item.roomId === id || zoneIdsInRoom.has(item.zoneId)
        ? { ...item, roomId: null, zoneId: null, cell: null, updatedAt: Date.now() }
        : item
    )));
  },

  getZones() {
    return loadZones();
  },

  getZonesByRoom(roomId) {
    return loadZones().filter((z) => z.roomId === roomId);
  },

  addZone(zone) {
    const zones = loadZones();
    const newZone = withZoneDefaults(zone || {});
    zones.push(newZone);
    storeZones(zones);
    return newZone;
  },

  updateZone(id, updates) {
    const zones = loadZones();
    const idx = zones.findIndex((z) => z.id === id);
    if (idx === -1) return null;
    zones[idx] = { ...zones[idx], ...updates, id };
    storeZones(zones);
    return zones[idx];
  },

  // Cascades: items placed in a deleted zone fall back to room-only
  // placement rather than pointing at a zone that no longer exists.
  removeZone(id) {
    storeZones(loadZones().filter((z) => z.id !== id));
    storeItems(loadItems().map((item) => (
      item.zoneId === id
        ? { ...item, zoneId: null, cell: null, updatedAt: Date.now() }
        : item
    )));
  },

  getItems() {
    return loadItems();
  },

  getItem(id) {
    return loadItems().find((i) => i.id === id) || null;
  },

  getItemsByZone(zoneId) {
    return loadItems().filter((i) => i.zoneId === zoneId);
  },

  getItemsByRoom(roomId) {
    return loadItems().filter((i) => i.roomId === roomId);
  },

  addItem(item) {
    const items = loadItems();
    const newItem = withItemDefaults(item || {});
    items.push(newItem);
    storeItems(items);
    return newItem;
  },

  updateItem(id, updates) {
    const items = loadItems();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = withItemDefaults({ ...items[idx], ...updates, id, updatedAt: Date.now() });
    storeItems(items);
    return items[idx];
  },

  removeItem(id) {
    storeItems(loadItems().filter((i) => i.id !== id));
  },

  // Re-parents a zone into a different room. Every item sitting in that zone
  // has to follow — its own roomId is denormalized onto the item, so without
  // this cascade the inventory breadcrumb would keep naming the old room
  // while the map drew the bin in the new one.
  moveZoneToRoom(zoneId, roomId) {
    const zones = loadZones();
    const idx = zones.findIndex((z) => z.id === zoneId);
    if (idx === -1) return null;
    zones[idx] = { ...zones[idx], roomId };
    storeZones(zones);
    storeItems(loadItems().map((item) => (
      item.zoneId === zoneId ? { ...item, roomId, updatedAt: Date.now() } : item
    )));
    return zones[idx];
  },

  getSettings() {
    return loadSettings();
  },

  updateSettings(updates) {
    const settings = { ...loadSettings(), ...updates };
    storeSettings(settings);
    return settings;
  },

  getDupeIgnore() {
    return loadIgnore();
  },

  setDupeIgnore(ignore) {
    const next = withIgnoreDefaults(ignore);
    storeIgnore(next);
    return next;
  },
};
