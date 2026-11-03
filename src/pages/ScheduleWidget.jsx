import { useEffect, useState } from 'react';
import { PLAN, KIND_COLORS, clock } from './fitnesstracker/studyPlan';
import './ScheduleWidget.css';

// Trey's schedule as a phone home-screen widget (2026-11-03): point a web-widget app at
// /schedule-widget. It reads the same plan file the MFT calendar does (fitnesstracker/studyPlan.js),
// so every pushed schedule change reaches the widget on the next refresh. Nothing to sync by hand.
//
// Shows: what is happening NOW (with progress), what is NEXT, and what is DUE in the next two days.
// It fills the widget and never scrolls; items that do not fit are cut, not scrolled to.

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const minsOf = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const DAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const shortDay = (key) => new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(`${key}T12:00`));
const nowClock = (d) => clock(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
const LAST_DAY = PLAN.reduce((m, e) => (e.date > m ? e.date : m), '');

export default function ScheduleWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000);
    // Reload now and then so a newly pushed plan shows up even if the widget app never reloads us.
    const reload = setTimeout(() => window.location.reload(), 20 * 60_000);
    return () => { clearInterval(tick); clearTimeout(reload); };
  }, []);

  const today = dayKey(now);
  const tomorrow = dayKey(new Date(now.getTime() + 864e5));
  const dayAfter = dayKey(new Date(now.getTime() + 2 * 864e5));
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const timed = (key) => PLAN.filter((e) => e.date === key && e.start && e.end && e.kind !== 'due')
    .sort((a, b) => a.start.localeCompare(b.start));
  const todays = timed(today);
  const current = todays.find((e) => minsOf(e.start) <= nowMin && nowMin < minsOf(e.end));
  const upcoming = [
    ...todays.filter((e) => minsOf(e.start) > nowMin).map((e) => ({ ...e, when: clock(e.start) })),
    ...timed(tomorrow).map((e) => ({ ...e, when: `${shortDay(tomorrow)} ${clock(e.start)}` })),
  ].slice(0, 6);
  const due = PLAN.filter((e) => e.kind === 'due' && [today, tomorrow, dayAfter].includes(e.date))
    .filter((e) => !(e.date === today && e.start && minsOf(e.start) < nowMin))
    .map((e) => ({ ...e, label: e.title.replace(/^DUE[^:]*:\s*/, ''), when: e.date === today ? 'Today' : shortDay(e.date) }));

  const progress = current ? (nowMin - minsOf(current.start)) / (minsOf(current.end) - minsOf(current.start)) : 0;
  const stale = LAST_DAY && LAST_DAY < today;

  return (
    <div className="sw-page">
      <header className="sw-head">
        <span className="sw-date">{DAY.format(now)}</span>
        <span className="sw-time">{nowClock(now)}</span>
      </header>

      <section className="sw-now" style={{ '--sw-kind': KIND_COLORS[current?.kind] ?? '#64748b' }}>
        <span className="sw-label">Now</span>
        {current ? (
          <>
            <span className="sw-now-title">{current.title}</span>
            <span className="sw-now-sub">until {clock(current.end)}</span>
            <span className="sw-bar"><i style={{ width: `${Math.round(progress * 100)}%` }} /></span>
          </>
        ) : (
          <span className="sw-now-title sw-free">{stale ? 'Plan needs updating' : 'Free time'}</span>
        )}
      </section>

      <section className="sw-list">
        <span className="sw-label">Next</span>
        {upcoming.length ? upcoming.map((e) => (
          <div key={e.id} className="sw-item" style={{ '--sw-kind': KIND_COLORS[e.kind] ?? '#64748b' }}>
            <span className="sw-when">{e.when}</span>
            <span className="sw-what">{e.title}</span>
          </div>
        )) : <div className="sw-item sw-muted">Nothing else planned</div>}
      </section>

      {due.length > 0 && (
        <section className="sw-due">
          <span className="sw-label">Due</span>
          {due.map((e) => (
            <div key={e.id} className="sw-due-item"><b>{e.when}</b> {e.label}</div>
          ))}
        </section>
      )}

      {stale && <footer className="sw-stale">Plan ends {LAST_DAY}: ask Claude to update it</footer>}
    </div>
  );
}
