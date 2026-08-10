import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import languages from '../../data/lang/languages.json';
import { useLang } from './langContext';

const allVocabFiles = import.meta.glob('/src/data/lang/*/vocab/*.json', { eager: true });

function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function LangHub() {
  const { langId } = useParams();
  const navigate   = useNavigate();
  const { categoriesForLang } = useLang();
  const lang = languages.find(l => l.id === langId);
  const [newCategory, setNewCategory] = useState('');

  if (!lang) return <div className="lang-error">Language not found.</div>;

  const staticCategories = Object.keys(allVocabFiles)
    .filter(p => p.includes(`/lang/${langId}/vocab/`))
    .map(p => p.split('/').pop().replace('.json', ''));

  const customCategories = categoriesForLang(langId);
  const categories = [...new Set([...staticCategories, ...customCategories])].sort();

  function goToNewCategory() {
    const slug = slugify(newCategory);
    if (!slug) return;
    navigate(`/VV/${langId}/vocab/${slug}`);
  }

  return (
    <div>
      <button className="lang-back-btn" onClick={() => navigate('/VV')}>← All Languages</button>

      <div className="lang-hub-header">
        <span className="lang-hub-flag">{lang.flag}</span>
        <div>
          <h1 className="lang-hub-title">{lang.name}</h1>
          <span className="lang-hub-native">{lang.nativeName}</span>
        </div>
      </div>

      <nav className="lang-subnav">
        <button className="lang-subnav-btn active">Vocabulary</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/VV/${langId}/slang`)}>Slang</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/VV/${langId}/grammar`)}>Grammar</button>
        <button className="lang-subnav-btn" onClick={() => navigate(`/VV/${langId}/quiz`)}>⚡ Quiz</button>
      </nav>

      <button
        className="lang-quick-review-btn"
        onClick={() => navigate(`/VV/${langId}/quiz?quick=1`)}
      >
        ⚡ Quick Review — 10 questions
      </button>

      <div className="lang-category-grid">
        {categories.map(cat => (
          <button
            key={cat}
            className="lang-category-card"
            onClick={() => navigate(`/VV/${langId}/vocab/${cat}`)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/[-_]/g, ' ')}
          </button>
        ))}
        {categories.length === 0 && (
          <p className="lang-empty">No vocabulary categories yet.</p>
        )}
      </div>

      <div className="lang-new-category-row">
        <input
          className="lang-new-category-input"
          type="text"
          placeholder="New category name (e.g. Sports)"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') goToNewCategory(); }}
        />
        <button className="lang-quiz-btn lang-quiz-btn-check" onClick={goToNewCategory} disabled={!newCategory.trim()}>
          + Add Category
        </button>
      </div>
    </div>
  );
}
