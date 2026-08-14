import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { PogoFiltersContext, usePogoFiltersState } from './pogofiltersContext';
import FiltersView from './views/FiltersView';
import MatrixView from './views/MatrixView';
import QueueView from './views/QueueView';
import LabelsView from './views/LabelsView';
import LabelMatrixView from './views/LabelMatrixView';
import FindView from './views/FindView';
import CompareView from './views/CompareView';
import SettingsView from './views/SettingsView';
import SortLogView from './views/SortLogView';
import './PogoFilters.css';
import HubLink from '../../components/HubLink';

const TABS = [
  { to: '/pogo-filters', end: true, label: 'Filters' },
  { to: '/pogo-filters/matrix', label: 'Species matrix' },
  // One-time tool: get every species assigned once, then stop using it.
  { to: '/pogo-filters/queue', label: 'Assign ⚡' },
  { to: '/pogo-filters/labels', label: 'Labels' },
  { to: '/pogo-filters/label-matrix', label: 'Label grid' },
  { to: '/pogo-filters/find', label: 'Find' },
  { to: '/pogo-filters/compare', label: 'Compare' },
  { to: '/pogo-filters/log', label: 'Sort log' },
  { to: '/pogo-filters/settings', label: 'Settings' },
];

export default function PogoFiltersApp() {
  const state = usePogoFiltersState();
  useLocation(); // keeps NavLink active state in sync across nested navigations

  return (
    <PogoFiltersContext.Provider value={state}>
      <div className="pgf-app">
        {/* div, not nav — Navbar.css styles the bare nav element globally */}
        <div className="pgf-topbar">
          <HubLink className="pgf-site-home" />
          <span className="pgf-brand">
            <span className="pgf-brand-mark" aria-hidden="true">⌗</span>
            PogoFilters
          </span>

          <div className="pgf-tabs">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) => `pgf-tab${isActive ? ' active' : ''}`}
              >
                {t.label}
              </NavLink>
            ))}
          </div>

          <span
            className={`pgf-sync pgf-sync-${state.mode}`}
            title={state.mode === 'cloud' ? 'Syncing to your account' : 'Saved on this device only — sign in to sync'}
          >
            {state.mode === 'cloud' ? '☁ Synced' : '● Local'}
          </span>
        </div>

        {state.loading ? (
          <div className="pgf-loading">Loading filters…</div>
        ) : (
          <Routes>
            <Route index element={<FiltersView />} />
            <Route path="matrix" element={<MatrixView />} />
            <Route path="queue" element={<QueueView />} />
            <Route path="labels" element={<LabelsView />} />
            <Route path="label-matrix" element={<LabelMatrixView />} />
            <Route path="find" element={<FindView />} />
            <Route path="compare" element={<CompareView />} />
            <Route path="log" element={<SortLogView />} />
            <Route path="settings" element={<SettingsView />} />
          </Routes>
        )}

        {state.toast && (
          <div className={`pgf-toast ${state.toast.type === 'error' ? 'pgf-toast-error' : ''}`}>
            {state.toast.message}
          </div>
        )}
      </div>
    </PogoFiltersContext.Provider>
  );
}
