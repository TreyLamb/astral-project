// Shared Firebase Admin init for api/*.js endpoints that need to write to
// Firestore from a trusted server context (the browser client SDK used
// throughout src/ can't do this outside a signed-in user's own session).
// Admin SDK writes BYPASS Firestore security rules entirely — that's exactly
// why every caller of adminDb() must already be gated by requireSecret()
// (see ./auth.js) before it's ever reached.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function adminDb() {
  if (!getApps().length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
    initializeApp({ credential: cert(JSON.parse(key)) });
  }
  return getFirestore();
}
