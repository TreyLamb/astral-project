// Orbit dependency-graph logic — task.blockedBy is a list of task ids this
// task can't start until they're done/killed. tasksById is a Map<id, task>
// (repo convention, see DependencyTreeMock.jsx's readinessOf).

export function isReady(task, tasksById) {
  return (task.blockedBy || []).every((id) => {
    const blocker = tasksById.get(id);
    if (!blocker) return true; // dangling id — treated as satisfied, not a hard block
    return blocker.status === 'done' || blocker.status === 'killed';
  });
}

export function blockerTitles(task, tasksById) {
  return (task.blockedBy || [])
    .map((id) => tasksById.get(id))
    .filter((blocker) => blocker && blocker.status !== 'done' && blocker.status !== 'killed')
    .map((blocker) => blocker.title);
}

// Would adding newBlockerId to taskId's blockedBy create a cycle? Walks
// newBlockerId's own blockedBy chain looking for taskId — if found, taskId
// already (transitively) depends on newBlockerId, so the new edge would
// close a loop. `visited` guards against re-walking a shared ancestor twice.
export function wouldCreateCycle(taskId, newBlockerId, tasksById) {
  const visited = new Set();
  const stack = [newBlockerId];
  while (stack.length) {
    const cur = stack.pop();
    if (cur === taskId) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const t = tasksById.get(cur);
    if (!t) continue;
    for (const id of (t.blockedBy || [])) stack.push(id);
  }
  return false;
}
