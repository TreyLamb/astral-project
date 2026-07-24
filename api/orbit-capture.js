// Receives raw capture text relayed from an iOS Shortcut / share-sheet
// automation and writes each item straight into the SAME Firestore path
// Orbit's own client code reads/writes for the triage inbox
// (users/{uid}/orbit_inbox/{id} — see src/pages/orbit/orbitFirestore.js and
// the newInboxItem() shape in orbitConfig.js). No app-side changes needed
// for captured items to just show up in the Triage view.
//
// This is a machine caller (Shortcuts, not a signed-in browser), so auth is
// the shared static-secret pattern via requireSecret() — see
// api/_lib/auth.js and CLAUDE.md's "Backend / serverless functions" section.
import { requireSecret } from './_lib/auth.js';
import { adminDb } from './_lib/firebaseAdmin.js';

function newId() {
  return `i_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function newInboxItem(rawText, now) {
  return {
    id: newId(),
    rawText,
    createdAt: now,
    triaged: false,
    outcome: null,
    discardedAt: null,
    resultId: null,
    aiCleanedAt: null,
    aiCleanedFrom: null,
  };
}

// Body can be { text: "..." }, { items: ["...", "..."] }, or a raw JSON
// array of strings — whatever shape is easiest for a given Shortcut to send.
function extractStrings(body) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    if (typeof body.text === 'string') return [body.text];
    if (Array.isArray(body.items)) return body.items;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!requireSecret(req, res, 'ORBIT_CAPTURE_SECRET')) return;

  const uid = process.env.ORBIT_UID || process.env.FITNESS_UID;
  if (!uid) { res.status(500).json({ error: 'Server misconfigured — ORBIT_UID (or FITNESS_UID) is not set' }); return; }

  const raw = extractStrings(req.body);
  if (!raw) { res.status(400).json({ error: 'Expected { "text": "..." }, { "items": [...] }, or a raw JSON array of strings' }); return; }

  const strings = raw
    .filter((s) => typeof s === 'string')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (!strings.length) { res.status(400).json({ error: 'No non-empty text to capture' }); return; }

  let db;
  try {
    db = adminDb();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  const now = Date.now();
  let captured = 0;
  const errors = [];
  for (const rawText of strings) {
    const item = newInboxItem(rawText, now);
    try {
      await db.doc(`users/${uid}/orbit_inbox/${item.id}`).set(item);
      captured++;
    } catch (e) {
      errors.push(e.message);
    }
  }

  res.status(200).json({ captured, total: strings.length, errors });
}
