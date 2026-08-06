const STORAGE_KEY = 'league_build_v1';
const LABELS_KEY = 'league_build_labels_v1';
const ITEM_LABELS_KEY = 'league_build_item_labels_v1';
const ACTIVE_BUILD_KEY = 'league_build_active_v1';

const LABEL_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#60A5FA', '#F472B6'];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const Storage = {
  // ── builds, keyed by champion ──
  listBuilds(championId) {
    const data = readJSON(STORAGE_KEY, {});
    return (data[championId] || []).slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getBuild(championId, buildId) {
    const data = readJSON(STORAGE_KEY, {});
    return (data[championId] || []).find(b => b.id === buildId) || null;
  },

  createBuild(championId, name) {
    const data = readJSON(STORAGE_KEY, {});
    const build = {
      id: uid(),
      name: name || 'New Build',
      blocks: [],
      updatedAt: new Date().toISOString(),
    };
    data[championId] = [...(data[championId] || []), build];
    writeJSON(STORAGE_KEY, data);
    return build;
  },

  saveBuild(championId, build) {
    const data = readJSON(STORAGE_KEY, {});
    const builds = data[championId] || [];
    const idx = builds.findIndex(b => b.id === build.id);
    const updated = { ...build, updatedAt: new Date().toISOString() };
    if (idx === -1) builds.push(updated);
    else builds[idx] = updated;
    data[championId] = builds;
    writeJSON(STORAGE_KEY, data);
    return updated;
  },

  deleteBuild(championId, buildId) {
    const data = readJSON(STORAGE_KEY, {});
    data[championId] = (data[championId] || []).filter(b => b.id !== buildId);
    writeJSON(STORAGE_KEY, data);
  },

  renameBuild(championId, buildId, name) {
    const data = readJSON(STORAGE_KEY, {});
    const builds = data[championId] || [];
    const idx = builds.findIndex(b => b.id === buildId);
    if (idx === -1) return null;
    const updated = { ...builds[idx], name, updatedAt: new Date().toISOString() };
    builds[idx] = updated;
    data[championId] = builds;
    writeJSON(STORAGE_KEY, data);
    return updated;
  },

  // ── labels — global, not per-champion; many-to-many with items ──
  getLabels() {
    return readJSON(LABELS_KEY, []);
  },

  createLabel(name) {
    const labels = readJSON(LABELS_KEY, []);
    const label = { id: uid(), name, color: LABEL_COLORS[labels.length % LABEL_COLORS.length] };
    writeJSON(LABELS_KEY, [...labels, label]);
    return label;
  },

  deleteLabel(labelId) {
    writeJSON(LABELS_KEY, readJSON(LABELS_KEY, []).filter(l => l.id !== labelId));
    const itemLabels = readJSON(ITEM_LABELS_KEY, {});
    Object.keys(itemLabels).forEach(itemId => {
      itemLabels[itemId] = itemLabels[itemId].filter(id => id !== labelId);
    });
    writeJSON(ITEM_LABELS_KEY, itemLabels);
  },

  getAllItemLabels() {
    return readJSON(ITEM_LABELS_KEY, {});
  },

  toggleItemLabel(itemId, labelId) {
    const itemLabels = readJSON(ITEM_LABELS_KEY, {});
    const current = itemLabels[itemId] || [];
    itemLabels[itemId] = current.includes(labelId)
      ? current.filter(id => id !== labelId)
      : [...current, labelId];
    writeJSON(ITEM_LABELS_KEY, itemLabels);
    return itemLabels[itemId];
  },

  // ── active build — the live in-progress edit, mirrored read-only by the
  // PIP window. Separate from the saved-builds list: it reflects unsaved
  // edits too, updated on every change, not just on "Save Build". ──
  setActiveBuild(championId, build) {
    writeJSON(ACTIVE_BUILD_KEY, { championId, build });
  },

  getActiveBuild() {
    return readJSON(ACTIVE_BUILD_KEY, null);
  },

  // The native `storage` event only fires in OTHER windows/tabs than the one
  // that wrote — exactly what the main editor window + popped-out PIP window
  // need for one-way live sync, no polling required.
  onActiveBuildChange(callback) {
    function handler(e) {
      if (e.key === ACTIVE_BUILD_KEY) callback();
    }
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};
