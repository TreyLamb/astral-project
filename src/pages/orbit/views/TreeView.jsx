import { useMemo } from 'react';
import { useOrbit } from '../orbitContext';
import { isReady, blockerTitles } from '../calc/readiness';
import TaskRow from './TaskRow';
import './TreeView.css';

const isClosed = (t) => t.status === 'done' || t.status === 'killed';

// Lays a set of tasks into ordered columns by "unlock depth" among
// THEMSELVES — blockedBy edges pointing outside this set are ignored here
// (this only decides visual column order). isReady/blockerTitles below still
// read the full tasksById map, so a task's ready/blocked state is always
// correct even when its real blocker lives in a different section of the
// page than the one it's grouped under.
function columnsOf(group) {
  const ids = new Set(group.map((t) => t.id));
  const byId = new Map(group.map((t) => [t.id, t]));
  const depth = new Map();
  const depthOf = (t) => {
    if (depth.has(t.id)) return depth.get(t.id);
    depth.set(t.id, 0); // cycle guard — pathological data shouldn't hang the render
    const blockers = (t.blockedBy || []).filter((id) => ids.has(id) && id !== t.id);
    const d = blockers.length === 0 ? 0 : Math.max(...blockers.map((id) => depthOf(byId.get(id)))) + 1;
    depth.set(t.id, d);
    return d;
  };
  group.forEach(depthOf);
  const maxDepth = Math.max(0, ...group.map((t) => depth.get(t.id)));
  const cols = Array.from({ length: maxDepth + 1 }, () => []);
  group.forEach((t) => cols[depth.get(t.id)].push(t));
  return cols;
}

function nodeState(task, tasksById) {
  if (isClosed(task)) return task.status;
  return isReady(task, tasksById) ? 'ready' : 'blocked';
}

// Full TaskRow (checkbox/title-edit/pin/expand all work as everywhere else)
// wrapped with a ready/blocked/killed banner — checking the box calls
// TaskRow's own updateTask, which live-unlocks anything blocked on it since
// isReady is recomputed from the same tasksById on every render.
function TreeNode({ task, tasksById, depth }) {
  const state = nodeState(task, tasksById);
  const blockers = state === 'blocked' ? blockerTitles(task, tasksById) : [];
  return (
    <div className={`orb-tree-node orb-tree-node-${state}`}>
      {state === 'ready' && <span className="orb-tree-tag orb-tree-tag-ready">ready</span>}
      {state === 'blocked' && (
        <span className="orb-tree-tag orb-tree-tag-blocked">🔒 waiting on {blockers.join(', ') || '…'}</span>
      )}
      {state === 'killed' && <span className="orb-tree-tag orb-tree-tag-killed">✕ killed</span>}
      <TaskRow task={task} showProject={false} depth={depth} />
    </div>
  );
}

function DependencyChain({ tasks: chainTasks, tasksById, depth }) {
  const cols = useMemo(() => columnsOf(chainTasks), [chainTasks]);
  return (
    <div className="orb-tree-chain">
      {cols.map((col, i) => (
        <div className="orb-tree-chain-stage" key={i}>
          <div className="orb-tree-chain-col">
            {col.map((t) => <TreeNode key={t.id} task={t} tasksById={tasksById} depth={depth} />)}
          </div>
          {i < cols.length - 1 && <div className="orb-tree-chain-arrow" aria-hidden="true">↓ unlocks</div>}
        </div>
      ))}
    </div>
  );
}

function ParentGroup({ parent, childTasks, tasksById }) {
  const doneCount = childTasks.filter(isClosed).length;
  return (
    <section className="orb-tree-group">
      <TreeNode task={parent} tasksById={tasksById} depth={0} />
      <div className="orb-tree-group-summary">
        {doneCount}/{childTasks.length} subtask{childTasks.length === 1 ? '' : 's'} done
      </div>
      <div className="orb-tree-group-children">
        <DependencyChain tasks={childTasks} tasksById={tasksById} depth={1} />
      </div>
    </section>
  );
}

