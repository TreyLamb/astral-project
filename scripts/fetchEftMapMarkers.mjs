// Bakes per-map marker data into src/pages/eftShopping/map/data/markers/<key>.json
//
//   node scripts/fetchEftMapMarkers.mjs              # every calibrated map
//   node scripts/fetchEftMapMarkers.mjs woods customs
//
// Same reliability model as the hideout snapshot: fetch once, commit the JSON,
// runtime never calls anything. A wipe or a marker update means re-running this.
//
// Two requests per map, both public and unauthenticated:
//   - the map page, for the category taxonomy (group/category names, icons,
//     colours) which is inlined as `mapData` and is NOT in the API response.
//   - /api/v1/maps/{id}/data, for the locations themselves.
//
// Five maps are Pro-only and their page is unreachable, so they take a second
// path — see PRO_MAPS below. Terminal is not covered by this script at all:
// mapgenie has a Terminal entry (id 73) but it is `enabled: false` with zero
// locations and no tiles rendered, so there is nothing to fetch.
//
// Coordinates are stored EXACTLY as the source gives them, and no conversion
// is needed: the tile pyramid is standard EPSG:3857 Web Mercator, so the
// lat/lngs drop straight onto it under Leaflet's default CRS. Calibration only
// enters the picture for the alternate tarkov.dev SVG basemap, which lives in
// an unrelated coordinate space.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAP_DIR = path.join(HERE, '..', 'src', 'pages', 'eftShopping', 'map', 'data');
const CONFIG = path.join(MAP_DIR, 'mapConfig.json');
const OUT_DIR = path.join(MAP_DIR, 'markers');
const ASSET_DIR = path.join(MAP_DIR, 'assets');
const SPRITE_JSON = path.join(MAP_DIR, 'markerSprites.json');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const MG_TILE_BASE = 'https://tiles.mapgenie.io';
const ICON_CSS = 'https://mapgenie.io/game-icons/tarkov/icons.css?v=3.4';
const ICON_WOFF = 'https://mapgenie.io/game-icons/tarkov/icons.woff?v=3';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pulling every map back to back trips mapgenie's rate limiter, and it fails in
// two different ways: a bare 429, or a 200 serving the generic landing page with
// no payload in it. The second is the nastier one — without `soft`, that reads
// as "this map has no data" instead of "ask again in a minute".
async function getText(url, { soft = null, tries = 5 } = {}) {
  let wait = 4000;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://mapgenie.io/tarkov' } });
    const body = res.ok ? await res.text() : '';
    if (res.ok && (!soft || soft(body))) return body;
    if (attempt >= tries) {
      throw new Error(res.ok ? `${url} kept returning a throttled page` : `${res.status} ${url}`);
    }
    process.stdout.write(`(throttled, retrying in ${wait / 1000}s) `);
    await sleep(wait);
    wait *= 2;
  }
}

async function getBinary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Referer: 'https://mapgenie.io/tarkov' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// Pulls a top-level `<name> = {...}` / `[...]` literal out of inline page JS by
// bracket matching, since the payload is not wrapped in a parseable script tag.
function inlineLiteral(html, name) {
  const at = html.indexOf(`${name} =`);
  if (at < 0) return null;
  const eq = html.indexOf('=', at);
  let start = -1;
  for (let i = eq + 1; i < html.length; i++) {
    if (html[i] === '{' || html[i] === '[') { start = i; break; }
    if (!/\s/.test(html[i])) return null;
  }
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (!depth) return JSON.parse(html.slice(start, i + 1));
    }
  }
  return null;
}

// The category taxonomy off a map page: which categories exist, what group they
// belong to, and how each one is drawn.
function pageCategories(mapData) {
  const categories = [];
  for (const group of mapData.groups || []) {
    for (const cat of group.categories || []) {
      categories.push({
        id: cat.id,
        title: cat.title,
        group: group.title,
        groupId: group.id,
        icon: cat.icon || null,
        color: cat.color || group.color || null,
        // How the source draws this category, and the reason Location renders
        // as a place name rather than a pin. Seen values: 'marker', 'text',
        // 'text|marker', 'circle', 'features|marker', 'features|text'.
        displayType: cat.display_type || 'marker',
        circle: cat.display_type === 'circle' ? {
          color: cat.circle_color || null,
          strokeColor: cat.circle_stroke_color || null,
          opacity: cat.circle_opacity ?? null,
          radius: cat.circle_radius ?? null,
        } : null,
        premium: !!cat.premium,
        count: cat.locations_count ?? 0,
      });
    }
  }
  return categories;
}

