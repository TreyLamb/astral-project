// Pure helpers for the AFROTC study store (no React): the saved shape, card flags, and the one-time copy
// of the old AFOQT data. See rotcStore.jsx for the storage and sync.

export const KEY = 'arc_study_v1';
export const LEGACY_KEY = 'afoqt_progress_v1';
export const SETTING_KEYS = ['afrotc', 'afrotcCards', 'afrotcSong'];
export const emptyState = () => ({ v: 1, updatedAt: '', settings: {}, flaggedCards: {} });

// --- card flags (same behaviour as the old afoqtStorage helpers) ---
export function addCardFlag(progress, { id, subject, front }) {
  if (!id) return progress;
  return { ...progress, flaggedCards: { ...progress.flaggedCards, [id]: { id, subject, front, flaggedAt: new Date().toISOString() } } };
}
export function removeCardFlag(progress, id) {
  if (!(id in (progress.flaggedCards ?? {}))) return progress;
  const next = { ...progress.flaggedCards };
  delete next[id];
  return { ...progress, flaggedCards: next };
}
export const isCardFlagged = (progress, id) => id in (progress?.flaggedCards ?? {});

/** Pull the AFROTC parts out of an old AFOQT progress blob. Returns null when there is nothing to copy. */
export function pickLegacy(blob) {
  if (!blob || typeof blob !== 'object') return null;
  const settings = {};
  for (const k of SETTING_KEYS) if (blob.settings?.[k] && typeof blob.settings[k] === 'object') settings[k] = blob.settings[k];
  const flaggedCards = blob.flaggedCards && typeof blob.flaggedCards === 'object' ? blob.flaggedCards : {};
  if (!Object.keys(settings).length && !Object.keys(flaggedCards).length) return null;
  return { settings, flaggedCards };
}

/** A new state that takes the old data only where the new state has none. */
export function withLegacy(state, legacy) {
  if (!legacy) return state;
  const settings = { ...legacy.settings, ...state.settings };
  const flaggedCards = { ...legacy.flaggedCards, ...state.flaggedCards };
  return { ...state, settings, flaggedCards, updatedAt: state.updatedAt || new Date().toISOString() };
}
