import { useParams, useNavigate } from 'react-router-dom';
import languages from '../../data/lang/languages.json';

const allSlangFiles = import.meta.glob('/src/data/lang/*/slang/*.json', { eager: true });

export default function LangSlang() {
  const { langId } = useParams();
  const navigate   = useNavigate();
  const lang = languages.find(l => l.id === langId);

  if (!lang) return <div className="lang-error">Language not found.</div>;

  const words = allSlangFiles[`/src/data/lang/${langId}/slang/general.json`]?.default ?? [];

  return (
    <div>
      <button className="lang-back-btn" onClick={() => navigate(`/VV/${langId}`)}>← {lang.name}</button>

      <nav className="lang-subnav">
        <button className="lang-subnav-btn" onClick={() => navigate(`/VV/${langId}`)}>Vocabulary</button>
        <button className="lang-subnav-btn active">Slang</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/VV/${langId}/grammar`)}>Grammar</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/VV/${langId}/quiz`)}>⚡ Quiz</button>
      </nav>

      <h2 className="lang-vocab-title">{lang.flag} Slang & Colloquial</h2>

      {words.length === 0 ? (
        <div className="lang-placeholder">
          <p>No slang entries yet for {lang.name}.</p>
          <p>Add entries to <code>src/data/lang/{langId}/slang/general.json</code></p>
        </div>
      ) : (
        <table className="lang-word-table">
          <thead>
            <tr>
              <th>Word / Phrase</th>
              {lang.romanization && <th>{lang.romanization}</th>}
              <th>English</th>
              <th>POS</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w, i) => (
              <tr key={i}>
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
    </div>
  );
}