// A free map page: everything comes off it directly.
async function fetchOpenTaxonomy(slug) {
  // A Pro map answers 302 -> /tarkov/upgrade. Checking for that up front is
  // what keeps the retry loop below meaning "throttled" and only "throttled";
  // without it, every Pro map burns the full backoff before giving up.
  const url = `https://mapgenie.io/tarkov/maps/${slug}`;
  const probe = await fetch(url, {
    method: 'HEAD',
    redirect: 'manual',
    headers: { 'User-Agent': UA, Referer: 'https://mapgenie.io/tarkov' },
  });
  if (/\/upgrade/.test(probe.headers.get('location') || '')) throw new Error('pro map');

  const html = await getText(url, {
    soft: (body) => body.includes('mapData ='),
  });
  const mapData = inlineLiteral(html, 'mapData');
  if (!mapData) throw new Error('could not read the inline mapData payload');

  // The tile pyramid is plain, open, unauthenticated Web Mercator — verified by
  // refetching a real tile with no headers at all. Because it is standard
  // EPSG:3857, the marker lat/lngs land on it with no calibration whatsoever;
  // Leaflet's default CRS is already the right projection.
  //
  // The live URL inserts a `/games/` segment that the stored pattern omits, so
  // it is composed here rather than at render time — getting that wrong is what
  // made the tiles look locked in the first place.
  const tileSet = (mapData.mapConfig?.tile_sets || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0] || null;

  return {
    categories: pageCategories(mapData),
    taxonomySource: 'page',
    tiles: tileSet ? {
      url: `${MG_TILE_BASE}/games/${tileSet.pattern}`,
      minZoom: tileSet.min_zoom ?? 8,
      maxZoom: tileSet.max_zoom ?? 16,
      name: tileSet.name || null,
    } : null,
    view: {
      lat: mapData.mapConfig?.start_lat ?? null,
      lng: mapData.mapConfig?.start_lng ?? null,
      zoom: mapData.mapConfig?.initial_zoom ?? null,
    },
    // The marker artwork itself, rather than a stand-in. `MARKER_SPRITE_POSITIONS_V3`
    // is inlined on every map page and keys a sprite-sheet rectangle by category id;
    // the sheet is one open PNG. Drawing a coloured circle instead was the one place
    // this tool was re-inventing something the source already publishes.
    spritePositions: inlineLiteral(html, 'MARKER_SPRITE_POSITIONS_V3') || {},
    spriteUrl: (html.match(/https?:\/\/[^"'\s)]*markers@2x\.png[^"'\s)]*/) || [])[0] || null,
  };
}

// Ground Zero, Icebreaker, Lighthouse, Reserve and Streets are Pro maps, so
// their /tarkov/maps/<slug> page 302s to /tarkov/upgrade and the taxonomy that
// is inlined there is unreachable. Every OTHER piece is still served openly and
// unauthenticated to an anonymous client — the locations API, the map metadata
// endpoint and the tile CDN — so the map is reassembled from those instead:
//
//   category taxonomy  <- the free maps' pages (ids are game-wide)
//   tile pattern       <- probed against the open CDN, since the version suffix
//                         is per map (default-v1 … default-v7) and unguessable
//   initial view       <- /api/v1/maps/{id}
//
// Two categories are used ONLY by Pro maps and so never appear on a free page.
// They are the one thing here that cannot be read from anywhere, so they are
// written down, derived from their own locations' titles and from the unused
// glyphs left over in mapgenie's own icon font.
const PRO_MAPS = new Set(['ground-zero', 'icebreaker', 'lighthouse', 'reserve', 'streets']);

const PRO_ONLY_CATEGORIES = {
  4736: { title: 'Rogue', group: 'Enemies', groupId: 201, icon: 'rogue', color: '9c3443' },
  4738: { title: 'Lightkeeper', group: 'Locations', groupId: 202, icon: 'raid_dealer', color: '453A49' },
};

function tileXY(lat, lng, z) {
  const n = 2 ** z;
  const r = (lat * Math.PI) / 180;
  return [
    Math.floor(((lng + 180) / 360) * n),
    Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n),
  ];
}

// A missing tile answers 403, not 404, so "exists" means exactly 200.
async function tileExists(url) {
  const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA, Referer: 'https://mapgenie.io/tarkov' } });
  return res.status === 200;
}

