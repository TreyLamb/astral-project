import { useMemo, useState } from 'react';
import { useOrbit } from '../orbitContext';
import { compareForToday, isOverdue } from '../calc/priority';
import './BoardView.css';

const LANE_COLS = [
  { key: 'unsorted', label: 'Unsorted' },
  { key: 'now', label: 'Now' },
  { key: 'next', label: 'Next' },
  { key: 'later', label: 'Later' },
];
const STATUS_COLS = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'Doing' },
  { key: 'done', label: 'Done', muted: true },
  { key: 'killed', label: 'Killed', muted: true },
];
const GROUP_LABEL = { lane: 'By Lane', status: 'By Status', area: 'By Area' };

// Maps a task to the column key it currently sits in for the active
// grouping, and the reverse (a dropped-on key -> the field value updateTask
// should write) — 'unsorted'/'none' are UI-only stand-ins for a null lane/area.
function keyForTask(task, grouping) {
  if (grouping === 'status') return task.status;
  if (grouping === 'area') return task.areaId || 'none';
  return task.lane || 'unsorted';
}
function valueForKey(grouping, key) {
  if (grouping === 'status') return key;
  if (grouping === 'area') return key === 'none' ? null : key;
  return key === 'unsorted' ? null : key;
}
function fieldForGrouping(grouping) {
  return grouping === 'status' ? 'status' : grouping === 'area' ? 'areaId' : 'lane';
}

// Kanban on real tasks: pointer-events drag (mouse+touch, same mechanism as
// KanbanMock) between columns, but every drop calls updateTask so it sticks.
export default function BoardView() {
  const { tasks, areas, updateTask, today } = useOrbit();
  const [grouping, setGrouping] = useState('lane');
  const [dragId, setDragId] = useState(null);
  const [dragDelta, setDragDelta] = useState({ dx: 0, dy: 0 });
  const [hoverKey, setHoverKey] = useState(null);

  const columns = useMemo(() => {
    if (grouping === 'status') return STATUS_COLS;
    if (grouping === 'area') {
      return [
        ...areas.filter((a) => !a.archived).map((a) => ({ key: a.id, label: a.name, color: a.color })),
        { key: 'none', label: 'No area' },
      ];
    }
    return LANE_COLS;
  }, [grouping, areas]);

  // Done/killed are dead weight on a Lane/Area board built for steering open
  // work — only the Status board (where they're a real destination column)
  // keeps them, muted.
  const boardTasks = useMemo(
    () => (grouping === 'status' ? tasks : tasks.filter((t) => t.status !== 'done' && t.status !== 'killed')),
    [tasks, grouping],
  );
  const activeCount = boardTasks.filter((t) => t.status !== 'done' && t.status !== 'killed').length;

  const grouped = useMemo(() => {
    const map = {};
    columns.forEach((c) => { map[c.key] = []; });
    boardTasks.forEach((t) => {
      const k = keyForTask(t, grouping);
      if (map[k]) map[k].push(t);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => compareForToday(a, b, today)));
    return map;
  }, [boardTasks, columns, grouping, today]);

  const areaById = (id) => areas.find((a) => a.id === id);

  const startDrag = (e, task) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(task.id);
    setDragDelta({ dx: 0, dy: 0, startX: e.clientX, startY: e.clientY });
  };
  const moveDrag = (e, task) => {
    if (dragId !== task.id) return;
    setDragDelta((d) => ({ ...d, dx: e.clientX - d.startX, dy: e.clientY - d.startY }));
    // dragged card gets pointer-events:none in CSS so this hit-test lands on
    // the column underneath it instead of the card itself.
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
      if (keyForTask(task, grouping) !== key) {
        updateTask(task.id, { [fieldForGrouping(grouping)]: valueForKey(grouping, key) });
      }
    }
    setDragId(null);
    setHoverKey(null);
  };

  return (
    <div className="orb-board">
      <div className="orb-board-toolbar">
        <div className="orb-board-group-toggle">
          {Object.keys(GROUP_LABEL).map((g) => (
            <button
              key={g}
              type="button"
              className={`orb-btn orb-board-group-btn${grouping === g ? ' active' : ''}`}
              onClick={() => setGrouping(g)}
            >
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="orb-board-count">{activeCount} active task{activeCount === 1 ? '' : 's'}</div>
      </div>

      <div className="orb-board-cols">
        {columns.map((col) => (
          <div
            key={col.key}
            data-col-key={col.key}
            className={`orb-board-col${hoverKey === col.key ? ' drag-over' : ''}${col.muted ? ' muted' : ''}`}
          >
            <div className="orb-board-col-head" style={col.color ? { '--orb-chip-color': col.color } : undefined}>
              {col.color && <span className="orb-chip-dot" />}
              <span className="orb-board-col-title">{col.label}</span>
              <span className="orb-board-col-count">{grouped[col.key]?.length || 0}</span>
            </div>

            <div className="orb-board-col-body">
              {grouped[col.key]?.length === 0 && <div className="orb-board-empty">No tasks</div>}
              {grouped[col.key]?.map((task) => {
                const area = areaById(task.areaId);
                const dragging = dragId === task.id;
                const overdue = isOverdue(task, today);
                return (
                  <div
                    key={task.id}
                    className={[
                      'orb-card', 'orb-board-card',
                      dragging && 'dragging',
                      task.status === 'killed' && 'killed',
                      task.status === 'done' && 'done',
                    ].filter(Boolean).join(' ')}
                    style={dragging ? { transform: `translate(${dragDelta.dx}px, ${dragDelta.dy}px)` } : undefined}
                    onPointerDown={(e) => startDrag(e, task)}
                    onPointerMove={(e) => moveDrag(e, task)}
                    onPointerUp={(e) => endDrag(e, task)}
                    onPointerCancel={(e) => endDrag(e, task)}
                  >
                    <div className="orb-board-card-title">{task.title || <em>untitled</em>}</div>
                    <div className="orb-board-card-meta">
                      {area && (
                        <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
                          <span className="orb-chip-dot" />{area.name}
                        </span>
                      )}
                      {overdue && <span className="orb-chip orb-flag-warn">Overdue</span>}
                    </div>
                    <div className="orb-board-card-stats">
                      <span title="Importance">I<b>{task.importance}</b></span>
                      <span title="Urgency">U<b>{task.urgency}</b></span>
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
