import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { useAuth } from '../../AuthContext';
import { TkbStorage } from './tkbStorage';
import { TkbFirestore } from './tkbFirestore';
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
  const { user } = useAuth();
  // Signed-in users sync to Firestore; everyone else (including while auth
  // is still resolving) uses localStorage exactly as before — guest mode
  // never blocks on network.
  const signedIn = !!user;

  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [weights, setWeights] = useState({ subject: {}, tag: {}, question: {} });
  const [cycles, setCycles] = useState({});
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSyncError = useCallback((err) => {
    if (err?.code === 'resource-exhausted') {
      showToast("Cloud sync paused — today's free Firebase limit was hit. Your data is safe locally; try again after midnight Pacific.", 'error');
    } else {
      showToast(`Cloud sync error: ${err?.message ?? 'unknown'}`, 'error');
    }
    console.error('TKB Firestore error:', err);
  }, [showToast]);

  useEffect(() => {
    if (user === undefined) return; // auth still resolving
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        if (signedIn) {
          await TkbFirestore.seedIfEmpty(user.uid);
          await TkbFirestore.syncContentIfStale(user.uid);
          const [q, s, meta] = await Promise.all([
            TkbFirestore.getQuestions(user.uid),
            TkbFirestore.getSubjects(user.uid),
            TkbFirestore.getMeta(user.uid),
          ]);
          if (cancelled) return;
          setQuestions(q);
          setSubjects(s);
          setWeights(meta.weights);
          setCycles(meta.cycles);
          setSessions(meta.sessions);
          setSettings(meta.settings);
        } else {
          TkbStorage.seed();
          setQuestions(TkbStorage.getQuestions());
          setSubjects(TkbStorage.getSubjects());
          setWeights(TkbStorage.getWeights());
          setCycles(TkbStorage.getCycles());
          setSessions(TkbStorage.getSessions());
          setSettings(TkbStorage.getSettings());
        }
      } catch (err) {
        if (!cancelled) handleSyncError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, signedIn, handleSyncError]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const getQuestion = useCallback((id) => questions.find(q => q.id === id) ?? null, [questions]);

  const addQuestion = useCallback(async (data) => {
    if (signedIn) {
      try {
        const saved = await TkbFirestore.addQuestion(user.uid, data);
        setQuestions(prev => [...prev, saved]);
        return saved;
      } catch (err) { handleSyncError(err); return null; }
    }
    const saved = TkbStorage.addQuestion(data);
    setQuestions(prev => [...prev, saved]);
    return saved;
  }, [signedIn, user, handleSyncError]);

  const updateQuestionState = useCallback(async (id, updates) => {
    if (signedIn) {
      try {
        const updated = await TkbFirestore.updateQuestion(user.uid, id, updates);
        if (updated) setQuestions(prev => prev.map(q => (q.id === id ? updated : q)));
        return updated;
      } catch (err) { handleSyncError(err); return null; }
    }
    const updated = TkbStorage.updateQuestion(id, updates);
    if (updated) setQuestions(prev => prev.map(q => (q.id === id ? updated : q)));
    return updated;
  }, [signedIn, user, handleSyncError]);

  const removeQuestionState = useCallback(async (id) => {
    if (signedIn) {
      try {
        await TkbFirestore.removeQuestion(user.uid, id);
        setQuestions(prev => prev.filter(q => q.id !== id));
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    TkbStorage.removeQuestion(id);
    setQuestions(prev => prev.filter(q => q.id !== id));
  }, [signedIn, user, handleSyncError]);

  const recordAnswer = useCallback(async (id, grade) => {
    if (signedIn) {
      try {
        const current = questions.find(q => q.id === id);
        if (!current) return null;
        const updated = await TkbFirestore.recordAnswer(user.uid, id, grade, current);
        setQuestions(prev => prev.map(q => (q.id === id ? updated : q)));
        return updated;
      } catch (err) { handleSyncError(err); return null; }
    }
    const updated = TkbStorage.recordAnswer(id, grade);
    if (updated) setQuestions(prev => prev.map(q => (q.id === id ? updated : q)));
    return updated;
  }, [signedIn, user, questions, handleSyncError]);

  const updateSubject = useCallback(async (id, updates) => {
    if (signedIn) {
      try {
        const updated = await TkbFirestore.updateSubject(user.uid, id, updates);
        if (updated) setSubjects(prev => prev.map(s => (s.id === id ? updated : s)));
        return updated;
      } catch (err) { handleSyncError(err); return null; }
    }
    const updated = TkbStorage.updateSubject(id, updates);
    if (updated) setSubjects(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  }, [signedIn, user, handleSyncError]);

  const removeSubject = useCallback(async (id) => {
    if (signedIn) {
      try {
        await TkbFirestore.removeSubject(user.uid, id, questions);
        const [q, s, meta] = await Promise.all([
          TkbFirestore.getQuestions(user.uid),
          TkbFirestore.getSubjects(user.uid),
          TkbFirestore.getMeta(user.uid),
        ]);
        setQuestions(q); setSubjects(s); setWeights(meta.weights); setCycles(meta.cycles);
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    TkbStorage.removeSubject(id);
    setSubjects(TkbStorage.getSubjects());
    setQuestions(TkbStorage.getQuestions());
    setWeights(TkbStorage.getWeights());
    setCycles(TkbStorage.getCycles());
  }, [signedIn, user, questions, handleSyncError]);

  const mergeSubjects = useCallback(async (sourceId, targetId) => {
    if (signedIn) {
      try {
        await TkbFirestore.mergeSubjects(user.uid, sourceId, targetId, subjects, questions);
        const [q, s, meta] = await Promise.all([
          TkbFirestore.getQuestions(user.uid),
          TkbFirestore.getSubjects(user.uid),
          TkbFirestore.getMeta(user.uid),
        ]);
        setQuestions(q); setSubjects(s); setWeights(meta.weights);
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    TkbStorage.mergeSubjects(sourceId, targetId);
    setSubjects(TkbStorage.getSubjects());
    setQuestions(TkbStorage.getQuestions());
    setWeights(TkbStorage.getWeights());
  }, [signedIn, user, subjects, questions, handleSyncError]);

  const setWeight = useCallback(async (kind, key, value) => {
    if (signedIn) {
      try {
        const updated = await TkbFirestore.setWeight(user.uid, kind, key, value);
        setWeights(updated);
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    const updated = TkbStorage.setWeight(kind, key, value);
    setWeights(updated);
  }, [signedIn, user, handleSyncError]);

  const enterCycle = useCallback(async (questionId, reason) => {
    const cfg = settings?.cycle ?? { activeMin: 3, activeMax: 4, restMin: 1, restMax: 2 };
    if (signedIn) {
      try {
        const updated = await TkbFirestore.enterCycle(user.uid, questionId, reason, cfg);
        setCycles(updated);
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    const updated = TkbStorage.enterCycle(questionId, reason, cfg);
    setCycles(updated);
  }, [signedIn, user, settings, handleSyncError]);

  const updateSettings = useCallback(async (updates) => {
    if (signedIn) {
      try {
        const updated = await TkbFirestore.updateSettings(user.uid, updates);
        setSettings(updated);
        return updated;
      } catch (err) { handleSyncError(err); return null; }
    }
    const updated = TkbStorage.updateSettings(updates);
    setSettings(updated);
    return updated;
  }, [signedIn, user, handleSyncError]);

  const logSession = useCallback(async (session) => {
    if (signedIn) {
      try {
        await TkbFirestore.addSession(user.uid, session);
        setSessions(prev => [session, ...prev].slice(0, 200));
        return;
      } catch (err) { handleSyncError(err); return; }
    }
    TkbStorage.addSession(session);
    setSessions(prev => [session, ...prev].slice(0, 200));
  }, [signedIn, user, handleSyncError]);

  const importQuestions = useCallback(async (jsonText) => {
    if (signedIn) {
      try {
        const result = await TkbFirestore.importQuestions(user.uid, jsonText, subjects, questions);
        const [q, s] = await Promise.all([
          TkbFirestore.getQuestions(user.uid),
          TkbFirestore.getSubjects(user.uid),
        ]);
        setQuestions(q); setSubjects(s);
        return result;
      } catch (err) { handleSyncError(err); return { added: 0, skipped: 0, errors: ['Cloud sync error'] }; }
    }
    const result = TkbStorage.importQuestions(jsonText);
    setQuestions(TkbStorage.getQuestions());
    setSubjects(TkbStorage.getSubjects());
    return result;
  }, [signedIn, user, subjects, questions, handleSyncError]);

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
    sessions,
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
    { path: '/TKB', label: 'Home', match: (p) => p === '/TKB' },
    { path: '/TKB/review', label: 'Review', match: (p) => p.startsWith('/TKB/review') },
    { path: '/TKB/subjects', label: 'Subjects', match: (p) => p.startsWith('/TKB/subjects') },
    { path: '/TKB/settings', label: 'Settings', match: (p) => p.startsWith('/TKB/settings') },
  ];

  return (
    <TkbToastContext.Provider value={showToast}>
      <TkbDataContext.Provider value={contextValue}>
        <div className="tkb-wrapper">
          <div className="tkb-topbar">
            <div className="tkb-brand" onClick={() => navigate('/TKB')} style={{ cursor: 'pointer' }}>
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
            <span className="tkb-sync-status" title={signedIn ? 'Synced to your account' : 'Only saved on this device — sign in (top nav) to sync'}>
              {signedIn ? '☁ Synced' : '📴 Local only'}
            </span>
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
