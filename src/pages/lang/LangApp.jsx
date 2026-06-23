import { Routes, Route, useNavigate } from 'react-router-dom';
import LangHome    from './LangHome';
import LangHub     from './LangHub';
import LangVocab   from './LangVocab';
import LangSlang   from './LangSlang';
import LangGrammar from './LangGrammar';
import LangQuiz    from './LangQuiz';
import './Lang.css';

export default function LangApp() {
  const navigate = useNavigate();

  return (
    <div className="lang-wrapper">
      <div className="lang-topbar">
        <button className="lang-topbar-brand" onClick={() => navigate('/lang')}>
          🌐 Language Lab
        </button>
      </div>
      <div className="lang-main">
        <Routes>
          <Route index element={<LangHome />} />
          <Route path=":langId"                  element={<LangHub />} />
          <Route path=":langId/vocab/:category"  element={<LangVocab />} />
          <Route path=":langId/slang"            element={<LangSlang />} />
          <Route path=":langId/grammar"          element={<LangGrammar />} />
          <Route path=":langId/quiz"             element={<LangQuiz />} />
          <Route path="quiz"                     element={<LangQuiz />} />
        </Routes>
      </div>
    </div>
  );
}
