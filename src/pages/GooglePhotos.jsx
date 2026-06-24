import { useEffect, useMemo, useState } from 'react';
import './GooglePhotos.css';

const API_ORIGIN = import.meta.env.VITE_PHOTOS_API_HOST || '';
const API_PREFIX = API_ORIGIN || '';

function GooglePhotos() {
  const [authorized, setAuthorized] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [photos, setPhotos] = useState([]);
  const [pageToken, setPageToken] = useState(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [dragSelecting, setDragSelecting] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState(null);
  const [dragEndIndex, setDragEndIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const api = useMemo(() => ({
    get: async (path) => {
      const res = await fetch(`${API_PREFIX}/api${path}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    post: async (path, body) => {
      const res = await fetch(`${API_PREFIX}/api${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  }), [API_PREFIX]);

  const selectedRange = useMemo(() => {
    if (dragStartIndex === null || dragEndIndex === null) return null;
    const start = Math.min(dragStartIndex, dragEndIndex);
    const end = Math.max(dragStartIndex, dragEndIndex);
    return { start, end };
  }, [dragStartIndex, dragEndIndex]);

  const isInDragRange = (index) => {
    if (!selectedRange) return false;
    return index >= selectedRange.start && index <= selectedRange.end;
  };

  useEffect(() => {
    async function checkStatus() {
      setStatusLoading(true);
      try {
        const data = await api.get('/status');
        setAuthorized(data.authorized);
      } catch (err) {
        setErrorMessage('Unable to reach backend. Start the Flask server and refresh.');
      } finally {
        setStatusLoading(false);
      }
    }

    checkStatus();
  }, [api]);

  useEffect(() => {
    if (!authorized) return;
    loadAlbums();
    loadPhotos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, selectedAlbum, dateFrom, dateTo]);

  const loadAlbums = async () => {
    try {
      const data = await api.get('/albums');
      setAlbums([{ id: 'all', title: 'All photos' }, ...data.albums]);
      setSelectedAlbum((current) => (current === 'all' ? 'all' : current));
    } catch (err) {
      setErrorMessage('Unable to load albums.');
    }
  };

  const loadPhotos = async (reset = false) => {
    if (loadingPhotos) return;
    setLoadingPhotos(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams();
      params.set('pageSize', '36');
      if (!reset && pageToken) params.set('pageToken', pageToken);
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);
      if (selectedAlbum && selectedAlbum !== 'all') params.set('albumId', selectedAlbum);
      const data = await api.get(`/photos?${params.toString()}`);
      setPageToken(data.nextPageToken || null);
      setPhotos((prev) => (reset ? data.mediaItems : [...prev, ...(data.mediaItems || [])]));
    } catch (err) {
      setErrorMessage('Unable to load photos.');
    } finally {
      setLoadingPhotos(false);
    }
  };

  const onPhotoClick = (photoId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const onPhotoMouseDown = (index) => {
    setDragSelecting(true);
    setDragStartIndex(index);
    setDragEndIndex(index);
  };

  const onPhotoMouseEnter = (index) => {
    if (!dragSelecting) return;
    setDragEndIndex(index);
  };

  const onMouseUp = () => {
    if (!dragSelecting || selectedRange === null) {
      setDragSelecting(false);
      return;
    }

    const newIds = photos.slice(selectedRange.start, selectedRange.end + 1).map((item) => item.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
    setDragSelecting(false);
    setDragStartIndex(null);
    setDragEndIndex(null);
  };

  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) return;
    try {
      await api.post('/albums/create', { title: newAlbumTitle.trim() });
      setNewAlbumTitle('');
      loadAlbums();
    } catch (err) {
      setErrorMessage('Unable to create album.');
    }
  };

  const addSelectedToAlbum = async () => {
    if (!selectedAlbum || selectedAlbum === 'all' || selectedIds.size === 0) return;
    try {
      await api.post('/albums/add', {
        albumId: selectedAlbum,
        mediaItemIds: Array.from(selectedIds),
      });
      setErrorMessage(`Added ${selectedIds.size} photos to album.`);
      setSelectedIds(new Set());
    } catch (err) {
      setErrorMessage('Unable to add photos to album.');
    }
  };

  const authUrl = `${API_PREFIX}/api/auth/url`;

  return (
    <div className="gp-container" onMouseUp={onMouseUp}>
      <header className="gp-topbar">
        <div>
          <h1>Google Photos Sorter</h1>
          <p>Browse your library, filter by date, and move selected photos into albums.</p>
        </div>
        {statusLoading ? (
          <div className="gp-status">Checking auth...</div>
        ) : authorized ? (
          <div className="gp-status authorized">Connected</div>
        ) : (
          <a className="gp-button primary" href={authUrl}>Connect Google Photos</a>
        )}
      </header>

      {errorMessage ? <div className="gp-error">{errorMessage}</div> : null}

      {!authorized ? (
        <div className="gp-auth-hint">
          Open the backend and authenticate once with your Google account. Then return to this page.
        </div>
      ) : (
        <div className="gp-main-grid">
          <aside className="gp-sidebar">
            <div className="gp-panel">
              <h2>Albums</h2>
              <select
                className="gp-select"
                value={selectedAlbum}
                onChange={(event) => {
                  setSelectedAlbum(event.target.value);
                  setPageToken(null);
                  setPhotos([]);
                }}
              >
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>{album.title}</option>
                ))}
              </select>

              <div className="gp-action-row">
                <button className="gp-button secondary" onClick={addSelectedToAlbum} disabled={selectedAlbum === 'all' || selectedIds.size === 0}>
                  Add selected to album
                </button>
              </div>

              <div className="gp-divider" />

              <h3>Create album</h3>
              <input
                className="gp-input"
                placeholder="New album title"
                value={newAlbumTitle}
                onChange={(event) => setNewAlbumTitle(event.target.value)}
              />
              <button className="gp-button" onClick={createAlbum} disabled={!newAlbumTitle.trim()}>
                Create album
              </button>
            </div>
          </aside>

          <section className="gp-content">
            <div className="gp-filters">
              <div className="gp-filter-group">
                <label>From</label>
                <input type="date" className="gp-input" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </div>
              <div className="gp-filter-group">
                <label>To</label>
                <input type="date" className="gp-input" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </div>
              <button
                className="gp-button secondary"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPageToken(null);
                  setPhotos([]);
                }}
              >
                Clear filters
              </button>
              <div className="gp-filter-meta">Selected: {selectedIds.size}</div>
            </div>

            <div className="gp-grid">
              {photos.map((photo, index) => {
                const selected = selectedIds.has(photo.id);
                const previewUrl = `${photo.baseUrl}=w400-h400-c`;
                return (
                  <button
                    type="button"
                    key={photo.id}
                    className={`gp-photo-card ${selected ? 'selected' : ''} ${isInDragRange(index) ? 'dragging' : ''}`}
                    onClick={() => onPhotoClick(photo.id)}
                    onMouseDown={() => onPhotoMouseDown(index)}
                    onMouseEnter={() => onPhotoMouseEnter(index)}
                  >
                    <img src={previewUrl} alt={photo.filename || 'photo'} />
                    <div className="gp-photo-meta">
                      <div>{photo.filename || 'Photo'}</div>
                      <div>{photo.mediaMetadata?.creationTime?.slice(0, 10) || ''}</div>
                    </div>
                    {selected ? <span className="gp-checkmark">✓</span> : null}
                  </button>
                );
              })}
            </div>

            <div className="gp-footer-row">
              {pageToken ? (
                <button className="gp-button" onClick={() => loadPhotos(false)} disabled={loadingPhotos}>
                  {loadingPhotos ? 'Loading…' : 'Load more'}
                </button>
              ) : (
                <div className="gp-note">No more photos to load.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default GooglePhotos;
