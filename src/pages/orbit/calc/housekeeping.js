// Orbit daily housekeeping — pure planning logic run once per calendar day
// (see orbitContext.js's "housekeeping-on-open"). Only computes WHAT should
// change; applying the plan (updateTask/removeInboxItem) is the context's job.

export function shouldUnpin(task, todayStr) {
  return !!task.pinnedToday && task.pinnedOn !== todayStr;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function isPurgeableDiscard(inboxItem, nowMs, retentionDays) {
  if (inboxItem.outcome !== 'discarded' || !inboxItem.discardedAt) return false;
  return inboxItem.discardedAt < nowMs - retentionDays * DAY_MS;
}

export function runHousekeepingPlan(tasks, inbox, todayStr, nowMs, settings) {
  const retentionDays = settings.discardRetentionDays;
  return {
    unpinIds: tasks.filter((t) => shouldUnpin(t, todayStr)).map((t) => t.id),
    purgeInboxIds: inbox.filter((i) => isPurgeableDiscard(i, nowMs, retentionDays)).map((i) => i.id),
  };
}
