// /MFT/school — every course, every item, with WHEN it can be started and WHEN it is due.
//
// Trey, 2026-10-06: "I NEED a good dashboard to see what's coming up. WHEN i can start working on
// it and WHEN it is due. I NEED to get a head of my homework instead of only doing things last
// minute." The calendar's rail is the glanceable version; this is the planning version. Both
// read the same live model (courses/coursework/, owner doc courses/SCHOOL-OPS.md), so a check-off
// in one is a check-off in the other — and on TKB's chem pages.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourseTasks, kindAbbr } from './courseTasks';
import { TaskRow, FreshnessNote } from './CalendarSideRail';
import { startHint, shortDate } from './courseworkFormat';
import { SEED_COURSES } from '../theknowledgebase/courses/coursesSeed';
import { sectionsFromQuizTitle } from '../theknowledgebase/courses/chem/syllabusMap';
import { addDaysISO, daysBetween } from '../theknowledgebase/courses/coursework/courseworkModel';

const SPANS = [
  { value: 14, label: 'Next 2 weeks' },
  { value: 28, label: 'Next 4 weeks' },
  { value: null, label: 'Rest of term' },
];

const KINDS = ['assignment', 'quiz', 'exam', 'discussion'];

const sundayOf = (iso) => addDaysISO(iso, -new Date(`${iso}T00:00:00`).getDay());

function weekLabel(sunISO, todayISO) {
  const thisSun = sundayOf(todayISO);
  if (sunISO === thisSun) return 'This week';
  if (sunISO === addDaysISO(thisSun, 7)) return 'Next week';
  return `Week of ${shortDate(sunISO)}`;
}

function dueLabel(t, todayISO) {
  const d = new Date(`${t.due}T00:00:00`);
  const day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const n = daysBetween(todayISO, t.due);
  const rel = n === 0 ? 'today' : n === 1 ? 'tomorrow' : `${n}d`;
  return { day, time: t.dueTime, rel };
}

/** A CHEM quiz or exam links straight into practice scoped to exactly what it covers. */
function practiceLink(t) {
  if (t.code !== 'CHEM 1210') return null;
  if (t.kind === 'exam') return { to: '/TKB/courses/chem/exam', label: 'Exam prep' };
  if (t.kind !== 'quiz') return null;
  const secs = sectionsFromQuizTitle(t.name);
  if (!secs.length) return null;
  const qs = new URLSearchParams({ count: '10', sections: secs.join(','), label: t.name.split(',')[0] });
  return { to: `/TKB/courses/chem/drill/run?${qs}`, label: 'Practice' };
}

function PlannerRow({ t, todayISO, onToggle }) {
  const due = dueLabel(t, todayISO);
  const hint = startHint(t, todayISO);
  const practice = practiceLink(t);
  return (
    <tr className={`ft-school-row${t.done ? ' done' : ''}${t.kind === 'exam' ? ' exam' : ''}`} style={{ '--ft-crs-accent': t.color }}>
      <td className="ft-school-check-cell">
        <button
          type="button"
          className={`ft-crs-check${t.done ? ' on' : ''}`}
          onClick={() => onToggle(t)}
          aria-pressed={t.done}
          aria-label={t.done ? `Mark "${t.name}" not done` : `Mark "${t.name}" done`}
          title={t.done ? 'Done — click to undo' : 'Mark done (only here — the LMS is not changed)'}
        >
          {t.done ? '✓' : ''}
        </button>
      </td>
      <td className="ft-school-due">
        <span className="ft-school-due-day">{due.day}</span>
        <span className="ft-school-due-time">{due.time ?? 'all day'} · {due.rel}</span>
      </td>
      <td className="ft-school-course"><span style={{ color: t.color }}>{t.code}</span></td>
      <td className="ft-school-item">
        {t.url
          ? <a href={t.url} target="_blank" rel="noreferrer">{t.name}</a>
          : <span>{t.name}</span>}
        <span className="ft-school-kind">{kindAbbr(t.kind)}</span>
        {t.note && <div className="ft-school-note">{t.note}</div>}
      </td>
      <td className="ft-school-pts">
        {t.points != null ? <strong>{t.points}</strong> : '—'}
        {t.pctOfGrade != null && t.pctOfGrade >= 0.5 && <span>≈{t.pctOfGrade.toFixed(t.pctOfGrade >= 10 ? 0 : 1)}%</span>}
      </td>
      <td className="ft-school-opens">{t.opens ? shortDate(t.opens) : <span className="ft-school-dim">open</span>}</td>
      <td className={`ft-school-start${t.inWindow ? ' now' : ''}`}>{hint ?? '—'}</td>
      <td className="ft-school-act">
        {practice && <Link className="ft-school-practice" to={practice.to}>{practice.label} →</Link>}
      </td>
    </tr>
  );
}

