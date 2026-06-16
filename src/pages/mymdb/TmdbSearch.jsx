import { useState, useRef, useEffect } from 'react';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function normalizeTitle(title) {
  return title.replace(/^(the|a|an)\s+/i, '').toLowerCase().trim();
}

async function searchTmdb(query) {
  if (!query.trim() || !TMDB_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    const normalized = normalizeTitle(query);
    const results = (data.results || [])
      .filter(r => r.title && r.release_date)
      .map(r => ({
        title: r.title,
        year: new Date(r.release_date).getFullYear(),
        director: null,
        coverImage: r.poster_path ? `https://image.tmdb.org/t/p/w200${r.poster_path}` : null,
        normalizedTitle: normalizeTitle(r.title),
      }));

    const startsWithQuery = results.filter(r => r.normalizedTitle.startsWith(normalized)).sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));
    const others = results.filter(r => !r.normalizedTitle.startsWith(normalized)).sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));

    return [...startsWithQuery, ...others].map(({ normalizedTitle, ...rest }) => rest).slice(0, 5);
  } catch (e) {
    console.error('TMDB search error:', e);
    return [];
  }
}

async function searchOpenLibrary(query) {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    const normalized = normalizeTitle(query);
    const results = (data.docs || [])
      .filter(d => d.title && d.first_publish_year)
      .map(d => ({
        title: d.title,
        year: d.first_publish_year,
        author: d.author_name?.[0] || null,
        coverImage: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
        normalizedTitle: normalizeTitle(d.title),
      }));

    const startsWithQuery = results.filter(r => r.normalizedTitle.startsWith(normalized)).sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));
    const others = results.filter(r => !r.normalizedTitle.startsWith(normalized)).sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));

    return [...startsWithQuery, ...others].map(({ normalizedTitle, ...rest }) => rest).slice(0, 5);
  } catch (e) {
    console.error('Open Library search error:', e);
    return [];
  }
}

export default function TmdbSearch({ value, onChange, type, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const search = debounce(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const results = type === 'movie' ? await searchTmdb(query) : await searchOpenLibrary(query);
    setSuggestions(results);
    setLoading(false);
  }, 500);

  useEffect(() => {
    search(value);
  }, [value, type]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectSuggestion(suggestion) {
    onChange(suggestion.title);
    onSelect(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  }

  return (
    <div className="mdb-tmdb-search-container" ref={containerRef}>
      <input
        type="text"
        className="mdb-form-input"
        placeholder="e.g. The Shawshank Redemption"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => value && suggestions.length > 0 && setShowSuggestions(true)}
        autoComplete="off"
      />
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="mdb-tmdb-suggestions">
          {loading && <div className="mdb-tmdb-loading">Searching...</div>}
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="mdb-tmdb-suggestion-item"
              onClick={() => handleSelectSuggestion(s)}
            >
              {s.coverImage && (
                <img src={s.coverImage} alt={s.title} className="mdb-tmdb-suggestion-cover" />
              )}
              <div className="mdb-tmdb-suggestion-text">
                <div className="mdb-tmdb-suggestion-title">{s.title}</div>
                {type === 'book' && s.author && (
                  <div className="mdb-tmdb-suggestion-author">by {s.author}</div>
                )}
                {type === 'movie' && (
                  <div className="mdb-tmdb-suggestion-year">{s.year}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
