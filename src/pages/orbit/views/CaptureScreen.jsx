import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { firstOpenDayFor } from '../calc/planner';
import AreaSelect from './AreaSelect';
import AxisChips from './AxisChips';
import './CaptureScreen.css';

// null = never chosen, and it SAVES as null. Writing a fallback 3 would make an
// untriaged task look already-scored and quietly skip future triage — the axes
// are the triage. calc/priority.js substitutes a neutral value for ranking only.
const DEFAULT_AXES = { importance: null, urgency: null, difficulty: null, energy: null };

// Full-screen mobile add (§4.1 + C7/C8). Title-only is a complete, valid
// submit — the collapsible section underneath is opt-in extra detail, never
// required. Whether an Area is set decides the whole outcome: no Area stays
// a raw inbox capture for later triage; setting one promotes it straight to
// a real Task (skips the triage queue entirely) — see handleSubmit.
export default function CaptureScreen() {
  const { areas, projects, settings, tasks, today, getDayPlan, addTask, addInboxItem } = useOrbit();

  const [title, setTitle] = useState('');
  // Area is the one field still behind a tap — it's sticky across submits, so
  // it's usually already correct and otherwise just eats vertical space on a
  // phone. The toggle label shows the live value so it can't silently drift.
  const [areaOpen, setAreaOpen] = useState(false);
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
  const areaLabel = openAreas.find((a) => a.id === areaId)?.name ?? 'none (inbox)';

  const setAxis = (key, value) => setAxes((prev) => ({ ...prev, [key]: value }));

  const handleAreaChange = (nextAreaId) => {
    setAreaId(nextAreaId);
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
          // Day-fitting needs a number; an unscored task is assumed average
          // rather than free. Local to this placement — nothing is persisted.
          { timeMin: timeMin === '' ? null : Number(timeMin), energy: axes.energy ?? 3 },
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
      const axesTouched = axes.importance != null || axes.urgency != null || axes.difficulty != null
        || axes.energy != null || timeMin !== '' || !!taskType || !!dueDate || !!scheduledDate || !!projectId;
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
        {/* Above the title on purpose: scoring is the part that's easy to skip,
            and four stacked steppers at the bottom of the form were below the
            fold on a phone the moment the keyboard opened. */}
        <AxisChips axes={axes} onChange={setAxis} />

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

        {/* No details toggle at all. Seeing every field WITHOUT a tap is the
            whole difference between this screen and quick ＋ Capture — making
            you open a disclosure first collapsed that distinction. */}
        <div className="orb-capscreen-details">
          <div className="orb-capscreen-hint">
            {areaId ? 'Area set — this will be created as a Task.' : 'No Area — this will go to the Inbox for later triage.'}
          </div>

          {/* Two-up grid: on a phone these as full-width stacked rows pushed
              the submit button off-screen. */}
          <div className="orb-capscreen-fieldgrid">
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
                <span>Scheduled</span>
                <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </label>
          </div>

          {/* Last, and the only thing still collapsed. It's sticky across
              submits so it's usually already right; the row shows the live
              value so it can't drift without being noticed. */}
          <button
            type="button"
            className="orb-capscreen-areatoggle"
            onClick={() => setAreaOpen((v) => !v)}
            aria-expanded={areaOpen}
          >
            <span>Area</span>
            <strong>{areaLabel}</strong>
            <span aria-hidden="true">{areaOpen ? '▴' : '▾'}</span>
          </button>

          {areaOpen && (
            <label className="orb-capscreen-field">
              <span>Area</span>
              <AreaSelect value={areaId} onChange={handleAreaChange} includeNone />
            </label>
          )}
        </div>

        <button type="submit" className="orb-btn orb-btn-primary orb-capscreen-submit">
          {(areaId || addToCalendar) ? 'Add Task' : 'Add to Inbox'}
        </button>
      </form>
    </div>
  );
}
