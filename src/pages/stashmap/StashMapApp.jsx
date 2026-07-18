import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { StashmapStorage } from './stashmapStorage';
import { StashMapContext } from './stashmapContext';
import InventoryView from './InventoryView';
import MapView from './MapView';
import LayoutView from './LayoutView';
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

  const updateSettings = useCallback((updates) => {
    const updated = StashmapStorage.updateSettings(updates);
    setSettings(updated);
    return updated;
  }, []);

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

  if (loading || !settings) {
    return <div className="stash-loading">Loading…</div>;
  }

  const contextValue = {
    rooms,
    zones,
    items,
    settings,
    selectedItemId,
    focusToken,
    toast,
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
      updateSettings,
      focusItemOnMap,
      clearFocus,
    },
  };

  return (
    <StashMapContext.Provider value={contextValue}>
      <div className="stash-app">
        <header className="stash-header">
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

        <main className="stash-main">
          <Routes>
            <Route index element={<InventoryView />} />
            <Route path="map" element={<MapView />} />
            <Route path="layout" element={<LayoutView />} />
            <Route path="*" element={<Navigate to="/stashmap" replace />} />
          </Routes>
        </main>

        {toast && <div className={`stash-toast${toast.type ? ' ' + toast.type : ''}`}>{toast.message}</div>}
      </div>
    </StashMapContext.Provider>
  );
}
