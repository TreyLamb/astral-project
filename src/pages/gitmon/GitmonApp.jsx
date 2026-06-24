import { createContext, useContext, useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { loadSave, writeSave, hasSave, DEFAULT_SAVE } from './gitmonStorage';
import GitmonHome from './GitmonHome';
import GitmonBattle from './GitmonBattle';
import GitmonOverworld from './GitmonOverworld';
import './GitmonApp.css';

const GitmonCtx = createContext(null);
export const useGitmon = () => useContext(GitmonCtx);

export default function GitmonApp() {
  const [save, setSave] = useState(() => loadSave() || null);

  const updateSave = useCallback((updater) => {
    setSave(prev => {
      const next = typeof updater === 'function' ? updater({ ...prev }) : { ...prev, ...updater };
      writeSave(next);
      return next;
    });
  }, []);

  const startNewGame = useCallback((name, starterId, starterMon) => {
    const fresh = {
      ...DEFAULT_SAVE,
      playerName: name,
      starterId,
      startedAt: Date.now(),
      party: [starterMon],
    };
    writeSave(fresh);
    setSave(fresh);
  }, []);

  return (
    <GitmonCtx.Provider value={{ save, updateSave, startNewGame }}>
      <div className="gm-root">
        <GameBoyShell>
          <Routes>
            <Route path="/"          element={<GitmonHome />} />
            <Route path="/overworld" element={<GitmonOverworld />} />
            <Route path="/battle"    element={<GitmonBattle />} />
          </Routes>
        </GameBoyShell>
      </div>
    </GitmonCtx.Provider>
  );
}

function GameBoyShell({ children }) {
  return (
    <div className="gm-shell">
      <div className="gm-brand">GITMON BLUE · GAME BOY COLOR</div>

      <div className="gm-bezel">
        <div className="gm-screen">
          {children}
        </div>
      </div>

      <div className="gm-controls">
        <div className="gm-dpad">
          <div className="gm-dpad-h" />
          <div className="gm-dpad-v" />
          <div className="gm-dpad-center" />
        </div>

        <div className="gm-start-select">
          <button className="gm-btn-small">SELECT</button>
          <button className="gm-btn-small">START</button>
        </div>

        <div className="gm-ab-buttons">
          <button className="gm-btn gm-btn-b">B</button>
          <button className="gm-btn gm-btn-a">A</button>
        </div>
      </div>
    </div>
  );
}