async function probeTiles(slug, lat, lng, zoom) {
  const z0 = Math.max(9, Math.round(zoom));
  const [x0, y0] = tileXY(lat, lng, z0);

  let hit = null;
  for (const ext of ['jpg', 'png']) {
    for (let v = 1; v <= 20 && !hit; v++) {
      const pattern = `tarkov/${slug}/default-v${v}/{z}/{x}/{y}.${ext}`;
      if (await tileExists(`${MG_TILE_BASE}/games/${pattern.replace('{z}', z0).replace('{x}', x0).replace('{y}', y0)}`)) {
        hit = { pattern, v, ext };
      }
      await sleep(120);
    }
    if (hit) break;
  }
  if (!hit) return null;

  // The pyramid is not a full square, so a single column can have holes. Walk
  // outward from a zoom that is known to exist rather than trusting one probe.
  const zooms = [z0];
  for (let z = z0 - 1; z >= 6; z--) {
    const [x, y] = tileXY(lat, lng, z);
    if (await tileExists(`${MG_TILE_BASE}/games/${hit.pattern.replace('{z}', z).replace('{x}', x).replace('{y}', y)}`)) zooms.push(z);
    await sleep(120);
  }
  for (let z = z0 + 1; z <= 18; z++) {
    const [x, y] = tileXY(lat, lng, z);
    if (await tileExists(`${MG_TILE_BASE}/games/${hit.pattern.replace('{z}', z).replace('{x}', x).replace('{y}', y)}`)) zooms.push(z);
    else break;
    await sleep(120);
  }
  zooms.sort((a, b) => a - b);

  return {
    url: `${MG_TILE_BASE}/games/${hit.pattern}`,
    minZoom: zooms[0],
    maxZoom: zooms[zooms.length - 1],
    name: null,
  };
}

async function fetchProTaxonomy(slug, id, locations, sharedCategories) {
  const meta = JSON.parse(await getText(`https://mapgenie.io/api/v1/maps/${id}`));
  const lat = Number(meta.initial_latitude);
  const lng = Number(meta.initial_longitude);

  const used = [...new Set(locations.map((l) => l.category_id))];
  const counts = new Map();
  for (const l of locations) counts.set(l.category_id, (counts.get(l.category_id) || 0) + 1);

  const categories = [];
  for (const catId of used) {
    const shared = sharedCategories.get(catId);
    const fallback = PRO_ONLY_CATEGORIES[catId];
    if (!shared && !fallback) continue;
    categories.push({
      ...(shared || { id: catId, displayType: 'marker', circle: null, premium: false, ...fallback }),
      id: catId,
      count: counts.get(catId) || 0,
    });
  }

  return {
    categories,
    taxonomySource: 'derived',
    tiles: await probeTiles(slug, lat, lng, meta.initial_zoom),
    view: { lat, lng, zoom: meta.initial_zoom ?? null },
    spritePositions: {},
    spriteUrl: null,
  };
}

