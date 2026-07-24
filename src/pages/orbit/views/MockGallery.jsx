import { useState } from 'react';
import { Link } from 'react-router-dom';
import PriorityListMock from '../mocks/PriorityListMock';
import KanbanMock from '../mocks/KanbanMock';
import ScheduleMock from '../mocks/ScheduleMock';
import DependencyTreeMock from '../mocks/DependencyTreeMock';
import MatrixMock from '../mocks/MatrixMock';

// Phase-0 exploration mocks, kept reachable at /orbit/mocks after the real
// app took over /orbit — same tab-switcher that used to live in OrbitApp.jsx.
const VIEWS = [
  { id: 'priority',       label: 'Priority List' },
  { id: 'kanban',         label: 'Kanban' },
  { id: 'schedule',       label: 'Schedule' },
  { id: 'dependency',     label: 'Dependency Tree' },
  { id: 'eisenhower',     label: 'Eisenhower Matrix' },
  { id: 'actionPriority', label: 'Action-Priority Matrix' },
];

export default function MockGallery() {
  const [view, setView] = useState('priority');

  return (
    <div className="orb-mocks">
      <div className="orb-mocks-head">
        <Link to="/orbit" className="orb-mocks-back">← back to Orbit</Link>
        <span className="orb-mock-tag">exploration mocks</span>
      </div>

      <nav className="orb-tabbar">
        {VIEWS.map(v => (
          <button
            key={v.id}
            type="button"
            className={`orb-tab${view === v.id ? ' active' : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <div className="orb-mocks-body">
        {view === 'priority' && <PriorityListMock />}
        {view === 'kanban' && <KanbanMock />}
        {view === 'schedule' && <ScheduleMock />}
        {view === 'dependency' && <DependencyTreeMock />}
        {view === 'eisenhower' && <MatrixMock variant="eisenhower" />}
        {view === 'actionPriority' && <MatrixMock variant="actionPriority" />}
      </div>
    </div>
  );
}
