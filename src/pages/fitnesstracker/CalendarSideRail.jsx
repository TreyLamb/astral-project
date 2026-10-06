// The calendar's right-hand rail: coursework To-do, or Goals, behind one toggle.
//
// Defaults to To-do — that's the thing checked daily; goals are checked weekly. The same
// `mode` drives the narrow per-week column beside each week row (CalendarView owns the state),
// so flipping this flips both and the two never disagree about what they're showing.
//
// Goals content is passed in as a node rather than rebuilt here: the goal rows need
// updateGoal/abandonGoal/the editor modal, all of which live in CalendarView. One definition,
// rendered in two places.
//
// The To-do pane is a coach's list, not a calendar dump (courses/SCHOOL-OPS.md): what to do
// next and why, what is open to start now, what Canvas says is missing, and — the part the old
// rail silently dropped — everything past due that nobody has confirmed either way.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourseTasks, groupByDay, kindAbbr } from './courseTasks';
import { daysBetween, relativeDay, shortDate, startHint, nextReason } from './courseworkFormat';

const HORIZONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: null, label: 'All' },
];

/** One assignment: check-off on the left, the item (a link to the LMS when there is one) beside it. */
export function TaskRow({ task, todayISO, onToggle, reason }) {
  const soon = task.due && task.due >= todayISO && daysBetween(todayISO, task.due) <= 1;
  const hint = reason ?? startHint(task, todayISO);
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
        {task.pctOfGrade != null && task.pctOfGrade >= 1 && <span>≈{task.pctOfGrade.toFixed(task.pctOfGrade >= 10 ? 0 : 1)}% of grade</span>}
        {task.timeLimit != null && <span>{task.timeLimit} min</span>}
        {hint && <span className={`ft-crs-hint${task.inWindow ? ' ft-crs-hint-now' : ''}`}>{hint}</span>}
      </div>
    </>
  );
  const cls = `ft-crs-row${soon ? ' ft-crs-row-soon' : ''}${task.done ? ' ft-crs-row-done' : ''}${task.kind === 'exam' ? ' ft-crs-row-exam' : ''}`;
  const style = { '--ft-crs-accent': task.color };
  return (
    <div className={cls} style={style}>
      <button
        type="button"
        className={`ft-crs-check${task.done ? ' on' : ''}`}
        onClick={() => onToggle(task)}
        aria-pressed={task.done}
        aria-label={task.done ? `Mark "${task.name}" not done` : `Mark "${task.name}" done`}
        title={task.done ? 'Done — click to undo' : 'Mark done (only here — Canvas is not changed)'}
      >
        {task.done ? '✓' : ''}
      </button>
      {task.url
        ? <a className="ft-crs-row-body" href={task.url} target="_blank" rel="noreferrer">{body}</a>
        : <div className="ft-crs-row-body">{body}</div>}
    </div>
  );
}

export function FreshnessNote({ meta, compact = false }) {
  if (meta.fresh) {
    return <div className="ft-crs-fresh ok">Due dates synced {meta.feedAgeHours < 1 ? 'just now' : `${meta.feedAgeHours}h ago`} from your school calendars.</div>;
  }
  const age = meta.snapshotAgeDays;
  return (
    <div className="ft-crs-fresh">
      {compact
        ? <>Canvas data is {age} days old.</>
        : <>Canvas data is from the {shortDate(String(meta.snapshotAt).slice(0, 10))} capture ({age} days old) — statuses since then are unconfirmed.</>}{' '}
      <Link to="/MFT/school#freshen">Make it update itself →</Link>
    </div>
  );
}

function TodoPane({ todayISO, horizon, onHorizon }) {
  const cw = useCourseTasks();
  const [showPast, setShowPast] = useState(false);
  const toggle = (t) => cw.actions.setDone(t.id, !t.done);

  const ahead = cw.upcoming.filter((t) => horizon == null || daysBetween(todayISO, t.due) <= horizon);
  const byDay = groupByDay(ahead);
  const totalPts = ahead.reduce((n, t) => n + (t.points ?? 0), 0);
  const next = cw.doNext(3);

  if (!cw.tasks.length) {
    return <div className="ft-crs-empty">No coursework found. See <Link to="/MFT/school">School</Link> to connect your school calendars.</div>;
  }

  return (
    <>
      <FreshnessNote meta={cw.meta} compact />

      {next.length > 0 && (
        <div className="ft-crs-next">
          <div className="ft-crs-next-head">Do next</div>
          {next.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} onToggle={toggle} reason={nextReason(t)} />)}
        </div>
      )}

      {cw.missing.length > 0 && (
        <div className="ft-crs-alert">
          <div className="ft-crs-alert-head">{cw.missing.length} missing (Canvas said so)</div>
          {cw.missing.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} onToggle={toggle} />)}
        </div>
      )}

      {cw.pastUnverified.length > 0 && (
        <div className="ft-crs-note">
          <button type="button" className="ft-crs-note-btn ft-crs-note-warn" onClick={() => setShowPast((v) => !v)}>
            {showPast ? '▾' : '▸'} {cw.pastUnverified.length} past due, not confirmed done
          </button>
          {showPast && (
            <>
              <p className="ft-crs-note-text">
                These were still open at the last Canvas capture. Tick off the ones you did — anything left is
                worth a look before it turns into a zero.
              </p>
              {cw.pastUnverified.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} onToggle={toggle} />)}
            </>
          )}
        </div>
      )}

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
          {tasks.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} onToggle={toggle} />)}
        </div>
      ))}

      {cw.undated.length > 0 && (
        <div className="ft-crs-day">
          <div className="ft-crs-day-head"><span>No date yet</span></div>
          {cw.undated.map((t) => <TaskRow key={t.id} task={t} todayISO={todayISO} onToggle={toggle} reason="no due date in Canvas or the syllabus" />)}
        </div>
      )}
    </>
  );
}

export default function CalendarSideRail({
  mode, onMode, todayISO, horizon, onHorizon, goalCount, goalsNode, onClose,
}) {
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
          <Link to="/MFT/school">School planner</Link>
          <Link to="/TKB/courses/dashboard">Course dashboard</Link>
        </div>
      )}
    </aside>
  );
}
