import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { firstOpenDayFor } from '../calc/planner';
import { isUnscored } from '../calc/priority';
import { defaultAreaId } from '../orbitConfig';
import { auth } from '../../../firebase';
import TaskRow from './TaskRow';
import TaskTypeFilter from './TaskTypeFilter';
import AreaSelect from './AreaSelect';
import AxisChips from './AxisChips';
import CollapsedField from './CollapsedField';
import './TriageView.css';

// Axes start null, same as CaptureScreen — pre-filling 3 lets you click
// straight through triage and end up with four fabricated scores, which is
// exactly what triage exists to prevent.
const AXIS_KEYS = ['importance', 'urgency', 'difficulty', 'energy'];
const EMPTY_AXES = { importance: null, urgency: null, difficulty: null, energy: null };

const DEFAULT_TASK_DRAFT = {
  areaId: '', parentTaskId: '', isThought: false, isProject: false, ...EMPTY_AXES,
  timeMin: '', dueDate: '', scheduledDate: '', addToCalendar: false,
};

function timeAgo(ms) {
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// Triage queue + All-tasks toggle (§4.2 + #6). The queue serves one captured
// note at a time (oldest first), straight into the same score+label form —
// no "what type of thing is this" gate first. Discard is a small side action,
// not one of several equal-weight primary choices. All tasks is the plain
// "dump everything and see it" list (T10).
export default function TriageView() {
  const orbit = useOrbit();
  const {
    inbox, tasks, areas, settings, mode, today, getDayPlan,
    addTask, updateTask, updateInboxItem, removeTask,
  } = orbit;
  const navigate = useNavigate();

  // Session-local so an item you can't finish right now doesn't wedge the
  // head of the queue forever. Deliberately not persisted — next session
  // it's back. Shared between inbox items and unscored tasks — ids from
  // newId() are unique across both, so one Set is safe.
  const [skipped, setSkipped] = useState(() => new Set());

  const capacityFor = (date) => {
    const plan = getDayPlan(date);
    return {
      timeMin: plan.capacityTimeMin ?? settings.capacityDefault.timeMin,
      energy: plan.capacityEnergy ?? settings.capacityDefault.energy,
    };
  };

  const [viewMode, setViewMode] = useState('queue'); // 'queue' | 'all'
  const [taskDraft, setTaskDraft] = useState(DEFAULT_TASK_DRAFT);
  // Collapsed by default, same as CaptureScreen — re-collapses on every new
  // queue item so they don't stay pinned open across items.
  const [parentOpen, setParentOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [triageLog, setTriageLog] = useState([]); // this-session-only undo stack
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all'); // 'all' | 'scored' | 'unscored' — #6, so triaged items are actually listable
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { kind: 'success' | 'info' | 'error', text } | null

  const untriaged = useMemo(
    () => inbox.filter((i) => !i.triaged && !skipped.has(i.id)).sort((a, b) => a.createdAt - b.createdAt),
    [inbox, skipped],
  );
  const current = untriaged[0] || null;

  // Triage is defined by ABSENCE OF A SCORE, not by a flag. A task created
  // with an Area but no axes is untriaged by definition, so it belongs in this
  // queue — otherwise it's stored honestly as unscored and then never
  // resurfaces anywhere. Captured notes drain first: they still have to become
  // something, whereas these already exist and only need numbers.
  const unscoredTasks = useMemo(
    () => tasks
      .filter((t) => t.status !== 'done' && t.status !== 'killed'
        && !skipped.has(t.id) && isUnscored(t))
      .sort((a, b) => a.createdAt - b.createdAt),
    [tasks, skipped],
  );
  const currentTask = current ? null : (unscoredTasks[0] || null);
  const queueCount = untriaged.length + unscoredTasks.length;

  // Seed the score draft from whatever the task already has, so a partially
  // scored task doesn't lose the axes it does have.
  const [scoreForId, setScoreForId] = useState(null);
  const [scoreDraft, setScoreDraft] = useState({ ...EMPTY_AXES, isThought: false, isProject: false });
  if ((currentTask?.id ?? null) !== scoreForId) {
    setScoreForId(currentTask?.id ?? null);
    setScoreDraft(currentTask ? {
      importance: currentTask.importance,
      urgency: currentTask.urgency,
      difficulty: currentTask.difficulty,
      energy: currentTask.energy,
      isThought: currentTask.isThought,
      isProject: currentTask.isProject,
    } : { ...EMPTY_AXES, isThought: false, isProject: false });
  }

  const scoreComplete = AXIS_KEYS.every((k) => scoreDraft[k] != null);

  const saveScores = async () => {
    if (!currentTask || !scoreComplete) return;
    await updateTask(currentTask.id, { ...scoreDraft });
  };

  const allFilteredTasks = useMemo(() => tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (scoreFilter === 'scored' && isUnscored(t)) return false;
    if (scoreFilter === 'unscored' && !isUnscored(t)) return false;
    if (typeFilter === TaskTypeFilter.UNTYPED) return !t.taskType;
    if (typeFilter) return t.taskType === typeFilter;
    return true;
  }), [tasks, statusFilter, scoreFilter, typeFilter]);

  // Whenever the queue advances to a new item, reset the draft form left over
  // from the previous one. Compare-and-reset in render (same pattern as
  // OrbitApp.jsx's nav drawer) instead of an effect, so this doesn't cost an
  // extra render.
  const [formResetForId, setFormResetForId] = useState(current?.id ?? null);
  if ((current?.id ?? null) !== formResetForId) {
    setFormResetForId(current?.id ?? null);
    setTaskDraft(DEFAULT_TASK_DRAFT);
    setParentOpen(false);
    setAreaOpen(false);
  }

  const pushLog = (entry) => setTriageLog((log) => [...log, entry]);

  const confirmTask = async () => {
    // Area is NOT required — a title is the whole bar. Without scores this just
    // stays in the queue as an unscored task instead of leaving the queue.
    if (!current) return;
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
      parentTaskId: taskDraft.parentTaskId || null,
      isThought: taskDraft.isThought,
      isProject: taskDraft.isProject,
      importance: taskDraft.importance,
      urgency: taskDraft.urgency,
      difficulty: taskDraft.difficulty,
      energy: taskDraft.energy,
      timeMin: taskDraft.timeMin === '' ? null : Number(taskDraft.timeMin),
      dueDate: taskDraft.dueDate || null,
      scheduledDate: sched,
    });
    await updateInboxItem(current.id, { triaged: true, outcome: 'task', resultId: task.id });
    pushLog({ itemId: current.id, outcome: 'task', resultId: task.id });
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

  // Keyboard: d discards the current item, u undoes the last action, Esc
  // leaves the queue (back to Today). No t/p/r — there's no longer a
  // separate "what type of thing is this" step to key through.
  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (viewMode !== 'queue') return;

      if (e.key === 'Escape') { e.preventDefault(); navigate('/orbit'); return; }
      if (!current) return;

      const k = e.key.toLowerCase();
      if (k === 'd') { e.preventDefault(); handleDiscard(); }
      else if (k === 'u') { e.preventDefault(); handleUndo(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, current, triageLog]);

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
          Triage queue{queueCount > 0 ? ` (${queueCount})` : ''}
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
          Anything without a score lands here, one at a time. First the quick notes you dropped via{' '}
          <strong>＋ Capture</strong>, then any task that exists but was never scored. Set the axes, add any labels
          that apply, and it's done — <strong>Discard</strong> is down by Undo if you don't want it at all.
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
          {aiBusy ? 'Tidying…' : '✨ Tidy queue with AI'}
        </button>
        {aiResult && (
          <span className={`orb-triage-ai-result orb-triage-ai-result-${aiResult.kind}`}>{aiResult.text}</span>
        )}
      </div>

      {viewMode === 'queue' && (current ? (
        <div className="orb-triage-card-wrap">
          <div className="orb-card orb-triage-card">
            <div className="orb-triage-meta">
              <span>{timeAgo(current.createdAt)}</span>
              {untriaged.length > 1 && <span>{untriaged.length - 1} more waiting</span>}
            </div>
            <div className="orb-triage-text">{current.rawText}</div>

            <div className="orb-triage-form">
              <AxisChips
                variant="cards"
                axes={taskDraft}
                onChange={(key, n) => setTaskDraft((d) => ({ ...d, [key]: n }))}
                toggles={{
                  isThought: taskDraft.isThought,
                  isProject: taskDraft.isProject,
                  onToggle: (key, v) => setTaskDraft((d) => ({ ...d, [key]: v })),
                }}
              />
              <CollapsedField
                label="Parent"
                valueLabel={tasks.find((t) => t.id === taskDraft.parentTaskId)?.title ?? 'none'}
                open={parentOpen}
                onOpen={() => setParentOpen(true)}
              >
                <select
                  value={taskDraft.parentTaskId}
                  onChange={(e) => setTaskDraft((d) => ({ ...d, parentTaskId: e.target.value }))}
                >
                  <option value="">— none —</option>
                  {tasks
                    .filter((t) => t.isProject && t.status !== 'done' && t.status !== 'killed')
                    .map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </CollapsedField>
              <CollapsedField
                label="Area"
                valueLabel={areas.find((a) => a.id === (taskDraft.areaId || defaultAreaId(areas)))?.name ?? 'none'}
                open={areaOpen}
                onOpen={() => setAreaOpen(true)}
              >
                <AreaSelect
                  value={taskDraft.areaId || defaultAreaId(areas) || ''}
                  onChange={(areaId) => setTaskDraft((d) => ({ ...d, areaId }))}
                />
              </CollapsedField>
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
              <div className="orb-triage-form-actions">
                <button
                  type="button"
                  className="orb-btn"
                  onClick={() => setSkipped((s) => new Set(s).add(current.id))}
                >
                  Skip for now
                </button>
                <button type="button" className="orb-btn orb-btn-primary" onClick={confirmTask}>
                  Save &amp; Next
                </button>
              </div>
            </div>
          </div>

          <div className="orb-triage-footer">
            <div className="orb-triage-footer-row">
              <button type="button" className="orb-btn orb-triage-undo" onClick={handleUndo} disabled={triageLog.length === 0}>
                <kbd>U</kbd> Undo last
              </button>
              <button type="button" className="orb-triage-discard" onClick={handleDiscard}>
                <kbd>D</kbd> Discard
              </button>
            </div>
            <div className="orb-triage-legend">
              <span><kbd>Esc</kbd> back to Today</span>
            </div>
          </div>
        </div>
      ) : currentTask ? (
        <div className="orb-triage-card-wrap">
          <div className="orb-card orb-triage-card">
            <div className="orb-triage-meta">
              <span>needs scoring</span>
              {unscoredTasks.length > 1 && <span>{unscoredTasks.length - 1} more waiting</span>}
            </div>
            <div className="orb-triage-text">{currentTask.title}</div>

            <div className="orb-triage-note">
              Already a task — it just has no score yet. Set all four to finish triaging it.
            </div>

            <AxisChips
              variant="cards"
              axes={scoreDraft}
              onChange={(key, n) => setScoreDraft((d) => ({ ...d, [key]: n }))}
              toggles={{
                isThought: scoreDraft.isThought,
                isProject: scoreDraft.isProject,
                onToggle: (key, v) => setScoreDraft((d) => ({ ...d, [key]: v })),
              }}
            />

            <div className="orb-triage-form-actions">
              <button
                type="button"
                className="orb-btn"
                onClick={() => setSkipped((s) => new Set(s).add(currentTask.id))}
              >
                Skip for now
              </button>
              <button
                type="button"
                className="orb-btn orb-btn-primary"
                disabled={!scoreComplete}
                onClick={saveScores}
              >
                Save scores
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="orb-triage-zero">
          <div className="orb-triage-zero-icon">✓</div>
          <div>Queue clear — nothing to triage.</div>
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
          {/* #6 — so triaged (scored) items are actually listable, not just
              inferable from the absence of a triage-queue entry. */}
          <div className="orb-triage-status-filter">
            {[['all', 'All'], ['scored', 'Scored'], ['unscored', 'Unscored']].map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`orb-chip orb-status-chip${scoreFilter === v ? ' active' : ''}`}
                onClick={() => setScoreFilter(v)}
              >
                {label}
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
