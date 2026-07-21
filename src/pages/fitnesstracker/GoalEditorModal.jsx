import { useState } from 'react';
import { useFitness } from './fitnessContext';
import { todayISO } from './fitnessConfig';
import ClearableInput from './ClearableInput';
import { PR_BUCKETS } from './calc/pr';
import { vdotFromRace, equivalentRaceTime } from './calc/vdot';
import { estimateRunBaseline, estimateSwimBaseline, estimateLiftBaseline, forecastWeeks, forecastGenericWeeks, buildPlan } from './calc/goals';
import { addDaysISO } from './calc/planning';
import { clockToSec, secToClock, weightToKg, kgToWeight, distanceToMeters, metersToDistance } from './units';

const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];

function round2(n) { return n == null ? null : Math.round(n * 100) / 100; }

// Forecast-then-accept goal editor. Creating: pick an activity, set a target,
// see a live weeks-to-goal estimate, then either save it as a forecast (no
// calendar impact yet) or accept it — which generates planned workouts tagged
// with this goal across the forecast window (see calc/goals.js buildPlan).
// Editing an accepted goal re-runs the same math and regenerates every FUTURE,
// not-yet-completed planned session tied to it — past/completed sessions are
// left untouched.
//
// Every numeric input here is free entry — no distance/value is locked behind
// a fixed preset dropdown, and "Current" is always user-editable (prefilled
// from logged history when available) rather than silently requiring existing
// logged data before a goal can be accepted.
export default function GoalEditorModal({ goal, onClose }) {
  const { activityTypes, workouts, addWorkout, removeWorkout, addGoal, updateGoal, settings } = useFitness();
  const editing = !!goal;
  const weightUnit = settings.units.weight;
  const distUnit = settings.units.distance;

  const forecastable = activityTypes.filter((t) => t.kind !== 'event');
  const [activityTypeId, setActivityTypeId] = useState(goal?.activityType || forecastable[0]?.id || 'run');
  const selectedType = activityTypes.find((t) => t.id === activityTypeId) || forecastable[0];
  const kind = ['run', 'swim', 'lift'].includes(selectedType?.kind) ? selectedType.kind : 'generic';

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

  // ---- generic ----
  const [genericLabel, setGenericLabel] = useState(goal?.kind === 'generic' ? goal.label : '');
  const [genericCurrent, setGenericCurrent] = useState(goal?.kind === 'generic' && goal.baselineValue != null ? String(goal.baselineValue) : '');
  const [genericTarget, setGenericTarget] = useState(goal?.kind === 'generic' && goal.targetValue != null ? String(goal.targetValue) : '');
  const [higherIsBetter, setHigherIsBetter] = useState(true);

  const [daysPerWeek, setDaysPerWeek] = useState(goal?.daysPerWeek || 3);
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
  } else {
    baselineValue = genericCurrent === '' ? null : Number(genericCurrent);
    baselineIsManual = genericCurrent !== '';
  }

  let targetValue;
  if (kind === 'run') { const s = clockToSec(runTargetClock); targetValue = (s && runDistanceM) ? vdotFromRace(runDistanceM, s) : null; }
  else if (kind === 'swim') targetValue = clockToSec(swimTargetClock);
  else if (kind === 'lift') targetValue = liftTargetWeight === '' ? null : weightToKg(liftTargetWeight, weightUnit);
  else targetValue = genericTarget === '' ? null : Number(genericTarget);

  const weeks = (baselineValue == null || targetValue == null) ? null
    : (kind === 'generic' ? forecastGenericWeeks(baselineValue, targetValue, daysPerWeek, higherIsBetter) : forecastWeeks(kind, baselineValue, targetValue, daysPerWeek));

  const targetDate = weeks ? addDaysISO(todayISO(), weeks * 7) : null;

  let baselineDisplay = '—';
  if (baselineValue != null) {
    if (kind === 'run' && runDistanceM) baselineDisplay = `${secToClock(Math.round(equivalentRaceTime(baselineValue, runDistanceM)))} at ${runDistanceValue}${distUnit}`;
    else if (kind === 'swim') baselineDisplay = `${secToClock(Math.round(baselineValue))}/100m`;
    else if (kind === 'lift') baselineDisplay = `${round2(kgToWeight(baselineValue, weightUnit))} ${weightUnit}`;
    else if (kind === 'generic') baselineDisplay = String(baselineValue);
  }
  const baselineSourceNote = baselineValue != null ? (baselineIsManual ? 'entered' : 'from your logs') : null;

  function formatSessionTarget(v) {
    if (v == null) return '';
    if (kind === 'run' && runDistanceM) return `${secToClock(Math.round(equivalentRaceTime(v, runDistanceM)))} at ${runDistanceValue}${distUnit} pace`;
    if (kind === 'swim') return `${secToClock(Math.round(v))}/100m`;
    if (kind === 'lift') return `${round2(kgToWeight(v, weightUnit))} ${weightUnit} ${exerciseName}`;
    return `${round2(v)} ${genericLabel}`;
  }

  function buildPayload(status) {
    const label = kind === 'run' ? `${runDistanceValue}${distUnit}` : kind === 'swim' ? 'Swim pace' : kind === 'lift' ? exerciseName : genericLabel;
    return {
      activityType: activityTypeId, kind, label,
      targetDistanceM: kind === 'run' ? runDistanceM : null,
      targetValue, baselineValue, daysPerWeek,
      startDate: goal?.startDate || todayISO(), forecastWeeks: weeks, targetDate,
      status, note,
    };
  }

  const canForecast = baselineValue != null && targetValue != null && weeks != null;

  async function saveForecastOnly() {
    if (saving) return;
    setSaving(true);
    const payload = buildPayload('forecast');
    if (editing) await updateGoal(goal.id, payload); else await addGoal(payload);
    onClose();
  }

  async function acceptAndSchedule() {
    if (saving || !canForecast) return;
    setSaving(true);
    const payload = buildPayload('accepted');
    let goalId = goal?.id;
    if (editing) {
      await updateGoal(goal.id, payload);
      // regenerate: drop future, not-yet-completed sessions from the old plan
      const stale = workouts.filter((w) => w.goalId === goal.id && w.status === 'planned' && w.date >= todayISO());
      for (const w of stale) await removeWorkout(w.id);
    } else {
      const saved = await addGoal(payload);
      goalId = saved.id;
    }
    const sessions = buildPlan(todayISO(), weeks, daysPerWeek, baselineValue, targetValue);
    for (const s of sessions) {
      await addWorkout({
        date: s.date, activityType: activityTypeId, status: 'planned', goalId,
        metrics: { goalTarget: formatSessionTarget(s.targetValue) },
      });
    }
    onClose();
  }

  return (
    <div className="ft-modal-backdrop" onClick={onClose}>
      <div className="ft-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ft-modal-head">
          <h3>{editing ? 'Edit goal' : 'New goal'}</h3>
          <button type="button" className="ft-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

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

        <label className="ft-field-label">Days per week</label>
        <p className="ft-hint-sm">How many days a week you'll train toward this goal — more days shortens the forecast below, and sets how many sessions get added to your calendar once you accept.</p>
        <div className="ft-move-days" style={{ marginBottom: 14 }}>
          {DAYS_OPTIONS.map((d) => (
            <button key={d} type="button" className={`ft-btn-ghost${daysPerWeek === d ? ' active' : ''}`} onClick={() => setDaysPerWeek(d)}>{d}</button>
          ))}
        </div>

        <div className="ft-insights">
          <div className="ft-insight">
            <span className="ft-insight-k">Current{baselineSourceNote ? ` (${baselineSourceNote})` : ''}</span>
            <span className="ft-insight-v">{baselineDisplay}</span>
          </div>
          <div className="ft-insight">
            <span className="ft-insight-k">Forecast</span>
            <span className="ft-insight-v">
              {weeks == null ? '—' : weeks === 0 ? 'Already there' : `~${weeks} wk${weeks === 1 ? '' : 's'}`}
            </span>
          </div>
          {targetDate && <div className="ft-insight"><span className="ft-insight-k">Target date</span><span className="ft-insight-v">{targetDate}</span></div>}
        </div>
        {!canForecast && (
          <p className="ft-hint-sm ft-goal-incomplete-hint">
            {kind === 'run' && !runDistanceM && 'Enter a distance to continue. '}
            {baselineValue == null && 'Enter a "Current" value above — '}
            {targetValue == null && 'Enter a target value above — '}
            {(baselineValue == null || targetValue == null) && "there's no logged history to estimate from yet, so this needs to be typed in."}
          </p>
        )}
        <p className="ft-hint-sm">Forecast is a planning estimate from a training-frequency heuristic, not a guarantee — revise it as real results come in.</p>

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
