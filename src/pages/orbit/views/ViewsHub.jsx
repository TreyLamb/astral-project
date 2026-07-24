import { useState } from 'react';
import BoardView from './BoardView';
import ScheduleView from './ScheduleView';
import TreeView from './TreeView';
import MatrixView from './MatrixView';
import './ViewsHub.css';

// Real-data paradigm switcher — the production counterpart to /orbit/mocks.
// Same tab-bar pattern as MockGallery, but every child here reads/writes
// live tasks through useOrbit() instead of local fake state.
const TABS = [
  { id: 'board', label: 'Board' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'tree', label: 'Tree' },
  { id: 'matrix', label: 'Matrix' },
];

export default function ViewsHub() {
  const [view, setView] = useState('board');

  return (
    <div className="orb-views">
      <nav className="orb-tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`orb-tab${view === t.id ? ' active' : ''}`}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="orb-views-body">
        {view === 'board' && <BoardView />}
        {view === 'schedule' && <ScheduleView />}
        {view === 'tree' && <TreeView />}
        {view === 'matrix' && <MatrixView />}
      </div>
    </div>
  );
}
