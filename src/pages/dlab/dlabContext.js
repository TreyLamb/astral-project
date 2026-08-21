// DLAB shared state. Kept in a .js module with NO component export so Vite
// fast-refresh stays happy (react-refresh/only-export-components) — the DlabApp
// shell consumes useDlabState() and provides the context.
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { DlabStorage, withSettingsDefaults } from './dlabStorage';
import { DlabFirestore } from './dlabFirestore';
import { buildTest, presetById } from './engine/buildTest';
import { seedFromString } from './engine/rng';
import { scoreTest } from './engine/grade';

export const DlabContext = createContext(null);
export function useDlab() { return useContext(DlabContext); }

// One uid-agnostic async API over whichever backend is active: Firestore when
// signed in (cross-device sync), localStorage otherwise (guest/offline).
function makeBackend(user) {
  if (user && firebaseReady) {
    const uid = user.uid;
    return {
      mode: 'cloud',
      getResults: () => DlabFirestore.getResults(uid),
      saveResult: (r) => DlabFirestore.saveResult(uid, r),
      updateResult: (id, u) => DlabFirestore.updateResult(uid, id, u),
      removeResult: (id) => DlabFirestore.removeResult(uid, id),
      getSettings: () => DlabFirestore.getSettings(uid),
      updateSettings: (u) => DlabFirestore.updateSettings(uid, u),
      getRecentParams: () => DlabFirestore.getRecentParams(uid),
      pushRecentParams: (v) => DlabFirestore.pushRecentParams(uid, v),
      clearHistory: () => DlabFirestore.clearHistory(uid),
    };
  }
  return {
    mode: 'local',
    getResults: async () => DlabStorage.getResults(),
    saveResult: async (r) => DlabStorage.saveResult(r),
    updateResult: async (id, u) => DlabStorage.updateResult(id, u),
    removeResult: async (id) => DlabStorage.removeResult(id),
    getSettings: async () => DlabStorage.getSettings(),
    updateSettings: async (u) => DlabStorage.updateSettings(u),
    getRecentParams: async () => DlabStorage.getRecentParams(),
    pushRecentParams: async (v) => DlabStorage.pushRecentParams(v),
    clearHistory: async () => DlabStorage.clearHistory(),
  };
}