// Splits tasks into: parent+subtask clusters (parentTaskId nesting),
// blockedBy chains among the remaining root tasks (connected components of
// the blockedBy graph, root-level only), and whatever's left as standalone.
// Purely a presentation grouping — see columnsOf's comment on why readiness
// itself stays correct regardless of which bucket a task visually lands in.
function buildTree(tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const childrenByParent = new Map();
  tasks.forEach((t) => {
    if (t.parentTaskId) {
      if (!childrenByParent.has(t.parentTaskId)) childrenByParent.set(t.parentTaskId, []);
      childrenByParent.get(t.parentTaskId).push(t);
    }
  });

  const rootTasks = tasks.filter((t) => !t.parentTaskId);
  const parentIds = new Set(childrenByParent.keys());
  const groups = rootTasks
    .filter((t) => parentIds.has(t.id))
    .map((t) => ({ parent: t, childTasks: childrenByParent.get(t.id) }));

  const leafRoots = rootTasks.filter((t) => !parentIds.has(t.id));
  const leafIds = new Set(leafRoots.map((t) => t.id));
  const adjacency = new Map(leafRoots.map((t) => [t.id, new Set()]));
  leafRoots.forEach((t) => {
    (t.blockedBy || []).forEach((bid) => {
      if (leafIds.has(bid) && bid !== t.id) {
        adjacency.get(t.id).add(bid);
        adjacency.get(bid).add(t.id);
      }
    });
  });

  const visited = new Set();
  const chains = [];
  leafRoots.forEach((t) => {
    if (visited.has(t.id)) return;
    const stack = [t.id];
    const component = [];
    visited.add(t.id);
    while (stack.length) {
      const cur = stack.pop();
      component.push(byId.get(cur));
      adjacency.get(cur).forEach((n) => { if (!visited.has(n)) { visited.add(n); stack.push(n); } });
    }
    if (component.length > 1) chains.push(component);
  });

  const chainedIds = new Set(chains.flat().map((t) => t.id));
  const standalone = leafRoots.filter((t) => !chainedIds.has(t.id));

  return { groups, chains, standalone };
}

// Dependency + subtask tree on real tasks: blockedBy chains and
// parentTaskId nesting both render here, ready/blocked/done are visually
// distinct, and completing a node (TaskRow's own checkbox -> updateTask)
// live-unlocks whatever it was blocking on the very next render.
export default function TreeView() {
  const { tasks, tasksById } = useOrbit();
  const { groups, chains, standalone } = useMemo(() => buildTree(tasks), [tasks]);

  if (tasks.length === 0) {
    return <div className="orb-stub">No tasks yet — capture something to see it here.</div>;
  }

  return (
    <div className="orb-tree">
      <p className="orb-tree-legend">
        <span className="orb-tree-tag orb-tree-tag-ready">ready</span> tasks can start now,
        <span className="orb-tree-tag orb-tree-tag-blocked">🔒 blocked</span> tasks are waiting on something else,
        and checking a task off live-unlocks whatever it was blocking.
      </p>

      {groups.map((g) => (
        <ParentGroup key={g.parent.id} parent={g.parent} childTasks={g.childTasks} tasksById={tasksById} />
      ))}

      {chains.map((chain, i) => (
        <section key={`chain-${chain[0]?.id ?? i}`} className="orb-tree-group">
          <h3 className="orb-tree-group-title">Dependency chain</h3>
          <DependencyChain tasks={chain} tasksById={tasksById} depth={0} />
        </section>
      ))}

      {standalone.length > 0 && (
        <section className="orb-tree-group">
          <h3 className="orb-tree-group-title">No dependencies</h3>
          <div className="orb-tree-standalone-list">
            {standalone.map((t) => <TreeNode key={t.id} task={t} tasksById={tasksById} depth={0} />)}
          </div>
        </section>
      )}
    </div>
  );
}
