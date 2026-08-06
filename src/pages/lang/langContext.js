// Vocab Vault shared state. Kept in a .js module with NO component export so
// Vite fast-refresh stays happy (react-refresh/only-export-components) — the
// LangApp shell consumes useLangState() and provides the context, mirroring
// fitnessContext.js's pattern (see that file for the fuller write-up).
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { VocabStorage, StatsStorage, statWeight } from './langStorage';
import { LangFirestore } from './langFirestore';

export const LangContext = createContext(null);
export function useLang() { return useContext(LangContext); }

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function vocabSignature(w) {
  return `${w.langId}::${w.category}::${w.word}::${w.english}`;
}

// Guards the one-time local→cloud merge below so it only ever runs once per
// (device, account) pair, not on every sign-in across the app's lifetime.
function migratedKey(uidStr) {
  return `lang_cloud_migrated_v1_${uidStr}`;
}

export function useLangState() {
  const { user } = useAuth(); // undefined (resolving) | null (guest) | object
  const cloud = !!user && firebaseReady;
  const uidStr = user?.uid ?? null;

  const [vocab, setVocab] = useState(() => VocabStorage.getAll());
  const [statsMap, setStatsMap] = useState({}); // only populated/used in cloud mode
  const [loading, setLoading] = useState(false);
  const migrating = useRef(false);

  useEffect(() => {
    let alive = true;

    if (!cloud) {
      setVocab(VocabStorage.getAll());
      setStatsMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        let cloudVocab = await LangFirestore.getVocab(uidStr);
        let cloudStats = await LangFirestore.getStats(uidStr);

        // MERGE STRATEGY (runs once per device+account, first sign-in only):
        // any words/stats that exist locally but not yet in the cloud get
        // uploaded — deduped by (langId, category, word, english) for vocab —
        // so a user who added words before ever signing in keeps them. Stats
        // are merged by SUMMING correct/incorrect counts (they're additive
        // counters, not snapshots) and taking the max lastSeen. Local data is
        // left in place afterward (never cleared) so signing out still shows
        // it — this only ever adds to the cloud, never deletes from local.
        if (!migrating.current && localStorage.getItem(migratedKey(uidStr)) === null) {
          migrating.current = true;

          const localVocab = VocabStorage.getAll();
          if (localVocab.length > 0) {
            const seen = new Set(cloudVocab.map(vocabSignature));
            const toUpload = localVocab.filter((w) => {
              const sig = vocabSignature(w);
              if (seen.has(sig)) return false;
              seen.add(sig);
              return true;
            });
            if (toUpload.length > 0) {
              await Promise.all(toUpload.map((w) => LangFirestore.saveVocab(uidStr, w)));
              cloudVocab = [...cloudVocab, ...toUpload];
            }
          }

          const localStats = StatsStorage.getAll();
          const statKeys = new Set([...Object.keys(localStats), ...Object.keys(cloudStats)]);
          if (statKeys.size > 0) {
            const merged = {};
            for (const k of statKeys) {
              const l = localStats[k] || { correct: 0, incorrect: 0, lastSeen: 0 };
              const c = cloudStats[k] || { correct: 0, incorrect: 0, lastSeen: 0 };
              merged[k] = {
                correct: l.correct + c.correct,
                incorrect: l.incorrect + c.incorrect,
                lastSeen: Math.max(l.lastSeen || 0, c.lastSeen || 0),
              };
            }
            await Promise.all(Object.entries(merged).map(([k, v]) => LangFirestore.saveStat(uidStr, k, v)));
            cloudStats = merged;
          }

          localStorage.setItem(migratedKey(uidStr), String(Date.now()));
        }

        if (!alive) return;
        setVocab(cloudVocab);
        setStatsMap(cloudStats);
      } finally {
        if (alive) setLoading(false);
        migrating.current = false;
      }
    })();

    return () => { alive = false; };
  }, [cloud, uidStr]);

  const addVocab = useCallback(async (item) => {
    if (cloud) {
      const newItem = { id: uid(), createdAt: Date.now(), custom: true, ...item };
      setVocab((prev) => [...prev, newItem]);
      try { await LangFirestore.saveVocab(uidStr, newItem); } catch { /* optimistic already applied; will reappear from cloud next load */ }
      return newItem;
    }
    const newItem = VocabStorage.add(item);
    setVocab((prev) => [...prev, newItem]);
    return newItem;
  }, [cloud, uidStr]);

  const addVocabBulk = useCallback(async (items) => {
    if (cloud) {
      const newItems = items.map((it) => ({ id: uid() + Math.random().toString(36).slice(2, 5), createdAt: Date.now(), custom: true, ...it }));
      setVocab((prev) => [...prev, ...newItems]);
      try { await Promise.all(newItems.map((it) => LangFirestore.saveVocab(uidStr, it))); } catch { /* optimistic already applied */ }
      return newItems;
    }
    const newItems = VocabStorage.addBulk(items);
    setVocab((prev) => [...prev, ...newItems]);
    return newItems;
  }, [cloud, uidStr]);

  const updateVocab = useCallback(async (id, updates) => {
    setVocab((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    if (cloud) {
      try { await LangFirestore.updateVocab(uidStr, id, updates); } catch { /* optimistic already applied */ }
    } else {
      VocabStorage.update(id, updates);
    }
  }, [cloud, uidStr]);

  const removeVocab = useCallback(async (id) => {
    setVocab((prev) => prev.filter((w) => w.id !== id));
    if (cloud) {
      try { await LangFirestore.removeVocab(uidStr, id); } catch { /* optimistic already applied */ }
    } else {
      VocabStorage.remove(id);
    }
  }, [cloud, uidStr]);

  const weightFor = useCallback((key) => {
    return cloud ? statWeight(statsMap[key]) : StatsStorage.weightFor(key);
  }, [cloud, statsMap]);

  const recordStat = useCallback((key, result) => {
    if (cloud) {
      setStatsMap((prev) => {
        const cur = prev[key] || { correct: 0, incorrect: 0, lastSeen: 0 };
        const next = { ...cur };
        if (result === 'correct') next.correct += 1;
        else if (result === 'incorrect') next.incorrect += 1;
        next.lastSeen = Date.now();
        LangFirestore.saveStat(uidStr, key, next).catch(() => { /* optimistic already applied */ });
        return { ...prev, [key]: next };
      });
    } else {
      StatsStorage.record(key, result);
    }
  }, [cloud, uidStr]);

  const getByLang = useCallback((langId) => vocab.filter((w) => w.langId === langId), [vocab]);
  const getByLangCategory = useCallback((langId, category) => vocab.filter((w) => w.langId === langId && w.category === category), [vocab]);
  const categoriesForLang = useCallback((langId) => [...new Set(vocab.filter((w) => w.langId === langId).map((w) => w.category))], [vocab]);

  return useMemo(() => ({
    mode: cloud ? 'cloud' : 'local',
    loading,
    vocab,
    getByLang, getByLangCategory, categoriesForLang,
    addVocab, addVocabBulk, updateVocab, removeVocab,
    weightFor, recordStat,
  }), [cloud, loading, vocab, getByLang, getByLangCategory, categoriesForLang, addVocab, addVocabBulk, updateVocab, removeVocab, weightFor, recordStat]);
}
