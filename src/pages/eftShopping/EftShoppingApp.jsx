import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

import { EftContext } from './eftContext';
import { loadEftData, fetchLivePrices } from './eftApi';
import { GAME_MODES } from './eftNormalize';
import { read, write, DEFAULTS } from './eftStorage';
import { addToList } from './eftListLogic';
import { fmtAgo } from './EftBits';

import HideoutView from './views/HideoutView';
import ShoppingListView from './views/ShoppingListView';
import BuildOrderView from './views/BuildOrderView';
import StationView from './views/StationView';
import WatchlistView from './views/WatchlistView';
import FoodTierView from './views/FoodTierView';
import RaidKitView from './views/RaidKitView';
import AmmoView from './views/AmmoView';
import FrugalView from './views/FrugalView';
import LootCalcView from './views/LootCalcView';
import SettingsView from './views/SettingsView';
import MapView from './views/MapView';
import CraftTreeView from './views/CraftTreeView';
import ItemUsesView from './views/ItemUsesView';
import Boundary from '../../components/errors/Boundary';

import './EftShopping.css';
import HubLink from '../../components/HubLink';

const ROOT = '/EFTsh';

const TABS = [
  { to: '', label: 'Hideout/Quest' },
  { to: '/map', label: 'Map' },
  { to: '/crafts', label: 'Craft Tree' },
  { to: '/uses', label: 'Item Uses' },
  { to: '/list', label: 'Shopping List' },
  { to: '/order', label: 'Build Order' },
  { to: '/watchlist', label: 'Buy Below' },
  { to: '/food', label: 'Food/Slot' },
  { to: '/raid', label: 'Raid Kit' },
  { to: '/ammo', label: 'Ammo' },
  { to: '/frugal', label: 'Frugal' },
  { to: '/loot', label: 'Loot Calc' },
  { to: '/settings', label: 'Settings' },
  // Live flea prices are the one thing no free source exposes (tarkov.dev is
  // the only open API and it is unreliable; tarkov-market encrypts its browser
  // payload and gates its real API behind a key). Until that changes, the
  // honest move is to send you straight there rather than fake it in-app.
  { href: 'https://tarkov-market.com/', label: 'Flea Prices ↗' },
];

// Every persisted slice, held in one state object so a single generic
// `update(key, value)` can serve all of them. Twelve near-identical
// useState/useEffect pairs would be the alternative.
const SLICES = Object.keys(DEFAULTS);

