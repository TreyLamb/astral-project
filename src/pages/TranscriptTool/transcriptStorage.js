// localStorage layer for the what-if scenario, following the pattern in
// src/pages/mymdb/mymdbStorage.js. Everything here is a scenario the user is
// experimenting with, never the transcript itself — the transcript is static
// data and is never written back.
import { COLUMNS, NO_FILTERS } from './columns';

const KEY = 'tt-whatif';

const SORT_KEYS = new Set(COLUMNS.map((c) => c.key));
const CHIPS = new Set(['belowB', 'failing', 'repeats', 'changed']);

const EMPTY_VIEW = {
  sort: { key: 'impact', dir: 'desc' },
  filters: NO_FILTERS,
  chip: null,
  changedFirst: false,
  hideSuperseded: false,
};

const EMPTY = {
  overrides: {},      // { courseId: grade }
  extras: [],         // hypothetical future courses
  scale: 'uvu',
  honorRepeats: true,
  goal: 3.25,
  view: EMPTY_VIEW,   // sorts + filters, persisted alongside the grades
};

// Saved view state is untrusted — it can outlive a column rename or be edited
// by hand. Every field is checked against what the UI actually supports, so a
// stale key degrades to the default sort instead of rendering an empty table
// with no visible cause.
export function cleanView(v) {
  if (!v || typeof v !== 'object') return { ...EMPTY_VIEW, filters: { ...NO_FILTERS } };
  const filters = { ...NO_FILTERS };
  if (v.filters && typeof v.filters === 'object') {
    for (const k of Object.keys(NO_FILTERS)) {
      if (typeof v.filters[k] === 'string') filters[k] = v.filters[k];
    }
  }
  return {
    sort: {
      key: SORT_KEYS.has(v.sort && v.sort.key) ? v.sort.key : EMPTY_VIEW.sort.key,
      dir: (v.sort && v.sort.dir) === 'asc' ? 'asc' : 'desc',
    },
    filters,
    chip: CHIPS.has(v.chip) ? v.chip : null,
    changedFirst: !!v.changedFirst,
    hideSuperseded: !!v.hideSuperseded,
  };
}

export function loadScenario() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, view: cleanView(null) };
    const saved = JSON.parse(raw);
    return {
      ...EMPTY,
      ...saved,
      overrides: saved.overrides && typeof saved.overrides === 'object' ? saved.overrides : {},
      extras: Array.isArray(saved.extras) ? saved.extras : [],
      view: cleanView(saved.view),
    };
  } catch {
    return { ...EMPTY, view: cleanView(null) };
  }
}

export function saveScenario(scenario) {
  try {
    localStorage.setItem(KEY, JSON.stringify(scenario));
  } catch {
    // Private-browsing / quota. The scenario still works for this session.
  }
}

export function clearScenario() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export { EMPTY as EMPTY_SCENARIO, EMPTY_VIEW };
