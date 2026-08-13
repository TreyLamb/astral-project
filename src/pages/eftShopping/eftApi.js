// Data layer for EFT Shopping.
//
// The committed snapshot is the source of truth. It is generated from BSG's
// own game files (see scripts/fetchEftHideout.mjs), so hideout requirements
// are exactly what the game says and nothing at runtime can take them away —
// no network call on load, no spinner, no outage. A wipe means re-running the
// generator and committing the result.
//
// tarkov.dev is the one thing the game files can't provide: live flea and
// trader prices. That is layered on top, opt-in, and can never block or
// degrade the tool — if the fetch fails, the snapshot's own prices (whatever
// was available when it was generated) stay exactly as they were.

import { pricesQuery, normalizePrices } from './eftNormalize';

const ENDPOINT = 'https://api.tarkov.dev/graphql';

const priceKey = (mode) => `eftsh_prices_${mode}_v1`;

// tarkov.dev's item icons are on a separate CDN from the API worker and stay
// up independently. Deriving the URL from the id means icons render even when
// the API is unreachable, and keeps ~60 bytes x hundreds of items out of the
// snapshot.
export const itemIcon = (id) => `https://assets.tarkov.dev/${id}-icon.webp`;
export const itemImage = (id) => `https://assets.tarkov.dev/${id}-512.webp`;

let snapshotPromise = null;
function loadSnapshot() {
  // Dynamic import so Vite code-splits the JSON into its own chunk instead of
  // welding it onto the main bundle for every visitor to the site.
  if (!snapshotPromise) snapshotPromise = import('./data/hideoutSnapshot.json').then((m) => m.default);
  return snapshotPromise;
}

function readPriceOverlay(mode) {
  try {
    const raw = localStorage.getItem(priceKey(mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.prices ? parsed : null;
  } catch {
    return null;
  }
}

// Applied as a copy: the imported snapshot module object is shared across the
// whole session, so mutating it would leak one game mode's prices into the
// other.
function withPrices(snapshot, overlay) {
  if (!overlay) return snapshot;
  const items = {};
  for (const [id, item] of Object.entries(snapshot.items)) {
    items[id] = overlay.prices[id] ? { ...item, ...overlay.prices[id] } : item;
  }
  return { ...snapshot, items };
}

/**
 * @returns {Promise<{data, source:'game-files', generatedAt:number,
 *                    pricesFetchedAt:number|null, gaps:string[]}>}
 */
export async function loadEftData(mode) {
  const snapshot = await loadSnapshot();
  const overlay = readPriceOverlay(mode);
  return {
    data: withPrices(snapshot, overlay),
    source: snapshot.source || 'game-files',
    generatedAt: Date.parse(snapshot.generatedAt) || 0,
    pricesFetchedAt: overlay?.fetchedAt ?? (snapshot.enrichedAt ? Date.parse(snapshot.enrichedAt) : null),
    gaps: snapshot.gaps || [],
  };
}

/**
 * Opt-in live price refresh. Never throws — the caller gets a result object
 * either way, because a failed price fetch is a non-event for a tool whose
 * hideout data is already local and complete.
 *
 * @returns {Promise<{ok:boolean, count?:number, fetchedAt?:number, error?:string}>}
 */
export async function fetchLivePrices(mode) {
  try {
    const snapshot = await loadSnapshot();
    const ids = Object.keys(snapshot.items);
    if (!ids.length) return { ok: false, error: 'No items in the snapshot to price.' };

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: pricesQuery(mode, ids) }),
    });
    if (!res.ok) throw new Error(`tarkov.dev returned HTTP ${res.status}`);
    const json = JSON.parse(await res.text());
    if (json.errors) throw new Error(json.errors.map((e) => e.message || e).join('; '));

    const prices = {};
    for (const raw of json.data?.items || []) prices[raw.id] = normalizePrices(raw);
    const count = Object.keys(prices).length;
    if (!count) throw new Error('tarkov.dev returned no prices.');

    const fetchedAt = Date.now();
    try {
      localStorage.setItem(priceKey(mode), JSON.stringify({ fetchedAt, prices }));
    } catch {
      /* quota — prices still apply for this session, they just won't persist */
    }
    return { ok: true, count, fetchedAt };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function clearPriceOverlay(mode) {
  try { localStorage.removeItem(priceKey(mode)); } catch { /* nothing to do */ }
}
