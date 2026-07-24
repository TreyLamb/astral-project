import { useState } from 'react';
import { useOrbit } from '../orbitContext';
import TaskRow from './TaskRow';
import './SubtaskList.css';

// UI-only guard: TaskRow's expand chevron reveals TaskEditor, which embeds
// SubtaskList, which renders each child as another TaskRow — a task whose
// parentTaskId points back into its own ancestry (pathological data, not
// something the data layer forbids) would otherwise recurse forever. This
// caps *render* depth only; it never touches the data.
const MAX_SUBTASK_DEPTH = 8;

// Nested subtasks (and sub-sub-tasks): each child is rendered as a full
// TaskRow, so expanding IT reveals its own SubtaskList — the recursion is
// free, not hand-rolled per level.
export default function SubtaskList({ task, depth = 0 }) {
  const { tasks, addTask } = useOrbit();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const children = tasks.filter((t) => t.parentTaskId === task.id);

  if (depth >= MAX_SUBTASK_DEPTH) {
    if (children.length === 0) return null;
    return (
      <div className="orb-sub orb-sub-maxdepth">
        Nesting limit reached — {children.length} more subtask{children.length === 1 ? '' : 's'} here aren't shown further.
      </div>
    );
  }

  const doneCount = children.filter((c) => c.status === 'done').length;
  const killedCount = children.filter((c) => c.status === 'killed').length;

  const submitAdd = () => {
    const title = draft.trim();
    if (!title) { setAdding(false); return; }
    addTask({ parentTaskId: task.id, areaId: task.areaId, projectId: task.projectId, title });
    setDraft('');
    // stays open — mirrors CaptureBar's rapid multi-add pattern
  };

  return (
    <div className="orb-sub">
      <div className="orb-sub-head">
        <span className="orb-sub-title-label">Subtasks</span>
        {children.length > 0 && (
          <span className="orb-sub-summary">
            {doneCount}/{children.length} done{killedCount > 0 ? ` · ${killedCount} killed` : ''}
          </span>
        )}
      </div>

      {children.length > 0 && (
        <div className="orb-sub-list">
          {children.map((child) => (
            <TaskRow key={child.id} task={child} depth={depth + 1} showProject={false} />
          ))}
        </div>
      )}

      {adding ? (
        <input
          className="orb-sub-input"
          autoFocus
          value={draft}
          placeholder="Subtask title…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitAdd();
            if (e.key === 'Escape') { setDraft(''); setAdding(false); }
          }}
          onBlur={() => { if (draft.trim()) submitAdd(); else setAdding(false); }}
        />
      ) : (
        <button type="button" className="orb-sub-add-btn" onClick={() => setAdding(true)}>+ Add subtask</button>
      )}
    </div>
  );
}
