import { useState } from 'react';
import { useOrbit } from '../orbitContext';
import { isOverdue } from '../calc/priority';
import TaskEditor from './TaskEditor';
import './TaskRow.css';

// Shared task row — Today, Triage, Project, and Areas views all drop this in
// directly. No modals: complete/pin are one click, title edits happen
// in-place. Every mutation goes through updateTask (optimistic).
// `depth` is purely visual/recursion bookkeeping for subtask nesting (see
// SubtaskList.jsx) — it indents nested rows and caps how deep the expand-to-
// edit chevron will keep recursing.
export default function TaskRow({ task, showProject = true, depth = 0 }) {
  const { updateTask, areas, projects, tasks, today } = useOrbit();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [expanded, setExpanded] = useState(false);

  const area = areas.find((a) => a.id === task.areaId);
  const project = projects.find((p) => p.id === task.projectId);
  const overdue = isOverdue(task, today);
  const done = task.status === 'done';

  // Scannable without expanding — mirrors SubtaskList's own done-count.
  const children = task.isProject ? tasks.filter((t) => t.parentTaskId === task.id) : [];
  const childrenDone = children.filter((t) => t.status === 'done').length;

  const toggleDone = () => {
    updateTask(task.id, done
      ? { status: 'todo', completedAt: null }
      : { status: 'done', completedAt: Date.now() });
  };

  const togglePin = () => {
    updateTask(task.id, task.pinnedToday
      ? { pinnedToday: false, pinnedOn: null }
      : { pinnedToday: true, pinnedOn: today });
  };

  const startEdit = () => {
    setDraftTitle(task.title);
    setEditing(true);
  };

  const commitTitle = () => {
    setEditing(false);
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== task.title) updateTask(task.id, { title: trimmed });
  };

  return (
    <div className="orb-task-row-outer" style={depth > 0 ? { marginLeft: Math.min(depth, 8) * 16 } : undefined}>
      <div className={`orb-row orb-task-row${overdue ? ' orb-flag-warn' : ''}${done ? ' orb-task-row-done' : ''}`}>
        <input
          type="checkbox"
          className="orb-task-checkbox"
          checked={done}
          onChange={toggleDone}
          aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" complete`}
        />

        <div className="orb-task-main">
          {editing ? (
            <input
              className="orb-task-title-input"
              value={draftTitle}
              autoFocus
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { setDraftTitle(task.title); setEditing(false); }
              }}
            />
          ) : (
            <span className="orb-task-title" onClick={startEdit}>
              {task.title || <em>untitled</em>}
              {task.status === 'doing' && <span className="orb-task-badge">doing</span>}
              {children.length > 0 && (
                <span className="orb-task-badge" title="Children of this project">
                  {childrenDone}/{children.length}
                </span>
              )}
            </span>
          )}

          <div className="orb-task-meta">
            {area && (
              <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
                <span className="orb-chip-dot" />
                {area.name}
              </span>
            )}
            {showProject && project && <span className="orb-task-project">{project.name}</span>}
            {task.dueDate && (
              <span className={`orb-task-due${overdue ? ' orb-flag-warn' : ''}`}>
                {overdue ? 'overdue · ' : 'due '}{task.dueDate}
              </span>
            )}
          </div>
        </div>

        <div
          className="orb-task-iude"
          title={`Importance ${task.importance} · Urgency ${task.urgency} · Time ${task.timeMin ?? '—'}min · Difficulty ${task.difficulty} · Energy ${task.energy}`}
        >
          <span>I{task.importance}</span>
          <span>U{task.urgency}</span>
          <span>T{task.timeMin ?? '—'}</span>
          <span>D{task.difficulty}</span>
          <span>E{task.energy}</span>
        </div>

        <button
          type="button"
          className={`orb-task-pin${task.pinnedToday ? ' active' : ''}`}
          onClick={togglePin}
          aria-label={task.pinnedToday ? `Unpin "${task.title}"` : `Pin "${task.title}" to today`}
          aria-pressed={task.pinnedToday}
        >
          📌
        </button>

        <button
          type="button"
          className={`orb-task-expand${expanded ? ' active' : ''}`}
          onClick={() => setExpanded((x) => !x)}
          aria-label={expanded ? `Collapse "${task.title}"` : `Expand "${task.title}" to edit`}
          aria-expanded={expanded}
        >
          {expanded ? '▾' : '▸'}
        </button>
      </div>

      {expanded && (
        <div className="orb-task-editor-wrap">
          <TaskEditor task={task} depth={depth} />
        </div>
      )}
    </div>
  );
}
