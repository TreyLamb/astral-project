import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseReady } from '../../../firebase';
import { useAuth } from '../../../AuthContext';
import { RotcContext } from './rotcContext';
import { KEY, LEGACY_KEY, emptyState, pickLegacy, withLegacy } from './rotcData';

/**
 * Storage for the AFROTC study pages (rank drill, knowledge cards, song and creed memorizer).
 *
 * These pages used to keep their settings inside the AFOQT progress blob (`settings.afrotc`,
 * `settings.afrotcCards`, `settings.afrotcSong`, `flaggedCards`), which tied them to the TKB tool they
 * have nothing to do with. They now own their data: localStorage always (works signed out), mirrored to
 * `users/{uid}/prefs/afrotcStudy` when signed in, the same pattern as homeLayout.js.
 *
 * FIRST RUN COPIES THE OLD DATA ACROSS, once: pasted song lyrics, saved loop marks, deck selections and
 * flagged cards come from the local AFOQT blob, or from the signed-in user's AFOQT cloud document when
 * the new document does not exist yet. The old fields are left where they were; nothing is deleted.
 *
 * The shape deliberately matches what those pages already read, so they changed very little:
 *   { v, updatedAt, settings: { afrotc, afrotcCards, afrotcSong }, flaggedCards: { [cardId]: {...} } }
 */

function readLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch { /* unreadable: fall through to a fresh state */ }
  return null;
}
function readLegacyLocal() {
  try { return pickLegacy(JSON.parse(localStorage.getItem(LEGACY_KEY))); } catch { return null; }
}
function writeLocal(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode or quota: this session only */ }
}
const cloudRef = (uid) => doc(db, 'users', uid, 'prefs', 'afrotcStudy');

export function RotcStoreProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(() => readLocal() ?? withLegacy(emptyState(), readLegacyLocal()));
  const uidRef = useRef(null);
  const timer = useRef(null);
  useEffect(() => { uidRef.current = user?.uid ?? null; }, [user]);

  const pushCloud = useCallback((next) => {
    if (!firebaseReady || !db || !uidRef.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDoc(cloudRef(uidRef.current), next).catch((e) => console.error('AFROTC study cloud save failed:', e));
    }, 1500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Sign-in: take the cloud copy if it is newer, otherwise push ours; with no cloud copy at all, copy the old AFOQT data once.
  useEffect(() => {
    if (!user || !firebaseReady || !db) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(cloudRef(user.uid));
        if (cancelled) return;
        if (snap.exists()) {
          const remote = { ...emptyState(), ...snap.data() };
          setState((local) => {
            if ((remote.updatedAt || '') > (local.updatedAt || '')) { writeLocal(remote); return remote; }
            uidRef.current = user.uid;
            pushCloud(local);
            return local;
          });
          return;
        }
        const old = await getDoc(doc(db, 'users', user.uid, 'afoqt', 'progress'));
        if (cancelled) return;
        setState((local) => {
          const next = withLegacy(local, old.exists() ? pickLegacy(old.data()) : null);
          writeLocal(next);
          uidRef.current = user.uid;
          pushCloud(next);
          return next;
        });
      } catch (e) {
        console.error('AFROTC study cloud load failed, staying local:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [user, pushCloud]);

  const mutate = useCallback((fn) => {
    setState((prev) => {
      const next = { ...fn(prev), updatedAt: new Date().toISOString() };
      writeLocal(next);
      pushCloud(next);
      return next;
    });
  }, [pushCloud]);
  const updateSettings = useCallback((patch) => mutate((p) => ({ ...p, settings: { ...p.settings, ...patch } })), [mutate]);

  const value = useMemo(() => ({ progress: state, updateSettings, mutate }), [state, updateSettings, mutate]);
  return <RotcContext.Provider value={value}>{children}</RotcContext.Provider>;
}
