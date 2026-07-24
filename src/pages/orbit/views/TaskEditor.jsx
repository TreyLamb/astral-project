import { useState } from 'react';
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

      <DependencyLinker task={task} />
      <SubtaskList task={task} depth={depth} />
    </div>
  );
}
