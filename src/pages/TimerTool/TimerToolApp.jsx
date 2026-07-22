import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { TimerToolContext, useTimerToolState } from './timerToolContext';
import Dashboard from './Dashboard';
import SettingsPresets from './SettingsPresets';
import AlarmToastLayer from './AlarmToastLayer';
import './TimerTool.css';

export default function TimerToolApp() {
  const state = useTimerToolState();
  const tab = ({ isActive }) => `tt-tab${isActive ? ' active' : ''}`;

  return (
    <TimerToolContext.Provider value={state}>
      <div className="tt-dashboard-container">
        <AlarmToastLayer />

        <header className="tt-header">
          <div className="tt-header-left">
            <h1>Multi-Timer Dashboard</h1>
            <p className="tt-subtitle">Whitelabeled multi-milestone running timer tracker.</p>
          </div>
          <nav className="tt-topnav">
            <NavLink end to="/timer-tool" className={tab}>Timers</NavLink>
            <NavLink to="/timer-tool/settings" className={tab}>Settings</NavLink>
          </nav>
        </header>

        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<SettingsPresets />} />
          <Route path="*" element={<Navigate to="/timer-tool" replace />} />
        </Routes>
      </div>
    </TimerToolContext.Provider>
  );
}