/** Points due per day, next 14 days. One series, one hue, no legend — the title names it. */
function LoadChart({ tasks, todayISO }) {
  const [focus, setFocus] = useState(null);
  const days = Array.from({ length: 14 }, (_, i) => addDaysISO(todayISO, i));
  const rows = days.map((d) => {
    const items = tasks.filter((t) => t.due === d && !t.done);
    return { d, items, pts: items.reduce((n, t) => n + (t.points ?? 0), 0) };
  });
  const max = Math.max(10, ...rows.map((r) => r.pts));
  const shown = focus ? rows.find((r) => r.d === focus) : null;
  return (
    <section className="ft-school-card">
      <h3>Points due per day — next 14 days</h3>
      <div className="ft-school-load" role="list">
        {rows.map((r) => (
          <button
            key={r.d}
            type="button"
            role="listitem"
            className={`ft-school-load-col${r.d === todayISO ? ' today' : ''}${focus === r.d ? ' focus' : ''}`}
            onMouseEnter={() => setFocus(r.d)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(r.d)}
            onBlur={() => setFocus(null)}
            aria-label={`${shortDate(r.d)}: ${r.pts} points, ${r.items.length} items`}
          >
            <span className="ft-school-load-track">
              {r.pts > 0 && <span className="ft-school-load-bar" style={{ height: `${Math.max(4, (r.pts / max) * 100)}%` }} />}
            </span>
            <span className="ft-school-load-day">{new Date(`${r.d}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
            <span className="ft-school-load-date">{new Date(`${r.d}T00:00:00`).getDate()}</span>
          </button>
        ))}
      </div>
      <div className="ft-school-load-readout" aria-live="polite">
        {shown
          ? (shown.items.length
            ? <>{shortDate(shown.d)}: <strong>{shown.pts} pts</strong> — {shown.items.map((t) => `${t.code.split(' ')[0]} ${t.name}`).join(' · ')}</>
            : <>{shortDate(shown.d)}: nothing due.</>)
          : 'Hover or tab to a day to see what lands on it. Tall bars are the days to get ahead of.'}
      </div>
    </section>
  );
}

function AddItemForm({ onAdd, roster }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: roster[0] ?? '', name: '', kind: 'assignment', due: '', dueTime: '', opens: '', points: '', url: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.due) return;
    onAdd({
      code: f.code, name: f.name.trim(), kind: f.kind, due: f.due,
      dueTime: f.dueTime ? new Date(`2000-01-01T${f.dueTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null,
      opens: f.opens || null, points: f.points === '' ? null : Number(f.points), url: f.url.trim() || null,
    });
    setF((x) => ({ ...x, name: '', due: '', dueTime: '', opens: '', points: '', url: '' }));
  };
  if (!open) {
    return <button type="button" className="ft-btn-ghost" onClick={() => setOpen(true)}>+ Add an item by hand</button>;
  }
  return (
    <form className="ft-school-add" onSubmit={submit}>
      <label>Course
        <select className="ft-input" value={f.code} onChange={set('code')}>
          {roster.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="wide">What
        <input className="ft-input" value={f.name} onChange={set('name')} placeholder="e.g. AS 200 reading quiz 4" required />
      </label>
      <label>Kind
        <select className="ft-input" value={f.kind} onChange={set('kind')}>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </label>
      <label>Due
        <input className="ft-input" type="date" value={f.due} onChange={set('due')} required />
      </label>
      <label>Time
        <input className="ft-input" type="time" value={f.dueTime} onChange={set('dueTime')} />
      </label>
      <label>Opens
        <input className="ft-input" type="date" value={f.opens} onChange={set('opens')} />
      </label>
      <label>Points
        <input className="ft-input" type="number" step="any" min="0" value={f.points} onChange={set('points')} />
      </label>
      <label className="wide">Link
        <input className="ft-input" value={f.url} onChange={set('url')} placeholder="optional" />
      </label>
      <div className="ft-school-add-actions">
        <button type="submit" className="ft-btn-primary">Add</button>
        <button type="button" className="ft-btn-ghost" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  );
}

export default function SchoolPlanner() {
  const cw = useCourseTasks();
  const today = cw.todayISO;
  const [span, setSpan] = useState(28);
  const [only, setOnly] = useState(null); // null = every course
  const [showDone, setShowDone] = useState(false);
  const toggle = (t) => cw.actions.setDone(t.id, !t.done);

  const roster = useMemo(() => SEED_COURSES.map((c) => c.code), []);
  const untracked = roster.filter((c) => !cw.courses.includes(c));

  const rows = cw.tasks.filter((t) => (
    t.due && t.due >= today
    && (span == null || daysBetween(today, t.due) <= span)
    && (only == null || t.code === only)
    && (showDone || !t.done)
  ));
  const weeks = [];
  for (const t of rows) {
    const sun = sundayOf(t.due);
    if (!weeks.length || weeks[weeks.length - 1].sun !== sun) weeks.push({ sun, items: [] });
    weeks[weeks.length - 1].items.push(t);
  }
  const openNow = cw.inWindow.filter((t) => only == null || t.code === only);
  const next = cw.doNext(5);

  return (
    <div className="ft-school">
      <header className="ft-school-head">
        <div>
          <h1>School</h1>
          <p className="ft-school-sub">
            Every course in one list: when each thing <strong>opens</strong>, when to <strong>start</strong> it, when it is <strong>due</strong>.
            Tick things off here; Canvas is never changed.
          </p>
        </div>
        <div className="ft-school-stats">
          <div><strong>{openNow.length}</strong><span>to start now</span></div>
          <div><strong>{cw.upcoming.filter((t) => daysBetween(today, t.due) <= 6).length}</strong><span>due in 7 days</span></div>
          <div className={cw.missing.length ? 'bad' : ''}><strong>{cw.missing.length}</strong><span>missing</span></div>
          <div className={cw.pastUnverified.length ? 'warn' : ''}><strong>{cw.pastUnverified.length}</strong><span>past due, unconfirmed</span></div>
        </div>
      </header>

      <FreshnessNote meta={cw.meta} />

      <div className="ft-school-grid">
        <main className="ft-school-main">
          <div className="ft-school-filters">
            <div className="ft-school-chips" role="group" aria-label="Course">
              <button type="button" className={`ft-school-chip${only == null ? ' on' : ''}`} onClick={() => setOnly(null)}>All courses</button>
              {cw.courses.map((c) => (
                <button key={c} type="button" className={`ft-school-chip${only === c ? ' on' : ''}`} onClick={() => setOnly(only === c ? null : c)}>{c}</button>
              ))}
            </div>
            <select className="ft-crs-select" value={span == null ? 'all' : span} onChange={(e) => setSpan(e.target.value === 'all' ? null : Number(e.target.value))}>
              {SPANS.map((s) => <option key={s.label} value={s.value == null ? 'all' : s.value}>{s.label}</option>)}
            </select>
            <label className="ft-school-toggle"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> show done</label>
          </div>

          {weeks.length === 0 && <p className="ft-school-empty">Nothing due in this window.</p>}
          {weeks.map((w) => (
            <section key={w.sun} className="ft-school-week">
              <h2>
                {weekLabel(w.sun, today)}
                <span>{w.items.length} items · {w.items.reduce((n, t) => n + (t.points ?? 0), 0).toFixed(0)} pts</span>
              </h2>
              <table className="ft-school-table">
                <thead>
                  <tr>
                    <th aria-label="Done" />
                    <th>Due</th>
                    <th>Course</th>
                    <th>Item</th>
                    <th>Pts</th>
                    <th>Opens</th>
                    <th>Start</th>
                    <th aria-label="Practice" />
                  </tr>
                </thead>
                <tbody>
                  {w.items.map((t) => <PlannerRow key={t.id} t={t} todayISO={today} onToggle={toggle} />)}
                </tbody>
              </table>
            </section>
          ))}

          <section className="ft-school-week">
            <h2>Add something no feed carries</h2>
            <AddItemForm roster={roster} onAdd={(it) => cw.actions.upsertItem(it)} />
          </section>
        </main>

        <aside className="ft-school-side">
          {next.length > 0 && (
            <section className="ft-school-card ft-school-next">
              <h3>Do next</h3>
              <p className="ft-school-card-sub">Ranked by points per day of runway left. Exams count 1.5×.</p>
              {next.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  todayISO={today}
                  onToggle={toggle}
                  reason={`${t.points ?? '?'} pts · ${t.daysLeft === 0 ? 'due today' : t.daysLeft === 1 ? 'due tomorrow' : `due in ${t.daysLeft} days`}`}
                />
              ))}
            </section>
          )}

          <LoadChart tasks={cw.tasks} todayISO={today} />

          {cw.missing.length > 0 && (
            <section className="ft-school-card ft-school-bad">
              <h3>Missing — Canvas said so</h3>
              <p className="ft-school-card-sub">Zeros right now. Worth asking each instructor whether late work is accepted.</p>
              {cw.missing.map((t) => <TaskRow key={t.id} task={t} todayISO={today} onToggle={toggle} />)}
            </section>
          )}

          {cw.pastUnverified.length > 0 && (
            <section className="ft-school-card ft-school-warn">
              <h3>Past due — not confirmed done</h3>
              <p className="ft-school-card-sub">Still open at the last Canvas capture. Tick off what you finished; what is left needs a look.</p>
              {cw.pastUnverified.map((t) => <TaskRow key={t.id} task={t} todayISO={today} onToggle={toggle} />)}
            </section>
          )}

          {cw.undated.length > 0 && (
            <section className="ft-school-card">
              <h3>No date yet</h3>
              {cw.undated.map((t) => <TaskRow key={t.id} task={t} todayISO={today} onToggle={toggle} reason="no due date in Canvas or the syllabus" />)}
            </section>
          )}

          <section className="ft-school-card" id="freshen">
            <h3>Keep this updating by itself</h3>
            {untracked.length > 0 && (
              <p className="ft-school-card-sub">
                <strong>Nothing is tracked yet for {untracked.join(', ')}.</strong> They aren&apos;t in the Canvas capture
                (ESFF/ESMG were unpublished on Sep 18; AERO lives in BYU Learning Suite).
              </p>
            )}
            <ol className="ft-school-steps">
              <li>
                <strong>Canvas feed</strong> — Canvas → Calendar → right sidebar → <em>Calendar Feed</em> → copy the link.
              </li>
              <li>
                <strong>Learning Suite feeds</strong> — each AERO course → <em>Schedule</em> tab → <em>Get iCalendar Feed</em> → copy.
              </li>
              <li>
                <strong>Google Calendar</strong> (web) → Other calendars <em>+</em> → <em>From URL</em> → paste each link. They now show on your iPhone too.
              </li>
              <li>
                <Link to="/MFT/settings#calendars">MFT → Settings → Calendars</Link> → Connect → <em>Sync now</em>. This page then refreshes
                from those feeds — every course, including ones the capture never saw.
              </li>
            </ol>
            <p className="ft-school-card-sub">
              {cw.meta.feedsSyncedAt
                ? <>Last school-feed sync: {new Date(cw.meta.feedsSyncedAt).toLocaleString()} ({cw.meta.feedCounts.canvas} Canvas, {cw.meta.feedCounts.ls} Learning Suite items).</>
                : <>No school-feed sync yet — everything above comes from the Canvas capture of {shortDate(String(cw.meta.snapshotAt).slice(0, 10))}.</>}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
