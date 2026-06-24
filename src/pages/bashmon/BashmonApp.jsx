import { createContext, useContext, useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { loadSave, writeSave, DEFAULT_SAVE } from './bashmonStorage';
import BashmonHome from './BashmonHome';
import BashmonBattle from './BashmonBattle';
import BashmonOverworld from './BashmonOverworld';
import './BashmonApp.css';

const BashmonCtx = createContext(null);
export const useBashmon = () => useContext(BashmonCtx);

export default function BashmonApp() {
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
    <BashmonCtx.Provider value={{ save, updateSave, startNewGame }}>
      <div className="bm-root">
        <GameBoyShell>
          <Routes>
            <Route path="/"          element={<BashmonHome />} />
            <Route path="/overworld" element={<BashmonOverworld />} />
            <Route path="/battle"    element={<BashmonBattle />} />
          </Routes>
        </GameBoyShell>
      </div>
    </BashmonCtx.Provider>
  );
}

function GameBoyShell({ children }) {
  return (
    <div className="bm-shell">
      <div className="bm-brand">BASHMON RED · GAME BOY COLOR</div>
      <div className="bm-bezel">
        <div className="bm-screen">{children}</div>
      </div>
      <div className="bm-controls">
        <div className="bm-dpad">
          <div className="bm-dpad-h" />
          <div className="bm-dpad-v" />
          <div className="bm-dpad-center" />
        </div>
        <div className="bm-start-select">
          <button className="bm-btn-small">SELECT</button>
          <button className="bm-btn-small">START</button>
        </div>
        <div className="bm-ab-buttons">
          <button className="bm-btn bm-btn-b">B</button>
          <button className="bm-btn bm-btn-a">A</button>
        </div>
      </div>
    </div>
  );
}
