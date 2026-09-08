// The calendar's right-hand rail: coursework To-do, or Goals, behind one toggle.
//
// Defaults to To-do — that's the thing checked daily; goals are checked weekly. The same
// `mode` drives the narrow per-week column beside each week row (CalendarView owns the state),
// so flipping this flips both and the two never disagree about what they're showing.
//
// Goals content is passed in as a node rather than rebuilt here: the goal rows need
// updateGoal/abandonGoal/the editor modal, all of which live in CalendarView. One definition,
// rendered in two places.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  COURSE_TASKS, COURSE_SYNCED_AT, groupByDay, kindAbbr,
} from './courseTasks';

// A capture taken without submission data reports 'unknown' for everything, so a past item is
// only a real alarm when Canvas actually said so. Everything else past gets the muted note —
// the alternative is a wall of false alarms, which is how an alert strip stops being read.
const FLAGGED_LATE = new Set(['missing', 'overdue']);

const HORIZONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: null, label: 'All' },
];

function daysBetween(fromISO, toISO) {
  const a = new Date(`${fromISO}T00:00:00`);
  const b = new Date(`${toISO}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

function relativeDay(dayISO, todayISO) {
  const n = daysBetween(todayISO, dayISO);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n}d ago`;
  const d = new Date(`${dayISO}T00:00:00`);
  if (n < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function shortDate(dayISO) {
  return new Date(`${dayISO}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** One assignment. A link when Canvas gave a URL, a plain div when it didn't. */
function TaskRow({ task, todayISO }) {
  const soon = task.due >= todayISO && daysBetween(todayISO, task.due) <= 1;
  const body = (
    <>
      <div className="ft-crs-row-top">
        <span className="ft-crs-row-code" style={{ color: task.color }}>{task.code}</span>
        <span className="ft-crs-row-kind">{kindAbbr(task.kind)}</span>
        {task.dueTime && <span className="ft-crs-row-time">{task.dueTime}</span>}
      </div>
      <div className="ft-crs-row-name">{task.name}</div>
      <div className="ft-crs-row-meta">
        {task.points != null && <span className="ft-crs-pts">{task.points} pts</span>}
        {task.questions != null && <span>{task.questions} q</span>}
        {task.timeLimit != null && <span>{task.timeLimit} min</span>}
      </div>
    </>
  );
  const cls = `ft-crs-row${soon ? ' ft-crs-row-soon' : ''}`;
  const style = { '--ft-crs-accent': task.color };
  return task.url
    ? <a className={cls} style={style} href={task.url} target="_blank" rel="noreferrer">{body}</a>
    : <div className={cls} style={style}>{body}</div>;
}

function TodoPane({ todayISO, horizon, onHorizon }) {
  const [showUnknown, setShowUnknown] = useState(false);

  const open = COURSE_TASKS.filter((t) => !t.done);
  const pastFlagged = open.filter((t) => t.due < todayISO && FLAGGED_LATE.has(t.status));
  const pastUnknown = open.filter((t) => t.due < todayISO && t.status === 'unknown');
  const ahead = open.filter((t) => (
    t.due >= todayISO && (horizon == null || daysBetween(todayISO, t.due) <= horizon)
  ));
  const byDay = groupByDay(ahead);
  const totalPts = ahead.reduce((n, t) => n + (t.points ?? 0), 0);

  if (!COURSE_TASKS.length) {
    return (
      <div className="ft-crs-empty">
        No Canvas snapshot yet. Run the capture snippet in your Canvas tab, then{' '}
        <code>npm run canvas -- --from-capture canvas-capture.json</code>.
      </div>
    );
  }

  return (
    <>
      <div className="ft-crs-controls">
        <select
          className="ft-crs-select"
          value={horizon == null ? 'all' : horizon}
          onChange={(e) => onHorizon(e.target.value === 'all' ? null : Number(e.target.value))}
        >
          {HORIZONS.map((h) => (
            <option key={h.label} value={h.value == null ? 'all' : h.value}>{h.label}</option>
          ))}
        </select>
        <span className="ft-crs-tally">{ahead.length} due · {totalPts.toFixed(0)} pts</span>
      </div>

      {pastFlagged.length > 0 && (
        <div className="ft-crs-alert">
          <div className="ft-crs-alert-head">{pastFlagged.length} past due</div>
          {pastFlagged.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} />)}
        </div>
      )}

      {pastUnknown.length > 0 && (
        <div className="ft-crs-note">
          <button type="button" className="ft-crs-note-btn" onClick={() => setShowUnknown((v) => !v)}>
            {showUnknown ? '▾' : '▸'} {pastUnknown.length} past item{pastUnknown.length === 1 ? '' : 's'} with no submission status
          </button>
          {showUnknown && (
            <>
              <p className="ft-crs-note-text">
                The snapshot doesn&apos;t say whether these were handed in — re-run the capture to find out.
              </p>
              {pastUnknown.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} />)}
            </>
          )}
        </div>
      )}

      {byDay.length === 0 ? (
        <div className="ft-crs-empty">
          Nothing due{horizon == null ? '' : ` in the next ${horizon} days`}.
        </div>
      ) : byDay.map(([day, tasks]) => (
        <div className="ft-crs-day" key={day}>
          <div className={`ft-crs-day-head${day === todayISO ? ' ft-crs-day-today' : ''}`}>
            <span>{relativeDay(day, todayISO)}</span>
            {daysBetween(todayISO, day) < 7 && <span className="ft-crs-day-date">{shortDate(day)}</span>}
          </div>
          {tasks.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} />)}
        </div>
      ))}
    </>
  );
}

export default function CalendarSideRail({
  mode, onMode, todayISO, horizon, onHorizon, goalCount, goalsNode, onClose,
}) {
  const synced = COURSE_SYNCED_AT ? new Date(COURSE_SYNCED_AT).toLocaleDateString() : null;

  return (
    <aside className="ft-side-rail">
      <div className="ft-side-rail-head">
        <div className="ft-side-rail-switch">
          <button
            type="button"
            className={`ft-side-rail-tab${mode === 'todo' ? ' active' : ''}`}
            onClick={() => onMode('todo')}
          >
            To-do
          </button>
          <button
            type="button"
            className={`ft-side-rail-tab${mode === 'goals' ? ' active' : ''}`}
            onClick={() => onMode('goals')}
          >
            Goals{goalCount > 0 ? ` (${goalCount})` : ''}
          </button>
        </div>
        <button type="button" className="ft-x ft-side-rail-x" onClick={onClose} aria-label="Hide this panel">✕</button>
      </div>

      <div className="ft-side-rail-body">
        {mode === 'todo'
          ? <TodoPane todayISO={todayISO} horizon={horizon} onHorizon={onHorizon} />
          : goalsNode}
      </div>

      {mode === 'todo' && (
        <div className="ft-side-rail-foot">
          <Link to="/TKB/courses/dashboard">Course dashboard</Link>
          {synced && <span>synced {synced}</span>}
        </div>
      )}
    </aside>
  );
}
