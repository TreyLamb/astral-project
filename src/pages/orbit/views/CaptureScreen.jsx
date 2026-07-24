import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { firstOpenDayFor } from '../calc/planner';
import './CaptureScreen.css';

const DEFAULT_AXES = { importance: 3, urgency: 3, difficulty: 3, energy: 3 };

// 1-5 segmented control — big tap targets, no typing required. Duplicated
// (small, single-purpose) in TriageView's inline task form rather than
// pulled into a shared file neither view is chartered to own.
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

// Full-screen mobile add (§4.1 + C7/C8). Title-only is a complete, valid
// submit — the collapsible section underneath is opt-in extra detail, never
// required. Whether an Area is set decides the whole outcome: no Area stays
// a raw inbox capture for later triage; setting one promotes it straight to
// a real Task (skips the triage queue entirely) — see handleSubmit.
export default function CaptureScreen() {
  const { areas, projects, settings, tasks, today, getDayPlan, addTask, addInboxItem } = useOrbit();

  const [title, setTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [areaId, setAreaId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskType, setTaskType] = useState('');
  const [axes, setAxes] = useState(DEFAULT_AXES);
  const [timeMin, setTimeMin] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [note, setNote] = useState(null);
  const [flash, setFlash] = useState(null);

  const titleRef = useRef(null);
  const noteTimerRef = useRef(null);
  const flashTimerRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);
  useEffect(() => () => {
    clearTimeout(noteTimerRef.current);
    clearTimeout(flashTimerRef.current);
  }, []);

  const openAreas = areas.filter((a) => !a.archived);
  const areaProjects = areaId ? projects.filter((p) => p.areaId === areaId && p.status !== 'archived') : [];

  const setAxis = (key, value) => setAxes((prev) => ({ ...prev, [key]: value }));

  const handleAreaChange = (e) => {
    setAreaId(e.target.value);
    setProjectId(''); // a project belongs to one area — a stale pick can't carry over
  };

  const capacityFor = (date) => {
    const plan = getDayPlan(date);
    return {
      timeMin: plan.capacityTimeMin ?? settings.capacityDefault.timeMin,
      energy: plan.capacityEnergy ?? settings.capacityDefault.energy,
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return; // title-only is the only requirement — never submit blank

    // The calendar checkbox forces a real Task even with no Area — "put it on
    // the calendar regardless of how it'd otherwise be triaged."
    const wantsTask = !!areaId || addToCalendar;
    let noteMsg = null;

    if (wantsTask) {
      let sched = scheduledDate || null;
      if (addToCalendar && !sched) {
        const scheduledTasks = tasks.filter((t) => t.scheduledDate && t.status !== 'done' && t.status !== 'killed');
        sched = firstOpenDayFor(
          { timeMin: timeMin === '' ? null : Number(timeMin), energy: axes.energy },
          scheduledTasks, today, 60, capacityFor,
        );
      }
      addTask({
        title: trimmed,
        areaId: areaId || null,
        projectId: projectId || null,
        importance: axes.importance,
        urgency: axes.urgency,
        difficulty: axes.difficulty,
        energy: axes.energy,
        timeMin: timeMin === '' ? null : Number(timeMin),
        taskType: taskType || null,
        dueDate: dueDate || null,
        scheduledDate: sched,
      });
      if (addToCalendar && sched) {
        noteMsg = `📅 Scheduled for ${sched}${areaId ? '' : ' — no Area set, filed as an unsorted task'}.`;
      }
    } else {
      // InboxItem has no axis fields this phase — say so instead of quietly
      // discarding whatever the user set below the title (spec C8: ✂️).
      const axesTouched = axes.importance !== 3 || axes.urgency !== 3 || axes.difficulty !== 3
        || axes.energy !== 3 || timeMin !== '' || !!taskType || !!dueDate || !!scheduledDate || !!projectId;
      addInboxItem({ rawText: trimmed });
      if (axesTouched) {
        noteMsg = "No Area set, so this went to the Inbox as plain text — the detail fields above weren't saved. Set an Area (or tick Add to calendar) to create a Task directly.";
      }
    }

    clearTimeout(noteTimerRef.current);
    setNote(noteMsg);
    if (noteMsg) noteTimerRef.current = setTimeout(() => setNote(null), 6000);

    setTitle('');
    // Area/Project/Type stay sticky so a batch of same-context captures
    // doesn't need reselecting each time; per-item specifics (axes, time,
    // dates) reset so they can't silently leak onto the next, unrelated one.
    setAxes(DEFAULT_AXES);
    setTimeMin('');
    setDueDate('');
    setScheduledDate('');

    clearTimeout(flashTimerRef.current);
    setFlash('Added');
    flashTimerRef.current = setTimeout(() => setFlash(null), 1200);

    titleRef.current?.focus();
  };

  return (
    <div className="orb-capscreen">
      <div className="orb-capscreen-head">
        <Link to="/orbit" className="orb-capscreen-back" aria-label="Back to Today">← Today</Link>
        {flash && <span className="orb-capscreen-flash">{flash}</span>}
      </div>

      <form className="orb-capscreen-form" onSubmit={handleSubmit}>
        <input
          ref={titleRef}
          type="text"
          className="orb-capscreen-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          aria-label="Task or capture title"
        />

        {note && <div className="orb-capscreen-note">{note}</div>}

        <label className="orb-capscreen-calcheck">
          <input type="checkbox" checked={addToCalendar} onChange={(e) => setAddToCalendar(e.target.checked)} />
          <span>📅 Add to calendar — auto-pick the next open day</span>
        </label>
        {addToCalendar && (
          <div className="orb-capscreen-calcheck-hint">
            Drops onto the next day that still has free time/energy. Set a Scheduled date below to pick the day yourself.
          </div>
        )}

        <button
          type="button"
          className="orb-capscreen-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? '− Hide details' : '+ Add details'}
        </button>

        {expanded && (
          <div className="orb-capscreen-details">
            <div className="orb-capscreen-hint">
              {areaId ? 'Area set — this will be created as a Task.' : 'No Area — this will go to the Inbox for later triage.'}
            </div>

            <label className="orb-capscreen-field">
              <span>Area</span>
              <select value={areaId} onChange={handleAreaChange}>
                <option value="">— none (inbox) —</option>
                {openAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>

            <label className="orb-capscreen-field">
              <span>Project</span>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!areaId}>
                <option value="">— none —</option>
                {areaProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>

            <label className="orb-capscreen-field">
              <span>Type</span>
              <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                <option value="">— none —</option>
                {settings.taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="orb-capscreen-field">
              <span>Time (min)</span>
              <input
                type="number"
                min="0"
                step="5"
                value={timeMin}
                onChange={(e) => setTimeMin(e.target.value)}
                placeholder="any"
              />
            </label>

            <label className="orb-capscreen-field">
              <span>Due date</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>

            <label className="orb-capscreen-field">
              <span>Scheduled date</span>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </label>

            <AxisStepper label="Importance" value={axes.importance} onChange={(n) => setAxis('importance', n)} />
            <AxisStepper label="Urgency" value={axes.urgency} onChange={(n) => setAxis('urgency', n)} />
            <AxisStepper label="Difficulty" value={axes.difficulty} onChange={(n) => setAxis('difficulty', n)} />
            <AxisStepper label="Energy" value={axes.energy} onChange={(n) => setAxis('energy', n)} />
          </div>
        )}

        <button type="submit" className="orb-btn orb-btn-primary orb-capscreen-submit">
          {(areaId || addToCalendar) ? 'Add Task' : 'Add to Inbox'}
        </button>
      </form>
    </div>
  );
}
