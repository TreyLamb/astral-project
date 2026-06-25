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
        <Routes>
          <Route path="/"          element={<BashmonHome />} />
          <Route path="/overworld" element={<BashmonOverworld />} />
          <Route path="/battle"    element={<BashmonBattle />} />
        </Routes>
      </div>
    </BashmonCtx.Provider>
  );
}
