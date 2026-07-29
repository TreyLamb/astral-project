import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { compareForToday } from '../calc/priority';
import { isReady } from '../calc/readiness';
import TaskRow from './TaskRow';
import './TodayView.css';

const isOpen = (t) => t.status === 'todo' || t.status === 'doing';
// Today's slate = open, unblocked, and (scheduled for today OR due today OR
// pinned) — spec §4.3. Done/killed never make the list regardless of dates.
const belongsToday = (t, today) => t.scheduledDate === today || t.dueDate === today || t.pinnedToday;

export default function TodayView() {
  const { tasks, inbox, tasksById, today, updateTask } = useOrbit();
  // Roving keyboard focus over `ranked` below — index, not task id, so
  // ArrowDown/ArrowUp stay simple positional moves.
  const [focusedIndex, setFocusedIndex] = useState(0);

  const dueTasks = tasks.filter((t) => isOpen(t) && belongsToday(t, today));
  const candidates = dueTasks.filter((t) => isReady(t, tasksById));
  const blocked = dueTasks.filter((t) => !isReady(t, tasksById));
  const ranked = [...candidates].sort((a, b) => compareForToday(a, b, today));

  const untriagedCount = inbox.filter((i) => !i.triaged).length;

  // Clamp focus whenever the ranked list's length changes (tasks completed/
  // pinned/added/filtered elsewhere) so a stale index never points past the
  // new end of the list. Compare-and-reset in render (same pattern as
  // OrbitApp.jsx's nav-drawer-close-on-navigate) rather than an effect, so a
  // length change doesn't cost an extra commit.
  const [rankedLenSeen, setRankedLenSeen] = useState(ranked.length);
  if (rankedLenSeen !== ranked.length) {
    setRankedLenSeen(ranked.length);
    setFocusedIndex((i) => Math.min(i, Math.max(ranked.length - 1, 0)));
  }

  // Roving-row keyboard nav: j/k or arrows move focus, x/Space toggles
  // done, . toggles pin — all against whichever row is currently focused.
  // Bails out of INPUT/TEXTAREA/contenteditable targets so this never fights
  // TaskRow's own inline title editor, and out of any modifier combo so
  // OrbitApp's Ctrl/Cmd+K capture and Ctrl/Cmd+/ search keep working.
  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (ranked.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, ranked.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'x' || e.key === ' ') {
        e.preventDefault();
        const t = ranked[focusedIndex];
        if (t) {
          const done = t.status === 'done';
          updateTask(t.id, { status: done ? 'todo' : 'done', completedAt: done ? null : Date.now() });
        }
      } else if (e.key === '.') {
        e.preventDefault();
        const t = ranked[focusedIndex];
        if (t) {
          updateTask(t.id, t.pinnedToday
            ? { pinnedToday: false, pinnedOn: null }
            : { pinnedToday: true, pinnedOn: today });
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ranked, focusedIndex, today, updateTask]);

  if (ranked.length === 0) {
    return (
      <div className="orb-today orb-today-empty">
        {untriagedCount > 0 && (
          <Link to="/orbit/triage" className="orb-today-empty-prompt">
            {untriagedCount} item{untriagedCount === 1 ? '' : 's'} to triage →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="orb-today">
      <div className="orb-today-list">
        {ranked.map((t, idx) => (
          <div key={t.id} className={idx === focusedIndex ? 'orb-today-row-focused' : undefined}>
            <TaskRow task={t} />
          </div>
        ))}
      </div>
      <div className="orb-today-hint">↑↓ move · x done · . pin</div>
      {blocked.length > 0 && (
        <div className="orb-today-blocked-note">
          {blocked.length} more blocked for today
        </div>
      )}
    </div>
  );
}
