// Orbit weekly review — pure snapshot builder for ReviewLog (see
// orbitConfig.js's newReviewLog). The context decides when to run this
// (e.g. once per Monday) and persists the result; this module only computes
// what belongs in the snapshot.

import { isoDate } from '../orbitConfig';
import { isOverdue } from './priority';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseISO(iso) {
  return new Date(iso + 'T00:00:00');
}

// Monday-anchored week boundary — a Sunday belongs to the week that started
// the Monday before it, not a week of its own. Also reused by
// calc/trackers.js for weekly tracker resets, so this is the one place that
// defines "what week is this date in".
export function mondayOf(dateISO) {
  const d = parseISO(dateISO);
  const dow = d.getDay(); // 0 Sun .. 6 Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return isoDate(d);
}

export function buildReview(tasks, projects, todayISO, staleDays) {
  const todayStart = parseISO(todayISO).getTime();
  const shippedWindowStart = todayStart - 6 * DAY_MS; // trailing 7 days, inclusive of today
  const shippedWindowEnd = todayStart + DAY_MS; // exclusive upper bound = start of tomorrow
  const staleCutoff = todayStart - staleDays * DAY_MS;

  return {
    weekOf: mondayOf(todayISO),
    shippedTaskIds: tasks
      .filter((t) => t.completedAt != null && t.completedAt >= shippedWindowStart && t.completedAt < shippedWindowEnd)
      .map((t) => t.id),
    staleProjectIds: projects
      .filter((p) => p.status === 'active' && p.lastTouchedAt < staleCutoff)
      .map((p) => p.id),
    overdueTaskIds: tasks.filter((t) => isOverdue(t, todayISO)).map((t) => t.id),
  };
}
