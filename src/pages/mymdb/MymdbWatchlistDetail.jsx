import { useParams, useNavigate } from 'react-router-dom';
import { useToast, useMymdbWatchlist } from './MymdbApp';

export default function MymdbWatchlistDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const showToast  = useToast();
  const { getWatchlistItem, removeWatchlistItem, updateWatchlistItem } = useMymdbWatchlist();

  const item = getWatchlistItem(id);

  if (!item) {
    return (
      <div className="mdb-detail-page">
        <button className="mdb-back-btn" onClick={() => navigate('/mymdb/watchlist')}>← Back to Watchlist</button>
        <div className="mdb-empty-state">
          <div className="mdb-empty-state-icon">❓</div>
          <h3>Not found</h3>
          <p>This item may have been removed.</p>
        </div>
      </div>
    );
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${item.title}" from your watchlist?`)) return;
    await removeWatchlistItem(item.id);
    showToast('Removed from watchlist', 'success');
    navigate('/mymdb/watchlist');
  }

  async function handleTogglePriority() {
    await updateWatchlistItem(item.id, { priority: !item.priority });
  }

  function handleMoveToLibrary() {
    navigate('/mymdb/add', {
      state: {
        prefill: {
          title:      item.title,
          year:       item.year,
          genre:      item.genre,
          notes:      item.notes,
          coverImage: item.coverImage,
          type:       'movie',
          status:     'plan',
        },
        fromWatchlistId: item.id,
      },
    });
  }

  return (
    <div className="mdb-detail-page">
      <div className="mdb-detail-topbar">
        <button className="mdb-back-btn" onClick={() => navigate('/mymdb/watchlist')}>
          ← Back to Watchlist
        </button>
        <div className="mdb-detail-actions">
          <button className="mdb-btn mdb-btn-secondary" onClick={() => navigate(`/mymdb/watchlist/edit/${item.id}`)}>
            Edit
          </button>
          <button className="mdb-btn mdb-btn-danger" onClick={handleDelete}>
            Remove
          </button>
        </div>
      </div>

      <div className="mdb-detail-layout">
        <div className="mdb-detail-sidebar">
          {item.coverImage ? (
            <img src={item.coverImage} alt={item.title} className="mdb-detail-cover" />
          ) : (
            <div className="mdb-detail-cover-placeholder mdb-watchlist-cover-placeholder">
              🎬
            </div>
          )}

          <button
            className={`mdb-priority-toggle${item.priority ? ' active' : ''}`}
            style={{ marginTop: 12, width: '100%' }}
            onClick={handleTogglePriority}
          >
            ⚑ {item.priority ? 'Priority' : 'Mark as priority'}
          </button>

          <button
            className="mdb-btn mdb-btn-primary"
            style={{ marginTop: 8, width: '100%' }}
            onClick={handleMoveToLibrary}
          >
            ✓ Move to Library
          </button>
        </div>

        <div className="mdb-detail-content">
          <div className="mdb-detail-badges">
            {item.priority && <span className="mdb-badge mdb-badge-watchlist-priority">⚑ Priority</span>}
          </div>

          <h1 className="mdb-detail-title">{item.title}</h1>

          <div className="mdb-detail-meta-row">
            {item.year  && <span className="mdb-detail-meta-chip">{item.year}</span>}
            {item.genre && <span className="mdb-detail-meta-chip">{item.genre}</span>}
            <span className="mdb-detail-meta-chip mdb-chip-faint">Added {item.dateAdded}</span>
          </div>

          {item.notes && (
            <div className="mdb-detail-section">
              <div className="mdb-detail-section-label">Notes</div>
              <p className="mdb-detail-notes">{item.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
