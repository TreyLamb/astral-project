// Orbit carryover — identifies open tasks that slipped past their scheduled
// or due date ("didn't get done" set). Pure selection + suggestion only —
// the context decides whether/how to apply the suggested action (e.g. bump
// scheduledDate to today, or bump urgency) when the user confirms it.

export function carryoverCandidates(tasks, todayISO) {
  return tasks
    .filter((t) => t.status === 'todo' || t.status === 'doing')
    .filter((t) => (t.scheduledDate && t.scheduledDate < todayISO) || (t.dueDate && t.dueDate < todayISO))
    .map((t) => ({
      taskId: t.id,
      task: t,
      // an overdue scheduledDate is a slipped plan (reschedule it); an
      // overdue dueDate with no overdue scheduledDate is a real deadline miss
      // (surface it via urgency instead of silently moving the date)
      suggestedAction: t.scheduledDate && t.scheduledDate < todayISO ? 'reschedule' : 'raiseUrgency',
    }));
}
