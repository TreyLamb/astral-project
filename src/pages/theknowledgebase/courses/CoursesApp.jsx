import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuth } from '../../../AuthContext';
import { CoursesStorage } from './coursesStorage';
import { CoursesFirestore } from './coursesFirestore';
import CoursesDashboard from './views/CoursesDashboard';
import CourseDetail from './views/CourseDetail';
import CoursePatternReport from './views/CoursePatternReport';
import Boundary from '../../../components/errors/Boundary';
import './Courses.css';

const CoursesContext = createContext(null);
export const useCourses = () => useContext(CoursesContext);

export default function CoursesApp() {
  const location = useLocation();
  const { user } = useAuth();
  const signedIn = !!user;

  const [courses, setCourses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [realQuestions, setRealQuestions] = useState([]);
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
          const [c, d, a, q] = await Promise.all([
            CoursesFirestore.getCourses(user.uid),
            CoursesFirestore.getDocuments(user.uid),
            CoursesFirestore.getAssessments(user.uid),
            CoursesFirestore.getRealQuestions(user.uid),
          ]);
          if (cancelled) return;
          setCourses(c); setDocuments(d); setAssessments(a); setRealQuestions(q);
        } else {
          CoursesStorage.seed();
          setCourses(CoursesStorage.getCourses());
          setDocuments(CoursesStorage.getDocuments());
          setAssessments(CoursesStorage.getAssessments());
          setRealQuestions(CoursesStorage.getRealQuestions());
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
      await CoursesFirestore.removeCourse(user.uid, id, documents, assessments, realQuestions);
    } else {
      CoursesStorage.removeCourse(id);
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setDocuments((prev) => prev.filter((d) => d.courseId !== id));
    setAssessments((prev) => prev.filter((a) => a.courseId !== id));
    setRealQuestions((prev) => prev.filter((q) => q.courseId !== id));
  }, [signedIn, user, documents, assessments, realQuestions]);

  const addDocument = useCallback(async (data) => {
    const saved = signedIn ? await CoursesFirestore.addDocument(user.uid, data) : CoursesStorage.addDocument(data);
    setDocuments((prev) => [...prev, saved]);
    return saved;
  }, [signedIn, user]);

  const updateDocument = useCallback(async (id, updates) => {
    const updated = signedIn
      ? await CoursesFirestore.updateDocument(user.uid, id, updates)
      : CoursesStorage.updateDocument(id, updates);
    if (updated) setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, [signedIn, user]);

  const removeDocument = useCallback(async (id) => {
    if (signedIn) await CoursesFirestore.removeDocument(user.uid, id);
    else CoursesStorage.removeDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, [signedIn, user]);

  const addAssessment = useCallback(async (data) => {
    const saved = signedIn ? await CoursesFirestore.addAssessment(user.uid, data) : CoursesStorage.addAssessment(data);
    setAssessments((prev) => [...prev, saved]);
    return saved;
  }, [signedIn, user]);

  const updateAssessment = useCallback(async (id, updates) => {
    const updated = signedIn
      ? await CoursesFirestore.updateAssessment(user.uid, id, updates)
      : CoursesStorage.updateAssessment(id, updates);
    if (updated) setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, [signedIn, user]);

  const removeAssessment = useCallback(async (id) => {
    if (signedIn) await CoursesFirestore.removeAssessment(user.uid, id, realQuestions);
    else CoursesStorage.removeAssessment(id);
    setAssessments((prev) => prev.filter((a) => a.id !== id));
    setRealQuestions((prev) => prev.filter((q) => q.assessmentId !== id));
  }, [signedIn, user, realQuestions]);

  const addRealQuestion = useCallback(async (data) => {
    if (signedIn) {
      const assessment = assessments.find((a) => a.id === data.assessmentId) ?? null;
      const saved = await CoursesFirestore.addRealQuestion(user.uid, data, assessment);
      setRealQuestions((prev) => [...prev, saved]);
      if (assessment) {
        setAssessments((prev) => prev.map((a) => (a.id === assessment.id ? { ...a, questionIds: [...a.questionIds, saved.id] } : a)));
      }
      return saved;
    }
    const saved = CoursesStorage.addRealQuestion(data);
    setRealQuestions((prev) => [...prev, saved]);
    setAssessments(CoursesStorage.getAssessments());
    return saved;
  }, [signedIn, user, assessments]);

  const updateRealQuestion = useCallback(async (id, updates) => {
    const updated = signedIn
      ? await CoursesFirestore.updateRealQuestion(user.uid, id, updates)
      : CoursesStorage.updateRealQuestion(id, updates);
    if (updated) setRealQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
    return updated;
  }, [signedIn, user]);

  const removeRealQuestion = useCallback(async (id) => {
    const q = realQuestions.find((q) => q.id === id) ?? null;
    if (signedIn) {
      const assessment = q ? assessments.find((a) => a.id === q.assessmentId) : null;
      await CoursesFirestore.removeRealQuestion(user.uid, id, assessment);
    } else {
      CoursesStorage.removeRealQuestion(id);
    }
    setRealQuestions((prev) => prev.filter((q) => q.id !== id));
    if (q) setAssessments((prev) => prev.map((a) => (a.id === q.assessmentId ? { ...a, questionIds: a.questionIds.filter((qid) => qid !== id) } : a)));
  }, [signedIn, user, realQuestions, assessments]);

  if (loading) {
    return <div className="crs-wrap"><div className="crs-loading">Loading…</div></div>;
  }
  if (error) {
    return <div className="crs-wrap"><div className="crs-error">Courses failed to load: {error}</div></div>;
  }

  const contextValue = {
    courses, documents, assessments, realQuestions, signedIn,
    getCourse, addCourse, updateCourse, removeCourse,
    addDocument, updateDocument, removeDocument,
    addAssessment, updateAssessment, removeAssessment,
    addRealQuestion, updateRealQuestion, removeRealQuestion,
  };

  return (
    <CoursesContext.Provider value={contextValue}>
      <div className="crs-wrap">
        <Routes>
          <Route index element={<Boundary title="The courses dashboard stopped working." resetId="dashboard"><CoursesDashboard /></Boundary>} />
          <Route path=":courseId" element={<Boundary title="This course's detail view stopped working." resetId={location.pathname}><CourseDetail /></Boundary>} />
          <Route path=":courseId/patterns" element={<Boundary title="The pattern report stopped working." resetId={location.pathname}><CoursePatternReport /></Boundary>} />
        </Routes>
      </div>
    </CoursesContext.Provider>
  );
}
