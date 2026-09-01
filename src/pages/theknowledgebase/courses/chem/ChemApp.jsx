import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { useAuth } from '../../../../AuthContext';
import { ChemLocal, ChemCloud, defaultChemProgress, addChemRun } from './chemStorage';
import ChemCurriculumMap from './views/ChemCurriculumMap';
import ChemChapterView from './views/ChemChapterView';
import ChemDrillRunner from './views/ChemDrillRunner';
import ChemPractice from './views/ChemPractice';
import './Chem.css';

// Templates self-register on import; this pulls the whole registry in once, mirroring
// afoqt/AfoqtApp.jsx's `import './templates'`.
import './engine/templates';

const ChemContext = createContext(null);
export const useChem = () => useContext(ChemContext);

export default function ChemApp() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const signedIn = !!user;

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (user === undefined) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p = signedIn ? await ChemCloud.load(user.uid) : ChemLocal.load();
        if (!cancelled) setProgress(p);
      } catch (err) {
        console.error('Chem progress load failed, falling back to local:', err);
        if (!cancelled) setProgress(ChemLocal.load());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, signedIn]);

  // Local-first, debounced cloud write — same pattern as afoqtStorage's context (see
  // AfoqtApp.jsx), for the same reason: a drill answers a question every few seconds.
  const mutate = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(prev ?? defaultChemProgress());
      ChemLocal.save(next);
      if (signedIn) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          ChemCloud.save(user.uid, next).catch((e) => console.error('Chem cloud save failed:', e));
        }, 2000);
      }
      return next;
    });
  }, [signedIn, user]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const recordRun = useCallback((run) => {
    setProgress((prev) => {
      const next = addChemRun(prev ?? defaultChemProgress(), run);
      ChemLocal.save(next);
      if (signedIn) ChemCloud.save(user.uid, next).catch((e) => console.error('Chem cloud save failed:', e));
      return next;
    });
  }, [signedIn, user]);

  if (loading || !progress) {
    return <div className="chq-wrap"><div className="chq-loading">Loading…</div></div>;
  }

  return (
    <ChemContext.Provider value={{ progress, mutate, recordRun, signedIn }}>
      <div className="chq-wrap">
        <button className="chq-btn chq-ghost chq-back" onClick={() => navigate('/TKB/courses')}>
          ← All courses
        </button>
        <Routes>
          <Route index element={<ChemCurriculumMap />} />
          <Route path=":chapterId" element={<ChemChapterView />} />
          <Route path="drill/run" element={<ChemDrillRunner />} />
          <Route path="practice" element={<ChemPractice />} />
        </Routes>
      </div>
    </ChemContext.Provider>
  );
}
