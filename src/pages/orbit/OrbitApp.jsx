import { useState } from 'react';
import { Link } from 'react-router-dom';
import PriorityListMock from './mocks/PriorityListMock';
import KanbanMock from './mocks/KanbanMock';
import ScheduleMock from './mocks/ScheduleMock';
import DependencyTreeMock from './mocks/DependencyTreeMock';
import MatrixMock from './mocks/MatrixMock';
import './Orbit.css';

const VIEWS = [
  { id: 'priority',       label: 'Priority List' },
  { id: 'kanban',         label: 'Kanban' },
  { id: 'schedule',       label: 'Schedule' },
  { id: 'dependency',     label: 'Dependency Tree' },
  { id: 'eisenhower',     label: 'Eisenhower Matrix' },
  { id: 'actionPriority', label: 'Action-Priority Matrix' },
];

export default function OrbitApp() {
  const [view, setView] = useState('priority');

  return (
    <div className="orb-app">
      <header className="orb-topbar">
        {/* The site nav is suppressed on this route (own topbar — see
            Navbar.jsx OWN_TOPBAR_ROUTES), so this is the only way back. */}
        <Link to="/" className="orb-site-home" title="Back to Astral Project home">Astral Project</Link>
        <div className="orb-brand"><span className="orb-brand-icon">🪐</span> Orbit</div>
        <span className="orb-mock-tag">exploration mocks</span>
      </header>

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

      <main className="orb-main">
        {view === 'priority' && <PriorityListMock />}
        {view === 'kanban' && <KanbanMock />}
        {view === 'schedule' && <ScheduleMock />}
        {view === 'dependency' && <DependencyTreeMock />}
        {view === 'eisenhower' && <MatrixMock variant="eisenhower" />}
        {view === 'actionPriority' && <MatrixMock variant="actionPriority" />}
      </main>
    </div>
  );
}
