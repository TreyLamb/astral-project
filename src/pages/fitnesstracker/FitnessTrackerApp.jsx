import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FitnessContext, useFitnessState } from './fitnessContext';
import CalendarView from './CalendarView';
import EntryEditor from './EntryEditor';
import Settings from './Settings';
import RunTools from './RunTools';
import Dashboard from './Dashboard';
import ImportPage from './ImportPage';
import WorkoutDocsView from './WorkoutDocsView';
import QuickAddModal from './QuickAddModal';
import MealsView from './MealsView';
import MealEditor from './MealEditor';
import MealQuickAddModal from './MealQuickAddModal';
import WeighInModal from './WeighInModal';
import { todayISO } from './fitnessConfig';
import useKeyboardInset from '../../hooks/useKeyboardInset';
import './FitnessTracker.css';

// Installable-to-home-screen (PWA) is scoped to this sub-app: the manifest <link>
// is injected only while FitnessTracker is mounted and removed on unmount, so the
// rest of the site is never turned into a "FitnessTracker" app.
function useScopedManifest() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/fitness-tracker/manifest.webmanifest';
    document.head.appendChild(link);
    const theme = document.createElement('meta');
    theme.name = 'theme-color';
    theme.content = '#0a0e12';
    document.head.appendChild(theme);
    return () => { document.head.removeChild(link); document.head.removeChild(theme); };
  }, []);
}

export default function FitnessTrackerApp() {
  const fitness = useFitnessState();
  const [quickAdd, setQuickAdd] = useState(null); // { date } | null — shell owns it so it's openable from anywhere
  const [mealQuickAdd, setMealQuickAdd] = useState(null);
  const [weighIn, setWeighIn] = useState(null);
  useLocation(); // keeps NavLink active-state in sync across nested navigations
  useScopedManifest();
  useKeyboardInset();

  // No date passed = the topbar "+ Log" button = logging something already done
  // (defaults to completed). A date passed = a calendar-day click = scheduling a
  // future session (defaults to planned) — same modal, different intent/label.
  const value = {
    ...fitness,
    openQuickAdd: (date) => setQuickAdd({ date: date || todayISO(), mode: date ? 'schedule' : 'log' }),
    openMealQuickAdd: (date, mealType) => setMealQuickAdd({ date: date || todayISO(), mealType: mealType || null, mode: date ? 'schedule' : 'log' }),
    openWeighIn: (date) => setWeighIn({ date: date || todayISO() }),
  };

  const tab = ({ isActive }) => `ft-tab${isActive ? ' active' : ''}`;

  return (
    <FitnessContext.Provider value={value}>
      <div className="ft-app">
        <header className="ft-topbar">
          {/* The site nav is suppressed on this route (it has its own top bar
              already — see Navbar.jsx OWN_TOPBAR_ROUTES) so this is the only
              way back to the rest of the site from here. */}
          <Link to="/" className="ft-site-home" title="Back to Astral Project home">Astral Project</Link>
          <div className="ft-brand"><span className="ft-brand-icon">💪</span> MyFitnessTracker</div>
          <nav className="ft-topnav">
            <NavLink end to="/fitness-tracker" className={tab}>Calendar</NavLink>
            <NavLink to="/fitness-tracker/meals" className={tab}>Meals</NavLink>
            <NavLink to="/fitness-tracker/tools" className={tab}>Tools</NavLink>
            <NavLink to="/fitness-tracker/workouts" className={tab}>Workouts</NavLink>
            <NavLink to="/fitness-tracker/dashboard" className={tab}>Dashboard</NavLink>
            <NavLink to="/fitness-tracker/import" className={tab}>Import</NavLink>
            <NavLink to="/fitness-tracker/settings" className={tab}>Settings</NavLink>
          </nav>
          <div className="ft-topbar-right">
            <span className={`ft-sync ft-sync-${value.mode}`} title={value.mode === 'cloud' ? 'Syncing to your account' : 'Saved on this device'}>
              {value.mode === 'cloud' ? '☁ Synced' : '● Local'}
            </span>
            <button type="button" className="ft-btn-primary ft-log-btn" onClick={() => value.openQuickAdd()}>+ Log</button>
          </div>
        </header>

        <main className="ft-main">
          <Routes>
            <Route index element={<CalendarView />} />
            <Route path="entry/:id" element={<EntryEditor />} />
            <Route path="meals" element={<MealsView />} />
            <Route path="meal/:id" element={<MealEditor />} />
            <Route path="tools" element={<RunTools />} />
            <Route path="workouts" element={<WorkoutDocsView />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<CalendarView />} />
          </Routes>
        </main>

        {quickAdd && <QuickAddModal date={quickAdd.date} mode={quickAdd.mode} onClose={() => setQuickAdd(null)} />}
        {mealQuickAdd && <MealQuickAddModal date={mealQuickAdd.date} mealType={mealQuickAdd.mealType} mode={mealQuickAdd.mode} onClose={() => setMealQuickAdd(null)} />}
        {weighIn && <WeighInModal date={weighIn.date} onClose={() => setWeighIn(null)} />}
      </div>
    </FitnessContext.Provider>
  );
}
