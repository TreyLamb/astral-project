// Single global Firebase Auth session for the whole site. Any feature that
// wants cross-device sync (TKB, PGO Tracker, ...) reads `user` from here
// instead of running its own onAuthStateChanged listener — sign in once
// anywhere on the site and every feature sees it, since they all share the
// one `auth` instance from src/firebase.js.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
} from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from './firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// signInWithPopup gets silently blocked/killed on most mobile browsers
// (Safari iOS and many Android browsers restrict JS-opened popup windows for
// OAuth) — the click registers but nothing ever appears. Redirect (full page
// navigation to Google and back) is the reliable pattern there; popup stays
// on desktop since it's the nicer non-navigating UX and works fine there.
function isMobile() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function AuthProvider({ children }) {
  // undefined = still resolving on first load, null = signed out (guest), object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!firebaseReady) { setUser(null); return; }
    // Surfaces errors from a completed redirect flow (e.g. account-exists-
    // with-different-credential) — onAuthStateChanged below still fires
    // normally either way once the SDK processes the redirect.
    getRedirectResult(auth).catch((err) => console.error('Redirect sign-in error:', err));
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    if (!firebaseReady) return { ok: false, error: 'Firebase is not configured in this environment.' };
    try {
      if (isMobile()) {
        // Navigates away immediately — nothing after this line runs in this
        // page lifecycle. The page reloads signed-in once Google redirects back.
        await signInWithRedirect(auth, googleProvider);
        return { ok: true, redirecting: true };
      }
      await signInWithPopup(auth, googleProvider);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message ?? 'Sign-in failed' };
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!firebaseReady) return;
    await signOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseReady, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}
