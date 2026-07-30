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

// Set right before navigating to Google, cleared once a redirect actually
// produces a user. If it's still set after auth has settled signed-out, the
// round trip silently failed — which is the iOS/Safari failure mode where
// nothing throws and you just land back on the sign-in button forever.
// sessionStorage (not local) so it's per-tab and can't outlive the attempt.
const PENDING_KEY = 'astral_signin_pending_v1';

// Temporary diagnostic trace (2026-07-30) for the Safari/iOS redirect-loop
// bug — remove once that's confirmed fixed. sessionStorage-backed (not React
// state alone) because signInWithRedirect does a FULL page navigation away to
// Google and back: any log line only held in memory before that navigation
// would be wiped when the page unloads. This is the same reason PENDING_KEY
// above uses sessionStorage instead of a plain variable.
const DIAG_KEY = 'astral_auth_diag_v1';
function readDiag() {
  try { return JSON.parse(sessionStorage.getItem(DIAG_KEY) || '[]'); } catch { return []; }
}
function pushDiag(msg) {
  const line = `[${new Date().toISOString().slice(11, 23)}] ${msg}`;
  console.log('[auth-diag]', line);
  try {
    const next = [...readDiag(), line].slice(-60);
    sessionStorage.setItem(DIAG_KEY, JSON.stringify(next));
    return next;
  } catch (e) {
    console.error('[auth-diag] sessionStorage write failed:', e);
    return readDiag();
  }
}

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // undefined = still resolving on first load, null = signed out (guest), object = signed in
  const [user, setUser] = useState(undefined);
  // Distinguishes a *trustworthy* signed-out from a `null` that's still settling
  // (mid-redirect, or the 6s bail-out below). Anything that puts a sign-in
  // prompt on screen should gate on this — see WelcomeGate.
  const [authSettled, setAuthSettled] = useState(false);
  // "You tried to sign in and it silently didn't work" — surfaced in the UI so
  // this stops looking like a mystery loop.
  const [signInFailed, setSignInFailed] = useState(false);
  // Raw error text for the failure above, when there is one (getRedirectResult
  // can also fail "silently" — redirect completes, no error thrown, just no
  // user — in which case this stays null and signInFailed alone is the signal).
  const [signInErrorDetail, setSignInErrorDetail] = useState(null);
  // Full step-by-step trace of this tab's most recent sign-in attempt —
  // see DIAG_KEY comment above. Hydrated from sessionStorage on mount so it
  // survives the redirect round trip.
  const [diagLog, setDiagLog] = useState(readDiag);

  const log = useCallback((msg) => setDiagLog(pushDiag(msg)), []);

  useEffect(() => {
    log(`AuthProvider mounted — firebaseReady=${firebaseReady}, standalone=${window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true}, UA=${navigator.userAgent}`);
    if (!firebaseReady) { log('Firebase not ready — treating as signed out.'); setUser(null); setAuthSettled(true); return; }
    let cancelled = false;

    let pendingAtMount = null;
    try { pendingAtMount = sessionStorage.getItem(PENDING_KEY); } catch (e) { log(`sessionStorage.getItem(PENDING_KEY) threw: ${e.message}`); }
    log(`On mount, PENDING_KEY=${pendingAtMount ?? '(not set)'}`);

    // Surfaces errors from a completed redirect flow (e.g. account-exists-
    // with-different-credential) — onAuthStateChanged below still fires
    // normally either way once the SDK processes the redirect.
    //
    // It's also the gate for `authSettled` (2026-07-28): coming back from
    // Google, onAuthStateChanged fires `null` FIRST and the real user only once
    // the redirect result is processed. Treating that first null as "signed
    // out" is what made the welcome modal flash up and vanish on mobile.
    log('Calling getRedirectResult()...');
    const redirectDone = getRedirectResult(auth)
      .then((res) => {
        log(`getRedirectResult() resolved — user=${res?.user?.email ?? '(none)'}`);
        if (res?.user) {
          try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { log(`sessionStorage.removeItem(PENDING_KEY) threw: ${e.message}`); }
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err);
        log(`getRedirectResult() REJECTED — ${err.code || 'no-code'}: ${err.message || err}`);
        if (!cancelled) setSignInErrorDetail(`${err.code || 'unknown'}: ${err.message || err}`);
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      log(`onAuthStateChanged fired — user=${u?.email ?? 'null'}`);
      setUser(u ?? null);
      if (u) {
        try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { log(`sessionStorage.removeItem(PENDING_KEY) threw: ${e.message}`); }
      }
      redirectDone.then(() => {
        if (cancelled) return;
        setAuthSettled(true);
        // Came back from Google still signed out, with an attempt outstanding.
        // Consume the flag so a later manual retry starts from a clean slate.
        let stillPending = null;
        try { stillPending = sessionStorage.getItem(PENDING_KEY); } catch (e) { log(`sessionStorage.getItem(PENDING_KEY) threw: ${e.message}`); }
        if (!u && stillPending) {
          log(`authSettled with no user but PENDING_KEY still set (${stillPending}) — marking signInFailed.`);
          try { sessionStorage.removeItem(PENDING_KEY); } catch (e) { log(`sessionStorage.removeItem(PENDING_KEY) threw: ${e.message}`); }
          setSignInFailed(true);
        } else {
          log(`authSettled — user=${u?.email ?? 'null'}, pending=${stillPending ?? '(none)'} — no failure flagged.`);
        }
      });
    });
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
    const timeout = setTimeout(() => {
      log('6s timeout fired.');
      setUser((u) => {
        if (u === undefined) { log('...user was still undefined — forcing signed-out.'); return null; }
        log(`...user was already ${u?.email ?? 'null'} — timeout is a no-op.`);
        return u;
      });
    }, 6000);
    return () => { cancelled = true; unsub(); clearTimeout(timeout); };
  }, [log]);

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
    try { sessionStorage.removeItem(DIAG_KEY); } catch { /* best-effort reset */ }
    setDiagLog([]);
    log(`signIn() called — authDomain will be whatever firebaseConfig.authDomain resolved to at build time.`);
    if (!firebaseReady) { log('signIn() bailed — firebaseReady is false.'); return { ok: false, error: 'Firebase is not configured in this environment.' }; }
    try {
      setSignInFailed(false);
      setSignInErrorDetail(null);
      try {
        sessionStorage.setItem(PENDING_KEY, '1');
        log('PENDING_KEY set — about to call signInWithRedirect().');
      } catch (e) {
        log(`sessionStorage.setItem(PENDING_KEY) THREW before redirect even started: ${e.message}`);
        throw e;
      }
      // Navigates away immediately — nothing after this line runs in this
      // page lifecycle. The page reloads signed-in once Google redirects back.
      await signInWithRedirect(auth, googleProvider);
      // Only reachable if signInWithRedirect resolved WITHOUT navigating away
      // — not expected, but if it happens we want it in the trace.
      log('signInWithRedirect() resolved without navigating away (unexpected).');
      return { ok: true, redirecting: true };
    } catch (err) {
      log(`signInWithRedirect() THREW — ${err.code || 'no-code'}: ${err.message || err}`);
      setSignInErrorDetail(`${err.code || 'unknown'}: ${err.message || err}`);
      try { sessionStorage.removeItem(PENDING_KEY); } catch { /* best-effort */ }
      return { ok: false, error: err?.message ?? 'Sign-in failed' };
    }
  }, [log]);

  const signOutUser = useCallback(async () => {
    if (!firebaseReady) return;
    log('signOut() called.');
    await signOut(auth);
  }, [log]);

  return (
    <AuthContext.Provider value={{ user, authSettled, signInFailed, signInErrorDetail, diagLog, firebaseReady, signIn, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}
