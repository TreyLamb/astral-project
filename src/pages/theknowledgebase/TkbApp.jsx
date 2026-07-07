import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { TkbStorage } from './tkbStorage';
import TkbHome from './TkbHome';
import TkbReview from './TkbReview';
import TkbBubbles from './TkbBubbles';
import TkbSettings from './TkbSettings';
import './Tkb.css';

export const TkbDataContext = createContext(null);
export function useTkbData() {
  return useContext(TkbDataContext);
}

export const TkbToastContext = createContext(null);
export function useTkbToast() {
  return useContext(TkbToastContext);
}

function TkbToast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`tkb-toast show${toast.type ? ' ' + toast.type : ''}`}>
      {toast.message}
    </div>
  );
}

export default function TkbApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [weights, setWeights] = useState({ subject: {}, tag: {}, question: {} });
  const [cycles, setCycles] = useState({});
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    TkbStorage.seed();
    setQuestions(TkbStorage.getQuestions());
    setSubjects(TkbStorage.getSubjects());
    setWeights(TkbStorage.getWeights());
    setCycles(TkbStorage.getCycles());
    setSettings(TkbStorage.getSettings());
    setLoading(false);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const getQuestion = useCallback((id) => questions.find(q => q.id === id) ?? null, [questions]);

  const addQuestion = useCallback((data) => {
    const saved = TkbStorage.addQuestion(data);
    setQuestions(prev => [...prev, saved]);
    return saved;
  }, []);

  const updateQuestionState = useCallback((id, updates) => {
    const updated = TkbStorage.updateQuestion(id, updates);
    if (updated) setQuestions(prev => prev.map(q => (q.id === id ? updated : q)));
    return updated;
  }, []);

  const removeQuestionState = useCallback((id) => {
    TkbStorage.removeQuestion(id);
    setQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  const recordAnswer = useCallback((id, grade) => {
    const updated = TkbStorage.recordAnswer(id, grade);
    if (updated) setQuestions(prev => prev.map(q => (q.id === id ? updated : q)));
    return updated;
  }, []);

  const updateSubject = useCallback((id, updates) => {
    const updated = TkbStorage.updateSubject(id, updates);
    if (updated) setSubjects(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const removeSubject = useCallback((id) => {
    TkbStorage.removeSubject(id);
    setSubjects(TkbStorage.getSubjects());
    setQuestions(TkbStorage.getQuestions());
    setWeights(TkbStorage.getWeights());
    setCycles(TkbStorage.getCycles());
  }, []);

  const mergeSubjects = useCallback((sourceId, targetId) => {
    TkbStorage.mergeSubjects(sourceId, targetId);
    setSubjects(TkbStorage.getSubjects());
    setQuestions(TkbStorage.getQuestions());
    setWeights(TkbStorage.getWeights());
  }, []);

  const setWeight = useCallback((kind, key, value) => {
    const updated = TkbStorage.setWeight(kind, key, value);
    setWeights(updated);
  }, []);

  const enterCycle = useCallback((questionId, reason) => {
    const cfg = settings?.cycle ?? { activeMin: 3, activeMax: 4, restMin: 1, restMax: 2 };
    const updated = TkbStorage.enterCycle(questionId, reason, cfg);
    setCycles(updated);
  }, [settings]);

  const updateSettings = useCallback((updates) => {
    const updated = TkbStorage.updateSettings(updates);
    setSettings(updated);
    return updated;
  }, []);

  const logSession = useCallback((session) => {
    TkbStorage.addSession(session);
  }, []);

  const importQuestions = useCallback((jsonText) => {
    const result = TkbStorage.importQuestions(jsonText);
    setQuestions(TkbStorage.getQuestions());
    setSubjects(TkbStorage.getSubjects());
    return result;
  }, []);

  if (loading || !settings) {
    return (
      <div className="tkb-wrapper">
        <div className="tkb-loading-screen">Loading…</div>
      </div>
    );
  }

  const contextValue = {
    questions,
    subjects,
    weights,
    cycles,
    settings,
    getQuestion,
    addQuestion,
    updateQuestion: updateQuestionState,
    removeQuestion: removeQuestionState,
    recordAnswer,
    updateSubject,
    removeSubject,
    mergeSubjects,
    setWeight,
    enterCycle,
    updateSettings,
    logSession,
    importQuestions,
  };

  const tabs = [
    { path: '/tkb', label: 'Home', match: (p) => p === '/tkb' },
    { path: '/tkb/review', label: 'Review', match: (p) => p.startsWith('/tkb/review') },
    { path: '/tkb/subjects', label: 'Subjects', match: (p) => p.startsWith('/tkb/subjects') },
    { path: '/tkb/settings', label: 'Settings', match: (p) => p.startsWith('/tkb/settings') },
  ];

  return (
    <TkbToastContext.Provider value={showToast}>
      <TkbDataContext.Provider value={contextValue}>
        <div className="tkb-wrapper">
          <div className="tkb-topbar">
            <div className="tkb-brand" onClick={() => navigate('/tkb')} style={{ cursor: 'pointer' }}>
              TheKnowledgeBase
            </div>
            {tabs.map(t => (
              <button
                key={t.path}
                className={`tkb-nav-tab${t.match(location.pathname) ? ' active' : ''}`}
                onClick={() => navigate(t.path)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="tkb-main">
            <Routes>
              <Route index element={<TkbHome />} />
              <Route path="review" element={<TkbReview />} />
              <Route path="subjects" element={<TkbBubbles />} />
              <Route path="settings" element={<TkbSettings />} />
            </Routes>
          </div>

          <TkbToast toast={toast} />
        </div>
      </TkbDataContext.Provider>
    </TkbToastContext.Provider>
  );
}
