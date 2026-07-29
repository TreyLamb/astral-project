import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { firstOpenDayFor } from '../calc/planner';
import { auth } from '../../../firebase';
import TaskRow from './TaskRow';
import TaskTypeFilter from './TaskTypeFilter';
import AreaSelect from './AreaSelect';
import AxisChips from './AxisChips';
import './TriageView.css';

const SWIPE_MIN_DISTANCE = 40;
// Axes start null, same as CaptureScreen — pre-filling 3 lets you click
// straight through triage and end up with four fabricated scores, which is
// exactly what triage exists to prevent.
const DEFAULT_TASK_DRAFT = {
  areaId: '', projectId: '', importance: null, urgency: null, difficulty: null, energy: null,
  timeMin: '', taskType: '', dueDate: '', scheduledDate: '', addToCalendar: false,
};

function timeAgo(ms) {
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// Triage queue + All-tasks toggle (§4.2 + #6). The queue serves one
// InboxItem at a time (oldest first) with t/p/r/d single-key actions that
// mirror TkbReview's keyboard + tap + swipe parity pattern; All tasks is the
// plain "dump everything and see it" list (T10).
export default function TriageView() {
  const orbit = useOrbit();
  const {
    inbox, tasks, projects, settings, mode, today, getDayPlan,
    addTask, addProject, updateInboxItem, removeTask, removeProject,
  } = orbit;
  const navigate = useNavigate();

  const capacityFor = (date) => {
    const plan = getDayPlan(date);
    return {
      timeMin: plan.capacityTimeMin ?? settings.capacityDefault.timeMin,
      energy: plan.capacityEnergy ?? settings.capacityDefault.energy,
    };
  };

  const [viewMode, setViewMode] = useState('queue'); // 'queue' | 'all'
  const [formMode, setFormMode] = useState(null); // null | 'task' | 'project'
  const [taskDraft, setTaskDraft] = useState(DEFAULT_TASK_DRAFT);
  const [projectName, setProjectName] = useState('');
  const [projectAreaId, setProjectAreaId] = useState('');
  const [triageLog, setTriageLog] = useState([]); // this-session-only undo stack
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { kind: 'success' | 'info' | 'error', text } | null

  const touchStartRef = useRef(null);

  const untriaged = useMemo(
    () => inbox.filter((i) => !i.triaged).sort((a, b) => a.createdAt - b.createdAt),
    [inbox],
  );
  const current = untriaged[0] || null;

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
    let sched = taskDraft.scheduledDate || null;
    if (taskDraft.addToCalendar && !sched) {
      const scheduledTasks = tasks.filter((t) => t.scheduledDate && t.status !== 'done' && t.status !== 'killed');
      sched = firstOpenDayFor(
        // Day-fitting needs a number; an unscored task is assumed average
        // rather than free. Local to this placement — nothing is persisted.
        { timeMin: taskDraft.timeMin === '' ? null : Number(taskDraft.timeMin), energy: taskDraft.energy ?? 3 },
        scheduledTasks, today, 60, capacityFor,
      );
    }
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
      scheduledDate: sched,
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

  // AI cleanup (feature #5) — only meaningful signed in, since the endpoint
  // touches the caller's cloud inbox docs directly (see api/orbit-ai-triage.js);
  // the button itself is disabled+tooltipped for local/guest mode below.
  // Non-destructive on the server (it preserves aiOriginal per item), so no
  // revert UI here — ✂️ deferred, per the brief.
  const handleAiTidy = async () => {
    if (mode !== 'cloud' || aiBusy) return;
    setAiBusy(true);
    setAiResult(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/orbit-ai-triage', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) {
        let text = res.status === 401
          ? 'Sign-in expired — refresh and try again.'
          : `AI cleanup failed (server error ${res.status}).`;
        try {
          const body = await res.json();
          if (body?.error) text = body.error;
        } catch { /* body wasn't JSON — keep the generic message */ }
        setAiResult({ kind: 'error', text });
        return;
      }
      const data = await res.json();
      if (data.note) {
        setAiResult({ kind: 'info', text: data.note });
      } else {
        const errCount = Array.isArray(data.errors) ? data.errors.length : 0;
        setAiResult({
          kind: 'success',
          text: `Tidied ${data.cleaned} item${data.cleaned === 1 ? '' : 's'}`
            + (data.skipped ? ` (${data.skipped} skipped)` : '')
            + (errCount ? ` — ${errCount} error${errCount === 1 ? '' : 's'}` : '') + '.',
        });
      }
      if (data.cleaned > 0) {
        if (typeof orbit.reload === 'function') await orbit.reload();
        else window.location.reload();
      }
    } catch {
      setAiResult({ kind: 'error', text: 'AI cleanup failed — check your connection and try again.' });
    } finally {
      setAiBusy(false);
    }
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

      {viewMode === 'queue' && (
        <p className="orb-triage-intro">
          This sorts the quick notes you dropped via <strong>＋ Capture</strong> — decide what each one becomes:
          {' '}<strong>Task</strong>, <strong>Project</strong>, <strong>Reference</strong>, or <strong>Discard</strong>.
          Want a fully-detailed task right now? Use <strong>＋ Add Task</strong> instead.
        </p>
      )}

      <div className="orb-triage-ai-row">
        <button
          type="button"
          className="orb-btn orb-triage-ai-btn"
          onClick={handleAiTidy}
          disabled={mode !== 'cloud' || aiBusy}
          title={mode !== 'cloud' ? 'Sign in to use AI cleanup' : undefined}
        >
          {aiBusy ? 'Tidying…' : '✨ Tidy inbox with AI'}
        </button>
        {aiResult && (
          <span className={`orb-triage-ai-result orb-triage-ai-result-${aiResult.kind}`}>{aiResult.text}</span>
        )}
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
                  <AreaSelect
                    value={taskDraft.areaId}
                    onChange={(areaId) => setTaskDraft((d) => ({ ...d, areaId, projectId: '' }))}
                    includeNone
                    noneLabel="— choose —"
                  />
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
                <label className="orb-triage-calcheck">
                  <input
                    type="checkbox"
                    checked={taskDraft.addToCalendar}
                    onChange={(e) => setTaskDraft((d) => ({ ...d, addToCalendar: e.target.checked }))}
                  />
                  <span>📅 Add to calendar {taskDraft.scheduledDate ? '(on the scheduled date above)' : '— auto-pick the next open day'}</span>
                </label>
                <AxisChips
                  axes={taskDraft}
                  onChange={(key, n) => setTaskDraft((d) => ({ ...d, [key]: n }))}
                />
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
                  <AreaSelect
                    value={projectAreaId}
                    onChange={setProjectAreaId}
                    includeNone
                    noneLabel="— choose —"
                  />
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
