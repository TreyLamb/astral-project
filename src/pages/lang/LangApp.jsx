import { Routes, Route, useNavigate } from 'react-router-dom';
import { LangContext, useLangState } from './langContext';
import LangHome    from './LangHome';
import LangHub     from './LangHub';
import LangVocab   from './LangVocab';
import LangSlang   from './LangSlang';
import LangGrammar from './LangGrammar';
import LangQuiz    from './LangQuiz';
import './Lang.css';

export default function LangApp() {
  const navigate = useNavigate();
  const lang = useLangState();

  return (
    <LangContext.Provider value={lang}>
      <div className="lang-wrapper">
        <div className="lang-topbar">
          <button className="lang-topbar-brand" onClick={() => navigate('/VV')}>
            🗃️ Vocab Vault
          </button>
          <span className={`lang-sync lang-sync-${lang.mode}`} title={lang.mode === 'cloud' ? 'Your words sync to your account' : 'Saved on this device — sign in to sync across devices'}>
            {lang.mode === 'cloud' ? '☁ Synced' : '● Local'}
          </span>
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
    </LangContext.Provider>
  );
}
