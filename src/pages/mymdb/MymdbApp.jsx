import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { Storage } from './mymdbStorage';
import MymdbList   from './MymdbList';
import MymdbDetail from './MymdbDetail';
import MymdbForm   from './MymdbForm';
import './MyMDB.css';

// Toast context — children call showToast(msg, type) without prop drilling
export const ToastContext = createContext(null);

function MdbToast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`mdb-toast show${toast.type ? ' ' + toast.type : ''}`}>
      {toast.message}
    </div>
  );
}

export default function MymdbApp() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    Storage.seed();
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      <div className="mdb-wrapper">
        <div className="mdb-topbar">
          <div className="mdb-brand">
            <span className="mdb-brand-icon">▶</span>
            MyMDB
          </div>
          <button className="mdb-btn mdb-btn-primary" onClick={() => navigate('/mymdb/add')}>
            + Add Item
          </button>
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
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
