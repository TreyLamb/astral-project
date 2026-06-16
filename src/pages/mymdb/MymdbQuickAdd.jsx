import { useState } from 'react';
import TmdbSearch from './TmdbSearch';
import { useToast, useMymdbData } from './MymdbApp';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

async function fetchMovieDetails(movieTitle, movieYear) {
  if (!TMDB_API_KEY) return {};
  try {
    const searchRes = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}`
    );
    const searchData = await searchRes.json();
    const movie = searchData.results?.find(r => new Date(r.release_date).getFullYear() === movieYear);
    if (!movie) return {};
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`
    );
    const credits = await detailRes.json();
    const director = credits.crew?.find(c => c.job === 'Director')?.name || null;
    const castList = credits.cast?.slice(0, 5).map(c => ({
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    })) || [];
    return { director, castList };
  } catch {
    return {};
  }
}

function StarInput({ onChange, disabled }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="mdb-star-input" role="group" aria-label="Rating out of 5">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          className={`mdb-star-input-star${hovered != null && n <= hovered ? ' lit' : ''}`}
          onMouseEnter={() => !disabled && setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => !disabled && onChange(n)}
          disabled={disabled}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );
}

export default function QuickAddModal({ type, onClose }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const showToast = useToast();
  const { addItem } = useMymdbData();

  async function handleSelect(suggestion) {
    setFetching(true);
    let data = { ...suggestion };
    if (type === 'movie' && suggestion.year) {
      const details = await fetchMovieDetails(suggestion.title, suggestion.year);
      data = { ...data, ...details };
    }
    setSelected(data);
    setFetching(false);
  }

  async function handleSave(rating) {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await addItem({
        type,
        title: selected.title,
        year: selected.year || null,
        coverImage: selected.coverImage || null,
        director: selected.director || null,
        author: selected.author || null,
        cast: selected.castList || [],
        genre: '',
        notes: '',
        status: 'completed',
        dateCompleted: new Date().toISOString().slice(0, 10),
        rating: rating ?? null,
        additionalImages: [],
      });
      showToast(`"${selected.title}" added!`, 'success');
      onClose();
    } catch {
      showToast('Failed to save', 'error');
      setSaving(false);
    }
  }

  return (
    <div className="mdb-quickadd-overlay" onClick={onClose}>
      <div className="mdb-quickadd-modal" onClick={e => e.stopPropagation()}>
        <div className="mdb-quickadd-header">
          <h3>{type === 'movie' ? '🎬 Quick-add Movie' : '📚 Quick-add Book'}</h3>
          <button className="mdb-quickadd-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {fetching ? (
          <div className="mdb-quickadd-status">Fetching details…</div>
        ) : !selected ? (
          <div className="mdb-quickadd-search">
            <p className="mdb-quickadd-hint">
              Search for a {type === 'movie' ? 'movie' : 'book'} title
            </p>
            <TmdbSearch
              value={query}
              onChange={setQuery}
              type={type}
              onSelect={handleSelect}
            />
          </div>
        ) : saving ? (
          <div className="mdb-quickadd-status">Saving…</div>
        ) : (
          <div className="mdb-quickadd-rate">
            <div className="mdb-quickadd-selected">
              {selected.coverImage && (
                <img src={selected.coverImage} alt={selected.title} className="mdb-quickadd-cover" />
              )}
              <div className="mdb-quickadd-info">
                <div className="mdb-quickadd-title">{selected.title}</div>
                <div className="mdb-quickadd-meta">
                  {[selected.year, selected.director, selected.author].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>

            <p className="mdb-quickadd-rate-label">Rate it:</p>
            <StarInput onChange={handleSave} disabled={saving} />
            <button
              type="button"
              className="mdb-quickadd-skip"
              onClick={() => handleSave(null)}
            >
              Save without rating
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
