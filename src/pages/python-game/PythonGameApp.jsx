import { createContext, useContext, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { loadPlayer, savePlayer, xpPercent, xpForNextLevel } from './progressionEngine';
import tiersData from './content/tiers.json';
import PythonGameHome from './PythonGameHome';
import PythonGameTutorial from './PythonGameTutorial';
import './PythonGame.css';

const PythonGameContext = createContext(null);

export function usePythonGame() {
  return useContext(PythonGameContext);
}

function TopBar({ player }) {
  const next = xpForNextLevel(player.xp, tiersData);
  const pct  = xpPercent(player.xp, tiersData);
  const xpLabel = next
    ? `${player.xp} / ${next.required} XP`
    : `${player.xp} XP (max)`;

  return (
    <div className="pg-topbar">
      <span className="pg-breadcrumb">Code Trials</span>
      <span className="pg-level-badge">Level {player.level}</span>
      <div className="pg-xp-wrap">
        <div className="pg-xp-bar">
          <div className="pg-xp-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="pg-xp-label">{xpLabel}</span>
      </div>
    </div>
  );
}

function CampaignStub() {
  const navigate = useNavigate();
  return (
    <div className="pg-stub">
      <div className="pg-stub-icon">🗺️</div>
      <div className="pg-stub-title">Campaign Mode</div>
      <div className="pg-stub-desc">
        Story-driven chapters are coming soon. Complete the Tutorial to prepare.
      </div>
      <button className="pg-btn" onClick={() => navigate('/python-game')}>← Back</button>
    </div>
  );
}

function TrialsStub() {
  const navigate = useNavigate();
  return (
    <div className="pg-stub">
      <div className="pg-stub-icon">⚡</div>
      <div className="pg-stub-title">Trials Mode</div>
      <div className="pg-stub-desc">
        Arcade challenges are coming soon. Reach Level 6 to unlock.
      </div>
      <button className="pg-btn" onClick={() => navigate('/python-game')}>← Back</button>
    </div>
  );
}

export default function PythonGameApp() {
  const [player, setPlayer] = useState(() => loadPlayer());

  function updatePlayer(newState) {
    setPlayer(newState);
    savePlayer(newState);
  }

  return (
    <PythonGameContext.Provider value={{ player, updatePlayer }}>
      <div className="pg-app">
        <TopBar player={player} />
        <Routes>
          <Route path="/"         element={<PythonGameHome />} />
          <Route path="/tutorial" element={<PythonGameTutorial />} />
          <Route path="/campaign" element={<CampaignStub />} />
          <Route path="/trials"   element={<TrialsStub />} />
        </Routes>
      </div>
    </PythonGameContext.Provider>
  );
}