export function useDlabState() {
  const { user } = useAuth(); // undefined (resolving) | null (guest) | object
  // While auth resolves, treat as guest so the UI never blocks; a real sign-in
  // swaps the backend and reloads once it resolves.
  const backend = useMemo(() => makeBackend(user || null), [user]);

  const [results, setResults] = useState([]);
  const [settings, setSettings] = useState(() => withSettingsDefaults(null));
  const [recentParams, setRecentParams] = useState([]);
  const [loading, setLoading] = useState(true);

  // The live sitting. Deliberately NOT persisted as it is taken: a test is a
  // pure function of its seed, so a reload rebuilds it identically from the seed
  // plus the saved answers, and storing 60 items of generated language on every
  // keystroke would be pure write amplification.
  const [test, setTest] = useState(null);
  const [responses, setResponses] = useState({});
  const [assistOn, setAssistOn] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    let alive = true;
    Promise.all([backend.getResults(), backend.getSettings(), backend.getRecentParams()])
      .then(([r, s, rp]) => {
        if (!alive) return;
        setResults(Array.isArray(r) ? r : []);
        setSettings(withSettingsDefaults(s));
        setRecentParams(Array.isArray(rp) ? rp : []);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
        showToast('Could not load saved data — working locally for now.', 'error');
      });
    return () => { alive = false; };
  }, [backend, showToast]);

  const updateSettings = useCallback(async (updates) => {
    setSettings((prev) => withSettingsDefaults({ ...prev, ...updates }));
    try { await backend.updateSettings(updates); } catch { /* local can't fail; cloud retries next load */ }
  }, [backend]);

  /**
   * Starts a sitting. `seedText` lets a shared code be replayed exactly; without
   * one a fresh seed is rolled and filtered against recent parameter vectors so
   * consecutive sittings are structurally different languages.
   */
  const startTest = useCallback((opts = {}) => {
    const preset = opts.presetId ? presetById(opts.presetId) : presetById(settings.defaultPreset);
    const written = opts.written ?? preset.written;
    const audio = opts.audio ?? preset.audio;
    const mc = opts.mc ?? preset.mc ?? false;

    const seedText = String(opts.seedText || '').trim();
    const seed = seedText ? seedFromString(seedText.toUpperCase()) : (Math.random() * 0xffffffff) >>> 0;

    // A replayed seed must reproduce its language exactly, so the anti-staleness
    // filter is skipped — it would nudge the seed onto a different language and
    // silently break the one guarantee a shared code makes.
    const built = buildTest({
      seed,
      written,
      audio,
      mc,
      presetId: opts.presetId ?? settings.defaultPreset,
      recentVectors: seedText ? [] : recentParams,
    });

    setTest(built);
    setResponses({});
    setAssistOn(false);
    setSubmitted(false);
    setStartedAt(Date.now());

    if (!seedText) {
      setRecentParams((prev) => [...prev, built.paramVector].slice(-20));
      backend.pushRecentParams(built.paramVector).catch(() => {});
    }
    return built;
  }, [settings.defaultPreset, recentParams, backend]);

  const setAnswer = useCallback((itemId, answer) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], answer, assisted: prev[itemId]?.assisted ?? false },
    }));
  }, []);

  const flagItem = useCallback((itemId, flagged) => {
    setResponses((prev) => ({ ...prev, [itemId]: { ...prev[itemId], flagged } }));
  }, []);

  const noteReplay = useCallback((itemId) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], replays: (prev[itemId]?.replays || 0) + 1 },
    }));
  }, []);

  /**
   * Turning the assist on is a one-way door for the rest of the sitting, and
   * every item answered after it is tagged so the results can report an
   * unassisted score separately. Anything already answered stays untagged —
   * those answers were genuinely unaided.
   */
  const enableAssist = useCallback(() => {
    setAssistOn(true);
  }, []);

  // Tag at answer time rather than at grade time: whether help was on the screen
  // when an answer was typed is not recoverable afterwards.
  const setAnswerTagged = useCallback((itemId, answer) => {
    setResponses((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], answer, assisted: prev[itemId]?.assisted || assistOn },
    }));
  }, [assistOn]);

  const overrideCorrect = useCallback((itemId, overridden) => {
    setResponses((prev) => ({ ...prev, [itemId]: { ...prev[itemId], overridden } }));
  }, []);

  const submitTest = useCallback(async () => {
    if (!test) return null;
    setSubmitted(true);
    const score = scoreTest(test.items, responses, { strict: settings.strictGrading });
    const record = {
      seed: test.seed,
      seedCode: test.seedCode,
      presetId: test.presetId,
      config: test.config,
      paramVector: test.paramVector,
      startedAt,
      endedAt: Date.now(),
      score,
      assistUsed: assistOn,
      // Only the answers are stored, never the generated items — the seed
      // rebuilds every item, prompt and answer key byte for byte.
      responses,
    };
    try {
      const saved = await backend.saveResult(record);
      setResults((prev) => [saved, ...prev]);
      return saved;
    } catch {
      showToast('Score could not be saved, but it is shown below.', 'error');
      return record;
    }
  }, [test, responses, startedAt, assistOn, backend, showToast, settings.strictGrading]);

  // Used by the results screen when an answer is manually marked correct. The
  // stored record holds only responses + score, so a re-score has to be written
  // back or the override is lost the moment the screen unmounts.
  const updateResult = useCallback(async (id, updates) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    try { await backend.updateResult(id, updates); } catch { /* next load reconciles */ }
  }, [backend]);

  const removeResult = useCallback(async (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
    try { await backend.removeResult(id); } catch { /* next load reconciles */ }
  }, [backend]);

  const clearHistory = useCallback(async () => {
    setResults([]);
    try { await backend.clearHistory(); } catch { /* next load reconciles */ }
  }, [backend]);

  const abandonTest = useCallback(() => {
    setTest(null);
    setResponses({});
    setAssistOn(false);
    setSubmitted(false);
    setStartedAt(null);
  }, []);

  return {
    mode: backend.mode,
    loading,
    results,
    settings,
    updateSettings,
    test,
    responses,
    assistOn,
    submitted,
    startedAt,
    startTest,
    abandonTest,
    setAnswer,
    setAnswerTagged,
    flagItem,
    noteReplay,
    enableAssist,
    overrideCorrect,
    submitTest,
    updateResult,
    removeResult,
    clearHistory,
    toast,
    showToast,
  };
}
