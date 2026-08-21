import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import HubLink from '../../components/HubLink';
import { DlabContext, useDlabState } from './dlabContext';
import SetupView from './views/SetupView';
import BriefView from './views/BriefView';
import TestView from './views/TestView';
import ResultsView from './views/ResultsView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';
import './Dlab.css';

export default function DlabApp() {
  const state = useDlabState();
  const { test, toast, mode } = state;

  return (
    <DlabContext.Provider value={state}>
      <div className="dlab-app">
        <header className="dlab-topbar">
          <HubLink className="dlab-site-home" />
          <span className="dlab-brand">
            DLAB<span className="dlab-brand-sub">language aptitude trainer</span>
          </span>

          <nav className="dlab-nav">
            {/* `end` on the setup tab only — without it the root path matches
                every nested route and two tabs light up at once. */}
            <NavLink to="/DLAB" end className={({ isActive }) => (isActive ? 'is-on' : '')}>Practice</NavLink>
            {test && (
              <>
                <NavLink to="/DLAB/brief" className={({ isActive }) => (isActive ? 'is-on' : '')}>Rules</NavLink>
                <NavLink to="/DLAB/test" className={({ isActive }) => (isActive ? 'is-on' : '')}>Questions</NavLink>
              </>
            )}
            <NavLink to="/DLAB/history" className={({ isActive }) => (isActive ? 'is-on' : '')}>History</NavLink>
            <NavLink to="/DLAB/settings" className={({ isActive }) => (isActive ? 'is-on' : '')}>Settings</NavLink>
          </nav>

          <span className={`dlab-mode dlab-mode-${mode}`} title={mode === 'cloud' ? 'Synced to your account' : 'Saved on this device'}>
            {mode === 'cloud' ? '☁ synced' : '▤ local'}
          </span>
        </header>

        <main className="dlab-main">
          <Routes>
            <Route index element={<SetupView />} />
            <Route path="brief" element={<BriefView />} />
            <Route path="test" element={<TestView />} />
            <Route path="results" element={<ResultsView />} />
            <Route path="results/:id" element={<ResultsView />} />
            <Route path="history" element={<HistoryView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/DLAB" replace />} />
          </Routes>
        </main>

        {toast && <div className={`dlab-toast dlab-toast-${toast.type}`}>{toast.message}</div>}
      </div>
    </DlabContext.Provider>
  );
}
