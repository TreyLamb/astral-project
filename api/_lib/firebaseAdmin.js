// Shared Firebase Admin init for api/*.js endpoints that need to write to
// Firestore from a trusted server context (the browser client SDK used
// throughout src/ can't do this outside a signed-in user's own session).
// Admin SDK writes BYPASS Firestore security rules entirely — that's exactly
// why every caller of adminDb() must already be gated by requireSecret()
// (see ./auth.js) before it's ever reached.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function ensureApp() {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
    initializeApp({ credential: cert(JSON.parse(key)) });
  }
}

export function adminDb() {
  ensureApp();
  return getFirestore();
}

// Admin SDK Auth handle — used to verify a Firebase ID token sent from the
// browser (Authorization: Bearer <idToken>) instead of a static secret, for
// endpoints a signed-in client calls directly (see orbit-ai-triage.js). A
// static secret would have to live in client-readable code, which defeats
// the point — verifyIdToken() checks the token was actually issued by this
// project's Firebase Auth and hasn't expired.
export function adminAuth() {
  ensureApp();
  return getAuth();
}
