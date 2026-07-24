import { useCallback, useMemo, useState } from 'react';
import { useOrbit } from '../orbitContext';
import { planTasksAcrossDays } from '../calc/planner';
import { isReady } from '../calc/readiness';
import { compareForToday } from '../calc/priority';
import TaskRow from './TaskRow';
import './PlannerView.css';

// Mirrors calc/planner.js's DEFAULT_UNESTIMATED_TIME_MIN — used here purely
// to render the same Σtime the planner itself costed a null-timeMin task at,
// so the fill bars never disagree with what planTasksAcrossDays actually did.
const UNESTIMATED_TIME_MIN = 30;
const DEFAULT_HORIZON_DAYS = 14;
const HORIZON_PRESETS = [7, 14, 30];
const TIME_SLIDER_MAX = 720; // 12h — sliders are a quick-adjust, the number field beside them is uncapped
const ENERGY_SLIDER_MAX = 40;

const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDaysISO = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return toISO(d); };

function formatDayLabel(iso, todayStr) {
  if (iso === todayStr) return 'Today';
  if (iso === addDaysISO(todayStr, 1)) return 'Tomorrow';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function sumForDay(dayTasks) {
  return dayTasks.reduce((acc, t) => ({
    time: acc.time + (t.timeMin ?? UNESTIMATED_TIME_MIN),
    energy: acc.energy + (t.energy ?? 0),
  }), { time: 0, energy: 0 });
}

function CapacityBar({ label, used, cap, unit }) {
  const over = used > cap;
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : (used > 0 ? 100 : 0);
  return (
    <div className="orb-plan-capbar">
      <div className="orb-plan-capbar-label">
        <span>{label}</span>
        <span className={over ? 'orb-flag-warn' : undefined}>{used}{unit} / {cap}{unit}</span>
      </div>
      <div className="orb-plan-capbar-track">
        <div className={`orb-plan-capbar-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Time + energy sliders (each paired with a free-number field so the value
// is never capped by the slider's visual range — see CLAUDE.md's UI feature
// contract on not locking an open-ended value behind a fixed control).
function CapacityEditor({ dayPlan, effective, onChange, onReset }) {
  const customized = dayPlan.capacityTimeMin != null || dayPlan.capacityEnergy != null;
  return (
    <div className="orb-plan-cap-editor">
      <div className="orb-plan-cap-field">
        <span className="orb-plan-cap-field-label">Time budget</span>
        <input
          type="range" min={0} max={TIME_SLIDER_MAX} step={15}
          value={Math.min(effective.timeMin, TIME_SLIDER_MAX)}
          onChange={(e) => onChange('capacityTimeMin', Number(e.target.value))}
        />
        <input
          type="number" min={0} step={5} className="orb-plan-cap-num"
          value={effective.timeMin}
          onChange={(e) => onChange('capacityTimeMin', Math.max(0, Number(e.target.value) || 0))}
        />
        <span className="orb-plan-cap-unit">min</span>
      </div>
      <div className="orb-plan-cap-field">
        <span className="orb-plan-cap-field-label">Energy budget</span>
        <input
          type="range" min={0} max={ENERGY_SLIDER_MAX} step={1}
          value={Math.min(effective.energy, ENERGY_SLIDER_MAX)}
          onChange={(e) => onChange('capacityEnergy', Number(e.target.value))}
        />
        <input
          type="number" min={0} step={1} className="orb-plan-cap-num"
          value={effective.energy}
          onChange={(e) => onChange('capacityEnergy', Math.max(0, Number(e.target.value) || 0))}
        />
      </div>
      {customized && (
        <button type="button" className="orb-btn orb-plan-cap-reset" onClick={onReset}>
          Reset to default ({effective.defaultTimeMin}min / {effective.defaultEnergy})
        </button>
      )}
    </div>
  );
}

// A candidate task plus the day-picker that lets the user manually shift it
// before applying — mobile-friendly stand-in for drag/drop (native <select>
// works everywhere; dragging TaskRow cards does not).
function PlannedTask({ task, days, today, effectiveDate, onMove }) {
  return (
    <div className="orb-plan-task">
      <TaskRow task={task} />
      <label className="orb-plan-move">
        <span>Move to</span>
        <select value={effectiveDate ?? ''} onChange={(e) => onMove(task.id, e.target.value || null)}>
          <option value="">Unscheduled</option>
          {days.map((d) => <option key={d} value={d}>{formatDayLabel(d, today)}</option>)}
        </select>
      </label>
    </div>
  );
}

// NS-7 + NS-8 — capacity-aware auto-planner. Picks open/ready/unscheduled
// tasks, orders them by priority, and greedily lays them across a horizon
// using each day's capacity (per-day DayPlan override, else settings
// default). Nothing is written to a task until "Apply plan" — everything
// before that (including manual day-shifts) lives in local state so the
// preview is free to explore without side effects.
export default function PlannerView() {
  const { tasks, tasksById, settings, today, getDayPlan, setDayPlan, updateTask } = useOrbit();

  const [startMode, setStartMode] = useState('today'); // 'today' | 'tomorrow'
  const [horizonDays, setHorizonDays] = useState(DEFAULT_HORIZON_DAYS);
  const [overrides, setOverrides] = useState({}); // taskId -> date | null (manual shift, wins over the computed plan)
  const [expandedCapacity, setExpandedCapacity] = useState(() => new Set([today]));
  const [applyMessage, setApplyMessage] = useState(null);

  const startISO = startMode === 'tomorrow' ? addDaysISO(today, 1) : today;
  const days = useMemo(
    () => Array.from({ length: horizonDays }, (_, i) => addDaysISO(startISO, i)),
    [startISO, horizonDays],
  );

  const candidates = useMemo(
    () => tasks.filter((t) => (t.status === 'todo' || t.status === 'doing') && !t.scheduledDate && isReady(t, tasksById)),
    [tasks, tasksById],
  );
  const ordered = useMemo(
    () => [...candidates].sort((a, b) => compareForToday(a, b, today)),
    [candidates, today],
  );

  const capacityFor = useCallback((date) => {
    const plan = getDayPlan(date);
    return {
      timeMin: plan.capacityTimeMin ?? settings.capacityDefault.timeMin,
      energy: plan.capacityEnergy ?? settings.capacityDefault.energy,
    };
  }, [getDayPlan, settings.capacityDefault]);

  const basePlan = useMemo(
    () => planTasksAcrossDays(ordered, startISO, horizonDays, capacityFor),
    [ordered, startISO, horizonDays, capacityFor],
  );
  const basePlanByTaskId = useMemo(
    () => new Map(basePlan.placements.map((p) => [p.taskId, p.date])),
    [basePlan],
  );

  // Effective placement = manual override if one exists for this task,
  // otherwise whatever the greedy planner decided.
  const dayAssignments = useMemo(() => {
    const byDate = new Map(days.map((d) => [d, []]));
    const unplaced = [];
    ordered.forEach((task) => {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, task.id);
      const date = hasOverride ? overrides[task.id] : (basePlanByTaskId.get(task.id) ?? null);
      if (date && byDate.has(date)) byDate.get(date).push(task);
      else unplaced.push(task);
    });
    return { byDate, unplaced };
  }, [ordered, overrides, basePlanByTaskId, days]);

  const effectiveDateFor = (taskId) => {
    if (Object.prototype.hasOwnProperty.call(overrides, taskId)) return overrides[taskId];
    return basePlanByTaskId.get(taskId) ?? null;
  };

  const moveTask = (taskId, date) => {
    setOverrides((prev) => ({ ...prev, [taskId]: date }));
    setApplyMessage(null);
  };

  const resetMoves = () => { setOverrides({}); setApplyMessage(null); };

  const updateDayCapacity = (date, field, value) => setDayPlan(date, { [field]: value });
  const resetDayCapacity = (date) => setDayPlan(date, { capacityTimeMin: null, capacityEnergy: null });
  const toggleCapacityExpanded = (date) => {
    setExpandedCapacity((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date); else next.add(date);
      return next;
    });
  };

  const placedCount = days.reduce((n, d) => n + (dayAssignments.byDate.get(d)?.length || 0), 0);

  const applyPlan = async () => {
    const toApply = [];
    days.forEach((date) => {
      (dayAssignments.byDate.get(date) || []).forEach((task) => toApply.push({ id: task.id, date }));
    });
    if (toApply.length === 0) return;
    await Promise.all(toApply.map(({ id, date }) => updateTask(id, { scheduledDate: date })));
    setOverrides({});
    setApplyMessage(`Applied ${toApply.length} task${toApply.length === 1 ? '' : 's'} to their scheduled dates.`);
  };

  return (
    <div className="orb-planner">
      <div className="orb-planner-head">
        <h2 className="orb-planner-h2">Planner</h2>
        <p className="orb-planner-sub">
          Auto-lays your open, unblocked, unscheduled tasks across the days ahead based on each day's time/energy
          budget. Nothing is scheduled until you Apply.
        </p>
      </div>

      <div className="orb-card orb-planner-controls">
        <div className="orb-planner-control-group">
          <span className="orb-planner-control-label">Start from</span>
          <div className="orb-planner-toggle" role="tablist" aria-label="Start day">
            <button type="button" className={`orb-tab${startMode === 'today' ? ' active' : ''}`} onClick={() => setStartMode('today')}>Today</button>
            <button type="button" className={`orb-tab${startMode === 'tomorrow' ? ' active' : ''}`} onClick={() => setStartMode('tomorrow')}>Tomorrow</button>
          </div>
        </div>

        <div className="orb-planner-control-group">
          <span className="orb-planner-control-label">Horizon</span>
          <div className="orb-planner-horizon">
            {HORIZON_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`orb-chip orb-planner-preset${horizonDays === n ? ' active' : ''}`}
                onClick={() => setHorizonDays(n)}
              >
                {n}d
              </button>
            ))}
            <input
              type="number" min={1} max={60} className="orb-plan-cap-num"
              value={horizonDays}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value));
                setHorizonDays(Number.isFinite(n) && n > 0 ? Math.min(60, n) : 1);
              }}
            />
            <span className="orb-plan-cap-unit">days</span>
          </div>
        </div>

        <div className="orb-planner-control-group orb-planner-actions">
          <button type="button" className="orb-btn" onClick={resetMoves} disabled={Object.keys(overrides).length === 0}>
            Reset manual moves
          </button>
          <button type="button" className="orb-btn orb-btn-primary" onClick={applyPlan} disabled={placedCount === 0}>
            Apply plan ({placedCount})
          </button>
        </div>
      </div>

      {applyMessage && (
        <div className="orb-planner-applied">
          {applyMessage}
          <button type="button" className="orb-carryover-nudge-dismiss" onClick={() => setApplyMessage(null)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="orb-planner-summary">
        {ordered.length} ready task{ordered.length === 1 ? '' : 's'} queued · {placedCount} placed across {days.length} day{days.length === 1 ? '' : 's'}
        {dayAssignments.unplaced.length > 0 && ` · ${dayAssignments.unplaced.length} unscheduled`}
      </div>

      {basePlan.unplaced.length > 0 && (
        <div className="orb-planner-note">
          The planner couldn't fit {basePlan.unplaced.length} task{basePlan.unplaced.length === 1 ? '' : 's'} inside this
          {' '}{horizonDays}-day horizon — widen the horizon, free up capacity, or move them manually below.
        </div>
      )}

      <div className="orb-planner-days">
        {days.map((date) => {
          const dayPlan = getDayPlan(date);
          const cap = capacityFor(date);
          const dayTasks = dayAssignments.byDate.get(date) || [];
          const sums = sumForDay(dayTasks);
          const isToday = date === today;
          const customized = dayPlan.capacityTimeMin != null || dayPlan.capacityEnergy != null;
          const capExpanded = expandedCapacity.has(date);

          return (
            <div key={date} className={`orb-card orb-planner-day${isToday ? ' today' : ''}`}>
              <div className="orb-planner-day-head">
                <span className="orb-planner-day-label">
                  {formatDayLabel(date, today)}
                  {isToday && <span className="orb-planner-day-tag">Today</span>}
                </span>
                <span className="orb-planner-day-date">{date}</span>
                <button
                  type="button"
                  className={`orb-btn orb-planner-cap-toggle${customized ? ' customized' : ''}`}
                  onClick={() => toggleCapacityExpanded(date)}
                  aria-expanded={capExpanded}
                >
                  Capacity {capExpanded ? '▾' : '▸'}{customized && !capExpanded ? ' •' : ''}
                </button>
              </div>

              <div className="orb-planner-day-bars">
                <CapacityBar label="Time" used={sums.time} cap={cap.timeMin} unit="m" />
                <CapacityBar label="Energy" used={sums.energy} cap={cap.energy} unit="" />
              </div>

              {capExpanded && (
                <CapacityEditor
                  dayPlan={dayPlan}
                  effective={{
                    timeMin: cap.timeMin, energy: cap.energy,
                    defaultTimeMin: settings.capacityDefault.timeMin, defaultEnergy: settings.capacityDefault.energy,
                  }}
                  onChange={(field, value) => updateDayCapacity(date, field, value)}
                  onReset={() => resetDayCapacity(date)}
                />
              )}

              <div className="orb-planner-day-tasks">
                {dayTasks.length === 0 ? (
                  <div className="orb-planner-day-empty">Nothing planned</div>
                ) : (
                  dayTasks.map((task) => (
                    <PlannedTask
                      key={task.id} task={task} days={days} today={today}
                      effectiveDate={effectiveDateFor(task.id)} onMove={moveTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {dayAssignments.unplaced.length > 0 && (
        <div className="orb-card orb-planner-unplaced">
          <div className="orb-planner-day-head">
            <span className="orb-planner-day-label">Unscheduled</span>
            <span className="orb-planner-day-date">didn't fit — or moved out — of this horizon</span>
          </div>
          <div className="orb-planner-day-tasks">
            {dayAssignments.unplaced.map((task) => (
              <PlannedTask
                key={task.id} task={task} days={days} today={today}
                effectiveDate={effectiveDateFor(task.id)} onMove={moveTask}
              />
            ))}
          </div>
        </div>
      )}

      {ordered.length === 0 && (
        <div className="orb-planner-zero">No open, unblocked, unscheduled tasks to plan — inbox and Today are clear.</div>
      )}
    </div>
  );
}
