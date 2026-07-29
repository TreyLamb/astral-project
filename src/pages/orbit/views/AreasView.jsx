import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { qualifyToday, increment } from '../calc/trackers';
import { AREA_HARD_CAP as HARD_CAP } from '../orbitConfig';
import TaskRow from './TaskRow';
import './AreasView.css';

const SOFT_WARN_AT = 10;

// zero non-archived projects AND zero non-killed/non-done tasks (spec §9) —
// only then is a "real" removal safe to offer at all.
function isDeleteEligible(area, projects, tasks) {
  const hasOpenProjects = projects.some((p) => p.areaId === area.id && p.status !== 'archived');
  const hasOpenTasks = tasks.some((t) => t.areaId === area.id && t.status !== 'done' && t.status !== 'killed');
  return !hasOpenProjects && !hasOpenTasks;
}

function AreaColorSwatch({ area, onChange }) {
  return (
    <input
      type="color"
      className="orb-area-swatch"
      value={area.color}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Color for ${area.name}`}
      title="Change area color"
    />
  );
}

function AreaName({ area, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(area.name);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== area.name) onCommit(trimmed);
    else setDraft(area.name);
  };

  if (editing) {
    return (
      <input
        className="orb-area-name-input"
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { setDraft(area.name); setEditing(false); }
        }}
      />
    );
  }
  return (
    <span className="orb-area-name" onClick={() => { setDraft(area.name); setEditing(true); }}>
      {area.name || <em>untitled</em>}
    </span>
  );
}

function QuickAdd({ placeholder, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const submit = () => {
    const title = draft.trim();
    if (!title) { setOpen(false); return; }
    onSubmit(title);
    setDraft('');
  };

  if (!open) {
    return <button type="button" className="orb-area-quickadd-btn" onClick={() => setOpen(true)}>{placeholder}</button>;
  }
  return (
    <input
      className="orb-area-quickadd-input"
      autoFocus
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') { setDraft(''); setOpen(false); }
      }}
      onBlur={() => { if (draft.trim()) submit(); else setOpen(false); }}
    />
  );
}

// Compact per-Area glance widget (A6) — same quick-action math as
// TrackersView's rows (calc/trackers.js's increment/qualifyToday), just
// rendered as chips instead of full rows. No history/edit here by design —
// that stays in TrackersView; this is a nudge, not a second manager.
function AreaTrackersWidget({ area, trackers, today, addTracker, updateTracker }) {
  const areaTrackers = trackers.filter((t) => t.areaId === area.id);

  const apply = (tracker, updated) => updateTracker(tracker.id, {
    currentValue: updated.currentValue,
    lastQualifiedDate: updated.lastQualifiedDate,
    lastResetAt: updated.lastResetAt,
  });

  return (
    <div className="orb-area-detail-section">
      <div className="orb-area-detail-head">
        <span>Trackers</span>
        <QuickAdd placeholder="+ tracker" onSubmit={(name) => addTracker({ areaId: area.id, name })} />
      </div>
      {areaTrackers.length === 0 ? (
        <div className="orb-area-empty">No trackers yet</div>
      ) : (
        <div className="orb-area-tracker-list">
          {areaTrackers.map((t) => {
            if (t.type === 'streak') {
              const qualified = t.lastQualifiedDate === today;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`orb-chip orb-area-tracker-chip orb-area-tracker-streak${qualified ? ' done' : ''}`}
                  disabled={qualified}
                  onClick={() => apply(t, qualifyToday(t, today))}
                  title={qualified ? `${t.name} — done today` : `Mark "${t.name}" done today`}
                >
                  🔥 {t.name || <em>untitled</em>} · {t.currentValue}
                </button>
              );
            }
            return (
              <span key={t.id} className="orb-chip orb-area-tracker-chip">
                <span className="orb-area-tracker-name">{t.name || <em>untitled</em>}</span>
                <button
                  type="button"
                  className="orb-area-tracker-step"
                  disabled={t.currentValue <= 0}
                  onClick={() => apply(t, increment(t, -1))}
                  aria-label={`Decrease ${t.name}`}
                >
                  −
                </button>
                <span className="orb-area-tracker-value">{t.currentValue}</span>
                <button
                  type="button"
                  className="orb-area-tracker-step"
                  onClick={() => apply(t, increment(t, 1))}
                  aria-label={`Increase ${t.name}`}
                >
                  +
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AreaDetail({ area, projects, tasks, trackers, today, addProject, addTask, addTracker, updateTracker }) {
  const areaProjects = projects.filter((p) => p.areaId === area.id);
  const directTasks = tasks.filter((t) => t.areaId === area.id && !t.projectId);

  return (
    <div className="orb-area-detail">
      <div className="orb-area-detail-section">
        <div className="orb-area-detail-head">
          <span>Projects</span>
          <QuickAdd placeholder="+ Add project" onSubmit={(name) => addProject({ areaId: area.id, name })} />
        </div>
        {areaProjects.length === 0 ? (
          <div className="orb-area-empty">No projects yet</div>
        ) : (
          <ul className="orb-area-project-list">
            {areaProjects.map((p) => (
              <li key={p.id}>
                <Link to={`/orbit/project/${p.id}`} className="orb-area-project-link">{p.name || <em>untitled</em>}</Link>
                <span className={`orb-chip orb-area-project-status orb-area-project-status-${p.status}`}>{p.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="orb-area-detail-section">
        <div className="orb-area-detail-head">
          <span>Direct tasks</span>
          <QuickAdd placeholder="+ Add task" onSubmit={(title) => addTask({ areaId: area.id, projectId: null, title })} />
        </div>
        {directTasks.length === 0 ? (
          <div className="orb-area-empty">No direct tasks</div>
        ) : (
          <div className="orb-area-task-list">
            {directTasks.map((t) => <TaskRow key={t.id} task={t} showProject={false} />)}
          </div>
        )}
      </div>

      <AreaTrackersWidget area={area} trackers={trackers} today={today} addTracker={addTracker} updateTracker={updateTracker} />
    </div>
  );
}

export default function AreasView() {
  const {
    areas, projects, tasks, trackers, today,
    addArea, updateArea, archiveArea, removeArea, reorderAreas, addProject, addTask, addTracker, updateTracker,
  } = useOrbit();
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [addingArea, setAddingArea] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  // Only the eligible (empty-area) path ever reaches this — non-eligible
  // areas archive in one click, unchanged (see spec in the button JSX below).
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // removeArea (real hard delete) is being landed in orbitContext.js
  // concurrently — reference it defensively so this view degrades to the
  // old archive-as-delete behavior if it isn't present yet.
  const doDelete = (id) => {
    if (removeArea) removeArea(id); else archiveArea(id);
    setConfirmDeleteId(null);
  };

  const activeAreas = areas.filter((a) => !a.archived).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const archivedAreas = areas.filter((a) => a.archived);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // reorderAreas replaces the WHOLE areas array (see orbitContext.js), so
  // the id list passed here must include every area, active and archived,
  // in the new order — dropping any would silently delete it from state.
  const moveArea = (id, direction) => {
    const idx = activeAreas.findIndex((a) => a.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= activeAreas.length) return;
    const reordered = activeAreas.slice();
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    reorderAreas([...reordered.map((a) => a.id), ...archivedAreas.map((a) => a.id)]);
  };

  const [dragId, setDragId] = useState(null);
  const onDrop = (targetId) => {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const ids = activeAreas.map((a) => a.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) { setDragId(null); return; }
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    reorderAreas([...ids, ...archivedAreas.map((a) => a.id)]);
    setDragId(null);
  };

  const submitAddArea = () => {
    const name = newAreaName.trim();
    if (!name) { setAddingArea(false); return; }
    if (areas.length >= HARD_CAP) return; // guarded below too — belt & suspenders
    addArea({ name, sortOrder: activeAreas.length });
    setNewAreaName('');
    setAddingArea(false);
  };

  const atCap = areas.length >= HARD_CAP;
  const nearCap = areas.length >= SOFT_WARN_AT;

  return (
    <div className="orb-areas">
      <div className="orb-areas-head">
        <h2 className="orb-areas-h2">Areas</h2>
        {!atCap ? (
          addingArea ? (
            <input
              className="orb-area-quickadd-input"
              autoFocus
              value={newAreaName}
              placeholder="New area name…"
              onChange={(e) => setNewAreaName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitAddArea();
                if (e.key === 'Escape') { setNewAreaName(''); setAddingArea(false); }
              }}
              onBlur={() => { if (newAreaName.trim()) submitAddArea(); else setAddingArea(false); }}
            />
          ) : (
            <button type="button" className="orb-btn orb-btn-primary" onClick={() => setAddingArea(true)}>+ Add area</button>
          )
        ) : (
          <span className="orb-areas-cap-msg orb-flag-warn">12-area cap reached — archive one before adding another</span>
        )}
      </div>

      {nearCap && !atCap && (
        <div className="orb-areas-warn">
          {areas.length} areas — the recommended range is 5–8 (soft warning past 10, hard cap at 12).
        </div>
      )}

      <div className="orb-area-list">
        {activeAreas.map((area, idx) => {
          const projectCount = projects.filter((p) => p.areaId === area.id).length;
          const taskCount = tasks.filter((t) => t.areaId === area.id).length;
          const expanded = expandedIds.has(area.id);
          const eligible = isDeleteEligible(area, projects, tasks);

          return (
            <div
              key={area.id}
              className={`orb-area-card${dragId === area.id ? ' dragging' : ''}`}
              draggable
              onDragStart={() => setDragId(area.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(area.id)}
            >
              <div className="orb-row orb-area-row">
                <span className="orb-area-drag-handle" title="Drag to reorder" aria-hidden="true">⠿</span>
                <button
                  type="button"
                  className={`orb-area-expand${expanded ? ' active' : ''}`}
                  onClick={() => toggleExpand(area.id)}
                  aria-label={expanded ? `Collapse ${area.name}` : `Expand ${area.name}`}
                  aria-expanded={expanded}
                >
                  {expanded ? '▾' : '▸'}
                </button>
                <AreaColorSwatch area={area} onChange={(color) => updateArea(area.id, { color })} />
                <AreaName area={area} onCommit={(name) => updateArea(area.id, { name })} />
                <span className="orb-area-counts">
                  {projectCount} project{projectCount === 1 ? '' : 's'} · {taskCount} task{taskCount === 1 ? '' : 's'}
                </span>
                <div className="orb-area-reorder">
                  <button type="button" disabled={idx === 0} onClick={() => moveArea(area.id, -1)} aria-label={`Move ${area.name} up`}>↑</button>
                  <button type="button" disabled={idx === activeAreas.length - 1} onClick={() => moveArea(area.id, 1)} aria-label={`Move ${area.name} down`}>↓</button>
                </div>
                {eligible ? (
                  confirmDeleteId === area.id ? (
                    <span className="orb-area-confirm-delete">
                      <span>Delete for good?</span>
                      <button type="button" className="orb-btn orb-area-confirm-yes" onClick={() => doDelete(area.id)}>Yes</button>
                      <button type="button" className="orb-btn" onClick={() => setConfirmDeleteId(null)}>No</button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="orb-btn orb-area-remove orb-area-remove-eligible"
                      onClick={() => setConfirmDeleteId(area.id)}
                      title="This area has no active projects or tasks — permanently deletes it (can't be undone)."
                    >
                      Delete
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className="orb-btn orb-area-remove"
                    onClick={() => archiveArea(area.id)}
                    title={`Has ${projectCount} project(s)/${taskCount} task(s) still active — archive instead of deleting`}
                  >
                    Archive instead
                  </button>
                )}
              </div>

              {expanded && (
                <AreaDetail
                  area={area}
                  projects={projects}
                  tasks={tasks}
                  trackers={trackers}
                  today={today}
                  addProject={addProject}
                  addTask={addTask}
                  addTracker={addTracker}
                  updateTracker={updateTracker}
                />
              )}
            </div>
          );
        })}
      </div>

      {archivedAreas.length > 0 && (
        <div className="orb-area-archived">
          <h3 className="orb-area-archived-h3">Archived</h3>
          {archivedAreas.map((area) => {
            const projectCount = projects.filter((p) => p.areaId === area.id).length;
            const taskCount = tasks.filter((t) => t.areaId === area.id).length;
            return (
              <div key={area.id} className="orb-row orb-area-row orb-area-row-archived">
                <span className="orb-chip-dot" style={{ background: area.color }} />
                <span className="orb-area-name">{area.name}</span>
                <span className="orb-area-counts">
                  {projectCount} project{projectCount === 1 ? '' : 's'} · {taskCount} task{taskCount === 1 ? '' : 's'}
                </span>
                <button type="button" className="orb-btn" onClick={() => updateArea(area.id, { archived: false })}>Restore</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
