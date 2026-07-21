// Smart-calendar planning: dependency-aware rescheduling + conflict detection.
//
// The model is deliberately simple and predictable: planned sessions form an
// ordered chain by date, so moving or skipping one "cascades" the later planned
// sessions by the same shift (arm day slips a day -> everything after slips too),
// rather than prompting on every single drag. Conflicts (two planned sessions on
// one day — e.g. pickleball landing on leg day) are surfaced for a decision.

const pad = (n) => String(n).padStart(2, '0');

export function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Every planned workout on/after fromISO shifted by `days`. NOT applied blindly
// any more (that used to auto-cascade the whole chain) — callers now use this as
// the *candidate list* for an opt-in "what else should move?" checklist, or as
// input to shiftGroup below for the deliberate, tag-based bulk move.
// Returns [{ id, from, date }] so the caller can apply + show what would move.
export function shiftPlanFrom(workouts, fromISO, days) {
  return workouts
    .filter((w) => w.status === 'planned' && w.date >= fromISO)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({ id: w.id, from: w.date, date: addDaysISO(w.date, days) }));
}

// Every workout sharing groupId, shifted by `days` — the deliberate counterpart
// to shiftPlanFrom's date-order guess: only moves workouts you explicitly tagged
// into the same group, regardless of what else is scheduled in between.
export function shiftGroup(workouts, groupId, days) {
  if (!groupId) return [];
  return workouts
    .filter((w) => w.groupId === groupId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((w) => ({ id: w.id, from: w.date, date: addDaysISO(w.date, days) }));
}

// Days carrying more than one planned session — the "pickleball on leg day" case.
export function detectConflicts(workouts) {
  const byDate = {};
  for (const w of workouts) if (w.status === 'planned') (byDate[w.date] ||= []).push(w);
  const out = [];
  for (const [date, items] of Object.entries(byDate)) {
    if (items.length > 1) out.push({ date, kind: 'multiple', items });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function upcomingPlanned(workouts, fromISO, days = 7) {
  const to = addDaysISO(fromISO, days);
  return workouts
    .filter((w) => w.status === 'planned' && w.date >= fromISO && w.date <= to)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
}
