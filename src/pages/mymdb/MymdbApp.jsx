import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { FirestoreStorage } from './mymdbFirestore';
import MymdbList   from './MymdbList';
import MymdbDetail from './MymdbDetail';
import MymdbForm   from './MymdbForm';
import './MyMDB.css';

// --- Toast context ---
export const ToastContext = createContext(null);
export function useToast() { return useContext(ToastContext); }

// --- Data context ---
// Provides: { items, loading, getItem, addItem, updateItem, removeItem }
// Components use this instead of calling storage directly.
export const MymdbDataContext = createContext(null);
export function useMymdbData() { return useContext(MymdbDataContext); }

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

  // auth: undefined = still loading, null = not signed in, object = signed in
  const [user,    setUser]    = useState(undefined);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return unsub;
  }, []);

  // Load items from Firestore whenever the user changes
  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    FirestoreStorage.seed(user.uid)
      .then(() => FirestoreStorage.getAll(user.uid))
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { showToast('Failed to load library', 'error'); setLoading(false); });
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

  // --- Data context helpers ---
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

  // Still waiting to hear from Firebase auth
  if (user === undefined) {
    return (
      <div className="mdb-wrapper">
        <div className="mdb-loading-screen">Loading…</div>
      </div>
    );
  }

  // Not signed in
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
        <div className="mdb-wrapper">
          <div className="mdb-topbar">
            <div className="mdb-brand">
              <span className="mdb-brand-icon">▶</span>
              MyMDB
            </div>
            <div className="mdb-topbar-right">
              <button className="mdb-btn mdb-btn-primary" onClick={() => navigate('/mymdb/add')}>
                + Add Item
              </button>
              <button className="mdb-btn mdb-btn-secondary" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>

          <div className="mdb-main">
            <Routes>
              <Route index          element={<MymdbList />} />
              <Route path="item/:id" element={<MymdbDetail />} />
              <Route path="add"      element={<MymdbForm />} />
              <Route path="edit/:id" element={<MymdbForm />} />
            </Routes>
          </div>

          <MdbToast toast={toast} />
        </div>
      </MymdbDataContext.Provider>
    </ToastContext.Provider>
  );
}
