// Called from the browser (a button in Orbit's Triage view) to tidy up
// untriaged inbox text: fix typos, clean up wording, no invented detail, no
// merging items. Reads/writes the same Firestore path the client uses
// directly (users/{uid}/orbit_inbox/{id} — see src/pages/orbit/
// orbitFirestore.js, newInboxItem() in orbitConfig.js).
//
// Auth is different from the other api/ endpoints on purpose: this is called
// FROM a signed-in browser tab, not a headless Shortcut, so it verifies a
// Firebase ID token (Authorization: Bearer <idToken>) instead of a static
// secret — a static secret would have to live in client-readable code,
// which defeats the point of having one. See api/_lib/firebaseAdmin.js's
// adminAuth().
import { adminAuth, adminDb } from './_lib/firebaseAdmin.js';
import { askAI, hasAnyKey } from './_lib/aiProviders.js';

function buildPrompt(rawText) {
  return [
    'You are cleaning up a single quickly-typed personal task-inbox entry.',
    'Fix typos and tidy the wording into one clear, concise task line.',
    'Do NOT invent or add any detail that is not already present.',
    'Do NOT merge this with anything else — it is exactly one item.',
    'Return ONLY the cleaned text, with no quotes, labels, or commentary.',
    '',
    `Entry: ${rawText}`,
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const header = req.headers.authorization || '';
  const idToken = header.replace(/^Bearer\s+/i, '');
  if (!idToken) { res.status(401).json({ error: 'Unauthorized' }); return; }

  let uid;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!hasAnyKey()) {
    res.status(200).json({ cleaned: 0, skipped: 0, note: 'No AI key configured on the server' });
    return;
  }

  let db;
  try {
    db = adminDb();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  const snap = await db.collection(`users/${uid}/orbit_inbox`).where('triaged', '==', false).get();

  let cleaned = 0;
  let skipped = 0;
  const errors = [];
  for (const docSnap of snap.docs) {
    const item = docSnap.data();
    const rawText = item.rawText ?? '';
    if (!rawText.trim() || item.aiCleanedFrom === rawText) { skipped++; continue; }

    try {
      const { text } = await askAI(buildPrompt(rawText));
      const cleanedText = text.trim();
      if (!cleanedText || cleanedText === rawText) { skipped++; continue; }

      const update = {
        rawText: cleanedText,
        aiCleanedAt: Date.now(),
        aiCleanedFrom: cleanedText,
      };
      // Preserve the pre-AI original once, so the UI can offer a one-click
      // revert — never overwrite it on a later re-clean pass.
      if (!item.aiOriginal) update.aiOriginal = rawText;

      await docSnap.ref.update(update);
      cleaned++;
    } catch (e) {
      skipped++;
      errors.push(e.message);
    }
  }

  res.status(200).json({ cleaned, skipped, errors });
}
