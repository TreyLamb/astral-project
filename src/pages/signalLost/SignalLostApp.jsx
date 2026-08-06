import { createContext, useContext, useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { loadSave, writeSave, DEFAULT_SAVE } from './signalLostStorage';
import SignalLostHome from './SignalLostHome';
import SignalLostGame from './SignalLostGame';
import './SignalLostApp.css';

const SlCtx = createContext(null);
export const useSL = () => useContext(SlCtx);

export default function SignalLostApp() {
  const [save, setSaveState] = useState(() => loadSave() ?? null);

  const setSave = useCallback((updater) => {
    setSaveState(prev => {
      const next = typeof updater === 'function' ? updater(prev ?? { ...DEFAULT_SAVE }) : { ...prev, ...updater };
      writeSave(next);
      return next;
    });
  }, []);

  return (
    <SlCtx.Provider value={{ save, setSave }}>
      <div className="sl-root">
        <Routes>
          <Route index       element={<SignalLostHome />} />
          <Route path="play" element={<SignalLostGame />} />
        </Routes>
      </div>
    </SlCtx.Provider>
  );
}
