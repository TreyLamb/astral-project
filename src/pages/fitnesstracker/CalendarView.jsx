import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitness } from './fitnessContext';
import { activityType, mealType, isoDate, todayISO, resolveGroups, goalDeadline } from './fitnessConfig';
import { formatDistance, secToClock } from './units';
import { formatCheckpointValue, interpolatedTarget, parseOverrideValue, overridePlaceholderFor } from './calc/checkpoints';
import { addDaysISO } from './calc/planning';
import { parseDistanceTotalM } from './calc/shorthand';
import { netCaloriesForDay, latestBodyWeightKg } from './calc/calories';
import { KCAL_PER_LB_ADIPOSE } from './calc/bodyComposition';
import GroupPicker from './GroupPicker';
import MealDayView from './MealDayView';
import GoalEditorModal from './GoalEditorModal';
import ClearableInput from './ClearableInput';
import BaseSelect from './BaseSelect';
import useModalKeys from './useModalKeys';
import { isTypingTarget } from './useModalKeys';
import { useAuth } from '../../AuthContext';
import { firebaseReady } from '../../firebase';
import { loadOrbitBridgeData, setOrbitDayLocation, addOrbitBase, setOrbitDayLocationsRange } from './orbitTasksBridge';

// Army Combat Fitness Test personal targets — static reference data, not
// computed from anything. Mirrors src/pages/fitnesstracker/Guidelines_AFT
// (90/100 score tiers only, per the owner's request); keep in sync by hand
// if that file changes.
const AFT_EVENTS = [
  { id: 'mdl', abbr: 'MDL', name: '3-Rep Max Deadlift (Hex Bar)', unit: 'lb', tiers: { 90: 297, 100: 350 }, lowerIsBetter: false },
  { id: 'hrp', abbr: 'HRP', name: 'Hand-Release Push-up (reps in 2 min)', unit: 'reps', tiers: { 90: 44, 100: 57 }, lowerIsBetter: false },
  { id: 'sdc', abbr: 'SDC', name: 'Sprint-Drag-Carry (5x50m: sprint/drag/lateral/carry/sprint)', unit: 'time', tiers: { 90: '1:55', 100: '1:40' }, lowerIsBetter: true },
  { id: 'plank', abbr: 'PLANK', name: 'Plank (time held)', unit: 'time', tiers: { 90: '2:48', 100: '3:20' }, lowerIsBetter: false },
  { id: 'run2mi', abbr: '2MR', name: 'Two-Mile Run', unit: 'time', tiers: { 90: '16:14', 100: '14:05' }, lowerIsBetter: true },
];
function formatAftTier(ev, tier) {
  const v = ev.tiers[tier];
  if (ev.unit === 'lb') return `${v} lb`;
  if (ev.unit === 'reps') return `${v} reps`;
  return v; // time tiers are already mm:ss strings
}

// The "where I am" base governing a day: an explicit day tag wins, else the
// home base (mirrors orbit/calc/baseLocation.baseForDate — kept tiny + inline
// so the calendar stays behind the Orbit bridge rather than importing its calc).
function resolveBase(iso, bases, dayLocations) {
  const id = dayLocations[iso];
  if (id) { const b = bases.find((x) => x.id === id); if (b) return b; }
  return bases.find((b) => b.isHome) || null;
}

// Collapse the {iso→baseId} map into consecutive-day ranges per base, sorted by
// start — what the "Where I'll be" panel lists so trips are visible/clearable.
function groupDayLocationRanges(dayLocations, bases) {
  const byId = new Map(bases.map((b) => [b.id, b]));
  const isos = Object.keys(dayLocations).filter((iso) => dayLocations[iso]).sort();
  const out = [];
  for (const iso of isos) {
    const baseId = dayLocations[iso];
    const prev = out[out.length - 1];
    if (prev && prev.baseId === baseId && addDaysISO(prev.to, 1) === iso) prev.to = iso;
    else out.push({ baseId, base: byId.get(baseId) || null, from: iso, to: iso });
  }
  return out;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d) { return addDays(d, -new Date(d).getDay()); }
// Signed day count (bISO - aISO), unlike calc/checkpoints.js's daysBetween
// which clamps to non-negative — a drag/paste can move a date EARLIER.
function signedDaysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T00:00:00').getTime();
  const b = new Date(bISO + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}

// Fields worth carrying over when duplicating/pasting a workout onto a new
// date — everything except identity/audit fields, which addWorkout/newWorkout
// regenerate fresh.
function cloneableFields(w) {
  return {
    time: w.time, activityType: w.activityType, status: w.status, durationSec: w.durationSec,
    distanceM: w.distanceM, note: w.note, rpe: w.rpe, groupId: w.groupId, goalId: w.goalId, metrics: w.metrics,
  };
}

// Worst realism band across a goal's checkpoints — shown as a small summary
// badge on the goal row, informational only (never blocks Edit/Accept/Pause).
const REALISM_RANK = { conservative: 0, plausible: 1, implausible: 2 };
function worstRealismBand(g) {
  if (!g.checkpoints?.length) return null;
  let worst = null;
  for (const cp of g.checkpoints) {
    const band = cp.realism?.band;
    if (!band) continue;
    if (!worst || REALISM_RANK[band] > REALISM_RANK[worst]) worst = band;
  }
  return worst;
}

// For every forecasted goal, the ON-PACE target at that Saturday — the curve
// evaluated at that date, not the nearest discrete checkpoint. Checkpoints
// can be sparse (weekly/monthly cadence), so snapping to "the last checkpoint
// on or before this week" would show the same value for several weeks in a
// row and could jump straight to the final goal value early on for a
// short/coarse-cadence goal. The interpolated curve gives an actual
// week-over-week progression between baseline and the end goal.
// Total distance actually logged (completed workouts only — "tracked", not
// planned) within [sunISO, satISO] inclusive, for the weekly summary column.
function weekTrackedDistanceM(workouts, sunISO, satISO) {
  let total = 0;
  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    if (w.date >= sunISO && w.date <= satISO) total += workoutDistanceM(w);
  }
  return total;
}

// A workout's distance, falling back to whatever distance is written into its
// own title/note when no explicit distanceM was entered. Events were saved with
// distanceM: null unconditionally, and doc-derived sessions ("Easy 1.5 mi @
// 11:10/mi") never had the field filled in — so the Miles column summed to 0.0
// no matter how many runs got marked done. See parseDistanceTotalM.
export function workoutDistanceM(w) {
  if (w.distanceM != null) return w.distanceM;
  return parseDistanceTotalM(w.title || '') || parseDistanceTotalM(w.note || '');
}

// Sum of netCaloriesForDay across a week's 7 days — same missing-bmr/weight-
// degrades-to-0 behavior as the per-day function, nothing new to guard here.
function weekNetCalories(meals, workouts, sunISO, satISO, bmr, bodyWeightKg) {
  let total = 0;
  const start = new Date(sunISO + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    total += netCaloriesForDay(meals, workouts, isoDate(d), bmr, bodyWeightKg);
  }
  return total;
}

function weekEndGoals(goals, activityTypes, saturdayISO) {
  const out = [];
  for (const g of goals) {
    if (!g.checkpoints?.length) continue;
    const deadline = goalDeadline(g);
    if (!deadline || saturdayISO < g.startDate || saturdayISO > deadline) continue;
    const value = interpolatedTarget(g, saturdayISO);
    if (value != null) out.push({ goal: g, type: activityType(activityTypes, g.activityType), targetValue: value });
  }
  return out;
}

// Plain green marker, not the activity's own pictogram — this is a goal
// summary, not another workout chip, so it shouldn't look like one. Colored
// to match that goal's own activity color (same color as its row in the
// Goals panel) so multiple goals stay visually distinguishable at a glance.
// The target text is always ON the badge, not hidden behind a hover tooltip.
// Clicking it opens a quick override — every week's on-pace number is a real,
// editable touch point, not just a read-only preview.
function WeekEndBadge({ goal, type, targetValue, units, onClick }) {
  const targetText = formatCheckpointValue(goal, targetValue, units);
  return (
    <button
      type="button" className="ft-weekend-badge"
      style={{ borderColor: type.color, background: type.color + '1f', color: type.color }}
      onClick={onClick}
      title={`${goal.label || goal.kind} — end of week (click to retarget)`}
    >
      <span className="ft-weekend-dot" style={{ background: type.color, boxShadow: `0 0 6px ${type.color}b3` }} aria-hidden="true" />
      <span className="ft-weekend-text" style={{ color: type.color }}>{targetText}</span>
    </button>
  );
}

function chipLabel(w, units) {
  if (w.distanceM != null) {
    const digits = (units.distance === 'm' || units.distance === 'yd') ? 0 : 2;
    return formatDistance(w.distanceM, units.distance, digits);
  }
  if (w.durationSec != null) return secToClock(w.durationSec);
  return '';
}

