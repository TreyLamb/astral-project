import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFitness } from './fitnessContext';
import { activityType, mealType, isoDate, todayISO, resolveGroups } from './fitnessConfig';
import { formatDistance, secToClock } from './units';
import GroupPicker from './GroupPicker';
import MealDayView from './MealDayView';
import GoalEditorModal from './GoalEditorModal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); x.setHours(0, 0, 0, 0); return x; }
function startOfWeek(d) { return addDays(d, -new Date(d).getDay()); }

function chipLabel(w, units) {
  if (w.distanceM != null) {
    const digits = (units.distance === 'm' || units.distance === 'yd') ? 0 : 2;
    return formatDistance(w.distanceM, units.distance, digits);
  }
  if (w.durationSec != null) return secToClock(w.durationSec);
  return '';
}

function WorkoutChip({ w, type, label, group, goal, selected, onEdit, onCtrlClick, onShiftClick }) {
  const completed = w.status === 'completed';
  // completed = filled with the type colour; planned = outline only.
  const style = completed
    ? { background: type.color, borderColor: type.color, color: '#0a0e12' }
    : { background: 'transparent', borderColor: type.color, color: type.color };
  const goalTarget = w.metrics?.goalTarget;
  return (
    <button
      type="button"
      data-id={w.id}
      className={`ft-chip${completed ? ' ft-chip-done' : ' ft-chip-planned'}${selected ? ' ft-chip-selected' : ''}`}
      style={style}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', w.id); e.dataTransfer.effectAllowed = 'move'; }}
      onClick={(e) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) { onCtrlClick(w.id); return; }
        if (e.shiftKey) { onShiftClick(w.id); return; }
        onEdit(w.id);
      }}
      title={`${type.name}${label ? ' · ' + label : ''} (${completed ? 'done' : 'planned'})${group ? ` · Group #${group.number}` : ''}${goal ? ` · 🎯 ${goal.label || goal.activityType} goal${goalTarget ? ' — ' + goalTarget : ''}` : ''}`}
    >
      <span className="ft-chip-icon">{type.icon}</span>
      {label && <span className="ft-chip-text">{label}</span>}
      {group && <span className="ft-chip-group-dot" style={{ background: group.color }} />}
      {goal && <span className="ft-chip-goal-pin" aria-hidden="true">🎯</span>}
    </button>
  );
}

function MealChip({ m, type, selected, onEdit, onCtrlClick, onShiftClick }) {
  const logged = m.status === 'logged';
  const style = logged
    ? { background: type.color, borderColor: type.color, color: '#0a0e12' }
    : { background: 'transparent', borderColor: type.color, color: type.color };
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
      <span className="ft-chip-icon">{type.icon}</span>
      <span className="ft-chip-text">{label}</span>
    </button>
  );
}

