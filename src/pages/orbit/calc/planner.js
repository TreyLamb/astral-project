// Orbit day planner — greedy capacity-aware placement across a horizon.
// Assumes orderedTasks is already priority-sorted by the caller (see
// calc/priority.js's compareForToday); this module only decides which day
// each task lands on, never re-ranks them.

import { isoDate } from '../orbitConfig';

// An unestimated task (timeMin null) still costs *something* against a day's
// time budget — treating it as 0 would let an unbounded pile of unestimated
// tasks stack onto one day past what's realistic. 30min approximates a small
// undefined task without needing the user to have estimated it first.
const DEFAULT_UNESTIMATED_TIME_MIN = 30;

function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function taskCost(task) {
  return {
    time: task.timeMin ?? DEFAULT_UNESTIMATED_TIME_MIN,
    energy: task.energy ?? 0,
  };
}

// Single-task "next open day": the first day from startISO (inclusive) where
// this one task still fits under that day's time AND energy budget, given
// whatever is already scheduled there. Powers the quick-add "Add to calendar"
// checkbox, so a task lands on the next day that actually has room rather than
// blindly today. Falls back to startISO if nothing fits inside the horizon —
// better to overfill today than to silently refuse to schedule it at all.
export function firstOpenDayFor(taskLike, scheduledTasks, startISO, horizonDays, capacityFor) {
  const cost = taskCost(taskLike);
  const usedByDay = {};
  for (const t of scheduledTasks) {
    if (!t.scheduledDate) continue;
    const c = taskCost(t);
    const u = usedByDay[t.scheduledDate] || { time: 0, energy: 0 };
    u.time += c.time;
    u.energy += c.energy;
    usedByDay[t.scheduledDate] = u;
  }
  for (let i = 0; i < horizonDays; i += 1) {
    const date = addDaysISO(startISO, i);
    const cap = capacityFor(date);
    const used = usedByDay[date] || { time: 0, energy: 0 };
    if (used.time + cost.time <= cap.timeMin && used.energy + cost.energy <= cap.energy) return date;
  }
  return startISO;
}

export function planTasksAcrossDays(orderedTasks, startISO, horizonDays, capacityFor) {
  const placements = [];
  const unplaced = [];

  let dayIndex = 0;
  let date = addDaysISO(startISO, dayIndex);
  let cap = capacityFor(date);
  let usedTime = 0;
  let usedEnergy = 0;

  for (const task of orderedTasks) {
    const { time, energy } = taskCost(task);
    const fitsCurrentDay = usedTime + time <= cap.timeMin && usedEnergy + energy <= cap.energy;

    // current day already has something on it and this task doesn't fit
    // alongside it -> close the day out and try the next one
    if (!fitsCurrentDay && (usedTime > 0 || usedEnergy > 0)) {
      dayIndex += 1;
      if (dayIndex >= horizonDays) {
        unplaced.push(task.id);
        continue;
      }
      date = addDaysISO(startISO, dayIndex);
      cap = capacityFor(date);
      usedTime = 0;
      usedEnergy = 0;
    }

    if (dayIndex >= horizonDays) {
      unplaced.push(task.id);
      continue;
    }

    // still doesn't fit even alone on a fresh day -> oversized task gets
    // placed on its own day anyway, over budget (never split a task)
    placements.push({ taskId: task.id, date });
    usedTime += time;
    usedEnergy += energy;
  }

  return { placements, unplaced };
}
