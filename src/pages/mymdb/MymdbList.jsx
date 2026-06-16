import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMymdbData } from './MymdbApp';
import { coverGradient } from './mymdbUtils';
import QuickAddModal from './MymdbQuickAdd';

function Stars({ rating }) {
  if (rating == null) return <span className="mdb-stars" title="No rating">—</span>;
  return (
    <span className="mdb-stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= rating ? 'mdb-star-filled' : ''}>★</span>
      ))}
    </span>
  );
}

function TypeBadge({ type }) {
  const label = type === 'movie' ? '🎬 Movie' : '📚 Book';
  return <span className={`mdb-badge mdb-badge-${type}`}>{label}</span>;
}

function StatusBadge({ status }) {
  const labels = { plan: 'Plan to Watch', 'in-progress': 'In Progress', completed: 'Completed' };
  return <span className={`mdb-badge mdb-badge-${status}`}>{labels[status] || status}</span>;
}

function Card({ item, onClick }) {
  const gradient = coverGradient(item.title);
  const meta = item.type === 'movie'
    ? [item.director, item.year].filter(Boolean).join(' · ')
    : [item.author,   item.year].filter(Boolean).join(' · ');

  return (
    <article
      className="mdb-card"
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0}
      role="button"
      aria-label={`View ${item.title}`}
    >
      <div className="mdb-card-cover">
        {item.coverImage
          ? <img src={item.coverImage} alt={`${item.title} cover`} loading="lazy" />
          : (
            <div className="mdb-card-cover-placeholder" style={{ background: gradient }}>
              {item.title.charAt(0).toUpperCase()}
              <span>{item.type}</span>
            </div>
          )
        }
        <div className="mdb-card-badge"><TypeBadge type={item.type} /></div>
      </div>
      <div className="mdb-card-body">
        <div className="mdb-card-title">{item.title}</div>
        {meta && <div className="mdb-card-meta">{meta}</div>}
        <div className="mdb-card-footer">
          <span className="mdb-card-stars"><Stars rating={item.rating} /></span>
          <StatusBadge status={item.status} />
        </div>
      </div>
    </article>
  );
}

export default function MymdbList() {
  const navigate = useNavigate();
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [sort,         setSort]         = useState('newest');
  const [quickAddType, setQuickAddType] = useState(null);

  const { items: allItems, loading } = useMymdbData();

  const visible = useMemo(() => {
    let items = allItems;

    if (filter !== 'all') items = items.filter(i => i.type === filter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(i => {
        const hay = [i.title, i.director, i.author, i.genre, String(i.year || '')].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    const sorted = [...items];
    switch (sort) {
      case 'title':  sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'oldest': sorted.sort((a, b) => a.dateAdded.localeCompare(b.dateAdded)); break;
      case 'rating': sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case 'year':   sorted.sort((a, b) => (b.year ?? 0) - (a.year ?? 0)); break;
      default:       sorted.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    }
    return sorted;
  }, [allItems.length, filter, search, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const movies    = allItems.filter(i => i.type === 'movie').length;
  const books     = allItems.filter(i => i.type === 'book').length;
  const completed = allItems.filter(i => i.status === 'completed').length;

  if (loading) return <div className="mdb-loading-screen">Loading your library…</div>;

  return (
    <>
      <div className="mdb-list-header">
        <div className="mdb-list-header-top">
          <h1>My Library</h1>
          <div className="mdb-quickadd-btns">
            <button className="mdb-quickadd-btn" onClick={() => setQuickAddType('movie')}>
              Quick-add Movie
            </button>
            <button className="mdb-quickadd-btn" onClick={() => setQuickAddType('book')}>
              Quick-add Book
            </button>
          </div>
        </div>
        <div className="mdb-controls">
          <div className="mdb-search-wrap">
            <span className="mdb-search-icon">🔍</span>
            <input
              type="search"
              className="mdb-search-input"
              placeholder="Search titles, people, genres…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="mdb-filter-tabs" role="tablist" aria-label="Filter by type">
            {['all','movie','book'].map(f => (
              <button
                key={f}
                className={`mdb-filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                role="tab"
                aria-selected={filter === f}
              >
                {f === 'all' ? 'All' : f === 'movie' ? '🎬 Movies' : '📚 Books'}
              </button>
            ))}
          </div>

          <select
            className="mdb-sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
            aria-label="Sort by"
          >
            <option value="newest">Newest Added</option>
            <option value="oldest">Oldest Added</option>
            <option value="title">A – Z</option>
            <option value="rating">Top Rated</option>
            <option value="year">By Year</option>
          </select>
        </div>
      </div>

      <div className="mdb-stats-row">
        <div className="mdb-stat-pill"><strong>{allItems.length}</strong> total</div>
        <div className="mdb-stat-pill"><strong>{movies}</strong> movies</div>
        <div className="mdb-stat-pill"><strong>{books}</strong> books</div>
        <div className="mdb-stat-pill"><strong>{completed}</strong> completed</div>
      </div>

      {allItems.length === 0 ? (
        <div className="mdb-empty-state" style={{ gridColumn: '1/-1' }}>
          <div className="mdb-empty-state-icon">📽️</div>
          <h3>Your library is empty</h3>
          <p>Start tracking movies and books you love.</p>
          <button className="mdb-btn mdb-btn-primary" onClick={() => navigate('/mymdb/add')}>
            + Add your first item
          </button>
        </div>
      ) : (
        <>
          <div className="mdb-card-grid">
            {visible.map(item => (
              <Card key={item.id} item={item} onClick={() => navigate(`/mymdb/item/${item.id}`)} />
            ))}
          </div>
          {visible.length === 0 && (
            <div className="mdb-no-results">
              <div className="mdb-empty-state">
                <div className="mdb-empty-state-icon">🔍</div>
                <h3>No results</h3>
                <p>Try different search terms or a different filter.</p>
              </div>
            </div>
          )}
        </>
      )}

      {quickAddType && (
        <QuickAddModal type={quickAddType} onClose={() => setQuickAddType(null)} />
      )}
    </>
  );
}
