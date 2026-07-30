import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Google Sign-In (used site-wide — TKB, PGO Tracker, FitnessTracker Calendar
// connect, etc. — not mymdb-specific) runs through ONE OAuth 2.0 Client ID
// that Firebase auto-created under the astral-project-10a35 GCP project. In
// Google Cloud Console > APIs & Services > Credentials it's named
// "Firebase Web Auth — site-wide Google Sign-In" (renamed 2026-07-30 from
// "mymdb auth", which undersold what it's actually used for). That's the
// client whose Authorized JavaScript origins / Authorized redirect URIs need
// to list this site's real domain (astral-project.vercel.app) for
// signInWithRedirect to complete — if that's ever missing, sign-in fails
// with no error until the domain is added there.
//
// If you need to re-find it without relying on the name: Firebase Console >
// Authentication > Sign-in method > Google > Web SDK configuration > "Web
// client ID" gives the exact client ID string, which you can match against
// the ID column (not name) in the GCP Credentials list.

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export let db = null;
export let auth = null;
export let googleProvider = null;
export let firebaseReady = false;

try {
  const app = initializeApp(firebaseConfig);

  // App Check must be initialized before any other product SDK (getFirestore,
  // getAuth, ...) — it hooks into the request pipeline so those SDKs' calls
  // carry a verified token from the start. Doing this after was causing the
  // first burst of requests on every page load to go out unverified/invalid.
  //
  // Skipped entirely in local dev (2026-07-10): 'localhost' used to be a registered
  // domain on the reCAPTCHA v3 key so real verification ran locally too — but repeated
  // local dev server reloads (and, concretely, a session of heavy automated Playwright
  // testing) exhausted reCAPTCHA's rate limit for that key, tripping App Check's
  // "initial-throttle" (24h cooldown). Auth/Firestore calls don't fail loudly when that
  // happens — App Check just never issues a token, so the calls hang forever with zero
  // console errors, which looked like (and effectively was) the whole site being stuck
  // loading. Prod was never affected since it never received that traffic. There's no
  // legitimate security reason to App-Check-verify local dev traffic anyway — App Check
  // exists to prove requests come from this real app, not scripted/local access, which
  // is exactly what local dev IS. `import.meta.env.DEV` is Vite's own dev-vs-build flag,
  // so this only affects `npm run dev` — a real production build still enforces normally.
  const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
  if (appCheckSiteKey && !import.meta.env.DEV) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.error('App Check failed to initialize (Firestore still works, just unverified):', err);
    }
  }

  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  firebaseReady = true;
} catch (err) {
  // Missing/invalid VITE_FIREBASE_* env vars must not crash the whole app —
  // MymdbApp checks firebaseReady and degrades gracefully instead.
  console.error('Firebase failed to initialize — MyMDB will be unavailable:', err);
}
