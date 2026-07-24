// Orbit trackers — pure counter/streak math for Tracker (see orbitConfig.js's
// newTracker). The context calls needsReset/applyReset once per day-open
// (mirrors calc/housekeeping.js's pattern) before any qualify/increment call.

import { isoDate } from '../orbitConfig';
import { mondayOf } from './review';

function parseISO(iso) {
  return new Date(iso + 'T00:00:00');
}

function addDaysISO(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

// A streak breaks the moment a full day goes by with no qualifying action —
// i.e. the last qualified date is older than yesterday. A never-qualified
// tracker (lastQualifiedDate null) hasn't missed anything yet.
function missedStreakDay(tracker, todayISO) {
  if (tracker.type !== 'streak' || !tracker.lastQualifiedDate) return false;
  return tracker.lastQualifiedDate < addDaysISO(todayISO, -1);
}

export function needsReset(tracker, todayISO) {
  if (missedStreakDay(tracker, todayISO)) return true;
  if (tracker.resetInterval === 'daily') return isoDate(new Date(tracker.lastResetAt)) < todayISO;
  if (tracker.resetInterval === 'weekly') return mondayOf(isoDate(new Date(tracker.lastResetAt))) < mondayOf(todayISO);
  return false; // 'none' never resets
}

export function applyReset(tracker, todayISO) {
  if (!needsReset(tracker, todayISO)) return tracker;
  return { ...tracker, currentValue: 0, lastResetAt: Date.now() };
}

// No-op if already qualified today — a tracker can only count once per day.
export function qualifyToday(tracker, todayISO) {
  if (tracker.lastQualifiedDate === todayISO) return tracker;
  return { ...tracker, currentValue: tracker.currentValue + 1, lastQualifiedDate: todayISO };
}

export function increment(tracker, delta) {
  return { ...tracker, currentValue: tracker.currentValue + delta };
}
