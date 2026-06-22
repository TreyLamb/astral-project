import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast, useMymdbCelebs } from './MymdbApp';

function getAge(birthday, deathday) {
  if (!birthday) return null;
  const end   = deathday ? new Date(deathday) : new Date();
  const start = new Date(birthday);
  let age = end.getFullYear() - start.getFullYear();
  const m = end.getMonth() - start.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < start.getDate())) age--;
  return age;
}

export default function MymdbCelebDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { getCeleb, updateCeleb, removeCeleb } = useMymdbCelebs();
  const celeb = getCeleb(id);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal,     setNotesVal]     = useState('');
  const [bioExpanded,  setBioExpanded]  = useState(false);

  if (!celeb) {
    navigate('/mymdb/celebs', { replace: true });
    return null;
  }

  const age = getAge(celeb.birthday, celeb.deathday);

  async function handleDelete() {
    if (!confirm(`Remove "${celeb.name}" from your Fav Celebs? This cannot be undone.`)) return;
    await removeCeleb(celeb.id);
    showToast(`${celeb.name} removed`);
    navigate('/mymdb/celebs', { replace: true });
  }

  async function handleSaveNotes() {
    await updateCeleb(celeb.id, { notes: notesVal });
    setEditingNotes(false);
    showToast('Notes saved', 'success');
  }

  async function handlePinWork(item) {
    const isAlreadyPinned = celeb.pinnedWork?.title === item.title;
    const newPinned = isAlreadyPinned ? null : item;
    await updateCeleb(celeb.id, { pinnedWork: newPinned });
    showToast(newPinned ? `Featured: ${item.title}` : 'Feature cleared', 'success');
  }

  const metaItems = [
    celeb.birthday && {
      label: celeb.deathday ? 'Born / Died' : 'Birthday',
      value: celeb.deathday
        ? `${celeb.birthday} – ${celeb.deathday}${age != null ? ` (age ${age})` : ''}`
        : `${celeb.birthday}${age != null ? ` (age ${age})` : ''}`,
    },
  ].filter(Boolean);

  return (
    <>
      <button className="mdb-back-btn" onClick={() => navigate('/mymdb/celebs')}>
        <span className="mdb-back-btn-arrow">←</span>
        Back to Celebs
      </button>

      <div className="mdb-detail-layout">
        {/* Left: portrait + also known as */}
        <div className="mdb-detail-cover-col">
          <div className="mdb-detail-cover mdb-celeb-detail-cover">
            {celeb.profileImage ? (
              <img src={celeb.profileImage} alt={celeb.name} />
            ) : (
              <div className="mdb-detail-cover-placeholder mdb-celeb-cover-placeholder">
                {celeb.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {celeb.alsoKnownAs?.length > 0 && (
            <div className="mdb-detail-section">
              <div className="mdb-detail-section-title">Also Known As</div>
              <div className="mdb-celeb-aka-list">
                {celeb.alsoKnownAs.map((name, i) => (
                  <div key={i} className="mdb-celeb-aka-item">{name}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: info */}
        <div className="mdb-detail-info-col">
          <div className="mdb-detail-header">
            <div className="mdb-detail-title-group">
              <h1 className="mdb-detail-title">{celeb.name}</h1>
              <div className="mdb-detail-badges">
                {celeb.knownForDepartment && (
                  <span className="mdb-badge mdb-badge-celeb">{celeb.knownForDepartment}</span>
                )}
                {celeb.deathday && (
                  <span className="mdb-badge mdb-badge-plan">Deceased</span>
                )}
              </div>
            </div>
            <div className="mdb-detail-actions">
              <button className="mdb-btn mdb-btn-secondary" onClick={() => navigate(`/mymdb/celebs/edit/${celeb.id}`)}>
                Edit
              </button>
              <button className="mdb-btn mdb-btn-danger" onClick={handleDelete}>
                Remove
              </button>
            </div>
          </div>

          {metaItems.length > 0 && (
            <div className="mdb-detail-meta-grid">
              {metaItems.map(f => (
                <div key={f.label} className="mdb-meta-item">
                  <div className="mdb-meta-label">{f.label}</div>
                  <div className="mdb-meta-value">{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Known For — clickable to pin as featured work on library card */}
          {celeb.knownFor?.length > 0 && (
            <div className="mdb-detail-section">
              <div className="mdb-detail-section-title">
                Known For
                <span className="mdb-celeb-pin-hint">click to feature in library</span>
              </div>
              <div className="mdb-celeb-known-grid">
                {celeb.knownFor.map((item, i) => {
                  const isPinned = celeb.pinnedWork?.title === item.title;
                  return (
                    <div
                      key={i}
                      className={`mdb-celeb-known-item${isPinned ? ' pinned' : ''}`}
                      onClick={() => handlePinWork(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handlePinWork(item); }}
                      aria-pressed={isPinned}
                    >
                      <div className="mdb-celeb-known-type">{item.type === 'tv' ? '📺' : '🎬'}</div>
                      <div>
                        <div className="mdb-celeb-known-title">{item.title}</div>
                        <div className="mdb-celeb-known-meta">
                          {[item.year, item.character].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {isPinned && <div className="mdb-celeb-known-pin">★</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Biography — collapsed by default */}
          {celeb.biography && (
            <div className="mdb-detail-section">
              <div
                className="mdb-detail-section-title mdb-celeb-bio-toggle"
                onClick={() => setBioExpanded(v => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setBioExpanded(v => !v); }}
              >
                Biography
                <span className="mdb-celeb-bio-arrow">{bioExpanded ? '▲' : '▼'}</span>
              </div>
              {bioExpanded && (
                <div className="mdb-celeb-bio">{celeb.biography}</div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="mdb-detail-section">
            <div className="mdb-detail-section-title">My Notes</div>
            {editingNotes ? (
              <>
                <textarea
                  className="mdb-form-textarea"
                  value={notesVal}
                  onChange={e => setNotesVal(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="mdb-btn mdb-btn-primary" onClick={handleSaveNotes}>Save</button>
                  <button className="mdb-btn mdb-btn-secondary" onClick={() => setEditingNotes(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <div
                className="mdb-detail-notes"
                onClick={() => { setNotesVal(celeb.notes || ''); setEditingNotes(true); }}
                style={{ cursor: 'pointer' }}
              >
                {celeb.notes
                  ? celeb.notes
                  : <span className="mdb-detail-notes-empty">No notes yet — click to add.</span>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
