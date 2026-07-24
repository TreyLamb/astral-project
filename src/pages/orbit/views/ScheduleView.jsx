import { useMemo, useState } from 'react';
import { useOrbit } from '../orbitContext';
import { compareForToday, isOverdue } from '../calc/priority';
import './ScheduleView.css';

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const ROW_H = 60;
const DEFAULT_DURATION_MIN = 30; // matches PlannerView's UNESTIMATED_TIME_MIN convention
const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return toISO(d); };
const timeToMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const formatHourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;

// Simplified overlap layout: buckets same-hour blocks into shared columns so
// they don't stack on top of each other. Same approach as ScheduleMock.
function layoutDayBlocks(dayTasks) {
  const withTimes = dayTasks
    .filter((t) => t.scheduledTime)
    .map((t) => {
      const start = timeToMinutes(t.scheduledTime);
      const dur = t.timeMin || DEFAULT_DURATION_MIN;
      return { task: t, start, end: start + dur };
    })
    .sort((a, b) => a.start - b.start);

  const colEnds = [];
  const placed = withTimes.map((b) => {
    let col = colEnds.findIndex((end) => end <= b.start);
    if (col === -1) { col = colEnds.length; colEnds.push(b.end); } else colEnds[col] = b.end;
    return { ...b, col };
  });
  const colCount = Math.max(1, colEnds.length);
  return placed.map((b) => ({
    ...b,
    top: ((b.start - DAY_START_HOUR * 60) / 60) * ROW_H,
    height: Math.max(26, ((b.end - b.start) / 60) * ROW_H),
    left: `${(b.col / colCount) * 100}%`,
    width: `${(1 / colCount) * 100}%`,
  }));
}