export default function EftShoppingApp() {
  const location = useLocation();

  const [store, setStore] = useState(() =>
    Object.fromEntries(SLICES.map((k) => [k, read(k)])));

  const [status, setStatus] = useState({
    data: null, source: 'game-files', generatedAt: 0, pricesFetchedAt: null,
    gaps: [], loading: true, priceError: null, pricesLoading: false,
  });

  // The map page's tab row starts folded — see webdesign.md §2. The shell does
  // not unmount when you move between EFT tabs, so this has to be closed on
  // navigation too: otherwise opening it on the map, clicking a tab and coming
  // back leaves the row still showing.
  const [chromeOpen, setChromeOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const update = useCallback((name, value) => {
    setStore((prev) => {
      const next = typeof value === 'function' ? value(prev[name]) : value;
      write(name, next);
      return { ...prev, [name]: next };
    });
  }, []);

  const reloadStore = useCallback(() => {
    setStore(Object.fromEntries(SLICES.map((k) => [k, read(k)])));
  }, []);

  const gameMode = store.prefs.gameMode;

  const load = useCallback(async (mode) => {
    const result = await loadEftData(mode);
    setStatus((s) => ({ ...s, ...result, loading: false }));
    return result;
  }, []);

  // No network on load. The snapshot is local and complete, so the hideout is
  // interactive on the first frame.
  useEffect(() => {
    let cancelled = false;
    setStatus((s) => ({ ...s, loading: true }));
    loadEftData(gameMode).then((result) => {
      if (cancelled) return;
      setStatus((s) => ({ ...s, ...result, loading: false, priceError: null }));
    });
    return () => { cancelled = true; };
  }, [gameMode]);

  const refreshPrices = useCallback(async () => {
    setStatus((s) => ({ ...s, pricesLoading: true, priceError: null }));
    const result = await fetchLivePrices(gameMode);
    if (result.ok) {
      await load(gameMode);
      setStatus((s) => ({ ...s, pricesLoading: false, priceError: null }));
      showToast(`Prices updated — ${result.count} items`);
    } else {
      setStatus((s) => ({ ...s, pricesLoading: false, priceError: result.error }));
      showToast('tarkov.dev unreachable — prices unchanged');
    }
  }, [gameMode, load, showToast]);

  const data = status.data;

  const stations = useMemo(() => {
    const list = data?.stations ? [...data.stations] : [];
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const items = data?.items || {};

  // One flag every price-dependent view reads, rather than each one re-deriving
  // "do we have prices?" from the data source.
  const hasPrices = useMemo(
    () => Object.values(items).some((i) => i.avg24hPrice != null || i.fleaBuy?.price != null),
    [items],
  );

  // Lives here rather than in the list view because the whole point is that any
  // view showing an item can push to the list — a table row on Frugal, a tile
  // on the shopping grid, a hideout search hit.
  const addToShoppingList = useCallback((entry, which = 'ongoing') => {
    update('myList', (prev) => ({
      ...prev,
      [which]: addToList(prev?.[which], { need: 1, ...entry }),
    }));
    showToast(`${entry.name} → ${which === 'raid' ? 'this raid' : which === 'value' ? 'value list' : 'ongoing list'}`);
  }, [update, showToast]);

  const value = useMemo(() => ({
    ...store,
    update,
    addToShoppingList,
    reloadStore,
    data,
    stations,
    items,
    traders: data?.traders || [],
    ammoStats: data?.ammo || [],
    provisions: data?.provisions || [],
    status: { ...status, hasPrices },
    hasPrices,
    gameMode,
    setGameMode: (mode) => update('prefs', (p) => ({ ...p, gameMode: mode })),
    setPref: (key, val) => update('prefs', (p) => ({ ...p, [key]: val })),
    refresh: refreshPrices,
    refreshPrices,
    showToast,
  }), [store, update, addToShoppingList, reloadStore, data, stations, items, status, hasPrices, gameMode, refreshPrices, showToast]);

  const active = (tab) => {
    const path = `${ROOT}${tab.to}`;
    if (tab.to === '') return location.pathname === ROOT || location.pathname === `${ROOT}/`;
    return location.pathname.startsWith(path);
  };

  const dotClass = hasPrices ? '' : 'eft-is-stale';

  // The map is a full-viewport working surface, so it gets none of the standard
  // chrome by default: no site navbar (see Navbar.jsx FULLSCREEN_ROUTES), no
  // topbar, no banner, and a tab row that stays folded until asked for.
  // webdesign.md §1–§3.
  const isMap = location.pathname.startsWith(`${ROOT}/map`);

  return (
    <EftContext.Provider value={value}>
      <div className={`eft-app${isMap ? ' eft-is-full' : ''}`}>
        <div className={`eft-shell${isMap ? ' eft-is-full' : ''}`}>
          {isMap ? (
            <div className="eft-mapbar">
              <Link to="/" className="eft-hublink" title="Back to Astral Hub">⚡ Astral Hub</Link>
              <button
                type="button"
                className={`eft-btn eft-btn-sm${chromeOpen ? ' eft-is-on' : ''}`}
                onClick={() => setChromeOpen((o) => !o)}
                aria-expanded={chromeOpen}
                title="Show the EFT Shopping tabs"
              >
                {chromeOpen ? '✕ Menu' : '☰ Menu'}
              </button>
              <span className="eft-mapbar-title">EFT Shopping · Map</span>
            </div>
          ) : (
          <header className="eft-topbar">
            <HubLink className="eft-site-home" />
            <div className="eft-brand">
              <h1>EFT Shopping</h1>
              <span>hideout &amp; raid companion</span>
            </div>

            <div className="eft-modeswitch" role="group" aria-label="Game mode">
              {GAME_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={gameMode === m.id}
                  title={m.blurb}
                  onClick={() => value.setGameMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="eft-status">
              <span className={`eft-status-dot ${dotClass}`} />
              <span title={`Hideout data built from the game files ${fmtAgo(status.generatedAt)}`}>
                {status.loading ? 'loading'
                  : hasPrices ? `prices ${fmtAgo(status.pricesFetchedAt)}` : 'no prices'}
              </span>
            </div>

            <button
              type="button"
              className="eft-btn eft-btn-sm"
              onClick={refreshPrices}
              disabled={status.pricesLoading}
              title="Fetch live flea and trader prices from tarkov.dev. Hideout data is local and never depends on this."
            >
              {status.pricesLoading ? 'Fetching…' : 'Get prices'}
            </button>
          </header>
          )}

          {!isMap && !hasPrices && !status.loading ? (
            <div className="eft-banner">
              <strong>No prices loaded.</strong> Hideout requirements come from the game files and are
              complete — costs are the only thing missing. Hit <strong>Get prices</strong> to pull live
              flea and trader prices from tarkov.dev.
              {status.priceError ? ` Last attempt failed: ${status.priceError}` : ''}
            </div>
          ) : null}

          {!isMap && hasPrices && status.priceError && !status.pricesLoading ? (
            <div className="eft-banner eft-is-error">
              <strong>Price refresh failed.</strong> {status.priceError} — showing the last prices
              fetched {fmtAgo(status.pricesFetchedAt)}.
            </div>
          ) : null}

          {!isMap || chromeOpen ? (
          <nav className={`eft-tabs${isMap ? ' eft-is-float' : ''}`}>
            {TABS.map((tab) => (tab.href ? (
              <a
                key={tab.href}
                href={tab.href}
                target="_blank"
                rel="noreferrer"
                className="eft-tab"
                title="Opens tarkov-market.com in a new tab"
              >
                {tab.label}
              </a>
            ) : (
              <Link
                key={tab.to}
                to={`${ROOT}${tab.to}`}
                className={`eft-tab${active(tab) ? ' eft-is-active' : ''}`}
                onClick={() => setChromeOpen(false)}
              >
                {tab.label}
              </Link>
            )))}
          </nav>
          ) : null}

          <Routes>
            <Route index element={<HideoutView />} />
            {/* Wrapped after the 2026-08-17 outage: one throw inside Leaflet
                (`_leaflet_pos`, before the first setView) unmounted the entire
                site. A map that cannot draw should cost you the map, not the
                tool around it. */}
            <Route path="map" element={<Boundary title="The map stopped working."><MapView /></Boundary>} />
            <Route path="crafts" element={<CraftTreeView />} />
            <Route path="uses" element={<ItemUsesView />} />
            <Route path="list" element={<ShoppingListView />} />
            <Route path="order" element={<BuildOrderView />} />
            <Route path="station/:stationKey" element={<StationView />} />
            <Route path="watchlist" element={<WatchlistView />} />
            <Route path="food" element={<FoodTierView />} />
            <Route path="raid" element={<RaidKitView />} />
            <Route path="ammo" element={<AmmoView />} />
            <Route path="frugal" element={<FrugalView />} />
            <Route path="loot" element={<LootCalcView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="*" element={<HideoutView />} />
          </Routes>
        </div>

        {toast ? <div className="eft-toast">{toast}</div> : null}
      </div>
    </EftContext.Provider>
  );
}
