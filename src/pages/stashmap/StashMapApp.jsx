import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StashmapStorage } from './stashmapStorage';
import { StashMapContext } from './stashmapContext';
import {
  computeDuplicates, toggleSignatureIgnore, toggleItemIgnore, toggleCategoryIgnore,
  addIgnorePattern, removeIgnorePattern,
} from './stashmapDuplicates';
import InventoryView from './InventoryView';
import MapView from './MapView';
import LayoutView from './LayoutView';
import DuplicatesPanel from './DuplicatesPanel';
import './StashMap.css';

const TABS = [
  { to: '/stashmap', label: 'Inventory', match: (p) => p === '/stashmap' },
  { to: '/stashmap/map', label: 'Map', match: (p) => p.startsWith('/stashmap/map') },
  { to: '/stashmap/layout', label: 'Layout', match: (p) => p.startsWith('/stashmap/layout') },
];

export default function StashMapApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [zones, setZones] = useState([]);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState(null);
  // Bumped on every focusItemOnMap call so MapView's frame-into-place effect
  // re-fires even when the same item is focused twice in a row (selectedItemId
  // alone wouldn't change in that case).
  const [focusToken, setFocusToken] = useState(0);
  const [toast, setToast] = useState(null);
  const [dupeIgnore, setDupeIgnoreState] = useState(null);
  // { open, signature } — signature focuses the panel on one group when it's
  // opened from a row flag rather than from the header badge.
  const [dupePanel, setDupePanel] = useState({ open: false, signature: null });
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = '') => {
    setToast({ message, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    StashmapStorage.seed();
    setRooms(StashmapStorage.getRooms());
    setZones(StashmapStorage.getZones());
    setItems(StashmapStorage.getItems());
    setSettings(StashmapStorage.getSettings());
    setDupeIgnoreState(StashmapStorage.getDupeIgnore());
    setLoading(false);
  }, []);

  const addRoom = useCallback((room) => {
    const newRoom = StashmapStorage.addRoom(room);
    setRooms((prev) => [...prev, newRoom]);
    showToast(`Added room "${newRoom.name}"`);
    return newRoom;
  }, [showToast]);

  const updateRoom = useCallback((id, updates) => {
    const updated = StashmapStorage.updateRoom(id, updates);
    if (updated) setRooms((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const removeRoom = useCallback((id) => {
    StashmapStorage.removeRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setZones((prev) => prev.filter((z) => z.roomId !== id));
    setItems((prev) => prev.map((item) => (
      item.roomId === id ? { ...item, roomId: null, zoneId: null, cell: null } : item
    )));
    showToast('Room removed');
  }, [showToast]);

  const addZone = useCallback((zone) => {
    const newZone = StashmapStorage.addZone(zone);
    setZones((prev) => [...prev, newZone]);
    showToast(`Added zone "${newZone.name}"`);
    return newZone;
  }, [showToast]);

  const updateZone = useCallback((id, updates) => {
    const updated = StashmapStorage.updateZone(id, updates);
    if (updated) setZones((prev) => prev.map((z) => (z.id === id ? updated : z)));
    return updated;
  }, []);

  const removeZone = useCallback((id) => {
    StashmapStorage.removeZone(id);
    setZones((prev) => prev.filter((z) => z.id !== id));
    setItems((prev) => prev.map((item) => (
      item.zoneId === id ? { ...item, zoneId: null, cell: null } : item
    )));
    showToast('Zone removed');
  }, [showToast]);

  const addItem = useCallback((item) => {
    const newItem = StashmapStorage.addItem(item);
    setItems((prev) => [...prev, newItem]);
    showToast(`Added "${newItem.name}"`);
    return newItem;
  }, [showToast]);

  const updateItem = useCallback((id, updates) => {
    const updated = StashmapStorage.updateItem(id, updates);
    if (updated) setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }, []);

  const removeItem = useCallback((id) => {
    StashmapStorage.removeItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItemId((prev) => (prev === id ? null : prev));
    showToast('Item removed');
  }, [showToast]);

  const moveZoneToRoom = useCallback((zoneId, roomId, x, y) => {
    const updated = StashmapStorage.moveZoneToRoom(zoneId, roomId, x, y);
    if (!updated) return null;
    setZones((prev) => prev.map((z) => (z.id === zoneId ? updated : z)));
    setItems((prev) => prev.map((i) => (i.zoneId === zoneId ? { ...i, roomId } : i)));
    return updated;
  }, []);

  const updateSettings = useCallback((updates) => {
    const updated = StashmapStorage.updateSettings(updates);
    setSettings(updated);
    return updated;
  }, []);

  // Every "this is not an error" control in the app funnels through this one
  // setter with a pure reducer, so no call site has to know the ignore
  // object's shape or remember to persist it.
  const applyIgnore = useCallback((reducer, message) => {
    setDupeIgnoreState((prev) => StashmapStorage.setDupeIgnore(reducer(prev)));
    if (message) showToast(message);
  }, [showToast]);

  const dupeActions = useMemo(() => ({
    toggleGroup: (signature, label, nowIgnored) => applyIgnore(
      (prev) => toggleSignatureIgnore(prev, signature, label),
      nowIgnored ? `"${label}" flagged again` : `"${label}" marked not an error`,
    ),
    toggleItem: (item, nowIgnored) => applyIgnore(
      (prev) => toggleItemIgnore(prev, item.id, item.name),
      nowIgnored ? `"${item.name}" flagged again` : `"${item.name}" marked not an error`,
    ),
    toggleCategory: (category, nowIgnored) => applyIgnore(
      (prev) => toggleCategoryIgnore(prev, category),
      nowIgnored ? `"${category}" items flagged again` : `"${category}" items will never flag`,
    ),
    addPattern: (value, mode) => applyIgnore(
      (prev) => addIgnorePattern(prev, value, mode),
      `Rule added for "${value}"`,
    ),
    removePattern: (id) => applyIgnore((prev) => removeIgnorePattern(prev, id), 'Rule removed'),
  }), [applyIgnore]);

  const openDupePanel = useCallback((signature = null) => {
    setDupePanel({ open: true, signature });
  }, []);

  const closeDupePanel = useCallback(() => setDupePanel({ open: false, signature: null }), []);

  // Sets which item the Map view should frame/highlight, then navigates
  // there — centralized here (rather than in each caller) since both call
  // sites (inventory row breadcrumb, "show on map" button) need the exact
  // same two-step behavior.
  const focusItemOnMap = useCallback((itemId) => {
    setSelectedItemId(itemId);
    setFocusToken((n) => n + 1);
    navigate('/stashmap/map');
  }, [navigate]);

  const clearFocus = useCallback(() => setSelectedItemId(null), []);

  // O(n²) pair comparison, recomputed on any item or rule change. A household
  // inventory is hundreds of items, not millions — the memo is here so typing
  // in the search box doesn't redo it, not because the pass is expensive.
  const duplicates = useMemo(
    () => computeDuplicates(items, dupeIgnore),
    [items, dupeIgnore],
  );

  if (loading || !settings) {
    return <div className="stash-loading">Loading…</div>;
  }

  const isMapRoute = location.pathname.startsWith('/stashmap/map');

  const contextValue = {
    rooms,
    zones,
    items,
    settings,
    selectedItemId,
    focusToken,
    toast,
    duplicates,
    dupeIgnore,
    dupePanel,
    actions: {
      addRoom,
      updateRoom,
      removeRoom,
      addZone,
      updateZone,
      removeZone,
      addItem,
      updateItem,
      removeItem,
      moveZoneToRoom,
      updateSettings,
      focusItemOnMap,
      clearFocus,
      dupe: dupeActions,
      openDupePanel,
      closeDupePanel,
      showToast,
    },
  };

  return (
    <StashMapContext.Provider value={contextValue}>
      {/* The map is the one view that wants the whole browser window — a
          floor plan boxed into a 1100px column is unreadable. Inventory and
          Layout stay in the readable measure. */}
      <div className={`stash-app${isMapRoute ? ' stash-app-wide' : ''}`}>
        <header className="stash-header">
          {/* Anchored to the header rather than to any one view so the count is
              in the same place on Inventory, Map and Layout alike. */}
          <button
            type="button"
            className={`stash-dupe-bell${duplicates.badgeCount > 0 ? ' stash-dupe-bell-alert' : ''}`}
            onClick={() => openDupePanel()}
            aria-label={
              duplicates.badgeCount > 0
                ? `${duplicates.badgeCount} duplicate groups — open duplicates panel`
                : 'No duplicates — open duplicates panel'
            }
            title={
              duplicates.badgeCount > 0
                ? `${duplicates.badgeCount} duplicate group${duplicates.badgeCount === 1 ? '' : 's'} across ${duplicates.duplicateItemCount} items`
                : 'No duplicates flagged'
            }
          >
            <span className="stash-dupe-bell-icon" aria-hidden="true">📥</span>
            {duplicates.badgeCount > 0 && (
              <span className="stash-dupe-bell-count">
                {duplicates.badgeCount > 99 ? '99+' : duplicates.badgeCount}
              </span>
            )}
          </button>

          <h1 className="stash-title">StashMap</h1>
          <p className="stash-subtitle">Know where everything lives.</p>
          {/* div, not nav — Navbar.css styles the bare nav element globally */}
          <div className="stash-tabs">
            {TABS.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className={`stash-tab${tab.match(location.pathname) ? ' stash-tab-active' : ''}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </header>

        <main className={`stash-main${isMapRoute ? ' stash-main-wide' : ''}`}>
          <Routes>
            <Route index element={<InventoryView />} />
            <Route path="map" element={<MapView />} />
            <Route path="layout" element={<LayoutView />} />
            <Route path="*" element={<Navigate to="/stashmap" replace />} />
          </Routes>
        </main>

        {dupePanel.open && <DuplicatesPanel />}

        {toast && <div className={`stash-toast${toast.type ? ' ' + toast.type : ''}`}>{toast.message}</div>}
      </div>
    </StashMapContext.Provider>
  );
}