// Day/week time-block on real tasks. Drag mechanics mirror ScheduleMock
// (pointer capture + elementFromPoint hit-testing via data-hour/data-day/
// data-tray) but every drop persists through updateTask.
export default function ScheduleView() {
  const { tasks, areas, today, updateTask } = useOrbit();
  const [viewMode, setViewMode] = useState('day');
  const [selectedDate, setSelectedDate] = useState(today);
  const [drag, setDrag] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);

  const areaById = (id) => areas.find((a) => a.id === id);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(selectedDate, i)),
    [selectedDate],
  );

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.scheduledDate === selectedDate && t.status !== 'killed'),
    [tasks, selectedDate],
  );
  const dayBlocks = useMemo(() => layoutDayBlocks(dayTasks), [dayTasks]);
  const unscheduled = useMemo(
    () => tasks
      .filter((t) => (t.status === 'todo' || t.status === 'doing') && !t.scheduledDate)
      .sort((a, b) => compareForToday(a, b, today)),
    [tasks, today],
  );

  const startDrag = (e, task) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: task.id, x: e.clientX, y: e.clientY });
  };
  const readHoverTarget = (clientX, clientY) => {
    // the dragged element itself is pointer-events:none while dragging (see
    // CSS) specifically so this hit-test lands on the thing beneath it.
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const hourEl = el.closest('[data-hour]');
    if (hourEl) return { kind: 'hour', key: Number(hourEl.dataset.hour) };
    const dayEl = el.closest('[data-day]');
    if (dayEl) return { kind: 'day', key: dayEl.dataset.day };
    const trayEl = el.closest('[data-tray]');
    if (trayEl) return { kind: 'tray' };
    return null;
  };
  const moveDrag = (e, task) => {
    if (!drag || drag.id !== task.id) return;
    setDrag({ id: task.id, x: e.clientX, y: e.clientY });
    setHoverTarget(readHoverTarget(e.clientX, e.clientY));
  };
  const endDrag = (e, task) => {
    if (!drag || drag.id !== task.id) return;
    const target = readHoverTarget(e.clientX, e.clientY);
    if (target?.kind === 'hour') {
      updateTask(task.id, { scheduledDate: selectedDate, scheduledTime: `${pad2(target.key)}:00` });
    } else if (target?.kind === 'day') {
      updateTask(task.id, { scheduledDate: target.key, scheduledTime: task.scheduledTime || '09:00' });
    } else if (target?.kind === 'tray') {
      updateTask(task.id, { scheduledDate: null, scheduledTime: null });
    }
    setDrag(null);
    setHoverTarget(null);
  };

  const draggedTask = drag && tasks.find((t) => t.id === drag.id);
  const dayLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const weekLabel = `${weekDates[0]} – ${weekDates[6]}`;
  const navStep = viewMode === 'week' ? 7 : 1;

  return (
    <div className="orb-schedv">
      <div className="orb-schedv-toolbar">
        <div className="orb-schedv-toggle">
          <button type="button" className={`orb-btn orb-schedv-toggle-btn${viewMode === 'day' ? ' active' : ''}`} onClick={() => setViewMode('day')}>Day</button>
          <button type="button" className={`orb-btn orb-schedv-toggle-btn${viewMode === 'week' ? ' active' : ''}`} onClick={() => setViewMode('week')}>Week</button>
        </div>
        <div className="orb-schedv-nav">
          <button type="button" className="orb-btn" onClick={() => setSelectedDate((d) => addDays(d, -navStep))} aria-label="Earlier">‹</button>
          <span className="orb-schedv-date">{viewMode === 'day' ? dayLabel : weekLabel}</span>
          <button type="button" className="orb-btn" onClick={() => setSelectedDate((d) => addDays(d, navStep))} aria-label="Later">›</button>
          <button type="button" className="orb-btn" onClick={() => setSelectedDate(today)}>Today</button>
        </div>
      </div>

      <div className="orb-schedv-body">
        {viewMode === 'day' ? (
          <div className="orb-schedv-daygrid">
            <div className="orb-schedv-gutter">
              {HOURS.map((h) => <div key={h} className="orb-schedv-hour-label" style={{ height: ROW_H }}>{formatHourLabel(h)}</div>)}
            </div>
            <div className="orb-schedv-track" style={{ height: HOURS.length * ROW_H }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  data-hour={h}
                  className={`orb-schedv-hour-row${hoverTarget?.kind === 'hour' && hoverTarget.key === h ? ' drag-over' : ''}`}
                  style={{ height: ROW_H }}
                />
              ))}
              {dayBlocks.map((b) => {
                const area = areaById(b.task.areaId);
                const dragging = drag?.id === b.task.id;
                return (
                  <div
                    key={b.task.id}
                    className={`orb-card orb-schedv-block${dragging ? ' dragging' : ''}${b.task.status === 'done' ? ' done' : ''}`}
                    style={{ top: b.top, height: b.height, left: b.left, width: b.width }}
                    onPointerDown={(e) => startDrag(e, b.task)}
                    onPointerMove={(e) => moveDrag(e, b.task)}
                    onPointerUp={(e) => endDrag(e, b.task)}
                    onPointerCancel={(e) => endDrag(e, b.task)}
                  >
                    <div className="orb-schedv-block-time">{b.task.scheduledTime}</div>
                    <div className="orb-schedv-block-title">{b.task.title}</div>
                    {area && (
                      <span className="orb-chip orb-schedv-block-chip" style={{ '--orb-chip-color': area.color }}>
                        <span className="orb-chip-dot" />{area.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="orb-schedv-week">
            {weekDates.map((iso) => {
              const tasksForDay = tasks
                .filter((t) => t.scheduledDate === iso)
                .sort((a, b) => (a.scheduledTime || '99:99').localeCompare(b.scheduledTime || '99:99'));
              const isToday = iso === today;
              const label = new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
              return (
                <div
                  key={iso}
                  data-day={iso}
                  className={`orb-schedv-week-col${isToday ? ' today' : ''}${hoverTarget?.kind === 'day' && hoverTarget.key === iso ? ' drag-over' : ''}`}
                >
                  <div className="orb-schedv-week-col-head">
                    {label}{isToday && <span className="orb-schedv-today-tag">Today</span>}
                  </div>
                  <div className="orb-schedv-week-col-body">
                    {tasksForDay.length === 0 && <div className="orb-schedv-week-empty">—</div>}
                    {tasksForDay.map((task) => {
                      const area = areaById(task.areaId);
                      const dragging = drag?.id === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`orb-schedv-week-chip${dragging ? ' dragging' : ''}${task.status === 'done' ? ' done' : ''}${task.status === 'killed' ? ' killed' : ''}`}
                          onPointerDown={(e) => startDrag(e, task)}
                          onPointerMove={(e) => moveDrag(e, task)}
                          onPointerUp={(e) => endDrag(e, task)}
                          onPointerCancel={(e) => endDrag(e, task)}
                        >
                          {area && <span className="orb-chip-dot" style={{ '--orb-chip-color': area.color }} />}
                          {task.scheduledTime && <span className="orb-schedv-week-chip-time">{task.scheduledTime}</span>}
                          <span className="orb-schedv-week-chip-title">{task.title}</span>
                          {isOverdue(task, today) && <span className="orb-schedv-week-chip-warn" title="Overdue">!</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <aside data-tray className={`orb-schedv-tray${hoverTarget?.kind === 'tray' ? ' drag-over' : ''}`}>
          <div className="orb-schedv-tray-head">Unscheduled <span className="orb-schedv-tray-count">{unscheduled.length}</span></div>
          <div className="orb-schedv-tray-list">
            {unscheduled.length === 0 && <div className="orb-schedv-week-empty">Nothing left to schedule</div>}
            {unscheduled.map((task) => {
              const area = areaById(task.areaId);
              const dragging = drag?.id === task.id;
              return (
                <div
                  key={task.id}
                  className={`orb-row orb-schedv-tray-item${dragging ? ' dragging' : ''}`}
                  onPointerDown={(e) => startDrag(e, task)}
                  onPointerMove={(e) => moveDrag(e, task)}
                  onPointerUp={(e) => endDrag(e, task)}
                  onPointerCancel={(e) => endDrag(e, task)}
                >
                  <div className="orb-schedv-tray-item-main">
                    <div className="orb-schedv-tray-item-title">{task.title}</div>
                    <div className="orb-schedv-tray-item-meta">
                      {area && (
                        <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
                          <span className="orb-chip-dot" />{area.name}
                        </span>
                      )}
                      {isOverdue(task, today) && <span className="orb-chip orb-flag-warn">Overdue</span>}
                    </div>
                  </div>
                  <div className="orb-schedv-tray-item-est">{task.timeMin ? `${task.timeMin}m` : '—'}</div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {draggedTask && (
        <div className="orb-schedv-ghost" style={{ left: drag.x, top: drag.y }}>{draggedTask.title}</div>
      )}
    </div>
  );
}
