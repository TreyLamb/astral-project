import { Link } from 'react-router-dom';
import { useOrbit } from '../orbitContext';
import { compareForToday } from '../calc/priority';
import { isReady } from '../calc/readiness';
import TaskRow from './TaskRow';

const isOpen = (t) => t.status === 'todo' || t.status === 'doing';
// Today's slate = open, unblocked, and (scheduled for today OR due today OR
// pinned) — spec §4.3. Done/killed never make the list regardless of dates.
const belongsToday = (t, today) => t.scheduledDate === today || t.dueDate === today || t.pinnedToday;

export default function TodayView() {
  const { tasks, inbox, tasksById, today } = useOrbit();

  const dueTasks = tasks.filter((t) => isOpen(t) && belongsToday(t, today));
  const candidates = dueTasks.filter((t) => isReady(t, tasksById));
  const blocked = dueTasks.filter((t) => !isReady(t, tasksById));
  const ranked = [...candidates].sort((a, b) => compareForToday(a, b, today));

  const untriagedCount = inbox.filter((i) => !i.triaged).length;

  if (ranked.length === 0) {
    return (
      <div className="orb-today orb-today-empty">
        {untriagedCount > 0 && (
          <Link to="/orbit/inbox" className="orb-today-empty-prompt">
            {untriagedCount} item{untriagedCount === 1 ? '' : 's'} to triage →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="orb-today">
      <div className="orb-today-list">
        {ranked.map((t) => <TaskRow key={t.id} task={t} />)}
      </div>
      {blocked.length > 0 && (
        <div className="orb-today-blocked-note">
          {blocked.length} more blocked for today
        </div>
      )}
    </div>
  );
}
