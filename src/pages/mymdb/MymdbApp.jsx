import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { FirestoreStorage, CelebsStorage } from './mymdbFirestore';
import MymdbList        from './MymdbList';
import MymdbDetail      from './MymdbDetail';
import MymdbForm        from './MymdbForm';
import MymdbCelebs      from './MymdbCelebs';
import MymdbCelebDetail from './MymdbCelebDetail';
import MymdbCelebForm   from './MymdbCelebForm';
import './MyMDB.css';

// --- Toast context ---
export const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

// --- Library data context ---
export const MymdbDataContext = createContext(null);
export function useMymdbData() { return useContext(MymdbDataContext); }

// --- Celebs data context ---
export const MymdbCelebsContext = createContext(null);
export function useMymdbCelebs() { return useContext(MymdbCelebsContext); }

function MdbToast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`mdb-toast show${toast.type ? ' ' + toast.type : ''}`}>
      {toast.message}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  return (
    <div className="mdb-login-screen">
      <div className="mdb-login-card">
        <div className="mdb-login-icon">▶</div>
        <h2>MyMDB</h2>
        <p>Sign in to access your movie &amp; book library from any device.</p>
        <button className="mdb-btn mdb-btn-primary mdb-login-btn" onClick={onLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function MymdbApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const isCelebsPath = location.pathname.startsWith('/mymdb/celebs');

  // auth: undefined = still loading, null = not signed in, object = signed in
  const [user,          setUser]          = useState(undefined);
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [celebs,        setCelebs]        = useState([]);
  const [celebsLoading, setCelebsLoading] = useState(true);
  const [toast,         setToast]         = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return unsub;
  }, []);

  // Load library items from Firestore
  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    FirestoreStorage.seed(user.uid)
      .then(() => FirestoreStorage.getAll(user.uid))
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { showToast('Failed to load library', 'error'); setLoading(false); });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load celebs from Firestore
  useEffect(() => {
    if (!user) { setCelebs([]); setCelebsLoading(false); return; }
    setCelebsLoading(true);
    CelebsStorage.getAll(user.uid)
      .then(data => { setCelebs(data); setCelebsLoading(false); })
      .catch(() => { showToast('Failed to load celebs', 'error'); setCelebsLoading(false); });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function handleLogin() {
    try { await signInWithPopup(auth, googleProvider); }
    catch { showToast('Sign-in failed', 'error'); }
  }

  async function handleLogout() {
    await signOut(auth);
    navigate('/mymdb');
  }

  // --- Library context helpers ---
  const getItem = useCallback((id) => items.find(i => i.id === id) ?? null, [items]);

  const addItem = useCallback(async (data) => {
    const saved = await FirestoreStorage.save(user.uid, data);
    setItems(prev => [saved, ...prev].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)));
    return saved;
  }, [user]);

  const updateItem = useCallback(async (id, updates) => {
    await FirestoreStorage.update(user.uid, id, updates);
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, [user]);

  const removeItem = useCallback(async (id) => {
    await FirestoreStorage.remove(user.uid, id);
    setItems(prev => prev.filter(i => i.id !== id));
  }, [user]);

  // --- Celebs context helpers ---
  const getCeleb = useCallback((id) => celebs.find(c => c.id === id) ?? null, [celebs]);

  const addCeleb = useCallback(async (data) => {
    const saved = await CelebsStorage.save(user.uid, data);
    setCelebs(prev => [saved, ...prev].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)));
    return saved;
  }, [user]);

  const updateCeleb = useCallback(async (id, updates) => {
    await CelebsStorage.update(user.uid, id, updates);
    setCelebs(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [user]);

  const removeCeleb = useCallback(async (id) => {
    await CelebsStorage.remove(user.uid, id);
    setCelebs(prev => prev.filter(c => c.id !== id));
  }, [user]);

  if (user === undefined) {
    return (
      <div className="mdb-wrapper">
        <div className="mdb-loading-screen">Loading…</div>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="mdb-wrapper">
        <LoginScreen onLogin={handleLogin} />
        <MdbToast toast={toast} />
      </div>
    );
  }

  return (
    <ToastContext.Provider value={showToast}>
      <MymdbDataContext.Provider value={{ items, loading, getItem, addItem, updateItem, removeItem }}>
        <MymdbCelebsContext.Provider value={{ celebs, celebsLoading, getCeleb, addCeleb, updateCeleb, removeCeleb }}>
          <div className={`mdb-wrapper${isCelebsPath ? ' mdb-celebs-mode' : ''}`}>
            <div className="mdb-topbar">
              <div className="mdb-topbar-left">
                <div className="mdb-brand" onClick={() => navigate('/mymdb')} style={{ cursor: 'pointer' }}>
                  <span className="mdb-brand-icon">▶</span>
                  MyMDB
                </div>
                <nav className="mdb-nav-tabs">
                  <button
                    className={`mdb-nav-tab${!isCelebsPath ? ' active' : ''}`}
                    onClick={() => navigate('/mymdb')}
                  >
                    Library
                  </button>
                  <button
                    className={`mdb-nav-tab mdb-nav-tab-celebs${isCelebsPath ? ' active' : ''}`}
                    onClick={() => navigate('/mymdb/celebs')}
                  >
                    ⭐ Fav Celebs
                  </button>
                </nav>
              </div>

              <div className="mdb-topbar-right">
                <button
                  className="mdb-btn mdb-btn-primary"
                  onClick={() => navigate(isCelebsPath ? '/mymdb/celebs/add' : '/mymdb/add')}
                >
                  {isCelebsPath ? '+ Add Celeb' : '+ Add Item'}
                </button>
                <button className="mdb-btn mdb-btn-secondary" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </div>

            <div className={`mdb-main${isCelebsPath ? ' mdb-celebs-main' : ''}`}>
              <Routes>
                <Route index           element={<MymdbList />} />
                <Route path="item/:id" element={<MymdbDetail />} />
                <Route path="add"      element={<MymdbForm />} />
                <Route path="edit/:id" element={<MymdbForm />} />
                <Route path="celebs"          element={<MymdbCelebs />} />
                <Route path="celebs/add"      element={<MymdbCelebForm />} />
                <Route path="celebs/edit/:id" element={<MymdbCelebForm />} />
                <Route path="celebs/:id"      element={<MymdbCelebDetail />} />
              </Routes>
            </div>

            <MdbToast toast={toast} />
          </div>
        </MymdbCelebsContext.Provider>
      </MymdbDataContext.Provider>
    </ToastContext.Provider>
  );
}
