import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { firstOpenDayFor } from '../calc/planner';
import { defaultAreaId } from '../orbitConfig';
import AreaSelect from './AreaSelect';
import AxisChips from './AxisChips';
import CollapsedField from './CollapsedField';
import './CaptureScreen.css';

// null = never chosen, and it SAVES as null. Writing a fallback 3 would make an
// untriaged task look already-scored and quietly skip future triage — the axes
// are the triage. calc/priority.js substitutes a neutral value for ranking only.
const DEFAULT_AXES = { importance: null, urgency: null, difficulty: null, energy: null };

// Full-screen mobile add (§4.1 + C7/C8). A title is the only requirement;
// every other field is optional and nothing typed here is ever discarded.
//
// This ALWAYS creates a Task. Area used to decide whether you got a Task or a
// raw capture, which meant the detail fields you filled in could be silently
// thrown away — Area is now just another field. What decides whether it needs
// triage is whether it's scored, nothing else.
export default function CaptureScreen() {
  const { areas, tasks, settings, today, getDayPlan, addTask } = useOrbit();

  const [title, setTitle] = useState('');
  // Area is the one field still behind a tap — it's sticky across submits, so
  // it's usually already correct and otherwise just eats vertical space on a
  // phone. The toggle label shows the live value so it can't silently drift.
  const [areaOpen, setAreaOpen] = useState(false);
  // Preselected to Home so the collapsed row reads as a real value, matching
  // what addTask would fill in anyway. Never blank.
  const [areaId, setAreaId] = useState(() => defaultAreaId(areas) ?? '');
  // Parent — collapsed the same way as Area. Lists tasks flagged isProject
  // (the Project toggle below), NOT the separate formal Project entity —
  // this is the lightweight parent/child task hierarchy (parentTaskId).
  const [parentOpen, setParentOpen] = useState(false);
  const [parentTaskId, setParentTaskId] = useState('');
  const [isThought, setIsThought] = useState(false);
  const [isProject, setIsProject] = useState(false);
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
  // Parent candidates are tasks flagged isProject (the toggle below) — this
  // task's own id is excluded so a task can't become its own parent.
  const projectTasks = tasks.filter((t) => t.isProject && t.status !== 'done' && t.status !== 'killed');
  const areaLabel = openAreas.find((a) => a.id === areaId)?.name ?? 'none';
  const parentLabel = projectTasks.find((t) => t.id === parentTaskId)?.title ?? 'none';
  const scoreComplete = axes.importance != null && axes.urgency != null
    && axes.difficulty != null && axes.energy != null;

  const setAxis = (key, value) => setAxes((prev) => ({ ...prev, [key]: value }));
  const handleToggle = (key, value) => {
    if (key === 'isThought') setIsThought(value);
    else if (key === 'isProject') setIsProject(value);
  };

  const handleAreaChange = (nextAreaId) => setAreaId(nextAreaId);

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

    // A title is the whole requirement. Area does NOT decide what gets created
    // any more — this always makes a Task, and an unscored Task is already in
    // the triage queue by definition (calc/priority.js isUnscored). Area is
    // just another optional field, and nothing typed here is ever discarded.
    let noteMsg = null;

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
      parentTaskId: parentTaskId || null,
      isThought,
      isProject,
      importance: axes.importance,
      urgency: axes.urgency,
      difficulty: axes.difficulty,
      energy: axes.energy,
      timeMin: timeMin === '' ? null : Number(timeMin),
      dueDate: dueDate || null,
      scheduledDate: sched,
    });
    if (addToCalendar && sched) noteMsg = `📅 Scheduled for ${sched}.`;

    clearTimeout(noteTimerRef.current);
    setNote(noteMsg);
    if (noteMsg) noteTimerRef.current = setTimeout(() => setNote(null), 6000);

    setTitle('');
    // Area stays sticky so a batch of same-context captures doesn't need
    // reselecting each time; per-item specifics (axes, thought/project,
    // parent, time, dates) reset so they can't silently leak onto the next,
    // unrelated item.
    setAxes(DEFAULT_AXES);
    setIsThought(false);
    setIsProject(false);
    setParentTaskId('');
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
        <AxisChips
          axes={axes}
          onChange={setAxis}
          toggles={{ isThought, isProject, onToggle: handleToggle }}
        />

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
            {scoreComplete
              ? 'Fully scored — goes straight to your lists.'
              : 'Unscored, so it lands in the triage queue until you score it.'}
          </div>

          {/* Two-up grid: on a phone these as full-width stacked rows pushed
              the submit button off-screen. */}
          <div className="orb-capscreen-fieldgrid">
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

          {/* Both collapsed by default — a tap reveals the real control in
              place of the button, never both at once. Area is sticky across
              submits so the row already shows the live value most of the time. */}
          <CollapsedField label="Parent" valueLabel={parentLabel} open={parentOpen} onOpen={() => setParentOpen(true)}>
            <select value={parentTaskId} onChange={(e) => setParentTaskId(e.target.value)}>
              <option value="">— none —</option>
              {projectTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </CollapsedField>

          <CollapsedField label="Area" valueLabel={areaLabel} open={areaOpen} onOpen={() => setAreaOpen(true)}>
            <AreaSelect value={areaId} onChange={handleAreaChange} />
          </CollapsedField>
        </div>

        <button type="submit" className="orb-btn orb-btn-primary orb-capscreen-submit">
          Add Task
        </button>
      </form>
    </div>
  );
}
