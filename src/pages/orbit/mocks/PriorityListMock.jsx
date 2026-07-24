import { useMemo, useState } from 'react';
import { MOCK_AREAS, MOCK_PROJECTS, MOCK_TASKS, TODAY } from '../mockData';
import './PriorityListMock.css';

const isClosed = t => t.status === 'done' || t.status === 'killed';
const isOverdue = t => !!t.dueDate && t.dueDate < TODAY && !isClosed(t);
const scoreOf = t => 2 * t.importance + 2 * t.urgency - t.effort;

// readiness: every blocker must resolve to a done/killed task (or not exist —
// can't happen in this dataset, but treat unresolved ids as still blocking).
function readinessOf(tasks) {
  const byId = new Map(tasks.map(t => [t.id, t]));
  const ready = new Map();
  tasks.forEach(t => {
    ready.set(t.id, t.blockedBy.every(id => byId.get(id) && isClosed(byId.get(id))));
  });
  return { byId, ready };
}

function formatDue(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PriorityListMock() {
  const [tasks, setTasks] = useState(() => MOCK_TASKS.map(t => ({ ...t })));
  const [pinned, setPinned] = useState(() => new Set());

  const areaById = useMemo(() => new Map(MOCK_AREAS.map(a => [a.id, a])), []);
  const projectById = useMemo(() => new Map(MOCK_PROJECTS.map(p => [p.id, p])), []);
  const { byId, ready } = useMemo(() => readinessOf(tasks), [tasks]);

  const complete = id => setTasks(ts => ts.map(t => (t.id === id ? { ...t, status: 'done' } : t)));
  const togglePin = id =>
    setPinned(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const open = tasks.filter(t => t.status === 'todo' || t.status === 'doing');
  const actionable = open.filter(t => ready.get(t.id));
  const blocked = open.filter(t => !ready.get(t.id));

  // pinned first, then overdue, then score, then soonest due date (nulls last)
  const rank = (a, b) => {
    const pinDiff = (pinned.has(b.id) ? 1 : 0) - (pinned.has(a.id) ? 1 : 0);
    if (pinDiff !== 0) return pinDiff;
    const overdueDiff = (isOverdue(b) ? 1 : 0) - (isOverdue(a) ? 1 : 0);
    if (overdueDiff !== 0) return overdueDiff;
    const scoreDiff = scoreOf(b) - scoreOf(a);
    if (scoreDiff !== 0) return scoreDiff;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  };

  const ranked = [...actionable].sort(rank);
  const blockedSorted = [...blocked].sort(rank);

  return (
    <div className="orb-pl">
      <div className="orb-pl-head">
        <h2 className="orb-pl-h2">Priority List</h2>
        <p className="orb-pl-sub">
          Ranked by <code>2×importance + 2×urgency − effort</code>. Overdue tasks float to the top; pins float
          above everything.
        </p>
      </div>

      <section className="orb-pl-section">
        <h3 className="orb-pl-section-title">Ranked <span className="orb-pl-count">{ranked.length}</span></h3>
        {ranked.length === 0 && <div className="orb-pl-empty">Nothing actionable right now.</div>}
        <div className="orb-pl-list">
          {ranked.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              area={areaById.get(t.areaId)}
              project={projectById.get(t.projectId)}
              overdue={isOverdue(t)}
              pinned={pinned.has(t.id)}
              score={scoreOf(t)}
              onComplete={() => complete(t.id)}
              onPin={() => togglePin(t.id)}
            />
          ))}
        </div>
      </section>

      <section className="orb-pl-section orb-pl-blocked-section">
        <h3 className="orb-pl-section-title">Blocked <span className="orb-pl-count">{blockedSorted.length}</span></h3>
        {blockedSorted.length === 0 && <div className="orb-pl-empty">Nothing blocked.</div>}
        <div className="orb-pl-list">
          {blockedSorted.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              area={areaById.get(t.areaId)}
              project={projectById.get(t.projectId)}
              overdue={isOverdue(t)}
              pinned={pinned.has(t.id)}
              score={scoreOf(t)}
              onComplete={() => complete(t.id)}
              onPin={() => togglePin(t.id)}
              blocked
              blockedByTitles={t.blockedBy.map(id => byId.get(id)?.title).filter(Boolean)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function TaskRow({ task, area, project, overdue, pinned, score, onComplete, onPin, blocked, blockedByTitles }) {
  return (
    <div
      className={`orb-row orb-pl-row${blocked ? ' orb-pl-row-blocked' : ''}${overdue ? ' orb-flag-warn' : ''}${pinned ? ' orb-pl-row-pinned' : ''}`}
    >
      <input
        type="checkbox"
        className="orb-pl-checkbox"
        checked={false}
        onChange={onComplete}
        aria-label={`Mark "${task.title}" complete`}
      />

      <div className="orb-pl-main">
        <div className="orb-pl-title-row">
          <span className="orb-pl-title">{task.title}</span>
          {task.status === 'doing' && <span className="orb-pl-badge">doing</span>}
        </div>
        <div className="orb-pl-meta">
          {area && (
            <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
              <span className="orb-chip-dot" />
              {area.name}
            </span>
          )}
          {project && <span className="orb-pl-project">{project.name}</span>}
          {blocked && blockedByTitles.length > 0 && (
            <span className="orb-pl-blockedby">blocked by: {blockedByTitles.join(', ')}</span>
          )}
        </div>
      </div>

      <div className="orb-pl-iue" title={`Importance ${task.importance} · Urgency ${task.urgency} · Effort ${task.effort}`}>
        <span>I{task.importance}</span>
        <span>U{task.urgency}</span>
        <span>E{task.effort}</span>
      </div>

      <div className="orb-pl-due">
        {overdue && <span className="orb-pl-overdue-tag">overdue</span>}
        {!overdue && task.dueDate && <span className="orb-pl-due-date">{formatDue(task.dueDate)}</span>}
      </div>

      <div className="orb-pl-score" title="Priority score = 2×importance + 2×urgency − effort">
        {score}
      </div>

      <button
        type="button"
        className={`orb-pl-pin${pinned ? ' active' : ''}`}
        onClick={onPin}
        aria-label={pinned ? `Unpin "${task.title}"` : `Pin "${task.title}"`}
        aria-pressed={pinned}
      >
        📌
      </button>
    </div>
  );
}
