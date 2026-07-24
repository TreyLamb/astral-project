import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { DEFAULT_TASK_TYPES } from '../orbitConfig';
import DependencyLinker from './DependencyLinker';
import SubtaskList from './SubtaskList';
import './TaskEditor.css';

const RATING_FIELDS = [
  { key: 'importance', label: 'Importance' },
  { key: 'urgency', label: 'Urgency' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'energy', label: 'Energy' },
];

// Kept light on purpose (contract: "deeper editing lives in RecurringView")
// — just enough to pick a cadence and confirm, not the full RecurrenceRule
// form (see RecurringView.jsx's RuleForm for that).
const RECUR_FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'interval', label: 'Every N days' },
];
const RECUR_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function RatingButtons({ label, value, onChange }) {
  return (
    <div className="orb-te-field orb-te-rating">
      <span className="orb-te-label">{label}</span>
      <div className="orb-te-rating-btns" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`orb-te-rating-btn${value === n ? ' active' : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// "Make this task repeat" — seeds a brand-new RecurrenceRule from the
// task's own fields (title/area/project/type/axes) plus a compact freq
// picker, then links the two (recurrenceId on the task). anchorDate is
// always today, not the task's own scheduledDate/dueDate: backdating it
// would make datesToGenerate() immediately backfill every occurrence between
// that date and today the next time the app opens, which is very much not
// what "start repeating from here" should do.
function RecurrenceAffordance({ task }) {
  const { addRecurrenceRule, updateTask, today } = useOrbit();
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState('daily');
  const [intervalDays, setIntervalDays] = useState(1);
  const [weekdays, setWeekdays] = useState([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);

  if (task.recurrenceId) {
    return (
      <div className="orb-te-recur orb-te-recur-linked">
        🔁 Repeats — manage in <Link to="/orbit/recurring" className="orb-te-recur-link">Recurring</Link>
      </div>
    );
  }

  const toggleWeekday = (idx) => {
    setWeekdays((w) => (w.includes(idx) ? w.filter((d) => d !== idx) : [...w, idx].sort((a, b) => a - b)));
  };

  const submit = async () => {
    const rule = await addRecurrenceRule({
      title: task.title,
      areaId: task.areaId,
      projectId: task.projectId,
      taskType: task.taskType,
      importance: task.importance,
      urgency: task.urgency,
      timeMin: task.timeMin,
      difficulty: task.difficulty,
      energy: task.energy,
      freq,
      interval: intervalDays,
      weekdays,
      dayOfMonth,
      anchorDate: today,
      active: true,
    });
    await updateTask(task.id, { recurrenceId: rule.id });
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className="orb-te-recur-btn" onClick={() => setOpen(true)}>
        🔁 Make repeating…
      </button>
    );
  }

  const disabled = freq === 'weekly' && weekdays.length === 0;

  return (
    <div className="orb-te-recur orb-te-recur-open">
      <div className="orb-te-recur-freqs" role="radiogroup" aria-label="Repeat frequency">
        {RECUR_FREQ_OPTIONS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={freq === f.value}
            className={`orb-te-recur-freq-btn${freq === f.value ? ' active' : ''}`}
            onClick={() => setFreq(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {freq === 'weekly' && (
        <div className="orb-te-recur-weekdays" role="group" aria-label="Weekdays">
          {RECUR_WEEKDAY_LABELS.map((label, idx) => (
            <button
              key={label}
              type="button"
              className={`orb-te-recur-weekday-btn${weekdays.includes(idx) ? ' active' : ''}`}
              aria-pressed={weekdays.includes(idx)}
              onClick={() => toggleWeekday(idx)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {freq === 'monthly' && (
        <label className="orb-te-recur-inline-field">
          <span>Day</span>
          <input
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
        </label>
      )}
      {freq === 'interval' && (
        <label className="orb-te-recur-inline-field">
          <span>Every</span>
          <input
            type="number"
            min="1"
            value={intervalDays}
            onChange={(e) => setIntervalDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
          <span>day(s)</span>
        </label>
      )}

      <div className="orb-te-recur-actions">
        <button type="button" className="orb-btn" onClick={() => setOpen(false)}>Cancel</button>
        <button type="button" className="orb-btn orb-btn-primary" disabled={disabled} onClick={submit}>Create rule</button>
      </div>
      <div className="orb-te-recur-hint">
        Deeper editing (area/project/axes/pause) lives in <Link to="/orbit/recurring" className="orb-te-recur-link">Recurring</Link>.
      </div>
    </div>
  );
}

// The shared expand-in-place editor — every task field lives here so Today,
// Triage, Areas, and Project views all get full editing for free just by
// dropping <TaskRow>'s expand chevron in (see TaskRow.jsx).
export default function TaskEditor({ task, depth = 0 }) {
  const { updateTask, areas, projects, settings } = useOrbit();
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [titleDirty, setTitleDirty] = useState(false);
  const [draftTimeMin, setDraftTimeMin] = useState(task.timeMin ?? '');
  const [timeDirty, setTimeDirty] = useState(false);

  const title = titleDirty ? draftTitle : task.title;
  const timeMinDisplay = timeDirty ? draftTimeMin : (task.timeMin ?? '');

  const commitTitle = () => {
    setTitleDirty(false);
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== task.title) updateTask(task.id, { title: trimmed });
  };

  const commitTimeMin = () => {
    setTimeDirty(false);
    const trimmed = String(draftTimeMin).trim();
    const next = trimmed === '' ? null : Math.max(0, parseInt(trimmed, 10) || 0);
    if (next !== task.timeMin) updateTask(task.id, { timeMin: next });
  };

  const onStatusChange = (status) => {
    const updates = { status };
    if (status === 'done' && task.status !== 'done') updates.completedAt = Date.now();
    if (status !== 'done' && task.completedAt) updates.completedAt = null;
    updateTask(task.id, updates);
  };

  // Changing Area drops the project if it no longer belongs to the new
  // Area — a task's project and area must stay consistent (§3.1: Project
  // belongs to exactly one Area).
  const onAreaChange = (areaId) => {
    const updates = { areaId };
    const currentProject = projects.find((p) => p.id === task.projectId);
    if (currentProject && currentProject.areaId !== areaId) updates.projectId = null;
    updateTask(task.id, updates);
  };

  // Picking a project always pulls the task's areaId along with it, so the
  // two fields can never end up pointing at mismatched Areas.
  const onProjectChange = (projectId) => {
    if (!projectId) { updateTask(task.id, { projectId: null }); return; }
    const project = projects.find((p) => p.id === projectId);
    updateTask(task.id, { projectId, areaId: project ? project.areaId : task.areaId });
  };

  const areaOptions = areas
    .filter((a) => !a.archived || a.id === task.areaId)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const areaById = new Map(areas.map((a) => [a.id, a]));
  const projectOptions = projects
    .filter((p) => p.status !== 'archived' || p.id === task.projectId)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const taskTypes = (settings?.taskTypes && settings.taskTypes.length ? settings.taskTypes : DEFAULT_TASK_TYPES);
  const lanes = settings?.lanes || ['now', 'next', 'later'];

  return (
    <div className="orb-te">
      <div className="orb-te-title-row">
        <input
          className="orb-te-title-input"
          value={title}
          placeholder="Task title…"
          onChange={(e) => { setTitleDirty(true); setDraftTitle(e.target.value); }}
          onFocus={() => { setTitleDirty(true); setDraftTitle(task.title); }}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') { setTitleDirty(false); setDraftTitle(task.title); }
          }}
        />
      </div>

      <div className="orb-te-grid">
        <label className="orb-te-field">
          <span className="orb-te-label">Status</span>
          <select className="orb-te-select" value={task.status} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
            <option value="killed">Killed</option>
          </select>
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Area</span>
          <select className="orb-te-select" value={task.areaId || ''} onChange={(e) => onAreaChange(e.target.value)}>
            {!task.areaId && <option value="">— choose —</option>}
            {areaOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Project</span>
          <select className="orb-te-select" value={task.projectId || ''} onChange={(e) => onProjectChange(e.target.value)}>
            <option value="">— none (direct to area) —</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {(areaById.get(p.areaId)?.name || '?')} — {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Type</span>
          <select className="orb-te-select" value={task.taskType || ''} onChange={(e) => updateTask(task.id, { taskType: e.target.value || null })}>
            <option value="">— none —</option>
            {taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Lane</span>
          <select className="orb-te-select" value={task.lane || ''} onChange={(e) => updateTask(task.id, { lane: e.target.value || null })}>
            <option value="">— none —</option>
            {lanes.map((l) => <option key={l} value={l}>{cap(l)}</option>)}
          </select>
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Time (min)</span>
          <input
            className="orb-te-input"
            type="number"
            min="0"
            placeholder="—"
            value={timeMinDisplay}
            onChange={(e) => { setTimeDirty(true); setDraftTimeMin(e.target.value); }}
            onFocus={() => { setTimeDirty(true); setDraftTimeMin(task.timeMin ?? ''); }}
            onBlur={commitTimeMin}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          />
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Due date</span>
          <input
            className="orb-te-input"
            type="date"
            value={task.dueDate || ''}
            onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
          />
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Scheduled date</span>
          <input
            className="orb-te-input"
            type="date"
            value={task.scheduledDate || ''}
            onChange={(e) => updateTask(task.id, { scheduledDate: e.target.value || null })}
          />
        </label>

        <label className="orb-te-field">
          <span className="orb-te-label">Scheduled time</span>
          <input
            className="orb-te-input"
            type="time"
            value={task.scheduledTime || ''}
            onChange={(e) => updateTask(task.id, { scheduledTime: e.target.value || null })}
          />
        </label>

        {RATING_FIELDS.map(({ key, label }) => (
          <RatingButtons key={key} label={label} value={task[key]} onChange={(n) => updateTask(task.id, { [key]: n })} />
        ))}
      </div>

      <RecurrenceAffordance task={task} />

      <DependencyLinker task={task} />
      <SubtaskList task={task} depth={depth} />
    </div>
  );
}
