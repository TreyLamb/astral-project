import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Storage } from './mymdbStorage';
import { coverGradient, formatDate, readFileAsDataUrl } from './mymdbUtils';
import { useToast } from './MymdbApp';

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

  const [item, setItem] = useState(() => Storage.getById(id));
  const [lightboxSrc, setLightboxSrc] = useState(null);
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

  function handleDelete() {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    Storage.remove(item.id);
    showToast('Item deleted');
    navigate('/mymdb', { replace: true });
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    Storage.update(item.id, { coverImage: dataUrl });
    setItem(prev => ({ ...prev, coverImage: dataUrl }));
    showToast('Cover updated', 'success');
  }

  async function handleGalleryAdd(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newUrls = await Promise.all(files.map(readFileAsDataUrl));
    const updated = [...(item.additionalImages || []), ...newUrls];
    Storage.update(item.id, { additionalImages: updated });
    setItem(prev => ({ ...prev, additionalImages: updated }));
    showToast(`${files.length} image${files.length > 1 ? 's' : ''} added`, 'success');
    e.target.value = '';
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
            {item.coverImage
              ? <img src={item.coverImage} alt={`${item.title} cover`} />
              : (
                <div className="mdb-detail-cover-placeholder" style={{ background: gradient }}>
                  {item.title.charAt(0).toUpperCase()}
                </div>
              )
            }
          </div>

          <label className="mdb-cover-change-label">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
            📷 Change cover
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
              <button
                className="mdb-gallery-add-btn"
                onClick={() => galleryUploadRef.current?.click()}
              >+</button>
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