function WorkoutChip({ w, type, label, group, goal, units, checkpoint, selected, selectedIds, onEdit, onCtrlClick, onShiftClick, onAltClick }) {
  const completed = w.status === 'completed';
  // Type is carried by TEXT COLOUR alone — no icon, no border, no fill. Running
  // stays orange, swimming blue, etc. (the colours come from the activity type,
  // unchanged), but a day cell now reads as a short list of coloured lines
  // rather than a stack of boxed badges. Planned vs done is weight + opacity:
  // done is solid and bold, planned is dimmed.
  const style = { color: type.color };
  // Target (and, once logged, actual) render INLINE on the chip now, not only
  // in the hover tooltip — the tooltip below stays as a bonus, not the only
  // source of this info (that was the gap: goal targets were hover-only).
  const targetText = checkpoint ? formatCheckpointValue(goal, checkpoint.targetValue, units) : (w.metrics?.goalTarget || null);
  const actualText = checkpoint?.actualValue != null ? formatCheckpointValue(goal, checkpoint.actualValue, units) : null;
  const realism = checkpoint?.realism;
  const goalTarget = w.metrics?.goalTarget;
  return (
    <button
      type="button"
      data-id={w.id}
      className={`ft-chip${completed ? ' ft-chip-done' : ' ft-chip-planned'}${selected ? ' ft-chip-selected' : ''}${type.kind === 'event' ? ' ft-chip-event' : ''}`}
      style={style}
      draggable
      onDragStart={(e) => {
        // Dragging a chip that's part of a multi-selection carries the WHOLE
        // selection, not just the one grabbed — every selected chip moves (or
        // duplicates) by the same day-offset, preserving their relative
        // spacing, same principle as the existing group-cascade reschedule.
        const ids = (selected && selectedIds.size > 1) ? [...selectedIds] : [w.id];
        e.dataTransfer.setData('text/plain', JSON.stringify({ ids, fromDate: w.date }));
        e.dataTransfer.effectAllowed = 'copyMove';
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Alt/Option+click = instant delete, no confirm dialog (same
        // no-friction principle as Shift-drag=duplicate and the Delete-key
        // hotkey) — Tab was the first suggestion but holding Tab fights the
        // browser's own focus-navigation behavior, so Alt (a modifier with no
        // native meaning on a click) is used instead.
        if (e.altKey) { onAltClick(w.id); return; }
        if (e.ctrlKey || e.metaKey) { onCtrlClick(w.id); return; }
        if (e.shiftKey) { onShiftClick(w.id); return; }
        onEdit(w.id);
      }}
      title={`${type.name}${label ? ' · ' + label : ''} (${completed ? 'done' : 'planned'})${group ? ` · Group #${group.number}` : ''}${goal ? ` · 🎯 ${goal.label || goal.activityType} goal${goalTarget ? ' — ' + goalTarget : ''}` : ''}${realism?.band === 'implausible' ? ` · ⚠ ${realism.note}` : ''} · Alt+click to delete`}
    >
      <span className="ft-chip-labels">
        {label && <span className="ft-chip-text">{label}</span>}
        {targetText && (
          <span className="ft-chip-target">
            {actualText ? <>{actualText}<small> / {targetText}</small></> : targetText}
          </span>
        )}
      </span>
      {/* The 🎯 goal pin is gone — the target VALUE already renders above, which
          is the useful half. ⚠ stays: it only appears on an implausible
          checkpoint, so it's an exception marker, not decoration. */}
      {realism?.band === 'implausible' && <span className="ft-chip-realism-flag" aria-hidden="true">⚠</span>}
      {group && <span className="ft-chip-group-dot" style={{ background: group.color }} />}
    </button>
  );
}

function MealChip({ m, type, selected, onEdit, onCtrlClick, onShiftClick }) {
  const logged = m.status === 'logged';
  const style = { color: type.color };
  const label = m.name || type.name;
  return (
    <button
      type="button"
      data-mid={m.id}
      className={`ft-chip ft-meal-chip${logged ? ' ft-chip-done' : ' ft-chip-planned'}${selected ? ' ft-chip-selected' : ''}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) { onCtrlClick(m.id); return; }
        if (e.shiftKey) { onShiftClick(m.id); return; }
        onEdit(m.id);
      }}
      title={`${type.name}${m.name ? ' · ' + m.name : ''}${m.calories != null ? ` · ${m.calories} kcal` : ''} (${logged ? 'logged' : 'planned'})`}
    >
      <span className="ft-chip-text">{label}</span>
    </button>
  );
}

// Orbit to-do chip — deliberately NOT built on WorkoutChip/MealChip (no
// drag, no target/actual, different icon family) so it reads as an obviously
// different kind of thing on the grid, per the integration's "clearly
// different from workouts/meals" requirement. `due` renders the lighter
// "due today, scheduled elsewhere (or nowhere)" marker variant; killed tasks
// are filtered out before this ever renders (see orbitScheduled/orbitDue
// below), done tasks render struck+dimmed rather than being hidden — still
// useful context ("I did that"), unlike killed ("no longer relevant").
function OrbitTaskChip({ task, area, due, onOpen }) {
  const done = task.status === 'done';
  const color = area?.color || '#94a3b8';
  const style = { color };
  const title = task.title || '(untitled)';
  return (
    <button
      type="button"
      className={`ft-orbit-chip${done ? ' ft-orbit-chip-done' : ''}${due ? ' ft-orbit-chip-due' : ''}`}
      style={style}
      onClick={(e) => { e.stopPropagation(); onOpen(task); }}
      title={`${title}${area ? ' · ' + area.name : ''}${due ? ' · due' : ''} — Orbit to-do, click to open in Orbit`}
    >
      <span className="ft-orbit-chip-text">{title}</span>
    </button>
  );
}

// (The per-day "+ to-do" quick-add lived here; adding to-dos now happens in
// the QuickAddModal's To-do mode, which writes straight to Orbit and fires an
// 'orbit-tasks-changed' event so this calendar refreshes.)

// Chip text size is MEASURED, not fixed. A day holding one session renders it
// at the largest size the view allows; as sessions pile up the text steps down
// toward that view's minimum, and only once it hits the floor does the list
// start to scroll. Each view gets its own band — a Day cell has ~20x the room a
// Month cell does, so sharing one size would waste all of it.
//
// px (not rem) because the whole point is fitting a measured pixel height.
const CHIP_SIZE_RANGE = { month: [10, 16], week: [12, 22], day: [15, 30] };
const CHIP_LINE_HEIGHT = 1.32;
const CHIP_V_PADDING = 3;   // .ft-chip padding, top + bottom
const CHIP_GAP = 2;         // .ft-cell-items row-gap

function useAutoChipSize(variant, count) {
  const ref = useRef(null);
  const [min, max] = CHIP_SIZE_RANGE[variant] || CHIP_SIZE_RANGE.month;
  const [size, setSize] = useState(max);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (!count) { setSize(max); return; }
      // clientHeight is safe to read here: .ft-cell-items is flex:1 inside a
      // cell of externally-determined height with min-height:0 and overflow
      // hidden, so its box does NOT grow with its content. No feedback loop.
      const avail = el.clientHeight;
      if (!avail) return;
      const perItem = avail / count - CHIP_GAP - CHIP_V_PADDING;
      setSize(Math.max(min, Math.min(max, Math.floor(perItem / CHIP_LINE_HEIGHT))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [variant, count, min, max]);

  return [ref, size];
}

function DayCell({
  date, items, types, units, groups, goalsById, selected, isToday, inMonth, variant, onAdd, onEdit, onCtrlClick, onShiftClick, onAltClick, onDropWorkout,
  showMeals, mealItems, mealTypes, mealSelected, onAddMeal, onEditMeal, onMealCtrlClick, onMealShiftClick,
  allWorkouts, meals, bmr, calorieGoal, bodyWeightKg,
  orbitScheduled, orbitDue, orbitAreaById, onOrbitOpen, orbitEnergyCap,
  bases, dayLocations, onOpenWhere, sizeVariant,
}) {
  const iso = isoDate(date);
  const [over, setOver] = useState(false);
  const orbitEnergy = orbitScheduled.reduce((s, t) => s + (t.energy || 0), 0);
  const whereBase = resolveBase(iso, bases, dayLocations);
  // netCaloriesForDay filters by date itself, so the FULL workouts array is
  // passed through (allWorkouts), not `items` which is already this-day-only.
  const net = calorieGoal != null ? netCaloriesForDay(meals, allWorkouts, iso, bmr, bodyWeightKg) : null;

  // Meals share the cell when that toggle is on, so each column only gets a
  // fraction of the height — size against the count that column actually holds.
  const [itemsRef, chipSize] = useAutoChipSize(sizeVariant || variant, items.length);
  // The meals column is a sibling of the same height, so it gets the same
  // treatment rather than sitting at a fixed size next to auto-sized workouts.
  const [mealsRef, mealChipSize] = useAutoChipSize(sizeVariant || variant, mealItems.length);
  const eventsCol = (
    <div className="ft-cell-items" ref={itemsRef} style={{ '--ft-chip-size': `${chipSize}px` }}>
      {items.map((w) => {
        const t = activityType(types, w.activityType);
        const group = w.groupId ? groups.find((g) => g.id === w.groupId) || null : null;
        const goal = w.goalId ? goalsById.get(w.goalId) || null : null;
        // Checkpoint is derived live from goal.checkpoints (single source of
        // truth for the recompute engine) rather than persisted onto the
        // workout row — old goals (saved before checkpoints existed) have
        // checkpoints===null, so this is null for them and the chip falls
        // back to the old metrics.goalTarget string, unchanged.
        //
        // Days tied to the goal that AREN'T a real checkpoint (plain task-
        // frequency training days between the sparser checkpoint cadence)
        // still get an on-pace target via interpolation — realism:null so no
        // warning flag renders on what isn't a graded checkpoint, only a
        // friendly estimate. Without this every non-checkpoint day showed no
        // number at all, which read as broken/empty.
        const realCheckpoint = goal?.checkpoints?.find((c) => c.date === w.date) || null;
        let checkpoint = realCheckpoint;
        if (!checkpoint && goal?.checkpoints) {
          const interp = interpolatedTarget(goal, w.date);
          if (interp != null) checkpoint = { targetValue: interp, source: 'interpolated', realism: null, provisional: false, actualValue: null, status: 'pending' };
        }
        // Events carry a title (their name); workouts label by distance/duration.
        // Fall back to note for old event rows saved before the title field existed.
        const label = w.title?.trim() || chipLabel(w, units) || (t.kind === 'event' ? (w.note || '') : '');
        return (
          <WorkoutChip
            key={w.id} w={w} type={t} label={label} group={group} goal={goal} units={units} checkpoint={checkpoint}
            selected={selected.has(w.id)} selectedIds={selected} onEdit={onEdit} onCtrlClick={onCtrlClick} onShiftClick={onShiftClick} onAltClick={onAltClick}
          />
        );
      })}
    </div>
  );

  return (
    <div
      className={`ft-cell ft-cell-${variant}${inMonth ? '' : ' ft-cell-dim'}${isToday ? ' ft-cell-today' : ''}${over ? ' ft-cell-over' : ''}`}
      onClick={() => onAdd(iso)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = e.shiftKey ? 'copy' : 'move'; if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const raw = e.dataTransfer.getData('text/plain');
        if (!raw) return;
        let payload;
        try { payload = JSON.parse(raw); } catch { payload = { ids: [raw], fromDate: iso }; }
        onDropWorkout(payload.ids, payload.fromDate, iso, e.shiftKey);
      }}
    >
      <div className="ft-cell-head">
        <span className="ft-cell-num">{date.getDate()}</span>
        <button
          type="button"
          className={`ft-cell-where${whereBase ? '' : ' ft-cell-where-empty'}`}
          style={whereBase ? { borderColor: whereBase.color, boxShadow: `0 0 5px ${whereBase.color}55` } : undefined}
          onClick={(e) => { e.stopPropagation(); onOpenWhere(iso); }}
          title={whereBase ? `Where you are: ${whereBase.query || whereBase.tag} — click to change` : 'Tag where you are this day (feeds Orbit travel + weather)'}
        >
          {whereBase ? whereBase.tag : '＋'}
        </button>
        {calorieGoal != null && <span className="ft-cell-cal">{net}/{calorieGoal}</span>}
        {variant !== 'month' && <span className="ft-cell-dow">{WEEKDAYS[date.getDay()]}</span>}
      </div>
      {showMeals ? (
        <div className="ft-cell-cols">
          <div
            className="ft-cell-col ft-cell-col-meals"
            ref={mealsRef}
            style={{ '--ft-chip-size': `${mealChipSize}px` }}
            onClick={(e) => { e.stopPropagation(); onAddMeal(iso); }}
          >
            {mealItems.map((m) => {
              const t = mealType(mealTypes, m.mealType);
              return (
                <MealChip
                  key={m.id} m={m} type={t}
                  selected={mealSelected.has(m.id)} onEdit={onEditMeal} onCtrlClick={onMealCtrlClick} onShiftClick={onMealShiftClick}
                />
              );
            })}
          </div>
          <div className="ft-cell-col ft-cell-col-events" onClick={(e) => { e.stopPropagation(); onAdd(iso); }}>
            {eventsCol}
          </div>
        </div>
      ) : eventsCol}
      {/* Orbit to-dos — additive, deliberately its own strip below the fitness
          content (not mixed into eventsCol/mealItems) so it stays visually
          secondary and never competes with workout/meal chips for space. */}
      {(orbitScheduled.length > 0 || orbitDue.length > 0) && (
        <div className="ft-cell-orbit">
          <div className="ft-orbit-chips">
            {orbitScheduled.map((t) => (
              <OrbitTaskChip key={t.id} task={t} area={orbitAreaById.get(t.areaId) || null} due={t.dueDate === iso} onOpen={onOrbitOpen} />
            ))}
            {orbitDue.map((t) => (
              <OrbitTaskChip key={t.id} task={t} area={orbitAreaById.get(t.areaId) || null} due onOpen={onOrbitOpen} />
            ))}
          </div>
        </div>
      )}
      {/* Day's scheduled Orbit energy on a 0–100 scale (share of the day's
          budget). Shown on every month cell — 0/100 for an empty day — so the
          month reads as an energy heat-map at a glance.
          It used to be position:absolute and sat ON TOP of the chips whenever a
          day had more than a couple of entries. It's a normal flow child now,
          pushed to the bottom by margin-top:auto, and the chip list above it
          scrolls (on hover) instead of growing underneath it. */}
      {orbitEnergyCap != null && (variant === 'month' || orbitScheduled.length > 0) && (() => {
        const pct = Math.round((orbitEnergy / orbitEnergyCap) * 100);
        return (
          <div
            className={`ft-cell-energy${pct > 100 ? ' over' : ''}`}
            title={`Orbit energy scheduled: ${orbitEnergy} of ${orbitEnergyCap} budget (${pct}%)`}
          >
            ⚡ {pct}/100
          </div>
        );
      })()}
    </div>
  );
}

// Day view puts the grid in a centre column and fills the space either side
// with the detail there is finally room for. These two panels are also the
// designated place to hang more per-day detail later — the layout reserves the
// room rather than letting Day view stretch one cell across a 1500px screen.
function DayRails({
  side, iso, items, types, units, meals, workouts, bmr, calorieGoal, bodyWeightKg,
  orbitScheduled, orbitDue, orbitAreaById, orbitEnergyCap, onOrbitOpen,
  whereBase, onOpenWhere, weekGoals, weekMilesText, weekRangeLabel, sunISO, satISO,
}) {
  if (side === 'left') {
    const done = items.filter((w) => w.status === 'completed');
    const planned = items.filter((w) => w.status !== 'completed');
    const distDone = done.reduce((a, w) => a + workoutDistanceM(w), 0);
    const distPlanned = planned.reduce((a, w) => a + workoutDistanceM(w), 0);
    const secs = done.reduce((a, w) => a + (w.durationSec || 0), 0);
    const net = calorieGoal != null ? netCaloriesForDay(meals, workouts, iso, bmr, bodyWeightKg) : null;
    const energy = orbitScheduled.reduce((a, t) => a + (t.energy || 0), 0);
    const byType = new Map();
    for (const w of items) {
      const t = activityType(types, w.activityType);
      const cur = byType.get(t.name) || { type: t, n: 0, m: 0 };
      cur.n += 1; cur.m += workoutDistanceM(w);
      byType.set(t.name, cur);
    }
    return (
      <aside className="ft-day-rail">
        <h4 className="ft-day-rail-title">This day</h4>
        <div className="ft-day-stats">
          <div className="ft-day-stat"><span className="ft-day-stat-k">Sessions</span><span className="ft-day-stat-v">{done.length}<small> / {items.length}</small></span></div>
          <div className="ft-day-stat"><span className="ft-day-stat-k">Distance done</span><span className="ft-day-stat-v">{formatDistance(distDone, units.distance, 2)}</span></div>
          <div className="ft-day-stat"><span className="ft-day-stat-k">Still planned</span><span className="ft-day-stat-v">{formatDistance(distPlanned, units.distance, 2)}</span></div>
          <div className="ft-day-stat"><span className="ft-day-stat-k">Time logged</span><span className="ft-day-stat-v">{secs ? secToClock(secs) : '—'}</span></div>
          {net != null && <div className="ft-day-stat"><span className="ft-day-stat-k">Net calories</span><span className="ft-day-stat-v">{net}<small> / {calorieGoal}</small></span></div>}
          {orbitEnergyCap != null && <div className="ft-day-stat"><span className="ft-day-stat-k">Orbit energy</span><span className="ft-day-stat-v">{energy}<small> / {orbitEnergyCap}</small></span></div>}
        </div>
        <h4 className="ft-day-rail-title">Week to date</h4>
        <div className="ft-day-stats">
          {(() => {
            const wk = workouts.filter((x) => x.date >= sunISO && x.date <= satISO);
            const wkDone = wk.filter((x) => x.status === 'completed');
            return (
              <>
                <div className="ft-day-stat"><span className="ft-day-stat-k">Sessions</span><span className="ft-day-stat-v">{wkDone.length}<small> / {wk.length}</small></span></div>
                <div className="ft-day-stat"><span className="ft-day-stat-k">Tracked</span><span className="ft-day-stat-v">{formatDistance(wkDone.reduce((a, x) => a + workoutDistanceM(x), 0), units.distance, 2)}</span></div>
                <div className="ft-day-stat"><span className="ft-day-stat-k">Scheduled</span><span className="ft-day-stat-v">{formatDistance(wk.reduce((a, x) => a + workoutDistanceM(x), 0), units.distance, 2)}</span></div>
              </>
            );
          })()}
        </div>

        <h4 className="ft-day-rail-title">Last 7 days</h4>
        <div className="ft-day-stats">
          {Array.from({ length: 7 }, (_, i) => addDaysISO(iso, i - 6)).map((d) => {
            const day = workouts.filter((x) => x.date === d && x.status === 'completed');
            const m = day.reduce((a, x) => a + workoutDistanceM(x), 0);
            return (
              <div key={d} className={`ft-day-stat${d === iso ? ' ft-day-stat-now' : ''}`}>
                <span className="ft-day-stat-k">{d.slice(5)}</span>
                <span className="ft-day-stat-v">{m ? formatDistance(m, units.distance, 2) : (day.length ? `${day.length} session${day.length === 1 ? '' : 's'}` : '—')}</span>
              </div>
            );
          })}
        </div>

        {byType.size > 0 && (
          <>
            <h4 className="ft-day-rail-title">By activity</h4>
            <div className="ft-day-stats">
              {[...byType.values()].map(({ type, n, m }) => (
                <div key={type.name} className="ft-day-stat">
                  <span className="ft-day-stat-k" style={{ color: type.color }}>{type.name}</span>
                  <span className="ft-day-stat-v">{n}{m ? ` · ${formatDistance(m, units.distance, 2)}` : ''}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    );
  }

  return (
    <aside className="ft-day-rail">
      <h4 className="ft-day-rail-title">Week of {weekRangeLabel}</h4>
      <div className="ft-day-stats">
        <div className="ft-day-stat"><span className="ft-day-stat-k">Tracked</span><span className="ft-day-stat-v">{weekMilesText}</span></div>
      </div>
      {weekGoals.length > 0 && (
        <>
          <h4 className="ft-day-rail-title">On-pace targets</h4>
          <div className="ft-day-stats">
            {weekGoals.map(({ goal, type, targetValue }) => (
              <div key={goal.id} className="ft-day-stat">
                <span className="ft-day-stat-k" style={{ color: type.color }}>{goal.label || goal.kind}</span>
                <span className="ft-day-stat-v">{formatCheckpointValue(goal, targetValue, units)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {(() => {
        const dayMeals = meals.filter((m) => m.date === iso);
        if (!dayMeals.length) return null;
        const kcal = dayMeals.reduce((a, m) => a + (m.calories || 0), 0);
        return (
          <>
            <h4 className="ft-day-rail-title">Meals</h4>
            <div className="ft-day-stats">
              <div className="ft-day-stat"><span className="ft-day-stat-k">Logged</span><span className="ft-day-stat-v">{dayMeals.filter((m) => m.status === 'logged').length}<small> / {dayMeals.length}</small></span></div>
              {kcal > 0 && <div className="ft-day-stat"><span className="ft-day-stat-k">Calories</span><span className="ft-day-stat-v">{kcal}</span></div>}
            </div>
          </>
        );
      })()}

      {(() => {
        const next = workouts
          .filter((x) => x.date > iso && x.status !== 'completed')
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);
        if (!next.length) return null;
        return (
          <>
            <h4 className="ft-day-rail-title">Coming up</h4>
            <div className="ft-day-stats">
              {next.map((x) => {
                const t = activityType(types, x.activityType);
                return (
                  <div key={x.id} className="ft-day-stat">
                    <span className="ft-day-stat-k" style={{ color: t.color }}>{x.title?.trim() || t.name}</span>
                    <span className="ft-day-stat-v">{x.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      <h4 className="ft-day-rail-title">Where you are</h4>
      <button type="button" className="ft-day-where" onClick={() => onOpenWhere(iso)}>
        {whereBase ? (whereBase.query || whereBase.tag) : 'Not tagged — set a location'}
      </button>
      {(orbitScheduled.length > 0 || orbitDue.length > 0) && (
        <>
          <h4 className="ft-day-rail-title">To-dos</h4>
          <div className="ft-day-todos">
            {[...orbitScheduled, ...orbitDue].map((t) => (
              <button key={t.id} type="button" className="ft-day-todo" onClick={() => onOrbitOpen(t)}>
                <span style={{ color: orbitAreaById.get(t.areaId)?.color || '#94a3b8' }}>{t.title || '(untitled)'}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}

// Rectangle overlap test in viewport (clientX/clientY) coordinates — used by
// both the marquee drag box and each chip's own getBoundingClientRect().
function rectsIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

// Same 640px mobile breakpoint FitnessTracker.css already switches on
// elsewhere. matchMedia (not a one-time window.innerWidth read) so rotating a
// tablet or resizing a desktop window updates the default live.
const MOBILE_BREAKPOINT_QUERY = '(max-width: 640px)';
function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches : false
  ));
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

export default function CalendarView() {
  const {
    workouts, activityTypes, settings, updateSettings, updateWorkout, openQuickAdd,
    meals, mealTypes, goals, openMealQuickAdd, updateGoal, removeWorkout, logCheckpoint, addWorkout,
    bodyWeightLogs, openEntryEditor, openMealEditor,
  } = useFitness();
  const navigate = useNavigate();
  const units = settings.units;
  const groups = resolveGroups(settings);
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);
  // Cheap pure computation, recomputed each render — same convention as the
  // rest of this file (no useMemo for something this fast).
  const latestWeightKg = latestBodyWeightKg(bodyWeightLogs);
  const bmr = settings.profile?.bmr ?? null;
  const calorieGoal = settings.nutritionTarget?.calories ?? null;

  // ---- Orbit to-dos on the calendar ----
  // Own bridge, own local state — NOT Orbit's React context (different
  // provider tree; OrbitApp is never mounted here). `user` undefined while
  // auth is still resolving is treated the same way fitnessContext/
  // orbitContext treat it elsewhere: read as guest for now, reload once it
  // resolves to a real value (the effect's [user] dependency covers that).
  const { user } = useAuth();
  const [orbitTasks, setOrbitTasks] = useState([]);
  const [orbitAreas, setOrbitAreas] = useState([]);
  const [orbitSettings, setOrbitSettings] = useState(null);
  const reloadOrbit = useCallback(() => {
    loadOrbitBridgeData(user || null, firebaseReady).then((data) => {
      setOrbitTasks(data.tasks);
      setOrbitAreas(data.areas);
      setOrbitSettings(data.settings);
    }).catch(() => { /* no Orbit chips this load; rest of the calendar is unaffected */ });
  }, [user]);
  useEffect(() => { reloadOrbit(); }, [reloadOrbit]);
  // Adding to-dos now happens in the shell-mounted QuickAddModal, which can't
  // reach this component's state — it dispatches this window event on save so
  // the calendar re-reads Orbit and shows the new chips right away.
  useEffect(() => {
    const onChanged = () => reloadOrbit();
    window.addEventListener('orbit-tasks-changed', onChanged);
    return () => window.removeEventListener('orbit-tasks-changed', onChanged);
  }, [reloadOrbit]);
  const orbitAreaById = useMemo(() => new Map(orbitAreas.map((a) => [a.id, a])), [orbitAreas]);
  // Orbit's daily energy budget (Settings → Constants), used to annotate each
  // day's energy badge with "load / budget".
  const orbitEnergyCap = orbitSettings?.capacityDefault?.energy ?? null;
  // "Where I am" bases + per-day tags, read from Orbit's own settings.
  const orbitBases = useMemo(() => orbitSettings?.bases || [], [orbitSettings]);
  const orbitDayLocations = useMemo(() => orbitSettings?.dayLocations || {}, [orbitSettings]);
  // Killed tasks are dropped entirely (cancelled — no calendar value); done
  // tasks stay (rendered struck/dimmed by OrbitTaskChip) since "I did this
  // that day" is still meaningful history, unlike a killed task.
  const orbitLiveTasks = useMemo(() => orbitTasks.filter((t) => t.status !== 'killed'), [orbitTasks]);
  const orbitScheduledByDate = useMemo(() => {
    const map = {};
    for (const t of orbitLiveTasks) if (t.scheduledDate) (map[t.scheduledDate] ||= []).push(t);
    return map;
  }, [orbitLiveTasks]);
  // Due-but-not-scheduled-that-day only — a task both due AND scheduled the
  // same day already renders once via orbitScheduledByDate (with its own
  // due-marker overlay via OrbitTaskChip's `due` prop), so this list must
  // exclude that case or it'd render twice.
  const orbitDueByDate = useMemo(() => {
    const map = {};
    for (const t of orbitLiveTasks) {
      if (t.dueDate && t.dueDate !== t.scheduledDate) (map[t.dueDate] ||= []).push(t);
    }
    return map;
  }, [orbitLiveTasks]);
  const onOrbitOpen = (task) => navigate(task.projectId ? `/orbit/project/${task.projectId}` : '/orbit');

  // "Where I am" editor — a calendar-level modal (the day cells are 92px and
  // clip overflow, so an in-cell popover won't fit). Writes back to Orbit's
  // settings via the bridge, then re-reads so the tag + Orbit logic update.
  const keyActionsRef = useRef({});
  const [whereEditor, setWhereEditor] = useState(null); // null | iso
  const [whereTag, setWhereTag] = useState('');
  const [wherePlace, setWherePlace] = useState('');
  const [whereBusy, setWhereBusy] = useState(false);
  const openWhere = (iso) => { setWhereEditor(iso); setWhereTag(''); setWherePlace(''); };
  useModalKeys({
    onClose: useCallback(() => setWhereEditor(null), []),
    onSubmit: useCallback(() => { keyActionsRef.current.addBaseForDay?.(); }, []),
    canSubmit: !!whereEditor && !!whereTag.trim() && !whereBusy,
  });
  const pickBase = async (baseId) => {
    await setOrbitDayLocation(user || null, firebaseReady, whereEditor, baseId);
    reloadOrbit();
    setWhereEditor(null);
  };
  const addBaseForDay = keyActionsRef.current.addBaseForDay = async () => {
    const t = whereTag.trim();
    if (!t) return;
    setWhereBusy(true);
    try {
      const created = await addOrbitBase(user || null, firebaseReady, { tag: t, query: wherePlace.trim() || t });
      await setOrbitDayLocation(user || null, firebaseReady, whereEditor, created.id);
    } finally {
      setWhereBusy(false);
    }
    reloadOrbit();
    setWhereEditor(null);
  };

  // "Where I'll be" — bulk-tag a whole date range with one location (#2: e.g.
  // "Paris Aug 1–10"), plus a list of already-tagged trips you can clear.
  const [whereRangeOpen, setWhereRangeOpen] = useState(false);
  const [rangeFrom, setRangeFrom] = useState(() => todayISO());
  const [rangeTo, setRangeTo] = useState(() => todayISO());
  const [rangeBase, setRangeBase] = useState('home');
  const [rangeBusy, setRangeBusy] = useState(false);
  const dayRanges = useMemo(() => groupDayLocationRanges(orbitDayLocations, orbitBases), [orbitDayLocations, orbitBases]);
  const applyRange = async () => {
    setRangeBusy(true);
    await setOrbitDayLocationsRange(user || null, firebaseReady, rangeFrom, rangeTo, rangeBase);
    setRangeBusy(false);
    reloadOrbit();
  };
  const clearRange = async (from, to) => {
    await setOrbitDayLocationsRange(user || null, firebaseReady, from, to, null);
    reloadOrbit();
  };

  // Goals live inline on the calendar too — not Dashboard-only — so changes
  // (accept/edit/abandon) are visible immediately on the same screen instead
  // of requiring a tab switch to see what changed.
  const [goalsPanelOpen, setGoalsPanelOpen] = useState(false);
  const [goalEditor, setGoalEditor] = useState(null); // null | 'new' | goal object
  const activeGoals = useMemo(
    () => [...goals]
      .filter((g) => g.status !== 'abandoned' && !g.status?.startsWith('closed'))
      .sort((a, b) => (goalDeadline(a) || '9999').localeCompare(goalDeadline(b) || '9999')),
    [goals],
  );
  async function abandonGoal(g) {
    await updateGoal(g.id, { status: 'abandoned' });
    const stale = workouts.filter((w) => w.goalId === g.id && w.status === 'planned' && w.date >= todayISO());
    for (const w of stale) await removeWorkout(w.id);
  }

  // Click any week-end badge -> retarget that week directly, right from the
  // calendar, without hunting down which day happens to carry the real
  // checkpoint. logCheckpoint inserts a checkpoint at this date if one
  // doesn't already exist there (most week-end dates are an interpolated
  // on-pace estimate, not a formal cadence checkpoint) and recomputes
  // everything after it forward — nothing before it moves.
  const [weekOverride, setWeekOverride] = useState(null); // null | { goal, date, targetValue }
  const [weekOverrideInput, setWeekOverrideInput] = useState('');
  const openWeekOverride = (goal, date, targetValue) => { setWeekOverride({ goal, date, targetValue }); setWeekOverrideInput(''); };
  useModalKeys({
    onClose: useCallback(() => setWeekOverride(null), []),
    onSubmit: useCallback(() => { keyActionsRef.current.applyWeekOverride?.(); }, []),
    canSubmit: !!weekOverride && weekOverrideInput !== '',
  });
  keyActionsRef.current.applyWeekOverride = applyWeekOverride;
  async function applyWeekOverride() {
    if (!weekOverride) return;
    const val = parseOverrideValue(weekOverride.goal, weekOverrideInput, units.weight);
    if (val == null) return;
    await logCheckpoint(weekOverride.goal.id, weekOverride.date, val, 'override');
    setWeekOverride(null);
    setWeekOverrideInput('');
  }

  // Week EVERY time the page opens — deliberately local state, not a persisted
  // pref. Switching to Month/Day is a look, not a new home view, and having the
  // calendar reopen on whatever you last poked at was disorienting.
  // (weekCount stays sticky below: that one you set on purpose.)
  const [view, setView] = useState('week');
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  // two sticky calendar toggles (persisted so they survive reload/navigation)
  const showMeals = !!settings.calendarPrefs?.showMealsOnCalendar;
  const mealDayView = !!settings.calendarPrefs?.mealDayView;
  const toggleCalendarPref = (key) => updateSettings({ calendarPrefs: { ...settings.calendarPrefs, [key]: !settings.calendarPrefs?.[key] } });

  // Goals/Miles side columns default ON for desktop, OFF for mobile (they
  // crush the day grid to slivers at phone widths) — but a manual toggle in
  // either direction wins over the device default, and that override sticks
  // (calendarPrefs.showWeekSideCols stays null until the user actually flips it).
  const isMobileViewport = useIsMobileViewport();
  const sideColsOverride = settings.calendarPrefs?.showWeekSideCols;
  const showWeekSideCols = sideColsOverride != null ? sideColsOverride : !isMobileViewport;
  const toggleWeekSideCols = () => updateSettings({ calendarPrefs: { ...settings.calendarPrefs, showWeekSideCols: !showWeekSideCols } });

  // Week view shows a configurable window of N weeks (1–10), scrollable one week
  // at a time via the ‹ › nav — Month stays strict to the actual month.
  const weekCount = Math.min(10, Math.max(1, settings.calendarPrefs?.weekCount ?? 2));
  const setWeekCount = (n) => updateSettings({ calendarPrefs: { ...settings.calendarPrefs, weekCount: Math.min(10, Math.max(1, Number.isFinite(n) ? n : 1)) } });

  // Cycles which chips render on the grid: all -> hide events -> hide
  // workouts -> all. Display-only — doesn't touch workouts/byDate's
  // underlying data, so drag/drop, clipboard, and weekly totals are unaffected.
  const CHIP_FILTER_CYCLE = ['all', 'noEvents', 'noWorkouts'];
  const chipFilter = settings.calendarPrefs?.chipFilter || 'all';
  const cycleChipFilter = () => {
    const next = CHIP_FILTER_CYCLE[(CHIP_FILTER_CYCLE.indexOf(chipFilter) + 1) % CHIP_FILTER_CYCLE.length];
    updateSettings({ calendarPrefs: { ...settings.calendarPrefs, chipFilter: next } });
  };
  const CHIP_FILTER_LABEL = { all: '🗂 All items', noEvents: '🗂 Hiding events', noWorkouts: '🗂 Hiding workouts' };

  // "Meal day view" pops a meal-schedule panel beside the calendar for
  // whichever day you last clicked — works in Month/Week/Day alike, no need
  // to switch modes. It stands down only when Day view is already showing
  // that exact same day (the meals-left/events-right split there already
  // covers it — no point showing the same day twice).
  const [lastClickedDate, setLastClickedDate] = useState(() => todayISO());
  const dayViewShowingTarget = view === 'day' && isoDate(cursor) === lastClickedDate;
  const showMealPanel = mealDayView && !dayViewShowingTarget;

  // meal selection is a lighter-weight sibling of the workout multi-select below
  // — single-toggle only (✂️ no ordered shift-range or marquee box-select for meals).
  const [mealSelected, setMealSelected] = useState(() => new Set());
  const toggleMealSelected = (mid) => setMealSelected((prev) => {
    const next = new Set(prev);
    if (next.has(mid)) next.delete(mid); else next.add(mid);
    return next;
  });
  const onAddMeal = (iso) => { setLastClickedDate(iso); openMealQuickAdd(iso); };
  const onEditMeal = (id) => { setMealSelected(new Set()); openMealEditor(id); };
  const mealsByDate = useMemo(() => {
    const map = {};
    for (const m of meals) (map[m.date] ||= []).push(m);
    for (const k of Object.keys(map)) map[k].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    return map;
  }, [meals]);

  // ---- multi-select: ctrl/cmd-click toggles, shift-click extends a range from
  // the last-touched chip, click-drag marquee box-selects like a file manager.
  const [selected, setSelected] = useState(() => new Set());
  const [anchorId, setAnchorId] = useState(null);
  const [marqueeRect, setMarqueeRect] = useState(null);
  const calBodyRef = useRef(null);
  const dragStateRef = useRef(null);

  const orderedWorkouts = useMemo(
    () => [...workouts].sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99'))),
    [workouts],
  );

  const clearSelection = () => { setSelected(new Set()); setAnchorId(null); };

  // ---- clipboard hotkeys: Ctrl/Cmd+C copy, +X cut, +V paste onto the
  // last-clicked day, Delete/Backspace removes the selection. Cut behaves
  // like copy until Paste actually happens — nothing is lost if you never
  // paste it (same as Explorer/Finder, not an instant destructive delete).
  const [clipboard, setClipboard] = useState(null); // null | { items: workout[], cut: boolean }

  function copySelection(cut) {
    if (!selected.size) return;
    const items = workouts.filter((w) => selected.has(w.id));
    if (items.length) setClipboard({ items, cut });
  }

  async function pasteClipboard() {
    if (!clipboard?.items?.length) return;
    const anchorDate = clipboard.items.reduce((min, w) => (w.date < min ? w.date : min), clipboard.items[0].date);
    const delta = signedDaysBetween(anchorDate, lastClickedDate);
    for (const w of clipboard.items) await addWorkout({ ...cloneableFields(w), date: addDaysISO(w.date, delta) });
    if (clipboard.cut) {
      for (const w of clipboard.items) await removeWorkout(w.id);
      setClipboard(null);
    }
  }

  async function deleteSelection() {
    const ids = [...selected];
    for (const id of ids) await removeWorkout(id);
    clearSelection();
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (isTypingTarget(document.activeElement)) return;
      // A dialog is open — it owns the keyboard. Without this the grid's
      // copy/paste/delete keys still fired behind the modal.
      if (document.querySelector('.ft-modal-backdrop')) return;
      const mod = e.ctrlKey || e.metaKey;
      // Shift/Alt combos are NOT ours. Ctrl+Shift+C is the browser's
      // inspect-element shortcut and this handler was calling preventDefault on
      // it (the check was only `mod && key === 'c'`), so devtools' element
      // picker silently stopped opening anywhere on this page. Same class of
      // problem for Ctrl+Shift+V (paste-as-plain-text) and Ctrl+Alt+*.
      if (e.shiftKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (mod && key === 'c') { e.preventDefault(); copySelection(false); }
      else if (mod && key === 'x') { e.preventDefault(); copySelection(true); }
      else if (mod && key === 'v') { e.preventDefault(); pasteClipboard(); }
      else if (!mod && (e.key === 'Delete' || e.key === 'Backspace') && selected.size) { e.preventDefault(); deleteSelection(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selected, clipboard, lastClickedDate, workouts]);

  const onCtrlClick = (wid) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(wid)) next.delete(wid); else next.add(wid);
      return next;
    });
    setAnchorId(wid);
  };

  const onShiftClick = (wid) => {
    if (!anchorId) { setSelected(new Set([wid])); setAnchorId(wid); return; }
    const ids = orderedWorkouts.map((w) => w.id);
    const i = ids.indexOf(anchorId);
    const j = ids.indexOf(wid);
    if (i === -1 || j === -1) { setSelected(new Set([wid])); return; }
    const [lo, hi] = i < j ? [i, j] : [j, i];
    setSelected(new Set(ids.slice(lo, hi + 1)));
  };

  function onGridMouseMove(e) {
    const ds = dragStateRef.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.dragging && Math.hypot(dx, dy) < 5) return;
    ds.dragging = true;
    const rect = {
      left: Math.min(ds.startX, e.clientX), right: Math.max(ds.startX, e.clientX),
      top: Math.min(ds.startY, e.clientY), bottom: Math.max(ds.startY, e.clientY),
    };
    setMarqueeRect(rect);
    const chips = calBodyRef.current ? calBodyRef.current.querySelectorAll('.ft-chip') : [];
    const ids = new Set();
    chips.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (rectsIntersect(rect, { left: r.left, right: r.right, top: r.top, bottom: r.bottom })) ids.add(el.dataset.id);
    });
    setSelected(ids);
    setAnchorId(null);
  }

  function onGridMouseUp() {
    document.removeEventListener('mousemove', onGridMouseMove);
    document.removeEventListener('mouseup', onGridMouseUp);
    if (dragStateRef.current && dragStateRef.current.dragging) {
      // a real drag happened — swallow the click the browser is about to fire on
      // mouseup so it can't reach the day cell's "click to add" handler. Runs in
      // the capture phase, ahead of React's bubble-phase delegated listener.
      const suppressClick = (e) => {
        e.stopPropagation();
        document.removeEventListener('click', suppressClick, true);
      };
      document.addEventListener('click', suppressClick, true);
    }
    dragStateRef.current = null;
    setMarqueeRect(null);
  }

  function onGridMouseDown(e) {
    if (e.button !== 0 || e.target.closest('.ft-chip')) return;
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, dragging: false };
    document.addEventListener('mousemove', onGridMouseMove);
    document.addEventListener('mouseup', onGridMouseUp);
  }

  async function applyGroupToSelection(groupId) {
    const ids = [...selected];
    for (const wid of ids) await updateWorkout(wid, { groupId });
    if (groupId !== settings.lastGroupId) await updateSettings({ lastGroupId: groupId });
    clearSelection();
  }

  const byDate = useMemo(() => {
    const map = {};
    for (const w of workouts) {
      if (chipFilter !== 'all') {
        const isEvent = activityType(activityTypes, w.activityType).kind === 'event';
        if (chipFilter === 'noEvents' && isEvent) continue;
        if (chipFilter === 'noWorkouts' && !isEvent) continue;
      }
      (map[w.date] ||= []).push(w);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    }
    return map;
  }, [workouts, activityTypes, chipFilter]);

  // Opens the editor over the calendar instead of navigating away to
  // /MFT/entry/:id, which lost your scroll position and the view you were in.
  const onEdit = (id) => { clearSelection(); openEntryEditor(id); };
  const onAdd = (iso) => { setLastClickedDate(iso); openQuickAdd(iso); };
  const onAltClick = (id) => removeWorkout(id);
  // Dragging one chip of a multi-selection moves/duplicates the WHOLE
  // selection, each by the same day-offset (dropDate - the dragged chip's own
  // date), preserving relative spacing — Shift held at drop = duplicate
  // (copy), otherwise a plain move, matching the OS-standard drag gesture.
  async function onDropWorkout(ids, fromDate, dropIso, duplicate) {
    const delta = signedDaysBetween(fromDate, dropIso);
    if (!delta && !duplicate) return;
    for (const id of ids) {
      const w = workouts.find((x) => x.id === id);
      if (!w) continue;
      const newDate = addDaysISO(w.date, delta);
      if (duplicate) await addWorkout({ ...cloneableFields(w), date: newDate });
      else await updateWorkout(id, { date: newDate });
    }
    clearSelection();
  }

  const step = (dir) => {
    setCursor((c) => {
      const d = new Date(c);
      if (view === 'month') d.setMonth(d.getMonth() + dir);
      else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  };
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCursor(d); };

  let title;
  if (view === 'month') title = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  else if (view === 'week') {
    const s = startOfWeek(cursor);
    if (weekCount === 1) title = `Week of ${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()}`;
    else { const e = addDays(s, weekCount * 7 - 1); title = `${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getDate()}`; }
  }
  else title = `${WEEKDAYS[cursor.getDay()]}, ${MONTHS[cursor.getMonth()].slice(0, 3)} ${cursor.getDate()}`;

  const cellProps = (date, inMonth) => ({
    date, inMonth,
    // Layout variant and size band are deliberately separate: the multi-week
    // window uses month-style cells for layout, but they have week-sized room.
    sizeVariant: view === 'day' ? 'day' : (view === 'week' ? 'week' : 'month'),
    isToday: isoDate(date) === todayISO(),
    items: byDate[isoDate(date)] || [],
    types: activityTypes, units, groups, goalsById, selected, onAdd, onEdit, onCtrlClick, onShiftClick, onAltClick, onDropWorkout,
    showMeals, mealItems: mealsByDate[isoDate(date)] || [], mealTypes, mealSelected,
    onAddMeal, onEditMeal, onMealCtrlClick: toggleMealSelected, onMealShiftClick: toggleMealSelected,
    allWorkouts: workouts, meals, bmr, calorieGoal, bodyWeightKg: latestWeightKg,
    orbitScheduled: orbitScheduledByDate[isoDate(date)] || [], orbitDue: orbitDueByDate[isoDate(date)] || [],
    orbitAreaById, onOrbitOpen, orbitEnergyCap,
    bases: orbitBases, dayLocations: orbitDayLocations, onOpenWhere: openWhere,
  });

  // Shared week-grid header + one week-row (7-day grid + goals/miles side
  // columns) — used by both Month and the multi-week Week window so they stay
  // pixel-identical. inMonthOf lets Month dim out-of-month days; the multi-week
  // window passes null (it's a rolling window, not bound to one month).
  const weekHead = (
    <div className="ft-weekhead">
      {WEEKDAYS.map((d) => <div key={d} className="ft-weekhead-cell">{d}</div>)}
      {showWeekSideCols && (
        <>
          <div className="ft-weekhead-cell ft-weekend-head">Goals</div>
          <div className="ft-weekhead-cell ft-weekmiles-head">Miles</div>
        </>
      )}
    </div>
  );

  const renderWeekRow = (week, inMonthOf) => {
    const sunISO = isoDate(week[0]);
    const satISO = isoDate(week[6]);
    const ends = showWeekSideCols ? weekEndGoals(activeGoals, activityTypes, satISO) : [];
    const milesText = formatDistance(weekTrackedDistanceM(workouts, sunISO, satISO), units.distance, 1);
    const weekNet = weekNetCalories(meals, workouts, sunISO, satISO, bmr, latestWeightKg);
    return (
      <div key={satISO} className="ft-week-row">
        <div className="ft-month-grid">
          {week.map((d) => (
            <DayCell key={isoDate(d)} variant="month" {...cellProps(d, inMonthOf ? inMonthOf(d) : true)} />
          ))}
        </div>
        {showWeekSideCols && (
          <>
            <div className="ft-weekend-col">
              {ends.map(({ goal, type, targetValue }) => (
                <WeekEndBadge
                  key={goal.id} goal={goal} type={type} targetValue={targetValue} units={units}
                  onClick={() => openWeekOverride(goal, satISO, targetValue)}
                />
              ))}
            </div>
            <div className="ft-weekmiles-col">
              <div className="ft-weekmiles-badge" title={`${milesText} tracked this week`}>
                <span className="ft-weekmiles-text">{milesText}</span>
              </div>
              {calorieGoal != null && (
                <div className="ft-weekmiles-badge ft-weeknet-badge" title="Net calories this week vs. a 1lb-equivalent (3500 kcal) reference">
                  <span className="ft-weekmiles-text">{weekNet}/{KCAL_PER_LB_ADIPOSE}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="ft-cal-outer">
      {showMealPanel && (
        <div className="ft-meal-panel-side">
          <div className="ft-meal-panel-side-head">
            <span className="ft-field-label">Meals — {lastClickedDate}</span>
          </div>
          <MealDayView date={new Date(lastClickedDate + 'T00:00:00')} />
        </div>
      )}
      <div className="ft-cal" data-view={view}>
      <div className="ft-cal-bar">
        <div className="ft-cal-nav">
          <button type="button" className="ft-nav-btn" onClick={() => step(-1)} aria-label="Previous">‹</button>
          <button type="button" className="ft-nav-btn ft-today-btn" onClick={goToday}>Today</button>
          <button type="button" className="ft-nav-btn" onClick={() => step(1)} aria-label="Next">›</button>
          <h2 className="ft-cal-title">{title}</h2>
        </div>
        <div className="ft-aft-strip">
          {AFT_EVENTS.map((ev) => (
            <span key={ev.id} className="ft-aft-item" title={ev.name}>
              {ev.abbr}{' '}
              <b>{formatAftTier(ev, 90)}</b>
              <i>/</i>
              <b>{formatAftTier(ev, 100)}</b>
            </span>
          ))}
        </div>
        <div className="ft-view-toggle">
          {['month', 'week', 'day'].map((v) => (
            <button key={v} type="button" className={`ft-view-btn${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        {view === 'week' && (
          <label className="ft-weekcount" title="How many weeks to show at once (scroll a week at a time with ‹ ›)">
            <span>weeks</span>
            <input
              type="number" min={1} max={10} value={weekCount}
              onChange={(e) => setWeekCount(parseInt(e.target.value, 10))}
            />
          </label>
        )}
      </div>

      <div className="ft-cal-toggles">
        <button
          type="button"
          className={`ft-toggle-btn${mealDayView ? ' active' : ''}`}
          onClick={() => toggleCalendarPref('mealDayView')}
          title="Shows a meal-schedule panel for whichever day you last clicked, alongside the calendar in any view"
        >
          🍽 Meal day view
        </button>
        <button
          type="button"
          className={`ft-toggle-btn${showMeals ? ' active' : ''}`}
          onClick={() => toggleCalendarPref('showMealsOnCalendar')}
          title="Show meals alongside workouts on every calendar day"
        >
          🍽 Show meals on calendar
        </button>
        <button
          type="button"
          className={`ft-toggle-btn${goalsPanelOpen ? ' active' : ''}`}
          onClick={() => setGoalsPanelOpen((o) => !o)}
          title="Create or adjust goals right here, without leaving the calendar"
        >
          🎯 Goals{activeGoals.length > 0 ? ` (${activeGoals.length})` : ''}
        </button>
        <button
          type="button"
          className={`ft-toggle-btn${whereRangeOpen ? ' active' : ''}`}
          onClick={() => setWhereRangeOpen((o) => !o)}
          title="Tag a whole stretch of days with where you'll be — Orbit routes travel + weather from there"
        >
          📍 Where I'll be{dayRanges.length > 0 ? ` (${dayRanges.length})` : ''}
        </button>
        <button
          type="button"
          className={`ft-toggle-btn${chipFilter !== 'all' ? ' active' : ''}`}
          onClick={cycleChipFilter}
          title="Cycles which chips show on the grid: all items -> hide events -> hide workouts -> all items again. Display-only — doesn't touch your data."
        >
          {CHIP_FILTER_LABEL[chipFilter]}
        </button>
        <button
          type="button"
          className={`ft-toggle-btn${showWeekSideCols ? ' active' : ''}`}
          onClick={toggleWeekSideCols}
          title="Show/hide the weekly Goals + Miles summary columns beside the calendar grid — defaults on for desktop, off for mobile, but this overrides that"
        >
          📊 Goals/Miles cols
        </button>
      </div>

      {whereRangeOpen && (
        <div className="ft-goals-panel ft-whererange-panel">
          <div className="ft-goals-head">
            <span className="ft-field-label">Where I'll be</span>
          </div>
          <p className="ft-hint-sm">Pick a stretch of days and where you'll be — Orbit routes travel + weather from there for the whole range.</p>
          <div className="ft-whererange-form">
            <div className="ft-two">
              <div className="ft-field">
                <label className="ft-field-label">From</label>
                <input className="ft-input" type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
              </div>
              <div className="ft-field">
                <label className="ft-field-label">To</label>
                <input className="ft-input" type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
              </div>
            </div>
            <label className="ft-field-label">Location</label>
            <BaseSelect value={rangeBase} onChange={setRangeBase} allowClear={false} />
            <button type="button" className="ft-btn-primary ft-whererange-apply" disabled={rangeBusy} onClick={applyRange}>
              {rangeBusy ? 'Applying…' : 'Tag these days'}
            </button>
          </div>
          {dayRanges.length > 0 && (
            <div className="ft-whererange-list">
              <span className="ft-field-label">Planned</span>
              {dayRanges.map((r) => (
                <div key={r.from} className="ft-whererange-item">
                  <span className="ft-whererange-tag" style={r.base ? { borderColor: r.base.color, color: r.base.color } : undefined}>{r.base?.tag || '??'}</span>
                  <span className="ft-whererange-dates">{r.from}{r.to !== r.from ? ` → ${r.to}` : ''}</span>
                  <button type="button" className="ft-todo-remove" onClick={() => clearRange(r.from, r.to)} aria-label="Clear this range">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {goalsPanelOpen && (
        <div className="ft-goals-panel">
          <div className="ft-goals-head">
            <span className="ft-field-label">Goals</span>
            <button type="button" className="ft-btn-ghost ft-goal-new-btn" onClick={() => setGoalEditor('new')}>+ New goal</button>
          </div>
          {activeGoals.length === 0 ? (
            <p className="ft-hint-sm">No goals yet — set one and its training plan will show up right here on the calendar, with 🎯 pins on each session.</p>
          ) : (
            <div className="ft-goal-list">
              {activeGoals.map((g) => {
                const t = activityType(activityTypes, g.activityType);
                const worst = worstRealismBand(g);
                return (
                  <div key={g.id} className="ft-goal-row" style={{ borderLeft: `4px solid ${t.color}` }}>
                    <span className="ft-goal-icon">{t.icon}</span>
                    <div className="ft-goal-info">
                      <span className="ft-goal-label">{t.name} — {g.label || g.kind}</span>
                      <span className="ft-goal-meta">
                        <span className={`ft-goal-badge ft-goal-${g.status}`}>{g.status}</span>
                        {worst && <span className={`ft-realism-badge ft-realism-${worst}`}>{worst}</span>}
                        {g.taskFrequency?.value ?? g.daysPerWeek}x/wk
                        {g.forecastWeeks != null && ` · ~${g.forecastWeeks} wk${g.forecastWeeks === 1 ? '' : 's'}`}
                        {goalDeadline(g) && ` · by ${goalDeadline(g)}`}
                      </span>
                    </div>
                    <div className="ft-goal-actions">
                      <button type="button" className="ft-btn-ghost" onClick={() => setGoalEditor(g)}>Edit</button>
                      {g.status === 'paused'
                        ? <button type="button" className="ft-btn-ghost" onClick={() => updateGoal(g.id, { status: 'accepted', pausedAt: null })}>Resume</button>
                        : <button type="button" className="ft-btn-ghost" onClick={() => updateGoal(g.id, { status: 'paused', pausedAt: Date.now() })}>Pause</button>}
                      <button type="button" className="ft-btn-ghost" onClick={() => abandonGoal(g)}>Abandon</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      <div className="ft-cal-body" ref={calBodyRef} onMouseDown={onGridMouseDown}>
        {view === 'month' && (() => {
          // Strict to the actual month: 4–6 rows as the month requires, never a
          // hardcoded 6. weeks = ceil((leading blank days + days in month) / 7).
          const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
          const gridStart = startOfWeek(monthStart);
          const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
          const weeks = Math.ceil((monthStart.getDay() + daysInMonth) / 7);
          const days = Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i));
          const weekRows = [];
          for (let i = 0; i < days.length; i += 7) weekRows.push(days.slice(i, i + 7));
          return (
            <div className="ft-month">
              {weekHead}
              {weekRows.map((week) => renderWeekRow(week, (d) => d.getMonth() === cursor.getMonth()))}
            </div>
          );
        })()}

        {view === 'week' && weekCount > 1 && (() => {
          // Multi-week window: N stacked week-rows from the current week forward,
          // same rendering as Month (no month-dimming). ‹ › scrolls a week at a
          // time, so prior weeks are reachable with the window size locked.
          const start = startOfWeek(cursor);
          const rows = Array.from({ length: weekCount }, (_, wk) =>
            Array.from({ length: 7 }, (_, i) => addDays(start, wk * 7 + i)));
          return (
            <div className="ft-month ft-multiweek">
              {weekHead}
              {rows.map((week) => renderWeekRow(week, null))}
            </div>
          );
        })()}

        {view === 'week' && weekCount === 1 && (() => {
          const s = startOfWeek(cursor);
          const days = Array.from({ length: 7 }, (_, i) => addDays(s, i));
          const sunISO = isoDate(days[0]);
          const satISO = isoDate(days[6]);
          const ends = showWeekSideCols ? weekEndGoals(activeGoals, activityTypes, satISO) : [];
          const milesText = formatDistance(weekTrackedDistanceM(workouts, sunISO, satISO), units.distance, 1);
          const weekNet = weekNetCalories(meals, workouts, sunISO, satISO, bmr, latestWeightKg);
          return (
            <div className="ft-week-row ft-week-row-single">
              <div className="ft-week">
                {days.map((d) => <DayCell key={isoDate(d)} variant="week" {...cellProps(d, true)} />)}
              </div>
              {showWeekSideCols && (
                <>
                  <div className="ft-weekend-col">
                    {ends.map(({ goal, type, targetValue }) => (
                      <WeekEndBadge
                        key={goal.id} goal={goal} type={type} targetValue={targetValue} units={units}
                        onClick={() => openWeekOverride(goal, satISO, targetValue)}
                      />
                    ))}
                  </div>
                  <div className="ft-weekmiles-col">
                    <div className="ft-weekmiles-badge" title={`${milesText} tracked this week`}>
                      <span className="ft-weekmiles-text">{milesText}</span>
                    </div>
                    {calorieGoal != null && (
                      <div className="ft-weekmiles-badge ft-weeknet-badge" title="Net calories this week vs. a 1lb-equivalent (3500 kcal) reference">
                        <span className="ft-weekmiles-text">{weekNet}/{KCAL_PER_LB_ADIPOSE}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {view === 'day' && (() => {
          const iso = isoDate(cursor);
          const sun = startOfWeek(cursor);
          const sat = addDays(sun, 6);
          const railProps = {
            iso, items: byDate[iso] || [], types: activityTypes, units,
            meals, workouts, bmr, calorieGoal, bodyWeightKg: latestWeightKg,
            orbitScheduled: orbitScheduledByDate[iso] || [], orbitDue: orbitDueByDate[iso] || [],
            orbitAreaById, orbitEnergyCap, onOrbitOpen,
            whereBase: resolveBase(iso, orbitBases, orbitDayLocations), onOpenWhere: openWhere,
            weekGoals: weekEndGoals(activeGoals, activityTypes, isoDate(sat)),
            weekMilesText: formatDistance(weekTrackedDistanceM(workouts, isoDate(sun), isoDate(sat)), units.distance, 1),
            weekRangeLabel: `${MONTHS[sun.getMonth()].slice(0, 3)} ${sun.getDate()} – ${MONTHS[sat.getMonth()].slice(0, 3)} ${sat.getDate()}`,
            sunISO: isoDate(sun), satISO: isoDate(sat),
          };
          return (
            <div className="ft-day">
              <DayRails side="left" {...railProps} />
              <div className="ft-day-main">
                <DayCell variant="day" {...cellProps(cursor, true)} />
              </div>
              <DayRails side="right" {...railProps} />
            </div>
          );
        })()}
      </div>

      {marqueeRect && (
        <div
          className="ft-marquee"
          style={{ left: marqueeRect.left, top: marqueeRect.top, width: marqueeRect.right - marqueeRect.left, height: marqueeRect.bottom - marqueeRect.top }}
        />
      )}

      {selected.size > 0 && (
        <div className="ft-selection-bar">
          <span className="ft-selection-count">{selected.size} selected</span>
          <GroupPicker value={null} onChange={applyGroupToSelection} label="" />
          <button type="button" className="ft-btn-ghost" onClick={clearSelection}>Clear</button>
        </div>
      )}

      <p className="ft-cal-hint">Click a day to schedule · drag to reschedule (hold Shift while dragging to duplicate instead) · click to edit · Alt+click to delete instantly · Ctrl/Shift-click or drag a box to select multiple · Ctrl+C/X/V to copy/cut/paste onto the last-clicked day · Delete to remove selected</p>

      {goalEditor && (
        <GoalEditorModal goal={goalEditor === 'new' ? null : goalEditor} onClose={() => setGoalEditor(null)} />
      )}

      {whereEditor && (
        <div className="ft-modal-backdrop" onClick={() => setWhereEditor(null)}>
          <div className="ft-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ft-modal-head">
              <h3>Where are you — {whereEditor}?</h3>
              <button type="button" className="ft-x" onClick={() => setWhereEditor(null)} aria-label="Close">✕</button>
            </div>
            <p className="ft-hint-sm">
              Tag where you're based this day. Orbit's travel, weather, and scheduling all reason from here —
              the day you're in Hawaii it checks Hawaii, not home.
            </p>
            {orbitBases.length > 0 && (
              <div className="ft-where-bases">
                {orbitBases.map((b) => (
                  <button
                    key={b.id} type="button"
                    className={`ft-where-base${orbitDayLocations[whereEditor] === b.id ? ' active' : ''}`}
                    style={{ borderColor: b.color, background: orbitDayLocations[whereEditor] === b.id ? `${b.color}22` : undefined }}
                    onClick={() => pickBase(b.id)} title={b.query || b.tag}
                  >
                    {b.tag}{b.isHome ? ' · home' : ''}
                  </button>
                ))}
                {orbitDayLocations[whereEditor] && (
                  <button type="button" className="ft-where-base ft-where-base-clear" onClick={() => pickBase(null)}>clear</button>
                )}
              </div>
            )}
            <div className="ft-field">
              <label className="ft-field-label">New place</label>
              <div className="ft-where-new">
                <input
                  className="ft-input ft-where-tag" placeholder="TAG (e.g. OREM)" maxLength={14}
                  value={whereTag} onChange={(e) => setWhereTag(e.target.value)}
                />
                <input
                  className="ft-input" placeholder="City, State — e.g. Paris, Idaho"
                  value={wherePlace} onChange={(e) => setWherePlace(e.target.value)}
                />
              </div>
              <p className="ft-hint-sm">The city/state disambiguates the map lookup — “Paris, Idaho”, not Paris, France.</p>
            </div>
            <div className="ft-modal-actions">
              <button type="button" className="ft-btn-ghost" onClick={() => setWhereEditor(null)}>Cancel</button>
              <button type="button" className="ft-btn-primary" disabled={!whereTag.trim() || whereBusy} onClick={addBaseForDay}>
                {whereBusy ? 'Locating…' : 'Add & use'}
              </button>
            </div>
          </div>
        </div>
      )}

      {weekOverride && (
        <div className="ft-modal-backdrop" onClick={() => setWeekOverride(null)}>
          <div className="ft-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="ft-modal-head">
              <h3>Retarget week of {weekOverride.date}</h3>
              <button type="button" className="ft-x" onClick={() => setWeekOverride(null)} aria-label="Close">✕</button>
            </div>
            <p className="ft-hint-sm">
              {weekOverride.goal.label || weekOverride.goal.kind} — currently on pace for {formatCheckpointValue(weekOverride.goal, weekOverride.targetValue, units)}.
              Retargeting recomputes everything after this date; nothing before it moves.
            </p>
            <div className="ft-field">
              <label className="ft-field-label">New value</label>
              <ClearableInput
                value={weekOverrideInput} onChange={(e) => setWeekOverrideInput(e.target.value)} onClear={() => setWeekOverrideInput('')}
                placeholder={overridePlaceholderFor(weekOverride.goal, units.weight)}
              />
            </div>
            <div className="ft-modal-actions">
              <button type="button" className="ft-btn-ghost" onClick={() => setWeekOverride(null)}>Cancel</button>
              <button type="button" className="ft-btn-primary" disabled={weekOverrideInput === ''} onClick={applyWeekOverride}>Apply</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
