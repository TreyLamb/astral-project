import { useParams, useNavigate } from 'react-router-dom';
import languages from '../../data/lang/languages.json';

const allVocabFiles = import.meta.glob('/src/data/lang/*/vocab/*.json', { eager: true });

export default function LangHub() {
  const { langId } = useParams();
  const navigate   = useNavigate();
  const lang = languages.find(l => l.id === langId);

  if (!lang) return <div className="lang-error">Language not found.</div>;

  const categories = Object.keys(allVocabFiles)
    .filter(p => p.includes(`/lang/${langId}/vocab/`))
    .map(p => p.split('/').pop().replace('.json', ''));

  return (
    <div>
      <button className="lang-back-btn" onClick={() => navigate('/lang')}>← All Languages</button>

      <div className="lang-hub-header">
        <span className="lang-hub-flag">{lang.flag}</span>
        <div>
          <h1 className="lang-hub-title">{lang.name}</h1>
          <span className="lang-hub-native">{lang.nativeName}</span>
        </div>
      </div>

      <nav className="lang-subnav">
        <button className="lang-subnav-btn active">Vocabulary</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/slang`)}>Slang</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/grammar`)}>Grammar</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/quiz`)}>⚡ Quiz</button>
      </nav>

      <div className="lang-category-grid">
        {categories.map(cat => (
          <button
            key={cat}
            className="lang-category-card"
            onClick={() => navigate(`/lang/${langId}/vocab/${cat}`)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
          </button>
        ))}
        {categories.length === 0 && (
          <p className="lang-empty">No vocabulary categories yet.</p>
        )}
      </div>
    </div>
  );
}
