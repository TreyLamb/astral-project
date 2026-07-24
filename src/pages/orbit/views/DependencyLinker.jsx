import { useState } from 'react';
import { useOrbit } from '../orbitContext';
import { isReady, blockerTitles, wouldCreateCycle } from '../calc/readiness';
import './DependencyLinker.css';

// Compact inline "pick a task" combo — text filter over a candidate list,
// click or Enter to pick. Local to DependencyLinker, not reused elsewhere.
function TaskPicker({ candidates, onPick, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const matches = query.trim()
    ? candidates.filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : candidates.slice(0, 8);

  const pick = (task) => {
    onPick(task.id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="orb-dl-picker">
      <input
        className="orb-dl-picker-input"
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches[0]) pick(matches[0]);
          if (e.key === 'Escape') { setQuery(''); setOpen(false); e.currentTarget.blur(); }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && matches.length > 0 && (
        <ul className="orb-dl-picker-list">
          {matches.map((t) => (
            // onMouseDown (not onClick) fires before the input's onBlur closes the list.
            <li key={t.id}>
              <button type="button" className="orb-dl-picker-item" onMouseDown={() => pick(t)}>
                {t.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && matches.length === 0 && (
        <div className="orb-dl-picker-empty">No matching tasks</div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  return <span className={`orb-dl-dot orb-dl-dot-${status}`} aria-hidden="true" />;
}

// The seamless blockers UI: "Blocked by" edits THIS task's own blockedBy;
// "Blocks" edits the OTHER task's blockedBy (reverse relationship, found by
// scanning `tasks` for anyone whose blockedBy already contains this id).
export default function DependencyLinker({ task }) {
  const { tasks, tasksById, updateTask } = useOrbit();
  const [blockedByError, setBlockedByError] = useState(null);
  const [blocksError, setBlocksError] = useState(null);

  const blockedBy = task.blockedBy || [];
  const blockers = blockedBy.map((id) => tasksById.get(id)).filter(Boolean);
  const blocks = tasks.filter((t) => (t.blockedBy || []).includes(task.id));

  const ready = isReady(task, tasksById);
  const openBlockerTitles = blockerTitles(task, tasksById);

  const addBlocker = (blockerId) => {
    setBlockedByError(null);
    if (blockerId === task.id) return;
    if (blockedBy.includes(blockerId)) return;
    if (wouldCreateCycle(task.id, blockerId, tasksById)) {
      setBlockedByError('Circular dependency — that task already depends on this one.');
      return;
    }
    updateTask(task.id, { blockedBy: [...blockedBy, blockerId] });
  };

  const removeBlocker = (blockerId) => {
    updateTask(task.id, { blockedBy: blockedBy.filter((id) => id !== blockerId) });
  };

  const addBlocks = (otherId) => {
    setBlocksError(null);
    if (otherId === task.id) return;
    const other = tasksById.get(otherId);
    if (!other) return;
    const otherBlockedBy = other.blockedBy || [];
    if (otherBlockedBy.includes(task.id)) return;
    if (wouldCreateCycle(otherId, task.id, tasksById)) {
      setBlocksError('Circular dependency — this task already depends on that one.');
      return;
    }
    updateTask(otherId, { blockedBy: [...otherBlockedBy, task.id] });
  };

  const removeBlocks = (otherId) => {
    const other = tasksById.get(otherId);
    if (!other) return;
    updateTask(otherId, { blockedBy: (other.blockedBy || []).filter((id) => id !== task.id) });
  };

  const blockedByIds = new Set(blockedBy);
  const blockerCandidates = tasks.filter((t) => t.id !== task.id && !blockedByIds.has(t.id));
  const blocksIds = new Set(blocks.map((t) => t.id));
  const blocksCandidates = tasks.filter((t) => t.id !== task.id && !blocksIds.has(t.id));

  return (
    <div className="orb-dl">
      <div className="orb-dl-readiness">
        {ready
          ? <span className="orb-dl-ready-badge">Ready</span>
          : <span className="orb-dl-blocked-badge orb-flag-warn">Blocked by {openBlockerTitles.join(', ')}</span>}
      </div>

      <div className="orb-dl-section">
        <div className="orb-dl-section-head">Blocked by →</div>
        {blockers.length > 0 && (
          <ul className="orb-dl-list">
            {blockers.map((b) => (
              <li key={b.id} className="orb-dl-list-item">
                <StatusDot status={b.status} />
                <span className={`orb-dl-item-title${b.status === 'done' || b.status === 'killed' ? ' resolved' : ''}`}>{b.title}</span>
                <button type="button" className="orb-dl-remove" onClick={() => removeBlocker(b.id)} aria-label={`Remove "${b.title}" as a blocker`}>×</button>
              </li>
            ))}
          </ul>
        )}
        <TaskPicker candidates={blockerCandidates} onPick={addBlocker} placeholder="Search tasks to add as a blocker…" />
        {blockedByError && <div className="orb-dl-error">{blockedByError}</div>}
      </div>

      <div className="orb-dl-section">
        <div className="orb-dl-section-head">Blocks →</div>
        {blocks.length > 0 && (
          <ul className="orb-dl-list">
            {blocks.map((b) => (
              <li key={b.id} className="orb-dl-list-item">
                <StatusDot status={b.status} />
                <span className={`orb-dl-item-title${b.status === 'done' || b.status === 'killed' ? ' resolved' : ''}`}>{b.title}</span>
                <button type="button" className="orb-dl-remove" onClick={() => removeBlocks(b.id)} aria-label={`Stop blocking "${b.title}"`}>×</button>
              </li>
            ))}
          </ul>
        )}
        <TaskPicker candidates={blocksCandidates} onPick={addBlocks} placeholder="Search tasks this one blocks…" />
        {blocksError && <div className="orb-dl-error">{blocksError}</div>}
      </div>
    </div>
  );
}
