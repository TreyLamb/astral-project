const STORAGE_KEY = 'signal_lost_save';

export const DEFAULT_SAVE = {
  playerName: 'OPERATOR-7',
  level: 1,
  totalSignal: 0,
  signalToNext: 100,
  energy: 100,
  stationHp: 3,
  maxStationHp: 3,
  skills: [],
  stationModules: [],
  highScore: 0,
  totalWordsTyped: 0,
  bestCombo: 0,
  storiesUnlocked: [],
  startedAt: null,
};

export function hasSave() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function writeSave(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function deleteSave() {
  localStorage.removeItem(STORAGE_KEY);
}
