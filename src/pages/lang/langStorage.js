const VOCAB_KEY = 'lang_custom_vocab_v1';
const STATS_KEY = 'lang_word_stats_v1';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadVocab() {
  try { return JSON.parse(localStorage.getItem(VOCAB_KEY)) || []; } catch { return []; }
}
function storeVocab(items) {
  localStorage.setItem(VOCAB_KEY, JSON.stringify(items));
}

export const VocabStorage = {
  getAll() {
    return loadVocab();
  },

  getByLang(langId) {
    return loadVocab().filter(w => w.langId === langId);
  },

  getByLangCategory(langId, category) {
    return loadVocab().filter(w => w.langId === langId && w.category === category);
  },

  categoriesForLang(langId) {
    return [...new Set(loadVocab().filter(w => w.langId === langId).map(w => w.category))];
  },

  add(item) {
    const items = loadVocab();
    const newItem = { id: uid(), createdAt: Date.now(), custom: true, ...item };
    items.push(newItem);
    storeVocab(items);
    return newItem;
  },

  addBulk(newItems) {
    const items = loadVocab();
    const added = newItems.map(it => ({ id: uid() + Math.random().toString(36).slice(2, 5), createdAt: Date.now(), custom: true, ...it }));
    storeVocab([...items, ...added]);
    return added;
  },

  update(id, updates) {
    const items = loadVocab();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    storeVocab(items);
    return items[idx];
  },

  remove(id) {
    storeVocab(loadVocab().filter(i => i.id !== id));
  },
};

// ── Quiz stats: per-word correct/incorrect counts + last-seen timestamp,
// used to weight review sessions toward words the user struggles with. ──

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch { return {}; }
}
function storeStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function statKey(langId, word, english) {
  return `${langId}::${word}::${english}`;
}

// Weight used for spaced-repetition-style sampling: words missed more often
// score higher, words answered correctly a lot score lower, words never seen
// get a moderate boost so they surface for practice too, and words not
// reviewed in a while drift back up. Exported standalone (not just via
// StatsStorage.weightFor) so langContext.js can apply the same formula to a
// Firestore-backed stats map when signed in, without duplicating the math.
export function statWeight(s) {
  const entry = s || { correct: 0, incorrect: 0, lastSeen: 0 };
  const seen = entry.correct + entry.incorrect;
  if (seen === 0) return 2.2;
  const daysSince = entry.lastSeen ? (Date.now() - entry.lastSeen) / 86_400_000 : 30;
  const recency = Math.min(1 + Math.sqrt(daysSince), 4);
  return Math.max(0.3, (1 + entry.incorrect * 2) / (1 + entry.correct * 0.3)) * recency;
}

export const StatsStorage = {
  get(key) {
    const stats = loadStats();
    return stats[key] || { correct: 0, incorrect: 0, lastSeen: 0 };
  },

  // Full stats map ({ [statKey]: entry }) — used by langContext.js to seed a
  // signed-in user's first cloud sync (see its migration comment).
  getAll() {
    return loadStats();
  },

  record(key, result) {
    const stats = loadStats();
    const entry = stats[key] || { correct: 0, incorrect: 0, lastSeen: 0 };
    if (result === 'correct') entry.correct += 1;
    else if (result === 'incorrect') entry.incorrect += 1;
    entry.lastSeen = Date.now();
    stats[key] = entry;
    storeStats(stats);
  },

  weightFor(key) {
    return statWeight(this.get(key));
  },
};
