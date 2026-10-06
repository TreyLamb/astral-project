// Date words for coursework rows — shared by the calendar rail and the School planner. Kept out of
// the component files so Fast Refresh can still hot-swap those (react-refresh/only-export-components).

export function daysBetween(fromISO, toISO) {
  const a = new Date(`${fromISO}T00:00:00`);
  const b = new Date(`${toISO}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

export function relativeDay(dayISO, todayISO) {
  const n = daysBetween(todayISO, dayISO);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n}d ago`;
  const d = new Date(`${dayISO}T00:00:00`);
  if (n < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function shortDate(dayISO) {
  return new Date(`${dayISO}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function shortDay(dayISO, todayISO) {
  const n = daysBetween(todayISO, dayISO);
  if (n === 0) return 'today';
  if (n === 1) return 'tomorrow';
  if (n > 1 && n < 7) return new Date(`${dayISO}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
  return shortDate(dayISO);
}

/** The one-line "when do I touch this" note under an item. */
export function startHint(task, todayISO) {
  if (task.state === 'missing') return 'Canvas: missing';
  if (task.state === 'past-unverified') return `was due ${shortDate(task.due)} · not confirmed`;
  if (task.state !== 'upcoming') return null;
  if (task.kind === 'exam') {
    if (!task.inWindow) return `study from ${shortDay(task.startBy, todayISO)}`;
    return task.opensLater ? `study now · opens ${shortDay(task.opens, todayISO)}` : 'study now';
  }
  if (task.opensLater) return `opens ${shortDay(task.opens, todayISO)}`;
  if (task.inWindow) return 'start now';
  return `start ${shortDay(task.startBy, todayISO)}`;
}

/** Why an item is in "do next", in words. */
export function nextReason(t) {
  const when = t.daysLeft === 0 ? 'due today' : t.daysLeft === 1 ? 'due tomorrow' : `due in ${t.daysLeft} days`;
  const pts = t.points != null ? `${t.points} pts` : 'points unknown';
  return `${pts} · ${when}`;
}
