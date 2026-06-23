import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { readFileAsDataUrl, getYouTubeId } from './mymdbUtils';
import { useToast, useMymdbWatchlist } from './MymdbApp';
import TmdbSearch from './TmdbSearch';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

async function fetchMovieCover(title, year) {
  if (!TMDB_API_KEY) return null;
  try {
    const res  = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await res.json();
    const movie = data.results?.find(r => !year || new Date(r.release_date).getFullYear() === year)
                  ?? data.results?.[0];
    return movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
  } catch { return null; }
}

export default function MymdbWatchlistForm() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { getWatchlistItem, addWatchlistItem, updateWatchlistItem } = useMymdbWatchlist();

  const editItem = editId ? getWatchlistItem(editId) : null;

  const [title,        setTitle]        = useState(editItem?.title       ?? '');
  const [year,         setYear]         = useState(editItem?.year        ?? '');
  const [genre,        setGenre]        = useState(editItem?.genre       ?? '');
  const [notes,        setNotes]        = useState(editItem?.notes       ?? '');
  const [priority,     setPriority]     = useState(editItem?.priority    ?? false);
  const [coverSrc,     setCoverSrc]     = useState(editItem?.coverImage  ?? '');
  const [coverUrlInput, setCoverUrlInput] = useState(editItem?.coverImage ?? '');

  const coverInputRef = useRef(null);

  async function setCoverFromFile(file) {
    if (file.size > 5 * 1024 * 1024) { showToast('Image too large (max 5 MB)', 'error'); return; }
    const dataUrl = await readFileAsDataUrl(file);
    setCoverSrc(dataUrl);
    setCoverUrlInput('');
  }

  function handleCoverUrlChange(e) {
    const val = e.target.value;
    setCoverUrlInput(val);
    setCoverSrc(val);
  }

  async function handleTmdbSelect(suggestion) {
    if (suggestion.year) setYear(suggestion.year);
    if (suggestion.coverImage && !coverSrc) {
      setCoverSrc(suggestion.coverImage);
      setCoverUrlInput(suggestion.coverImage);
    } else if (!coverSrc) {
      const poster = await fetchMovieCover(suggestion.title, suggestion.year);
      if (poster) { setCoverSrc(poster); setCoverUrlInput(poster); }
    }
  }

  function goBack() {
    if (editItem) navigate(`/mymdb/watchlist/${editItem.id}`);
    else          navigate('/mymdb/watchlist');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { showToast('Please enter a title', 'error'); return; }

    const data = {
      title:      title.trim(),
      year:       Number(year) || null,
      genre:      genre.trim(),
      notes:      notes.trim(),
      priority,
      coverImage: coverSrc || null,
    };

    if (editItem) {
      await updateWatchlistItem(editItem.id, data);
      showToast('Updated!', 'success');
      navigate(`/mymdb/watchlist/${editItem.id}`);
    } else {
      const saved = await addWatchlistItem(data);
      showToast('Added to your watchlist!', 'success');
      navigate(`/mymdb/watchlist/${saved.id}`);
    }
  }

  return (
    <div className="mdb-form-page">
      <button className="mdb-back-btn" onClick={goBack}>
        <span className="mdb-back-btn-arrow">←</span>
        {editItem ? 'Back to item' : 'Back to Watchlist'}
      </button>

      <h1>{editItem ? 'Edit Watchlist Item' : 'Add to Watchlist'}</h1>
      <p className="mdb-form-subtitle">
        {editItem ? `Editing "${editItem.title}"` : 'Queue up something to watch.'}
      </p>

      <div className="mdb-form-card">
        <form onSubmit={handleSubmit} noValidate>

          {/* Title */}
          <div className="mdb-form-group">
            <label className="mdb-form-label" htmlFor="mdb-wl-title">
              Title <span className="mdb-required">*</span>
            </label>
            <TmdbSearch
              value={title}
              onChange={setTitle}
              type="movie"
              onSelect={handleTmdbSelect}
            />
          </div>

          {/* Cover */}
          <div className="mdb-form-group">
            <label className="mdb-form-label" htmlFor="mdb-wl-cover">Cover Image or YouTube URL</label>
            <input
              id="mdb-wl-cover"
              type="text"
              className="mdb-form-input"
              placeholder="Paste image URL or YouTube link…"
              value={coverUrlInput}
              onChange={handleCoverUrlChange}
              autoComplete="off"
            />
            {coverSrc && !coverSrc.startsWith('data:') && (
              <div className="mdb-cover-url-preview">
                {getYouTubeId(coverSrc) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(coverSrc)}`}
                    className="mdb-cover-yt-preview"
                    allowFullScreen
                    title="Cover preview"
                  />
                ) : (
                  <img src={coverSrc} className="mdb-cover-preview" alt="Cover preview" />
                )}
              </div>
            )}
            <div className="mdb-cover-upload-fallback">
              <span>or </span>
              <button type="button" className="mdb-cover-upload-link" onClick={() => coverInputRef.current?.click()}>
                upload an image file
              </button>
              {coverSrc?.startsWith('data:') && <span className="mdb-cover-file-set"> ✓ file selected</span>}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async e => { const f = e.target.files[0]; if (f) await setCoverFromFile(f); }}
            />
          </div>

          {/* Year + Genre */}
          <div className="mdb-form-row">
            <div className="mdb-form-group" style={{ marginBottom: 0 }}>
              <label className="mdb-form-label" htmlFor="mdb-wl-year">Year</label>
              <input
                id="mdb-wl-year"
                type="number"
                className="mdb-form-input"
                placeholder="e.g. 2024"
                value={year}
                onChange={e => setYear(e.target.value)}
                min="1900" max="2099"
              />
            </div>
            <div className="mdb-form-group" style={{ marginBottom: 0 }}>
              <label className="mdb-form-label" htmlFor="mdb-wl-genre">Genre</label>
              <input
                id="mdb-wl-genre"
                type="text"
                className="mdb-form-input"
                placeholder="e.g. Thriller, Sci-Fi"
                value={genre}
                onChange={e => setGenre(e.target.value)}
              />
            </div>
          </div>

          {/* Priority toggle */}
          <div className="mdb-form-group">
            <label className="mdb-form-label">Priority</label>
            <button
              type="button"
              className={`mdb-priority-toggle${priority ? ' active' : ''}`}
              onClick={() => setPriority(p => !p)}
            >
              ⚑ {priority ? 'Priority — watch soon' : 'Mark as priority'}
            </button>
          </div>

          {/* Notes */}
          <div className="mdb-form-group">
            <label className="mdb-form-label" htmlFor="mdb-wl-notes">Notes</label>
            <textarea
              id="mdb-wl-notes"
              className="mdb-form-textarea"
              placeholder="Why you want to watch it, who recommended it…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="mdb-form-actions">
            <button type="button" className="mdb-btn mdb-btn-secondary" onClick={goBack}>
              Cancel
            </button>
            <button type="submit" className="mdb-btn mdb-btn-primary">
              {editItem ? '💾 Save Changes' : '+ Add to Watchlist'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
