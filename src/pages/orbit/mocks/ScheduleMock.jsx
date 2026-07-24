import { useMemo, useState } from 'react';
import { MOCK_TASKS, MOCK_AREAS, TODAY } from '../mockData';
import './ScheduleMock.css';

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const ROW_H = 60;
const DEFAULT_DURATION_MIN = 30;
const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

const pad2 = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return toISO(d); };
const timeToMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const formatHourLabel = (h) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;

const WEEK_DATES = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i));

const areaById = (id) => MOCK_AREAS.find((a) => a.id === id);
const isOverdue = (t) => t.dueDate && t.dueDate < TODAY && t.status !== 'done' && t.status !== 'killed';

// Simplified overlap layout: a real calendar would bucket overlaps into their
// own clusters, but for this mock's small dataset a single shared column
// count is plenty to keep same-hour blocks from stacking on top of each other.
function layoutDayBlocks(dayTasks) {
  const withTimes = dayTasks
    .filter((t) => t.scheduledTime)
    .map((t) => {
      const start = timeToMinutes(t.scheduledTime);
      const dur = t.estimateMin || DEFAULT_DURATION_MIN;
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

export default function ScheduleMock() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [viewMode, setViewMode] = useState('day');
  const [drag, setDrag] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);

  const todayTasks = useMemo(() => tasks.filter((t) => t.scheduledDate === TODAY), [tasks]);
  const dayBlocks = useMemo(() => layoutDayBlocks(todayTasks), [todayTasks]);
  const unscheduled = useMemo(
    () => tasks.filter((t) => (t.status === 'todo' || t.status === 'doing') && !t.scheduledDate),
    [tasks],
  );

  const startDrag = (e, task) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: task.id, x: e.clientX, y: e.clientY });
  };

  const readHoverTarget = (clientX, clientY) => {
    // the dragged element itself gets pointer-events:none while dragging
    // (see CSS) specifically so this hit-test lands on the thing beneath it.
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
      setTasks((prev) => prev.map((t) => (t.id === task.id
        ? { ...t, scheduledDate: TODAY, scheduledTime: `${pad2(target.key)}:00` } : t)));
    } else if (target?.kind === 'day') {
      setTasks((prev) => prev.map((t) => (t.id === task.id
        ? { ...t, scheduledDate: target.key, scheduledTime: t.scheduledTime || '09:00' } : t)));
    } else if (target?.kind === 'tray') {
      setTasks((prev) => prev.map((t) => (t.id === task.id
        ? { ...t, scheduledDate: null, scheduledTime: null } : t)));
    }
    setDrag(null);
    setHoverTarget(null);
  };

  const draggedTask = drag && tasks.find((t) => t.id === drag.id);
  const todayLabel = new Date(`${TODAY}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="orb-sched">
      <div className="orb-sched-toolbar">
        <div className="orb-sched-toggle">
          <button type="button" className={`orb-btn orb-sched-toggle-btn${viewMode === 'day' ? ' active' : ''}`} onClick={() => setViewMode('day')}>Day</button>
          <button type="button" className={`orb-btn orb-sched-toggle-btn${viewMode === 'week' ? ' active' : ''}`} onClick={() => setViewMode('week')}>Week</button>
        </div>
        <div className="orb-sched-date">{viewMode === 'day' ? todayLabel : 'Next 7 days'}</div>
      </div>

      <div className="orb-sched-body">
        {viewMode === 'day' ? (
          <div className="orb-sched-daygrid">
            <div className="orb-sched-gutter">
              {HOURS.map((h) => <div key={h} className="orb-sched-hour-label" style={{ height: ROW_H }}>{formatHourLabel(h)}</div>)}
            </div>
            <div className="orb-sched-track" style={{ height: HOURS.length * ROW_H }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  data-hour={h}
                  className={`orb-sched-hour-row${hoverTarget?.kind === 'hour' && hoverTarget.key === h ? ' drag-over' : ''}`}
                  style={{ height: ROW_H }}
                />
              ))}
              {dayBlocks.map((b) => {
                const area = areaById(b.task.areaId);
                const dragging = drag?.id === b.task.id;
                return (
                  <div
                    key={b.task.id}
                    className={`orb-card orb-sched-block${dragging ? ' dragging' : ''}`}
                    style={{ top: b.top, height: b.height, left: b.left, width: b.width }}
                    onPointerDown={(e) => startDrag(e, b.task)}
                    onPointerMove={(e) => moveDrag(e, b.task)}
                    onPointerUp={(e) => endDrag(e, b.task)}
                    onPointerCancel={(e) => endDrag(e, b.task)}
                  >
                    <div className="orb-sched-block-time">{b.task.scheduledTime}</div>
                    <div className="orb-sched-block-title">{b.task.title}</div>
                    {area && (
                      <span className="orb-chip orb-sched-block-chip" style={{ '--orb-chip-color': area.color }}>
                        <span className="orb-chip-dot" />{area.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="orb-sched-week">
            {WEEK_DATES.map((iso) => {
              const dayTasks = tasks
                .filter((t) => t.scheduledDate === iso)
                .sort((a, b) => (a.scheduledTime || '99:99').localeCompare(b.scheduledTime || '99:99'));
              const isToday = iso === TODAY;
              const label = new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
              return (
                <div
                  key={iso}
                  data-day={iso}
                  className={`orb-sched-week-col${isToday ? ' today' : ''}${hoverTarget?.kind === 'day' && hoverTarget.key === iso ? ' drag-over' : ''}`}
                >
                  <div className="orb-sched-week-col-head">
                    {label}{isToday && <span className="orb-sched-today-tag">Today</span>}
                  </div>
                  <div className="orb-sched-week-col-body">
                    {dayTasks.length === 0 && <div className="orb-sched-week-empty">—</div>}
                    {dayTasks.map((task) => {
                      const area = areaById(task.areaId);
                      const dragging = drag?.id === task.id;
                      return (
                        <div
                          key={task.id}
                          className={`orb-sched-week-chip${dragging ? ' dragging' : ''}${task.status === 'done' ? ' done' : ''}${task.status === 'killed' ? ' killed' : ''}`}
                          onPointerDown={(e) => startDrag(e, task)}
                          onPointerMove={(e) => moveDrag(e, task)}
                          onPointerUp={(e) => endDrag(e, task)}
                          onPointerCancel={(e) => endDrag(e, task)}
                        >
                          {area && <span className="orb-chip-dot" style={{ '--orb-chip-color': area.color }} />}
                          {task.scheduledTime && <span className="orb-sched-week-chip-time">{task.scheduledTime}</span>}
                          <span className="orb-sched-week-chip-title">{task.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <aside data-tray className={`orb-sched-tray${hoverTarget?.kind === 'tray' ? ' drag-over' : ''}`}>
          <div className="orb-sched-tray-head">Unscheduled <span className="orb-sched-tray-count">{unscheduled.length}</span></div>
          <div className="orb-sched-tray-list">
            {unscheduled.length === 0 && <div className="orb-sched-week-empty">Nothing left to schedule</div>}
            {unscheduled.map((task) => {
              const area = areaById(task.areaId);
              const dragging = drag?.id === task.id;
              return (
                <div
                  key={task.id}
                  className={`orb-row orb-sched-tray-item${dragging ? ' dragging' : ''}`}
                  onPointerDown={(e) => startDrag(e, task)}
                  onPointerMove={(e) => moveDrag(e, task)}
                  onPointerUp={(e) => endDrag(e, task)}
                  onPointerCancel={(e) => endDrag(e, task)}
                >
                  <div className="orb-sched-tray-item-main">
                    <div className="orb-sched-tray-item-title">{task.title}</div>
                    <div className="orb-sched-tray-item-meta">
                      {area && (
                        <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
                          <span className="orb-chip-dot" />{area.name}
                        </span>
                      )}
                      {isOverdue(task) && <span className="orb-chip orb-flag-warn">Overdue</span>}
                    </div>
                  </div>
                  <div className="orb-sched-tray-item-est">{task.estimateMin ? `${task.estimateMin}m` : '—'}</div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {draggedTask && (
        <div className="orb-sched-ghost" style={{ left: drag.x, top: drag.y }}>{draggedTask.title}</div>
      )}

      <p className="orb-sched-caption">This timeline is a stand-in for what would eventually sync onto the MyFitnessTracker calendar — framing only, no real integration here.</p>
    </div>
  );
}
