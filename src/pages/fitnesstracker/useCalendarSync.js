// React glue for the calendar hub: the "Sync now" action (connects first when the ~1 h Google
// token has lapsed) and the quiet auto-sync. Owner doc: theknowledgebase/courses/SCHOOL-OPS.md §6.

import { useEffect, useMemo, useRef, useState } from 'react';
import * as gcal from './calc/googleCalendar';
import { runSync } from './calendarHubSync';

/**
 * One button's worth of behaviour. `sync` must be called straight from a click: when the token
 * has lapsed it opens Google's sign-in popup, and browsers only allow popups from a user gesture.
 */
export function useCalendarSyncAction(fitness) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [last, setLast] = useState(null);
  const sync = async () => {
    setErr(null);
    setBusy(true);
    try {
      if (!gcal.isConnected()) await gcal.connect();
      setLast(await runSync(fitness));
    } catch (e) {
      setErr(gcal.explainError(e));
    } finally {
      setBusy(false);
    }
  };
  return { sync, busy, err, last };
}

/**
 * Quiet background sync while MFT is open and a Google token is still valid: shortly after
 * opening if the last sync is over 10 minutes old, and a few seconds after any MFT edit.
 * Without a valid token it does nothing — reconnecting needs a click (see useCalendarSyncAction).
 */
export function useCalendarAutoSync(fitness) {
  const latest = useRef(fitness);
  useEffect(() => { latest.current = fitness; });

  const hub = fitness.settings.calendarHub;
  const latestEdit = useMemo(
    () => fitness.workouts.reduce((m, w) => Math.max(m, w.updatedAt || 0), 0),
    [fitness.workouts],
  );

  useEffect(() => {
    if (!hub?.connected || !gcal.isConnected()) return undefined;
    const lastSync = hub.lastSync || 0;
    const stale = Date.now() - lastSync > 10 * 60 * 1000;
    const dirty = latestEdit > lastSync;
    if (!stale && !dirty) return undefined;
    const t = setTimeout(() => {
      runSync(latest.current).catch((e) => console.warn('calendar auto-sync:', gcal.explainError(e)));
    }, stale ? 1500 : 6000);
    return () => clearTimeout(t);
  }, [hub?.connected, hub?.lastSync, latestEdit]);
}