function DayCell({
  date, items, types, units, groups, goalsById, selected, isToday, inMonth, variant, onAdd, onEdit, onCtrlClick, onShiftClick, onDropWorkout,
  showMeals, mealItems, mealTypes, mealSelected, onAddMeal, onEditMeal, onMealCtrlClick, onMealShiftClick,
}) {
  const iso = isoDate(date);
  const [over, setOver] = useState(false);

  const eventsCol = (
    <div className="ft-cell-items">
      {items.map((w) => {
        const t = activityType(types, w.activityType);
        const group = w.groupId ? groups.find((g) => g.id === w.groupId) || null : null;
        const goal = w.goalId ? goalsById.get(w.goalId) || null : null;
        return (
          <WorkoutChip
            key={w.id} w={w} type={t} label={chipLabel(w, units)} group={group} goal={goal}
            selected={selected.has(w.id)} onEdit={onEdit} onCtrlClick={onCtrlClick} onShiftClick={onShiftClick}
          />
        );
      })}
    </div>
  );

  return (
    <div
      className={`ft-cell ft-cell-${variant}${inMonth ? '' : ' ft-cell-dim'}${isToday ? ' ft-cell-today' : ''}${over ? ' ft-cell-over' : ''}`}
      onClick={() => onAdd(iso)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (!over) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData('text/plain'); if (id) onDropWorkout(id, iso); }}
    >
      <div className="ft-cell-head">
        <span className="ft-cell-num">{date.getDate()}</span>
        {variant !== 'month' && <span className="ft-cell-dow">{WEEKDAYS[date.getDay()]}</span>}
      </div>
      {showMeals ? (
        <div className="ft-cell-cols">
          <div
            className="ft-cell-col ft-cell-col-meals"
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
    </div>
  );
}

// Rectangle overlap test in viewport (clientX/clientY) coordinates — used by
// both the marquee drag box and each chip's own getBoundingClientRect().
function rectsIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export default function CalendarView() {
  const {
    workouts, activityTypes, settings, updateSettings, moveWorkout, updateWorkout, openQuickAdd,
    meals, mealTypes, goals, openMealQuickAdd, updateGoal, removeWorkout,
  } = useFitness();
  const navigate = useNavigate();
  const units = settings.units;
  const groups = resolveGroups(settings);
  const goalsById = useMemo(() => new Map(goals.map((g) => [g.id, g])), [goals]);

  // Goals live inline on the calendar too — not Dashboard-only — so changes
  // (accept/edit/abandon) are visible immediately on the same screen instead
  // of requiring a tab switch to see what changed.
  const [goalsPanelOpen, setGoalsPanelOpen] = useState(false);
  const [goalEditor, setGoalEditor] = useState(null); // null | 'new' | goal object
  const activeGoals = useMemo(
    () => [...goals].filter((g) => g.status !== 'abandoned').sort((a, b) => (a.targetDate || '9999').localeCompare(b.targetDate || '9999')),
    [goals],
  );
  async function abandonGoal(g) {
    await updateGoal(g.id, { status: 'abandoned' });
    const stale = workouts.filter((w) => w.goalId === g.id && w.status === 'planned' && w.date >= todayISO());
    for (const w of stale) await removeWorkout(w.id);
  }

  const [view, setView] = useState('month');
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });

  // two sticky calendar toggles (persisted so they survive reload/navigation)
  const showMeals = !!settings.calendarPrefs?.showMealsOnCalendar;
  const mealDayView = !!settings.calendarPrefs?.mealDayView;
  const toggleCalendarPref = (key) => updateSettings({ calendarPrefs: { ...settings.calendarPrefs, [key]: !settings.calendarPrefs?.[key] } });

  // meal selection is a lighter-weight sibling of the workout multi-select below
  // — single-toggle only (✂️ no ordered shift-range or marquee box-select for meals).
  const [mealSelected, setMealSelected] = useState(() => new Set());
  const toggleMealSelected = (mid) => setMealSelected((prev) => {
    const next = new Set(prev);
    if (next.has(mid)) next.delete(mid); else next.add(mid);
    return next;
  });
  const onAddMeal = (iso) => openMealQuickAdd(iso);
  const onEditMeal = (id) => { setMealSelected(new Set()); navigate(`meal/${id}`); };
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
    for (const w of workouts) (map[w.date] ||= []).push(w);
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    }
    return map;
  }, [workouts]);

  const onEdit = (id) => { clearSelection(); navigate(`entry/${id}`); };
  const onAdd = (iso) => openQuickAdd(iso);
  const onDropWorkout = (id, iso) => moveWorkout(id, iso);

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
  else if (view === 'week') { const s = startOfWeek(cursor); title = `Week of ${MONTHS[s.getMonth()].slice(0, 3)} ${s.getDate()}`; }
  else title = `${WEEKDAYS[cursor.getDay()]}, ${MONTHS[cursor.getMonth()].slice(0, 3)} ${cursor.getDate()}`;

  const cellProps = (date, inMonth) => ({
    date, inMonth,
    isToday: isoDate(date) === todayISO(),
    items: byDate[isoDate(date)] || [],
    types: activityTypes, units, groups, goalsById, selected, onAdd, onEdit, onCtrlClick, onShiftClick, onDropWorkout,
    showMeals, mealItems: mealsByDate[isoDate(date)] || [], mealTypes, mealSelected,
    onAddMeal, onEditMeal, onMealCtrlClick: toggleMealSelected, onMealShiftClick: toggleMealSelected,
  });

  return (
    <div className="ft-cal">
      <div className="ft-cal-bar">
        <div className="ft-cal-nav">
          <button type="button" className="ft-nav-btn" onClick={() => step(-1)} aria-label="Previous">‹</button>
          <button type="button" className="ft-nav-btn ft-today-btn" onClick={goToday}>Today</button>
          <button type="button" className="ft-nav-btn" onClick={() => step(1)} aria-label="Next">›</button>
          <h2 className="ft-cal-title">{title}</h2>
        </div>
        <div className="ft-view-toggle">
          {['month', 'week', 'day'].map((v) => (
            <button key={v} type="button" className={`ft-view-btn${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="ft-cal-toggles">
        <button
          type="button"
          className={`ft-toggle-btn${mealDayView ? ' active' : ''}`}
          onClick={() => toggleCalendarPref('mealDayView')}
          title="Day view becomes a meal schedule instead of workouts"
        >
          🍽 Meal day view{view !== 'day' ? ' (switch to Day)' : ''}
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
      </div>

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
                return (
                  <div key={g.id} className="ft-goal-row">
                    <span className="ft-goal-icon">{t.icon}</span>
                    <div className="ft-goal-info">
                      <span className="ft-goal-label">{t.name} — {g.label || g.kind}</span>
                      <span className="ft-goal-meta">
                        <span className={`ft-goal-badge ft-goal-${g.status}`}>{g.status}</span>
                        {g.daysPerWeek}x/wk
                        {g.forecastWeeks != null && ` · ~${g.forecastWeeks} wk${g.forecastWeeks === 1 ? '' : 's'}`}
                        {g.targetDate && ` · by ${g.targetDate}`}
                      </span>
                    </div>
                    <div className="ft-goal-actions">
                      <button type="button" className="ft-btn-ghost" onClick={() => setGoalEditor(g)}>Edit</button>
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
          const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
          const gridStart = startOfWeek(monthStart);
          const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
          return (
            <div className="ft-month">
              <div className="ft-weekhead">{WEEKDAYS.map((d) => <div key={d} className="ft-weekhead-cell">{d}</div>)}</div>
              <div className="ft-month-grid">
                {days.map((d) => (
                  <DayCell key={isoDate(d)} variant="month" {...cellProps(d, d.getMonth() === cursor.getMonth())} />
                ))}
              </div>
            </div>
          );
        })()}

        {view === 'week' && (() => {
          const s = startOfWeek(cursor);
          const days = Array.from({ length: 7 }, (_, i) => addDays(s, i));
          return (
            <div className="ft-week">
              {days.map((d) => <DayCell key={isoDate(d)} variant="week" {...cellProps(d, true)} />)}
            </div>
          );
        })()}

        {view === 'day' && (
          <div className="ft-day">
            {mealDayView
              ? <MealDayView date={cursor} />
              : <DayCell variant="day" {...cellProps(cursor, true)} />}
          </div>
        )}
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

      <p className="ft-cal-hint">Click a day to schedule · drag a workout to reschedule · click to edit · Ctrl/Shift-click or drag a box to select multiple</p>

      {goalEditor && (
        <GoalEditorModal goal={goalEditor === 'new' ? null : goalEditor} onClose={() => setGoalEditor(null)} />
      )}
    </div>
  );
}
