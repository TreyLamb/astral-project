import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuth } from '../../../AuthContext';
import { CoursesStorage } from './coursesStorage';
import { CoursesFirestore } from './coursesFirestore';
import CoursesDashboard from './views/CoursesDashboard';
import CanvasDashboard from './views/CanvasDashboard';
import SyllabusView from './views/SyllabusView';
import CourseDetail from './views/CourseDetail';
import WorksheetsList from './views/WorksheetsList';
import WorksheetViewer from './views/WorksheetViewer';
import ChemApp from './chem/ChemApp';
import Boundary from '../../../components/errors/Boundary';
import './Courses.css';

const CoursesContext = createContext(null);
export const useCourses = () => useContext(CoursesContext);

export default function CoursesApp() {
  const location = useLocation();
  const { user } = useAuth();
  const signedIn = !!user;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user === undefined) return; // auth still resolving
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        if (signedIn) {
          await CoursesFirestore.seedIfEmpty(user.uid);
          const c = await CoursesFirestore.getCourses(user.uid);
          if (cancelled) return;
          setCourses(c);
        } else {
          CoursesStorage.seed();
          setCourses(CoursesStorage.getCourses());
        }
      } catch (err) {
        console.error('Courses load failed:', err);
        if (!cancelled) setError(err?.message ?? 'Failed to load courses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, signedIn]);

  const getCourse = useCallback((id) => courses.find((c) => c.id === id) ?? null, [courses]);

  const addCourse = useCallback(async (data) => {
    if (signedIn) {
      const saved = await CoursesFirestore.addCourse(user.uid, data);
      setCourses((prev) => [...prev, saved]);
      return saved;
    }
    const saved = CoursesStorage.addCourse(data);
    setCourses((prev) => [...prev, saved]);
    return saved;
  }, [signedIn, user]);

  const updateCourse = useCallback(async (id, updates) => {
    if (signedIn) {
      const updated = await CoursesFirestore.updateCourse(user.uid, id, updates);
      if (updated) setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    }
    const updated = CoursesStorage.updateCourse(id, updates);
    if (updated) setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, [signedIn, user]);

  const removeCourse = useCallback(async (id) => {
    if (signedIn) {
      await CoursesFirestore.removeCourse(user.uid, id);
    } else {
      CoursesStorage.removeCourse(id);
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, [signedIn, user]);

  if (loading) {
    return <div className="crs-wrap"><div className="crs-loading">Loading…</div></div>;
  }
  if (error) {
    return <div className="crs-wrap"><div className="crs-error">Courses failed to load: {error}</div></div>;
  }

  const contextValue = {
    courses, signedIn,
    getCourse, addCourse, updateCourse, removeCourse,
  };

  return (
    <CoursesContext.Provider value={contextValue}>
      <div className="crs-wrap">
        <Routes>
          <Route index element={<Boundary title="The courses dashboard stopped working." resetId="dashboard"><CoursesDashboard /></Boundary>} />
          <Route path="dashboard" element={<Boundary title="The Canvas dashboard stopped working." resetId="canvas-dashboard"><CanvasDashboard /></Boundary>} />
          <Route path="syllabus" element={<Boundary title="The syllabus view stopped working." resetId="syllabus"><SyllabusView /></Boundary>} />
          <Route path="worksheets" element={<Boundary title="The worksheets list stopped working." resetId="worksheets"><WorksheetsList /></Boundary>} />
          <Route path="worksheets/:worksheetId" element={<Boundary title="This worksheet stopped working." resetId={location.pathname}><WorksheetViewer /></Boundary>} />
          <Route path="chem/*" element={<Boundary title="The Chem curriculum stopped working." resetId={location.pathname}><ChemApp /></Boundary>} />
          <Route path=":courseId" element={<Boundary title="This course's detail view stopped working." resetId={location.pathname}><CourseDetail /></Boundary>} />
        </Routes>
      </div>
    </CoursesContext.Provider>
  );
}
