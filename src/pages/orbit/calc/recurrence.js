// Orbit recurrence — pure occurrence math for RecurrenceRule (see
// orbitConfig.js's newRecurrenceRule). The context's generator calls
// datesToGenerate once per day-open, creates a Task per date (recurrenceId =
// rule.id), then bumps the rule's lastGeneratedDate — this module never
// creates tasks itself.

import { isoDate } from '../orbitConfig';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseISO(iso) {
  return new Date(iso + 'T00:00:00');
}

function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function daysBetween(fromISO, toISO) {
  return Math.round((parseISO(toISO).getTime() - parseISO(fromISO).getTime()) / DAY_MS);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function occursOn(rule, dateISO) {
  const d = parseISO(dateISO);
  switch (rule.freq) {
    case 'daily':
      return true;
    case 'interval':
      return daysBetween(rule.anchorDate, dateISO) % Math.max(1, rule.interval) === 0;
    case 'weekly':
      return (rule.weekdays || []).includes(d.getDay());
    case 'monthly': {
      // clamp so a dayOfMonth of e.g. 31 still fires on the last day of a
      // shorter month instead of silently never firing that month
      const fireDay = Math.min(rule.dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth()));
      return d.getDate() === fireDay;
    }
    default:
      return false;
  }
}

export function occurrencesBetween(rule, fromISO, toISO) {
  if (!rule.active) return [];
  const start = fromISO < rule.anchorDate ? rule.anchorDate : fromISO;
  if (start > toISO) return [];
  const out = [];
  const cur = parseISO(start);
  const endMs = parseISO(toISO).getTime();
  while (cur.getTime() <= endMs) {
    const iso = isoDate(cur);
    if (occursOn(rule, iso)) out.push(iso);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function datesToGenerate(rule, todayISO, existingInstanceDates) {
  if (!rule.active) return [];
  const from = rule.lastGeneratedDate ? addDays(rule.lastGeneratedDate, 1) : rule.anchorDate;
  return occurrencesBetween(rule, from, todayISO).filter((d) => !existingInstanceDates.has(d));
}
