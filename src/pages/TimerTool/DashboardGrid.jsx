import { useTimerTool } from './timerToolContext';
import TimerCard from './TimerCard';

// Pure card grid, split out from Dashboard.jsx so it can be mounted either
// inline or through a createPortal into the Document PiP window — it reads
// live state via useTimerTool() itself, so it behaves identically either way
// (React context follows the component tree, not the DOM tree the portal moves).
export default function DashboardGrid({ onEdit }) {
  const { timers } = useTimerTool();

  return (
    <main className="tt-grid-layout">
      {timers.map((timer) => (
        <TimerCard key={timer.id} timer={timer} onEdit={onEdit} />
      ))}
    </main>
  );
}
