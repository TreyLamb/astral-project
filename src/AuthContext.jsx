// Single global Firebase Auth session for the whole site. Any feature that
// wants cross-device sync (TKB, PGO Tracker, ...) reads `user` from here
// instead of running its own onAuthStateChanged listener — sign in once
// anywhere on the site and every feature sees it, since they all share the
// one `auth` instance from src/firebase.js.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut,
} from 'firebase/auth';
import { auth, googleProvider, firebaseReady } from './firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
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
    // Defensive fallback (2026-07-10): onAuthStateChanged can silently never fire at all —
    // confirmed live when Firebase App Check hit its recaptcha rate limit
    // ("appCheck/initial-throttle", 24h cooldown) and Auth's calls, which go through App
    // Check's verification pipeline (see firebase.js's init-order comment), just hung with
    // zero console errors or rejections. Since `user` starts at `undefined` ("still
    // resolving") and every Firebase-gated feature site-wide (PGO Tracker, MyMDB, TKB, the
    // Navbar sign-in button) waits on that, a silent hang here means the WHOLE SITE looks
    // stuck loading, forever, with nothing to debug. If the listener hasn't resolved within
    // 6s, assume signed-out so the site degrades to device-only mode instead of hanging —
    // a real auth state arriving later still wins normally (only overrides while still
    // `undefined`, never overwrites an already-resolved value).
    const timeout = setTimeout(() => setUser((u) => (u === undefined ? null : u)), 6000);
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  // Always redirect now, never popup (2026-07-10). Popup used to be the desktop path
  // (nicer non-navigating UX, and it used to work) — dropped after hitting a real,
  // reproducible failure: signInWithPopup relies on polling `popup.closed` to detect
  // completion, which throws "Cross-Origin-Opener-Policy policy would block the
  // window.closed call" under a strict COOP policy (a Chrome default in some contexts,
  // not something this app sets — no COOP header anywhere in vite.config.js). When that
  // polling breaks, the Firebase Auth SDK itself hits a known internal bug
  // ("INTERNAL ASSERTION FAILED: Pending promise was never set") and the popup flow
  // never completes — sign-in silently fails with no usable error. Redirect (full page
  // navigation to Google and back) doesn't poll a popup handle at all, so it can't hit
  // this class of failure on any platform.
  const signIn = useCallback(async () => {
    if (!firebaseReady) return { ok: false, error: 'Firebase is not configured in this environment.' };
    try {
      // Navigates away immediately — nothing after this line runs in this
      // page lifecycle. The page reloads signed-in once Google redirects back.
      await signInWithRedirect(auth, googleProvider);
      return { ok: true, redirecting: true };
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
