import { useParams, useNavigate } from 'react-router-dom';
import languages from '../../data/lang/languages.json';

export default function LangGrammar() {
  const { langId } = useParams();
  const navigate   = useNavigate();
  const lang = languages.find(l => l.id === langId);

  if (!lang) return <div className="lang-error">Language not found.</div>;

  return (
    <div>
      <button className="lang-back-btn" onClick={() => navigate(`/lang/${langId}`)}>← {lang.name}</button>

      <nav className="lang-subnav">
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}`)}>Vocabulary</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/slang`)}>Slang</button>
        <button className="lang-subnav-btn active">Grammar</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/quiz`)}>⚡ Quiz</button>
      </nav>

      <h2 className="lang-vocab-title">{lang.flag} Grammar</h2>
      <div className="lang-placeholder">
        <p>{lang.name} grammar notes — coming in a future update.</p>
      </div>
    </div>
  );
}
