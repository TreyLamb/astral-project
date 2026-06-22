import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast, useMymdbCelebs } from './MymdbApp';
import { fetchCelebDetails } from './mymdbCelebUtils';
import CelebSearch from './CelebSearch';

export default function MymdbCelebForm() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { getCeleb, addCeleb, updateCeleb } = useMymdbCelebs();
  const editCeleb = editId ? getCeleb(editId) : null;

  const [query,      setQuery]      = useState('');
  const [selected,   setSelected]   = useState(null);
  const [fetching,   setFetching]   = useState(false);
  const [notes,      setNotes]      = useState(editCeleb?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSelect(suggestion) {
    setFetching(true);
    const details = await fetchCelebDetails(suggestion.tmdbId);
    setSelected({ ...suggestion, ...details });
    setFetching(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editCeleb && !selected) return;
    setSubmitting(true);
    try {
      if (editCeleb) {
        await updateCeleb(editCeleb.id, { notes });
        showToast('Notes saved', 'success');
        navigate(`/mymdb/celebs/${editCeleb.id}`);
      } else {
        const saved = await addCeleb({
          tmdbId:             selected.tmdbId,
          name:               selected.name,
          gender:             selected.gender ?? null,
          profileImage:       selected.profileImage || null,
          knownForDepartment: selected.knownForDepartment || '',
          biography:          selected.biography || '',
          birthday:           selected.birthday || null,
          deathday:           selected.deathday || null,
          placeOfBirth:       selected.placeOfBirth || null,
          alsoKnownAs:        selected.alsoKnownAs || [],
          knownFor:           selected.knownFor || [],
          imdbId:             selected.imdbId || null,
          notes,
        });
        showToast(`${selected.name} added!`, 'success');
        navigate(`/mymdb/celebs/${saved.id}`);
      }
    } catch {
      showToast('Something went wrong', 'error');
      setSubmitting(false);
    }
  }

  const preview = editCeleb || selected;

  return (
    <>
      <button
        className="mdb-back-btn"
        onClick={() => navigate(editCeleb ? `/mymdb/celebs/${editCeleb.id}` : '/mymdb/celebs')}
      >
        <span className="mdb-back-btn-arrow">←</span>
        {editCeleb ? 'Back to Celeb' : 'Back to Celebs'}
      </button>

      <div className="mdb-form-page">
        <h1>{editCeleb ? `Edit — ${editCeleb.name}` : 'Add Celebrity'}</h1>
        <p className="mdb-form-subtitle">
          {editCeleb
            ? 'Update your notes for this celebrity.'
            : 'Search for a celebrity to pull their info from TMDB.'}
        </p>

        <div className="mdb-form-card">
          <form onSubmit={handleSubmit} noValidate>

            {!editCeleb && (
              fetching ? (
                <div className="mdb-quickadd-status" style={{ padding: '16px 0' }}>
                  Fetching details from TMDB…
                </div>
              ) : !selected ? (
                <div className="mdb-form-group">
                  <label className="mdb-form-label">
                    Search celebrity <span className="mdb-required">*</span>
                  </label>
                  <CelebSearch value={query} onChange={setQuery} onSelect={handleSelect} />
                </div>
              ) : null
            )}

            {preview && (
              <div className="mdb-celeb-form-preview">
                {preview.profileImage && (
                  <img src={preview.profileImage} alt={preview.name} className="mdb-celeb-form-img" />
                )}
                <div className="mdb-celeb-form-preview-info">
                  <div className="mdb-celeb-form-preview-name">{preview.name}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {preview.knownForDepartment && (
                      <span className="mdb-badge mdb-badge-celeb">{preview.knownForDepartment}</span>
                    )}
                  </div>
                  <div className="mdb-quickadd-meta" style={{ marginTop: '6px' }}>
                    {[preview.birthday, preview.placeOfBirth].filter(Boolean).join(' · ')}
                  </div>
                  {preview.knownFor?.length > 0 && (
                    <div className="mdb-quickadd-meta">
                      Known for: {preview.knownFor.slice(0, 3).map(k => k.title).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mdb-form-group">
              <label className="mdb-form-label" htmlFor="celeb-notes">Notes</label>
              <textarea
                id="celeb-notes"
                className="mdb-form-textarea"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Your personal notes about this celebrity…"
                rows={4}
              />
            </div>

            <div className="mdb-form-actions">
              <button
                type="button"
                className="mdb-btn mdb-btn-secondary"
                onClick={() => navigate(editCeleb ? `/mymdb/celebs/${editCeleb.id}` : '/mymdb/celebs')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="mdb-btn mdb-btn-primary"
                disabled={submitting || (!editCeleb && !selected) || fetching}
              >
                {submitting ? 'Saving…' : editCeleb ? '💾 Save Notes' : '+ Add Celebrity'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
