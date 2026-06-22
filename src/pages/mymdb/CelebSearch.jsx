import { useState, useRef, useEffect } from 'react';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

async function searchPeople(query) {
  if (!query.trim() || !TMDB_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    return (data.results || [])
      .filter(p => p.name)
      .map(p => ({
        tmdbId: p.id,
        name: p.name,
        knownForDepartment: p.known_for_department || '',
        profileImage: p.profile_path
          ? `https://image.tmdb.org/t/p/w200${p.profile_path}`
          : null,
        knownFor: (p.known_for || []).map(k => k.title || k.name).filter(Boolean).slice(0, 2),
      }))
      .slice(0, 6);
  } catch {
    return [];
  }
}

export default function CelebSearch({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const search = debounce(async (query) => {
    if (!query.trim()) { setSuggestions([]); return; }
    setLoading(true);
    const results = await searchPeople(query);
    setSuggestions(results);
    setLoading(false);
  }, 400);

  useEffect(() => {
    search(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(s) {
    onChange(s.name);
    onSelect(s);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  return (
    <div className="mdb-tmdb-search-container" ref={containerRef}>
      <input
        type="text"
        className="mdb-form-input"
        placeholder="e.g. Keanu Reeves"
        value={value}
        onChange={e => { onChange(e.target.value); setShowSuggestions(true); }}
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        autoComplete="off"
      />
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="mdb-tmdb-suggestions">
          {loading && <div className="mdb-tmdb-loading">Searching…</div>}
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="mdb-tmdb-suggestion-item"
              onClick={() => handleSelect(s)}
            >
              {s.profileImage ? (
                <img src={s.profileImage} alt={s.name} className="mdb-tmdb-suggestion-cover mdb-celeb-suggestion-cover" />
              ) : (
                <div className="mdb-tmdb-suggestion-cover mdb-celeb-suggestion-placeholder">
                  {s.name.charAt(0)}
                </div>
              )}
              <div className="mdb-tmdb-suggestion-text">
                <div className="mdb-tmdb-suggestion-title">{s.name}</div>
                <div className="mdb-tmdb-suggestion-author">
                  {[s.knownForDepartment, s.knownFor?.join(', ')].filter(Boolean).join(' · ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
