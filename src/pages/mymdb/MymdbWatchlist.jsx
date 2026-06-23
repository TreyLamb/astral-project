import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMymdbWatchlist } from './MymdbApp';

function WatchlistCard({ item, onClick, onTogglePriority }) {
  return (
    <article
      className="mdb-card mdb-watchlist-card"
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0}
      role="button"
      aria-label={`View ${item.title}`}
    >
      <div className="mdb-card-cover">
        {item.coverImage ? (
          <img src={item.coverImage} alt={item.title} loading="lazy" />
        ) : (
          <div className="mdb-card-cover-placeholder mdb-watchlist-cover-placeholder">
            🎬
          </div>
        )}
        {item.priority && (
          <div className="mdb-card-badge">
            <span className="mdb-badge mdb-badge-watchlist-priority">⚑ Priority</span>
          </div>
        )}
        <button
          className={`mdb-watchlist-priority-btn${item.priority ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); onTogglePriority(item); }}
          title={item.priority ? 'Remove priority' : 'Mark as priority'}
          aria-label={item.priority ? 'Remove priority' : 'Mark as priority'}
        >
          ⚑
        </button>
      </div>
      <div className="mdb-card-body">
        <div className="mdb-card-title">{item.title}</div>
        <div className="mdb-card-meta">
          {[item.year, item.genre].filter(Boolean).join(' · ') || 'No details yet'}
        </div>
        {item.notes && (
          <div className="mdb-card-footer">
            <span className="mdb-card-meta mdb-watchlist-note-preview">{item.notes}</span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function MymdbWatchlist() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { watchlist, watchlistLoading, updateWatchlistItem } = useMymdbWatchlist();

  const visible = useMemo(() => {
    let list = watchlist;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item =>
        item.title.toLowerCase().includes(q) ||
        (item.genre || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [watchlist, search]);

  async function handleTogglePriority(item) {
    await updateWatchlistItem(item.id, { priority: !item.priority });
  }

  if (watchlistLoading) return <div className="mdb-loading-screen">Loading watchlist…</div>;

  return (
    <>
      <div className="mdb-list-header">
        <div className="mdb-list-header-top">
          <h1>To Watch</h1>
          <div className="mdb-quickadd-btns">
            <button className="mdb-quickadd-btn mdb-quickadd-btn-watchlist" onClick={() => navigate('/mymdb/watchlist/add')}>
              + Add Movie
            </button>
          </div>
        </div>
        <div className="mdb-controls">
          <div className="mdb-search-wrap">
            <span className="mdb-search-icon">🔍</span>
            <input
              type="search"
              className="mdb-search-input"
              placeholder="Search your watchlist…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="mdb-empty-state" style={{ gridColumn: '1/-1' }}>
          <div className="mdb-empty-state-icon">🎬</div>
          <h3>Nothing queued up</h3>
          <p>Start building your watchlist.</p>
          <button className="mdb-btn mdb-btn-primary" onClick={() => navigate('/mymdb/watchlist/add')}>
            + Add your first movie
          </button>
        </div>
      ) : (
        <>
          <div className="mdb-card-grid">
            {visible.map(item => (
              <WatchlistCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/mymdb/watchlist/${item.id}`)}
                onTogglePriority={handleTogglePriority}
              />
            ))}
          </div>
          {visible.length === 0 && (
            <div className="mdb-empty-state">
              <div className="mdb-empty-state-icon">🔍</div>
              <h3>No results</h3>
              <p>Try a different search.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
