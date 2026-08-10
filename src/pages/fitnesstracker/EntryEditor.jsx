import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFitness } from './fitnessContext';
import { RPE_MIN, RPE_MAX, RPE_LEGEND, groupById } from './fitnessConfig';
import GroupPicker from './GroupPicker';
import ClearableInput from './ClearableInput';
import StatusToggle from './StatusToggle';
import useModalKeys from './useModalKeys';
import {
  distanceToMeters, metersToDistance, clockToSec, secToClock,
  metersToElev, elevToMeters, elevUnitLabel, weightToKg, kgToWeight,
} from './units';
import { paceSecPerMeter } from './calc/pace';
import { vdotFromRace } from './calc/vdot';
import { gradeAdjustedPace, gradeFrom } from './calc/gap';
import { zoneForHr } from './calc/hr';
import { per100, swolf } from './calc/swim';
import { extractCheckpointResult } from './calc/goals';
import { formatCheckpointValue, interpolatedTarget, parseOverrideValue, overridePlaceholderFor } from './calc/checkpoints';
import { fmtPace } from './format';
import LiftSets from './LiftSets';
import { shiftPlanFrom, shiftGroup, addDaysISO } from './calc/planning';
import GoalEditorModal from './GoalEditorModal';

function round2(n) { return Math.round(n * 100) / 100; }

