// Receives workouts relayed from an iOS Shortcut (Apple Watch -> Apple Fitness
// -> Health -> a Shortcuts automation -> here) and writes them into the SAME
// Firestore path FitnessTracker's client code reads
// (users/{uid}/fitness_workouts/{workoutId} — see src/pages/fitnesstracker/
// fitnessFirestore.js), matching newWorkout()'s shape from fitnessConfig.js
// field-for-field. That parity is why imported records just appear in the
// calendar with no app-side changes, exactly as import-meals.js does for meals.
//
// WHAT THIS CAN AND CANNOT CARRY (verified 2026-08-19, see
// src/pages/fitnesstracker/IMPORT.md): Shortcuts' `Find Health Samples` exposes
// workout TOTALS only — start, end, duration, distance, calories. Laps and
// splits exist in HealthKit as HKWorkoutEvent but Shortcuts cannot read them,
// so a rep session arrives here as one undifferentiated blob. Per-rep splits
// need the file route (HealthFit/RunGap -> TCX -> /MFT/import), which parses
// them into metrics.splits. This endpoint still ACCEPTS a splits array if a
// caller can supply one — it just won't come from a plain Shortcut.
//
// Idempotent when possible: pass the HealthKit sample uuid as sourceId and
// re-running the same sync overwrites the same doc instead of duplicating it.
import { requireSecret } from './_lib/auth.js';
import { adminDb } from './_lib/firebaseAdmin.js';

function newId() {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

// Firestore doc ids can't contain "/" and shouldn't carry arbitrary input.
function safeId(sourceId) {
  return `hk_${String(sourceId).replace(/[^A-Za-z0-9_-]/g, '')}`.slice(0, 120);
}

// Apple's workout type names -> this app's activityType ids
// (DEFAULT_ACTIVITY_TYPES in fitnessConfig.js). Anything unmapped becomes
// 'other' rather than being dropped — an unknown workout still counts as
// training load, and silently discarding it would understate ACWR.
const TYPE_MAP = {
  running: 'run', run: 'run', outdoorrun: 'run', indoorrun: 'run', treadmill: 'run',
  swimming: 'swim', swim: 'swim', poolswim: 'swim', openwaterswim: 'swim',
  traditionalstrengthtraining: 'lift', functionalstrengthtraining: 'lift', lift: 'lift',
  cycling: 'bike', bike: 'bike', outdoorcycle: 'bike', indoorcycle: 'bike',
  walking: 'walk', walk: 'walk', hiking: 'walk', hike: 'walk',
  yoga: 'yoga',
};
function mapActivityType(raw) {
  if (!raw) return 'run';
  const key = String(raw).toLowerCase().replace(/[^a-z]/g, '');
  return TYPE_MAP[key] || 'other';
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  if (!requireSecret(req, res, 'WORKOUT_IMPORT_SECRET')) return;

  const uid = process.env.FITNESS_UID;
  if (!uid) { res.status(500).json({ error: 'Server misconfigured — FITNESS_UID is not set' }); return; }

  const body = req.body || {};
  const items = Array.isArray(body) ? body : (Array.isArray(body.workouts) ? body.workouts : null);
  if (!items || !items.length) {
    res.status(400).json({ error: 'Expected a JSON array of workouts, or { "workouts": [...] }' });
    return;
  }

  let db;
  try {
    db = adminDb();
  } catch (e) {
    res.status(500).json({ error: e.message });
    return;
  }

  const now = Date.now();
  const errors = [];
  let imported = 0;

  for (const item of items) {
    if (!item || !item.date) { errors.push('skipped an item with no date'); continue; }

    const id = item.sourceId ? safeId(item.sourceId) : newId();
    // Mirrors newWorkout() in fitnessConfig.js. metrics is the documented
    // extension slot and is passed through verbatim, same as the client does.
    const workout = {
      id,
      date: String(item.date),
      time: item.time ?? '',
      activityType: mapActivityType(item.activityType),
      title: item.title ?? '',
      status: 'completed',
      durationSec: num(item.durationSec),
      distanceM: num(item.distanceM),
      note: item.note ?? '',
      rpe: num(item.rpe),
      groupId: null,
      goalId: null,
      metrics: {
        ...(item.metrics && typeof item.metrics === 'object' ? item.metrics : {}),
        ...(num(item.avgHr) != null ? { avgHr: num(item.avgHr) } : {}),
        ...(num(item.elevationGainM) != null ? { elevationGainM: num(item.elevationGainM) } : {}),
        ...(num(item.calories) != null ? { calories: num(item.calories) } : {}),
        ...(Array.isArray(item.splits) ? { splits: item.splits } : {}),
        source: item.source ?? 'shortcut',
      },
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.doc(`users/${uid}/fitness_workouts/${id}`).set(workout);
      imported += 1;
    } catch (e) {
      errors.push(`${item.date}: ${e.message}`);
    }
  }

  res.status(200).json({ imported, total: items.length, errors });
}
