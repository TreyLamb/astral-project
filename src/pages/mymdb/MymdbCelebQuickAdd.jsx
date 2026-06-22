import { useState } from 'react';
import CelebSearch from './CelebSearch';
import { fetchCelebDetails } from './mymdbCelebUtils';
import { useToast, useMymdbCelebs } from './MymdbApp';

export default function CelebQuickAddModal({ onClose }) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const showToast = useToast();
  const { addCeleb } = useMymdbCelebs();

  async function handleSelect(suggestion) {
    setFetching(true);
    const details = await fetchCelebDetails(suggestion.tmdbId);
    setSelected({ ...suggestion, ...details });
    setFetching(false);
  }

  async function handleSave() {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await addCeleb({
        tmdbId: selected.tmdbId,
        name: selected.name,
        gender: selected.gender ?? null,
        profileImage: selected.profileImage || null,
        knownForDepartment: selected.knownForDepartment || '',
        biography: selected.biography || '',
        birthday: selected.birthday || null,
        deathday: selected.deathday || null,
        placeOfBirth: selected.placeOfBirth || null,
        alsoKnownAs: selected.alsoKnownAs || [],
        knownFor: selected.knownFor || [],
        imdbId: selected.imdbId || null,
        notes: '',
      });
      showToast(`${selected.name} added!`, 'success');
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
          <h3>⭐ Quick-add Celebrity</h3>
          <button className="mdb-quickadd-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {fetching ? (
          <div className="mdb-quickadd-status">Fetching details…</div>
        ) : !selected ? (
          <div className="mdb-quickadd-search">
            <p className="mdb-quickadd-hint">Search for a celebrity</p>
            <CelebSearch value={query} onChange={setQuery} onSelect={handleSelect} />
          </div>
        ) : saving ? (
          <div className="mdb-quickadd-status">Saving…</div>
        ) : (
          <div className="mdb-quickadd-rate">
            <div className="mdb-quickadd-selected">
              {selected.profileImage ? (
                <img src={selected.profileImage} alt={selected.name} className="mdb-quickadd-cover mdb-celeb-quickadd-cover" />
              ) : (
                <div className="mdb-celeb-placeholder-sm">{selected.name.charAt(0)}</div>
              )}
              <div className="mdb-quickadd-info">
                <div className="mdb-quickadd-title">{selected.name}</div>
                <div className="mdb-quickadd-meta">
                  {[
                    selected.knownForDepartment,
                    selected.birthday?.slice(0, 4),
                    selected.placeOfBirth,
                  ].filter(Boolean).join(' · ')}
                </div>
                {selected.knownFor?.length > 0 && (
                  <div className="mdb-quickadd-meta" style={{ marginTop: '4px' }}>
                    Known for: {selected.knownFor.slice(0, 3).map(k => k.title).join(', ')}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="mdb-btn mdb-btn-primary mdb-celeb-save-btn"
              onClick={handleSave}
            >
              Add to Fav Celebs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
