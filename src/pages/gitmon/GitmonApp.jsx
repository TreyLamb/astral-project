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
        <Routes>
          <Route path="/"          element={<GitmonHome />} />
          <Route path="/overworld" element={<GitmonOverworld />} />
          <Route path="/battle"    element={<GitmonBattle />} />
        </Routes>
      </div>
    </GitmonCtx.Provider>
  );
}
