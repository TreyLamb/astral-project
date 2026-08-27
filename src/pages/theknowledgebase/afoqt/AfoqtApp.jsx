import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { useAuth } from '../../../AuthContext';
import { AfoqtLocal, AfoqtCloud, defaultProgress, applyAnswer, addRun } from './afoqtStorage';
import AfoqtDashboard from './views/AfoqtDashboard';
import CurriculumMap from './views/CurriculumMap';
import ChapterView from './views/ChapterView';
import DrillConfig from './views/DrillConfig';
import DrillRunner from './views/DrillRunner';
import ExamRunner from './views/ExamRunner';
import './Afoqt.css';

// Templates self-register on import; this pulls the whole registry in once.
import './templates';

const AfoqtContext = createContext(null);
export const useAfoqt = () => useContext(AfoqtContext);

export default function AfoqtApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const signedIn = !!user;

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (user === undefined) return; // auth still resolving
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p = signedIn ? await AfoqtCloud.load(user.uid) : AfoqtLocal.load();
        if (!cancelled) setProgress(p);
      } catch (err) {
        console.error('AFOQT load failed, falling back to local:', err);
        if (!cancelled) setProgress(AfoqtLocal.load());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, signedIn]);

  // Always write locally first so a network hiccup can never lose a session, then debounce
  // the cloud write - a drill answers a question every few seconds and each one mutates
  // progress, which would otherwise be one Firestore write per question.
  const persist = useCallback((next) => {
    setProgress(next);
    AfoqtLocal.save(next);
    if (!signedIn) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AfoqtCloud.save(user.uid, next).catch((e) => console.error('AFOQT cloud save failed:', e));
    }, 2000);
  }, [signedIn, user]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const recordAnswer = useCallback((entry) => {
    setProgress((prev) => {
      const next = applyAnswer(prev ?? defaultProgress(), entry);
      AfoqtLocal.save(next);
      if (signedIn) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          AfoqtCloud.save(user.uid, next).catch((e) => console.error('AFOQT cloud save failed:', e));
        }, 2000);
      }
      return next;
    });
  }, [signedIn, user]);

  const recordRun = useCallback((run) => {
    setProgress((prev) => {
      const next = addRun(prev ?? defaultProgress(), run);
      AfoqtLocal.save(next);
      if (signedIn) AfoqtCloud.save(user.uid, next).catch((e) => console.error('AFOQT cloud save failed:', e));
      return next;
    });
  }, [signedIn, user]);

  // Generic mutator for anything that folds into the progress blob - chapter test-out
  // results, mastery checks, a miss-pool reset. Local write first so a network hiccup can
  // never lose it, cloud write debounced.
  const mutate = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(prev ?? defaultProgress());
      AfoqtLocal.save(next);
      if (signedIn) {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          AfoqtCloud.save(user.uid, next).catch((e) => console.error('AFOQT cloud save failed:', e));
        }, 2000);
      }
      return next;
    });
  }, [signedIn, user]);

  const updateSettings = useCallback((patch) => {
    setProgress((prev) => {
      const base = prev ?? defaultProgress();
      const next = { ...base, settings: { ...base.settings, ...patch } };
      AfoqtLocal.save(next);
      return next;
    });
  }, []);

  if (loading || !progress) {
    return <div className="afq-wrap"><div className="afq-loading">Loading…</div></div>;
  }

  const tabs = [
    { path: '/TKB/afoqt', label: 'Dashboard', match: (p) => p === '/TKB/afoqt' },
    { path: '/TKB/afoqt/learn', label: 'Learn', match: (p) => p.startsWith('/TKB/afoqt/learn') },
    { path: '/TKB/afoqt/drill', label: 'Drill', match: (p) => p.startsWith('/TKB/afoqt/drill') },
    { path: '/TKB/afoqt/exam', label: 'Exam', match: (p) => p.startsWith('/TKB/afoqt/exam') },
  ];

  return (
    <AfoqtContext.Provider value={{ progress, persist, mutate, recordAnswer, recordRun, updateSettings, signedIn }}>
      <div className="afq-wrap">
        <nav className="afq-subnav">
          {tabs.map((t) => (
            <button
              key={t.path}
              className={`afq-subtab${t.match(location.pathname) ? ' active' : ''}`}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <Routes>
          <Route index element={<AfoqtDashboard />} />
          <Route path="learn" element={<CurriculumMap />} />
          <Route path="learn/:chapterId" element={<ChapterView />} />
          <Route path="drill" element={<DrillConfig />} />
          <Route path="drill/run" element={<DrillRunner />} />
          <Route path="exam" element={<ExamRunner />} />
        </Routes>
      </div>
    </AfoqtContext.Provider>
  );
}
