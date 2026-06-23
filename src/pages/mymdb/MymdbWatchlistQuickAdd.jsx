import { useState, useRef } from 'react';
import TmdbSearch from './TmdbSearch';
import { useToast, useMymdbWatchlist } from './MymdbApp';

export default function WatchlistQuickAddModal({ onClose }) {
  const [title,   setTitle]   = useState('');
  const [picked,  setPicked]  = useState(null); // { title, year, coverImage }
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const showToast = useToast();
  const { addWatchlistItem } = useMymdbWatchlist();
  const notesRef = useRef(null);

  function handleSelect(suggestion) {
    setPicked(suggestion);
    setTimeout(() => notesRef.current?.focus(), 50);
  }

  async function handleSave() {
    if (!picked || saving) return;
    setSaving(true);
    try {
      await addWatchlistItem({
        title:      picked.title,
        year:       picked.year   || null,
        genre:      '',
        notes:      notes.trim(),
        priority:   false,
        coverImage: picked.coverImage || null,
      });
      showToast(`"${picked.title}" added to watchlist!`, 'success');
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
          <h3>🎬 Add to Watchlist</h3>
          <button className="mdb-quickadd-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!picked ? (
          <div className="mdb-quickadd-search">
            <p className="mdb-quickadd-hint">Search for a movie or show</p>
            <TmdbSearch
              value={title}
              onChange={setTitle}
              type="movie"
              onSelect={handleSelect}
            />
          </div>
        ) : saving ? (
          <div className="mdb-quickadd-status">Saving…</div>
        ) : (
          <div className="mdb-quickadd-rate">
            <div className="mdb-quickadd-selected">
              {picked.coverImage ? (
                <img src={picked.coverImage} alt={picked.title} className="mdb-quickadd-cover" />
              ) : (
                <div className="mdb-watchlist-placeholder-sm">🎬</div>
              )}
              <div className="mdb-quickadd-info">
                <div className="mdb-quickadd-title">{picked.title}</div>
                {picked.year && <div className="mdb-quickadd-meta">{picked.year}</div>}
              </div>
            </div>

            <textarea
              ref={notesRef}
              className="mdb-form-textarea mdb-quickadd-notes"
              placeholder="Add a note… (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />

            <div className="mdb-quickadd-footer-btns">
              <button
                type="button"
                className="mdb-btn mdb-btn-secondary"
                onClick={() => { setPicked(null); setNotes(''); }}
              >
                ← Back
              </button>
              <button
                type="button"
                className="mdb-btn mdb-btn-primary"
                onClick={handleSave}
              >
                Add to Watchlist
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