// Full edit view (route: entry/:id). Branches by activity kind: lift gets a
// set/1RM editor, swim gets pool/SWOLF/CSS metrics, run/generic gets elevation +
// HR + the pace/GAP/VDOT/zone insights — all computed live as you type.
export default function EntryEditor({ id: idProp, onClose }) {
  // Two mounting modes. The calendar opens this as a MODAL (id + onClose
  // props); /MFT/entry/:id still works as a route for deep links and the
  // browser back button. `close()` is whichever exit applies.
  const params = useParams();
  const id = idProp ?? params.id;
  const navigate = useNavigate();
  const close = onClose || (() => navigate('..'));

  // Esc/Enter must be wired before the early returns below (rules of hooks),
  // yet `save` isn't defined until after them — so the handlers are read from a
  // ref at keypress time. useCallback keeps the listener from re-registering
  // on every render.
  const actionsRef = useRef({});
  actionsRef.current.close = close;
  useModalKeys({
    onClose: useCallback(() => actionsRef.current.close?.(), []),
    onSubmit: useCallback(() => actionsRef.current.save?.(), []),
  });
  const { getWorkout, updateWorkout, removeWorkout, workouts, activityTypes, settings, loading, goals, logCheckpoint } = useFitness();
  const unit = settings.units.distance;
  const poolUnit = settings.units.pool;
  const weightUnit = settings.units.weight;
  const units = settings.units;
  const profile = settings.profile || {};
  const w = getWorkout(id);
  const kindOf = (aid) => activityTypes.find((t) => t.id === aid)?.kind || 'generic';
  const linkedGoal = w?.goalId ? goals.find((g) => g.id === w.goalId) : null;
  // Derived live from goal.checkpoints (single source of truth) — null for
  // old goals saved before checkpoints existed, or a date with no checkpoint.
  const checkpoint = (w && linkedGoal?.checkpoints) ? linkedGoal.checkpoints.find((c) => c.date === w.date) || null : null;
  // A plain task-frequency day (goal-tagged, but not a graded checkpoint)
  // still gets an on-pace estimate shown in the banner — just not the full
  // checkpoint panel (nothing to log/override on a day that isn't scheduled).
  const onPaceOnly = (!checkpoint && w && linkedGoal?.checkpoints) ? interpolatedTarget(linkedGoal, w.date) : null;

  const [form, setForm] = useState(null);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [overrideInput, setOverrideInput] = useState('');
  const [seededKey, setSeededKey] = useState(null);
  const [hoverRpe, setHoverRpe] = useState(null);
  const [showMoveMore, setShowMoveMore] = useState(false);
  const [moveDays, setMoveDays] = useState(1);
  const [checkedIds, setCheckedIds] = useState(() => new Set());
  const seedKey = w ? `${w.id}|${unit}|${poolUnit}|${weightUnit}` : null;
  if (w && seedKey !== seededKey) {
    setSeededKey(seedKey);
    const m = w.metrics || {};
    const seedKind = kindOf(w.activityType);
    const seedDistUnit = seedKind === 'swim' ? poolUnit : unit;
    setForm({
      date: w.date,
      time: w.time || '',
      activityType: w.activityType,
      title: w.title || '',
      status: w.status,
      distance: w.distanceM != null ? String(round2(metersToDistance(w.distanceM, seedDistUnit))) : '',
      duration: w.durationSec != null ? secToClock(w.durationSec) : '',
      note: w.note || '',
      rpe: w.rpe ?? null,
      groupId: w.groupId ?? null,
      elevGain: m.elevationGainM != null ? String(Math.round(metersToElev(m.elevationGainM, unit))) : '',
      elevLoss: m.elevationLossM != null ? String(Math.round(metersToElev(m.elevationLossM, unit))) : '',
      avgHr: m.avgHr != null ? String(m.avgHr) : '',
      poolLength: m.poolLengthM != null ? String(round2(metersToDistance(m.poolLengthM, poolUnit))) : '',
      strokes: m.strokesPerLength != null ? String(m.strokesPerLength) : '',
      exercises: (m.exercises || []).map((ex) => ({
        name: ex.name || '',
        sets: (ex.sets || []).map((s) => ({ reps: s.reps != null ? String(s.reps) : '', weight: s.weightKg != null ? String(round2(kgToWeight(s.weightKg, weightUnit))) : '' })),
      })),
    });
  }

  if (!w) {
    return (
      <div className="ft-editor">
        {loading ? <p className="ft-empty">Loading…</p> : (
          <>
            <p className="ft-empty">Workout not found.</p>
            <button type="button" className="ft-btn-ghost" onClick={close}>← Back to calendar</button>
          </>
        )}
      </div>
    );
  }
  if (!form) return <div className="ft-editor"><p className="ft-empty">Loading…</p></div>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const kind = kindOf(form.activityType);
  const isEvent = kind === 'event';
  const isLift = kind === 'lift';
  const isSwim = kind === 'swim';
  const showElev = kind === 'run' || kind === 'generic';
  const showHr = showElev;
  const distUnit = isSwim ? poolUnit : unit;
  // Lifts log volume via the set editor instead. EVERYTHING else — including
  // events — gets distance + duration: a "Speed 1" event IS a run with mileage,
  // and with no field to put it in there was no way to make Miles add up.
  const showsDistanceField = !isLift;

  // ---- live insights ----
  const distM = distanceToMeters(form.distance, distUnit);
  const durSec = clockToSec(form.duration);
  const secPerM = paceSecPerMeter(distM, durSec);
  const gainM = elevToMeters(form.elevGain, unit) || 0;
  const lossM = elevToMeters(form.elevLoss, unit) || 0;
  const netElevM = gainM - lossM;
  const grade = distM ? gradeFrom(netElevM, distM) : 0;
  const gapSecPerM = secPerM != null && netElevM ? gradeAdjustedPace(secPerM, grade) : null;
  const effortVdot = kind === 'run' && secPerM != null ? vdotFromRace(distM, durSec) : null;
  const hrZone = form.avgHr ? zoneForHr(Number(form.avgHr), profile.maxHr, profile.restHr) : null;
  const poolLengthM = distanceToMeters(form.poolLength, poolUnit);
  const swimPer100 = isSwim ? per100(distM, durSec, poolUnit) : null;
  const swimSwolf = isSwim && form.strokes && poolLengthM && distM && durSec
    ? swolf(Number(form.strokes), durSec / (distM / poolLengthM)) : null;
  const liftVolume = isLift ? form.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + (Number(s.reps) || 0) * (Number(s.weight) || 0), 0), 0) : 0;

  async function save() {
    const metrics = { ...(w.metrics || {}) };
    if (showElev) { metrics.elevationGainM = elevToMeters(form.elevGain, unit); metrics.elevationLossM = elevToMeters(form.elevLoss, unit); }
    if (showHr) metrics.avgHr = form.avgHr === '' ? null : Number(form.avgHr);
    if (isSwim) {
      metrics.poolLengthM = distanceToMeters(form.poolLength, poolUnit);
      metrics.strokesPerLength = form.strokes === '' ? null : Number(form.strokes);
      metrics.avgHr = form.avgHr === '' ? null : Number(form.avgHr);
    }
    if (isLift) {
      metrics.exercises = form.exercises
        .filter((ex) => ex.name.trim() || ex.sets.some((s) => s.reps || s.weight))
        .map((ex) => ({ name: ex.name.trim(), sets: ex.sets.filter((s) => s.reps || s.weight).map((s) => ({ reps: Number(s.reps) || 0, weightKg: weightToKg(s.weight, weightUnit) })) }));
    }
    // Only overwrite distance from the form when the form actually SHOWED a
    // distance box. Lifts never render one; events didn't either until now.
    // Reading an untouched '' back as null is what silently wiped the distance
    // off every event you opened and saved — which is exactly why the weekly
    // Miles column sat at 0.0 no matter how many runs got marked Done.
    const savedDistanceM = showsDistanceField ? distanceToMeters(form.distance, distUnit) : (w.distanceM ?? null);
    const savedDurationSec = showsDistanceField ? clockToSec(form.duration) : (w.durationSec ?? null);
    await updateWorkout(id, {
      date: form.date,
      time: form.time,
      activityType: form.activityType,
      title: form.title,
      status: form.status,
      distanceM: savedDistanceM,
      durationSec: savedDurationSec,
      note: form.note,
      rpe: form.rpe,
      groupId: form.groupId,
      metrics,
    });
    // Completing a checkpoint-tagged workout with real numbers IS "Logged
    // actual" (guidelinesForecast.md §6) — no separate click needed, reusing
    // the exact formulas the baseline estimators already call.
    if (linkedGoal && checkpoint && form.status === 'completed') {
      const extracted = extractCheckpointResult(
        linkedGoal.kind,
        { activityType: form.activityType, distanceM: savedDistanceM, durationSec: savedDurationSec, metrics },
        linkedGoal.label,
      );
      if (extracted != null) await logCheckpoint(linkedGoal.id, w.date, extracted, 'logged');
    }
    close();
  }

  actionsRef.current.save = save;

  async function del() { await removeWorkout(id); close(); }

  // Manual override — retarget this checkpoint regardless of whether it's
  // occurred yet, distinct from "Logged actual" above (§6).
  async function applyOverride() {
    if (!linkedGoal || !checkpoint) return;
    const val = parseOverrideValue(linkedGoal, overrideInput, weightUnit);
    if (val == null) return;
    await logCheckpoint(linkedGoal.id, checkpoint.date, val, 'override');
    setOverrideInput('');
  }

  const overridePlaceholder = linkedGoal ? overridePlaceholderFor(linkedGoal, weightUnit) : 'e.g. 50';

  // Deliberate reschedule, two ways — neither one silently touches anything you
  // didn't ask for:
  //  1. Group-aware: this workout is tagged into a numbered group, so shift every
  //     workout in that group by the same amount, regardless of what else falls
  //     between them on the calendar.
  //  2. Opt-in checklist: show every OTHER planned workout on/after this date as
  //     an unchecked candidate — nothing moves unless you tick it.
  async function cascadeGroup(days) {
    const updates = shiftGroup(workouts, form.groupId, days);
    for (const u of updates) await updateWorkout(u.id, { date: u.date });
    navigate('..');
  }

  const moveCandidates = shiftPlanFrom(workouts, w.date, moveDays).filter((u) => u.id !== id);

  function toggleCandidate(cid) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cid)) next.delete(cid); else next.add(cid);
      return next;
    });
  }

  async function applyMove() {
    await updateWorkout(id, { date: addDaysISO(w.date, moveDays) });
    for (const c of moveCandidates) if (checkedIds.has(c.id)) await updateWorkout(c.id, { date: c.date });
    navigate('..');
  }

  const group = groupById(settings, form.groupId);
  const candidateType = (aid) => activityTypes.find((t) => t.id === aid)?.name || aid;

  return (
    <div className="ft-editor">
      <div className="ft-editor-head">
        <h2>Edit workout</h2>
        {/* As a dialog this is a close box; as a route it's a way back. Same
            handler, honest label either way. */}
        <button type="button" className={onClose ? 'ft-x' : 'ft-btn-ghost'} onClick={close} aria-label="Close">
          {onClose ? '✕' : '← Calendar'}
        </button>
      </div>

      {linkedGoal && (
        <div className="ft-goal-banner">
          <span>
            Part of goal: <strong>{linkedGoal.label || linkedGoal.kind}</strong>
            {checkpoint && ` — target ${formatCheckpointValue(linkedGoal, checkpoint.targetValue, units)}`}
            {!checkpoint && onPaceOnly != null && ` — on-pace target ${formatCheckpointValue(linkedGoal, onPaceOnly, units)}`}
            {!checkpoint && onPaceOnly == null && w.metrics?.goalTarget && ` — target ${w.metrics.goalTarget}`}
          </span>
          <button type="button" className="ft-btn-ghost" onClick={() => setShowGoalEditor(true)}>Edit goal</button>
        </div>
      )}

      {linkedGoal && checkpoint && (
        <div className="ft-checkpoint-panel">
          <div className="ft-insights">
            <div className="ft-insight">
              <span className="ft-insight-k">Checkpoint target</span>
              <span className="ft-insight-v">
                {checkpoint.actualValue != null
                  ? <>{formatCheckpointValue(linkedGoal, checkpoint.actualValue, units)}<small> / {formatCheckpointValue(linkedGoal, checkpoint.targetValue, units)}</small></>
                  : formatCheckpointValue(linkedGoal, checkpoint.targetValue, units)}
              </span>
            </div>
            {checkpoint.realism && (
              <div className="ft-insight">
                <span className="ft-insight-k">Realism</span>
                <span className={`ft-insight-v ft-realism-${checkpoint.realism.band}`}>{checkpoint.realism.band}</span>
              </div>
            )}
            {checkpoint.provisional && (
              <div className="ft-insight"><span className="ft-insight-k">Basis</span><span className="ft-insight-v">Provisional — no real data yet</span></div>
            )}
          </div>
          <div className="ft-field">
            <label className="ft-field-label">Manual override — retarget this checkpoint</label>
            <div className="ft-inline-two">
              <ClearableInput value={overrideInput} onChange={(e) => setOverrideInput(e.target.value)} onClear={() => setOverrideInput('')} placeholder={overridePlaceholder} />
              <button type="button" className="ft-btn-ghost" onClick={applyOverride} disabled={overrideInput === ''}>Apply</button>
            </div>
            <p className="ft-hint-sm">Retargets this point and recomputes everything after it — nothing before it moves. Completing this workout with real numbers below logs the actual result instead.</p>
          </div>
        </div>
      )}

      <label className="ft-field-label">Activity</label>
      <div className="ft-type-row">
        {activityTypes.map((t) => (
          <button key={t.id} type="button"
            className={`ft-type-btn${form.activityType === t.id ? ' active' : ''}`}
            style={form.activityType === t.id ? { borderColor: t.color, background: t.color + '22' } : undefined}
            onClick={() => set('activityType', t.id)}>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {isEvent && (
        <div className="ft-field">
          <label className="ft-field-label">Event name</label>
          <ClearableInput value={form.title} onChange={(e) => set('title', e.target.value)} onClear={() => set('title', '')} placeholder='e.g. "POGO Raichu day"' />
        </div>
      )}

      <StatusToggle value={form.status} onChange={(v) => set('status', v)} />

      <div className="ft-two">
        <div className="ft-field"><label className="ft-field-label">Date</label><input className="ft-input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
        <div className="ft-field"><label className="ft-field-label">Time</label><input className="ft-input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></div>
      </div>

      {isLift ? (
        <>
          <div className="ft-field" style={{ maxWidth: 220 }}>
            <label className="ft-field-label">Duration</label>
            <input className="ft-input" value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="mm:ss or min" />
          </div>
          <label className="ft-field-label">Exercises</label>
          <LiftSets exercises={form.exercises} weightUnit={weightUnit} onChange={(next) => set('exercises', next)} />
        </>
      ) : (
        <>
          <div className="ft-two">
            <div className="ft-field"><label className="ft-field-label">Distance ({distUnit})</label><ClearableInput inputMode="decimal" value={form.distance} onChange={(e) => set('distance', e.target.value)} onClear={() => set('distance', '')} placeholder="e.g. 5" /></div>
            <div className="ft-field"><label className="ft-field-label">Duration</label><ClearableInput value={form.duration} onChange={(e) => set('duration', e.target.value)} onClear={() => set('duration', '')} placeholder="mm:ss or min" /></div>
          </div>
          {isEvent && <p className="ft-hint-sm">Optional on an event — but a run logged as an event only counts toward your weekly Miles if its distance is here.</p>}

          {isSwim && (
            <div className="ft-two">
              <div className="ft-field"><label className="ft-field-label">Pool length ({poolUnit})</label><ClearableInput inputMode="decimal" value={form.poolLength} onChange={(e) => set('poolLength', e.target.value)} onClear={() => set('poolLength', '')} placeholder="e.g. 25" /></div>
              <div className="ft-field"><label className="ft-field-label">Strokes / length</label><ClearableInput inputMode="numeric" value={form.strokes} onChange={(e) => set('strokes', e.target.value)} onClear={() => set('strokes', '')} placeholder="e.g. 18" /></div>
            </div>
          )}

          {(showElev || isSwim) && (
            <div className="ft-two">
              {showElev && (
                <div className="ft-field">
                  <label className="ft-field-label">Elev gain / loss ({elevUnitLabel(unit)})</label>
                  <div className="ft-inline-two">
                    <ClearableInput inputMode="numeric" value={form.elevGain} onChange={(e) => set('elevGain', e.target.value)} onClear={() => set('elevGain', '')} placeholder="↑" />
                    <ClearableInput inputMode="numeric" value={form.elevLoss} onChange={(e) => set('elevLoss', e.target.value)} onClear={() => set('elevLoss', '')} placeholder="↓" />
                  </div>
                </div>
              )}
              {showHr && <div className="ft-field"><label className="ft-field-label">Avg HR (bpm)</label><ClearableInput inputMode="numeric" value={form.avgHr} onChange={(e) => set('avgHr', e.target.value)} onClear={() => set('avgHr', '')} placeholder="e.g. 155" /></div>}
              {isSwim && <div className="ft-field"><label className="ft-field-label">Avg HR (bpm)</label><ClearableInput inputMode="numeric" value={form.avgHr} onChange={(e) => set('avgHr', e.target.value)} onClear={() => set('avgHr', '')} placeholder="optional" /></div>}
            </div>
          )}
        </>
      )}

      {/* insights */}
      {(secPerM != null || isLift) && (
        <div className="ft-insights">
          {isLift ? (
            <div className="ft-insight"><span className="ft-insight-k">Volume</span><span className="ft-insight-v">{Math.round(liftVolume)} {weightUnit}</span></div>
          ) : isSwim ? (
            <>
              {swimPer100 != null && <div className="ft-insight"><span className="ft-insight-k">Pace /100{poolUnit}</span><span className="ft-insight-v">{secToClock(Math.round(swimPer100))}</span></div>}
              {swimSwolf != null && <div className="ft-insight"><span className="ft-insight-k">SWOLF</span><span className="ft-insight-v">{Math.round(swimSwolf)}</span></div>}
            </>
          ) : (
            <>
              <div className="ft-insight"><span className="ft-insight-k">Pace</span><span className="ft-insight-v">{fmtPace(secPerM, 'mi')} · {fmtPace(secPerM, 'km')}</span></div>
              {gapSecPerM != null && <div className="ft-insight"><span className="ft-insight-k">Grade-adj</span><span className="ft-insight-v">{fmtPace(gapSecPerM, 'mi')} <small>({grade >= 0 ? '+' : ''}{(grade * 100).toFixed(1)}%)</small></span></div>}
              {effortVdot != null && effortVdot > 0 && <div className="ft-insight"><span className="ft-insight-k">Effort VDOT</span><span className="ft-insight-v">{effortVdot.toFixed(1)}</span></div>}
              {hrZone && <div className="ft-insight"><span className="ft-insight-k">HR zone</span><span className="ft-insight-v">{hrZone.name}</span></div>}
            </>
          )}
        </div>
      )}

      <div className="ft-field">
        <label className="ft-field-label">Note</label>
        <ClearableInput value={form.note} onChange={(e) => set('note', e.target.value)} onClear={() => set('note', '')} placeholder="how'd it feel?" />
      </div>

      <div className="ft-field">
        <label className="ft-field-label">RPE{form.rpe ? ` — ${form.rpe}/10` : ''}</label>
        <div className="ft-rpe">
          {Array.from({ length: RPE_MAX - RPE_MIN + 1 }, (_, i) => RPE_MIN + i).map((n) => (
            <button
              key={n} type="button" className={`ft-rpe-btn${form.rpe === n ? ' active' : ''}`}
              onClick={() => set('rpe', form.rpe === n ? null : n)}
              onMouseEnter={() => setHoverRpe(n)} onMouseLeave={() => setHoverRpe(null)}
              onFocus={() => setHoverRpe(n)} onBlur={() => setHoverRpe(null)}
            >{n}</button>
          ))}
        </div>
        <p className="ft-rpe-caption">{RPE_LEGEND[hoverRpe ?? form.rpe] || ''}</p>
      </div>

      <GroupPicker value={form.groupId} onChange={(gid) => set('groupId', gid)} />

      {form.status === 'planned' && (
        <div className="ft-cascade">
          <span className="ft-field-label">Reschedule</span>
          <div className="ft-cascade-btns">
            {group && (
              <>
                <button type="button" className="ft-btn-ghost" onClick={() => cascadeGroup(-1)}>−1 day <span className="ft-cascade-group-tag" style={{ color: group.color }}>+ Group #{group.number}</span></button>
                <button type="button" className="ft-btn-ghost" onClick={() => cascadeGroup(1)}>+1 day <span className="ft-cascade-group-tag" style={{ color: group.color }}>+ Group #{group.number}</span></button>
                <button type="button" className="ft-btn-ghost" onClick={() => cascadeGroup(7)}>+1 week <span className="ft-cascade-group-tag" style={{ color: group.color }}>+ Group #{group.number}</span></button>
              </>
            )}
            <button type="button" className="ft-btn-ghost" onClick={() => setShowMoveMore((s) => !s)}>
              {showMoveMore ? 'Cancel move' : 'Move & choose what else…'}
            </button>
          </div>

          {showMoveMore && (
            <div className="ft-move-picker">
              <span className="ft-field-label">Shift by</span>
              <div className="ft-move-days">
                {[-1, 1, 7].map((d) => (
                  <button key={d} type="button" className={`ft-btn-ghost${moveDays === d ? ' active' : ''}`} onClick={() => setMoveDays(d)}>
                    {d > 0 ? `+${d}` : d} day{Math.abs(d) > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              {moveCandidates.length === 0 ? (
                <p className="ft-hint-sm">No other planned sessions on/after this date.</p>
              ) : (
                <div className="ft-move-candidates">
                  {moveCandidates.map((c) => {
                    const cw = workouts.find((x) => x.id === c.id);
                    return (
                      <label key={c.id} className="ft-move-candidate">
                        <input type="checkbox" checked={checkedIds.has(c.id)} onChange={() => toggleCandidate(c.id)} />
                        <span>{cw ? candidateType(cw.activityType) : ''} — {c.from} → {c.date}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <button type="button" className="ft-btn-primary" onClick={applyMove}>Apply move</button>
            </div>
          )}
        </div>
      )}

      <div className="ft-editor-actions">
        <button type="button" className="ft-btn-danger" onClick={del}>Delete</button>
        <div className="ft-spacer" />
        <button type="button" className="ft-btn-ghost" onClick={close}>Cancel</button>
        <button type="button" className="ft-btn-primary" onClick={save}>Save</button>
      </div>

      {showGoalEditor && linkedGoal && (
        <GoalEditorModal goal={linkedGoal} onClose={() => setShowGoalEditor(false)} />
      )}
    </div>
  );
}
