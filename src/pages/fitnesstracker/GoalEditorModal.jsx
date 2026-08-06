import { useState } from 'react';
import { useFitness } from './fitnessContext';
import { todayISO, goalDeadline } from './fitnessConfig';
import ClearableInput from './ClearableInput';
import useModalKeys from './useModalKeys';
import { PR_BUCKETS } from './calc/pr';
import { vdotFromRace, equivalentRaceTime } from './calc/vdot';
import { estimateRunBaseline, estimateSwimBaseline, estimateLiftBaseline, forecastWeeks, forecastGenericWeeks } from './calc/goals';
import { buildCheckpoints, recomputeFrom, mostRecentTouchIndex, buildTaskSessions, formatCheckpointValue } from './calc/checkpoints';
import { addDaysISO } from './calc/planning';
import { clockToSec, secToClock, weightToKg, kgToWeight, distanceToMeters, metersToDistance } from './units';

const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];
const CADENCE_OPTIONS = ['auto', 'daily', 'everyNDays', 'weekly', 'weekdays'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const REALISM_RANK = { conservative: 0, plausible: 1, implausible: 2 };

function round2(n) { return n == null ? null : Math.round(n * 100) / 100; }

function worstBand(checkpoints) {
  let worst = null;
  for (const cp of checkpoints) {
    const band = cp.realism?.band;
    if (!band) continue;
    if (!worst || REALISM_RANK[band] > REALISM_RANK[worst]) worst = band;
  }
  return worst;
}

// Forecast-then-accept, checkpoint-tracked goal editor. Creating: pick an
// activity, set a target + a real deadline, see a live checkpoint trajectory
// preview (target curve + realism), then either save it as a forecast (no
// calendar impact yet) or accept it — which generates checkpoint-dated planned
// workouts + plain task-frequency training days, all tagged with this goal.
// Editing an accepted goal recomputes forward from its most recently touched
// checkpoint (guidelinesForecast.md §6) instead of deleting and regenerating
// everything; a structural change (deadline/cadence) rebuilds the schedule
// from that same touch point forward while preserving logged/overridden
// history as historical waypoints.
//
// Every numeric input here is free entry — no distance/value is locked behind
// a fixed preset dropdown, and "Current" is always user-editable (prefilled
// from logged history/weigh-ins when available) rather than silently
// requiring existing data before a goal can be accepted.
export default function GoalEditorModal({ goal, onClose }) {
  const {
    activityTypes, workouts, bodyWeightLogs, addWorkout, removeWorkout, addGoal, updateGoal, settings,
  } = useFitness();
  const editing = !!goal;
  const weightUnit = settings.units.weight;
  const distUnit = settings.units.distance;
  const units = settings.units;

  const forecastable = activityTypes.filter((t) => t.kind !== 'event');
  const [activityTypeId, setActivityTypeId] = useState(goal?.activityType || forecastable[0]?.id || 'run');
  const selectedType = activityTypes.find((t) => t.id === activityTypeId) || forecastable[0];
  const kind = ['run', 'swim', 'lift', 'weight'].includes(selectedType?.kind) ? selectedType.kind : 'generic';

  // ---- run: free-text distance (PR_BUCKETS offered only as quick-pick buttons) ----
  const [runDistanceValue, setRunDistanceValue] = useState(() => {
    if (goal?.kind === 'run' && goal.targetDistanceM) return String(round2(metersToDistance(goal.targetDistanceM, distUnit)));
    return '';
  });
  const runDistanceM = distanceToMeters(runDistanceValue, distUnit);
  const [runTargetClock, setRunTargetClock] = useState(() => {
    if (goal?.kind === 'run' && goal.targetValue) return secToClock(Math.round(equivalentRaceTime(goal.targetValue, goal.targetDistanceM)));
    return '';
  });
  const [runCurrentClock, setRunCurrentClock] = useState(() => {
    if (goal?.kind === 'run' && goal.baselineValue) return secToClock(Math.round(equivalentRaceTime(goal.baselineValue, goal.targetDistanceM)));
    return '';
  });
  const autoRunBaseline = estimateRunBaseline(workouts);

  // ---- swim (canonical seconds-per-100m, no pool-unit toggle here) ----
  const [swimTargetClock, setSwimTargetClock] = useState(() => (goal?.kind === 'swim' && goal.targetValue ? secToClock(Math.round(goal.targetValue)) : ''));
  const [swimCurrentClock, setSwimCurrentClock] = useState(() => (goal?.kind === 'swim' && goal.baselineValue ? secToClock(Math.round(goal.baselineValue)) : ''));
  const autoSwimBaseline = estimateSwimBaseline(workouts);

  // ---- lift ----
  const [exerciseName, setExerciseName] = useState(goal?.kind === 'lift' ? goal.label : '');
  const [liftTargetWeight, setLiftTargetWeight] = useState(() => (goal?.kind === 'lift' && goal.targetValue ? String(round2(kgToWeight(goal.targetValue, weightUnit))) : ''));
  const [liftCurrentWeight, setLiftCurrentWeight] = useState(() => (goal?.kind === 'lift' && goal.baselineValue ? String(round2(kgToWeight(goal.baselineValue, weightUnit))) : ''));
  const autoLiftBaseline = estimateLiftBaseline(workouts, exerciseName);

  // ---- weight (body composition — new) ----
  const [weightCurrentInput, setWeightCurrentInput] = useState(() => (goal?.kind === 'weight' && goal.baselineValue != null ? String(round2(kgToWeight(goal.baselineValue, weightUnit))) : ''));
  const [weightTargetInput, setWeightTargetInput] = useState(() => (goal?.kind === 'weight' && goal.targetValue != null ? String(round2(kgToWeight(goal.targetValue, weightUnit))) : ''));
  const [direction, setDirection] = useState(goal?.direction || 'loss');
  const sortedWeightLogs = [...bodyWeightLogs].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  const autoWeightBaseline = sortedWeightLogs[0]?.weightKg ?? null;

  // ---- generic ----
  const [genericLabel, setGenericLabel] = useState(goal?.kind === 'generic' ? goal.label : '');
  const [genericCurrent, setGenericCurrent] = useState(goal?.kind === 'generic' && goal.baselineValue != null ? String(goal.baselineValue) : '');
  const [genericTarget, setGenericTarget] = useState(goal?.kind === 'generic' && goal.targetValue != null ? String(goal.targetValue) : '');
  const [higherIsBetter, setHigherIsBetter] = useState(true);

  // ---- deadline (real input — Goal = target + deadline, not a computed output) ----
  const [deadlineMode, setDeadlineMode] = useState(goalDeadline(goal) ? 'date' : 'weeks');
  const [deadlineDateInput, setDeadlineDateInput] = useState(goalDeadline(goal) || '');
  const [durationWeeksInput, setDurationWeeksInput] = useState(goal?.durationWeeks != null ? String(goal.durationWeeks) : '');
  const resolvedDeadline = deadlineMode === 'date'
    ? (deadlineDateInput || null)
    : (durationWeeksInput !== '' ? addDaysISO(todayISO(), Math.round(Number(durationWeeksInput) * 7)) : null);

  // ---- task frequency (how often you train) vs checkpoint cadence (how often
  // the forecast re-benchmarks) — two independent settings (guidelinesForecast.md §1) ----
  const [taskDaysPerWeek, setTaskDaysPerWeek] = useState(goal?.taskFrequency?.value ?? goal?.daysPerWeek ?? 3);
  const [cadenceType, setCadenceType] = useState(goal?.cadence?.type || 'auto');
  const [cadenceN, setCadenceN] = useState(goal?.cadence?.type === 'everyNDays' ? String(goal.cadence.n) : '3');
  const [cadenceWeekdays, setCadenceWeekdays] = useState(goal?.cadence?.type === 'weekdays' ? (goal.cadence.days || []) : []);
  const toggleCadenceWeekday = (i) => setCadenceWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()));
  const resolvedCadence = cadenceType === 'everyNDays' ? { type: 'everyNDays', n: Math.max(1, Math.round(Number(cadenceN) || 3)) }
    : cadenceType === 'weekdays' ? { type: 'weekdays', days: cadenceWeekdays }
    : { type: cadenceType };

  const [note, setNote] = useState(goal?.note || '');
  const [saving, setSaving] = useState(false);

  // Cheap pure-function derivations recomputed each render (same convention as
  // EntryEditor's live insights) rather than useMemo — the calc calls are all
  // fast synchronous math over already-in-memory arrays.
  //
  // "Current" is always whatever the user typed, falling back to the
  // auto-estimate from logged history only when the field is empty — so a
  // goal is never permanently un-acceptable just because there's no matching
  // logged history yet (a new user, or a first-time goal type).
  let baselineValue;
  let baselineIsManual = false;
  if (kind === 'run') {
    const manualSec = clockToSec(runCurrentClock);
    if (manualSec && runDistanceM) { baselineValue = vdotFromRace(runDistanceM, manualSec); baselineIsManual = true; }
    else baselineValue = autoRunBaseline;
  } else if (kind === 'swim') {
    const manualSec = clockToSec(swimCurrentClock);
    if (manualSec) { baselineValue = manualSec; baselineIsManual = true; }
    else baselineValue = autoSwimBaseline;
  } else if (kind === 'lift') {
    if (liftCurrentWeight !== '') { baselineValue = weightToKg(liftCurrentWeight, weightUnit); baselineIsManual = true; }
    else baselineValue = autoLiftBaseline;
  } else if (kind === 'weight') {
    if (weightCurrentInput !== '') { baselineValue = weightToKg(weightCurrentInput, weightUnit); baselineIsManual = true; }
    else baselineValue = autoWeightBaseline;
  } else {
    baselineValue = genericCurrent === '' ? null : Number(genericCurrent);
    baselineIsManual = genericCurrent !== '';
  }
  // Operational definition of "zero-data / provisional" for this app: the
  // baseline came from a typed guess rather than an actual logged workout or
  // weigh-in. The UI always lets you type a Current value (so a goal is never
  // permanently blocked), but only a REAL log confirms it — see
  // guidelinesForecast.md §4's "provisional until a real result lands."
  const hasRealBaseline = !baselineIsManual;

  let targetValue;
  if (kind === 'run') { const s = clockToSec(runTargetClock); targetValue = (s && runDistanceM) ? vdotFromRace(runDistanceM, s) : null; }
  else if (kind === 'swim') targetValue = clockToSec(swimTargetClock);
  else if (kind === 'lift') targetValue = liftTargetWeight === '' ? null : weightToKg(liftTargetWeight, weightUnit);
  else if (kind === 'weight') targetValue = weightTargetInput === '' ? null : weightToKg(weightTargetInput, weightUnit);
  else targetValue = genericTarget === '' ? null : Number(genericTarget);

  // Kept as a SUGGESTION only (feeds the "use suggested date" quick-fill) —
  // the actual deadline driving the checkpoint curve is the explicit input
  // above, not this heuristic's computed output (that inversion — computed
  // target date instead of a real deadline input — was the Phase-9 gap).
  const suggestedWeeks = (baselineValue == null || targetValue == null) ? null
    : (kind === 'generic' ? forecastGenericWeeks(baselineValue, targetValue, taskDaysPerWeek, higherIsBetter)
      : kind === 'weight' ? forecastGenericWeeks(baselineValue, targetValue, taskDaysPerWeek, direction === 'gain')
        : forecastWeeks(kind, baselineValue, targetValue, taskDaysPerWeek));

  let baselineDisplay = '—';
  if (baselineValue != null) {
    if (kind === 'run' && runDistanceM) baselineDisplay = `${secToClock(Math.round(equivalentRaceTime(baselineValue, runDistanceM)))} at ${runDistanceValue}${distUnit}`;
    else if (kind === 'swim') baselineDisplay = `${secToClock(Math.round(baselineValue))}/100m`;
    else if (kind === 'lift') baselineDisplay = `${round2(kgToWeight(baselineValue, weightUnit))} ${weightUnit}`;
    else if (kind === 'weight') baselineDisplay = `${round2(kgToWeight(baselineValue, weightUnit))} ${weightUnit}`;
    else if (kind === 'generic') baselineDisplay = String(baselineValue);
  }
  const baselineSourceNote = baselineValue != null ? (baselineIsManual ? 'entered' : (kind === 'weight' ? 'from your weigh-ins' : 'from your logs')) : null;

  const canForecast = baselineValue != null && targetValue != null && !!resolvedDeadline;

  const draftLabel = kind === 'run' ? `${runDistanceValue}${distUnit}` : kind === 'swim' ? 'Swim pace' : kind === 'lift' ? exerciseName : kind === 'weight' ? 'Body weight' : genericLabel;
  const draftGoal = {
    kind, label: draftLabel, targetValue, baselineValue, targetDistanceM: kind === 'run' ? runDistanceM : null,
    direction: kind === 'weight' ? direction : null,
    startDate: goal?.startDate || todayISO(), deadline: resolvedDeadline, cadence: resolvedCadence,
  };
  const previewCheckpoints = canForecast ? buildCheckpoints(draftGoal, { hasRealBaseline }) : [];
  const worst = worstBand(previewCheckpoints);
  // The first REAL progress point (skip index 0, which is just the start
  // date == baseline) — "what number would I need to hit" for the user's own
  // deadline, not an alternate suggested timeline.
  const firstPreviewCheckpoint = previewCheckpoints.length > 1 ? previewCheckpoints[1] : previewCheckpoints[0] || null;

  function buildPayload(status) {
    return {
      activityType: activityTypeId, kind, label: draftLabel,
      targetDistanceM: kind === 'run' ? runDistanceM : null,
      targetValue, baselineValue, baselineDate: todayISO(),
      direction: kind === 'weight' ? direction : null,
      deadline: resolvedDeadline, durationWeeks: deadlineMode === 'weeks' && durationWeeksInput !== '' ? Number(durationWeeksInput) : null,
      taskFrequency: { type: 'daysPerWeek', value: taskDaysPerWeek }, daysPerWeek: taskDaysPerWeek,
      cadence: resolvedCadence,
      startDate: goal?.startDate || todayISO(),
      forecastWeeks: suggestedWeeks, targetDate: resolvedDeadline,
      status, note,
    };
  }

  async function saveForecastOnly() {
    if (saving) return;
    setSaving(true);
    const payload = buildPayload('forecast');
    const checkpoints = resolvedDeadline ? buildCheckpoints(payload, { hasRealBaseline }) : (goal?.checkpoints ?? null);
    if (editing) await updateGoal(goal.id, { ...payload, checkpoints }); else await addGoal({ ...payload, checkpoints });
    onClose();
  }

  // Reconciles calendar rows against a freshly computed checkpoint/task-day
  // schedule — a real diff, not "delete everything future and regenerate."
  // Targets are derived LIVE from goal.checkpoints wherever they're displayed
  // (CalendarView/EntryEditor), so an existing row on a still-valid date needs
  // no write at all here; only rows whose date fell OUT of the new schedule
  // (and are still planned, not completed) get removed, and only genuinely
  // new dates get a row added.
  async function reconcileWorkouts(goalId, checkpointDates, taskDates) {
    const allDates = new Set([...checkpointDates, ...taskDates]);
    const existingRows = workouts.filter((w) => w.goalId === goalId);
    const existingByDate = new Map(existingRows.map((w) => [w.date, w]));
    const today = todayISO();
    for (const w of existingRows) {
      if (w.status === 'planned' && w.date >= today && !allDates.has(w.date)) await removeWorkout(w.id);
    }
    for (const date of allDates) {
      if (!existingByDate.has(date)) await addWorkout({ date, activityType: activityTypeId, status: 'planned', goalId });
    }
  }

  async function acceptAndSchedule() {
    if (saving || !canForecast) return;
    setSaving(true);
    const payload = buildPayload('accepted');
    let goalId = goal?.id;
    const existing = editing ? goal.checkpoints : null;
    const touchIdx = existing ? mostRecentTouchIndex(existing) : -1;
    const structuralChange = editing && existing && (goalDeadline(goal) !== payload.deadline || JSON.stringify(goal.cadence) !== JSON.stringify(payload.cadence));

    let checkpoints;
    if (!existing || touchIdx === -1) {
      // No history to preserve (new goal, or an old pre-checkpoint goal being
      // upgraded on re-save) — a full build from the current baseline.
      checkpoints = buildCheckpoints(payload, { hasRealBaseline });
    } else if (!structuralChange) {
      // Same schedule, retargeted values only — recompute forward from the
      // most recently touched point, nothing before it moves (§6).
      const anchorCp = existing[touchIdx];
      const anchorValue = anchorCp.source === 'override' ? anchorCp.targetValue : anchorCp.actualValue;
      checkpoints = recomputeFrom(payload.kind, existing, touchIdx, anchorValue, { targetValue: payload.targetValue, deadline: payload.deadline, direction: payload.direction });
    } else {
      // Deadline or cadence itself changed mid-course: preserve touched
      // history as historical waypoints, then rebuild the SCHEDULE (not just
      // values) from that touch point forward to the new deadline/cadence —
      // "editing the end goal recomputes the entire remaining curve" (§6),
      // extended to cover a genuinely new date list, not only new targets at
      // the old dates.
      const anchorCp = existing[touchIdx];
      const anchorValue = anchorCp.source === 'override' ? anchorCp.targetValue : anchorCp.actualValue;
      const rebuilt = buildCheckpoints({ ...payload, startDate: anchorCp.date, baselineValue: anchorValue }, { hasRealBaseline: true });
      checkpoints = [...existing.slice(0, touchIdx + 1), ...rebuilt.filter((c) => c.date > anchorCp.date)];
    }

    if (editing) {
      await updateGoal(goal.id, { ...payload, checkpoints });
    } else {
      const saved = await addGoal({ ...payload, checkpoints });
      goalId = saved.id;
    }
    const checkpointDates = checkpoints.map((c) => c.date);
    const taskDates = buildTaskSessions(payload.startDate, payload.deadline, payload.taskFrequency, checkpointDates);
    await reconcileWorkouts(goalId, checkpointDates, taskDates);
    onClose();
  }

  // Enter maps to the primary action (Accept & add to calendar), matching the
  // highlighted button — not to "Save as forecast".
  useModalKeys({ onClose, onSubmit: acceptAndSchedule, canSubmit: !saving && canForecast });

  return (
    <div className="ft-modal-backdrop" onClick={onClose}>
      <div className="ft-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ft-modal-head">
          <h3>{editing ? 'Edit goal' : 'New goal'}</h3>
          <button type="button" className="ft-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {editing && !goal.checkpoints && (
          <p className="ft-hint-sm ft-goal-incomplete-hint">This goal predates checkpoint tracking — save or accept again below to upgrade it.</p>
        )}

        <label className="ft-field-label">Activity</label>
        <div className="ft-type-row">
          {forecastable.map((t) => (
            <button
              key={t.id} type="button" className={`ft-type-btn${activityTypeId === t.id ? ' active' : ''}`}
              style={activityTypeId === t.id ? { borderColor: t.color, background: t.color + '22' } : undefined}
              onClick={() => setActivityTypeId(t.id)}
            >
              <span className="ft-type-icon">{t.icon}</span><span>{t.name}</span>
            </button>
          ))}
        </div>

        {kind === 'run' && (
          <>
            <div className="ft-field">
              <label className="ft-field-label">Distance ({distUnit}) — type any distance</label>
              <ClearableInput inputMode="decimal" value={runDistanceValue} onChange={(e) => setRunDistanceValue(e.target.value)} onClear={() => setRunDistanceValue('')} placeholder="e.g. 3.1" />
            </div>
            <div className="ft-preset-row">
              {PR_BUCKETS.map((b) => (
                <button key={b.id} type="button" className="ft-preset-btn" onClick={() => setRunDistanceValue(String(round2(metersToDistance(b.m, distUnit))))}>
                  {b.name}
                </button>
              ))}
            </div>
            <div className="ft-two">
              <div className="ft-field">
                <label className="ft-field-label">Current time (mm:ss)</label>
                <ClearableInput value={runCurrentClock} onChange={(e) => setRunCurrentClock(e.target.value)} onClear={() => setRunCurrentClock('')} placeholder={autoRunBaseline ? 'from your logs' : 'e.g. 7:15'} />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Target time (mm:ss)</label>
                <ClearableInput value={runTargetClock} onChange={(e) => setRunTargetClock(e.target.value)} onClear={() => setRunTargetClock('')} placeholder="e.g. 6:00" />
              </div>
            </div>
          </>
        )}

        {kind === 'swim' && (
          <div className="ft-two">
            <div className="ft-field">
              <label className="ft-field-label">Current pace (mm:ss/100m)</label>
              <ClearableInput value={swimCurrentClock} onChange={(e) => setSwimCurrentClock(e.target.value)} onClear={() => setSwimCurrentClock('')} placeholder={autoSwimBaseline ? 'from your logs' : 'e.g. 1:45'} />
            </div>
            <div className="ft-field">
              <label className="ft-field-label">Target pace (mm:ss/100m)</label>
              <ClearableInput value={swimTargetClock} onChange={(e) => setSwimTargetClock(e.target.value)} onClear={() => setSwimTargetClock('')} placeholder="e.g. 1:30" />
            </div>
          </div>
        )}

        {kind === 'lift' && (
          <>
            <div className="ft-field">
              <label className="ft-field-label">Exercise</label>
              <ClearableInput value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} onClear={() => setExerciseName('')} placeholder="e.g. Bench press" />
            </div>
            <div className="ft-two">
              <div className="ft-field">
                <label className="ft-field-label">Current 1RM ({weightUnit})</label>
                <ClearableInput inputMode="decimal" value={liftCurrentWeight} onChange={(e) => setLiftCurrentWeight(e.target.value)} onClear={() => setLiftCurrentWeight('')} placeholder={autoLiftBaseline ? 'from your logs' : 'e.g. 185'} />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Target 1RM ({weightUnit})</label>
                <ClearableInput inputMode="decimal" value={liftTargetWeight} onChange={(e) => setLiftTargetWeight(e.target.value)} onClear={() => setLiftTargetWeight('')} placeholder="e.g. 225" />
              </div>
            </div>
          </>
        )}

        {kind === 'weight' && (
          <>
            <div className="ft-two">
              <div className="ft-field">
                <label className="ft-field-label">Current weight ({weightUnit})</label>
                <ClearableInput inputMode="decimal" value={weightCurrentInput} onChange={(e) => setWeightCurrentInput(e.target.value)} onClear={() => setWeightCurrentInput('')} placeholder={autoWeightBaseline ? 'from your weigh-ins' : 'e.g. 180'} />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Target weight ({weightUnit})</label>
                <ClearableInput inputMode="decimal" value={weightTargetInput} onChange={(e) => setWeightTargetInput(e.target.value)} onClear={() => setWeightTargetInput('')} placeholder="e.g. 165" />
              </div>
            </div>
            <div className="ft-status-toggle">
              <button type="button" className={direction === 'loss' ? 'active' : ''} onClick={() => setDirection('loss')}>↓ Lose weight</button>
              <button type="button" className={direction === 'gain' ? 'active' : ''} onClick={() => setDirection('gain')}>↑ Gain weight</button>
            </div>
            <p className="ft-hint-sm">Rate-capped against ISSN diet research (0.5–0.75% bodyweight/wk loss) and lean-bulk research (0.25–0.5%/wk gain) — see Realism below. Never softened, only flagged if you push past it.</p>
          </>
        )}

        {kind === 'generic' && (
          <>
            <div className="ft-field">
              <label className="ft-field-label">Goal name</label>
              <ClearableInput value={genericLabel} onChange={(e) => setGenericLabel(e.target.value)} onClear={() => setGenericLabel('')} placeholder="e.g. Weekly ride distance" />
            </div>
            <div className="ft-two">
              <div className="ft-field">
                <label className="ft-field-label">Current</label>
                <ClearableInput inputMode="decimal" value={genericCurrent} onChange={(e) => setGenericCurrent(e.target.value)} onClear={() => setGenericCurrent('')} />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">Target</label>
                <ClearableInput inputMode="decimal" value={genericTarget} onChange={(e) => setGenericTarget(e.target.value)} onClear={() => setGenericTarget('')} />
              </div>
            </div>
            <div className="ft-status-toggle">
              <button type="button" className={higherIsBetter ? 'active' : ''} onClick={() => setHigherIsBetter(true)}>↑ Higher is better</button>
              <button type="button" className={!higherIsBetter ? 'active' : ''} onClick={() => setHigherIsBetter(false)}>↓ Lower is better</button>
            </div>
          </>
        )}

        <label className="ft-field-label">Deadline</label>
        <div className="ft-status-toggle">
          <button type="button" className={deadlineMode === 'date' ? 'active' : ''} onClick={() => setDeadlineMode('date')}>Pick a date</button>
          <button type="button" className={deadlineMode === 'weeks' ? 'active' : ''} onClick={() => setDeadlineMode('weeks')}>In N weeks</button>
        </div>
        {deadlineMode === 'date' ? (
          <input className="ft-input" type="date" value={deadlineDateInput} onChange={(e) => setDeadlineDateInput(e.target.value)} />
        ) : (
          <ClearableInput inputMode="numeric" value={durationWeeksInput} onChange={(e) => setDurationWeeksInput(e.target.value)} onClear={() => setDurationWeeksInput('')} placeholder="e.g. 12" />
        )}
        {suggestedWeeks != null && !resolvedDeadline && (
          <button type="button" className="ft-btn-ghost" style={{ marginTop: 6 }} onClick={() => { setDeadlineMode('date'); setDeadlineDateInput(addDaysISO(todayISO(), suggestedWeeks * 7)); }}>
            Use suggested ~{suggestedWeeks} wk{suggestedWeeks === 1 ? '' : 's'} ({addDaysISO(todayISO(), suggestedWeeks * 7)})
          </button>
        )}

        <label className="ft-field-label">Task frequency — how many days a week you'll train</label>
        <div className="ft-move-days" style={{ marginBottom: 10 }}>
          {DAYS_OPTIONS.map((d) => (
            <button key={d} type="button" className={`ft-btn-ghost${taskDaysPerWeek === d ? ' active' : ''}`} onClick={() => setTaskDaysPerWeek(d)}>{d}</button>
          ))}
        </div>

        <label className="ft-field-label">Checkpoint frequency — how often the forecast re-benchmarks</label>
        <p className="ft-hint-sm">Separate from task frequency above — you can train more often than you're graded, or vice versa.</p>
        <div className="ft-type-row">
          {CADENCE_OPTIONS.map((ct) => (
            <button key={ct} type="button" className={`ft-type-btn${cadenceType === ct ? ' active' : ''}`} onClick={() => setCadenceType(ct)}>
              {ct === 'auto' ? 'Auto' : ct === 'everyNDays' ? 'Every N days' : ct[0].toUpperCase() + ct.slice(1)}
            </button>
          ))}
        </div>
        {cadenceType === 'everyNDays' && (
          <div className="ft-field" style={{ maxWidth: 160 }}>
            <label className="ft-field-label">N days</label>
            <ClearableInput inputMode="numeric" value={cadenceN} onChange={(e) => setCadenceN(e.target.value)} onClear={() => setCadenceN('')} placeholder="e.g. 4" />
          </div>
        )}
        {cadenceType === 'weekdays' && (
          <div className="ft-move-days">
            {WEEKDAY_LABELS.map((d, i) => (
              <button key={d} type="button" className={`ft-btn-ghost${cadenceWeekdays.includes(i) ? ' active' : ''}`} onClick={() => toggleCadenceWeekday(i)}>{d}</button>
            ))}
          </div>
        )}

        <div className="ft-insights">
          {/* "Baseline" not "Current" — sharing the editable field's label read as a locked duplicate of it. */}
          <div className="ft-insight">
            <span className="ft-insight-k">Baseline{baselineSourceNote ? ` (${baselineSourceNote})` : ''}</span>
            <span className="ft-insight-v">{baselineDisplay}</span>
          </div>
          {/* "Suggested pace" is only a HELPER for picking a deadline before you've
              set one — once you have, this row shows YOUR numbers for YOUR
              deadline (the first checkpoint on your actual trajectory), never a
              competing alternate pace that isn't the plan you asked for. */}
          {!resolvedDeadline && (
            <div className="ft-insight">
              <span className="ft-insight-k">Suggested pace</span>
              <span className="ft-insight-v">
                {suggestedWeeks == null ? '—' : suggestedWeeks === 0 ? 'Already there' : `~${suggestedWeeks} wk${suggestedWeeks === 1 ? '' : 's'}`}
              </span>
            </div>
          )}
          {resolvedDeadline && <div className="ft-insight"><span className="ft-insight-k">Deadline</span><span className="ft-insight-v">{resolvedDeadline}</span></div>}
          {firstPreviewCheckpoint && (
            <div className="ft-insight">
              <span className="ft-insight-k">First checkpoint ({firstPreviewCheckpoint.date})</span>
              <span className="ft-insight-v">{formatCheckpointValue(draftGoal, firstPreviewCheckpoint.targetValue, units)}</span>
            </div>
          )}
          {previewCheckpoints.length > 0 && (
            <div className="ft-insight">
              <span className="ft-insight-k">Realism</span>
              <span className={`ft-insight-v ft-realism-${worst || 'conservative'}`}>{worst || 'conservative'}</span>
            </div>
          )}
        </div>
        {!canForecast && (
          <p className="ft-hint-sm ft-goal-incomplete-hint">
            {kind === 'run' && !runDistanceM && 'Enter a distance to continue. '}
            {baselineValue == null && 'Enter a "Current" value in the section above (scroll up) — '}
            {targetValue == null && 'Enter a target value in the section above — '}
            {!resolvedDeadline && 'Set a deadline above — '}
            {(baselineValue == null || targetValue == null || !resolvedDeadline) && "the checkpoint trajectory can't be computed until these are filled in."}
          </p>
        )}
        <p className="ft-hint-sm">Forecast is a planning estimate, not a guarantee — checkpoints are computed exactly and flagged when aggressive, never softened or refused. Revise it as real results come in.</p>

        <div className="ft-field">
          <label className="ft-field-label">Note</label>
          <ClearableInput value={note} onChange={(e) => setNote(e.target.value)} onClear={() => setNote('')} placeholder="optional" />
        </div>

        <div className="ft-modal-actions">
          <button type="button" className="ft-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="ft-btn-ghost" disabled={saving} onClick={saveForecastOnly}>Save as forecast</button>
          <button type="button" className="ft-btn-primary" disabled={saving || !canForecast} onClick={acceptAndSchedule}>Accept &amp; add to calendar</button>
        </div>
      </div>
    </div>
  );
}
