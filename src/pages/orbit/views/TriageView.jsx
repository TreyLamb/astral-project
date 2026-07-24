import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import TaskRow from './TaskRow';
import TaskTypeFilter from './TaskTypeFilter';
import './TriageView.css';

const SWIPE_MIN_DISTANCE = 40;
const DEFAULT_TASK_DRAFT = {
  areaId: '', projectId: '', importance: 3, urgency: 3, difficulty: 3, energy: 3,
  timeMin: '', taskType: '', dueDate: '', scheduledDate: '',
};

function timeAgo(ms) {
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// 1-5 segmented control — duplicated from CaptureScreen's (small,
// single-purpose, and neither view is chartered to own a shared file for it).
function AxisStepper({ label, value, onChange }) {
  return (
    <div className="orb-axis-field">
      <span className="orb-axis-label">{label}</span>
      <div className="orb-axis-seg" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`orb-axis-btn${value === n ? ' active' : ''}`}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// Triage queue + All-tasks toggle (§4.2 + #6). The queue serves one
// InboxItem at a time (oldest first) with t/p/r/d single-key actions that
// mirror TkbReview's keyboard + tap + swipe parity pattern; All tasks is the
// plain "dump everything and see it" list (T10).
export default function TriageView() {
  const {
    inbox, tasks, areas, projects, settings,
    addTask, addProject, updateInboxItem, removeTask, removeProject,
  } = useOrbit();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('queue'); // 'queue' | 'all'
  const [formMode, setFormMode] = useState(null); // null | 'task' | 'project'
  const [taskDraft, setTaskDraft] = useState(DEFAULT_TASK_DRAFT);
  const [projectName, setProjectName] = useState('');
  const [projectAreaId, setProjectAreaId] = useState('');
  const [triageLog, setTriageLog] = useState([]); // this-session-only undo stack
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const touchStartRef = useRef(null);

  const untriaged = useMemo(
    () => inbox.filter((i) => !i.triaged).sort((a, b) => a.createdAt - b.createdAt),
    [inbox],
  );
  const current = untriaged[0] || null;
  const openAreas = useMemo(() => areas.filter((a) => !a.archived), [areas]);

  const allFilteredTasks = useMemo(() => tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (typeFilter === TaskTypeFilter.UNTYPED) return !t.taskType;
    if (typeFilter) return t.taskType === typeFilter;
    return true;
  }), [tasks, statusFilter, typeFilter]);

  // Whenever the queue advances to a new item, close out any inline form
  // left open from the previous one and re-seed the project-name default.
  // Compare-and-reset in render (same pattern as OrbitApp.jsx's nav drawer)
  // instead of an effect, so this doesn't cost an extra render.
  const [formResetForId, setFormResetForId] = useState(current?.id ?? null);
  if ((current?.id ?? null) !== formResetForId) {
    setFormResetForId(current?.id ?? null);
    setFormMode(null);
    setTaskDraft(DEFAULT_TASK_DRAFT);
    setProjectName(current ? current.rawText : '');
    setProjectAreaId('');
  }

  const pushLog = (entry) => setTriageLog((log) => [...log, entry]);

  const openTaskForm = () => { if (current) setFormMode('task'); };
  const openProjectForm = () => { if (current) setFormMode('project'); };
  const closeForm = () => { setFormMode(null); setTaskDraft(DEFAULT_TASK_DRAFT); };

  const confirmTask = async () => {
    if (!current || !taskDraft.areaId) return;
    const task = await addTask({
      title: current.rawText,
      areaId: taskDraft.areaId,
      projectId: taskDraft.projectId || null,
      importance: taskDraft.importance,
      urgency: taskDraft.urgency,
      difficulty: taskDraft.difficulty,
      energy: taskDraft.energy,
      timeMin: taskDraft.timeMin === '' ? null : Number(taskDraft.timeMin),
      taskType: taskDraft.taskType || null,
      dueDate: taskDraft.dueDate || null,
      scheduledDate: taskDraft.scheduledDate || null,
    });
    await updateInboxItem(current.id, { triaged: true, outcome: 'task', resultId: task.id });
    pushLog({ itemId: current.id, outcome: 'task', resultId: task.id });
  };

  const confirmProject = async () => {
    if (!current || !projectAreaId) return;
    const name = projectName.trim() || current.rawText;
    const project = await addProject({ areaId: projectAreaId, name });
    await updateInboxItem(current.id, { triaged: true, outcome: 'project', resultId: project.id });
    pushLog({ itemId: current.id, outcome: 'project', resultId: project.id });
  };

  const handleReference = () => {
    if (!current) return;
    // No Reference Vault yet (lands Phase 2) — clear the item so the queue
    // moves on; see the note rendered next to the button below.
    updateInboxItem(current.id, { triaged: true, outcome: 'reference' });
    pushLog({ itemId: current.id, outcome: 'reference', resultId: null });
  };

  const handleDiscard = () => {
    if (!current) return;
    updateInboxItem(current.id, { triaged: true, outcome: 'discarded', discardedAt: Date.now() });
    pushLog({ itemId: current.id, outcome: 'discarded', resultId: null });
  };

  const handleUndo = async () => {
    const last = triageLog[triageLog.length - 1];
    if (!last) return;
    if (last.outcome === 'task' && last.resultId) await removeTask(last.resultId);
    if (last.outcome === 'project' && last.resultId) await removeProject(last.resultId);
    await updateInboxItem(last.itemId, { triaged: false, outcome: null, resultId: null, discardedAt: null });
    setTriageLog((log) => log.slice(0, -1));
  };

  // Keyboard: t/p/r/d/u act on the queue item, Esc closes an open inline
  // form first and only leaves the queue (back to Today) once none is open —
  // same "innermost thing first" precedent as TkbReview's Escape handling.
  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (viewMode !== 'queue') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (formMode) closeForm(); else navigate('/orbit');
        return;
      }

      if (!current || formMode) return;

      const k = e.key.toLowerCase();
      if (k === 't') { e.preventDefault(); openTaskForm(); }
      else if (k === 'p') { e.preventDefault(); openProjectForm(); }
      else if (k === 'r') { e.preventDefault(); handleReference(); }
      else if (k === 'd') { e.preventDefault(); handleDiscard(); }
      else if (k === 'u') { e.preventDefault(); handleUndo(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, formMode, current, triageLog]);

  // Touch/swipe: the mobile-native equivalent of t/p/r/d, not just smaller
  // on-screen buttons — disabled while an inline form is open (its own
  // inputs need normal touch behavior).
  function handleTouchStart(e) {
    const t = e.changedTouches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }
  function handleTouchEnd(e) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !current || formMode) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < SWIPE_MIN_DISTANCE) return; // tap or jitter — buttons already cover the tap case

    if (absDx > absDy) {
      if (dx > 0) openTaskForm(); else handleDiscard();
    } else if (dy < 0) {
      openProjectForm();
    } else {
      handleReference();
    }
  }

  return (
    <div className="orb-triage">
      <div className="orb-triage-toggle" role="tablist" aria-label="Triage view">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'queue'}
          className={`orb-tab${viewMode === 'queue' ? ' active' : ''}`}
          onClick={() => setViewMode('queue')}
        >
          Triage queue{untriaged.length > 0 ? ` (${untriaged.length})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'all'}
          className={`orb-tab${viewMode === 'all' ? ' active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All tasks
        </button>
      </div>

      {viewMode === 'queue' && (current ? (
        <div className="orb-triage-card-wrap">
          <div
            className="orb-card orb-triage-card"
            onTouchStart={formMode ? undefined : handleTouchStart}
            onTouchEnd={formMode ? undefined : handleTouchEnd}
          >
            <div className="orb-triage-meta">
              <span>{timeAgo(current.createdAt)}</span>
              {untriaged.length > 1 && <span>{untriaged.length - 1} more waiting</span>}
            </div>
            <div className="orb-triage-text">{current.rawText}</div>

            {formMode === null && (
              <>
                <div className="orb-triage-actions">
                  <button type="button" className="orb-btn orb-btn-primary" onClick={openTaskForm}>
                    <kbd>T</kbd> Task
                  </button>
                  <button type="button" className="orb-btn" onClick={openProjectForm}>
                    <kbd>P</kbd> Project
                  </button>
                  <button type="button" className="orb-btn" onClick={handleReference}>
                    <kbd>R</kbd> Reference
                  </button>
                  <button type="button" className="orb-btn" onClick={handleDiscard}>
                    <kbd>D</kbd> Discard
                  </button>
                </div>
                <div className="orb-triage-note">
                  Reference Vault isn't built yet (Phase 2) — Reference just clears this item for now.
                </div>
              </>
            )}

            {formMode === 'task' && (
              <div className="orb-triage-form">
                <label className="orb-triage-field">
                  <span>Area *</span>
                  <select
                    value={taskDraft.areaId}
                    onChange={(e) => setTaskDraft((d) => ({ ...d, areaId: e.target.value, projectId: '' }))}
                  >
                    <option value="">— choose —</option>
                    {openAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
                <label className="orb-triage-field">
                  <span>Project</span>
                  <select
                    value={taskDraft.projectId}
                    onChange={(e) => setTaskDraft((d) => ({ ...d, projectId: e.target.value }))}
                    disabled={!taskDraft.areaId}
                  >
                    <option value="">— none —</option>
                    {projects
                      .filter((p) => p.areaId === taskDraft.areaId && p.status !== 'archived')
                      .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="orb-triage-field">
                  <span>Type</span>
                  <select
                    value={taskDraft.taskType}
                    onChange={(e) => setTaskDraft((d) => ({ ...d, taskType: e.target.value }))}
                  >
                    <option value="">— none —</option>
                    {settings.taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="orb-triage-field">
                  <span>Time (min)</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={taskDraft.timeMin}
                    onChange={(e) => setTaskDraft((d) => ({ ...d, timeMin: e.target.value }))}
                    placeholder="any"
                  />
                </label>
                <label className="orb-triage-field">
                  <span>Due date</span>
                  <input
                    type="date"
                    value={taskDraft.dueDate}
                    onChange={(e) => setTaskDraft((d) => ({ ...d, dueDate: e.target.value }))}
                  />
                </label>
                <label className="orb-triage-field">
                  <span>Scheduled date</span>
                  <input
                    type="date"
                    value={taskDraft.scheduledDate}
                    onChange={(e) => setTaskDraft((d) => ({ ...d, scheduledDate: e.target.value }))}
                  />
                </label>
                <AxisStepper label="Importance" value={taskDraft.importance} onChange={(n) => setTaskDraft((d) => ({ ...d, importance: n }))} />
                <AxisStepper label="Urgency" value={taskDraft.urgency} onChange={(n) => setTaskDraft((d) => ({ ...d, urgency: n }))} />
                <AxisStepper label="Difficulty" value={taskDraft.difficulty} onChange={(n) => setTaskDraft((d) => ({ ...d, difficulty: n }))} />
                <AxisStepper label="Energy" value={taskDraft.energy} onChange={(n) => setTaskDraft((d) => ({ ...d, energy: n }))} />
                <div className="orb-triage-form-actions">
                  <button type="button" className="orb-btn" onClick={closeForm}>Cancel</button>
                  <button type="button" className="orb-btn orb-btn-primary" disabled={!taskDraft.areaId} onClick={confirmTask}>
                    Create Task
                  </button>
                </div>
              </div>
            )}

            {formMode === 'project' && (
              <div className="orb-triage-form">
                <label className="orb-triage-field">
                  <span>Area *</span>
                  <select value={projectAreaId} onChange={(e) => setProjectAreaId(e.target.value)}>
                    <option value="">— choose —</option>
                    {openAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
                <label className="orb-triage-field">
                  <span>Name</span>
                  <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </label>
                <div className="orb-triage-form-actions">
                  <button type="button" className="orb-btn" onClick={closeForm}>Cancel</button>
                  <button type="button" className="orb-btn orb-btn-primary" disabled={!projectAreaId} onClick={confirmProject}>
                    Create Project
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="orb-triage-footer">
            <button type="button" className="orb-btn orb-triage-undo" onClick={handleUndo} disabled={triageLog.length === 0}>
              <kbd>U</kbd> Undo last
            </button>
            <div className="orb-triage-legend">
              <span><kbd>Esc</kbd> {formMode ? 'cancel' : 'back to Today'}</span>
              <span>Swipe → Task · ← Discard · ↑ Project · ↓ Reference</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="orb-triage-zero">
          <div className="orb-triage-zero-icon">✓</div>
          <div>Inbox zero — nothing to triage.</div>
        </div>
      ))}

      {viewMode === 'all' && (
        <div className="orb-triage-all">
          <TaskTypeFilter taskTypes={settings.taskTypes} value={typeFilter} onChange={setTypeFilter} />
          <div className="orb-triage-status-filter">
            {['all', 'todo', 'doing', 'done'].map((s) => (
              <button
                key={s}
                type="button"
                className={`orb-chip orb-status-chip${statusFilter === s ? ' active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="orb-triage-list">
            {allFilteredTasks.length === 0 ? (
              <div className="orb-triage-empty">No tasks match this filter.</div>
            ) : (
              allFilteredTasks.map((t) => <TaskRow key={t.id} task={t} showProject />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
