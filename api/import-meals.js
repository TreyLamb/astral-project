// Receives nutrition entries relayed from an iOS Shortcut (MyFitnessPal ->
// Apple Health -> a Shortcuts automation -> here) and writes them straight
// into the SAME Firestore path FitnessTracker's own client code reads
// (users/{uid}/fitness_meals/{mealId} — see src/pages/fitnesstracker/
// fitnessFirestore.js's mealDocRef/getMeals), matching the newMeal() shape
// from fitnessConfig.js field-for-field. No app-side changes needed for
// imported meals to just show up in the Meals tab / calendar.
//
// Idempotent by design when possible: pass each entry's HealthKit sample
// uuid as item.sourceId and re-running the same day's sync overwrites the
// same doc instead of duplicating it. Without a sourceId it always creates a
// fresh doc — fine for a one-off manual import, but the daily-automation
// Shortcut should send sourceId.
import { requireSecret } from './_lib/auth.js';
import { adminDb } from './_lib/firebaseAdmin.js';

function newId() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// MFP/HealthKit nutrition entries don't reliably carry a breakfast/lunch/
// dinner tag through to Health — falls back to a time-of-day bucket so
// imported meals still land in a sensible column instead of always
// "snack." Matches DEFAULT_MEAL_TYPES' 4 buckets from fitnessConfig.js.
function inferMealType(time) {
  const h = Number(String(time || '').slice(0, 2));
  if (Number.isNaN(h)) return 'snack';
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 20) return 'dinner';
  return 'snack';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!requireSecret(req, res, 'MFP_IMPORT_SECRET')) return;

  const uid = process.env.FITNESS_UID;
  if (!uid) { res.status(500).json({ error: 'Server misconfigured — FITNESS_UID is not set' }); return; }

  const body = req.body || {};
  const items = Array.isArray(body) ? body : (Array.isArray(body.meals) ? body.meals : null);
  if (!items || !items.length) { res.status(400).json({ error: 'Expected a JSON array of meals, or { "meals": [...] }' }); return; }

  let db;
  try {
    db = adminDb();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  const now = Date.now();
  let imported = 0;
  const errors = [];
  for (const item of items) {
    if (!item || !item.date) { errors.push('skipped an item with no date'); continue; }
    const id = item.sourceId
      ? `mfp_${String(item.sourceId).replace(/[^a-zA-Z0-9_-]/g, '')}`
      : newId();
    const meal = {
      id,
      date: item.date,                 // 'YYYY-MM-DD'
      time: item.time || '',
      mealType: item.mealType || inferMealType(item.time),
      status: 'logged',
      name: item.name || 'MyFitnessPal import',
      calories: item.calories ?? null,
      proteinG: item.proteinG ?? null,
      carbsG: item.carbsG ?? null,
      fatG: item.fatG ?? null,
      note: item.note ?? 'Imported from MyFitnessPal via Apple Health',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await db.doc(`users/${uid}/fitness_meals/${id}`).set(meal);
      imported++;
    } catch (e) {
      errors.push(e.message);
    }
  }

  res.status(200).json({ imported, total: items.length, errors });
}
