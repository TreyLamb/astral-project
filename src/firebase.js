import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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
  const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
  if (appCheckSiteKey) {
    try {
      // 'localhost' is a registered domain on the reCAPTCHA v3 key, so real
      // verification works in local dev too — no debug token needed.
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
