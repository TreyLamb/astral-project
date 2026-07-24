import { useState } from 'react';
import { useOrbit } from '../orbitContext';
import { DEFAULT_TASK_TYPES } from '../orbitConfig';
import { occurrencesBetween } from '../calc/recurrence';
import './RecurringView.css';

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'interval', label: 'Every N days' },
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PREVIEW_WINDOW_DAYS = 60;
const PREVIEW_COUNT = 5;

// Small local date-math helper — occurrencesBetween/datesToGenerate live in
// calc/recurrence.js (not ours to edit) and don't export an addDays; this
// mirrors its own private one just for building the preview window.
function addDaysISO(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function freqSummary(rule) {
  switch (rule.freq) {
    case 'daily': return 'Daily';
    case 'weekly': {
      if (!rule.weekdays || rule.weekdays.length === 0) return 'Weekly — no days picked';
      return `Weekly: ${rule.weekdays.slice().sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join(', ')}`;
    }
    case 'monthly': return `Monthly: day ${rule.dayOfMonth}`;
    case 'interval': return `Every ${rule.interval} day${rule.interval === 1 ? '' : 's'}`;
    default: return rule.freq;
  }
}

// Draft fields always use '' as the "nothing chosen" sentinel (matches every
// <select>'s value=), converted to null only at submit time by normalizeDraft
// — keeps every field a plain controlled string/number while being edited.
function blankDraft(today) {
  return {
    title: '', areaId: '', projectId: '', taskType: '',
    importance: 3, urgency: 3, timeMin: '', difficulty: 3, energy: 3,
    freq: 'daily', interval: 1, weekdays: [], dayOfMonth: 1,
    anchorDate: today, active: true,
  };
}

function draftFromRule(rule) {
  return {
    title: rule.title, areaId: rule.areaId || '', projectId: rule.projectId || '', taskType: rule.taskType || '',
    importance: rule.importance, urgency: rule.urgency, timeMin: rule.timeMin ?? '',
    difficulty: rule.difficulty, energy: rule.energy,
    freq: rule.freq, interval: rule.interval, weekdays: rule.weekdays || [], dayOfMonth: rule.dayOfMonth,
    anchorDate: rule.anchorDate, active: rule.active,
  };
}

function normalizeDraft(draft, today) {
  return {
    title: draft.title.trim(),
    areaId: draft.areaId || null,
    projectId: draft.projectId || null,
    taskType: draft.taskType || null,
    importance: draft.importance,
    urgency: draft.urgency,
    timeMin: draft.timeMin === '' ? null : Math.max(0, parseInt(draft.timeMin, 10) || 0),
    difficulty: draft.difficulty,
    energy: draft.energy,
    freq: draft.freq,
    interval: Math.max(1, parseInt(draft.interval, 10) || 1),
    weekdays: draft.weekdays || [],
    dayOfMonth: Math.min(31, Math.max(1, parseInt(draft.dayOfMonth, 10) || 1)),
    anchorDate: draft.anchorDate || today,
    active: draft.active,
  };
}

function RuleAxisStepper({ label, value, onChange }) {
  return (
    <div className="orb-rv-axis">
      <span className="orb-rv-axis-label">{label}</span>
      <div className="orb-rv-axis-btns" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`orb-rv-axis-btn${value === n ? ' active' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function WeekdayPicker({ value, onChange }) {
  const selected = value || [];
  const toggle = (idx) => {
    onChange(selected.includes(idx) ? selected.filter((d) => d !== idx) : [...selected, idx].sort((a, b) => a - b));
  };
  return (
    <div className="orb-rv-weekdays" role="group" aria-label="Weekdays">
      {WEEKDAY_LABELS.map((label, idx) => (
        <button
          key={label}
          type="button"
          className={`orb-rv-weekday-btn${selected.includes(idx) ? ' active' : ''}`}
          aria-pressed={selected.includes(idx)}
          onClick={() => toggle(idx)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Live preview, fed straight off the in-progress draft (or a saved rule) so
// the "when will this actually fire" question is answered before commit.
function NextOccurrences({ rule, today }) {
  if (!rule.active) {
    return <div className="orb-rv-preview orb-rv-preview-note">Paused — won't generate new instances until reactivated.</div>;
  }
  const previewRule = { ...rule, dayOfMonth: Number(rule.dayOfMonth) || 1, interval: Number(rule.interval) || 1 };
  const horizon = addDaysISO(today, PREVIEW_WINDOW_DAYS);
  const dates = occurrencesBetween(previewRule, today, horizon).slice(0, PREVIEW_COUNT);
  if (dates.length === 0) {
    const hint = rule.freq === 'weekly' && (!rule.weekdays || rule.weekdays.length === 0) ? ' — pick at least one weekday' : '';
    return <div className="orb-rv-preview orb-rv-preview-note">No occurrences in the next {PREVIEW_WINDOW_DAYS} days{hint}.</div>;
  }
  return (
    <div className="orb-rv-preview">
      <span className="orb-rv-preview-label">Next</span>
      <div className="orb-rv-preview-chips">
        {dates.map((d) => <span key={d} className="orb-chip orb-rv-preview-chip">{d}</span>)}
      </div>
    </div>
  );
}

// The full field set, shared by both "new rule" and "edit rule" — each one
// holds its own local draft and only calls addRecurrenceRule/updateRecurrenceRule
// on explicit Save/Create (mirrors TriageView's inline task-creation form,
// not TaskEditor's per-field-immediate style — freq + its sub-field are
// interdependent, so a half-typed state genuinely isn't valid to persist yet).
function RuleForm({ draft, setDraft, areas, projects, taskTypes, today, onCancel, onSubmit, submitLabel }) {
  const field = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const areaOptions = areas.filter((a) => !a.archived || a.id === draft.areaId);
  const areaProjects = projects.filter((p) => p.areaId === draft.areaId && (p.status !== 'archived' || p.id === draft.projectId));

  return (
    <div className="orb-rv-form">
      <div className="orb-rv-form-grid">
        <label className="orb-rv-field orb-rv-field-wide">
          <span className="orb-rv-label">Title</span>
          <input
            className="orb-rv-input"
            type="text"
            value={draft.title}
            placeholder="What repeats…"
            autoFocus
            onChange={(e) => field({ title: e.target.value })}
          />
        </label>

        <label className="orb-rv-field">
          <span className="orb-rv-label">Area</span>
          <select className="orb-rv-select" value={draft.areaId} onChange={(e) => field({ areaId: e.target.value, projectId: '' })}>
            <option value="">— none —</option>
            {areaOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>

        <label className="orb-rv-field">
          <span className="orb-rv-label">Project</span>
          <select className="orb-rv-select" value={draft.projectId} disabled={!draft.areaId} onChange={(e) => field({ projectId: e.target.value })}>
            <option value="">— none —</option>
            {areaProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="orb-rv-field">
          <span className="orb-rv-label">Type</span>
          <select className="orb-rv-select" value={draft.taskType} onChange={(e) => field({ taskType: e.target.value })}>
            <option value="">— none —</option>
            {taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="orb-rv-field">
          <span className="orb-rv-label">Time (min)</span>
          <input
            className="orb-rv-input"
            type="number"
            min="0"
            placeholder="—"
            value={draft.timeMin}
            onChange={(e) => field({ timeMin: e.target.value })}
          />
        </label>

        <label className="orb-rv-field">
          <span className="orb-rv-label">Anchor date</span>
          <input className="orb-rv-input" type="date" value={draft.anchorDate} onChange={(e) => field({ anchorDate: e.target.value })} />
        </label>

        <RuleAxisStepper label="Importance" value={draft.importance} onChange={(n) => field({ importance: n })} />
        <RuleAxisStepper label="Urgency" value={draft.urgency} onChange={(n) => field({ urgency: n })} />
        <RuleAxisStepper label="Difficulty" value={draft.difficulty} onChange={(n) => field({ difficulty: n })} />
        <RuleAxisStepper label="Energy" value={draft.energy} onChange={(n) => field({ energy: n })} />
      </div>

      <div className="orb-rv-freq-block">
        <div className="orb-rv-freq-tabs" role="radiogroup" aria-label="Frequency">
          {FREQ_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={draft.freq === f.value}
              className={`orb-tab${draft.freq === f.value ? ' active' : ''}`}
              onClick={() => field({ freq: f.value })}
            >
              {f.label}
            </button>
          ))}
        </div>

        {draft.freq === 'weekly' && <WeekdayPicker value={draft.weekdays} onChange={(weekdays) => field({ weekdays })} />}
        {draft.freq === 'monthly' && (
          <label className="orb-rv-field orb-rv-field-inline">
            <span className="orb-rv-label">Day of month</span>
            <input
              className="orb-rv-input orb-rv-input-narrow"
              type="number"
              min="1"
              max="31"
              value={draft.dayOfMonth}
              onChange={(e) => field({ dayOfMonth: e.target.value })}
            />
          </label>
        )}
        {draft.freq === 'interval' && (
          <label className="orb-rv-field orb-rv-field-inline">
            <span className="orb-rv-label">Every</span>
            <input
              className="orb-rv-input orb-rv-input-narrow"
              type="number"
              min="1"
              value={draft.interval}
              onChange={(e) => field({ interval: e.target.value })}
            />
            <span className="orb-rv-unit">day(s)</span>
          </label>
        )}
      </div>

      <label className="orb-rv-active-toggle">
        <input type="checkbox" checked={draft.active} onChange={(e) => field({ active: e.target.checked })} />
        <span>Active</span>
      </label>

      <NextOccurrences rule={draft} today={today} />

      <div className="orb-rv-form-actions">
        <button type="button" className="orb-btn" onClick={onCancel}>Cancel</button>
        <button
          type="button"
          className="orb-btn orb-btn-primary"
          disabled={!draft.title.trim() || (draft.freq === 'weekly' && draft.weekdays.length === 0)}
          onClick={onSubmit}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export default function RecurringView() {
  const { recurrenceRules, areas, projects, settings, today, addRecurrenceRule, updateRecurrenceRule, removeRecurrenceRule } = useOrbit();

  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState(() => blankDraft(today));
  const [expandedId, setExpandedId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  const taskTypes = settings?.taskTypes?.length ? settings.taskTypes : DEFAULT_TASK_TYPES;
  const sortedRules = recurrenceRules.slice().sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return (a.title || '').localeCompare(b.title || '');
  });

  const openCreate = () => {
    setCreateDraft(blankDraft(today));
    setCreating(true);
    setExpandedId(null);
    setEditDraft(null);
  };
  const cancelCreate = () => setCreating(false);
  const submitCreate = () => {
    addRecurrenceRule(normalizeDraft(createDraft, today));
    setCreating(false);
  };

  const openEdit = (rule) => {
    setExpandedId(rule.id);
    setEditDraft(draftFromRule(rule));
    setCreating(false);
    setConfirmingDeleteId(null);
  };
  const closeEdit = () => { setExpandedId(null); setEditDraft(null); };
  const submitEdit = (id) => {
    updateRecurrenceRule(id, normalizeDraft(editDraft, today));
    closeEdit();
  };

  const toggleActive = (rule) => updateRecurrenceRule(rule.id, { active: !rule.active });

  const confirmDelete = (id) => {
    removeRecurrenceRule(id);
    setConfirmingDeleteId(null);
    if (expandedId === id) closeEdit();
  };

  return (
    <div className="orb-rv">
      <div className="orb-rv-head">
        <div>
          <h2 className="orb-rv-h2">Recurring tasks</h2>
          <p className="orb-rv-sub">
            Each rule generates a fresh task automatically the next time you open Orbit — catching up
            through today's date, nothing missed, nothing fired while the app was closed.
          </p>
        </div>
        {!creating && <button type="button" className="orb-btn orb-btn-primary" onClick={openCreate}>+ New rule</button>}
      </div>

      {creating && (
        <div className="orb-card orb-rv-create-card">
          <div className="orb-rv-card-title">New recurrence rule</div>
          <RuleForm
            draft={createDraft}
            setDraft={setCreateDraft}
            areas={areas}
            projects={projects}
            taskTypes={taskTypes}
            today={today}
            onCancel={cancelCreate}
            onSubmit={submitCreate}
            submitLabel="Create rule"
          />
        </div>
      )}

      {sortedRules.length === 0 && !creating ? (
        <div className="orb-rv-empty">No recurrence rules yet — a weekly review, a daily habit, a monthly bill all start here.</div>
      ) : (
        <div className="orb-rv-list">
          {sortedRules.map((rule) => {
            const area = areas.find((a) => a.id === rule.areaId);
            const expanded = expandedId === rule.id;
            const confirmingDelete = confirmingDeleteId === rule.id;

            return (
              <div key={rule.id} className="orb-rv-card">
                <div className={`orb-row orb-rv-row${!rule.active ? ' orb-rv-row-inactive' : ''}`}>
                  <button
                    type="button"
                    className={`orb-rv-expand${expanded ? ' active' : ''}`}
                    onClick={() => (expanded ? closeEdit() : openEdit(rule))}
                    aria-expanded={expanded}
                    aria-label={expanded ? `Collapse ${rule.title}` : `Edit ${rule.title}`}
                  >
                    {expanded ? '▾' : '▸'}
                  </button>

                  <div className="orb-rv-row-main">
                    <span className="orb-rv-row-title">{rule.title || <em>untitled</em>}</span>
                    <div className="orb-rv-row-meta">
                      <span className="orb-chip orb-rv-freq-chip">{freqSummary(rule)}</span>
                      {area && (
                        <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
                          <span className="orb-chip-dot" />{area.name}
                        </span>
                      )}
                      {!rule.active && <span className="orb-chip orb-rv-paused-chip">Paused</span>}
                    </div>
                  </div>

                  <label className="orb-rv-active-inline">
                    <input type="checkbox" checked={rule.active} onChange={() => toggleActive(rule)} />
                    <span>Active</span>
                  </label>

                  {confirmingDelete ? (
                    <span className="orb-rv-confirm-delete">
                      <span>Delete?</span>
                      <button type="button" className="orb-btn orb-rv-confirm-yes" onClick={() => confirmDelete(rule.id)}>Yes</button>
                      <button type="button" className="orb-btn" onClick={() => setConfirmingDeleteId(null)}>No</button>
                    </span>
                  ) : (
                    <button type="button" className="orb-btn orb-rv-delete" onClick={() => setConfirmingDeleteId(rule.id)}>Delete</button>
                  )}
                </div>

                {expanded && editDraft ? (
                  <div className="orb-rv-edit-wrap">
                    <RuleForm
                      draft={editDraft}
                      setDraft={setEditDraft}
                      areas={areas}
                      projects={projects}
                      taskTypes={taskTypes}
                      today={today}
                      onCancel={closeEdit}
                      onSubmit={() => submitEdit(rule.id)}
                      submitLabel="Save"
                    />
                  </div>
                ) : (
                  <div className="orb-rv-preview-wrap">
                    <NextOccurrences rule={rule} today={today} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
