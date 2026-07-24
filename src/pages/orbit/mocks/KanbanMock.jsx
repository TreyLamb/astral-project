import { useMemo, useState } from 'react';
import { MOCK_TASKS, MOCK_AREAS, TODAY } from '../mockData';
import './KanbanMock.css';

const LANE_COLS = [
  { key: 'now', label: 'Now' },
  { key: 'next', label: 'Next' },
  { key: 'later', label: 'Later' },
];
const STATUS_COLS = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done' },
  { key: 'killed', label: 'Killed', muted: true },
];
const GROUP_FIELD = { lane: 'lane', status: 'status', area: 'areaId' };
const GROUP_LABEL = { lane: 'By Lane', status: 'By Status', area: 'By Area' };

const areaById = (id) => MOCK_AREAS.find((a) => a.id === id);
const isOverdue = (t) => t.dueDate && t.dueDate < TODAY && t.status !== 'done' && t.status !== 'killed';

export default function KanbanMock() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [grouping, setGrouping] = useState('lane');
  const [dragId, setDragId] = useState(null);
  const [dragDelta, setDragDelta] = useState({ dx: 0, dy: 0 });
  const [hoverKey, setHoverKey] = useState(null);

  const field = GROUP_FIELD[grouping];
  const columns = useMemo(() => {
    if (grouping === 'status') return STATUS_COLS;
    if (grouping === 'area') return MOCK_AREAS.map((a) => ({ key: a.id, label: a.name, color: a.color }));
    return LANE_COLS;
  }, [grouping]);

  const grouped = useMemo(() => {
    const map = {};
    columns.forEach((c) => { map[c.key] = []; });
    tasks.forEach((t) => { if (map[t[field]]) map[t[field]].push(t); });
    return map;
  }, [tasks, columns, field]);

  const startDrag = (e, task) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(task.id);
    setDragDelta({ dx: 0, dy: 0, startX: e.clientX, startY: e.clientY });
  };

  const moveDrag = (e, task) => {
    if (dragId !== task.id) return;
    setDragDelta((d) => ({ ...d, dx: e.clientX - d.startX, dy: e.clientY - d.startY }));
    // the dragged card gets pointer-events:none in CSS specifically so this
    // hit-test finds the column underneath it instead of the card itself.
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const col = el && el.closest('[data-col-key]');
    setHoverKey(col ? col.dataset.colKey : null);
  };

  const endDrag = (e, task) => {
    if (dragId !== task.id) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const col = el && el.closest('[data-col-key]');
    if (col) {
      const key = col.dataset.colKey;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, [field]: key } : t)));
    }
    setDragId(null);
    setHoverKey(null);
  };

  return (
    <div className="orb-kanban">
      <div className="orb-kanban-toolbar">
        <div className="orb-kanban-group-toggle">
          {Object.keys(GROUP_FIELD).map((g) => (
            <button
              key={g}
              type="button"
              className={`orb-btn orb-kanban-group-btn${grouping === g ? ' active' : ''}`}
              onClick={() => setGrouping(g)}
            >
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="orb-kanban-count">{tasks.filter((t) => t.status !== 'killed').length} active tasks</div>
      </div>

      <div className="orb-kanban-board">
        {columns.map((col) => (
          <div
            key={col.key}
            data-col-key={col.key}
            className={`orb-kanban-col${hoverKey === col.key ? ' drag-over' : ''}${col.muted ? ' muted' : ''}`}
          >
            <div className="orb-kanban-col-head" style={col.color ? { '--orb-chip-color': col.color } : undefined}>
              {col.color && <span className="orb-chip-dot" />}
              <span className="orb-kanban-col-title">{col.label}</span>
              <span className="orb-kanban-col-count">{grouped[col.key]?.length || 0}</span>
            </div>

            <div className="orb-kanban-col-body">
              {grouped[col.key]?.length === 0 && <div className="orb-kanban-empty">No tasks</div>}
              {grouped[col.key]?.map((task) => {
                const area = areaById(task.areaId);
                const dragging = dragId === task.id;
                return (
                  <div
                    key={task.id}
                    className={`orb-card orb-kanban-card${dragging ? ' dragging' : ''}${task.status === 'killed' ? ' killed' : ''}`}
                    style={dragging ? { transform: `translate(${dragDelta.dx}px, ${dragDelta.dy}px)` } : undefined}
                    onPointerDown={(e) => startDrag(e, task)}
                    onPointerMove={(e) => moveDrag(e, task)}
                    onPointerUp={(e) => endDrag(e, task)}
                    onPointerCancel={(e) => endDrag(e, task)}
                  >
                    <div className="orb-kanban-card-title">{task.title}</div>
                    <div className="orb-kanban-card-meta">
                      {area && (
                        <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
                          <span className="orb-chip-dot" />{area.name}
                        </span>
                      )}
                      {isOverdue(task) && <span className="orb-chip orb-flag-warn">Overdue</span>}
                      {task.status === 'killed' && <span className="orb-chip orb-kanban-killed-chip">Killed</span>}
                    </div>
                    <div className="orb-kanban-card-stats">
                      <span title="Importance">I<b>{task.importance}</b></span>
                      <span title="Urgency">U<b>{task.urgency}</b></span>
                      <span title="Effort">E<b>{task.effort}</b></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
