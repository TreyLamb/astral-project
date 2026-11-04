// The calendar's right-hand rail: the To-do list (Orbit to-dos, NOT school), or Goals, behind one toggle.
//
// Defaults to To-do — that's the thing checked daily; goals are checked weekly. The same
// `mode` drives the narrow per-week column beside each week row (CalendarView owns the state),
// so flipping this flips both and the two never disagree about what they're showing.
//
// Goals content is passed in as a node rather than rebuilt here: the goal rows need
// updateGoal/abandonGoal/the editor modal, all of which live in CalendarView. One definition,
// rendered in two places.
//
// TaskRow / FreshnessNote below are the coursework pieces the School planner (SchoolPlanner.jsx) reuses.

import { Link } from 'react-router-dom';
import { kindAbbr } from './courseTasks';
import { orbitTodoDay } from './orbitTasksBridge';
import { daysBetween, relativeDay, shortDate, startHint } from './courseworkFormat';

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

const NO_DATE_CAP = 12;

/** One Orbit to-do: area colour on the left, title, and what kind of date it is. Opens it in Orbit. */
function OrbitTodoRow({ task, area, onOpen }) {
  const color = area?.color || '#94a3b8';
  const dueOnly = task.dueDate && task.dueDate !== task.scheduledDate;
  return (
    <div className="ft-crs-row" style={{ '--ft-crs-accent': color }}>
      <button type="button" className="ft-crs-row-body" onClick={() => onOpen(task)} title="Open in Orbit">
        <div className="ft-crs-row-top">
          <span className="ft-crs-row-code" style={{ color }}>{area?.name || 'To-do'}</span>
          {dueOnly && <span className="ft-crs-row-kind">due</span>}
        </div>
        <div className="ft-crs-row-name">{task.title || '(untitled)'}</div>
      </button>
    </div>
  );
}

// The To-do tab is the things you have to do that are NOT school (Trey, 2026-11-03: "school
// doesn't count for that list"). They come from Orbit, the same to-dos the day cells draw as
// chips. Coursework has its own "Coursework" chips on the grid and the School planner.
function TodoPane({ todayISO, horizon, onHorizon, orbitTodos, orbitAreaById, onOrbitOpen }) {
  const dated = orbitTodos.filter((t) => orbitTodoDay(t));
  const undated = orbitTodos.filter((t) => !orbitTodoDay(t));
  const overdue = dated.filter((t) => orbitTodoDay(t) < todayISO);
  const ahead = dated.filter((t) => orbitTodoDay(t) >= todayISO
    && (horizon == null || daysBetween(todayISO, orbitTodoDay(t)) <= horizon));
  const byDay = [];
  for (const t of [...ahead].sort((a, b) => orbitTodoDay(a).localeCompare(orbitTodoDay(b)))) {
    const day = orbitTodoDay(t);
    if (!byDay.length || byDay[byDay.length - 1][0] !== day) byDay.push([day, []]);
    byDay[byDay.length - 1][1].push(t);
  }
  const row = (t) => <OrbitTodoRow key={t.id} task={t} area={orbitAreaById.get(t.areaId)} onOpen={onOrbitOpen} />;

  if (!orbitTodos.length) {
    return <div className="ft-crs-empty">No open to-dos. Add some in <Link to="/orbit">Orbit</Link>.</div>;
  }

  return (
    <>
      {overdue.length > 0 && (
        <div className="ft-crs-alert">
          <div className="ft-crs-alert-head">{overdue.length} overdue</div>
          {overdue.map(row)}
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
        <span className="ft-crs-tally">{ahead.length} coming up</span>
      </div>

      {byDay.length === 0 ? (
        <div className="ft-crs-empty">
          Nothing dated{horizon == null ? '' : ` in the next ${horizon} days`}.
        </div>
      ) : byDay.map(([day, tasks]) => (
        <div className="ft-crs-day" key={day}>
          <div className={`ft-crs-day-head${day === todayISO ? ' ft-crs-day-today' : ''}`}>
            <span>{relativeDay(day, todayISO)}</span>
            {daysBetween(todayISO, day) < 7 && <span className="ft-crs-day-date">{shortDate(day)}</span>}
          </div>
          {tasks.map(row)}
        </div>
      ))}

      {undated.length > 0 && (
        <div className="ft-crs-day">
          <div className="ft-crs-day-head"><span>No date</span></div>
          {undated.slice(0, NO_DATE_CAP).map(row)}
          {undated.length > NO_DATE_CAP && (
            <div className="ft-crs-empty"><Link to="/orbit">+{undated.length - NO_DATE_CAP} more in Orbit</Link></div>
          )}
        </div>
      )}
    </>
  );
}

export default function CalendarSideRail({
  mode, onMode, todayISO, horizon, onHorizon, goalCount, goalsNode, onClose,
  orbitTodos, orbitAreaById, onOrbitOpen,
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
          ? <TodoPane todayISO={todayISO} horizon={horizon} onHorizon={onHorizon} orbitTodos={orbitTodos} orbitAreaById={orbitAreaById} onOrbitOpen={onOrbitOpen} />
          : goalsNode}
      </div>

      {mode === 'todo' && (
        <div className="ft-side-rail-foot">
          <Link to="/orbit">Orbit</Link>
        </div>
      )}
    </aside>
  );
}
