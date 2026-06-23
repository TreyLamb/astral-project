import { useParams, useNavigate } from 'react-router-dom';
import languages from '../../data/lang/languages.json';

const allVocabFiles = import.meta.glob('/src/data/lang/*/vocab/*.json', { eager: true });

function speak(word, langCode) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = langCode ?? 'en-US';
  window.speechSynthesis.speak(utt);
}

export default function LangVocab() {
  const { langId, category } = useParams();
  const navigate = useNavigate();
  const lang = languages.find(l => l.id === langId);

  if (!lang) return <div className="lang-error">Language not found.</div>;

  const words = allVocabFiles[`/src/data/lang/${langId}/vocab/${category}.json`]?.default ?? [];
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');

  return (
    <div>
      <button className="lang-back-btn" onClick={() => navigate(`/lang/${langId}`)}>
        ← {lang.name}
      </button>

      <nav className="lang-subnav">
        <button className="lang-subnav-btn active">Vocabulary</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/slang`)}>Slang</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/grammar`)}>Grammar</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/lang/${langId}/quiz`)}>⚡ Quiz</button>
      </nav>

      <h2 className="lang-vocab-title">{lang.flag} {categoryLabel}</h2>

      {words.length === 0 ? (
        <div className="lang-placeholder"><p>No words in this category yet.</p></div>
      ) : (
        <table className="lang-word-table">
          <thead>
            <tr>
              <th></th>
              <th>Word</th>
              {lang.romanization && <th>{lang.romanization}</th>}
              <th>English</th>
              <th>POS</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={i}>
                <td className="lang-speak-cell">
                  <button
                    className="lang-speak-btn"
                    onClick={() => speak(w.word, lang.langCode)}
                    title={`Hear ${w.word}`}
                  >
                    🔊
                  </button>
                </td>
                <td className="lang-word-script">{w.word}</td>
                {lang.romanization && <td className="lang-word-rom">{w.romanization ?? '—'}</td>}
                <td>{w.english}</td>
                <td className="lang-word-pos">{w.pos}</td>
                <td className="lang-word-notes">{w.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {words.length > 0 && (
        <button
          className="lang-quiz-cta-btn"
          onClick={() => navigate(`/lang/${langId}/quiz`)}
        >
          ⚡ Quiz yourself on {categoryLabel}
        </button>
      )}
    </div>
  );
}
