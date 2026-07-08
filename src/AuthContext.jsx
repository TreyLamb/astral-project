// Single global Firebase Auth session for the whole site. Any feature that
// wants cross-device sync (TKB, PGO Tracker, ...) reads `user` from here
// instead of running its own onAuthStateChanged listener — sign in once
// anywhere on the site and every feature sees it, since they all share the
// one `auth` instance from src/firebase.js.
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
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
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    if (!firebaseReady) return { ok: false, error: 'Firebase is not configured in this environment.' };
    try {
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