async function fetchMap(map, sharedCategories) {
  const { slug, id } = map.mapgenie;
  const api = JSON.parse(await getText(`https://mapgenie.io/api/v1/maps/${id}/data`));
  const locations = api.locations || [];

  let taxonomy;
  try {
    taxonomy = await fetchOpenTaxonomy(slug);
  } catch (err) {
    if (!/pro map|kept returning a throttled page|inline mapData/.test(err.message)) throw err;
    process.stdout.write('(Pro map, rebuilding from the open endpoints) ');
    taxonomy = await fetchProTaxonomy(slug, id, locations, sharedCategories);
  }

  const { categories, taxonomySource, tiles, view, spritePositions, spriteUrl } = taxonomy;
  if (!tiles) throw new Error('no tile pyramid found');

  const known = new Set(categories.map((c) => c.id));
  const markers = locations
    .filter((l) => Number.isFinite(Number(l.latitude)) && Number.isFinite(Number(l.longitude)))
    .map((l) => ({
      id: l.id,
      cat: l.category_id,
      title: l.title || '',
      // Descriptions are the genuinely useful part ("Behind the sand bags") and
      // are what a bare coordinate dump would lose.
      desc: l.description || '',
      lat: Number(l.latitude),
      lng: Number(l.longitude),
    }));

  // A marker whose category is missing from the taxonomy would silently vanish
  // behind every filter, so surface it rather than dropping it.
  const orphans = [...new Set(markers.filter((m) => !known.has(m.cat)).map((m) => m.cat))];

  return {
    key: map.key,
    source: 'mapgenie',
    sourceMapId: id,
    fetchedAt: new Date().toISOString(),
    // The source's own coordinate extent. Mapping this rectangle onto the
    // SVG's bounds gives a usable first-guess projection, which the in-app
    // calibration tool then refines against real landmarks.
    sourceBounds: api.styles?.mapStyle?.bounds || null,
    tiles,
    view,
    // Movement speeds let the route manifest report time, not just distance.
    speeds: api.distanceToolConfig?.speeds || [],
    // Projected metres per in-game metre, from the source's own distance tool.
    distanceScale: api.distanceToolConfig?.scale ?? null,
    useHaversine: api.distanceToolConfig?.useHaversine ?? false,
    presets: (api.presets || []).map((p) => ({ id: p.id, title: p.title, categories: p.categories })),
    // 'page' = read off the map's own page; 'derived' = a Pro map reassembled
    // from the open endpoints, so the category names came from the free maps.
    taxonomySource,
    categories,
    markers,
    orphanCategories: orphans,
    spritePositions,
    spriteUrl,
  };
}

/**
 * Sprite sheet + icon font, both shared across every map because mapgenie's
 * category ids are game-wide. Written once per run rather than per map.
 *
 * The font is what their own sidebar uses, so the filter list ends up showing
 * the same glyph next to "Ammo Box" that their site does.
 */
