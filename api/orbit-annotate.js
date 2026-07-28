// Called from the browser (Orbit's auto-scheduler, per Guidelines_Scheduler.md
// §1/§15/§17-phase-2) to turn a task title into typed scheduling metadata:
// {category, intensity, indoorOutdoor, weatherSensitive, perishable,
// estWorkMin, estRecoveryMin, idealWindow, locationName}. This is the ONLY
// job the AI does here — "AI annotates, script schedules" — so a bad/missing
// AI reply must never fail the request; it degrades to SAFE_DEFAULTS instead.
//
// Auth mirrors api/orbit-ai-triage.js exactly: this is called FROM a
// signed-in browser tab, so it verifies a Firebase ID token (Authorization:
// Bearer <idToken>) via adminAuth() rather than a static secret. It writes
// nothing to Firestore, so adminDb() is never imported/used.
import { adminAuth } from './_lib/firebaseAdmin.js';
import { askAI, hasAnyKey } from './_lib/aiProviders.js';
import { SAFE_DEFAULTS, buildAnnotationPrompt, parseAnnotation, validateAnnotation } from './_lib/annotate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  const header = req.headers.authorization || '';
  const idToken = header.replace(/^Bearer\s+/i, '');
  if (!idToken) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    await adminAuth().verifyIdToken(idToken);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!hasAnyKey()) {
    res.status(200).json({ annotation: null, source: 'none', note: 'No AI key configured on the server' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const title = (body && body.title) || '';
  if (!title.trim()) { res.status(400).json({ error: 'title required' }); return; }

  try {
    const prompt = buildAnnotationPrompt(title);

    let annotation = null;
    for (let attempt = 0; attempt < 2 && !annotation; attempt++) {
      const { text } = await askAI(prompt, { temperature: 0 });
      annotation = validateAnnotation(parseAnnotation(text));
    }

    if (!annotation) {
      res.status(200).json({ annotation: SAFE_DEFAULTS, source: 'default' });
      return;
    }

    res.status(200).json({ annotation, source: 'ai' });
  } catch {
    res.status(200).json({ annotation: SAFE_DEFAULTS, source: 'default' });
  }
}
