import { useMemo, useState } from 'react';
import { MOCK_AREAS, MOCK_TASKS } from '../mockData';
import './DependencyTreeMock.css';

const isClosed = t => t.status === 'done' || t.status === 'killed';

// readiness: every blocker must resolve to a done/killed task.
function readinessOf(tasks) {
  const byId = new Map(tasks.map(t => [t.id, t]));
  const ready = new Map();
  tasks.forEach(t => {
    ready.set(t.id, t.blockedBy.every(id => byId.get(id) && isClosed(byId.get(id))));
  });
  return ready;
}

// group's blockedBy edges (restricted to members of the group) laid out into
// ordered columns — one per "unlock depth" — so a straight chain like
// t1 -> t2 -> t3 -> t4 renders as 4 columns of 1, and any future branching
// dataset still lays out sanely (siblings at the same depth share a column).
function columnsOf(group) {
  const ids = new Set(group.map(t => t.id));
  const depth = new Map();
  const depthOf = t => {
    if (depth.has(t.id)) return depth.get(t.id);
    const blockers = t.blockedBy.filter(id => ids.has(id));
    const d = blockers.length === 0 ? 0 : Math.max(...blockers.map(id => depthOf(group.find(g => g.id === id)))) + 1;
    depth.set(t.id, d);
    return d;
  };
  group.forEach(depthOf);
  const maxDepth = Math.max(0, ...group.map(t => depth.get(t.id)));
  const cols = Array.from({ length: maxDepth + 1 }, () => []);
  group.forEach(t => cols[depth.get(t.id)].push(t));
  return cols;
}

export default function DependencyTreeMock() {
  const [tasks, setTasks] = useState(() => MOCK_TASKS.map(t => ({ ...t })));

  const areaById = useMemo(() => new Map(MOCK_AREAS.map(a => [a.id, a])), []);
  const byId = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const ready = useMemo(() => readinessOf(tasks), [tasks]);

  const complete = id => setTasks(ts => ts.map(t => (t.id === id ? { ...t, status: 'done' } : t)));

  const { groups, standalone } = useMemo(() => {
    const parentIds = new Set(tasks.filter(t => t.parentTaskId).map(t => t.parentTaskId));
    const childrenByParent = new Map();
    tasks.forEach(t => {
      if (t.parentTaskId) {
        if (!childrenByParent.has(t.parentTaskId)) childrenByParent.set(t.parentTaskId, []);
        childrenByParent.get(t.parentTaskId).push(t);
      }
    });
    const groups = [...parentIds]
      .map(pid => ({ parent: byId.get(pid), children: childrenByParent.get(pid) || [] }))
      .filter(g => g.parent);
    const standalone = tasks.filter(t => !t.parentTaskId && !parentIds.has(t.id));
    return { groups, standalone };
  }, [tasks, byId]);

  return (
    <div className="orb-dt">
      <div className="orb-dt-head">
        <h2 className="orb-dt-h2">Dependency Tree</h2>
        <p className="orb-dt-sub">
          Arrows show what unlocks what. <span className="orb-dt-legend-ready">Ready</span> tasks can start now,
          <span className="orb-dt-legend-blocked"> blocked 🔒</span> tasks are waiting, and checking a task off
          live-unlocks whatever it was blocking.
        </p>
      </div>

      {groups.map(g => (
        <ChainGroup key={g.parent.id} parent={g.parent} childTasks={g.children} ready={ready} areaById={areaById} onComplete={complete} />
      ))}

      {standalone.length > 0 && (
        <section className="orb-dt-group">
          <h3 className="orb-dt-group-title">No dependencies</h3>
          <div className="orb-dt-standalone-grid">
            {standalone.map(t => (
              <DtNode key={t.id} task={t} ready={ready.get(t.id)} area={areaById.get(t.areaId)} onComplete={() => complete(t.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ChainGroup({ parent, childTasks, ready, areaById, onComplete }) {
  const cols = useMemo(() => columnsOf(childTasks), [childTasks]);
  const doneCount = childTasks.filter(isClosed).length;
  const allDone = childTasks.length > 0 && doneCount === childTasks.length;

  return (
    <section className="orb-dt-group">
      <div className={`orb-dt-parent${allDone ? ' orb-dt-parent-done' : ''}`}>
        <span className="orb-dt-parent-icon">{allDone ? '✓' : '◎'}</span>
        <span className="orb-dt-parent-title">{parent.title}</span>
        <span className="orb-dt-parent-count">
          {doneCount}/{childTasks.length} done
        </span>
      </div>

      <div className="orb-dt-chain">
        {cols.map((col, i) => (
          <div className="orb-dt-chain-step" key={i}>
            <div className="orb-dt-chain-col">
              {col.map(t => (
                <DtNode key={t.id} task={t} ready={ready.get(t.id)} area={areaById.get(t.areaId)} onComplete={() => onComplete(t.id)} />
              ))}
            </div>
            {i < cols.length - 1 && (
              <span className="orb-dt-arrow" aria-hidden="true">
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function DtNode({ task, ready, area, onComplete }) {
  const closed = isClosed(task);
  const state = closed ? task.status : ready ? 'ready' : 'blocked';

  return (
    <div className={`orb-dt-node orb-dt-node-${state}`}>
      <button
        type="button"
        className="orb-dt-check"
        onClick={onComplete}
        disabled={closed}
        aria-label={closed ? `"${task.title}" is ${task.status}` : `Mark "${task.title}" complete`}
      >
        {state === 'done' && '✓'}
        {state === 'killed' && '✕'}
        {state === 'blocked' && '🔒'}
      </button>
      <div className="orb-dt-node-body">
        <span className="orb-dt-node-title">{task.title}</span>
        <div className="orb-dt-node-meta">
          {area && (
            <span className="orb-chip" style={{ '--orb-chip-color': area.color }}>
              <span className="orb-chip-dot" />
              {area.name}
            </span>
          )}
          {state === 'blocked' && <span className="orb-dt-state-label orb-flag-warn">blocked</span>}
          {state === 'ready' && <span className="orb-dt-state-label orb-dt-state-ready">ready</span>}
          {state === 'killed' && <span className="orb-dt-state-label">killed</span>}
        </div>
      </div>
    </div>
  );
}
