import { useNavigate } from 'react-router-dom';
import languages from '../../data/lang/languages.json';

export default function LangHome() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="lang-section-title">Languages</h1>
      <p className="lang-section-subtitle">Select a language to study</p>
      <div className="lang-language-grid">
        {languages.map(lang => (
          <button
            key={lang.id}
            className="lang-language-card"
            onClick={() => navigate(`/VV/${lang.id}`)}
          >
            <div className="lang-language-flag">{lang.flag}</div>
            <div className="lang-language-name">{lang.name}</div>
            <div className="lang-language-native">{lang.nativeName}</div>
            {lang.romanization && (
              <div className="lang-language-rom">({lang.romanization})</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