async function writeSharedAssets(positions, spriteUrl) {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  const written = [];

  // A run of Pro maps alone never sees a sprite URL, because that only appears
  // on a map page. Falling back to null there would blank out the sheet size
  // the renderer measures against and hide every marker.
  const prior = fs.existsSync(SPRITE_JSON) ? JSON.parse(fs.readFileSync(SPRITE_JSON, 'utf8')) : {};
  let sheetWidth = prior.sheetWidth ?? null;
  let sheetHeight = prior.sheetHeight ?? null;
  if (spriteUrl) {
    const png = await getBinary(spriteUrl);
    fs.writeFileSync(path.join(ASSET_DIR, 'markers.png'), png);
    // IHDR is always the first chunk, so the dimensions sit at a fixed offset.
    sheetWidth = png.readUInt32BE(16);
    sheetHeight = png.readUInt32BE(20);
    written.push(`markers.png ${sheetWidth}x${sheetHeight}, ${(png.length / 1024).toFixed(0)} KB`);
  }

  let glyphs = {};
  try {
    const css = await getText(ICON_CSS);
    // .icon-ammo_box:before { content: "\e900"; ... }
    for (const m of css.matchAll(/\.icon-([a-z0-9_]+):before\s*\{\s*content:\s*"\\([0-9a-f]+)"/gi)) {
      glyphs[m[1]] = m[2];
    }
    const woff = await getBinary(ICON_WOFF);
    fs.writeFileSync(path.join(ASSET_DIR, 'icons.woff'), woff);
    written.push(`icons.woff ${(woff.length / 1024).toFixed(0)} KB, ${Object.keys(glyphs).length} glyphs`);
  } catch (err) {
    console.warn(`  icon font skipped — ${err.message}`);
    glyphs = {};
  }

  const sizes = new Set(Object.values(positions).map((p) => `${p.width}x${p.height}@${p.pixelRatio}`));
  fs.writeFileSync(SPRITE_JSON, JSON.stringify({
    source: 'mapgenie',
    fetchedAt: new Date().toISOString(),
    sheet: 'assets/markers.png',
    sheetWidth,
    sheetHeight,
    // Every cell is the same size in practice, but the sheet is addressed
    // per-entry so a future re-fetch with mixed sizes still renders.
    cellSizes: [...sizes],
    positions,
    glyphs,
  }));
  written.push(`markerSprites.json ${Object.keys(positions).length} positions`);
  console.log(`  assets: ${written.join(' · ')}`);
}

async function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  const wanted = process.argv.slice(2);
  const targets = config.maps
    .filter((m) => m.mapgenie.id && (wanted.length ? wanted.includes(m.key) : true))
    // Pro maps borrow their category names from the free ones, so on a clean
    // checkout the free maps have to be fetched first. Only an ordering hint —
    // being wrong about which is which costs nothing.
    .sort((a, b) => Number(PRO_MAPS.has(a.mapgenie.slug)) - Number(PRO_MAPS.has(b.mapgenie.slug)));

  if (!targets.length) {
    console.error('No matching maps with a mapgenie id. Known keys:');
    console.error('  ' + config.maps.map((m) => m.key).join(', '));
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let failures = 0;

  // Merged across maps: any one page only inlines the categories it uses, so a
  // partial run would otherwise shrink the shared sheet.
  const existing = fs.existsSync(SPRITE_JSON)
    ? JSON.parse(fs.readFileSync(SPRITE_JSON, 'utf8')).positions || {}
    : {};
  const allPositions = { ...existing };
  let spriteUrl = null;

  // Category ids are game-wide, so a Pro map whose own page is unreachable can
  // still be named from the free maps'. Seeded from what is already committed
  // so that re-running a single Pro map on its own still works, then topped up
  // as this run goes.
  const sharedCategories = new Map();
  for (const file of fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR) : []) {
    if (!file.endsWith('.json')) continue;
    const prev = JSON.parse(fs.readFileSync(path.join(OUT_DIR, file), 'utf8'));
    if (prev.taxonomySource === 'derived') continue;
    for (const cat of prev.categories || []) sharedCategories.set(cat.id, cat);
  }

  for (const [i, map] of targets.entries()) {
    if (i) await sleep(3000);
    process.stdout.write(`→ ${map.key} … `);
    try {
      const { spritePositions, spriteUrl: url, ...data } = await fetchMap(map, sharedCategories);
      if (data.taxonomySource === 'page') {
        for (const cat of data.categories) sharedCategories.set(cat.id, cat);
      }
      Object.assign(allPositions, spritePositions);
      spriteUrl = spriteUrl || url;
      const file = path.join(OUT_DIR, `${map.key}.json`);
      fs.writeFileSync(file, JSON.stringify(data));
      const kb = (fs.statSync(file).size / 1024).toFixed(0);
      console.log(
        `${data.markers.length} markers, ${data.categories.length} categories (${kb} KB)`
        + (data.orphanCategories.length ? `  ! orphan categories: ${data.orphanCategories.join(', ')}` : ''),
      );
    } catch (err) {
      failures += 1;
      console.log(`FAILED — ${err.message}`);
    }
  }

  if (Object.keys(allPositions).length) {
    try {
      await writeSharedAssets(allPositions, spriteUrl);
    } catch (err) {
      console.warn(`  shared assets FAILED — ${err.message}`);
      failures += 1;
    }
  }

  console.log(failures ? `\n${failures} map(s) failed.` : '\nAll requested maps written.');
  process.exitCode = failures ? 1 : 0;
}

main().catch((err) => { console.error(err); process.exit(1); });
