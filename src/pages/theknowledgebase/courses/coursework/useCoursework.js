// The one hook every coursework surface uses — MFT's calendar + School planner, TKB's chem pages.
// Merges the static sources (Canvas snapshot, manual patches) with the live store (check-offs,
// his own items, the last school-feed pull) through the pure model. See courses/SCHOOL-OPS.md.

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useAuth } from '../../../../AuthContext';
import SNAPSHOT from '../data/canvasSchedule.json';
import SYLLABI from '../data/syllabi.json';
import { COURSEWORK_PATCHES, COURSEWORK_EXTRA } from '../data/manualCoursework.js';
import { buildCoursework, isoOf } from './courseworkModel.js';
import { courseworkStore } from './courseworkStore.js';

// A syllabus total beats the Canvas point sum when one exists — CHEM's Canvas lists ~1,129
// points against a stated 1,100. Everything else falls back to the sum (model default).
const SYLLABUS_TOTALS = Object.fromEntries(
  Object.entries(SYLLABI)
    .filter(([k, v]) => !k.startsWith('_') && v?.grading?.totalPoints)
    .map(([k, v]) => [k, v.grading.totalPoints]),
);

export const SNAPSHOT_CAPTURED_AT = SNAPSHOT.generatedAt || null;

export function useCoursework() {
  const { user } = useAuth() ?? {};
  const state = useSyncExternalStore(courseworkStore.subscribe, courseworkStore.getState, courseworkStore.getState);

  useEffect(() => {
    if (user === undefined) return;
    courseworkStore.attachUser(user?.uid ?? null);
  }, [user]);

  // The clock is read once into state and refreshed every few minutes, so render stays pure and
  // a tab left open overnight still rolls "today" over.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const todayISO = isoOf(new Date(now));

  const cw = useMemo(() => {
    const built = buildCoursework({
      snapshot: SNAPSHOT,
      canvasFeeds: state.feeds.canvas?.length ? [{ events: state.feeds.canvas }] : [],
      lsFeeds: state.feeds.ls ?? [],
      patches: COURSEWORK_PATCHES,
      extras: COURSEWORK_EXTRA,
      userItems: state.userItems.filter((x) => !x.deleted),
      done: state.done,
      todayISO,
      courseTotals: null,
    });
    // Recompute % of grade where the syllabus states a total.
    for (const it of built.items) {
      const total = SYLLABUS_TOTALS[it.code];
      if (total && it.points != null) it.pctOfGrade = (it.points / total) * 100;
    }
    return built;
  }, [state, todayISO]);

  const snapshotAgeDays = SNAPSHOT_CAPTURED_AT
    ? Math.floor((now - Date.parse(SNAPSHOT_CAPTURED_AT)) / 86400000)
    : null;
  const feedAgeHours = state.feeds.syncedAt
    ? Math.floor((now - state.feeds.syncedAt) / 3600000)
    : null;

  return {
    ...cw,
    meta: {
      snapshotAt: SNAPSHOT_CAPTURED_AT,
      snapshotAgeDays,
      feedsSyncedAt: state.feeds.syncedAt,
      feedAgeHours,
      feedCounts: { canvas: state.feeds.canvas?.length ?? 0, ls: (state.feeds.ls ?? []).reduce((n, f) => n + (f.events?.length ?? 0), 0) },
      // Fresh = a school-feed pull in the last 36 h (Google refreshes subscribed feeds within a
      // day; BYU regenerates its feed once a day). Otherwise everything rests on the snapshot.
      fresh: feedAgeHours != null && feedAgeHours <= 36,
    },
    actions: {
      setDone: (id, v) => courseworkStore.setDone(id, v),
      clearDone: (id) => courseworkStore.clearDone(id),
      upsertItem: (item) => courseworkStore.upsertUserItem(item),
      removeItem: (id) => courseworkStore.removeUserItem(id),
    },
  };
}
