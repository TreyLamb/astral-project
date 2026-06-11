import { SEED_DATA } from './mymdbSeed';

const STORAGE_KEY = 'mymdb_v1';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function store(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const Storage = {
  seed() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      store(SEED_DATA);
    }
  },

  getAll() {
    return load().sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  },

  getById(id) {
    return load().find(item => item.id === id) || null;
  },

  save(item) {
    const items = load();
    const newItem = {
      id: uid(),
      dateAdded: new Date().toISOString().slice(0, 10),
      additionalImages: [],
      ...item,
    };
    items.push(newItem);
    store(items);
    return newItem;
  },

  update(id, updates) {
    const items = load();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    store(items);
    return items[idx];
  },

  remove(id) {
    store(load().filter(i => i.id !== id));
  },
};
