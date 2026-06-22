import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMymdbCelebs } from './MymdbApp';
import CelebQuickAddModal from './MymdbCelebQuickAdd';

function CelebCard({ celeb, onClick }) {
  return (
    <article
      className="mdb-card mdb-celeb-card"
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0}
      role="button"
      aria-label={`View ${celeb.name}`}
    >
      <div className="mdb-card-cover">
        {celeb.profileImage ? (
          <img src={celeb.profileImage} alt={celeb.name} loading="lazy" />
        ) : (
          <div className="mdb-card-cover-placeholder mdb-celeb-cover-placeholder">
            {celeb.name.charAt(0).toUpperCase()}
            <span>celeb</span>
          </div>
        )}
        {celeb.knownForDepartment && (
          <div className="mdb-card-badge">
            <span className="mdb-badge mdb-badge-celeb">{celeb.knownForDepartment}</span>
          </div>
        )}
      </div>
      <div className="mdb-card-body">
        <div className="mdb-card-title">{celeb.name}</div>
        {celeb.pinnedWork ? (
          <div className="mdb-card-meta mdb-celeb-pinned-meta">
            {celeb.pinnedWork.title}
            {celeb.pinnedWork.year ? ` (${celeb.pinnedWork.year})` : ''}
            {celeb.pinnedWork.character ? ` · ${celeb.pinnedWork.character}` : ''}
          </div>
        ) : celeb.knownFor?.length > 0 ? (
          <div className="mdb-card-meta">
            {celeb.knownFor.slice(0, 2).map(k => k.title).join(', ')}
          </div>
        ) : null}
        {celeb.birthday && (
          <div className="mdb-card-footer">
            <span className="mdb-card-meta">Born {celeb.birthday.slice(0, 4)}</span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function MymdbCelebs() {
  const navigate = useNavigate();
  const [search,       setSearch]       = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { celebs, celebsLoading } = useMymdbCelebs();

  const visible = useMemo(() => {
    let list = celebs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.knownFor || []).some(k => k.title.toLowerCase().includes(q)) ||
        (c.knownForDepartment || '').toLowerCase().includes(q)
      );
    }
    // gender===2 (explicitly male) → dateAdded order at the bottom
    // everyone else (female, unknown, non-binary) → age order, oldest first
    const byAge = list
      .filter(c => c.gender !== 2)
      .sort((a, b) => {
        if (!a.birthday && !b.birthday) return 0;
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return a.birthday.localeCompare(b.birthday);
      });
    const men = list
      .filter(c => c.gender === 2)
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
    return [...byAge, ...men];
  }, [celebs, search]);

  if (celebsLoading) return <div className="mdb-loading-screen">Loading celebs…</div>;

  return (
    <>
      <div className="mdb-list-header">
        <div className="mdb-list-header-top">
          <h1>Fav Celebs</h1>
          <div className="mdb-quickadd-btns">
            <button className="mdb-quickadd-btn" onClick={() => setShowQuickAdd(true)}>
              Quick-add Celeb
            </button>
          </div>
        </div>
        <div className="mdb-controls">
          <div className="mdb-search-wrap">
            <span className="mdb-search-icon">🔍</span>
            <input
              type="search"
              className="mdb-search-input"
              placeholder="Search names, movies, shows…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {celebs.length === 0 ? (
        <div className="mdb-empty-state" style={{ gridColumn: '1/-1' }}>
          <div className="mdb-empty-state-icon">⭐</div>
          <h3>No celebs yet</h3>
          <p>Start tracking your favorite celebrities.</p>
          <button className="mdb-btn mdb-btn-primary" onClick={() => navigate('/mymdb/celebs/add')}>
            + Add your first celeb
          </button>
        </div>
      ) : (
        <>
          <div className="mdb-card-grid">
            {visible.map(c => (
              <CelebCard key={c.id} celeb={c} onClick={() => navigate(`/mymdb/celebs/${c.id}`)} />
            ))}
          </div>
          {visible.length === 0 && (
            <div className="mdb-empty-state">
              <div className="mdb-empty-state-icon">🔍</div>
              <h3>No results</h3>
              <p>Try a different search or filter.</p>
            </div>
          )}
        </>
      )}

      {showQuickAdd && <CelebQuickAddModal onClose={() => setShowQuickAdd(false)} />}
    </>
  );
}
