import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coverGradient, formatDate, readFileAsDataUrl, getYouTubeId } from './mymdbUtils';
import { useToast, useMymdbData } from './MymdbApp';

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

function Lightbox({ src, onClose }) {
  return (
    <div className="mdb-lightbox" onClick={onClose}>
      <img src={src} alt="Full-size" />
    </div>
  );
}

export default function MymdbDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const { getItem, updateItem, removeItem } = useMymdbData();
  const item = getItem(id);

  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false);
  const galleryUploadRef = useRef(null);

  if (!item) {
    navigate('/mymdb', { replace: true });
    return null;
  }

  const gradient = coverGradient(item.title);

  const meta = [
    { label: 'Type',   value: item.type === 'movie' ? '🎬 Movie' : '📚 Book' },
    { label: 'Status', value: { plan: 'Plan to Watch / Read', 'in-progress': 'In Progress', completed: 'Completed' }[item.status] },
    item.year      && { label: 'Year',    value: item.year },
    item.genre     && { label: 'Genre',   value: item.genre },
    item.type === 'movie' && item.director && { label: 'Director', value: item.director },
    item.type === 'book'  && item.author   && { label: 'Author',   value: item.author },
    item.dateAdded     && { label: 'Date Added',     value: formatDate(item.dateAdded) },
    item.dateCompleted && { label: 'Date Completed', value: formatDate(item.dateCompleted) },
  ].filter(Boolean);

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    await removeItem(item.id);
    showToast('Item deleted');
    navigate('/mymdb', { replace: true });
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    await updateItem(item.id, { coverImage: dataUrl });
    showToast('Cover updated', 'success');
  }

  async function handleGalleryAdd(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newUrls = await Promise.all(files.map(readFileAsDataUrl));
    const updated = [...(item.additionalImages || []), ...newUrls];
    await updateItem(item.id, { additionalImages: updated });
    showToast(`${files.length} image${files.length > 1 ? 's' : ''} added`, 'success');
    e.target.value = '';
  }

  async function handleGalleryUrlAdd() {
    const url = galleryUrlInput.trim();
    if (!url) return;
    const updated = [...(item.additionalImages || []), url];
    await updateItem(item.id, { additionalImages: updated });
    setGalleryUrlInput('');
    setShowGalleryUrlInput(false);
    showToast('Image added', 'success');
  }

  return (
    <>
      <button className="mdb-back-btn" onClick={() => navigate(-1)}>
        <span className="mdb-back-btn-arrow">←</span>
        Back to Library
      </button>

      <div className="mdb-detail-layout">
        {/* Left: cover + gallery */}
        <div className="mdb-detail-cover-col">
          <div className="mdb-detail-cover">
            {(() => {
              if (!item.coverImage) return (
                <div className="mdb-detail-cover-placeholder" style={{ background: gradient }}>
                  {item.title.charAt(0).toUpperCase()}
                </div>
              );
              const ytId = getYouTubeId(item.coverImage);
              if (ytId) return (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  className="mdb-detail-cover-yt"
                  allowFullScreen
                  title={`${item.title} video`}
                />
              );
              return <img src={item.coverImage} alt={`${item.title} cover`} />;
            })()}
          </div>

          <label className="mdb-cover-change-label">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
            📷 Change cover (file)
          </label>

          <div className="mdb-detail-section">
            <div className="mdb-detail-section-title">Images</div>
            <div className="mdb-image-gallery">
              {(item.additionalImages || []).map((src, i) => (
                <div
                  key={i}
                  className="mdb-gallery-img"
                  onClick={() => setLightboxSrc(src)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightboxSrc(src); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt={`Additional image ${i + 1}`} loading="lazy" />
                </div>
              ))}
              {showGalleryUrlInput ? (
                <div className="mdb-gallery-url-input">
                  <input
                    type="text"
                    placeholder="Paste image URL…"
                    value={galleryUrlInput}
                    onChange={e => setGalleryUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleGalleryUrlAdd(); if (e.key === 'Escape') setShowGalleryUrlInput(false); }}
                    autoFocus
                  />
                  <button type="button" onClick={handleGalleryUrlAdd}>Add</button>
                  <button type="button" onClick={() => { setShowGalleryUrlInput(false); setGalleryUrlInput(''); }}>✕</button>
                  <button type="button" className="mdb-gallery-file-btn" onClick={() => galleryUploadRef.current?.click()}>📁 file</button>
                </div>
              ) : (
                <button
                  className="mdb-gallery-add-btn"
                  onClick={() => setShowGalleryUrlInput(true)}
                >+</button>
              )}
              <input
                ref={galleryUploadRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleGalleryAdd}
              />
            </div>
          </div>
        </div>

        {/* Right: info */}
        <div className="mdb-detail-info-col">
          <div className="mdb-detail-header">
            <div className="mdb-detail-title-group">
              <h1 className="mdb-detail-title">{item.title}</h1>
              <div className="mdb-detail-badges">
                <span className={`mdb-badge mdb-badge-${item.type}`}>
                  {item.type === 'movie' ? '🎬 Movie' : '📚 Book'}
                </span>
                <span className={`mdb-badge mdb-badge-${item.status}`}>
                  {{ plan: 'Plan to Watch', 'in-progress': 'In Progress', completed: 'Completed' }[item.status]}
                </span>
              </div>
            </div>
            <div className="mdb-detail-actions">
              <button className="mdb-btn mdb-btn-secondary" onClick={() => navigate(`/mymdb/edit/${item.id}`)}>
                Edit
              </button>
              <button className="mdb-btn mdb-btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>

          {item.rating != null && (
            <div className="mdb-detail-rating">
              <Stars rating={item.rating} />
              <span className="mdb-detail-rating-text">{item.rating} / 5</span>
            </div>
          )}

          <div className="mdb-detail-meta-grid">
            {meta.map(f => (
              <div key={f.label} className="mdb-meta-item">
                <div className="mdb-meta-label">{f.label}</div>
                <div className="mdb-meta-value">{String(f.value)}</div>
              </div>
            ))}
          </div>

          <div className="mdb-detail-section">
            <div className="mdb-detail-section-title">Notes &amp; Review</div>
            <div className="mdb-detail-notes">
              {item.notes
                ? item.notes
                : <span className="mdb-detail-notes-empty">No notes yet — edit this item to add your thoughts.</span>
              }
            </div>
          </div>
        </div>
      </div>

      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
